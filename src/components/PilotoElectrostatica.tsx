"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { 
  Zap, MoveHorizontal, Target, Orbit, 
  ShieldCheck, Bot, RotateCcw
} from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import Electrostatica3DScene from './simuladores/fis09/Electrostatica3DScene';

// Con q en µC (1e-6 C) y r en cm (1e-2 m): k_e·(1e-6)²/(1e-2)² = 8.987e9·1e-12/1e-4 ≈ 89.87
// => F[N] = 89.87 · |q1·q2[µC²]| / r²[cm²]. La distancia DEBE interpretarse en centímetros.
const K_SCALED = 89.87;

export default function PilotoElectrostatica() {
  const router = useRouter();
  const { 
    electrostatica9, setElectrostatica9, setBitacora, bitacoraData, 
    stopTimer, setPasoActual, pasoActual, audio, setAsistente, registrarHallazgo 
  } = useSimuladorStore();
  
  const { q1 = 1, q2 = 1, distancia = 0.5 } = electrostatica9 || { q1: 1, q2: 1, distancia: 0.5 };

  const [alphaInput, setAlphaInput] = useState("");
  const [mounted, setMounted] = useState(false);

  useEffect(() => { 
    setMounted(true);
    setAsistente({
      pose: 'thinking',
      text: "Bienvenido al campo electrostático. Debes calcular la fuerza neta usando la Ley de Coulomb: F = k·|q₁q₂|/r²."
    });
  }, []);

  // -- CÁLCULOS FÍSICOS --
  const F = (K_SCALED * Math.abs(q1 * q2)) / Math.pow(distancia, 2);
  const isAtraccion = (q1 * q2) < 0;

  // -- EFECTOS DE AUDIO --
  useEffect(() => {
    if (Math.abs(F) > 0.01) {
       const interval = setInterval(() => {
          audio?.playPop(); 
       }, Math.max(100, 2000 / (F + 1)));
       return () => clearInterval(interval);
    }
  }, [F, audio]);

  const handleValidar = () => {
    const val = parseFloat(alphaInput);
    if (isNaN(val)) {
       audio?.playError();
       return;
    }
    const error = Math.abs(val - F) / (F || 1);
    
    if (error <= 0.05 && F > 0) {
      audio?.playSuccess();
      setAsistente({
        pose: 'happy',
        text: "¡Excelente! Has cuantificado la fuerza electrostática con precisión cuántica."
      });
      registrarHallazgo('fis_electrostatica_coulomb', {
        q1,
        q2,
        distancia_r: distancia,
        fuerza_n: F,
        tipo: isAtraccion ? 'ATRACCION' : 'REPULSION',
        error_relativo: error
      });

      stopTimer();
      setPasoActual(4);
      setBitacora({ 
        ...bitacoraData, 
        fisica9: `✅ VALIDADO: F_real=${F.toFixed(4)}N. F_alumno=${val}N. q1=${q1}μC, q2=${q2}μC, r=${distancia}m.` 
      });
    } else {
      audio?.playError();
      setAsistente({
        pose: 'warning',
        text: "Discrepancia detectada. Revisa el cuadrado de la distancia y el factor k."
      });
    }
  };

  const handleUpdate = (data: any) => {
    setElectrostatica9({ ...electrostatica9, ...data });
    audio?.playPop();
    if (pasoActual === 1) setPasoActual(2);
    if (pasoActual === 2 && data.distancia) setPasoActual(3);
  };

  if (!mounted) return null;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#03040a] font-['Outfit'] relative text-white">

      {/* ── ESCENA 3D — CAMPO ELECTROSTÁTICO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <Electrostatica3DScene q1={q1} q2={q2} distancia={distancia} isAtraccion={isAtraccion} />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#03040a]/70 via-transparent to-[#03040a]/80" />

      {/* ── CHECKLIST HUD ── */}
      <div className="absolute top-12 left-1/2 -translate-x-1/2 z-50 w-full max-w-[600px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-blue-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(59,130,246,0.15)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-500/20 rounded-xl">
                <Zap className="text-blue-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-blue-300 uppercase tracking-widest leading-none">Sincronía Electrostática</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">FIS-09 • Protocolo Coulomb</p>
              </div>
            </div>
            <div className="flex gap-2">
              {[
                { step: 1, label: "Fuente" },
                { step: 2, label: "Probeta" },
                { step: 3, label: "Campo" }
              ].map((s) => (
                <div key={s.step} className={`px-4 py-1.5 rounded-full border flex items-center gap-2 transition-all ${pasoActual >= s.step ? 'bg-blue-500 border-blue-400 text-white' : 'bg-slate-800/50 border-slate-700 text-slate-500'}`}>
                   {pasoActual > s.step ? <ShieldCheck size={10} /> : <div className="w-1.5 h-1.5 rounded-full bg-current" />}
                   <span className="text-[9px] font-black uppercase tracking-widest">{s.label}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow h-full relative flex flex-col p-12 overflow-hidden z-10 pointer-events-none">
         
         {/* HUD SUPERIOR */}
         <div className="flex justify-between items-start z-30 pointer-events-none mt-16">
            <div className="flex gap-4">
              <HUDCard label="Carga q₁ (Fixed)" value={`${q1 > 0 ? '+' : ''}${q1} μC`} icon={<Orbit size={14} />} color="#3b82f6" />
              <HUDCard label="Carga q₂ (Probe)" value={`${q2 > 0 ? '+' : ''}${q2} μC`} icon={<Target size={14} />} color="#ef4444" />
              <HUDCard label="Separación (r)" value={`${distancia.toFixed(2)} cm`} icon={<MoveHorizontal size={14} />} color="#a855f7" />
            </div>

            <div className="bg-slate-900/40 backdrop-blur-2xl border border-white/5 p-6 rounded-[2rem] flex items-center gap-6 shadow-2xl">
                <div>
                   <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-2 italic">Magnitud de Fuerza</h4>
                   <div className="text-2xl font-black text-yellow-400 font-mono tracking-tighter">
                      {F.toFixed(4)} <span className="text-[10px] text-slate-500 uppercase ml-1 font-sans">Newtons</span>
                   </div>
                </div>
                <Zap className={`text-yellow-400 ${F > 1 ? 'animate-pulse' : 'opacity-20'}`} />
            </div>
         </div>

         {/* LABORATORIO VIRTUAL — el campo 3D vive en el fondo (z-0). Este hueco
             deja pasar la interacción con OrbitControls (arrastrar / zoom). */}
         <div className="flex-grow" />

         {/* PANEL DE CONTROL */}
         <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-6xl z-40">
            <motion.div initial={{ y: 50, opacity: 0 }} animate={{ y: 0, opacity: 1 }} className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[3rem] p-8 shadow-2xl flex items-center justify-between gap-10 pointer-events-auto">
               <div className="flex gap-8 items-center border-r border-white/10 pr-10">
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intensidad q₁ (μC)</span>
                    <div className="flex gap-2">
                      {[-5, -1, 1, 5].map(v => (
                        <button key={v} onClick={() => handleUpdate({ q1: v })} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${q1 === v ? 'bg-blue-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                          {v > 0 ? '+' : ''}{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Intensidad q₂ (μC)</span>
                    <div className="flex gap-2">
                      {[-5, -1, 1, 5].map(v => (
                        <button key={v} onClick={() => handleUpdate({ q2: v })} className={`w-10 h-10 rounded-xl text-[10px] font-black transition-all ${q2 === v ? 'bg-red-600 text-white shadow-lg' : 'bg-white/5 text-slate-500 hover:bg-white/10'}`}>
                          {v > 0 ? '+' : ''}{v}
                        </button>
                      ))}
                    </div>
                  </div>
                  <div className="space-y-3">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-500">Posición r (cm)</span>
                    <input type="range" min="0.1" max="2.5" step="0.05" value={distancia} onChange={(e) => handleUpdate({ distancia: parseFloat(e.target.value) })} className="w-32 h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-blue-500" />
                  </div>
               </div>

               <div className="flex-1 flex gap-6 items-center">
                  <div className="flex-1 relative">
                    <input type="number" placeholder="Calcula F = k·q₁q₂ / r²..." value={alphaInput} onChange={(e) => setAlphaInput(e.target.value)} className="w-full h-16 bg-white/5 border border-white/10 rounded-2xl px-6 text-white font-black text-xl placeholder:text-white/10 focus:outline-none focus:border-blue-500 transition-all" />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[10px] font-black text-white/20 uppercase tracking-widest">Newtons (N)</span>
                  </div>
                  <button onClick={handleValidar} className="h-16 px-10 bg-blue-600 hover:bg-blue-500 rounded-2xl flex items-center gap-3 shadow-xl transition-all active:scale-95 group">
                    <Target size={18} className="text-white group-hover:rotate-12 transition-transform" />
                    <span className="text-xs font-black text-white uppercase tracking-widest">Validar Coulomb</span>
                  </button>
               </div>
               <button onClick={() => { audio?.playPop(); setAlphaInput(""); handleUpdate({ q1: 1, q2: 1, distancia: 0.5 }); }} className="w-16 h-16 bg-white/5 hover:bg-white/10 rounded-2xl border border-white/10 flex items-center justify-center text-slate-500 hover:text-white transition-all">
                  <RotateCcw size={20} />
               </button>
            </motion.div>
         </div>

         {/* MODAL ÉXITO FINAL */}
         <AnimatePresence>
            {bitacoraData.fisica9 && (
               <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="absolute inset-0 z-[100] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12 pointer-events-auto">
                 <motion.div initial={{ scale: 0.9, y: 30 }} animate={{ scale: 1, y: 0 }} className="bg-slate-900 border border-blue-500/30 rounded-[4rem] p-20 max-w-2xl text-center shadow-[0_0_100px_rgba(59,130,246,0.15)]">
                    <ShieldCheck size={100} className="text-blue-500 mx-auto mb-8" />
                    <h3 className="text-5xl font-black text-white uppercase italic mb-6">Misión Certificada</h3>
                    <p className="text-slate-400 text-lg font-medium mb-12 leading-relaxed">Has cuantificado con éxito la interacción entre cargas puntuales. El campo electrostático ha sido mapeado bajo el estándar de alta fidelidad **Diamond State**.</p>
                    <button onClick={() => router.push('/alumno/laboratorio/fisica')} className="w-full py-6 bg-blue-600 hover:bg-blue-500 text-white font-black rounded-[2rem] uppercase tracking-widest text-xs transition-colors shadow-lg shadow-blue-600/30">Cerrar Informe de Campo</button>
                 </motion.div>
               </motion.div>
            )}
         </AnimatePresence>
      </main>

      <AnimatePresence>
        {!bitacoraData.fisica9 && (
          <motion.div initial={{ x: 50, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="absolute top-40 right-12 z-30 max-w-xs bg-[#0f172a]/90 backdrop-blur-xl p-8 rounded-[2.5rem] border border-white/10 shadow-2xl">
            <div className="flex items-center gap-3 mb-4">
              <Bot className="text-blue-400" size={24} />
              <span className="text-[10px] font-black text-white uppercase tracking-[0.2em]">Dr. Quantum: E-Field</span>
            </div>
            <p className="text-[11px] text-slate-400 leading-relaxed italic">"Con cargas en μC y distancia en metros, usa la constante escalada K = 89.87 N·(μC)⁻²·m². La fórmula queda F = 89.87 · |q₁·q₂| / r², donde q₁, q₂ son valores enteros en μC."</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function HUDCard({ label, value, icon, color }: any) {
  return (
    <div className={`px-8 py-5 rounded-[2rem] border border-white/10 flex items-center gap-5 transition-all bg-[#0A1121]/80 backdrop-blur-md shadow-2xl`}>
      <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-inner" style={{ background: `${color}20`, color }}>
        {icon}
      </div>
      <div>
        <span className="block text-[9px] font-black uppercase tracking-[0.2em] text-white/30 mb-1">{label}</span>
        <span className="block text-2xl font-black text-white tracking-tighter leading-none">{value}</span>
      </div>
    </div>
  );
}
