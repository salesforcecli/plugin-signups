/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import {
  Flags,
  SfCommand,
  requiredOrgFlagWithDeprecations,
  orgApiVersionFlagWithDeprecations,
  loglevel,
} from '@salesforce/sf-plugins-core';
import { Messages, SfError } from '@salesforce/core';
import { isShapeEnabled } from '../../../shared/orgShapeListUtils.js';
import utils, { DeleteAllResult } from '../../../shared/deleteUtils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.delete');

export interface OrgShapeDeleteResult extends DeleteAllResult {
  orgId: string;
}

export class OrgShapeDeleteCommand extends SfCommand<OrgShapeDeleteResult | undefined> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:shape:delete'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    'target-org': requiredOrgFlagWithDeprecations,
    'api-version': orgApiVersionFlagWithDeprecations,
    loglevel,
    'no-prompt': Flags.boolean({
      char: 'p',
      summary: messages.getMessage('flags.no-prompt.summary'),
      aliases: ['noprompt'],
      deprecateAliases: true,
    }),
  };

  public async run(): Promise<OrgShapeDeleteResult | undefined> {
    const { flags } = await this.parse(OrgShapeDeleteCommand);
    const username = flags['target-org'].getUsername();
    if (!username) throw new SfError('No username found for target-org');
    const orgId = flags['target-org'].getOrgId();
    if (!flags['no-prompt']) {
      if (!(await this.confirm({ message: messages.getMessage('deleteCommandYesNo', [username]) }))) {
        return;
      }
    }

    const conn = flags['target-org'].getConnection(flags['api-version']);

    if (!(await isShapeEnabled(conn))) {
      throw messages.createError('noAccess', [username]);
    }

    const deleteRes = await utils.deleteAll(conn, username);

    if (deleteRes.shapeIds.length === 0) {
      this.info(messages.getMessage('noShapesHumanSuccess', [orgId]));
      return;
    }

    if (deleteRes.failures.length > 0) {
      setExitCode(68);

      this.styledHeader('Partial Success');
      this.logSuccess(messages.getMessage('humanSuccess', [orgId]));
      this.log('');
      this.styledHeader('Failures');
      const columns = {
        shapeId: { header: 'Shape ID' },
        message: { header: 'Error Message' },
      };
      this.table(deleteRes.failures, columns);
    } else if (deleteRes.failures.length === deleteRes.shapeIds.length) {
      setExitCode(1);
    } else {
      setExitCode(0);
      this.logSuccess(messages.getMessage('humanSuccess', [orgId]));
    }

    return {
      orgId,
      shapeIds: deleteRes.shapeIds,
      failures: deleteRes.failures,
    };
  }
}

const setExitCode = (code: number): void => {
  process.exitCode = code;
};
