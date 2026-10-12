"use client";

import React, { useState } from 'react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { validarQ9 } from '@/domain/quimica';
import { RefreshCcw, Zap, Link2, ShieldCheck } from 'lucide-react';
import Galvanic3DScene from './simuladores/qmi09/Galvanic3DScene';
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';

const METALES_CONFIG: Record<string, { label: string; color: string; pot: number; desc: string }> = {
  Zn: { label: "Zinc (Zn)", color: "#94A3B8", pot: -0.76, desc: "Metal gris mate. Ánodo común en pilas alcalinas." },
  Cu: { label: "Cobre (Cu)", color: "#B45309", pot: 0.34, desc: "Metal rojizo brillante. Excelente conductor." },
  Ag: { label: "Plata (Ag)", color: "#E2E8F0", pot: 0.80, desc: "Metal blanco brillante. Muy noble." },
  Mg: { label: "Magnesio (Mg)", color: "#475569", pot: -2.37, desc: "Metal gris oscuro. Muy reactivo." }
};

export default function PilotoCeldasGalvanicas({ isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { celda, setMetalVaso, togglePuenteSalino, toggleCables, generarSemillaP9, validarP9, resetP9, setRespuestaP9 } =
    useSimuladorStore(useShallow((s) => ({
      celda: s.celda, setMetalVaso: s.setMetalVaso, togglePuenteSalino: s.togglePuenteSalino, toggleCables: s.toggleCables,
      generarSemillaP9: s.generarSemillaP9, validarP9: s.validarP9, resetP9: s.resetP9, setRespuestaP9: s.setRespuestaP9,
    })));
  const [selectedMetal, setSelectedMetal] = useState<string | null>(null);
  const [ansAnodo, setAnsAnodo] = useState('');
  const [ansCatodo, setAnsCatodo] = useState('');
  const [intentado, setIntentado] = useState(false);
  // La pareja de metales del reto la pone `entrarLab('quimica-9')` antes de montar el panel.

  const veredicto = validarQ9(celda);
  const validar = () => {
    setRespuestaP9(ansAnodo || null, ansCatodo || null);
    setIntentado(true);
    // Un solo juez: el validador de la práctica (quiz + modal comunes).
    if (onValidate) { onValidate(); return; }
    if (validarP9()) audio?.playSuccess(); else audio?.playError();
  };

  const placeMetal = (vaso: 'izq' | 'der') => {
    if (selectedMetal) {
      setMetalVaso(vaso, selectedMetal);
      setSelectedMetal(null);
      audio?.playPop();
    }
  };

  const isCircuitComplete = !!(celda.vasoIzq && celda.vasoDer && celda.puenteSalino && celda.cablesConectados);

  const escena = (
    <Galvanic3DScene
      metalIzq={celda.vasoIzq}
      metalDer={celda.vasoDer}
      puenteSalino={celda.puenteSalino}
      cablesConectados={celda.cablesConectados}
      voltaje={celda.voltaje}
      seedMetales={celda.seedMetales}
    />
  );

  const barraSuperior = (
    <>
      <div className="flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Celda galvánica</span>
        <span className="text-[14px] font-bold text-white">Sales 1 M · 25 °C</span>
      </div>
      <Lectura etiqueta="Electrodos" valor={celda.vasoIzq && celda.vasoDer ? 'montados' : 'pendiente'} acento={!!(celda.vasoIzq && celda.vasoDer)} />
      <Lectura etiqueta="Puente salino" valor={celda.puenteSalino ? 'puesto' : 'fuera'} acento={celda.puenteSalino} />
      <Lectura etiqueta="Voltímetro" valor={celda.cablesConectados ? 'conectado' : 'suelto'} acento={celda.cablesConectados} />
      <Lectura etiqueta="Lectura" valor={`${isCircuitComplete ? (celda.voltaje > 0 ? '+' : '') + celda.voltaje.toFixed(2) : '0.00'}`} unidad="V" acento={isCircuitComplete} />
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Electrodos del reto</span>
          <div className="flex flex-wrap gap-1.5">
            {celda.seedMetales.map((m) => {
              const puesto = celda.vasoIzq === m ? 'izq' : celda.vasoDer === m ? 'der' : null;
              return (
                <button key={m} onClick={() => setSelectedMetal(m)} aria-pressed={selectedMetal === m}
                  title={`${METALES_CONFIG[m].label} · E° = ${METALES_CONFIG[m].pot > 0 ? '+' : ''}${METALES_CONFIG[m].pot.toFixed(2)} V`}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold transition-colors ${selectedMetal === m ? 'border-cyan-400/70 bg-cyan-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30'}`}>
                  <span className="h-3.5 w-3.5 rounded-sm border border-white/20" style={{ backgroundColor: METALES_CONFIG[m].color }} />
                  {m}
                  {puesto && <span className="text-[10px] font-semibold text-slate-400">· vaso {puesto === 'izq' ? 'izq.' : 'der.'}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {selectedMetal && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">Colocar {selectedMetal} en…</span>
            <div className="flex gap-1.5">
              <BotonLab variante="secundario" onClick={() => placeMetal('izq')}>Vaso izquierdo (COM)</BotonLab>
              <BotonLab variante="secundario" onClick={() => placeMetal('der')}>Vaso derecho (V)</BotonLab>
              <BotonLab variante="secundario" onClick={() => setSelectedMetal(null)}>Cancelar</BotonLab>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Circuito</span>
          <div className="flex gap-1.5">
            <button onClick={() => { togglePuenteSalino(); audio?.playPop(); }} aria-pressed={celda.puenteSalino}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${celda.puenteSalino ? 'border-emerald-400/60 bg-emerald-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <Link2 size={13} /> {celda.puenteSalino ? 'Quitar puente' : 'Poner puente salino'}
            </button>
            <button onClick={() => { toggleCables(); audio?.playPop(); }} aria-pressed={celda.cablesConectados}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${celda.cablesConectados ? 'border-blue-400/60 bg-blue-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <Zap size={13} /> {celda.cablesConectados ? 'Desconectar puntas' : 'Conectar puntas'}
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap items-end gap-x-4 gap-y-2">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-rose-300">Ánodo (−)</span>
          <select value={ansAnodo} onChange={(e) => setAnsAnodo(e.target.value)} aria-label="Metal que actúa como ánodo"
            className="h-8 w-32 rounded-lg border border-white/15 bg-white/5 px-2 text-[12px] font-semibold text-white outline-none focus:border-rose-400/60">
            <option value="" className="bg-slate-900">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-emerald-300">Cátodo (+)</span>
          <select value={ansCatodo} onChange={(e) => setAnsCatodo(e.target.value)} aria-label="Metal que actúa como cátodo"
            className="h-8 w-32 rounded-lg border border-white/15 bg-white/5 px-2 text-[12px] font-semibold text-white outline-none focus:border-emerald-400/60">
            <option value="" className="bg-slate-900">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m} className="bg-slate-900">{m}</option>)}
          </select>
        </label>
        <BotonLab onClick={validar}>Validar celda</BotonLab>
        <button aria-label="Desmontar la celda" title="Desmontar la celda" onClick={() => { resetP9(); setIntentado(false); setSelectedMetal(null); audio?.playPop(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RefreshCcw size={15} /></button>
      </div>

      {(celda.status === 'success' || (intentado && celda.status === 'error' && veredicto.mensaje)) && (
        <div className={`flex items-center gap-2 text-[12px] ${celda.status === 'success' ? 'font-semibold text-emerald-300' : 'text-amber-200'}`}>
          <ShieldCheck size={14} className="shrink-0" />
          {celda.status === 'success' ? 'Celda armada e identificada' : veredicto.mensaje}
        </div>
      )}
    </div>
  );

  const panelLateral = isProfesor ? (
    <div className="flex flex-col gap-2 text-[12px] leading-relaxed text-slate-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Panel maestro</span>
      <p>Reto configurado con: <b className="text-white">{celda.seedMetales.join(' • ')}</b>.</p>
      <p>El voltímetro marca E°(der) − E°(izq): para una <b className="text-cyan-300">lectura positiva</b>, el metal con mayor potencial de reducción (el cátodo) va en el vaso derecho (V, punta roja).</p>
      <BotonLab variante="primario" onClick={generarSemillaP9}><RefreshCcw size={13} /> Reconfigurar estación</BotonLab>
    </div>
  ) : undefined;

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} panelLateral={panelLateral} tituloPanel="Docente" panelAbiertoInicial={false} />;
}
