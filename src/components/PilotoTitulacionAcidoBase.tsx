"use client";
/**
 * QUI-07 · Titulación ácido-base.
 *
 * Dos modos sobre el mismo banco (bureta de 50 mL, matraz sobre agitador, pH-metro):
 *  · EXPLORACIÓN (estado inicial): un titulador automático valora un ácido CONOCIDO
 *    (HCl, ácido acético o fosfórico) con el indicador elegido. Entra ya empezado: la
 *    bureta gotea, el color evoluciona y la curva crece; dosifica rápido donde el pH apenas
 *    cambia y gota a gota en el salto, y al terminar prepara otra alícuota.
 *  · RETO: el HCl de concentración desconocida del store. El alumno purga, echa la
 *    fenolftaleína, gira la llave y se detiene en el primer rosa persistente. Cada gota que
 *    sale de la bureta se apunta con `addDropNaOH`; el validador (`validarQ7`) y el store
 *    no cambian, y nada dibuja el equivalente ni la concentración antes de validar.
 *
 * La química (balance de carga exacto, indicador por su equilibrio, Beer–Lambert) vive en
 * `simuladores/qmi07/acidobase.ts`; el reloj único, en `reloj.ts`.
 */
import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { useShallow } from 'zustand/react/shallow';
import { RotateCcw, Send, Pause, Play, Scan, Tags, Droplets, FlaskConical, RefreshCcw } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import { validarQ7 } from '@/domain/quimica';
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, GrupoControles, BotonLab, Segmentado } from '@/components/simulador/LabLayout';
import { RelojTitulacion, CONCENTRACION_EXPLORACION } from './simuladores/qmi07/reloj';
import { ACIDOS, ACIDOS_LISTA, AGUA_ML, INDICADORES, INDICADORES_LISTA, V_GOTA_ML, volumenEquivalencia, type IdAcido, type IdIndicador, type Sistema } from './simuladores/qmi07/acidobase';
import { DockTitulacion, cifra, useTickReloj } from './simuladores/qmi07/Dock';
import type { ModoQ7, VistaQ7 } from './simuladores/qmi07/Titulacion3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Titulacion3DScene = dynamic(() => import('./simuladores/qmi07/Titulacion3DScene'), {
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

const sistemaExploracion = (acido: IdAcido): Sistema => ({ acido, ca: CONCENTRACION_EXPLORACION[acido], va: 25, vAgua: AGUA_ML, cb: 0.1 });
const ACIDO_INICIAL: IdAcido = 'HCl';
const INDICADOR_INICIAL: IdIndicador = 'azulBromotimol';
const NOMBRE_CORTO: Record<IdIndicador, string> = { fenolftaleina: 'Fenolftaleína', naranjaMetilo: 'Naranja de metilo', azulBromotimol: 'Azul de bromotimol' };
const COLOR_PUNTO: Record<IdIndicador, string> = { fenolftaleina: '#e05aa3', naranjaMetilo: '#ef7d32', azulBromotimol: '#3b7fd6' };

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
function LecturasVivas({ reloj }: { reloj: React.MutableRefObject<RelojTitulacion> }) {
  useTickReloj(reloj, 12);
  const r = reloj.current;
  const vacia = r.vbSalida >= 50;
  const goteo = r.Q <= 1e-6 ? 'cerrada' : r.chorro ? 'chorro' : cifra(r.gotasPorSegundo, 1);
  return (
    <>
      <Lectura etiqueta="Bureta" valor={vacia ? 'vacía' : cifra(r.vbSalida, 2)} unidad={vacia ? undefined : 'mL'} acento title="Lectura de la bureta: mL de NaOH que han salido" />
      <Lectura etiqueta="pH" valor={cifra(r.lectura.ph, 2)} title="Lo que mide el electrodo en el matraz" />
      <Lectura etiqueta="Llave" valor={goteo} unidad={r.Q > 1e-6 && !r.chorro ? 'gotas/s' : undefined} title={`Una gota de la punta = ${cifra(V_GOTA_ML, 3)} mL`} />
    </>
  );
}

/** Campo numérico propio con coma decimal (un `type=number` nativo mostraría punto). */
function CampoDecimal({ valor, onChange, onEnter, etiqueta, id }: { valor: string; onChange: (s: string) => void; onEnter: () => void; etiqueta: string; id: string }) {
  return (
    <input id={id} type="text" inputMode="decimal" autoComplete="off" spellCheck={false} aria-label={etiqueta} placeholder="0,000"
      value={valor} onChange={(e) => onChange(e.target.value.replace(/[^0-9.,]/g, '').replace('.', ','))}
      onKeyDown={(e) => e.key === 'Enter' && onEnter()}
      className="h-8 w-24 rounded-lg border border-white/15 bg-white/5 px-2.5 font-mono text-[13px] text-white outline-none placeholder:text-slate-500 focus:border-[#219EBC]" />
  );
}

export default function PilotoTitulacionAcidoBase({ onValidate }: { onValidate?: () => void; isWorktableDark?: boolean }) {
  const { titulacion, addDropNaOH, toggleIndicadorP7, togglePurgaP7, resetP7, setRespuestaP7, validarP7 } = useSimuladorStore(useShallow((s) => ({
    titulacion: s.titulacion, addDropNaOH: s.addDropNaOH, toggleIndicadorP7: s.toggleIndicadorP7,
    togglePurgaP7: s.togglePurgaP7, resetP7: s.resetP7, setRespuestaP7: s.setRespuestaP7, validarP7: s.validarP7,
  })));

  // ── modo, relojes y ajustes ──
  const [modo, setModo] = useState<ModoQ7>('explorar');
  const [acido, setAcido] = useState<IdAcido>(ACIDO_INICIAL);
  const [indicador, setIndicador] = useState<IdIndicador>(INDICADOR_INICIAL);
  const [rpm, setRpm] = useState(400);
  const [rapido, setRapido] = useState(false);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [vista, setVista] = useState<VistaQ7>('matraz');
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  // la curva crece desde el primer segundo: el dock entra abierto si va AL LADO de la escena
  // (pantallas ≥ 1500 px); por debajo LabLayout lo superpone y entra plegado
  const [panelInicial] = useState<boolean | undefined>(() => (typeof window !== 'undefined' && window.innerWidth >= 1500 ? true : undefined));

  const relojE = useRef<RelojTitulacion | null>(null);
  if (!relojE.current) {
    const s = sistemaExploracion(ACIDO_INICIAL);
    relojE.current = new RelojTitulacion(s, { auto: true, indicador: INDICADOR_INICIAL, conIndicador: true });
    // entra ya empezada: a un 85 % del equivalente (el salto llega en ~20 s)
    relojE.current.adelantarA(0.85 * volumenEquivalencia(s));
  }
  const relojR = useRef<RelojTitulacion | null>(null);
  if (!relojR.current) {
    relojR.current = new RelojTitulacion({ acido: 'HCl', ca: titulacion.ca, va: titulacion.va, vAgua: AGUA_ML, cb: titulacion.cb }, { auto: false });
    relojR.current.purgada = titulacion.purgada;
  }
  const reloj = useRef<RelojTitulacion>(relojE.current);
  reloj.current = modo === 'explorar' ? relojE.current : relojR.current;

  useEffect(() => { relojE.current!.rpm = rpm; relojR.current!.rpm = rpm; }, [rpm]);
  useEffect(() => { const f = rapido ? 4 : 1; relojE.current!.factor = f; relojR.current!.factor = f; }, [rapido]);
  useEffect(() => { relojE.current!.pausa = pausa; relojR.current!.pausa = pausa; }, [pausa]);

  // exploración: otro ácido u otro indicador = alícuota nueva y el frasco gotero dosifica
  // (se compara con lo que ya tiene el reloj: el doble efecto del modo estricto no reinicia nada)
  useEffect(() => {
    const r = relojE.current!;
    if (r.sistema.acido === acido && r.indicador === indicador) return;
    r.reiniciar(sistemaExploracion(acido), indicador);
    r.dosificar(indicador);
  }, [acido, indicador]);

  // ── reto: el reloj sigue al store ──
  useEffect(() => {
    const r = relojR.current!;
    r.onSalida = (mL) => addDropNaOH(mL);
    return () => { r.onSalida = undefined; };
  }, [addDropNaOH]);
  useEffect(() => {
    const r = relojR.current!;
    const { ca, va, cb } = titulacion;
    if (r.sistema.ca !== ca || r.sistema.va !== va || r.sistema.cb !== cb) {
      r.reiniciar({ ca, va, cb }, titulacion.indicador ? 'fenolftaleina' : null);
    }
  }, [titulacion.ca, titulacion.va, titulacion.cb]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => { relojR.current!.sincronizar(titulacion.volumenBase); }, [titulacion.volumenBase]);
  useEffect(() => { relojR.current!.purgada = titulacion.purgada; }, [titulacion.purgada]);
  useEffect(() => {
    const r = relojR.current!;
    if (titulacion.indicador && r.indicador !== 'fenolftaleina') r.dosificar('fenolftaleina');
  }, [titulacion.indicador]);

  const [llave, setLlave] = useState(0);
  useEffect(() => { relojR.current!.aperturaObjetivo = llave / 100; }, [llave]);
  const [ansCa, setAnsCa] = useState('');
  const [intentado, setIntentado] = useState(false);
  const validado = titulacion.status === 'success';
  const veredicto = validarQ7(titulacion);

  const purgar = () => { if (titulacion.purgada) return; togglePurgaP7(); audio?.playPop(); };
  const echarIndicador = () => {
    if (titulacion.indicador) return;
    relojR.current!.dosificar('fenolftaleina');
    toggleIndicadorP7();
    audio?.playPop();
  };
  const enviar = () => {
    const val = parseFloat(ansCa.replace(',', '.'));
    if (!Number.isFinite(val)) return;
    setLlave(0); relojR.current!.aperturaObjetivo = 0;
    setRespuestaP7(val);
    setIntentado(true);
    // un solo juez: el validador de la práctica (quiz + modal comunes)
    if (onValidate) onValidate();
    else if (validarP7()) audio?.playSuccess(); else audio?.playError();
  };
  const reiniciarReto = () => {
    resetP7();
    const r = relojR.current!;
    r.reiniciar(undefined, null);
    r.purgada = false;
    setLlave(0); setIntentado(false); setAnsCa('');
    audio?.playPop();
  };

  // ── aviso que aparece una vez por modo y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<ModoQ7>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(modo)) return;
    vistos.current.add(modo);
    setAviso({
      n: Date.now(),
      texto: modo === 'explorar'
        ? 'El titulador gotea más lento al acercarse al salto. Mira el color y la curva.'
        : 'Purga, echa fenolftaleína y gira la llave: para en el primer rosa que no se va.',
    });
  }, [modo, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  const explorar = modo === 'explorar';
  const sistemaReal = useMemo<Sistema>(() => ({ acido: 'HCl', ca: titulacion.ca, va: titulacion.va, vAgua: AGUA_ML, cb: titulacion.cb }), [titulacion.ca, titulacion.va, titulacion.cb]);

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#06090c]" data-modo-q7={modo}>
      <Titulacion3DScene reloj={reloj} modo={modo} vista={vista} calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
      {/* capas y vistas */}
      <div className="pointer-events-none absolute left-2 top-2 flex flex-wrap items-center gap-1.5">
        <Pildora activo={vista === 'matraz'} onClick={() => setVista('matraz')} title="El matraz, la llave y el pH-metro">Matraz</Pildora>
        <Pildora activo={vista === 'montaje'} onClick={() => setVista('montaje')} title="Todo el montaje, con la bureta entera">Montaje</Pildora>
        <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
        <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
      </div>
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1220]/75 px-2 py-1 font-mono text-[11px] font-semibold text-cyan-100/90 backdrop-blur" data-ritmo-q7="">
        {pausa ? 'En pausa' : rapido ? 'Cámara rápida ×4' : 'Tiempo real'}
      </div>
      <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: vidrio y líquido con transmisión y posproceso)"
        className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1220]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-q7={calidad}>
        Calidad: {calidad}
      </button>
      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
          <span className="aviso-q7 max-w-[520px] rounded-lg border border-white/10 bg-[#0a1420]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-q7="">
            {aviso.texto}
          </span>
        </div>
      )}
      <style>{`.aviso-q7{animation:avisoQ7 7s ease forwards}@keyframes avisoQ7{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-q7{animation:none}}`}</style>
    </div>
  );

  const barraSuperior = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <div className="mr-1 flex shrink-0 flex-col leading-tight">
        <span className="text-[10px] font-semibold uppercase tracking-wider text-slate-400">{explorar ? 'Exploración' : 'Reto'}</span>
        <span className="text-[13px] font-bold text-white">
          {explorar ? `${ACIDOS[acido].formula} ${cifra(CONCENTRACION_EXPLORACION[acido], 3)} M` : 'HCl ¿? M'} · NaOH {cifra(explorar ? 0.1 : titulacion.cb, 3)} M
        </span>
      </div>
      <LecturasVivas reloj={reloj} />
    </div>
  );

  const controlesComunes = (
    <GrupoControles className="items-end">
      <Segmentado<ModoQ7> etiqueta="Modo" valor={modo} onChange={(v) => { setModo(v); audio?.playPop(); }}
        opciones={[{ valor: 'explorar', texto: 'Exploración' }, { valor: 'reto', texto: 'Reto' }]} />
      <label className="flex w-36 min-w-[120px] flex-col gap-1">
        <span className="flex justify-between text-[11px] font-semibold text-slate-300"><span>Agitación</span><span className="font-mono tabular-nums text-white">{rpm} rpm</span></span>
        <input type="range" min={0} max={1200} step={50} value={rpm} onChange={(e) => setRpm(Number(e.target.value))} aria-label="Velocidad del agitador magnético"
          className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#219EBC]" />
      </label>
      <Segmentado<string> etiqueta="Ritmo" valor={rapido ? '4' : '1'} onChange={(v) => { setRapido(v === '4'); audio?.playPop(); }}
        opciones={[{ valor: '1', texto: '×1' }, { valor: '4', texto: '×4' }]} />
      <BotonLab variante="secundario" title={pausa ? 'Reanudar' : 'Pausar'} onClick={() => setPausa((p) => !p)}>
        {pausa ? <Play size={14} /> : <Pause size={14} />}
      </BotonLab>
    </GrupoControles>
  );

  const controlesExplorar = (
    <GrupoControles className="items-end">
      <Segmentado<IdAcido> etiqueta="Ácido" valor={acido} onChange={(v) => { setAcido(v); audio?.playPop(); }}
        opciones={ACIDOS_LISTA.map((a) => ({ valor: a, texto: ACIDOS[a].formula }))} />
      <div className="flex flex-col gap-1">
        <span className="text-[11px] font-semibold text-slate-300">Indicador</span>
        <div className="flex flex-wrap rounded-lg border border-white/10 bg-white/[0.04] p-0.5">
          {INDICADORES_LISTA.map((i) => (
            <button key={i} type="button" onClick={() => { setIndicador(i); audio?.playPop(); }} aria-pressed={indicador === i}
              title={`${INDICADORES[i].nombre}: vira entre pH ${cifra(INDICADORES[i].rango[0], 1)} y ${cifra(INDICADORES[i].rango[1], 1)}`}
              className={`flex h-7 items-center gap-1.5 rounded-md px-2.5 text-[11px] font-semibold ${indicador === i ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>
              <i className="block h-2 w-2 rounded-full" style={{ background: COLOR_PUNTO[i] }} />{NOMBRE_CORTO[i]}
            </button>
          ))}
        </div>
      </div>
      <BotonLab variante="secundario" title="Alícuota nueva y bureta enrasada a 0,00 mL" onClick={() => { const r = relojE.current!; r.reiniciar(sistemaExploracion(acido), indicador); r.dosificar(indicador); audio?.playPop(); }}>
        <RefreshCcw size={14} /> Nueva alícuota
      </BotonLab>
    </GrupoControles>
  );

  const controlesReto = (
    <div className="space-y-2">
      <GrupoControles className="items-end">
        <div className="flex gap-1.5">
          <button type="button" onClick={purgar} aria-pressed={titulacion.purgada} disabled={titulacion.purgada}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${titulacion.purgada ? 'border-sky-400/50 bg-sky-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:text-white'}`}>
            <FlaskConical size={13} /> {titulacion.purgada ? 'Bureta purgada' : 'Purgar bureta'}
          </button>
          <button type="button" onClick={echarIndicador} aria-pressed={titulacion.indicador} disabled={titulacion.indicador}
            className={`flex h-8 items-center gap-1.5 rounded-lg border px-3 text-[12px] font-semibold transition-colors ${titulacion.indicador ? 'border-pink-400/50 bg-pink-500/20 text-white' : 'border-white/10 bg-white/5 text-slate-200 hover:text-white'}`}>
            <Droplets size={13} /> {titulacion.indicador ? 'Fenolftaleína' : 'Echar fenolftaleína'}
          </button>
        </div>
        <label className="flex w-52 min-w-[150px] flex-col gap-1">
          <span className="flex justify-between text-[11px] font-semibold text-slate-300"><span>Llave</span><span className="font-mono tabular-nums text-white">{llave} %</span></span>
          <input type="range" min={0} max={100} step={1} value={llave} onChange={(e) => setLlave(Number(e.target.value))} aria-label="Apertura de la llave de la bureta"
            disabled={titulacion.volumenBase >= 50} className="h-1.5 w-full cursor-pointer appearance-none rounded-full bg-white/15 accent-[#FB8500]" />
        </label>
        <BotonLab variante="secundario" onClick={() => setLlave(0)} title="Cerrar la llave">Cerrar</BotonLab>
      </GrupoControles>
      <GrupoControles className="items-end">
        <div className="flex flex-col gap-1">
          <label htmlFor="ca-q7" className="text-[11px] font-semibold text-slate-300">[HCl] calculada</label>
          <div className="flex items-center gap-1.5">
            <CampoDecimal id="ca-q7" etiqueta="Concentración de HCl calculada, en mol/L" valor={ansCa} onChange={setAnsCa} onEnter={enviar} />
            <span className="text-[12px] text-slate-400">mol/L</span>
          </div>
        </div>
        <BotonLab variante={validado ? 'primario' : 'acento'} onClick={enviar}><Send size={13} /> Enviar</BotonLab>
        <button type="button" aria-label="Repetir la titulación" title="Repetir la titulación" onClick={reiniciarReto}
          className="flex h-8 w-8 items-center justify-center rounded-lg border border-white/15 bg-white/5 text-slate-200 hover:border-[#219EBC]"><RotateCcw size={15} /></button>
        {(validado || (intentado && titulacion.status === 'error' && veredicto.mensaje)) && (
          <span role="status" className={`text-[12px] ${validado ? 'font-semibold text-emerald-300' : 'text-amber-200'}`}>
            {validado ? 'Concentración de HCl determinada' : veredicto.mensaje}
          </span>
        )}
      </GrupoControles>
    </div>
  );

  const controles = (
    <div className="space-y-2">
      {controlesComunes}
      {explorar ? controlesExplorar : controlesReto}
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
      panelLateral={<DockTitulacion reloj={reloj} modo={modo} revela={!explorar && validado} sistemaReal={!explorar && validado ? sistemaReal : undefined} />}
      tituloPanel="Instrumentos"
      panelAbiertoInicial={panelInicial}
    />
  );
}
