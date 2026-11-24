import {
  DoorSpec,
  FloorPlanSpec,
  HOUSE_FLOOR_PLAN,
  StaircaseSpec,
  WallSpec,
  WindowSpec,
} from './floorPlanData';

export interface WorldPoint2D {
  x: number;
  z: number;
}

export interface WallBoxSegment {
  cx: number;
  cy: number;
  cz: number;
  sx: number;
  sy: number;
  sz: number;
  kind: 'full' | 'header' | 'sill';
}

export interface StairStepGeometry {
  stepNumber: number;
  flightKind: 'flight_1' | 'landing_winders' | 'flight_2';
  topElevationFt: number;
  riserHeightFt: number;
  /** Center in plan feet (X, Y) */
  planCx: number;
  planCy: number;
  /** Dimensions in plan feet */
  planWidthX: number;
  planDepthY: number;
  /** For winder corner steps */
  isWinder: boolean;
  winderHalf?: 'south_east' | 'north_west';
}

/**
 * Formats decimal feet into architectural feet-inches notation (e.g. 37.5 -> 37'-6").
 */
export function formatFeetInches(decimalFeet: number): string {
  const totalInches = Math.round(decimalFeet * 12);
  const feet = Math.floor(totalInches / 12);
  const inches = totalInches % 12;
  return `${feet}'-${inches}"`;
}

/**
 * Maps 2D architectural plan coordinates (origin at SW exterior corner, +X East, +Y North)
 * into centered 3D Three.js world coordinates (+X East, -Z North, +Z South).
 */
export function planToWorld(
  planX: number,
  planY: number,
  plan: FloorPlanSpec = HOUSE_FLOOR_PLAN,
): WorldPoint2D {
  const halfW = plan.overall.exteriorWidthFt / 2;
  const halfD = plan.overall.exteriorDepthFt / 2;
  return {
    x: planX - halfW,
    z: halfD - planY,
  };
}

interface WallOpening {
  start: number;
  end: number;
  bottomFt: number;
  topFt: number;
}

/**
 * Decomposes a wall into non-overlapping 3D box segments around doors and windows.
 * Coordinate output is in centered Three.js world space (feet).
 */
export function computeWallSegments(
  wall: WallSpec,
  doors: DoorSpec[],
  windows: WindowSpec[],
  wallHeightFt: number,
  plan: FloorPlanSpec = HOUSE_FLOOR_PLAN,
): WallBoxSegment[] {
  const isHoriz = wall.orientation === 'horizontal';
  const wallStart = isHoriz ? wall.startFt[0] : wall.startFt[1];
  const wallEnd = isHoriz ? wall.endFt[0] : wall.endFt[1];
  const wallFixed = isHoriz ? wall.startFt[1] : wall.startFt[0];

  const minCoord = Math.min(wallStart, wallEnd);
  const maxCoord = Math.max(wallStart, wallEnd);

  const openings: WallOpening[] = [];

  for (const door of doors) {
    if (door.wallId !== wall.id) continue;
    const center = isHoriz ? door.centerFt[0] : door.centerFt[1];
    const half = door.widthFt / 2;
    openings.push({
      start: Math.max(minCoord, center - half),
      end: Math.min(maxCoord, center + half),
      bottomFt: 0,
      topFt: Math.min(wallHeightFt, door.heightFt),
    });
  }

  for (const win of windows) {
    if (win.wallId !== wall.id) continue;
    const center = isHoriz ? win.centerFt[0] : win.centerFt[1];
    const half = win.widthFt / 2;
    openings.push({
      start: Math.max(minCoord, center - half),
      end: Math.min(maxCoord, center + half),
      bottomFt: win.sillHeightFt,
      topFt: win.headHeightFt,
    });
  }

  openings.sort((a, b) => a.start - b.start);

  const segments: WallBoxSegment[] = [];
  let cursor = minCoord;

  const pushBox = (
    spanStart: number,
    spanEnd: number,
    yBottom: number,
    yTop: number,
    kind: WallBoxSegment['kind'],
  ) => {
    const length = spanEnd - spanStart;
    const height = yTop - yBottom;
    if (length <= 0.001 || height <= 0.001) return;

    const midAlong = (spanStart + spanEnd) / 2;
    const planX = isHoriz ? midAlong : wallFixed;
    const planY = isHoriz ? wallFixed : midAlong;
    const world = planToWorld(planX, planY, plan);

    segments.push({
      cx: world.x,
      cy: (yBottom + yTop) / 2,
      cz: world.z,
      sx: isHoriz ? length : wall.thicknessFt,
      sy: height,
      sz: isHoriz ? wall.thicknessFt : length,
      kind,
    });
  };

  for (const op of openings) {
    if (op.start > cursor) {
      pushBox(cursor, op.start, 0, wallHeightFt, 'full');
    }

    if (op.bottomFt > 0) {
      const sillTop = Math.min(op.bottomFt, wallHeightFt);
      pushBox(op.start, op.end, 0, sillTop, 'sill');
    }

    if (wallHeightFt > op.topFt) {
      pushBox(op.start, op.end, op.topFt, wallHeightFt, 'header');
    }

    cursor = Math.max(cursor, op.end);
  }

  if (cursor < maxCoord) {
    pushBox(cursor, maxCoord, 0, wallHeightFt, 'full');
  }

  return segments;
}

/**
 * Generates exact geometry records for all 16 treads of the L-shaped roof staircase
 * (6 treads East->West + 2 corner winder steps + 8 treads South->North).
 */
export function computeStairSteps(staircase: StaircaseSpec): StairStepGeometry[] {
  const steps: StairStepGeometry[] = [];
  const rH = staircase.riserHeightFt;
  let stepNumber = 0;

  // Flight 1: East-to-West along South wall (x = 8.25 -> 3.75, y = 0.75..3.75)
  const flight1 = staircase.flights.find((f) => f.kind === 'flight_1');
  if (flight1) {
    const treadRun = (flight1.bounds.xMax - flight1.bounds.xMin) / flight1.treads;
    const stairDepthY = flight1.bounds.yMax - flight1.bounds.yMin;
    const cy = (flight1.bounds.yMin + flight1.bounds.yMax) / 2;

    for (let i = 0; i < flight1.treads; i++) {
      stepNumber += 1;
      const xRight = flight1.bounds.xMax - i * treadRun;
      const xLeft = xRight - treadRun;
      steps.push({
        stepNumber,
        flightKind: 'flight_1',
        topElevationFt: stepNumber * rH,
        riserHeightFt: rH,
        planCx: (xLeft + xRight) / 2,
        planCy: cy,
        planWidthX: treadRun,
        planDepthY: stairDepthY,
        isWinder: false,
      });
    }
  }

  // Corner landing / 2 winder steps at (x = 0.75..3.75, y = 0.75..3.75)
  const landing = staircase.flights.find((f) => f.kind === 'landing_winders');
  if (landing) {
    const cx = (landing.bounds.xMin + landing.bounds.xMax) / 2;
    const cy = (landing.bounds.yMin + landing.bounds.yMax) / 2;
    const w = landing.bounds.xMax - landing.bounds.xMin;
    const d = landing.bounds.yMax - landing.bounds.yMin;

    stepNumber += 1;
    steps.push({
      stepNumber,
      flightKind: 'landing_winders',
      topElevationFt: stepNumber * rH,
      riserHeightFt: rH,
      planCx: cx,
      planCy: cy,
      planWidthX: w,
      planDepthY: d,
      isWinder: true,
      winderHalf: 'south_east',
    });

    stepNumber += 1;
    steps.push({
      stepNumber,
      flightKind: 'landing_winders',
      topElevationFt: stepNumber * rH,
      riserHeightFt: rH,
      planCx: cx,
      planCy: cy,
      planWidthX: w,
      planDepthY: d,
      isWinder: true,
      winderHalf: 'north_west',
    });
  }

  // Flight 2: South-to-North along West wall (y = 3.75 -> 9.75, x = 0.75..3.75)
  const flight2 = staircase.flights.find((f) => f.kind === 'flight_2');
  if (flight2) {
    const treadRun = (flight2.bounds.yMax - flight2.bounds.yMin) / flight2.treads;
    const stairWidthX = flight2.bounds.xMax - flight2.bounds.xMin;
    const cx = (flight2.bounds.xMin + flight2.bounds.xMax) / 2;

    for (let i = 0; i < flight2.treads; i++) {
      stepNumber += 1;
      const yBottom = flight2.bounds.yMin + i * treadRun;
      const yTop = yBottom + treadRun;
      steps.push({
        stepNumber,
        flightKind: 'flight_2',
        topElevationFt: stepNumber * rH,
        riserHeightFt: rH,
        planCx: cx,
        planCy: (yBottom + yTop) / 2,
        planWidthX: stairWidthX,
        planDepthY: treadRun,
        isWinder: false,
      });
    }
  }

  return steps;
}

export interface ConsistencyReport {
  valid: boolean;
  errors: string[];
}

/**
 * Validates that the floor plan satisfies all architectural dimensional invariants.
 */
export function validateFloorPlanConsistency(
  plan: FloorPlanSpec = HOUSE_FLOOR_PLAN,
): ConsistencyReport {
  const errors: string[] = [];

  const master = plan.rooms.find((r) => r.id === 'master_bedroom');
  const bed2 = plan.rooms.find((r) => r.id === 'bedroom_2');
  const bed3 = plan.rooms.find((r) => r.id === 'bedroom_3');
  const patio = plan.rooms.find((r) => r.id === 'south_patio');
  const mainDoor = plan.doors.find((d) => d.id === 'door_main_entry');

  if (!master || master.widthFt !== 13 || master.depthFt !== 10) {
    errors.push('Master bedroom must be 13 ft x 10 ft');
  }
  if (!bed2 || bed2.widthFt !== 11 || bed2.depthFt !== 10) {
    errors.push('Bedroom 2 must be 11 ft x 10 ft');
  }
  if (!bed3 || bed3.widthFt !== 11 || bed3.depthFt !== 10) {
    errors.push('Bedroom 3 must be 11 ft x 10 ft');
  }
  if (!patio || patio.kind !== 'outdoor' || patio.bounds.yMax !== 0) {
    errors.push('South patio must be an outdoor space adjoining y = 0 South wall');
  }
  if (!mainDoor || mainDoor.centerFt[0] !== plan.overall.exteriorWidthFt / 2) {
    errors.push('Main entry door must be centered on the South exterior wall');
  }
  if (
    patio &&
    mainDoor &&
    (mainDoor.centerFt[0] <= patio.bounds.xMin || mainDoor.centerFt[0] >= patio.bounds.xMax)
  ) {
    errors.push('South patio must span across the Main Entry Door');
  }

  // Check each room's bounds match declared width/depth
  for (const room of plan.rooms) {
    const actualW = room.bounds.xMax - room.bounds.xMin;
    const actualD = room.bounds.yMax - room.bounds.yMin;
    if (Math.abs(actualW - room.widthFt) > 1e-4 || Math.abs(actualD - room.depthFt) > 1e-4) {
      errors.push(`Room ${room.id} bounds (${actualW}x${actualD}) do not match ${room.widthFt}x${room.depthFt}`);
    }
  }

  return { valid: errors.length === 0, errors };
}
