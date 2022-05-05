/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { CliUx } from '@oclif/core';
import { Connection } from '@salesforce/core';
import { capitalCase } from 'change-case';

export interface OrgSnapshotRequest {
  SourceOrg: string;
  SnapshotName: string;
  Description: string;
  Content?: string;
}

export interface OrgSnapshot extends OrgSnapshotRequest {
  Id: string;
  Status: string;
  LastClonedDate?: string;
  LastClonedById?: string;
  CreatedDate: string;
  LastModifiedDate: string;
  ExpirationDate?: string;
  Error?: string;
}

export const ORG_SNAPSHOT_FIELDS = [
  'Id',
  'SnapshotName',
  'Description',
  'Status',
  'SourceOrg',
  'CreatedDate',
  'LastModifiedDate',
  'ExpirationDate',
  'LastClonedDate',
  'LastClonedById',
  'Error',
];

const rowDateTimeFormmater = (row: OrgSnapshot, field: string): string =>
  new Date(row[field]).toLocaleString(undefined, {
    month: '2-digit',
    year: 'numeric',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });

const ORG_SNAPSHOT_COLUMNS = {
  Id: {},
  SnapshotName: { header: 'Snapshot Name' },
  Status: {},
  SourceOrg: { header: 'Source Org Id' },
  CreatedDate: {
    header: 'Created Date',
    get: (row: OrgSnapshot): string => rowDateTimeFormmater(row, 'CreatedDate'),
  },
  LastModifiedDate: {
    header: 'Last Modified Date',
    get: (row: OrgSnapshot): string => rowDateTimeFormmater(row, 'LastModifiedDate'),
  },
  ExpirationDate: {
    header: 'Expiration Date',
    get: (row: OrgSnapshot): string => new Date(row.ExpirationDate).toLocaleDateString(),
  },
  LastClonedDate: {
    header: 'Last Cloned Date',
    get: (row: OrgSnapshot): string => rowDateTimeFormmater(row, 'LastClonedDate'),
  },
  LastClonedById: { header: 'Last Cloned By Id' },
};

export const queryAll = async (conn: Connection): Promise<OrgSnapshot[]> => {
  const query = `SELECT ${ORG_SNAPSHOT_FIELDS.join(',')} FROM OrgSnapshot Order by CreatedDate`;
  return (await conn.query<OrgSnapshot>(query)).records;
};

export const queryByNameOrId = async (conn: Connection, nameOrId: string): Promise<OrgSnapshot> => {
  const query = `SELECT ${ORG_SNAPSHOT_FIELDS.join(',')} FROM OrgSnapshot WHERE ${
    nameOrId.startsWith('0Oo') ? 'Id' : 'SnapshotName'
  } = '${nameOrId}'`;
  return conn.singleRecordQuery<OrgSnapshot>(query);
};

export const printSingleRecordTable = (snapshotRecord: OrgSnapshot): void => {
  CliUx.ux.table(
    Object.entries(snapshotRecord)
      .filter(([key]) => key !== 'attributes')
      .map(([key, value]) => ({ Name: capitalCase(key), Value: value as string })),
    { Name: {}, Value: {} }
  );
};

export const printRecordTable = (snapshotRecords: OrgSnapshot[]): void => {
  CliUx.ux.table(
    // snapshotRecords,
    snapshotRecords.map((s) => ({ ...s })),
    ORG_SNAPSHOT_COLUMNS
  );
};
