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

import { AuthInfo, Connection, Logger, Messages, Org, OrgAuthorization, SfError } from '@salesforce/core';
import { settleAll } from '@salesforce/kit';

type OrgShape = {
  Id: string;
  CreatedBy: {
    Username: string;
  };
  Status: string;
  CreatedDate: string;
}

export type OrgShapeListResult = {
  orgId: string;
  username: string;
  alias?: string;
  shapeId: string;
  status: string;
  createdBy: string;
  createdDate: string;
};

export type JsForceError = {
  errorCode: string;
  fields: string[];
} & Error

export async function getAllShapesFromOrg(orgAuth: OrgAuthorization): Promise<OrgShapeListResult[]> {
  const org = await Org.create({ aliasOrUsername: orgAuth.username });
  const conn = org.getConnection();
  const logger = await Logger.child(`getAllShapesFromOrg, ${orgAuth.username}`);
  logger.info(`Query org: ${orgAuth.username} for shapes`);
  try {
    const shapesFound = await conn.query<OrgShape>(
      "SELECT Id, Status, CreatedBy.Username, CreatedDate FROM ShapeRepresentation WHERE Status IN ( 'Active', 'InProgress' )"
    );
    return shapesFound.records.map((shape) => ({
      ...{
        orgId: orgAuth.orgId,
        username: orgAuth.username,
        shapeId: shape.Id,
        status: shape.Status,
        createdBy: shape.CreatedBy.Username,
        createdDate: shape.CreatedDate,
      },
      ...(orgAuth.aliases?.length ? { alias: orgAuth.aliases.join(',') } : {}),
    }));
  } catch (err) {
    const JsForceErr = err as JsForceError;
    if (JsForceErr.errorCode === 'INVALID_TYPE') {
      return [];
    } else {
      logger.error(false, 'Error finding org shapes', JsForceErr);
      const error = SfError.wrap(JsForceErr);
      Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
      const messages = Messages.loadMessages('@salesforce/plugin-signups', 'messages');
      error.message = messages.getMessage('errorWithOrg', [orgAuth.username, JsForceErr.message]);
      return Promise.reject(error);
    }
  }
}

/**
 * Check if the ShapeExportPilot preference is enabled.
 */
export async function isShapeEnabled(conn: Connection): Promise<boolean> {
  const prefValue = await conn.tooling.query<{ IsShapeExportPrefEnabled: boolean }>(
    `SELECT IsShapeExportPrefEnabled FROM ${'DevHubSettings'}`
  );
  // no records are returned if ShapeExportPilot perm is disabled
  return prefValue.totalSize > 0 && prefValue.records?.[0]?.IsShapeExportPrefEnabled;
}

export const getAllOrgShapesFromAuthenticatedOrgs = async (): Promise<{
  orgShapes: OrgShapeListResult[];
  errors: Error[];
}> => {
  const orgs = await AuthInfo.listAllAuthorizations((orgAuth) => !orgAuth.error && !orgAuth.isScratchOrg);
  if (orgs.length === 0) {
    Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
    const messages = Messages.loadMessages('@salesforce/plugin-signups', 'messages');
    throw messages.createError('noAuthFound');
  }
  const shapes = await settleAll<OrgShapeListResult[]>(orgs.map((o) => getAllShapesFromOrg(o)));

  return { orgShapes: shapes.fulfilled.flat(), errors: shapes.rejected };
};

export default {
  getAllOrgShapesFromAuthenticatedOrgs,
  isShapeEnabled,
  getAllShapesFromOrg,
};
