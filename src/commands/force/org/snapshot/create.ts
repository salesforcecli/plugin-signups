/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import { flags, SfdxCommand, FlagsConfig } from '@salesforce/command';
import { GlobalInfo, Messages } from '@salesforce/core';
import { OrgSnapshot, queryByNameOrId, printSingleRecordTable } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.create');

export class SnapshotGet extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);
  public static readonly requiresDevhubUsername = true;

  public static readonly flagsConfig: FlagsConfig = {
    sourceorg: flags.string({
      char: 'o',
      description: messages.getMessage('flags.sourceorg'),
      longDescription: messages.getMessage('flagsLong.sourceorg'),
      required: true,
    }),
    snapshotname: flags.string({
      char: 'n',
      description: messages.getMessage('flags.snapshotname'),
      longDescription: messages.getMessage('flagsLong.snapshotname'),
      required: true,
    }),
    description: flags.string({
      char: 'd',
      description: messages.getMessage('flags.description'),
      longDescription: messages.getMessage('flagsLong.description'),
    }),
  };

  public async run(): Promise<OrgSnapshot> {
    // sourceorg might be a username or alias, but we need an orgId
    let sourceOrgId = this.flags.sourceorg as string;

    if (!sourceOrgId.startsWith('00D')) {
      const globalInfo = await GlobalInfo.create();
      const username = globalInfo.aliases.getValue(sourceOrgId) ?? sourceOrgId;
      sourceOrgId = globalInfo.orgs.get(username)?.orgId;
    }

    const createResponse = await this.hubOrg
      .getConnection()
      .sobject('OrgSnapshot')
      .create({
        SourceOrg: sourceOrgId,
        Description: this.flags.description as string,
        SnapshotName: this.flags.snapshotname as string,
        Content: 'metadatadata',
      });
    const result = await queryByNameOrId(this.hubOrg.getConnection(), createResponse.id);
    if (!this.flags.json) {
      printSingleRecordTable(result);
    }
    return result;
  }
}
