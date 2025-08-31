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
  new Ux().table({
    data: Object.entries(snapshotRecord)
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
    columns: ['Name', 'Value'],
  });
};

export const printRecordTable = (snapshotRecords: OrgSnapshot[]): void => {
  if (snapshotRecords.length === 0) {
    new Ux().log('No snapshots found');
    return;
  }
  new Ux().table({
    data: snapshotRecords.map((s) => ({
      Id: s.Id,
      'Snapshot Name': s.SnapshotName,
      Status: s.Status,
      'Source Org Id': s.SourceOrg,
      'Created Date': dateTimeFormatter(s.CreatedDate),
      'Last Modified Date': dateTimeFormatter(s.LastModifiedDate),
      'Expiration Date': s.ExpirationDate ? new Date(s.ExpirationDate).toLocaleDateString() : '',
    })),
    title: `Org Snapshots [${snapshotRecords.length}]`,
    overflow: 'wrap',
  });
};
