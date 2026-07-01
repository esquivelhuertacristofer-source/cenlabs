"use client";

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Cog, ArrowLeft, User, Wrench, Hammer, Ruler, Sparkles } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';

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

// ==========================================
// Página Principal
// ==========================================

export default function MecanicaCatalogPage() {
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Design Tokens for Mecánica e Ingeniería
  const gradient = "bg-[#effaf7] dark:bg-[#08201C]";
  const accentText = "text-[#2A9D8F] dark:text-[#4FD1C5]";
  const ringColor = "stroke-[#2A9D8F] dark:stroke-[#4FD1C5]";

  // Anticipo de las áreas que integrará la nueva disciplina
  const areasAnticipadas = [
    { icon: Wrench, titulo: "Mecánica Aplicada", desc: "Estática, dinámica y análisis de fuerzas en estructuras y mecanismos." },
    { icon: Ruler, titulo: "Diseño de Ingeniería", desc: "Modelado, tolerancias y principios de diseño para manufactura." },
    { icon: Hammer, titulo: "Resistencia de Materiales", desc: "Esfuerzo, deformación y comportamiento de materiales bajo carga." },
  ];

  if (!isMounted) return null; // Prevenir Hydration Mismatch

  return (
    <div className="min-h-screen font-['Outfit'] flex flex-col bg-slate-50 dark:bg-[#060B14] transition-colors duration-500 overflow-x-hidden relative">
      {/* Background decoration */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden transition-opacity duration-1000 dark:opacity-30">
        <div className="absolute inset-0 bg-[linear-gradient(to_right,#02304705_1px,transparent_1px),linear-gradient(to_bottom,#02304705_1px,transparent_1px)] dark:bg-[linear-gradient(to_right,#ffffff0A_1px,transparent_1px),linear-gradient(to_bottom,#ffffff0A_1px,transparent_1px)] bg-[size:40px_40px]"></div>
        <div className="absolute top-[-10%] left-[-10%] w-[60%] h-[60%] rounded-full bg-[#2A9D8F]/10 dark:bg-[#2A9D8F]/40 blur-[150px]"></div>
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
        <div className={`relative w-full rounded-[40px] ${gradient} border border-[#2A9D8F]/20 dark:border-white/5 shadow-md overflow-hidden flex flex-col md:flex-row p-8 md:p-12 mb-8 transition-colors`}>
           <div className="absolute inset-0 z-0 opacity-[0.03] dark:opacity-[0.015] pointer-events-none">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] mix-blend-overlay"></div>
           </div>

           <div className="absolute top-0 right-0 w-[60%] md:w-[70%] lg:w-[55%] h-full z-0 pointer-events-none rounded-r-[40px] flex items-center justify-end overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#effaf7] dark:from-[#08201C] via-transparent to-transparent z-10 w-full" />
             <img src="/images/ingenieria_claymorphic_3d_v5_1775860518999.webp" alt="Mecánica e Ingeniería Decoración" className="w-full h-full object-cover object-center opacity-100 transition-transform duration-700 hover:scale-105" />
           </div>

           <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center bg-transparent p-8 md:p-0">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#023047] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <Cog className={`w-6 h-6 ${accentText}`} />
                 </div>
                 <span className={`text-sm font-black ${accentText} uppercase tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm`}>
                   Próximamente
                 </span>
              </div>

              <h1 className="text-5xl md:text-6xl lg:text-[64px] font-black text-[#023047] dark:text-white leading-tight tracking-tight mb-4 transition-colors">
                Mecánica e Ingeniería
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-bold mb-10 w-[90%] leading-snug">
                Estamos construyendo una nueva disciplina de laboratorios interactivos de ingeniería. Muy pronto podrás experimentar aquí.
              </p>

              <div className="flex flex-wrap items-center gap-6 mt-auto">
                 <ConcentricRings progress={0} colorClass={ringColor} />
              </div>
           </div>
        </div>

        {/* 2. ESTADO EN CONSTRUCCIÓN */}
        <div className="w-full flex flex-col items-center justify-center text-center p-12 md:p-16 bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px] shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] mb-12">
           <div className="w-20 h-20 rounded-3xl bg-[#effaf7] dark:bg-[#2A9D8F]/10 flex items-center justify-center border border-[#2A9D8F]/20 mb-6">
              <Cog className="w-10 h-10 text-[#2A9D8F] animate-[spin_6s_linear_infinite]" />
           </div>
           <h2 className="text-3xl md:text-4xl font-black text-[#023047] dark:text-white mb-3 tracking-tight">Laboratorio en construcción</h2>
           <p className="text-slate-500 dark:text-slate-400 font-medium max-w-xl leading-relaxed">
              Esta disciplina aún no tiene prácticas publicadas. Estamos diseñando simuladores 3D de mecánica e ingeniería con el mismo nivel de detalle que el resto de la plataforma.
           </p>
           <div className="mt-8 inline-flex items-center gap-2 px-5 py-3 rounded-xl bg-[#effaf7] dark:bg-[#2A9D8F]/10 border border-[#2A9D8F]/20 text-[#2A9D8F] dark:text-[#4FD1C5] font-black text-sm uppercase tracking-widest">
              <Sparkles size={16} />
              Nuevos laboratorios en camino
           </div>
        </div>

        {/* 3. ÁREAS ANTICIPADAS */}
        <div className="w-full">
           <div className="flex items-center gap-6 mb-8">
              <h3 className="text-[#023047] dark:text-white font-black uppercase tracking-[0.3em] text-xs shrink-0">Áreas que integrará</h3>
              <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
           </div>

           <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {areasAnticipadas.map((area) => {
                 const Icon = area.icon;
                 return (
                    <div key={area.titulo} className="relative bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[28px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.03)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.15)] overflow-hidden group border-l-8 border-l-[#2A9D8F]/40">
                       <div className="w-14 h-14 rounded-2xl bg-[#effaf7] dark:bg-[#2A9D8F]/10 flex items-center justify-center border border-[#2A9D8F]/20 mb-5">
                          <Icon className="w-7 h-7 text-[#2A9D8F] dark:text-[#4FD1C5]" />
                       </div>
                       <h4 className="text-xl font-black text-[#023047] dark:text-white mb-2 tracking-tight">{area.titulo}</h4>
                       <p className="text-sm text-slate-500 dark:text-slate-400 font-medium leading-relaxed">{area.desc}</p>
                    </div>
                 );
              })}
           </div>
        </div>
      </main>
    </div>
  );
}
