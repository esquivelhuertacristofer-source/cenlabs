"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { 
  ArrowRight, ArrowLeft, RotateCcw, Zap, Target, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Activity, Scaling, Box, MoveHorizontal, Gauge
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Tipos y Constantes
// ==========================================

const RAIL_WIDTH = 800; // Píxeles del riel en el SVG
const CART_WIDTH = 60;  // Ancho visual del carrito

interface SimulationState {
  v1i: number;
  v2i: number;
  e: number; // Coeficiente de restitución
  phase: 'idle' | 'running' | 'impact' | 'post-impact';
}

// ==========================================
// Componente Principal: PilotoColisiones1D
// ==========================================

export default function PilotoColisiones1D() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();
  const cart1Controls = useAnimation();
  const cart2Controls = useAnimation();

  // -- SEMILLA: MASAS Y VELOCIDAD INICIAL 2 --
  const [seed] = useState(() => ({
    m1: Math.floor(Math.random() * 5) + 1,
    m2: Math.floor(Math.random() * 5) + 1,
    v2i: -1 * (Math.random() * 5) // m/s (hacia la izquierda o quieto)
  }));

  // -- ESTADO LOCAL --
  const [sistema, setSistema] = useState<SimulationState>({
    v1i: 5,
    v2i: seed.v2i,
    e: 1.0,
    phase: 'idle'
  });

  const [bitacoraInput, setBitacoraInput] = useState({ pTotal: "", v2f: "" });
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);

  // -- MOTOR DE CÁLCULO DE COLISIONES --
  const physics = useMemo(() => {
    const { m1, m2 } = seed;
    const { v1i, v2i, e } = sistema;
    
    // Conservación del momento y definición de e
    const v1f = ((m1 - e * m2) * v1i + (m2 + e * m2) * v2i) / (m1 + m2);
    const v2f = ((m1 + e * m1) * v1i + (m2 - e * m1) * v2i) / (m1 + m2);
    
    const pi = m1 * v1i + m2 * v2i;
    const ki = 0.5 * m1 * v1i**2 + 0.5 * m2 * v2i**2;
    const kf = 0.5 * m1 * v1f**2 + 0.5 * m2 * v2f**2;

    return { v1f, v2f, pi, ki, kf };
  }, [sistema, seed]);

  // -- HANDLERS DE ANIMACIÓN --
  const handleSimular = async () => {
    if (sistema.phase !== 'idle') return;
    setSistema(prev => ({ ...prev, phase: 'running' }));

    // Posiciones iniciales (normalizadas 0 a 800)
    const x1_start = 50;
    const x2_start = 600;
    const impactPoint = 350; // Simplificado para visualización

    // Fase 1: Aproximación
    const approachTime = 2.0;
    await Promise.all([
      cart1Controls.start({ x: impactPoint - CART_WIDTH, transition: { duration: approachTime, ease: "linear" } }),
      cart2Controls.start({ x: impactPoint, transition: { duration: approachTime, ease: "linear" } })
    ]);

    // Fase 2: Impacto
    setSistema(prev => ({ ...prev, phase: 'impact' }));
    await new Promise(r => setTimeout(r, 200));

    // Fase 3: Post-Impacto
    setSistema(prev => ({ ...prev, phase: 'post-impact' }));
    
    // Calcular desplazamientos finales
    const vScale = 50; // Escala de píxeles por m/s para el desplazamiento final
    const recoilTime = 2.0;

    await Promise.all([
        cart1Controls.start({ 
          x: (impactPoint - CART_WIDTH) + (physics.v1f * vScale * recoilTime), 
          transition: { duration: recoilTime, ease: "easeOut" } 
        }),
        cart2Controls.start({ 
          x: impactPoint + (physics.v2f * vScale * recoilTime), 
          transition: { duration: recoilTime, ease: "easeOut" } 
        })
    ]);
  };

  const handleReset = () => {
    setSistema(prev => ({ ...prev, phase: 'idle' }));
    setResultado(null);
    cart1Controls.set({ x: 50 });
    cart2Controls.set({ x: 600 });
  };

  const handleValidar = () => {
    const pVal = parseFloat(bitacoraInput.pTotal);
    const v2Val = parseFloat(bitacoraInput.v2f);

    const checkP = Math.abs(pVal - physics.pi) <= 0.5;
    const checkV2 = Math.abs(v2Val - physics.v2f) <= 0.5;

    if (checkP && checkV2) {
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica5: `✅ VALIDADO: Choque e=${sistema.e}. v1i=${sistema.v1i}. p=${physics.pi.toFixed(2)}kg·m/s.` 
      });
    } else {
      setResultado('error');
    }
  };


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full flex flex-col p-20 relative overflow-hidden">
        {/* HUD DE CONSERVACIÓN */}
        <div className="grid grid-cols-2 gap-10 mb-20 z-10">
           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-orange-500 group-hover:w-full transition-all duration-700" style={{ width: '30%' }} />
              <div className="flex justify-between items-end mb-4">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Momento Total (P)</h4>
                    <p className="text-2xl font-black text-white">{physics.pi.toFixed(2)} <span className="text-[10px]">kg·m/s</span></p>
                 </div>
                 <Gauge className="text-orange-500" size={24} />
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: "100%" }}
                    className="h-full bg-orange-500"
                 />
              </div>
              <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase">Ley de Conservación: p(i) = p(f)</p>
           </div>

           <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-0 left-0 h-1 bg-emerald-500 group-hover:w-full transition-all duration-700" style={{ width: '30%' }} />
              <div className="flex justify-between items-end mb-4">
                 <div>
                    <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Energía Cinética (Ek)</h4>
                    <p className="text-2xl font-black text-white">{(sistema.phase === 'post-impact' ? physics.kf : physics.ki).toFixed(1)} <span className="text-[10px]">J</span></p>
                 </div>
                 <Sparkles className="text-emerald-500" size={24} />
              </div>
              <div className="w-full h-2 bg-slate-800 rounded-full overflow-hidden">
                 <motion.div 
                    initial={{ width: "100%" }}
                    animate={{ width: `${(physics.kf / physics.ki) * 100}%` }}
                    transition={{ duration: 0.5 }}
                    className="h-full bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]"
                 />
              </div>
              <p className="text-[8px] font-bold text-slate-500 mt-2 uppercase">Disipación por Calor / Deformación: {(100 - (physics.kf / physics.ki) * 100).toFixed(0)}%</p>
           </div>
        </div>

        {/* ESCENA SVG */}
        <div className="flex-grow flex items-center justify-center">
           <svg viewBox="0 0 800 200" className="w-full overflow-visible">
              {/* Riel de Aire */}
              <rect x="0" y="140" width="800" height="4" fill="#1e293b" rx="2" />
              <line x1="0" y1="144" x2="800" y2="144" stroke="white" strokeWidth="0.5" opacity="0.05" />

              {/* Marcas de distancia */}
              {Array.from({ length: 9 }).map((_, i) => (
                <text key={i} x={i * 100} y="160" fill="white" opacity="0.1" fontSize="10" textAnchor="middle">{i}m</text>
              ))}

              {/* CARRITO 1 (Naranja) */}
              <motion.g animate={cart1Controls} initial={{ x: 50 }}>
                 {/* Vector Velocidad 1 */}
                 <AnimatePresence>
                    {sistema.phase !== 'impact' && (
                       <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <line 
                            x1="30" y1="-20" 
                            x2={30 + (sistema.phase === 'post-impact' ? physics.v1f : sistema.v1i) * 15} y2="-20" 
                            stroke="#f97316" strokeWidth="3" markerEnd="url(#arrow-orange)" 
                          />
                          <text x="35" y="-30" fill="#f97316" fontSize="12" fontWeight="black">v1</text>
                       </motion.g>
                    )}
                 </AnimatePresence>

                 {/* Cuerpo Carrito */}
                 <rect width={CART_WIDTH} height="30" y="110" fill="#0f172a" stroke="#f97316" strokeWidth="2" rx="4" />
                 <rect width="40" height="4" x="10" y="114" fill="#f97316" opacity="0.2" rx="2" />
                 <text x="30" y="130" fill="#f97316" fontSize="10" fontWeight="black" textAnchor="middle">{seed.m1}kg</text>
                 
                 {/* Ruedas */}
                 <circle cx="15" cy="140" r="4" fill="#1e1b4b" stroke="#f97316" strokeWidth="1" />
                 <circle cx="45" cy="140" r="4" fill="#1e1b4b" stroke="#f97316" strokeWidth="1" />
              </motion.g>

              {/* CARRITO 2 (Indigo) */}
              <motion.g animate={cart2Controls} initial={{ x: 600 }}>
                 {/* Vector Velocidad 2 */}
                 <AnimatePresence>
                    {sistema.phase !== 'impact' && (
                       <motion.g initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                          <line 
                            x1="30" y1="-20" 
                            x2={30 + (sistema.phase === 'post-impact' ? physics.v2f : sistema.v2i) * 15} y2="-20" 
                            stroke="#818cf8" strokeWidth="3" markerEnd="url(#arrow-indigo)" 
                          />
                          <text x="35" y="-30" fill="#818cf8" fontSize="12" fontWeight="black">v2</text>
                       </motion.g>
                    )}
                 </AnimatePresence>

                 {/* Cuerpo Carrito */}
                 <rect width={CART_WIDTH} height="30" y="110" fill="#0f172a" stroke="#818cf8" strokeWidth="2" rx="4" />
                 <rect width="40" height="4" x="10" y="114" fill="#818cf8" opacity="0.2" rx="2" />
                 <text x="30" y="130" fill="#818cf8" fontSize="10" fontWeight="black" textAnchor="middle">{seed.m2}kg</text>

                 {/* Ruedas */}
                 <circle cx="15" cy="140" r="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
                 <circle cx="45" cy="140" r="4" fill="#1e1b4b" stroke="#818cf8" strokeWidth="1" />
              </motion.g>

              {/* EFECTO DE IMPACTO */}
              {sistema.phase === 'impact' && (
                 <motion.g initial={{ opacity: 0, scale: 0 }} animate={{ opacity: 1, scale: 1.5 }} exit={{ opacity: 0 }}>
                    <circle cx="350" cy="125" r="20" fill="white" opacity="0.3" />
                    <Sparkles x="330" y="105" className="text-yellow-400" />
                 </motion.g>
              )}

              {/* DEFINICIÓN DE FLECHAS */}
              <defs>
                 <marker id="arrow-orange" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#f97316" /></marker>
                 <marker id="arrow-indigo" markerWidth="6" markerHeight="6" refX="6" refY="3" orient="auto"><path d="M0,0 L6,3 L0,6 Z" fill="#818cf8" /></marker>
              </defs>
           </svg>
        </div>

        {/* FEEDBACK OVERLAY */}
        <AnimatePresence>
           {resultado === 'exito' && (
             <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-orange-500">
                   <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                   <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">¡Impacto Verificado!</h3>
                   <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has comprobado la Ley de Conservación del Momento Lineal con precisión científica.</p>
                   <button 
                    onClick={() => router.push('/alumno/laboratorio/fisica')}
                    className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/20"
                   >
                     Finalizar Informe
                   </button>
                </div>
             </motion.div>
           )}

           {resultado === 'error' && (
             <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700">
                <AlertCircle size={20} /> Error en los cálculos del sistema. Verifica p(inicial) y v2(final).
                <button onClick={() => setResultado(null)} className="px-4 py-1 bg-white/20 rounded-lg hover:bg-white/30 transition-all text-[8px]">Ok</button>
             </motion.div>
           )}
        </AnimatePresence>

        {/* MODO INSTRUCTOR (DEMO) */}
        <div className="absolute bottom-10 right-10">
           <button 
            onClick={() => {
               setBitacoraInput({ pTotal: physics.pi.toFixed(2), v2f: physics.v2f.toFixed(2) });
               handleSimular();
            }} 
            className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
           >
             <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Cálculo Rápido (Demo)
           </button>
        </div>
      </main>
    </div>
  );
}
