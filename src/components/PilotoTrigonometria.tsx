"use client";

import React, { useState, useEffect, useRef } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Eye, EyeOff, Target, Zap, Pause, Play, RotateCcw } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import Trigonometria3DScene from './simuladores/mat05/Trigonometria3DScene';

/**
 * MAT-05 · Círculo trigonométrico.
 * Reto (semilla): resolver sen θ = v o cos θ = v en [0°, 360°). Hay DOS
 * soluciones por vuelta; el alumno lleva el vector a cada una y la captura.
 * El validador exige las dos y ninguna captura que no cumpla la ecuación.
 */
export default function PilotoTrigonometria({ onValidate }: { onValidate?: () => void }) {
  const { trigonometria, setAnguloM5, setAnimandoM5, setTogglesM5, resetM5, limpiarHallazgosM5, registrarHallazgoM5, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      trigonometria: s.trigonometria, setAnguloM5: s.setAnguloM5, setAnimandoM5: s.setAnimandoM5, setTogglesM5: s.setTogglesM5,
      resetM5: s.resetM5, limpiarHallazgosM5: s.limpiarHallazgosM5, registrarHallazgoM5: s.registrarHallazgoM5,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { angulo: anguloStore, animando, verSeno, verCoseno, status, hallazgos = [], objetivo } = trigonometria;
  const [verTangente, setVerTangente] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    setAsistente({
      visible: true,
      text: "Bienvenido al Analizador de Funciones Circulares. El seno es la proyección vertical del vector y el coseno la horizontal. Encuentra los DOS ángulos que cumplen la ecuación del reto.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Animación en estado LOCAL (requestAnimationFrame, ~33 °/s). Al pausar se
  // escribe el ángulo al store una sola vez: la captura lee el del store.
  const [anguloAnim, setAnguloAnim] = useState(anguloStore);
  const anguloAnimRef = useRef(anguloStore);
  useEffect(() => {
    if (!animando) { anguloAnimRef.current = anguloStore; setAnguloAnim(anguloStore); return; }
    let raf = 0, prev = performance.now();
    const paso = (t: number) => {
      anguloAnimRef.current = (anguloAnimRef.current + ((t - prev) / 1000) * 33) % 360;
      prev = t;
      setAnguloAnim(anguloAnimRef.current);
      raf = requestAnimationFrame(paso);
    };
    raf = requestAnimationFrame(paso);
    return () => cancelAnimationFrame(raf);
  }, [animando, anguloStore]);
  const pausar = () => { setAnguloM5(Math.round(anguloAnimRef.current) % 360); setAnimandoM5(false); };
  const angulo = animando ? anguloAnim : anguloStore;
  const rad = (angulo * Math.PI) / 180;

  // -- PASOS DEL HUD --
  useEffect(() => {
    if (angulo !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (hallazgos.length > 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [angulo, hallazgos.length, status, pasoActual, setPasoActual]);

  if (!mounted) return null;

  const pasos = ['Fase', 'Muestreo', 'Sincronía'];
  const sen = Math.sin(rad), cos = Math.cos(rad);
  const radTxt = rad.toFixed(3);

  return (
    <LabLayout
      tituloPanel="Muestras"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Funcion etiqueta="sen θ" valor={sen.toFixed(4)} color="#38bdf8" activa={verSeno} onToggle={() => setTogglesM5(!verSeno, verCoseno)} />
          <Funcion etiqueta="cos θ" valor={cos.toFixed(4)} color="#e879f9" activa={verCoseno} onToggle={() => setTogglesM5(verSeno, !verCoseno)} />
          <Funcion etiqueta="tan θ" valor={Math.abs(cos) < 0.01 ? '∞' : Math.tan(rad).toFixed(4)} color="#facc15" activa={verTangente} onToggle={() => setVerTangente(!verTangente)} />
          <Lectura etiqueta="θ" valor={`${Math.round(angulo)}° = ${radTxt} rad`} />
          <Lectura etiqueta="Reto" acento valor={objetivo ? `${objetivo.funcion} θ = ${objetivo.texto} en [0°, 360°)` : '—'} title="Captura las DOS soluciones de una vuelta" />
          <Lectura etiqueta="sen²θ + cos²θ" valor={(sen ** 2 + cos ** 2).toFixed(4)} />
        </div>
      }
      esquina={
        <div className="rounded-md bg-black/45 px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-slate-300">
          {pasos[Math.min(2, Math.max(0, pasoActual - 1))]} · paso {Math.max(1, pasoActual)}/3
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#34434b]">
          <Trigonometria3DScene angulo={angulo} verSeno={verSeno} verCoseno={verCoseno} verTangente={verTangente} capturados={hallazgos.map((h) => h.angulo)} />
        </div>
      }
      panelLateral={
        <div className="space-y-3 text-slate-300">
          <p>El seno es la proyección vertical del vector sobre el círculo unitario y el coseno la horizontal. La gráfica de la derecha se «desenrolla» al girar el vector.</p>
          <p>Detén el vector en cada solución y captúrala: necesitas las DOS de una vuelta.</p>
          <HallazgosLista hallazgos={hallazgos} />
        </div>
      }
      controles={
        <div className="space-y-2">
          <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
            <div className="min-w-[220px] flex-1">
              <Deslizador etiqueta="Ajuste manual del ángulo" valor={Math.round(angulo)} min={0} max={359} paso={1} decimales={0} unidad="°" ancho="w-full"
                onChange={(v) => { setAnimandoM5(false); setAnguloM5(v); }} />
            </div>
            <div className="flex flex-wrap gap-1">
              {[0, 30, 45, 60, 90, 180, 270].map((val) => (
                <button key={val} type="button" onClick={() => { setAnimandoM5(false); setAnguloM5(val); audio?.playPop(); }}
                  className="h-7 rounded-md border border-white/10 bg-white/5 px-2 text-[11px] font-bold text-slate-200 hover:bg-cyan-600 hover:text-white">{val}°</button>
              ))}
            </div>
          </div>
          <GrupoControles className="items-center">
            <BotonLab variante={animando ? 'acento' : 'primario'} onClick={() => { if (animando) pausar(); else setAnimandoM5(true); audio?.playPop(); }}>
              {animando ? <Pause size={14} /> : <Play size={14} />} {animando ? 'Pausa' : 'Girar'}
            </BotonLab>
            <BotonLab variante="primario" deshabilitado={animando} title={animando ? 'Detén la animación para capturar' : 'Capturar el ángulo actual'} onClick={() => { registrarHallazgoM5(); audio?.playPop(); }}>
              <Zap size={14} /> Capturar hallazgo
            </BotonLab>
            {hallazgos.length > 0 && <BotonLab variante="secundario" onClick={() => { limpiarHallazgosM5(); audio?.playPop(); }}>Limpiar muestras</BotonLab>}
            <BotonLab variante="secundario" title="Vuelve el vector a 0° y borra las muestras (el reto no cambia)" onClick={() => { resetM5(); audio?.playPop(); }}>
              <RotateCcw size={14} /> Resetear
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              <Target size={14} /> {status === 'success' ? 'Validada' : 'Validar fase'}
            </BotonLab>
          </GrupoControles>
          {hallazgos.length > 0 && (
            <div className="flex flex-wrap items-center gap-1.5 text-[11px] text-slate-400">
              <span className="font-semibold uppercase tracking-wider">Muestras</span>
              {hallazgos.map((h) => (
                <span key={h.id} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-2 py-0.5 font-mono text-amber-200">
                  {h.angulo}° · S {h.sin.toFixed(2)} · C {h.cos.toFixed(2)}
                </span>
              ))}
            </div>
          )}
        </div>
      }
    />
  );
}

function Funcion({ etiqueta, valor, color, activa, onToggle }: { etiqueta: string; valor: string; color: string; activa: boolean; onToggle: () => void }) {
  return (
    <div className={`flex shrink-0 items-center gap-1.5 rounded-lg border px-2 py-1 ${activa ? 'bg-white/[0.06]' : 'border-white/10 bg-white/[0.02]'}`} style={activa ? { borderColor: `${color}80` } : undefined}>
      <button type="button" onClick={onToggle} aria-pressed={activa} title={activa ? 'Ocultar en la escena' : 'Mostrar en la escena'}
        className={`rounded p-0.5 ${activa ? 'text-white' : 'text-slate-500 hover:text-slate-300'}`}>
        {activa ? <Eye size={14} /> : <EyeOff size={14} />}
      </button>
      <span className="text-[10px] font-semibold uppercase tracking-wider" style={{ color: activa ? color : '#94a3b8' }}>{etiqueta}</span>
      <span className="font-mono text-[13px] font-semibold tabular-nums text-white">{valor}</span>
    </div>
  );
}

function HallazgosLista({ hallazgos }: { hallazgos: Array<{ id: number; angulo: number; sin: number; cos: number }> }) {
  if (!hallazgos.length) return <p className="rounded-lg border border-dashed border-white/10 p-3 text-[12px] text-slate-500">Aún no hay muestras.</p>;
  return (
    <div className="space-y-1.5">
      {hallazgos.map((h) => (
        <div key={h.id} className="flex items-center justify-between rounded-lg border border-white/5 bg-white/5 px-3 py-1.5">
          <span className="text-[13px] font-bold text-cyan-300">{h.angulo}°</span>
          <span className="font-mono text-[11px] text-slate-400">S {h.sin.toFixed(2)} · C {h.cos.toFixed(2)}</span>
        </div>
      ))}
    </div>
  );
}
