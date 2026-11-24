import { useEffect, useRef, useState } from 'react';
import { Blueprint2D } from './components/Blueprint2D';
import { AppViewMode, ControlDock } from './components/ControlDock';
import { RoomInspector } from './components/RoomInspector';
import { Viewport3D, Viewport3DHandle } from './components/Viewport3D';
import { HOUSE_FLOOR_PLAN, RoomId } from './plan/floorPlanData';
import { formatFeetInches } from './plan/geometryMath';
import { CameraPresetId, WallDisplayMode } from './three/HouseSceneManager';

export default function App() {
  const viewportRef = useRef<Viewport3DHandle | null>(null);

  const [viewMode, setViewMode] = useState<AppViewMode>('3d');
  const [wallMode, setWallMode] = useState<WallDisplayMode>('cutaway');
  const [activePreset, setActivePreset] = useState<CameraPresetId>('overview');
  const [doorsOpen, setDoorsOpen] = useState(false);
  const [showDimensions, setShowDimensions] = useState(true);
  const [dockCollapsed, setDockCollapsed] = useState(false);
  const [selectedRoomId, setSelectedRoomId] = useState<RoomId | null>(null);
  const [hoveredRoomId, setHoveredRoomId] = useState<RoomId | null>(null);

  const hoveredRoom = hoveredRoomId
    ? HOUSE_FLOOR_PLAN.rooms.find((r) => r.id === hoveredRoomId)
    : null;

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) {
        return;
      }
      if (e.key === 'h' || e.key === 'H') {
        setDockCollapsed((prev) => !prev);
      } else if (e.key === 'Escape') {
        setSelectedRoomId(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const handleSelectPreset = (preset: CameraPresetId) => {
    setActivePreset(preset);
    viewportRef.current?.focusCameraPreset(preset);
  };

  const handleSelectRoom = (roomId: RoomId | null) => {
    setSelectedRoomId(roomId);
  };

  const handleFocusRoomIn3D = (roomId: RoomId) => {
    if (viewMode === '2d') {
      setViewMode('3d');
    }
    viewportRef.current?.focusRoom(roomId);
  };

  return (
    <main
      className="relative w-screen h-screen overflow-hidden bg-[#edf1f5] text-slate-900"
      data-view-mode={viewMode}
      data-selected-room={selectedRoomId ?? 'none'}
      data-doors-open={doorsOpen ? 'open' : 'closed'}
    >
      {/* Minimal Top-Left Architectural Title & Unboxed Spec Line */}
      <header className="fixed top-4 left-4 z-20 pointer-events-none select-none">
        <div className="pointer-events-auto rounded-xl bg-white/95 border border-slate-200/90 shadow-sm px-4 py-2.5">
          <h1 className="font-display text-sm sm:text-base font-semibold text-slate-900 tracking-tight">
            Residence Floor Plan · 3 Bedrooms, Kitchen Under Stair &amp; South Patio
          </h1>
          <div className="mt-0.5 flex flex-wrap items-center gap-2 text-xs text-slate-600 font-mono-num">
            <span>
              {formatFeetInches(HOUSE_FLOOR_PLAN.overall.exteriorWidthFt)} ×{' '}
              {formatFeetInches(HOUSE_FLOOR_PLAN.overall.exteriorDepthFt)} house
            </span>
            <span aria-hidden="true">·</span>
            <span>{HOUSE_FLOOR_PLAN.overall.grossAreaSqft} sq ft interior</span>
            <span aria-hidden="true">·</span>
            <span>{HOUSE_FLOOR_PLAN.overall.outdoorPatioAreaSqft} sq ft South patio</span>
            {hoveredRoom && (
              <>
                <span aria-hidden="true">·</span>
                <span className="font-semibold text-blue-700">
                  {hoveredRoom.shortLabel} ({formatFeetInches(hoveredRoom.widthFt)} ×{' '}
                  {formatFeetInches(hoveredRoom.depthFt)})
                </span>
              </>
            )}
          </div>
        </div>
      </header>

      {/* Main Content Area: 3D, 2D Blueprint, or Split View */}
      <div className="w-full h-full flex flex-col lg:flex-row">
        {(viewMode === '3d' || viewMode === 'split') && (
          <section
            aria-label="3D Cutaway Viewport"
            className={
              viewMode === 'split'
                ? 'flex-1 h-1/2 lg:h-full border-b lg:border-b-0 lg:border-r border-slate-200 min-w-0'
                : 'w-full h-full'
            }
          >
            <Viewport3D
              ref={viewportRef}
              wallMode={wallMode}
              doorsOpen={doorsOpen}
              selectedRoomId={selectedRoomId}
              onSelectRoom={handleSelectRoom}
              onHoverRoom={setHoveredRoomId}
            />
          </section>
        )}

        {(viewMode === '2d' || viewMode === 'split') && (
          <section
            aria-label="2D Architectural CAD Blueprint"
            className={
              viewMode === 'split'
                ? 'flex-1 h-1/2 lg:h-full overflow-hidden min-w-0'
                : 'flex-1 h-full overflow-hidden min-w-0'
            }
          >
            <Blueprint2D
              selectedRoomId={selectedRoomId}
              hoveredRoomId={hoveredRoomId}
              doorsOpen={doorsOpen}
              showDimensions={showDimensions}
              onSelectRoom={(id) => handleSelectRoom(id)}
              onHoverRoom={setHoveredRoomId}
            />
          </section>
        )}

        {/* Docked Inspector in 2D / Split view (zero overlap with CAD drawing) */}
        {selectedRoomId && viewMode !== '3d' && (
          <RoomInspector
            roomId={selectedRoomId}
            onClose={() => setSelectedRoomId(null)}
            onFocusIn3D={handleFocusRoomIn3D}
            showFocusButton
            docked
          />
        )}
      </div>

      {/* Floating Inspector in full-bleed 3D Mode */}
      {selectedRoomId && viewMode === '3d' && (
        <RoomInspector
          roomId={selectedRoomId}
          onClose={() => setSelectedRoomId(null)}
          onFocusIn3D={handleFocusRoomIn3D}
          showFocusButton
        />
      )}

      {/* Collapsible Unified Bottom Control Dock */}
      <ControlDock
        collapsed={dockCollapsed}
        onToggleCollapse={() => setDockCollapsed((prev) => !prev)}
        viewMode={viewMode}
        onChangeViewMode={setViewMode}
        wallMode={wallMode}
        onChangeWallMode={setWallMode}
        activePreset={activePreset}
        onSelectPreset={handleSelectPreset}
        doorsOpen={doorsOpen}
        onToggleDoors={() => setDoorsOpen((prev) => !prev)}
        showDimensions={showDimensions}
        onToggleDimensions={() => setShowDimensions((prev) => !prev)}
      />
    </main>
  );
}
