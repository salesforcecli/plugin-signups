/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { TestContext, MockTestOrgData } from '@salesforce/core/testSetup';
import { AnyJson, ensureJsonMap, ensureString } from '@salesforce/ts-types';
import { getAllShapesFromOrg } from '../../src/shared/orgShapeListUtils.js';
chai.use(chaiAsPromised);

describe('shape list utils', () => {
  const $$ = new TestContext();
  const testOrg = new MockTestOrgData();
  testOrg.isDevHub = true;

  beforeEach(async () => {
    await $$.stubAuths(testOrg);
  });
  afterEach(async () => {
    $$.restore();
  });

  it('gets all org shapes from org', async () => {
    $$.fakeConnectionRequest = (request: AnyJson): Promise<AnyJson> => {
      const requestWithUrl = ensureJsonMap(request);
      if (request && ensureString(requestWithUrl.url).includes('query')) {
        return Promise.resolve({
          done: true,
          totalSize: 1,
          records: [
            {
              Id: '3SR000000000123',
              Status: 'Active',
              CreatedBy: {
                Username: testOrg.username,
              },
              CreatedDate: '2022-03-21T19:04:53.000+0000',
            },
          ],
        });
      }
      throw new Error('Unexpected request: ' + JSON.stringify(request));
    };

    const shapes = await getAllShapesFromOrg({
      username: testOrg.username,
      orgId: testOrg.orgId,
      aliases: ['joe', 'j'],
      isExpired: false,
      oauthMethod: 'unknown',
      configs: [],
    });
    expect(shapes[0]).to.deep.equal({
      alias: 'joe,j',
      createdBy: testOrg.username,
      createdDate: '2022-03-21T19:04:53.000+0000',
      orgId: testOrg.orgId,
      shapeId: '3SR000000000123',
      status: 'Active',
      username: testOrg.username,
    });
  });

  // it('fails to get org shapes', async () => {
  //   sandbox.stub(Org, 'create').resolves(hubOrgStub);

  //   hubOrgStub.getConnection.returns({
  //     query: sandbox
  //       .stub()
  //       .withArgs(
  //         "SELECT Id, Status, CreatedBy.Username, CreatedDate FROM ShapeRepresentation WHERE Status IN ( 'Active', 'InProgress' )"
  //       )
  //       .throws({
  //         errorCode: 'INVALID_TYPE',
  //         message: "sObject type 'ShapeRepresentation' is not supported",
  //       }),
  //   } as unknown as Connection);

  //   const shapes = await getAllShapesFromOrg(joe);
  //   expect(shapes.length).to.equal(0);
  // });
});
