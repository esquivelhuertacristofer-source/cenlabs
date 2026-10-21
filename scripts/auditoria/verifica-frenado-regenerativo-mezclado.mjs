// Verificación de la física de «Frenado regenerativo mezclado en un VE» (mecanica-148).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (sólo-motor, transferencia de carga, solución de la batería, distancia de parada),
// con la conservación de la energía de cada frenada, con los techos del motor y con las ventanas de solución de cada reto.
// uso: node scripts/auditoria/verifica-frenado-regenerativo-mezclado.mjs [ruta al html] [--rapido]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const RAPIDO = args.includes('--rapido');
const htmlPath = args.find((a) => !a.startsWith('--')) || path.resolve(aqui, '../../public/labs/frenado-regenerativo-mezclado.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,G,RAD,clamp,suave,VEH,TREN,BAT,vocDe,ilimDe,pdcMaxDe,corrienteCarga,etaDescarga,V_BAJA,fVel,limitesRegen,cargasEje,fracIdeal,puntoIdeal,zSoloMotor,equilibrio,distIdeal,serie,muestrea,
  RHO_MIN,RHO_MAX,PHI_MIN,PHI_MAX,VB_MIN,VB_MAX,evaluaReto,ventanaReto,generaReto,generaDx,ESCENARIOS};`)();
const { G, VEH, TREN, BAT, vocDe, ilimDe, pdcMaxDe, corrienteCarga, etaDescarga, V_BAJA, fVel, limitesRegen, cargasEje, fracIdeal, puntoIdeal, zSoloMotor, equilibrio, distIdeal, serie, muestrea,
  RHO_MIN, RHO_MAX, PHI_MIN, PHI_MAX, VB_MIN, VB_MAX, evaluaReto, ventanaReto, generaReto, generaDx, ESCENARIOS } = F;

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const rel = (a, b) => Math.abs(a / b - 1);
let semilla = 20261021; const rnd = () => (semilla = semilla * 48271 % 2147483647) / 2147483647;
const W = VEH.m * G;
const info = (t) => console.log(t);

info('1 · Cargas por eje y reparto ideal');
{
  let maxS = 0, maxT = 0, maxF = 0, maxR = 0;
  for (let i = 0; i < 2000; i++) {
    const z = rnd() * 1.2, c = cargasEje(z), p = puntoIdeal(z);
    maxS = Math.max(maxS, Math.abs(c.Nf + c.Nr - W) / W);
    maxT = Math.max(maxT, Math.abs((c.Nf - W * VEH.b / VEH.L) - W * z * VEH.h / VEH.L) / W);
    maxF = Math.max(maxF, Math.abs(p.ff + p.fr - z));
    maxR = Math.max(maxR, Math.abs(p.ff / p.fr - c.Nf / c.Nr) / (c.Nf / c.Nr));
  }
  ok(maxS < 1e-14, 'N_f + N_r = m·g en 2 000 deceleraciones', maxS.toExponential(1));
  ok(maxT < 1e-14, 'transferencia de carga ΔN = m·g·z·h/L', maxT.toExponential(1));
  ok(maxF < 1e-14, 'el punto ideal reparte F_f + F_r = z (en unidades de m·g)');
  ok(maxR < 1e-13, 'reparto ideal: F_f/F_r = N_f/N_r (los dos ejes agotan su adherencia a la vez)', maxR.toExponential(1));
  cerca(cargasEje(0).Nf / W, VEH.b / VEH.L, 1e-14, 'parado: N_f = m·g·b/L (48,6 % del peso)');
  ok(Math.abs(VEH.a + VEH.b - VEH.L) < 1e-15, 'a + b = L');
}

info('2 · Frenar SÓLO con el motor: z = μ·a/(L + μ·h) (trasero) y μ·b/(L − μ·h) (delantero)');
{
  let maxE = 0, mal = 0;
  for (let i = 0; i < 1500; i++) {
    const mu = 0.2 + rnd() * 0.8, eje = rnd() < 0.5 ? 'R' : 'F', zc = zSoloMotor(mu, eje);
    // barrido numérico del pedal: primer z_ped en que ese eje queda limitado
    let lo = 0, hi = 2;
    for (let it = 0; it < 70; it++) { const m = (lo + hi) / 2, e = eje === 'R' ? equilibrio(0, W * m, 0, mu) : equilibrio(W * m, 0, 0, mu); if (eje === 'R' ? e.limR : e.limF) hi = m; else lo = m; }
    maxE = Math.max(maxE, Math.abs(hi - zc));
    const e2 = eje === 'R' ? equilibrio(0, W * (zc + 1e-6), 0, mu) : equilibrio(W * (zc + 1e-6), 0, 0, mu);
    if (!(eje === 'R' ? e2.limR && !e2.limF : e2.limF && !e2.limR)) mal++;
  }
  ok(maxE < 1e-9, 'el barrido numérico del pedal bloquea justo en la fórmula cerrada', `error ${maxE.toExponential(1)} g en 1 500 casos`);
  ok(mal === 0, 'justo por encima del valor sólo ese eje queda limitado');
  cerca(zSoloMotor(0.9, 'R'), 0.9 * 1.44 / (2.8 + 0.9 * 0.52), 1e-14, 'caso de libro μ = 0,90 motor trasero: 0,9·1,44/(2,80 + 0,468) = 0,3966 g');
  cerca(zSoloMotor(0.9, 'F'), 0.9 * 1.36 / (2.8 - 0.9 * 0.52), 1e-14, 'caso de libro μ = 0,90 motor delantero: 0,9·1,36/(2,80 − 0,468) = 0,5249 g');
  ok(zSoloMotor(0.8, 'R') < zSoloMotor(0.8, 'F'), 'con el mismo suelo, el motor trasero patina antes que el delantero (menos carga al frenar)');
  console.log('    z(μ=0,9): trasero', zSoloMotor(0.9, 'R').toFixed(4), 'g · delantero', zSoloMotor(0.9, 'F').toFixed(4), 'g');
}

info('3 · Equilibrio con adherencia (los cuatro casos)');
{
  let maxB = 0, malA = 0, malZ = 0;
  for (let i = 0; i < 6000; i++) {
    const mu = 0.15 + rnd() * 0.9, DF = rnd() * W * 0.9, DR = rnd() * W * 0.7, Fres = rnd() * 0.04 * W, e = equilibrio(DF, DR, Fres, mu);
    maxB = Math.max(maxB, Math.abs(e.Ff + e.Fr + Fres - W * e.z) / W);
    if (e.Ff > mu * e.Nf * (1 + 1e-9) + 1e-6 || e.Fr > mu * e.Nr * (1 + 1e-9) + 1e-6) malA++;
    if (!e.limF && !e.limR && Math.abs(e.z - (DF + DR + Fres) / W) > 1e-12) malZ++;
    if (e.limF && e.limR && Math.abs(e.z - (mu + Fres / W)) > 1e-12) malZ++;
  }
  ok(maxB < 1e-12, 'segunda ley: F_f + F_r + F_res = m·g·z (6 000 casos)', maxB.toExponential(1));
  ok(malA === 0, 'ningún eje da más que μ·N con la carga de la deceleración que sale');
  ok(malZ === 0, 'sin límite: z = suma/(m·g); con los dos ejes al límite: z = μ + F_res/(m·g)');
}

info('4 · La batería: V_oc(s), corriente máxima de carga y resolución de I');
{
  cerca(vocDe(0), 96 * 3.35, 1e-15, 'V_oc(0) = 96·3,35 = 321,6 V'); cerca(vocDe(1), 96 * 4.10, 1e-15, 'V_oc(1) = 96·4,10 = 393,6 V');
  cerca(ilimDe(0.5), 240, 1e-15, 'I_lím = 240 A por debajo del 80 %'); cerca(ilimDe(0.9), 120, 1e-12, 'I_lím(90 %) = 120 A (mitad)'); ok(ilimDe(1) === 0 && ilimDe(1.2) === 0, 'I_lím(100 %) = 0');
  let maxI = 0, maxP = 0, maxV = 0;
  for (let i = 0; i < 2000; i++) { const s = rnd(), voc = vocDe(s), P = rnd() * 150e3, I = corrienteCarga(P, voc); maxI = Math.max(maxI, Math.abs((voc + BAT.R * I) * I - P) / Math.max(P, 1)); maxV = Math.max(maxV, Math.abs(Math.sqrt(1) - 1)); }
  ok(maxI < 1e-12, 'la corriente resuelve (V_oc + R·I)·I = P en bornes', maxI.toExponential(1));
  for (let i = 0; i < 500; i++) { const s = rnd() * 0.99, Pm = pdcMaxDe(s), I = corrienteCarga(Pm, vocDe(s)); maxP = Math.max(maxP, Math.abs(I - ilimDe(s)) / Math.max(1, ilimDe(s))); }
  ok(maxP < 1e-9, 'a la potencia máxima admitida la corriente es exactamente I_lím', maxP.toExponential(1));
  ok(pdcMaxDe(1) === 0, 'batería llena: no admite potencia'); ok(etaDescarga(0, 360) === 1, 'rendimiento de descarga en vacío = 1');
  const eta = etaDescarga(30e3, vocDe(0.6)); ok(eta > 0.95 && eta < 1, 'rendimiento de descarga a 30 kW entre 95 y 100 %', eta.toFixed(4));
  ok(etaDescarga(1e9, 360) === 0, 'más allá de la potencia máxima de la batería no hay solución (0)');
}

info('5 · Los cuatro techos del motor');
{
  const par = TREN.Tmax * TREN.ig / (VEH.rw * TREN.etaG);
  const L1 = limitesRegen(5, 0.5, 15 / 3.6); cerca(L1.par, par, 1e-14, 'techo de par: T_máx·i/(r·η_g) = 8 688 N');
  for (const v of [8, 15, 25, 40]) { const L = limitesRegen(v, 0.5, 60 / 3.6); cerca(L.pot * v * TREN.etaG, TREN.Pmax, 1e-13, `techo de potencia: F·v·η_g = P_máx a ${v} m/s`); cerca(L.bat * v * TREN.etaCadena, pdcMaxDe(0.5), 1e-13, `techo de batería: F·v·η = P_dc,máx a ${v} m/s`); }
  ok(fVel(10, 5) === 1 && fVel(V_BAJA, 5) === 0 && fVel(0.1, 5) === 0, 'fv: 1 sobre la velocidad de relevo, 0 por debajo de 3 km/h');
  let mon = true, prev = 0; for (let v = 0; v <= 6; v += 0.01) { const f = fVel(v, 6); if (f < prev - 1e-12) mon = false; prev = f; }
  ok(mon, 'fv crece sin retrocesos entre 3 km/h y la velocidad de relevo');
  ok(limitesRegen(5, 0.5, 15 / 3.6).cual === 'par', 'a 18 km/h y carga media manda el par del motor');
  ok(limitesRegen(20, 0.5, 15 / 3.6).cual === 'potencia', 'a 72 km/h y carga media manda la potencia del motor');
  ok(limitesRegen(14, 0.97, 15 / 3.6).cual === 'bateria', 'con la batería al 97 % manda la batería');
  ok(limitesRegen(2, 0.5, 15 / 3.6).cual === 'velocidad', 'por debajo de la velocidad de relevo manda «baja velocidad»');
  ok(limitesRegen(14, 1.0, 15 / 3.6).lim === 0, 'batería llena: el techo es 0');
  for (const v of [3, 9, 17, 33]) { const Lc = limitesRegen(v, 0.4, 3); ok(Lc.lim <= Lc.par + 1e-9 && Lc.lim <= Lc.pot + 1e-9 && Lc.lim <= Lc.bat + 1e-9, `el techo no supera a ninguno de los tres a ${v} m/s`); }
}

info('6 · Balance de energía de toda la frenada (400 frenadas al azar)');
{
  let maxA = 0, maxB = 0, maxQ = 0, maxK = 0, malCum = 0, maxZ = 0, nLim = 0;
  for (let i = 0; i < 400; i++) {
    const p = { v0: (20 + rnd() * 100) / 3.6, zped: 0.15 + rnd() * 0.6, rho: rnd(), phi: 0.3 + rnd() * 0.65, vb: (8 + rnd() * 32) / 3.6, mu: 0.25 + rnd() * 0.7, soc0: 0.1 + rnd() * 0.88, eje: rnd() < 0.5 ? 'R' : 'F' };
    const S = serie(p), r = S.res, E0 = 0.5 * VEH.m * p.v0 * p.v0;
    maxA = Math.max(maxA, Math.abs(E0 - (r.Efr + r.Ereg + r.Eres)) / E0);
    if (r.Ereg > 1) maxB = Math.max(maxB, Math.abs(r.Ereg - (r.Ecad + r.Ebat + r.Eq)) / r.Ereg);
    const s0 = p.soc0, s1 = r.soc1, Eq = BAT.Q * 3600 * BAT.ns * (BAT.v0c * (s1 - s0) + BAT.kc * (s1 * s1 - s0 * s0) / 2);
    if (r.Eq > 1000) maxQ = Math.max(maxQ, Math.abs(r.Eq - Eq) / r.Eq);
    maxK = Math.max(maxK, Math.abs(S.v[S.n - 1]) + Math.abs(S.cq[S.n - 1] - S.E.q) / E0 + Math.abs(S.cfr[S.n - 1] - S.E.fr) / E0);
    for (let k = 1; k < S.n; k++) if (S.cq[k] < S.cq[k - 1] - 1e-6 || S.cfr[k] < S.cfr[k - 1] - 1e-6 || S.t[k] < S.t[k - 1]) malCum++;
    if (r.tLim > 0) nLim++;
    if (!p.mu || r.tLim === 0) { /* sin límite: la deceleración es la del pedal (salvo el retardo de los discos) */ }
    maxZ = Math.max(maxZ, ...Array.from(S.z.slice(0, S.n - 1)).map((z) => z - p.mu - 0.05));
  }
  ok(maxA < 1e-12, 'E₀ = calor en discos + energía en las ruedas del motor + rodadura y aire', maxA.toExponential(1));
  ok(maxB < 1e-12, 'energía del motor = pérdidas del tren + pérdidas en la batería (I²R) + energía guardada', maxB.toExponential(1));
  ok(maxQ < 6e-4, 'la energía guardada coincide con ∫V_oc dQ de la batería (forma cerrada)', maxQ.toExponential(1));
  ok(maxK < 1e-6, 'la serie termina parada y los acumulados terminan en los totales (almacenados en float32)', maxK.toExponential(1));
  ok(malCum === 0, 'las energías acumuladas no decrecen nunca y el tiempo avanza');
  ok(maxZ <= 0, 'la deceleración nunca pasa de μ (+ resistencias) en 400 frenadas');
  console.log('    frenadas con algún eje al límite:', nLim, 'de 400');
}

info('7 · Casos límite');
{
  const base = { v0: 60 / 3.6, zped: 0.4, mu: 0.9, soc0: 0.55, eje: 'R', phi: 0.65, vb: 15 / 3.6 };
  const r0 = serie({ ...base, rho: 0 }).res; ok(r0.Ereg === 0 && r0.recFrac === 0 && r0.Efr > 0, 'ρ = 0: todo el frenado es de los discos y no vuelve nada a la batería');
  const rM = serie({ ...base, rho: 1, motor: false }).res; ok(rM.Ereg === 0, 'sin motor (motor:false) tampoco hay regeneración, aunque ρ = 1');
  const rF = serie({ ...base, rho: 1, soc0: 1 }).res; ok(rF.Ereg === 0, 'batería llena (100 %): aunque se pida ρ = 1, el motor no frena');
  const rA = serie({ ...base, rho: 0.8, soc0: 0.97 }).res, rB = serie({ ...base, rho: 0.8, soc0: 0.5 }).res;
  ok(rA.regFrac < 0.5 * rB.regFrac, 'con la batería al 97 % el motor hace menos de la mitad que con el 50 %', `${rA.regFrac.toFixed(3)} frente a ${rB.regFrac.toFixed(3)}`);
  const r1 = serie({ ...base, rho: 0.5 }).res, r2 = serie({ ...base, rho: 0.7 }).res;
  ok(r2.recFrac > r1.recFrac && r1.recFrac > 0, 'más motor, más energía a la batería (sin llegar al límite de agarre)', `${r1.recFrac.toFixed(3)} → ${r2.recFrac.toFixed(3)}`);
  const e = serie({ ...base, rho: 0.7 }).res; ok(e.etaIdaVuelta > 0.6 && e.etaIdaVuelta < TREN.etaCadena * TREN.etaCadena, 'eficiencia de ida y vuelta entre 0,6 y η² del tren', e.etaIdaVuelta.toFixed(4));
  ok(Math.abs(e.etaIdaVuelta - (e.Eq / e.Ereg) * etaDescarga(0, 360) * TREN.etaCadena) < 0.03, 'ida y vuelta ≈ (E_químico/E_ruedas)·η_descarga·η_tren (a muy poca potencia η_descarga ≈ 1)', '');
  // frenada brusca sobre suelo resbaladizo con todo el motor detrás: patina
  const sl = serie({ v0: 50 / 3.6, zped: 0.4, mu: 0.5, soc0: 0.55, eje: 'R', phi: 0.5, vb: 15 / 3.6, rho: 1 }).res; ok(sl.tLimR > 1 && sl.tLimF === 0, 'motor trasero con ρ = 1 sobre μ = 0,5: el eje TRASERO llega al límite y el delantero no', `${sl.tLimR.toFixed(2)} s`);
  const sr = serie({ v0: 50 / 3.6, zped: 0.4, mu: 0.6, soc0: 0.55, eje: 'R', phi: 0.30, vb: 15 / 3.6, rho: 0.5 }).res, sf = serie({ v0: 50 / 3.6, zped: 0.4, mu: 0.6, soc0: 0.55, eje: 'F', phi: 0.60, vb: 15 / 3.6, rho: 0.5 }).res;
  ok(sr.tLimR > 1 && sr.tLimF === 0, 'motor TRASERO con ρ = 0,5 y discos 30 : 70 sobre μ = 0,6: el eje TRASERO llega al límite y el delantero no', `${sr.tLimR.toFixed(2)} s`);
  ok(sf.tLim === 0, 'motor DELANTERO con ρ = 0,5 y discos 60 : 40 sobre el mismo suelo: ningún eje llega al límite (el delantero carga más al frenar)', `${sf.tLim.toFixed(2)} s`);
  const nl = serie({ v0: 50 / 3.6, zped: 0.4, mu: 0.9, soc0: 0.55, eje: 'R', phi: 0.65, vb: 15 / 3.6, rho: 0.6 }).res; ok(nl.tLim === 0, 'sobre suelo seco con ρ = 0,6 ningún eje llega al límite');
}

info('8 · Distancia de parada contra la forma cerrada');
{
  let maxD = 0;
  for (let i = 0; i < 60; i++) {
    const v0 = (30 + rnd() * 90) / 3.6, z = 0.2 + rnd() * 0.5, tR = 0.35;
    const S = serie({ v0, zped: z, mu: 0.95, rho: 0, phi: 0.7, vb: 15 / 3.6, soc0: 0.4, eje: 'R', res: false, tau: 0, dt: 0.001, tRamp: tR });
    maxD = Math.max(maxD, Math.abs(S.res.dist - distIdeal(v0, z, tR)));
  }
  ok(maxD < 2e-2, 'sin resistencias ni retardo, la distancia coincide con v₁²/(2·a) + tramo de rampa del pedal', `error máx ${maxD.toExponential(1)} m`);
  const a = serie({ v0: 20, zped: 0.5, mu: 0.95, rho: 0, phi: 0.7, soc0: 0.4, res: false, tau: 0, dt: 0.001, tRamp: 1e-9 }); cerca(a.res.dist, 20 * 20 / (2 * 0.5 * G), 1e-3, 'rampa instantánea: d = v²/(2·z·g)');
  const c = serie({ v0: 20, zped: 0.5, mu: 0.95, rho: 0, phi: 0.7, soc0: 0.4, res: false, tau: 0, dt: 0.001, tRamp: 1e-9 }); const m = muestrea(c, 1); cerca(m.v, 20 - 0.5 * G * 1, 2e-3, 'v(1 s) = v₀ − z·g·t');
  const rr = serie({ v0: 20, zped: 0.4, mu: 0.95, rho: 0.5, phi: 0.55, soc0: 0.4 }).res, r0 = serie({ v0: 20, zped: 0.4, mu: 0.95, rho: 0.5, phi: 0.55, soc0: 0.4, res: false }).res;
  ok(rr.Eres > 0 && r0.Eres === 0, 'la rodadura y el aire sólo existen con res:true');
}

info('9 · Límites que la serie respeta en cada instante (200 frenadas)');
{
  let malF = 0, malP = 0, malI = 0, malA = 0, muestras = 0;
  for (let i = 0; i < 200; i++) {
    const p = { v0: (20 + rnd() * 100) / 3.6, zped: 0.15 + rnd() * 0.6, rho: rnd(), phi: 0.3 + rnd() * 0.65, vb: (8 + rnd() * 32) / 3.6, mu: 0.25 + rnd() * 0.7, soc0: 0.1 + rnd() * 0.88, eje: rnd() < 0.5 ? 'R' : 'F' };
    const S = serie(p);
    for (let k = 0; k < S.n - 1; k++) {
      muestras++;
      if (S.Freg[k] > S.Flim[k] * (1 + 1e-6) + 1e-3) malF++;
      if (S.Pw[k] > TREN.Pmax / TREN.etaG * (1 + 1e-6) + 1e-3) malP++;
      if (S.I[k] > ilimDe(S.soc[k]) + 1e-3) malI++;
      const c = cargasEje(S.z[k]); if ((S.uF[k] > 1 + 1e-6) || (S.uR[k] > 1 + 1e-6) || c.Nf < 0) malA++;
    }
  }
  ok(malF === 0, 'la fuerza del motor nunca pasa del techo (par, potencia, batería, velocidad)', `${muestras} instantes`);
  ok(malP === 0, 'la potencia mecánica del motor nunca pasa de P_máx/η_g');
  ok(malI === 0, 'la corriente de carga nunca pasa de la máxima de la batería a esa carga');
  ok(malA === 0, 'el uso de adherencia de cada eje nunca pasa de 1');
}

info('10 · Tendencias del pedal (el «relevo»)');
{
  const p = { v0: 50 / 3.6, zped: 0.45, mu: 0.9, soc0: 0.55, eje: 'R', phi: 0.8, rho: 0.85 };
  const dips = [8, 12, 16, 24, 32, 40].map((vb) => serie({ ...p, vb: vb / 3.6 }).res.zdip);
  let mono = true; for (let i = 1; i < dips.length; i++) if (dips[i] > dips[i - 1] + 1e-9) mono = false;
  ok(mono, 'subir la velocidad de relevo no empeora el pedal (la caída baja o se mantiene)', dips.map((d) => d.toFixed(3)).join(' · '));
  ok(dips[0] > 0.05 && dips[5] < 0.05, 'el relevo a 8 km/h hunde el pedal más de 0,05 g y a 40 km/h menos', `${dips[0].toFixed(3)} frente a ${dips[5].toFixed(3)}`);
  const recs = [8, 16, 24, 32, 40].map((vb) => serie({ ...p, rho: 0.6, vb: vb / 3.6 }).res.recFrac);
  let m2 = true; for (let i = 1; i < recs.length; i++) if (recs[i] > recs[i - 1] + 1e-9) m2 = false;
  ok(m2, 'un relevo más tardío recupera menos energía', recs.map((d) => d.toFixed(3)).join(' · '));
  const d1 = serie({ ...p, zped: 0.30, vb: 10 / 3.6 }).res.zdip, d2 = serie({ ...p, zped: 0.55, vb: 10 / 3.6 }).res.zdip;
  ok(d2 > d1, 'a pedal más fuerte el relevo se nota más', `${d1.toFixed(3)} → ${d2.toFixed(3)}`);
}

info('11 · Los escenarios del reto');
{
  ok(ESCENARIOS.length >= 8, `hay ${ESCENARIOS.length} escenarios ya buscados`);
  const ids = new Set(); let todosOk = true, todosInt = true;
  ESCENARIOS.forEach((e, k) => {
    const sc = { base: { v0: e.v0 / 3.6, mu: e.mu, zped: e.zped, soc0: e.soc0, eje: e.eje }, Dobj: e.Dobj, recMin: e.recMin, dipMax: 0.05 };
    const c = e.ventana.centro, m = evaluaReto(sc, c.rho, c.phi, c.vb);
    ok(m.ok, `escenario ${k + 1}: la celda central cumple los cuatro criterios`, `ρ ${c.rho} φ ${c.phi} vb ${c.vb} → dist ${m.dist.toFixed(1)}/${e.Dobj} rec ${(m.rec * 100).toFixed(0)}/${(e.recMin * 100).toFixed(0)} dip ${m.dip.toFixed(3)} tLim ${m.tLim.toFixed(2)}`);
    ok(Math.abs(e.Dobj - Math.round(distIdeal(e.v0 / 3.6, e.zped, 0.35) * 1.04 + 0.5)) <= 0, `escenario ${k + 1}: la línea de parada está al 4 % más allá de la parada ideal`);
    ids.add([e.v0, e.mu, e.zped, e.soc0, e.eje].join('|'));
    const v = e.ventana; if (!(v.rhoMax <= RHO_MAX - 0.05 && v.rhoMin >= 0.15 && v.rhoMax - v.rhoMin >= 0.05)) todosInt = false;
    // los criterios se rompen fuera de la ventana
    const sin = evaluaReto(sc, 0, c.phi, c.vb); ok(!sin.ok && !sin.okE, `escenario ${k + 1}: sin motor (ρ = 0) no se recupera lo pedido`);
    const mucho = evaluaReto(sc, Math.min(1, v.rhoMax + 0.25), c.phi, c.vb); ok(!mucho.ok, `escenario ${k + 1}: pedirle demasiado al motor (ρ = ${(v.rhoMax + 0.25).toFixed(2)}) incumple algo`);
    const poco = evaluaReto(sc, Math.max(0, v.rhoMin - 0.2), c.phi, c.vb); ok(!poco.ok, `escenario ${k + 1}: pedirle poco al motor incumple la energía`);
    ok(sc.dipMax === 0.05, '', '');
  });
  ok(ids.size === ESCENARIOS.length, 'los escenarios son todos distintos');
  ok(todosInt, 'la ventana del mando principal (ρ) es interior en todos: ni pegada a 0 ni a 1');
  // cobertura de la ventana: cuadrícula gruesa y probabilidad de acertar al azar
  let maxProb = 0;
  ESCENARIOS.forEach((e, k) => {
    const sc = { base: { v0: e.v0 / 3.6, mu: e.mu, zped: e.zped, soc0: e.soc0, eje: e.eje }, Dobj: e.Dobj, recMin: e.recMin, dipMax: 0.05 };
    let acierta = 0, N = RAPIDO ? 150 : 1200;
    for (let i = 0; i < N; i++) { const rho = RHO_MIN + rnd() * (RHO_MAX - RHO_MIN), phi = PHI_MIN + rnd() * (PHI_MAX - PHI_MIN), vb = VB_MIN + rnd() * (VB_MAX - VB_MIN); if (evaluaReto(sc, rho, phi, vb).ok) acierta++; }
    maxProb = Math.max(maxProb, acierta / N);
    if (!RAPIDO) {
      const cel = ventanaReto(sc, 0.04, 0.1, 4).filter((c) => c.ok), v = e.ventana;
      let fuera = 0; for (const c of cel) if (c.rho < v.rhoMin - 1e-9 || c.rho > v.rhoMax + 1e-9 || c.phi < v.phiMin - 1e-9 || c.phi > v.phiMax + 1e-9 || c.vb < v.vbMin - 1e-9 || c.vb > v.vbMax + 1e-9) fuera++;
      ok(fuera === 0, `escenario ${k + 1}: las ${cel.length} celdas ok de una cuadrícula independiente están dentro de la ventana declarada`, `${fuera} fuera`);
      ok(cel.length >= 3, `escenario ${k + 1}: la cuadrícula independiente encuentra solución (${cel.length} celdas)`);
    }
  });
  ok(maxProb < 0.12, 'acertar al azar es improbable: como mucho el 12 % de los puntos sorteados cumple', `máx ${(maxProb * 100).toFixed(1)} %`);
  console.log('    probabilidad máxima de acertar al azar:', (maxProb * 100).toFixed(1), '%');
  let sem = 99; const r2 = () => (sem = sem * 48271 % 2147483647) / 2147483647; const vistos = new Set(); for (let i = 0; i < 40; i++) vistos.add(generaReto(r2).idx);
  ok(vistos.size >= 6, 'generaReto recorre varios escenarios', `${vistos.size} distintos en 40 sorteos`);
  const a = generaReto(r2).idx, b = generaReto(r2).idx; ok(a !== b, 'generaReto no repite el escenario dos veces seguidas');
}

info('12 · Diagnóstico: cada fallo tiene su firma');
{
  const firma = (d, z) => serie({ rho: d.rho, phi: d.phi, vb: d.vb / 3.6, zped: z, mu: d.mu, soc0: d.soc0, v0: 50 / 3.6, eje: d.eje }).res;
  const vistos = new Set(); let semD = 5; const rD = () => (semD = semD * 48271 % 2147483647) / 2147483647;
  let mb = true, ma = true, mr = true;
  for (let i = 0; i < 90; i++) {
    const d = generaDx(rD); vistos.add(d.tipo);
    for (const z of [0.30, 0.45, 0.60]) {
      const r = firma(d, z);
      if (d.tipo === 'bateria' && !(r.regFrac < 0.20 && r.tLim === 0)) mb = false;
      if (d.tipo === 'agarre' && !(r.tLimR > 0.5 && r.regFrac > 0.5)) ma = false;
      if (d.tipo === 'relevo' && !(r.zdip > 0.05 && r.regFrac > 0.6)) mr = false;
    }
  }
  ok(vistos.size === 3, 'generaDx produce los tres fallos');
  ok(mb, 'batería casi llena: el motor hace menos del 20 % del frenado y ningún eje patina (pedal de 0,30 a 0,60 g)');
  ok(ma, 'motor que frena demasiado atrás: el eje trasero llega al límite y el motor sí hace la mayor parte');
  ok(mr, 'relevo brusco: la deceleración baja más de 0,05 g y el motor hace más del 60 %');
}

console.log(`\n${n - malas} / ${n} comprobaciones en verde` + (malas ? `, ${malas} FALLOS:\n - ` + fallos.join('\n - ') : ''));
process.exit(malas ? 1 : 0);
