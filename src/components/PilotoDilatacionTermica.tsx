"use client";

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Thermometer, Ruler, Play, Pause, Plus, ShieldAlert, Flame } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  MATERIALES_DILATACION, T_AMBIENTE, T_VAPOR, DT_MIN_MEDICION,
  alphaDe, dilatacion, lecturaComparador, evaluarF7,
} from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const DilatacionTermica3DScene = dynamic(() => import('./simuladores/fis07/DilatacionTermica3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-orange-400 font-black text-xs uppercase tracking-[0.3em]">Preparando dilatómetro...</div>
});

const COLORES: Record<string, string> = { aluminio: '#CBD5E1', cobre: '#B45309', acero: '#64748b', misterioso: '#6366f1' };
const MATERIALES_UI = [
  ...Object.entries(MATERIALES_DILATACION).map(([k, m]) => ({ key: k, nombre: m.nombre })),
  { key: 'misterioso', nombre: 'Metal ?' },
];

// Calentamiento por vapor: la barra se acerca exponencialmente a la temperatura
// del vapor (100 °C a 1 atm) y, sin vapor, se enfría hacia el ambiente (ley de
// enfriamiento de Newton). Constantes de tiempo didácticas, no medidas.
const TAU_CALENTAR_S = 6;
const TAU_ENFRIAR_S = 20;
const TICK_MS = 100;

interface Medicion { material: string; dT: number; dL: number }

export default function PilotoDilatacionTermica({ onValidate }: { onValidate?: () => void }) {
  const { d, setDilatacion7, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    d: s.dilatacion7, setDilatacion7: s.setDilatacion7, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { material, tempIni, longitud, alphaMisterioso, alphaAlumno } = d;

  // Temperatura y vapor: estado local (no se escribe al store en cada tick).
  const [temp, setTemp] = useState(T_AMBIENTE);
  const [vapor, setVapor] = useState(false);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [alphaInput, setAlphaInput] = useState(alphaAlumno !== null ? String(alphaAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF7> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al dilatómetro. Haz pasar vapor por el tubo hasta que el termómetro se estabilice, lee el alargamiento en el comparador y calcula α = ΔL / (L₀·ΔT).",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // El intervalo sólo vive mientras la temperatura no ha llegado a su equilibrio.
  const objetivo = vapor ? T_VAPOR : tempIni;
  const enEquilibrio = Math.abs(temp - objetivo) < 0.05;
  useEffect(() => {
    if (enEquilibrio) return;
    const tau = vapor ? TAU_CALENTAR_S : TAU_ENFRIAR_S;
    const id = window.setInterval(() => {
      setTemp((T) => {
        const sig = objetivo + (T - objetivo) * Math.exp(-(TICK_MS / 1000) / tau);
        return Math.abs(sig - objetivo) < 0.05 ? objetivo : sig;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [vapor, objetivo, enEquilibrio]);

  useEffect(() => { setVeredicto(null); }, [d.ensayo, alphaAlumno]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const alpha = alphaDe(material, alphaMisterioso);
  const termometro = Math.round(temp * 10) / 10;           // resolución 0,1 °C
  const dT = Math.round((termometro - tempIni) * 10) / 10;
  const comparador = lecturaComparador(dilatacion(alpha, longitud, temp - tempIni)); // mm, resolución 1 μm

  const montar = (key: string) => {
    if (key === material) return;
    if (vapor) return avisar('Corta el vapor antes de cambiar la barra.');
    // Una barra nueva se monta a temperatura ambiente.
    setDilatacion7({ material: key, resultado: null });
    setTemp(tempIni);
    audio?.playPop();
  };

  const registrar = () => {
    if (dT < DT_MIN_MEDICION) return avisar(`Calienta al menos ${DT_MIN_MEDICION} °C: con ΔT pequeño el error de lectura domina.`);
    const m: Medicion = { material, dT, dL: comparador };
    setMediciones((prev) => [...prev.slice(-7), m]);
    // Al store sólo va la medición del metal problema: es la que se evalúa.
    if (material === 'misterioso') setDilatacion7({ ensayo: m, resultado: null });
    audio?.playPop();
  };

  const guardarAlpha = (v: string) => {
    setAlphaInput(v);
    const a = parseFloat(v);
    setDilatacion7({ alphaAlumno: Number.isFinite(a) ? a : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF7(d);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <DilatacionTermica3DScene alpha={alpha} longitud={longitud} tempIni={tempIni} tempFin={temp}
          color={COLORES[material] ?? '#CBD5E1'} encendido={vapor} />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* INSTRUMENTOS */}
      <div className="absolute top-6 left-6 z-30 w-[330px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-orange-500/30 p-5 rounded-[2rem]">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Thermometer size={12} /> Termómetro</span>
              <div className="text-2xl font-black font-mono mt-1">{termometro.toFixed(1)} °C</div>
            </div>
            <div>
              <span className="text-[9px] font-black text-slate-400 uppercase tracking-widest flex items-center gap-1"><Ruler size={12} /> Comparador</span>
              <div className="text-2xl font-black font-mono mt-1">{comparador.toFixed(3)} mm</div>
            </div>
          </div>
          <div className="mt-3 text-[10px] text-slate-400 font-mono">L₀ = {longitud} mm · T₀ = {tempIni} °C · vapor a 1 atm: {T_VAPOR} °C</div>
          <button onClick={registrar} className="w-full mt-4 py-2.5 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-[10px] font-black uppercase flex items-center justify-center gap-1"><Plus size={12} /> Registrar medición</button>
        </div>

        <div className="bg-[#0A1121]/85 backdrop-blur-xl border border-white/10 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-indigo-300 uppercase tracking-[0.2em]">Mediciones</span>
          {mediciones.length === 0 ? <p className="text-[10px] text-slate-500 italic mt-2">Sin mediciones todavía.</p> : (
            <table className="w-full text-[10px] font-mono mt-2">
              <thead><tr className="text-slate-500"><th className="text-left">Barra</th><th className="text-left">ΔT</th><th className="text-left">ΔL</th></tr></thead>
              <tbody>
                {mediciones.map((m, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td>{m.material === 'misterioso' ? 'Metal ?' : MATERIALES_DILATACION[m.material]?.nombre}</td>
                    <td>{m.dT.toFixed(1)} °C</td><td>{m.dL.toFixed(3)} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          <label className="block mt-4">
            <span className="text-[9px] font-black text-amber-300 uppercase tracking-widest">α del metal ? (×10⁻⁶ /°C)</span>
            <input type="number" step="0.1" value={alphaInput} onChange={(e) => guardarAlpha(e.target.value)} placeholder="α = ΔL / (L₀·ΔT)"
              className="w-full mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono text-lg" />
          </label>
          <button onClick={comprobar} className="w-full mt-3 py-3 bg-amber-600 hover:bg-amber-500 rounded-xl text-[10px] font-black uppercase tracking-widest">Comprobar análisis</button>
        </div>
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A1121]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-4 flex flex-wrap items-center justify-center gap-6 max-w-[95vw]">
        <div className="flex flex-col gap-1">
          <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">Barra montada</span>
          <div className="flex gap-1">
            {MATERIALES_UI.map((m) => (
              <button key={m.key} onClick={() => montar(m.key)}
                className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase ${material === m.key ? 'bg-orange-600' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
                {m.nombre}{m.key !== 'misterioso' && <span className="block text-[8px] font-mono normal-case text-white/60">α {(MATERIALES_DILATACION[m.key].alpha * 1e6).toFixed(1)}×10⁻⁶</span>}
              </button>
            ))}
          </div>
        </div>
        <button onClick={() => { setVapor((v) => !v); audio?.playPop(); }}
          className={`h-14 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 ${vapor ? 'bg-orange-600' : 'bg-white/10 hover:bg-white/20'}`}>
          {vapor ? <Pause size={16} /> : <Play size={16} />}{vapor ? 'Cortar vapor' : 'Pasar vapor'}<Flame size={14} />
        </button>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Tu α coincide con tu medición del metal problema. Valida tu práctica." />
      </div>
    </div>
  );
}
