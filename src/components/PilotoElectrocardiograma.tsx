"use client";

import React, { useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Syringe, ShieldCheck, ShieldAlert, RotateCcw, Activity, X, ArrowRight, Stethoscope } from 'lucide-react';
import { FARMACOS_B8, FC_NORMAL_MIN_B8, FC_NORMAL_MAX_B8, evaluarB8 } from '@/domain/biologia';
import type { FarmacoB8 } from '@/store/types';
import type { Derivacion } from './simuladores/bio08/electro';
import LabLayout from './simulador/LabLayout';
import RaizLabEstrella from './simulador/RaizLabEstrella';

const Electrocardiograma3DScene = dynamic(() => import('./simuladores/bio08/Electrocardiograma3DScene'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-[#060b13] text-[13px] font-semibold text-rose-200">Preparando el electrocardiógrafo…</div>,
});

const PASO = 'flex shrink-0 items-center gap-1.5 text-[13px] font-semibold text-slate-200';
const NUM = 'flex h-5 w-5 items-center justify-center rounded-full bg-white/10 text-[13px] font-bold leading-none text-white';
const BOTON = 'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const coma = (s: string) => s.replace('.', ',');

/** Ecuaciones y simplificaciones: se abre sobre el lab a petición (cerrado por defecto). */
function Modelo({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="absolute inset-x-2 top-2 z-30 mx-auto flex max-h-[calc(100%-1rem)] max-w-[640px] flex-col rounded-xl border border-white/15 bg-[#0b1422]/95 shadow-2xl backdrop-blur" role="dialog" aria-label="Cómo está hecho el modelo" data-modelo-b8="">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-2">
        <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={16} /></button>
      </div>
      <div className="min-h-0 space-y-2 overflow-y-auto px-3 py-2.5 text-[13px] leading-snug text-slate-300">
        <p>La activación recorre el corazón 3D desde el nodo SA (aurículas), el nodo AV, el haz de His, sus ramas y la red de Purkinje: tiempo de llegada τ de la ecuación eikonal |∇τ|·v = 1 (aurícula 0,9 m/s, ventrículo 0,6 m/s, Purkinje 2,5 m/s).</p>
        <p>Vector cardiaco: D(t) = −K∮V<sub>m</sub>(t)·n dA sobre la pared (capa doble equivalente), con V<sub>m</sub> = 1 entre la despolarización τ y la repolarización ρ. La repolarización empieza antes en el epicardio y en las zonas tardías: por eso la T sale en el mismo sentido que el QRS.</p>
        <p>Cada derivación es una proyección: V = D·û. I = LA − RA, II = LL − RA, III = LL − LA, de modo que I + III = II.</p>
        <p>Simplificaciones: triángulo de Einthoven ideal (torso homogéneo), K calibrado para un QRS de 1,9 mV, tiempos del dominio (PR 160 ms, QRS 90 ms, QT de Bazett), mecánica esquemática (cada punto se contrae ≈ 25 ms después de activarse) y fármacos que sólo cambian la frecuencia del SA. Las fibras de Purkinje se dibujan más gruesas para que se vean.</p>
      </div>
    </div>
  );
}

/**
 * El monitor NO muestra la FC: el alumno la mide en la tira de papel (R-R con el calibrador,
 * o contando cuadros grandes) y la calcula. ritmoBPM sólo alimenta el nodo SA del modelo. El
 * diagnóstico de llegada se registra antes de tratar; luego titula fármacos hasta ritmo
 * sinusal normal. La escena (corazón, vector, Einthoven) y la tira leen el mismo reloj.
 *
 * Los mandos van por partes (primero sólo el diagnóstico; al registrarlo se abren el bolo y
 * la FC medida) y la franja de arriba dice siempre qué toca. Al validar sin éxito, esa franja enseña el mensaje del juez del dominio
 * (el mismo `evaluarB8` que decide la práctica): orienta, no da la respuesta.
 */
export default function PilotoElectrocardiograma({ onValidate }: { onValidate?: () => void }) {
  const cardio = useSimuladorStore((s) => s.cardio);
  const setCardio = useSimuladorStore((s) => s.setCardio);
  const administrarFarmacoB8 = useSimuladorStore((s) => s.administrarFarmacoB8);
  const resetB8 = useSimuladorStore((s) => s.resetB8);
  const { ritmoBPM, dosis, diagnostico, lecturaFC } = cardio;
  const [lecturaTexto, setLecturaTexto] = useState('');
  const [derivacion, setDerivacion] = useState<Derivacion>('II');
  const [modelo, setModelo] = useState(false);
  const [cambiandoDx, setCambiandoDx] = useState(false);
  const [dictamen, setDictamen] = useState<{ ok: boolean; texto: string; clave: string } | null>(null);

  const dosisTotales = Object.values(dosis).reduce((s, x) => s + x, 0);
  const tratamientoIniciado = dosisTotales > 0;
  // el veredicto vale para lo que se validó: cualquier cambio (bolo, diagnóstico o FC) lo retira
  const clave = `${dosisTotales}|${diagnostico}|${lecturaFC}`;
  const veredicto = dictamen && dictamen.clave === clave ? dictamen : null;

  const administrar = (f: FarmacoB8) => {
    administrarFarmacoB8(f);
    setLecturaTexto(''); // tras un fármaco hay que volver a medir
    audio?.playPop();
  };
  const reiniciar = () => { resetB8(); setLecturaTexto(''); setCambiandoDx(false); setDictamen(null); };
  const validar = () => {
    const v = evaluarB8(useSimuladorStore.getState().cardio);
    setDictamen({ clave, ok: v.ok, texto: v.ok ? 'Paciente en ritmo sinusal normal y FC bien medida. Pasas a la evaluación.' : (v.mensaje ?? 'Aún falta algo: revisa los tres pasos.') });
    onValidate?.();
  };
  const acciones = (
    <div className="ml-auto flex items-center gap-1.5">
      <button type="button" onClick={reiniciar} title="Reiniciar: el mismo paciente, desde su llegada" aria-label="Reiniciar"
        className={`${BOTON} border border-white/15 bg-white/[0.04] !px-2.5 text-slate-200 hover:text-white`}><RotateCcw size={15} /></button>
      <button type="button" onClick={validar} title="Validar práctica" className={`${BOTON} bg-[#FB8500] text-white hover:bg-[#e07700]`}><ShieldCheck size={15} /> Validar</button>
    </div>
  );

  const rango = `${FC_NORMAL_MIN_B8}–${FC_NORMAL_MAX_B8} lpm`;
  // Por partes: primero sólo el diagnóstico; al registrarlo se abren el tratamiento y la medida.
  const parte1 = diagnostico === null || cambiandoDx;
  const guia = parte1
    ? 'mide el R-R con las marcas A y B y registra el diagnóstico.'
    : !tratamientoIniciado
      ? 'aplica un bolo del fármaco indicado y vuelve a medir el R-R.'
      : lecturaFC === null
        ? `FC = 60 000 / R-R (ms). Escríbela; la meta es ${rango}.`
        : `si tu FC ya está en ${rango}, valida; si no, otro bolo y mide.`;

  const controles = (
    <div className="flex flex-col gap-2" data-mandos-b8="">
      {veredicto ? (
        <div role="alert" data-veredicto-b8={veredicto.ok ? 'ok' : 'falla'}
          className={`flex items-start gap-2 rounded-lg border px-3 py-2 text-[13px] font-semibold leading-snug ${veredicto.ok ? 'border-emerald-400/50 bg-emerald-600/20 text-emerald-100' : 'border-amber-400/60 bg-amber-500/15 text-amber-100'}`}>
          {veredicto.ok ? <ShieldCheck size={16} className="mt-0.5 shrink-0" /> : <ShieldAlert size={16} className="mt-0.5 shrink-0" />}
          <span>{veredicto.ok ? '' : 'Todavía no. '}{veredicto.texto}</span>
        </div>
      ) : (
        <p role="status" data-guia-b8="" className="flex items-start gap-2 rounded-lg border border-sky-300/20 bg-sky-400/[0.07] px-3 py-2 text-[13px] leading-snug text-slate-200"
          title="FC (lpm) = 60 000 / R-R en ms = 300 / cuadros grandes entre dos R">
          <ArrowRight size={16} className="mt-0.5 shrink-0 text-sky-300" />
          <span><b className="font-semibold text-sky-200">Ahora te toca: </b>{guia}</span>
        </p>
      )}
      {parte1 ? (
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Diagnóstico de llegada">
            <span className={PASO}><span className={NUM}>1</span><Stethoscope size={14} /> Diagnóstico</span>
            {(['bradicardia', 'taquicardia'] as const).map((d) => (
              <button key={d} type="button" onClick={() => { setCardio({ diagnostico: d }); setCambiandoDx(false); audio?.playPop(); }} aria-pressed={diagnostico === d}
                title={d === 'bradicardia' ? `Bradicardia sinusal: menos de ${FC_NORMAL_MIN_B8} lpm` : `Taquicardia sinusal: más de ${FC_NORMAL_MAX_B8} lpm`}
                className={`${BOTON} border ${diagnostico === d ? 'border-rose-400 bg-rose-700/70 text-white' : 'border-white/15 bg-white/[0.04] text-slate-100 hover:border-rose-300/60 hover:text-white'}`}>
                {d === 'bradicardia' ? 'Bradicardia' : 'Taquicardia'}
              </button>
            ))}
          </div>
          {acciones}
        </div>
      ) : (
        <>
          <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Tratamiento en bolo intravenoso">
            <span className={PASO} title="Tratamiento: bolo intravenoso"><span className={NUM}>2</span><Syringe size={14} /></span>
            {(Object.keys(FARMACOS_B8) as FarmacoB8[]).map((f) => {
              const info = FARMACOS_B8[f];
              return (
                <button key={f} type="button" disabled={dosis[f] >= info.max} onClick={() => administrar(f)}
                  title={`Bolo IV de ${info.nombre} ${coma(info.dosis)}: llevas ${dosis[f]} de ${info.max}`}
                  className={`${BOTON} border border-white/15 bg-white/[0.04] !px-2 text-slate-100 hover:border-rose-400`}>
                  {info.nombre} {coma(info.dosis)} <span className="font-mono tabular-nums text-slate-400">{dosis[f]}/{info.max}</span>
                </button>
              );
            })}
          </div>
          <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
            <label className="flex items-center gap-1.5">
              <span className={`${PASO} !text-amber-300`}><span className={`${NUM} !bg-amber-400/20 !text-amber-200`}>3</span><Activity size={14} /> FC que mediste</span>
              <input type="number" min={20} max={250} step={1} value={lecturaTexto} placeholder="¿?" inputMode="numeric"
                title={`La calculas tú a partir del R-R. Ritmo sinusal normal: ${rango}`}
                onChange={(e) => {
                  setLecturaTexto(e.target.value);
                  const v = Math.round(Number(e.target.value));
                  setCardio({ lecturaFC: e.target.value !== '' && Number.isFinite(v) ? v : null });
                }}
                className="h-9 w-[76px] rounded-lg border border-amber-500/50 bg-slate-950 px-2.5 font-mono text-[14px] text-white outline-none focus:border-amber-400" />
              <span className="text-[13px] text-slate-400">lpm</span>
            </label>
            <button type="button" disabled={tratamientoIniciado} onClick={() => setCambiandoDx(true)}
              aria-label="Cambiar el diagnóstico de llegada"
              title={tratamientoIniciado ? `Diagnóstico de llegada: ${diagnostico}. Queda fijo al iniciar el tratamiento.` : `Diagnóstico de llegada: ${diagnostico}. Pulsa para cambiarlo (sólo antes del primer bolo).`}
              className={`${BOTON} border border-white/15 bg-white/[0.04] !px-2 text-slate-200 hover:text-white`}><span className={NUM}>1</span><Stethoscope size={14} /></button>
            {acciones}
          </div>
        </>
      )}
    </div>
  );

  return (
    <RaizLabEstrella id="biologia-8">
      <LabLayout
        escena={<Electrocardiograma3DScene ritmoBPM={ritmoBPM} derivacion={derivacion} onDerivacion={setDerivacion} modelo={modelo} onModelo={() => setModelo((m) => !m)} />}
        controles={controles}
      />
      {modelo && <Modelo onCerrar={() => setModelo(false)} />}
    </RaizLabEstrella>
  );
}
