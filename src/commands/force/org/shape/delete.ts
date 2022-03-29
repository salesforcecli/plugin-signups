/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages, Connection } from '@salesforce/core';
import { isShapeEnabled, JsForceError } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.delete');

interface ShapeRepresentation {
  Id: string;
  Status: string;
  Edition: string;
  Features: string;
  Settings: string;
  CreatedDate: string;
  Description: string;
}

interface FailureMsg {
  shapeId: string;
  message: string;
}

interface DeleteAllResult {
  shapeIds: string[];
  failures: FailureMsg[];
}

export interface OrgShapeDeleteResult extends DeleteAllResult {
  orgId: string;
}

export class OrgShapeDeleteCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('help').split(EOL);
  public static readonly requiresUsername = true;
  public static readonly flagsConfig: FlagsConfig = {
    noprompt: flags.boolean({
      char: 'p',
      description: messages.getMessage('noPrompt'),
    }),
  };
  private conn: Connection;

  public async run(): Promise<OrgShapeDeleteResult> {
    if (!this.flags.noprompt) {
      if (!(await this.ux.confirm(messages.getMessage('deleteCommandYesNo', [this.org.getUsername()])))) {
        return;
      }
    }

    this.conn = this.org.getConnection();

    if (!(await isShapeEnabled(this.conn))) {
      const err = messages.createError('noAccess', [this.org.getUsername()]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore override readonly .name field
      err.name = 'noAccess';
      throw err;
    }

    const deleteRes = await this.deleteAll();

    if (deleteRes.shapeIds.length === 0) {
      this.ux.log(messages.getMessage('noShapesHumanSuccess', [this.org.getOrgId()]));
      return;
    }

    if (deleteRes.failures.length > 0 && deleteRes.shapeIds.length > 0) {
      this.setExitCode(68);

      this.ux.styledHeader('Partial Success');
      this.ux.log(messages.getMessage('humanSuccess', [this.org.getOrgId()]));
      this.ux.log('');
      this.ux.styledHeader('Failures');
      const columns = {
        shapeId: { header: 'Shape ID' },
        message: { header: 'Error Message' },
      };
      this.ux.table(deleteRes.failures, columns);
    } else if (deleteRes.failures.length > 0) {
      this.setExitCode(1);
    } else if (deleteRes.shapeIds.length > 0) {
      this.setExitCode(0);
      this.ux.log(messages.getMessage('humanSuccess', [this.org.getOrgId()]));
    }

    return {
      orgId: this.org.getOrgId(),
      shapeIds: deleteRes.shapeIds,
      failures: deleteRes.failures,
    };
  }

  protected setExitCode(code: number): void {
    process.exitCode = code;
  }

  /**
   * Delete all ShapeRepresentation records for the shapeOrg.
   *
   * @return List of SR IDs that were deleted
   */
  private async deleteAll(): Promise<DeleteAllResult> {
    const deleteAllResult = {
      shapeIds: [],
      failures: [],
    };

    let shapeIds: string[] = [];

    try {
      const result = await this.conn.query<ShapeRepresentation>('SELECT Id FROM ShapeRepresentation');
      if (result.totalSize === 0) {
        return deleteAllResult;
      }
      shapeIds = result.records.map((shape) => shape.Id);
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'INVALID_TYPE') {
        // ShapeExportPref is not enabled, or user does not have CRUD access
        const e = messages.createError('noAccess', [this.org.getUsername()]);
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore override readonly .name field
        e.name = 'noAccess';
        throw e;
      }
      // non-access error
      throw JsForceErr;
    }

    await Promise.allSettled(
      shapeIds.map(async (id) => {
        try {
          const delResult = await this.conn.sobject('ShapeRepresentation').delete(id);
          if (delResult.success) {
            deleteAllResult.shapeIds.push(id);
          }
        } catch (err) {
          deleteAllResult.failures.push({
            shapeId: id,
            message: err instanceof Error ? err.message : 'error contained no message',
          });
        }
      })
    );

    return deleteAllResult;
  }
}
