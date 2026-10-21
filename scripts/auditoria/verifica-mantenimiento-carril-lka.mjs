// Verificación de la física de «Mantenimiento de carril (LKA): el volante que se corrige solo» (mecanica-153).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas y casos de libro del modelo lateral de bicicleta (régimen de la curva δ = (L + K·v²)·κ, ganancia de guiñada
// r/δ = v/(L + K·v²) con su máximo en la velocidad característica √(L/K), determinante del subsistema lateral), con la exponencial de matriz del
// lazo lineal (RK4 contra solución exacta con retención de orden cero), con la reducción del lazo (el centro de gravedad desvía como la
// cinemática), con el retardo de la cámara, con el TLC y con el diseño del reto (ventana interior, nada se cumple «de fábrica»).
// uso: node scripts/auditoria/verifica-mantenimiento-carril-lka.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/mantenimiento-carril-lka.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {G,DOSPI,RAD,clamp,suave,VEH,ACT,CAMARA,DTS,TFIN,NPAS,T_FF,prng,normal,ESCENARIOS,escPorId,curvatura,rumboVia,trazadoVia,deltaCurva,deriv,rk4,tlcAviso,simula,metricas,cumple,cumpleTodo,kpDeP,kdDeD,pDeKp,dDeKd,corre,tlcMano};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } else if (process.env.V) console.log('  ✓', msg, extra); };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const { VEH, ACT, RAD, DTS, TFIN, NPAS } = F;
const f2 = (x, d = 2) => x.toFixed(d);

/* ---------- álgebra mínima: exponencial de matriz (escalado y cuadrado con Taylor) y producto ---------- */
const mm = (A, B) => A.map((r, i) => B[0].map((_, j) => r.reduce((s, _, k) => s + A[i][k] * B[k][j], 0)));
const mexp = (A) => { const N = A.length; let nrm = 0; for (const r of A) nrm = Math.max(nrm, r.reduce((s, x) => s + Math.abs(x), 0));
  const sq = Math.max(0, Math.ceil(Math.log2(Math.max(nrm, 1e-9))) + 3), As = A.map((r) => r.map((x) => x / Math.pow(2, sq)));
  let T = As.map((r, i) => r.map((_, j) => (i === j ? 1 : 0))), S = T.map((r) => r.slice()), P = T;
  for (let k = 1; k <= 24; k++) { P = mm(P, As).map((r) => r.map((x) => x / k)); S = S.map((r, i) => r.map((x, j) => x + P[i][j])); }
  for (let i = 0; i < sq; i++) S = mm(S, S); return S; };

console.log('1 · Generador pseudoaleatorio y normal');
{ const r = F.prng(12345), s = []; for (let i = 0; i < 6; i++) s.push(r()); const r2 = F.prng(12345); ok(s.every((v) => v === r2()), 'misma semilla, misma secuencia');
  const rr = F.prng(777); let m = 0, v = 0, N = 200000; const xs = new Float64Array(N); for (let i = 0; i < N; i++) { xs[i] = F.normal(rr); m += xs[i]; } m /= N; for (let i = 0; i < N; i++) v += (xs[i] - m) ** 2; v /= N;
  absc(m, 0, 0.01, 'media de la normal ≈ 0'); absc(v, 1, 0.02, 'varianza de la normal ≈ 1');
  let k3 = 0; for (let i = 0; i < N; i++) k3 += xs[i] ** 4; absc(k3 / N, 3, 0.1, 'curtosis ≈ 3 (gaussiana)'); }

console.log('2 · Constantes del vehículo');
{ cerca(VEH.L, 2.7, 1e-14, 'distancia entre ejes L = a + b = 2,7 m');
  cerca(VEH.K, VEH.m / VEH.L * (VEH.b / VEH.Cf - VEH.a / VEH.Cr), 1e-14, 'gradiente de subviraje K = (m/L)(b/Cf − a/Cr)');
  ok(VEH.K > 0, 'el coche es subvirador (K > 0): estable a toda velocidad', 'K = ' + VEH.K);
  cerca(VEH.margen, 0.85, 1e-14, 'margen hasta la raya = (3,5 − 1,8)/2 = 0,85 m');
  cerca(F.kpDeP(F.pDeKp(0.0123)), 0.0123, 1e-14, 'P: ida y vuelta de unidades'); cerca(F.kdDeD(F.dDeKd(0.0456)), 0.0456, 1e-14, 'D: ida y vuelta de unidades');
  cerca(F.kpDeP(16), RAD, 1e-14, '16° de volante por metro = 1° de ruedas por metro (relación 16:1)'); }

console.log('3 · Régimen en curva: δ = (L + K·v²)·κ y ángulo de deriva del centro de gravedad');
{ for (const v of [8, 15, 22, 28, 35]) for (const kap of [1 / 90, 1 / 250, -1 / 420, 1 / 1000]) {
    // en régimen: ė = 0, ψ̇ = 0 (r = v·κ), v̇_y = 0 y ṙ = 0; las dos últimas son lineales en (v_y, δ): se resuelven con dos evaluaciones de la planta
    const r = v * kap, f = (vy, d) => { const x = F.deriv([0, 0, vy, r, d], v, kap, d); return [x[2], x[3]]; };
    const f00 = f(0, 0), f10 = f(1, 0), f01 = f(0, 1); const a11 = f10[0] - f00[0], a12 = f01[0] - f00[0], a21 = f10[1] - f00[1], a22 = f01[1] - f00[1];
    const det = a11 * a22 - a12 * a21, vy = (-f00[0] * a22 + f00[1] * a12) / det, d = (-a11 * f00[1] + a21 * f00[0]) / det;
    cerca(d, F.deltaCurva(v, kap), 1e-10, `δ en régimen = (L + K·v²)·κ  (v = ${v} m/s, κ = ${f2(kap * 1000, 2)}‰)`);
    cerca(vy / v, kap * (VEH.b - VEH.a * VEH.m * v * v / (VEH.Cr * VEH.L)), 1e-9, `ángulo de deriva del CG = κ·(b − a·m·v²/(Cr·L))  (v = ${v} m/s)`); } }

console.log('4 · Ganancia de guiñada y velocidad característica');
{ const gan = (v) => v / (VEH.L + VEH.K * v * v);                          // r/δ en régimen (K en rad por m/s²)
  for (const v of [10, 20, 30]) { const kap = 1e-3, d = F.deltaCurva(v, kap); cerca(v * kap / d, gan(v), 1e-12, `r/δ = v/(L + K·v²) a ${v} m/s`); }
  const vc = Math.sqrt(VEH.L / VEH.K); let mejor = 0, vm = 0; for (let v = 1; v <= 80; v += 0.01) { const g = gan(v); if (g > mejor) { mejor = g; vm = v; } }
  absc(vm, vc, 0.02, 'la ganancia de guiñada es máxima en la velocidad característica √(L/K)', `(v_c = ${f2(vc, 2)} m/s = ${f2(vc * 3.6, 1)} km/h)`);
  // ganancia efectiva ∝ v a baja velocidad: duplicar v duplica r/δ y cuadruplica a_y/δ (K·v² ≪ 1)
  cerca(gan(0.2) / gan(0.1), 2, 1e-3, 'a muy baja velocidad r/δ ∝ v'); { const ay = (v) => v * v / (VEH.L + VEH.K * v * v); cerca(ay(0.2) / ay(0.1), 4, 1e-3, 'a muy baja velocidad a_y/δ = v²/(L + K·v²) ∝ v²'); cerca(ay(30) / ay(15), 4 * (VEH.L + VEH.K * 225) / (VEH.L + VEH.K * 900), 1e-12, 'a_y/δ de libro a 15 y 30 m/s'); } }

console.log('5 · Subsistema lateral (v_y, r): traza y determinante de libro');
{ for (const v of [10, 20, 30]) {
    const g = (vy, r) => { const x = F.deriv([0, 0, vy, r, 0], v, 0, 0); return [x[2], x[3]]; };
    const c0 = g(1, 0), c1 = g(0, 1), A = [[c0[0], c1[0]], [c0[1], c1[1]]];
    const tr = A[0][0] + A[1][1], det = A[0][0] * A[1][1] - A[0][1] * A[1][0];
    cerca(tr, -(VEH.Cf + VEH.Cr) / (VEH.m * v) - (VEH.a * VEH.a * VEH.Cf + VEH.b * VEH.b * VEH.Cr) / (VEH.Iz * v), 1e-12, `traza = −(Cf+Cr)/(m·v) − (a²Cf + b²Cr)/(Iz·v)  (v = ${v})`);
    cerca(det, VEH.Cf * VEH.Cr * VEH.L * VEH.L / (VEH.m * VEH.Iz * v * v) * (1 + VEH.K * v * v / VEH.L), 1e-9, `det = Cf·Cr·L²/(m·Iz·v²)·(1 + K·v²/L)  (v = ${v})`);
    ok(tr < 0 && det > 0, `el subsistema lateral es estable (v = ${v} m/s)`); } }

console.log('6 · RK4 contra la exponencial de matriz (lazo lineal con retención de orden cero)');
{ // lazo cerrado sin ruido, sin retardo y con una imagen en cada paso: dc = −kp·e − kd·v·ψ, sin anticipación y sin topes activos
  const v = 25, kp = F.kpDeP(3), kd = F.kdDeD(2), esc = Object.assign({}, F.escPorId('autopista'), { e0: 0.05, t0: 1e9 });
  const sigE = F.CAMARA.sigE, sigP = F.CAMARA.sigPsi, cdt = F.CAMARA.dt; F.CAMARA.sigE = 0; F.CAMARA.sigPsi = 0; F.CAMARA.dt = DTS;
  const A = F.simula(esc, { kp, kd, ff: 0, retraso: 0, v, semilla: 1 });
  F.CAMARA.sigE = sigE; F.CAMARA.sigPsi = sigP; F.CAMARA.dt = cdt;
  // matriz de la planta con la orden como entrada: x' = Ax + B·u
  const EPS = 1e-6, col = (i) => { const x = [0, 0, 0, 0, 0]; x[i] = EPS; return F.deriv(x, v, 0, 0).map((q) => q / EPS); };
  const Ap = [0, 1, 2, 3, 4].map((j) => col(j)); const Am = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => Ap[j][i]));
  const u1 = F.deriv([0, 0, 0, 0, 0], v, 0, 1e-9); const B = u1.map((x) => x / 1e-9);
  const Aaug = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (i < 5 && j < 5 ? Am[i][j] : (i < 5 && j === 5 ? B[i] : 0))));
  const E = mexp(Aaug.map((r) => r.map((x) => x * DTS)));
  const Phi = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => E[i][j])), Gam = Array.from({ length: 5 }, (_, i) => E[i][5]);
  let x = [esc.e0, 0, 0, 0, 0], maxErr = 0, maxE = 0;
  for (let k = 0; k <= 1500; k++) {
    maxErr = Math.max(maxErr, Math.abs(x[0] - A.e[k]), Math.abs(x[1] - A.psi[k]) * v, Math.abs(x[4] - A.d[k]) * v); maxE = Math.max(maxE, Math.abs(A.e[k]));
    const u = -(kp * x[0] + kd * v * x[1]); x = Phi.map((r, i) => r.reduce((s, q, j) => s + q * x[j], 0) + Gam[i] * u); }
  ok(maxErr < 1e-5 * Math.max(1, maxE) && maxE > 0.02, 'la simulación RK4 reproduce la solución exacta del lazo lineal en 15 s', `(error máx. ${maxErr.toExponential(2)} m con desvío de hasta ${f2(maxE, 3)} m)`); }

console.log('7 · Orden de convergencia de RK4 (planta con orden escalón)');
{ const v = 25, dc = 0.004; const EPS = 1e-6, col = (i) => F.deriv([0, 0, 0, 0, 0].map((_, j) => (j === i ? EPS : 0)), v, 0, 0).map((q) => q / EPS);
  const Ap = [0, 1, 2, 3, 4].map(col), Am = Array.from({ length: 5 }, (_, i) => Array.from({ length: 5 }, (_, j) => Ap[j][i])); const B = F.deriv([0, 0, 0, 0, 0], v, 0, 1e-9).map((x) => x / 1e-9);
  const Aaug = Array.from({ length: 6 }, (_, i) => Array.from({ length: 6 }, (_, j) => (i < 5 && j < 5 ? Am[i][j] : (i < 5 && j === 5 ? B[i] : 0))));
  const T = 1.0, Ex = mexp(Aaug.map((r) => r.map((x) => x * T))), exacto = Array.from({ length: 5 }, (_, i) => Ex[i][5] * dc);
  const corre = (h) => { let x = [0, 0, 0, 0, 0]; const N = Math.round(T / h); for (let k = 0; k < N; k++) x = F.rk4(x, v, 0, 0, 0, dc, h); return x; };
  const err = (h) => { const x = corre(h); return Math.max(...x.map((q, i) => Math.abs(q - exacto[i]) / Math.max(1e-6, Math.abs(exacto[i])))); };
  const e1 = err(0.1), e2 = err(0.05), e3 = err(0.025); const o1 = Math.log2(e1 / e2), o2 = Math.log2(e2 / e3);
  ok(Math.abs(o1 - 4) < 0.35 && Math.abs(o2 - 4) < 0.25, 'RK4 converge con orden 4', `(órdenes medidos ${f2(o1, 2)} y ${f2(o2, 2)}; error relativo ${e1.toExponential(1)} → ${e3.toExponential(1)})`);
  ok(err(F.DTS) < 1e-7, 'con el paso del lab (10 ms) el error relativo es < 1e-7', `(${err(F.DTS).toExponential(2)})`); }

console.log('8 · El coche en lazo cerrado: curva constante, desvío estacionario y empuje lateral');
{ // curva larga y constante: tras el transitorio, a_y = v²·κ, r = v·κ y el desvío estacionario vale [−(1 − ff)·δ_curva + kd·v_y]/kp (PD sin integrador; en régimen ψ = −v_y/v)
  const base = F.escPorId('autopista'), esc = Object.assign({}, base, { t0: 1, tEnt: 0.5, tArc: 22, tSal: 0.5, e0: 0 });
  const p = 14, d = 11, kp = F.kpDeP(p), kd = F.kdDeD(d);
  for (const ff of [0, 0.8]) {
    const A = F.simula(esc, { kp, kd, ff, v: base.v, semilla: 99 });
    const k0 = Math.round(20 / DTS), k1 = Math.round(23.5 / DTS), prom = (arr) => { let s = 0; for (let k = k0; k < k1; k++) s += arr[k]; return s / (k1 - k0); };
    const kap = esc.dir / esc.R, vyEsp = base.v * kap * (VEH.b - VEH.a * VEH.m * base.v * base.v / (VEH.Cr * VEH.L)), eEsp = (-(1 - ff) * F.deltaCurva(base.v, kap) + kd * vyEsp) / kp;
    cerca(prom(A.ay), base.v * base.v * kap, 0.01, `empuje lateral en régimen a_y = v²·κ (anticipación ${ff * 100} %)`);
    cerca(prom(A.r), base.v * kap, 0.01, 'velocidad de guiñada en régimen r = v·κ');
    absc(prom(A.e), eEsp, Math.max(0.03, 0.03 * Math.abs(eEsp)), `desvío estacionario = [−(1 − ff)·δ_curva + kd·v_y]/kp  (ff = ${ff})`, `(${f2(prom(A.e), 3)} vs ${f2(eEsp, 3)} m)`); } }

console.log('9 · La vía: rumbo exacto y trazado');
{ const esc = F.escPorId('carretera'), v = esc.v;
  // el rumbo es la integral de κ(t)·v: por Simpson fino
  const simpson = (g, a, b, N) => { const h = (b - a) / N; let s = g(a) + g(b); for (let i = 1; i < N; i++) s += g(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };
  const quiebres = [0, esc.t0, esc.t0 + esc.tEnt, esc.t0 + esc.tEnt + esc.tArc, esc.t0 + esc.tEnt + esc.tArc + esc.tSal, 1e9];            // κ es lineal a tramos: Simpson es exacto en cada tramo
  const integra = (t) => { let s = 0; for (let i = 0; i + 1 < quiebres.length; i++) { const a = quiebres[i], b = Math.min(quiebres[i + 1], t); if (b > a) s += simpson((q) => v * F.curvatura(esc, q), a, b, 200); } return s; };
  for (const t of [3, 5, 8, 12, 16, 17.5, 20, 26]) absc(F.rumboVia(esc, t, v), integra(t), 1e-12, `rumbo de la vía en t = ${t} s = ∫ v·κ dt`);
  // en el arco la curvatura es 1/R y el cambio de rumbo por metro es 1/R
  const dth = F.rumboVia(esc, 14, v) - F.rumboVia(esc, 13, v); cerca(dth, -v / esc.R, 1e-12, 'en el arco el rumbo cambia v/R por segundo (curva a la derecha: signo negativo)');
  const tr = F.trazadoVia(esc, 400, v); let L = 0; for (let i = 1; i < tr.length; i++) L += Math.hypot(tr[i].x - tr[i - 1].x, tr[i].y - tr[i - 1].y);
  cerca(L, v * TFIN, 1e-3, 'la longitud del trazado es v·T'); ok(tr[0].x === 0 && tr[0].y === 0 && tr[0].th === 0, 'la vía arranca en el origen y mirando al frente'); }

console.log('10 · Tiempo hasta cruzar la raya (TLC)');
{ cerca(F.tlcAviso(0.3, 0.5), (VEH.margen - 0.3) / 0.5, 1e-14, 'TLC = distancia ÷ velocidad lateral (a la derecha de la raya izquierda)');
  cerca(F.tlcAviso(-0.2, -0.4), (VEH.margen - 0.2) / 0.4, 1e-14, 'simétrico: hacia la raya derecha');
  cerca(F.tlcAviso(0.3, -0.5), (VEH.margen + 0.3) / 0.5, 1e-14, 'yendo hacia el centro, el TLC cuenta hasta la raya contraria');
  ok(F.tlcAviso(VEH.margen + 0.1, 0.2) === 0, 'con la rueda sobre la raya el TLC es 0');
  const m = F.tlcMano(0.6, 25, 1.0); cerca(m.lat, 25 * Math.sin(RAD), 1e-14, 'velocidad lateral = v·sen ψ'); cerca(m.t, 0.6 / (25 * Math.sin(RAD)), 1e-14, 'TLC a mano = d / (v·sen ψ)');
  for (const c of CASOS_1) { const r = F.tlcMano(c.dist, c.kmh / 3.6, c.psi); ok(r.t > 0.2 && r.t < 4, `caso de cálculo ${c.kmh} km/h, ${c.psi}°, ${c.dist} m: TLC razonable`, `(${f2(r.t, 2)} s)`);
    // la aproximación de ángulos pequeños (v·ψ en radianes) difiere menos que la tolerancia del reto (0,05 s)
    ok(Math.abs(c.dist / (c.kmh / 3.6 * c.psi * RAD) - r.t) < 0.05, `v·sen ψ ≈ v·ψ dentro de la tolerancia del reto (${c.kmh} km/h, ${c.psi}°)`); }
  ok(new Set(CASOS_1.map((c) => F.tlcMano(c.dist, c.kmh / 3.6, c.psi).t.toFixed(2))).size === CASOS_1.length, 'los siete casos dan respuestas distintas'); }

console.log('11 · Cámara con retardo y ruido');
{ const esc = Object.assign({}, F.escPorId('autopista'), { t0: 1e9, e0: 0.4 });
  const sigE = F.CAMARA.sigE, sigP = F.CAMARA.sigPsi; F.CAMARA.sigE = 0; F.CAMARA.sigPsi = 0;
  const A = F.simula(esc, { kp: F.kpDeP(10), kd: F.kdDeD(8), ff: 0, retraso: 0.15, semilla: 3 });
  F.CAMARA.sigE = sigE; F.CAMARA.sigPsi = sigP;
  // lo que mide la cámara en t es lo que había en la última imagen tomada hace ≥ 0,15 s (imágenes cada 30 ms)
  let maxd = 0; for (let k = 40; k < 1500; k += 7) { const t = A.t[k], tIm = Math.floor((t - 0.15 + 1e-9) / F.CAMARA.dt) * F.CAMARA.dt, kk = Math.round(tIm / DTS); maxd = Math.max(maxd, Math.abs(A.em[k] - A.e[kk])); }
  absc(maxd, 0, 1e-12, 'la medida de la cámara es el desvío real de hace 0,15 s (última imagen entregada)', `(diferencia máx. ${maxd.toExponential(1)})`);
  // con ruido: la desviación típica de la medida respecto de la imagen real es σ
  const B2 = F.simula(esc, { kp: F.kpDeP(10), kd: F.kdDeD(8), ff: 0, retraso: 0.15, semilla: 3 });
  let s2 = 0, nn = 0; for (let k = 40; k < 2600; k += 3) { const t = B2.t[k], tIm = Math.floor((t - 0.15 + 1e-9) / F.CAMARA.dt) * F.CAMARA.dt, kk = Math.round(tIm / DTS); s2 += (B2.em[k] - B2.e[kk]) ** 2; nn++; }
  cerca(Math.sqrt(s2 / nn), F.CAMARA.sigE, 0.12, 'el ruido de la cámara en el desvío tiene σ = 3 cm');
  // más retardo, menos estabilidad: el mismo PD con 0,35 s de retardo oscila más que con 0,05 s
  const ro = (ret) => F.corre(F.escPorId('autopista'), { p: 14, d: 5, retraso: ret }).m; ok(ro(0.35).osc > ro(0.05).osc || ro(0.35).emax > ro(0.05).emax, 'más retardo de la cámara, peor mantenimiento (mismos P y D)', `(osc ${f2(ro(0.05).osc, 2)} → ${f2(ro(0.35).osc, 2)}; emax ${f2(ro(0.05).emax, 2)} → ${f2(ro(0.35).emax, 2)})`); }

console.log('12 · Actuador: retardo de primer orden con topes');
{ const v = 25, d0 = F.deriv([0, 0, 0, 0, 0], v, 0, 0.005);
  cerca(d0[4], 0.005 / ACT.tau, 1e-12, 'δ̇ = (orden − δ)/τ con τ = 80 ms');
  const dg = F.deriv([0, 0, 0, 0, 0], v, 0, 0.02); cerca(dg[4], ACT.rate, 1e-12, 'una orden grande se limita a la velocidad de giro máxima');
  // la orden se satura en ±dMax: una vía demasiado cerrada no se puede seguir
  const tight = { id: 'cerrada', v: 90 / 3.6, R: 90, dir: 1, t0: 4, tEnt: 3, tArc: 8, tSal: 3, e0: 0.4, retraso: 0.1, lim: F.escPorId('autopista').lim };
  const r = F.corre(tight, { p: 13, d: 10 }); ok(r.m.sat > 0.2 && r.m.cruza, 'en una curva que pide más de ±2° el volante llega al tope y se sale', `(tope ${f2(r.m.sat * 100, 0)} % del tiempo, desvío ${f2(r.m.emax, 1)} m)`);
  ok(F.deltaCurva(tight.v, 1 / tight.R) > ACT.dMax, 'el ángulo que pide esa curva supera el tope', `(${f2(F.deltaCurva(tight.v, 1 / tight.R) / RAD, 2)}° > ${f2(ACT.dMax / RAD, 1)}°)`);
  for (const e of F.ESCENARIOS) { const m = F.corre(e, { p: 12, d: 10 }).m; ok(F.deltaCurva(e.v, 1 / e.R) < ACT.dMax * 0.8, `${e.id}: la curva pide menos que el tope (hay autoridad)`, `(${f2(F.deltaCurva(e.v, 1 / e.R) / RAD, 2)}° de ${f2(ACT.dMax / RAD, 1)}°)`); void m; } }

console.log('13 · Reproducibilidad y mandos');
{ const e = F.escPorId('autopista'), a = F.corre(e, { p: 8, d: 7 }), b = F.corre(e, { p: 8, d: 7 }); ok(a.A.e.every((v, i) => v === b.A.e[i]), 'misma entrada, misma salida (ruido con semilla fija)');
  const c = F.corre(e, { p: 8, d: 7, v: 100 / 3.6 }); ok(c.m.emax === a.m.emax, 'la velocidad por defecto del escenario es la del escenario');
  const m = F.corre(e, { p: 8, d: 7 }).m; ok(isFinite(m.emax) && isFinite(m.osc) && isFinite(m.vol), 'las métricas son finitas'); }

console.log('14 · El diseño del reto: nada se cumple de fábrica y la ventana es interior');
{ const U = (i) => Math.pow(50, i / 100), PAR = { p: 3, d: 3 };
  for (const e of F.ESCENARIOS) {
    ok(!F.cumpleTodo(F.corre(e, PAR).m, e), `${e.id}: con los mandos iniciales (P 3, D 3) NO se cumple`);
    let pasa = 0, tot = 0; const G = [];
    for (let i = 0; i <= 50; i++) { G.push([]); for (let j = 0; j <= 50; j++) { const m = F.corre(e, { p: U(i * 2), d: U(j * 2) }).m, k = F.cumpleTodo(m, e); G[i].push(k); tot++; if (k) pasa++; } }
    const frac = pasa / tot; ok(frac > 0.02 && frac < 0.20, `${e.id}: la ventana existe y es estrecha (${f2(frac * 100, 1)} % de la rejilla de mandos de 51×51)`);
    let borde = 0; for (let i = 0; i <= 50; i++) for (let j = 0; j <= 50; j++) if (G[i][j] && (i === 0 || j === 0 || i === 50 || j === 50)) borde++;
    ok(borde === 0, `${e.id}: la ventana no toca el borde de las barras (es INTERIOR en P y en D)`);
    // con D fijo en el centro de la ventana, hay un P mínimo Y un P máximo; con P fijo, un D mínimo y un D máximo
    let c = null; { let sx = 0, sy = 0, k = 0; for (let i = 0; i <= 50; i++) for (let j = 0; j <= 50; j++) if (G[i][j]) { sx += i; sy += j; k++; } c = [Math.round(sx / k), Math.round(sy / k)]; }
    ok(G[c[0]][c[1]], `${e.id}: el centro de la ventana cumple`, `(P ${f2(U(c[0] * 2), 1)}, D ${f2(U(c[1] * 2), 1)})`);
    const fila = G[c[0]], col = G.map((r) => r[c[1]]), ext = (a) => { const i0 = a.indexOf(true), i1 = a.lastIndexOf(true); return [i0, i1]; };
    const [d0, d1] = ext(fila), [p0, p1] = ext(col);
    ok(d0 > 0 && d1 < 50 && p0 > 0 && p1 < 50, `${e.id}: por los dos lados hay un mínimo y un máximo (P ${f2(U(p0 * 2), 0)}–${f2(U(p1 * 2), 0)}, D ${f2(U(d0 * 2), 0)}–${f2(U(d1 * 2), 0)})`);
    // los criterios se disparan por la causa que dice la guía
    const baja = F.cumple(F.corre(e, { p: 2.5, d: U(c[1] * 2) }).m, e); ok(!baja.e, `${e.id}: P muy suave no cumple «no tocar la raya»`);
    const sinD = F.cumple(F.corre(e, { p: U(c[0] * 2), d: 1.5 }).m, e); ok(!(sinD.e && sinD.osc && sinD.tlc), `${e.id}: D casi nula falla por zigzag o por la raya`);
    const muchoD = F.cumple(F.corre(e, { p: U(c[0] * 2), d: 40 }).m, e); ok(!(muchoD.vol && muchoD.e && muchoD.osc), `${e.id}: D enorme hace temblar el volante o desestabiliza`);
  }
  // el ajuste «bueno» del recorrido cumple en la autopista y se anuncia como tal
  const au = F.escPorId('autopista'); ok(F.cumpleTodo(F.corre(au, { p: 12, d: 10 }).m, au), 'el ajuste bueno del recorrido (P 12, D 10) cumple en la autopista'); }

console.log('15 · Los casos de diagnóstico son distintos y cada uno falla por su causa');
{ const au = F.escPorId('autopista'); const res = {};
  for (const c of CASOS_DX) { const m = F.corre(au, { p: c.p, d: c.d, v: c.kmh / 3.6 }).m; res[c.k] = { m, c: F.cumple(m, au) }; }
  ok(res.suave.m.emax > VEH.margen && res.suave.m.osc < 1.0 && res.suave.m.cruces <= 2, 'suave: se abre en la curva sin zigzag', `(desvío ${f2(res.suave.m.emax, 2)} m, ${res.suave.m.cruces} cruces)`);
  ok(res.zigzag.m.cruces >= 5 && res.zigzag.m.emax > VEH.margen, 'zigzag: cruza el centro muchas veces y pisa la raya', `(${res.zigzag.m.cruces} cruces, desvío ${f2(res.zigzag.m.emax, 2)} m)`);
  ok(res.tembloroso.c.e && res.tembloroso.c.osc && res.tembloroso.c.tlc && !res.tembloroso.c.vol, 'tembloroso: sólo falla el temblor del volante', `(${f2(res.tembloroso.m.vol, 0)} °/s)`);
  ok(res.veloz.c.e === false || res.veloz.c.tlc === false, 'veloz: los mismos mandos a 135 km/h acercan a la raya o disparan el aviso', `(desvío ${f2(res.veloz.m.emax, 2)} m, TLC mín. ${f2(res.veloz.m.tlcMin, 1)} s)`);
  ok(F.cumpleTodo(F.corre(au, { p: 9, d: 6, v: 60 / 3.6 }).m, au), 'veloz: esos mismos mandos a 60 km/h SÍ cumplen (la causa es la velocidad)');
  ok(Object.values(res).every((r) => !F.cumpleTodo(r.m, au)), 'ningún caso de diagnóstico cumple todo');
  const sig = Object.values(res).map((r) => JSON.stringify(r.c)); ok(new Set(sig).size >= 3, 'las firmas de fallo son distintas entre casos'); }

console.log('16 · La velocidad cambia la estabilidad (mismos mandos)');
{ const au = F.escPorId('autopista'); const r = (kmh) => F.corre(au, { p: 9, d: 6, v: kmh / 3.6 }).m;
  ok(r(130).emax > r(60).emax && r(130).tlcMin < r(60).tlcMin, 'a más velocidad, mayor desvío y menos margen con los mismos mandos', `(60 km/h: ${f2(r(60).emax, 2)} m, TLC ${f2(r(60).tlcMin, 1)} s · 130 km/h: ${f2(r(130).emax, 2)} m, TLC ${f2(r(130).tlcMin, 1)} s)`);
  // la curva empuja con v²: a_y máx a 120 km/h es (120/60)² veces la de 60 km/h
  const a60 = r(60).aymax, a120 = r(120).aymax; cerca(a120 / a60, 4, 0.2, 'el empuje lateral máximo crece con v² (×4 al duplicar la velocidad)', `(${f2(a60, 2)} → ${f2(a120, 2)} m/s²)`);
  // cifra de libro de la velocidad característica
  console.log('   · velocidad característica √(L/K) =', f2(3.6 * Math.sqrt(VEH.L / VEH.K), 1), 'km/h; K =', (VEH.K * 1000).toFixed(3), '·10⁻³ rad por m/s²'); }

console.log('\n' + (malas ? '✗ ' + malas + ' FALLOS de ' + n : '✓ ' + n + '/' + n + ' comprobaciones'));
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
