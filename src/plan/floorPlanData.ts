export type RoomId =
  | 'master_bedroom'
  | 'bedroom_2'
  | 'bedroom_3'
  | 'kitchen_under_staircase'
  | 'corridor_dining_space'
  | 'south_patio';

export interface Bounds2D {
  xMin: number;
  yMin: number;
  xMax: number;
  yMax: number;
}

export interface RoomSpec {
  id: RoomId;
  name: string;
  shortLabel: string;
  kind: 'interior' | 'outdoor';
  widthFt: number;
  depthFt: number;
  areaSqft: number;
  bounds: Bounds2D;
  floorMaterial: 'oak' | 'limestone' | 'kitchen_tile' | 'patio_stone';
  accentColor: string;
  doorId?: string;
  facing?: 'south' | 'east';
  sharedDividerWalls: string[];
  relationToInterior?: string;
  notes: string;
  cameraPreset: {
    position: [number, number, number];
    target: [number, number, number];
  };
}

export interface WallSpec {
  id: string;
  type: 'exterior' | 'interior_divider';
  orientation: 'horizontal' | 'vertical';
  thicknessFt: number;
  startFt: [number, number];
  endFt: [number, number];
}

export interface DoorSpec {
  id: string;
  label: string;
  roomId: RoomId;
  wallId: string;
  facing: 'south';
  material: 'wooden';
  doorType: 'single_wooden_door' | 'main_entry_wooden_door';
  widthFt: number;
  heightFt: number;
  centerFt: [number, number];
  spanXFt: [number, number];
  swing: 'inward_north';
  hingeSide: 'west' | 'east';
  notes: string;
}

export interface WindowSpec {
  id: string;
  roomId: RoomId;
  wallId: string;
  orientation: 'horizontal' | 'vertical';
  widthFt: number;
  sillHeightFt: number;
  headHeightFt: number;
  centerFt: [number, number];
}

export interface StairFlightSpec {
  id: string;
  kind: 'flight_1' | 'landing_winders' | 'flight_2';
  direction: 'east_to_west' | 'turn_north' | 'south_to_north';
  bounds: Bounds2D;
  treads: number;
  startFt?: [number, number];
  endFt?: [number, number];
}

export interface StaircaseSpec {
  id: string;
  type: 'L_shaped_with_winders';
  destination: string;
  totalRiseFt: number;
  risersCount: number;
  riserHeightFt: number;
  treadDepthFt: number;
  stairWidthFt: number;
  flights: StairFlightSpec[];
  kitchenHeadroomNote: string;
}

export interface FloorPlanSpec {
  project: string;
  units: 'feet';
  overall: {
    exteriorWidthFt: number;
    exteriorDepthFt: number;
    totalFootprintDepthWithPatioFt: number;
    grossAreaSqft: number;
    outdoorPatioAreaSqft: number;
    exteriorWallThicknessFt: number;
    interiorWallThicknessFt: number;
    ceilingHeightFt: number;
    roofSlabTopFt: number;
  };
  rooms: RoomSpec[];
  walls: WallSpec[];
  doors: DoorSpec[];
  windows: WindowSpec[];
  staircase: StaircaseSpec;
}

export const HOUSE_FLOOR_PLAN: FloorPlanSpec = {
  project: '3-Bedroom Residence with East-Facing Kitchen under Roof Staircase & South Patio',
  units: 'feet',
  overall: {
    exteriorWidthFt: 37.5,
    exteriorDepthFt: 21.0,
    totalFootprintDepthWithPatioFt: 28.0,
    grossAreaSqft: 787.5,
    outdoorPatioAreaSqft: 154.0,
    exteriorWallThicknessFt: 0.75,
    interiorWallThicknessFt: 0.5,
    ceilingHeightFt: 10.0,
    roofSlabTopFt: 10.5,
  },
  rooms: [
    {
      id: 'master_bedroom',
      name: 'Master Bedroom',
      shortLabel: 'Master Bed',
      kind: 'interior',
      widthFt: 13.0,
      depthFt: 10.0,
      areaSqft: 130.0,
      bounds: { xMin: 23.75, yMin: 10.25, xMax: 36.75, yMax: 20.25 },
      floorMaterial: 'oak',
      accentColor: '#2563eb',
      doorId: 'door_master_bedroom',
      facing: 'south',
      sharedDividerWalls: ['wall_divider_bed2_master'],
      notes:
        'Northeast corner suite (13\'-0" × 10\'-0") accessed via a South-facing single wooden door from the long corridor.',
      cameraPreset: {
        position: [12.5, 13.5, 9.5],
        target: [11.5, 1.5, -4.8],
      },
    },
    {
      id: 'bedroom_2',
      name: 'Bedroom 2',
      shortLabel: 'Bedroom 2',
      kind: 'interior',
      widthFt: 11.0,
      depthFt: 10.0,
      areaSqft: 110.0,
      bounds: { xMin: 12.25, yMin: 10.25, xMax: 23.25, yMax: 20.25 },
      floorMaterial: 'oak',
      accentColor: '#0d9488',
      doorId: 'door_bedroom_2',
      facing: 'south',
      sharedDividerWalls: ['wall_divider_bed2_master', 'wall_divider_bed3_bed2'],
      notes:
        'Center-North bedroom (11\'-0" × 10\'-0") sharing its East divider wall with Master Bedroom and West divider wall with Bedroom 3.',
      cameraPreset: {
        position: [-1.0, 14.0, 10.5],
        target: [-1.0, 1.5, -4.8],
      },
    },
    {
      id: 'bedroom_3',
      name: 'Bedroom 3',
      shortLabel: 'Bedroom 3',
      kind: 'interior',
      widthFt: 11.0,
      depthFt: 10.0,
      areaSqft: 110.0,
      bounds: { xMin: 0.75, yMin: 10.25, xMax: 11.75, yMax: 20.25 },
      floorMaterial: 'oak',
      accentColor: '#4f46e5',
      doorId: 'door_bedroom_3',
      facing: 'south',
      sharedDividerWalls: ['wall_divider_bed3_bed2'],
      notes:
        'Northwest bedroom (11\'-0" × 10\'-0") sharing its East divider wall with Bedroom 2, with South-facing single wooden door.',
      cameraPreset: {
        position: [-13.5, 14.0, 10.5],
        target: [-12.5, 1.5, -4.8],
      },
    },
    {
      id: 'kitchen_under_staircase',
      name: 'East-Facing Kitchen under Roof Staircase',
      shortLabel: 'Kitchen & Stair',
      kind: 'interior',
      widthFt: 7.5,
      depthFt: 9.0,
      areaSqft: 67.5,
      bounds: { xMin: 0.75, yMin: 0.75, xMax: 8.25, yMax: 9.75 },
      floorMaterial: 'kitchen_tile',
      accentColor: '#d97706',
      facing: 'east',
      sharedDividerWalls: [],
      notes:
        'Located on the West side beneath the L-shaped roof staircase; opens and faces East directly into the small dining space.',
      cameraPreset: {
        position: [-4.5, 10.5, 16.0],
        target: [-13.5, 3.2, 5.2],
      },
    },
    {
      id: 'corridor_dining_space',
      name: 'Long Corridor & Small Dining Space',
      shortLabel: 'Dining & Corridor',
      kind: 'interior',
      widthFt: 28.5,
      depthFt: 9.0,
      areaSqft: 256.5,
      bounds: { xMin: 8.25, yMin: 0.75, xMax: 36.75, yMax: 9.75 },
      floorMaterial: 'limestone',
      accentColor: '#0284c7',
      doorId: 'door_main_entry',
      facing: 'south',
      sharedDividerWalls: ['wall_corridor_bedroom_spine'],
      notes:
        'Includes centered Main House Entry Door on the South exterior wall (x = 18\'-9"), dining area beside the East-facing kitchen, and direct access to the South Entry Patio.',
      cameraPreset: {
        position: [4.5, 11.5, 18.5],
        target: [0.0, 1.8, 4.5],
      },
    },
    {
      id: 'south_patio',
      name: 'South Entry Patio & Lounge Terrace',
      shortLabel: 'South Patio',
      kind: 'outdoor',
      widthFt: 22.0,
      depthFt: 7.0,
      areaSqft: 154.0,
      bounds: { xMin: 8.25, yMin: -7.0, xMax: 30.25, yMax: 0.0 },
      floorMaterial: 'patio_stone',
      accentColor: '#15803d',
      doorId: 'door_main_entry',
      facing: 'south',
      sharedDividerWalls: ['wall_ext_south'],
      relationToInterior:
        'Extends 7\'-0" South from the exterior wall (x = 8\'-3" to 30\'-3"), directly aligned with the centered Main House Entry Door into the Dining & Corridor space and flanked by both South windows.',
      notes:
        '22\'-0" × 7\'-0" paved outdoor patio (154 sq ft) bridging the front garden walkway and the centered Main Entry Door, with seating beneath the South corridor & dining windows.',
      cameraPreset: {
        position: [6.0, 10.0, 26.5],
        target: [0.5, 1.0, 13.5],
      },
    },
  ],
  walls: [
    {
      id: 'wall_ext_south',
      type: 'exterior',
      orientation: 'horizontal',
      thicknessFt: 0.75,
      startFt: [0.0, 0.375],
      endFt: [37.5, 0.375],
    },
    {
      id: 'wall_ext_north',
      type: 'exterior',
      orientation: 'horizontal',
      thicknessFt: 0.75,
      startFt: [0.0, 20.625],
      endFt: [37.5, 20.625],
    },
    {
      id: 'wall_ext_west',
      type: 'exterior',
      orientation: 'vertical',
      thicknessFt: 0.75,
      startFt: [0.375, 0.75],
      endFt: [0.375, 20.25],
    },
    {
      id: 'wall_ext_east',
      type: 'exterior',
      orientation: 'vertical',
      thicknessFt: 0.75,
      startFt: [37.125, 0.75],
      endFt: [37.125, 20.25],
    },
    {
      id: 'wall_corridor_bedroom_spine',
      type: 'interior_divider',
      orientation: 'horizontal',
      thicknessFt: 0.5,
      startFt: [0.75, 10.0],
      endFt: [36.75, 10.0],
    },
    {
      id: 'wall_divider_bed3_bed2',
      type: 'interior_divider',
      orientation: 'vertical',
      thicknessFt: 0.5,
      startFt: [12.0, 10.25],
      endFt: [12.0, 20.25],
    },
    {
      id: 'wall_divider_bed2_master',
      type: 'interior_divider',
      orientation: 'vertical',
      thicknessFt: 0.5,
      startFt: [23.5, 10.25],
      endFt: [23.5, 20.25],
    },
  ],
  doors: [
    {
      id: 'door_main_entry',
      label: 'Main House Entry Door',
      roomId: 'corridor_dining_space',
      wallId: 'wall_ext_south',
      facing: 'south',
      material: 'wooden',
      doorType: 'main_entry_wooden_door',
      widthFt: 4.0,
      heightFt: 7.25,
      centerFt: [18.75, 0.375],
      spanXFt: [16.75, 20.75],
      swing: 'inward_north',
      hingeSide: 'west',
      notes: 'Centered on the 37\'-6" South exterior wall (x = 18\'-9"), opening directly onto the South Patio.',
    },
    {
      id: 'door_master_bedroom',
      label: 'Master Bedroom Door',
      roomId: 'master_bedroom',
      wallId: 'wall_corridor_bedroom_spine',
      facing: 'south',
      material: 'wooden',
      doorType: 'single_wooden_door',
      widthFt: 3.0,
      heightFt: 7.0,
      centerFt: [26.0, 10.0],
      spanXFt: [24.5, 27.5],
      swing: 'inward_north',
      hingeSide: 'west',
      notes: 'South-facing single wooden door opening inward into the 13\' × 10\' Master Bedroom.',
    },
    {
      id: 'door_bedroom_2',
      label: 'Bedroom 2 Door',
      roomId: 'bedroom_2',
      wallId: 'wall_corridor_bedroom_spine',
      facing: 'south',
      material: 'wooden',
      doorType: 'single_wooden_door',
      widthFt: 3.0,
      heightFt: 7.0,
      centerFt: [14.5, 10.0],
      spanXFt: [13.0, 16.0],
      swing: 'inward_north',
      hingeSide: 'west',
      notes: 'South-facing single wooden door opening inward into Bedroom 2 (11\' × 10\').',
    },
    {
      id: 'door_bedroom_3',
      label: 'Bedroom 3 Door',
      roomId: 'bedroom_3',
      wallId: 'wall_corridor_bedroom_spine',
      facing: 'south',
      material: 'wooden',
      doorType: 'single_wooden_door',
      widthFt: 3.0,
      heightFt: 7.0,
      centerFt: [10.0, 10.0],
      spanXFt: [8.5, 11.5],
      swing: 'inward_north',
      hingeSide: 'east',
      notes: 'South-facing single wooden door opening inward into Bedroom 3 (11\' × 10\').',
    },
  ],
  windows: [
    {
      id: 'win_master_north',
      roomId: 'master_bedroom',
      wallId: 'wall_ext_north',
      orientation: 'horizontal',
      widthFt: 5.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [30.25, 20.625],
    },
    {
      id: 'win_master_east',
      roomId: 'master_bedroom',
      wallId: 'wall_ext_east',
      orientation: 'vertical',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [37.125, 15.25],
    },
    {
      id: 'win_bed2_north',
      roomId: 'bedroom_2',
      wallId: 'wall_ext_north',
      orientation: 'horizontal',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [17.75, 20.625],
    },
    {
      id: 'win_bed3_north',
      roomId: 'bedroom_3',
      wallId: 'wall_ext_north',
      orientation: 'horizontal',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [6.25, 20.625],
    },
    {
      id: 'win_bed3_west',
      roomId: 'bedroom_3',
      wallId: 'wall_ext_west',
      orientation: 'vertical',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [0.375, 15.25],
    },
    {
      id: 'win_corridor_east',
      roomId: 'corridor_dining_space',
      wallId: 'wall_ext_east',
      orientation: 'vertical',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [37.125, 5.25],
    },
    {
      id: 'win_corridor_south_east',
      roomId: 'corridor_dining_space',
      wallId: 'wall_ext_south',
      orientation: 'horizontal',
      widthFt: 5.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [26.25, 0.375],
    },
    {
      id: 'win_dining_south',
      roomId: 'corridor_dining_space',
      wallId: 'wall_ext_south',
      orientation: 'horizontal',
      widthFt: 4.0,
      sillHeightFt: 3.0,
      headHeightFt: 7.25,
      centerFt: [12.5, 0.375],
    },
  ],
  staircase: {
    id: 'roof_staircase',
    type: 'L_shaped_with_winders',
    destination: 'Roof',
    totalRiseFt: 10.5,
    risersCount: 17,
    riserHeightFt: 10.5 / 17,
    treadDepthFt: 0.75,
    stairWidthFt: 3.0,
    flights: [
      {
        id: 'flight_1',
        kind: 'flight_1',
        direction: 'east_to_west',
        startFt: [8.25, 2.25],
        endFt: [3.75, 2.25],
        bounds: { xMin: 3.75, yMin: 0.75, xMax: 8.25, yMax: 3.75 },
        treads: 6,
      },
      {
        id: 'landing_winders',
        kind: 'landing_winders',
        direction: 'turn_north',
        bounds: { xMin: 0.75, yMin: 0.75, xMax: 3.75, yMax: 3.75 },
        treads: 2,
      },
      {
        id: 'flight_2',
        kind: 'flight_2',
        direction: 'south_to_north',
        startFt: [2.25, 3.75],
        endFt: [2.25, 9.75],
        bounds: { xMin: 0.75, yMin: 3.75, xMax: 3.75, yMax: 9.75 },
        treads: 8,
      },
    ],
    kitchenHeadroomNote:
      'Kitchen sink and prep counter sit cleanly under the elevated upper flight (6.0 to 9.9 ft clearance) with cooking range & east-facing serving bar in the full-height East bay.',
  },
};
