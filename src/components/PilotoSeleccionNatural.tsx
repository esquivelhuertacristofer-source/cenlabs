"use client";
/**
 * B6 · Selección natural (Biston betularia, melanismo industrial).
 *
 * Dos vistas sobre el mismo modelo (`simuladores/bio06/seleccion.ts`, probado en jest):
 *  · BOSQUE (estado inicial): Mánchester, 1848. Un roble con su población de polillas y tres
 *    carboneros que cazan en tiempo real; cada año la población se renueva (Wright–Fisher) y el dock
 *    dibuja p(C) con su banda de deriva y la curva determinista p′ = p·w₁/w̄. El alumno mueve el
 *    hollín, el número de aves y el tamaño de la población. No toca el store.
 *  · RETO (store `evolucion`, validador `evaluarB6`, sin cambios de criterio): el alumno es el ave.
 *    Caza la cuota de cada generación con un clic, las supervivientes se reproducen y él estima q con
 *    √(fracción de claras). La q real, la curva determinista y su presión selectiva (s) sólo se ven
 *    tras validar.
 *
 * Un solo reloj por vista (bio06/reloj.ts) mueve la escena, el dock y las lecturas.
 */
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Activity, Bird, ChevronRight, FastForward, PanelRightClose, PanelRightOpen, Pause, Play, RefreshCcw, RotateCcw, Scan, ShieldCheck, Tags } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { audio } from '@/utils/audioEngine';
import { qEstimadaB6, GENERACIONES_MIN_B6, GENERACIONES_MAX_B6, aleloFavorecidoB6, fenotipoConspicuoB6 } from '@/domain/biologia';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';
import { RelojBosque, RelojReto, INICIO_BOSQUE, HOLLIN_RETO, type VistaB6 } from './simuladores/bio06/reloj';
import { DockB6, cifra, useTickReloj, type DatosRetoB6 } from './simuladores/bio06/Dock';
import {
  ALBEDO, DEPREDACION, bandaNeutraReto, supervivenciaRealizada, qEstimada, conteoDe, frecuenciaC, pSiguiente, hollinNeutro,
  type Genotipo, type Eficacias,
} from './simuladores/bio06/seleccion';

// la escena 3D va en su propio chunk (el dock y los relojes no arrastran three)
const SeleccionNatural3DScene = dynamic(() => import('./simuladores/bio06/SeleccionNatural3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0e1a13]" />,
});

type Calidad = 'alta' | 'media';
/** Calidad media SÓLO en móvil, ventana < 820 px o ≤ 2 núcleos (`?calidad=` la fuerza). */
function detectarCalidad(): Calidad {
  if (typeof window === 'undefined') return 'alta';
  try {
    const q = new URLSearchParams(window.location.search).get('calidad');
    if (q === 'alta' || q === 'media') return q;
  } catch { /* nada */ }
  const movil = /Android|iPhone|iPad|Mobile/i.test(navigator.userAgent);
  const nucleos = navigator.hardwareConcurrency ?? 8;
  return movil || window.innerWidth < 820 || nucleos <= 2 ? 'media' : 'alta';
}
function prefiereReducirMovimiento(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

function Pildora({ activo, onClick, children, title, ancho }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string; ancho?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title} aria-label={title}
      className={`pointer-events-auto flex h-7 items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold backdrop-blur transition-colors ${ancho === false ? 'w-7' : 'px-2.5'} ${activo ? 'border-[#9be3b5]/50 bg-[#123222]/85 text-white' : 'border-white/10 bg-[#0c1812]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Sección plegable del panel Modelo (acordeón: abrir una cierra la otra, para que quepa sin scroll). */
function Desplegable({ titulo, abierto, onAlternar, children }: { titulo: string; abierto: boolean; onAlternar: () => void; children: React.ReactNode }) {
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={onAlternar} aria-expanded={abierto}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[11.5px] font-semibold text-slate-200 hover:text-white">
        <ChevronRight size={13} className={`shrink-0 transition-transform ${abierto ? 'rotate-90' : ''}`} /> {titulo}
      </button>
      {abierto && <div className="space-y-1.5 px-3 pb-2.5 text-[11px] leading-snug text-slate-300">{children}</div>}
    </div>
  );
}

/** Deslizador con la cifra en coma decimal (el de LabLayout escribe con punto). */
function Deslizador({ etiqueta, valor, min, max, paso, unidad, decimales, onChange, ancho = 'w-40' }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad: string; decimales: number; onChange: (v: number) => void; ancho?: string;
}) {
  return (
    <label className={`flex min-w-[120px] flex-col gap-1 ${ancho}`}>
      <span className="flex justify-between gap-2 text-[11px] font-semibold text-slate-300">
        <span>{etiqueta}</span>
        <span className="whitespace-nowrap font-mono tabular-nums text-white">{cifra(valor, decimales)} {unidad}</span>
      </span>
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(Number(e.target.value))}
        aria-label={etiqueta} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#3fae6f]" />
    </label>
  );
}

const NOMBRE_VISTA: Record<VistaB6, string> = { bosque: 'Bosque', reto: 'Reto' };

export default function PilotoSeleccionNatural({ onValidate }: { onValidate?: () => void }) {
  const evolucion = useSimuladorStore((s) => s.evolucion);
  const cazarPolilla = useSimuladorStore((s) => s.cazarPolilla);
  const finalizarGeneracion = useSimuladorStore((s) => s.finalizarGeneracion);
  const resetB6 = useSimuladorStore((s) => s.resetB6);
  const { ambiente, bugs, generacion, cuota, historial, status, pInicialFav } = evolucion;

  // ── vista, calidad, tiempo ──
  const [vista, setVista] = useState<VistaB6>('bosque');
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rapido, setRapido] = useState(false);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);

  // ── ancho del LabLayout: por debajo de 640 px su panel lateral se SUPERPONE a la escena ──
  const raiz = useRef<HTMLDivElement>(null);
  const [anchoLab, setAnchoLab] = useState<number | null>(null);
  useLayoutEffect(() => {
    const lab = raiz.current?.closest('[data-lab-layout]');
    if (!lab) return;
    const ro = new ResizeObserver(([e]) => setAnchoLab(e.contentRect.width));
    ro.observe(lab);
    return () => ro.disconnect();
  }, []);
  const estrechoLab = anchoLab !== null && anchoLab < 640;
  const [hojaModelo, setHojaModelo] = useState(false);
  useEffect(() => { if (!estrechoLab) setHojaModelo(false); }, [estrechoLab]);

  // ── relojes ──
  const relojB = useRef<RelojBosque>(null as unknown as RelojBosque);
  if (!relojB.current) relojB.current = new RelojBosque();
  const relojR = useRef<RelojReto>(null as unknown as RelojReto);
  if (!relojR.current) relojR.current = new RelojReto();
  useEffect(() => { relojR.current.sincronizar(bugs, ambiente); }, [bugs, ambiente]);
  useEffect(() => { relojB.current.pausa = pausa; relojR.current.pausa = pausa; }, [pausa]);
  useEffect(() => { relojB.current.velocidad = rapido ? 4 : 1; }, [rapido]);
  const [hollinUI, setHollinUI] = useState<number>(Math.round(INICIO_BOSQUE.hollin * 100));
  const fijarHollin = (v: number) => { setHollinUI(v); relojB.current.fijar({ hollin: v / 100 }); };

  // ── reloj de respaldo: si la escena no pinta (sin WebGL, cargando), el reloj activo avanza aquí ──
  const vistaRef = useRef(vista); vistaRef.current = vista;
  useEffect(() => {
    let id = 0, ultimo = performance.now();
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const dt = (ahora - ultimo) / 1000; ultimo = ahora;
      const r = vistaRef.current === 'reto' ? relojR.current : relojB.current;
      if (ahora - r.ultimoPaso > 250) r.paso(dt, 0);
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, []);
  const relojActivo = (vista === 'reto' ? relojR : relojB) as unknown as React.MutableRefObject<{ version: number }>;
  useTickReloj(relojActivo, 6);

  // ── aviso de una sola vez por vista (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<VistaB6>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(vista)) return;
    const textos: Record<VistaB6, string> = {
      bosque: 'Mánchester, 1848: el hollín ennegrece los robles y los carboneros cazan lo que ven.',
      reto: 'Ahora el ave eres tú: haz clic en las polillas que veas.',
    };
    const id = window.setInterval(() => {
      const el = raiz.current; if (!el) return;
      const r = el.getBoundingClientRect();
      const encima = document.elementFromPoint(r.left + r.width / 2, r.top + r.height * 0.4);
      if (!encima || !el.contains(encima) || document.hidden) return;
      window.clearInterval(id);
      vistos.current.add(vista);
      setAviso({ n: Date.now(), texto: textos[vista] });
    }, 400);
    return () => window.clearInterval(id);
  }, [vista, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 6500);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // ── reto ──
  const reto = vista === 'reto';
  const revela = status === 'success';
  const cazadas = bugs.filter((b) => b.cazada).length;
  const vivasReto = bugs.length - cazadas;
  const oscurasVivas = bugs.filter((b) => !b.cazada && b.tipo === 'oscura').length;
  const fOscuras = vivasReto > 0 ? oscurasVivas / vivasReto : 0;
  const qEst = qEstimadaB6(bugs);
  const agotado = historial.length >= GENERACIONES_MAX_B6;
  const puedeCazar = cazadas < cuota && !agotado;
  const onCazar = useCallback((id: number) => {
    const e = useSimuladorStore.getState().evolucion;
    const n = e.bugs.filter((b) => b.cazada).length;
    if (n >= e.cuota || e.historial.length >= GENERACIONES_MAX_B6) return;
    cazarPolilla(id);
    audio?.playPop();
  }, [cazarPolilla]);
  const siguiente = () => { finalizarGeneracion(); audio?.playNotification(); };
  const nuevaPoblacion = () => { resetB6(); audio?.playPop(); };

  // la población inicial del reto (para la banda neutra y, tras validar, la caza realizada)
  const claveReto = `${ambiente}:${pInicialFav}`;
  const inicial = useRef<{ clave: string; genotipos: Genotipo[] } | null>(null);
  if (historial.length === 0 && bugs.length && inicial.current?.clave !== claveReto) inicial.current = { clave: claveReto, genotipos: bugs.map((b) => b.genotipo) };
  const iniGs = inicial.current?.clave === claveReto ? inicial.current.genotipos : null;
  const favC = aleloFavorecidoB6(ambiente) === 'C';
  const pC0 = favC ? pInicialFav : 1 - pInicialFav;
  const bandaR = useMemo(() => bandaNeutraReto({ pC0, generaciones: GENERACIONES_MAX_B6, inicial: iniGs ?? undefined, semilla: 777 }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [claveReto, iniGs ? iniGs.join('') : '']);
  const datosReto = useMemo<DatosRetoB6>(() => {
    const fClaras0 = iniGs ? iniGs.filter((g) => g === 'cc').length / iniGs.length : (1 - pC0) ** 2;
    const puntos = [{ g: 1, q: qEstimada(fClaras0) }, ...historial.map((h) => ({ g: h.gen, q: qEstimada(1 - h.fOscuras) }))];
    const vivas = { clara: bugs.filter((b) => !b.cazada && b.tipo === 'clara').length, oscura: bugs.filter((b) => !b.cazada && b.tipo === 'oscura').length };
    const caz = { clara: bugs.filter((b) => b.cazada && b.tipo === 'clara').length, oscura: bugs.filter((b) => b.cazada && b.tipo === 'oscura').length };
    const d: DatosRetoB6 = { puntos, banda: bandaR, vivas, cazadas: caz, cuota };
    if (revela && historial.length) {
      const consp = fenotipoConspicuoB6(ambiente);
      const q0 = iniGs ? 1 - frecuenciaC(iniGs) : 1 - pC0;
      d.qReal = [{ g: 1, q: q0 }, ...historial.map((h) => ({ g: h.gen, q: favC ? 1 - h.pFav : h.pFav }))];
      // la presión que ejerció el alumno, generación a generación, a partir del registro del juez
      const lnW: number[] = [];
      historial.forEach((h, i) => {
        const fOsc = i === 0 ? (iniGs ? iniGs.filter((g) => g !== 'cc').length / iniGs.length : 1 - (1 - pC0) ** 2) : historial[i - 1].fOscuras;
        const fC = consp === 'oscura' ? fOsc : 1 - fOsc;
        const r = supervivenciaRealizada(fC, h.selectividad);
        if (r.vConspicua > 0 && r.vCamuflada > 0) lnW.push(Math.log(r.vConspicua / r.vCamuflada));
      });
      if (lnW.length) {
        const w = Math.exp(lnW.reduce((a, b) => a + b, 0) / lnW.length);
        const ef: Eficacias = consp === 'clara' ? { CC: 1, Cc: 1, cc: w } : { CC: w, Cc: w, cc: 1 };
        const det = [{ g: 1, q: q0 }];
        let p = 1 - q0;
        for (let g = 2; g <= historial.length + 1; g++) { p = pSiguiente(p, ef); det.push({ g, q: 1 - p }); }
        d.det = det; d.s = Math.max(0, 1 - w); d.conspicua = consp;
      }
      d.genotipos = conteoDe(bugs.map((b) => b.genotipo));
    }
    return d;
  }, [historial, bugs, bandaR, revela, ambiente, iniGs, pC0, favC, cuota]);

  const B = relojB.current;
  const sel = B.seleccion;
  const ultimaH = B.historia[B.historia.length - 1];

  // ── panel «Modelo» (cerrado por defecto) ──
  const [seccion, setSeccion] = useState<'ec' | 'simp' | null>(null);
  const alternar = (s: 'ec' | 'simp') => setSeccion((v) => (v === s ? null : s));
  const panelModelo = (
    <div className="flex flex-col gap-2 text-[12px] text-slate-200" data-panel-modelo-b6="">
      <Desplegable titulo="Ecuaciones del modelo" abierto={seccion === 'ec'} onAlternar={() => alternar('ec')}>
        <p className="text-[11.5px] leading-snug text-slate-100">Corteza: R(h) = (1 − h)·{cifra(ALBEDO.liquenes, 2)} + h·{cifra(ALBEDO.hollin, 3)} (h = fracción de área con hollín)</p>
        <p className="text-[11.5px] leading-snug text-slate-100">Contraste (Michelson): C = |R<sub>ala</sub> − R<sub>corteza</sub>|/(R<sub>ala</sub> + R<sub>corteza</sub>); typica {cifra(ALBEDO.typica, 2)}, carbonaria {cifra(ALBEDO.carbonaria, 2)}</p>
        <p className="text-[11.5px] leading-snug text-slate-100">Supervivencia: v = e<sup>−λ·aves·(c₀ + C)</sup>, λ = {cifra(DEPREDACION.lambdaPorAve, 2)}, c₀ = {cifra(DEPREDACION.c0, 2)}; w = v/v<sub>máx</sub>, s = 1 − w</p>
        <p className="text-[11.5px] leading-snug text-slate-100">Selección: w̄ = p²w<sub>CC</sub> + 2pq·w<sub>Cc</sub> + q²w<sub>cc</sub>; p′ = p·w₁/w̄, w₁ = p·w<sub>CC</sub> + q·w<sub>Cc</sub></p>
        <p className="text-[11.5px] leading-snug text-slate-100">Deriva (Wright–Fisher): k ~ Binomial(2N, p<sub>s</sub>), Var = p(1 − p)/(2N); hijos en Hardy–Weinberg p², 2pq, q²</p>
        <p className="text-[11.5px] leading-snug text-slate-100">Fijación neutral: P = p₀, t̄ = −4N[p ln p + q ln q] (Kimura y Ohta)</p>
      </Desplegable>
      <Desplegable titulo="Qué simplifica el modelo" abierto={seccion === 'simp'} onAlternar={() => alternar('simp')}>
        <p>Un locus, dos alelos: C (carbonaria) domina sobre c (typica). Toda la mortalidad es la caza, que crece con el contraste; generaciones sin solape, sin migración ni mutación.</p>
        <p>Toda la población en un tronco (densidad exagerada); polilla de 5,5 cm y carbonero de 14 cm, a tamaño real.</p>
        <p>Albedos: órdenes de magnitud; la corteza dibujada tiene exactamente esa cobertura y esos albedos. {DEPREDACION.avesMax} aves y corteza negra: s ≈ 0,47 (Kettlewell, 1955); 90 % de hollín: s ≈ 0,32 (Haldane, 1924); sin selección en {cifra(hollinNeutro() * 100, 0)} %.</p>
        <p>Banda del dock: 5–95 % de 240 réplicas desde tu último cambio.</p>
      </Desplegable>
    </div>
  );

  const escena = (
    <div ref={raiz} className="flex h-full w-full min-h-0 flex-col bg-[#0e1a13]" data-vista-b6={vista} data-listo-b6={listo ? '' : undefined}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <SeleccionNatural3DScene
          relojB={relojB} relojR={relojR} vista={vista} calidad={calidad} reducido={reducido} rotulos={rotulos}
          encuadre={encuadre} onListo={onListo} onCazar={onCazar}
        />
        {/* vistas y, a su lado, el aviso de una sola vez */}
        <div className="pointer-events-none absolute left-2 right-28 top-2 flex items-start gap-1.5">
          <div className="pointer-events-auto flex shrink-0 rounded-full border border-white/10 bg-[#0c1812]/75 p-0.5 backdrop-blur" role="group" aria-label="Vista">
            {(['bosque', 'reto'] as const).map((v) => (
              <button key={v} type="button" onClick={() => { setVista(v); audio?.playPop(); }} aria-pressed={vista === v}
                className={`h-6 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${vista === v ? 'bg-[#2f8f5b] text-white' : 'text-slate-300 hover:text-white'}`}>
                {NOMBRE_VISTA[v]}
              </button>
            ))}
          </div>
          {aviso && (
            <span key={aviso.n} className="aviso-b6 min-w-0 max-w-[440px] rounded-lg border border-white/10 bg-[#0b1611]/85 px-2.5 py-1 text-[12px] leading-snug text-slate-200 shadow-lg backdrop-blur" data-aviso-b6="">
              {aviso.texto}
            </span>
          )}
        </div>
        {/* tiempo: pausa y cámara rápida con su factor real */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col items-start gap-1">
          {!reto && (
            <span className="rounded bg-[#0c1812]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-camara-rapida="">
              {pausa ? 'en pausa' : `1 año ≈ ${cifra(B.durGeneracion / (rapido ? 4 : 1), 0)} s · cámara rápida`}
            </span>
          )}
          <div className="flex items-center gap-1" role="toolbar" aria-label="Tiempo">
            <Pildora ancho={false} activo={pausa} onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={13} /> : <Pause size={13} />}</Pildora>
            {!reto && <Pildora activo={rapido} onClick={() => setRapido((v) => !v)} title="Generaciones cuatro veces más rápidas"><FastForward size={12} /> ×4</Pildora>}
          </div>
        </div>
        {/* rótulos, encuadre y calidad */}
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora ancho={false} activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
          <Pildora activo={false} onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: sombras finas y posproceso)">Calidad: {calidad}</Pildora>
        </div>
        {estrechoLab && !hojaModelo && (
          <button type="button" onClick={() => setHojaModelo(true)} aria-label="Abrir panel Modelo"
            className="absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-[#0f1a2b]/85 px-2.5 text-[11px] font-semibold text-slate-200 backdrop-blur hover:border-[#3fae6f] hover:text-white">
            <PanelRightOpen size={14} /> Modelo
          </button>
        )}
        {estrechoLab && hojaModelo && (
          <aside className="absolute bottom-2 right-2 top-2 z-10 flex w-[min(90%,330px)] min-h-0 flex-col rounded-lg border border-white/10 bg-[#0f1a2b]/95 shadow-2xl shadow-black/50 backdrop-blur" data-hoja-modelo-b6="">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Modelo</span>
              <button type="button" onClick={() => setHojaModelo(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Plegar panel">
                <PanelRightClose size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-2.5 text-[13px] leading-snug">{panelModelo}</div>
          </aside>
        )}
        <style>{`.aviso-b6{animation:avisoB6 6.5s ease forwards}@keyframes avisoB6{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-b6{animation:none}}`}</style>
      </div>
      <DockB6 vista={vista} relojB={relojB} relojR={relojR} reto={datosReto} revela={revela} />
    </div>
  );

  const barraSuperior = reto ? (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <Lectura etiqueta="Corteza" valor={ambiente === 'industrial' ? 'hollín' : 'líquenes'} title={ambiente === 'industrial' ? `Corteza ennegrecida por hollín (${Math.round(HOLLIN_RETO.industrial * 100)} %)` : 'Corteza clara, con líquenes'} />
      <Lectura etiqueta="Gen." valor={generacion} title="Generación" />
      <Lectura etiqueta="Cazadas" valor={`${cazadas}/${cuota}`} acento={puedeCazar} />
      <Lectura etiqueta="Oscuras" valor={cifra(fOscuras * 100, 0)} unidad="%" title="Fracción de oscuras entre las vivas" />
      <Lectura etiqueta="q est." valor={cifra(qEst, 2)} title="q ≈ √(fracción de polillas claras)" />
    </div>
  ) : (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <Lectura etiqueta="Año" valor={B.anio} title={`Generación ${B.gen} (una por año)`} />
      <Lectura etiqueta="Oscuras" valor={cifra((ultimaH?.fOscuras ?? 0) * 100, 0)} unidad="%" title="Fracción de oscuras al nacer esta generación" />
      <Lectura etiqueta="p(C)" valor={cifra(B.pC, 2)} acento title="Frecuencia del alelo C (oscuro, dominante)" />
      <Lectura etiqueta="s" valor={cifra(sel.s, 2)} title={sel.favorecido ? `Coeficiente de selección contra la forma ${sel.favorecido === 'clara' ? 'oscura' : 'clara'}` : 'Sin selección: sólo deriva'} />
    </div>
  );

  const controlesBosque = (
    <GrupoControles>
      <Deslizador etiqueta="Hollín en la corteza" valor={hollinUI} min={0} max={100} paso={1} unidad="%" decimales={0} ancho="w-48" onChange={fijarHollin} />
      <Segmentado<string> etiqueta="Aves" valor={String(B.aves)} onChange={(v) => { relojB.current.fijar({ aves: Number(v) }); audio?.playPop(); }}
        opciones={['0', '1', '2', '3'].map((v) => ({ valor: v, texto: v }))} />
      <Segmentado<string> etiqueta="Población N" valor={String(B.N)} onChange={(v) => { relojB.current.fijar({ N: Number(v) }); audio?.playPop(); }}
        opciones={['20', '40', '80'].map((v) => ({ valor: v, texto: v }))} />
      <BotonLab variante="secundario" onClick={() => { relojB.current.reiniciar(); audio?.playPop(); }} title="Población nueva con el alelo C raro (p = 0,05)"><RotateCcw size={14} /> Reiniciar</BotonLab>
    </GrupoControles>
  );

  const mensaje = agotado
    ? 'Has llegado al máximo de generaciones.'
    : puedeCazar
      ? `Haz clic sobre las polillas que alcances a ver (${cuota - cazadas} por cazar).`
      : 'Cuota cumplida: deja que las supervivientes se reproduzcan.';
  const controlesReto = (
    <GrupoControles className="!items-center">
      <div className="flex min-w-[200px] flex-1 items-center gap-2.5">
        <Bird className="shrink-0 text-amber-400" size={20} />
        <p className="text-[12px] font-semibold text-slate-300">{mensaje} <span className="text-slate-500">De {GENERACIONES_MIN_B6} a {GENERACIONES_MAX_B6} generaciones.</span></p>
      </div>
      <BotonLab onClick={siguiente} deshabilitado={cazadas < cuota || agotado}><Activity size={14} /> Siguiente generación</BotonLab>
      <BotonLab variante="secundario" onClick={nuevaPoblacion}><RefreshCcw size={14} /> Nueva población</BotonLab>
      <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()} deshabilitado={historial.length === 0}><ShieldCheck size={14} /> Validar</BotonLab>
    </GrupoControles>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={reto ? controlesReto : controlesBosque}
      panelLateral={estrechoLab ? undefined : panelModelo}
      tituloPanel="Modelo"
      panelAbiertoInicial={false}
    />
  );
}
