// Verificación de la física del lab carga-inalambrica-resonante: extrae el bloque FISICA
// del HTML publicado TAL CUAL y lo prueba contra cálculos independientes.
// uso: node verifica.mjs [ruta del html o del bloque]
import { readFileSync } from 'node:fs';
const RUTA = process.argv[2] || 'C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public/labs/carga-inalambrica-resonante.html';
const src = readFileSync(RUTA, 'utf8');
const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
const F = new Function(src.slice(i0, i1) + '\nreturn {MU0,DOSPI,BANDA,PAD,OPER,ZPAD,elipticas,mutuaCoaxial,autoLazo,radiosPad,RAD,inductanciaPad,mutuaPadCoaxial,mutuaNeumann,mutuaPad,L_PAD,kAcople,LONG_PAD,resistenciaPad,cx,FALLAS,banco,respuesta,operacion,pliego,cumple,etaOptima,RLoptima,etaSintonizada,kCritico,kDivision,kDivisionExacta,barridoFrecuencia,picosFrecuencia,campoLazo,campoPad,ESCENARIOS,N_NEU,cargaDePack,tablaM,curvaDesalineacion};')();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
const e = (x) => (+x).toExponential(1);
const { MU0, DOSPI, cx } = F;

console.log('1 · Integrales elípticas por AGM');
{ const t = [[0.5, 1.8540746773013719, 1.3506438810476755], [0.8, 2.2572053268208538, 1.1784899243278385], [0.1, 1.6124413487202192, 1.5307576368977632], [0.9, 2.5780921133481733, 1.1047747327040733]];
  for (const [m, K, E] of t) { const r = F.elipticas(m); prueba(`K(${m}) y E(${m}) contra las tablas de Abramowitz–Stegun`, rel(r.K, K) < 1e-12 && rel(r.E, E) < 1e-12, `K ${r.K.toFixed(10)} · E ${r.E.toFixed(10)}`); }
  const z0 = F.elipticas(0); prueba('K(0) = E(0) = π/2', rel(z0.K, Math.PI / 2) < 1e-15 && rel(z0.E, Math.PI / 2) < 1e-15);
  let maxL = 0; for (const m of [0.05, 0.3, 0.55, 0.77, 0.95, 0.999]) { const a = F.elipticas(m), b = F.elipticas(1 - m); maxL = Math.max(maxL, Math.abs(a.E * b.K + b.E * a.K - a.K * b.K - Math.PI / 2)); }
  prueba('relación de Legendre E·K′ + E′·K − K·K′ = π/2', maxL < 1e-12, 'error máx ' + e(maxL)); }

console.log('2 · Inductancia mutua de dos lazos coaxiales (filamentos)');
{ // referencia independiente: doble integral de Neumann con muchos nodos
  let maxE = 0; for (const [a, b, z] of [[0.1, 0.1, 0.1], [0.2, 0.05, 0.12], [0.25, 0.08, 0.3], [0.15, 0.15, 0.02]]) {
    const A = F.mutuaCoaxial(a, b, z), B = F.mutuaNeumann(a, b, z, 0, 400); maxE = Math.max(maxE, rel(A, B)); }
  prueba('cerrada (AGM) = doble integral de Neumann de 400×400 nodos', maxE < 1e-9, 'error relativo máx ' + e(maxE));
  // límite dipolar: lazos pequeños muy separados
  const a = 0.05, b = 0.04, z = 5; const dip = MU0 * Math.PI * a * a * b * b / (2 * Math.pow(z * z, 1.5));
  prueba('límite dipolar M → μ0·π·a²·b² / (2z³) a z = 100·a', rel(F.mutuaCoaxial(a, b, z), dip) < 1e-3, 'M ' + e(F.mutuaCoaxial(a, b, z)) + ' H · dipolo ' + e(dip) + ' H');
  // lazo pequeño: M = π b² · Bz(eje) (campo de Biot–Savart del lazo grande en el eje)
  const A = 0.2, bb = 1e-4, zz = 0.15, Bz = MU0 * A * A / (2 * Math.pow(A * A + zz * zz, 1.5));
  prueba('lazo diminuto: M = π·b²·B_eje(z)', rel(F.mutuaCoaxial(A, bb, zz), Math.PI * bb * bb * Bz) < 1e-7);
  prueba('reciprocidad M(a,b) = M(b,a)', F.mutuaCoaxial(0.12, 0.2, 0.1) === F.mutuaCoaxial(0.2, 0.12, 0.1) || rel(F.mutuaCoaxial(0.12, 0.2, 0.1), F.mutuaCoaxial(0.2, 0.12, 0.1)) < 1e-14);
  // valor de libro: dos círculos iguales de radio a separados a: M/(μ0·a) = (2/k − k)K − 2E/k con k² = 4/5 (a=z=1)
  const k = Math.sqrt(0.8), K = 2.2572053268208538, E = 1.1784899243278385, libro = (2 / k - k) * K - 2 * E / k;
  prueba('círculos iguales a = z: M/(μ0·a) = (2/k − k)·K − 2E/k con k² = 0,8 (K, E de tablas)', rel(F.mutuaCoaxial(1, 1, 1) / MU0, libro) < 1e-12, 'M/(μ0·a) = ' + f(libro, 6)); }

console.log('3 · Desalineación: integral de Neumann');
{ const a = 0.15, b = 0.09, z = 0.18; let maxC = 0, maxS = 0, maxR = 0;
  for (const d of [0.02, 0.07, 0.15, 0.3]) {
    const A = F.mutuaNeumann(a, b, z, d, 36), B = F.mutuaNeumann(a, b, z, d, 128); maxC = Math.max(maxC, rel(A, B));
    maxS = Math.max(maxS, rel(F.mutuaNeumann(a, b, z, d, 36), F.mutuaNeumann(a, b, z, -d, 36)));
    maxR = Math.max(maxR, rel(F.mutuaNeumann(a, b, z, d, 64), F.mutuaNeumann(b, a, z, d, 64))); }
  prueba('la regla del trapecio de 36×36 nodos converge (frente a 128×128)', maxC < 1e-9, 'error relativo máx ' + e(maxC));
  prueba('simetría M(d) = M(−d)', maxS < 1e-12, e(maxS));
  prueba('reciprocidad M12(d) = M21(d)', maxR < 1e-9, e(maxR));
  prueba('con d = 0 la integral de Neumann coincide con la forma cerrada', rel(F.mutuaNeumann(a, b, z, 0), F.mutuaCoaxial(a, b, z)) < 1e-9);
  // lazo diminuto desplazado: M = π·b²·B_z del lazo grande en el punto (ρ = d, z) — comprueba a la vez Neumann y el campo
  let maxD = 0; for (const d of [0.03, 0.1, 0.2]) { const bz = F.campoLazo(0.15, d, 0.18, 0)[1]; maxD = Math.max(maxD, rel(F.mutuaNeumann(0.15, 1e-4, 0.18, d, 36), Math.PI * 1e-8 * bz)); }
  prueba('lazo diminuto desplazado: M = π·b²·B_z(ρ = d, z) (Neumann contra campo elíptico)', maxD < 1e-6, 'error relativo máx ' + e(maxD));
  let mono = true, prev = F.mutuaPad(0.19, 0); for (let d = 0.01; d <= 0.3; d += 0.01) { const m = F.mutuaPad(0.19, d); if (!(m < prev + 1e-15)) mono = false; prev = m; }
  prueba('M de las pads decrece al alejar los ejes (0 → 300 mm)', mono);
  let monoZ = true, pz = F.mutuaPad(0.14, 0.05); for (let z = 0.15; z <= 0.3; z += 0.01) { const m = F.mutuaPad(z, 0.05); if (!(m < pz)) monoZ = false; pz = m; }
  prueba('M decrece al subir el vehículo (holgura)', monoZ); }

console.log('4 · El campo del lazo (Biot–Savart con integrales elípticas)');
{ const A = 0.17; let maxAx = 0; for (const z of [0.02, 0.1, 0.3]) maxAx = Math.max(maxAx, rel(F.campoLazo(A, 0, z, 0)[1], MU0 * A * A / (2 * Math.pow(A * A + z * z, 1.5))));
  prueba('sobre el eje: B_z = μ0·a² / (2(a²+z²)^(3/2))', maxAx < 1e-12, e(maxAx));
  // referencia independiente: integración directa de Biot–Savart a lo largo del lazo (4000 segmentos)
  const biot = (a, rho, z) => { let bx = 0, bz = 0; const n = 4000; for (let i = 0; i < n; i++) { const t = DOSPI * (i + 0.5) / n, px = a * Math.cos(t), py = a * Math.sin(t);
      const dlx = -a * Math.sin(t) * DOSPI / n, dly = a * Math.cos(t) * DOSPI / n; const rx = rho - px, ry = -py, rz = z, R3 = Math.pow(rx * rx + ry * ry + rz * rz, 1.5);
      bx += MU0 / (4 * Math.PI) * (dly * rz) / R3; bz += MU0 / (4 * Math.PI) * (dlx * ry - dly * rx) / R3; } return [bx, bz]; };
  let maxB = 0; for (const [rho, z] of [[0.05, 0.1], [0.12, 0.2], [0.3, 0.05], [0.1, -0.15], [0.25, 0.3]]) { const r = F.campoLazo(A, rho, z, 0), b = biot(A, rho, z); maxB = Math.max(maxB, Math.hypot(r[0] - b[0], r[1] - b[1]) / Math.hypot(b[0], b[1])); }
  prueba('fuera del eje: fórmula elíptica = integración directa de Biot–Savart (4000 segmentos)', maxB < 1e-6, 'error relativo máx ' + e(maxB));
  // ∇·B = 0 y ∇×B = 0 en el aire
  let maxDiv = 0, maxRot = 0; const h = 1e-5;
  for (const [rho, z] of [[0.05, 0.1], [0.12, 0.2], [0.3, 0.05], [0.22, 0.15]]) {
    const Br = (r, zz) => F.campoLazo(A, r, zz, 0)[0], Bz = (r, zz) => F.campoLazo(A, r, zz, 0)[1], mod = Math.hypot(Br(rho, z), Bz(rho, z));
    const div = ((rho + h) * Br(rho + h, z) - (rho - h) * Br(rho - h, z)) / (2 * h) / rho + (Bz(rho, z + h) - Bz(rho, z - h)) / (2 * h);
    const rot = (Br(rho, z + h) - Br(rho, z - h)) / (2 * h) - (Bz(rho + h, z) - Bz(rho - h, z)) / (2 * h);
    maxDiv = Math.max(maxDiv, Math.abs(div) * rho / mod); maxRot = Math.max(maxRot, Math.abs(rot) * rho / mod); }
  prueba('divergencia nula (flujo cerrado)', maxDiv < 1e-5, e(maxDiv));
  prueba('rotacional nulo fuera del hilo', maxRot < 1e-5, e(maxRot));
  // flujo a través de un disco coaxial = M·I (el campo y la inductancia mutua cuentan lo mismo)
  const b = 0.1, z = 0.15, n = 4000; let fl = 0; for (let i = 0; i < n; i++) { const r = b * (i + 0.5) / n; fl += F.campoLazo(A, r, z, 0)[1] * DOSPI * r * (b / n); }
  prueba('flujo de B por el disco de otro lazo = M (campo contra inductancia)', rel(fl, F.mutuaCoaxial(A, b, z)) < 1e-6, 'Φ ' + e(fl) + ' Wb · M ' + e(F.mutuaCoaxial(A, b, z)) + ' H');
  const bpad = F.campoPad(0, 0.1, 0, 0); prueba('el campo de una pad en el eje es la suma de sus espiras', rel(bpad[1], F.RAD.reduce((s, a) => s + MU0 * a * a / (2 * Math.pow(a * a + 0.01, 1.5)), 0)) < 1e-3 && Math.abs(bpad[0]) < 1e-12); }

console.log('5 · Las pads: L, R, Q');
{ const L = F.L_PAD, w = DOSPI * F.BANDA.f0;
  prueba('L de la pad (Σ L_ii + Σ M_ij) con M_ij de Neumann a z → 0 coincide con la forma cerrada', (() => { let m = 0; for (let i = 0; i < F.RAD.length; i++) for (let j = 0; j < F.RAD.length; j++) if (i !== j) m = Math.max(m, rel(F.mutuaNeumann(F.RAD[i], F.RAD[j], 0, 0, 512), F.mutuaCoaxial(F.RAD[i], F.RAD[j], 0))); return m < 1e-6; })());
  prueba('L de la pad en el rango de las pads de 11 kW (60–150 µH)', L > 60e-6 && L < 150e-6, f(L * 1e6, 1) + ' µH');
  const r = F.resistenciaPad(); const Q = w * L / r.R;
  prueba('Q de la pad (Litz + ferrita + blindaje) entre 80 y 250', Q > 80 && Q < 250, 'R = ' + f(r.R, 3) + ' Ω · Q = ' + f(Q, 0));
  prueba('longitud del hilo = 2π·Σ r_i', rel(F.LONG_PAD, DOSPI * F.RAD.reduce((s, x) => s + x, 0)) < 1e-15, f(F.LONG_PAD, 2) + ' m');
  const C = 1 / (w * w * L); prueba('C de compensación: ω0 = 1/√(LC) = 2π·85 kHz', rel(1 / Math.sqrt(L * C), w) < 1e-14, f(C * 1e9, 1) + ' nF'); }

console.log('6 · El circuito serie–serie');
{ const RL = 11.8; const B = F.banco({ z: 0.19, d: 0.04, trim: 0, eps: 0, RL });
  // sintonizado: Zin real y la corriente del secundario retrasada 90°
  const r = F.respuesta(B);
  prueba('sintonizado: Z_in es real pura (reactancias anuladas)', Math.abs(r.Zin[1]) < 1e-9 * Math.abs(r.Zin[0]), 'Z_in = ' + f(r.Zin[0], 3) + ' Ω');
  const dfi = ((cx.arg(r.I2) - cx.arg(r.I1)) * 180 / Math.PI); prueba('I2 retrasa 90° a I1', Math.abs(dfi + 90) < 1e-9, f(dfi, 6) + '°');
  prueba('η del circuito = η de la forma cerrada ω²M²R_L / ((R2+R_L)(R1(R2+R_L)+ω²M²))', rel(r.eta, F.etaSintonizada(r.wM, B.R1, B.R2, RL)) < 1e-12, 'η = ' + f(r.eta * 100, 4) + ' %');
  // carga óptima
  const Q1 = B.w * B.L1 / B.R1, Q2 = B.w * B.L2 / B.R2; let mejor = 0, rlm = 0; for (let x = 0.2; x < 60; x += 0.001) { const eta = F.respuesta({ ...B, RL: x }).eta; if (eta > mejor) { mejor = eta; rlm = x; } }
  prueba('η máx = k²Q1Q2 / (1 + √(1 + k²Q1Q2))² (barrido de R_L)', rel(mejor, F.etaOptima(B.k, Q1, Q2)) < 1e-7, 'barrido ' + f(mejor * 100, 5) + ' % · fórmula ' + f(F.etaOptima(B.k, Q1, Q2) * 100, 5) + ' %');
  prueba('y la carga óptima R_L = R2·√(1 + k²Q1Q2)', rel(rlm, F.RLoptima(B.k, Q1, Q2, B.R2)) < 2e-3, 'barrido ' + f(rlm, 3) + ' Ω · fórmula ' + f(F.RLoptima(B.k, Q1, Q2, B.R2), 3) + ' Ω');
  // balance y Kirchhoff, también desintonizado y fuera de resonancia
  let maxBal = 0, maxK1 = 0, maxK2 = 0;
  for (const s of [{ z: 0.19, d: 0, trim: 0, eps: 0.1, RL: 11.8 }, { z: 0.15, d: 0.1, trim: -0.05, eps: -0.07, RL: 15 }, { z: 0.17, d: 0.05, trim: 0, eps: 0, RL: 9, f: 80000 }, { z: 0.17, d: 0.05, trim: 0, eps: 0, RL: 9, falla: 'fod' }]) {
    const Bs = F.banco(s), op = F.operacion(Bs), w = Bs.w;
    const X1 = w * Bs.L1 - 1 / (w * Bs.C1), X2 = w * Bs.L2 - 1 / (w * Bs.C2), wM = w * Bs.M;
    const I1 = op.I1, I2 = op.I2, V1 = [op.V1, 0];
    const k1 = cx.abs([V1[0] - (Bs.R1 * I1[0] - X1 * I1[1]) + wM * I2[1], V1[1] - (Bs.R1 * I1[1] + X1 * I1[0]) - wM * I2[0]]);
    const k2 = cx.abs([((Bs.R2 + Bs.RL) * I2[0] - X2 * I2[1]) + -wM * I1[1], ((Bs.R2 + Bs.RL) * I2[1] + X2 * I2[0]) + wM * I1[0]]);
    maxK1 = Math.max(maxK1, k1 / op.V1); maxK2 = Math.max(maxK2, k2 / (wM * op.aI1));
    const Pent = op.V1 * I1[0], Psal = cx.abs(I1) ** 2 * Bs.R1 + cx.abs(I2) ** 2 * (Bs.R2 + Bs.RL) + 0 * Bs.Rf;
    maxBal = Math.max(maxBal, rel(Pent, Psal)); }
  prueba('las dos ecuaciones de malla se cumplen (V1 = Z1·I1 + jωM·I2 · 0 = Z2·I2 + jωM·I1)', maxK1 < 1e-12 && maxK2 < 1e-12, e(maxK1) + ' · ' + e(maxK2));
  prueba('balance de potencia Re(V1·I1*) = |I1|²R1 + |I2|²(R2+R_L)', maxBal < 1e-12, 'error relativo máx ' + e(maxBal));
  const op = F.operacion(B); prueba('P_in = P_L + pérdidas del primario + pérdidas del secundario', rel(op.Pin, op.P + op.P1 + op.P2) < 1e-12);
  prueba('potencia entregada = 11 kW cuando los límites lo permiten', Math.abs(op.P - 11000) < 1e-6 && op.llega, f(op.P, 3) + ' W'); }

console.log('7 · División de frecuencia');
{ const RL = 11.8, B0 = F.banco({ z: 0.17, d: 0, trim: 0, eps: 0, RL }), Q1 = B0.w * B0.L1 / B0.R1, Q2c = B0.w * B0.L2 / (B0.R2 + RL), kc = F.kCritico(Q1, Q2c), kd = F.kkd = F.kDivision(B0);
  const pk = F.picosFrecuencia(B0); prueba('con k = ' + f(B0.k, 3) + ' > k_d = ' + f(kd, 3) + ' la potencia a V1 constante tiene DOS picos', pk.length === 2, pk.map((p) => f(p.f / 1000, 2) + ' kHz').join(' · '));
  // el acoplamiento crítico k_c = 1/√(Q1·Q2c) es el que maximiza la potencia EXACTAMENTE a f0
  let mejorK = 0, mejorP = -1; for (let k = 0.002; k < 0.4; k += 0.0002) { const M = k * B0.L1; const r = F.respuesta({ ...B0, M }, F.BANDA.f0); if (r.PL > mejorP) { mejorP = r.PL; mejorK = k; } }
  prueba('el acoplamiento crítico k_c = 1/√(Q1·Q2c) maximiza la potencia a f0 (barrido de k)', Math.abs(mejorK - kc) / kc < 3e-3, 'barrido ' + f(mejorK, 4) + ' · k_c ' + f(kc, 4));
  // el umbral de división: número de picos a uno y otro lado de k_d
  const picosA = (k) => F.picosFrecuencia({ ...B0, M: k * B0.L1 }).length; let kcorte = 0; for (let k = 0.05; k < 0.4; k += 0.0005) if (picosA(k) === 2) { kcorte = k; break; }
  const kx = F.kDivisionExacta(B0);
  prueba('el umbral exacto de división (bisección sobre el número de picos) coincide con el barrido fino', Math.abs(kcorte - kx) / kx < 0.02 && picosA(kx * 0.97) === 1 && picosA(kx * 1.03) === 2, 'barrido ' + f(kcorte, 4) + ' · bisección ' + f(kx, 4));
  prueba('y la fórmula de banda estrecha √((R1² + R2c²)/2)/ωL lo aproxima dentro del 12 %', Math.abs(kd - kx) / kx < 0.12, 'fórmula ' + f(kd, 4) + ' · exacto ' + f(kx, 4));
  // resistencias casi nulas: los picos caen en f0/√(1±k) y 1/f_a² + 1/f_b² = 2/f0² (simetría exacta)
  const Bw = { ...F.banco({ z: 0.17, d: 0, trim: 0, eps: 0, RL: 1e-3 }), R1: 1e-6, R2: 1e-6, RL: 1e-3 };
  const ps = F.picosFrecuencia(Bw, 55000, 140000, 6000); const k = Bw.k, f0 = F.BANDA.f0;
  prueba('picos en f0/√(1+k) y f0/√(1−k) (pérdidas → 0)', ps.length === 2 && rel(ps[0].f, f0 / Math.sqrt(1 + k)) < 2e-4 && rel(ps[1].f, f0 / Math.sqrt(1 - k)) < 2e-4, ps.map((p) => f(p.f, 1)).join(' · ') + ' Hz · teoría ' + f(f0 / Math.sqrt(1 + k), 1) + ' · ' + f(f0 / Math.sqrt(1 - k), 1));
  if (ps.length === 2) { const s = (1 / (ps[0].f * ps[0].f) + 1 / (ps[1].f * ps[1].f)) * f0 * f0 / 2; prueba('simetría exacta: ½·f0²·(1/f_a² + 1/f_b²) = 1', Math.abs(s - 1) < 2e-4, 'valor ' + f(s, 6)); }
  const ancho = (ps[1].f - ps[0].f) / f0, exacto = 1 / Math.sqrt(1 - k) - 1 / Math.sqrt(1 + k); prueba('separación relativa (f_b − f_a)/f0 = 1/√(1−k) − 1/√(1+k) ≈ k', rel(ancho, exacto) < 1e-3 && Math.abs(ancho - k) / k < 0.05, f(ancho, 4) + ' · fórmula ' + f(exacto, 4) + ' · k = ' + f(k, 4));
  // acoplamiento débil: un solo pico, en f0
  const Bd = F.banco({ z: 0.30, d: 0.30, trim: 0, eps: 0, RL }), pd = F.picosFrecuencia(Bd);
  prueba('acoplamiento débil (k = ' + f(Bd.k, 4) + ' < k_d = ' + f(F.kDivision(Bd), 3) + '): un solo pico, en f0', pd.length === 1 && Math.abs(pd[0].f - f0) / f0 < 2e-3, pd.map((p) => f(p.f / 1000, 3) + ' kHz').join(' · ')); }

console.log('8 · El pliego del reto en todos los escenarios');
{ const esc = F.ESCENARIOS; let nBien = 0, nMal = 0, minV = 1e9, ventanas = [];
  for (const s of esc) { const RL = F.OPER.Rac * s.Vpack * s.Vpack / F.OPER.P, z = s.g + F.ZPAD;
    for (const eps of s.epsOpciones) {
      const trimOpt = -eps / (1 + eps);
      const B = F.banco({ z, d: 0, trim: trimOpt, eps, RL }), pl = F.pliego(B); if (pl.every((c) => c.ok)) nBien++; else { nMal++; console.log('    sin solución: g', s.g, 'V', s.Vpack, 'ε', eps, pl.filter((c) => !c.ok).map((c) => c.id)); }
      // la ventana de desalineación con la sintonía perfecta, y el arranque (d0, trim 0) NO cumple
      let dm = -1; for (let d = 0; d <= 0.25001; d += 0.005) { if (F.cumple(F.banco({ z, d, trim: trimOpt, eps, RL }))) dm = d; else break; } ventanas.push(dm);
      for (const d0 of s.d0Opciones) { if (F.cumple(F.banco({ z, d: d0, trim: 0, eps, RL }))) { nMal++; console.log('    el arranque ya cumple:', s.g, s.Vpack, eps, d0); } else nBien++; }
      const Bs = F.banco({ z, d: 0, trim: 0, eps, RL }); const mal = F.pliego(Bs); minV = Math.min(minV, mal.filter((c) => !c.ok).length); } }
  prueba('todo escenario tiene solución (d = 0 y la sintonía perfecta cumplen el pliego) y el arranque no la tiene', nMal === 0, nBien + ' comprobaciones · ventana de desalineación de ' + Math.min(...ventanas) * 1000 + ' a ' + Math.max(...ventanas) * 1000 + ' mm'); }

console.log('9 · Las fallas del diagnóstico');
{ const s = { z: 0.17, d: 0.02, trim: 0, eps: 0, RL: 11.8 }, B0 = F.banco(s), o0 = F.operacion(B0);
  const Bf = F.banco({ ...s, falla: 'fod' }), of = F.operacion(Bf); prueba('objeto metálico: baja η (más de 6 puntos) y casi no mueve el factor de potencia', o0.eta - of.eta > 0.06 && Math.abs(o0.pf - of.pf) < 0.02, 'η ' + f(o0.eta * 100, 1) + ' → ' + f(of.eta * 100, 1) + ' % · calor en el objeto ' + f(of.Pf, 0) + ' W');
  const Bc = F.banco({ ...s, falla: 'c1' }), oc = F.operacion(Bc); prueba('C1 degradado: el factor de potencia cae por debajo de 0,8 y η casi no cambia', oc.pf < 0.8 && Math.abs(o0.eta - oc.eta) < 0.01, 'cos φ ' + f(o0.pf, 3) + ' → ' + f(oc.pf, 3) + ' · V1 ' + f(o0.V1, 0) + ' → ' + f(oc.V1, 0) + ' V');
  const Bq = F.banco({ ...s, falla: 'freq' }), oq = F.operacion(Bq); prueba('frecuencia fuera de banda (96 kHz): factor de potencia bajo y fuera de 81,38–90 kHz', oq.pf < 0.9 && Bq.f > F.BANDA.fMax, 'f ' + f(Bq.f / 1000, 1) + ' kHz · cos φ ' + f(oq.pf, 3));
  prueba('las tres fallas son distinguibles por (η, cos φ)', (of.eta < o0.eta - 0.06 && of.pf > 0.97) && (oc.pf < 0.8 && oc.eta > o0.eta - 0.01) && (oq.pf < 0.9)); }

console.log('9b · La curva de η frente a la desalineación');
{ const s = { z: 0.19, trim: 0, eps: 0, RL: 11.8 }, T = F.tablaM(0.19), C = F.curvaDesalineacion(s, T);
  let maxD = 0; for (const i of [0, 7, 20, 41, 50]) { const B = F.banco({ ...s, d: T.d[i] }), op = F.operacion(B); maxD = Math.max(maxD, Math.abs(op.eta - C[i].eta), Math.abs(op.Pmax - C[i].Pmax) / op.Pmax); }
  prueba('la curva de la tabla coincide con el cálculo directo punto a punto', maxD < 1e-12, e(maxD));
  prueba('η decrece al desalinear', C.every((c, i) => i === 0 || c.eta <= C[i - 1].eta + 1e-12));
  prueba('la tabla de M tiene 51 puntos de 0 a 250 mm', T.d.length === 51 && Math.abs(T.d[50] - 0.25) < 1e-12); }

console.log('10 · Coste de cálculo');
{ let t = performance.now(); for (let i = 0; i < 20; i++) F.mutuaPad(0.19, 0.03 + i * 0.005); const ms = (performance.now() - t) / 20;
  prueba('M(z, d) de las pads con 18×18 espiras en < 8 ms', ms < 8, f(ms, 2) + ' ms por evaluación'); }

console.log('\n' + ok + ' pruebas en verde, ' + mal + ' fallidas');
process.exit(mal ? 1 : 0);
