/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

import {
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, Connection, Logger } from '@salesforce/core';
import type { SaveResult } from '@jsforce/jsforce-node';
import { isShapeEnabled, JsForceError } from '../../../shared/orgShapeListUtils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

export type ShapeCreateResult = {
  shapeId: string;
  success: boolean;
  errors: [];
};

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
