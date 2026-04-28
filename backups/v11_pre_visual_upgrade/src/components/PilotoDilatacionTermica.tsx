"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Thermometer, ArrowUpRight, RotateCcw, Zap, 
  CheckCircle2, AlertCircle, Info, Binary, Sparkles,
  Gauge, Scaling, Boxes, Activity, Ruler
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

// ==========================================
// Constantes y Datos de Materiales
// ==========================================

const MATERIALES = {
  aluminio: { nombre: 'Aluminio', alpha: 23e-6, color: '#CBD5E1' },
  cobre: { nombre: 'Cobre', alpha: 17e-6, color: '#B45309' },
  acero: { nombre: 'Acero', alpha: 12e-6, color: '#475569' },
  misterioso: { nombre: 'Metal Desconocido', alpha: 0, color: '#6366f1' }
};

const INITIAL_TEMP = 20;
const INITIAL_LENGTH = 500; // mm

// ==========================================
// Componente Principal: PilotoDilatacionTermica
// ==========================================

export default function PilotoDilatacionTermica() {
  const router = useRouter();
  const { setBitacora, bitacoraData } = useSimuladorStore();

  // -- SEMILLA: METAL MISTERIOSO --
  const [seed] = useState(() => ({
    alphaMisterioso: (Math.random() * (23 - 17) + 17) * 1e-6
  }));

  // -- ESTADO LOCAL --
  const [experimento, setExperimento] = useState({
    material: 'aluminio' as keyof typeof MATERIALES,
    tempActual: INITIAL_TEMP,
    power: 50,
    isHeating: false
  });

  const [alphaInput, setAlphaInput] = useState("");
  const [resultado, setResultado] = useState<'exito' | 'error' | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  // -- LÓGICA DE CALENTAMIENTO --
  useEffect(() => {
    if (experimento.isHeating && experimento.tempActual < 120) {
      timerRef.current = setInterval(() => {
        setExperimento(prev => {
          const nextTemp = prev.tempActual + (prev.power / 100);
          return { ...prev, tempActual: Math.min(nextTemp, 120) };
        });
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [experimento.isHeating, experimento.power]);

  // -- CÁLCULOS FÍSICOS --
  const alphaActual = experimento.material === 'misterioso' 
    ? seed.alphaMisterioso 
    : MATERIALES[experimento.material].alpha;

  const deltaL = alphaActual * INITIAL_LENGTH * (experimento.tempActual - INITIAL_TEMP);

  const handleValidar = () => {
    const val = parseFloat(alphaInput) * 1e-6;
    const error = Math.abs(val - alphaActual) / alphaActual;
    
    if (error <= 0.05) { // 5% de tolerancia
      setResultado('exito');
      setBitacora({ 
        ...bitacoraData, 
        fisica7: `✅ VALIDADO: α=${(alphaActual * 1e6).toFixed(2)}x10⁻⁶. Alumno calculó ${alphaInput}x10⁻⁶. Material=${experimento.material}.` 
      });
    } else {
      setResultado('error');
    }
  };

  const handleReset = () => {
    setExperimento(prev => ({ ...prev, tempActual: INITIAL_TEMP, isHeating: false }));
    setResultado(null);
  };

  // -- VISUAL RENDERING --
  // Gradiente de color según temperatura (20°C a 120°C)
  const heatFactor = (experimento.tempActual - INITIAL_TEMP) / 100;
  // Gris (#64748b) a Naranja Rojo (#f97316)
  const barColor = heatFactor > 0.5 ? '#f97316' : '#64748b';
  const barGlow = `0 0 ${heatFactor * 20}px rgba(249, 115, 22, ${heatFactor})`;


  return (
    <div className="flex h-full w-full overflow-hidden bg-slate-950 font-['Outfit'] relative">
      {/* 🔮 LIENZO (100% del contenedor Piloto) */}
      <main className="flex-grow h-full relative flex flex-col p-20 overflow-hidden">
         {/* HUD SUPERIOR */}
         <div className="flex justify-between items-start mb-10 z-10">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl">
               <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Longitud Inicial (L₀)</h4>
               <p className="text-2xl font-black text-white">500.000 <span className="text-[10px] text-slate-500">mm</span></p>
            </div>
            <div className="bg-slate-900/60 backdrop-blur-xl border border-white/5 p-6 rounded-3xl flex items-center gap-6">
                <div>
                  <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1 italic">Estado Atómico</h4>
                  <div className="flex gap-1">
                     {[1,2,3,4].map(i => (
                        <motion.div 
                          key={i}
                          animate={{ 
                            scale: 1 + (heatFactor * 0.2), 
                            opacity: 0.5 + (heatFactor * 0.5),
                            x: [0, heatFactor * 2, 0] 
                          }}
                          transition={{ repeat: Infinity, duration: 0.5 / (1 + heatFactor) }}
                          className="w-2 h-2 rounded-full bg-orange-400 shadow-[0_0_8px_rgba(251,146,60,0.5)]" 
                        />
                     ))}
                  </div>
                </div>
                <Activity className="text-orange-500 animate-pulse" />
            </div>
         </div>

         {/* ESCENA SVG BANCO DE PRUEBAS */}
         <div className="flex-grow flex items-center justify-center relative">
            <svg width="600" height="300" viewBox="0 0 600 300" className="overflow-visible">
               {/* Soportes */}
               <rect x="50" y="200" width="20" height="40" fill="#1e293b" rx="2" />
               <rect x="530" y="200" width="20" height="40" fill="#1e293b" rx="2" />
               <rect x="0" y="240" width="600" height="4" fill="#0f172a" rx="2" />

               {/* Calentador Glow */}
               <motion.rect 
                 x="100" y="210" width="400" height="20"
                 animate={{ 
                   fill: experimento.isHeating ? '#f97316' : '#1e293b',
                   opacity: experimento.isHeating ? [0.3, 0.6, 0.3] : 0.1
                 }}
                 transition={{ repeat: Infinity, duration: 1 }}
                 rx="10" filter="blur(4px)"
               />

               {/* LA BARRA METÁLICA */}
               <motion.rect 
                  x="70" y="205" 
                  animate={{ 
                    width: 460 + (deltaL * 5), // Elongación exagerada 5x para visibilidad visual bruta
                    fill: heatFactor > 0.5 ? '#f97316' : MATERIALES[experimento.material].color 
                  }}
                  height="12" 
                  rx="6"
                  style={{ boxShadow: barGlow }}
               />

               {/* RELOJ COMPARADOR (GAUGE) */}
               <g transform="translate(560, 200)">
                  {/* Cuerpo Dial */}
                  <circle r="45" fill="#0f172a" stroke="#475569" strokeWidth="4" />
                  <circle r="40" fill="white" fillOpacity="0.05" />
                  
                  {/* Marcas de Grados */}
                  {Array.from({ length: 12 }).map((_, i) => (
                    <line key={i} x1="0" y1="-35" x2="0" y2="-40" stroke="#475569" strokeWidth="2" transform={`rotate(${i * 30})`} />
                  ))}
                  
                  {/* Aguja Giratoria */}
                  <motion.g animate={{ rotate: deltaL * 3600 }}> {/* 3600 deg por mm = 10 vueltas/mm */}
                     <line x1="0" y1="0" x2="0" y2="-38" stroke="#ef4444" strokeWidth="3" strokeLinecap="round" />
                     <circle r="4" fill="#0f172a" stroke="#ef4444" strokeWidth="2" />
                  </motion.g>

                  <text y="20" textAnchor="middle" fill="#64748b" fontSize="8" fontWeight="black" className="uppercase tracking-widest font-mono">μ-Meter</text>
               </g>

               {/* Etiquetas */}
               <text x="70" y="190" fill="#64748b" fontSize="10" fontWeight="bold">SOPORTE FIJO</text>
               <text x="460" y="190" fill="#64748b" fontSize="10" fontWeight="bold">EXTREMO DESLIZANTE</text>
            </svg>
         </div>

         {/* FEEDBACK OVERLAY */}
         <AnimatePresence>
            {resultado === 'exito' && (
              <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }} className="absolute inset-0 z-50 flex items-center justify-center p-20 backdrop-blur-md">
                 <div className="bg-white rounded-[3rem] p-12 max-w-sm w-full text-center shadow-2xl border-t-[12px] border-orange-500">
                    <div className="w-20 h-20 bg-orange-100 text-orange-500 rounded-full flex items-center justify-center mx-auto mb-8 animate-bounce"><CheckCircle2 size={40} /></div>
                    <h3 className="text-3xl font-black text-slate-900 uppercase tracking-tighter mb-4 italic">Material Identificado</h3>
                    <p className="text-slate-500 font-bold mb-8 leading-relaxed">Has calculado el coeficiente α con precisión microscópica: <span className="text-orange-600 font-black">{(alphaActual * 1e6).toFixed(2)}x10⁻⁶</span>.</p>
                    <button 
                     onClick={() => router.push('/alumno/laboratorio/fisica')}
                     className="w-full py-5 bg-slate-900 text-white font-black text-xs uppercase tracking-widest rounded-2xl hover:bg-orange-600 transition-all shadow-xl shadow-orange-900/20"
                    >
                      Cerrar Bitácora
                    </button>
                 </div>
              </motion.div>
            )}

            {resultado === 'error' && (
              <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: 50, opacity: 0 }} className="absolute bottom-10 left-1/2 -translate-x-1/2 px-8 py-4 bg-red-500 text-white rounded-full flex items-center gap-4 shadow-2xl font-black uppercase text-[10px] tracking-widest border-b-4 border-red-700 pointer-events-none">
                 <AlertCircle size={20} /> Error en el cálculo de dilatación. Verifica el ΔL y ΔT.
              </motion.div>
            )}
         </AnimatePresence>

         {/* MODO INSTRUCTOR */}
         <div className="absolute bottom-10 right-10">
            <button 
             onClick={() => {
                setAlphaInput((alphaActual * 1e6).toFixed(2));
                setExperimento(prev => ({ ...prev, tempActual: 100, isHeating: false }));
             }} 
             className="group px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[10px] font-black text-slate-500 hover:text-white uppercase tracking-widest transition-all flex items-center gap-3"
            >
              <Binary size={14} className="group-hover:rotate-12 transition-transform" /> Auto-Calcular (Demo)
            </button>
         </div>
      </main>
    </div>
  );
}
