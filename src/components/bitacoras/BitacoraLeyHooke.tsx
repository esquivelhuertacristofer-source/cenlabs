"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { periodoMedido, G_TIERRA, OSCILACIONES_MIN } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraLeyHooke({ onValidate }: { onValidate?: () => void }) {
  const h = useSimuladorStore(useShallow((s) => s.hooke4));
  const est = new Set(h.estatica.map((s) => s.m)).size;
  const din = new Set(h.dinamica.map((s) => s.m)).size;
  const amp = new Set(h.dinamica.map((s) => s.A)).size;

  return (
    <BitacoraFisica
      titulo="Rigidez de un resorte"
      intro={`Con la carga en reposo, el resorte se estira hasta que k·x = m·g. Al soltarla desde una amplitud A, oscila con un periodo que NO depende de A. Cronometra al menos ${OSCILACIONES_MIN} oscilaciones por muestra.`}
      formulas={[
        { tex: 'F = k\\,x \\;\\Rightarrow\\; k = m g / x', etiqueta: 'Método estático' },
        { tex: 'T = 2\\pi\\sqrt{m/k} \\;\\Rightarrow\\; k = 4\\pi^2 m / T^2', etiqueta: 'Método dinámico' },
        { tex: 'E_p = \\tfrac{1}{2} k x^2', etiqueta: 'Energía elástica' },
      ]}
      datos={[
        { label: 'Carga actual', valor: `${h.masa} kg` },
        { label: 'Amplitud actual', valor: `${h.amplitud} m` },
        { label: 'g', valor: `${G_TIERRA} m/s²` },
        { label: 'Resolución de la regla', valor: '1 mm' },
      ]}
      protocolo={[
        { label: 'Elongación de 2 masas distintas', ok: est >= 2, detalle: `${est}/2 registradas.` },
        { label: 'Periodo con 3 masas distintas', ok: din >= 3, detalle: `${din}/3 registradas.` },
        { label: 'Periodo con 2 amplitudes distintas', ok: amp >= 2 },
        { label: 'k calculada y escrita', ok: h.kAlumno !== null },
      ]}
      tabla={{
        columnas: ['Método', 'm', 'Dato'],
        filas: [
          ...h.estatica.map((s) => ['estático', `${s.m} kg`, `x = ${s.x.toFixed(3)} m`]),
          ...h.dinamica.map((s) => ['dinámico', `${s.m} kg`, `T = ${periodoMedido(s).toFixed(3)} s (A = ${s.A} m)`]),
        ],
        vacio: 'Registra lecturas de la regla y del cronómetro.',
      }}
      preguntaEnsayo="¿Coinciden tus dos valores de k? ¿Por qué el periodo no cambia al cambiar la amplitud, pero sí al cambiar la masa?"
      acento="#22d3ee"
      onValidate={onValidate}
    />
  );
}
