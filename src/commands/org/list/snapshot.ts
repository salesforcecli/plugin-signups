/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
  SfCommand,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import { OrgSnapshot, queryAll, printRecordTable } from '../../../shared/snapshot.js';

Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.list');

export class SnapshotList extends SfCommand<OrgSnapshot[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:snapshot:list'];
  public static readonly deprecateAliases = true;
  public static readonly state = 'closedPilot';
  public static readonly flags = {
    'target-dev-hub': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
  };

  public async run(): Promise<OrgSnapshot[]> {
    const { flags } = await this.parse(SnapshotList);
    const results = await queryAll(flags['target-dev-hub'].getConnection(flags['api-version']));
    if (!this.jsonEnabled()) {
      printRecordTable(results);
    }
    return results;
  }
}
