"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, Compass, MoveHorizontal, ArrowLeftRight, Activity, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Gauge, Scaling, Boxes, Settings, Target, Ruler
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes Físicas
// ==========================================

const K_SCALED = 89.87; // k_e * 10^9 * 1e-12 / 1e-4 = 89.87 (F en N para q en uC y r en cm)

// ==========================================
// Componente Principal: PilotoElectrostatica
// ==========================================

export default function PilotoElectrostatica() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: CARGA OCULTA q2 --
  const [seed] = useState(() => {
    let q = 0;
    while(Math.abs(q) < 2) q = (Math.random() * 20) - 10; // Entre -10 y 10 uC, min 2uC para visibilidad
    return { q2_oculta: parseFloat(q.toFixed(2)) };
  });

  // -- ESTADO LOCAL --
  const [sistema, setSistema] = useState({
    q1: 5,        // uC (-10 a 10)
    distancia: 15 // cm (5 a 50)
  });

  const [inputQ2, setInputQ2] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);
  const [showFields, setShowFields] = useState(false);

  // -- CÁLCULOS FÍSICOS --
  const F = (K_SCALED * Math.abs(sistema.q1 * seed.q2_oculta)) / Math.pow(sistema.distancia, 2);
  const isAtraccion = (sistema.q1 * seed.q2_oculta) < 0;
  const isRepulsion = (sistema.q1 * seed.q2_oculta) > 0;
  const isNeutral = sistema.q1 === 0;

  // Escala visual del vector (Logarítmica para manejar el rango masivo de la ley del inverso al cuadrado)
  const vectorLen = isNeutral ? 0 : 15 + Math.min(80, 20 * Math.log10(F + 1));

  // -- HANDLERS --
  const handleValidar = () => {
    const val = parseFloat(inputQ2);
    const error = Math.abs(val - seed.q2_oculta);
    
    if (error <= 0.2) { // Tolerancia de 0.2 uC
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica9: `✅ VALIDADO: q2_real=${seed.q2_oculta}μC. q2_alumno=${val}μC. d=${sistema.distancia}cm.` 
      });
    } else {
      setResultado('error');

    }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative text-white">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative flex flex-col p-20 overflow-hidden">
         
         {/* Regla / Riel Millimétrico */}
         <div className="absolute inset-x-20 bottom-1/3 h-12 border-t border-slate-800 flex justify-between items-start pt-2 z-0">
            {Array.from({ length: 11 }).map((_, i) => (
               <div key={i} className="flex flex-col items-center">
                  <div className="w-px h-3 bg-slate-700" />
                  <span className="text-[8px] font-black text-slate-700 mt-1">{i * 5}</span>
               </div>
            ))}
            <div className="absolute -top-1 left-0 w-full h-[2px] bg-indigo-500/20" />
            <span className="absolute -top-6 left-1/2 -translate-x-1/2 text-[8px] font-black text-slate-600 uppercase tracking-widest italic">Riel de Desplazamiento Electromagnético (cm)</span>
         </div>

         {/* ESCENA SVG */}
         <svg width="800" height="400" viewBox="0 0 800 400" className="overflow-visible z-10 transition-transform duration-1000">
            
            {/* CARGA 1 (Fija en Centro-Izquierda) */}
            <g transform="translate(200, 200)">
               {/* Halos Reactive */}
               <AnimatePresence>
                  {sistema.q1 !== 0 && (
                     <motion.circle 
                        animate={{ 
                           scale: sistema.q1 > 0 ? [1, 1.4, 1] : [1.4, 1, 1.4], 
                           opacity: sistema.q1 > 0 ? [0.4, 0, 0.4] : [0, 0.4, 0] 
                        }}
                        transition={{ repeat: Infinity, duration: 2, ease: "easeInOut" }}
                        r="50" fill={sistema.q1 > 0 ? "url(#positive-glow)" : "url(#negative-glow)"}
                     />
                  )}
               </AnimatePresence>
               
               {/* Esfera q1 */}
               <circle r="20" fill={sistema.q1 > 0 ? "#3b82f6" : (sistema.q1 < 0 ? "#ef4444" : "#475569")} className="shadow-2xl" />
               <text textAnchor="middle" y="5" fill="white" fontSize="12" fontWeight="black" className="pointer-events-none tracking-tighter">
                  {sistema.q1 > 0 ? '+' : (sistema.q1 < 0 ? '-' : '0')}
               </text>
               <text textAnchor="middle" y="40" fill="white" fontSize="8" fontWeight="black" className="uppercase tracking-widest opacity-40 italic">Carga q₁</text>

               {/* VECTOR FUERZA 1 */}
               {!isNeutral && (
                 <motion.line 
                   animate={{ x2: isAtraccion ? vectorLen : -vectorLen }}
                   x1="0" y1="0" x2="0" y2="0" stroke="#facc15" strokeWidth="4" strokeLinecap="round" 
                 />
               )}
            </g>

            {/* CARGA 2 (Móvil según Distancia) */}
            {/* Mapeo: 200px es el origen. Añadimos sistema.distancia * 10 para escala visual */}
            <motion.g animate={{ x: 200 + (sistema.distancia * 10) }} y="200" transition={{ type: "spring", stiffness: 100, damping: 20 }}>
               {/* Halos Reactive q2 */}
               <AnimatePresence>
                  <motion.circle 
                     animate={{ 
                        scale: seed.q2_oculta > 0 ? [1, 1.4, 1] : [1.4, 1, 1.4], 
                        opacity: seed.q2_oculta > 0 ? [0.4, 0, 0.4] : [0, 0.4, 0] 
                     }}
                     transition={{ repeat: Infinity, duration: 2.2, ease: "easeInOut" }}
                     r="50" fill={seed.q2_oculta > 0 ? "url(#positive-glow)" : "url(#negative-glow)"}
                  />
               </AnimatePresence>

               {/* Esfera q2 */}
               <circle r="20" fill={seed.q2_oculta > 0 ? "#3b82f6" : "#ef4444"} className="shadow-2xl" />
               <text textAnchor="middle" y="5" fill="white" fontSize="12" fontWeight="black" className="pointer-events-none tracking-tighter">
                  {showFields ? (seed.q2_oculta > 0 ? '+' : '-') : '?'}
               </text>
               <text textAnchor="middle" y="40" fill="white" fontSize="8" fontWeight="black" className="uppercase tracking-widest opacity-40 italic">Carga q₂</text>
               
               {showFields && (
                 <text textAnchor="middle" y="-35" fill="#indigo-400" fontSize="10" fontWeight="black">{seed.q2_oculta} μC</text>
               )}

               {/* VECTOR FUERZA 2 */}
               {!isNeutral && (
                 <motion.line 
                   animate={{ x2: isAtraccion ? -vectorLen : vectorLen }}
                   x1="0" y1="0" x2="0" y2="0" stroke="#facc15" strokeWidth="4" strokeLinecap="round" 
                 />
               )}

               {/* Amortiguador visual para vector repulsivo */}
               {isRepulsion && (
                 <line x1={vectorLen} y1="-5" x2={vectorLen} y2="5" stroke="#facc15" strokeWidth="2" />
               )}
            </motion.g>

            {/* DEFINICIONES DE GRADIENTES */}
            <defs>
               <radialGradient id="positive-glow">
                  <stop offset="0%" stopColor="#3b82f6" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
               </radialGradient>
               <radialGradient id="negative-glow">
                  <stop offset="0%" stopColor="#ef4444" />
                  <stop offset="100%" stopColor="#0f172a" stopOpacity="0" />
               </radialGradient>
            </defs>
         </svg>

         {/* FEEDBACK OVERLAY */}
         <AnimatePresence>
            {resultado === 'exito' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                 <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-indigo-500">
                    <div className="w-20 h-20 bg-indigo-100 text-indigo-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Carga Identificada</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed italic">Has resuelto la Ley de Coulomb: <span className="text-indigo-600 font-black">{seed.q2_oculta} μC</span>. El campo eléctrico ha sido mapeado con éxito.</p>
                    <button 
                     onClick={() => router.push('/alumno/laboratorio/fisica')}
                     className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-indigo-600 transition-all shadow-xl shadow-indigo-900/20"
                    >
                      Cerrar Bitácora
                    </button>
                 </div>
              </motion.div>
            )}

            {resultado === 'error' && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700 pointer-events-none italic">
                 <AlertCircle size={20} /> Error en la estimación de carga. Reajusta tus cálculos y verifica los signos.
              </motion.div>
            )}
         </AnimatePresence>

         {/* MODO INSTRUCTOR */}
         <div className="absolute bottom-10 right-10 flex gap-4">
            <button 
             onClick={() => setShowFields(!showFields)}
             className={`px-6 py-3 border rounded-2xl text-[10px] font-black uppercase tracking-widest transition-all flex items-center gap-3 ${showFields ? 'bg-indigo-600 border-indigo-400 text-white' : 'bg-white/5 border-white/10 text-slate-500'}`}
            >
              <Activity size={14} /> {showFields ? 'Ocultar Campo' : 'Mostrar Campo (Demo)'}
            </button>
            <button 
             onClick={() => {
                setInputQ2(seed.q2_oculta.toString());
                setShowFields(true);
             }} 
             className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Calcular
            </button>
         </div>
      </main>
    </div>
  );
}
