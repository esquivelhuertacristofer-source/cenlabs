"use client";

import React, { useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Target, Activity, Zap, CheckCircle2, AlertCircle } from 'lucide-react';
import { motion } from 'framer-motion';

export default function BitacoraCuadraticas() {
  const { cuadraticas, setCoefsM1, validarM1, generarSemillaM1 } = useSimuladorStore();
  const { a, b, c, target, status } = cuadraticas;

  useEffect(() => {
    // Generar semilla si no existe o si los coeficientes son los iniciales por defecto inseguros
    if (target.a === 2 && target.b === -2 && target.c === -3) {
        generarSemillaM1();
    }
  }, []);

  // Matemáticas de Telemetría
  const delta = b * b - 4 * a * c;
  const vx = -b / (2 * a || 0.001); // Evitar división por cero
  const vy = a * vx * vx + b * vx + c;
  
  const x1 = delta >= 0 ? (-b + Math.sqrt(delta)) / (2 * a) : null;
  const x2 = delta >= 0 ? (-b - Math.sqrt(delta)) / (2 * a) : null;

  return (
    <div className="space-y-6 animate-in fade-in duration-500">
      <div className="bg-slate-900 rounded-2xl p-5 text-white shadow-xl border border-white/5 relative overflow-hidden group">
        <div className="flex items-center gap-2 mb-3 text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
          <Target size={12} /> Objetivo de Trayectoria
        </div>
        <p className="text-xs font-bold text-slate-300 mb-4 leading-relaxed">
          Ajusta los coeficientes para que tu parábola coincida con la línea punteada.
        </p>
        <div className="bg-black/40 rounded-xl p-3 border border-white/10 font-mono text-center">
          <span className="text-rose-400 font-bold italic">f(x) = {target.a.toFixed(1)}x² {target.b >= 0 ? '+' : ''}{target.b}x {target.c >= 0 ? '+' : ''}{target.c}</span>
        </div>
      </div>

      <div className="space-y-6 bg-white p-5 rounded-3xl border border-slate-100 shadow-sm">
        <h4 className="text-[11px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
          <Activity size={14} className="text-rose-500" /> Panel de Coeficientes
        </h4>

        {/* Slider A */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Coeficiente a (Apertura)</span>
            <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">{a.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="-5" max="5" step="0.1" value={a}
            onChange={(e) => setCoefsM1(parseFloat(e.target.value), b, c)}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
          <div className="flex justify-between text-[8px] font-bold text-slate-300 uppercase px-1">
            <span>Muy Cerrada (-)</span>
            <span>Lineal (0)</span>
            <span>Muy Cerrada (+)</span>
          </div>
        </div>

        {/* Slider B */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Coeficiente b (Desplazamiento)</span>
            <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">{b.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="-10" max="10" step="0.5" value={b}
            onChange={(e) => setCoefsM1(a, parseFloat(e.target.value), c)}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>

        {/* Slider C */}
        <div className="space-y-3">
          <div className="flex justify-between items-center px-1">
            <span className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Coeficiente c (Intersección Y)</span>
            <span className="text-xs font-black text-rose-500 bg-rose-50 px-2 py-0.5 rounded-lg">{c.toFixed(1)}</span>
          </div>
          <input 
            type="range" min="-10" max="10" step="0.5" value={c}
            onChange={(e) => setCoefsM1(a, b, parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-100 rounded-lg appearance-none cursor-pointer accent-rose-500"
          />
        </div>
      </div>

      {/* Telemetría Avanzada */}
      <div className="bg-slate-50 rounded-3xl p-5 border border-slate-100 space-y-4">
        <h4 className="text-[10px] font-black uppercase text-slate-400 tracking-widest flex items-center gap-2">
           <Zap size={12} /> Telemetría Matemática
        </h4>
        
        <div className="grid grid-cols-2 gap-3">
            <div className="p-3 bg-white rounded-xl border border-slate-100 shrink-0">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Discriminante (Δ)</span>
                <span className={`text-xs font-bold ${delta < 0 ? 'text-red-500' : 'text-slate-700'}`}>{delta.toFixed(2)}</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 shrink-0">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Vértice (Vx, Vy)</span>
                <span className="text-[10px] font-bold text-slate-700">({vx.toFixed(1)}, {vy.toFixed(1)})</span>
            </div>
            <div className="p-3 bg-white rounded-xl border border-slate-100 col-span-2">
                <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">Raíces (Cruce X)</span>
                <span className="text-[10px] font-bold text-slate-700">
                    {delta >= 0 ? `x1=${x1?.toFixed(2)}, x2=${x2?.toFixed(2)}` : 'Raíces Imaginarias'}
                </span>
            </div>
        </div>

        <button 
          onClick={validarM1}
          className={`w-full py-4 rounded-2xl font-black text-[11px] uppercase tracking-widest transition-all flex items-center justify-center gap-2 ${
            status === 'success' 
            ? 'bg-green-500 text-white shadow-lg shadow-green-200' 
            : status === 'error'
            ? 'bg-red-500 text-white'
            : 'bg-rose-500 text-white shadow-lg shadow-rose-200 hover:scale-[1.02] active:scale-95'
          }`}
        >
          {status === 'success' ? <><CheckCircle2 size={16} /> ¡Ecuación Validada!</> : status === 'error' ? <><AlertCircle size={16} /> Error en Trayectoria</> : 'Validar Ecuación'}
        </button>
      </div>
    </div>
  );
}
