"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ESCENARIOS, RADIO_DIANA } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

interface LogTiro { angulo: number; velocidad: number; escenario: string; distancia: string; resultado: string }
const SIN_LOGS: LogTiro[] = [];

export default function BitacoraTiroParabolico({ onValidate }: { onValidate?: () => void }) {
  const { tiro1, logs } = useSimuladorStore(useShallow((s) => ({ tiro1: s.tiro1, logs: (s.bitacoraData?.tiro_logs as LogTiro[] | undefined) ?? SIN_LOGS })));
  const esc = ESCENARIOS[tiro1.escenario] ?? ESCENARIOS.tierra;

  return (
    <BitacoraFisica
      titulo="Auditoría balística"
      intro="La parábola ideal y = y₀ + x·tanθ − g·x²/(2v₀²cos²θ) solo vale en el vacío. Con aire, el arrastre frena al proyectil y el viento lo empuja: úsala como primera estimación y corrige con la traza de cada disparo."
      formulas={[
        { tex: 'x(t) = v_0\\cos\\theta\\, t', etiqueta: 'Horizontal (vacío)' },
        { tex: 'y(t) = y_0 + v_0\\sin\\theta\\, t - \\tfrac{1}{2} g t^2', etiqueta: 'Vertical (vacío)' },
        { tex: '\\vec a = \\vec g - \\tfrac{\\rho C_d A}{2m}\\,|\\vec v_{rel}|\\,\\vec v_{rel}', etiqueta: 'Con arrastre' },
      ]}
      datos={[
        { label: 'Escenario', valor: esc.nombre },
        { label: 'g', valor: `${esc.g} m/s²` },
        { label: 'Densidad del aire', valor: `${esc.rho} kg/m³` },
        { label: 'Viento', valor: `${tiro1.viento.toFixed(1)} m/s` },
        { label: 'Altura del cañón y₀', valor: `${tiro1.y0} m` },
        { label: 'Muro (x, alto)', valor: `${tiro1.obsX} m, ${tiro1.obsY} m` },
        { label: 'Diana', valor: `${tiro1.targetX} ± ${RADIO_DIANA} m` },
        { label: 'Proyectil', valor: '1 kg, Ø 12 cm, Cd 0.47' },
      ]}
      protocolo={[
        { label: 'Estimar ángulo y velocidad con la parábola ideal', ok: tiro1.disparos > 0, detalle: 'Comprueba que y(x) supera la altura del muro en x = muro.' },
        { label: 'Superar el muro', ok: logs.some((l) => l.resultado !== 'MURO') },
        { label: 'Impacto confirmado en la diana', ok: tiro1.aciertos > 0 },
      ]}
      tabla={{
        columnas: ['θ', 'v₀', 'Escenario', 'x caída', 'Resultado'],
        filas: logs.map((l) => [`${l.angulo}°`, `${l.velocidad} m/s`, l.escenario, `${l.distancia} m`, l.resultado]),
        vacio: 'Aún no has disparado.',
      }}
      preguntaEnsayo="¿Por qué tu primer tiro calculado con la parábola ideal no cayó justo en la diana? ¿Qué cambió al pasar de la Tierra a la Luna?"
      acento="#38bdf8"
      onValidate={onValidate}
    />
  );
}
