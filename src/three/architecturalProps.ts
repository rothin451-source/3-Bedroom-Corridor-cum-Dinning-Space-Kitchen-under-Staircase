import * as THREE from 'three';
import {
  DoorSpec,
  FloorPlanSpec,
  RoomSpec,
  StaircaseSpec,
  WindowSpec,
} from '../plan/floorPlanData';
import { computeStairSteps, planToWorld } from '../plan/geometryMath';
import { ArchitecturalMaterialLibrary } from './materials';

export interface AnimatedDoorHandle {
  id: string;
  pivot: THREE.Group;
  openSign: number;
}

export function buildDoorAssembly(
  door: DoorSpec,
  wallThicknessFt: number,
  mats: ArchitecturalMaterialLibrary,
): { group: THREE.Group; handle: AnimatedDoorHandle } {
  const group = new THREE.Group();
  const world = planToWorld(door.centerFt[0], door.centerFt[1]);
  group.position.set(world.x, 0, world.z);

  const w = door.widthFt;
  const h = door.heightFt;
  const jambThick = 0.14;
  const jambDepth = wallThicknessFt + 0.08;

  // 1. Frame: Left Jamb, Right Jamb, Head Casing, Threshold
  const jambGeo = new THREE.BoxGeometry(jambThick, h, jambDepth);
  const leftJamb = new THREE.Mesh(jambGeo, mats.doorFrame);
  leftJamb.position.set(-w / 2 + jambThick / 2, h / 2, 0);
  leftJamb.castShadow = true;
  leftJamb.receiveShadow = true;

  const rightJamb = new THREE.Mesh(jambGeo, mats.doorFrame);
  rightJamb.position.set(w / 2 - jambThick / 2, h / 2, 0);
  rightJamb.castShadow = true;
  rightJamb.receiveShadow = true;

  const headJamb = new THREE.Mesh(
    new THREE.BoxGeometry(w, jambThick, jambDepth),
    mats.doorFrame,
  );
  headJamb.position.set(0, h - jambThick / 2, 0);
  headJamb.castShadow = true;

  const threshold = new THREE.Mesh(
    new THREE.BoxGeometry(w, 0.04, jambDepth),
    mats.plinthConcrete,
  );
  threshold.position.set(0, 0.02, 0);
  threshold.receiveShadow = true;

  group.add(leftJamb, rightJamb, headJamb, threshold);

  // 2. Hinged Pivot & Composite Single Wooden Door Leaf
  const clearW = w - jambThick * 2;
  const clearH = h - jambThick - 0.04;
  const leafThick = 0.16;

  const pivot = new THREE.Group();
  const isWestHinge = door.hingeSide === 'west';
  pivot.position.set(isWestHinge ? -clearW / 2 : clearW / 2, 0.04, 0);

  const leafGroup = new THREE.Group();
  leafGroup.position.set(isWestHinge ? clearW / 2 : -clearW / 2, 0, 0);

  // Main door slab
  const slab = new THREE.Mesh(
    new THREE.BoxGeometry(clearW, clearH, leafThick),
    mats.doorTimber,
  );
  slab.position.set(0, clearH / 2, 0);
  slab.castShadow = true;
  slab.receiveShadow = true;
  leafGroup.add(slab);

  // Recessed/raised architectural shaker panels (front & back)
  const panelW = clearW * 0.66;
  const topPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, clearH * 0.36, leafThick + 0.03),
    mats.doorPanelDark,
  );
  topPanel.position.set(0, clearH * 0.7, 0);
  topPanel.castShadow = true;

  const bottomPanel = new THREE.Mesh(
    new THREE.BoxGeometry(panelW, clearH * 0.34, leafThick + 0.03),
    mats.doorPanelDark,
  );
  bottomPanel.position.set(0, clearH * 0.25, 0);
  bottomPanel.castShadow = true;

  // Brass escutcheon & lever handles on both sides
  const handleX = isWestHinge ? clearW * 0.38 : -clearW * 0.38;
  const plateGeo = new THREE.BoxGeometry(0.12, 0.42, leafThick + 0.05);
  const plate = new THREE.Mesh(plateGeo, mats.brassHardware);
  plate.position.set(handleX, 3.1, 0);

  const leverDir = isWestHinge ? -1 : 1;
  const leverGeo = new THREE.BoxGeometry(0.32, 0.06, 0.06);
  const leverFront = new THREE.Mesh(leverGeo, mats.brassHardware);
  leverFront.position.set(handleX + leverDir * 0.12, 3.12, leafThick / 2 + 0.08);
  const leverBack = new THREE.Mesh(leverGeo, mats.brassHardware);
  leverBack.position.set(handleX + leverDir * 0.12, 3.12, -leafThick / 2 - 0.08);

  leafGroup.add(topPanel, bottomPanel, plate, leverFront, leverBack);
  pivot.add(leafGroup);
  group.add(pivot);

  return {
    group,
    handle: {
      id: door.id,
      pivot,
      openSign: isWestHinge ? 1 : -1,
    },
  };
}

export function buildWindowAssembly(
  win: WindowSpec,
  wallThicknessFt: number,
  mats: ArchitecturalMaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const world = planToWorld(win.centerFt[0], win.centerFt[1]);
  const h = win.headHeightFt - win.sillHeightFt;
  const w = win.widthFt;
  const cy = win.sillHeightFt + h / 2;

  group.position.set(world.x, cy, world.z);
  if (win.orientation === 'vertical') {
    group.rotation.y = Math.PI / 2;
  }

  const frameThick = 0.12;
  const frameDepth = wallThicknessFt + 0.06;

  // Outer perimeter frame (4 parts)
  const topBar = new THREE.Mesh(
    new THREE.BoxGeometry(w, frameThick, frameDepth),
    mats.windowFrame,
  );
  topBar.position.set(0, h / 2 - frameThick / 2, 0);

  const botBar = new THREE.Mesh(
    new THREE.BoxGeometry(w, frameThick, frameDepth),
    mats.windowFrame,
  );
  botBar.position.set(0, -h / 2 + frameThick / 2, 0);

  const sideGeo = new THREE.BoxGeometry(frameThick, h - frameThick * 2, frameDepth);
  const leftBar = new THREE.Mesh(sideGeo, mats.windowFrame);
  leftBar.position.set(-w / 2 + frameThick / 2, 0, 0);
  const rightBar = new THREE.Mesh(sideGeo, mats.windowFrame);
  rightBar.position.set(w / 2 - frameThick / 2, 0, 0);

  // Center vertical mullion
  const mullion = new THREE.Mesh(
    new THREE.BoxGeometry(0.08, h - frameThick * 2, frameDepth * 0.75),
    mats.windowFrame,
  );

  // Projecting stone sill
  const sill = new THREE.Mesh(
    new THREE.BoxGeometry(w + 0.25, 0.1, wallThicknessFt + 0.28),
    mats.plinthConcrete,
  );
  sill.position.set(0, -h / 2 - 0.03, 0);
  sill.receiveShadow = true;

  // Glass pane
  const glass = new THREE.Mesh(
    new THREE.BoxGeometry(w - frameThick * 2, h - frameThick * 2, 0.05),
    mats.windowGlass,
  );

  group.add(topBar, botBar, leftBar, rightBar, mullion, sill, glass);
  return group;
}

export function buildRoofStaircase(
  staircase: StaircaseSpec,
  mats: ArchitecturalMaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const steps = computeStairSteps(staircase);

  const treadThick = 0.14;
  const rH = staircase.riserHeightFt;

  // Build each step (tread + riser)
  for (const step of steps) {
    if (step.isWinder) {
      // Corner landing / winder step using extruded triangle at SW corner (0.75..3.75, 0.75..3.75)
      const pMin = planToWorld(0.75, 0.75);
      const pMax = planToWorld(3.75, 3.75);
      const x0 = pMin.x;
      const x1 = pMax.x;
      const zSouth = pMin.z;
      const zNorth = pMax.z;

      const shape = new THREE.Shape();
      if (step.winderHalf === 'south_east') {
        shape.moveTo(x0, -zSouth);
        shape.lineTo(x1, -zSouth);
        shape.lineTo(x0, -zNorth);
        shape.closePath();
      } else {
        shape.moveTo(x1, -zSouth);
        shape.lineTo(x1, -zNorth);
        shape.lineTo(x0, -zNorth);
        shape.closePath();
      }

      const geo = new THREE.ExtrudeGeometry(shape, {
        depth: treadThick,
        bevelEnabled: false,
      });
      geo.rotateX(-Math.PI / 2);

      const mesh = new THREE.Mesh(geo, mats.stairOak);
      mesh.position.y = step.topElevationFt - treadThick;
      mesh.castShadow = true;
      mesh.receiveShadow = true;
      group.add(mesh);

      // Supporting riser box below the winder tread
      const riserHeight = rH;
      const riserGeo = new THREE.ExtrudeGeometry(shape, {
        depth: riserHeight,
        bevelEnabled: false,
      });
      riserGeo.rotateX(-Math.PI / 2);
      const riserMesh = new THREE.Mesh(riserGeo, mats.stairRiser);
      riserMesh.position.y = step.topElevationFt - riserHeight - treadThick * 0.2;
      group.add(riserMesh);
    } else {
      const world = planToWorld(step.planCx, step.planCy);

      const treadMesh = new THREE.Mesh(
        new THREE.BoxGeometry(step.planWidthX + 0.04, treadThick, step.planDepthY + 0.02),
        mats.stairOak,
      );
      treadMesh.position.set(world.x, step.topElevationFt - treadThick / 2, world.z);
      treadMesh.castShadow = true;
      treadMesh.receiveShadow = true;
      group.add(treadMesh);

      const riserW = step.flightKind === 'flight_1' ? 0.08 : step.planWidthX;
      const riserD = step.flightKind === 'flight_1' ? step.planDepthY : 0.08;
      const riserOffsetX = step.flightKind === 'flight_1' ? step.planWidthX / 2 - 0.04 : 0;
      const riserOffsetZ = step.flightKind === 'flight_2' ? step.planDepthY / 2 - 0.04 : 0;

      const riserMesh = new THREE.Mesh(
        new THREE.BoxGeometry(riserW, rH, riserD),
        mats.stairRiser,
      );
      riserMesh.position.set(
        world.x + riserOffsetX,
        step.topElevationFt - rH / 2 - treadThick * 0.5,
        world.z + riserOffsetZ,
      );
      riserMesh.castShadow = true;
      riserMesh.receiveShadow = true;
      group.add(riserMesh);
    }
  }

  // Diagonal Steel Stringers supporting Flight 1 & Flight 2
  const addStringer = (
    p1: [number, number, number],
    p2: [number, number, number],
    width: number,
  ) => {
    const w1 = planToWorld(p1[0], p1[2]);
    const w2 = planToWorld(p2[0], p2[2]);
    const v1 = new THREE.Vector3(w1.x, p1[1], w1.z);
    const v2 = new THREE.Vector3(w2.x, p2[1], w2.z);
    const len = v1.distanceTo(v2);
    const mid = v1.clone().add(v2).multiplyScalar(0.5);
    const dir = v2.clone().sub(v1).normalize();
    const beam = new THREE.Mesh(
      new THREE.BoxGeometry(width, 0.45, len),
      mats.stairStringerSteel,
    );
    beam.position.copy(mid);
    beam.lookAt(v2);
    beam.castShadow = true;
    group.add(beam);
    void dir;
  };

  addStringer([8.25, 0.25, 3.65], [3.75, 3.45, 3.65], 0.14);
  addStringer([8.25, 0.25, 0.85], [3.75, 3.45, 0.85], 0.14);
  addStringer([3.65, 4.75, 3.75], [3.65, 9.65, 9.75], 0.14);
  addStringer([0.85, 4.75, 3.75], [0.85, 9.65, 9.75], 0.14);

  // Handrails & Newel Posts along the open interior edge
  const postMat = mats.stairStringerSteel;
  const railMat = mats.stairOak;

  const postPositions: Array<[number, number, number, number]> = [
    [8.2, 0.0, 3.65, 3.4],
    [3.8, 3.7, 3.65, 3.2],
    [3.8, 9.8, 9.65, 3.2],
  ];

  for (const [px, pyBase, pyPlan, h] of postPositions) {
    const w = planToWorld(px, pyPlan);
    const post = new THREE.Mesh(new THREE.BoxGeometry(0.16, h, 0.16), postMat);
    post.position.set(w.x, pyBase + h / 2, w.z);
    post.castShadow = true;

    const cap = new THREE.Mesh(new THREE.BoxGeometry(0.22, 0.08, 0.22), mats.brassHardware);
    cap.position.set(w.x, pyBase + h + 0.04, w.z);
    group.add(post, cap);
  }

  // Handrail tubes using TubeGeometry
  const pStart1 = planToWorld(8.2, 3.65);
  const pTurn = planToWorld(3.8, 3.65);
  const pEnd2 = planToWorld(3.8, 9.65);

  const railCurve1 = new THREE.LineCurve3(
    new THREE.Vector3(pStart1.x, 3.2, pStart1.z),
    new THREE.Vector3(pTurn.x, 6.7, pTurn.z),
  );
  const rail1 = new THREE.Mesh(new THREE.TubeGeometry(railCurve1, 8, 0.075, 10, false), railMat);
  rail1.castShadow = true;

  const railCurve2 = new THREE.LineCurve3(
    new THREE.Vector3(pTurn.x, 6.7, pTurn.z),
    new THREE.Vector3(pEnd2.x, 12.8, pEnd2.z),
  );
  const rail2 = new THREE.Mesh(new THREE.TubeGeometry(railCurve2, 8, 0.075, 10, false), railMat);
  rail2.castShadow = true;

  // Balusters along Flight 1 & Flight 2
  const balusterGeo = new THREE.CylinderGeometry(0.03, 0.03, 2.75, 8);
  for (let i = 1; i <= 5; i++) {
    const t = i / 6;
    const x = THREE.MathUtils.lerp(pStart1.x, pTurn.x, t);
    const z = THREE.MathUtils.lerp(pStart1.z, pTurn.z, t);
    const yBase = THREE.MathUtils.lerp(0.6, 3.7, t);
    const bal = new THREE.Mesh(balusterGeo, postMat);
    bal.position.set(x, yBase + 1.35, z);
    group.add(bal);
  }
  for (let i = 1; i <= 6; i++) {
    const t = i / 7;
    const x = THREE.MathUtils.lerp(pTurn.x, pEnd2.x, t);
    const z = THREE.MathUtils.lerp(pTurn.z, pEnd2.z, t);
    const yBase = THREE.MathUtils.lerp(4.9, 9.8, t);
    const bal = new THREE.Mesh(balusterGeo, postMat);
    bal.position.set(x, yBase + 1.35, z);
    group.add(bal);
  }

  group.add(rail1, rail2);
  return group;
}

export function buildKitchenUnderStair(mats: ArchitecturalMaterialLibrary): THREE.Group {
  const group = new THREE.Group();

  // Helper to build counter base + toe-kick + quartz top
  const addCounterBlock = (
    xMin: number,
    yMin: number,
    xMax: number,
    yMax: number,
    height = 3.0,
  ) => {
    const cx = (xMin + xMax) / 2;
    const cy = (yMin + yMax) / 2;
    const w = xMax - xMin;
    const d = yMax - yMin;
    const world = planToWorld(cx, cy);

    const toeKick = new THREE.Mesh(
      new THREE.BoxGeometry(w - 0.14, 0.3, d - 0.14),
      mats.stairStringerSteel,
    );
    toeKick.position.set(world.x, 0.15, world.z);

    const cabinet = new THREE.Mesh(
      new THREE.BoxGeometry(w, height - 0.45, d),
      mats.kitchenCabinet,
    );
    cabinet.position.set(world.x, 0.3 + (height - 0.45) / 2, world.z);
    cabinet.castShadow = true;
    cabinet.receiveShadow = true;

    const top = new THREE.Mesh(
      new THREE.BoxGeometry(w + 0.08, 0.15, d + 0.08),
      mats.kitchenCounterQuartz,
    );
    top.position.set(world.x, height - 0.075, world.z);
    top.castShadow = true;
    top.receiveShadow = true;

    group.add(toeKick, cabinet, top);
  };

  // 1. West Prep & Sink Counter (under upper stair flight 2)
  addCounterBlock(0.85, 4.9, 3.05, 9.65);

  // Stainless Sink & Arched Faucet
  const sinkWorld = planToWorld(1.95, 7.2);
  const sinkBasin = new THREE.Mesh(
    new THREE.BoxGeometry(1.5, 0.08, 2.0),
    mats.stainlessSteel,
  );
  sinkBasin.position.set(sinkWorld.x, 3.02, sinkWorld.z);

  const faucetCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(sinkWorld.x - 0.55, 3.04, sinkWorld.z),
    new THREE.Vector3(sinkWorld.x - 0.55, 3.85, sinkWorld.z),
    new THREE.Vector3(sinkWorld.x - 0.2, 4.05, sinkWorld.z),
    new THREE.Vector3(sinkWorld.x - 0.05, 3.68, sinkWorld.z),
  ]);
  const faucet = new THREE.Mesh(
    new THREE.TubeGeometry(faucetCurve, 14, 0.04, 8, false),
    mats.stainlessSteel,
  );
  group.add(sinkBasin, faucet);

  // 2. North Cooking Range Counter (full-height bay)
  addCounterBlock(3.05, 7.65, 7.2, 9.65);

  const stoveWorld = planToWorld(5.1, 8.65);
  const cooktop = new THREE.Mesh(
    new THREE.BoxGeometry(2.3, 0.08, 1.5),
    mats.applianceDark,
  );
  cooktop.position.set(stoveWorld.x, 3.04, stoveWorld.z);
  group.add(cooktop);

  const burnerOffsets: Array<[number, number]> = [
    [-0.58, -0.35],
    [0.58, -0.35],
    [-0.58, 0.35],
    [0.58, 0.35],
  ];
  const burnerGeo = new THREE.CylinderGeometry(0.24, 0.26, 0.04, 16);
  for (const [bx, bz] of burnerOffsets) {
    const burner = new THREE.Mesh(burnerGeo, mats.stainlessSteel);
    burner.position.set(stoveWorld.x + bx, 3.09, stoveWorld.z + bz);
    group.add(burner);
  }

  // Overhead Chimney Range Hood
  const hoodFlue = new THREE.Mesh(
    new THREE.BoxGeometry(0.85, 2.4, 0.75),
    mats.stainlessSteel,
  );
  hoodFlue.position.set(stoveWorld.x, 7.2, stoveWorld.z);
  const hoodCanopy = new THREE.Mesh(
    new THREE.BoxGeometry(2.5, 0.42, 1.6),
    mats.stainlessSteel,
  );
  hoodCanopy.position.set(stoveWorld.x, 5.8, stoveWorld.z);
  hoodCanopy.castShadow = true;
  group.add(hoodFlue, hoodCanopy);

  // 3. East-Facing Serving Bar Counter + 2 Bar Stools
  addCounterBlock(6.55, 4.35, 8.2, 7.65);

  const addStool = (px: number, py: number) => {
    const sw = planToWorld(px, py);
    const stool = new THREE.Group();
    stool.position.set(sw.x, 0, sw.z);

    const seat = new THREE.Mesh(
      new THREE.CylinderGeometry(0.62, 0.58, 0.18, 18),
      mats.fabricSlate,
    );
    seat.position.y = 2.18;
    seat.castShadow = true;

    const legGeo = new THREE.CylinderGeometry(0.05, 0.04, 2.15, 8);
    for (let i = 0; i < 4; i++) {
      const ang = (i * Math.PI) / 2 + Math.PI / 4;
      const leg = new THREE.Mesh(legGeo, mats.stairStringerSteel);
      leg.position.set(Math.cos(ang) * 0.38, 1.07, Math.sin(ang) * 0.38);
      leg.rotation.z = Math.cos(ang) * 0.08;
      leg.rotation.x = -Math.sin(ang) * 0.08;
      stool.add(leg);
    }

    const footRing = new THREE.Mesh(
      new THREE.TorusGeometry(0.4, 0.03, 8, 20),
      mats.brassHardware,
    );
    footRing.rotation.x = Math.PI / 2;
    footRing.position.y = 0.72;

    stool.add(seat, footRing);
    group.add(stool);
  };

  addStool(8.85, 5.2);
  addStool(8.85, 6.8);

  return group;
}

export function buildDiningSet(mats: ArchitecturalMaterialLibrary): THREE.Group {
  const group = new THREE.Group();
  const centerWorld = planToWorld(12.5, 3.6);
  group.position.set(centerWorld.x, 0, centerWorld.z);

  // Contact shadow disc under dining zone
  const shadowDisc = new THREE.Mesh(new THREE.CircleGeometry(3.2, 24), mats.contactShadow);
  shadowDisc.rotation.x = -Math.PI / 2;
  shadowDisc.position.y = 0.015;
  group.add(shadowDisc);

  // Walnut Tabletop + Apron + 4 Tapered Legs
  const tableW = 4.6;
  const tableD = 2.8;
  const tableH = 2.55;

  const top = new THREE.Mesh(
    new THREE.BoxGeometry(tableW, 0.16, tableD),
    mats.walnutWood,
  );
  top.position.y = tableH;
  top.castShadow = true;
  top.receiveShadow = true;

  const apron = new THREE.Mesh(
    new THREE.BoxGeometry(tableW - 0.5, 0.24, tableD - 0.5),
    mats.walnutWood,
  );
  apron.position.y = tableH - 0.18;

  const legGeo = new THREE.CylinderGeometry(0.11, 0.07, tableH - 0.08, 10);
  const legOffsets: Array<[number, number]> = [
    [-tableW / 2 + 0.35, -tableD / 2 + 0.35],
    [tableW / 2 - 0.35, -tableD / 2 + 0.35],
    [-tableW / 2 + 0.35, tableD / 2 - 0.35],
    [tableW / 2 - 0.35, tableD / 2 - 0.35],
  ];
  for (const [lx, lz] of legOffsets) {
    const leg = new THREE.Mesh(legGeo, mats.walnutWood);
    leg.position.set(lx, (tableH - 0.08) / 2, lz);
    leg.castShadow = true;
    group.add(leg);
  }

  // Ceramic centerpiece vase
  const vasePts = [
    new THREE.Vector2(0, 0),
    new THREE.Vector2(0.22, 0),
    new THREE.Vector2(0.28, 0.25),
    new THREE.Vector2(0.14, 0.52),
    new THREE.Vector2(0.18, 0.62),
  ];
  const vase = new THREE.Mesh(new THREE.LatheGeometry(vasePts, 18), mats.fabricCream);
  vase.position.y = tableH + 0.08;
  vase.castShadow = true;

  group.add(top, apron, vase);

  // 4 Upholstered Dining Chairs
  const addChair = (cx: number, cz: number, rotY: number) => {
    const chair = new THREE.Group();
    chair.position.set(cx, 0, cz);
    chair.rotation.y = rotY;

    const seat = new THREE.Mesh(new THREE.BoxGeometry(1.35, 0.18, 1.35), mats.fabricCream);
    seat.position.y = 1.48;
    seat.castShadow = true;

    const backrest = new THREE.Mesh(new THREE.BoxGeometry(1.35, 1.25, 0.16), mats.fabricSlate);
    backrest.position.set(0, 2.15, -0.6);
    backrest.castShadow = true;

    const cLegGeo = new THREE.CylinderGeometry(0.05, 0.04, 1.45, 8);
    for (const [lx, lz] of [
      [-0.55, -0.55],
      [0.55, -0.55],
      [-0.55, 0.55],
      [0.55, 0.55],
    ]) {
      const leg = new THREE.Mesh(cLegGeo, mats.walnutWood);
      leg.position.set(lx, 0.72, lz);
      chair.add(leg);
    }

    chair.add(seat, backrest);
    group.add(chair);
  };

  addChair(-1.1, -1.75, 0);
  addChair(1.1, -1.75, 0);
  addChair(-1.1, 1.75, Math.PI);
  addChair(1.1, 1.75, Math.PI);

  return group;
}

export function buildBedroomSuite(
  room: RoomSpec,
  isMaster: boolean,
  mats: ArchitecturalMaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const bedCenterX = (room.bounds.xMin + room.bounds.xMax) / 2 + (isMaster ? 0.6 : 0);
  const bedTopY = room.bounds.yMax - 0.15;
  const bedDepth = isMaster ? 6.6 : 6.2;
  const bedWidth = isMaster ? 5.6 : 4.8;

  const world = planToWorld(bedCenterX, bedTopY - bedDepth / 2);

  // Woven area rug slightly above oak floor (y = 0.025 to prevent Z-fighting)
  const rug = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth + 2.6, 0.03, bedDepth + 1.4),
    isMaster ? mats.fabricSlate : room.id === 'bedroom_2' ? mats.fabricTeal : mats.fabricIndigo,
  );
  rug.position.set(world.x, 0.025, world.z + 0.35);
  rug.receiveShadow = true;
  group.add(rug);

  const bedGroup = new THREE.Group();
  bedGroup.position.set(world.x, 0.04, world.z);

  // 1. Timber Base Frame & Corner Legs
  const legGeo = new THREE.CylinderGeometry(0.1, 0.08, 0.45, 8);
  for (const [lx, lz] of [
    [-bedWidth / 2 + 0.25, -bedDepth / 2 + 0.25],
    [bedWidth / 2 - 0.25, -bedDepth / 2 + 0.25],
    [-bedWidth / 2 + 0.25, bedDepth / 2 - 0.25],
    [bedWidth / 2 - 0.25, bedDepth / 2 - 0.25],
  ]) {
    const leg = new THREE.Mesh(legGeo, mats.walnutWood);
    leg.position.set(lx, 0.22, lz);
    bedGroup.add(leg);
  }

  const baseFrame = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth + 0.2, 0.45, bedDepth + 0.15),
    mats.walnutWood,
  );
  baseFrame.position.y = 0.65;
  baseFrame.castShadow = true;
  baseFrame.receiveShadow = true;

  // 2. Tufted Headboard (North side: -Z)
  const headboard = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth + 0.45, 3.2, 0.35),
    isMaster ? mats.fabricSlate : mats.walnutWood,
  );
  headboard.position.set(0, 1.85, -bedDepth / 2 + 0.15);
  headboard.castShadow = true;

  // 3. Mattress
  const mattress = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth - 0.1, 0.72, bedDepth - 0.35),
    mats.fabricCream,
  );
  mattress.position.set(0, 1.24, 0.12);
  mattress.castShadow = true;
  mattress.receiveShadow = true;

  // 4. Folded Duvet Blanket
  const duvetMat = isMaster
    ? mats.fabricSlate
    : room.id === 'bedroom_2'
      ? mats.fabricTeal
      : mats.fabricIndigo;
  const duvet = new THREE.Mesh(
    new THREE.BoxGeometry(bedWidth + 0.08, 0.26, bedDepth * 0.62),
    duvetMat,
  );
  duvet.position.set(0, 1.54, bedDepth * 0.16);
  duvet.castShadow = true;

  // 5. Pillows
  const pillowGeo = new THREE.BoxGeometry(bedWidth * 0.38, 0.32, 1.15);
  const pLeft = new THREE.Mesh(pillowGeo, mats.fabricCream);
  pLeft.position.set(-bedWidth * 0.22, 1.72, -bedDepth / 2 + 1.05);
  pLeft.rotation.x = 0.22;
  pLeft.castShadow = true;

  const pRight = new THREE.Mesh(pillowGeo, mats.fabricCream);
  pRight.position.set(bedWidth * 0.22, 1.72, -bedDepth / 2 + 1.05);
  pRight.rotation.x = 0.22;
  pRight.castShadow = true;

  bedGroup.add(baseFrame, headboard, mattress, duvet, pLeft, pRight);
  group.add(bedGroup);

  // 6. Nightstands + Warm Table Lamps
  const addNightstand = (offsetX: number) => {
    const ns = new THREE.Group();
    ns.position.set(world.x + offsetX, 0, world.z - bedDepth / 2 + 0.9);

    const body = new THREE.Mesh(new THREE.BoxGeometry(1.45, 1.55, 1.35), mats.walnutWood);
    body.position.y = 0.775;
    body.castShadow = true;
    body.receiveShadow = true;

    const lampBase = new THREE.Mesh(
      new THREE.CylinderGeometry(0.18, 0.24, 0.35, 12),
      mats.brassHardware,
    );
    lampBase.position.y = 1.72;

    const shade = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28, 0.42, 0.55, 16),
      mats.lampShade,
    );
    shade.position.y = 2.15;

    ns.add(body, lampBase, shade);
    group.add(ns);
  };

  addNightstand(-bedWidth / 2 - 1.05);
  addNightstand(bedWidth / 2 + 1.05);

  // 7. Built-in Wardrobe Cabinet against room corner
  const wardPlanX = isMaster ? room.bounds.xMin + 1.3 : room.bounds.xMin + 1.2;
  const wardPlanY = room.bounds.yMax - 2.3;
  if (!isMaster && room.id === 'bedroom_3') {
    // Put wardrobe on west wall of bedroom 3? No, there's a window at y=15.25; put on south-west corner!
    const wWorld = planToWorld(room.bounds.xMin + 1.4, room.bounds.yMin + 1.3);
    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.4, 5.2, 1.8), mats.walnutWood);
    wardrobe.position.set(wWorld.x, 2.6, wWorld.z);
    wardrobe.castShadow = true;
    wardrobe.receiveShadow = true;
    group.add(wardrobe);
  } else if (isMaster) {
    const wWorld = planToWorld(wardPlanX, wardPlanY);
    const wardrobe = new THREE.Mesh(new THREE.BoxGeometry(2.0, 5.2, 4.2), mats.walnutWood);
    wardrobe.position.set(wWorld.x, 2.6, wWorld.z);
    wardrobe.castShadow = true;
    wardrobe.receiveShadow = true;
    group.add(wardrobe);
  }

  return group;
}

export function buildExteriorContext(
  plan: FloorPlanSpec,
  mats: ArchitecturalMaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();

  // Landscaped Ground Lawn Plane
  const lawn = new THREE.Mesh(new THREE.PlaneGeometry(180, 180), mats.lawnGround);
  lawn.rotation.x = -Math.PI / 2;
  lawn.position.y = -0.45;
  lawn.receiveShadow = true;
  group.add(lawn);

  // Architectural Concrete Foundation Plinth (extends 0.6 ft around perimeter)
  const plinth = new THREE.Mesh(
    new THREE.BoxGeometry(
      plan.overall.exteriorWidthFt + 1.4,
      0.45,
      plan.overall.exteriorDepthFt + 1.4,
    ),
    mats.plinthConcrete,
  );
  plinth.position.set(0, -0.225, 0);
  plinth.receiveShadow = true;
  group.add(plinth);

  // Centered South Entry Patio Terrace (22'-0" x 7'-0": x = 8.25..30.25, y = -7.0..0.0)
  const patioCenter = planToWorld(19.25, -3.5);
  const patioDeck = new THREE.Mesh(new THREE.BoxGeometry(22.0, 0.42, 7.0), mats.stoneWalkway);
  patioDeck.position.set(patioCenter.x, -0.21, patioCenter.z);
  patioDeck.receiveShadow = true;
  group.add(patioDeck);

  // Subtle patio perimeter stone curb
  const patioTrim = new THREE.Mesh(new THREE.BoxGeometry(22.3, 0.12, 7.3), mats.plinthConcrete);
  patioTrim.position.set(patioCenter.x, -0.39, patioCenter.z);
  patioTrim.receiveShadow = true;
  group.add(patioTrim);

  // Twin Planter Boxes flanking the South Patio against the South exterior wall
  const addPlanter = (px: number, py: number) => {
    const pw = planToWorld(px, py);
    const planter = new THREE.Group();
    planter.position.set(pw.x, 0, pw.z);

    const box = new THREE.Mesh(new THREE.BoxGeometry(2.6, 1.3, 1.4), mats.plinthConcrete);
    box.position.y = 0.65;
    box.castShadow = true;
    box.receiveShadow = true;

    const shrub1 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.62, 1), mats.foliageGreen);
    shrub1.position.set(-0.52, 1.5, 0);
    shrub1.castShadow = true;

    const shrub2 = new THREE.Mesh(new THREE.DodecahedronGeometry(0.54, 1), mats.foliageGreen);
    shrub2.position.set(0.52, 1.45, 0);
    shrub2.castShadow = true;

    planter.add(box, shrub1, shrub2);
    group.add(planter);
  };
  addPlanter(9.9, -1.2);
  addPlanter(28.6, -1.2);

  // Outdoor Lounge Bench + Teak Coffee Table (East Patio Zone)
  const benchWorld = planToWorld(24.7, -3.4);
  const bench = new THREE.Group();
  bench.position.set(benchWorld.x, 0, benchWorld.z);
  const benchSeat = new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.25, 2.1), mats.walnutWood);
  benchSeat.position.y = 1.15;
  benchSeat.castShadow = true;
  const benchCushion = new THREE.Mesh(new THREE.BoxGeometry(2.2, 0.22, 1.8), mats.fabricTeal);
  benchCushion.position.y = 1.38;
  const benchBack = new THREE.Mesh(new THREE.BoxGeometry(2.4, 1.1, 0.22), mats.walnutWood);
  benchBack.position.set(0, 1.75, -0.95);
  benchBack.castShadow = true;
  bench.add(benchSeat, benchCushion, benchBack);
  for (const [lx, lz] of [
    [-1.0, -0.85],
    [1.0, -0.85],
    [-1.0, 0.85],
    [1.0, 0.85],
  ]) {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.14, 1.1, 0.14), mats.stairStringerSteel);
    leg.position.set(lx, 0.55, lz);
    bench.add(leg);
  }
  group.add(bench);

  const coffeeWorld = planToWorld(27.5, -3.3);
  const coffeeTable = new THREE.Group();
  coffeeTable.position.set(coffeeWorld.x, 0, coffeeWorld.z);
  const ctTop = new THREE.Mesh(new THREE.BoxGeometry(2.0, 0.14, 1.4), mats.walnutWood);
  ctTop.position.y = 1.15;
  ctTop.castShadow = true;
  const ctBase = new THREE.Mesh(new THREE.BoxGeometry(1.7, 1.05, 1.1), mats.stairStringerSteel);
  ctBase.position.y = 0.525;
  coffeeTable.add(ctTop, ctBase);
  group.add(coffeeTable);

  // West Patio Bistro Table + 2 Chairs
  const bistroWorld = planToWorld(12.2, -4.0);
  const bistro = new THREE.Group();
  bistro.position.set(bistroWorld.x, 0, bistroWorld.z);
  const bTop = new THREE.Mesh(new THREE.CylinderGeometry(1.05, 1.05, 0.1, 18), mats.walnutWood);
  bTop.position.y = 2.3;
  bTop.castShadow = true;
  const bStem = new THREE.Mesh(new THREE.CylinderGeometry(0.08, 0.12, 2.2, 10), mats.stairStringerSteel);
  bStem.position.y = 1.15;
  const bFoot = new THREE.Mesh(new THREE.CylinderGeometry(0.55, 0.6, 0.08, 16), mats.stairStringerSteel);
  bFoot.position.y = 0.04;
  bistro.add(bTop, bStem, bFoot);
  group.add(bistro);

  // Centered South Patio Steps descending to Garden Walkway (x = 18.75, y = -7.0)
  const patioExitWorld = planToWorld(18.75, -7.0);
  const porchStep1 = new THREE.Mesh(new THREE.BoxGeometry(5.2, 0.22, 1.2), mats.stoneWalkway);
  porchStep1.position.set(patioExitWorld.x, -0.15, patioExitWorld.z + 0.6);
  porchStep1.receiveShadow = true;

  const porchStep2 = new THREE.Mesh(new THREE.BoxGeometry(5.6, 0.16, 1.2), mats.stoneWalkway);
  porchStep2.position.set(patioExitWorld.x, -0.34, patioExitWorld.z + 1.8);
  porchStep2.receiveShadow = true;

  const walkway = new THREE.Mesh(new THREE.BoxGeometry(4.8, 0.08, 12.0), mats.stoneWalkway);
  walkway.position.set(patioExitWorld.x, -0.41, patioExitWorld.z + 8.2);
  walkway.receiveShadow = true;

  group.add(porchStep1, porchStep2, walkway);

  // 4 Multi-part Architectural Trees framing the site (grounded + contact shadow)
  const addTree = (wx: number, wz: number, scale: number) => {
    const tree = new THREE.Group();
    tree.position.set(wx, -0.45, wz);

    const shadow = new THREE.Mesh(new THREE.CircleGeometry(3.2 * scale, 18), mats.contactShadow);
    shadow.rotation.x = -Math.PI / 2;
    shadow.position.y = 0.02;

    const trunk = new THREE.Mesh(
      new THREE.CylinderGeometry(0.28 * scale, 0.45 * scale, 3.6 * scale, 10),
      mats.treeTrunk,
    );
    trunk.position.y = 1.8 * scale;
    trunk.castShadow = true;

    const canopy1 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(2.1 * scale, 1),
      mats.foliageGreen,
    );
    canopy1.position.set(0, 4.2 * scale, 0);
    canopy1.castShadow = true;

    const canopy2 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.5 * scale, 1),
      mats.foliageGreen,
    );
    canopy2.position.set(0.9 * scale, 5.4 * scale, 0.4 * scale);
    canopy2.castShadow = true;

    const canopy3 = new THREE.Mesh(
      new THREE.DodecahedronGeometry(1.3 * scale, 1),
      mats.foliageGreen,
    );
    canopy3.position.set(-0.8 * scale, 5.1 * scale, -0.5 * scale);
    canopy3.castShadow = true;

    tree.add(shadow, trunk, canopy1, canopy2, canopy3);
    group.add(tree);
  };

  addTree(-25.5, -14.5, 1.1);
  addTree(26.0, -14.0, 1.0);
  addTree(-26.5, 14.5, 0.92);
  addTree(25.5, 15.0, 1.05);

  return group;
}

export function buildRoofSlabGroup(
  plan: FloorPlanSpec,
  mats: ArchitecturalMaterialLibrary,
): THREE.Group {
  const group = new THREE.Group();
  const w = plan.overall.exteriorWidthFt + 1.2;
  const d = plan.overall.exteriorDepthFt + 1.2;
  const slabThick = 0.5;

  // Build roof shape with stairwell opening over Flight 2 (x = 0.75..3.75, y = 3.75..9.75)
  const sw = planToWorld(-0.6, -0.6);
  const ne = planToWorld(plan.overall.exteriorWidthFt + 0.6, plan.overall.exteriorDepthFt + 0.6);

  const shape = new THREE.Shape();
  shape.moveTo(sw.x, -sw.z);
  shape.lineTo(ne.x, -sw.z);
  shape.lineTo(ne.x, -ne.z);
  shape.lineTo(sw.x, -ne.z);
  shape.closePath();

  // Stairwell opening hole
  const holeMin = planToWorld(0.75, 3.75);
  const holeMax = planToWorld(3.75, 9.75);
  const hole = new THREE.Path();
  hole.moveTo(holeMin.x, -holeMin.z);
  hole.lineTo(holeMax.x, -holeMin.z);
  hole.lineTo(holeMax.x, -holeMax.z);
  hole.lineTo(holeMin.x, -holeMax.z);
  hole.closePath();
  shape.holes.push(hole);

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: slabThick,
    bevelEnabled: false,
  });
  geo.rotateX(-Math.PI / 2);

  const roofMesh = new THREE.Mesh(geo, mats.roofSlab);
  roofMesh.position.y = plan.overall.ceilingHeightFt;
  group.add(roofMesh);

  // Subtle roof stairwell parapet curb around opening
  const curbMat = mats.cutawayCap;
  const curbH = 1.2;
  const curbTop = plan.overall.ceilingHeightFt + slabThick + curbH / 2;
  const eastCurb = new THREE.Mesh(new THREE.BoxGeometry(0.25, curbH, 6.2), curbMat);
  const eastCurbWorld = planToWorld(3.875, 6.75);
  eastCurb.position.set(eastCurbWorld.x, curbTop, eastCurbWorld.z);

  const northCurb = new THREE.Mesh(new THREE.BoxGeometry(3.25, curbH, 0.25), curbMat);
  const northCurbWorld = planToWorld(2.25, 9.875);
  northCurb.position.set(northCurbWorld.x, curbTop, northCurbWorld.z);

  group.add(eastCurb, northCurb);
  void w;
  void d;
  return group;
}
