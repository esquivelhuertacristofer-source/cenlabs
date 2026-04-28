"use client";

import React from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Activity, Play, Square, Waves, Compass, Info, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraTrigonometria() {
  const { trigonometria, setAnguloM5, setAnimandoM5, setTogglesM5, validarM5 } = useSimuladorStore();
  const { angulo, animando, verSeno, verCoseno, status } = trigonometria;

  const rad = (angulo * Math.PI) / 180;
  const sin = Math.sin(rad);
  const cos = Math.cos(rad);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HEADER CARD */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-cyan-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-cyan-400">
           <Compass size={14} className="animate-pulse" /> Generador de Ondas
        </div>
        <p className="text-xs font-bold text-slate-400 mb-4 leading-relaxed">
          Manipula el ángulo del vector y observa cómo se proyectan los valores de <span className="text-cyan-400">Seno</span> y <span className="text-fuchsia-400">Coseno</span>.
        </p>
        <div className="flex gap-2">
            <div className="flex-1 p-2 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase">Radianes</div>
                <div className="text-sm font-mono font-bold text-cyan-200">{rad.toFixed(2)} rad</div>
            </div>
            <div className="flex-1 p-2 bg-white/5 rounded-xl border border-white/5 text-center">
                <div className="text-[8px] font-black text-slate-500 uppercase">Grados</div>
                <div className="text-sm font-mono font-bold text-fuchsia-200">{angulo}°</div>
            </div>
        </div>
      </div>

      {/* CONTROLES ANGULARES */}
      <div className="space-y-6 bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm transition-all duration-300 hover:shadow-md">
        <div className="flex justify-between items-center">
            <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                <Activity size={14} className="text-cyan-500" /> Control Angular
            </h4>
            <div className="flex bg-slate-100 p-1 rounded-full gap-1">
                <button 
                  onClick={() => setAnimandoM5(true)}
                  className={`p-1.5 rounded-full transition-all ${animando ? 'bg-cyan-500 text-white shadow-lg' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Play size={14} fill={animando ? "currentColor" : "none"} />
                </button>
                <button 
                  onClick={() => setAnimandoM5(false)}
                  className={`p-1.5 rounded-full transition-all ${!animando ? 'bg-slate-300 text-slate-600' : 'text-slate-400 hover:text-slate-600'}`}
                >
                    <Square size={14} fill={!animando ? "currentColor" : "none"} />
                </button>
            </div>
        </div>
        
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="flex justify-between items-center px-1">
              <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Fase Inicial (θ)</span>
              <span className="text-lg font-black text-slate-800 tracking-tighter">{angulo}°</span>
            </div>
            <input 
              type="range" min="0" max="360" step="1" value={angulo} 
              onChange={(e) => {
                  setAnguloM5(parseInt(e.target.value));
                  setAnimandoM5(false);
              }} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-cyan-500" 
            />
          </div>
        </div>
      </div>

      {/* VISIBILIDAD DE ONDAS */}
      <div className="bg-slate-50 rounded-[2.5rem] p-6 border border-slate-100 space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest pl-1">Proyectores de Onda</h4>
        
        <div className="grid grid-cols-2 gap-3">
            <button 
                onClick={() => setTogglesM5(!verSeno, verCoseno)}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${verSeno ? 'bg-cyan-50 border-cyan-200' : 'bg-white border-slate-100'}`}
            >
                <div className={`w-6 h-6 rounded-lg mb-1 flex items-center justify-center ${verSeno ? 'bg-cyan-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Waves size={14} />
                </div>
                <span className={`text-[9px] font-black uppercase ${verSeno ? 'text-cyan-700' : 'text-slate-400'}`}>Seno (y)</span>
                <span className={`text-xs font-bold ${verSeno ? 'text-cyan-600' : 'text-slate-300'}`}>{sin.toFixed(4)}</span>
            </button>

            <button 
                onClick={() => setTogglesM5(verSeno, !verCoseno)}
                className={`p-4 rounded-2xl border-2 transition-all text-left flex flex-col gap-1 ${verCoseno ? 'bg-fuchsia-50 border-fuchsia-200' : 'bg-white border-slate-100'}`}
            >
                <div className={`w-6 h-6 rounded-lg mb-1 flex items-center justify-center ${verCoseno ? 'bg-fuchsia-500 text-white' : 'bg-slate-100 text-slate-400'}`}>
                    <Waves size={14} />
                </div>
                <span className={`text-[9px] font-black uppercase ${verCoseno ? 'text-fuchsia-700' : 'text-slate-400'}`}>Coseno (x)</span>
                <span className={`text-xs font-bold ${verCoseno ? 'text-fuchsia-600' : 'text-slate-300'}`}>{cos.toFixed(4)}</span>
            </button>
        </div>

        <div className="pt-2">
            <button 
              onClick={validarM5}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-[#020617] text-white shadow-slate-200 hover:bg-slate-800'
              }`}
            >
              {status === 'success' ? <><CheckCircle2 size={16} /> Ángulo Correcto</> : status === 'error' ? <><AlertCircle size={16} /> Revisa el Cruce</> : 'Validar Ángulo'}
            </button>
        </div>

        {status === 'error' && (
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed">
                Pista: Busca el punto donde Seno y Coseno valen exactamente 0.7071. (θ = 45°)
            </motion.p>
        )}
      </div>

      <div className="p-5 bg-cyan-50/50 rounded-3xl border border-cyan-100 flex gap-3 italic">
         <Info size={18} className="text-cyan-400 shrink-0" />
         <p className="text-[10px] text-cyan-700 leading-relaxed font-medium">
            ¿Sabías que la palabra "Seno" proviene del sánscrito "jya" que significa "cuerda de arco"? Estás viendo cómo esa cuerda pulsa en el tiempo.
         </p>
      </div>
    </div>
  );
}
