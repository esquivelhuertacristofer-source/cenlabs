'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { Zap, ShieldCheck, RotateCcw } from 'lucide-react';
import { RETARDO_SINAPSIS_B7, RETARDO_PLACA_B7, latenciaB7 } from '@/domain/biologia';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab } from './simulador/LabLayout';
import { RelojArco, nuevoEnsayo } from './simuladores/bio07/reloj';
import { calibrarMotoneurona, formaPA } from './simuladores/bio07/arco';
import { ensayoEnCurso } from './simuladores/bio07/enCurso';
import type { ModoVisor } from './simuladores/bio07/SistemaNervioso3DScene';

const VisorSistemaNervioso = dynamic(() => import('./simuladores/bio07/SistemaNervioso3DScene'), {
  ssr: false,
  loading: () => <div className="flex h-full w-full items-center justify-center bg-[#060b13] text-[11px] font-semibold text-sky-200">Preparando la neurona…</div>,
});

/** Con coma decimal (es-MX formatea a la inglesa). */
const coma = (x: number, d = 1) => x.toFixed(d).replace('.', ',');

/**
 * Arco reflejo rotuliano. El store (dominio) decide si hay reflejo y la latencia; la
 * escena la anima con RelojArco. integridadMielina y umbral son del paciente: no se
 * muestran (la mielina sólo fija cuándo llega la descarga Ia en un golpe sin reflejo).
 */
export default function PilotoSistemaNervioso({ onValidate }: { onValidate?: () => void }) {
  const sistemaNervioso = useSimuladorStore((s) => s.sistemaNervioso);
  const setB7State = useSimuladorStore((s) => s.setB7State);
  const registrarGolpeB7 = useSimuladorStore((s) => s.registrarGolpeB7);
  const resetB7 = useSimuladorStore((s) => s.resetB7);
  const { fuerzaGolpe, distancia, ensayos, velocidadEstimada, diagnostico, status } = sistemaNervioso;

  const relojArco = useMemo(() => new RelojArco(), []);
  const [modo, setModo] = useState<ModoVisor>('neurona');
  const [ocupado, setOcupado] = useState(false);
  const [velTexto, setVelTexto] = useState(velocidadEstimada === null ? '' : String(velocidadEstimada));
  const n = useRef(0);
  const seguro = useRef<ReturnType<typeof setInterval> | null>(null);
  const reducido = useMemo(() => typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches, []);

  // la motoneurona y la forma del PA se calibran en un momento libre (no al primer golpe)
  useEffect(() => {
    const w = window as unknown as { requestIdleCallback?: (f: () => void) => number; cancelIdleCallback?: (h: number) => void };
    const f = () => { formaPA(); calibrarMotoneurona(RETARDO_SINAPSIS_B7); };
    if (w.requestIdleCallback) { const h = w.requestIdleCallback(f); return () => w.cancelIdleCallback?.(h); }
    const t = setTimeout(f, 1500); return () => clearTimeout(t);
  }, []);
  useEffect(() => () => { if (seguro.current) clearInterval(seguro.current); }, []);
  // la bitácora oculta la latencia del golpe hasta que el EMG la haya mostrado
  useEffect(() => { ensayoEnCurso.fijar(ocupado); }, [ocupado]);
  useEffect(() => () => ensayoEnCurso.fijar(false), []);

  const golpear = useCallback(() => {
    if (ocupado) return;
    const s = useSimuladorStore.getState().sistemaNervioso;
    const e = registrarGolpeB7();
    // sin reflejo, la descarga Ia llega igual a la médula: su tiempo es el del paciente
    const L = e.latencia ?? latenciaB7(s.distancia, s.integridadMielina);
    const ensayo = nuevoEnsayo({ supra: e.respuesta, L, fuerza: e.fuerza, n: ++n.current, tSinapsis: RETARDO_SINAPSIS_B7, tPlaca: RETARDO_PLACA_B7 });
    setModo('arco');
    setOcupado(true);
    relojArco.iniciar(ensayo, () => {
      setOcupado(false);
      if (seguro.current) { clearInterval(seguro.current); seguro.current = null; }
    });
    if (reducido) relojArco.terminar();
    else {
      // red de seguridad: si la escena deja de avanzar el reloj sin estar en pausa (sin WebGL,
      // pestaña congelada), el ensayo termina igual a los ~6 s y los mandos no se quedan bloqueados
      let ultimoT = relojArco.t, quieto = 0;
      seguro.current = setInterval(() => {
        if (!relojArco.activo) return;
        if (relojArco.pausa || relojArco.t !== ultimoT) { ultimoT = relojArco.t; quieto = 0; return; }
        if (++quieto >= 3) relojArco.terminar();
      }, 2000);
    }
    audio?.playPop();
  }, [ocupado, registrarGolpeB7, relojArco, reducido]);

  const ultimo = ensayos[ensayos.length - 1];
  const validado = status === 'success';

  return (
    <LabLayout
      escena={<VisorSistemaNervioso modo={modo} onModo={setModo} relojArco={relojArco} fuerza={fuerzaGolpe} distancia={distancia} validado={validado} ocupado={ocupado} />}
      barraSuperior={
        <>
          <Lectura etiqueta="Recorrido" valor={coma(distancia, 2)} unidad="m" title="Tendón → médula L3–L4 → cuádriceps (ida y vuelta)" />
          <Lectura etiqueta="Sinapsis" valor={coma(RETARDO_SINAPSIS_B7)} unidad="ms" title="Retardo de la sinapsis central" />
          <Lectura etiqueta="Placa" valor={coma(RETARDO_PLACA_B7)} unidad="ms" title="Retardo de la placa neuromuscular" />
          {ultimo && !ocupado && (
            <Lectura acento etiqueta="Último" valor={ultimo.respuesta && ultimo.latencia !== null ? `${coma(ultimo.latencia)} ms` : 'sin reflejo'} />
          )}
        </>
      }
      tituloPanel="Paciente"
      panelLateral={
        <div className="flex flex-col gap-3 text-slate-300">
          <p className="text-[12px] leading-snug">
            Busca un golpe sin reflejo y otro con reflejo, mide la latencia en el EMG, calcula la velocidad de conducción y diagnostica.
          </p>
          <div>
            <div className="mb-1 flex items-center justify-between">
              <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Ensayos</span>
              <button type="button" onClick={() => { resetB7(); setVelTexto(''); }} disabled={ocupado} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white disabled:opacity-40"><RotateCcw size={12} /> Borrar</button>
            </div>
            {ensayos.length === 0 ? <p className="text-[11px] italic text-slate-500">Sin ensayos.</p> : (
              <table className="w-full font-mono text-[11px]">
                <thead><tr className="text-[9px] uppercase text-slate-500"><th className="text-left">#</th><th>Fuerza</th><th>Reflejo</th><th className="text-right">Latencia</th></tr></thead>
                <tbody>
                  {ensayos.map((e, i) => {
                    const enCurso = ocupado && i === ensayos.length - 1;
                    return (
                      <tr key={i}><td>{i + 1}</td><td className="text-center">{e.fuerza} %</td>
                        <td className="text-center">{enCurso ? '…' : e.respuesta ? 'sí' : 'no'}</td>
                        <td className="text-right">{enCurso ? '…' : e.latencia === null ? '—' : `${coma(e.latencia)} ms`}</td></tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
          <details className="rounded-lg border border-white/10 bg-white/[0.03] p-2.5 text-[11px] leading-snug text-slate-300">
            <summary className="cursor-pointer text-[10px] font-bold uppercase tracking-wider text-slate-400">Cómo está hecho el modelo</summary>
            <div className="mt-2 space-y-1.5">
              <p><b>Membrana</b> (Hodgkin y Huxley, 1952): C·dV/dt = I − g<sub>Na</sub>m³h(V − E<sub>Na</sub>) − g<sub>K</sub>n⁴(V − E<sub>K</sub>) − g<sub>L</sub>(V − E<sub>L</sub>), con las tasas originales, reposo −65 mV y φ = 3<sup>(T − 6,3)/10</sup> a 18,5 °C, la temperatura con la que HH calcularon su PA propagado (18,8 m/s en el axón gigante; el modelo da 18,7).</p>
              <p><b>Neurona del banco</b>: soma de 50 µm, cono axónico, axón de 10 mm y terminal; ecuación del cable con Euler implícito (método de Hines). Fibra mielínica: nodos de Ranvier de 1 µm con 20 veces la densidad de canales e internodos de 100·D cubiertos por N lamelas (C y G de la membrana entre 2N); g = d/D = 0,7. Desmielinizada: un tercio de las lamelas. Sin mielina: membrana HH continua.</p>
              <p><b>Lo que sale</b>: sin mielina v = 0,61·√D m/s; con mielina v = 2,4·D m/s (saltatoria: ≈ 41 µs por internodo, sea cual sea D); desmielinizada ≈ 1,17·D. Son velocidades a 18,5 °C: a 37 °C un nervio humano conduce de 2 a 2,7 veces más rápido (Q₁₀ ≈ 1,5–1,7). El umbral, la ley del todo o nada y el periodo refractario (doble pulso) salen del mismo modelo.</p>
              <p><b>Arco reflejo</b>: L = d/v + 0,7 ms (sinapsis) + 0,8 ms (placa), con la latencia y v del paciente que da el dominio; la conducción se reparte entre la vía Ia y la α. La motoneurona es un compartimento HH con la corriente sináptica alfa (τ = 0,1 ms) de la descarga Ia: un golpe débil da un PEPS; uno suficiente, un PA. EMG de superficie: suma de potenciales de unidad motora de Hermite–Rodríguez.</p>
              <p><b>Simplificaciones</b>: cinéticas del calamar (no de mamífero); esquema no a escala (la fibra se dibuja unas 30 veces más gruesa de lo que toca a su largo; la médula y el huso, ampliados); PA muscular esquemático a 2 m/s; los gradientes de Na⁺ y K⁺ se restituyen entre barridos (la bomba, mucho más lenta, no se dibuja); el reflejo rotuliano es monosináptico: la interneurona Ia inhibidora frena a los isquiotibiales (inhibición recíproca).</p>
            </div>
          </details>
        </div>
      }
      controles={
        <GrupoControles>
          <Deslizador etiqueta="Fuerza del martillo" valor={fuerzaGolpe} min={0} max={100} paso={1} unidad="%" ancho="w-48" deshabilitado={ocupado} onChange={(v) => setB7State({ fuerzaGolpe: v })} />
          <BotonLab onClick={golpear} deshabilitado={ocupado}><Zap size={14} /> {ocupado ? 'Registrando…' : 'Golpear el tendón'}</BotonLab>
          <label className="flex w-40 flex-col gap-1">
            <span className="text-[11px] font-semibold text-amber-300">Velocidad de conducción (m/s)</span>
            <input type="number" step="0.1" min="0" value={velTexto}
              onChange={(e) => {
                setVelTexto(e.target.value);
                const v = parseFloat(e.target.value.replace(',', '.'));
                setB7State({ velocidadEstimada: Number.isFinite(v) && v > 0 ? v : null });
              }}
              className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
          </label>
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">Diagnóstico</span>
            <div className="flex gap-1">
              {(['normal', 'desmielinizante'] as const).map((d) => (
                <button key={d} type="button" onClick={() => setB7State({ diagnostico: d })} aria-pressed={diagnostico === d}
                  className={`h-8 rounded-lg border px-2.5 text-[11px] font-semibold ${diagnostico === d ? 'border-cyan-400 bg-cyan-700/70 text-white' : 'border-white/15 bg-white/[0.04] text-slate-300 hover:text-white'}`}>
                  {d === 'normal' ? 'Conducción normal' : 'Neuropatía desmielinizante'}
                </button>
              ))}
            </div>
          </div>
          <BotonLab variante={validado ? 'primario' : 'acento'} onClick={() => onValidate?.()} deshabilitado={ocupado}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        </GrupoControles>
      }
    />
  );
}
