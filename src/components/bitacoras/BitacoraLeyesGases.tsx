"use client";

import React, { useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { 
  Thermometer, Box, Gauge, Info, 
  RefreshCcw, Save, Trash2, Atom,
  TrendingUp, Calculator, Table as TableIcon, Scaling,
  Bot, Volume2, ShieldCheck, Microscope
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { audio } from '@/utils/audioEngine';
import { 
  LineChart, Line, XAxis, YAxis, CartesianGrid, 
  Tooltip, ResponsiveContainer, YAxisProps 
} from 'recharts';

export default function BitacoraLeyesGases({ onValidate }: { onValidate?: () => void }) {
  const { gases, bitacoraData, setBitacora, updateGases, setGasesMission, setGasType } = useSimuladorStore();
  const { 
    missionId = 'sandbox',
    gasType = 'He',
    T = 300, V = 10, P = 1.0, n = 0.406, pTarget = 3.5, isExploded = false 
  } = gases || {};

  // Mensaje para el Dr. Quantum
  const quantumMsg = `Para cumplir la Ley de Gay-Lussac, mantén el volumen en 10 litros y aumenta la temperatura hasta que la presión llegue a 2.0 atmósferas. ¡Cuidado con sobrepasar las 7 atmósferas o la cámara explotará!`;

  // Estado local para los registros (se sincroniza con bitacoraData)
  const registros = bitacoraData?.gases_logs || [];

  const addRegistro = () => {
    audio.playPop();
    const nuevoRegistro = {
      id: crypto.randomUUID(),
      T,
      V,
      n,
      P,
      timestamp: new Date().toLocaleTimeString()
    };
    setBitacora({
      ...bitacoraData,
      gases_logs: [nuevoRegistro, ...registros].slice(0, 10) // Mantener últimos 10
    });
  };

  const clearRegistros = () => {
    setBitacora({
      ...bitacoraData,
      gases_logs: []
    });
  };

  // Historial para la gráfica (se mantiene en memoria del componente)
  const [history, setHistory] = useState<{time: number, p: number}[]>([]);
  
  React.useEffect(() => {
    if (isExploded) return;
    const interval = setInterval(() => {
      setHistory(prev => [...prev, { time: Date.now(), p: P }].slice(-20));
    }, 500);
    return () => clearInterval(interval);
  }, [P, isExploded]);

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit']">

      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-[#219EBC]/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-cyan-400 animate-ping" />
             <span className="text-[10px] font-black text-cyan-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Informe de Presión Crítica</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones técnicas sobre la manipulación de la energía cinética molecular.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-[#219EBC] to-[#00509d] hover:from-[#8ECAE6] hover:to-[#219EBC] rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-[#219EBC]/20"
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
               className="w-1 bg-cyan-400 rounded-full"
             />
           ))}
        </div>
      </div>

      {/* REGISTRO DE HALLAZGOS EN TIEMPO REAL */}
      <div className="bg-white/5 rounded-[2rem] border border-white/10 p-6 overflow-hidden relative">
         <div className="flex items-center gap-2 mb-4">
            <Microscope size={14} className="text-[#219EBC]" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Volumen Constante */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(V - 10) < 0.1 ? 'bg-green-500/10 border-green-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(V - 10) < 0.1 ? 'text-green-400' : 'text-red-400'}`}>
                     Ley de Gay-Lussac (V)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {Math.abs(V - 10) < 0.1 ? '✓ Volumen Constante' : '❌ Volumen fuera de Ley'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${Math.abs(V - 10) < 0.1 ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-red-400'}`} />
            </div>

            {/* Hallazgo: Presión Crítica */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${P < 5 ? 'bg-green-500/10 border-green-500/30' : P < 7 ? 'bg-yellow-500/10 border-yellow-500/30' : 'bg-red-500/10 border-red-500/30'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${P < 5 ? 'text-green-400' : P < 7 ? 'text-yellow-400' : 'text-red-400'}`}>
                     Integridad de Cámara (P)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {P < 5 ? '✓ Presión Segura' : P < 7 ? '⚠ Riesgo de Ruptura' : '❌ FALLA ESTRUCTURAL'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${P < 5 ? 'bg-green-400' : P < 7 ? 'bg-yellow-400 shadow-[0_0_10px_rgba(234,179,8,0.5)]' : 'bg-red-400'}`} />
            </div>

            {/* Hallazgo: Meta de Presión */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${Math.abs(P - pTarget) < 0.05 ? 'bg-green-500/10 border-green-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${Math.abs(P - pTarget) < 0.05 ? 'text-green-400' : 'text-slate-500'}`}>
                     Objetivo de Telemetría
                  </span>
                  <span className="text-xs font-bold text-white">
                     {Math.abs(P - pTarget) < 0.05 ? '✓ Punto de Gay-Lussac OK' : '... Buscando 2.0 atm'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${Math.abs(P - pTarget) < 0.05 ? 'bg-green-400 shadow-[0_0_10px_rgba(34,197,94,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* SELECTOR DE GASES (NUEVO) */}
      <div className="p-4 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
        <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest block mb-3">Sustancia en Cámara</span>
        <div className="grid grid-cols-3 gap-2">
          {[
            { id: 'He', name: 'Helio', color: 'bg-cyan-500' },
            { id: 'Ne', name: 'Neón', color: 'bg-orange-500' },
            { id: 'CO2', name: 'CO₂', color: 'bg-slate-500' }
          ].map(g => (
            <button
              key={g.id}
              onClick={() => { setGasType(g.id as any); audio.playClick(); }}
              className={`p-2 rounded-xl border transition-all flex flex-col items-center gap-1 ${
                gasType === g.id 
                  ? 'border-transparent ring-2 ring-offset-1 ring-slate-800 bg-slate-800 text-white shadow-lg' 
                  : 'border-slate-100 bg-slate-50 text-slate-400 hover:bg-slate-100'
              }`}
            >
              <div className={`w-2 h-2 rounded-full ${g.color}`} />
              <span className="text-[10px] font-black">{g.name}</span>
            </button>
          ))}
        </div>
      </div>

      {/* CONSOLA DE PRECISIÓN (Migrada) */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm flex flex-col gap-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-8 h-8 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Gauge size={16} />
          </div>
          <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Inyección de Variables</h3>
        </div>

        {/* Control T */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-orange-500">
              <Thermometer size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Temperatura</span>
            </div>
            <span className="text-[10px] font-black text-orange-600 bg-orange-50 px-2 py-1 rounded-md">{T} K</span>
          </div>
          <input 
            type="range" min="200" max="600" step="1" 
            value={T} 
            disabled={isExploded || missionId === 'boyle' || missionId === 'avogadro'}
            onChange={(e) => {
              updateGases(parseInt(e.target.value), V);
              if (parseInt(e.target.value) % 10 === 0) audio.playPop();
            }}
            className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-orange-500 ${
              (missionId === 'boyle' || missionId === 'avogadro') ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-slate-100'
            }`} 
          />
        </div>

        {/* Control V */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-cyan-500">
              <Scaling size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Volumen</span>
            </div>
            <span className="text-[10px] font-black text-cyan-600 bg-cyan-50 px-2 py-1 rounded-md">{V.toFixed(1)} L</span>
          </div>
          <input 
            type="range" min="2" max="10" step="0.1" 
            value={V} 
            disabled={isExploded || missionId === 'gaylussac' || missionId === 'avogadro'}
            onChange={(e) => {
              updateGases(T, parseFloat(e.target.value));
              audio.playPop();
            }}
            className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-cyan-500 ${
              (missionId === 'gaylussac' || missionId === 'avogadro') ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-slate-100'
            }`}
          />
        </div>

        {/* Control n */}
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-2 text-indigo-500">
              <Atom size={14} />
              <span className="text-[10px] font-black uppercase tracking-widest">Sustancia (n)</span>
            </div>
            <span className="text-[10px] font-black text-indigo-600 bg-indigo-50 px-2 py-1 rounded-md">{n.toFixed(3)} mol</span>
          </div>
          <input 
            type="range" min="0.1" max="1.0" step="0.001" 
            value={n} 
            disabled={isExploded || missionId === 'boyle' || missionId === 'charles' || missionId === 'gaylussac'}
            onChange={(e) => {
              updateGases(T, V, parseFloat(e.target.value));
              audio.playPop();
            }}
            className={`w-full h-1.5 rounded-full appearance-none cursor-pointer accent-indigo-500 ${
              (missionId === 'boyle' || missionId === 'charles' || missionId === 'gaylussac') ? 'bg-slate-200 opacity-50 cursor-not-allowed' : 'bg-slate-100'
            }`}
          />
        </div>

        {/* MONITOR DE TENDENCIAS (NUEVO) */}
        <div className="h-32 w-full bg-slate-50 rounded-2xl border border-slate-100 p-2 overflow-hidden">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={history}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
              <YAxis domain={[0, 8]} hide />
              <Tooltip 
                content={({ active, payload }) => {
                  if (active && payload && payload.length) {
                    return (
                      <div className="bg-[#023047] p-2 rounded-lg border border-white/10 shadow-xl">
                        <p className="text-[10px] font-black text-cyan-400">{payload[0].value} atm</p>
                      </div>
                    );
                  }
                  return null;
                }}
              />
              <Line 
                type="monotone" 
                dataKey="p" 
                stroke="#219EBC" 
                strokeWidth={3} 
                dot={false} 
                isAnimationActive={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </div>
      
      {/* SECCIÓN DE CAPTURA ORIGINAL */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2rem] shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-xl bg-[#219EBC]/10 flex items-center justify-center text-[#219EBC]">
            <Save size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Registros de Telemetría</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Captura los estados del sistema para análisis</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 mb-6">
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="text-[8px] font-black text-slate-400 uppercase block">Temp. Actual</span>
             <span className="text-sm font-black text-[#023047]">{T} K</span>
          </div>
          <div className="p-3 bg-slate-50 rounded-2xl border border-slate-100">
             <span className="text-[8px] font-black text-slate-400 uppercase block">Presión Actual</span>
             <span className="text-sm font-black text-[#219EBC]">{P.toFixed(3)} atm</span>
          </div>
        </div>

        <button 
          onClick={addRegistro}
          disabled={isExploded}
          className="w-full py-4 bg-[#023047] hover:bg-[#054a6d] text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50 mb-2"
        >
          <TableIcon size={14} /> Capturar Punto Experimental
        </button>

        <button 
          onClick={() => {
            if (onValidate) onValidate();
            else {
              const diff = Math.abs(P - pTarget);
              if (diff < 0.05) {
                audio.playSuccess();
                alert(`¡Excelente! Has estabilizado el sistema en ${P.toFixed(2)} atm.`);
              } else {
                audio.playError();
                alert(`Aún no alcanzas el objetivo. Diferencia: ${diff.toFixed(2)} atm.`);
              }
            }
          }}
          disabled={isExploded || missionId === 'sandbox'}
          className="w-full py-4 bg-cyan-500 hover:bg-cyan-600 text-white font-black rounded-2xl shadow-xl transition-all active:scale-95 uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 disabled:opacity-50"
        >
          <Gauge size={14} /> Validar Objetivo
        </button>
      </div>

      {/* TABLA DE DATOS */}
      <div className="p-6 bg-[#023047] rounded-[2rem] shadow-xl text-white relative overflow-hidden">
        <div className="absolute top-0 right-0 p-6 opacity-5">
           < TrendingUp size={80} />
        </div>
        
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
            <span className="text-[10px] font-black uppercase tracking-[0.2em] text-cyan-200">Data Logger v2.0</span>
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
                Sin datos registrados.<br/>Captura puntos para validar la ley PV=nRT.
              </p>
            </div>
          ) : (
            registros.map((reg: any, i: number) => (
              <motion.div 
                initial={{ x: -20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                key={reg.id} 
                className="grid grid-cols-4 gap-2 p-3 bg-white/5 rounded-xl border border-white/5 items-center"
              >
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-cyan-400 uppercase tracking-tighter">T (K)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.T}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-[#FB8500] uppercase tracking-tighter">V (L)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.V}</span>
                </div>
                <div className="flex flex-col">
                   <span className="text-[7px] font-black text-indigo-400 uppercase tracking-tighter">n (mol)</span>
                   <span className="text-[11px] font-black tabular-nums">{reg.n}</span>
                </div>
                <div className="flex flex-col items-end">
                   <span className="text-[7px] font-black text-white/40 uppercase tracking-tighter">P (atm)</span>
                   <span className="text-[11px] font-black tabular-nums text-cyan-400">{reg.P}</span>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      {/* ANÁLISIS TEÓRICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2rem]">
         <div className="flex items-center gap-3 mb-4">
           <Calculator size={18} className="text-[#023047]" />
           <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Verificación Científica</span>
         </div>
         <p className="text-[11px] font-bold text-slate-500 leading-tight mb-4 italic">
           Para cualquier punto capturado, el cociente (P·V)/(n·T) debería aproximarse a la Constante Universal de los Gases (R ≈ 0.08206).
         </p>
         <div className="py-3 px-4 bg-slate-50 rounded-xl border border-slate-100 flex items-center justify-between">
            <span className="text-[9px] font-black text-slate-400 uppercase">Valor de R calculado:</span>
            <span className="text-xs font-black text-[#023047]">
              {((P * V) / (n * T)).toFixed(5)}
            </span>
         </div>
      </div>

    </div>
  );
}
