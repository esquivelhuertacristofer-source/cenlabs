"use client";

import React, { useEffect, useCallback, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import type { SintesisStateB3 } from '@/store/types';
import { Keyboard, RotateCcw, CheckCircle, Dna } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, BotonLab } from './simulador/LabLayout';
import { COLOR_BASE, CLASES_AA, TASA_POL_II, TASA_RIBOSOMA } from './simuladores/bio03/molecular';
import { opcionesARNt } from './simuladores/bio03/opciones';
import { RelojSintesis, type EstadoSintesis } from './simuladores/bio03/reloj';
import { COMPLEMENTO_ARN, LIBERACION_B3, MAX_ERRORES_B3 } from '@/domain/biologia';

const VisorSintesis = dynamic(() => import('./simuladores/bio03/Sintesis3DScene'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-[#05090f] text-[11px] font-semibold text-violet-200">Preparando el núcleo…</div>,
});

/** ¿La tecla viene de un campo de texto (la bitácora, el chat…)? Entonces no es para el lab. */
const esCampoDeTexto = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

const estadoDe = (s: SintesisStateB3): EstadoSintesis => ({
  fase: s.fase, adnPlantilla: s.adnPlantilla, arnMensajero: s.arnMensajero, proteina: s.proteina, errores: s.errores, terminada: s.terminada,
});

/**
 * Síntesis de proteínas. El store decide (base apareada, ARNt aceptado, error); el reloj
 * de bio03 lo convierte en acontecimientos que ven a la vez la escena y el dock. Nada
 * de lo que se ve dice qué base o qué ARNt toca antes de que el alumno elija.
 */
export default function PilotoSintesisProteinas({ onValidate }: { onValidate?: () => void }) {
  const sintesis = useSimuladorStore((s) => s.sintesis);
  const addNucleotido = useSimuladorStore((s) => s.addNucleotido);
  const advanceRibosoma = useSimuladorStore((s) => s.advanceRibosoma);
  const resetB3 = useSimuladorStore((s) => s.resetB3);
  const registrarHallazgo = useSimuladorStore((s) => s.registrarHallazgo);
  const { fase, adnPlantilla, arnMensajero, currentIndex, errores, terminada } = sintesis;

  const reducido = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);
  const reloj = useMemo(() => new RelojSintesis(estadoDe(useSimuladorStore.getState().sintesis), reducido), []); // eslint-disable-line react-hooks/exhaustive-deps
  // cualquier cambio del store (gen nuevo, reinicio, acciones de otros paneles) llega al reloj
  useEffect(() => { reloj.sincronizar(estadoDe(sintesis)); }, [sintesis, reloj]);

  const codonActual = arnMensajero.slice(currentIndex, currentIndex + 3);
  const opciones = useMemo(() => (fase === 'traduccion' && !terminada ? opcionesARNt(codonActual, currentIndex) : []), [fase, terminada, codonActual, currentIndex]);

  const transcribirBase = useCallback((base: string) => {
    if (fase !== 'transcripcion') return;
    const pos = arnMensajero.length;
    const esperada = COMPLEMENTO_ARN[adnPlantilla[pos]];
    if (base !== esperada) {
      registrarHallazgo('biologia_transcripcion_error', { posicion: pos, base_molde: adnPlantilla[pos], base_ingresada: base, base_esperada: esperada });
    }
    addNucleotido(base);
    reloj.sincronizar(estadoDe(useSimuladorStore.getState().sintesis), base);
  }, [fase, arnMensajero.length, adnPlantilla, addNucleotido, registrarHallazgo, reloj]);

  const elegirARNt = useCallback((op: string | undefined) => {
    if (!op) return;
    advanceRibosoma(op);
    reloj.sincronizar(estadoDe(useSimuladorStore.getState().sintesis), op);
  }, [advanceRibosoma, reloj]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (esCampoDeTexto(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (fase === 'transcripcion' && ['A', 'U', 'C', 'G', 'T'].includes(key)) transcribirBase(key);
      if (fase === 'traduccion' && !terminada && ['1', '2', '3', '4'].includes(e.key)) elegirARNt(opciones[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transcribirBase, elegirARNt, fase, terminada, opciones]);

  const barra = (
    <>
      <Lectura etiqueta="Fase" valor={fase === 'transcripcion' ? 'Transcripción · núcleo' : 'Traducción · ribosoma'} acento />
      <Lectura etiqueta="Errores" valor={`${errores} de ${MAX_ERRORES_B3}`} />
      <BotonLab variante="secundario" onClick={() => resetB3()}><RotateCcw size={14} /> Nuevo gen</BotonLab>
    </>
  );

  const enInicio = currentIndex === 0;
  const controles = (
    <div className="flex flex-col gap-2">
      {fase === 'transcripcion' && (
        <GrupoControles>
          <span className="self-center text-[12px] font-semibold text-slate-300">Aparea la base siguiente:</span>
          {['A', 'U', 'C', 'G'].map((base) => (
            <button key={base} type="button" onClick={() => transcribirBase(base)}
              className="flex h-10 w-12 items-center justify-center rounded-xl border-2 font-mono text-xl font-bold text-white transition hover:brightness-125 active:scale-95"
              style={{ borderColor: COLOR_BASE[base], backgroundColor: COLOR_BASE[base] + '33' }}>
              {base}
            </button>
          ))}
          <span className="flex items-center gap-1.5 self-center text-[10px] text-slate-400"><Keyboard size={13} /> Teclas A, U, C, G</span>
        </GrupoControles>
      )}
      {fase === 'traduccion' && !terminada && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-300">
            {enInicio ? 'Codón de inicio en el sitio P' : 'Codón en el sitio A'}: <span className="font-mono text-base text-cyan-300">{codonActual}</span> · elige el ARNt que aparea
          </span>
          <GrupoControles>
            {opciones.map((op, i) => (
              <button key={op + i} type="button" onClick={() => elegirARNt(op)}
                className="min-w-[116px] rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-left text-white transition hover:bg-emerald-500/20 active:scale-95">
                <span className="block text-[9px] font-bold text-white/40">{i + 1}</span>
                {op === LIBERACION_B3
                  ? <span className="text-[13px] font-bold">Factor de liberación</span>
                  : <span className="font-mono text-base font-bold">ARNt <span className="text-emerald-300">{op}</span></span>}
              </button>
            ))}
            <span className="flex items-center gap-1.5 self-center text-[10px] text-slate-400"><Keyboard size={13} /> Teclas 1–4</span>
          </GrupoControles>
        </div>
      )}
      {terminada && (
        <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-emerald-400/40 bg-[#0c2a22]/90 px-4 py-2">
          <span className="flex items-center gap-2 text-[12px] font-semibold text-white"><CheckCircle className="shrink-0 text-emerald-400" size={18} /> El ribosoma llegó al codón de paro y liberó la proteína.</span>
          <BotonLab onClick={() => onValidate?.()}>Validar práctica</BotonLab>
        </div>
      )}
    </div>
  );

  const lateral = (
    <div className="space-y-3 text-slate-300">
      <p className="flex gap-2 text-[12px] leading-snug"><Dna size={16} className="mt-0.5 shrink-0 text-violet-300" />
        {fase === 'transcripcion'
          ? 'La ARN polimerasa lee la hebra molde y une el NTP complementario: A–U, T–A, C–G, G–C.'
          : 'Cada codón lo lee un ARNt de anticodón complementario. En el paro entra un factor de liberación.'}
      </p>
      <div className="grid grid-cols-2 gap-x-2 gap-y-1 text-[11px]">
        {Object.entries({ A: 'Adenina', 'U/T': 'Uracilo/Timina', C: 'Citosina', G: 'Guanina' }).map(([k, v]) => (
          <span key={k} className="flex items-center gap-1.5"><i className="inline-block h-2.5 w-2.5 rounded-sm" style={{ backgroundColor: COLOR_BASE[k[0]] }} /><b>{k}</b> <span className="text-slate-400">{v}</span></span>
        ))}
      </div>
      <div className="flex flex-wrap gap-x-2 gap-y-1 text-[10.5px]">
        {Object.values(CLASES_AA).map((c) => (
          <span key={c.nombre} className="flex items-center gap-1"><i className="inline-block h-2.5 w-2.5 rounded-full" style={{ backgroundColor: c.color }} />{c.nombre}</span>
        ))}
      </div>
      <details className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] leading-snug text-slate-300">
        <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-400">Cómo está hecho el modelo</summary>
        <div className="mt-2 space-y-1.5">
          <p>Todo a escala molecular (1 u = 1 nm). ADN B: 10,5 pares por vuelta, 0,338 nm de subida, Ø 2,0 nm, surco menor 1,2 nm y mayor 2,35 nm, dextrógiro. La polimerasa sigue el surco: en su marco el ADN avanza en tornillo (0,338 nm y 34,3° por nucleótido).</p>
          <p>Burbuja de ≈ 13 nt con un híbrido ARN–ADN de 8 pb; el NTP entra por el embudo, aparea con 2 (A–U) o 3 (G–C) puentes de H, el Mg²⁺ cataliza y sale el pirofosfato.</p>
          <p>Ribosoma 80S: sitios E·P·A separados un codón; el ARNt llega con eEF1A, se acomoda, se forma el enlace peptídico y el ribosoma transloca. Código genético estándar (64 codones).</p>
          <p>Cámara lenta rotulada: la Pol II real añade ≈ {TASA_POL_II} nt/s y el ribosoma ≈ {String(TASA_RIBOSOMA).replace('.', ',')} codones/s. La agitación térmica (Stokes–Einstein) se muestra ~10⁸ veces más lenta.</p>
          <p>Simplificaciones: formas de las proteínas aproximadas a escala (no coordenadas atómicas); el ADN no se dobla en la polimerasa; sin intrones ni empalme; el ARNt iniciador llega después de que la 40S encuentra el AUG (en la célula viaja con ella); el ARNm del canal va algo estirado (0,6 nm por nucleótido). Una cadena de 4–6 residuos no se pliega en hélice α (Zimm–Bragg: θ ≈ 1 %).</p>
          <p>La polimerasa y el ribosoma se ven en corte (sin su mitad delantera; la cara de corte, lisa y sin luz) para que se vea lo de dentro; el botón de capas los muestra enteros y translúcidos. El corte de la 60S contiene el túnel de salida.</p>
          <p>La hebra codificante del gen (la misma secuencia que el ARNm) sólo toma color detrás de la polimerasa: delante sería la respuesta.</p>
        </div>
      </details>
    </div>
  );

  return <LabLayout escena={<VisorSintesis reloj={reloj} />} barraSuperior={barra} controles={controles} panelLateral={lateral} tituloPanel="Guía" />;
}
