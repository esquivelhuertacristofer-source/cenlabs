import { fromRegistry } from '@/labs/_registry';

export interface SimuladorContenido {
  titulo: string;
  tituloEn?: string;
  mision: string;
  misionEn?: string;
  ecuacion: string;
  formulaGfx: string;
  pasos: {
    id: number;
    text: string;
    textEn?: string;
    icon: string;
  }[];
  guiaMaestro: {
    objetivo: string;
    friccion: string;
    puntosClave: string[];
  };
  conceptos: {
    titulo: string;
    desc: string;
  }[];
  videoUrl?: string;
}

const LEGACY_MASTER_DATA: Record<string, SimuladorContenido> = {} as const;

export const MASTER_DATA: Record<string, SimuladorContenido> = {
  ...LEGACY_MASTER_DATA,
  ...fromRegistry('contenido'),
};

export type SimuladorId = keyof typeof MASTER_DATA;
