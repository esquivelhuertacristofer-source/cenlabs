"use client";
/**
 * F6 · Principio de Arquímedes.
 *
 * Dos modos sobre el mismo tanque de vidrio:
 *  · EXPLORAR (estado inicial): el juego de cuatro bloques de IGUAL VOLUMEN (pino, hielo,
 *    aluminio, hierro) en agua, etanol o glicerina. El bloque cae, el empuje lo frena y
 *    oscila hasta flotar con la fracción ρ_c/ρ_l sumergida; de canto, vuelca (GM < 0); los
 *    metales se hunden con arrastre. No toca el store: es la parte de descubrir.
 *  · RETO (store `arquimedes6`, validador `evaluarF6`, sin cambios de criterio): el cilindro
 *    problema cuelga del dinamómetro; el alumno lo pesa en el aire y sumergido y calcula ρ.
 *    Antes de validar, ni la escena ni el dock dibujan fuerzas: su razón daría la densidad.
 *
 * Un solo reloj por modo (fis06/reloj.ts) mueve la escena, el dock y las lecturas.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Plus, Pause, Play, Tags, Scan, RotateCcw, ChevronRight, BookOpen, X, ArrowRight, Gauge } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { FLUIDOS, G_TIERRA, TOL_DENSIDAD, evaluarF6, lecturaDinamometro, pesoAparente } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout from './simulador/LabLayout';
import RaizLabEstrella from './simulador/RaizLabEstrella';
import {
  LIQUIDOS, MATERIALES, V_AGUA, bloque, estadoSoltar, esLiquido, alcanceDinamometro, peso, cilindroProblema, flota, alturaMetacentrica,
  type IdLiquido, type IdMaterial, type Montaje, type Postura,
} from './simuladores/fis06/flotacion';
import { RelojTanque, relojExploracion, relojReto, fijarInmersion, LENTOS, rotuloLento, T_ENTRADA_INICIAL } from './simuladores/fis06/reloj';
import { DockF6, cifra } from './simuladores/fis06/Dock';
import { guiaExplorar, guiaReto, pasoReto } from './simuladores/fis06/guia';
import type { ModoF6 } from './simuladores/fis06/Arquimedes3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Arquimedes3DScene = dynamic(() => import('./simuladores/fis06/Arquimedes3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#070b10]" />,
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
const dxOndas = (c: Calidad) => (c === 'alta' ? 0.005 : 0.01);
function prefiereReducirMovimiento(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

const montajeLibre = (mat: IdMaterial, post: Postura, liq: IdLiquido): Montaje =>
  ({ c: bloque(mat, post), liq: LIQUIDOS[liq], Vagua: V_AGUA, colgado: false, ySoporte: 0, kMuelle: 0 });

/**
 * Botón del riel: icono y nombre a 13 px. Los mandos de la vista y del tiempo van AL LADO del
 * lienzo, no encima del tanque.
 */
function BotonRiel({ activo, onClick, icono, texto, titulo }: { activo?: boolean; onClick: () => void; icono?: React.ReactNode; texto: string; titulo: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={titulo} aria-label={titulo}
      className={`flex shrink-0 flex-col items-center justify-center gap-1 rounded-lg border px-0.5 text-[13px] max-sm:w-[70px] sm:w-full font-semibold leading-none transition-colors ${icono ? 'h-[44px]' : 'h-[30px]'} ${activo ? 'border-[#8ECAE6]/60 bg-[#219EBC]/25 text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-white/30 hover:text-white'}`}>
      {icono}
      <span>{texto}</span>
    </button>
  );
}
const RIEL = 'flex shrink-0 gap-1 border-white/10 bg-[#0c1524] p-1.5 [scrollbar-width:none] max-sm:items-center max-sm:overflow-x-auto sm:w-[78px] sm:flex-col sm:overflow-y-auto';

const ETQ = 'shrink-0 text-[13px] font-semibold text-slate-400';
const BOTON = 'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-3 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';

/** Selector segmentado en línea (la etiqueta a la izquierda, 13 px): dos filas de mandos caben a 1366 × 768. */
function Seg<T extends string>({ etiqueta, titulo, valor, opciones, onChange }: { etiqueta?: string; titulo?: string; valor: T; opciones: { valor: T; texto: string }[]; onChange: (v: T) => void }) {
  return (
    <div className="flex h-9 items-center gap-2">
      {etiqueta && <span className={ETQ}>{etiqueta}</span>}
      <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label={etiqueta ?? titulo} title={titulo}>
        {opciones.map((o) => (
          <button key={o.valor} type="button" onClick={() => onChange(o.valor)} aria-pressed={valor === o.valor}
            className={`h-8 rounded-md px-2.5 text-[13px] font-semibold ${valor === o.valor ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
            {o.texto}
          </button>
        ))}
      </div>
    </div>
  );
}

function Desplegable({ titulo, children }: { titulo: string; children: React.ReactNode }) {
  const [abierto, setAbierto] = useState(false);
  return (
    <div className="rounded-lg border border-white/10 bg-white/[0.03]">
      <button type="button" onClick={() => setAbierto((v) => !v)} aria-expanded={abierto}
        className="flex w-full items-center gap-1.5 px-2.5 py-2 text-left text-[13px] font-semibold text-slate-200 hover:text-white">
        <ChevronRight size={13} className={`shrink-0 transition-transform ${abierto ? 'rotate-90' : ''}`} /> {titulo}
      </button>
      {abierto && <div className="space-y-1.5 px-3 pb-2.5 text-[13px] leading-snug text-slate-300">{children}</div>}
    </div>
  );
}

export default function PilotoArquimedes({ onValidate }: { onValidate?: () => void }) {
  const { a, setArquimedes6, setAsistente, audio } = useSimuladorStore(useShallow((s) => ({
    a: s.arquimedes6, setArquimedes6: s.setArquimedes6, setAsistente: s.setAsistente, audio: s.audio,
  })));
  const { densidadCuerpo, volumenCuerpo, fluido, densidadLiquido, sumergido, lecturaAire, lecturaFluido, densidadAlumno } = a;

  // ── modo, calidad, tiempo ──
  const [modo, setModo] = useState<ModoF6>('explorar');
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [lentoE, setLentoE] = useState<number>(LENTOS[1]);
  const [lentoR, setLentoR] = useState<number>(LENTOS[0]);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);

  const [hojaModelo, setHojaModelo] = useState(false);

  // ── exploración ──
  const [material, setMaterial] = useState<IdMaterial>('pino');
  const [postura, setPostura] = useState<Postura>('tumbado');
  const [liqE, setLiqE] = useState<IdLiquido>('agua');

  // ── relojes ──
  const relojE = useRef<RelojTanque | null>(null);
  if (!relojE.current) {
    relojE.current = relojExploracion(montajeLibre('pino', 'tumbado', 'agua'), dxOndas('alta'));
    // al abrir, el bloque ya está entrando en el agua (no un tanque quieto con un bloque en el aire)
    relojE.current.integrar(T_ENTRADA_INICIAL);
  }
  const fluidoReto: IdLiquido = esLiquido(fluido) ? fluido : 'agua';
  const relojR = useRef<RelojTanque | null>(null);
  if (!relojR.current) relojR.current = relojReto(densidadCuerpo, volumenCuerpo, LIQUIDOS[fluidoReto], sumergido, dxOndas('alta'));
  const reloj = useRef<RelojTanque>(relojE.current);
  reloj.current = modo === 'explorar' ? relojE.current : relojR.current;

  useEffect(() => { relojE.current!.resolucionOndas(dxOndas(calidad)); relojR.current!.resolucionOndas(dxOndas(calidad)); }, [calidad]);
  useEffect(() => { relojE.current!.factor = lentoE; }, [lentoE]);
  useEffect(() => { relojR.current!.factor = lentoR; }, [lentoR]);
  useEffect(() => { relojE.current!.pausa = pausa; relojR.current!.pausa = pausa; }, [pausa]);

  // exploración: cuerpo, postura o líquido nuevos → se suelta de nuevo
  const primeraE = useRef(true);
  const soltar = useCallback(() => {
    const m = montajeLibre(material, postura, liqE);
    relojE.current!.reiniciar(m, estadoSoltar(m));
    if (reducido) { relojE.current!.integrar(6); }
  }, [material, postura, liqE, reducido]);
  useEffect(() => {
    if (primeraE.current) { primeraE.current = false; if (reducido) relojE.current!.integrar(6); return; }
    soltar();
  }, [soltar, reducido]);

  // reto: el cilindro del store (semilla nueva o líquido nuevo → reloj nuevo; inmersión → el soporte se desliza)
  const claveReto = `${densidadCuerpo}|${volumenCuerpo}|${fluidoReto}`;
  const ultimaClave = useRef(claveReto);
  useEffect(() => {
    if (ultimaClave.current === claveReto) return;
    ultimaClave.current = claveReto;
    const nuevo = relojReto(densidadCuerpo, volumenCuerpo, LIQUIDOS[fluidoReto], useSimuladorStore.getState().arquimedes6.sumergido, dxOndas(calidad));
    nuevo.factor = lentoR; nuevo.pausa = pausa;
    relojR.current = nuevo;
    reloj.current = modo === 'explorar' ? relojE.current! : nuevo;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [claveReto]);
  const fraccion = Math.min(1, Math.max(0, sumergido));
  useEffect(() => { fijarInmersion(relojR.current!, fraccion); }, [fraccion, claveReto]);

  // ── asistente ──
  useEffect(() => {
    setAsistente({
      visible: true,
      text: 'Primero mira flotar y hundirse el juego de bloques de igual volumen. Después, en el reto, pesa el sólido en el aire y sumergido: la diferencia es el empuje.',
      pose: 'thinking',
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  // ── reto: registros y veredicto (mismas reglas que antes) ──
  const [rhoInput, setRhoInput] = useState(densidadAlumno !== null ? String(densidadAlumno).replace('.', ',') : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF6> | null>(null);
  useEffect(() => { setVeredicto(null); }, [lecturaAire, lecturaFluido, densidadAlumno]);
  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };
  // lo que marca el dinamómetro EN REPOSO con la inmersión elegida (la escena oscila hacia ese valor)
  const lecturaReposo = lecturaDinamometro(pesoAparente(densidadCuerpo, volumenCuerpo, densidadLiquido, fraccion));

  const cambiarFluido = (key: string) => {
    if (key === fluido) return;
    // la lectura sumergida pertenece al fluido en que se tomó
    setArquimedes6({ fluido: key, densidadLiquido: FLUIDOS[key].rho, sumergido: 0, lecturaFluido: null, fluidoLectura: null, resultado: null });
    audio?.playPop();
  };
  const registrarAire = () => {
    if (fraccion > 0) return avisar('Saca por completo el sólido del fluido para pesarlo en el aire.');
    setArquimedes6({ lecturaAire: lecturaReposo, resultado: null });
    audio?.playPop();
  };
  const registrarFluido = () => {
    if (fraccion < 1) return avisar('Sumerge el sólido POR COMPLETO antes de registrar el peso aparente.');
    setArquimedes6({ lecturaFluido: lecturaReposo, fluidoLectura: fluido, resultado: null });
    audio?.playPop();
  };
  const guardarRho = (v: string) => {
    const limpio = v.replace(/[^\d.,]/g, '');
    setRhoInput(limpio);
    const r = parseFloat(limpio.replace(/\s/g, '').replace(',', '.'));
    setArquimedes6({ densidadAlumno: Number.isFinite(r) ? r : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF6(a);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else audio?.playError();
  };
  const validado = !!veredicto?.ok || a.resultado === 'exito';

  const explorar = modo === 'explorar';
  const liqActivo = explorar ? LIQUIDOS[liqE] : LIQUIDOS[fluidoReto];
  const lento = explorar ? lentoE : lentoR;
  const alcance = alcanceDinamometro(peso(cilindroProblema(volumenCuerpo, densidadCuerpo)));
  const divisiones = alcance === 20 ? 40 : 50;

  // material más parecido (sólo tras validar)
  const parecido = useMemo(() => {
    const tabla: [string, number][] = [['PVC', 1400], ['vidrio', 2500], ['aluminio', 2700], ['granito', 2750], ['titanio', 4500], ['zinc', 7140], ['hierro', 7874], ['latón', 8500], ['cobre', 8960]];
    return tabla.reduce((m, x) => (Math.abs(x[1] - densidadCuerpo) < Math.abs(m[1] - densidadCuerpo) ? x : m))[0];
  }, [densidadCuerpo]);

  const panelModelo = (
    <div className="flex flex-col gap-2 text-[13px] text-slate-200" data-panel-modelo-f6="">
      <Desplegable titulo="Ecuaciones del modelo">
        <p className="font-mono text-[13px] text-slate-100">E = ρ_l·g·V_sumergido · W_ap = W − E</p>
        <p className="font-mono text-[13px] text-slate-100">flota: V_s/V = ρ_c/ρ_l · GM = KB + BM − KG, BM = b²/(12d)</p>
        <p className="font-mono text-[13px] text-slate-100">(m + m_a)·ÿ = −m·g + E + N + T − c·ẏ − F_arrastre</p>
        <p className="font-mono text-[13px] text-slate-100">T₀ = 2π·√((m + m_a)/(ρ_l·g·A_f·A_t/(A_t − A_f)))</p>
        <p>La sección sumergida es el rectángulo girado recortado por la superficie: su área por el largo es V_sumergido y su centroide es B. El nivel del tanque sube justo el volumen desalojado. Arrastre: correlación de White, C_d = 24/Re + 6/(1 + √Re) + C∞. La superficie sigue la ecuación de ondas con la velocidad de las ondas de 4 cm (agua: 0,27 m/s) y el menisco, el perfil de Laplace–Young.</p>
      </Desplegable>
      <Desplegable titulo="Qué simplifica el modelo">
        <p>Masa añadida de una esfera (½ del líquido desalojado) y amortiguamiento por ondas radiadas con ζ = 0,12. El cuerpo no deriva de lado: sube, baja y gira en el plano de la pantalla. El cilindro del reto se calcula como el prisma de igual volumen y área de flotación.</p>
        <p>Las ondas no son dispersivas (todas a la velocidad de las de 4 cm), no empujan al cuerpo y hay una microagitación de 0,05 mm que mantiene vivo el reflejo. El pino es un valor típico: la madera real va de 350 a 600 kg/m³.</p>
        <p>Las flechas son un diagrama: misma escala para las fuerzas de un cuerpo, con el peso de los metales acotado a 11 cm. Los botones del reto registran la lectura en reposo, a la que la aguja llega tras oscilar.</p>
        <p>Datos a 20 °C (CRC Handbook): agua 998, etanol 789, glicerina 1 261 kg/m³; hielo 917, aluminio 2 700, hierro 7 874 kg/m³. Tolerancia del reto: ±{TOL_DENSIDAD * 100} %.</p>
      </Desplegable>
    </div>
  );

  const flotaE = flota(bloque(material, postura), LIQUIDOS[liqE]);
  const estableE = alturaMetacentrica(bloque(material, postura), LIQUIDOS[liqE]).GM >= 0;
  const guia = explorar ? guiaExplorar(flotaE, estableE)
    : validado ? `ρ real ${cifra(densidadCuerpo, 0)} kg/m³, parecida a la del ${parecido}. Valida tu práctica.`
      : guiaReto(a);
  const paso = pasoReto(a);

  const escena = (
    <div className="flex h-full w-full min-h-0 flex-col bg-[#070b10]" data-modo-f6={modo}>
      <div className="flex min-h-0 flex-1 max-sm:flex-col">
        {/* rieles: el tiempo (izquierda) y la vista (derecha), fuera del lienzo; en móvil, filas arriba y abajo */}
        <div className={`${RIEL} max-sm:border-b sm:border-r`} role="toolbar" aria-label="Tiempo">
          <BotonRiel activo={pausa} onClick={() => setPausa((p) => !p)} icono={pausa ? <Play size={16} /> : <Pause size={16} />} texto={pausa ? 'Seguir' : 'Pausa'} titulo={pausa ? 'Reanudar' : 'Pausa'} />
          {LENTOS.map((v) => (
            <BotonRiel key={v} activo={lento === v} onClick={() => (explorar ? setLentoE(v) : setLentoR(v))} texto={rotuloLento(v)} titulo={v >= 0.999 ? 'Tiempo real' : `Cámara lenta ${rotuloLento(v)}`} />
          ))}
          <span className="text-center text-[13px] leading-tight text-amber-200/90 max-sm:ml-1" data-camara-lenta="">{pausa ? 'en pausa' : lento >= 0.999 ? 'tiempo real' : 'cámara lenta'}</span>
        </div>
        <div className={`${RIEL} order-last max-sm:border-t sm:border-l`} role="toolbar" aria-label="Vista">
          <BotonRiel activo={rotulos} onClick={() => setRotulos((v) => !v)} icono={<Tags size={16} />} texto="Rótulos" titulo="Nombres de las piezas (también al pasar el ratón)" />
          <BotonRiel onClick={() => setEncuadre((n) => n + 1)} icono={<Scan size={16} />} texto="Centrar" titulo="Volver al encuadre automático" />
          <BotonRiel activo={hojaModelo} onClick={() => setHojaModelo((v) => !v)} icono={<BookOpen size={16} />} texto="Modelo" titulo="Ecuaciones y simplificaciones del modelo" />
          <BotonRiel onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} icono={<Gauge size={16} />} texto={calidad === 'alta' ? 'Alta' : 'Media'} titulo={`Calidad gráfica: ${calidad} (alta: líquido con transmisión y posproceso)`} />
        </div>
        <div className="relative min-h-0 min-w-0 flex-1 overflow-hidden" data-lienzo-f6="">
          <Arquimedes3DScene
            reloj={reloj} modo={modo} material={material} postura={postura} liq={liqActivo} validado={validado}
            calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} divisiones={divisiones}
          />
          {hojaModelo && (
            <aside className="absolute inset-2 z-10 mx-auto flex min-h-0 max-w-[560px] flex-col rounded-lg border border-white/10 bg-[#0f1a2b]/95 shadow-2xl shadow-black/50 backdrop-blur" data-hoja-modelo-f6="">
              <div className="flex h-10 shrink-0 items-center justify-between border-b border-white/10 px-3">
                <span className="text-[13px] font-bold uppercase tracking-[0.06em] text-[#8ECAE6]">Cómo está hecho el modelo</span>
                <button type="button" onClick={() => setHojaModelo(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Cerrar">
                  <X size={16} />
                </button>
              </div>
              <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[13px] leading-snug">{panelModelo}</div>
            </aside>
          )}
        </div>
      </div>
      <DockF6 reloj={reloj} reto={!explorar} liq={liqActivo} validado={validado} />
    </div>
  );

  const selectorModo = (
    <div className="ml-auto flex shrink-0 rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Modo">
      {(['explorar', 'reto'] as const).map((m) => (
        <button key={m} type="button" onClick={() => { setModo(m); audio?.playPop(); }} aria-pressed={modo === m}
          className={`h-8 rounded-md px-3 text-[13px] font-semibold transition-colors ${modo === m ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
          {m === 'explorar' ? 'Explorar' : 'Reto'}
        </button>
      ))}
    </div>
  );
  const DATO = 'font-mono font-semibold tabular-nums text-white';
  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-col gap-1.5">
      <div className="flex min-w-0 flex-wrap items-center gap-x-3 gap-y-1">
        {explorar ? (
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[13px] text-slate-300" data-datos-f6="" title="Los cuatro bloques tienen el mismo volumen: 256 cm³">
            <span>ρ {MATERIALES[material].nombre.toLowerCase()} <span className={DATO}>{MATERIALES[material].rho}</span></span>
            <span>ρ {liqActivo.nombre.toLowerCase()} <span className={DATO}>{liqActivo.rho}</span> kg/m³</span>
          </div>
        ) : (
          <div className="flex min-w-0 flex-wrap items-baseline gap-x-2 rounded-lg border border-[#FB8500]/40 bg-[#FB8500]/10 px-2.5 py-1 text-[13px] text-slate-300" data-datos-f6="">
            <span className="font-semibold uppercase tracking-[0.04em] text-amber-300">Reto</span>
            <span>ρ {liqActivo.nombre.toLowerCase()} <span className={DATO}>{densidadLiquido}</span> kg/m³</span>
            <span>g <span className={DATO}>{cifra(G_TIERRA, 2)}</span> m/s²</span>
          </div>
        )}
        {selectorModo}
      </div>
      {!explorar && alerta ? (
        <p role="alert" data-alerta-f6="" className="flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-rose-200">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" /> <span>{alerta}</span>
        </p>
      ) : !explorar && veredicto && !veredicto.ok ? (
        <p role="alert" data-veredicto-f6="falla" className="flex items-start gap-1.5 text-[13px] font-semibold leading-snug text-amber-200">
          <ShieldAlert size={15} className="mt-0.5 shrink-0" /> <span>Todavía no. {veredicto.mensaje ?? 'Revisa tus datos.'}</span>
        </p>
      ) : (
        <p role="status" data-guia-f6="" className="flex items-start gap-1.5 text-[13px] leading-snug text-slate-200">
          <ArrowRight size={15} className="mt-0.5 shrink-0 text-sky-300" />
          <span data-densidad-real={!explorar && validado ? '' : undefined}><b className="font-semibold text-sky-200">{explorar ? 'Ahora te toca: ' : validado ? 'Resuelto: ' : `Paso ${paso} de 4: `}</b>{guia}</span>
        </p>
      )}
    </div>
  );

  const controlesExplorar = (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
      <Seg<IdMaterial> etiqueta="Bloque" valor={material} onChange={(v) => { setMaterial(v); audio?.playPop(); }}
        opciones={(Object.keys(MATERIALES) as IdMaterial[]).map((k) => ({ valor: k, texto: MATERIALES[k].nombre }))} />
      <button type="button" onClick={() => { setPausa(false); soltar(); audio?.playPop(); }} title="Suelta el bloque otra vez sobre el líquido"
        className={`${BOTON} border border-white/15 bg-white/[0.04] text-slate-100 hover:border-[#219EBC] hover:text-white`}><RotateCcw size={15} /> Soltar de nuevo</button>
      <Seg<IdLiquido> etiqueta="Líquido" valor={liqE} onChange={(v) => { setLiqE(v); audio?.playPop(); }}
        opciones={(Object.keys(LIQUIDOS) as IdLiquido[]).map((k) => ({ valor: k, texto: LIQUIDOS[k].nombre }))} />
      <Seg<Postura> titulo="Postura del bloque al soltarlo" valor={postura} onChange={(v) => { setPostura(v); audio?.playPop(); }}
        opciones={[{ valor: 'tumbado', texto: 'Tumbado' }, { valor: 'canto', texto: 'De canto' }]} />
    </div>
  );

  const controlesReto = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-4 gap-y-2">
        <Seg<string> etiqueta="Líquido" valor={fluido as string} onChange={cambiarFluido}
          opciones={Object.entries(FLUIDOS).map(([k, f]) => ({ valor: k, texto: f.nombre }))} />
        <label className="flex h-9 items-center gap-2">
          <span className={ETQ}>Inmersión</span>
          <input type="range" min={0} max={100} step={5} value={fraccion * 100} aria-label="Inmersión del cilindro" aria-valuetext={`${Math.round(fraccion * 100)} %`}
            onChange={(e) => setArquimedes6({ sumergido: Math.min(1, Math.max(0, Number(e.target.value) / 100)) })}
            className="h-1.5 w-[clamp(90px,14vw,150px)] cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
          <span className="w-[46px] shrink-0 text-right font-mono text-[13px] font-semibold tabular-nums text-white">{Math.round(fraccion * 100)} %</span>
        </label>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <button type="button" onClick={registrarAire} title="Registra la lectura con el sólido fuera del líquido"
          className={`${BOTON} border ${paso === 1 ? 'border-[#219EBC] bg-[#219EBC] text-white hover:bg-[#1b87a1]' : 'border-white/15 bg-white/[0.04] text-slate-100 hover:border-[#219EBC]'}`}>
          <Plus size={15} /> Peso en aire{lecturaAire !== null && <span className="font-mono tabular-nums text-[#ffd59a]"> {cifra(lecturaAire, 2)} N</span>}
        </button>
        <button type="button" onClick={registrarFluido} title="Registra la lectura con el sólido sumergido al 100 %"
          className={`${BOTON} border ${paso === 2 ? 'border-[#219EBC] bg-[#219EBC] text-white hover:bg-[#1b87a1]' : 'border-white/15 bg-white/[0.04] text-slate-100 hover:border-[#219EBC]'}`}>
          <Plus size={15} /> Peso sumergido{lecturaFluido !== null && <span className="font-mono tabular-nums text-[#ffd59a]"> {cifra(lecturaFluido, 2)} N</span>}
        </button>
      </div>
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <label className="flex items-center gap-1.5">
          <span className="text-[13px] font-semibold text-amber-300">ρ del sólido</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={rhoInput} onChange={(e) => guardarRho(e.target.value)} placeholder="¿?"
            aria-label="Densidad del sólido en kilogramos por metro cúbico"
            className="h-9 w-[104px] rounded-lg border border-amber-500/50 bg-slate-950 px-2.5 font-mono text-[14px] text-white outline-none focus:border-amber-400" />
          <span className="text-[13px] text-slate-400">kg/m³</span>
        </label>
        <button type="button" onClick={comprobar} className={`${BOTON} bg-[#FB8500] text-white hover:bg-[#e07700]`}>Comprobar análisis</button>
      </div>
      <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="max-sm:flex-wrap !gap-x-3 !gap-y-1.5 !px-3 !py-1.5" texto="Tu densidad coincide con tus lecturas del dinamómetro. Valida tu práctica." />
    </div>
  );

  return (
    <RaizLabEstrella id="fisica-6">
      <LabLayout escena={escena} barraSuperior={barraSuperior} controles={explorar ? controlesExplorar : controlesReto} />
    </RaizLabEstrella>
  );
}
