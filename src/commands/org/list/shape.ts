/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
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

    this.table({
      data: orgShapes.map((shape) => ({
        ...(shape.status === 'Active' ? { ...shape, status: StandardColors.success(shape.status) } : shape),
      })),
      title: 'Org Shapes',
      overflow: 'wrap',
    });
    return orgShapes;
  }
}
