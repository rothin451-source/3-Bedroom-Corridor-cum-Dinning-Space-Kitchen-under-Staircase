import test from 'node:test';
import assert from 'node:assert/strict';
import { HOUSE_FLOOR_PLAN } from './floorPlanData';
import {
  computeStairSteps,
  computeWallSegments,
  formatFeetInches,
  planToWorld,
  validateFloorPlanConsistency,
} from './geometryMath';

test('floor plan passes all dimensional consistency invariants', () => {
  const report = validateFloorPlanConsistency(HOUSE_FLOOR_PLAN);
  assert.equal(report.valid, true, `Unexpected validation errors: ${report.errors.join(', ')}`);
});

test('south outdoor patio extends 7 ft from South wall centered over Main Entry', () => {
  const patio = HOUSE_FLOOR_PLAN.rooms.find((r) => r.id === 'south_patio');
  assert.ok(patio);
  assert.equal(patio.kind, 'outdoor');
  assert.equal(patio.widthFt, 22);
  assert.equal(patio.depthFt, 7);
  assert.equal(patio.areaSqft, 154);
  assert.equal(patio.bounds.yMax, 0);
  assert.equal(patio.bounds.yMin, -7);
});

test('formatFeetInches formats decimal feet cleanly', () => {
  assert.equal(formatFeetInches(13), `13'-0"`);
  assert.equal(formatFeetInches(37.5), `37'-6"`);
  assert.equal(formatFeetInches(10.25), `10'-3"`);
});

test('planToWorld centers the 37.5 x 21 footprint around origin with North at -Z', () => {
  const sw = planToWorld(0, 0);
  const ne = planToWorld(37.5, 21.0);
  const center = planToWorld(18.75, 10.5);

  assert.equal(center.x, 0);
  assert.equal(center.z, 0);
  assert.equal(sw.x, -18.75);
  assert.equal(sw.z, 10.5);
  assert.equal(ne.x, 18.75);
  assert.equal(ne.z, -10.5);
});

test('computeWallSegments splits spine wall around all 3 south-facing bedroom doors', () => {
  const spineWall = HOUSE_FLOOR_PLAN.walls.find((w) => w.id === 'wall_corridor_bedroom_spine');
  assert.ok(spineWall, 'Spine wall must exist');

  const segments = computeWallSegments(
    spineWall,
    HOUSE_FLOOR_PLAN.doors,
    HOUSE_FLOOR_PLAN.windows,
    10.0,
  );

  const headers = segments.filter((s) => s.kind === 'header');
  const fulls = segments.filter((s) => s.kind === 'full');

  assert.equal(headers.length, 3, 'Should have 3 door header lintels above the 3 bedroom doors');
  assert.equal(fulls.length, 4, 'Should have 4 full-height wall segments flanking the 3 doors');

  // Header bottom should sit at door height (7.0 ft) and reach 10.0 ft
  for (const h of headers) {
    assert.equal(h.sy, 3.0);
    assert.equal(h.cy, 8.5);
  }
});

test('computeWallSegments leaves clean sill & header around windows', () => {
  const southWall = HOUSE_FLOOR_PLAN.walls.find((w) => w.id === 'wall_ext_south');
  assert.ok(southWall);

  const segments = computeWallSegments(
    southWall,
    HOUSE_FLOOR_PLAN.doors,
    HOUSE_FLOOR_PLAN.windows,
    10.0,
  );

  const sills = segments.filter((s) => s.kind === 'sill');
  const headers = segments.filter((s) => s.kind === 'header');
  assert.equal(sills.length, 2, 'South wall has 2 window sills');
  assert.equal(headers.length, 3, 'South wall has 2 window headers + 1 main entry door header');
});

test('computeStairSteps produces 16 ascending treads reaching ~9.88 ft before 17th roof riser', () => {
  const steps = computeStairSteps(HOUSE_FLOOR_PLAN.staircase);
  assert.equal(steps.length, 16);

  for (let i = 1; i < steps.length; i++) {
    assert.ok(
      steps[i].topElevationFt > steps[i - 1].topElevationFt,
      `Step ${steps[i].stepNumber} should be higher than previous`,
    );
  }

  const lastStep = steps[steps.length - 1];
  assert.ok(Math.abs(lastStep.topElevationFt - (16 * 10.5) / 17) < 1e-4);
  // Flight 2 top step must end inside the kitchen/stair bay near y = 9.75
  assert.ok(lastStep.planCy > 9.0 && lastStep.planCy < 9.75);
});
