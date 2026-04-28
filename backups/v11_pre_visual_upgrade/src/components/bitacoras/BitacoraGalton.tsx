"use client";

import React, { useEffect, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { CloudRain, Trash2, Filter, Info, CheckCircle2, AlertTriangle, BarChart3, Settings2 } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraGalton() {
  const { galton10, setGaltonM10, lanzarBolitasM10, vaciarGaltonM10, validarM10 } = useSimuladorStore();
  const { poblacion, probabilidad, contenedores, status } = galton10;

  // Semilla de error inicial (ficticia para el alumno)
  const [desbloqueado, setDesbloqueado] = useState(false);

  // Estadísticas en Vivo
  const n_rows = 10;
  const mu = n_rows * probabilidad;
  const sigma = Math.sqrt(n_rows * probabilidad * (1 - probabilidad));
  const totalBolitas = contenedores.reduce((a, b) => a + b, 0);

  const getSesgoInfo = () => {
    if (Math.abs(probabilidad - 0.5) < 0.05) return { text: "CALIBRADO", color: "text-emerald-500", icon: <CheckCircle2 size={12}/> };
    if (probabilidad > 0.5) return { text: "SESGO DERECHA", color: "text-amber-500", icon: <AlertTriangle size={12}/> };
    return { text: "SESGO IZQUIERDA", color: "text-amber-500", icon: <AlertTriangle size={12}/> };
  };

  const sesgo = getSesgoInfo();

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-sans">
      {/* HUD HEADER */}
      <div className="bg-[#020617] rounded-3xl p-6 text-white shadow-xl relative overflow-hidden group border border-white/5">
        <div className="absolute top-0 right-0 w-32 h-32 bg-amber-500/10 blur-3xl -mr-10 -mt-10" />
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-amber-400">
           <Filter size={14} className="animate-pulse" /> Telemetría de Galton
        </div>
        
        <div className="grid grid-cols-2 gap-2 mt-4">
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Media (μ)</div>
                <div className="text-sm font-mono font-bold text-amber-200">{mu.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5">
                <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Desviación (σ)</div>
                <div className="text-sm font-mono font-bold text-amber-200">{sigma.toFixed(2)}</div>
            </div>
            <div className="p-3 bg-white/5 rounded-xl border border-white/5 col-span-2 flex justify-between items-center">
                <div className="text-[8px] font-black text-slate-500 uppercase">Estado de Máquina</div>
                <div className={`flex items-center gap-1 text-[9px] font-black ${sesgo.color}`}>
                    {sesgo.icon} {sesgo.text}
                </div>
            </div>
        </div>
      </div>

      {/* CONSOLA DE INYECCIÓN */}
      <div className="bg-white p-6 rounded-[2.5rem] border border-slate-100 shadow-sm space-y-6">
        
        {/* POBLACIÓN */}
        <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <BarChart3 size={12} className="text-amber-500" /> Volumen (n)
                </h4>
                <span className="text-lg font-black text-slate-800 bg-slate-50 px-4 py-1 rounded-full border border-slate-100 italic">
                    {poblacion} <span className="text-[8px] uppercase tracking-tighter text-slate-400 ml-1">esferas</span>
                </span>
            </div>
            <input 
              type="range" min="10" max="500" step="10" value={poblacion} 
              onChange={(e) => setGaltonM10(parseInt(e.target.value), probabilidad)} 
              className="w-full h-2 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-amber-500" 
            />
        </div>

        {/* PROBABILIDAD (CALIBRACIÓN) */}
        <div className="space-y-4 pt-2 border-t border-slate-50">
            <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
                    <Settings2 size={12} className="text-amber-500" /> Calibración (p)
                </h4>
                <div className="flex items-center gap-2">
                    <span className={`text-[9px] font-black uppercase tracking-tighter px-2 py-0.5 rounded ${desbloqueado ? 'bg-emerald-100 text-emerald-600' : 'bg-slate-100 text-slate-400'}`}>
                        {desbloqueado ? 'Libre' : 'Bloqueado'}
                    </span>
                    <span className="text-sm font-bold text-slate-700 font-mono italic">{(probabilidad * 100).toFixed(0)}%</span>
                </div>
            </div>
            <div className="relative">
                <input 
                    type="range" min="0.1" max="0.9" step="0.01" value={probabilidad} 
                    disabled={!desbloqueado}
                    onChange={(e) => setGaltonM10(poblacion, parseFloat(e.target.value))} 
                    className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-amber-500 ${desbloqueado ? 'bg-slate-100' : 'bg-slate-50 opacity-40 cursor-not-allowed'}`} 
                />
                {!desbloqueado && (
                    <button 
                        onClick={() => setDesbloqueado(true)}
                        className="absolute inset-0 bg-transparent flex items-center justify-center group"
                    >
                        <span className="bg-white/90 border border-slate-200 px-3 py-1 rounded-full text-[8px] font-black uppercase tracking-widest text-slate-500 shadow-sm opacity-0 group-hover:opacity-100 transition-opacity">
                            Desbloquear con Bit de Seguridad
                        </span>
                    </button>
                )}
            </div>
        </div>

        {/* ACCIONES */}
        <div className="grid grid-cols-2 gap-3 pt-2">
            <button 
                onClick={lanzarBolitasM10}
                className="flex flex-col items-center justify-center gap-1 p-4 bg-amber-50 border border-amber-100 rounded-[1.5rem] group hover:bg-amber-100 transition-all active:scale-95"
            >
                <CloudRain size={20} className="text-amber-500 group-hover:animate-bounce" />
                <span className="text-[9px] font-black text-amber-700 uppercase tracking-tighter">Inyectar</span>
            </button>
            <button 
                onClick={vaciarGaltonM10}
                className="flex flex-col items-center justify-center gap-1 p-4 bg-slate-50 border border-slate-100 rounded-[1.5rem] group hover:bg-slate-100 transition-all active:scale-95"
            >
                <Trash2 size={20} className="text-slate-400 group-hover:text-red-400" />
                <span className="text-[9px] font-black text-slate-600 uppercase tracking-tighter">Vaciar</span>
            </button>
        </div>
      </div>

      {/* VALIDACIÓN ESTADÍSTICA */}
      <div className="pt-2">
            <button 
              onClick={validarM10}
              disabled={totalBolitas < 1}
              className={`w-full py-5 rounded-[2rem] font-black text-[11px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-2 active:scale-95 shadow-xl ${
                status === 'success' 
                ? 'bg-emerald-500 text-white shadow-emerald-100' 
                : status === 'error'
                ? 'bg-red-500 text-white'
                : totalBolitas < 1 ? 'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none' : 'bg-[#020617] text-white shadow-slate-200'
              }`}
            >
              {status === 'success' ? <><CheckCircle2 size={16} /> Gauss Verificado</> : status === 'error' ? <><AlertTriangle size={16} /> Campana Sesgada</> : 'Validar Distribución'}
            </button>
            
            {status === 'error' && (
                <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} className="mt-3 text-[9px] font-bold text-red-500 text-center px-4 leading-relaxed uppercase tracking-tighter">
                   {totalBolitas < 200 ? "La población es muy pequeña para estabilizar el modelo." : "La campana no está centrada. Calibra p a 0.50."}
                </motion.p>
            )}
      </div>

      <div className="p-5 bg-amber-50 rounded-3xl border border-amber-100 flex gap-3 italic">
         <Info size={18} className="text-amber-400 shrink-0" />
         <p className="text-[10px] text-amber-700 leading-relaxed font-medium">
            ¿Notas cómo el total histórico es {totalBolitas}? Conforme este número crece, la forma de la campana se vuelve más rígida y predecible.
         </p>
      </div>
    </div>
  );
}
