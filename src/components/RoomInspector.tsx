import React from 'react';
import { X, Compass, DoorOpen } from 'lucide-react';
import { HOUSE_FLOOR_PLAN, RoomId } from '../plan/floorPlanData';
import { formatFeetInches } from '../plan/geometryMath';

interface RoomInspectorProps {
  roomId: RoomId;
  onClose: () => void;
  onFocusIn3D: (roomId: RoomId) => void;
  showFocusButton: boolean;
  docked?: boolean;
}

export const RoomInspector: React.FC<RoomInspectorProps> = ({
  roomId,
  onClose,
  onFocusIn3D,
  showFocusButton,
  docked = false,
}) => {
  const room = HOUSE_FLOOR_PLAN.rooms.find((r) => r.id === roomId);
  if (!room) return null;

  const door = room.doorId
    ? HOUSE_FLOOR_PLAN.doors.find((d) => d.id === room.doorId)
    : undefined;

  return (
    <aside
      aria-label={`${room.name} details`}
      className={
        docked
          ? 'w-full lg:w-[320px] shrink-0 bg-white border-t lg:border-t-0 lg:border-l border-slate-200 p-5 text-slate-900 overflow-y-auto pb-28'
          : 'fixed top-4 right-4 z-20 w-[300px] sm:w-[320px] rounded-xl bg-white/95 border border-slate-200/90 shadow-lg p-4 text-slate-900 pointer-events-auto'
      }
    >
      <div className="flex items-start justify-between gap-3">
        <div>
          <p className="text-[11px] font-medium text-slate-500">
            {room.kind === 'outdoor' ? 'Outdoor Space' : 'Interior Space'} · {room.areaSqft.toFixed(1)} sq ft
          </p>
          <h2 className="font-display text-base font-semibold text-slate-900 leading-snug">
            {room.name}
          </h2>
        </div>
        <button
          type="button"
          onClick={onClose}
          aria-label={`Close ${room.name} details`}
          className="p-1.5 rounded-lg text-slate-500 hover:text-slate-900 hover:bg-slate-100 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      <div className="mt-3 pt-3 border-t border-slate-100 grid grid-cols-2 gap-3 text-xs">
        <div>
          <div className="text-slate-500">Dimensions</div>
          <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
            {formatFeetInches(room.widthFt)} × {formatFeetInches(room.depthFt)}
          </div>
        </div>
        <div>
          <div className="text-slate-500">Floor Area</div>
          <div className="font-mono-num font-semibold text-slate-900 mt-0.5">
            {room.areaSqft.toFixed(1)} sq ft
          </div>
        </div>
      </div>

      {door && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700">
          <DoorOpen className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            {door.label} ({formatFeetInches(door.widthFt)} wide, South-facing wooden door)
          </span>
        </div>
      )}

      {room.id === 'kitchen_under_staircase' && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-start gap-2 text-xs text-slate-700">
          <Compass className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" />
          <span>
            East-facing kitchen tucked under the 17-riser L-shaped roof staircase.
          </span>
        </div>
      )}

      {room.relationToInterior && (
        <div className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-700">
          <span className="font-semibold text-slate-900">Relation to Interior: </span>
          {room.relationToInterior}
        </div>
      )}

      <p className="mt-2.5 text-xs text-slate-600 leading-relaxed">{room.notes}</p>

      {showFocusButton && (
        <button
          type="button"
          onClick={() => onFocusIn3D(room.id)}
          className="mt-3 w-full py-2 px-3 rounded-lg bg-slate-900 text-white text-xs font-medium hover:bg-slate-800 transition-colors cursor-pointer whitespace-nowrap"
        >
          Focus Camera on Room
        </button>
      )}
    </aside>
  );
};
