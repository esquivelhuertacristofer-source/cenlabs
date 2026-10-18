"use client";
/**
 * FIS-01 · Tiro parabólico.
 *
 * Dos modos sobre el mismo polígono y el MISMO tipo de reloj (fis01/reloj.ts):
 *  · BANCO (exploración, estado inicial): el cañón neumático dispara en bucle a 60° y 15 m/s,
 *    con aire. La estela estroboscópica, la sombra del suelo (x) y la de la pantalla (y), los
 *    vectores y el dock (y(x), x(t)/y(t), vx/vy) leen el mismo instante. θ, v₀ y el aire
 *    cambian la trayectoria al momento; el fantasma del vacío y el del ángulo complementario
 *    se comparan sobre la misma pista.
 *  · RETO: el flujo del store (`tiro1`): misión con torre, muro, diana y viento; cada disparo
 *    gasta munición y el juez es `simularDisparo` (el mismo RK4 que dibuja la escena). Nada
 *    del disparo se dibuja ni se cifra antes de lanzarlo; R, H y T, sólo cuando ya cayó.
 */
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { Pause, Play, Scan, Tags, BookOpen, X, Sun, MoveUpRight, Crosshair } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { ESCENARIOS, RANGO_ANGULO, RANGO_VELOCIDAD, PROYECTIL, type Escenario, type Mision1 } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, BotonLab } from './simulador/LabLayout';
import { RelojTiro, BANCO_INICIAL, ESPERA_BUCLE } from './simuladores/fis01/reloj';
import { DockTiro, useTickReloj } from './simuladores/fis01/Dock';
import { cifra, rotuloFactor } from './simuladores/fis01/formato';
import { K_AIRE } from './simuladores/fis01/balistica';
import { K as AGRANDADO } from './simuladores/fis01/piezas';
import type { Calidad, Capas } from './simuladores/fis01/TiroParabolico3DScene';

const TiroParabolico3DScene = dynamic(() => import('./simuladores/fis01/TiroParabolico3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#0b1220]" />,
});

type Modo = 'banco' | 'reto';
/** Rango del banco: con y₀ = 0 el disparo más largo (25 m/s a 45°) cae a ~60 m y cabe en la pista. */
const RANGO_V_BANCO = { min: 5, max: 25, paso: 0.5 };

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

/** Pastilla de la escena (capas). */
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
function Mando({ etiqueta, valor, min, max, paso, unidad, decimales, onChange, deshabilitado = false }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad: string; decimales: number; onChange: (v: number) => void; deshabilitado?: boolean;
}) {
  return (
    <label className={`flex h-8 items-center gap-2 ${deshabilitado ? 'opacity-50' : ''}`}>
      <span className={ETQ}>{etiqueta}</span>
      <input type="range" min={min} max={max} step={paso} value={valor} disabled={deshabilitado} onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${cifra(valor, decimales)} ${unidad}`} aria-label={etiqueta}
        className="h-1.5 w-[clamp(96px,14vw,180px)] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC] disabled:cursor-not-allowed" />
      <span className="w-[58px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-white">{cifra(valor, decimales)} {unidad}</span>
    </label>
  );
}

function Seg<T extends string>({ etiqueta, valor, opciones, onChange, deshabilitado = false }: { etiqueta?: string; valor: T; opciones: { valor: T; texto: string }[]; onChange: (v: T) => void; deshabilitado?: boolean }) {
  return (
    <div className={`flex h-8 items-center gap-2 ${deshabilitado ? 'opacity-50' : ''}`}>
      {etiqueta && <span className={ETQ}>{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor} disabled={deshabilitado}
            className={`h-7 rounded-md px-2.5 text-[11px] font-semibold ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Factor de tiempo y Δt del estroboscopio (al ritmo del reloj). */
function Tiempo({ reloj, pausa }: { reloj: RelojTiro; pausa: boolean }) {
  useTickReloj(reloj, 4);
  const hay = !!reloj.tiro && reloj.tiro.T > 0;
  if (!hay && reloj.modo === 'reto') return null;
  return (
    <span className="rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-tiempo-f01="">
      {pausa && reloj.modo === 'banco' ? 'En pausa' : hay ? rotuloFactor(reloj.factor) : '—'}
      {hay && <> · Δt {cifra(reloj.dtEstrobo, reloj.dtEstrobo < 0.1 ? 2 : 1)} s</>}
    </span>
  );
}

/** Ecuaciones y simplificaciones (desplegable cerrado). */
function Modelo({ onCerrar }: { onCerrar: () => void }) {
  const f = (s: string) => <span className="whitespace-nowrap font-mono text-[10.5px] text-slate-100">{s}</span>;
  return (
    <div className="pointer-events-auto absolute right-2 top-11 z-30 flex max-h-[calc(100%-3.25rem)] w-[min(calc(100%-1rem),600px)] flex-col rounded-xl border border-white/15 bg-[#0b1422]/95 shadow-2xl backdrop-blur" data-modelo-f01="">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 py-2 text-[11px] leading-snug text-slate-300 sm:grid sm:grid-cols-2 sm:gap-x-4">
        <div className="space-y-1.5">
          <p><b className="text-white">Sin aire.</b> {f('x = v₀ cos θ · t')}, {f('y = y₀ + v₀ sen θ · t − ½ g t²')}. Con y₀ = 0: {f('R = v₀² sen 2θ / g')} (igual para θ y 90° − θ), {f('H = v₀² sen² θ / 2g')}, {f('T = 2 v₀ sen θ / g')}. La energía {f('½v² + g y')} no cambia.</p>
          <p><b className="text-white">Con aire.</b> {f('a⃗ = g⃗ − k |v⃗ − w⃗| (v⃗ − w⃗)')}, {f('k = ρ C_d A / 2m')} = {cifra(K_AIRE, 5)} 1/m en la Tierra (balín de {PROYECTIL.masa} kg, Ø {cifra(PROYECTIL.diametro * 100, 0)} cm, C_d = {cifra(PROYECTIL.cd, 2)}), w = viento. RK4 con paso de 0,04 s; el choque y el suelo se resuelven dentro del paso. El ángulo de máximo alcance baja de 45°.</p>
        </div>
        <div className="mt-1.5 space-y-1.5 sm:mt-0">
          <p><b className="text-white">Estela y sombras.</b> Una imagen del balín cada Δt. La sombra del suelo es la de una luz vertical: sólo avanza, x(t). La de la pantalla, la de una luz horizontal: sólo sube y baja, y(t). Se dibujan como proyecciones exactas, no con el sol de la escena.</p>
          <p><b className="text-white">Simplificaciones.</b> Cañón, balín y dron dibujados ×{AGRANDADO} (la física usa el tamaño real). C_d constante, sin efecto Magnus ni giro; viento uniforme y horizontal; Tierra plana; Júpiter es un caso hipotético en el nivel de 1 bar. En el reto el vuelo se acelera o frena para durar lo que tarda el veredicto (rotulado).</p>
        </div>
      </div>
    </div>
  );
}

export default function PilotoTiroParabolico({ onValidate }: { onValidate?: () => void }) {
  const { tiro1, generarSemillaF1, ejecutarDisparoF1, setTiro1, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    tiro1: s.tiro1, generarSemillaF1: s.generarSemillaF1, ejecutarDisparoF1: s.ejecutarDisparoF1,
    setTiro1: s.setTiro1, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { angulo, velocidad, disparando, targetX, resultado, distanciaReal, yImpacto, y0, obsX, obsY, escenario, viento, municion, aciertos, ultimoDisparo } = tiro1;
  const esc = ESCENARIOS[escenario] ?? ESCENARIOS.tierra;

  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'Cada imagen de la estela está separada el mismo tiempo. Compara cómo avanzan las dos sombras; luego, en Reto, derriba el dron.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { if (disparando) audio?.playPop(); }, [disparando, audio]);
  useEffect(() => {
    if (resultado === 'exito') audio?.playSuccess();
    else if (resultado === 'colision' || resultado === 'fallo') audio?.playError();
  }, [resultado, audio]);

  // ── modo y banco ──
  const [modo, setModo] = useState<Modo>('banco');
  const [anguloB, setAnguloB] = useState(BANCO_INICIAL.angulo);
  const [velB, setVelB] = useState(BANCO_INICIAL.velocidad);
  const [aireB, setAireB] = useState(BANCO_INICIAL.aire);
  const banco = modo === 'banco';

  // ── escena ──
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [capas, setCapas] = useState<Capas>({ sombras: true, vectores: true, complementario: false, rotulos: false });
  const capa = (k: keyof Capas) => setCapas((c) => ({ ...c, [k]: !c[k] }));
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  const [modelo, setModelo] = useState(false);
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  // RELOJES (los avanza la escena): el banco dispara ya en bucle; el reto espera al store
  const relojBanco = useMemo(() => {
    const r = new RelojTiro('banco', BANCO_INICIAL);
    // movimiento reducido: el banco arranca en pausa con el disparo completo a la vista
    if (prefiereReducirMovimiento() && r.tiro) { r.t = r.tiro.T; r.fase = 'espera'; r.espera = ESPERA_BUCLE; }
    return r;
  }, []);
  const relojReto = useMemo(() => new RelojTiro('reto'), []);
  const reloj = banco ? relojBanco : relojReto;
  useEffect(() => { relojBanco.fijar({ angulo: anguloB, velocidad: velB, aire: aireB }); }, [relojBanco, anguloB, velB, aireB]);
  useEffect(() => { relojBanco.pausa = pausa; }, [relojBanco, pausa]);

  // reto: el reloj sigue al store (disparo lanzado → vuela; veredicto → cae; misión nueva → limpio)
  const mision = useMemo<Mision1>(() => ({ escenario, targetX, y0, obsX, obsY, viento }), [escenario, targetX, y0, obsX, obsY, viento]);
  useEffect(() => {
    const u = ultimoDisparo;
    if (!u) { relojReto.limpiar(mision); return; }
    const m: Mision1 = { escenario: u.escenario, targetX: u.targetX, y0: u.y0, obsX: u.obsX, obsY: u.obsY, viento: u.viento };
    const d = { angulo: u.angulo, velocidad: u.velocidad };
    if (disparando) relojReto.dispararReto(m, d, u.id);
    else if (relojReto.idDisparo === u.id) relojReto.terminar();
    else relojReto.restaurarReto(m, d, u.id);
  }, [relojReto, ultimoDisparo, disparando, mision]);

  // ── aviso de uso: una sola vez, se desvanece ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const [aviso, setAviso] = useState(false);
  useEffect(() => {
    if (!listo) return;
    let visto = false;
    try { visto = window.localStorage.getItem('fis01:aviso') === '1'; } catch { /* sin almacenamiento */ }
    if (visto) return;
    setAviso(true);
    try { window.localStorage.setItem('fis01:aviso', '1'); } catch { /* nada */ }
    const t = window.setTimeout(() => setAviso(false), 6500);
    return () => window.clearTimeout(t);
  }, [listo]);

  const cambiarEscenario = (e: Escenario) => {
    if (disparando || e === escenario) return;
    setTiro1({ escenario: e });
    generarSemillaF1();
    audio?.playPop();
  };

  const abatido = !banco && resultado === 'exito' && !disparando;
  const escena = (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#0b1220]" data-modo-f01={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <TiroParabolico3DScene reloj={reloj} modo={modo} angulo={banco ? anguloB : angulo} mision={banco ? null : mision} abatido={abatido}
          capas={capas} calidad={calidad} reducido={reducido} encuadre={encuadre} onListo={onListo} />
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-6.5rem)] flex-wrap items-center gap-1.5">
          <Pildora activo={capas.sombras} onClick={() => capa('sombras')} title="Sombras de proyección: suelo (x) y pantalla (y)"><Sun size={12} /> Sombras</Pildora>
          <Pildora activo={capas.vectores} onClick={() => capa('vectores')} title="Velocidad v y sus componentes vx, vy"><MoveUpRight size={12} /> Vectores</Pildora>
          {banco && <Pildora activo={capas.complementario} onClick={() => capa('complementario')} title="Fantasma del ángulo complementario 90° − θ">90° − θ</Pildora>}
          <Pildora activo={capas.rotulos} onClick={() => capa('rotulos')} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
        <button type="button" onClick={() => setModelo((v) => !v)} aria-expanded={modelo}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur ${modelo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
          <BookOpen size={12} /> Modelo
        </button>
        {modelo && <Modelo onCerrar={() => setModelo(false)} />}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          {banco && (
            <button type="button" onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausa'} aria-label={pausa ? 'Reanudar' : 'Pausa'}
              className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#0b1422]/75 text-slate-200 hover:text-white">
              {pausa ? <Play size={13} /> : <Pause size={13} />}
            </button>
          )}
          <Tiempo reloj={reloj} pausa={pausa} />
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso y sombras finas)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1422]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-f01={calidad}>
          Calidad: {calidad}
        </button>
        {aviso && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-f01 rounded-full border border-white/10 bg-[#0b1422]/85 px-3 py-1 text-[11.5px] text-slate-200 shadow-lg backdrop-blur" data-aviso-f01="">
              Arrastra para girar · pasa el ratón por una pieza
            </span>
          </div>
        )}
        <style>{`.aviso-f01{animation:avisoF01 6.5s ease forwards}@keyframes avisoF01{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-f01{animation:none}}`}</style>
      </div>
      <DockTiro reloj={reloj} complementario={banco && capas.complementario} />
    </div>
  );

  const selectorModo = (
    <div className="ml-auto shrink-0 pl-1">
      <Seg<Modo> valor={modo} onChange={(v) => { setModo(v); setEncuadre((n) => n + 1); audio?.playPop(); }}
        opciones={[{ valor: 'banco', texto: 'Banco' }, { valor: 'reto', texto: 'Reto' }]} />
    </div>
  );
  const optimo = relojBanco.optimo;
  const barraSuperior = (
    <div className="flex w-full flex-wrap items-center gap-1.5">
      {banco ? (
        <>
          <Lectura etiqueta="g" valor={cifra(ESCENARIOS.tierra.g, 2)} unidad="m/s²" title="Gravedad en la Tierra" />
          {optimo && <Lectura etiqueta="Máx. alcance" valor={`${cifra(optimo.angulo, 1)}°`} unidad={`${cifra(optimo.alcance, 1)} m`} title={aireB ? 'Ángulo de máximo alcance con aire a esta v₀ (sin aire sería 45°)' : 'Sin aire: 45°'} />}
        </>
      ) : (
        <>
          <Lectura etiqueta="Diana x" valor={cifra(targetX, 0)} unidad="m" acento />
          <Lectura etiqueta="Muro x" valor={cifra(obsX, 0)} unidad="m" />
          <Lectura etiqueta="Muro alto" valor={cifra(obsY, 0)} unidad="m" />
          <Lectura etiqueta="y₀" valor={cifra(y0, 0)} unidad="m" title="Altura de la boca del cañón" />
          <Lectura etiqueta="Viento" valor={cifra(viento, 1, true)} unidad="m/s" />
          <Lectura etiqueta="g" valor={cifra(esc.g, 2)} unidad="m/s²" />
        </>
      )}
      {selectorModo}
    </div>
  );

  const chipResultado = !banco && resultado && !disparando ? (
    <div role="status" className={`flex min-h-8 items-center rounded-lg border px-3 py-1 text-[12px] font-bold leading-tight ${
      resultado === 'exito' ? 'border-emerald-500/50 bg-emerald-500/15 text-emerald-300' : resultado === 'colision' ? 'border-orange-500/50 bg-orange-500/15 text-orange-300' : 'border-red-500/50 bg-red-500/15 text-red-300'}`}>
      {resultado === 'exito' ? `Dron abatido: cayó en x = ${cifra(distanciaReal, 1)} m` : resultado === 'colision' ? `Choque con el muro a y = ${cifra(yImpacto, 1)} m` : `Cayó en x = ${cifra(distanciaReal, 1)} m (diana en ${cifra(targetX, 0)} m)`}
    </div>
  ) : null;

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {banco ? (
          <>
            <Mando etiqueta="Ángulo θ" valor={anguloB} min={0} max={90} paso={1} unidad="°" decimales={0} onChange={setAnguloB} />
            <Mando etiqueta="Velocidad v₀" valor={velB} min={RANGO_V_BANCO.min} max={RANGO_V_BANCO.max} paso={RANGO_V_BANCO.paso} unidad="m/s" decimales={1} onChange={(v) => setVelB(Math.round(v * 2) / 2)} />
            <Seg<string> etiqueta="Aire" valor={aireB ? 'si' : 'no'} onChange={(v) => { setAireB(v === 'si'); audio?.playPop(); }}
              opciones={[{ valor: 'si', texto: 'Con aire' }, { valor: 'no', texto: 'Vacío' }]} />
          </>
        ) : (
          <>
            <Mando etiqueta="Ángulo θ" valor={angulo} min={RANGO_ANGULO.min} max={RANGO_ANGULO.max} paso={RANGO_ANGULO.paso} unidad="°" decimales={0}
              deshabilitado={disparando} onChange={(v) => setTiro1({ angulo: v })} />
            <Mando etiqueta="Velocidad v₀" valor={velocidad} min={RANGO_VELOCIDAD.min} max={RANGO_VELOCIDAD.max} paso={RANGO_VELOCIDAD.paso} unidad="m/s" decimales={0}
              deshabilitado={disparando} onChange={(v) => setTiro1({ velocidad: v })} />
            <BotonLab onClick={() => ejecutarDisparoF1()} deshabilitado={disparando || municion <= 0}><Crosshair size={14} /> Disparar ({municion})</BotonLab>
            <BotonLab variante="secundario" onClick={() => { generarSemillaF1(); audio?.playPop(); }} deshabilitado={disparando}>Nueva misión</BotonLab>
            <Seg<Escenario> deshabilitado={disparando}
              opciones={(Object.keys(ESCENARIOS) as Escenario[]).map((e) => ({ valor: e, texto: ESCENARIOS[e].nombre }))}
              valor={escenario} onChange={cambiarEscenario} />
          </>
        )}
      </div>
      {!banco && (chipResultado || (aciertos > 0 && !disparando)) && (
        <div className="flex flex-wrap items-center gap-2">
          {chipResultado}
          <AvisoReto visible={aciertos > 0 && !disparando} onValidate={onValidate} className="!px-3 !py-1.5"
            texto="Impacto confirmado. Ya puedes validar tu práctica (o seguir en otros mundos)." />
        </div>
      )}
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
