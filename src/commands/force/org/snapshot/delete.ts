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
import { Messages } from '@salesforce/core';
import { SaveResult, SaveError } from 'jsforce';
import { queryByNameOrId } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.delete');

// jsforce can return SaveError[] or never[]
const isSaveError = (error: SaveError | unknown): error is SaveError => (error as SaveError).message !== undefined;

export class SnapshotDelete extends SfCommand<SaveResult> {
  public static readonly summary = messages.getMessage('description');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('examples').split(EOL);
  public static readonly aliases = ['force:org:snapshot:delete', 'org:snapshot:delete'];
  public static readonly deprecateAliases = true;

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

  public async run(): Promise<SaveResult> {
    // resolve the query to an ID.  This also verifies the snapshot exists in the org
    const { flags } = await this.parse(SnapshotDelete);
    const conn = flags['target-dev-hub'].getConnection(flags['api-version']);
    const result = await queryByNameOrId(conn, flags.snapshot);
    const deleteResult = await conn.sobject('OrgSnapshot').delete(result.Id);
    if (deleteResult.success) {
      this.log(messages.getMessage('success', [flags.snapshot]));
      return deleteResult;
    } else if (deleteResult.errors) {
      throw new Error(
        deleteResult.errors
          .filter(isSaveError)
          .map((error) => error.message)
          .join(EOL)
      );
    }
  }
}
