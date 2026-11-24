import React from 'react';
import { HOUSE_FLOOR_PLAN, RoomId, RoomSpec } from '../plan/floorPlanData';
import { computeStairSteps, formatFeetInches } from '../plan/geometryMath';

interface Blueprint2DProps {
  selectedRoomId: RoomId | null;
  hoveredRoomId: RoomId | null;
  doorsOpen: boolean;
  showDimensions: boolean;
  onSelectRoom: (roomId: RoomId) => void;
  onHoverRoom: (roomId: RoomId | null) => void;
}

const SCALE = 22; // 22 px per foot -> 37.5' = 825px, 28' total = 616px
const PAD_LEFT = 92;
const PAD_RIGHT = 92;
const PAD_TOP = 82;
const PAD_BOTTOM = 68;

const PLAN_W = HOUSE_FLOOR_PLAN.overall.exteriorWidthFt;
const HOUSE_D = HOUSE_FLOOR_PLAN.overall.exteriorDepthFt;
const PATIO_MIN_Y = -7.0;

const SVG_W = PLAN_W * SCALE + PAD_LEFT + PAD_RIGHT;
const SVG_H = (HOUSE_D - PATIO_MIN_Y) * SCALE + PAD_TOP + PAD_BOTTOM;

function toSvgX(planX: number): number {
  return PAD_LEFT + planX * SCALE;
}

function toSvgY(planY: number): number {
  return PAD_TOP + (HOUSE_D - planY) * SCALE;
}

export const Blueprint2D: React.FC<Blueprint2DProps> = ({
  selectedRoomId,
  hoveredRoomId,
  doorsOpen,
  showDimensions,
  onSelectRoom,
  onHoverRoom,
}) => {
  const stairSteps = React.useMemo(() => computeStairSteps(HOUSE_FLOOR_PLAN.staircase), []);

  const wallRects = React.useMemo(() => {
    const rects: Array<{ id: string; x: number; y: number; w: number; h: number; isExt: boolean }> =
      [];

    for (const wall of HOUSE_FLOOR_PLAN.walls) {
      const isHoriz = wall.orientation === 'horizontal';
      const minC = isHoriz
        ? Math.min(wall.startFt[0], wall.endFt[0])
        : Math.min(wall.startFt[1], wall.endFt[1]);
      const maxC = isHoriz
        ? Math.max(wall.startFt[0], wall.endFt[0])
        : Math.max(wall.startFt[1], wall.endFt[1]);
      const fixedC = isHoriz ? wall.startFt[1] : wall.startFt[0];

      const openings: Array<{ start: number; end: number }> = [];
      for (const d of HOUSE_FLOOR_PLAN.doors) {
        if (d.wallId !== wall.id) continue;
        const c = isHoriz ? d.centerFt[0] : d.centerFt[1];
        openings.push({ start: c - d.widthFt / 2, end: c + d.widthFt / 2 });
      }
      for (const w of HOUSE_FLOOR_PLAN.windows) {
        if (w.wallId !== wall.id) continue;
        const c = isHoriz ? w.centerFt[0] : w.centerFt[1];
        openings.push({ start: c - w.widthFt / 2, end: c + w.widthFt / 2 });
      }
      openings.sort((a, b) => a.start - b.start);

      let cursor = minC;
      let idx = 0;
      const pushSeg = (s: number, e: number) => {
        if (e - s <= 0.01) return;
        if (isHoriz) {
          rects.push({
            id: `${wall.id}_${idx++}`,
            x: toSvgX(s),
            y: toSvgY(fixedC + wall.thicknessFt / 2),
            w: (e - s) * SCALE,
            h: wall.thicknessFt * SCALE,
            isExt: wall.type === 'exterior',
          });
        } else {
          rects.push({
            id: `${wall.id}_${idx++}`,
            x: toSvgX(fixedC - wall.thicknessFt / 2),
            y: toSvgY(e),
            w: wall.thicknessFt * SCALE,
            h: (e - s) * SCALE,
            isExt: wall.type === 'exterior',
          });
        }
      };

      for (const op of openings) {
        pushSeg(cursor, op.start);
        cursor = Math.max(cursor, op.end);
      }
      pushSeg(cursor, maxC);
    }

    return rects;
  }, []);

  const handleRoomKey = (e: React.KeyboardEvent, roomId: RoomId) => {
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      onSelectRoom(roomId);
    }
  };

  return (
    <div
      className="w-full h-full flex items-center justify-center bg-[#f4f6f9] px-4 pt-20 pb-28 overflow-auto"
      data-testid="blueprint-2d-container"
    >
      <div className="bg-white border border-slate-200 shadow-sm rounded-xl p-3 sm:p-4 max-w-[1000px] w-full flex items-center justify-center">
        <svg
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          className="w-full max-h-[calc(100vh-230px)] h-auto block select-none"
          role="img"
          aria-label="2D Architectural Floor Plan of 37'-6&quot; by 21'-0&quot; Residence with 22'-0&quot; by 7'-0&quot; South Entry Patio"
        >
          <defs>
            <pattern id="cad-grid-minor" width={SCALE} height={SCALE} patternUnits="userSpaceOnUse">
              <path
                d={`M ${SCALE} 0 L 0 0 0 ${SCALE}`}
                fill="none"
                stroke="#e2e8f0"
                strokeWidth="0.6"
              />
            </pattern>
            <pattern
              id="cad-grid-major"
              width={SCALE * 5}
              height={SCALE * 5}
              patternUnits="userSpaceOnUse"
            >
              <rect width={SCALE * 5} height={SCALE * 5} fill="url(#cad-grid-minor)" />
              <path
                d={`M ${SCALE * 5} 0 L 0 0 0 ${SCALE * 5}`}
                fill="none"
                stroke="#cbd5e1"
                strokeWidth="0.9"
              />
            </pattern>
            <pattern id="patio-pavers" width={SCALE * 2} height={SCALE * 2} patternUnits="userSpaceOnUse">
              <path
                d={`M ${SCALE * 2} 0 L 0 0 0 ${SCALE * 2}`}
                fill="none"
                stroke="#94a3b8"
                strokeWidth="0.7"
                strokeOpacity="0.45"
              />
            </pattern>
            <pattern id="wall-hatch" width="8" height="8" patternUnits="userSpaceOnUse">
              <path d="M-2,2 l4,-4 M0,8 l8,-8 M6,10 l4,-4" stroke="#475569" strokeWidth="1" />
            </pattern>
            <marker
              id="arrow-up"
              viewBox="0 0 10 10"
              refX="8"
              refY="5"
              markerWidth="6"
              markerHeight="6"
              orient="auto-start-reverse"
            >
              <path d="M 0 1 L 10 5 L 0 9 z" fill="#0f172a" />
            </marker>
          </defs>

          {/* Architectural Drawing Grid Sheet */}
          <rect
            x={PAD_LEFT - 24}
            y={PAD_TOP - 24}
            width={PLAN_W * SCALE + 48}
            height={(HOUSE_D - PATIO_MIN_Y) * SCALE + 48}
            fill="url(#cad-grid-major)"
            stroke="#cbd5e1"
            strokeWidth="1"
          />

          {/* Interactive Room & Outdoor Patio Floor Zones */}
          {HOUSE_FLOOR_PLAN.rooms.map((room: RoomSpec) => {
            const x = toSvgX(room.bounds.xMin);
            const y = toSvgY(room.bounds.yMax);
            const w = room.widthFt * SCALE;
            const h = room.depthFt * SCALE;
            const isSelected = selectedRoomId === room.id;
            const isHovered = hoveredRoomId === room.id;

            const baseFill =
              room.id === 'south_patio'
                ? '#f0fdf4'
                : room.id === 'kitchen_under_staircase'
                  ? '#fffbeb'
                  : room.id === 'corridor_dining_space'
                    ? '#f8fafc'
                    : '#fdfaf5';

            return (
              <g
                key={room.id}
                role="button"
                tabIndex={0}
                aria-label={`Inspect ${room.name}, ${formatFeetInches(room.widthFt)} by ${formatFeetInches(room.depthFt)}, ${room.areaSqft} square feet`}
                onClick={() => onSelectRoom(room.id)}
                onKeyDown={(e) => handleRoomKey(e, room.id)}
                onMouseEnter={() => onHoverRoom(room.id)}
                onMouseLeave={() => onHoverRoom(null)}
                className="cursor-pointer outline-none"
              >
                <rect
                  x={x}
                  y={y}
                  width={w}
                  height={h}
                  fill={isSelected ? `${room.accentColor}24` : isHovered ? `${room.accentColor}14` : baseFill}
                  stroke={
                    isSelected
                      ? room.accentColor
                      : room.id === 'south_patio'
                        ? '#64748b'
                        : 'transparent'
                  }
                  strokeWidth={isSelected ? 2 : room.id === 'south_patio' ? 1.5 : 0}
                  strokeDasharray={room.id === 'south_patio' && !isSelected ? '5 3' : undefined}
                />
                {room.id === 'south_patio' && (
                  <rect
                    x={x}
                    y={y}
                    width={w}
                    height={h}
                    fill="url(#patio-pavers)"
                    className="pointer-events-none"
                  />
                )}
              </g>
            );
          })}

          {/* South Patio CAD Details: Planter Boxes, Outdoor Seating & Garden Steps */}
          <g className="pointer-events-none">
            {/* West & East Planter Boxes flanking Patio */}
            <rect
              x={toSvgX(8.6)}
              y={toSvgY(-0.5)}
              width={2.6 * SCALE}
              height={1.4 * SCALE}
              fill="#dcfce7"
              stroke="#15803d"
              strokeWidth="1.2"
            />
            <circle cx={toSvgX(9.4)} cy={toSvgY(-1.2)} r={6} fill="#86efac" stroke="#15803d" strokeWidth="1" />
            <circle cx={toSvgX(10.4)} cy={toSvgY(-1.2)} r={5.5} fill="#86efac" stroke="#15803d" strokeWidth="1" />

            <rect
              x={toSvgX(27.3)}
              y={toSvgY(-0.5)}
              width={2.6 * SCALE}
              height={1.4 * SCALE}
              fill="#dcfce7"
              stroke="#15803d"
              strokeWidth="1.2"
            />
            <circle cx={toSvgX(28.1)} cy={toSvgY(-1.2)} r={6} fill="#86efac" stroke="#15803d" strokeWidth="1" />
            <circle cx={toSvgX(29.1)} cy={toSvgY(-1.2)} r={5.5} fill="#86efac" stroke="#15803d" strokeWidth="1" />

            {/* Outdoor Lounge Chairs + Coffee Table (East Patio Zone) */}
            <rect
              x={toSvgX(23.5)}
              y={toSvgY(-2.3)}
              width={2.4 * SCALE}
              height={2.2 * SCALE}
              rx="3"
              fill="#ffffff"
              stroke="#475569"
              strokeWidth="1.1"
            />
            <rect
              x={toSvgX(26.4)}
              y={toSvgY(-2.5)}
              width={2.2 * SCALE}
              height={1.6 * SCALE}
              rx="2"
              fill="#ffffff"
              stroke="#475569"
              strokeWidth="1.1"
            />
            {/* West Patio Café Bistro Pair */}
            <circle cx={toSvgX(12.2)} cy={toSvgY(-4.0)} r={1.05 * SCALE} fill="#ffffff" stroke="#475569" strokeWidth="1.1" />
            <circle cx={toSvgX(10.5)} cy={toSvgY(-4.0)} r={0.55 * SCALE} fill="#ffffff" stroke="#475569" strokeWidth="1" />
            <circle cx={toSvgX(13.9)} cy={toSvgY(-4.0)} r={0.55 * SCALE} fill="#ffffff" stroke="#475569" strokeWidth="1" />

            {/* Centered Patio Steps descending South to Garden Path */}
            <rect
              x={toSvgX(16.25)}
              y={toSvgY(-7.0)}
              width={5.0 * SCALE}
              height={1.6 * SCALE}
              fill="#e2e8f0"
              stroke="#475569"
              strokeWidth="1.2"
            />
            <line
              x1={toSvgX(16.25)}
              y1={toSvgY(-7.8)}
              x2={toSvgX(21.25)}
              y2={toSvgY(-7.8)}
              stroke="#475569"
              strokeWidth="1"
            />
            <text
              x={toSvgX(18.75)}
              y={toSvgY(-8.2)}
              textAnchor="middle"
              fontSize="8.5"
              fontWeight="600"
              fill="#475569"
            >
              DN TO GARDEN WALKWAY
            </text>
          </g>

          {/* Bedroom CAD Furniture */}
          <g stroke="#64748b" strokeWidth="1" fill="#ffffff">
            <rect x={toSvgX(28.1)} y={toSvgY(20.0)} width={5.6 * SCALE} height={6.6 * SCALE} rx="2" />
            <rect x={toSvgX(28.4)} y={toSvgY(19.8)} width={2.2 * SCALE} height={1.1 * SCALE} rx="2" />
            <rect x={toSvgX(31.2)} y={toSvgY(19.8)} width={2.2 * SCALE} height={1.1 * SCALE} rx="2" />
            <line x1={toSvgX(28.1)} y1={toSvgY(16.6)} x2={toSvgX(33.7)} y2={toSvgY(16.6)} />
            <rect x={toSvgX(26.4)} y={toSvgY(20.0)} width={1.4 * SCALE} height={1.3 * SCALE} rx="1" />
            <rect x={toSvgX(34.0)} y={toSvgY(20.0)} width={1.4 * SCALE} height={1.3 * SCALE} rx="1" />
          </g>

          <g stroke="#64748b" strokeWidth="1" fill="#ffffff">
            <rect x={toSvgX(15.35)} y={toSvgY(20.0)} width={4.8 * SCALE} height={6.2 * SCALE} rx="2" />
            <rect x={toSvgX(15.65)} y={toSvgY(19.8)} width={1.9 * SCALE} height={1.0 * SCALE} rx="2" />
            <rect x={toSvgX(17.95)} y={toSvgY(19.8)} width={1.9 * SCALE} height={1.0 * SCALE} rx="2" />
            <line x1={toSvgX(15.35)} y1={toSvgY(16.8)} x2={toSvgX(20.15)} y2={toSvgY(16.8)} />
          </g>

          <g stroke="#64748b" strokeWidth="1" fill="#ffffff">
            <rect x={toSvgX(3.85)} y={toSvgY(20.0)} width={4.8 * SCALE} height={6.2 * SCALE} rx="2" />
            <rect x={toSvgX(4.15)} y={toSvgY(19.8)} width={1.9 * SCALE} height={1.0 * SCALE} rx="2" />
            <rect x={toSvgX(6.45)} y={toSvgY(19.8)} width={1.9 * SCALE} height={1.0 * SCALE} rx="2" />
            <line x1={toSvgX(3.85)} y1={toSvgY(16.8)} x2={toSvgX(8.65)} y2={toSvgY(16.8)} />
          </g>

          {/* East-Facing Kitchen Counters under Staircase */}
          <g stroke="#92400e" strokeWidth="1.2" fill="#fef3c7" fillOpacity="0.55">
            <rect x={toSvgX(0.85)} y={toSvgY(9.65)} width={2.2 * SCALE} height={4.75 * SCALE} />
            <rect
              x={toSvgX(1.25)}
              y={toSvgY(8.2)}
              width={1.4 * SCALE}
              height={2.0 * SCALE}
              rx="2"
              fill="#ffffff"
              stroke="#475569"
            />
            <rect x={toSvgX(3.05)} y={toSvgY(9.65)} width={4.15 * SCALE} height={2.0 * SCALE} />
            <circle cx={toSvgX(4.55)} cy={toSvgY(9.0)} r={5} fill="none" stroke="#334155" />
            <circle cx={toSvgX(5.65)} cy={toSvgY(9.0)} r={5} fill="none" stroke="#334155" />
            <circle cx={toSvgX(4.55)} cy={toSvgY(8.3)} r={5} fill="none" stroke="#334155" />
            <circle cx={toSvgX(5.65)} cy={toSvgY(8.3)} r={5} fill="none" stroke="#334155" />
            <rect x={toSvgX(6.55)} y={toSvgY(7.65)} width={1.65 * SCALE} height={3.3 * SCALE} />
          </g>
          <circle cx={toSvgX(8.85)} cy={toSvgY(5.2)} r={6} fill="#ffffff" stroke="#475569" />
          <circle cx={toSvgX(8.85)} cy={toSvgY(6.8)} r={6} fill="#ffffff" stroke="#475569" />

          {/* 4-Seater Dining Table */}
          <g stroke="#475569" strokeWidth="1.2" fill="#ffffff">
            <rect x={toSvgX(10.2)} y={toSvgY(5.0)} width={4.6 * SCALE} height={2.8 * SCALE} rx="3" />
            <rect x={toSvgX(10.8)} y={toSvgY(5.7)} width={1.2 * SCALE} height={0.55 * SCALE} rx="2" />
            <rect x={toSvgX(13.0)} y={toSvgY(5.7)} width={1.2 * SCALE} height={0.55 * SCALE} rx="2" />
            <rect x={toSvgX(10.8)} y={toSvgY(2.05)} width={1.2 * SCALE} height={0.55 * SCALE} rx="2" />
            <rect x={toSvgX(13.0)} y={toSvgY(2.05)} width={1.2 * SCALE} height={0.55 * SCALE} rx="2" />
          </g>

          {/* L-Shaped Roof Staircase Treads & UP Direction Path */}
          <g stroke="#334155" strokeWidth="1" fill="#f1f5f9" fillOpacity="0.72">
            {stairSteps.map((s) => {
              if (s.isWinder) {
                const x0 = toSvgX(0.75);
                const x1 = toSvgX(3.75);
                const yBottom = toSvgY(0.75);
                const yTop = toSvgY(3.75);
                const pts =
                  s.winderHalf === 'south_east'
                    ? `${x0},${yBottom} ${x1},${yBottom} ${x0},${yTop}`
                    : `${x1},${yBottom} ${x1},${yTop} ${x0},${yTop}`;
                return <polygon key={s.stepNumber} points={pts} />;
              }
              return (
                <rect
                  key={s.stepNumber}
                  x={toSvgX(s.planCx - s.planWidthX / 2)}
                  y={toSvgY(s.planCy + s.planDepthY / 2)}
                  width={s.planWidthX * SCALE}
                  height={s.planDepthY * SCALE}
                />
              );
            })}
            <polyline
              points={`${toSvgX(8.1)},${toSvgY(2.25)} ${toSvgX(2.25)},${toSvgY(2.25)} ${toSvgX(2.25)},${toSvgY(9.35)}`}
              fill="none"
              stroke="#0f172a"
              strokeWidth="1.5"
              markerEnd="url(#arrow-up)"
            />
          </g>

          {/* Room & Patio Labels */}
          <g className="pointer-events-none" textAnchor="middle">
            <text x={toSvgX(6.25)} y={toSvgY(12.8)} fontSize="11.5" fontWeight="700" fill="#0f172a">
              BEDROOM 3
            </text>
            <text
              x={toSvgX(6.25)}
              y={toSvgY(11.8)}
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="#475569"
            >
              11&apos;-0&quot; × 10&apos;-0&quot; · 110 sq ft
            </text>

            <text x={toSvgX(17.75)} y={toSvgY(12.8)} fontSize="11.5" fontWeight="700" fill="#0f172a">
              BEDROOM 2
            </text>
            <text
              x={toSvgX(17.75)}
              y={toSvgY(11.8)}
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="#475569"
            >
              11&apos;-0&quot; × 10&apos;-0&quot; · 110 sq ft
            </text>

            <text x={toSvgX(30.25)} y={toSvgY(12.8)} fontSize="11.5" fontWeight="700" fill="#0f172a">
              MASTER BEDROOM
            </text>
            <text
              x={toSvgX(30.25)}
              y={toSvgY(11.8)}
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="#475569"
            >
              13&apos;-0&quot; × 10&apos;-0&quot; · 130 sq ft
            </text>

            <text x={toSvgX(5.4)} y={toSvgY(6.1)} fontSize="10" fontWeight="700" fill="#92400e">
              KITCHEN
            </text>
            <text
              x={toSvgX(5.4)}
              y={toSvgY(5.2)}
              fontSize="8.5"
              fontFamily="JetBrains Mono, monospace"
              fill="#92400e"
            >
              EAST-FACING
            </text>
            <text
              x={toSvgX(5.9)}
              y={toSvgY(1.3)}
              fontSize="8.5"
              fontWeight="600"
              fontFamily="JetBrains Mono, monospace"
              fill="#0f172a"
            >
              UP 17R TO ROOF
            </text>

            <text x={toSvgX(23.5)} y={toSvgY(5.6)} fontSize="11.5" fontWeight="700" fill="#0f172a">
              LONG CORRIDOR &amp; SMALL DINING SPACE
            </text>
            <text
              x={toSvgX(23.5)}
              y={toSvgY(4.6)}
              fontSize="10"
              fontFamily="JetBrains Mono, monospace"
              fill="#475569"
            >
              28&apos;-6&quot; × 9&apos;-0&quot; · 256.5 sq ft
            </text>
            <text x={toSvgX(12.5)} y={toSvgY(6.4)} fontSize="9" fontWeight="600" fill="#334155">
              DINING
            </text>

            {/* South Patio Label */}
            <text x={toSvgX(18.75)} y={toSvgY(-3.3)} fontSize="11" fontWeight="700" fill="#166534">
              SOUTH ENTRY PATIO (OUTDOOR)
            </text>
            <text
              x={toSvgX(18.75)}
              y={toSvgY(-4.4)}
              fontSize="9.5"
              fontFamily="JetBrains Mono, monospace"
              fill="#15803d"
            >
              22&apos;-0&quot; × 7&apos;-0&quot; · 154.0 sq ft
            </text>
          </g>

          {/* Masonry Walls */}
          {wallRects.map((wr) => (
            <g key={wr.id}>
              <rect
                x={wr.x}
                y={wr.y}
                width={wr.w}
                height={wr.h}
                fill={wr.isExt ? '#1e293b' : '#334155'}
              />
              <rect
                x={wr.x}
                y={wr.y}
                width={wr.w}
                height={wr.h}
                fill="url(#wall-hatch)"
                opacity="0.35"
              />
            </g>
          ))}

          {/* Glazed Windows */}
          {HOUSE_FLOOR_PLAN.windows.map((win) => {
            const isHoriz = win.orientation === 'horizontal';
            const thick = HOUSE_FLOOR_PLAN.overall.exteriorWallThicknessFt * SCALE;
            const len = win.widthFt * SCALE;
            const x = isHoriz
              ? toSvgX(win.centerFt[0] - win.widthFt / 2)
              : toSvgX(win.centerFt[0]) - thick / 2;
            const y = isHoriz
              ? toSvgY(win.centerFt[1]) - thick / 2
              : toSvgY(win.centerFt[1] + win.widthFt / 2);

            return (
              <g key={win.id}>
                <rect
                  x={x}
                  y={y}
                  width={isHoriz ? len : thick}
                  height={isHoriz ? thick : len}
                  fill="#e0f2fe"
                  stroke="#0284c7"
                  strokeWidth="1.2"
                />
                {isHoriz ? (
                  <line
                    x1={x}
                    y1={y + thick / 2}
                    x2={x + len}
                    y2={y + thick / 2}
                    stroke="#0369a1"
                    strokeWidth="1.5"
                  />
                ) : (
                  <line
                    x1={x + thick / 2}
                    y1={y}
                    x2={x + thick / 2}
                    y2={y + len}
                    stroke="#0369a1"
                    strokeWidth="1.5"
                  />
                )}
              </g>
            );
          })}

          {/* Doors with Swing Arcs */}
          {HOUSE_FLOOR_PLAN.doors.map((door) => {
            const r = door.widthFt * SCALE;
            const hingeX =
              door.hingeSide === 'west'
                ? toSvgX(door.centerFt[0] - door.widthFt / 2)
                : toSvgX(door.centerFt[0] + door.widthFt / 2);
            const latchX =
              door.hingeSide === 'west'
                ? toSvgX(door.centerFt[0] + door.widthFt / 2)
                : toSvgX(door.centerFt[0] - door.widthFt / 2);
            const doorY = toSvgY(door.centerFt[1]);

            const arcEndY = doorY - r;
            const sweepFlag = door.hingeSide === 'west' ? 0 : 1;
            const arcPath = `M ${latchX} ${doorY} A ${r} ${r} 0 0 ${sweepFlag} ${hingeX} ${arcEndY}`;

            const openDeg = doorsOpen ? 82 : 18;
            const rotAngle = door.hingeSide === 'west' ? -openDeg : openDeg;

            return (
              <g key={door.id}>
                <path
                  d={arcPath}
                  fill="none"
                  stroke="#92400e"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                />
                <line
                  x1={hingeX}
                  y1={doorY}
                  x2={latchX}
                  y2={doorY}
                  stroke="#78350f"
                  strokeWidth="4"
                  strokeLinecap="round"
                  transform={`rotate(${rotAngle} ${hingeX} ${doorY})`}
                />
                <text
                  x={toSvgX(door.centerFt[0])}
                  y={doorY + (door.id === 'door_main_entry' ? 19 : 13)}
                  fontSize="8.5"
                  fontWeight="600"
                  textAnchor="middle"
                  fill="#78350f"
                >
                  {door.id === 'door_main_entry' ? 'MAIN ENTRY (4\'-0")' : 'D (3\'-0")'}
                </text>
              </g>
            );
          })}

          {/* Architectural Dimension Callouts */}
          {showDimensions && (
            <g stroke="#2563eb" strokeWidth="1" fill="#1d4ed8" fontSize="10" fontFamily="JetBrains Mono, monospace">
              {/* Top Overall Width: 37'-6" */}
              <line x1={toSvgX(0)} y1={PAD_TOP - 40} x2={toSvgX(PLAN_W)} y2={PAD_TOP - 40} />
              <line x1={toSvgX(0)} y1={PAD_TOP - 46} x2={toSvgX(0)} y2={PAD_TOP - 8} strokeOpacity="0.4" />
              <line x1={toSvgX(PLAN_W)} y1={PAD_TOP - 46} x2={toSvgX(PLAN_W)} y2={PAD_TOP - 8} strokeOpacity="0.4" />
              <text x={toSvgX(PLAN_W / 2)} y={PAD_TOP - 46} textAnchor="middle" stroke="none" fontWeight="600">
                OVERALL WIDTH: 37&apos;-6&quot;
              </text>

              {/* Top Bedroom Bay Widths */}
              <line x1={toSvgX(0.75)} y1={PAD_TOP - 19} x2={toSvgX(11.75)} y2={PAD_TOP - 19} />
              <text x={toSvgX(6.25)} y={PAD_TOP - 24} textAnchor="middle" stroke="none">11&apos;-0&quot;</text>

              <line x1={toSvgX(12.25)} y1={PAD_TOP - 19} x2={toSvgX(23.25)} y2={PAD_TOP - 19} />
              <text x={toSvgX(17.75)} y={PAD_TOP - 24} textAnchor="middle" stroke="none">11&apos;-0&quot;</text>

              <line x1={toSvgX(23.75)} y1={PAD_TOP - 19} x2={toSvgX(36.75)} y2={PAD_TOP - 19} />
              <text x={toSvgX(30.25)} y={PAD_TOP - 24} textAnchor="middle" stroke="none">13&apos;-0&quot;</text>

              {/* Left Depth Callouts: House 21'-0" + Patio 7'-0" = 28'-0" Total */}
              <line x1={PAD_LEFT - 58} y1={toSvgY(PATIO_MIN_Y)} x2={PAD_LEFT - 58} y2={toSvgY(HOUSE_D)} />
              <text
                x={PAD_LEFT - 67}
                y={toSvgY((HOUSE_D + PATIO_MIN_Y) / 2)}
                textAnchor="middle"
                stroke="none"
                fontWeight="600"
                transform={`rotate(-90 ${PAD_LEFT - 67} ${toSvgY((HOUSE_D + PATIO_MIN_Y) / 2)})`}
              >
                TOTAL 28&apos;-0&quot;
              </text>

              <line x1={PAD_LEFT - 28} y1={toSvgY(0)} x2={PAD_LEFT - 28} y2={toSvgY(HOUSE_D)} />
              <text
                x={PAD_LEFT - 36}
                y={toSvgY(HOUSE_D / 2)}
                textAnchor="middle"
                stroke="none"
                transform={`rotate(-90 ${PAD_LEFT - 36} ${toSvgY(HOUSE_D / 2)})`}
              >
                HOUSE 21&apos;-0&quot;
              </text>

              <line x1={PAD_LEFT - 28} y1={toSvgY(PATIO_MIN_Y)} x2={PAD_LEFT - 28} y2={toSvgY(0)} />
              <text
                x={PAD_LEFT - 36}
                y={toSvgY(-3.5)}
                textAnchor="middle"
                stroke="none"
                fill="#15803d"
                transform={`rotate(-90 ${PAD_LEFT - 36} ${toSvgY(-3.5)})`}
              >
                PATIO 7&apos;-0&quot;
              </text>

              {/* Right Wing Depths */}
              <line x1={toSvgX(PLAN_W) + 26} y1={toSvgY(10.25)} x2={toSvgX(PLAN_W) + 26} y2={toSvgY(20.25)} />
              <text
                x={toSvgX(PLAN_W) + 39}
                y={toSvgY(15.25)}
                textAnchor="middle"
                stroke="none"
                transform={`rotate(-90 ${toSvgX(PLAN_W) + 39} ${toSvgY(15.25)})`}
              >
                10&apos;-0&quot;
              </text>

              <line x1={toSvgX(PLAN_W) + 26} y1={toSvgY(0.75)} x2={toSvgX(PLAN_W) + 26} y2={toSvgY(9.75)} />
              <text
                x={toSvgX(PLAN_W) + 39}
                y={toSvgY(5.25)}
                textAnchor="middle"
                stroke="none"
                transform={`rotate(-90 ${toSvgX(PLAN_W) + 39} ${toSvgY(5.25)})`}
              >
                9&apos;-0&quot;
              </text>

              {/* Bottom Patio Width Callout: 22'-0" */}
              <line x1={toSvgX(8.25)} y1={toSvgY(-7.0) + 36} x2={toSvgX(30.25)} y2={toSvgY(-7.0) + 36} stroke="#15803d" />
              <line x1={toSvgX(8.25)} y1={toSvgY(-7.0) + 6} x2={toSvgX(8.25)} y2={toSvgY(-7.0) + 42} stroke="#15803d" strokeOpacity="0.4" />
              <line x1={toSvgX(30.25)} y1={toSvgY(-7.0) + 6} x2={toSvgX(30.25)} y2={toSvgY(-7.0) + 42} stroke="#15803d" strokeOpacity="0.4" />
              <text x={toSvgX(19.25)} y={toSvgY(-7.0) + 50} textAnchor="middle" stroke="none" fill="#15803d" fontWeight="600">
                SOUTH PATIO WIDTH: 22&apos;-0&quot; (x = 8&apos;-3&quot; to 30&apos;-3&quot;)
              </text>
            </g>
          )}

          {/* North Compass Rose */}
          <g transform={`translate(${SVG_W - 44}, 42)`}>
            <circle cx="0" cy="0" r="18" fill="#ffffff" stroke="#cbd5e1" strokeWidth="1" />
            <polygon points="0,-13 5,4 0,0 -5,4" fill="#0f172a" />
            <text x="0" y="-19" textAnchor="middle" fontSize="10" fontWeight="700" fill="#0f172a">
              N
            </text>
          </g>
        </svg>
      </div>
    </div>
  );
};
