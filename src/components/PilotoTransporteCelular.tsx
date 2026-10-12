"use client";

import React, { useEffect, useRef, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AlertTriangle, CheckCircle2, Thermometer, Microchip, Fingerprint, NotebookPen, RotateCcw } from 'lucide-react';
import dynamic from 'next/dynamic';
import {
  osmolaridadMedioB2, osmolaridadCitoplasmaB2, pasoVolumenB2, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2,
} from '@/domain/biologia';

const Transporte3DScene = dynamic(() => import('./simuladores/bio02/Transporte3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-cyan-500 font-black text-xs uppercase tracking-widest animate-pulse">Sincronizando terminal biomédica...</div>
});

type Lectura = { nacl: number; glucosa: number; v: number };

/**
 * Ósmosis con la ley de Boyle–van 't Hoff. La osmolaridad del citoplasma es la
 * incógnita: el alumno la deduce del volumen que alcanza la célula en un medio
 * que él prepara (Osm_int0 = Osm_ext · V_eq / V0) y luego prepara el medio isotónico.
 * El volumen se integra aquí en local (requestAnimationFrame) y solo se escribe
 * al store en eventos: hemólisis y cuando la célula se estabiliza.
 */
export default function PilotoTransporteCelular({ onValidate }: { onValidate?: () => void }) {
  const transporte = useSimuladorStore((s) => s.transporte);
  const setTransporte = useSimuladorStore((s) => s.setTransporte);
  const generarSemillaB2 = useSimuladorStore((s) => s.generarSemillaB2);
  const { concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada } = transporte;

  const [volumen, setVolumen] = useState(100);
  const [tendencia, setTendencia] = useState<'gana' | 'pierde' | 'estable'>('estable');
  const [lecturas, setLecturas] = useState<Lectura[]>([]);
  const vRef = useRef(100);
  const estableRef = useRef(0);
  const escritoRef = useRef(true);

  // Parámetros vivos para el bucle sin re-crearlo en cada render.
  const paramsRef = useRef({ concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada });
  paramsRef.current = { concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada };

  // Muestra nueva (nueva incógnita o cambio de tipo celular): vuelve al volumen inicial.
  useEffect(() => {
    vRef.current = 100; setVolumen(100); setLecturas([]); escritoRef.current = true;
  }, [concInt, tipoCelula]);

  useEffect(() => {
    let frame = 0, ultimo = performance.now(), ultimoPintado = 0;
    const bucle = (ahora: number) => {
      const dt = Math.min(0.1, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const p = paramsRef.current;
      if (!p.lisada) {
        const osmExt = osmolaridadMedioB2(p.concExt, p.glucosaExt);
        const osmInt0 = osmolaridadCitoplasmaB2(p.concInt);
        const antes = vRef.current;
        let v = antes;
        for (let i = 0; i < 4; i++) v = pasoVolumenB2(v, p.tipoCelula, osmInt0, osmExt, p.temperatura, dt / 4);
        vRef.current = v;
        const dvdt = (v - antes) / Math.max(dt, 1e-3);
        if (p.tipoCelula === 'animal' && v >= UMBRAL_LISIS_B2) {
          setTransporte({ lisada: true, volumen: Math.round(v) });
        } else if (Math.abs(dvdt) < 0.05) {
          estableRef.current += dt;
          if (estableRef.current > 0.8 && !escritoRef.current) {
            escritoRef.current = true;
            setTransporte({ volumen: Math.round(v * 10) / 10 });
          }
        } else {
          estableRef.current = 0; escritoRef.current = false;
        }
        if (ahora - ultimoPintado > 100) {
          ultimoPintado = ahora;
          setVolumen(v);
          setTendencia(Math.abs(dvdt) < 0.05 ? 'estable' : dvdt > 0 ? 'gana' : 'pierde');
        }
      }
      frame = requestAnimationFrame(bucle);
    };
    frame = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(frame);
  }, [setTransporte]);

  const anotar = () => setLecturas((l) => [...l, { nacl: concExt, glucosa: glucosaExt, v: Math.round(vRef.current * 10) / 10 }].slice(-6));
  const nuevaMuestra = () => generarSemillaB2();

  const estadoCelula = tipoCelula === 'animal'
    ? (volumen > 130 ? 'Hinchada: riesgo de hemólisis' : volumen < 90 ? 'Crenada (arrugada)' : 'Forma normal')
    : (volumen >= VMAX_VEGETAL_B2 - 1 ? 'Turgente: la pared frena la entrada de agua' : volumen < 90 ? 'Plasmolizada: la membrana se separa de la pared' : 'Flácida');

  return (
    <div className="w-full h-full bg-[#020617] font-['Outfit'] text-white overflow-hidden relative">

      <div className="absolute inset-0 z-0">
        <Transporte3DScene tipo={tipoCelula} volumen={volumen} concExt={concExt} />
      </div>

      {/* MUESTRA */}
      <div className="absolute top-8 left-8 z-40 flex flex-col gap-3 max-w-sm">
        <div className="px-6 py-4 bg-blue-600/20 backdrop-blur-xl border border-blue-500/30 rounded-2xl flex items-center gap-4">
          <Fingerprint size={20} className="text-blue-400" />
          <div>
            <span className="text-[10px] font-black uppercase tracking-widest text-blue-400 block">Muestra problema · {tipoCelula === 'animal' ? 'eritrocito' : 'célula de epidermis vegetal'}</span>
            <span className="text-sm font-black text-white">Osmolaridad del citoplasma: desconocida</span>
          </div>
        </div>
        <div className="px-6 py-4 bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl text-[11px] text-slate-300 leading-relaxed">
          <b className="text-cyan-300">Método.</b> Osm = i·M (NaCl: i = 2, glucosa: i = 1). Los solutos del citoplasma no salen: Osm<sub>int</sub>·V = constante. Cuando la célula deja de cambiar, Osm<sub>int</sub> = Osm<sub>ext</sub>.
        </div>
      </div>

      {/* LECTURAS */}
      <div className="absolute top-8 right-8 z-40 w-[300px] flex flex-col gap-4">
        <div className="px-7 py-6 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-3">
            <Microchip size={16} className="text-cyan-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-slate-400">Volumen celular (V/V₀)</span>
          </div>
          <div className="text-4xl font-black font-mono">{volumen.toFixed(1)} <span className="text-base text-cyan-400">%</span></div>
          <div className="text-[11px] font-bold mt-2 text-slate-300">
            {tendencia === 'estable' ? 'Volumen estable' : tendencia === 'gana' ? 'La célula está ganando agua…' : 'La célula está perdiendo agua…'}
          </div>
          <div className="text-[11px] font-bold text-amber-300">{estadoCelula}</div>
          <button onClick={anotar} className="mt-4 w-full py-2.5 rounded-xl bg-white/10 hover:bg-white/20 text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2">
            <NotebookPen size={14} /> Anotar lectura
          </button>
          {lecturas.length > 0 && (
            <table className="w-full mt-3 text-[11px] font-mono">
              <thead><tr className="text-slate-500"><th className="text-left">NaCl (M)</th><th className="text-left">Glu (M)</th><th className="text-right">V/V₀</th></tr></thead>
              <tbody>{lecturas.map((l, i) => <tr key={i}><td>{l.nacl.toFixed(3)}</td><td>{l.glucosa.toFixed(2)}</td><td className="text-right">{l.v.toFixed(1)} %</td></tr>)}</tbody>
            </table>
          )}
        </div>

        <div className="px-7 py-5 bg-black/60 backdrop-blur-2xl border border-white/10 rounded-[2rem]">
          <div className="flex justify-between items-center mb-3">
            <span className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-slate-400"><Thermometer size={16} className="text-orange-400" /> Temperatura</span>
            <span className="text-xl font-black font-mono text-orange-400">{temperatura} °C</span>
          </div>
          <input type="range" min="5" max="40" step="1" value={temperatura}
            onChange={(e) => setTransporte({ temperatura: parseInt(e.target.value, 10) })}
            className="w-full h-1.5 bg-orange-950/50 rounded-full appearance-none cursor-pointer accent-orange-500" />
          <p className="text-[10px] text-slate-500 mt-2">La temperatura cambia la RAPIDEZ de la ósmosis, no el volumen final.</p>
        </div>
      </div>

      {/* HEMÓLISIS */}
      <AnimatePresence>
        {lisada && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="absolute inset-0 z-[100] bg-black/90 backdrop-blur-xl flex flex-col items-center justify-center text-center p-10">
            <div className="w-20 h-20 bg-red-600 rounded-full flex items-center justify-center mb-6"><AlertTriangle size={40} /></div>
            <h2 className="text-5xl font-black uppercase tracking-tighter mb-4 text-red-500">Hemólisis</h2>
            <p className="text-lg text-slate-300 max-w-md mb-10">El medio era tan hipotónico que la célula superó su volumen crítico y la membrana se rompió. Es irreversible.</p>
            <button onClick={nuevaMuestra} className="px-12 py-5 bg-white text-black font-black uppercase tracking-widest rounded-2xl hover:scale-105 transition-all">Nueva muestra</button>
          </motion.div>
        )}
      </AnimatePresence>

      {/* CONTROLES */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-30 w-full max-w-6xl px-8">
        <div className="bg-black/80 backdrop-blur-3xl border-2 border-white/20 rounded-[3rem] p-8 flex items-center gap-10">
          <div className="flex flex-col gap-3 shrink-0">
            <div className="flex bg-white/10 rounded-2xl p-1.5 border border-white/10">
              {(['animal', 'vegetal'] as const).map((t) => (
                <button key={t} onClick={() => setTransporte({ tipoCelula: t, volumen: 100, lisada: false })}
                  className={`px-6 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${tipoCelula === t ? 'bg-white text-black' : 'text-slate-400 hover:text-white'}`}>
                  {t}
                </button>
              ))}
            </div>
            <button onClick={nuevaMuestra} className="py-3 bg-blue-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:bg-blue-500 flex items-center justify-center gap-2">
              <RotateCcw size={14} /> Nueva incógnita
            </button>
          </div>

          <div className="w-px h-24 bg-white/10" />

          <div className="flex-1 grid grid-cols-2 gap-8">
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-blue-400 uppercase tracking-widest">NaCl en el medio</span>
                <span className="text-xl font-black font-mono">{concExt.toFixed(3)} M</span>
              </div>
              <input type="range" min="0" max="0.4" step="0.005" value={concExt}
                onChange={(e) => setTransporte({ concExt: parseFloat(e.target.value) })}
                className="w-full h-3 bg-blue-900/50 rounded-full appearance-none cursor-pointer accent-blue-400" />
            </div>
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-[10px] font-black text-yellow-500 uppercase tracking-widest">Glucosa en el medio</span>
                <span className="text-xl font-black font-mono">{glucosaExt.toFixed(2)} M</span>
              </div>
              <input type="range" min="0" max="0.4" step="0.01" value={glucosaExt}
                onChange={(e) => setTransporte({ glucosaExt: parseFloat(e.target.value) })}
                className="w-full h-3 bg-yellow-900/50 rounded-full appearance-none cursor-pointer accent-yellow-500" />
            </div>
          </div>

          <button onClick={() => onValidate?.()} className="px-8 py-5 bg-emerald-500 text-black font-black text-xs uppercase tracking-widest rounded-3xl hover:scale-105 transition-all flex items-center gap-3">
            <CheckCircle2 size={18} /> Validar medio isotónico
          </button>
        </div>
      </div>
    </div>
  );
}
