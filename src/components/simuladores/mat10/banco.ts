'use client';
/**
 * mat10/banco.ts — estado LOCAL de la máquina de Galton (fuera del store global, que
 * guarda sólo lo que juzga el reto: p, los contenedores, la predicción y el estado).
 *
 * Lo comparten el Piloto (controles, barra y dock), la escena 3D y la bitácora, para
 * que digan lo mismo. El RELOJ ÚNICO es la escena: en cada cuadro avanza la física y
 * publica aquí lo que se está viendo —la inclinación α que tiene el tablero en ese
 * cuadro, cuántas bolitas vuelan, si un canal se llenó y el camino de la última que
 * se posó—; las cuentas las escribe en el store global en el MISMO cuadro en que la
 * bolita se queda quieta en su pila.
 */
import { create } from 'zustand';

export type Vista = 'tablero' | 'clavos' | 'pilas';

export interface UltimaBolita {
  /** +1 derecha, −1 izquierda, una por fila */
  decisiones: number[];
  k: number;
  /** número de orden (cambia aunque se repita el camino) */
  n: number;
}

export interface EstadoBancoGalton {
  vista: Vista;
  /** cambia en cada pulsación de una vista (permite repetir la misma) */
  vistaPulso: number;
  /** cámara lenta ×1/4 (si no, tiempo real) */
  lenta: boolean;
  /** la tolva deja caer una bolita cada 0,25 s (tiempo físico) */
  goteo: boolean;
  /** inclinación (rad) que muestra la escena en este cuadro; null = sin escena */
  alfaVis: number | null;
  enVuelo: number;
  /** algún canal no admite más bolitas: la tolva se cierra */
  lleno: boolean;
  ultima: UltimaBolita | null;
  setVista: (v: Vista) => void;
  setLenta: (l: boolean) => void;
  setGoteo: (g: boolean) => void;
  publicar: (d: Partial<Pick<EstadoBancoGalton, 'alfaVis' | 'enVuelo' | 'lleno' | 'ultima'>>) => void;
  reiniciar: (goteo?: boolean) => void;
}

const INICIAL = {
  vista: 'tablero' as Vista,
  vistaPulso: 0,
  lenta: true,
  goteo: true,
  alfaVis: null as number | null,
  enVuelo: 0,
  lleno: false,
  ultima: null as UltimaBolita | null,
};

export const useBancoGalton = create<EstadoBancoGalton>((set) => ({
  ...INICIAL,
  setVista: (vista) => set((s) => ({ vista, vistaPulso: s.vistaPulso + 1 })),
  setLenta: (lenta) => set({ lenta }),
  setGoteo: (goteo) => set({ goteo }),
  publicar: (d) => set(d),
  reiniciar: (goteo = true) => set({ ...INICIAL, goteo }),
}));
