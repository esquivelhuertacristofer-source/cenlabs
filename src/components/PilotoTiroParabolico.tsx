"use client";

import React, { useEffect, useMemo } from 'react';
import { Activity } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ESCENARIOS, RANGO_ANGULO, RANGO_VELOCIDAD, simularDisparo, type Escenario } from '@/domain/fisica';
import TiroParabolico3DScene from './simuladores/fis01/TiroParabolico3DScene';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';

export default function PilotoTiroParabolico({ onValidate }: { onValidate?: () => void }) {
  const { tiro1, generarSemillaF1, ejecutarDisparoF1, setTiro1, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    tiro1: s.tiro1, generarSemillaF1: s.generarSemillaF1, ejecutarDisparoF1: s.ejecutarDisparoF1,
    setTiro1: s.setTiro1, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { angulo, velocidad, disparando, targetX, resultado, distanciaReal, y0, obsX, obsY, escenario, viento, municion, aciertos, ultimoDisparo } = tiro1;
  const esc = ESCENARIOS[escenario] ?? ESCENARIOS.tierra;

  useEffect(() => {
    if (disparando) audio?.playPop();
  }, [disparando, audio]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al polígono de tiro. Neutraliza el dron de la diana roja ajustando el ángulo y la velocidad inicial. La guía gris solo marca la dirección de salida: la curva real depende de la gravedad, del aire y del viento.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => {
    if (resultado === 'exito') audio?.playSuccess();
    else if (resultado === 'colision' || resultado === 'fallo') audio?.playError();
  }, [resultado, audio]);

  // v_y(t) del ÚLTIMO disparo, ya aterrizado (se calcula con el mismo motor del store).
  const curvaVy = useMemo(() => {
    if (!ultimoDisparo || disparando) return null;
    const r = simularDisparo(ultimoDisparo, ultimoDisparo, true);
    const vmax = Math.max(1, ...r.muestras.map((m) => Math.abs(m.vy)));
    const T = Math.max(r.t, 0.01);
    return r.muestras.map((m) => `${((m.t / T) * 100).toFixed(1)},${(-(m.vy / vmax) * 9).toFixed(2)}`).join(' ');
  }, [ultimoDisparo, disparando]);

  const cambiarEscenario = (e: Escenario) => {
    if (disparando || e === escenario) return;
    setTiro1({ escenario: e });
    generarSemillaF1();
    audio?.playPop();
  };

  const chipResultado = resultado && !disparando ? (
    <div role="status" className={`flex min-h-8 items-center rounded-lg border px-3 py-1 text-[12px] font-bold leading-tight ${
      resultado === 'exito' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : resultado === 'colision' ? 'border-orange-500/50 bg-orange-500/15 text-orange-300' : 'border-red-500/50 bg-red-500/15 text-red-300'}`}>
      {resultado === 'exito' ? 'Blanco neutralizado' : resultado === 'colision' ? `Impacto en el muro (x = ${obsX} m)` : `Cayó en x = ${distanciaReal.toFixed(1)} m (diana en ${targetX} m)`}
    </div>
  ) : null;

  return (
    <LabLayout
      escena={
        <TiroParabolico3DScene
          angulo={angulo} y0={y0} obsX={obsX} obsY={obsY} targetX={targetX}
          volando={disparando} escenario={escenario} viento={viento} ultimoDisparo={ultimoDisparo}
        />
      }
      barraSuperior={
        <>
          <Lectura etiqueta="Muro x" valor={obsX} unidad="m" />
          <Lectura etiqueta="Muro alto" valor={obsY} unidad="m" />
          <Lectura etiqueta="Diana x" valor={targetX} unidad="m" acento />
          <Lectura etiqueta="Altura y₀" valor={y0} unidad="m" />
          <Lectura etiqueta="Viento" valor={`${viento >= 0 ? '+' : ''}${viento.toFixed(1)}`} unidad="m/s" />
        </>
      }
      tituloPanel="Datos del tiro"
      panelLateral={
        <div className="flex flex-col gap-3">
          <div className="grid grid-cols-2 gap-2">
            <Lectura etiqueta="g" valor={esc.g.toFixed(2)} unidad="m/s²" />
            <Lectura etiqueta="ρ aire" valor={esc.rho.toFixed(3)} unidad="kg/m³" />
            <Lectura etiqueta="Aciertos" valor={aciertos} acento={aciertos > 0} />
          </div>
          <p className="text-[11px] leading-snug text-slate-400">
            La guía gris del lanzador solo marca la dirección de salida. Las marcas naranjas del último disparo están a intervalos iguales de tiempo: su separación en x muestra que vₓ cambia poco (arrastre) y la de y, que v_y cambia a ritmo constante (g).
          </p>
          {curvaVy ? (
            <div className="rounded-lg border border-white/10 bg-white/[0.04] p-2">
              <div className="mb-1 flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-sky-300"><Activity size={11} /> v_y(t) del último disparo</div>
              <svg viewBox="0 -10 100 20" className="h-24 w-full">
                <line x1="0" y1="0" x2="100" y2="0" stroke="rgba(255,255,255,0.25)" strokeWidth="0.3" />
                <polyline points={curvaVy} fill="none" stroke="#38bdf8" strokeWidth="0.8" />
              </svg>
              <div className="text-right text-[10px] text-slate-400">cruza el cero en la altura máxima</div>
            </div>
          ) : (
            <div className="text-[11px] text-slate-500">Dispara para ver v_y(t) del tiro.</div>
          )}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Deslizador etiqueta="Ángulo θ" unidad="°" valor={angulo} min={RANGO_ANGULO.min} max={RANGO_ANGULO.max} paso={RANGO_ANGULO.paso}
              deshabilitado={disparando} onChange={(v) => setTiro1({ angulo: v })} />
            <Deslizador etiqueta="Velocidad v₀" unidad="m/s" valor={velocidad} min={RANGO_VELOCIDAD.min} max={RANGO_VELOCIDAD.max} paso={RANGO_VELOCIDAD.paso}
              deshabilitado={disparando} onChange={(v) => setTiro1({ velocidad: v })} />
            <BotonLab onClick={() => ejecutarDisparoF1()} deshabilitado={disparando || municion <= 0}>Disparar ({municion})</BotonLab>
            <BotonLab variante="secundario" onClick={() => { generarSemillaF1(); audio?.playPop(); }} deshabilitado={disparando}>Nueva misión</BotonLab>
            <Segmentado<Escenario>
              opciones={(Object.keys(ESCENARIOS) as Escenario[]).map((e) => ({ valor: e, texto: ESCENARIOS[e].nombre }))}
              valor={escenario} onChange={cambiarEscenario}
            />
          </GrupoControles>
          {(chipResultado || (aciertos > 0 && !disparando)) && (
            <div className="flex flex-wrap items-center gap-2">
              {chipResultado}
              <AvisoReto visible={aciertos > 0 && !disparando} onValidate={onValidate} className="!px-3 !py-1.5"
                texto="Impacto confirmado. Ya puedes validar tu práctica (o seguir en otros mundos)." />
            </div>
          )}
        </div>
      }
    />
  );
}
