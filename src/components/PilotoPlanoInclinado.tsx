"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { RotateCcw, ShieldAlert, Calculator, Activity } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { dinamicaPlano, evaluarF2, LONGITUD_RAMPA, POS_INICIAL_RAMPA, G_TIERRA } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const PlanoInclinado3DScene = dynamic(() => import('./simuladores/fis02/PlanoInclinado3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Simulador...</div>
});

type Medicion = { t: number; v: number; s: number; estado: 'reposo' | 'sube' | 'baja' };

export default function PilotoPlanoInclinado({ onValidate }: { onValidate?: () => void }) {
  const { plano2, setPlano2, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    plano2: s.plano2, setPlano2: s.setPlano2, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { angulo, empuje, cargaExtra, masaBase, muS, muK } = plano2;
  const masa = masaBase + cargaExtra;

  const [prediccion, setPrediccion] = useState('');
  const [corriendo, setCorriendo] = useState(false);
  const [pos, setPos] = useState(POS_INICIAL_RAMPA); // m a lo largo de la rampa
  const [tel, setTel] = useState({ t: 0, v: 0 });
  const [medicion, setMedicion] = useState<Medicion | null>(null);
  const [alerta, setAlerta] = useState<string | null>(null);
  const raf = useRef(0);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al plano de pruebas. Predice la aceleración del bloque con la Segunda Ley de Newton ANTES de soltarlo; después mide y compara.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => () => cancelAnimationFrame(raf.current), []);

  const avisar = (msg: string) => {
    setAlerta(msg);
    window.setTimeout(() => setAlerta(null), 5000);
  };

  // Movimiento uniformemente acelerado desde el centro de la rampa, hasta un extremo.
  const lanzar = () => {
    const p = parseFloat(prediccion);
    if (!Number.isFinite(p)) {
      audio?.playError();
      avisar('Escribe tu predicción de la aceleración antes de soltar el bloque.');
      return;
    }
    const params = { angulo, empuje, masa, muS, muK };
    const din = dinamicaPlano(params);
    setPlano2({ ensayo: { ...params, prediccion: p }, resultado: null });
    setMedicion(null);
    setPos(POS_INICIAL_RAMPA);
    setTel({ t: 0, v: 0 });
    audio?.playPop();

    if (din.estado === 'reposo') {
      setMedicion({ t: 0, v: 0, s: 0, estado: 'reposo' });
      avisar('El bloque no se movió: la fricción estática lo sostiene.');
      return;
    }
    setCorriendo(true);
    const t0 = performance.now();
    const tick = (now: number) => {
      const t = (now - t0) / 1000;
      let s = POS_INICIAL_RAMPA + 0.5 * din.a * t * t;
      const fin = s <= 0 || s >= LONGITUD_RAMPA;
      if (fin) {
        s = Math.min(LONGITUD_RAMPA, Math.max(0, s));
        const d = Math.abs(s - POS_INICIAL_RAMPA);
        const tf = Math.sqrt((2 * d) / Math.abs(din.a));
        setPos(s);
        setTel({ t: tf, v: din.a * tf });
        setMedicion({ t: tf, v: din.a * tf, s: d, estado: din.estado });
        setCorriendo(false);
        return;
      }
      setPos(s);
      setTel({ t, v: din.a * t });
      raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
  };

  const reiniciar = () => {
    cancelAnimationFrame(raf.current);
    setCorriendo(false);
    setPos(POS_INICIAL_RAMPA);
    setTel({ t: 0, v: 0 });
    setMedicion(null);
    audio?.playPop();
  };

  // Feedback tras el ensayo: la MISMA regla que el validador de dominio.
  const ensayo = plano2.ensayo;
  const veredicto = useMemo(() => (medicion ? evaluarF2({ ensayo }) : null), [medicion, ensayo]);
  useEffect(() => {
    if (!veredicto || medicion?.estado === 'reposo') return;
    if (veredicto.ok) audio?.playSuccess(); else audio?.playError();
  }, [veredicto, medicion, audio]);

  const bloqueado = corriendo;

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <PlanoInclinado3DScene
          angulo={angulo} bloquePos={pos / LONGITUD_RAMPA} masa={masa}
          isDeslizando={corriendo} fuerzaAplicada={empuje} status={corriendo ? 'IGNICIÓN' : 'EN REPOSO'}
        />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 backdrop-blur-md border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} />
            <span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* DATOS + PREDICCIÓN */}
      <div className="absolute top-6 left-6 z-30 w-[360px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0f172a]/85 backdrop-blur-2xl border border-sky-500/30 p-6 rounded-[2rem]">
          <div className="flex items-center gap-3 mb-4">
            <div className="p-2 bg-sky-500/20 rounded-xl"><Calculator className="text-sky-400" size={20} /></div>
            <div>
              <span className="text-[9px] font-black text-white/40 uppercase tracking-[0.2em] block">Segunda ley de Newton</span>
              <h3 className="text-sm font-black uppercase tracking-widest text-sky-400">Plano inclinado con fricción</h3>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2 mb-4">
            <DataBox label="Masa m" value={`${masa} kg`} />
            <DataBox label="Ángulo θ" value={`${angulo}°`} />
            <DataBox label="Fuerza F" value={`${empuje} N`} />
            <DataBox label="μ estático" value={muS.toFixed(2)} />
            <DataBox label="μ cinético" value={muK.toFixed(2)} />
            <DataBox label="g" value={`${G_TIERRA} m/s²`} />
          </div>
          <p className="text-[10px] text-slate-400 mb-3 leading-relaxed">
            F actúa paralela a la rampa (+ hacia arriba). Toma la aceleración como positiva hacia ARRIBA de la rampa.
          </p>
          <div className="relative">
            <input type="number" step="0.01" placeholder="0.00" value={prediccion} disabled={bloqueado}
              onChange={(e) => setPrediccion(e.target.value)}
              className="w-full bg-slate-950 border-2 border-slate-800 rounded-2xl py-4 px-5 text-white font-mono text-2xl focus:border-sky-500 outline-none disabled:opacity-50" />
            <span className="absolute right-5 top-1/2 -translate-y-1/2 text-[10px] font-black text-sky-500 uppercase">a predicha · m/s²</span>
          </div>
        </div>

        {/* RESULTADO DEL ENSAYO */}
        {medicion && (
          <div className={`backdrop-blur-xl border p-5 rounded-[2rem] ${veredicto?.ok ? 'bg-emerald-900/40 border-emerald-500/40' : 'bg-[#0f172a]/80 border-white/10'}`}>
            <span className="text-[10px] font-black uppercase tracking-widest text-white/60 flex items-center gap-2"><Activity size={12} /> Medición del ensayo</span>
            {medicion.estado === 'reposo' ? (
              <p className="text-xs text-amber-300 mt-2">El bloque quedó en reposo. Un ensayo sin movimiento no sirve para comprobar la aceleración.</p>
            ) : (
              <>
                <p className="text-xs text-slate-200 mt-2">
                  El bloque {medicion.estado === 'sube' ? 'subió' : 'bajó'} {medicion.s.toFixed(2)} m en {medicion.t.toFixed(2)} s
                  (v final = {medicion.v.toFixed(2)} m/s).
                </p>
                <p className={`text-[11px] mt-2 font-bold ${veredicto?.ok ? 'text-emerald-300' : 'text-rose-300'}`}>
                  {veredicto?.ok ? 'Tu predicción coincide con la medición.' : veredicto?.mensaje}
                </p>
              </>
            )}
          </div>
        )}
      </div>

      {/* CRONÓMETRO / TELEMETRÍA */}
      <div className="absolute top-6 right-6 z-30 bg-[#0f172a]/80 backdrop-blur-2xl border border-white/10 p-5 rounded-[2rem] w-56">
        <span className="text-[9px] font-black text-sky-400 uppercase tracking-[0.3em]">Sensor de movimiento</span>
        <div className="mt-3 space-y-2 font-mono">
          <Fila label="t" valor={`${tel.t.toFixed(2)} s`} />
          <Fila label="v" valor={`${tel.v.toFixed(2)} m/s`} />
          <Fila label="posición" valor={`${pos.toFixed(2)} m`} />
        </div>
        <p className="text-[9px] text-slate-500 mt-3">La rampa mide {LONGITUD_RAMPA} m; el bloque parte de {POS_INICIAL_RAMPA} m.</p>
      </div>

      {/* DOCK */}
      <div className="absolute bottom-6 inset-x-0 z-40 flex justify-center pointer-events-none px-4">
        <div className="bg-[#0f172a]/95 backdrop-blur-2xl border border-white/10 p-5 rounded-[2.5rem] flex flex-wrap items-center justify-center gap-6 pointer-events-auto">
          <ControlSlider label="Ángulo θ" value={angulo} min={0} max={60} step={0.5} unit="°" disabled={bloqueado} onChange={(v) => setPlano2({ angulo: v })} />
          <ControlSlider label="Fuerza aplicada F" value={empuje} min={-200} max={600} step={1} unit=" N" disabled={bloqueado} onChange={(v) => setPlano2({ empuje: v })} />
          <div className="flex flex-col gap-1 items-center">
            <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.3em]">Carga extra</span>
            <button disabled={bloqueado} onClick={() => { setPlano2({ cargaExtra: (cargaExtra + 5) % 30 }); audio?.playPop(); }}
              className="px-5 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl text-[11px] font-black disabled:opacity-40">+{cargaExtra} kg</button>
          </div>
          <button onClick={lanzar} disabled={bloqueado}
            className="h-14 px-10 bg-sky-600 hover:bg-sky-500 disabled:opacity-40 text-white font-black text-[11px] uppercase tracking-[0.3em] rounded-[2rem] active:scale-95 transition-all">
            Soltar bloque
          </button>
          <button onClick={reiniciar} aria-label="Regresar el bloque al centro"
            className="w-14 h-14 bg-white/5 hover:bg-white/10 border border-white/10 rounded-[2rem] flex items-center justify-center text-white/60">
            <RotateCcw size={22} />
          </button>
        </div>
      </div>

      <div className="absolute bottom-36 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok && !corriendo} onValidate={onValidate}
          texto="Tu predicción coincide con la aceleración medida. Valida tu práctica." />
      </div>
    </div>
  );
}

function DataBox({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-[#020617]/80 p-2.5 rounded-xl border border-white/5">
      <span className="text-[8px] font-black text-slate-500 uppercase tracking-[0.15em] block">{label}</span>
      <span className="text-sm font-black text-white font-mono">{value}</span>
    </div>
  );
}

function Fila({ label, valor }: { label: string; valor: string }) {
  return (
    <div className="flex justify-between text-xs">
      <span className="text-slate-500">{label}</span>
      <span className="text-white font-black">{valor}</span>
    </div>
  );
}

function ControlSlider({ label, value, min, max, step, unit, disabled, onChange }: {
  label: string; value: number; min: number; max: number; step: number; unit: string; disabled?: boolean; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-2 min-w-[200px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{label}</span>
        <span className="text-lg font-black text-white">{value}{unit}</span>
      </div>
      <input type="range" min={min} max={max} step={step} value={value} disabled={disabled}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-2 bg-slate-800 rounded-full appearance-none cursor-pointer accent-sky-500 disabled:opacity-40" />
    </div>
  );
}
