"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF8, LED, R_INTERNA_FUENTE, TOL_R8 } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraLeyOhm({ onValidate }: { onValidate?: () => void }) {
  const o = useSimuladorStore(useShallow((s) => s.ohm8));
  const e = o.ensayo;

  return (
    <BitacoraFisica
      titulo="Ley de Ohm y LED"
      intro="En un circuito serie la corriente es la misma en todos los elementos y los voltajes se reparten. Un LED no es óhmico: mientras conduce, su caída de tensión es casi constante (≈ 2 V en uno rojo), así que la resistencia en serie es la que fija la corriente."
      formulas={[
        { tex: 'V = I\\,R', etiqueta: 'Ley de Ohm (resistencia)' },
        { tex: 'V_{fuente} = I\\,R + V_f', etiqueta: 'Malla (Kirchhoff)' },
        { tex: 'R = \\dfrac{V_{fuente} - V_f}{I}', etiqueta: 'Resistencia limitadora' },
      ]}
      datos={[
        { label: 'V_f del LED', valor: `${LED.vf} V` },
        { label: 'I nominal', valor: `${LED.iNominal * 1000} mA` },
        { label: 'I máxima', valor: `${LED.iMax * 1000} mA` },
        { label: 'R interna de la fuente', valor: `${R_INTERNA_FUENTE} Ω` },
        { label: 'Fuente', valor: `${o.voltaje} V` },
      ]}
      protocolo={[
        { label: 'Calcular R antes de cerrar', ok: o.rCalculada !== null },
        { label: 'Ensayar con resistencia sin quemar el LED', ok: !!e && !e.ledRoto },
        { label: `R calculada y montada a ±${TOL_R8 * 100} %`, ok: evaluarF8(o).ok },
      ]}
      tabla={e ? {
        columnas: ['V fuente', 'R calculada', 'R montada', 'I medida', 'LED'],
        filas: [[`${e.voltaje} V`, e.rCalculada !== null ? `${e.rCalculada} Ω` : '—', `${e.resistencia} Ω`, `${(e.corriente * 1000).toFixed(1)} mA`, e.ledRoto ? 'quemado' : 'encendido']],
      } : undefined}
      preguntaEnsayo="¿Por qué R = V/I (sin restar V_f) da una corriente menor que 20 mA? ¿Cuánta potencia disipa tu resistencia y qué potencia nominal elegirías?"
      acento="#3b82f6"
      onValidate={onValidate}
    />
  );
}
