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
import { RefreshCcw, ShieldCheck, Pause, Play, Scan, Tags, Beaker, FlaskConical } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarQ9 } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from '@/components/simulador/LabLayout';
import { RelojCelda, montajeDaniell, FACTORES, type Factor } from './simuladores/qmi09/reloj';
import { METAL, T_REF, esMetal, duracion, type Carga, type IdMetal } from './simuladores/qmi09/electroquimica';
import { DockCelda, cifra, concentracion, potencia10, useTickReloj } from './simuladores/qmi09/Dock';
import type { ModoQ9 } from './simuladores/qmi09/Galvanic3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Galvanic3DScene = dynamic(() => import('./simuladores/qmi09/Galvanic3DScene'), {
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
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Concentración en escala logarítmica (1 mM … 1 M). */
function DeslizadorLog({ etiqueta, valor, onChange }: { etiqueta: React.ReactNode; valor: number; onChange: (c: number) => void }) {
  const l = Math.log10(valor);
  return (
    <label className="flex w-40 min-w-[128px] flex-col gap-1">
      <span className="flex justify-between text-[11px] font-semibold text-slate-300">
        <span>{etiqueta}</span>
        <span className="font-mono tabular-nums text-white">{concentracion(valor)}</span>
      </span>
      <input type="range" min={-3} max={0} step={0.1} value={l} onChange={(e) => onChange(Math.round(10 ** Number(e.target.value) * 1e4) / 1e4)}
        className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
    </label>
  );
}

/** Lecturas de la barra superior: las del MISMO cuadro que la escena. */
function LecturasVivas({ reloj, modo }: { reloj: React.MutableRefObject<RelojCelda>; modo: ModoQ9 }) {
  useTickReloj(reloj, 15);
  const l = reloj.current.lectura, e = reloj.current.estado;
  return (
    <>
      <Lectura etiqueta="V" valor={cifra(l.V, 3, true)} unidad="V" acento title="Lo que marca el voltímetro (punta + menos COM)" />
      <Lectura etiqueta="E" valor={cifra(l.fem, 3, true)} unidad="V" title="Fem de la celda (Nernst)" />
      <Lectura etiqueta="I" valor={cifra(Math.abs(l.I) * 1000, 2)} unidad="mA" />
      {modo === 'daniell' && <Lectura etiqueta="t" valor={duracion(e.t)} title="Tiempo simulado desde que se prepararon las disoluciones" />}
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
      <span className="flex items-center gap-2 rounded-lg border border-emerald-400/30 bg-[#06221a]/85 px-3 py-1.5 text-[12px] font-semibold text-emerald-200 shadow-lg backdrop-blur">
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
  const [factor, setFactor] = useState<Factor>(1e6);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
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
  const primeraC = useRef(true);
  useEffect(() => {
    if (primeraC.current) { primeraC.current = false; return; }
    relojD.current!.renovar(cZn, cCu);
  }, [cZn, cCu]);
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

  // ── reto ──
  const [seleccionado, setSeleccionado] = useState<IdMetal | null>(null);
  const [ansAnodo, setAnsAnodo] = useState('');
  const [ansCatodo, setAnsCatodo] = useState('');
  const [intentado, setIntentado] = useState(false);
  const validado = celda.status === 'success';
  const veredicto = validarQ9(celda);
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
  const carga = daniell ? cargaD : cargaR;
  const setCarga = (c: Carga) => { if (daniell) setCargaD(c); else setCargaR(c); audio?.playPop(); };

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#06090c]" data-modo-q9={modo}>
      <Galvanic3DScene
        reloj={reloj} modo={modo}
        izq={daniell ? 'Zn' : izqR} der={daniell ? 'Cu' : derR}
        puente={daniell ? true : celda.puenteSalino} cables={daniell ? true : celda.cablesConectados}
        carga={carga} seedMetales={celda.seedMetales} validado={validado}
        calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo}
      />
      {/* capas y vistas */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
        <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
      </div>
      {/* cámara rápida rotulada con su factor real */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur" data-camara-rapida="">
        {pausa ? 'En pausa' : `Cámara rápida ×${potencia10(factor)} · 1 s = ${duracion(factor)}`}
      </div>
      <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: vidrio con transmisión y posproceso)"
        className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-q9={calidad}>
        Calidad: {calidad}
      </button>
      {/* aviso de una sola vez */}
      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-12 flex justify-center px-4">
          <span className="aviso-q9 max-w-[560px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-q9="">
            {aviso.texto}
          </span>
        </div>
      )}
      <AvisoAgotada reloj={reloj} />
      <style>{`.aviso-q9{animation:avisoQ9 7s ease forwards}@keyframes avisoQ9{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-q9{animation:none}}`}</style>
    </div>
  );

  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{daniell ? 'Celda de Daniell' : 'Reto · 1 M · 25 °C'}</span>
        <span className="text-[13px] font-bold text-white">{daniell ? 'Zn | Zn²⁺ ‖ Cu²⁺ | Cu' : (izqR && derR ? `${izqR} ‖ ${derR}` : 'por montar')}</span>
      </div>
      <LecturasVivas reloj={reloj} modo={modo} />
    </div>
  );

  const controlesComunes = (
    <GrupoControles className="items-end">
      <Segmentado<ModoQ9> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
        opciones={[{ valor: 'daniell', texto: 'Celda de Daniell' }, { valor: 'reto', texto: 'Reto' }]} />
      <Segmentado<string> etiqueta="Carga" valor={aTexto(carga)} onChange={(v) => setCarga(deTexto(v))}
        opciones={CARGAS_OPC.map((o) => ({ valor: o.valor, texto: o.texto }))} />
      <Segmentado<string> etiqueta="Cámara rápida" valor={String(factor)} onChange={(v) => { setFactor(Number(v) as Factor); audio?.playPop(); }}
        opciones={FACTORES.map((f) => ({ valor: String(f), texto: `×${potencia10(f)}` }))} />
      <div className="flex gap-1.5">
        <BotonLab variante="secundario" title={pausa ? 'Reanudar' : 'Pausar'} onClick={() => setPausa((p) => !p)}>
          {pausa ? <Play size={14} /> : <Pause size={14} />}
        </BotonLab>
        <BotonLab variante="secundario" title="Disoluciones y electrodos nuevos" onClick={() => { reloj.current.renovar(); audio?.playPop(); }}>
          <RefreshCcw size={14} /> Renovar
        </BotonLab>
      </div>
    </GrupoControles>
  );

  const controlesDaniell = (
    <GrupoControles className="items-end">
      <DeslizadorLog etiqueta={<>[Zn²⁺]</>} valor={cZn} onChange={setCZn} />
      <DeslizadorLog etiqueta={<>[Cu²⁺]</>} valor={cCu} onChange={setCCu} />
      <Deslizador etiqueta="Temperatura" valor={tC} min={5} max={60} paso={1} unidad="°C" ancho="w-40" onChange={setTC} />
    </GrupoControles>
  );

  const controlesReto = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Electrodos</span>
          <div className="flex flex-wrap gap-1.5">
            {celda.seedMetales.filter(esMetal).map((m) => {
              const puesto = celda.vasoIzq === m ? 'izq.' : celda.vasoDer === m ? 'der.' : null;
              return (
                <button key={m} type="button" onClick={() => setSeleccionado(seleccionado === m ? null : m)} aria-pressed={seleccionado === m}
                  title={`${METAL[m].nombre} · E° = ${cifra(METAL[m].E0, 2, true)} V`}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2.5 text-[12px] font-bold transition-colors ${seleccionado === m ? 'border-cyan-400/70 bg-cyan-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:border-white/30'}`}>
                  <span className="h-3.5 w-3.5 rounded-sm border border-white/20" style={{ background: COLOR_METAL[m] }} />
                  {m}
                  {puesto && <span className="text-[10px] font-semibold text-slate-400">· vaso {puesto}</span>}
                </button>
              );
            })}
          </div>
        </div>
        {seleccionado && (
          <div className="flex flex-col gap-1">
            <span className="text-[11px] font-semibold text-slate-300">Colocar {seleccionado} en…</span>
            <div className="flex gap-1.5">
              <BotonLab variante="secundario" onClick={() => colocar('izq')}>Vaso izquierdo (COM)</BotonLab>
              <BotonLab variante="secundario" onClick={() => colocar('der')}>Vaso derecho (V)</BotonLab>
            </div>
          </div>
        )}
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Circuito</span>
          <div className="flex gap-1.5">
            <button type="button" onClick={() => { togglePuenteSalino(); audio?.playPop(); }} aria-pressed={celda.puenteSalino}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${celda.puenteSalino ? 'border-emerald-400/60 bg-emerald-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <FlaskConical size={13} /> {celda.puenteSalino ? 'Quitar puente' : 'Poner puente salino'}
            </button>
            <button type="button" onClick={() => { toggleCables(); audio?.playPop(); }} aria-pressed={celda.cablesConectados}
              className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${celda.cablesConectados ? 'border-blue-400/60 bg-blue-500/25 text-white' : 'border-white/10 bg-white/5 text-slate-300 hover:text-white'}`}>
              <Beaker size={13} /> {celda.cablesConectados ? 'Desconectar puntas' : 'Conectar puntas'}
            </button>
          </div>
        </div>
      </GrupoControles>
      <GrupoControles className="items-end">
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-rose-300">Ánodo (−)</span>
          <select value={ansAnodo} onChange={(e) => setAnsAnodo(e.target.value)} aria-label="Metal que actúa como ánodo"
            className="h-8 w-32 rounded-lg border border-white/15 bg-slate-950 px-2 text-[12px] font-semibold text-white outline-none focus:border-rose-400/60">
            <option value="">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <label className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-emerald-300">Cátodo (+)</span>
          <select value={ansCatodo} onChange={(e) => setAnsCatodo(e.target.value)} aria-label="Metal que actúa como cátodo"
            className="h-8 w-32 rounded-lg border border-white/15 bg-slate-950 px-2 text-[12px] font-semibold text-white outline-none focus:border-emerald-400/60">
            <option value="">Seleccionar…</option>
            {celda.seedMetales.map((m) => <option key={m} value={m}>{m}</option>)}
          </select>
        </label>
        <BotonLab variante={validado ? 'primario' : 'acento'} onClick={validar}><ShieldCheck size={14} /> Validar celda</BotonLab>
        <button type="button" aria-label="Desmontar la celda" title="Desmontar la celda"
          onClick={() => { resetP9(); setIntentado(false); setSeleccionado(null); setAnsAnodo(''); setAnsCatodo(''); audio?.playPop(); }}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RefreshCcw size={15} /></button>
        {(validado || (intentado && celda.status === 'error' && veredicto.mensaje)) && (
          <span role="status" className={`flex items-center gap-1.5 text-[12px] ${validado ? 'font-semibold text-emerald-300' : 'text-amber-200'}`}>
            <ShieldCheck size={14} className="shrink-0" /> {validado ? 'Celda armada e identificada' : veredicto.mensaje}
          </span>
        )}
      </GrupoControles>
    </div>
  );

  const controles = (
    <div className="space-y-2">
      {controlesComunes}
      {daniell ? controlesDaniell : controlesReto}
    </div>
  );

  const pieProfesor = isProfesor ? (
    <div className="flex flex-col gap-2 rounded-lg border border-cyan-400/20 bg-cyan-500/[0.05] p-2.5 text-[12px] leading-relaxed text-slate-300">
      <span className="text-[10px] font-bold uppercase tracking-wider text-cyan-300">Panel docente</span>
      <p>Estación del reto: <b className="text-white">{celda.seedMetales.join(' • ')}</b>.</p>
      <p>El voltímetro marca E(der) − E(izq): con el cátodo (mayor E°) en el vaso derecho la lectura es positiva.</p>
      <BotonLab variante="primario" onClick={generarSemillaP9}><RefreshCcw size={13} /> Reconfigurar estación</BotonLab>
    </div>
  ) : undefined;

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
      panelLateral={<DockCelda reloj={reloj} revela={daniell || validado} pie={pieProfesor} />}
      tituloPanel="Instrumentos"
    />
  );
}
