"use client";

/**
 * Bitácora de MAT-06 · Transformaciones geométricas.
 *
 * Cuaderno de SOLO LECTURA con el mismo diseño legible que las bitácoras remodeladas
 * (texto oscuro sobre fondo claro, coma decimal). Antes marcaba en vivo «✓ Posición
 * sincronizada» / «✓ Orientación correcta» con la tolerancia del validador: bastaba barrer
 * un mando hasta ver la palomita. Ahora el protocolo sólo registra lo que el alumno ya
 * hizo (escalar, girar, trasladar, validar) y nunca compara con la silueta.
 */
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { TOL_M6, RANGO_T_M6, ESCALA_MIN_M6, ESCALA_MAX_M6 } from '@/domain/matematicas';
import { num, trs, det2 } from '../simuladores/mat06/transformaciones';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraTransformaciones({ onValidate }: { onValidate?: () => void }) {
  const { geometria6 } = useSimuladorStore(useShallow((s) => ({ geometria6: s.geometria6 })));
  const { tx, ty, rotacion, escala, status } = geometria6;
  const det = det2(trs(tx, ty, rotacion, escala));

  return (
    <BitacoraFisica
      titulo="Matrices de transformación"
      intro="Cada pose de la placa es una matriz 3×3: el bloque 2×2 gira y escala, la última columna traslada y el determinante mide el área."
      formulas={[
        { tex: 'M = T\\,R\\,S = \\begin{pmatrix} s\\cos\\theta & -s\\operatorname{sen}\\theta & t_x \\\\ s\\operatorname{sen}\\theta & s\\cos\\theta & t_y \\\\ 0 & 0 & 1 \\end{pmatrix}', etiqueta: 'Reto' },
        { tex: '\\det M = s^2', etiqueta: 'Factor de área' },
        { tex: 'T\\,R \\neq R\\,T', etiqueta: 'El orden importa' },
      ]}
      datos={[
        { label: 'Pieza', valor: '10 vértices · pivote (0; 0)' },
        { label: 'Traslación', valor: `de −${RANGO_T_M6} a ${RANGO_T_M6} u` },
        { label: 'Escala', valor: `de ${num(ESCALA_MIN_M6, 1)} a ${num(ESCALA_MAX_M6, 1)}` },
        { label: 'Tolerancias', valor: `±${num(TOL_M6.t, 1)} u · ±${TOL_M6.rot}° · ±${num(TOL_M6.escala, 1)}` },
        { label: 'Tu placa', valor: `T(${num(tx, 1)}; ${num(ty, 1)}) · ${num(rotacion, 0)}° · ×${num(escala, 1)}` },
        { label: 'det de tu M', valor: num(det, 2) },
      ]}
      protocolo={[
        // sólo lo que el alumno hizo: nada se compara con la silueta antes de validar
        { label: 'Mover la placa con T·R·S', ok: tx !== 0 || ty !== 0 || rotacion % 360 !== 0 || escala !== 1, detalle: 'Primero escala, luego gira alrededor del pivote, al final traslada.' },
        { label: 'Acoplamiento validado', ok: status === 'success' },
      ]}
      preguntaEnsayo="¿Por qué en M = T·R·S se escala y se gira antes de trasladar? ¿Dónde acabaría tu placa si trasladas primero y giras después?"
      acento="#ffb43a"
      onValidate={onValidate}
    />
  );
}
