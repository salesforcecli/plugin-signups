/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, Connection, Logger } from '@salesforce/core';
import type { SaveResult } from 'jsforce';
import { isShapeEnabled, JsForceError } from '../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

export interface ShapeCreateResult {
  shapeId: string;
  success: boolean;
  errors: [];
}

export class OrgShapeCreateCommand extends SfCommand<ShapeCreateResult> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:shape:create'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<ShapeCreateResult> {
    const { flags } = await this.parse(OrgShapeCreateCommand);
    const conn = flags['target-org'].getConnection(flags['api-version']);

    if (!(await isShapeEnabled(conn))) {
      throw messages.createError('ShapeRepresentationNoAccess', [flags['target-org'].getUsername()]);
    }

    const createShapeResponse = await createShapeOrg(conn);

    if (createShapeResponse.success !== true) {
      (await Logger.child('OrgShapeCreateCommand')).error('Shape create failed', createShapeResponse['errors']);
      throw messages.createError('ShapeCreateFailed');
    }
    const output: ShapeCreateResult = {
      shapeId: createShapeResponse.id,
      success: true,
      errors: [],
    };

    this.logSuccess(messages.getMessage('success', [output.shapeId]));
    return output;
  }
}

const createShapeOrg = async (conn: Connection): Promise<SaveResult> => {
  try {
    return await conn.sobject('ShapeRepresentation').create({
      Description: '',
    });
  } catch (err) {
    const JsForceErr = err as JsForceError;
    if (JsForceErr.errorCode && JsForceErr.errorCode === 'NOT_FOUND' && JsForceErr['name'] === 'ACCESS_DENIED') {
      throw messages.createError('NoCrudAccessCreateShape');
    } else {
      throw JsForceErr;
    }
  }
};
