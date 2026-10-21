// Verificación de la física del lab frenos-disco-fade-termico: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-frenos-disco-fade-termico.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, G, SIGMA, VEH, DISCO, EFUS, GAMMA, disco, hConv, PAD, fMu, muRel, muPad, fade, cargasEje, fracIdeal, puntoIdeal, betaIdeal, zBloqueo, zCruce, equilibrio, calentamientoExacto, serie, muestrea, B_MIN, B_MAX, D_MIN, D_MAX, evaluaReto, ventanaReto, generaReto, generaDx } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
let semilla = 12345; const rnd = () => (semilla = semilla * 48271 % 2147483647) / 2147483647;
const W = VEH.m * G;

console.log('1 · Cargas por eje y reparto ideal');
{
  let maxS = 0, maxT = 0, maxF = 0, maxR = 0;
  for (let i = 0; i < 2000; i++) {
    const z = rnd() * 1.2, c = cargasEje(z), p = puntoIdeal(z);
    maxS = Math.max(maxS, Math.abs(c.Nf + c.Nr - W) / W);
    maxT = Math.max(maxT, Math.abs((c.Nf - W * VEH.b / VEH.L) - W * z * VEH.h / VEH.L) / W);
    maxF = Math.max(maxF, Math.abs(p.ff + p.fr - z));
    maxR = Math.max(maxR, Math.abs(p.ff / p.fr - c.Nf / c.Nr) / (c.Nf / c.Nr));      // ideal: F_f/F_r = N_f/N_r (los dos ejes con el mismo μ)
  }
  prueba('N_f + N_r = m·g en 2 000 deceleraciones', maxS < 1e-14, `error ${maxS.toExponential(1)}`);
  prueba('transferencia de carga ΔN = m·g·z·h/L', maxT < 1e-14, `error ${maxT.toExponential(1)}`);
  prueba('el punto ideal reparte F_f + F_r = z (en unidades de m·g)', maxF < 1e-14);
  prueba('reparto ideal: F_f/F_r = N_f/N_r (los dos ejes agotan su adherencia a la vez)', maxR < 1e-13, `error ${maxR.toExponential(1)}`);
  const c0 = cargasEje(0);
  prueba('parado: N_f = m·g·b/L = 55,6 % del peso (b = 1,50 m, L = 2,70 m)', Math.abs(c0.Nf / W - 1.5 / 2.7) < 1e-14, `${f(c0.Nf / W * 100, 2)} %`);
  const c1 = cargasEje(0.8);
  prueba('a 0,8 g el delantero lleva (b + 0,8·h)/L = 71,9 % del peso', Math.abs(c1.Nf / W - (1.5 + 0.44) / 2.7) < 1e-14, `${f(c1.Nf / W * 100, 2)} %`);
}

console.log('2 · Bloqueo con reparto fijo y β ideal');
{
  let maxI = 0, mal2 = 0, n = 0, maxZ = 0;
  for (let i = 0; i < 3000; i++) {
    const mu = 0.2 + rnd() * 0.8, beta = 0.45 + rnd() * 0.5, zb = zBloqueo(beta, mu);
    // barrido numérico del pedal: primer z_ped en que algún eje queda limitado
    let lo = 0, hi = 2.5;
    for (let it = 0; it < 60; it++) { const m = (lo + hi) / 2, e = equilibrio(m, beta, 1, 1, mu, 0, true); if (e.limF || e.limR) hi = m; else lo = m; }
    maxZ = Math.max(maxZ, Math.abs(hi - zb.z));
    const e = equilibrio(hi + 1e-6, beta, 1, 1, mu, 0, true);
    const delPrim = e.limF && !e.limR, trasPrim = e.limR && !e.limF;
    if (Math.abs(zb.zf - zb.zr) > 1e-4) { n++; if (!((zb.primero === 'delantero' && delPrim) || (zb.primero === 'trasero' && trasPrim))) mal2++; }
    const bi = betaIdeal(mu), zi = zBloqueo(bi, mu); maxI = Math.max(maxI, Math.abs(zi.zf - zi.zr), Math.abs(zi.z - mu));
  }
  prueba('el barrido numérico del pedal bloquea justo en min(z_f, z_r) = min(μ·b/(Lβ − μh), μ·a/(L(1−β) + μh))', maxZ < 1e-9, `error ${maxZ.toExponential(1)} g en 3 000 casos`);
  prueba('el eje que bloquea primero es el que dice la fórmula', mal2 === 0, `${n} casos, ${mal2} fallos`);
  prueba('con β = β* = (b + μ·h)/L los dos ejes bloquean a la vez y z = μ', maxI < 1e-12, `error ${maxI.toExponential(1)}`);
  let bien = 0, tot = 0; for (let i = 0; i < 1000; i++) { const mu = 0.3 + rnd() * 0.65, beta = 0.45 + rnd() * 0.5; const zb = zBloqueo(beta, mu); if (Math.abs(zb.zf - zb.zr) < 1e-6) continue; tot++; if ((zb.primero === 'trasero') === (beta < betaIdeal(mu))) bien++; }
  prueba('el trasero bloquea primero si y sólo si β < β*(μ)', bien === tot, `${tot} casos`);
  const zc = zCruce(0.70);
  prueba('cruce de la línea real con la ideal: z* = (β·L − b)/h = 0,709 g para β = 0,70', Math.abs(zc - (0.70 * 2.7 - 1.5) / 0.55) < 1e-14 && Math.abs(fracIdeal(zc) - 0.70) < 1e-13, `z* = ${f(zc, 4)} g, F_f/F ideal = ${f(fracIdeal(zc), 6)}`);
  const zb = zBloqueo(0.60, 0.90);
  prueba('caso de libro β = 0,60, μ = 0,90: z_f = 1,35/(1,62 − 0,495) = 1,200 g; z_r = 1,08/(1,08 + 0,495) = 0,686 g', Math.abs(zb.zf - 1.35 / 1.125) < 1e-12 && Math.abs(zb.zr - 1.08 / 1.575) < 1e-12, `z_f = ${f(zb.zf, 4)}, z_r = ${f(zb.zr, 4)}`);
  const zb2 = zBloqueo(0.72, 0.90);
  prueba('β = 0,72, μ = 0,90: bloquea el trasero a 0,863 g (eficacia 95,9 %)', zb2.primero === 'trasero' && Math.abs(zb2.z - 0.8633) < 1e-4, `z = ${f(zb2.z, 4)} g, eficacia ${f(zb2.eficacia * 100, 1)} %`);
  // con pedal por debajo del bloqueo, la deceleración es exactamente la pedida (sin resistencias)
  let maxE = 0; for (let i = 0; i < 500; i++) { const mu = 0.5 + rnd() * 0.5, beta = 0.6 + rnd() * 0.3, zb3 = zBloqueo(beta, mu), zp = zb3.z * rnd() * 0.99; const e = equilibrio(zp, beta, 1, 1, mu, 0, true); maxE = Math.max(maxE, Math.abs(e.z - zp), Math.abs(e.Ff / (W * e.z) - beta)); }
  prueba('sin bloqueo, z = z_pedida y F_f/F = β (la línea real es recta)', maxE < 1e-12, `error ${maxE.toExponential(1)}`);
  // equilibrio: la suma de fuerzas
  let maxB = 0; for (let i = 0; i < 2000; i++) { const mu = 0.2 + rnd() * 0.8, beta = 0.4 + rnd() * 0.55, zp = rnd() * 1.4, v = rnd() * 50; const e = equilibrio(zp, beta, 0.6 + rnd() * 0.4, 0.6 + rnd() * 0.4, mu, v, false); maxB = Math.max(maxB, Math.abs(W * e.z - e.Ff - e.Fr - e.Fres) / W, Math.max(0, e.Ff - mu * e.Nf * (1 + 1e-9)) / W, Math.max(0, e.Fr - mu * e.Nr * (1 + 1e-9)) / W); }
  prueba('equilibrio de fuerzas m·g·z = F_f + F_r + F_res y ningún eje pasa de μ·N', maxB < 1e-12, `error ${maxB.toExponential(1)}`);
}

console.log('3 · Disco: masa, superficie y reparto de calor');
{
  const d = disco(0.30);
  prueba('masa del disco de 300 mm: ρ·π·(r_o² − r_i²)·e_eq = 7,00 kg', Math.abs(d.masa - 7200 * Math.PI * (0.15 ** 2 - 0.09 ** 2) * 0.0215) < 1e-12 && Math.abs(d.masa - 7.0) < 0.01, `${f(d.masa, 3)} kg`);
  prueba('la masa crece con d²', Math.abs(disco(0.36).masa / disco(0.30).masa - 1.44) < 1e-12);
  prueba('capacidad térmica C = m·c = 3 221 J/K y superficie 0,163 m²', Math.abs(d.C - d.masa * 460) < 1e-9 && Math.abs(d.A - 0.1630) < 5e-4, `C = ${f(d.C, 0)} J/K, A = ${f(d.A, 4)} m²`);
  prueba('γ = 1/(1 + e_pastilla/e_disco) con las efusividades √(k·ρ·c): 0,869', Math.abs(GAMMA - 1 / (1 + Math.sqrt(1.5 * 2500 * 1000) / Math.sqrt(50 * 7200 * 460))) < 1e-15 && GAMMA > 0.85 && GAMMA < 0.89, `γ = ${f(GAMMA, 4)}`);
  prueba('la convección crece con la velocidad (ventilación)', hConv(30) > hConv(10) && hConv(10) > hConv(0) && Math.abs(hConv(0) - 12) < 1e-12, `${f(hConv(0), 0)} · ${f(hConv(10), 0)} · ${f(hConv(30), 0)} W/m²K`);
}

console.log('4 · Fade: μ(T) de la pastilla');
{
  prueba('μ relativa = 1 a la temperatura de referencia (100 °C) y fade nulo hasta ahí', Math.abs(muRel(100) - 1) < 1e-15 && fade(100) === 0 && fade(25) === 0);
  let mono = true; for (let T = 300; T < 900; T += 5) if (muRel(T + 5) > muRel(T) + 1e-15) mono = false;
  prueba('por encima de 300 °C la fricción sólo baja al subir la temperatura', mono);
  const T10 = (() => { let lo = 100, hi = 900; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (fade(m) < 0.10) lo = m; else hi = m; } return lo; })();
  const T20 = (() => { let lo = 100, hi = 900; for (let i = 0; i < 80; i++) { const m = (lo + hi) / 2; if (fade(m) < 0.20) lo = m; else hi = m; } return lo; })();
  prueba('el fade llega a 10 % hacia los 420 °C y a 20 % hacia los 490 °C', T10 > 400 && T10 < 440 && T20 > 470 && T20 < 510, `10 % a ${f(T10, 0)} °C · 20 % a ${f(T20, 0)} °C`);
  prueba('a 25 °C la pastilla fría da el 95 % de la nominal; μ_pastilla(100 °C) ≈ 0,41', Math.abs(muRel(25) - 0.953) < 0.002 && Math.abs(muPad(100) - 0.42 * 0.9803) < 2e-3, `μ rel(25 °C) = ${f(muRel(25), 4)}, μ(100 °C) = ${f(muPad(100), 4)}`);
  prueba('a 600 °C quedan 2/3 de la fricción', muRel(600) > 0.60 && muRel(600) < 0.72, `${f(muRel(600) * 100, 1)} %`);
}

console.log('5 · Calentamiento: solución exacta con h constante');
{
  // una frenada con deceleración constante: z fijo, sin resistencias, sin radiación, sin fade, h constante
  const hc = 60, z = 0.6, v0 = 100 / 3.6, beta = 0.7;
  const S = serie({ n: 1, v0, zped: z, beta, mu: 0.95, h: hc, rad: false, fade: false, res: false, dt: 0.04, tPre: 1.0, tCola: 30 });
  const P = S.paradas[0], dF = disco(0.30), dR = disco(0.27);
  prueba('sin resistencia ni bloqueo la deceleración es exactamente la pedida', Math.abs(P.zMed - z) < 1e-12, `z = ${f(P.zMed, 6)} g`);
  const tb = v0 / (z * G);
  prueba('tiempo de frenado v₀/(z·g) y distancia v₀²/(2·z·g)', Math.abs(P.dur - tb) < 1e-9 && rel(P.dist, v0 * v0 / (2 * z * G)) < 1e-12, `${f(P.dur, 4)} s · ${f(P.dist, 3)} m (cerrada ${f(v0 * v0 / (2 * z * G), 3)} m)`);
  // potencia por disco (delantero): q(t) = γ·β·m·g·z·(v0 − z·g·t)/2 = q0 + q1·t
  const q0 = GAMMA * beta * W * z * v0 / 2, q1 = -GAMMA * beta * VEH.m * Math.pow(G * z, 2) / 2;
  let maxF = 0, maxR = 0;
  for (let i = 0; i < S.n; i++) {
    const t = S.t[i] - P.t0; if (t < 0 || t > tb) continue;
    const eF = calentamientoExacto(25, 25, hc * dF.A, dF.C, q0, q1, t), eR = calentamientoExacto(25, 25, hc * dR.A, dR.C, GAMMA * (1 - beta) * W * z * v0 / 2, -GAMMA * (1 - beta) * VEH.m * Math.pow(G * z, 2) / 2, t);
    maxF = Math.max(maxF, Math.abs(S.TF[i] - eF)); maxR = Math.max(maxR, Math.abs(S.TR[i] - eR));
  }
  const eF1 = calentamientoExacto(25, 25, hc * dF.A, dF.C, q0, q1, tb);
  prueba('T_delantero(t) de la integración Heun = solución exacta durante toda la frenada', maxF < 2e-3, `error máx. ${maxF.toExponential(2)} K (sube ${f(eF1 - 25, 2)} K)`);
  prueba('T_trasero(t) también', maxR < 2e-3, `error máx. ${maxR.toExponential(2)} K`);
  // enfriamiento posterior: q = 0 y h constante → exponencial pura (el coche recupera velocidad, pero h es constante)
  const tF = S.tTot - P.t1, eEnf = calentamientoExacto(P.TF1, 25, hc * dF.A, dF.C, 0, 0, tF);
  prueba('después de frenar, el enfriamiento es la exponencial exacta T_a + ΔT·e^(−t/τ)', Math.abs(S.TFend - eEnf) < 2e-3, `τ = ${f(dF.C / (hc * dF.A), 1)} s · ${f(S.TFend, 3)} °C frente a ${f(eEnf, 3)} °C`);
  // la solución exacta es solución de la ecuación: derivada numérica
  const t = 2.0, e = 1e-5, dTdt = (calentamientoExacto(25, 25, hc * dF.A, dF.C, q0, q1, t + e) - calentamientoExacto(25, 25, hc * dF.A, dF.C, q0, q1, t - e)) / (2 * e);
  const lado = (q0 + q1 * t - hc * dF.A * (calentamientoExacto(25, 25, hc * dF.A, dF.C, q0, q1, t) - 25)) / dF.C;
  prueba('la fórmula exacta satisface C·dT/dt = q(t) − h·A·(T − T_a)', Math.abs(dTdt - lado) < 1e-6, `${f(dTdt, 6)} frente a ${f(lado, 6)} K/s`);
}

console.log('6 · Conservación de la energía');
{
  let maxK = 0, maxT = 0, maxQ = 0, n = 0;
  for (let i = 0; i < 80; i++) {
    const p = { v0: (80 + rnd() * 100) / 3.6, zped: 0.4 + rnd() * 0.7, beta: 0.5 + rnd() * 0.4, dF: 0.26 + rnd() * 0.1, mu: 0.4 + rnd() * 0.55, Tint: 14 + rnd() * 10, n: 2 + Math.floor(rnd() * 4) };
    const S = serie(p), A = S.acum;
    n++;
    // 1) cinética: en cada frenada ½·m·v² = ∫F_freno·v dt + ∫F_res·v dt
    for (const P of S.paradas) { const E = P.EbrF + P.EbrR; /* trabajo de freno */ void E; }
    let Eb = 0, Er = A.Eres; Eb = A.Ebr;
    let Ecin = 0; for (const P of S.paradas) Ecin += 0.5 * VEH.m * P.v0 * P.v0;
    maxK = Math.max(maxK, Math.abs(Eb + Er - Ecin) / Ecin);
    // 2) térmica por disco: C·ΔT + convección + radiación = calor que entró
    const dF = S.dF, dR = S.dR;
    maxT = Math.max(maxT, Math.abs(dF.C * (S.TFend - 25) + A.convF + A.radF - A.qF) / Math.max(A.qF, 1), Math.abs(dR.C * (S.TRend - 25) + A.convR + A.radR - A.qR) / Math.max(A.qR, 1));
    // 3) el calor que entra a los 4 discos es γ por el trabajo de freno
    maxQ = Math.max(maxQ, Math.abs(2 * (A.qF + A.qR) - GAMMA * A.Ebr) / (GAMMA * A.Ebr));
  }
  prueba('cada frenada: ½·m·v² = trabajo de los frenos + trabajo de la resistencia a la marcha', maxK < 1e-9, `error relativo máx. ${maxK.toExponential(1)} en ${n} series al azar`);
  prueba('cada disco: m·c·ΔT + convección + radiación = calor que entró (Heun cierra exacto)', maxT < 1e-9, `error relativo máx. ${maxT.toExponential(1)}`);
  prueba('el calor de los cuatro discos es γ por el trabajo de frenado', maxQ < 1e-9, `error relativo máx. ${maxQ.toExponential(1)}`);
  // adiabático exacto
  const v0 = 100 / 3.6, S0 = serie({ n: 1, v0, zped: 0.6, beta: 0.7, mu: 0.95, h: 0, rad: false, fade: false, res: false, tCola: 0 });
  const calor = 2 * (S0.dF.C * (S0.TFend - 25) + S0.dR.C * (S0.TRend - 25));
  prueba('sin pérdidas, toda la energía cinética (×γ) queda en los cuatro discos', rel(calor, GAMMA * 0.5 * VEH.m * v0 * v0) < 1e-9, `${f(calor / 1000, 1)} kJ frente a ${f(GAMMA * 0.5 * VEH.m * v0 * v0 / 1000, 1)} kJ`);
}

console.log('7 · Series de frenadas: tendencias y el fade');
{
  const base = { v0: 160 / 3.6, zped: 0.9, mu: 0.9, Tint: 18, n: 6 };
  const S = serie({ ...base, beta: 0.78, dF: 0.30 });
  const P = S.paradas;
  prueba('la serie hace las 6 frenadas completas hasta parar', P.length === 6 && P.every(p => p.dist > 0));
  prueba('la temperatura del disco delantero al empezar cada frenada sube serie tras serie', P.every((p, i) => i === 0 || p.TF0 > P[i - 1].TF0), P.map(p => f(p.TF0, 0)).join(' · ') + ' °C');
  prueba('la distancia de parada crece con el fade (la última es más larga que la primera)', P[5].dist > P[0].dist * 1.10 && P[5].zMed < P[0].zMed, `${f(P[0].dist, 0)} m → ${f(P[5].dist, 0)} m (z ${f(P[0].zMed, 2)} → ${f(P[5].zMed, 2)} g)`);
  const Snf = serie({ ...base, beta: 0.78, dF: 0.30, fade: false });
  prueba('sin fade las seis distancias son iguales', Snf.paradas.every(p => Math.abs(p.dist - Snf.paradas[0].dist) < 1e-6 * Snf.paradas[0].dist || Math.abs(p.dist - Snf.paradas[0].dist) < 0.5), Snf.paradas.map(p => f(p.dist, 1)).join(' · ') + ' m');
  // monotonía en β y en d
  let monoB = true, ult = -1; for (let b = 0.60; b <= 0.90; b += 0.02) { const s = serie({ ...base, beta: b, dF: 0.30 }); if (ult > 0 && s.TFmax < ult - 1e-9) monoB = false; ult = s.TFmax; }
  prueba('más reparto delantero → más temperatura del disco delantero', monoB);
  let monoD = true; ult = 1e9; for (let d = 0.26; d <= 0.36; d += 0.02) { const s = serie({ ...base, beta: 0.78, dF: d }); if (s.TFmax > ult + 1e-9) monoD = false; ult = s.TFmax; }
  prueba('más diámetro de disco → menos temperatura', monoD);
  // fade desplaza el reparto: con fade la fuerza delantera efectiva baja
  const s2 = serie({ ...base, beta: 0.75, dF: 0.26, zped: 0.8 });
  const e1 = s2.paradas[0], e5 = s2.paradas[5];
  prueba('con fade el delantero caliente aporta menos fuerza: el reparto efectivo se va al eje trasero', e5.EbrF / (e5.EbrF + e5.EbrR) < e1.EbrF / (e1.EbrF + e1.EbrR) - 0.01, `frente ${f(e1.EbrF / (e1.EbrF + e1.EbrR) * 100, 1)} % → ${f(e5.EbrF / (e5.EbrF + e5.EbrR) * 100, 1)} %`);
  // interpolador
  const m = muestrea(S, S.t[100]); prueba('muestrea() reproduce las muestras', Math.abs(m.TF - S.TF[100]) < 1e-4 && Math.abs(m.v - S.v[100]) < 1e-4);
  prueba('no hay NaN ni valores negativos de temperatura', Array.from(S.TF.slice(0, S.n)).every(Number.isFinite) && Array.from(S.TR.slice(0, S.n)).every(x => Number.isFinite(x) && x >= 24.999));
  // radiación: a alta temperatura es una pérdida relevante
  const hot = serie({ ...base, beta: 0.85, dF: 0.26, n: 6 });
  prueba('la radiación (ε·σ·A·T⁴) pesa en los discos que llegan a más de 600 °C', hot.acum.radF > 0.03 * hot.acum.convF, `radiación ${f(hot.acum.radF / 1000, 1)} kJ frente a convección ${f(hot.acum.convF / 1000, 1)} kJ`);
}

console.log('8 · El reto: ventana interior y sin trampas');
{
  let nIn = 0, nGen = 0, ext = 0, peor = 0;
  for (let k = 0; k < 6; k++) {
    let x = 11 + 7 * k; const r = () => (x = x * 48271 % 2147483647) / 2147483647;
    const sc = generaReto(r); if (!sc) continue; nGen++;
    const v = sc.ventana, bm = (v.bMin + v.bMax) / 2, dm = Math.min(0.32, (v.dMin + v.dMax) / 2);
    const bueno = evaluaReto(sc, bm, dm);
    const bajo = evaluaReto(sc, v.bMin - 0.05, dm), alto = evaluaReto(sc, Math.min(B_MAX, v.bMax + 0.07), dm), chico = evaluaReto(sc, bm, Math.max(D_MIN, v.dMin - 0.04));
    const grande = evaluaReto(sc, bm, D_MAX);
    const esquinas = [[B_MIN, D_MIN], [B_MAX, D_MIN], [B_MIN, D_MAX], [B_MAX, D_MAX]].filter(([b, d]) => evaluaReto(sc, b, d).ok).length;
    const cel = ventanaReto(sc, 0.05, 0.02), tot = cel.length * cel[0].length, buenas = cel.flat().filter(Boolean).length;
    peor = Math.max(peor, buenas / tot);
    const interior = bueno.ok && !bajo.ok && !alto.ok && !chico.ok && !grande.ok && esquinas === 0;
    if (interior) nIn++; else ext++;
    prueba(`escenario ${k + 1}: ${sc.v0} km/h, μ ${sc.mu}, pedal ${sc.zped} g, ${sc.n} frenadas cada ${sc.Tint} s · β ∈ [${f(v.bMin, 2)}, ${f(v.bMax, 2)}], d ∈ [${f(v.dMin, 2)}, ${f(v.dMax, 2)}]`, interior,
      `centro OK; β bajo ${bajo.limRsolo > 0.02 ? 'bloquea el trasero' : '¿?'}; β alto ${alto.okFade ? '' : 'fade '}${alto.okD ? '' : 'distancia'}; disco chico fade ${f(chico.fade * 100, 0)} %; disco máximo ${grande.okM ? '' : 'masa ' + f(grande.masa, 2) + ' kg'}`);
  }
  prueba('los 6 escenarios sorteados tienen solución interior (ninguna esquina del mando sirve)', nGen === 6 && nIn === 6, `${nGen} generados, ${nIn} interiores`);
  prueba('adivinar no basta: como mucho el 20 % del plano β–d cumple', peor < 0.20, `peor caso ${f(peor * 100, 1)} %`);
}

console.log('9 · Diagnóstico: cada fallo tiene su firma');
{
  let ok3 = { trasero: 0, delantero: 0, fade: 0 }, n3 = { trasero: 0, delantero: 0, fade: 0 };
  for (let i = 0; i < 120; i++) {
    const d = generaDx(rnd), S = serie({ v0: 150 / 3.6, zped: 0.80, mu: d.mu, beta: d.beta, dF: d.dF, Tint: 18, n: 5 });
    const P = S.paradas, caida = P[4].zMed / P[0].zMed;
    n3[d.tipo]++;
    let firma = false;
    if (d.tipo === 'trasero') firma = S.limRsolo > 1 && S.limFsolo === 0;
    else if (d.tipo === 'delantero') firma = S.limFsolo > 1 && S.limRsolo === 0 && P[0].zMed < 0.80;
    else firma = S.limFsolo === 0 && S.limRsolo === 0 && caida < 0.90 && S.fadeMax > 0.20;
    if (firma) ok3[d.tipo]++;
  }
  prueba('fallo «reparto trasero»: sólo bloquea el eje trasero', ok3.trasero === n3.trasero, `${ok3.trasero}/${n3.trasero}`);
  prueba('fallo «reparto delantero»: sólo bloquea el delantero y la deceleración nace por debajo de lo pedido', ok3.delantero === n3.delantero, `${ok3.delantero}/${n3.delantero}`);
  prueba('fallo «disco corto»: nada bloquea y la deceleración se cae más de un 10 % con fade > 20 %', ok3.fade === n3.fade, `${ok3.fade}/${n3.fade}`);
}

console.log(`\nRESULTADO: ${ok} pruebas bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
