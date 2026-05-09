"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, 
  Tooltip, Cell, LabelList 
} from 'recharts';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Bot, Volume2, ShieldCheck, Trash2, BookOpen, Activity, Zap, BarChart3 } from 'lucide-react';

export default function BitacoraGalton() {
  const { galton10, lanzarBolitasM10, resetM10, validarM10, audio } = useSimuladorStore();
  const { probabilidad: p, status, contenedores } = galton10;
  const bolitasSoltadas = contenedores.reduce((a, b) => a + b, 0);

  const [conclusionText, setConclusionText] = useState('');
  
  // Data para el gráfico
  const chartData = contenedores.map((val, i) => ({
    name: `C${i+1}`,
    count: val,
    color: `hsl(${220 + i * 10}, 70%, 50%)`
  }));

  const quantumMsg = `Observa cómo se forma la Campana de Gauss al soltar las esferas. Cada colisión con los clavos es un evento estocástico que suma a la distribución normal. ¡Simula suficientes eventos para certificar la convergencia estadística!`;

  const handleReset = () => {
    resetM10();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const hasEnoughBalls = bolitasSoltadas >= 200;
  const hasEnoughWords = wordCount >= 30;
  const canValidate = hasEnoughBalls && hasEnoughWords;

  const handleValidate = () => {
    const isOk = validarM10();
    if (isOk) {
      audio.playVictory();
      // No alert, use the status UI below
    } else {
      audio.playError();
    }
  };

  // Hallazgos en vivo
  const checkProb = p !== 0.5;
  const checkSim = bolitasSoltadas > 0;
  const checkNormal = bolitasSoltadas > 150;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-indigo-400/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-indigo-400 animate-ping" />
             <span className="text-[10px] font-black text-indigo-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Protocolo Estocástico</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la probabilidad binomial y la formación de distribuciones normales.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-indigo-500 to-indigo-700 hover:from-indigo-400 hover:to-indigo-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe de Telemetría
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-indigo-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* GRÁFICO DE DISTRIBUCIÓN EN TIEMPO REAL */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm p-6 overflow-hidden relative">
         <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-2">
               <BarChart3 size={16} className="text-indigo-600" />
               <h4 className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Distribución de Frecuencia</h4>
            </div>
            <div className="flex items-center gap-2">
               <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">N = {bolitasSoltadas}</span>
            </div>
         </div>

         <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
               <BarChart data={chartData}>
                  <XAxis dataKey="name" hide />
                  <Tooltip 
                     contentStyle={{ borderRadius: '1rem', border: 'none', boxShadow: '0 10px 25px rgba(0,0,0,0.1)', fontSize: '10px', fontWeight: 'bold' }}
                  />
                  <Bar dataKey="count" radius={[4, 4, 0, 0]}>
                     {chartData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={entry.color} />
                     ))}
                  </Bar>
               </BarChart>
            </ResponsiveContainer>
         </div>

         <button 
           onClick={() => { lanzarBolitasM10(); audio.playPop(); }}
           className="w-full mt-4 py-3 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-[9px] font-black uppercase tracking-widest transition-all active:scale-95 shadow-lg shadow-indigo-600/20 flex items-center justify-center gap-2"
         >
           <Zap size={14} fill="currentColor" />
           Lanzar 100 Esferas
         </button>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <BarChart3 size={14} className="text-indigo-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Parámetro P */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkProb ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkProb ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Sesgo Probabilístico (p)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkProb ? `✓ Probabilidad: ${p.toFixed(2)}` : '... Configurando Probabilidad'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkProb ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Simulación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkSim ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkSim ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Muestreo Estadístico
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkSim ? `✓ Eventos: ${bolitasSoltadas}` : '... Iniciando Simulación'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkSim ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Convergencia */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkNormal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkNormal ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Convergencia Normal
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkNormal ? '✓ Distribución Sincronizada' : '... Esperando Ley de Grandes Números'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkNormal ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ESTADÍSTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-indigo-500/10 flex items-center justify-center text-indigo-500">
            <Activity size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora Binomial</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Métricas de la Máquina de Galton</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Muestra (N)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{bolitasSoltadas}</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Esperanza (E)</span>
              <span className="text-sm font-black text-indigo-600 font-mono">{(bolitasSoltadas * p).toFixed(1)}</span>
           </div>
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis Estadístico</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es la campana de Gauss y por qué los resultados tienden a agruparse en el centro conforme aumenta el número de esferas..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-indigo-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-indigo-50 text-slate-400 hover:text-indigo-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={handleValidate}
          disabled={!canValidate || status === 'success'}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${
            status === 'success' ? 'bg-emerald-500 text-white shadow-emerald-500/20' :
            canValidate ? 'bg-[#023047] text-white shadow-slate-900/20' : 
            'bg-slate-200 text-slate-400 cursor-not-allowed shadow-none'
          }`}
        >
          {status === 'success' ? <ShieldCheck size={16} /> : <Zap size={16} />}
          {status === 'success' ? 'PRÁCTICA COMPLETADA' : 
           !hasEnoughBalls ? `FALTAN ${200 - bolitasSoltadas} ESFERAS` :
           !hasEnoughWords ? `FALTAN ${30 - wordCount} PALABRAS` :
           'CERTIFICAR ANÁLISIS'}
        </button>
      </div>

      <AnimatePresence>
        {status === 'success' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="p-6 bg-emerald-500/10 border border-emerald-500/20 rounded-[2rem] text-center"
          >
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Certificación Exitosa</p>
            <p className="text-xs font-bold text-slate-600 italic">"La convergencia estadística ha sido verificada. Has dominado el comportamiento del azar colectivo."</p>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
