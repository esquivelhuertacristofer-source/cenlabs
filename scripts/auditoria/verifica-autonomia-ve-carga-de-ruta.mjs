// Verificación de la física del lab «Autonomía de un VE: ecuación de carga de ruta» (mecanica-134).
// Extrae el bloque FISICA del HTML (o de la parte) y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta-al-html-o-a-la-parte]
import { cargaFisica } from './_carga-autonomia-ve-carga-de-ruta.mjs';
const F = process.argv[2] ? cargaFisica(process.argv[2]) : cargaFisica();
const { G, VEH, KWH, RUTA, rhoAlt, AIRE, zRuta, rutaLlana, simulaRuta, muestraRuta, consumoCte, autonomiaCte, vOptima, autonomiaDidactica, potenciaElec, fuerzas, evaluaPlan, generaReto, barridoPlan, PLAN, SOC_MIN, parAveria } = F;
let n = 0, fallos = 0;
const ok = (c, m) => { n++; if (!c) { fallos++; console.log('  FALLA:', m); } };
const cerca = (a, b, tol, m) => { const e = Math.abs(a - b) / Math.max(1e-12, Math.abs(b)); ok(e <= tol, `${m}: ${a} vs ${b} (err rel ${e.toExponential(2)} > ${tol})`); };
const abs = (a, b, tol, m) => ok(Math.abs(a - b) <= tol, `${m}: ${a} vs ${b} (err ${Math.abs(a - b).toExponential(2)} > ${tol})`);

// 1 · atmósfera
cerca(rhoAlt(0), 1.225, 1e-15, 'rho(0)');
cerca(rhoAlt(2000), 1.0066, 2e-3, 'rho(2000 m) frente a la tabla ISA (1,0066)');
cerca(rhoAlt(3000), 0.9093, 2e-3, 'rho(3000 m) frente a la tabla ISA (0,9093)');
cerca(rhoAlt(1000), 1.1117, 2e-3, 'rho(1000 m) frente a la tabla ISA (1,1117)');

// 2 · ecuación de carga: cada término
{ const f = fuerzas(30, 0.5, 0.04, 800, Object.assign({}, VEH, { carga: 100 }));
  const m = 1850, cs = Math.sqrt(1 - 0.04 ** 2);
  cerca(f.Fa, 0.5 * rhoAlt(800) * VEH.Cd * VEH.A * 900, 1e-14, 'Fa');
  cerca(f.Fr, m * G * VEH.Crr * cs, 1e-14, 'Fr = m g Crr cosθ');
  cerca(f.Fg, m * G * 0.04, 1e-14, 'Fg = m g sinθ');
  cerca(f.Fi, m * 0.5, 1e-14, 'Fi = m a');
  cerca(f.F, f.Fa + f.Fr + f.Fg + f.Fi, 1e-14, 'suma'); }

// 3 · consumo a velocidad constante contra la fórmula cerrada
for (const vk of [30, 60, 100, 130]) { const v = vk / 3.6, p = VEH;
  const Fa = 0.5 * rhoAlt(0) * p.Cd * p.A * v * v, Fr = p.m0 * G * p.Crr, Ft = Fa + Fr;
  const Pel = Ft * v + p.P0 + p.kfe * v + p.ki * Ft + p.kcu * Ft * Ft + p.Paux;
  const wh = Pel / p.etaBat / v / 3.6, c = consumoCte(v, {}, 0, 0);
  cerca(c.whkm, wh, 1e-13, `Wh/km a ${vk} km/h`);
  const s = c.partes; cerca(s.aire + s.rod + s.pend + s.tren + s.aux, c.whkm, 1e-12, 'las partes suman el consumo a ' + vk); }

// 4 · simulación a velocidad constante en llano contra la forma cerrada (consumo y autonomía)
{ for (const vk of [50, 90, 120]) { const v = vk / 3.6, R = rutaLlana(100e3), S = simulaRuta(vk, { vIni: vk, soc0: 1 }, null, R), c = consumoCte(v, {}, R.z0, 0);
    cerca(S.Echem / KWH, c.whkm * 100 / 1000, 1e-9, `energía de 100 km a ${vk} km/h`);
    cerca(S.T, 100e3 / v, 1e-12, `tiempo a ${vk} km/h`); }
  const v = 90 / 3.6, R = rutaLlana(400e3), S = simulaRuta(90, { vIni: 90, soc0: 1 }, null, R);
  let sx = null; for (let i = 0; i < S.N; i++) if (S.soc[i] >= SOC_MIN && S.soc[i + 1] < SOC_MIN) { sx = S.s[i] + (S.soc[i] - SOC_MIN) / (S.soc[i] - S.soc[i + 1]) * S.ds; break; }
  cerca(sx / 1000, autonomiaCte(v, {}, 1, SOC_MIN, R.z0), 1e-9, 'autonomía de 100 % a 10 % a 90 km/h (simulada vs cerrada)'); }

// 5 · velocidad de consumo mínimo
{ const par = { ki: 0, kcu: 0, etaBat: 1 }, a = 0.5 * rhoAlt(0) * VEH.Cd * VEH.A, vc = Math.cbrt((VEH.P0 + VEH.Paux) / (2 * a));
  cerca(vOptima(par, 0), vc, 1e-6, 'v óptima (cerrada ∛((P0+Paux)/(2a)))');
  let mejor = 1e9, vm = 0; for (let v = 3; v <= 45; v += 0.005) { const w = consumoCte(v, {}, 0, 0).whkm; if (w < mejor) { mejor = w; vm = v; } }
  abs(vOptima({}, 0), vm, 0.01, 'v óptima completa frente al barrido');
  const vo = vOptima({}, 0) * 3.6; ok(vo > 30 && vo < 60, 'el óptimo es interior (30–60 km/h): ' + vo.toFixed(1));
  ok(consumoCte(vOptima({}, 0) * 0.5, {}, 0, 0).whkm > mejor && consumoCte(vOptima({}, 0) * 2, {}, 0, 0).whkm > mejor, 'a media y doble velocidad el consumo es mayor');
  ok(vOptima({}, 0, 3000) > vOptima({}, 0, 100), 'con más auxiliares el óptimo sube'); }

// 6 · pendiente constante: trabajo del aire, de la rodadura y de la pendiente contra la integral analítica
{ const sn = 0.05, L = 4000, R = { L, ds: 100, zonas: [[0, L]], zonaTipo: [0], zf: (s) => sn * s }, v = 80 / 3.6, m = VEH.m0;
  const S = simulaRuta(80, { vIni: 80 }, null, R), b = AIRE.beta, k1 = AIRE.k + 1;
  cerca(S.cum.Eg[S.N], m * G * sn * L, 1e-12, 'trabajo de la pendiente m g Δz');
  cerca(S.cum.Er[S.N], m * G * VEH.Crr * Math.sqrt(1 - sn * sn) * L, 1e-12, 'trabajo de la rodadura');
  cerca(S.cum.Ea[S.N], 0.5 * VEH.Cd * VEH.A * v * v * AIRE.rho0 / (b * sn * k1) * (1 - Math.pow(1 - b * sn * L, k1)), 1e-6, 'trabajo del aire con ρ(z) (integral exacta)');
  abs(S.cum.Ei[S.N], 0, 1e-8, 'sin inercia a velocidad constante'); }

// 7 · CONSERVACIÓN en la ruta de montaña con planes distintos
for (const plan of [[100, 100, 100], [60, 80, 120], [130, 50, 60], [90, 110, 70]]) for (const esc of [{}, { carga: 300, Paux: 2200, soc0: 0.9 }]) {
  const S = simulaRuta(plan, esc), N = S.N, c = S.cum, tag = JSON.stringify(plan) + JSON.stringify(esc);
  const m = VEH.m0 + (esc.carga || 0);
  cerca(c.Eg[N], m * G * (S.z[N] - S.z[0]), 1e-12, 'Eg = m g Δz ' + tag);
  cerca(c.Ei[N], 0.5 * m * (S.v[N] ** 2 - S.v[0] ** 2), 1e-11, 'Ei = ΔEc ' + tag);
  let sFds = 0; for (let i = 0; i < N; i++) sFds += (S.Fa[i] + S.Fr[i] + S.Fg[i] + S.Fi[i]) * S.ds;
  cerca(c.Ea[N] + c.Er[N] + c.Eg[N] + c.Ei[N], sFds, 1e-11, 'ΣF·ds ' + tag);
  cerca(c.Eel[N], sFds + c.Efric[N] + c.Eloss[N] + c.Eaux[N], 1e-10, 'balance en bornes ' + tag);
  cerca(S.Echem, c.Eel[N] + c.Ebat[N], 1e-10, 'balance químico ' + tag);
  cerca(S.soc[N], (esc.soc0 || 1) - S.Echem / VEH.Ebat, 1e-12, 'SOC = SOC0 − E/Ebat ' + tag);
  ok(c.Ereg[N] >= 0, 'regeneración no negativa');
  ok(c.Egen[N] <= c.Ereg[N] + 1e-6, 'lo que entra a la batería < lo que absorbe el motor ' + tag);
  let T = 0; for (let i = 0; i < N; i++) T += S.ds / S.vm[i]; cerca(T, S.T, 1e-12, 'tiempo ' + tag);
  for (let i = 0; i < N; i += 97) { const a = (S.v[i + 1] ** 2 - S.v[i] ** 2) / (2 * S.ds); ok(Math.abs(S.Fi[i] - m * a) < 1e-9 * (1 + Math.abs(m * a)), 'Fi = m a'); }
  let amax = 0; for (let i = 1; i <= N; i++) amax = Math.max(amax, Math.abs(S.v[i] ** 2 - S.v[i - 1] ** 2) / (2 * S.ds));
  ok(amax <= Math.max(VEH.aAcc, VEH.aDec) + 1e-9, 'aceleraciones acotadas: ' + amax);
}

// 8 · regeneración limitada
{ const p = Object.assign({}, VEH), v = 20;
  const f1 = fuerzas(v, 0, -0.08, 0, p), q1 = potenciaElec(f1.F, v, p, 0);
  ok(f1.F < 0, 'bajada fuerte frena');
  abs(q1.Freg, Math.min(-f1.F, p.Fregmax, p.Pregmax / v), 1e-9, 'Freg = mín(|F|, Fmáx, Pmáx/v)');
  abs(q1.Freg + q1.Ffric, -f1.F, 1e-9, 'Freg + Ffric = |F|');
  ok(q1.Freg * v <= p.Pregmax + 1e-6, 'potencia regenerada ≤ Pmáx');
  ok(q1.Pel < 0, 'la batería se carga en una bajada fuerte');
  const q0 = potenciaElec(-300, 0.2, p, 0); abs(q0.Freg, 0, 1e-9, 'sin regeneración casi parado');
  const a = potenciaElec(1e-9, 15, p, 0).Pel, b = potenciaElec(-1e-9, 15, p, 0).Pel; abs(a, b, 1e-3, 'continuidad de la potencia en F = 0');
  const Fh = 1500, v2 = 15, drive = potenciaElec(Fh, v2, p, 0).Pel, regen = -potenciaElec(-Fh, v2, p, 0).Pel;
  ok(regen < Fh * v2 && drive > Fh * v2, 'rendimiento de ida y vuelta < 1'); }

// 9 · reto: el conjunto factible es pequeño e interior
{ let sem = 12345; const rnd = () => (sem = sem * 48271 % 2147483647) / 2147483647;
  for (let k = 0; k < 5; k++) { const t0 = Date.now(), sc = generaReto(rnd); if (!sc) { ok(false, 'generaReto devolvió null'); continue; }
    const full = barridoPlan(sc), fact = full.filter((x) => x.ok);
    ok(fact.length >= 12 && fact.length <= 140, 'factibles en [12,140]: ' + fact.length);
    const lento = evaluaPlan(sc, [PLAN.vmin, PLAN.vmin, PLAN.vmin]), rapido = evaluaPlan(sc, [PLAN.vmax, PLAN.vmax, PLAN.vmax]);
    ok(!lento.okT && lento.okSoc, 'el plan más lento llega con batería pero tarde'); ok(!rapido.okSoc && rapido.okT, 'el más rápido llega a tiempo pero sin batería');
    const mejor = fact.reduce((a, b) => (b.socFin > a.socFin ? b : a));
    console.log('   escenario', JSON.stringify({ h: +(sc.Tlim / 3600).toFixed(2), carga: sc.carga, Paux: sc.Paux, soc0: sc.soc0 }), 'factibles', fact.length + '/' + full.length, 'mejor', mejor.plan.join('/'), 'SOC', mejor.socFin.toFixed(3), 'T', (mejor.T / 3600).toFixed(2), 'h', (Date.now() - t0) + ' ms');
    ok(!fact.some((x) => x.plan.every((v) => v === PLAN.vmin)), 'todo-mínimo no es factible');
    ok(!fact.some((x) => x.plan.every((v) => v === PLAN.vmax)), 'todo-máximo no es factible');
    // la solución es INTERIOR: ningún eje pide su cota mínima ni su máxima en TODOS los factibles
    for (let e = 0; e < 3; e++) { const vs = fact.map((x) => x.plan[e]); ok(Math.min(...vs) > PLAN.vmin || Math.max(...vs) < PLAN.vmax, 'eje ' + e + ' no abarca todo el rango'); }
  } }

// 10 · averías: huellas en la curva Wh/km(v)
{ const sano = (v) => consumoCte(v / 3.6, {}, 0, 0).whkm;
  const exceso = (k, mag, v) => { const a = parAveria(k, mag); return consumoCte(v / 3.6, a.par, 0, 0, a.Paux).whkm - sano(v); };
  for (const mag of [1.7, 2.0, 2.2]) { const r = exceso('rod', mag, 120) / exceso('rod', mag, 50); ok(r > 0.8 && r < 1.8, 'rod: exceso casi constante ' + r.toFixed(2)); }
  for (const mag of [1.35, 1.5, 1.6]) { const r = exceso('baca', mag, 120) / exceso('baca', mag, 50); ok(r > 3.0, 'baca: exceso ∝ v² ' + r.toFixed(2)); }
  for (const mag of [1.8, 2.2, 2.6]) { const r = exceso('aux', mag, 120) / exceso('aux', mag, 50); ok(r < 0.6, 'aux: exceso ∝ 1/v ' + r.toFixed(2)); } }

// 11 · fase 1 (cálculo a mano)
{ const c = { E: 60, eta: 0.9, v: 100, Cd: 0.27, A: 2.3, m: 1800, Crr: 0.01 };
  const Fm = 0.5 * 1.225 * 0.27 * 2.3 * (100 / 3.6) ** 2 + 1800 * 9.80665 * 0.01;
  cerca(autonomiaDidactica(c), 0.9 * 60000 * 0.9 / (Fm / 3.6), 1e-13, 'autonomía didáctica = 0,9·E·η/(F/3,6)'); }

// 12 · la ruta
{ const S = simulaRuta([100, 80, 100]);
  ok(Math.abs(zRuta(0) - 600) < 20 && zRuta(100e3) > 2300 && zRuta(100e3) < 2400, 'cota del puerto');
  let gmax = 0; for (let s = 0; s < RUTA.L; s += 100) gmax = Math.max(gmax, Math.abs((zRuta(s + 100) - zRuta(s)) / 100));
  ok(gmax < 0.08, 'pendiente máxima < 8 %: ' + (gmax * 100).toFixed(1) + ' %'); console.log('   pendiente máxima', (gmax * 100).toFixed(2), '%');
  const m = muestraRuta(S, 70e3); ok(m.zona === 1 && m.grade > 0.02, 'en la subida la pendiente es positiva'); }

console.log(`\n${n} comprobaciones, ${fallos} fallos`);
process.exit(fallos ? 1 : 0);
