/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
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

type FailureMsg = {
  shapeId: string;
  message: string;
};

type DeleteAllResult = {
  shapeIds: string[];
  failures: FailureMsg[];
};

export interface OrgShapeDeleteResult extends DeleteAllResult {
  orgId: string;
}

export class OrgShapeDeleteCommand extends SfCommand<OrgShapeDeleteResult> {
  public static readonly summary = messages.getMessage('description');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('help').split(EOL);

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'no-prompt': Flags.boolean({
      char: 'p',
      summary: messages.getMessage('noPrompt'),
      aliases: ['noprompt'],
      deprecateAliases: true,
    }),
  };
  private conn: Connection;

  public async run(): Promise<OrgShapeDeleteResult> {
    const { flags } = await this.parse(OrgShapeDeleteCommand);
    const username = flags['target-org'].getUsername();
    const orgId = flags['target-org'].getOrgId();
    if (!flags.noprompt) {
      if (!(await this.confirm(messages.getMessage('deleteCommandYesNo', [username])))) {
        return;
      }
    }

    this.conn = flags['target-org'].getConnection(flags['api-version']);

    if (!(await isShapeEnabled(this.conn))) {
      const err = messages.createError('noAccess', [username]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore override readonly .name field
      err.name = 'noAccess';
      throw err;
    }

    const deleteRes = await this.deleteAll(username);

    if (deleteRes.shapeIds.length === 0) {
      this.log(messages.getMessage('noShapesHumanSuccess', [orgId]));
      return;
    }

    if (deleteRes.failures.length > 0 && deleteRes.shapeIds.length > 0) {
      setExitCode(68);

      this.styledHeader('Partial Success');
      this.log(messages.getMessage('humanSuccess', [orgId]));
      this.log('');
      this.styledHeader('Failures');
      const columns = {
        shapeId: { header: 'Shape ID' },
        message: { header: 'Error Message' },
      };
      this.table(deleteRes.failures, columns);
    } else if (deleteRes.failures.length > 0) {
      setExitCode(1);
    } else if (deleteRes.shapeIds.length > 0) {
      setExitCode(0);
      this.log(messages.getMessage('humanSuccess', [orgId]));
    }

    return {
      orgId,
      shapeIds: deleteRes.shapeIds,
      failures: deleteRes.failures,
    };
  }

  /**
   * Delete all ShapeRepresentation records for the shapeOrg.
   *
   * @return List of SR IDs that were deleted
   */
  private async deleteAll(username: string): Promise<DeleteAllResult> {
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
        const e = messages.createError('noAccess', [username]);
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

const setExitCode = (code: number): void => {
  process.exitCode = code;
};
