"use client";
/**
 * FIS-03 · Péndulo simple.
 *
 * Dos modos sobre el mismo banco, cada uno con su reloj (fis03/reloj.ts) que mueve a la vez
 * la escena, el dock y las cifras:
 *  · EXPLORAR (estado inicial): en la Tierra (g = 9,81 m/s², conocida) el péndulo de 1 m ya
 *    oscila soltado a 45°, con su estela y el péndulo LINEAL fantasma, que se adelanta un 4 %
 *    por periodo. El alumno cambia L, la amplitud (2°–90°) y el amortiguamiento; la fotopuerta
 *    mide T y el dock lo pone sobre la curva exacta 2K/π. Aquí no hay incógnita.
 *  · RETO (store `pendulo3`, juez `evaluarF3` sin cambios de criterio): gravedad del lugar
 *    desconocida; amplitud de 10° como siempre; el alumno cronometra n ≥ 10 oscilaciones,
 *    registra muestras con tres longitudes y dos masas y calcula g. T₀ y las rectas
 *    T² = 4π²L/g sólo aparecen tras validar.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Plus, Pause, Play, Square, Tags, Scan, BookOpen, X, Ghost, Sparkles, RotateCcw, Waves, Crosshair } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { evaluarF3, OSCILACIONES_MIN, G_TIERRA, TOL_RESULTADO_CRONO } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, BotonLab } from './simulador/LabLayout';
import { RelojPendulo, LENTOS, rotuloLento } from './simuladores/fis03/reloj';
import { GRAD, GAMMA_AMORTIGUADO, radioEsfera } from './simuladores/fis03/pendulo';
import { DockPendulo } from './simuladores/fis03/Dock';
import { cifra, leerDecimal } from './simuladores/fis03/formato';
import type { Calidad, VistaF3 } from './simuladores/fis03/PenduloSimple3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const PenduloSimple3DScene = dynamic(() => import('./simuladores/fis03/PenduloSimple3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#080b10]" />,
});

type Modo = 'explorar' | 'reto';

/** Amplitud del reto: la de siempre (10°): T real = 1,0019·T₀, dentro de la tolerancia del juez. */
const THETA_RETO = 10 * GRAD;
/** Masa de la esfera de explorar (kg). */
const MASA_EXPLORAR = 3;

/** Calidad media SÓLO en móvil, < 820 px o ≤ 2 núcleos (`?calidad=` la fuerza). */
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

/** Pastilla de la escena (capas, vistas, tiempo). */
function Pildora({ activo, onClick, children, title, ancho }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string; ancho?: boolean }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title} aria-label={title}
      className={`pointer-events-auto flex h-7 items-center justify-center gap-1.5 rounded-full border text-[11px] font-semibold backdrop-blur transition-colors ${ancho === false ? 'w-7' : 'px-2.5'} ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

const ETQ = 'shrink-0 text-[11px] font-semibold text-slate-400';

/** Deslizador en línea con la cifra en coma decimal. */
function Mando({ etiqueta, valor, min, max, paso, unidad, decimales, onChange, deshabilitado = false, titulo }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad: string; decimales: number; onChange: (v: number) => void; deshabilitado?: boolean; titulo?: string;
}) {
  return (
    <label className={`flex h-8 items-center gap-2 ${deshabilitado ? 'opacity-50' : ''}`} title={titulo}>
      <span className={ETQ}>{etiqueta}</span>
      <input type="range" min={min} max={max} step={paso} value={valor} disabled={deshabilitado} onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${cifra(valor, decimales)} ${unidad}`} aria-label={etiqueta}
        className="h-1.5 w-[clamp(84px,9vw,150px)] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC] disabled:cursor-not-allowed" />
      <span className="w-[50px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-white">{cifra(valor, decimales)} {unidad}</span>
    </label>
  );
}

/** Selector segmentado en línea. */
function Seg<T extends string>({ etiqueta, valor, opciones, onChange, deshabilitado = false }: { etiqueta?: string; valor: T; opciones: { valor: T; texto: string }[]; onChange: (v: T) => void; deshabilitado?: boolean }) {
  return (
    <div className={`flex h-8 items-center gap-2 ${deshabilitado ? 'opacity-50' : ''}`}>
      {etiqueta && <span className={ETQ}>{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button key={o.valor} type="button" disabled={deshabilitado} onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
            className={`h-7 min-w-[26px] rounded-md px-2 text-[11px] font-semibold disabled:cursor-not-allowed ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Ecuaciones y simplificaciones (desplegable cerrado). Dos columnas para que quepa a 1366×768. */
function Modelo({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="pointer-events-auto absolute right-2 top-11 z-30 flex max-h-[calc(100%-3.25rem)] w-[min(calc(100%-1rem),600px)] flex-col rounded-xl border border-white/15 bg-[#0b1422]/95 shadow-2xl backdrop-blur" data-modelo-f3="">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 py-2 text-[11px] leading-snug text-slate-300 sm:grid sm:grid-cols-2 sm:gap-x-4">
        <div className="space-y-1.5">
          <p><b className="text-white">Movimiento.</b> Ecuación completa θ″ = −(g/L)·sen θ − 2γ·θ′, integrada con Runge–Kutta 4 en pasos de ≤ 1 ms. La esfera, la estela, las gráficas y la fotopuerta leen el mismo estado.</p>
          <p><b className="text-white">Periodo exacto.</b> T = 4·√(L/g)·K(k), k = sen(θ₀/2), con la integral elíptica K por la media aritmético-geométrica: K = π/(2·AGM(1, √(1 − k²))). Serie: T ≈ T₀·(1 + θ₀²/16 + 11θ₀⁴/3072), T₀ = 2π·√(L/g).</p>
          <p><b className="text-white">Fantasma lineal.</b> La aproximación sen θ ≈ θ con su solución exacta θ₀·e^(−γt)·[cos ω_d t + (γ/ω_d)·sen ω_d t]: su periodo es T₀ a cualquier amplitud.</p>
        </div>
        <div className="mt-1.5 space-y-1.5 sm:mt-0">
          <p><b className="text-white">Fotopuerta.</b> T es el tiempo entre dos pasos por el haz en el mismo sentido, interpolado dentro del paso. La estela abarca medio periodo; sus destellos van a intervalos iguales de T/16.</p>
          <p><b className="text-white">Simplificaciones.</b> Masa puntual en el centro de la esfera (su momento de inercia alargaría T un 0,2 % como mucho); hilo sin masa ni estiramiento; pivote ideal en el canto de la mordaza. El amortiguamiento es viscoso, γ = {cifra(GAMMA_AMORTIGUADO, 3)} s⁻¹ (como un freno magnético): el aire real sobre la esfera lo haría miles de veces más lento. El haz infrarrojo se dibuja. El cronómetro mide el tiempo del modelo.</p>
          <p><b className="text-white">Reto.</b> Amplitud de 10°: el periodo real es 1,0019·T₀. Tolerancia de g: ±{cifra(TOL_RESULTADO_CRONO * 100, 0)} %. Latón: 8500 kg/m³.</p>
        </div>
      </div>
    </div>
  );
}

export default function PilotoPenduloSimple({ onValidate }: { onValidate?: () => void }) {
  const { p, setPendulo3, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    p: s.pendulo3, setPendulo3: s.setPendulo3, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { gSemilla, longitud, masa, oscilando, muestras, gAlumno, resultado } = p;

  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'El péndulo ya oscila en la Tierra: compara el real con el fantasma lineal y mira cómo cambia el periodo con la amplitud. En el reto, mide con el cronómetro la gravedad desconocida.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // ── modo, escena, tiempo ──
  const [modo, setModo] = useState<Modo>('explorar');
  const explorar = modo === 'explorar';
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [lento, setLento] = useState<number>(LENTOS[0]);
  const [rotulos, setRotulos] = useState(false);
  const [fantasma, setFantasma] = useState(true);
  const [estela, setEstela] = useState(true);
  const [encuadre, setEncuadre] = useState(0);
  const [vista, setVista] = useState<VistaF3>('conjunto');
  const [modelo, setModelo] = useState(false);

  // ── explorar ──
  const [Le, setLe] = useState(1);
  const [th0e, setTh0e] = useState(45);
  const [amort, setAmort] = useState(false);

  // ── relojes: uno por modo (cada uno conserva su estado al cambiar) ──
  const relojE = useMemo(() => {
    const r = new RelojPendulo({ L: 1, g: G_TIERRA, gamma: 0, theta0: 45 * GRAD, r: radioEsfera(MASA_EXPLORAR), suelto: true });
    // estado inicial vivo: con historia en las gráficas y el fantasma ya adelantado
    r.arrancar(r.ventana);
    return r;
  }, []);
  const relojR = useMemo(() => new RelojPendulo({ L: 1, g: 9.81, gamma: 0, theta0: THETA_RETO, r: radioEsfera(1), suelto: false }), []);
  const reloj = explorar ? relojE : relojR;
  useEffect(() => { relojE.fijar({ L: Le, theta0: th0e * GRAD, gamma: amort ? GAMMA_AMORTIGUADO : 0 }); }, [relojE, Le, th0e, amort]);
  useEffect(() => { relojR.fijar({ L: longitud, g: gSemilla, r: radioEsfera(masa), suelto: oscilando }); }, [relojR, longitud, gSemilla, masa, oscilando]);
  useEffect(() => { relojE.pausa = pausa; relojR.pausa = pausa; }, [relojE, relojR, pausa]);
  useEffect(() => { relojE.factor = lento; relojR.factor = lento; }, [relojE, relojR, lento]);

  // ── aviso de uso: una sola vez, se desvanece ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const [aviso, setAviso] = useState(false);
  useEffect(() => {
    if (!listo) return;
    let visto = false;
    try { visto = window.localStorage.getItem('fis03:aviso') === '1'; } catch { /* sin almacenamiento */ }
    if (visto) return;
    setAviso(true);
    try { window.localStorage.setItem('fis03:aviso', '1'); } catch { /* nada */ }
    const t = window.setTimeout(() => setAviso(false), 6500);
    return () => window.clearTimeout(t);
  }, [listo]);

  // ── reto (store) ──
  const [nTexto, setNTexto] = useState(String(OSCILACIONES_MIN));
  const [gTexto, setGTexto] = useState(gAlumno !== null ? cifra(gAlumno, 2).replace(/,?0+$/, '') : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF3> | null>(null);
  useEffect(() => { setVeredicto(null); }, [muestras, gAlumno]);
  const validado = !!veredicto?.ok || resultado === 'exito';

  const soltarReto = () => { setPendulo3({ oscilando: !oscilando }); audio?.playPop(); };
  const registrar = () => {
    const n = parseInt(nTexto, 10);
    const t = relojR.cronoLeer();
    if (relojR.crono.corriendo) return avisar('Detén el cronómetro antes de registrar.');
    if (!(t > 0)) return avisar('Mide un tiempo con el cronómetro antes de registrar.');
    if (!Number.isFinite(n) || n < 1) return avisar('Indica cuántas oscilaciones completas cronometraste.');
    if (n < OSCILACIONES_MIN) return avisar(`Cronometra al menos ${OSCILACIONES_MIN} oscilaciones: con una sola, tu tiempo de reacción domina el error.`);
    setPendulo3({ muestras: [...muestras, { L: longitud, m: masa, n, t: Math.round(t * 1000) / 1000 }], resultado: null });
    audio?.playPop();
    relojR.cronoReiniciar();
  };
  const borrar = (i: number) => setPendulo3({ muestras: muestras.filter((_, k) => k !== i), resultado: null });
  const guardarG = (texto: string) => {
    const limpio = texto.replace(/[^\d.,]/g, '');
    setGTexto(limpio);
    setPendulo3({ gAlumno: leerDecimal(limpio), resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF3(p);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  const L = explorar ? Le : longitud;
  const theta0 = explorar ? th0e * GRAD : THETA_RETO;
  const masaEscena = explorar ? MASA_EXPLORAR : masa;

  const escena = (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#080b10]" data-modo-f3={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <PenduloSimple3DScene reloj={reloj} L={L} masa={masaEscena} theta0={theta0} fantasma={fantasma} estela={estela}
          calidad={calidad} reducido={reducido} rotulos={rotulos} vista={vista} encuadre={encuadre} onListo={onListo} />
        {/* capas y vistas */}
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-6.5rem)] flex-wrap items-center gap-1.5">
          <Pildora activo={fantasma} onClick={() => setFantasma((v) => !v)} title="Péndulo lineal fantasma (sen θ ≈ θ)"><Ghost size={12} /> Fantasma</Pildora>
          <Pildora activo={estela} onClick={() => setEstela((v) => !v)} title="Estela y destellos a tiempos iguales"><Sparkles size={12} /> Estela</Pildora>
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /><span className="hidden min-[1440px]:inline">Rótulos</span></Pildora>
          <Pildora activo={vista === 'fotopuerta'} onClick={() => setVista((v) => (v === 'fotopuerta' ? 'conjunto' : 'fotopuerta'))} title="Primer plano de la esfera en la fotopuerta"><Crosshair size={12} /> Fotopuerta</Pildora>
          <Pildora ancho={false} activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
          {explorar && (
            <Pildora activo={false} onClick={() => { relojE.soltar(); relojE.avisar(); audio?.playPop(); }} title="Soltar de nuevo desde θ₀ (el fantasma también)"><RotateCcw size={12} /><span className="hidden min-[1440px]:inline">Soltar</span></Pildora>
          )}
        </div>
        <button type="button" onClick={() => setModelo((v) => !v)} aria-expanded={modelo}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur ${modelo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
          <BookOpen size={12} /> Modelo
        </button>
        {modelo && <Modelo onCerrar={() => setModelo(false)} />}
        {/* tiempo: pausa y cámara lenta con su factor real */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-1" role="toolbar" aria-label="Tiempo">
          <Pildora ancho={false} activo={pausa} onClick={() => setPausa((v) => !v)} title={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={13} /> : <Pause size={13} />}</Pildora>
          {LENTOS.map((v) => (
            <Pildora key={v} activo={lento === v} onClick={() => setLento(v)} title={v >= 0.999 ? 'Tiempo real' : `Cámara lenta ${rotuloLento(v)}`}>{rotuloLento(v)}</Pildora>
          ))}
          <span className="ml-0.5 rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-camara-lenta="">
            {pausa ? 'en pausa' : lento >= 0.999 ? 'tiempo real' : 'cámara lenta'}
          </span>
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso y sombras finas)"
          className="absolute bottom-2 right-2 rounded-full border border-white/10 bg-[#0b1422]/75 px-2.5 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-f3={calidad}>
          Calidad: {calidad}
        </button>
        {aviso && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-f3 rounded-full border border-white/10 bg-[#0b1422]/85 px-3 py-1 text-[11.5px] text-slate-200 shadow-lg backdrop-blur" data-aviso-f3="">
              Arrastra para girar · el azul es el péndulo lineal
            </span>
          </div>
        )}
        <style>{`.aviso-f3{animation:avisoF3 6.5s ease forwards}@keyframes avisoF3{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-f3{animation:none}}`}</style>
      </div>
      <DockPendulo reloj={reloj} modo={modo} fantasma={fantasma} validado={validado} gReal={validado ? gSemilla : null} gAlumno={gAlumno}
        muestras={muestras} onBorrar={borrar} onCrono={() => audio?.playPop()} />
    </div>
  );

  const selectorModo = (
    <div className="ml-auto shrink-0 pl-1">
      <Seg<Modo> valor={modo} onChange={(v) => { setModo(v); setVista(v === 'reto' ? 'fotopuerta' : 'conjunto'); audio?.playPop(); }}
        opciones={[{ valor: 'explorar', texto: 'Explorar' }, { valor: 'reto', texto: 'Reto' }]} />
    </div>
  );
  const barraSuperior = explorar ? (
    <>
      <Lectura etiqueta="g" valor={cifra(G_TIERRA, 2)} unidad="m/s²" title="Explorar: en la Tierra" />
      <Lectura etiqueta="L" valor={cifra(Le, 2)} unidad="m" />
      <Lectura etiqueta="θ₀" valor={`${cifra(th0e, 0)}°`} />
      {selectorModo}
    </>
  ) : (
    <>
      <Lectura etiqueta="g" valor={validado ? cifra(gSemilla, 2) : 'desconocida'} unidad={validado ? 'm/s²' : undefined} acento />
      {/* en el teléfono no cabe: el botón «Soltar a 10°» ya lo dice */}
      <span className="contents max-[479px]:hidden"><Lectura etiqueta="θ₀" valor="10°" /></span>
      <Lectura etiqueta="Muestras" valor={muestras.length} />
      {selectorModo}
    </>
  );

  const controles = explorar ? (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
      <Mando etiqueta="L" valor={Le} min={0.5} max={3} paso={0.05} unidad="m" decimales={2} onChange={(v) => setLe(Math.round(v * 100) / 100)} titulo="Longitud del pivote al centro de la esfera" />
      <Mando etiqueta="θ₀" valor={th0e} min={2} max={90} paso={1} unidad="°" decimales={0} onChange={(v) => setTh0e(Math.round(v))} titulo="Ángulo de suelta (amplitud)" />
      <BotonLab variante={amort ? 'acento' : 'secundario'} onClick={() => { setAmort((v) => !v); audio?.playPop(); }} title={`Amortiguamiento viscoso γ = ${cifra(GAMMA_AMORTIGUADO, 3)} s⁻¹`}>
        <Waves size={14} /> {amort ? 'Amortiguado' : 'Sin rozamiento'}
      </BotonLab>
    </div>
  ) : (
    <div className="flex flex-col gap-1.5">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        <Mando etiqueta="L" valor={longitud} min={0.5} max={3} paso={0.5} unidad="m" decimales={1} deshabilitado={oscilando} onChange={(v) => setPendulo3({ longitud: v })} titulo={oscilando ? 'Detén el péndulo para cambiar la longitud' : 'Longitud del pivote al centro de la esfera'} />
        <Seg<string> etiqueta="m (kg)" valor={String(masa)} deshabilitado={oscilando} onChange={(v) => setPendulo3({ masa: Number(v) })}
          opciones={[1, 2, 3, 4, 5].map((k) => ({ valor: String(k), texto: String(k) }))} />
        <BotonLab onClick={soltarReto} variante={oscilando ? 'acento' : 'primario'}>
          {oscilando ? <><Square fill="currentColor" size={13} /> Detener</> : <><Play fill="currentColor" size={13} /> Soltar a 10°</>}
        </BotonLab>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
        <label className="flex h-8 items-center gap-1.5">
          <span className={ETQ}>n</span>
          <input type="text" inputMode="numeric" autoComplete="off" value={nTexto} onChange={(e) => setNTexto(e.target.value.replace(/\D/g, ''))}
            aria-label="Oscilaciones completas cronometradas"
            className="h-8 w-[52px] rounded-lg border border-white/15 bg-slate-950 px-2 font-mono text-[13px] text-white outline-none focus:border-[#219EBC]" />
        </label>
        <BotonLab onClick={registrar} title="Registra la muestra con el tiempo del cronómetro"><Plus size={14} /> Registrar</BotonLab>
        <label className="flex h-8 items-center gap-1.5">
          <span className="shrink-0 text-[11px] font-semibold text-amber-300">g</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={gTexto} onChange={(e) => guardarG(e.target.value)} placeholder="0,00"
            aria-label="Tu g calculada, en metros por segundo al cuadrado"
            className="h-8 w-[70px] rounded-lg border border-amber-500/40 bg-slate-950 px-2 font-mono text-[13px] text-white outline-none focus:border-amber-400" />
          <span className="text-[11px] text-slate-400">m/s²</span>
        </label>
        <BotonLab variante="acento" onClick={comprobar}>Comprobar</BotonLab>
      </div>
      {(alerta || veredicto?.ok || validado) && (
        <div className="flex flex-wrap items-center gap-2">
          {alerta && (
            <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
              <ShieldAlert size={14} /> {alerta}
            </div>
          )}
          {validado && !alerta && (
            <span className="text-[12px] font-semibold text-emerald-300" data-g-real="">g del lugar: {cifra(gSemilla, 2)} m/s²</span>
          )}
          <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tus muestras y tu g son coherentes. Valida tu práctica." />
        </div>
      )}
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
