"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Power, ShieldAlert } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { MOTOR, ESPIRAS10, RANGO_V10, estadoMotor, evaluarF10, type Polo } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';

const MotorElectrico3DScene = dynamic(() => import('./simuladores/fis10/MotorElectrico3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#03040a] flex items-center justify-center text-orange-400 font-black text-xs uppercase tracking-[0.3em]">Montando motor...</div>
});

export default function PilotoMotorElectrico({ onValidate }: { onValidate?: () => void }) {
  const { m, setMotor10, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    m: s.motor10, setMotor10: s.setMotor10, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { imanIzq, imanDer, voltaje, espiras, carga, encendido, reto, vPrediccion, ensayo } = m;

  const [vInput, setVInput] = useState(vPrediccion !== null ? String(vPrediccion) : '');
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electromecánica. Coloca los imanes para que su campo atraviese la bobina, elige el bobinado y predice el voltaje que da la velocidad pedida con la carga del freno.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  // Cualquier cambio de configuración desenergiza: cada arranque es un ensayo.
  const ajustar = (data: Partial<typeof m>) => setMotor10({ ...data, encendido: false, resultado: null });

  const est = useMemo(() => estadoMotor({ voltaje, espiras, imanIzq, imanDer, carga }), [voltaje, espiras, imanIzq, imanDer, carga]);
  const rpmVisible = encendido ? est.rpm : 0;

  const guardarV = (v: string) => {
    setVInput(v);
    const x = parseFloat(v);
    setMotor10({ vPrediccion: Number.isFinite(x) ? x : null, resultado: null });
  };

  const energizar = () => {
    if (encendido) { setMotor10({ encendido: false }); audio?.playPop(); return; }
    if (vPrediccion === null) { audio?.playError(); return avisar('Escribe primero el voltaje que predices para el reto.'); }
    setMotor10({ encendido: true, ensayo: { voltaje, espiras, imanIzq, imanDer, carga, vPrediccion }, resultado: null });
    if (est.sinCampo) avisar('Con dos polos iguales enfrentados no hay campo que atraviese la bobina: el rotor no gira.');
    else if (!est.arranca) avisar('El rotor no arranca: el par motor no vence al de la carga con este voltaje.');
    audio?.playPop();
  };

  const veredicto = useMemo(() => (ensayo ? evaluarF10({ reto, ensayo }) : null), [ensayo, reto]);

  return (
    <LabLayout
      escena={
        <MotorElectrico3DScene imanIzq={imanIzq} imanDer={imanDer} espiras={espiras} rpm={rpmVisible}
          corriente={encendido ? est.corriente : 0} voltaje={voltaje} encendido={encendido} />
      }
      barraSuperior={
        <>
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-300">Reto</span>
          <Lectura etiqueta="n" valor={reto.rpmObjetivo} unidad="rpm" acento />
          <Lectura etiqueta="Giro" valor={reto.sentido} acento />
          <Lectura etiqueta="Par" valor={reto.carga} unidad="N·m" acento />
          <span className="mx-0.5 h-5 w-px shrink-0 bg-white/15" />
          <Lectura etiqueta="Tacómetro" valor={encendido ? Math.round(Math.abs(rpmVisible)) : '—'} unidad={encendido ? 'rpm' : undefined} />
          <Lectura etiqueta="I" valor={encendido ? est.corriente.toFixed(2) : '—'} unidad={encendido ? 'A' : undefined} />
        </>
      }
      tituloPanel="Datos"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="text-[11px] leading-relaxed text-slate-300">
            Imanes: B = {MOTOR.B} T · Bobina: A = {(MOTOR.A * 1e4).toFixed(0)} cm² · R = {MOTOR.rEspira} Ω por espira.
            El sentido se mira desde el conmutador (hacia el frente de la escena).
            {encendido && rpmVisible !== 0 ? ` Giro actual: ${rpmVisible > 0 ? 'horario' : 'antihorario'}.` : ''}
          </p>
          {ensayo && (
            <div className={`rounded-lg border p-3 text-[12px] ${veredicto?.ok ? 'border-emerald-500/40 bg-emerald-900/30 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Último arranque</span>
              <p className="mt-1">{ensayo.voltaje.toFixed(1)} V · N = {ensayo.espiras} · imanes {ensayo.imanIzq}–{ensayo.imanDer} · predicción {ensayo.vPrediccion} V</p>
              <p className="mt-1 font-bold">{veredicto?.ok ? 'Velocidad, sentido y predicción correctos.' : veredicto?.mensaje}</p>
            </div>
          )}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Segmentado etiqueta="Imán izquierdo (polo hacia la bobina)" valor={imanIzq} onChange={(p) => ajustar({ imanIzq: p as Polo })} opciones={[{ valor: 'N', texto: 'N' }, { valor: 'S', texto: 'S' }]} />
            <Segmentado etiqueta="Imán derecho" valor={imanDer} onChange={(p) => ajustar({ imanDer: p as Polo })} opciones={[{ valor: 'N', texto: 'N' }, { valor: 'S', texto: 'S' }]} />
            <Segmentado etiqueta="Espiras N" valor={String(espiras)} onChange={(n) => ajustar({ espiras: Number(n) })} opciones={ESPIRAS10.map((n) => ({ valor: String(n), texto: String(n) }))} />
            <Deslizador etiqueta="Fuente de CD" valor={voltaje} min={RANGO_V10.min} max={RANGO_V10.max} paso={RANGO_V10.paso} unidad="V" decimales={1}
              onChange={(v) => ajustar({ voltaje: Math.round(v * 10) / 10 })} />
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-48 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">Voltaje que predices (V)</span>
              <input type="number" step="0.1" value={vInput} onChange={(e) => guardarV(e.target.value)} placeholder="V = k·ω + I·Rₐ" disabled={encendido}
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400 disabled:opacity-50" />
            </label>
            <BotonLab onClick={energizar} variante={encendido ? 'acento' : 'primario'}><Power size={14} /> {encendido ? 'Cortar energía' : 'Energizar'}</BotonLab>
            {alerta && (
              <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                <ShieldAlert size={14} /> {alerta}
              </div>
            )}
            <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="El motor cumple el reto y tu predicción es correcta. Valida tu práctica." />
          </GrupoControles>
        </div>
      }
    />
  );
}
