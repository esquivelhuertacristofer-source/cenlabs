"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { Plus, Minus, Power, Activity, Target, Zap, FlaskConical, AlertTriangle, Volume2 } from 'lucide-react';
import Image from 'next/image';
import { audio } from '@/utils/audioEngine';
import Atomic3DScene from './simuladores/qmi01/Atomic3DScene';
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

const PARTICLE_PATHS = {
  bg:       '/assets/art/fondos/atom_bg.png',
  proton:   '/assets/art/simuladores/proton.png',
  neutron:  '/assets/art/simuladores/neutron.png',
  electron: '/assets/art/simuladores/electron.png',
};

// ─── Main Component ─────────────────────────────────────────────────────────
export default function PilotoConstruccionAtomica({ isWorktableDark = true }: { isWorktableDark?: boolean }) {
  const { particulas, setParticulas, validarEstructura, registrarHallazgo, resetParticulas, setTargetElement, setTargetCharge } = useSimuladorStore();
  const [mounted, setMounted] = useState(false);
  const [assetErrors, setAssetErrors] = useState<Record<string, boolean>>({});

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
    resetParticulas();
    setIsExploded(false);
  };

  // Orbital electron distribution
  const getElectronsInShell = (shellIndex: number) => {
    const caps = [2, 2, 6];
    const cumulative = caps.slice(0, shellIndex).reduce((a, b) => a + b, 0);
    return Math.max(0, Math.min(caps[shellIndex], electrones - cumulative));
  };

  if (!mounted) return null;

  return (
    <div className="relative w-full h-full flex flex-col items-center justify-center overflow-hidden font-sans bg-[#020205]">
      {/* ── ATOMIC SCENE (3D ENGINE) — CUBRE TODO EL FONDO ── */}

      {/* ── ATOMIC SCENE (3D ENGINE) — CUBRE TODO EL FONDO ── */}
      <div className="absolute inset-0 z-0">
        <Atomic3DScene 
          protons={protones}
          neutrons={neutrones}
          electrons={electrones}
          instability={instabilityLevel}
        />
      </div>

      {/* ── TOP HUD ── */}
      <div className="absolute top-10 left-10 right-10 flex justify-between items-start z-20 pointer-events-none gap-4">
        
        {/* Overlay de Explosión */}
        <AnimatePresence>
          {isExploded && (
            <motion.div 
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="fixed inset-0 z-[100] flex items-center justify-center bg-red-950/80 backdrop-blur-md pointer-events-auto"
            >
              <motion.div 
                initial={{ scale: 0.8, y: 20 }}
                animate={{ scale: 1, y: 0 }}
                className="text-center p-12 bg-black/60 rounded-[3rem] border-2 border-red-500 shadow-[0_0_100px_rgba(239,68,68,0.4)]"
              >
                <AlertTriangle className="w-20 h-20 text-red-500 mx-auto mb-6 animate-pulse" />
                <h2 className="text-5xl font-black text-white mb-2 uppercase tracking-tighter">Colapso Nuclear</h2>
                <p className="text-red-300 text-lg mb-8 font-medium">La muestra ha alcanzado un estado crítico de inestabilidad y se ha desintegrado.</p>
                <button 
                  onClick={handleReset}
                  className="px-10 py-4 bg-red-600 hover:bg-red-500 text-white font-black rounded-full transition-all transform hover:scale-105 active:scale-95 shadow-lg flex items-center gap-3 mx-auto uppercase tracking-widest"
                >
                  <Power className="w-5 h-5" />
                  Reiniciar Muestra
                </button>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Left: Z-Index card + element name */}
        <motion.div initial={{ x: -20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex gap-4 pointer-events-auto">
          <div className="w-24 h-24 bg-black/50 backdrop-blur-3xl rounded-[2rem] border border-white/10 flex flex-col items-center justify-center shadow-2xl relative overflow-hidden">
            <span className="text-[9px] font-black text-[#219EBC] absolute top-2 tracking-widest uppercase">Z = {currentP}</span>
            <span className="text-4xl font-black text-white">{masaAtomica > 0 ? masaAtomica : '--'}</span>
            <span className="text-[8px] text-slate-400 absolute bottom-2">masa (u)</span>
            <div className="absolute bottom-0 inset-x-0 h-1 rounded-full" style={{ background: nucleusColor, width: `${Math.min(100, (currentP / 10) * 100)}%`, opacity: 0.6 }} />
          </div>

          <div className="flex flex-col justify-center gap-2">
            <h2 className="text-3xl font-black text-white uppercase tracking-tighter leading-none drop-shadow-lg">{currentEl.name}</h2>
            {/* IUPAC Notation */}
            <div className="font-mono text-lg font-black tracking-widest text-[#8ECAE6] drop-shadow">{iupacCurrent}</div>
            <div className="flex items-center gap-2">
              <div className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border ${cargaNeta === 0 ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-orange-500/20 text-orange-400 border-orange-500/30'}`}>
                {cargaNeta === 0 ? 'NEUTRO' : `IÓN ${cargaNeta > 0 ? '+' : ''}${cargaNeta}`}
              </div>
            </div>
          </div>
        </motion.div>

        {/* Right: Nuclear status + Mission */}
        <motion.div initial={{ x: 20, opacity: 0 }} animate={{ x: 0, opacity: 1 }} className="flex flex-col gap-3 pointer-events-auto">

          {/* Nuclear stability card */}
          <div className="bg-black/50 backdrop-blur-3xl p-5 rounded-[2rem] border flex flex-col gap-3 min-w-[200px]" style={{ borderColor: nucleusColor + '66' }}>
            <div className="flex items-center gap-2">
              <div className="w-2.5 h-2.5 rounded-full animate-pulse" style={{ background: nucleusColor }} />
              <span className="text-[9px] font-black text-white/50 uppercase tracking-widest">Estado Nuclear</span>
            </div>
            <p className="text-[10px] font-bold leading-snug" style={{ color: nucleusColor }}>
              {nuclearStatus.label}
            </p>
            <div className="flex justify-between text-[9px]">
              <span className="text-slate-500">N/Z =</span>
              <span className="font-black text-white/80">{protones > 0 ? (neutrones / protones).toFixed(2) : '—'}</span>
            </div>
            <div className="flex justify-between text-[9px]">
              <span className="text-slate-500">Decaimiento:</span>
              <span className="font-black text-white/80">{nuclearStatus.decay}</span>
            </div>
            {bindingEnergy > 0 && (
              <div className="flex justify-between text-[9px]">
                <span className="text-slate-500">B/A:</span>
                <span className="font-black" style={{ color: nucleusColor }}>{bindingEnergy.toFixed(2)} MeV</span>
              </div>
            )}
          </div>

          {/* Mission target */}
          <div className="bg-black/40 backdrop-blur-2xl p-4 rounded-[1.5rem] border border-[#FB8500]/30 flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[#FB8500]/20 flex items-center justify-center font-black text-[#FB8500] text-sm border border-[#FB8500]/30">
              {tZ}
            </div>
            <div>
              <span className="text-[8px] font-black text-[#FB8500] uppercase tracking-widest block">Misión</span>
              <span className="text-[11px] font-black text-white">{targetEl.name} — A={tA}{tC !== 0 ? ` (${tC > 0 ? '+' : ''}${tC})` : ''}</span>
            </div>
          </div>

          <div className="bg-black/40 backdrop-blur-2xl p-3 rounded-[1.5rem] border border-[#219EBC]/20">
            <span className="text-[8px] font-black text-[#219EBC] uppercase tracking-widest block mb-1">Configuración e⁻</span>
            <span className="text-[13px] font-black text-slate-200 tracking-wider font-mono">{electronicConf}</span>
          </div>

        </motion.div>
      </div>

      {/* ── ELEMENT SELECTOR (Right rail) ── */}
      <div className="absolute right-6 top-1/2 -translate-y-1/2 flex flex-col gap-2 z-30">
        {ELEMENT_CATALOGUE.map((el) => {
          const isSelected = targetZ === el.z && targetA === el.a && targetCharge === 0;
          return (
            <button
              key={`${el.z}-${el.a}`}
              onClick={() => { setTargetElement(el.z, el.a); audio.playPop(); }}
              className={`w-14 h-12 rounded-2xl border text-[10px] flex flex-col items-center justify-center font-black transition-all ${isSelected ? 'bg-[#FB8500] text-white border-[#FB8500] shadow-lg scale-110' : 'bg-black/40 text-white/40 border-white/10 hover:bg-white/10 hover:text-white'}`}
              title={el.label}
            >
              <span className="text-[13px] leading-none">{el.sym}</span>
              <span className="text-[7px] opacity-70">{el.a}</span>
            </button>
          );
        })}
      </div>

      {/* ── ELEMENT SELECTOR (Right rail) ── */}

      {/* ── CONTROL PANEL ── */}
      <div className="absolute bottom-6 inset-x-8 bg-black/50 backdrop-blur-3xl rounded-[2.5rem] border border-white/10 shadow-[0_30px_80px_rgba(0,0,0,0.5)] flex flex-wrap md:flex-nowrap items-center justify-center md:justify-start px-8 py-4 gap-6 md:gap-8 z-30">

        <ControlModule label="PROTONES (Z)"   count={currentP}   color="bg-red-500"    onAdd={() => { setParticulas(currentP + 1, currentN, currentE); audio.playProton(); }} onSub={() => { setParticulas(currentP - 1, currentN, currentE); audio.playRemove(); }} />
        <div className="w-px h-14 bg-white/10" />
        <ControlModule label="NEUTRONES (N)"  count={currentN}  color="bg-blue-500"   onAdd={() => { setParticulas(currentP, currentN + 1, currentE); audio.playNeutron(); }} onSub={() => { setParticulas(currentP, currentN - 1, currentE); audio.playRemove(); }} />
        <div className="w-px h-14 bg-white/10" />
        <ControlModule label="ELECTRONES (e⁻)" count={currentE} color="bg-yellow-400" onAdd={() => { setParticulas(currentP, currentN, currentE + 1); audio.playElectron(); }} onSub={() => { setParticulas(currentP, currentN, currentE - 1); audio.playRemove(); }} />

        {/* Ion mode selector (if target has ions) */}
        {ELEMENT_CATALOGUE.find(e => e.z === tZ && e.a === tA)?.ions?.length ? (
          <>
            <div className="w-px h-14 bg-white/10" />
            <div className="flex flex-col gap-1">
              <span className="text-[8px] font-black text-[#FB8500] uppercase tracking-widest">Modo Ión</span>
              <div className="flex gap-1">
                <button
                  onClick={() => { setTargetCharge(0); audio.playPop(); }}
                  className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all border ${tC === 0 ? 'bg-white/20 text-white border-white/30' : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'}`}
                >Neutro</button>
                {ELEMENT_CATALOGUE.find(e => e.z === tZ && e.a === tA)!.ions.map(ion => (
                  <button
                    key={ion.charge}
                    onClick={() => { setTargetCharge(ion.charge); audio.playPop(); }}
                    className={`px-3 py-1.5 rounded-xl text-[9px] font-black transition-all border ${tC === ion.charge ? 'bg-[#FB8500] text-white border-[#FB8500]' : 'bg-white/5 text-white/30 border-white/5 hover:bg-white/10'}`}
                  >{ion.label}</button>
                ))}
              </div>
            </div>
          </>
        ) : null}

        <div className="flex-1" />

        {/* Action buttons */}
        <div className="flex items-center gap-3">
          <button onClick={() => { resetParticulas(); audio.playRemove(); }} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-500/10 transition-all" title="Reiniciar">
            <Power size={20} />
          </button>
          <button onClick={() => { registrarHallazgo(); audio.playSuccess(); }} className="w-14 h-14 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center text-white/30 hover:text-[#219EBC] hover:bg-[#219EBC]/10 transition-all" title="Registrar hallazgo">
            <Activity size={20} />
          </button>
          <button
            onClick={async () => { 
              const ok = validarEstructura(); 
              if (ok) {
                audio.playSuccess(); 
                // Guardado Diamond State: Enviar progreso a Supabase
                try {
                  const state = useSimuladorStore.getState();
                  if (state.user) {
                    await fetch('/api/resultados', {
                      method: 'POST',
                      headers: { 'Content-Type': 'application/json' },
                      body: JSON.stringify({
                        user_id: state.user.id,
                        practica_id: 'quimica-1',
                        // Estrellas: 3 = 100, 2 = 80, 1 = 60
                        score: state.particulas.intentos === 0 ? 100 : state.particulas.intentos === 1 ? 80 : 60
                      })
                    });
                  }
                } catch (err) {
                  console.error("Error conectando con la base de datos:", err);
                }
              } else {
                audio.playError(); 
              }
            }}
            className="h-14 px-8 rounded-2xl bg-[#219EBC] hover:bg-[#8ECAE6] text-white flex items-center gap-3 shadow-xl shadow-[#219EBC]/20 transition-all group"
          >
            <Target size={18} className="group-hover:rotate-12 transition-transform" />
            <span className="text-[11px] font-black uppercase tracking-widest">Validar</span>
          </button>
        </div>
      </div>

      {/* Global message bar */}
      <AnimatePresence>
        {message && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: 20, opacity: 0 }}
            className={`absolute bottom-28 left-1/2 -translate-x-1/2 z-40 px-8 py-3 rounded-2xl border text-sm font-bold backdrop-blur-2xl shadow-2xl max-w-lg text-center ${isStable ? 'bg-green-500/20 border-green-500/40 text-green-300' : 'bg-red-500/20 border-red-500/40 text-red-300'}`}
          >
            {message}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Sub-components ──────────────────────────────────────────────────────────
function ControlModule({ label, count, color, onAdd, onSub }: { label: string; count: number; color: string; onAdd: () => void; onSub: () => void }) {
  return (
    <div className="flex items-center gap-4">
      <div className="flex flex-col">
        <span className="text-[8px] font-black text-white/30 uppercase tracking-[0.2em] mb-1">{label}</span>
        <div className="flex items-baseline gap-1.5">
          <span className="text-3xl font-black text-white leading-none">{count}</span>
          <div className={`w-1.5 h-1.5 rounded-full ${count > 0 ? color : 'bg-white/10'}`} />
        </div>
      </div>
      <div className="flex bg-white/5 rounded-2xl p-1 border border-white/10">
        <button onClick={onSub} className="w-9 h-9 flex items-center justify-center hover:bg-white/5 rounded-xl text-white/40 hover:text-white transition-all"><Minus size={14} /></button>
        <button onClick={onAdd} className="w-9 h-9 flex items-center justify-center bg-white/10 hover:bg-white/20 rounded-xl text-white shadow-xl transition-all"><Plus size={14} /></button>
      </div>
    </div>
  );
}

function ParticleAsset({ type, size, path, error, onError }: { type: string; size: number; path: string; error: boolean; onError: () => void }) {
  if (error) {
    const colors: Record<string, string> = { proton: 'bg-red-500', neutron: 'bg-blue-500', electron: 'bg-yellow-400' };
    return (
      <div className={`rounded-full ${colors[type]} shadow-xl border border-white/20 flex items-center justify-center text-[9px] font-black text-white`} style={{ width: size, height: size }}>
        {type === 'proton' ? '+' : type === 'neutron' ? 'n' : '−'}
      </div>
    );
  }
  return (
    <div className="relative" style={{ width: size, height: size }}>
      <Image src={path} alt={type} width={size} height={size} className="object-contain" onError={onError} />
    </div>
  );
}
