"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Waves, Weight, ArrowUp, ShieldAlert, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { FLUIDOS, G_TIERRA, evaluarF6, lecturaDinamometro, pesoAparente } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

/**
 * Arquímedes con dinamómetro (vista 2D provisional; la escena 3D llega en la
 * pasada de piezas reales). El sólido cuelga del dinamómetro y se baja dentro
 * del fluido; la inmersión es una FRACCIÓN de su volumen y nunca pasa del 100 %.
 */
export default function PilotoArquimedes({ onValidate }: { onValidate?: () => void }) {
  const { a, setArquimedes6, setAsistente, audio } = useSimuladorStore(useShallow((s) => ({
    a: s.arquimedes6, setArquimedes6: s.setArquimedes6, setAsistente: s.setAsistente, audio: s.audio,
  })));
  const { densidadCuerpo, volumenCuerpo, fluido, densidadLiquido, sumergido, lecturaAire, lecturaFluido, fluidoLectura, densidadAlumno } = a;

  const [rhoInput, setRhoInput] = useState(densidadAlumno !== null ? String(densidadAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF6> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de hidrostática. Pesa el sólido en el aire y luego completamente sumergido: la diferencia es el empuje, y con él puedes calcular su volumen y su densidad.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [lecturaAire, lecturaFluido, densidadAlumno]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const lectura = lecturaDinamometro(pesoAparente(densidadCuerpo, volumenCuerpo, densidadLiquido, sumergido));
  const fraccion = Math.min(1, Math.max(0, sumergido));

  const cambiarFluido = (key: string) => {
    if (key === fluido) return;
    // La lectura sumergida pertenece al fluido en que se tomó.
    setArquimedes6({ fluido: key, densidadLiquido: FLUIDOS[key].rho, sumergido: 0, lecturaFluido: null, fluidoLectura: null, resultado: null });
    audio?.playPop();
  };

  const registrarAire = () => {
    if (fraccion > 0) return avisar('Saca por completo el sólido del fluido para pesarlo en el aire.');
    setArquimedes6({ lecturaAire: lectura, resultado: null });
    audio?.playPop();
  };
  const registrarFluido = () => {
    if (fraccion < 1) return avisar('Sumerge el sólido POR COMPLETO antes de registrar el peso aparente.');
    setArquimedes6({ lecturaFluido: lectura, fluidoLectura: fluido, resultado: null });
    audio?.playPop();
  };

  const guardarRho = (v: string) => {
    setRhoInput(v);
    const r = parseFloat(v);
    setArquimedes6({ densidadAlumno: Number.isFinite(r) ? r : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF6(a);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  // Geometría de la vista: el nivel del líquido sube con el volumen desalojado.
  const vista = useMemo(() => {
    const ladoCuerpo = 64;              // px
    const yNivel0 = 230;                // superficie libre sin cuerpo (px desde arriba)
    const subida = fraccion * 18;       // px: proporcional al volumen desalojado
    const yNivel = yNivel0 - subida;
    // fondo del cuerpo: arriba del agua (fracción 0) → totalmente dentro (fracción 1)
    const yFondoCuerpo = yNivel0 + fraccion * (ladoCuerpo + 8) - 4;
    return { ladoCuerpo, yNivel, yFondoCuerpo };
  }, [fraccion]);

  return (
    <div className="relative w-full h-full bg-[#010409] overflow-hidden font-['Outfit'] text-white">
      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* VISTA: dinamómetro, sólido y vaso */}
      <div className="absolute inset-0 flex items-center justify-center pt-10">
        <svg viewBox="0 0 300 380" className="h-[70%] max-w-[90vw]" role="img" aria-label="Sólido colgado de un dinamómetro sobre un vaso con fluido">
          {/* soporte y dinamómetro */}
          <rect x="140" y="10" width="20" height="70" rx="6" fill="#334155" />
          <text x="150" y="50" textAnchor="middle" fontSize="9" fill="#e2e8f0" fontWeight="bold">N</text>
          <line x1="150" y1="80" x2="150" y2={vista.yFondoCuerpo - vista.ladoCuerpo} stroke="#cbd5e1" strokeWidth="1.5" />
          {/* vaso */}
          <rect x="60" y="150" width="180" height="210" rx="8" fill="rgba(255,255,255,0.04)" stroke="rgba(255,255,255,0.25)" />
          <rect x="61" y={vista.yNivel} width="178" height={359 - vista.yNivel} fill={fluido === 'glicerina' ? 'rgba(250,204,21,0.25)' : fluido === 'alcohol' ? 'rgba(165,180,252,0.25)' : 'rgba(56,189,248,0.3)'} />
          <line x1="61" x2="239" y1={vista.yNivel} y2={vista.yNivel} stroke="rgba(186,230,253,0.7)" />
          {/* sólido */}
          <rect x={150 - vista.ladoCuerpo / 2} y={vista.yFondoCuerpo - vista.ladoCuerpo} width={vista.ladoCuerpo} height={vista.ladoCuerpo} rx="6" fill="#64748b" stroke="#94a3b8" />
          <text x="150" y={vista.yFondoCuerpo - vista.ladoCuerpo / 2 + 4} textAnchor="middle" fontSize="12" fill="#e2e8f0" fontWeight="bold">?</text>
        </svg>
      </div>

      {/* DINAMÓMETRO + REGISTROS */}
      <div className="absolute top-6 left-6 z-30 w-[320px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-blue-500/30 p-5 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 bg-blue-500 rounded-xl flex items-center justify-center"><Waves size={18} /></div>
            <div>
              <h2 className="font-black text-sm tracking-tight leading-none">PRINCIPIO DE ARQUÍMEDES</h2>
              <p className="text-blue-400/70 text-[9px] font-black uppercase tracking-[0.2em]">Módulo FIS-06</p>
            </div>
          </div>
          <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Weight size={12} /> Dinamómetro</span>
          <div className="text-4xl font-black font-mono mt-1">{lectura.toFixed(2)} <span className="text-sm text-slate-400">N</span></div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            <button onClick={registrarAire} className="py-2.5 rounded-xl bg-slate-700 hover:bg-slate-600 text-[10px] font-black uppercase flex items-center justify-center gap-1"><Plus size={12} /> Peso en aire</button>
            <button onClick={registrarFluido} className="py-2.5 rounded-xl bg-blue-700 hover:bg-blue-600 text-[10px] font-black uppercase flex items-center justify-center gap-1"><Plus size={12} /> Peso sumergido</button>
          </div>
          <div className="mt-3 text-[11px] font-mono space-y-1">
            <div className="flex justify-between"><span className="text-slate-400">W (aire)</span><span>{lecturaAire !== null ? `${lecturaAire.toFixed(2)} N` : '—'}</span></div>
            <div className="flex justify-between"><span className="text-slate-400">W aparente</span><span>{lecturaFluido !== null ? `${lecturaFluido.toFixed(2)} N (${FLUIDOS[fluidoLectura ?? fluido]?.nombre})` : '—'}</span></div>
          </div>
        </div>
      </div>

      {/* ANÁLISIS */}
      <div className="absolute top-6 right-6 z-30 w-[300px] max-w-[92vw] bg-[#0A1121]/90 backdrop-blur-xl border border-amber-500/30 p-5 rounded-[2rem]">
        <span className="text-[10px] font-black text-amber-300 uppercase tracking-[0.2em] flex items-center gap-1"><ArrowUp size={12} /> Análisis</span>
        <p className="text-[10px] font-mono text-slate-300 mt-2 leading-relaxed">E = W − W<sub>ap</sub> = ρ<sub>f</sub>·g·V<br />ρ = W / (g·V)</p>
        <p className="text-[10px] text-slate-400 mt-2">g = {G_TIERRA} m/s² · ρ<sub>f</sub> = {densidadLiquido} kg/m³</p>
        <input type="number" step="1" value={rhoInput} onChange={(e) => guardarRho(e.target.value)} placeholder="ρ del sólido (kg/m³)"
          className="w-full mt-3 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
        <button onClick={comprobar} className="w-full mt-3 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Comprobar análisis</button>
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 bg-[#0A1121]/90 backdrop-blur-2xl rounded-[2rem] border border-white/10 flex flex-wrap items-center justify-center px-6 py-4 gap-6 z-30 max-w-[95vw]">
        <div className="flex flex-col min-w-[220px]">
          <div className="flex justify-between mb-1">
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Volumen sumergido</span>
            <span className="text-blue-300 font-black text-xs">{Math.round(fraccion * 100)} %</span>
          </div>
          <input type="range" min={0} max={1} step={0.05} value={fraccion}
            onChange={(e) => setArquimedes6({ sumergido: Math.min(1, Math.max(0, parseFloat(e.target.value))) })}
            className="w-full accent-blue-500 h-1.5" />
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Fluido</span>
          <div className="flex gap-1">
            {Object.entries(FLUIDOS).map(([k, f]) => (
              <button key={k} onClick={() => cambiarFluido(k)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${fluido === k ? 'bg-blue-600' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {f.nombre} · {f.rho}
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Tu densidad coincide con tus lecturas del dinamómetro. Valida tu práctica." />
      </div>
    </div>
  );
}
