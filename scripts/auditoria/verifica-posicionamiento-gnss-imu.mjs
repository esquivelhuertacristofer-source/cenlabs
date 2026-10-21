// Verificación de la física de «Posicionamiento del coche: GNSS más sensor inercial (IMU) en un túnel» (mecanica-158).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas (ruta exacta, cinemática, covarianza sin lecturas, deriva ½·v·b·t²), con el álgebra del filtro (transición exacta,
// forma de Joseph, actualizaciones secuenciales = por lotes), con la estadística de los sensores (media, desviación y correlación del
// GNSS, del giroscopio, del acelerómetro y de las ruedas), con la consistencia del filtro por Monte Carlo (NEES ≈ 2) y con el diseño del
// reto (ventana INTERIOR en la confianza, nada se cumple «de fábrica», cada diagnóstico con su firma).
// uso: node scripts/auditoria/verifica-posicionamiento-gnss-imu.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/posicionamiento-gnss-imu.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAD,clamp,suave,DT,TFIN,NPAS,PRE,KPRE,NT,tDe,kDe,HZ_GNSS,SIG_U,T_REACQ,SIG_ODO,G0,RADIO,SEGS,RUTA,posRuta,CLASES,clasePorId,siDe,ESCENARIOS,escPorId,verdad,marcas,hdopDe,cielo,prng,normal,medidas,NE,eye,mul,trans,transicion,prediceP,corrigeEsc,confianza,filtra,metricas,REC_M,RETO,cumple,cumpleTodo,simula,derivaLateral,V_CRU,V_ZON,A_FRE,A_ACE,D_FRE};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');
const ESC_RETO = new Function('return ' + html.split('const ESC_RETO=')[1].split(';\n')[0])();
const TOUR_PARS = [...html.matchAll(/par:(PAR_TOUR|PAR_PRUEBA)/g)].length;

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const RAD = F.RAD, DT = F.DT, KPRE = F.KPRE, NT = F.NT;
const media = (a) => a.reduce((s, v) => s + v, 0) / a.length;
const desv = (a) => { const m = media(a); return Math.sqrt(a.reduce((s, v) => s + (v - m) ** 2, 0) / a.length); };

console.log('1 · Generador pseudoaleatorio y normal');
{ const r = F.prng(12345), s = []; for (let i = 0; i < 6; i++) s.push(r()); const r2 = F.prng(12345); ok(s.every((v) => v === r2()), 'misma semilla, misma secuencia');
  const rr = F.prng(777); let m = 0, v = 0, N = 200000; const xs = new Float64Array(N); for (let i = 0; i < N; i++) { xs[i] = F.normal(rr); m += xs[i]; } m /= N; for (let i = 0; i < N; i++) v += (xs[i] - m) ** 2; v /= N;
  absc(m, 0, 0.01, 'media de la normal ≈ 0'); absc(v, 1, 0.02, 'varianza de la normal ≈ 1');
  let k3 = 0; for (let i = 0; i < N; i++) k3 += xs[i] ** 4; absc(k3 / N, 3, 0.1, 'curtosis ≈ 3 (gaussiana)'); }

console.log('2 · La ruta es exacta: rectas y arcos de círculo');
{ const R = F.RADIO, L = F.RUTA.L; cerca(L, F.SEGS.reduce((s, g) => s + g.L, 0), 1e-12, 'longitud total = suma de tramos');
  for (const q of F.RUTA.segs.slice(1)) { const a = F.posRuta(q.s0 - 1e-9), b = F.posRuta(q.s0 + 1e-9); absc(a.E, b.E, 1e-6, `unión en s=${q.s0.toFixed(1)}: E continua`); absc(a.N, b.N, 1e-6, 'N continua'); absc(a.psi, b.psi, 1e-6, 'el rumbo es continuo (empalme tangente)'); }
  for (const q of F.RUTA.segs) if (Math.abs(q.k) > 0) { const cE = q.E0 - Math.sin(q.p0) / q.k, cN = q.N0 + Math.cos(q.p0) / q.k;
    for (const f of [0.1, 0.5, 0.9]) { const p = F.posRuta(q.s0 + f * q.L); absc(Math.hypot(p.E - cE, p.N - cN), R, 1e-9, `el arco es un círculo de radio ${R} m (${f})`); } }
  for (const s of [10, 150, 320, 450, 640, 700, 900, 1100, 1300]) { const h = 1e-4, a = F.posRuta(s - h), b = F.posRuta(s + h), p = F.posRuta(s);
    absc((b.E - a.E) / (2 * h), Math.cos(p.psi), 1e-6, `dE/ds = cos ψ en s=${s}`); absc((b.N - a.N) / (2 * h), Math.sin(p.psi), 1e-6, 'dN/ds = sen ψ'); absc((b.psi - a.psi) / (2 * h), p.k, 1e-6, 'dψ/ds = curvatura'); }
  absc(F.posRuta(-300).E, -300, 1e-12, 'antes del origen la recta se prolonga hacia atrás (pre-rodaje)'); absc(F.posRuta(-300).N, 0, 1e-12, 'y por el eje E'); }

console.log('3 · La verdad: cinemática exacta y perfil de velocidad');
{ for (const e of F.ESCENARIOS) { const V = F.verdad(e); let maxS = 0, maxV = 0, amin = 1e9, amax = -1e9, vmin = 1e9, vmax = -1e9;
    for (let k = 0; k < NT - 1; k++) { maxS = Math.max(maxS, Math.abs(V.s[k + 1] - (V.s[k] + V.v[k] * DT + 0.5 * V.a[k] * DT * DT))); maxV = Math.max(maxV, Math.abs(V.v[k + 1] - (V.v[k] + V.a[k] * DT))); amin = Math.min(amin, V.a[k]); amax = Math.max(amax, V.a[k]); vmin = Math.min(vmin, V.v[k]); vmax = Math.max(vmax, V.v[k]); }
    absc(maxS, 0, 1e-9, `«${e.id}»: s(k+1) = s + v·Δt + ½·a·Δt² exacto`); absc(maxV, 0, 1e-12, `«${e.id}»: v(k+1) = v + a·Δt exacto`);
    ok(amin >= F.A_FRE - 1e-9 && amax <= F.A_ACE + 1e-9, `«${e.id}»: la aceleración está dentro de ${F.A_FRE} y ${F.A_ACE} m/s²`, `${amin.toFixed(2)}..${amax.toFixed(2)}`);
    ok(vmax <= F.V_CRU + 1e-9 && vmin >= F.V_ZON - 0.2, `«${e.id}»: la rapidez nunca pasa de ${F.V_CRU} ni baja de ${F.V_ZON}`, `${vmin.toFixed(2)}..${vmax.toFixed(2)}`);
    absc(V.s[KPRE], 0, 1e-6, `«${e.id}»: tras el pre-rodaje a rapidez constante, s(t=0) = 0`);
    const M = F.marcas(e, V); ok(M.kIn > KPRE && M.kOut > M.kIn && M.kRe <= NT - 1, `«${e.id}»: la zona sin señal cae dentro del tiempo visible`, `${F.tDe(M.kIn).toFixed(1)} → ${F.tDe(M.kOut).toFixed(1)} s`);
    ok(F.tDe(M.kRe) + 3 <= F.TFIN, `«${e.id}»: da tiempo a recuperarse antes del final (${F.tDe(M.kRe).toFixed(1)} s de ${F.TFIN})`);
    ok(V.s[NT - 1] > e.sOut + 100, `«${e.id}»: el coche termina más allá de la zona`);
    // la velocidad de giro de cada paso es v·κ (curvatura de la ruta) en medio de un arco
    for (const q of F.RUTA.segs) if (q.k !== 0) { let mejor = 0; for (let k = KPRE; k < NT; k++) if (V.s[k] > q.s0 + 40 && V.s[k] < q.s0 + q.L - 40) { mejor = Math.max(mejor, Math.abs(V.r[k] - V.v[k] * q.k) / Math.abs(V.v[k] * q.k)); } ok(mejor < 2e-3, `«${e.id}»: r = v·κ en medio del arco (error relativo ${mejor.toExponential(1)})`); } }
  // el coche frena ANTES de la zona (D_FRE) y acelera al salir
  const e = F.escPorId('medio'), V = F.verdad(e), M = F.marcas(e, V); ok(V.v[M.kIn] < F.V_ZON + 0.5, 'al entrar a la zona ya va a la rapidez de zona'); ok(V.v[M.kOut + 80] > V.v[M.kOut] + 2, 'al salir de la zona acelera'); }

console.log('4 · Satélites y calidad del GNSS (HDOP)');
{ absc(F.hdopDe(4), 3.2 / Math.sqrt(2), 1e-12, 'HDOP(4) = 3,2/√2'); absc(F.hdopDe(11), 3.2 / 3, 1e-12, 'HDOP(11) = 3,2/√9'); ok(!isFinite(F.hdopDe(3)), 'con menos de 4 satélites no hay HDOP (no se puede fijar)');
  let prev = 1e9, mono = true; for (let nn = 4; nn <= 12; nn++) { const h = F.hdopDe(nn); if (h >= prev) mono = false; prev = h; } ok(mono, 'más satélites, mejor HDOP (decrece)');
  for (const e of F.ESCENARIOS) { const V = F.verdad(e), C = F.cielo(e, V), M = C.M;
    ok(C.nS[KPRE] === e.nOpen || e.tipo === 'canon' || e.sIn < 60, `«${e.id}»: cielo abierto al empezar`, String(C.nS[KPRE]));
    if (e.tipo === 'tunel') { let dentro = true; for (let k = M.kIn + Math.round(0.6 / DT); k < M.kOut + Math.round(F.T_REACQ / DT); k++) if (C.nS[k] !== 0) dentro = false; ok(dentro, `«${e.id}»: sin satélites dentro del túnel y mientras el receptor vuelve a fijar (${F.T_REACQ} s)`);
      ok(C.nS[M.kOut + Math.round((F.T_REACQ + 3.2) / DT)] === e.nOpen, `«${e.id}»: el cielo se recupera ${F.T_REACQ + 3} s después de salir`);
      let b = true; for (let k = KPRE; k < M.kIn - 1; k++) if (C.nS[k + 1] > C.nS[k] && V.s[k] > e.sIn - 80) b = false; ok(b, `«${e.id}»: antes de la boca los satélites sólo se van perdiendo`);
      for (let k = 0; k < NT; k++) if (C.nS[k] > 12 || C.nS[k] < 0) { ok(false, 'satélites dentro de 0..12'); break; }
    } else { let min = 99, max = 0; for (let k = M.kIn; k <= M.kOut; k++) { min = Math.min(min, C.nS[k]); max = Math.max(max, C.nS[k]); } ok(min >= e.nCan - 0.5 && C.nS.every((v) => v > 0), `«${e.id}»: el cañón nunca deja sin satélites, sólo pocos (${min})`); absc(Math.max(...C.kMP), e.kMP, 1e-9, `«${e.id}»: dentro del cañón el rebote multiplica el error del GNSS por ${e.kMP}`); } } }

console.log('5 · Estadística de los sensores');
{ const e = F.escPorId('medio'), c = F.clasePorId('consumo'), M = F.medidas(e, c), V = M.V, I = F.siDe(c), C = M.C;
  // GNSS: error normalizado en cielo abierto (antes de la zona): media 0, desviación 1 y correlación entre pasos φ = exp(−Δt/τ)
  const z = [], zE = [], zN = []; for (let k = 0; k < C.M.kIn - Math.round(2 / DT); k++) { z.push((M.gE[k] - V.E[k]) / M.sigG[k]); zE.push((M.gE[k] - V.E[k]) / M.sigG[k]); zN.push((M.gN[k] - V.Nn[k]) / M.sigG[k]); }
  const phi = Math.exp(-DT / e.tauG), nEf = zE.length * (1 - phi) / (1 + phi), tolM = 3.5 / Math.sqrt(nEf);   // muestras efectivas de una serie AR(1)
  absc(media(zE), 0, tolM, 'GNSS: error en E de media ≈ 0 (normalizado; 3,5 errores típicos de una serie correlacionada)', media(zE).toFixed(3)); absc(desv(zE), 1, 0.12, 'GNSS: desviación ≈ σ = SIG_U·HDOP', desv(zE).toFixed(3)); absc(media(zN), 0, tolM, 'GNSS: error en N de media ≈ 0', media(zN).toFixed(3)); absc(desv(zN), 1, 0.12, 'GNSS: desviación en N ≈ σ', desv(zN).toFixed(3));
  const ac = (a, lag) => { const m = media(a); let s = 0, d = 0; for (let i = 0; i + lag < a.length; i++) s += (a[i] - m) * (a[i + lag] - m); for (let i = 0; i < a.length; i++) d += (a[i] - m) ** 2; return s / d; };
  absc(ac(zE, 1), Math.exp(-DT / e.tauG), 0.05, 'GNSS: autocorrelación a un paso = exp(−Δt/τ)', ac(zE, 1).toFixed(3)); absc(ac(zE, Math.round(e.tauG / DT)), Math.exp(-1), 0.1, 'GNSS: autocorrelación a τ = e⁻¹');
  // σ del GNSS = SIG_U·HDOP·kMP
  for (const k of [KPRE, KPRE + 200]) cerca(M.sigG[k], F.SIG_U * M.hdop[k] * C.kMP[k], 1e-12, 'σ_GNSS = SIG_U · HDOP · kMP');
  // giroscopio: en recta (r = 0) la media es el sesgo y la desviación es ARW/√Δt
  const g0 = [], a0 = [], v0 = []; for (let k = 100; k < KPRE - 100; k++) { g0.push(M.wz[k] - M.bgT[k]); a0.push(M.ax[k] - V.a[k] - M.baT[k]); v0.push(M.vo[k] - V.v[k] * (1 + e.kO)); }
  absc(media(g0), 0, 4 * I.arw / Math.sqrt(DT) / Math.sqrt(g0.length), 'giroscopio: sin giro, el error medio es el sesgo (el ruido promedia a 0)'); cerca(desv(g0), I.arw / Math.sqrt(DT), 0.06, 'giroscopio: ruido blanco de densidad ARW (σ = ARW/√Δt)');
  absc(media(a0), 0, 4 * I.vrw / Math.sqrt(DT) / Math.sqrt(a0.length), 'acelerómetro: el ruido promedia a 0'); cerca(desv(a0), I.vrw / Math.sqrt(DT), 0.06, 'acelerómetro: ruido blanco de densidad VRW');
  cerca(desv(v0), F.SIG_ODO, 0.06, 'ruedas: ruido blanco de σ = SIG_ODO'); absc(media(v0), 0, 4 * F.SIG_ODO / Math.sqrt(v0.length), 'ruedas: error de escala kO y ruido blanco (media del ruido = 0)');
  // sesgos: constantes de entrada salvo la deriva lenta (3 % por √s)
  cerca(M.bgT[0], e.kB * I.bg, 0.02, 'el sesgo real del giroscopio parte de kB·(sesgo de catálogo)'); cerca(M.baT[0], e.kA * I.ba, 0.02, 'el del acelerómetro, de kA·(sesgo de catálogo)');
  ok(Math.abs(M.bgT[NT - 1] - M.bgT[0]) < 0.5 * I.bg, 'la deriva del sesgo en toda la corrida es menor que la mitad del sesgo', (Math.abs(M.bgT[NT - 1] - M.bgT[0]) / I.bg).toFixed(2));
  // en un arco el giroscopio mide la tasa de giro con el error de escala (1 + kS·sf)
  const q = F.RUTA.segs[1]; const ks = []; for (let k = KPRE; k < NT; k++) if (V.s[k] > q.s0 + 60 && V.s[k] < q.s0 + q.L - 60) ks.push((M.wz[k] - M.bgT[k]) / V.r[k]); cerca(media(ks), 1 + e.kS * I.sf, 0.02, 'giroscopio en un arco: la tasa de giro lleva el error de escala (1 + kS·sf)', media(ks).toFixed(4));
  // mismas realizaciones sin importar la frecuencia o la confianza (no cambian las medidas)
  const M2 = F.medidas(e, c); ok(M2.gE[500] === M.gE[500] && M2.wz[700] === M.wz[700], 'las medidas son reproducibles (semilla fija)'); }

console.log('6 · Álgebra del filtro: transición exacta, covarianza sin lecturas y forma de Joseph');
{ // Φ = exp(F·Δ) exacta (F nilpotente): se compara con la serie de Taylor larga
  const h = 0.05, v = 18.3, psi = 0.7, Ph = F.transicion(v, psi, h), NE = F.NE; const Fm = new Float64Array(NE * NE), c = Math.cos(psi), s = Math.sin(psi);
  Fm[0 * NE + 2] = c; Fm[0 * NE + 3] = -v * s; Fm[1 * NE + 2] = s; Fm[1 * NE + 3] = v * c; Fm[2 * NE + 5] = -1; Fm[3 * NE + 4] = -1;
  let T = F.eye(), term = F.eye(); for (let i = 1; i <= 12; i++) { term = F.mul(term, Fm).map((x) => x * h / i); for (let j = 0; j < NE * NE; j++) T[j] += term[j]; }
  let d = 0; for (let j = 0; j < NE * NE; j++) d = Math.max(d, Math.abs(T[j] - Ph[j])); absc(d, 0, 1e-12, 'Φ = exp(F·Δ) (F nilpotente de orden 3: la serie corta es exacta)');
  absc(Ph[0 * NE + 4], v * s * h * h / 2, 1e-12, 'Φ[E,sesgo giro] = +v·senψ·Δ²/2'); absc(Ph[1 * NE + 4], -v * c * h * h / 2, 1e-12, 'Φ[N,sesgo giro] = −v·cosψ·Δ²/2'); absc(Ph[0 * NE + 5], -c * h * h / 2, 1e-12, 'Φ[E,sesgo acel.] = −cosψ·Δ²/2'); absc(Ph[3 * NE + 4], -h, 1e-15, 'Φ[rumbo,sesgo giro] = −Δ');
  // covarianza sin lecturas, rumbo hacia el norte (ψ = π/2) y hacia el este (ψ = 0)
  const n = (t) => Math.round(t / h); const sg = 0.003, sa = 0.04, sp = 0.05;
  for (const t of [5, 10, 20, 30]) { let P = new Float64Array(NE * NE); P[4 * NE + 4] = sg * sg; const q0 = { v: 0, psi: 0, bg: 0, ba: 0, ko: 0 }; for (let i = 0; i < n(t); i++) P = F.prediceP(P, v, Math.PI / 2, h, q0);
    cerca(P[0], Math.pow(v * t * t / 2, 2) * sg * sg, 1e-9, `sin lecturas, sesgo del giro: var(E) = (v·t²/2)²·σ_b² (t=${t} s, rumbo norte)`); absc(P[NE + 1], 0, 1e-12, 'y el error a lo largo (N) no cambia');
    P = new Float64Array(NE * NE); P[5 * NE + 5] = sa * sa; for (let i = 0; i < n(t); i++) P = F.prediceP(P, v, 0, h, q0); cerca(P[0], Math.pow(t * t / 2, 2) * sa * sa, 1e-9, `sin lecturas, sesgo del acelerómetro: var(E) = (t²/2)²·σ_a² (t=${t} s)`);
    P = new Float64Array(NE * NE); P[3 * NE + 3] = sp * sp; P[4 * NE + 4] = sg * sg; for (let i = 0; i < n(t); i++) P = F.prediceP(P, v, Math.PI / 2, h, q0); cerca(P[0], Math.pow(v * t, 2) * sp * sp + Math.pow(v * t * t / 2, 2) * sg * sg, 1e-9, `rumbo + sesgo independientes: var(E) = v²t²σ_ψ² + (v t²/2)²σ_b² (t=${t} s)`); }
  { let P1 = new Float64Array(NE * NE), P2 = new Float64Array(NE * NE); P1[4 * NE + 4] = P2[4 * NE + 4] = sg * sg; const q0 = { v: 0, psi: 0, bg: 0, ba: 0, ko: 0 }; for (let i = 0; i < n(10); i++) P1 = F.prediceP(P1, v, Math.PI / 2, h, q0); for (let i = 0; i < n(20); i++) P2 = F.prediceP(P2, v, Math.PI / 2, h, q0); cerca(P2[0] / P1[0], 16, 1e-9, 'el error crece con el CUADRADO del tiempo: al duplicar t, la varianza se multiplica por 16'); }
  // ruido blanco: var(ψ) = q·t ; var(E) = v²·q·t³/3 (continuo) — el discreto converge con Δt
  for (const t of [10, 30]) { const qq = 1e-5; let P = new Float64Array(NE * NE); for (let i = 0; i < n(t); i++) P = F.prediceP(P, v, Math.PI / 2, h, { v: 0, psi: qq, bg: 0, ba: 0, ko: 0 }); cerca(P[3 * NE + 3], qq * t, 1e-9, `ruido de ángulo blanco: var(rumbo) = q·t (t=${t} s)`); cerca(P[0], v * v * qq * t * t * t / 3, 0.01, `y var(E) = v²·q·t³/3 (t=${t} s, discreto vs continuo)`); }
  for (const t of [10, 30]) { const qq = 1e-4; let P = new Float64Array(NE * NE); for (let i = 0; i < n(t); i++) P = F.prediceP(P, v, 0, h, { v: qq, psi: 0, bg: 0, ba: 0, ko: 0 }); cerca(P[2 * NE + 2], qq * t, 1e-9, `ruido de velocidad blanco: var(v) = q·t (t=${t} s)`); cerca(P[0], qq * t * t * t / 3, 0.01, `y var(E) = q·t³/3 (t=${t} s)`); }
  // actualización escalar: Joseph = forma estándar; simetría; P ≥ 0; en el caso escalar P⁺ = P·R/(P+R)
  { const NE_ = F.NE; let P = new Float64Array(NE_ * NE_); const base = [[4, 0.5, 0.3, 0.1, 0, 0, 0], [0.5, 3, 0.2, 0.05, 0, 0, 0], [0.3, 0.2, 1, 0.01, 0, 0, 0], [0.1, 0.05, 0.01, 0.02, 0.001, 0, 0], [0, 0, 0, 0.001, 0.01, 0, 0], [0, 0, 0, 0, 0, 0.003, 0], [0, 0, 0, 0, 0, 0, 1e-4]];
    for (let i = 0; i < NE_; i++) for (let j = 0; j < NE_; j++) P[i * NE_ + j] = base[i][j];
    const P0 = Float64Array.from(P), R = 2.2, hh = [[0, 1]]; const Ph = new Float64Array(NE_); for (let i = 0; i < NE_; i++) Ph[i] = P0[i * NE_ + 0]; const S = P0[0] + R;
    const r = F.corrigeEsc(P, hh, R); cerca(r.S, S, 1e-12, 'innovación: S = h·P·hᵀ + R'); let dif = 0; for (let i = 0; i < NE_; i++) for (let j = 0; j < NE_; j++) dif = Math.max(dif, Math.abs(P[i * NE_ + j] - (P0[i * NE_ + j] - Ph[i] * Ph[j] / S)));
    absc(dif, 0, 1e-12, 'forma de Joseph = P − K·S·Kᵀ (la forma estándar)'); let asim = 0; for (let i = 0; i < NE_; i++) for (let j = 0; j < NE_; j++) asim = Math.max(asim, Math.abs(P[i * NE_ + j] - P[j * NE_ + i])); absc(asim, 0, 1e-15, 'la covarianza queda simétrica');
    for (let i = 0; i < NE_; i++) ok(P[i * NE_ + i] <= P0[i * NE_ + i] + 1e-15 && P[i * NE_ + i] > 0, `una lectura nunca sube la duda (estado ${i})`);
    cerca(P[0], P0[0] * R / (P0[0] + R), 1e-12, 'caso escalar: P⁺ = P·R/(P + R)'); cerca(r.K[0], P0[0] / S, 1e-12, 'K = P/(P + R)'); ok(r.K[0] > 0 && r.K[0] < 1, 'la ganancia está entre 0 y 1');
    // dos escalares secuenciales (E, N) = una actualización por lotes de 2×2 con R diagonal
    let Ps = Float64Array.from(P0); F.corrigeEsc(Ps, [[0, 1]], R); F.corrigeEsc(Ps, [[1, 1]], R);
    const a = P0[0], b = P0[1], d2 = P0[NE_ + 1]; const detS = (a + R) * (d2 + R) - b * b; const Sinv = [[(d2 + R) / detS, -b / detS], [-b / detS, (a + R) / detS]]; const K0 = [[a * Sinv[0][0] + b * Sinv[1][0], a * Sinv[0][1] + b * Sinv[1][1]], [b * Sinv[0][0] + d2 * Sinv[1][0], b * Sinv[0][1] + d2 * Sinv[1][1]]];
    const lote = [[a - (K0[0][0] * a + K0[0][1] * b), b - (K0[0][0] * b + K0[0][1] * d2)], [0, d2 - (K0[1][0] * b + K0[1][1] * d2)]]; absc(Ps[0], lote[0][0], 1e-12, 'secuencial = por lotes: var(E)'); absc(Ps[1], lote[0][1], 1e-12, 'secuencial = por lotes: cov(E,N)'); absc(Ps[NE_ + 1], lote[1][1], 1e-12, 'secuencial = por lotes: var(N)'); }
  // confianza: g = 3^u
  cerca(F.confianza(0), 1, 1e-15, 'u = 0 → equilibrado (g = 1)'); cerca(F.confianza(1) * F.confianza(-1), 1, 1e-15, 'g(u)·g(−u) = 1'); }

console.log('7 · La deriva por un sesgo: ½·v·b·t² (forma cerrada) y el filtro navegando a ciegas');
{ for (const [v, bd, t] of [[20, 0.05, 30], [15, 0.1, 20], [25, 0.02, 40]]) { const b = bd * RAD, ex = v * (1 - Math.cos(b * t)) / b; cerca(F.derivaLateral(v, b, t), ex, 2e-3, `½·v·b·t² ≈ v·(1 − cos b·t)/b (v=${v}, b=${bd} °/s, t=${t} s)`); }
  cerca(F.derivaLateral(20, 0.01, 20) / F.derivaLateral(20, 0.01, 10), 4, 1e-12, 'al duplicar t el error se cuadruplica'); cerca(F.derivaLateral(20, 0.02, 10) / F.derivaLateral(20, 0.01, 10), 2, 1e-12, 'al duplicar el sesgo, el error se duplica');
  // el filtro sin lecturas (sólo IMU) contra una integración independiente de las mismas medidas
  const e = F.escPorId('medio'), c = F.clasePorId('basico'), M = F.medidas(e, c), V = M.V; M.gOk.fill(0); M.gOk[0] = 1;
  const T = F.filtra(e, c, { hz: 10, u: 0, odo: false }, M);
  let E = M.gE[0], N = M.gN[0], v = M.vo[0], psi = V.psi[0] + e.psi0, dmax = 0;
  for (let k = 1; k < NT; k++) { const w = M.wz[k - 1], a = M.ax[k - 1], v1 = v + a * DT, p1 = psi + w * DT, vm = (v + v1) / 2, pm = (psi + p1) / 2; E += vm * Math.cos(pm) * DT; N += vm * Math.sin(pm) * DT; v = v1; psi = p1; dmax = Math.max(dmax, Math.hypot(T.E[k] - E, T.Nn[k] - N)); }
  absc(dmax, 0, 1e-9, 'el filtro sin lecturas = integración independiente de las medidas del IMU (punto medio)');
  // y esa integración se aparta de la verdad con ½·v·b·t² (lateral, recta del pre-rodaje): error lateral ≈ v·δψ₀·t + ½·v·b̄·t²
  { const off = M.gN[0] - V.Nn[0];
    // integración independiente del error de rumbo: δψ(t) = δψ₀ + ∫b dt (+ escala), lateral = ∫ v̂·sen δψ dt con la rapidez que da el IMU (la carretera arranca recta hacia el este)
    let dpsi = e.psi0, lat = 0, vv = M.vo[0], serie = [0]; for (let k = 1; k < NT; k++) { const v1 = vv + M.ax[k - 1] * DT; dpsi += (M.wz[k - 1] - V.r[k - 1]) * DT; lat += 0.5 * (vv + v1) * Math.sin(dpsi) * DT; vv = v1; serie.push(lat); }
    for (const t of [10, 20]) { const k = Math.round(t / DT), real = (T.Nn[k] - V.Nn[k]) - off;
      cerca(real, serie[k], 0.08, `a los ${t} s de navegar a ciegas, el error lateral = ∫ v·sen(δψ₀ + ∫b dt) dt (±8 %)`, `${real.toFixed(2)} vs ${serie[k].toFixed(2)}`); }
    const la = (t) => (T.Nn[Math.round(t / DT)] - V.Nn[Math.round(t / DT)]); ok(la(20) - la(0) > 0 === serie[Math.round(20 / DT)] > 0, 'el error lateral crece del lado que dicta el sesgo'); } }

console.log('8 · El filtro: se corrige, aprende los sesgos y es honesto');
{ const e = F.escPorId('medio'), c = F.clasePorId('consumo'), M = F.medidas(e, c), V = M.V, T = F.filtra(e, c, { hz: 2, u: 0, odo: true }, M), m = F.metricas(e, T, M);
  ok(m.abierto < 2.6, 'con cielo abierto, el error del filtro es del orden del GNSS (≈ SIG_U·HDOP)', m.abierto.toFixed(2));
  const kE = KPRE - 400; let bgErr = 0; for (let k = kE; k < KPRE; k++) bgErr += Math.abs(T.bg[k] - M.bgT[k]); bgErr /= 400; ok(bgErr < 0.35 * Math.abs(M.bgT[KPRE]), 'después del pre-rodaje el filtro ya aprendió el sesgo del giroscopio (error < 35 % del sesgo)', (bgErr / RAD * 3600).toFixed(0) + ' °/h de ' + (M.bgT[KPRE] / RAD * 3600).toFixed(0));
  ok(Math.abs(T.ko[KPRE] - e.kO) < 0.0025, 'aprende la escala de las ruedas', `${T.ko[KPRE].toFixed(4)} vs ${e.kO}`);
  // dentro de la zona la duda crece y al volver el GPS el filtro se corrige de golpe
  const M2 = M.C.M; const d0 = Math.hypot(T.pEE[M2.kIn], T.pNN[M2.kIn]), d1 = Math.hypot(T.pEE[M2.kOut], T.pNN[M2.kOut]); ok(d1 > 3 * d0, 'sin lecturas la duda del filtro crece (×3 o más dentro del túnel)', `${Math.sqrt(d0).toFixed(2)} → ${Math.sqrt(d1).toFixed(2)} m`);
  ok(T.saltos.length === 1 && isFinite(T.saltos[0].salto), 'al reaparecer el GNSS se registra un salto de corrección'); ok(T.pEE[M2.kRe + 120] < 0.3 * T.pEE[M2.kOut], 'tras recibir lecturas la duda vuelve a bajar');
  // la ganancia del GNSS es alta cuando la duda es grande y baja cuando es chica
  let kmax = 0; for (let k = M2.kOut; k < M2.kRe + 200; k++) kmax = Math.max(kmax, T.kG[k]); ok(kmax > 5 * T.kG[KPRE - 2] || T.kG[KPRE - 2] < 0.2, 'el peso del GPS es mayor al reaparecer que en régimen', `${kmax.toFixed(2)} vs ${T.kG[KPRE - 2].toFixed(3)}`);
  // frecuencia: sólo se usan lecturas en los pasos que tocan
  for (const hz of F.HZ_GNSS) { const Th = F.filtra(e, c, { hz, u: 0, odo: true }, M); let us = 0; for (let k = KPRE; k < KPRE + 200; k++) us += Th.usa[k]; ok(Math.abs(us - 200 * DT * hz) <= 1.01, `a ${hz} Hz se usan ${(200 * DT * hz)} lecturas en 10 s (hay satélites)`, String(us)); }
  // sin ruedas el error a lo largo crece mucho más en la zona
  const A = F.metricas(e, F.filtra(e, F.clasePorId('industrial'), { hz: 2, u: 0.6, odo: true }, F.medidas(e, F.clasePorId('industrial'))), F.medidas(e, F.clasePorId('industrial')));
  const Mi = F.medidas(e, F.clasePorId('industrial')), B = F.metricas(e, F.filtra(e, F.clasePorId('industrial'), { hz: 2, u: 0.6, odo: false }, Mi), Mi);
  ok(B.alSal > 3 * A.alSal && B.alSal > 3, 'sin odómetro el error a lo largo al salir es mucho mayor', `${B.alSal.toFixed(1)} m vs ${A.alSal.toFixed(1)} m`); }
{ // Monte Carlo de consistencia: con el modelo igual al mundo (sin error de escala del giroscopio ni rebotes, GNSS casi blanco) el NEES de posición vale 2
  const base = F.escPorId('medio'), c = F.clasePorId('consumo'); const nees = [], neesZ = []; let cubre = [];
  for (let s = 0; s < 24; s++) { const e = Object.assign({}, base, { semilla: 9000 + s * 17, kS: 0, tauG: 0.02, kB: 1.0 * (s % 2 ? 1 : -1), kA: 1.0 * (s % 3 ? 1 : -1) }); const M = F.medidas(e, c), T = F.filtra(e, c, { hz: 1, u: 0, odo: true }, M), m = F.metricas(e, T, M); nees.push(m.nees); cubre.push(m.cobertura); }
  const mn = media(nees); ok(mn > 1.4 && mn < 3.0, 'Monte Carlo (24 semillas): el NEES medio de posición ≈ 2 cuando el modelo coincide con el mundo', mn.toFixed(2) + ' ± ' + (desv(nees) / Math.sqrt(nees.length)).toFixed(2));
  const cb = media(cubre); ok(cb > 0.85 && cb < 1.0, 'y el círculo del 95 % cubre al coche en la zona sin señal ≥ 85 % del tiempo', cb.toFixed(2));
  // y con la realidad del lab (GNSS correlacionado, 10 lecturas/s) el filtro es presumido: es lo que enseña el reto
  const Mx = F.medidas(base, c), Tx = F.filtra(base, c, { hz: 10, u: 0, odo: true }, Mx), mx = F.metricas(base, Tx, Mx); ok(mx.nees > 4, 'con el error del GNSS repetido entre lecturas, a 10 Hz el filtro es presumido (NEES > 4)', mx.nees.toFixed(1));
  const T1 = F.filtra(base, c, { hz: 1, u: 0, odo: true }, Mx), m1 = F.metricas(base, T1, Mx); ok(m1.nees < mx.nees, 'y a 1 Hz es menos presumido que a 10 Hz', `${m1.nees.toFixed(1)} < ${mx.nees.toFixed(1)}`); }

console.log('9 · Cómo se ve la física: orden de las clases, crecimiento con t² y salto al volver el GPS');
{ for (const id of ['medio', 'largo', 'corto', 'canon']) { const e = F.escPorId(id); const med = F.CLASES.map((c) => { const M = F.medidas(e, c), v = []; for (const hz of [1, 2, 5]) for (const u of [0, 0.5, 1]) v.push(F.metricas(e, F.filtra(e, c, { hz, u, odo: true }, M), M).pico); v.sort((a, b) => a - b); return v[4]; });
    ok(med[0] > med[1] && med[1] > med[2] && med[2] >= med[3] * 0.8, `«${id}»: mejor IMU, menor error en la zona (mediana: ${med.map((x) => x.toFixed(1)).join(' > ')})`); }
  { const e = F.escPorId('medio'), c = F.clasePorId('basico'), M = F.medidas(e, c), T = F.filtra(e, c, { hz: 2, u: 0, odo: true }, M), m = F.metricas(e, T, M);
    ok(m.salto > 0.6 * m.eSal && m.salto < 1.6 * m.eSal, 'al reaparecer el GPS, el salto de corrección ≈ el error acumulado (0,6–1,6×)', `${m.salto.toFixed(1)} vs ${m.eSal.toFixed(1)}`); ok(m.recupera > 3, 'el error tarda unos segundos en bajar de 3 m al salir con un IMU malo', m.recupera.toFixed(1)); } }

console.log('10 · El reto: nada se cumple de fábrica; la ventana de confianza es INTERIOR; el sensor más barato no basta');
{ const U = []; for (let i = -12; i <= 12; i++) U.push(i * 0.25);
  const pasa = (e, c, hz, u) => { const M = F.medidas(e, c); const T = F.filtra(e, c, { hz, u, odo: true }, M); return F.cumpleTodo(F.metricas(e, T, M), e); };
  ok(F.RETO.precioMax === 3, 'el presupuesto del reto llega hasta «industrial» ($$$)'); ok(F.clasePorId('industrial').precio === 3 && F.clasePorId('tactico').precio === 4, 'el táctico queda fuera de presupuesto');
  const arranque = { cls: 'consumo', hz: 5, u: 0 };
  for (const id of ESC_RETO) { const e = F.escPorId(id); ok(!pasa(e, F.clasePorId(arranque.cls), arranque.hz, arranque.u), `«${id}»: el ajuste inicial del reto (${arranque.cls}, ${arranque.hz} Hz, u=0) NO cumple`);
    let hallado = 0, total = 0, ventanas = {}; const pasoBasico = [];
    for (const c of F.CLASES) { const M = F.medidas(e, c); for (const hz of F.HZ_GNSS) { const fila = U.map((u) => F.cumpleTodo(F.metricas(e, F.filtra(e, c, { hz, u, odo: true }, M), M), e)); total += fila.length;
        if (c.precio <= F.RETO.precioMax) hallado += fila.filter(Boolean).length; if (c.id === 'basico') pasoBasico.push(...fila);
        const idx = fila.map((v, i) => v ? i : -1).filter((i) => i >= 0); if (idx.length && c.precio <= F.RETO.precioMax) { ventanas[c.id + '/' + hz] = [U[idx[0]], U[idx[idx.length - 1]], idx.length, idx[idx.length - 1] - idx[0] + 1 - idx.length]; } } }
    ok(hallado > 5, `«${id}»: existen soluciones dentro del presupuesto`, String(hallado)); ok(!pasoBasico.some(Boolean), `«${id}»: el sensor básico no cumple con ninguna combinación`);
    const ks = Object.keys(ventanas); ok(ks.length >= 1, `«${id}»: al menos una combinación (clase, Hz) tiene ventana`, ks.join(' '));
    for (const k of ks) { const [lo, hi] = ventanas[k]; ok(lo > -3 && hi < 3, `«${id}» ${k}: la ventana de confianza es INTERIOR (${lo} a ${hi}), no pega con los extremos del mando ±3`); }
    console.log('    ventanas ' + id + ': ' + ks.map((k) => `${k} [${ventanas[k][0]}, ${ventanas[k][1]}]`).join(' · ')); }
  // criterios: cada uno falla en algún lugar (no son triviales) y NEES elimina a los presumidos
  { const e = F.escPorId('medio'), c = F.clasePorId('industrial'), M = F.medidas(e, c); const m = F.metricas(e, F.filtra(e, c, { hz: 10, u: -2, odo: true }, M), M), cu = F.cumple(m, e); ok(!cu.nees, 'medio · 10 Hz fiándose del GPS: el criterio de honestidad falla', m.nees.toFixed(1)); const m2 = F.metricas(e, F.filtra(e, c, { hz: 1, u: 3, odo: true }, M), M); ok(!F.cumple(m2, e).pico || !F.cumple(m2, e).lat || !F.cumple(m2, e).rec, 'medio · fiándose casi sólo del IMU a 1 Hz: falla algún criterio de error', JSON.stringify([m2.pico, m2.laPico, m2.recupera].map((x) => +x.toFixed(1)))); }
  { const e = F.escPorId('canon'), c = F.clasePorId('industrial'), M = F.medidas(e, c); const a = F.metricas(e, F.filtra(e, c, { hz: 10, u: 0, odo: true }, M), M), b = F.metricas(e, F.filtra(e, c, { hz: 1, u: 1.5, odo: true }, M), M); ok(a.nees > 10, 'cañón · 10 Hz sin desconfiar del GPS: presumido (NEES > 10)', a.nees.toFixed(0)); ok(F.cumple(b, e).nees, 'cañón · 1 Hz y fiándose más del IMU: honesto', b.nees.toFixed(2)); }
  // la ventana se desplaza con el entorno (el cañón exige desconfiar más del GPS que el túnel)
  { const lo = (id) => { const e = F.escPorId(id), c = F.clasePorId('industrial'), M = F.medidas(e, c); for (const u of U) if (F.cumple(F.metricas(e, F.filtra(e, c, { hz: 1, u, odo: true }, M), M), e).nees) return u; return null; }; const lm = lo('medio'), lc = lo('canon'); ok(lm !== null && lc !== null && lc > lm + 0.5, 'el NEES honesto exige más fe en el IMU en el cañón que en el túnel', `u ≥ ${lm} (túnel) vs u ≥ ${lc} (cañón)`); } }

console.log('11 · La fase 1 (calcula), el diagnóstico (4 firmas distintas) y el quiz');
{ const vistos = new Set(); for (const c of CASOS_1) { const ex = F.derivaLateral(c.v, c.b * RAD, c.t); vistos.add(c.v + '/' + c.b); const tol = Math.max(0.25, 0.04 * ex);
    ok(Math.abs(2 * ex - ex) > tol && Math.abs(ex / RAD - ex) > tol && Math.abs(c.v * c.b * RAD * c.t - ex) > tol, `fase 1 (${c.v} m/s, ${c.b} °/s, ${c.t} s = ${ex.toFixed(2)} m): sin el ½, sin pasar a radianes o con v·b·t, NO acierta`);
    ok(ex > 3 && ex < 15, 'y la respuesta es de unos metros (legible en el mapa)', ex.toFixed(2)); }
  ok(vistos.size === CASOS_1.length, 'los casos de la fase 1 son todos distintos');
  const R = {}; for (const c of CASOS_DX) { const e = F.escPorId(c.esc), cl = F.clasePorId(c.cls), M = F.medidas(e, cl), T = F.filtra(e, cl, { hz: c.hz, u: c.u, odo: c.odo }, M), m = F.metricas(e, T, M);
    let oscila = 0; for (let k = KPRE; k < M.C.M.kIn - 20; k++) oscila += Math.abs(T.bg[k + 20] - T.bg[k]); oscila = oscila / (M.C.M.kIn - 20 - KPRE) * 20 / RAD * 3600;
    R[c.k] = Object.assign({ oscila }, m); ok(!F.cumpleTodo(m, e), `diagnóstico «${c.k}»: falla el reto`); }
  ok(R.sesgo.laPico > 0.5 * R.sesgo.pico && R.sesgo.pico > F.escPorId('medio').lim.pico, '«sesgo»: error grande en la zona y sobre todo de lado', JSON.stringify([R.sesgo.pico, R.sesgo.laPico].map((x) => +x.toFixed(1))));
  ok(R.sinruedas.alSal > 2 * R.sinruedas.laSal && R.sinruedas.pico > F.escPorId('medio').lim.pico, '«sinruedas»: el error domina a lo largo del camino (no de lado)', JSON.stringify([R.sinruedas.alSal, R.sinruedas.laSal].map((x) => +x.toFixed(1))));
  ok(R.gps.oscila > 3 * Math.max(R.sesgo.oscila, R.sinruedas.oscila, 1), '«gps»: el sesgo que cree el giroscopio se agita (varía mucho entre pasos) antes del túnel', JSON.stringify([R.gps.oscila, R.sesgo.oscila, R.sinruedas.oscila].map((x) => +x.toFixed(0))));
  ok(R.presumido.nees > 10 && R.presumido.duda < R.presumido.pico / 1.5, '«presumido»: NEES alto y el círculo de duda más chico que el error', JSON.stringify([R.presumido.nees, R.presumido.duda, R.presumido.pico].map((x) => +x.toFixed(1)))); }

console.log('12 · Estructura del HTML publicado');
ok(html.includes('<script src="_puente.js"></script>'), 'el puente con la plataforma está');
ok(html.includes('_ficha-posicionamiento-gnss-imu.js') && html.includes('_ficha-tecnica.js'), 'la ficha técnica está');
ok(!/type="number"/.test(html), 'sin input type=number (punto decimal nativo)');
ok(!/onclick=/.test(html.replace(/\.onclick=/g, '')), 'sin onclick inline');
ok(/window\.__labDebug=\{/.test(html) && html.includes('quizCorrectIndex') && html.includes('quizAnswer'), '__labDebug con quizAnswer y quizCorrectIndex');
ok(!/useFrame/.test(html), 'sin useFrame (lab estático, un solo reloj requestAnimationFrame)');
ok(html.includes('btnAuto') && html.includes('prefers-reduced-motion'), 'tiene btnAuto y respeta el movimiento reducido');
ok(TOUR_PARS === 7 && /const TOUR_PASOS=\[/.test(html), 'el recorrido tiene 7 pasos con sus parámetros');
ok(['medio', 'largo', 'canon'].every((id) => ESC_RETO.includes(id)) && ESC_RETO.every((id) => F.ESCENARIOS.some((e) => e.id === id)), 'los escenarios del reto existen');
console.log(`\n${n} comprobaciones, ${malas} fallos`); if (malas) { console.log(fallos.join('\n')); process.exit(1); }
