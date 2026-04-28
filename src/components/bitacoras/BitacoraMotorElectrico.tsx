"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Target, Activity, Zap, CheckCircle2, Star, Table, Info, 
  Trash2, ShieldCheck, Calculator, BookOpen,
  Binary, Compass, Bot, Volume2, Shapes, Gauge, Power, Factory, Workflow
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';

export default function BitacoraMotorElectrico() {
  const { motor10, setMotor10 } = useSimuladorStore();
  const { voltaje, carga, rpm, encendido, espiras, resultado } = motor10;

  const [conclusionText, setConclusionText] = useState('');
  const quantumMsg = `El motor eléctrico es el corazón de la industria moderna. Al cerrar el circuito, la corriente fluye por las espiras creando un campo magnético que interactúa con los imanes permanentes, generando torque.`;

  const handleReset = () => {
    setMotor10({ voltaje: 12, carga: 5, rpm: 0, encendido: false, espiras: 10, resultado: null });
    setConclusionText('');
    audio.playPop();
  };

  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const canValidate = encendido && wordCount >= 30;

  // Hallazgos en vivo
  const currentRPM = encendido ? Math.max(0, Math.round((voltaje * 100 * (espiras/10)) / (carga * 0.5))) : 0;
  const torque = (espiras * 0.1 * voltaje) / (carga || 1);

  const checkRPM = currentRPM > 1000;
  const checkTorque = torque > 0.5;
  const checkEfficiency = encendido && carga < 10;

  return (
    <div className="space-y-6 animate-in fade-in duration-500 font-['Outfit'] pb-20">
      
      {/* PANEL ASISTENTE DE VOZ DR. QUANTUM */}
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2.5rem] shadow-2xl border border-orange-400/30 relative overflow-hidden group">
        <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
           <Bot size={60} className="text-white" />
        </div>
        
        <div className="relative z-10">
          <div className="flex items-center gap-3 mb-4">
             <div className="w-2 h-2 rounded-full bg-orange-400 animate-ping" />
             <span className="text-[10px] font-black text-orange-400/80 uppercase tracking-[0.2em]">Asistente de Voz Activo</span>
          </div>
          
          <h4 className="text-white font-black text-lg leading-tight mb-2">Ingeniería de Motores</h4>
          <p className="text-[11px] text-slate-400 font-medium mb-6 leading-relaxed">
            Presiona el botón para recibir instrucciones sobre la fuerza de Lorentz y la optimización del torque en motores DC.
          </p>
          
          <button 
            onClick={() => audio.playNotification()}
            className="w-full py-4 bg-gradient-to-r from-orange-500 to-orange-700 hover:from-orange-400 hover:to-orange-600 rounded-2xl text-white font-black text-[11px] uppercase tracking-[0.15em] flex items-center justify-center gap-3 transition-all active:scale-95 shadow-lg shadow-orange-500/20"
          >
            <Volume2 size={18} fill="currentColor" className="text-white" />
            Solicitar Informe Técnico
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
            <Factory size={14} className="text-orange-400" />
            <h4 className="text-[10px] font-black text-slate-300 uppercase tracking-[0.2em]">Registro de Hallazgos</h4>
         </div>

         <div className="space-y-4">
            {/* Hallazgo: RPM */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkRPM ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkRPM ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Velocidad Angular (ω)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {encendido ? `✓ ${currentRPM} RPM Alcanzadas` : '... Motor en Reposo'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkRPM ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Torque */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${checkTorque ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${checkTorque ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Par Motor (Torque τ)
                  </span>
                  <span className="text-xs font-bold text-white">
                     {checkTorque ? `✓ τ = ${torque.toFixed(2)} N·m Detectado` : '... Incrementando Voltaje'}
                  </span>
               </div>
               <div className={`w-2 h-2 rounded-full ${checkTorque ? 'bg-emerald-400' : 'bg-slate-600'}`} />
            </div>

            {/* Hallazgo: Bobinado */}
            <div className={`p-4 rounded-2xl border transition-all flex items-center justify-between ${resultado === 'exito' ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
               <div className="flex flex-col">
                  <span className={`text-[8px] font-black uppercase tracking-widest ${espiras > 20 ? 'text-emerald-400' : 'text-slate-500'}`}>
                     Densidad de Bobinado
                  </span>
                  <span className="text-xs font-bold text-white">
                     {resultado === 'exito' ? '✓ Torque Industrial Verificado' : '... Analizando Velocidad'}
                  </span>
               </div>
                <div className={`w-2 h-2 rounded-full ${resultado === 'exito' ? 'bg-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-slate-600'}`} />
            </div>
         </div>
      </div>

      {/* MONITOR ELECTROMECÁNICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500">
            <Calculator size={20} />
          </div>
          <div>
            <h3 className="text-sm font-black text-[#023047] uppercase tracking-widest">Calculadora de Par</h3>
            <p className="text-[10px] text-slate-400 font-bold uppercase tracking-wider">Telemetría de Eficiencia</p>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Consumo (V)</span>
              <span className="text-sm font-black text-[#023047] font-mono">{voltaje.toFixed(1)} V</span>
           </div>
           <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1 italic">Rendimiento</span>
              <span className={`text-sm font-black font-mono ${encendido ? 'text-orange-600' : 'text-slate-400'}`}>{encendido ? (currentRPM / 20).toFixed(1) : '0.0'}%</span>
           </div>
        </div>

        <button 
          onClick={() => { setMotor10({ encendido: !encendido }); audio.playPop(); }}
          className={`w-full py-3 rounded-xl text-[9px] font-black uppercase tracking-widest transition-all ${encendido ? 'bg-red-500 text-white shadow-red-500/20' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}
        >
          {encendido ? 'Apagar Motor' : 'Encender Sistema'}
        </button>
      </div>

      {/* ENSAYO CRÍTICO */}
      <div className="p-6 bg-white border border-slate-200 rounded-[2.5rem] shadow-sm space-y-4">
          <div className="flex justify-between items-center">
             <div className="flex items-center gap-2">
                <BookOpen size={14} className="text-[#023047]" />
                <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis de Inducción</span>
             </div>
             <span className={`text-[8px] font-black px-2 py-0.5 rounded-full ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-400'}`}>{wordCount}/30</span>
          </div>
          <textarea 
             value={conclusionText} onChange={e => setConclusionText(e.target.value)}
             placeholder="Explica cómo influye el número de espiras en el torque generado por el motor y qué sucede con la velocidad cuando aumentas la carga mecánica..."
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
          onClick={() => { audio.playSuccess(); alert("Perfil Electromecánico Certificado."); }}
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
