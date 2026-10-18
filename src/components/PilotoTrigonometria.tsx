"use client";
/**
 * MAT-05 · El círculo trigonométrico.
 *
 * Dos modos sobre el mismo instrumento (aro de latón graduado + disco de vidrio + panel de
 * la onda):
 *  · CÍRCULO (estado inicial y reto): el punto ya gira y la onda se dibuja. Reto (semilla del
 *    store): resolver sen θ = v o cos θ = v en [0°, 360°). Hay DOS soluciones por vuelta; el
 *    alumno detiene el punto (o lo arrastra con la mano) en cada una y la captura. El
 *    validador (`validarM5`) y el store no cambian: exige las dos y ninguna captura que no
 *    cumpla la ecuación.
 *  · FOURIER: una cadena de epiciclos construye la onda cuadrada, triangular o en sierra.
 *
 * RELOJ ÚNICO (`simuladores/mat05/reloj.ts`): la escena lo avanza en su useFrame(−1); el dock
 * y las lecturas lo leen. El store guarda el ángulo ENTERO (lo que se captura): se escribe al
 * pausar, al soltar el arrastre, con el deslizador y, mientras gira, ~8 veces por segundo (la
 * bitácora lo muestra). NO REGALAR: la recta del reto y sus soluciones sólo tras validar.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Target, Zap, Pause, Play, RotateCcw, Tags, Scan, ChevronLeft, ChevronRight, Trash2 } from 'lucide-react';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import { solucionesM5, evaluarM5 } from '@/domain/matematicas';
import { RelojTrig, OMEGA_GRADOS, PERIODO_S, N_MAX, type ModoTrig } from './simuladores/mat05/reloj';
import { FORMAS, NOMBRE_FORMA, type Forma } from './simuladores/mat05/trigonometria';
import { DockTrig, altoDock, textoAngulo, useTickReloj } from './simuladores/mat05/Dock';
import type { RevelacionM5 } from './simuladores/mat05/Trigonometria3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Trigonometria3DScene = dynamic(() => import('./simuladores/mat05/Trigonometria3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#06090c]" />,
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

/** θ de la barra superior: el MISMO cuadro que la escena. */
function LecturaTheta({ reloj }: { reloj: React.MutableRefObject<RelojTrig> }) {
  useTickReloj(reloj, 15);
  const a = textoAngulo(reloj.current.theta);
  return <Lectura etiqueta="θ" valor={`${a.grados} = ${a.rad} rad`} title="Ángulo del punto en grados y en radianes" />;
}

export default function PilotoTrigonometria({ onValidate }: { onValidate?: () => void }) {
  const { trigonometria, setAnguloM5, setAnimandoM5, setTogglesM5, resetM5, limpiarHallazgosM5, registrarHallazgoM5, audio, setAsistente, pasoActual, setPasoActual } = useSimuladorStore(
    useShallow((s) => ({
      trigonometria: s.trigonometria, setAnguloM5: s.setAnguloM5, setAnimandoM5: s.setAnimandoM5, setTogglesM5: s.setTogglesM5,
      resetM5: s.resetM5, limpiarHallazgosM5: s.limpiarHallazgosM5, registrarHallazgoM5: s.registrarHallazgoM5,
      audio: s.audio, setAsistente: s.setAsistente, pasoActual: s.pasoActual, setPasoActual: s.setPasoActual,
    })),
  );
  const { angulo: anguloStore, animando, verSeno, verCoseno, status, hallazgos = [], objetivo } = trigonometria;
  const [verTangente, setVerTangente] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [modo, setModo] = useState<ModoTrig>('circulo');
  const [forma, setForma] = useState<Forma>('cuadrada');
  const [nArm, setNArm] = useState(5);

  const reloj = useRef<RelojTrig | null>(null);
  if (!reloj.current) reloj.current = new RelojTrig();
  const relojRef = reloj as React.MutableRefObject<RelojTrig>;

  useEffect(() => {
    setMounted(true);
    setCalidad(detectarCalidad());
    // segundo cero: el punto ya gira y se ven seno y coseno (con movimiento reducido, quieto)
    setTogglesM5(true, true);
    if (!prefiereReducirMovimiento()) setAnimandoM5(true);
    setAsistente({
      visible: true,
      text: "El seno es la altura del punto que gira y el coseno su abscisa. Encuentra los DOS ángulos que cumplen la ecuación del reto.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ── pasos del recorrido (los mismos criterios que antes) ──
  useEffect(() => {
    if (anguloStore !== 0 && pasoActual === 0) setPasoActual(1);
    if (hallazgos.length > 0 && pasoActual < 2) setPasoActual(2);
    if (status === 'success' && pasoActual < 3) setPasoActual(3);
  }, [anguloStore, hallazgos.length, status, pasoActual, setPasoActual]);

  // ── reloj ⇄ store ──
  useEffect(() => { relojRef.current.girando = animando; }, [animando, relojRef]);
  useEffect(() => {
    const r = relojRef.current;
    if (animando || r.arrastrando) return;
    if (r.theta !== anguloStore) r.fijar(anguloStore);
  }, [anguloStore, animando, relojRef]);
  useEffect(() => { relojRef.current.configurar({ modo, forma, n: nArm }); }, [modo, forma, nArm, relojRef]);
  // mientras gira, el ángulo ENTERO llega al store unas 8 veces por segundo (la bitácora lo lee)
  const ultimoEscrito = useRef(anguloStore);
  useEffect(() => {
    if (!animando) return;
    let id = 0, t0 = 0;
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const r = relojRef.current;
      if (r.arrastrando || ahora - t0 < 120) return;
      const g = Math.round(r.theta) % 360;
      if (g !== ultimoEscrito.current) { ultimoEscrito.current = g; t0 = ahora; setAnguloM5(g); }
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [animando, relojRef, setAnguloM5]);

  const pausar = useCallback(() => {
    const g = Math.round(relojRef.current.theta) % 360;
    relojRef.current.girando = false;
    relojRef.current.fijar(g);
    ultimoEscrito.current = g;
    setAnguloM5(g);
    setAnimandoM5(false);
  }, [relojRef, setAnguloM5, setAnimandoM5]);

  // arrastre con la mano: detiene el giro; el store recibe el ángulo entero al soltar
  const tArrastre = useRef(0);
  const onArrastre = useCallback((fase: 'inicio' | 'mueve' | 'fin', g: number) => {
    if (fase === 'inicio' && useSimuladorStore.getState().trigonometria.animando) setAnimandoM5(false);
    const ahora = performance.now();
    if (fase === 'fin' || ahora - tArrastre.current > 90) {
      tArrastre.current = ahora;
      const e = Math.round(g) % 360;
      ultimoEscrito.current = e;
      setAnguloM5(e);
    }
  }, [setAnguloM5, setAnimandoM5]);

  const fijarAngulo = (g: number) => {
    const e = ((Math.round(g) % 360) + 360) % 360;
    if (animando) setAnimandoM5(false);
    relojRef.current.girando = false;
    relojRef.current.fijar(e);
    ultimoEscrito.current = e;
    setAnguloM5(e);
  };

  // ── tamaño de la escena: la banda del dock se ajusta a él ──
  const raiz = useRef<HTMLDivElement>(null);
  const [caja, setCaja] = useState({ w: 720, h: 560 });
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setCaja({ w: Math.round(e.contentRect.width), h: Math.round(e.contentRect.height) }));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);
  const hDock = altoDock(caja.w, caja.h);

  // ── aviso de una sola vez (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoTrig>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'circulo'
        ? 'La altura del punto dibuja la onda. Arrástralo con la mano o pausa para medir.'
        : 'Cada círculo es un armónico; la punta de la cadena dibuja la suma.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const capturados = useMemo(() => hallazgos.map((h) => h.angulo), [hallazgos]);
  const revelado = useMemo<RevelacionM5 | null>(() => (status === 'success' && objetivo
    ? { funcion: objetivo.funcion, valor: objetivo.valor, soluciones: solucionesM5(objetivo) }
    : null), [status, objetivo]);
  const onToggle = useCallback((f: 'sen' | 'cos' | 'tan') => {
    const t = useSimuladorStore.getState().trigonometria;
    if (f === 'sen') setTogglesM5(!t.verSeno, t.verCoseno);
    else if (f === 'cos') setTogglesM5(t.verSeno, !t.verCoseno);
    else setVerTangente((v) => !v);
  }, [setTogglesM5]);

  if (!mounted) return null;
  const circulo = modo === 'circulo';
  const veredicto = status === 'error' ? evaluarM5(trigonometria) : null;

  const escena = (
    <div ref={raiz} className="absolute inset-0 flex flex-col bg-[#06090c]" data-modo-m5={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Trigonometria3DScene
          reloj={relojRef} verSeno={verSeno} verCoseno={verCoseno} verTangente={verTangente}
          capturados={capturados} revelado={revelado} calidad={calidad} reducido={reducido}
          rotulos={rotulos} encuadre={encuadre} onArrastre={onArrastre} onListo={onListo}
        />
        <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
        <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur" data-reloj-m5="">
          {animando ? `ω = ${OMEGA_GRADOS} °/s · 1 vuelta = ${PERIODO_S} s` : 'En pausa'}
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: vidrio con transmisión y posproceso)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-m5={calidad}>
          Calidad: {calidad}
        </button>
        {aviso && (
          <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-m5 max-w-[520px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-m5="">
              {aviso.texto}
            </span>
          </div>
        )}
        <style>{`.aviso-m5{animation:avisoM5 7s ease forwards}@keyframes avisoM5{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-m5{animation:none}}`}</style>
      </div>
      <DockTrig reloj={relojRef} modo={modo} verSeno={verSeno} verCoseno={verCoseno} verTangente={verTangente} onToggle={onToggle}
        capturados={capturados} revelado={revelado} alto={hDock} ancho={caja.w} />
    </div>
  );

  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <LecturaTheta reloj={relojRef} />
      {circulo
        ? <Lectura etiqueta="Reto" acento valor={objetivo ? `${objetivo.funcion} θ = ${objetivo.texto} en [0°, 360°)` : '—'} title="Captura las DOS soluciones de una vuelta" />
        : <Lectura etiqueta="Serie" acento valor={`${NOMBRE_FORMA[forma]} · ${nArm} armónico${nArm === 1 ? '' : 's'}`} />}
    </div>
  );

  const selectorModo = (
    <Segmentado<ModoTrig> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
      opciones={[{ valor: 'circulo', texto: 'Círculo' }, { valor: 'fourier', texto: 'Fourier' }]} />
  );
  const girar = (
    <BotonLab variante={animando ? 'acento' : 'primario'} onClick={() => { if (animando) pausar(); else setAnimandoM5(true); audio?.playPop(); }}>
      {animando ? <Pause size={14} /> : <Play size={14} />} {animando ? 'Pausa' : 'Girar'}
    </BotonLab>
  );
  const anguloEntero = Math.round(anguloStore) % 360;

  const controles = circulo ? (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        {selectorModo}
        <div className="flex min-w-[200px] flex-1 items-end gap-1">
          <div className="min-w-0 flex-1">
            <Deslizador etiqueta="Ángulo θ" valor={anguloEntero} min={0} max={359} paso={1} decimales={0} unidad="°" ancho="w-full" onChange={(v) => fijarAngulo(v)} />
          </div>
          <button type="button" aria-label="Restar un grado" title="−1°" onClick={() => { fijarAngulo(anguloEntero - 1); audio?.playPop(); }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-[#219EBC]"><ChevronLeft size={14} /></button>
          <button type="button" aria-label="Sumar un grado" title="+1°" onClick={() => { fijarAngulo(anguloEntero + 1); audio?.playPop(); }}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-white/5 text-slate-200 hover:border-[#219EBC]"><ChevronRight size={14} /></button>
        </div>
      </GrupoControles>
      <GrupoControles className="items-center">
        {girar}
        <BotonLab variante="primario" deshabilitado={animando} title={animando ? 'Detén el giro para capturar' : 'Capturar el ángulo actual'} onClick={() => { registrarHallazgoM5(); audio?.playPop(); }}>
          <Zap size={14} /> Capturar
        </BotonLab>
        <BotonLab variante="secundario" title="Vuelve el punto a 0° y borra las capturas (el reto no cambia)" onClick={() => { resetM5(); setTogglesM5(true, true); audio?.playPop(); }}>
          <RotateCcw size={14} />
        </BotonLab>
        <BotonLab variante={status === 'success' ? 'primario' : 'acento'} onClick={() => onValidate?.()}>
          <Target size={14} /> {status === 'success' ? 'Validada' : 'Validar fase'}
        </BotonLab>
        {hallazgos.length > 0 && (
          <div className="flex flex-wrap items-center gap-1" data-capturas-m5="">
            {hallazgos.map((h) => (
              <span key={h.id} className="rounded-md border border-amber-400/30 bg-amber-400/10 px-1.5 py-0.5 font-mono text-[11px] font-semibold text-amber-200">{h.angulo}°</span>
            ))}
            <button type="button" onClick={() => { limpiarHallazgosM5(); audio?.playPop(); }} title="Limpiar las capturas" aria-label="Limpiar las capturas"
              className="flex h-6 w-6 items-center justify-center rounded-md text-slate-400 hover:text-rose-300"><Trash2 size={13} /></button>
          </div>
        )}
        {veredicto?.mensaje && <span role="status" className="text-[12px] text-amber-200">{veredicto.mensaje}</span>}
      </GrupoControles>
    </div>
  ) : (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        {selectorModo}
        <Segmentado<Forma> etiqueta="Onda" valor={forma} onChange={(v) => { setForma(v); audio?.playPop(); }}
          opciones={FORMAS.map((f) => ({ valor: f, texto: f === 'sierra' ? 'Sierra' : NOMBRE_FORMA[f] }))} />
        <div className="min-w-[150px] flex-1">
          <Deslizador etiqueta="Armónicos N" valor={nArm} min={1} max={N_MAX} paso={1} decimales={0} ancho="w-full" onChange={(v) => setNArm(v)} />
        </div>
      </GrupoControles>
      <GrupoControles className="items-center">
        {girar}
        <div className="min-w-[160px] flex-1">
          <Deslizador etiqueta="Ángulo θ" valor={anguloEntero} min={0} max={359} paso={1} decimales={0} unidad="°" ancho="w-full" onChange={(v) => fijarAngulo(v)} />
        </div>
      </GrupoControles>
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
    />
  );
}
