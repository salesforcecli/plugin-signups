/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import { SfdxCommand } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { OrgSnapshot, queryAll, printRecordTable } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.get');

export class SnapshotGet extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);
  public static readonly requiresDevhubUsername = true;

  public async run(): Promise<OrgSnapshot[]> {
    const results = await queryAll(this.hubOrg.getConnection());
    if (!this.flags.json) {
      printRecordTable(results);
    }
    return results;
  }
}
