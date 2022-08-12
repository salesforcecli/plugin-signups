/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import { flags, SfdxCommand, FlagsConfig } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { OrgSnapshot, queryByNameOrId, printSingleRecordTable } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.get');

export class SnapshotGet extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);
  public static readonly requiresDevhubUsername = true;

  public static readonly flagsConfig: FlagsConfig = {
    snapshot: flags.string({
      char: 's',
      description: messages.getMessage('flags.snapshot'),
      longDescription: messages.getMessage('flagsLong.snapshot'),
      required: true,
    }),
  };

  public async run(): Promise<OrgSnapshot> {
    const result = await queryByNameOrId(this.hubOrg.getConnection(), this.flags.snapshot as string);
    if (!this.flags.json) {
      printSingleRecordTable(result);
    }
    return result;
  }
}
