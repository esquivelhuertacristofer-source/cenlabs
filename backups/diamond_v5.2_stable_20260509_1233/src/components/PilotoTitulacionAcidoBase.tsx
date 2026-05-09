"use client";

import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  XAxis, YAxis, CartesianGrid, 
  Tooltip as ChartTooltip, ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { 
  RotateCcw, Activity, Droplets, Target, MousePointer2, Zap, Gauge, FlaskConical, Beaker
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';

export default function PilotoTitulacionAcidoBase() {
  const { 
    titulacion, addDropNaOH, toggleIndicadorP7, togglePurgaP7, resetP7, generarSemillaP7, audio
  } = useSimuladorStore();
  
  const [mounted, setMounted] = useState(false);
  const [isRotating, setIsRotating] = useState(false);
  const [valveValue, setValveValue] = useState(0);
  const [showRipples, setShowRipples] = useState<{ id: number; x: number }[]>([]);
  const flowInterval = useRef<NodeJS.Timeout | null>(null);

  // Parallax Balanceado
  const mouseX = useSpring(useMotionValue(0), { damping: 50, stiffness: 100 });
  const mouseY = useSpring(useMotionValue(0), { damping: 50, stiffness: 100 });
  const rotateX = useTransform(mouseY, [-500, 500], [5, -5]);
  const rotateY = useTransform(mouseX, [-500, 500], [-7, 7]);

  useEffect(() => {
    setMounted(true);
    if (titulacion.history.length <= 1) generarSemillaP7();
    const handleMove = (e: MouseEvent) => {
      mouseX.set(e.clientX - window.innerWidth / 2);
      mouseY.set(e.clientY - window.innerHeight / 2);
    };
    window.addEventListener('mousemove', handleMove);
    return () => window.removeEventListener('mousemove', handleMove);
  }, []);

  useEffect(() => {
    if (valveValue > 10) {
      const speed = Math.max(25, 400 - (valveValue * 4));
      const amount = valveValue > 85 ? 0.75 : (valveValue > 45 ? 0.3 : 0.08);
      flowInterval.current = setInterval(() => {
        addDropNaOH(amount);
        if (Math.random() > 0.3) triggerRipple();
      }, speed);
    } else {
      if (flowInterval.current) clearInterval(flowInterval.current);
    }
    return () => { if (flowInterval.current) clearInterval(flowInterval.current); };
  }, [valveValue]);

  const triggerRipple = () => {
    const id = Date.now() + Math.random();
    setShowRipples(prev => [...prev.slice(-6), { id, x: (Math.random() - 0.5) * 20 }]);
    setTimeout(() => setShowRipples(prev => prev.filter(r => r.id !== id)), 1500);
  };

  const currentPH = titulacion.history[titulacion.history.length - 1]?.ph || 1.0;

  const getLiquidColor = () => {
    if (!titulacion.indicador) return "rgba(220, 240, 255, 0.1)";
    if (currentPH < 8.2) return "rgba(220, 240, 255, 0.2)";
    const t = Math.min(1, (currentPH - 8.2) / 1.5);
    return `rgba(236, 72, 153, ${0.15 + t * 0.75})`;
  };

  // Alerta de Viraje Narrativa
  useEffect(() => {
    if (currentPH > 8.15 && currentPH < 8.5 && titulacion.indicador) {
       audio?.playNotification();
    }
    if (currentPH >= 9.5 && titulacion.indicador) {
       audio?.playError();
       audio?.playNotification();
    }
  }, [currentPH > 8.2, titulacion.indicador]);

  if (!mounted) return null;

  return (
    <div className="relative w-full h-screen bg-[#020617] overflow-hidden flex flex-col font-['Outfit'] perspective-[3000px] text-white">
      
      {/* ── BACKGROUND DINÁMICO ── */}
      <div className="absolute inset-0 z-0 pointer-events-none">
        <div className="absolute bottom-0 left-0 right-0 h-[40vh] bg-gradient-to-t from-black to-transparent opacity-20 transform-gpu skew-x-[-15deg] scale-y-[0.4] origin-bottom" />
        <div className="absolute top-[-10%] left-[-10%] w-[1000px] h-[1000px] bg-blue-500/5 blur-[200px] rounded-full animate-pulse" />
        <div className="absolute top-[20%] right-[-10%] w-[800px] h-[800px] bg-pink-500/5 blur-[200px] rounded-full" />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-pink-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Monitoreo Analítico
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Titration Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${titulacion.purgada ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Bureta</div>
              <div className={`text-sm font-black italic ${titulacion.purgada ? 'text-blue-400' : 'text-white/20'}`}>{titulacion.purgada ? 'PURGADA' : 'CON AIRE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/30 shadow-[0_0_15px_rgba(236,72,153,0.1)]' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Indicador</div>
              <div className={`text-sm font-black italic ${titulacion.indicador ? 'text-pink-400' : 'text-white/20'}`}>{titulacion.indicador ? 'FENOLFTALEÍNA' : 'FALTANTE'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${currentPH > 7 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Estado</div>
              <div className={`text-sm font-black italic ${currentPH > 8.2 ? 'text-pink-500' : currentPH > 7 ? 'text-emerald-400' : 'text-white/20'}`}>{currentPH > 8.2 ? 'VIRADO' : currentPH > 7 ? 'NEUTRO' : 'ÁCIDO'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* ── ESCENA CENTRALIZADA (ORDEN DIAMOND) ── */}
      <div className="flex-1 flex relative z-10 p-12 gap-12 overflow-hidden">
        
        {/* PANEL IZQUIERDO: TELEMETRÍA */}
        <div className="w-[420px] flex flex-col gap-8 justify-center">
           <motion.div 
              initial={{ x: -50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="p-10 bg-black/40 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-3xl"
           >
              <div className="flex items-center gap-6 mb-8">
                 <div className="w-12 h-12 rounded-2xl bg-pink-500/10 flex items-center justify-center border border-pink-500/20 shadow-[0_0_20px_rgba(236,72,153,0.1)]">
                    <Activity size={24} className="text-pink-500 animate-pulse" />
                 </div>
                 <div className="flex flex-col">
                    <span className="text-[10px] font-black text-white/30 uppercase tracking-[0.4em] mb-1">Status de Acidez</span>
                    <h3 className="text-2xl font-black tracking-tight">ANALIZADOR pH</h3>
                 </div>
              </div>
              
              <div className="space-y-6">
                 <div className="bg-white/5 rounded-3xl p-8 border border-white/10">
                    <div className="flex items-baseline gap-4">
                       <span className="text-6xl font-black font-mono tracking-tighter text-white">{currentPH.toFixed(2)}</span>
                       <span className={`text-[11px] font-black px-4 py-1.5 rounded-full border border-current bg-current/10 ${currentPH > 8.2 ? 'text-pink-400' : 'text-blue-400'}`}>
                          {currentPH > 8.2 ? 'VIRAJE' : 'ÁCIDO'}
                       </span>
                    </div>
                 </div>

                 <div className="grid grid-cols-2 gap-4">
                    <div className="p-6 bg-white/5 rounded-[2rem] border border-white/5 flex flex-col gap-2">
                       <span className="text-[9px] font-black text-white/20 uppercase tracking-widest">Base (mL)</span>
                       <span className="text-2xl font-black font-mono text-blue-400">{titulacion.volumenBase.toFixed(2)}</span>
                    </div>
                    <div className={`p-6 rounded-[2rem] border transition-all flex flex-col gap-2 ${titulacion.indicador ? 'bg-pink-500/10 border-pink-500/20 text-pink-400' : 'bg-white/5 border-white/5 text-white/20'}`}>
                       <span className="text-[9px] font-black uppercase tracking-widest opacity-50">Indicador</span>
                       <span className="text-xs font-black uppercase">{titulacion.indicador ? 'Añadido' : 'Faltante'}</span>
                    </div>
                 </div>
              </div>
           </motion.div>

           <div className="p-8 bg-black/20 backdrop-blur-2xl rounded-[2.5rem] border border-white/5 flex items-center gap-6 group hover:bg-white/5 transition-all">
              <Target className="text-blue-400 group-hover:scale-110 transition-transform" size={24} />
              <p className="text-[10px] font-bold text-white/40 leading-relaxed uppercase tracking-widest">
                 Busca el punto donde la disolución cambie a un <span className="text-pink-400">rosa tenue persistente</span>.
              </p>
           </div>
        </div>

        {/* CENTRO: EXPERIMENTO ALINEADO */}
        <div className="flex-1 relative flex items-center justify-center">
           <motion.div 
              style={{ rotateX, rotateY }}
              className="relative w-full h-full flex flex-col items-center justify-center preserve-3d"
           >
              {/* ESTRUCTURA DE SOPORTE UNIVERSAL (CENTRO DE GRAVEDAD) */}
              <div className="relative h-[80%] flex flex-col items-center preserve-3d">
                 
                 {/* VARILLA CENTRAL */}
                 <div className="absolute top-0 bottom-0 left-1/2 -translate-x-1/2 w-4 bg-gradient-to-r from-slate-700 via-slate-400 to-slate-900 rounded-full shadow-2xl z-0" />
                 
                 {/* AGITADOR MAGNÉTICO (BASE) */}
                 <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-[380px] h-16 preserve-3d">
                    <div className="absolute bottom-[-20px] left-[-20%] right-[-20%] h-12 bg-black/80 blur-3xl rounded-full" />
                    <div className="absolute inset-0 bg-slate-900 rounded-[2rem] border-t border-white/20 shadow-3xl overflow-hidden flex flex-col items-center justify-center">
                       <div className="absolute top-4 left-8 flex items-center gap-3">
                          <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse shadow-[0_0_15px_#3b82f6]" />
                          <span className="text-[9px] font-black font-mono text-blue-400 tracking-widest uppercase">M-STIRRER ACTIVE</span>
                       </div>
                       <motion.div 
                          animate={{ rotate: 360 }} transition={{ duration: 0.4, repeat: Infinity, ease: "linear" }}
                          className="w-24 h-1 bg-slate-400/20 rounded-full blur-[2px]"
                       />
                    </div>
                 </div>

                 {/* MATRAZ ERLENMEYER (ALINEADO AL CENTRO) */}
                 <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-56 h-72 z-20 preserve-3d">
                    <div className="absolute inset-0" style={{ clipPath: 'polygon(35% 0%, 65% 0%, 100% 100%, 0% 100%)' }}>
                       <div className="absolute inset-0 bg-white/5 backdrop-blur-[6px] border-x border-white/10 shadow-inner" />
                       <div className="absolute inset-0 bg-gradient-to-tr from-white/10 via-transparent to-black/30" />
                       
                       {/* LÍQUIDO CON COLOR DINÁMICO */}
                       <div className="absolute bottom-0 left-0 right-0 transition-all duration-700" style={{ height: `${35 + (titulacion.volumenBase * 0.4)}%` }}>
                          <motion.div animate={{ backgroundColor: getLiquidColor() }} className="absolute inset-0">
                             <div className="absolute top-0 left-0 right-0 h-2 bg-white/30 blur-[1px]" />
                             {/* Ondas */}
                             <div className="absolute inset-0 overflow-hidden">
                                {showRipples.map(r => (
                                   <motion.div key={r.id} initial={{ scale: 0, opacity: 0.8 }} animate={{ scale: 4, opacity: 0 }} className="absolute top-0 w-16 h-2 bg-white/30 rounded-full" style={{ left: `calc(50% + ${r.x}px)` }} />
                                ))}
                             </div>
                          </motion.div>
                       </div>
                    </div>
                    {/* BOCA DEL MATRAZ */}
                    <div className="absolute top-[-2px] left-1/2 -translate-x-1/2 w-20 h-4 bg-white/10 rounded-full border border-white/30 backdrop-blur-xl" />
                 </div>

                 {/* PINZA Y BURETA (ALINEADA PERFECTAMENTE SOBRE EL MATRAZ) */}
                 <div className="absolute top-[10%] left-1/2 -translate-x-1/2 w-7 h-[55%] z-30 preserve-3d">
                    {/* PINZA DE METAL */}
                    <div className="absolute bottom-0 left-[-60px] right-[-60px] h-4 bg-slate-800 rounded-full border-t border-white/10 shadow-2xl z-0" />
                    
                    {/* CUERPO DE CRISTAL DE LA BURETA */}
                    <div className="absolute inset-0 bg-white/10 backdrop-blur-[2px] border-x border-white/20 rounded-full overflow-hidden shadow-2xl">
                       <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_4px,rgba(255,255,255,0.05)_4px,rgba(255,255,255,0.05)_5px)]" />
                       <div className="absolute inset-0 bg-[repeating-linear-gradient(transparent,transparent_19px,rgba(255,255,255,0.15)_19px,rgba(255,255,255,0.15)_20px)]" />
                       
                       {/* LÍQUIDO EN LA BURETA */}
                       <div className="absolute bottom-0 left-0 right-0 bg-blue-400/20 transition-all duration-300" style={{ height: `${Math.max(0, 100 - (titulacion.volumenBase * 1.5))}%` }}>
                          <div className="absolute top-[-4px] left-0 right-0 h-6 bg-blue-300/40 rounded-[100%] border-t border-white/30 shadow-[0_-5px_15px_rgba(59,130,246,0.3)]" />
                       </div>
                    </div>

                    {/* VÁLVULA DE CONTROL (LLAVE) */}
                    <div className="absolute bottom-[-20px] left-1/2 -translate-x-1/2 w-16 h-16 z-50">
                       <div 
                          className="relative w-full h-full cursor-grab active:cursor-grabbing preserve-3d flex items-center justify-center"
                          onMouseDown={() => setIsRotating(true)}
                          onMouseUp={() => setIsRotating(false)}
                          onMouseLeave={() => setIsRotating(false)}
                          onMouseMove={(e) => {
                             if (isRotating) {
                                const rect = e.currentTarget.getBoundingClientRect();
                                const x = e.clientX - (rect.left + rect.width/2);
                                const y = e.clientY - (rect.top + rect.height/2);
                                let angle = Math.atan2(y, x) * (180/Math.PI);
                                if (angle < 0) angle += 360;
                                setValveValue(Math.min(100, Math.max(0, angle % 180)));
                             }
                          }}
                       >
                          <motion.div animate={{ rotate: valveValue * 1.8 }} className="w-full h-3 bg-blue-600 rounded-full border border-white/40 shadow-xl flex items-center justify-center">
                             <div className="w-1.5 h-1.5 bg-white rounded-full shadow-[0_0_8px_#fff]" />
                          </motion.div>
                          
                          <AnimatePresence>
                             {isRotating && (
                                <motion.div initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }} className="absolute -right-24 top-0 bg-blue-600 px-3 py-1.5 rounded-xl text-[8px] font-black uppercase tracking-widest border border-white/20 shadow-2xl">
                                   FLOW: {valveValue.toFixed(0)}%
                                </motion.div>
                             )}
                          </AnimatePresence>
                       </div>
                    </div>

                    {/* GOTEO (ALINEADO AL EJE Z) */}
                    <div className="absolute bottom-[-140px] left-1/2 -translate-x-[0.5px] w-[1px]">
                       {valveValue > 5 && (
                          <div className="flex flex-col items-center">
                             <div className="w-[0.5px] h-[140px] bg-gradient-to-b from-blue-400 to-transparent opacity-20" />
                             <DropParticle active={valveValue > 5} />
                          </div>
                       )}
                    </div>
                 </div>
              </div>
           </motion.div>
        </div>

        {/* PANEL DERECHO: CURVA Y CONTROLES */}
        <div className="w-[520px] flex flex-col gap-8 justify-center">
           <motion.div 
              initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }}
              className="flex-1 bg-black/40 backdrop-blur-3xl rounded-[3.5rem] border border-white/10 p-12 flex flex-col shadow-3xl overflow-hidden relative group"
           >
              <div className="absolute top-0 right-0 p-12 opacity-5 group-hover:opacity-10 transition-opacity"><Zap size={100} className="text-blue-400" /></div>
              
              <div className="mb-10 relative z-10">
                 <span className="text-[10px] font-black text-blue-400 uppercase tracking-[0.4em] block mb-2">Monitor Analítico</span>
                 <h3 className="text-4xl font-black tracking-tighter">CURVA DE VALORACIÓN</h3>
              </div>

              <div className="flex-1 min-h-[350px] relative">
                 <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={titulacion.history}>
                       <defs>
                          <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                             <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8}/>
                             <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1}/>
                          </linearGradient>
                       </defs>
                       <CartesianGrid strokeDasharray="5 5" stroke="rgba(255,255,255,0.05)" vertical={false} />
                       <XAxis dataKey="vol" hide />
                       <YAxis hide domain={[0, 14]} />
                       <Area type="monotone" dataKey="ph" stroke="#ec4899" strokeWidth={8} fill="url(#curveGrad)" isAnimationActive={false} dot={false} />
                       <ReferenceLine y={7} stroke="rgba(255,255,255,0.15)" strokeDasharray="15 10" />
                    </AreaChart>
                 </ResponsiveContainer>

                 <div className="absolute top-0 right-0 bg-white/5 backdrop-blur-2xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
                    <span className="text-[9px] font-black text-white/30 uppercase tracking-[0.3em] block mb-2 text-right">Muestra Añadida</span>
                    <div className="flex items-baseline justify-end gap-3">
                       <span className="text-5xl font-black font-mono tracking-tighter text-blue-400">{titulacion.volumenBase.toFixed(2)}</span>
                       <span className="text-xs font-black text-white/30 uppercase">mL</span>
                    </div>
                 </div>
              </div>

              <div className="grid grid-cols-2 gap-6 mt-10">
                 <button 
                    onClick={() => {
                      togglePurgaP7();
                      audio.playPop();
                      audio.playNotification();
                    }} 
                    className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${titulacion.purgada ? 'bg-blue-600/20 border-blue-500/50 text-blue-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'}`}
                 >
                    <RotateCcw size={24} className={!titulacion.purgada ? 'animate-spin-slow' : ''} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Cargar Bureta</span>
                 </button>
                 <button 
                    onClick={() => {
                      toggleIndicadorP7();
                      audio.playPop();
                      audio.playNotification();
                    }} 
                    className={`h-28 rounded-[2.5rem] border-2 flex flex-col items-center justify-center gap-3 transition-all ${titulacion.indicador ? 'bg-pink-600/20 border-pink-500/50 text-pink-400 shadow-xl' : 'bg-white/5 border-white/10 text-white/20 hover:bg-white/10'}`}
                 >
                    <Droplets size={24} />
                    <span className="text-[9px] font-black uppercase tracking-[0.2em]">Indicador</span>
                 </button>
              </div>
           </motion.div>
        </div>

      </div>

      {/* ── FOOTER DE CONTROL ── */}
      <div className="h-32 bg-black/40 border-t border-white/5 backdrop-blur-3xl px-12 flex items-center justify-between z-[100]">
         <div className="flex items-center gap-10">
            <div className="flex items-center gap-4">
               <MousePointer2 size={24} className="text-blue-400 animate-bounce" />
               <span className="text-[11px] font-black text-white/40 uppercase tracking-[0.4em]">Arrastra la llave para controlar el goteo</span>
            </div>
            <div className="w-px h-8 bg-white/10" />
            <div className="flex items-center gap-4 text-pink-400">
               <FlaskConical size={24} />
               <span className="text-[11px] font-black uppercase tracking-[0.4em]">Vira a Rosa en pH 8.2</span>
            </div>
         </div>

         <div className="flex items-center gap-6">
            <button onClick={resetP7} className="w-16 h-16 bg-white/5 rounded-2xl flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-white/10 transition-all border border-white/5 shadow-xl group">
               <RotateCcw size={24} className="group-hover:rotate-[-180deg] transition-transform duration-700" />
            </button>
            <button className="h-16 px-12 bg-gradient-to-r from-blue-600 to-blue-400 text-white rounded-2xl font-black text-[10px] uppercase tracking-[0.3em] shadow-3xl shadow-blue-500/20 hover:scale-105 active:scale-95 transition-all">
               Finalizar y Enviar Datos
            </button>
         </div>
      </div>

      <style jsx>{`
        .preserve-3d { transform-style: preserve-3d; backface-visibility: hidden; }
        .animate-spin-slow { animation: spin 10s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>

    </div>
  );
}

function DropParticle({ active }: { active: boolean }) {
  const [key, setKey] = useState(0);
  useEffect(() => {
    if (active) {
      const interval = setInterval(() => setKey(prev => prev + 1), 200);
      return () => clearInterval(interval);
    }
  }, [active]);

  return (
    <AnimatePresence mode="popLayout">
      <motion.div
        key={key}
        initial={{ y: 0, opacity: 0, scale: 0.6 }}
        animate={{ y: 220, opacity: [0, 1, 1, 0], scale: [0.6, 1, 1, 0.4] }}
        transition={{ duration: 0.6, ease: "easeIn" }}
        className="absolute top-0 w-1.5 h-5 bg-blue-300/50 rounded-full border border-white/20"
      />
    </AnimatePresence>
  );
}
