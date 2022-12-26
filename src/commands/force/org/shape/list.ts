/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, SfCommand } from '@salesforce/sf-plugins-core';
import { Messages, AuthInfo } from '@salesforce/core';
import * as chalk from 'chalk';
import { getAllShapesFromOrg, OrgShapeListResult } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.list');

// default columns for the shape list
const orgShapeColumns = {
  alias: {
    header: 'ALIAS',
    get: (data: OrgShapeListResult): string => data.alias ?? '',
  },
  username: { header: 'USERNAME' },
  orgId: { header: 'ORG ID' },
  status: { header: 'SHAPE STATUS' },
  createdBy: { header: 'CREATED BY' },
  createdDate: { header: 'CREATED DATE' },
};

export class OrgShapeListCommand extends SfCommand<OrgShapeListResult[]> {
  public static readonly summary = messages.getMessage('description');
  public static readonly description = messages.getMessage('longDescription');
  public static readonly examples = messages.getMessages('help');
  public static readonly aliases = ['force:org:shape:list', 'org:shape:list'];
  public static readonly deprecateAliases = true;

  public static readonly flags = {
    verbose: Flags.boolean({
      summary: messages.getMessage('verbose'),
      hidden: true,
    }),
    loglevel,
  };

  // there were no flags being used in the original!
  // eslint-disable-next-line sf-plugin/should-parse-flags
  public async run(): Promise<OrgShapeListResult[]> {
    const shapes = await getAllOrgShapesFromAuthenticatedOrgs();
    if (shapes.length === 0) {
      this.log(messages.getMessage('noOrgShapes'));
      return shapes;
    }

    this.styledHeader('Org Shapes');
    this.table(
      shapes.map((shape) => (shape.status === 'Active' ? { ...shape, status: chalk.green(shape.status) } : shape)),
      orgShapeColumns
    );
    return shapes;
  }
}

export const getAllOrgShapesFromAuthenticatedOrgs = async (): Promise<OrgShapeListResult[]> => {
  const orgs = await AuthInfo.listAllAuthorizations((orgAuth) => !orgAuth.error && !orgAuth.isScratchOrg);
  if (orgs.length === 0) {
    const e = messages.createError('noAuthFound');
    // eslint-disable-next-line @typescript-eslint/ban-ts-comment
    // @ts-ignore override readonly .name field
    e.name = 'noAuthFound';
    throw e;
  }
  const shapes = await Promise.all(orgs.map((o) => getAllShapesFromOrg(o)));
  return shapes.flat();
};
