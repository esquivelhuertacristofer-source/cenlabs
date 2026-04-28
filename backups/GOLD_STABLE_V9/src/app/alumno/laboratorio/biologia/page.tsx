"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { 
  Play, ArrowLeft, Clock, User, Search, Microscope, Dna, 
  Droplets, Zap, Binary, Wind, Brain, Heart, FlaskConical, Users, Activity
} from 'lucide-react';
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

const practicasBiologia: Practica[] = [
  { id: 1, modulo: "Biología Celular y Molecular", titulo: "Microscopio Virtual", duracion: "30 min", teoria: "Explora la ultraestructura celular haciendo zoom profundo desde el tejido hasta los orgánulos operando en tiempo real.", estado: "activo", destacada: true },
  { id: 2, modulo: "Biología Celular y Molecular", titulo: "Transporte Celular", duracion: "35 min", teoria: "Manipula los gradientes de concentración y observa la ósmosis y la difusión a través de una membrana semipermeable.", estado: "activo" },
  { id: 3, modulo: "Biología Celular y Molecular", titulo: "Síntesis de Proteínas", duracion: "40 min", teoria: "Simula el dogma central de la biología: transcribe ADN a ARN mensajero y traduce el código en una cadena de aminoácidos.", estado: "activo" },
  { id: 4, modulo: "Biología Celular y Molecular", titulo: "Laboratorio de Fotosíntesis", duracion: "45 min", teoria: "Ajusta la intensidad luminosa y el espectro de color para maximizar la producción de oxígeno en una planta acuática.", estado: "activo" },
  { id: 5, modulo: "Genética y Evolución", titulo: "Leyes de Mendel", duracion: "30 min", teoria: "Cruza fenotipos parentales y analiza estadísticamente las proporciones genéticas de cientos de descendientes generados al instante.", estado: "activo" },
  { id: 6, modulo: "Genética y Evolución", titulo: "Selección Natural", duracion: "40 min", teoria: "Ejerce presión selectiva como depredador en diferentes ecosistemas y observa cómo la población de polillas se adapta para sobrevivir.", estado: "activo" },
  { id: 7, modulo: "Anatomía y Ecología", titulo: "Sistema Nervioso (Arco Reflejo)", duracion: "35 min", teoria: "Aplica un estímulo físico y rastrea el impulso eléctrico desde el nervio sensorial hasta la contracción muscular involuntaria.", estado: "activo" },
  { id: 8, modulo: "Anatomía y Ecología", titulo: "Electrocardiograma (ECG)", duracion: "40 min", teoria: "Monitorea la actividad eléctrica del corazón y observa cómo responde el trazado de la onda PQRST ante cambios fisiológicos.", estado: "activo" },
  { id: 9, modulo: "Anatomía y Ecología", titulo: "Sistema Digestivo", duracion: "45 min", teoria: "Visualiza la acción enzimática descomponiendo macronutrientes a nivel molecular y su posterior absorción en el torrente sanguíneo.", estado: "activo" },
  { id: 10, modulo: "Anatomía y Ecología", titulo: "Dinámica de Poblaciones", duracion: "35 min", teoria: "Altera las tasas de natalidad y depredación en un ecosistema simulado para observar las fluctuaciones del modelo Depredador-Presa.", estado: "activo" }
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

  const getBioIcon = (id: number) => {
    switch(id) {
        case 1: return <Microscope size={120} strokeWidth={0.5} />;
        case 2: return <Droplets size={120} strokeWidth={0.5} />;
        case 3: return <Dna size={120} strokeWidth={0.5} />;
        case 4: return <Zap size={120} strokeWidth={0.5} />;
        case 5: return <Binary size={120} strokeWidth={0.5} />;
        case 6: return <Wind size={120} strokeWidth={0.5} />;
        case 7: return <Brain size={120} strokeWidth={0.5} />;
        case 8: return <Heart size={120} strokeWidth={0.5} />;
        case 9: return <FlaskConical size={120} strokeWidth={0.5} />;
        case 10: return <Users size={120} strokeWidth={0.5} />;
        default: return <Activity size={120} strokeWidth={0.5} />;
    }
  };

  return (
    <div 
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={handleMouseEnter}
        onMouseLeave={handleMouseLeave}
        className={`md:col-span-2 relative bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col md:flex-row justify-between group overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(20,184,166,0.3)] border-l-8 border-l-teal-500`}
    >
        <div 
            className="pointer-events-none absolute -inset-px opacity-0 transition-opacity duration-300 z-30 mix-blend-overlay hidden md:block"
            style={{
                opacity,
                background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(20,184,166,0.1), transparent 40%)`,
            }}
        />

        <div className="relative z-20 w-full p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:pr-[35%] lg:pr-[30%] pointer-events-none">
           <div className="w-full">
               <span className={`inline-flex items-center gap-2 px-4 py-1.5 bg-teal-500/10 ${accentText} rounded-lg text-xs font-black uppercase tracking-widest mb-4 border border-teal-500/20`}>
                 <div className={`w-2 h-2 rounded-full bg-teal-500 animate-pulse`}></div>
                 {practica.modulo} • ID: BIO-{practica.id}
               </span>
               <h3 className={`text-3xl font-black text-[#1E1B4B] dark:text-white leading-tight mb-4 group-hover:text-teal-500 transition-colors`}>{practica.titulo}</h3>
               <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 text-base leading-relaxed">{practica.teoria}</p>
               
               <div className="flex flex-wrap items-center gap-4 pointer-events-auto">
                 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Clock size={18} className="text-teal-500" />
                    <span>{practica.duracion}</span>
                 </div>
                 <div className="flex items-center gap-2 text-teal-500 dark:text-teal-400 font-bold bg-teal-50 dark:bg-teal-500/10 px-5 py-2.5 rounded-xl border border-teal-500/20">
                    <Activity size={18} />
                    <span>Simulación Biológica</span>
                 </div>
               </div>
           </div>
        
           <div className="relative z-20 w-full md:w-auto mt-4 md:mt-0 flex md:block justify-start md:justify-end pointer-events-auto">
              <Link href={`/alumno/simulador/biologia-${practica.id}`} className={`px-6 py-4 md:w-16 md:h-16 md:px-0 md:py-0 md:rounded-full rounded-xl ${accentBg} text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 gap-2 font-bold`}>
                 <span className="md:hidden">Iniciar Simulación</span>
                 <Play fill="currentColor" size={24} className="md:ml-1 hidden md:block" />
              </Link>
           </div>
        </div>

        {/* IMAGEN DECORATIVA 3D ACTUALIZADA */}
        <div className="absolute inset-y-0 right-0 w-[45%] md:w-[40%] lg:w-[35%] pointer-events-none hidden sm:block z-10">
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0A1121] via-transparent to-transparent z-20 w-full h-full"></div>
            <img 
                src={`/images/biologia/bio_prac_${practica.id}.png`} 
                alt={`Render 3D ${practica.titulo}`} 
                className="w-full h-full object-contain opacity-90 transition-transform duration-700 group-hover:scale-110 group-hover:opacity-100 object-center" 
            />
        </div>
    </div>
  );
};

// ==========================================
// Página Principal
// ==========================================

export default function BiologiaCatalogPage() {
  const [activeTab, setActiveTab] = useState("Biología Celular y Molecular");
  const [searchQuery, setSearchQuery] = useState("");
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
  };

  const completedCount = 0; 
  const progreso = (completedCount / 10) * 100;
  const destacada = practicasBiologia.find(p => p.destacada) || practicasBiologia[0];

  const filteredPracticas = practicasBiologia.filter(p => {
    const matchTab = p.modulo === activeTab;
    const matchSearch = p.titulo.toLowerCase().includes(searchQuery.toLowerCase()) || p.teoria.toLowerCase().includes(searchQuery.toLowerCase());
    return matchTab && matchSearch;
  });

  const gradient = "bg-teal-50 dark:bg-[#0D1525]";
  const accentText = "text-teal-600 dark:text-teal-400";
  const accentBg = "bg-teal-500 hover:bg-teal-600";
  const ringColor = "stroke-teal-500 dark:stroke-teal-400";

  if (!isMounted) return null;

  return (
    <div className="min-h-screen font-['Outfit'] flex flex-col bg-slate-50 dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden relative">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden dark:opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#14b8a605_1px,transparent_1px),linear-gradient(to_bottom,#14b8a605_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-teal-500/10 dark:bg-teal-500/20 blur-[150px]"></div>
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
        <div className={`relative w-full rounded-[40px] ${gradient} border border-teal-500/20 dark:border-white/5 shadow-md overflow-hidden flex flex-col md:flex-row p-8 md:p-12 mb-8 transition-colors`}>
           <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
           </div>
           
           <div className="absolute top-0 right-0 w-[60%] md:w-[70%] lg:w-[55%] h-full z-0 pointer-events-none rounded-r-[40px] flex items-center justify-end overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-teal-50 dark:from-[#0D1525] via-transparent to-transparent z-10 w-full" />
             <img src="/images/biologia/bio_hero.png" alt="Biología 3D Scene" className="w-full h-full object-cover object-center opacity-100 transition-transform duration-1000 group-hover:scale-105" />
           </div>

           <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#0A1121] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <Microscope className={`w-8 h-8 ${accentText}`} strokeWidth={3} />
                 </div>
                 <span className={`text-sm font-black ${accentText} uppercase tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm`}>
                   Laboratorio de Biología
                 </span>
              </div>
              
              <h1 className="text-5xl md:text-6xl lg:text-[72px] font-black text-[#1E1B4B] dark:text-white leading-tight tracking-tight mb-4 transition-colors">
                Laboratorio de Biología
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-bold mb-10 w-[90%] leading-snug">
                Explora la complejidad de la vida, desde la estructura celular molecular hasta la dinámica de ecosistemas globales.
              </p>

              <div className="flex flex-wrap items-center gap-6 mt-auto">
                 <ConcentricRings progress={Math.round(progreso)} colorClass={ringColor} />
              </div>
           </div>
        </div>

        {/* 2. QUICK RESUME BANNER */}
        <div className={`w-full bg-white dark:bg-[#0A1121] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors border-t-4 border-t-teal-500`}>
           <div className="flex items-center gap-6">
             <div className="w-16 h-16 rounded-2xl bg-teal-50 dark:bg-teal-500/10 shadow-inner flex items-center justify-center border border-teal-500/20">
                <Microscope className="w-8 h-8 text-teal-500" />
             </div>
             <div>
                <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">⭐ Práctica Sugerida: Microscopio Virtual</p>
                <p className="text-2xl font-black text-[#023047] dark:text-white">{destacada?.titulo}</p>
             </div>
           </div>
           
           <Link href={`/alumno/simulador/biologia-1`} className={`px-8 py-4 rounded-xl font-black text-white text-lg ${accentBg} shadow-xl hover:shadow-2xl hover:shadow-teal-500/40 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 whitespace-nowrap`}>
             <Play size={20} fill="currentColor" />
             Iniciar Simulación
           </Link>
        </div>

        {/* 3. TABS NAVIGATION & SEARCH ROW */}
        <div className="w-full flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-gray-200 dark:border-gray-800 pb-4 mb-10">
            <h2 className="text-4xl font-black text-[#1E1B4B] dark:text-white tracking-tight shrink-0">Prácticas</h2>
            
            <div className="flex flex-col md:flex-row items-center gap-6 w-full lg:w-auto">
                <div className="flex gap-4 overflow-x-auto pt-4 pb-4 w-full md:w-auto snap-x no-scrollbar">
                    {["Biología Celular y Molecular", "Genética y Evolución", "Anatomía y Ecología"].map((tab) => {
                        const count = practicasBiologia.filter(p => p.modulo === tab).length;
                        const isActiveTab = activeTab === tab;
                        return (
                            <button
                                key={tab}
                                onClick={() => handleTabChange(tab)}
                                className={`snap-center shrink-0 px-8 py-3.5 rounded-2xl text-base font-black transition-all flex items-center gap-3 shadow-sm ${isActiveTab ? 'bg-teal-500 text-white border-2 border-teal-500 -translate-y-1 shadow-lg shadow-teal-600/30' : 'bg-white dark:bg-[#0A1121] text-slate-400 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5'}`}
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
                <div className="relative w-full sm:w-64">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input 
                       type="text" 
                       placeholder="Buscar por tema..." 
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1121] text-slate-700 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-teal-500 transition-all"
                    />
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
             <h3 className="text-2xl font-black text-teal-900 dark:text-white mb-2">No hay coincidencias</h3>
             <button 
                onClick={() => setSearchQuery("")}
                className="mt-6 px-6 py-3 rounded-xl bg-teal-50 dark:bg-slate-800 text-teal-600 dark:text-white font-bold hover:bg-teal-100 transition-colors"
              >
                Limpiar Filtros
             </button>
          </div>
        )}
      </main>
    </div>
  );
}
