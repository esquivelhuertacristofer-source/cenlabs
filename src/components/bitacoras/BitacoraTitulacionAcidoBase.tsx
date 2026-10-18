"use client";
/**
 * Bitácora de QUI-07 · Titulación ácido-base. Cuaderno de SOLO LECTURA sobre la plantilla
 * común (`BitacoraFisica`): datos del reto con coma decimal, el protocolo con el mismo
 * criterio que `validarQ7`, la lectura viva de la bureta y la respuesta del alumno. No
 * calcula ni muestra [HCl] ni el volumen de equivalencia; el único botón de validar es el
 * flujo oficial (`onValidate`).
 */
import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AGUA_ML } from '@/components/simuladores/qmi07/acidobase';
import BitacoraFisica from './fisica/BitacoraFisica';

const coma = (x: number, d: number) => x.toFixed(d).replace('.', ',');

export default function BitacoraTitulacionAcidoBase({ onValidate }: { onValidate?: () => void }) {
  const t = useSimuladorStore(useShallow((s) => s.titulacion));
  const hecho = t.status === 'success';
  return (
    <BitacoraFisica
      titulo="Titulación ácido-base"
      intro={`Valora ${coma(t.va, 2)} mL de HCl de concentración desconocida con NaOH ${coma(t.cb, 3)} M. La fenolftaleína vira entre pH 8,2 y 10,0: el primer rosa que no se va al agitar marca el punto final.`}
      formulas={[
        { tex: 'C_a V_a = C_b V_b', etiqueta: 'Equivalencia (1 : 1)' },
        { tex: '[\\mathrm{H^+}] + [\\mathrm{Na^+}] = [\\mathrm{OH^-}] + [\\mathrm{Cl^-}]', etiqueta: 'Balance de carga' },
        { tex: '\\mathrm{pH} = -\\log\\,[\\mathrm{H^+}]', etiqueta: 'pH' },
        { tex: 'f_{\\mathrm{In^-}} = \\dfrac{1}{1 + 10^{\\,\\mathrm{p}K_{\\mathrm{In}} - \\mathrm{pH}}}', etiqueta: 'Color del indicador' },
      ]}
      datos={[
        { label: 'Muestra de HCl (Va)', valor: `${coma(t.va, 2)} mL` },
        { label: 'Agua destilada', valor: `${AGUA_ML} mL` },
        { label: 'NaOH (Cb)', valor: `${coma(t.cb, 3)} M` },
        { label: 'Lectura de la bureta (Vb)', valor: `${coma(t.volumenBase, 2)} mL` },
        { label: 'Tu [HCl]', valor: t.respuestaCa !== null && Number.isFinite(t.respuestaCa) ? `${coma(t.respuestaCa, 3)} M` : '—' },
        { label: 'Tolerancia', valor: '± 2 %' },
      ]}
      protocolo={[
        { label: 'Purgar la bureta', ok: t.purgada, detalle: 'Sin la burbuja de aire de la punta, la lectura es la que sale.' },
        { label: 'Echar fenolftaleína al matraz', ok: t.indicador, detalle: 'Incolora en ácido; rosa por encima de pH 8,2.' },
        { label: 'Detenerse en el primer rosa persistente', ok: hecho, detalle: 'Cerca del final, gota a gota y con agitación.' },
        { label: 'Calcular [HCl] = Cb·Vb / Va', ok: hecho, detalle: 'Con la lectura de la bureta en el punto final.' },
      ]}
      preguntaEnsayo="¿Por qué el punto final de la fenolftaleína (pH ≈ 8,2) da casi el mismo volumen que el equivalente (pH 7)? Estima cuántas gotas los separan."
      acento="#e05aa3"
      onValidate={onValidate}
    />
  );
}
