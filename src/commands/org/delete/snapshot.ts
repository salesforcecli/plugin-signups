/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'node:os';

import {
  Flags,
  SfCommand,
  loglevel,
  orgApiVersionFlagWithDeprecations,
  requiredHubFlagWithDeprecations,
} from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import type { SaveResult, SaveError } from '@jsforce/jsforce-node';
import { queryByNameOrId } from '../../../shared/snapshot.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.delete');

// jsforce can return SaveError[] or never[]
const isSaveError = (error: SaveError): error is SaveError => error.message !== undefined;

export class SnapshotDelete extends SfCommand<SaveResult | undefined> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:snapshot:delete'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    'target-dev-hub': requiredHubFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    snapshot: Flags.string({
      char: 's',
      summary: messages.getMessage('flags.snapshot.summary'),
      description: messages.getMessage('flags.snapshot.description'),
      required: true,
    }),
    'no-prompt': Flags.boolean({
      char: 'p',
      summary: messages.getMessage('flags.no-prompt.summary'),
    }),
  };

  public async run(): Promise<SaveResult | undefined> {
    const { flags } = await this.parse(SnapshotDelete);
    if (!flags['no-prompt'] && !(await this.confirm({ message: messages.getMessage('prompt.confirm') }))) {
      return;
    }

    // resolve the query to an ID.  This also verifies the snapshot exists in the org
    const conn = flags['target-dev-hub'].getConnection(flags['api-version']);
    const result = await queryByNameOrId(conn, flags.snapshot);
    const deleteResult = await conn.sobject('OrgSnapshot').delete(result.Id);
    if (deleteResult.success) {
      this.logSuccess(messages.getMessage('success', [flags.snapshot]));
      return deleteResult;
    }
    throw new Error(
      deleteResult.errors
        .filter(isSaveError)
        .map((error) => error.message)
        .join(EOL)
    );
  }
}
