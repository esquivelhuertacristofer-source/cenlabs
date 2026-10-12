"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useShallow } from 'zustand/react/shallow';
import { Plus, Minus, Power, Activity, Target, AlertTriangle } from 'lucide-react';
import { audio } from '@/utils/audioEngine';
import Atomic3DScene from './simuladores/qmi01/Atomic3DScene';
import LabLayout, { Lectura, BotonLab } from '@/components/simulador/LabLayout';
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

const ELECTRON_ORBITALS = [
  { label: '1s', cap: 2, shell: 'K' },
  { label: '2s', cap: 2, shell: 'L' },
  { label: '2p', cap: 6, shell: 'L' },
];

const SUP: Record<number, string> = {
  1:'¹', 2:'²', 3:'³', 4:'⁴', 5:'⁵', 6:'⁶', 7:'⁷', 8:'⁸',
};

function getElectronConfig(e: number): string {
  if (e === 0) return 'Vacío';
  let remaining = e;
  const parts: string[] = [];
  for (const { label, cap } of ELECTRON_ORBITALS) {
    if (remaining <= 0) break;
    const count = Math.min(remaining, cap);
    parts.push(`${label}${SUP[count] ?? count}`);
    remaining -= count;
  }
  return parts.join(' ');
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
  const electronicConf = useMemo(() => getElectronConfig(electrones), [electrones]);

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

  // Orbital electron distribution
  const getElectronsInShell = (shellIndex: number) => {
    const caps = [2, 2, 6];
    const cumulative = caps.slice(0, shellIndex).reduce((a, b) => a + b, 0);
    return Math.max(0, Math.min(caps[shellIndex], electrones - cumulative));
  };

  if (!mounted) return null;

  const ionesDelObjetivo = ELEMENT_CATALOGUE.find((e) => e.z === tZ && e.a === tA)?.ions ?? [];

  // La escena (con su aviso de colapso) ocupa el área garantizada de LabLayout.
  const escena = (
    <div className="relative h-full w-full">
      <Atomic3DScene protons={protones} neutrons={neutrones} electrons={electrones} instability={instabilityLevel} />
      <div className="pointer-events-none absolute bottom-2 left-2 flex items-center gap-3 rounded-lg bg-[#0f1a2b]/80 px-2.5 py-1.5 text-[11px] text-slate-200">
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#d6382d]" /> protón (+)</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#3f6fc4]" /> neutrón</span>
        <span className="flex items-center gap-1.5"><i className="h-2.5 w-2.5 rounded-full bg-[#f0bd22]" /> electrón (−)</span>
      </div>
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
