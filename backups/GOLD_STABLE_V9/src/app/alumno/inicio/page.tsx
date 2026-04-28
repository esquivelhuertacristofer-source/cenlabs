"use client";

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { 
  FlaskConical, Zap, Microscope, Calculator, Power,
  Play, Award, ArrowRight
} from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// ==========================================
// Componente de UI: Spotlight Bento Card
// ==========================================
const SpotlightBentoCard = ({ subject, index, CircularProgress }: any) => {
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
         <img src={subject.image} alt={`Ilustración 3D de ${subject.name}`} className="w-full h-full object-cover object-left mix-blend-multiply dark:mix-blend-normal dark:opacity-80 drop-shadow-xl transition-opacity duration-500" />
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
            className={`mt-6 w-fit px-8 py-4 rounded-2xl text-white font-bold text-base ${subject.buttonColor} shadow-lg hover:shadow-xl transition-all duration-300 transform group-hover:translate-x-1 hover:!-translate-y-1 flex items-center justify-center gap-3`}
          >
            Entrar al Catálogo
            <ArrowRight size={20} strokeWidth={2.5} />
          </Link>
        </div>
      </div>
    </div>
  );
}

// ==========================================
// Página Principal
// ==========================================
export default function AlumnoInicio() {
  const [quickResumeData, setQuickResumeData] = useState({ materia: "Química", modulo: "Electroquímica", path: "/alumno/simulador/quimica-9" });
  
  useEffect(() => {
    // Simulamos la lectura asíncrona del último simulador y progreso general
    const savedId = localStorage.getItem("last_simulation_id");
    if(savedId) {
       setQuickResumeData({ materia: "Reciente", modulo: "Simulación Guardada", path: `/alumno/simulador/${savedId}`});
    }
  }, []);

  const subjects = [
    {
      id: "quimica",
      name: "Laboratorio de Química",
      icon: FlaskConical,
      gradient: "bg-[#e8f6f9] dark:bg-[#0D1B2A]",
      fadeColor: "from-[#e8f6f9] dark:from-[#0D1B2A]",
      accent: "text-[#219EBC] dark:text-[#8ECAE6]",
      ringColor: "stroke-[#219EBC] dark:stroke-[#8ECAE6]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.4)] dark:hover:shadow-[0_20px_50px_-12px_rgba(33,158,188,0.6)]",
      practices: 5,
      totalPractices: 10,
      lastPractice: "Titulación Ácido-Base",
      buttonColor: "bg-[#219EBC] hover:bg-[#126782]",
      image: "/images/quimica_3d.png"
    },
    {
      id: "fisica",
      name: "Laboratorio de Física",
      icon: Zap,
      gradient: "bg-[#fef3e6] dark:bg-[#1E1204]",
      fadeColor: "from-[#fef3e6] dark:from-[#1E1204]",
      accent: "text-[#FB8500] dark:text-[#FFB703]",
      ringColor: "stroke-[#FB8500] dark:stroke-[#FFB703]",
      shadowGlow: "hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.3)] dark:hover:shadow-[0_20px_50px_-12px_rgba(251,133,0,0.6)]",
      practices: 2,
      totalPractices: 8,
      lastPractice: "Leyes de Newton",
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
      practices: 4,
      totalPractices: 12,
      lastPractice: "División Celular",
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
      practices: 1,
      totalPractices: 5,
      lastPractice: "Gráficas de Funciones",
      buttonColor: "bg-[#FFB703] hover:bg-[#FB8500]",
      image: "/images/mates_3d.png"
    },
  ];

  const totalCompletadas = subjects.reduce((acc, subj) => acc + subj.practices, 0);
  const totalExistentes = subjects.reduce((acc, subj) => acc + subj.totalPractices, 0);
  const percentTotal = Math.round((totalCompletadas / totalExistentes) * 100);

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
                <p className="text-sm font-bold text-[#023047] dark:text-slate-200">Ana Martínez</p>
                <p className="text-[10px] font-medium text-slate-400 dark:text-slate-500">Matrícula: A0372</p>
              </div>
              <div className="w-10 h-10 rounded-full bg-[#e8f6f9] dark:bg-[#126782] flex items-center justify-center sm:hidden text-[#023047] font-bold shadow-sm">
                AM
              </div>
              <Link href="/" className="flex items-center justify-center sm:px-4 sm:py-2 gap-2 bg-[#F8FAFC] dark:bg-slate-800/80 hover:bg-slate-100 dark:hover:bg-slate-700 text-[#023047] dark:text-slate-300 transition-colors rounded-xl border border-slate-200 dark:border-slate-800">
                <Power size={18} className="currentColor" />
                <span className="text-sm font-bold hidden sm:block">Salir</span>
              </Link>
            </div>
          </div>
        </nav>
      </div>

      <main className="flex-grow flex flex-col pt-10 pb-24 px-6 relative w-full items-center z-10">
        
        {/* Encabezado Principal y Consolidado de Progreso */}
        <div className="w-full max-w-[1600px] mb-12 flex flex-col lg:flex-row items-center justify-between gap-8 stagger-0">
          <div className="text-center lg:text-left">
            <h1 className="font-black text-5xl md:text-6xl text-[#023047] dark:text-white mb-2 tracking-tight transition-colors">Tus Laboratorios</h1>
            <p className="text-[#126782] dark:text-[#8ECAE6] text-lg font-medium transition-colors">Elige una materia para iniciar tus prácticas virtuales.</p>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-4 w-full lg:w-auto">
            {/* 1. Tarjeta Resumen Gamificación */}
            <div className="w-full sm:w-auto flex items-center gap-4 bg-white/80 dark:bg-[#0A1121]/80 backdrop-blur-xl px-6 py-4 rounded-2xl border border-slate-200 dark:border-slate-800 shadow-sm">
               <div className="w-12 h-12 rounded-full bg-[#FFB703]/10 dark:bg-[#FFB703]/20 flex items-center justify-center border border-[#FFB703]/30">
                 <Award className="w-6 h-6 text-[#FFB703]" />
               </div>
               <div>
                  <p className="text-sm font-black text-[#023047] dark:text-white mb-0.5">Avance Global: {percentTotal}%</p>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{totalCompletadas} de {totalExistentes} Ritmos Superados</p>
               </div>
            </div>

            {/* 2. Quick Resume Inteligente */}
            <Link href={quickResumeData.path} className="w-full sm:w-auto group relative w-full xl:w-auto bg-[#023047] hover:bg-[#126782] dark:bg-[#126782] dark:hover:bg-[#219EBC] transition-all rounded-2xl p-4 sm:p-5 shadow-[0_8px_30px_rgb(2,48,71,0.2)] dark:shadow-[0_8px_30px_rgb(33,158,188,0.2)] flex flex-col sm:flex-row items-center gap-4 transform hover:-translate-y-1 overflow-hidden z-10 cursor-pointer">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay opacity-20 pointer-events-none"></div>
              
              <div className="w-12 h-12 bg-white/10 rounded-xl flex items-center justify-center border border-white/20 group-hover:scale-110 transition-transform">
                <Play className="text-[#8ECAE6] dark:text-white w-6 h-6" fill="currentColor" />
              </div>
              <div className="text-center sm:text-left z-10">
                <p className="text-[10px] font-bold text-[#8ECAE6] uppercase tracking-wider mb-1 flex items-center justify-center sm:justify-start gap-1">
                  <span className="w-2 h-2 rounded-full bg-[#FB8500] animate-pulse"></span>
                  Continuar
                </p>
                <p className="text-base font-black text-white">{quickResumeData.materia}: {quickResumeData.modulo}</p>
              </div>
            </Link>
          </div>
        </div>

        {/* Muro de Mando / Bento Grid (Stagger + Spotlight Estándar) */}
        <div className="w-full max-w-[1600px] grid grid-cols-1 xl:grid-cols-2 gap-8 md:gap-10">
          {subjects.map((subject, index) => (
             <SpotlightBentoCard 
               key={subject.id} 
               subject={subject} 
               index={index} 
               CircularProgress={CircularProgress} 
             />
          ))}
        </div>
      </main>
    </div>
    </>
  );
}
