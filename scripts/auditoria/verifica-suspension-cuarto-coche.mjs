// Verificación de la física del lab suspension-cuarto-coche: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, un resolvente independiente (Lyapunov), conservación de energía y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-suspension-cuarto-coche.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, G, NOMINAL: P0, CSA, CAMINOS, N0, transf, pesoWk, filtroWk, sw, metricas, polos, modos, autovalores, compsCamino, zCamino, zBache, generaCamino, metricasLineas, cEfectiva, rk4Cuarto, simulaMetricas, bandaConfort, ventanaC, cAbs } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);

console.log('1 · Frecuencias propias y polos');
{
  const A = autovalores(P0);
  // independiente: det(K − λM) = 0 por barrido de cambios de signo y bisección sobre λ = ω²
  const det = (lam) => (P0.ks - P0.ms * lam) * (P0.ks + P0.kt - P0.mu * lam) - P0.ks * P0.ks;
  const raiz = (lo, hi) => { for (let i = 0; i < 200; i++) { const m = (lo + hi) / 2; if (det(lo) * det(m) <= 0) hi = m; else lo = m; } return (lo + hi) / 2; };
  const lambdas = [];
  let prev = det(1), a0 = 1; for (let l = 1.01; l < 1e7; l *= 1.01) { const d = det(l); if (prev * d < 0) lambdas.push(raiz(a0, l)); prev = d; a0 = l; }
  prueba('f1 y f2 sin amortiguador (forma cerrada) = raíces de det(K − ω²M) por bisección', lambdas.length === 2 && rel(Math.sqrt(lambdas[0]) / DOSPI, A.f1) < 1e-9 && rel(Math.sqrt(lambdas[1]) / DOSPI, A.f2) < 1e-9, `${f(A.f1, 4)} Hz y ${f(A.f2, 3)} Hz`);
  prueba('carrocería ≈ 1–1,5 Hz y rueda ≈ 10–14 Hz', A.f1 > 1 && A.f1 < 1.5 && A.f2 > 10 && A.f2 < 14);
  const p0 = polos({ ...P0, c: 0 }), imag = p0.map(p => Math.abs(p[1]) / DOSPI).sort((a, b) => a - b), reales = Math.max(...p0.map(p => Math.abs(p[0])));
  prueba('con c = 0 los 4 polos son imaginarios puros en ±f1, ±f2 (Durand–Kerner)', reales < 1e-8 && rel(imag[0], A.f1) < 1e-9 && rel(imag[3], A.f2) < 1e-9, `parte real máx ${reales.toExponential(1)}`);
  for (const c of [300, 1500, 4000]) {
    const P = { ...P0, c }, z = polos(P), suma = z.reduce((s, p) => s + p[0], 0), prod = z.reduce((q, p) => F.cMul(q, p), [1, 0]);
    const co = [P.ms * P.mu, (P.ms + P.mu) * P.c, P.ms * (P.ks + P.kt) + P.mu * P.ks, P.kt * P.c, P.ks * P.kt];
    prueba(`c = ${c}: Σ polos = −(ms+mu)c/(ms·mu) y Π polos = ks·kt/(ms·mu) (Vieta)`, rel(suma, -co[1] / co[0]) < 1e-9 && rel(prod[0], co[4] / co[0]) < 1e-8);
  }
  prueba('límite kt → ∞: f1 → √(ks/ms)/2π', rel(autovalores({ ...P0, kt: 1e12 }).f1, Math.sqrt(P0.ks / P0.ms) / DOSPI) < 1e-6, `${f(Math.sqrt(P0.ks / P0.ms) / DOSPI, 4)} Hz`);
  const m1 = modos(P0); prueba('ζ de carrocería ≈ c/(2√(ks·ms)) con la rueda quieta (±15 %)', rel(m1.carroceria.zeta, P0.c / (2 * Math.sqrt(P0.ks * P0.ms))) < 0.15, `ζ = ${f(m1.carroceria.zeta, 3)} frente a ${f(P0.c / (2 * Math.sqrt(P0.ks * P0.ms)), 3)}`);
}

console.log('2 · Funciones de transferencia contra el tiempo');
{
  // régimen estacionario ante zr = sen(ωt): se proyecta la respuesta sobre sen y cos en un número entero de periodos
  const P = { ...P0, c: 1500 };
  let peor = 0;
  for (const fr of [0.6, 1.3, 3, 8, 11.7, 20]) {
    const w = DOSPI * fr, h = Math.min(0.0005, 1 / fr / 400); let st = [0, 0, 0, 0]; const zr = (t) => Math.sin(w * t);
    let sS = 0, cS = 0, sU = 0, cU = 0, tI = 0, t = 0;
    const Ntr = Math.round(12 / h), Nmed = Math.round(Math.max(1, Math.round(8 * fr)) / fr / h);
    for (let i = 0; i < Ntr + Nmed; i++) { const r = rk4Cuarto(st, zr(t), zr(t + h / 2), zr(t + h), h, P, 'pasivo'); st = r.st; t += h;
      if (i >= Ntr) { const s_ = Math.sin(w * t), c_ = Math.cos(w * t); sS += st[0] * s_; cS += st[0] * c_; sU += st[1] * s_; cU += st[1] * c_; tI++; } }
    const ampS = 2 * Math.hypot(sS, cS) / tI, ampU = 2 * Math.hypot(sU, cU) / tI, H = transf(P, fr);
    peor = Math.max(peor, rel(ampS, cAbs(H.zs)), rel(ampU, cAbs(H.zu)));
  }
  prueba('|Zs/Zr| y |Zu/Zr| de transf() = amplitud del RK4 en régimen (6 frecuencias de 0,6 a 20 Hz)', peor < 2e-3, `peor error relativo ${peor.toExponential(2)}`);
  const H0 = transf(P, 1e-4); prueba('f → 0: el coche sigue al camino (Zs/Zr = Zu/Zr = 1, sin recorrido ni carga dinámica)', Math.abs(cAbs(H0.zs) - 1) < 1e-6 && Math.abs(cAbs(H0.zu) - 1) < 1e-6 && cAbs(H0.def) < 1e-6 && cAbs(H0.tire) < 1);
  const Hh = transf(P, 2000); prueba('f → ∞: la carrocería no se entera (|Zs/Zr| → 0) y la rueda tampoco', cAbs(Hh.zs) < 1e-6 && cAbs(Hh.zu) < 1e-3);
  let pk = 0; for (const fr of [0.5, 1.3, 4, 9, 14]) { const Hc = transf({ ...P0, c: 1e11 }, fr), w = DOSPI * fr, uno = P0.kt / (P0.kt - (P0.ms + P0.mu) * w * w);
    pk = Math.max(pk, Math.abs(Hc.zs[0] - uno) / Math.abs(uno), Math.abs(Hc.zs[1]) / Math.abs(uno), cAbs(Hc.def) / Math.abs(uno)); }
  prueba('límite c → ∞: Zs/Zr = kt/(kt − (ms+mu)ω²) y recorrido nulo', pk < 1e-6, `error ${pk.toExponential(1)}`);
  const mz = modos({ ...P0, c: 5 }), Hr = transf({ ...P0, c: 5 }, mz.carroceria.fn), Q = cAbs(Hr.zs);
  prueba('c → 0: el pico de |Zs/Zr| crece como 1/(2ζ)', rel(Q, 1 / (2 * mz.carroceria.zeta)) < 0.02, `${f(Q, 1)} frente a ${f(1 / (2 * mz.carroceria.zeta), 1)}`);
}

console.log('3 · Ponderación Wk de la ISO 2631-1');
{
  const T = [[0.5, 0.418], [1, 0.482], [2, 0.531], [3.15, 0.804], [4, 0.967], [5, 1.039], [6.3, 1.054], [8, 1.036], [10, 0.988], [12.5, 0.902], [16, 0.768], [20, 0.636], [25, 0.513], [31.5, 0.405]];
  let peor = 0, fp = 0; for (const [fr, v] of T) { const e = rel(pesoWk(fr), v); if (e > peor) { peor = e; fp = fr; } }
  prueba('Wk(f) coincide con la tabla de la norma en 14 frecuencias (≤ 1,5 %)', peor < 0.015, `peor ${f(peor * 100, 2)} % en ${fp} Hz`);
  let pd = 0;
  for (const fr of [0.8, 2, 5, 8, 12.5, 20, 40]) { const w = DOSPI * fr, fl = filtroWk(1000); let sS = 0, cS = 0, k = 0; const Nt = 8000, Nm = Math.round(Math.max(1, Math.floor(10 * fr)) / fr * 1000);
    for (let i = 0; i < Nt + Nm; i++) { const y = fl(Math.sin(w * i / 1000)); if (i >= Nt) { sS += y * Math.sin(w * i / 1000); cS += y * Math.cos(w * i / 1000); k++; } }
    pd = Math.max(pd, rel(2 * Math.hypot(sS, cS) / k, pesoWk(fr))); }
  prueba('el filtro digital (bilineal a 1 kHz) reproduce a Wk analítica hasta 40 Hz (≤ 1 %)', pd < 0.01, `peor ${f(pd * 100, 2)} %`);
  prueba('Wk pesa más cerca de 6 Hz (máximo ≈ 1,05) y poco por debajo de 1 Hz', pesoWk(6.3) > 1.04 && pesoWk(0.5) < 0.43);
}

console.log('4 · Camino ISO 8608 y métricas exactas');
{
  prueba('clases ISO 8608: G_d(n0) de A a E es 16, 64, 256, 1024, 4096 ·10⁻⁶ m³ (×4 por clase)', Object.values(CAMINOS).every((g, i, a) => i === 0 || Math.abs(g / a[i - 1] - 4) < 1e-9));
  const V = 80 / 3.6; prueba('densidad de velocidad del camino S_w = 4π²·G_d·n0²·V', rel(sw(CAMINOS.B, V), 4 * Math.PI ** 2 * 64e-6 * 0.01 * V) < 1e-14, `${sw(CAMINOS.B, V).toExponential(3)} (m/s)²/Hz`);
  const C = compsCamino(CAMINOS.B, { n: 96 }); let v = 0; for (let k = 0; k < C.n.length; k++) v += C.a[k] * C.a[k] / 2;
  const teo = CAMINOS.B * N0 * N0 * (1 / 0.03 - 1 / 8);
  prueba('varianza del camino sintetizado Σ a²/2 = ∫ G_d dn = G_d·n0²·(1/n1 − 1/n2)', rel(v, teo) < 0.01, `${(Math.sqrt(v) * 1000).toFixed(3)} mm frente a ${(Math.sqrt(teo) * 1000).toFixed(3)} mm`);
  const gen = generaCamino(C, 0.013, 1.7); let md = 0; for (let i = 0; i < 4000; i++) { md = Math.max(md, Math.abs(gen() - zCamino(C, 1.7 + i * 0.013))); }
  prueba('el generador por fasores = la suma directa de senos (4 000 muestras)', md < 1e-11, `${md.toExponential(1)} m`);
  prueba('un bache de coseno elevado: 0 fuera, h en el centro y continuidad', zBache({ s0: 5, l: 0.6, h: 0.04 }, 4) === 0 && Math.abs(zBache({ s0: 5, l: 0.6, h: 0.04 }, 5.3) - 0.04) < 1e-12 && zBache({ s0: 5, l: 0.6, h: 0.04 }, 5.6) < 1e-12);
  // resolvente independiente: ecuación de Lyapunov con ruido blanco en la velocidad del camino
  const Gd = CAMINOS.B, P = { ...P0, c: 1500 };
  // x = [d = zs−zu, e = zu−zr, vs, vu];  entrada w = ż_r (blanca; S_w una cara → S_w/2 en dos caras)
  const A = [[0, 0, 1, -1], [0, 0, 0, 1], [-P.ks / P.ms, 0, -P.c / P.ms, P.c / P.ms], [P.ks / P.mu, -P.kt / P.mu, P.c / P.mu, -P.c / P.mu]];
  const Bv = [0, -1, 0, 0], q = sw(Gd, V) / 2, n = 4, N = n * n;
  const M = Array.from({ length: N }, () => new Array(N + 1).fill(0));
  for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) { const r = i * n + j; for (let k = 0; k < n; k++) { M[r][k * n + j] += A[i][k]; M[r][i * n + k] += A[j][k]; } M[r][N] = -Bv[i] * Bv[j] * q; }
  for (let c = 0; c < N; c++) { let p = c; for (let r = c + 1; r < N; r++) if (Math.abs(M[r][c]) > Math.abs(M[p][c])) p = r; [M[c], M[p]] = [M[p], M[c]];
    for (let r = 0; r < N; r++) if (r !== c) { const k = M[r][c] / M[c][c]; for (let cc = c; cc <= N; cc++) M[r][cc] -= k * M[c][cc]; } }
  const X = M.map((row, i) => row[N] / row[i]), Xm = (i, j) => X[i * n + j];
  const varDef = Xm(0, 0), varTire = Xm(1, 1);
  const g = [-P.ks / P.ms, 0, -P.c / P.ms, P.c / P.ms]; let varA = 0; for (let i = 0; i < n; i++) for (let j = 0; j < n; j++) varA += g[i] * g[j] * Xm(i, j);
  const m = metricas(P, Gd, V);
  prueba('RMS de la aceleración de la carrocería: integral en frecuencia = Lyapunov (exacto)', rel(m.arms, Math.sqrt(varA)) < 2e-3, `${f(m.arms, 4)} frente a ${f(Math.sqrt(varA), 4)} m/s²`);
  prueba('RMS de la carga dinámica del neumático: integral en frecuencia (con cola) = Lyapunov', rel(m.ftrms, P.kt * Math.sqrt(varTire)) < 2e-3, `${f(m.ftrms, 1)} frente a ${f(P.kt * Math.sqrt(varTire), 1)} N`);
  prueba('RMS del recorrido de la suspensión: integral en frecuencia = Lyapunov', rel(m.def, Math.sqrt(varDef)) < 2e-3, `${f(m.def * 1000, 4)} frente a ${f(Math.sqrt(varDef) * 1000, 4)} mm`);
  prueba('0,4·a_rms < a_w < 1,06·a_rms (Wk está entre 0,4 y 1,06 en 0,5–30 Hz)', m.aw < 1.06 * m.arms && m.aw > 0.4 * m.arms, `a_w = ${f(m.aw, 3)}; a_rms = ${f(m.arms, 3)} m/s²`);
  const m2 = metricas(P, CAMINOS.B * 4, V), m3 = metricas(P, CAMINOS.B, 4 * V);
  prueba('el RMS de todas las salidas se duplica al cuadruplicar G_d (clase B → C) y al cuadruplicar V', rel(m2.aw / m.aw, 2) < 1e-9 && rel(m3.grip / m.grip, 2) < 1e-9 && rel(m3.def / m.def, 2) < 1e-9);
  const CC = compsCamino(CAMINOS.B, { n: 96 }), ln = metricasLineas(P, CC, V), si = simulaMetricas(P, CC, V, { T: 600 });
  prueba('simulación RK4 de 600 s = suma exacta de líneas espectrales (a_w, carga, recorrido ≤ 0,5 %; con 60 s el recorrido difiere 2 % por el registro finito)', rel(si.aw, ln.aw) < 0.005 && rel(si.grip, ln.grip) < 0.005 && rel(si.def, ln.def) < 0.005, `a_w ${f(si.aw, 4)}/${f(ln.aw, 4)} · σFz ${f(si.grip * 100, 3)}/${f(ln.grip * 100, 3)} % · recorrido ${f(si.def * 1000, 3)}/${f(ln.def * 1000, 3)} mm`);
  prueba('las líneas (96) reproducen la integral continua (≤ 3 %)', rel(ln.aw, m.aw) < 0.03 && rel(ln.grip, m.grip) < 0.03 && rel(ln.def, m.def) < 0.03, `a_w ${f(ln.aw, 4)}/${f(m.aw, 4)} · σFz ${f(ln.grip * 100, 3)}/${f(m.grip * 100, 3)} %`);
}

console.log('5 · Límites del amortiguador y compromiso confort–agarre');
{
  const V = 80 / 3.6, G_ = CAMINOS.B, M = (c) => metricas({ ...P0, c }, G_, V);
  const fino = (c) => metricas({ ...P0, c }, G_, V, { f1: 0.5, f2: 100, N: 400000 }), a1 = fino(2), a2 = fino(8);
  prueba('c → 0: a_w y a_rms crecen como 1/√c (el factor al bajar c ×4 es ≈ 2; malla de 400 000 puntos para resolver el pico)', Math.abs(a1.aw / a2.aw - 2) < 0.1 && Math.abs(a1.arms / a2.arms - 2) < 0.1, `${f(a1.aw / a2.aw, 3)} y ${f(a1.arms / a2.arms, 3)}`);
  let dec = true, prevD = 1e9; for (const c of [200, 500, 1500, 4000, 1e4, 1e5, 1e6]) { const d = M(c).def; if (!(d < prevD)) dec = false; prevD = d; }
  prueba('c ↑: el recorrido de la suspensión baja siempre (el límite puntual c → ∞ está en la sección 2)', dec);
  let mall = 0; for (const c of [200, 600, 1500, 6000]) { const a = metricas({ ...P0, c }, G_, V, F.MALLA_RAPIDA), b = metricas({ ...P0, c }, G_, V); mall = Math.max(mall, rel(a.aw, b.aw), rel(a.grip, b.grip), rel(a.def, b.def)); }
  prueba('la malla rápida de los barridos (500 puntos) = la fina (1 600) para c ≥ 200', mall < 1e-3, `${mall.toExponential(1)}`);
  let cA = 0, aMin = 1e9, cG = 0, gMin = 1e9; for (let c = 100; c <= 8000; c += 10) { const m = M(c); if (m.aw < aMin) { aMin = m.aw; cA = c; } if (m.grip < gMin) { gMin = m.grip; cG = c; } }
  prueba('el mínimo de a_w ocurre con MENOS amortiguación que el mínimo de la carga dinámica (compromiso)', cA < cG, `confort óptimo c = ${cA}, agarre óptimo c = ${cG} N·s/m`);
  const cm = M(cA);
  prueba('entre los dos mínimos el confort se paga con agarre (a_w sube y σFz baja al aumentar c)', M(cA + 400).aw > cm.aw && M(cA + 400).grip < cm.grip);
  prueba('por debajo del óptimo de confort ambos empeoran', M(cA * 0.4).aw > cm.aw && M(cA * 0.4).grip > cm.grip);
  const nominal = M(1500);
  prueba('orden de libro: a_w entre 0,3 y 1 m/s², σFz/F0 entre 8 y 20 % (camino B, 80 km/h, c = 1 500)', nominal.aw > 0.3 && nominal.aw < 1 && nominal.grip > 0.08 && nominal.grip < 0.2, `${f(nominal.aw, 3)} m/s² · ${f(nominal.grip * 100, 2)} %`);
  prueba('lectura de confort ISO 2631-1: <0,315 no incómodo … ≥2,5 extremadamente', bandaConfort(0.2) === 'no incómodo' && bandaConfort(0.5) === 'un poco incómodo' && bandaConfort(0.9) === 'algo incómodo' && bandaConfort(1.3) === 'incómodo' && bandaConfort(2) === 'muy incómodo' && bandaConfort(3) === 'extremadamente incómodo');
  const cs = []; for (let c = 100; c <= 6000; c += 25) cs.push(c);
  const w = ventanaC(P0, G_, V, nominal.aw * 1.03, nominal.grip * 1.03, cs);
  prueba('ventanaC encuentra una ventana de c que contiene al c = 1 500 que generó los umbrales', w && w.lo <= 1500 && w.hi >= 1500, w ? `${w.lo}–${w.hi} N·s/m (${w.n} valores)` : 'sin ventana');
  const w0 = ventanaC(P0, G_, V, nominal.aw * 0.8, nominal.grip * 0.8, cs); prueba('umbrales imposibles (−20 % en ambos) no tienen ventana', w0 === null);
}

console.log('6 · Energía en el tiempo y semiactivo skyhook');
{
  const dt = 0.001; let st = [0.02, -0.005, 0, 0]; const Pc = { ...P0, c: 0 };
  const En = (s, P) => 0.5 * P.ms * s[2] ** 2 + 0.5 * P.mu * s[3] ** 2 + 0.5 * P.ks * (s[0] - s[1]) ** 2 + 0.5 * P.kt * s[1] ** 2;
  const deriva = (h, T) => { let s = [0.02, -0.005, 0, 0]; const E0 = En(s, Pc); let dm = 0; for (let i = 0; i < Math.round(T / h); i++) { s = rk4Cuarto(s, 0, 0, 0, h, Pc, 'pasivo').st; dm = Math.max(dm, Math.abs(En(s, Pc) - E0) / E0); } return dm; };
  const d1 = deriva(0.001, 10), d2 = deriva(0.0005, 10);
  prueba('c = 0, camino plano: la energía mecánica se conserva en 10 s (deriva ∝ h⁵: el factor de amplificación del RK4 en un oscilador es 1 − (ωh)⁶/144, así que 1 ms → 0,5 ms la divide por ≈ 32)', d1 < 5e-5 && d1 / d2 > 26 && d1 / d2 < 38, `deriva ${d1.toExponential(2)} (h = 1 ms) y ${d2.toExponential(2)} (0,5 ms): cociente ${f(d1 / d2, 1)}`);
  const Pd = { ...P0, c: 1500 }; st = [0.02, -0.005, 0, 0]; const E1 = En(st, Pd); let disip = 0;
  for (let i = 0; i < 5000; i++) { const r = rk4Cuarto(st, 0, 0, 0, dt, Pd, 'pasivo'); const v0 = st[2] - st[3], v1 = r.st[2] - r.st[3]; disip += Pd.c * (v0 * v0 + v1 * v1) / 2 * dt; st = r.st; }
  prueba('con c = 1 500: la energía perdida = ∫ c·(ż_s − ż_u)² dt (trapecio)', rel(E1 - En(st, Pd), disip) < 2e-3, `${f(E1 - En(st, Pd), 5)} J frente a ${f(disip, 5)} J`);
  const ref = (() => { let s = [0.02, -0.005, 0, 0]; for (let i = 0; i < 4000; i++) s = rk4Cuarto(s, 0, 0, 0, 0.00025, Pd, 'pasivo').st; return s; })();
  const err = (h) => { let s = [0.02, -0.005, 0, 0]; const n = Math.round(1 / h); for (let i = 0; i < n; i++) s = rk4Cuarto(s, 0, 0, 0, h, Pd, 'pasivo').st; return Math.hypot(s[0] - ref[0], s[1] - ref[1], s[2] - ref[2], s[3] - ref[3]); };
  const e1 = err(0.01), e2 = err(0.005);
  prueba('RK4: al reducir h a la mitad el error cae ≈ 16 veces', e1 / e2 > 12 && e1 / e2 < 20, `cociente ${f(e1 / e2, 1)}`);
  let dentro = true, sky = 0, sub = 0; const rnd = F.semilla(3);
  for (let i = 0; i < 20000; i++) { const s = [0, 0, (rnd() - 0.5) * 2, (rnd() - 0.5) * 2], c = cEfectiva('sky', P0, s); if (c < CSA.cmin - 1e-9 || c > CSA.cmax + 1e-9) dentro = false; if (s[2] * (s[2] - s[3]) > 0) { sky++; if (c > CSA.cmin) sub++; } else if (c !== CSA.cmin) dentro = false; }
  prueba('skyhook: c queda entre c_min y c_max; sube sólo cuando ż_s·(ż_s − ż_u) > 0 y si no se queda en c_min', dentro && sub > 0 && sub <= sky);
  const cc = cEfectiva('sky', P0, [0, 0, 0.5, 0.1]);
  prueba('skyhook: la fuerza pedida c·(ż_s − ż_u) = C_sky·ż_s mientras no se sature', cc === CSA.cmax || cc === CSA.cmin || Math.abs(cc * 0.4 - CSA.csky * 0.5) < 1e-9, `c = ${f(cc, 1)}`);
  const V = 80 / 3.6, C = compsCamino(CAMINOS.B, { n: 96 }), ske = simulaMetricas({ ...P0, c: 1000 }, C, V, { T: 40, modo: 'sky' });
  const exacto = (c) => metricas({ ...P0, c }, CAMINOS.B, V);
  let cI = 100; for (let c = 100; c < 8000; c += 5) if (exacto(c).grip <= ske.grip * 1.0) { cI = c; break; }
  prueba('skyhook a igual agarre da MEJOR confort que el pasivo exacto (la frontera se desplaza)', ske.aw < exacto(cI).aw, `semiactivo a_w ${f(ske.aw, 3)} con σFz ${f(ske.grip * 100, 2)} % frente al pasivo (c = ${cI}) ${f(exacto(cI).aw, 3)} m/s²`);
  prueba('skyhook conmuta: c cambia en el tiempo y su media queda dentro del rango', ske.cambios > 1000 && ske.cMedia > CSA.cmin && ske.cMedia < CSA.cmax, `media ${f(ske.cMedia, 0)} N·s/m`);
}
console.log(`\n${ok} pruebas ✓, ${mal} ✗`);
process.exit(mal ? 1 : 0);
