// Verificación de la física de «Gestión térmica de una batería de VE: placa fría y carga rápida» (mecanica-146).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (solución estacionaria ε-NTU, respuesta exponencial de una celda, ΔT = ΣQ/(ṁ·cp),
// Hagen-Poiseuille), con la conservación de la energía de toda la carga y con el óptimo del reto contra un barrido fino.
// uso: node scripts/auditoria/verifica-termica-bateria-placa-fria.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/termica-bateria-placa-fria.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,clamp,K0,CEL,NC,resistencia,calorCelda,R_BARRA,calorExtra,propsF,PROPS_CTE,usaCte,props,PLACA,nuLam,nusselt,friccion,CARGA,iPedida,LIM,
  factorFrio,factorCalor,copChiller,TAMB_DEF,evalua,simula,tiempoIdeal,RETO,ESCENARIOS,evaluaReto,RANGOS,optimo};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const abs = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const rel = (a, b) => Math.abs(a / b - 1);
const { CEL, NC, PLACA, CARGA, LIM } = F;

console.log('1 · La celda: calor I²R + calor entrópico, resistencia de Arrhenius');
{ cerca(F.resistencia(25, 1), CEL.R25, 1e-14, 'R(25 °C, SOC 100 %) = R25');
  cerca(F.resistencia(0, 1) / F.resistencia(25, 1), Math.exp(CEL.B * (1 / 273.15 - 1 / 298.15)), 1e-13, 'R(0 °C)/R(25 °C) = exp[B(1/T − 1/T25)]');
  ok(F.resistencia(45, 0.5) < F.resistencia(25, 0.5) && F.resistencia(0, 0.5) > F.resistencia(25, 0.5), 'la resistencia baja al calentarse');
  ok(F.resistencia(25, 0.1) > F.resistencia(25, 0.8), 'la resistencia sube con poca carga');
  const I = 240, T = 30, s = 0.5, q = F.calorCelda(I, T, s);
  cerca(q, I * I * F.resistencia(T, s) + I * (T + 273.15) * CEL.dUdT, 1e-13, 'q = I²R + I·T·dU/dT');
  ok(F.calorCelda(I, T, s) < I * I * F.resistencia(T, s), 'al CARGAR el calor entrópico enfría (dU/dT < 0)');
  ok(F.calorCelda(-I, T, s) > I * I * F.resistencia(T, s), 'al DESCARGAR el calor entrópico calienta');
  const irrev = x => x * x * F.resistencia(T, s); cerca(irrev(2 * I), 4 * irrev(I), 1e-13, 'la parte irreversible crece con I²');
  cerca(F.calorExtra(100, 0, NC), 100 * 100 * F.R_BARRA, 1e-14, 'la barra de cobre calienta la celda 1'); cerca(F.calorExtra(100, NC - 1, NC), 100 * 100 * F.R_BARRA, 1e-14, '… y la celda 12');
  ok(F.calorExtra(100, 5, NC) === 0, '… y ninguna del medio');
  console.log(`   a ${I} A y ${T} °C, SOC 50 %: R = ${(F.resistencia(T, s) * 1e3).toFixed(3)} mΩ, q = ${q.toFixed(1)} W por celda`); }

console.log('2 · El canal: Nusselt y fricción (laminar, transición y turbulento)');
{ cerca(F.nusselt(1000, 30), 4.364, 1e-12, 'Re < 2300: Nu = 4,364 (flujo de calor uniforme, ducto circular)');
  const turb = (R, Pr) => { const f = Math.pow(0.790 * Math.log(R) - 1.64, -2); return (f / 8) * (R - 1000) * Pr / (1 + 12.7 * Math.sqrt(f / 8) * (Math.pow(Pr, 2 / 3) - 1)); };
  cerca(F.nusselt(10000, 7), turb(10000, 7), 1e-12, 'Gnielinski a Re = 10⁴, Pr = 7');
  ok(F.nusselt(10000, 7) > 60 && F.nusselt(10000, 7) < 100, 'Nu(10⁴, Pr 7) está en el rango de las tablas (60-100)', F.nusselt(10000, 7).toFixed(1));
  cerca(F.nusselt(2300, 25), F.nusselt(2300.0001, 25), 1e-4, 'Nu continuo en Re = 2300'); cerca(F.nusselt(4000, 25), F.nusselt(3999.9999, 25), 1e-6, 'Nu continuo en Re = 4000');
  let mono = true; for (let R = 2300; R < 4000; R += 50) if (F.nusselt(R + 50, 25) < F.nusselt(R, 25)) mono = false; ok(mono, 'Nu crece en la transición');
  cerca(F.friccion(1000), 0.064, 1e-12, 'f = 64/Re en laminar'); ok(F.friccion(1e5) > 0.0175 && F.friccion(1e5) < 0.0185, 'f(10⁵) ≈ 0,018 (Blasius/Petukhov)', F.friccion(1e5).toFixed(5));
  cerca(F.friccion(2300), F.friccion(2300.0001), 1e-4, 'f continuo en 2300'); cerca(F.friccion(4000), F.friccion(3999.9999), 1e-6, 'f continuo en 4000');
  const p = F.propsF(25); cerca(p.rho, 1075, 1e-12, 'ρ(25 °C)'); cerca(p.cp, 3300, 1e-12, 'cp(25 °C)'); cerca(p.mu, 3.8e-3, 1e-12, 'μ(25 °C)');
  ok(F.propsF(0).mu > 1.8 * F.propsF(25).mu && F.propsF(50).mu < 0.6 * F.propsF(25).mu, 'la viscosidad baja mucho con la temperatura (glicol)');
  // el salto de la transición: la h de la placa cambia más de 8 veces entre Re 2200 y Re 4200
  const Pr = F.propsF(25).mu * F.propsF(25).cp / F.propsF(25).k; ok(F.nusselt(4200, Pr) / F.nusselt(2200, Pr) > 8, 'pasar de laminar a turbulento multiplica h por más de 8', (F.nusselt(4200, Pr) / F.nusselt(2200, Pr)).toFixed(1)); }

console.log('3 · El líquido: ΔT = ΣQ/(ṁ·cp) y el límite ε → 1');
{ F.usaCte(true);
  const T = Array.from({ length: NC }, (_, i) => 30 + i * 0.7), par = { V: 6, Tin: 20, Ccc: 3 };
  const e = F.evalua(T, 0.5, par);
  cerca(e.Tout - e.Tf[0], e.Qtot / (e.mdot * F.PROPS_CTE.cp), 1e-13, 'T_salida − T_entrada = ΣQ_i / (ṁ·cp) con propiedades constantes');
  let sumQ = 0; for (let i = 0; i < NC; i++) sumQ += e.Q[i]; cerca(sumQ, e.Qtot, 1e-14, 'Qtot es la suma de Q_i');
  ok(e.Q.every(Q => Q > 0), 'con las celdas más calientes que el líquido, el calor va a la placa'); ok(e.Tf.every((t, i) => i === 0 || t >= e.Tf[i - 1]), 'el líquido sólo se calienta');
  // ε → 1: con un caudal minúsculo cada tramo sale a la temperatura de su celda
  const e2 = F.evalua(T, 0.5, { V: 1e-4, Tin: 20, Ccc: 3 }); abs(e2.Tout, T[NC - 1], 1e-6, 'caudal → 0: el líquido sale a la temperatura de la última celda');
  // caudal grande: el líquido casi no se calienta
  const e3 = F.evalua(T, 0.5, { V: 14, Tin: 20, Ccc: 3 }); ok(e3.Tout - 20 < 2, 'con 14 L/min el líquido sube menos de 2 °C', (e3.Tout - 20).toFixed(2));
  // en laminar el calor que pasa al líquido casi no depende del caudal (h constante, ε ≈ UA/ṁcp): a la mitad del caudal el salto de temperatura se duplica
  const eA = F.evalua(T, 0.5, { V: 2, Tin: 20, Ccc: 3 }), eB = F.evalua(T, 0.5, { V: 1, Tin: 20, Ccc: 3 }); ok((eB.Tout - 20) > 1.85 * (eA.Tout - 20) && (eB.Tout - 20) < 2.05 * (eA.Tout - 20), 'en laminar, a la mitad del caudal el salto de temperatura del líquido se duplica', ((eB.Tout - 20) / (eA.Tout - 20)).toFixed(3));
  F.usaCte(false);
  // con propiedades variables también: ΣQ_i = Σ ṁ·cp_i·(T_{i+1} − T_i) (cada tramo con su cp)
  const ev = F.evalua(T, 0.5, par); let sum = 0; for (let i = 0; i < NC; i++) sum += ev.mdot * F.propsF(ev.Tf[i]).cp * (ev.Tf[i + 1] - ev.Tf[i]); cerca(sum, ev.Qtot, 1e-12, 'balance por tramos con cp(T)'); }

console.log('4 · Solución estacionaria (forma cerrada ε-NTU) y respuesta de una celda (exponencial)');
{ const guardado = { Gcc: CEL.Gcc, B: CEL.B, dUdT: CEL.dUdT }; CEL.Gcc = 0; CEL.B = 0; CEL.dUdT = 0; F.usaCte(true);
  const I = 120, s = 0.6, V = 6, Tin = 18, par = { V, Tin, T0: 25, Ifija: I, congela: true, Ccc: 3, s0: s };
  // forma cerrada: T_i = Tf_i + q_i/(ε_i·ṁ·cp), Tf_{i+1} = Tf_i + q_i/(ṁ·cp)
  const mdot = V / 60000 * F.PROPS_CTE.rho, cap = mdot * F.PROPS_CTE.cp, Re = mdot * PLACA.Dh / (PLACA.A * F.PROPS_CTE.mu), Pr = F.PROPS_CTE.mu * F.PROPS_CTE.cp / F.PROPS_CTE.k;
  const hA = F.nusselt(Re, Pr) * F.PROPS_CTE.k / PLACA.Dh * PLACA.Per * PLACA.Lseg, UA = 1 / (CEL.Rcp + 1 / hA), eps = 1 - Math.exp(-UA / cap);
  const tau = CEL.C / (eps * cap);
  let Tf = Tin, maxErr = 0; const cerr = [];
  const r = F.simula(Object.assign({ dt: 5, hasta: 30 * tau, tmax: 1e5 }, par));
  for (let i = 0; i < NC; i++) { const q = F.calorCelda(I, 0, s) + F.calorExtra(I, i, NC); const Tss = Tf + q / (eps * cap); maxErr = Math.max(maxErr, Math.abs(r.T[i] - Tss)); Tf += q / cap; }
  ok(maxErr < 1e-6, 'estacionario: T_i = T_líq,i + q_i/(ε·ṁ·cp) en las 12 celdas', `(error máx. ${maxErr.toExponential(2)} K)`);
  console.log(`   τ de una celda = ${tau.toFixed(0)} s, ε = ${eps.toFixed(4)}, Re = ${Re.toFixed(0)}, error estacionario ${maxErr.toExponential(1)} K`);
  // la celda 1 sigue una exponencial exacta: T(t) = T∞ + (T0 − T∞)·exp(−t/τ), con T∞ = Tin + q1/(ε·ṁ·cp)
  const q1 = F.calorCelda(I, 0, s) + F.calorExtra(I, 0, NC), Tinf = Tin + q1 / (eps * cap); let eMax = 0;
  for (const t of [30, 120, 400, 900]) { const rr = F.simula(Object.assign({ dt: 1, hasta: t }, par)); eMax = Math.max(eMax, Math.abs(rr.T[0] - (Tinf + (25 - Tinf) * Math.exp(-t / tau)))); }
  ok(eMax < 1e-7, 'celda 1: respuesta exponencial exacta con τ = C/(ε·ṁ·cp)', `(error máx. ${eMax.toExponential(2)} K)`);
  // sin refrigeración (V = 0): calentamiento adiabático lineal T(t) = T0 + q·t/C
  const ra = F.simula({ V: 0, Tin: 20, T0: 25, Ifija: I, congela: true, Ccc: 3, s0: s, dt: 2, hasta: 600 });
  CEL.Gcc = 0.4; const rb = F.simula({ V: 0, Tin: 20, T0: 25, Ifija: I, congela: true, Ccc: 3, s0: s, dt: 2, hasta: 600 }); CEL.Gcc = 0;
  cerca(ra.T[5], 25 + F.calorCelda(I, 0, s) * 600 / CEL.C, 1e-12, 'adiabático: T = T0 + q·t/C (celda 6)');
  // con conducción entre vecinas la energía total sigue siendo la misma (las celdas del medio no ganan ni pierden por conducción neta)
  cerca(rb.T.reduce((a, b) => a + b, 0), ra.T.reduce((a, b) => a + b, 0), 1e-12, 'la conducción entre vecinas reparte el calor sin crearlo ni perderlo (ΣT igual)');
  Object.assign(CEL, guardado); F.usaCte(false); }

console.log('5 · La bomba: Hagen-Poiseuille y potencia');
{ F.usaCte(true);
  const V = 1.0, T = new Array(NC).fill(25), par = { V, Tin: 25, Ccc: 3 }, e = F.evalua(T, 0.5, par), p = F.PROPS_CTE;
  const mdot = V / 60000 * p.rho, v = mdot / (p.rho * PLACA.A), Re = mdot * PLACA.Dh / (PLACA.A * p.mu);
  ok(Re < 2300, 'a 1 L/min el flujo es laminar', Re.toFixed(0));
  const dpHP = 32 * p.mu * PLACA.L * v / (PLACA.Dh * PLACA.Dh), dpK = PLACA.K * 0.5 * p.rho * v * v;
  cerca(e.dp, dpHP + dpK, 1e-12, 'Δp = 32·μ·L·v/D_h² (Hagen-Poiseuille) + K·ρv²/2');
  cerca(e.Pb, e.dp * (mdot / p.rho) / PLACA.etaB, 1e-12, 'P_bomba = Δp·V̇/η');
  F.usaCte(false);
  let mono = true, prev = 0; for (let V2 = 0.5; V2 <= 14; V2 += 0.25) { const q = F.evalua(new Array(NC).fill(25), 0.5, { V: V2, Tin: 25, Ccc: 3 }).Pb; if (q <= prev) mono = false; prev = q; } ok(mono, 'la potencia de la bomba crece con el caudal');
  const P = V2 => F.evalua(new Array(NC).fill(25), 0.5, { V: V2, Tin: 25, Ccc: 3 }).Pb;
  ok(P(10) > 5 * P(5), 'duplicar el caudal multiplica la potencia por MÁS de 5 (rozamiento ∝ v²)', `P(10)/P(5) = ${(P(10) / P(5)).toFixed(1)}`);
  ok(F.evalua(new Array(NC).fill(25), 0.5, { V: 0, Tin: 25, Ccc: 3 }).Pb === 0, 'bomba parada: 0 W');
  console.log(`   a 5 L/min ${P(5).toFixed(1)} W; a 10 L/min ${P(10).toFixed(1)} W (módulo de ${NC} celdas)`); }

console.log('6 · El cargador, el recorte por temperatura y el enfriador');
{ const I0 = CARGA.Ccc * CEL.Q; cerca(F.iPedida(0.1, CARGA.Ccc), I0, 1e-13, 'corriente pedida a 10 %'); cerca(F.iPedida(CARGA.sCC, CARGA.Ccc), I0, 1e-13, '… y hasta el 50 %'); cerca(F.iPedida(CARGA.s1, CARGA.Ccc), CARGA.fFin * I0, 1e-13, '… baja a 0,25 al llegar a 80 %');
  let mono = true; for (let s = 0.1; s < 0.8; s += 0.01) if (F.iPedida(s + 0.01, 3) > F.iPedida(s, 3) + 1e-12) mono = false; ok(mono, 'la corriente pedida no crece');
  // tiempo ideal = integral exacta: (Δs_cc·Q·3600/I0) + (Q·3600/I0)·(Δs_t/(1−fFin))·ln(1/fFin)
  const k = CEL.Q * 3600 / I0, tCC = (CARGA.sCC - CARGA.s0) * k, tT = k * (CARGA.s1 - CARGA.sCC) / (1 - CARGA.fFin) * Math.log(1 / CARGA.fFin);
  abs(F.tiempoIdeal(3), tCC + tT, 0.6, 'tiempo ideal contra la integral analítica'); console.log(`   tiempo ideal ${F.tiempoIdeal(3).toFixed(1)} s (analítico ${(tCC + tT).toFixed(1)} s)`);
  cerca(F.factorFrio(15), 1, 1e-14, 'frío: factor 1 a 15 °C'); cerca(F.factorFrio(7.5), 0.5, 1e-14, '… 0,5 a 7,5 °C'); ok(F.factorFrio(0) === 0 && F.factorFrio(-5) === 0, '… 0 a 0 °C');
  cerca(F.factorCalor(40), 1, 1e-14, 'calor: factor 1 a 40 °C'); cerca(F.factorCalor(45), 0.5, 1e-14, '… 0,5 a 45 °C'); ok(F.factorCalor(50) === 0 && F.factorCalor(60) === 0, '… 0 a 50 °C');
  // el BMS recorta de verdad: con una celda a 45 °C la corriente es la mitad de la pedida
  const T = new Array(NC).fill(35); T[3] = 45; const e = F.evalua(T, 0.3, { V: 6, Tin: 20, Ccc: 3 }); cerca(e.I, 0.5 * F.iPedida(0.3, 3), 1e-12, 'una celda a 45 °C recorta la corriente a la mitad'); const T2 = new Array(NC).fill(25); T2[0] = 7.5; cerca(F.evalua(T2, 0.3, { V: 6, Tin: 20, Ccc: 3 }).I, 0.5 * F.iPedida(0.3, 3), 1e-12, 'una celda a 7,5 °C también');
  cerca(F.copChiller(15, 35), 0.35 * 288.15 / 20, 1e-13, 'COP del enfriador = 35 % del de Carnot'); ok(F.copChiller(30, 31) === 8 && F.copChiller(-30, 35) >= 1.5, 'COP acotado entre 1,5 y 8');
  const ec = F.evalua(new Array(NC).fill(10), 0.5, { V: 6, Tin: 30, Ccc: 3 }); ok(ec.Qtot < 0 && Math.abs(ec.Pch + ec.Qtot) < 1e-9, 'si el líquido calienta las celdas, el calentador PTC gasta |Q| (COP = 1)'); }

console.log('7 · Conservación de la energía en toda la carga');
{ let peor = 0, peorAh = 0, casos = 0;
  for (const esc of F.ESCENARIOS) for (const [V, Tin] of [[0, 20], [2, 25], [5, 10], [8, 15], [14, 30], [3, 5]]) {
    const r = F.simula({ V, Tin, T0: esc.T0, Ccc: esc.Ccc, Tamb: esc.Tamb, dt: 2 });
    peor = Math.max(peor, Math.abs(r.balance) / Math.max(1, r.Egen)); peorAh = Math.max(peorAh, Math.abs(r.Ah / CEL.Q - (r.s - CARGA.s0))); casos++;
    ok(r.llego, `${V} L/min, ${Tin} °C, T0 ${esc.T0}: la carga llega a 80 %`); }
  ok(peor < 1e-12, `E_generada − E_retirada = C·ΣΔT (${casos} cargas, residuo máx. ${peor.toExponential(1)})`); ok(peorAh < 1e-12, `∫I dt/(3600·Q) = Δ SOC (${peorAh.toExponential(1)})`);
  const r0 = F.simula({ V: 0, Tin: 20, T0: 30, Ccc: 3, dt: 2 }); ok(Math.abs(r0.Eq) < 1e-9 && Math.abs(r0.dUint - r0.Egen) / r0.Egen < 1e-12, 'sin refrigerar toda la energía generada se queda en las celdas (adiabático)');
  console.log(`   residuo máximo ${peor.toExponential(1)} (E_gen típica ${(r0.Egen / 1000).toFixed(0)} kJ sin refrigerar)`);
  // más corriente, más calor: la energía generada crece más que linealmente con la corriente de carga
  const a = F.simula({ V: 8, Tin: 15, T0: 28, Ccc: 1, dt: 2 }), b = F.simula({ V: 8, Tin: 15, T0: 28, Ccc: 3, dt: 2 }); ok(b.Egen > 2 * a.Egen, 'cargar 3 veces más rápido genera más calor en total (E = ∫I²R dt ∝ I para la misma carga)', `${(b.Egen / a.Egen).toFixed(2)}×`);
  const pk = (r0) => Math.max(...r0.traza.Pcal), pa = F.simula({ V: 8, Tin: 15, T0: 28, Ccc: 1, dt: 2 }, { traza: true }), pb = F.simula({ V: 8, Tin: 15, T0: 28, Ccc: 3, dt: 2 }, { traza: true }); ok(pk(pb) > 6 * pk(pa), 'y la POTENCIA de calor pico crece con I² (más de 6 veces con 3 veces la corriente)', `${(pk(pb) / pk(pa)).toFixed(1)}×`);
  // la integración converge: dt = 1 y dt = 2 dan lo mismo
  const c1 = F.simula({ V: 8, Tin: 15, T0: 35, Ccc: 3, dt: 1 }), c2 = F.simula({ V: 8, Tin: 15, T0: 35, Ccc: 3, dt: 2 }); abs(c1.pico, c2.pico, 1e-3, 'pico igual con dt = 1 y dt = 2', `(${c1.pico} vs ${c2.pico})`); abs(c1.gradMax, c2.gradMax, 1e-3, 'diferencia entre celdas igual con dt = 1 y 2'); }

console.log('8 · Física del sistema: lo que pasa al mover los mandos');
{ const esc = F.ESCENARIOS[0], run = (V, Tin) => F.simula({ V, Tin, T0: esc.T0, Ccc: esc.Ccc, Tamb: esc.Tamb, dt: 2 });
  const sin = run(0, 20), poco = run(2, 20), mucho = run(10, 20);
  ok(sin.pico > poco.pico && poco.pico > mucho.pico, 'más caudal → celdas más frías (pico)', `${sin.pico.toFixed(1)} > ${poco.pico.toFixed(1)} > ${mucho.pico.toFixed(1)}`);
  ok(sin.t > run(8, 15).t + 100, 'sin refrigerar el BMS recorta y la carga se alarga más de 100 s', `${sin.t} s vs ${run(8, 15).t} s`);
  ok(run(8, 15).pico < run(8, 25).pico, 'líquido más frío → celdas más frías'); ok(run(8, 15).minDurante < run(8, 25).minDurante, '… y la celda más fría baja más');
  ok(run(8, 5).minDurante < LIM.vent0 + 15 && run(14, 5).minDurante < LIM.Tplating, '14 L/min con líquido a 5 °C enfría por debajo de 15 °C (zona de plating)');
  // el gradiente del módulo lo marca el calor extra de las barras de cobre y el calentamiento del líquido
  const g = run(8, 15); ok(g.gradMax > 0.5, 'hay un gradiente entre celdas', g.gradMax.toFixed(2));
  // en frío, el BMS recorta la corriente y la carga se alarga; con líquido tibio se acorta
  const fria = (V, Tin) => F.simula({ V, Tin, T0: 6, Tamb: 2, Ccc: 3, dt: 2 });
  ok(fria(0, 20).t > F.tiempoIdeal(3) + 60, 'arranque en frío: la corriente se recorta y la carga se alarga', `${fria(0, 20).t} s vs ${F.tiempoIdeal(3).toFixed(0)} s`);
  ok(fria(8, 35).t < fria(0, 20).t, 'un líquido tibio calienta las celdas y acorta la carga en frío', `${fria(8, 35).t} s < ${fria(0, 20).t} s`); }

console.log('9 · El reto: el óptimo contra un barrido fino y su ventana interior');
{ for (const [k, esc] of F.ESCENARIOS.entries()) {
    const o = F.optimo(esc); ok(o && o.ok, `escenario ${k + 1}: existe una solución que cumple los cuatro criterios`);
    // barrido fino independiente (paso 0,5 L/min × 1 °C): ninguna celda de la rejilla gasta menos y cumple
    let mejor = null; for (let V = 0.5; V <= 14.001; V += 0.5) for (let Tin = 5; Tin <= 35.001; Tin += 1) { const e = F.evaluaReto(V, Tin, esc); if (e.ok && (!mejor || e.Pref < mejor.Pref)) mejor = e; }
    ok(o.Pref <= mejor.Pref * 1.005, `escenario ${k + 1}: el óptimo del motor (${o.Pref.toFixed(2)} W) no pierde contra el barrido fino (${mejor.Pref.toFixed(2)} W)`);
    ok(o.V > 2 && o.V < 13 && o.Tin > 8 && o.Tin < 32, `escenario ${k + 1}: el óptimo es INTERIOR (${o.V.toFixed(2)} L/min, ${o.Tin.toFixed(2)} °C)`);
    // sus vecinos con menos caudal incumplen y con más caudal gastan más
    const menos = F.evaluaReto(Math.max(0.5, o.V - 3), o.Tin, esc), mas = F.evaluaReto(o.V + 3, o.Tin, esc);
    ok(!menos.ok, `escenario ${k + 1}: con ${(o.V - 3).toFixed(1)} L/min el reto ya no se cumple`); ok(!mas.ok || mas.Pref > o.Pref, `escenario ${k + 1}: con ${(o.V + 3).toFixed(1)} L/min gasta más o incumple`);
    // los extremos de los mandos no cumplen
    for (const [V, Tin] of [[14, 5], [0.5, 35], [14, 35], [0.5, 5]]) ok(!F.evaluaReto(V, Tin, esc).ok, `escenario ${k + 1}: ${V} L/min y ${Tin} °C no cumple`);
    // coherencia: lo que cumple a la vez los criterios y el 20 % de gasto
    const ventana = []; for (let V = 1; V <= 14; V += 1) for (let Tin = 5; Tin <= 35; Tin += 2.5) { const e = F.evaluaReto(V, Tin, esc); if (e.ok && e.Pref <= o.Pref * (1 + F.RETO.tolPot)) ventana.push([V, Tin]); }
    ok(ventana.length >= 3, `escenario ${k + 1}: la ventana de éxito tiene ≥ 3 puntos en la rejilla gruesa (${ventana.length})`);
    console.log(`   esc ${k + 1} (T0 ${esc.T0} °C, ${esc.Ccc}C, ambiente ${esc.Tamb} °C): óptimo ${o.V.toFixed(2)} L/min · ${o.Tin.toFixed(2)} °C · ${o.Pref.toFixed(1)} W (bomba ${o.Pbomba.toFixed(1)} + enfriador ${o.Pchiller.toFixed(1)}) · pico ${o.pico.toFixed(2)} · Δ ${o.gradMax.toFixed(2)} · mín ${o.minDurante.toFixed(1)} · ${o.t} s`); }
}

console.log('10 · Fase 1 del reto: ΔT = Q/(ṁ·cp)');
{ F.usaCte(true); const ST = [3, 4, 5, 6, 8], QQ = [420, 540, 660, 780, 900]; let eMax = 0;
  for (const V of ST) for (const Q of QQ) { const T = new Array(NC).fill(40 + Q / 100); // celdas a una temperatura que depende del caso: el motor calcula su propio Q
    const e = F.evalua(T, 0.5, { V, Tin: 20, Ccc: 3 }); const mdot = V / 60000 * 1075; eMax = Math.max(eMax, Math.abs((e.Tout - 20) - e.Qtot / (mdot * 3300)) / Math.max(1e-9, e.Tout - 20)); }
  ok(eMax < 1e-12, 'la fórmula del enunciado coincide con el motor en 25 casos', eMax.toExponential(1)); F.usaCte(false);
  const respuestas = []; for (const V of ST) for (const Q of QQ) respuestas.push(Q / (Math.round(V / 60000 * 1075 * 10000) / 10000 * 3300)); ok(Math.min(...respuestas) > 0.5 && Math.max(...respuestas) < 8, 'las respuestas del reto están entre 0,5 y 8 °C', `${Math.min(...respuestas).toFixed(2)}–${Math.max(...respuestas).toFixed(2)}`); }

console.log('\n' + (malas ? `FALLARON ${malas} de ${n} comprobaciones:` : `TODO EN VERDE · ${n} comprobaciones, 0 fallos`));
if (malas) { for (const f of fallos) console.log(' -', f); process.exit(1); }
