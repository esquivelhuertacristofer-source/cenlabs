"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Move, Box, TrendingUp
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer
} from 'recharts';

export default function BitacoraPlanoInclinado() {
  const { plano2, setPlano2, bitacoraData, setBitacora } = useSimuladorStore();
  const { angulo, coefRozamiento, masa, animando, resultado } = plano2;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Analiza las fuerzas que actúan sobre el bloque. La componente del peso paralela al plano es mg sen(theta), mientras que la fuerza de fricción que se opone es mu mg cos(theta). Si la componente del peso supera a la fricción, el bloque acelerará rampa abajo.`;

  // Estado local para los registros (se sincroniza con bitacoraData)
  const registros = bitacoraData?.plano_logs || [];

  const addRegistro = () => {
    audio.playPop();
    const g = 9.81;
    const rad = (angulo * Math.PI) / 180;
    const Px = masa * g * Math.sin(rad);
    const fr = coefRozamiento * masa * g * Math.cos(rad);
    
    const nuevoRegistro = {
      id: crypto.randomUUID(),
      angulo,
      coefRozamiento,
      Px: Px.toFixed(2),
      fr: fr.toFixed(2),
      a: Math.max(0, (Px - fr) / masa).toFixed(2),
      timestamp: new Date().toLocaleTimeString()
    };
    setBitacora({
      ...bitacoraData,
      plano_logs: [nuevoRegistro, ...registros].slice(0, 10)
    });
  };

  const clearRegistros = () => {
    setBitacora({
      ...bitacoraData,
      plano_logs: []
    });
  };

  // Historial para la gráfica (en vivo durante la animación)
  const [history, setHistory] = useState<{time: number, a: number}[]>([]);
  
  // Cálculos en vivo para el HUD
  const g = 9.81;
  const rad = (angulo * Math.PI) / 180;
  const Px = masa * g * Math.sin(rad);
  const Py = masa * g * Math.cos(rad);
  const fr = coefRozamiento * Py;
  const aceleracion = Math.max(0, (Px - fr) / masa);

  React.useEffect(() => {
    if (!animando) return;
    const interval = setInterval(() => {
      setHistory(prev => [...prev, { time: Date.now(), a: aceleracion }].slice(-20));
    }, 500);
    return () => clearInterval(interval);
  }, [aceleracion, animando]);

  const handleReset = () => {
    setPlano2({ animando: false, resultado: null });
    setConclusionText('');
    setHistory([]);
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = resultado === 'exito' && wordCount >= 30;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-orange-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
             <span className="text-[10px] font-black text-orange-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Análisis Dinámico</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la descomposición vectorial y el balance de fuerzas.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Newtoniano
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-orange-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <TrendingUp size={14} className="text-orange-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Inclinación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${angulo > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${angulo > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Configuración de Rampa
                  </span>
                  <span className="text-xs font-bold text-white">
                     {angulo > 0 ? `✓ Ángulo θ = ${angulo}° Validado` : '... Ajustando Inclinación'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${angulo > 0 ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Fricción */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${coefRozamiento > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${coefRozamiento > 0 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Resistencia al Movimiento (μ)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {coefRozamiento > 0 ? `✓ Coeficiente μ = ${coefRozamiento.toFixed(2)}` : '... Definiendo Material'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${coefRozamiento > 0 ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Descenso */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${resultado === 'exito' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Certificación Dinámica
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Descenso Telemétrico Completado' : '... Esperando Inicio'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR DE TENDENCIAS (NUEVO) */}
      <div className="bg-[#023047] p-6 rounded-[2rem] border border-white/10 shadow-2xl relative overflow-hidden">
        <div className="flex items-center justify-between mb-4">
           <div className="flex items-center gap-2">
              <Activity size={14} className="text-orange-400" />
              <span className="text-[10px] font-black text-white/40 uppercase tracking-[0.2em]">Monitor de Aceleración</span>
           </div>
           <span className="text-[9px] font-bold text-white/20 uppercase tracking-widest tabular-nums">{aceleracion.toFixed(2)} m/s²</span>
        </div>
        
        <div className="h-40 w-full bg-black/20 rounded-2xl border border-white/5 p-2 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#ffffff05" />
              <YAxis domain={[0, 'auto']} hide />
              <Line 
                type="monotone" 
                dataKey="a" 
                stroke="#f97316" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* CONSOLA NEWTONIANA (HUD) */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Consola Newtoniana</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría de Fuerzas</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Peso X (Px)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{Px.toFixed(2)} N</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Fricción (fr)</span>
              <span className={`text-sm font-black font-mono ${Px > fr ? 'text-orange-600' : 'text-emerald-500'}`}>{fr.toFixed(2)} N</span>
           </div>
        </div>

        <button 
          onClick={addRegistro}
          disabled={animando}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Table size={14} /> Capturar Punto de Telemetría
        </button>
      </div>

      {/* TABLA DE DATOS (NUEVA) */}
      <div className="p-6 bg-[#023047] rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-orange-200">Data Logger v2.0</span>
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
                Sin datos registrados.<br/>Captura puntos para validar la 2da Ley de Newton.
              </p>
            </div>
          ) : (
            registros.map((reg: any) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={reg.id} 
                className="grid grid-cols-4 gap-2 p-3 bg-white/5 rounded-xl border border-white/5 items-center"
              >
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-orange-400 uppercase tracking-tighter">θ (°)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.angulo}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-orange-400 uppercase tracking-tighter">Px (N)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.Px}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter">fr (N)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.fr}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">a (m/s²)</span>
                   <span className="text-[11px] font-black tabular-nums text-orange-400">{reg.a}</span>
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
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Informe de Observación</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué sucede con la fuerza normal a medida que aumenta el ángulo de inclinación y cómo afecta esto a la aceleración..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-orange-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-orange-50 text-slate-400 hover:text-orange-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Misión Dinámica Certificada."); }}
          disabled={!canValidate}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${canValidate ? 'bg-slate-950 text-white shadow-orange-500/20' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          <ShieldCheck size={16} />
          {canValidate ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}

