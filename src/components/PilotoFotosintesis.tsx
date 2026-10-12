"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Play, RotateCcw, ShieldCheck, Thermometer, Target } from 'lucide-react';
import Fotosintesis3DScene from './simuladores/bio04/Fotosintesis3DScene';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import { NOMBRE_LUZ_B4, D_MAX_B4, DURACION_B4, ppfdB4 } from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';

// Solo el color de la lámpara: la eficiencia de cada longitud de onda es lo que el alumno DESCUBRE.
const LAMPARAS: { id: ColorLuzB4; hex: string }[] = [
  { id: 'blanco', hex: '#fff1d6' },
  { id: 'rojo', hex: '#e5503f' },
  { id: 'amarillo', hex: '#f0b02e' },
  { id: 'verde', hex: '#49b565' },
  { id: 'azul', hex: '#4673d6' },
];

/** Duración visual del ensayo (s reales) que representa los 10 min de incubación. */
const DURACION_VISUAL_MS = 2500;

export default function PilotoFotosintesis({ onValidate }: { onValidate?: () => void }) {
  const fotosintesis = useSimuladorStore((s) => s.fotosintesis);
  const setFotosintesis = useSimuladorStore((s) => s.setFotosintesis);
  const registrarEnsayoB4 = useSimuladorStore((s) => s.registrarEnsayoB4);
  const resetB4 = useSimuladorStore((s) => s.resetB4);
  const { distancia, color, dMin, meta, ensayos, status } = fotosintesis;

  // La animación del ensayo es LOCAL; el store solo recibe el ensayo terminado.
  const [midiendo, setMidiendo] = useState(false);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);

  const medir = () => {
    if (midiendo) return;
    setMidiendo(true);
    timer.current = setTimeout(() => {
      registrarEnsayoB4();
      setMidiendo(false);
      timer.current = null;
    }, DURACION_VISUAL_MS);
  };

  const ppfd = ppfdB4(distancia);
  const ultimoO2 = ensayos.length ? ensayos[ensayos.length - 1].o2 : 0;
  const dEfectiva = Math.max(dMin, distancia);

  const barra = (
    <>
      <Lectura etiqueta="Meta" valor={`${meta.toFixed(2)} mL de O₂ en ${DURACION_B4} min`} acento title="Ramita de Elodea" />
      <Lectura etiqueta="Distancia mínima" valor={`${dMin} cm`} title="La lámpara calienta el agua: no la acerques a menos de este límite" />
      <Lectura etiqueta="Luz" valor={NOMBRE_LUZ_B4[color]} />
      <Lectura etiqueta="Luxómetro" valor={ppfd.toFixed(0)} unidad="µmol·m⁻²·s⁻¹" />
      {midiendo && <Lectura etiqueta="Estado" valor={`Incubando ${DURACION_B4} min · contando burbujas…`} acento />}
      {!midiendo && status === 'success' && <Lectura etiqueta="Resultado" valor="Meta de O₂ alcanzada" acento />}
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <GrupoControles>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Lámpara LED (mismo flujo de fotones)</span>
          <div className="flex gap-1.5">
            {LAMPARAS.map((l) => (
              <button key={l.id} type="button" disabled={midiendo} title={NOMBRE_LUZ_B4[l.id]} aria-label={NOMBRE_LUZ_B4[l.id]}
                onClick={() => setFotosintesis({ color: l.id })}
                className={`h-8 w-10 rounded-lg border-2 transition-all disabled:cursor-not-allowed ${color === l.id ? 'border-white' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: l.hex }} />
            ))}
          </div>
        </div>
        <Deslizador etiqueta="Distancia lámpara–tubo" valor={dEfectiva} min={dMin} max={D_MAX_B4} paso={1} unidad="cm" ancho="w-56" deshabilitado={midiendo}
          onChange={(v) => setFotosintesis({ distancia: v })} />
        <BotonLab onClick={medir} deshabilitado={midiendo}><Play size={14} /> {midiendo ? 'Midiendo…' : `Medir ${DURACION_B4} min`}</BotonLab>
        <BotonLab variante="acento" onClick={() => onValidate?.()} deshabilitado={midiendo || ensayos.length === 0}><ShieldCheck size={14} /> Validar práctica</BotonLab>
      </GrupoControles>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300">Ensayos (O₂ recogido en el tubo)</span>
          <button type="button" onClick={() => resetB4()} disabled={midiendo} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"><RotateCcw size={12} /> Borrar</button>
        </div>
        {ensayos.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">Sin ensayos. Cambia una variable cada vez y compara.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5">
            {ensayos.map((e, i) => (
              <span key={i} className={`rounded-lg border px-2 py-1 font-mono text-[11px] ${e.o2 >= meta ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-slate-200'}`}>
                #{i + 1} {NOMBRE_LUZ_B4[e.color]} · {e.distancia} cm · {e.o2.toFixed(2)} mL
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  const lateral = (
    <div className="space-y-3 text-slate-300">
      <p className="flex gap-2"><Target size={16} className="mt-0.5 shrink-0 text-emerald-300" />
        Recoge al menos <b className="font-mono text-emerald-300">{meta.toFixed(2)} mL</b> de O₂ en un ensayo de {DURACION_B4} min con la ramita de <i>Elodea</i>.</p>
      <p className="flex gap-2"><Thermometer size={16} className="mt-0.5 shrink-0 text-amber-300" />
        La lámpara calienta el agua: no la acerques a menos de {dMin} cm del tubo.</p>
      <p>El burbujeo que ves es el O₂ de la fotosíntesis; el tubo colector, graduado en mL, lo acumula durante el ensayo.</p>
    </div>
  );

  return (
    <LabLayout
      escena={<Fotosintesis3DScene simulando={midiendo} colorLuz={color} distancia={dEfectiva} dMin={dMin} ultimoO2={ultimoO2} />}
      barraSuperior={barra} controles={controles} panelLateral={lateral} tituloPanel="Misión"
    />
  );
}
