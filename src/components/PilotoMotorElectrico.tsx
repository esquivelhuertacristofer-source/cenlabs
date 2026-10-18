"use client";
/**
 * FIS-10 · Motor eléctrico simple (motor de CD de imanes permanentes).
 *
 * Dos modos sobre el mismo banco y el MISMO reloj (fis10/reloj.ts):
 *  · BANCO (exploración, estado inicial): el motor ya gira en régimen con N–S, 50 espiras,
 *    6 V y el freno a 0,004 N·m. El alumno cambia imanes, espiras, fuente y freno y ve a la
 *    vez el corte con el campo y las fuerzas, τ(θ), ω(t), la corriente y el rendimiento.
 *    Los pares del freno del banco (0,004 · 0,025 · 0,040 N·m) quedan FUERA del rango de los
 *    retos (0,005–0,020): explorar no da la respuesta del reto.
 *  · RETO: el flujo de siempre sobre el store (`motor10`): cualquier ajuste desenergiza, hay
 *    que escribir la predicción para energizar, cada arranque es un ensayo y el veredicto es
 *    `evaluarF10` (el mismo juez que valida la práctica). El aviso sale cuando el tacómetro
 *    ya midió la velocidad (el motor real tarda en llegar).
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { Power, ShieldAlert, Pause, Play, Scan, Tags, Magnet, BookOpen, X } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { MOTOR, ESPIRAS10, RANGO_V10, estadoMotor, evaluarF10, type Polo } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, BotonLab } from './simulador/LabLayout';
import { RelojMotor, rotuloFactor } from './simuladores/fis10/reloj';
import { DockMotor, useTickReloj } from './simuladores/fis10/Dock';
import { cifra, leerDecimal } from './simuladores/fis10/formato';
import { J_ROTOR, REMANENCIA, G_EXTREMOS } from './simuladores/fis10/motor';
import type { Vista, Calidad } from './simuladores/fis10/MotorElectrico3DScene';

const MotorElectrico3DScene = dynamic(() => import('./simuladores/fis10/MotorElectrico3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#070a0e]" />,
});

type Modo = 'banco' | 'reto';

/** Pares del freno del banco: fuera del rango de los retos. */
const FRENOS_BANCO = [0.004, 0.025, 0.04] as const;

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

const ETQ = 'shrink-0 text-[11px] font-semibold text-slate-400';

/** Deslizador en línea con la cifra en coma decimal (el nativo del kit escribe punto). */
function Mando({ etiqueta, valor, min, max, paso, unidad, decimales, onChange }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; unidad: string; decimales: number; onChange: (v: number) => void;
}) {
  return (
    <label className="flex h-8 items-center gap-2">
      <span className={ETQ}>{etiqueta}</span>
      <input type="range" min={min} max={max} step={paso} value={valor} onChange={(e) => onChange(Number(e.target.value))}
        aria-valuetext={`${cifra(valor, decimales)} ${unidad}`} aria-label={etiqueta}
        className="h-1.5 w-[clamp(96px,14vw,170px)] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
      <span className="w-[46px] shrink-0 text-right font-mono text-[12px] font-semibold tabular-nums text-white">{cifra(valor, decimales)} {unidad}</span>
    </label>
  );
}

/** Selector segmentado en línea (etiqueta a la izquierda): las dos filas de mandos caben a 1366 × 768. */
function Seg<T extends string>({ etiqueta, valor, opciones, onChange }: { etiqueta?: string; valor: T; opciones: { valor: T; texto: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex h-8 items-center gap-2">
      {etiqueta && <span className={ETQ}>{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label={etiqueta}>
        {opciones.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
            className={`h-7 rounded-md px-2.5 text-[11px] font-semibold ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

/** Par de imanes: polo de cada uno hacia el inducido. */
function Imanes({ izq, der, onChange }: { izq: Polo; der: Polo; onChange: (i: Polo, d: Polo) => void }) {
  const boton = (lado: 'izq' | 'der', p: Polo) => {
    const activo = (lado === 'izq' ? izq : der) === p;
    const color = p === 'N' ? 'bg-[#c0585c]' : 'bg-[#4d7bc0]';
    return (
      <button key={lado + p} type="button" aria-pressed={activo} title={`Imán ${lado === 'izq' ? 'izquierdo' : 'derecho'}: polo ${p} hacia el inducido`}
        onClick={() => onChange(lado === 'izq' ? p : izq, lado === 'der' ? p : der)}
        className={`h-7 w-7 rounded-md text-[11px] font-bold ${activo ? `${color} text-white` : 'text-slate-300 hover:text-white'}`}>
        {p}
      </button>
    );
  };
  return (
    <div className="flex h-8 items-center gap-2" role="group" aria-label="Imanes: polo hacia el inducido (izquierdo, derecho)">
      <span className={ETQ}>Imanes</span>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">{(['N', 'S'] as Polo[]).map((p) => boton('izq', p))}</div>
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5">{(['N', 'S'] as Polo[]).map((p) => boton('der', p))}</div>
    </div>
  );
}

/** Etiqueta de la cámara lenta con su factor real (DOM directo, al ritmo del reloj). */
function FactorLento({ reloj, pausa }: { reloj: RelojMotor; pausa: boolean }) {
  useTickReloj(reloj, 4);
  return (
    <span className="rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-camara-lenta="">
      {pausa ? 'En pausa' : reloj.factor >= 1 ? '×1 · tiempo real' : `${rotuloFactor(reloj.factor)} · cámara lenta`}
    </span>
  );
}

/** Ecuaciones y simplificaciones (desplegable cerrado). Dos columnas para que a 1366×768 quepa sin desplazarse. */
function Modelo({ onCerrar }: { onCerrar: () => void }) {
  return (
    <div className="pointer-events-auto absolute right-2 top-11 z-30 flex max-h-[calc(100%-3.25rem)] w-[min(calc(100%-1rem),580px)] flex-col rounded-xl border border-white/15 bg-[#0b1422]/95 shadow-2xl backdrop-blur" data-modelo-f10="">
      <div className="flex shrink-0 items-center justify-between border-b border-white/10 px-3 py-1.5">
        <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
        <button type="button" onClick={onCerrar} aria-label="Cerrar" className="rounded p-1 text-slate-400 hover:bg-white/10 hover:text-white"><X size={14} /></button>
      </div>
      <div className="min-h-0 overflow-y-auto px-3 py-2 text-[11px] leading-snug text-slate-300 sm:grid sm:grid-cols-2 sm:gap-x-4">
        <div className="space-y-1.5">
          <p><b className="text-white">Campo.</b> Imanes en arco de 100° imantados en radial, entre un inducido y un yugo de hierro ideal: ∇²A = −μ₀∇×M resuelto en serie de Fourier. B medio bajo la bobina = 0,5 T (remanencia {cifra(REMANENCIA, 2)} T). Las líneas son curvas A = cte: entre dos vecinas pasa el mismo flujo; los cometas marcan el sentido de B (nada fluye).</p>
          <p><b className="text-white">Par.</b> Cada lado sufre F = N·I·L·B<sub>r</sub>, tangente al inducido: τ = k·I·G(θ), k = N·B·A. Dos bobinas a 90° y 4 delgas: el conmutador alimenta la que está bajo los imanes y G va de {cifra(G_EXTREMOS.min, 2)} a {cifra(G_EXTREMOS.max, 2)} (media 1). Una bobina sola, sin conmutador, da media 0. Con campo uniforme sería τ = N·I·A·B·sen φ.</p>
        </div>
        <div className="mt-1.5 space-y-1.5 sm:mt-0">
          <p><b className="text-white">Movimiento.</b> J·dω/dt = τ(θ) − τ<sub>freno</sub>, J = {cifra(J_ROTOR * 1e4, 1)}·10⁻⁴ kg·m²; el freno es rozamiento seco (si el par no lo vence, no arranca). I = (V − E)/R, E = k·ω, R = N·0,02 Ω. En régimen: I = τ<sub>freno</sub>/k y V = k·ω + I·R.</p>
          <p><b className="text-white">Potencia.</b> V·I = I²R + E·I; η = E·I/(V·I) = E/V es lo que pasa al rotor, y en régimen lo absorbe el freno.</p>
          <p><b className="text-white">Simplificaciones.</b> Hierro sin saturación ni pérdidas; ranuras y reacción del inducido fuera del campo; corriente alisada; conmutación instantánea; escobillas sin caída; fuente ideal. Flechas ∝ √F. El giro se mira de frente, desde el corte.</p>
        </div>
      </div>
    </div>
  );
}

export default function PilotoMotorElectrico({ onValidate }: { onValidate?: () => void }) {
  const { m, setMotor10, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    m: s.motor10, setMotor10: s.setMotor10, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { imanIzq, imanDer, voltaje, espiras, carga, encendido, reto, vPrediccion, ensayo } = m;

  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'El motor ya gira en el banco. Observa el campo, las fuerzas sobre la bobina y cómo el conmutador mantiene el par; luego resuelve el reto prediciendo el voltaje.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // ── modo y banco ──
  const [modo, setModo] = useState<Modo>('banco');
  const [izqB, setIzqB] = useState<Polo>('N');
  const [derB, setDerB] = useState<Polo>('S');
  const [NB, setNB] = useState(50);
  const [VB, setVB] = useState(6);
  const [frenoB, setFrenoB] = useState<number>(FRENOS_BANCO[0]);
  const [encB, setEncB] = useState(true);

  // ── escena ──
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [campo, setCampo] = useState(true);
  const [vista, setVista] = useState<Vista>('34');
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  const [modelo, setModelo] = useState(false);
  useEffect(() => { setCalidad(detectarCalidad()); }, []);

  const banco = modo === 'banco';
  const params = banco
    ? { V: VB, N: NB, izq: izqB, der: derB, carga: frenoB, energizado: encB }
    : { V: voltaje, N: espiras, izq: imanIzq, der: imanDer, carga, energizado: encendido };

  // RELOJ ÚNICO (lo avanza la escena); arranca ya en régimen
  const reloj = useMemo(() => {
    const r = new RelojMotor({ V: 6, N: 50, izq: 'N', der: 'S', carga: FRENOS_BANCO[0], energizado: true });
    r.arrancarEnRegimen();
    return r;
  }, []);
  useEffect(() => { reloj.fijar(params); }, [reloj, params.V, params.N, params.izq, params.der, params.carga, params.energizado]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { reloj.pausa = pausa; }, [reloj, pausa]);

  // ── aviso de uso: una sola vez, se desvanece ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const [aviso, setAviso] = useState(false);
  useEffect(() => {
    if (!listo) return;
    let visto = false;
    try { visto = window.localStorage.getItem('fis10:aviso') === '1'; } catch { /* sin almacenamiento */ }
    if (visto) return;
    setAviso(true);
    try { window.localStorage.setItem('fis10:aviso', '1'); } catch { /* nada */ }
    const t = window.setTimeout(() => setAviso(false), 6500);
    return () => window.clearTimeout(t);
  }, [listo]);

  // ── reto (store) ──
  const [vTexto, setVTexto] = useState(vPrediccion !== null ? cifra(vPrediccion, 2).replace(/,?0+$/, '') : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };
  // cualquier cambio de configuración desenergiza: cada arranque es un ensayo
  const ajustar = (data: Partial<typeof m>) => setMotor10({ ...data, encendido: false, resultado: null });
  const est = useMemo(() => estadoMotor({ voltaje, espiras, imanIzq, imanDer, carga }), [voltaje, espiras, imanIzq, imanDer, carga]);
  const guardarV = (texto: string) => {
    setVTexto(texto);
    setMotor10({ vPrediccion: leerDecimal(texto), resultado: null });
  };
  const tEnergizado = useRef(0);
  const energizar = () => {
    if (encendido) { setMotor10({ encendido: false }); audio?.playPop(); return; }
    if (vPrediccion === null) { audio?.playError(); return avisar('Escribe primero el voltaje que predices para el reto.'); }
    setMotor10({ encendido: true, ensayo: { voltaje, espiras, imanIzq, imanDer, carga, vPrediccion }, resultado: null });
    tEnergizado.current = performance.now();
    if (est.sinCampo) avisar('Con dos polos iguales enfrentados no hay campo que atraviese la bobina: el rotor no gira.');
    else if (!est.arranca) avisar('El rotor no arranca: el par motor no vence al del freno con este voltaje.');
    audio?.playPop();
  };
  const veredicto = useMemo(() => (ensayo ? evaluarF10({ reto, ensayo }) : null), [ensayo, reto]);
  // el veredicto se enseña cuando el tacómetro ya midió (o a los 5 s si no gira)
  useTickReloj(reloj, 5);
  const nTacho = reloj.lectura().nTacho;
  const medido = !banco && encendido && !!ensayo && (
    (est.arranca && Math.abs(nTacho - est.rpm) <= 0.01 * Math.abs(est.rpm))
    || performance.now() - tEnergizado.current > (est.arranca ? 9000 : 2500));

  const escena = (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#070a0e]" data-modo-f10={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <MotorElectrico3DScene reloj={reloj} izq={params.izq} der={params.der} N={params.N} V={params.V} energizado={params.energizado}
          carga={params.carga} calidad={calidad} reducido={reducido} rotulos={rotulos} campo={campo} vista={vista} encuadre={encuadre} onListo={onListo} />
        {/* capas y vistas */}
        <div className="pointer-events-none absolute left-2 top-2 flex max-w-[calc(100%-6rem)] flex-wrap items-center gap-1.5">
          <Pildora activo={campo} onClick={() => setCampo((v) => !v)} title="Líneas de campo B"><Magnet size={12} /> Campo</Pildora>
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          {([['34', '3/4'], ['corte', 'Corte'], ['colector', 'Conmutador']] as [Vista, string][]).map(([v, t]) => (
            <Pildora key={v} activo={vista === v} onClick={() => { setVista(v); setEncuadre((n) => n + 1); }} title={`Vista: ${t}`}>{t}</Pildora>
          ))}
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre de la vista"><Scan size={12} /></Pildora>
        </div>
        <button type="button" onClick={() => setModelo((v) => !v)} aria-expanded={modelo}
          className={`absolute right-2 top-2 flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur ${modelo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-300 hover:text-white'}`}>
          <BookOpen size={12} /> Modelo
        </button>
        {modelo && <Modelo onCerrar={() => setModelo(false)} />}
        {/* tiempo: pausa y cámara lenta con su factor real */}
        <div className="absolute bottom-2 left-2 flex items-center gap-1.5">
          <button type="button" onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausa'} aria-label={pausa ? 'Reanudar' : 'Pausa'}
            className="flex h-7 w-7 items-center justify-center rounded-md border border-white/10 bg-[#0b1422]/75 text-slate-200 hover:text-white">
            {pausa ? <Play size={13} /> : <Pause size={13} />}
          </button>
          <FactorLento reloj={reloj} pausa={pausa} />
        </div>
        <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso y sombras finas)"
          className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1422]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-f10={calidad}>
          Calidad: {calidad}
        </button>
        {aviso && (
          <div className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
            <span className="aviso-f10 rounded-full border border-white/10 bg-[#0b1422]/85 px-3 py-1 text-[11.5px] text-slate-200 shadow-lg backdrop-blur" data-aviso-f10="">
              Arrastra para girar · pasa el ratón por una pieza
            </span>
          </div>
        )}
        <style>{`.aviso-f10{animation:avisoF10 6.5s ease forwards}@keyframes avisoF10{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-f10{animation:none}}`}</style>
      </div>
      <DockMotor reloj={reloj} objetivo={banco ? null : (reto.sentido === 'horario' ? 1 : -1) * reto.rpmObjetivo} />
    </div>
  );

  const selectorModo = (
    <div className="ml-auto shrink-0 pl-1">
      <Seg<Modo> valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
        opciones={[{ valor: 'banco', texto: 'Banco' }, { valor: 'reto', texto: 'Reto' }]} />
    </div>
  );
  // los datos del motor (B, A, R por espira) están siempre en la bitácora; aquí, en el banco
  const barraSuperior = banco ? (
    <>
      <Lectura etiqueta="B" valor={cifra(MOTOR.B, 1)} unidad="T" title="Inducción media bajo la bobina" />
      <Lectura etiqueta="A" valor={cifra(MOTOR.A * 1e4, 0)} unidad="cm²" title="Área de la espira (2·r·L)" />
      <Lectura etiqueta="R" valor={cifra(MOTOR.rEspira, 2)} unidad="Ω/espira" title="Resistencia del bobinado por espira" />
      {selectorModo}
    </>
  ) : (
    <>
      <Lectura etiqueta="Reto" valor={cifra(reto.rpmObjetivo, 0)} unidad="rpm" acento />
      <Lectura etiqueta="Giro" valor={reto.sentido} acento />
      <Lectura etiqueta="Freno" valor={cifra(reto.carga, 3)} unidad="N·m" acento />
      {selectorModo}
    </>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5">
        {banco ? (
          <>
            <Imanes izq={izqB} der={derB} onChange={(i, d) => { setIzqB(i); setDerB(d); audio?.playPop(); }} />
            <Seg<string> etiqueta="Espiras" valor={String(NB)} onChange={(n) => setNB(Number(n))} opciones={ESPIRAS10.map((n) => ({ valor: String(n), texto: String(n) }))} />
            <BotonLab onClick={() => { setEncB((e) => !e); audio?.playPop(); }} variante={encB ? 'acento' : 'primario'} title={encB ? 'Abrir el circuito' : 'Cerrar el circuito'}><Power size={14} /> {encB ? 'Cortar' : 'Energizar'}</BotonLab>
            <Mando etiqueta="Fuente" valor={VB} min={RANGO_V10.min} max={RANGO_V10.max} paso={RANGO_V10.paso} unidad="V" decimales={1} onChange={(v) => setVB(Math.round(v * 10) / 10)} />
            <Seg<string> etiqueta="Freno" valor={String(frenoB)} onChange={(f) => setFrenoB(Number(f))} opciones={FRENOS_BANCO.map((f) => ({ valor: String(f), texto: `${cifra(f, 3)}` }))} />
          </>
        ) : (
          <>
            <Imanes izq={imanIzq} der={imanDer} onChange={(i, d) => ajustar({ imanIzq: i, imanDer: d })} />
            <Seg<string> etiqueta="Espiras" valor={String(espiras)} onChange={(n) => ajustar({ espiras: Number(n) })} opciones={ESPIRAS10.map((n) => ({ valor: String(n), texto: String(n) }))} />
            <BotonLab onClick={energizar} variante={encendido ? 'acento' : 'primario'}><Power size={14} /> {encendido ? 'Cortar' : 'Energizar'}</BotonLab>
            <Mando etiqueta="Fuente" valor={voltaje} min={RANGO_V10.min} max={RANGO_V10.max} paso={RANGO_V10.paso} unidad="V" decimales={1} onChange={(v) => ajustar({ voltaje: Math.round(v * 10) / 10 })} />
            <label className="flex h-8 items-center gap-2">
              <span className="shrink-0 text-[11px] font-semibold text-amber-300">V predicho</span>
              <input type="text" inputMode="decimal" autoComplete="off" value={vTexto} onChange={(e) => guardarV(e.target.value)} placeholder="0,0" disabled={encendido}
                aria-label="Voltaje que predices, en voltios"
                className="h-8 w-[72px] rounded-lg border border-amber-500/40 bg-slate-950 px-2 font-mono text-[13px] text-white outline-none focus:border-amber-400 disabled:opacity-50" />
            </label>
          </>
        )}
      </div>
      {!banco && (alerta || (medido && veredicto)) && (
        <GrupoControles>
          {alerta && (
            <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
              <ShieldAlert size={14} /> {alerta}
            </div>
          )}
          {!alerta && medido && veredicto && !veredicto.ok && (
            <span role="status" className="flex items-center gap-1.5 text-[12px] text-amber-200"><ShieldAlert size={14} className="shrink-0" /> {veredicto.mensaje}</span>
          )}
          <AvisoReto visible={medido && !!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="El motor cumple el reto y tu predicción es correcta. Valida tu práctica." />
        </GrupoControles>
      )}
    </div>
  );

  return <LabLayout escena={escena} barraSuperior={barraSuperior} controles={controles} />;
}
