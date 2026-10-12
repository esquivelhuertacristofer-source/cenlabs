"use client";

import React, { useState, useEffect } from 'react';
import { ShieldAlert } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { CARGAS_UC, RANGO_R9_CM, K_COULOMB, evaluarF9, tipoInteraccion } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';

const Electrostatica3DScene = dynamic(() => import('./simuladores/fis09/Electrostatica3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#03040a] flex items-center justify-center text-blue-400 font-black text-xs uppercase tracking-[0.3em]">Cargando esferas...</div>
});

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

export default function PilotoElectrostatica({ onValidate }: { onValidate?: () => void }) {
  const { e, setElectrostatica9, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    e: s.electrostatica9, setElectrostatica9: s.setElectrostatica9, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { q1, q2, distancia, reto, respuesta, tipoRespuesta } = e;

  const [fInput, setFInput] = useState(respuesta !== null ? String(respuesta) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF9> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      pose: 'thinking',
      text: "Bienvenido al laboratorio de electrostática. Explora cómo cambia la fuerza entre dos esferas cargadas y después resuelve el reto con la Ley de Coulomb: F = k·|q₁q₂|/r²."
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [respuesta, tipoRespuesta]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const explorar = (data: Partial<typeof e>) => setElectrostatica9(data);

  const guardarF = (v: string) => {
    setFInput(v);
    const f = parseFloat(v);
    setElectrostatica9({ respuesta: Number.isFinite(f) ? f : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF9(e);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  const selector = (etiqueta: string, valor: number, onChange: (v: number) => void) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-300">{etiqueta}</span>
      <select value={valor} onChange={(ev) => onChange(parseInt(ev.target.value, 10))}
        className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 font-mono text-[13px]">
        {CARGAS_UC.map((q) => <option key={q} value={q}>{fmtQ(q)}</option>)}
      </select>
    </label>
  );

  return (
    <LabLayout
      escena={<Electrostatica3DScene q1={q1} q2={q2} distancia={distancia} isAtraccion={tipoInteraccion(q1, q2) === 'atraccion'} />}
      barraSuperior={
        <>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-300">Reto</span>
          <Lectura etiqueta="q₁" valor={fmtQ(reto.q1)} acento />
          <Lectura etiqueta="q₂" valor={fmtQ(reto.q2)} acento />
          <Lectura etiqueta="r" valor={reto.r} unidad="cm" acento />
          <span className="mx-1 h-5 w-px shrink-0 bg-white/15" />
          <Lectura etiqueta="Banco q₁" valor={fmtQ(q1)} />
          <Lectura etiqueta="q₂" valor={fmtQ(q2)} />
          <Lectura etiqueta="r" valor={distancia} unidad="cm" />
        </>
      }
      tituloPanel="Datos"
      panelLateral={
        <div className="flex flex-col gap-3 text-[11px] text-slate-300">
          <p>Dos esferas pequeñas, tratadas como cargas puntuales. El reto pide la fuerza para q₁, q₂ y r de la franja «Reto»; el banco te deja explorar otras configuraciones.</p>
          <p className="font-mono text-slate-400">k = {(K_COULOMB / 1e9).toFixed(3)}×10⁹ N·m²/C² · 1 μC = 10⁻⁶ C · 1 cm = 10⁻² m</p>
          <p className="text-slate-400">Las flechas naranjas son el par acción-reacción: su longitud crece o decrece con |F| en escala logarítmica y sin cifras. Si duplicas r, ¿qué le pasa a la flecha?</p>
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            {selector('q₁ (esfera fija)', q1, (v) => explorar({ q1: v }))}
            {selector('q₂ (esfera móvil)', q2, (v) => explorar({ q2: v }))}
            <Deslizador etiqueta="Separación r" valor={distancia} min={RANGO_R9_CM.min} max={RANGO_R9_CM.max} paso={RANGO_R9_CM.paso} unidad="cm" decimales={0} ancho="w-52"
              onChange={(v) => explorar({ distancia: v })} />
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-44 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">|F| del reto (N)</span>
              <input type="number" step="any" value={fInput} onChange={(ev) => guardarF(ev.target.value)} placeholder="F = k·|q₁q₂|/r²"
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
            </label>
            <Segmentado etiqueta="Interacción del reto" valor={tipoRespuesta ?? ''} onChange={(t) => setElectrostatica9({ tipoRespuesta: t as 'atraccion' | 'repulsion', resultado: null })}
              opciones={[{ valor: 'atraccion', texto: 'Atracción' }, { valor: 'repulsion', texto: 'Repulsión' }]} />
            <BotonLab variante="acento" onClick={comprobar}>Comprobar</BotonLab>
          </GrupoControles>
          {(alerta || veredicto?.ok) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Fuerza e interacción correctas. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
