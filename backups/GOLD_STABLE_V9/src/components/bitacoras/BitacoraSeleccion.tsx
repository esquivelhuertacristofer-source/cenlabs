import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  TreePine, Factory, Play, RefreshCcw, 
  TrendingUp, Activity, Timer, Users, Bird
} from 'lucide-react';

export default function BitacoraSeleccion() {
  const { evolucion, setEvolucion, resetB6, cazarPolilla } = useSimuladorStore();
  const { ambiente, generacion, clara, oscura, tiempo, isRunning, historial } = evolucion;

  const iniciarCaza = () => {
    // Generar 20 polillas para la ronda basadas en la proporción actual
    const bugs: { id: number; tipo: 'clara' | 'oscura'; x: number; y: number; angle: number; speed: number; cazada: boolean }[] = [];
    const total = 20;
    const nClaras = Math.round((clara / 100) * total);
    
    for (let i = 0; i < total; i++) {
      bugs.push({
        id: i,
        tipo: (i < nClaras ? 'clara' : 'oscura') as 'clara' | 'oscura',
        x: Math.random() * 80 + 10,
        y: Math.random() * 80 + 10,
        angle: Math.random() * Math.PI * 2,
        speed: 8 + Math.random() * 7,
        cazada: false
      });
    }
    setEvolucion({ isRunning: true, tiempo: 30, bugs, cazadasClaras: 0, cazadasOscuras: 0 });
  };

  // Lógica de Gráfica SVG
  const renderGraph = () => {
    if (historial.length < 2) return (
      <div className="h-32 flex items-center justify-center border border-dashed border-white/10 rounded-2xl text-[10px] text-white/20 font-bold uppercase">
         Esperando datos de la Gen 2...
      </div>
    );

    const pointsClara = historial.map((h, i) => `${(i / (historial.length)) * 100},${100 - h.clara}`).join(' ');
    const pointsOscura = historial.map((h, i) => `${(i / (historial.length)) * 100},${100 - h.oscura}`).join(' ');

    return (
      <svg viewBox="0 0 100 100" className="w-full h-32 overflow-visible">
         <polyline points={pointsClara} fill="none" stroke="#F1F5F9" strokeWidth="2" strokeLinecap="round" />
         <polyline points={pointsOscura} fill="none" stroke="#334155" strokeWidth="2" strokeLinecap="round" />
         {historial.map((h, i) => (
            <circle key={i} cx={(i / historial.length) * 100} cy={100 - h.clara} r="2" fill="#F1F5F9" />
         ))}
      </svg>
    );
  };

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. CONTROL DE AMBIENTE */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white shadow-lg shadow-slate-200">
              <TreePine size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Ecosistema</h4>
              <p className="text-[10px] font-bold text-slate-400 uppercase">Configuración Ambiental</p>
           </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
           <button 
             onClick={() => setEvolucion({ ambiente: 'limpio' })}
             className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
               ambiente === 'limpio' ? 'bg-emerald-50 border-emerald-500' : 'bg-slate-50 border-transparent text-slate-400'
             }`}
           >
              <TreePine size={24} className={ambiente === 'limpio' ? 'text-emerald-600' : 'text-slate-300'} />
              <span className="text-[9px] font-black uppercase mt-2">Postiva</span>
           </button>
           <button 
             onClick={() => setEvolucion({ ambiente: 'industrial' })}
             className={`flex flex-col items-center justify-center p-4 rounded-2xl border-2 transition-all ${
               ambiente === 'industrial' ? 'bg-slate-100 border-slate-600 shadow-inner' : 'bg-slate-50 border-transparent text-slate-400'
             }`}
           >
              <Factory size={24} className={ambiente === 'industrial' ? 'text-slate-800' : 'text-slate-300'} />
              <span className="text-[9px] font-black uppercase mt-2">Industrial</span>
           </button>
        </div>

        <div className="bg-slate-50 rounded-2xl p-5 border border-slate-100">
           <div className="flex justify-between items-center mb-4">
              <div className="flex items-center gap-2">
                 <Timer size={14} className={isRunning ? 'text-orange-500 animate-pulse' : 'text-slate-400'} />
                 <span className="text-[10px] font-black text-slate-500 uppercase">Tiempo de Caza</span>
              </div>
              <span className="text-xl font-mono font-black text-[#023047]">
                 00:{tiempo < 10 ? `0${Math.ceil(tiempo)}` : Math.ceil(tiempo)}
              </span>
           </div>
           
           <button 
             onClick={iniciarCaza}
             disabled={isRunning}
             className={`w-full h-14 rounded-xl flex items-center justify-center gap-2 font-black text-[10px] uppercase tracking-[0.2em] transition-all shadow-xl ${
                isRunning ? 'bg-slate-200 text-slate-400 shadow-none' : 'bg-[#023047] text-white hover:bg-emerald-600 shadow-slate-200'
             }`}
           >
              <Bird size={16} />
              Iniciar Depredación
           </button>
        </div>
      </div>

      {/* 2. TELEMETRÍA EVOLUTIVA */}
      <div className="bg-[#1a1c2c] rounded-[2.5rem] p-7 text-white shadow-2xl relative overflow-hidden">
         <div className="absolute -top-10 -right-10 opacity-5 rotate-12"><Activity size={200} /></div>
         
         <div className="flex justify-between items-center mb-8 relative z-10">
            <div>
               <h3 className="text-lg font-black tracking-tighter uppercase">Gen {generacion}</h3>
               <p className="text-[10px] text-emerald-400 font-bold uppercase tracking-widest">Estado Poblacional</p>
            </div>
            <div className="flex items-center gap-2 px-3 py-1 bg-white/10 rounded-full border border-white/10">
               <Users size={12} className="text-emerald-400" />
               <span className="text-[10px] font-bold">N=100</span>
            </div>
         </div>

         <div className="grid grid-cols-2 gap-4 mb-8 relative z-10">
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
               <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Claras</span>
               <span className="text-2xl font-black">{clara}%</span>
               <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <motion.div animate={{ width: `${clara}%` }} className="h-full bg-slate-200 shadow-[0_0_10px_white]" />
               </div>
               {isRunning && <span className="text-[8px] font-black text-rose-400 mt-2 block uppercase tracking-tighter">Bajas: {evolucion.cazadasClaras}</span>}
            </div>
            <div className="bg-white/5 rounded-2xl p-4 border border-white/10">
               <span className="text-[9px] font-bold text-slate-400 uppercase block mb-1">Oscuras</span>
               <span className="text-2xl font-black">{oscura}%</span>
               <div className="w-full h-1 bg-white/20 rounded-full mt-2 overflow-hidden">
                  <motion.div animate={{ width: `${oscura}%` }} className="h-full bg-slate-800 shadow-[0_0_10px_rgba(0,0,0,0.5)] border border-white/10" />
               </div>
               {isRunning && <span className="text-[8px] font-black text-rose-400 mt-2 block uppercase tracking-tighter">Bajas: {evolucion.cazadasOscuras}</span>}
            </div>
         </div>

         <div className="space-y-4">
            <div className="flex items-center gap-2">
               <TrendingUp size={14} className="text-emerald-400" />
               <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Frecuencias Históricas</span>
            </div>
            {renderGraph()}
         </div>

         <button 
           onClick={resetB6}
           className="mt-8 w-full py-4 bg-white/5 hover:bg-rose-500/20 border border-white/10 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-white/40 hover:text-rose-400 transition-all"
         >
            <RefreshCcw size={14} /> Resetear Selección
         </button>
      </div>

    </div>
  );
};
