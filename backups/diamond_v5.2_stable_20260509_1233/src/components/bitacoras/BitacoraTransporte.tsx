"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, LineChart, Line, XAxis, YAxis, 
  Tooltip, CartesianGrid, AreaChart, Area
} from 'recharts';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Bot, Volume2, ShieldCheck, Trash2, BookOpen, Activity, Zap, Droplets, Microscope, Waves, FlaskConical } from 'lucide-react';

export default function BitacoraTransporte() {
  const { transporte, setTransporte, validarB2, resetB2 } = useSimuladorStore();
  const { concExt, concInt, volumen, presionOsmotica, history, status, tipoCelula } = transporte;
  const [conclusionText, setConclusionText] = useState("");

  const chartData = history.map((h, i) => ({
    time: i,
    volumen: parseFloat(h.volumen.toFixed(2))
  }));

  const quantumMsg = "Observa el flujo osmótico a través de la membrana plasmática. Ajusta la concentración de NaCl en el medio extracelular para igualar la osmolaridad intracelular. ¡Evita la citólisis por exceso de presión!";

  const handleReset = () => {
    resetB2();
    setConclusionText("");
    audio.playPop();
  };

  const isHomeostasis = Math.abs(concExt - concInt) < 0.05;
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = status === 'success' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-cyan-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Osmótica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el transporte pasivo y la presión osmótica celular.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-cyan-600 to-cyan-800 hover:from-cyan-500 hover:to-cyan-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-cyan-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Transporte
          </button>
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-cyan-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Homeostasis */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${isHomeostasis ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${isHomeostasis ? 'text-cyan-400' : 'text-slate-500'}`}>
                     Equilibrio de Medio
                  </span>
                  <span className="text-xs font-bold text-white">
                     {isHomeostasis ? '✓ Estado Isotónico Alcanzado' : '... Desbalance Osmótico'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${isHomeostasis ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Volumen */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${volumen >= 95 && volumen <= 105 ? 'bg-cyan-500/10 border-cyan-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${volumen >= 95 && volumen <= 105 ? 'text-cyan-400' : 'text-slate-500'}`}>
                     Morfología Celular
                  </span>
                  <span className="text-xs font-bold text-white">
                     {volumen >= 95 && volumen <= 105 ? '✓ Turgencia Normal' : (volumen > 105 ? '⚠ Riesgo de Citólisis' : '⚠ Riesgo de Plasmólisis')}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${volumen >= 95 && volumen <= 105 ? 'bg-cyan-400 shadow-[0_0_10px_rgba(34,211,238,0.5)]' : 'bg-rose-500 shadow-[0_0_10px_rgba(244,63,94,0.5)]'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TELEMETRÍA OSMÓTICA */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-cyan-500/10 flex items-center justify-center text-cyan-500">
              <FlaskConical size={20} />
            </div>
            <div>
              <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Cinética Volumétrica</h3>
              <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Monitoreo en Tiempo Real</p>
            </div>
          </div>
          <div className="text-right">
             <span className="text-[9px] font-black text-slate-400 uppercase block mb-1">Presión $\pi$</span>
             <span className="text-sm font-black text-cyan-600 font-mono">{presionOsmotica.toFixed(2)} atm</span>
          </div>
        </div>

        <div className="h-48 w-full bg-slate-50 rounded-3xl p-4 border border-slate-100">
            <ResponsiveContainer width="100%" height="100%">
               <AreaChart data={chartData}>
                  <defs>
                     <linearGradient id="colorVol" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#22d3ee" stopOpacity={0.3}/>
                        <stop offset="95%" stopColor="#22d3ee" stopOpacity={0}/>
                     </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="time" hide />
                  <YAxis domain={[0, 180]} hide />
                  <Tooltip 
                     contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px' }}
                     labelStyle={{ display: 'none' }}
                  />
                  <Area type="monotone" dataKey="volumen" stroke="#22d3ee" strokeWidth={3} fillOpacity={1} fill="url(#colorVol)" />
               </AreaChart>
            </ResponsiveContainer>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">C_ext (NaCl)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{concExt.toFixed(2)} M</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100 text-center">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Volumen Actual</span>
              <span className="text-sm font-black text-cyan-600 font-mono">{volumen.toFixed(1)} %</span>
           </div>
        </div>

        <button 
          onClick={() => { if(validarB2()) audio.playSuccess(); else audio.playError(); }}
          disabled={status === 'success'}
          className={`w-full py-5 rounded-2xl font-black text-[10px] uppercase tracking-widest transition-all shadow-xl active:scale-95 ${status === 'success' ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {status === 'success' ? 'Protocolo Validado' : 'Certificar Estado Isotónico'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Osmótico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica el proceso de ósmosis y cómo la diferencia de concentraciones de soluto entre el interior y el exterior de la célula determina la dirección del flujo de agua..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-cyan-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-cyan-50 text-slate-400 hover:text-cyan-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Certificación Osmótica Completada."); }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
