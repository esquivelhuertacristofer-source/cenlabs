import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Hammer, Zap, Activity, Timer, 
  TrendingUp, AlertCircle, CheckCircle2, 
  Dna, Stethoscope, Microscope
} from 'lucide-react';

export default function BitacoraSistemaNervioso() {
  const { sistemaNervioso, setB7State, dispararReflejo, resetB7 } = useSimuladorStore();
  const { fuerzaGolpe, integridadMielina, latenciaMedida, velocidadConduccion, estado, status } = sistemaNervioso;

  const isThresholdOk = fuerzaGolpe >= 20;
  const isHealthy = latenciaMedida > 0 && latenciaMedida < 30;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. CONSOLA NEUROLÓGICA (Controles) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-[#023047] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#023047]/10">
              <Stethoscope size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Consola de Estímulo</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ajustes del Paciente</p>
           </div>
        </div>

        <div className="space-y-8">
           {/* Sliders de Control */}
           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <Hammer size={14} className="text-[#FB8500]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase">Fuerza del Golpe</span>
                 </div>
                 <span className="text-sm font-mono font-black text-[#023047]">{fuerzaGolpe}%</span>
              </div>
              <input 
                type="range" min="1" max="100" 
                value={fuerzaGolpe}
                onChange={(e) => setB7State({ fuerzaGolpe: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]"
              />
              {!isThresholdOk && (
                <div className="flex items-center gap-2 text-[10px] font-bold text-rose-500 bg-rose-50 p-2 rounded-lg">
                   <AlertCircle size={12} /> Umbral insuficiente (Mín 20%)
                </div>
              )}
           </div>

           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#219EBC]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase">Integridad Mielina</span>
                 </div>
                 <span className="text-sm font-mono font-black text-[#023047]">{integridadMielina}%</span>
              </div>
              <input 
                type="range" min="10" max="100" 
                value={integridadMielina}
                onChange={(e) => setB7State({ integridadMielina: parseInt(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]"
              />
           </div>

           <button
             onClick={dispararReflejo}
             disabled={estado !== 'reposo'}
             className={`w-full h-16 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
               estado !== 'reposo' 
               ? 'bg-slate-100 text-slate-400 cursor-not-allowed shadow-none' 
               : 'bg-[#023047] text-white hover:bg-[#219EBC] shadow-[#023047]/20 border-b-4 border-black/20'
             }`}
           >
              <Hammer size={20} className={estado === 'reposo' ? 'animate-bounce' : ''} />
              Aplicar Estímulo
           </button>
        </div>
      </div>

      {/* 2. TELEMETRÍA DE CONDUCCIÓN (Indicadores Premium) */}
      <div className="bg-[#0A1121] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC] opacity-5 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Activity size={24} className="text-[#219EBC]" />
           </div>
           <div>
              <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">Monitoreo AR-7</h3>
              <p className="text-[11px] text-[#219EBC] font-bold uppercase tracking-widest">Pulso Neuro-Electrónico</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4 relative z-10">
           <div className="bg-white/5 rounded-3xl p-6 border border-white/10 group hover:border-[#219EBC]/50 transition-colors">
              <div className="flex justify-between items-center mb-3">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2">
                    <TrendingUp size={12} /> Velocidad
                 </span>
                 <span className="text-xl font-mono font-black text-[#8ECAE6]">{integridadMielina > 10 ? (integridadMielina * 1.2).toFixed(1) : '1.0'} <span className="text-[10px]">m/s</span></span>
              </div>
              <div className="h-1.5 bg-white/10 rounded-full overflow-hidden">
                 <motion.div 
                   animate={{ width: `${integridadMielina}%` }} 
                   className="h-full bg-gradient-to-r from-[#219EBC] to-[#8ECAE6] shadow-[0_0_15px_#219EBC]"
                 />
              </div>
           </div>

           <div className="bg-white/5 rounded-3xl p-6 border border-white/10 group hover:border-pink-500/50 transition-colors">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                 <Timer size={12} /> Tiempo de Latencia
              </span>
              <div className="flex items-end justify-between">
                 <span className={`text-3xl font-mono font-black transition-colors ${
                   latenciaMedida > 0 ? (isHealthy ? 'text-emerald-400' : 'text-rose-400') : 'text-slate-600'
                 }`}>
                   {latenciaMedida > 0 ? `${latenciaMedida.toFixed(1)}` : '0.0'} <span className="text-sm font-bold opacity-50">ms</span>
                 </span>
                 {latenciaMedida > 0 && (
                   <span className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                     isHealthy ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                   }`}>
                     {isHealthy ? 'Normal' : 'Crítico'}
                   </span>
                 )}
              </div>
           </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
           <button
             disabled={!isHealthy || estado !== 'reposo'}
             onClick={() => setB7State({ status: 'success' })}
             className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
               isHealthy && estado === 'reposo'
               ? 'bg-[#FB8500] text-white hover:bg-[#ff952b] shadow-lg shadow-[#FB8500]/20 scale-100 active:scale-95'
               : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
             }`}
           >
              <CheckCircle2 size={18} />
              Registrar Diagnóstico
           </button>
           {!isHealthy && latenciaMedida > 0 && (
             <p className="mt-4 text-[10px] text-center font-bold text-rose-500 uppercase tracking-wider animate-pulse">
               Vaina de mielina degradada. Restaure para validar.
             </p>
           )}
        </div>
      </div>

    </div>
  );
};
