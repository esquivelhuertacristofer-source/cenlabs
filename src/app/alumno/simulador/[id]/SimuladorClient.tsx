
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
import { supabase, getCurrentProfile } from '@/lib/supabase';
import { SyncManager } from '@/components/SyncManager';
import AsistenteVirtual from '@/components/AsistenteVirtual';
import DrQuantumTutor, { TutorStep } from '@/components/DrQuantumTutor';
import MissionBriefing, { BriefingConfig } from '@/components/MissionBriefing';
import { MASTER_DATA, SimuladorId } from '@/data/simuladoresData';
import { audio } from '@/utils/audioEngine';
import { generateLabReport } from '@/utils/pdfGenerator';
import ScientificCalculator from '@/components/ScientificCalculator';
import { ALL_BRIEFING_CONFIGS } from '@/data/briefingConfigs';
import { ALL_TUTOR_STEPS } from '@/data/tutorSteps';
import LabQuiz from '@/components/LabQuiz';
import { getQuizForPractice } from '@/data/quizQuestions';
import { PILOTO_REGISTRY, BITACORA_REGISTRY } from '@/components/simulador/LabRegistry';
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
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showBriefing, setShowBriefing] = useState(true);
  const [mounted, setMounted] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [activateAnalysis, setActivateAnalysis] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const category = normalizedId.split('-')[0];
  const hubPath = `/alumno/laboratorio/${category}`;

  // Selectores de Zustand optimizados
  const pasoActual = useSimuladorStore(state => state.pasoActual);
  const setPasoActual = useSimuladorStore(state => state.setPasoActual);
  const resetPractica = useSimuladorStore(state => state.resetPractica);
  const setAsistente = useSimuladorStore(state => state.setAsistente);
  const setQuizQuestions = useSimuladorStore(state => state.setQuizQuestions);
  const syncStatus = useSimuladorStore(state => state.syncStatus);
  const showQuiz = useSimuladorStore(state => state.showQuiz);
  const quizQuestions = useSimuladorStore(state => state.quizQuestions);
  
  const resetM1 = useSimuladorStore(state => state.resetM1);
  const resetParticulas = useSimuladorStore(state => state.resetParticulas);

  // Selectores atómicos para labs específicos
  const targetZ = useSimuladorStore(state => state.particulas.targetZ);
  const targetA = useSimuladorStore(state => state.particulas.targetA);
  const targetCharge = useSimuladorStore(state => state.particulas.targetCharge);
  const pActual = useSimuladorStore(state => state.particulas.protones);
  const nActual = useSimuladorStore(state => state.particulas.neutrones);
  const eActual = useSimuladorStore(state => state.particulas.electrones);
  const isStable = useSimuladorStore(state => state.particulas.isStable);
  const particulas = useSimuladorStore(state => state.particulas);
  const cuadraticas = useSimuladorStore(state => state.cuadraticas);
  const sistemas2x2 = useSimuladorStore(state => state.sistemas2x2);
  const richter = useSimuladorStore(state => state.richter);
  
  // Selectores de Física (Diamond State)
  const tiroParabolico = useSimuladorStore(state => state.tiro1);
  const planoInclinado = useSimuladorStore(state => state.plano2);
  const pendulo = useSimuladorStore(state => state.pendulo3);
  const hooke = useSimuladorStore(state => state.hooke4);
  const prensa = useSimuladorStore(state => state.prensa5);
  const arquimedes = useSimuladorStore(state => state.arquimedes6);
  const dilatacion = useSimuladorStore(state => state.dilatacion7);
  const ohm = useSimuladorStore(state => state.ohm8);
  const electrostatica = useSimuladorStore(state => state.electrostatica9);
  const motor = useSimuladorStore(state => state.motor10);

  // Selectores de Química (Diamond State)
  const gases = useSimuladorStore(state => state.gases);
  const balanceo = useSimuladorStore(state => state.balanceo);
  const limitante = useSimuladorStore(state => state.limitante);
  const soluciones = useSimuladorStore(state => state.soluciones);
  const solubilidad = useSimuladorStore(state => state.solubilidad);
  const titulacion = useSimuladorStore(state => state.titulacion);
  const equilibrio = useSimuladorStore(state => state.equilibrio);
  const celda = useSimuladorStore(state => state.celda);
  const destilacion = useSimuladorStore(state => state.destilacion);

  // Reset briefing on lab change
  useEffect(() => {
    setShowBriefing(true);
    setPasoActual(1);
  }, [simuladorId, setPasoActual]);

  const list: Record<number, string> = { 1: "Hidrógeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono", 7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor", 10: "Neón" };
  const targetName = list[targetZ] || "Elemento";


  useEffect(() => {
    setMounted(true);

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

      if (normalizedId === 'quimica-3') {
        // Si el estado está corrupto (sin reacciones), forzar inicialización
        if (!state.balanceo || !state.balanceo.reacciones || state.balanceo.reacciones.length === 0) {
          state.setReaccion(0);
        }
      }
    }
  }, [mounted, normalizedId]);

  if (!mounted) return <div className="fixed inset-0 bg-[#0A1121] flex items-center justify-center z-[200]"><div className="w-16 h-16 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" /></div>;

  const data = MASTER_DATA[simuladorId as SimuladorId];
  
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
          ok = state.balanceo.isBalanced; 
          if (!ok) errorMsg = "La ecuación no está balanceada. Verifica los coeficientes estequiométricos.";
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
        case 'quimica-10': ok = state.destilacion.volDestilado >= 50; break;

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
        case 'matematicas-9': ok = state.validarM9(0.4); break;
        case 'matematicas-10': ok = state.validarM10(); break;

        // QUÍMICA
        case 'quimica-1': ok = state.validarQ1(); break;
        case 'quimica-2': ok = state.validarQ2(); break;
        case 'quimica-3': 
          ok = state.validarQ3(); 
          if (!ok) errorMsg = "Misión Incompleta. Debes balancear al menos 4 reacciones para certificar el protocolo.";
          break;
        case 'quimica-4': ok = state.validarP4(0, 0); break; // El modal maneja sus propios checks
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

        default: ok = true;
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

    return <Component {...specialProps} />;
  };

  const renderBitacora = () => {
    const Component = BITACORA_REGISTRY[normalizedId] || BitacoraDefault;
    return <Component onValidate={handleManualValidation} />;
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-['Outfit'] antialiased relative">
      <SyncManager />
      
      {/* ── MISSION BRIEFING ── */}
      <AnimatePresence>
        {showBriefing && ALL_BRIEFING_CONFIGS[normalizedId] && (
          <MissionBriefing 
            config={ALL_BRIEFING_CONFIGS[normalizedId]} 
            onStart={() => setShowBriefing(false)} 
          />
        )}
      </AnimatePresence>
      
      <motion.aside 
        animate={{ width: isSidebarOpen ? '30%' : '80px' }}
        className="bg-[#023047] text-white flex flex-col z-20 shadow-2xl overflow-hidden relative"
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
                <button onClick={() => setActiveTab('guia')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'guia' ? 'bg-[#219EBC] text-white' : 'bg-white/5 text-slate-400'}`}>Guía</button>
                <button onClick={() => setActiveTab('maestro')} className={`flex-1 py-3 rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === 'maestro' ? 'bg-[#FB8500] text-white' : 'bg-white/5 text-slate-400'}`}>Docente</button>
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
                      objetivos={normalizedId === 'quimica-1' ? [
                        { 
                          label: "Número Atómico (Z)", 
                          current: pActual, 
                          target: targetZ, 
                          completed: pActual === targetZ 
                        },
                        { 
                          label: "Masa Atómica (A)", 
                          current: pActual + nActual, 
                          target: targetA, 
                          completed: (pActual + nActual) === targetA 
                        },
                        { 
                          label: "Carga Neta", 
                          current: pActual - eActual, 
                          target: targetCharge, 
                          completed: (pActual - eActual) === targetCharge 
                        }
                      ] : normalizedId === 'quimica-2' ? [
                        { 
                          label: "Volumen Constante (L)", 
                          current: gases?.V || 0, 
                          target: 10, 
                          completed: Math.abs((gases?.V || 0) - 10) < 0.1 
                        },
                        { 
                          label: "Presión Objetivo (atm)", 
                          current: gases?.P || 0, 
                          target: 2.0, 
                          completed: Math.abs((gases?.P || 0) - 2.0) < 0.05 
                        },
                        { 
                          label: "Integridad de Cámara", 
                          current: gases?.P || 0, 
                          target: 7.0, 
                          completed: (gases?.P || 0) < 7.0 
                        }
                      ] : normalizedId === 'quimica-3' ? [
                        { 
                          label: "Equilibrio Atómico", 
                          current: balanceo?.isBalanced ? 1 : 0, 
                          target: 1, 
                          completed: balanceo?.isBalanced || false 
                        },
                        { 
                          label: "Ley de Lavoisier", 
                          current: balanceo?.masaReactivos || 0, 
                          target: balanceo?.masaProductos || 0, 
                          completed: Math.abs((balanceo?.masaReactivos || 0) - (balanceo?.masaProductos || 0)) < 0.01 
                        },
                        { 
                          label: "Nivel de Reactor", 
                          current: (balanceo?.reaccionActual || 0) + 1, 
                          target: balanceo?.reacciones?.length || 6, 
                          completed: false 
                        }
                      ] : normalizedId === 'quimica-4' ? [
                        { 
                          label: "Reactivo Limitante", 
                          current: limitante?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: limitante?.status === 'success' 
                        },
                        { 
                          label: "Cálculo de Exceso", 
                          current: limitante?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: limitante?.status === 'success' 
                        },
                        { 
                          label: "Fase de Síntesis", 
                          current: (limitante?.reaccionActual || 0) + 1, 
                          target: limitante?.reacciones?.length || 4, 
                          completed: false 
                        }
                      ] : normalizedId === 'quimica-5' ? [
                        { 
                          label: "Pesaje Analítico", 
                          current: soluciones?.matraz?.polvo || 0, 
                          target: soluciones?.mRequerida || 7.305, 
                          completed: Math.abs((soluciones?.matraz?.polvo || 0) - (soluciones?.mRequerida || 7.305)) < 0.05 
                        },
                        { 
                          label: "Exactitud de Aforo", 
                          current: soluciones?.matraz?.agua || 0, 
                          target: soluciones?.vTarget || 250, 
                          completed: Math.abs((soluciones?.matraz?.agua || 0) - (soluciones?.vTarget || 250)) < 1.0 
                        },
                        { 
                          label: "Certificación de M", 
                          current: soluciones?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: soluciones?.status === 'success' 
                        }
                      ] : normalizedId === 'quimica-6' ? [
                        { 
                          label: "Homogeneidad Térmica", 
                          current: solubilidad?.temp || 0, 
                          target: 50, 
                          completed: (solubilidad?.temp || 0) > 40 
                        },
                        { 
                          label: "Punto de Saturación", 
                          current: solubilidad?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: solubilidad?.status === 'success' 
                        },
                        { 
                          label: "Análisis de Fase", 
                          current: solubilidad?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: solubilidad?.status === 'success' 
                        }
                      ] : normalizedId === 'quimica-7' ? [
                        { 
                          label: "Calibración de Bureta", 
                          current: titulacion?.purgada ? 1 : 0, 
                          target: 1, 
                          completed: titulacion?.purgada 
                        },
                        { 
                          label: "Sensibilidad Visual", 
                          current: titulacion?.indicador ? 1 : 0, 
                          target: 1, 
                          completed: titulacion?.indicador 
                        },
                        { 
                          label: "Certificación de Ma", 
                          current: titulacion?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: titulacion?.status === 'success' 
                        }
                      ] : normalizedId === 'quimica-8' ? [
                        { 
                          label: "Perturbación Térmica", 
                          current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente') ? 1 : 0, 
                          target: 1, 
                          completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'caliente')
                        },
                        { 
                          label: "Análisis Criogénico", 
                          current: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo') ? 1 : 0, 
                          target: 1, 
                          completed: equilibrio?.jeringas?.some((j: any) => j.ubicacion === 'hielo')
                        },
                        { 
                          label: "Deducción de Le Châtelier", 
                          current: equilibrio?.status === 'success' ? 1 : 0, 
                          target: 1, 
                          completed: equilibrio?.status === 'success' 
                        }
                      ] : normalizedId === 'quimica-9' ? [
                        { 
                          label: "Cierre del Circuito", 
                          current: celda?.puenteSalino ? 1 : 0, 
                          target: 1, 
                          completed: celda?.puenteSalino 
                        },
                        { 
                          label: "Diferencia de Potencial", 
                          current: celda?.cablesConectados ? 1 : 0, 
                          target: 1, 
                          completed: celda?.cablesConectados 
                        },
                        { 
                          label: "Eficiencia Energética (V+)", 
                          current: celda?.voltaje > 0 ? 1 : 0, 
                          target: 1, 
                          completed: celda?.voltaje > 0 
                        }
                      ] : normalizedId === 'quimica-10' ? [
                        { 
                          label: "Estabilidad Térmica", 
                          current: destilacion?.tempMezcla > 75 ? 1 : 0, 
                          target: 1, 
                          completed: destilacion?.tempMezcla > 75 
                        },
                        { 
                          label: "Recuperación de Solvente", 
                          current: Math.min(50, Math.round(destilacion?.volDestilado || 0)), 
                          target: 50, 
                          completed: destilacion?.volDestilado >= 50 
                        },
                        { 
                          label: "Certificación de Pureza", 
                          current: destilacion?.volDestilado > 50 ? 1 : 0, 
                          target: 1, 
                          completed: destilacion?.volDestilado > 50 
                        }
                      ] : normalizedId === 'fisica-1' ? [
                        { 
                          label: "Estabilidad de Lanzamiento", 
                          current: tiroParabolico?.disparando || !!tiroParabolico?.resultado ? 1 : 0, 
                          target: 1, 
                          completed: tiroParabolico?.disparando || !!tiroParabolico?.resultado 
                        },
                        { 
                          label: "Precisión Balística", 
                          current: tiroParabolico?.resultado === 'exito' ? 1 : 0, 
                          target: 1, 
                          completed: tiroParabolico?.resultado === 'exito' 
                        },
                        { 
                          label: "Optimización de Alcance", 
                          current: tiroParabolico?.angulo === 45 ? 1 : 0, 
                          target: 1, 
                          completed: tiroParabolico?.angulo === 45 
                        }
                      ] : normalizedId === 'fisica-2' ? [
                        { 
                          label: "Configuración del Plano", 
                          current: planoInclinado?.angulo > 0 ? 1 : 0, 
                          target: 1, 
                          completed: planoInclinado?.angulo > 0 
                        },
                        { 
                          label: "Análisis de Rozamiento", 
                          current: (planoInclinado?.coefRozamiento || 0) > 0 ? 1 : 0, 
                          target: 1, 
                          completed: (planoInclinado?.coefRozamiento || 0) > 0 
                        },
                        { 
                          label: "Certificación Dinámica", 
                          current: planoInclinado?.resultado === 'exito' ? 1 : 0, 
                          target: 1, 
                          completed: planoInclinado?.resultado === 'exito' 
                        }
                      ] : normalizedId === 'fisica-3' ? [
                        { 
                          label: "Configuración de Longitud", 
                          current: pendulo?.longitud > 0 ? 1 : 0, 
                          target: 1, 
                          completed: pendulo?.longitud > 0 
                        },
                        { 
                          label: "Sincronización de MAS", 
                          current: pendulo?.oscilando ? 1 : 0, 
                          target: 1, 
                          completed: pendulo?.oscilando 
                        },
                        { 
                          label: "Certificación Gravimétrica", 
                          current: pendulo?.resultado === 'exito' ? 1 : 0, 
                          target: 1, 
                          completed: pendulo?.resultado === 'exito' 
                        }
                      ] : normalizedId === 'fisica-4' ? [
                        { 
                          label: "Prueba de Carga Estática", 
                          current: hooke?.masa > 0 ? 1 : 0, 
                          target: 1, 
                          completed: hooke?.masa > 0 
                        },
                        { 
                          label: "Análisis de Compresión", 
                          current: (hooke?.estiramiento || 0) !== 0 ? 1 : 0, 
                          target: 1, 
                          completed: (hooke?.estiramiento || 0) !== 0 
                        },
                        { 
                          label: "Certificación de Rigidez", 
                          current: hooke?.resultado === 'exito' ? 1 : 0, 
                          target: 1, 
                          completed: hooke?.resultado === 'exito' 
                        }
                      ] : []}
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
                        <span className="text-[8px] font-black text-[#219EBC] uppercase tracking-widest block mb-3">Config. Electrónica (n, l)</span>
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
      </motion.aside>

      <main className="flex-1 flex flex-col relative bg-[#F8FAFC]">
        <header className="h-20 bg-white border-b border-slate-100 flex items-center justify-between px-8 z-20">
            <div className="flex items-center gap-6">
               <div className="flex flex-col">
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
               <div className="h-8 w-px bg-slate-100" />
               <LabTimer />
            </div>
           
           <div className="flex items-center gap-3">
              <button 
                onClick={handleManualValidation}
                disabled={isValidating}
                className={`h-12 px-8 rounded-2xl flex items-center gap-3 font-black text-[10px] uppercase tracking-widest transition-all ${isValidating ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-[#023047] text-white hover:bg-emerald-600 shadow-lg shadow-[#023047]/20 shadow-xl'}`}
              >
                {isValidating ? (
                  <div className="w-4 h-4 border-2 border-slate-300 border-t-transparent rounded-full animate-spin" />
                ) : <ShieldCheck size={18} />}
                {isValidating ? 'Validando...' : 'Validar Práctica'}
              </button>
              
              <div className="w-px h-8 bg-slate-100 mx-2" />

              <button onClick={() => { setActivateAnalysis(true); setShowTools(true); }} className="w-12 h-12 rounded-2xl bg-indigo-50 text-indigo-600 flex items-center justify-center hover:bg-indigo-600 hover:text-white transition-all">
                <TrendingUp size={20} />
              </button>
              <button onClick={() => setShowTools(true)} className="px-6 py-3 bg-white border border-slate-200 text-[#023047] rounded-2xl text-[10px] font-black uppercase tracking-widest hover:border-[#219EBC] transition-all flex items-center gap-2">
                <Microscope size={16} /> Herramientas
              </button>
              <button onClick={() => setShowExitModal(true)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-slate-400 flex items-center justify-center hover:text-red-500 hover:border-red-500 transition-all">
                <Power size={20} />
              </button>
           </div>
        </header>

        <div className="flex-1 flex overflow-hidden relative">
           <div className={`flex-1 relative shadow-inner overflow-hidden ${
             normalizedId.startsWith('matematicas') ? 'bg-[#0A1121]' : 
             normalizedId === 'quimica-1' ? 'bg-[#020205]' : 
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
             {!showBriefing && renderPiloto()}
           </div>
           
           <div className="w-[400px] bg-white border-l border-slate-100 flex flex-col">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 font-black text-[10px] text-slate-400 uppercase tracking-widest flex items-center gap-2">
                 <FileText size={12} /> Bitácora de Observaciones
              </div>
              <div className="flex-1 overflow-y-auto p-6">
                 {renderBitacora()}
              </div>
           </div>
        </div>

        <AnimatePresence>
          {showQuiz && (
            <LabQuiz
              id={normalizedId}
              questions={quizQuestions}
              onComplete={(score) => {
                setShowQuiz(false);
                setShowSuccess(true);
                audio.playSuccess();
              }}
              onCancel={() => setShowQuiz(false)}
            />
          )}
          {showSuccess && (() => {
            if (normalizedId === 'biologia-2') {
              const { volumen, concExt, tipoCelula } = useSimuladorStore.getState().transporte;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-cyan-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-cyan-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" fill="currentColor" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación de Homeostasis</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Equilibrio Logrado!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 grid grid-cols-2 gap-8 text-left mb-8">
                       <div>
                          <span className="text-[9px] font-black text-cyan-400 uppercase block mb-1">Volumen Final</span>
                          <span className="text-3xl font-black font-mono">{volumen.toFixed(1)}%</span>
                       </div>
                       <div>
                          <span className="text-[9px] font-black text-cyan-400 uppercase block mb-1">Solución Medio</span>
                          <span className="text-3xl font-black font-mono">{concExt.toFixed(2)} M</span>
                       </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-10 px-6">Has estabilizado con éxito la muestra de {tipoCelula === 'animal' ? 'eritrocitos' : 'células vegetales'}. La presión osmótica se ha equilibrado evitando el colapso celular.</p>
                    <div className="flex gap-4">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Seguir Experimentando</button>
                      <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all">Finalizar Misión</button>
                    </div>
                  </motion.div>
                </div>
              );
            }

            if (normalizedId === 'quimica-1') {
              const { estrellas = 3, targetZ: tz, targetA: ta, targetCharge: tc = 0, electrones } = particulas;
              const tName = list[tz] ?? 'Elemento';
              const configParts: string[] = [];
              const sup: Record<number,string> = {1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
              let rem = electrones;
              for (const [lbl, cap] of [['1s',2],['2s',2],['2p',6]] as [string,number][]) {
                if (rem <= 0) break;
                const c = Math.min(rem, cap);
                configParts.push(`${lbl}${sup[c] ?? c}`);
                rem -= c;
              }
              const bindingTotal = tz > 0 && ta > 0
                ? (15.753 * ta - 17.804 * Math.pow(ta, 2/3) - 0.7103 * tz * (tz-1) / Math.pow(ta, 1/3) - 23.69 * Math.pow(ta - 2*tz,2) / ta).toFixed(1)
                : '0';
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#023047] to-[#0a1a2e] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-emerald-500/30 overflow-hidden relative"
                  >
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className={s <= estrellas ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/10'} fill={s <= estrellas ? 'currentColor' : 'none'} />
                        </motion.div>
                      ))}
                    </div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Isótopo Forjado!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
                       <div><span className="text-[8px] font-black text-[#219EBC] block">Elemento</span><span className="text-2xl font-black">{tName}</span></div>
                       <div><span className="text-[8px] font-black text-[#219EBC] block">Energía de Enlace</span><span className="text-2xl font-black">{bindingTotal} MeV</span></div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/10 text-white font-black text-[10px] uppercase rounded-[1.5rem]">Seguir</button>
                      <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-[1.5rem]">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }

            if (normalizedId === 'matematicas-1') {
              const state = useSimuladorStore.getState();
              const { estrellas = 3, a, b, c } = state.cuadraticas;
              const delta = b*b - 4*a*c;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0d1117]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#0d1117] to-[#161b22] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-rose-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-rose-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className={s <= estrellas ? 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]' : 'text-white/10'} fill={s <= estrellas ? 'currentColor' : 'none'} />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-2">Certificación Algebraica</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8">¡Trayectoria Sincronizada!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
                      <div>
                        <span className="text-[8px] font-black text-rose-400 uppercase block mb-1">Modelo Final</span>
                        <span className="text-xl font-black font-mono">f(x) = {a}x² {b>=0?'+':''}{b}x {c>=0?'+':''}{c}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-rose-400 uppercase block mb-1">Determinante</span>
                        <span className="text-xl font-black font-mono">Δ = {delta.toFixed(2)}</span>
                      </div>
                      <div className="col-span-2">
                         <span className="text-[8px] font-black text-rose-400 uppercase block mb-1">Logro Desbloqueado</span>
                         <span className="text-sm font-bold text-slate-300">Maestro de Parábolas: Análisis de Cuadráticas Nivel Licenciatura</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all">Seguir</button>
                      <button onClick={() => { resetM1(); router.push(hubPath); }} className="flex-1 py-5 bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-rose-500/20 transition-all">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }

            if (normalizedId === 'biologia-1') {
              const state = useSimuladorStore.getState();
              const { muestra, objetivoMag } = state.microscopio;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-emerald-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Microscopía Virtual</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">¡Micrografía Asegurada!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
                      <div>
                        <span className="text-[8px] font-black text-emerald-400/80 uppercase block mb-1">Muestra Analizada</span>
                        <span className="text-xl font-black uppercase">{muestra}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-emerald-400/80 uppercase block mb-1">Ampliación Final</span>
                        <span className="text-xl font-black font-mono">{objetivoMag * 10}x</span>
                      </div>
                      <div className="col-span-2">
                         <span className="text-[8px] font-black text-emerald-400/80 uppercase block mb-1">Logro Científico</span>
                         <span className="text-sm font-bold text-slate-300">Resolución de Abbe Optimizada. Telemetría Aceptada.</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir Observando</button>
                      <button onClick={() => { state.resetB1(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            if (normalizedId === 'quimica-5') {
              const state = useSimuladorStore.getState();
              const { mTarget, matraz, sal } = state.soluciones;
              const currentMolarity = sal ? (matraz.polvo / sal.pm) / (matraz.agua / 1000) : 0;
              const accuracy = mTarget > 0 ? Math.max(0, 100 - Math.abs((currentMolarity - mTarget) / mTarget) * 100) : 0;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#030712]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#030712] to-[#0f172a] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-cyan-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-cyan-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación Química Analítica</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">¡Solución Certificada!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
                      <div>
                        <span className="text-[8px] font-black text-cyan-400/80 uppercase block mb-1">Concentración Final</span>
                        <span className="text-xl font-black font-mono">{currentMolarity.toFixed(3)} M</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-cyan-400/80 uppercase block mb-1">Precisión Analítica</span>
                        <span className="text-xl font-black font-mono">{accuracy.toFixed(1)}%</span>
                      </div>
                      <div className="col-span-2">
                         <span className="text-[8px] font-black text-cyan-400/80 uppercase block mb-1">Muestra Preparada</span>
                         <span className="text-sm font-bold text-slate-300">{sal?.nombre} ({sal?.formula}) @ {mTarget}M</span>
                      </div>
                    </div>
                    <div className="flex gap-3">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir Experimentando</button>
                      <button onClick={() => { state.resetP5(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-cyan-500/20 transition-all">Finalizar Práctica</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            if (normalizedId === 'matematicas-4') {
              const state = useSimuladorStore.getState();
              const { catetoA, catetoB } = state.pitagoras;
              const hipotenusa = Math.sqrt(catetoA**2 + catetoB**2);
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-emerald-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-emerald-400 drop-shadow-[0_0_12px_rgba(16,185,129,0.5)]" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Certificación en Geometría</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Teorema Validado!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8 relative z-10">
                      <div>
                        <span className="text-[8px] font-black text-emerald-400/80 uppercase block mb-1">Terna Pitagórica</span>
                        <span className="text-xl font-black">{catetoA}² + {catetoB}² = {Math.round(hipotenusa**2)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-emerald-400/80 uppercase block mb-1">Hipotenusa (c)</span>
                        <span className="text-xl font-black font-mono">{hipotenusa.toFixed(2)}</span>
                      </div>
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir</button>
                      <button onClick={() => { state.resetM4(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            if (normalizedId === 'matematicas-5') {
              const state = useSimuladorStore.getState();
              const { angulo } = state.trigonometria;
              const rad = (angulo * Math.PI) / 180;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }}
                    animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#020617] to-[#0a1a2e] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-cyan-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-cyan-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-cyan-400 drop-shadow-[0_0_12px_rgba(34,211,238,0.5)]" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación Trigonométrica</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Fase Sincronizada!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8 relative z-10 font-mono">
                      <div>
                        <span className="text-[8px] font-black text-cyan-400/80 uppercase block mb-1">Seno (θ)</span>
                        <span className="text-xl font-black">{Math.sin(rad).toFixed(4)}</span>
                      </div>
                      <div>
                        <span className="text-[8px] font-black text-cyan-400/80 uppercase block mb-1">Coseno (θ)</span>
                        <span className="text-xl font-black">{Math.cos(rad).toFixed(4)}</span>
                      </div>
                      <div className="col-span-2 text-center pt-2 border-t border-white/5">
                         <span className="text-[8px] font-black text-slate-500 uppercase block mb-1">Punto de Cruce Armónico</span>
                         <span className="text-xs font-bold text-cyan-200">θ = {angulo}° ({rad.toFixed(3)} rad)</span>
                      </div>
                    </div>
                    <div className="flex gap-3 relative z-10">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir</button>
                      <button onClick={() => { state.resetM5(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-cyan-500/20 transition-all">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            if (normalizedId === 'biologia-3') {
              const state = useSimuladorStore.getState();
              const { proteina, errores } = state.sintesis;
              return (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                  <motion.div
                    initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                    className="bg-gradient-to-br from-[#020617] to-[#1e1b4b] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-purple-500/30 overflow-hidden relative"
                  >
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-purple-500/10 blur-[80px] rounded-full" />
                    <div className="flex justify-center gap-4 mb-6">
                      {[1,2,3].map(s => (
                        <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                          <Award size={40} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" fill="currentColor" />
                        </motion.div>
                      ))}
                    </div>
                    <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-2">Certificación en Bio-Sintética</div>
                    <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Proteína Ensamblada!</h3>
                    <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 grid grid-cols-2 gap-8 text-left mb-8">
                       <div>
                          <span className="text-[9px] font-black text-purple-400 uppercase block mb-1">Longitud Peptídica</span>
                          <span className="text-3xl font-black font-mono">{proteina.length} AA</span>
                       </div>
                       <div>
                          <span className="text-[9px] font-black text-purple-400 uppercase block mb-1">Precisión Genética</span>
                          <span className="text-3xl font-black font-mono">{Math.max(0, 100 - errores * 5)}%</span>
                       </div>
                    </div>
                    <p className="text-sm text-slate-400 mb-10 px-6">Has completado la traducción del ARNm con éxito. La cadena polipeptídica resultante es estable y funcional.</p>
                    <div className="flex gap-4">
                      <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Seguir Analizando</button>
                      <button onClick={() => { state.resetB3(); router.push(hubPath); }} className="flex-1 py-5 bg-purple-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all">Finalizar Misión</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            
            // MODAL POR DEFECTO PARA EL RESTO DE LAS 40 PRÁCTICAS
            return (
              <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
                <motion.div
                  initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }}
                  className="bg-gradient-to-br from-[#020617] to-[#0f172a] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-emerald-500/30 overflow-hidden relative"
                >
                  <div className="absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 bg-emerald-500/10 blur-[80px] rounded-full" />
                  <div className="flex justify-center gap-4 mb-6">
                    {[1,2,3].map(s => (
                      <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
                        <Award size={40} className="text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]" fill="currentColor" />
                      </motion.div>
                    ))}
                  </div>
                  <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Certificación de Competencia</div>
                  <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Misión Completada!</h3>
                  <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-8">
                     <span className="text-[9px] font-black text-emerald-400 uppercase block mb-1">Laboratorio</span>
                     <span className="text-2xl font-black uppercase tracking-tight">{data.titulo}</span>
                  </div>
                  <p className="text-sm text-slate-400 mb-10 px-6">Has validado con éxito todos los parámetros técnicos de la práctica. Los resultados han sido registrados en tu expediente académico.</p>
                  <div className="flex gap-4">
                    <button onClick={() => setShowSuccess(false)} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Revisar Bitácora</button>
                    <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all">Finalizar y Salir</button>
                  </div>
                </motion.div>
              </div>
            );
          })()}

          {showExitModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#023047]/60 backdrop-blur-md">
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
            <div className="fixed inset-0 z-[400] flex items-center justify-center bg-[#023047]/80 backdrop-blur-xl p-8">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-5xl h-[85vh] shadow-2xl flex flex-col overflow-hidden">
                  <div className="p-10 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <Microscope size={32} className="text-[#219EBC]" />
                        <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter">Toolkit Avanzado</h3>
                      </div>
                      <button onClick={() => setShowTools(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400 hover:text-red-500 transition-colors"><X size={24}/></button>
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

          {showBriefing && (
            <MissionBriefing 
              config={ALL_BRIEFING_CONFIGS[normalizedId] || ALL_BRIEFING_CONFIGS['quimica-1']}
              onStart={() => setShowBriefing(false)}
            />
          )}
        </AnimatePresence>
      </main>
    </div>
  );
}
