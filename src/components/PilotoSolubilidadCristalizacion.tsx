"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { solubilidadA, TABLAS_SOLUBILIDAD, type TablaSolubilidad } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import { Flame, Snowflake, Layout, RotateCcw, CheckCircle2 } from 'lucide-react';
import Solubilidad3DScene from './simuladores/qmi06/Solubilidad3DScene';
import LabLayout, { Lectura, BotonLab, Segmentado } from '@/components/simulador/LabLayout';

type Sustancia = { id: string; nombre: string; formula: string; color: string; tabla: TablaSolubilidad; desc: string };

// Respaldo por si el store aún no trae el catálogo (mismas tablas CRC del dominio).
const SUSTANCIAS_RESPALDO: Sustancia[] = [
  { id: 'kno3', nombre: 'Nitrato de Potasio', formula: 'KNO₃', color: '#ffffff', tabla: TABLAS_SOLUBILIDAD.kno3, desc: 'Muy dependiente de la temperatura.' },
  { id: 'nacl', nombre: 'Cloruro de Sodio', formula: 'NaCl', color: '#f8fafc', tabla: TABLAS_SOLUBILIDAD.nacl, desc: 'Curva casi plana.' },
  { id: 'cuso4', nombre: 'Sulfato de Cobre (II)', formula: 'CuSO₄', color: '#3b82f6', tabla: TABLAS_SOLUBILIDAD.cuso4, desc: 'Cristaliza como pentahidrato azul.' },
  { id: 'kclo3', nombre: 'Clorato de Potasio', formula: 'KClO₃', color: '#e2e8f0', tabla: TABLAS_SOLUBILIDAD.kclo3, desc: 'Muy poco soluble en frío.' },
];

// La temperatura avanza 4 veces por segundo con el tiempo real (dt en s); el
// store no escribe si el cambio es despreciable.
const PASO_TERMICO_MS = 250;

export default function PilotoSolubilidadCristalizacion({ onValidate }: { onValidate?: () => void }) {
  const { solubilidad, setUbicacionVaso, addSalSolubilidad, setSustanciaSolubilidad, updateTemperaturaP6, resetP6, validarP6 } =
    useSimuladorStore(useShallow((s) => ({
      solubilidad: s.solubilidad, setUbicacionVaso: s.setUbicacionVaso, addSalSolubilidad: s.addSalSolubilidad,
      setSustanciaSolubilidad: s.setSustanciaSolubilidad, updateTemperaturaP6: s.updateTemperaturaP6,
      resetP6: s.resetP6, validarP6: s.validarP6,
    })));
  const [mounted, setMounted] = useState(false);
  const tempInterval = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    let ultimo = performance.now();
    tempInterval.current = setInterval(() => {
      const ahora = performance.now();
      updateTemperaturaP6(Math.min(1, (ahora - ultimo) / 1000));
      ultimo = ahora;
    }, PASO_TERMICO_MS);
    return () => { if (tempInterval.current) clearInterval(tempInterval.current); };
  }, [updateTemperaturaP6]);

  const sustancias: Sustancia[] = solubilidad.sustancias?.length ? solubilidad.sustancias : SUSTANCIAS_RESPALDO;
  const sIdx = (typeof solubilidad.sustanciaIdx === 'number') ? solubilidad.sustanciaIdx : 0;
  const sActual = sustancias[sIdx] || sustancias[0];

  // Solubilidad tabulada (CRC) interpolada a la temperatura actual, g / 100 g de agua.
  const limite = solubilidadA(sActual.tabla, solubilidad.temp);
  const salSolida = Math.max(0, solubilidad.salAgregada - limite);
  const saturationRatio = Math.min(1, solubilidad.salAgregada / (limite || 1));
  const estadoQuimico = salSolida > 0.05
    ? 'SATURADA + CRISTALES'
    : solubilidad.salAgregada / (limite || 1) > 0.98 ? 'SATURADA' : 'INSATURADA';

  // Alerta de Cristalización Narrativa
  useEffect(() => {
    if (salSolida > 1 && solubilidad.ubicacion === 'hielo') {
      audio?.playNotification();
    }
  }, [salSolida > 1, solubilidad.ubicacion === 'hielo']);

  if (!mounted) return null;

  const estaciones = [
    { valor: 'parrilla' as const, texto: 'Parrilla' },
    { valor: 'mesa' as const, texto: 'Mesa' },
    { valor: 'hielo' as const, texto: 'Baño de hielo' },
  ];
  const iconoEst = { parrilla: <Flame size={13} />, mesa: <Layout size={13} />, hielo: <Snowflake size={13} /> };

  const escena = (
    <Solubilidad3DScene
      temp={solubilidad.temp}
      salAgregada={solubilidad.salAgregada}
      salSolida={salSolida}
      sustanciaId={sActual.id}
      formula={sActual.formula}
      nombre={sActual.nombre}
      ubicacion={solubilidad.ubicacion}
    />
  );

  const barraSuperior = (
    <>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">100 g de H₂O</span>
        <span className="text-[14px] font-bold text-white">{sActual.nombre}</span>
      </div>
      <Lectura etiqueta="T" valor={solubilidad.temp.toFixed(1)} unidad="°C" acento={solubilidad.temp > 25} />
      <Lectura etiqueta="Sal" valor={solubilidad.salAgregada.toFixed(1)} unidad="g" />
      <Lectura etiqueta="Solubilidad" valor={limite.toFixed(1)} unidad="g" title="g de sal por 100 g de agua a la temperatura del vaso (tabla CRC)" />
      <span className={`shrink-0 rounded-lg px-2.5 py-1 text-[11px] font-bold uppercase tracking-wider ${salSolida > 0.05 ? 'bg-orange-500/90 text-black' : 'border border-emerald-500/30 bg-emerald-500/15 text-emerald-300'}`}>
        {estadoQuimico}
      </span>
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <Segmentado
          etiqueta="Estación del vaso"
          opciones={estaciones}
          valor={solubilidad.ubicacion}
          onChange={(v) => { setUbicacionVaso(v); audio.playPop(); }}
        />
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Sustancia</span>
          <div className="flex gap-1">
            {sustancias.map((s, i) => (
              <button key={s.id} onClick={() => { setSustanciaSolubilidad(i); audio.playPop(); }} title={s.nombre} aria-pressed={sIdx === i}
                className={`h-8 rounded-lg border px-2.5 text-[12px] font-bold transition-colors ${sIdx === i ? 'border-orange-400/70 bg-orange-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
                {s.formula}
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Añadir sal</span>
          <div className="flex gap-1.5">
            {[1, 5, 20].map((g) => (
              <BotonLab key={g} variante="acento" deshabilitado={solubilidad.salAgregada + g > 300} onClick={() => { addSalSolubilidad(g); audio.playPop(); }}>+{g} g</BotonLab>
            ))}
          </div>
        </div>
        <div className="flex items-end gap-1.5">
          <BotonLab onClick={() => {
            // Un solo juez: el validador de la práctica (quiz + modal comunes).
            if (onValidate) { onValidate(); return; }
            if (validarP6()) audio.playSuccess(); else audio.playError();
          }}>Verificar cristalización</BotonLab>
          <button aria-label="Reiniciar el vaso" title="Reiniciar el vaso" onClick={() => { resetP6(); audio.playRemove(); }}
            className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className={`flex items-center gap-1.5 ${solubilidad.disueltoEnCaliente ? 'text-emerald-300' : 'text-slate-400'}`}>
          <CheckCircle2 size={13} /> {solubilidad.disueltoEnCaliente ? 'Disolución en caliente lograda' : 'Aún sin disolución en caliente'}
        </span>
        <span className="text-slate-400">{iconoEst[solubilidad.ubicacion]} {sActual.desc}</span>
        {solubilidad.status === 'success' && <span className="font-semibold text-emerald-300">Cristalización por enfriamiento lograda</span>}
      </div>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
