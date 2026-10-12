"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF5, fuerzaMinima, G_TIERRA, CARRERA_ENTRADA_CM, TOL_FUERZA_MIN } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraPrensaHidraulica({ onValidate }: { onValidate?: () => void }) {
  const p = useSimuladorStore(useShallow((s) => s.prensa5));
  const e = p.ensayo;
  const subio = !!e && e.f1 >= fuerzaMinima(e.masaCarga, e.r1, e.r2);

  return (
    <BitacoraFisica
      titulo="Principio de Pascal"
      intro={`Un fluido incompresible transmite la misma presión a todos sus puntos. Con la presión igual en ambos émbolos, la fuerza se multiplica por la razón de áreas; a cambio, el émbolo grande sube mucho menos: con ${CARRERA_ENTRADA_CM} cm de carrera de entrada, la carga sube ${CARRERA_ENTRADA_CM} cm·(r₁/r₂)².`}
      formulas={[
        { tex: 'P = \\dfrac{F_1}{A_1} = \\dfrac{F_2}{A_2}', etiqueta: 'Pascal' },
        { tex: 'A = \\pi r^2', etiqueta: 'Área del émbolo' },
        { tex: 'A_1 d_1 = A_2 d_2', etiqueta: 'Volumen conservado' },
      ]}
      datos={[
        { label: 'Masa de la carga', valor: `${p.masaCarga} kg` },
        { label: 'g', valor: `${G_TIERRA} m/s²` },
        { label: 'r₁ (entrada)', valor: `${p.r1.toFixed(1)} cm` },
        { label: 'r₂ (salida)', valor: `${p.r2.toFixed(1)} cm` },
      ]}
      protocolo={[
        { label: 'Predecir la F₁ mínima y bombear', ok: !!e },
        { label: 'Elevar la carga', ok: subio },
        { label: `Predicción de F₁ mínima a ±${TOL_FUERZA_MIN * 100} %`, ok: evaluarF5(p).ok },
      ]}
      tabla={e ? {
        columnas: ['r₁', 'r₂', 'F₁', 'Predicción', '¿Subió?'],
        filas: [[`${e.r1} cm`, `${e.r2} cm`, `${e.f1} N`, `${e.prediccion} N`, subio ? 'sí' : 'no']],
      } : undefined}
      preguntaEnsayo="Si duplicas el radio del émbolo de salida, ¿cuánto cambia la fuerza mínima? ¿Y cuánto sube la carga por cada bombeo? ¿Se ‘gana’ energía?"
      acento="#f59e0b"
      onValidate={onValidate}
    />
  );
}
