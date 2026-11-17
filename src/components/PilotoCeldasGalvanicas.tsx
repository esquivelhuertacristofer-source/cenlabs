"use client";
/**
 * QUI-09 · Celdas galvánicas.
 *
 * Dos modos sobre el mismo banco:
 *  · CELDA DE DANIELL (exploración, estado inicial): Zn | ZnSO₄ ‖ CuSO₄ | Cu ya armada y
 *    descargándose sobre la caja de carga. El alumno cambia la carga, las
 *    concentraciones (renueva las disoluciones) y la temperatura, y ve a la vez la
 *    escena, el voltímetro y el dock: Nernst, Faraday y la celda que se agota (Q → K).
 *  · RETO: los dos metales de la estación (store `celda`), que el alumno coloca,
 *    conecta e identifica. El validador (`validarQ9`) y el store no cambian; la escena
 *    y el dock no nombran ánodo ni cátodo hasta que valida.
 *
 * Como la exploración ya enseña que en Zn/Cu el Zn es el ánodo, si la estación sale
 * con esa misma pareja se vuelve a sortear (`generarSemillaP9`).
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { RefreshCcw, ShieldCheck, Pause, Play, Scan, Tags, Beaker, FlaskConical, Minus, Plus, Activity, Atom } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarQ9 } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import LabLayout, { GrupoControles, Deslizador, BotonLab, Segmentado } from '@/components/simulador/LabLayout';
import { RelojCelda, montajeDaniell, FACTORES, type Factor } from './simuladores/qmi09/reloj';
import { useBancoCelda } from './simuladores/qmi09/banco';
import { METAL, T_REF, esMetal, duracion, type Carga, type IdMetal } from './simuladores/qmi09/electroquimica';
import { DockCelda, cifra, concentracion, potencia10, useTickReloj } from './simuladores/qmi09/Dock';
import type { ModoQ9 } from './simuladores/qmi09/Galvanic3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Galvanic3DScene = dynamic(() => import('./simuladores/qmi09/Galvanic3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#06090c]" />,
});
// la lupa atómica, también en su chunk: sólo se descarga al abrirla
const VistaAtomica = dynamic(() => import('./simuladores/qmi09/VistaAtomica'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050b14]" />,
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

const COLOR_METAL: Record<IdMetal, string> = { Zn: '#aab4bc', Cu: '#d9825b', Ag: '#e8e8e2', Mg: '#c4c8cb' };

const CARGAS_OPC: { valor: string; texto: string; c: Carga }[] = [
  { valor: 'abierta', texto: 'Abierta', c: 'abierta' },
  { valor: '1000', texto: '1 kΩ', c: 1000 },
  { valor: '100', texto: '100 Ω', c: 100 },
  { valor: '10', texto: '10 Ω', c: 10 },
];
const aTexto = (c: Carga) => String(c);
const deTexto = (s: string): Carga => CARGAS_OPC.find((o) => o.valor === s)?.c ?? 'abierta';

/** Pastilla de la escena (capas y vistas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Concentración en escala logarítmica (1 mM … 1 M). */
function DeslizadorLog({ etiqueta, valor, onChange }: { etiqueta: React.ReactNode; valor: number; onChange: (c: number) => void }) {
  const l = Math.log10(valor);
  return (
    <label className="flex w-40 min-w-[128px] flex-col gap-1">
      <span className="flex justify-between text-[13px] font-semibold text-slate-300">
        <span>{etiqueta}</span>
        <span className="font-mono tabular-nums text-white">{concentracion(valor)}</span>
      </span>
      <input type="range" min={-3} max={0} step={0.1} value={l} onChange={(e) => onChange(Math.round(10 ** Number(e.target.value) * 1e4) / 1e4)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** Ancho de la columna del laboratorio desde el que los instrumentos caben AL LADO de la escena. */
const ANCHO_CON_LATERAL = 860;
/** Alto de la franja de instrumentos bajo la escena (columna estrecha). */
const ALTO_FRANJA = 186;

/**
 * Letra ≥ 13 px en los mandos del kit (botones, segmentados, deslizador, cabecera del
 * panel), sólo dentro de esta práctica: el kit común no se toca. En móvil, además, la
 * franja de mandos puede ocupar hasta la mitad del alto (se desplaza por dentro).
 */
const LETRA_13 = '[&_[data-franja]_button]:text-[13px] [&_[data-franja=controles]_span]:text-[13px] [&_[data-franja=controles]_select]:text-[13px] [&_[data-franja=lateral]>div:first-child_span]:text-[13px] [&_[data-franja=lateral]>div:first-child_span]:tracking-[0.08em] max-sm:[&_[data-franja=controles]]:max-h-[50%]';

/** Lectura de la barra superior con rótulo ≥ 13 px (la del kit lo pone a 10 px). */
function LecturaQ({ etiqueta, valor, unidad, acento = false, title }: { etiqueta: string; valor: React.ReactNode; unidad?: string; acento?: boolean; title?: string }) {
  return (
    <div title={title} className={`flex shrink-0 items-baseline gap-1.5 rounded-lg border px-2 py-1 ${acento ? 'border-[#FB8500]/40 bg-[#FB8500]/10' : 'border-white/10 bg-white/[0.04]'}`}>
      <span className="text-[13px] font-semibold text-slate-400">{etiqueta}</span>
      <span className={`font-mono text-[14px] font-semibold tabular-nums ${acento ? 'text-[#FFB703]' : 'text-white'}`}>{valor}</span>
      {unidad && <span className="text-[13px] text-slate-400">{unidad}</span>}
    </div>
  );
}

/** Lecturas de la barra superior: las del MISMO cuadro que la escena. */
function LecturasVivas({ reloj, modo }: { reloj: React.MutableRefObject<RelojCelda>; modo: ModoQ9 }) {
  useTickReloj(reloj, 15);
  const l = reloj.current.lectura, e = reloj.current.estado;
  return (
    <>
      <LecturaQ etiqueta="V" valor={cifra(l.V, 3, true)} unidad="V" acento title="Lo que marca el voltímetro (punta + menos COM)" />
      <LecturaQ etiqueta="E" valor={cifra(l.fem, 3, true)} unidad="V" title="Fem de la celda (Nernst)" />
      <LecturaQ etiqueta="I" valor={cifra(Math.abs(l.I) * 1000, 2)} unidad="mA" />
      {modo === 'daniell' && <LecturaQ etiqueta="t" valor={duracion(e.t)} title="Tiempo simulado desde que se prepararon las disoluciones" />}
    </>
  );
}

/** La celda se agotó: equilibrio (Q = K, E = 0) o ánodo disuelto. Se consulta al ritmo del reloj. */
function AvisoAgotada({ reloj }: { reloj: React.MutableRefObject<RelojCelda> }) {
  useTickReloj(reloj, 4);
  const agotada = reloj.current.agotada();
  if (!agotada) return null;
  return (
    <div className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4" data-agotada={agotada}>
      <span className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-[#06221a]/85 px-3 py-1.5 text-[13px] font-semibold text-emerald-200 shadow-lg backdrop-blur">
        {agotada === 'equilibrio' ? 'Equilibrio: Q = K y E = 0' : 'El ánodo se disolvió entero'}
        <button type="button" onClick={() => { reloj.current.renovar(); audio?.playPop(); }} className="pointer-events-auto rounded-md bg-emerald-500/25 px-2 py-0.5 text-emerald-100 hover:bg-emerald-500/40">Renovar</button>
      </span>
    </div>
  );
}

export default function PilotoCeldasGalvanicas({ isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { celda, setMetalVaso, togglePuenteSalino, toggleCables, generarSemillaP9, validarP9, resetP9, setRespuestaP9 } =
    useSimuladorStore(useShallow((s) => ({
      celda: s.celda, setMetalVaso: s.setMetalVaso, togglePuenteSalino: s.togglePuenteSalino, toggleCables: s.toggleCables,
      generarSemillaP9: s.generarSemillaP9, validarP9: s.validarP9, resetP9: s.resetP9, setRespuestaP9: s.setRespuestaP9,
    })));

  // ── modo, relojes y ajustes ──
  const [modo, setModo] = useState<ModoQ9>('daniell');
  const [cZn, setCZn] = useState(1);
  const [cCu, setCCu] = useState(1);
  const [tC, setTC] = useState(25);
  const [cargaD, setCargaD] = useState<Carga>(1000);
  const [cargaR, setCargaR] = useState<Carga>('abierta');
  // cámara rápida: la que pide el alumno y la que corre (se baja sola con disoluciones diluidas)
  const [factorPedido, setFactorPedido] = useState<Factor>(1e6);
  const [factor, setFactor] = useState<Factor>(1e6);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  /** lupa atómica: la interfaz de cada electrodo a escala de átomos (sólo en la celda de Daniell) */
  const [atomosPedido, setAtomos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  const relojD = useRef<RelojCelda | null>(null);
  if (!relojD.current) relojD.current = new RelojCelda(montajeDaniell(1000), 1, 1);
  const relojR = useRef<RelojCelda | null>(null);
  if (!relojR.current) relojR.current = new RelojCelda({ izq: null, der: null, puente: false, cables: false, carga: 'abierta', T: T_REF });
  const reloj = useRef<RelojCelda>(relojD.current);
  reloj.current = modo === 'daniell' ? relojD.current : relojR.current;

  // Daniell: carga y temperatura cambian el circuito; las concentraciones preparan disoluciones nuevas
  useEffect(() => { relojD.current!.fijarMontaje({ carga: cargaD, T: tC + 273.15 }); }, [cargaD, tC]);
  // Al mover una concentración se preparan disoluciones nuevas y la cámara rápida se
  // baja lo justo para que la fem recién preparada se pueda LEER (casi quieta 3 s) y la
  // celda dure ≥ 30 s en pantalla: con [Cu²⁺] = 1 mM sólo hay 48 C y a ×10⁶ se agotaba
  // en un parpadeo, sin que nadie viera el salto de Nernst.
  const primeraC = useRef(true);
  const [avisoNernst, setAvisoNernst] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (primeraC.current) { primeraC.current = false; return; }
    const r = relojD.current!;
    r.renovar(cZn, cCu);
    const seguro = r.factorSeguro(factorPedido);
    // al reloj en este mismo instante (no en el render siguiente): un solo cuadro a ×10⁶
    // ya se comería media celda diluida
    r.factor = seguro;
    setFactor(seguro);
    setAvisoNernst({
      n: Date.now(),
      texto: seguro < factorPedido
        ? `Disoluciones nuevas: mira cómo cambió E. Cámara rápida bajada a ×${potencia10(seguro)} para que la celda no se agote antes de leerla.`
        : 'Disoluciones nuevas: mira cómo cambió E en el voltímetro (ecuación de Nernst).',
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [cZn, cCu]);
  useEffect(() => {
    if (!avisoNernst) return;
    const t = window.setTimeout(() => setAvisoNernst(null), 6000);
    return () => window.clearTimeout(t);
  }, [avisoNernst]);
  const pedirFactor = (f: Factor) => { setFactorPedido(f); setFactor(f); audio?.playPop(); };
  const moverFactor = (d: -1 | 1) => {
    const i = FACTORES.indexOf(factor) + d;
    if (i >= 0 && i < FACTORES.length) pedirFactor(FACTORES[i]);
  };
  // reto: el montaje es el del store (sales 1 M, 25 °C)
  const izqR = esMetal(celda.vasoIzq) ? celda.vasoIzq : null;
  const derR = esMetal(celda.vasoDer) ? celda.vasoDer : null;
  useEffect(() => {
    relojR.current!.fijarMontaje({ izq: izqR, der: derR, puente: celda.puenteSalino, cables: celda.cablesConectados, carga: cargaR });
  }, [izqR, derR, celda.puenteSalino, celda.cablesConectados, cargaR]);
  useEffect(() => { relojD.current!.factor = factor; relojR.current!.factor = factor; }, [factor]);
  useEffect(() => { relojD.current!.pausa = pausa; relojR.current!.pausa = pausa; }, [pausa]);

  // la estación no repite la pareja de la exploración
  const parReto = [...celda.seedMetales].sort().join(',');
  // (se sortea hasta que cambie: si el sorteo repite Cu/Zn, `parReto` no cambia y el efecto no volvería a correr)
  useEffect(() => {
    if (parReto !== 'Cu,Zn') return;
    for (let k = 0; k < 24; k++) {
      generarSemillaP9();
      if ([...useSimuladorStore.getState().celda.seedMetales].sort().join(',') !== 'Cu,Zn') break;
    }
  }, [parReto, generarSemillaP9]);

  // ── aviso que aparece una vez por modo y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoQ9>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'daniell'
        ? 'La pila ya trabaja: electrones por el cable, iones por el puente. Cambia la carga o las concentraciones.'
        : 'Coloca los dos electrodos, el puente y las puntas; la aguja dirá cuál es cuál.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // la bitácora dice lo que toca en cada modo
  const publicarModo = useBancoCelda((b) => b.setModo);
  useEffect(() => { publicarModo(modo); return () => publicarModo('daniell'); }, [modo, publicarModo]);

  // ── disposición: instrumentos al lado (columna ancha) o en franja bajo la escena (estrecha) ──
  const raiz = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState<{ w: number; h: number } | null>(null);
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setCaja({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const conLateral = !!caja && caja.w >= ANCHO_CON_LATERAL;
  // la franja arranca plegada en los dos modos: al entrar manda la celda en 3D a todo el alto;
  // las gráficas de descarga y de Nernst se abren con «Gráficas»
  const [franjaD, setFranjaD] = useState(false);
  const [franjaR, setFranjaR] = useState(false);
  const franja = modo === 'daniell' ? franjaD : franjaR;
  const setFranja = useCallback((v: boolean) => { if (modo === 'daniell') setFranjaD(v); else setFranjaR(v); }, [modo]);
  const cerrarFranja = useCallback(() => setFranja(false), [setFranja]);
  const franjaAbierta = !conLateral && franja;

  // ── reto ──
  const [seleccionado, setSeleccionado] = useState<IdMetal | null>(null);
  const [ansAnodo, setAnsAnodo] = useState('');
  const [ansCatodo, setAnsCatodo] = useState('');
  const [intentado, setIntentado] = useState(false);
  const validado = celda.status === 'success';
  const veredicto = validarQ9(celda);
  const elegir = (anodo: string, catodo: string) => {
    setAnsAnodo(anodo); setAnsCatodo(catodo);
    // al store en el momento: «Validar celda» y «Validar práctica» juzgan lo mismo
    setRespuestaP9(anodo || null, catodo || null);
  };
  const validar = () => {
    setRespuestaP9(ansAnodo || null, ansCatodo || null);
    setIntentado(true);
    // un solo juez: el validador de la práctica (quiz + modal comunes)
    if (onValidate) { onValidate(); return; }
    if (validarP9()) audio?.playSuccess(); else audio?.playError();
  };
  /** Coloca el electrodo; si ya estaba en el otro vaso, los intercambia (un electrodo de cada metal). */
  const colocar = useCallback((vaso: 'izq' | 'der') => {
    if (!seleccionado) return;
    const otro = vaso === 'izq' ? 'der' : 'izq';
    const enOtro = (otro === 'izq' ? celda.vasoIzq : celda.vasoDer) === seleccionado;
    if (enOtro) setMetalVaso(otro, vaso === 'izq' ? celda.vasoIzq : celda.vasoDer);
    setMetalVaso(vaso, seleccionado);
    setSeleccionado(null);
    audio?.playPop();
  }, [seleccionado, celda.vasoIzq, celda.vasoDer, setMetalVaso]);

  const daniell = modo === 'daniell';
  const atomos = atomosPedido && daniell;
  const carga = daniell ? cargaD : cargaR;
  const setCarga = (c: Carga) => { if (daniell) setCargaD(c); else setCargaR(c); audio?.playPop(); };

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#06090c]" data-modo-q9={modo} data-atomos-q9={atomos ? '1' : '0'}>
      {atomos ? (
        <VistaAtomica reloj={reloj} reducido={reducido} />
      ) : (
        <Galvanic3DScene
          reloj={reloj} modo={modo}
          izq={daniell ? 'Zn' : izqR} der={daniell ? 'Cu' : derR}
          puente={daniell ? true : celda.puenteSalino} cables={daniell ? true : celda.cablesConectados}
          carga={carga} seedMetales={celda.seedMetales} validado={validado}
          calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo}
        />
      )}
      {/* capas y vistas */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        {daniell && (
          <button type="button" onClick={() => { setAtomos((v) => !v); audio?.playPop(); }} aria-pressed={atomos} data-boton-atomos=""
            title={atomos ? 'Volver al banco del laboratorio' : 'Acercarse a escala atómica: ver la reacción átomo por átomo'}
            className={`pointer-events-auto flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-bold backdrop-blur transition-colors ${atomos ? 'border-white/20 bg-[#0b1422]/80 text-white hover:border-white/40' : 'border-amber-300/60 bg-amber-400/90 text-[#1a1200] shadow-[0_0_18px_rgba(251,191,36,0.45)] hover:bg-amber-300'}`}>
            {atomos ? <><FlaskConical size={14} /> Volver al banco</> : <><Atom size={14} /> Ver átomos</>}
          </button>
        )}
        {!atomos && <>
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={14} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={14} /></Pildora>
        </>}
      </div>
      {/* instrumentos en franja: se abren y se pliegan desde aquí (o con Escape) */}
      {!conLateral && (
        <button type="button" onClick={() => setFranja(!franjaAbierta)} aria-expanded={franjaAbierta} title={franjaAbierta ? 'Plegar las gráficas (Esc)' : 'Ver las gráficas de descarga y de Nernst'}
          className={`absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-full border px-3 text-[13px] font-semibold backdrop-blur transition-colors ${franjaAbierta ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-200 hover:text-white'}`} data-boton-instrumentos="">
          <Activity size={14} /> Gráficas
        </button>
      )}
      {/* cámara rápida: rotulada con su factor real y con sus mandos (pausa, más lenta, más rápida, renovar) */}
      {daniell ? (
        <div className="absolute bottom-2 left-2 flex items-center gap-1 rounded-lg border border-white/10 bg-[#0b1220]/85 p-1 backdrop-blur" data-camara-rapida="" role="group" aria-label="Cámara rápida">
          <button type="button" onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausar'} aria-label={pausa ? 'Reanudar' : 'Pausar'}
            className="flex h-8 w-8 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 hover:text-white">
            {pausa ? <Play size={15} /> : <Pause size={15} />}
          </button>
          <button type="button" onClick={() => moverFactor(-1)} disabled={factor === FACTORES[0]} title="Cámara más lenta" aria-label="Cámara más lenta"
            className="flex h-8 w-7 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-30"><Minus size={15} /></button>
          <span className="whitespace-nowrap px-1 font-mono text-[13px] font-semibold text-cyan-100" data-factor={factor}>
            {pausa ? 'En pausa' : <>×{potencia10(factor)}<span className="hidden sm:inline"> · 1 s = {duracion(factor)}</span></>}
          </span>
          <button type="button" onClick={() => moverFactor(1)} disabled={factor === FACTORES[FACTORES.length - 1]} title="Cámara más rápida" aria-label="Cámara más rápida"
            className="flex h-8 w-7 items-center justify-center rounded-md text-slate-200 hover:bg-white/10 hover:text-white disabled:opacity-30"><Plus size={15} /></button>
          <button type="button" onClick={() => { reloj.current.renovar(); audio?.playPop(); }} title="Disoluciones y electrodos nuevos"
            className="ml-0.5 flex h-8 items-center gap-1.5 rounded-md border border-white/10 px-2 text-[13px] font-semibold text-slate-200 hover:border-[#219EBC] hover:text-white">
            <RefreshCcw size={14} /><span className="hidden sm:inline">Renovar</span>
          </button>
        </div>
      ) : (
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[13px] font-semibold text-cyan-100/90 backdrop-blur" data-camara-rapida="">
          Sólo el voltímetro · 1 M · 25 °C
        </div>
      )}
      {!atomos && (
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: vidrio con transmisión y posproceso)"
          className="absolute bottom-2 right-2 flex h-8 items-center rounded-md border border-white/10 bg-[#0b1220]/75 px-2 text-[13px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-q9={calidad}>
          <span className="hidden sm:inline">Calidad:&nbsp;</span>{calidad}
        </button>
      )}
      {/* avisos: el de entrada (una vez por modo) y el de las disoluciones nuevas */}
      {(avisoNernst ?? aviso) && (
        <div key={(avisoNernst ?? aviso)!.n} className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
          <span className="aviso-q9 max-w-[560px] rounded-lg border border-white/10 bg-[#0a1420]/90 px-3 py-1.5 text-center text-[13px] leading-snug text-slate-100 shadow-lg backdrop-blur" data-aviso-q9="">
            {(avisoNernst ?? aviso)!.texto}
          </span>
        </div>
      )}
      <AvisoAgotada reloj={reloj} />
      <style>{`.aviso-q9{animation:avisoQ9 7s ease forwards}@keyframes avisoQ9{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-q9{animation:none}}`}</style>
    </div>
  );

  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <span className="mr-1 shrink-0 text-[14px] font-bold text-white" title={daniell ? 'Celda de Daniell (notación de celda)' : 'Reto · disoluciones 1 M · 25 °C'}>
        {daniell ? 'Zn | Zn²⁺ ‖ Cu²⁺ | Cu' : (izqR && derR ? `Reto · ${izqR} ‖ ${derR}` : 'Reto · por montar')}
      </span>
      <LecturasVivas reloj={reloj} modo={modo} />
    </div>
  );

  // En el reto la celda se mide en circuito abierto (1 M, 25 °C): sin carga ni cámara
  // rápida que distraigan; así los mandos caben también en el móvil.
  // En el reto la celda se mide en circuito abierto (1 M, 25 °C): sin carga ni cámara
  // rápida que distraigan; así los mandos caben también en el móvil.
  const selectorModo = (
    <Segmentado<ModoQ9> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
      opciones={[{ valor: 'daniell', texto: 'Celda de Daniell' }, { valor: 'reto', texto: 'Reto' }]} />
  );

  const controlesDaniell = (
    <GrupoControles className="items-end">
      <DeslizadorLog etiqueta={<>[Zn²⁺]</>} valor={cZn} onChange={setCZn} />
      <DeslizadorLog etiqueta={<>[Cu²⁺]</>} valor={cCu} onChange={setCCu} />
      <Deslizador etiqueta="Temperatura" valor={tC} min={5} max={60} paso={1} unidad="°C" ancho="w-40" onChange={setTC} />
    </GrupoControles>
  );

  const controlesReto = (
    <>
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-slate-300">Electrodos</span>
          <div className="flex flex-wrap gap-1.5">
            {celda.seedMetales.filter(esMetal).map((m) => {
              const puesto = celda.vasoIzq === m ? 'izq.' : celda.vasoDer === m ? 'der.' : null;
              return (
                <button key={m} type="button" onClick={() => setSeleccionado(seleccionado === m ? null : m)} aria-pressed={seleccionado === m}
                  title={`${METAL[m].nombre} · E° = ${cifra(METAL[m].E0, 2, true)} V`}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[13px] font-bold transition-colors ${seleccionado === m ? 'border-cyan-400/70 bg-cyan-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30'}`}>
                  <span className="h-3.5 w-3.5 rounded-sm border border-white/20" style={{ background: COLOR_METAL[m] }} />
                  {m}
                  {puesto && <span className="text-[13px] font-semibold text-slate-400">· vaso {puesto}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {seleccionado && (
          <div className="flex flex-col gap-1">
            <span className="text-[13px] font-semibold text-slate-300">Colocar {seleccionado} en…</span>
            <div className="flex gap-1.5">
              <BotonLab variante="secundario" onClick={() => colocar('izq')}>Vaso izquierdo (COM)</BotonLab>
              <BotonLab variante="secundario" onClick={() => colocar('der')}>Vaso derecho (V)</BotonLab>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-slate-300">Circuito</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => { togglePuenteSalino(); audio?.playPop(); }} aria-pressed={celda.puenteSalino}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${celda.puenteSalino ? 'border-emerald-400/60 bg-emerald-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <FlaskConical size={14} /> {celda.puenteSalino ? 'Quitar puente' : 'Poner puente salino'}
            </button>
            <button type="button" onClick={() => { toggleCables(); audio?.playPop(); }} aria-pressed={celda.cablesConectados}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[13px] font-semibold transition-colors ${celda.cablesConectados ? 'border-blue-400/60 bg-blue-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <Beaker size={14} /> {celda.cablesConectados ? 'Desconectar puntas' : 'Conectar puntas'}
            </button>
          </div>
        </div>
        <div className="flex flex-wrap items-end gap-x-3 gap-y-2" data-respuesta-q9="">
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-rose-300">Ánodo (−)</span>
          <select value={ansAnodo} onChange={(e) => elegir(e.target.value, ansCatodo)} aria-label="Metal que actúa como ánodo"
            className="h-9 w-32 rounded-lg border border-white/15 bg-slate-950 px-2 text-[13px] font-semibold text-white outline-none focus:border-rose-400/60">
            <option value="">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[13px] font-semibold text-emerald-300">Cátodo (+)</span>
          <select value={ansCatodo} onChange={(e) => elegir(ansAnodo, e.target.value)} aria-label="Metal que actúa como cátodo"
            className="h-9 w-32 rounded-lg border border-white/15 bg-slate-950 px-2 text-[13px] font-semibold text-white outline-none focus:border-emerald-400/60">
            <option value="">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <BotonLab variante={validado ? 'primario' : 'acento'} onClick={validar}><ShieldCheck size={14} /> Validar celda</BotonLab>
        <button type="button" aria-label="Desmontar la celda" title="Desmontar la celda"
          onClick={() => { resetP9(); setIntentado(false); setSeleccionado(null); setAnsAnodo(''); setAnsCatodo(''); audio?.playPop(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RefreshCcw size={15} /></button>
        </div>
        {(validado || (intentado && celda.status === 'error' && veredicto.mensaje)) && (
          <span role="status" className={`flex min-w-[200px] flex-1 items-center gap-1.5 text-[13px] leading-snug ${validado ? 'font-semibold text-emerald-300' : 'text-amber-200'}`} data-veredicto-q9="">
            <ShieldCheck size={14} className="shrink-0" /> {validado ? 'Celda armada e identificada' : veredicto.mensaje}
          </span>
        )}
    </>
  );

  const controles = daniell ? (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        {selectorModo}
        <Segmentado<string> etiqueta="Carga" valor={aTexto(carga)} onChange={(v) => setCarga(deTexto(v))}
          opciones={CARGAS_OPC.map((o) => ({ valor: o.valor, texto: o.texto }))} />
      </GrupoControles>
      {controlesDaniell}
    </div>
  ) : (
    <GrupoControles className="items-end">
      {selectorModo}
      {controlesReto}
    </GrupoControles>
  );

  const pieProfesor = isProfesor ? (
    <div className="flex flex-col gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.05] p-2.5 text-[13px] leading-relaxed text-slate-300">
      <span className="text-[13px] font-bold uppercase tracking-wide text-cyan-300">Panel docente</span>
      <p>Estación del reto: <b className="text-white">{celda.seedMetales.join(' • ')}</b>.</p>
      <p>El voltímetro marca E(der) − E(izq): con el cátodo (mayor E°) en el vaso derecho la lectura es positiva.</p>
      <BotonLab variante="primario" onClick={generarSemillaP9}><RefreshCcw size={13} /> Reconfigurar estación</BotonLab>
    </div>
  ) : undefined;

  const dock = (variante: 'lateral' | 'franja') => (
    <DockCelda reloj={reloj} revela={daniell || validado} pie={pieProfesor} variante={variante} onCerrar={variante === 'franja' ? cerrarFranja : undefined} />
  );
  // columna estrecha: la escena cede una franja en flujo (no se superpone a nada)
  const escenaConFranja = (
    <div className="absolute inset-0 flex flex-col">
      <div className="relative min-h-0 flex-1">{escena}</div>
      {franjaAbierta && (
        <div className="shrink-0 border-t border-white/10 bg-[#0f1a2b]" style={{ height: ALTO_FRANJA }} data-franja-instrumentos="">
          {dock('franja')}
        </div>
      )}
    </div>
  );

  return (
    <div ref={raiz} className="h-full w-full min-h-0 min-w-0 overflow-hidden [contain:inline-size]" data-lab="quimica-9">
      {caja && (
        <LabLayout
          key={conLateral ? 'lateral' : 'franja'}
          className={LETRA_13}
          escena={escenaConFranja}
          barraSuperior={barraSuperior}
          controles={controles}
          panelLateral={conLateral ? dock('lateral') : undefined}
          panelAbiertoInicial={conLateral}
          tituloPanel="Instrumentos"
        />
      )}
    </div>
  );
}
