/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable @typescript-eslint/no-unused-vars */
/* eslint-disable @typescript-eslint/require-await */

import { expect, use } from 'chai';

import * as chaiAsPromised from 'chai-as-promised';
import * as sinon from 'sinon';
import { stubMethod, fromStub, stubInterface, StubbedType } from '@salesforce/ts-sinon';
import * as jsforce from 'jsforce';
import { MyDomainResolver, Org, Connection, AuthInfo } from '@salesforce/core';
import { ShapeRepresentationApi } from '../../src/shared/shapeRepApi';

use(chaiAsPromised);

describe('ShapeRepApi', () => {
  const sandbox = sinon.createSandbox();
  const connectionStub = sinon.createStubInstance(Connection);
  const TEST_IP = '1.1.1.1';

  let testAuthInfoWithDomain: StubbedType<AuthInfo>;

  beforeEach(() => {
    stubMethod(sandbox, Org.prototype, 'getConnection').returns(connectionStub);

    connectionStub.sobject.withArgs('ShapeRepresentation').returns({
      create: sinon.stub().resolves(),
    } as unknown as jsforce.SObject<unknown>);

    connectionStub.sobject.throws();
  });

  afterEach(() => {
    sandbox.restore();
  });

  const sourceOrg = new Org({});

  describe('Create', () => {
    it('creates', async () => {
      const shapeRepApi = new ShapeRepresentationApi(sourceOrg);

      await shapeRepApi.create();

      expect(connectionStub.sobject.firstCall.args[0]).to.be.equal('ShapeRepresentation');
    });

    it('creates using a description', async () => {
      const shapeDesc = 'my description';

      const shapeRepApi = new ShapeRepresentationApi(sourceOrg);

      const createStub = sinon.stub();
      createStub.withArgs(sinon.match.has('Description', shapeDesc)).resolves();
      createStub.throws('`Description` property is not defined in the payload.');

      connectionStub.sobject.withArgs('ShapeRepresentation').returns({
        create: createStub,
      } as unknown as jsforce.SObject<unknown>);

      await shapeRepApi.create(shapeDesc);
    });
  });

  describe('isFeatureEnabled', () => {
    it('is enabled', async () => {
      sandbox.restore();

      testAuthInfoWithDomain = stubInterface<AuthInfo>(sandbox, {});

      sandbox.stub(jsforce.Connection.prototype, 'initialize').returns();
      sandbox
        .stub(jsforce.Connection.prototype, 'request')
        .onFirstCall()
        .resolves([{ version: '52.0' }]);
      sandbox.stub(MyDomainResolver.prototype, 'resolve').resolves(TEST_IP);

      const conn = await Connection.create({ authInfo: fromStub(testAuthInfoWithDomain) });

      stubMethod(sandbox, Org.prototype, 'getConnection').returns(conn);

      sandbox
        .stub(conn.tooling, 'query')
        .withArgs(`SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`)
        .resolves({
          done: true,
          totalSize: 1,
          records: [{ IsShapeExportPrefEnabled: true }],
        });

      const shapeRepApi = new ShapeRepresentationApi(sourceOrg);

      const enabled = await shapeRepApi.isFeatureEnabled();

      expect(enabled).to.be.true;
    });
  });
});
/*
  });

  describe('isFeatureEnabled', () => {
    it('is not enabled', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'efgh');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: false }],
            });
          },
        },
        { orgId: 'efgh' }
      );
      const enabled = await shapeRepApi.isFeatureEnabled();
      expect(enabled).to.equal(false);
    });

    it('has no results', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'ijkl');
            return Promise.resolve({ totalSize: 0 });
          },
        },
        { orgId: 'ijkl' }
      );
      const enabled = await shapeRepApi.isFeatureEnabled();
      expect(enabled).to.equal(false);
    });
  });

  describe('deleteAll', () => {
    it('handles no shape records properly', async function (): Promise<void> {
      const expectedIds = [];
      const shapeRepApi = new ShapeRepresentationApi(
        {
          query(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({ records: [] });
          },
          delete(org, sobject, id) {
            return Promise.reject(new Error('Should not get called'));
          },
        },
        { orgId: 'abcd' }
      );
      const resultSet = await shapeRepApi.deleteAll();
      expect(resultSet).to.have.same.members(expectedIds);
    });

    it('deletes records identified by query', async function (): Promise<void> {
      const expectedIds = ['123', '456', '789'];
      const shapeRepApi = new ShapeRepresentationApi(
        {
          query(org, soql) {
            expect(org).to.have.property('orgId', 'efgh');
            return Promise.resolve({
              records: [{ Id: '123' }, { Id: '456' }, { Id: '789' }],
            });
          },
          delete(org, sobject, id) {
            expect(org).to.have.property('orgId', 'efgh');
            expect(sobject).to.equal('ShapeRepresentation');
            expect(expectedIds).to.include(id);
            return Promise.resolve({ success: true, id });
          },
        },
        { orgId: 'efgh' }
      );
      const resultSet = await shapeRepApi.deleteAll();
      expect(resultSet).to.have.same.members(expectedIds);
    });

    it('handles exceptions in shape query', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          query(org, soql) {
            expect(org).to.have.property('orgId', 'ijkl');
            return Promise.reject(new Error('Simulated Error'));
          },
          delete(org, sobject, id) {
            return Promise.reject(new Error('Should not get called'));
          },
        },
        { orgId: 'ijkl' }
      );
      expect(shapeRepApi.deleteAll()).to.eventually.be.rejected.and.have.property('message', 'Simulated Error');
    });

    it('handles exceptions in shape delete', async function (): Promise<void> {
      const expectedIds = ['123'];
      const shapeRepApi = new ShapeRepresentationApi(
        {
          query(org, soql) {
            expect(org).to.have.property('orgId', 'mnop');
            return Promise.resolve({ records: [{ Id: '123' }] });
          },
          delete(org, sobject, id) {
            expect(org).to.have.property('orgId', 'mnop');
            expect(sobject).to.equal('ShapeRepresentation');
            expect(expectedIds).to.include(id);
            return Promise.reject(new Error('Simulated Error'));
          },
        },
        { orgId: 'mnop' }
      );
      expect(shapeRepApi.deleteAll()).to.eventually.be.rejected.and.have.property('message', 'Simulated Error');
    });
  });

  describe('isShapeId', () => {
    it('is shape id', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('3SR000000000123');
      expect(result).to.equal(true);
    });

    it('is long shape id', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('3SR000000000123abc');
      expect(result).to.equal(true);
    });

    it('is not a shape id, ttid', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('0TT000000000123abc');
      expect(result).to.equal(false);
    });

    it('is not a shape id, too long', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('3SR000000000123abcde');
      expect(result).to.equal(false);
    });

    it('is not a shape id, too long', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('3SR000000000123abcde');
      expect(result).to.equal(false);
    });

    it('is not a shape id, bad char', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId('3SR00$000000123');
      expect(result).to.equal(false);
    });

    it('is not a shape id, null', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId(null);
      expect(result).to.equal(false);
    });

    it('is not a shape id, undefined', async function (): Promise<void> {
      const shapeRepApi = new ShapeRepresentationApi(
        {
          toolingQuery(org, soql) {
            expect(org).to.have.property('orgId', 'abcd');
            return Promise.resolve({
              totalSize: 1,
              records: [{ SettingValue: true }],
            });
          },
        },
        { orgId: 'abcd' }
      );
      const result = shapeRepApi.isShapeId(undefined);
      expect(result).to.equal(false);
    });
  });
});
*/
