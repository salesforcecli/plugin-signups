/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages, AuthInfo } from '@salesforce/core';
import * as chalk from 'chalk';
import { getAllShapesFromOrg, OrgShapeListResult } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.list');

// default columns for the shape list
const orgShapeColumns = {
  alias: { header: 'ALIAS' },
  username: { header: 'USERNAME' },
  orgId: { header: 'ORG ID' },
  status: { header: 'SHAPE STATUS' },
  createdBy: { header: 'CREATED BY' },
  createdDate: { header: 'CREATED DATE' },
};

export class OrgShapeListCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('help').split(EOL);
  public static readonly flagsConfig: FlagsConfig = {
    verbose: flags.builtin({
      description: messages.getMessage('verbose'),
    }),
  };

  public async run(): Promise<OrgShapeListResult[]> {
    const shapes = await this.getAllOrgShapesFromAuthenticatedOrgs();
    if (shapes.length === 0) {
      this.ux.log(messages.getMessage('noOrgShapes'));
      return shapes;
    }

    this.ux.styledHeader('Org Shapes');
    this.ux.table(
      shapes.map((shape) => (shape.status === 'Active' ? { ...shape, status: chalk.green(shape.status) } : shape)),
      orgShapeColumns
    );
    return shapes;
  }

  public async getAllOrgShapesFromAuthenticatedOrgs(): Promise<OrgShapeListResult[]> {
    const devHubs = await AuthInfo.listAllAuthorizations((orgAuth) => !orgAuth.error && orgAuth.isDevHub);
    const shapes = await Promise.all(devHubs.map((dh) => getAllShapesFromOrg(dh)));
    return shapes.flat();
  }
}
