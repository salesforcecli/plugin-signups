/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect, IConfig } from '@salesforce/command/lib/test';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { Connection, Org, SfdxError } from '@salesforce/core';
import { UX } from '@salesforce/command';
import { fromStub, stubInterface, stubMethod } from '@salesforce/ts-sinon';
import { RecordResult } from 'jsforce';
import * as sinon from 'sinon';
import { OrgShapeCreateCommand } from '../../../../../src/commands/force/org/shape/create';

describe('org:shape:create', () => {
  const sandbox = sinon.createSandbox();
  const oclifConfigStub = fromStub(stubInterface<IConfig.IConfig>(sandbox));

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
    sandbox.restore();
  });

  const queryShapeEnabled = sandbox
    .stub()
    .withArgs(`SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`)
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
          } as RecordResult),
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
      const err = e as SfdxError;
      expect(err.name).to.equal('create_shape_command_no_access');
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
            errors: ['Failed to create shape org.'],
          } as RecordResult),
        }),
    } as unknown as Connection);

    try {
      const command = await createShapeCommand([]);
      await command.runIt();
    } catch (e) {
      const err = e as SfdxError;
      expect(err.name).to.equal('shape_create_failed_message');
    }
  });
});
