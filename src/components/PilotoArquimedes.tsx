"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Waves, 
  Weight, 
  Droplets, 
  ArrowDown, 
  ArrowUp,
  Settings,
  Activity,
  Zap,
  Info,
  Thermometer,
  CloudRain
} from 'lucide-react';
import { audio } from '@/utils/audioEngine';

export default function PilotoArquimedes() {
  const { arquimedes6, setArquimedes6, setAsistente } = useSimuladorStore();
  const { 
    radio = 0.5, 
    densidadCuerpo = 800, 
    densidadLiquido = 1000, 
    sumergido = 0, 
    resultado: status = 'idle',
    isRunning = false
  } = arquimedes6 || {};

  const [volumen, setVolumen] = useState(0);
  const [masa, setMasa] = useState(0);
  const [peso, setPeso] = useState(0);
  const [empuje, setEmpuje] = useState(0);
  const [aceleracion, setAceleracion] = useState(0);
  const [y, setY] = useState(0);

  useEffect(() => {
    const V = (4/3) * Math.PI * Math.pow(radio, 3);
    const M = V * densidadCuerpo;
    const P = M * 9.81;
    setVolumen(V);
    setMasa(M);
    setPeso(P);
  }, [radio, densidadCuerpo]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de hidrostática. Vamos a validar el principio de Arquímedes observando cómo el empuje del fluido afecta la inmersión del cuerpo.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, []);

  useEffect(() => {
    if (isRunning) {
      const interval = setInterval(() => {
        setArquimedes6({ sumergido: Math.min(1, sumergido + 0.01) });
      }, 50);
      return () => clearInterval(interval);
    }
  }, [isRunning, sumergido, setArquimedes6]);

  const toggleSim = () => {
    const isNowRunning = !isRunning;
    setArquimedes6({ isRunning: isNowRunning });
    audio?.playPop();
    if (isNowRunning) {
      audio?.playNotification();
      setAsistente({ text: "Sistemas nominales. Iniciando inmersión. Monitorea la curva de empuje en tu bitácora.", pose: "happy" });
    } else {
      setAsistente({ text: "Inmersión pausada. Analiza los datos recolectados hasta el momento.", pose: "thinking" });
      
      // Registro automático al pausar o terminar (Estilo Química)
      const g = 9.81;
      const P = peso;
      const E = calculatedEmpuje;
      const PA = Math.max(0, P - E);
      
      const nuevoLog = {
        id: crypto.randomUUID(),
        fluido: 'AGUA',
        vol: (sumergido * 100).toFixed(0) + '%',
        w_real: P.toFixed(3),
        w_aparente: PA.toFixed(3),
        empuje: E.toFixed(3),
        timestamp: new Date().toLocaleTimeString()
      };
      
      const logsPrevios = (useSimuladorStore.getState() as any).bitacoraData?.arquimedes_logs || [];
      (useSimuladorStore.getState() as any).setBitacora({
        ...(useSimuladorStore.getState() as any).bitacoraData,
        arquimedes_logs: [nuevoLog, ...logsPrevios].slice(0, 10)
      });
    }
  };

  const calculatedEmpuje = sumergido * peso * 1.2;

  return (
    <div className="relative w-full h-full bg-[#010409] overflow-hidden font-['Outfit'] text-white">
      
      {/* FONDO DINÁMICO DE AGUA */}
      <div className="absolute inset-0 opacity-20 pointer-events-none">
        <div className="absolute bottom-0 w-full h-1/2 bg-blue-500/20 blur-[100px] animate-pulse" />
      </div>

      {/* CHECKLIST HUD (DIAMOND STANDARD) */}
      <div className="absolute top-48 left-1/2 -translate-x-1/2 w-[600px] pointer-events-none z-50">
        <div className="bg-black/40 backdrop-blur-xl border border-white/10 rounded-[2rem] p-8 shadow-2xl">
          <div className="flex items-center justify-between mb-6">
            <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest flex items-center gap-2">
              <Activity size={12} className="animate-pulse" /> Sincronía Hidrostática
            </span>
            <span className="text-[10px] font-black text-white/20 uppercase tracking-[0.3em]">Arquímedes Protocol HUD</span>
          </div>
          
          <div className="grid grid-cols-3 gap-6">
            <div className={`p-5 rounded-2xl border transition-all ${isRunning ? 'bg-blue-500/10 border-blue-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Inmersión</div>
              <div className={`text-sm font-black italic ${isRunning ? 'text-blue-400' : 'text-white/20'}`}>{isRunning ? 'ACTIVA' : 'STANDBY'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${calculatedEmpuje > 0 ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Fuerza E</div>
              <div className={`text-sm font-black italic ${calculatedEmpuje > 0 ? 'text-emerald-400' : 'text-white/20'}`}>{calculatedEmpuje > 0 ? 'DETECTADA' : 'CERO'}</div>
            </div>
            <div className={`p-5 rounded-2xl border transition-all ${sumergido >= 1 ? 'bg-amber-500/10 border-amber-500/30' : 'bg-white/5 border-white/5'}`}>
              <div className="text-[9px] font-black uppercase text-white/40 mb-2">Equilibrio</div>
              <div className={`text-sm font-black italic ${sumergido >= 1 ? 'text-amber-400' : 'text-white/20'}`}>{sumergido >= 1 ? 'ALCANZADO' : 'PROGRESO'}</div>
            </div>
          </div>
        </div>
      </div>

      {/* GIANT DISPLACEMENT HUD (CENTRAL) */}
      <div className="absolute top-[40%] left-1/2 -translate-x-1/2 -translate-y-1/2 flex flex-col items-center pointer-events-none opacity-10">
         <div className="text-[14rem] font-black font-mono leading-none tracking-tighter italic text-white/10">{(sumergido * 100).toFixed(0)}</div>
         <span className="text-xl font-black uppercase tracking-[1.5em] text-white/20">%_volumen_sumergido</span>
      </div>

      {/* CANVAS PRINCIPAL (SIMULACIÓN VISUAL) */}
      <div className="absolute inset-0 flex items-center justify-center pt-20">
        <div className="relative w-80 h-96 bg-white/5 border border-white/10 rounded-b-[4rem] overflow-hidden backdrop-blur-sm">
          {/* Líquido */}
          <motion.div 
            animate={{ height: `${50 + (sumergido * 10)}%` }}
            className="absolute bottom-0 w-full bg-gradient-to-t from-blue-600/40 to-blue-400/30 border-t border-blue-300/30"
          >
            <div className="absolute top-0 w-full h-4 bg-white/10 blur-sm" />
          </motion.div>

          {/* El Cuerpo (Esfera) */}
          <motion.div 
            animate={{ 
              y: isRunning ? 100 : 0,
              scale: radio * 2 
            }}
            className="absolute top-1/4 left-1/2 -translate-x-1/2 w-32 h-32 rounded-full bg-gradient-to-br from-slate-400 to-slate-600 border border-white/20 shadow-2xl flex items-center justify-center z-10"
          >
            <div className="text-white/20"><Weight size={40} /></div>
          </motion.div>
        </div>
      </div>

      {/* HUD SUPERIOR: TELEMETRÍA DINÁMICA */}
      <div className="absolute top-8 inset-x-8 flex justify-between items-start z-20 pointer-events-none">
        <div className="space-y-4">
           <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-blue-500 rounded-2xl flex items-center justify-center shadow-lg shadow-blue-500/30">
                <Waves className="text-white" />
              </div>
              <div>
                <h2 className="text-white font-black text-xl tracking-tighter leading-none">PRINCIPIO DE ARQUÍMEDES</h2>
                <p className="text-blue-400/60 text-[10px] font-black uppercase tracking-[0.3em]">Módulo FIS-04 · Diamond State</p>
              </div>
           </div>
        </div>

        <div className="flex gap-4">
           <HUDCard label="Peso (P)" value={`${peso.toFixed(2)} N`} icon={<Weight size={18} />} color="#E63946" highlight={isRunning} />
           <HUDCard label="Empuje (E)" value={`${calculatedEmpuje.toFixed(2)} N`} icon={<ArrowUp size={18} />} color="#219EBC" highlight={isRunning} />
        </div>
      </div>

      {/* PANEL DE CONTROL INFERIOR */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0A1121]/90 backdrop-blur-3xl rounded-[3rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] flex items-center px-10 py-6 gap-10 z-30 min-w-[800px]">
        
        <div className="flex items-center gap-10 pr-10 border-r border-white/5">
           <div className="flex flex-col min-w-[200px]">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-3">Radio de la Esfera (m)</span>
              <div className="flex items-center gap-6">
                 <input 
                   type="range" min="0.1" max="1" step="0.05" 
                   value={radio} 
                   onChange={(e) => setArquimedes6({ radio: parseFloat(e.target.value) })}
                   className="flex-1 accent-blue-500 h-1.5" 
                 />
                 <span className="text-white font-black text-xl w-12 text-right">{radio}</span>
              </div>
           </div>
        </div>

        <div className="flex items-center gap-10">
           <div className="flex flex-col">
              <span className="text-[10px] font-black text-white/30 uppercase tracking-widest mb-1">Densidad Fluido</span>
              <span className="text-blue-400 font-black text-xs uppercase tracking-widest leading-none">Agua Destilada (1000 kg/m³)</span>
           </div>
           
           <button 
             onClick={toggleSim}
             className={`px-12 py-5 rounded-[1.5rem] font-black text-xs uppercase tracking-[0.2em] transition-all active:scale-95 flex items-center gap-4 ${isRunning ? 'bg-red-600 text-white shadow-xl shadow-red-600/30' : 'bg-blue-600 text-white shadow-xl shadow-blue-600/30'}`}
           >
             {isRunning ? <Zap size={20} fill="white" className="animate-pulse" /> : <Activity size={20} />}
             {isRunning ? 'Detener' : 'Iniciar Inmersión'}
           </button>
        </div>
      </div>

    </div>
  );
}

function HUDCard({ label, value, icon, color, highlight = false, isStatic = false }: any) {
  return (
    <motion.div 
      animate={highlight ? { scale: [1, 1.05, 1], borderColor: [color, "#FFF", color] } : {}}
      transition={{ duration: 0.5, repeat: highlight ? Infinity : 0 }}
      className={`px-6 py-4 rounded-3xl border border-white/10 flex items-center gap-4 transition-all ${isStatic ? 'bg-white/5' : 'bg-[#0A1121]/80 backdrop-blur-md shadow-2xl'}`}
    >
      <div className="w-10 h-10 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[8px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-xl font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </motion.div>
  );
}
