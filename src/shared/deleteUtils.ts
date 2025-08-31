/*
 * Copyright 2025, Salesforce, Inc.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

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
      Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
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
