"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { FlaskConical, Play, ArrowLeft, Clock, Target, User, Search, Filter, CheckCircle2 } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

// ==========================================
// Tipos e Interfaces
// ==========================================

interface Practica {
  id: number;
  modulo: string;
  titulo: string;
  duracion: string;
  teoria: string;
  estado: string;
  destacada?: boolean;
}

const practicasQuimica: Practica[] = [
  { id: 1, modulo: "Fundamentos", titulo: "Construcción Atómica e Isótopos", duracion: "30 min", teoria: "Comprende la relación de partículas subatómicas, calculando la masa y carga neta para lograr la estabilidad isotópica.", estado: "activo" },
  { id: 2, modulo: "Fundamentos", titulo: "Leyes de los Gases (Cámara de Presión)", duracion: "40 min", teoria: "Analiza la relación PV=nRT y las leyes de Boyle y Charles alterando el volumen y la temperatura bajo estrés de presión.", estado: "activo" },
  { id: 3, modulo: "Estequiometría", titulo: "Balanceo Estequiométrico", duracion: "35 min", teoria: "Aplica la ley de la conservación de la masa ajustando los coeficientes matemáticos de reactivos y productos.", estado: "activo" },
  { id: 4, modulo: "Estequiometría", titulo: "Fábrica de Reactivo Limitante", duracion: "45 min", teoria: "Identifica matemáticamente el reactivo que se consume primero en una síntesis y calcula el sobrante en exceso.", estado: "activo" },
  { id: 5, modulo: "Estequiometría", titulo: "Preparación de Soluciones Molares", duracion: "45 min", teoria: "Domina la técnica analítica: cálculo exacto de molaridad, pesaje descontando tara y técnica precisa de aforo.", estado: "activo" },
  { id: 6, modulo: "Estequiometría", titulo: "Solubilidad y Cristalización", duracion: "35 min", teoria: "Experimenta la sobresaturación dependiente de temperatura y provoca la precipitación por choque térmico.", estado: "activo" },
  { id: 7, modulo: "Fisicoquímica", titulo: "Titulación Ácido-Base", duracion: "50 min", teoria: "Determina concentraciones desconocidas calculando la curva de pH y dominando el control de la bureta gota a gota.", estado: "activo", destacada: true },
  { id: 8, modulo: "Fisicoquímica", titulo: "Equilibrio Químico (Le Châtelier)", duracion: "35 min", teoria: "Observa y documenta el desplazamiento visual de una reacción reversible al someter el sistema a estrés térmico.", estado: "activo" },
  { id: 9, modulo: "Fisicoquímica", titulo: "Celdas Galvánicas (Electroquímica)", duracion: "45 min", teoria: "Ensambla una pila funcional identificando ánodo y cátodo, asegurando el flujo de electrones y el potencial de celda.", estado: "activo" },
  { id: 10, modulo: "Fisicoquímica", titulo: "Destilación Fraccionada", duracion: "40 min", teoria: "Separa mezclas homogéneas controlando finamente la temperatura basándote en los puntos de ebullición específicos.", estado: "activo" }
];

// ==========================================
// Componentes Secundarios
// ==========================================

const ConcentricRings = ({ progress, colorClass }: { progress: number, colorClass: string }) => {
  const globalOffset = 100 - progress;

  return (
    <div className="relative w-28 h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90">
        <circle className="stroke-black/5 dark:stroke-white/5" strokeWidth="6" fill="transparent" r="48" cx="56" cy="56" />
        <circle
          className={`${colorClass} transition-all duration-1000 ease-out`}
          strokeWidth="6" strokeLinecap="round" fill="transparent" r="48" cx="56" cy="56"
          strokeDasharray="301" strokeDashoffset={(301 * globalOffset) / 100}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center scale-90">
         <span className="text-xl font-black text-slate-800 dark:text-white leading-none">{progress}%</span>
         <span className="text-[9px] font-bold text-slate-400 uppercase tracking-widest mt-1">Avance</span>
      </div>
    </div>
  );
};

// Spotlight Card: Genera un resplandor que sigue al ratón para un efecto Premium
const SpotlightCard = ({ practica, accentBg, accentText }: { practica: Practica, accentBg: string, accentText: string }) => {
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

  return (
    <div 
        id={`quimica-${practica.id}`}
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`md:col-span-2 relative bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col md:flex-row justify-between group overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(33,158,188,0.3)] dark:hover:shadow-[0_20px_60px_-15px_rgba(33,158,188,0.5)] border-l-8 border-l-[#219EBC]`}
    >
        {/* Spotlight Effect Element */}
        <div 
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-30 mix-blend-overlay hidden md:block"
            style={{
                opacity,
                background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(33,158,188,0.1), transparent 40%)`,
            }}
        />

        {/* Contenido (Izquierda) */}
        <div className="relative z-20 w-full p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:pr-[35%] lg:pr-[30%] pointer-events-none">
           <div className="w-full">
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 ${practica.estado === 'completado' ? 'bg-green-500/10 text-green-500' : 'bg-[#e8f6f9] dark:bg-[#126782]/20 ' + accentText} rounded-lg text-xs font-black uppercase tracking-widest mb-4 border ${practica.estado === 'completado' ? 'border-green-500/20' : 'border-[#219EBC]/20'}`}>
                 <div className={`w-2 h-2 rounded-full ${practica.estado === 'completado' ? 'bg-green-500' : 'bg-[#219EBC] animate-pulse'}`}></div>
                 {practica.estado === 'completado' && <CheckCircle2 size={12} className="mr-1" />}
                 {practica.modulo} • ID: QUIMICA-{practica.id} {practica.estado === 'completado' ? '• COMPLETADA' : ''}
               </span>
               <h3 className={`text-3xl font-black ${practica.estado === 'completado' ? 'text-green-600 dark:text-green-400' : 'text-[#023047] dark:text-white'} leading-tight mb-4 group-hover:text-[#219EBC] transition-colors`}>{practica.titulo}</h3>
               <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 text-base leading-relaxed">{practica.teoria}</p>
               
               <div className="flex flex-wrap items-center gap-4 pointer-events-auto">
                 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Clock size={18} className="text-[#219EBC]" />
                    <span>{practica.duracion}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[#FB8500] dark:text-[#FFB703] font-bold bg-[#FFF8E6] dark:bg-[#FB8500]/10 px-5 py-2.5 rounded-xl border border-[#FB8500]/20">
                    <Target size={18} />
                    <span>Motor Interactivo 3D</span>
                 </div>
               </div>
           </div>
        
           {/* CTA Button */}
           <div className="relative z-20 w-full md:w-auto mt-4 md:mt-0 flex md:block justify-start md:justify-end pointer-events-auto">
              <Link href={`/alumno/simulador/quimica-${practica.id}`} className={`px-6 py-4 md:w-16 md:h-16 md:px-0 md:py-0 md:rounded-full rounded-xl ${accentBg} text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 gap-2 font-bold`}>
                 <span className="md:hidden">Iniciar Simulación</span>
                 <Play fill="currentColor" size={24} className="md:ml-1 hidden md:block" />
              </Link>
           </div>
        </div>

        {/* IMAGEN 3D CON FADE HORIZONTAL (Derecha encapsulada) */}
        <div className="absolute inset-y-0 right-0 w-[45%] md:w-[40%] lg:w-[35%] pointer-events-none hidden sm:block z-10">
            {/* Gradiente degradado tipo máscara para fusionar el borde izquierdo de la imagen con el fondo de la ficha */}
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0A1121] via-transparent to-transparent z-10 w-full h-full"></div>
            <img 
                src={`/images/quimica/prac_${practica.id}.png`} 
                alt={`Icono 3D ${practica.titulo}`} 
                className="w-full h-full object-cover object-left md:object-center opacity-85 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100" 
            />
        </div>
    </div>
  );
};


// ==========================================
// Página Principal
// ==========================================

export default function QuimicaCatalogPage() {
  const [activeTab, setActiveTab] = useState("Fundamentos");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDuration, setFilterDuration] = useState<"all" | "<40" | ">=40">("all");
  const [isMounted, setIsMounted] = useState(false);

  // Recuperar Tab anterior persistido y procesar auto-scroll
  useEffect(() => {
    setIsMounted(true);
    const savedTab = localStorage.getItem("quimica_active_tab");
    if (savedTab && ["Fundamentos", "Estequiometría", "Fisicoquímica"].includes(savedTab)) {
      setActiveTab(savedTab);
    }

    if (typeof window !== 'undefined') {
       const searchParams = new URLSearchParams(window.location.search);
       const targetId = searchParams.get("id");
       if (targetId) {
          setTimeout(() => {
             const element = document.getElementById(targetId);
             if (element) {
                element.scrollIntoView({ behavior: 'smooth', block: 'center' });
                element.classList.add('ring-4', 'ring-[#219EBC]', 'ring-offset-8', 'ring-offset-slate-50', 'dark:ring-offset-[#060B14]', 'transition-all', 'duration-1000', 'scale-[1.02]');
                setTimeout(() => {
                   element.classList.remove('ring-4', 'ring-[#219EBC]', 'ring-offset-8', 'ring-offset-slate-50', 'dark:ring-offset-[#060B14]', 'scale-[1.02]');
                }, 3000);
             }
          }, 500);
       }
    }
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    localStorage.setItem("quimica_active_tab", tab);
  };

  const completedCount = practicasQuimica.filter(p => p.estado === 'completado').length;
  const progreso = (completedCount / 10) * 100;
  const destacada = practicasQuimica.find(p => p.destacada) || practicasQuimica[0];

  // Motor de Búsqueda y Filtrado Dual
  const filteredPracticas = practicasQuimica.filter(p => {
    // 1. Filtrado por Tab
    const matchTab = p.modulo === activeTab;
    
    // 2. Filtrado por Búsqueda (Texto)
    const matchSearch = 
        p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || 
        p.teoria.toLowerCase().includes(searchQuery.toLowerCase());
    
    // 3. Filtrado por Duración
    let matchDuration = true;
    const durationNum = parseInt(p.duracion.split(" ")[0]);
    if (filterDuration === "<40") matchDuration = durationNum < 40;
    if (filterDuration === ">=40") matchDuration = durationNum >= 40;

    return matchTab && matchSearch && matchDuration;
  });

  // Design Tokens for Chemistry
  const gradient = "bg-[#e8f6f9] dark:bg-[#0D1B2A]";
  const accentText = "text-[#219EBC] dark:text-[#8ECAE6]";
  const accentBg = "bg-[#219EBC] hover:bg-[#126782]";
  const ringColor = "stroke-[#219EBC] dark:stroke-[#8ECAE6]";

  if (!isMounted) return null; // Prevenir Hydration Mismatch

  return (
    <div className="min-h-screen font-['Outfit'] flex flex-col bg-slate-50 dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden relative">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 dark:opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#02304705_1px,transparent_1px),linear-gradient(to_bottom,#02304705_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#8ECAE6]/10 dark:bg-[#8ECAE6]/40 blur-[150px]"></div>
      </div>

      <div className="px-6 pt-6 sticky top-0 z-40 w-full max-w-[1600px] mx-auto">
        <nav className="bg-white/90 dark:bg-[#0A1121]/90 backdrop-blur-xl px-4 sm:px-6 py-4 flex justify-between items-center rounded-2xl shadow-sm border border-slate-200 dark:border-slate-800 transition-colors">
          <Link href="/alumno/inicio" className="flex items-center gap-2 px-4 py-2 bg-slate-100/50 dark:bg-slate-800/50 hover:bg-slate-200 dark:hover:bg-slate-700 rounded-xl transition-colors text-slate-600 dark:text-slate-300 font-bold text-sm">
            <ArrowLeft size={18} />
            <span className="hidden sm:inline">Volver al Hub</span>
          </Link>
          <div className="flex items-center gap-4">
            <ThemeToggle />
            <div className="w-10 h-10 rounded-full bg-slate-100 dark:bg-slate-800 flex items-center justify-center text-slate-500 dark:text-slate-400 shadow-sm border border-slate-200 dark:border-slate-700">
               <User size={18} />
            </div>
          </div>
        </nav>
      </div>

      <main className="flex-grow flex flex-col pt-8 pb-32 px-6 w-full max-w-[1600px] mx-auto z-10">
        
        {/* 1. HERO SECTION */}
        <div className={`relative w-full rounded-[40px] ${gradient} border border-[#219EBC]/20 dark:border-white/5 shadow-md overflow-hidden flex flex-col md:flex-row p-8 md:p-12 mb-8 transition-colors`}>
           <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
           </div>
           
           <div className="absolute top-0 right-0 w-[60%] md:w-[70%] lg:w-[55%] h-full z-0 pointer-events-none rounded-r-[40px] flex items-center justify-end overflow-hidden">
             {/* Fade horizontal para integrar perfectamente con el background */}
             <div className="absolute inset-0 bg-gradient-to-r from-[#e8f6f9] dark:from-[#0D1B2A] via-transparent to-transparent z-10 w-full" />
             <img src="/images/quimica_3d.png" alt="Química Decoración" className="w-full h-full object-cover object-center opacity-100 transition-transform duration-700 hover:scale-105" />
           </div>

           <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center bg-transparent backdrop-blur-none p-8 md:p-0 rounded-none border-none">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#023047] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <FlaskConical className={`w-6 h-6 ${accentText}`} />
                 </div>
                 <span className={`text-sm font-black ${accentText} uppercase tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm`}>
                   Laboratorio Activo
                 </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-[#023047] dark:text-white leading-tight tracking-tight mb-4 transition-colors">
                Laboratorio de Química
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-bold mb-10 w-[90%] leading-snug">
                Módulo interactivo completo de Fundamentos, Estequiometría y Fisicoquímica en tiempo real.
              </p>

              <div className="flex flex-wrap items-center gap-6 mt-auto">
                 <ConcentricRings progress={Math.round(progreso)} colorClass={ringColor} />
              </div>
           </div>
        </div>

        {/* 2. QUICK RESUME BANNER */}
        <div className={`w-full bg-white dark:bg-[#0A1121] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors border-t-4 border-t-[#FB8500]`}>
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-[#FFF8E6] dark:bg-[#FB8500]/10 shadow-inner flex items-center justify-center animate-pulse duration-3000 border border-[#FB8500]/20">
                <Play className="w-8 h-8 text-[#FB8500]" fill="currentColor" />
             </div>
             <div>
               <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">⭐ Práctica Destacada Sugerida</p>
               <p className="text-2xl font-black text-[#023047] dark:text-white">{destacada?.titulo}</p>
             </div>
           </div>
           
           <Link href={`/alumno/simulador/quimica-${destacada.id}`} className={`px-8 py-4 rounded-xl font-black text-white text-lg ${accentBg} shadow-xl hover:shadow-2xl hover:shadow-[#219EBC]/40 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 whitespace-nowrap`}>
             <Play size={20} fill="currentColor" />
             Iniciar Simulación
           </Link>
        </div>

        {/* 3. TABS NAVIGATION & SEARCH ROW */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-4 mb-10">
            <h2 className="text-4xl font-black text-[#023047] dark:text-white tracking-tight shrink-0">Prácticas</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
                <div className="flex gap-4 overflow-x-auto pt-4 pb-4 w-full md:w-auto snap-x hidden-scrollbar">
                    {["Fundamentos", "Estequiometría", "Fisicoquímica"].map((tab) => {
                        const count = practicasQuimica.filter(p => p.modulo === tab).length;
                        const isActiveTab = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`snap-center shrink-0 px-8 py-3.5 rounded-2xl text-base font-black transition-all flex items-center gap-3 shadow-sm ${isActiveTab ? 'bg-[#219EBC] dark:bg-[#219EBC] text-white border-2 border-[#219EBC] -translate-y-1 shadow-lg shadow-[#219EBC]/30' : 'bg-white dark:bg-[#0A1121] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5'}`}
                            >
                                {tab}
                                <span className={`px-3 py-1 rounded-lg text-xs font-bold ${isActiveTab ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                                    {count}
                                </span>
                            </button>
                        )
                    })}
                </div>
            </div>
            
            <div className="flex flex-col sm:flex-row w-full lg:w-auto gap-3 shrink-0 lg:ml-auto">
                {/* Search Bar */}
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                       type="text" 
                       placeholder="Buscar reactivo o tema..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1121] text-slate-700 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#219EBC] transition-all"
                    />
                </div>
                {/* Length Filter */}
                <div className="flex items-center bg-white dark:bg-[#0A1121] rounded-xl border border-slate-200 dark:border-slate-800 p-1">
                    <button 
                       title="Todas las duraciones"
                       onClick={() => setFilterDuration("all")}
                       className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterDuration === "all" ? 'bg-slate-100 dark:bg-slate-800 text-[#023047] dark:text-white' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                       <Filter className="w-4 h-4" />
                    </button>
                    <button 
                       onClick={() => setFilterDuration("<40")}
                       className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterDuration === "<40" ? 'bg-[#219EBC]/10 text-[#219EBC] dark:bg-[#219EBC]/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                       Revisión Rápida
                    </button>
                    <button 
                       onClick={() => setFilterDuration(">=40")}
                       className={`px-3 py-2 rounded-lg text-xs font-bold transition-colors ${filterDuration === ">=40" ? 'bg-[#FB8500]/10 text-[#FB8500] dark:bg-[#FB8500]/20' : 'text-slate-400 hover:bg-slate-50 dark:hover:bg-slate-900/50'}`}
                    >
                       Avanzados (+40m)
                    </button>
                </div>
            </div>
        </div>

        {/* 4. GRID BENTO ROW PARA PRÁCTICAS */}
        {filteredPracticas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
             {filteredPracticas.map((practica) => (
                <SpotlightCard 
                  key={practica.id} 
                  practica={practica} 
                  accentBg={accentBg}
                  accentText={accentText}
                />
             ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center p-16 bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px]">
             <Search className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
             <h3 className="text-2xl font-black text-[#023047] dark:text-white mb-2">No se encontraron resultados</h3>
             <p className="text-slate-500 font-medium">Intenta ajustar tus filtros o buscar con otras palabras clave.</p>
             <button 
                onClick={() => { setSearchQuery(""); setFilterDuration("all"); }}
                className="mt-6 px-6 py-3 rounded-xl bg-slate-100 dark:bg-slate-800 text-[#023047] dark:text-white font-bold hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
              >
                Limpiar Filtros
             </button>
          </div>
        )}
      </main>
    </div>
  );
}
