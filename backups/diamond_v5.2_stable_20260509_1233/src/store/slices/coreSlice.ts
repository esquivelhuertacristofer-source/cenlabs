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
    playClick: () => { import('@/utils/audioEngine').then(m => m.audio.playClick()); },
    playPop: () => { import('@/utils/audioEngine').then(m => m.audio.playPop()); },
    playSuccess: () => { import('@/utils/audioEngine').then(m => m.audio.playSuccess()); },
    playError: () => { import('@/utils/audioEngine').then(m => m.audio.playError()); },
    playNotification: () => { import('@/utils/audioEngine').then(m => m.audio.playPop()); },
    playVictory: () => { import('@/utils/audioEngine').then(m => m.audio.playSuccess()); },
  },
  asistente: {
    visible: true,
    text: "Bienvenido investigador. Soy el Dr. Quantum. Antes de iniciar, debemos verificar los protocolos de seguridad nuclear. ¿Estás listo?",
    mascot: "dr_quantum",
    pose: "neutral"
  },
  setAsistente: (data: Partial<SimuladorState['asistente']>) => set((state) => ({ 
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
  registrarHallazgo: (tipo: string, data: any) => set((state) => {
    const hallazgos = state.bitacoraData?.hallazgos || [];
    return {
      bitacoraData: {
        ...state.bitacoraData,
        hallazgos: [
          ...hallazgos,
          {
            id: crypto.randomUUID(),
            tipo,
            data,
            timestamp: new Date().toISOString()
          }
        ]
      }
    };
  }),
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
    const state = get() as any;
    // Química (QMI 01-10)
    if (state.resetParticulas) state.resetParticulas();
    if (state.resetGases) state.resetGases();
    if (state.resetBalanceo) state.resetBalanceo();
    if (state.resetP4) state.resetP4();
    if (state.resetP5) state.resetP5();
    if (state.resetP6) state.resetP6();
    if (state.resetP7) state.resetP7();
    if (state.resetP8) state.resetP8();
    if (state.resetP9) state.resetP9();
    if (state.resetP10) state.resetP10();
    // Biología (BIO 01-10)
    if (state.resetB1) state.resetB1();
    if (state.resetB2) state.resetB2();
    if (state.resetB3) state.resetB3();
    if (state.resetB4) state.resetB4();
    if (state.resetB5) state.resetB5();
    if (state.resetB6) state.resetB6();
    if (state.resetB7) state.resetB7();
    if (state.resetB8) state.resetB8();
    if (state.resetB9) state.resetB9();
    if (state.resetB10) state.resetB10();
    // Matemáticas (MAT 01-10)
    if (state.resetM1) state.resetM1();
    if (state.resetM2) state.resetM2();
    if (state.resetM3) state.resetM3();
    if (state.resetM4) state.resetM4();
    if (state.resetM5) state.resetM5();
    if (state.resetM6) state.resetM6();
    if (state.resetM7) state.resetM7();
    if (state.resetM8) state.resetM8();
    if (state.resetM9) state.resetM9();
    if (state.resetM10) state.resetM10();
    // Física (FIS 01-10)
    if (state.resetF1) state.resetF1();
    if (state.resetF2) state.resetF2();
    if (state.resetF3) state.resetF3();
    if (state.resetF4) state.resetF4();
    if (state.resetF5) state.resetF5();
    if (state.resetF6) state.resetF6();
    if (state.resetF7) state.resetF7();
    if (state.resetF8) state.resetF8();
    if (state.resetF9) state.resetF9();
    if (state.resetF10) state.resetF10();
  },
  showQuiz: false,
  setShowQuiz: (show: boolean) => set({ showQuiz: show }),
  quizQuestions: [],
  setQuizQuestions: (questions: any[]) => set({ quizQuestions: questions }),
});
