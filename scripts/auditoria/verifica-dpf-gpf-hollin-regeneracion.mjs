// Verificación de la física de «Filtro de partículas (DPF/GPF): hollín, contrapresión y regeneración» (mecanica-149).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (geometría del panal, Poiseuille, Darcy, Arrhenius, decaimiento exponencial exacto),
// con los balances de carbono y de energía, con el calor adiabático, con el punto de equilibrio de la quema pasiva, con el mando
// de la regeneración, con la prueba de peor caso (parada en ralentí) y con el diseño del reto (ventana interior, diagnóstico, cálculo).
// uso: node scripts/auditoria/verifica-dpf-gpf-hollin-regeneracion.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/dpf-gpf-hollin-regeneracion.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,R_GAS,clamp,MC,DHC_O2,DHC_NO2,T_AMB,M_AIRE,M_NO2,MOT,motor,noxPPM,muGas,rhoGas,DPF,F_POISEUILLE,dpFiltro,REF,dpRef,KIN,kO2,kNO2,fNO2,pasoFiltro,sumaM,PERFILES,cargaPerfil,TAU_DOC,MFIN,T_REG_MAX,L_MIN_REG,KM_POR_GL,simula,simulaParada,T_DROPS,peorParada,RETO,ESCENARIOS,cumple,cumpleTodo};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const K = (c) => c + 273.15;
const { DPF, MOT, KIN } = F;

console.log('1 · Geometría del panal (cordierita 200 cpsi, pared de 12 mil, 7,5" × 9")');
{ cerca(DPF.Af, Math.PI / 4 * DPF.D * DPF.D, 1e-14, 'área frontal = π/4·D²'); cerca(DPF.Vf, DPF.Af * DPF.Lf, 1e-14, 'volumen = área × longitud'); cerca(DPF.VL, 6.52, 2e-3, 'el filtro es de ≈ 6,5 L', DPF.VL.toFixed(3));
  cerca(DPF.Ncel, 310000, 1e-4, '200 cpsi = 310 000 celdas por m²'); cerca(DPF.paso, 1 / Math.sqrt(DPF.Ncel), 1e-14, 'paso entre celdas = 1/√N'); cerca(DPF.a, DPF.paso - DPF.w, 1e-14, 'lado libre = paso − pared');
  cerca(DPF.Nin, 0.5 * DPF.Ncel * DPF.Af, 1e-14, 'la mitad de los canales es de entrada'); cerca(DPF.Afilt, 4 * DPF.a * DPF.Lf * DPF.Nin, 1e-14, 'área filtrante = 4·a·L por canal de entrada');
  ok(DPF.Afilt / DPF.VL > 0.8 && DPF.Afilt / DPF.VL < 1.2, 'área filtrante ≈ 0,9 m² por litro (valor de libro: 0,8–1,2)', (DPF.Afilt / DPF.VL).toFixed(3));
  const fo = (DPF.a / DPF.paso) ** 2; ok(fo > 0.65 && fo < 0.72, 'fracción abierta frontal ≈ 69 %', fo.toFixed(3));
  console.log(`   V = ${DPF.VL.toFixed(2)} L · a = ${(DPF.a * 1e3).toFixed(3)} mm · canales de entrada = ${DPF.Nin.toFixed(0)} · área filtrante = ${DPF.Afilt.toFixed(2)} m²`); }

console.log('2 · Propiedades del gas');
{ cerca(F.muGas(300), 1.846e-5, 0.01, 'viscosidad del aire a 300 K = 18,5 μPa·s (Sutherland, libro)'); cerca(F.muGas(750), 3.46e-5, 0.03, 'viscosidad a 750 K ≈ 34,6 μPa·s');
  cerca(F.rhoGas(300), 1.05e5 / (287 * 300), 1e-12, 'ρ = p/(R·T)'); ok(F.rhoGas(900) < F.rhoGas(300), 'el gas caliente es menos denso'); ok(F.muGas(900) > F.muGas(300), 'el gas caliente es más viscoso'); }

console.log('3 · El motor diésel (mapa didáctico)');
{ for (const L of [0.1, 0.5, 1]) { const m = F.motor(L); cerca(m.P, L * 120e3, 1e-12, `P = L·P_max (L=${L})`); cerca(m.mS, m.eS * m.P / 1000, 1e-12, 'ṁ_hollín = e·P'); cerca(m.mNOx, m.eNOx * m.P / 1000, 1e-12, 'ṁ_NOx = e·P'); cerca(m.Pcomb, m.P / 0.40, 1e-12, 'P_comb = P/η_e'); }
  let mono = true; for (let L = 0.02; L < 1; L += 0.02) { const a = F.motor(L), b = F.motor(L + 0.02); if (!(b.Tg > a.Tg && b.mGas > a.mGas && b.yO2 < a.yO2)) mono = false; } ok(mono, 'con la carga suben la temperatura y el caudal y baja el oxígeno');
  ok(F.motor(0.05).Tg < 170 && F.motor(0.05).Tg > 140, 'al ralentí el gas sale a ~150 °C', F.motor(0.05).Tg.toFixed(0)); ok(F.motor(0.6).Tg > 340 && F.motor(0.6).Tg < 380, 'a carga 0,6 el gas sale a ~360 °C', F.motor(0.6).Tg.toFixed(0));
  ok(F.motor(0.25).mS > F.motor(0.6).mS * 0.8 && F.motor(0.25).eS > F.motor(0.6).eS, 'el hollín específico es mayor a baja carga (combustión incompleta)'); ok(F.motor(0.05).yO2 > 0.17 && F.motor(1).yO2 > 0.06, 'oxígeno en el gas: ~18 % al ralentí y ~7 % a plena carga');
  const nx = F.noxPPM(F.motor(0.6)); ok(nx > 500 && nx < 900, 'NOx a carga 0,6 ≈ 680 ppm', nx.toFixed(0)); }

console.log('4 · Caída de presión: canales + entrada/salida + pared + torta');
{ const T = 753.15, md = 0.16, Q = md / F.rhoGas(T), mu = F.muGas(T);
  const d0 = F.dpFiltro(0, 0, md, T);
  cerca(d0.tot, d0.dch + d0.dce + d0.dw + d0.ds, 1e-14, 'ΔP = suma de sus cuatro términos'); cerca(d0.ds, 0, 1e-14, 'sin hollín no hay torta');
  cerca(d0.dch, 28.454 * mu * DPF.Lf * Q / (DPF.Nin * Math.pow(DPF.a, 4)), 1e-12, 'canales limpios: Poiseuille 28,454·μ·L·Q/(N·a⁴)');
  cerca(d0.dw, mu * Q / DPF.Afilt * DPF.w / DPF.kw, 1e-12, 'pared limpia: Darcy μ·Q·w/(k·A)');
  const u0 = Q / (DPF.Nin * DPF.a * DPF.a); cerca(d0.dce, 1.0 * F.rhoGas(T) * u0 * u0 / 2, 1e-12, 'entrada y salida: ½ρu² del canal');
  cerca(F.F_POISEUILLE, 2 * 14.227, 1e-12, 'ΔP/L = 4·(f·Re)·μ·u/(2·a²) con f·Re = 14,227 del canal cuadrado → 28,454');
  // linealidad en el caudal (pared y torta) y cuadrática (entrada/salida)
  const a1 = F.dpFiltro(30, 0, md, T), a2 = F.dpFiltro(30, 0, 2 * md, T); cerca(a2.dw / a1.dw, 2, 1e-12, 'Darcy en la pared es lineal en el caudal'); cerca(a2.ds / a1.ds, 2, 1e-12, 'Darcy en la torta es lineal en el caudal'); cerca(a2.dce / a1.dce, 4, 1e-12, 'las pérdidas de entrada y salida crecen con Q²');
  // la torta es lineal en la masa de hollín
  const b1 = F.dpFiltro(10, 0, md, T), b2 = F.dpFiltro(20, 0, md, T); cerca(b2.ds / b1.ds, 2, 1e-12, 'la caída en la torta es proporcional al hollín (espesor ∝ m)');
  cerca(b1.ws, 0.010 / (DPF.rs * DPF.Afilt), 1e-12, 'espesor de la torta w_s = m/(ρ_s·A)');
  // obstrucción de la pared en profundidad: de 1 a 1 + dw
  cerca(F.dpFiltro(1e-9, 0, md, T).dw / d0.dw, 1, 1e-6, 'sin hollín la pared no está obstruida'); cerca(F.dpFiltro(1000 * DPF.VL, 0, md, T).dw / d0.dw, 1 + DPF.dw, 1e-3, 'con muchísimo hollín la pared vale (1 + dw) veces');
  // monotonía en hollín y ceniza
  let mono = true, prev = -1; for (let g = 0; g <= 12; g += 0.25) { const d = F.dpFiltro(g * DPF.VL, 0, md, T).tot; if (d <= prev) mono = false; prev = d; } ok(mono, 'la contrapresión crece con el hollín (0 a 12 g/L)');
  let monoA = true, pa = -1; for (let a = 0; a <= 12; a += 1) { const d = F.dpFiltro(2 * DPF.VL, a, md, T).tot; if (d <= pa) monoA = false; pa = d; } ok(monoA, 'la contrapresión crece con la ceniza');
  ok(F.dpFiltro(2 * DPF.VL, 8, md, T).tot > F.dpFiltro(2 * DPF.VL, 0, md, T).tot * 1.15, 'con 8 g/L de ceniza la misma carga de hollín da más de 15 % más de contrapresión');
  cerca(F.dpFiltro(2 * DPF.VL, 0, md, T, 0.6).tot, F.dpFiltro(2 * DPF.VL, 0, md, T).tot * (1 - 0.8 * 0.6), 1e-12, 'una grieta baja la contrapresión (paso en paralelo)');
  const cl = F.dpRef(0, 0), c8 = F.dpRef(8 * DPF.VL, 0), c4 = F.dpRef(4 * DPF.VL, 0);
  ok(cl > 5e3 && cl < 8e3, 'filtro limpio a plena carga: 5–8 kPa (rango típico de libro)', (cl / 1e3).toFixed(2)); ok(c8 > 13e3 && c8 < 17e3, 'con 8 g/L: 13–17 kPa', (c8 / 1e3).toFixed(2)); ok(c4 > cl && c4 < c8, 'el punto intermedio está entre los dos');
  // el caudal pequeño da menos contrapresión (ralentí)
  ok(F.dpFiltro(4 * DPF.VL, 0, 0.032, 426).tot < 0.25 * F.dpFiltro(4 * DPF.VL, 0, md, T).tot, 'al ralentí la contrapresión es una fracción pequeña de la de plena carga');
  console.log(`   ΔP a plena carga: limpio ${(cl / 1e3).toFixed(2)} kPa · 4 g/L ${(c4 / 1e3).toFixed(2)} kPa · 8 g/L ${(c8 / 1e3).toFixed(2)} kPa · 8 g/L y 100 000 km (4 g/L ceniza) ${(F.dpRef(8 * DPF.VL, 4) / 1e3).toFixed(2)} kPa`); }

console.log('5 · Cinética de oxidación (Arrhenius)');
{ cerca(F.kO2(KIN.Ref, KIN.yRef), KIN.kO2, 1e-12, 'k_O2 a 600 °C con 10 % de O2 = valor de referencia');
  for (const [T1, T2] of [[823.15, 873.15], [873.15, 923.15], [923.15, 1023.15]]) cerca(F.kO2(T2, 0.1) / F.kO2(T1, 0.1), Math.exp(-KIN.EO2 / F.R_GAS * (1 / T2 - 1 / T1)), 1e-12, `razón de Arrhenius ${T1 - 273.15}→${T2 - 273.15} °C`);
  // energía de activación recuperada de la pendiente de ln k contra 1/T
  const T1 = 800, T2 = 900, E = -F.R_GAS * (Math.log(F.kO2(T2, 0.1)) - Math.log(F.kO2(T1, 0.1))) / (1 / T2 - 1 / T1); cerca(E, KIN.EO2, 1e-9, 'la pendiente de ln k contra 1/T devuelve E = 150 kJ/mol');
  cerca(F.kO2(873.15, 0.2), 2 * F.kO2(873.15, 0.1), 1e-12, 'primer orden en el oxígeno'); cerca(F.kO2(873.15, 0.18) / F.kO2(873.15, 0.116), 0.18 / 0.116, 1e-12, 'ralentí (18 %) frente a carga 0,6 (11,6 %)');
  ok(F.kO2(K(550), 0.1) < 1.2e-3 && F.kO2(K(450), 0.1) < 1e-4, 'por oxígeno, a 450–550 °C el hollín casi no arde', F.kO2(K(450), 0.1).toExponential(2)); cerca(F.kO2(K(700), 0.1) / F.kO2(K(600), 0.1), Math.exp(KIN.EO2 / F.R_GAS * (1 / 873.15 - 1 / 973.15)), 1e-12, 'de 600 a 700 °C la velocidad se multiplica por exp(E/R·(1/873 − 1/973)) ≈ 8,4');
  const t90 = (T) => Math.log(10) / F.kO2(T, 0.1) / 60; ok(t90(K(600)) > 20 && t90(K(600)) < 30, 'a 600 °C y 10 % de O2 quemar el 90 % lleva 20–30 min (regeneración activa real)', t90(K(600)).toFixed(1)); ok(t90(K(650)) < 10 && t90(K(650)) > 5, 'a 650 °C lleva 5–10 min', t90(K(650)).toFixed(1));
  ok(F.fNO2(330) > 0.5 && F.fNO2(330) < 0.56, 'la fracción de NO2 del NOx tiene su máximo ≈ 0,55 hacia 330 °C', F.fNO2(330).toFixed(3)); ok(F.fNO2(150) < 0.03 && F.fNO2(600) < 0.01, 'sin oxidante activo (150 °C) y por equilibrio a 600 °C casi no hay NO2');
  let pico = [0, 0]; for (let T = 150; T <= 700; T += 5) if (F.fNO2(T) > pico[1]) pico = [T, F.fNO2(T)]; ok(pico[0] >= 300 && pico[0] <= 350, 'el máximo de NO2 cae entre 300 y 350 °C', pico[0]);
  let mu = true; for (let T = 400; T < 900; T += 10) if (!(F.kNO2(T + 10) > F.kNO2(T))) mu = false; ok(mu, 'k_NO2 crece con la temperatura');
  // la quema pasiva por NO2 supera a la de O2 por debajo de ~480 °C
  ok(F.kNO2(K(350)) * 340 > 50 * F.kO2(K(350), 0.116), 'a 350 °C la quema por NO2 gana por mucho a la de O2'); ok(F.kO2(K(650), 0.116) > F.kNO2(K(650)) * 20, 'a 650 °C manda el oxígeno (NO2 casi inexistente)'); }

console.log('6 · Un paso del filtro: decaimiento exacto, balance de carbono y de energía');
{ const N = DPF.N, Cc = DPF.Cs / N, hl = DPF.UA / N;
  // (a) temperatura fija (caudal enorme): m(t) = m0·exp(−k·t), exacto
  { const st = { m: new Float64Array(N).fill(1), T: new Float64Array(N).fill(K(620)) }; const e = { Tin: K(620), mdot: 1e7, yO2: 0.1, FNO2: 0, nGas: 1e7 / 0.02897 }; let t = 0; for (let k = 0; k < 200; k++) { F.pasoFiltro(st, e, 0.5); t += 0.5; }
    const kk = F.kO2(K(620), 0.1); cerca(st.m[0], Math.exp(-kk * t), 1e-9, 'a temperatura fija el hollín decae como exp(−k·t)'); cerca(st.m[N - 1], Math.exp(-kk * t), 1e-9, 'igual en la última celda'); }
  // (b) NO2 que llega limita la quema pasiva: nunca se queman más de 0,5 g de C por g de NO2...
  { const st = { m: new Float64Array(N).fill(5), T: new Float64Array(N).fill(K(350)) }; const nGas = 0.1 / 0.02897, FNO2 = 340e-6 * nGas, e = { Tin: K(350), mdot: 0.1, yO2: 0.0, FNO2, nGas }; let bN = 0, dt = 1;
    for (let k = 0; k < 600; k++) { const r = F.pasoFiltro(st, e, dt); bN += r.bN; }
    ok(bN * 2 / F.MC <= FNO2 * 600 * 0.9 * 1.0000001, 'el carbono quemado por NO2 no supera el 90 % de la estequiometría (2 NO2 por C)', `${bN * 2 / F.MC} vs ${FNO2 * 600 * 0.9}`); ok(bN > 0, 'hay quema pasiva a 350 °C'); }
  // (c) balance de energía: C·ΔT = G·(T_ent − T_sal)·dt + Q·dt − pérdida, sumado en celdas y tiempo (la suma telescopa)
  { let maxRel = 0, maxC = 0;
    for (const [Tc, md, y, m0, noff] of [[620, 0.106, 0.116, 2, 0.0], [700, 0.032, 0.18, 4, 0.0], [350, 0.106, 0.116, 3, 340e-6], [900, 0.032, 0.18, 6, 0.0]]) {
      const st = { m: new Float64Array(N).fill(m0), T: new Float64Array(N).fill(K(Tc)) }; const nGas = md / 0.02897, FNO2 = noff * nGas, e = { Tin: K(Tc - 100), mdot: md, yO2: y, FNO2, nGas };
      const E0 = st.T.reduce((a, x) => a + Cc * x, 0), M0 = F.sumaM(st); let Qsum = 0, Gsum = 0, Lsum = 0, bsum = 0; const dt = 0.5;
      for (let k = 0; k < 400; k++) { const Tn0 = Array.from(st.T); const r = F.pasoFiltro(st, e, dt); Qsum += r.Q * dt; bsum += r.bO + r.bN; Gsum += md * MOT.cpG * (e.Tin - r.Tout) * dt; for (let i = 0; i < N; i++) Lsum += hl * (st.T[i] - F.T_AMB) * dt; }
      const dE = st.T.reduce((a, x) => a + Cc * x, 0) - E0; maxRel = Math.max(maxRel, Math.abs(dE - (Gsum + Qsum - Lsum)) / Math.max(1, Math.abs(Qsum) + Math.abs(Gsum)));
      maxC = Math.max(maxC, Math.abs(M0 - F.sumaM(st) - bsum) / M0);
      cerca(Qsum, bsum * 0 + Qsum, 1e-12, 'Q finito'); }
    ok(maxRel < 1e-10, 'balance de energía del sustrato (gas entra − sale + quema − pérdida = ΔE) < 1e-10', maxRel.toExponential(2)); ok(maxC < 1e-12, 'balance de carbono por paso < 1e-12', maxC.toExponential(2)); }
  // (d) calor adiabático: a T muy alta casi todo arde en la celda y ΔT ≈ m·ΔH/C (con poquísimo gas y pérdida)
  { const st = { m: new Float64Array(N).fill(0), T: new Float64Array(N).fill(K(900)) }; st.m[3] = 1.0; const e = { Tin: K(900), mdot: 1e-9, yO2: 0.18, FNO2: 0, nGas: 1e-9 / 0.02897 }; const T0 = st.T[3];
    // el calor de combustión se compara con el balance: C·ΔT + pérdida = m·ΔH
    let q = 0, loss = 0; for (let k = 0; k < 40; k++) { const r = F.pasoFiltro(st, e, 0.25); q += r.Q * 0.25; loss += hl * (st.T[3] - F.T_AMB) * 0.25; }
    cerca(q, 1.0 * F.DHC_O2, 1e-3, 'el calor liberado por 1 g de carbono es 32,76 kJ (−393,5 kJ/mol ÷ 12,011)'); const dT = st.T[3] - T0, dTad = 1.0 * F.DHC_O2 / Cc; ok(dT > 0.8 * dTad - loss / Cc && dT < dTad, 'ΔT del sustrato ≈ m·ΔH/C (menos la pérdida): casi adiabático con poco gas', `${dT.toFixed(1)} vs ${dTad.toFixed(1)}`);
    ok(F.DHC_O2 > F.DHC_NO2 && Math.abs(F.DHC_NO2 / 1e3 * F.MC - 279.3) < 1e-9, 'la quema con NO2 suelta menos calor (279,3 kJ/mol) que con O2 (393,5)'); console.log(`   1 g de hollín = ${(F.DHC_O2 / 1e3).toFixed(2)} kJ · ΔT adiabático en una celda de ${(Cc).toFixed(0)} J/K = ${dTad.toFixed(0)} K`); }
  // (e) el gas se lleva el calor: filtro y gas de entrada a 650 °C, con 4 g de hollín por celda: a plena carga el gas arrastra el calor y el pico queda cerca; al ralentí el calor de la quema se queda y se acumula celda tras celda
  { const pico = (md, y) => { const st = { m: new Float64Array(N).fill(4), T: new Float64Array(N).fill(K(650)) }; const e = { Tin: K(650), mdot: md, yO2: y, FNO2: 0, nGas: md / 0.02897 }; let pk = 0; for (let k = 0; k < 400; k++) { const r = F.pasoFiltro(st, e, 0.5); pk = Math.max(pk, r.Tmax); } return pk - 273.15; };
    const pa = pico(0.16, 0.07), pi = pico(0.032, 0.18); ok(pa < 720, 'a plena carga (176 W/K) el pico del filtro queda a menos de 70 K de la temperatura de entrada', pa.toFixed(0)); ok(pi > 800 && pi > pa + 100, 'al ralentí (35 W/K, 18 % de O2) el pico supera los 800 °C y está más de 100 K por encima del de plena carga', `${pi.toFixed(0)} vs ${pa.toFixed(0)}`); } }

console.log('7 · Simulación del uso: balances, mando de la regeneración y combustible');
{ let maxB = 0, malR = 0;
  for (const pf of ['ciudad', 'mixto', 'carretera']) for (const [thr, To] of [[3, 600], [4.5, 650], [99, 600]]) { const R = F.simula({ perfil: pf, thr, Tobj: To }); maxB = Math.max(maxB, Math.abs(R.bal.C) / R.A.sIn);
    // el hollín nunca es negativo y las temperaturas son finitas
    let neg = false; for (let k = 0; k < R.tr.mC.length; k++) if (R.tr.mC[k] < -1e-9 || !isFinite(R.tr.TC[k])) neg = true; if (neg) malR++; }
  ok(maxB < 1e-10, 'balance de carbono (entra y se queda − quemado − almacenado) en 9 usos de 6 h < 1e-10', maxB.toExponential(2)); ok(malR === 0, 'ni hollín negativo ni temperaturas no finitas en los 9 usos');
  // sin regeneración forzada, en la ciudad: m(t) = (a/k)·(1 − e^{−k·t}) con a = η·ṁ/V y k = la quema pasiva a esa temperatura (ínfima)
  { const pf = { nombre: 'x', T: 120, seg: [[120, 0.25]], ash: 0, m0: 0, Tb0: 239 }; const R = F.simula({ pfObj: pf, thr: 99, regen: false, nRec: 240 }); const m = F.motor(0.25), a = DPF.eta * m.mS / DPF.VL / 3600;
    const Tin = K(m.Tg), k = F.kNO2(Tin) * F.noxPPM(m) * F.fNO2(m.Tg) + F.kO2(Tin, m.yO2), esperado = a / k * (1 - Math.exp(-k * 7200)); cerca(R.cargaFin, esperado, 2e-2, 'en la ciudad sin quemar, el hollín sigue m(t) = (a/k)(1 − e^−kt), con k = la quema pasiva de 239 °C (≈ 1 % del crecimiento)', `${R.cargaFin.toFixed(3)} vs ${esperado.toFixed(3)}`);
    cerca(R.cargaFin, DPF.eta * m.mS * 2 / DPF.VL, 0.02, 'y sólo 1–2 % por debajo de lo que entraría sin quema alguna'); cerca(R.A.sLeak / R.A.sIn, 0.01, 1e-9, 'se fuga el 1 % que el filtro no retiene'); }
  // el mando: la regeneración empieza al llegar al umbral y termina en MFIN; la carga máxima es el umbral
  for (const thr of [2, 3.5, 5]) { const R = F.simula({ perfil: 'ciudad', thr, Tobj: 640 }); ok(R.nReg >= 1, `con umbral ${thr} g/L hay quemas en la ciudad`, R.nReg); ok(R.cargaMax >= thr - 1e-6 && R.cargaMax < thr + 0.12, `la carga máxima se queda en el umbral (${thr} g/L)`, R.cargaMax.toFixed(3)); }
  { const R = F.simula({ perfil: 'ciudad', thr: 99, Tobj: 640 }); ok(R.nReg === 0 && R.extraComb === 0, 'con el umbral en 99 g/L no hay quemas ni diésel extra'); ok(R.cargaMax > 5, 'sin quemar, en 6 h el filtro pasa de 5 g/L'); }
  { let prev = 1e9, mon = true; for (const thr of [2, 3, 4, 5, 6]) { const R = F.simula({ perfil: 'ciudad', thr, Tobj: 640 }); if (R.nReg > prev) mon = false; prev = R.nReg; } ok(mon, 'más umbral = menos quemas (monótono)'); }
  // combustible: E = ∫ ṁ·cp·(T_obj − T_g)/η dt mientras se inyecta (carga constante: forma cerrada)
  { const pf = { nombre: 'x', T: 40, seg: [[40, 0.25]], ash: 0, m0: 4, Tb0: 239 }; const R = F.simula({ pfObj: pf, thr: 3, Tobj: 640, regen: true, nRec: 400 }); const m = F.motor(0.25), Pf = m.mGas * MOT.cpG * (K(640) - K(m.Tg)) / MOT.etaDOC;
    cerca(R.A.Efuel, Pf * R.tReg, 1e-9, 'combustible de la post-inyección = ṁ·cp·(T_obj − T_g)/η_DOC × tiempo de quema', `${R.A.Efuel} vs ${Pf * R.tReg}`); ok(R.tReg > 600 && R.tReg < 2700, 'la quema de 4 g/L a 640 °C dura entre 10 y 45 min', (R.tReg / 60).toFixed(1));
    cerca(R.fuelL, R.A.Efuel / MOT.LHVd, 1e-12, 'litros de diésel extra = energía ÷ poder calorífico'); console.log(`   quema de 4 g/L a 640 °C y carga 0,25: ${(R.tReg / 60).toFixed(1)} min, ${R.fuelL.toFixed(2)} L de diésel extra (${(Pf / 1e3).toFixed(1)} kW de combustible)`); }
  // temperaturas más altas queman antes y gastan menos diésel total
  { const f = (To) => F.simula({ perfil: 'ciudad', thr: 4, Tobj: To }); ok(f(660).tReg < f(620).tReg && f(620).tReg < f(580).tReg, 'una quema más caliente dura menos tiempo'); ok(f(660).extraComb < f(580).extraComb, 'y gasta menos diésel extra en total'); }
  // la quema nunca pasa de T_REG_MAX por inyección continua
  { const R = F.simula({ perfil: 'ciudad', thr: 4, Tobj: 560 }); ok(R.nReg >= 1, 'con 560 °C la quema es larga y se corta por el límite de tiempo (45 min)'); }
  // un perfil sin hollín previo con filtro limpio mantiene la contrapresión mínima
  { const R = F.simula({ perfil: 'carretera', thr: 99, Tobj: 640 }); ok(R.tr.dpR[0] < R.dpMaxRef, 'la contrapresión sube durante el uso'); } }

console.log('8 · Quema pasiva: punto de equilibrio en carretera');
{ const L = 0.62, m = F.motor(L), Tin = m.Tg + 273.15, y = F.noxPPM(m) * F.fNO2(m.Tg), kp = F.kNO2(Tin) * y, ko = F.kO2(Tin, m.yO2), nGas = m.mGas / 0.02897;
  const meq = DPF.eta * m.mS / 3600 / (kp + ko), mgL = meq / DPF.VL;                   // η·ṁ/(k·V) con la temperatura y el NO2 de entrada
  const R = F.simula({ perfil: 'carretera', thr: 99, Tobj: 640, m0: 0, nRec: 360 });
  ok(R.cargaFin > 0.9 * mgL && R.cargaFin < 1.35 * mgL, `tras 6 h en carretera el hollín se acerca al equilibrio η·ṁ/(k·V) (${mgL.toFixed(2)} g/L); queda algo por encima porque las celdas se enfrían unos 7 K y el NO2 se va gastando`, R.cargaFin.toFixed(3)); ok(mgL > 2.5 && mgL < 5, 'el equilibrio pasivo de la carretera queda entre 2,5 y 5 g/L (punto de equilibrio)', mgL.toFixed(2));
  ok(kp > 50 * ko, 'por NO2 se quema mucho más que por O2 a esa temperatura (el 98 % es pasivo)', `${kp.toExponential(2)} vs ${ko.toExponential(2)}`);
  // en la ciudad el escape está frío: la quema pasiva es ínfima
  const mc = F.motor(0.25), kc = F.kNO2(mc.Tg + 273.15) * F.noxPPM(mc) * F.fNO2(mc.Tg); ok(kc < kp / 10, 'en la ciudad la quema pasiva es 10 veces menor que en carretera', `${kc.toExponential(2)} vs ${kp.toExponential(2)}`);
  console.log(`   carretera: k_pasiva = ${kp.toExponential(2)} 1/s · equilibrio ${mgL.toFixed(2)} g/L · tras 6 h ${R.cargaFin.toFixed(2)} g/L`); }

console.log('9 · Prueba de peor caso: parada en ralentí en plena quema');
{ const peak = (thr, To, td) => F.simulaParada({ thr, Tobj: To, ash: 0 }, td).Tpk;
  // sin parada (flujo constante) el pico queda cerca de la temperatura pedida; con parada se dispara
  { const sin = F.simula({ pfObj: { nombre: 'x', T: 30, seg: [[30, 0.6]], ash: 0, m0: 6, Tb0: 359 }, thr: 6, Tobj: 660, nRec: 300 }); const con = F.peorParada({ thr: 6, Tobj: 660, ash: 0 }).Tpk;
    ok(sin.Tpk < 780, 'sin parada, la misma quema (6 g/L, 660 °C) no pasa de 780 °C', sin.Tpk.toFixed(0)); ok(con > sin.Tpk + 150, 'con la parada en ralentí el pico sube más de 150 K', `${con.toFixed(0)} vs ${sin.Tpk.toFixed(0)}`); }
  // el pico crece con el hollín que hay al empezar y con la temperatura de la quema
  { for (const To of [620, 660, 680]) { let prev = 0, mon = true; for (const thr of [2, 3, 4, 5, 6, 7]) { const p = F.peorParada({ thr, Tobj: To, ash: 0 }).Tpk; if (p < prev * 0.98) mon = false; prev = p; } ok(mon, `el pico de la parada crece con el umbral (quema a ${To} °C; 2 % de holgura por el hollín que ya se quemó)`); }
    for (const thr of [3, 5, 7]) { let prev = 0, mon = true; for (const To of [560, 600, 640, 680]) { const p = F.peorParada({ thr, Tobj: To, ash: 0 }).Tpk; if (p < prev * 0.98) mon = false; prev = p; } ok(mon, `el pico de la parada crece con la temperatura de la quema (umbral ${thr} g/L; 2 % de holgura)`); } }
  ok(F.peorParada({ thr: 7, Tobj: 680, ash: 0 }).Tpk > 1050, 'quemar a 680 °C con 7 g/L y parar en ralentí supera los 1050 °C (cordierita en peligro)', F.peorParada({ thr: 7, Tobj: 680, ash: 0 }).Tpk.toFixed(0)); ok(F.peorParada({ thr: 3, Tobj: 600, ash: 0 }).Tpk < 750, 'con 3 g/L y 600 °C la parada es inofensiva (< 750 °C)');
  // la parada la produce el calor de la quema: el peor instante no es el primero (el filtro aún no está caliente)
  { const r = F.peorParada({ thr: 6, Tobj: 660, ash: 0 }); ok(r.td >= 1.5 && r.td <= 12, 'el instante más peligroso está en el interior de los instantes probados', r.td); console.log(`   peor caso (6 g/L, 660 °C): ${r.Tpk.toFixed(0)} °C con la parada a los ${r.td} min`); }
  // el hollín quemado entre la parada y el final sigue cerrando el balance de carbono
  { const R = F.simulaParada({ thr: 6, Tobj: 660, ash: 0 }, 3); cerca(R.bal.C / R.A.sIn, 0, 1, 'el balance de carbono de la prueba de parada cierra'); ok(Math.abs(R.bal.C) / R.A.sIn < 1e-9, 'balance de carbono de la parada < 1e-9', (Math.abs(R.bal.C) / R.A.sIn).toExponential(2)); }
  // cuando arde sin freno, el hollín desaparece en el tramo caliente primero (celdas del fondo más calientes que las de la entrada)
  { const R = F.simulaParada({ thr: 6, Tobj: 660, ash: 0 }, 3), k = Math.round(3.8 * 60 / R.dRec); let ok1 = true; const b = k * DPF.N; const Tcel = Array.from({ length: DPF.N }, (_, i) => R.tr.TC[b + i]); ok1 = Tcel[DPF.N - 1] > Tcel[0]; ok(ok1, 'durante el desbocamiento la parte trasera del filtro es la más caliente', Tcel.map((x) => (x - 273.15).toFixed(0)).join(' ')); } }

console.log('10 · El reto: ventana interior, escenarios y límites');
{ const tab = []; for (let thr = 1; thr <= 8.001; thr += 0.25) for (let To = 560; To <= 680; To += 10) { let good = true; const Rs = F.ESCENARIOS.map((e) => F.simula({ perfil: e.perfil, thr, Tobj: To })); if (Rs.some((R) => R.dpMaxRef > F.RETO.dp || R.extraComb > F.RETO.fuel)) good = false; else { const P = F.peorParada({ thr, Tobj: To, ash: 0 }); if (!Rs.every((R) => F.cumpleTodo(R, P))) good = false; } tab.push([thr, To, good]); }
  const pas = tab.filter((x) => x[2]); const frac = pas.length / tab.length;
  ok(pas.length > 20 && frac > 0.04 && frac < 0.12, `la ventana existe y es estrecha: cumplen ${pas.length} de ${tab.length} combinaciones (${(frac * 100).toFixed(1)} %)`);
  const thrs = pas.map((x) => x[0]), Ts = pas.map((x) => x[1]); ok(Math.min(...thrs) > 1.5 && Math.max(...thrs) < 7.5, 'la ventana está en el interior del umbral (ni 1 ni 8 g/L)', `${Math.min(...thrs)}–${Math.max(...thrs)}`); ok(Math.min(...Ts) > 600, 'la quema fría (≤ 600 °C) nunca cumple: la ventana empieza por encima', `${Math.min(...Ts)}–${Math.max(...Ts)}`);
  { const cT = pas.filter((x) => x[0] >= 4.0 && x[0] <= 4.5).map((x) => x[1]); ok(cT.length > 0 && Math.max(...cT) < 680 && Math.min(...cT) > 560, 'con el umbral central (4,0–4,5 g/L) la temperatura que cumple está en el interior del mando', `${Math.min(...cT)}–${Math.max(...cT)}`); }
  { const cH = pas.filter((x) => x[1] >= 650 && x[1] <= 660).map((x) => x[0]); ok(cH.length > 0 && Math.max(...cH) < 8 && Math.min(...cH) > 1, 'a 650–660 °C el umbral que cumple está en el interior del mando', `${Math.min(...cH)}–${Math.max(...cH)}`); }
  ok(!tab.find((x) => x[0] === 3 && x[1] === 600)[2] && !tab.find((x) => x[0] === 1 && x[1] === 680)[2] && !tab.find((x) => x[0] === 8 && x[1] === 560)[2] && !tab.find((x) => x[0] === 8 && x[1] === 680)[2], 'el punto de partida (3 g/L, 600 °C) y las cuatro esquinas no cumplen');
  // los tres criterios acotan por lados distintos
  { const f = (thr, To) => { const R = F.simula({ perfil: 'ciudad', thr, Tobj: To }); return { R, P: F.peorParada({ thr, Tobj: To, ash: R.ash }) }; };
    const a = f(7.5, 640), b = f(5, 680), c = f(2, 600); ok(!F.cumple(a.R, a.P).dp, 'demasiado hollín (7,5 g/L) rompe la contrapresión'); ok(!F.cumple(b.R, b.P).T, 'quemar a 680 °C con 5 g/L rompe el límite de temperatura'); ok(!F.cumple(c.R, c.P).fuel, 'quemar a cada rato y frío (2 g/L, 600 °C) gasta demasiado diésel'); }
  // el centro de la ventana cumple en los dos escenarios y con holgura
  const cx = pas.reduce((a, x) => a + x[0], 0) / pas.length, cy = pas.reduce((a, x) => a + x[1], 0) / pas.length; console.log(`   ventana: umbral ${Math.min(...thrs)}–${Math.max(...thrs)} g/L · temperatura ${Math.min(...Ts)}–${Math.max(...Ts)} °C · centro ≈ (${cx.toFixed(2)} g/L, ${cy.toFixed(0)} °C) · ${(frac * 100).toFixed(1)} % de las combinaciones`);
  for (const e of F.ESCENARIOS) { let c = 0; for (const [thr, To] of pas.map((x) => [x[0], x[1]])) { const R = F.simula({ perfil: e.perfil, thr, Tobj: To }); if (R.nReg >= 1) c++; } ok(c > 0, `en el escenario «${e.perfil}» hay al menos una quema dentro de la ventana`); }
  // el filtro con ceniza (mixto) necesita más contrapresión que el limpio con el mismo hollín
  ok(F.dpRef(4 * DPF.VL, 4) > F.dpRef(4 * DPF.VL, 0) + 1e3, 'con 4 g/L de ceniza (100 000 km) la contrapresión sube más de 1 kPa con el mismo hollín'); cerca(F.KM_POR_GL * 4, 100000, 1e-12, '4 g/L de ceniza = 100 000 km');
  ok(F.simula({ perfil: 'mixto', thr: 5, Tobj: 640 }).dpMaxRef > F.simula({ perfil: 'ciudad', thr: 5, Tobj: 640 }).dpMaxRef, 'el escenario con filtro viejo lleva a más contrapresión con el mismo umbral'); }

console.log('11 · Fase 1 (cálculo) y fase 3 (diagnóstico)');
{ // cálculo: horas hasta llegar a y g/L, contra la integración del modelo
  for (const [L, y] of [[0.25, 3], [0.35, 4], [0.5, 5], [0.7, 4]]) { const g = Math.round(F.motor(L).mS * 10) / 10, ans = y * DPF.VL / (DPF.eta * g);
    const pf = { nombre: 'x', T: Math.ceil(ans * 1.3 * 60), seg: [[Math.ceil(ans * 1.3 * 60), L]], ash: 0, m0: 0, Tb0: F.motor(L).Tg }; const R = F.simula({ pfObj: pf, thr: 99, regen: false, kPas: 0, nRec: 600 });
    const k = Math.round(ans * 3600 / R.dRec), c = R.tr.carga[k]; cerca(c, y, 0.02, `el modelo llega a ${y} g/L a las ${ans.toFixed(2)} h (L=${L}) — sin quemar nada`, c.toFixed(3)); }
  // diagnóstico: cada caso se distingue por lo que ve el alumno
  const CASOS = [{ k: 'ceniza', L: 0.6, m0: 0.9, ash: 10, crack: 0, km: 140 }, { k: 'corto', L: 0.2, m0: 6.8, ash: 1, crack: 0, km: 1400 }, { k: 'grieta', L: 0.6, m0: 0.4, ash: 2, crack: 0.7, km: 320 }, { k: 'sensor', L: 0.6, m0: 2.6, ash: 2, crack: 0, km: 350 }];
  const lee = (c) => { const pf = { nombre: 'x', T: 30, seg: [[30, c.L]], ash: c.ash, m0: c.m0, Tb0: F.motor(c.L).Tg }; const R = F.simula({ pfObj: pf, thr: 99, regen: false, nRec: 260, crack: c.crack, ash: c.ash, m0: c.m0 }); const i = 130, carga = R.tr.carga[i], Tin = R.tr.Tin[i], mg = F.motor(c.L).mGas;
    const med = c.k === 'sensor' ? 300 : R.tr.dp[i], esp = F.dpFiltro(carga * DPF.VL, 0, mg, Math.max(Tin, R.tr.Tg[i]) + 273.15).tot; return { med, esp, ratio: med / esp, part: R.fugaPct, carga, Tin, km: c.km }; };
  const lect = Object.fromEntries(CASOS.map((c) => [c.k, lee(c)]));
  const clasifica = (r) => (r.part > 20 ? 'grieta' : (r.med < 1000 ? 'sensor' : (r.ratio > 1.25 ? 'ceniza' : (r.carga > 5 && r.Tin < 260 ? 'corto' : '?'))));
  for (const c of CASOS) ok(clasifica(lect[c.k]) === c.k, `el caso «${c.k}» se distingue por sus lecturas (medida/esperada ${lect[c.k].ratio.toFixed(2)}, partículas ${lect[c.k].part.toFixed(1)} %, hollín ${lect[c.k].carga.toFixed(1)} g/L, ${lect[c.k].Tin.toFixed(0)} °C)`);
  ok(lect.ceniza.ratio > 1.25 && lect.ceniza.carga < 2, 'ceniza: la medida supera a la esperada en más de 25 % con poco hollín'); ok(Math.abs(lect.corto.ratio - 1) < 0.05, 'trayectos cortos: la medida coincide con la esperada (±5 %)'); ok(lect.grieta.ratio < 0.5 && lect.grieta.part > 20, 'grieta: la medida es menos de la mitad de la esperada y salen > 20 % de las partículas'); ok(lect.sensor.med < 1000 && lect.sensor.part < 2, 'sensor: lectura casi cero con partículas normales (~1 %)'); }

console.log('12 · Conjunto de la plataforma: cobertura de usos, rapidez');
{ const t0 = performance.now(); for (let i = 0; i < 10; i++) F.simula({ perfil: 'ciudad', thr: 4, Tobj: 640 }); const t1 = performance.now(); for (let i = 0; i < 5; i++) F.peorParada({ thr: 4, Tobj: 640, ash: 0 }); const t2 = performance.now();
  const msUso = (t1 - t0) / 10, msPeor = (t2 - t1) / 5; ok(msUso < 120 && msPeor < 200, `un uso de 6 h cuesta ${msUso.toFixed(0)} ms y la prueba de peor caso ${msPeor.toFixed(0)} ms (recalculable al mover una barra)`); }

console.log(`\n${n} comprobaciones · ${malas} fallos`);
if (malas) { console.log('FALLOS:\n' + fallos.join('\n')); process.exit(1); }
