import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Pesaje Analítico',    current: soluciones?.matraz?.polvo || 0,  target: soluciones?.mRequerida || 7.305, completed: Math.abs((soluciones?.matraz?.polvo || 0) - (soluciones?.mRequerida || 7.305)) < 0.05 },
      { label: 'Exactitud de Aforo',  current: soluciones?.matraz?.agua || 0,   target: soluciones?.vTarget || 250,      completed: Math.abs((soluciones?.matraz?.agua || 0) - (soluciones?.vTarget || 250)) < 1.0 },
      { label: 'Certificación de M',  current: soluciones?.status === 'success' ? 1 : 0, target: 1,                    completed: soluciones?.status === 'success' },
    ];
}
