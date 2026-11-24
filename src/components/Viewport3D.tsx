import React, { useEffect, useImperativeHandle, useRef, useState } from 'react';
import { RoomId } from '../plan/floorPlanData';
import {
  CameraPresetId,
  HouseSceneManager,
  WallDisplayMode,
} from '../three/HouseSceneManager';

export interface Viewport3DHandle {
  focusCameraPreset: (preset: CameraPresetId) => void;
  focusRoom: (roomId: RoomId) => void;
}

interface Viewport3DProps {
  wallMode: WallDisplayMode;
  doorsOpen: boolean;
  selectedRoomId: RoomId | null;
  onSelectRoom: (roomId: RoomId | null) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
}

export const Viewport3D = React.forwardRef<Viewport3DHandle, Viewport3DProps>(
  ({ wallMode, doorsOpen, selectedRoomId, onSelectRoom, onHoverRoom }, ref) => {
    const mountRef = useRef<HTMLDivElement | null>(null);
    const managerRef = useRef<HouseSceneManager | null>(null);
    const [contextLost, setContextLost] = useState(false);

    const callbacksRef = useRef({ onSelectRoom, onHoverRoom });
    callbacksRef.current = { onSelectRoom, onHoverRoom };

    useEffect(() => {
      const container = mountRef.current;
      if (!container) return;

      const manager = new HouseSceneManager(container, {
        onSelectRoom: (id) => callbacksRef.current.onSelectRoom(id),
        onHoverRoom: (id) => callbacksRef.current.onHoverRoom(id),
        onContextLostChange: (lost) => setContextLost(lost),
      });
      managerRef.current = manager;

      return () => {
        manager.dispose();
        managerRef.current = null;
      };
    }, []);

    useEffect(() => {
      managerRef.current?.setWallMode(wallMode);
    }, [wallMode]);

    useEffect(() => {
      managerRef.current?.setDoorsOpen(doorsOpen);
    }, [doorsOpen]);

    useEffect(() => {
      managerRef.current?.setSelectedRoom(selectedRoomId);
    }, [selectedRoomId]);

    useImperativeHandle(ref, () => ({
      focusCameraPreset: (preset) => managerRef.current?.focusCameraPreset(preset),
      focusRoom: (roomId) => managerRef.current?.focusRoom(roomId),
    }));

    return (
      <div className="relative w-full h-full bg-[#edf1f5]">
        <div
          ref={mountRef}
          className="w-full h-full"
          data-testid="threejs-canvas-container"
          aria-label="Interactive 3D architectural model of the residence"
        />
        {contextLost && (
          <div className="absolute inset-0 flex items-center justify-center bg-[#edf1f5] text-slate-800 p-6 text-center">
            <div className="max-w-md rounded-xl bg-white border border-slate-200 p-6 shadow-sm">
              <h2 className="font-display text-lg font-semibold">3D Context Paused</h2>
              <p className="mt-2 text-sm text-slate-600">
                WebGL graphics context was interrupted. Switch to the 2D Blueprint view or reload to restore the 3D scene.
              </p>
            </div>
          </div>
        )}
      </div>
    );
  },
);

Viewport3D.displayName = 'Viewport3D';
