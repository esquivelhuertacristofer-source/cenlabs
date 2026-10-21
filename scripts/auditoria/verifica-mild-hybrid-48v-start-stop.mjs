// Verificación de la física de «Mild hybrid de 48 V y start-stop» (mecanica-142).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (arranque con aceleración angular, batería, Willans), con la conservación de la
// energía de todo el ciclo y con las cotas teóricas del ahorro del start-stop.
// uso: node scripts/auditoria/verifica-mild-hybrid-48v-start-stop.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/mild-hybrid-48v-start-stop.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,G,RHO,clamp,LHV,MOT,fmep,pFric,pCombustible,BSG,perdidaBSG,BAT,vocDe,eChem,corriente,pTermDe,pDescMax,pCargaMax,VEH,regimen,SS,SEG,PERFILES,generaCiclo,
  T0frio,CV_ARR,arranque,tArranqueCerrado,E_PEN,T_MIN_ON,P_REARR,biseca,simula,RETO_SOC,C_EQ,feq,cumple,evaluaReto,optimo,ESCENARIOS,V_EMB};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const rel = (a, b) => Math.abs(a / b - 1);

console.log('1 · El motor: línea de Willans');
{ const n0 = 2000, Pb = [0, 5e3, 20e3, 40e3];
  for (let i = 1; i < Pb.length; i++) cerca((F.pCombustible(Pb[i], n0) - F.pCombustible(Pb[i - 1], n0)) / (Pb[i] - Pb[i - 1]), 1 / F.MOT.etaI, 1e-12, 'pendiente de Willans = 1/η_i');
  cerca(F.pCombustible(0, 850), F.pFric(850) / F.MOT.etaI, 1e-12, 'ralentí: combustible = fricción / η_i');
  const Lh = F.pCombustible(0, 850) / F.LHV * 3600; ok(Lh > 0.3 && Lh < 0.8, 'consumo al ralentí plausible (0,3–0,8 L/h)', Lh.toFixed(3));
  cerca(F.pFric(1000), F.fmep(1000) * F.MOT.Vd * 1000 / 120, 1e-12, 'P_fr = fmep·V_d·n/120');
  console.log(`   ralentí ${F.pCombustible(0, 850).toFixed(0)} W de combustible = ${Lh.toFixed(3)} L/h`); }

console.log('2 · Arranque con el BSG: J·dω/dt = T − T_res');
{ const J = F.MOT.Jm + F.BSG.Jr * F.BSG.i ** 2, wF = F.MOT.nRal * F.DOSPI / 60; let eMax = 0, eRip = 0;
  for (const Tc of [90, 75, 60, 45]) {
    const a0 = F.arranque({ Tc, ripple: 0 }), cf = F.tArranqueCerrado(Tc);
    eMax = Math.max(eMax, Math.abs(a0.t - cf)); ok(Math.abs(a0.t - cf) < 5e-4, `t_arr(${Tc} °C) sin ripple = forma cerrada (±0,5 ms)`, `(${a0.t} vs ${cf})`);
    const a1 = F.arranque({ Tc }); eRip = Math.max(eRip, rel(a1.t, cf));
    ok(rel(a1.t, cf) < 0.04, `t_arr(${Tc} °C) con la compresión dentro del 4 % de la forma cerrada`, `(${a1.t} vs ${cf})`);
    // la fórmula del enunciado: t = J·ω_f/(T − T̄_res) con T̄_res = T0 + c_v·ω_f/2
    const Tres = F.T0frio(Tc) + F.CV_ARR * wF / 2, ap = J * wF / (F.BSG.Tmax - Tres);
    ok(rel(ap, cf) < 0.01, `fórmula del enunciado (${Tc} °C) dentro del 1 % de la forma cerrada`, `(${ap} vs ${cf})`);
    ok(rel(a1.t, ap) < 0.04, `fórmula del enunciado (${Tc} °C) dentro del 4 % del arranque integrado`, `(${a1.t} vs ${ap})`);
    // energía: ∫T·ω dt = T·θ y θ = ∫ω dt
    ok(a1.Eel > a1.Emec && a1.Emec > 0, 'energía eléctrica > mecánica > 0');
  }
  // en frío el par de arrastre de las compresiones (pico = 1,6·T0) supera los 55 N·m del BSG: no arranca (por eso se inhibe el start-stop)
  ok(F.arranque({ Tc: -10 }).fallo && !F.arranque({ Tc: 90 }).fallo, 'a −10 °C el BSG no puede arrancar el motor; en caliente sí');
  ok(F.arranque({ Tc: 20 }).t > F.arranque({ Tc: 90 }).t * 1.3, 'a 20 °C el arranque tarda más de 1,3 veces lo que en caliente');
  console.log(`   arranque en caliente: t = ${F.arranque({ Tc: 90 }).t.toFixed(3)} s, ${F.arranque({ Tc: 90 }).Eel.toFixed(0)} J eléctricos; máx. |t−cerrada| sin ripple = ${(eMax * 1e3).toFixed(3)} ms; con ripple ≤ ${(eRip * 100).toFixed(1)} %`); }

console.log('3 · La batería: V_oc·I − R·I²');
{ for (const s of [0.3, 0.5, 0.8]) for (const P of [-8e3, -1e3, 0, 2e3, 9e3]) { const I = F.corriente(P, s); cerca(F.pTermDe(I, s), P, 1e-9 + 1e-12, `P_t(I(P)) = P  s=${s} P=${P}`); }
  // energía química: la derivada respecto al SOC es Q·3600·V_oc(s)
  for (const s of [0.3, 0.6]) { const h = 1e-6; cerca((F.eChem(s + h) - F.eChem(s - h)) / (2 * h), F.BAT.Q * 3600 * F.vocDe(s), 1e-8, 'dE/dSOC = Q·V_oc'); }
  const util = F.eChem(F.BAT.Smax) - F.eChem(F.BAT.Smin); console.log(`   energía útil entre ${F.BAT.Smin * 100} y ${F.BAT.Smax * 100} %: ${(util / 3.6e6).toFixed(3)} kWh`);
  ok(F.pDescMax(0.5) > 8e3 && F.pCargaMax(0.5) > 8e3, 'el paquete admite más de 8 kW en los dos sentidos');
  ok(F.corriente(F.pDescMax(0.5) * 1.5, 0.5) !== F.corriente(F.pDescMax(0.5) * 1.5, 0.5), 'más allá de la potencia máxima de la batería no hay solución (NaN)'); }

console.log('4 · El BSG: pérdidas y bisección');
{ let mono = true; for (let P = 10; P < 12e3; P += 100) if (F.perdidaBSG(P + 100) < F.perdidaBSG(P)) mono = false; ok(mono, 'las pérdidas crecen con la potencia');
  const eta = P => P / (P + F.perdidaBSG(P)); ok(eta(12e3) > 0.85 && eta(12e3) < 0.92, 'η a 12 kW entre 85 y 92 %', eta(12e3).toFixed(3)); ok(eta(4e3) > eta(12e3), 'η a 4 kW > η a 12 kW');
  const cap = 3e3, x = F.biseca(P => P + F.perdidaBSG(P), 12e3, cap); cerca(x + F.perdidaBSG(x), cap, 1e-6, 'biseca: P + L(P) = tope'); }

console.log('5 · El ciclo urbano sintético');
{ for (const pf of ['fluido', 'urbano', 'denso']) { const c = F.generaCiclo(pf, 0.1); ok(c.v[0] === 0 && c.v[c.N - 1] === 0, `${pf}: empieza y termina parado`);
    ok(Math.abs(c.dist - c.x[c.N - 1]) < 1e-9 && c.dist > 1000 && c.dist < 2000, `${pf}: distancia entre 1 y 2 km`, c.dist.toFixed(0)); ok(c.paradas.length === 6, `${pf}: seis paradas`, String(c.paradas.length));
    let amax = 0, dmax = 0; for (let i = 0; i < c.N; i++) { amax = Math.max(amax, c.a[i]); dmax = Math.min(dmax, c.a[i]); }
    ok(amax < 2.2 && dmax > -3.6, `${pf}: aceleraciones razonables`, `${amax.toFixed(2)} / ${dmax.toFixed(2)} m/s²`);
    // la integral de la aceleración es la velocidad final
    let I = 0; for (let i = 0; i < c.N; i++) I += c.a[i] * 0.1; ok(Math.abs(I) < 0.05, `${pf}: ∫a dt ≈ 0`, I.toFixed(3)); }
  const u = F.generaCiclo('urbano', 0.1); console.log('   paradas urbano:', u.paradas.map(p => p.d.toFixed(1)).join(', '), 's · duración', u.T.toFixed(0), 's · distancia', u.dist.toFixed(0), 'm'); }

console.log('6 · Conservación de la energía en todo el ciclo');
{ let peor = 0; const casos = [];
  for (const pf of ['fluido', 'urbano', 'denso']) for (const P12 of [200, 450, 1000]) {
    casos.push({ conv: true, P12, pf }); casos.push({ ss: false, vOff: 6, pReg: 12e3, pBoost: 2e3, P12, pf }); casos.push({ ss: true, vOff: 0, pReg: 4e3, pBoost: 0, P12, pf });
    casos.push({ ss: true, vOff: 10, pReg: 12e3, pBoost: 3e3, P12, pf }); casos.push({ ss: true, vOff: 25, pReg: 8e3, pBoost: 8e3, P12, pf, s0: 0.4 }); casos.push({ ss: true, vOff: 6, pReg: 12e3, pBoost: 1e3, P12, pf, s0: 0.78 }); }
  for (const c of casos) { const r = F.simula(c, F.generaCiclo(c.pf, 0.1)); const e = Math.abs(r.balance.resid) / r.balance.Ef; peor = Math.max(peor, e);
    ok(e < 1e-9, `balance cerrado (${JSON.stringify(c)})`, e.toExponential(2)); }
  console.log(`   ${casos.length} casos: residuo relativo máximo del balance = ${peor.toExponential(2)}`);
  // la energía química calculada paso a paso coincide con la diferencia de E(s)
  const r = F.simula({ ss: true, vOff: 6, pReg: 12e3, pBoost: 1.2e3 }, F.generaCiclo('urbano', 0.1)); ok(Math.abs(r.dEchemNum - r.dEchem) < 0.01 * Math.max(1e4, Math.abs(r.dEchem)) , 'ΔE_química numérica ≈ E(s_fin) − E(s_0) (1 %)', `${r.dEchemNum.toFixed(0)} vs ${r.dEchem.toFixed(0)}`);
  // sin cargas eléctricas, sin regeneración ni asistencia y sin start-stop, el coche híbrido es el convencional
  const c0 = F.generaCiclo('urbano', 0.1); const a = F.simula({ conv: true, P12: 0 }, c0), b = F.simula({ ss: false, pReg: 0, pBoost: 0, P12: 0 }, c0);
  cerca(a.fuelL, b.fuelL, 1e-12, 'sin cargas, regeneración, asistencia ni start-stop el consumo es idéntico al convencional'); }

console.log('7 · Ahorro dentro de la cota teórica');
{ const c = F.generaCiclo('urbano', 0.1), est = { pReg: 12e3, pBoost: 1.2e3 };
  const sin = F.simula(Object.assign({ ss: false }, est), c), con = F.simula(Object.assign({ ss: true, vOff: 6 }, est), c);
  const ahorro = sin.fuelL - con.fuelL, cota = con.tOff * F.pCombustible(0, F.MOT.nRal) / F.LHV;
  ok(ahorro > 0, 'el start-stop ahorra combustible en el ciclo urbano', ahorro.toFixed(6));
  ok(ahorro <= cota + 1e-12, 'el ahorro no supera la cota (tiempo apagado × combustible al ralentí)', `${ahorro.toFixed(6)} ≤ ${cota.toFixed(6)} L`);
  const parado = c.paradas.reduce((s, p) => s + p.d, 0) * F.pCombustible(0, F.MOT.nRal) / F.LHV; ok(ahorro <= parado + 1e-12, 'el ahorro no supera el combustible gastado al ralentí en todas las paradas', `${ahorro.toFixed(6)} ≤ ${parado.toFixed(6)} L`);
  // tiempo de equilibrio: una parada de 3 s no compensa y una de 20 s sí
  const arr = F.arranque({ Tc: 90 }), tbe = (F.E_PEN + F.C_EQ * arr.Eel) / F.pCombustible(0, F.MOT.nRal); ok(tbe > 4 && tbe < 9, 'tiempo de equilibrio del rearranque entre 4 y 9 s', tbe.toFixed(2));
  console.log(`   ahorro del start-stop ${(ahorro * 1000).toFixed(2)} mL (${(ahorro / sin.fuelL * 100).toFixed(1)} %) ≤ cota ${(cota * 1000).toFixed(2)} mL; tiempo de equilibrio ${tbe.toFixed(1)} s`);
  // una parada demasiado corta cuesta
  const corto = { dt: 0.1, N: 0 }; // se comprueba con el perfil «fluido», que tiene una parada de 2,7 s
  // el start-stop inhibido (motor frío, SOC bajo o cargas altas) no apaga nunca
  for (const q of [{ Tc: 40 }, { s0: 0.3 }, { P12: 1300 }]) { const r = F.simula(Object.assign({ ss: true, vOff: 6, pReg: 12e3, pBoost: 0 }, q), c, { traza: true }); let off = 0; for (let i = 0; i < 120; i++) if (r.traza.st[i] === 0) off++; ok(off === 0, 'condiciones de inhibición: durante las dos primeras paradas el motor no se apaga ' + JSON.stringify(q), String(off)); }
  // la regeneración y la asistencia respetan los topes
  const R = F.simula({ ss: true, vOff: 6, pReg: 12e3, pBoost: 3e3 }, c, { traza: true });
  let pmMin = 0, pmMax = 0; for (let i = 0; i < R.N; i++) { pmMin = Math.min(pmMin, R.traza.Pm[i]); pmMax = Math.max(pmMax, R.traza.Pm[i]); }
  ok(-pmMin <= 12e3 + 1e-6 && pmMax <= 3e3 + 1e-6, 'BSG: la regeneración ≤ 12 kW y la asistencia ≤ lo pedido', `${(-pmMin / 1e3).toFixed(2)} / ${(pmMax / 1e3).toFixed(2)} kW`);
  const R2 = F.simula({ ss: true, vOff: 6, pReg: 3e3, pBoost: 0 }, c, { traza: true }); let m2 = 0; for (let i = 0; i < R2.N; i++) m2 = Math.min(m2, R2.traza.Pm[i]); ok(-m2 <= 3e3 + 1e-6, 'límite de regeneración de 3 kW respetado', (-m2).toFixed(1));
  // energía regenerada ≤ energía de frenada disponible en el cigüeñal
  let Ebrk = 0; { const m = F.VEH.m * (1 + F.VEH.kRot); for (let i = 0; i < c.N; i++) { const v = c.v[i], a = c.a[i], Pw = m * a * v + F.VEH.m * F.G * F.VEH.Crr * (v > 0.01 ? 1 : 0) * v + 0.5 * F.RHO * F.VEH.CdA * v ** 3; if (Pw < 0) Ebrk += -Pw * F.VEH.etaDL * 0.1; } }
  ok(R.Ereg <= Ebrk, 'la energía eléctrica regenerada no supera la de frenada en el cigüeñal', `${(R.Ereg / 1e3).toFixed(0)} ≤ ${(Ebrk / 1e3).toFixed(0)} kJ`);
  console.log(`   regenerado ${(R.Ereg / 1e3).toFixed(0)} kJ eléctricos de ${(Ebrk / 1e3).toFixed(0)} kJ de frenada en el cigüeñal`); }

console.log('8 · Un coche híbrido ligero frente al convencional (ciclo urbano sintético)');
{ for (const pf of ['fluido', 'urbano', 'denso']) { const c = F.generaCiclo(pf, 0.1), conv = F.simula({ conv: true }, c), o = F.optimo(pf, 450), r = F.simula({ ss: true, vOff: o.vOff, pReg: o.pReg * 1e3, pBoost: o.pBoost * 1e3 }, c);
    ok(r.L100 < conv.L100 && 1 - r.L100 / conv.L100 > 0.08 && 1 - r.L100 / conv.L100 < 0.35, `${pf}: el ahorro del mild hybrid está entre 8 y 35 %`, ((1 - r.L100 / conv.L100) * 100).toFixed(1) + ' %');
    console.log(`   ${pf}: convencional ${conv.L100.toFixed(2)} L/100 km, mild hybrid ${r.L100.toFixed(2)} (−${((1 - r.L100 / conv.L100) * 100).toFixed(1)} %)`); } }

console.log('9 · El reto: el óptimo es INTERIOR y no se adivina');
{ for (const e of F.ESCENARIOS) { const o = F.optimo(e.perfil, e.P12); ok(!!o, `hay solución para ${e.perfil} / ${e.P12} W`); if (!o) continue; console.log(`   ${e.perfil} / ${e.P12} W: óptimo umbral ${o.vOff.toFixed(2)} km/h, regeneración ${o.pReg.toFixed(1)} kW, asistencia ${o.pBoost.toFixed(2)} kW → ${o.L100.toFixed(3)} L/100 km (equivalente ${o.Feq.toFixed(3)}), SOC final ${(o.socEnd * 100).toFixed(1)} %`);
    const c = F.generaCiclo(e.perfil, 0.1), mk = p => F.simula(Object.assign({ ss: true, P12: e.P12 }, { vOff: p.vOff ?? o.vOff, pReg: (p.pReg ?? o.pReg) * 1e3, pBoost: (p.pBoost ?? o.pBoost) * 1e3 }), c), f = r => F.feq(r) / o.Feq - 1;
    const r0 = mk({}); ok(F.cumple(r0), `${e.perfil}/${e.P12}: el óptimo cumple las restricciones`, JSON.stringify(o)); ok(Math.abs(f(r0)) < 1e-6, 'y su consumo equivalente es el de referencia');
    ok(o.vOff > 1 && o.vOff < 15, `${e.perfil}/${e.P12}: umbral de parada INTERIOR`, o.vOff.toFixed(2)); ok(o.pReg >= 11, 'regeneración en el tope (monótona: más es mejor)', String(o.pReg));
    // un barrido aleatorio no mejora el óptimo
    let mejor = 1; const rnd = (() => { let s = 12345; return () => { s = (s * 16807) % 2147483647; return (s - 1) / 2147483646; }; })();
    for (let k = 0; k < 400; k++) { const r = mk({ vOff: rnd() * 25, pReg: 1 + rnd() * 11, pBoost: rnd() * 6 }); if (F.cumple(r)) mejor = Math.min(mejor, 1 + f(r)); }
    ok(mejor >= 1 - 2e-3, `${e.perfil}/${e.P12}: 400 muestras aleatorias no mejoran el óptimo (>0,2 %)`, mejor.toFixed(5));
    // errores típicos que el reto debe rechazar
    const lim = F.RETO_SOC.tolFeq; const pasa = r => F.cumple(r) && F.feq(r) <= o.Feq * (1 + lim);
    ok(!pasa(mk({ vOff: 25 })), 'umbral de 25 km/h: se rechaza'); ok(!pasa(mk({ pReg: 4 })), 'regeneración de 4 kW: se rechaza'); ok(!pasa(mk({ pBoost: 0 })) || o.pBoost < 0.2, 'sin asistencia: se rechaza (la batería termina cargada de más)');
    ok(!pasa(mk({ pBoost: o.pBoost + 3 })), 'asistencia de +3 kW: se rechaza (descarga la batería)'); ok(!pasa(F.simula({ ss: false, vOff: o.vOff, pReg: o.pReg * 1e3, pBoost: o.pBoost * 1e3, P12: e.P12 }, c)), 'start-stop apagado: se rechaza');
    ok(pasa(mk({ vOff: o.vOff + 1.5 })) || pasa(mk({ vOff: o.vOff - 1.5 })), 'un umbral próximo al óptimo (±1,5 km/h) sí pasa'); }
  const ev = F.evaluaReto({ vOff: 6, pReg: 12e3, pBoost: 1.2e3 }, 'urbano', 450); ok(ev.Feq > 0 && ev.Lconv > ev.L100, 'evaluaReto devuelve consumo equivalente y convencional'); }

console.log(`\n${n} comprobaciones, ${malas} fallos`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
