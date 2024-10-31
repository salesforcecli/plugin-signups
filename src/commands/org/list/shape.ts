/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, SfCommand, StandardColors } from '@salesforce/sf-plugins-core';
import { Messages } from '@salesforce/core';
import utils, { OrgShapeListResult } from '../../../shared/orgShapeListUtils.js';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.list');

export class OrgShapeListCommand extends SfCommand<OrgShapeListResult[]> {
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:shape:list'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    verbose: Flags.boolean({
      summary: messages.getMessage('flags.verbose.summary'),
      hidden: true,
    }),
    loglevel,
  };

  // there were no flags being used in the original!
  // eslint-disable-next-line sf-plugin/should-parse-flags
  public async run(): Promise<OrgShapeListResult[]> {
    const { orgShapes, errors } = await utils.getAllOrgShapesFromAuthenticatedOrgs();
    errors.forEach((e) => this.warn(e));
    if (orgShapes.length === 0) {
      this.log();
      this.info(messages.getMessage('noOrgShapes'));
      return orgShapes;
    }
    this.styledHeader('Org Shapes');
    this.table({
      data: orgShapes.map((shape) => ({
        ...(shape.status === 'Active' ? { ...shape, status: StandardColors.success(shape.status) } : shape),
      })),
    });
    return orgShapes;
  }
}
