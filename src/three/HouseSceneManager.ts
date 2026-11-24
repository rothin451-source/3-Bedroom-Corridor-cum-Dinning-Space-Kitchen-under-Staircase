import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js';
import { HOUSE_FLOOR_PLAN, RoomId, RoomSpec } from '../plan/floorPlanData';
import { computeWallSegments, planToWorld } from '../plan/geometryMath';
import {
  AnimatedDoorHandle,
  buildBedroomSuite,
  buildDiningSet,
  buildDoorAssembly,
  buildExteriorContext,
  buildKitchenUnderStair,
  buildRoofSlabGroup,
  buildRoofStaircase,
  buildWindowAssembly,
} from './architecturalProps';
import { ArchitecturalMaterialLibrary, createArchitecturalMaterials } from './materials';

export type WallDisplayMode = 'cutaway' | 'full' | 'roof';
export type CameraPresetId =
  | 'overview'
  | 'south_patio'
  | 'entry_dining'
  | 'kitchen_stair'
  | 'master_suite'
  | 'top_ortho';

export const CAMERA_PRESETS: Record<
  CameraPresetId,
  { label: string; position: [number, number, number]; target: [number, number, number] }
> = {
  overview: {
    label: 'Overview',
    position: [26, 28, 36],
    target: [0, 1.0, 3.5],
  },
  south_patio: {
    label: 'South Patio',
    position: [6.0, 10.0, 26.5],
    target: [0.5, 1.0, 13.5],
  },
  entry_dining: {
    label: 'Entry & Dining',
    position: [5.5, 11.5, 18.5],
    target: [-1.5, 1.8, 4.2],
  },
  kitchen_stair: {
    label: 'Kitchen & Stair',
    position: [-3.5, 10.2, 16.5],
    target: [-13.5, 3.2, 5.2],
  },
  master_suite: {
    label: 'Master Suite',
    position: [13.5, 13.8, 10.5],
    target: [11.5, 1.5, -4.8],
  },
  top_ortho: {
    label: 'Top Plan',
    position: [0.01, 44, 2.0],
    target: [0, 0, 2.0],
  },
};

// Scratch objects pre-allocated outside render loop (zero GC)
const _raycaster = new THREE.Raycaster();
const _pointer = new THREE.Vector2();

function detectSoftwareWebGL(): boolean {
  try {
    const probe = document.createElement('canvas');
    const gl = probe.getContext('webgl2');
    if (!gl) return true;
    const ext = gl.getExtension('WEBGL_debug_renderer_info');
    const param = ext ? ext.UNMASKED_RENDERER_WEBGL : gl.RENDERER;
    const gpu = String(gl.getParameter(param));
    gl.getExtension('WEBGL_lose_context')?.loseContext();
    return /SwiftShader|llvmpipe|softpipe|Software|Basic Render/i.test(gpu);
  } catch {
    return true;
  }
}

export interface HouseSceneCallbacks {
  onSelectRoom: (roomId: RoomId | null) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
  onContextLostChange?: (lost: boolean) => void;
}

export class HouseSceneManager {
  public readonly isSoftwareGl: boolean;
  private container: HTMLElement;
  private callbacks: HouseSceneCallbacks;
  private renderer: THREE.WebGLRenderer;
  private scene: THREE.Scene;
  private camera: THREE.PerspectiveCamera;
  private controls: OrbitControls;
  private mats: ArchitecturalMaterialLibrary;
  private envRenderTarget: THREE.WebGLRenderTarget;

  private wallGroupCutaway = new THREE.Group();
  private wallGroupFull = new THREE.Group();
  private windowsGroup = new THREE.Group();
  private roofGroup = new THREE.Group();
  private doorHandles: AnimatedDoorHandle[] = [];
  private roomHitMeshes: THREE.Mesh[] = [];
  private roomHighlightMeshes = new Map<RoomId, THREE.Mesh>();

  // Animation state
  private doorOpenTarget = 0; // 0 = closed, 1 = open
  private doorOpenCurrent = 0;
  private cameraTargetPos: THREE.Vector3 | null = null;
  private cameraLookTarget: THREE.Vector3 | null = null;
  private wallMode: WallDisplayMode = 'cutaway';
  private selectedRoomId: RoomId | null = null;
  private hoveredRoomId: RoomId | null = null;

  // Render pacing & cleanup
  private frameId = 0;
  private renderBusy = false;
  private renderDirty = false;
  private disposed = false;
  private lastTimeMs = performance.now();
  private lastHoverRaycastMs = 0;
  private pointerDownPos = { x: 0, y: 0 };
  private resizeObserver: ResizeObserver;

  constructor(container: HTMLElement, callbacks: HouseSceneCallbacks) {
    this.container = container;
    this.callbacks = callbacks;
    this.isSoftwareGl = detectSoftwareWebGL();

    const width = Math.max(container.clientWidth, 1);
    const height = Math.max(container.clientHeight, 1);

    this.renderer = new THREE.WebGLRenderer({
      antialias: !this.isSoftwareGl,
      powerPreference: 'high-performance',
    });
    this.renderer.outputColorSpace = THREE.SRGBColorSpace;
    this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
    this.renderer.toneMappingExposure = 1.1;
    this.renderer.setPixelRatio(this.isSoftwareGl ? 1 : Math.min(window.devicePixelRatio, 2));
    this.renderer.setSize(width, height);
    this.renderer.shadowMap.enabled = !this.isSoftwareGl;
    this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
    this.renderer.domElement.style.display = 'block';
    this.renderer.domElement.style.width = '100%';
    this.renderer.domElement.style.height = '100%';
    container.appendChild(this.renderer.domElement);

    this.scene = new THREE.Scene();
    const skyColor = new THREE.Color('#edf1f5');
    this.scene.background = skyColor;
    this.scene.fog = new THREE.Fog('#edf1f5', 55, 130);

    // Studio PBR Reflections via RoomEnvironment (mandatory on every device)
    const pmremGenerator = new THREE.PMREMGenerator(this.renderer);
    this.envRenderTarget = pmremGenerator.fromScene(new RoomEnvironment(), 0.04);
    this.scene.environment = this.envRenderTarget.texture;
    pmremGenerator.dispose();

    this.camera = new THREE.PerspectiveCamera(42, width / height, 0.5, 220);
    const initial = CAMERA_PRESETS.overview;
    this.camera.position.set(...initial.position);

    this.controls = new OrbitControls(this.camera, this.renderer.domElement);
    this.controls.target.set(...initial.target);
    this.controls.enableDamping = !this.isSoftwareGl;
    this.controls.dampingFactor = 0.07;
    this.controls.minDistance = 8;
    this.controls.maxDistance = 68;
    this.controls.maxPolarAngle = Math.PI / 2 - 0.05;
    this.controls.update();

    const maxAnisotropy = this.renderer.capabilities.getMaxAnisotropy();
    this.mats = createArchitecturalMaterials(maxAnisotropy, this.isSoftwareGl);

    this.setupLighting();
    this.buildHouseGeometry();

    // Cancel scripted camera glide immediately when user interacts
    this.controls.addEventListener('start', () => {
      this.cameraTargetPos = null;
      this.cameraLookTarget = null;
    });
    this.controls.addEventListener('change', () => {
      this.requestRender();
    });

    // Pointer picking for interactive rooms
    this.renderer.domElement.addEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.addEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.addEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.addEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.addEventListener('webglcontextrestored', this.onContextRestored);

    this.resizeObserver = new ResizeObserver(() => this.handleResize());
    this.resizeObserver.observe(container);

    if (!this.isSoftwareGl) {
      this.renderer.compile(this.scene, this.camera);
    }

    this.setWallMode('cutaway');
    this.requestRender();
  }

  private setupLighting(): void {
    // Warm directional sunlight key light
    const keyLight = new THREE.DirectionalLight(0xfff4e0, 1.85);
    keyLight.position.set(24, 34, 22);
    keyLight.castShadow = !this.isSoftwareGl;
    keyLight.shadow.mapSize.set(1024, 1024);
    keyLight.shadow.camera.near = 5;
    keyLight.shadow.camera.far = 95;
    keyLight.shadow.camera.left = -26;
    keyLight.shadow.camera.right = 26;
    keyLight.shadow.camera.top = 26;
    keyLight.shadow.camera.bottom = -26;
    keyLight.shadow.bias = -0.0005;
    keyLight.shadow.normalBias = 0.02;
    this.scene.add(keyLight);

    // Cool sky / warm earth hemisphere fill light
    const hemiLight = new THREE.HemisphereLight(0xdbeafe, 0x8a8175, 0.78);
    hemiLight.position.set(0, 30, 0);
    this.scene.add(hemiLight);

    // Subtle cool rim/backlight from NW
    const rimLight = new THREE.DirectionalLight(0xdbeafe, 0.45);
    rimLight.position.set(-22, 18, -24);
    this.scene.add(rimLight);
  }

  private buildHouseGeometry(): void {
    const plan = HOUSE_FLOOR_PLAN;

    // 1. Exterior site context (lawn, plinth, centered South steps & walkway, trees)
    this.scene.add(buildExteriorContext(plan, this.mats));

    // 2. Room Floor Slabs + Interactive Hit Planes & Selection Highlights
    for (const room of plan.rooms) {
      this.buildRoomFloorAndInteractiveZone(room);
    }

    // 3. Cutaway Walls (7.6 ft - cleanly frames 7.25' door/window headers) & Full Walls (10.0 ft)
    this.buildWallsForHeight(7.6, this.wallGroupCutaway, true);
    this.buildWallsForHeight(plan.overall.ceilingHeightFt, this.wallGroupFull, false);
    this.scene.add(this.wallGroupCutaway, this.wallGroupFull);

    // 4. Windows (visible in Full & Roof modes, and lower half in Cutaway? Windows start at 3.0 ft)
    for (const win of plan.windows) {
      const winGroup = buildWindowAssembly(
        win,
        plan.overall.exteriorWallThicknessFt,
        this.mats,
      );
      this.windowsGroup.add(winGroup);
    }
    this.scene.add(this.windowsGroup);

    // 5. Doors (Centered South Main Entry + 3 South-facing Single Wooden Bedroom Doors)
    for (const door of plan.doors) {
      const wall = plan.walls.find((w) => w.id === door.wallId);
      const wallThick = wall ? wall.thicknessFt : 0.5;
      const { group, handle } = buildDoorAssembly(door, wallThick, this.mats);
      this.doorHandles.push(handle);
      this.scene.add(group);
    }

    // 6. L-Shaped Roof Staircase & East-Facing Kitchen Under Staircase
    this.scene.add(buildRoofStaircase(plan.staircase, this.mats));
    this.scene.add(buildKitchenUnderStair(this.mats));

    // 7. 4-Seater Dining Set in Corridor/Dining Space
    this.scene.add(buildDiningSet(this.mats));

    // 8. Bedroom Furniture Suites (Master 13x10, Bed 2 11x10, Bed 3 11x10)
    for (const room of plan.rooms) {
      if (room.id === 'master_bedroom') {
        this.scene.add(buildBedroomSuite(room, true, this.mats));
      } else if (room.id === 'bedroom_2' || room.id === 'bedroom_3') {
        this.scene.add(buildBedroomSuite(room, false, this.mats));
      }
    }

    // 9. Roof Slab with Stairwell Opening
    this.roofGroup = buildRoofSlabGroup(plan, this.mats);
    this.scene.add(this.roofGroup);
  }

  private buildRoomFloorAndInteractiveZone(room: RoomSpec): void {
    const w = room.widthFt;
    const d = room.depthFt;
    const cx = (room.bounds.xMin + room.bounds.xMax) / 2;
    const cy = (room.bounds.yMin + room.bounds.yMax) / 2;
    const world = planToWorld(cx, cy);

    if (room.kind === 'interior') {
      const floorMat =
        room.floorMaterial === 'oak'
          ? this.mats.oakFloor
          : room.floorMaterial === 'kitchen_tile'
            ? this.mats.kitchenFloor
            : this.mats.limestoneFloor;

      const floorMesh = new THREE.Mesh(new THREE.BoxGeometry(w, 0.08, d), floorMat);
      floorMesh.position.set(world.x, -0.02, world.z);
      floorMesh.receiveShadow = true;
      this.scene.add(floorMesh);
    }

    // Subtle selection highlight overlay (offset >= 0.02 above floor)
    const highlightMat = new THREE.MeshBasicMaterial({
      color: new THREE.Color(room.accentColor),
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const highlightMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w - 0.12, d - 0.12),
      highlightMat,
    );
    highlightMesh.rotation.x = -Math.PI / 2;
    highlightMesh.position.set(world.x, 0.04, world.z);
    this.roomHighlightMeshes.set(room.id, highlightMesh);
    this.scene.add(highlightMesh);

    // Invisible simplified hit mesh on layer 1 for fast raycasting
    const hitMesh = new THREE.Mesh(
      new THREE.PlaneGeometry(w, d),
      new THREE.MeshBasicMaterial({ visible: false }),
    );
    hitMesh.rotation.x = -Math.PI / 2;
    hitMesh.position.set(world.x, 0.05, world.z);
    hitMesh.layers.set(1);
    hitMesh.userData.roomId = room.id;
    this.roomHitMeshes.push(hitMesh);
    this.scene.add(hitMesh);
  }

  private buildWallsForHeight(
    heightFt: number,
    targetGroup: THREE.Group,
    addCutawayCap: boolean,
  ): void {
    const plan = HOUSE_FLOOR_PLAN;

    for (const wall of plan.walls) {
      const mat = wall.type === 'exterior' ? this.mats.exteriorWall : this.mats.interiorWall;
      const segments = computeWallSegments(wall, plan.doors, plan.windows, heightFt, plan);

      for (const seg of segments) {
        const mesh = new THREE.Mesh(new THREE.BoxGeometry(seg.sx, seg.sy, seg.sz), mat);
        mesh.position.set(seg.cx, seg.cy, seg.cz);
        mesh.castShadow = true;
        mesh.receiveShadow = true;
        targetGroup.add(mesh);

        // Add crisp architectural section-cut cap on top of cutaway walls
        if (addCutawayCap && Math.abs(seg.cy + seg.sy / 2 - heightFt) < 0.05) {
          const cap = new THREE.Mesh(
            new THREE.BoxGeometry(seg.sx + 0.01, 0.06, seg.sz + 0.01),
            this.mats.cutawayCap,
          );
          cap.position.set(seg.cx, heightFt + 0.03, seg.cz);
          targetGroup.add(cap);
        }
      }
    }
  }

  public setWallMode(mode: WallDisplayMode): void {
    this.wallMode = mode;
    this.wallGroupCutaway.visible = mode === 'cutaway';
    this.wallGroupFull.visible = mode === 'full' || mode === 'roof';
    this.windowsGroup.visible = true;
    this.roofGroup.visible = mode === 'roof';
    this.requestRender();
  }

  public setDoorsOpen(open: boolean): void {
    this.doorOpenTarget = open ? 1 : 0;
    this.requestRender();
  }

  public setSelectedRoom(roomId: RoomId | null): void {
    this.selectedRoomId = roomId;
    this.updateRoomHighlights();
    this.requestRender();
  }

  public focusCameraPreset(presetId: CameraPresetId): void {
    const preset = CAMERA_PRESETS[presetId];
    this.cameraTargetPos = new THREE.Vector3(...preset.position);
    this.cameraLookTarget = new THREE.Vector3(...preset.target);
    this.requestRender();
  }

  public focusRoom(roomId: RoomId): void {
    const room = HOUSE_FLOOR_PLAN.rooms.find((r) => r.id === roomId);
    if (!room) return;
    this.cameraTargetPos = new THREE.Vector3(...room.cameraPreset.position);
    this.cameraLookTarget = new THREE.Vector3(...room.cameraPreset.target);
    this.requestRender();
  }

  private updateRoomHighlights(): void {
    for (const [id, mesh] of this.roomHighlightMeshes.entries()) {
      const mat = mesh.material as THREE.MeshBasicMaterial;
      if (id === this.selectedRoomId) {
        mat.opacity = 0.22;
      } else if (id === this.hoveredRoomId) {
        mat.opacity = 0.11;
      } else {
        mat.opacity = 0;
      }
    }
  }

  private updatePointer(e: PointerEvent): void {
    const rect = this.renderer.domElement.getBoundingClientRect();
    _pointer.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    _pointer.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
  }

  private onPointerDown = (e: PointerEvent): void => {
    this.pointerDownPos = { x: e.clientX, y: e.clientY };
  };

  private onPointerUp = (e: PointerEvent): void => {
    const dx = e.clientX - this.pointerDownPos.x;
    const dy = e.clientY - this.pointerDownPos.y;
    // Ignore orbit drags
    if (dx * dx + dy * dy > 25) return;

    this.updatePointer(e);
    _raycaster.layers.set(1);
    _raycaster.setFromCamera(_pointer, this.camera);
    const hits = _raycaster.intersectObjects(this.roomHitMeshes, false);

    if (hits.length > 0) {
      const roomId = hits[0].object.userData.roomId as RoomId;
      this.callbacks.onSelectRoom(roomId);
    } else {
      this.callbacks.onSelectRoom(null);
    }
  };

  private onPointerMove = (e: PointerEvent): void => {
    const now = performance.now();
    if (now - this.lastHoverRaycastMs < 50) return;
    this.lastHoverRaycastMs = now;

    this.updatePointer(e);
    _raycaster.layers.set(1);
    _raycaster.setFromCamera(_pointer, this.camera);
    const hits = _raycaster.intersectObjects(this.roomHitMeshes, false);

    const nextHover = hits.length > 0 ? (hits[0].object.userData.roomId as RoomId) : null;
    if (nextHover !== this.hoveredRoomId) {
      this.hoveredRoomId = nextHover;
      this.renderer.domElement.style.cursor = nextHover ? 'pointer' : 'grab';
      this.updateRoomHighlights();
      this.callbacks.onHoverRoom(nextHover);
      this.requestRender();
    }
  };

  private onContextLost = (e: Event): void => {
    e.preventDefault();
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.renderBusy = false;
    this.callbacks.onContextLostChange?.(true);
  };

  private onContextRestored = (): void => {
    this.callbacks.onContextLostChange?.(false);
    this.requestRender();
  };

  public handleResize(): void {
    if (this.disposed) return;
    const w = Math.max(this.container.clientWidth, 1);
    const h = Math.max(this.container.clientHeight, 1);
    this.camera.aspect = w / h;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(w, h);
    this.requestRender();
  }

  private afterDraw(cb: () => void): void {
    const gl = this.renderer.getContext() as WebGL2RenderingContext;
    if (!gl.fenceSync) {
      this.frameId = window.setTimeout(cb, 80);
      return;
    }
    const sync = gl.fenceSync(gl.SYNC_GPU_COMMANDS_COMPLETE, 0);
    gl.flush();
    const poll = () => {
      if (this.disposed) return;
      const state = sync ? gl.getSyncParameter(sync, gl.SYNC_STATUS) : gl.SIGNALED;
      if (state === gl.UNSIGNALED) {
        this.frameId = window.setTimeout(poll, 5);
      } else {
        if (sync) gl.deleteSync(sync);
        this.frameId = window.setTimeout(cb, 80);
      }
    };
    this.frameId = window.setTimeout(poll, 5);
  }

  public requestRender(): void {
    if (this.disposed) return;
    if (this.renderBusy) {
      this.renderDirty = true;
      return;
    }
    this.renderBusy = true;

    this.frameId = requestAnimationFrame(() => {
      if (this.disposed) return;
      this.renderDirty = false;

      const now = performance.now();
      const dt = Math.min((now - this.lastTimeMs) / 1000, 0.1);
      this.lastTimeMs = now;

      let needsFollowUpFrame = false;

      // 1. Exponential damping for door swing animations
      if (Math.abs(this.doorOpenCurrent - this.doorOpenTarget) > 0.002) {
        this.doorOpenCurrent = THREE.MathUtils.damp(
          this.doorOpenCurrent,
          this.doorOpenTarget,
          8.5,
          dt,
        );
        const maxAngle = Math.PI * 0.44;
        for (const door of this.doorHandles) {
          door.pivot.rotation.y = door.openSign * maxAngle * this.doorOpenCurrent;
        }
        needsFollowUpFrame = true;
      } else if (this.doorOpenCurrent !== this.doorOpenTarget) {
        this.doorOpenCurrent = this.doorOpenTarget;
        const maxAngle = Math.PI * 0.44;
        for (const door of this.doorHandles) {
          door.pivot.rotation.y = door.openSign * maxAngle * this.doorOpenCurrent;
        }
      }

      // 2. Exponential damping for scripted camera preset transitions
      if (this.cameraTargetPos && this.cameraLookTarget) {
        const lambda = 7.5;
        this.camera.position.x = THREE.MathUtils.damp(
          this.camera.position.x,
          this.cameraTargetPos.x,
          lambda,
          dt,
        );
        this.camera.position.y = THREE.MathUtils.damp(
          this.camera.position.y,
          this.cameraTargetPos.y,
          lambda,
          dt,
        );
        this.camera.position.z = THREE.MathUtils.damp(
          this.camera.position.z,
          this.cameraTargetPos.z,
          lambda,
          dt,
        );
        this.controls.target.x = THREE.MathUtils.damp(
          this.controls.target.x,
          this.cameraLookTarget.x,
          lambda,
          dt,
        );
        this.controls.target.y = THREE.MathUtils.damp(
          this.controls.target.y,
          this.cameraLookTarget.y,
          lambda,
          dt,
        );
        this.controls.target.z = THREE.MathUtils.damp(
          this.controls.target.z,
          this.cameraLookTarget.z,
          lambda,
          dt,
        );

        const posDist = this.camera.position.distanceTo(this.cameraTargetPos);
        const tgtDist = this.controls.target.distanceTo(this.cameraLookTarget);
        if (posDist < 0.04 && tgtDist < 0.04) {
          this.camera.position.copy(this.cameraTargetPos);
          this.controls.target.copy(this.cameraLookTarget);
          this.cameraTargetPos = null;
          this.cameraLookTarget = null;
        } else {
          needsFollowUpFrame = true;
        }
      }

      const controlsChanged = this.controls.update();
      if (controlsChanged && !this.isSoftwareGl) {
        needsFollowUpFrame = true;
      }

      this.renderer.render(this.scene, this.camera);

      const done = () => {
        this.renderBusy = false;
        if (this.renderDirty || needsFollowUpFrame) {
          this.requestRender();
        }
      };

      if (this.isSoftwareGl) {
        this.afterDraw(done);
      } else {
        done();
      }
    });
  }

  public getWallMode(): WallDisplayMode {
    return this.wallMode;
  }

  public dispose(): void {
    this.disposed = true;
    cancelAnimationFrame(this.frameId);
    clearTimeout(this.frameId);
    this.resizeObserver.disconnect();
    this.controls.dispose();

    this.renderer.domElement.removeEventListener('pointerdown', this.onPointerDown);
    this.renderer.domElement.removeEventListener('pointerup', this.onPointerUp);
    this.renderer.domElement.removeEventListener('pointermove', this.onPointerMove);
    this.renderer.domElement.removeEventListener('webglcontextlost', this.onContextLost);
    this.renderer.domElement.removeEventListener('webglcontextrestored', this.onContextRestored);

    this.scene.traverse((obj) => {
      if ((obj as THREE.Mesh).isMesh) {
        (obj as THREE.Mesh).geometry.dispose();
      }
    });
    this.mats.dispose();
    this.envRenderTarget.dispose();
    this.renderer.dispose();

    if (this.renderer.domElement.parentNode === this.container) {
      this.container.removeChild(this.renderer.domElement);
    }
  }
}
