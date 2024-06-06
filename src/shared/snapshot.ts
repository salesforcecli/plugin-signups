/*
 * Copyright (c) 2020, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { Ux } from '@salesforce/sf-plugins-core';
import { Connection, SfError, Messages } from '@salesforce/core';
import { capitalCase } from 'change-case';

Messages.importMessagesDirectoryFromMetaUrl(import.meta.url);
export const messages = Messages.loadMessages('@salesforce/plugin-signups', 'snapshot');

export type OrgSnapshotRequest = {
  SourceOrg: string;
  SnapshotName: string;
  Description: string;
  Content?: string;
};

export type OrgSnapshot = OrgSnapshotRequest & {
  Id: string;
  Status: string;
  CreatedDate: string;
  LastModifiedDate: string;
  ExpirationDate?: string;
  Error?: string;
};

export const ORG_SNAPSHOT_FIELDS = [
  'Id',
  'SnapshotName',
  'Description',
  'Status',
  'SourceOrg',
  'CreatedDate',
  'LastModifiedDate',
  'ExpirationDate',
  'Error',
];
const dateTimeFormatter = (dateString?: string): string =>
  dateString
    ? new Date(dateString).toLocaleString(undefined, {
        month: '2-digit',
        year: 'numeric',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
      })
    : '';

const rowDateTimeFormatter = (row: OrgSnapshot, field: keyof OrgSnapshot): string => dateTimeFormatter(row[field]);

const ORG_SNAPSHOT_COLUMNS = {
  Id: {},
  SnapshotName: { header: 'Snapshot Name' },
  Status: {},
  SourceOrg: { header: 'Source Org Id' },
  CreatedDate: {
    header: 'Created Date',
    get: (row: OrgSnapshot): string => rowDateTimeFormatter(row, 'CreatedDate'),
  },
  LastModifiedDate: {
    header: 'Last Modified Date',
    get: (row: OrgSnapshot): string => rowDateTimeFormatter(row, 'LastModifiedDate'),
  },
  ExpirationDate: {
    header: 'Expiration Date',
    get: (row: OrgSnapshot): string => (row.ExpirationDate ? new Date(row.ExpirationDate).toLocaleDateString() : ''),
  },
};

export const invalidTypeErrorHandler = (e: unknown): never => {
  if (e instanceof Error && e.name === 'INVALID_TYPE') {
    e.message = messages.getMessage('snapshotNotEnabled');
  }
  throw e;
};

export const queryAll = async (conn: Connection): Promise<OrgSnapshot[]> => {
  const query = `SELECT ${ORG_SNAPSHOT_FIELDS.join(',')} FROM OrgSnapshot Order by CreatedDate`;
  try {
    const result = (await conn.query<OrgSnapshot>(query)).records;
    return result;
  } catch (e) {
    return invalidTypeErrorHandler(e);
  }
};

export const queryByNameOrId = async (conn: Connection, nameOrId: string): Promise<OrgSnapshot> => {
  const query = `SELECT ${ORG_SNAPSHOT_FIELDS.join(',')} FROM OrgSnapshot WHERE ${
    nameOrId.startsWith('0Oo') ? 'Id' : 'SnapshotName'
  } = '${nameOrId}'`;
  try {
    const result = await conn.singleRecordQuery<OrgSnapshot>(query);
    return result;
  } catch (e) {
    if (e instanceof SfError && e.name === 'SingleRecordQuery_NoRecords') {
      e.message = messages.getMessage('noSnapshots', [nameOrId]);
    }
    return invalidTypeErrorHandler(e);
  }
};

export const printSingleRecordTable = (snapshotRecord: OrgSnapshot): void => {
  new Ux().table(
    Object.entries(snapshotRecord)
      .filter(([key]) => key !== 'attributes')
      // remove empty error field
      .filter(([key, value]) => key !== 'Error' || typeof value === 'string')
      // every field on the type is a string
      .map(([key, value]: [string, string]) => ({
        Name: capitalCase(key),
        // format the datetime values
        Value: ['LastModifiedDate', 'CreatedDate'].includes(key) ? dateTimeFormatter(value) : value,
      }))
      // null/undefined becomes empty string
      .map((row) => (row.Value ? row : { ...row, Value: '' })),
    { Name: {}, Value: {} }
  );
};

export const printRecordTable = (snapshotRecords: OrgSnapshot[]): void => {
  if (snapshotRecords.length === 0) {
    new Ux().log('No snapshots found');
    return;
  }

  new Ux().table(
    // we know what columns we want, so filter out the other fields
    snapshotRecords.map((s) =>
      Object.fromEntries(Object.entries(s).filter(([key]) => Object.keys(ORG_SNAPSHOT_COLUMNS).includes(key)))
    ),
    ORG_SNAPSHOT_COLUMNS,
    { title: `Org Snapshots [${snapshotRecords.length}]`, 'no-truncate': true }
  );
};
