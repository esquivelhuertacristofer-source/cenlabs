"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Box, RotateCcw, Activity, ArrowRight, Target, 
  CheckCircle2, AlertCircle, Info, ChevronRight, Binary, Scaling, Layers
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Tipos y Constantes
// ==========================================

const G = 9.81;

interface RampaState {
  angulo: number;
  deslizando: boolean;
  bloqueX: number; // Posición normalizada (0 a 100)
  resultado: 'exito' | 'error' | null;
}

// ==========================================
// Componente Principal: PilotoPlanoInclinado
// ==========================================

export default function PilotoPlanoInclinado() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA Y ESTADO INICIAL --
  const [seed] = useState(() => ({
    masa: Math.floor(Math.random() * (50 - 5 + 1)) + 5,
    muS: parseFloat((Math.random() * (0.60 - 0.20) + 0.20).toFixed(2))
  }));
  
  const muK = parseFloat((seed.muS * 0.8).toFixed(2));
  const anguloCritico = (Math.atan(seed.muS) * 180) / Math.PI;

  const [rampa, setRampa] = useState<RampaState>({
    angulo: 0,
    deslizando: false,
    bloqueX: 20, // Empieza cerca del tope (pivote)
    resultado: null
  });

  const [teoricoInput, setTeoricoInput] = useState("");
  const [intentos, setIntentos] = useState(0);

  // -- CÁLCULOS FÍSICOS EN VIVO --
  const rad = (rampa.angulo * Math.PI) / 180;
  const W = seed.masa * G;
  const N = W * Math.cos(rad);
  const Wx = W * Math.sin(rad);
  const fsMax = seed.muS * N;
  
  // Fuerza de fricción efectiva
  const f = rampa.deslizando 
    ? muK * N 
    : Math.min(Wx, fsMax);

  // -- LÓGICA DE ACTUALIZACIÓN --
  useEffect(() => {
    if (!rampa.deslizando && Wx > fsMax + 0.01) {
      setRampa(prev => ({ ...prev, deslizando: true }));
      setBitacora({ 
        ...bitacoraData, 
        fisica2: `⚠️ ¡Deslizamiento incontrolado! El bloque cayó en θ=${rampa.angulo}° (μs=${seed.muS})` 
      });
    }
  }, [Wx, fsMax, rampa.deslizando]);

  // -- HANDLERS --
  const handleReset = () => {
    setRampa({ angulo: 0, deslizando: false, bloqueX: 20, resultado: null });
  };

  const handleValidar = () => {
    const val = parseFloat(teoricoInput);
    const precision = Math.abs(val - anguloCritico);
    
    if (precision <= 0.5) {
      setRampa(prev => ({ ...prev, resultado: 'exito' }));
      setBitacora({ 
        ...bitacoraData, 
        fisica2: `✅ VALIDADO: θc teórico=${val}°, μs=${seed.muS}. Masa=${seed.masa}kg.` 
      });
    } else {
      setIntentos(prev => prev + 1);
      setRampa(prev => ({ ...prev, resultado: 'error' }));
    }
  };

  // -- RENDER VECTORES (Escala visual) --
  const scale = 0.05; // Escala para que quepan en el SVG
  const vecW = W * scale;
  const vecN = N * scale;
  const vecWx = Wx * scale;
  const vecF = f * scale;

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit']">
      
      {/* 🔮 LIENZO SVG (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative overflow-hidden flex flex-col justify-end p-20">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_30%_30%,#6366f108_0%,transparent_50%)]" />
        
        {/* HUD TELEMÉTRICO (LIVE) */}
        <div className="absolute top-10 left-10 flex gap-4 z-20">
           <div className="bg-slate-900/80 backdrop-blur-xl border border-white/10 p-5 rounded-3xl flex items-center gap-4 shadow-2xl">
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase">Fricción Max (fs)</p>
                 <p className="text-xl font-black text-white">{fsMax.toFixed(1)} <span className="text-[10px]">N</span></p>
              </div>
              <div className="w-px h-8 bg-white/10" />
              <div className="space-y-1">
                 <p className="text-[10px] font-black text-slate-500 uppercase">Fuerza Desliz (Wx)</p>
                 <p className={`text-xl font-black ${Wx > fsMax ? 'text-red-500' : 'text-indigo-400'}`}>{Wx.toFixed(1)} <span className="text-[10px]">N</span></p>
              </div>
           </div>
        </div>

        {/* ESCENA SVG */}
        <div className="relative w-full aspect-[16/9] flex items-end">
           <svg 
            viewBox="0 0 200 112" 
            className="w-full h-full overflow-visible"
           >
              {/* Bisagra / Pivote */}
              <circle cx="20" cy="100" r="3" fill="#1e1b4b" stroke="#6366f1" strokeWidth="1" />

              {/* RAMPA DINÁMICA */}
              <motion.g animate={{ rotate: -rampa.angulo }} style={{ originX: '20px', originY: '100px' }}>
                 {/* La Hipotenusa */}
                 <rect x="20" y="99" width="160" height="2" fill="white" opacity="0.05" />
                 <line x1="20" y1="100" x2="180" y2="100" stroke="#6366f1" strokeWidth="0.8" />
                 
                 {/* El Bloque */}
                 <motion.g 
                  animate={{ x: rampa.deslizando ? 150 : 30 }} 
                  transition={{ duration: rampa.deslizando ? 1.5 : 0.4, ease: "easeIn" }}
                 >
                    <rect x="-10" y="-12" width="20" height="12" fill="#0f172a" stroke="#6366f1" strokeWidth="0.5" rx="1" />
                    <rect x="-8" y="-10" width="16" height="2" fill="#6366f1" opacity="0.2" rx="0.5" />
                    
                    {/* VECTORES DINÁMICOS (Relativos al bloque) */}
                    <g className="pointer-events-none">
                       {/* W (Peso - Eje Y Global) */}
                       <g transform={`rotate(${rampa.angulo})`}>
                          <line x1="0" y1="-6" x2="0" y2={vecW} stroke="#ef4444" strokeWidth="0.8" markerEnd="url(#arrow-red)" />
                          <text x="2" y={vecW} fill="#ef4444" fontSize="4" fontWeight="black">W</text>
                       </g>

                       {/* N (Normal - Perpendicular) */}
                       <line x1="0" y1="-6" x2="0" y2={-6 - vecN} stroke="#3b82f6" strokeWidth="0.8" markerEnd="url(#arrow-blue)" />
                       <text x="2" y={-6 - vecN} fill="#3b82f6" fontSize="4" fontWeight="black">N</text>

                       {/* Wx (Deslizamiento - Paralelo down) */}
                       <line x1="0" y1="-6" x2={vecWx} y2="-6" stroke="#f59e0b" strokeWidth="0.8" markerEnd="url(#arrow-yellow)" />
                       <text x={vecWx} y="-1" fill="#f59e0b" fontSize="4" fontWeight="black">Wx</text>

                       {/* f (Fricción - Paralelo up) */}
                       <line x1="0" y1="-6" x2={-vecF} y2="-6" stroke="#10b981" strokeWidth="0.8" markerEnd="url(#arrow-green)" />
                       <text x={-vecF - 5} y="-1" fill="#10b981" fontSize="4" fontWeight="black">f</text>
                    </g>
                 </motion.g>
              </motion.g>

              {/* Suelo (Sombra) */}
              <line x1="0" y1="100.4" x2="200" y2="100.4" stroke="rgba(99,102,241,0.1)" strokeWidth="0.5" />

              {/* Marcadores de flecha */}
              <defs>
                 <marker id="arrow-red" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#ef4444" /></marker>
                 <marker id="arrow-blue" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#3b82f6" /></marker>
                 <marker id="arrow-yellow" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f59e0b" /></marker>
                 <marker id="arrow-green" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#10b981" /></marker>
              </defs>
           </svg>
        </div>

        {/* FEEDBACK OVERLAY */}
        <AnimatePresence>
           {rampa.resultado === 'exito' && (
             <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-sm">
                <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-emerald-500">
                   <div className="w-20 h-20 bg-emerald-100 text-emerald-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                   <h3 className="text-3xl font-black text-[#023047] uppercase tracking-tighter mb-4 italic">¡Teoría Perfecta!</h3>
                   <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has calculado con éxito el ángulo de ruptura vectorial. Dominio total de las Leyes de Newton.</p>
                   <button 
                    onClick={() => router.push('/alumno/laboratorio/fisica')}
                    className="w-full py-5 bg-[#023047] text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-emerald-600 transition-all"
                   >
                     Finalizar Práctica
                   </button>
                </div>
             </motion.div>
           )}

           {rampa.resultado === 'error' && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-xs tracking-widest border-b-4 border-red-700">
                <AlertCircle size={20} /> Error en el cálculo ({intentos} intento)
                <button onClick={() => setRampa(p => ({ ...p, resultado: null }))} className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all">OK</button>
             </motion.div>
           )}
        </AnimatePresence>

        {/* MODO INSTRUCTOR (DEMO) */}
        <div className="absolute bottom-10 right-10">
           <button 
            onClick={() => {
               setTeoricoInput(anguloCritico.toFixed(1));
               setRampa(p => ({ ...p, angulo: parseFloat(anguloCritico.toFixed(1)) }));
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
