"use client";

import React, { useEffect, useCallback, useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Diamond, Terminal, Keyboard, RotateCcw, Zap, CheckCircle } from 'lucide-react';
import Sintesis3DScene from './simuladores/bio03/Sintesis3DScene';
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

  return (
    <div className="w-full h-full relative overflow-hidden bg-[#020617] font-['Outfit']">

      <div className="absolute top-6 left-0 right-0 z-[200] px-10 flex justify-between items-center pointer-events-none">
        <div className="flex items-center gap-3 bg-purple-600/90 border-2 border-white/40 px-6 py-2 rounded-full">
          <Diamond size={16} className="text-white" />
          <span className="text-xs font-black text-white uppercase tracking-[0.2em]">Dogma central · BIO-03</span>
        </div>
        <button onClick={() => resetB3()} className="pointer-events-auto flex items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/20 px-6 py-2 rounded-full transition-all">
          <RotateCcw size={16} className="text-white/60" />
          <span className="text-[10px] font-black text-white/60 uppercase tracking-widest">Nuevo gen</span>
        </button>
      </div>

      <div className="absolute inset-0 z-0">
        <Sintesis3DScene
          fase={fase}
          currentIndex={fase === 'transcripcion' ? arnMensajero.length : currentIndex}
          proteinaCount={proteina.length}
          adnPlantilla={adnPlantilla}
        />
      </div>

      <div className="absolute inset-0 z-10 pointer-events-none p-10 flex flex-col justify-between">
        <div className="flex justify-between items-start pt-12">
          <div className="bg-black/70 backdrop-blur-3xl border-l-8 border-purple-500 p-6 rounded-r-3xl">
            <div className="flex items-center gap-3 mb-2"><Terminal className="text-purple-400" size={18} /><span className="text-xs font-black text-purple-400 uppercase tracking-[0.3em]">{fase === 'transcripcion' ? 'Núcleo' : 'Citoplasma · ribosoma'}</span></div>
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter">{fase === 'transcripcion' ? 'Transcripción' : 'Traducción'}</h2>
            <div className="mt-3 text-[11px] font-bold text-white/60">Errores de apareamiento: <span className={errores > MAX_ERRORES_B3 ? 'text-rose-400' : 'text-emerald-400'}>{errores}</span> (máx. {MAX_ERRORES_B3})</div>
          </div>
          {proteina.length > 0 && (
            <div className="bg-black/70 backdrop-blur-3xl p-5 rounded-3xl max-w-md">
              <span className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em]">Cadena polipeptídica (N→C)</span>
              <div className="flex flex-wrap gap-2 mt-2">
                {proteina.map((aa) => <span key={aa.id} className="px-2 py-1 rounded-lg text-xs font-black text-white" style={{ backgroundColor: aa.color }}>{aa.name}</span>)}
              </div>
            </div>
          )}
        </div>

        <div className="w-full flex justify-center">
          <div className="w-full max-w-5xl bg-black/80 backdrop-blur-3xl rounded-[3rem] border-2 border-white/10 p-8">
            <div className="flex flex-col gap-6 text-center">
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-white/40 uppercase tracking-[0.3em]">ADN · hebra molde (3&apos;→5&apos;)</span>
                <div className="flex gap-1.5 justify-center flex-wrap">
                  {adnPlantilla.split('').map((base, i) => (
                    <div key={i} className={`w-10 h-12 flex items-center justify-center font-mono text-xl font-black border-2 rounded-xl ${i === arnMensajero.length && fase === 'transcripcion' ? 'bg-purple-600 border-white text-white scale-110' : i < arnMensajero.length ? 'border-purple-500/20 text-purple-300/30' : 'border-white/10 text-white/50'}`}>{base}</div>
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-2">
                <span className="text-xs font-black text-cyan-400 uppercase tracking-[0.3em]">ARNm (5&apos;→3&apos;)</span>
                <div className="flex gap-1.5 min-h-[48px] justify-center flex-wrap">
                  {arnMensajero.split('').map((base, i) => (
                    <div key={i} className={`w-10 h-12 flex items-center justify-center font-mono text-xl font-black rounded-xl border-2 border-cyan-500 bg-cyan-500/20 text-cyan-300 ${fase === 'traduccion' && !terminada && i >= currentIndex && i < currentIndex + 3 ? 'ring-4 ring-cyan-400' : ''}`}>{base}</div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>

        <div className="flex flex-col items-center gap-4">
          {fase === 'transcripcion' && (
            <div className="flex gap-5 pointer-events-auto">
              {['A', 'U', 'C', 'G'].map((base) => (
                <motion.button key={base} whileHover={{ scale: 1.08, y: -6 }} whileTap={{ scale: 0.92 }} onClick={() => transcribirBase(base)}
                  className={`w-20 h-20 rounded-3xl border-4 flex items-center justify-center text-4xl font-black font-mono ${base === 'A' ? 'bg-emerald-500/20 border-emerald-500 text-emerald-400' : base === 'U' ? 'bg-rose-500/20 border-rose-500 text-rose-400' : base === 'C' ? 'bg-cyan-500/20 border-cyan-500 text-cyan-400' : 'bg-orange-500/20 border-orange-500 text-orange-400'}`}>
                  {base}
                </motion.button>
              ))}
            </div>
          )}
          {fase === 'traduccion' && !terminada && (
            <div className="flex flex-col items-center gap-3 pointer-events-auto">
              <span className="text-[11px] font-black text-white/60 uppercase tracking-widest">Codón en el sitio A: <span className="font-mono text-cyan-300 text-base">{codonActual}</span> · elige el ARNt que aparea</span>
              <div className="flex gap-4">
                {opciones.map((op, i) => (
                  <motion.button key={op + i} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }} onClick={() => advanceRibosoma(op)}
                    className="min-w-[120px] px-5 py-4 rounded-2xl border-2 border-emerald-400/60 bg-emerald-500/10 text-white">
                    <span className="block text-[9px] font-black text-white/40 uppercase">{i + 1}</span>
                    {op === LIBERACION_B3
                      ? <span className="text-sm font-black">Factor de liberación</span>
                      : <span className="font-mono text-xl font-black">ARNt <span className="text-emerald-300">{op}</span></span>}
                  </motion.button>
                ))}
              </div>
            </div>
          )}
          {terminada && (
            <div className="flex items-center gap-4 bg-emerald-600/20 border border-emerald-400/50 px-6 py-3 rounded-2xl pointer-events-auto">
              <CheckCircle className="text-emerald-400" size={20} />
              <span className="text-sm font-bold text-white">El ribosoma llegó al codón de paro y liberó la proteína.</span>
              <button onClick={() => onValidate?.()} className="px-5 py-2 bg-emerald-500 text-black rounded-xl text-xs font-black uppercase tracking-widest">Validar práctica</button>
            </div>
          )}
          <div className="bg-white/5 px-6 py-2 rounded-full border border-white/10 flex items-center gap-3">
            <Keyboard size={14} className="text-white/40" />
            <span className="text-[10px] font-black text-white/40 uppercase tracking-widest">{fase === 'transcripcion' ? 'Teclas A, U, C, G para transcribir' : 'Teclas 1–4 para elegir el ARNt'}</span>
          </div>
        </div>
      </div>

      <AnimatePresence>
        {showTransition && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 z-[300] bg-[#020617]/95 flex flex-col items-center justify-center pointer-events-none">
            <Zap className="text-purple-500" size={80} />
            <h3 className="text-white text-4xl font-black uppercase tracking-[0.4em] mt-10">Exportación del ARNm</h3>
            <p className="text-purple-300 font-bold mt-4 text-center max-w-md">El ARNm sale del núcleo por un poro nuclear y llega a un ribosoma en el citoplasma.</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
