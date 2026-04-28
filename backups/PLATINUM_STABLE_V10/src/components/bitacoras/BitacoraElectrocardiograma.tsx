import React from 'react';
import { motion } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Heart, Zap, Activity, Timer, 
  TrendingUp, AlertCircle, CheckCircle2, 
  Bed, User, PersonStanding, Stethoscope
} from 'lucide-react';

export default function BitacoraElectrocardiograma() {
  const { cardio, setCardio, resetB8 } = useSimuladorStore();
  const { ritmoBPM, targetBPM, faseActual, estadoFisiologico, status } = cardio;

  const getBPMTargetMessage = () => {
    if (ritmoBPM === targetBPM) return "¡Ritmo estalizado correctamente!";
    if (ritmoBPM < targetBPM) return `Aumenta la actividad para alcanzar los ${targetBPM} BPM.`;
    return `Reduce el esfuerzo para estabilizar en ${targetBPM} BPM.`;
  };

  const isTargetMet = ritmoBPM === targetBPM;

  return (
    <div className="space-y-6 animate-in fade-in slide-in-from-right duration-500">
      
      {/* 1. CONSOLA DEL MONITOR (Controles) */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm relative overflow-hidden">
        <div className="flex items-center gap-3 mb-8">
           <div className="w-10 h-10 bg-[#023047] rounded-xl flex items-center justify-center text-white shadow-lg shadow-[#023047]/10">
              <Stethoscope size={20} />
           </div>
           <div>
              <h4 className="text-sm font-black text-[#023047] uppercase tracking-tighter">Panel de Monitoreo</h4>
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Ajuste de Cuerda Cardíaca</p>
           </div>
        </div>

        <div className="space-y-8">
           {/* Estado Rápido */}
           <div className="grid grid-cols-3 gap-2">
              {[
                { label: 'Sueño', bpm: 50, icon: Bed },
                { label: 'Reposo', bpm: 75, icon: User },
                { label: 'Esfuerzo', bpm: 140, icon: PersonStanding }
              ].map((item) => (
                <button
                  key={item.label}
                  onClick={() => setCardio({ ritmoBPM: item.bpm, estadoFisiologico: item.label as any })}
                  className={`flex flex-col items-center gap-2 p-3 rounded-2xl border-2 transition-all ${
                    estadoFisiologico === item.label 
                    ? 'border-[#219EBC] bg-[#219EBC]/5' 
                    : 'border-slate-100 hover:border-slate-200 bg-slate-50'
                  }`}
                >
                  <item.icon size={16} className={estadoFisiologico === item.label ? 'text-[#219EBC]' : 'text-slate-400'} />
                  <span className="text-[10px] font-black uppercase text-slate-500">{item.label}</span>
                </button>
              ))}
           </div>

           {/* Slider de BPM */}
           <div className="space-y-4">
              <div className="flex justify-between items-center px-1">
                 <div className="flex items-center gap-2">
                    <TrendingUp size={14} className="text-[#FB8500]" />
                    <span className="text-[11px] font-black text-slate-500 uppercase tracking-widest">Nivel de Adrenalina</span>
                 </div>
                 <span className="text-sm font-mono font-black text-[#023047]">{ritmoBPM} BPM</span>
              </div>
              <input 
                type="range" min="40" max="180" 
                value={ritmoBPM}
                onChange={(e) => setCardio({ ritmoBPM: parseInt(e.target.value), estadoFisiologico: 'Actividad' })}
                className="w-full h-2 bg-slate-100 rounded-full appearance-none cursor-pointer accent-[#FB8500]"
              />
              <div className="flex justify-between text-[9px] font-bold text-slate-400 uppercase tracking-tighter">
                <span>40 BPM</span>
                <span>Objetivo: {targetBPM} BPM</span>
                <span>180 BPM</span>
              </div>
           </div>
        </div>
      </div>

      {/* 2. TELEMETRÍA MÉDICA (Indicadores) */}
      <div className="bg-[#0A1121] rounded-[2.5rem] p-8 text-white shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-[#219EBC] opacity-5 blur-3xl" />
        
        <div className="flex items-center gap-4 mb-8">
           <div className="w-12 h-12 rounded-2xl bg-white/5 flex items-center justify-center border border-white/10 shadow-inner">
              <Activity size={24} className="text-[#219EBC] animate-pulse" />
           </div>
           <div>
              <h3 className="text-lg font-black tracking-tighter uppercase leading-tight">Telemetría V8</h3>
              <p className="text-[11px] text-[#219EBC] font-bold uppercase tracking-widest">Sincronizador P-QRS-T</p>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4 relative z-10">
           <div className="bg-white/5 rounded-3xl p-6 border border-white/10">
              <div className="flex justify-between items-center mb-4">
                 <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest">Periodo (T)</span>
                 <span className="text-xl font-mono font-black text-[#8ECAE6]">{(60 / ritmoBPM).toFixed(2)}<span className="text-xs ml-1">seg</span></span>
              </div>
              
              {/* Fase Actual Indicator */}
              <div className="flex gap-2">
                {['Onda P', 'QRS', 'Onda T'].map((fase) => (
                  <div 
                    key={fase}
                    className={`flex-1 h-8 rounded-xl flex items-center justify-center text-[9px] font-black uppercase tracking-tighter border transition-all duration-150 ${
                      faseActual === fase 
                      ? 'bg-white/10 border-white/20 text-white shadow-[0_0_15px_rgba(255,255,255,0.1)]' 
                      : 'bg-transparent border-white/5 text-white/20'
                    }`}
                  >
                    {fase}
                  </div>
                ))}
              </div>
           </div>

           <div className="bg-white/5 rounded-3xl p-6 border border-white/10 transition-colors">
              <span className="text-[11px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-2 mb-3">
                 <Timer size={12} /> Desviación de Objetivo
              </span>
              <div className="flex items-end justify-between">
                 <span className={`text-3xl font-mono font-black ${isTargetMet ? 'text-emerald-400' : 'text-slate-600'}`}>
                   {Math.abs(targetBPM - ritmoBPM)} <span className="text-sm font-bold opacity-50">Δ BPM</span>
                 </span>
                 <div className={`text-[10px] font-black px-3 py-1 rounded-full uppercase tracking-tighter ${
                   isTargetMet ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-400 border border-rose-500/30'
                 }`}>
                   {isTargetMet ? 'Sincronizado' : 'Desviado'}
                 </div>
              </div>
           </div>
        </div>

        <div className="mt-8 pt-8 border-t border-white/5">
           <button
             disabled={!isTargetMet}
             onClick={() => setCardio({ status: 'success' })}
             className={`w-full py-5 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 ${
               isTargetMet 
               ? 'bg-[#FB8500] text-white hover:bg-[#ff952b] shadow-lg shadow-[#FB8500]/20 active:scale-95'
               : 'bg-white/5 text-white/20 border border-white/5 cursor-not-allowed'
             }`}
           >
              <CheckCircle2 size={18} />
              Registrar Prueba
           </button>
           <p className={`mt-4 text-[10px] text-center font-bold uppercase tracking-wider ${isTargetMet ? 'text-emerald-500' : 'text-slate-500'}`}>
             {getBPMTargetMessage()}
           </p>
        </div>
      </div>

    </div>
  );
};
