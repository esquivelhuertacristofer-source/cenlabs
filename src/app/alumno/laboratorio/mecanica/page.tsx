"use client";

import React, { useState, useEffect, useRef } from 'react';
import Link from 'next/link';
import { Cog, Play, ArrowLeft, Clock, Target, User, Lock, Sparkles, Search } from 'lucide-react';
import ThemeToggle from '@/components/ThemeToggle';
import { catalogoDeCategoria, type CatalogoItem } from '@/labs/_catalogo';

// ==========================================
// Datos
// ==========================================

// El catálogo de mecánica se deriva por codegen de src/labs/mecanica-*/catalogo.ts
// (registro CATALOGO → catalogoDeCategoria). Agregar una práctica es crear su
// carpeta; esta página NO se toca. Cada item ya trae `id` ('mecanica-N') y `orden`
// (1..10) derivados del nombre de la carpeta, y viene ordenado por `orden`.
const practicasMecanica: CatalogoItem[] = catalogoDeCategoria('mecanica');

// Pestañas de módulo derivadas del catálogo, en su orden de aparición (== orden
// por número de lab), igual que en las otras cuatro materias. Un lab nuevo en un
// módulo existente NO requiere tocar esta página; uno que estrene un módulo
// aparece como pestaña nueva automáticamente.
const modulosMecanica = [...new Set(practicasMecanica.map((p) => p.modulo))];

// Módulo al que pertenece cada lab, para poder abrir la pestaña correcta cuando
// se llega con ?id=mecanica-N desde el simulador o desde el hub del alumno.
const moduloDeId = new Map(practicasMecanica.map((p) => [p.id, p.modulo]));

// ==========================================
// Componentes Secundarios
// ==========================================

const ConcentricRings = ({ progress, colorClass }: { progress: number, colorClass: string }) => {
  const globalOffset = 100 - progress;

  return (
    <div className="relative w-20 h-20 sm:w-28 sm:h-28 flex items-center justify-center">
      <svg className="w-full h-full transform -rotate-90" viewBox="0 0 112 112">
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

// Spotlight Card para labs ACTIVOS (resplandor que sigue al ratón)
const SpotlightCard = ({ practica }: { practica: CatalogoItem }) => {
  const divRef = useRef<HTMLDivElement>(null);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [opacity, setOpacity] = useState(0);

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!divRef.current) return;
    const rect = divRef.current.getBoundingClientRect();
    setPosition({ x: e.clientX - rect.left, y: e.clientY - rect.top });
  };

  return (
    <div
        id={practica.id}
        ref={divRef}
        onMouseMove={handleMouseMove}
        onMouseEnter={() => setOpacity(1)}
        onMouseLeave={() => setOpacity(0)}
        className="md:col-span-2 relative bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px] flex flex-col md:flex-row justify-between group overflow-hidden shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-all duration-500 hover:-translate-y-2 hover:shadow-[0_20px_60px_-15px_rgba(42,157,143,0.3)] dark:hover:shadow-[0_20px_60px_-15px_rgba(42,157,143,0.5)] border-l-8 border-l-[#2A9D8F]"
    >
        <div
            className="pointer-events-none absolute -inset-px transition-opacity duration-300 z-30 mix-blend-overlay hidden md:block"
            style={{
                opacity,
                background: `radial-gradient(800px circle at ${position.x}px ${position.y}px, rgba(42,157,143,0.12), transparent 40%)`,
            }}
        />

        <div className="relative z-20 w-full p-4 sm:p-8 lg:p-10 flex flex-col md:flex-row md:items-center justify-between gap-6 md:pr-[35%] lg:pr-[30%] pointer-events-none">
           <div className="w-full">
               <span className="inline-flex items-center gap-2 px-4 py-1.5 bg-[#effaf7] dark:bg-[#2A9D8F]/20 text-[#2A9D8F] dark:text-[#4FD1C5] rounded-lg text-xs font-black uppercase tracking-widest mb-4 border border-[#2A9D8F]/20">
                 <div className="w-2 h-2 rounded-full bg-[#2A9D8F] animate-pulse"></div>
                 {practica.modulo} • ID: {practica.id.toUpperCase()}
               </span>
               <h3 className="text-3xl font-black text-[#023047] dark:text-white leading-tight mb-4 group-hover:text-[#2A9D8F] transition-colors">{practica.titulo}</h3>
               <p className="text-slate-600 dark:text-slate-400 font-medium mb-8 text-base leading-relaxed">{practica.teoria}</p>

               <div className="flex flex-wrap items-center gap-4 pointer-events-auto">
                 <div className="flex items-center gap-2 text-slate-600 dark:text-slate-300 font-bold bg-slate-50 dark:bg-slate-800/50 px-5 py-2.5 rounded-xl border border-slate-100 dark:border-slate-700">
                    <Clock size={18} className="text-[#2A9D8F]" />
                    <span>{practica.duracion}</span>
                 </div>
                 <div className="flex items-center gap-2 text-[#023047] dark:text-[#4FD1C5] font-bold bg-[#effaf7] dark:bg-[#2A9D8F]/10 px-5 py-2.5 rounded-xl border border-[#2A9D8F]/20">
                    <Target size={18} />
                    <span>Simulador 3D Interactivo</span>
                 </div>
               </div>
           </div>

           <div className="relative z-20 w-full md:w-auto mt-4 md:mt-0 flex md:block justify-start md:justify-end pointer-events-auto">
              <Link href={`/alumno/simulador/${practica.id}`} className="px-6 py-4 md:w-16 md:h-16 md:px-0 md:py-0 md:rounded-full rounded-xl bg-[#2A9D8F] hover:bg-[#023047] text-white flex items-center justify-center shadow-xl transition-transform hover:scale-110 active:scale-95 gap-2 font-bold">
                 <span className="md:hidden">Iniciar Simulación</span>
                 <Play fill="currentColor" size={24} className="md:ml-1 hidden md:block" />
              </Link>
           </div>
        </div>

        {/* PORTADA: fotograma del propio simulador 3D de la práctica */}
        <div className="absolute inset-y-0 right-0 w-[45%] md:w-[40%] lg:w-[35%] pointer-events-none hidden sm:block z-10">
            {/* Gradiente degradado tipo máscara para fusionar el borde izquierdo de la imagen con el fondo de la ficha */}
            <div className="absolute inset-0 bg-gradient-to-r from-white dark:from-[#0A1121] via-transparent to-transparent z-10 w-full h-full"></div>
            {/* Si un día falta la portada, mejor la ficha sin imagen que el icono de imagen rota */}
            <img
                src={`/images/mecanica/prac_${practica.orden}.webp`}
                alt={`Vista del simulador 3D: ${practica.titulo}`}
                width={720}
                height={480}
                loading="lazy"
                decoding="async"
                onError={(e) => { e.currentTarget.style.display = 'none'; }}
                className="w-full h-full object-cover object-left md:object-center opacity-85 transition-transform duration-700 group-hover:scale-105 group-hover:opacity-100"
            />
        </div>
    </div>
  );
};

// Tarjeta para labs PROPUESTOS (bloqueada)
const PropuestoCard = ({ practica }: { practica: CatalogoItem }) => {
  const Icon = Cog;
  return (
    <div className="relative bg-slate-50/60 dark:bg-[#0A1121]/60 border border-dashed border-slate-300 dark:border-slate-700 rounded-[28px] p-8 overflow-hidden flex flex-col">
       <div className="flex items-center justify-between mb-5">
          <div className="w-14 h-14 rounded-2xl bg-white dark:bg-slate-800/50 flex items-center justify-center border border-slate-200 dark:border-slate-700">
             <Icon className="w-7 h-7 text-slate-400 dark:text-slate-500" />
          </div>
          <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-200/70 dark:bg-slate-800 text-slate-500 dark:text-slate-400 text-[10px] font-black uppercase tracking-widest">
             <Lock size={11} />
             Propuesto
          </span>
       </div>
       <span className="text-[11px] font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-2">{practica.modulo} • ID: {practica.id.toUpperCase()}</span>
       <h4 className="text-xl font-black text-slate-600 dark:text-slate-300 mb-2 tracking-tight leading-tight">{practica.titulo}</h4>
       <p className="text-sm text-slate-400 dark:text-slate-500 font-medium leading-relaxed flex-grow">{practica.teoria}</p>
       <div className="mt-6 flex items-center gap-2 text-slate-400 dark:text-slate-600 font-bold text-sm">
          <Clock size={16} />
          <span>{practica.duracion}</span>
          <span className="ml-auto text-[11px] uppercase tracking-widest font-black">En diseño</span>
       </div>
    </div>
  );
};

// ==========================================
// Página Principal
// ==========================================

export default function MecanicaCatalogPage() {
  const [isMounted, setIsMounted] = useState(false);
  const [activeTab, setActiveTab] = useState(modulosMecanica[0]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    setIsMounted(true);

    // Auto-scroll + highlight al volver de un simulador (?id=mecanica-N)
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      const targetId = searchParams.get("id");
      if (targetId) {
        // Con las prácticas repartidas en pestañas, el lab de destino casi nunca
        // está en la que se abre por defecto. Se selecciona su módulo ANTES de
        // buscar el nodo: si no, el scroll apuntaría a un elemento no montado.
        const moduloDestino = moduloDeId.get(targetId);
        if (moduloDestino) setActiveTab(moduloDestino);
        setTimeout(() => {
          const element = document.getElementById(targetId);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
            element.classList.add('ring-4', 'ring-[#2A9D8F]', 'ring-offset-8', 'ring-offset-slate-50', 'dark:ring-offset-[#060B14]', 'transition-all', 'duration-1000', 'scale-[1.02]');
            setTimeout(() => {
              element.classList.remove('ring-4', 'ring-[#2A9D8F]', 'ring-offset-8', 'ring-offset-slate-50', 'dark:ring-offset-[#060B14]', 'scale-[1.02]');
            }, 3000);
          }
        }, 500);
      }
    }
  }, []);

  const activas = practicasMecanica.filter(p => p.estado === 'activo');
  const propuestas = practicasMecanica.filter(p => p.estado === 'propuesto');
  const destacada = activas.find(p => p.destacada) || activas[0];
  const progreso = Math.round((activas.length / practicasMecanica.length) * 100);

  // Con 100+ prácticas repartidas en nueve módulos, una búsqueda encerrada en la
  // pestaña activa esconde casi todo lo que el alumno escribe. Mientras hay texto
  // se busca en TODO el catálogo y la pestaña deja de filtrar; al vaciar la caja
  // se vuelve a la pestaña. Esa diferencia se anuncia en pantalla, no se adivina.
  const buscando = searchQuery.trim().length > 0;
  const q = searchQuery.trim().toLowerCase();
  const coincide = (p: CatalogoItem) => {
    if (!buscando) return p.modulo === activeTab;
    return (
      p.titulo.toLowerCase().includes(q) ||
      p.teoria.toLowerCase().includes(q) ||
      p.modulo.toLowerCase().includes(q) ||
      p.id.toLowerCase().includes(q)
    );
  };

  const activasFiltradas = activas.filter(coincide);
  const propuestasFiltradas = propuestas.filter(coincide);

  // Design Tokens for Mecánica e Ingeniería
  const gradient = "bg-[#effaf7] dark:bg-[#08201C]";
  const accentText = "text-[#2A9D8F] dark:text-[#4FD1C5]";
  const ringColor = "stroke-[#2A9D8F] dark:stroke-[#4FD1C5]";

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

           <div className="hidden sm:flex absolute top-0 right-0 w-[60%] md:w-[70%] lg:w-[55%] h-full z-0 pointer-events-none rounded-r-[40px] items-center justify-end overflow-hidden">
             <div className="absolute inset-0 bg-gradient-to-r from-[#effaf7] dark:from-[#08201C] via-transparent to-transparent z-10 w-full" />
             <img src="/images/ingenieria_claymorphic_3d_v5_1775860518999.webp" alt="Mecánica e Ingeniería Decoración" className="w-full h-full object-cover object-center opacity-100 transition-transform duration-700 hover:scale-105" />
           </div>

           <div className="relative z-10 w-full md:w-[60%] flex flex-col justify-center bg-transparent p-8 md:p-0">
              <div className="flex items-center gap-3 mb-4">
                 <div className="w-12 h-12 rounded-xl bg-white dark:bg-[#023047] flex items-center justify-center shadow-sm border border-slate-100 dark:border-slate-800">
                    <Cog className={`w-6 h-6 ${accentText}`} />
                 </div>
                 <span className={`text-sm font-black ${accentText} uppercase tracking-widest bg-white dark:bg-black/20 px-4 py-2 rounded-full border border-slate-100 dark:border-slate-800 shadow-sm`}>
                   Laboratorio Activo
                 </span>
              </div>

              <h1 className="text-3xl sm:text-5xl md:text-6xl lg:text-[64px] font-black text-[#023047] dark:text-white leading-tight tracking-tight mb-4 transition-colors">
                Mecánica e Ingeniería
              </h1>
              <p className="text-xl text-slate-600 dark:text-slate-400 font-bold mb-10 w-[90%] leading-snug">
                Simuladores 3D de Autotrónica y Mecatrónica: motores, potencia, robótica y movilidad eléctrica con física real.
              </p>

              <div className="flex flex-wrap items-center gap-6 mt-auto">
                 <ConcentricRings progress={progreso} colorClass={ringColor} />
                 <div className="flex flex-col gap-1">
                    <span className="text-3xl font-black text-[#023047] dark:text-white">{activas.length} <span className="text-lg text-slate-400 font-bold">/ {practicasMecanica.length}</span></span>
                    <span className="text-xs font-black text-slate-400 uppercase tracking-widest">Prácticas disponibles</span>
                 </div>
              </div>
           </div>
        </div>

        {/* 2. QUICK RESUME BANNER */}
        {destacada && (
          <div className="w-full bg-white dark:bg-[#0A1121] backdrop-blur-xl border border-slate-200 dark:border-slate-800 rounded-[32px] p-6 lg:p-8 flex flex-col lg:flex-row items-center justify-between gap-6 mb-12 shadow-[0_8px_30px_rgb(0,0,0,0.04)] dark:shadow-[0_8px_30px_rgb(0,0,0,0.2)] transition-colors border-t-4 border-t-[#2A9D8F]">
             <div className="flex items-center gap-6">
               <div className="w-16 h-16 rounded-2xl bg-[#effaf7] dark:bg-[#2A9D8F]/10 shadow-inner flex items-center justify-center animate-pulse duration-3000 border border-[#2A9D8F]/20">
                  <Play className="w-8 h-8 text-[#2A9D8F]" fill="currentColor" />
               </div>
               <div>
                 <p className="text-sm font-black text-slate-400 dark:text-slate-500 uppercase tracking-widest mb-1">⭐ Práctica Destacada Sugerida</p>
                 <p className="text-2xl font-black text-[#023047] dark:text-white">{destacada.titulo}</p>
               </div>
             </div>

             <Link href={`/alumno/simulador/${destacada.id}`} className="px-8 py-4 rounded-xl font-black text-white text-lg bg-[#2A9D8F] hover:bg-[#023047] shadow-xl hover:shadow-2xl hover:shadow-[#2A9D8F]/40 transition-all hover:-translate-y-1 active:translate-y-0 flex items-center gap-3 whitespace-nowrap">
               <Play size={20} fill="currentColor" />
               Iniciar Simulación
             </Link>
          </div>
        )}

        {/* 3. TÍTULO + BÚSQUEDA */}
        <div className="w-full flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-6">
            <h2 className="text-2xl sm:text-4xl font-black text-[#023047] dark:text-white tracking-tight shrink-0">Prácticas</h2>

            <div className="w-full sm:w-72 shrink-0">
                <div className="relative w-full">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 w-4 h-4" />
                    <input
                       type="text"
                       placeholder={`Buscar en las ${practicasMecanica.length} prácticas...`}
                       value={searchQuery}
                       onChange={(e) => setSearchQuery(e.target.value)}
                       className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 dark:border-slate-800 bg-white dark:bg-[#0A1121] text-slate-700 dark:text-slate-200 text-sm font-semibold focus:outline-none focus:ring-2 focus:ring-[#2A9D8F] transition-all"
                    />
                </div>
            </div>
        </div>

        {/* 4. PESTAÑAS DE MÓDULO
            Fila propia y con salto de línea (flex-wrap), NO una tira con scroll
            horizontal como en las materias de tres módulos: nueve pestañas no
            caben en ningún ancho, y con la barra de scroll oculta las últimas
            quedaban fuera de la pantalla sin forma de alcanzarlas. Aquí no hay
            nada que desplazar — todas están siempre visibles y pulsables. */}
        <div className="w-full flex flex-wrap gap-2 sm:gap-3 border-b border-gray-200 dark:border-gray-800 pb-6 mb-10">
            {modulosMecanica.map((tab) => {
                const count = practicasMecanica.filter(p => p.modulo === tab).length;
                const isActiveTab = !buscando && activeTab === tab;
                return (
                    <button
                        key={tab}
                        onClick={() => { setSearchQuery(""); setActiveTab(tab); }}
                        aria-pressed={isActiveTab}
                        className={`shrink-0 whitespace-nowrap px-3 sm:px-5 py-2.5 sm:py-3 rounded-2xl text-xs sm:text-sm font-black transition-all flex items-center gap-2 shadow-sm ${isActiveTab ? 'bg-[#2A9D8F] text-white border-2 border-[#2A9D8F] shadow-lg shadow-[#2A9D8F]/30' : 'bg-white dark:bg-[#0A1121] text-slate-500 dark:text-slate-400 border border-slate-200 dark:border-slate-800 hover:bg-slate-50 dark:hover:bg-slate-800 hover:-translate-y-0.5'}`}
                    >
                        {tab}
                        <span className={`px-2 py-0.5 rounded-lg text-[11px] font-bold ${isActiveTab ? 'bg-white/20 text-white' : 'bg-slate-100 dark:bg-slate-800 text-slate-500'}`}>
                            {count}
                        </span>
                    </button>
                )
            })}
        </div>

        {/* 5. LABS ACTIVOS DEL MÓDULO (o de toda la materia, si se está buscando) */}
        <div className="w-full flex flex-wrap justify-between items-end gap-3 mb-8">
            <h3 className="text-xl sm:text-2xl font-black text-[#023047] dark:text-white tracking-tight">
              {buscando ? 'Resultados en toda la materia' : activeTab}
            </h3>
            <span className="text-sm font-black text-[#2A9D8F] dark:text-[#4FD1C5] uppercase tracking-widest">
              {activasFiltradas.length} {activasFiltradas.length === 1 ? 'lab 3D' : 'labs 3D'}
            </span>
        </div>

        {activasFiltradas.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 sm:gap-6 md:gap-8">
             {activasFiltradas.map((practica) => (
                <SpotlightCard key={practica.id} practica={practica} />
             ))}
          </div>
        ) : (
          <div className="w-full flex flex-col items-center justify-center p-16 bg-white dark:bg-[#0A1121] border border-slate-200 dark:border-slate-800 rounded-[32px]">
             <Search className="w-16 h-16 text-slate-300 dark:text-slate-700 mb-4" />
             <h3 className="text-2xl font-black text-[#023047] dark:text-white mb-2">No hay coincidencias</h3>
             <p className="text-slate-500 dark:text-slate-400 font-semibold text-center">Ninguna práctica de mecánica coincide con «{searchQuery}».</p>
             <button
                onClick={() => setSearchQuery("")}
                className="mt-6 px-6 py-3 rounded-xl bg-[#effaf7] dark:bg-slate-800 text-[#2A9D8F] dark:text-white font-bold hover:bg-[#2A9D8F]/10 transition-colors"
              >
                Limpiar búsqueda
             </button>
          </div>
        )}

        {/* 6. LABS PROPUESTOS */}
        {propuestasFiltradas.length > 0 && (
          <>
            <div className="w-full flex items-center gap-6 mt-16 mb-8">
                <h3 className="text-[#023047] dark:text-white font-black uppercase tracking-[0.3em] text-xs shrink-0 flex items-center gap-2">
                  <Sparkles size={14} className="text-[#2A9D8F]" />
                  Próximos laboratorios
                </h3>
                <div className="h-[1px] flex-grow bg-slate-200 dark:bg-slate-800"></div>
                <span className="text-xs font-black text-slate-400 uppercase tracking-widest shrink-0">{propuestasFiltradas.length} en diseño</span>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
               {propuestasFiltradas.map((practica) => (
                  <PropuestoCard key={practica.id} practica={practica} />
               ))}
            </div>
          </>
        )}
      </main>
    </div>
  );
}
