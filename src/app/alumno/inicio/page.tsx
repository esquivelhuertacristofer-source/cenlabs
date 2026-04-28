"use client";

export const dynamic = 'force-dynamic';

import React, { useState, useRef, useEffect, useMemo } from 'react';
import Link from 'next/link';
import Image from 'next/image';
import { 
  FlaskConical, Zap, Microscope, Calculator, Power,
  Play, Award, ArrowRight, Atom
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import ThemeToggle from '@/components/ThemeToggle';
import { useSimuladorStore } from '@/store/simuladorStore';
import { supabase, getCurrentProfile } from '@/lib/supabase';

// ==========================================
// Componentes de UI Auxiliares
// ==========================================

const CircularProgress = ({ value, total, color }: { value: number, total: number, color: string }) => {
  const radius = 16;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (value / total) * circumference;
  
  return (
    <div className="relative w-10 h-10 flex items-center justify-center">
      <svg className="w-10 h-10 transform -rotate-90">
        <circle className="stroke-white dark:stroke-slate-800" strokeWidth="4" fill="transparent" r={radius} cx="20" cy="20" />
        <circle
          className={`${color} transition-all duration-1000 ease-out`}
          strokeWidth="4"
          strokeLinecap="round"
          fill="transparent"
          r={radius}
          cx="20"
          cy="20"
          style={{ strokeDasharray: circumference, strokeDashoffset }}
        />
      </svg>
    </div>
  );
};

const SpotlightBentoCard = ({ subject, index }: { subject: any, index: number }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const div = divRef.current;
    const rect = div.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  const handleMouseEnter = () => setOpacity(1);
  const handleMouseLeave = () => setOpacity(0);
  const MainIcon = subject.icon;

  return (
    <div 
      ref={divRef}
      onMouseMove={handleMouseMove}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
      className={`relative w-full h-[400px] md:h-[450px] rounded-[40px] ${subject.gradient} shadow-[0_20px_40px_-15px_rgba(0,0,0,0.08)] ${subject.shadowGlow} transition-all duration-700 group border border-white/60 dark:border-white/10 overflow-hidden flex flex-col sm:flex-row p-8 md:p-10 perspective-1000 stagger-${index}`}
    >
      {/* Spotlight Effect Element */}
      <div 
          className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-30 mix-blend-overlay hidden md:block"
          style={{
              opacity,
              background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(255,255,255,0.4), transparent 40%)`,
          }}
      />

      {/* Textura sutil en el fondo de toda la tarjeta */}
      <div className="absolute inset-0 z-0 pointer-events-none opacity-[0.03] dark:opacity-[0.015]">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
      </div>

      {/* 3D Render Image con Fade integrado */}
      <div className="absolute top-0 right-0 w-[60%] md:w-[55%] lg:w-[60%] h-full z-0 pointer-events-none rounded-r-[40px] transition-transform duration-700 ease-out group-hover:scale-105 origin-right">
         <div className={`absolute inset-0 bg-gradient-to-r ${subject.fadeColor} via-transparent to-transparent z-10 w-full h-full`}></div>
         <Image 
            src={subject.image} 
            alt={`Ilustración 3D de ${subject.name}`} 
            fill
            sizes="(max-width: 768px) 100vw, 50vw"
            priority={index < 2}
            className="object-cover object-left mix-blend-multiply dark:mix-blend-normal dark:opacity-80 drop-shadow-xl transition-opacity duration-500" 
         />
      </div>

      {/* Contenido Izquierdo (Textos y Botón) Z-20 asegurando que flote encima de faders */}
      <div className="relative z-20 flex flex-col justify-between h-full w-full sm:w-[55%] pointer-events-none">
        <div>
          {/* Tarjeta de Título */}
          <div className="flex items-center gap-3 mb-6">
            <div className="w-12 h-12 rounded-2xl bg-white/70 dark:bg-[#0B151F]/70 backdrop-blur-sm flex items-center justify-center shadow-sm border border-white dark:border-white/10 transition-colors">
              <MainIcon className={`w-6 h-6 ${subject.accent}`} />
            </div>
            <span className="text-sm font-bold text-[#023047]/60 dark:text-slate-400 tracking-widest uppercase transition-colors">Materia</span>
          </div>
          
          <h2 className="text-[32px] md:text-[40px] font-black text-[#023047] dark:text-white leading-tight mb-8 transition-colors group-hover:text-black dark:group-hover:text-white">
            {subject.name.replace("Laboratorio de ", "")}
          </h2>

          {/* Stats Compacto Bento */}
          <div className="flex flex-col gap-6">
            <div className="flex items-center gap-4">
               <CircularProgress value={subject.practices} total={subject.totalPractices} color={subject.ringColor} />
               <div>
                  <p className="font-black text-[#023047] dark:text-white text-2xl leading-none mb-1 transition-colors">{subject.practices} / {subject.totalPractices}</p>
                  <p className="text-xs font-bold text-[#023047]/60 dark:text-slate-400 uppercase tracking-widest transition-colors">Prácticas Completadas</p>
               </div>
            </div>

            <div className="bg-white/50 dark:bg-black/40 rounded-2xl p-4 backdrop-blur-md border border-white/60 dark:border-white/10 w-fit max-w-[240px] shadow-sm transition-colors">
               <p className="text-[10px] font-bold text-[#023047]/50 dark:text-slate-400 uppercase tracking-widest mb-1.5 transition-colors">Última Sesión de Laboratorio</p>
               <p className="text-sm font-black text-[#023047] dark:text-slate-200 truncate transition-colors">{subject.lastPractice}</p>
            </div>
          </div>
        </div>

        {/* CTA Bottom Left */}
        <div className="pointer-events-auto">
          <Link
            href={`/alumno/laboratorio/${subject.id}`}
            prefetch={true}
            className={`mt-6 w-fit px-8 py-4 rounded-2xl text-white font-bold text-base ${subject.buttonColor} shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:translate-x-1 hover:!-translate-y-1 flex items-center justify-center gap-3`}
          >
            Entrar al Catálogo
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
};

const RUTAS_ESPECIALIZACION = [
  { 
    id: 'ingenieria',
    name: "Facultad de Ingenierías", 
    desc: "Física aplicada, Cálculo avanzado y Modelado de materiales.", 
    icon: <Zap className="w-8 h-8" />, 
    image: "/images/ingenieria_claymorphic_3d_v5_1775860518999.png",
    color: "from-[#023047]/90 to-[#023047]/40"
  },
  { 
    id: 'salud',
    name: "Ciencias de la Salud", 
    desc: "Bioquímica clínica, Anatomía y Genética molecular.", 
    icon: <Microscope className="w-8 h-8" />, 
    image: "/images/salud_claymorphic_3d_v5_1775860532207.png",
    color: "from-[#FB8500]/90 to-[#FB8500]/40"
  },
  { 
    id: 'exactas',
    name: "Ciencias Exactas", 
    desc: "Matemática pura, Mecánica cuántica y Análisis teórico.", 
    icon: <Calculator className="w-8 h-8" />, 
    image: "/images/exactas_claymorphic_3d_v5_1775860544049.png",
    color: "from-[#219EBC]/90 to-[#219EBC]/40"
  }
];

// ==========================================
// Página Principal
// ==========================================
export default function AlumnoInicio() {
  const router = useRouter();
  const { user, setUser, setSession, session } = useSimuladorStore();
  
  const [quickResumeData, setQuickResumeData] = useState({ materia: "Química", modulo: "Electroquímica", path: "/alumno/simulador/quimica-9" });
  const [realProgress, setRealProgress] = useState<Record<string, number>>({
    quimica: 0,
    fisica: 0,
    biologia: 0,
    matematicas: 0
  });
  
  useEffect(() => {
    const initAuth = async () => {
      const { data: { session: currentSession } } = await supabase.auth.getSession();
      
      if (!currentSession) {
        router.push("/login");
        return;
      }

      setSession(currentSession);
      let currentUser = user;
      if (!user) {
        currentUser = await getCurrentProfile();
        if (currentUser) {
          setUser(currentUser);
        }
      }

      // --- RBAC: Solo Alumnos ---
      if (currentUser && currentUser.role !== 'alumno') {
        router.push(currentUser.role === 'profesor' ? "/" : "/login");
        return;
      }

      // --- Cargar Progreso Real (Completados e In-Progress) ---
      if (currentUser) {
        const { data: intentos } = await supabase
          .from('intentos')
          .select('sim_id, status, started_at')
          .eq('id_alumno', currentUser.id)
          .in('status', ['completed', 'in_progress'])
          .order('started_at', { ascending: false });

        if (intentos) {
          const counts: Record<string, number> = { quimica: 0, fisica: 0, biologia: 0, matematicas: 0 };
          intentos.forEach(i => {
            if (i.status === 'completed') {
              const materia = i.sim_id.split('-')[0];
              if (counts[materia] !== undefined) counts[materia]++;
            }
          });
          setRealProgress(counts);

          // Si no hay nada en localStorage, usar el más reciente de la DB para Quick Resume
          if (!localStorage.getItem("last_simulation_id") && intentos.length > 0) {
            const last = intentos[0];
            const materiaName = last.sim_id.split('-')[0].charAt(0).toUpperCase() + last.sim_id.split('-')[0].slice(1);
            setQuickResumeData({ 
              materia: materiaName, 
              modulo: last.status === 'in_progress' ? "Sesión Activa" : "Última Completada", 
              path: `/alumno/simulador/${last.sim_id}`
            });
          }
        }
      }
    };

    initAuth();

    // Simulamos la lectura asíncrona del último simulador y progreso general
    const savedId = localStorage.getItem("last_simulation_id");
    if(savedId) {
       setQuickResumeData({ materia: "Reciente", modulo: "Simulación Guardada", path: `/alumno/simulador/${savedId}`});
    }
  }, [user, setSession, setUser, router]);

  const subjects = useMemo(() => [
    {
      id: "quimica",
      name: "Laboratorio de Química",
      icon: FlaskConical,
      gradient: "bg-[#f0f9ff] dark:bg-[#0A1A2F]",
      fadeColor: "from-[#f0f9ff] dark:from-[#0A1A2F]",
      accent: "text-[#219EBC] dark:text-[#8ECAE6]",
      ringColor: "stroke-[#219EBC] dark:stroke-[#8ECAE6]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.4)] dark:hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.7)]",
      practices: realProgress.quimica,
      totalPractices: 10,
      lastPractice: realProgress.quimica > 0 ? "Última práctica completada" : "Sin actividad reciente",
      buttonColor: "bg-[#023047] hover:bg-[#126782]",
      image: "/images/quimica_3d.png"
    },
    {
      id: "fisica",
      name: "Laboratorio de Física",
      icon: Atom,
      gradient: "bg-[#fff7ed] dark:bg-[#1C140A]",
      fadeColor: "from-[#fff7ed] dark:from-[#1C140A]",
      accent: "text-[#FB8500] dark:text-[#FFB703]",
      ringColor: "stroke-[#FB8500] dark:stroke-[#FFB703]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.6)]",
      practices: realProgress.fisica,
      totalPractices: 10,
      lastPractice: realProgress.fisica > 0 ? "Última práctica completada" : "Sin actividad reciente",
      buttonColor: "bg-[#FB8500] hover:bg-[#E85D04]",
      image: "/images/fisica_3d.png"
    },
    {
      id: "biologia",
      name: "Laboratorio de Biología",
      icon: Microscope,
      gradient: "bg-[#e8f6fc] dark:bg-[#0B151F]",
      fadeColor: "from-[#e8f6fc] dark:from-[#0B151F]",
      accent: "text-[#8ECAE6] dark:text-[#A8DADC]",
      ringColor: "stroke-[#8ECAE6] dark:stroke-[#A8DADC]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(142,202,230,0.5)] dark:hover:shadow-[0_20px_50px_-12px_rgba(142,202,230,0.7)]",
      practices: realProgress.biologia,
      totalPractices: 10,
      lastPractice: realProgress.biologia > 0 ? "Última práctica completada" : "Sin actividad reciente",
      buttonColor: "bg-[#219EBC] hover:bg-[#126782]",
      image: "/images/biologia_3d.png"
    },
    {
      id: "matematicas",
      name: "Laboratorio de Matemáticas",
      icon: Calculator,
      gradient: "bg-[#fefaf0] dark:bg-[#1A180E]",
      fadeColor: "from-[#fefaf0] dark:from-[#1A180E]",
      accent: "text-[#FFB703] dark:text-[#FFD166]",
      ringColor: "stroke-[#FFB703] dark:stroke-[#FFD166]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(255,183,3,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(255,183,3,0.6)]",
      practices: realProgress.matematicas,
      totalPractices: 10,
      lastPractice: realProgress.matematicas > 0 ? "Última práctica completada" : "Sin actividad reciente",
      buttonColor: "bg-[#FFB703] hover:bg-[#FB8500]",
      image: "/images/mates_3d.png"
    },
  ], [realProgress]);

  const totalCompletadas = subjects.reduce((acc, subj) => acc + subj.practices, 0);
  const totalExistentes = subjects.reduce((acc, subj) => acc + subj.totalPractices, 0);
  const percentTotal = Math.round((totalCompletadas / totalExistentes) * 100) || 0;


  return (
    <>
    <style dangerouslySetInnerHTML={{__html: `
      @keyframes slideUpFade {
        from { opacity: 0; transform: translateY(40px); }
        to { opacity: 1; transform: translateY(0); }
      }
      .stagger-0 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.1s flex; animation-fill-mode: both; }
      .stagger-1 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.2s flex; animation-fill-mode: both; }
      .stagger-2 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.3s flex; animation-fill-mode: both; }
      .stagger-3 { animation: slideUpFade 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s flex; animation-fill-mode: both; }

      ::-webkit-scrollbar {
        width: 10px;
        height: 10px;
      }
      ::-webkit-scrollbar-track {
        background: transparent;
      }
      ::-webkit-scrollbar-thumb {
        background-color: rgba(2, 48, 71, 0.15);
        border-radius: 20px;
        border: 3px solid transparent;
        background-clip: content-box;
      }
      .dark ::-webkit-scrollbar-thumb {
        background-color: rgba(255, 255, 255, 0.2);
      }
      ::-webkit-scrollbar-thumb:hover {
        background-color: rgba(2, 48, 71, 0.3);
      }
    `}} />

    <div className="min-h-screen font-['Outfit'] flex flex-col overflow-x-hidden relative bg-[#F8FAFC] dark:bg-[#060B14] transition-colors duration-500">
      
      {/* Fondo Arquitectónico Animado (Paralaje pasivo vía scroll) */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 dark:opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#0230470A_1px,transparent_1px),linear-gradient(to_bottom,#0230470A_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#8ECAE6]/10 dark:bg-[#8ECAE6]/40 blur-[150px] animate-pulse duration-[8000ms]"></div>
        <div className="absolute top-[20%] right-[-10%] w-[50%] h-[70%] rounded-full bg-[#FB8500]/5 dark:bg-[#FB8500]/15 blur-[150px]"></div>
      </div>

      {/* Navbar Superior Flotante */}
      <div className="px-6 pt-6 sticky top-0 z-40">
        <nav className="max-w-[1600px] mx-auto bg-white/80 dark:bg-[#0A1121]/80 backdrop-blur-xl px-4 sm:px-8 py-4 flex justify-between items-center rounded-2xl shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.5)] border border-slate-200 dark:border-slate-800 transition-colors duration-500">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#023047] dark:bg-[#126782] text-white flex items-center justify-center font-bold shadow-md">
               <FlaskConical className="w-6 h-6 text-[#8ECAE6]" />
            </div>
            <span className="text-[#023047] dark:text-white font-black tracking-tight text-xl hidden sm:block">CEN Laboratorios</span>
          </div>
          
          <div className="flex items-center gap-4 sm:gap-6">
            <ThemeToggle />
            
            <div className="w-px h-8 bg-slate-200 dark:bg-slate-700 hidden sm:block transition-colors"></div>
            
            <div className="flex items-center gap-4">
              <div className="text-right hidden sm:block">
                <p className="text-sm font-black text-[#023047] dark:text-slate-200">{user?.full_name || "Cargando..."}</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">{user?.email || "CEN Labs Student"}</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#e8f6f9] dark:bg-[#126782] flex items-center justify-center sm:hidden text-[#023047] font-bold shadow-sm">
                {user?.full_name?.substring(0,2).toUpperCase() || "AM"}
              </div>
              <button 
                onClick={async () => {
                  await supabase.auth.signOut();
                  setSession(null);
                  setUser(null);
                  router.push("/login");
                }}
                className="flex items-center justify-center sm:px-4 sm:py-2 gap-2 bg-[#F8FAFC] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#023047] dark:text-slate-300 transition-colors rounded-xl border border-slate-200 dark:border-slate-800"
              >
                <Power size={18} className="currentColor" />
                <span className="text-sm font-bold hidden sm:block">Salir</span>
              </button>
            </div>
          </div>
        </nav>
      </div>

      <main className="flex-1 flex flex-col items-center px-6 pt-12 pb-24 relative z-10 overflow-y-auto">
        {/* Encabezado Principal y Consolidado de Progreso */}
        <div className="w-full max-w-[1600px] mb-12 flex flex-col lg:flex-row items-center justify-between gap-8 stagger-0">
          <div className="text-center lg:text-left">
            <h1 className="font-black text-5xl md:text-6xl text-[#023047] dark:text-white mb-2 tracking-tight transition-colors">Tus <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#023047] to-[#219EBC] dark:from-white dark:to-[#8ECAE6]">Laboratorios</span></h1>
            <p className="text-[#126782] dark:text-[#8ECAE6] text-lg font-medium transition-colors opacity-70">Dominio científico a través de la experimentación.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-6 w-full lg:w-auto">
            {/* 1. Tarjeta Resumen Gamificación: ESTILO PLATINUM */}
            <div className="w-full sm:w-auto flex items-center gap-5 bg-white/40 dark:bg-white/5 backdrop-blur-2xl px-8 py-5 rounded-[32px] border border-white/60 dark:border-white/10 shadow-[0_20px_40px_-15px_rgba(0,0,0,0.05)] relative overflow-hidden group">
               <div className="absolute top-0 right-0 w-32 h-32 bg-[#FFB703]/10 blur-[40px] rounded-full -mr-16 -mt-16 group-hover:bg-[#FFB703]/20 transition-colors"></div>
               <div className="w-14 h-14 rounded-full bg-gradient-to-br from-[#FFB703] to-[#FB8500] flex items-center justify-center p-[2px] shadow-[0_8px_20px_rgba(251,133,0,0.3)]">
                 <div className="w-full h-full rounded-full bg-white dark:bg-[#023047] flex items-center justify-center">
                   <Award className="w-7 h-7 text-[#FB8500]" />
                 </div>
               </div>
               <div>
                  <p className="text-xs font-black text-[#023047]/40 dark:text-white/40 uppercase tracking-[0.2em] mb-1">Rendimiento Académico</p>
                  <p className="text-2xl font-black text-[#023047] dark:text-white tracking-tight flex items-baseline gap-2">
                    {percentTotal}% <span className="text-sm text-[#FB8500] uppercase font-black">Platinum</span>
                  </p>
               </div>
            </div>

            {/* 2. Quick Resume Inteligente: ESTILO AURUM CONSOLE */}
            <Link href={quickResumeData.path} prefetch={true} className="w-full sm:w-auto group relative bg-[#023047] dark:bg-white rounded-[32px] p-6 shadow-[0_30px_60px_-12px_rgba(2,48,71,0.3)] dark:shadow-[0_30px_60px_-12px_rgba(255,255,255,0.1)] flex items-center gap-5 transition-all hover:-translate-y-2 hover:shadow-[0_45px_70px_-12px_rgba(2,48,71,0.4)] overflow-hidden">
              {/* Shimmer Effect */}
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000" />
              
              <div className="relative w-14 h-14 bg-gradient-to-br from-[#219EBC] to-[#023047] dark:from-[#8ECAE6] dark:to-[#219EBC] rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 transition-transform">
                <Play className="text-white w-6 h-6 ml-1" fill="currentColor" />
                <div className="absolute inset-0 rounded-2xl animate-ping border-2 border-[#8ECAE6]/30"></div>
              </div>
              <div className="relative z-10">
                <p className="text-[10px] font-black text-[#8ECAE6] dark:text-[#219EBC] uppercase tracking-[0.2em] mb-1 flex items-center gap-2">
                  <span className="w-2 h-2 rounded-full bg-[#FB8500] shadow-[0_0_10px_#FB8500]"></span>
                  Reanudar Sesión
                </p>
                <p className="text-base font-black text-white dark:text-[#023047] leading-tight">
                  {quickResumeData.materia} <br />
                  <span className="text-xs opacity-50 font-bold">{quickResumeData.modulo}</span>
                </p>
              </div>
            </Link>
          </div>
        </div>

        {/* ── SECCIÓN DE MATERIAS: BENTO CATALOG ── */}
        <div className="w-full max-w-[1600px] mb-12 flex items-center justify-between stagger-2">
           <h3 className="text-[#023047] dark:text-white font-black uppercase tracking-[0.4em] text-xs">Catálogo por Materias</h3>
           <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800 ml-6"></div>
        </div>

        <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10 stagger-3 mb-24">
          {subjects.map((subject, index) => (
             <SpotlightBentoCard 
               key={subject.id} 
               subject={subject} 
               index={index} 
             />
          ))}
        </div>

        {/* ── SECCIÓN DE RUTAS: CINEMATIC GATEWAYS (ESTILO UNIVERSITARIO ELITE) ── */}
        <div className="w-full max-w-[1600px] mb-20 stagger-1">
          <div className="flex items-center gap-6 mb-12">
             <div className="h-[2px] w-32 bg-gradient-to-r from-[#219EBC] to-transparent"></div>
             <h3 className="text-[#023047] dark:text-white font-black uppercase tracking-[0.5em] text-[10px] opacity-60">Rutas de Especialización Profesional</h3>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
            {RUTAS_ESPECIALIZACION.map((fac, i) => (
              <div 
                key={fac.id} 
                onClick={() => router.push(`/alumno/ruta/${fac.id}`)}
                className="group relative cursor-pointer h-[400px] rounded-[60px] overflow-hidden shadow-[0_30px_60px_-15px_rgba(0,0,0,0.3)] hover:shadow-[0_60px_100px_-20px_rgba(0,0,0,0.4)] transition-all duration-700 hover:-translate-y-4"
              >
                {/* Fondo Cinemático 3D */}
                <Image 
                  src={fac.image} 
                  alt={fac.name}
                  fill
                  sizes="(max-width: 768px) 100vw, 33vw"
                  className="object-cover transition-transform duration-[10s] group-hover:scale-110" 
                />
                
                {/* Overlay de Degradado Inteligente para Legibilidad */}
                <div className={`absolute inset-0 bg-gradient-to-t ${fac.color} mix-blend-multiply opacity-60 group-hover:opacity-40 transition-opacity z-10`}></div>
                <div className="absolute inset-0 bg-gradient-to-t from-[#060B14] via-transparent to-transparent z-10 opacitiy-80"></div>
                
                {/* Contenido Visual */}
                <div className="absolute inset-0 z-20 p-10 flex flex-col justify-between">
                   <div className="flex items-start justify-between">
                      <div className="w-16 h-16 rounded-3xl bg-white/10 backdrop-blur-xl border border-white/20 flex items-center justify-center text-white shadow-2xl group-hover:rotate-[10deg] transition-transform duration-500">
                        {fac.icon}
                      </div>
                      <div className="px-4 py-1.5 bg-black/30 backdrop-blur-md rounded-full border border-white/10 text-[8px] font-black text-white uppercase tracking-[0.3em]">
                        Nivel Universitario
                      </div>
                   </div>

                   <div className="animate-in fade-in slide-in-from-bottom-4 duration-700">
                      <h4 className="text-white font-black text-3xl tracking-tighter mb-3 leading-tight uppercase group-hover:tracking-normal transition-all">{fac.name}</h4>
                      <p className="text-white/70 text-sm font-medium leading-relaxed max-w-[240px] group-hover:text-white transition-colors">
                        {fac.desc}
                      </p>
                      <div className="mt-8 flex items-center gap-2 text-[#8ECAE6] font-black text-[10px] uppercase tracking-[0.4em] opacity-0 group-hover:opacity-100 translate-y-4 group-hover:translate-y-0 transition-all duration-500">
                         Explorar Especialidad <ArrowRight size={14} />
                      </div>
                   </div>
                </div>

                {/* Glass Border Effect al Hover */}
                <div className="absolute inset-0 border-[3px] border-white/0 group-hover:border-white/20 rounded-[60px] transition-all duration-700 pointer-events-none"></div>
              </div>
            ))}
          </div>
        </div>
      </main>
    </div>
    </>
  );
}
