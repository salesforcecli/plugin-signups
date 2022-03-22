/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { Messages, Aliases, AuthInfo } from '@salesforce/core';
import * as chalk from 'chalk';
import { getNonScratchOrgs, getAllShapesFromOrg, OrgShapeListResult } from '../../../../shared/orgShapeListUtils';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.list');
// default columns for the shape list
const orgShapeColumns = [
  { key: 'defaultMarker', label: '' },
  { key: 'alias', label: 'ALIAS' },
  { key: 'username', label: 'USERNAME' },
  { key: 'orgId', label: 'ORG ID' },
  { key: 'status', label: 'SHAPE STATUS' },
  { key: 'createdBy', label: 'CREATED BY' },
  { key: 'createdDate', label: 'CREATED DATE' },
];

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
      { columns: orgShapeColumns }
    );
    return shapes;
  }

  public async getAllOrgShapesFromAuthenticatedOrgs(): Promise<OrgShapeListResult[]> {
    const aliases = await Aliases.create(Aliases.getDefaultOptions());
    const authInfos = await getNonScratchOrgs(await AuthInfo.listAllAuthFiles());
    const shapes = await Promise.all(authInfos.map((authInfo) => getAllShapesFromOrg(authInfo)));
    return shapes.flat().map((item) => ({ ...item, alias: aliases.getKeysByValue(item.username)?.[0] }));
  }
}
