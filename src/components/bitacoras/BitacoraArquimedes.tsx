"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Droplets, Gauge, Anchor
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function BitacoraArquimedes() {
  const { arquimedes6, setArquimedes6, bitacoraData, setBitacora } = useSimuladorStore();
  const { fluido, densidadCuerpo, volumenCuerpo, sumergido, resultado } = arquimedes6;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `El principio de Arquímedes dicta que el empuje ascendente es exactamente igual al peso del volumen de fluido que el cuerpo desplaza. Si el empuje supera al peso real, el objeto flotará.`;

  // Estado local para los registros (se sincroniza con bitacoraData)
  const registros = bitacoraData?.arquimedes_logs || [];

  const addRegistro = () => {
    audio.playPop();
    const rhoFluido = fluido === 'agua' ? 1000 : fluido === 'aceite' ? 920 : 1261;
    const g = 9.81;
    const pesoReal = densidadCuerpo * volumenCuerpo * g;
    const empuje = rhoFluido * g * (volumenCuerpo * sumergido);
    const pesoAparente = Math.max(0, pesoReal - empuje);
    
    const nuevoRegistro = {
      id: crypto.randomUUID(),
      fluido: fluido.toUpperCase(),
      vol: (sumergido * 100).toFixed(0) + '%',
      w_real: pesoReal.toFixed(3),
      w_aparente: pesoAparente.toFixed(3),
      empuje: empuje.toFixed(3),
      timestamp: new Date().toLocaleTimeString()
    };
    setBitacora({
      ...bitacoraData,
      arquimedes_logs: [nuevoRegistro, ...registros].slice(0, 10)
    });
  };

  const clearRegistros = () => {
    setBitacora({
      ...bitacoraData,
      arquimedes_logs: []
    });
  };

  // Historial para la gráfica
  const [history, setHistory] = useState<{vol: number, e: number}[]>([]);
  
  // Cálculos
  const rhoFluido = fluido === 'agua' ? 1000 : fluido === 'aceite' ? 920 : 1261;
  const g = 9.81;
  const pesoReal = densidadCuerpo * volumenCuerpo * g;
  const empuje = rhoFluido * g * (volumenCuerpo * sumergido);
  const pesoAparente = Math.max(0, pesoReal - empuje);

  React.useEffect(() => {
    if (sumergido > 0) {
      setHistory(prev => [...prev, { vol: sumergido, e: empuje }].slice(-20));
    }
  }, [sumergido, empuje]);

  const handleReset = () => {
    setArquimedes6({ fluido: 'agua', densidadCuerpo: 800, volumenCuerpo: 0.001, sumergido: 0, resultado: null });
    setConclusionText('');
    setHistory([]);
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = sumergido > 0 && wordCount >= 30;

  // Hallazgos en vivo
  const checkFluido = fluido !== 'agua';
  const checkInmersion = sumergido > 0.5;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-blue-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-blue-400 animate-ping" />
             <span className="text-[10px] font-black text-blue-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Análisis de Empuje</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre el Principio de Arquímedes.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-blue-600 to-blue-800 hover:from-blue-500 hover:to-blue-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-blue-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Hidrostático
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-blue-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Droplets size={14} className="text-blue-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Inmersión */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkInmersion ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkInmersion ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Estado de Inmersión
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkInmersion ? `✓ Sólido Sumergido al ${(sumergido * 100).toFixed(0)}%` : '... Bajando Dinamómetro'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkInmersion ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Fluido */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkFluido ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkFluido ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Medio de Referencia
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkFluido ? `✓ Fluido: ${fluido.toUpperCase()} (ρ=${rhoFluido})` : '... Usando Agua Destilada'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkFluido ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Flotabilidad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${pesoAparente < pesoReal ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${pesoAparente < pesoReal ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Telemetría de Empuje
                  </span>
                  <span className="text-xs font-bold text-white">
                     {pesoAparente < pesoReal ? '✓ Fuerza Ascendente Detectada' : '... Fuera del Fluido'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${pesoAparente < pesoReal ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE EMPUJE (NUEVO) */}
      <div className="bg-[#023047] p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Activity size={14} className="text-blue-400" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Curva de Flotabilidad (E)</span>
           </div>
           <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest tabular-nums">{empuje.toFixed(3)} N</span>
        </div>
        
        <div className="h-40 w-full bg-black/20 rounded-2xl border border-white/5 p-2 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <YAxis domain={[0, 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="e" 
                stroke="#3b82f6" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* DINAMÓMETRO HUD */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-500/10 flex items-center justify-center text-blue-500">
            <Gauge size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Dinamómetro Digital</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Cálculo de Peso Aparente</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Peso Real (W)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{pesoReal.toFixed(3)} N</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Peso Aparente</span>
              <span className={`text-sm font-black font-mono ${pesoAparente < pesoReal ? 'text-blue-600' : 'text-slate-400'}`}>{pesoAparente.toFixed(3)} N</span>
           </div>
        </div>

        <button 
          onClick={addRegistro}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Anchor size={14} /> Capturar Telemetría de Empuje
        </button>
      </div>

      {/* TABLA DE DATOS (NUEVA) */}
      <div className="p-6 bg-[#023047] rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-blue-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-200">Hydro Log v2.0</span>
          </div>
          {registros.length > 0 && (
            <button onClick={clearRegistros} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {registros.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-2xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-loose">
                Sin datos registrados.<br/>Sumerge el cuerpo para medir el empuje.
              </p>
            </div>
          ) : (
            registros.map((reg: any) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={reg.id} 
                className="grid grid-cols-5 gap-1 p-3 bg-white/5 rounded-xl border border-white/5 items-center"
              >
                <div className="flex flex-col">
                   <span className="text-[6px] font-black text-blue-400 uppercase tracking-tighter">Fluido</span>
                   <span className="text-[9px] font-black">{reg.fluido}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[6px] font-black text-blue-400 uppercase tracking-tighter">W Real</span>
                   <span className="text-[9px] font-black tabular-nums">{reg.w_real}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[6px] font-black text-blue-400 uppercase tracking-tighter">W Ap.</span>
                   <span className="text-[9px] font-black tabular-nums">{reg.w_aparente}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[6px] font-black text-blue-400 uppercase tracking-tighter">Empuje</span>
                   <span className="text-[9px] font-black tabular-nums text-blue-300">{reg.empuje}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[6px] font-black text-white/20 uppercase tracking-tighter">V</span>
                   <span className="text-[9px] font-black text-emerald-400">{reg.vol}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Flotabilidad</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es el empuje y por qué un objeto parece pesar menos cuando está sumergido en un fluido..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-blue-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-blue-50 text-slate-400 hover:text-blue-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Misión de Flotabilidad Certificada."); }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-slate-950 text-white shadow-blue-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}

