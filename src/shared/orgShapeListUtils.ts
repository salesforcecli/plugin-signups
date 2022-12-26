/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { OrgAuthorization, Org, Logger, Connection } from '@salesforce/core';

interface OrgShape {
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

export interface JsForceError extends Error {
  errorCode: string;
  fields: string[];
}

// it only really uses 3 properties from the Authorization type
export async function getAllShapesFromOrg(
  orgAuth: Pick<OrgAuthorization, 'orgId' | 'username'> & Partial<Pick<OrgAuthorization, 'aliases'>>
): Promise<OrgShapeListResult[]> {
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
      ...(orgAuth.aliases?.length > 0 ? { alias: orgAuth.aliases.join(',') } : {}),
    }));
  } catch (err) {
    const JsForceErr = err as JsForceError;
    if (JsForceErr.errorCode === 'INVALID_TYPE') {
      return [];
    } else {
      logger.error(false, 'Error finding org shapes', JsForceErr);
      throw JsForceErr;
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
