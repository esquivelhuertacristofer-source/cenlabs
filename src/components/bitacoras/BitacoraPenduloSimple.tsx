"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { periodoMedido, OSCILACIONES_MIN, TOL_RESULTADO_CRONO } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraPenduloSimple({ onValidate }: { onValidate?: () => void }) {
  const p = useSimuladorStore(useShallow((s) => s.pendulo3));
  const Ls = new Set(p.muestras.map((s) => s.L)).size;
  const masaIndep = p.muestras.some((a) => p.muestras.some((b) => a.L === b.L && a.m !== b.m));

  return (
    <BitacoraFisica
      titulo="Gravimetría con péndulo"
      intro={`Para ángulos pequeños el periodo solo depende de L y g. Cronometra al menos ${OSCILACIONES_MIN} oscilaciones completas y divide entre n: tu error de reacción (≈0.2 s) se reparte entre todas, y el error de g (que es el doble del de T) queda bajo el ${TOL_RESULTADO_CRONO * 100} %.`}
      formulas={[
        { tex: 'T = 2\\pi\\sqrt{L/g}', etiqueta: 'Periodo (MAS)' },
        { tex: 'T = t / n', etiqueta: 'Periodo medido' },
        { tex: 'g = 4\\pi^2 L / T^2', etiqueta: 'Despeje de g' },
      ]}
      datos={[
        { label: 'Longitud actual', valor: `${p.longitud} m` },
        { label: 'Masa actual', valor: `${p.masa} kg` },
        { label: 'Amplitud', valor: '10° (oscilaciones pequeñas)' },
        { label: 'g del lugar', valor: 'desconocida' },
      ]}
      protocolo={[
        { label: 'Independencia de la masa', ok: masaIndep, detalle: 'Dos masas distintas con la misma L dan el mismo T.' },
        { label: 'Tres longitudes distintas', ok: Ls >= 3, detalle: `${Ls}/3 longitudes medidas.` },
        { label: 'g calculada y escrita', ok: p.gAlumno !== null },
      ]}
      tabla={{
        columnas: ['L', 'm', 'n', 't', 'T'],
        filas: p.muestras.map((s) => [`${s.L} m`, `${s.m} kg`, s.n, `${s.t.toFixed(2)} s`, `${periodoMedido(s).toFixed(3)} s`]),
        vacio: 'Registra tus muestras desde el cronómetro.',
      }}
      preguntaEnsayo="Si cuadruplicas la longitud, ¿qué le pasa al periodo? ¿Por qué medir 10 oscilaciones da un resultado más preciso que medir una?"
      acento="#f59e0b"
      onValidate={onValidate}
    />
  );
}
