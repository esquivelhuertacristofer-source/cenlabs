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
import React, { useCallback, useEffect, useLayoutEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { ShieldAlert, Plus, Pause, Play, Tags, Scan, RotateCcw, ChevronRight, PanelRightOpen, PanelRightClose } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import { useSimuladorStore } from '@/store/simuladorStore';
import { FLUIDOS, G_TIERRA, TOL_DENSIDAD, evaluarF6, lecturaDinamometro, pesoAparente } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import {
  LIQUIDOS, MATERIALES, V_AGUA, bloque, estadoSoltar, esLiquido, alcanceDinamometro, peso, cilindroProblema,
  type IdLiquido, type IdMaterial, type Montaje, type Postura,
} from './simuladores/fis06/flotacion';
import { RelojTanque, relojExploracion, relojReto, fijarInmersion, LENTOS, rotuloLento } from './simuladores/fis06/reloj';
import { DockF6, cifra } from './simuladores/fis06/Dock';
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

/** Pastilla de la escena. */
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

/** Lecturas de la barra superior: las del mismo reloj que la escena. */
function Material({ texto }: { texto: string }) {
  return <span className="text-[13px] font-bold text-white">{texto}</span>;
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

  // ── ancho del LabLayout: por debajo de 640 px su panel lateral se SUPERPONE a la escena y
  // taparía el dock; ahí «Modelo» se abre como hoja dentro de la vista 3D, encima del dock ──
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
  const [material, setMaterial] = useState<IdMaterial>('pino');
  const [postura, setPostura] = useState<Postura>('tumbado');
  const [liqE, setLiqE] = useState<IdLiquido>('agua');

  // ── relojes ──
  const relojE = useRef<RelojTanque | null>(null);
  if (!relojE.current) relojE.current = relojExploracion(montajeLibre('pino', 'tumbado', 'agua'), dxOndas('alta'));
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

  // ── aviso de una sola vez por modo (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoF6>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'El bloque de pino flota cuando el empuje iguala su peso.'
        : 'Pesa el cilindro en el aire y sumergido.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 6500);
    return () => window.clearTimeout(t);
  }, [aviso]);

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
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
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
    <div className="flex flex-col gap-2 text-[12px] text-slate-200" data-panel-modelo-f6="">
      <Desplegable titulo="Ecuaciones del modelo">
        <p className="font-mono text-[11px] text-slate-100">E = ρ_l·g·V_sumergido · W_ap = W − E</p>
        <p className="font-mono text-[11px] text-slate-100">flota: V_s/V = ρ_c/ρ_l · GM = KB + BM − KG, BM = b²/(12d)</p>
        <p className="font-mono text-[11px] text-slate-100">(m + m_a)·ÿ = −m·g + E + N + T − c·ẏ − F_arrastre</p>
        <p className="font-mono text-[11px] text-slate-100">T₀ = 2π·√((m + m_a)/(ρ_l·g·A_f·A_t/(A_t − A_f)))</p>
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

  const escena = (
    <div ref={raiz} className="flex h-full w-full min-h-0 flex-col bg-[#070b10]" data-modo-f6={modo}>
      <div className="relative min-h-0 flex-1 overflow-hidden">
        <Arquimedes3DScene
          reloj={reloj} modo={modo} material={material} postura={postura} liq={liqActivo} validado={validado}
          calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} divisiones={divisiones} onListo={onListo}
        />
        {/* modo y, a su lado, el aviso de una sola vez (en la franja de arriba: no tapa el banco) */}
        <div className="pointer-events-none absolute left-2 right-28 top-2 flex items-start gap-1.5">
          <div className="pointer-events-auto flex shrink-0 rounded-full border border-white/10 bg-[#0b1422]/75 p-0.5 backdrop-blur" role="group" aria-label="Modo">
            {(['explorar', 'reto'] as const).map((m) => (
              <button key={m} type="button" onClick={() => { setModo(m); audio?.playPop(); }} aria-pressed={modo === m}
                className={`h-6 rounded-full px-2.5 text-[11px] font-semibold transition-colors ${modo === m ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
                {m === 'explorar' ? 'Explorar' : 'Reto'}
              </button>
            ))}
          </div>
          {aviso && (
            <span key={aviso.n} className="aviso-f6 min-w-0 max-w-[460px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-2.5 py-1 text-[12px] leading-snug text-slate-200 shadow-lg backdrop-blur" data-aviso-f6="">
              {aviso.texto}
            </span>
          )}
        </div>
        {/* tiempo: pausa y cámara lenta con su factor real */}
        <div className="pointer-events-none absolute bottom-2 left-2 flex flex-col items-start gap-1">
          <span className="rounded bg-[#0b1422]/75 px-1.5 py-0.5 font-mono text-[10.5px] font-medium tabular-nums text-amber-200/90" data-camara-lenta="">
            {pausa ? 'en pausa' : lento >= 0.999 ? '×1 · tiempo real' : `${rotuloLento(lento)} · cámara lenta`}
          </span>
          <div className="flex items-center gap-1" role="toolbar" aria-label="Tiempo">
            <Pildora ancho={false} activo={pausa} onClick={() => setPausa((p) => !p)} title={pausa ? 'Reanudar' : 'Pausa'}>{pausa ? <Play size={13} /> : <Pause size={13} />}</Pildora>
            {LENTOS.map((v) => (
              <Pildora key={v} activo={lento === v} onClick={() => (explorar ? setLentoE(v) : setLentoR(v))} title={v >= 0.999 ? 'Tiempo real' : `Cámara lenta ${rotuloLento(v)}`}>{rotuloLento(v)}</Pildora>
            ))}
          </div>
        </div>
        {/* rótulos, encuadre y calidad */}
        <div className="pointer-events-none absolute bottom-2 right-2 flex items-center gap-1">
          <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
          <Pildora ancho={false} activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
          <Pildora activo={false} onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: líquido con transmisión y posproceso)">Calidad: {calidad}</Pildora>
        </div>
        {estrechoLab && !hojaModelo && (
          <button type="button" onClick={() => setHojaModelo(true)} aria-label="Abrir panel Modelo"
            className="absolute right-2 top-2 flex h-8 items-center gap-1.5 rounded-lg border border-white/15 bg-[#0f1a2b]/85 px-2.5 text-[11px] font-semibold text-slate-200 backdrop-blur hover:border-[#219EBC] hover:text-white">
            <PanelRightOpen size={14} /> Modelo
          </button>
        )}
        {estrechoLab && hojaModelo && (
          <aside className="absolute bottom-2 right-2 top-2 z-10 flex w-[min(86%,300px)] min-h-0 flex-col rounded-lg border border-white/10 bg-[#0f1a2b]/95 shadow-2xl shadow-black/50 backdrop-blur" data-hoja-modelo-f6="">
            <div className="flex h-9 shrink-0 items-center justify-between border-b border-white/10 px-3">
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-[#8ECAE6]">Modelo</span>
              <button type="button" onClick={() => setHojaModelo(false)} className="rounded-md p-1 text-slate-400 hover:bg-white/10 hover:text-white" aria-label="Plegar panel">
                <PanelRightClose size={15} />
              </button>
            </div>
            <div className="min-h-0 flex-1 overflow-y-auto p-3 text-[13px] leading-snug">{panelModelo}</div>
          </aside>
        )}
        <style>{`.aviso-f6{animation:avisoF6 6.5s ease forwards}@keyframes avisoF6{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-f6{animation:none}}`}</style>
      </div>
      <DockF6 reloj={reloj} reto={!explorar} liq={liqActivo} validado={validado} />
    </div>
  );

  const barraSuperior = explorar ? (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">Bloques de igual volumen</span>
        <Material texto={`${MATERIALES[material].nombre} en ${liqActivo.nombre.toLowerCase()}`} />
      </div>
      <Lectura etiqueta="ρ cuerpo" valor={MATERIALES[material].rho} unidad="kg/m³" />
      <Lectura etiqueta="ρ líquido" valor={liqActivo.rho} unidad="kg/m³" />
      <Lectura etiqueta="V" valor={256} unidad="cm³" />
    </div>
  ) : (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-amber-300">Reto</span>
        <Material texto="Densidad del sólido problema" />
      </div>
      <Lectura etiqueta="ρ líquido" valor={densidadLiquido} unidad="kg/m³" />
      <Lectura etiqueta="g" valor={cifra(G_TIERRA, 2)} unidad="m/s²" />
    </div>
  );

  const controlesExplorar = (
    <GrupoControles>
      <Segmentado<IdMaterial> etiqueta="Bloque" valor={material} onChange={(v) => { setMaterial(v); audio?.playPop(); }}
        opciones={(Object.keys(MATERIALES) as IdMaterial[]).map((k) => ({ valor: k, texto: MATERIALES[k].nombre }))} />
      <Segmentado<IdLiquido> etiqueta="Líquido" valor={liqE} onChange={(v) => { setLiqE(v); audio?.playPop(); }}
        opciones={(Object.keys(LIQUIDOS) as IdLiquido[]).map((k) => ({ valor: k, texto: LIQUIDOS[k].nombre }))} />
      <Segmentado<Postura> etiqueta="Postura" valor={postura} onChange={(v) => { setPostura(v); audio?.playPop(); }}
        opciones={[{ valor: 'tumbado', texto: 'Tumbado' }, { valor: 'canto', texto: 'De canto' }]} />
      <BotonLab variante="secundario" onClick={() => { setPausa(false); soltar(); audio?.playPop(); }}><RotateCcw size={14} /> Soltar de nuevo</BotonLab>
    </GrupoControles>
  );

  const controlesReto = (
    <div className="flex flex-col gap-2">
      <GrupoControles>
        <Segmentado etiqueta="Líquido" valor={fluido as string} onChange={cambiarFluido}
          opciones={Object.entries(FLUIDOS).map(([k, f]) => ({ valor: k, texto: f.nombre }))} />
        <Deslizador etiqueta="Inmersión" valor={fraccion * 100} min={0} max={100} paso={5} unidad="%" decimales={0} ancho="w-36"
          onChange={(v) => setArquimedes6({ sumergido: Math.min(1, Math.max(0, v / 100)) })} />
        <BotonLab variante="secundario" onClick={registrarAire} title="Registra la lectura con el sólido fuera del líquido">
          <Plus size={14} /> Peso en aire{lecturaAire !== null && <span className="font-mono tabular-nums text-[#ffd59a]"> · {cifra(lecturaAire, 2)} N</span>}
        </BotonLab>
        <BotonLab onClick={registrarFluido} title="Registra la lectura con el sólido sumergido al 100 %">
          <Plus size={14} /> Peso sumergido{lecturaFluido !== null && <span className="font-mono tabular-nums"> · {cifra(lecturaFluido, 2)} N</span>}
        </BotonLab>
      </GrupoControles>
      <GrupoControles>
        <label className="flex items-center gap-1.5">
          <span className="text-[11px] font-semibold text-amber-300">ρ del sólido</span>
          <input type="text" inputMode="decimal" autoComplete="off" value={rhoInput} onChange={(e) => guardarRho(e.target.value)} placeholder="ej. 2650,5"
            aria-label="Densidad del sólido en kilogramos por metro cúbico"
            className="h-8 w-28 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
          <span className="text-[11px] text-slate-400">kg/m³</span>
        </label>
        <BotonLab variante="acento" onClick={comprobar}>Comprobar análisis</BotonLab>
        {validado && (
          <span className="flex items-center gap-1.5 text-[12px] font-semibold text-emerald-300" data-densidad-real="">
            ρ real {cifra(densidadCuerpo, 0)} kg/m³ · parecida a la del {parecido}
          </span>
        )}
      </GrupoControles>
      {(alerta || veredicto?.ok) && (
        <div className="flex flex-wrap items-center gap-2">
          {alerta && (
            <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
              <ShieldAlert size={14} /> {alerta}
            </div>
          )}
          <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Tu densidad coincide con tus lecturas del dinamómetro. Valida tu práctica." />
        </div>
      )}
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={explorar ? controlesExplorar : controlesReto}
      panelLateral={estrechoLab ? undefined : panelModelo}
      tituloPanel="Modelo"
      panelAbiertoInicial={false}
    />
  );
}
