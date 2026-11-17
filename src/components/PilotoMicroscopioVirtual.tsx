"use client";

/**
 * BIO-01 · Microscopio digital con casos.
 *
 * El protagonista es el campo ocular (bio01/CampoOcular): seis preparaciones dibujadas
 * a escala real. El alumno maneja el instrumento de verdad —revólver, aceite de
 * inmersión, macro y micrométrico, diafragma del condensador, lámpara y platina X–Y— y
 * resuelve la pregunta de cada caso midiendo con la regla o contando en el marco.
 *
 * Todo lo que se ve (desenfoque, brillo, contraste, resolución) y todo lo que el juez
 * decide sale de src/domain/microscopia: la pantalla y el validador no pueden discrepar.
 * La respuesta correcta nunca se pinta: el alumno la obtiene observando.
 */
import React, { useEffect, useRef, useState } from 'react';
import { Camera, Check, CircleDot, Droplet, Hand, Microscope, Pause, Play, Ruler, Square, Trash2, X } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import { useSimuladorStore } from '@/store/simuladorStore';
import {
  CASOS_B1, ORDEN_CASOS_B1, CASOS_PARA_APROBAR_B1, BRILLO_MIN_B1, BRILLO_MAX_B1,
  brilloEfectivoB1, desenfoqueB1, estadoCasoB1, evaluarRespuestaB1, casosResueltosB1, tomarRespuestaB1,
} from '@/domain/biologia';
import {
  APERTURA_MAX, APERTURA_MIN, MAGS, OBJETIVOS_OPTICOS, RECORRIDO_PLATINA_UM, anCondensador, anEfectiva, aumentoTotal, campoUm,
  contrasteRelativo, ladoMarcoUm, profundidadCampoUm, resolucionUm, sinAceite,
} from '@/domain/microscopia/optica';
import { RAIZ } from '@/domain/microscopia/preparaciones';
import type { MuestraB1, ObjetivoMagB1 } from '@/store/types';
import RaizLabEstrella from './simulador/RaizLabEstrella';
import CampoOcular, { COLORES_MARCA, type CampoOcularRef, type Herramienta, type Marca, type Medida } from './simuladores/bio01/CampoOcular';
import MicroscopioBanco from './simuladores/bio01/MicroscopioBanco';

/** Dónde se abre cada preparación (µm): la raíz, en plena zona de división. */
const SITIO_INICIAL: Partial<Record<MuestraB1, [number, number]>> = { mitosis: [0, RAIZ.yApice - 330] };
/** Categorías del contador de marcas de cada caso de conteo. */
const CATEGORIAS: Partial<Record<MuestraB1, string[]>> = {
  sangre: ['Con parásito', 'Sanos'], mitosis: ['En mitosis', 'Interfase'], estomas: ['Estoma'],
};
/** Paso del micrométrico por muesca de la rueda (µm), según el objetivo. */
const PASO_RUEDA: Record<ObjetivoMagB1, number> = { 4: 4, 10: 1, 40: 0.3, 100: 0.1 };

const coma = (x: number, dec = 2) => x.toFixed(dec).replace('.', ',');
const limitar = (x: number, a: number, b: number) => Math.min(b, Math.max(a, x));

const ESTILO = `
.bio01-giro{animation:bio01-giro .34s ease-out forwards}
@keyframes bio01-giro{0%{opacity:1}35%{opacity:.92}100%{opacity:0}}
.bio01 input[type=range]{height:18px;accent-color:#22d3ee;cursor:pointer}
.bio01 input[type=number]::-webkit-outer-spin-button,.bio01 input[type=number]::-webkit-inner-spin-button{-webkit-appearance:none;margin:0}
.bio01 input[type=number]{-moz-appearance:textfield}
`;

const BOTON = 'flex h-9 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-semibold transition-colors disabled:cursor-not-allowed disabled:opacity-40';
const SUAVE = 'border border-white/15 bg-white/[0.05] text-slate-100 hover:border-cyan-400';
const ACTIVO = 'border border-cyan-400 bg-cyan-500/20 text-white';

function Mando({ etiqueta, valor, min, max, paso, texto, onChange, title }: {
  etiqueta: string; valor: number; min: number; max: number; paso: number; texto: string; onChange: (v: number) => void; title?: string;
}) {
  return (
    <label className="flex min-w-0 flex-col gap-0.5" title={title}>
      <span className="flex items-baseline justify-between gap-2 text-[13px] leading-tight">
        <span className="truncate font-semibold text-slate-200">{etiqueta}</span>
        <span className="shrink-0 font-mono tabular-nums text-cyan-200">{texto}</span>
      </span>
      <input type="range" min={min} max={max} step={paso} value={valor} aria-label={etiqueta} onChange={(e) => onChange(Number(e.target.value))} className="w-full" />
    </label>
  );
}

function Dato({ etiqueta, valor }: { etiqueta: string; valor: string }) {
  return (
    <div className="flex items-baseline justify-between gap-3 border-b border-white/[0.07] py-1 text-[13px]">
      <span className="text-slate-300">{etiqueta}</span>
      <span className="font-mono font-semibold tabular-nums text-white">{valor}</span>
    </div>
  );
}

/** `onValidate` lo dispara el botón «Validar práctica» de la cabecera: aquí no hace falta otro. */
export default function PilotoMicroscopioVirtual(props: { onValidate?: () => void }) {
  void props;
  const microscopio = useSimuladorStore((s) => s.microscopio);
  const setMicroscopio = useSimuladorStore((s) => s.setMicroscopio);
  const tomarCaptura = useSimuladorStore((s) => s.tomarCaptura);
  const {
    muestra, objetivoMag, iluminacion, apertura, posicionX, posicionY, enfoqueMacro, enfoqueMicro, enfoqueZ,
    aceiteInmersionAplicado: aceite, semilla, status,
  } = microscopio;
  const caso = CASOS_B1[muestra];
  const resueltos = casosResueltosB1(microscopio).length;

  // ── herramientas de observación (locales: no son la respuesta) ──
  const [herramienta, setHerramienta] = useState<Herramienta>('mover');
  const [marcoManual, setMarcoManual] = useState<boolean | null>(null);
  const [congelado, setCongelado] = useState(false);
  const [medidas, setMedidas] = useState<Partial<Record<MuestraB1, Medida | null>>>({});
  const [marcas, setMarcas] = useState<Partial<Record<MuestraB1, Marca[]>>>({});
  const [cat, setCat] = useState(0);
  const [textos, setTextos] = useState<Partial<Record<MuestraB1, string[]>>>({});
  const [aviso, setAviso] = useState<{ caso: MuestraB1; ok: boolean; texto: string } | null>(null);
  const [verBanco, setVerBanco] = useState(false);
  const campo = useRef<CampoOcularRef>(null);

  const marco = marcoManual ?? caso.tipo === 'contar';
  const cats = CATEGORIAS[muestra] ?? ['Marca'];
  const misMarcas = marcas[muestra] ?? [];
  const misTextos = textos[muestra] ?? caso.campos.map(() => '');

  // ── óptica (dominio) ──
  const blur = (z: number) => desenfoqueB1(microscopio, z);
  const brillo = brilloEfectivoB1(microscopio);
  const seco = sinAceite(objetivoMag, aceite);
  const res = resolucionUm(objetivoMag, aceite, apertura);
  const pdc = profundidadCampoUm(objetivoMag, aceite, apertura);
  const pista = seco ? 'El objetivo de 100× es de inmersión: aplica aceite.'
    : brillo < BRILLO_MIN_B1 ? 'Imagen oscura: sube la lámpara o abre el diafragma.'
      : brillo > BRILLO_MAX_B1 ? 'Imagen deslumbrada: baja la lámpara o cierra el diafragma.' : null;

  // ── acciones ──
  const elegirCaso = (c: MuestraB1) => {
    if (c === muestra) return;
    audio?.playPop();
    const [x, y] = SITIO_INICIAL[c] ?? [0, 0];
    setMicroscopio({ muestra: c, objetivoMag: CASOS_B1[c].objetivoInicial, posicionX: x, posicionY: y, aceiteInmersionAplicado: false });
    setHerramienta('mover'); setMarcoManual(null); setCongelado(false); setCat(0); setAviso(null);
  };
  const mover = (dx: number, dy: number) => setMicroscopio({
    posicionX: limitar(posicionX + dx, -RECORRIDO_PLATINA_UM, RECORRIDO_PLATINA_UM),
    posicionY: limitar(posicionY + dy, -RECORRIDO_PLATINA_UM, RECORRIDO_PLATINA_UM),
  });
  /** La rueda mueve el micrométrico; al llegar a un tope, arrastra una división del macro. */
  const enfocar = (pasos: number) => {
    let micro = Math.round((enfoqueMicro + pasos * PASO_RUEDA[objetivoMag]) * 10) / 10, macro = enfoqueMacro;
    while (micro > 10 && macro < 100) { micro -= 10; macro += 1; }
    while (micro < 0 && macro > 0) { micro += 10; macro -= 1; }
    setMicroscopio({ enfoqueMicro: limitar(Math.round(micro * 10) / 10, 0, 10), enfoqueMacro: macro });
  };
  const capturar = () => {
    const url = campo.current?.capturar();
    if (url) { tomarCaptura(url); audio?.playPop(); }
  };
  const escribir = (k: number, v: string) => {
    const nuevo = [...misTextos]; nuevo[k] = v;
    setTextos({ ...textos, [muestra]: nuevo });
    if (aviso?.caso === muestra) setAviso(null);
  };
  const comprobar = () => {
    const valores = misTextos.map((t) => (t.trim() === '' ? NaN : Number(t.replace(',', '.'))));
    if (valores.some((v) => !Number.isFinite(v))) { setAviso({ caso: muestra, ok: false, texto: 'Completa tu respuesta antes de comprobar.' }); audio?.playError(); return; }
    const r = tomarRespuestaB1(microscopio, valores);
    const juicio = evaluarRespuestaB1(muestra, semilla, microscopio.focoIdealZ, r);
    setMicroscopio({ respuestas: { ...microscopio.respuestas, [muestra]: r } });
    const n = casosResueltosB1({ ...microscopio, respuestas: { ...microscopio.respuestas, [muestra]: r } }).length;
    if (juicio.ok) {
      audio?.playSuccess();
      setAviso({ caso: muestra, ok: true, texto: n >= CASOS_PARA_APROBAR_B1 ? `Correcto. Ya tienes ${n} casos: pulsa «Validar práctica».` : `Correcto. Llevas ${n} de ${CASOS_PARA_APROBAR_B1} casos.` });
    } else { audio?.playError(); setAviso({ caso: muestra, ok: false, texto: juicio.mensaje ?? 'Revisa tu respuesta.' }); }
  };

  // ── ancho disponible: decide si el microscopio 3D cabe al lado del ocular ──
  const raiz = useRef<HTMLDivElement>(null);
  const [ancho, setAncho] = useState(700);
  useEffect(() => {
    const el = raiz.current; if (!el) return;
    const ro = new ResizeObserver(([e]) => setAncho(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const doble = ancho >= 860;
  /** con poco ancho, las herramientas van sólo con icono (su nombre queda en el título y en aria-label) */
  const angosto = ancho < 720;

  const ocular = (
    <CampoOcular
      ref={campo} caso={muestra} semilla={semilla} mag={objetivoMag} posX={posicionX} posY={posicionY}
      desenfoque={blur} resolucionUm={res} brillo={brillo} contraste={contrasteRelativo(apertura)} lampara={iluminacion} lechoso={seco}
      congelado={congelado} herramienta={herramienta} marco={marco}
      medida={medidas[muestra] ?? null} marcas={misMarcas}
      onMedida={(m) => setMedidas((prev) => ({ ...prev, [muestra]: m }))}
      onMarca={(x, y) => setMarcas((prev) => ({ ...prev, [muestra]: [...(prev[muestra] ?? []), { x, y, cat }] }))}
      onMover={mover} onEnfoque={enfocar}
    />
  );
  const banco = (
    <MicroscopioBanco
      caso={muestra} objetivoMag={objetivoMag} enfoqueMacro={enfoqueMacro} enfoqueMicro={enfoqueMicro} enfoqueZ={enfoqueZ}
      posicionX={posicionX} posicionY={posicionY} iluminacion={iluminacion} apertura={apertura} aceite={aceite}
    />
  );
  const datos = (
    <div data-datos-opticos="">
      <Dato etiqueta="Aumento total" valor={`${aumentoTotal(objetivoMag)}×`} />
      <Dato etiqueta="Campo visible" valor={`⌀ ${campoUm(objetivoMag)} µm`} />
      <Dato etiqueta="AN objetivo · condensador" valor={`${coma(anEfectiva(objetivoMag, aceite))} · ${coma(anCondensador(objetivoMag, aceite, apertura))}`} />
      <Dato etiqueta="Resolución" valor={`${coma(res)} µm`} />
      <Dato etiqueta="Profundidad de campo" valor={`${coma(pdc, pdc < 10 ? 1 : 0)} µm`} />
      <Dato etiqueta="Distancia de trabajo" valor={`${coma(OBJETIVOS_OPTICOS[objetivoMag].dtMm, 2)} mm`} />
    </div>
  );

  return (
    <RaizLabEstrella id="biologia-1">
      <style>{ESTILO}</style>
      <div ref={raiz} className="bio01 flex h-full w-full min-w-0 flex-col overflow-y-auto overflow-x-hidden bg-[#0b1220] font-['Outfit'] text-slate-100" data-estado={status}>
        {/* ── casos ── */}
        <div className="flex shrink-0 flex-wrap items-center gap-1 border-b border-white/10 bg-[#0f1a2b] px-2 py-1.5" role="tablist" aria-label="Casos">
          {ORDEN_CASOS_B1.map((c) => {
            const est = estadoCasoB1(microscopio, c);
            return (
              <button key={c} type="button" role="tab" aria-selected={c === muestra} onClick={() => elegirCaso(c)} data-caso={c}
                title={`${CASOS_B1[c].nombre} · ${CASOS_B1[c].tincion}`}
                className={`${BOTON} !h-8 !gap-1 !px-2 ${c === muestra ? 'bg-cyan-500 text-slate-950' : SUAVE}`}>
                {est === 'correcto' ? <Check size={14} className={c === muestra ? '' : 'text-emerald-400'} /> : est === 'incorrecto' ? <X size={14} className={c === muestra ? '' : 'text-rose-400'} /> : null}
                {CASOS_B1[c].corto}
              </button>
            );
          })}
          <span className="ml-auto shrink-0 rounded-md bg-white/[0.06] px-1.5 py-1 text-[13px] font-semibold text-slate-200" data-progreso="" title="Casos resueltos de los que hacen falta">
            {resueltos}/{CASOS_PARA_APROBAR_B1} casos
          </span>
        </div>

        {/* ── la pregunta del caso ── */}
        <div className="shrink-0 border-b border-white/10 bg-[#0c1626] px-2.5 py-1.5" data-pregunta="">
          <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
            <p className="min-w-[220px] flex-1 text-[14px] font-semibold leading-snug text-white">
              <span className="mr-1.5 text-[13px] font-medium text-cyan-300">{caso.tincion}.</span>{caso.pregunta}
            </p>
            <div className="flex flex-wrap items-center gap-2">
              {caso.opciones ? (
                <select value={misTextos[0]} onChange={(e) => escribir(0, e.target.value)} aria-label={caso.campos[0].etiqueta}
                  className="h-9 max-w-[250px] rounded-lg border border-amber-500/50 bg-slate-950 px-2 text-[13px] text-white outline-none focus:border-amber-400">
                  <option value="">Elige…</option>
                  {caso.opciones.map((o, k) => <option key={o} value={k}>{o}</option>)}
                </select>
              ) : caso.campos.map((f, k) => (
                <label key={f.clave} className="flex items-center gap-1.5 text-[13px] text-slate-200">
                  {f.etiqueta}
                  <input type="number" inputMode="decimal" value={misTextos[k] ?? ''} placeholder="¿?" onChange={(e) => escribir(k, e.target.value)}
                    className="h-9 w-[68px] rounded-lg border border-amber-500/50 bg-slate-950 px-2 font-mono text-[14px] text-white outline-none focus:border-amber-400" />
                  {f.unidad && <span className="text-slate-400">{f.unidad}</span>}
                </label>
              ))}
              <button type="button" onClick={comprobar} className={`${BOTON} bg-amber-500 text-slate-950 hover:bg-amber-400`}>Comprobar</button>
            </div>
          </div>
          <p className={`mt-1 text-[13px] leading-snug ${aviso?.caso === muestra ? (aviso.ok ? 'text-emerald-300' : 'text-rose-300') : 'text-slate-400'}`} role="status" data-aviso="">
            {aviso?.caso === muestra ? aviso.texto : caso.metodo}
            {caso.tipo === 'contar' && !(aviso?.caso === muestra) && ` Marco: ${coma(ladoMarcoUm(objetivoMag), 0)} × ${coma(ladoMarcoUm(objetivoMag), 0)} µm.`}
          </p>
        </div>

        {/* ── la imagen ── */}
        <div className="flex min-h-[250px] flex-1 bg-[#05070a]">
          <div className="relative min-h-0 min-w-0 flex-1" data-escena="ocular">
            {doble || !verBanco ? ocular : banco}
            {pista && (doble || !verBanco) && (
              <div className="pointer-events-none absolute left-2 top-2 max-w-[70%] rounded-lg border border-amber-400/40 bg-[#1c1407]/90 px-2.5 py-1 text-[13px] font-medium text-amber-200" data-pista="">{pista}</div>
            )}
          </div>
          {doble && (
            <aside className="flex w-[clamp(270px,30%,340px)] shrink-0 flex-col border-l border-white/10 bg-[#0c1626]">
              <div className="relative min-h-0 flex-1">{banco}</div>
              <div className="shrink-0 border-t border-white/10 px-3 py-2">{datos}</div>
            </aside>
          )}
        </div>

        {/* ── mandos del instrumento ── */}
        <div className="shrink-0 border-t border-white/10 bg-[#0f1a2b] px-2.5 py-2" data-mandos="">
          <div className="flex flex-wrap items-center gap-x-1.5 gap-y-1.5">
            <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Revólver de objetivos">
              {MAGS.map((m) => (
                <button key={m} type="button" data-objetivo={m} aria-pressed={m === objetivoMag}
                  onClick={() => { audio?.playPop(); setMicroscopio({ objetivoMag: m }); }}
                  title={`Objetivo ${m}× · AN ${coma(OBJETIVOS_OPTICOS[m].an)}${m === 100 ? ' · inmersión en aceite' : ''}`}
                  className={`flex h-8 items-center gap-1 rounded-md px-1.5 text-[13px] font-bold ${m === objetivoMag ? 'bg-cyan-500 text-slate-950' : 'text-slate-200 hover:text-white'}`}>
                  <span className="h-2.5 w-2.5 rounded-full border border-black/40" style={{ background: OBJETIVOS_OPTICOS[m].anillo }} />{m}×
                </button>
              ))}
            </div>
            <button type="button" data-aceite="" aria-label={aceite ? 'Quitar el aceite de inmersión' : 'Aplicar aceite de inmersión'} disabled={objetivoMag !== 100} aria-pressed={aceite}
              onClick={() => { audio?.playPop(); setMicroscopio({ aceiteInmersionAplicado: !aceite }); }}
              title="Gota de aceite de inmersión entre el cubreobjetos y el objetivo de 100×"
              className={`${BOTON} ${aceite ? 'border border-amber-400 bg-amber-500/25 text-amber-100' : SUAVE}`}>
              <Droplet size={15} />{(!angosto || ancho >= 600) && (aceite ? 'Con aceite' : 'Aceite')}
            </button>
            <div className="flex rounded-lg border border-white/10 bg-white/[0.04] p-0.5" role="group" aria-label="Herramienta del cursor">
              {([['mover', 'Platina', Hand], ['medir', 'Regla', Ruler], ['marcar', 'Contar', CircleDot]] as const).map(([h, t, Icono]) => (
                <button key={h} type="button" data-herramienta={h} aria-label={t} aria-pressed={herramienta === h} onClick={() => setHerramienta(h)}
                  title={h === 'mover' ? 'Arrastra la imagen para mover la platina' : h === 'medir' ? 'Arrastra de un extremo a otro para medir en µm' : 'Pulsa sobre cada célula para marcarla y llevar la cuenta'}
                  className={`flex h-8 items-center gap-1 rounded-md px-2 text-[13px] font-semibold ${herramienta === h ? 'bg-cyan-500 text-slate-950' : 'text-slate-200 hover:text-white'}`}>
                  <Icono size={14} />{!angosto && t}
                </button>
              ))}
            </div>
            <button type="button" data-marco="" aria-label="Marco de conteo" aria-pressed={marco} onClick={() => setMarcoManual(!marco)} title="Marco de conteo: un tercio del campo" className={`${BOTON} ${marco ? ACTIVO : SUAVE}`}>
              <Square size={14} />{!angosto && 'Marco'}
            </button>
            {muestra === 'estanque' && (
              <button type="button" data-congelar="" aria-label={congelado ? 'Seguir' : 'Congelar la imagen'} aria-pressed={congelado} onClick={() => setCongelado(!congelado)} title="Congela la imagen para medir" className={`${BOTON} ${congelado ? ACTIVO : SUAVE}`}>
                {congelado ? <Play size={14} /> : <Pause size={14} />}{!angosto && (congelado ? 'Seguir' : 'Congelar')}
              </button>
            )}
            <button type="button" data-capturar="" aria-label="Capturar micrografía" onClick={capturar} title="Guarda la micrografía en la bitácora" className={`${BOTON} ${SUAVE}`}><Camera size={15} />{!angosto && 'Capturar'}</button>
            {!doble && (
              <button type="button" data-ver-banco="" aria-pressed={verBanco} onClick={() => setVerBanco(!verBanco)} title="Alterna entre el ocular y el microscopio en el banco"
                aria-label={verBanco ? 'Ver el ocular' : 'Ver el microscopio'} className={`${BOTON} ${verBanco ? ACTIVO : SUAVE}`}>
                <Microscope size={15} />{!angosto && (verBanco ? 'Ver ocular' : 'Ver microscopio')}
              </button>
            )}
          </div>

          {herramienta === 'marcar' && (
            <div className="mt-1.5 flex flex-wrap items-center gap-2 text-[13px]" data-contador="">
              {cats.map((c, k) => (
                <button key={c} type="button" onClick={() => setCat(k)} aria-pressed={cat === k}
                  className={`flex h-8 items-center gap-1.5 rounded-lg border px-2 font-semibold ${cat === k ? 'border-white/60 bg-white/10 text-white' : 'border-white/15 text-slate-300'}`}>
                  <span className="h-3 w-3 rounded-full border-2" style={{ borderColor: COLORES_MARCA[k % 3] }} />{c}
                  <span className="font-mono tabular-nums text-white">{misMarcas.filter((m) => m.cat === k).length}</span>
                </button>
              ))}
              <button type="button" onClick={() => setMarcas({ ...marcas, [muestra]: misMarcas.slice(0, -1) })} disabled={!misMarcas.length} className={`${BOTON} !h-8 ${SUAVE}`}>Deshacer</button>
              <button type="button" onClick={() => setMarcas({ ...marcas, [muestra]: [] })} disabled={!misMarcas.length} className={`${BOTON} !h-8 ${SUAVE}`}><Trash2 size={14} />Borrar</button>
            </div>
          )}

          <div className={`mt-2 grid gap-x-4 gap-y-1.5 ${ancho >= 760 ? 'grid-cols-6' : ancho >= 430 ? 'grid-cols-3' : 'grid-cols-2'}`}>
            <Mando etiqueta="Macrométrico" valor={enfoqueMacro} min={0} max={100} paso={1} texto={`${enfoqueMacro}`} title="Enfoque grueso: cada división sube la platina 10 µm" onChange={(v) => setMicroscopio({ enfoqueMacro: v })} />
            <Mando etiqueta="Micrométrico" valor={enfoqueMicro} min={0} max={10} paso={0.1} texto={`${coma(enfoqueMicro, 1)} µm`} title="Enfoque fino. También con la rueda del ratón sobre la imagen" onChange={(v) => setMicroscopio({ enfoqueMicro: v })} />
            <Mando etiqueta="Diafragma" valor={Math.round(apertura * 100)} min={APERTURA_MIN * 100} max={APERTURA_MAX * 100} paso={5} texto={`${Math.round(apertura * 100)} %`} title="Diafragma del condensador: cerrado da contraste y profundidad; abierto da resolución" onChange={(v) => setMicroscopio({ apertura: v / 100 })} />
            <Mando etiqueta="Lámpara" valor={iluminacion} min={0} max={100} paso={1} texto={`${iluminacion} %`} onChange={(v) => setMicroscopio({ iluminacion: v })} />
            <Mando etiqueta="Platina X" valor={Math.round(posicionX)} min={-RECORRIDO_PLATINA_UM} max={RECORRIDO_PLATINA_UM} paso={1} texto={`${Math.round(posicionX)} µm`} onChange={(v) => setMicroscopio({ posicionX: v })} />
            <Mando etiqueta="Platina Y" valor={Math.round(posicionY)} min={-RECORRIDO_PLATINA_UM} max={RECORRIDO_PLATINA_UM} paso={1} texto={`${Math.round(posicionY)} µm`} onChange={(v) => setMicroscopio({ posicionY: v })} />
          </div>

          {!doble && (
            <p className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[13px] tabular-nums text-slate-300" data-datos-opticos="">
              <span><b className="text-white">{aumentoTotal(objetivoMag)}×</b></span>
              <span>campo ⌀ {campoUm(objetivoMag)} µm</span>
              <span>resuelve {coma(res)} µm</span>
              <span>prof. de campo {coma(pdc, pdc < 10 ? 1 : 0)} µm</span>
            </p>
          )}
        </div>
      </div>
    </RaizLabEstrella>
  );
}
