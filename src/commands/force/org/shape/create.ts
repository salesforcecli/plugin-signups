/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { SfdxCommand } from '@salesforce/command';
import { SfdxError, Messages, Connection } from '@salesforce/core';
import { RecordResult } from 'jsforce';
import { isShapeEnabled } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

const commandTimeOutInMS = 30e3;

export interface ShapeCreateResult {
  shapeId: string;
  shapeFile: string;
  success: boolean;
  errors: [];
}

interface JsForceError extends Error {
  errorCode: string;
  fields: string[];
}

export class OrgShapeCreateCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('create_shape_command_description');
  public static readonly examples = messages.getMessage('create_shape_command_help').split(EOL);
  public static readonly requiresUsername = true;
  public static readonly varargs = true;
  private conn: Connection;

  public async run(): Promise<ShapeCreateResult> {
    this.conn = this.org.getConnection();

    if (!(await isShapeEnabled(this.conn))) {
      throw SfdxError.create('@salesforce/plugin-signups', 'shape.create', 'create_shape_command_no_access');
    }

    let timeoutID;

    const timeout = new Promise((_, reject) => {
      timeoutID = setTimeout(() => {
        reject(messages.getMessage('shapeCreateFailedMessage'));
      }, commandTimeOutInMS);
    });
    const createShapeResponse = (await Promise.race([this.createShapeOrg(), timeout])) as RecordResult;
    clearTimeout(timeoutID);

    if (createShapeResponse['success'] !== true) {
      this.logger.error('Shape create failed', createShapeResponse['errors']);
      throw SfdxError.create('@salesforce/plugin-signups', 'shape.create', 'shape_create_failed_message');
    }
    const output: ShapeCreateResult = {
      shapeId: createShapeResponse.id,
      shapeFile: undefined,
      success: true,
      errors: [],
    };
    // this doesn't seem to be used anymore;
    if (typeof output.shapeFile != 'undefined' && output.shapeFile) {
      this.ux.log(messages.getMessage('create_shape_command_success_file', [output.shapeFile]));
    } else {
      this.ux.log(messages.getMessage('create_shape_command_success_id', [output.shapeId]));
    }
    return output;
  }

  private createShapeOrg(): Promise<RecordResult> {
    try {
      return this.conn.sobject('ShapeRepresentation').create({
        Description: '',
      });
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'NOT_FOUND' && JsForceErr['name'] === 'ACCESS_DENIED') {
        throw SfdxError.wrap(messages.getMessage('create_shape_command_no_crud_access'));
      } else {
        throw JsForceErr;
      }
    }
  }
}