/*
 * Copyright (c) 2023, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
import { dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Messages, Connection } from '@salesforce/core';
import { JsForceError } from './orgShapeListUtils.js';

type ShapeRepresentation = {
  Id: string;
  Status: string;
  Edition: string;
  Features: string;
  Settings: string;
  CreatedDate: string;
  Description: string;
};

export type FailureMsg = {
  shapeId: string;
  message: string;
};

export type DeleteAllResult = {
  shapeIds: string[];
  failures: FailureMsg[];
};

/**
 * Delete all ShapeRepresentation records for the shapeOrg.
 *
 * @return List of SR IDs that were deleted
 */
export const deleteAll = async (conn: Connection, username: string): Promise<DeleteAllResult> => {
  let shapeIds: string[] = [];
  const deleteAllResult: DeleteAllResult = {
    shapeIds: [],
    failures: [],
  };
  try {
    const result = await conn.query<ShapeRepresentation>('SELECT Id FROM ShapeRepresentation');
    if (result.totalSize === 0) {
      return deleteAllResult;
    }
    shapeIds = result.records.map((shape) => shape.Id);
  } catch (err) {
    const JsForceErr = err as JsForceError;
    if (JsForceErr.errorCode && JsForceErr.errorCode === 'INVALID_TYPE') {
      Messages.importMessagesDirectory(dirname(fileURLToPath(import.meta.url)));
      const messages = Messages.loadMessages('@salesforce/plugin-signups', 'shape.delete');

      // ShapeExportPref is not enabled, or user does not have CRUD access
      throw messages.createError('noAccess', [username]);
    }
    // non-access error
    throw JsForceErr;
  }

  await Promise.all(
    shapeIds.map(async (id) => {
      try {
        const delResult = await conn.sobject('ShapeRepresentation').delete(id);
        if (delResult.success) {
          deleteAllResult.shapeIds.push(id);
        }
      } catch (err) {
        deleteAllResult.failures.push({
          shapeId: id,
          message: err instanceof Error ? err.message : 'error contained no message',
        });
      }
    })
  );

  return deleteAllResult;
};

export default {
  deleteAll,
};
