import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Brain, Zap, Activity } from 'lucide-react';

export default function PilotoSistemaNervioso({ isProfesor = false }: { isProfesor?: boolean }) {
  const { sistemaNervioso, generarSemillaB7 } = useSimuladorStore();
  const { fuerzaGolpe, integridadMielina, estado, latenciaMedida } = sistemaNervioso;

  // Inicialización (Semilla - El Reto Clínico)
  useEffect(() => {
    if (integridadMielina === 100 && latenciaMedida === 0) {
      generarSemillaB7();
    }
  }, []);

  // Parámetros de Animación
  // Velocidad visual: max 120 m/s -> 0.2s duration. min 1 m/s -> 3s duration.
  const moveDuration = Math.max(0.15, 3.5 - (integridadMielina / 30)); 
  
  // Amplitud de la patada (rota sobre centro de la rodilla)
  const kickAngle = (fuerzaGolpe / 100) * 40; 

  return (
    <div className="w-full h-full relative bg-slate-950 flex items-center justify-center p-8 overflow-hidden rounded-[2rem] shadow-2xl">
      
      {/* Background Decor & Instrumentation */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute top-0 left-0 w-full h-full bg-[radial-gradient(circle_at_50%_40%,#1e2bab_0%,transparent_60%)]" opacity-30 />
        <div className="absolute w-full h-full border-[0.5px] border-slate-800" style={{ backgroundSize: '60px 60px', backgroundImage: 'radial-gradient(circle, #334155 1px, transparent 1px)' }} />
      </div>

      <svg 
        viewBox="0 0 840 600" 
        className="w-full h-full max-w-5xl drop-shadow-[0_0_50px_rgba(2,48,71,0.4)] overflow-visible"
      >
        <defs>
          <filter id="neonGlow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="4" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
          
          <linearGradient id="sensoryGrad" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#2dd4bf" />
             <stop offset="100%" stopColor="#8ECAE6" />
          </linearGradient>

          <linearGradient id="motorGrad" x1="0%" y1="0%" x2="100%" y2="0%">
             <stop offset="0%" stopColor="#FB8500" />
             <stop offset="100%" stopColor="#f43f5e" />
          </linearGradient>

          <marker id="arrowhead" markerWidth="10" markerHeight="7" refX="0" refY="3.5" orient="auto">
            <polygon points="0 0, 10 3.5, 0 7" fill="#475569" opacity="0.5" />
          </marker>
        </defs>

        {/* 1. MÉDULA ESPINAL (Diseño Claymorphism) */}
        <g transform="translate(680, 280)">
           <motion.path 
             d="M-80,0 C-80,-70 80,-70 80,0 C80,70 -80,70 -80,0" 
             fill="#1e293b" 
             className="stroke-slate-700 stroke-[3]"
             initial={{ opacity: 0, scale: 0.9 }}
             animate={{ opacity: 1, scale: 1 }}
           />
           {/* Asta Gris (Mariposa) */}
           <path 
             d="M-55,-25 C-30,-25 -15,-10 0,-10 C15,-10 30,-25 55,-25 C70,0 70,25 55,40 C30,40 15,25 0,25 C-15,25 -30,40 -55,40 C-70,25 -70,0 -55,-25" 
             fill={estado === 'sinapsis' ? '#FB8500' : '#334155'} 
             fillOpacity={estado === 'sinapsis' ? 0.3 : 1}
             className="transition-all duration-300 stroke-slate-600 stroke-[2]"
           />
           
           {/* Sinapsis Glow */}
           <AnimatePresence>
             {estado === 'sinapsis' && (
               <motion.circle 
                 initial={{ scale: 0, opacity: 0 }}
                 animate={{ scale: [0, 1.5, 0], opacity: [0, 1, 0] }}
                 exit={{ opacity: 0 }}
                 transition={{ duration: 0.4 }}
                 r="25" fill="#FB8500" filter="url(#neonGlow)"
               />
             )}
           </AnimatePresence>
        </g>

        {/* 2. RUTAS NERVIOSAS (Vías Aferente y Eferente) */}
        <g opacity="0.6">
           {/* Vía Aferente (Teal) */}
           <path 
             id="sensoryPath"
             d="M260,320 C400,320 580,320 620,280" 
             fill="none" 
             stroke={estado === 'viajando_sensorial' ? '#2dd4bf' : '#134e4a'} 
             strokeWidth="5" 
             strokeDasharray="10 6"
             className="transition-colors duration-300"
           />
           
           {/* Vía Eferente (Fucsia/Naranja) */}
           <path 
             id="motorPath"
             d="M620,280 C580,480 400,480 260,340" 
             fill="none" 
             stroke={estado === 'viajando_motor' ? '#f43f5e' : '#881337'} 
             strokeWidth="5" 
             strokeDasharray="10 6"
             className="transition-colors duration-300"
           />

           {/* Instructor Mode: Brain Signal */}
           {(isProfesor || sistemaNervioso.estado === 'reposo') && (
              <path 
                d="M620,280 C650,200 650,100 600,60" 
                fill="none" 
                stroke="#64748b" 
                strokeWidth="2" 
                strokeDasharray="4 4"
                opacity={isProfesor ? 0.8 : 0.2}
                markerEnd="url(#arrowhead)"
              />
           )}
        </g>

        {/* 3. ANATOMÍA DE LA PIERNA (Estructura Dinámica) */}
        <g transform="translate(100, 100)">
           {/* Muslo */}
           <path 
             d="M40,40 L160,40 L180,220 L60,220 Z" 
             fill="#1e293b" 
             className="stroke-slate-800 stroke-[3]"
           />
           
           {/* Músculo Cuádriceps (Feedback de contracción) */}
           <motion.path 
             d="M65,60 L135,60 L145,180 L75,180 Z" 
             animate={{ 
               fill: estado === 'contraccion' ? '#FB8500' : '#334155',
               scaleY: estado === 'contraccion' ? 0.95 : 1
             }}
             className="stroke-[#FB8500]/20"
           />

           {/* Pierna Inferior (Articulada) */}
           <motion.g
             animate={{ rotate: estado === 'contraccion' ? -kickAngle : 0 }}
             transition={{ 
               type: "spring", stiffness: 400, damping: 12,
               delay: estado === 'contraccion' ? 0 : 0.8
             }}
             style={{ originX: '170px', originY: '220px' }}
           >
              {/* Rodilla / Tibia */}
              <path 
                d="M170,220 L170,450 L240,480 L245,500 L150,500 L140,450 L140,220 Z" 
                fill="#475569" 
                className="stroke-slate-700 stroke-[3]"
              />
              {/* Punto de Impacto (Tendón) */}
              <circle cx="178" cy="225" r="8" fill="#FB8500" fillOpacity="0.4" />
           </motion.g>
        </g>

        {/* 4. MARTILLO DE REFLEJOS (Interactivo) */}
        <motion.g
          animate={{ 
            x: estado === 'golpe' ? 245 : 100, 
            y: estado === 'golpe' ? 285 : 300,
            rotate: estado === 'golpe' ? 0 : -35,
            opacity: estado === 'reposo' || estado === 'golpe' ? 1 : 0
          }}
          transition={{ duration: 0.2 }}
          className="pointer-events-none"
        >
           {/* Mango Claymorphism */}
           <rect x="0" y="0" width="100" height="10" rx="5" fill="url(#sensoryGrad)" opacity="0.8" />
           {/* Cabeza del martillo */}
           <path d="M85,-15 L115,-15 L125,25 L75,25 Z" fill="#64748b" stroke="#94a3b8" strokeWidth="3" />
           <motion.circle 
             animate={{ scale: estado === 'golpe' ? [1, 2, 1] : 1, opacity: estado === 'golpe' ? [1, 0, 1] : 0 }}
             cx="100" cy="5" r="15" fill="#FB8500" opacity="0.3" 
           />
        </motion.g>

        {/* 5. POTENCIAL DE ACCIÓN (La Chispa) */}
        
        {/* Impulso Sensorial */}
        {estado === 'viajando_sensorial' && (
           <g filter="url(#neonGlow)">
              <circle r="10" fill="#2dd4bf">
                 <animateMotion dur={`${moveDuration}s`} repeatCount="1" fill="freeze">
                    <mpath xlinkHref="#sensoryPath" />
                 </animateMotion>
              </circle>
              <circle r="6" fill="white">
                 <animateMotion dur={`${moveDuration}s`} repeatCount="1" fill="freeze">
                    <mpath xlinkHref="#sensoryPath" />
                 </animateMotion>
              </circle>
           </g>
        )}

        {/* Impulso Motor */}
        {estado === 'viajando_motor' && (
           <g filter="url(#neonGlow)">
              <circle r="12" fill="#FB8500">
                 <animateMotion dur={`${moveDuration}s`} repeatCount="1" fill="freeze">
                    <mpath xlinkHref="#motorPath" />
                 </animateMotion>
              </circle>
              <circle r="6" fill="white">
                 <animateMotion dur={`${moveDuration}s`} repeatCount="1" fill="freeze">
                    <mpath xlinkHref="#motorPath" />
                 </animateMotion>
              </circle>
           </g>
        )}

        {/* Animation to Brain (Mode Instructor) */}
        {isProfesor && estado === 'sinapsis' && (
           <motion.circle 
             initial={{ opacity: 0 }}
             animate={{ opacity: [0, 1, 0], y: [0, -100] }}
             transition={{ duration: 1, delay: 0.1 }}
             cx="620" cy="280" r="4" fill="#64748b"
           />
        )}
      </svg>

      {/* OVERLAYS TÉCNICOS (Rule #14 Compliant - Min 11px) */}
      <div className="absolute top-10 right-10 flex flex-col gap-4">
         <div className="flex items-center gap-4 bg-slate-900/60 border border-white/10 p-5 rounded-[2rem] backdrop-blur-xl shadow-2xl">
            <div className="flex flex-col items-end">
               <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Estado Dinámico</span>
               <span className={`text-sm font-black uppercase tracking-tighter ${
                 estado === 'reposo' ? 'text-slate-400' : 'text-[#8ECAE6]'
               }`}>
                 {estado.replace('_', ' ')}
               </span>
            </div>
            <div className={`w-4 h-4 rounded-full ${
              estado === 'reposo' ? 'bg-slate-800' : 'bg-[#FB8500] shadow-[0_0_20px_#FB8500] animate-pulse'
            }`} />
         </div>

         {isProfesor && (
            <div className="bg-[#FB8500]/10 border border-[#FB8500]/20 p-4 rounded-2xl flex items-center gap-3">
               <Brain className="text-[#FB8500]" size={18} />
               <span className="text-[11px] font-black text-[#FB8500] uppercase">Ruta Cerebral Activa</span>
            </div>
         )}
      </div>

      <div className="absolute bottom-10 right-10 flex items-center gap-2 px-4 py-2 bg-black/20 rounded-full border border-white/5 opacity-50">
         <Activity size={14} className="text-slate-500" />
         <span className="text-[11px] font-bold text-slate-500 uppercase tracking-widest">Neural Tracer v3.0</span>
      </div>

    </div>
  );
};
