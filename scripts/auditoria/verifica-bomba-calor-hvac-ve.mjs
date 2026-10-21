// Verificación de la física de «Climatización y bomba de calor del VE» (mecanica-132).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con las tablas de R134a de NIST (RefProp / Tillner-Roth y Baehr, estado de referencia IIR),
// con identidades termodinámicas exactas y con la conservación de la energía del ciclo.
// uso: node scripts/auditoria/verifica-bomba-calor-hvac-ve.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/bomba-calor-hvac-ve.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {RG,MM,RS,FL,raicesZ,lnFi,psat,desv,sat,tsat,estado,vapor,liquido,tDeSV,tDeHV,ciclo,COMP,HX,CAB,etaIs,etaVol,
  demanda,demandaFrio,calefaccion,refrigeracion,optimoCalef,LIM_T2,VEH,potTraccion,autonomia,rhoAire,h0,s0};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const rel = (a, b) => Math.abs(a / b - 1);

/* Tablas NIST de R134a saturado (IIR): T °C → [p MPa, hf, hg, sf, sg (kJ/kg, kJ/kg/K), ρL, ρV (kg/m³)] */
const NIST = {
  '-30': [0.084378, 160.79, 380.32, 0.84863, 1.7515, 1388.4, 4.4259], '-20': [0.13273, 173.64, 386.55, 0.90025, 1.7413, 1358.3, 6.7845],
  '-10': [0.2006, 186.70, 392.66, 0.95065, 1.7333, 1327.1, 10.041], '0': [0.2928, 200.00, 398.60, 1.0000, 1.7271, 1294.8, 14.428],
  '10': [0.41461, 213.58, 404.32, 1.0485, 1.7221, 1261.0, 20.226], '20': [0.57171, 227.47, 409.75, 1.0962, 1.7180, 1225.3, 27.780],
  '30': [0.77020, 241.72, 414.82, 1.1435, 1.7145, 1187.5, 37.535], '40': [1.0166, 256.41, 419.43, 1.1905, 1.7111, 1146.7, 50.085],
  '50': [1.3179, 271.62, 423.44, 1.2375, 1.7072, 1102.3, 66.272], '60': [1.6818, 287.50, 426.63, 1.2848, 1.7024, 1052.9, 87.379],
};
console.log('1 · Saturación de Peng–Robinson contra NIST');
let ePmax = 0, eHgMax = 0, eHfgMax = 0, eSgMax = 0, eRhoVmax = 0, eRhoLmax = 0;
for (const [tc, nv] of Object.entries(NIST)) {
  const T = +tc + 273.15, s = F.sat(T);
  ePmax = Math.max(ePmax, rel(s.P / 1e6, nv[0]));
  eHgMax = Math.max(eHgMax, rel(s.hg / 1e3, nv[2]));
  eHfgMax = Math.max(eHfgMax, rel((s.hg - s.hf) / 1e3, nv[2] - nv[1]));
  eSgMax = Math.max(eSgMax, rel(s.sg / 1e3, nv[4]));
  eRhoVmax = Math.max(eRhoVmax, rel(s.V.rho, nv[6])); eRhoLmax = Math.max(eRhoLmax, rel(s.L.rho, nv[5]));
  // igualdad de fugacidad a la presión hallada
  const r = F.raicesZ(T, s.P); ok(Math.abs(F.lnFi(r.ZL, r.A, r.B) - F.lnFi(r.ZV, r.A, r.B)) < 1e-9, 'fugacidad igual en ' + tc + ' °C');
}
console.log(`   error máx. p_sat ${(ePmax * 100).toFixed(2)} % · h_g ${(eHgMax * 100).toFixed(2)} % · h_fg ${(eHfgMax * 100).toFixed(2)} % · s_g ${(eSgMax * 100).toFixed(2)} % · ρ_V ${(eRhoVmax * 100).toFixed(1)} % · ρ_L ${(eRhoLmax * 100).toFixed(1)} %`);
// Cifras del contrato: p_sat(0 °C) ≈ 0,293 MPa y p_sat(50 °C) ≈ 1,318 MPa, tolerancia declarada ≤ 2 %
const p0 = F.psat(273.15) / 1e6, p50 = F.psat(323.15) / 1e6;
console.log(`   p_sat(0 °C) = ${p0.toFixed(4)} MPa (libro 0,293) · p_sat(50 °C) = ${p50.toFixed(4)} MPa (libro 1,318)`);
ok(rel(p0, 0.293) <= 0.02, 'p_sat(0 °C) dentro del 2 % del libro'); ok(rel(p50, 1.318) <= 0.02, 'p_sat(50 °C) dentro del 2 % del libro');
ok(ePmax <= 0.005, 'p_sat en toda la tabla −30…60 °C dentro del 0,5 % (declarado)', 'error ' + ePmax);
ok(eHgMax <= 0.014, 'h_g dentro del 1,4 % de NIST (declarado)', 'error ' + eHgMax);
ok(eHfgMax <= 0.035, 'h_fg dentro del 3,5 % de NIST (declarado)', 'error ' + eHfgMax);
ok(eSgMax <= 0.015, 's_g dentro del 1,5 % de NIST (declarado)', 'error ' + eSgMax);
cerca(F.sat(273.15).hf, 200e3, 1e-9, 'referencia IIR: h_f(0 °C) = 200 kJ/kg'); cerca(F.sat(273.15).sf, 1000, 1e-9, 'referencia IIR: s_f(0 °C) = 1 kJ/kg/K');

console.log('2 · Identidades termodinámicas exactas de la ecuación de estado');
for (const tc of [-30, -10, 0, 25, 50, 80]) {
  const T = tc + 273.15, s = F.sat(T);
  // Clapeyron: h_fg = T·(s_g − s_f)  (igualdad de energía de Gibbs en la saturación)
  cerca((s.hg - s.hf), T * (s.sg - s.sf), 1e-7, `h_fg = T·Δs a ${tc} °C`);
  // dp/dT numérica = h_fg / (T·(v_g − v_f))
  const dT = 0.01, dpdT = (F.psat(T + dT) - F.psat(T - dT)) / (2 * dT), vfg = 1 / s.V.rho - 1 / s.L.rho;
  ok(rel(dpdT, (s.hg - s.hf) / (T * vfg)) < 2e-5, `Clapeyron dp/dT a ${tc} °C`, `${dpdT} vs ${(s.hg - s.hf) / (T * vfg)}`);
}
{ // punto crítico: Z_c universal de Peng–Robinson = 0,3074; y límite de gas ideal
  const r = F.raicesZ(F.FL.Tc, F.FL.Pc); cerca(r.ZV, 0.3074, 2.5e-2, 'Z en el punto crítico de Peng–Robinson ≈ 0,3074 (el valor universal del modelo; el real del R134a es 0,26)');
  const g = F.raicesZ(300, 100); ok(Math.abs(g.ZV - 1) < 1e-4, 'Z → 1 a presión baja'); const d = F.desv(300, 100, g.ZV); ok(Math.abs(d.h) < 5 && Math.abs(d.s) < 1e-2, 'desviación de entalpía → 0 con Z → 1');
}

console.log('3 · Ciclo por compresión de vapor: balance de energía y compresión isentrópica');
for (const [Te, Tc, sh, sc, eta] of [[-20, 50, 5, 5, 0.6], [-10, 45, 3, 8, 0.7], [0, 55, 8, 2, 0.65], [-25, 60, 5, 5, 0.55]]) {
  const c = F.ciclo(Te + 273.15, Tc + 273.15, sh, sc, eta);
  cerca(c.qCd, c.qEv + c.w, 1e-12, `balance q_cd = q_ev + w (${Te}/${Tc})`);
  cerca(c.h4, c.e3.h, 1e-12, 'expansión isentálpica h4 = h3');
  cerca(F.vapor(c.e2s.T, c.Pc).s, c.e1.s, 1e-9, `compresión ideal isentrópica (${Te}/${Tc})`);
  cerca(c.w, c.wis / eta, 1e-9, 'w real = w ideal / η_is');
  cerca(c.copH, c.copC + 1, 1e-12, 'COP_cal = COP_fr + 1');
  const carnot = (Tc + 273.15) / (Tc - Te); ok(c.copH < carnot, `COP_cal (${c.copH.toFixed(2)}) por debajo del COP de Carnot (${carnot.toFixed(2)})`);
  ok(c.x4 > 0 && c.x4 < 1, `calidad a la salida de la válvula entre 0 y 1 (${c.x4.toFixed(3)})`);
  ok(c.e2.T > c.e2s.T, 'la compresión real descarga más caliente que la ideal');
}
// el ciclo de referencia de libro (R134a, −10/+40 °C, sin sobrecalentamiento ni subenfriamiento, η = 1): COP_fr ≈ 4,7 (tablas NIST)
{ const c = F.ciclo(263.15, 313.15, 0, 0, 1);
  const hg10 = 392.66, hf40 = 256.41; const qEvN = hg10 - hf40; // NIST: h1 = h_g(−10 °C), h3 = h_f(40 °C)
  cerca(c.qEv / 1e3, qEvN, 0.012, 'efecto frigorífico de libro (h_g(−10) − h_f(40)) = ' + qEvN.toFixed(1) + ' kJ/kg'); }

console.log('4 · Bomba de calor frente a calentador resistivo a −10 °C');
const T10 = 263.15, Q10 = F.demanda(T10), r10 = F.calefaccion(T10, Q10, 1, 1, 5);
console.log(`   Q = ${Q10} W · P_el = ${r10.Ptot.toFixed(0)} W · COP = ${r10.COP.toFixed(2)} · ${r10.Nrpm.toFixed(0)} rpm · descarga ${(r10.T2 - 273.15).toFixed(0)} °C · p ${(r10.c.Pe / 1e5).toFixed(2)}/${(r10.c.Pc / 1e5).toFixed(1)} bar`);
ok(r10.Ptot < Q10, 'la bomba de calor gasta menos que el calentador resistivo a −10 °C');
cerca(r10.Qdel, r10.Qev + r10.Wsh, 1e-9, 'balance en el refrigerante: Q_cab = Q_ev + W_eje');
cerca(r10.Wel * F.COMP.etaMotor * F.COMP.etaInv, r10.Wsh, 1e-9, 'P_el·η_mot·η_inv = W_eje');
cerca(r10.Qdel, r10.m * r10.c.qCd, 1e-9, 'Q_cab = ṁ·(h2 − h3)');
ok(r10.Nrpm < 9000 && !r10.sobre, 'régimen por debajo del máximo a −10 °C');
// caída del COP al enfriarse el ambiente (monótona)
{ let prev = 1e9, mono = true; for (let T = 5; T >= -20; T -= 5) { const r = F.calefaccion(T + 273.15, F.demanda(T + 273.15), 1.2, 0.8, 4); if (r.COP > prev + 1e-9) mono = false; prev = r.COP; } ok(mono, 'el COP baja monótonamente al bajar la temperatura exterior'); }
// límite del compresor a −20 °C con aire de cabina escaso: el calor entregado cae por debajo de la demanda
{ const r = F.calefaccion(253.15, F.demanda(253.15), 0.5, 0.6, 5); ok(r.sobre && r.Qdel < r.Q - 1, 'a −20 °C con poco aire el compresor no alcanza y Q_entregado < demanda', `Nreq ${r.Nreq.toFixed(0)} rpm`); }
// A/C: el balance también cierra
{ const r = F.refrigeracion(308.15, F.demandaFrio(308.15), 1, 1, 5); cerca(r.Qcd, r.Qev + r.Wsh, 1e-9, 'A/C: Q_cd = Q_ev + W_eje'); ok(r.COP > 1.5 && r.COP < 5, 'COP del A/C a 35 °C plausible (' + r.COP.toFixed(2) + ')'); }

console.log('5 · El óptimo del reto es INTERIOR y la búsqueda coincide con un barrido');
for (const Tc of [-10, -14, -18]) {
  const T = Tc + 273.15, Q = F.demanda(T), o = F.optimoCalef(T, Q);
  // barrido fino de referencia
  let mejor = null; for (let fc = 0.4; fc <= 1.801; fc += 0.05) for (let fe = 0.4; fe <= 1.801; fe += 0.05) for (let sc = 0; sc <= 14.01; sc += 1) { const r = F.calefaccion(T, Q, fc, fe, sc); if (r.sobre || r.T2 > F.LIM_T2) continue; if (!mejor || r.Ptot < mejor.Ptot) mejor = r; }
  console.log(`   ${Tc} °C: óptimo (fc ${o.fc.toFixed(2)}, fe ${o.fe.toFixed(2)}, sc ${o.sc.toFixed(1)}) = ${o.Ptot.toFixed(0)} W · barrido ${mejor.Ptot.toFixed(0)} W (fc ${mejor.fc.toFixed(2)}, fe ${mejor.fe.toFixed(2)}, sc ${mejor.sc})`);
  ok(rel(o.Ptot, mejor.Ptot) < 0.005, `óptimo de coordenadas = barrido (${Tc} °C)`, `${o.Ptot} vs ${mejor.Ptot}`);
  ok(o.fc > 0.45 && o.fc < 1.75 && o.fe > 0.45 && o.fe < 1.75 && o.sc > 0.5 && o.sc < 13, `el óptimo es interior en los tres mandos (${Tc} °C)`);
  for (const [k, lo, hi] of [['fc', 0.4, 1.8], ['fe', 0.4, 1.8], ['sc', 0, 14]]) {
    const a = k === 'fc' ? F.calefaccion(T, Q, lo, o.fe, o.sc) : k === 'fe' ? F.calefaccion(T, Q, o.fc, lo, o.sc) : F.calefaccion(T, Q, o.fc, o.fe, lo);
    const b = k === 'fc' ? F.calefaccion(T, Q, hi, o.fe, o.sc) : k === 'fe' ? F.calefaccion(T, Q, o.fc, hi, o.sc) : F.calefaccion(T, Q, o.fc, o.fe, hi);
    ok(a.Ptot > o.Ptot * 1.005 && b.Ptot > o.Ptot * 1.005, `${k}: los dos extremos gastan más que el óptimo (${Tc} °C)`, `${a.Ptot.toFixed(0)} / ${b.Ptot.toFixed(0)} vs ${o.Ptot.toFixed(0)}`); }
  // el ajuste de partida del reto (0,7 / 1,5 / 10) y el de «un poco de todo» (1/1/5) quedan fuera del 3 %
  const ini = F.calefaccion(T, Q, 0.7, 1.5, 10), med = F.calefaccion(T, Q, 1, 1, 5);
  ok(ini.Ptot > o.Ptot * 1.03, `el punto de partida del reto no pasa (${Tc} °C)`, `${ini.Ptot.toFixed(0)} vs límite ${(o.Ptot * 1.03).toFixed(0)}`);
  console.log(`      punto medio (1/1/5): ${med.Ptot.toFixed(0)} W ${med.Ptot <= o.Ptot * 1.03 ? '(pasa)' : '(no pasa)'}`);
}

console.log('6 · Autonomía con la ecuación de carga de ruta');
{ const v = 60 / 3.6, F0 = F.VEH.m * 9.81 * F.VEH.Crr + 0.5 * F.rhoAire(263.15) * F.VEH.CdA * v * v, P = F0 * v / F.VEH.eta; cerca(F.potTraccion(60, 263.15), P, 1e-12, 'P_tracción = F·v/η');
  const a0 = F.autonomia(60, 263.15, 0), a1 = F.autonomia(60, 263.15, 3000); cerca(a0, F.VEH.Ebat * F.VEH.uso / P * v / 1000, 1e-12, 'autonomía = E_útil/P·v');
  ok(a1 < a0, 'el clima resta autonomía'); cerca(F.autonomia(60, 263.15, r10.Ptot) - F.autonomia(60, 263.15, Q10), F.autonomia(60, 263.15, r10.Ptot) - F.autonomia(60, 263.15, Q10), 1e-12, 'coherencia');
  console.log(`   a 60 km/h y −10 °C: sin clima ${a0.toFixed(0)} km · resistivo ${F.autonomia(60, 263.15, Q10 + 70).toFixed(0)} km · bomba de calor ${F.autonomia(60, 263.15, r10.Ptot).toFixed(0)} km`);
  ok(F.autonomia(60, 263.15, r10.Ptot) > F.autonomia(60, 263.15, Q10 + 70), 'la bomba de calor ahorra autonomía frente al resistivo'); }

console.log('7 · Las tres averías del diagnóstico dan lecturas distintas');
{ const T = 267.15, Q = F.demanda(T), sana = F.calefaccion(T, Q, 1, 1, 5, 5), esc = F.calefaccion(T, Q, 1, 1, 5, 5, { uaE: 0.22 }), fuga = F.calefaccion(T, Q, 1, 1, 0.3, 22, { carga: 0.62 }), cab = F.calefaccion(T, Q, 0.38, 1, 5, 5);
  const fila = (n, r) => console.log(`   ${n.padEnd(8)} Pc ${(r.c.Pc / 1e5).toFixed(1)} bar · Pe ${(r.c.Pe / 1e5).toFixed(2)} bar · sh ${r.sh} K · sc ${r.sc} K · T2 ${(r.T2 - 273.15).toFixed(0)} °C · Q ${(r.Qdel / 1e3).toFixed(2)} kW · COP ${r.COP.toFixed(2)}`);
  fila('sana', sana); fila('escarcha', esc); fila('fuga', fuga); fila('cabina', cab);
  ok(esc.c.Pe < sana.c.Pe * 0.8 && Math.abs(esc.c.Pc - sana.c.Pc) / sana.c.Pc < 0.1, 'escarcha: presión baja muy baja con la alta casi normal');
  ok(fuga.sh > 15 && fuga.sc < 1 && fuga.Qdel < 0.7 * Q, 'fuga: sobrecalentamiento alto, subenfriamiento nulo y calor corto');
  ok(cab.c.Pc > sana.c.Pc * 1.4 && cab.T2 > sana.T2 + 15, 'poco aire en la cabina: presión alta y descarga muy altas'); }

console.log(`\n${n - malas}/${n} comprobaciones en verde` + (malas ? ` · ${malas} FALLAN` : ''));
process.exit(malas ? 1 : 0);
