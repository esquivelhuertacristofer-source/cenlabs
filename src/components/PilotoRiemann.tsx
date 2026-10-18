"use client";
/**
 * MAT-09 · Sumas de Riemann.
 *
 * Dos modos sobre el mismo banco de integración:
 *  · EXPLORAR (estado inicial): una función del catálogo (onda, e^(x/4), cúbica) y las cinco reglas
 *    (izquierda, derecha, punto medio, trapecios, Simpson). n crece solo (2 → 128): las columnas de
 *    cristal se parten y se afinan, el error (franjas rojas y cian) se encoge y la probeta se acerca a
 *    la marca de la integral exacta. El dock mide el orden de convergencia (1, 1, 2, 2, 4).
 *  · RETO: f(x) = 0,1x² + 1 en [0, 10] (store `integral9`). El sorteo fija el MÉTODO y su tolerancia
 *    de error relativo; el alumno busca una partición n que la cumpla. n y el método se escriben en el
 *    store, que es lo que lee el validador; el validador y el store no cambian.
 *    NO REGALAR: antes de validar no se muestran la integral exacta, el error verdadero ni la curva
 *    Sₙ completa. El alumno puede escribir SU integral (Barrow) y el dock calcula el error con ella.
 *
 * Un solo reloj por modo (`RelojRiemann`): la escena lo avanza y el dock, la barra y los mandos lo
 * leen en el mismo cuadro.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { ShieldCheck, Play, Pause, CheckCircle2, Scan, Tags, PanelBottomOpen, TrendingUp, Square } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import LabLayout, { GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';
import {
  FUNCIONES, IDS_FUNCION, CURVA_RETO, METODOS, METODOS_RETO, NOMBRE_METODO, COLOR_METODO, num, cientifica, suma, errorRelativo, nMinimoReto,
  type IdFuncion, type Metodo,
} from './simuladores/mat09/riemann';
import { RelojRiemann, N_AUTO_INICIO, N_MAX_EXPLORAR, type ModoM9 } from './simuladores/mat09/reloj';
import { DockRiemann, useTickReloj, type MedicionReto } from './simuladores/mat09/Dock';
import { TOLERANCIA_M9, N_MIN_M9, N_MAX_M9, NOMBRE_METODO_M9, type MetodoM9 } from '@/domain/matematicas';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Riemann3DScene = dynamic(() => import('./simuladores/mat09/Riemann3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#05080b]" />,
});

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

/** Pastilla de la escena (capas y vistas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Lectura compacta de la barra (sin pasar a mayúsculas: Δx no es ΔX). */
function Chip({ etiqueta, valor, color, title }: { etiqueta: React.ReactNode; valor: string; color?: string; title?: string }) {
  return (
    <div title={title} className="flex shrink-0 items-baseline gap-1 rounded-lg border px-1.5 py-1"
      style={{ borderColor: color ? `${color}66` : 'rgba(255,255,255,0.1)', background: color ? `${color}14` : 'rgba(255,255,255,0.04)' }}>
      <span className="text-[10.5px] font-semibold text-slate-400">{etiqueta}</span>
      <span className="font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: color ?? '#fff' }}>{valor}</span>
    </div>
  );
}

/** Lecturas de la barra superior: las del MISMO cuadro que la escena. */
function LecturasVivas({ reloj, revela, compacto }: { reloj: React.MutableRefObject<RelojRiemann>; revela: boolean; compacto: boolean }) {
  useTickReloj(reloj, 15);
  const l = reloj.current.lectura();
  return (
    <>
      <Chip etiqueta="n" valor={String(l.n)} />
      {!compacto && <Chip etiqueta="Δx" valor={num(l.h, l.h < 0.1 ? 4 : 3)} />}
      <Chip etiqueta={<>S<sub className="text-[8px]">n</sub></>} valor={num(l.sumaMostrada, 4)} color={COLOR_METODO[l.metodo]} title="Suma de la regla (durante el llenado, lo vertido en la probeta)" />
      {revela && <Chip etiqueta="|E|/∫" valor={l.errorRel < 1e-14 ? '0 %' : `${cientifica(l.errorRel * 100, 2)} %`} color="#ffd27a" title="Error relativo frente a la integral exacta" />}
    </>
  );
}

/** n en escala logarítmica (exploración, 1 … 256). */
function DeslizadorNLog({ reloj }: { reloj: React.MutableRefObject<RelojRiemann> }) {
  useTickReloj(reloj, 15);
  const r = reloj.current;
  const v = Math.log2(Math.max(1, r.n));
  return (
    <label className="flex w-44 min-w-[130px] flex-col gap-1">
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>Partición n</span>
        <span className="font-mono tabular-nums text-white">{r.n}</span>
      </span>
      <input type="range" min={0} max={Math.log2(N_MAX_EXPLORAR)} step={0.01} value={v} aria-label="Número de tramos n (escala logarítmica)"
        onChange={(e) => { reloj.current.setN(Math.round(2 ** Number(e.target.value))); }}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** n lineal del reto (4 … 100), que escribe en el store. */
function DeslizadorNReto({ reloj, onN }: { reloj: React.MutableRefObject<RelojRiemann>; onN: (n: number) => void }) {
  useTickReloj(reloj, 15);
  const r = reloj.current;
  return (
    <label className="flex w-52 min-w-[140px] flex-col gap-1">
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>Partición n</span>
        <span className="font-mono tabular-nums text-white">{r.n} rect.</span>
      </span>
      <input type="range" min={N_MIN_M9} max={N_MAX_M9} step={1} value={Math.min(N_MAX_M9, Math.max(N_MIN_M9, r.n))} aria-label="Número de rectángulos n"
        onChange={(e) => onN(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** Botón del bucle de la exploración (n crece solo). */
function BotonAuto({ reloj }: { reloj: React.MutableRefObject<RelojRiemann> }) {
  useTickReloj(reloj, 8);
  const r = reloj.current;
  return (
    <BotonLab variante="secundario" title={r.auto ? 'Parar: n se queda donde está' : 'n crece solo: 2, 4, 8 … 128'} onClick={() => { reloj.current.setAuto(!r.auto); audio?.playPop(); }}>
      {r.auto ? <Pause size={14} /> : <Play size={14} />} {r.auto ? 'Pausar' : 'n → ∞'}
    </BotonLab>
  );
}

export default function PilotoRiemann({ onValidate }: { onValidate?: () => void }) {
  const { integral9, setIntegralM9, setAnimandoM9, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      integral9: s.integral9, setIntegralM9: s.setIntegralM9, setAnimandoM9: s.setAnimandoM9,
      setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { n: nStore, metodo: metodoStore, metodoReto, animandoLimite, status } = integral9;
  const tol = TOLERANCIA_M9[metodoReto];

  const [modo, setModo] = useState<ModoM9>('explorar');
  const [funcion, setFuncion] = useState<IdFuncion>('onda');
  const [metodoE, setMetodoE] = useState<Metodo>('izquierda');
  const [reducido] = useState(prefiereReducirMovimiento);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [iAlumno, setIAlumno] = useState('');
  const [mediciones, setMediciones] = useState<MedicionReto[]>([]);

  // ── relojes: uno por modo (cada uno guarda su curva, su n y su llenado) ──
  const relojE = useRef<RelojRiemann | null>(null);
  if (!relojE.current) { relojE.current = new RelojRiemann(FUNCIONES.onda, 'explorar', 'izquierda', N_AUTO_INICIO); if (reducido) relojE.current.estatico(16); }
  const relojR = useRef<RelojRiemann | null>(null);
  if (!relojR.current) { relojR.current = new RelojRiemann(CURVA_RETO, 'reto', metodoStore, nStore); if (reducido) relojR.current.estatico(nStore); }
  const reloj = useRef<RelojRiemann>(relojE.current);
  reloj.current = modo === 'explorar' ? relojE.current : relojR.current;

  // el store manda en el reto (reinicio desde la bitácora o el modal, botón +10 de la bitácora)
  useEffect(() => {
    const r = relojR.current!;
    if (r.subiendo) return;
    if (r.metodo !== metodoStore) r.setMetodo(metodoStore);
    if (r.n !== nStore) r.setN(nStore);
  }, [nStore, metodoStore]);
  // las sumas que el alumno visita en el reto (lo único que el dock dibuja de Sₙ antes de validar)
  useEffect(() => {
    if (animandoLimite) return;
    setMediciones((ms) => {
      if (ms.some((m) => m.n === nStore && m.metodo === metodoStore)) return ms;
      return [...ms, { n: nStore, metodo: metodoStore, s: suma(CURVA_RETO, nStore, metodoStore) }].slice(-60);
    });
  }, [nStore, metodoStore, animandoLimite]);

  // validado: la integral y el error verdadero se revelan y se quedan para este reto
  const [validadoLocal, setValidadoLocal] = useState(false);
  useEffect(() => { if (status === 'success') setValidadoLocal(true); }, [status]);
  useEffect(() => { setValidadoLocal(false); setMediciones([]); }, [metodoReto]);
  const validado = status === 'success' || validadoLocal;
  const nMinimo = validado ? nMinimoReto(metodoReto) : null;

  useEffect(() => {
    setAsistente({
      visible: true,
      text: `Bienvenido al banco de integración. Reto: aproxima el área bajo f(x) = 0,1x² + 1 en [0, 10] con ${NOMBRE_METODO_M9[metodoReto]} y un error relativo menor a ${num(tol * 100, 1)} %.`,
      pose: "thinking",
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (nStore !== 4 && pasoActual === 0) setPasoActual(1);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [nStore, status, pasoActual, setPasoActual]);

  // ── mandos ──
  const elegirFuncion = (id: IdFuncion) => { setFuncion(id); relojE.current!.setCurva(FUNCIONES[id]); if (reducido) relojE.current!.estatico(relojE.current!.n); audio?.playPop(); };
  const elegirMetodoE = (m: Metodo) => { setMetodoE(m); relojE.current!.setMetodo(m); audio?.playPop(); };
  const detenerSubida = useCallback(() => {
    const r = relojR.current!;
    const n = r.detenerSubida();
    setIntegralM9(n, r.metodo as MetodoM9);
    setAnimandoM9(false);
  }, [setIntegralM9, setAnimandoM9]);
  const elegirMetodoR = (m: MetodoM9) => {
    if (relojR.current!.subiendo) detenerSubida();
    setIntegralM9(relojR.current!.n, m);
    audio?.playPop();
  };
  const ponerNReto = (n: number) => {
    if (relojR.current!.subiendo) { relojR.current!.detenerSubida(); setAnimandoM9(false); }
    setIntegralM9(Math.round(n), relojR.current!.metodo as MetodoM9);
    audio?.playPop();
  };
  const animarN = () => {
    const r = relojR.current!;
    if (r.subiendo) { detenerSubida(); audio?.playPop(); return; }
    setAnimandoM9(true);
    r.subirHasta(N_MAX_M9, (n) => { setIntegralM9(n, r.metodo as MetodoM9); setAnimandoM9(false); });
    audio?.playPop();
  };
  const validar = () => {
    if (relojR.current!.subiendo) detenerSubida();
    onValidate?.();
  };

  // ── tamaño propio: el dock va en una franja bajo la escena (el banco es ancho) ──
  const raiz = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = raiz.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [dock, setDock] = useState<boolean | null>(null);
  // Abierto de entrada en escritorio y también en vertical (móvil): ahí el banco, que es ancho, deja
  // sobrando alto y la franja del dock lo aprovecha sin achicarlo (ocupación 0,37 → ~0,5 del alto).
  useEffect(() => { if (dock === null && tam) setDock((tam.w >= 520 && tam.h >= 380) || (tam.h >= 1.15 * tam.w && tam.h >= 420)); }, [tam, dock]);
  // En vertical la franja crece (el banco no usa ese alto): las lecturas caben sin partirse.
  const altoFranja = tam ? Math.max(150, Math.min(tam.h > tam.w ? 240 : 220, Math.round(tam.h * (tam.h > tam.w ? 0.37 : 0.3)))) : 170;
  const dockAbierto = !!dock && !!tam;

  // ── aviso que aparece una vez por modo y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoM9>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'Cada columna vale f(x*)·Δx y se vierte en la probeta. Al duplicar n se afinan y la suma se acerca a la integral.'
        : 'Calcula la integral exacta con Barrow, escríbela en el dock y busca un n que cumpla la meta.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const reto = modo === 'reto';
  const metodoActual: Metodo = reto ? metodoStore : metodoE;
  const revelaExacta = !reto || validado;
  const clave = reto ? 'reto' : `e|${funcion}`;
  const escena3D = useMemo(() => (
    <Riemann3DScene reloj={reloj} modo={modo} clave={clave} metodo={metodoActual} revelaExacta={revelaExacta} calidad={calidad} reducido={reducido}
      rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
  ), [modo, clave, metodoActual, revelaExacta, calidad, reducido, rotulos, encuadre, onListo]);

  const leyenda = [
    { c: '#9ff0ff', t: 'f(x)' },
    { c: COLOR_METODO[metodoActual], t: NOMBRE_METODO[metodoActual].toLowerCase() },
    { c: '#ff4d6d', t: 'sobra' },
    { c: '#4fe3ff', t: 'falta' },
  ];
  const eValidado = errorRelativo(CURVA_RETO, nStore, metodoStore);

  const escena = (
    <div ref={raiz} className="absolute inset-0 flex flex-col overflow-hidden bg-[#05080b]" data-modo-m9={modo}>
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-escena-contenedor="">
        {escena3D}
        {/* capas y vistas */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
        <button type="button" onClick={() => setDock((d) => !d)} aria-pressed={dockAbierto} aria-label={dockAbierto ? 'Plegar instrumentos' : 'Abrir instrumentos'}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold backdrop-blur ${dockAbierto ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/15 bg-[#0f1a2b]/85 text-slate-200 hover:border-[#219EBC] hover:text-white'}`}>
          <PanelBottomOpen size={13} /> Instrumentos
        </button>
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-2.5 gap-y-1 rounded-md bg-[#0b1220]/70 px-2 py-1 text-[10.5px] font-semibold text-slate-200 backdrop-blur">
          {leyenda.map((x) => (
            <span key={x.t} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: x.c, boxShadow: `0 0 6px ${x.c}` }} />{x.t}</span>
          ))}
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso con resplandor)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-m9={calidad}>
          Calidad: {calidad}
        </button>
        {reto && validado && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4" data-veredicto-m9="">
            <span className="rounded-lg border border-amber-300/30 bg-[#1a140a]/85 px-3 py-1.5 text-center font-mono text-[12px] text-amber-100 shadow-lg backdrop-blur">
              ∫₀¹⁰ (0,1x² + 1) dx = 130/3 ≈ {num(CURVA_RETO.exacta, 4)} · tu error {num(eValidado * 100, 3)} % · n mínimo {nMinimo ?? '—'}
            </span>
          </div>
        )}
        {aviso && !(reto && validado) && (
          <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-m9 max-w-[540px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-m9="">
              {aviso.texto}
            </span>
          </div>
        )}
        <style>{`.aviso-m9{animation:avisoM9 7s ease forwards}@keyframes avisoM9{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-m9{animation:none}}`}</style>
      </div>
      {dockAbierto && tam && (
        <div className="shrink-0 border-t border-white/10 bg-[#0f1a2b]" style={{ height: altoFranja }} data-franja-dock="inferior">
          <DockRiemann reloj={reloj} revela={revelaExacta} ancho={tam.w}
            iAlumno={iAlumno} setIAlumno={setIAlumno} metodoReto={metodoReto} mediciones={mediciones} nMinimo={nMinimo} />
        </div>
      )}
    </div>
  );

  const compacto = !!tam && tam.w < 640;
  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{reto ? `Reto · ${NOMBRE_METODO[metodoReto].toLowerCase()} < ${num(tol * 100, 1)} %` : 'Exploración'}</span>
        <span className="whitespace-nowrap font-mono text-[12.5px] font-bold text-white">{reloj.current.curva.formula}{reto ? ' · [0, 10]' : ''}</span>
      </div>
      <LecturasVivas reloj={reloj} revela={revelaExacta} compacto={compacto} />
    </div>
  );

  const controles = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <Segmentado<ModoM9> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
          opciones={[{ valor: 'explorar', texto: 'Explorar' }, { valor: 'reto', texto: 'Reto' }]} />
        {!reto && (
          <Segmentado<IdFuncion> etiqueta="Función" valor={funcion} onChange={elegirFuncion}
            opciones={IDS_FUNCION.map((id) => ({ valor: id, texto: FUNCIONES[id].nombre }))} />
        )}
        {reto ? (
          <Segmentado<MetodoM9> etiqueta="Punto de evaluación" valor={metodoStore} onChange={elegirMetodoR}
            opciones={METODOS_RETO.map((m) => ({ valor: m, texto: NOMBRE_METODO[m] }))} />
        ) : (
          <Segmentado<Metodo> etiqueta="Regla" valor={metodoE} onChange={elegirMetodoE}
            opciones={METODOS.map((m) => ({ valor: m, texto: m === 'trapecio' ? 'Trap.' : NOMBRE_METODO[m] }))} />
        )}
      </GrupoControles>
      <GrupoControles className="items-end">
        {reto ? <DeslizadorNReto reloj={reloj} onN={ponerNReto} /> : <DeslizadorNLog reloj={reloj} />}
        {reto ? (
          <div className="flex flex-wrap items-center gap-1.5">
            <BotonLab variante="secundario" title="n sube solo de uno en uno hasta 100" onClick={animarN}>
              {animandoLimite ? <Square size={14} /> : <TrendingUp size={14} />} {animandoLimite ? 'Detener' : 'Animar n'}
            </BotonLab>
            <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={validar}>
              {status === 'success' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {status === 'success' ? 'Integral correcta' : 'Validar integral'}
            </BotonLab>
            {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Aún no cumple el reto: revisa el método y refina n.</span>}
          </div>
        ) : (
          <BotonAuto reloj={reloj} />
        )}
      </GrupoControles>
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} tituloPanel="Instrumentos" />;
}
