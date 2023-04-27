/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect, assert } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { ShapeCreateResult } from '../../src/commands/org/create/shape';
import { OrgShapeListResult } from '../../src/shared/orgShapeListUtils';
import { OrgShapeDeleteResult } from '../../src/commands/org/delete/shape';

let session: TestSession;
let originalShapes: OrgShapeListResult[] | undefined;
let hubOrgUsername: string;
// there could be a shape for this org already.  That's ok.
let shapeAlreadyExists = false;
let newShapeId: string | undefined;

describe('org:shape commands', () => {
  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'AUTO' });
    assert(session.hubOrg.username, 'hubOrgUsername should be a string');
    hubOrgUsername = session.hubOrg.username;
  });

  it('finds existing org shapes', () => {
    originalShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    assert(Array.isArray(originalShapes), 'originalShapes should be an array');
    // verify the result structure
    originalShapes.forEach((shape) => {
      // they may or may not have an alias key
      expect(shape).to.have.keys(['username', 'shapeId', 'orgId', 'status', 'createdBy', 'createdDate']);
      if (shape.username === hubOrgUsername || (shape.alias && shape.alias === hubOrgUsername)) {
        shapeAlreadyExists = true;
      }
    });
  });

  it('creates a new shape', () => {
    newShapeId = execCmd<ShapeCreateResult>(`force:org:shape:create --json -u ${hubOrgUsername}`, {
      ensureExitCode: 0,
    }).jsonOutput?.result.shapeId;
    assert(newShapeId, 'newShapeId should be a string');
    expect(newShapeId).to.have.length(18);
    expect(newShapeId.startsWith('3SR')).to.be.true;
  });

  it('finds new shape in the list', () => {
    const modifiedShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    assert(Array.isArray(modifiedShapes), 'modifiedShapes should be an array');
    assert(Array.isArray(originalShapes), 'originalShapes should be an array');
    expect(modifiedShapes.length).to.equal(shapeAlreadyExists ? originalShapes.length : originalShapes.length + 1);
    expect(modifiedShapes.some((shape) => shape.shapeId === newShapeId)).to.be.true;
  });

  it('deletes the shape (no prompt)', () => {
    const deleteResult = execCmd<OrgShapeDeleteResult>(
      `force:org:shape:delete -u ${hubOrgUsername} --json --noprompt`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result;
    expect(deleteResult).to.have.all.keys(['orgId', 'shapeIds', 'failures']);
    expect(deleteResult?.shapeIds).to.include(newShapeId);
  });

  it('finds the shapes as it was before create', () => {
    const modifiedShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result;
    assert(Array.isArray(modifiedShapes), 'modifiedShapes should be an array');
    assert(Array.isArray(originalShapes), 'originalShapes should be an array');
    expect(modifiedShapes.length).to.equal(shapeAlreadyExists ? originalShapes.length - 1 : originalShapes.length);
    expect(
      modifiedShapes.some((shape) => {
        shape.shapeId === newShapeId;
      })
    ).to.be.false;
  });

  after(async () => {
    await session?.zip(undefined, 'artifacts');
    await session?.clean();
  });
});
