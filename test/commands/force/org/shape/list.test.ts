/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Config } from '@oclif/core';
import * as chalk from 'chalk';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Org } from '@salesforce/core';
import { UX } from '@salesforce/command';
import { fromStub, stubInterface, stubMethod } from '@salesforce/ts-sinon';
import * as sinon from 'sinon';
import { OrgShapeListCommand } from '../../../../../src/commands/force/org/shape/list';
import { OrgShapeListResult } from '../../../../../src/shared/orgShapeListUtils';

const expect = chai.expect;

describe('org:shape:list', () => {
  const sandbox = sinon.createSandbox();
  const oclifConfigStub = fromStub(stubInterface<Config>(sandbox));

  // stubs
  let uxLogStub: sinon.SinonStub;
  let uxTableStub: sinon.SinonStub;
  let uxStyledHeaderStub: sinon.SinonStub;
  let cmd: TestCreate;
  const hubOrgStub = sinon.createStubInstance(Org);

  class TestCreate extends OrgShapeListCommand {
    public async runIt() {
      await this.init();
      return this.run();
    }
    public setOrg(org: Org) {
      this.org = org;
    }
  }

  async function listShapeCommand(params: string[]) {
    cmd = new TestCreate(params, oclifConfigStub);

    uxLogStub = stubMethod(sandbox, UX.prototype, 'log');
    uxTableStub = stubMethod(sandbox, UX.prototype, 'table');
    uxStyledHeaderStub = stubMethod(sandbox, UX.prototype, 'styledHeader');
    stubMethod(sandbox, cmd, 'assignOrg').callsFake(() => {
      cmd.setOrg(hubOrgStub);
    });
    return cmd;
  }

  afterEach(() => {
    sandbox.restore();
  });

  it('no shapes', async () => {
    stubMethod(sandbox, OrgShapeListCommand.prototype, 'getAllOrgShapesFromAuthenticatedOrgs').resolves([]);
    const command = await listShapeCommand([]);
    await command.runIt();
    expect(uxLogStub.calledOnce).to.be.true;
    expect(uxLogStub.firstCall.args[0]).to.equal('No org shapes found.');
  });

  it('lists org shapes', async () => {
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

    stubMethod(sandbox, OrgShapeListCommand.prototype, 'getAllOrgShapesFromAuthenticatedOrgs').resolves(shapes);
    const command = await listShapeCommand([]);
    await command.runIt();
    expect(uxLogStub.notCalled).to.be.true;
    expect(uxStyledHeaderStub.firstCall.args[0]).to.equal('Org Shapes');
    expect((uxTableStub.firstCall.args[0] as OrgShapeListResult[]).length).to.equal(2);
    expect(uxTableStub.firstCall.args[0]).to.deep.equal(
      shapes.map((shape) => (shape.status === 'Active' ? { ...shape, status: chalk.green(shape.status) } : shape))
    );
    expect(uxTableStub.firstCall.args[1]).to.deep.equal({
      alias: { header: 'ALIAS' },
      username: { header: 'USERNAME' },
      orgId: { header: 'ORG ID' },
      status: { header: 'SHAPE STATUS' },
      createdBy: { header: 'CREATED BY' },
      createdDate: { header: 'CREATED DATE' },
    });
  });
});
