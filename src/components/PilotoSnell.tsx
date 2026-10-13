"use client";

import React, { useEffect } from 'react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RefreshCcw, ShieldCheck, CheckCircle2, Box, Circle, Search } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import { ANGULO_MIN_M7, ANGULO_MAX_M7 } from '@/domain/matematicas';
import Snell3DScene from './simuladores/mat07/Snell3DScene';
import { DockInstrumentos } from './simuladores/mat07/Dock';
import { useBancoSnell, type Vista } from './simuladores/mat07/banco';
import {
  LASERES, abbeDe, indiceA, laserDe, lecturaBanco, desdeFase, faseDe, colorLambda, type IdLaser, type Sentido,
} from './simuladores/mat07/optica';

/** Muestra de color de cada fuente (sRGB de su λ; la blanca, un arcoíris). */
function muestra(id: IdLaser): string {
  const l = laserDe(id).lambdaNm;
  if (l == null) return 'linear-gradient(90deg,#ff4d4d,#ffd43b,#51cf66,#22b8cf,#845ef7)';
  const c = colorLambda(l).map((v) => Math.round(255 * Math.pow(v, 1 / 2.2)));
  return `rgb(${c.join(',')})`;
}

const VISTAS: { v: Vista; t: string; icono: React.ReactNode; d: string }[] = [
  { v: 'tresCuartos', t: '3/4', icono: <Box size={13} />, d: 'Vista de conjunto' },
  { v: 'cenital', t: 'Cenital', icono: <Circle size={13} />, d: 'Desde arriba: el disco entero, sin paralaje' },
  { v: 'lupa', t: 'Lupa', icono: <Search size={13} />, d: 'Desde arriba y de cerca, donde el haz cruza la escala' },
];

/**
 * MAT-07 · Ley de Snell. El alumno elige θ₁ con el deslizador, lee θ₂ en la escala
 * grabada del disco y despeja n₂. Ningún panel muestra n₂ ni una magnitud de la que
 * salga directo (θ₂, el ángulo crítico, la curva de Fresnel teórica o la pendiente
 * ajustada) mientras el cristal sea el misterioso y no se haya validado.
 */
export default function PilotoSnell({ onValidate }: { onValidate?: () => void }) {
  const { optica7, setAnguloM7, setUserInputM7, audio, setAsistente } = useSimuladorStore(
    useShallow((s) => ({
      optica7: s.optica7, setAnguloM7: s.setAnguloM7, setUserInputM7: s.setUserInputM7,
      audio: s.audio, setAsistente: s.setAsistente,
    })),
  );
  const { n1, n2, n2Misterio, anguloIncidencia, status, userInputN2 } = optica7;
  const { laser, sentido, pol, vista, faseVis, setLaser, setSentido, setVista, reiniciarBanco } = useBancoSnell(useShallow((s) => ({
    laser: s.laser, sentido: s.sentido, pol: s.pol, vista: s.vista, faseVis: s.faseVis,
    setLaser: s.setLaser, setSentido: s.setSentido, setVista: s.setVista, reiniciarBanco: s.reiniciar,
  })));

  useEffect(() => {
    reiniciarBanco();
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de óptica. Ajusta el ángulo de incidencia, mide el de refracción (ambos desde la normal) y despeja n₂ con la Ley de Snell.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // cifras de la barra: las MISMAS que muestra la escena en este cuadro (reloj único)
  const misterio = n2 === 'misterio';
  const oculto = misterio && status !== 'success'; // n₂ y θ₂ del misterio: sólo tras validar
  const nD = misterio ? n2Misterio : Number(n2);
  const V = abbeDe(nD, misterio);
  const vis = desdeFase(faseVis ?? faseDe(sentido, anguloIncidencia));
  const lectura = lecturaBanco({ sentido: vis.sentido, theta1: vis.theta1, n1, nD, V, laser, pol });
  const blanca = laser === 'white';
  const theta2 = lectura.theta2[0];
  const textoTheta2 = lectura.tir ? 'reflexión total'
    : oculto ? 'mídelo'
      : blanca ? 'abanico (luz blanca)'
        : theta2 == null ? '—' : `${theta2.toFixed(1)}°`;
  const nLaser = indiceA(nD, V, laserDe(laser).lambdaNm);
  const ley = sentido === 'aire-bloque' ? 'n₁·sen θ₁ = n₂·sen θ₂' : 'n₂·sen θ₁ = n₁·sen θ₂';

  return (
    <LabLayout
      tituloPanel="Instrumentos"
      barraSuperior={
        <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
          <Lectura etiqueta="n₁" valor={n1.toFixed(3)} title="Índice del aire" />
          <Lectura etiqueta="n₂" valor={oculto ? '?' : (blanca ? nD : nLaser).toFixed(3)} acento />
          <Lectura etiqueta={sentido === 'aire-bloque' ? 'θ₁' : 'θ₁ bloque'} valor={`${anguloIncidencia}°`} />
          <Lectura etiqueta={sentido === 'aire-bloque' ? 'θ₂' : 'θ₂ aire'} valor={textoTheta2} />
          <Lectura etiqueta="R" valor={`${(lectura.R * 100).toFixed(1)} %`} />
          <Lectura etiqueta="T" valor={`${(lectura.T * 100).toFixed(1)} %`} />
        </div>
      }
      escena={
        <div className="absolute inset-0 bg-[#070a0e]">
          <Snell3DScene n1={n1} n2={n2} n2Misterio={n2Misterio} anguloIncidencia={anguloIncidencia} status={status} />
          {/* vistas de cámara: abajo a la izquierda, fuera del disco */}
          <div className="absolute bottom-2 left-2 flex rounded-lg border border-white/10 bg-[#0b1220]/80 p-0.5 backdrop-blur" role="group" aria-label="Vista de cámara">
            {VISTAS.map((o) => (
              <button key={o.v} type="button" title={o.d} onClick={() => { setVista(o.v); audio?.playPop(); }}
                className={`flex h-7 items-center gap-1 rounded-md px-2 text-[11px] font-semibold ${vista === o.v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
                {o.icono}{o.t}
              </button>
            ))}
          </div>
          <div className="pointer-events-none absolute bottom-2 right-2 rounded-md bg-[#0b1220]/70 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90">{ley}</div>
        </div>
      }
      panelLateral={<DockInstrumentos n1={n1} n2={n2} n2Misterio={n2Misterio} anguloIncidencia={anguloIncidencia} status={status} />}
      controles={
        <div className="space-y-2">
          <GrupoControles className="items-end">
            <div className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Fuente <span className="font-mono text-slate-400">· {laserDe(laser).corto}</span></span>
              <div className="flex gap-1 rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
                {LASERES.map((opt) => (
                  <button key={opt.id} type="button" title={opt.nombre} aria-label={opt.nombre} aria-pressed={laser === opt.id}
                    onClick={() => { setLaser(opt.id); audio?.playPop(); }}
                    className={`flex h-7 w-8 items-center justify-center rounded-md ${laser === opt.id ? 'bg-white/15 ring-1 ring-white/60' : 'opacity-60 hover:opacity-100'}`}>
                    <i className="block h-3.5 w-3.5 rounded-full" style={{ background: muestra(opt.id), boxShadow: laser === opt.id ? `0 0 8px ${muestra(opt.id)}` : undefined }} />
                  </button>
                ))}
              </div>
            </div>
            <Segmentado<Sentido> etiqueta="Sentido de la luz" valor={sentido}
              opciones={[{ valor: 'aire-bloque', texto: 'Aire → bloque' }, { valor: 'bloque-aire', texto: 'Bloque → aire' }]}
              onChange={(s) => { setSentido(s); audio?.playPop(); }} />
            <Deslizador etiqueta={sentido === 'aire-bloque' ? 'Ángulo de incidencia θ₁' : 'θ₁ dentro del bloque'} valor={anguloIncidencia}
              min={ANGULO_MIN_M7} max={ANGULO_MAX_M7} paso={1} unidad="°" ancho="w-48" onChange={(v) => setAnguloM7(v)} />
            <BotonLab variante="secundario" title="Reiniciar ángulo y respuesta (el medio no cambia)" onClick={() => { setAnguloM7(45); setUserInputM7(''); audio?.playPop(); }}>
              <RefreshCcw size={14} /> Reiniciar
            </BotonLab>
          </GrupoControles>
          <GrupoControles className="items-end">
            <label className="flex flex-col gap-1">
              <span className="text-[11px] font-semibold text-slate-300">Tu valor de n₂</span>
              <input type="text" inputMode="decimal" value={userInputN2} onChange={(e) => setUserInputM7(e.target.value)} placeholder="p. ej. 1.52"
                className="h-8 w-28 rounded-lg border border-white/15 bg-white/[0.05] px-2.5 font-mono text-[13px] font-semibold text-white outline-none focus:border-[#219EBC]" />
            </label>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
              <ShieldCheck size={14} /> {status === 'success' ? 'Calibrado' : 'Calibrar / Verificar'}
            </BotonLab>
            {status === 'success' && <span role="status" className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300"><CheckCircle2 size={14} /> n₂ correcto</span>}
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Valor incorrecto: revisa el cociente de senos.</span>}
          </GrupoControles>
        </div>
      }
    />
  );
}
