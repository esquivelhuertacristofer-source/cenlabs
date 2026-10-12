"use client";

import React, { useState, useEffect, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Zap, Battery, Gauge, Play, Pause, ShieldAlert, Wrench, Layers } from 'lucide-react';
import { useShallow } from 'zustand/react/shallow';
import dynamic from 'next/dynamic';
import { useSimuladorStore } from '@/store/simuladorStore';
import { LED, RANGO_V8, RANGO_R8, R_INTERNA_FUENTE, corrienteLed, evaluarF8 } from '@/domain/fisica';
import AvisoReto from './fisica/AvisoReto';

const Ohm3DScene = dynamic(() => import('./simuladores/fis08/Ohm3DScene'), {
  ssr: false,
  loading: () => <div className="w-full h-full bg-[#020617] flex items-center justify-center text-blue-400 font-black text-xs uppercase tracking-[0.3em]">Montando protoboard...</div>
});

export default function PilotoLeyOhm({ onValidate }: { onValidate?: () => void }) {
  const { ohm8, setOhm8, audio, setAsistente } = useSimuladorStore(useShallow((s) => ({
    ohm8: s.ohm8, setOhm8: s.setOhm8, audio: s.audio, setAsistente: s.setAsistente,
  })));
  const { nivel, voltaje, resistencia, switchOn, ledRoto, bateriaConectada, resistenciaConectada, ledConectado, rCalculada, ensayo } = ohm8;

  const [isSchematic, setIsSchematic] = useState(false);
  const [rInput, setRInput] = useState(rCalculada !== null ? String(rCalculada) : '');
  const [alerta, setAlerta] = useState<string | null>(null);

  useEffect(() => {
    setAsistente({
      visible: true,
      text: "Bienvenido al laboratorio de electrónica. Un LED rojo necesita unos 2 V y 20 mA. Calcula la resistencia que limita la corriente a 20 mA con tu fuente, móntala y cierra el circuito.",
      pose: "thinking"
    });
    return () => setAsistente({ visible: false });
  }, [setAsistente]);

  const avisar = (msg: string) => { setAlerta(msg); window.setTimeout(() => setAlerta(null), 5000); };

  const conR = nivel >= 2;
  const circuitoArmado = bateriaConectada && ledConectado && (!conR || resistenciaConectada);
  const corriente = switchOn && !ledRoto && circuitoArmado ? corrienteLed(voltaje, conR ? resistencia : null) : 0;
  const mA = corriente * 1000;
  const vR = conR ? corriente * resistencia : 0;
  const vLed = corriente > 0 ? LED.vf : 0;

  // Cualquier cambio en la fuente o en la caja abre el interruptor: cada cierre es un ensayo.
  const ajustar = (data: Partial<typeof ohm8>) => setOhm8({ ...data, switchOn: false, resultado: null });

  const cambiarNivel = (n: number) => {
    audio?.playNotification();
    setOhm8({ nivel: n, switchOn: false, ledRoto: false, bateriaConectada: false, resistenciaConectada: false, ledConectado: false, resultado: null });
  };

  const toggleConexion = (c: 'bateria' | 'resistencia' | 'led') => {
    if (switchOn) return avisar('Abre el circuito antes de mover componentes.');
    audio?.playPop();
    if (c === 'bateria') setOhm8({ bateriaConectada: !bateriaConectada });
    if (c === 'resistencia') setOhm8({ resistenciaConectada: !resistenciaConectada });
    if (c === 'led') setOhm8({ ledConectado: !ledConectado });
  };

  const guardarR = (v: string) => {
    setRInput(v);
    const r = parseFloat(v);
    setOhm8({ rCalculada: Number.isFinite(r) ? r : null, resultado: null });
  };

  const toggleSwitch = () => {
    if (switchOn) { setOhm8({ switchOn: false }); audio?.playPop(); return; }
    if (ledRoto) { audio?.playError(); return avisar('El LED está quemado: cámbialo antes de volver a cerrar.'); }
    if (!circuitoArmado) { audio?.playError(); return avisar(conR ? 'Conecta fuente, resistencia y LED (clic en cada pieza).' : 'Conecta la fuente y el LED (clic en cada pieza).'); }
    if (conR && rCalculada === null) { audio?.playError(); return avisar('Escribe primero la R que calculaste: el diseño va antes que el ensayo.'); }
    const I = corrienteLed(voltaje, conR ? resistencia : null);
    const roto = I > LED.iDestruccion;
    const nuevo = conR ? { voltaje, resistencia, rCalculada, corriente: I, ledRoto: roto } : ensayo;
    setOhm8({ switchOn: !roto, ledRoto: roto, ensayo: nuevo, resultado: null });
    if (roto) { audio?.playError(); avisar(`¡El LED se quemó! Pasaron ${(I * 1000).toFixed(0)} mA y su máximo es ${LED.iMax * 1000} mA.`); }
    else audio?.playPop();
  };

  // Feedback del último ensayo, con la misma regla que el validador.
  const veredicto = useMemo(() => (ensayo ? evaluarF8({ ensayo }) : null), [ensayo]);

  return (
    <div className="flex h-full w-full overflow-hidden bg-[#010409] font-['Outfit'] relative text-white">
      <div className="absolute inset-0 z-0">
        <Ohm3DScene
          isDarkMode isSchematic={isSchematic} nivel={nivel} voltaje={voltaje} resistencia={resistencia}
          switchOn={switchOn} ledRoto={ledRoto} corrienteMA={mA}
          bateriaConectada={bateriaConectada} resistenciaConectada={resistenciaConectada} ledConectado={ledConectado}
          onToggleConexion={toggleConexion}
        />
      </div>

      <AnimatePresence>
        {alerta && (
          <motion.div initial={{ y: -40, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -40, opacity: 0 }}
            className="absolute top-6 left-1/2 -translate-x-1/2 z-[100] bg-rose-600/90 border border-rose-400 px-6 py-3 rounded-full flex items-center gap-3">
            <ShieldAlert size={18} /><span className="font-black uppercase tracking-widest text-[11px]">{alerta}</span>
          </motion.div>
        )}
      </AnimatePresence>

      {/* MÓDULOS + MULTÍMETRO */}
      <div className="absolute top-6 left-6 z-30 w-[320px] max-w-[92vw] flex flex-col gap-4">
        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex gap-2">
          {[1, 2].map((n) => (
            <button key={n} onClick={() => cambiarNivel(n)}
              className={`flex-1 px-3 py-2 rounded-xl text-[9px] font-black uppercase ${nivel === n ? 'bg-blue-600' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              Módulo 0{n}: {n === 1 ? 'sin resistencia' : 'con resistencia'}
            </button>
          ))}
          <button onClick={() => setIsSchematic((v) => !v)} aria-label="Cambiar vista esquemática" className={`px-3 rounded-xl ${isSchematic ? 'bg-blue-600' : 'bg-white/5'}`}><Layers size={14} /></button>
        </div>

        {/* Conexiones (también se hacen con clic en cada pieza de la escena) */}
        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-white/10 p-3 rounded-2xl flex gap-2">
          {([['bateria', 'Fuente', bateriaConectada], ...(conR ? [['resistencia', 'Resistencia', resistenciaConectada]] : []), ['led', 'LED', ledConectado]] as [ 'bateria' | 'resistencia' | 'led', string, boolean][]).map(([c, nombre, ok]) => (
            <button key={c} onClick={() => toggleConexion(c)} aria-pressed={ok}
              className={`flex-1 py-2 rounded-xl text-[9px] font-black uppercase ${ok ? 'bg-emerald-700' : 'bg-white/5 text-slate-400 hover:bg-white/10'}`}>
              {ok ? '✓ ' : ''}{nombre}
            </button>
          ))}
        </div>

        <div className="bg-[#0A1121]/90 backdrop-blur-xl border border-yellow-500/30 p-5 rounded-[2rem]">
          <span className="text-[10px] font-black text-yellow-300 uppercase tracking-[0.2em] flex items-center gap-2"><Gauge size={14} /> Multímetro</span>
          <div className="grid grid-cols-3 gap-2 mt-3 text-center">
            <Lectura label="I" valor={`${mA.toFixed(1)} mA`} alerta={mA > LED.iMax * 1000} />
            <Lectura label="V resistencia" valor={`${vR.toFixed(2)} V`} />
            <Lectura label="V LED" valor={`${vLed.toFixed(2)} V`} />
          </div>
          <p className="text-[9px] text-slate-500 mt-3">LED rojo: V<sub>f</sub> ≈ {LED.vf} V · I nominal {LED.iNominal * 1000} mA · máx. {LED.iMax * 1000} mA. Resistencia interna de la fuente: {R_INTERNA_FUENTE} Ω.</p>
          {ledRoto && (
            <button onClick={() => { setOhm8({ ledRoto: false }); audio?.playPop(); }}
              className="w-full mt-3 py-2 rounded-xl bg-rose-700 hover:bg-rose-600 text-[10px] font-black uppercase flex items-center justify-center gap-1"><Wrench size={12} /> Cambiar el LED</button>
          )}
        </div>

        {ensayo && (
          <div className={`p-4 rounded-[1.5rem] border backdrop-blur-xl text-[11px] ${veredicto?.ok ? 'bg-emerald-900/40 border-emerald-500/40 text-emerald-200' : 'bg-[#0A1121]/85 border-white/10 text-slate-200'}`}>
            <span className="text-[9px] font-black uppercase tracking-widest text-white/60">Último ensayo con resistencia</span>
            <p className="mt-1">{ensayo.voltaje} V · {ensayo.resistencia} Ω → {(ensayo.corriente * 1000).toFixed(1)} mA{ensayo.ledRoto ? ' (LED quemado)' : ''}</p>
            <p className="mt-1 font-bold">{veredicto?.ok ? 'Diseño correcto: el LED trabaja a su corriente nominal.' : veredicto?.mensaje}</p>
          </div>
        )}
      </div>

      {/* CONTROLES */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-40 bg-[#0A1121]/90 backdrop-blur-2xl border border-white/10 rounded-[2rem] px-6 py-4 flex flex-wrap items-end justify-center gap-6 max-w-[95vw]">
        <Slider label="Fuente" icon={<Battery size={12} />} value={voltaje} r={RANGO_V8} unit="V" decimales={1} onChange={(v) => ajustar({ voltaje: v })} />
        {conR && (
          <>
            <Slider label="Caja de resistencias" icon={<Zap size={12} />} value={resistencia} r={RANGO_R8} unit="Ω" decimales={0} onChange={(v) => ajustar({ resistencia: v })} />
            <label className="flex flex-col">
              <span className="text-[10px] font-black text-amber-300 uppercase tracking-widest">R calculada (Ω)</span>
              <input type="number" step="1" value={rInput} onChange={(e) => guardarR(e.target.value)} placeholder="para 20 mA"
                className="w-36 mt-1 bg-slate-950 border border-amber-500/40 rounded-xl px-3 py-2 font-mono" />
            </label>
          </>
        )}
        <button onClick={toggleSwitch}
          className={`h-12 px-6 rounded-2xl font-black text-[11px] uppercase tracking-widest flex items-center gap-2 ${switchOn ? 'bg-emerald-600' : 'bg-white/10 hover:bg-white/20'}`}>
          {switchOn ? <Pause size={16} /> : <Play size={16} />}{switchOn ? 'Abrir circuito' : 'Cerrar circuito'}
        </button>
      </div>

      <div className="absolute bottom-28 right-6 z-50">
        <AvisoReto visible={!!veredicto?.ok} onValidate={onValidate} texto="Tu resistencia limita el LED a 20 mA. Valida tu práctica." />
      </div>
    </div>
  );
}

function Lectura({ label, valor, alerta }: { label: string; valor: string; alerta?: boolean }) {
  return (
    <div className="bg-[#a3b18a] text-black rounded-lg p-2 font-mono">
      <div className="text-[8px] uppercase font-black opacity-60">{label}</div>
      <div className={`text-sm font-black ${alerta ? 'text-red-700' : ''}`}>{valor}</div>
    </div>
  );
}

function Slider({ label, icon, value, r, unit, decimales, onChange }: {
  label: string; icon: React.ReactNode; value: number; r: { min: number; max: number; paso: number }; unit: string; decimales: number; onChange: (v: number) => void;
}) {
  return (
    <div className="flex flex-col gap-1 min-w-[180px]">
      <div className="flex justify-between items-center">
        <span className="text-[10px] font-black text-white/40 uppercase tracking-widest flex items-center gap-1">{icon}{label}</span>
        <span className="text-sm font-black text-blue-300">{value.toFixed(decimales)} {unit}</span>
      </div>
      <input type="range" min={r.min} max={r.max} step={r.paso} value={value}
        onChange={(e) => onChange(parseFloat(e.target.value))}
        className="w-full h-1.5 accent-blue-500" />
    </div>
  );
}
