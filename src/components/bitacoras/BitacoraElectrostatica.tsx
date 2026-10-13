"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF9, K_COULOMB, TOL_FUERZA_COULOMB } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

export default function BitacoraElectrostatica({ onValidate }: { onValidate?: () => void }) {
  const e = useSimuladorStore(useShallow((s) => s.electrostatica9));
  const { reto } = e;

  return (
    <BitacoraFisica
      titulo="Ley de Coulomb"
      intro="Fuerzas iguales y opuestas sobre la recta que une las cargas: crecen con el producto q₁q₂ y caen con r². Signos iguales se repelen; opuestos se atraen."
      formulas={[
        { tex: 'F = k\\,\\dfrac{|q_1 q_2|}{r^2}', etiqueta: 'Ley de Coulomb' },
        { tex: 'k = \\dfrac{1}{4\\pi\\varepsilon_0} \\approx 8.99\\times10^{9}\\ \\mathrm{N\\,m^2/C^2}', etiqueta: 'Constante' },
        { tex: '1\\ \\mu\\mathrm{C} = 10^{-6}\\ \\mathrm{C},\\quad 1\\ \\mathrm{cm} = 10^{-2}\\ \\mathrm{m}', etiqueta: 'Conversiones' },
      ]}
      datos={[
        { label: 'q₁ (reto)', valor: fmtQ(reto.q1) },
        { label: 'q₂ (reto)', valor: fmtQ(reto.q2) },
        { label: 'r (reto)', valor: `${reto.r} cm` },
        { label: 'k', valor: `${(K_COULOMB / 1e9).toFixed(4)}×10⁹ N·m²/C²` },
      ]}
      protocolo={[
        { label: 'Calcular |F| en newtons', ok: e.respuesta !== null },
        { label: 'Elegir atracción o repulsión', ok: e.tipoRespuesta !== null },
        { label: `Fuerza a ±${TOL_FUERZA_COULOMB * 100} % e interacción correcta`, ok: evaluarF9(e).ok },
      ]}
      preguntaEnsayo="Si duplicas la distancia del reto, ¿cuántas veces cambia la fuerza? ¿Y si duplicas sólo una de las cargas? ¿Por qué la fuerza sobre q₁ y sobre q₂ es la misma aunque las cargas sean distintas?"
      acento="#60a5fa"
      onValidate={onValidate}
    />
  );
}
