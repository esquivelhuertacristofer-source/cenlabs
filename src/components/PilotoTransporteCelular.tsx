"use client";

import React, { useEffect, useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Activity, Zap, AlertTriangle, RotateCcw, 
  Target, Droplet, FlaskConical, Beaker, ShieldAlert, CheckCircle2,
  Thermometer, Gauge, Microchip, Fingerprint
} from 'lucide-react';
import { AreaChart, Area, ResponsiveContainer, YAxis } from 'recharts';
import dynamic from 'next/dynamic';

const Transporte3DScene = dynamic(() => import('./simuladores/bio02/Transporte3DScene'), { 
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-cyan-500 font-black text-xs uppercase tracking-widest animate-pulse">Sincronizando Terminal Biomédica...</div>
});

export default function PilotoTransporteCelular() {
  const store = useSimuladorStore();
  const transporte = store?.transporte;

  // FUNCIÓN DE SEGURIDAD ABSOLUTA
  const f = (val: any, d: number = 2) => {
    const n = parseFloat(val);
    return isNaN(n) ? "0.00" : n.toFixed(d);
  };

  if (!transporte) return <div className="w-full h-full bg-[#020617] flex items-center justify-center text-white font-black uppercase tracking-widest">Cargando Núcleo de Simulación...</div>;

  const concExt = transporte?.concExt ?? 0.3;
  const glucosaExt = transporte?.glucosaExt ?? 0.0;
  const temperatura = transporte?.temperatura ?? 25;
  const concInt = transporte?.concInt ?? 0.3;
  const tipoCelula = transporte?.tipoCelula ?? 'animal';
  const volumen = transporte?.volumen ?? 100;
  const history = transporte?.history ?? [];

  const osmExt = useMemo(() => (2 * (concExt || 0)) + (1 * (glucosaExt || 0)), [concExt, glucosaExt]);
  const osmInt = useMemo(() => 2 * (concInt || 0.3), [concInt]);
  const deltaOsm = useMemo(() => osmExt - osmInt, [osmExt, osmInt]);
  
  const isBurst = volumen > 178;
  const isCritical = volumen > 160 || volumen < 70;

  const [feedback, setFeedback] = useState<{ msg: string, type: 'error' | 'success' } | null>(null);

  const handleValidar = () => {
    if (!store?.setTransporte) return;
    const error = Math.abs(deltaOsm);
    if (isBurst) {
      setFeedback({ msg: "Muestra destruida por Citólisis. Reinicia.", type: 'error' });
    } else if (error < 0.05 && Math.abs(volumen - 100) < 2) {
      setFeedback({ msg: "¡Isotonía Detectada! Éxito.", type: 'success' });
      store.setTransporte({ status: 'success' });
    } else {
      setFeedback({ msg: deltaOsm > 0 ? "Hipertónico: Baja solutos." : "Hipotónico: Sube solutos.", type: 'error' });
    }
    setTimeout(() => setFeedback(null), 3000);
  };

  useEffect(() => {
    if (!store?.tickTransporte) return;
    const interval = setInterval(() => store.tickTransporte(0.1), 100);
    return () => clearInterval(interval);
  }, [store?.tickTransporte]);

  return (
    <div className={`w-full h-full bg-[#020617] font-['Outfit'] text-white overflow-hidden relative transition-all duration-700 ${isCritical ? 'bg-red-950/20' : ''}`}>
      
      <div className="absolute inset-0 z-0">
        <Transporte3DScene tipo={tipoCelula} volumen={volumen} concExt={concExt} />
      </div>

      {/* HEADER */}
      <div className="absolute top-10 left-10 z-40">
         <div className="px-6 py-3 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl inline-flex items-center gap-4">
            <Fingerprint size={20} className="text-blue-400" />
            <div>
               <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">ID Muestra Desconocida</span>
               <span className="text-sm font-black text-white italic">Incógnita: ??? M</span>
            </div>
         </div>
      </div>

      {/* DASHBOARD DERECHO */}
      <div className="absolute top-10 right-10 z-40 w-[300px] flex flex-col gap-4 pointer-events-none">
         <div className="px-8 py-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] pointer-events-auto shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
               <Microchip size={16} className="text-cyan-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Análisis Osmolar</span>
            </div>
            <div className="space-y-4">
               <div className="flex justify-between items-end">
                  <span className="text-[9px] font-black text-slate-500 uppercase">Osm. Exterior</span>
                  <span className="text-xl font-black font-mono text-white">{f(osmExt)} <span className="text-[10px] text-cyan-500">Osm</span></span>
               </div>
               <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                  <motion.div animate={{ width: `${Math.min(100, (osmExt || 0) * 50)}%` }} className="h-full bg-cyan-500" />
               </div>
               <div className="flex justify-between text-[10px] font-black">
                  <span className="text-slate-500 uppercase tracking-tighter">Gradiente ($\Delta$Osm)</span>
                  <span className={deltaOsm > 0 ? 'text-rose-400' : 'text-cyan-400'}>{f(deltaOsm)}</span>
               </div>
            </div>
         </div>

         <div className="px-8 py-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem] pointer-events-auto shadow-2xl">
            <div className="flex justify-between items-center mb-4">
               <div className="flex items-center gap-3">
                  <Thermometer size={16} className="text-orange-400" />
                  <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Temperatura</span>
               </div>
               <span className="text-xl font-black font-mono text-orange-400">{f(temperatura, 0)}°C</span>
            </div>
            <input 
              type="range" min="0" max="50" step="1" value={temperatura}
              onChange={(e) => store.setTransporte && store.setTransporte({ temperatura: parseInt(e.target.value) })}
              className="w-full h-1.5 bg-orange-950/50 rounded-full appearance-none cursor-pointer accent-orange-500"
            />
         </div>
      </div>

      {/* LISIS OVERLAY */}
      <AnimatePresence>
        {isBurst && (
          <motion.div 
            initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="absolute inset-0 z-[100] bg-black/95 backdrop-blur-3xl flex flex-col items-center justify-center text-center p-10"
          >
             <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6">
                <AlertTriangle size={40} className="text-white" />
             </div>
             <h2 className="text-6xl font-black uppercase tracking-tighter mb-4 text-red-500">MUESTRA DESTRUIDA</h2>
             <p className="text-xl text-slate-300 max-w-md mb-12">Fallo en la membrana por desequilibrio osmótico.</p>
             <button onClick={() => store.generarSemillaB2 && store.generarSemillaB2()} className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:scale-110 transition-all shadow-2xl">Nueva Muestra</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DOCK INFERIOR */}
      <div className="absolute bottom-10 left-1/2 -translate-x-1/2 z-30 w-full max-w-6xl px-8 pointer-events-auto">
         <div className="bg-black/80 backdrop-blur-3xl border-2 border-white/20 rounded-[3rem] p-10 flex items-center gap-12 shadow-2xl relative">
            
            <AnimatePresence>
               {feedback && (
                 <motion.div 
                    initial={{ y: 20, opacity: 0 }} animate={{ y: -70, opacity: 1 }} exit={{ opacity: 0 }}
                    className={`absolute left-0 right-0 mx-auto w-fit px-8 py-3 rounded-2xl text-xs font-black uppercase tracking-widest shadow-2xl ${feedback.type === 'error' ? 'bg-red-600 text-white' : 'bg-emerald-500 text-black'}`}
                 >
                    {feedback.msg}
                 </motion.div>
               )}
            </AnimatePresence>

            <div className="flex flex-col gap-4 shrink-0">
               <div className="flex bg-white/10 rounded-2xl p-1.5 border border-white/10">
                  {['animal', 'vegetal'].map(t => (
                    <button 
                      key={t}
                      onClick={() => store.setTransporte && store.setTransporte({ tipoCelula: t as any, volumen: 100, history: [] })}
                      className={`px-8 py-4 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoCelula === t ? 'bg-white text-black shadow-xl' : 'text-slate-500 hover:text-white'}`}
                    >
                      {t}
                    </button>
                  ))}
               </div>
               <button onClick={() => store.generarSemillaB2 && store.generarSemillaB2()} className="py-4 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 transition-all">Nueva Incógnita</button>
            </div>

            <div className="w-px h-24 bg-white/10" />

            <div className="flex-1 grid grid-cols-2 gap-10">
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">NaCl Inyector ($i=2$)</span>
                     <span className="text-xl font-black font-mono">{f(concExt)} M</span>
                  </div>
                  <input 
                    type="range" min="0.01" max="1.0" step="0.01" value={concExt}
                    onChange={(e) => store.setTransporte && store.setTransporte({ concExt: parseFloat(e.target.value) })}
                    className="w-full h-3 bg-blue-900/50 rounded-full appearance-none cursor-pointer accent-blue-400"
                  />
               </div>
               <div className="space-y-4">
                  <div className="flex justify-between items-center">
                     <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Glucosa Inyector ($i=1$)</span>
                     <span className="text-xl font-black font-mono">{f(glucosaExt)} M</span>
                  </div>
                  <input 
                    type="range" min="0.0" max="1.0" step="0.01" value={glucosaExt}
                    onChange={(e) => store.setTransporte && store.setTransporte({ glucosaExt: parseFloat(e.target.value) })}
                    className="w-full h-3 bg-yellow-900/50 rounded-full appearance-none cursor-pointer accent-yellow-500"
                  />
               </div>
            </div>

            <button onClick={handleValidar} className="px-10 py-6 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-3xl hover:scale-105 transition-all shadow-2xl flex items-center gap-3">
               <CheckCircle2 size={18} /> Validar Punto
            </button>
         </div>
      </div>

    </div>
  );
}
