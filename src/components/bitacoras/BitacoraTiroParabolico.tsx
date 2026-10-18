"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ESCENARIOS, RADIO_DIANA, PROYECTIL } from '@/domain/fisica';
import { cifra } from '../simuladores/fis01/formato';
import BitacoraFisica from './fisica/BitacoraFisica';

interface LogTiro { angulo: number; velocidad: number; escenario: string; distancia: string; resultado: string }
const SIN_LOGS: LogTiro[] = [];

/** La distancia del registro llega como texto con punto («47.32»): se escribe con coma. */
const distancia = (s: string) => { const n = Number(s); return Number.isFinite(n) ? cifra(n, 1) : s; };

export default function BitacoraTiroParabolico({ onValidate }: { onValidate?: () => void }) {
  const { tiro1, logs } = useSimuladorStore(useShallow((s) => ({ tiro1: s.tiro1, logs: (s.bitacoraData?.tiro_logs as LogTiro[] | undefined) ?? SIN_LOGS })));
  const esc = ESCENARIOS[tiro1.escenario] ?? ESCENARIOS.tierra;

  return (
    <BitacoraFisica
      titulo="Auditoría balística"
      intro="La parábola del vacío da la primera estimación; el aire y el viento la corrigen."
      formulas={[
        { tex: 'R = \\dfrac{v_0^2 \\operatorname{sen} 2\\theta}{g}', etiqueta: 'Vacío, y₀ = 0' },
        { tex: 'y = y_0 + v_{0y}\\,t - \\tfrac{1}{2} g t^2', etiqueta: 'Vertical' },
        { tex: '\\vec a = \\vec g - k\\,|\\vec v_r|\\,\\vec v_r', etiqueta: 'Con aire' },
      ]}
      datos={[
        { label: 'Escenario', valor: esc.nombre },
        { label: 'g', valor: `${cifra(esc.g, 2)} m/s²` },
        { label: 'Densidad del aire', valor: `${cifra(esc.rho, 3)} kg/m³` },
        { label: 'Viento', valor: `${cifra(tiro1.viento, 1, true)} m/s` },
        { label: 'Altura del cañón y₀', valor: `${cifra(tiro1.y0, 0)} m` },
        { label: 'Muro (x, alto)', valor: `${cifra(tiro1.obsX, 0)} m; ${cifra(tiro1.obsY, 0)} m` },
        { label: 'Diana', valor: `${cifra(tiro1.targetX, 0)} ± ${cifra(RADIO_DIANA, 1)} m` },
        { label: 'Proyectil', valor: `${PROYECTIL.masa} kg, Ø ${cifra(PROYECTIL.diametro * 100, 0)} cm, Cd ${cifra(PROYECTIL.cd, 2)}` },
      ]}
      protocolo={[
        { label: 'Estimar ángulo y velocidad con la parábola ideal', ok: tiro1.disparos > 0 },
        { label: 'Superar el muro', ok: logs.some((l) => l.resultado !== 'MURO') },
        { label: 'Impacto confirmado en la diana', ok: tiro1.aciertos > 0 },
      ]}
      tabla={{
        columnas: ['θ', 'v₀', 'Escenario', 'x caída', 'Resultado'],
        filas: logs.map((l) => [`${l.angulo}°`, `${l.velocidad} m/s`, l.escenario, `${distancia(l.distancia)} m`, l.resultado]),
        vacio: 'Aún no has disparado.',
      }}
      preguntaEnsayo="¿Por qué tu primer tiro calculado con la parábola ideal no cayó justo en la diana? ¿Qué cambió al pasar de la Tierra a la Luna?"
      acento="#38bdf8"
      onValidate={onValidate}
    />
  );
}
