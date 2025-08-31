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
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { isShapeEnabled } from '../../../shared/orgShapeListUtils.js';
import utils, { DeleteAllResult } from '../../../shared/deleteUtils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.delete');

export type OrgShapeDeleteResult = {
  orgId: string;
} & DeleteAllResult;

export class OrgShapeDeleteCommand extends SfCommand<OrgShapeDeleteResult | undefined> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:shape:delete'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'no-prompt': Flags.boolean({
      char: 'p',
      summary: messages.getMessage('flags.no-prompt.summary'),
      aliases: ['noprompt'],
      deprecateAliases: true,
    }),
  };

  public async run(): Promise<OrgShapeDeleteResult | undefined> {
    const { flags } = await this.parse(OrgShapeDeleteCommand);
    const username = flags['target-org'].getUsername();
    if (!username) throw new SfError('No username found for target-org');
    const orgId = flags['target-org'].getOrgId();
    if (!flags['no-prompt']) {
      if (!(await this.confirm({ message: messages.getMessage('deleteCommandYesNo', [username]) }))) {
        return;
      }
    }

    const conn = flags['target-org'].getConnection(flags['api-version']);

    if (!(await isShapeEnabled(conn))) {
      throw messages.createError('noAccess', [username]);
    }

    const deleteRes = await utils.deleteAll(conn, username);

    if (deleteRes.shapeIds.length === 0) {
      this.info(messages.getMessage('noShapesHumanSuccess', [orgId]));
      return;
    }

    if (deleteRes.failures.length > 0) {
      setExitCode(68);

      this.logSuccess(messages.getMessage('humanSuccess', [orgId]));
      this.log('');
      this.table({
        data: deleteRes.failures,
        columns: [
          { key: 'shapeId', name: 'Shape ID' },
          { key: 'message', name: 'Error Message' },
        ],
        title: 'Failures',
      });
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

const setExitCode = (code: number): void => {
  process.exitCode = code;
};
