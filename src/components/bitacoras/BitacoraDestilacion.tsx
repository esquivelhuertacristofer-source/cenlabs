"use client";
/**
 * Bitácora de QUI-10 · Destilación fraccionada. Cuaderno de SOLO LECTURA sobre la plantilla
 * común (`BitacoraFisica`): datos del reto con coma decimal, el protocolo con el mismo criterio
 * que `validarQ10` y las lecturas vivas de la columna. No dice qué consigna de la manta
 * funciona; el único botón de validar es el flujo oficial (`onValidate`).
 */
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { PUREZA_REQUERIDA_Q10, VOL_REQUERIDO_Q10 } from '@/domain/quimica';
import BitacoraFisica from './fisica/BitacoraFisica';

const coma = (x: number, d: number) => x.toFixed(d).replace('.', ',');

export default function BitacoraDestilacion({ onValidate }: { onValidate?: () => void }) {
  const d = useSimuladorStore(useShallow((s) => s.destilacion));
  const hierve = d.tasa > 0;
  const hayDestilado = d.volDestilado > 0;
  return (
    <BitacoraFisica
      titulo="Destilación fraccionada"
      intro={`Separa el etanol de 100 mL de etanol + 100 mL de agua en una columna de 5 platos. Junta ${VOL_REQUERIDO_Q10} mL de destilado con al menos ${PUREZA_REQUERIDA_Q10} % v/v de etanol en el total recogido.`}
      formulas={[
        { tex: 'y = \\dfrac{\\alpha x}{1 + (\\alpha - 1)\\,x}', etiqueta: 'Equilibrio (α constante)' },
        { tex: 'y_{n+1} = \\dfrac{R}{R+1}\\,x_n + \\dfrac{x_D}{R+1}', etiqueta: 'Recta de rectificación' },
        { tex: 'N_{\\min} = \\dfrac{\\ln\\!\\left[\\frac{x_D(1-x_B)}{(1-x_D)\\,x_B}\\right]}{\\ln \\alpha}', etiqueta: 'Fenske' },
        { tex: '\\%\\,v/v = \\dfrac{x\\,\\bar V_E}{x\\,\\bar V_E + (1-x)\\,\\bar V_W}', etiqueta: 'De fracción molar a grado' },
      ]}
      datos={[
        { label: 'Carga del matraz', valor: '100 mL etanol + 100 mL agua' },
        { label: 'Consigna de la manta', valor: `${coma(d.calorManta, 0)} °C` },
        { label: 'Temperatura del matraz', valor: `${coma(d.tempMezcla, 1)} °C` },
        { label: 'Temperatura de cabeza', valor: `${coma(d.tempCabeza, 1)} °C` },
        { label: 'Caudal de destilado', valor: hierve ? `${coma(d.tasa * 60, 1)} mL/min` : 'no hierve' },
        { label: 'Destilado recogido', valor: `${coma(d.volDestilado, 1)} mL` },
        { label: 'Grado del destilado', valor: hayDestilado ? `${coma(d.purezaDestilado, 1)} % v/v` : '—' },
        { label: 'Meta', valor: `${VOL_REQUERIDO_Q10} mL · ≥ ${PUREZA_REQUERIDA_Q10} % v/v` },
      ]}
      protocolo={[
        { label: 'Calentar hasta que la mezcla hierva', ok: hierve || hayDestilado, detalle: 'El vapor sube plato a plato y la cabeza se calienta.' },
        { label: `Recoger ${VOL_REQUERIDO_Q10} mL de destilado`, ok: d.volDestilado >= VOL_REQUERIDO_Q10, detalle: 'La probeta del receptor marca el volumen.' },
        { label: `Grado acumulado ≥ ${PUREZA_REQUERIDA_Q10} % v/v`, ok: hayDestilado && d.purezaDestilado >= PUREZA_REQUERIDA_Q10, detalle: 'Cuenta todo lo recogido, no sólo la última gota.' },
        { label: 'Certificar la destilación', ok: d.status === 'success', detalle: 'Con el botón de la práctica.' },
      ]}
      preguntaEnsayo="¿Por qué hervir más fuerte da más destilado por minuto pero de menor grado? Explícalo con las etapas de equilibrio de la columna."
      acento="#38bdf8"
      onValidate={onValidate}
    />
  );
}
