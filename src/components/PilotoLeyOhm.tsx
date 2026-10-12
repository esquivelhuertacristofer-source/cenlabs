"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { Play, Pause, ShieldAlert, Wrench } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { LED, RANGO_V8, RANGO_R8, R_INTERNA_FUENTE, corrienteLed, evaluarF8 } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import { bandasConNombre } from './simuladores/fis08/codigoColores';

const Ohm3DScene = dynamic(() => import('./simuladores/fis08/Ohm3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-blue-400 font-black text-xs uppercase tracking-[0.3em]">Montando protoboard...</div>
});

export default function PilotoLeyOhm({ onValidate }: { onValidate?: () => void }) {
  const { ohm8, setOhm8, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    ohm8: s.ohm8, setOhm8: s.setOhm8, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { nivel, voltaje, resistencia, switchOn, ledRoto, bateriaConectada, resistenciaConectada, ledConectado, rCalculada, ensayo } = ohm8;

  const [rInput, setRInput] = useState(rCalculada !== null ? String(rCalculada) : '');
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electrónica. Un LED rojo necesita unos 2 V y 20 mA. Calcula la resistencia que limita la corriente a 20 mA con tu fuente, móntala y cierra el circuito.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const conR = nivel >= 2;
  const circuitoArmado = bateriaConectada && ledConectado && (!conR || resistenciaConectada);
  const corriente = switchOn && !ledRoto && circuitoArmado ? corrienteLed(voltaje, conR ? resistencia : null) : 0;
  const mA = corriente * 1000;
  const vR = conR ? corriente * resistencia : 0;
  const vLed = corriente > 0 ? LED.vf : 0;

  // Cualquier cambio en la fuente o en la caja abre el interruptor: cada cierre es un ensayo.
  const ajustar = (data: Partial<typeof ohm8>) => setOhm8({ ...data, switchOn: false, resultado: null });

  const cambiarNivel = (n: number) => {
    audio?.playNotification();
    setOhm8({ nivel: n, switchOn: false, ledRoto: false, bateriaConectada: false, resistenciaConectada: false, ledConectado: false, resultado: null });
  };

  const toggleConexion = (c: 'bateria' | 'resistencia' | 'led') => {
    if (switchOn) return avisar('Abre el circuito antes de mover componentes.');
    audio?.playPop();
    if (c === 'bateria') setOhm8({ bateriaConectada: !bateriaConectada });
    if (c === 'resistencia') setOhm8({ resistenciaConectada: !resistenciaConectada });
    if (c === 'led') setOhm8({ ledConectado: !ledConectado });
  };

  const guardarR = (v: string) => {
    setRInput(v);
    const r = parseFloat(v);
    setOhm8({ rCalculada: Number.isFinite(r) ? r : null, resultado: null });
  };

  const toggleSwitch = () => {
    if (switchOn) { setOhm8({ switchOn: false }); audio?.playPop(); return; }
    if (ledRoto) { audio?.playError(); return avisar('El LED está quemado: cámbialo antes de volver a cerrar.'); }
    if (!circuitoArmado) { audio?.playError(); return avisar(conR ? 'Conecta fuente, resistencia y LED (clic en cada pieza).' : 'Conecta la fuente y el LED (clic en cada pieza).'); }
    if (conR && rCalculada === null) { audio?.playError(); return avisar('Escribe primero la R que calculaste: el diseño va antes que el ensayo.'); }
    const I = corrienteLed(voltaje, conR ? resistencia : null);
    const roto = I > LED.iDestruccion;
    const nuevo = conR ? { voltaje, resistencia, rCalculada, corriente: I, ledRoto: roto } : ensayo;
    setOhm8({ switchOn: !roto, ledRoto: roto, ensayo: nuevo, resultado: null });
    if (roto) { audio?.playError(); avisar(`¡El LED se quemó! Pasaron ${(I * 1000).toFixed(0)} mA y su máximo es ${LED.iMax * 1000} mA.`); }
    else audio?.playPop();
  };

  // Feedback del último ensayo, con la misma regla que el validador.
  const veredicto = useMemo(() => (ensayo ? evaluarF8({ ensayo }) : null), [ensayo]);
  const bandas = useMemo(() => bandasConNombre(resistencia), [resistencia]);

  const conexiones: ['bateria' | 'resistencia' | 'led', string, boolean][] = [
    ['bateria', 'Fuente', bateriaConectada],
    ...(conR ? [['resistencia', 'Resistencia', resistenciaConectada] as ['resistencia', string, boolean]] : []),
    ['led', 'LED', ledConectado],
  ];

  return (
    <LabLayout
      escena={
        <Ohm3DScene
          nivel={nivel} voltaje={voltaje} resistencia={resistencia}
          switchOn={switchOn} ledRoto={ledRoto} corrienteMA={mA}
          bateriaConectada={bateriaConectada} resistenciaConectada={resistenciaConectada} ledConectado={ledConectado}
          onToggleConexion={toggleConexion}
        />
      }
      barraSuperior={
        <>
          {conR && <Lectura etiqueta="R montada" valor={resistencia.toFixed(0)} unidad="Ω" />}
          <Lectura etiqueta="I" valor={mA.toFixed(1)} unidad="mA" acento={mA > LED.iMax * 1000} />
          {conR && <Lectura etiqueta="V resistencia" valor={vR.toFixed(2)} unidad="V" />}
          <Lectura etiqueta="V LED" valor={vLed.toFixed(2)} unidad="V" />
          <Lectura etiqueta="Circuito" valor={switchOn ? 'cerrado' : 'abierto'} acento={switchOn} />
        </>
      }
      tituloPanel="Datos"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-slate-400">LED rojo: V<sub>f</sub> ≈ {LED.vf} V · I nominal {LED.iNominal * 1000} mA · máx. {LED.iMax * 1000} mA. Resistencia interna de la fuente: {R_INTERNA_FUENTE} Ω.</p>
          {conR && (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2.5">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Código de colores de la R montada</span>
              <div className="mt-1.5 flex items-center gap-1.5">
                {bandas.map((b, i) => <span key={i} title={b.nombre} className="h-4 w-4 rounded-full border border-white/30" style={{ background: b.color }} />)}
              </div>
              <p className="mt-1 text-[11px] text-slate-300">{bandas.map((b) => b.nombre).join(' · ')}</p>
            </div>
          )}
          {ensayo && (
            <div className={`rounded-lg border p-3 text-[12px] ${veredicto?.ok ? 'border-emerald-500/40 bg-emerald-900/30 text-emerald-200' : 'border-white/10 bg-white/[0.04] text-slate-200'}`}>
              <span className="text-[10px] font-bold uppercase tracking-wider text-white/60">Último ensayo con resistencia</span>
              <p className="mt-1">{ensayo.voltaje} V · {ensayo.resistencia} Ω → {(ensayo.corriente * 1000).toFixed(1)} mA{ensayo.ledRoto ? ' (LED quemado)' : ''}</p>
              <p className="mt-1 font-bold">{veredicto?.ok ? 'Diseño correcto: el LED trabaja a su corriente nominal.' : veredicto?.mensaje}</p>
            </div>
          )}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Segmentado etiqueta="Módulo" valor={String(nivel)} onChange={(v) => cambiarNivel(Number(v))}
              opciones={[{ valor: '1', texto: '01 sin resistencia' }, { valor: '2', texto: '02 con resistencia' }]} />
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Conexiones (o clic en la pieza)</span>
              <div className="flex gap-1">
                {conexiones.map(([c, nombre, ok]) => (
                  <button key={c} type="button" onClick={() => toggleConexion(c)} aria-pressed={ok}
                    className={`h-8 rounded-lg border px-3 text-[11px] font-semibold ${ok ? 'border-emerald-500/50 bg-emerald-700/70 text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'}`}>
                    {ok ? '✓ ' : ''}{nombre}
                  </button>
                ))}
              </div>
            </div>
            <BotonLab onClick={toggleSwitch} variante={switchOn ? 'acento' : 'primario'}>
              {switchOn ? <><Pause size={14} /> Abrir circuito</> : <><Play size={14} /> Cerrar circuito</>}
            </BotonLab>
            {ledRoto && <BotonLab variante="secundario" onClick={() => { setOhm8({ ledRoto: false }); audio?.playPop(); }}><Wrench size={14} /> Cambiar el LED</BotonLab>}
          </GrupoControles>
          <GrupoControles>
            <Deslizador etiqueta="Fuente" valor={voltaje} min={RANGO_V8.min} max={RANGO_V8.max} paso={RANGO_V8.paso} unidad="V" decimales={1} onChange={(v) => ajustar({ voltaje: v })} />
            {conR && (
              <>
                <Deslizador etiqueta="Caja de resistencias" valor={resistencia} min={RANGO_R8.min} max={RANGO_R8.max} paso={RANGO_R8.paso} unidad="Ω" decimales={0} onChange={(v) => ajustar({ resistencia: v })} />
                <label className="flex w-36 flex-col gap-1">
                  <span className="text-[11px] font-semibold text-amber-300">R calculada (Ω)</span>
                  <input type="number" step="1" value={rInput} onChange={(e) => guardarR(e.target.value)} placeholder="para 20 mA"
                    className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
                </label>
              </>
            )}
          </GrupoControles>
          {(alerta || veredicto?.ok) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tu resistencia limita el LED a 20 mA. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
