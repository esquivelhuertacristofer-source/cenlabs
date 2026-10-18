"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF10, estadoMotor, MOTOR, TOL_RPM, TOL_V10 } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';
import { cifra } from '../simuladores/fis10/formato';

export default function BitacoraMotorElectrico({ onValidate }: { onValidate?: () => void }) {
  const m = useSimuladorStore(useShallow((s) => s.motor10));
  const e = m.ensayo;
  const est = e ? estadoMotor(e) : null;

  return (
    <BitacoraFisica
      titulo="Motor de Corriente Directa"
      intro="Cada lado de la bobina siente F = I·L×B; el conmutador invierte la corriente para que el par no cambie de signo. Al girar aparece la f.c.e.m. E = k·ω y, en régimen, V = E + I·R."
      formulas={[
        { tex: 'k = N\\,B\\,A', etiqueta: 'Constante del motor' },
        { tex: '\\tau = k\\,I \\;\\Rightarrow\\; I = \\tau_{carga}/k', etiqueta: 'Par' },
        { tex: 'V = k\\,\\omega + I\\,R_a', etiqueta: 'Balance de tensiones' },
        { tex: '\\omega = \\dfrac{2\\pi\\,n_{rpm}}{60}', etiqueta: 'rpm → rad/s' },
      ]}
      datos={[
        { label: 'B', valor: `${cifra(MOTOR.B, 1)} T` },
        { label: 'A', valor: `${(MOTOR.A * 1e4).toFixed(0)} cm²` },
        { label: 'R por espira', valor: `${cifra(MOTOR.rEspira, 2)} Ω` },
        { label: 'Reto', valor: `${cifra(m.reto.rpmObjetivo, 0)} rpm ${m.reto.sentido}, ${cifra(m.reto.carga, 3)} N·m` },
      ]}
      protocolo={[
        { label: 'Predecir el voltaje y energizar', ok: !!e },
        { label: `Velocidad a ±${TOL_RPM * 100} % en el sentido pedido`, ok: !!est && est.arranca
          && (est.rpm > 0 ? 'horario' : 'antihorario') === m.reto.sentido
          && Math.abs(Math.abs(est.rpm) - m.reto.rpmObjetivo) <= TOL_RPM * m.reto.rpmObjetivo },
        { label: `Predicción de V a ±${TOL_V10 * 100} %`, ok: evaluarF10(m).ok },
      ]}
      tabla={e && est ? {
        columnas: ['V', 'N', 'Imanes', 'Predicción', 'Medido'],
        filas: [[`${cifra(e.voltaje, 1)} V`, String(e.espiras), `${e.imanIzq}–${e.imanDer}`, e.vPrediccion !== null ? `${String(e.vPrediccion).replace('.', ',')} V` : '—', est.arranca ? `${cifra(Math.abs(est.rpm), 0)} rpm` : 'no gira']],
      } : undefined}
      preguntaEnsayo="¿Por qué con más espiras el motor gira más despacio al mismo voltaje? ¿Qué le pasa a la corriente si frenas el rotor por completo? ¿Para qué sirve el conmutador?"
      acento="#f97316"
      onValidate={onValidate}
    />
  );
}
