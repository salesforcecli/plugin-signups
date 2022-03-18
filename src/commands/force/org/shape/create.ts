/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

// This is the legacy converted command file. Ignoring code-coverage since this is generated.
// THIS SHOULD BE REMOVED WHEN CONVERTED TO EXTEND SfdxCommand
/* istanbul ignore file */

import { EOL } from 'os';
import { SfdxCommand } from '@salesforce/command';
import { SfdxError, Messages } from '@salesforce/core';
import { RecordResult } from 'jsforce';
import { ShapeRepresentationApi } from '../../../../shared/shapeRepApi';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

const commandTimeOutInMS = 30e3;

export interface ShapeCreateResult {
  shapeId: string;
  shapeFile: string;
  success: boolean;
  errors: [];
}

export class OrgShapeCreateCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('create_shape_command_description');
  public static readonly examples = messages.getMessage('create_shape_command_help').split(EOL);
  public static readonly requiresUsername = true;
  public static readonly varargs = true;

  public async run(): Promise<ShapeCreateResult> {
    const api = new ShapeRepresentationApi(this.org);
    if (!(await api.isFeatureEnabled())) {
      throw new SfdxError(messages.getMessage('create_shape_command_no_access', [this.org.getUsername()]), 'noAccess');
    }

    let timeoutID;

    const timeout = new Promise((_, reject) => {
      timeoutID = setTimeout(() => {
        reject(messages.getMessage('shapeCreateFailedMessage'));
      }, commandTimeOutInMS);
    });
    const createShapeResponse = (await Promise.race([api.create(), timeout])) as RecordResult;
    clearTimeout(timeoutID);

    if (createShapeResponse['success'] !== true) {
      this.logger.error('Shape create failed', createShapeResponse['errors']);
      throw Promise.reject(new SfdxError(messages.getMessage('shape_create_failed_message')));
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
}
