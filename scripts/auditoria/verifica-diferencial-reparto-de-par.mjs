// Verificación de la física del lab diferencial-reparto-de-par: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-diferencial-reparto-de-par.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, G, RAD, VEH, TIRE, OMEGA0, MODOS, K_MIN, K_MAX, DT_MAX, cinematica, rpm, cargas, reparto, patinamiento, evalua, barridoMu, ventana, evaluaReto, generaReto, generaDx } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
let semilla = 12345; const rnd = () => (semilla = semilla * 48271 % 2147483647) / 2147483647;
const BASE = { V: 10, R: 25, hielo: 'L', mulo: 0.25, muhi: 0.9, acel: 0.55 };
const alAzar = () => ({ V: 4 + rnd() * 14, R: rnd() < 0.12 ? Infinity : 8 + rnd() * 80, hielo: rnd() < 0.5 ? 'L' : 'R', mulo: 0.08 + rnd() * 0.85, muhi: 0.9, acel: rnd(), modo: MODOS[Math.floor(rnd() * 3)], kappa: 1 + rnd() * 5, dTmax: rnd() * 1500 });

console.log('1 · Cinemática del diferencial (ω_L + ω_R = 2·ω_caja)');
{
  let maxE = 0, maxR = 0;
  for (let i = 0; i < 2000; i++) {
    const V = 1 + rnd() * 30, R = 5 + rnd() * 200, c = cinematica(V, R);
    maxE = Math.max(maxE, Math.abs(c.wL + c.wR - 2 * c.wc) / c.wc);
    maxR = Math.max(maxR, Math.abs(c.wR / c.wL - (R + VEH.t / 2) / (R - VEH.t / 2)));
  }
  prueba('ω_L + ω_R = 2·ω_caja en 2 000 curvas al azar', maxE < 1e-14, `error relativo máx. ${maxE.toExponential(1)}`);
  prueba('ω_R/ω_L = (R + t/2)/(R − t/2): las dos ruedas giran sobre radios de curvatura distintos', maxR < 1e-12, `error ${maxR.toExponential(1)}`);
  const c = cinematica(10, 25);
  prueba('rueda interior a 10 m/s en R = 25 m: ω = V(1 − t/2R)/r = 31,26 rad/s = 298,5 rpm', Math.abs(c.wL - 10 * (1 - 1.55 / 50) / 0.31) < 1e-12 && Math.abs(rpm(c.wL) - 298.5) < 0.1, `${f(c.wL, 3)} rad/s = ${f(rpm(c.wL), 1)} rpm`);
  prueba('el exterior gira a 10·(1 + 0,031)/0,31 = 33,26 rad/s', Math.abs(c.wR - 33.258) < 1e-3, `${f(c.wR, 3)} rad/s`);
  prueba('la diferencia ω_R − ω_L = V·t/(R·r) (la que absorben los satélites)', rel(c.dw, 10 * 1.55 / (25 * 0.31)) < 1e-13, `${f(c.dw, 4)} rad/s`);
  prueba('en recta las dos ruedas giran igual y la caja también', cinematica(10, Infinity).dw === 0 && cinematica(10, Infinity).wL === cinematica(10, Infinity).wc);
  prueba('las velocidades de rueda son las de un cuerpo rígido en giro: v = ω_yaw·(R ∓ t/2)', Math.abs(c.vL - c.yaw * (25 - 0.775)) < 1e-12 && Math.abs(c.vR - c.yaw * (25 + 0.775)) < 1e-12);
}

console.log('2 · Estática del reparto de par');
{
  const e = evalua({ ...BASE, modo: 'abierto', V: 5, R: Infinity, mulo: 0.9, acel: 0.3 });
  prueba('abierto sin límite: T_L = T_R = T_caja/2', Math.abs(e.TL - e.TR) < 1e-9 && rel(e.TL + e.TR, 0.3 * VEH.Tmax) < 1e-12, `${f(e.TL, 1)} N·m cada una`);
  let maxD = 0, n = 0;
  for (let i = 0; i < 600; i++) { const e2 = evalua(alAzar()); n++; maxD = Math.max(maxD, Math.abs(e2.Tc - e2.TL - e2.TR)); }
  prueba('el par en la caja es siempre T_L + T_R (equilibrio del portasatélites)', maxD < 1e-9, `${n} casos`);
  const t = evalua({ V: 9, R: 15, hielo: 'L', mulo: 0.9, muhi: 0.9, acel: 0.15, modo: 'tbr', kappa: 3 });
  const lam = 0.5 * Math.tanh(t.cin.dw / OMEGA0), razon = t.TL / t.TR, esp = (1 + lam) / (1 - lam);
  prueba('autoblocante en curva con agarre de sobra: T_lenta/T_rápida = (1+λ)/(1−λ), λ = (TBR−1)/(TBR+1)·tanh(Δω/ω₀)', rel(razon, esp) < 1e-12 && Math.abs(esp - 3) < 1e-3, `${f(razon, 4)} (TBR = 3)`);
  prueba('el par va a la rueda LENTA (la interior): T_L > T_R', t.TL > t.TR);
  const r1 = evalua({ ...BASE, V: 8, R: 40, mulo: 0.9, acel: 0.15, modo: 'tbr', kappa: 1 });
  prueba('TBR = 1 es exactamente un diferencial abierto', Math.abs(r1.TL - r1.TR) < 1e-12);
}

console.log('3 · Límite de adherencia y suelo dividido');
{
  const b = { V: 3, R: Infinity, hielo: 'L', mulo: 0.2, muhi: 0.9, acel: 1 };
  const a = evalua({ ...b, modo: 'abierto' });
  const NL = a.c.NL, NR = a.c.NR;
  prueba('en recta las dos ruedas traseras cargan lo mismo', Math.abs(NL - NR) < 1e-9);
  prueba('abierto en suelo dividido: F_x = 2·μ_bajo·N (manda la rueda que menos agarra)', rel(a.Fx, 2 * 0.2 * NL) < 1e-12, `${f(a.Fx, 1)} N = 2·0,2·${f(NL, 1)}`);
  const l = evalua({ ...b, modo: 'tbr', kappa: 1e6 });
  prueba('bloqueo total (TBR → ∞): F_x = μ_bajo·N + el resto hasta μ_alto·N (limitado por el par)', rel(l.Fx, Math.min(0.2 * l.c.NL + 0.9 * l.c.NR, a.Tdem / VEH.rw)) < 1e-6, `${f(l.Fx, 1)} N`);
  const t3 = evalua({ ...b, modo: 'tbr', kappa: 3 });
  prueba('TBR = 3: la rueda de adherencia alta recibe 3 veces el par de la que patina, F_x = (1 + TBR)·μ_bajo·N', rel(t3.Fx, 4 * 0.2 * t3.c.NL) < 1e-6, `${f(t3.Fx, 1)} N`);
  prueba('abierto < TBR 3 < bloqueo', a.Fx < t3.Fx && t3.Fx < l.Fx);
  const v = evalua({ ...b, modo: 'vector', dTmax: 1500 });
  prueba('vectorización con capacidad de sobra: F_x = μ_bajo·N + μ_alto·N (tracción máxima)', rel(v.Fx, Math.min(0.2 * v.c.NL + 0.9 * v.c.NR, v.Tdem / VEH.rw)) < 1e-6, `${f(v.Fx, 1)} N`);
  const v0 = evalua({ ...b, modo: 'vector', dTmax: 0 });
  prueba('vectorización con ΔT_max = 0 se comporta como el abierto', rel(v0.Fx, a.Fx) < 1e-6);
  const s = evalua({ ...b, mulo: 0.9, modo: 'abierto' });
  const s2 = evalua({ ...b, mulo: 0.9, modo: 'tbr', kappa: 5 }), s3 = evalua({ ...b, mulo: 0.9, modo: 'vector', dTmax: 900 });
  prueba('con el mismo agarre en las dos ruedas los tres diferenciales dan la misma tracción', Math.abs(s.Fx - s2.Fx) < 1e-6 && Math.abs(s.Fx - s3.Fx) < 1e-6, `${f(s.Fx, 1)} N`);
  let maxU = 0, maxSum = 0, cs = 0;
  for (let i = 0; i < 1500; i++) {
    const e = evalua(alAzar());
    maxU = Math.max(maxU, e.uL, e.uR);
    if (!e.c.desliza) { maxSum = Math.max(maxSum, Math.abs(e.c.FyL + e.c.FyR - e.c.Fy) / Math.max(1, e.c.Fy)); cs++; }
  }
  prueba('ninguna rueda sobrepasa su círculo de fricción: √(F_x²+F_y²) ≤ μ·N', maxU <= 1 + 1e-9, `uso máx. ${f(maxU, 6)} en 1 500 casos`);
  prueba('las fuerzas laterales de las dos ruedas suman la que pide la curva (F_y = m·a_y·a/L)', maxSum < 1e-12, `${cs} casos sin deslizar`);
  const cc = cargas(10, 25, 0, 0.9, 0.9);
  prueba('transferencia lateral de carga: N_R − N_L = 2·F_y·h/t; el eje conserva su carga', Math.abs(cc.NR - cc.NL - 2 * cc.Fy * VEH.h / VEH.t) < 1e-9 && Math.abs(cc.NR + cc.NL - cc.Nr) < 1e-9, `${f(cc.NL, 0)} N y ${f(cc.NR, 0)} N`);
  const ac = cargas(0, Infinity, 3, 0.9, 0.9);
  prueba('al acelerar con 3 m/s² el eje trasero gana m·a·h/L = ' + f(VEH.m * 3 * VEH.h / VEH.L, 1) + ' N', Math.abs(ac.Nr - (VEH.m * G * VEH.aF / VEH.L + VEH.m * 3 * VEH.h / VEH.L)) < 1e-9);
  const dsl = evalua({ V: 20, R: 12, hielo: 'L', mulo: 0.15, muhi: 0.9, acel: 0.5, modo: 'abierto' });
  prueba('a_y = 33 m/s²: el eje no puede dar la fuerza lateral y se declara el deslizamiento', dsl.c.desliza && dsl.c.xL === 0 && dsl.c.xR === 0 && dsl.Fx === 0);
}

console.log('4 · Momento de guiñada ΔM = (T_R − T_L)·t/(2·r)');
{
  let mx = 0;
  for (let i = 0; i < 800; i++) { const e = evalua(alAzar()); mx = Math.max(mx, Math.abs(e.dM - (e.TR - e.TL) * VEH.t / (2 * VEH.rw)) / Math.max(1, Math.abs(e.dM))); }
  prueba('ΔM coincide con la fórmula (T_R − T_L)·t/(2·r_w) en 800 casos', mx < 1e-12);
  const g = { V: 9, R: 30, hielo: 'L', mulo: 0.9, muhi: 0.9, acel: 0.2 };
  const o = evalua({ ...g, modo: 'abierto' }), t = evalua({ ...g, modo: 'tbr', kappa: 3 }), v = evalua({ ...g, modo: 'vector', dTmax: 800 });
  prueba('curva con agarre uniforme: abierto ΔM = 0', Math.abs(o.dM) < 1e-9);
  prueba('autoblocante: ΔM < 0 (el par va a la rueda interior y el coche subvira al acelerar)', t.dM < -50, `${f(t.dM, 1)} N·m`);
  prueba('vectorización: ΔM > 0 (ayuda a girar hacia dentro)', v.dM > 50, `${f(v.dM, 1)} N·m`);
  const w = evalua({ V: 8, R: 30, hielo: 'L', mulo: 0.2, muhi: 0.9, acel: 0.8, modo: 'tbr', kappa: 3 }), w2 = evalua({ V: 8, R: 30, hielo: 'R', mulo: 0.2, muhi: 0.9, acel: 0.8, modo: 'tbr', kappa: 3 });
  prueba('hielo en la rueda interior → ΔM > 0 (tira hacia dentro); hielo en la exterior → ΔM < 0', w.dM > 0 && w2.dM < 0, `${f(w.dM, 0)} y ${f(w2.dM, 0)} N·m`);
  prueba('aceleración de guiñada α = ΔM/Iz', rel(w.alfa, w.dM / VEH.Iz) < 1e-14);
}

console.log('5 · Balance de potencia (conservación de la energía)');
{
  let maxB = 0, minPas = 1e9, maxId = 0, np = 0, vecNeg = 0;
  for (let i = 0; i < 2500; i++) {
    const p = alAzar(), e = evalua(p);
    maxB = Math.max(maxB, Math.abs(e.Pc - e.Prueda - e.Pdif) / Math.max(1, e.Pc));
    if (p.modo !== 'vector') {
      minPas = Math.min(minPas, e.Pdif); np++;
      const [Ts, Tf, ws, wf] = e.wL <= e.wR ? [e.TL, e.TR, e.wL, e.wR] : [e.TR, e.TL, e.wR, e.wL];
      maxId = Math.max(maxId, Math.abs(e.Pdif - (Ts - Tf) * (wf - ws) / 2) / Math.max(1, Math.abs(e.Pdif)));
    } else if (e.Pdif < -1) vecNeg++;
  }
  prueba('P_caja = P_ruedas + P_diferencial en 2 500 casos (ω_caja = media de las ruedas)', maxB < 1e-12);
  prueba('en abierto y autoblocante la pérdida (T_lenta − T_rápida)·(ω_rápida − ω_lenta)/2 es ≥ 0: el diferencial pasivo sólo disipa', minPas > -1e-6 && maxId < 1e-9, `${np} casos, mín. ${f(minPas, 3)} W`);
  prueba('con vectorización el embrague puede aportar potencia (P_dif < 0) y entonces se declara', vecNeg > 0, `${vecNeg} casos con aporte del actuador`);
  const o = evalua({ ...BASE, modo: 'abierto', mulo: 0.9, acel: 0.2 });
  prueba('un diferencial abierto no disipa nada cuando no patina (T_L = T_R ⇒ P_dif = 0)', Math.abs(o.Pdif) < 1e-6);
}

console.log('6 · Aceleración, iteración de la carga y curva de patinamiento');
{
  let mi = 0, it = 0;
  for (let i = 0; i < 400; i++) { const p = alAzar(); p.hielo = 'L'; const e = evalua(p); mi = Math.max(mi, Math.abs(e.ax - e.axIter)); it = Math.max(it, e.it); }
  prueba('el punto fijo de la carga converge (la a_x que fija la carga es la que resulta de la tracción)', mi < 1e-6, `|Δa_x| máx. ${mi.toExponential(1)} m/s², ${it} iteraciones como máximo`);
  const e = evalua({ ...BASE, modo: 'abierto', V: 3, R: Infinity, mulo: 0.9, acel: 0.2 });
  prueba('a_x = (F_x − F_res)/m', rel(e.ax, (e.Fx - e.res) / VEH.m) < 1e-14, `${f(e.ax, 3)} m/s²`);
  let mf = 0; for (let r = 0.01; r <= 1; r += 0.01) { const s = patinamiento(r, 0), x = s / TIRE.sp; mf = Math.max(mf, Math.abs(2 * x / (1 + x * x) - r)); }
  prueba('patinamiento(ρ) es la inversa de F = F_máx·2x/(1+x²) (x = s/s_pico)', mf < 1e-12, `error ${mf.toExponential(1)}`);
  prueba('el patinamiento sube con el par y pasa del pico si el par no cabe', patinamiento(0.3, 0) < patinamiento(0.8, 0) && patinamiento(1, 0) === TIRE.sp && patinamiento(1, 0.5) > TIRE.sp);
}

console.log('7 · Monotonía y casos límite de los tres diferenciales');
{
  const g = { V: 9, R: 28, hielo: 'L', mulo: 0.2, muhi: 0.9, acel: 0.8 };
  let mono = true, monoM = true, ant = null, antM = -1;
  for (let k = 1; k <= 6.0001; k += 0.05) { const e = evalua({ ...g, modo: 'tbr', kappa: k }); if (ant !== null && e.Fx < ant - 1e-6) mono = false; if (Math.abs(e.dM) < antM - 1e-6) monoM = false; ant = e.Fx; antM = Math.abs(e.dM); }
  prueba('la tracción no baja nunca al subir el TBR (hielo interior)', mono);
  prueba('|ΔM| tampoco baja: más bloqueo = más tirón de guiñada', monoM);
  let monoV = true; ant = null; for (let d = 0; d <= DT_MAX; d += 10) { const e = evalua({ ...g, modo: 'vector', dTmax: d }); if (ant !== null && e.Fx < ant - 1e-6) monoV = false; ant = e.Fx; }
  prueba('la tracción de la vectorización no baja al subir la capacidad del embrague', monoV);
  const ab = evalua({ ...g, modo: 'abierto' });
  prueba('el abierto no depende de κ ni de ΔT_max', Math.abs(evalua({ ...g, modo: 'abierto', kappa: 5, dTmax: 1200 }).Fx - ab.Fx) < 1e-12);
  const h = { V: 5, R: Infinity, hielo: 'L', mulo: 0.9, muhi: 0.9, acel: 0.2, modo: 'tbr', kappa: 5 };
  const e50 = evalua(h);
  prueba('en recta sin patinar el autoblocante reparte 50/50 (no hay diferencia de velocidad que agarre el rozamiento)', e50.TL === e50.TR);
  const rect = evalua({ ...g, R: Infinity, modo: 'tbr', kappa: 3 }), rect2 = evalua({ ...g, R: Infinity, modo: 'abierto' });
  prueba('en recta con hielo el autoblocante sí ayuda (la rueda que patina agarra el rozamiento)', rect.Fx > rect2.Fx * 1.5, `${f(rect.Fx, 0)} frente a ${f(rect2.Fx, 0)} N`);
  const bar = barridoMu({ ...g, modo: 'abierto' }, 20);
  prueba('el barrido de μ llega a F_x máximo cuando el lado bajo se acerca al alto', bar[20][1] >= bar[0][1] && bar.length === 21);
}

console.log('9 · El reto: ventana interior de TBR o de ΔT_max');
{
  let s = 777; const r = () => (s = s * 48271 % 2147483647) / 2147483647;
  let n = 0, abierto = 0, tope = 0, dentro = 0, fuera = 0, vec = 0, ancho = 1e9, estr = 0;
  for (let i = 0; i < 60; i++) {
    const sc = generaReto(r); if (!sc) continue; n++;
    const [a, b] = sc.wTbr, medio = (a + b) / 2;
    const e0 = evaluaReto(sc, 'abierto', 0); if (!e0.okF) abierto++;
    const eT = evaluaReto(sc, 'tbr', K_MAX); if (!(eT.okF && eT.okM)) tope++;
    const eM = evaluaReto(sc, 'tbr', medio); if (eM.okF && eM.okM) dentro++;
    const eB = evaluaReto(sc, 'tbr', Math.max(K_MIN, a - 0.4)), eC = evaluaReto(sc, 'tbr', Math.min(K_MAX, b + 0.4));
    if (!(eB.okF && eB.okM) && !(eC.okF && eC.okM)) fuera++;
    if (sc.wVec) vec++;
    ancho = Math.min(ancho, b - a); if (a > K_MIN + 0.2 && b < K_MAX - 0.5) estr++;
  }
  prueba('60 retos generados con semilla fija', n === 60, `${n}`);
  prueba('el diferencial abierto nunca cumple la tracción pedida', abierto === n);
  prueba('«subir hasta el tope» (TBR = 6) nunca cumple: la guiñada se pasa', tope === n);
  prueba('el centro de la ventana de TBR cumple los dos requisitos', dentro === n);
  prueba('fuera de la ventana (0,4 por debajo y por encima) falla', fuera === n);
  prueba('la ventana es interior y de al menos 0,5 de ancho (' + f(ancho, 2) + ')', estr === n && ancho >= 0.5);
  prueba('algunos retos también se pueden resolver con la vectorización', vec > 0, `${vec} de ${n}`);
  const d = generaDx(r);
  prueba('el diagnóstico sortea modo, κ y ΔT_max', MODOS.includes(d.modo) && d.kappa >= 2.4 && d.dTmax >= 700);
  const seen = new Set(); for (let i = 0; i < 40; i++) seen.add(generaDx(r).modo);
  prueba('los tres tipos aparecen', seen.size === 3);
}

console.log('10 · Cifras citadas en la prosa (salen de este motor)');
{
  const b = { V: 10, R: 25, hielo: 'L', mulo: 0.25, muhi: 0.9, acel: 0.55 };
  for (const [m, k, d] of [['abierto', 1, 0], ['tbr', 3, 0], ['vector', 1, 1200]]) {
    const e = evalua({ ...b, modo: m, kappa: k, dTmax: d });
    console.log('   ', m, 'T_L', f(e.TL, 0), 'T_R', f(e.TR, 0), 'F_x', f(e.Fx, 0), 'a_x', f(e.ax, 2), 'ΔM', f(e.dM, 0), 'P_dif', f(e.Pdif, 0));
  }
  const g = { V: 10, R: 25, hielo: 'L', mulo: 0.9, muhi: 0.9, acel: 0.2 };
  for (const [m, k, d] of [['abierto', 1, 0], ['tbr', 3, 0], ['vector', 1, 1200]]) { const e = evalua({ ...g, modo: m, kappa: k, dTmax: d }); console.log('    uniforme', m, 'ΔM', f(e.dM, 0)); }
}
console.log('\nRESULTADO: ' + ok + ' pruebas en verde, ' + mal + ' falladas');
process.exit(mal ? 1 : 0);
