"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, ChevronDown, ChevronUp, Calculator, BookOpen,
  Binary, Compass, Layers, Sigma, Bot, Volume2, Microscope
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { getDomainRangeInfo } from '@/utils/mathEngine';

export default function BitacoraCuadraticas({ onValidate }: { onValidate?: () => void }) {
  const { cuadraticas, validarM1, generarSemillaM1, resetM1, setDeltaVerified, setVertexVerified, bitacoraData, setBitacora } = useSimuladorStore();
  const { a, b, c, target, status } = cuadraticas;
  const hallazgos = bitacoraData?.cuadraticas_points || [];

  const [deltaInput, setDeltaInput] = useState('');
  const [deltaFeedback, setDeltaFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [vertexInput, setVertexInput] = useState('');
  const [vertexFeedback, setVertexFeedback] = useState<'idle' | 'correct' | 'wrong'>('idle');
  const [conclusionText, setConclusionText] = useState('');

  const quantumMsg = `Para interceptar la trayectoria objetivo, ajusta los coeficientes a, b y c. El discriminante (b² - 4ac) te dirá si existen raíces reales. ¡Asegúrate de que el vértice coincida con el punto crítico de la parábola!`;

  const addPoint = () => {
    audio.playPop();
    const x = vx;
    const y = a * x * x + b * x + c;
    const nuevoPunto = {
      id: crypto.randomUUID(),
      x: x.toFixed(2),
      y: y.toFixed(2),
      timestamp: new Date().toLocaleTimeString()
    };
    setBitacora({
      ...bitacoraData,
      cuadraticas_points: [nuevoPunto, ...hallazgos].slice(0, 10)
    });
  };

  const clearPoints = () => {
    setBitacora({
      ...bitacoraData,
      cuadraticas_points: []
    });
  };

  useEffect(() => {
    if (target.a === 2 && target.b === -2 && target.c === -3) {
      generarSemillaM1();
    }
  }, []);

  const safeA = a || 0.001;
  const delta = b * b - 4 * a * c;
  const vx = -b / (2 * safeA);
  const vy = a * vx * vx + b * vx + c;

  const checkDelta = () => {
    const val = parseFloat(deltaInput);
    const ok = !isNaN(val) && Math.abs(val - delta) < 0.15;
    setDeltaFeedback(ok ? 'correct' : 'wrong');
    setDeltaVerified(ok);
    if (ok) audio.playSuccess(); else audio.playError();
  };

  const checkVertex = () => {
    const val = parseFloat(vertexInput);
    const ok = !isNaN(val) && Math.abs(val - vx) < 0.15;
    setVertexFeedback(ok ? 'correct' : 'wrong');
    setVertexVerified(ok);
    if (ok) audio.playSuccess(); else audio.playError();
  };

  const handleReset = () => {
    resetM1();
    generarSemillaM1();
    setDeltaInput(''); setDeltaFeedback('idle');
    setVertexInput(''); setVertexFeedback('idle');
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = (cuadraticas.deltaVerified ?? false) && (cuadraticas.vertexVerified ?? false) && (wordCount >= 30);

  // Checks de Hallazgos en Vivo
  const checkA = Math.abs(a - target.a) < 0.1;
  const checkB = Math.abs(b - target.b) < 0.1;
  const checkC = Math.abs(c - target.c) < 0.1;

  const handleCertify = () => {
    if (onValidate) onValidate();
    else {
      const ok = validarM1();
      if (ok) audio.playSuccess(); else audio.playError();
    }
  };

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-rose-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-rose-400 animate-ping" />
             <span className="text-[10px] font-black text-rose-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Análisis de Trayectoria</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Solicita instrucciones para sincronizar los coeficientes algebraicos con el objetivo balístico.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-rose-600 to-rose-800 hover:from-rose-500 hover:to-rose-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-rose-600/20"
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
               className="w-1 bg-rose-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-rose-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Parámetros */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkA && checkB && checkC ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkA && checkB && checkC ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Sincronía de Parámetros
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkA && checkB && checkC ? '✓ Trayectoria Sincronizada' : '... Ajustando Coeficientes'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkA && checkB && checkC ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Discriminante */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${cuadraticas.deltaVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${cuadraticas.deltaVerified ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Validación de Discriminante
                  </span>
                  <span className="text-xs font-bold text-white">
                     {cuadraticas.deltaVerified ? '✓ Cálculo de Delta OK' : '... Pendiente de Cálculo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${cuadraticas.deltaVerified ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Vértice */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${cuadraticas.vertexVerified ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${cuadraticas.vertexVerified ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Localización de Vértice
                  </span>
                  <span className="text-xs font-bold text-white">
                     {cuadraticas.vertexVerified ? '✓ Punto Crítico Validado' : '... Pendiente de Localización'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${cuadraticas.vertexVerified ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* SECCIÓN DE ANÁLISIS Y CÁLCULO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-6">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-rose-500/10 flex items-center justify-center text-rose-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Consola de Cálculo</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Verifica tus deducciones algebraicas</p>
          </div>
        </div>

        {/* Delta Input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Discriminante (Δ)</span>
            {deltaFeedback === 'correct' && <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Validado</span>}
          </div>
          <div className="flex gap-2">
            <input 
              type="number" value={deltaInput} placeholder="Valor de Δ..."
              onChange={e => { setDeltaInput(e.target.value); setDeltaFeedback('idle'); }}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <button onClick={checkDelta} className="px-4 bg-[#023047] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Check</button>
          </div>
        </div>

        {/* Vertex Input */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">Abscisa h (-b/2a)</span>
            {vertexFeedback === 'correct' && <span className="text-[8px] font-black text-emerald-500 uppercase bg-emerald-50 px-2 py-0.5 rounded-full">Validado</span>}
          </div>
          <div className="flex gap-2">
            <input 
              type="number" value={vertexInput} placeholder="Valor de h..."
              onChange={e => { setVertexInput(e.target.value); setVertexFeedback('idle'); }}
              className="flex-1 bg-slate-50 border border-slate-100 rounded-xl px-4 py-2 text-sm font-black text-slate-900 focus:outline-none focus:border-rose-500"
            />
            <button onClick={checkVertex} className="px-4 bg-[#023047] text-white rounded-xl font-black text-[9px] uppercase tracking-widest">Check</button>
          </div>
        </div>

        <button 
          onClick={addPoint}
          className="w-full py-4 bg-slate-900 hover:bg-slate-800 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2"
        >
          <Sigma size={14} /> Muestrear Punto de Curva
        </button>
      </div>

      {/* TABLA DE PUNTOS EXPERIMENTALES (NUEVA) */}
      <div className="p-6 bg-[#023047] rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-rose-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-200">Algebraic Log v2.0</span>
          </div>
          {hallazgos.length > 0 && (
            <button onClick={clearPoints} className="p-2 hover:bg-white/10 rounded-lg transition-colors text-white/40 hover:text-red-400">
              <Trash2 size={14} />
            </button>
          )}
        </div>

        <div className="space-y-2 max-h-[300px] overflow-y-auto custom-scrollbar pr-2">
          {hallazgos.length === 0 ? (
            <div className="py-10 text-center border-2 border-dashed border-white/10 rounded-2xl">
              <p className="text-[10px] font-bold text-white/30 uppercase tracking-widest leading-loose">
                Sin puntos registrados.<br/>Muestrea la curva para validar la función f(x).
              </p>
            </div>
          ) : (
            hallazgos.map((reg: any) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={reg.id} 
                className="grid grid-cols-3 gap-2 p-3 bg-white/5 rounded-xl border border-white/5 items-center"
              >
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-rose-400 uppercase tracking-tighter">x</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.x}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-rose-400 uppercase tracking-tighter">f(x)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.y}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] font-black text-white/20 uppercase tracking-tighter">Hora</span>
                   <span className="text-[11px] font-black tabular-nums text-rose-300">{reg.timestamp}</span>
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
             placeholder="Describe la relación entre el discriminante y el número de raíces observadas en la trayectoria..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-rose-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-rose-50 text-slate-400 hover:text-rose-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={handleCertify}
          disabled={!canValidate && status !== 'success'}
          className={`flex-1 rounded-2xl font-black text-[10px] uppercase tracking-[0.2em] transition-all flex items-center justify-center gap-3 shadow-xl ${status === 'success' ? 'bg-slate-950 text-white shadow-rose-500/20' : canValidate ? 'bg-[#023047] text-white' : 'bg-slate-200 text-slate-400 cursor-not-allowed'}`}
        >
          {status === 'success' ? <CheckCircle2 size={16} /> : <ShieldCheck size={16} />}
          {status === 'success' ? 'Misión Certificada' : 'Someter Análisis'}
        </button>
      </div>

    </div>
  );
}
