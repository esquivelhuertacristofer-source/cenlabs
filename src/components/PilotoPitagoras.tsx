"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { CATETO_MIN_M4, CATETO_MAX_M4 } from '@/domain/matematicas';
import { Droplets, Target, RefreshCcw, ShieldCheck } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Pitagoras3DScene from './simuladores/mat04/Pitagoras3DScene';

export default function PilotoPitagoras({ onValidate }: { onValidate?: () => void }) {
  const { pitagoras, setCatetosM4, setLlenadoM4, setUserInputM4, generarSemillaM4, resetM4, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      pitagoras: s.pitagoras, setCatetosM4: s.setCatetosM4, setLlenadoM4: s.setLlenadoM4, setUserInputM4: s.setUserInputM4,
      generarSemillaM4: s.generarSemillaM4, resetM4: s.resetM4, audio: s.audio, setAsistente: s.setAsistente,
      pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  
  const [mounted, setMounted] = useState(false);
  const [isPouring, setIsPouring] = useState(false);
  const llenadoRef = useRef(0);

  useEffect(() => { 
    setMounted(true); 
    setAsistente({
      visible: true,
      text: "Bienvenido al Laboratorio de Geometría de Fluidos. Tu misión es verificar el Teorema de Pitágoras llenando el volumen del cuadrado de la hipotenusa con el fluido de los catetos.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const { catetoA = 3, catetoB = 4, llenado = 0, userInputC = '', status = 'idle', escenario = 'pitagoras_basico' } = pitagoras ?? {};

  const areaA = (catetoA || 3) * (catetoA || 3);
  const areaB = (catetoB || 4) * (catetoB || 4);

  // Animación de llenado: progreso LOCAL a ~60 Hz con requestAnimationFrame y una
  // sola escritura al store (100 %) al terminar. Cambiar un cateto la interrumpe.
  const [llenadoVista, setLlenadoVista] = useState(llenado);
  useEffect(() => { if (!isPouring) setLlenadoVista(llenado); }, [llenado, isPouring]);
  useEffect(() => {
    if (!isPouring) return;
    let raf = 0;
    const t0 = performance.now() - (llenadoRef.current / 100) * 1000;
    const paso = (t: number) => {
      const v = Math.min(100, ((t - t0) / 1000) * 100);
      llenadoRef.current = v;
      setLlenadoVista(v);
      if (v >= 100) { setIsPouring(false); setLlenadoM4(100); audio?.playSuccess(); return; }
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [isPouring, setLlenadoM4, audio]);

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (catetoA !== 3 || catetoB !== 4) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (llenado >= 100 && userInputC !== '' && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [catetoA, catetoB, llenado, userInputC, status, pasoActual, setPasoActual]);

  if (!mounted || !pitagoras) return null;

  const pasos = ['Dimensiones', 'Cálculo', 'Validación'];
  const nombres: Record<string, [string, string, string]> = {
    pitagoras_basico: ['cateto a', 'cateto b', 'hipotenusa c'],
    diseno_rampas: ['base a', 'altura b', 'rampa c'],
    navegacion_maritima: ['rumbo este a', 'rumbo norte b', 'ruta directa c'],
  };
  const nom = nombres[escenario] ?? nombres.pitagoras_basico;

  return (
    <LabLayout
      tituloPanel="Guía"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="Cateto a" valor={`${catetoA}`} />
          <Lectura etiqueta="Cateto b" valor={`${catetoB}`} />
          <Lectura etiqueta="a²" valor={`${areaA} u²`} />
          <Lectura etiqueta="b²" valor={`${areaB} u²`} />
          <label className="ml-auto flex shrink-0 items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider text-slate-400">
            Escenario
            <select
              value={escenario}
              onChange={(e) => { generarSemillaM4(e.target.value as any); audio?.playPop(); }}
              className="h-7 cursor-pointer rounded-lg border border-emerald-500/30 bg-emerald-500/10 px-2 text-[11px] font-bold normal-case tracking-normal text-emerald-300 outline-none hover:bg-emerald-500/20"
            >
              <option value="pitagoras_basico">Teorema básico</option>
              <option value="diseno_rampas">Diseño de rampas</option>
              <option value="navegacion_maritima">Navegación marítima</option>
            </select>
          </label>
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {pasos[Math.min(2, Math.max(0, pasoActual - 1))]} · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Pitagoras3DScene catetoA={catetoA || 3} catetoB={catetoB || 4} llenado={isPouring ? llenadoVista : llenado} escenario={escenario || 'pitagoras_basico'} />
        </div>
      }
      panelLateral={
        <div className="space-y-3 text-slate-300">
          <p>Tres tanques cuadrados, uno sobre cada lado del triángulo. Vierte el fluido de los catetos en el tanque de la hipotenusa: el volumen que llena es a² + b².</p>
          <p>En este escenario: <b className="text-white">{nom[0]}</b>, <b className="text-white">{nom[1]}</b> y <b className="text-white">{nom[2]}</b>.</p>
        </div>
      }
      controles={
        <div className="space-y-2">
          <GrupoControles>
            <Deslizador etiqueta="Longitud cateto A" valor={catetoA || 3} min={CATETO_MIN_M4} max={CATETO_MAX_M4} paso={1} decimales={0} ancho="w-48" onChange={(v) => { setCatetosM4(v, catetoB || 4); audio?.playPop(); }} />
            <Deslizador etiqueta="Longitud cateto B" valor={catetoB || 4} min={CATETO_MIN_M4} max={CATETO_MAX_M4} paso={1} decimales={0} ancho="w-48" onChange={(v) => { setCatetosM4(catetoA || 3, v); audio?.playPop(); }} />
          </GrupoControles>
          <GrupoControles className="items-center">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-semibold text-slate-300">Hipotenusa c</span>
              <input
                type="text" inputMode="decimal" value={userInputC} onChange={(e) => setUserInputM4(e.target.value)} placeholder="Valor de c…"
                className="h-8 w-32 rounded-lg border border-white/10 bg-white/5 px-3 font-mono text-[13px] font-bold text-white outline-none focus:border-emerald-500"
              />
            </div>
            <BotonLab variante="primario" deshabilitado={isPouring || llenado === 100} onClick={() => { llenadoRef.current = 0; setIsPouring(true); audio?.playPop(); }}>
              <Droplets size={14} className={isPouring ? 'animate-bounce' : ''} /> Verter fluido
            </BotonLab>
            <BotonLab variante="secundario" title="Nuevo triángulo" onClick={() => { setIsPouring(false); llenadoRef.current = 0; resetM4(); generarSemillaM4(); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Nuevo
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} deshabilitado={llenado < 100} title={llenado < 100 ? 'Primero vierte el fluido' : 'Validar práctica'} onClick={() => onValidate?.()}>
              {status === 'success' ? <ShieldCheck size={14} /> : <Target size={14} />} {status === 'success' ? 'Validado' : 'Validar'}
            </BotonLab>
          </GrupoControles>
        </div>
      }
    />
  );
}
