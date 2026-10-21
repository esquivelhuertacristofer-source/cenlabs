// Verificación de la física del lab aerodinamica-vehiculo: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-aerodinamica-vehiculo.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { G, RAD, AIRE, VEH, ALA, SUELO, pendienteAla, clAla, cdPerfilAla, czSuelo, parBase, aero, presion, marcha, vmax, vmaxAire, vmaxCardano, cargasEje, agarre, vCurva, vorticeSegmento, herradura, circulacionAla, velSuelo, deficitEstela, BARRIDO, evaluaReto, generaReto } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);

console.log('1 · Fuerzas aerodinámicas y ley de escala v²');
{
  const th = 10 * RAD, h = 0.07;
  const a = aero(th, h), r1 = marcha(30, th, h), r2 = marcha(60, th, h);
  prueba('F_d = ½ρ·C_d·A·v² con las cifras del motor', rel(r1.Fd, 0.5 * AIRE.rho * a.Cd * VEH.A * 900) < 1e-14, `${f(r1.Fd, 2)} N a 108 km/h, C_d = ${f(a.Cd, 4)}`);
  prueba('F_z = ½ρ·C_z·A·v²', rel(r1.Fz, 0.5 * AIRE.rho * a.Cz * VEH.A * 900) < 1e-14, `${f(r1.Fz, 2)} N, C_z = ${f(a.Cz, 4)}`);
  prueba('al duplicar v, F_d y F_z se multiplican por 4 (v²)', rel(r2.Fd / r1.Fd, 4) < 1e-13 && rel(r2.Fz / r1.Fz, 4) < 1e-13);
  prueba('la potencia del aire P = F_d·v se multiplica por 8 (v³)', rel(r2.Pair / r1.Pair, 8) < 1e-13);
  prueba('los coeficientes no dependen de la velocidad', rel(marcha(10, th, h).a.Cd, r2.a.Cd) === 0);
  prueba('presión dinámica a 100 km/h = ½·1,225·27,78² = 472,6 Pa', Math.abs(presion(100 / 3.6) - 472.6) < 0.1, `${f(presion(100 / 3.6), 2)} Pa`);
  const c = aero(th, h);
  prueba('C_z = C_z,alerón + C_z,suelo + C_z,carrocería', Math.abs(c.Cz - (c.Czw + c.Czf + c.Czb)) < 1e-15);
  prueba('C_d = C_d,carrocería + inducido + perfil + suelo', Math.abs(c.Cd - (c.Cdb + c.Cdi + c.Cdp + c.Cdf)) < 1e-15);
}

console.log('2 · Alerón: pendiente de ala finita, inducido y pérdida');
{
  const a = pendienteAla();
  prueba('a = a0/(1 + a0/(π·AR·e)) = 3,86 /rad (ala finita, AR = 3,75)', Math.abs(a - 3.8647) < 5e-3, `${f(a, 4)} /rad = ${f(a * RAD, 5)} /°`);
  prueba('C_L es lineal por debajo de la pérdida', rel(clAla(8 * RAD) - clAla(4 * RAD), a * 4 * RAD) < 1e-12);
  const e = 1e-9;
  prueba('C_L es continuo en el ángulo de pérdida', Math.abs(clAla(ALA.thS - e) - clAla(ALA.thS + e)) < 1e-6, `C_L,máx = ${f(clAla(ALA.thS), 4)}`);
  let pico = 0, thPico = 0; for (let t = 0; t <= 22; t += 0.01) { const y = clAla(t * RAD); if (y > pico) { pico = y; thPico = t; } }
  prueba('el máximo de C_L está en el ángulo de pérdida (14°)', Math.abs(thPico - 14) < 0.02, `pico ${f(pico, 4)} a ${f(thPico, 2)}°`);
  prueba('pasada la pérdida, C_L cae un 30 % en 6° (hasta 20°)', rel(clAla(20 * RAD), pico * 0.7) < 1e-9, `C_L(20°) = ${f(clAla(20 * RAD), 4)}`);
  let mono = true; for (let t = 0; t < 13.85; t += 0.1) if (clAla((t + 0.1) * RAD) <= clAla(t * RAD)) mono = false;
  prueba('C_L crece de forma estrictamente monótona hasta la pérdida', mono);
  prueba('arrastre de perfil sube con la pérdida', cdPerfilAla(20 * RAD) > cdPerfilAla(10 * RAD) + 0.2 && Math.abs(cdPerfilAla(10 * RAD) - ALA.cdp) < 1e-15);
  // inducido k·C_L²: C_d,i = (S/A)·C_L²/(π·AR·e)
  const c = aero(10 * RAD, 0.08), cl = clAla(10 * RAD);
  prueba('C_d inducido = (S/A)·C_L²/(π·AR·e)', rel(c.Cdi, (ALA.S / VEH.A) * cl * cl / (Math.PI * ALA.AR * ALA.e)) < 1e-14, `${f(c.Cdi, 5)}`);
  // La polar del alerón es parabólica: C_d,i = k·C_z,w² con k = A/(S·π·AR·e)
  const k = VEH.A / (ALA.S * Math.PI * ALA.AR * ALA.e);
  prueba('polar parabólica del alerón: C_d,i = k·C_z,w² (k = A/(S·π·AR·e))', rel(c.Cdi, k * c.Czw * c.Czw) < 1e-13, `k = ${f(k, 4)}`);
  // más ángulo = más carga Y más arrastre antes de la pérdida
  const a8 = aero(8 * RAD, 0.07), a12 = aero(12 * RAD, 0.07);
  prueba('antes de la pérdida más ángulo da más carga y más arrastre', a12.Cz > a8.Cz && a12.Cd > a8.Cd);
  const a14 = aero(14 * RAD, 0.07), a20 = aero(20 * RAD, 0.07);
  prueba('después de la pérdida hay MENOS carga y MÁS arrastre', a20.Cz < a14.Cz && a20.Cd > a14.Cd, `C_z ${f(a14.Cz, 3)} → ${f(a20.Cz, 3)}, C_d ${f(a14.Cd, 3)} → ${f(a20.Cd, 3)}`);
  prueba('eficiencia C_z/C_d máxima antes de la pérdida', (() => { let best = 0, tb = 0; for (let t = 0; t <= 22; t += 0.1) { const q = aero(t * RAD, 0.07); if (q.Cz / q.Cd > best) { best = q.Cz / q.Cd; tb = t; } } return tb < 14.5; })());
}

console.log('3 · Suelo: efecto suelo y estrangulamiento');
{
  prueba('C_z,suelo(h0) = C_z0', rel(czSuelo(SUELO.h0), SUELO.Cz0) < 1e-14);
  prueba('sube al bajar hasta la altura de estrangulamiento (h_c = 50 mm)', czSuelo(0.060) > czSuelo(0.080) && czSuelo(0.050) > czSuelo(0.060) && czSuelo(0.120) < czSuelo(0.080));
  prueba('continuo en h_c', Math.abs(czSuelo(SUELO.hc - 1e-9) - czSuelo(SUELO.hc + 1e-9)) < 1e-6);
  prueba('por debajo de h_c se estrangula: C_z cae', czSuelo(0.045) < czSuelo(0.050) && czSuelo(0.040) < czSuelo(0.045));
  prueba('en h_min conserva el 60 % del máximo', rel(czSuelo(SUELO.hmin), czSuelo(SUELO.hc) * 0.6) < 1e-12, `${f(czSuelo(0.040), 4)} vs ${f(czSuelo(0.050), 4)}`);
  let imax = 0, hm = 0; for (let h = 0.040; h <= 0.120; h += 0.0005) { const y = czSuelo(h); if (y > imax) { imax = y; hm = h; } }
  prueba('el óptimo del suelo es h_c', Math.abs(hm - SUELO.hc) < 6e-4, `máx ${f(imax, 4)} a ${f(hm * 1000, 1)} mm`);
  prueba('la carrocería más baja arrastra menos (C_d,b crece 0,25 por metro)', aero(0, 0.12).Cdb - aero(0, 0.04).Cdb > 0.019 && rel(aero(0, 0.12).Cdb - aero(0, 0.04).Cdb, 0.25 * 0.08) < 1e-12);
  // Bernoulli bajo el suelo: C_p = 1 − (u/U)² = −C_z,f·A/A_suelo; fuerza = −ΔC_p·q·A_suelo = C_z,f·q·A
  const cz = czSuelo(0.06), r = velSuelo(cz), cp = 1 - r * r;
  prueba('Bernoulli bajo el suelo: −C_p·A_suelo = C_z,suelo·A', rel(-cp * SUELO.A, cz * VEH.A) < 1e-13, `u/U = ${f(r, 4)}, C_p = ${f(cp, 4)}`);
}

console.log('4 · Potencia y velocidad máxima');
{
  // la «raíz cúbica» del libro: sólo aire
  const P = 150e3, eta = 0.9, Cd = 0.32, A = 2.1, v = vmaxAire(P, eta, Cd, A);
  prueba('v_max = ∛(2ηP/(ρ·C_d·A)) cumple η·P = ½ρC_dA·v³', rel(0.5 * AIRE.rho * Cd * A * v ** 3, eta * P) < 1e-13, `${f(v * 3.6, 2)} km/h`);
  // aire + rodadura: Cardano contra bisección con el motor completo (sin carga aerodinámica)
  const par = { A: 2.1, Cd0: 0.32, m: 1400, Pmax: 150e3, liso: true }, vb = vmax(0, 0.08, par);
  const vc = vmaxCardano(150e3, VEH.etaDT, 0.32, 2.1, 1400, VEH.Crr);
  prueba('Cardano (aire + rodadura) = bisección sobre el modelo completo', rel(vb, vc) < 1e-12, `${f(vb * 3.6, 4)} km/h`);
  prueba('con rodadura la v_max es menor que la del libro (sólo aire)', vb < v);
  // equilibrio: la potencia disponible es igual a la resistente
  const th = 11 * RAD, h = 0.06, vm = vmax(th, h), r = marcha(vm, th, h);
  prueba('en v_max: P_motor·η = P_aire + P_rodadura (residuo < 1e-9)', Math.abs(r.Pw - VEH.etaDT * VEH.Pmax) / (VEH.etaDT * VEH.Pmax) < 1e-12, `${f(vm * 3.6, 2)} km/h, ${f(r.Pw / 1000, 3)} kW en rueda`);
  // sensibilidad: v_max ∝ C_d^(−1/3)
  const p1 = { A: 2.1, Cd0: 0.30, m: 1400, Pmax: 150e3, liso: true }, p2 = { A: 2.1, Cd0: 0.40, m: 1400, Pmax: 150e3, liso: true };
  prueba('sin rodadura v_max ∝ C_d^(−1/3): (0,30/0,40)^(1/3)', rel(vmaxAire(150e3, .9, .40, 2.1) / vmaxAire(150e3, .9, .30, 2.1), Math.cbrt(0.30 / 0.40)) < 1e-14);
  prueba('más arrastre baja la velocidad máxima del modelo completo', vmax(0, 0.08, p2) < vmax(0, 0.08, p1));
  // la carga aerodinámica cuesta velocidad
  prueba('alerón a 14° y suelo a 50 mm bajan la v_max frente al coche liso', vmax(14 * RAD, 0.05) < vmax(0, 0.12));
  const lim = vmax(0, 0.080);
  prueba('coche de calle (alerón a 0°, 80 mm): v_max entre 230 y 290 km/h', lim * 3.6 > 230 && lim * 3.6 < 290, `${f(lim * 3.6, 1)} km/h`);
}

console.log('5 · Consumo a velocidad constante');
{
  const th = 6 * RAD, h = 0.08, V = 120 / 3.6, r = marcha(V, th, h);
  const Ftot = r.Fd + r.Frr, teo = Ftot * 1e5 / (VEH.etaDT * VEH.etaTh * VEH.LHV);
  prueba('L/100 km = (F_d + F_rr)·100 km/(η_dt·η_th·PCI)', rel(r.consumo, teo) < 1e-13, `${f(r.consumo, 3)} L/100 km a 120 km/h`);
  prueba('energía por metro = F·1 m (la integral de la potencia en el tiempo)', rel(r.Pcig / V * 1e5 / 1e5 * VEH.etaDT, Ftot) < 1e-13);
  let mono = true, prev = 0; for (let v = 20; v <= 80; v += 2) { const c = marcha(v, th, h).consumo; if (c < prev) mono = false; prev = c; }
  prueba('el consumo crece con la velocidad (el arrastre manda)', mono);
  prueba('el consumo cruza el 40 % del aire a 50 km/h y supera el 70 % a 150 km/h', marcha(50 / 3.6, th, h).Pair / marcha(50 / 3.6, th, h).Pw < 0.45 && marcha(150 / 3.6, th, h).Pair / marcha(150 / 3.6, th, h).Pw > 0.7,
    `${f(marcha(50 / 3.6, th, h).Pair / marcha(50 / 3.6, th, h).Pw * 100, 1)} % y ${f(marcha(150 / 3.6, th, h).Pair / marcha(150 / 3.6, th, h).Pw * 100, 1)} %`);
  // al subir la carga, sube la rodadura: Δ F_rr = C_rr·F_z
  const r0 = marcha(50, 0, 0.12), r1 = marcha(50, 14 * RAD, 0.05);
  prueba('la carga aerodinámica suma rodadura: F_rr = C_rr·(m·g + F_z)', rel(r1.Frr, VEH.Crr * (VEH.m * G + r1.Fz)) < 1e-14 && r1.Frr > r0.Frr);
  const cons0 = marcha(120 / 3.6, 0, 0.12).consumo, cons1 = marcha(120 / 3.6, 14 * RAD, 0.05).consumo;
  prueba('un coche con alerón a 14° gasta más a 120 km/h', cons1 > cons0, `${f(cons0, 2)} → ${f(cons1, 2)} L/100 km`);
}

console.log('6 · Cargas por eje y agarre en curva');
{
  const th = 10 * RAD, h = 0.06;
  for (const V of [0.001, 30, 55, 80]) {
    const c = cargasEje(V, th, h), r = c.r;
    prueba(`a ${f(V * 3.6, 0)} km/h: ΣF_z,ejes = m·g + F_z`, rel(c.Fzf + c.Fzr, VEH.m * G + r.Fz) < 1e-13);
  }
  const c0 = cargasEje(0.001, th, h);
  prueba('en reposo el reparto estático es b/L delante', rel(c0.Fzf / (VEH.m * G), VEH.b / VEH.L) < 1e-5);
  // el momento de cabeceo respecto del suelo: los pares de todas las fuerzas se cancelan con el reparto de ejes
  const V = 60, c = cargasEje(V, th, h), a = c.r.a, q = c.r.q, A = VEH.A;
  const Mcg = c.Fzf * VEH.a - c.Fzr * VEH.b;                   // momento de las reacciones respecto del CG (z hacia arriba, x adelante)
  const Maero = -(q * A * (a.Czw * VEH.xAla + a.Czf * VEH.xSuelo + a.Czb * VEH.xCuerpo)) + c.r.Fd * VEH.hCP;
  prueba('equilibrio de momentos de cabeceo respecto del CG', Math.abs(Mcg - (-Maero)) / Math.abs(Mcg) < 1e-12 || Math.abs(Mcg + Maero) < 1e-6, `Σ = ${f(Mcg + Maero, 9)} N·m`);
  // sin aire (V → 0) a_y = μ0·g exactamente
  const g0 = agarre(0.001, th, h);
  prueba('sin aire, a_y,máx = μ0·g en los dos ejes', rel(g0.ay, VEH.mu0 * G) < 1e-5, `${f(g0.ay / G, 5)} g`);
  // con carga: más agarre pero MENOS que proporcional
  const g1 = agarre(70, th, h), ratio = g1.ay / g0.ay, cargaRel = 1 + marcha(70, th, h).Fz / (VEH.m * G);
  prueba('con la carga a 252 km/h: más agarre que sin ella, pero menos que proporcional (n = 0,15)', ratio > 1 && ratio < cargaRel, `${f(ratio, 4)}× frente a ${f(cargaRel, 4)}× de carga`);
  // con n = 0 y reparto igual al estático, a_y = μ0·(m g + F_z)/m ... se comprueba en el límite sin transferencia
  // velocidad de curva sin aero: √(μ0·g·R)
  const vc0 = vCurva(100, 0, 0.12, Object.assign(parBase(), { liso: true }));
  prueba('curva de 100 m sin aerodinámica: v ≈ √(μ0·g·R) (queda un 0,5 % por debajo: el arrastre descarga el eje delantero)', vc0 < Math.sqrt(VEH.mu0 * G * 100) && rel(vc0, Math.sqrt(VEH.mu0 * G * 100)) < 5e-3, `${f(vc0 * 3.6, 3)} km/h`);
  const vc1 = vCurva(100, 12 * RAD, 0.055);
  prueba('con alerón y suelo la curva se pasa más rápido', vc1 > vc0, `${f(vc0 * 3.6, 1)} → ${f(vc1 * 3.6, 1)} km/h`);
  prueba('el punto fijo cumple v²/R = a_y(v)', rel(vc1 * vc1 / 100, agarre(vc1, 12 * RAD, 0.055).ay) < 1e-9);
  // una curva rápida de 250 m: la carga ayuda en serio (pero menos que proporcional)
  const lisoP = Object.assign(parBase(), { liso: true }), v250 = vCurva(250, 0, 0.12, lisoP), v250a = vCurva(250, 12 * RAD, 0.055);
  prueba('curva rápida de 250 m: con 12° y 55 mm se pasa un 4–8 % más deprisa que sin aire', v250a / v250 > 1.04 && v250a / v250 < 1.08, `${f(v250 * 3.6, 1)} → ${f(v250a * 3.6, 1)} km/h (${f((v250a / v250 - 1) * 100, 1)} %)`);
  const bal = aero(12 * RAD, 0.055).fracDel;
  prueba('balance aerodinámico con carga: entre el 35 % y el 55 % delante', bal > 0.35 && bal < 0.55, `${f(bal * 100, 1)} % delante`);
  // el alerón retrasa la carga: con el alerón la curva a alta velocidad se limita en el DELANTERO
  const lim0 = agarre(70, 0, 0.12), lim1 = agarre(70, 18 * RAD, 0.12);
  prueba('el eje que limita lo decide el reparto aerodinámico', lim0.limita !== undefined && lim1.ayr > lim0.ayr && lim1.ayf <= lim0.ayf + 1e-9, `${lim0.limita}→${lim1.limita}`);
}

console.log('7 · Vórtice de herradura del alerón (visualización)');
{
  // Biot–Savart: un segmento muy largo reproduce Γ/(2π d)
  const o = [0, 0, 0]; vorticeSegmento([0, 1, 0], [-4000, 0, 0], [4000, 0, 0], 2, 1e-6, o);
  prueba('segmento largo: |v| = Γ/(2π·d) (d = 1 m, Γ = 2)', rel(Math.hypot(...o), 2 / (2 * Math.PI)) < 1e-6, `${f(Math.hypot(...o), 8)} frente a ${f(2 / (2 * Math.PI), 8)}`);
  // sentido: tramo ligado a lo largo de +z con Γ > 0: detrás (x > xw) la corriente se desvía hacia ARRIBA, delante hacia abajo
  const U = 1, CL = 1, gam = circulacionAla(CL, U), v1 = [0, 0, 0], v2 = [0, 0, 0];
  herradura([3, 1, 0], 2, 1, 0.75, gam, 0.05, v1); herradura([1, 1, 0], 2, 1, 0.75, gam, 0.05, v2);
  prueba('alerón con carga hacia abajo: detrás desvía el aire hacia arriba, delante hacia abajo', v1[1] > 0 && v2[1] < 0, `v_y detrás ${f(v1[1], 4)}, delante ${f(v2[1], 4)}`);
  prueba('Kutta–Joukowski: Γ = ½·c·C_L·U da L′ = ρ·U·Γ = ½ρU²·c·C_L', rel(AIRE.rho * 40 * circulacionAla(1.1, 40), 0.5 * AIRE.rho * 1600 * ALA.cuerda * 1.1) < 1e-14);
  // y el integral de la herradura da la sustentación del ala entera
  const Lw = AIRE.rho * 40 * circulacionAla(clAla(10 * RAD), 40) * ALA.envergadura, Lq = 0.5 * AIRE.rho * 1600 * ALA.S * clAla(10 * RAD);
  prueba('sustentación del ala = ρ·U·Γ·b = ½ρU²·S·C_L', rel(Lw, Lq) < 1e-12, `${f(Lq, 2)} N a 144 km/h`);
  // simétrico en z
  const a1 = [0, 0, 0], a2 = [0, 0, 0]; herradura([3, 1.2, 0.5], 2, 1, 0.75, gam, 0.05, a1); herradura([3, 1.2, -0.5], 2, 1, 0.75, gam, 0.05, a2);
  prueba('campo simétrico respecto del plano z = 0', Math.abs(a1[1] - a2[1]) < 1e-13 && Math.abs(a1[0] - a2[0]) < 1e-13 && Math.abs(a1[2] + a2[2]) < 1e-13);
}

console.log('8 · Estela: déficit de cantidad de movimiento = arrastre');
{
  for (const [Cd, A, w] of [[0.32, 2.05, 1.0], [0.45, 2.05, 1.3], [0.28, 2.05, 0.9]]) {
    const d = deficitEstela(Cd, A, w);
    // ∫ (u/U)(1 − u/U) dA con u/U = 1 − δ·exp(−r²/w²), por cuadratura radial
    let s = 0; const n = 200000, rmax = 12 * w, dr = rmax / n;
    for (let i = 0; i < n; i++) { const r = (i + 0.5) * dr, e = Math.exp(-r * r / (w * w)), u = 1 - d * e; s += u * (1 - u) * 2 * Math.PI * r * dr; }
    prueba(`C_d = ${Cd}, w = ${w} m: ∫(u/U)(1−u/U)dA = C_d·A/2`, rel(s, Cd * A / 2) < 1e-6, `δ = ${f(d, 5)}, ${f(s, 6)} vs ${f(Cd * A / 2, 6)}`);
  }
}

console.log('9 · Reto de diseño');
{
  let k = 0, mala = 0, minN = 1e9, maxN = 0, d = 0;
  for (let s = 1; s <= 60; s++) {
    let x = s * 7919 % 2147483647; const rnd = () => (x = x * 48271 % 2147483647) / 2147483647;
    const sc = generaReto(rnd);
    if (!sc) { mala++; continue; }
    k++; minN = Math.min(minN, sc.nFactibles); maxN = Math.max(maxN, sc.nFactibles);
    const e = evaluaReto(sc, sc.thRef, sc.hRef); if (!(e.okFz && e.okCons && e.okVmax)) d++;
  }
  prueba('60 escenarios: todos tienen solución y ninguno es trivial', mala === 0 && d === 0, `factibles ${minN}–${maxN} de ${BARRIDO.th.length * BARRIDO.h.length} configuraciones`);
  // ninguna esquina trivial: ni «todo al máximo» ni «todo al mínimo» pasan siempre
  let all = 0, min0 = 0, n = 0;
  for (let s = 1; s <= 60; s++) { let x = s * 7919 % 2147483647; const rnd = () => (x = x * 48271 % 2147483647) / 2147483647; const sc = generaReto(rnd); if (!sc) continue; n++;
    const eM = evaluaReto(sc, 22 * RAD, 0.05), e0 = evaluaReto(sc, 0, 0.12); if (eM.okFz && eM.okCons && eM.okVmax) all++; if (e0.okFz && e0.okCons && e0.okVmax) min0++; }
  prueba('«alerón al tope» y «alerón a cero» no resuelven ningún escenario', all === 0 && min0 === 0, `${all}/${n} y ${min0}/${n}`);
}

console.log(`\n${ok} pruebas en verde · ${mal} fallos`);
process.exit(mal ? 1 : 0);
