"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Flame, Thermometer, RotateCcw, Zap, 
  CheckCircle2, AlertCircle, Binary, 
  Gauge, Activity, Bot, Target, Play, Pause, Ruler
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

const MATERIALES = {
  aluminio: { nombre: 'Aluminio', alpha: 23e-6, color: '#CBD5E1' },
  cobre: { nombre: 'Cobre', alpha: 17e-6, color: '#B45309' },
  acero: { nombre: 'Acero', alpha: 12e-6, color: '#475569' },
  misterioso: { nombre: 'Metal ?', alpha: 0, color: '#6366f1' }
};

const INITIAL_TEMP = 20;
const INITIAL_LENGTH = 500; // mm

export default function PilotoDilatacionTermica() {
  const router = useRouter();
  const { dilatacion7, setDilatacion7, setBitacora, bitacoraData, stopTimer, setPasoActual, audio, setAsistente } = useSimuladorStore();
  const { material = 'aluminio', tempFin = INITIAL_TEMP, tempIni = INITIAL_TEMP, longitud = INITIAL_LENGTH } = dilatacion7 || {};

  // -- SEMILLA: METAL MISTERIOSO (Local para sesión) --
  const [rhoMisteriosa] = useState(() => (Math.random() * (23 - 17) + 17) * 1e-6);
  const [isHeating, setIsHeating] = useState(false);
  const [alphaInput, setAlphaInput] = useState("");
  const [mounted, setMounted] = useState(false);
  const timerRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => { 
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de termodinámica. Inyecta vapor para elevar la temperatura y observa la dilatación lineal del metal. Calcula el coeficiente α con los datos obtenidos.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  // -- LÓGICA DE CALENTAMIENTO --
  useEffect(() => {
    if (isHeating && tempFin < 120) {
      timerRef.current = setInterval(() => {
        const nextTemp = Math.min(tempFin + 0.5, 120);
        setDilatacion7({ tempFin: nextTemp });
        if (nextTemp % 10 === 0) audio?.playPop();
      }, 100);
    } else {
      if (timerRef.current) clearInterval(timerRef.current);
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current); };
  }, [isHeating, tempFin, setDilatacion7, audio]);

  // -- CÁLCULOS FÍSICOS --
  const alphaActual = material === 'misterioso' ? rhoMisteriosa : MATERIALES[material as keyof typeof MATERIALES].alpha;
  const deltaL = alphaActual * longitud * (tempFin - tempIni);
  const heatFactor = (tempFin - tempIni) / 100;
  const barGlow = `0 0 ${heatFactor * 25}px rgba(249, 115, 22, ${heatFactor})`;

  const handleValidar = () => {
    const val = parseFloat(alphaInput) * 1e-6;
    if (isNaN(val)) {
       audio?.playError();
       return;
    }
    const error = Math.abs(val - alphaActual) / alphaActual;
    
    if (error <= 0.05) {
      audio?.playSuccess();
      stopTimer();
      setPasoActual(4);
      
      registrarHallazgo('fis_dilatacion_coeficiente', {
        material,
        longitud_inicial: longitud,
        temp_inicial: tempIni,
        temp_final: tempFin,
        delta_l_medido: deltaL,
        alpha_teorico: alphaActual,
        alpha_alumno: val
      });

      setBitacora({ 
        ...bitacoraData, 
        fisica7: `✅ VALIDADO: α=${(alphaActual * 1e6).toFixed(2)}x10⁻⁶. Material=${material}. ΔL=${deltaL.toFixed(4)}mm.` 
      });
    } else {
      audio?.playError();
    }
  };

  const toggleHeat = () => {
    setIsHeating(!isHeating);
    audio?.playPop();
    if (!isHeating) {
      audio?.playNotification();
    }
  };

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      
      {/* ── ESCENA DE LABORATORIO 3D-SVG ── */}
      <main className="flex-grow h-full relative flex flex-col p-12 overflow-hidden">
         
         {/* CHECKLIST HUD (DIAMOND STANDARD) */}
         <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
            <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <span className="text-[10px] font-black text-orange-400 uppercase tracking-widest flex items-center gap-2">
                  <Activity size={12} className="animate-pulse" /> Sincronía de Dilatación
                </span>
                <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Thermal Protocol HUD</span>
              </div>
              
              <div className="grid grid-cols-3 gap-6">
                <div className={`p-5 rounded-2xl border transition-all ${isHeating ? 'bg-orange-500/10 border-orange-500/30 shadow-[0_0_15px_rgba(249,115,22,0.1)]' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Energía</div>
                  <div className={`text-sm font-black italic ${isHeating ? 'text-orange-400' : 'text-white/20'}`}>{isHeating ? 'INYECCIÓN' : 'AMBIENTE'}</div>
                </div>
                <div className={`p-5 rounded-2xl border transition-all ${deltaL > 0.01 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Expansión</div>
                  <div className={`text-sm font-black italic ${deltaL > 0.01 ? 'text-amber-400' : 'text-white/20'}`}>{deltaL > 0.01 ? 'DETECTADA' : 'CERO'}</div>
                </div>
                <div className={`p-5 rounded-2xl border transition-all ${bitacoraData.fisica7 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
                  <div className="text-[9px] font-black uppercase text-white/40 mb-2">Coeficiente</div>
                  <div className={`text-sm font-black italic ${bitacoraData.fisica7 ? 'text-emerald-400' : 'text-white/20'}`}>{bitacoraData.fisica7 ? 'CERTIFICADO' : 'PENDIENTE'}</div>
                </div>
              </div>
            </div>
         </div>

         {/* GIANT TEMPERATURE HUD (CENTRAL) */}
         <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
            <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{tempFin.toFixed(0)}</div>
            <span className="text-xl font-black uppercase tracking-[1em] text-white/20">GRADOS CELSIUS</span>
         </div>

         {/* HUD SUPERIOR: TELEMETRÍA TÉRMICA */}
         <div className="flex justify-between items-start z-30 pointer-events-none">
            <div className="flex gap-4">
              <HUDCard label="Longitud Base (L₀)" value={`${longitud.toFixed(0)} mm`} icon={<Ruler size={14} />} color="#64748b" isStatic />
              <HUDCard label="Temperatura Actual" value={`${tempFin.toFixed(1)} °C`} icon={<Thermometer size={14} />} color="#f97316" highlight={isHeating} />
            </div>

            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2.5rem] flex items-center gap-8 shadow-2xl">
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-3 italic">Vibración Atómica</h4>
                   <div className="flex gap-2">
                      {[1,2,3,4,5].map(i => (
                         <motion.div 
                           key={i}
                           animate={{ 
                             scale: 1 + (heatFactor * 0.4), 
                             opacity: 0.3 + (heatFactor * 0.7),
                             x: [0, heatFactor * 6, 0] 
                           }}
                           transition={{ repeat: Infinity, duration: 0.4 / (0.5 + heatFactor) }}
                           className="w-3 h-3 rounded-full bg-orange-500 shadow-[0_0_15px_rgba(249,115,22,0.6)]" 
                         />
                      ))}
                   </div>
                </div>
                <Activity className={`text-orange-500 ${isHeating ? 'animate-pulse' : 'opacity-20'}`} size={32} />
            </div>
         </div>

         {/* BANCO DE PRUEBAS METALÚRGICO */}
         <div className="flex-grow flex items-center justify-center relative scale-110">
            <svg width="800" height="400" viewBox="0 0 800 400" className="overflow-visible drop-shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
               {/* Soportes Industriales */}
               <defs>
                 <linearGradient id="supportGrad" x1="0%" y1="0%" x2="100%" y2="100%">
                   <stop offset="0%" stopColor="#1e293b" />
                   <stop offset="100%" stopColor="#0f172a" />
                 </linearGradient>
               </defs>
               
               <rect x="100" y="280" width="30" height="60" fill="url(#supportGrad)" rx="4" />
               <rect x="670" y="280" width="30" height="60" fill="url(#supportGrad)" rx="4" />
               <rect x="50" y="340" width="700" height="8" fill="#020617" rx="4" />

               {/* Quemador Bunsen / Inyector Vapor */}
               <motion.path 
                 d="M200,340 L220,300 L580,300 L600,340 Z"
                 animate={{ 
                   fill: isHeating ? '#f9731633' : '#1e293b11',
                   stroke: isHeating ? '#f97316' : '#1e293b'
                 }}
                 strokeWidth="2" strokeDasharray="4 4"
               />

               {/* ESPÉCIMEN METÁLICO (LA BARRA) */}
               <motion.rect 
                  x="120" y="285" 
                  animate={{ 
                    width: 580 + (deltaL * 15), // Escala exagerada para impacto visual
                    fill: heatFactor > 0.6 ? '#f43f5e' : MATERIALES[material as keyof typeof MATERIALES].color 
                  }}
                  height="20" 
                  rx="10"
                  style={{ filter: `drop-shadow(${barGlow})` }}
               />

               {/* MICRÓMETRO DIGITAL (DOCK DERECHO) */}
               <g transform="translate(720, 280)">
                  <circle r="60" fill="#0f172a" stroke="#334155" strokeWidth="6" />
                  <circle r="52" fill="#020617" />
                  
                  {/* Escala Graduada */}
                  {Array.from({ length: 24 }).map((_, i) => (
                    <line key={i} x1="0" y1="-45" x2="0" y2="-52" stroke="#334155" strokeWidth="2" transform={`rotate(${i * 15})`} />
                  ))}
                  
                  {/* Aguja de Precisión */}
                  <motion.g animate={{ rotate: deltaL * 7200 }}> {/* Alta sensibilidad */}
                     <line x1="0" y1="0" x2="0" y2="-50" stroke="#f97316" strokeWidth="4" strokeLinecap="round" />
                     <circle r="6" fill="#0f172a" stroke="#f97316" strokeWidth="3" />
                  </motion.g>

                  <text y="30" textAnchor="middle" fill="#94a3b8" fontSize="10" fontWeight="black" className="uppercase tracking-widest font-mono">ΔL MICRAS</text>
               </g>

               {/* Etiquetas Técnicas */}
               <text x="120" y="270" fill="#475569" fontSize="11" fontWeight="black" className="uppercase tracking-widest">Base L₀</text>
               <text x="580" y="270" fill="#475569" fontSize="11" fontWeight="black" className="uppercase tracking-widest text-right">Métrica ΔL</text>
            </svg>
         </div>

         {/* ── PANEL DE CONTROL INFERIOR (DOCK) ── */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl z-40">
            <motion.div 
              initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
              className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10"
            >
               {/* Selectores */}
               <div className="flex gap-8 items-center border-r border-white/10 pr-10">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Material de Prueba</span>
                    <div className="flex gap-2">
                      {Object.entries(MATERIALES).map(([key, m]) => (
                        <button key={key} onClick={() => { audio.playPop(); setDilatacion7({ material: key }); }} className={`px-4 py-2 rounded-xl text-[9px] font-black uppercase transition-all ${material === key ? 'bg-orange-600 text-white shadow-lg shadow-orange-600/20' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                          {m.nombre}
                        </button>
                      ))}
                    </div>
                  </div>
               </div>

               {/* Acción Térmica */}
               <div className="flex-1 flex gap-6 items-center">
                  <div className="flex-1 relative">
                    <input 
                      type="number" placeholder="α Calculado (x10⁻⁶)..." value={alphaInput}
                      onChange={(e) => setAlphaInput(e.target.value)}
                      className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-xl placeholder:text-white/10 focus:outline-none focus:border-orange-500 transition-all"
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">α (1/°C)</span>
                  </div>

                  <button 
                    onClick={toggleHeat}
                    className={`h-16 px-10 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-3 transition-all ${isHeating ? 'bg-orange-600 text-white shadow-xl shadow-orange-600/30' : 'bg-white/10 text-white/60 hover:bg-white/20'}`}
                  >
                    {isHeating ? <Pause size={16} /> : <Play size={16} />}
                    {isHeating ? 'Detener Calor' : 'Inyectar Vapor'}
                  </button>
               </div>

               {/* Validación */}
               <div className="flex items-center gap-4">
                  <button onClick={handleValidar} className="h-16 px-10 bg-emerald-600 hover:bg-emerald-500 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group">
                     <Target size={18} className="text-white group-hover:rotate-12 transition-transform" />
                     <span className="text-xs font-black text-white uppercase">Certificar</span>
                  </button>

                  <button onClick={() => { audio.playPop(); setAlphaInput(""); setDilatacion7({ tempFin: 20 }); setIsHeating(false); }} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                     <RotateCcw size={20} />
                  </button>
               </div>
            </motion.div>
         </div>

         {/* MENSAJE TUTOR / ÉXITO */}
         <AnimatePresence>
            {bitacoraData.fisica7 ? (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12">
                 <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-orange-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(249,115,22,0.15)]">
                    <CheckCircle2 size={100} className="text-orange-500 mx-auto mb-8" />
                    <h3 className="text-5xl font-black text-white uppercase italic mb-6">Metalurgia Certificada</h3>
                    <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">
                       Has validado el coeficiente de dilatación lineal con precisión milimétrica. El espécimen de <strong className="text-orange-400">{material.toUpperCase()}</strong> ha respondido según el estándar físico.
                    </p>
                    <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="w-full py-6 bg-orange-600 hover:bg-orange-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-orange-600/30">
                       Finalizar Reporte Térmico
                    </button>
                 </motion.div>
               </motion.div>
            ) : (
               <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-40 right-12 z-30 max-w-xs bg-[#0f172a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                  <div className="flex items-center gap-3 mb-4">
                     <Bot className="text-orange-400" size={24} />
                     <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dr. Quantum: Termo-Lab</span>
                  </div>
                  <p className="text-[11px] text-slate-400 leading-relaxed italic">
                     "Inyecta vapor para aumentar la temperatura. Mide la elongación en el micrómetro y usa la fórmula: α = ΔL / (L₀·ΔT). ¡El gradiente es la clave!"
                  </p>
               </motion.div>
            )}
         </AnimatePresence>

      </main>
    </div>
  );
}

function HUDCard({ label, value, icon, color, highlight = false, isStatic = false }: any) {
  return (
    <motion.div 
      animate={highlight ? { scale: [1, 1.05, 1], borderColor: [color, "#FFF", color] } : {}}
      transition={{ duration: 0.5, repeat: highlight ? Infinity : 0 }}
      className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all ${isStatic ? 'bg-white/5' : 'bg-[#0A1121]/80 backdrop-blur-md shadow-2xl'}`}
    >
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </motion.div>
  );
}
