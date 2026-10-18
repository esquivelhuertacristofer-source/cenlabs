"use client";
/**
 * MAT-08 · La derivada.
 *
 * Dos modos sobre el mismo banco de trazado:
 *  · EXPLORAR (estado inicial): una función del catálogo (x³/3 − x, sen x, eˣ, e^(−x²)).
 *    El carro recorre la curva por estaciones; en cada una la secante PQ gira y converge a la
 *    tangente cuando h → 0, y al avanzar, la pendiente límite dibuja f′(x) en la placa de abajo.
 *    El alumno puede tomar x₀ y h a mano, y elegir el cociente hacia delante o el centrado.
 *  · RETO · COHETE: s(t) = −k·t³ + m·t² (store `derivada8`). Hay que marcar el instante de
 *    VELOCIDAD MÁXIMA (v′ = a = 0, inflexión de s). El instante marcado se escribe en el store
 *    (`derivada8.xActual`), que es lo que lee el validador; el validador y el store no cambian.
 *    La escena y el dock no dibujan v(t) ni la concavidad de s hasta validar.
 *
 * Un solo reloj por modo (`RelojDerivada`): la escena lo avanza y el dock, la barra y los
 * mandos lo leen en el mismo cuadro.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { ShieldCheck, Play, Pause, CheckCircle2, Scan, Tags, PanelRightOpen, PanelBottomOpen, Route, RotateCcw, PenLine } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import LabLayout, { GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';
import { FUNCIONES, IDS_FUNCION, curvaCohete, num, type IdFuncion, type Metodo } from './simuladores/mat08/derivada';
import { tVelocidadMaximaM8, velocidadM8 } from '@/domain/matematicas';
import { RelojDerivada, FRAC_H_MIN, FRAC_H_MAX, type ModoM8 } from './simuladores/mat08/reloj';
import { DockDerivada, useTickReloj } from './simuladores/mat08/Dock';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Derivadas3DScene = dynamic(() => import('./simuladores/mat08/Derivadas3DScene'), {
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

const redondo2 = (t: number) => Math.round(t * 100) / 100;

/** Pastilla de la escena (capas y vistas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** h en escala logarítmica (de h_min a h_max del dominio). */
function DeslizadorH({ reloj }: { reloj: React.MutableRefObject<RelojDerivada> }) {
  const r = reloj.current;
  const lo = Math.log10(FRAC_H_MIN * r.span), hi = Math.log10(FRAC_H_MAX * r.span);
  const val = Math.log10(Math.max(r.hAbs, 1e-12));
  return (
    <label className="flex w-40 min-w-[120px] flex-col gap-1">
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>Incremento h</span>
        <span className="font-mono tabular-nums text-white">{num(r.h, r.hAbs < 0.01 ? 4 : 3)}</span>
      </span>
      <input type="range" min={lo} max={hi} step={0.01} value={Math.min(hi, Math.max(lo, val))} aria-label="Incremento h (escala logarítmica)"
        onChange={(e) => reloj.current.setH(10 ** Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#ffb43a]" />
    </label>
  );
}

/** Lectura compacta de la barra (como la del LabLayout, pero sin pasar a mayúsculas: f′(x₀) no es F′(X₀)). */
function Chip({ etiqueta, valor, unidad, color, title }: { etiqueta: string; valor: string; unidad?: string; color?: string; title?: string }) {
  return (
    <div title={title} className="flex shrink-0 items-baseline gap-1 rounded-lg border px-1.5 py-1"
      style={{ borderColor: color ? `${color}66` : 'rgba(255,255,255,0.1)', background: color ? `${color}14` : 'rgba(255,255,255,0.04)' }}>
      <span className="text-[10.5px] font-semibold text-slate-400">{etiqueta}</span>
      <span className="font-mono text-[12.5px] font-semibold tabular-nums" style={{ color: color ?? '#fff' }}>{valor}</span>
      {unidad && <span className="text-[10.5px] text-slate-400">{unidad}</span>}
    </div>
  );
}

/** Lecturas de la barra superior: las del MISMO cuadro que la escena. */
function LecturasVivas({ reloj, compacto }: { reloj: React.MutableRefObject<RelojDerivada>; compacto: boolean }) {
  useTickReloj(reloj, 15);
  const r = reloj.current, l = r.lectura(), c = r.curva;
  const reto = r.modo === 'reto';
  return (
    <>
      <Chip etiqueta={reto ? 't' : 'x₀'} valor={num(l.x0, 2)} unidad={reto ? 's' : undefined} />
      {!compacto && <Chip etiqueta={reto ? 's(t)' : 'f(x₀)'} valor={num(l.fx, 2)} unidad={c.uF || undefined} />}
      <Chip etiqueta="h" valor={num(l.h, l.hAbs < 0.01 ? 4 : 3)} />
      <Chip etiqueta={reto ? 'Δs/Δt' : 'Δf/h'} valor={num(l.d, 3)} color="#ffb43a" title="Pendiente de la secante dibujada" />
      <Chip etiqueta={reto ? 'v = s′(t)' : 'f′(x₀)'} valor={num(l.d1, 3)} unidad={compacto ? undefined : c.uD || undefined} color="#ff4fa3" title="El límite: la pendiente de la tangente" />
    </>
  );
}

/** Deslizador con la cifra en coma decimal (el del LabLayout escribe «-2.00»). */
function DeslizadorM({ etiqueta, valor, min, max, paso, unidad, onChange, ancho = 'w-44' }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad?: string; onChange: (v: number) => void; ancho?: string;
}) {
  return (
    <label className={`flex flex-col gap-1 ${ancho} min-w-[120px]`}>
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>{etiqueta}</span>
        <span className="font-mono tabular-nums text-white">{num(valor, 2)}{unidad ? ` ${unidad}` : ''}</span>
      </span>
      <input type="range" min={min} max={max} step={paso} value={valor} aria-label={etiqueta} onChange={(e) => onChange(Number(e.target.value))}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** Mandos que siguen al reloj (x₀ y h se mueven solos durante el recorrido o el vuelo). */
function MandosVivos({ reloj, modo, status, onValidar, onMarcar, onVuelo, onAnotar }: {
  reloj: React.MutableRefObject<RelojDerivada>; modo: ModoM8;
  status: 'idle' | 'success' | 'error'; onValidar: () => void; onMarcar: (t: number) => void; onVuelo: () => void; onAnotar: () => void;
}) {
  useTickReloj(reloj, 15);
  const r = reloj.current;
  const [a, b] = r.curva.dominio;
  const reto = modo === 'reto';
  return (
    <GrupoControles className="items-end">
      <DeslizadorM etiqueta={reto ? 'Instante marcado t' : 'Punto x₀'} valor={r.x0} min={a} max={b} paso={reto ? 0.01 : (b - a) / 1000}
        unidad={reto ? 's' : undefined} onChange={(v) => { if (reto) onMarcar(v); else reloj.current.setX0(v); }} />
      <DeslizadorH reloj={reloj} />
      <div className="flex gap-1.5">
        {reto ? (
          <BotonLab variante="secundario" title={r.vuelo ? 'Pausar el vuelo' : 'Reproducir el vuelo (1 s por segundo)'} onClick={onVuelo}>
            {r.vuelo ? <Pause size={14} /> : <Play size={14} />} {r.vuelo ? 'Pausar' : 'Reproducir'}
          </BotonLab>
        ) : (
          <BotonLab variante="secundario" title={r.recorrido ? 'Parar el recorrido' : 'Recorrer la curva por estaciones'} onClick={() => { reloj.current.setRecorrido(!r.recorrido); audio?.playPop(); }}>
            {r.recorrido ? <Pause size={14} /> : <Route size={14} />} {r.recorrido ? 'Parar' : 'Recorrer'}
          </BotonLab>
        )}
        <BotonLab variante="secundario" title="Abrir la secante y hacer h → 0" onClick={() => { reloj.current.reiniciarH(); audio?.playPop(); }}>
          <RotateCcw size={14} /> h → 0
        </BotonLab>
      </div>
      {reto && (
        <div className="flex flex-wrap items-center gap-1.5">
          <BotonLab variante="secundario" title="Anotar la pendiente de la tangente en este instante" onClick={onAnotar}>
            <PenLine size={14} /> Anotar v(t)
          </BotonLab>
          <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={onValidar}>
            {status === 'success' ? <CheckCircle2 size={14} /> : <ShieldCheck size={14} />} {status === 'success' ? 'Instante correcto' : 'Validar telemetría'}
          </BotonLab>
          {status === 'error' && <span role="status" className="text-[12px] font-semibold text-rose-300">Ese no es el instante de velocidad máxima.</span>}
        </div>
      )}
    </GrupoControles>
  );
}

export default function PilotoDerivadas({ onValidate }: { onValidate?: () => void }) {
  const { derivada8, setXActualM8, setAsistente } = useSimuladorStore(
    useShallow((s) => ({ derivada8: s.derivada8, setXActualM8: s.setXActualM8, setAsistente: s.setAsistente })),
  );
  const { status, k, m, xActual } = derivada8;

  const [modo, setModo] = useState<ModoM8>('explorar');
  const [funcion, setFuncion] = useState<IdFuncion>('cubica');
  const [metodo, setMetodoE] = useState<Metodo>('adelante');
  const [reducido] = useState(prefiereReducirMovimiento);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  // ── relojes: uno por modo (cada uno guarda su recorrido, su traza y sus mediciones) ──
  const relojE = useRef<RelojDerivada | null>(null);
  if (!relojE.current) { relojE.current = new RelojDerivada(FUNCIONES.cubica, 'explorar'); if (reducido) relojE.current.estatico(); }
  const relojR = useRef<RelojDerivada | null>(null);
  if (!relojR.current) { relojR.current = new RelojDerivada(curvaCohete({ k, m }), 'reto', xActual); if (reducido) relojR.current.estatico(); }
  const reloj = useRef<RelojDerivada>(relojE.current);
  reloj.current = modo === 'explorar' ? relojE.current : relojR.current;

  // el cohete del store (si el sorteo cambia k o m, se prepara uno nuevo)
  const firmaCohete = `${k}|${m}`;
  const [validadoLocal, setValidadoLocal] = useState(false);
  useEffect(() => {
    const r = relojR.current!;
    if (r.curva.formula !== curvaCohete({ k, m }).formula) { r.setCurva(curvaCohete({ k, m })); setValidadoLocal(false); }
  }, [firmaCohete]); // eslint-disable-line react-hooks/exhaustive-deps
  // el instante del store manda (reinicio desde la bitácora o el modal)
  useEffect(() => {
    const r = relojR.current!;
    if (!r.vuelo && Math.abs(redondo2(r.x0) - xActual) > 0.004) r.setX0(xActual);
  }, [xActual]);
  // validado: v(t) se revela y se queda revelada para este cohete
  useEffect(() => { if (status === 'success') setValidadoLocal(true); }, [status]);
  const validado = status === 'success' || validadoLocal;
  useEffect(() => { if (validado) relojR.current!.revelar(); else relojR.current!.ocultar(); }, [validado]);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al Centro de Control. Encuentra el instante de MÁXIMA VELOCIDAD del cohete: la velocidad es la derivada de la posición, y es máxima donde su propia derivada se anula.",
      pose: "thinking",
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── mandos ──
  const elegirFuncion = (id: IdFuncion) => { setFuncion(id); relojE.current!.setCurva(FUNCIONES[id]); if (reducido) relojE.current!.estatico(); audio?.playPop(); };
  const setMetodo = (mt: Metodo) => { setMetodoE(mt); relojE.current!.setMetodo(mt); relojR.current!.setMetodo(mt); };
  const marcar = useCallback((t: number) => { relojR.current!.setX0(t); setXActualM8(redondo2(t)); }, [setXActualM8]);
  const alternarVuelo = useCallback(() => {
    const r = relojR.current!;
    if (r.vuelo) { r.setVuelo(false); setXActualM8(redondo2(r.x0)); } else r.setVuelo(true);
    audio?.playPop();
  }, [setXActualM8]);
  const validar = useCallback(() => {
    const r = relojR.current!;
    r.setVuelo(false);
    setXActualM8(redondo2(r.x0));
    onValidate?.();
  }, [setXActualM8, onValidate]);
  const anotar = useCallback(() => { relojR.current!.anotar(); audio?.playPop(); }, []);

  // ── tamaño propio: el dock va a la derecha si cabe, si no en una franja bajo la escena ──
  const raiz = useRef<HTMLDivElement>(null);
  const [tam, setTam] = useState<{ w: number; h: number } | null>(null);
  useLayoutEffect(() => {
    const el = raiz.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setTam({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const [dock, setDock] = useState<boolean | null>(null);
  useEffect(() => { if (dock === null && tam) setDock(tam.w >= 700); }, [tam, dock]);
  const lateral = !!tam && tam.w >= 900;
  const anchoDock = 300;
  const altoFranja = tam ? Math.max(160, Math.min(210, Math.round(tam.h * 0.3))) : 180;
  const dockAbierto = !!dock && !!tam;

  // ── aviso que aparece una vez por modo y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoM8>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'Cuando h → 0, la secante PQ gira hasta la tangente; su pendiente dibuja f′(x) abajo.'
        : 'La velocidad es la pendiente de la tangente. Mueve t, anota pendientes y marca dónde es máxima.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const reto = modo === 'reto';
  const curvaClave = reto ? `r|${firmaCohete}` : `e|${funcion}`;
  const escena3D = useMemo(() => (
    <Derivadas3DScene reloj={reloj} modo={modo} clave={curvaClave} validado={validado} calidad={calidad} reducido={reducido}
      rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
  ), [modo, curvaClave, validado, calidad, reducido, rotulos, encuadre, onListo]);

  const leyenda = [
    { c: '#38d9f5', t: reto ? 's(t)' : 'f(x)' },
    { c: '#ffb43a', t: 'secante' },
    { c: '#ff4fa3', t: reto ? 'tangente · v' : 'tangente · f′' },
  ];

  const escena = (
    <div ref={raiz} className="absolute inset-0 flex overflow-hidden bg-[#05080b]" style={{ flexDirection: lateral ? 'row' : 'column' }} data-modo-m8={modo}>
      <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-escena-contenedor="">
        {escena3D}
        {/* capas y vistas */}
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
        <button type="button" onClick={() => setDock((d) => !d)} aria-pressed={dockAbierto} aria-label={dockAbierto ? 'Plegar instrumentos' : 'Abrir instrumentos'}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-lg border px-2.5 text-[11px] font-semibold backdrop-blur ${dockAbierto ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/15 bg-[#0f1a2b]/85 text-slate-200 hover:border-[#219EBC] hover:text-white'}`}>
          {lateral ? <PanelRightOpen size={13} /> : <PanelBottomOpen size={13} />} Instrumentos
        </button>
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-wrap gap-x-2.5 gap-y-1 rounded-md bg-[#0b1220]/70 px-2 py-1 text-[10.5px] font-semibold text-slate-200 backdrop-blur">
          {leyenda.map((x) => (
            <span key={x.t} className="flex items-center gap-1.5"><i className="inline-block h-2 w-2 rounded-full" style={{ background: x.c, boxShadow: `0 0 6px ${x.c}` }} />{x.t}</span>
          ))}
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso con resplandor)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-m8={calidad}>
          Calidad: {calidad}
        </button>
        {reto && validado && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4" data-veredicto-m8="">
            <span className="rounded-lg border border-violet-300/30 bg-[#140f24]/85 px-3 py-1.5 text-center font-mono text-[12px] text-violet-100 shadow-lg backdrop-blur">
              t* = m/(3k) = {num(tVelocidadMaximaM8({ k, m }), 2)} s · a(t*) = 0 · v máx = {num(velocidadM8({ k, m }, tVelocidadMaximaM8({ k, m })), 3)} m/s
            </span>
          </div>
        )}
        {aviso && (
          <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-m8 max-w-[520px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-m8="">
              {aviso.texto}
            </span>
          </div>
        )}
        <style>{`.aviso-m8{animation:avisoM8 7s ease forwards}@keyframes avisoM8{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-m8{animation:none}}`}</style>
      </div>
      {dockAbierto && tam && (
        <div className={`shrink-0 bg-[#0f1a2b] ${lateral ? 'border-l' : 'border-t'} border-white/10`}
          style={lateral ? { width: anchoDock } : { height: altoFranja }} data-franja-dock={lateral ? 'lateral' : 'inferior'}>
          <DockDerivada reloj={reloj} revela={!reto || validado} orientacion={lateral ? 'columna' : 'fila'}
            alto={lateral ? tam.h : altoFranja} ancho={lateral ? anchoDock : tam.w} />
        </div>
      )}
    </div>
  );

  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{reto ? 'Reto · cohete' : 'Exploración'}</span>
        <span className="whitespace-nowrap font-mono text-[12.5px] font-bold text-white">{reloj.current.curva.formula}</span>
      </div>
      <LecturasVivas reloj={reloj} compacto={!!tam && tam.w < 640} />
    </div>
  );

  const controles = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <Segmentado<ModoM8> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
          opciones={[{ valor: 'explorar', texto: 'Explorar' }, { valor: 'reto', texto: 'Reto · cohete' }]} />
        {!reto && (
          <Segmentado<IdFuncion> etiqueta="Función" valor={funcion} onChange={elegirFuncion}
            opciones={IDS_FUNCION.map((id) => ({ valor: id, texto: FUNCIONES[id].nombre }))} />
        )}
        <Segmentado<Metodo> etiqueta="Cociente" valor={metodo} onChange={(mt) => { setMetodo(mt); audio?.playPop(); }}
          opciones={[{ valor: 'adelante', texto: 'Delante' }, { valor: 'centrada', texto: 'Centrado' }]} />
      </GrupoControles>
      <MandosVivos reloj={reloj} modo={modo} status={status}
        onValidar={validar} onMarcar={marcar} onVuelo={alternarVuelo} onAnotar={anotar} />
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} tituloPanel="Instrumentos" />;
}
