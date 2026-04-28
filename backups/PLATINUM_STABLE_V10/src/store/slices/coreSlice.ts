import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';
import { Profile } from '../../lib/supabase';

export const createCoreSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  timer: 0,
  isRunning: true,
  score: 100,
  pasoActual: 1,
  bitacoraData: {},

  // Auth & Sync
  user: null,
  session: null,
  currentIntentoId: null,
  syncStatus: 'synced',
  
  setSession: (session: any) => set({ session }),
  setUser: (user: Profile | null) => set({ user }),
  setCurrentIntentoId: (id: string | null) => set({ currentIntentoId: id }),
  setSyncStatus: (status: 'synced' | 'pending' | 'offline' | 'error') => set({ syncStatus: status }),

  startTimer: () => set({ isRunning: true }),
  stopTimer: () => set({ isRunning: false }),
  resetTimer: () => set({ timer: 0 }),
  tick: () => set((state) => ({ timer: state.isRunning ? state.timer + 1 : state.timer })),
  updateScore: (points: number) => set((state) => ({ 
    score: Math.max(0, state.score + points) 
  })),
  setPasoActual: (paso: number) => set({ pasoActual: paso }),
  setBitacora: (data: Record<string, any>) => set((state) => ({ 
    bitacoraData: { ...state.bitacoraData, ...data } 
  })),
  badges: [],
  unlockBadge: (badgeId: string) => set((state) => {
    if (state.badges.includes(badgeId)) return state;
    return { badges: [...state.badges, badgeId] };
  }),
  language: 'es',
  setLanguage: (lang: 'es' | 'en') => set({ language: lang }),
  resetPractica: () => {
    // Implementación delegada al store principal para resetear todo
  }
});
