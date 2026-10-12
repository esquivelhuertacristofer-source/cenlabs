"use client";

import React, { useEffect, useRef, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { AlertTriangle, CheckCircle2, NotebookPen, RotateCcw } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import dynamic from 'next/dynamic';
import {
  osmolaridadMedioB2, osmolaridadCitoplasmaB2, pasoVolumenB2, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2,
} from '@/domain/biologia';

const Transporte3DScene = dynamic(() => import('./simuladores/bio02/Transporte3DScene'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-[#34434b] text-xs font-semibold text-slate-200">Cargando la escena…</div>,
});

type LecturaB2 = { nacl: number; glucosa: number; v: number };

/**
 * Ósmosis con la ley de Boyle–van 't Hoff. La osmolaridad del citoplasma es la
 * incógnita: el alumno la deduce del volumen que alcanza la célula en un medio
 * que él prepara (Osm_int0 = Osm_ext · V_eq / V0) y luego prepara el medio isotónico.
 * El volumen se integra aquí en local (requestAnimationFrame) y solo se escribe
 * al store en eventos: hemólisis y cuando la célula se estabiliza.
 */
export default function PilotoTransporteCelular({ onValidate }: { onValidate?: () => void }) {
  const transporte = useSimuladorStore((s) => s.transporte);
  const setTransporte = useSimuladorStore((s) => s.setTransporte);
  const generarSemillaB2 = useSimuladorStore((s) => s.generarSemillaB2);
  const { concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada } = transporte;

  const [volumen, setVolumen] = useState(100);
  const [tendencia, setTendencia] = useState<'gana' | 'pierde' | 'estable'>('estable');
  const [lecturas, setLecturas] = useState<LecturaB2[]>([]);
  const vRef = useRef(100);
  const estableRef = useRef(0);
  const escritoRef = useRef(true);

  // Parámetros vivos para el bucle sin re-crearlo en cada render.
  const paramsRef = useRef({ concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada });
  paramsRef.current = { concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada };

  // Muestra nueva (nueva incógnita o cambio de tipo celular): vuelve al volumen inicial.
  useEffect(() => {
    vRef.current = 100; setVolumen(100); setLecturas([]); escritoRef.current = true;
  }, [concInt, tipoCelula]);

  useEffect(() => {
    let frame = 0, ultimo = performance.now(), ultimoPintado = 0;
    const bucle = (ahora: number) => {
      const dt = Math.min(0.1, (ahora - ultimo) / 1000);
      ultimo = ahora;
      const p = paramsRef.current;
      if (!p.lisada) {
        const osmExt = osmolaridadMedioB2(p.concExt, p.glucosaExt);
        const osmInt0 = osmolaridadCitoplasmaB2(p.concInt);
        const antes = vRef.current;
        let v = antes;
        for (let i = 0; i < 4; i++) v = pasoVolumenB2(v, p.tipoCelula, osmInt0, osmExt, p.temperatura, dt / 4);
        vRef.current = v;
        const dvdt = (v - antes) / Math.max(dt, 1e-3);
        if (p.tipoCelula === 'animal' && v >= UMBRAL_LISIS_B2) {
          setTransporte({ lisada: true, volumen: Math.round(v) });
        } else if (Math.abs(dvdt) < 0.05) {
          estableRef.current += dt;
          if (estableRef.current > 0.8 && !escritoRef.current) {
            escritoRef.current = true;
            setTransporte({ volumen: Math.round(v * 10) / 10 });
          }
        } else {
          estableRef.current = 0; escritoRef.current = false;
        }
        if (ahora - ultimoPintado > 100) {
          ultimoPintado = ahora;
          setVolumen(v);
          setTendencia(Math.abs(dvdt) < 0.05 ? 'estable' : dvdt > 0 ? 'gana' : 'pierde');
        }
      }
      frame = requestAnimationFrame(bucle);
    };
    frame = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(frame);
  }, [setTransporte]);

  const anotar = () => setLecturas((l) => [...l, { nacl: concExt, glucosa: glucosaExt, v: Math.round(vRef.current * 10) / 10 }].slice(-6));
  const nuevaMuestra = () => generarSemillaB2();

  const estadoCelula = tipoCelula === 'animal'
    ? (volumen > 130 ? 'Hinchada: riesgo de hemólisis' : volumen < 90 ? 'Crenada (arrugada)' : 'Forma normal')
    : (volumen >= VMAX_VEGETAL_B2 - 1 ? 'Turgente: la pared frena la entrada de agua' : volumen < 90 ? 'Plasmolizada: la membrana se separa de la pared' : 'Flácida');

  const leyenda = (
    <div className="flex flex-col gap-1 rounded-lg border border-white/10 bg-[#0f1a2b]/85 px-2.5 py-2 text-[10px] font-semibold text-slate-200 backdrop-blur">
      <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#7f9fc4]" /> Na⁺</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#59a56a]" /> Cl⁻</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rotate-45 bg-[#d9a441]" /> Glucosa</span>
      <span className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full bg-[#8fd0ee]" /> Agua (flujo neto)</span>
    </div>
  );

  const escena = (
    <div className="relative h-full w-full">
      <Transporte3DScene tipo={tipoCelula} volumen={volumen} concExt={concExt} glucosaExt={glucosaExt} lisada={lisada} tendencia={tendencia} />
      {lisada && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-red-500/50 bg-[#2a0d10]/90 px-4 py-2.5 text-white backdrop-blur">
          <span className="flex items-center gap-2 text-[12px] font-semibold"><AlertTriangle size={18} className="shrink-0 text-red-400" />
            <span><b className="text-red-300">Hemólisis.</b> El medio era tan hipotónico que la célula superó su volumen crítico y la membrana se rompió. Es irreversible.</span>
          </span>
          <BotonLab variante="acento" onClick={nuevaMuestra}><RotateCcw size={14} /> Nueva muestra</BotonLab>
        </div>
      )}
    </div>
  );

  const barra = (
    <>
      <Lectura etiqueta="Muestra problema" valor={tipoCelula === 'animal' ? 'Eritrocito' : 'Epidermis vegetal'} />
      <Lectura etiqueta="Osm. del citoplasma" valor="desconocida" />
      <Lectura etiqueta="V / V₀" valor={volumen.toFixed(1)} unidad="%" acento />
      <Lectura etiqueta="Agua" valor={tendencia === 'estable' ? 'Volumen estable' : tendencia === 'gana' ? 'Entra (gana agua)' : 'Sale (pierde agua)'} />
      <Lectura etiqueta="Estado" valor={estadoCelula} />
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <GrupoControles>
        <Segmentado etiqueta="Tipo de célula"
          opciones={[{ valor: 'animal', texto: 'Eritrocito' }, { valor: 'vegetal', texto: 'Célula vegetal' }]} valor={tipoCelula}
          onChange={(t) => setTransporte({ tipoCelula: t, volumen: 100, lisada: false })} />
        <Deslizador etiqueta="NaCl en el medio" valor={concExt} min={0} max={0.4} paso={0.005} unidad="M" decimales={3} ancho="w-48" onChange={(v) => setTransporte({ concExt: v })} />
        <Deslizador etiqueta="Glucosa en el medio" valor={glucosaExt} min={0} max={0.4} paso={0.01} unidad="M" decimales={2} ancho="w-48" onChange={(v) => setTransporte({ glucosaExt: v })} />
        <Deslizador etiqueta="Temperatura" valor={temperatura} min={5} max={40} paso={1} unidad="°C" onChange={(v) => setTransporte({ temperatura: v })} />
      </GrupoControles>
      <GrupoControles>
        <BotonLab variante="secundario" onClick={anotar}><NotebookPen size={14} /> Anotar lectura</BotonLab>
        <BotonLab variante="secundario" onClick={nuevaMuestra}><RotateCcw size={14} /> Nueva incógnita</BotonLab>
        <BotonLab onClick={() => onValidate?.()}><CheckCircle2 size={14} /> Validar medio isotónico</BotonLab>
        <span className="text-[10px] text-slate-400">La temperatura cambia la RAPIDEZ de la ósmosis, no el volumen final.</span>
      </GrupoControles>
    </div>
  );

  const lateral = (
    <div className="space-y-3 text-slate-300">
      <p><b className="text-cyan-300">Método.</b> Osm = i·M (NaCl: i = 2, glucosa: i = 1). Los solutos del citoplasma no salen: Osm<sub>int</sub>·V = constante. Cuando la célula deja de cambiar, Osm<sub>int</sub> = Osm<sub>ext</sub>.</p>
      {lecturas.length > 0 && (
        <table className="w-full font-mono text-[11px]">
          <thead><tr className="text-slate-500"><th className="text-left">NaCl (M)</th><th className="text-left">Glu (M)</th><th className="text-right">V/V₀</th></tr></thead>
          <tbody>{lecturas.map((l, i) => <tr key={i}><td>{l.nacl.toFixed(3)}</td><td>{l.glucosa.toFixed(2)}</td><td className="text-right">{l.v.toFixed(1)} %</td></tr>)}</tbody>
        </table>
      )}
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barra} controles={controles} panelLateral={lateral} tituloPanel="Método" esquina={leyenda} />;
}
