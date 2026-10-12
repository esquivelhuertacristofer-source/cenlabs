"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF6, FLUIDOS, G_TIERRA, TOL_DENSIDAD } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraArquimedes({ onValidate }: { onValidate?: () => void }) {
  const a = useSimuladorStore(useShallow((s) => s.arquimedes6));
  const fl = FLUIDOS[a.fluidoLectura ?? a.fluido];
  const empuje = a.lecturaAire !== null && a.lecturaFluido !== null ? a.lecturaAire - a.lecturaFluido : null;

  return (
    <BitacoraFisica
      titulo="Principio de Arquímedes"
      intro="Todo cuerpo sumergido recibe un empuje vertical igual al peso del fluido que desaloja. Con un dinamómetro se mide el peso en el aire y el peso aparente sumergido; su diferencia es el empuje, que da el volumen del cuerpo sin necesidad de medirlo."
      formulas={[
        { tex: 'E = W - W_{ap}', etiqueta: 'Empuje medido' },
        { tex: 'E = \\rho_f\\, g\\, V', etiqueta: 'Arquímedes' },
        { tex: '\\rho = \\dfrac{W}{g\\,V} = \\rho_f \\dfrac{W}{W - W_{ap}}', etiqueta: 'Densidad del sólido' },
      ]}
      datos={[
        { label: 'g', valor: `${G_TIERRA} m/s²` },
        { label: 'Fluido de la lectura', valor: fl ? `${fl.nombre} · ${fl.rho} kg/m³` : '—' },
        { label: 'W (aire)', valor: a.lecturaAire !== null ? `${a.lecturaAire.toFixed(2)} N` : '—' },
        { label: 'W aparente', valor: a.lecturaFluido !== null ? `${a.lecturaFluido.toFixed(2)} N` : '—' },
      ]}
      protocolo={[
        { label: 'Pesar el sólido en el aire', ok: a.lecturaAire !== null },
        { label: 'Pesarlo completamente sumergido', ok: a.lecturaFluido !== null },
        { label: `Densidad calculada a ±${TOL_DENSIDAD * 100} %`, ok: evaluarF6(a).ok },
      ]}
      tabla={empuje !== null ? {
        columnas: ['W aire', 'W aparente', 'Empuje', 'Tu ρ'],
        filas: [[`${a.lecturaAire!.toFixed(2)} N`, `${a.lecturaFluido!.toFixed(2)} N`, `${empuje.toFixed(2)} N`, a.densidadAlumno !== null ? `${a.densidadAlumno} kg/m³` : '—']],
      } : undefined}
      preguntaEnsayo="Si repites la medición en glicerina, ¿el empuje sube o baja? ¿Cambia la densidad que calculas? ¿Por qué el método no necesita medir el volumen del sólido?"
      acento="#3b82f6"
      onValidate={onValidate}
    />
  );
}
