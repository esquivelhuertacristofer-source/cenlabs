"use client";
/**
 * BIO-04 · Fotosíntesis.
 *
 * La escena es el CLOROPLASTO en media sección trabajando con la luz de la lámpara (y,
 * con «Tilacoide», su membrana ampliada). El reto no cambia: con una ramita de Elodea,
 * recoger en un ensayo de 10 min al menos la meta de O₂ sin acercar la lámpara más de la
 * distancia mínima (store `fotosintesis`, juez `evaluarB4`).
 *
 * Además del color y la distancia, el alumno puede explorar el CO₂ (NaHCO₃ del agua) y la
 * temperatura del baño. El reto se mide en sus condiciones (25 °C, 0,1 %): un ensayo hecho
 * fuera de ellas se guarda aquí como exploración y NO va al store, así el juez y la tabla
 * de la bitácora nunca discrepan de lo medido.
 *
 * Un solo reloj (`RelojFoto`): la escena lo avanza cada cuadro y el dock, la barra y el
 * tubo leen el mismo estado. Las curvas teóricas y el espectro de acción sólo se dibujan
 * después de validar.
 */
import React, { useCallback, useEffect, useRef, useState } from 'react';
import dynamic from 'next/dynamic';
import { Play, Pause, RotateCcw, ShieldCheck, Tags, Scan, FlaskConical, Microscope, Thermometer } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
import { NOMBRE_LUZ_B4, D_MAX_B4, DURACION_B4 } from '@/domain/biologia';
import type { ColorLuzB4 } from '@/store/types';
import { LAMPARA, REFERENCIA, NAHCO3_OPCIONES, TEMPERATURAS, esReferencia, CAMARA_LENTA_MEMBRANA, type NaHCO3 } from './simuladores/bio04/fotosintesis';
import { RelojFoto, CAMARA_RAPIDA_ENSAYO, type EnsayoHecho } from './simuladores/bio04/reloj';
import { DockFoto, cifra, useTickReloj, type EnsayoDock } from './simuladores/bio04/Dock';
import type { VistaB4 } from './simuladores/bio04/Fotosintesis3DScene';

// la escena 3D va en su propio chunk (el dock y el reloj no arrastran three)
const Fotosintesis3DScene = dynamic(() => import('./simuladores/bio04/Fotosintesis3DScene'), {
  ssr: false,
  loading: () => <div className="absolute inset-0 bg-[#050c0b]" />,
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

// Solo el color de la lámpara: la eficiencia de cada longitud de onda es lo que el alumno DESCUBRE.
const LAMPARAS: ColorLuzB4[] = ['blanco', 'rojo', 'amarillo', 'verde', 'azul'];

/** Pastilla de la escena (vistas y capas). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`pointer-events-auto flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-emerald-300/50 bg-[#0f2a22]/85 text-white' : 'border-white/10 bg-[#0b1714]/70 text-slate-300 hover:text-white'}`}>
      {children}
    </button>
  );
}

/** Lecturas de la barra superior que cambian con el reloj (las del MISMO cuadro que la escena). */
function LecturasVivas({ reloj, meta }: { reloj: React.MutableRefObject<RelojFoto>; meta: number }) {
  useTickReloj(reloj, 8);
  const r = reloj.current;
  const e = r.ensayo;
  return (
    <>
      <Lectura etiqueta="PPFD" valor={cifra(r.I, 0)} unidad="µmol·m⁻²·s⁻¹" title="Luxómetro cuántico en la ramita: cae con el cuadrado de la distancia" />
      <Lectura etiqueta="Burbujas" valor={cifra(r.burbujasMin, 0)} unidad="/min" title="Burbujas de O₂ por minuto (Ø 2,7 mm)" />
      {e && <Lectura etiqueta="Ensayo" valor={`${cifra(e.tMin, 1)}/${DURACION_B4} min · ${cifra(e.o2, 2)} mL`} acento title={`Cámara rápida ×${cifra(CAMARA_RAPIDA_ENSAYO, 0)}`} />}
      {!e && r.ultimo && <Lectura etiqueta="Último" valor={`${cifra(r.ultimo.o2, 2)} mL`} acento={r.ultimo.reto && r.ultimo.o2 >= meta} />}
    </>
  );
}

export default function PilotoFotosintesis({ onValidate }: { onValidate?: () => void }) {
  const fotosintesis = useSimuladorStore((s) => s.fotosintesis);
  const setFotosintesis = useSimuladorStore((s) => s.setFotosintesis);
  const registrarEnsayoB4 = useSimuladorStore((s) => s.registrarEnsayoB4);
  const resetB4 = useSimuladorStore((s) => s.resetB4);
  const { distancia, color, dMin, meta, ensayos, status } = fotosintesis;
  const dEfectiva = Math.max(dMin, distancia);

  // ── condiciones locales (exploración) y vista ──
  const [nahco3, setNahco3] = useState<NaHCO3>(REFERENCIA.nahco3);
  const [T, setT] = useState<number>(REFERENCIA.T);
  const [vista, setVista] = useState<VistaB4>('cloroplasto');
  const [cortina, setCortina] = useState(false);
  const [reducido] = useState(prefiereReducirMovimiento);
  const [pausa, setPausa] = useState(reducido);
  const [rotulos, setRotulos] = useState(false);
  const [encuadre, setEncuadre] = useState(0);
  const [calidad, setCalidad] = useState<Calidad>('alta');
  useEffect(() => { setCalidad(detectarCalidad()); }, []);
  const [explor, setExplor] = useState<EnsayoDock[]>([]);
  const referencia = esReferencia({ nahco3, T });

  // ── reloj único ──
  const reloj = useRef<RelojFoto | null>(null);
  if (!reloj.current) reloj.current = new RelojFoto({ color, distancia: dEfectiva, nahco3, T });
  const relojRef = reloj as React.MutableRefObject<RelojFoto>;
  useEffect(() => { relojRef.current.fijar({ color, distancia: dEfectiva, nahco3, T }); }, [color, dEfectiva, nahco3, T, relojRef]);
  useEffect(() => { relojRef.current.pausa = pausa; }, [pausa, relojRef]);

  // ── ensayo ──
  const [midiendo, setMidiendo] = useState(false);
  const fin = useCallback((h: EnsayoHecho) => {
    if (h.reto) registrarEnsayoB4();   // el store calcula el mismo O₂ (o2EnsayoB4): mismas condiciones
    else setExplor((l) => [...l, { color: h.cond.color, distancia: h.cond.distancia, o2: h.o2, reto: false, T: h.cond.T, nahco3: h.cond.nahco3 }].slice(-8));
    setMidiendo(false);
  }, [registrarEnsayoB4]);
  useEffect(() => { relojRef.current.onFin = fin; }, [fin, relojRef]);
  const medir = () => {
    if (midiendo) return;
    setMidiendo(true);
    relojRef.current.iniciarEnsayo();
  };
  // si la escena no pinta (pestaña oculta, lienzo perdido), el panel avanza el reloj para no colgar el ensayo
  useEffect(() => {
    let id = 0, previo = performance.now();
    const bucle = (ahora: number) => {
      id = requestAnimationFrame(bucle);
      const r = relojRef.current;
      if (r.ensayo && ahora - r.ultimoPaso > 250) r.paso((ahora - previo) / 1000, ahora);
      previo = ahora;
    };
    id = requestAnimationFrame(bucle);
    return () => cancelAnimationFrame(id);
  }, [relojRef]);

  // ── aviso que aparece una vez por vista y se desvanece (cuando la escena ya se ve) ──
  const [listo, setListo] = useState(false);
  const onListo = useCallback(() => setListo(true), []);
  const vistos = useRef<Set<VistaB4>>(new Set());
  const [aviso, setAviso] = useState<{ texto: string; n: number } | null>(null);
  useEffect(() => {
    if (!listo || vistos.current.has(vista)) return;
    vistos.current.add(vista);
    setAviso({
      n: Date.now(),
      texto: vista === 'cloroplasto'
        ? 'La luz de la lámpara ya entra: cada fotón absorbido mueve electrones y el O₂ sale. Mide 10 min y alcanza la meta.'
        : 'La membrana del tilacoide a cámara lenta: dos fotones por electrón, H⁺ al lumen y la ATP sintasa girando.',
    });
  }, [vista, listo]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 7000);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // cambio de vista con cortina (oculta el salto de cámara)
  const cambiarVista = (v: VistaB4) => {
    if (v === vista) return;
    if (reducido) { setVista(v); return; }
    setCortina(true);
    window.setTimeout(() => { setVista(v); window.setTimeout(() => setCortina(false), 80); }, 230);
  };

  const validado = status === 'success';
  // sólo en desarrollo: `?revela` enseña el dock como queda tras validar (para revisarlo sin pasar el cuestionario)
  const [revelaDev] = useState(() => process.env.NODE_ENV !== 'production' && typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('revela'));
  const todos: EnsayoDock[] = [
    ...ensayos.map((e) => ({ color: e.color, distancia: e.distancia, o2: e.o2, reto: true, T: REFERENCIA.T, nahco3: REFERENCIA.nahco3 })),
    ...explor,
  ];

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#050c0b]" data-vista-b4={vista}>
      <Fotosintesis3DScene reloj={relojRef} vista={vista} calidad={calidad} reducido={reducido} rotulos={rotulos} encuadre={encuadre} onListo={onListo} />
      {/* vistas y capas */}
      {/* right-32: deja libre el botón «Instrumentos» del LabLayout (en móvil las píldoras pasan a una 2.ª fila) */}
      <div className="pointer-events-none absolute left-2 right-32 top-2 flex flex-wrap items-center gap-1.5">
        <Pildora activo={vista === 'cloroplasto'} onClick={() => cambiarVista('cloroplasto')} title="El cloroplasto entero, en corte"><Microscope size={12} /> Cloroplasto</Pildora>
        <Pildora activo={vista === 'tilacoide'} onClick={() => cambiarVista('tilacoide')} title="La membrana del tilacoide ampliada: fotosistemas y ATP sintasa"><FlaskConical size={12} /> Tilacoide</Pildora>
        <Pildora activo={rotulos} onClick={() => setRotulos((v) => !v)} title="Nombres de las piezas (también al pasar el ratón)"><Tags size={12} /> Rótulos</Pildora>
        <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
      </div>
      {/* honestidad: esquema y cámara lenta con su factor */}
      <div className="pointer-events-none absolute bottom-2 left-2 rounded-md bg-[#0b1714]/75 px-2 py-1 font-mono text-[11px] font-semibold text-emerald-100/90 backdrop-blur" data-camara-b4="">
        {vista === 'tilacoide' ? `Cámara lenta ×1/${CAMARA_LENTA_MEMBRANA} · esquema` : 'Esquema · no a escala'}
        {midiendo && <span className="text-amber-200"> · cámara rápida ×{cifra(CAMARA_RAPIDA_ENSAYO, 0)}</span>}
        {pausa && <span className="text-slate-300"> · en pausa</span>}
      </div>
      <button type="button" onClick={() => setCalidad((c) => (c === 'alta' ? 'media' : 'alta'))} title="Calidad gráfica (alta: posproceso con brillo en lo que emite luz)"
        className="absolute bottom-2 right-2 rounded-md border border-white/10 bg-[#0b1714]/75 px-2 py-1 text-[11px] font-semibold text-slate-300 backdrop-blur hover:text-white" data-calidad-b4={calidad}>
        Calidad: {calidad}
      </button>
      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute inset-x-0 top-11 flex justify-center px-4">
          <span className="aviso-b4 max-w-[560px] rounded-lg border border-white/10 bg-[#0a1714]/85 px-3 py-1.5 text-center text-[12px] text-slate-200 shadow-lg backdrop-blur" data-aviso-b4="">
            {aviso.texto}
          </span>
        </div>
      )}
      {/* cortina del cambio de vista */}
      <div className={`pointer-events-none absolute inset-0 bg-[#050c0b] transition-opacity duration-200 ${cortina ? 'opacity-100' : 'opacity-0'}`} />
      <style>{`.aviso-b4{animation:avisoB4 7s ease forwards}@keyframes avisoB4{0%{opacity:0;transform:translateY(-4px)}6%{opacity:1;transform:none}80%{opacity:1}100%{opacity:0}}@media (prefers-reduced-motion: reduce){.aviso-b4{animation:none}}`}</style>
    </div>
  );

  const barra = (
    <div className="flex min-w-0 flex-1 flex-wrap items-center gap-1.5">
      <Lectura etiqueta="Meta" valor={`${cifra(meta, 2)} mL O₂ · ${DURACION_B4} min`} acento title="Ramita de Elodea, a 25 °C y con NaHCO₃ al 0,1 %" />
      <Lectura etiqueta="Dist. mín." valor={`${dMin} cm`} title="La lámpara calienta el agua: no la acerques a menos de este límite" />
      <LecturasVivas reloj={relojRef} meta={meta} />
      {!referencia && <Lectura etiqueta="Explorando" valor="no cuenta" title="El reto se mide a 25 °C y con NaHCO₃ al 0,1 %" />}
      {!midiendo && validado && <Lectura etiqueta="Resultado" valor="Meta alcanzada" acento />}
    </div>
  );

  const controles = (
    <div className="flex flex-col gap-2.5">
      <GrupoControles>
        <div className="flex flex-col gap-1">
          <span className="text-[11px] font-semibold text-slate-300">Lámpara LED (mismo flujo de fotones)</span>
          <div className="flex gap-1.5">
            {LAMPARAS.map((l) => (
              <button key={l} type="button" disabled={midiendo} title={NOMBRE_LUZ_B4[l]} aria-label={NOMBRE_LUZ_B4[l]} aria-pressed={color === l}
                onClick={() => setFotosintesis({ color: l })}
                className={`h-8 w-9 rounded-lg border-2 transition-all disabled:cursor-not-allowed ${color === l ? 'border-white' : 'border-white/10 opacity-60 hover:opacity-100'}`}
                style={{ backgroundColor: LAMPARA[l].hex }} />
            ))}
          </div>
        </div>
        <Deslizador etiqueta="Distancia lámpara–ramita" valor={dEfectiva} min={dMin} max={D_MAX_B4} paso={1} unidad="cm" ancho="w-48" deshabilitado={midiendo}
          onChange={(v) => setFotosintesis({ distancia: v })} />
        <div className={`flex flex-col gap-1 ${midiendo ? 'pointer-events-none opacity-50' : ''}`}>
          <Segmentado<string> etiqueta="NaHCO₃ en el agua (CO₂)" valor={String(nahco3)} onChange={(v) => setNahco3(Number(v) as NaHCO3)}
            opciones={NAHCO3_OPCIONES.map((n) => ({ valor: String(n), texto: `${cifra(n, n === 0 ? 0 : n < 0.1 ? 2 : 1)} %` }))} />
        </div>
        <Deslizador etiqueta="Baño" valor={T} min={TEMPERATURAS[0]} max={TEMPERATURAS[TEMPERATURAS.length - 1]} paso={5} unidad="°C" ancho="w-36" deshabilitado={midiendo}
          onChange={(v) => setT(v)} />
      </GrupoControles>
      <GrupoControles className="items-center">
        <BotonLab onClick={medir} deshabilitado={midiendo}><Play size={14} /> {midiendo ? 'Midiendo…' : `Medir ${DURACION_B4} min`}</BotonLab>
        <BotonLab variante="acento" onClick={() => onValidate?.()} deshabilitado={midiendo || ensayos.length === 0}><ShieldCheck size={14} /> Validar práctica</BotonLab>
        <BotonLab variante="secundario" title={pausa ? 'Reanudar la animación' : 'Pausar la animación'} onClick={() => setPausa((p) => !p)}>
          {pausa ? <Play size={14} /> : <Pause size={14} />}
        </BotonLab>
        {!referencia && (
          <button type="button" onClick={() => { setNahco3(REFERENCIA.nahco3); setT(REFERENCIA.T); }} disabled={midiendo}
            className="flex h-8 items-center gap-1.5 rounded-lg border border-amber-300/40 bg-amber-400/10 px-2.5 text-[11px] font-semibold text-amber-200 hover:bg-amber-400/20">
            <Thermometer size={13} /> Condiciones del reto
          </button>
        )}
      </GrupoControles>
      <div className="flex flex-col gap-1">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-slate-300">Ensayos (O₂ recogido en el tubo)</span>
          <button type="button" onClick={() => { resetB4(); setExplor([]); relojRef.current.vaciar(); }} disabled={midiendo} className="flex items-center gap-1 text-[10px] text-slate-400 hover:text-white"><RotateCcw size={12} /> Borrar</button>
        </div>
        {todos.length === 0 ? (
          <p className="text-[11px] italic text-slate-500">Sin ensayos. Cambia una variable cada vez y compara.</p>
        ) : (
          <div className="flex flex-wrap gap-1.5" data-ensayos-b4="">
            {ensayos.map((e, i) => (
              <span key={`r${i}`} className={`flex items-center gap-1.5 rounded-lg border px-2 py-1 font-mono text-[11px] ${e.o2 >= meta ? 'border-emerald-400/60 bg-emerald-500/10 text-emerald-300' : 'border-white/10 bg-white/[0.04] text-slate-200'}`}>
                <i className="block h-2.5 w-2.5 rounded-full" style={{ background: LAMPARA[e.color].hex }} />
                {e.distancia} cm · {cifra(e.o2, 2)} mL
              </span>
            ))}
            {explor.map((e, i) => (
              <span key={`x${i}`} title="Exploración (fuera de las condiciones del reto): no cuenta" className="flex items-center gap-1.5 rounded-lg border border-dashed border-white/15 px-2 py-1 font-mono text-[11px] text-slate-400">
                <i className="block h-2.5 w-2.5 rounded-full border" style={{ borderColor: LAMPARA[e.color].hex }} />
                {e.distancia} cm · {e.T} °C · {cifra(e.nahco3, 2)} % · {cifra(e.o2, 2)} mL
              </span>
            ))}
          </div>
        )}
      </div>
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={barra}
      controles={controles}
      panelLateral={<DockFoto reloj={relojRef} vista={vista} ensayos={todos} meta={meta} dMin={dMin} revela={validado || revelaDev} />}
      tituloPanel="Instrumentos"
    />
  );
}
