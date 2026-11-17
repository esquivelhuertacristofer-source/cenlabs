"use client";

/**
 * Bitácora de BIO-01 · Microscopio digital con casos.
 *   1. Casos: qué respondió el alumno en cada uno y si el juez lo da por bueno
 *      (el mismo `estadoCasoB1` que decide la práctica). Nunca muestra el valor correcto.
 *   2. Cálculo óptico del objetivo en uso: aumento total y resolución (0,61·λ/AN).
 *   3. Micrografías capturadas del campo ocular.
 */
import React, { useState } from 'react';
import Image from 'next/image';
import { Calculator, Camera, Check, ListChecks, RotateCcw, ShieldCheck, X } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { CASOS_B1, ORDEN_CASOS_B1, CASOS_PARA_APROBAR_B1, casosResueltosB1, estadoCasoB1 } from '@/domain/biologia';
import { LAMBDA_UM, OBJETIVOS_OPTICOS, aumentoTotal, resolucionUm } from '@/domain/microscopia/optica';
import type { MuestraB1, RespuestaCasoB1 } from '@/store/types';
import { LetraBitacoraEstrella } from '../simulador/RaizLabEstrella';

const coma = (x: number, dec = 2) => x.toFixed(dec).replace('.', ',');

function textoRespuesta(caso: MuestraB1, r: RespuestaCasoB1): string {
  const c = CASOS_B1[caso];
  if (c.opciones) return c.opciones[r.valores[0]] ?? '—';
  return c.campos.map((f, k) => `${f.etiqueta.toLowerCase()} ${coma(r.valores[k], Number.isInteger(r.valores[k]) ? 0 : 1)}${f.unidad ? ` ${f.unidad}` : ''}`).join(' · ');
}

const TARJETA = 'rounded-3xl border border-slate-200 bg-white p-5 shadow-sm';
const TITULO = 'flex items-center gap-2 text-[14px] font-bold text-[#023047]';

export default function BitacoraMicroscopio({ onValidate }: { onValidate?: () => void }) {
  const microscopio = useSimuladorStore((s) => s.microscopio);
  const setMicroscopio = useSimuladorStore((s) => s.setMicroscopio);
  const validarB1 = useSimuladorStore((s) => s.validarB1);
  const resetB1 = useSimuladorStore((s) => s.resetB1);
  const { objetivoMag, aceiteInmersionAplicado, magnificacionVerified, abbeVerified, capturas = [] } = microscopio;

  const [magTexto, setMagTexto] = useState('');
  const [resTexto, setResTexto] = useState('');
  const [calculo, setCalculo] = useState<null | 'bien' | 'mal'>(null);

  const resueltos = casosResueltosB1(microscopio).length;
  const listo = resueltos >= CASOS_PARA_APROBAR_B1;
  const an = OBJETIVOS_OPTICOS[objetivoMag].an;

  const verificar = () => {
    const mag = Number(magTexto.replace(',', '.')), res = Number(resTexto.replace(',', '.'));
    // resolución con el diafragma abierto del todo: d = 0,61·λ/AN, en nanómetros
    const real = resolucionUm(objetivoMag, true, 1) * 1000;
    const magOk = mag === aumentoTotal(objetivoMag), resOk = Number.isFinite(res) && Math.abs(res - real) <= real * 0.03;
    setMicroscopio({ magnificacionVerified: magOk, abbeVerified: resOk });
    setCalculo(magOk && resOk ? 'bien' : 'mal');
    if (magOk && resOk) audio.playSuccess(); else audio.playError();
  };

  return (
    <LetraBitacoraEstrella id="biologia-1">
      <div className="space-y-5 pb-16 font-['Outfit']">
        {/* 1 · casos */}
        <section className={TARJETA} data-bitacora-casos="">
          <div className="flex items-center justify-between gap-2">
            <h3 className={TITULO}><ListChecks size={17} className="text-emerald-600" /> Casos resueltos</h3>
            <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${listo ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-600'}`}>{resueltos} de {CASOS_PARA_APROBAR_B1}</span>
          </div>
          <p className="mt-1 text-[13px] leading-snug text-slate-500">Resuelve tres de los seis. Cada respuesta se guarda con la imagen que tenías al darla.</p>
          <ul className="mt-3 space-y-2">
            {ORDEN_CASOS_B1.map((c) => {
              const est = estadoCasoB1(microscopio, c), r = microscopio.respuestas[c];
              return (
                <li key={c} className={`rounded-2xl border px-3 py-2 ${est === 'correcto' ? 'border-emerald-300 bg-emerald-50' : est === 'incorrecto' ? 'border-rose-200 bg-rose-50' : 'border-slate-200 bg-slate-50'}`}>
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[14px] font-semibold text-[#023047]">{CASOS_B1[c].nombre}</span>
                    {est === 'correcto' ? <Check size={17} className="shrink-0 text-emerald-600" /> : est === 'incorrecto' ? <X size={17} className="shrink-0 text-rose-500" /> : <span className="shrink-0 text-[13px] text-slate-400">pendiente</span>}
                  </div>
                  <p className="text-[13px] leading-snug text-slate-600">{r ? `Tu respuesta: ${textoRespuesta(c, r)} (a ${r.objetivoMag}×).` : CASOS_B1[c].tincion}</p>
                </li>
              );
            })}
          </ul>
        </section>

        {/* 2 · cálculo óptico */}
        <section className={TARJETA} data-bitacora-optica="">
          <h3 className={TITULO}><Calculator size={17} className="text-emerald-600" /> Cálculo óptico del objetivo</h3>
          <p className="mt-1 text-[13px] leading-snug text-slate-600">
            Objetivo de <b>{objetivoMag}×</b>, apertura numérica <b>{coma(an)}</b>{objetivoMag === 100 ? (aceiteInmersionAplicado ? ' (con aceite)' : ' (grabada; exige aceite)') : ''}, ocular de 10×, luz de {Math.round(LAMBDA_UM * 1000)} nm.
          </p>
          <div className="mt-3 grid grid-cols-2 gap-3">
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-slate-600">
              Aumento total
              <input type="number" value={magTexto} onChange={(e) => { setMagTexto(e.target.value); setCalculo(null); }} placeholder="objetivo × ocular"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-[14px] text-[#023047] outline-none focus:border-emerald-500" />
            </label>
            <label className="flex flex-col gap-1 text-[13px] font-semibold text-slate-600">
              Resolución (nm)
              <input type="number" value={resTexto} onChange={(e) => { setResTexto(e.target.value); setCalculo(null); }} placeholder="0,61·λ / AN"
                className="h-10 rounded-xl border border-slate-200 bg-slate-50 px-3 font-mono text-[14px] text-[#023047] outline-none focus:border-emerald-500" />
            </label>
          </div>
          <button type="button" onClick={verificar}
            className={`mt-3 h-10 w-full rounded-xl text-[13px] font-bold transition-colors ${magnificacionVerified && abbeVerified ? 'bg-emerald-500 text-white' : 'bg-[#023047] text-white hover:bg-[#054a6d]'}`}>
            {magnificacionVerified && abbeVerified ? 'Cálculo verificado' : 'Verificar cálculo'}
          </button>
          {calculo === 'mal' && <p className="mt-2 text-[13px] text-rose-600">No coincide. Aumento = objetivo × ocular; resolución d = 0,61·λ/AN, con λ en nanómetros.</p>}
          {calculo === 'bien' && <p className="mt-2 text-[13px] text-emerald-700">Bien: dos puntos más juntos que esa distancia se ven como uno solo.</p>}
        </section>

        {/* 3 · micrografías */}
        <section className={TARJETA} data-bitacora-capturas="">
          <h3 className={TITULO}><Camera size={17} className="text-emerald-600" /> Micrografías</h3>
          {capturas.length > 0 ? (
            <div className="mt-3 grid grid-cols-3 gap-2">
              {capturas.map((cap, i) => (
                <div key={i} className="relative aspect-square overflow-hidden rounded-xl border border-slate-200 bg-slate-900">
                  <Image src={cap} alt={`Micrografía ${i + 1}`} fill unoptimized className="object-cover" />
                </div>
              ))}
            </div>
          ) : (
            <p className="mt-2 rounded-2xl border-2 border-dashed border-slate-200 px-3 py-5 text-center text-[13px] text-slate-400">Pulsa «Capturar» bajo el ocular para guardar lo que ves, con su barra de escala.</p>
          )}
        </section>

        <div className="flex gap-3">
          <button type="button" aria-label="Reiniciar el instrumento y borrar las respuestas" title="Reiniciar el instrumento y borrar las respuestas"
            onClick={() => { resetB1(); setMagTexto(''); setResTexto(''); setCalculo(null); audio.playPop(); }}
            className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl border border-slate-200 bg-slate-100 text-slate-500 hover:text-emerald-600">
            <RotateCcw size={19} />
          </button>
          <button type="button" disabled={!listo}
            onClick={() => { if (onValidate) onValidate(); else if (validarB1()) audio.playSuccess(); else audio.playError(); }}
            className={`flex h-12 flex-1 items-center justify-center gap-2 rounded-2xl text-[13px] font-bold shadow ${listo ? 'bg-[#023047] text-white hover:bg-emerald-600' : 'cursor-not-allowed bg-slate-200 text-slate-400'}`}>
            <ShieldCheck size={17} /> {listo ? 'Validar práctica' : `Faltan ${CASOS_PARA_APROBAR_B1 - resueltos} casos`}
          </button>
        </div>
      </div>
    </LetraBitacoraEstrella>
  );
}
