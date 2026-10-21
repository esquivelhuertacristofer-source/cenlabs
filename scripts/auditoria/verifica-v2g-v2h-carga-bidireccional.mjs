// Verificación de la física de «Carga bidireccional V2G/V2H» (mecanica-150).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas (inversor, batería), con la conservación de la energía de cada noche, con los límites
// del cargador y de la red, con el costo y el desgaste recalculados aparte y con la ventana de solución de cada reto.
// uso: node scripts/auditoria/verifica-v2g-v2h-carga-bidireccional.mjs [ruta al html] [--rapido]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const args = process.argv.slice(2);
const RAPIDO = args.includes('--rapido');
const htmlPath = args.find((a) => !a.startsWith('--')) || path.resolve(aqui, '../../public/labs/v2g-v2h-carga-bidireccional.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {clamp,H0,H1,DT,NP,INV,perdInv,etaDescInv,etaCargaInv,acDeDcDesc,acDeDcCarga,BAT,vocDe,corrienteDesc,corrienteCarga,quimica,etaBatDesc,etaBatCarga,etaIdaVuelta,aceptaCarga,TARIFAS,tipoHora,precioHora,CASAS,cargaCasa,DESG,phiDesg,serie,muestrea,PLAN_LLEGAR,PLAN_INI,RANGO,evaluaReto,ventanaReto,ESCENARIOS,generaReto,generaDx,DX_PLANES};`)();
const { H0, H1, DT, NP, INV, perdInv, etaDescInv, etaCargaInv, acDeDcDesc, acDeDcCarga, BAT, vocDe, corrienteDesc, corrienteCarga, quimica, etaBatDesc, etaBatCarga, etaIdaVuelta, aceptaCarga,
  TARIFAS, tipoHora, precioHora, CASAS, cargaCasa, DESG, phiDesg, serie, PLAN_LLEGAR, PLAN_INI, RANGO, evaluaReto, ventanaReto, ESCENARIOS, generaReto, generaDx, DX_PLANES } = F;

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
let semilla = 20261021; const rnd = () => (semilla = semilla * 48271 % 2147483647) / 2147483647;
const info = (t) => console.log(t);
const alea = () => { const e = ESCENARIOS[Math.floor(rnd() * ESCENARIOS.length)]; return Object.assign({}, e, { s0: 0.2 + rnd() * 0.7, sRes: 0.5, Ecap: [40, 60, 77][Math.floor(rnd() * 3)], tarifa: Math.floor(rnd() * 2), casa: Math.floor(rnd() * 3), esc: 0.7 + rnd() * 0.8, pexp: 1 + rnd() * 3 }); };
const planAlea = () => { const hD0 = 17 + Math.floor(rnd() * 14) * 0.5, hD1 = hD0 + 0.5 + Math.floor(rnd() * 20) * 0.5; return { hD0, hD1: Math.min(31, hD1), Pd: 1 + rnd() * 6.4, piso: 0.2 + rnd() * 0.5, hC: 17 + rnd() * 13.5, exp: rnd() < 0.5 }; };

info('1 · Inversor: pérdidas, rendimiento y sus inversas');
{
  cerca(INV.Pn * (INV.a + INV.b + INV.c), perdInv(INV.Pn), 1e-14, 'pérdida a plena potencia = Pn·(a + b + c)');
  cerca(etaDescInv(INV.Pn), 1 / (1 + INV.a + INV.b + INV.c), 1e-14, 'η descarga a Pn = 1/(1 + a + b + c) = 94,8 %');
  let maxD = 0, maxC = 0;
  for (let i = 0; i < 3000; i++) { const P = 0.2 + rnd() * 7.2; maxD = Math.max(maxD, Math.abs(acDeDcDesc(P + perdInv(P)) - P)); maxC = Math.max(maxC, Math.abs(acDeDcCarga(P - perdInv(P)) - P)); }
  ok(maxD < 1e-11, 'inversa de descarga: P_ac(P_ac + pérdida) = P_ac', maxD.toExponential(1));
  ok(maxC < 1e-11, 'inversa de carga: P_ac(P_ac − pérdida) = P_ac', maxC.toExponential(1));
  // el máximo de η está donde la pérdida fija iguala a la resistiva: p* = √(a/c)
  let mejor = 0, Pm = 0; for (let P = 0.05; P <= INV.Pn; P += 0.0005) { const e = etaDescInv(P); if (e > mejor) { mejor = e; Pm = P; } }
  cerca(Pm, INV.Pn * Math.sqrt(INV.a / INV.c), 1e-3, 'el rendimiento máximo está en p* = √(a/c)', `P*=${Pm.toFixed(3)} kW, η=${(mejor * 100).toFixed(2)} %`);
  ok(etaDescInv(0.5) < etaDescInv(3) && etaDescInv(0.2) < etaDescInv(0.5), 'a poca carga el rendimiento cae (0,5 kW < 3 kW)');
  ok(etaCargaInv(3) < etaDescInv(3), 'en carga se pierde algo más que en descarga a la misma P (pérdida/P_ac frente a pérdida/(P_ac + pérdida))');
  ok(etaDescInv(0) === 0 && etaCargaInv(0) === 0, 'sin potencia no hay rendimiento definido');
}

info('2 · Batería: V_oc, corriente y rendimiento');
{
  cerca(vocDe(0), 96 * 3.35, 1e-14, 'V_oc(0 %) = 321,6 V'); cerca(vocDe(1), 96 * 4.10, 1e-14, 'V_oc(100 %) = 393,6 V');
  let mc = 0, md = 0;
  for (let i = 0; i < 2000; i++) { const s = rnd(), P = rnd() * 9, v = vocDe(s), Ic = corrienteCarga(P, v), Id = corrienteDesc(P, v);
    mc = Math.max(mc, Math.abs(BAT.R * Ic * Ic + v * Ic - P * 1000) / (P * 1000 + 1)); md = Math.max(md, Math.abs(BAT.R * Id * Id - v * Id + P * 1000) / (P * 1000 + 1)); }
  ok(mc < 1e-11, 'carga: R·I² + V_oc·I = P', mc.toExponential(1)); ok(md < 1e-11, 'descarga: R·I² − V_oc·I + P = 0', md.toExponential(1));
  ok(etaBatDesc(7, 0.5) < 1 && etaBatCarga(7, 0.5) < 1 && etaBatDesc(7, 0.5) > 0.98, 'la batería pierde menos del 2 % a 7 kW');
  const rt = etaIdaVuelta(4, 0.6);
  ok(rt > 0.85 && rt < 0.92, 'ida y vuelta a 4 kW entre 85 y 92 %', (rt * 100).toFixed(1) + ' %');
  cerca(etaIdaVuelta(4, 0.6), etaCargaInv(4) * etaBatCarga(4 - perdInv(4), 0.6) * etaBatDesc(4 + perdInv(4), 0.6) * etaDescInv(4), 1e-14, 'ida y vuelta = producto de las cuatro etapas');
  ok(aceptaCarga(0.5) === 1 && aceptaCarga(0.94) < 1 && aceptaCarga(1) >= 0.08, 'la batería acepta menos carga cerca del tope');
}

info('3 · Tarifa y casa');
{
  for (const t of [0, 1]) { let ok24 = true; for (let h = 0; h < 24; h += 0.25) if (![0, 1, 2].includes(tipoHora(t, h))) ok24 = false; ok(ok24, `tarifa ${t}: todas las horas tienen nivel`); }
  ok(precioHora(0, 3) === 1.20 && precioHora(0, 20) === 5.10 && precioHora(0, 12) === 2.30 && precioHora(0, 23) === 2.30, 'tarifa A: valle 1,20 · intermedia 2,30 · punta 5,10');
  ok(precioHora(0, 27) === precioHora(0, 3), 'la hora pasa de 24 a la madrugada (27 h = 03:00)');
  let min = 9, max = 0; for (const c of [0, 1, 2]) for (let h = H0; h < H1; h += DT) { const L = cargaCasa(h, c, 1); min = Math.min(min, L); max = Math.max(max, L); }
  ok(min > 0.2 && max < 5, 'perfiles de casa entre 0,2 y 5 kW', `${min.toFixed(2)}–${max.toFixed(2)}`);
  ok(cargaCasa(20, 0, 2) / cargaCasa(20, 0, 1) - 2 < 1e-12, 'la escala multiplica el perfil');
}

info('4 · Conservación de la energía y límites (300 noches al azar)');
{
  let mRed = 0, mBat = 0, mTot = 0, malLim = 0, malPiso = 0, malTope = 0, malExc = 0, malPn = 0, malBal = 0;
  for (let k = 0; k < 300; k++) {
    const sc = alea(), p = planAlea(), S = serie(sc, p), r = S.res;
    mRed = Math.max(mRed, Math.abs(r.cierreRed)); mBat = Math.max(mBat, Math.abs(r.cierreBat)); mTot = Math.max(mTot, Math.abs(r.cierreTotal));
    for (let i = 0; i < NP; i++) {
      if (S.modo[i] === 1) { if (S.Pimp[i] > sc.Pred + 1e-9) malLim++; if (S.Pcar[i] > INV.Pn + 1e-9) malPn++; }
      if (S.modo[i] === 2) { if (S.Pdesc[i] > p.Pd + 1e-9 || S.Pdesc[i] > INV.Pn + 1e-9) malPn++; if (!p.exp && S.Pexp[i] > 1e-12) malExc++; }
      if (S.s[i + 1] > sc.sTope + 1e-9 && S.s[i + 1] > S.s[i] + 1e-12) malTope++;
      if (S.modo[i] === 2 && S.s[i + 1] < p.piso - 1e-9) malPiso++;
      // balance instantáneo AC: importación − exportación = casa + (stby si espera) + carga − descarga
      const bal = S.Pimp[i] - S.Pexp[i] - (S.L[i] + (S.modo[i] === 0 ? INV.stby : 0) + S.Pcar[i] - S.Pdesc[i]); if (Math.abs(bal) > 1e-9) malBal++;
    }
  }
  ok(mRed < 1e-9, 'red = casa + stby + carga AC − descarga AC', mRed.toExponential(1) + ' kWh');
  ok(mBat < 1e-9, 'ΔE batería = Σ carga química − Σ descarga química', mBat.toExponential(1));
  ok(mTot < 1e-9, 'red = casa + stby + ΔE + pérdidas del inversor + pérdidas de la batería', mTot.toExponential(1));
  ok(malBal === 0, 'balance AC en cada paso de 10 min'); ok(malLim === 0, 'al cargar, la red nunca pasa del límite del contrato'); ok(malPn === 0, 'el cargador nunca pasa de 7,4 kW ni del tope pedido');
  ok(malPiso === 0, 'nunca se descarga por debajo del piso'); ok(malTope === 0, 'la carga se detiene en el tope'); ok(malExc === 0, 'sin «Casa y red» no se exporta un solo watt');
}

info('5 · Costo y desgaste recalculados aparte');
{
  let mc = 0, mf = 0, mb = 0;
  for (let k = 0; k < 120; k++) {
    const sc = alea(), p = planAlea(), S = serie(sc, p); let c = 0, f = 0, cs = 0;
    for (let i = 0; i < NP; i++) { const h = H0 + i * DT; c += precioHora(sc.tarifa, h) * (S.Pimp[i] - 0) * DT - sc.pexp * S.Pexp[i] * DT; cs += precioHora(sc.tarifa, h) * cargaCasa(h, sc.casa, sc.esc) * DT;
      if (S.modo[i] === 2) { const v = vocDe(S.s[i]), I = corrienteDesc(S.Pdc[i] * -1, v), Pq = quimica(I, v); f += DESG.F1 * (Pq * DT / sc.Ecap) * (1 + 4 * (1 - S.s[i]) * (1 - S.s[i])); } }
    mc = Math.max(mc, Math.abs(c - S.res.costo)); mf = Math.max(mf, Math.abs(f - S.res.fade)); mb = Math.max(mb, Math.abs(cs - S.res.costoSin));
  }
  ok(mc < 1e-9, 'costo = Σ p·importación·Δt − p_venta·exportación·Δt', mc.toExponential(1)); ok(mf < 1e-12, 'desgaste = Σ F1·(E_química/E_cap)·φ(s)', mf.toExponential(1)); ok(mb < 1e-9, 'costo sin coche = Σ p·L·Δt', mb.toExponential(1));
  ok(phiDesg(1) === 1 && phiDesg(0.2) > 3 && phiDesg(0.5) < phiDesg(0.3), 'φ(s): 1 con la batería llena y crece al vaciarse');
  // sin devolver nada no hay desgaste; cargar al llegar cuesta más que cargar de madrugada
  const sc = ESCENARIOS[0], a = serie(sc, PLAN_LLEGAR), b = serie(sc, { hD0: 17, hD1: 17, Pd: 3, piso: 0.5, hC: 25, exp: false });
  ok(a.res.fade === 0 && b.res.fade === 0, 'sin devolver energía no hay desgaste por V2X');
  ok(b.res.costo < a.res.costo, 'cargar de madrugada (valle) cuesta menos que cargar al llegar', `${b.res.costo.toFixed(1)} < ${a.res.costo.toFixed(1)}`);
  // caso de libro: cargar 10 kWh químicos en el valle
  const ex = serie(Object.assign({}, sc, { s0: 0.5, sTope: 0.5 + 10 / 60 }), { hD0: 17, hD1: 17, Pd: 1, piso: 0.2, hC: 24, exp: false });
  cerca(ex.res.E.cQ, 10, 1e-9, 'la carga llega justo al tope pedido (10 kWh químicos)');
  ok(ex.res.E.cAC > ex.res.E.cQ && ex.res.E.cAC / ex.res.E.cQ < 1.12, 'la red da 5–12 % más que lo que se guarda', (ex.res.E.cAC / ex.res.E.cQ).toFixed(3));
}

info('6 · Reto: ventanas, centros robustos y valores iniciales');
{
  const pasos = (p, d, dir) => { const q = Object.assign({}, p); if (d === 'hD0') q.hD0 += 0.5 * dir; if (d === 'hD1') q.hD1 += 0.5 * dir; if (d === 'Pd') q.Pd += 0.5 * dir; if (d === 'piso') q.piso = Math.round((q.piso + 0.05 * dir) * 100) / 100; if (d === 'hC') q.hC += 0.5 * dir; return q; };
  ESCENARIOS.forEach((sc, i) => {
    const c = evaluaReto(sc, sc.ventana.centro); ok(c.ok, `escenario ${i}: el centro cumple los tres`, `costo ${c.costo.toFixed(1)}/${sc.Cobj}, desgaste ${c.fade.toFixed(5)}/${sc.Dmax}, sale con ${c.sDep.toFixed(2)}/${sc.sRes}`);
    let vecinos = 0; for (const d of ['hD0', 'hD1', 'Pd', 'piso', 'hC']) for (const dir of [-1, 1]) if (evaluaReto(sc, pasos(sc.ventana.centro, d, dir)).ok) vecinos++;
    ok(vecinos >= 9, `escenario ${i}: el centro tiene ${vecinos} de 10 vecinos que también cumplen`);
    const ini = evaluaReto(sc, PLAN_INI); ok(!ini.ok, `escenario ${i}: los mandos iniciales NO cumplen`);
    const llegar = evaluaReto(sc, PLAN_LLEGAR); ok(!llegar.ok && !llegar.okC, `escenario ${i}: cargar al llegar no cumple (costo ${llegar.costo.toFixed(0)})`);
    // cada criterio muerde: con la reserva alta falla R, sin devolver falla C, devolviendo todo falla D
    const sinDar = evaluaReto(sc, { hD0: 17, hD1: 17, Pd: 1, piso: 0.5, hC: 25, exp: false }); ok(!sinDar.okC, `escenario ${i}: sin devolver nada no llega a la meta de costo`);
    const todo = evaluaReto(sc, { hD0: 17, hD1: 31, Pd: 7.4, piso: 0.2, hC: 28.5, exp: true }); ok(!todo.okD || !todo.okR, `escenario ${i}: dar todo lo posible rompe el desgaste o la reserva`);
    const tarde = evaluaReto(sc, Object.assign({}, sc.ventana.centro, { hC: 30.5 })); ok(!tarde.okR, `escenario ${i}: empezar a cargar a las 06:30 no llega a la reserva`);
    const punta = evaluaReto(sc, Object.assign({}, sc.ventana.centro, { hC: 17 })); ok(!punta.ok, `escenario ${i}: cargar al llegar (punta) rompe el plan ganador`);
    if (!RAPIDO) { const v = ventanaReto(sc); ok(v.cuenta === sc.ventana.cuenta, `escenario ${i}: la ventana recalculada tiene ${v.cuenta} planes (declarados ${sc.ventana.cuenta})`, `de ${v.total}`); ok(v.cuenta > 40 && v.cuenta / v.total < 0.01, `escenario ${i}: ventana estrecha (${(v.cuenta / v.total * 100).toFixed(2)} %) pero alcanzable`); }
  });
  const k = new Set(); for (let i = 0; i < 40; i++) k.add(generaReto(rnd).idx); ok(k.size >= 3, 'generaReto sortea varios escenarios');
  let seg = 0; let ult = -1; for (let i = 0; i < 60; i++) { const g = generaReto(rnd); if (g.idx === ult) seg++; ult = g.idx; } ok(seg === 0, 'generaReto no repite el escenario dos veces seguidas');
}

info('7 · Diagnóstico: tres firmas distintas');
{
  for (const sc of ESCENARIOS) {
    const P = serie(sc, DX_PLANES.punta).res, V = serie(sc, DX_PLANES.vende).res, D = serie(sc, DX_PLANES.profundo).res;
    ok(P.tLimRed > 1 && P.exp === 0 && P.sMin >= sc.s0 - 1e-9, 'punta: choca con el límite de la red, no exporta y no baja de lo que traía', `tLim ${P.tLimRed.toFixed(1)} h`);
    ok(V.exp > 3 && V.fade > 0.003, 'vende: exporta kWh de verdad y gasta batería', `${V.exp.toFixed(1)} kWh`);
    ok(D.sMin < sc.s0 && D.sMin <= 0.31 && D.sDep < sc.sRes && D.fade > 0.004 && D.exp === 0, 'profundo: vacía la batería hasta ~20–30 %, sale sin la reserva y sin exportar', 'sMin ' + D.sMin.toFixed(2));
    ok(P.sDep > V.sDep || P.sDep >= 0.8, 'punta: carga completa a la salida');
  }
  const t = new Set(); for (let i = 0; i < 60; i++) t.add(generaDx(rnd).tipo); ok(t.size === 3, 'generaDx sortea los tres tipos');
}

console.log(`\n${n - malas}/${n} comprobaciones correctas`);
if (malas) { console.log('FALLOS:\n' + fallos.join('\n')); process.exit(1); }
