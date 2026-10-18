"use client";
/**
 * QUI-10 · Destilación fraccionada.
 *
 * Una columna de 5 platos de campanas en media sección, sobre el mismo banco en dos modos:
 *  · EXPLORACIÓN (estado inicial): la columna CONTINUA ya en régimen, alimentada al plato 3 con
 *    hexano–heptano (ideal, Raoult, α constante) o etanol–agua (tabla real, azeótropo). El alumno
 *    mueve el reflujo, el calor del hervidor o pone reflujo total; la composición de cada plato
 *    evoluciona con su retención (cámara rápida rotulada) y el dock dibuja la escalera de
 *    McCabe–Thiele con las composiciones reales.
 *  · RETO: la destilación por lotes del store (100 mL de etanol + 100 mL de agua, `pasoDestilacion`
 *    y `validarQ10` sin cambios): el alumno regula la manta y certifica 50 mL ≥ 85 % v/v. Nada
 *    dibuja la escalera ni las etapas efectivas antes de validar.
 *
 * La física vive en `simuladores/qmi10/columna.ts`; el reloj único, en `reloj.ts`.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { RotateCcw, CheckCircle2, Flame, Minus, Plus, Pause, Play, Scan, Tags } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarQ10, PUREZA_REQUERIDA_Q10, VOL_REQUERIDO_Q10 } from '@/domain/quimica';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from '@/components/simulador/LabLayout';
import { RelojDestilacion, type ModoQ10 } from './simuladores/qmi10/reloj';
import { MEZCLAS, MEZCLAS_LISTA, Q_MIN, Q_MAX, R_MIN, R_MAX, type IdMezcla } from './simuladores/qmi10/columna';
import { DockDestilacion, cifra, useTickReloj } from './simuladores/qmi10/Dock';
import type { VistaQ10 } from './simuladores/qmi10/Destilacion3DScene';

const Destilacion3DScene = dynamic(() => import('./simuladores/qmi10/Destilacion3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#06090c]" />,
});

// La simulación del reto avanza 4 veces por segundo con el tiempo real transcurrido.
const PASO_DESTILACION_MS = 250;

type Calidad = 'alta' | 'media';

/** Calidad media SÓLO en móvil, < 820 px o ≤ 2 núcleos (`?calidad=` la fuerza). */
function detectarCalidad(): Calidad {
  if (typeof window === 'undefined') return 'alta';
  const forzada = new URLSearchParams(window.location.search).get('calidad');
  if (forzada === 'alta' || forzada === 'media') return forzada;
  const movil = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const nucleos = navigator.hardwareConcurrency ?? 8;
  return movil || window.innerWidth < 820 || nucleos <= 2 ? 'media' : 'alta';
}

function prefiereReducirMovimiento(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

const NOMBRE_CORTO: Record<IdMezcla, string> = { hexanoHeptano: 'Hexano–heptano', etanolAgua: 'Etanol–agua' };

function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Lecturas de la exploración: las del MISMO cuadro que la escena. */
function LecturasExplorar({ reloj }: { reloj: React.MutableRefObject<RelojDestilacion> }) {
  useTickReloj(reloj, 8);
  const r = reloj.current, v = r.vista;
  return (
    <>
      <Lectura etiqueta="Cabeza" valor={cifra(v.tCabeza, 1)} unidad="°C" acento title="Pt100 de la cabeza de la columna" />
      <Lectura etiqueta={`x_D ${r.mezcla.ligero}`} valor={cifra(v.x[0], 3)} title={`Fracción molar de ${r.mezcla.ligero} en el destilado`} />
      <Lectura etiqueta="Fondo" valor={cifra(v.x[v.x.length - 1], 3)} title={`Fracción molar de ${r.mezcla.ligero} en el hervidor`} />
    </>
  );
}

export default function PilotoDestilacionFraccionada({ isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { destilacion, setCalorManta, updateDestilacion, resetP10, validarP10, audio } = useSimuladorStore(useShallow((s) => ({
    destilacion: s.destilacion, setCalorManta: s.setCalorManta, updateDestilacion: s.updateDestilacion,
    resetP10: s.resetP10, validarP10: s.validarP10, audio: s.audio,
  })));

  // ── el reto: el store avanza con el tiempo real (el bucle de siempre) ──
  const lastTickRef = useRef(Date.now());
  useEffect(() => {
    lastTickRef.current = Date.now();
    const interval = setInterval(() => {
      const now = Date.now();
      const dt = Math.min(1, (now - lastTickRef.current) / 1000);
      lastTickRef.current = now;
      updateDestilacion(dt);
    }, PASO_DESTILACION_MS);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── modo, reloj y ajustes ──
  const [modo, setModo] = useState<ModoQ10>('explorar');
  const [mezcla, setMezcla] = useState<IdMezcla>('hexanoHeptano');
  const [R, setR] = useState(2);
  const [total, setTotal] = useState(false);
  const [Q, setQ] = useState(280);
  const [rapido, setRapido] = useState(false);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [vista, setVista] = useState<VistaQ10>('columna');
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [panelInicial] = useState<boolean | undefined>(() => (typeof window !== 'undefined' && window.innerWidth >= 1500 ? true : undefined));

  const relojRef = useRef<RelojDestilacion | null>(null);
  if (!relojRef.current) relojRef.current = new RelojDestilacion('hexanoHeptano', { R: 2, Q: 280, total: false });
  const reloj = useRef<RelojDestilacion>(relojRef.current);

  useEffect(() => { reloj.current.ponerModo(modo); }, [modo]);
  useEffect(() => { reloj.current.ponerMezcla(mezcla); }, [mezcla]);
  useEffect(() => { reloj.current.operar({ R, Q, total }); }, [R, Q, total]);
  useEffect(() => { reloj.current.factor = rapido ? 100 : 20; }, [rapido]);
  useEffect(() => { reloj.current.reducido = reducido; }, [reducido]);
  // la pausa congela la exploración; el reto corre en tiempo real (es el del store)
  useEffect(() => { reloj.current.pausa = pausa && modo === 'explorar'; }, [pausa, modo]);
  useEffect(() => { reloj.current.sincronizarReto(destilacion); }, [destilacion]);

  // ── reto ──
  const [intentado, setIntentado] = useState(false);
  const validado = destilacion.status === 'success';
  const veredicto = validarQ10(destilacion);
  const hierve = destilacion.tasa > 0;
  const puedeValidar = destilacion.volDestilado >= VOL_REQUERIDO_Q10;
  const certificar = () => {
    audio?.playClick?.();
    setIntentado(true);
    // un solo juez: el validador de la práctica (quiz + modal comunes)
    if (onValidate) { onValidate(); return; }
    if (validarP10()) audio?.playSuccess?.(); else audio?.playError?.();
  };
  const reiniciarReto = () => { resetP10(); setIntentado(false); audio?.playPop?.(); };

  // ── aviso que aparece una vez por modo y se desvanece ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoQ10>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'El vapor burbujea en cada plato y el reflujo baja. Sube el reflujo y mira la escalera.'
        : 'Calienta la manta y junta 50 mL de destilado con buen grado.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const explorar = modo === 'explorar';

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#06090c]" data-modo-q10={modo}>
      <Destilacion3DScene reloj={reloj} modo={modo} vista={vista} calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        <Pildora activo={vista === 'columna'} onClick={() => setVista('columna')} title="La columna por dentro, de la brida inferior a la cabeza">Columna</Pildora>
        <Pildora activo={vista === 'montaje'} onClick={() => setVista('montaje')} title="Todo el montaje: hervidor, condensador, receptor y alimentación">Montaje</Pildora>
        <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
        <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur" data-ritmo-q10="">
        {!explorar ? 'Tiempo real' : pausa ? 'En pausa' : `Composición ×${rapido ? 100 : 20}`}
      </div>
      <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: vidrio con transmisión y posproceso)"
        className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-q10={calidad}>
        Calidad: {calidad}
      </button>
      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
          <span className="aviso-q10 max-w-[520px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-q10="">
            {aviso.texto}
          </span>
        </div>
      )}
      <style>{`.aviso-q10{animation:avisoQ10 7s ease forwards}@keyframes avisoQ10{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-q10{animation:none}}`}</style>
    </div>
  );

  const pur = destilacion.purezaDestilado;
  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{explorar ? 'Exploración' : 'Reto'}</span>
        <span className="text-[13px] font-bold text-white">{explorar ? `${NOMBRE_CORTO[mezcla]} · z ${cifra(MEZCLAS[mezcla].z, 2)}` : 'Etanol–agua 1 : 1'}</span>
      </div>
      {explorar ? <LecturasExplorar reloj={reloj} /> : (
        <>
          <Lectura etiqueta="Matraz" valor={cifra(destilacion.tempMezcla, 1)} unidad="°C" />
          <Lectura etiqueta="Cabeza" valor={cifra(destilacion.tempCabeza, 1)} unidad="°C" acento={hierve} />
          <Lectura etiqueta="Destilado" valor={cifra(destilacion.volDestilado, 1)} unidad="mL" />
          <Lectura etiqueta="Alcohol" valor={destilacion.volDestilado > 0 ? cifra(pur, 1) : '—'} unidad="% v/v" acento={destilacion.volDestilado > 0 && pur >= PUREZA_REQUERIDA_Q10} />
        </>
      )}
    </div>
  );

  const controlesComunes = (
    <GrupoControles className="items-end">
      <Segmentado<ModoQ10> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop?.(); }}
        opciones={[{ valor: 'explorar', texto: 'Exploración' }, { valor: 'reto', texto: 'Reto' }]} />
      {explorar && (
        <>
          <Segmentado<IdMezcla> etiqueta="Mezcla" valor={mezcla} onChange={(v) => { setMezcla(v); audio?.playPop?.(); }}
            opciones={MEZCLAS_LISTA.map((id) => ({ valor: id, texto: NOMBRE_CORTO[id] }))} />
          <Segmentado<string> etiqueta="Ritmo" valor={rapido ? '100' : '20'} onChange={(v) => { setRapido(v === '100'); audio?.playPop?.(); }}
            opciones={[{ valor: '20', texto: '×20' }, { valor: '100', texto: '×100' }]} />
          <BotonLab variante="secundario" title={pausa ? 'Reanudar' : 'Pausar'} onClick={() => setPausa((p) => !p)}>
            {pausa ? <Play size={14} /> : <Pause size={14} />}
          </BotonLab>
        </>
      )}
    </GrupoControles>
  );

  const controlesExplorar = (
    <GrupoControles className="items-end">
      <label className="flex w-40 min-w-[130px] flex-col gap-1">
        <span className="flex justify-between text-[11px] font-semibold text-slate-300"><span>Reflujo R</span><span className="font-mono tabular-nums text-white">{total ? 'total' : cifra(R, 1)}</span></span>
        <input type="range" min={R_MIN} max={R_MAX} step={0.5} value={R} disabled={total} onChange={(e) => setR(Number(e.target.value))} aria-label="Relación de reflujo L/D"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC] disabled:opacity-40" />
      </label>
      <button type="button" onClick={() => { setTotal((t) => !t); audio?.playPop?.(); }} aria-pressed={total} title="Reflujo total: todo el condensado vuelve a la columna; ni alimentación ni destilado"
        className={`flex h-8 items-center rounded-lg border px-3 text-[12px] font-semibold transition-colors ${total ? 'border-sky-400/50 bg-sky-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:text-white'}`}>
        Total
      </button>
      <label className="flex w-40 min-w-[130px] flex-col gap-1">
        <span className="flex justify-between text-[11px] font-semibold text-slate-300"><span>Hervidor</span><span className="font-mono tabular-nums text-white">{Q} W</span></span>
        <input type="range" min={Q_MIN} max={Q_MAX} step={10} value={Q} onChange={(e) => setQ(Number(e.target.value))} aria-label="Potencia del hervidor"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#FB8500]" />
      </label>
    </GrupoControles>
  );

  const controlesReto = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <div className="flex flex-col gap-1">
          <span className="flex items-center gap-1.5 text-[11px] font-semibold text-slate-300"><Flame size={12} className="text-orange-400" /> Manta (consigna)</span>
          <div className="flex items-center gap-1.5">
            {[-5, -1].map((d) => (
              <button key={d} type="button" aria-label={`Bajar la manta ${-d} °C`} onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop?.(); }}
                className="flex h-8 w-10 items-center justify-center gap-0.5 rounded-lg border border-white/15 bg-white/5 text-[12px] font-bold text-white hover:border-[#219EBC]"><Minus size={11} />{-d}</button>
            ))}
            <span className="min-w-[64px] rounded-lg border border-orange-400/40 bg-orange-500/10 px-2 py-1 text-center font-mono text-[15px] font-semibold tabular-nums text-orange-200" data-consigna-q10="">{destilacion.calorManta}<span className="ml-0.5 text-[11px] text-orange-300/80">°C</span></span>
            {[1, 5].map((d) => (
              <button key={d} type="button" aria-label={`Subir la manta ${d} °C`} onClick={() => { setCalorManta(destilacion.calorManta + d); audio?.playPop?.(); }}
                className="flex h-8 w-10 items-center justify-center gap-0.5 rounded-lg bg-orange-500 text-[12px] font-bold text-white hover:bg-orange-600"><Plus size={11} />{d}</button>
            ))}
          </div>
        </div>
        {puedeValidar && !validado && (
          <BotonLab variante="acento" onClick={certificar}><CheckCircle2 size={14} /> Certificar</BotonLab>
        )}
        <button type="button" aria-label="Reiniciar la destilación" title="Reiniciar la destilación" onClick={reiniciarReto}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
      </GrupoControles>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-[12px]">
        <span className="text-slate-400">Meta: {VOL_REQUERIDO_Q10} mL con ≥ {PUREZA_REQUERIDA_Q10} % v/v.</span>
        {(validado || (intentado && destilacion.status === 'error' && veredicto.mensaje)) && (
          <span role="status" className={validado ? 'font-semibold text-emerald-300' : 'text-amber-200'}>
            {validado ? 'Destilado certificado' : veredicto.mensaje}
          </span>
        )}
      </div>
    </div>
  );

  const controles = (
    <div className="space-y-2">
      {controlesComunes}
      {explorar ? controlesExplorar : controlesReto}
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
      panelLateral={<DockDestilacion reloj={reloj} modo={modo} revela={!explorar && validado} docente={isProfesor} />}
      tituloPanel="Instrumentos"
      panelAbiertoInicial={panelInicial}
    />
  );
}
