/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { resolve } from 'path';
import { Config } from '@oclif/core';
import * as chalk from 'chalk';
import { use, expect } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { SfCommand } from '@salesforce/sf-plugins-core';
import { TestContext, MockTestOrgData } from '@salesforce/core/lib/testSetup';
import * as OrgShapeListCommandFunctions from '../../src/commands/org/list/shape';
import { OrgShapeListCommand } from '../../src/commands/org/list/shape';
import { OrgShapeListResult } from '../../src/shared/orgShapeListUtils';

use(chaiAsPromised);

describe('org:shape:list', () => {
  const sandbox = sinon.createSandbox();

  // stubs
  let uxLogStub: sinon.SinonStub;
  let uxTableStub: sinon.SinonStub;
  let uxStyledHeaderStub: sinon.SinonStub;

  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();
  const config = new Config({ root: resolve(__dirname, '../../package.json') });

  beforeEach(async () => {
    await config.load();
    uxLogStub = sandbox.stub(SfCommand.prototype, 'log');
    uxStyledHeaderStub = sandbox.stub(SfCommand.prototype, 'styledHeader');
    uxTableStub = sandbox.stub(SfCommand.prototype, 'table');
  });

  afterEach(() => {
    $$.restore();
    sandbox.restore();
  });

  it('no shapes', async () => {
    await $$.stubAuths(testOrg);
    sandbox
      .stub(OrgShapeListCommandFunctions, 'getAllOrgShapesFromAuthenticatedOrgs')
      .resolves({ orgShapes: [], errors: [] });

    const command = new OrgShapeListCommand([], config);
    await command.run();
    expect(uxLogStub.callCount).to.be.greaterThanOrEqual(2);
    expect(uxLogStub.args.some((a: string[]) => a.length > 0 && a[0].includes('No org shapes found.'))).to.be.true;
  });

  it('lists org shapes', async () => {
    await $$.stubAuths(testOrg);
    const shapes = [
      {
        orgId: '00D000000000000004',
        username: 'joe@my.org',
        alias: 'joe',
        shapeId: '3SR000000000123',
        status: 'Active',
        createdBy: 'joe@my.org',
        createdDate: '2022-03-22T02:12:23.000+0000',
      },
      {
        orgId: '00D000000000000005',
        username: 'luna@my.org',
        alias: 'luna',
        shapeId: '3SR000000000124',
        status: 'Active',
        createdBy: 'luna@my.org',
        createdDate: '2022-03-21T02:12:23.000+0000',
      },
    ];
    sandbox
      .stub(OrgShapeListCommandFunctions, 'getAllOrgShapesFromAuthenticatedOrgs')
      .resolves({ orgShapes: shapes, errors: [] });
    const command = new OrgShapeListCommand([], config);
    await command.run();
    expect(uxLogStub.notCalled).to.be.true;
    expect(uxStyledHeaderStub.firstCall.args[0]).to.equal('Org Shapes');
    expect((uxTableStub.firstCall.args[0] as OrgShapeListResult[]).length).to.equal(2);
    expect(uxTableStub.firstCall.args[0]).to.deep.equal(
      shapes.map((shape) => (shape.status === 'Active' ? { ...shape, status: chalk.green(shape.status) } : shape))
    );
  });

  it('no devhub org', async () => {
    try {
      const command = new OrgShapeListCommand([], config);
      await command.run();
    } catch (e) {
      expect(e).to.have.property('name', 'NoAuthFoundError');
    }
  });
});
