
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

// --- IMPORTACIÓN DINÁMICA DE PILOTOS ---
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

const PilotoMicroscopioVirtual = dynamic(() => import('@/components/PilotoMicroscopioVirtual'), { loading: Loader });
const PilotoTransporteCelular = dynamic(() => import('@/components/PilotoTransporteCelular'), { loading: Loader });
const PilotoSintesisProteinas = dynamic(() => import('@/components/PilotoSintesisProteinas'), { loading: Loader });
const PilotoFotosintesis = dynamic(() => import('@/components/PilotoFotosintesis'), { loading: Loader });
const PilotoGenetica = dynamic(() => import('@/components/PilotoGenetica'), { loading: Loader });
const PilotoSeleccionNatural = dynamic(() => import('@/components/PilotoSeleccionNatural'), { loading: Loader });
const PilotoSistemaNervioso = dynamic(() => import('@/components/PilotoSistemaNervioso'), { loading: Loader });
const PilotoElectrocardiograma = dynamic(() => import('@/components/PilotoElectrocardiograma'), { loading: Loader });
const PilotoSistemaDigestivo = dynamic(() => import('@/components/PilotoSistemaDigestivo'), { loading: Loader });
const PilotoPoblaciones = dynamic(() => import('@/components/PilotoPoblaciones'), { loading: Loader });

// --- IMPORTACIÓN DINÁMICA DE BITÁCORAS ---
const BitacoraConstruccionAtomica = dynamic(() => import('@/components/bitacoras/BitacoraConstruccionAtomica'), { loading: Loader });
const BitacoraLeyesGases = dynamic(() => import('@/components/bitacoras/BitacoraLeyesGases'), { loading: Loader });
const BitacoraBalanceoEcuaciones = dynamic(() => import('@/components/bitacoras/BitacoraBalanceoEcuaciones'), { loading: Loader });
const BitacoraReactivoLimitante = dynamic(() => import('@/components/bitacoras/BitacoraReactivoLimitante'), { loading: Loader });
const BitacoraPreparacionSoluciones = dynamic(() => import('@/components/bitacoras/BitacoraPreparacionSoluciones'), { loading: Loader });
const BitacoraSolubilidadCristalizacion = dynamic(() => import('@/components/bitacoras/BitacoraSolubilidadCristalizacion'), { loading: Loader });
const BitacoraTitulacionAcidoBase = dynamic(() => import('@/components/bitacoras/BitacoraTitulacionAcidoBase'), { loading: Loader });
const BitacoraEquilibrioQuimico = dynamic(() => import('@/components/bitacoras/BitacoraEquilibrioQuimico'), { loading: Loader });
const BitacoraCeldasGalvanicas = dynamic(() => import('@/components/bitacoras/BitacoraCeldasGalvanicas'), { loading: Loader });
const BitacoraDestilacion = dynamic(() => import('@/components/bitacoras/BitacoraDestilacion'), { loading: Loader });

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

const BitacoraMicroscopio = dynamic(() => import('@/components/bitacoras/BitacoraMicroscopio'), { loading: Loader });
const BitacoraTransporte = dynamic(() => import('@/components/bitacoras/BitacoraTransporte'), { loading: Loader });
const BitacoraSintesis = dynamic(() => import('@/components/bitacoras/BitacoraSintesis'), { loading: Loader });
const BitacoraFotosintesis = dynamic(() => import('@/components/bitacoras/BitacoraFotosintesis'), { loading: Loader });
const BitacoraGenetica = dynamic(() => import('@/components/bitacoras/BitacoraGenetica'), { loading: Loader });
const BitacoraSeleccion = dynamic(() => import('@/components/bitacoras/BitacoraSeleccion'), { loading: Loader });
const BitacoraSistemaNervioso = dynamic(() => import('@/components/bitacoras/BitacoraSistemaNervioso'), { loading: Loader });
const BitacoraElectrocardiograma = dynamic(() => import('@/components/bitacoras/BitacoraElectrocardiograma'), { loading: Loader });
const BitacoraSistemaDigestivo = dynamic(() => import('@/components/bitacoras/BitacoraSistemaDigestivo'), { loading: Loader });
const BitacoraPoblaciones = dynamic(() => import('@/components/bitacoras/BitacoraPoblaciones'), { loading: Loader });

const BitacoraDefault = dynamic(() => import('@/components/bitacoras/BitacoraDefault'), { loading: Loader });
const StatisticalAnalysis = dynamic(() => import('@/components/tools/StatisticalAnalysis'), { loading: Loader });
const PeriodicTable = dynamic(() => import('@/components/tools/PeriodicTable'), { loading: Loader });
const DiagramaSegre = dynamic(() => import('@/components/DiagramaSegre'), { loading: Loader });

export default function SimuladorClient({ simuladorId }: { simuladorId: string }) {
  const router = useRouter();
  const [mounted, setMounted] = useState(false);
  const [activeTab, setActiveTab] = useState<'guia' | 'maestro' | 'chat'>('guia');
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [showTools, setShowTools] = useState(false);
  const [activateAnalysis, setActivateAnalysis] = useState(false);
  const [showExitModal, setShowExitModal] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [showBriefing, setShowBriefing] = useState(true);

  // Selectores de Zustand optimizados (Evitan re-renders globales)
  const pasoActual = useSimuladorStore(state => state.pasoActual);
  const setPasoActual = useSimuladorStore(state => state.setPasoActual);
  const resetPractica = useSimuladorStore(state => state.resetPractica);
  const resetM1 = useSimuladorStore(state => state.resetM1);
  const particulas = useSimuladorStore(state => state.particulas);

  // Reset briefing on lab change
  useEffect(() => {
    setShowBriefing(true);
    setPasoActual(1);
  }, [simuladorId, setPasoActual]);

  const list: Record<number, string> = { 1: "Hidrógeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono", 7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor", 10: "Neón" };
  const targetName = list[particulas.targetZ] || "Elemento";

  // Normalización de ID para soporte multi-lab
  const normalizedId = (
    simuladorId.startsWith('fisica-') ? simuladorId :
    simuladorId.replace('q', '') === 'quimica-10' ? 'quimica-10' :
    simuladorId.replace('q', '') === 'quimica-9' ? 'quimica-9' :
    simuladorId.replace('q', '') === 'quimica-8' ? 'quimica-8' :
    simuladorId.replace('q', '') === 'quimica-7' ? 'quimica-7' :
    simuladorId.replace('q', '') === 'quimica-6' ? 'quimica-6' :
    simuladorId.replace('q', '') === 'quimica-5' ? 'quimica-5' :
    simuladorId.replace('q', '') === 'quimica-4' ? 'quimica-4' :
    simuladorId.replace('q', '') === 'quimica-3' ? 'quimica-3' :
    simuladorId.replace('q', '') === 'quimica-2' ? 'quimica-2' :
    simuladorId.replace('q', '') === 'quimica-1' ? 'quimica-1' :
    simuladorId
  );

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

    // Iniciar temporizador al montar
    useSimuladorStore.getState().resetTimer();
    useSimuladorStore.getState().startTimer();
    const interval = setInterval(() => {
      useSimuladorStore.getState().tick();
    }, 1000);
    return () => clearInterval(interval);
  }, [simuladorId]);

  // Auto-progreso basado en el estado (sin victoria súbita)
  useEffect(() => {
    if (normalizedId === 'quimica-1') {
      const { protones, neutrones, electrones, targetZ, targetA } = particulas;
      if (protones > 0 && pasoActual === 1) setPasoActual(2);
      if (protones === targetZ && neutrones === (targetA - targetZ) && pasoActual === 2) setPasoActual(3);
      if (protones === targetZ && neutrones === (targetA - targetZ) && electrones === targetZ && pasoActual === 3) setPasoActual(4);
    }
  }, [particulas, pasoActual, setPasoActual, normalizedId]);

  if (!mounted) return <div className="fixed inset-0 bg-[#0A1121] flex items-center justify-center z-[200]"><div className="w-16 h-16 border-4 border-[#219EBC] border-t-transparent rounded-full animate-spin" /></div>;

  const data = MASTER_DATA[normalizedId as SimuladorId] || MASTER_DATA['quimica-1'];

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
    ? getDynamicSteps(particulas.targetZ, particulas.targetA, particulas.targetCharge ?? 0)
    : data.pasos;

  // ── Tutorial paso a paso para MAT-01 (Dr. Quantum Tutor) ─────────────────
  const mat1TutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Tu misión es ajustar los controles del piloto hasta que tu parábola coincida con la trayectoria guía (la línea punteada blanca). ¡Empecemos!',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Calcula Δ',
      mensaje: 'Primero calcula el DISCRIMINANTE. La fórmula es: Δ = b² − 4ac. Sustituye los valores a, b y c que ves en la Sonda de Telemetría del piloto. Anota el resultado en la Bitácora.',
    },
    {
      id: 3, tipo: 'calculo', pista: 'Ubica el Vértice',
      mensaje: '¡Bien! Ahora calcula la abscisa del vértice: h = −b ÷ (2a). Ese punto es el máximo o mínimo de la parábola — lo verás marcado en rojo en la gráfica. Verifícalo en la Bitácora.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Ajusta el coeficiente a',
      mensaje: 'Usa el control "Amplitud (a)" del dock inferior. Si a > 0, la parábola abre hacia ARRIBA (mínimo). Si a < 0, abre hacia ABAJO (máximo). Asegúrate de que tu parábola tenga la misma concavidad que la guía.',
    },
    {
      id: 5, tipo: 'accion', pista: 'Ajusta b y c',
      mensaje: 'El control "Simetría (b)" desplaza el vértice horizontalmente. El control "Intercepto (c)" mueve toda la parábola arriba o abajo. Ajusta ambos para acercar tu curva a la trayectoria guía.',
    },
    {
      id: 6, tipo: 'calculo', pista: 'Verifica las 3 Formas',
      mensaje: 'Observa el panel "3 Formas Equivalentes". Verifica que la Forma Vértice a(x−h)²+k y la Forma Factorizada a(x−r₁)(x−r₂) representen la misma ecuación. Son tres expresiones algebraicamente idénticas.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Valida la Trayectoria',
      mensaje: '¡Listo! Cuando tu parábola coincida visualmente con la guía y el % SYNC esté alto, presiona "Validar Trayectoria" en el dock. Validar en el primer intento te da ⭐⭐⭐.',
      accion: 'Ir a Validar →',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Misión Cumplida!',
      mensaje: '¡Fenomenal! Has dominado las tres formas de la ecuación cuadrática. Recuerda: esta función describe trayectorias reales — desde proyectiles hasta antenas parabólicas. ¡La matemática está en todas partes!',
    },
  ];

  // ── Tutorial paso a paso para BIO-01 (Dr. Quantum Tutor) ─────────────────
  const bio1TutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida!',
      mensaje: '¡Hola, {alumno}! Soy el Dr. Quantum. Tu misión es dominar la óptica microscópica calculando la resolución matemática de tu equipo antes de tomar una foto.',
    },
    {
      id: 2, tipo: 'accion', pista: 'Enfoque Inicial',
      mensaje: 'Primero, selecciona el objetivo amarillo de 10x. Usa exclusivamente el tornillo "Macrométrico" para encontrar de manera burda el enfoque ideal (la imagen tomará forma aunque borrosa).',
    },
    {
      id: 3, tipo: 'accion', pista: 'Ajuste Fino',
      mensaje: '¡Excelente! Ahora, pasa al objetivo azul de 40x. Al subir el aumento pierdes profundidad de campo (DOF), así que usa el tornillo "Micrométrico" (el ajustador de abajo) para afinar la nitidez.',
    },
    {
      id: 4, tipo: 'calculo', pista: 'Magnificación Total',
      mensaje: 'Ya que tenemos la muestra enfocada, dirígete al panel "Protocolo Analítico". Multiplica el aumento de nuestro Ocular (10x) por el Objetivo montado para encontrar la Magnificación.',
    },
    {
      id: 5, tipo: 'calculo', pista: 'Límite de Abbe',
      mensaje: 'El momento de la verdad en óptica: aplica la fórmula de Abbe d = 550nm / (2 * NA). Revisa qué valor de NA (Apertura Numérica) tiene tu lente actual e infiérelo en la fórmula.',
    },
    {
      id: 6, tipo: 'verificar', pista: 'Verifica los Datos',
      mensaje: 'Si confías en tu capacidad analítica, presiona "Verificar Computos". Solo si los números son correctos, el seguro del disparador fotográfico se habilitará.',
    },
    {
      id: 7, tipo: 'verificar', pista: 'Anota tu Hipótesis',
      mensaje: 'No hay experimentación sin reflexión. Anota tu conclusión bajo el apartado inferior reflexionando si el zoom sin límite es útil (Pista: el Límite de Abbe manda).',
    },
    {
      id: 8, tipo: 'logro', pista: '¡Misión Cumplida!',
      mensaje: '¡Fenomenal! Ahora comprendes que un microscopio no es solo un lente multiplicador, sino un sofisticado recolector de fotones atado a las leyes fundamentales de difracción. ¡Ciencia pura!',
    },
  ];

  // ── Tutorial paso a paso para FIS-01 (Dr. Quantum Tutor) ─────────────────
  const fis1TutorSteps: TutorStep[] = [
    {
      id: 1, tipo: 'intro', pista: '¡Bienvenida Táctica!',
      mensaje: '¡Hola, {alumno}! Bienvenido al polígono de artillería avanzada. Tu misión es destruir al dron invasor en el punto rojo, disparando desde un cañón elevado Y₀ superando el muro de contención.',
    },
    {
      id: 2, tipo: 'calculo', pista: 'Parábola General',
      mensaje: 'La cinemática escolar se acabó. El terreno NO es simétrico. Usa la ecuación y(x) = y₀ + x·tan(θ) - (g·x²) / (2v₀²·cos²(θ)). Esta ecuación define estrictamente tu trayectoria en 2D.',
    },
    {
      id: 3, tipo: 'accion', pista: 'Librar el Muro',
      mensaje: 'Primero asegúrate empírica o matemáticamente de que tu altura Y cuando X sea igual a la posición del Muro sea MAYOR a la altura del Muro. De lo contrario, colapsarás.',
    },
    {
      id: 4, tipo: 'accion', pista: 'Cálculo de Raíces',
      mensaje: 'Como tu blanco está en y=0, iguala la ecuación a 0 y usa la Fórmula General Cuadrática (-B ± √(B²-4AC)) / 2A para calcular qué V₀ precisas para que el X máximo sea la posición de tu objetivo.',
    },
  ];

  const currentTutorSteps = normalizedId === 'matematicas-1' ? mat1TutorSteps : 
                            normalizedId === 'biologia-1' ? bio1TutorSteps : 
                            normalizedId === 'fisica-1' ? fis1TutorSteps : 
                            [];

  // ── Configuración Mission Briefing para MAT-01 ───────────────────────────────────
  const mat1BriefingConfig: BriefingConfig = {
    codigo: 'MAT-01',
    titulo: 'Ecuaciones Cuadráticas',
    subtitulo: 'Análisis de Trayectorias Parabólicas',
    acento: '#22d3ee',
    duracion: 45,
    bienvenida: `¡Bienvenido al Laboratorio de Ecuaciones Cuadráticas! Soy el Dr. Quantum y hoy vamos a explorar una de las funciones más poderosas de las matemáticas.\n\nUna función cuadrática f(x) = ax² + bx + c no es solo una ecuación en un libro — es la descripción matemática de cómo vuela un proyectil, cómo se enfoca una antena parabólica o cómo se modela la ganancia óptima en un proyecto de ingeniería.\n\nTu misión: ajustar los parámetros de una parábola hasta sincronizarla con una trayectoria objetivo. ¡Las matemáticas son el idioma del universo!`,
    conceptos: [
      {
        icono: 'Δ',
        nombre: 'Discriminante',
        descripcion: 'Δ = b² − 4ac determina la naturaleza de las raíces: dos reales (Δ>0), una doble (Δ=0) o complejas conjugadas (Δ<0).',
      },
      {
        icono: '📍',
        nombre: 'Vértice',
        descripcion: 'El punto (h, k) donde h = −b/2a. Es el máximo o mínimo absoluto de la función. El eje de simetría pasa por él.',
      },
      {
        icono: '≡',
        nombre: '3 Formas Equivalentes',
        descripcion: 'Estándar ax²+bx+c, Vértice a(x−h)²+k y Factorizada a(x−r₁)(x−r₂). Tres expresiones, una sola función.',
      },
      {
        icono: '∑',
        nombre: 'Teoremas de Vieta',
        descripcion: 'Si r₁, r₂ son las raíces entonces r₁+r₂ = −b/a y r₁·r₂ = c/a. Válido incluso para raíces complejas.',
      },
      {
        icono: 'ℹ️',
        nombre: 'Números Complejos',
        descripcion: 'Cuando Δ<0 las raíces son z = h ± i·√(−Δ)/2|a|. Se visualizan en el plano de Argand en notación polar.',
      },
      {
        icono: '🔄',
        nombre: 'Completar el Cuadrado',
        descripcion: 'Técnica algebraica para transformar la forma estándar a la forma vértice: ax²+bx+c = a(x+b/2a)² + (c−b²/4a).',
      },
    ],
    mision: [
      'Observa la TRAYECTORIA OBJETIVO (carátula superior derecha del piloto). Esa es la parábola que debes replicar.',
      'Calcula mentalmente el DISCRIMINANTE (Δ = b² − 4ac) con los valores a, b y c de la Sonda de Telemetría. Anota tu resultado en la Bitácora.',
      'Localiza el VÉRTICE: calcula h = −b/2a y verifícalo en el campo de Cálculo Propio de la Bitácora.',
      'Usa los controles del dock inferior (Amplitud a, Simetría b, Intercepto c) para sincronizar tu parábola con la trayectoria objetivo.',
      'Analiza las 3 Formas Equivalentes que aparecen en el piloto y confirma que son algebraicamente idénticas.',
      'Cuando el % SYNC sea alto y tus cálculos estén verificados, presiona “Validar Trayectoria”.',
    ],
    aplicaciones: [
      {
        area: 'Ingeniería Civil',
        ejemplo: 'El arco de un puente sigue exactamente una curva parabólica. Los ingenieros usan f(x) = ax² para calcular la carga máxima y la flexión máxima del arco.',
      },
      {
        area: 'Física — Mecánica',
        ejemplo: 'Todo proyectil en un campo gravitacional (pelota, cohete, agua de una fuente) describe una trayectoria descrita por y = −½·g·t² + v₀t + y₀.',
      },
      {
        area: 'Electrónica',
        ejemplo: 'Las antenas satelitales y los telescopios reflectores usan la propiedad del foco de la parábola para concentrar señales en un punto exacto.',
      },
      {
        area: 'Economía',
        ejemplo: 'La función de utilidad de una empresa tiene forma cuadrática. El vértice representa el punto de producción con beneficio máximo.',
      },
      {
        area: 'Óptica Física',
        ejemplo: 'El espejo de un microscopio electrónico concentra haces de luz usando una sección parabólica. La ecuación cuadrática define la forma exacta del espejo.',
      },
      {
        area: 'Arquitectura',
        ejemplo: 'Las cúpulas de algunos edificios (como el Palacio de Bellas Artes) tienen perímetros descritos por secciones parabólicas que distribuyen el peso óptimamente.',
      },
    ],
  };

  // ── Configuración Mission Briefing para BIO-01 ───────────────────────────────────
  const bio1BriefingConfig: BriefingConfig = {
    codigo: 'BIO-01',
    titulo: 'Microscopio Virtual',
    subtitulo: 'Límites de Resolución y Óptica Celular',
    acento: '#10b981', // Emerald 500
    duracion: 30,
    bienvenida: `¡Bienvenido al Laboratorio de Óptica y Citología! Soy el Dr. Quantum. Hoy no solo vamos a mirar por un ocular, vamos a dominar la física de la luz.\n\nEn biología, hacer "zoom infinito" no sirve de nada si pierdes la resolución. La verdadera habilidad científica reside en manipular el índice de refracción y la profundidad de campo para revelar el universo invisible que se esconde en una simple gota de sangre o una hoja vegetal.\n\nTu misión: Configurar óptimamente el microscopio, aplicar la Fórmula de Abbe y capturar una micrografía con resolución nanométrica.`,
    conceptos: [
      {
        icono: '🔬',
        nombre: 'Límite de Resolución (Abbe)',
        descripcion: 'd = λ / (2·NA). Distancia mínima entre dos puntos para que el microscopio los vea separados. Menor es mejor. Depende de la luz (λ) y el lente (NA).',
      },
      {
        icono: '👁️',
        nombre: 'Apertura Numérica (NA)',
        descripcion: 'Capacidad del objetivo para capturar los rayos de luz. Un NA de 1.25 (Inmersión) capta más detalles resolutivos que un NA de 0.10 (4x).',
      },
      {
        icono: '🎯',
        nombre: 'Magnificación Total',
        descripcion: 'Es el producto del aumento del ocular (usualmente 10x) y el aumento del objetivo (4x, 10x, 40x, 100x).',
      },
      {
        icono: '📏',
        nombre: 'Profundidad de Campo (DOF)',
        descripcion: 'Grosor de la capa de la muestra que se encuentra perfectamente enfocada. A mayor aumento, el DOF cae dramáticamente, exigiendo uso del tornillo micrométrico.',
      },
      {
        icono: '⚙️',
        nombre: 'Tornillos Focales',
        descripcion: 'Macrométrico: movimientos amplios del eje Z, usado solo en bajos aumentos. Micrométrico: enfoque fino obligatorio en 40x y 100x.',
      },
      {
        icono: '💡',
        nombre: 'Iluminación de Köhler',
        descripcion: 'Principio para lograr luz uniforme y máximo contraste. A mayores aumentos del objetivo se requiere abrir más el condensador de luz.',
      },
    ],
    mision: [
      'Identifica la MUESTRA ASIGNADA (Sangre o Epidermis Vegetal) en el panel superior derecho de tu Bitácora.',
      'Inicia con el Objetivo de Menor Aumento (4x). Usa el Tornillo Macrométrico para encontrar un punto de enfoque base.',
      'Aumenta al Objetivo de 10x y luego al de 40x. Notarás que la imagen se desenfoca (Blur) instantáneamente al cambiar de lente. ¡Usa solo el Tornillo Micrométrico ahora!',
      'Registra la MAGNIFICACIÓN TOTAL actual (Recuerda que el Ocular es de 10x).',
      'Calcula el LÍMITE DE ABBE asumiendo una longitud de onda media (λ = 550nm) e ingresa tu resultado para su verificación.',
      'Anota tu conclusión sobre la relación entre el enfoque y la magnificación. Cuando tengas los candados verdes, somete tu micrografía.',
    ],
    aplicaciones: [
      {
        area: 'Oncología Clínica',
        ejemplo: 'Patólogos ajustan la resolución microscópica límite para diferenciar células benignas de células cancerígenas basándose en la deformación sutil de la membrana nuclear.',
      },
      {
        area: 'Microbiología Forense',
        ejemplo: 'Uso de objetivos de inmersión en aceite (100x) y alto NA para identificar la especie de bacterias en la escena de un crimen observando su morfología (Cocos vs Bacilos).',
      },
      {
        area: 'Botánica Agrícola',
        ejemplo: 'Monitoreo de la eficiencia fotosintética observando la densidad y distribución de los cloroplastos en el parénquima en empalizada de hojas estresadas por sequía.',
      },
    ],
  };

  // ── Configuración Mission Briefing para FIS-01 ───────────────────────────────────
  const fis1BriefingConfig: BriefingConfig = {
    codigo: 'FIS-01',
    titulo: 'Tiro Parabólico',
    subtitulo: 'Cinemática Bidimensional y Balística Clásica',
    acento: '#38bdf8', // Sky 400
    duracion: 35,
    bienvenida: `¡Bienvenido al Polígono de Artillería Orbital Avanzada! Soy el Dr. Quantum.\n\nLa cinemática escolar de alcance simétrico se ha terminado. En la ingeniería militar y aeroespacial los cañones se posicionan en altiplanicies asimétricas (Y₀ > 0) y los proyectiles deben superar defensas estáticas de gran magnitud.\n\nTu misión es calibrar matemáticamente la potencia bruta de tu artillería evaluando ecuaciones cuadráticas completas para no colisionar contra el muro y acertar al dron.`,
    conceptos: [
      {
        icono: '✈️',
        nombre: 'Trayectoria Vectorial Completa',
        descripcion: 'El movimiento parabolico asimétrico se describe con: y(x) = y₀ + x·tan(θ) - (g·x²) / (2v₀²·cos²(θ)). Esta ecuación mapea la altura y para cualquier distancia x.',
      },
      {
        icono: '🧱',
        nombre: 'Detección de Colisiones',
        descripcion: 'Se debe cumplir estrictamente que y(x_obs) > y_obs. Si fallas en calcular el ápex adecuado, destruirás el muro antes de alcanzar el objetivo.',
      },
      {
        icono: '🧮',
        nombre: 'Cálculo de Raíces Asimétricas',
        descripcion: 'Ya que partes desde Y₀, para saber en qué distancia impactarás el suelo (y=0) requieres encontrar las raíces del polinomio usando la Fórmula General Cuadrática.',
      },
    ],
    mision: [
      'Identifica los 3 vectores clave arrojados por la telemetría dinámica: Altura del Cañón Y₀, Posición del Obstáculo X/Y, y el Objetivo Target X.',
      'Aplica tus conocimientos universitarios de estática y dinámica. Utiliza tu libreta y calculadora para definir un Ángulo y Velocidad.',
      'Sustituye tus parámetros de fuego propuestos en la ecuación general para que el intercepto con Y=0 sea igual métricamente a tu Dron Objetivo.',
      'Dispara la carga de prueba. Si colisiona con el escudo, recalcula la tangente.',
      'Al erradicar el dron, solicita tu validación presionando la verificación global.',
    ],
    aplicaciones: [
      {
        area: 'Ingeniería Aeroespacial',
        ejemplo: 'Cálculo de trayectorias suborbitales de sondas, y control de recuperación de boosters mediante el modelado balístico atmosférico.',
      },
      {
        area: 'Simulación de Videojuegos',
        ejemplo: 'Desarrollo de Game Engines (Unreal, Unity) que renderizan comportamientos físicos ultra-realistas inyectando un vector constante y multiplicadores de gravedad por cada frame.',
      },
      {
        area: 'Prevención de Incendios Acuíferos',
        ejemplo: 'Los cañones de agua hidroneumáticos necesitan de cálculos de alta presión y ángulos para que el flujo alcance la turbulencia superior de árboles o aeronaves en altitud.',
      },
    ],
  };

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
      if (normalizedId === 'quimica-1') {
        const ok = useSimuladorStore.getState().validarEstructura();
        if (ok) { audio.playSuccess(); setShowSuccess(true); }
        else { audio.playError(); }
      } else if (normalizedId === 'matematicas-1') {
        const ok = useSimuladorStore.getState().validarM1();
        if (ok) { audio.playSuccess(); setShowSuccess(true); }
        else { audio.playError(); }
      } else if (normalizedId === 'biologia-1') {
        // En BIO-01, se delega a la validación de la capa de biologiaSlice
        const ok = useSimuladorStore.getState().validarB1();
        if (ok) { audio.playSuccess(); setShowSuccess(true); }
        else { 
          audio.playError(); 
          alert("Aún no tienes el enfoque ideal o falta calcular el Límite de Abbe y registrar la captura en bitácora.");
        }
      } else if (normalizedId === 'fisica-1') {
        const ok = useSimuladorStore.getState().validarF1();
        if (ok) { audio.playSuccess(); setShowSuccess(true); }
        else { 
          audio.playError(); 
          alert("Acceso Denegado. Primero debes calibrar tus variables y conseguir al menos un IMPACTO CONFIRMADO en un blanco para certificar la balística.");
        }
      } else {
        setShowSuccess(true);
      }
    }, 2000);
  };

  const renderPiloto = () => {
    switch (normalizedId) {
      case 'quimica-1': return <PilotoConstruccionAtomica isWorktableDark={false} />;
      case 'quimica-2': return <PilotoLeyesGases />;
      case 'quimica-3': return <PilotoBalanceoEcuaciones />;
      case 'quimica-4': return <PilotoReactivoLimitante />;
      case 'quimica-5': return <PilotoPreparacionSoluciones />;
      case 'quimica-6': return <PilotoSolubilidadCristalizacion />;
      case 'quimica-7': return <PilotoTitulacionAcidoBase />;
      case 'quimica-8': return <PilotoEquilibrioQuimico />;
      case 'quimica-9': return <PilotoCeldasGalvanicas />;
      case 'quimica-10': return <PilotoDestilacionFraccionada />;
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
      default: return <PilotoConstruccionAtomica isWorktableDark={false} />;
    }
  };

  const renderBitacora = () => {
    switch (normalizedId) {
      case 'quimica-1': return <BitacoraConstruccionAtomica />;
      case 'quimica-2': return <BitacoraLeyesGases />;
      case 'quimica-3': return <BitacoraBalanceoEcuaciones />;
      case 'quimica-4': return <BitacoraReactivoLimitante />;
      case 'quimica-5': return <BitacoraPreparacionSoluciones />;
      case 'quimica-6': return <BitacoraSolubilidadCristalizacion />;
      case 'quimica-7': return <BitacoraTitulacionAcidoBase />;
      case 'quimica-8': return <BitacoraEquilibrioQuimico />;
      case 'quimica-9': return <BitacoraCeldasGalvanicas />;
      case 'quimica-10': return <BitacoraDestilacion />;
      case 'fisica-1': return <BitacoraTiroParabolico />;
      case 'fisica-2': return <BitacoraPlanoInclinado />;
      case 'fisica-3': return <BitacoraPenduloSimple />;
      case 'fisica-4': return <BitacoraLeyHooke />;
      case 'fisica-5': return <BitacoraColisiones1D />;
      case 'fisica-6': return <BitacoraArquimedes />;
      case 'fisica-7': return <BitacoraDilatacionTermica />;
      case 'fisica-8': return <BitacoraLeyOhm />;
      case 'fisica-9': return <BitacoraElectrostatica />;
      case 'fisica-10': return <BitacoraMotorElectrico />;
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
      case 'biologia-1': return <BitacoraMicroscopio />;
      case 'biologia-2': return <BitacoraTransporte />;
      case 'biologia-3': return <BitacoraSintesis />;
      case 'biologia-4': return <BitacoraFotosintesis />;
      case 'biologia-5': return <BitacoraGenetica />;
      case 'biologia-6': return <BitacoraSeleccion />;
      case 'biologia-7': return <BitacoraSistemaNervioso />;
      case 'biologia-8': return <BitacoraElectrocardiograma />;
      case 'biologia-9': return <BitacoraSistemaDigestivo />;
      case 'biologia-10': return <BitacoraPoblaciones />;
      default: return <BitacoraDefault />;
    }
  };

  return (
    <div className="flex h-screen w-screen overflow-hidden bg-[#F8FAFC] font-['Outfit'] antialiased relative">
      <SyncManager />

      {/* ── MISSION BRIEFING ── */}
      {(() => {
        const currentBriefing = normalizedId === 'matematicas-1' ? mat1BriefingConfig : 
                                normalizedId === 'biologia-1' ? bio1BriefingConfig : 
                                normalizedId === 'fisica-1' ? fis1BriefingConfig :
                                undefined;
        // Solo mostramos si hay briefing configurado, estamos en paso 1, y el estudiante no lo ha cerrado.
        const isBriefingVisible = currentBriefing && pasoActual === 1 && showBriefing;
        return isBriefingVisible && (
          <MissionBriefing
            config={currentBriefing}
            onStart={() => setShowBriefing(false)}
          />
        );
      })()}
      
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
                    {normalizedId.startsWith('matematicas') ? 'Análisis Táctico de Funciones'
                    : normalizedId.startsWith('fisica') ? 'Protocolo de Balística Avanzada'
                    : normalizedId.startsWith('biologia') ? 'Simulación de Sistemas Biológicos'
                    : 'Protocolo de Forge Atómico'}
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
                    <p className="text-xs font-bold text-blue-100/90 leading-relaxed italic">&quot;Forja un átomo de {targetName} (Isótopo)&quot;</p>
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
                        <span className="text-[15px] font-black text-white tracking-widest font-mono">{getElectronicConfig(particulas.electrones)}</span>
                        <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-3">
                          <motion.div
                            animate={{ width: `${Math.min(100, (particulas.electrones / 10) * 100)}%` }}
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
                          currentZ={particulas.protones}
                          currentN={particulas.neutrones}
                          targetZ={particulas.targetZ}
                          targetN={particulas.targetA - particulas.targetZ}
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

            {/* Ocultar el panel inferior con tutor dinmánico (Dr. Quantum) para simuladores Diamond que ya usan DrQuantumTutor */}
            {normalizedId !== 'matematicas-1' && normalizedId !== 'fisica-1' && normalizedId !== 'biologia-1' && (
            <div className="p-4 mt-auto border-t border-white/5 bg-black/20">
                <AsistenteVirtual
                  isVisible={true}
                  onClose={() => {}}
                  text={
                    isValidating
                      ? "Ejecutando análisis de resolución nuclear... comparando con espectro de masas estándar."
                      : pasoActual === 4
                        ? `Núclido ${targetName} configurado. Procede con la validación para certificar el isótopo.`
                        : (particulas.targetCharge ?? 0) !== 0
                          ? `Modo Ión activo. Recuerda: e⁻ esperados = Z - carga = ${particulas.targetZ - (particulas.targetCharge ?? 0)}.`
                          : `Protocolo activo: construye ${targetName}. Verifica N/Z en el Diagrama de Segré.`
                  }
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
        <header className="h-20 bg-white border-b border-slate-100 px-10 flex items-center justify-between z-10">
           <div className="flex items-center gap-6">
              <div className="flex flex-col">
                <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Sincronicación Escolar</span>
                <span className="text-sm font-black text-[#023047]">Status: {particulas.isStable ? 'Estable' : 'Alerta'}</span>
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
           <div className="flex-1 relative bg-slate-100 shadow-inner">
              {renderPiloto()}
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
          {showSuccess && (() => {
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
                      <button onClick={() => { resetPractica(); router.push('/alumno/laboratorio/quimica'); }} className="flex-1 py-5 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-[1.5rem]">Finalizar</button>
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
                      <button onClick={() => { resetM1(); router.push('/alumno/laboratorio/matematicas'); }} className="flex-1 py-5 bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-rose-500/20 transition-all">Finalizar</button>
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
                      <button onClick={() => { state.resetB1(); router.push('/alumno/laboratorio/biologia'); }} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all">Finalizar</button>
                    </div>
                  </motion.div>
                </div>
              );
            }
            return null;
          })()}

          {showExitModal && (
            <div className="fixed inset-0 z-[300] flex items-center justify-center bg-[#023047]/60 backdrop-blur-md">
               <div className="bg-white rounded-[3rem] p-10 max-w-sm w-full text-center border-b-[12px] border-red-500">
                  <div className="w-20 h-20 bg-red-50 text-red-500 rounded-3xl flex items-center justify-center mx-auto mb-8"><AlertCircle size={40} /></div>
                  <h3 className="text-2xl font-black text-[#023047] uppercase mb-6 tracking-tighter">¿Pausar Sesión?</h3>
                  <div className="flex gap-4">
                     <button onClick={() => setShowExitModal(false)} className="flex-1 py-4 bg-slate-100 text-slate-500 font-black rounded-2xl">Seguir</button>
                     <button onClick={() => router.push('/alumno/laboratorio/quimica')} className="flex-1 py-4 bg-red-500 text-white font-black rounded-2xl">Salir</button>
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
        </AnimatePresence>
      </main>
    </div>
  );
}
