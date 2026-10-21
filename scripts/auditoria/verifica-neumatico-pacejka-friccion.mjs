// Verificación de la física de «El neumático: curva de Pacejka, círculo de fricción y límite de adherencia» (mecanica-147).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre)
// y lo contrasta con formas cerradas de la fórmula mágica, con la elipse de fricción, con la inversa de la fuerza
// y con las ventanas del reto.
// uso: node scripts/auditoria/verifica-neumatico-pacejka-friccion.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/neumatico-pacejka-friccion.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,G,RAD,clamp,mf,xPico,SUP,PISOS,FZ0,DMU,P_OPT,KP,KS,ANCHO,llanta,fxPuro,fyPuro,fuerzas,inversa,fuerzaMaxDir,lateralRestante,picoDeCarga,potenciaFriccion,MARGEN,ESCENARIOS,ventanaManiobra,evaluaManiobra,trazaManiobra,CASOS_DX,sintomas};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);

console.log('1 · La fórmula mágica contra sus formas cerradas');
{ // con E = 0 el pico es EXACTAMENTE D en x = tan(π/2C)/B
  for (const [B, C] of [[10, 1.3], [14, 1.65], [6, 1.9], [3, 1.2]]) {
    const xp = Math.tan(Math.PI / (2 * C)) / B;
    cerca(F.xPico(B, C, 0), xp, 1e-12, `x_pico(E=0) = tan(π/2C)/B  B=${B} C=${C}`);
    cerca(F.mf(xp, B, C, 0, 2500), 2500, 1e-12, `F(x_pico) = D exacto  B=${B} C=${C}`);
  }
  // con E ≠ 0 el máximo numérico coincide con D y está en x_pico
  for (const piso of F.PISOS) {
    const S = F.SUP[piso];
    for (const [B, C, E, nom] of [[S.Bx, S.Cx, S.Ex, 'long'], [S.By, S.Cy, S.Ey, 'lat']]) {
      const xp = F.xPico(B, C, E); let mx = 0, xm = 0;
      for (let x = 0; x <= 1.5; x += 1e-4) { const f = F.mf(x, B, C, E, 1); if (f > mx) { mx = f; xm = x; } }
      cerca(mx, 1, 1e-7, `${piso}/${nom}: el máximo de la curva vale D`); ok(Math.abs(xm - xp) < 2e-4, `${piso}/${nom}: el máximo numérico está en x_pico`, `(${xm} vs ${xp})`);
      cerca(F.mf(xp, B, C, E, 1), 1, 1e-12, `${piso}/${nom}: F(x_pico) = D`);
      // pendiente en el origen: B·C·D
      const h = 1e-7; cerca((F.mf(h, B, C, E, 1) - F.mf(-h, B, C, E, 1)) / (2 * h), B * C, 1e-6, `${piso}/${nom}: pendiente en el origen = B·C·D`);
      // después del pico la fuerza cae
      ok(F.mf(xp * 2.5, B, C, E, 1) < 1 - 1e-4, `${piso}/${nom}: hay caída de adherencia después del pico`);
      cerca(F.mf(-0.07, B, C, E, 1), -F.mf(0.07, B, C, E, 1), 1e-14, `${piso}/${nom}: curva impar`);
    }
  }
}

console.log('2 · Los pisos y la carga');
{ const pk = (p) => F.llanta(p, F.FZ0, F.P_OPT);
  ok(pk('seco').Dx > pk('mojado').Dx && pk('mojado').Dx > pk('nieve').Dx && pk('nieve').Dx > pk('hielo').Dx, 'orden de adherencia: seco > mojado > nieve > hielo');
  cerca(pk('seco').Dx / F.FZ0, 1.00, 1e-12, 'μ seco longitudinal = 1,00 a la carga y presión nominales'); cerca(pk('mojado').Dx / F.FZ0, 0.68, 1e-12, 'μ mojado = 0,68'); cerca(pk('hielo').Dx / F.FZ0, 0.10, 1e-12, 'μ hielo = 0,10');
  ok(pk('hielo').kp > pk('nieve').kp && pk('nieve').kp > pk('mojado').kp, 'en piso resbaladizo el pico llega con más deslizamiento');
  // sensibilidad de carga: F_pico/Fz = μ0·(1 + dμ·(Fz−Fz0)/Fz0) exacto; F_pico crece menos que proporcional
  for (const z of [1500, 2500, 3500, 5000, 7000]) cerca(F.picoDeCarga('seco', z, F.P_OPT, 'x') / z, 1 * (1 + F.DMU * (z - F.FZ0) / F.FZ0), 1e-12, `μ_ef(Fz=${z}) = μ0(1+dμ·ΔFz/Fz0)`);
  let cresc = true, conc = true; let prev = 0, prevD = Infinity;
  for (let z = 1000; z <= 9000; z += 500) { const f = F.picoDeCarga('seco', z, F.P_OPT, 'y'); if (f <= prev) cresc = false; if (prev && f - prev >= prevD + 1e-9) conc = false; if (prev) prevD = f - prev; prev = f; }
  ok(cresc, 'el pico lateral crece con la carga'); ok(conc, 'el pico lateral es CÓNCAVO en la carga (sensibilidad de carga)');
  ok(F.picoDeCarga('seco', 7000, 2.4, 'y') < 2 * F.picoDeCarga('seco', 3500, 2.4, 'y'), 'doblar la carga no dobla el agarre');
  // presión: óptimo interior y huella A·p = Fz
  const mu = (p) => F.llanta('seco', F.FZ0, p).Dx; ok(mu(F.P_OPT) > mu(1.6) && mu(F.P_OPT) > mu(3.2), 'la presión tiene un óptimo interior de adherencia');
  cerca(mu(F.P_OPT - 0.5), mu(F.P_OPT + 0.5), 1e-12, 'la caída por presión es simétrica alrededor del óptimo');
  for (const [z, p] of [[2000, 2.0], [3500, 2.4], [6000, 3.0]]) { const N = F.llanta('mojado', z, p); cerca(N.area * p * 1e5, z, 1e-12, `huella·presión = carga  (Fz=${z}, p=${p})`); cerca(N.largo * F.ANCHO, N.area, 1e-12, 'largo·ancho = huella'); }
  ok(F.llanta('seco', F.FZ0, 1.5).area > F.llanta('seco', F.FZ0, 3.0).area * 1.9, 'a menos presión, más huella');
  ok(F.llanta('seco', F.FZ0, 3.0).Caa > F.llanta('seco', F.FZ0, 1.8).Caa, 'a más presión, más rigidez al girar');
  const N = F.llanta('seco', F.FZ0, F.P_OPT); console.log(`   seco 3,5 kN: pico frenado ${N.Dx.toFixed(0)} N a ${(N.kp * 100).toFixed(1)} % · pico lateral ${N.Dy.toFixed(0)} N a ${(Math.atan(N.tp) / F.RAD).toFixed(1)}° · huella ${(N.area * 1e4).toFixed(0)} cm² (${(N.largo * 100).toFixed(1)} × 20,5 cm) · C_α = ${(N.Caa * F.RAD).toFixed(0)} N/°`); }

console.log('3 · Elipse de fricción: frenar y girar a la vez');
{ let maxU = 0, nPts = 0, tocan = 0;
  for (const piso of F.PISOS) { const N = F.llanta(piso, 3500, 2.4);
    for (let k = -1; k <= 1.0001; k += 0.025) for (let a = -25; a <= 25.0001; a += 0.5) { const f = F.fuerzas(N, k, a * F.RAD); maxU = Math.max(maxU, f.u); nPts++; if (Math.abs(f.s - 1) < 1e-12) tocan++; }
    // pura: se reduce a la curva de cada eje
    for (const k of [-0.9, -0.3, -0.05, 0.08, 0.4]) cerca(F.fuerzas(N, k, 0).Fx, F.fxPuro(N, k), 1e-12, `${piso}: sin deriva la fuerza es la curva pura de frenado (κ=${k})`);
    for (const a of [-14, -6, -1, 3, 9, 20]) cerca(F.fuerzas(N, 0, a * F.RAD).Fy, F.fyPuro(N, a * F.RAD), 1e-12, `${piso}: sin deslizamiento la fuerza es la curva pura lateral (α=${a}°)`);
    ok(Math.abs(F.fuerzas(N, 0, 0).Fx) < 1e-12 && Math.abs(F.fuerzas(N, 0, 0).Fy) < 1e-12, `${piso}: sin deslizar no hay fuerza`);
    // en s = 1 la fuerza está EXACTAMENTE sobre la elipse, en cualquier dirección
    for (let ang = 0; ang < 360; ang += 15) { const c = Math.cos(ang * F.RAD), sn = Math.sin(ang * F.RAD); const f = F.fuerzas(N, c * N.kp, Math.atan(sn * N.tp)); cerca(f.s, 1, 1e-12, `${piso}: s = 1 en la dirección ${ang}°`);
      cerca(Math.hypot(f.Fx / N.Dx, f.Fy / N.Dy), 1, 1e-9, `${piso}: sobre la elipse en s = 1 (${ang}°)`); }
    // simetría
    const f1 = F.fuerzas(N, -0.07, 6 * F.RAD), f2 = F.fuerzas(N, 0.07, -6 * F.RAD); cerca(f1.Fx, -f2.Fx, 1e-14, `${piso}: simetría de Fx`); cerca(f1.Fy, -f2.Fy, 1e-14, `${piso}: simetría de Fy`);
    // con la deriva fija, frenar MÁS quita fuerza lateral (monótono)
    for (const a of [3, 6, 9, 14]) { let prev = Infinity, mono = true; for (let k = 0; k <= 1; k += 0.01) { const f = F.fuerzas(N, -k, a * F.RAD).Fy; if (f > prev + 1e-9) mono = false; prev = f; } ok(mono, `${piso}: a deriva fija α=${a}°, más frenado = menos fuerza lateral`); }
    // a máximo frenado (s=1 sin deriva) no queda fuerza lateral; y la cota lateralRestante es la elipse
    ok(Math.abs(F.fuerzas(N, -N.kp, 0).Fy) < 1e-12, `${piso}: al frenar en el pico, sin deriva, no hay fuerza lateral`);
    cerca(F.lateralRestante(N, 0.6 * N.Dx), N.Dy * 0.8, 1e-12, `${piso}: con el 60 % del freno máximo queda el 80 % del lateral (3-4-5)`);
    cerca(F.lateralRestante(N, 0), N.Dy, 1e-14, `${piso}: sin frenar queda todo el lateral`);
    cerca(F.fuerzaMaxDir(N, 0), N.Dx, 1e-12, `${piso}: semieje longitudinal de la elipse`); cerca(F.fuerzaMaxDir(N, Math.PI / 2), N.Dy, 1e-12, `${piso}: semieje lateral de la elipse`); }
  ok(maxU <= 1 + 1e-9, 'NINGUNA combinación de deslizamientos supera la elipse', `(máx ${maxU}, ${nPts} puntos)`);
  console.log(`   ${nPts} combinaciones κ–α en 4 pisos: agarre usado máximo ${maxU.toFixed(9)}; ${tocan} puntos exactos en s = 1`); }

console.log('4 · Inversa: de la fuerza pedida al deslizamiento');
{ let maxE = 0, c = 0;
  for (const piso of F.PISOS) { const N = F.llanta(piso, 3500, 2.4);
    for (let ux = -0.95; ux <= 0.95; ux += 0.095) for (let uy = -0.95; uy <= 0.95; uy += 0.095) { if (Math.hypot(ux, uy) >= 0.995) continue;
      const Fx = ux * N.Dx, Fy = uy * N.Dy, q = F.inversa(N, Fx, Fy); ok(q.ok, 'inversa existe dentro de la elipse'); const f = F.fuerzas(N, q.kap, q.alf);
      maxE = Math.max(maxE, Math.abs(f.Fx - Fx) / N.Dx, Math.abs(f.Fy - Fy) / N.Dy); c++; } }
  ok(maxE < 1e-9, 'fuerzas(inversa(F)) = F', `(error relativo máx ${maxE})`); ok(!F.inversa(F.llanta('seco', 3500, 2.4), 3500 * 1.01, 0).ok, 'fuera de la elipse no hay inversa'); console.log(`   ${c} casos: error de ida y vuelta ≤ ${maxE.toExponential(1)} del semieje`); }

console.log('5 · Calor de fricción');
{ const N = F.llanta('seco', 3500, 2.4), f = F.fuerzas(N, -0.11, 0), V = 20; cerca(F.potenciaFriccion(f, -0.11, 0, V), Math.abs(f.Fx) * V * 0.11, 1e-12, 'frenando recto: P = |Fx|·V·κ');
  const g = F.fuerzas(N, 0, 8 * F.RAD); cerca(F.potenciaFriccion(g, 0, 8 * F.RAD, V), Math.abs(g.Fy) * V * Math.sin(8 * F.RAD), 1e-12, 'girando: P = |Fy|·V·sen α'); ok(F.potenciaFriccion(f, -0.11, 0, V) > 0, 'el calor es positivo'); }

console.log('6 · El reto: curva mojada con frenado parcial');
{ for (const e of F.ESCENARIOS) { const W = F.ventanaManiobra(e), v0 = e.v0 / 3.6, m = e.Fz / F.G; const N = F.llanta('mojado', e.Fz, e.p);
    ok(W.existe && W.amax - W.amin >= 0.9, `escenario ${e.id}: la ventana existe y mide ≥ 0,9 m/s²`, `[${W.amin.toFixed(2)}, ${W.amax.toFixed(2)}]`);
    ok(W.amin > 1.2 && W.amax < 4.5, `escenario ${e.id}: ventana INTERIOR (ni sin frenar ni frenada máxima)`);
    ok(v0 * v0 / (2 * e.S) > W.amax, `escenario ${e.id}: dentro de la ventana el coche no se detiene antes de salir`);
    // los bordes: justo dentro pasa, justo fuera falla
    ok(F.evaluaManiobra(e, W.amin + 1e-6).ok && F.evaluaManiobra(e, W.amax - 1e-6).ok, `escenario ${e.id}: los bordes de dentro pasan`);
    ok(!F.evaluaManiobra(e, W.amin - 0.02).ok && F.evaluaManiobra(e, W.amin - 0.02).pocoFreno, `escenario ${e.id}: frenar menos que a_min no baja a la velocidad de salida`);
    ok(!F.evaluaManiobra(e, W.amax + 0.02).ok && F.evaluaManiobra(e, W.amax + 0.02).demasiado, `escenario ${e.id}: frenar más que a_max supera el límite en la entrada`);
    ok(!F.evaluaManiobra(e, 0).ok, `escenario ${e.id}: no frenar no basta`); ok(!F.evaluaManiobra(e, 7).ok, `escenario ${e.id}: frenar a fondo tampoco`);
    // a_max por el modelo completo: la demanda (Fx,Fy) en la entrada cae sobre el 96 % de la elipse
    const f = F.inversa(N, m * W.amax, m * W.ay0); ok(f.ok, `escenario ${e.id}: en a_max existe deslizamiento que produce la demanda`);
    cerca(Math.hypot(m * W.amax / N.Dx, m * W.ay0 / N.Dy), 1 - F.MARGEN, 1e-12, `escenario ${e.id}: en a_max la demanda es el ${(1 - F.MARGEN) * 100} % de la elipse`);
    const ff = F.fuerzas(N, f.kap, f.alf); cerca(ff.Fx, m * W.amax, 1e-9, `escenario ${e.id}: el modelo completo da la Fx pedida`); cerca(ff.Fy, m * W.ay0, 1e-9, `escenario ${e.id}: el modelo completo da la Fy pedida`);
    // la demanda máxima del arco es la de la entrada
    const T = F.trazaManiobra(e, (W.amin + W.amax) / 2, 60); ok(T[0].Fy >= T[T.length - 1].Fy && T.every((q, i) => i === 0 || q.Fy <= T[i - 1].Fy + 1e-9), `escenario ${e.id}: la fuerza lateral baja a lo largo del arco`); ok(T.every(q => Math.abs(q.Fx - m * (W.amin + W.amax) / 2) < 1e-9), `escenario ${e.id}: Fx = m·a constante`);
    // velocidad de salida por cinemática cerrada
    const a = (W.amin + W.amax) / 2, ev = F.evaluaManiobra(e, a); cerca(ev.vf, Math.sqrt(v0 * v0 - 2 * a * e.S), 1e-12, `escenario ${e.id}: v_salida = √(v₀² − 2aS)`);
    console.log(`   escenario ${e.id} (${e.etq}): R=${e.R} m, ${e.v0}→≤${e.vs} km/h en ${e.S} m · ventana [${W.amin.toFixed(2)}, ${W.amax.toFixed(2)}] m/s² (ancho ${(W.amax - W.amin).toFixed(2)})`); }
  // la respuesta de «Calcula»: v_max sin frenar = √(Fy_pico·R/m) = √(μ_ef,y·g·R)
  for (const e of F.ESCENARIOS) { const N = F.llanta('mojado', e.Fz, e.p), vmax = Math.sqrt(N.Dy / (e.Fz / F.G) * e.R); cerca(vmax, Math.sqrt(N.muEfY * F.G * e.R), 1e-12, `escenario ${e.id}: v_máx = √(μ_ef·g·R)`); } }

console.log('7 · El diagnóstico: tres causas, tres firmas');
{ const R = Object.fromEntries(F.CASOS_DX.map(c => [c.k, F.sintomas(c)])), ref = F.sintomas({ piso: 'seco', Fz: F.FZ0, p: F.P_OPT });
  ok(R.mojado.areaCm2 < ref.areaCm2 * 1.001 && R.mojado.muX < ref.muX * 0.8, 'mojado: huella normal y agarre bajo');
  ok(R.presion.areaCm2 > ref.areaCm2 * 1.4 && R.presion.rigidez < ref.rigidez * 0.9 && R.presion.muX > R.mojado.muX, 'presión baja: huella grande y rigidez MENOR que la normal');
  ok(R.carga.areaCm2 > ref.areaCm2 * 1.4 && R.carga.rigidez > ref.rigidez * 1.3 && R.carga.muX < ref.muX, 'sobrecarga: huella grande, rigidez MAYOR y agarre por kN menor');
  ok(R.carga.rigidez > R.presion.rigidez * 1.5, 'sobrecarga y presión baja se distinguen por la rigidez');
  console.log('   mojado', R.mojado.areaCm2.toFixed(0), 'cm²', R.mojado.muX.toFixed(2), R.mojado.rigidez.toFixed(0), 'N/° | presión', R.presion.areaCm2.toFixed(0), R.presion.muX.toFixed(2), R.presion.rigidez.toFixed(0), '| carga', R.carga.areaCm2.toFixed(0), R.carga.muX.toFixed(2), R.carga.rigidez.toFixed(0), '| ref', ref.areaCm2.toFixed(0), ref.muX.toFixed(2), ref.rigidez.toFixed(0)); }

console.log(`\n${n - malas}/${n} comprobaciones correctas`);
if (malas) { console.log('FALLOS:\n' + fallos.join('\n')); process.exit(1); }
