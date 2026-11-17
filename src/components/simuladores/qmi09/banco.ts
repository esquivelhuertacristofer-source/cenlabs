'use client';
/**
 * qmi09/banco.ts — lo mínimo que comparten el Piloto y la bitácora fuera del store
 * global: en qué modo está el banco (exploración de la celda de Daniell o reto). La
 * bitácora lo usa para decir lo que toca en cada modo; no guarda nada que se juzgue.
 */
import { create } from 'zustand';

export type ModoBancoQ9 = 'daniell' | 'reto';

export const useBancoCelda = create<{ modo: ModoBancoQ9; setModo: (m: ModoBancoQ9) => void }>((set) => ({
  modo: 'daniell',
  setModo: (modo) => set({ modo }),
}));
