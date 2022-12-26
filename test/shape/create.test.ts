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
import { OrgShapeCreateCommand } from '../../src/commands/org/create/shape';
import { queryShapeEnabledResponse } from '../shared/apiResponses';

use(chaiAsPromised);
chaiConfig.truncateThreshold = 0;

describe('org:shape:create', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();
  const config = new Config({ root: resolve(__dirname, '../../package.json') });

  const sandbox = sinon.createSandbox();

  // stubs
  let uxLogStub: sinon.SinonStub;

  beforeEach(async () => {
    await config.load();
    uxLogStub = sandbox.stub(SfCommand.prototype, 'log');
    await $$.stubAuths(testOrg);
  });

  afterEach(() => {
    $$.restore();
    sandbox.restore();
  });

  it('creates a new shape org', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<SaveResult | AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('tooling')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }
      if (request && ensureString(requestWithUrl.url).includes('ShapeRepresentation')) {
        return Promise.resolve({
          id: '3SR000000000123',
          success: true,
        } as SaveResult);
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    const command = new OrgShapeCreateCommand(['--target-org', testOrg.username], config);
    await command.run();
    expect(uxLogStub.firstCall.args[0]).to.equal('Successfully created org shape for 3SR000000000123.');
  });

  it('shape feature is not enabled', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<AnyJson | SaveResult> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('IsShapeExportPrefEnabled')) {
        return Promise.resolve({
          done: true,
          totalSize: 1,
          records: [{ IsShapeExportPrefEnabled: false }],
        });
      }
      if (request && ensureString(requestWithUrl.url).includes('ShapeRepresentation')) {
        return Promise.resolve({
          id: '3SR000000000123',
          success: true,
        } as SaveResult);
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    try {
      const command = new OrgShapeCreateCommand(['--target-org', testOrg.username], config);
      await command.run();
    } catch (e) {
      expect(e).to.have.property('name', 'ShapeRepresentationNoAccessError');
    }
  });

  it('fails to create shape org', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('IsShapeExportPrefEnabled')) {
        return Promise.resolve(queryShapeEnabledResponse);
      }
      if (request && ensureString(requestWithUrl.url).includes('ShapeRepresentation')) {
        return Promise.resolve({
          success: false,
          errors: [{ message: 'Failed to create shape org.' }],
        } as SaveResult);
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    try {
      const command = new OrgShapeCreateCommand(['--target-org', testOrg.username], config);
      await command.run();
    } catch (e) {
      expect(e).to.have.property('name', 'ShapeCreateFailedError');
    }
  });
});
