"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Crosshair, Move, Thermometer
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { InlineMath, BlockMath } from 'react-katex';

export default function BitacoraTiroParabolico() {
  const { tiro1, setTiro1, ejecutarDisparoF1, generarSemillaF1 } = useSimuladorStore();
  const { angulo, velocidad, disparando, targetX, escenario, resultado, obsX, obsY } = tiro1;
  const objetivoAlcanzado = resultado === 'exito';

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `Ajusta el ángulo y la velocidad inicial para alcanzar el objetivo. Recuerda que para obtener el alcance máximo en terreno nivelado, el ángulo óptimo es de 45 grados. No olvides considerar la gravedad del escenario seleccionado; en Júpiter, el proyectil caerá mucho más rápido que en la Luna.`;

  const handleReset = () => {
    generarSemillaF1();
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = objetivoAlcanzado && wordCount >= 30;

  // Escenarios
  const scenarios = [
    { id: 'tierra', label: 'Tierra', g: 9.81 },
    { id: 'luna', label: 'Luna', g: 1.62 },
    { id: 'marte', label: 'Marte', g: 3.71 },
    { id: 'jupiter', label: 'Júpiter', g: 24.79 }
  ];
  const currentG = scenarios.find(s => s.id === escenario)?.g || 9.81;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-sky-500/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-sky-400 animate-ping" />
             <span className="text-[10px] font-black text-sky-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Auditoría Balística</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la compensación de trayectoria y la influencia de la gravedad planetaria.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-sky-600 to-sky-800 hover:from-sky-500 hover:to-sky-700 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-sky-600/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Táctico
          </button>
        </div>

        <div className="flex gap-1 mt-4 justify-center opacity-30">
           {[...Array(12)].map((_, i) => (
             <motion.div 
               key={i}
               animate={{ height: [4, 12, 4] }}
               transition={{ duration: 1, repeat: Infinity, delay: i * 0.1 }}
               className="w-1 bg-sky-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Activity size={14} className="text-sky-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Proyectil */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${disparando ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${disparando ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Cinemática 2D Activa
                  </span>
                  <span className="text-xs font-bold text-white">
                     {disparando ? '✓ Proyectil en Vuelo (Telemétrico)' : '... Esperando Lanzamiento'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${disparando ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Gravedad */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${escenario !== 'tierra' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${escenario !== 'tierra' ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Compensación Gravitatoria
                  </span>
                  <span className="text-xs font-bold text-white">
                     {escenario !== 'tierra' ? `✓ Entorno: ${escenario.toUpperCase()} (g=${currentG})` : '... Usando Gravedad Estándar'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${escenario !== 'tierra' ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Impacto */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${objetivoAlcanzado ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${objetivoAlcanzado ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Certificación de Impacto
                  </span>
                  <span className="text-xs font-bold text-white">
                     {objetivoAlcanzado ? '✓ Objetivo Eliminado' : '... Buscando Blanco'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${objetivoAlcanzado ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* BITÁCORA DE IMPACTOS (TABLE) */}
      <div className="bg-white border border-slate-200 rounded-[2.5rem] shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
          <div className="flex items-center gap-3">
             <Table size={16} className="text-sky-600" />
             <h4 className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Historial Telemétrico</h4>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Últimos 5 disparos</span>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50">
                <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">θ (°)</th>
                <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">V₀ (m/s)</th>
                <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest">Distancia</th>
                <th className="px-6 py-3 text-[8px] font-black text-slate-400 uppercase tracking-widest text-right">Estatus</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {useSimuladorStore.getState().bitacoraData?.tiro_logs?.map((log: any) => (
                <motion.tr initial={{ opacity: 0 }} animate={{ opacity: 1 }} key={log.id} className="hover:bg-slate-50 transition-colors">
                  <td className="px-6 py-3 text-[10px] font-bold text-slate-600">{log.angulo}°</td>
                  <td className="px-6 py-3 text-[10px] font-bold text-slate-600">{log.velocidad}</td>
                  <td className="px-6 py-3 text-[10px] font-bold text-slate-600 font-mono">{log.distancia}m</td>
                  <td className="px-6 py-3 text-right">
                    <span className={`px-2 py-1 rounded-lg text-[8px] font-black uppercase tracking-widest ${
                      log.resultado === 'IMPACTO' ? 'bg-emerald-500/10 text-emerald-600' : 
                      log.resultado === 'MURO' ? 'bg-amber-500/10 text-amber-600' : 
                      'bg-rose-500/10 text-rose-600'
                    }`}>
                      {log.resultado}
                    </span>
                  </td>
                </motion.tr>
              ))}
              {(!useSimuladorStore.getState().bitacoraData?.tiro_logs || useSimuladorStore.getState().bitacoraData?.tiro_logs.length === 0) && (
                <tr>
                  <td colSpan={4} className="px-6 py-8 text-center text-[10px] font-bold text-slate-400 uppercase italic tracking-widest">
                    No hay registros balísticos confirmados
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-sky-500/10 flex items-center justify-center text-sky-500">
            <Crosshair size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Consola Balística</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Ajuste de Trayectoria</p>
          </div>
        </div>

        <div className="space-y-4">
           <div>
              <div className="flex justify-between mb-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase italic">Ángulo (θ)</span>
                 <span className="text-[9px] font-black text-sky-600 font-mono">{angulo}°</span>
              </div>
              <input 
                type="range" min="0" max="90" step="1" value={angulo}
                disabled={disparando}
                onChange={e => setTiro1({ angulo: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
           </div>
           <div>
              <div className="flex justify-between mb-1">
                 <span className="text-[9px] font-black text-slate-400 uppercase italic">Velocidad (V₀)</span>
                 <span className="text-[9px] font-black text-sky-600 font-mono">{velocidad} m/s</span>
              </div>
              <input 
                type="range" min="10" max="100" step="1" value={velocidad}
                disabled={disparando}
                onChange={e => setTiro1({ velocidad: parseInt(e.target.value) })}
                className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
           </div>
        </div>

        <button 
          onClick={() => { ejecutarDisparoF1(); audio.playPop(); }}
          disabled={disparando}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${disparando ? 'bg-slate-100 text-slate-400' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {disparando ? 'Proyectil en Vuelo...' : 'Lanzar Pulso'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Trayectoria</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica cómo afecta el ángulo de lanzamiento al alcance horizontal y por qué la gravedad planetaria modifica el tiempo de vuelo..."
             rows={4}
             className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] font-medium text-slate-600 focus:outline-none focus:border-sky-500 italic"
          />
      </div>

      {/* BOTONES DE ACCIÓN FINALES */}
      <div className="flex gap-3">
        <button 
          onClick={handleReset}
          className="w-14 h-14 bg-slate-100 hover:bg-sky-50 text-slate-400 hover:text-sky-500 rounded-2xl flex items-center justify-center transition-all active:scale-95 border border-slate-200"
        >
          <Trash2 size={20} />
        </button>
        <button 
          onClick={() => { audio.playSuccess(); alert("Misión Balística Certificada."); }}
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
