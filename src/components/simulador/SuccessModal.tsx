"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { motion } from 'framer-motion';
import { Award } from 'lucide-react';
import { useSimuladorStore } from '@/store/simuladorStore';

const ELEMENT_NAMES: Record<number, string> = { 1: "Hidrógeno", 2: "Helio", 3: "Litio", 4: "Berilio", 5: "Boro", 6: "Carbono", 7: "Nitrógeno", 8: "Oxígeno", 9: "Flúor", 10: "Neón" };

const Awards3 = ({ color }: { color: string }) => (
  <div className="flex justify-center gap-4 mb-6">
    {[1,2,3].map(s => (
      <motion.div key={s} initial={{ scale: 0, rotate: -30 }} animate={{ scale: 1, rotate: 0 }} transition={{ delay: s * 0.15 }}>
        <Award size={40} className={`${color} drop-shadow-[0_0_12px_rgba(250,204,21,0.5)]`} fill="currentColor" />
      </motion.div>
    ))}
  </div>
);

interface Props {
  normalizedId: string;
  data: any;
  hubPath: string;
  resetPractica: () => void;
  onClose: () => void;
}

export default function SuccessModal({ normalizedId, data, hubPath, resetPractica, onClose }: Props) {
  const router = useRouter();
  const { particulas } = useSimuladorStore();
  const { resetM1, resetM2, resetM3, resetM4, resetM5, resetM6, resetM7, resetM8, resetM9, resetM10 } = useSimuladorStore();
  const { resetB1, resetB2, resetB3, resetB4, resetB5, resetB6, resetB7, resetB8, resetB9, resetB10 } = useSimuladorStore();
  const { resetF1, resetF2, resetF3, resetF4, resetF5, resetF6, resetF7, resetF8, resetF9, resetF10 } = useSimuladorStore();
  const { resetParticulas, resetGases, resetBalanceo, resetP4, resetP5, resetP6, resetP7, resetP8, resetP9, resetP10 } = useSimuladorStore();

  const Wrapper = ({ children, border = 'border-emerald-500/30', glow = 'bg-emerald-500/10', bg = 'from-[#020617] to-[#0f172a]' }: any) => (
    <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#020617]/95 backdrop-blur-3xl p-6">
      <motion.div
        initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 30 }}
        className={`bg-gradient-to-br ${bg} rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center ${border} overflow-hidden relative border`}
      >
        <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-80 h-40 ${glow} blur-[80px] rounded-full`} />
        {children}
      </motion.div>
    </div>
  );

  const NavButtons = ({ onFinish }: { onFinish: () => void }) => (
    <div className="flex gap-3 relative z-10">
      <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir</button>
      <button onClick={onFinish} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all">Finalizar</button>
    </div>
  );

  if (normalizedId === 'biologia-2') {
    const { volumen, concExt, tipoCelula } = useSimuladorStore.getState().transporte;
    return (
      <Wrapper border="border-cyan-500/30" glow="bg-cyan-500/10">
        <Awards3 color="text-yellow-400" />
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación de Homeostasis</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Equilibrio Logrado!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 grid grid-cols-2 gap-8 text-left mb-8">
          <div><span className="text-[11px] font-black text-cyan-400 uppercase block mb-1">Volumen Final</span><span className="text-3xl font-black font-mono">{volumen.toFixed(1)}%</span></div>
          <div><span className="text-[11px] font-black text-cyan-400 uppercase block mb-1">Solución Medio</span><span className="text-3xl font-black font-mono">{concExt.toFixed(2)} M</span></div>
        </div>
        <p className="text-sm text-slate-400 mb-10 px-6">Has estabilizado con éxito la muestra de {tipoCelula === 'animal' ? 'eritrocitos' : 'células vegetales'}. La presión osmótica se ha equilibrado evitando el colapso celular.</p>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Seguir Experimentando</button>
          <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-cyan-600/20 hover:bg-cyan-500 transition-all">Finalizar Misión</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'quimica-1') {
    const { targetZ: tz, targetA: ta, electrones } = particulas;
    const tName = ELEMENT_NAMES[tz] ?? 'Elemento';
    const sup: Record<number,string> = {1:'¹',2:'²',3:'³',4:'⁴',5:'⁵',6:'⁶'};
    let rem = electrones;
    const configParts: string[] = [];
    for (const [lbl, cap] of [['1s',2],['2s',2],['2p',6]] as [string,number][]) {
      if (rem <= 0) break;
      const c = Math.min(rem, cap); configParts.push(`${lbl}${sup[c] ?? c}`); rem -= c;
    }
    const N = ta - tz;
    const delta_p = (tz % 2 === 0 && N % 2 === 0) ? +11.2 / Math.sqrt(ta) : (tz % 2 !== 0 && N % 2 !== 0) ? -11.2 / Math.sqrt(ta) : 0;
    const rawBinding = tz > 0 && ta > 0 ? 15.753 * ta - 17.804 * Math.pow(ta, 2/3) - 0.7103 * tz * (tz-1) / Math.pow(ta, 1/3) - 23.69 * Math.pow(ta - 2*tz,2) / ta + delta_p : 0;
    const bindingTotal = Math.max(0, rawBinding).toFixed(1);
    return (
      <div className="fixed inset-0 z-[500] flex items-center justify-center bg-[#023047]/95 backdrop-blur-3xl p-6">
        <motion.div initial={{ scale: 0.85, opacity: 0, y: 30 }} animate={{ scale: 1, opacity: 1, y: 0 }} exit={{ scale: 0.85, opacity: 0, y: 30 }} className="bg-gradient-to-br from-[#023047] to-[#0a1a2e] rounded-[3rem] p-12 max-w-2xl w-full shadow-2xl text-white text-center border border-emerald-500/30 overflow-hidden relative">
          <Awards3 color="text-yellow-400" />
          <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Isótopo Forjado!</h3>
          <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
            <div><span className="text-[11px] font-black text-[#219EBC] block">Elemento</span><span className="text-2xl font-black">{tName}</span></div>
            <div><span className="text-[11px] font-black text-[#219EBC] block">Energía de Enlace</span><span className="text-2xl font-black">{bindingTotal} MeV</span></div>
          </div>
          <div className="flex gap-3">
            <button onClick={onClose} className="flex-1 py-5 bg-white/10 text-white font-black text-[10px] uppercase rounded-[1.5rem]">Seguir</button>
            <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-500 text-white font-black text-[10px] uppercase rounded-[1.5rem]">Finalizar</button>
          </div>
        </motion.div>
      </div>
    );
  }

  if (normalizedId === 'matematicas-1') {
    const { a, b, c } = useSimuladorStore.getState().cuadraticas;
    const delta = b*b - 4*a*c;
    return (
      <Wrapper border="border-rose-500/30" glow="bg-rose-500/10" bg="from-[#0d1117] to-[#161b22]">
        <Awards3 color="text-yellow-400" />
        <div className="text-[10px] font-black text-rose-400 uppercase tracking-[0.3em] mb-2">Certificación Algebraica</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8">¡Trayectoria Sincronizada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
          <div><span className="text-[11px] font-black text-rose-400 uppercase block mb-1">Modelo Final</span><span className="text-xl font-black font-mono">f(x) = {a}x² {b>=0?'+':''}{b}x {c>=0?'+':''}{c}</span></div>
          <div><span className="text-[11px] font-black text-rose-400 uppercase block mb-1">Determinante</span><span className="text-xl font-black font-mono">Δ = {delta.toFixed(2)}</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-5 bg-white/10 hover:bg-white/20 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all">Seguir</button>
          <button onClick={() => { resetM1(); router.push(hubPath); }} className="flex-1 py-5 bg-rose-500 hover:bg-rose-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-rose-500/20 transition-all">Finalizar</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'biologia-1') {
    const { muestra, objetivoMag } = useSimuladorStore.getState().microscopio;
    return (
      <Wrapper border="border-emerald-500/30" glow="bg-emerald-500/10">
        <Awards3 color="text-emerald-400" />
        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Microscopía Virtual</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">¡Micrografía Asegurada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
          <div><span className="text-[11px] font-black text-emerald-400/80 uppercase block mb-1">Muestra Analizada</span><span className="text-xl font-black uppercase">{muestra}</span></div>
          <div><span className="text-[11px] font-black text-emerald-400/80 uppercase block mb-1">Ampliación Final</span><span className="text-xl font-black font-mono">{objetivoMag * 10}x</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir Observando</button>
          <button onClick={() => { resetB1(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-500 hover:bg-emerald-400 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-emerald-500/20 transition-all">Finalizar</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'quimica-5') {
    const { mTarget, matraz, sal } = useSimuladorStore.getState().soluciones;
    const pm = Math.max(0.001, sal?.pm ?? 58.44);
    const vol = Math.max(0.001, matraz.agua / 1000);
    const currentMolarity = (sal && matraz.agua > 0) ? (matraz.polvo * (sal.purity ?? 1.0)) / pm / vol : 0;
    const accuracy = mTarget > 0 ? Math.max(0, 100 - Math.abs((currentMolarity - mTarget) / mTarget) * 100) : 0;
    return (
      <Wrapper border="border-cyan-500/30" glow="bg-cyan-500/10" bg="from-[#030712] to-[#0f172a]">
        <Awards3 color="text-cyan-400" />
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación Química Analítica</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 bg-gradient-to-r from-cyan-400 to-blue-400 bg-clip-text text-transparent">¡Solución Certificada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8">
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Concentración Final</span><span className="text-xl font-black font-mono">{currentMolarity.toFixed(3)} M</span></div>
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Precisión Analítica</span><span className="text-xl font-black font-mono">{accuracy.toFixed(1)}%</span></div>
        </div>
        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] transition-all border border-white/10">Seguir Experimentando</button>
          <button onClick={() => { resetP5(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase tracking-widest rounded-[1.5rem] shadow-xl shadow-cyan-500/20 transition-all">Finalizar Práctica</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'matematicas-4') {
    const { catetoA, catetoB } = useSimuladorStore.getState().pitagoras;
    const hipotenusa = Math.sqrt(catetoA**2 + catetoB**2);
    return (
      <Wrapper border="border-emerald-500/30" glow="bg-emerald-500/10">
        <Awards3 color="text-emerald-400" />
        <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Certificación en Geometría</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Teorema Validado!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8 relative z-10">
          <div><span className="text-[11px] font-black text-emerald-400/80 uppercase block mb-1">Terna Pitagórica</span><span className="text-xl font-black">{catetoA}² + {catetoB}² = {Math.round(hipotenusa**2)}</span></div>
          <div><span className="text-[11px] font-black text-emerald-400/80 uppercase block mb-1">Hipotenusa (c)</span><span className="text-xl font-black font-mono">{hipotenusa.toFixed(2)}</span></div>
        </div>
        <NavButtons onFinish={() => { resetM4(); router.push(hubPath); }} />
      </Wrapper>
    );
  }

  if (normalizedId === 'matematicas-5') {
    const { angulo } = useSimuladorStore.getState().trigonometria;
    const rad = (angulo * Math.PI) / 180;
    return (
      <Wrapper border="border-cyan-500/30" glow="bg-cyan-500/10" bg="from-[#020617] to-[#0a1a2e]">
        <Awards3 color="text-cyan-400" />
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación Trigonométrica</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Fase Sincronizada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8 relative z-10 font-mono">
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Seno (θ)</span><span className="text-xl font-black">{Math.sin(rad).toFixed(4)}</span></div>
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Coseno (θ)</span><span className="text-xl font-black">{Math.cos(rad).toFixed(4)}</span></div>
        </div>
        <div className="flex gap-3 relative z-10">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase rounded-[1.5rem] transition-all border border-white/10">Seguir</button>
          <button onClick={() => { resetM5(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase rounded-[1.5rem] shadow-xl shadow-cyan-500/20 transition-all">Finalizar</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'quimica-4') {
    const { results, targetYield } = useSimuladorStore.getState().limitante;
    const safeTargetYield = Math.max(0.001, targetYield);
    const accuracy = Math.max(0, 100 - Math.abs((results.theoreticalYield - safeTargetYield) / safeTargetYield) * 100);
    return (
      <Wrapper border="border-cyan-500/30" glow="bg-cyan-500/10" bg="from-[#020617] to-[#0a1a2e]">
        <Awards3 color="text-cyan-400" />
        <div className="text-[10px] font-black text-cyan-400 uppercase tracking-[0.3em] mb-2">Certificación Estequiométrica</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Síntesis Validada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 grid grid-cols-2 gap-5 text-left mb-8 relative z-10 font-mono">
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Rendimiento Real</span><span className="text-xl font-black">{results.theoreticalYield.toFixed(2)} g</span></div>
          <div><span className="text-[11px] font-black text-cyan-400/80 uppercase block mb-1">Precisión de Masa</span><span className="text-xl font-black">{accuracy.toFixed(1)}%</span></div>
        </div>
        <div className="flex gap-3 relative z-10">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 hover:bg-white/10 text-white font-black text-[10px] uppercase rounded-[1.5rem] transition-all border border-white/10">Seguir</button>
          <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-cyan-600 hover:bg-cyan-500 text-white font-black text-[10px] uppercase rounded-[1.5rem] shadow-xl shadow-cyan-500/20 transition-all">Finalizar</button>
        </div>
      </Wrapper>
    );
  }

  if (normalizedId === 'biologia-3') {
    const { proteina, errores } = useSimuladorStore.getState().sintesis;
    return (
      <Wrapper border="border-purple-500/30" glow="bg-purple-500/10" bg="from-[#020617] to-[#1e1b4b]">
        <Awards3 color="text-yellow-400" />
        <div className="text-[10px] font-black text-purple-400 uppercase tracking-[0.3em] mb-2">Certificación en Bio-Sintética</div>
        <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Proteína Ensamblada!</h3>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 grid grid-cols-2 gap-8 text-left mb-8">
          <div><span className="text-[11px] font-black text-purple-400 uppercase block mb-1">Longitud Peptídica</span><span className="text-3xl font-black font-mono">{proteina.length} AA</span></div>
          <div><span className="text-[11px] font-black text-purple-400 uppercase block mb-1">Precisión Genética</span><span className="text-3xl font-black font-mono">{Math.max(0, 100 - errores * 5)}%</span></div>
        </div>
        <div className="flex gap-4">
          <button onClick={onClose} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Seguir Analizando</button>
          <button onClick={() => { resetB3(); router.push(hubPath); }} className="flex-1 py-5 bg-purple-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-purple-600/20 hover:bg-purple-500 transition-all">Finalizar Misión</button>
        </div>
      </Wrapper>
    );
  }

  // Modal por defecto para el resto de las 40 prácticas
  return (
    <Wrapper border="border-emerald-500/30" glow="bg-emerald-500/10">
      <Awards3 color="text-yellow-400" />
      <div className="text-[10px] font-black text-emerald-400 uppercase tracking-[0.3em] mb-2">Certificación de Competencia</div>
      <h3 className="text-4xl font-black uppercase tracking-tighter mb-8 italic">¡Misión Completada!</h3>
      <div className="bg-white/5 border border-white/10 rounded-[2rem] p-8 mb-8">
        <span className="text-[11px] font-black text-emerald-400 uppercase block mb-1">Laboratorio</span>
        <span className="text-2xl font-black uppercase tracking-tight">{data?.titulo}</span>
      </div>
      <p className="text-sm text-slate-400 mb-10 px-6">Has validado con éxito todos los parámetros técnicos de la práctica. Los resultados han sido registrados en tu expediente académico.</p>
      <div className="flex gap-4">
        <button onClick={onClose} className="flex-1 py-5 bg-white/5 text-white font-black text-[10px] uppercase rounded-2xl border border-white/10 hover:bg-white/10 transition-all">Revisar Bitácora</button>
        <button onClick={() => { resetPractica(); router.push(hubPath); }} className="flex-1 py-5 bg-emerald-600 text-white font-black text-[10px] uppercase rounded-2xl shadow-lg shadow-emerald-600/20 hover:bg-emerald-500 transition-all">Finalizar y Salir</button>
      </div>
    </Wrapper>
  );
}
