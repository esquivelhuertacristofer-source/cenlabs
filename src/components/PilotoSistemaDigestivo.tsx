'use client';

import React, { useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useSimuladorStore } from '@/store/simuladorStore';
import { useRouter } from 'next/navigation';
import { CheckCircle, Play, FlaskConical, RotateCcw } from 'lucide-react';
import SistemaDigestivo3DScene from './simuladores/bio09/SistemaDigestivo3DScene';

// Configuración enzima-macronutriente y pH óptimo
const ENZIMAS_CONFIG: Record<string, { label: string; macronutriente: string; phOptimo: number }> = {
    amilasa:  { label: 'Amilasa',  macronutriente: 'almidon',  phOptimo: 7.0 },
    pepsina:  { label: 'Pepsina',  macronutriente: 'proteina', phOptimo: 2.0 },
    lipasa:   { label: 'Lipasa',   macronutriente: 'lipido',   phOptimo: 7.5 },
};

const MACRONUTRIENTES = [
    { value: 'almidon',  label: 'Almidón',  color: '#10B981' },
    { value: 'proteina', label: 'Proteína', color: '#8B5CF6' },
    { value: 'lipido',   label: 'Lípido',   color: '#FBBF24' },
];

const ENZIMAS = [
    { value: 'amilasa', label: 'Amilasa'  },
    { value: 'pepsina', label: 'Pepsina'  },
    { value: 'lipasa',  label: 'Lipasa'   },
];

export default function PilotoSistemaDigestivo() {
  const router = useRouter();
  const { digestion, setDigestion, validarB9 } = useSimuladorStore();
  const { macronutriente, enzimaSeleccionada, nivelPH, estado, monomerosAbsorbidos, status } = digestion;

  // Ref para evitar stale closure en el setInterval
  const monomerosRef = useRef(monomerosAbsorbidos);
  useEffect(() => { monomerosRef.current = monomerosAbsorbidos; }, [monomerosAbsorbidos]);

  // CORRECCIÓN STALE CLOSURE: usar functional update en setDigestion para leer el valor actual
  useEffect(() => {
    if (estado === 'digerido' && monomerosAbsorbidos < 100) {
        const id = setInterval(() => {
            // Leer valor actual desde ref para evitar stale closure
            const currentMonomeros = monomerosRef.current;
            const nextValue = Math.min(100, currentMonomeros + 10);

            setDigestion({ monomerosAbsorbidos: nextValue });

            if (nextValue >= 100) {
                setDigestion({ estado: 'absorbido' });
                clearInterval(id);
            }
        }, 800);
        return () => clearInterval(id);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [estado]);

  // Determinar si la enzima es compatible con el macronutriente y pH
  const getEnzimaStatus = () => {
    if (!enzimaSeleccionada) return null;
    const config = ENZIMAS_CONFIG[enzimaSeleccionada];
    const macroOk = config.macronutriente === macronutriente;
    const phOk = Math.abs(nivelPH - config.phOptimo) <= 1.5;
    return { macroOk, phOk, compatible: macroOk && phOk };
  };

  const enzimaStatus = getEnzimaStatus();

  const handleIniciarDigestion = () => {
    if (!enzimaSeleccionada) return;
    if (enzimaStatus?.compatible) {
      setDigestion({ estado: 'digerido', monomerosAbsorbidos: 0 });
    } else {
      setDigestion({ estado: 'desnaturalizado' });
    }
  };

  const handleReiniciar = () => {
    setDigestion({ estado: 'intacto', monomerosAbsorbidos: 0, status: 'idle' });
  };

  const puedeIniciar = enzimaSeleccionada !== null && (estado === 'intacto' || estado === 'desnaturalizado');
  const puedeValidar = monomerosAbsorbidos > 0 && status !== 'success';
  const controlesBloqueados = estado === 'digerido' || estado === 'absorbido';

  // ── Props derivados para la escena 3D ──
  const progreso = Math.min(1, monomerosAbsorbidos / 100);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#05030a] font-['Outfit'] relative text-white">

      {/* ── ESCENA 3D — TRACTO DIGESTIVO (fondo full-screen) ── */}
      <div className="absolute inset-0 z-0">
        <SistemaDigestivo3DScene
          macronutriente={macronutriente}
          enzima={enzimaSeleccionada}
          nivelPH={nivelPH}
          estado={estado}
          progreso={progreso}
          compatible={enzimaStatus?.compatible ?? false}
        />
      </div>

      {/* velo de contraste para legibilidad del HUD */}
      <div className="absolute inset-0 z-[1] pointer-events-none bg-gradient-to-b from-[#05030a]/70 via-transparent to-[#05030a]/85" />

      {/* ── CHECKLIST HUD SUPERIOR ── */}
      <div className="absolute top-8 left-1/2 -translate-x-1/2 z-50 w-full max-w-[640px] px-6 pointer-events-none">
        <div className="bg-[#0f172a]/80 backdrop-blur-3xl border border-rose-500/30 p-4 rounded-[2rem] shadow-[0_0_50px_rgba(244,63,94,0.15)] pointer-events-auto">
          <div className="flex items-center justify-between gap-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-rose-500/20 rounded-xl">
                <FlaskConical className="text-rose-400" size={16} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-rose-300 uppercase tracking-widest leading-none">Ruta Digestiva</h4>
                <p className="text-[9px] font-bold text-slate-500 uppercase tracking-widest mt-1">BIO-09 • Hidrólisis Enzimática</p>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span className={`text-[10px] font-black uppercase tracking-widest ${
                nivelPH < 6 ? 'text-rose-400' : nivelPH > 8 ? 'text-cyan-400' : 'text-emerald-400'
              }`}>
                Entorno: {nivelPH < 6 ? 'Estómago (HCl)' : nivelPH > 8 ? 'Intestino (Sales)' : 'Duodeno'}
              </span>
              {(estado === 'digerido' || estado === 'absorbido') && (
                <div className="flex items-center gap-2">
                  <div className="w-28 h-2 bg-slate-800 rounded-full overflow-hidden border border-white/10">
                    <motion.div
                      animate={{ width: `${monomerosAbsorbidos}%` }}
                      transition={{ duration: 0.3 }}
                      className="h-full bg-emerald-500 rounded-full"
                    />
                  </div>
                  <span className="text-[11px] font-black text-emerald-400">{Math.round(monomerosAbsorbidos)}%</span>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      <main className="flex-grow h-full relative flex flex-col p-12 overflow-hidden z-10 pointer-events-none">

        {/* Notificación de desnaturalización */}
        <AnimatePresence>
          {estado === 'desnaturalizado' && (
            <motion.div
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ opacity: 0 }}
              className="absolute top-40 left-1/2 -translate-x-1/2 z-40 bg-rose-950/70 backdrop-blur-xl border border-rose-500/40 px-6 py-3 rounded-2xl flex items-center gap-3 shadow-xl shadow-rose-500/20 pointer-events-none"
            >
              <div className="w-8 h-8 bg-rose-500 text-white rounded-lg flex items-center justify-center font-black">!</div>
              <div>
                <p className="text-[11px] font-black text-rose-300 uppercase">Enzima Desnaturalizada</p>
                <p className="text-[10px] font-bold text-rose-400/70 uppercase">El pH no es el óptimo para esta enzima</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* El tracto 3D vive en el fondo (z-0); este hueco deja pasar OrbitControls. */}
        <div className="flex-grow" />

        {/* ── PANEL DE CONTROL INFERIOR ── */}
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 w-full max-w-6xl z-40 px-6">
          <motion.div
            initial={{ y: 50, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="bg-[#0A1121]/90 backdrop-blur-3xl border border-white/10 rounded-[2.5rem] p-6 shadow-2xl flex flex-col gap-5 pointer-events-auto"
          >
            {/* Fila de selectores */}
            <div className="flex gap-6 flex-wrap items-end">

              {/* Selector Macronutriente */}
              <div className="flex flex-col gap-2 min-w-[150px]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Macronutriente</span>
                <div className="flex gap-1.5">
                  {MACRONUTRIENTES.map(m => (
                    <button
                      key={m.value}
                      onClick={() => {
                        if (controlesBloqueados) return;
                        setDigestion({ macronutriente: m.value as any, estado: 'intacto', monomerosAbsorbidos: 0 });
                      }}
                      disabled={controlesBloqueados}
                      className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border
                        ${macronutriente === m.value
                          ? 'text-white border-transparent shadow-lg'
                          : 'bg-white/5 text-slate-400 border-white/10 hover:border-white/20'
                        }
                        ${controlesBloqueados ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                      `}
                      style={macronutriente === m.value ? { backgroundColor: m.color } : {}}
                    >
                      {m.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Selector Enzima */}
              <div className="flex flex-col gap-2 min-w-[170px]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enzima</span>
                <div className="flex gap-1.5">
                  {ENZIMAS.map(e => {
                    const esCompatible = ENZIMAS_CONFIG[e.value].macronutriente === macronutriente;
                    return (
                      <button
                        key={e.value}
                        onClick={() => {
                          if (controlesBloqueados) return;
                          setDigestion({ enzimaSeleccionada: e.value as any });
                        }}
                        disabled={controlesBloqueados}
                        className={`px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all border
                          ${enzimaSeleccionada === e.value
                            ? 'bg-[#219EBC] text-white border-transparent shadow-lg'
                            : esCompatible
                              ? 'bg-white/5 text-[#5cc7de] border-[#219EBC]/40 hover:border-[#219EBC]'
                              : 'bg-white/5 text-slate-500 border-white/10 hover:border-white/20'
                          }
                          ${controlesBloqueados ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}
                        `}
                      >
                        {e.label}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Control pH */}
              <div className="flex flex-col gap-2 flex-1 min-w-[180px]">
                <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                  pH: <span className={`${nivelPH < 6 ? 'text-rose-400' : nivelPH > 8 ? 'text-cyan-400' : 'text-emerald-400'}`}>{nivelPH.toFixed(1)}</span>
                </span>
                <input
                  type="range"
                  min="1"
                  max="14"
                  step="0.5"
                  value={nivelPH}
                  onChange={(e) => {
                    if (controlesBloqueados) return;
                    setDigestion({ nivelPH: parseFloat(e.target.value) });
                  }}
                  disabled={controlesBloqueados}
                  className="w-full h-2 bg-white/10 rounded-full appearance-none cursor-pointer accent-[#219EBC] disabled:opacity-50 disabled:cursor-not-allowed"
                />
                <div className="flex justify-between text-[8px] text-slate-500 font-bold">
                  <span>1 Ácido</span>
                  <span>7 Neutro</span>
                  <span>14 Básico</span>
                </div>
              </div>
            </div>

            {/* Indicador compatibilidad + botones */}
            <div className="flex items-center gap-3 flex-wrap border-t border-white/10 pt-4">
              {enzimaSeleccionada && enzimaStatus && (
                <div className={`flex items-center gap-2 px-4 py-2 rounded-xl border text-[10px] font-black uppercase tracking-wider
                  ${enzimaStatus.compatible
                    ? 'bg-emerald-500/10 border-emerald-500/40 text-emerald-400'
                    : 'bg-rose-500/10 border-rose-500/40 text-rose-400'
                  }`}>
                  <span>{enzimaStatus.compatible ? '✓ Condiciones Óptimas' : '✗ Condiciones No Óptimas'}</span>
                </div>
              )}

              <div className="flex-1" />

              {/* Botón Reiniciar */}
              {(estado === 'desnaturalizado' || estado === 'absorbido') && status !== 'success' && (
                <button
                  onClick={handleReiniciar}
                  className="flex items-center gap-2 px-4 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest border border-white/10 bg-white/5 text-slate-400 hover:border-white/20 hover:text-white transition-all cursor-pointer"
                >
                  <RotateCcw size={12} />
                  Reiniciar
                </button>
              )}

              {/* Botón Iniciar Digestión */}
              {status !== 'success' && (
                <button
                  onClick={handleIniciarDigestion}
                  disabled={!puedeIniciar}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${puedeIniciar
                      ? 'bg-[#219EBC] text-white border-transparent shadow-lg hover:bg-[#1a7f99] cursor-pointer'
                      : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                    }`}
                >
                  <Play size={12} />
                  Iniciar Digestión
                </button>
              )}

              {/* Botón Validar Digestión */}
              {status !== 'success' && (
                <button
                  onClick={() => validarB9()}
                  disabled={!puedeValidar}
                  className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border
                    ${puedeValidar
                      ? 'bg-emerald-500 text-white border-transparent shadow-lg shadow-emerald-500/30 hover:bg-emerald-600 cursor-pointer'
                      : 'bg-white/5 text-slate-500 border-white/10 cursor-not-allowed'
                    }`}
                >
                  <FlaskConical size={12} />
                  Validar Digestión
                </button>
              )}
            </div>
          </motion.div>
        </div>

        {/* GLOSARIO (esquina) */}
        <div className="absolute top-32 left-8 z-30 pointer-events-none flex flex-col gap-2">
          {[
            { label: 'Hidrólisis', desc: 'Ruptura química mediante agua' },
            { label: 'Especificidad', desc: 'Modelo Llave-Cerradura' },
            { label: 'Absorción', desc: 'Paso al torrente sanguíneo' },
          ].map((item, i) => (
            <div key={i} className="bg-[#0f172a]/60 backdrop-blur-md border border-white/5 rounded-xl px-3 py-2">
              <span className="block text-[9px] font-black text-rose-300/80 uppercase tracking-widest">{item.label}</span>
              <span className="block text-[9px] font-bold text-slate-400">{item.desc}</span>
            </div>
          ))}
        </div>
      </main>

      {/* OVERLAY DE ÉXITO */}
      <AnimatePresence>
        {status === 'success' && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 z-[200] bg-[#020617]/95 backdrop-blur-3xl flex items-center justify-center p-12 pointer-events-auto"
          >
            <motion.div
              initial={{ scale: 0.9, y: 30 }}
              animate={{ scale: 1, y: 0 }}
              transition={{ type: 'spring', stiffness: 300, damping: 25 }}
              className="flex flex-col items-center gap-5 p-14 bg-slate-900 border border-emerald-500/30 rounded-[3rem] shadow-[0_0_100px_rgba(16,185,129,0.15)] max-w-md text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: [0, 1.2, 1] }}
                transition={{ duration: 0.5 }}
              >
                <CheckCircle size={72} className="text-emerald-400" />
              </motion.div>
              <div>
                <p className="text-[10px] font-black text-emerald-400 uppercase tracking-widest mb-1">Digestión Exitosa</p>
                <h3 className="text-2xl font-black text-white mb-3">Absorción Completada</h3>
                <p className="text-[12px] text-slate-400 leading-relaxed">
                  La enzima catalizó la hidrólisis {macronutriente === 'almidon' ? 'del almidón' : macronutriente === 'proteina' ? 'de la proteína' : 'del lípido'} y los monómeros fueron absorbidos al torrente sanguíneo.
                </p>
              </div>
              <div className="flex gap-6 mt-1">
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Macronutriente</span>
                  <span className="text-sm font-black text-white capitalize">{macronutriente === 'almidon' ? 'Almidón' : macronutriente === 'proteina' ? 'Proteína' : 'Lípido'}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Enzima</span>
                  <span className="text-sm font-black text-white capitalize">{enzimaSeleccionada}</span>
                </div>
                <div className="flex flex-col items-center">
                  <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">pH</span>
                  <span className="text-sm font-black text-white">{nivelPH.toFixed(1)}</span>
                </div>
              </div>
              <button onClick={() => router.push('/hub')} className="w-full mt-4 py-4 bg-emerald-600 hover:bg-emerald-500 text-white font-black rounded-2xl uppercase tracking-widest text-xs transition-colors">
                Cerrar Laboratorio
              </button>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
}
