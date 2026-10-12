"use client";

import React, { useState } from 'react';
import { Bot, CheckCircle2, Circle, BookOpen, ShieldCheck, Table } from 'lucide-react';
import 'katex/dist/katex.min.css';
import { InlineMath } from 'react-katex';

/**
 * Bitácora común de los labs de física. Es un cuaderno de SOLO LECTURA: muestra
 * los datos del problema, el protocolo (con el mismo criterio que el validador
 * de dominio), los registros del alumno y un espacio para su análisis. No
 * calcula ni muestra la incógnita del reto, y el único botón de validar es el
 * flujo oficial (`onValidate` → validarLab → quiz).
 */
export interface DatoBitacora { label: string; valor: string }
export interface PasoBitacora { label: string; ok: boolean; detalle?: string }
export interface TablaBitacora { columnas: string[]; filas: (string | number)[][]; vacio?: string }

export default function BitacoraFisica({
  titulo, intro, formulas, datos, protocolo, tabla, preguntaEnsayo, acento = '#219EBC', onValidate,
}: {
  titulo: string;
  intro: string;
  formulas: { tex: string; etiqueta: string }[];
  datos: DatoBitacora[];
  protocolo: PasoBitacora[];
  tabla?: TablaBitacora;
  preguntaEnsayo: string;
  acento?: string;
  onValidate?: () => void;
}) {
  const [ensayo, setEnsayo] = useState('');
  const palabras = ensayo.trim().split(/\s+/).filter(Boolean).length;
  const hechos = protocolo.filter((p) => p.ok).length;

  return (
    <div className="space-y-5 font-['Outfit'] pb-20">
      <div className="bg-gradient-to-br from-[#023047] to-[#0A1121] p-6 rounded-[2rem] border border-white/10 relative overflow-hidden">
        <Bot size={56} className="absolute top-3 right-3 text-white opacity-10" />
        <span className="text-[10px] font-black uppercase tracking-[0.2em]" style={{ color: acento }}>Dr. Quantum · Bitácora</span>
        <h4 className="text-white font-black text-lg leading-tight mt-2 mb-2">{titulo}</h4>
        <p className="text-[11px] text-slate-300 leading-relaxed">{intro}</p>
        <div className="mt-4 grid gap-2">
          {formulas.map((f) => (
            <div key={f.tex} className="bg-white/5 rounded-xl px-3 py-2 flex items-center justify-between gap-3 text-white">
              <span role="math" aria-label={f.etiqueta}><InlineMath math={f.tex} /></span>
              <span className="text-[9px] text-slate-400 uppercase tracking-widest text-right">{f.etiqueta}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
        <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-3">Datos del problema</h4>
        <div className="grid grid-cols-2 gap-2">
          {datos.map((d) => (
            <div key={d.label} className="p-3 bg-slate-50 rounded-xl border border-slate-100">
              <span className="text-[8px] font-black text-slate-400 uppercase block mb-1">{d.label}</span>
              <span className="text-xs font-black text-[#023047] font-mono">{d.valor}</span>
            </div>
          ))}
        </div>
      </div>

      <div className="bg-slate-50 rounded-[2rem] border border-slate-200 p-5">
        <div className="flex items-center justify-between mb-3">
          <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Protocolo</h4>
          <span className="text-[9px] font-black text-slate-400">{hechos}/{protocolo.length}</span>
        </div>
        <div className="space-y-2">
          {protocolo.map((p) => (
            <div key={p.label} className={`p-3 rounded-xl border flex items-start gap-3 ${p.ok ? 'bg-emerald-500/10 border-emerald-500/30' : 'bg-white border-slate-100'}`}>
              {p.ok ? <CheckCircle2 size={16} className="text-emerald-600 shrink-0 mt-0.5" /> : <Circle size={16} className="text-slate-300 shrink-0 mt-0.5" />}
              <div>
                <span className="text-[11px] font-bold text-slate-800 block">{p.label}</span>
                {p.detalle && <span className="text-[10px] text-slate-500">{p.detalle}</span>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {tabla && (
        <div className="bg-white rounded-[2rem] border border-slate-200 p-5">
          <div className="flex items-center gap-2 mb-3">
            <Table size={14} className="text-[#023047]" />
            <h4 className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em]">Registros</h4>
          </div>
          {tabla.filas.length === 0 ? (
            <p className="text-[10px] text-slate-400 italic">{tabla.vacio ?? 'Aún no hay registros.'}</p>
          ) : (
            <table className="w-full text-[10px] font-mono">
              <thead>
                <tr>{tabla.columnas.map((c) => <th key={c} className="text-left text-slate-400 font-black pb-1">{c}</th>)}</tr>
              </thead>
              <tbody>
                {tabla.filas.map((f, i) => (
                  <tr key={i} className="border-t border-slate-100">{f.map((v, j) => <td key={j} className="py-1 text-slate-700">{v}</td>)}</tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      )}

      <div className="bg-white rounded-[2rem] border border-slate-200 p-5 space-y-3">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <BookOpen size={14} className="text-[#023047]" />
            <span className="text-[10px] font-black text-[#023047] uppercase tracking-widest">Análisis</span>
          </div>
          <span className="text-[9px] font-black text-slate-400">{palabras} palabras</span>
        </div>
        <textarea
          value={ensayo} onChange={(e) => setEnsayo(e.target.value)} rows={4}
          placeholder={preguntaEnsayo}
          className="w-full bg-slate-50 border border-slate-100 rounded-2xl p-4 text-[11px] text-slate-600 focus:outline-none italic"
        />
      </div>

      {onValidate && (
        <button
          onClick={onValidate}
          className="w-full py-4 rounded-2xl bg-[#023047] hover:bg-[#054a6d] text-white font-black text-[10px] uppercase tracking-[0.2em] flex items-center justify-center gap-3 transition-all active:scale-95"
        >
          <ShieldCheck size={16} /> Validar práctica
        </button>
      )}
    </div>
  );
}
