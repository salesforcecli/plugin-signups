/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { SfdxError, Messages, Connection } from '@salesforce/core';
import { RecordResult } from 'jsforce';
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

export interface OrgShapeDeleteResult {
  orgId: string;
  shapeIds: string[];
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
      throw new SfdxError(messages.getMessage('noAccess', [this.org.getUsername()]));
    }
    const deletedShapesIds = await this.deleteAll();
    if (deletedShapesIds.length === 0) {
      this.ux.log(messages.getMessage('noShapesHumanSuccess', [this.org.getOrgId()]));
    }
    this.ux.log(messages.getMessage('humanSuccess', [this.org.getOrgId()]));
    return {
      orgId: this.org.getOrgId(),
      shapeIds: deletedShapesIds,
    };
  }

  /**
   * Delete all ShapeRepresentation records for the shapeOrg.
   *
   * @return List of SR IDs that were deleted
   */
  private async deleteAll(): Promise<string[]> {
    let shapeIds = [];
    try {
      const result = await this.conn.query<ShapeRepresentation>('SELECT Id FROM ShapeRepresentation');
      shapeIds = result.records.map((shape) => shape.Id);
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'INVALID_TYPE') {
        // ShapeExportPref is not enabled, or user does not have CRUD access
        throw SfdxError.wrap(messages.getMessage('delete_shape_command_no_access', shapeIds));
      }
      // non-access error
      throw JsForceErr;
    }

    return Promise.all(
      shapeIds.map(async (id) => {
        try {
          const delResult: RecordResult = await this.conn.sobject('ShapeRepresentation').delete(id);
          if (delResult.success) {
            return delResult.id;
          }
        } catch (err) {
          return Promise.reject(err);
        }
      })
    );
  }
}
