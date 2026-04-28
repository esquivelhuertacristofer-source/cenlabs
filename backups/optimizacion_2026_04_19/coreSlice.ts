import { StateCreator } from 'zustand';
import { SimuladorState } from '../types';
import { Profile } from '../../lib/supabase';

export const createCoreSlice: StateCreator<SimuladorState, [], [], any> = (set, get) => ({
  timer: 0,
  isRunning: false,
  score: 100,
  pasoActual: 1,
  bitacoraData: { hallazgos: [] },
  audio: {
    playClick: () => { if (typeof Audio !== 'undefined') new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_7315cc9657.mp3?filename=click-21156.mp3').play().catch(() => {}); },
    playSuccess: () => { if (typeof Audio !== 'undefined') new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625368a64.mp3?filename=success-1-6297.mp3').play().catch(() => {}); },
    playError: () => { if (typeof Audio !== 'undefined') new Audio('https://cdn.pixabay.com/download/audio/2022/03/10/audio_c973a2157d.mp3?filename=error-2-126514.mp3').play().catch(() => {}); },
    playNotification: () => { if (typeof Audio !== 'undefined') new Audio('https://cdn.pixabay.com/download/audio/2021/08/04/audio_bbd837682d.mp3?filename=notification-3-158197.mp3').play().catch(() => {}); },
    playVictory: () => { if (typeof Audio !== 'undefined') new Audio('https://cdn.pixabay.com/download/audio/2022/03/15/audio_34b335a16d.mp3?filename=victory-1-92731.mp3').play().catch(() => {}); },
  },
  asistente: {
    visible: true,
    text: "Bienvenido investigador. Soy el Dr. Quantum. Antes de iniciar, debemos verificar los protocolos de seguridad nuclear. ¿Estás listo?",
    mascot: "dr_quantum",
    pose: "neutral"
  },
  setAsistente: (data) => set((state) => ({ 
    asistente: { ...state.asistente, ...data } 
  })),

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
    set({ 
      timer: 0, 
      isRunning: false, 
      score: 100, 
      pasoActual: 1,
      bitacoraData: { hallazgos: [] }
    });
    // Resetear también estados específicos de química si existen
    if ((get() as any).resetParticulas) (get() as any).resetParticulas();
  }
});
