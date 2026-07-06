import { LABS } from '@/labs/_registry';

export type Objetivo = { label: string; current: number; target: number; completed: boolean };

export interface ObjetivosState {
  pActual: number; nActual: number; eActual: number;
  targetZ: number; targetA: number; targetCharge: number;
  gases: any; balanceo: any; limitante: any; soluciones: any; solubilidad: any;
  titulacion: any; equilibrio: any; celda: any; destilacion: any;
  tiroParabolico: any; planoInclinado: any; pendulo: any; hooke: any;
}

export function getLabObjetivos(normalizedId: string, s: ObjetivosState): Objetivo[] {
  // Los objetivos viven en cada src/labs/<id>/objetivos.ts (14 labs los definen).
  // El registro es la única fuente; sin objetivos ⇒ [].
  return LABS[normalizedId]?.objetivos?.(s) ?? [];
}
