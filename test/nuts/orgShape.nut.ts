/*
 * Copyright (c) 2022, salesforce.com, inc.
 * All rights reserved.
 * Licensed under the BSD 3-Clause license.
 * For full license text, see LICENSE.txt file in the repo root or https://opensource.org/licenses/BSD-3-Clause
 */

import { expect } from 'chai';
import { TestSession, execCmd } from '@salesforce/cli-plugins-testkit';
import { ShapeCreateResult } from '../../src/commands/org/create/shape.js';
import { OrgShapeListResult } from '../../src/shared/orgShapeListUtils.js';
import { OrgShapeDeleteResult } from '../../src/commands/org/delete/shape.js';

let session: TestSession;
let originalShapes: OrgShapeListResult[];
let hubOrgUsername: string;
// there could be a shape for this org already.  That's ok.
let shapeAlreadyExists = false;
let newShapeId: string;

describe('org:shape commands', () => {
  before(async () => {
    session = await TestSession.create({ devhubAuthStrategy: 'AUTO' });
    hubOrgUsername = session.hubOrg.username as string;
  });

  it('finds existing org shapes', () => {
    originalShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgShapeListResult[];
    expect(originalShapes).to.be.an('array');
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
    }).jsonOutput?.result.shapeId as string;
    expect(newShapeId).to.be.a('string').with.length(18);
    expect(newShapeId.startsWith('3SR')).to.be.true;
  });

  it('finds new shape in the list', () => {
    const modifiedShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgShapeListResult[];
    expect(modifiedShapes.length).to.equal(shapeAlreadyExists ? originalShapes.length : originalShapes.length + 1);
    expect(modifiedShapes.some((shape) => shape.shapeId === newShapeId)).to.be.true;
  });

  it('deletes the shape (no prompt)', () => {
    const deleteResult = execCmd<OrgShapeDeleteResult>(
      `force:org:shape:delete -u ${hubOrgUsername} --json --noprompt`,
      {
        ensureExitCode: 0,
      }
    ).jsonOutput?.result as OrgShapeDeleteResult;
    expect(deleteResult).to.have.all.keys(['orgId', 'shapeIds', 'failures']);
    expect(deleteResult.shapeIds).to.include(newShapeId);
  });

  it('finds the shapes as it was before create', () => {
    const modifiedShapes = execCmd<OrgShapeListResult[]>('force:org:shape:list --json', {
      ensureExitCode: 0,
    }).jsonOutput?.result as OrgShapeListResult[];
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
