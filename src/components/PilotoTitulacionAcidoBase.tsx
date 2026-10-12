"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { phTitulacion, validarQ7, VIRAJE_FENOLFTALEINA, CAPACIDAD_BURETA_ML } from '@/domain/quimica';
import {
  XAxis, YAxis, CartesianGrid,
  ResponsiveContainer, ReferenceLine, AreaChart, Area
} from 'recharts';
import { RotateCcw, Droplets, Target, FlaskConical, Send } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import Titulacion3DScene from './simuladores/qmi07/Titulacion3DScene';
import LabLayout, { Lectura, BotonLab, Deslizador } from '@/components/simulador/LabLayout';

// La bureta escribe en el store a ~8 Hz; la apertura de la válvula fija cuánto
// cae en cada paso (de una gota de 0.03 mL a un chorro de ~1 mL).
const PASO_BURETA_MS = 120;
const volumenPorPaso = (apertura: number) => 0.02 + Math.pow(apertura / 100, 2) * 1.0;

export default function PilotoTitulacionAcidoBase({ onValidate }: { onValidate?: () => void }) {
  const {
    titulacion, addDropNaOH, toggleIndicadorP7, togglePurgaP7, resetP7, setRespuestaP7, validarP7
  } = useSimuladorStore(useShallow((s) => ({
    titulacion: s.titulacion, addDropNaOH: s.addDropNaOH, toggleIndicadorP7: s.toggleIndicadorP7,
    togglePurgaP7: s.togglePurgaP7, resetP7: s.resetP7, setRespuestaP7: s.setRespuestaP7, validarP7: s.validarP7,
  })));

  const [mounted, setMounted] = useState(false);
  const [valveValue, setValveValue] = useState(0);
  const [ansCa, setAnsCa] = useState('');
  const [intentado, setIntentado] = useState(false);
  const flowInterval = useRef<NodeJS.Timeout | null>(null);

  // La semilla ([HCl] desconocida) la pone `entrarLab('quimica-7')` antes de montar el panel.
  useEffect(() => { setMounted(true); }, []);

  const abierta = valveValue > 10;
  const paso = volumenPorPaso(valveValue);
  useEffect(() => {
    if (!abierta) return;
    flowInterval.current = setInterval(() => addDropNaOH(paso), PASO_BURETA_MS);
    return () => { if (flowInterval.current) clearInterval(flowInterval.current); };
  }, [abierta, paso, addDropNaOH]);

  // pH del matraz con el volumen añadido (al abrir el lab, el del ácido solo).
  const currentPH = phTitulacion(titulacion.ca, titulacion.va, titulacion.cb, titulacion.volumenBase);
  const buretaVacia = titulacion.volumenBase >= CAPACIDAD_BURETA_ML;
  const veredicto = validarQ7(titulacion);

  const enviar = () => {
    const val = parseFloat(ansCa.replace(',', '.'));
    if (isNaN(val)) return;
    setValveValue(0);
    setRespuestaP7(val);
    setIntentado(true);
    // Un solo juez: el validador de la práctica (quiz + modal comunes).
    if (onValidate) onValidate();
    else if (validarP7()) audio?.playSuccess(); else audio?.playError();
  };

  // Alerta de Viraje Narrativa
  useEffect(() => {
    if (currentPH > 8.15 && currentPH < 8.5 && titulacion.indicador) {
       audio?.playNotification();
    }
    if (currentPH >= 9.5 && titulacion.indicador) {
       audio?.playError();
       audio?.playNotification();
    }
  }, [currentPH > 8.2, titulacion.indicador]);

  if (!mounted) return null;

  const estadoPH = currentPH >= VIRAJE_FENOLFTALEINA ? 'Básico' : currentPH > 7.05 ? 'Lig. básico' : currentPH >= 6.95 ? 'Neutro' : 'Ácido';

  const escena = (
    <Titulacion3DScene
      volumenBase={titulacion.volumenBase}
      ph={currentPH}
      indicador={titulacion.indicador}
      flowRate={valveValue / 100}
      purgada={titulacion.purgada}
      va={titulacion.va}
      cb={titulacion.cb}
    />
  );

  const barraSuperior = (
    <>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Titulación ácido-base</span>
        <span className="text-[14px] font-bold text-white">HCl ? M con NaOH {titulacion.cb} M</span>
      </div>
      <Lectura etiqueta="Bureta" valor={buretaVacia ? 'vacía' : titulacion.volumenBase.toFixed(2)} unidad={buretaVacia ? undefined : 'mL'} acento />
      <Lectura etiqueta="pH" valor={currentPH.toFixed(2)} />
      <span className="shrink-0 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider text-slate-200">{estadoPH}</span>
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Preparación</span>
          <div className="flex gap-1.5">
            <button onClick={() => { togglePurgaP7(); audio.playPop(); }} aria-pressed={titulacion.purgada}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${titulacion.purgada ? 'border-blue-400/60 bg-blue-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <FlaskConical size={13} /> {titulacion.purgada ? 'Bureta purgada' : 'Cargar y purgar bureta'}
            </button>
            <button onClick={() => { toggleIndicadorP7(); audio.playPop(); }} aria-pressed={titulacion.indicador}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${titulacion.indicador ? 'border-pink-400/60 bg-pink-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <Droplets size={13} /> {titulacion.indicador ? 'Fenolftaleína añadida' : 'Añadir fenolftaleína'}
            </button>
          </div>
        </div>
        <Deslizador etiqueta="Llave de la bureta" valor={valveValue} min={0} max={100} paso={1} unidad="%" ancho="w-52" deshabilitado={buretaVacia}
          onChange={(v) => setValveValue(v)} />
        <div className="flex items-end gap-1.5">
          <div className="flex flex-col gap-1">
            <label htmlFor="ca-q7" className="text-[11px] font-semibold text-slate-300">[HCl] calculada</label>
            <div className="flex items-center gap-1.5">
              <input id="ca-q7" type="number" step="0.001" inputMode="decimal" aria-label="Concentración de HCl calculada, en mol/L" placeholder="mol/L"
                value={ansCa} onChange={(e) => setAnsCa(e.target.value)} onKeyDown={(e) => e.key === 'Enter' && enviar()}
                className="h-8 w-28 rounded-lg border border-white/15 bg-white/5 px-2.5 font-mono text-[13px] text-white outline-none focus:border-blue-400/60" />
              <span className="text-[12px] text-slate-400">mol/L</span>
            </div>
          </div>
          <BotonLab onClick={enviar}><Send size={13} /> Finalizar y enviar</BotonLab>
          <button aria-label="Repetir la titulación" title="Repetir la titulación" onClick={() => { resetP7(); setValveValue(0); setIntentado(false); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="flex items-center gap-1.5 text-slate-400"><Target size={13} className="text-pink-400" /> Detente en el primer rosa tenue persistente (la fenolftaleína vira en pH 8,2).</span>
        {(titulacion.status === 'success' || (intentado && titulacion.status === 'error' && veredicto.mensaje)) && (
          <span className={titulacion.status === 'success' ? 'font-semibold text-emerald-300' : 'text-amber-200'}>
            {titulacion.status === 'success' ? 'Concentración de HCl determinada' : veredicto.mensaje}
          </span>
        )}
      </div>
    </div>
  );

  const panelLateral = (
    <div className="flex flex-col gap-2">
      <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Curva de valoración (pH del matraz)</span>
      <div className="h-44 w-full">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={titulacion.history}>
            <defs>
              <linearGradient id="curveGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#ec4899" stopOpacity={0.8} />
                <stop offset="95%" stopColor="#3b82f6" stopOpacity={0.1} />
              </linearGradient>
            </defs>
            <CartesianGrid strokeDasharray="4 4" stroke="rgba(255,255,255,0.08)" vertical={false} />
            <XAxis dataKey="vol" type="number" domain={[0, CAPACIDAD_BURETA_ML]} tick={{ fill: '#94a3b8', fontSize: 10 }} />
            <YAxis domain={[0, 14]} tick={{ fill: '#94a3b8', fontSize: 10 }} width={24} />
            <Area type="monotone" dataKey="ph" stroke="#ec4899" strokeWidth={2} fill="url(#curveGrad)" isAnimationActive={false} dot={false} />
            <ReferenceLine y={7} stroke="rgba(255,255,255,0.25)" strokeDasharray="6 4" />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <span className="text-[11px] text-slate-400">Eje X: mL de NaOH añadidos · Eje Y: pH.</span>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} panelLateral={panelLateral} tituloPanel="Curva" panelAbiertoInicial={false} />;
}
