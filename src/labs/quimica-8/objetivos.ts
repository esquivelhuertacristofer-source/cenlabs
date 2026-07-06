import type { Objetivo, ObjetivosState } from '@/data/labObjetivos';

export default function objetivos(s: ObjetivosState): Objetivo[] {
  const { pActual, nActual, eActual, targetZ, targetA, targetCharge,
          gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion,
          tiroParabolico, planoInclinado, pendulo, hooke } = s;
  return [
      { label: 'Perturbación Térmica',        current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente') ? 1 : 0, target: 1, completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente') },
      { label: 'Análisis Criogénico',         current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo') ? 1 : 0,    target: 1, completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo') },
      { label: "Deducción de Le Châtelier",   current: equilibrio?.status === 'success' ? 1 : 0,                                    target: 1, completed: equilibrio?.status === 'success' },
    ];
}
