// Verificación de la física de «Llenado de un tanque de hidrógeno a 700 bar: el calor de la compresión» (mecanica-160).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con el gas real de Abel–Noble (formas cerradas y coherencia termodinámica), con el límite de gas ideal
// (T_final = media ponderada con γ·T_entrada), con la conservación de la energía a lo largo del llenado y con el diseño del reto.
// uso: node scripts/auditoria/verifica-llenado-hidrogeno-700-bar.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/llenado-hidrogeno-700-bar.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const NOMS = 'RGAS,M_H2,CP,CV,B_AN,T_REF,P_NOM,T_MAX,P_MAX,TANQUE,FLUJO,MANGUERA,CHILLER,presion,moles,densidad,Zfac,RHO_NOM,socDeMoles,molesDeSoc,presionDeSoc,entalpiaIn,hConv,entrada,energiaKg,deriv,rk4,llena,RETO,ESCENARIOS,cumple,ventanaRampa,ventanaEnfriador,CASOS_DX';
const F = new Function(src + `;return {${NOMS}};`)();
// variante «gas ideal sin pared» para el límite de gas ideal: b = 0 y sin área de intercambio
const G = new Function(src.replace('const B_AN=1.55e-5;', 'const B_AN=0;').replace('A:1.6,', 'A:0,') + `;return {${NOMS}};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const K = (C) => C + 273.15;
const medioDe = (e) => { const w = F.ventanaEnfriador(e); return Math.round((w[0] + w[1]) / 2); };

console.log('1 · Gas real de Abel–Noble: Z, densidad y carga (SOC)');
{ cerca(F.Zfac(70e6, K(15)), 1 + F.B_AN * 70e6 / (F.RGAS * K(15)), 1e-14, 'Z = 1 + b·p/(R·T)');
  ok(F.Zfac(70e6, K(15)) > 1.44 && F.Zfac(70e6, K(15)) < 1.47, 'Z(700 bar, 15 °C) ≈ 1,45 (el H₂ NO es un gas ideal)', F.Zfac(70e6, K(15)).toFixed(4));
  cerca(F.RHO_NOM, 40.2, 0.012, 'ρ(700 bar, 15 °C) ≈ 40,2 kg/m³ de las tablas (a verificar; el modelo da ' + F.RHO_NOM.toFixed(2) + ')');
  cerca(F.densidad(70e6, K(15)), F.P_NOM * F.M_H2 / (F.Zfac(70e6, K(15)) * F.RGAS * K(15)), 1e-13, 'ρ = p·M/(Z·R·T)');
  cerca(F.densidad(70e6, K(15)) * F.Zfac(70e6, K(15)) / (70e6 * F.M_H2 / (F.RGAS * K(15))), 1, 1e-13, 'ρ_real·Z = ρ_ideal');
  ok(F.Zfac(1e5, K(15)) - 1 < 1e-3, 'a 1 bar el H₂ es casi ideal (Z − 1 < 1e-3)', (F.Zfac(1e5, K(15)) - 1).toExponential(2));
  for (const [p, T] of [[2e6, 280], [35e6, 300], [70e6, 288.15], [87.5e6, 358.15]]) { cerca(F.presion(F.moles(p, T), T), p, 1e-13, `p(n(p,T),T) = p (${p / 1e5} bar, ${T} K)`); cerca(F.moles(p, T) * F.M_H2 / F.TANQUE.V, F.densidad(p, T), 1e-13, 'n·M/V = ρ'); }
  cerca(F.socDeMoles(F.moles(70e6, K(15))), 1, 1e-13, 'SOC(700 bar, 15 °C) = 100 % por definición');
  for (const s of [0.1, 0.5, 0.95, 1]) for (const T of [260, 288.15, 330]) cerca(F.socDeMoles(F.moles(F.presionDeSoc(s, T), T)), s, 1e-12, `SOC ↔ presión ida y vuelta (SOC ${s}, ${T} K)`);
  ok(F.presionDeSoc(1, K(85)) < F.P_MAX && F.presionDeSoc(1, K(85)) > 0.98 * F.P_MAX, '100 % de carga a 85 °C pide ≈ 875 bar (125 % de la nominal)', (F.presionDeSoc(1, K(85)) / 1e5).toFixed(1) + ' bar');
  const s60 = F.socDeMoles(F.moles(70e6, K(60)));
  ok(s60 < 0.92 && s60 > 0.88, '700 bar con el gas a 60 °C sólo es ≈ 90 % de carga', (s60 * 100).toFixed(1) + ' %');
  console.log(`   ρ_nom = ${F.RHO_NOM.toFixed(3)} kg/m³ · Z = ${F.Zfac(70e6, K(15)).toFixed(4)} · tanque lleno = ${(F.RHO_NOM * F.TANQUE.V).toFixed(3)} kg · 700 bar a 60 °C = ${(s60 * 100).toFixed(1)} % · 100 % a 85 °C = ${(F.presionDeSoc(1, K(85)) / 1e5).toFixed(0)} bar`); }

console.log('2 · Coherencia termodinámica de Abel–Noble');
{ const h = 1e-3;
  for (const [nn, TT] of [[500, 290], [1500, 300], [2400, 330]]) { const dpdT = (F.presion(nn, TT + h) - F.presion(nn, TT - h)) / (2 * h), p = F.presion(nn, TT);
    ok(Math.abs(TT * dpdT - p) < 1e-6 * p, `(∂u/∂v)_T = T·(∂p/∂T)_v − p = 0: la energía interna no depende de la presión (n=${nn}, T=${TT})`, (TT * dpdT - p).toExponential(2));
    const v = F.TANQUE.V / nn; cerca(F.entalpiaIn(TT, p) - F.CV * TT, p * v, 1e-13, 'h − u = p·v = RT + b·p'); }
  cerca(F.CP - F.CV, F.RGAS, 1e-14, 'c_p − c_v = R'); cerca(F.CP / F.CV, 1.41, 5e-3, 'γ del H₂ ≈ 1,41 (tabla a 300 K)');
  const dhdp = (F.entalpiaIn(300, 71e6) - F.entalpiaIn(300, 69e6)) / 2e6; cerca(dhdp, F.B_AN, 1e-9, '(∂h/∂p)_T = b > 0: el H₂ se CALIENTA al estrangularse (Joule–Thomson invertido por encima de ~200 K)');
  console.log(`   μ_JT = −b/c_p = ${(-F.B_AN / F.CP * 1e5).toFixed(3)} K/bar (el real ronda −0,03; Abel–Noble lo exagera, declarado)`); }

console.log('3 · Límite de gas ideal y sin pared: T_f = (n0·c_v·T0 + (n_f − n0)·c_p·T_in) / (n_f·c_v)');
{ for (const [Tamb, Tpc] of [[298.15, 298.15], [298.15, 253.15], [288.15, 243.15]]) {
    const E = G.entrada(Tpc, Tamb, null), T0 = Tamb, p0 = 2e5, ramp = 20, dt = 0.01, n0 = G.moles(p0, T0);
    let s = { n: n0, T: T0, Tw: T0, Tc: T0 }; const ctl = { Tin: E.Tin, rate: ramp * 1e6 / 60 }; let i = 0; while (G.socDeMoles(s.n) < 1 && i < 400000) { s = G.rk4(s, ctl, Tamb, dt); i++; }
    const Tf = (n0 * G.CV * T0 + (s.n - n0) * G.CP * E.Tin) / (s.n * G.CV);
    cerca(s.T, Tf, 2e-4, `gas ideal adiabático: T_f = media ponderada de T0 y γ·T_in (Tpc=${Tpc} K)`);
    if (Tpc === 298.15) ok(s.T > T0 && s.T > E.Tin * 1.2, 'se calienta por encima de T_in: T_f/T_in ≈ γ', (s.T / E.Tin).toFixed(3)); } }

console.log('4 · Conservación de la energía en un llenado completo (pared de dos nodos y pérdida al aire)');
{ let peor = 0;
  for (const prm of [{ Tamb: 298.15, p0: 5e6, aprr: 20, Tpc: 233.15 }, { Tamb: 308.15, p0: 8e6, aprr: 40, Tpc: 253.15 }, { Tamb: 288.15, p0: 3e6, aprr: 10, Tpc: 273.15 }]) {
    const r = F.llena(Object.assign({ dt: 0.05, tMax: 900 }, prm)), T = r.tr, N = r.N, dt = r.dt;
    const Etot = (k) => T.n[k] * F.CV * T.T[k] + F.TANQUE.CL * T.Tw[k] + F.TANQUE.CC * T.Tc[k];
    let ent = 0, per = 0; for (let k = 0; k < N - 1; k++) { const f = (j) => (T.md[j] / F.M_H2) * F.entalpiaIn(T.Tin[j], T.p[j]), g = (j) => F.TANQUE.UAo * (T.Tc[j] - prm.Tamb); ent += 0.5 * (f(k) + f(k + 1)) * dt; per += 0.5 * (g(k) + g(k + 1)) * dt; }
    const dE = Etot(N - 1) - Etot(0), bal = ent - per, e = Math.abs(dE - bal) / Math.abs(dE); peor = Math.max(peor, e);
    ok(e < 2e-3, `ΔE = ∫ṅ·h_in dt − pérdidas (Tpc=${prm.Tpc} K, ${prm.aprr} MPa/min)`, `error ${e.toExponential(2)}`); }
  console.log(`   peor residuo relativo del balance de energía: ${peor.toExponential(2)}`); }

console.log('5 · El surtidor sigue la rampa y respeta el caudal máximo');
{ const r = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 20, Tpc: 243.15, dt: 0.5 }), T = r.tr; let maxDev = 0;
  for (let k = 0; k < r.N; k++) maxDev = Math.max(maxDev, Math.abs(T.p[k] - (5e6 + 20e6 / 60 * T.t[k])) / T.p[k]);
  ok(maxDev < 2e-4, 'sin saturar el caudal, p(t) = p0 + rampa·t (error relativo < 2e-4)', maxDev.toExponential(2));
  const q = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 60, Tpc: 243.15, dt: 0.5 }); const mdMax = Math.max(...q.tr.md);
  ok(mdMax <= F.FLUJO.MAX * (1 + 1e-12), 'el caudal nunca pasa de 60 g/s', mdMax.toFixed(5)); ok(mdMax > 0.0599, 'a 60 MPa/min el caudal SÍ llega al tope', mdMax.toFixed(5));
  const k1 = q.tr.t.findIndex((t) => t >= 5), dp = (q.tr.p[k1] - q.tr.p[0]) / q.tr.t[k1]; ok(dp < 60e6 / 60 * 0.999, 'con el caudal topado la presión sube MÁS DESPACIO que la rampa pedida', (dp / 1e6 * 60).toFixed(1) + ' MPa/min');
  cerca(r.tFin, (r.pFin - 5e6) / (20e6 / 60), 5e-3, 'tiempo de llenado = (p_final − p_0)/rampa'); }

console.log('6 · Tendencias físicas del llenado (más rampa → más calor; más frío → menos calor)');
{ const base = { Tamb: 298.15, p0: 5e6, dt: 1 }; let mono = true, prev = -1;
  for (const ap of [10, 14, 18, 22, 26, 30, 36, 42]) { const r = F.llena(Object.assign({ aprr: ap, Tpc: 233.15 }, base)); if (r.motivo !== 'completo') mono = false; if (r.TmaxC < prev - 1e-9) mono = false; prev = r.TmaxC; } ok(mono, 'con −40 °C todas las rampas completan y T_máx crece con la rampa');
  mono = true; prev = 2; for (const ap of [14, 18, 22, 26, 30, 36, 42]) { const r = F.llena(Object.assign({ aprr: ap, Tpc: 253.15 }, base)); if (r.socFin > prev + 1e-9) mono = false; prev = r.socFin; } ok(mono, 'con −20 °C (disparo) la carga alcanzada ANTES del disparo baja al subir la rampa');
  mono = true; prev = -1; for (const Tp of [283.15, 273.15, 263.15, 253.15, 243.15]) { const r = F.llena(Object.assign({ aprr: 25, Tpc: Tp }, base)); if (r.socFin < prev - 1e-9) mono = false; prev = r.socFin; } ok(mono, 'a igual rampa, enfriar más permite cargar más antes del disparo');
  const a = F.llena(Object.assign({ aprr: 25, Tpc: 233.15 }, base)), b = F.llena(Object.assign({ aprr: 25, Tpc: 298.15 }, base));
  ok(a.motivo === 'completo' && a.TmaxC < 85, 'con −40 °C se llena sin pasar de 85 °C', a.TmaxC.toFixed(1)); ok(b.motivo === 'temperatura' && b.socFin < 0.5, 'sin enfriar, el surtidor corta por temperatura con menos de la mitad cargada', (b.socFin * 100).toFixed(0) + ' %');
  ok(a.EchPorKg > 0.1 && b.EchPorKg === 0, 'sin enfriar no se gasta energía en el enfriador', a.EchPorKg.toFixed(3));
  ok(a.pAsentada < a.pFin && a.pAsentada > 0.8 * a.pFin, 'al enfriarse hasta el ambiente la presión baja (pero la masa no cambia)', (a.pFin / 1e5).toFixed(0) + ' → ' + (a.pAsentada / 1e5).toFixed(0) + ' bar');
  cerca(F.presionDeSoc(1, K(15)), F.P_NOM, 1e-12, 'asentado a 15 °C, 100 % de carga son exactamente 700 bar');
  const c1 = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 25, Tpc: 243.15, dt: 1 }), c2 = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 25, Tpc: 243.15, dt: 0.1 });
  ok(Math.abs(c1.TmaxC - c2.TmaxC) < 0.3, 'T_máx converge con el paso (dt 1 s frente a 0,1 s)', Math.abs(c1.TmaxC - c2.TmaxC).toFixed(3)); ok(Math.abs(c1.tFin - c2.tFin) / c2.tFin < 0.01, 'el tiempo converge con el paso', c1.tFin + ' vs ' + c2.tFin);
  const lento = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 8, Tpc: 243.15, dt: 1 }), rapido = F.llena({ Tamb: 298.15, p0: 5e6, aprr: 40, Tpc: 243.15, dt: 1 });
  ok(lento.tr.Tc[lento.N - 1] - 298.15 > rapido.tr.Tc[rapido.N - 1] - 298.15, 'un llenado lento calienta más el composite que uno rápido (el calor tiene tiempo de entrar)');
  console.log(`   −40 °C a 25 MPa/min: ${a.tFin.toFixed(0)} s · T_máx ${a.TmaxC.toFixed(1)} °C · ${a.kg.toFixed(2)} kg · ${a.EchPorKg.toFixed(3)} kWh/kg · ${(a.pFin / 1e5).toFixed(0)} → ${(a.pAsentada / 1e5).toFixed(0)} bar al enfriarse · sin enfriar: ${b.tFin.toFixed(0)} s y ${(b.socFin * 100).toFixed(0)} %`); }

console.log('7 · El enfriador: potencia y energía');
{ const amb = 298.15, E = F.entrada(243.15, amb, null);
  cerca(E.Tin, 243.15 + F.MANGUERA.kappa * (amb - 243.15), 1e-13, 'T_entrada = T_enfriador + κ·(T_amb − T_enfriador)'); cerca(E.cop, F.CHILLER.eta2 * 243.15 / (amb + F.CHILLER.dT - 243.15), 1e-13, 'COP = η₂·T_f/(T_c − T_f)');
  ok(E.cop < 243.15 / (amb + F.CHILLER.dT - 243.15), 'COP < Carnot');
  ok(F.entrada(300, amb, null).Tset === amb && F.entrada(300, amb, null).cop === Infinity, 'con el ajuste por encima del ambiente no se enfría ni se gasta');
  ok(Math.abs(F.entrada(243.15, amb, 'enfriador').Tin - amb) < 1e-9, 'enfriador averiado: el gas llega a temperatura ambiente'); ok(F.entrada(243.15, amb, 'manguera').Tin > E.Tin + 15, 'manguera sin aislar: el gas llega mucho más caliente');
  const r = F.llena({ Tamb: amb, p0: 5e6, aprr: 20, Tpc: 243.15, dt: 0.25 }), T = r.tr; let Wh = 0; for (let k = 0; k < r.N - 1; k++) Wh += T.Pch[k] * r.dt;
  cerca(r.EchKWh * 3.6e6, Wh, 2e-3, 'energía del enfriador = ∫ P_ch dt');
  cerca(F.energiaKg(243.15, amb, null), r.EchPorKg, 2e-3, 'energiaKg(T_f, T_amb) = energía por kg del llenado simulado'); cerca(F.energiaKg(300, amb, null), 0, 1, 'sin enfriar, 0 kWh/kg');
  const kgE = (r.kg / F.M_H2) * F.CP * (amb - 243.15) / E.cop; cerca(r.EchKWh * 3.6e6, kgE, 2e-3, 'energía = n·c_p·(T_amb − T_f)/COP (forma cerrada)'); }

console.log('8 · El reto: ventana interior en rampa y en enfriamiento');
{ ok(F.ESCENARIOS.length === 4, 'cuatro escenarios');
  F.ESCENARIOS.forEach((e, i) => { const w = F.ventanaEnfriador(e), nom = `escenario ${i + 1} (${(e.Tamb - 273.15).toFixed(0)} °C, ${e.p0 / 1e5} bar)`;
    ok(w && w[1] - w[0] >= 3, `${nom}: ventana de enfriador ≥ 4 °C de ancho`, w && w.map((x) => (x - 273.15).toFixed(0)).join('…'));
    ok(w && w[0] > F.RETO.Tpmin + 3 && w[1] < e.Tamb - 10, `${nom}: la ventana del enfriador es INTERIOR (ni −40 °C ni sin enfriar)`);
    const medio = medioDe(e), v = F.ventanaRampa(e, medio);
    ok(v && v[0] > F.RETO.rampaMin + 5 && v[1] < F.RETO.rampaMax - 5 && v[1] - v[0] >= 4, `${nom}: la ventana de rampa es INTERIOR y de ≥ 5 MPa/min`, v && v.join('–'));
    const lento = F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: F.RETO.rampaMin, Tpc: medio, dt: 1, tMax: e.tMax + 60 }), rapido = F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: F.RETO.rampaMax, Tpc: medio, dt: 1, tMax: e.tMax + 60 });
    ok(!F.cumple(lento, e).tiempo && F.cumple(lento, e).temp, `${nom}: rampa mínima (6) falla por TIEMPO (${lento.tFin.toFixed(0)} s > ${e.tMax})`); ok(!F.cumple(rapido, e).temp && !F.cumple(rapido, e).soc, `${nom}: rampa máxima (60) corta por TEMPERATURA y deja poca carga (${(rapido.socFin * 100).toFixed(0)} %)`);
    const frio = F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: v[0] + 2, Tpc: F.RETO.Tpmin, dt: 1, tMax: e.tMax + 60 }), calido = F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: v[0] + 2, Tpc: e.Tamb, dt: 1, tMax: e.tMax + 60 });
    ok(F.cumple(frio, e).temp && F.cumple(frio, e).tiempo && !F.cumple(frio, e).energia, `${nom}: enfriar al máximo (−40 °C) cumple la física pero GASTA de más (${frio.EchPorKg.toFixed(3)} > ${e.Elim} kWh/kg)`); ok(!F.cumple(calido, e).temp, `${nom}: sin enfriar corta por temperatura`);
    for (const [tp, ap] of [[F.RETO.Tpmin, 25], [e.Tamb, 25], [medio, F.RETO.rampaMin], [medio, F.RETO.rampaMax]]) ok(!F.cumple(F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: ap, Tpc: tp, dt: 1, tMax: e.tMax + 60 }), e).ok, `${nom}: (${(tp - 273.15).toFixed(0)} °C, ${ap} MPa/min) no cumple`);
    console.log(`   ${nom}: enfriador ${w.map((x) => (x - 273.15).toFixed(0)).join('…')} °C · a ${(medio - 273.15).toFixed(0)} °C la rampa válida es ${v.join('–')} MPa/min · límite ${e.tMax} s y ${e.Elim} kWh/kg`); }); }

console.log('9 · El diagnóstico se resuelve con las cifras del dock');
{ const lee = (c) => { const r = F.llena(Object.assign({ dt: 1 }, c.prm)); return { ajuste: F.entrada(c.prm.Tpc, c.prm.Tamb, null).Tset - 273.15, entra: r.Tin - 273.15, Tini: r.tr.T[0] - 273.15, md: Math.max(...r.tr.md) * 1000, motivo: r.motivo, Tamb: c.prm.Tamb - 273.15 }; };
  const arbol = (d) => { if (d.Tini > d.Tamb + 10) return 'calor'; if (d.entra > d.ajuste + 40) return 'enfriador'; if (d.entra > d.ajuste + 20) return 'manguera'; if (d.md > 59) return 'rampa'; return '?'; };
  for (const c of F.CASOS_DX) { const d = lee(c); ok(arbol(d) === c.k, `el caso «${c.k}» se distingue por sus lecturas`, JSON.stringify(d)); ok(d.motivo === 'temperatura', `el caso «${c.k}» termina por disparo de temperatura`);
    console.log(`   ${c.k.padEnd(10)} ajuste ${d.ajuste.toFixed(0)} °C · entra ${d.entra.toFixed(0)} °C · tanque al empezar ${d.Tini.toFixed(0)} °C · caudal máx. ${d.md.toFixed(0)} g/s`); } }

console.log('10 · El cálculo de la fase 1 coincide con el llenado simulado');
{ for (const e of F.ESCENARIOS) { const medio = medioDe(e), v = F.ventanaRampa(e, medio), r = F.llena({ Tamb: e.Tamb, p0: e.p0, aprr: Math.round((v[0] + v[1]) / 2), Tpc: medio, dt: 0.5 });
    const rho0 = F.densidad(e.p0, e.Tamb), resp = (F.RHO_NOM - rho0) * F.TANQUE.V; ok(r.motivo === 'completo', 'el llenado de referencia termina completo');
    cerca(r.kg, resp, 5e-3, `kg metidos = (ρ_nom − ρ_0)·V = ${resp.toFixed(3)} kg (${(e.p0 / 1e5).toFixed(0)} bar, ${(e.Tamb - 273.15).toFixed(0)} °C)`); } }

console.log(`\n${n} comprobaciones · ${malas} fallos`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
