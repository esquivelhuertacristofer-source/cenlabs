// Verificación de la física de «Soldadura por puntos robotizada: calor, fuerza y tamaño de la pepita» (mecanica-165).
// Extrae los bloques /* FISICA:INICIO */…/* FISICA:FIN */ y /* IKROBOT:INICIO */…/* IKROBOT:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y los
// contrasta con formas cerradas (d_mín = 4·√t, d_salpica = √(4F/πp), Q = I²Rt, la exponencial de la zona calentada, la ventana de la pepita), con la
// integración numérica independiente (RK4) de las mismas ecuaciones, con la conservación de la energía (Q = fuga + zona + pepita), con la monotonía física
// (más corriente, más tiempo o menos fuerza dan más pepita; más fuerza baja la resistencia), con el diseño del reto (nada se cumple «de fábrica», la ventana
// de corriente es INTERIOR, cada diagnóstico tiene su firma y se arregla con su remedio) y con la cinemática inversa (cierra contra una cinemática directa escrita aparte).
// uso: node scripts/auditoria/verifica-soldadura-por-puntos-robotizada.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/soldadura-por-puntos-robotizada.html');
const html = readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,clamp,HZ,T_CHAPA,T_APILA,D_MIN_MM,D_ELEC_NUEVO,F_DESGASTE,RHO_ACERO,C_ACERO,L_FUSION,T_FUS,T_AMB,DT_FUS,H_PEPITA,RHO_CALIENTE,RC0,F_REF,N_RC,G0,BETA,KAPPA,P_POOL,FRAC_EXP,P_SHUNT_MM,I_IND0,K_IND,IND_MAX,H_PEP,dCara,dMinCalidad,dExpulsion,rBulto,rContacto,resistencia,fracDeriv,corrienteEf,calorJoule,energiaPepita,dDeVol,volDeD,prepara,estadoEn,DEFECTOS,resultado,curvaD};`)();
const IK = new Function(html.split('/* IKROBOT:INICIO */')[1].split('/* IKROBOT:FIN */')[0] + ';return {IKM,ikPunto};')();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0])();
const CASOS_DX = evalBloque('const CASOS_DX=', ';\nconst NOMBRE_DX');
const CASOS_1 = evalBloque('const CASOS_1=', ';\nfunction resCaso1');
const ESC_RETO = evalBloque('const ESC_RETO=', ';\n\n/* ---------- Fase 1');
const barajar = new Function('return ' + html.split('const barajar=')[1].split(';\nconst RETOS')[0])();
const TOUR_PARS = [...html.matchAll(/par:P\(([\d.]+),(\d+),([\d.]+),(true|false),(\d+)\)/g)].map((m) => ({ I: +m[1] * 1000, n: +m[2], F: +m[3] * 1000, desg: m[4] === 'true', paso: +m[5] }));
const QUIZ = evalBloque('const QUIZ=', ';\nfunction iniciaQuiz');

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol rel ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const par = (I, nn, f, desg = false, paso = 40) => ({ I: I * 1000, n: nn, F: f * 1000, desg, paso });
/** RK4 genérico de y' = f(y) desde y0 durante h·N. */
const rk4 = (f, y0, T, N = 4000) => { let y = y0; const h = T / N; for (let i = 0; i < N; i++) { const k1 = f(y), k2 = f(y + h / 2 * k1), k3 = f(y + h / 2 * k2), k4 = f(y + h * k3); y += h / 6 * (k1 + 2 * k2 + 2 * k3 + k4); } return y; };

console.log('1 · Criterio de calidad, constantes y geometría de la pepita');
absc(F.D_MIN_MM, 4 * Math.sqrt(0.8), 1e-12, 'd_mín = 4·√0,8 = 3,578 mm'); absc(F.D_MIN_MM, 3.5777, 1e-3, 'd_mín vale 3,58 mm');
for (const t of [0.6, 0.8, 1, 1.2, 1.5, 2]) cerca(F.dMinCalidad(t), 4 * Math.sqrt(t), 1e-12, `d_mín(${t} mm) = 4·√t`);
ok(F.dMinCalidad(2) > F.dMinCalidad(1) && F.dMinCalidad(2) < 2 * F.dMinCalidad(1), 'al doble de espesor, la pepita pedida crece menos del doble (raíz)');
cerca(F.D_ELEC_NUEVO, 5 * Math.sqrt(0.8) * 1e-3, 1e-12, 'cara del electrodo nuevo 5·√t'); cerca(F.dCara(true) / F.dCara(false), F.F_DESGASTE, 1e-12, 'el desgaste ensancha la cara'); ok(F.dCara(true) > 6e-3 && F.dCara(true) < 7e-3, 'cara desgastada ≈ 6,5 mm');
cerca(F.H_PEP, F.RHO_ACERO * (F.C_ACERO * (F.T_FUS - F.T_AMB) + F.L_FUSION), 1e-12, 'entalpía por volumen de pepita: ρ·(c·ΔT + L)'); ok(F.H_PEP > 9e9 && F.H_PEP < 1.2e10, 'H_pepita ≈ 1,0·10¹⁰ J/m³');
for (const d of [1e-3, 3.58e-3, 5e-3, 7e-3]) { cerca(F.dDeVol(F.volDeD(d)), d, 1e-12, `V ↔ d es biyectivo (${d * 1e3} mm)`); }
cerca(F.volDeD(4e-3), Math.PI / 6 * 16e-6 * F.H_PEPITA, 1e-12, 'V = (π/6)·d²·H (elipsoide achatado)'); cerca(F.H_PEPITA, 0.8 * F.T_APILA, 1e-12, 'H = 80 % del espesor total');
{ const E4 = F.energiaPepita(F.volDeD(4e-3)); ok(E4 > 90 && E4 < 140, 'fundir una pepita de 4 mm cuesta ~110 J', E4.toFixed(1)); cerca(F.energiaPepita(2e-8), 2 * F.energiaPepita(1e-8), 1e-12, 'la energía de pepita es lineal en el volumen'); }

console.log('2 · Salpicadura: la fuerza contiene un baño de hasta d = √(4F/(π·p))');
for (const f of [1000, 2000, 3000, 4500]) { const d = F.dExpulsion(f); cerca(Math.PI / 4 * d * d * F.P_POOL, f, 1e-12, `p·(π/4)d² = F (${f} N)`); }
ok(F.dExpulsion(2000) > F.dExpulsion(1000) && F.dExpulsion(4000) > F.dExpulsion(2000), 'más fuerza contiene un baño mayor');
cerca(F.dExpulsion(4 * 1000), 2 * F.dExpulsion(1000), 1e-12, 'al cuádruple de fuerza, el doble de diámetro');
{ const Fmin = Math.PI / 4 * (F.D_MIN_MM * 1e-3) ** 2 * F.P_POOL; ok(Fmin > 900 && Fmin < 1100, `por debajo de ~1,0 kN ninguna pepita buena cabe sin salpicar (F_mín = ${Fmin.toFixed(0)} N)`);
  let buenas = 0; for (let I = 4; I <= 15; I += 0.25) for (let nn = 2; nn <= 30; nn += 2) if (F.resultado(par(I, nn, 0.95)).ok) buenas++; ok(buenas === 0, 'con 0,95 kN no hay ninguna combinación buena (teorema: el límite de salpicadura queda bajo el mínimo)'); }

console.log('3 · Resistencia: bulto + contacto, y cómo baja con la fuerza');
{ const dE = F.D_ELEC_NUEVO, r = F.resistencia(3000, dE);
  cerca(r.Rb, F.RHO_CALIENTE * F.T_APILA / (Math.PI / 4 * dE * dE), 1e-12, 'R_bulto = ρ·L/A'); cerca(r.Rc, 70e-6, 1e-12, 'R_contacto(3 kN) = 70 µΩ'); cerca(r.R, r.Rb + r.Rc, 1e-12, 'R = R_bulto + R_contacto'); ok(r.R > 150e-6 && r.R < 220e-6, 'R total ≈ 180 µΩ (orden de magnitud de la soldadura por puntos)', (r.R * 1e6).toFixed(1));
  cerca(F.rContacto(6000) / F.rContacto(3000), Math.pow(2, -F.N_RC), 1e-12, 'al doble de fuerza, la resistencia de contacto baja ×2^−0,7');
  let mono = true; for (let f = 1000; f < 5000; f += 100) if (F.rContacto(f + 100) >= F.rContacto(f)) mono = false; ok(mono, 'la resistencia de contacto baja siempre al apretar más');
  ok(F.resistencia(3000, F.dCara(true)).Rb < F.resistencia(3000, F.dCara(false)).Rb, 'un electrodo ancho tiene menos resistencia de bulto (más área)'); }

console.log('4 · Derivación de corriente por el punto vecino');
for (const p of [15, 22, 30, 40, 60, 90]) cerca(F.fracDeriv(p), 1 / (1 + p / 4.5), 1e-12, `fracción derivada a ${p} mm`);
{ let mono = true; for (let p = 10; p < 100; p += 5) if (F.fracDeriv(p + 5) >= F.fracDeriv(p)) mono = false; ok(mono, 'más lejos, menos derivación'); }
ok(F.fracDeriv(15) > 0.2 && F.fracDeriv(15) < 0.26 && F.fracDeriv(60) < 0.08, 'a 15 mm se pierde ~23 %; a 60 mm menos de 8 %');
cerca(F.corrienteEf(9000, 40), 9000 * (1 - F.fracDeriv(40)), 1e-12, 'I_punto = I·(1 − fracción)'); ok(F.corrienteEf(9000, 15) < F.corrienteEf(9000, 60) && F.corrienteEf(9000, 15) < 9000, 'la corriente en el punto es menor que la del robot y crece con la separación');
absc(F.corrienteEf(9000, 1e9) / 9000, 1, 1e-6, 'sin vecino cercano, llega toda');

console.log('5 · Calor de Joule y calor acumulado');
cerca(F.calorJoule(9000, 182e-6, 0.2), 81e6 * 182e-6 * 0.2, 1e-12, 'Q = I²·R·t'); cerca(F.calorJoule(18000, 150e-6, 0.1), 4 * F.calorJoule(9000, 150e-6, 0.1), 1e-12, 'el doble de corriente da 4× calor'); cerca(F.calorJoule(9000, 150e-6, 0.2), 2 * F.calorJoule(9000, 150e-6, 0.1), 1e-12, 'el doble de tiempo da 2× calor');
{ const S = F.prepara(par(9, 12, 3)); const e = F.estadoEn(S, S.tw); cerca(e.Q, F.calorJoule(S.Ie, S.Re.R, S.tw), 1e-12, 'el calor acumulado del motor es I²·R·t con la corriente que llega'); absc(S.tw, 0.2, 1e-12, '12 ciclos a 60 Hz = 0,2 s'); cerca(S.P, S.Ie * S.Ie * S.Re.R, 1e-12, 'P = I²·R'); }

console.log('6 · La zona calentada: exponencial exacta contra RK4');
{ // C·dT/dt = P − G·(T − T0): solución T = T0 + (P/G)(1 − e^(−t/τ)), τ = C/G
  const S = F.prepara(par(7.2, 14, 3, false, 1e9)); const C = S.C, G = S.G, P = S.P;
  cerca(S.tau, C / G, 1e-12, 'τ = C/G'); absc(S.tau, 0.0476, 0.01, 'τ ≈ 50 ms'); cerca(S.Tinf, F.T_AMB + P / G, 1e-12, 'T∞ = T0 + P/G');
  const S2 = F.prepara(par(4.2, 14, 3)); ok(!S2.hay, 'con poca corriente T∞ < T_fusión (nunca funde)');
  for (const t of [0.005, 0.02, 0.05]) { const T = F.estadoEn(S2, t).T; cerca(T, rk4((x) => (S2.P - S2.G * (x - F.T_AMB)) / S2.C, F.T_AMB, t), 1e-9, `T(t=${t}) exponencial = RK4 (sin fusión)`); }
  ok(S.hay, 'con 7,2 kA en el punto sí funde'); cerca(F.estadoEn(S, S.tm).T, F.T_FUS, 1e-9, 't_fusión: la zona llega justo a 1500 °C'); { const eAntes = F.estadoEn(S, S.tm * 0.999); ok(eAntes.T < F.T_FUS && eAntes.V === 0, 'antes de t_fusión no hay pepita'); }
  cerca(rk4((x) => (S.P - S.G * (x - F.T_AMB)) / S.C, F.T_AMB, S.tm), F.T_FUS, 1e-6, 'RK4 también llega a 1500 °C en t_fusión');
}
{ // umbral de fusión: I₀ = √(G·ΔT/R) con la corriente que llega al punto
  const S = F.prepara(par(9, 12, 3, false, 1e9)); const I0 = Math.sqrt(S.G * F.DT_FUS / S.Re.R);
  ok(!F.prepara({ I: I0 * 0.999, n: 12, F: 3000, desg: false, paso: 1e9 }).hay, 'justo por debajo de I₀ no funde'); ok(F.prepara({ I: I0 * 1.001, n: 12, F: 3000, desg: false, paso: 1e9 }).hay, 'justo por encima de I₀ funde');
  ok(I0 > 4000 && I0 < 5500, 'corriente umbral ≈ 4,6 kA (sin derivación)', (I0 / 1000).toFixed(2)); }

console.log('7 · Pepita: crecimiento exacto contra RK4 y conservación de la energía');
for (const [I, nn, f] of [[8, 12, 3], [9, 12, 3], [10, 8, 3.5], [8.5, 20, 4]]) {
  const S = F.prepara(par(I, nn, f)); if (!S.hay) { ok(false, 'este caso debería fundir'); continue; }
  const tf = Math.min(S.tw, S.texp === Infinity ? S.tw : S.texp * 0.999); const e = F.estadoEn(S, tf);
  // V' = (P − G(1+βV/Vz)·ΔT)/(κ·H) desde t_fusión
  const rkV = rk4((v) => (S.P - S.G * (1 + F.BETA * v / S.Vz) * F.DT_FUS) / (F.KAPPA * F.H_PEP), 0, tf - S.tm, 3000);
  cerca(e.V, rkV, 1e-6, `V(t) exponencial = RK4 (I=${I} kA, ${nn} ciclos, ${f} kN)`);
  // conservación: Q = fuga + zona + pepita(+anillo)
  let Eloss = 0; const N = 6000; const g = (t) => { const s = F.estadoEn(S, t); const Gs = (s.V > 0 ? S.G * (1 + F.BETA * s.V / S.Vz) : S.G); return Gs * (s.T - F.T_AMB); };
  for (let i = 0; i < N; i++) { const t0 = tf * i / N, t1 = tf * (i + 1) / N; Eloss += (g(t0) + g(t1)) / 2 * (t1 - t0); }
  cerca(e.Q, Eloss + e.Ealm + e.En, 2e-3, `Q = fuga + zona + pepita (I=${I} kA, ${nn} ciclos): conservación de la energía`);
  ok(e.En < 0.2 * e.Q, 'a la pepita llega menos del 20 % del calor');
}
{ const S = F.prepara(par(9, 12, 3)); cerca(S.Vinf, S.Vz * (S.P / (S.G * F.DT_FUS) - 1) / F.BETA, 1e-12, 'V∞ = V_zona·(P/(G·ΔT) − 1)/β'); cerca(S.taun, F.KAPPA * F.H_PEP * S.Vz / (S.G * F.DT_FUS * F.BETA), 1e-12, 'τ_pepita = κ·H·V_z/(G·ΔT·β)'); }

console.log('8 · Monotonía física: corriente, tiempo, fuerza');
{ let m1 = true, m2 = true, m3 = true, p = -1;
  for (let I = 6.5; I <= 10; I += 0.1) { const r = F.resultado(par(I, 12, 3.5)); if (!r.exp && r.dmm + 1e-9 < p) m1 = false; if (!r.exp) p = r.dmm; if (r.exp) break; } ok(m1, 'más corriente, más pepita (hasta que salpica)');
  p = -1; for (let nn = 2; nn <= 30; nn++) { const r = F.resultado(par(9, nn, 3)); if (r.dmm + 1e-9 < p) m2 = false; p = r.dmm; } ok(m2, 'más tiempo, más pepita (nunca baja)');
  let prev = Infinity; for (let f = 1; f <= 5; f += 0.25) { const R = F.resistencia(f * 1000, F.D_ELEC_NUEVO).R; if (R >= prev) m3 = false; prev = R; } ok(m3, 'más fuerza, menos resistencia');
  const a = F.resultado(par(9, 8, 3)), b = F.resultado(par(9, 12, 3)); ok(b.Q > a.Q && b.dmm >= a.dmm, 'más ciclos: más calor y pepita no menor');
  let mi = true, q = -1; for (let nn = 2; nn <= 30; nn++) { const r = F.resultado(par(9, nn, 3)); if (r.ind + 1e-12 < q) mi = false; q = r.ind; } ok(mi, 'el hundimiento nunca baja al alargar el pulso'); }
{ const lo = F.resultado(par(9, 12, 1.5)), hi = F.resultado(par(9, 12, 3.5)); ok(lo.exp && !hi.exp, 'con poca fuerza salpica; con más fuerza, no (a igual corriente y tiempo)'); ok(F.prepara(par(9, 12, 1.5)).texp < Infinity, 'la expulsión tiene instante definido'); }
{ const S = F.prepara(par(11, 12, 2.2)); ok(S.texp < S.tw, 'a 11 kA y 2,2 kN el baño toca el límite dentro del pulso'); if (S.texp < S.tw) { const e = F.estadoEn(S, S.texp * 0.9999); const e2 = F.estadoEn(S, S.texp * 1.0001); cerca(e.V, F.volDeD(S.dexp), 2e-3, 'justo antes de la expulsión el baño mide d_exp'); ok(e2.exp && e2.V < e.V, 'tras expulsar queda un volumen menor'); cerca(e2.V, F.FRAC_EXP * F.volDeD(S.dexp), 1e-9, 'queda el 85 % del volumen'); } }

console.log('9 · Quemado e indentación');
{ const nB = (() => { for (let nn = 2; nn <= 60; nn++) if (F.resultado(par(9, nn, 3, false, 40)).def === 'quemada') return nn; return null; })(); ok(nB !== null && nB > 12 && nB < 24, `a 9 kA y 3 kN, el pulso se pasa de largo a partir de ${nB} ciclos`);
  const r = F.resultado(par(9, 26, 3)); ok(r.dmm >= F.D_MIN_MM && r.ind > F.IND_MAX && !r.exp, 'con 26 ciclos la pepita sí es buena (≥ mín) pero el hundimiento pasa del 25 %'); cerca(r.ind, F.I_IND0 + F.K_IND * (r.S.tw - r.S.tm) * Math.sqrt(1), 1e-9, 'indentación = 4 % + 0,9·t_fundido·√(F/F_ref)'); }

console.log('10 · Diseño del reto: nada se cumple de fábrica y la ventana es interior');
for (const e of ESC_RETO) {
  const p0 = { I: 6000, n: 6, F: 2000, desg: e.desg, paso: e.paso }; ok(!F.resultado(p0).ok, `escenario «${e.id}»: el ajuste inicial (6 kA, 6 ciclos, 2 kN) no cumple`);
  let alguna = false, interior = true; const anchos = [];
  for (const [nn, f] of [[8, 2.5], [10, 3], [12, 3], [12, 2.5], [10, 3.5], [14, 3]]) {
    const L = []; for (let i = 40; i <= 180; i++) if (F.resultado({ I: i * 100, n: nn, F: f * 1000, desg: e.desg, paso: e.paso }).ok) L.push(i); if (!L.length) continue; alguna = true;
    const a = L[0], b = L[L.length - 1]; if (a <= 40 || b >= 180) interior = false; anchos.push((b - a) / 10);
    if (a > 40) ok(F.resultado({ I: (a - 1) * 100, n: nn, F: f * 1000, desg: e.desg, paso: e.paso }).def === 'pegada', `«${e.id}» n=${nn} F=${f}: justo por debajo de la ventana queda pegada`);
    if (b < 180) ok(['salpica', 'quemada'].includes(F.resultado({ I: (b + 1) * 100, n: nn, F: f * 1000, desg: e.desg, paso: e.paso }).def), `«${e.id}» n=${nn} F=${f}: justo por encima de la ventana salpica o quema`);
  }
  ok(alguna, `escenario «${e.id}»: existe al menos una combinación buena`); ok(interior, `escenario «${e.id}»: la ventana de corriente es INTERIOR al rango del mando (4–18 kA)`);
  ok(Math.max(...anchos) >= 1.5, `escenario «${e.id}»: la ventana más ancha mide ≥ 1,5 kA`, anchos.map((a) => a.toFixed(1)).join('/'));
}
{ const ini = (e, nn, f) => { for (let i = 40; i <= 180; i++) if (F.resultado({ I: i * 100, n: nn, F: f * 1000, desg: e.desg, paso: e.paso }).ok) return i / 10; return null; };
  const a0 = ini(ESC_RETO[0], 12, 3), a1 = ini(ESC_RETO[1], 12, 3), a2 = ini(ESC_RETO[2], 12, 3); ok(a1 - a0 >= 2, `el electrodo desgastado exige ≥ 2 kA más (${a0} → ${a1})`); ok(a2 - a0 >= 0.4, `con un vecino a 22 mm hace falta más corriente (${a0} → ${a2})`); }
{ // la respuesta de un escenario NO sirve del todo en otro
  const nuevo = ESC_RETO[0], gastado = ESC_RETO[1]; let sirve = 0, tot = 0; for (let i = 40; i <= 180; i++) for (const nn of [10, 12, 14]) for (const f of [2.5, 3, 3.5]) { if (F.resultado({ I: i * 100, n: nn, F: f * 1000, desg: nuevo.desg, paso: nuevo.paso }).ok) { tot++; if (F.resultado({ I: i * 100, n: nn, F: f * 1000, desg: gastado.desg, paso: gastado.paso }).ok) sirve++; } }
  ok(tot > 0 && sirve < tot * 0.35, `la receta del electrodo nuevo sirve sólo en parte con el gastado (${sirve}/${tot})`); }

console.log('11 · Diagnóstico: cada causa tiene su firma y su remedio');
{ const R = Object.fromEntries(CASOS_DX.map((c) => [c.k, F.resultado({ I: c.I * 1000, n: c.n, F: c.F * 1000, desg: c.desg, paso: c.paso })])); const C = Object.fromEntries(CASOS_DX.map((c) => [c.k, c]));
  ok(CASOS_DX.length === 5, 'hay cinco causas'); ok(R.poca.def === 'pegada' && R.poca.dmm > 0 && R.poca.S.Ie / (C.poca.I * 1000) > 0.88 && !R.poca.S.par.desg, 'poca energía: pegada, llega ≥ 88 % de la corriente y el electrodo es nuevo');
  ok(R.deriva.def === 'pegada' && R.deriva.S.Ie / (C.deriva.I * 1000) < 0.8 && C.deriva.paso <= 22, 'deriva: pegada, llega menos del 80 % de la corriente y el vecino está a ≤ 22 mm');
  ok(R.gastado.def === 'pegada' && R.gastado.S.dE > 6e-3 && R.gastado.S.Ie / (C.gastado.I * 1000) > 0.85, 'electrodo gastado: pegada, cara > 6 mm y llega ≥ 85 % de la corriente');
  ok(R.salpica.def === 'salpica' && R.salpica.exp && R.salpica.S.texp < R.salpica.S.tw, 'salpicadura: el baño toca el límite antes de terminar el pulso');
  ok(R.quemada.def === 'quemada' && R.quemada.dmm >= F.D_MIN_MM && !R.quemada.exp && R.quemada.ind > F.IND_MAX, 'quemado: pepita buena, sin salpicar, hundimiento > 25 %');
  // remedios
  ok(F.resultado(par(9, 10, 3)).ok, 'poca energía: subir la corriente a 9 kA lo arregla'); ok(F.resultado(par(8, 12, 3, false, 60)).ok, 'deriva: separar los puntos a 60 mm lo arregla'); ok(F.resultado(par(9, 12, 3, false, 40)).ok, 'gastado: cambiar el electrodo lo arregla');
  ok(F.resultado(par(9, 10, 3.5)).ok, 'salpicadura: bajar corriente y subir fuerza lo arregla'); ok(F.resultado(par(9, 12, 3)).ok, 'quemado: acortar el tiempo lo arregla');
  // las firmas son distintas entre sí
  ok(R.deriva.S.dE < 5e-3 && R.poca.S.dE < 5e-3 && R.gastado.S.dE > 6e-3, 'sólo el gastado tiene cara ancha'); ok(!R.poca.exp && !R.deriva.exp && !R.gastado.exp && !R.quemada.exp, 'sólo la salpicadura expulsa');
}

console.log('12 · El recorrido muestra lo que dice');
ok(TOUR_PARS.length === 7, 'siete pasos con parámetros', String(TOUR_PARS.length));
{ const [p0, p1, p2, p3, p4, p5, p6] = TOUR_PARS; for (const p of [p0, p1, p2, p3, p4, p6]) ok(F.resultado(p).ok, 'los pasos del recorrido con el ajuste nominal dan una soldadura buena', JSON.stringify(p));
  ok(F.resultado(p5).def === 'salpica', 'el paso «si te pasas, salpica» salpica'); absc(F.resultado(p0).dmm, 4.6, 1.2, 'la pepita nominal ronda los 4–5 mm'); }

console.log('13 · Fase «Calcula»');
for (const c of CASOS_1) { if (c.tipo === 'dmin') cerca(4 * Math.sqrt(c.t), F.dMinCalidad(c.t), 1e-12, `d_mín(${c.t} mm)`); else { const q = (c.I * 1000) ** 2 * (c.R * 1e-6) * (c.n / 60); cerca(F.calorJoule(c.I * 1000, c.R * 1e-6, c.n / F.HZ), q, 1e-12, `Q = ${c.I} kA, ${c.R} µΩ, ${c.n} ciclos`); ok(q > 1000 && q < 5000, 'Q de orden razonable', q.toFixed(0)); } }
ok(CASOS_1.filter((c) => c.tipo === 'dmin').length >= 4 && CASOS_1.filter((c) => c.tipo === 'joule').length >= 4, 'hay al menos 4 casos de cada tipo'); ok(new Set(CASOS_1.map((c) => JSON.stringify(c))).size === CASOS_1.length, 'ningún caso repetido');

console.log('14 · Quiz: opciones barajadas y la correcta no cae casi siempre en el mismo sitio');
ok(QUIZ.length === 3, 'tres preguntas');
for (const Q of QUIZ) { const cuenta = [0, 0, 0, 0], N = 4000; for (let i = 0; i < N; i++) { const o = barajar([Q.ok, ...Q.mal]); cuenta[o.indexOf(Q.ok)]++; } ok(Q.mal.length === 3 && cuenta.every((c) => c > N * 0.20 && c < N * 0.30), `«${Q.q.slice(0, 38)}…»: la correcta cae en las 4 posiciones por igual`, cuenta.join('/')); ok(new Set([Q.ok, ...Q.mal]).size === 4, 'cuatro opciones distintas'); }

console.log('15 · Cinemática inversa del robot (contra una cinemática directa escrita aparte)');
{ const D = Math.PI / 180, rot = (a, v) => [v[0] * Math.cos(a) - v[1] * Math.sin(a), v[0] * Math.sin(a) + v[1] * Math.cos(a)];
  const M = IK.IKM; const S = M.S, E = M.E, P5 = M.P5, T = M.TCP;
  const fk = (q) => { // plano del brazo: hombro S → codo E' → muñeca P5' → punta; luego el giro de J1 sobre el plano con el desvío lateral eLat
    const e1 = rot(q.j2, [E[0] - S[0], E[1] - S[1]]), E2 = [S[0] + e1[0], S[1] + e1[1]];
    const e2 = rot(q.j2 + q.j3, [P5[0] - E[0], P5[1] - E[1]]), P52 = [E2[0] + e2[0], E2[1] + e2[1]];
    const e3 = rot(q.j2 + q.j3 + q.j5, [T[0] - P5[0], T[1] - P5[1]]), T2 = [P52[0] + e3[0], P52[1] + e3[1]];
    // giro de J1 alrededor de Y: x' = x·cosψ + z·senψ ; z' = −x·senψ + z·cosψ con z = eLat
    const x = T2[0] * Math.cos(q.j1) + M.eLat * Math.sin(q.j1), z = -T2[0] * Math.sin(q.j1) + M.eLat * Math.cos(q.j1); return { X: x, Y: T2[1], Z: z, tilt: q.j2 + q.j3 + q.j5 }; };
  let maxErr = 0, maxAng = 0, nPts = 0, jawOk = true;
  for (const X of [2.1, 2.2, 2.28, 2.4, 2.5]) for (const Y of [0.95, 1.05, 1.15]) for (let Z = -0.55; Z <= 0.551; Z += 0.1) { const q = IK.ikPunto(X, Y, Z, 3); if (!q) continue; nPts++; const f = fk(q); maxErr = Math.max(maxErr, Math.hypot(f.X * 3 - X, f.Y * 3 - Y, f.Z * 3 - Z)); maxAng = Math.max(maxAng, Math.abs(q.j2), Math.abs(q.j3), Math.abs(q.j5), Math.abs(q.j1)); if (Math.abs(f.tilt) > 1e-9) jawOk = false; }
  ok(nPts > 60, 'la rejilla de puntos de la brida es alcanzable', String(nPts)); ok(maxErr < 1e-9, 'la cinemática directa cierra con el objetivo (error < 1 nm)', maxErr.toExponential(2)); ok(jawOk, 'J5 = −(J2+J3): los electrodos quedan a plomo (inclinación 0)'); ok(maxAng < 45 * D, 'ningún eje pasa de ±45° (los cables del modelo giran rígidos con el brazo)', (maxAng / D).toFixed(1) + '°');
  ok(IK.ikPunto(6, 1.05, 0, 3) === null, 'un punto fuera del alcance devuelve null'); ok(IK.ikPunto(0.05, 1.05, 0, 3) === null, 'un punto pegado al eje (menos que el desvío lateral) devuelve null');
  // la brida de la escena: XW = XE + 0,03 · Y0 · z de −0,5 a 0,5
  const XE = +html.match(/XE=([\d.]+)/)[1], XW = XE + +html.match(/const XW=XE\+([\d.]+)/)[1], Y0 = +html.match(/Y0=([\d.]+)/)[1]; let todos = true; for (let z = -0.5; z <= 0.5001; z += 0.04) { const q = IK.ikPunto(XW, Y0, z, 3), q2 = IK.ikPunto(XW - 0.30, Y0, z, 3); if (!q || !q2) todos = false; } ok(todos, `toda la brida (X=${XW.toFixed(2)}, Y=${Y0}) y el punto de aproximación (−0,30 m) son alcanzables`);
  let suave = true, prev = null; for (let z = -0.5; z <= 0.5001; z += 0.01) { const q = IK.ikPunto(XW, Y0, z, 3); if (prev && Math.abs(q.j1 - prev.j1) > 0.02) suave = false; prev = q; } ok(suave, 'al recorrer la brida los ángulos cambian de forma continua (sin saltos de rama)'); }

console.log(`\n${n - malas}/${n} comprobaciones` + (malas ? ` · ${malas} FALLAN` : ' · todas bien'));
process.exit(malas ? 1 : 0);
