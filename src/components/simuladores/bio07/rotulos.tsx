'use client';
/**
 * bio07/rotulos.tsx — rótulos cortos de las partes (DOM sobre la escena, apagados por
 * defecto; ≤ 8 por vista). Punto en la pieza, línea guía y etiqueta desplazada (dx, dy) px.
 */
import React from 'react';
import { Html } from '@react-three/drei';
import type { V3 } from './geometria';

export interface Rotulo { texto: string; p: V3; dx: number; dy: number }

export function Rotulos({ lista }: { lista: Rotulo[] }) {
  return (
    <>
      {lista.slice(0, 8).map((r) => {
        const L = Math.hypot(r.dx, r.dy), ang = Math.atan2(r.dy, r.dx);
        return (
          <Html key={r.texto} position={r.p} zIndexRange={[20, 10]} style={{ pointerEvents: 'none' }}>
            <div className="relative h-0 w-0">
              <span className="absolute left-[-3px] top-[-3px] h-1.5 w-1.5 rounded-full bg-white/90 shadow-[0_0_6px_rgba(255,255,255,0.8)]" />
              <span className="absolute left-0 top-0 h-px origin-left bg-white/50" style={{ width: L, transform: `rotate(${ang}rad)` }} />
              <span className="absolute whitespace-nowrap rounded border border-white/15 bg-[#0b1422]/85 px-1.5 py-0.5 text-[10.5px] font-medium leading-none text-slate-100"
                style={{ left: r.dx, top: r.dy, transform: `translate(${r.dx < 0 ? '-100%' : r.dx === 0 ? '-50%' : '0'}, -50%)` }}>
                {r.texto}
              </span>
            </div>
          </Html>
        );
      })}
    </>
  );
}
