"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { RotateCcw, CheckCircle2, Flame, Minus, Plus } from 'lucide-react';
import { validarQ10, PUREZA_REQUERIDA_Q10, VOL_REQUERIDO_Q10 } from '@/domain/quimica';
import Destilacion3DScene from './simuladores/qmi10/Destilacion3DScene';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';

// La simulación avanza 4 veces por segundo con el tiempo real transcurrido.
const PASO_DESTILACION_MS = 250;

export default function PilotoDestilacionFraccionada({ isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { destilacion, setCalorManta, updateDestilacion, resetP10, validarP10, audio } = useSimuladorStore(useShallow((s) => ({
    destilacion: s.destilacion, setCalorManta: s.setCalorManta, updateDestilacion: s.updateDestilacion,
    resetP10: s.resetP10, validarP10: s.validarP10, audio: s.audio,
  })));
  const [intentado, setIntentado] = useState(false);
  // useRef en lugar de useState para lastTick — evita stale closure en el setInterval
  const lastTickRef = useRef(Date.now());
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Loop de simulación local (más fluido que el tick global)
  // Corrección stale closure: el intervalo NO depende de lastTick como estado.
  // Actualiza lastTickRef.current directamente sin re-crear el intervalo en cada tick.
  useEffect(() => {
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(1, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      updateDestilacion(dt);
    }, PASO_DESTILACION_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const temp = destilacion.tempMezcla;
  const volEtanol = destilacion.volEtanolMatraz;
  const volAgua = destilacion.volAguaMatraz;
  const volDestilado = destilacion.volDestilado;
  // Alcoholímetro: % v/v de etanol del destilado ACUMULADO (lo que juzga el validador).
  const pur = destilacion.purezaDestilado;
  const tempCabeza = destilacion.tempCabeza;
  const tasa = destilacion.tasa;
  const hierve = tasa > 0;
  const simStatus = destilacion.status;
  const veredicto = validarQ10(destilacion);

  const puedeValidar = volDestilado >= VOL_REQUERIDO_Q10;

  const handleCertificar = () => {
    audio?.playClick?.();
    setIntentado(true);
    // Un solo juez: el validador de la práctica (quiz + modal comunes).
    if (onValidate) { onValidate(); return; }
    if (validarP10()) audio?.playSuccess?.(); else audio?.playError?.();
  };

  if (!mounted) return null;

  const escena = (
    <Destilacion3DScene
      temp={temp}
      volMatraz={volEtanol + volAgua}
      volDestilado={volDestilado}
      pureza={pur}
      tasa={tasa}
      tempCabeza={tempCabeza}
      consigna={destilacion.calorManta}
    />
  );

  const barraSuperior = (
    <>
      <Lectura etiqueta="Matraz" valor={temp.toFixed(1)} unidad="°C" />
      <Lectura etiqueta="Cabeza" valor={tempCabeza.toFixed(1)} unidad="°C" acento={hierve} />
      <Lectura etiqueta="Destilado" valor={volDestilado.toFixed(1)} unidad="mL" />
      <Lectura etiqueta="Alcohol" valor={volDestilado > 0 ? pur.toFixed(1) : '--'} unidad="% v/v" acento={volDestilado > 0 && pur >= PUREZA_REQUERIDA_Q10} />
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><Flame size={12} className="text-orange-400" /> Manta calefactora (consigna)</span>
          <div className="flex items-center gap-1.5">
            {[-5, -1].map((d) => (
              <button key={d} aria-label={`Bajar la manta ${-d} °C`} onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop(); }}
                className="flex h-8 w-10 items-center justify-center gap-0.5 rounded-lg border border-white/15 bg-white/5 text-[12px] font-bold text-white hover:border-[#219EBC]"><Minus size={11} />{-d}</button>
            ))}
            <span className="min-w-[64px] rounded-lg border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-center font-mono text-[15px] font-semibold tabular-nums text-orange-200">{destilacion.calorManta}<span className="ml-0.5 text-[11px] text-orange-300/80">°C</span></span>
            {[1, 5].map((d) => (
              <button key={d} aria-label={`Subir la manta ${d} °C`} onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop(); }}
                className="flex h-8 w-10 items-center justify-center gap-0.5 rounded-lg bg-orange-500 text-[12px] font-bold text-white hover:bg-orange-600"><Plus size={11} />{d}</button>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          {puedeValidar && simStatus !== 'success' && (
            <BotonLab variante="acento" onClick={handleCertificar}><CheckCircle2 size={14} /> Certificar destilación</BotonLab>
          )}
          <button aria-label="Reiniciar la destilación" title="Reiniciar la destilación" onClick={() => { resetP10(); setIntentado(false); audio?.playPop(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="text-slate-400">{hierve ? `Hierve: caudal ${(tasa * 60).toFixed(1)} mL/min; el vapor sube por la columna y condensa en el Liebig.` : 'Sin ebullición: la mezcla aún no llega a su punto de burbuja.'}</span>
        <span className="text-slate-400">Colecta {VOL_REQUERIDO_Q10} mL con el destilado ≥ {PUREZA_REQUERIDA_Q10} % v/v.</span>
        {(simStatus === 'success' || (intentado && simStatus === 'error' && veredicto.mensaje)) && (
          <span className={simStatus === 'success' ? 'font-semibold text-emerald-300' : 'text-amber-200'}>
            {simStatus === 'success' ? 'Destilado certificado' : veredicto.mensaje}
          </span>
        )}
      </div>
    </div>
  );

  const panelLateral = isProfesor ? (
    <p className="text-[12px] italic leading-relaxed text-slate-300">
      «La mezcla 1:1 hierve hacia los 83 °C y la cabeza de la columna marca ~78 °C mientras sube vapor rico en etanol. Con la manta apenas por encima de la ebullición (85–95 °C) la columna trabaja casi a reflujo y el destilado supera el 85 % v/v; si se calienta a fondo, la columna se inunda y el destilado sale más aguado.»
    </p>
  ) : undefined;

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} panelLateral={panelLateral} tituloPanel="Docente" panelAbiertoInicial={false} />;
}
