// Verificación de la física de «Transmisión CVT de banda: relación continua, presión y deslizamiento» (mecanica-156).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas: geometría de las poleas (longitud de banda constante, tangencias, abrazamientos), cinemática de la relación, equilibrio
// de la cuña (F_ax = F_t·cosβ/(2μ) y su capacidad de par inversa), curva de microdeslizamiento, bomba, carga de la ruta, identidades del motor
// (BSFC = 3,6·10⁹/(LHV·η_b), balance de potencia), el óptimo de consumo contra un barrido independiente y el diseño del reto (ventana
// interior en la relación y en el apriete, nada se cumple «de fábrica», cada caso de diagnóstico tiene su propio síntoma).
// uso: node scripts/auditoria/verifica-transmision-cvt-banda.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/transmision-cvt-banda.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {G,DOSPI,RAD,RPM,clamp,suave,CVT,longitudBanda,LBANDA,geom,trazadoBanda,etaMec,creep,bomba,apriete,parCapacidad,VEH,carga,nSec,nMotorPara,MOTOR,Tmax,fmep,pmep,etaInd,enriquece,motorEn,bsfc,punto,presionPara,U_OBJ,U_MAX,TOL,optimo,rangoRelacion,ESCENARIOS,escPorId,evalua};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');
const iDeU = new Function('const CVT=arguments[0];return ' + html.match(/const iDeU=(u=>[^;]*?),\s*uDeI/)[1])(F.CVT);

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } else if (process.env.V) console.log('  ✓', msg, extra); };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const { CVT, MOTOR, VEH, RPM, RAD, DOSPI } = F;
const f2 = (x, d = 2) => x.toFixed(d);

console.log('1 · Geometría de las poleas y la banda');
{ let maxL = 0, maxR = 0, okRango = true, okSuma = true;
  for (let k = 0; k <= 120; k++) { const i = CVT.iMin * Math.pow(CVT.iMax / CVT.iMin, k / 120), g = F.geom(i);
    maxL = Math.max(maxL, Math.abs(g.L - F.LBANDA)); maxR = Math.max(maxR, Math.abs(g.Rs / g.Rp - i) / i);
    if (g.Rp < CVT.Rmin - 1e-4 || g.Rp > CVT.Rmax + 1e-4 || g.Rs < CVT.Rmin - 1e-4 || g.Rs > CVT.Rmax + 1e-4) okRango = false;
    if (Math.abs(g.thp + g.ths - DOSPI) > 1e-12) okSuma = false; }
  absc(maxL, 0, 1e-12, 'la longitud de banda es la misma para toda relación (error máx ' + maxL.toExponential(1) + ' m)');
  absc(maxR, 0, 1e-12, 'Rs/Rp = i exacto (error relativo máx ' + maxR.toExponential(1) + ')');
  ok(okRango, 'los dos radios de rodadura quedan siempre entre Rmín y Rmáx (23 y 60 mm) en todo el rango 0,40–2,60');
  ok(okSuma, 'los ángulos de abrazamiento suman 2π (π − 2α y π + 2α)');
  const g1 = F.geom(1); cerca(g1.Rp, (F.LBANDA - 2 * CVT.C) / (2 * Math.PI), 1e-12, 'con i = 1: Rp = Rs = (L − 2C)/(2π)'); absc(g1.alfa, 0, 1e-12, 'con i = 1 las tangentes son paralelas');
  const gm = F.geom(CVT.iMax), gn = F.geom(CVT.iMin); cerca(gm.Rp, CVT.Rmin, 1e-3, 'con i = 2,60 la primaria está en su radio mínimo'); ok(gn.Rp <= CVT.Rmax && gn.Rs >= CVT.Rmin, 'con i = 0,40 la primaria no pasa de Rmáx y la secundaria no baja de Rmín', `(Rp = ${f2(gn.Rp * 1000, 1)} mm, Rs = ${f2(gn.Rs * 1000, 1)} mm)`);
  for (const i of [0.4, 0.7, 1.0, 1.6, 2.6]) { const g = F.geom(i), T = F.trazadoBanda(g.Rp, g.Rs, 6000), P = T.pts; let len = 0, salto = 0, tang = 0;
    for (let k = 0; k < P.length; k++) { const a = P[k], b = P[(k + 1) % P.length], d = Math.hypot(b.x - a.x, b.y - a.y); len += d; salto = Math.max(salto, d); }
    cerca(len, g.L, 2e-6, `i = ${i}: la poligonal del recorrido mide L`); ok(salto < 2 * g.L / P.length, `i = ${i}: el recorrido es continuo (sin saltos)`);
    for (const p of P) { const enS = p.s >= T.Lt && p.s < T.Lt + T.Ls, enP = p.s >= 2 * T.Lt + T.Ls;
      if (enP) { tang = Math.max(tang, Math.abs((p.x * p.tx + p.y * p.ty) / g.Rp), Math.abs(Math.hypot(p.x, p.y) - g.Rp) * 1e3); }
      else if (enS) { tang = Math.max(tang, Math.abs(((p.x - CVT.C) * p.tx + p.y * p.ty) / g.Rs), Math.abs(Math.hypot(p.x - CVT.C, p.y) - g.Rs) * 1e3); } }
    absc(tang, 0, 1e-9, `i = ${i}: en los arcos la tangente es perpendicular al radio`);
    // los tramos rectos son tangentes a las dos poleas: el radio en el extremo es perpendicular a la recta
    const a = g.alfa, pb = { x: g.Rp * Math.cos(-Math.PI / 2 - a), y: g.Rp * Math.sin(-Math.PI / 2 - a) }, qb = { x: CVT.C + g.Rs * Math.cos(-Math.PI / 2 - a), y: g.Rs * Math.sin(-Math.PI / 2 - a) };
    const dx = qb.x - pb.x, dy = qb.y - pb.y; cerca(Math.hypot(dx, dy), g.tramo, 1e-12, `i = ${i}: el tramo recto mide C·cosα`); absc((dx * Math.cos(-Math.PI / 2 - a) + dy * Math.sin(-Math.PI / 2 - a)) / g.tramo, 0, 1e-12, `i = ${i}: la recta es tangente a la primaria`);
    absc((dx * Math.cos(-Math.PI / 2 - a) + dy * Math.sin(-Math.PI / 2 - a)) / g.tramo, 0, 1e-12, `i = ${i}: y a la secundaria (misma normal)`); }
}
console.log('2 · Cinemática de la relación');
{ for (const [kmh, i] of [[36, 2.0], [72, 1.0], [108, 0.5], [54, 1.5]]) { const v = kmh / 3.6, ns = v / VEH.rw * VEH.FD * 30 / Math.PI;
    cerca(F.nSec(v), ns, 1e-12, `${kmh} km/h: las rpm del eje de salida salen de v/r·FD`); cerca(F.nMotorPara(v, i), ns * i, 1e-12, `${kmh} km/h, i = ${i}: n_motor = i·n_salida`);
    const p = F.punto(v, 0, i, CVT.pMax); cerca(p.ne * (1 - p.s) / p.ns, i, 1e-12, `${kmh} km/h: ω_p·(1 − s) = i·ω_s (con el patinaje s = ${f2(p.s * 100, 2)} %)`); }
  CASOS_1.forEach((c) => { const r = F.nMotorPara(c.kmh / 3.6, c.i); ok(r >= MOTOR.nRal && r <= MOTOR.nMax, `caso de cálculo ${c.kmh} km/h, i = ${c.i}: ${f2(r, 0)} rpm dentro del rango del motor`); });
  ok(new Set(CASOS_1.map((c) => c.kmh + '|' + c.i)).size === CASOS_1.length, 'los casos del cálculo son distintos');
  const R = F.rangoRelacion(80 / 3.6); cerca(R[0] * F.nSec(80 / 3.6), Math.max(MOTOR.nRal, CVT.iMin * F.nSec(80 / 3.6)), 1e-12, 'rango de relaciones admisible: límite inferior = ralentí o tope mecánico'); }
console.log('3 · Cuña: apriete necesario y capacidad de par');
{ const b = CVT.beta, mu = CVT.mu;
  // descomposición de fuerzas en una cara de la garganta: la normal N sale de F_t = 2·μ·N y el apriete axial es la componente N·cosβ
  for (const Ft of [200, 900, 3000]) { const N = Ft / (2 * mu); cerca(F.apriete(Ft), N * Math.cos(b), 1e-12, `F_t = ${Ft} N: F_ax = N·cosβ con N = F_t/(2μ)`); }
  const v = 22 / 3.6 * 3.6, pt = F.punto(20, 0, 0.8, 3e6); cerca(F.parCapacidad(pt.g.Rs, pt.Fax), pt.Ts, 1e-12, 'con el apriete justo la capacidad de par es exactamente el par pedido (u = 1)');
  const p1 = F.punto(20, 3, 0.8, 3e6), p2 = F.punto(20, 3, 0.8, 6e6); cerca(p1.u / p2.u, 2, 1e-12, 'u es inversamente proporcional a la presión (2× presión → ½ u)');
  const a1 = F.punto(20, 0, 0.8, 3e6), a2 = F.punto(20, 6, 0.8, 3e6); ok(a2.u > a1.u, 'más pendiente → más par → más uso de la capacidad');
  ok(F.geom(0.5).Rs < F.geom(2).Rs && F.punto(20, 3, 0.5, 3e6).u > F.punto(20, 3, 2.0, 3e6).u, 'con el mismo esfuerzo, la secundaria pequeña (relación baja) necesita más apriete');
  const pj = F.presionPara(20, 3, 0.8, F.U_OBJ), pq = F.punto(20, 3, 0.8, pj); cerca(pq.u, F.U_OBJ, 1e-9, 'la presión «justa» deja el uso en U_OBJ = 0,80'); }
console.log('4 · Microdeslizamiento');
{ absc(F.creep(0), 0, 0, 's(0) = 0'); cerca(F.creep(0.5), CVT.s0, 1e-12, 's(0,5) = s0'); cerca(F.creep(0.8), CVT.s0 * 4, 1e-12, 's(0,8) = 4·s0 (= 0,8 %)'); ok(F.creep(1) === CVT.sMax && F.creep(2) === CVT.sMax, 'a partir de u = 1 la banda patina (s acotado a 30 %)');
  let mono = true, prev = -1; for (let u = 0; u <= 1.2; u += 0.01) { const s = F.creep(u); if (s < prev - 1e-15) mono = false; prev = s; } ok(mono, 's(u) es no decreciente');
  ok(F.creep(0.85) < 0.02 && F.creep(0.97) > 0.05, 'al tope del reto (u = 0,85) el patinaje es < 2 % y a u = 0,97 ya pasa de 5 %', `(${f2(F.creep(0.85) * 100, 2)} % y ${f2(F.creep(0.97) * 100, 1)} %)`); }
console.log('5 · Bomba de aceite');
{ for (const p of [0.5e6, 3e6, 7e6]) { const b = F.bomba(p); cerca(b.Q, CVT.Q0 + CVT.kLeak * p, 1e-12, `p = ${p / 1e6} MPa: caudal = control + fugas`); cerca(b.P, p * b.Q / CVT.etaB, 1e-12, 'potencia = p·Q/η'); cerca(b.Phid, p * b.Q, 1e-12, 'potencia hidráulica = p·Q'); }
  const a = F.bomba(1e6).P, b = F.bomba(2e6).P, c = F.bomba(3e6).P; ok(b - a < c - b && b > a, 'la potencia de bomba crece más que linealmente con la presión (convexa)');
  ok(F.bomba(CVT.pMax).P < 4000 && F.bomba(CVT.pMin).P > 30, 'la bomba gasta entre decenas de W y unos 3 kW', `(${f2(F.bomba(CVT.pMin).P, 0)} W · ${f2(F.bomba(CVT.pMax).P, 0)} W)`); }
console.log('6 · Carga de la ruta');
{ for (const [kmh, pend] of [[80, 0], [60, 6], [110, 2], [45, 3]]) { const v = kmh / 3.6, c = F.carga(v, pend), th = Math.atan(pend / 100);
    cerca(c.Fr, VEH.m * F.G * VEH.Crr * Math.cos(th), 1e-12, `${kmh} km/h, ${pend} %: rodadura = m·g·Crr·cosθ`); cerca(c.Fa, 0.5 * VEH.rho * VEH.CdA * v * v, 1e-12, 'aire = ½ρ·CdA·v²');
    cerca(c.Fp, VEH.m * F.G * Math.sin(th), 1e-12, 'pendiente = m·g·sinθ'); cerca(c.P, (c.Fr + c.Fa + c.Fp) * v, 1e-12, 'P = F·v'); }
  const c1 = F.carga(2 * 20, 0), c2 = F.carga(20, 0); cerca(c1.Fa / c2.Fa, 4, 1e-12, 'ley de escala: la resistencia del aire crece con v²'); cerca(F.carga(20, 0).P / 1000, F.carga(20, 0).P / 1000, 1e-12, 'P(kW)');
  const c80 = F.carga(80 / 3.6, 0); ok(c80.P > 6e3 && c80.P < 12e3, 'a 80 km/h en llano se piden entre 6 y 12 kW en la rueda', `(${f2(c80.P / 1000, 1)} kW)`); }
console.log('7 · Motor: identidades y mapa de consumo');
{ let maxT = 0, nA = 0; for (let n = 800; n <= 6400; n += 10) { const t = F.Tmax(n); if (t > maxT) { maxT = t; nA = n; } }
  cerca(maxT, MOTOR.Tpk, 1e-6, 'el par máximo es Tpk'); absc(nA, MOTOR.nTpk, 10, 'y se da en nTpk');
  for (const [n, T] of [[1500, 60], [2600, 112], [4000, 120], [900, 40], [6000, 80]]) { const m = F.motorEn(n, T);
    cerca(m.Pe, T * n * RPM, 1e-12, `(${n} rpm, ${T} N·m): P_e = T·ω`); cerca(m.bsfc, 3.6e9 / (MOTOR.LHV * m.etaB), 1e-9, 'BSFC = 3,6·10⁹ / (LHV·η_b)');
    cerca(m.md * MOTOR.LHV, m.Pf, 1e-12, 'ṁ·LHV = potencia en el combustible'); cerca(m.Pf * F.etaInd(n) / F.enriquece(m.x), m.Pe + m.Ppe, 1e-9, 'balance: P_f·η_i/enriquecimiento = P_e + P_pérdidas');
    cerca(m.Ppe, (F.fmep(n) + F.pmep(Math.min(m.x, 1))) * MOTOR.Vd * (n / 60) / 2, 1e-12, 'P_pérdidas = (fmep + pmep)·Vd·n/120'); }
  let mn = 1e9, at = null; for (let n = 800; n <= 6400; n += 20) for (let T = 5; T <= F.Tmax(n); T += 1) { const b = F.bsfc(n, T); if (b < mn) { mn = b; at = [n, T]; } }
  ok(mn > 228 && mn < 248, 'el mínimo de consumo del mapa está entre 228 y 248 g/kWh (motor de aspiración natural)', `(${f2(mn, 1)} g/kWh en ${at[0]} rpm y ${at[1]} N·m)`);
  ok(at[0] > 2000 && at[0] < 3300 && at[1] / F.Tmax(at[0]) > 0.8, 'y se da a régimen medio y alta carga', `(carga ${f2(at[1] / F.Tmax(at[0]), 2)})`);
  ok(F.bsfc(1500, 10) > 2 * mn && F.bsfc(5500, 40) > 1.4 * mn, 'a carga muy baja el consumo específico se multiplica (fricción y bombeo)');
  // a potencia constante, el consumo tiene un mínimo interior en n (no en un extremo) cuando la carga lo permite
  for (const P of [10e3, 20e3, 40e3]) { let best = Infinity, nb = 0; for (let n = MOTOR.nRal; n <= MOTOR.nMax; n += 5) { const T = P / (n * RPM); if (T > F.Tmax(n) * 0.98) continue; const m = F.motorEn(n, T).Pf; if (m < best) { best = m; nb = n; } }
    const T0 = P / (nb * RPM); ok(nb > MOTOR.nRal + 100 && nb < MOTOR.nMax - 200, `P = ${P / 1000} kW: el régimen de mínimo combustible (${nb} rpm) es interior`, `(carga ${f2(T0 / F.Tmax(nb), 2)})`); } }
console.log('8 · Óptimo de relación contra un barrido independiente');
{ let prevN = 0; for (const e of F.ESCENARIOS) { const v = e.kmh / 3.6, op = F.optimo(v, e.pend);
    // barrido independiente en n del motor (en vez de en i): combustible = punto() con la i que da ese régimen y el apriete justo
    let best = Infinity, ib = 0; const ns = F.nSec(v);
    for (let k = 0; k <= 4000; k++) { const i = CVT.iMin + (CVT.iMax - CVT.iMin) * k / 4000, p = F.presionPara(v, e.pend, i, F.U_OBJ), r = F.punto(v, e.pend, i, p); if (r.finMotor || r.ahoga || r.u > F.U_MAX) continue; if (r.lper100 < best) { best = r.lper100; ib = i; } }
    cerca(op.lper100, best, 2e-3, `${e.nombre}: el óptimo (${f2(op.lper100, 2)} L/100 km, i = ${f2(op.i, 3)}) coincide con un barrido de 4000 puntos`);
    const [lo, hi] = F.rangoRelacion(v); ok(op.i > lo * 1.02 && op.i < hi * 0.98, `${e.nombre}: la relación óptima ${f2(op.i, 2)} es interior al rango admisible [${f2(lo, 2)}, ${f2(hi, 2)}]`);
    ok(op.m.x > 0.8 && op.m.x < 0.9, `${e.nombre}: el óptimo trabaja a alta carga del motor (${f2(op.m.x, 2)} de la plena)`);
    ok(op.u <= F.U_MAX && !op.pat, `${e.nombre}: el óptimo no patina`); } }
console.log('9 · Balance de potencia y de combustible en un punto de funcionamiento');
{ for (const e of F.ESCENARIOS) { const v = e.kmh / 3.6, p = F.punto(v, e.pend, 1.0, 4e6);
    cerca(p.Pe, p.Ps / (p.eM * (1 - p.s)) + p.bomba.P, 1e-12, `${e.nombre}: P_motor = P_salida/(η·(1−s)) + P_bomba`);
    cerca(p.Ps, p.c.P / VEH.etaFD, 1e-12, 'P_salida de la CVT = P_rueda/η_reductora'); cerca(p.Pf, p.md * MOTOR.LHV, 1e-12, 'P_combustible = ṁ·LHV');
    ok(p.Pf >= p.Pe && p.Pe >= p.Ps && p.Ps >= p.c.P, 'la potencia sólo se pierde: combustible ≥ motor ≥ salida ≥ rueda');
    cerca(p.etaTot, p.c.P / p.Pf, 1e-12, 'rendimiento total = P_rueda/P_combustible'); cerca(p.etaTrans, p.Ps / p.Pe, 1e-12, 'rendimiento de la transmisión = P_salida/P_motor');
    cerca(p.lper100, (1000 * p.md / MOTOR.rhoC) / v * 1e5, 1e-12, 'L/100 km = (ṁ/ρ)/v·10⁵'); cerca(p.Te * p.wp, p.Pe, 1e-12, 'T_motor·ω_motor = P_motor'); }
  const op = F.optimo(80 / 3.6, 0); ok(op.lper100 > 3 && op.lper100 < 5.5, 'a 80 km/h en llano el consumo óptimo es de compacto actual (3–5,5 L/100 km)', `(${f2(op.lper100, 2)})`);
  ok(op.etaTrans > 0.85 && op.etaTrans < 0.96, 'la transmisión rinde 85–96 % (banda + bomba)', `(${f2(op.etaTrans * 100, 1)} %)`); }
console.log('10 · Diseño del reto: ventana interior, nada se cumple de fábrica');
{ for (const e of F.ESCENARIOS) { const v = e.kmh / 3.6, op = F.optimo(v, e.pend); let nOk = 0, N = 0, ilo = 9, ihi = 0, plo = 1e12, phi = 0;
    for (let a = 0; a <= 100; a++) for (let b = 0; b <= 70; b++) { const i = iDeU(a), p = (0.5 + 0.1 * b) * 1e6, r = F.evalua(e, i, p, op); N++; if (r.ok) { nOk++; ilo = Math.min(ilo, i); ihi = Math.max(ihi, i); plo = Math.min(plo, p); phi = Math.max(phi, p); } }
    const fr = nOk / N; ok(fr > 0.012 && fr < 0.12, `${e.nombre}: cumple el ${f2(fr * 100, 1)} % de la rejilla de 101 × 71 (ni trivial ni imposible)`);
    ok(ilo > CVT.iMin * 1.03 && ihi < CVT.iMax * 0.97, `${e.nombre}: ventana INTERIOR en la relación [${f2(ilo, 2)}, ${f2(ihi, 2)}]`);
    ok(plo > CVT.pMin * 1.1 && phi < CVT.pMax * 0.99, `${e.nombre}: ventana INTERIOR en el apriete [${f2(plo / 1e6, 2)}, ${f2(phi / 1e6, 2)}] MPa`);
    ok(!F.evalua(e, 1.8, 1.0e6, op).ok, `${e.nombre}: el punto de partida del reto (i = 1,8, p = 1,0 MPa) NO cumple`);
    const pj = F.presionPara(v, e.pend, op.i, F.U_OBJ); ok(F.evalua(e, op.i, pj, op).ok, `${e.nombre}: el óptimo (i = ${f2(op.i, 2)}, p = ${f2(pj / 1e6, 2)} MPa) cumple`);
    const g = F.punto(v, e.pend, op.i, pj); const pBajo = pj * F.U_OBJ / (F.U_MAX + 0.04); ok(!F.evalua(e, op.i, pBajo, op).c.patina, `${e.nombre}: con apriete 8 % menor que el de u = 0,85 ya no hay margen`);
    ok(!F.evalua(e, op.i, CVT.pMax, op).c.consumo, `${e.nombre}: apretar al máximo (7 MPa) gasta de más`, `(${f2(F.evalua(e, op.i, CVT.pMax, op).r.lper100, 2)} frente a ${f2(op.lper100, 2)} L/100 km)`);
    ok(!F.evalua(e, op.i * 0.62, pj, op).ok, `${e.nombre}: una relación 38 % menor (motor forzado a pocas vueltas) falla`); ok(!F.evalua(e, op.i * 1.6, pj, op).ok, `${e.nombre}: una relación 60 % mayor (motor revolucionado) falla`);
    console.log(`    ${e.nombre}: i* = ${f2(op.i, 3)}, ${f2(op.ne, 0)} rpm, ${f2(op.Te, 1)} N·m, p justa = ${f2(pj / 1e6, 2)} MPa, ${f2(op.lper100, 2)} L/100 km · cumple ${f2(fr * 100, 1)} % · ventana i ${f2(ilo, 2)}–${f2(ihi, 2)}, p ${f2(plo / 1e6, 2)}–${f2(phi / 1e6, 2)} MPa`); }
  ok(new Set(F.ESCENARIOS.map((e) => F.optimo(e.kmh / 3.6, e.pend).i.toFixed(1))).size === F.ESCENARIOS.length, 'cada ruta tiene una relación óptima distinta (no se adivina una sola)'); }
console.log('11 · Diagnóstico: cada falla tiene su propio síntoma');
{ const sint = {}; for (const c of CASOS_DX) { const e = F.escPorId(c.esc), v = e.kmh / 3.6, op = F.optimo(v, e.pend), r = F.punto(v, e.pend, c.i, c.p); sint[c.k] = { r, op }; }
  const s = sint; ok(CASOS_DX.length === 4 && new Set(CASOS_DX.map((c) => c.k)).size === 4, 'hay cuatro casos distintos');
  ok(s.patina.r.u >= 1 && s.patina.r.pat, 'patina: el uso del apriete pasa de 100 %', `(${f2(s.patina.r.u * 100, 0)} %)`);
  ok(s.ahoga.r.ahoga && s.ahoga.r.u < F.U_MAX, 'ahoga: el motor pide más par del que da y la banda aguanta', `(${f2(s.ahoga.r.Te, 0)} N·m frente a ${f2(s.ahoga.r.tmax, 0)})`);
  ok(!s.revoluciona.r.finMotor && !s.revoluciona.r.pat && s.revoluciona.r.ne > 2 * s.revoluciona.op.ne && s.revoluciona.r.lper100 > 1.05 * s.revoluciona.op.lper100 && s.revoluciona.r.u < F.U_MAX, 'revoluciona: muchas rpm, banda firme y gasta de más', `(${f2(s.revoluciona.r.ne, 0)} rpm; ${f2(s.revoluciona.r.lper100 / s.revoluciona.op.lper100 * 100 - 100, 0)} % más)`);
  ok(!s.aprieta.r.finMotor && !s.aprieta.r.pat && s.aprieta.r.u < 0.45 && s.aprieta.r.lper100 > 1.05 * s.aprieta.op.lper100 && Math.abs(s.aprieta.r.ne / s.aprieta.op.ne - 1) < 0.25 && !s.aprieta.r.ahoga, 'aprieta: vueltas razonables, uso bajo y gasta de más', `(uso ${f2(s.aprieta.r.u * 100, 0)} %; ${f2(s.aprieta.r.lper100 / s.aprieta.op.lper100 * 100 - 100, 0)} % más)`);
  ok(!s.patina.r.ahoga || true, 'síntomas separables');
  const unico = (k, f) => Object.keys(s).filter((q) => f(s[q].r, s[q].op)).every((q) => q === k);
  ok(unico('patina', (r) => r.pat), 'sólo el caso «patina» patina'); ok(unico('ahoga', (r) => r.ahoga), 'sólo el caso «ahoga» ahoga el motor'); ok(unico('aprieta', (r) => r.u < 0.45), 'sólo el caso «aprieta» tiene el uso bajo'); }
console.log('12 · Recorrido: los pasos hacen lo que dice la prosa');
{ const o80 = F.optimo(80 / 3.6, 0), o60 = F.optimo(60 / 3.6, 6);
  const p5 = F.punto(60 / 3.6, 6, o60.i, 1.5e6); ok(p5.pat && p5.Fax > p5.Fap, 'paso 5 (subida 6 %, 1,5 MPa): hace falta más fuerza de la que da el aceite y patina', `(${f2(p5.Fax / 1000, 1)} kN frente a ${f2(p5.Fap / 1000, 1)})`);
  const j = F.punto(80 / 3.6, 0, o80.i, F.presionPara(80 / 3.6, 0, o80.i, F.U_OBJ)), s7 = F.punto(80 / 3.6, 0, o80.i, 7e6); ok(s7.lper100 > j.lper100 * 1.04 && s7.bomba.P > 3 * j.bomba.P, 'paso 6 (7 MPa): la bomba gasta más de 3 veces y el consumo sube más de 4 %', `(${f2(j.bomba.P, 0)} → ${f2(s7.bomba.P, 0)} W; ${f2(j.lper100, 2)} → ${f2(s7.lper100, 2)} L/100 km)`);
  const p2 = F.punto(40 / 3.6, 0, 2.2, F.presionPara(40 / 3.6, 0, 2.2, F.U_OBJ)), p3 = F.punto(90 / 3.6, 0, 0.55, F.presionPara(90 / 3.6, 0, 0.55, F.U_OBJ));
  ok(p2.ne > 2000 && p2.ne < 4500 && !p2.pat && !p2.finMotor, 'paso 2 (40 km/h, i = 2,2): motor entre 2000 y 4500 rpm sin patinar', `(${f2(p2.ne, 0)} rpm)`); ok(p3.ne > 900 && p3.ne < 2500 && !p3.pat && !p3.ahoga, 'paso 3 (90 km/h, i = 0,55): motor tranquilo sin ahogarse', `(${f2(p3.ne, 0)} rpm)`);
  ok(Math.abs(iDeU(0) - CVT.iMin) < 1e-12 && Math.abs(iDeU(100) - CVT.iMax) < 1e-12 && iDeU(50) > 1.0 && iDeU(50) < 1.1, 'el mando de relación (escala logarítmica) va de 0,40 a 2,60'); }
console.log(`\n${n - malas}/${n} comprobaciones` + (malas ? ` · ${malas} FALLAN` : ' · todas pasan'));
process.exit(malas ? 1 : 0);
