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
import { OrgShapeDeleteCommand } from '../../../../../src/commands/force/org/shape/delete';

describe('org:shape:delete', () => {
  const username = 'me@my.org';

  const sandbox = sinon.createSandbox();
  const oclifConfigStub = fromStub(stubInterface<IConfig.IConfig>(sandbox));

  // stubs
  let uxLogStub: sinon.SinonStub;
  let cmd: TestCreate;
  const hubOrgStub = sinon.createStubInstance(Org);

  class TestCreate extends OrgShapeDeleteCommand {
    public async runIt() {
      await this.init();
      return this.run();
    }
    public setOrg(org: Org) {
      this.org = org;
    }
  }

  async function deleteShapeCommand(params: string[]) {
    cmd = new TestCreate(params, oclifConfigStub);

    uxLogStub = stubMethod(sandbox, UX.prototype, 'log');
    stubMethod(sandbox, cmd, 'assignOrg').callsFake(() => {
      cmd.setOrg(hubOrgStub);
    });
    return cmd;
  }

  beforeEach(() => {
    hubOrgStub.getUsername.returns(username);
  });

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

  it('deletes all org shapes', async () => {
    hubOrgStub.getConnection.returns({
      tooling: {
        query: queryShapeEnabled,
      },
      query: sandbox
        .stub()
        .withArgs('SELECT Id FROM ShapeRepresentation')
        .returns({
          done: true,
          totalSize: 1,
          records: [{ Id: '3SR000000000123' }],
        }),
      sobject: sandbox
        .stub()
        .withArgs('ShapeRepresentation')
        .returns({
          delete: sinon
            .stub()
            .onFirstCall()
            .returns({
              id: '3SR000000000123',
              success: true,
            } as RecordResult),
        }),
    } as unknown as Connection);

    hubOrgStub.getOrgId.returns('00D000000000000004');

    const command = await deleteShapeCommand(['--noprompt']);
    await command.runIt();
    expect(uxLogStub.firstCall.args[0]).to.equal('Successfully deleted org shape for 00D000000000000004.');
  });

  it('no shapes', async () => {
    stubMethod(sandbox, OrgShapeDeleteCommand.prototype, 'deleteAll').resolves([]);

    hubOrgStub.getOrgId.returns('00D000000000000004');

    const command = await deleteShapeCommand(['--noprompt']);
    await command.runIt();
    expect(uxLogStub.calledOnce).to.be.true;
    expect(uxLogStub.firstCall.args[0]).to.equal(
      "Can't delete org shape. No org shape found for org 00D000000000000004."
    );
  });

  it('fails to delete shape org, no access', async () => {
    hubOrgStub.getConnection.returns({
      tooling: {
        query: queryShapeEnabled,
      },
      query: sandbox.stub().withArgs('SELECT Id FROM ShapeRepresentation').throws({
        name: 'INVALID_TYPE',
        message: "sObject type 'ShapeRepresentation' is not supported",
      }),
    } as unknown as Connection);

    try {
      const command = await deleteShapeCommand(['--noprompt']);
      await command.runIt();
    } catch (e) {
      const err = e as SfdxError;
      expect(err.name).to.equal('INVALID_TYPE');
      expect(err.message).to.equal("sObject type 'ShapeRepresentation' is not supported");
    }
  });
});
