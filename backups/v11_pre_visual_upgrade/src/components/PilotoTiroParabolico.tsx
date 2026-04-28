"use client";

import React, { useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';

const G = 9.81;

export default function PilotoTiroParabolico() {
  const tiro1 = useSimuladorStore(state => state.tiro1);
  const generarSemillaF1 = useSimuladorStore(state => state.generarSemillaF1);

  const { angulo = 45, velocidad = 25, disparando = false, targetX = 60, resultado = null, distanciaReal = 0, y0 = 0, obsX = 0, obsY = 0, yImpacto = 0, escenario = 'tierra' } = tiro1;
  const G = escenario === 'luna' ? 1.62 : escenario === 'marte' ? 3.71 : escenario === 'jupiter' ? 24.79 : 9.81;

  // Inicializar en el mount si no hay obstáculo definido
  useEffect(() => {
    if (!obsX) { 
      generarSemillaF1();
    }
  }, [obsX, generarSemillaF1]);

  const rad = (angulo * Math.PI) / 180;


  // FISICA AVANZADA: Generación de Path por Integración (Coincidente con el Motor)
  const { pathData, tVueloVisual } = useMemo(() => {
    if (!y0) return { pathData: "", tVueloVisual: 0 };
    
    const { viento = 0, densidadAire = 1.225 } = tiro1;
    const K = 0.05 * densidadAire;
    const dt = 0.05; 
    
    let curX = 0;
    let curY = y0;
    let vx = velocidad * Math.cos(rad);
    let vy = velocidad * Math.sin(rad);
    let t = 0;
    let points = `M 0 ${100 - y0} `;

    // Simular hasta que toque suelo o pase mucho tiempo
    while (curY >= 0 && t < 10) {
      const vTotal = Math.sqrt(vx * vx + vy * vy);
      const fx = -K * vx * vTotal + (viento * 0.5);
      const fy = -G - K * vy * vTotal;

      vx += fx * dt;
      vy += fy * dt;
      curX += vx * dt;
      curY += vy * dt;
      t += dt;

      points += `L ${curX} ${100 - curY} `;
      
      // Si ya pasó el objetivo o colisión lógica, paramos el trazo visual
      if (resultado === 'colision' && curX >= obsX) break;
      if (resultado && curX >= distanciaReal) break;
    }
    
    return { pathData: points, tVueloVisual: t };
  }, [velocidad, rad, y0, tiro1, resultado, obsX, distanciaReal]);

  // Cálculo de Zoom Dinámico (Cámara de Persecución)
  const viewboxValue = useMemo(() => {
    if (!disparando) return "-15 -10 130 145";
    // El zoom se enfoca en el área de impacto (targetX o obsX)
    const focalX = resultado === 'colision' ? obsX : targetX;
    return `${focalX - 40} -10 80 145`;
  }, [disparando, targetX, obsX, resultado]);

  return (
    <div className="flex h-full w-full bg-[#030614] overflow-hidden font-['Outfit'] relative">
      
      {/* 📋 RENDER PLANETARIO NATURAL HD (Fondo Dinámico) */}
      <motion.div 
        key={escenario}
        initial={{ opacity: 0 }}
        animate={{ opacity: 0.4 }}
        transition={{ duration: 1 }}
        className="absolute inset-0 z-0 bg-cover bg-center bg-no-repeat"
        style={{ backgroundImage: `url('/bg-${escenario}.png')` }}
      />
      {/* VIGNETTE EFFECT */}
      <div className="absolute inset-0 z-10 bg-[radial-gradient(ellipse_at_center,transparent_30%,#000000_100%)] pointer-events-none" />
      
      {/* HUD OVERLAY GLASSMORPHISM */}
      <div className="absolute inset-x-0 bottom-0 h-40 bg-gradient-to-t from-black to-transparent z-10 pointer-events-none" />

      {/* HUGE FEEDBACK TEXT OVERLAY */}
      <AnimatePresence>
        {resultado && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.5, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.8 }}
            className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-50 flex flex-col items-center pointer-events-none p-10 rounded-3xl backdrop-blur-md border shadow-2xl ${
                resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/50 shadow-[0_0_100px_rgba(16,185,129,0.2)]' : 
                resultado === 'colision' ? 'bg-orange-500/10 border-orange-500/50 shadow-[0_0_100px_rgba(249,115,22,0.2)]' :
                'bg-red-500/10 border-red-500/50 shadow-[0_0_100px_rgba(239,68,68,0.2)]'}`}
          >
            <h2 className={`text-6xl font-black uppercase tracking-tighter drop-shadow-2xl ${
                resultado === 'exito' ? 'text-emerald-400' : 
                resultado === 'colision' ? 'text-orange-500' : 'text-red-500'}`}>
              {resultado === 'exito' ? '¡BLANCO NEUTRALIZADO!' : resultado === 'colision' ? '¡IMPACTO FALLIDO!' : '¡MUNICIÓN PERDIDA!'}
            </h2>
            <p className={`mt-2 text-xl font-bold uppercase tracking-widest ${resultado === 'exito' ? 'text-emerald-200' : resultado === 'colision' ? 'text-orange-200' : 'text-red-200'}`}>
              {resultado === 'exito' ? `Precisión Exacta: ${distanciaReal.toFixed(1)}m` 
                : resultado === 'colision' ? `Dron destruido contra muro de contención en X=${obsX}m`
                : `Dron fuera de límite operativo. Cae en X=${distanciaReal.toFixed(1)}m (Obj: ${targetX}m)`}
            </p>
          </motion.div>
        )}
      </AnimatePresence>
      
      {/* 📋 LIENZO DE PRÁCTICA */}
      <main className="flex-grow h-full w-full relative overflow-hidden flex flex-col z-20">
        
        {/* TELEMETRÍA TÁCTICA HUD - Restaurada a Glassmorphism Absoluto Flotante */}
        <div className="absolute top-8 left-8 z-30 flex flex-col gap-3">
           {/* Grupo Principal: Coordenadas de Misión */}
           <div className="bg-black/60 backdrop-blur-xl px-6 py-4 rounded-2xl border border-sky-500/30 flex flex-col sm:flex-row sm:items-center gap-6 shadow-[0_0_30px_rgba(56,189,248,0.1)] max-w-fit">
              <div className="flex items-center gap-4">
                 <div className="relative w-2 h-2 rounded-full bg-sky-400 shadow-[0_0_10px_#38bdf8] animate-pulse" />
                 <span className="text-sm font-black text-white uppercase tracking-widest leading-none">
                    Tiro Parabólico <br/><span className="text-sky-400 text-[10px]">RADAR TÁCTICO</span>
                 </span>
              </div>
              <div className="hidden sm:block w-px h-8 bg-sky-500/20" />
              <div className="flex gap-4 sm:gap-8">
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Muro X</span>
                  <span className="text-lg font-black text-orange-400 tabular-nums tracking-wider leading-none">{obsX}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Muro Y</span>
                  <span className="text-lg font-black text-orange-400 tabular-nums tracking-wider leading-none">{obsY}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
                <div className="flex flex-col">
                  <span className="text-[10px] font-black text-sky-500/50 uppercase tracking-widest mb-1">Distancia Objetivo</span>
                  <span className="text-lg font-black text-red-500 tabular-nums tracking-wider leading-none drop-shadow-[0_0_5px_#ef4444]">{targetX}<span className="text-sky-500/50 text-xs ml-1">m</span></span>
                </div>
              </div>
           </div>
           
           {/* Grupo Secundario: Sensores de Entorno */}
           <div className="bg-black/40 backdrop-blur-md px-6 py-3 rounded-2xl border border-white/5 flex gap-6 max-w-fit relative overflow-hidden">
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Gravedad Planeta</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{G.toFixed(2)}<span className="text-slate-500 text-xs ml-1">m/s²</span></span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Altitud Y₀</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{y0.toFixed(1)}<span className="text-slate-500 text-xs ml-1">m</span></span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Viento (Wₓ)</span>
                   <span className={`text-sm font-black tabular-nums tracking-wider leading-none ${tiro1.viento > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                     {tiro1.viento?.toFixed(1)}<span className="text-slate-500 text-xs ml-1">m/s</span>
                   </span>
              </div>
              <div className="flex flex-col">
                   <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Densidad Aire</span>
                   <span className="text-sm font-black text-white tabular-nums tracking-wider leading-none">{tiro1.densidadAire?.toFixed(3)}<span className="text-slate-500 text-[8px] ml-1">kg/m³</span></span>
              </div>
           </div>
        </div>

        {/* Lienzo SVG Engine con Zoom Dinámico */}
        <div className="absolute inset-0 z-10 flex flex-col justify-center items-center w-full h-full pb-16 pt-32 lg:px-24 transition-all duration-700">
           <motion.svg 
            animate={{ viewBox: viewboxValue }}
            transition={{ duration: 1.5, ease: "easeInOut" }}
            className="w-full h-full overflow-visible drop-shadow-2xl"
            preserveAspectRatio="xMidYMid meet"
           >
              {/* Ejes X/Y Cartesianos Holográficos */}
              <line x1="-10" y1="100" x2="110" y2="100" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              <line x1="0" y1="105" x2="0" y2="-20" stroke="rgba(255,255,255,0.2)" strokeWidth="0.5" />
              
              {/* Grid de Coordenadas */}
              {[20, 40, 60, 80, 100, 120].map(x => (
                <g key={x} transform={`translate(${x}, 100)`}>
                  <line x1="0" y1="-2" x2="0" y2="2" stroke="rgba(255,255,255,0.3)" strokeWidth="0.5" />
                  <text y="6" textAnchor="middle" fill="rgba(255,255,255,0.4)" fontSize="2" fontWeight="bold">{x}m</text>
                </g>
              ))}

              {/* EL MURO (Obstáculo Dinámico Universitario) */}
              <g transform={`translate(${obsX}, 100)`}>
                 {/* Pilar del obstáculo, escalado la altura requerida (hacia arriba Y negativo) */}
                 <rect x="-1" y={-obsY} width="2" height={obsY} fill="url(#metal-pattern)" stroke="#f97316" strokeWidth="0.4" className="shadow-2xl" />
                 {/* Borde superior glowing */}
                 <rect x="-1.5" y={-obsY} width="3" height="1" fill="#fdba74" />
                 <text y={-(obsY + 3)} x="0" textAnchor="middle" fill="#f97316" fontSize="2.5" fontWeight="900" className="drop-shadow-[0_0_5px_#f97316]">h = {obsY}m</text>
                 <line stroke="#f97316" strokeWidth="0.2" strokeDasharray="1 1" x1="0" y1={-obsY} x2={-obsX} y2={-obsY} />
              </g>

              {/* BLANCO (Dron Enemigo Holográfico) */}
              <g transform={`translate(${targetX}, 100)`}>
                 {/* Anillos de bloqueo del radar */}
                 <motion.circle 
                   r="5" fill="none" stroke="#ef4444" strokeWidth="0.4" strokeDasharray="2 1"
                   animate={{ rotate: 360, scale: [1, 1.1, 1] }}
                   transition={{ repeat: Infinity, duration: 3, ease: "linear" }}
                 />
                 <motion.circle 
                   r="8" fill="none" stroke="rgba(239,68,68,0.3)" strokeWidth="0.2" strokeDasharray="1 3"
                   animate={{ rotate: -360 }}
                   transition={{ repeat: Infinity, duration: 7, ease: "linear" }}
                 />
                 {/* Estructura central del dron */}
                 <path d="M-3 0 L0 -2 L3 0 L0 2 Z" fill="#ef4444" className="drop-shadow-[0_0_8px_#ef4444]" />
                 <circle r="0.5" fill="#fff" />
                 {/* Marcador láser cayendo desde el dron al suelo */}
                 <line x1="0" y1="2" x2="0" y2="10" stroke="rgba(239,68,68,0.2)" strokeWidth="0.2" strokeDasharray="1 1" />
              </g>

              {/* IMPACTO O COLISIÓN */}
              {resultado && (
                <motion.g 
                  initial={{ opacity: 0, scale: 0 }} 
                  animate={{ opacity: 1, scale: 1 }} 
                  transform={`translate(${resultado === 'colision' ? obsX : distanciaReal}, ${100 - yImpacto})`}
                >
                  {/* Explosion Particles on Hit/Crash */}
                  {Array.from({ length: 15 }).map((_, i) => (
                    <motion.circle
                      key={i} r={1.5}
                      fill={resultado === 'exito' ? "#10b981" : resultado === 'colision' ? "#f97316" : "#ef4444"}
                      initial={{ cx: 0, cy: 0, opacity: 1 }}
                      animate={{
                        cx: Math.cos((i * 24 * Math.PI) / 180) * 15,
                        cy: Math.sin((i * 24 * Math.PI) / 180) * 15 - 5,
                        opacity: 0, scale: 0
                      }}
                      transition={{ duration: 1, ease: "easeOut" }}
                    />
                  ))}
                  <circle r="3" fill="none" stroke="#fff" strokeWidth="0.5" />
                </motion.g>
              )}

              {/* Guía Lógica del Computador de Tiro */}
              <motion.path 
                initial={false}
                animate={{ d: pathData }}
                transition={{ duration: 0.3 }}
                fill="none" 
                stroke="rgba(255,255,255,0.15)" 
                strokeWidth="0.5" 
                strokeDasharray="1 1"
              />

              {/* BASE / MONTE / ARTILLERÍA RAILGUN */}
              <g transform="translate(0, 100)">
                 {/* Plataforma base de la montaña */}
                 <path d={`M-100 0 L10 0 L8 ${-y0 + 2} L10 ${-y0} L-100 ${-y0} Z`} fill="rgba(6,18,34,0.9)" stroke="#1e293b" strokeWidth="0.5" />
                 
                 {/* Cañón Electromagnético Railgun */}
                 <g transform={`translate(0, ${-y0})`}>
                   {/* Núcleo de Estabilización */}
                   <path d="M-4 0 L4 0 L2 -4 L-2 -4 Z" fill="url(#metal-gradient)" stroke="#475569" strokeWidth="0.2" />
                   <circle cx="0" cy="-4" r="2.5" fill="#0f172a" stroke="#0ea5e9" strokeWidth="0.5" className="drop-shadow-[0_0_10px_rgba(14,165,233,0.3)]"/>
                   
                   {/* Cañón rotatorio */}
                   <motion.g animate={{ rotate: -angulo }}>
                      {/* Barril Magnético Principal */}
                      <rect x="0" y="-5" width="14" height="2" fill="#1e293b" stroke="#38bdf8" strokeWidth="0.3" rx="0.5" />
                      {/* Aceleradores Térmicos */}
                      <rect x="2" y="-4.5" width="3" height="1" fill="#0ea5e9" opacity="0.8" />
                      <rect x="6" y="-4.5" width="3" height="1" fill="#0ea5e9" opacity="0.8" />
                      {/* Boquilla */}
                      <polygon points="14,-5 15,-4 15,-4 14,-3" fill="#38bdf8" />
                   </motion.g>
                   <text y="-8" x="-4" textAnchor="end" fill="#cbd5e1" fontSize="2.5" fontWeight="bold">Y₀ = {y0}m</text>
                 </g>
              </g>

              {/* PLASMA Y TRAYECTORIA LUMINOSA + VECTORES */}
              {(disparando || resultado) && (
                 <g key={`shot-${pathData}`}>
                    <animateMotion 
                      dur={`${disparando ? Math.max(0.5, tVueloVisual * 0.4) : 0}s`} 
                      fill="freeze" 
                      path={pathData} 
                      calcMode="linear"
                    >
                       {/* Vectores Dinámicos (Vx, Vy) */}
                       <mpath href={`#shot-path-${pathData}`} />
                    </animateMotion>

                    {/* Rastro de proyectil (Motion Trail) */}
                    <path id={`shot-path-${pathData}`} d={pathData} fill="none" stroke="url(#trail-gradient)" strokeWidth="0.8" opacity="0.3" strokeDasharray="1 2" />

                    {/* Bola de plasma pulsante */}
                    <motion.g>
                        <motion.circle 
                          r="1.8" 
                          fill="#0e7490" 
                          className="drop-shadow-[0_0_15px_#22d3ee]"
                          animate={{ scale: [1, 1.8, 1], filter: ["brightness(1)", "brightness(2)", "brightness(1)"] }}
                          transition={{ duration: 0.15, repeat: Infinity }}
                        />
                        <circle r="0.8" fill="#cffafe" />
                        
                        {/* Vectores de Velocidad (Visualizadores Universitarios) */}
                        <g className="pointer-events-none">
                           {/* Vector Vy (Vertical) */}
                           <line x1="0" y1="0" x2="0" y2="-10" stroke="#fbbf24" strokeWidth="0.4" markerEnd="url(#arrow-y)" />
                           {/* Vector Vx (Horizontal) */}
                           <line x1="0" y1="0" x2="10" y2="0" stroke="#38bdf8" strokeWidth="0.4" markerEnd="url(#arrow-x)" />
                        </g>
                    </motion.g>
                 </g>
              )}

              <defs>
                <marker id="arrow-y" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#fbbf24" />
                </marker>
                <marker id="arrow-x" viewBox="0 0 10 10" refX="5" refY="5" markerWidth="3" markerHeight="3" orient="auto">
                  <path d="M 0 0 L 10 5 L 0 10 z" fill="#38bdf8" />
                </marker>
                <linearGradient id="trail-gradient" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="transparent" />
                  <stop offset="100%" stopColor="#22d3ee" />
                </linearGradient>
                <pattern id="metal-pattern" x="0" y="0" width="2" height="2" patternUnits="userSpaceOnUse">
                  <line x1="0" y1="0" x2="2" y2="2" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
                  <line x1="2" y1="0" x2="0" y2="2" stroke="rgba(249,115,22,0.3)" strokeWidth="0.5" />
                </pattern>
                <linearGradient id="metal-gradient" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="#64748b" />
                  <stop offset="100%" stopColor="#0f172a" />
                </linearGradient>
              </defs>
           </motion.svg>
        </div>

        {/* MONITOR OSCILOSCOPIO: Vy vs t (Análisis Cinematográfico) */}
        {(disparando || resultado) && (
          <div className="absolute bottom-8 left-8 z-30 w-48 h-32 bg-black/60 backdrop-blur-xl border border-sky-500/30 rounded-2xl p-3 flex flex-col shadow-2xl overflow-hidden">
             <div className="flex items-center justify-between mb-2">
                <span className="text-[8px] font-black text-sky-400 uppercase tracking-widest">Oscilador Vy</span>
                <div className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_5px_#10b981]" />
             </div>
             <div className="flex-grow relative border-l border-b border-sky-500/20">
                <svg viewBox="0 -10 100 20" className="w-full h-full">
                   <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.1)" strokeWidth="0.2" />
                   <motion.path 
                     d="M 0 5 Q 25 -10 50 0 T 100 5" // Mock visual de onda para el estilo
                     fill="none" stroke="#38bdf8" strokeWidth="0.3" opacity="0.4"
                     animate={{ d: ["M 0 5 Q 25 -10 50 0 T 100 5", "M 0 0 Q 25 10 50 0 T 100 0"] }}
                     transition={{ repeat: Infinity, duration: 2, ease: "linear" }}
                   />
                   <text x="2" y="-6" fill="#fbbf24" fontSize="3" fontWeight="bold">Vy (m/s)</text>
                </svg>
             </div>
             <span className="text-[7px] font-bold text-slate-500 mt-1 uppercase text-right">Análisis en t=real</span>
          </div>
        )}
      </main>
    </div>
  );
}
