/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { expect } from '@salesforce/command/lib/test';
import * as chai from 'chai';
import * as chaiAsPromised from 'chai-as-promised';

chai.use(chaiAsPromised);

import { AuthInfo, Connection, Org, fs } from '@salesforce/core';
import { fromStub, stubInterface, StubbedType, stubMethod } from '@salesforce/ts-sinon';
import * as sinon from 'sinon';
import { getAllShapesFromOrg, getNonScratchOrgs } from '../../src/shared/orgShapeListUtils';

describe('shape list utils', () => {
  const sandbox = sinon.createSandbox();
  const hubOrgStub = sinon.createStubInstance(Org);

  let testAuthInfo: StubbedType<AuthInfo>;
  let authInfoStub: sinon.SinonStub;

  beforeEach(() => {
    sandbox.restore();
  });

  it('gets all non scratch orgs', async () => {
    const authFiles = ['joe@my.org', 'test-zmu2hcsz8tuf@example.com'];
    stubMethod(sandbox, fs, 'readdir').returns(['00D000000000000004.json']);
    authInfoStub = stubMethod(sandbox, AuthInfo, 'create');

    authInfoStub.withArgs({ username: 'joe@my.org' }).resolves({
      getFields: () => ({ orgId: '00D000000000000003' }),
    });

    authInfoStub.withArgs({ username: 'test-zmu2hcsz8tuf@example.com' }).resolves({
      getFields: () => ({ orgId: '00D000000000000004', userId: '005xxxxxxxxxxxxx' }),
    });
    stubMethod(sandbox, fs, 'readJson').returns(['1247918746028_test-zmu2hcsz8tuf@example.com.json']);

    const authInfos = await getNonScratchOrgs(authFiles);

    expect(authInfoStub.calledTwice).to.be.true;
    expect(authInfos.length).to.equal(1);
    expect(authInfos[0].getFields().orgId).to.equal('00D000000000000003');
  });

  it('gets all org shapes from org', async () => {
    const joe = {
      username: 'joe@my.org',
      alias: 'joe',
      orgId: '00D000000000000004',
    };
    testAuthInfo = stubInterface<AuthInfo>(sandbox, {
      getFields: () => ({
        username: joe.username,
        alias: joe.alias,
        orgId: joe.orgId,
      }),
    });
    sandbox.stub(Org, 'create').resolves(hubOrgStub);

    hubOrgStub.getConnection.returns({
      query: sandbox
        .stub()
        .withArgs(
          "SELECT Id, Status, CreatedBy.Username, CreatedDate FROM ShapeRepresentation WHERE Status IN ( 'Active', 'InProgress' )"
        )
        .returns({
          done: true,
          totalSize: 1,
          records: [
            {
              Id: '3SR000000000123',
              Status: 'Active',
              CreatedBy: {
                Username: joe.username,
              },
              CreatedDate: '2022-03-21T19:04:53.000+0000',
            },
          ],
        }),
    } as unknown as Connection);

    const shapes = await getAllShapesFromOrg(fromStub(testAuthInfo));
    expect(shapes[0]).to.deep.equal({
      alias: joe.alias,
      createdBy: joe.username,
      createdDate: '2022-03-21T19:04:53.000+0000',
      orgId: joe.orgId,
      shapeId: '3SR000000000123',
      status: 'Active',
      username: joe.username,
    });
  });
});
