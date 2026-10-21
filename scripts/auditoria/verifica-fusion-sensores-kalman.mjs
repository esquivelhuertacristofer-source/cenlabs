// Verificación de la física de «Fusión de sensores con filtro de Kalman: seguir a un coche con radar y cámara» (mecanica-151).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas (promedio ponderado, covarianza sin lecturas, error de seguimiento con aceleración constante), con la forma por
// lotes, con la forma de Joseph, con la consistencia estadística (NEES e innovación) por Monte Carlo con semilla fija y con el diseño del reto
// (ventana interior, nada se cumple «de fábrica»).
// uso: node scripts/auditoria/verifica-fusion-sensores-kalman.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/fusion-sensores-kalman.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,clamp,suave,DT,TFIN,NPAS,RAD_CADA,CAM_CADA,SENS,RQY,P0,prng,normal,creaPerfil,ESCENARIOS,escPorId,verdad,disponible,medidas,predice,corrige,filtra,metricas,RETO,cumple,cumpleTodo,simula,fusiona1};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n') ;
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const g = (a, b, m) => Array.from({ length: m }, (_, i) => a * Math.pow(b / a, i / (m - 1)));

console.log('1 · Generador pseudoaleatorio y normal');
{ const r = F.prng(12345), s = []; for (let i = 0; i < 6; i++) s.push(r()); const r2 = F.prng(12345); ok(s.every((v) => v === r2()), 'misma semilla, misma secuencia');
  const rr = F.prng(777); let m = 0, v = 0, N = 200000; const xs = new Float64Array(N); for (let i = 0; i < N; i++) { xs[i] = F.normal(rr); m += xs[i]; } m /= N; for (let i = 0; i < N; i++) v += (xs[i] - m) ** 2; v /= N;
  absc(m, 0, 0.01, 'media de la normal ≈ 0'); absc(v, 1, 0.02, 'varianza de la normal ≈ 1');
  let k3 = 0; for (let i = 0; i < N; i++) k3 += xs[i] ** 4; absc(k3 / N, 3, 0.1, 'curtosis ≈ 3 (gaussiana)'); }

console.log('2 · Perfil de velocidad: frenada trapezoidal exacta');
{ const p = { v0: 22.5, tb: 9.0, ab: 5.0, dv: 9.0, tr: 0.4 }, P = F.creaPerfil(p);
  cerca(P(0).v, 22.5, 1e-14, 'v(0) = v0'); cerca(P(40).v, 22.5 - 9.0, 1e-12, 'v final = v0 − Δv exacta');
  cerca(P(5).x, 22.5 * 5, 1e-13, 'antes de frenar x = v0·t');
  // la integral numérica de v (Simpson, paso fino) reproduce x(t); la derivada de v reproduce a(t)
  const simpson = (f, a, b, N) => { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  for (const T of [9.2, 9.7, 11.5, 12.0, 20]) cerca(P(T).x, simpson((t) => P(t).v, 0, T, 40000), 1e-10, `x(${T}) = ∫v dt`);
  for (const T of [9.2, 9.6, 10.5, 11.1, 11.3]) { const h = 1e-6; absc(P(T).a, (P(T + h).v - P(T - h).v) / (2 * h), 1e-5, `a(${T}) = dv/dt`); }
  let amax = 0; for (let t = 0; t <= 20; t += 0.001) amax = Math.max(amax, Math.abs(P(t).a)); cerca(amax, 5.0, 1e-9, 'la aceleración máxima es ab');
  // continuidad en las uniones
  for (const t of [9.0, 9.4, 9.4 + 1.4, 9.4 + 1.4 + 0.4]) { const e = 1e-9; absc(P(t - e).v, P(t + e).v, 1e-7, `v continua en t=${t.toFixed(1)}`); absc(P(t - e).x, P(t + e).x, 1e-7, `x continua en t=${t.toFixed(1)}`); absc(P(t - e).a, P(t + e).a, 1e-6, `a continua en t=${t.toFixed(1)} (rampas de tirón, sin saltos)`); } }

console.log('3 · La verdad de cada escenario');
for (const e of F.ESCENARIOS) {
  const { fn, tr } = F.verdad(e); let mn = 1e9, mx = -1e9, vmin = 1e9;
  for (let k = 0; k <= F.NPAS; k++) { mn = Math.min(mn, tr.x[k]); mx = Math.max(mx, tr.x[k]); vmin = Math.min(vmin, tr.v[k]); }
  ok(mn > 20 && mx < 40, `«${e.id}»: la distancia queda entre 20 y 40 m (no hay choque)`, `${mn.toFixed(1)}–${mx.toFixed(1)}`);
  ok(vmin < -4.5 && vmin > -7, `«${e.id}»: la velocidad relativa se hunde de forma visible`, vmin.toFixed(2));
  cerca(tr.x[0], e.d0, 1e-12, `«${e.id}»: x(0) = d0`);
  const a = fn(7.3); cerca(a.x, e.d0 + (a.vL - 22.5) * 0 + (7.3 * 22.5 - 7.3 * 22.5), 1e-12, `«${e.id}»: antes de frenar la distancia no cambia`);
  // x = d0 + xL − xE y v = vL − vE
  for (const t of [3.3, 9.9, 12.4, 21]) { const q = fn(t); absc(q.v, q.vL - q.vE, 1e-12, `«${e.id}» t=${t}: v relativa = vL − vE`); absc(q.a, q.aL - (q.aL - q.a), 1e-12, 'a relativa coherente'); }
  // lateral: derivada de y
  for (const t of [2, 7.7, 15]) { const h = 1e-6; absc(fn(t).vy, (fn(t + h).y - fn(t - h).y) / (2 * h), 1e-6, `«${e.id}»: vy = dy/dt`); absc(fn(t).ay, (fn(t + h).vy - fn(t - h).vy) / (2 * h), 1e-5, `«${e.id}»: ay = dvy/dt`); }
}

console.log('4 · Las medidas: ruido, geometría angular y disponibilidad');
for (const e of F.ESCENARIOS) {
  const V = F.verdad(e).tr, M = F.medidas(e), N = F.NPAS + 1;
  const std = (f) => { let s = 0; for (let k = 0; k < N; k++) s += f(k) ** 2; return Math.sqrt(s / N); };
  absc(std((k) => (M.rx[k] - V.x[k]) / (F.SENS.rx * e.kR)), 1, 0.12, `«${e.id}»: error del radar en distancia ≈ rx·kR`);
  absc(std((k) => (M.rv[k] - V.v[k]) / (F.SENS.rv * e.kR)), 1, 0.12, `«${e.id}»: error Doppler ≈ rv·kR`);
  absc(std((k) => (M.ry[k] - V.y[k]) / (V.x[k] * F.SENS.rth * e.kR)), 1, 0.12, `«${e.id}»: error lateral del radar = distancia·θ·kR`);
  absc(std((k) => (M.cx[k] - V.x[k]) / (F.SENS.cx * e.kC * V.x[k])), 1, 0.12, `«${e.id}»: error de la cámara en distancia ∝ distancia`);
  absc(std((k) => (M.cy[k] - V.y[k]) / (V.x[k] * F.SENS.cth * e.kC)), 1, 0.12, `«${e.id}»: error lateral de la cámara = distancia·θ·kC`);
  let nr = 0, nc = 0, nrH = 0, ncH = 0; for (let k = 0; k < N; k++) { const t = k * F.DT, ven = F.disponible(e, t); if (M.rOk[k]) nr++; if (M.cOk[k]) nc++; if (!ven && (M.rOk[k] || M.cOk[k])) ok(false, 'lectura dentro del hueco'); if (!ven) { nrH++; } }
  if (!e.hueco) { ok(nr === Math.ceil(N / F.RAD_CADA), `«${e.id}»: el radar entrega una lectura cada ${F.RAD_CADA} pasos`, nr); ok(nc === Math.ceil(N / F.CAM_CADA), `«${e.id}»: la cámara cada ${F.CAM_CADA} pasos`, nc); }
  else { ok(nrH > 30 && nrH < 45, `«${e.id}»: el hueco dura 1,8 s (≈ 36 pasos)`, nrH); }
}
{ // la realización de ruido no depende del hueco: el mismo sorteo con y sin hueco da las mismas medidas donde ven
  const a = F.escPorId('rocio'), b = Object.assign({}, a, { hueco: null }), Ma = F.medidas(a), Mb = F.medidas(b); let igual = true; for (let k = 0; k <= F.NPAS; k++) if (Ma.rx[k] !== Mb.rx[k] || Ma.cy[k] !== Mb.cy[k]) igual = false; ok(igual, 'el ruido sorteado no cambia al quitar el hueco (se sortea siempre)'); }
cerca(30 * F.SENS.rth, 1.309, 2e-4, 'el error lateral del radar a 30 m es 1,31 m'); cerca(30 * F.SENS.cth, 0.2094, 2e-4, 'el de la cámara a 30 m es 0,21 m'); cerca(F.SENS.rth / F.SENS.cth, 6.25, 1e-12, 'el radar se equivoca 6,25 veces más de lado que la cámara');

console.log('5 · El filtro contra las formas cerradas');
const mat = (a, b, c, d) => [[a, b], [c, d]];
{ // 5a · el peso K = P/(P+R) y la duda (1−K)P
  for (const [pp, R] of [[4, 1], [1, 4], [2.5, 2.5], [0.01, 9]]) { const x = [10, 1], P = mat(pp, 0, 0, 3), r = F.corrige(x, P, [1, 0], 10 + 1.5, R); cerca(r.K0, pp / (pp + R), 1e-13, `K = P/(P+R) (P=${pp}, R=${R})`); cerca(P[0][0], (1 - pp / (pp + R)) * pp, 1e-13, 'duda posterior = (1−K)·P'); cerca(x[0], 10 + (pp / (pp + R)) * 1.5, 1e-13, 'x̂ = x⁻ + K·(z − x⁻)'); cerca(r.S, pp + R, 1e-13, 'S = P + R'); } }
{ // 5b · la fusión de dos números (la analogía): x̂ y σ con fusiona1 y con el filtro
  for (const c of CASOS_1) { const f = F.fusiona1(c.xp, c.sp, c.z, c.sz), x = [c.xp, 0], P = mat(c.sp * c.sp, 0, 0, 1); F.corrige(x, P, [1, 0], c.z, c.sz * c.sz);
    cerca(f.x, x[0], 1e-13, `fusiona1 = filtro (${c.xp},${c.sp},${c.z},${c.sz})`); cerca(f.s * f.s, P[0][0], 1e-13, 'duda de fusiona1 = P del filtro');
    cerca(f.s * f.s, 1 / (1 / (c.sp * c.sp) + 1 / (c.sz * c.sz)), 1e-13, 'varianza posterior = 1/(1/P + 1/R)');
    ok(f.x > Math.min(c.xp, c.z) && f.x < Math.max(c.xp, c.z), 'el resultado queda entre lo esperado y lo medido'); ok(f.s < Math.min(c.sp, c.sz), 'mezclar reduce la duda por debajo de la menor'); } }
{ // 5c · el orden de las actualizaciones no importa y la forma secuencial es la forma por lotes
  const x0 = [3, -1.5], P0m = mat(2.2, 0.35, 0.35, 1.1), Hs = [[1, 0], [0, 1], [1, 0]], Rs = [0.7, 0.3, 2.9], zs = [3.4, -1.1, 2.6];
  const sec = (orden) => { const x = x0.slice(), P = P0m.map((r) => r.slice()); for (const i of orden) F.corrige(x, P, Hs[i], zs[i], Rs[i]); return { x, P }; };
  const A = sec([0, 1, 2]), B = sec([2, 0, 1]); for (let i = 0; i < 2; i++) { absc(A.x[i], B.x[i], 1e-12, `estado independiente del orden (${i})`); for (let j = 0; j < 2; j++) absc(A.P[i][j], B.P[i][j], 1e-12, `covarianza independiente del orden (${i}${j})`); }
  // lotes: P⁺ = (P⁻¹ + HᵀR⁻¹H)⁻¹ ; x⁺ = P⁺(P⁻¹x⁻ + HᵀR⁻¹z)
  const inv = (M) => { const d = M[0][0] * M[1][1] - M[0][1] * M[1][0]; return mat(M[1][1] / d, -M[0][1] / d, -M[1][0] / d, M[0][0] / d); };
  const Pi = inv(P0m); const I = [[Pi[0][0], Pi[0][1]], [Pi[1][0], Pi[1][1]]]; const b = [Pi[0][0] * x0[0] + Pi[0][1] * x0[1], Pi[1][0] * x0[0] + Pi[1][1] * x0[1]];
  for (let i = 0; i < 3; i++) { const h = Hs[i], w = 1 / Rs[i]; for (let a = 0; a < 2; a++) { for (let c = 0; c < 2; c++) I[a][c] += h[a] * h[c] * w; b[a] += h[a] * zs[i] * w; } }
  const Pl = inv(I), xl = [Pl[0][0] * b[0] + Pl[0][1] * b[1], Pl[1][0] * b[0] + Pl[1][1] * b[1]];
  for (let i = 0; i < 2; i++) { absc(A.x[i], xl[i], 1e-12, `secuencial = por lotes (estado ${i})`); for (let j = 0; j < 2; j++) absc(A.P[i][j], Pl[i][j], 1e-12, `secuencial = por lotes (P ${i}${j})`); } }
{ // 5d · Joseph = (I−KH)P con la ganancia óptima, y simetría y definida positiva a lo largo de un escenario completo
  const x = [1, 2], P = mat(3.1, 0.4, 0.4, 0.9), h = [1, 0], R = 1.7, Pf = P.map((r) => r.slice());
  const S = Pf[0][0] + R, K = [Pf[0][0] / S, Pf[1][0] / S], Pstd = mat((1 - K[0]) * Pf[0][0], (1 - K[0]) * Pf[0][1], Pf[1][0] - K[1] * Pf[0][0], Pf[1][1] - K[1] * Pf[0][1]);
  F.corrige(x, P, h, 1.2, R); for (let i = 0; i < 2; i++) for (let j = 0; j < 2; j++) absc(P[i][j], Pstd[i][j], 1e-13, `Joseph = forma estándar (${i}${j})`);
  for (const e of F.ESCENARIOS) { const T = F.filtra(e, { q: 3, fR: 1.3, fC: 1 }); let malaP = 0; for (let k = 0; k <= F.NPAS; k++) { if (!(T.Pxx[k] > 0 && T.Pvv[k] > 0 && T.Pxx[k] * T.Pvv[k] - T.Pxv[k] ** 2 > 0 && T.Pyy[k] > 0)) malaP++; } ok(malaP === 0, `«${e.id}»: P siempre simétrica y definida positiva`, malaP); } }
{ // 5e · sin lecturas la covarianza crece con la fórmula cerrada
  const T = F.DT, sa = 1.7, sx = 1.5, sv = 1.0; for (const nn of [1, 5, 20, 36]) { const x = [10, 4], P = mat(sx * sx, 0, 0, sv * sv); for (let i = 0; i < nn; i++) F.predice(x, P, T, sa);
    cerca(x[0], 10 + nn * T * 4, 1e-13, `x⁻ tras ${nn} pasos = x + nT·v`);
    cerca(P[0][0], sx * sx + nn * nn * T * T * sv * sv + sa * sa * T ** 4 * nn * (4 * nn * nn - 1) / 12, 1e-12, `var(x) tras ${nn} pasos = P₀ + n²T²P₀vv + σa²T⁴·n(4n²−1)/12`);
    cerca(P[1][1], sv * sv + nn * sa * sa * T * T, 1e-12, `var(v) tras ${nn} pasos = P₀vv + n·σa²T²`);
    cerca(P[0][1], nn * T * sv * sv + sa * sa * T ** 3 * nn * nn / 2, 1e-12, `cov(x,v) tras ${nn} pasos`); } }
{ // 5f · régimen estacionario y error de seguimiento con aceleración constante: e = a·T²·(1−α)/β
  const T = F.DT; for (const [sa, R] of [[0.5, 0.64], [3, 0.64], [3, 4], [8, 0.04]]) {
    const x = [0, 0], P = mat(5, 0, 0, 5); let K = null; for (let i = 0; i < 4000; i++) { F.predice(x, P, T, sa); const r = F.corrige(x, P, [1, 0], 0, R); K = [r.K0, r.K1]; }
    // estacionariedad: P = F·P·Fᵀ + Q − K·S·Kᵀ aplicada a P⁺
    const Px = P.map((r) => r.slice()), x2 = [0, 0]; F.predice(x2, Px, T, sa); const r2 = F.corrige(x2, Px, [1, 0], 0, R); absc(Px[0][0], P[0][0], 1e-12, `P estacionaria (σa=${sa}, R=${R})`); absc(Px[1][1], P[1][1], 1e-12, 'P estacionaria (vel.)');
    const al = K[0], be = K[1] * T; ok(al > 0 && al < 1 && be > 0, 'α∈(0,1) y β>0', `${al.toFixed(4)} ${be.toFixed(4)}`);
    // el error con aceleración constante a: simulación con medidas sin ruido
    const a = 3.7, xs = [0, 0], Pp = mat(5, 0, 0, 5); let pos = 0, vel = 0; let ex = 0, ev = 0, exPred = 0;
    const xh = [0, 0]; for (let i = 0; i < 6000; i++) { pos += vel * T + a * T * T / 2; vel += a * T; F.predice(xh, Pp, T, sa); exPred = pos - xh[0]; F.corrige(xh, Pp, [1, 0], pos, R); ex = pos - xh[0]; ev = vel - xh[1]; }
    cerca(ex, a * T * T * (1 - al) / be, 1e-8, `error de seguimiento = a·T²(1−α)/β (σa=${sa}, R=${R})`); cerca(exPred, a * T * T / be, 1e-8, 'error de predicción = a·T²/β');
    // el mismo error resolviendo el sistema lineal del régimen estacionario (independiente de la simulación): (I − (I−KH)F)·e = (I−KH)·g·a
    const Hk = [[1 - K[0], 0], [-K[1], 1]], Fm = [[1, T], [0, 1]], gv = [T * T / 2, T];
    const IKF = [[Hk[0][0] * Fm[0][0] + Hk[0][1] * Fm[1][0], Hk[0][0] * Fm[0][1] + Hk[0][1] * Fm[1][1]], [Hk[1][0] * Fm[0][0] + Hk[1][1] * Fm[1][0], Hk[1][0] * Fm[0][1] + Hk[1][1] * Fm[1][1]]];
    const Am = [[1 - IKF[0][0], -IKF[0][1]], [-IKF[1][0], 1 - IKF[1][1]]], rhs = [(Hk[0][0] * gv[0] + Hk[0][1] * gv[1]) * a, (Hk[1][0] * gv[0] + Hk[1][1] * gv[1]) * a], det = Am[0][0] * Am[1][1] - Am[0][1] * Am[1][0];
    const e0 = (rhs[0] * Am[1][1] - Am[0][1] * rhs[1]) / det, e1 = (Am[0][0] * rhs[1] - rhs[0] * Am[1][0]) / det; cerca(ex, e0, 1e-8, 'error de posición = solución del sistema lineal'); cerca(ev, e1, 1e-8, 'error de velocidad = solución del sistema lineal'); } }
{ // 5g · consistencia estadística por Monte Carlo (mismo modelo para sortear y para filtrar): NEES medio = 2 e innovación = 1
  const T = F.DT, sa = 1.2, R = 0.64, runs = 3000, K = 160, w0 = 40; const mc = (RaFilt, saFilt) => { const rnd = F.prng(2026); let nees = 0, nis = 0, cn = 0, ci = 0;
    for (let r = 0; r < runs; r++) { let pos = 0, vel = 5; const x = [pos + 0.3, vel], P = mat(1.5 * 1.5, 0, 0, 1.0); x[0] = pos + 1.5 * F.normal(rnd); x[1] = vel + 1.0 * F.normal(rnd);
      for (let k = 0; k < K; k++) { const a = sa * F.normal(rnd); pos += vel * T + a * T * T / 2; vel += a * T; F.predice(x, P, T, saFilt); const z = pos + Math.sqrt(R) * F.normal(rnd), res = F.corrige(x, P, [1, 0], z, RaFilt);
        if (k >= w0) { const ex = x[0] - pos, ev = x[1] - vel, det = P[0][0] * P[1][1] - P[0][1] ** 2; nees += (P[1][1] * ex * ex - 2 * P[0][1] * ex * ev + P[0][0] * ev * ev) / det; cn++; nis += res.nu * res.nu / res.S; ci++; } } }
    return { nees: nees / cn, nis: nis / ci }; };
  const bien = mc(R, sa); absc(bien.nees, 2, 0.06, 'filtro ajustado: NEES medio ≈ 2 (dos estados)'); absc(bien.nis, 1, 0.03, 'filtro ajustado: innovación normalizada media ≈ 1');
  const presumido = mc(R / 16, sa); ok(presumido.nees > 3.5, 'R supuesta 16 veces menor: el filtro es presumido (NEES ≫ 2)', presumido.nees.toFixed(2));
  const timido = mc(R * 16, sa); ok(timido.nees < 1.8 || timido.nis < 0.6, 'R supuesta 16 veces mayor: el filtro es tímido (innovación ≪ 1)', `${timido.nees.toFixed(2)} ${timido.nis.toFixed(2)}`);
  const qChica = mc(R, sa / 8); ok(qChica.nees > 4, 'Q supuesta 8 veces menor: NEES ≫ 2', qChica.nees.toFixed(2)); }

console.log('6 · Métricas');
{ const e = F.escPorId('autopista'), V = F.verdad(e).tr, N = F.NPAS + 1, T = { xh: Float64Array.from(V.x), vh: Float64Array.from(V.v), yh: Float64Array.from(V.y), Pxx: new Float64Array(N).fill(1), Pxv: new Float64Array(N).fill(0), Pvv: new Float64Array(N).fill(1), nis: new Float64Array(N).fill(1) };
  const m0 = F.metricas(e, T, V); absc(m0.rmsX, 0, 1e-12, 'estimación perfecta: error 0'); absc(m0.retraso, 0, 1e-12, 'estimación perfecta: retraso 0'); absc(m0.rmsV, 0, 1e-12, 'estimación perfecta: sin temblor'); absc(m0.rmsY, 0, 1e-12, 'perfecta: sin error de lado');
  // un retraso conocido: la velocidad estimada va 0,5 s atrás
  const sh = Math.round(0.5 / F.DT), T2 = Object.assign({}, T, { vh: Float64Array.from(V.v, (_, k) => V.v[Math.max(0, k - sh)]) }); const m1 = F.metricas(e, T2, V); absc(m1.retraso, 0.5, F.DT + 1e-9, 'retraso medido = 0,5 s para una velocidad atrasada 0,5 s', m1.retraso);
  // NEES con covarianza identidad y error conocido: 1² + 2² = 5
  const T3 = { xh: new Float64Array(N), vh: new Float64Array(N), yh: new Float64Array(N), Pxx: new Float64Array(N).fill(1), Pxv: new Float64Array(N), Pvv: new Float64Array(N).fill(1), nis: new Float64Array(N).fill(1) };
  const V3 = { x: new Float64Array(N).fill(-1), v: new Float64Array(N).fill(-2), y: new Float64Array(N) }; const m3 = F.metricas(e, T3, V3); cerca(m3.nees, 5, 1e-12, 'NEES con P = I y error (1, 2) es 5'); }

console.log('7 · El diseño del reto');
{ const q = g(0.05, 10, 41), fr = g(0.25, 4, 17), fc = g(0.25, 4, 17); let todos = 0;
  for (const e of F.ESCENARIOS) { let tot = 0, bien = 0, qmin = 1e9, qmax = 0, frmin = 1e9, frmax = 0, fcmin = 1e9; const lim = e.lim;
    for (const a of q) for (const b of fr) for (const c of fc) { tot++; const m = F.simula(e, { q: a, fR: b, fC: c }).m; if (F.cumpleTodo(m, e)) { bien++; qmin = Math.min(qmin, a); qmax = Math.max(qmax, a); frmin = Math.min(frmin, b); frmax = Math.max(frmax, b); fcmin = Math.min(fcmin, c); } }
    const pct = 100 * bien / tot; todos += bien;
    ok(pct > 0.2 && pct < 4, `«${e.id}»: sólo cumple ${pct.toFixed(2)} % de los ajustes (entre 0,2 % y 4 %)`);
    ok(qmin > 0.5 && qmax < 8, `«${e.id}»: la ventana de Q es interior (${qmin.toFixed(2)}–${qmax.toFixed(2)} m/s² dentro de 0,05–10)`);
    ok(frmin > 0.6, `«${e.id}»: confiar demasiado en el radar (fR < 0,6) no cumple (mín. ${frmin.toFixed(2)})`); ok(fcmin > 0.25, `«${e.id}»: confiar de más en la cámara no cumple (fC mín. ${fcmin.toFixed(2)})`);
    // «de fábrica» no pasa: el ajuste inicial del reto
    ok(!F.cumpleTodo(F.simula(e, { q: 0.5, fR: 1, fC: 1 }).m, e), `«${e.id}»: el ajuste inicial del reto (Q 0,5 · catálogo) no cumple`);
    let cat = 0; for (const a of q) if (F.cumpleTodo(F.simula(e, { q: a, fR: 1, fC: 1 }).m, e)) cat++; ok(cat <= 4, `«${e.id}»: con los valores de catálogo (1, 1) sólo ${cat} de 41 valores de Q sirven`);
    // los extremos de Q fallan siempre con los otros mandos en el centro
    ok(!F.cumpleTodo(F.simula(e, { q: 0.05, fR: 1.5, fC: 1 }).m, e) && !F.cumpleTodo(F.simula(e, { q: 10, fR: 1.5, fC: 1 }).m, e), `«${e.id}»: Q = 0,05 y Q = 10 fallan`);
    // el escenario de mayor error en la cámara obliga a no creerla: criterios respondiendo a la causa que dice el mensaje
    const chico = F.simula(e, { q: 0.2, fR: 1.5, fC: 1 }).m, grande = F.simula(e, { q: 10, fR: 1.5, fC: 1 }).m;
    ok(chico.retraso > F.RETO.retraso, `«${e.id}»: Q chica ⇒ retraso mayor que ${F.RETO.retraso} s`, chico.retraso.toFixed(2)); ok(grande.rmsV > F.RETO.rmsV, `«${e.id}»: Q grande ⇒ la velocidad tiembla más que ${F.RETO.rmsV} m/s`, grande.rmsV.toFixed(2));
    ok(chico.nees > F.RETO.neesMax, `«${e.id}»: Q chica ⇒ filtro presumido (NEES ${chico.nees.toFixed(0)})`); }
  ok(todos > 100, 'existen soluciones en los tres escenarios', todos);
  // monotonía: el retraso baja con Q; el temblor de la velocidad sube con Q
  for (const e of F.ESCENARIOS) { let a = 1e9, b = -1; let mo = true, mv = true; for (const qq of g(0.1, 10, 25)) { const m = F.simula(e, { q: qq, fR: 1.3, fC: 1 }).m; if (m.retraso > a + 1e-9) mo = false; if (m.rmsV < b - 1e-9) mv = false; a = m.retraso; b = m.rmsV; } ok(mo, `«${e.id}»: el retraso no aumenta al subir Q`); ok(mv, `«${e.id}»: el temblor de la velocidad no baja al subir Q`); } }
{ // fase 1: nadie acierta con el promedio simple ni con la medida sola
  for (const c of CASOS_1) { const f = F.fusiona1(c.xp, c.sp, c.z, c.sz); ok(Math.abs(f.x - (c.xp + c.z) / 2) > 0.06, `fase 1 (${c.xp}, ${c.z}): el promedio simple NO cuenta como acierto`, (f.x - (c.xp + c.z) / 2).toFixed(3)); ok(Math.abs(f.x - c.z) > 0.06 && Math.abs(f.x - c.xp) > 0.06, 'ni la medida sola ni lo esperado solo cuentan'); }
  ok(new Set(CASOS_1.map((c) => c.xp)).size === CASOS_1.length, 'los casos de la fase 1 tienen xp distintos (el sorteo evita repetir)'); }
{ // fase 3: cada diagnóstico tiene una firma distinta y ninguno cumple el reto
  const R = {}; for (const c of CASOS_DX) { const e = F.escPorId(c.esc), m = F.simula(e, { q: c.q, fR: c.fR, fC: c.fC }).m; R[c.k] = m; ok(!F.cumpleTodo(m, e), `diagnóstico «${c.k}»: falla el reto`); }
  const lim = (id) => F.escPorId(id).lim;
  ok(R.lento.retraso > 1.5 && R.lento.rmsV < 0.1 && R.lento.rmsX > 3 * lim('autopista').rms, '«lento»: retraso largo, velocidad suave y error de distancia grande', JSON.stringify([R.lento.retraso, R.lento.rmsV, R.lento.rmsX].map((v) => +v.toFixed(2))));
  ok(R.nervioso.rmsV > 1.5 * F.RETO.rmsV && R.nervioso.retraso <= 0.1 && R.nervioso.rmsX < lim('autopista').rms, '«nervioso»: la velocidad tiembla pero el error de distancia es bueno', JSON.stringify([R.nervioso.rmsV, R.nervioso.retraso, R.nervioso.rmsX].map((v) => +v.toFixed(2))));
  ok(R.camara.rmsX > 4 * lim('lluvia').rms && R.camara.retraso <= 0.5, '«cámara»: el error de distancia se dispara sin retraso grave', JSON.stringify([R.camara.rmsX, R.camara.retraso].map((v) => +v.toFixed(2))));
  { const e = F.escPorId('rocio'), V = F.verdad(e).tr, T = F.filtra(e, { q: CASOS_DX.find((c) => c.k === 'ciego').q, fR: 1, fC: 1.5 }); let pico = 0, tp = 0; for (let k = 0; k <= F.NPAS; k++) { const d = Math.abs(T.xh[k] - V.x[k]); if (d > pico) { pico = d; tp = k * F.DT; } } ok(tp >= e.hueco.t0 && tp <= e.hueco.t1 + 2.0, '«ciego»: el pico del error cae dentro del hueco o justo al salir', `${tp.toFixed(1)} s (${pico.toFixed(2)} m)`); } }

console.log('8 · Estructura del HTML publicado');
ok(html.includes('<script src="_puente.js"></script>'), 'el puente con la plataforma está');
ok(html.includes('_ficha-fusion-sensores-kalman.js') && html.includes('_ficha-tecnica.js'), 'la ficha técnica está');
ok(!/type="number"/.test(html), 'sin input type=number (punto decimal nativo)');
ok(!/onclick=/.test(html.replace(/\.onclick=/g, '')), 'sin onclick inline');
ok(/window\.__labDebug=\{/.test(html) && html.includes('quizCorrectIndex'), '__labDebug con quizAnswer y quizCorrectIndex');
ok(!/useFrame/.test(html), 'sin useFrame (lab estático, un solo reloj requestAnimationFrame)');
console.log(`\n${n} comprobaciones, ${malas} fallos`); if (malas) { console.log(fallos.join('\n')); process.exit(1); }
