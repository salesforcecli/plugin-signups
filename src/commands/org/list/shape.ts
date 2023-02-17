/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Flags, loglevel, SfCommand } from '@salesforce/sf-plugins-core';
import { AuthInfo, Messages } from '@salesforce/core';
import * as chalk from 'chalk';
import { getAllShapesFromOrg, OrgShapeListResult } from '../../../shared/orgShapeListUtils';

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
  public static readonly summary = messages.getMessage('summary');
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessages('examples');
  public static readonly aliases = ['force:org:shape:list'];
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
    const { orgShapes, errors } = await getAllOrgShapesFromAuthenticatedOrgs();
    errors.forEach((e) => this.warn(e));
    if (orgShapes.length === 0) {
      this.log();
      this.info(messages.getMessage('noOrgShapes'));
      return orgShapes;
    }

    this.styledHeader('Org Shapes');
    this.table(
      orgShapes.map((shape) => (shape.status === 'Active' ? { ...shape, status: chalk.green(shape.status) } : shape)),
      orgShapeColumns
    );
    return orgShapes;
  }
}

export const getAllOrgShapesFromAuthenticatedOrgs = async (): Promise<{
  orgShapes: OrgShapeListResult[];
  errors: Error[];
}> => {
  const orgs = await AuthInfo.listAllAuthorizations((orgAuth) => !orgAuth.error && !orgAuth.isScratchOrg);
  if (orgs.length === 0) {
    throw messages.createError('noAuthFound');
  }
  const shapes = await Promise.allSettled(orgs.map((o) => getAllShapesFromOrg(o)));
  // get all fulfilled promises values from settled promises
  const orgShapes = shapes
    .filter((s) => s.status === 'fulfilled')
    .map((s) => {
      if (s.status === 'fulfilled') {
        return s.value;
      } else {
        return [];
      }
    })
    .flat();
  const errors = shapes
    .filter((s) => s.status === 'rejected')
    .map((s) => {
      if (s.status === 'rejected') {
        return s.reason as Error;
      }
    })
    .filter((e) => e !== undefined) as Error[];

  return { orgShapes, errors };
};
