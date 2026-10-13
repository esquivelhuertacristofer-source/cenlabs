"use client";

import React, { useState, useEffect, useRef, useMemo, useCallback } from 'react';
import { ShieldAlert, Pause, Play, Scan } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { CARGAS_UC, RANGO_R9_CM, evaluarF9, fuerzaCoulomb } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from './simulador/LabLayout';
// El reloj y el dock no arrastran three: la escena 3D va en su propio chunk.
import { useRelojCampo, prefiereReducirMovimiento } from './simuladores/fis09/reloj';
import { DockCampo } from './simuladores/fis09/Dock';
import type { PuntoMedido } from './simuladores/fis09/grafica';
import type { CapasVisibles } from './simuladores/fis09/Electrostatica3DScene';

const Electrostatica3DScene = dynamic(() => import('./simuladores/fis09/Electrostatica3DScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0a111b]" />,
});

const fmtQ = (q: number) => `${q > 0 ? '+' : '−'}${Math.abs(q)} μC`;

/** Interruptor de capa de la escena (píldora). */
function Pildora({ activo, onClick, children, title }: { activo: boolean; onClick: () => void; children: React.ReactNode; title?: string }) {
  return (
    <button type="button" onClick={onClick} aria-pressed={activo} title={title}
      className={`flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#8ECAE6]/50 bg-[#0f2236]/85 text-white' : 'border-white/10 bg-[#0b1422]/70 text-slate-400 hover:text-slate-200'}`}>
      {children}
    </button>
  );
}

export default function PilotoElectrostatica({ onValidate }: { onValidate?: () => void }) {
  const { e, setElectrostatica9, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    e: s.electrostatica9, setElectrostatica9: s.setElectrostatica9, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { q1, q2, distancia, reto, respuesta, tipoRespuesta } = e;

  const [fInput, setFInput] = useState(respuesta !== null ? String(respuesta) : '');
  const [alerta, setAlerta] = useState<string | null>(null);
  const [veredicto, setVeredicto] = useState<ReturnType<typeof evaluarF9> | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      pose: 'thinking',
      text: "Bienvenido al laboratorio de electrostática. Explora cómo cambia la fuerza entre dos esferas cargadas y después resuelve el reto con la Ley de Coulomb: F = k·|q₁q₂|/r²."
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  useEffect(() => { setVeredicto(null); }, [respuesta, tipoRespuesta]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const explorar = (data: Partial<typeof e>) => setElectrostatica9(data);

  const guardarF = (v: string) => {
    setFInput(v);
    const f = parseFloat(v);
    setElectrostatica9({ respuesta: Number.isFinite(f) ? f : null, resultado: null });
  };
  const comprobar = () => {
    const v = evaluarF9(e);
    setVeredicto(v);
    if (v.ok) audio?.playSuccess(); else { audio?.playError(); avisar(v.mensaje ?? 'Revisa tus datos.'); }
  };

  // ── escena: un solo reloj para el 3D y el dock ──
  const [reducido] = useState(prefiereReducirMovimiento);
  const reloj = useRelojCampo({ q1, q2, r: distancia }, reducido);
  const [pausa, setPausa] = useState(reducido);
  useEffect(() => { reloj.pausa = pausa; }, [reloj, pausa]);
  const [capas, setCapas] = useState<CapasVisibles>({ lineas: true, equipotenciales: true, fuerzas: true, rotulos: false, sonda: false });
  const alternar = (k: keyof CapasVisibles) => setCapas((c) => ({ ...c, [k]: !c[k] }));
  const [encuadre, setEncuadre] = useState(0);

  // razón entre la fuerza de este ajuste y la del anterior (sin cifras absolutas)
  const previo = useRef({ q1, q2, r: distancia });
  const [razon, setRazon] = useState<{ factor: number; que: string } | null>(null);
  const [aviso, setAviso] = useState<{ factor: number; n: number } | null>(null);
  useEffect(() => {
    const p = previo.current;
    if (p.q1 === q1 && p.q2 === q2 && p.r === distancia) return;
    const factor = fuerzaCoulomb(q1, q2, distancia) / fuerzaCoulomb(p.q1, p.q2, p.r);
    const que = p.r !== distancia && p.q1 === q1 && p.q2 === q2 ? `r ${p.r} → ${distancia} cm` : 'cargas y/o r';
    previo.current = { q1, q2, r: distancia };
    setRazon({ factor, que });
    setAviso((a) => ({ factor, n: (a?.n ?? 0) + 1 }));
  }, [q1, q2, distancia]);
  useEffect(() => {
    if (!aviso) return;
    const t = window.setTimeout(() => setAviso(null), 2600);
    return () => window.clearTimeout(t);
  }, [aviso]);

  // mediciones que el alumno anota en la gráfica (sin cifras de F: sólo puntos)
  const [puntos, setPuntos] = useState<PuntoMedido[]>([]);
  const anotar = useCallback(() => setPuntos((ps) => (ps.some((p) => p.r === distancia && p.q1 * p.q2 === q1 * q2) ? ps : [...ps, { r: distancia, q1, q2 }].slice(-24))), [distancia, q1, q2]);
  const validado = !!veredicto?.ok || e.resultado === 'exito';
  const retoMemo = useMemo(() => ({ q1: reto.q1, q2: reto.q2, r: reto.r }), [reto.q1, reto.q2, reto.r]);

  // ancho de la barra superior: en el lab estrecho (1366×768) el banco ya se lee en los controles
  const barraRef = useRef<HTMLDivElement>(null);
  const [anchoBarra, setAnchoBarra] = useState(1000);
  useEffect(() => {
    const el = barraRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([en]) => setAnchoBarra(en.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);
  const barraCompacta = anchoBarra < 600;

  const selector = (etiqueta: string, valor: number, onChange: (v: number) => void) => (
    <label className="flex flex-col gap-1">
      <span className="text-[11px] font-semibold text-slate-300">{etiqueta}</span>
      <select value={valor} onChange={(ev) => onChange(parseInt(ev.target.value, 10))}
        className="h-8 rounded-lg border border-white/15 bg-slate-950 px-2 font-mono text-[13px]">
        {CARGAS_UC.map((q) => <option key={q} value={q}>{fmtQ(q)}</option>)}
      </select>
    </label>
  );

  const escena = (
    <div className="relative h-full w-full overflow-hidden bg-[#0a111b]">
      <Electrostatica3DScene reloj={reloj} q1={q1} q2={q2} capas={capas} encuadre={encuadre} />
      {/* capas de la escena */}
      <div className="pointer-events-none absolute left-2 top-2 right-36 flex flex-wrap items-center gap-1.5">
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <Pildora activo={capas.lineas} onClick={() => alternar('lineas')} title="Líneas de campo eléctrico">
            <i className="h-0.5 w-3.5 rounded bg-gradient-to-r from-[#ff7a5c] via-white to-[#6aa6ff]" /> Líneas
          </Pildora>
          <Pildora activo={capas.equipotenciales} onClick={() => alternar('equipotenciales')} title="Superficies equipotenciales">
            <i className="h-2.5 w-2.5 rounded-full border border-[#c9b8ff]/80" /> Equipotenciales
          </Pildora>
          <Pildora activo={capas.fuerzas} onClick={() => alternar('fuerzas')} title="Par de fuerzas acción–reacción">
            <i className="h-0.5 w-3 rounded bg-[#ffb547]" /> Fuerzas
          </Pildora>
          <Pildora activo={capas.sonda} onClick={() => alternar('sonda')} title="Carga de prueba: E = E₁ + E₂ (superposición)">
            <i className="h-2 w-2 rounded-full bg-white/90" /> Sonda
          </Pildora>
          <Pildora activo={capas.rotulos} onClick={() => alternar('rotulos')} title="Rótulos de cargas y fuerzas">Rótulos</Pildora>
          <Pildora activo={!pausa} onClick={() => setPausa((p) => !p)} title={pausa ? 'Animar el sentido del campo' : 'Pausar la animación'}>
            {pausa ? <Play size={12} /> : <Pause size={12} />}
          </Pildora>
          <Pildora activo={false} onClick={() => setEncuadre((n) => n + 1)} title="Volver al encuadre automático"><Scan size={12} /></Pildora>
        </div>
      </div>
      {/* razón de fuerzas tras cada cambio: se lee y se va */}
      {aviso && (
        <div key={aviso.n} className="pointer-events-none absolute bottom-3 left-1/2 -translate-x-1/2 rounded-lg border border-[#ffb547]/40 bg-[#0b1422]/85 px-3 py-1.5 font-mono text-[13px] font-semibold tabular-nums text-[#ffd9a0] shadow-lg backdrop-blur" data-aviso-razon="">
          |F| {aviso.factor >= 1 ? '×' : '÷'} {(aviso.factor >= 1 ? aviso.factor : 1 / aviso.factor).toFixed(aviso.factor >= 10 || aviso.factor <= 0.1 ? 1 : 2).replace('.', ',')}
        </div>
      )}
    </div>
  );

  return (
    <LabLayout
      escena={escena}
      barraSuperior={
        <div ref={barraRef} className="flex min-w-0 flex-1 items-center gap-2">
          <span className="shrink-0 text-[10px] font-bold uppercase tracking-wider text-amber-300">Reto</span>
          <Lectura etiqueta="q₁" valor={fmtQ(reto.q1)} acento />
          <Lectura etiqueta="q₂" valor={fmtQ(reto.q2)} acento />
          <Lectura etiqueta="r" valor={reto.r} unidad="cm" acento />
          {!barraCompacta && (
            <>
              <span className="mx-1 h-5 w-px shrink-0 bg-white/15" />
              <Lectura etiqueta="Banco q₁" valor={fmtQ(q1)} />
              <Lectura etiqueta="q₂" valor={fmtQ(q2)} />
              <Lectura etiqueta="r" valor={distancia} unidad="cm" />
            </>
          )}
        </div>
      }
      tituloPanel="Campo y fuerza"
      panelLateral={
        <DockCampo reloj={reloj} q1={q1} q2={q2} r={distancia} reto={retoMemo} puntos={puntos} onAnotar={anotar}
          onBorrar={() => setPuntos([])} validado={validado} razon={razon} />
      }
      controles={
        <div className="flex flex-col gap-2">
          <GrupoControles>
            {selector('q₁ (esfera fija)', q1, (v) => explorar({ q1: v }))}
            {selector('q₂ (esfera móvil)', q2, (v) => explorar({ q2: v }))}
            <Deslizador etiqueta="Separación r" valor={distancia} min={RANGO_R9_CM.min} max={RANGO_R9_CM.max} paso={RANGO_R9_CM.paso} unidad="cm" decimales={0} ancho="w-52"
              onChange={(v) => explorar({ distancia: v })} />
          </GrupoControles>
          <GrupoControles>
            <label className="flex w-44 flex-col gap-1">
              <span className="text-[11px] font-semibold text-amber-300">|F| del reto (N)</span>
              <input type="number" step="any" value={fInput} onChange={(ev) => guardarF(ev.target.value)} placeholder="F = k·|q₁q₂|/r²"
                className="h-8 rounded-lg border border-amber-500/40 bg-slate-950 px-2.5 font-mono text-[13px] outline-none focus:border-amber-400" />
            </label>
            <Segmentado etiqueta="Interacción del reto" valor={tipoRespuesta ?? ''} onChange={(t) => setElectrostatica9({ tipoRespuesta: t as 'atraccion' | 'repulsion', resultado: null })}
              opciones={[{ valor: 'atraccion', texto: 'Atracción' }, { valor: 'repulsion', texto: 'Repulsión' }]} />
            <BotonLab variante="acento" onClick={comprobar}>Comprobar</BotonLab>
          </GrupoControles>
          {(alerta || veredicto?.ok) && (
            <div className="flex flex-wrap items-center gap-2">
              {alerta && (
                <div role="alert" className="flex min-h-8 items-center gap-2 rounded-lg border border-rose-400/50 bg-rose-600/20 px-3 py-1 text-[12px] font-bold text-rose-200">
                  <ShieldAlert size={14} /> {alerta}
                </div>
              )}
              <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} className="!px-3 !py-1.5" texto="Fuerza e interacción correctas. Valida tu práctica." />
            </div>
          )}
        </div>
      }
    />
  );
}
