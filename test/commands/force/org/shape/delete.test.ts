/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { resolve } from 'path';
import { Config } from '@oclif/core';
import { use, expect, config as chaiConfig } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { TestContext, MockTestOrgData } from '@salesforce/core/lib/testSetup';

import { SfCommand } from '@salesforce/sf-plugins-core';
import { SaveResult } from 'jsforce';
import * as sinon from 'sinon';
import { ensureJsonMap, ensureString, AnyJson } from '@salesforce/ts-types';
import { OrgShapeDeleteCommand } from '../../../../../src/commands/force/org/shape/delete';
import * as deleteFunctions from '../../../../../src/commands/force/org/shape/delete';
import { queryShapeEnabledResponse } from '../../../../shared/apiResponses';

use(chaiAsPromised);
chaiConfig.truncateThreshold = 0;

describe('org:shape:delete', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();
  const config = new Config({ root: resolve(__dirname, '../../../package.json') });

  const sandbox = sinon.createSandbox();

  // stubs
  let uxLogStub: sinon.SinonStub;
  let uxTableStub: sinon.SinonStub;
  let uxStyledHeaderStub: sinon.SinonStub;

  beforeEach(async () => {
    await config.load();
    uxLogStub = sandbox.stub(SfCommand.prototype, 'log');
    uxStyledHeaderStub = sandbox.stub(SfCommand.prototype, 'styledHeader');
    uxTableStub = sandbox.stub(SfCommand.prototype, 'table');

    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
    sandbox.restore();
  });

  it('deletes all org shapes', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<SaveResult | AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('tooling')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }
      if (
        request &&
        ensureString(requestWithUrl.url).includes('ShapeRepresentation') &&
        ensureString(requestWithUrl.url).includes('query')
      ) {
        return Promise.resolve({
          done: true,
          totalSize: 1,
          records: [{ Id: '3SR000000000123' }],
        });
      }
      if (
        request &&
        ensureString(requestWithUrl.url).includes('ShapeRepresentation') &&
        ensureString(requestWithUrl.method).includes('delete')
      ) {
        return Promise.resolve({
          id: '3SR000000000123',
          success: true,
        } as SaveResult);
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    const command = new OrgShapeDeleteCommand(['--noprompt', '--targetusername', testOrg.username], config);
    await command.run();
    expect(uxLogStub.getCalls().some((c) => c.args[0] === 'Successfully deleted org shape for 00D000000000000004.'));
  });

  it('partial success', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<SaveResult | AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('tooling')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }
      if (
        request &&
        ensureString(requestWithUrl.url).includes('ShapeRepresentation') &&
        ensureString(requestWithUrl.url).includes('query')
      ) {
        return Promise.resolve({
          done: true,
          totalSize: 1,
          records: [{ Id: '3SR000000000123' }],
        });
      }
      if (
        request &&
        ensureString(requestWithUrl.url).includes('ShapeRepresentation') &&
        ensureString(requestWithUrl.method).includes('delete')
      ) {
        return Promise.resolve({
          id: '3SR000000000123',
          success: true,
        } as SaveResult);
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    sandbox.stub(deleteFunctions, 'deleteAll').resolves({
      shapeIds: ['3SR000000000123'],
      failures: [{ shapeId: '3SR000000000124', message: 'MALFORMED ID' }],
    });

    const command = new OrgShapeDeleteCommand(['--noprompt', '--targetusername', testOrg.username], config);
    await command.run();

    expect(uxStyledHeaderStub.firstCall.args[0]).to.equal('Partial Success');
    expect(uxLogStub.getCalls().some((c) => c.args[0] === 'Successfully deleted org shape for 00D000000000000004.'));
    expect(uxLogStub.getCalls().some((c) => c.args[0] === ''));
    expect(uxStyledHeaderStub.secondCall.args[0]).to.equal('Failures');
    expect(uxTableStub.firstCall.args[0]).to.deep.equal([{ shapeId: '3SR000000000124', message: 'MALFORMED ID' }]);
    expect(uxTableStub.firstCall.args[1]).to.deep.equal({
      shapeId: { header: 'Shape ID' },
      message: { header: 'Error Message' },
    });
  });

  it('no shapes', async () => {
    sandbox.stub(deleteFunctions, 'deleteAll').resolves({
      shapeIds: [],
      failures: [],
    });
    $$.fakeConnectionRequest = (request: AnyJson): Promise<SaveResult | AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('tooling')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }

      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    const command = new OrgShapeDeleteCommand(['--noprompt', '--targetusername', testOrg.username], config);
    await command.run();
    // there'll be a warning about noprompt deprecated alias
    expect(uxLogStub.callCount).to.greaterThanOrEqual(1);
    expect(
      uxLogStub
        .getCalls()
        .some((c) => c.args[0] === "Can't delete org shape. No org shape found for org 00D000000000000004.")
    );
  });

  it('fails to delete shape org, no access', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<SaveResult | AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('tooling')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }
      if (
        request &&
        ensureString(requestWithUrl.url).includes('ShapeRepresentation') &&
        ensureString(requestWithUrl.url).includes('query')
      ) {
        return Promise.reject({
          errorCode: 'INVALID_TYPE',
          message: "sObject type 'ShapeRepresentation' is not supported",
        });
      }

      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };
    try {
      const command = new OrgShapeDeleteCommand(['--noprompt', '--targetusername', testOrg.username], config);
      await command.run();
    } catch (e) {
      expect(e).to.have.property('name', 'noAccess');
    }
  });
});
