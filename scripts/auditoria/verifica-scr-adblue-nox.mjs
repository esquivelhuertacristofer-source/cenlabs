// Verificación de la física de «Postratamiento SCR con AdBlue: NOx, dosificación y amoníaco residual» (mecanica-144).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (AdBlue, cadena de celdas, térmica del lecho, combustible del calentamiento,
// cristales de urea), con la conservación del nitrógeno (NOx y NH3), con el estado estacionario y con el diseño del reto.
// uso: node scripts/auditoria/verifica-scr-adblue-nox.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/scr-adblue-nox.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,R_GAS,clamp,suave,ADB,NH3_L,molNH3DeLh,LhDeMolNH3,gUreaPorMol,molDeNOxGh,MOT,motor,CAT,Kads,kdes,kads,kreac,koxi,fUrea,pasoCat,estacionario,entradaCat,ventana,CICLOS,cargaEn,cicloFijo,TAU_TERM,simula,RETO,ESCENARIOS,cumple,cumpleTodo};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const rel = (a, b) => Math.abs(a / b - 1);
const AMB = (T) => T + 273.15;

console.log('1 · AdBlue: urea al 32,5 % y estequiometría');
{ const cf = 2 * 0.325 * 1090 / 60.056; cerca(F.NH3_L, cf, 1e-12, 'mol de NH3 por litro = 2·w·ρ/M_urea');
  cerca(F.NH3_L, 11.797, 2e-4, 'NH3 por litro ≈ 11,80 mol (libro: 0,354 kg de urea por litro)');
  cerca(0.325 * 1.090, 0.35425, 1e-12, 'urea por litro = 0,354 kg');
  for (const Lh of [0.01, 0.37, 2.5]) cerca(F.LhDeMolNH3(F.molNH3DeLh(Lh)), Lh, 1e-13, 'L/h ↔ mol/s de NH3 ida y vuelta');
  cerca(F.molDeNOxGh(46.0055 * 3600), 1, 1e-12, '46 g/s de NO2 son 1 mol/s');
  cerca(F.gUreaPorMol, 30.028, 1e-9, '1 mol de NH3 = 30,03 g de urea (2 NH3 por urea)');
  console.log(`   1 L de AdBlue = ${F.NH3_L.toFixed(3)} mol de NH3 · 320 g/h de NOx piden ${F.LhDeMolNH3(F.molDeNOxGh(320)).toFixed(4)} L/h`); }

console.log('2 · El motor diésel (mapa didáctico)');
{ for (const L of [0.1, 0.5, 1]) { const m = F.motor(L); cerca(m.P, L * 120e3, 1e-12, `P = L·P_max (L=${L})`); cerca(m.mNOx, m.eNOx * m.P / 1000, 1e-12, 'ṁ_NOx = e·P'); cerca(m.Pcomb, m.P / 0.40, 1e-12, 'P_comb = P/η_e'); }
  let mono = true; for (let L = 0.02; L < 1; L += 0.02) { const a = F.motor(L), b = F.motor(L + 0.02); if (!(b.Tg > a.Tg && b.mGas > a.mGas && b.mNOx > a.mNOx)) mono = false; } ok(mono, 'la temperatura, el caudal y el NOx crecen con la carga');
  const f1 = F.motor(1); ok(f1.Tg > 440 && f1.Tg < 520, 'a plena carga el gas sale a 440–520 °C', f1.Tg.toFixed(0)); ok(F.motor(0.08).Tg < 180, 'al ralentí el gas sale por debajo de 180 °C', F.motor(0.08).Tg.toFixed(0)); }

console.log('3 · Constantes cinéticas');
{ for (const T of [450, 550, 650, 750]) { cerca(F.kads(T), F.Kads(T) * F.kdes(T) * F.CAT.Om, 1e-12, `balance detallado k_a = K·k_d·Ω (T=${T} K)`);
    const ks = F.CAT.ks0 * Math.exp(-F.CAT.Es * (1 / T - 1 / F.CAT.Ts0)), km = F.CAT.km0 * Math.pow(T / F.CAT.Ts0, 1.5), ke = F.kreac(T); cerca(ke, 1 / (1 / ks + 1 / km), 1e-12, 'k_s efectiva = resistencias en serie (cinética + transporte)'); ok(ke < Math.min(ks, km), 'k_efectiva < min(k_s, k_m)'); }
  let m = true; for (let T = 400; T < 800; T += 10) { if (!(F.Kads(T + 10) < F.Kads(T) && F.kdes(T + 10) > F.kdes(T) && F.koxi(T + 10) > F.koxi(T) && F.kreac(T + 10) > F.kreac(T))) m = false; } ok(m, 'K(T) cae, k_d, k_ox y k_s suben con T (Arrhenius)');
  cerca(F.Kads(623), 500, 1e-12, 'K(623 K) = K0'); cerca(F.kdes(623), 2.5, 1e-12, 'k_d(623 K) = k_d0');
  ok(F.fUrea(165) > 0.4999 && F.fUrea(165) < 0.5001, 'urea: la mitad se descompone a 165 °C'); ok(F.fUrea(150) < 0.3 && F.fUrea(200) > 0.95 && F.fUrea(240) > 0.999, 'urea: casi nada a 150 °C y casi todo a 200 °C');
  let mu = true; for (let T = 100; T < 300; T += 5) if (F.fUrea(T + 5) <= F.fUrea(T)) mu = false; ok(mu, 'fracción de urea descompuesta creciente con T'); }

console.log('4 · Cadena de N celdas: forma cerrada con la pared saturada (θ = 1)');
{ const N = F.CAT.N; for (const [L, Tc] of [[0.3, 250], [0.5, 330], [0.8, 420]]) { const m = F.motor(L), e = F.entradaCat(m, 1, Tc, Tc, true, 1), th = new Float64Array(N).fill(1);
    const r = F.pasoCat(th, e, 1e-7), ks = F.kreac(e.T), tau = F.CAT.V / e.Vdot; // volumen/caudal
    cerca(r.FNOxO / e.FNOx, Math.pow(1 + ks * tau / N, -N), 1e-9, `NOx saliente = (1 + k·τ/N)^−N (L=${L}, ${Tc} °C)`);
    const Xlim = 1 - Math.exp(-ks * tau); ok(r.FNOxO / e.FNOx > 1 - Xlim - 1e-12, 'las N celdas dan menos conversión que el flujo pistón (1 − e^−kτ)'); }
  // al aumentar N la cadena tiende al flujo pistón
  const m = F.motor(0.5), e = F.entradaCat(m, 1, 330, 330, true, 1), ks = F.kreac(e.T), tau = F.CAT.V / e.Vdot; let prev = 1;
  for (const k of [1, 2, 4, 8, 64, 4096, 4e7]) { const x = Math.pow(1 + ks * tau / k, -k); ok(x <= prev + 1e-15, `la fracción que queda baja al subir N (${k})`); prev = x; } cerca(prev, Math.exp(-ks * tau), 1e-5, 'N → ∞ da exp(−kτ)'); }

console.log('5 · Conservación del nitrógeno en un paso (NOx y NH3)');
{ let maxN = 0, maxA = 0, rango = true; const N = F.CAT.N;
  for (const L of [0.08, 0.3, 0.5, 0.9]) for (const Tc of [140, 200, 260, 340, 430, 520]) for (const d of [0, 0.6, 1, 1.4]) for (const th0 of [0, 0.3, 0.9]) {
    const m = F.motor(L), e = F.entradaCat(m, d, Tc, Tc, true, 1), th = new Float64Array(N).fill(th0), dt = 1, Vc = F.CAT.V / N;
    const antes = th.reduce((a, x) => a + x * F.CAT.Om * Vc, 0), r = F.pasoCat(th, e, dt), desp = th.reduce((a, x) => a + x * F.CAT.Om * Vc, 0);
    const bN = e.FNOx * dt - r.FNOxO * dt - r.rSCR * dt, bA = e.FNH3 * dt - r.FNH3O * dt - (desp - antes) - r.rSCR * dt - r.rOx * dt;
    maxN = Math.max(maxN, Math.abs(bN) / Math.max(e.FNOx * dt, 1e-12)); maxA = Math.max(maxA, Math.abs(bA) / Math.max(e.FNH3 * dt + antes, 1e-12));
    if (th.some((x) => x < -1e-12 || x > 1 + 1e-12 || !isFinite(x))) rango = false; }
  ok(maxN < 1e-11, 'balance del NOx por paso < 1e-11', maxN.toExponential(2)); ok(maxA < 1e-11, 'balance del NH3 por paso < 1e-11', maxA.toExponential(2)); ok(rango, 'la cobertura θ se queda en [0, 1] en los 288 casos');
  console.log(`   residuo máximo: NOx ${maxN.toExponential(1)} · NH3 ${maxA.toExponential(1)}`); }

console.log('6 · Estado estacionario: la bisección coincide con integrar el tiempo');
{ const N = F.CAT.N; let eMax = 0;
  for (const [L, Tc, d] of [[0.5, 330, 1.0], [0.5, 330, 1.3], [0.3, 230, 0.8], [0.8, 430, 1.1], [0.5, 180, 1.0]]) {
    const m = F.motor(L), e = F.entradaCat(m, d, Tc, Tc, true, 1), th = new Float64Array(N); for (let k = 0; k < 6000; k++) F.pasoCat(th, e, 2);
    const r = F.pasoCat(th.slice(), e, 1), s = F.estacionario(e);
    cerca(r.FNOxO / e.FNOx, s.FNOxO / e.FNOx, 2e-4, `NOx saliente estacionario = integrado (L=${L}, ${Tc} °C, d=${d})`);
    ok(Math.abs(r.FNH3O - s.FNH3O) <= 2e-4 * e.FNH3 + 1e-12, 'NH3 saliente estacionario = integrado', `${r.FNH3O} vs ${s.FNH3O}`);
    for (let i = 0; i < N; i++) eMax = Math.max(eMax, Math.abs(th[i] - s.th[i])); }
  ok(eMax < 2e-4, 'perfil de θ estacionario = integrado', eMax.toExponential(2));
  // cierre estacionario: entra = sale + SCR + oxidación
  for (const [L, Tc, d] of [[0.5, 330, 1.2], [0.8, 450, 1.0], [0.3, 200, 1.4]]) { const m = F.motor(L), e = F.entradaCat(m, d, Tc, Tc, true, 1), s = F.estacionario(e), Vc = F.CAT.V / N;
    const rS = e.FNOx - s.FNOxO, rO = s.th.reduce((a, t) => a + F.koxi(e.T) * t * F.CAT.Om * Vc, 0); cerca(e.FNH3, s.FNH3O + rS + rO, 1e-10, `NH3 que entra = sale + reacciona + se quema (estacionario, ${Tc} °C)`); } }

console.log('7 · La ventana de temperatura');
{ for (const L of [0.3, 0.5, 0.8]) { let mejor = [0, -1]; const c = []; for (let T = 140; T <= 560; T += 10) { const w = F.ventana(L, 1, T); c.push([T, w.conv]); if (w.conv > mejor[1]) mejor = [T, w.conv]; }
    ok(mejor[0] > 200 && mejor[0] < 420 && mejor[1] > 0.95, `la conversión máxima (≥ 95 %) está en el interior de la ventana (L=${L})`, `${mejor[0]} °C ${(mejor[1] * 100).toFixed(1)} %`);
    ok(c[0][1] < 0.30, 'a 140 °C la conversión es baja (la urea casi no se descompone)', (c[0][1] * 100).toFixed(1)); ok(c[c.length - 1][1] < mejor[1] - 0.4, 'a 560 °C la conversión cae más de 40 puntos (NH3 que se quema y poca capacidad)', (c[c.length - 1][1] * 100).toFixed(1));
    let bajan = true; for (let i = 0; i < c.length - 1; i++) if (c[i][0] >= 450 && c[i + 1][1] > c[i][1]) bajan = false; ok(bajan, 'por encima de 450 °C la conversión no sube'); }
  // dosis: la conversión sube y el deslizamiento sube
  let mc = true, ms = true; for (let d = 0.5; d < 1.5; d += 0.1) { const a = F.ventana(0.5, d, 330), b = F.ventana(0.5, d + 0.1, 330); if (b.conv < a.conv - 1e-12) mc = false; if (b.slip < a.slip - 1e-12) ms = false; } ok(mc && ms, 'más dosis: más conversión y más amoníaco que se escapa (monótonos)');
  // la conversión nunca supera a la dosis (1 a 1) cuando falta NH3
  for (const d of [0.3, 0.6, 0.9]) for (const T of [200, 260, 330, 400]) { const w = F.ventana(0.5, d, T); ok(w.conv <= d + 1e-9, `conversión ≤ dosis (d=${d}, ${T} °C)`, w.conv.toFixed(4)); }
  const a = F.ventana(0.5, 1, 330), b = F.ventana(0.5, 1.3, 330); console.log(`   0,5 de carga a 330 °C: dosis 100 % → ${(a.conv * 100).toFixed(1)} % y ${a.slip.toFixed(1)} ppm · 130 % → ${(b.conv * 100).toFixed(1)} % y ${b.slip.toFixed(0)} ppm`); }

console.log('8 · Ciclos: conservación, térmica del lecho, combustible y AdBlue');
{ let maxN = 0, maxA = 0;
  for (const ciclo of ['frio', 'puerto']) for (const d of [0.5, 1, 1.4]) for (const [Ton, dT] of [[140, 0], [190, 30], [250, 60]]) { const R = F.simula({ ciclo, dosis: d, Ton, dT, dt: 1 });
    maxN = Math.max(maxN, Math.abs(R.bal.nox) / R.bal.nIn); maxA = Math.max(maxA, Math.abs(R.bal.nh3) / Math.max(R.bal.aIn, 1e-12)); }
  ok(maxN < 1e-12, 'balance del NOx en los ciclos (36 casos) < 1e-12', maxN.toExponential(2)); ok(maxA < 1e-12, 'balance del NH3 en los ciclos < 1e-12', maxA.toExponential(2)); console.log(`   residuo de nitrógeno en ciclos completos: NOx ${maxN.toExponential(1)} · NH3 ${maxA.toExponential(1)}`);
  // térmica exacta con carga constante
  { const L = 0.3, c = { nombre: 't', T: 100, Tb0: 60, L: [[0, L], [100, L]] }, R = F.simula({ cicloObj: c, dosis: 1, Ton: 180, dT: 25, dt: 1 }), Tin = F.motor(L).Tg + 25; let e = 0;
    for (let k = 0; k < R.N; k++) e = Math.max(e, Math.abs(R.tr.Tb[k] - (Tin + (60 - Tin) * Math.exp(-R.tr.t[k] / F.TAU_TERM)))); ok(e < 1e-9, 'T del lecho = Tin + (T0 − Tin)·e^(−t/τ)', e.toExponential(2)); }
  // combustible del calentamiento (carga constante): ṁ·cp·ΔT/η_cal frente a P/η_e
  { const L = 0.5, dT = 40, R = F.simula({ cicloObj: F.cicloFijo(L), dosis: 1, Ton: 180, dT, dt: 1 }), m = F.motor(L); cerca(R.extraComb, m.mGas * F.MOT.cpG * dT / F.MOT.etaCal / m.Pcomb * 100, 1e-12, 'diésel extra % = ṁ_gas·c_p·ΔT/η_cal ÷ P_comb'); console.log(`   calentar 40 °C a media carga cuesta ${R.extraComb.toFixed(2)} % de diésel`); }
  // gasto de AdBlue a dosis 100 %: ṅ_NOx / (mol de NH3 por litro) y su proporción respecto al diésel
  { for (const L of [0.3, 0.5, 0.8]) { const R = F.simula({ cicloObj: F.cicloFijo(L), dosis: 1, Ton: 180, dt: 1 }), m = F.motor(L), Lh = F.LhDeMolNH3(F.molDeNOxGh(m.mNOx)), dieselLh = m.Pcomb / F.MOT.LHVd * 3600;
      cerca(R.tr.dosisLh[10], Lh, 1e-12, `AdBlue a 100 % = ṅ_NOx/NH3_L (carga ${L})`); cerca(R.adbL / (R.ciclo.T / 3600), Lh, 1e-9, 'litros del ciclo = ∫ dosis dt'); const pct = Lh / dieselLh * 100; ok(pct > 2.5 && pct < 7, 'AdBlue entre 2,5 y 7 % del diésel (rango real 3–6 %)', pct.toFixed(2)); cerca(R.adbPct, pct, 1e-9, 'adbPct del modelo = cociente exacto');
      if (L === 0.5) console.log(`   a media carga: ${m.mNOx.toFixed(0)} g/h de NOx piden ${Lh.toFixed(3)} L/h de AdBlue = ${pct.toFixed(2)} % del diésel`); } }
  // cristales: sólo si se inyecta con Tin < ~180 °C, y la masa es la urea × (1 − f_urea)
  { const L = 0.08, Tin = F.motor(L).Tg; const R1 = F.simula({ cicloObj: F.cicloFijo(L), dosis: 1, Ton: 130, dt: 1 }), R2 = F.simula({ cicloObj: F.cicloFijo(L), dosis: 1, Ton: Tin + 5, dt: 1 }), Lh = R1.tr.dosisLh[5];
    ok(R2.cris === 0 && R2.A.adbL === 0, 'con el umbral por encima del escape no se inyecta y no hay cristales'); const gUrea = F.molNH3DeLh(Lh) * F.gUreaPorMol * (R1.N - 1) * R1.dt;
    cerca(R1.cris, gUrea * (1 - F.fUrea(Tin)), 1e-9, 'cristales = urea inyectada × (1 − f_urea(T))'); console.log(`   al ralentí (escape a ${Tin.toFixed(0)} °C) inyectando: se cristaliza el ${((1 - F.fUrea(Tin)) * 100).toFixed(1)} % de la urea`); } }

console.log('9 · El reto: ventana interior y no adivinable');
{ const res = {}; const dt = 1;
  for (const E of F.ESCENARIOS) { const g = []; let tot = 0; const filtra = [];
    for (let d = 50; d <= 150; d += 2) for (let Ton = 140; Ton <= 260; Ton += 10) for (let dT = 0; dT <= 60; dT += 10) { const R = F.simula({ ciclo: E.ciclo, dosis: d / 100, Ton, dT, dt }); tot++; if (F.cumpleTodo(R, E)) g.push([d, Ton, dT]); }
    res[E.ciclo] = { g, tot }; const rg = (i) => [Math.min(...g.map((x) => x[i])), Math.max(...g.map((x) => x[i]))];
    ok(g.length > 0, `${E.ciclo}: existe una combinación que cumple los cuatro criterios`, String(g.length)); ok(g.length / tot < 0.05, `${E.ciclo}: sólo cumple ${(g.length / tot * 100).toFixed(2)} % de las combinaciones (no se acierta al azar)`);
    ok(rg(0)[0] > 50 && rg(0)[1] < 150, `${E.ciclo}: la ventana de dosis es interior (${rg(0)[0]}–${rg(0)[1]} %)`); { const sin = g.filter((x) => x[2] === 0); ok(sin.length > 0 && Math.min(...sin.map((x) => x[1])) >= 160, `${E.ciclo}: sin calentar, la temperatura mínima válida empieza en ${Math.min(...sin.map((x) => x[1]))} °C (por debajo se cristaliza urea)`); }
    // lo que pide la guía: arranque mal ajustado (80 %, 150 °C, 0) NO cumple
    ok(!F.cumpleTodo(F.simula({ ciclo: E.ciclo, dosis: 0.8, Ton: 150, dT: 0, dt }), E), `${E.ciclo}: el arranque 80 % / 150 °C / sin calentar no cumple`);
    ok(!F.cumpleTodo(F.simula({ ciclo: E.ciclo, dosis: 1, Ton: 180, dT: 0, dt }), E), `${E.ciclo}: tampoco cumple el «100 % de manual» a 180 °C`);
    // ningún mando solo, en sus extremos, sirve
    for (const [c, f] of [['dosis 50 %', { dosis: 0.5, Ton: 200, dT: 20 }], ['dosis 150 %', { dosis: 1.5, Ton: 200, dT: 20 }], ['Ton 140 °C', { dosis: 1.1, Ton: 140, dT: 0 }], ['Ton 260 °C', { dosis: 1.1, Ton: 260, dT: 0 }], ['calentar 60 °C', { dosis: 1.1, Ton: 200, dT: 60 }]]) ok(!F.cumpleTodo(F.simula(Object.assign({ ciclo: E.ciclo, dt }, f)), E), `${E.ciclo}: ${c} no cumple`);
    // anchura de la ventana de dosis con el mejor (Ton, dT)
    const cnt = {}; for (const [d, T, q] of g) (cnt[T + '/' + q] = cnt[T + '/' + q] || []).push(d); const best = Object.entries(cnt).sort((a, b) => b[1].length - a[1].length)[0];
    console.log(`   ${E.ciclo}: ${g.length}/${tot} combinaciones (${(g.length / tot * 100).toFixed(1)} %) · dosis ${rg(0)[0]}–${rg(0)[1]} % · T mín. ${rg(1)[0]}–${rg(1)[1]} °C · calentar ${rg(2)[0]}–${rg(2)[1]} °C · mejor (T/ΔT) ${best[0]}: dosis ${Math.min(...best[1])}–${Math.max(...best[1])} %`); }
  // el óptimo del arranque en frío NO está en el 100 % y el de la subida sí cerca de él
  const gf = res.frio.g.map((x) => x[0]); ok(Math.min(...gf) > 100, 'arranque en frío: toda dosis válida es mayor que 100 % (hay que «llenar» el catalizador)', String(Math.min(...gf)));
  const gp = res.puerto.g.map((x) => x[0]); ok(Math.max(...gp) <= 102, 'subida de puerto: la dosis válida no pasa de ≈100 % (el calentón suelta lo guardado)', String(Math.max(...gp)));
  // el deslizamiento por «calentón»: la subida de puerto con 100 % tiene un pico de NH3 al subir la carga
  const R = F.simula({ ciclo: 'puerto', dosis: 1, Ton: 200, dT: 0, dt: 1 }); let kp = 0; for (let k = 0; k < R.N; k++) if (R.tr.nh3[k] > R.tr.nh3[kp]) kp = k; ok(R.tr.Tb[kp] > 380 && R.tr.nh3[kp] > 5 * R.tr.nh3[100], 'el pico de amoníaco llega con el lecho más caliente (> 380 °C) y es > 5 veces el de antes de subir', `t=${R.tr.t[kp]} s, ${R.tr.Tb[kp].toFixed(0)} °C, ${R.tr.nh3[kp].toFixed(1)} ppm`); }

console.log('10 · El diagnóstico se puede resolver con lo que muestra el dock');
{ const CASOS = [{ k: 'frio', L: 0.08, dosis: 1, Ton: 180, dT: 0 }, { k: 'sobre', L: 0.5, dosis: 1.4, Ton: 180, dT: 0 }, { k: 'viejo', L: 0.5, dosis: 1, Ton: 180, dT: 0, fKs: 0.015 }, { k: 'iny', L: 0.5, dosis: 1, Ton: 180, dT: 0, kInj: 0.45 }];
  const lee = (c) => { const R = F.simula({ cicloObj: F.cicloFijo(c.L), dosis: c.dosis, Ton: c.Ton, dT: c.dT, fKs: c.fKs, kInj: c.kInj, dt: 1 }), k = 60, T = R.tr, kI = c.kInj || 1;
    return { Tb: T.Tb[k], nin: T.noxIn[k], nout: T.noxOut[k], nh3: T.nh3[k], ped: T.dosisLh[k] / kI, ent: T.dosisLh[k], conv: T.conv[k] }; };
  // el árbol de decisión que haría el alumno con los seis valores del dock
  const arbol = (d) => { if (d.Tb < 200 && d.ent === 0) return 'frio'; if (Math.abs(d.ped - d.ent) > 0.05 * d.ped) return 'iny'; if (d.nh3 > 30 && d.conv > 0.9) return 'sobre'; if (d.nh3 > 10 && d.conv < 0.85) return 'viejo'; return '?'; };
  for (const c of CASOS) { const d = lee(c); ok(arbol(d) === c.k, `el caso «${c.k}» se distingue por sus lecturas`, JSON.stringify(Object.fromEntries(Object.entries(d).map(([a, b]) => [a, +b.toFixed(2)])))); console.log(`   ${c.k.padEnd(6)} T ${d.Tb.toFixed(0)} °C · NOx ${d.nin.toFixed(0)}→${d.nout.toFixed(0)} ppm · NH3 ${d.nh3.toFixed(1)} ppm · AdBlue pedido ${d.ped.toFixed(2)} / entregado ${d.ent.toFixed(2)} L/h`); } }

console.log('11 · El cálculo de la fase 1');
{ const cargaPara = (g) => { let a = 0.02, b = 1; for (let i = 0; i < 60; i++) { const m = (a + b) / 2; if (F.motor(m).mNOx < g) a = m; else b = m; } return (a + b) / 2; };
  for (const g of [180, 240, 320, 420]) { const L = cargaPara(g); cerca(F.motor(L).mNOx, g, 1e-9, `la carga hallada da ${g} g/h de NOx`); const ans = F.LhDeMolNH3(F.molDeNOxGh(g)), R = F.simula({ cicloObj: F.cicloFijo(L), dosis: 1, Ton: 180, dt: 1 }); cerca(R.tr.dosisLh[10], ans, 1e-9, `la respuesta del enunciado (${ans.toFixed(3)} L/h) es el gasto del motor a 100 %`); } }

console.log('12 · Cifras del reto por defecto (las que cita el catálogo)');
for (const ciclo of ['frio', 'puerto']) for (const [d, Ton, dT] of [[1, 180, 0], [1.15, 190, 20], [0.97, 200, 0]]) { const R = F.simula({ ciclo, dosis: d, Ton, dT, dt: 1 });
  console.log(`   ${ciclo.padEnd(6)} dosis ${Math.round(d * 100)}% T≥${Ton} +${dT}: NOx ${R.eIn.toFixed(2)} → ${R.eOut.toFixed(2)} g/kWh (${(R.conv * 100).toFixed(1)} %) · NH3 medio ${R.nh3Medio.toFixed(1)} ppm (pico ${R.nh3Pico.toFixed(0)}) · extra ${R.extraComb.toFixed(2)} % · cristales ${(R.cris * 1000).toFixed(1)} mg · AdBlue ${R.adbPct.toFixed(2)} %`); }

console.log(`\n${n} comprobaciones · ${malas} fallos`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
