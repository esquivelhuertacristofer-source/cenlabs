"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { OSCILACIONES_MIN, TOL_RESULTADO_CRONO } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';
import { cifra } from '../simuladores/fis03/formato';

/**
 * Bitácora del péndulo. Coma decimal como el resto del lab; las muestras viven UNA vez, en
 * el dock del simulador (con su botón de borrar y la gráfica T²–L): aquí sólo el resumen.
 */
export default function BitacoraPenduloSimple({ onValidate }: { onValidate?: () => void }) {
  const p = useSimuladorStore(useShallow((s) => s.pendulo3));
  const Ls = new Set(p.muestras.map((s) => s.L)).size;
  const masaIndep = p.muestras.some((a) => p.muestras.some((b) => a.L === b.L && a.m !== b.m));

  return (
    <BitacoraFisica
      titulo="Gravimetría con péndulo"
      intro={`Para ángulos pequeños el periodo sólo depende de L y g. Cronometra al menos ${OSCILACIONES_MIN} oscilaciones completas y divide entre n: tu error de reacción (≈ 0,2 s) se reparte entre todas, y el error de g (el doble del de T) queda bajo el ${cifra(TOL_RESULTADO_CRONO * 100, 0)} %.`}
      formulas={[
        { tex: 'T = 2\\pi\\sqrt{L/g}', etiqueta: 'Periodo (MAS)' },
        { tex: 'T = t / n', etiqueta: 'Periodo medido' },
        { tex: 'g = 4\\pi^2 L / T^2', etiqueta: 'Despeje de g' },
      ]}
      datos={[
        { label: 'Longitud actual', valor: `${cifra(p.longitud, 1)} m` },
        { label: 'Masa actual', valor: `${cifra(p.masa, 0)} kg` },
        { label: 'Amplitud', valor: '10° (ángulo pequeño)' },
        { label: 'g del lugar', valor: 'desconocida' },
        { label: 'Muestras', valor: `${p.muestras.length} · ${Ls} longitud${Ls === 1 ? '' : 'es'}` },
        { label: 'Tu g', valor: p.gAlumno !== null ? `${cifra(p.gAlumno, 2)} m/s²` : '—' },
      ]}
      protocolo={[
        { label: 'Independencia de la masa', ok: masaIndep, detalle: 'Dos masas distintas con la misma L dan el mismo T.' },
        { label: 'Tres longitudes distintas', ok: Ls >= 3, detalle: `${Math.min(Ls, 3)}/3 longitudes medidas.` },
        { label: 'g calculada y escrita', ok: p.gAlumno !== null },
      ]}
      preguntaEnsayo="Si cuadruplicas la longitud, ¿qué le pasa al periodo? ¿Por qué medir 10 oscilaciones da un resultado más preciso que medir una? ¿Por qué el reto se hace a 10° y no a 60°?"
      acento="#f59e0b"
      onValidate={onValidate}
    />
  );
}
