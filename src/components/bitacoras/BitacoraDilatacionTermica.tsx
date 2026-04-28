"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Thermometer, Ruler, Flame
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraDilatacionTermica() {
  const { dilatacion7, setDilatacion7 } = useSimuladorStore();
  const { material, tempIni, tempFin, longitud, resultado } = dilatacion7;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `La dilatación lineal es el resultado macroscópico del aumento en la amplitud de las vibraciones interatómicas. Al calentar el material, los átomos requieren más espacio, lo que elonga la barra proporcionalmente al coeficiente alfa.`;

  const handleReset = () => {
    setDilatacion7({ material: 'hierro', tempIni: 20, tempFin: 20, longitud: 1, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const deltaT = tempFin - tempIni;
  const canValidate = deltaT > 20 && wordCount >= 30;

  // Hallazgos en vivo
  const checkMaterial = material !== 'hierro';
  const checkTemp = deltaT > 50;
  const checkExpansion = deltaT > 0;

  // Cálculos
  const COEFICIENTES: Record<string, number> = { hierro: 11.7, aluminio: 23.1, cobre: 17.0, vidrio: 3.3 };
  const alpha = COEFICIENTES[material] || 11.7;
  const deltaL_mm = alpha * 1e-6 * longitud * deltaT * 1000;

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
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Termodinámica de Sólidos</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la expansión térmica de materiales y el coeficiente de dilatación lineal.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Alfa
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
            <Thermometer size={14} className="text-orange-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: Gradiente */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkExpansion ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkExpansion ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Gradiente Térmico (ΔT)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkExpansion ? `✓ Calor Aplicado: +${deltaT.toFixed(1)}°C` : '... Calentando Probeta'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkExpansion ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Material */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkMaterial ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkMaterial ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Análisis de Composición
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkMaterial ? `✓ Espécimen: ${material.toUpperCase()}` : '... Usando Hierro Estándar'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkMaterial ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Elongación */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${deltaL_mm > 0.5 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Telemetría Micrométrica
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Estabilidad Dimensional Validada' : '... Analizando Expansión'}
                  </span>
               </div>
                <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR TERMOMÉTRICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora Térmica</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Expansión Lineal de Sólidos</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Coeficiente (α)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{alpha}x10⁻⁶</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Elongación Total</span>
              <span className={`text-sm font-black font-mono ${deltaL_mm > 0 ? 'text-orange-600' : 'text-slate-400'}`}>{deltaL_mm.toFixed(4)} mm</span>
           </div>
        </div>

        <button 
          onClick={() => { setDilatacion7({ tempFin: 100 }); audio.playPop(); }}
          disabled={tempFin === 100}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${tempFin === 100 ? 'bg-slate-100 text-slate-400' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {tempFin === 100 ? 'Saturación Térmica' : 'Inyectar Vapor (100°C)'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Red Cristalina</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica qué es el coeficiente de dilatación lineal alfa y cómo afecta la temperatura a la distancia promedio entre los átomos de un sólido..."
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
          onClick={() => { audio.playSuccess(); alert("Misión Térmica Certificada."); }}
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
