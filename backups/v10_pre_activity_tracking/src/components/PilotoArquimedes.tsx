"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Droplets, Anchor, ArrowUp, ArrowDown, Target, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Waves, Scaling, Box, Thermometer, FlaskConical
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes y Datos de Materiales
// ==========================================

const G = 9.81;

const FLUIDOS = {
  agua: { nombre: 'Agua', densidad: 1000, color: '#3b82f6', opacity: 0.3 },
  aceite: { nombre: 'Aceite', densidad: 920, color: '#eab308', opacity: 0.4 },
  miel: { nombre: 'Miel', densidad: 1420, color: '#f59e0b', opacity: 0.6 }
};

const MATERIALES = {
  madera: { nombre: 'Madera', densidad: 600, color: '#92400e' },
  aluminio: { nombre: 'Aluminio', densidad: 2700, color: '#94a3b8' },
  plomo: { nombre: 'Plomo', densidad: 11300, color: '#1e293b' },
  misterioso: { nombre: 'Material ?', densidad: 0, color: '#6366f1' } // Se genera en el seed
};

// ==========================================
// Componente Principal: PilotoArquimedes
// ==========================================

export default function PilotoArquimedes() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: MATERIAL MISTERIOSO --
  const [seed] = useState(() => ({
    rhoMisteriosa: Math.floor(Math.random() * (3000 - 500) + 500)
  }));

  // -- ESTADO LOCAL --
  const [config, setConfig] = useState({
    material: 'madera' as keyof typeof MATERIALES,
    fluido: 'agua' as keyof typeof FLUIDOS,
    volumen: 0.002, // m³
    sumergido: false
  });

  const [densidadInput, setDensidadInput] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- CÁLCULOS FÍSICOS --
  const rhoObj = config.material === 'misterioso' ? seed.rhoMisteriosa : MATERIALES[config.material].densidad;
  const m = rhoObj * config.volumen;
  const W = m * G;
  
  const rhoFluido = FLUIDOS[config.fluido].densidad;
  const E = config.sumergido ? rhoFluido * G * config.volumen : 0;
  
  // Peso Aparente (Mínimo 0 si el objeto flota por sí solo sin tensar el resorte)
  const Wa = Math.max(0, W - E);

  // -- HANDLERS --
  const handleValidar = () => {
    const val = parseFloat(densidadInput);
    const margen = rhoObj * 0.05; // 5% de tolerancia
    
    if (Math.abs(val - rhoObj) <= margen) {
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica6: `✅ VALIDADO: ρ_obj=${rhoObj}kg/m³. Alumno calculó ${val}kg/m³. Fluido=${config.fluido}.` 
      });
    } else {
      setResultado('error');
    }
  };

  // -- VISUALES DINÁMICOS --
  // El estiramiento del resorte depende de Wa
  const springStretch = Wa * 5; // Escala visual 1N -> 5px
  const objPos = config.sumergido ? 280 : 120; // Posición Y del objeto


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative flex items-center justify-center p-20 overflow-hidden">
         {/* Fondo decorativo */}
         <div className="absolute inset-0 bg-[radial-gradient(circle_at_50%_50%,#3b82f605_0%,transparent_50%)]" />

         {/* ESCENA SVG */}
         <svg width="400" height="600" viewBox="0 0 400 600" className="overflow-visible z-10">
            {/* Tanque de Fluido */}
            <rect x="100" y="250" width="200" height="300" fill="white" fillOpacity="0.05" stroke="white" strokeOpacity="0.1" strokeWidth="2" rx="10" />
            
            {/* Fluido Dinámico */}
            <motion.rect 
               x="102" 
               animate={{ 
                 y: 252 + (300 - (150 + (config.sumergido ? config.volumen * 5000 : 0))), 
                 height: 150 + (config.sumergido ? config.volumen * 5000 : 0) 
               }}
               width="196" 
               fill={FLUIDOS[config.fluido].color} 
               fillOpacity={FLUIDOS[config.fluido].opacity}
               rx="8"
            />

            {/* Dinamómetro (Escala superior) */}
            <rect x="180" y="0" width="40" height="80" fill="#0f172a" stroke="#334155" strokeWidth="2" rx="4" />
            <text x="200" y="45" fill="white" fontSize="10" fontWeight="black" textAnchor="middle">{Wa.toFixed(1)}N</text>

            {/* Resorte de Suspensión */}
            <motion.path 
               animate={{ 
                 d: `M 200 80 Q 210 100 200 ${80 + (objPos / 2)} T 200 ${objPos}` 
               }}
               fill="none" stroke="#64748b" strokeWidth="2" strokeLinecap="round" 
            />

            {/* Objeto Sumergible */}
            <motion.g animate={{ y: objPos }}>
               <rect 
                  x={200 - (15 + config.volumen * 5000)} 
                  y={- (15 + config.volumen * 5000)}
                  width={30 + config.volumen * 10000} 
                  height={30 + config.volumen * 10000} 
                  fill={MATERIALES[config.material].color} 
                  stroke="white" strokeWidth="2" strokeOpacity="0.3"
                  rx="4"
               />
               
               {/* VECTORES DE FUERZA */}
               <AnimatePresence>
                  <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                     {/* Vector Peso (W) */}
                     <line x1="0" y1="0" x2="0" y2={W * 5} stroke="#ef4444" strokeWidth="3" markerEnd="url(#arrow-red)" />
                     <text x="5" y={W * 5} fill="#ef4444" fontSize="10" fontWeight="black">W</text>

                     {/* Vector Empuje (E) */}
                     {config.sumergido && (
                       <motion.g initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}>
                          <line x1="0" y1="0" x2="0" y2={-E * 5} stroke="#3b82f6" strokeWidth="3" markerEnd="url(#arrow-blue)" />
                          <text x="5" y={-E * 5} fill="#3b82f6" fontSize="10" fontWeight="black">E</text>
                       </motion.g>
                     )}
                  </motion.g>
               </AnimatePresence>
            </motion.g>

            {/* Marcadores de flecha */}
            <defs>
               <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" /></marker>
               <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" /></marker>
            </defs>
         </svg>

         {/* FEEDBACK OVERLAY */}
         <AnimatePresence>
            {resultado === 'exito' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                 <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-blue-500">
                    <div className="w-20 h-20 bg-blue-100 text-blue-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">¡Densidad Confirmada!</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has aplicado el Principio de Arquímedes para desvelar la naturaleza del material: <span className="text-blue-600 font-black">{rhoObj} kg/m³</span>.</p>
                    <button 
                     onClick={() => router.push('/alumno/laboratorio/fisica')}
                     className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-blue-600 transition-all shadow-xl shadow-blue-900/20"
                    >
                      Cerrar Práctica
                    </button>
                 </div>
              </motion.div>
            )}

            {resultado === 'error' && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700 pointer-events-none">
                 <AlertCircle size={20} /> Error en el cálculo de densidad (Fuera del 5% de margen).
              </motion.div>
            )}
         </AnimatePresence>

         {/* MODO INSTRUCTOR */}
         <div className="absolute bottom-10 right-10">
            <button 
             onClick={() => {
                setDensidadInput(rhoObj.toString());
                setConfig(c => ({ ...c, sumergido: true }));
             }} 
             className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Resolver (Demo)
            </button>
         </div>
      </main>
    </div>
  );
}
