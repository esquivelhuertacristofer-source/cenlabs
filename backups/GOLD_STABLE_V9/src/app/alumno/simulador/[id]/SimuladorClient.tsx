"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Settings, HelpCircle, FileText, Beaker, 
  ChevronRight, Play, CheckCircle2, AlertCircle, 
  RotateCcw, Save, Share2, Info, ChevronDown, 
  Layout, BookOpen, Microscope, Zap, Award,
  ArrowLeft, Timer, Target, BarChart3, GraduationCap, Lightbulb, X, FlaskConical, Thermometer, Dna, TrendingUp, Calculator, Hammer, ShieldCheck, Volume2, Globe, Download
} from 'lucide-react';

import ErrorBoundary from '@/components/ErrorBoundary';

// Centralización de Datos y Tipos
import { MASTER_DATA, SimuladorId } from '@/data/simuladoresData';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { generateLabReport } from '@/utils/pdfGenerator';
import ScientificCalculator from '@/components/ScientificCalculator';

// Loader unificado para componentes dinámicos
const Loader = () => (
  <div className="flex h-full w-full items-center justify-center bg-slate-50/50 animate-pulse">
    <div className="flex flex-col items-center gap-4">
      <div className="w-12 h-12 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" />
      <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Cargando Módulo...</span>
    </div>
  </div>
);

// --- Componentes de Simulación Dinámicos (70%) ---
const PilotoConstruccionAtomica = dynamic(() => import('@/components/PilotoConstruccionAtomica'), { loading: Loader });
const PilotoLeyesGases = dynamic(() => import('@/components/PilotoLeyesGases'), { loading: Loader });
const PilotoBalanceoEcuaciones = dynamic(() => import('@/components/PilotoBalanceoEcuaciones'), { loading: Loader });
const PilotoReactivoLimitante = dynamic(() => import('@/components/PilotoReactivoLimitante'), { loading: Loader });
const PilotoPreparacionSoluciones = dynamic(() => import('@/components/PilotoPreparacionSoluciones'), { loading: Loader });
const PilotoSolubilidadCristalizacion = dynamic(() => import('@/components/PilotoSolubilidadCristalizacion'), { loading: Loader });
const PilotoTitulacionAcidoBase = dynamic(() => import('@/components/PilotoTitulacionAcidoBase'), { loading: Loader });
const PilotoEquilibrioQuimico = dynamic(() => import('@/components/PilotoEquilibrioQuimico'), { loading: Loader });
const PilotoCeldasGalvanicas = dynamic(() => import('@/components/PilotoCeldasGalvanicas'), { loading: Loader });
const PilotoDestilacionFraccionada = dynamic(() => import('@/components/PilotoDestilacionFraccionada'), { loading: Loader });
const PilotoTiroParabolico = dynamic(() => import('@/components/PilotoTiroParabolico'), { loading: Loader });
const PilotoPlanoInclinado = dynamic(() => import('@/components/PilotoPlanoInclinado'), { loading: Loader });
const PilotoPenduloSimple = dynamic(() => import('@/components/PilotoPenduloSimple'), { loading: Loader });
const PilotoLeyHooke = dynamic(() => import('@/components/PilotoLeyHooke'), { loading: Loader });
const PilotoColisiones1D = dynamic(() => import('@/components/PilotoColisiones1D'), { loading: Loader });
const PilotoArquimedes = dynamic(() => import('@/components/PilotoArquimedes'), { loading: Loader });
const PilotoDilatacionTermica = dynamic(() => import('@/components/PilotoDilatacionTermica'), { loading: Loader });
const PilotoLeyOhm = dynamic(() => import('@/components/PilotoLeyOhm'), { loading: Loader });
const PilotoElectrostatica = dynamic(() => import('@/components/PilotoElectrostatica'), { loading: Loader });
const PilotoMotorElectrico = dynamic(() => import('@/components/PilotoMotorElectrico'), { loading: Loader });
const PilotoCuadraticas = dynamic(() => import('@/components/PilotoCuadraticas'), { loading: Loader });
const PilotoSistemas2x2 = dynamic(() => import('@/components/PilotoSistemas2x2'), { loading: Loader });
const PilotoRichter = dynamic(() => import('@/components/PilotoRichter'), { loading: Loader });
const PilotoPitagoras = dynamic(() => import('@/components/PilotoPitagoras'), { loading: Loader });
const PilotoTrigonometria = dynamic(() => import('@/components/PilotoTrigonometria'), { loading: Loader });
const PilotoTransformaciones = dynamic(() => import('@/components/PilotoTransformaciones'), { loading: Loader });
const PilotoSnell = dynamic(() => import('@/components/PilotoSnell'), { loading: Loader });
const PilotoDerivadas = dynamic(() => import('@/components/PilotoDerivadas'), { loading: Loader });
const PilotoRiemann = dynamic(() => import('@/components/PilotoRiemann'), { loading: Loader });
const PilotoGalton = dynamic(() => import('@/components/PilotoGalton'), { loading: Loader });

// --- Componentes de Bitácora Dinámicos (30%) ---
const BitacoraDefault = dynamic(() => import('@/components/bitacoras/BitacoraDefault'), { loading: Loader });
const BitacoraPrecipitado = dynamic(() => import('@/components/bitacoras/BitacoraSolubilidadCristalizacion'), { loading: Loader });
const BitacoraTitulacion = dynamic(() => import('@/components/bitacoras/BitacoraTitulacionAcidoBase'), { loading: Loader });
const BitacoraEquilibrio = dynamic(() => import('@/components/bitacoras/BitacoraEquilibrioQuimico'), { loading: Loader });
const BitacoraReactivoLimitante = dynamic(() => import('@/components/bitacoras/BitacoraReactivoLimitante'), { loading: Loader });
const BitacoraPreparacionSoluciones = dynamic(() => import('@/components/bitacoras/BitacoraPreparacionSoluciones'), { loading: Loader });
const BitacoraCeldasGalvanicas = dynamic(() => import('@/components/bitacoras/BitacoraCeldasGalvanicas'), { loading: Loader });
const BitacoraDestilacion = dynamic(() => import('@/components/bitacoras/BitacoraDestilacion'), { loading: Loader });
const BitacoraConstruccionAtomica = dynamic(() => import('@/components/bitacoras/BitacoraConstruccionAtomica'), { loading: Loader });
const BitacoraLeyesGases = dynamic(() => import('@/components/bitacoras/BitacoraLeyesGases'), { loading: Loader });
const BitacoraBalanceoEcuaciones = dynamic(() => import('@/components/bitacoras/BitacoraBalanceoEcuaciones'), { loading: Loader });
const BitacoraTiroParabolico = dynamic(() => import('@/components/bitacoras/BitacoraTiroParabolico'), { loading: Loader });
const BitacoraPlanoInclinado = dynamic(() => import('@/components/bitacoras/BitacoraPlanoInclinado'), { loading: Loader });
const BitacoraPenduloSimple = dynamic(() => import('@/components/bitacoras/BitacoraPenduloSimple'), { loading: Loader });
const BitacoraLeyHooke = dynamic(() => import('@/components/bitacoras/BitacoraLeyHooke'), { loading: Loader });
const BitacoraColisiones1D = dynamic(() => import('@/components/bitacoras/BitacoraColisiones1D'), { loading: Loader });
const BitacoraArquimedes = dynamic(() => import('@/components/bitacoras/BitacoraArquimedes'), { loading: Loader });
const BitacoraDilatacionTermica = dynamic(() => import('@/components/bitacoras/BitacoraDilatacionTermica'), { loading: Loader });
const BitacoraLeyOhm = dynamic(() => import('@/components/bitacoras/BitacoraLeyOhm'), { loading: Loader });
const BitacoraElectrostatica = dynamic(() => import('@/components/bitacoras/BitacoraElectrostatica'), { loading: Loader });
const BitacoraMotorElectrico = dynamic(() => import('@/components/bitacoras/BitacoraMotorElectrico'), { loading: Loader });
const BitacoraCuadraticas = dynamic(() => import('@/components/bitacoras/BitacoraCuadraticas'), { loading: Loader });
const BitacoraSistemas2x2 = dynamic(() => import('@/components/bitacoras/BitacoraSistemas2x2'), { loading: Loader });
const BitacoraRichter = dynamic(() => import('@/components/bitacoras/BitacoraRichter'), { loading: Loader });
const BitacoraPitagoras = dynamic(() => import('@/components/bitacoras/BitacoraPitagoras'), { loading: Loader });
const BitacoraTrigonometria = dynamic(() => import('@/components/bitacoras/BitacoraTrigonometria'), { loading: Loader });
const BitacoraTransformaciones = dynamic(() => import('@/components/bitacoras/BitacoraTransformaciones'), { loading: Loader });
const BitacoraSnell = dynamic(() => import('@/components/bitacoras/BitacoraSnell'), { loading: Loader });
const BitacoraDerivadas = dynamic(() => import('@/components/bitacoras/BitacoraDerivadas'), { loading: Loader });
const BitacoraRiemann = dynamic(() => import('@/components/bitacoras/BitacoraRiemann'), { loading: Loader });
const BitacoraGalton = dynamic(() => import('@/components/bitacoras/BitacoraGalton'), { loading: Loader });

// --- BIOLOGÍA Dinámicos ---
const PilotoMicroscopioVirtual = dynamic(() => import('@/components/PilotoMicroscopioVirtual'), { loading: Loader });
const BitacoraMicroscopio = dynamic(() => import('@/components/bitacoras/BitacoraMicroscopio'), { loading: Loader });
const PilotoTransporteCelular = dynamic(() => import('@/components/PilotoTransporteCelular'), { loading: Loader });
const BitacoraTransporte = dynamic(() => import('@/components/bitacoras/BitacoraTransporte'), { loading: Loader });
const PilotoSintesisProteinas = dynamic(() => import('@/components/PilotoSintesisProteinas'), { loading: Loader });
const BitacoraSintesis = dynamic(() => import('@/components/bitacoras/BitacoraSintesis'), { loading: Loader });
const PilotoFotosintesis = dynamic(() => import('@/components/PilotoFotosintesis'), { loading: Loader });
const BitacoraFotosintesis = dynamic(() => import('@/components/bitacoras/BitacoraFotosintesis'), { loading: Loader });
const PilotoGenetica = dynamic(() => import('@/components/PilotoGenetica'), { loading: Loader });
const BitacoraGenetica = dynamic(() => import('@/components/bitacoras/BitacoraGenetica'), { loading: Loader });
const PilotoSeleccionNatural = dynamic(() => import('@/components/PilotoSeleccionNatural'), { loading: Loader });
const BitacoraSeleccion = dynamic(() => import('@/components/bitacoras/BitacoraSeleccion'), { loading: Loader });
const PilotoSistemaNervioso = dynamic(() => import('@/components/PilotoSistemaNervioso'), { loading: Loader });
const BitacoraSistemaNervioso = dynamic(() => import('@/components/bitacoras/BitacoraSistemaNervioso'), { loading: Loader });
const PilotoElectrocardiograma = dynamic(() => import('@/components/PilotoElectrocardiograma'), { loading: Loader });
const BitacoraElectrocardiograma = dynamic(() => import('@/components/bitacoras/BitacoraElectrocardiograma'), { loading: Loader });
const PilotoSistemaDigestivo = dynamic(() => import('@/components/PilotoSistemaDigestivo'), { loading: Loader });
const BitacoraSistemaDigestivo = dynamic(() => import('@/components/bitacoras/BitacoraSistemaDigestivo'), { loading: Loader });
const PilotoPoblaciones = dynamic(() => import('@/components/PilotoPoblaciones'), { loading: Loader });
const BitacoraPoblaciones = dynamic(() => import('@/components/bitacoras/BitacoraPoblaciones'), { loading: Loader });


export default function SimuladorClient({ simuladorId }: { simuladorId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  
  // Normalización de ID robusta
  const normalizedId = (
    simuladorId.startsWith('fisica-') ? simuladorId :
    simuladorId.replace('q', '') === 'quimica-10' ? 'quimica-10' :
    simuladorId.replace('q', '') === 'quimica-9' ? 'quimica-9' :
    simuladorId.replace('q', '') === 'quimica-8' ? 'quimica-8' :
    simuladorId.replace('q', '') === 'quimica-7' ? 'quimica-7' :
    simuladorId.replace('q', '') === 'quimica-6' ? 'quimica-6' :
    simuladorId.replace('q', '') === 'quimica-5' ? 'quimica-5' :
    simuladorId.replace('q', '') === 'quimica-4' ? 'quimica-4' :
    simuladorId.replace('q', '') === 'quimica-2' ? 'quimica-2' :
    simuladorId.replace('q', '') === 'quimica-3' ? 'quimica-3' : simuladorId
  ) as SimuladorId;

  const data = MASTER_DATA[normalizedId] || MASTER_DATA["quimica-1"];

  const { 
    timer, pasoActual, tick, isRunning, 
    titulacion, resetP7, 
    solubilidad, resetP6,
    equilibrio, resetP8,
    celda, resetP9, generarSemillaP9,
    destilacion, resetP10,
    cuadraticas, resetM1, generarSemillaM1,
    sistemas2x2, resetM2, generarSemillaM2,
    richter, resetM3, generarSemillaM3,
    pitagoras, resetM4,
    trigonometria, resetM5,
    geometria6, resetM6, generarSemillaM6,
    optica7, resetM7, generarSemillaM7,
    derivada8, resetM8,
    integral9, resetM9,
    galton10, resetM10,
    microscopio, resetB1, generarSemillaB1,
    transporte, resetB2, generarSemillaB2, tickTransporte,
    sintesis, resetB3, generarSemillaB3,
    fotosintesis, resetB4, generarSemillaB4, tickFotosintesis,
    genetica, resetB5,
    evolucion, resetB6, tickEvolucion,
    sistemaNervioso, resetB7,
    cardio, resetB8, generarSemillaB8,
    digestion, resetB9, generarSemillaB9,
    ecosistema, resetB10, generarSemillaB10,
    updateScore,
    setBitacora,
    bitacoraData,
    score,
    language,
    setLanguage
  } = useSimuladorStore();

  const [activeTab, setActiveTab] = useState<'guia' | 'maestro' | 'conceptos' | 'bitacora' | 'herramientas'>('guia');
  const [showCalc, setShowCalc] = useState(false);
  const [activateAnalysis, setActivateAnalysis] = useState(false);
  
  useEffect(() => {
    // Iniciar ambiente sonoro con desbloqueo por gesto
    const unlockAudio = () => {
      audio.startAmbient();
      document.removeEventListener('click', unlockAudio);
    };
    document.addEventListener('click', unlockAudio);
    
    return () => {
      audio.stopAmbient();
      document.removeEventListener('click', unlockAudio);
    };
  }, []);

  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.hidden) {
        console.warn('¡ALERTA!: El alumno ha salido de la pestaña del simulador.');
      }
    };
    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, []);

  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showExitModal, setShowExitModal] = useState(false);
  const [showTools, setShowTools] = useState(false);
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    const checkMobile = () => {
      const mobile = window.innerWidth < 768;
      setIsMobile(mobile);
      if (mobile) setIsSidebarOpen(false);
      else setIsSidebarOpen(true);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    setMounted(true);
    if (normalizedId === 'quimica-9' && (!celda.seedMetales || celda.seedMetales.length === 0)) {
      generarSemillaP9();
    }
    if (normalizedId === 'matematicas-1' && cuadraticas.target.a === 2) {
      generarSemillaM1();
    }
    if (normalizedId === 'matematicas-2' && sistemas2x2.target.x === 5) {
      generarSemillaM2();
    }
    if (normalizedId === 'matematicas-3' && richter.targetM === 8.0) {
      generarSemillaM3();
    }
    if (normalizedId === 'matematicas-6' && geometria6.target.tx === 5) {
      generarSemillaM6();
    }
    if (normalizedId === 'matematicas-7' && optica7.n2Misterio === 1.5) {
      generarSemillaM7();
    }
    if (normalizedId === 'biologia-1' && !microscopio.objetivo) {
      generarSemillaB1();
    }
    if (normalizedId === 'biologia-2' && !transporte.history.length) {
      generarSemillaB2();
    }
    if (normalizedId === 'biologia-3' && !sintesis.adnPlantilla) {
      generarSemillaB3();
    }
    if (normalizedId === 'biologia-5') {
       resetB5();
    }
    if (normalizedId === 'biologia-8' && cardio.status === 'idle') {
      generarSemillaB8();
    }
    if (normalizedId === 'biologia-9' && digestion.status === 'idle') {
      generarSemillaB9();
    }
    if (normalizedId === 'biologia-10' && ecosistema.status === 'idle') {
      generarSemillaB10();
    }
    const interval = setInterval(() => { 
      if (isRunning) {
        tick(); 
        if (normalizedId === 'biologia-2') tickTransporte(1);
        if (normalizedId === 'biologia-4') tickFotosintesis(1);
        if (normalizedId === 'biologia-6') tickEvolucion(1);
      }
    }, 1000);
    return () => clearInterval(interval);
  }, [isRunning, tick]);

  const formatTime = (s: number) => {
    const min = Math.floor(s / 60);
    const sec = s % 60;
    return `${min}:${sec < 10 ? '0' : ''}${sec}`;
  };

  const renderSimulator = () => {
    switch (normalizedId) {
      case 'quimica-10': return <PilotoDestilacionFraccionada isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-9': return <PilotoCeldasGalvanicas isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-8': return <PilotoEquilibrioQuimico isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-7': return <PilotoTitulacionAcidoBase isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-6': return <PilotoSolubilidadCristalizacion isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-5': return <PilotoPreparacionSoluciones isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-4': return <PilotoReactivoLimitante isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-2': return <PilotoLeyesGases isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'quimica-3': return <PilotoBalanceoEcuaciones isWorktableDark={true} isProfesor={activeTab === 'maestro'} />;
      case 'fisica-1': return <PilotoTiroParabolico />;
      case 'fisica-2': return <PilotoPlanoInclinado />;
      case 'fisica-3': return <PilotoPenduloSimple />;
      case 'fisica-4': return <PilotoLeyHooke />;
      case 'fisica-5': return <PilotoColisiones1D />;
      case 'fisica-6': return <PilotoArquimedes />;
      case 'fisica-7': return <PilotoDilatacionTermica />;
      case 'fisica-8': return <PilotoLeyOhm />;
      case 'fisica-9': return <PilotoElectrostatica />;
      case 'fisica-10': return <PilotoMotorElectrico />;
      case 'matematicas-1': return <PilotoCuadraticas />;
      case 'matematicas-2': return <PilotoSistemas2x2 />;
      case 'matematicas-3': return <PilotoRichter />;
      case 'matematicas-4': return <PilotoPitagoras />;
      case 'matematicas-5': return <PilotoTrigonometria />;
      case 'matematicas-6': return <PilotoTransformaciones />;
      case 'matematicas-7': return <PilotoSnell />;
      case 'matematicas-8': return <PilotoDerivadas />;
      case 'matematicas-9': return <PilotoRiemann />;
      case 'matematicas-10': return <PilotoGalton />;
      case 'biologia-1': return <PilotoMicroscopioVirtual />;
      case 'biologia-2': return <PilotoTransporteCelular />;
      case 'biologia-3': return <PilotoSintesisProteinas />;
      case 'biologia-4': return <PilotoFotosintesis />;
      case 'biologia-5': return <PilotoGenetica />;
      case 'biologia-6': return <PilotoSeleccionNatural />;
      case 'biologia-7': return <PilotoSistemaNervioso />;
      case 'biologia-8': return <PilotoElectrocardiograma />;
      case 'biologia-9': return <PilotoSistemaDigestivo />;
      case 'biologia-10': return <PilotoPoblaciones />;
      default: return <PilotoConstruccionAtomica isWorktableDark={false} isProfesor={activeTab === 'maestro'} />;
    }
  };

  const renderBitacora = () => {
    switch (normalizedId) {
      // QUÍMICA
      case 'quimica-1': return <BitacoraConstruccionAtomica />;
      case 'quimica-2': return <BitacoraLeyesGases />;
      case 'quimica-3': return <BitacoraBalanceoEcuaciones />;
      case 'quimica-4': return <BitacoraReactivoLimitante />;
      case 'quimica-5': return <BitacoraPreparacionSoluciones />;
      case 'quimica-6': return <BitacoraPrecipitado />;
      case 'quimica-7': return <BitacoraTitulacion />;
      case 'quimica-8': return <BitacoraEquilibrio />;
      case 'quimica-9': return <BitacoraCeldasGalvanicas />;
      case 'quimica-10': return <BitacoraDestilacion />;

      // FÍSICA
      case 'fisica-1': return <BitacoraTiroParabolico activateAnalysis={activateAnalysis} />;
      case 'fisica-2': return <BitacoraPlanoInclinado activateAnalysis={activateAnalysis} />;
      case 'fisica-3': return <BitacoraPenduloSimple activateAnalysis={activateAnalysis} />;
      case 'fisica-4': return <BitacoraLeyHooke />;
      case 'fisica-5': return <BitacoraColisiones1D />;
      case 'fisica-6': return <BitacoraArquimedes />;
      case 'fisica-7': return <BitacoraDilatacionTermica />;
      case 'fisica-8': return <BitacoraLeyOhm />;
      case 'fisica-9': return <BitacoraElectrostatica />;
      case 'fisica-10': return <BitacoraMotorElectrico />;

      // MATEMÁTICAS
      case 'matematicas-1': return <BitacoraCuadraticas />;
      case 'matematicas-2': return <BitacoraSistemas2x2 />;
      case 'matematicas-3': return <BitacoraRichter />;
      case 'matematicas-4': return <BitacoraPitagoras />;
      case 'matematicas-5': return <BitacoraTrigonometria />;
      case 'matematicas-6': return <BitacoraTransformaciones />;
      case 'matematicas-7': return <BitacoraSnell />;
      case 'matematicas-8': return <BitacoraDerivadas />;
      case 'matematicas-9': return <BitacoraRiemann />;
      case 'matematicas-10': return <BitacoraGalton />;

      // BIOLOGÍA
      case 'biologia-1': return <BitacoraMicroscopio />;
      case 'biologia-2': return <BitacoraTransporte />;
      case 'biologia-3': return <BitacoraSintesis />;
      case 'biologia-4': return <BitacoraFotosintesis />;
      case 'biologia-5': return <BitacoraGenetica />;
      case 'biologia-6': return <BitacoraSeleccion />;
      case 'biologia-7': return <BitacoraSistemaNervioso />;
      case 'biologia-8': return <BitacoraElectrocardiograma />;
      case 'biologia-9': return <BitacoraSistemaDigestivo />;
      case 'biologia-10': return <BitacoraPoblaciones activateAnalysis={activateAnalysis} />;

      default: return <BitacoraDefault />;
    }
  };

  if (!mounted) return <div className="fixed inset-0 bg-[#0A1121] flex items-center justify-center z-[200]"><div className="w-16 h-16 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" /></div>;

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-['Outfit'] selection:bg-[#219EBC]/30 antialiased relative">
      
      {/* SIDEBAR (Drawer en móvil, fijo en escritorio) */}
      <motion.aside 
        initial={false}
        animate={{ 
          width: isMobile ? (isSidebarOpen ? '100%' : '0px') : (isSidebarOpen ? '30%' : '80px'),
          x: isMobile && !isSidebarOpen ? '-100%' : '0%',
          position: isMobile ? 'absolute' : 'relative'
        }}
        className={`h-full bg-white border-r border-[#E2E8F0] shadow-2xl flex flex-col z-50 transition-all duration-300 overflow-hidden ${isMobile ? 'absolute inset-y-0 left-0' : ''}`}
      >
        <div className={`p-6 flex items-center justify-between transition-opacity ${!isSidebarOpen && 'opacity-0'}`}>
           <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-[#023047] rounded-xl flex items-center justify-center shadow-md shadow-[#023047]/10">
                 <Layout className="text-[#FB8500] w-6 h-6" />
              </div>
              <h2 className="text-lg font-black text-[#023047] uppercase tracking-tighter">Panel de Control</h2>
           </div>
           <button onClick={() => setIsSidebarOpen(false)} className="p-2 hover:bg-[#F1F5F9] rounded-lg text-[#64748B] transition-colors"><ArrowLeft size={18} /></button>
        </div>

        {isSidebarOpen && (
          <>
            <div className="px-6 flex gap-1 mb-6">
               {(['guia', 'maestro', 'conceptos', 'bitacora', 'herramientas'] as const).map((tab) => (
                  <button
                    key={tab}
                    onClick={() => setActiveTab(tab)}
                    className={`flex-1 flex items-center justify-center gap-2 py-3 text-[10px] font-black uppercase tracking-widest transition-all ${
                      activeTab === tab 
                        ? 'bg-white text-[#219EBC] shadow-sm' 
                        : 'text-slate-400 hover:text-slate-600'
                    }`}
                  >
                    {tab === 'guia' && <Beaker size={14} />}
                    {tab === 'maestro' && <GraduationCap size={14} />}
                    {tab === 'conceptos' && <Lightbulb size={14} />}
                    {tab === 'bitacora' && <FileText size={14} />}
                    {tab === 'herramientas' && <Settings size={14} />}
                    <span>
                      {language === 'es' 
                        ? (tab === 'guia' ? 'Guía' : tab === 'maestro' ? 'Maestro' : tab === 'conceptos' ? 'Conceptos' : tab === 'bitacora' ? 'Bitácora' : 'Herramientas')
                        : (tab === 'guia' ? 'Guide' : tab === 'maestro' ? 'Master' : tab === 'conceptos' ? 'Concepts' : tab === 'bitacora' ? 'Logbook' : 'Tools')
                      }
                    </span>
                  </button>
               ))}
            </div>

            <div className="flex-1 overflow-y-auto px-6 pb-6 custom-scrollbar">
               {activeTab === 'guia' && (
                  <div className="space-y-6 animate-in fade-in slide-in-from-left duration-500">
                     <div className="p-8 bg-gradient-to-br from-[#023047] to-[#0a405c] rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
                        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:scale-110 transition-transform">
                           <Beaker size={80} />
                        </div>
                        <div className="flex items-center justify-between mb-2">
                           <span className="text-[10px] font-black uppercase tracking-[0.3em] text-[#219EBC]">
                              {language === 'es' ? 'Protocolo de Laboratorio' : 'Laboratory Protocol'}
                           </span>
                        </div>
                        <h3 className="text-2xl font-black mb-4 leading-tight uppercase tracking-tighter">
                           {language === 'es' ? data.titulo : (data.tituloEn || data.titulo)}
                        </h3>
                        <p className="text-xs font-bold text-blue-100/80 leading-relaxed mb-6">
                           {language === 'es' ? data.mision : (data.misionEn || data.mision)}
                        </p>

                        <button 
                          id="btn-voice-synthesis"
                          onClick={() => {
                            console.log("🔊 Iniciando síntesis de voz (Voz Femenina)...");
                            window.speechSynthesis.cancel();
                            const fullGuideText = `${language === 'es' ? data.titulo : (data.tituloEn || data.titulo)}. ${language === 'es' ? data.mision : (data.misionEn || data.mision)}. ${data.pasos.map(p => language === 'es' ? p.text : (p.textEn || p.text)).join('. ')}`;
                            const utterance = new SpeechSynthesisUtterance(fullGuideText);
                            utterance.lang = language === 'es' ? 'es-MX' : 'en-US';
                            
                            // Seleccionar preferentemente voz femenina clara
                            const voices = window.speechSynthesis.getVoices();
                            const preferredVoice = voices.find(v => 
                              (language === 'es' && (v.name.includes('Sabina') || v.name.includes('Monica') || v.name.includes('Google español'))) ||
                              (language === 'en' && (v.name.includes('Female') || v.name.includes('Zira') || v.name.includes('Google US English')))
                            );
                            if (preferredVoice) {
                              utterance.voice = preferredVoice;
                              console.log("🎤 Voz seleccionada:", preferredVoice.name);
                            }

                            utterance.pitch = 1.1; // Ligeramente más agudo para claridad
                            utterance.rate = 0.95; // Un poco más lento para mejor comprensión
                            utterance.onend = () => console.log("🔊 Síntesis finalizada.");
                            utterance.onerror = (e) => console.error("❌ Error en síntesis:", e);
                            window.speechSynthesis.speak(utterance);
                          }}
                          className="w-full py-3 bg-white/10 hover:bg-white/20 border border-white/10 rounded-2xl flex items-center justify-center gap-3 transition-all active:scale-95 group mb-6"
                        >
                           <div className="w-8 h-8 rounded-full bg-[#219EBC] flex items-center justify-center shadow-lg shadow-[#219EBC]/20 group-hover:scale-110 transition-transform">
                              <Play size={14} fill="white" className="text-white ml-0.5" />
                           </div>
                           <span className="text-[10px] font-black uppercase tracking-widest text-blue-50">
                             {language === 'es' ? 'Reproducir Práctica' : 'Play Practice Audio'}
                           </span>
                        </button>

                        <div className="flex items-center gap-4">
                           <div className="flex -space-x-2">
                              {[1,2,3].map(i => <div key={i} className="w-8 h-8 rounded-full border-2 border-[#023047] bg-slate-200" />)}
                           </div>
                           <span className="text-[10px] font-black uppercase text-blue-200">+40 Alumnos Activos</span>
                        </div>
                     </div>

                     <div className="space-y-4">
                        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                           <Play size={12} className="text-[#219EBC]" /> 
                           {language === 'es' ? 'Secuencia de Ejecución' : 'Execution Sequence'}
                        </h4>
                        {data.pasos.map((paso) => (
                          <div key={paso.id} className="relative pl-8 pb-6 last:pb-0 group">
                             {paso.id !== data.pasos.length && (
                               <div className={`absolute left-[11px] top-6 bottom-0 w-0.5 ${pasoActual > paso.id ? 'bg-[#219EBC]' : 'bg-slate-100'}`} />
                             )}
                             <div className={`absolute left-0 top-0 w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-black transition-all ${
                               pasoActual > paso.id ? 'bg-[#219EBC] text-white shadow-lg shadow-[#219EBC]/20' : 
                               pasoActual === paso.id ? 'bg-[#023047] text-white animate-pulse' : 'bg-slate-100 text-slate-400'
                             }`}>
                                {pasoActual > paso.id ? <CheckCircle2 size={12} /> : paso.id}
                             </div>
                             <div className="pt-1">
                                <p className={`text-sm font-bold leading-relaxed ${pasoActual >= paso.id ? 'text-[#023047]' : 'text-slate-400'}`}>
                                  {language === 'es' ? paso.text : (paso.textEn || paso.text)}
                                </p>
                             </div>
                          </div>
                        ))}
                     </div>
                  </div>
               )}

               {activeTab === 'maestro' && (
                 <div className="space-y-6 animate-in slide-in-from-right duration-500">
                    <div className="p-6 bg-[#FB8500]/10 border border-[#FB8500]/30 rounded-3xl">
                       <div className="flex items-center gap-3 mb-4">
                          <GraduationCap className="text-[#FB8500]" size={24} />
                          <h4 className="text-sm font-black text-[#023047] uppercase">Guía Docente</h4>
                       </div>
                       <p className="text-[11px] font-bold text-slate-600 italic leading-relaxed mb-4">“{data.guiaMaestro.objetivo}”</p>
                       <div className="space-y-4">
                          <div className="p-4 bg-white/50 rounded-xl border border-white">
                             <span className="text-[10px] font-black text-[#FB8500] uppercase block mb-1">Fricción Didáctica</span>
                             <p className="text-xs text-slate-600 font-medium leading-normal">{data.guiaMaestro.friccion}</p>
                          </div>
                          <div className="space-y-2">
                             <span className="text-[10px] font-black text-slate-400 uppercase block">Puntos Críticos</span>
                             {data.guiaMaestro.puntosClave.map((punto, idx) => (
                               <div key={idx} className="flex items-center gap-2 text-xs font-bold text-[#023047]">
                                  <div className="w-1.5 h-1.5 bg-[#FB8500] rounded-full" /> {punto}
                                </div>
                             ))}
                          </div>
                       </div>
                    </div>
                 </div>
               )}

               {activeTab === 'conceptos' && (
                 <div className="grid grid-cols-1 gap-4 animate-in slide-in-from-bottom duration-500">
                    <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest mt-2 flex items-center gap-2">
                       <Lightbulb size={12} className="text-[#219EBC]" /> Tarjetas Flash
                    </h4>
                    {data.conceptos.map((concepto, idx) => (
                       <motion.div whileHover={{ y: -5 }} key={idx} className="p-5 bg-white border border-slate-200 rounded-3xl shadow-sm hover:shadow-xl transition-all cursor-help group">
                          <div className="w-8 h-8 rounded-lg bg-[#EFF6FF] text-[#219EBC] flex items-center justify-center mb-3 group-hover:bg-[#219EBC] group-hover:text-white transition-colors">
                             <Info size={16} />
                          </div>
                          <h5 className="text-sm font-black text-[#023047] mb-2">{concepto.titulo}</h5>
                          <p className="text-xs font-medium text-slate-500 leading-relaxed">{concepto.desc}</p>
                       </motion.div>
                    ))}
                 </div>
               )}

               {activeTab === 'bitacora' && renderBitacora()}

               {activeTab === 'herramientas' && (
                  <div className="space-y-4 mt-2">
                     <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                        <Settings size={12} className="text-[#219EBC]" /> {language === 'es' ? 'Herramientas de Campo' : 'Field Tools'}
                     </h4>
                     
                     <button 
                       onClick={() => setShowCalc(!showCalc)} 
                       className={`w-full p-4 border rounded-2xl flex items-center justify-between group transition-all ${showCalc ? 'bg-[#023047] border-[#023047] text-white' : 'bg-white border-slate-200 text-[#023047] hover:border-[#219EBC]'}`}
                     >
                        <div className="flex items-center gap-3">
                           <Calculator className={showCalc ? 'text-[#219EBC]' : 'text-[#219EBC]'} size={18} />
                           <span className="text-[11px] font-black uppercase">{language === 'es' ? 'Calculadora Científica' : 'Scientific Calculator'}</span>
                        </div>
                        <ChevronRight size={16} className={showCalc ? 'text-white' : 'text-slate-300 group-hover:text-[#219EBC]'} />
                     </button>

                     <button 
                       onClick={() => setActivateAnalysis(!activateAnalysis)} 
                       className={`w-full p-4 border rounded-2xl flex items-center justify-between group transition-all ${activateAnalysis ? 'bg-indigo-600 border-indigo-600 text-white' : 'bg-white border-slate-200 text-[#023047] hover:border-indigo-600'}`}
                     >
                        <div className="flex items-center gap-3">
                           <TrendingUp className={activateAnalysis ? 'text-white' : 'text-indigo-500'} size={18} />
                           <span className="text-[11px] font-black uppercase">{language === 'es' ? 'Análisis Estadístico' : 'Statistical Analysis'}</span>
                        </div>
                        <ChevronRight size={16} className={activateAnalysis ? 'text-white' : 'text-slate-300 group-hover:text-indigo-600'} />
                     </button>

                     {showCalc && (
                       <div className="mt-4 flex justify-center animate-in fade-in zoom-in-95 duration-300">
                         <ScientificCalculator language={language} onClose={() => setShowCalc(false)} />
                       </div>
                     )}

                     <div className="h-px bg-slate-100 my-4" />

                     <button onClick={() => setShowTools(true)} className="w-full p-4 bg-white border border-slate-200 rounded-2xl flex items-center justify-between group hover:border-[#219EBC]">
                        <div className="flex items-center gap-3">
                           <BarChart3 className="text-[#219EBC]" size={18} />
                           <span className="text-[11px] font-black text-[#023047] uppercase">Tabla Periódica</span>
                        </div>
                        <ChevronRight size={16} className="text-slate-300 group-hover:text-[#219EBC]" />
                     </button>
                  </div>
               )}
            </div>

            <div className="p-6 border-t border-slate-100 bg-white">
               <button onClick={() => setShowExitModal(true)} className="w-full py-4 bg-red-50 text-red-500 font-black text-[11px] uppercase tracking-widest rounded-2xl hover:bg-red-100 flex items-center justify-center gap-2 transition-all active:scale-95">
                  <ArrowLeft size={14} /> Finalizar Sesión
               </button>
            </div>
          </>
        )}
      </motion.aside>

      {/* STAGE MAIN (Rígido 70%) */}
      <main className="flex-1 min-w-0 h-full relative flex flex-col overflow-hidden bg-white/5 backdrop-blur-[1px]">
        <header className="h-20 bg-white border-b border-[#E2E8F0] px-8 flex items-center justify-between z-40 shadow-sm flex-shrink-0">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest tracking-[0.2em]">CEN Labs Tech v9.0</span>
                 <h1 className="text-xl font-black text-[#023047] uppercase tracking-tighter leading-none mt-1">{language === 'es' ? data.titulo : (data.tituloEn || data.titulo)}</h1>
              </div>
              <div className="h-8 w-px bg-slate-200" />
              <div className="flex items-center gap-4 bg-[#F8FAFC] px-5 py-2.5 rounded-2xl border border-slate-200 shadow-inner">
                 <Timer size={18} className="text-[#219EBC]" />
                 <span className="font-mono font-black text-[#023047] text-base">{formatTime(timer)}</span>
              </div>
           </div>
            <div className="flex items-center gap-3">
               <button 
                onClick={() => setLanguage(language === 'es' ? 'en' : 'es')}
                className="flex items-center gap-2 px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-[10px] font-black uppercase text-slate-500 hover:bg-white hover:text-[#219EBC] transition-all"
               >
                 <Globe size={14} /> {language.toUpperCase()}
               </button>
               <button 
                onClick={() => {
                  generateLabReport({
                    titulo: language === 'es' ? data.titulo : (data.tituloEn || data.titulo),
                    materia: normalizedId.split('-')[0],
                    alumno: "Estudiante CEN Labs",
                    fecha: new Date(),
                    bitacoraData,
                    score,
                    time: formatTime(timer)
                  });
                }}
                className="w-12 h-12 rounded-2xl bg-[#FB8500] text-white flex items-center justify-center shadow-lg shadow-orange-200 hover:scale-105 active:scale-95 transition-all"
                title="Descargar Reporte PDF"
               >
                 <Download size={20} />
               </button>
               <div className="h-8 w-px bg-slate-200 mx-2" />
               <div className="px-6 py-2 bg-[#023047] text-white rounded-2xl text-[11px] font-black uppercase tracking-widest shadow-xl border border-white/20">
                 {language === 'es' ? 'Alumno Activo' : 'Active Student'}
               </div>
              {!isSidebarOpen && (
                <button onClick={() => setIsSidebarOpen(true)} className="w-12 h-12 rounded-2xl bg-white border border-slate-200 text-[#023047] flex items-center justify-center active:scale-95 transition-all"><ChevronRight size={24}/></button>
              )}
           </div>
        </header>

        <div className="flex-1 w-full relative overflow-hidden backdrop-blur-sm bg-slate-900/5 min-h-0">
            {/* Botón flotante para móviles cuando el sidebar está cerrado */}
            {isMobile && !isSidebarOpen && (
              <motion.button 
                initial={{ opacity: 0, scale: 0.5 }}
                animate={{ opacity: 1, scale: 1 }}
                onClick={() => setIsSidebarOpen(true)}
                className="fixed bottom-6 right-6 w-16 h-16 bg-[#023047] text-[#FB8500] rounded-full shadow-2xl z-[60] flex items-center justify-center border-4 border-white active:scale-90 transition-transform"
              >
                <BookOpen size={28} aria-hidden="true" />
              </motion.button>
            )}
           <ErrorBoundary>
             <AnimatePresence mode="wait">
               <motion.div 
                 key={normalizedId} 
                 initial={{ opacity: 0, y: 10 }} 
                 animate={{ opacity: 1, y: 0 }} 
                 exit={{ opacity: 0, y: -10 }} 
                 className="w-full h-full"
               >
                  {renderSimulator()}
               </motion.div>
             </AnimatePresence>
           </ErrorBoundary>

           {/* MODALES DE ÉXITO GLOBALES */}
           <AnimatePresence>
              {(destilacion.status === 'success') && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-blue-500">
                    <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Destilación Exitosa!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has logrado separar el etanol con una pureza excepcional. ¡Eres un maestro de la termodinámica!</p>
                    <button onClick={() => { resetP10(); router.push('/alumno/laboratorio/quimica'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-colors">Finalizar Laboratorio</button>
                  </motion.div>
                </div>
              )}
              {(celda.status === 'success') && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0A1121]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-green-500">
                    <div className="w-24 h-24 bg-green-100 text-green-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Celda Perfecta!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Ensamblaje correcto y potencial de celda calculado con precisión.</p>
                    <button onClick={() => { resetP9(); router.push('/alumno/laboratorio/quimica'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-green-600 transition-colors">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {(equilibrio.status === 'success') && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-[#FB8500]">
                    <div className="w-24 h-24 bg-[#FB8500]/10 text-[#FB8500] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Deducción Perfecta!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Le Châtelier aplicado correctamente. ΔH positivo = Endotérmica.</p>
                    <button onClick={() => { resetP8(); router.push('/alumno/laboratorio/quimica'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#FB8500]">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {titulacion.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-pink-900/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-pink-500">
                    <div className="w-24 h-24 bg-pink-100 text-pink-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Titulación Exitosa!</h3>
                    <button onClick={() => { resetP7(); router.push('/alumno/laboratorio/quimica'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-pink-500">Volver al Laboratorio</button>
                  </motion.div>
                </div>
              )}
              {solubilidad.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-[#219EBC]">
                    <div className="w-24 h-24 bg-[#219EBC]/10 text-[#219EBC] rounded-full flex items-center justify-center mx-auto mb-8 animate-pulse"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Excelente Trabajo!</h3>
                    <button onClick={() => { resetP6(); router.push('/alumno/laboratorio/quimica'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#219EBC]">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {cuadraticas.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-rose-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-rose-500">
                    <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Trayectoria Dominada!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has comprendido cómo los coeficientes transforman la realidad geométrica. ¡Excelente cálculo!</p>
                    <button onClick={() => { resetM1(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-rose-500 transition-colors">Volver al Laboratorio</button>
                  </motion.div>
                </div>
              )}
              {sistemas2x2.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-cyan-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-cyan-500">
                    <div className="w-24 h-24 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Señal Localizada!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has triangulado la posición del satélite con precisión milimétrica. El sistema 2x2 ha sido resuelto.</p>
                    <button onClick={() => { resetM2(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-cyan-500 transition-colors">Confirmar Datos</button>
                  </motion.div>
                </div>
              )}
              {richter.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-rose-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-rose-500">
                    <div className="w-24 h-24 bg-rose-100 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Zap size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Análisis Completado</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has comprendido la magnitud real de la energía liberada. El crecimiento exponencial ya no tiene secretos para ti.</p>
                    <button onClick={() => { resetM3(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-rose-500 transition-colors">Volver a la Base</button>
                  </motion.div>
                </div>
              )}
              {pitagoras.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-blue-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-blue-500">
                    <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Teorema Demostrado</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has comprobado físicamente la relación entre los cuadrados de los catetos y la hipotenusa.</p>
                    <button onClick={() => { resetM4(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-500 transition-colors">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {trigonometria.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-cyan-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-cyan-500">
                    <div className="w-24 h-24 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Oscilación Dominada</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has identificado el punto exacto donde las ondas se cruzan. ¡Entiendes la esencia de la trigonometría!</p>
                    <button onClick={() => { resetM5(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-cyan-500 transition-colors">Volver al Dashboard</button>
                  </motion.div>
                </div>
              )}
              {geometria6.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-amber-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-amber-500">
                    <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Acoplamiento Exitoso!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has dominado las isometrías y homotecias. La sonda ha aterrizado con precisión milimétrica en la plataforma.</p>
                    <button onClick={() => { resetM6(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-colors">Completar Misión</button>
                  </motion.div>
                </div>
              )}
              {optica7.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-cyan-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-cyan-500">
                    <div className="w-24 h-24 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Objetivo Identificado</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has utilizado la Ley de Snell para deducir la naturaleza del cristal. El índice n₂ ha sido verificado con precisión.</p>
                    <button onClick={() => { resetM7(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-cyan-600 transition-colors">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {derivada8.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-indigo-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-indigo-500">
                    <div className="w-24 h-24 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Cima Localizada</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has identificado un punto crítico donde la derivada es cero. ¡Dominas la geometría del cálculo!</p>
                    <button onClick={() => { resetM8(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-colors">Completar Práctica</button>
                  </motion.div>
                </div>
              )}
              {integral9.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-emerald-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-emerald-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Resolución Óptima</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Al aumentar el número de subdivisiones, has alcanzado el límite de la integral. ¡Entiendes la base del Teorema Fundamental del Cálculo!</p>
                    <button onClick={() => { resetM9(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-colors">Finalizar Laboratorio</button>
                  </motion.div>
                </div>
              )}
              {galton10.status === 'success' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-amber-950/40 backdrop-blur-xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-amber-500">
                    <div className="w-24 h-24 bg-amber-100 text-amber-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Orden en el Caos!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has calibrado la máquina para demostrar el Teorema del Límite Central. La distribución normal ha emergido de eventos independientes.</p>
                    <button onClick={() => { resetM10(); router.push('/alumno/laboratorio/matematicas'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-amber-600 transition-colors">Completar Laboratorio</button>
                  </motion.div>
                </div>
              )}
              {microscopio.status === 'success' && normalizedId === 'biologia-1' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-teal-950/60 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-teal-500">
                    <div className="w-24 h-24 bg-teal-100 text-teal-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has localizado el {microscopio.objetivo} con el aumento adecuado. Tu dominio de la microscopía óptica es evidente.</p>
                    <button onClick={() => { resetB1(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-teal-600 transition-colors">Guardar Micrografía</button>
                  </motion.div>
                </div>
              )}
              {transporte.status === 'success' && normalizedId === 'biologia-2' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-emerald-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Homoestasis Lograda</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has equilibrado las presiones osmóticas. El volumen celular se ha estabilizado en el 100%.</p>
                    <button onClick={() => { resetB2(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-colors">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {transporte.status === 'error' && normalizedId === 'biologia-2' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-rose-950/80 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-rose-500">
                    <div className="w-24 h-24 bg-rose-50 text-rose-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-shake"><AlertCircle size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Lisis Celular!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">La presión interna superó la resistencia de la membrana plasmática. El eritrocito ha estallado.</p>
                    <button onClick={() => { resetB2(); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-rose-600 transition-colors">Reiniciar Calibración</button>
                  </motion.div>
                </div>
              )}
              {sintesis.status === 'success' && normalizedId === 'biologia-3' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#1a1c2c]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-emerald-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Proteína Sintetizada</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has completado el dogma central: ADN → ARN → Proteína. La cadena de {sintesis.proteina.length} aminoácidos ha sido ensamblada con éxito.</p>
                    <button onClick={() => { resetB3(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-colors">Exportar Resultados</button>
                  </motion.div>
                </div>
              )}
              {fotosintesis.status === 'success' && normalizedId === 'biologia-4' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-cyan-500">
                    <div className="w-24 h-24 bg-cyan-100 text-cyan-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Misión Fotosintética</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has logrado recolectar {fotosintesis.oxigenoAcumulado.toFixed(1)} ml de Oxígeno puro. Tu ajuste del espectro y la intensidad ha sido óptimo.</p>
                    <button onClick={() => { resetB4(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-cyan-600 transition-colors">Finalizar Investigación</button>
                  </motion.div>
                </div>
              )}
              {genetica.status === 'success' && normalizedId === 'biologia-5' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#0a0c10]/95 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-fucsia-500">
                    <div className="w-24 h-24 bg-fucsia-50 text-fucsia-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Dna size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Herencia Validada</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has demostrado la 2da Ley de Mendel mediante una población de {genetica.tamanioMuestra} individuos. La proporción fenotípica 9:3:3:1 ha emergido estadísticamente.</p>
                    <button onClick={() => { resetB5(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-fucsia-600 transition-colors">Guardar Linaje</button>
                  </motion.div>
                </div>
              )}
              {evolucion.generacion >= 6 && evolucion.oscura >= 80 && normalizedId === 'biologia-6' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-slate-900/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-slate-800">
                    <div className="w-24 h-24 bg-slate-100 text-slate-800 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><TrendingUp size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Adaptación Lograda</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has observado el Melanismo Industrial en acción. Tras {evolucion.generacion - 1} generaciones, la población oscura domina el ecosistema al {evolucion.oscura}%.</p>
                    <button onClick={() => { resetB6(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-slate-700 transition-colors">Finalizar Experimento</button>
                  </motion.div>
                </div>
              )}
              {sistemaNervioso.status === 'success' && normalizedId === 'biologia-7' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-blue-950/80 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-blue-500">
                    <div className="w-24 h-24 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Zap size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">Reflejo Íntegro</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has validado la velocidad de conducción normal con mielina al 100%. Latencia medida: {sistemaNervioso.latenciaMedida}ms.</p>
                    <button onClick={() => { resetB7(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-colors">Cerrar Diagnóstico</button>
                  </motion.div>
                </div>
              )}
              {cardio.status === 'success' && normalizedId === 'biologia-8' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-[#FB8500]">
                    <div className="w-24 h-24 bg-[#FB8500]/10 text-[#FB8500] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Prueba Validada!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has estabilizado el ritmo cardíaco del paciente en {cardio.ritmoBPM} BPM. El ECG muestra una sincronía perfecta.</p>
                    <button onClick={() => { resetB8(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#FB8500]">Cerrar Expediente</button>
                  </motion.div>
                </div>
              )}
              {digestion.status === 'success' && normalizedId === 'biologia-9' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-[#219EBC]">
                    <div className="w-24 h-24 bg-[#219EBC]/10 text-[#219EBC] rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><Award size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Digestión Exitosa!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has descompuesto el {digestion.macronutriente === 'almidon' ? 'Almidón' : digestion.macronutriente === 'proteina' ? 'Polipéptido' : 'Triglicérido'} en sus piezas fundamentales y la absorción es del 100%.</p>
                    <button onClick={() => { resetB9(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-[#219EBC]">Finalizar Práctica</button>
                  </motion.div>
                </div>
              )}
              {ecosistema.status === 'success' && normalizedId === 'biologia-10' && (
                <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/90 backdrop-blur-3xl p-6">
                  <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] p-12 max-w-md w-full shadow-2xl text-center border-t-[12px] border-emerald-500">
                    <div className="w-24 h-24 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><ShieldCheck size={48} /></div>
                    <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4">¡Ecosistema Certificado!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has logrado mantener el equilibrio durante 50 años virtuales. Las ondas de Lotka-Volterra son estables y armónicas.</p>
                    <button onClick={() => { resetB10(); router.push('/alumno/laboratorio/biologia'); }} className="w-full py-5 bg-[#023047] text-white font-black text-sm uppercase tracking-widest rounded-2xl hover:bg-emerald-600">Completar Fase 1</button>
                  </motion.div>
                </div>
              )}
           </AnimatePresence>
        </div>
      </main>

      {/* MODALS REUTILIZABLES */}
      <AnimatePresence>
         {showExitModal && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#023047]/60 backdrop-blur-md p-6">
               <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-white rounded-[3rem] p-10 max-w-sm w-full shadow-2xl text-center border-b-[12px] border-red-500">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertCircle size={40} /></div>
                  <h3 className="text-2xl font-black text-[#023047] uppercase tracking-tighter mb-2">¿Pausar Sesión?</h3>
                  <div className="flex gap-4">
                     <button onClick={() => setShowExitModal(false)} className="flex-1 py-5 bg-slate-100 text-slate-500 font-black text-xs uppercase tracking-widest rounded-2xl">Seguir</button>
                     <button onClick={() => router.push(`/alumno/laboratorio/${normalizedId.split('-')[0]}`)} className="flex-1 py-5 bg-red-500 text-white font-black text-xs uppercase tracking-widest rounded-2xl">Salir</button>
                  </div>
               </motion.div>
            </div>
         )}

         {showTools && (
            <div className="fixed inset-0 z-[200] flex items-center justify-center bg-[#023047]/80 backdrop-blur-xl p-8">
               <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} className="bg-white rounded-[3rem] w-full max-w-5xl h-[80vh] shadow-2xl flex flex-col relative overflow-hidden">
                  <div className="p-10 flex items-center justify-between border-b border-slate-100">
                      <div className="flex items-center gap-4">
                        <Microscope size={32} className="text-[#219EBC]" />
                        <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter">Toolkit Avanzado</h3>
                      </div>
                      <button onClick={() => setShowTools(false)} className="w-12 h-12 rounded-2xl bg-slate-50 flex items-center justify-center text-slate-400"><X size={24}/></button>
                  </div>
                  <div className="flex-1 p-10 overflow-auto bg-slate-50/50">
                      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                          <div className="p-8 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm hover:border-[#219EBC] cursor-pointer">
                              <BarChart3 size={32} className="text-[#219EBC] mb-6" />
                              <h5 className="text-xl font-black text-[#023047] mb-2 uppercase">Tabla Periódica</h5>
                          </div>
                      </div>
                  </div>
               </motion.div>
            </div>
         )}
      </AnimatePresence>
    </div>
  );
}
