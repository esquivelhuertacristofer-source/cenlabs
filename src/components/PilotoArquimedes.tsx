"use client";

import React, { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Plus } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { FLUIDOS, G_TIERRA, evaluarF6, lecturaDinamometro, pesoAparente } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';

const Arquimedes3DScene = dynamic(() => import('./simuladores/fis06/Arquimedes3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-sky-400 font-black text-xs uppercase tracking-[0.3em]">Inicializando Laboratorio de Hidrostática...</div>
});

/**
 * Arquímedes con dinamómetro. El sólido cuelga del dinamómetro y se baja dentro del
 * vaso de rebose; la inmersión es una FRACCIÓN de su volumen y nunca pasa del 100 %.
 * Lo único que da la escena es lo que daría el instrumento: la lectura en newtons.
 */
export default function PilotoArquimedes({ onValidate }: { onValidate?: () => void }) {
  const { a, setArquimedes6, setAsistente, audio } = useSimuladorStore(useShallow((s) => ({
    a: s.arquimedes6, setArquimedes6: s.setArquimedes6, setAsistente: s.setAsistente, audio: s.audio,
  })));
  const { densidadCuerpo, volumenCuerpo, fluido, densidadLiquido, sumergido, lecturaAire, lecturaFluido, fluidoLectura, densidadAlumno } = a;

  const [rhoInput, setRhoInput] = useState(densidadAlumno !== null ? String(densidadAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF6> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de hidrostática. Pesa el sólido en el aire y luego completamente sumergido: la diferencia es el empuje, y con él puedes calcular su volumen y su densidad.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [lecturaAire, lecturaFluido, densidadAlumno]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const lectura = lecturaDinamometro(pesoAparente(densidadCuerpo, volumenCuerpo, densidadLiquido, sumergido));
  const fraccion = Math.min(1, Math.max(0, sumergido));

  const cambiarFluido = (key: string) => {
    if (key === fluido) return;
    // La lectura sumergida pertenece al fluido en que se tomó.
    setArquimedes6({ fluido: key, densidadLiquido: FLUIDOS[key].rho, sumergido: 0, lecturaFluido: null, fluidoLectura: null, resultado: null });
    audio?.playPop();
  };

  const registrarAire = () => {
    if (fraccion > 0) return avisar('Saca por completo el sólido del fluido para pesarlo en el aire.');
    setArquimedes6({ lecturaAire: lectura, resultado: null });
    audio?.playPop();
  };
  const registrarFluido = () => {
    if (fraccion < 1) return avisar('Sumerge el sólido POR COMPLETO antes de registrar el peso aparente.');
    setArquimedes6({ lecturaFluido: lectura, fluidoLectura: fluido, resultado: null });
    audio?.playPop();
  };

  const guardarRho = (v: string) => {
    setRhoInput(v);
    const r = parseFloat(v);
    setArquimedes6({ densidadAlumno: Number.isFinite(r) ? r : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF6(a);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  return (
    <LabLayout
      escena={<Arquimedes3DScene densidadCuerpo={densidadCuerpo} volumenCuerpo={volumenCuerpo} densidadLiquido={densidadLiquido} fluido={fluido} sumergido={fraccion} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Dinamómetro" valor={lectura.toFixed(2)} unidad="N" acento />
          <Lectura etiqueta="Inmersión" valor={Math.round(fraccion * 100)} unidad="%" />
          <Lectura etiqueta="Fluido" valor={FLUIDOS[fluido]?.nombre ?? fluido} />
          <Lectura etiqueta="W (aire)" valor={lecturaAire !== null ? lecturaAire.toFixed(2) : '—'} unidad={lecturaAire !== null ? 'N' : undefined} />
          <Lectura etiqueta="W aparente" valor={lecturaFluido !== null ? lecturaFluido.toFixed(2) : '—'} unidad={lecturaFluido !== null ? `N (${FLUIDOS[fluidoLectura ?? fluido]?.nombre})` : undefined} />
        </>
      }
      tituloPanel="Análisis"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="font-mono text-[11px] leading-relaxed text-slate-300">E = W − W<sub>ap</sub> = ρ<sub>f</sub>·g·V<br />ρ = W / (g·V)</p>
          <p className="text-[11px] text-slate-400">g = {G_TIERRA} m/s² · ρ<sub>f</sub> = {densidadLiquido} kg/m³</p>
          <label className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-amber-300">ρ del sólido (kg/m³)</span>
            <input type="number" step="1" value={rhoInput} onChange={(e) => guardarRho(e.target.value)} placeholder="ρ = W / (g·V)"
              className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
          </label>
          <BotonLab variante="acento" onClick={comprobar}>Comprobar análisis</BotonLab>
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Deslizador etiqueta="Volumen sumergido" valor={fraccion * 100} min={0} max={100} paso={5} unidad="%" decimales={0} ancho="w-56"
              onChange={(v) => setArquimedes6({ sumergido: Math.min(1, Math.max(0, v / 100)) })} />
            <Segmentado etiqueta="Fluido" valor={fluido as string} onChange={cambiarFluido}
              opciones={Object.entries(FLUIDOS).map(([k, f]) => ({ valor: k, texto: `${f.nombre} · ${f.rho}` }))} />
            <BotonLab variante="secundario" onClick={registrarAire}><Plus size={14} /> Peso en aire</BotonLab>
            <BotonLab onClick={registrarFluido}><Plus size={14} /> Peso sumergido</BotonLab>
          </GrupoControles>
          {(alerta || veredicto?.ok) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tu densidad coincide con tus lecturas del dinamómetro. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
