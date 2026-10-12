"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { dinamicaPlano, evaluarF2, G_TIERRA, TOL_ACELERACION } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraPlanoInclinado({ onValidate }: { onValidate?: () => void }) {
  const plano2 = useSimuladorStore(useShallow((s) => s.plano2));
  const { angulo, empuje, cargaExtra, masaBase, muS, muK, ensayo } = plano2;
  const masa = masaBase + cargaExtra;
  const movio = !!ensayo && dinamicaPlano(ensayo).estado !== 'reposo';

  return (
    <BitacoraFisica
      titulo="Diagrama de cuerpo libre"
      intro="Descompón el peso en la componente paralela (m·g·sinθ) y la perpendicular (m·g·cosθ). La normal equilibra la perpendicular; la fricción estática sostiene el bloque hasta μs·N y, si se mueve, la cinética μk·N se opone al movimiento."
      formulas={[
        { tex: 'N = m g \\cos\\theta', etiqueta: 'Normal' },
        { tex: '|F - m g \\sin\\theta| \\le \\mu_s N', etiqueta: '¿Se queda en reposo?' },
        { tex: 'a = \\dfrac{F - m g \\sin\\theta \\mp \\mu_k N}{m}', etiqueta: 'Si se mueve' },
      ]}
      datos={[
        { label: 'Masa total', valor: `${masa} kg` },
        { label: 'Ángulo θ', valor: `${angulo}°` },
        { label: 'Fuerza aplicada F', valor: `${empuje} N (+ arriba)` },
        { label: 'g', valor: `${G_TIERRA} m/s²` },
        { label: 'μ estático', valor: muS.toFixed(2) },
        { label: 'μ cinético', valor: muK.toFixed(2) },
      ]}
      protocolo={[
        { label: 'Escribir la predicción antes de soltar el bloque', ok: !!ensayo },
        { label: 'Ensayo con el bloque en movimiento', ok: movio, detalle: 'Si queda en reposo, vence la fricción estática con F o con θ.' },
        { label: `Predicción dentro de ±${TOL_ACELERACION} m/s² de la medición`, ok: evaluarF2(plano2).ok },
      ]}
      tabla={ensayo ? {
        columnas: ['θ', 'F', 'm', 'a predicha'],
        filas: [[`${ensayo.angulo}°`, `${ensayo.empuje} N`, `${ensayo.masa} kg`, `${ensayo.prediccion} m/s²`]],
      } : undefined}
      preguntaEnsayo="¿Por qué el signo de la fricción cinética depende del sentido del movimiento? ¿Qué pasaría con la aceleración si duplicas la masa sin cambiar F?"
      acento="#ef4444"
      onValidate={onValidate}
    />
  );
}
