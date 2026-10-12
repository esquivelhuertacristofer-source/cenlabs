"use client";

import React, { useEffect, useRef, useState } from 'react';
import { Activity, ShieldCheck, Settings2, Play, Square } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import Poblaciones3DScene from './simuladores/bio10/Poblaciones3DScene';
import { pasoRK4B10, extincionB10, equilibrioLVB10, DT_B10, T_OBJETIVO_B10, RANGOS_B10 } from '@/domain/biologia';
import type { ParametrosLVB10 } from '@/store/types';

/** Velocidad de reproducción: años simulados por segundo real. */
const ANIOS_POR_SEGUNDO = 5;
/** Cada cuántos años se guarda un punto del historial. */
const MUESTREO_ANIOS = 0.25;
const PASOS_TOTALES = Math.round(T_OBJETIVO_B10 / DT_B10);

type Punto = { t: number; presas: number; depredadores: number };

/**
 * La integración (RK4, dt fijo = DT_B10) corre en un ref local; el store solo
 * recibe la corrida TERMINADA (registrarCorridaB10). Mismo paso y mismo número
 * de pasos que el juez de dominio, así que el resultado es idéntico.
 */
export default function PilotoPoblaciones({ onValidate }: { onValidate?: () => void }) {
  const ecosistema = useSimuladorStore((s) => s.ecosistema);
  const setEcosistema = useSimuladorStore((s) => s.setEcosistema);
  const registrarCorridaB10 = useSimuladorStore((s) => s.registrarCorridaB10);
  const { presasIniciales, depredadoresIniciales, parametros, corrida, historial, status } = ecosistema;

  const sim = useRef({ x: presasIniciales, y: depredadoresIniciales, paso: 0, hist: [] as Punto[], raf: 0, last: 0, acc: 0, ultimoHud: 0 });
  const [corriendo, setCorriendo] = useState(false);
  const [hud, setHud] = useState({ t: 0, x: presasIniciales, y: depredadoresIniciales, hist: [] as Punto[] });

  const detener = () => {
    cancelAnimationFrame(sim.current.raf);
    sim.current.raf = 0;
    setCorriendo(false);
  };
  useEffect(() => () => cancelAnimationFrame(sim.current.raf), []);

  // Si cambian las condiciones iniciales (nueva semilla), se reinicia la vista.
  useEffect(() => {
    setHud({ t: 0, x: presasIniciales, y: depredadoresIniciales, hist: [] });
  }, [presasIniciales, depredadoresIniciales]);

  const correr = () => {
    const p: ParametrosLVB10 = { ...parametros };
    const s = sim.current;
    s.x = presasIniciales; s.y = depredadoresIniciales; s.paso = 0; s.acc = 0; s.last = 0; s.ultimoHud = 0;
    s.hist = [{ t: 0, presas: s.x, depredadores: s.y }];
    setCorriendo(true);
    audio?.playPop();

    const cadaMuestra = Math.round(MUESTREO_ANIOS / DT_B10);
    const frame = (now: number) => {
      if (!s.last) s.last = now;
      s.acc += Math.min(0.1, (now - s.last) / 1000) * ANIOS_POR_SEGUNDO;
      s.last = now;
      let fin: false | 'presas' | 'depredadores' | 'completa' = false;
      while (s.acc >= DT_B10 && !fin) {
        s.acc -= DT_B10;
        [s.x, s.y] = pasoRK4B10(s.x, s.y, p);
        s.paso++;
        const ext = extincionB10(s.x, s.y);
        if (s.paso % cadaMuestra === 0 || ext) s.hist.push({ t: s.paso * DT_B10, presas: s.x, depredadores: s.y });
        if (ext) fin = ext;
        else if (s.paso >= PASOS_TOTALES) fin = 'completa';
      }
      const t = s.paso * DT_B10;
      if (fin || now - s.ultimoHud > 100) {
        s.ultimoHud = now;
        setHud({ t, x: s.x, y: s.y, hist: s.hist.slice(-300) });
      }
      if (fin) {
        const extincion = fin === 'completa' ? false : fin;
        registrarCorridaB10({ t, extincion, parametros: p }, s.x, s.y, s.hist);
        s.raf = 0;
        setCorriendo(false);
        if (extincion) audio?.playError(); else audio?.playSuccess();
        return;
      }
      s.raf = requestAnimationFrame(frame);
    };
    s.raf = requestAnimationFrame(frame);
  };

  const cambiarParametro = (key: keyof ParametrosLVB10, val: number) => {
    if (corriendo) detener(); // cambiar a mitad de la corrida la invalida
    setEcosistema({ parametros: { ...parametros, [key]: val } });
  };

  const eq = equilibrioLVB10(parametros);
  const historialEscena = corriendo || hud.hist.length > 0 ? hud.hist : historial;

  return (
    <div className="w-full h-full relative flex flex-col overflow-hidden bg-[#02040a] font-['Outfit'] text-white">
      <div className="relative flex-1">
        <Poblaciones3DScene presas={hud.x} depredadores={hud.y} historial={historialEscena} simulando={corriendo} />

        <div className="absolute top-6 left-6 right-6 z-10 flex flex-wrap gap-3 pointer-events-none">
          <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-5 py-3 max-w-sm">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-blue-300"><Activity size={12} /> Misión</div>
            <p className="text-[11px] text-slate-300 mt-1">
              Ajusta los parámetros para que presas y depredadores coexistan {T_OBJETIVO_B10} años sin que ninguna especie baje de 1 individuo.
              Población inicial: {presasIniciales} presas y {depredadoresIniciales} depredadores.
            </p>
          </div>
          <Dato label="Año" value={hud.t.toFixed(1)} />
          <Dato label="Presas" value={hud.x.toFixed(0)} color="#ec4899" />
          <Dato label="Depredadores" value={hud.y.toFixed(0)} color="#22d3ee" />
        </div>

        {!corriendo && corrida && (
          <div className={`absolute bottom-6 left-1/2 -translate-x-1/2 z-10 px-6 py-3 rounded-2xl text-[12px] font-black border ${corrida.extincion ? 'bg-rose-950/80 border-rose-500/50 text-rose-200' : 'bg-emerald-950/80 border-emerald-500/50 text-emerald-200'}`}>
            {corrida.extincion
              ? `Colapso en el año ${corrida.t.toFixed(1)}: se extinguieron las ${corrida.extincion}.`
              : `El ecosistema se sostuvo ${corrida.t.toFixed(0)} años.`}
          </div>
        )}
      </div>

      <div className="h-[46%] shrink-0 overflow-y-auto bg-slate-900/80 border-t border-white/10 p-4 grid grid-cols-2 gap-4 content-start">
        <div className="flex items-center gap-3"><Settings2 className="text-blue-400" size={18} /><h4 className="text-xs font-black uppercase tracking-widest">Parámetros (por año)</h4></div>
        <SliderControl label="Natalidad de presas (α)" k="alpha" value={parametros.alpha} onChange={cambiarParametro} color="#EC4899" />
        <SliderControl label="Tasa de captura (β)" k="beta" value={parametros.beta} onChange={cambiarParametro} color="#22d3ee" />
        <SliderControl label="Mortalidad de depredadores (γ)" k="gamma" value={parametros.gamma} onChange={cambiarParametro} color="#3b82f6" />
        <SliderControl label="Conversión presa → depredador (δ)" k="delta" value={parametros.delta} onChange={cambiarParametro} color="#fb8500" />

        <div className="bg-white/5 border border-white/10 rounded-2xl p-4 text-[11px] text-slate-300 space-y-1">
          <div className="text-[9px] font-black uppercase tracking-widest text-slate-500">Punto de equilibrio de estos parámetros</div>
          <div className="font-mono">x* = γ/δ = {eq.presas.toFixed(1)} presas</div>
          <div className="font-mono">y* = α/β = {eq.depredadores.toFixed(1)} depredadores</div>
          <p className="text-[10px] text-slate-500">Las poblaciones giran alrededor de este punto; cuanto más lejos arrancan, más amplia la oscilación.</p>
        </div>

        <div className="flex gap-3">
          <button onClick={corriendo ? detener : correr}
            className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 ${corriendo ? 'bg-amber-600' : 'bg-emerald-600 hover:bg-emerald-500'}`}>
            {corriendo ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
            {corriendo ? 'Detener' : `Correr ${T_OBJETIVO_B10} años`}
          </button>
          <button onClick={() => onValidate?.()} disabled={corriendo}
            className={`flex-1 h-14 rounded-2xl font-black uppercase tracking-widest text-[11px] flex items-center justify-center gap-2 disabled:opacity-40 ${status === 'success' ? 'bg-emerald-700' : 'bg-blue-600 hover:bg-blue-500'}`}>
            <ShieldCheck size={16} /> Validar
          </button>
        </div>
      </div>
    </div>
  );
}

function Dato({ label, value, color }: { label: string; value: string; color?: string }) {
  return (
    <div className="bg-black/60 backdrop-blur-xl border border-white/10 rounded-2xl px-4 py-3 text-right">
      <div className="text-[9px] font-black uppercase tracking-widest text-slate-400">{label}</div>
      <div className="text-2xl font-black font-mono tabular-nums" style={color ? { color } : undefined}>{value}</div>
    </div>
  );
}

function SliderControl({ label, k, value, onChange, color }: {
  label: string; k: keyof ParametrosLVB10; value: number; onChange: (k: keyof ParametrosLVB10, v: number) => void; color: string;
}) {
  const r = RANGOS_B10[k];
  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-xs font-black font-mono" style={{ color }}>{value.toFixed(3)}</span>
      </div>
      <input type="range" min={r.min} max={r.max} step={r.paso} value={value}
        onChange={(e) => onChange(k, parseFloat(e.target.value))}
        className="w-full h-2 bg-white/5 rounded-full appearance-none cursor-pointer" style={{ accentColor: color }} />
    </div>
  );
}
