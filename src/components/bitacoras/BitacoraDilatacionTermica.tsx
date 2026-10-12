"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF7, MATERIALES_DILATACION, DT_MIN_MEDICION, TOL_ALPHA } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraDilatacionTermica({ onValidate }: { onValidate?: () => void }) {
  const d = useSimuladorStore(useShallow((s) => s.dilatacion7));
  const e = d.ensayo;

  return (
    <BitacoraFisica
      titulo="Dilatación Lineal"
      intro="Al calentarse, los átomos de un sólido vibran con más amplitud y su separación media crece: la barra se alarga en proporción a su longitud inicial y al aumento de temperatura. El alargamiento es de décimas de milímetro, por eso se lee con un comparador de carátula de 1 μm."
      formulas={[
        { tex: '\\Delta L = \\alpha\\, L_0\\, \\Delta T', etiqueta: 'Dilatación lineal' },
        { tex: '\\alpha = \\dfrac{\\Delta L}{L_0\\, \\Delta T}', etiqueta: 'Coeficiente' },
      ]}
      datos={[
        { label: 'L₀', valor: `${d.longitud} mm` },
        { label: 'T₀ (ambiente)', valor: `${d.tempIni} °C` },
        ...Object.values(MATERIALES_DILATACION).map((m) => ({ label: `α ${m.nombre} (tabla)`, valor: `${(m.alpha * 1e6).toFixed(1)}×10⁻⁶ /°C` })),
      ]}
      protocolo={[
        { label: `Medir ΔL del metal ? con ΔT ≥ ${DT_MIN_MEDICION} °C`, ok: !!e && e.material === 'misterioso' && e.dT >= DT_MIN_MEDICION },
        { label: 'Calcular α', ok: d.alphaAlumno !== null },
        { label: `α a ±${TOL_ALPHA * 100} %`, ok: evaluarF7(d).ok },
      ]}
      tabla={e ? {
        columnas: ['Barra', 'ΔT', 'ΔL', 'Tu α (×10⁻⁶ /°C)'],
        filas: [['Metal ?', `${e.dT.toFixed(1)} °C`, `${e.dL.toFixed(3)} mm`, d.alphaAlumno !== null ? String(d.alphaAlumno) : '—']],
      } : undefined}
      preguntaEnsayo="¿Por qué conviene medir con ΔT grande? Compara tu α con la tabla: ¿de qué metal podría tratarse? ¿Qué pasaría con unas vías de tren sin juntas de dilatación?"
      acento="#f97316"
      onValidate={onValidate}
    />
  );
}
