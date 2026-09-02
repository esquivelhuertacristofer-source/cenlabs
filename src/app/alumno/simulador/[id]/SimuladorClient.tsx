
"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, HelpCircle, FileText, Beaker, 
  ChevronRight, Play, CheckCircle2, AlertCircle, 
  RotateCcw, Save, Share2, Info, ChevronDown, 
  Layout, BookOpen, Microscope, Zap, Award, Menu, Power,
  ArrowLeft, ArrowRight, Timer, Target, BarChart3, GraduationCap, Lightbulb, X, FlaskConical, Thermometer, Dna, TrendingUp, Calculator, Hammer, ShieldCheck, Volume2, Globe, Download, Square
} from 'lucide-react';

import ErrorBoundary from '@/components/ErrorBoundary';

import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { supabase } from '@/lib/supabase-browser';
import { getCurrentProfile } from '@/lib/supabase-helpers';
import { SyncManager } from '@/components/SyncManager';
import AsistenteVirtual from '@/components/AsistenteVirtual';
import DrQuantumTutor, { TutorStep } from '@/components/DrQuantumTutor';
import MissionBriefing from '@/components/MissionBriefing';
import { MASTER_DATA, SimuladorId } from '@/data/simuladoresData';
import { audio } from '@/utils/audioEngine';
import { generateLabReport } from '@/utils/pdfGenerator';
import ScientificCalculator from '@/components/ScientificCalculator';
import { useBriefing } from '@/hooks/useBriefing';
import { ALL_TUTOR_STEPS } from '@/data/tutorSteps';
import LabQuiz from '@/components/LabQuiz';
import { getQuizForPractice } from '@/data/quizQuestions';
import { PILOTO_REGISTRY, BITACORA_REGISTRY } from '@/components/simulador/LabRegistry';
import SuccessModal from '@/components/simulador/SuccessModal';
import { getLabObjetivos } from '@/data/labObjetivos';
import PeriodicTable from '@/components/tools/PeriodicTable';
import StatisticalAnalysis from '@/components/tools/StatisticalAnalysis';
import BitacoraDefault from '@/components/bitacoras/BitacoraDefault';
import DiagramaSegre from '@/components/DiagramaSegre';

const Loader = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50/50 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando...</span>
    </div>
  </div>
);

// Componente Timer Aislado para evitar re-renders en el cliente raíz 
const LabTimer = () => {
  const timer = useSimuladorStore(state => state.timer);
  return (
    <div className="flex items-center gap-2 bg-slate-50 px-4 py-2 rounded-xl text-[#023047] border border-slate-100">
      <Timer size={16} />
      <span className="text-xs font-black tabular-nums">
        {Math.floor(timer/60)}:{(timer%60).toString().padStart(2,'0')}
      </span>
    </div>
  );
};

const list: Record<number, string> = { 1: "Hidrógeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono", 7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor", 10: "Neón" };

export default function SimuladorClient({ simuladorId }: { simuladorId: string }) {
  const router = useRouter();
  
  // Normalización de ID para soporte multi-lab
  const normalizedId = (
    simuladorId.startsWith('fisica-') ? simuladorId :
    simuladorId.startsWith('biologia-') ? simuladorId :
    simuladorId.startsWith('matematicas-') ? simuladorId :
    simuladorId.startsWith('quimica-') ? simuladorId :
    simuladorId.startsWith('qmi') ? `quimica-${parseInt(simuladorId.replace('qmi', ''))}` :
    simuladorId.startsWith('mat') ? `matematicas-${parseInt(simuladorId.replace('mat', ''))}` :
    simuladorId.startsWith('fis') ? `fisica-${parseInt(simuladorId.replace('fis', ''))}` :
    simuladorId.startsWith('bio') ? `biologia-${parseInt(simuladorId.replace('bio', ''))}` :
    simuladorId
  );

  // UI State
  const [activeTab, setActiveTab] = useState<'guia' | 'maestro' | 'config'>('guia');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isBitacoraOpen, setIsBitacoraOpen] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activateAnalysis, setActivateAnalysis] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const category = normalizedId.split('-')[0];
  const hubPath = `/alumno/laboratorio/${category}`;

  // El briefing se pide como activo estático al montar, en vez de leerse de un mapa
  // con los 160 en memoria (ver @/data/briefingConfigs). Mismo respaldo que antes:
  // si el lab no tiene portada, se usa la de quimica-1.
  const { config: briefing, cargando: cargandoBriefing } = useBriefing(normalizedId, 'quimica-1');

  // La portada tapa el simulador hasta que el alumno pulsa «empezar». Se DERIVA de
  // que además exista el config: si la petición falló, sin esto `showBriefing` se
  // quedaría en true para siempre, MissionBriefing no se renderizaría (necesita un
  // config) y el simulador nunca llegaría a montarse. Derivándolo, el fallo degrada
  // a «se entra directo a la práctica», no a un callejón sin salida.
  const mostrarPortada = showBriefing && !!briefing;

  // Grupo 1 — Core / UI actions (1 suscripción con shallow comparison)
  const { pasoActual, setPasoActual, resetPractica, setAsistente,
          setQuizQuestions, syncStatus, showQuiz, setShowQuiz, quizQuestions } =
    useSimuladorStore(useShallow(state => ({
      pasoActual:       state.pasoActual,
      setPasoActual:    state.setPasoActual,
      resetPractica:    state.resetPractica,
      setAsistente:     state.setAsistente,
      setQuizQuestions: state.setQuizQuestions,
      syncStatus:       state.syncStatus,
      showQuiz:         state.showQuiz,
      setShowQuiz:      state.setShowQuiz,
      quizQuestions:    state.quizQuestions,
    })));

  // Grupo 2 — Partículas (1 suscripción; propiedades derivadas por destructuring)
  const particulas = useSimuladorStore(state => state.particulas);
  const { targetZ, targetA, targetCharge,
          protones: pActual, neutrones: nActual, electrones: eActual } = particulas ?? {};

  // Grupo 3 — Física: solo labs con uso en HUD (1 suscripción)
  const { tiroParabolico, planoInclinado, pendulo, hooke } =
    useSimuladorStore(useShallow(state => ({
      tiroParabolico: state.tiro1,
      planoInclinado: state.plano2,
      pendulo:        state.pendulo3,
      hooke:          state.hooke4,
    })));

  // Grupo 4 — Química: 9 labs (1 suscripción)
  const { gases, balanceo, limitante, soluciones, solubilidad,
          titulacion, equilibrio, celda, destilacion } =
    useSimuladorStore(useShallow(state => ({
      gases:       state.gases,
      balanceo:    state.balanceo,
      limitante:   state.limitante,
      soluciones:  state.soluciones,
      solubilidad: state.solubilidad,
      titulacion:  state.titulacion,
      equilibrio:  state.equilibrio,
      celda:       state.celda,
      destilacion: state.destilacion,
    })));

  // Reset briefing on lab change
  useEffect(() => {
    setShowBriefing(true);
    setPasoActual(1);
  }, [simuladorId, setPasoActual]);

  const targetName = list[targetZ] || "Elemento";


  useEffect(() => {
    setMounted(true);
    setIsSidebarOpen(window.innerWidth >= 768);

    // --- REGISTRO DE ACTIVIDAD (Backend & Local) ---
    const recordVisit = async () => {
      // 1. Local Storage (Inmediato)
      localStorage.setItem('last_simulation_id', simuladorId);

      // 2. Auth & Cloud Sync
      let currentUser = useSimuladorStore.getState().user;
      if (!currentUser) {
        currentUser = await getCurrentProfile();
        if (currentUser) useSimuladorStore.getState().setUser(currentUser);
      }

      if (currentUser) {
        // Marcamos el inicio de la sesión en Supabase
        await supabase.from('intentos').upsert({
          id_alumno: currentUser.id,
          sim_id: simuladorId,
          status: 'in_progress',
          started_at: new Date().toISOString()
        }, { onConflict: 'id_alumno, sim_id, status' });
      }
    };
    recordVisit();

    // Iniciar atmósfera Diamond Engine
    audio.startAmbient(category);

    // Iniciar temporizador al montar
    useSimuladorStore.getState().resetTimer();
    useSimuladorStore.getState().startTimer();
    const interval = setInterval(() => {
      useSimuladorStore.getState().tick();
    }, 1000);
    return () => {
      clearInterval(interval);
      audio.stopAmbient();
    };
  }, [simuladorId, category]);

  // Auto-progreso optimizado (Solo observa lo estrictamente necesario)
  useEffect(() => {
    if (normalizedId === 'quimica-1') {
      if (pActual > 0 && pasoActual === 1) setPasoActual(2);
      if (pActual === targetZ && nActual === (targetA - targetZ) && pasoActual === 2) setPasoActual(3);
      if (pActual === targetZ && nActual === (targetA - targetZ) && eActual === targetZ && pasoActual === 3) setPasoActual(4);
    }
  }, [pActual, nActual, eActual, targetZ, targetA, pasoActual, setPasoActual, normalizedId]);

  // ── Auto-reparación e Inicialización de Estado (Diamond State Persistence Fix) ─────────
  useEffect(() => {
    if (mounted) {
      const state = useSimuladorStore.getState();
      
      // Inicializadores de Biología
      if (normalizedId === 'biologia-1') state.generarSemillaB1();
      if (normalizedId === 'biologia-2') state.generarSemillaB2();
      if (normalizedId === 'biologia-3') state.generarSemillaB3();
      if (normalizedId === 'biologia-4') state.generarSemillaB4();
      if (normalizedId === 'biologia-7') state.generarSemillaB7();
      if (normalizedId === 'biologia-8') state.generarSemillaB8();
      if (normalizedId === 'biologia-9') state.generarSemillaB9();
      if (normalizedId === 'biologia-10') state.generarSemillaB10();

      // Inicializadores de Matemáticas
      if (normalizedId === 'matematicas-1') state.generarSemillaM1();
      if (normalizedId === 'matematicas-2') state.generarSemillaM2();
      if (normalizedId === 'matematicas-3') state.generarSemillaM3();
      if (normalizedId === 'matematicas-4') state.generarSemillaM4();
      if (normalizedId === 'matematicas-7') state.generarSemillaM7();
      if (normalizedId === 'matematicas-10') state.generarSemillaM10();

      // Inicializadores de Química
      if (normalizedId === 'quimica-2') state.generarSemillaGases();
      if (normalizedId === 'quimica-5') state.generarSemillaP5();
      if (normalizedId === 'quimica-3') {
        // Si el estado está corrupto (sin reacciones), forzar inicialización
        if (!state.balanceo || !state.balanceo.reacciones || state.balanceo.reacciones.length === 0) {
          state.setReaccion(0);
        }
      }
    }
  }, [mounted, normalizedId]);

  // Se espera también al briefing (activo estático): sin esto se vería un instante
  // el simulador desnudo antes de que la portada cayera encima.
  if (!mounted || cargandoBriefing) return <div className="fixed inset-0 bg-[#0A1121] flex items-center justify-center z-[200]"><div className="w-16 h-16 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" /></div>;

  const data = MASTER_DATA[normalizedId as SimuladorId];
  
  if (!data) return (
    <div className="h-screen w-screen bg-[#023047] flex flex-col items-center justify-center font-['Outfit']">
      <div className="relative mb-8">
        <div className="w-24 h-24 rounded-3xl bg-rose-500/20 flex items-center justify-center animate-pulse">
           <AlertCircle size={48} className="text-rose-500" />
        </div>
        <div className="absolute -top-2 -right-2 w-6 h-6 bg-rose-500 rounded-full flex items-center justify-center text-[10px] font-black text-white">!</div>
      </div>
      <h2 className="text-3xl font-black text-white uppercase tracking-tighter mb-2">Simulador no Identificado</h2>
      <p className="text-slate-400 text-sm font-bold uppercase tracking-widest mb-10">Error de Telemetría: ID {simuladorId} fuera de rango</p>
      <button 
        onClick={() => router.push('/laboratorios')}
        className="px-10 py-4 bg-[#219EBC] hover:bg-[#8ECAE6] text-[#023047] font-black rounded-2xl transition-all active:scale-95 uppercase tracking-widest text-xs"
      >
        Volver al Panel Central
      </button>
    </div>
  );

  const getDynamicSteps = (z: number, a: number, charge: number = 0) => {
    const n = a - z;
    const expectedE = z - charge;
    const ionLabel = charge === 0 ? 'átomo neutro' : `ión (${charge > 0 ? '+' : ''}${charge})`;
    return [
      { id: 1, text: `Configura Z=${z} protones. El número atómico define al ${list[z] ?? 'elemento'} en la tabla periódica.` },
      { id: 2, text: `Añade N=${n} neutrones → A=${a} u.m.a. Verifica N/Z ≈ 1.0 en el Diagrama de Segré.` },
      { id: 3, text: `Distribuye ${expectedE} e⁻ en capas K/L (1s², 2s², 2p…) para ${ionLabel}. Recuerda: carga = Z − e⁻.` },
      { id: 4, text: 'Valida la integridad nuclear. El isótopo debe estar dentro de la banda de estabilidad.' }
    ];
  };

  const dynamicSteps = (normalizedId === 'quimica-1')
    ? getDynamicSteps(targetZ, targetA, targetCharge ?? 0)
    : data.pasos;
  const currentTutorSteps = ALL_TUTOR_STEPS[normalizedId] || [];

  // Calculador de Configuración Electrónica (Diamond State)
  const getElectronicConfig = (e: number): string => {
    if (e === 0) return 'Vacío';
    const sup: Record<number, string> = { 1: '¹', 2: '²', 3: '³', 4: '⁴', 5: '⁵', 6: '⁶', 7: '⁷', 8: '⁸' };
    const orbitals = [{ id: '1s', cap: 2 }, { id: '2s', cap: 2 }, { id: '2p', cap: 6 }];
    let remaining = e;
    const parts: string[] = [];
    for (const orb of orbitals) {
      if (remaining <= 0) break;
      const count = Math.min(remaining, orb.cap);
      parts.push(`${orb.id}${sup[count] ?? count}`);
      remaining -= count;
    }
    return parts.join(' ');
  };

  const handleManualValidation = () => {
    setIsValidating(true);
    audio.playLoading();
    setTimeout(() => {
      setIsValidating(false);
      let ok = false;
      let errorMsg = "";
      const state = useSimuladorStore.getState();

      // --- ENGINE DE VALIDACIÓN UNIVERSAL (40 LABS) ---
      switch(normalizedId) {
        // QUÍMICA
        case 'quimica-1': ok = state.validarEstructura(); break;
        case 'quimica-2': 
          ok = state.validarQ2(); 
          if (!ok) errorMsg = "Presión fuera de rango o cámara colapsada. Ajusta T o V para alcanzar el objetivo.";
          break;
        case 'quimica-3': 
          ok = state.validarQ3(); 
          if (!ok) {
            const completed = state.balanceo.reaccionesCompletadas?.length || 0;
            errorMsg = `Balanceo incompleto. Has estabilizado ${completed} de 4 reacciones requeridas para la certificación.`;
          }
          break;
        case 'quimica-4': 
          ok = state.limitante.status === 'success'; 
          if (!ok) errorMsg = "Debes identificar correctamente el reactivo limitante y el exceso en la consola.";
          break;
        case 'quimica-5': 
          ok = state.validarP5(); 
          if (!ok) errorMsg = "Molaridad incorrecta. La precisión analítica debe ser superior al 95%.";
          break;
        case 'quimica-6': ok = state.validarP6(); break;
        case 'quimica-7': ok = state.titulacion.status === 'success'; break;
        case 'quimica-8': ok = state.equilibrio.status === 'success'; break;
        case 'quimica-9': ok = state.celda.status === 'success'; break;
        case 'quimica-10':
          ok = state.destilacion.volDestilado >= 50 && state.destilacion.purezaDestilado >= 85;
          if (!ok) errorMsg = state.destilacion.volDestilado < 50
            ? "Volumen de destilado insuficiente. Se requieren ≥50 mL para la certificación."
            : "Pureza del destilado insuficiente (< 85%). Ajusta la temperatura de la manta calefactora.";
          break;

        // FÍSICA
        case 'fisica-1': 
          ok = state.validarF1(); 
          if (!ok) errorMsg = "Debes lograr al menos un impacto confirmado en el blanco para certificar la balística.";
          break;
        case 'fisica-2': ok = state.validarF2(); break;
        case 'fisica-3': ok = state.validarF3(); break;
        case 'fisica-4': ok = state.validarF4(); break;
        case 'fisica-5': ok = state.validarF5(); break;
        case 'fisica-6': ok = state.validarF6(); break;
        case 'fisica-7': ok = state.validarF7(); break;
        case 'fisica-8': ok = state.validarF8(); break;
        case 'fisica-9': ok = state.validarF9(); break;
        case 'fisica-10': ok = state.validarF10(); break;

        // MATEMÁTICAS
        case 'matematicas-1': ok = state.validarM1(); break;
        case 'matematicas-2': ok = state.validarM2(); break;
        case 'matematicas-3': ok = state.validarM3(); break;
        case 'matematicas-4': ok = state.validarM4(); break;
        case 'matematicas-5': ok = state.validarM5(); break;
        case 'matematicas-6': ok = state.validarM6(); break;
        case 'matematicas-7': ok = state.validarM7(); break;
        case 'matematicas-8': ok = state.validarM8(); break;
        case 'matematicas-9': ok = state.validarM9(0.15); break;
        case 'matematicas-10': ok = state.validarM10(); break;

        // BIOLOGÍA
        case 'biologia-1': 
          ok = state.validarB1(); 
          if (!ok) errorMsg = "Muestra fuera de foco o iluminación insuficiente. Revisa la magnificación requerida.";
          break;
        case 'biologia-2': 
          ok = state.validarB2(); 
          if (!ok) errorMsg = "El sistema aún no está en equilibrio osmótico (C_int ≠ C_ext).";
          break;
        case 'biologia-3': ok = state.validarB3(); break;
        case 'biologia-4': ok = state.validarB4(); break;
        case 'biologia-5': ok = state.validarB5(); break;
        case 'biologia-6': ok = state.validarB6(); break;
        case 'biologia-7': ok = state.validarB7(); break;
        case 'biologia-8': ok = state.validarB8(); break;
        case 'biologia-9': ok = state.validarB9(); break;
        case 'biologia-10': ok = state.validarB10(); break;
        
        default:
          ok = false;
          errorMsg = `Lab "${normalizedId}" no tiene validador registrado en el Engine. Reportar al equipo técnico.`;
          console.error('[Diamond Engine] Validador faltante:', normalizedId);
          break;
      }

      if (ok) {
        audio.playSuccess();
        setQuizQuestions(getQuizForPractice(normalizedId));
        setShowQuiz(true);
        setAsistente({
          visible: true,
          text: "¡Protocolo completado con éxito! Iniciando fase de evaluación teórica...",
          pose: 'happy'
        });
      } else {
        audio.playError();
        const msg = errorMsg || "Protocolo Incompleto. Verifica los parámetros de la bitácora antes de certificar la misión.";
        setAsistente({
          visible: true,
          text: msg,
          pose: 'warning'
        });
        audio.playGuide(msg);
      }
    }, 800);
  };

  const renderPiloto = () => {
    const Component = PILOTO_REGISTRY[normalizedId] || PILOTO_REGISTRY['quimica-1'];
    
    // Props especiales para componentes específicos
    const specialProps: any = {};
    if (normalizedId === 'quimica-1' || normalizedId === 'quimica-2') {
      specialProps.isWorktableDark = false;
    }
    if (normalizedId === 'quimica-2') {
      specialProps.isProfesor = false;
    }
    if (['biologia-3', 'biologia-4', 'biologia-5'].includes(normalizedId)) {
      specialProps.setShowSuccess = setShowSuccess;
    }

    return <Component {...specialProps} onValidate={handleManualValidation} />;
  };

  const renderBitacora = () => {
    const Component = BITACORA_REGISTRY[normalizedId] || BitacoraDefault;
    return <Component onValidate={handleManualValidation} />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-['Outfit'] antialiased relative">
      <SyncManager />
      

      
      {/* Backdrop del drawer de guía (solo móvil) */}
      {isSidebarOpen && (
        <div
          onClick={() => setIsSidebarOpen(false)}
          className="fixed inset-0 bg-black/50 z-40 md:hidden"
          aria-hidden
        />
      )}

      <aside
        className={`bg-[#023047] text-white flex flex-col shadow-2xl overflow-hidden
          fixed inset-y-0 left-0 z-50 w-[86%] max-w-xs transition-all duration-300
          ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
          md:relative md:z-20 md:translate-x-0 md:max-w-none md:shrink-0
          ${isSidebarOpen ? 'md:w-[30%]' : 'md:w-20'}`}
      >
        <div className="p-6 border-b border-white/10 flex items-center justify-between">
            <h1 className={`font-black uppercase tracking-tighter transition-all ${isSidebarOpen ? 'text-2xl' : 'text-xs scale-0'}`}>CEN Labs</h1>
            <button onClick={() => setIsSidebarOpen(!isSidebarOpen)} className="w-10 h-10 rounded-xl bg-white/5 flex items-center justify-center hover:bg-white/10 transition-colors">
              <Menu size={20} />
            </button>
        </div>

        {isSidebarOpen && (
          <div className="flex-1 overflow-y-auto flex flex-col">
            <div className="p-6 space-y-8 flex-1">
              <div className="bg-gradient-to-br from-[#219EBC] to-[#023047] p-8 rounded-[2rem] shadow-2xl relative overflow-hidden group border border-white/10">
                <div className="relative z-10">
                  <span className="text-[10px] font-black uppercase tracking-widest text-[#8ECAE6]">
                    {normalizedId.startsWith('matematicas') ? 'Certificación Matemática'
                    : normalizedId.startsWith('fisica') ? 'Protocolo de Física Teórica'
                    : normalizedId.startsWith('biologia') ? 'Bio-Simulación Avanzada'
                    : normalizedId.startsWith('quimica') ? 'Protocolo de Síntesis Molecular'
                    : 'Sistema de Simulación Avanzada'}
                  </span>
                  <h2 className="text-2xl font-black uppercase leading-none mt-2 drop-shadow-lg">{data.titulo}</h2>
                </div>
                <div className="absolute -right-4 -bottom-4 w-32 h-32 bg-white/5 rounded-full blur-3xl group-hover:bg-[#219EBC]/20 transition-all" />
              </div>

              <div className="flex gap-2">
                <button onClick={() => setActiveTab('guia')} className={`flex-1 py-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'guia' ? 'bg-[#219EBC] text-white' : 'bg-white/5 text-slate-400'}`}>Guía</button>
                <button onClick={() => setActiveTab('maestro')} className={`flex-1 py-3 min-h-[44px] rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'maestro' ? 'bg-[#FB8500] text-white' : 'bg-white/5 text-slate-400'}`}>Docente</button>
              </div>

              {activeTab === 'guia' && (
                <div className="space-y-6">
                  {/* ── Dr. Quantum Tutor — paso a paso interactivo ── */}
                  {currentTutorSteps.length > 0 ? (
                    <DrQuantumTutor
                      steps={currentTutorSteps}
                      pasoCompletado={pasoActual === 4 ? 8 : pasoActual}
                      mision={data.mision}
                      nombreAlumno="Estudiante"
                    objetivos={getLabObjetivos(normalizedId, {
                      pActual: pActual ?? 0, nActual: nActual ?? 0, eActual: eActual ?? 0,
                      targetZ: targetZ ?? 0, targetA: targetA ?? 0, targetCharge: targetCharge ?? 0,
                      gases, balanceo, limitante, soluciones, solubilidad,
                      titulacion, equilibrio, celda, destilacion,
                      tiroParabolico, planoInclinado, pendulo, hooke,
                    })}
                    />
                  ) : (
                  <>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                    <div className="flex gap-2 mb-6">
                        <button onClick={() => audio.playGuide(data.mision)} className="flex-1 h-12 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all group">
                          <Play size={14} fill="white" />
                          <span className="text-[10px] font-black uppercase tracking-widest text-blue-50">Reproducir</span>
                        </button>
                        <button onClick={() => audio.stopGuide()} className="w-12 h-12 bg-white/10 hover:bg-red-500/30 border border-white/10 text-white/60 rounded-2xl flex items-center justify-center transition-all" title="Detener Audio">
                          <Square size={16} fill="currentColor" />
                        </button>
                    </div>
                    <p className="text-xs font-bold text-blue-100/90 leading-relaxed italic">
                      &quot;{normalizedId === 'quimica-1' ? `Forja un átomo de ${targetName} (Isótopo)` : data.titulo}&quot;
                    </p>
                  </div>

                  <div className="space-y-4">
                    {dynamicSteps.map((paso: any) => (
                      <div key={paso.id} className="relative pl-8 pb-4 group">
                        <div className={`absolute left-0 top-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${pasoActual >= paso.id ? 'bg-[#219EBC] text-white shadow-xl shadow-[#219EBC]/30' : 'bg-black/40 text-white/20 border border-white/5'}`}>
                          {pasoActual > paso.id ? <CheckCircle2 size={12} /> : paso.id}
                        </div>
                        <p className={`text-xs font-bold leading-snug ${pasoActual >= paso.id ? 'text-white' : 'text-slate-500 group-hover:text-slate-300'}`}>{paso.text}</p>
                      </div>
                    ))}
                  </div>
                  </>
                  )}

                  {normalizedId === 'quimica-1' && (
                    <>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="p-5 bg-black/40 border border-[#219EBC]/30 rounded-3xl shadow-2xl relative overflow-hidden"
                      >
                        <div className="absolute top-0 right-0 p-3"><Zap size={12} className="text-[#219EBC] opacity-40 animate-pulse" /></div>
                        <span className="text-[11px] font-black text-[#219EBC] uppercase tracking-widest block mb-3">Config. Electrónica (n, l)</span>
                        <span className="text-[15px] font-black text-white tracking-widest font-mono">{getElectronicConfig(eActual)}</span>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                          <motion.div
                            animate={{ width: `${Math.min(100, (eActual / 10) * 100)}%` }}
                            className="h-full bg-gradient-to-r from-[#219EBC] to-emerald-400"
                          />
                        </div>
                      </motion.div>
                      <motion.div
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0, transition: { delay: 0.15 } }}
                        className="p-5 bg-black/40 border border-white/10 rounded-3xl shadow-2xl"
                      >
                        <DiagramaSegre
                          currentZ={pActual}
                          currentN={nActual}
                          targetZ={targetZ}
                          targetN={targetA - targetZ}
                        />
                      </motion.div>
                    </>
                  )}
                </div>
              )}

              {activeTab === 'maestro' && (
                <div className="space-y-6 animate-in fade-in slide-in-from-bottom-2 duration-300">
                  <div className="p-6 bg-[#FB8500]/10 rounded-3xl border border-[#FB8500]/20">
                     <h4 className="text-[10px] font-black text-[#FB8500] uppercase tracking-widest mb-2">Objetivo Pedagógico</h4>
                     <p className="text-xs font-bold text-orange-100/70 leading-relaxed">{data.guiaMaestro.objetivo}</p>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                     <h4 className="text-[10px] font-black text-[#219EBC] uppercase tracking-widest mb-2">Puntos de Fricción</h4>
                     <p className="text-xs text-blue-100/50 leading-relaxed mb-4">{data.guiaMaestro.friccion}</p>
                     <div className="space-y-2">
                        {data.guiaMaestro.puntosClave.map((punto, i) => (
                          <div key={i} className="flex items-start gap-3">
                             <div className="w-1 h-1 rounded-full bg-[#FB8500] mt-1.5" />
                             <span className="text-[10px] font-bold text-slate-300">{punto}</span>
                          </div>
                        ))}
                     </div>
                  </div>
                  <div className="p-6 bg-white/5 rounded-3xl border border-white/10">
                     <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-4">Conceptos Clave</h4>
                     <div className="space-y-4">
                        {data.conceptos.map((c, i) => (
                          <div key={i}>
                             <span className="text-[10px] font-black text-white uppercase block mb-1">{c.titulo}</span>
                             <p className="text-[10px] text-slate-400 leading-tight">{c.desc}</p>
                          </div>
                        ))}
                     </div>
                  </div>
                </div>
              )}
            </div>

            {![
              'matematicas-1', 'fisica-1', 'fisica-2', 'fisica-4', 'fisica-5', 'fisica-6', 
              'biologia-1', 'biologia-2', 'quimica-1', 'quimica-2', 'quimica-3', 'quimica-4', 'quimica-5', 'quimica-6'
            ].includes(normalizedId) && (
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                <AsistenteVirtual
                  isVisible={isSidebarOpen}
                  onClose={() => {}}
                  text={(() => {
                    if (isValidating) return "Procesando datos de telemetría... verificando integridad de la bitácora.";
                    
                    const subject = normalizedId.split('-')[0];
                    switch(subject) {
                      case 'quimica':
                        return "Asegúrate de registrar tus hallazgos moleculares. La precisión en el pesaje y balanceo es vital para la certificación química.";
                      case 'fisica':
                        return "Verifica las leyes de conservación. Los datos experimentales deben coincidir con los modelos cinemáticos y dinámicos.";
                      case 'matematicas':
                        return "El rigor algebraico es fundamental. Sincroniza las variables hasta que el error sea despreciable.";
                      case 'biologia':
                        return "Observa cuidadosamente los patrones celulares. La vida sigue leyes biofísicas que debes documentar con precisión.";
                      default:
                        return "Protocolo activo. Esperando entrada de datos para iniciar el procesamiento de laboratorio.";
                    }
                  })()}
                  showButton={false}
                  title="DR. QUANTUM"
                  variant="sidebar-hud"
                />
            </div>
            )}
          </div>
        )}
      </aside>

      <main className="flex-1 flex flex-col relative bg-[#F8FAFC]">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-4 md:px-8 z-20">
            <div className="flex items-center gap-3 md:gap-6">
               <button
                 onClick={() => setIsSidebarOpen(true)}
                 className="md:hidden w-11 h-11 rounded-xl bg-slate-100 flex items-center justify-center text-[#023047] shrink-0"
                 aria-label="Abrir guía"
               >
                 <Menu size={20} />
               </button>
               <div className="hidden sm:flex flex-col">
                 <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronización Escolar</span>
                 <div className="flex items-center gap-2">
                   <div className={`w-2 h-2 rounded-full animate-pulse ${
                     syncStatus === 'synced' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' :
                     syncStatus === 'pending' ? 'bg-amber-500 shadow-[0_0_8px_rgba(245,158,11,0.5)]' :
                     'bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.5)]'
                   }`} />
                   <span className="text-sm font-black text-[#023047] uppercase tracking-tight">
                     {syncStatus === 'synced' ? 'Cloud Synced' :
                      syncStatus === 'pending' ? 'Actualizando...' :
                      syncStatus === 'error' ? 'Sync Error' : 'Offline Mode'}
                   </span>
                 </div>
               </div>
               <div className="hidden sm:block h-8 w-px bg-slate-100" />
               <LabTimer />
            </div>
           
           <div className="flex items-center gap-2 md:gap-3">
              <button
                onClick={handleManualValidation}
                disabled={isValidating}
                className={`h-11 md:h-12 px-4 md:px-8 rounded-2xl flex items-center gap-2 md:gap-3 font-black text-[10px] uppercase tracking-widest transition-all shrink-0 ${isValidating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#023047] text-white hover:bg-emerald-600 shadow-lg shadow-[#023047]/20 shadow-xl'}`}
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : <ShieldCheck size={18} />}
                <span className="hidden sm:inline">{isValidating ? 'Validando...' : 'Validar Práctica'}</span>
              </button>

              <div className="hidden md:block w-px h-8 bg-slate-100 mx-2" />

              <button onClick={() => { setActivateAnalysis(true); setShowTools(true); }} className="hidden md:flex w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                <TrendingUp size={20} />
              </button>
              <button onClick={() => setShowTools(true)} className="h-11 md:h-auto px-3 md:px-6 md:py-3 bg-white border border-slate-200 text-[#023047] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#219EBC] transition-all flex items-center gap-2 shrink-0">
                <Microscope size={16} /> <span className="hidden md:inline">Herramientas</span>
              </button>
              <button onClick={() => setIsBitacoraOpen(true)} className="md:hidden w-11 h-11 rounded-2xl bg-white border border-slate-200 text-[#023047] flex items-center justify-center hover:border-[#219EBC] transition-all shrink-0" aria-label="Abrir bitácora">
                <FileText size={18} />
              </button>
              <button onClick={() => setShowExitModal(true)} className="w-11 h-11 md:w-12 md:h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-red-500 hover:border-red-500 transition-all shrink-0">
                <Power size={20} />
              </button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
           <div className={`flex-1 relative shadow-inner overflow-hidden ${
             normalizedId.startsWith('matematicas') ? 'bg-[#0A1121]' :
             normalizedId === 'quimica-1' ? 'bg-[#020205]' :
             normalizedId === 'quimica-5' ? 'bg-[#0c1828]' :
             'bg-slate-100'
           }`}>
             {/* Background Grid for Math/Science context */}
             {normalizedId.startsWith('matematicas') && (
               <div className="absolute inset-0 pointer-events-none opacity-[0.05]" 
                 style={{ 
                   backgroundImage: 'linear-gradient(rgba(34,211,238,0.2) 1px, transparent 1px), linear-gradient(90deg, rgba(34,211,238,0.2) 1px, transparent 1px)',
                   backgroundSize: '40px 40px'
                 }} 
               />
             )}
             {normalizedId.startsWith('fisica') && (
               <div className="absolute inset-0 pointer-events-none opacity-[0.03]" 
                 style={{ 
                   backgroundImage: 'radial-gradient(circle, rgba(251,133,0,0.2) 1px, transparent 1px)',
                   backgroundSize: '30px 30px'
                 }} 
               />
             )}
             {!mostrarPortada && renderPiloto()}
           </div>
           
           {/* Backdrop de la bitácora (solo móvil) */}
           {isBitacoraOpen && (
             <div onClick={() => setIsBitacoraOpen(false)} className="fixed inset-0 bg-black/50 z-30 md:hidden" aria-hidden />
           )}

           <div className={`bg-slate-50 border-l border-slate-100 flex flex-col
             fixed inset-y-0 right-0 z-40 w-[86%] max-w-sm transition-transform duration-300
             ${isBitacoraOpen ? 'translate-x-0' : 'translate-x-full'}
             md:relative md:inset-auto md:z-auto md:translate-x-0 md:w-[400px] md:max-w-none`}>
              <div className="p-6 border-b border-slate-100 bg-white/50 backdrop-blur-sm font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center justify-between gap-2">
                 <span className="flex items-center gap-2"><FileText size={12} /> Bitácora de Observaciones</span>
                 <button onClick={() => setIsBitacoraOpen(false)} className="md:hidden w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-slate-500" aria-label="Cerrar bitácora">
                   <X size={16} />
                 </button>
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 {renderBitacora()}
              </div>
           </div>
        </div>

        <AnimatePresence mode="wait">
          {mostrarPortada && (
            <MissionBriefing
              key="mission-briefing"
              config={briefing!}
              labId={normalizedId}
              onStart={() => setShowBriefing(false)}
            />
          )}

          {showQuiz && (
            <LabQuiz
              key="lab-quiz"
              id={normalizedId}
              questions={quizQuestions}
              onComplete={async (quizScore) => {
                setShowQuiz(false);
                setShowSuccess(true);
                audio.playVictory();
                const st = useSimuladorStore.getState();
                const user = st.user;
                // TECH DEBT: onComplete handles both UI transition and DB write.
                // Fix 2 should decouple: fire DB write when quiz finishes (useEffect on
                // isFinished in LabQuiz), keep this button for UI transition only.
                // That way a slow user still gets their score saved even if they close
                // the tab without clicking "Cerrar y Validar".
                if (process.env.NODE_ENV === 'development') {
                  console.debug('[onComplete] Iniciando guardado del intento', {
                    sim_id: simuladorId,
                    user_id: user?.id ? '[redacted]' : 'null — user no está en el store',
                  });
                }
                if (!user) {
                  console.error('[onComplete] user es null — el upsert NO se ejecutará. Verificar getCurrentProfile() y setUser().');
                  return;
                }
                try {
                  const { error, status: httpStatus } = await supabase
                    .from('intentos')
                    .upsert({
                      id_alumno: user.id,
                      sim_id: simuladorId,
                      status: 'completed',
                      score: quizScore,
                      total_time_seconds: st.timer,
                      completed_at: new Date().toISOString(),
                      last_step: st.pasoActual,
                    }, { onConflict: 'id_alumno, sim_id, status' });
                  if (error) {
                    console.error('[onComplete] Error al guardar intento:', {
                      message: error.message,
                      code: error.code,
                      details: error.details,
                      hint: (error as any).hint,
                      httpStatus,
                    });
                  } else {
                    if (process.env.NODE_ENV === 'development') {
                      console.debug('[onComplete] Intento guardado exitosamente');
                    }
                  }
                } catch (e) {
                  console.error('[onComplete] Exception inesperada:', e);
                }
              }}
              onCancel={() => setShowQuiz(false)}
            />
          )}

          {showSuccess && (
            <SuccessModal 
              key="success-modal"
              normalizedId={normalizedId}
              data={data}
              hubPath={hubPath}
              resetPractica={resetPractica}
              onClose={() => setShowSuccess(false)}
            />
          )}

          {showExitModal && (
            <div key="exit-modal" className="fixed inset-0 z-[300] flex items-center justify-center bg-[#023047]/60 backdrop-blur-md">
               <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center border-b-[12px] border-red-500">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertCircle size={40} /></div>
                  <h3 className="text-2xl font-black text-[#023047] uppercase mb-6 tracking-tighter">¿Pausar Sesión?</h3>
                  <div className="flex gap-4">
                      <button onClick={() => setShowExitModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Seguir</button>
                      <button onClick={() => router.push(hubPath)} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl">Salir</button>
                  </div>
               </div>
            </div>
          )}

          {showTools && (
            <div key="tools-modal" className="fixed inset-0 z-[400] flex items-center justify-center bg-[#023047]/80 backdrop-blur-xl p-8">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.95, opacity: 0 }} className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-10 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <Microscope size={32} className="text-[#219EBC]" />
                        <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter">Toolkit Avanzado</h3>
                      </div>
                      <button onClick={() => setShowTools(false)} aria-label="Cerrar toolkit" className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
                  </div>
                  <div className="flex px-10 border-b border-slate-100 bg-slate-50/30">
                      <button onClick={() => setActivateAnalysis(false)} className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${!activateAnalysis ? 'border-[#219EBC] text-[#219EBC]' : 'border-transparent text-slate-400'}`}>Tabla Periódica</button>
                      <button onClick={() => setActivateAnalysis(true)} className={`py-4 px-6 text-[10px] font-black uppercase tracking-widest transition-all border-b-2 ${activateAnalysis ? 'border-[#219EBC] text-[#219EBC]' : 'border-transparent text-slate-400'}`}>Análisis Estadístico</button>
                  </div>
                  <div className="flex-1 p-10 overflow-auto bg-slate-50/50">
                      {activateAnalysis ? <StatisticalAnalysis /> : <PeriodicTable />}
                  </div>
               </motion.div>
            </div>
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
