"use client";

import React, { useMemo } from 'react';
import { STABLE_ISOTOPES } from '@/utils/nuclearPhysics';

interface DiagramaSegreProps {
  currentZ: number;
  currentN: number;
  targetZ: number;
  targetN: number;
}

const ELEMENT_LABELS: Record<number, string> = {
  1:'H', 2:'He', 3:'Li', 4:'Be', 5:'B', 6:'C', 7:'N', 8:'O', 9:'F', 10:'Ne',
};

const MAX_Z = 10;
const MAX_N = 14;
const CELL = 13;

export default function DiagramaSegre({ currentZ, currentN, targetZ, targetN }: DiagramaSegreProps) {
  const stableSet = useMemo(() => new Set(STABLE_ISOTOPES.map(([z,n]) => `${z}-${n}`)), []);

  const svgWidth  = (MAX_N + 2) * CELL + 20;
  const svgHeight = (MAX_Z + 1) * CELL + 16;

  return (
    <div className="w-full select-none">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[9px] font-black text-[#219EBC] uppercase tracking-widest">
          Diagrama de Segré
        </span>
        <span className="text-[8px] text-slate-500 font-semibold">Z vs N (1–10)</span>
      </div>

      <svg viewBox={`0 0 ${svgWidth} ${svgHeight}`} className="w-full" style={{height: 160}}>
        {/* Axis labels: N (horizontal) */}
        {[0,2,4,6,8,10,12,14].map(n => (
          <text key={`nl-${n}`} x={(n + 1) * CELL + CELL/2 + 4} y={svgHeight - 2} fontSize={7} fill="#475569" textAnchor="middle">{n}</text>
        ))}

        {/* Grid cells */}
        {Array.from({ length: MAX_Z }, (_, zi) => {
          const z = MAX_Z - zi; // Z goes from 10 (top) to 1 (bottom)
          return Array.from({ length: MAX_N + 1 }, (_, n) => {
            const key = `${z}-${n}`;
            const isStable = stableSet.has(key);
            const isCurrent = z === currentZ && n === currentN;
            const isTarget  = z === targetZ  && n === targetN;

            // Color logic
            let fill    = 'rgba(255,255,255,0.04)';
            let stroke  = 'transparent';
            let strokeW = 0;

            if (isStable)  { fill = '#219EBC28'; }
            if (isTarget)  { fill = '#219EBC66'; stroke = '#219EBC'; strokeW = 1; }
            if (isCurrent && !isTarget) { fill = '#fb8500dd'; stroke = '#fb8500'; strokeW = 1.5; }
            if (isCurrent && isTarget)  { fill = '#22c55e';   stroke = '#4ade80'; strokeW = 1.5; }

            return (
              <rect
                key={key}
                x={(n + 1) * CELL + 5}
                y={zi * CELL + 2}
                width={CELL - 1.5}
                height={CELL - 1.5}
                rx={2}
                fill={fill}
                stroke={stroke}
                strokeWidth={strokeW}
              />
            );
          });
        })}

        {/* Element labels on left axis */}
        {Array.from({ length: MAX_Z }, (_, zi) => {
          const z = MAX_Z - zi;
          return (
            <text key={`el-${z}`} x={4} y={zi * CELL + CELL - 3} fontSize={7} fill="#64748b" fontWeight="600">
              {ELEMENT_LABELS[z] ?? z}
            </text>
          );
        })}

        {/* N/Z = 1 stability line (diagonal) */}
        <line
          x1={(1 + 1) * CELL + 5 + CELL/2}
          y1={(MAX_Z - 1) * CELL + CELL/2}
          x2={(MAX_N + 1 + 1) * CELL + 5 - CELL}
          y2={2 + CELL/2}
          stroke="rgba(255,255,255,0.12)"
          strokeWidth={1}
          strokeDasharray="3,4"
        />
      </svg>

      {/* Legend */}
      <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1">
        {[
          { color: '#219EBC28', label: 'Estable' },
          { color: '#219EBC66', label: 'Objetivo' },
          { color: '#fb8500', label: 'Tu átomo' },
          { color: '#22c55e', label: '¡Correcto!' },
        ].map(item => (
          <div key={item.label} className="flex items-center gap-1">
            <div className="w-2.5 h-2.5 rounded-sm border border-white/10" style={{ background: item.color }} />
            <span className="text-[8px] text-slate-400 font-semibold">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
