"use client";

import React, { useState, useEffect } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AlertTriangle, CheckCircle2, RefreshCcw, Wind } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import { validarQ2 } from '@/domain/quimica';
import dynamic from 'next/dynamic';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from '@/components/simulador/LabLayout';

const Gas3DScene = dynamic(() => import('./simuladores/qmi02/Gas3DScene'), {
  ssr: false,
  loading: () => (
    <div className="flex h-full w-full flex-col items-center justify-center gap-3 bg-[#1e293b]">
      <div className="h-10 w-10 animate-spin rounded-full border-4 border-[#38bdf8]/20 border-t-[#38bdf8]" />
      <span className="text-[11px] font-semibold uppercase tracking-widest text-[#38bdf8]">Cargando cámara de presión…</span>
    </div>
  )
});

export default function PilotoLeyesGases({ isWorktableDark, isProfesor, onValidate }: { isWorktableDark: boolean, isProfesor: boolean, onValidate?: () => void }) {
  const updateGases = useSimuladorStore(state => state.updateGases);
  const resetGases = useSimuladorStore(state => state.resetGases);
  const validarQ2Store = useSimuladorStore(state => state.validarQ2);

  // Selectores atómicos para el estado de los gases
  const T = useSimuladorStore(state => state.gases.T || 300);
  const V = useSimuladorStore(state => state.gases.V || 10);
  const P = useSimuladorStore(state => state.gases.P || 1.0);
  const n = useSimuladorStore(state => state.gases.n || 0.406);
  const pTarget = useSimuladorStore(state => state.gases.pTarget || 3.5);
  const isExploded = useSimuladorStore(state => state.gases.isExploded || false);
  const gasType = useSimuladorStore(state => state.gases.gasType || 'He');
  const gasStatus = useSimuladorStore(state => state.gases.status ?? 'idle');

  const [mounted, setMounted] = useState(false);
  const [aviso, setAviso] = useState<string | null>(null);

  // La semilla (presión objetivo) la pone `entrarLab('quimica-2')` antes de montar el panel.
  useEffect(() => { setMounted(true); }, []);
  useEffect(() => { setAviso(null); }, [T, V, n]);

  // Efecto para Audio de Error (Explosión)
  useEffect(() => {
    if (isExploded) {
      audio.playError();
      if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
    }
  }, [isExploded]);

  // Un solo juez: el validador de la práctica. Sin `onValidate` (uso aislado) se
  // valida en el store y se avisa con la misma regla de dominio.
  const handleValidar = () => {
    if (onValidate) { onValidate(); return; }
    if (validarQ2Store()) audio.playSuccess();
    else {
      audio.playError();
      setAviso('La presión aún no coincide con el objetivo (±0.1 atm).');
    }
  };
  const enObjetivo = validarQ2({ P, pTarget, isExploded } as any);

  if (!mounted) return null;

  const mensaje = gasStatus === 'success' ? 'Presión certificada' : enObjetivo ? 'Presión en el objetivo: valida la práctica' : aviso;

  const escena = (
    <div className="relative h-full w-full">
      <Gas3DScene temperature={T} volume={V} moles={n} pressure={P} isExploded={isExploded} gasType={gasType as any} />
      {isExploded && (
        <div className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3">
          <div className="pointer-events-auto max-w-sm rounded-2xl border border-red-400/50 bg-[#0f1a2b] p-3 text-center shadow-2xl">
            <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-red-400" />
            <h2 className="text-base font-bold text-white">Falla de contención</h2>
            <p className="mt-1 text-[13px] leading-snug text-slate-300">La presión interna superó el límite de seguridad de <b className="text-red-300">7,0 atm</b> y el pistón salió despedido. Reinicia la cámara para continuar.</p>
            <button onClick={resetGases} className="mx-auto mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-red-500">
              <RefreshCcw size={14} /> Reiniciar cámara
            </button>
          </div>
        </div>
      )}
    </div>
  );

  const barraSuperior = (
    <>
      <Lectura etiqueta="Presión" valor={P.toFixed(2)} unidad="atm" acento={P > 6.0} title="Lectura del manómetro" />
      <Lectura etiqueta="Objetivo" valor={pTarget.toFixed(2)} unidad="atm" />
      <Lectura etiqueta="T" valor={T.toFixed(0)} unidad="K" />
      <Lectura etiqueta="V" valor={V.toFixed(1)} unidad="L" />
      <Lectura etiqueta="n" valor={n.toFixed(3)} unidad="mol" />
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <GrupoControles>
        <Deslizador etiqueta="Termostato" valor={T} min={100} max={1000} paso={10} unidad="K" onChange={(v) => updateGases(v, V, n)} ancho="w-44" />
        <Deslizador etiqueta="Pistón (volumen)" valor={V} min={2} max={15} paso={0.1} unidad="L" onChange={(v) => updateGases(T, v, n)} ancho="w-44" />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Gas</span>
          <Segmentado
            opciones={[{ valor: 'He', texto: 'He' }, { valor: 'Ne', texto: 'Ne' }, { valor: 'CO2', texto: 'CO₂' }]}
            valor={gasType as 'He' | 'Ne' | 'CO2'}
            onChange={(g) => useSimuladorStore.getState().setGasType(g as any)}
          />
        </div>
        <BotonLab variante="secundario" title="Abrir la válvula: inyecta 0,05 mol" onClick={() => updateGases(T, V, Math.min(2.0, n + 0.05))}><Wind size={14} /> Inyectar gas</BotonLab>
        <div className="ml-auto flex items-center gap-2">
          <BotonLab variante="secundario" title="Reiniciar" onClick={resetGases}><RefreshCcw size={14} /> Reiniciar</BotonLab>
          <BotonLab onClick={handleValidar}><CheckCircle2 size={14} /> Validar</BotonLab>
        </div>
      </GrupoControles>
      {mensaje && !isExploded && (
        <div className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${gasStatus === 'success' || enObjetivo ? 'border-emerald-500/40 bg-emerald-500/15 text-emerald-300' : 'border-amber-500/40 bg-amber-500/15 text-amber-300'}`}>{mensaje}</div>
      )}
    </div>
  );

  // El éxito lo anuncia el flujo común (quiz + modal); aquí solo un aviso pequeño.
  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
