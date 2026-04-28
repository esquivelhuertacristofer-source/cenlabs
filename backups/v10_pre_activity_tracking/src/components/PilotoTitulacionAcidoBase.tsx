"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useAnimation } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { Droplets, RotateCcw, Zap, Info, FlaskConical, Thermometer, MousePointer2, AlertTriangle, Target } from 'lucide-react';

interface Props {
  isWorktableDark?: boolean;
  isProfesor?: boolean;
}

export default function PilotoTitulacionAcidoBase({ isWorktableDark = true, isProfesor = false }: Props) {
  const { titulacion, addDropNaOH, toggleIndicadorP7, togglePurgaP7, resetP7, generarSemillaP7 } = useSimuladorStore();
  const [isFlowing, setIsFlowing] = useState(false);
  const [showFlowAnim, setShowFlowAnim] = useState(false);
  const [ripples, setRipples] = useState<{ id: number; x: number }[]>([]);
  const [floatingText, setFloatingText] = useState<{ id: number; text: string }[]>([]);
  const flowInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (titulacion.history.length <= 1) generarSemillaP7();
  }, []);

  // Manejo de flujo continuo
  useEffect(() => {
    if (isFlowing) {
      flowInterval.current = setInterval(() => {
        addDropNaOH(0.2);
        triggerRipple();
      }, 150);
      setShowFlowAnim(true);
    } else {
      if (flowInterval.current) clearInterval(flowInterval.current);
      setShowFlowAnim(false);
    }
    return () => { if (flowInterval.current) clearInterval(flowInterval.current); };
  }, [isFlowing, addDropNaOH]);

  const triggerRipple = () => {
    const id = Date.now() + Math.random();
    setRipples(prev => [...prev.slice(-5), { id, x: Math.random() * 20 - 10 }]);
    setTimeout(() => setRipples(prev => prev.filter(r => r.id !== id)), 1000);
  };

  const handleSingleDrop = () => {
    addDropNaOH(0.05);
    triggerRipple();
    const id = Date.now();
    setFloatingText(prev => [...prev, { id, text: "+0.05 mL" }]);
    setTimeout(() => setFloatingText(prev => prev.filter(t => t.id !== id)), 1000);
  };

  const lastPoint = titulacion.history[titulacion.history.length - 1];
  const currentPH = lastPoint?.ph || 1.0;

  const getFlaskColor = () => {
    if (!titulacion.indicador) return "rgba(255, 255, 255, 0.05)";
    if (currentPH < 8.2) return "rgba(255, 255, 255, 0.15)";
    if (currentPH >= 8.2 && currentPH <= 9.0) return "rgba(244, 114, 182, 0.5)";
    return "rgba(219, 39, 119, 0.95)";
  };

  // Lógica de onboarding: ¿Qué debe hacer el usuario ahora?
  const nextStep = !titulacion.purgada ? 'purga' : (!titulacion.indicador ? 'indicador' : 'titular');

  return (
    <div className={`w-full h-full flex flex-col ${isWorktableDark ? 'bg-[#0A1121]' : 'bg-slate-50'} overflow-hidden relative font-sans`}>
      
      {/* TOOLTIP DE AYUDA DINÁMICO */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="absolute top-24 left-1/2 -translate-x-1/2 z-30 pointer-events-none"
        >
          <div className="px-6 py-3 bg-[#219EBC] text-white rounded-full shadow-2xl flex items-center gap-3 border border-white/20">
             <Target size={16} className="animate-spin-slow" />
             <span className="text-[11px] font-black uppercase tracking-widest whitespace-nowrap">
                {nextStep === 'purga' && "Paso 1: Purga el aire de la bureta"}
                {nextStep === 'indicador' && "Paso 2: Añade indicador al matraz"}
                {nextStep === 'titular' && "Paso 3: Inicia el goteo lentamente"}
             </span>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* HEADER DE ESTADO */}
      <div className="absolute top-6 left-6 right-6 flex items-center justify-between z-20">
        <div className="flex gap-4">
          <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
            <div className={`w-3 h-3 rounded-full animate-pulse ${titulacion.indicador ? 'bg-pink-500' : 'bg-slate-500'}`} />
            <span className="text-[10px] font-black text-white uppercase tracking-widest">Indicador: {titulacion.indicador ? 'FENOLFTALEÍNA' : 'NINGUNO'}</span>
          </div>
          <div className="px-5 py-3 bg-white/5 backdrop-blur-md rounded-2xl border border-white/10 flex items-center gap-3">
             <Thermometer size={14} className="text-[#219EBC]" />
             <span className="text-[10px] font-black text-white uppercase tracking-widest">pH: <span className="text-[#219EBC] ml-1 font-mono">{currentPH.toFixed(2)}</span></span>
          </div>
        </div>
        
        <div className="flex gap-2">
           <motion.button 
             animate={nextStep === 'indicador' ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(236, 72, 153, 0)", "0 0 20px rgba(236, 72, 153, 0.4)", "0 0 0px rgba(236, 72, 153, 0)"] } : {}}
             transition={{ repeat: Infinity, duration: 2 }}
             onClick={() => toggleIndicadorP7()} 
             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${titulacion.indicador ? 'bg-pink-500 text-white' : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20'}`}
           >
              Añadir Indicador
           </motion.button>
           <motion.button 
             animate={nextStep === 'purga' ? { scale: [1, 1.05, 1], boxShadow: ["0 0 0px rgba(33, 158, 188, 0)", "0 0 20px rgba(33, 158, 188, 0.4)", "0 0 0px rgba(33, 158, 188, 0)"] } : {}}
             transition={{ repeat: Infinity, duration: 2 }}
             onClick={() => togglePurgaP7()} 
             className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${titulacion.purgada ? 'bg-[#219EBC] text-white' : 'bg-white/10 text-white/50 border border-white/10 hover:bg-white/20'}`}
           >
              Purgar Bureta
           </motion.button>
           <button onClick={resetP7} className="px-6 py-3 bg-white/5 text-slate-500 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-red-500/20 hover:text-red-400">
              <RotateCcw size={14} />
           </button>
        </div>
      </div>

      <div className="flex-1 flex w-full">
        
        {/* ESCENARIO IZQUIERDO */}
        <div className="w-1/2 h-full relative flex items-center justify-center p-12 overflow-hidden border-r border-white/5">
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-48 h-4 bg-slate-900 rounded-full blur-[2px]" />
          <div className="absolute bottom-20 left-1/2 -translate-x-1/2 w-2 h-[500px] bg-gradient-to-t from-slate-800 to-slate-900" />
          
          <div className="relative z-10 flex flex-col items-center gap-16 mt-[-50px]">
             
             {/* Bureta con Lupa de Lectura */}
             <div className="relative group cursor-crosshair">
                <div className="absolute -left-20 top-0 bottom-0 flex flex-col justify-between py-10 opacity-20 group-hover:opacity-100 transition-opacity">
                   {[0, 10, 20, 30, 40, 50].map(v => (
                     <div key={v} className="flex flex-row-reverse items-center gap-3">
                        <div className="w-6 h-0.5 bg-white/40" />
                        <span className="text-[10px] font-black text-white font-mono">{v}</span>
                     </div>
                   ))}
                </div>

                <div className="relative">
                  <svg width="40" height="400" viewBox="0 0 40 400" className="drop-shadow-[0_0_15px_rgba(255,255,255,0.1)]">
                    <rect x="15" y="0" width="10" height="380" rx="2" fill="rgba(148, 163, 184, 0.15)" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
                    
                    {/* Líquido con Menisco */}
                    <motion.g animate={{ y: titulacion.volumenBase * 7 }}>
                       <rect x="16" y="30" width="8" height={Math.max(0, 350 - (titulacion.volumenBase * 7))} fill="#8ECAE6" opacity="0.6" />
                       <path d="M16 30 Q20 34 24 30" fill="none" stroke="#219EBC" strokeWidth="1" />
                    </motion.g>

                    <g transform="translate(15, 360)">
                       <motion.circle animate={{ fill: isFlowing ? '#FB8500' : '#475569' }} cx="5" cy="5" r="10" />
                       <motion.line x1="-2" y1="5" x2="12" y2="5" stroke="white" strokeWidth="3" animate={{ rotate: isFlowing ? 90 : 0 }} transition={{ type: 'spring' }} style={{ originX: '5px', originY: '5px' }} />
                    </g>
                  </svg>

                  {/* Lupa flotante en el nivel del líquido */}
                  <div className="absolute top-[380px] left-1/2 -translate-x-1/2">
                    <AnimatePresence>
                      {showFlowAnim && (
                        <motion.div initial={{ height: 0 }} animate={{ height: 180 }} exit={{ height: 0 }} className="w-[2px] bg-gradient-to-b from-blue-400 to-transparent opacity-40 blur-[1px]" />
                      )}
                    </AnimatePresence>
                    <DropAnimation active={showFlowAnim} />
                  </div>
                </div>
             </div>

             {/* Matraz Erlenmeyer con Splash Effects */}
             <div className="relative">
                <svg width="180" height="200" viewBox="0 0 120 140" className="drop-shadow-2xl">
                   <path d="M45 20 L75 20 L110 120 Q115 135 90 135 L30 135 Q5 135 10 120 Z" fill="rgba(255,255,255,0.05)" stroke="rgba(255,255,255,0.2)" strokeWidth="1.5" />
                   
                   {/* Líquido Dinámico */}
                   <motion.path 
                     animate={{ fill: getFlaskColor() }}
                     d="M23 105 L97 105 L108 120 Q110 135 90 135 L30 135 Q10 135 12 120 Z" 
                     className="transition-colors duration-700"
                   />
                   
                   {/* Ondas de choque (Ripples) */}
                   {ripples.map(r => (
                     <motion.ellipse 
                       key={r.id}
                       initial={{ rx: 0, ry: 0, opacity: 0.8 }}
                       animate={{ rx: 30, ry: 5, opacity: 0 }}
                       cx={60 + r.x} cy="105"
                       fill="none" stroke="white" strokeWidth="1"
                     />
                   ))}
                </svg>

                {/* Etiquetas Flotantes */}
                <AnimatePresence>
                   {floatingText.map(t => (
                     <motion.span 
                       key={t.id}
                       initial={{ opacity: 0, y: 0, x: -20 }}
                       animate={{ opacity: 1, y: -100, x: -20 }}
                       exit={{ opacity: 0 }}
                       className="absolute top-0 left-1/2 text-[10px] font-black text-[#219EBC] font-mono whitespace-nowrap"
                     >
                        {t.text}
                     </motion.span>
                   ))}
                </AnimatePresence>

                <div className="absolute -bottom-4 left-1/2 -translate-x-1/2 px-4 py-1.5 bg-black/40 backdrop-blur-md rounded-full border border-white/10">
                   <span className="text-[9px] font-black text-white/50 uppercase tracking-widest font-mono">Vol: {(20 + titulacion.volumenBase).toFixed(2)} mL</span>
                </div>
             </div>
          </div>

          {/* CONTROLES MAESTROS */}
          <div className="absolute bottom-10 left-1/2 -translate-x-1/2 flex items-center gap-6 bg-slate-900/80 backdrop-blur-2xl p-6 rounded-[2.5rem] border border-white/10 shadow-[0_20px_50px_rgba(0,0,0,0.5)]">
             <div className="relative group">
                <button 
                  onMouseDown={() => setIsFlowing(true)}
                  onMouseUp={() => setIsFlowing(false)}
                  onMouseLeave={() => setIsFlowing(false)}
                  className={`h-20 px-10 bg-white/5 hover:bg-white/10 text-white rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all border border-white/5 active:scale-95 ${nextStep === 'titular' && !isFlowing && 'animate-pulse'}`}
                >
                   <MousePointer2 size={24} className={isFlowing ? 'animate-bounce text-[#FB8500]' : 'text-slate-500'} />
                   <span className="text-[10px] font-black uppercase tracking-[0.2em]">Flujo Continuo</span>
                </button>
                <div className="absolute -top-12 left-1/2 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity bg-white text-black text-[9px] font-black px-3 py-1.5 rounded-lg shadow-xl pointer-events-none uppercase tracking-widest">
                   Manten presionado para flujo rápido
                </div>
             </div>

             <div className="w-px h-12 bg-white/10" />

             <button 
               onClick={handleSingleDrop}
               className={`h-20 px-10 bg-[#219EBC] hover:bg-[#8ECAE6] text-white rounded-[1.5rem] flex flex-col items-center justify-center gap-1 transition-all shadow-xl active:scale-90 ${nextStep === 'titular' && 'shadow-[#219EBC]/20 ring-4 ring-[#219EBC]/20'}`}
             >
                <Droplets size={24} className="animate-pulse" />
                <span className="text-[10px] font-black uppercase tracking-[0.2em]">Gota a Gota</span>
             </button>
          </div>
        </div>

        {/* ANÁLISIS DERECHO */}
        <div className="w-1/2 h-full bg-slate-900/50 flex flex-col backdrop-blur-sm">
           <div className="p-10 flex items-center justify-between border-b border-white/5">
              <div>
                 <div className="flex items-center gap-2 mb-1">
                    <Info size={14} className="text-[#219EBC]" />
                    <h3 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Monitor Potenciométrico v2.1</h3>
                 </div>
                 <p className="text-2xl font-black text-white uppercase tracking-tighter leading-none">Curva de Titulación</p>
              </div>
              <div className="text-right">
                 <span className="text-[10px] font-black text-[#FB8500] uppercase block mb-1">Punto de Equivalencia (Est.)</span>
                 <span className="text-xl font-bold text-white font-mono tracking-tighter">— mL</span>
              </div>
           </div>

           <div className="flex-1 p-8 relative">
              <ResponsiveContainer width="100%" height="100%">
                 <AreaChart data={titulacion.history} margin={{ top: 20, right: 30, left: 10, bottom: 20 }}>
                    <defs>
                       <linearGradient id="colorPh" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#219EBC" stopOpacity={0.4}/>
                          <stop offset="95%" stopColor="#219EBC" stopOpacity={0}/>
                       </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.03)" vertical={false} />
                    <XAxis dataKey="vol" stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="black" tickFormatter={(v) => `${v}mL`} domain={[0, 40]} type="number" />
                    <YAxis stroke="rgba(255,255,255,0.2)" fontSize={11} fontWeight="black" domain={[0, 14]} ticks={[0, 2, 4, 7, 10, 12, 14]} />
                    <Tooltip 
                       contentStyle={{ backgroundColor: '#0A1121', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '12px' }}
                       itemStyle={{ color: '#219EBC', fontWeight: '900', fontSize: '14px' }}
                    />
                    <Area type="monotone" dataKey="ph" stroke="#219EBC" strokeWidth={5} fillOpacity={1} fill="url(#colorPh)" isAnimationActive={false} />
                    <ReferenceLine y={7} stroke="rgba(251, 133, 0, 0.4)" strokeDasharray="10 5" label={{ position: 'right', value: 'NEUTRO', fill: '#FB8500', fontSize: 10, fontWeight: 'black' }} />
                 </AreaChart>
              </ResponsiveContainer>

              {/* LECTURA FLOTANTE PREMIUM */}
              {lastPoint && (
                <div className="absolute top-10 right-10 p-6 bg-slate-900 border border-white/10 rounded-3xl shadow-2xl flex flex-col gap-1 min-w-[140px]">
                   <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">pH Actual</span>
                   <div className="flex items-end gap-1">
                      <span className="text-4xl font-black text-white font-mono tracking-tighter leading-none">{lastPoint.ph.toFixed(2)}</span>
                   </div>
                   <div className="mt-2 flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full ${lastPoint.ph > 7 ? 'bg-pink-500' : 'bg-[#219EBC]'}`} />
                      <span className="text-[8px] font-black text-slate-400 uppercase">{lastPoint.ph > 7.1 ? 'BASE' : (lastPoint.ph < 6.9 ? 'ÁCIDO' : 'NEUTRO')}</span>
                   </div>
                </div>
              )}
           </div>

           <AnimatePresence>
              {titulacion.status === 'alert' && (
                <motion.div 
                   initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.9 }}
                   className="m-8 p-8 bg-red-500/10 border border-red-500/20 rounded-[2.5rem] flex items-center justify-between shadow-2xl shadow-red-500/5"
                >
                   <div className="flex items-center gap-5">
                      <div className="w-16 h-16 bg-red-500/20 rounded-3xl flex items-center justify-center text-red-500 shadow-inner">
                         <AlertTriangle size={32} />
                      </div>
                      <div>
                         <h4 className="text-lg font-black text-white uppercase tracking-tight">¡Punto de Equivalencia Superado!</h4>
                         <p className="text-xs text-red-200/50 font-bold leading-relaxed max-w-sm italic">La solución ha virado a fucsia intenso. No podrás obtener un cálculo preciso de la concentración.</p>
                      </div>
                   </div>
                   <button onClick={resetP7} className="px-8 py-4 bg-red-500 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-red-600 shadow-xl shadow-red-500/20">Limpiar Muestra</button>
                </motion.div>
              )}
           </AnimatePresence>

           <div className="p-10 bg-white/5 border-t border-white/5 grid grid-cols-3 gap-8">
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 shadow-inner">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">Sustancia</span>
                 <div className="flex items-center gap-2">
                    <FlaskConical size={14} className="text-[#219EBC]" />
                    <span className="text-xs font-black text-white uppercase tracking-tight">Ácido Clorhídrico (HCl)</span>
                 </div>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 shadow-inner">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-2">NaOH Utilizado</span>
                 <span className="text-2xl font-black text-[#FB8500] font-mono tracking-tighter leading-none">{titulacion.volumenBase.toFixed(2)} <span className="text-[10px] text-slate-500">mL</span></span>
              </div>
              <div className="p-6 rounded-3xl bg-slate-900/80 border border-white/5 shadow-inner">
                 <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest block mb-1">Estado de Purga</span>
                 <div className={`mt-1 flex items-center gap-2 text-[10px] font-black ${titulacion.purgada ? 'text-[#219EBC]' : 'text-slate-500'}`}>
                    {titulacion.purgada ? <Zap size={14} /> : <RotateCcw size={14} />}
                    <span className="uppercase tracking-widest">{titulacion.purgada ? 'Bureta Lista' : 'Aire en Válvula'}</span>
                 </div>
              </div>
           </div>
        </div>
      </div>

    </div>
  );
}

function DropAnimation({ active }: { active: boolean }) {
  const [key, setKey] = useState(0);
  
  useEffect(() => {
    if (active) {
      const interval = setInterval(() => setKey(prev => prev + 1), 600 + Math.random() * 400);
      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <AnimatePresence>
      <motion.div
        key={key}
        initial={{ y: 0, opacity: 0, scale: 0.8 }}
        animate={{ 
          y: 200, 
          opacity: [0, 1, 1, 0],
          scale: [0.8, 1, 1, 0.5] 
        }}
        transition={{ duration: 0.8, ease: "easeIn" }}
        className="absolute top-0 w-1.5 h-3 bg-blue-300 rounded-full blur-[0.5px] shadow-[0_0_10px_rgba(142,202,230,0.5)]"
        style={{ left: Math.random() * 4 - 2 }}
      />
    </AnimatePresence>
  );
}
