/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Messages, SfdxError, Org, Connection } from '@salesforce/core';
import { RecordResult } from 'jsforce';

interface JsForceError extends Error {
  errorCode: string;
  fields: string[];
}

Messages.importMessagesDirectory(__dirname);
const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.create');

interface ShapeRepresentation {
  Id: string;
  Status: string;
  Edition: string;
  Features: string;
  Settings: string;
  CreatedDate: string;
  Description: string;
}
/**
 * Shape API object, for all of your ShapeRepresentation needs
 *
 * @constructor
 * @param shapeOrg The org we'll be querying against
 */
class ShapeRepresentationApi {
  private conn: Connection;

  public constructor(shapeOrg: Org) {
    this.conn = shapeOrg.getConnection();
  }

  public async create(description = ''): Promise<RecordResult> {
    try {
      return this.conn.sobject('ShapeRepresentation').create({
        Description: description,
      });
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'NOT_FOUND' && JsForceErr['name'] === 'ACCESS_DENIED') {
        throw SfdxError.wrap(messages.getMessage('create_shape_command_no_crud_access'));
      } else {
        throw JsForceErr;
      }
    }
  }

  /**
   * Delete all ShapeRepresentation records for the shapeOrg.
   *
   * @return List of SR IDs that were deleted
   */
  public async deleteAll(): Promise<string[]> {
    let shapeIds = [];
    try {
      const result = await this.conn.query<ShapeRepresentation>('SELECT Id FROM ShapeRepresentation');
      shapeIds = result.records.map((shape) => shape.Id);
    } catch (err) {
      const JsForceErr = err as JsForceError;
      if (JsForceErr.errorCode && JsForceErr.errorCode === 'INVALID_TYPE') {
        // ShapeExportPref is not enabled, or user does not have CRUD access
        throw SfdxError.wrap(messages.getMessage('delete_shape_command_no_access', shapeIds));
      }
      // non-access error
      throw JsForceErr;
    }

    return Promise.all(
      shapeIds.map(async (id) => {
        try {
          const delResult: RecordResult = await this.conn.sobject('ShapeRepresentation').delete(id);
          if (delResult.success) {
            return delResult.id;
          }
        } catch (err) {
          return Promise.reject(err);
        }
      })
    );
  }

  /**
   * Check if the ShapeExportPilot preference is enabled.
   */
  public async isFeatureEnabled(): Promise<boolean> {
    const prefValue = await this.conn.tooling.query<{ IsShapeExportPrefEnabled: boolean }>(
      `SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`
    );
    // no records are returned if ShapeExportPilot perm is disabled
    return prefValue.totalSize > 0 && prefValue.records?.[0]?.IsShapeExportPrefEnabled;
  }

  public async getShapeRepresentation(shapeId: string): Promise<ShapeRepresentation> {
    if (!this.isShapeId(shapeId)) {
      throw new SfdxError(messages.getMessage('shape_get_not_a_shape_id'));
    }
    const query = `Select Id, Status, Edition, Features, Settings from ShapeRepresentation WHERE Id = '${shapeId}`;
    return this.conn.singleRecordQuery<ShapeRepresentation>(query);
  }

  public isShapeId(shapeId: string): boolean {
    return (
      shapeId.startsWith('3SR') &&
      shapeId.length >= 15 &&
      shapeId.length <= 18 &&
      /^[0-9a-zA-Z]+$/.exec(shapeId) != null
    );
  }
}

export { ShapeRepresentationApi };
