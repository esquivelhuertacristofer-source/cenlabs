"use client";

import React, { useState, useEffect } from 'react';
import { Play, Pause, Plus, ShieldAlert } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  MATERIALES_DILATACION, T_AMBIENTE, T_VAPOR, DT_MIN_MEDICION,
  alphaDe, dilatacion, lecturaComparador, evaluarF7,
} from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';

const DilatacionTermica3DScene = dynamic(() => import('./simuladores/fis07/DilatacionTermica3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-orange-400 font-black text-xs uppercase tracking-[0.3em]">Preparando dilatómetro...</div>
});

const MATERIALES_UI = [
  ...Object.entries(MATERIALES_DILATACION).map(([k, m]) => ({ key: k, nombre: m.nombre })),
  { key: 'misterioso', nombre: 'Metal ?' },
];

// Calentamiento por vapor: la barra se acerca exponencialmente a la temperatura
// del vapor (100 °C a 1 atm) y, sin vapor, se enfría hacia el ambiente (ley de
// enfriamiento de Newton). Constantes de tiempo didácticas, no medidas.
const TAU_CALENTAR_S = 6;
const TAU_ENFRIAR_S = 20;
const TICK_MS = 100;

interface Medicion { material: string; dT: number; dL: number }

export default function PilotoDilatacionTermica({ onValidate }: { onValidate?: () => void }) {
  const { d, setDilatacion7, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    d: s.dilatacion7, setDilatacion7: s.setDilatacion7, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { material, tempIni, longitud, alphaMisterioso, alphaAlumno } = d;

  // Temperatura y vapor: estado local (no se escribe al store en cada tick).
  const [temp, setTemp] = useState(T_AMBIENTE);
  const [vapor, setVapor] = useState(false);
  const [mediciones, setMediciones] = useState<Medicion[]>([]);
  const [alphaInput, setAlphaInput] = useState(alphaAlumno !== null ? String(alphaAlumno) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF7> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al dilatómetro. Haz pasar vapor por el tubo hasta que el termómetro se estabilice, lee el alargamiento en el comparador y calcula α = ΔL / (L₀·ΔT).",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // El intervalo sólo vive mientras la temperatura no ha llegado a su equilibrio.
  const objetivo = vapor ? T_VAPOR : tempIni;
  const enEquilibrio = Math.abs(temp - objetivo) < 0.05;
  useEffect(() => {
    if (enEquilibrio) return;
    const tau = vapor ? TAU_CALENTAR_S : TAU_ENFRIAR_S;
    const id = window.setInterval(() => {
      setTemp((T) => {
        const sig = objetivo + (T - objetivo) * Math.exp(-(TICK_MS / 1000) / tau);
        return Math.abs(sig - objetivo) < 0.05 ? objetivo : sig;
      });
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [vapor, objetivo, enEquilibrio]);

  useEffect(() => { setVeredicto(null); }, [d.ensayo, alphaAlumno]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const alpha = alphaDe(material, alphaMisterioso);
  const termometro = Math.round(temp * 10) / 10;           // resolución 0,1 °C
  const dT = Math.round((termometro - tempIni) * 10) / 10;
  const comparador = lecturaComparador(dilatacion(alpha, longitud, temp - tempIni)); // mm, resolución 1 μm

  const montar = (key: string) => {
    if (key === material) return;
    if (vapor) return avisar('Corta el vapor antes de cambiar la barra.');
    // Una barra nueva se monta a temperatura ambiente.
    setDilatacion7({ material: key, resultado: null });
    setTemp(tempIni);
    audio?.playPop();
  };

  const registrar = () => {
    if (dT < DT_MIN_MEDICION) return avisar(`Calienta al menos ${DT_MIN_MEDICION} °C: con ΔT pequeño el error de lectura domina.`);
    const m: Medicion = { material, dT, dL: comparador };
    setMediciones((prev) => [...prev.slice(-7), m]);
    // Al store sólo va la medición del metal problema: es la que se evalúa.
    if (material === 'misterioso') setDilatacion7({ ensayo: m, resultado: null });
    audio?.playPop();
  };

  const guardarAlpha = (v: string) => {
    setAlphaInput(v);
    const a = parseFloat(v);
    setDilatacion7({ alphaAlumno: Number.isFinite(a) ? a : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF7(d);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  return (
    <LabLayout
      escena={<DilatacionTermica3DScene alpha={alpha} longitud={longitud} tempIni={tempIni} tempFin={temp} material={material} encendido={vapor} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Termómetro" valor={termometro.toFixed(1)} unidad="°C" acento={vapor} />
          <Lectura etiqueta="Comparador" valor={comparador.toFixed(3)} unidad="mm" acento />
          <Lectura etiqueta="L₀" valor={longitud} unidad="mm" />
          <Lectura etiqueta="T₀" valor={tempIni} unidad="°C" />
          <Lectura etiqueta="ΔT" valor={dT.toFixed(1)} unidad="°C" />
        </>
      }
      tituloPanel="Mediciones"
      panelLateral={
        <div className="flex flex-col gap-3">
          <p className="text-[11px] text-slate-400">Vapor a 1 atm: {T_VAPOR} °C. Comparador con resolución de 1 μm.</p>
          {mediciones.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin mediciones todavía.</p> : (
            <table className="w-full text-[10px] font-mono">
              <thead><tr className="text-slate-500"><th className="text-left">Barra</th><th className="text-left">ΔT</th><th className="text-left">ΔL</th></tr></thead>
              <tbody>
                {mediciones.map((m, i) => (
                  <tr key={i} className="border-t border-white/5">
                    <td>{m.material === 'misterioso' ? 'Metal ?' : MATERIALES_DILATACION[m.material]?.nombre}</td>
                    <td>{m.dT.toFixed(1)} °C</td><td>{m.dL.toFixed(3)} mm</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            <Segmentado etiqueta="Barra montada" valor={material} onChange={montar}
              opciones={MATERIALES_UI.map((m) => ({
                valor: m.key,
                texto: m.key !== 'misterioso' ? `${m.nombre} · α ${(MATERIALES_DILATACION[m.key].alpha * 1e6).toFixed(1)}×10⁻⁶` : m.nombre,
              }))} />
            <BotonLab onClick={() => { setVapor((v) => !v); audio?.playPop(); }} variante={vapor ? 'acento' : 'primario'}>
              {vapor ? <><Pause size={14} /> Cortar vapor</> : <><Play size={14} /> Pasar vapor</>}
            </BotonLab>
            <BotonLab onClick={registrar} variante="secundario"><Plus size={14} /> Registrar medición</BotonLab>
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-52 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">α del metal ? (×10⁻⁶ /°C)</span>
              <input type="number" step="0.1" value={alphaInput} onChange={(e) => guardarAlpha(e.target.value)} placeholder="α = ΔL / (L₀·ΔT)"
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
            </label>
            <BotonLab variante="acento" onClick={comprobar}>Comprobar análisis</BotonLab>
            {alerta && (
              <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                <ShieldAlert size={14} /> {alerta}
              </div>
            )}
            <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tu α coincide con tu medición del metal problema. Valida tu práctica." />
          </GrupoControles>
        </div>
      }
    />
  );
}
