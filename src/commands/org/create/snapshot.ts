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
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { StateAggregator, Messages, SfError } from '@salesforce/core';
import {
  OrgSnapshot,
  queryByNameOrId,
  printSingleRecordTable,
  invalidTypeErrorHandler,
} from '../../../shared/snapshot.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.create');
const snapshotMessages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot');

export class SnapshotCreate extends SfCommand<OrgSnapshot> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:snapshot:create'];
  public static readonly deprecateAliases = true;
  public static readonly flags = {
    'target-dev-hub': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'source-org': Flags.string({
      // command doesn't use target-org, so dash-o is fine
      // eslint-disable-next-line sf-plugin/dash-o
      char: 'o',
      summary: messages.getMessage('flags.source-org.summary'),
      required: true,
      aliases: ['sourceorg'],
      deprecateAliases: true,
      parse: async (input) => (input.startsWith('00D') ? input : resolveSourceOrgId(input)),
    }),
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.name.summary'),
      required: true,
      aliases: ['snapshotname'],
      deprecateAliases: true,
    }),
    description: Flags.string({
      char: 'd',
      summary: messages.getMessage('flags.description.summary'),
      description: messages.getMessage('flags.description.description'),
    }),
  };

  public async run(): Promise<OrgSnapshot> {
    const { flags } = await this.parse(SnapshotCreate);

    const conn = flags['target-dev-hub'].getConnection(flags['api-version']);
    const createResponse = await conn
      .sobject('OrgSnapshot')
      .create({
        SourceOrg: flags['source-org'],
        Description: flags.description,
        SnapshotName: flags.name,
        Content: 'metadatadata',
      })
      .catch((error: Error) => {
        // dev hub does not have snapshot pref enabled
        if (error.name === 'NOT_FOUND') {
          error.message = snapshotMessages.getMessage('snapshotNotEnabled');
          return invalidTypeErrorHandler(error);
        } else {
          throw error;
        }
      });

    if (createResponse.success === false) {
      throw new SfError('An error while created the org snapshot');
    }
    const result = await queryByNameOrId(conn, createResponse.id);
    if (!flags.json) {
      printSingleRecordTable(result);
    }
    return result;
  }
}

const resolveSourceOrgId = async (sourceOrgUsernameOrId: string): Promise<string> => {
  const stateAggregator = await StateAggregator.create();
  const username = stateAggregator.aliases.getValue(sourceOrgUsernameOrId) ?? sourceOrgUsernameOrId;
  const org = await stateAggregator.orgs.read(username);
  if (!org?.orgId) {
    throw new Error(`No org found for ${sourceOrgUsernameOrId}`);
  }
  return org.orgId;
};
