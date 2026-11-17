'use client';
/**
 * RaizLabEstrella — envoltura OPCIONAL de un lab (hoy: biologia-8 y fisica-10). No cambia
 * el kit: lo que hace vale sólo debajo de su raíz.
 *
 *  1. Ancho: el lab va en una capa `absolute inset-0`, así que su contenido deja de contar
 *     para el ancho mínimo de la columna central de SimuladorClient. Sin esto, una fila que
 *     no salta de línea (la barra de lecturas) ensanchaba la página entera y cortaba la
 *     bitácora (1366 px) o los mandos (390 px).
 *  2. Letra: ningún texto por debajo de 13 px. Los tamaños chicos del kit (LabLayout,
 *     Lectura, BotonLab, AvisoReto, BitacoraFisica) se suben aquí, sin tocar sus archivos.
 */
import React from 'react';

/** Clases de tamaño de letra por debajo de 13 px que usa el kit (y sus rótulos en versalitas). */
const CHICAS = ['8px', '9px', '9.5px', '10px', '10.5px', '11px', '11.5px', '12px', '12.5px']
  .map((t) => `[class*="text-[${t}]"]`).concat(['.text-xs']);

const css = (raiz: string) => `
${CHICAS.map((c) => `${raiz} ${c}`).join(',')}{font-size:13px}
${raiz} [class*="tracking-[0.2em]"],${raiz} [class*="tracking-[0.15em]"],${raiz} [class*="tracking-[0.14em]"],${raiz} .tracking-widest,${raiz} .tracking-wider{letter-spacing:.04em}
${raiz} [data-franja="superior"]{flex-wrap:wrap;overflow-x:hidden}
`;

export default function RaizLabEstrella({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div className="relative h-full w-full min-w-0" data-lab-estrella={id}>
      <style>{css(`[data-lab-estrella="${id}"]`)}</style>
      <div className="absolute inset-0 min-w-0 overflow-hidden">{children}</div>
    </div>
  );
}

/** Lo mismo para la bitácora del lab (columna derecha): sólo la letra. */
export function LetraBitacoraEstrella({ id, children }: { id: string; children: React.ReactNode }) {
  return (
    <div data-bitacora-estrella={id}>
      <style>{css(`[data-bitacora-estrella="${id}"]`) + `[data-bitacora-estrella="${id}"] [class*="text-[9px]"],[data-bitacora-estrella="${id}"] [class*="text-[8px]"]{text-transform:none;letter-spacing:0}`}</style>
      {children}
    </div>
  );
}
