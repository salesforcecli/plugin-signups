/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */
/* eslint-disable sf-plugin/no-execcmd-double-quotes */

import path from 'node:path';
import chaiString from 'chai-string';
import { expect, use } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { AuthFields, trimTo15 } from '@salesforce/core';
import { OrgSnapshot, ORG_SNAPSHOT_FIELDS } from '../../src/shared/snapshot.js';

use(chaiString);
let session: TestSession;
let scratchUsername: string;

const alias = 'snapNutAlias';
let orgId: string;
let orgIdKey: string;
let orgIdSnapshot: OrgSnapshot;
let usernameSnapshot: OrgSnapshot;
let aliasSnapshot: OrgSnapshot;
const expectedFields = [...ORG_SNAPSHOT_FIELDS, 'attributes'];

const aliasDescription = 'by alias';
const usernameDescription = 'by username';
const orgIdDescription = 'by orgId';

describe('snapshot commands', () => {
  before(async () => {
    session = await TestSession.create({
      project: {
        name: 'snapshots',
      },
      devhubAuthStrategy: 'AUTO',
      scratchOrgs: [
        {
          alias,
          config: path.join('config', 'project-scratch-def.json'),
        },
      ],
    });
    const org = session.orgs.get(alias) as AuthFields;
    orgId = org.orgId as string;
    orgIdKey = trimTo15(orgId).replace('00D', '');
    scratchUsername = org.username as string;
  });

  it('creates a new snapshot by username', () => {
    usernameSnapshot = execCmd<OrgSnapshot>(
      `force:org:snapshot:create --json -o ${scratchUsername} -d "${usernameDescription}" -n un_${orgIdKey}`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as OrgSnapshot;
    expect(usernameSnapshot).to.have.all.keys(expectedFields);
    expect(usernameSnapshot.Id).startsWith('0Oo');
  });

  it('creates a new snapshot by orgId', () => {
    orgIdSnapshot = execCmd<OrgSnapshot>(
      `force:org:snapshot:create --json -o ${orgId} -d "${orgIdDescription}" -n id_${orgIdKey}`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as OrgSnapshot;
    expect(orgIdSnapshot).to.have.all.keys(expectedFields);
    expect(orgIdSnapshot.Id).startsWith('0Oo');
  });

  it('creates a new snapshot by alias', () => {
    aliasSnapshot = execCmd<OrgSnapshot>(
      `force:org:snapshot:create --json -o ${alias} -d "${aliasDescription}" -n a_${orgIdKey}`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as OrgSnapshot;
    expect(aliasSnapshot).to.have.all.keys(expectedFields);
    expect(aliasSnapshot.Id).startsWith('0Oo');
  });

  it('finds new snapshots in the list', () => {
    const snapshots = execCmd<OrgSnapshot[]>('force:org:snapshot:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgSnapshot[];
    // there could be others leftover or from other tests.  That's ok.
    expect(snapshots).to.have.length.greaterThanOrEqual(3);
    expect(snapshots.find((s) => s.SnapshotName === `un_${orgIdKey}`)).to.have.property(
      'Description',
      usernameDescription
    );
    expect(snapshots.find((s) => s.SnapshotName === `id_${orgIdKey}`)).to.have.property(
      'Description',
      orgIdDescription
    );
    expect(snapshots.find((s) => s.SnapshotName === `a_${orgIdKey}`)).to.have.property('Description', aliasDescription);
  });

  it('stdout tables formatting for list', () => {
    const table = execCmd('force:org:snapshot:list', {
      ensureExitCode: 0,
    }).shellOutput.stdout;
    expect(table).to.include('Snapshot Name');
    expect(table).to.not.include('SnapshotName');

    // time fixes
    expect(table).not.to.include('.000+0000');
  });

  it('can get a snapshot by id', () => {
    const snapshot = execCmd<OrgSnapshot>(`force:org:snapshot:get -s ${aliasSnapshot.Id} --json`, {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgSnapshot;
    expect(snapshot).to.have.all.keys(expectedFields);
    expect(snapshot.Description).to.equal(aliasDescription);
  });

  it('can get a snapshot by name', () => {
    const snapshot = execCmd<OrgSnapshot>(`force:org:snapshot:get -s ${orgIdSnapshot.SnapshotName} --json`, {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgSnapshot;
    expect(snapshot).to.have.all.keys(expectedFields);
    expect(snapshot.Description).to.equal(orgIdDescription);
  });

  it('stdout tables formatting for get', () => {
    const table = execCmd(`force:org:snapshot:get -s ${usernameSnapshot.Id}`, {
      ensureExitCode: 0,
    }).shellOutput.stdout;
    expect(table).to.include('Snapshot Name');
    expect(table).to.not.include('SnapshotName');

    // time fixes
    expect(table).not.to.include('.000+0000');
  });

  it('can delete a snapshot by id', () => {
    execCmd(`force:org:snapshot:delete -s ${aliasSnapshot.Id} --json`, {
      ensureExitCode: 0,
    });
  });

  it('can delete a snapshot by name', () => {
    execCmd(`force:org:snapshot:delete -s ${orgIdSnapshot.SnapshotName} --json`, {
      ensureExitCode: 0,
    });
  });

  it('can delete the last snapshot by name', () => {
    execCmd(`force:org:snapshot:delete -s ${usernameSnapshot.SnapshotName} --json`, {
      ensureExitCode: 0,
    });
  });

  it('fails at deleting the same snapshot twice', () => {
    execCmd(`force:org:snapshot:delete -s ${usernameSnapshot.SnapshotName} --json`, {
      ensureExitCode: 1,
    });
  });

  it('list shows all snapshots deleted', () => {
    const snapshots = execCmd<OrgSnapshot[]>('force:org:snapshot:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgSnapshot[];

    expect(snapshots.find((s) => s.SnapshotName === `un_${orgIdKey}`)).to.be.undefined;
    expect(snapshots.find((s) => s.SnapshotName === `id_${orgIdKey}`)).to.be.undefined;
    expect(snapshots.find((s) => s.SnapshotName === `a_${orgIdKey}`)).to.be.undefined;
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });
});
