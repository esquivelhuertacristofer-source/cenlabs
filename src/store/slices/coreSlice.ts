import { StateCreator } from 'zustand';
import { SimuladorState, CoreSlice } from '../types';
import { Profile } from '../../lib/supabase-helpers';

export const createCoreSlice: StateCreator<SimuladorState, [], [], CoreSlice> = (set, get) => ({
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
            // randomUUID solo existe en contextos seguros (https/localhost) y no en jsdom.
            id: globalThis.crypto?.randomUUID?.() ?? `h-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`,
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
  entrarLab: (id: string) => {
    const [materia, num] = id.split('-');
    const n = Number(num);
    const st = get();
    if (materia === 'quimica') st.entrarQuimica(n);
    else if (materia === 'fisica') st.entrarFisica(n);
    else if (materia === 'biologia') st.entrarBiologia(n);
    else if (materia === 'matematicas') st.entrarMatematicas(n);
    // La bitácora (notas y ensayos del alumno) sobrevive a una recarga del MISMO
    // lab; al cambiar de lab empieza en blanco. Nunca sobrevive un veredicto:
    // las claves `fisicaN`, `quimicaN`… eran banderas de éxito que reabrían el
    // overlay de «misión cumplida» y aprobaban sin repetir la práctica.
    set((state) => {
      const previa = state.bitacoraData ?? { hallazgos: [] };
      if (previa.labId !== id) return { pasoActual: 1, score: 100, bitacoraData: { hallazgos: [], labId: id } };
      const limpia: Record<string, unknown> = {};
      for (const [k, v] of Object.entries(previa)) {
        if (!/^(quimica|fisica|biologia|matematicas)\d+$/.test(k)) limpia[k] = v;
      }
      return { pasoActual: 1, score: 100, bitacoraData: { ...limpia, hallazgos: previa.hallazgos ?? [], labId: id } };
    });
  },
  validarLab: (id: string) => {
    const [materia, num] = id.split('-');
    const n = Number(num);
    const st = get();
    if (materia === 'quimica') return st.validarLabQuimica(n);
    if (materia === 'fisica') return st.validarLabFisica(n);
    if (materia === 'biologia') return st.validarLabBiologia(n);
    if (materia === 'matematicas') return st.validarLabMatematicas(n);
    return { ok: false, mensaje: `Lab "${id}" no tiene validador registrado. Reportar al equipo técnico.` };
  },
  resetPractica: () => {
    set({
      timer: 0,
      isRunning: false,
      score: 100,
      pasoActual: 1,
      bitacoraData: { hallazgos: [] }
    });
    get().resetQuimica();
    get().resetFisica();
    get().resetBiologia();
    get().resetMatematicas();
  },
  showQuiz: false,
  setShowQuiz: (show: boolean) => set({ showQuiz: show }),
  quizQuestions: [],
  setQuizQuestions: (questions: any[]) => set({ quizQuestions: questions }),
});
