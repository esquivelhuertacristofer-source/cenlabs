"use client";

import React from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF10, estadoMotor, MOTOR, TOL_RPM, TOL_V10 } from '@/domain/fisica';
import BitacoraFisica from './fisica/BitacoraFisica';

export default function BitacoraMotorElectrico({ onValidate }: { onValidate?: () => void }) {
  const m = useSimuladorStore(useShallow((s) => s.motor10));
  const e = m.ensayo;
  const est = e ? estadoMotor(e) : null;

  return (
    <BitacoraFisica
      titulo="Motor de Corriente Directa"
      intro="La corriente en la bobina, dentro del campo de los imanes, sufre fuerzas de Laplace que producen par; el conmutador invierte la corriente cada media vuelta para que el giro continúe. Al girar, la bobina genera una fuerza contraelectromotriz proporcional a la velocidad: en régimen, el voltaje aplicado se reparte entre esa fem y la caída en la resistencia del bobinado."
      formulas={[
        { tex: 'k = N\\,B\\,A', etiqueta: 'Constante del motor' },
        { tex: '\\tau = k\\,I \\;\\Rightarrow\\; I = \\tau_{carga}/k', etiqueta: 'Par' },
        { tex: 'V = k\\,\\omega + I\\,R_a', etiqueta: 'Balance de tensiones' },
        { tex: '\\omega = \\dfrac{2\\pi\\,n_{rpm}}{60}', etiqueta: 'rpm → rad/s' },
      ]}
      datos={[
        { label: 'B', valor: `${MOTOR.B} T` },
        { label: 'A', valor: `${(MOTOR.A * 1e4).toFixed(0)} cm²` },
        { label: 'R por espira', valor: `${MOTOR.rEspira} Ω` },
        { label: 'Reto', valor: `${m.reto.rpmObjetivo} rpm ${m.reto.sentido}, ${m.reto.carga} N·m` },
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
        filas: [[`${e.voltaje.toFixed(1)} V`, String(e.espiras), `${e.imanIzq}–${e.imanDer}`, e.vPrediccion !== null ? `${e.vPrediccion} V` : '—', est.arranca ? `${Math.round(Math.abs(est.rpm))} rpm` : 'no gira']],
      } : undefined}
      preguntaEnsayo="¿Por qué con más espiras el motor gira más despacio al mismo voltaje? ¿Qué le pasa a la corriente si frenas el rotor por completo? ¿Para qué sirve el conmutador?"
      acento="#f97316"
      onValidate={onValidate}
    />
  );
}
