"use client";

import React, { useState } from 'react';
import { BookOpen, ListChecks, Compass, ShieldCheck } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { validarQ9 } from '@/domain/quimica';
import { useBancoCelda } from '@/components/simuladores/qmi09/banco';

type Tono = 'ok' | 'mal' | 'neutro';
const TONOS: Record<Tono, { caja: string; titulo: string; punto: string }> = {
  ok: { caja: 'border-emerald-200 bg-emerald-50', titulo: 'text-emerald-700', punto: 'bg-emerald-500' },
  mal: { caja: 'border-amber-200 bg-amber-50', titulo: 'text-amber-700', punto: 'bg-amber-500' },
  neutro: { caja: 'border-slate-200 bg-slate-50', titulo: 'text-slate-500', punto: 'bg-slate-300' },
};

function Hallazgo({ tono, titulo, valor, dato }: { tono: Tono; titulo: string; valor: string; dato: string }) {
  const t = TONOS[tono];
  return (
    <div className={`flex items-center justify-between gap-3 rounded-2xl border px-4 py-2.5 transition-all ${t.caja}`} data-hallazgo={dato} data-tono={tono}>
      <div className="flex min-w-0 flex-col gap-0.5">
        <span className={`text-[13px] font-bold ${t.titulo}`}>{titulo}</span>
        <span className="text-[14px] font-semibold leading-snug text-[#023047]">{valor}</span>
      </div>
      <div className={`h-2.5 w-2.5 shrink-0 rounded-full ${t.punto}`} aria-hidden />
    </div>
  );
}

const coma = (v: number, d = 2) => `${v > 0 ? '+' : v < 0 ? '−' : ''}${Math.abs(v).toFixed(d).replace('.', ',')}`;

/**
 * Bitácora de las celdas galvánicas: el cuaderno del alumno. Dice qué mirar en la
 * exploración (celda de Daniell), registra en vivo el montaje del reto y guarda el
 * análisis escrito.
 *
 * UN SOLO JUEZ, UN SOLO SITIO: el ánodo y el cátodo se eligen en los mandos del
 * laboratorio y se validan allí («Validar celda», el mismo juez que «Validar práctica»
 * de la cabecera: `validarQ9`). Aquí no hay otro formulario ni otro botón de validar.
 * NO REGALA: la identificación sólo se da por buena después de validar.
 */
export default function BitacoraCeldasGalvanicas(_props: { onValidate?: () => void }) {
  const celda = useSimuladorStore(useShallow((s) => s.celda));
  const modo = useBancoCelda((b) => b.modo);
  const [conclusionText, setConclusionText] = useState('');

  const seed = celda.seedMetales ?? [];
  const montados = [celda.vasoIzq, celda.vasoDer];
  const electrodos = seed.length >= 2 && seed.every((m) => montados.includes(m)) && celda.vasoIzq !== celda.vasoDer;
  const circuito = celda.puenteSalino && celda.cablesConectados;
  const hayLectura = electrodos && circuito;
  const validado = celda.status === 'success';
  const intentado = celda.status === 'error';
  const r = celda.respuesta;
  const respondido = !!r?.anodo && !!r?.catodo;
  const veredicto = validarQ9(celda);
  const wordCount = conclusionText.trim().split(/\s+/).filter(Boolean).length;
  const reto = modo === 'reto';

  return (
    <div className="space-y-3 animate-in fade-in duration-500 font-['Outfit'] pb-10" data-bitacora="quimica-9">

      {/* QUÉ TOCA AHORA */}
      <div className="rounded-[1.6rem] border border-sky-200 bg-sky-50 p-4 shadow-sm" data-seccion="ahora">
        <div className="mb-1.5 flex items-center gap-2">
          <Compass size={16} className="text-[#219EBC]" />
          <h4 className="text-[14px] font-black tracking-wide text-[#023047]">{reto ? 'Reto: arma e identifica tu celda' : 'Explora la celda de Daniell'}</h4>
        </div>
        {reto ? (
          <ol className="list-decimal space-y-1 pl-5 text-[14px] font-medium leading-snug text-slate-700">
            <li>Coloca un electrodo de cada metal, uno en cada vaso.</li>
            <li>Pon el puente salino y conecta las puntas del voltímetro.</li>
            <li>Mira el signo de la lectura y decide cuál metal es el ánodo y cuál el cátodo.</li>
            <li>Pulsa <b>Validar celda</b> en los mandos del laboratorio.</li>
          </ol>
        ) : (
          <ul className="list-disc space-y-1 pl-5 text-[14px] font-medium leading-snug text-slate-700">
            <li>Baja <b>[Cu²⁺]</b> o <b>[Zn²⁺]</b> y mira cómo cambia <b>E</b>: eso es la ecuación de Nernst.</li>
            <li>Cambia la <b>carga</b>: con más corriente, la tensión en bornes <b>V</b> se aleja de <b>E</b>.</li>
            <li>Sube la cámara rápida y sigue el punto por la recta de Nernst hasta el equilibrio (E = 0).</li>
            <li>Cuando lo tengas claro, pasa a <b>Reto</b> en los mandos.</li>
          </ul>
        )}
      </div>

      {/* REGISTRO DEL RETO */}
      <div className={`space-y-2 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm ${reto ? '' : 'opacity-70'}`} data-seccion="hallazgos">
        <div className="mb-1 flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <ListChecks size={16} className="text-[#219EBC]" />
            <h4 className="text-[14px] font-black tracking-wide text-[#023047]">Registro del reto</h4>
          </div>
          {seed.length >= 2 && <span className="text-[13px] font-bold text-slate-600">{seed.join(' y ')}</span>}
        </div>
        <Hallazgo dato="electrodos" tono={electrodos ? 'ok' : 'neutro'} titulo="Electrodos"
          valor={electrodos ? `${celda.vasoIzq} en el vaso izquierdo · ${celda.vasoDer} en el derecho` : 'Falta un electrodo de cada metal, uno en cada vaso'} />
        <Hallazgo dato="circuito" tono={circuito ? 'ok' : 'neutro'} titulo="Circuito cerrado"
          valor={`Puente salino ${celda.puenteSalino ? 'puesto' : 'sin poner'} · puntas ${celda.cablesConectados ? 'conectadas' : 'sin conectar'}`} />
        <Hallazgo dato="lectura" tono={hayLectura ? (celda.voltaje > 0 ? 'ok' : 'mal') : 'neutro'} titulo="Lectura del voltímetro"
          valor={hayLectura
            ? (celda.voltaje > 0 ? `${coma(celda.voltaje)} V` : `${coma(celda.voltaje)} V · la aguja va al revés: revisa a qué electrodo va la punta COM`)
            : 'Sin lectura hasta cerrar el circuito'} />
        <Hallazgo dato="identificacion" tono={validado ? 'ok' : intentado && respondido ? 'mal' : 'neutro'} titulo="Ánodo y cátodo"
          valor={validado ? `Ánodo ${r?.anodo} · cátodo ${r?.catodo} · identificación correcta`
            : respondido ? `Ánodo ${r?.anodo} · cátodo ${r?.catodo} · ${intentado ? 'aún no es correcta' : 'se comprueba al validar'}`
            : 'Elígelos en los mandos del laboratorio'} />
        {validado ? (
          <p className="flex items-center gap-2 rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-[14px] font-bold text-emerald-700" role="status">
            <ShieldCheck size={16} className="shrink-0" /> Celda armada e identificada.
          </p>
        ) : intentado && veredicto.mensaje ? (
          <p className="rounded-2xl border border-amber-200 bg-amber-50 px-4 py-2.5 text-[14px] font-semibold leading-snug text-amber-800" role="status" data-aviso-bitacora="">{veredicto.mensaje}</p>
        ) : (
          <p className="px-1 text-[13px] font-medium leading-snug text-slate-500">Se valida en un solo sitio: el botón <b>Validar celda</b> de los mandos (hace lo mismo que «Validar práctica»).</p>
        )}
      </div>

      {/* ANÁLISIS */}
      <div className="space-y-2 rounded-[1.6rem] border border-slate-200 bg-white p-4 shadow-sm">
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <BookOpen size={16} className="text-[#023047]" />
            <span className="text-[14px] font-black tracking-wide text-[#023047]">Análisis redox</span>
          </div>
          <span className={`rounded-full px-2.5 py-0.5 text-[13px] font-bold ${wordCount >= 30 ? 'bg-emerald-500 text-white' : 'bg-slate-100 text-slate-500'}`}>{wordCount}/30 palabras</span>
        </div>
        <textarea
          value={conclusionText} onChange={(e) => setConclusionText(e.target.value)}
          placeholder="Explica cómo funciona la celda, para qué sirve el puente salino y por qué el metal que elegiste como ánodo es el que se oxida."
          rows={5}
          className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 text-[14px] font-medium leading-snug text-slate-700 placeholder:text-slate-500 focus:border-[#219EBC] focus:outline-none"
        />
      </div>
    </div>
  );
}
