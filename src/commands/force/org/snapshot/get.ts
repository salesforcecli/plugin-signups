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
  requiredHubFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { OrgSnapshot, queryByNameOrId, printSingleRecordTable } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.get');

export class SnapshotGet extends SfCommand<OrgSnapshot> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);

  public static readonly flags = {
    'target-dev-hub': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    snapshot: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.snapshot'),
      description: messages.getMessage('flagsLong.snapshot'),
      required: true,
    }),
  };

  public async run(): Promise<OrgSnapshot> {
    const { flags } = await this.parse(SnapshotGet);
    const result = await queryByNameOrId(flags['target-dev-hub'].getConnection(flags['api-version']), flags.snapshot);
    if (!this.jsonEnabled()) {
      printSingleRecordTable(result);
    }
    return result;
  }
}
