"use client";

import React, { useState, useEffect, useRef, useMemo } from 'react';
import { RotateCcw, ShieldAlert, Activity } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { dinamicaPlano, evaluarF2, LONGITUD_RAMPA, POS_INICIAL_RAMPA, G_TIERRA } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';

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
  // sentido del movimiento durante el ensayo: solo orienta la flecha de fricción (la escena no la dibuja en reposo)
  const movimiento = corriendo ? dinamicaPlano({ angulo, empuje, masa, muS, muK }).estado : 'reposo';

  return (
    <LabLayout
      escena={
        <PlanoInclinado3DScene
          angulo={angulo} bloquePos={pos / LONGITUD_RAMPA} masa={masa} cargaExtra={cargaExtra} muK={muK}
          isDeslizando={corriendo} fuerzaAplicada={empuje} movimiento={movimiento}
        />
      }
      esquina={
        <div className="rounded-lg border border-white/10 bg-[#0f1a2b]/85 px-2.5 py-1.5 font-mono text-[11px] leading-tight text-slate-100 backdrop-blur">
          <div className="mb-0.5 text-[9px] font-semibold uppercase tracking-wider text-sky-300">Sensor de movimiento</div>
          t {tel.t.toFixed(2)} s · v {tel.v.toFixed(2)} m/s · x {pos.toFixed(2)} m
        </div>
      }
      barraSuperior={
        <>
          <Lectura etiqueta="Masa m" valor={masa} unidad="kg" />
          <Lectura etiqueta="Ángulo θ" valor={angulo} unidad="°" />
          <Lectura etiqueta="Fuerza F" valor={empuje} unidad="N" acento />
          <Lectura etiqueta="μ estático" valor={muS.toFixed(2)} />
          <Lectura etiqueta="μ cinético" valor={muK.toFixed(2)} />
          <Lectura etiqueta="g" valor={G_TIERRA} unidad="m/s²" />
        </>
      }
      tituloPanel="Ensayo"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-snug text-slate-300">
            F actúa paralela a la rampa (+ hacia arriba). Toma la aceleración como positiva hacia ARRIBA de la rampa. En el diagrama de cuerpo libre: W peso, N normal, F aplicada y f fricción cinética (solo aparece mientras el bloque desliza).
          </p>
          <p className="text-[10px] text-slate-500">La rampa mide {LONGITUD_RAMPA} m (cinta con cifras cada 2,5 m); el bloque parte de {POS_INICIAL_RAMPA} m.</p>
          {medicion && (
            <div className={`rounded-lg border p-2.5 ${veredicto?.ok ? 'border-emerald-500/40 bg-emerald-900/30' : 'border-white/10 bg-white/[0.04]'}`}>
              <span className="flex items-center gap-1.5 text-[10px] font-bold uppercase tracking-wider text-slate-300"><Activity size={11} /> Medición del ensayo</span>
              {medicion.estado === 'reposo' ? (
                <p className="mt-1 text-[11px] text-amber-300">El bloque quedó en reposo. Un ensayo sin movimiento no sirve para comprobar la aceleración.</p>
              ) : (
                <p className="mt-1 text-[11px] text-slate-200">
                  El bloque {medicion.estado === 'sube' ? 'subió' : 'bajó'} {medicion.s.toFixed(2)} m en {medicion.t.toFixed(2)} s (v final = {medicion.v.toFixed(2)} m/s).
                </p>
              )}
            </div>
          )}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <label className="flex min-w-[150px] flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">a predicha (m/s²)</span>
              <input type="number" step="0.01" placeholder="0.00" value={prediccion} disabled={bloqueado}
                onChange={(e) => setPrediccion(e.target.value)}
                className="h-8 w-full rounded-lg border border-white/15 bg-slate-950 px-2.5 font-mono text-[14px] text-white outline-none focus:border-[#219EBC] disabled:opacity-50" />
            </label>
            <Deslizador etiqueta="Ángulo θ" unidad="°" valor={angulo} min={0} max={60} paso={0.5} deshabilitado={bloqueado} onChange={(v) => setPlano2({ angulo: v })} />
            <Deslizador etiqueta="Fuerza F" unidad="N" valor={empuje} min={-200} max={600} paso={1} deshabilitado={bloqueado} onChange={(v) => setPlano2({ empuje: v })} />
            <BotonLab variante="secundario" deshabilitado={bloqueado} onClick={() => { setPlano2({ cargaExtra: (cargaExtra + 5) % 30 }); audio?.playPop(); }}>Carga extra +{cargaExtra} kg</BotonLab>
            <BotonLab onClick={lanzar} deshabilitado={bloqueado}>Soltar bloque</BotonLab>
            <BotonLab variante="secundario" onClick={reiniciar} title="Regresar el bloque al centro"><RotateCcw size={14} /> Reiniciar</BotonLab>
          </GrupoControles>
          {(alerta || medicion || (veredicto?.ok && !corriendo)) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              {medicion && medicion.estado !== 'reposo' && !alerta && (
                <div className={`rounded-lg border px-3 py-1 text-[12px] font-bold leading-snug ${veredicto?.ok ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : 'border-white/15 bg-white/[0.05] text-slate-200'}`}>
                  {veredicto?.ok ? 'Tu predicción coincide con la medición.' : veredicto?.mensaje}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok && !corriendo} onValidate={onValidate} className="!px-3 !py-1.5"
                texto="Tu predicción coincide con la aceleración medida. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
