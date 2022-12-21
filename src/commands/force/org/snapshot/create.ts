/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import {
  Flags,
  SfCommand,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { StateAggregator, Messages } from '@salesforce/core';
import { OrgSnapshot, queryByNameOrId, printSingleRecordTable } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.create');

export class SnapshotGet extends SfCommand<OrgSnapshot> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);

  public static readonly flags = {
    'target-dev-hub': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'source-org': Flags.string({
      // command doesn't use target-org, so dash-o is fine
      // eslint-disable-next-line sf-plugin/dash-o
      char: 'o',
      summary: messages.getMessage('flags.sourceorg'),
      description: messages.getMessage('flagsLong.sourceorg'),
      required: true,
      aliases: ['sourceorg'],
      deprecateAliases: true,
      parse: async (input) => (input.startsWith('00D') ? input : resolveSourceOrgId(input)),
    }),
    name: Flags.string({
      char: 'n',
      summary: messages.getMessage('flags.snapshotname'),
      description: messages.getMessage('flagsLong.snapshotname'),
      required: true,
      aliases: ['snapshotname'],
      deprecateAliases: true,
    }),
    description: Flags.string({
      char: 'd',
      summary: messages.getMessage('flags.description'),
      description: messages.getMessage('flagsLong.description'),
    }),
  };

  public async run(): Promise<OrgSnapshot> {
    // sourceorg might be a username or alias, but we need an orgId
    const { flags } = await this.parse(SnapshotGet);

    const conn = flags['target-dev-hub'].getConnection(flags['api-version']);
    const createResponse = await conn.sobject('OrgSnapshot').create({
      SourceOrg: flags['source-org'],
      Description: flags.description,
      SnapshotName: flags.name,
      Content: 'metadatadata',
    });
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
  return (await stateAggregator.orgs.read(username))?.orgId;
};
