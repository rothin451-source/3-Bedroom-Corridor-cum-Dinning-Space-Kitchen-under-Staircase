import * as THREE from 'three';
import {
  createContactShadowTexture,
  createKitchenTileTexture,
  createLawnTexture,
  createLimestoneTileTexture,
  createOakFloorTexture,
  createPlasterBumpTexture,
} from './textures';

export interface ArchitecturalMaterialLibrary {
  exteriorWall: THREE.MeshStandardMaterial;
  interiorWall: THREE.MeshStandardMaterial;
  cutawayCap: THREE.MeshStandardMaterial;
  oakFloor: THREE.MeshStandardMaterial;
  limestoneFloor: THREE.MeshStandardMaterial;
  kitchenFloor: THREE.MeshStandardMaterial;
  plinthConcrete: THREE.MeshStandardMaterial;
  lawnGround: THREE.MeshStandardMaterial;
  stoneWalkway: THREE.MeshStandardMaterial;
  doorTimber: THREE.MeshStandardMaterial;
  doorPanelDark: THREE.MeshStandardMaterial;
  doorFrame: THREE.MeshStandardMaterial;
  brassHardware: THREE.MeshStandardMaterial;
  windowFrame: THREE.MeshStandardMaterial;
  windowGlass: THREE.MeshPhysicalMaterial;
  stairOak: THREE.MeshStandardMaterial;
  stairStringerSteel: THREE.MeshStandardMaterial;
  stairRiser: THREE.MeshStandardMaterial;
  kitchenCabinet: THREE.MeshStandardMaterial;
  kitchenCounterQuartz: THREE.MeshStandardMaterial;
  stainlessSteel: THREE.MeshStandardMaterial;
  applianceDark: THREE.MeshStandardMaterial;
  walnutWood: THREE.MeshStandardMaterial;
  fabricCream: THREE.MeshStandardMaterial;
  fabricSlate: THREE.MeshStandardMaterial;
  fabricTeal: THREE.MeshStandardMaterial;
  fabricIndigo: THREE.MeshStandardMaterial;
  lampShade: THREE.MeshStandardMaterial;
  treeTrunk: THREE.MeshStandardMaterial;
  foliageGreen: THREE.MeshStandardMaterial;
  roofSlab: THREE.MeshStandardMaterial;
  contactShadow: THREE.MeshBasicMaterial;
  textures: THREE.Texture[];
  allMaterials: THREE.Material[];
  dispose: () => void;
}

export function createArchitecturalMaterials(
  anisotropy: number,
  isSoftwareGl: boolean,
): ArchitecturalMaterialLibrary {
  const oak = createOakFloorTexture(anisotropy);
  const limestone = createLimestoneTileTexture(anisotropy);
  const kitchenTile = createKitchenTileTexture(anisotropy);
  const lawn = createLawnTexture(anisotropy);
  const plasterBump = createPlasterBumpTexture(anisotropy);
  const contactTex = createContactShadowTexture();

  const textures: THREE.Texture[] = [
    oak.map,
    oak.bumpMap,
    limestone.map,
    limestone.bumpMap,
    kitchenTile,
    lawn,
    plasterBump,
    contactTex,
  ];

  const exteriorWall = new THREE.MeshStandardMaterial({
    color: 0xf4f2ed,
    roughness: 0.85,
    metalness: 0.02,
    bumpMap: plasterBump,
    bumpScale: 0.015,
  });

  const interiorWall = new THREE.MeshStandardMaterial({
    color: 0xfaf9f6,
    roughness: 0.82,
    metalness: 0.02,
    bumpMap: plasterBump,
    bumpScale: 0.01,
  });

  const cutawayCap = new THREE.MeshStandardMaterial({
    color: 0x334155,
    roughness: 0.7,
    metalness: 0.05,
  });

  const oakFloor = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: oak.map,
    bumpMap: oak.bumpMap,
    bumpScale: 0.012,
    roughness: 0.48,
    metalness: 0.04,
  });

  const limestoneFloor = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: limestone.map,
    bumpMap: limestone.bumpMap,
    bumpScale: 0.01,
    roughness: 0.42,
    metalness: 0.05,
  });

  const kitchenFloor = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: kitchenTile,
    roughness: 0.38,
    metalness: 0.06,
  });

  const plinthConcrete = new THREE.MeshStandardMaterial({
    color: 0x9ca3af,
    roughness: 0.88,
    metalness: 0.04,
  });

  const lawnGround = new THREE.MeshStandardMaterial({
    color: 0xffffff,
    map: lawn,
    roughness: 0.94,
    metalness: 0.0,
  });

  const stoneWalkway = new THREE.MeshStandardMaterial({
    color: 0xcbd5e1,
    roughness: 0.8,
    metalness: 0.04,
  });

  const doorTimber = new THREE.MeshStandardMaterial({
    color: 0x8b5a2b,
    roughness: 0.46,
    metalness: 0.05,
  });

  const doorPanelDark = new THREE.MeshStandardMaterial({
    color: 0x6f451f,
    roughness: 0.56,
    metalness: 0.04,
  });

  const doorFrame = new THREE.MeshStandardMaterial({
    color: 0x543418,
    roughness: 0.52,
    metalness: 0.05,
  });

  const brassHardware = new THREE.MeshStandardMaterial({
    color: 0xd4af37,
    roughness: 0.2,
    metalness: 0.92,
  });

  const windowFrame = new THREE.MeshStandardMaterial({
    color: 0x26323f,
    roughness: 0.35,
    metalness: 0.72,
  });

  const windowGlass = new THREE.MeshPhysicalMaterial({
    color: 0xdbeafe,
    roughness: 0.08,
    metalness: 0.0,
    transmission: isSoftwareGl ? 0 : 0.78,
    transparent: true,
    opacity: isSoftwareGl ? 0.42 : 0.9,
    ior: 1.5,
    thickness: 0.15,
    depthWrite: false,
  });

  const stairOak = new THREE.MeshStandardMaterial({
    color: 0xb6814c,
    roughness: 0.45,
    metalness: 0.04,
  });

  const stairStringerSteel = new THREE.MeshStandardMaterial({
    color: 0x1e293b,
    roughness: 0.28,
    metalness: 0.82,
  });

  const stairRiser = new THREE.MeshStandardMaterial({
    color: 0xf1f5f9,
    roughness: 0.75,
    metalness: 0.02,
  });

  const kitchenCabinet = new THREE.MeshStandardMaterial({
    color: 0x3f4e5d,
    roughness: 0.55,
    metalness: 0.08,
  });

  const kitchenCounterQuartz = new THREE.MeshStandardMaterial({
    color: 0xf8fafc,
    roughness: 0.2,
    metalness: 0.05,
  });

  const stainlessSteel = new THREE.MeshStandardMaterial({
    color: 0xd1d5db,
    roughness: 0.2,
    metalness: 0.9,
  });

  const applianceDark = new THREE.MeshStandardMaterial({
    color: 0x18181b,
    roughness: 0.26,
    metalness: 0.65,
  });

  const walnutWood = new THREE.MeshStandardMaterial({
    color: 0x5c3d28,
    roughness: 0.44,
    metalness: 0.05,
  });

  const fabricCream = new THREE.MeshStandardMaterial({
    color: 0xf5f3ee,
    roughness: 0.9,
    metalness: 0.0,
  });

  const fabricSlate = new THREE.MeshStandardMaterial({
    color: 0x64748b,
    roughness: 0.88,
    metalness: 0.0,
  });

  const fabricTeal = new THREE.MeshStandardMaterial({
    color: 0x3b6e75,
    roughness: 0.88,
    metalness: 0.0,
  });

  const fabricIndigo = new THREE.MeshStandardMaterial({
    color: 0x4b5c7d,
    roughness: 0.88,
    metalness: 0.0,
  });

  const lampShade = new THREE.MeshStandardMaterial({
    color: 0xfef3c7,
    emissive: 0xfde68a,
    emissiveIntensity: 0.35,
    roughness: 0.85,
    metalness: 0.0,
  });

  const treeTrunk = new THREE.MeshStandardMaterial({
    color: 0x6b5344,
    roughness: 0.92,
    metalness: 0.0,
  });

  const foliageGreen = new THREE.MeshStandardMaterial({
    color: 0x73936b,
    roughness: 0.84,
    metalness: 0.0,
  });

  const roofSlab = new THREE.MeshStandardMaterial({
    color: 0xe2e8f0,
    roughness: 0.72,
    metalness: 0.08,
    transparent: true,
    opacity: 0.42,
    depthWrite: false,
  });

  const contactShadow = new THREE.MeshBasicMaterial({
    map: contactTex,
    transparent: true,
    depthWrite: false,
    opacity: 0.45,
  });

  const allMaterials: THREE.Material[] = [
    exteriorWall,
    interiorWall,
    cutawayCap,
    oakFloor,
    limestoneFloor,
    kitchenFloor,
    plinthConcrete,
    lawnGround,
    stoneWalkway,
    doorTimber,
    doorPanelDark,
    doorFrame,
    brassHardware,
    windowFrame,
    windowGlass,
    stairOak,
    stairStringerSteel,
    stairRiser,
    kitchenCabinet,
    kitchenCounterQuartz,
    stainlessSteel,
    applianceDark,
    walnutWood,
    fabricCream,
    fabricSlate,
    fabricTeal,
    fabricIndigo,
    lampShade,
    treeTrunk,
    foliageGreen,
    roofSlab,
    contactShadow,
  ];

  return {
    exteriorWall,
    interiorWall,
    cutawayCap,
    oakFloor,
    limestoneFloor,
    kitchenFloor,
    plinthConcrete,
    lawnGround,
    stoneWalkway,
    doorTimber,
    doorPanelDark,
    doorFrame,
    brassHardware,
    windowFrame,
    windowGlass,
    stairOak,
    stairStringerSteel,
    stairRiser,
    kitchenCabinet,
    kitchenCounterQuartz,
    stainlessSteel,
    applianceDark,
    walnutWood,
    fabricCream,
    fabricSlate,
    fabricTeal,
    fabricIndigo,
    lampShade,
    treeTrunk,
    foliageGreen,
    roofSlab,
    contactShadow,
    textures,
    allMaterials,
    dispose: () => {
      textures.forEach((t) => t.dispose());
      allMaterials.forEach((m) => m.dispose());
    },
  };
}
