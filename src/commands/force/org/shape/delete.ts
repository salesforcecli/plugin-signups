/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { EOL } from 'os';
import { flags, FlagsConfig, SfdxCommand } from '@salesforce/command';
import { SfdxError, Messages } from '@salesforce/core';
import { ShapeRepresentationApi } from '../../../../shared/shapeRepApi';

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.delete');

export interface OrgShapeDeleteResult {
  orgId: string;
  shapeIds: string[];
}
export class OrgShapeDeleteCommand extends SfdxCommand {
  public static readonly description = messages.getMessage('description');
  public static readonly examples = messages.getMessage('help').split(EOL);
  public static readonly requiresUsername = true;
  public static readonly flagsConfig: FlagsConfig = {
    noprompt: flags.boolean({
      char: 'p',
      description: messages.getMessage('noPrompt'),
    }),
  };

  public async run(): Promise<OrgShapeDeleteResult> {
    if (!this.flags.noprompt) {
      if (!(await this.ux.confirm(messages.getMessage('deleteCommandYesNo', [this.org.getUsername()])))) {
        return;
      }
    }
    const api = new ShapeRepresentationApi(this.org);
    if (!(await api.isFeatureEnabled())) {
      throw new SfdxError(messages.getMessage('noAccess', [this.org.getUsername()]));
    }
    const deletedShapesIds = await api.deleteAll();
    if (deletedShapesIds.length === 0) {
      this.ux.log(messages.getMessage('noShapesHumanSuccess', [this.org.getOrgId()]));
    }
    this.ux.log(messages.getMessage('humanSuccess', [this.org.getOrgId()]));
    return {
      orgId: this.org.getOrgId(),
      shapeIds: deletedShapesIds,
    };
  }
}
