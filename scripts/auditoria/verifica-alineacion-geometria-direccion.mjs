// Verificación de la física del lab alineacion-geometria-direccion: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas (Ackermann, cuadrilátero, modelo de cepillo, Rodrigues), simetrías y mínimos numéricos.
// uso: node verifica.mjs [ruta del html o del bloque .js]
import { readFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
const AQUI = dirname(fileURLToPath(import.meta.url));
const REPO = 'C:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public/labs/alineacion-geometria-direccion.html';
const RUTA = process.argv[2] || resolve(AQUI, '../../public/labs/alineacion-geometria-direccion.html');
const ruta = existsSync(RUTA) ? RUTA : (existsSync(REPO) ? REPO : resolve(AQUI, 'fisica.js'));
let src = readFileSync(ruta, 'utf8');
if (src.includes('/* FISICA:INICIO */')) src = src.slice(src.indexOf('/* FISICA:INICIO */'), src.indexOf('/* FISICA:FIN */'));
const F = new Function(src + `\nreturn {DEG,DOSPI,G0,COCHE,rad,grd,cot,wrap,ackIdeal,radioEje,centrosEje,interseccion,anguloBrazo,brazo0,gamaBrazo,barraParaGama,gamaJeantaud,giroRuedas,puntosTrapecio,recorridoMax,sParaInterior,viraje,tablaAck,errorAck,porcAck,thetaB,cepillo,derivaDeFuerza,brazoMec,parAutoalineante,orientaRueda,dCamberGiro,Crr,FxRueda,toeSalida,rectaRueda,rectaEje,toeOptimo,virajeCoche,dinamicaCurva,parVolante,diamViraje,velocidadesRuedas};`)();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const f = (x, d = 3) => (+x).toFixed(d);
const { DEG, COCHE } = F;
const GP = { L: 2.70, t: 1.50, r: 0.30, h: 0.13, a: 0.14 }; GP.b = F.barraParaGama(GP, F.gamaJeantaud(GP.L, GP.t));

console.log('1 · Ackermann ideal y centro de giro');
{ let eMax = 0, cMax = 0, rMax = 0;
  for (const [L, t] of [[2.45, 1.42], [2.70, 1.50], [3.20, 1.58]]) for (let d = 1; d <= 45; d += 2) {
    const di = d * DEG, de = F.ackIdeal(di, L, t);
    eMax = Math.max(eMax, Math.abs(F.cot(de) - F.cot(di) - t / L));
    const c = F.centrosEje(di, de, L, t); cMax = Math.max(cMax, Math.abs(c.xL - c.xR));
    const I = F.interseccion(di, de, L, t); rMax = Math.max(rMax, Math.abs(I.y + L), Math.abs(I.x - c.xL));
  }
  prueba('cot δ_ext − cot δ_int = t/L (3 coches × 23 ángulos)', eMax < 1e-12, 'máx ' + eMax.toExponential(1));
  prueba('las dos perpendiculares se cortan en el MISMO punto del eje trasero (error del centro)', cMax < 1e-10, 'máx ' + cMax.toExponential(1) + ' m');
  prueba('la intersección geométrica de las dos rectas cae sobre y = −L', rMax < 1e-10, 'máx ' + rMax.toExponential(1) + ' m');
  const di = 25 * DEG, de = F.ackIdeal(di, 2.7, 1.5);
  prueba('R = (L/2)(cot δi + cot δe) es la distancia del centro del eje trasero al centro de giro: |x_centro| = R', cerca(Math.abs(F.centrosEje(di, de, 2.7, 1.5).xL), F.radioEje(di, de, 2.7), 1e-12), 'R = ' + f(F.radioEje(di, de, 2.7), 4) + ' m');
  prueba('ruedas paralelas dan 0 % y las ideales 100 %', cerca(F.porcAck(0.3, 0.3, 2.7, 1.5), 0, 1e-12) && cerca(F.porcAck(di, de, 2.7, 1.5), 100, 1e-9));
  prueba('antisimetría: ackIdeal(−δ) = −ackIdeal(δ) y ackIdeal(0) = 0', F.ackIdeal(-0.4, 2.7, 1.5) === -F.ackIdeal(0.4, 2.7, 1.5) && F.ackIdeal(0, 2.7, 1.5) === 0);
  prueba('δ_ext < δ_int (la rueda interior gira más)', F.ackIdeal(0.5, 2.7, 1.5) < 0.5);
}

console.log('2 · El cuadrilátero de dirección: cierre, simetría y monotonía');
{ let cierre = 0, longA = 0, sim = 0, prev = -1, mono = true;
  for (let s = -0.08; s <= 0.0801; s += 0.004) {
    const P = F.puntosTrapecio(GP, s), g = F.giroRuedas(GP, s), g2 = F.giroRuedas(GP, -s);
    cierre = Math.max(cierre, Math.abs(Math.hypot(P.AL[0] - P.BL[0], P.AL[1] - P.BL[1]) - GP.b), Math.abs(Math.hypot(P.AR[0] - P.BR[0], P.AR[1] - P.BR[1]) - GP.b));
    longA = Math.max(longA, Math.abs(Math.hypot(P.AL[0] - P.PL[0], P.AL[1] - P.PL[1]) - GP.a), Math.abs(Math.hypot(P.AR[0] - P.PR[0], P.AR[1] - P.PR[1]) - GP.a));
    sim = Math.max(sim, Math.abs(g.dL + g2.dR), Math.abs(g.dR + g2.dL));
    if (g.dL <= prev) mono = false; prev = g.dL;
  }
  prueba('|A − B| = b en las dos bieletas, de −80 a +80 mm de cremallera', cierre < 1e-12, 'máx ' + cierre.toExponential(1) + ' m');
  prueba('|A − P| = a (el brazo es rígido)', longA < 1e-12, 'máx ' + longA.toExponential(1) + ' m');
  prueba('simetría izquierda–derecha: δ_L(s) = −δ_R(−s)', sim < 1e-12, 'máx ' + sim.toExponential(1) + ' rad');
  prueba('a cremallera centrada las dos ruedas están rectas', Math.abs(F.giroRuedas(GP, 0).dL) < 1e-12 && Math.abs(F.giroRuedas(GP, 0).dR) < 1e-12);
  prueba('δ_L crece de forma monótona con s', mono);
  const g = F.giroRuedas(GP, 0.05);
  prueba('s > 0 gira a la izquierda: la izquierda es la interior (δ_L > δ_R > 0)', g.dL > g.dR && g.dR > 0, f(g.dL / DEG, 2) + '° / ' + f(g.dR / DEG, 2) + '°');
  prueba('γ del brazo de Jeantaud = atan(L/(t/2)) por construcción de la barra', cerca(F.gamaBrazo(GP), F.gamaJeantaud(2.7, 1.5), 1e-12), f(F.gamaBrazo(GP) / DEG, 3) + '°');
  const GA = { ...GP, b: F.barraParaGama(GP, 70 * DEG) };
  prueba('barraParaGama y gamaBrazo son inversas', cerca(F.gamaBrazo(GA), 70 * DEG, 1e-12));
  prueba('recorrido máximo de cremallera ≥ 80 mm', F.recorridoMax(GP) >= 0.08, f(F.recorridoMax(GP) * 1000, 0) + ' mm');
  const v = F.viraje(GP, 20 * DEG, 1);
  prueba('sParaInterior: la rueda interior llega exactamente al ángulo pedido', cerca(v.int, 20 * DEG, 1e-9), f(v.int / DEG, 6) + '°');
  const w = F.viraje(GP, 20 * DEG, -1);
  prueba('giro a derecha = espejo del giro a izquierda (misma ext, misma err)', cerca(w.ext, v.ext, 1e-9) && cerca(w.err, v.err, 1e-9) && cerca(w.s, -v.s, 1e-9));
}

console.log('3 · El error de Ackermann y el paisaje (a, b)');
{ const JE = F.errorAck(GP, rad30(), 40);
  prueba('con la barra de Jeantaud el error a 30° es ≈ 1,7° (el «de manual» se queda corto)', JE.max / DEG > 1.5 && JE.max / DEG < 1.9, f(JE.max / DEG, 3) + '°');
  const v10 = F.viraje(GP, 10 * DEG), v30 = F.viraje(GP, 30 * DEG);
  prueba('Ackermann real de Jeantaud a 10° ≈ 54 % y sube con el ángulo', F.porcAck(v10.int, v10.ext, 2.7, 1.5) > 50 && F.porcAck(v30.int, v30.ext, 2.7, 1.5) > F.porcAck(v10.int, v10.ext, 2.7, 1.5), f(F.porcAck(v10.int, v10.ext, 2.7, 1.5), 1) + ' % → ' + f(F.porcAck(v30.int, v30.ext, 2.7, 1.5), 1) + ' %');
  // barrido de b a a = 140 mm: el error tiene un mínimo INTERIOR
  const fila = []; for (let b = 0.36; b <= 0.46001; b += 0.0005) fila.push([b, F.errorAck({ ...GP, b }, rad30(), 30).max / DEG]);
  let im = 0; fila.forEach((q, i) => { if (q[1] < fila[im][1]) im = i; });
  prueba('error(b) a a = 140 mm: mínimo interior del rango [360, 460] mm', im > 3 && im < fila.length - 4, 'b* = ' + f(fila[im][0] * 1000, 1) + ' mm, error ' + f(fila[im][1], 3) + '°');
  prueba('el mínimo es ≤ 0,45° (un trapecio ajustado supera con mucho al de Jeantaud)', fila[im][1] < 0.45);
  // barrido de a a b optimizado: todos con mínimo ≈ 0,2–0,45
  const mins = []; for (let a = 0.10; a <= 0.1801; a += 0.02) { let m = 9; for (let b = 0.34; b <= 0.46; b += 0.001) { const e = F.errorAck({ ...GP, a, b }, rad30(), 24); if (!e.incompleto) m = Math.min(m, e.max / DEG); } mins.push(m); }
  prueba('para a = 100…180 mm hay una barra con error < 0,5°: ' + mins.map(x => f(x, 2)).join(' · '), mins.every(m => m < 0.5));
  const ang = F.tablaAck({ ...GP, b: fila[im][0] }, rad30(), 60);
  let cruces = 0; for (let i = 1; i < ang.length; i++) if (ang[i].err * ang[i - 1].err < 0) cruces++;
  prueba('en el óptimo el error cambia de signo (oscila alrededor de cero, no es un sesgo)', cruces >= 1, cruces + ' cruces por cero');
}
function rad30() { return 30 * DEG; }

console.log('4 · Neumático de cepillo y par autoalineante');
{ const N = COCHE.N, mu = COCHE.mu, th = F.thetaB();
  prueba('N = wf·m·g/2 = 4 321 N', cerca(N, 0.58 * 1520 * F.G0 / 2, 1e-9), f(N, 1) + ' N');
  const a0 = 1e-5, c0 = F.cepillo(a0);
  prueba('rigidez de deriva: dF/dα (α → 0) = C_α', cerca(c0.F / a0, COCHE.Cal, COCHE.Cal * 1e-3), f(c0.F / a0, 0) + ' N/rad');
  prueba('brazo neumático t_p(0) = a/3', cerca(c0.tp, COCHE.aH / 3, 1e-5), f(c0.tp * 1000, 3) + ' mm');
  const asat = Math.atan(1 / th), cs = F.cepillo(asat * 1.0000001);
  prueba('a la deriva de saturación F = μN y t_p = 0', cerca(cs.F, mu * N, 1e-6) && cs.tp === 0, f(asat / DEG, 3) + '°');
  prueba('F es continua en la saturación', cerca(F.cepillo(asat * 0.999999).F, mu * N, mu * N * 1e-5));
  let mono = true, prev = 0; for (let a = 0.001; a < 0.3; a += 0.001) { const F1 = F.cepillo(a).F; if (F1 < prev - 1e-9) mono = false; prev = F1; }
  prueba('F(α) crece de forma monótona y nunca pasa de μN', mono && prev <= mu * N + 1e-9);
  let rt = 0; for (const q of [0.05, 0.2, 0.5, 0.8, 0.95]) { const F1 = q * mu * N, a = F.derivaDeFuerza(F1); rt = Math.max(rt, Math.abs(F.cepillo(a).F - F1)); }
  prueba('derivaDeFuerza es la inversa exacta de F_y', rt < 1e-7, 'máx ' + rt.toExponential(1) + ' N');
  // M_neu = μ N a x (1 − x)³ (identidad algebraica) y su máximo en x = 1/4
  let idm = 0, mx = -1, xm = 0; for (let x = 0.005; x < 1; x += 0.005) { const al = Math.atan(x / th), c = F.cepillo(al); const cerr = Math.abs(c.F * c.tp - mu * N * COCHE.aH * x * Math.pow(1 - x, 3)); idm = Math.max(idm, cerr); const Mn = c.F * c.tp; if (Mn > mx) { mx = Mn; xm = x; } }
  prueba('F·t_p = μ·N·a·x·(1 − x)³ (identidad del modelo de cepillo)', idm < 1e-9, 'máx ' + idm.toExponential(1) + ' N·m');
  prueba('el par del neumático alcanza su máximo en x = 1/4, interior al rango de deriva', cerca(xm, 0.25, 0.006), 'x = ' + f(xm, 3) + ' → α = ' + f(Math.atan(xm / th) / DEG, 2) + '°, ' + f(mx, 2) + ' N·m');
  const pa = F.parAutoalineante(3 * DEG, 5 * DEG);
  prueba('par total = F·(t_p + R_w·tan ε); a 3° y ε = 5°: ' + f(pa.M, 1) + ' N·m (neumático ' + f(pa.Mneu, 1) + ' + mecánico ' + f(pa.Mmec, 1) + ')', cerca(pa.M, pa.F * (pa.tp + COCHE.Rw * Math.tan(5 * DEG)), 1e-9) && cerca(pa.Mneu + pa.Mmec, pa.M, 1e-9));
  prueba('el avance suma par aun saturado (el neumático ya no): M(sat) = μN·R_w·tan ε', cerca(F.parAutoalineante(0.5, 5 * DEG).M, mu * N * COCHE.Rw * Math.tan(5 * DEG), 1e-9));
  prueba('a ε = 0 el par es sólo el neumático y se anula al saturar', cerca(F.parAutoalineante(0.5, 0).M, 0, 1e-9));
}

console.log('5 · Caída al girar con el pivote inclinado (Rodrigues)');
{ const e = 5 * DEG, psi = 20 * DEG;
  prueba('sin giro la caída es la estática (γ0 = −1,5°)', cerca(F.orientaRueda(1, e, 8 * DEG, -1.5 * DEG, 0).camber, -1.5 * DEG, 1e-12));
  const ext = F.dCamberGiro(1, e, 0, 0, psi), int = F.dCamberGiro(-1, e, 0, 0, psi);
  prueba('forma cerrada (KPI = 0): Δγ = −asin(sen ε · sen ψ) en la rueda exterior', cerca(ext, -Math.asin(Math.sin(e) * Math.sin(psi)), 1e-12), f(ext / DEG, 4) + '°');
  prueba('avance positivo: la rueda exterior gana caída negativa y la interior positiva', ext < 0 && int > 0 && cerca(ext, -int, 1e-12));
  prueba('espejo: caída(derecha, +ψ) = caída(izquierda, −ψ)', cerca(F.dCamberGiro(1, e, 8 * DEG, 0.5 * DEG, psi), F.dCamberGiro(-1, e, 8 * DEG, 0.5 * DEG, -psi), 1e-12));
  prueba('sin avance ni KPI el giro no cambia la caída', cerca(F.dCamberGiro(1, 0, 0, 0, psi), 0, 1e-12));
  const r = F.orientaRueda(1, e, 0, 0, psi);
  prueba('el rumbo de la rueda gira ψ con un pivote vertical y ≈ ψ con avance de 5° (dif < 0,1°)', cerca(F.orientaRueda(1, 0, 0, 0, psi).rumbo, psi, 1e-12) && Math.abs(r.rumbo - psi) < 0.1 * DEG, f((r.rumbo - psi) / DEG, 4) + '° de diferencia');
  prueba('Δγ crece con el avance: ε = 8° da más que ε = 4°', Math.abs(F.dCamberGiro(1, 8 * DEG, 0, 0, psi)) > Math.abs(F.dCamberGiro(1, 4 * DEG, 0, 0, psi)));
}

console.log('6 · Convergencia, caída y arrastre lateral en recta');
{ const v = 110 / 3.6, k = 1.8e-5, gam = -0.8 * DEG;
  const tau = F.toeOptimo(gam, v, k), E = F.rectaEje(tau, tau, gam, gam, v, k);
  prueba('con la convergencia óptima la deriva efectiva y el arrastre son cero', cerca(E.L.ae, 0, 1e-15) && cerca(E.arrastre, 0, 1e-9), 'τ* = ' + f(tau / DEG, 4) + '° por rueda');
  let mn = 1e9, tm = 0; for (let t = -0.5; t <= 0.9; t += 0.001) { const a = F.rectaEje(t * DEG, t * DEG, gam, gam, v, k).arrastre; if (a < mn) { mn = a; tm = t; } }
  prueba('el barrido numérico coincide con el mínimo exacto (óptimo interior de [−0,5°, 0,9°])', cerca(tm, tau / DEG, 0.002) && tm > -0.45 && tm < 0.85, 'barrido ' + f(tm, 3) + '° · exacto ' + f(tau / DEG, 3) + '°');
  prueba('fuerzas iguales y opuestas en cada rueda: fuerza neta 0 y volante centrado', cerca(F.rectaEje(0.1 * DEG, 0.1 * DEG, gam, gam, v, k).Fneta, 0, 1e-9));
  const A = F.rectaEje(0.3 * DEG, 0, gam, gam, v, k);
  prueba('una sola rueda con más convergencia empuja el eje hacia el lado contrario y descentra el volante', A.Fneta > 0 && A.volante > 0, f(A.Fneta, 0) + ' N · ' + f(A.volante / DEG, 3) + '°');
  const Ca = F.rectaEje(tau, tau, -1.8 * DEG, -0.2 * DEG, v, k);
  prueba('caída desigual (izq. −1,8°, der. −0,2°): empuja hacia el lado de la rueda con MÁS caída negativa (hacia la derecha)', Ca.Fneta > 0, f(Ca.Fneta, 0) + ' N');
  const v50 = F.toeSalida(50 / 3.6, k), v130 = F.toeSalida(130 / 3.6, k);
  prueba('la apertura τ_c crece con la velocidad: ' + f(v50 / DEG, 3) + '° a 50 km/h → ' + f(v130 / DEG, 3) + '° a 130 km/h', v130 > 2 * v50);
  prueba('F_x por rueda a 110 km/h = (½ρC_dA·v² + C_rr·m·g)/2', cerca(F.FxRueda(v), (0.5 * 1.2 * 0.64 * v * v + F.Crr(v) * 1520 * F.G0) / 2, 1e-9), f(F.FxRueda(v), 1) + ' N');
  prueba('V del arrastre: a ±δ del óptimo el arrastre es igual (simetría)', cerca(F.rectaEje(tau + 0.2 * DEG, tau + 0.2 * DEG, gam, gam, v, k).arrastre, F.rectaEje(tau - 0.2 * DEG, tau - 0.2 * DEG, gam, gam, v, k).arrastre, 1e-6));
}

console.log('7 · El coche girando: deriva por Ackermann, fuerzas y esfuerzo en el volante');
{ const di = 25 * DEG, de = F.ackIdeal(di, 2.7, 1.5), VC = F.virajeCoche(GP, di, de);
  prueba('con los ángulos ideales la deriva cinemática de las dos ruedas es cero', Math.abs(VC.aL) < 1e-9 && Math.abs(VC.aR) < 1e-9, 'aL ' + VC.aL.toExponential(1) + ' · aR ' + VC.aR.toExponential(1));
  prueba('el centro del giro está a la izquierda a R = (L/2)(cot δi + cot δe)', cerca(VC.R, F.radioEje(di, de, 2.7), 1e-9) && VC.Xc < 0, f(VC.R, 3) + ' m');
  const V = F.viraje(GP, 25 * DEG), VJ = F.virajeCoche(GP, V.dL, V.dR);
  prueba('con la barra de Jeantaud la deriva por error de Ackermann es de ~1° y de signo opuesto en las dos ruedas', Math.abs(VJ.aL) > 0.3 * DEG && VJ.aL * VJ.aR < 0, f(VJ.aL / DEG, 3) + '° · ' + f(VJ.aR / DEG, 3) + '°');
  const Vd = F.virajeCoche(GP, -di, -de);
  prueba('giro a la derecha: centro a la derecha y mismo radio', Vd.Xc > 0 && cerca(Vd.R, VC.R, 1e-9));
  const D = F.dinamicaCurva(20, 12, 5 * DEG), ay = 144 / 20;
  prueba('a_y = v²/R y F por rueda = wf·m·a_y/2', cerca(D.ay, ay, 1e-12) && cerca(D.F, 0.58 * 1520 * ay / 2, 1e-9), 'a_y = ' + f(D.ay / F.G0, 3) + ' g · F = ' + f(D.F, 0) + ' N · α = ' + f(D.alfa / DEG, 2) + '°');
  prueba('la fuerza del cepillo con la deriva calculada devuelve F', cerca(F.cepillo(D.alfa).F, D.F, 1e-6));
  const Dm = F.dinamicaCurva(5, 25, 5 * DEG);
  prueba('muy rápido en curva cerrada: a_y se acota en μg y el par del neumático casi desaparece (' + f(Dm.Mneu, 2) + ' N·m frente a 26,7 de pico)', Dm.sat && Dm.Mneu < 0.5 && cerca(Dm.ay, 0.999 * COCHE.mu * F.G0, 1e-9));
  const T = F.parVolante(GP, 0.05, 100, 100);
  const g1 = F.giroRuedas(GP, 0.05 - 0.01), g2 = F.giroRuedas(GP, 0.05 + 0.01), sec = COCHE.rp * 100 * ((g2.dL - g1.dL) + (g2.dR - g1.dR)) / 0.02;
  prueba('esfuerzo en el volante por trabajo virtual coincide con el cociente incremental', cerca(T, sec, sec * 0.01), f(T, 3) + ' N·m (incremental ' + f(sec, 3) + ')');
  const Tc = F.parVolante({ ...GP, a: 0.18, b: F.barraParaGama({ ...GP, a: 0.18 }, F.gamaJeantaud(2.7, 1.5)) }, 0.05, 100, 100);
  prueba('un brazo más largo gira menos las ruedas por mm de cremallera: el volante pesa MENOS', Tc < T && Number.isFinite(Tc), f(T, 3) + ' → ' + f(Tc, 3));
  const W = F.velocidadesRuedas(GP, VC.Xc, 10);
  prueba('velocidad de las ruedas: la exterior recorre más que la interior (delante y detrás)', W.vFR > W.vFL && W.vRR > W.vRL && W.vFL > W.vRL, f(W.vRL, 2) + ' < ' + f(W.vRR, 2) + ' m/s (traseras)');
  prueba('diámetro de viraje por la rueda exterior', cerca(F.diamViraje(VC.R, 2.7, 1.5), 2 * Math.hypot(VC.R + 0.75, 2.7), 1e-12), f(F.diamViraje(VC.R, 2.7, 1.5), 2) + ' m');
}

console.log('\n' + ok + ' pruebas en verde, ' + mal + ' fallidas');
process.exit(mal ? 1 : 0);
