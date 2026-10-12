"use client";

import React from 'react';
import { audio } from '@/utils/audioEngine';
import { useSimuladorStore } from '@/store/simuladorStore';
import { calculateTotalMagnification } from '@/utils/opticEngine';
import { MUESTRAS_B1, desenfoqueB1, brilloEfectivoB1 } from '@/domain/biologia';
import type { MuestraB1, ObjetivoMagB1 } from '@/store/types';
import Microscopio3DScene from './simuladores/bio01/Microscopio3DScene';
import { Camera, Search, Settings2, Move, Database, Droplets, Focus, Gauge, Target, Droplet } from 'lucide-react';

const MUESTRAS: { id: MuestraB1; color: string; icon: string }[] = [
  { id: 'vegetal', color: 'bg-emerald-500', icon: '🌱' },
  { id: 'animal', color: 'bg-rose-500', icon: '🧬' },
  { id: 'bacteria', color: 'bg-indigo-500', icon: '🦠' },
];

export default function PilotoMicroscopioVirtual({ onValidate }: { onValidate?: () => void }) {
  const microscopio = useSimuladorStore((s) => s.microscopio);
  const setMicroscopio = useSimuladorStore((s) => s.setMicroscopio);
  const tomarCaptura = useSimuladorStore((s) => s.tomarCaptura);
  const {
    muestra, objetivoMag, iluminacion, posicionX, posicionY, targetOrganelle, muestraObjetivo,
    enfoqueMacro, enfoqueMicro, enfoqueZ, aceiteInmersionAplicado, status,
  } = microscopio;

  const totalMag = calculateTotalMagnification(objetivoMag);
  // La nitidez y el brillo del visor salen de las MISMAS funciones que usa el validador.
  const blurPx = desenfoqueB1(microscopio);
  const brillo = brilloEfectivoB1(microscopio);

  const analizar = () => { audio?.playLoading(); onValidate?.(); };
  const capturar = () => {
    tomarCaptura(`/assets/bio/${muestra}_${objetivoMag}x.webp`);
    audio?.playPop();
  };

  return (
    <div className="w-full h-full bg-[#020617] flex font-sans text-white overflow-hidden p-4 gap-4">

      {/* ── VISOR ÓPTICO ── */}
      <div className="relative flex-[3] bg-black rounded-[3rem] border border-white/10 overflow-hidden flex flex-col shadow-[0_0_100px_rgba(0,0,0,1)]">

        {/* MISIÓN (visible desde el inicio) */}
        <div className="absolute top-8 left-8 z-[60] flex flex-col gap-2 pointer-events-none max-w-sm">
          <div className="px-5 py-3 bg-black/70 backdrop-blur-xl border border-emerald-500/40 rounded-2xl">
            <div className="flex items-center gap-2 text-[10px] font-black uppercase tracking-[0.25em] text-emerald-400"><Target size={12} /> Misión</div>
            <div className="text-sm font-black text-white mt-1">Localiza: {targetOrganelle}</div>
            <div className="text-[11px] text-slate-400 font-bold">Preparación: {MUESTRAS_B1[muestraObjetivo]}</div>
          </div>
          <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest">
            Aumento total: {totalMag}x · Platina: {MUESTRAS_B1[muestra]}
          </div>
        </div>

        <div className="relative flex-1 bg-[#050505] overflow-hidden flex items-center justify-center">
          <div className="absolute inset-0 z-10" style={{ filter: `blur(${blurPx.toFixed(2)}px) brightness(${(brillo / 60).toFixed(2)})` }}>
            <Microscopio3DScene
              isDarkMode={true}
              muestra={muestra}
              objetivoMag={objetivoMag}
              enfoqueZ={enfoqueZ}
              posicionX={posicionX}
              posicionY={posicionY}
              iluminacion={iluminacion}
            />
          </div>
          {/* Máscara del ocular */}
          <div className="absolute inset-0 z-50 pointer-events-none shadow-[inset_0_0_400px_rgba(0,0,0,1)] border-[110px] border-black rounded-[4rem]" />
          <div className="absolute inset-0 z-40 pointer-events-none opacity-10 flex items-center justify-center">
            <div className="w-[600px] h-[600px] border-[0.5px] border-emerald-500 rounded-full flex items-center justify-center">
              <div className="w-full h-px bg-emerald-500/30 absolute" />
              <div className="w-px h-full bg-emerald-500/30 absolute" />
            </div>
          </div>
          {status === 'success' && (
            <div className="absolute bottom-6 z-[70] px-6 py-3 bg-emerald-600/90 rounded-2xl text-xs font-black uppercase tracking-widest">
              Estructura identificada: {targetOrganelle}
            </div>
          )}
        </div>

        <div className="p-8 bg-black/95 border-t border-white/5 flex justify-between items-center z-[80]">
          <div className="flex gap-4">
            <button onClick={analizar} className="px-10 py-5 bg-emerald-600 text-white rounded-3xl text-[12px] font-black uppercase tracking-[0.25em] hover:bg-emerald-500 transition-all flex items-center gap-3 active:scale-95">
              <Search size={20} /> Analizar imagen
            </button>
            <button onClick={capturar} className="px-10 py-5 bg-white/5 border border-white/10 rounded-3xl text-[12px] font-black uppercase tracking-[0.25em] text-white hover:bg-white/10 transition-all flex items-center gap-3">
              <Camera size={20} /> Capturar
            </button>
          </div>
          <div className="text-right text-[10px] text-slate-500 font-bold uppercase tracking-widest">
            Ocular 10x · Objetivo {objetivoMag}x
          </div>
        </div>
      </div>

      {/* ── PANEL DEL MICROSCOPIO ── */}
      <div className="w-[420px] flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">

        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 space-y-4">
          <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-500 tracking-widest">
            <span>Preparación en la platina</span><Database size={16} className="text-indigo-400" />
          </div>
          <div className="grid grid-cols-1 gap-2">
            {MUESTRAS.map((m) => (
              <button key={m.id}
                onClick={() => { audio?.playPop(); setMicroscopio({ muestra: m.id }); }}
                className={`p-4 rounded-[1.5rem] flex items-center justify-between border transition-all ${muestra === m.id ? 'bg-white/10 border-white/20' : 'border-white/5 opacity-50 hover:opacity-100'}`}>
                <span className="flex items-center gap-3 text-[12px] font-black uppercase"><span className="text-xl">{m.icon}</span>{MUESTRAS_B1[m.id]}</span>
                {muestra === m.id && <span className={`w-3 h-3 rounded-full ${m.color}`} />}
              </button>
            ))}
          </div>
        </div>

        <div className="bg-white/[0.02] border border-white/10 rounded-[2.5rem] p-6 space-y-8">
          <div className="space-y-4">
            <div className="flex justify-between items-center text-[11px] font-black uppercase text-slate-500 tracking-widest">
              <span>Revólver portaobjetivos</span><Settings2 size={16} className="text-blue-400" />
            </div>
            <div className="grid grid-cols-4 gap-2">
              {([4, 10, 40, 100] as ObjetivoMagB1[]).map((mag) => (
                <button key={mag}
                  onClick={() => { audio?.playPop(); setMicroscopio({ objetivoMag: mag }); }}
                  className={`py-4 rounded-2xl text-[13px] font-black border transition-all ${objetivoMag === mag ? 'bg-blue-600 border-blue-400 text-white' : 'bg-black/40 border-white/5 text-slate-500 hover:border-white/20'}`}>
                  {mag}x
                </button>
              ))}
            </div>
            <button
              onClick={() => { audio?.playPop(); setMicroscopio({ aceiteInmersionAplicado: !aceiteInmersionAplicado }); }}
              className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest border flex items-center justify-center gap-2 transition-all ${aceiteInmersionAplicado ? 'bg-amber-500/20 border-amber-400 text-amber-300' : 'bg-black/40 border-white/10 text-slate-400'}`}>
              <Droplet size={14} /> {aceiteInmersionAplicado ? 'Aceite de inmersión aplicado' : 'Aplicar aceite de inmersión'}
            </button>
          </div>

          <div className="space-y-5 pt-6 border-t border-white/5">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest"><Focus size={16} className="text-emerald-400" /> Enfoque</div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Tornillo macrométrico</span><span>{enfoqueMacro}</span></div>
              <input type="range" min="0" max="100" step="1" value={enfoqueMacro}
                onChange={(e) => setMicroscopio({ enfoqueMacro: parseInt(e.target.value, 10) })}
                className="w-full h-2.5 bg-white/10 rounded-full appearance-none accent-emerald-500 cursor-pointer" />
            </div>
            <div className="space-y-2">
              <div className="flex justify-between text-[10px] font-bold text-slate-500 uppercase"><span>Tornillo micrométrico</span><span>{enfoqueMicro.toFixed(1)}</span></div>
              <input type="range" min="0" max="10" step="0.1" value={enfoqueMicro}
                onChange={(e) => setMicroscopio({ enfoqueMicro: parseFloat(e.target.value) })}
                className="w-full h-1.5 bg-white/10 rounded-full appearance-none accent-emerald-400 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-4">
            <div className="flex items-center gap-2 text-[11px] font-black text-slate-500 uppercase tracking-widest"><Move size={16} className="text-rose-400" /> Platina</div>
            <div className="grid grid-cols-2 gap-4">
              <input type="range" min="-500" max="500" value={posicionX} onChange={(e) => setMicroscopio({ posicionX: parseInt(e.target.value, 10) })}
                aria-label="Eje X" className="w-full h-2 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer" />
              <input type="range" min="-500" max="500" value={posicionY} onChange={(e) => setMicroscopio({ posicionY: parseInt(e.target.value, 10) })}
                aria-label="Eje Y" className="w-full h-2 bg-white/10 rounded-full appearance-none accent-rose-500 cursor-pointer" />
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between text-[11px] font-black text-slate-500 uppercase tracking-widest">
              <span className="flex items-center gap-2"><Droplets size={16} /> Lámpara</span>
              <span className="text-amber-400">{iluminacion}%</span>
            </div>
            <input type="range" min="0" max="100" value={iluminacion} onChange={(e) => setMicroscopio({ iluminacion: parseInt(e.target.value, 10) })}
              className="w-full h-2.5 bg-white/10 rounded-full appearance-none accent-amber-500 cursor-pointer" />
          </div>

          <div className="p-5 bg-blue-500/10 border border-blue-500/20 rounded-[2rem] flex gap-4">
            <Gauge size={22} className="text-blue-400 shrink-0" />
            <p className="text-[11px] font-bold text-blue-300 leading-relaxed">
              Empieza con 4x para localizar la muestra y sube de aumento. A mayor aumento la imagen se oscurece y la profundidad de campo se reduce: ajusta la lámpara y el micrométrico.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
