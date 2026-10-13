"use client";

import React, { useState, useEffect, useMemo, useRef } from 'react';
import dynamic from 'next/dynamic';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Minus, Power, Activity, Target, AlertTriangle, Scissors, CircleDashed, Minimize2, Pause, Play } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';
// Física del modelo cuántico: módulo puro (sin three) — la escena 3D va en su propio chunk.
import { estadoAtomo, radioNuclearFm, miles, A0_PM, type IdOrbital } from './simuladores/qmi01/orbitales';
import { useRelojAtomo } from './simuladores/qmi01/reloj';
import { DiagramaCajas, GraficaRadial } from './simuladores/qmi01/PanelOrbitales';
import type { ModoAtomo } from './simuladores/qmi01/Atomic3DScene';

const Atomic3DScene = dynamic(() => import('./simuladores/qmi01/Atomic3DScene'), {
  ssr: false,
  loading: () => <div className="h-full w-full bg-[#0b1522]" />,
});
import {
  assessNuclearStability,
  calcBindingEnergyPerNucleon,
  buildIUPACNotation,
  STABLE_ISOTOPES,
} from '@/utils/nuclearPhysics';

// ─── Element catalogue (Z 1-10) with isotopes ────────────────────────────────
const ELEMENT_CATALOGUE = [
  { z: 1,  a: 1,  sym: 'H',  label: 'Hidrógeno',  ions: [] },
  { z: 2,  a: 4,  sym: 'He', label: 'Helio',       ions: [{ charge: 2, label: 'He²⁺ (α)' }] },
  { z: 3,  a: 7,  sym: 'Li', label: 'Litio',       ions: [{ charge: 1, label: 'Li⁺' }] },
  { z: 6,  a: 12, sym: 'C',  label: 'Carbono-12',  ions: [] },
  { z: 6,  a: 14, sym: 'C',  label: 'Carbono-14',  ions: [] },
  { z: 8,  a: 16, sym: 'O',  label: 'Oxígeno',     ions: [{ charge: -2, label: 'O²⁻' }] },
  { z: 9,  a: 19, sym: 'F',  label: 'Flúor',       ions: [{ charge: -1, label: 'F⁻' }] },
  { z: 10, a: 20, sym: 'Ne', label: 'Neón',        ions: [] },
];

const ELEMENT_INFO: Record<number, { sym: string; name: string; color: string }> = {
  0:  { sym: '?',  name: 'Espacio Vacío',  color: '#64748B' },
  1:  { sym: 'H',  name: 'Hidrógeno',      color: '#FB8500' },
  2:  { sym: 'He', name: 'Helio',          color: '#FFB703' },
  3:  { sym: 'Li', name: 'Litio',          color: '#E63946' },
  4:  { sym: 'Be', name: 'Berilio',        color: '#F1FAEE' },
  5:  { sym: 'B',  name: 'Boro',           color: '#A8DADC' },
  6:  { sym: 'C',  name: 'Carbono',        color: '#457B9D' },
  7:  { sym: 'N',  name: 'Nitrógeno',      color: '#1D3557' },
  8:  { sym: 'O',  name: 'Oxígeno',        color: '#219EBC' },
  9:  { sym: 'F',  name: 'Flúor',          color: '#8ECAE6' },
  10: { sym: 'Ne', name: 'Neón',           color: '#FFD60A' },
};

/** ¿El sistema pide reducir el movimiento? (entonces todo arranca en pausa y sin transiciones) */
function prefiereReducirMovimiento(): boolean {
  try { return typeof window !== 'undefined' && !!window.matchMedia?.('(prefers-reduced-motion: reduce)').matches; }
  catch { return false; }
}

// ─── Main Component ─────────────────────────────────────────────────────────
// El catálogo llega hasta el neón (Z = 10) y la configuración hasta 2p⁶: el store
// limita protones y electrones a 10.
const MAX_Z = 10;

export default function PilotoConstruccionAtomica({ isWorktableDark = true, onValidate }: { isWorktableDark?: boolean; onValidate?: () => void }) {
  const { particulas, setParticulas, validarEstructura, registrarHallazgo, resetParticulas, setTargetElement, setTargetCharge } =
    useSimuladorStore(useShallow((s) => ({
      particulas: s.particulas, setParticulas: s.setParticulas, validarEstructura: s.validarEstructura,
      registrarHallazgo: s.registrarHallazgo, resetParticulas: s.resetParticulas,
      setTargetElement: s.setTargetElement, setTargetCharge: s.setTargetCharge,
    })));
  const [mounted, setMounted] = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // ── Modelo atómico mostrado (Cuántico por defecto; Bohr como referencia histórica) ──
  const [reducirMov] = useState(prefiereReducirMovimiento);
  const [modo, setModo] = useState<ModoAtomo>('cuantico');
  const [corte, setCorte] = useState(false);
  const [contorno, setContorno] = useState(true);
  const [escalaReal, setEscalaReal] = useState(false);
  const [pausa, setPausa] = useState(reducirMov);
  const [focoPedido, setFoco] = useState<IdOrbital | null>(null);
  const reglaRef = useRef<HTMLDivElement>(null);
  const aumentoRef = useRef<HTMLSpanElement>(null);
  const marcaNucleoRef = useRef<HTMLDivElement>(null);
  const refsDom = useMemo(() => ({ regla: reglaRef, aumento: aumentoRef, marcaNucleo: marcaNucleoRef }), []);
  // Ancho real de la escena: por debajo de 640 px (1366×768) la gráfica se pliega y el
  // rótulo del modelo se acorta, para que las tarjetas no tapen la nube.
  const escenaRef = useRef<HTMLDivElement>(null);
  const [anchoEscena, setAnchoEscena] = useState(0);
  const [verGraficaCompacta, setVerGraficaCompacta] = useState(false);
  const [verNotas, setVerNotas] = useState(false);
  useEffect(() => {
    const el = escenaRef.current;
    if (!el || typeof ResizeObserver === 'undefined') return;
    const ro = new ResizeObserver(([e]) => setAnchoEscena(e.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, [mounted]);
  const compacto = anchoEscena > 0 && anchoEscena < 640;

  const {
    protones = 0, neutrones = 0, electrones = 0,
    targetZ, targetA, targetCharge,
    isStable = true, message = '',
  } = particulas || {};

  // SANITIZACIÓN DE EMERGENCIA PARA EL PITCH
  const currentP = Number(protones) || 0;
  const currentN = Number(neutrones) || 0;
  const currentE = Number(electrones) || 0;
  const tZ = Number(targetZ) || 6;
  const tA = Number(targetA) || 12;
  const tC = Number(targetCharge) || 0;

  const masaAtomica  = currentP + currentN;
  const cargaNeta    = currentP - currentE;
  const currentEl    = ELEMENT_INFO[currentP] ?? ELEMENT_INFO[0];
  const targetEl     = ELEMENT_INFO[tZ] ?? ELEMENT_INFO[0];

  // Nuclear physics computations
  const nuclearStatus  = useMemo(() => assessNuclearStability(protones, neutrones), [protones, neutrones]);
  const bindingEnergy  = useMemo(() => calcBindingEnergyPerNucleon(protones, masaAtomica), [protones, masaAtomica]);
  const iupacCurrent   = useMemo(() => buildIUPACNotation(protones, masaAtomica, cargaNeta), [protones, masaAtomica, cargaNeta]);
  // Estado del modelo cuántico (configuración, Z_eff de Slater, ⟨r⟩): UNA fuente para
  // el diagrama de cajas, la gráfica y la escena; el reloj interpola las Z_eff.
  const estado = useMemo(() => estadoAtomo(currentP, currentE), [currentP, currentE]);
  const reloj = useRelojAtomo(estado, reducirMov);
  const electronicConf = estado.texto;
  const foco = focoPedido && estado.orbitales.some((o) => o.def.id === focoPedido && o.ligado) ? focoPedido : null;

  const [guiaMensaje, setGuiaMensaje] = useState("Arrastra partículas al núcleo");

  // Lógica de Mensajería Contextual (Guía Reactiva 1:1)
  // Lógica de Mensajería Contextual y VOZ (Guía Reactiva 1:1)
  useEffect(() => {
    let msg = "";
    if (protones === 0) {
      msg = "Añade protones (+) para comenzar a construir el núcleo";
    } else if (protones < targetZ) {
      msg = `Necesitamos más protones. Añade hasta llegar al número atómico Z=${targetZ}`;
    } else if (protones > targetZ) {
      msg = "Te has excedido en protones. Este es un elemento diferente. Quita algunos.";
    } else {
      if (masaAtomica < targetA) {
        msg = `¡Excelente! El número atómico es correcto. Ahora añade neutrones para alcanzar la masa atómica de ${targetA}`;
      } else if (masaAtomica > targetA) {
        msg = "La masa es demasiado alta, el isótopo es inestable. Quita neutrones.";
      } else {
        if (cargaNeta !== targetCharge) {
          msg = `Núcleo estable. Ahora equilibra la carga con electrones para llegar a ${targetCharge === 0 ? 'un estado neutro' : `una carga de ${targetCharge}`}`;
        } else {
          msg = "¡Felicidades! Has construido el átomo a la perfección. Presiona Validar para certificar tu hallazgo.";
        }
      }
    }
    setGuiaMensaje(msg);
    
    // Solo hablar si el mensaje cambió significativamente (evitar spam)
    // Usamos un timeout pequeño para no interrumpir clics rápidos
  }, [protones, masaAtomica, cargaNeta, targetZ, targetA, targetCharge]);

  // Función para que el Dr. Quantum hable (separada para control manual)
  const hablarGuia = () => {
    audio.playNotification();
  };

  // Stability-based glow intensity for nucleus shaking
  const instabilityLevel = 
    nuclearStatus.level === 'stable' ? 0 : 
    nuclearStatus.level === 'metastable' ? 1 : 
    nuclearStatus.level === 'unstable' ? 2 : 
    nuclearStatus.level === 'critical' ? 3 : 0; // 'empty' ahora es 0
  const nucleusColor     = nuclearStatus.color;
  const shakeAnim        = instabilityLevel > 1 ? { x: [0, -2, 2, -2, 2, 0], transition: { duration: 0.5, repeat: Infinity } } : {};

  const [isExploded, setIsExploded] = useState(false);

  // Trigger de Explosión
  useEffect(() => {
    if (instabilityLevel === 3 && (protones + neutrones) > 0 && !isExploded) {
      setIsExploded(true);
    }
  }, [instabilityLevel, isExploded, protones, neutrones]);

  const handleReset = () => {
    setIsExploded(false);
    resetParticulas();
  };

  if (!mounted) return null;

  const ionesDelObjetivo = ELEMENT_CATALOGUE.find((e) => e.z === tZ && e.a === tA)?.ions ?? [];

  const cuantico = modo === 'cuantico';
  const radioNucFm = radioNuclearFm(masaAtomica);
  const atomoSobreNucleo = estado.radioPm !== null && radioNucFm > 0 ? (estado.radioPm * 1000) / radioNucFm : null;
  const aviso = currentP === 0 && currentE === 0
    ? 'Añade protones y electrones para construir el átomo'
    : cuantico && currentE === 0
      ? 'Núcleo desnudo: sin electrones no hay nube de probabilidad'
      : cuantico && currentP === 0
        ? 'Sin protones no hay núcleo: ningún electrón queda ligado'
        : null;

  // La escena (con su aviso de colapso) ocupa el área garantizada de LabLayout.
  const escena = (
    <div ref={escenaRef} className="relative h-full w-full overflow-hidden" data-modelo-atomico={modo} data-compacto={compacto ? '' : undefined}>
      <Atomic3DScene
        protons={protones} neutrons={neutrones} electrons={electrones} instability={instabilityLevel}
        modo={modo} estado={estado} reloj={reloj} corte={corte} contorno={contorno}
        escalaReal={escalaReal} pausa={pausa} foco={foco} refsDom={refsDom}
      />

      {/* Barra del modelo (arriba a la izquierda) */}
      <div className={`pointer-events-none absolute left-2 top-2 flex flex-col items-start gap-1.5 ${compacto ? 'max-w-[calc(100%-11.5rem)]' : 'max-w-[calc(100%-9.5rem)]'}`}>
        <div className="pointer-events-auto flex flex-wrap items-center gap-1.5">
          <div className="flex rounded-lg border border-white/15 bg-[#0a1420]/85 p-0.5 backdrop-blur" role="group" aria-label="Modelo atómico">
            {([['cuantico', 'Cuántico'], ['bohr', 'Bohr · 1913']] as [ModoAtomo, string][]).map(([v, t]) => (
              <button key={v} type="button" onClick={() => { setModo(v); audio.playPop(); }} aria-pressed={modo === v}
                className={`h-7 rounded-md px-2.5 text-[11px] font-semibold ${modo === v ? 'bg-[#219EBC] text-white' : 'text-slate-300 hover:text-white'}`}>{t}</button>
            ))}
          </div>
          {cuantico && (
            <>
              <Interruptor activo={corte} onClick={() => setCorte((v) => !v)} titulo="Corta la nube por el plano z = 0 y muestra |ψ|² en la cara de corte">
                <Scissors size={13} /> Cortar la nube
              </Interruptor>
              <Interruptor activo={contorno} onClick={() => setContorno((v) => !v)} titulo="Superficie de isodensidad que encierra el 90 % de la probabilidad de cada orbital">
                <CircleDashed size={13} /> Contorno 90 %
              </Interruptor>
              <Interruptor activo={escalaReal} onClick={() => setEscalaReal((v) => !v)} titulo="Encoge el núcleo hasta su tamaño real, R = 1,2 fm·A^(1/3)">
                <Minimize2 size={13} /> Núcleo a escala
              </Interruptor>
            </>
          )}
          <Interruptor activo={pausa} onClick={() => setPausa((v) => !v)} titulo={pausa ? 'Reanudar la animación' : 'Pausar la animación'}>
            {pausa ? <Play size={13} /> : <Pause size={13} />} {pausa ? 'Animar' : 'Pausa'}
          </Interruptor>
        </div>
        <p className="pointer-events-auto max-w-[440px] rounded-md bg-[#0a1420]/75 px-2 py-1 text-[10.5px] leading-snug text-slate-300 backdrop-blur" data-rotulo-modelo="">
          {cuantico ? (compacto ? (
            <><b className="text-white">Modelo cuántico</b> · ψ<sub>nlm</sub> hidrogenoides con Z<sub>eff</sub> de Slater. Cada punto: una posible posición del e⁻.</>
          ) : (
            <><b className="text-white">Modelo cuántico</b> · orbitales hidrogenoides ψ<sub>nlm</sub> de un electrón con Z<sub>eff</sub> de Slater (sin correlación). Cada punto es una posible posición del electrón; |ψ|² no cambia con el tiempo.</>
          )) : compacto ? (
            <><b className="text-white">Bohr (1913) · histórico.</b> Esquema: radios y velocidades no a escala.</>
          ) : (
            <><b className="text-white">Modelo de Bohr (1913) · histórico.</b> Esquema: órbitas planas, radios y velocidades no a escala. Hoy sabemos que el electrón no recorre una órbita.</>
          )}
          {' '}
          <button type="button" onClick={() => setVerNotas((v) => !v)} aria-expanded={verNotas}
            className="font-semibold text-[#8ECAE6] underline decoration-dotted underline-offset-2 hover:text-white">
            {verNotas ? 'ocultar' : 'qué simplifica'}
          </button>
        </p>
        {verNotas && (
          <ul className="pointer-events-auto max-w-[460px] list-disc space-y-0.5 rounded-md bg-[#0a1420]/90 py-1.5 pl-5 pr-2 text-[10.5px] leading-snug text-slate-300 backdrop-blur" data-notas-modelo="">
            {cuantico ? (
              <>
                <li>Cada electrón se describe con un orbital hidrogenoide ψ<sub>nlm</sub> y una carga efectiva Z<sub>eff</sub> (reglas de Slater, 1930): sin autoconsistencia, sin correlación entre electrones ni espín-órbita.</li>
                <li>Slater da el mismo Z<sub>eff</sub> al 2s y al 2p; el orden 2s → 2p de llenado es el del principio de Aufbau, no sale de este modelo.</li>
                <li>Los 2p se dibujan como orbitales reales pₓ, p<sub>y</sub>, p<sub>z</sub>; el color es el signo de ψ. Los puntos son muestras exactas de |ψ|²: 2 600 por electrón (1 000 en calidad media), así que la densidad de puntos es la densidad electrónica.</li>
                <li>Contorno: superficie que encierra el 90 % de la probabilidad del orbital. Corte: |ψ|² exacta en el plano z = 0, en escala logarítmica.</li>
                <li>El núcleo se dibuja ampliado (el aumento se indica); su radio real es R = 1,2 fm·A<sup>1/3</sup>. Si Z<sub>eff</sub> ≤ 0 el modelo no liga el electrón.</li>
                <li>Al cambiar Z o los electrones, la nube pasa a su nuevo tamaño en ≈0,5 s: es una transición visual, los tamaños intermedios no son estados físicos.</li>
              </>
            ) : (
              <>
                <li>Bohr (1913) explicó el espectro del hidrógeno con órbitas circulares cuantizadas; falla con más de un electrón y no explica la forma de los orbitales.</li>
                <li>Aquí las capas K y L son un esquema: radios, velocidades y tamaño del núcleo no están a escala. El modelo vigente es el cuántico.</li>
              </>
            )}
          </ul>
        )}
      </div>

      {/* Escala, núcleo y leyenda (arriba a la derecha, bajo el botón del panel) */}
      <div className="pointer-events-none absolute right-2 top-12 flex flex-col items-end gap-1 rounded-lg bg-[#0a1420]/75 px-2 py-1.5 text-[10.5px] text-slate-300 backdrop-blur" data-info-escala="">
        {cuantico ? (
          <>
            <div className="flex items-center gap-1.5">
              <div ref={reglaRef} className="relative h-[3px] w-16 bg-white/85 before:absolute before:-top-[3px] before:left-0 before:h-[9px] before:w-px before:bg-white after:absolute after:-top-[3px] after:right-0 after:h-[9px] after:w-px after:bg-white" />
              <span className="font-mono text-white">100 pm</span>
            </div>
            {masaAtomica > 0 && <span>núcleo ampliado <span ref={aumentoRef} className="font-mono text-white">—</span></span>}
            {atomoSobreNucleo !== null && <span title="⟨r⟩ de la capa ocupada más externa entre R = 1,2 fm·A^(1/3)">⟨r⟩ átomo ≈ <b className="font-mono text-white">{miles(atomoSobreNucleo)}</b> × R núcleo</span>}
          </>
        ) : (
          <span>núcleo y órbitas <b className="text-white">no a escala</b></span>
        )}
        <span className="flex items-center gap-2 pt-0.5">
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#d6382d]" /> p⁺</span>
          <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#3f6fc4]" /> n</span>
          {!cuantico && <span className="flex items-center gap-1"><i className="h-2 w-2 rounded-full bg-[#f0bd22]" /> e⁻</span>}
        </span>
        {cuantico && estado.noLigados > 0 && currentP > 0 && (
          <span className="max-w-[190px] text-right text-red-300">{estado.noLigados} e⁻ sin ligar: Z<sub>eff</sub> ≤ 0, el núcleo no los retiene</span>
        )}
      </div>

      {/* Marca del núcleo a escala real (el origen se proyecta al centro: no hay paneo) */}
      {cuantico && (
        <div ref={marcaNucleoRef} style={{ opacity: 0 }} className="pointer-events-none absolute left-1/2 top-1/2 transition-opacity duration-500">
          <div className="absolute -left-3 -top-3 h-6 w-6 rounded-full border border-dashed border-white/90" />
          <span className="absolute left-4 -top-2 whitespace-nowrap rounded bg-[#0a1420]/80 px-1.5 py-0.5 text-[10px] text-white">núcleo real aquí: R = {radioNucFm.toFixed(2)} fm ({(radioNucFm / (A0_PM * 1000)).toExponential(1)} a₀)</span>
        </div>
      )}

      {aviso && (
        <div className="pointer-events-none absolute inset-x-0 top-[44%] flex justify-center px-4">
          <span className="rounded-lg bg-[#0a1420]/80 px-3 py-1.5 text-center text-[12px] text-slate-200">{aviso}</span>
        </div>
      )}

      {/* Diagrama de cajas (abajo a la izquierda) y densidad radial (abajo a la derecha) */}
      <div className="absolute bottom-2 left-2">
        <DiagramaCajas estado={estado} foco={foco} onFoco={setFoco} cuantico={cuantico} />
      </div>
      {cuantico && (!compacto || verGraficaCompacta) && (
        <div className={`pointer-events-none absolute right-2 ${compacto ? 'bottom-11' : 'bottom-2'}`} data-franja-grafica="">
          <GraficaRadial estado={estado} reloj={reloj} />
        </div>
      )}
      {cuantico && compacto && (
        <div className="absolute bottom-2 right-2">
          <Interruptor activo={verGraficaCompacta} onClick={() => setVerGraficaCompacta((v) => !v)} titulo="Densidad radial de probabilidad P(r)">
            <Activity size={13} /> P(r)
          </Interruptor>
        </div>
      )}
      <AnimatePresence>
        {isExploded && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="pointer-events-none absolute inset-x-0 top-3 z-20 flex justify-center px-3"
          >
            <div className="pointer-events-auto max-w-sm rounded-2xl border border-red-400/50 bg-[#0f1a2b] p-3 text-center shadow-2xl">
              <AlertTriangle className="mx-auto mb-1 h-6 w-6 text-red-400" />
              <h2 className="text-base font-bold text-white">Núcleo desintegrado</h2>
              <p className="mt-1 text-[13px] text-slate-300">La relación neutrones/protones es tan extrema que el núcleo no se sostiene y se desintegra.</p>
              <button
                onClick={handleReset}
                className="mx-auto mt-2 flex items-center gap-2 rounded-lg bg-red-600 px-4 py-1.5 text-[12px] font-semibold text-white hover:bg-red-500"
              >
                <Power className="h-4 w-4" /> Reiniciar muestra
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );

  const barraSuperior = (
    <>
      <div className="flex shrink-0 items-baseline gap-2 pr-1">
        <span className="text-[15px] font-bold text-white">{currentEl.name}</span>
        {currentP > 0 && <span className="font-mono text-[14px] font-bold tracking-wider text-[#8ECAE6]">{iupacCurrent}</span>}
      </div>
      <Lectura etiqueta="Z" valor={currentP} title="Número atómico: protones" />
      <Lectura etiqueta="A" valor={masaAtomica > 0 ? masaAtomica : '—'} title="Número másico: protones + neutrones" />
      <Lectura etiqueta="Carga" valor={cargaNeta === 0 ? 'neutro' : `${cargaNeta > 0 ? '+' : ''}${cargaNeta}`} acento={cargaNeta !== 0} />
      <Lectura etiqueta="e⁻" valor={electronicConf} />
    </>
  );

  const panelLateral = (
    <div className="flex flex-col gap-3">
      <div className="rounded-lg border bg-white/[0.03] p-2.5" style={{ borderColor: nucleusColor + '88' }}>
        <div className="mb-1 flex items-center gap-2">
          <span className="h-2 w-2 rounded-full" style={{ background: nucleusColor }} />
          <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Estado nuclear</span>
        </div>
        <p className="text-[12px] font-semibold leading-snug" style={{ color: nucleusColor }}>{nuclearStatus.label}</p>
        <div className="mt-1.5 flex justify-between text-[11px]"><span className="text-slate-400">N/Z</span><span className="font-mono text-white">{protones > 0 ? (neutrones / protones).toFixed(2) : '—'}</span></div>
        <div className="flex justify-between text-[11px]"><span className="text-slate-400">Decaimiento</span><span className="text-right text-white">{nuclearStatus.decay}</span></div>
        {bindingEnergy > 0 && (
          <div className="flex justify-between text-[11px]"><span className="text-slate-400">B/A</span><span className="font-mono text-white">{bindingEnergy.toFixed(2)} MeV</span></div>
        )}
      </div>

      <div className="rounded-lg border border-[#FB8500]/40 bg-[#FB8500]/10 p-2.5">
        <span className="block text-[10px] font-bold uppercase tracking-wider text-[#FB8500]">Misión</span>
        <span className="text-[12px] font-semibold text-white">{targetEl.name} · A = {tA}{tC !== 0 ? ` (${tC > 0 ? '+' : ''}${tC})` : ''}</span>
      </div>

      <div>
        <span className="mb-1.5 block text-[10px] font-bold uppercase tracking-wider text-slate-400">Elemento objetivo</span>
        <div className="grid grid-cols-4 gap-1.5">
          {ELEMENT_CATALOGUE.map((el) => {
            const isSelected = targetZ === el.z && targetA === el.a;
            return (
              <button
                key={`${el.z}-${el.a}`}
                onClick={() => { setTargetElement(el.z, el.a); audio.playPop(); }}
                className={`flex h-11 flex-col items-center justify-center rounded-lg border text-[10px] font-bold transition-colors ${isSelected ? 'border-[#FB8500] bg-[#FB8500] text-white' : 'border-white/10 bg-white/[0.04] text-slate-300 hover:border-[#219EBC] hover:text-white'}`}
                title={el.label}
              >
                <span className="text-[13px] leading-none">{el.sym}</span>
                <span className="text-[9px] opacity-75">{el.a}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );

  const controles = (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-5 gap-y-2">
        <ControlModule label="Protones (Z)" count={currentP} color="bg-red-500" onAdd={() => { if (currentP >= MAX_Z) return; setParticulas(currentP + 1, currentN, currentE); audio.playProton(); }} onSub={() => { setParticulas(currentP - 1, currentN, currentE); audio.playRemove(); }} />
        <ControlModule label="Neutrones (N)" count={currentN} color="bg-blue-500" onAdd={() => { setParticulas(currentP, currentN + 1, currentE); audio.playNeutron(); }} onSub={() => { setParticulas(currentP, currentN - 1, currentE); audio.playRemove(); }} />
        <ControlModule label="Electrones (e⁻)" count={currentE} color="bg-yellow-400" onAdd={() => { if (currentE >= MAX_Z) return; setParticulas(currentP, currentN, currentE + 1); audio.playElectron(); }} onSub={() => { setParticulas(currentP, currentN, currentE - 1); audio.playRemove(); }} />

        {ionesDelObjetivo.length > 0 && (
          <div className="flex flex-col gap-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-[#FB8500]">Modo ión</span>
            <div className="flex gap-1">
              <button onClick={() => { setTargetCharge(0); audio.playPop(); }} className={`h-7 rounded-md border px-2.5 text-[11px] font-semibold ${tC === 0 ? 'border-white/30 bg-white/20 text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}>Neutro</button>
              {ionesDelObjetivo.map((ion) => (
                <button key={ion.charge} onClick={() => { setTargetCharge(ion.charge); audio.playPop(); }} className={`h-7 rounded-md border px-2.5 text-[11px] font-semibold ${tC === ion.charge ? 'border-[#FB8500] bg-[#FB8500] text-white' : 'border-white/10 bg-white/5 text-slate-400 hover:text-white'}`}>{ion.label}</button>
              ))}
            </div>
          </div>
        )}

        <div className="ml-auto flex items-center gap-2">
          <BotonLab variante="secundario" title="Reiniciar" onClick={() => { resetParticulas(); audio.playRemove(); }}><Power size={14} /> Reiniciar</BotonLab>
          <BotonLab variante="secundario" title="Registrar hallazgo" onClick={() => { registrarHallazgo('qmi01_manual', { p: protones, n: neutrones, e: electrones }); audio.playSuccess(); }}><Activity size={14} /> Registrar</BotonLab>
          <BotonLab
            onClick={() => {
              // Un solo juez: el validador de la práctica (quiz + modal comunes).
              if (onValidate) { onValidate(); return; }
              if (validarEstructura()) audio.playSuccess(); else audio.playError();
            }}
          >
            <Target size={14} /> Validar
          </BotonLab>
        </div>
      </div>
      {message && (
        <div className={`rounded-lg border px-3 py-1.5 text-[12px] font-semibold ${isStable ? 'border-green-500/40 bg-green-500/15 text-green-300' : 'border-red-500/40 bg-red-500/15 text-red-300'}`}>
          {message}
        </div>
      )}
    </div>
  );

  // El éxito lo anuncia el flujo común (quiz + modal); aquí solo queda la barra de mensaje.
  return (
    <LabLayout
      escena={escena}
      barraSuperior={barraSuperior}
      controles={controles}
      panelLateral={panelLateral}
      tituloPanel="Núcleo y misión"
    />
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function Interruptor({ activo, onClick, titulo, children }: { activo: boolean; onClick: () => void; titulo: string; children: React.ReactNode }) {
  return (
    <button type="button" onClick={onClick} title={titulo} aria-pressed={activo}
      className={`flex h-7 items-center gap-1.5 rounded-lg border px-2 text-[11px] font-semibold backdrop-blur transition-colors ${activo ? 'border-[#ffb347]/70 bg-[#ffb347]/20 text-white' : 'border-white/15 bg-[#0a1420]/85 text-slate-300 hover:border-[#219EBC] hover:text-white'}`}>
      {children}
    </button>
  );
}

function ControlModule({ label, count, color, onAdd, onSub }: { label: string; count: number; color: string; onAdd: () => void; onSub: () => void }) {
  return (
    <div className="flex items-center gap-2.5">
      <div className="flex flex-col">
        <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-2xl font-bold leading-none text-white tabular-nums">{count}</span>
          <div className={`h-2 w-2 rounded-full ${count > 0 ? color : 'bg-white/10'}`} />
        </div>
      </div>
      <div className="flex rounded-lg border border-white/10 bg-white/5 p-0.5">
        <button onClick={onSub} aria-label={`Reducir ${label}`} className="flex h-8 w-8 items-center justify-center rounded-md text-slate-300 transition-colors hover:bg-white/10 hover:text-white"><Minus size={14} /></button>
        <button onClick={onAdd} aria-label={`Aumentar ${label}`} className="flex h-8 w-8 items-center justify-center rounded-md bg-white/10 text-white transition-colors hover:bg-white/20"><Plus size={14} /></button>
      </div>
    </div>
  );
}
