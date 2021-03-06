/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { SfdxCommand } from '@salesforce/command';
import { Messages, Connection } from '@salesforce/core';
import { SaveResult } from 'jsforce';
import { isShapeEnabled, JsForceError } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

export interface ShapeCreateResult {
  shapeId: string;
  success: boolean;
  errors: [];
}

export class OrgShapeCreateCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('create_shape_command_description');
  public static readonly examples = messages.getMessage('create_shape_command_help').split(EOL);
  public static readonly requiresUsername = true;
  private conn: Connection;

  public async run(): Promise<ShapeCreateResult> {
    this.conn = this.org.getConnection();

    if (!(await isShapeEnabled(this.conn))) {
      const err = messages.createError('noAccess', [this.org.getUsername()]);
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore override readonly .name field
      err.name = 'noAccess';
      throw err;
    }

    const createShapeResponse = await this.createShapeOrg();

    if (createShapeResponse.success !== true) {
      this.logger.error('Shape create failed', createShapeResponse['errors']);
      const err = messages.createError('shape_create_failed_message');
      // eslint-disable-next-line @typescript-eslint/ban-ts-comment
      // @ts-ignore override readonly .name field
      err.name = 'shape_create_failed_message';
      throw err;
    }
    const output: ShapeCreateResult = {
      shapeId: createShapeResponse.id,
      success: true,
      errors: [],
    };

    this.ux.log(messages.getMessage('create_shape_command_success_id', [output.shapeId]));
    return output;
  }

  private createShapeOrg(): Promise<SaveResult> {
    try {
      return this.conn.sobject('ShapeRepresentation').create({
        Description: '',
      });
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'NOT_FOUND' && JsForceErr['name'] === 'ACCESS_DENIED') {
        const e = messages.createError('create_shape_command_no_crud_access');
        // eslint-disable-next-line @typescript-eslint/ban-ts-comment
        // @ts-ignore override readonly .name field
        e.name = 'create_shape_command_no_crud_access';
        throw e;
      } else {
        throw JsForceErr;
      }
    }
  }
}
