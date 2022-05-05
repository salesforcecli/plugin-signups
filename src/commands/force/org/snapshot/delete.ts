/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { EOL } from 'os';
import { flags, SfdxCommand, FlagsConfig } from '@salesforce/command';
import { Messages } from '@salesforce/core';
import { SaveResult, SaveError } from 'jsforce';
import { queryByNameOrId } from '../../../../shared/snapshot';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot.get');

// jsforce can return SaveError[] or never[]
const isSaveError = (error: SaveError | unknown): error is SaveError => (error as SaveError).message !== undefined;

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

  public async run(): Promise<SaveResult> {
    // resolve the query to an ID.  This also verifies the snapshot exists in the org
    const result = await queryByNameOrId(this.hubOrg.getConnection(), this.flags.snapshot);
    const deleteResult = await this.hubOrg.getConnection().sobject('OrgSnapshot').delete(result.Id);
    if (deleteResult.success) {
      this.ux.log(`Successfully deleted snapshot ${this.flags.snapshot as string}.`);
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
