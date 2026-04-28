import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Play, Square, RotateCcw, Activity, 
  Target, AlertCircle, Info, TrendingUp,
  Heart, Zap, ShieldCheck
} from 'lucide-react';

interface BitacoraPoblacionesProps {
  activateAnalysis?: boolean;
}

export default function BitacoraPoblaciones({ activateAnalysis = false }: BitacoraPoblacionesProps) {
  const { ecosistema, setEcosistema, resetB10 } = useSimuladorStore();
  const { poblacionPresas, poblacionDepredadores, alfa, beta, gamma, tiempoVirtual, simulando, status } = ecosistema;

  // Análisis Estadístico: Resumen de Biomasa
  const averageBiomass = (poblacionPresas + poblacionDepredadores) / 2;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500 pb-10">
      
      {/* 1. CONSOLA ECOLÓGICA */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-6">
           <div className="w-10 h-10 bg-[#023047] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#023047]/10">
              <Activity size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Consola Ecológica</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ajuste Biotopo</p>
           </div>
        </div>

        <div className="space-y-6">
           {/* Slider: Natalidad Presas (Alpha) */}
           <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#EC4899]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Natalidad (Presas)</span>
                 </div>
                 <span className="text-xs font-black text-[#EC4899]">{alfa.toFixed(2)} α</span>
              </div>
              <input 
                type="range" min="0.1" max="2.0" step="0.05"
                value={alfa}
                onChange={(e) => setEcosistema({ alfa: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#EC4899]"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                <span>Lenta</span>
                <span>Rápida</span>
              </div>
           </div>

           {/* Slider: Eficacia Caza (Beta) */}
           <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <Zap size={14} className="text-[#219EBC]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Eficacia Caza</span>
                 </div>
                 <span className="text-xs font-black text-[#219EBC]">{beta.toFixed(2)} β</span>
              </div>
              <input 
                type="range" min="0.01" max="0.5" step="0.01"
                value={beta}
                onChange={(e) => setEcosistema({ beta: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#219EBC]"
              />
              <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-tighter">
                <span>Baja</span>
                <span>Depredadora</span>
              </div>
           </div>

           {/* Slider: Mortalidad Depredadores (Gamma) */}
           <div className="space-y-3">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <Square size={14} className="text-slate-500 rotate-45" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Mortalidad (Dep)</span>
                 </div>
                 <span className="text-xs font-black text-slate-500">{gamma.toFixed(2)} γ</span>
              </div>
              <input 
                type="range" min="0.1" max="1.5" step="0.05"
                value={gamma}
                onChange={(e) => setEcosistema({ gamma: parseFloat(e.target.value) })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-slate-500"
              />
           </div>

           <div className="flex gap-2 pt-2">
              <button
                onClick={() => setEcosistema({ simulando: !simulando })}
                className={`flex-1 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
                  simulando 
                  ? 'bg-amber-500 text-white shadow-lg shadow-amber-500/20' 
                  : 'bg-[#023047] text-white hover:bg-[#219EBC] shadow-lg shadow-[#023047]/20 active:scale-95'
                }`}
              >
                 {simulando ? <Square size={16} /> : <Play size={16} />}
                 {simulando ? 'Pausar' : 'Iniciar'}
              </button>
              <button
                onClick={resetB10}
                className="w-14 h-14 bg-slate-100 text-slate-500 rounded-2xl flex items-center justify-center hover:bg-slate-200 transition-all active:rotate-180"
              >
                  <RotateCcw size={20} />
              </button>
           </div>
        </div>
      </div>

      {/* 2. TELEMETRÍA DE SUPERVIVENCIA */}
      <div className="bg-[#0A1121] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC] opacity-5 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Heart size={24} className="text-[#EC4899]" />
           </div>
           <div>
              <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">Estado Biotopo</h3>
              <p className="text-[11px] text-[#EC4899] font-bold uppercase tracking-widest">Censo Tiempo-Real</p>
           </div>
        </div>

        <div className="space-y-4 relative z-10">
           {/* Reloj Virtual */}
           <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex justify-between items-center">
              <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Año Virtual</span>
              <p className="text-xl font-mono font-black text-white">{tiempoVirtual.toFixed(1)} / 50.0</p>
           </div>

           {/* Censos */}
           <div className="grid grid-cols-2 gap-3">
              <div className={`rounded-2xl p-4 border transition-colors ${poblacionPresas < 5 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Censo Presas</span>
                 <p className="text-xl font-black text-[#EC4899]">{poblacionPresas.toFixed(0)}</p>
              </div>
              <div className={`rounded-2xl p-4 border transition-colors ${poblacionDepredadores < 5 ? 'bg-red-500/20 border-red-500/50 animate-pulse' : 'bg-white/5 border-white/10'}`}>
                 <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-1">Censo Lobos</span>
                 <p className="text-xl font-black text-[#219EBC]">{poblacionDepredadores.toFixed(0)}</p>
              </div>
           </div>

           {/* Alertas */}
           <div className="bg-white/5 rounded-2xl p-4 border border-white/10 flex items-center gap-3">
              {status === 'extinction' ? (
                  <AlertCircle size={20} className="text-red-500" />
              ) : tiempoVirtual >= 50 ? (
                  <ShieldCheck size={20} className="text-emerald-500" />
              ) : (
                  <Info size={20} className="text-slate-500" />
              )}
              <div>
                  <span className="text-[9px] font-black text-white/40 uppercase tracking-widest block mb-0.5">Diagnóstico</span>
                  <p className={`text-[11px] font-black uppercase ${
                      status === 'extinction' ? 'text-red-500' : tiempoVirtual >= 50 ? 'text-emerald-500' : 'text-slate-400'
                  }`}>
                    {status === 'extinction' ? 'Extinción del Sistema' : tiempoVirtual >= 50 ? 'Ecosistema Certificado' : 'En Observación'}
                  </p>
              </div>
           </div>

           <button
             disabled={tiempoVirtual < 50 || status === 'extinction'}
             onClick={() => useSimuladorStore.getState().setEcosistema({ status: 'success' })}
             className={`w-full mt-6 py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
               tiempoVirtual >= 50 && status !== 'extinction'
               ? 'bg-emerald-500 text-white hover:bg-emerald-600 shadow-lg shadow-emerald-500/20 active:scale-95'
               : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
             }`}
           >
              <ShieldCheck size={18} />
              Certificar Ecosistema
           </button>
        </div>
      </div>

    </div>
  );
};
