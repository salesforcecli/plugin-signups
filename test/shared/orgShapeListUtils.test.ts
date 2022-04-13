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

import { Connection, Org, OrgAuthorization } from '@salesforce/core';
import * as sinon from 'sinon';
import { getAllShapesFromOrg } from '../../src/shared/orgShapeListUtils';

describe('shape list utils', () => {
  const sandbox = sinon.createSandbox();
  const hubOrgStub = sinon.createStubInstance(Org);

  const joe = {
    username: 'joe@my.org',
    aliases: ['joe', 'j'],
    orgId: '00D000000000000004',
  } as unknown as OrgAuthorization;

  beforeEach(() => {
    sandbox.restore();
  });

  it('gets all org shapes from org', async () => {
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

    const shapes = await getAllShapesFromOrg(joe);
    expect(shapes[0]).to.deep.equal({
      alias: 'joe,j',
      createdBy: joe.username,
      createdDate: '2022-03-21T19:04:53.000+0000',
      orgId: joe.orgId,
      shapeId: '3SR000000000123',
      status: 'Active',
      username: joe.username,
    });
  });

  it('fails to get org shapes', async () => {
    sandbox.stub(Org, 'create').resolves(hubOrgStub);

    hubOrgStub.getConnection.returns({
      query: sandbox
        .stub()
        .withArgs(
          "SELECT Id, Status, CreatedBy.Username, CreatedDate FROM ShapeRepresentation WHERE Status IN ( 'Active', 'InProgress' )"
        )
        .throws({
          errorCode: 'INVALID_TYPE',
          message: "sObject type 'ShapeRepresentation' is not supported",
        }),
    } as unknown as Connection);

    const shapes = await getAllShapesFromOrg(joe);
    expect(shapes.length).to.equal(0);
  });
});
