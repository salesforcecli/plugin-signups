/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Config } from '@oclif/core';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Connection, Org } from '@salesforce/core';
import { UX } from '@salesforce/command';
import { fromStub, stubInterface, stubMethod } from '@salesforce/ts-sinon';
import { SaveResult } from 'jsforce';
import * as sinon from 'sinon';
import { OrgShapeCreateCommand } from '../../../../../src/commands/force/org/shape/create';

const expect = chai.expect;

describe('org:shape:create', () => {
  const sandbox = sinon.createSandbox();
  const oclifConfigStub = fromStub(stubInterface<Config>(sandbox));

  // stubs
  let uxLogStub: sinon.SinonStub;
  let cmd: TestCreate;
  const hubOrgStub = sinon.createStubInstance(Org);

  class TestCreate extends OrgShapeCreateCommand {
    public async runIt() {
      await this.init();
      return this.run();
    }
    public setOrg(org: Org) {
      this.org = org;
    }
  }

  async function createShapeCommand(params: string[]) {
    cmd = new TestCreate(params, oclifConfigStub);

    uxLogStub = stubMethod(sandbox, UX.prototype, 'log');
    stubMethod(sandbox, cmd, 'assignOrg').callsFake(() => {
      cmd.setOrg(hubOrgStub);
    });
    return cmd;
  }

  afterEach(() => {
    queryShapeEnabled.resetHistory();
    sandbox.restore();
  });

  const queryShapeEnabled = sandbox
    .stub()
    .withArgs(`SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`)
    .onFirstCall()
    .returns({
      done: true,
      totalSize: 1,
      records: [{ IsShapeExportPrefEnabled: true }],
    });

  it('creates a new shape org', async () => {
    hubOrgStub.getConnection.returns({
      tooling: {
        query: queryShapeEnabled,
      },
      sobject: sinon
        .stub()
        .withArgs('ShapeDescription')
        .returns({
          create: sinon.stub().returns({
            id: '3SR000000000123',
            success: true,
          } as SaveResult),
        }),
    } as unknown as Connection);

    const command = await createShapeCommand([]);
    await command.runIt();
    expect(uxLogStub.firstCall.args[0]).to.equal('Successfully created org shape for 3SR000000000123.');
  });

  it('shape feature is not enabled', async () => {
    hubOrgStub.getConnection.returns({
      tooling: {
        query: sandbox
          .stub()
          .withArgs(`SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`)
          .returns({
            done: true,
            totalSize: 1,
            records: [{ IsShapeExportPrefEnabled: false }],
          }),
      },
    } as unknown as Connection);
    try {
      const command = await createShapeCommand([]);
      await command.runIt();
    } catch (e) {
      expect(e).to.have.property('name', 'noAccess');
    }
  });

  it('fails to create shape org', async () => {
    hubOrgStub.getConnection.returns({
      tooling: {
        query: queryShapeEnabled,
      },
      sobject: sinon
        .stub()
        .withArgs('ShapeDescription')
        .returns({
          create: sinon.stub().returns({
            success: false,
            errors: [{ message: 'Failed to create shape org.' }],
          } as SaveResult),
        }),
    } as unknown as Connection);

    try {
      const command = await createShapeCommand([]);
      await command.runIt();
    } catch (e) {
      expect(e).to.have.property('name', 'shape_create_failed_message');
    }
  });
});
