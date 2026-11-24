import React from 'react';
import { ChevronDown, ChevronUp, DoorOpen, Ruler } from 'lucide-react';
import { CAMERA_PRESETS, CameraPresetId, WallDisplayMode } from '../three/HouseSceneManager';

export type AppViewMode = '3d' | '2d' | 'split';

interface ControlDockProps {
  collapsed: boolean;
  onToggleCollapse: () => void;
  viewMode: AppViewMode;
  onChangeViewMode: (mode: AppViewMode) => void;
  wallMode: WallDisplayMode;
  onChangeWallMode: (mode: WallDisplayMode) => void;
  activePreset: CameraPresetId;
  onSelectPreset: (preset: CameraPresetId) => void;
  doorsOpen: boolean;
  onToggleDoors: () => void;
  showDimensions: boolean;
  onToggleDimensions: () => void;
}

export const ControlDock: React.FC<ControlDockProps> = ({
  collapsed,
  onToggleCollapse,
  viewMode,
  onChangeViewMode,
  wallMode,
  onChangeWallMode,
  activePreset,
  onSelectPreset,
  doorsOpen,
  onToggleDoors,
  showDimensions,
  onToggleDimensions,
}) => {
  const show3DControls = viewMode === '3d' || viewMode === 'split';
  const show2DControls = viewMode === '2d' || viewMode === 'split';

  return (
    <div
      className="fixed bottom-3 left-1/2 -translate-x-1/2 z-30 flex flex-col items-center max-w-[min(1080px,96vw)] pointer-events-none"
      data-testid="control-dock"
    >
      {/* Collapse / Expand Toggle */}
      <button
        type="button"
        onClick={onToggleCollapse}
        aria-expanded={!collapsed}
        aria-label={collapsed ? 'Show Controls' : 'Hide Controls'}
        className="pointer-events-auto mb-1 inline-flex items-center gap-1.5 px-3 py-0.5 rounded-t-lg rounded-b-md bg-white/95 border border-slate-200 text-[11px] font-medium text-slate-700 hover:text-slate-900 shadow-sm transition-colors cursor-pointer whitespace-nowrap shrink-0"
      >
        {collapsed ? (
          <>
            <ChevronUp className="w-3.5 h-3.5" />
            <span>Show Controls</span>
          </>
        ) : (
          <>
            <ChevronDown className="w-3.5 h-3.5" />
            <span>Hide Controls</span>
          </>
        )}
      </button>

      {/* Main Dock Panel (solid/rgba surface, zero backdrop-filter over WebGL) */}
      <div
        className={`pointer-events-auto w-full rounded-xl bg-white/95 border border-slate-200/90 shadow-lg px-3 py-2 transition-all duration-200 ${
          collapsed
            ? 'opacity-0 translate-y-6 pointer-events-none h-0 overflow-hidden py-0 border-0'
            : 'opacity-100 translate-y-0'
        }`}
      >
        <div className="flex flex-col items-center gap-1.5">
          {/* Row 1: View Mode + Wall Cutaway + Door Swing + 2D Dimensions */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <div
              role="group"
              aria-label="View Mode"
              className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg shrink-0"
            >
              {(
                [
                  { id: '3d', label: '3D Model' },
                  { id: '2d', label: '2D Blueprint' },
                  { id: 'split', label: 'Split View' },
                ] as const
              ).map((tab) => {
                const active = viewMode === tab.id;
                return (
                  <button
                    key={tab.id}
                    type="button"
                    onClick={() => onChangeViewMode(tab.id)}
                    aria-pressed={active}
                    className={`px-3 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-slate-900 text-white shadow-sm'
                        : 'text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    {tab.label}
                  </button>
                );
              })}
            </div>

            {show3DControls && (
              <div
                role="group"
                aria-label="Wall Cutaway"
                className="flex items-center gap-1 p-0.5 bg-slate-100 rounded-lg shrink-0"
              >
                {(
                  [
                    { id: 'cutaway', label: 'Cutaway' },
                    { id: 'full', label: 'Full Walls' },
                    { id: 'roof', label: 'Roof' },
                  ] as const
                ).map((mode) => {
                  const active = wallMode === mode.id;
                  return (
                    <button
                      key={mode.id}
                      type="button"
                      onClick={() => onChangeWallMode(mode.id)}
                      aria-pressed={active}
                      className={`px-2.5 py-1 text-xs font-medium rounded-md transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                        active
                          ? 'bg-white text-slate-900 shadow-sm'
                          : 'text-slate-600 hover:text-slate-900'
                      }`}
                    >
                      {mode.label}
                    </button>
                  );
                })}
              </div>
            )}

            <button
              type="button"
              onClick={onToggleDoors}
              aria-pressed={doorsOpen}
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                doorsOpen
                  ? 'bg-amber-50 border-amber-300 text-amber-800'
                  : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              <DoorOpen className="w-3.5 h-3.5" />
              <span>{doorsOpen ? 'Close Doors' : 'Open Doors'}</span>
            </button>

            {show2DControls && (
              <button
                type="button"
                onClick={onToggleDimensions}
                aria-pressed={showDimensions}
                className={`inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium rounded-lg border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                  showDimensions
                    ? 'bg-blue-50 border-blue-200 text-blue-700'
                    : 'bg-white border-slate-200 text-slate-700 hover:text-slate-900 hover:border-slate-300'
                }`}
              >
                <Ruler className="w-3.5 h-3.5" />
                <span>Dimensions</span>
              </button>
            )}
          </div>

          {/* Row 2: Camera Presets (when 3D is visible) */}
          {show3DControls && (
            <div
              role="group"
              aria-label="Camera Views"
              className="flex flex-wrap items-center justify-center gap-1"
            >
              {(Object.keys(CAMERA_PRESETS) as CameraPresetId[]).map((presetKey) => {
                const active = activePreset === presetKey;
                return (
                  <button
                    key={presetKey}
                    type="button"
                    onClick={() => onSelectPreset(presetKey)}
                    aria-pressed={active}
                    className={`px-2.5 py-1 text-[11px] font-medium rounded-md border transition-colors cursor-pointer whitespace-nowrap shrink-0 ${
                      active
                        ? 'bg-blue-50 border-blue-200 text-blue-700'
                        : 'bg-white border-slate-200 text-slate-600 hover:text-slate-900 hover:border-slate-300'
                    }`}
                  >
                    {CAMERA_PRESETS[presetKey].label}
                  </button>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
