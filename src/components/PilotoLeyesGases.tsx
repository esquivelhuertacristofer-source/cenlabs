"use client";
/**
 * QUI-02 · Leyes de los gases.
 *
 * Una cámara de cuarzo con pistón, a escala real, con el gas YA en movimiento: esferas
 * que chocan entre sí y con las paredes, a la velocidad de Maxwell–Boltzmann de la T del
 * termostato. La presión sale de CONTAR los impulsos de esos choques (dock), y PV = nRT
 * emerge; el manómetro marca la de la ley. Boyle, Charles y Gay-Lussac son caminos en
 * el diagrama P–V / P–T / V–T.
 *
 * El store no cambia: `updateGases` (T, V, n → P y la explosión por encima de 7 atm),
 * `setGasType`, `resetGases` y el validador `validarQ2` (|P − pTarget| < 0,1 atm). El
 * reto es llevar el manómetro a la presión objetivo sin reventar la cámara; la ley que
 * ajusta no se dibuja en el dock hasta que la práctica está validada.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { AlertTriangle, CheckCircle2, Pause, Play, RefreshCcw, Scan, Tags, Wind } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarQ2 } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from '@/components/simulador/LabLayout';
import { RelojGas, FACTORES, type Factor, type EstadoMacro } from './simuladores/qmi02/reloj';
import { GASES, esGas, colorTemperatura, presionLey, R_ATM, type IdGas } from './simuladores/qmi02/cinetica';
import { DockGas, cifra, useTickReloj, type RegistroGas } from './simuladores/qmi02/Dock';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Gas3DScene = dynamic(() => import('./simuladores/qmi02/Gas3DScene'), {
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

/** ×1/5000 */
const textoFactor = (f: number) => `×1/${cifra(1 / f, 0)}`;
/** Lo que dura en realidad 1 s de pantalla: 0,2 ms, 50 µs… */
const textoDuracion = (f: number) => (f >= 1e-3 ? `${cifra(f * 1000, 1)} ms` : f >= 1e-4 ? `${cifra(f * 1000, 2)} ms` : `${cifra(f * 1e6, 0)} µs`);

/** Degradado de la leyenda de color: el mismo de las esferas (40 K → 2500 K, escala log). */
const DEGRADADO = (() => {
  const paradas: string[] = [];
  const rgb: [number, number, number] = [0, 0, 0];
  for (let i = 0; i <= 8; i++) {
    const t = i / 8;
    colorTemperatura(40 * Math.pow(2500 / 40, t), rgb);
    paradas.push(`rgb(${Math.round(rgb[0] * 255)},${Math.round(rgb[1] * 255)},${Math.round(rgb[2] * 255)}) ${Math.round(t * 100)}%`);
  }
  return `linear-gradient(90deg, ${paradas.join(', ')})`;
})();

/** Pastilla de la escena (capas y vistas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Lecturas de la barra superior: las del MISMO cuadro que la escena. */
function LecturasVivas({ reloj, pTarget, T, V, n }: { reloj: React.MutableRefObject<RelojGas>; pTarget: number; T: number; V: number; n: number }) {
  useTickReloj(reloj, 15);
  const l = reloj.current.lectura;
  return (
    <>
      <Lectura etiqueta="P" valor={cifra(l.P, 2)} unidad="atm" acento title="Lo que marca el manómetro" />
      <Lectura etiqueta="Objetivo" valor={cifra(pTarget, 2)} unidad="atm" title="Presión que pide el reto (± 0,1 atm), sin pasar de 7 atm" />
      <Lectura etiqueta="T" valor={cifra(T, 0)} unidad="K" />
      <Lectura etiqueta="V" valor={cifra(V, 1)} unidad="L" />
      <Lectura etiqueta="n" valor={cifra(n, 3)} unidad="mol" />
    </>
  );
}

export default function PilotoLeyesGases({ isProfesor = false, onValidate }: { isWorktableDark?: boolean; isProfesor?: boolean; onValidate?: () => void }) {
  const { gases, updateGases, resetGases, setGasType, validarQ2Store, generarSemillaGases, registros, setBitacora } =
    useSimuladorStore(useShallow((s) => ({
      gases: s.gases, updateGases: s.updateGases, resetGases: s.resetGases, setGasType: s.setGasType, validarQ2Store: s.validarQ2,
      generarSemillaGases: s.generarSemillaGases,
      registros: (s.bitacoraData?.gases_logs as RegistroGas[] | undefined) ?? SIN_REGISTROS, setBitacora: s.setBitacora,
    })));
  const T = gases.T || 300;
  const V = gases.V || 10;
  const n = gases.n || 0.406;
  const P = gases.P || 1;
  const pTarget = gases.pTarget || 3.5;
  const explotado = !!gases.isExploded;
  const gas: IdGas = esGas(gases.gasType) ? gases.gasType : 'He';
  const validado = gases.status === 'success';

  // ── reloj único, ajustes ──
  const [factor, setFactor] = useState<Factor>(2e-4);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  const macro: EstadoMacro = { T, V, n, gas, explotado };
  const relojR = useRef<RelojGas | null>(null);
  if (!relojR.current) relojR.current = new RelojGas(macro);
  const reloj = useRef<RelojGas>(relojR.current);
  useEffect(() => { reloj.current.fijar({ T, V, n, gas, explotado }); }, [T, V, n, gas, explotado]);
  useEffect(() => { reloj.current.factor = factor; }, [factor]);
  useEffect(() => { reloj.current.pausa = pausa; }, [pausa]);
  useEffect(() => { reloj.current.reducido = reducido; }, [reducido]);

  // la explosión suena y vibra una vez
  useEffect(() => {
    if (!explotado) return;
    audio?.playError();
    if (typeof window !== 'undefined' && window.navigator.vibrate) window.navigator.vibrate([100, 50, 100]);
  }, [explotado]);

  // ── aviso que aparece una vez y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  const avisado = useRef(false);
  useEffect(() => {
    if (!listo || avisado.current) return;
    avisado.current = true;
    setAviso({ n: Date.now(), texto: 'El gas ya se mueve: cada choque empuja las paredes. Calienta, comprime o inyecta y mira la aguja.' });
  }, [listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // ── acciones ──
  const [intentado, setIntentado] = useState(false);
  const enObjetivo = validarQ2({ P, pTarget, isExploded: explotado } as Parameters<typeof validarQ2>[0]);
  useEffect(() => { setIntentado(false); }, [T, V, n]);
  const validar = () => {
    setIntentado(true);
    // un solo juez: el validador de la práctica (quiz + modal comunes)
    if (onValidate) { onValidate(); return; }
    if (validarQ2Store()) audio?.playSuccess(); else audio?.playError();
  };
  const reiniciar = () => {
    resetGases();
    const g = useSimuladorStore.getState().gases;
    reloj.current.reiniciar({ T: g.T, V: g.V, n: g.n, gas: esGas(g.gasType) ? g.gasType : 'He', explotado: false });
    setIntentado(false);
    audio?.playPop();
  };
  const inyectar = () => {
    if (explotado) return;
    updateGases(T, V, Math.min(2, Math.round((n + 0.05) * 1000) / 1000));
    audio?.playPop();
  };
  const registrar = () => {
    if (explotado) return;
    const l = reloj.current.lectura;
    const nuevo: RegistroGas = {
      id: typeof crypto !== 'undefined' && 'randomUUID' in crypto ? crypto.randomUUID() : `q2-${Date.now()}`,
      T, V, n, P, Pimp: l.Pimp == null ? null : Math.round(l.Pimp * 1000) / 1000,
      timestamp: new Date().toLocaleTimeString(),
    };
    setBitacora({ ...useSimuladorStore.getState().bitacoraData, gases_logs: [nuevo, ...registros].slice(0, 10) });
    audio?.playPop();
  };
  const borrar = () => { setBitacora({ ...useSimuladorStore.getState().bitacoraData, gases_logs: [] }); audio?.playPop(); };

  // en pantallas estrechas el dock se superpone a la escena por la derecha: el banco se encuadra en lo que queda libre
  const cajaEscena = useRef<HTMLDivElement>(null);
  const [tapado, setTapado] = useState(0);
  useEffect(() => {
    const el = cajaEscena.current;
    const lab = el?.closest('[data-lab-layout]');
    if (!el || !lab) return;
    const medir = () => {
      const dock = lab.querySelector<HTMLElement>('[data-franja=lateral]');
      const e = el.getBoundingClientRect();
      let f = 0;
      if (dock && getComputedStyle(dock).position === 'absolute' && e.width > 0) {
        const d = dock.getBoundingClientRect();
        f = Math.max(0, Math.min(1, (e.right - Math.max(e.left, d.left)) / e.width));
      }
      setTapado((a) => (Math.abs(a - f) > 0.01 ? f : a));
    };
    const ro = new ResizeObserver(medir);
    ro.observe(el);
    const mo = new MutationObserver(medir);
    mo.observe(lab, { childList: true, subtree: true });
    medir();
    return () => { ro.disconnect(); mo.disconnect(); };
  }, []);

  const escena = (
    <div ref={cajaEscena} className="relative h-full w-full overflow-hidden bg-[#06090c]" data-q2="" data-tapado={tapado.toFixed(2)}>
      <Gas3DScene
        reloj={reloj} gas={gas} temperatura={T} moles={n} explotado={explotado}
        calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} tapado={tapado} onListo={onListo}
      />
      {/* capas y vistas */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
        <Pildora activo={false} onClick={() => setEncuadre((k) => k + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
      </div>
      {/* cámara lenta rotulada con su factor real, y la escala de color de las esferas */}
      <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col items-start gap-1">
        <div className="flex items-center gap-1.5 rounded-md bg-[#0b1220]/75 px-2 py-1 text-[10px] font-semibold text-slate-300 backdrop-blur" data-leyenda-color=""
          title="Color de cada esfera: su energía ½mv² (la temperatura que tendría un gas de esas moléculas)">
          <span>frío</span>
          <i className="block h-1.5 w-20 rounded-full" style={{ background: DEGRADADO }} />
          <span>caliente</span>
        </div>
        <div className="rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur" data-camara-lenta="">
          {pausa ? 'En pausa' : `Cámara lenta ${textoFactor(factor)} · 1 s = ${textoDuracion(factor)}`}
        </div>
      </div>
      <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: cuarzo con transmisión y posproceso)"
        className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-q2={calidad}>
        Calidad: {calidad}
      </button>
      {/* aviso de una sola vez */}
      {aviso && !explotado && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
          <span className="aviso-q2 max-w-[560px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-q2="">
            {aviso.texto}
          </span>
        </div>
      )}
      {explotado && (
        <div className="pointer-events-none absolute inset-x-0 top-12 z-20 flex justify-center px-3">
          <div className="pointer-events-auto flex max-w-sm items-center gap-3 rounded-xl border border-red-400/40 bg-[#1a0d12]/90 px-3 py-2 shadow-2xl backdrop-blur" data-explosion="">
            <AlertTriangle className="h-5 w-5 shrink-0 text-red-400" />
            <p className="text-[12px] leading-snug text-slate-200"><b className="text-red-300">Falla de contención:</b> más de 7 atm y la tapa salió despedida.</p>
            <button type="button" onClick={reiniciar} className="flex shrink-0 items-center gap-1.5 rounded-lg bg-red-600 px-2.5 py-1 text-[12px] font-semibold text-white hover:bg-red-500">
              <RefreshCcw size={13} /> Reiniciar
            </button>
          </div>
        </div>
      )}
      <style>{`.aviso-q2{animation:avisoQ2 7s ease forwards}@keyframes avisoQ2{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-q2{animation:none}}`}</style>
    </div>
  );

  const info = GASES[gas];
  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{info.nombre} · {cifra(info.M, 2)} g/mol</span>
        <span className="text-[13px] font-bold text-white">PV = nRT</span>
      </div>
      <LecturasVivas reloj={reloj} pTarget={pTarget} T={T} V={V} n={n} />
    </div>
  );

  const mensaje = validado ? 'Presión certificada' : enObjetivo ? 'Presión en el objetivo: valida la práctica'
    : intentado && gases.status === 'error' ? (explotado ? 'La cámara colapsó: reiníciala.' : 'La presión aún no está a ± 0,1 atm del objetivo.') : null;

  const controles = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <Deslizador etiqueta="Termostato" valor={T} min={100} max={1000} paso={10} unidad="K" ancho="w-44" deshabilitado={explotado}
          onChange={(v) => updateGases(v, V, n)} />
        <Deslizador etiqueta="Volumen (volante)" valor={V} min={2} max={15} paso={0.1} unidad="L" ancho="w-44" deshabilitado={explotado}
          onChange={(v) => updateGases(T, v, n)} />
        <Segmentado<IdGas> etiqueta="Gas" valor={gas} onChange={(g) => { setGasType(g); audio?.playPop(); }}
          opciones={[{ valor: 'He', texto: 'He' }, { valor: 'Ne', texto: 'Ne' }, { valor: 'CO2', texto: 'CO₂' }]} />
        <BotonLab variante="secundario" title="Abrir la válvula: entran 0,05 mol de gas a 20 °C" onClick={inyectar} deshabilitado={explotado || n >= 2}>
          <Wind size={14} /> Inyectar 0,05 mol
        </BotonLab>
      </GrupoControles>
      <GrupoControles className="items-end">
        <Segmentado<string> etiqueta="Cámara lenta" valor={String(factor)} onChange={(v) => { setFactor(Number(v) as Factor); audio?.playPop(); }}
          opciones={FACTORES.map((f) => ({ valor: String(f), texto: textoFactor(f) }))} />
        <div className="flex gap-1.5">
          <BotonLab variante="secundario" title={pausa ? 'Reanudar las moléculas' : 'Congelar las moléculas'} onClick={() => setPausa((p) => !p)}>
            {pausa ? <Play size={14} /> : <Pause size={14} />}
          </BotonLab>
          <BotonLab variante="secundario" title="Cámara nueva: 300 K, 10 L, 0,406 mol de helio" onClick={reiniciar}>
            <RefreshCcw size={14} /> Reiniciar
          </BotonLab>
        </div>
        <BotonLab variante={validado ? 'primario' : 'acento'} onClick={validar}><CheckCircle2 size={14} /> Validar</BotonLab>
        {mensaje && (
          <span role="status" className={`flex items-center gap-1.5 text-[12px] ${validado || enObjetivo ? 'font-semibold text-emerald-300' : 'text-amber-200'}`} data-estado-q2="">
            <CheckCircle2 size={14} className="shrink-0" /> {mensaje}
          </span>
        )}
      </GrupoControles>
    </div>
  );

  const pieProfesor = isProfesor ? (
    <div className="flex flex-col gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.05] p-2.5 text-[12px] leading-relaxed text-slate-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Panel docente</span>
      <p>Objetivo <b className="text-white">{cifra(pTarget, 2)} atm</b>. Con {cifra(n, 3)} mol a {cifra(V, 1)} L hace falta T = {cifra((pTarget * V) / (n * R_ATM), 0)} K; a {cifra(T, 0)} K, V = {cifra((n * R_ATM * T) / pTarget, 2)} L.</p>
      <p className="text-[11px] text-slate-400">Ahora: P = {cifra(presionLey(n, T, V), 3)} atm.</p>
      <BotonLab variante="primario" onClick={generarSemillaGases}><RefreshCcw size={13} /> Nuevo objetivo</BotonLab>
    </div>
  ) : undefined;

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
      panelLateral={<DockGas reloj={reloj} pTarget={pTarget} validado={validado} registros={registros} onRegistrar={registrar} onBorrar={borrar} pie={pieProfesor} />}
      tituloPanel="Instrumentos"
    />
  );
}

const SIN_REGISTROS: RegistroGas[] = [];
