"use client";
/**
 * MAT-06 · Transformaciones geométricas.
 *
 * Dos modos sobre el mismo taller y el MISMO tipo de reloj (mat06/reloj.ts):
 *  · TALLER (exploración, estado inicial): la figura de vidrio viaja a su imagen en bucle y
 *    recorre sola las cinco estaciones (rotación, reflexión, homotecia, traslación y
 *    composición). El dock enseña la matriz 3×3 de la pose de cada instante, su determinante
 *    (área con signo), el paralelogramo de la base y las coordenadas original → ahora.
 *  · RETO: el flujo del store (`geometria6`): acoplar la placa con la SILUETA objetivo
 *    (sin cifras) con M = T·R·S. El validador y el store no cambian; la escena y el dock no
 *    dibujan ni escriben la transformación pedida hasta validar.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { Pause, Play, Scan, Tags, BookOpen, X, RefreshCcw, ShieldCheck, CheckCircle2, Route } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { RANGO_T_M6, ESCALA_MIN_M6, ESCALA_MAX_M6 } from '@/domain/matematicas';
import LabLayout, { Lectura, BotonLab } from './simulador/LabLayout';
import { RelojTransf, type ModoM6 } from './simuladores/mat06/reloj';
import { DockTransf, useTickReloj } from './simuladores/mat06/Dock';
import {
  TIPOS, NOMBRE_TIPO, RANGOS, PUNTO_C, num, numCorto, rotuloTransformacion, trs, det2,
  type TipoT, type Centro,
} from './simuladores/mat06/transformaciones';
import type { Calidad } from './simuladores/_kit';

const Transformaciones3DScene = dynamic(() => import('./simuladores/mat06/Transformaciones3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#05080b]" />,
});

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

/** Pastilla de la escena (capas y vistas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

const ETQ = 'shrink-0 text-[11px] font-semibold text-slate-400';

/** Deslizador en línea con la cifra en coma decimal. */
function Mando({ etiqueta, valor, min, max, paso, unidad = '', decimales, onChange, ancho = 'w-[clamp(84px,11vw,150px)]' }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad?: string; decimales: number; onChange: (v: number) => void; ancho?: string;
}) {
  return (
    <label className="flex h-8 items-center gap-2">
      <span className={ETQ}>{etiqueta}</span>
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${num(valor, decimales)} ${unidad}`} aria-label={etiqueta}
        className={`h-1.5 ${ancho} cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]`} />
      <span className="w-[44px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-white">{num(valor, decimales)}{unidad}</span>
    </label>
  );
}

function Seg<T extends string>({ etiqueta, valor, opciones, onChange }: { etiqueta?: string; valor: T; opciones: { valor: T; texto: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex h-8 items-center gap-2">
      {etiqueta && <span className={ETQ}>{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
            className={`h-7 rounded-md px-2.5 text-[11px] font-semibold ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ecuaciones y simplificaciones (desplegable cerrado). */
function Modelo({ onCerrar }: { onCerrar: () => void }) {
  const f = (s: string) => <span className="whitespace-nowrap font-mono text-[10.5px] text-slate-100">{s}</span>;
  return (
    <div className="pointer-events-auto absolute right-2 top-11 z-30 flex max-h-[calc(100%-3.25rem)] w-[min(calc(100%-1rem),600px)] flex-col rounded-xl border border-white/15 bg-[#0b1422]/95 shadow-2xl backdrop-blur" data-modelo-m6="">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 py-2 text-[11px] leading-snug text-slate-300 sm:grid sm:grid-cols-2 sm:gap-x-4">
        <div className="space-y-1.5">
          <p><b className="text-white">Coordenadas homogéneas.</b> El punto (x, y) es (x, y, 1) y toda transformación es una 3×3: {f('[[a, b, tx], [c, d, ty], [0, 0, 1]]')}. El bloque 2×2 gira, refleja o escala; la columna (tx, ty) traslada. Componer es multiplicar: en {f('T·R')} se gira primero.</p>
          <p><b className="text-white">Las cinco.</b> {f('R(θ) = [[cos θ, −sen θ], [sen θ, cos θ]]')}; centro c: {f('T(c)·R·T(−c)')}. Reflexión en el eje de dirección α: {f('[[cos 2α, sen 2α], [sen 2α, −cos 2α]]')}. Homotecia {f('P′ = c + k(P − c)')}. {f('T·R ≠ R·T')}: mismo bloque 2×2, distinta traslación, {f('(I − R)·v')}.</p>
        </div>
        <div className="mt-1.5 space-y-1.5 sm:mt-0">
          <p><b className="text-white">Determinante.</b> {f('det = ad − bc')} es el factor de área con signo (fórmula del cordón de zapato): giro y traslación, 1; reflexión, −1; homotecia, k²; reto, s². Si es negativo, la orientación se invierte.</p>
          <p><b className="text-white">El viaje.</b> La pieza va de la identidad a M por su camino natural: t·v, t·θ, razón 1 + t(k − 1). La reflexión se anima como medio giro en el espacio alrededor del eje (por eso se ve el dorso); su sombra sobre el vidrio es {f('I − (1 − cos φ)·n·nᵀ')}, con {f('det = cos φ')}. Las piezas flotan un poco delante de la placa; el viaje dura unos segundos y no es un tiempo físico.</p>
        </div>
      </div>
    </div>
  );
}

/** Mandos del taller: siguen al reloj (el recorrido cambia de estación solo). */
function MandosTaller({ reloj }: { reloj: RelojTransf }) {
  useTickReloj(reloj, 12);
  const tipo = reloj.tipo, p = reloj.p;
  const set = (parcial: Parameters<RelojTransf['setParam']>[0]) => reloj.setParam(parcial);
  const centro = (
    <Seg<Centro> etiqueta="Centro" valor={p.centro} onChange={(c) => set({ centro: c })}
      opciones={[{ valor: 'O', texto: 'O' }, { valor: 'C', texto: `C(${num(PUNTO_C[0], 0)}; ${num(PUNTO_C[1], 1)})` }]} />
  );
  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <Seg<TipoT> valor={tipo} onChange={(t) => reloj.setTipo(t)}
          opciones={TIPOS.map((t) => ({ valor: t, texto: NOMBRE_TIPO[t] }))} />
      </div>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        {tipo === 'rotacion' && (<><Mando etiqueta="Ángulo θ" valor={p.theta} {...RANGOS.theta} unidad="°" decimales={0} onChange={(v) => set({ theta: v })} />{centro}</>)}
        {tipo === 'reflexion' && <Mando etiqueta="Eje α" valor={p.alfa} {...RANGOS.alfa} unidad="°" decimales={0} onChange={(v) => set({ alfa: v })} />}
        {tipo === 'homotecia' && (<><Mando etiqueta="Razón k" valor={p.k} {...RANGOS.k} decimales={2} onChange={(v) => set({ k: v })} />{centro}</>)}
        {tipo === 'traslacion' && (<>
          <Mando etiqueta="vx" valor={p.vx} {...RANGOS.vx} decimales={1} onChange={(v) => set({ vx: v })} />
          <Mando etiqueta="vy" valor={p.vy} {...RANGOS.vy} decimales={1} onChange={(v) => set({ vy: v })} />
        </>)}
        {tipo === 'composicion' && (<>
          <Mando etiqueta="θ" valor={p.theta} {...RANGOS.theta} unidad="°" decimales={0} onChange={(v) => set({ theta: v })} />
          <Mando etiqueta="vx" valor={p.vx} {...RANGOS.vComp} decimales={1} onChange={(v) => set({ vx: v })} />
          <Mando etiqueta="vy" valor={p.vy} {...RANGOS.vComp} decimales={1} onChange={(v) => set({ vy: v })} />
        </>)}
        <div className="flex items-center gap-1.5">
          <button type="button" onClick={() => reloj.setPausa(!reloj.pausa)} title={reloj.pausa ? 'Reanudar el viaje' : 'Pausa'} aria-label={reloj.pausa ? 'Reanudar' : 'Pausa'}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/[0.04] text-slate-200 hover:text-white">
            {reloj.pausa ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <Mando etiqueta="Avance t" valor={Math.round(reloj.u * 100) / 100} min={0} max={1} paso={0.01} decimales={2} onChange={(v) => reloj.setAvance(v)} ancho="w-[clamp(70px,9vw,120px)]" />
        </div>
      </div>
    </div>
  );
}

/** Chip de la estación (barra superior), al ritmo del recorrido. */
function Estacion({ reloj }: { reloj: RelojTransf }) {
  useTickReloj(reloj, 4);
  return <Lectura etiqueta={NOMBRE_TIPO[reloj.tipo]} valor={rotuloTransformacion(reloj.tipo, reloj.p).replace(/^Reflexión · /, '')} acento />;
}

/** Pastilla del recorrido automático (sigue al reloj). */
function PildoraRecorrido({ reloj }: { reloj: RelojTransf }) {
  useTickReloj(reloj, 4);
  return (
    <Pildora activo={reloj.recorrido} onClick={() => reloj.setRecorrido(!reloj.recorrido)} title="Recorrer solas las cinco estaciones">
      <Route size={12} /> Recorrido
    </Pildora>
  );
}

export default function PilotoTransformaciones({ onValidate }: { onValidate?: () => void }) {
  const { geometria6, resetM6, setTransformM6, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      geometria6: s.geometria6, resetM6: s.resetM6, setTransformM6: s.setTransformM6,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { tx, ty, rotacion, escala, target, status } = geometria6;

  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'Cada movimiento de la figura es una matriz. Mira cómo cambia su determinante; luego, en Reto, acopla tu placa con la silueta.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // -- PASOS DEL HUD (el mismo criterio de siempre) --
  useEffect(() => {
    if (tx !== 0 || ty !== 0) {
      if (pasoActual === 0) setPasoActual(1);
    }
    if (rotacion !== 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [tx, ty, rotacion, status, pasoActual, setPasoActual]);

  // ── modo, escena ──
  const [modo, setModo] = useState<ModoM6>('explorar');
  const reto = modo === 'reto';
  const [reducido] = useState(prefiereReducirMovimiento);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  const [modelo, setModelo] = useState(false);
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  // RELOJES (los avanza la escena): el taller viaja ya en bucle; el reto sigue al store
  const relojTaller = useMemo(() => {
    const r = new RelojTransf('explorar');
    if (prefiereReducirMovimiento()) r.estatico();
    return r;
  }, []);
  const relojReto = useMemo(() => new RelojTransf('reto'), []);
  const reloj = reto ? relojReto : relojTaller;
  const primeraMeta = React.useRef(true);
  useEffect(() => {
    relojReto.setMeta({ tx, ty, rot: rotacion, s: escala }, primeraMeta.current || reducido);
    primeraMeta.current = false;
  }, [relojReto, tx, ty, rotacion, escala, reducido]);

  const exito = status === 'success';

  // ── aviso: una vez por modo, se desvanece ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = React.useRef<Set<ModoM6>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'Cada pose es una matriz: mira el determinante cuando la figura se voltea.'
        : 'Lee en la rejilla dónde está la silueta, hacia dónde mira y su tamaño.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const objetivo = useMemo(() => ({ tx: target.tx, ty: target.ty, rotacion: target.rotacion, escala: target.escala }), [target.tx, target.ty, target.rotacion, target.escala]);
  const escena3D = useMemo(() => (
    <Transformaciones3DScene reloj={reloj} modo={modo} objetivo={objetivo} exito={exito} calidad={calidad} reducido={reducido}
      rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
  ), [reloj, modo, objetivo, exito, calidad, reducido, rotulos, encuadre, onListo]);

  const leyenda = reto
    ? [{ c: '#e8f1f8', t: 'silueta objetivo' }, { c: exito ? '#34d399' : '#ffb43a', t: 'tu placa' }]
    : [{ c: '#38d9f5', t: 'figura' }, { c: '#ffb43a', t: 'imagen' }, { c: '#b18cff', t: 'dorso' }];

  const escena = (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#05080b]" data-modo-m6={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        {escena3D}
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-6.5rem)] flex-wrap items-center gap-1.5">
          {!reto && <PildoraRecorrido reloj={relojTaller} />}
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
        <button type="button" onClick={() => setModelo((v) => !v)} aria-expanded={modelo}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur ${modelo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
          <BookOpen size={12} /> Modelo
        </button>
        {modelo && <Modelo onCerrar={() => setModelo(false)} />}
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-2.5 gap-y-1 rounded-md bg-[#0b1220]/70 px-2 py-1 text-[10.5px] font-semibold text-slate-200 backdrop-blur">
          {leyenda.map((x) => (
            <span key={x.t} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: x.c, boxShadow: `0 0 6px ${x.c}` }} />{x.t}</span>
          ))}
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso con resplandor)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-m6={calidad}>
          Calidad: {calidad}
        </button>
        {reto && exito && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4" data-veredicto-m6="">
            <span className="rounded-lg border border-emerald-300/30 bg-[#0c1f1a]/85 px-3 py-1.5 text-center font-mono text-[12px] text-emerald-100 shadow-lg backdrop-blur">
              M = T({numCorto(target.tx)}; {numCorto(target.ty)})·R({numCorto(target.rotacion, 0)}°)·S({numCorto(target.escala)}) · det = {num(det2(trs(target.tx, target.ty, target.rotacion, target.escala)), 2)}
            </span>
          </div>
        )}
        {aviso && !(reto && exito) && (
          <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-m6 max-w-[520px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-m6="">
              {aviso.texto}
            </span>
          </div>
        )}
        <style>{`.aviso-m6{animation:avisoM6 7s ease forwards}@keyframes avisoM6{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-m6{animation:none}}`}</style>
      </div>
      <DockTransf reloj={reloj} />
    </div>
  );

  const selectorModo = (
    <div className="ml-auto shrink-0 pl-1">
      <Seg<ModoM6> valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
        opciones={[{ valor: 'explorar', texto: 'Taller' }, { valor: 'reto', texto: 'Reto' }]} />
    </div>
  );
  const barraSuperior = (
    <div className="flex w-full flex-wrap items-center gap-1.5">
      {reto ? (
        <>
          <Lectura etiqueta="Traslación" valor={`T(${num(tx, 1)}; ${num(ty, 1)})`} acento />
          <Lectura etiqueta="Giro" valor={`${num(rotacion, 0)}°`} />
          <Lectura etiqueta="Escala" valor={`×${num(escala, 1)}`} />
        </>
      ) : (
        <Estacion reloj={relojTaller} />
      )}
      {selectorModo}
    </div>
  );

  const fijar = (dx: number, dy: number, r: number, s: number) => { setTransformM6(dx, dy, r, s); audio?.playPop(); };
  const controles = reto ? (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <Mando etiqueta="Traslación x" valor={tx} min={-RANGO_T_M6} max={RANGO_T_M6} paso={0.1} decimales={1} onChange={(v) => fijar(v, ty, rotacion, escala)} />
        <Mando etiqueta="Traslación y" valor={ty} min={-RANGO_T_M6} max={RANGO_T_M6} paso={0.1} decimales={1} onChange={(v) => fijar(tx, v, rotacion, escala)} />
        <Mando etiqueta="Giro" valor={rotacion} min={0} max={360} paso={5} unidad="°" decimales={0} onChange={(v) => fijar(tx, ty, v, escala)} />
        <Mando etiqueta="Escala" valor={escala} min={ESCALA_MIN_M6} max={ESCALA_MAX_M6} paso={0.1} decimales={1} onChange={(v) => fijar(tx, ty, rotacion, v)} />
      </div>
      <div className="flex flex-wrap items-center gap-2">
        <BotonLab variante="secundario" title="Devuelve la placa al origen (la silueta no cambia)" onClick={() => { resetM6(); audio?.playPop(); }}>
          <RefreshCcw size={14} /> Reiniciar
        </BotonLab>
        <BotonLab variante={exito ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
          {exito ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {exito ? 'Acoplada' : 'Validar'}
        </BotonLab>
        {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Aún no coincide: ajusta traslación, giro y escala.</span>}
      </div>
    </div>
  ) : (
    <MandosTaller reloj={relojTaller} />
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
