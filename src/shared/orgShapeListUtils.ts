/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { basename, join } from 'path';
import { AuthInfo, fs, Global, Org, Logger, Aliases } from '@salesforce/core';

interface OrgShape {
  Id: string;
  CreatedBy: {
    Username: string;
  };
  Status: string;
  CreatedDate: string;
}

export interface OrgShapeListResult {
  orgId: string;
  username: string;
  alias?: string;
  shapeId: string;
  status: string;
  createdBy: string;
  createdDate: string;
}

interface JsForceError extends Error {
  errorCode: string;
  fields: string[];
}

const getNonScratchOrgs = async (fileNames: string[]): Promise<AuthInfo[]> => {
  const orgFileNames = (await fs.readdir(Global.DIR)).filter((filename) => filename.match(/^00D.{15}\.json$/g));

  const allAuths: AuthInfo[] = await Promise.all(
    fileNames.map(async (fileName) => {
      try {
        const orgUsername = basename(fileName, '.json');
        const auth = await AuthInfo.create({ username: orgUsername });

        const userId = auth?.getFields().userId;

        // no userid?  Definitely an org primary user
        if (!userId) {
          return auth;
        }
        const orgId = auth.getFields().orgId;

        const orgFileName = `${orgId}.json`;
        // if userId, it could be created from password:generate command.  If <orgId>.json doesn't exist, it's also not a secondary user auth file
        if (orgId && !orgFileNames.includes(orgFileName)) {
          return auth;
        }
        // Theory: within <orgId>.json, if the userId is the first entry, that's the primary username.
        if (orgFileNames.includes(orgFileName)) {
          const usernames = ((await fs.readJson(join(Global.DIR, orgFileName))) as { usernames: string[] }).usernames;
          if (usernames && usernames[0] === auth.getFields().username) {
            return auth;
          }
        }
      } catch (error) {
        const logger = await Logger.child('getNonScratchOrgs');
        logger.warn(`Problem reading file: ${fileName} skipping`);
      }
      return undefined;
    })
  );
  return allAuths.filter((auth) => !!auth).filter((auth) => !auth.getFields().devHubUsername);
};

const getAllShapesFromOrg = async (authInfo: AuthInfo): Promise<OrgShapeListResult[]> => {
  const org = await Org.create({ aliasOrUsername: authInfo.getFields().username });
  const conn = org.getConnection();
  const logger = await Logger.child(`getAllShapesFromOrg, ${authInfo.getFields().username}`);
  logger.info(`Query org: ${authInfo.getFields().username} for shapes`);
  try {
    const shapesFound = await conn.query<OrgShape>(
      "SELECT Id, Status, CreatedBy.Username, CreatedDate FROM ShapeRepresentation WHERE Status IN ( 'Active', 'InProgress' )"
    );
    return shapesFound.records.map((shape) => ({
      orgId: authInfo.getFields().orgId,
      username: authInfo.getFields().username,
      alias: authInfo.getFields().alias,
      shapeId: shape.Id,
      status: shape.Status,
      createdBy: shape.CreatedBy.Username,
      createdDate: shape.CreatedDate,
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
};

export const getAllOrgShapesFromAuthenticatedOrgs = async (): Promise<OrgShapeListResult[]> => {
  const aliases = await Aliases.create(Aliases.getDefaultOptions());
  const authInfos = await getNonScratchOrgs(await AuthInfo.listAllAuthFiles());
  const shapes = await Promise.all(authInfos.map((authInfo) => getAllShapesFromOrg(authInfo)));
  return shapes.flat().map((item) => ({ ...item, alias: aliases.getKeysByValue(item.username)?.[0] }));
};
