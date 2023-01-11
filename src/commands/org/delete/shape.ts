/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, Connection } from '@salesforce/core';
import { isShapeEnabled, JsForceError } from '../../../shared/orgShapeListUtils';

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
  public static readonly description = messages.getMessage('longDescription');
  public static readonly examples = messages.getMessages('help');
  public static readonly aliases = ['force:org:shape:delete'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'no-prompt': Flags.boolean({
      char: 'p',
      summary: messages.getMessage('noPrompt'),
      description: messages.getMessage('noPromptLong'),
      aliases: ['noprompt'],
      deprecateAliases: true,
    }),
  };

  public async run(): Promise<OrgShapeDeleteResult> {
    const { flags } = await this.parse(OrgShapeDeleteCommand);
    const username = flags['target-org'].getUsername();
    const orgId = flags['target-org'].getOrgId();
    if (!flags['no-prompt']) {
      if (!(await this.confirm(messages.getMessage('deleteCommandYesNo', [username])))) {
        return;
      }
    }

    const conn = flags['target-org'].getConnection(flags['api-version']);

    if (!(await isShapeEnabled(conn))) {
      throw messages.createError('noAccess', [username]);
    }

    const deleteRes = await deleteAll(conn, username);

    if (deleteRes.shapeIds.length === 0) {
      this.info(messages.getMessage('noShapesHumanSuccess', [orgId]));
      return;
    }

    if (deleteRes.failures.length > 0) {
      setExitCode(68);

      this.styledHeader('Partial Success');
      this.logSuccess(messages.getMessage('humanSuccess', [orgId]));
      this.log('');
      this.styledHeader('Failures');
      const columns = {
        shapeId: { header: 'Shape ID' },
        message: { header: 'Error Message' },
      };
      this.table(deleteRes.failures, columns);
    } else if (deleteRes.failures.length === deleteRes.shapeIds.length) {
      setExitCode(1);
    } else {
      setExitCode(0);
      this.logSuccess(messages.getMessage('humanSuccess', [orgId]));
    }

    return {
      orgId,
      shapeIds: deleteRes.shapeIds,
      failures: deleteRes.failures,
    };
  }
}

/**
 * Delete all ShapeRepresentation records for the shapeOrg.
 *
 * @return List of SR IDs that were deleted
 */
export const deleteAll = async (conn: Connection, username: string): Promise<DeleteAllResult> => {
  let shapeIds: string[] = [];
  const deleteAllResult = {
    shapeIds: [],
    failures: [],
  };
  try {
    const result = await conn.query<ShapeRepresentation>('SELECT Id FROM ShapeRepresentation');
    if (result.totalSize === 0) {
      return deleteAllResult;
    }
    shapeIds = result.records.map((shape) => shape.Id);
  } catch (err) {
    const JsForceErr = err as JsForceError;
    if (JsForceErr.errorCode && JsForceErr.errorCode === 'INVALID_TYPE') {
      // ShapeExportPref is not enabled, or user does not have CRUD access
      throw messages.createError('noAccess', [username]);
    }
    // non-access error
    throw JsForceErr;
  }

  await Promise.all(
    shapeIds.map(async (id) => {
      try {
        const delResult = await conn.sobject('ShapeRepresentation').delete(id);
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
};
const setExitCode = (code: number): void => {
  process.exitCode = code;
};
