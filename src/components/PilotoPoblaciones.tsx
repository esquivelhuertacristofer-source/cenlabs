"use client";

import React, { useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldCheck, Play, Square, Activity } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { pasoRK4B10, extincionB10, equilibrioLVB10, DT_B10, T_OBJETIVO_B10, RANGOS_B10 } from '@/domain/biologia';
import type { ParametrosLVB10 } from '@/store/types';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';

const Poblaciones3DScene = dynamic(() => import('./simuladores/bio10/Poblaciones3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#0b1220] flex items-center justify-center text-emerald-400 font-black text-xs uppercase tracking-[0.3em]">Saliendo al prado...</div>,
});

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
  const extincionVista = !corriendo && corrida ? corrida.extincion : false;

  const slider = (etiqueta: string, k: keyof ParametrosLVB10) => (
    <Deslizador key={k} etiqueta={etiqueta} valor={parametros[k]} min={RANGOS_B10[k].min} max={RANGOS_B10[k].max} paso={RANGOS_B10[k].paso}
      decimales={3} ancho="w-52" onChange={(v) => cambiarParametro(k, v)} />
  );

  return (
    <LabLayout
      escena={
        <Poblaciones3DScene
          presas={hud.x} depredadores={hud.y} historial={historialEscena} simulando={corriendo}
          inicial={{ x: presasIniciales, y: depredadoresIniciales }} equilibrio={{ x: eq.presas, y: eq.depredadores }} tMax={T_OBJETIVO_B10}
          extincion={extincionVista}
        />
      }
      barraSuperior={
        <>
          <Lectura etiqueta="Año" valor={hud.t.toFixed(1)} />
          <Lectura etiqueta="Presas" valor={hud.x.toFixed(0)} />
          <Lectura etiqueta="Depredadores" valor={hud.y.toFixed(0)} />
          {!corriendo && corrida && (
            <Lectura acento etiqueta="Resultado" valor={corrida.extincion
              ? `colapso (${corrida.extincion}) · año ${corrida.t.toFixed(1)}`
              : `sostenido ${corrida.t.toFixed(0)} años`} />
          )}
        </>
      }
      tituloPanel="Misión"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="flex gap-2 text-[12px] leading-snug"><Activity size={16} className="mt-0.5 shrink-0 text-blue-300" />
            Ajusta los parámetros para que presas y depredadores coexistan {T_OBJETIVO_B10} años sin que ninguna especie baje de 1 individuo.
            Población inicial: {presasIniciales} presas y {depredadoresIniciales} depredadores.</p>
          <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5 text-[11px] space-y-1">
            <div className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Punto de equilibrio de estos parámetros</div>
            <div className="font-mono text-white">x* = γ/δ = {eq.presas.toFixed(1)} presas</div>
            <div className="font-mono text-white">y* = α/β = {eq.depredadores.toFixed(1)} depredadores</div>
            <p className="text-[10px] text-slate-500">Las poblaciones giran alrededor de este punto; cuanto más lejos arrancan, más amplia la oscilación.</p>
          </div>
        </div>
      }
      controles={
        <GrupoControles>
          {slider('Natalidad de presas (α)', 'alpha')}
          {slider('Tasa de captura (β)', 'beta')}
          {slider('Mortalidad de depredadores (γ)', 'gamma')}
          {slider('Conversión presa → depredador (δ)', 'delta')}
          <BotonLab variante={corriendo ? 'acento' : 'primario'} onClick={corriendo ? detener : correr}>
            {corriendo ? <Square size={14} fill="currentColor" /> : <Play size={14} fill="currentColor" />}
            {corriendo ? 'Detener' : `Correr ${T_OBJETIVO_B10} años`}
          </BotonLab>
          <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()} deshabilitado={corriendo}><ShieldCheck size={14} /> Validar</BotonLab>
        </GrupoControles>
      }
    />
  );
}
