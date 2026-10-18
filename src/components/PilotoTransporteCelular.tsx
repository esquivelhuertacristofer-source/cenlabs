"use client";
/**
 * B2 · Transporte celular.
 *
 * Tres vistas sobre el mismo modelo (`simuladores/bio02/transporte.ts`, probado en jest):
 *  · MEMBRANA (estado inicial, ×1/300): un glóbulo rojo recién pasado a plasma. Por la
 *    acuaporina entra agua (ósmosis), por GLUT1 glucosa (difusión facilitada), el O₂ cruza la
 *    bicapa (difusión simple) y la bomba Na⁺/K⁺ gasta ATP (transporte activo). No toca el store.
 *  · CÉLULA (×1/10): el mismo glóbulo entero, con el volumen exacto del modelo.
 *  · RETO (store `transporte`, validador `evaluarB2`, sin cambios de criterio): la osmolaridad
 *    del citoplasma es desconocida; el alumno la deduce del volumen de equilibrio (Boyle–van
 *    't Hoff) y prepara el medio isotónico. La célula se escribe en el store al reventar o al
 *    dejar de cambiar, como antes.
 *
 * Un solo reloj por vista (bio02/reloj.ts) mueve la escena, el dock y las lecturas.
 */
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { AlertTriangle, CheckCircle2, ChevronRight, NotebookPen, PanelRightClose, PanelRightOpen, Pause, Play, RotateCcw, Scan, Tags } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from './simulador/LabLayout';
import {
  MEDIO_INICIAL, CAMARA_LENTA, OXIGENO, RANGO, GLUT1, BOMBA, AGUA, ERITROCITO, PAQUETE, lpCelula, UMBRAL_LISIS_B2, VMAX_VEGETAL_B2,
  presionOsmotica, type Medio,
} from './simuladores/bio02/transporte';
import { RelojTransporte, RelojReto, type VistaB2, type ConfigReto } from './simuladores/bio02/reloj';
import { DockB2, cifra, useTickReloj, COLOR, type LecturaRetoB2 } from './simuladores/bio02/Dock';
import { GOTA_FL } from './simuladores/bio02/celula';

// la escena 3D va en su propio chunk (el dock y los relojes no arrastran three)
const Transporte3DScene = dynamic(() => import('./simuladores/bio02/Transporte3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#06121a]" />,
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
      className={`pointer-events-auto flex h-7 items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold backdrop-blur transition-colors ${ancho === false ? 'w-7' : 'px-2.5'} ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

function Desplegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
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
        aria-label={etiqueta} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** Leyenda de colores de la vista de la membrana (sólo nombres). */
const LEYENDA: { t: string; c: string; forma?: 'hex' | 'par' }[] = [
  { t: 'Na⁺', c: COLOR.na }, { t: 'K⁺', c: COLOR.k }, { t: 'Cl⁻', c: '#62cf84' }, { t: 'glucosa', c: '#fff1cf', forma: 'hex' },
  { t: 'O₂', c: '#ff5a4e', forma: 'par' }, { t: 'H₂O', c: COLOR.agua }, { t: 'ATP', c: '#4fc3c9' },
];

const NOMBRE_VISTA: Record<VistaB2, string> = { membrana: 'Membrana', celula: 'Célula', reto: 'Reto' };

export default function PilotoTransporteCelular({ onValidate }: { onValidate?: () => void }) {
  const { transporte, setTransporte, generarSemillaB2, setAsistente, audio } = useSimuladorStore(useShallow((s) => ({
    transporte: s.transporte, setTransporte: s.setTransporte, generarSemillaB2: s.generarSemillaB2, setAsistente: s.setAsistente, audio: s.audio,
  })));
  const { concExt, glucosaExt, temperatura, concInt, tipoCelula, lisada, status } = transporte;

  // ── vista, calidad, tiempo ──
  const [vista, setVista] = useState<VistaB2>('membrana');
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);

  // ── ancho del LabLayout: por debajo de 640 px su panel lateral se SUPERPONE a la escena y
  // taparía el dock; ahí «Modelo» se abre como hoja dentro de la vista 3D ──
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

  // ── exploración ──
  const [medio, setMedio] = useState<Medio>(MEDIO_INICIAL);
  const relojE = useRef<RelojTransporte>(null as unknown as RelojTransporte);
  if (!relojE.current) relojE.current = new RelojTransporte(MEDIO_INICIAL);
  useEffect(() => { relojE.current.fijarMedio(medio); }, [medio]);
  useEffect(() => { relojE.current.factor = vista === 'celula' ? CAMARA_LENTA.celula : CAMARA_LENTA.membrana; }, [vista]);
  const fijar = (m: Partial<Medio>) => setMedio((x) => ({ ...x, ...m }));
  const transferir = () => { relojE.current.transferir(); setPausa(false); audio?.playPop(); };

  // ── reto (la célula del store) ──
  const cfgReto: ConfigReto = { tipo: tipoCelula, nacl: concExt, glucosa: glucosaExt, tC: temperatura, osm0: 2 * concInt, lisada };
  const relojR = useRef<RelojReto>(null as unknown as RelojReto);
  if (!relojR.current) relojR.current = new RelojReto(cfgReto);
  useEffect(() => {
    relojR.current.configurar({ tipo: tipoCelula, nacl: concExt, glucosa: glucosaExt, tC: temperatura, osm0: 2 * concInt, lisada });
  }, [tipoCelula, concExt, glucosaExt, temperatura, concInt, lisada]);
  useEffect(() => {
    // al reventar o al dejar de cambiar, la célula se escribe en el store (como antes)
    relojR.current.onLisis = (v) => setTransporte({ lisada: true, volumen: Math.round(v) });
    relojR.current.onEstable = (v) => setTransporte({ volumen: v });
  }, [setTransporte]);
  const [lecturas, setLecturas] = useState<LecturaRetoB2[]>([]);
  useEffect(() => { setLecturas([]); }, [concInt, tipoCelula]);

  useEffect(() => { relojE.current.pausa = pausa; relojR.current.pausa = pausa; }, [pausa]);

  // ── reloj de respaldo: si la escena no pinta (pestaña sin WebGL, cargando), el reloj activo avanza aquí ──
  const vistaRef = useRef(vista); vistaRef.current = vista;
  useEffect(() => {
    let id = 0, ultimo = performance.now();
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const dt = (ahora - ultimo) / 1000; ultimo = ahora;
      const r = vistaRef.current === 'reto' ? relojR.current : relojE.current;
      if (ahora - r.ultimoPaso > 250) r.paso(dt, 0);
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, []);
  const relojActivo = (vista === 'reto' ? relojR : relojE) as unknown as React.MutableRefObject<{ version: number }>;
  useTickReloj(relojActivo, 6);

  // ── asistente ──
  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'Mira primero cómo cruzan la membrana el agua, la glucosa, el O₂ y los iones. Después, en el reto, deduce la osmolaridad de la célula con su volumen.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // ── aviso de una sola vez por vista (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<VistaB2>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(vista)) return;
    const textos: Record<VistaB2, string> = {
      membrana: 'Glóbulo rojo recién pasado a plasma: entra agua, glucosa y O₂, y la bomba gasta ATP.',
      celula: 'El mismo glóbulo entero: su volumen es el del modelo.',
      reto: 'Prepara un medio, espera a que el volumen se estabilice y anótalo.',
    };
    // sólo cuando la escena está a la vista (no detrás de la presentación de la práctica)
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

  const reto = vista === 'reto';
  const revela = status === 'success';
  const l = relojE.current.lectura;
  const R = relojR.current;
  const anotar = () => { setLecturas((x) => [...x, { nacl: concExt, glucosa: glucosaExt, v: Math.round(R.V * 10) / 10 }].slice(-8)); audio?.playPop(); };
  const nuevaMuestra = () => { generarSemillaB2(); audio?.playPop(); };
  const cambiarVista = (v: VistaB2) => { setVista(v); audio?.playPop(); };

  const estadoCelula = lisada ? 'Hemólisis' : tipoCelula === 'animal'
    ? (R.V > 130 ? 'Hinchada' : R.V < 90 ? 'Crenada' : 'Forma normal')
    : (R.V >= VMAX_VEGETAL_B2 - 1 ? 'Turgente' : R.V < 90 ? 'Plasmolizada' : 'Flácida');
  const agua = R.lisada ? '—' : R.tendencia === 'estable' ? 'Estable' : R.tendencia === 'gana' ? 'Entra' : 'Sale';
  const lento = CAMARA_LENTA[vista];

  // ── panel «Modelo» (cerrado por defecto) ──
  const panelModelo = (
    <div className="flex flex-col gap-2 text-[12px] text-slate-200" data-panel-modelo-b2="">
      <Desplegable titulo="Ecuaciones del modelo">
        <p className="font-mono text-[11px] text-slate-100">Π = i·M·R·T · Osm = Σ iᵢ·cᵢ (NaCl i = 2, glucosa i = 1)</p>
        <p className="font-mono text-[11px] text-slate-100">dV/dt = L<sub>p</sub>·(Osm<sub>dentro</sub> − Osm<sub>fuera</sub>), L<sub>p</sub> = P<sub>f</sub>·A·V̄<sub>w</sub> ({cifra(lpCelula(37), 2)} fL/(s·mOsm/L) a 37 °C)</p>
        <p className="font-mono text-[11px] text-slate-100">Osm<sub>dentro</sub>·V = constante → V/V₀ = Osm₀/tonicidad (Boyle–van ’t Hoff)</p>
        <p className="font-mono text-[11px] text-slate-100">J = −D·dC/dx = P·ΔC, P = K·D/L (Fick)</p>
        <p className="font-mono text-[11px] text-slate-100">GLUT1: J = k<sub>cat</sub>·S/(K<sub>m</sub> + S), K<sub>m</sub> = {GLUT1.km} mM, k<sub>cat</sub> = {GLUT1.kcat37}/s (37 °C)</p>
        <p className="font-mono text-[11px] text-slate-100">Bomba: v = V<sub>max</sub>·f(Na⁺³)·f(K⁺²)·[ATP]/(K + [ATP]), 3 Na⁺ : 2 K⁺ : 1 ATP</p>
        <p className="font-mono text-[11px] text-slate-100">Hb: S = pO₂ⁿ/(P50ⁿ + pO₂ⁿ), P50 = {cifra(OXIGENO.p50, 1)} mmHg, n = {cifra(OXIGENO.n, 1)}</p>
      </Desplegable>
      <Desplegable titulo="Qué simplifica el modelo">
        <p>Una copia de cada proteína; el glóbulo real tiene ~{BOMBA.copias} bombas, ~{cifra(GLUT1.copias, 0)} GLUT1 y ~{cifra(AGUA.tetramerosAQP1, 0)} acuaporinas. Cada H₂O que sale del poro son {cifra(PAQUETE.agua, 0)} reales; cada O₂, {PAQUETE.o2}. Los iones se dibujan con su radio hidratado y su vaivén es esquemático (el real es ~10⁶ veces más rápido).</p>
        <p>Las partículas de cada lado son las moléculas reales de la caja dibujada (c·V·N<sub>A</sub>). Na⁺ y K⁺ del citoplasma están en estado estacionario: la fuga iguala a la bomba en horas.</p>
        <p>Osmómetro ideal (sin volumen no osmótico). O₂ con permeabilidad efectiva de la célula ({cifra(OXIGENO.pEf, 2)} cm/s): la bicapa sola es más rápida. En el reto la glucosa cuenta como impermeante (GLUT1 tardaría minutos) y la célula vegetal usa el mismo L<sub>p</sub> (esquema).</p>
        <p>El glóbulo encierra el volumen del modelo: disco de Evans–Fung de {ERITROCITO.V0} fL, esfera de igual área al hincharse, lisis a {UMBRAL_LISIS_B2} %. Gotas de {cifra(GOTA_FL, 1)} fL (se saturan a 90/s).</p>
      </Desplegable>
    </div>
  );

  const leyenda = vista === 'membrana' && (
    <div className="pointer-events-none flex max-w-[340px] flex-wrap gap-x-2 gap-y-0.5 rounded-md bg-[#08141c]/70 px-1.5 py-1 text-[10.5px] font-semibold text-slate-200 backdrop-blur" data-leyenda-b2="">
      {LEYENDA.map((x) => (
        <span key={x.t} className="flex items-center gap-1">
          <i className={`inline-block h-2 w-2 ${x.forma === 'hex' ? 'rotate-45 rounded-[2px]' : 'rounded-full'}`} style={{ background: x.c }} />{x.t}
        </span>
      ))}
    </div>
  );

  const escena = (
    <div ref={raiz} className="flex h-full w-full min-h-0 flex-col bg-[#06121a]" data-vista-b2={vista} data-listo-b2={listo ? '' : undefined}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Transporte3DScene
          relojE={relojE} relojR={relojR} vista={vista} tipoReto={tipoCelula}
          calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo}
        />
        {/* vistas y, a su lado, el aviso de una sola vez */}
        <div className="pointer-events-none absolute left-2 right-28 top-2 flex items-start gap-1.5">
          <div className="pointer-events-auto flex shrink-0 rounded-full border border-white/10 bg-[#0b1422]/75 p-0.5 backdrop-blur" role="group" aria-label="Vista">
            {(['membrana', 'celula', 'reto'] as const).map((v) => (
              <button key={v} type="button" onClick={() => cambiarVista(v)} aria-pressed={vista === v}
                className={`h-6 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${vista === v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
                {NOMBRE_VISTA[v]}
              </button>
            ))}
          </div>
          {aviso && (
            <span key={aviso.n} className="aviso-b2 min-w-0 max-w-[440px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-2.5 py-1 text-[12px] leading-snug text-slate-200 shadow-lg backdrop-blur" data-aviso-b2="">
              {aviso.texto}
            </span>
          )}
        </div>
        {/* leyenda (membrana), tiempo: pausa y cámara lenta con su factor real */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col items-start gap-1">
          {leyenda}
          <span className="rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-camara-lenta="">
            {pausa ? 'en pausa' : `×1/${lento} · cámara lenta`}
          </span>
          <div className="flex items-center gap-1" role="toolbar" aria-label="Tiempo">
            <Pildora ancho={false} activo={pausa} onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={13} /> : <Pause size={13} />}</Pildora>
          </div>
        </div>
        {/* rótulos, encuadre y calidad */}
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora ancho={false} activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
          <Pildora activo={false} onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: sombras finas y posproceso)">Calidad: {calidad}</Pildora>
        </div>
        {reto && lisada && (
          <div className="absolute inset-x-3 top-11 mx-auto flex max-w-[520px] items-center justify-between gap-3 rounded-xl border border-red-500/50 bg-[#2a0d10]/90 px-3 py-2 text-white backdrop-blur" data-lisis-b2="">
            <span className="flex items-center gap-2 text-[12px] font-semibold"><AlertTriangle size={16} className="shrink-0 text-red-400" />
              <span><b className="text-red-300">Hemólisis.</b> La membrana se rompió: es irreversible.</span>
            </span>
            <BotonLab variante="acento" onClick={nuevaMuestra}><RotateCcw size={14} /> Nueva muestra</BotonLab>
          </div>
        )}
        {estrechoLab && !hojaModelo && (
          <button type="button" onClick={() => setHojaModelo(true)} aria-label="Abrir panel Modelo"
            className="absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-[#0f1a2b]/85 px-2.5 text-[11px] font-semibold text-slate-200 backdrop-blur hover:border-[#219EBC] hover:text-white">
            <PanelRightOpen size={14} /> Modelo
          </button>
        )}
        {estrechoLab && hojaModelo && (
          <aside className="absolute bottom-2 right-2 top-2 z-10 flex w-[min(86%,300px)] min-h-0 flex-col rounded-lg border border-white/10 bg-[#0f1a2b]/95 shadow-2xl shadow-black/50 backdrop-blur" data-hoja-modelo-b2="">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Modelo</span>
              <button type="button" onClick={() => setHojaModelo(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Plegar panel">
                <PanelRightClose size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[13px] leading-snug">{panelModelo}</div>
          </aside>
        )}
        <style>{`.aviso-b2{animation:avisoB2 6.5s ease forwards}@keyframes avisoB2{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-b2{animation:none}}`}</style>
      </div>
      <DockB2 vista={vista} relojE={relojE} relojR={relojR} lecturas={lecturas} revela={revela} />
    </div>
  );

  const barraSuperior = reto ? (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <Lectura etiqueta="Muestra" valor={tipoCelula === 'animal' ? 'Eritrocito' : 'Epidermis vegetal'} />
      <Lectura etiqueta="Osm citoplasma" valor={revela ? `${cifra(2 * concInt, 3)} Osm/L` : 'desconocida'} />
      <Lectura etiqueta="V / V₀" valor={cifra(R.V, 1)} unidad="%" acento />
      <Lectura etiqueta="Agua" valor={agua} />
      <Lectura etiqueta="Estado" valor={estadoCelula} />
    </div>
  ) : (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <Lectura etiqueta="Π plasma" valor={cifra(presionOsmotica(l.osmOut / 1000, medio.tC), 2)} unidad="atm" title="Π = Osm·R·T del medio" />
      <Lectura etiqueta="V / V₀" valor={cifra(l.vRel, 1)} unidad="%" acento />
      <Lectura etiqueta="Hb con O₂" valor={cifra(l.sat * 100, 0)} unidad="%" />
      <Lectura etiqueta="Bomba" valor={cifra(l.bomba.ciclos, 1)} unidad="ciclos/s" title="Ciclos por segundo de una bomba (3 Na⁺ fuera, 2 K⁺ dentro, 1 ATP)" />
    </div>
  );

  const controlesExplorar = (
    <GrupoControles>
      <Deslizador etiqueta="NaCl" valor={medio.nacl} min={RANGO.nacl[0]} max={RANGO.nacl[1]} paso={5} unidad="mM" decimales={0} onChange={(v) => fijar({ nacl: v })} />
      <Deslizador etiqueta="Glucosa" valor={medio.glucosa} min={RANGO.glucosa[0]} max={RANGO.glucosa[1]} paso={1} unidad="mM" decimales={0} ancho="w-32" onChange={(v) => fijar({ glucosa: v })} />
      <Deslizador etiqueta="ATP dentro" valor={medio.atp} min={RANGO.atp[0]} max={RANGO.atp[1]} paso={0.1} unidad="mM" decimales={1} ancho="w-32" onChange={(v) => fijar({ atp: Math.round(v * 10) / 10 })} />
      <Segmentado<'pulmon' | 'tejido'> etiqueta="O₂ del plasma" valor={medio.pO2 === OXIGENO.pulmon ? 'pulmon' : 'tejido'}
        onChange={(v) => { fijar({ pO2: v === 'pulmon' ? OXIGENO.pulmon : OXIGENO.tejido }); audio?.playPop(); }}
        opciones={[{ valor: 'pulmon', texto: 'Pulmón' }, { valor: 'tejido', texto: 'Tejido' }]} />
      <Deslizador etiqueta="Temperatura" valor={medio.tC} min={RANGO.tC[0]} max={RANGO.tC[1]} paso={1} unidad="°C" decimales={0} ancho="w-32" onChange={(v) => fijar({ tC: v })} />
      <BotonLab variante="secundario" onClick={transferir} title="La célula vuelve a llegar desde un suero isotónico sin glucosa y desde sangre venosa"><RotateCcw size={14} /> Repetir transferencia</BotonLab>
    </GrupoControles>
  );

  const controlesReto = (
    <div className="flex flex-col gap-2">
      <GrupoControles>
        <Segmentado etiqueta="Tipo de célula"
          opciones={[{ valor: 'animal', texto: 'Eritrocito' }, { valor: 'vegetal', texto: 'Célula vegetal' }]} valor={tipoCelula}
          onChange={(t) => setTransporte({ tipoCelula: t, volumen: 100, lisada: false })} />
        <Deslizador etiqueta="NaCl en el medio" valor={concExt} min={0} max={0.4} paso={0.005} unidad="M" decimales={3} ancho="w-44" onChange={(v) => setTransporte({ concExt: v })} />
        <Deslizador etiqueta="Glucosa en el medio" valor={glucosaExt} min={0} max={0.4} paso={0.01} unidad="M" decimales={2} ancho="w-44" onChange={(v) => setTransporte({ glucosaExt: v })} />
        <Deslizador etiqueta="Temperatura" valor={temperatura} min={5} max={40} paso={1} unidad="°C" decimales={0} ancho="w-32" onChange={(v) => setTransporte({ temperatura: v })} />
      </GrupoControles>
      <GrupoControles>
        <BotonLab variante="secundario" onClick={anotar}><NotebookPen size={14} /> Anotar lectura</BotonLab>
        <BotonLab variante="secundario" onClick={nuevaMuestra}><RotateCcw size={14} /> Nueva incógnita</BotonLab>
        <BotonLab onClick={() => onValidate?.()}><CheckCircle2 size={14} /> Validar medio isotónico</BotonLab>
      </GrupoControles>
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={reto ? controlesReto : controlesExplorar}
      panelLateral={estrechoLab ? undefined : panelModelo}
      tituloPanel="Modelo"
      panelAbiertoInicial={false}
    />
  );
}
