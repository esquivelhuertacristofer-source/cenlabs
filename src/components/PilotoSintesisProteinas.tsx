"use client";

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Keyboard, RotateCcw, CheckCircle, Atom } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, BotonLab } from './simulador/LabLayout';
import Sintesis3DScene from './simuladores/bio03/Sintesis3DScene';
import { COLOR_BASE } from './simuladores/bio03/piezas';
import { COMPLEMENTO_ARN, CODIGO_GENETICO, anticodonB3, LIBERACION_B3, MAX_ERRORES_B3 } from '@/domain/biologia';

/** ¿La tecla viene de un campo de texto (la bitácora, el chat…)? Entonces no es para el lab. */
const esCampoDeTexto = (t: EventTarget | null) =>
  t instanceof HTMLElement && (t.isContentEditable || ['INPUT', 'TEXTAREA', 'SELECT'].includes(t.tagName));

/** 4 opciones de ARNt para un codón: la correcta y tres anticodones distractores, en orden estable. */
function opcionesARNt(codon: string, indice: number): string[] {
  const correcta = CODIGO_GENETICO[codon]?.name === 'STOP' ? LIBERACION_B3 : anticodonB3(codon);
  const codones = Object.keys(CODIGO_GENETICO).filter((c) => CODIGO_GENETICO[c].name !== 'STOP' && anticodonB3(c) !== correcta);
  const distractores: string[] = [];
  let k = (indice * 7 + codon.charCodeAt(0) + codon.charCodeAt(2)) % codones.length;
  while (distractores.length < 3) {
    const a = anticodonB3(codones[k % codones.length]);
    if (!distractores.includes(a)) distractores.push(a);
    k += 11;
  }
  const todas = [correcta, ...distractores];
  const giro = (indice / 3 + codon.charCodeAt(1)) % 4;
  return [...todas.slice(giro), ...todas.slice(0, giro)];
}

export default function PilotoSintesisProteinas({ onValidate }: { onValidate?: () => void }) {
  const sintesis = useSimuladorStore((s) => s.sintesis);
  const addNucleotido = useSimuladorStore((s) => s.addNucleotido);
  const advanceRibosoma = useSimuladorStore((s) => s.advanceRibosoma);
  const resetB3 = useSimuladorStore((s) => s.resetB3);
  const registrarHallazgo = useSimuladorStore((s) => s.registrarHallazgo);
  const { fase, adnPlantilla, arnMensajero, proteina, currentIndex, errores, terminada } = sintesis;
  const [showTransition, setShowTransition] = useState(false);

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
  }, [fase, arnMensajero.length, adnPlantilla, addNucleotido, registrarHallazgo]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (esCampoDeTexto(e.target) || e.ctrlKey || e.metaKey || e.altKey) return;
      const key = e.key.toUpperCase();
      if (fase === 'transcripcion' && ['A', 'U', 'C', 'G', 'T'].includes(key)) transcribirBase(key);
      if (fase === 'traduccion' && !terminada && ['1', '2', '3', '4'].includes(e.key)) advanceRibosoma(opciones[Number(e.key) - 1]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [transcribirBase, fase, terminada, opciones, advanceRibosoma]);

  // Transición núcleo → citoplasma al terminar la transcripción.
  useEffect(() => {
    if (fase === 'traduccion' && currentIndex === 0 && proteina.length === 0) {
      setShowTransition(true);
      const t = setTimeout(() => setShowTransition(false), 2200);
      return () => clearTimeout(t);
    }
  }, [fase, currentIndex, proteina.length]);

  const nTrans = arnMensajero.length;

  const escena = (
    <div className="relative h-full w-full">
      <Sintesis3DScene
        fase={fase}
        adnPlantilla={adnPlantilla}
        arnMensajero={arnMensajero}
        currentIndex={fase === 'transcripcion' ? nTrans : currentIndex}
        proteina={proteina}
        terminada={terminada}
        exportando={showTransition}
      />
      {showTransition && (
        <div className="pointer-events-none absolute inset-x-3 bottom-3 rounded-xl border border-white/15 bg-[#0f1a2b]/90 px-4 py-2 text-center text-[12px] font-semibold text-slate-100 backdrop-blur">
          Exportación del ARNm: sale del núcleo por un poro nuclear y llega a un ribosoma en el citoplasma.
        </div>
      )}
      {terminada && (
        <div className="absolute inset-x-3 bottom-3 flex items-center justify-between gap-3 rounded-xl border border-emerald-400/40 bg-[#0c2a22]/90 px-4 py-2 backdrop-blur">
          <span className="flex items-center gap-2 text-[12px] font-semibold text-white"><CheckCircle className="shrink-0 text-emerald-400" size={18} /> El ribosoma llegó al codón de paro y liberó la proteína.</span>
          <BotonLab onClick={() => onValidate?.()}>Validar práctica</BotonLab>
        </div>
      )}
    </div>
  );

  const barra = (
    <>
      <Lectura etiqueta="Dogma central" valor={fase === 'transcripcion' ? 'Transcripción · núcleo' : 'Traducción · ribosoma'} acento />
      <Lectura etiqueta="Errores de apareamiento" valor={`${errores} (máx. ${MAX_ERRORES_B3})`} />
      {proteina.length > 0 && (
        <div className="flex shrink-0 items-center gap-1 rounded-lg border border-white/10 bg-white/[0.04] px-2 py-1">
          <span className="mr-1 text-[10px] font-semibold uppercase tracking-wider text-slate-400">Cadena N→C</span>
          {proteina.map((aa) => <span key={aa.id} className="rounded px-1.5 py-0.5 text-[11px] font-bold text-white" style={{ backgroundColor: aa.color }}>{aa.name}</span>)}
        </div>
      )}
      <BotonLab variante="secundario" onClick={() => resetB3()}><RotateCcw size={14} /> Nuevo gen</BotonLab>
    </>
  );

  const casilla = (b: string, extra: string) => (
    <div className={`flex h-8 w-7 items-center justify-center rounded-md border font-mono text-[14px] font-bold ${extra}`}>{b}</div>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">ADN · hebra molde (3′→5′)</span>
        <div className="flex flex-wrap gap-1">
          {adnPlantilla.split('').map((base, i) => (
            <React.Fragment key={i}>{casilla(base, i === nTrans && fase === 'transcripcion' ? 'border-white bg-[#219EBC] text-white' : i < nTrans || fase === 'traduccion' ? 'border-white/10 text-slate-500' : 'border-white/15 text-slate-200')}</React.Fragment>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-1">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-cyan-300">ARNm (5′→3′)</span>
        <div className="flex min-h-[32px] flex-wrap gap-1">
          {arnMensajero.split('').map((base, i) => (
            <React.Fragment key={i}>{casilla(base, `border-cyan-400/60 bg-cyan-500/15 text-cyan-200 ${fase === 'traduccion' && !terminada && i >= currentIndex && i < currentIndex + 3 ? 'ring-2 ring-cyan-300' : ''}`)}</React.Fragment>
          ))}
        </div>
      </div>
      {fase === 'transcripcion' && (
        <GrupoControles>
          <span className="text-[11px] font-semibold text-slate-300">Aparea la base siguiente:</span>
          {['A', 'U', 'C', 'G'].map((base) => (
            <button key={base} type="button" onClick={() => transcribirBase(base)}
              className="flex h-10 w-12 items-center justify-center rounded-xl border-2 font-mono text-xl font-bold text-white hover:brightness-125"
              style={{ borderColor: COLOR_BASE[base], backgroundColor: COLOR_BASE[base] + '33' }}>
              {base}
            </button>
          ))}
          <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><Keyboard size={13} /> Teclas A, U, C, G</span>
        </GrupoControles>
      )}
      {fase === 'traduccion' && !terminada && (
        <div className="flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-slate-300">Codón en el sitio A: <span className="font-mono text-base text-cyan-300">{codonActual}</span> · elige el ARNt que aparea</span>
          <GrupoControles>
            {opciones.map((op, i) => (
              <button key={op + i} type="button" onClick={() => advanceRibosoma(op)}
                className="min-w-[116px] rounded-xl border border-emerald-400/50 bg-emerald-500/10 px-3 py-2 text-left text-white hover:bg-emerald-500/20">
                <span className="block text-[9px] font-bold text-white/40">{i + 1}</span>
                {op === LIBERACION_B3
                  ? <span className="text-[13px] font-bold">Factor de liberación</span>
                  : <span className="font-mono text-base font-bold">ARNt <span className="text-emerald-300">{op}</span></span>}
              </button>
            ))}
            <span className="flex items-center gap-1.5 text-[10px] text-slate-400"><Keyboard size={13} /> Teclas 1–4</span>
          </GrupoControles>
        </div>
      )}
    </div>
  );

  const lateral = (
    <div className="space-y-3 text-slate-300">
      <p className="flex gap-2"><Atom size={16} className="mt-0.5 shrink-0 text-purple-300" />
        {fase === 'transcripcion' ? 'La ARN polimerasa abre la hélice y empareja cada base de la hebra molde: A–U, T–A, C–G, G–C.' : 'Cada codón del ARNm lo lee un ARNt cuyo anticodón es complementario. En el codón de paro entra un factor de liberación, no un ARNt.'}
      </p>
      <div className="flex flex-col gap-1 text-[11px]">
        {Object.entries({ A: 'Adenina', 'U / T': 'Uracilo / Timina', C: 'Citosina', G: 'Guanina' }).map(([k, v]) => (
          <span key={k} className="flex items-center gap-2"><i className="inline-block h-3 w-3 rounded-full" style={{ backgroundColor: COLOR_BASE[k[0]] }} /> <b>{k}</b> {v}</span>
        ))}
      </div>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barra} controles={controles} panelLateral={lateral} tituloPanel="Bases" />;
}
