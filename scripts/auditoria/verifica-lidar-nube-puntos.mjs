// Verificación de la física del lab lidar-nube-puntos: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, valores de libro y simulaciones de Monte Carlo.
// uso: node scripts/auditoria/verifica-lidar-nube-puntos.mjs [ruta del html]
import { readFileSync } from 'node:fs';
const RUTA_HTML = new URL('../../public/labs/lidar-nube-puntos.html', import.meta.url);
function cargaFisica(ruta=RUTA_HTML){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,C0,clamp,dB,deDB,mulberry32,gauss,erfc,Qn,Qinv,LIDAR,K_UMBRAL,SIGMA_N,A90,NGATES,P_FA_RAYO,CLIMAS,REFL,tVuelo,distDeTiempo,transmision,potEco,llenado,pDet,alcanceDe,sigmaRango,rBs,pGhost,potBs,geomBarrido,elDeCanal,radioAnillo,construyeMundo,cruce,trazaRayo,CLASE,generaNube,segmentaSuelo,agrupa,procesaBarrido,anillosPeaton,pedEsperado,evaluaConfig,NVS,RANGO,ventanaReto,ESCENARIOS};')();
}
const RUTA = process.argv[2];
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, C0, clamp, dB, deDB, mulberry32, gauss, erfc, Qn, Qinv, LIDAR, K_UMBRAL, SIGMA_N, A90, NGATES, P_FA_RAYO, CLIMAS, REFL, tVuelo, distDeTiempo, transmision,
  potEco, llenado, pDet, alcanceDe, sigmaRango, rBs, pGhost, potBs, geomBarrido, elDeCanal, radioAnillo, construyeMundo, cruce, trazaRayo, CLASE, generaNube, segmentaSuelo,
  agrupa, procesaBarrido, anillosPeaton, pedEsperado, evaluaConfig, NVS, RANGO, ventanaReto, ESCENARIOS } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);

console.log('1 · Estadística del receptor: erfc, Q y Q⁻¹');
{
  const ref = [[0, 1], [0.5, 0.4795001221869535], [1, 0.15729920705028513], [2, 0.004677734981047266], [3, 2.209049699858544e-5], [4, 1.541725790028002e-8], [5, 1.5374597944280349e-12]];
  let peor = 0; for (const [x, v] of ref) peor = Math.max(peor, rel(erfc(x), v));
  prueba('erfc(x) contra tablas (x = 0 … 5, hasta 1,5·10⁻¹²)', peor < 1e-12, `peor error relativo ${peor.toExponential(2)}`);
  prueba('erfc(−x) = 2 − erfc(x)', Math.abs(erfc(-1.3) - (2 - erfc(1.3))) < 1e-15);
  prueba('Q(0) = 0,5 y Q(1,2815516) = 0,1', Math.abs(Qn(0) - 0.5) < 1e-16 && rel(Qn(1.2815515655446004), 0.1) < 1e-12, `Q(1,28155) = ${Qn(1.2815515655446004)}`);
  prueba('Q⁻¹(Q(x)) = x en 31 puntos de −4 a 5', (() => { let m = 0; for (let x = -4; x <= 5.0001; x += 0.3) m = Math.max(m, Math.abs(Qinv(Qn(x)) - x)); return m < 1e-9; })());
  prueba('el umbral sale de la P_fa de diseño: Q(k) = 10⁻⁶ con k = 4,7534', rel(Qn(K_UMBRAL), 1e-6) < 1e-9, `k = ${f(K_UMBRAL, 4)}`);
  // Monte Carlo del comparador: señal a σ_n·3 sobre un ruido gaussiano
  const rng = mulberry32(11), N = 2e6, a = 3; let s = 0; for (let i = 0; i < N; i++) if (a + gauss(rng) > K_UMBRAL) s++;
  const pt = Qn(K_UMBRAL - a), sd = Math.sqrt(pt * (1 - pt) / N);
  prueba('P_d simulada (2·10⁶ muestras, señal 3σ) = Q(k − 3)', Math.abs(s / N - pt) < 4 * sd, `simulada ${(s / N).toExponential(3)} · teórica ${pt.toExponential(3)} · 4σ = ${(4 * sd).toExponential(1)}`);
}

console.log('2 · Tiempo de vuelo: d = c·t/2');
{
  prueba('c = 299 792 458 m/s', C0 === 299792458);
  prueba('t = 2d/c y d = c·t/2 se invierten', rel(distDeTiempo(tVuelo(60)), 60) < 1e-15 && rel(tVuelo(distDeTiempo(4e-7)), 4e-7) < 1e-15);
  prueba('400 ns de ida y vuelta = 59,96 m', Math.abs(distDeTiempo(400e-9) - 59.9584916) < 1e-6, `${f(distDeTiempo(400e-9), 4)} m`);
  prueba('1 ns de reloj = 14,99 cm (el paso del reloj de tiempo)', Math.abs(distDeTiempo(1e-9) - 0.149896229) < 1e-9, `${f(distDeTiempo(1e-9) * 100, 3)} cm`);
  prueba('100 m → 0,667 µs', Math.abs(tVuelo(100) * 1e6 - 0.667128) < 1e-6, `${f(tVuelo(100) * 1e6, 4)} µs`);
  prueba('alcance sin ambigüedad c/(2·PRF) del peor ajuste (128 canales a 0,1°, 20 barridos/s) pasa de la ventana de 250 m',
    geomBarrido({ Nv: 128, dth: 0.1, f: 20, P: 50 }).Runamb > LIDAR.Rwin, `${f(geomBarrido({ Nv: 128, dth: 0.1, f: 20, P: 50 }).Runamb / 1000, 2)} km`);
}

console.log('3 · Ecuación del lidar');
{
  const P = 50, rho = 0.1, al = 2e-4;
  prueba('P_r ∝ 1/R² sin atmósfera: duplicar R cuarta la potencia (−6,02 dB)', rel(potEco(P, rho, 1, 100, 0) / potEco(P, rho, 1, 200, 0), 4) < 1e-14 && Math.abs(dB(potEco(P, rho, 1, 100, 0) / potEco(P, rho, 1, 200, 0)) - 6.0206) < 1e-3);
  prueba('P_r ∝ P_t, ∝ ρ y ∝ cosθ', rel(potEco(2 * P, rho, 1, 80, al) / potEco(P, rho, 1, 80, al), 2) < 1e-14 && rel(potEco(P, 0.6, 1, 80, al) / potEco(P, 0.1, 1, 80, al), 6) < 1e-14 && rel(potEco(P, rho, 0.5, 80, al) / potEco(P, rho, 1, 80, al), 0.5) < 1e-14);
  prueba('transmisión e^(−2αR): 100 m con α = 0,2 km⁻¹ = 0,9608', Math.abs(transmision(al, 100) - Math.exp(-0.04)) < 1e-15, `${f(transmision(al, 100), 5)}`);
  prueba('contra la fórmula escrita a mano: P=75 W, ρ=0,1, R=100 m, α=0 → 239 nW con A_r=4·10⁻⁴ m², η=0,3 → 28,65 nW',
    Math.abs(potEco(75, 0.1, 1, 100, 0) - 75 * 0.1 / Math.PI * 4e-4 * 0.3 / 1e4) < 1e-20 && Math.abs(potEco(75, 0.1, 1, 100, 0) * 1e9 - 28.6479) < 1e-3, `${f(potEco(75, 0.1, 1, 100, 0) * 1e9, 4)} nW`);
  // alcance: forma cerrada sin atmósfera y raíz con atmósfera
  const Rc = Math.sqrt(P * rho * LIDAR.Ar * LIDAR.eta / (Math.PI * SIGMA_N * A90));
  prueba('alcance con α = 0: R = √(P·ρ·A_r·η / (π·σ_n·a))', rel(alcanceDe(P, rho, 0), Rc) < 1e-9, `${f(alcanceDe(P, rho, 0), 3)} m (cerrada ${f(Rc, 3)})`);
  const Ra = alcanceDe(P, rho, 1.7e-3);
  prueba('con atmósfera la raíz cumple P_r(R)/σ_n = a al 10⁻⁹ y es menor que sin ella', Math.abs(potEco(P, rho, 1, Ra, 1.7e-3) / SIGMA_N - A90) < 1e-7 && Ra < Rc, `${f(Ra, 2)} m con lluvia · ${f(Rc, 2)} m sin atmósfera`);
  prueba('P_d(P_r = P_min) = 0,5 · P_d(0) = P_fa · P_d(a_90·σ_n) = 0,90', Math.abs(pDet(LIDAR.Pmin) - 0.5) < 1e-12 && rel(pDet(0), 1e-6) < 1e-9 && Math.abs(pDet(A90 * SIGMA_N) - 0.9) < 1e-12);
  const cl = alcanceDe(75, 0.1, CLIMAS.despejado.alfa), lluv = alcanceDe(75, 0.1, CLIMAS.lluvia.alfa), nie = alcanceDe(75, 0.1, CLIMAS.niebla.alfa);
  prueba('el alcance cae en orden despejado > lluvia > niebla (75 W, ropa oscura)', cl > lluv && lluv > nie, `${f(cl, 1)} · ${f(lluv, 1)} · ${f(nie, 1)} m`);
  prueba('ropa clara (60 %) vs oscura (10 %): +7,78 dB de eco', Math.abs(dB(potEco(P, 0.6, 1, 50, 0) / potEco(P, 0.1, 1, 50, 0)) - 7.7815) < 1e-3);
  prueba('niebla de 300 m: α = 3,912/V (Koschmieder) = 13,04 km⁻¹', Math.abs(CLIMAS.niebla.alfa * 1000 - 13.04) < 1e-9);
  prueba('el haz llena al peatón hasta 333 m (0,5 m / 1,5 mrad)', llenado(100) === 1 && Math.abs(llenado(500) - 0.5 / (500 * 1.5e-3)) < 1e-15);
}

console.log('4 · Precisión de la distancia, falsos ecos de la lluvia y de la niebla');
{
  const a1 = 10 * SIGMA_N, a2 = 20 * SIGMA_N;
  prueba('σ_R = (c·t_subida/2)/(P_r/σ_n): el doble de señal, la mitad de error', rel(sigmaRango(a1) / sigmaRango(a2), 2) < 1e-12 && rel(sigmaRango(a1), (C0 * 2e-9 / 2) / 10) < 1e-12, `${f(sigmaRango(a1) * 100, 2)} cm a 10σ`);
  prueba('σ_R tiene un suelo de 1 cm', sigmaRango(1e6 * SIGMA_N) === 0.01);
  // simulado: error de distancia contra un muro frontal conocido (x = 40 m) normalizado por σ_R: debe salir N(0,1)
  const muro = { objs: [{ tipo: 'caja', x0: 40, x1: 44, y0: 0, y1: 30, z0: -80, z1: 80, rho: 0.3, id: 1, a0: -1.5, a1: 1.5 }], xp: 0, zp: 0 };
  const nube = generaNube({ Nv: 32, dth: 0.2, f: 10, P: 8 }, { R: 60, rho: 0.1, clima: 'despejado' }, muro, 5, { sinRuido: true, sinFantasmas: true });
  const zs = [];
  for (let k = 0; k < nube.n; k++) if (nube.C[k] === CLASE.ESTR) { const d = Math.hypot(nube.X[k], nube.Y[k] - LIDAR.hs, nube.Z[k]), dx = nube.X[k] / d, errT = d - 40 / dx; zs.push(errT / sigmaRango(nube.IN[k])); }
  const mz = zs.reduce((a, b) => a + b, 0) / zs.length, sz = Math.sqrt(zs.reduce((a, b) => a + (b - mz) ** 2, 0) / zs.length);
  prueba('el error de distancia medido contra un muro conocido, dividido por σ_R, es N(0,1) (media ≈ 0, desviación ≈ 1)', zs.length > 1000 && Math.abs(mz) < 0.08 && Math.abs(sz - 1) < 0.06, `${zs.length} puntos · media ${f(mz, 3)} · desviación ${f(sz, 3)}`);
  // lluvia/niebla
  const P = 75;
  prueba('retrodispersión: la potencia de las gotas a r = r_bs vale P_min (sin atenuación propia)', rel(potBs(P, CLIMAS.niebla.alfa, rBs(P, CLIMAS.niebla.alfa)) * Math.exp(2 * CLIMAS.niebla.alfa * rBs(P, CLIMAS.niebla.alfa)), LIDAR.Pmin) < 1e-12,
    `r_bs niebla ${f(rBs(P, CLIMAS.niebla.alfa), 2)} m · lluvia ${f(rBs(P, CLIMAS.lluvia.alfa), 2)} m · despejado ${f(rBs(P, CLIMAS.despejado.alfa), 2)} m`);
  prueba('p_ghost = 1 − e^(−α·r_bs): niebla ≫ lluvia ≫ despejado', pGhost(P, CLIMAS.niebla.alfa) > 10 * pGhost(P, CLIMAS.lluvia.alfa) && pGhost(P, CLIMAS.lluvia.alfa) > 10 * pGhost(P, CLIMAS.despejado.alfa),
    `${f(pGhost(P, CLIMAS.niebla.alfa) * 100, 1)} % · ${f(pGhost(P, CLIMAS.lluvia.alfa) * 100, 2)} % · ${f(pGhost(P, CLIMAS.despejado.alfa) * 100, 3)} %`);
  prueba('p_ghost crece con la potencia (r_bs ∝ √P)', rel(rBs(100, 1e-2) / rBs(25, 1e-2), 2) < 1e-12 && pGhost(100, 1e-2) > pGhost(25, 1e-2));
  // simulado: fracción de puntos fantasma en niebla
  const mundoV = construyeMundo(60, 0, 0.1, false), cfgN = { Nv: 16, dth: 0.5, f: 10, P: 75 }, escN = { R: 60, rho: 0.1, clima: 'niebla' };
  // sólo los canales cuyo rayo al suelo cae más allá de r_bs (el eco falso no puede tapar un contacto más cercano)
  let nf = 0, nr = 0; for (let s = 1; s <= 8; s++) { const nb = generaNube(cfgN, escN, mundoV, s, { sinRuido: true }); let cn = 0; for (let i = 0; i < nb.Nv; i++) { if (elDeCanal(i, nb.Nv) < -3) continue; cn++; for (let j = 0; j < nb.Naz; j++) { const k = nb.idx[i * nb.Naz + j]; if (k >= 0 && nb.C[k] === CLASE.FANTASMA) nf++; } } nr += cn * nb.Naz; }
  const pm = nf / nr, ps = pGhost(75, CLIMAS.niebla.alfa);
  prueba('fracción simulada de ecos falsos en niebla = p_ghost', Math.abs(pm - ps) < 4 * Math.sqrt(ps * (1 - ps) / nr), `simulada ${f(pm, 4)} · prevista ${f(ps, 4)} (${nr} pulsos)`);
  // ruido: falsas alarmas por pulso
  let nz = 0, nrr = 0; for (let s = 1; s <= 6; s++) { const nb = generaNube({ Nv: 32, dth: 0.2, f: 10, P: 50 }, { R: 60, rho: 0.1, clima: 'despejado' }, mundoV, s, {}); nz += nb.nRuido; nrr += nb.rayos; }
  prueba('falsas alarmas por ruido: P_fa·(muestras de la ventana) por pulso', Math.abs(nz / nrr - P_FA_RAYO) < 4 * Math.sqrt(P_FA_RAYO / nrr), `simulada ${f(nz / nrr * 1e3, 3)}·10⁻³ · prevista ${f(P_FA_RAYO * 1e3, 3)}·10⁻³ (${NGATES} muestras)`);
}

console.log('5 · Geometría: cruces, anillos y presupuesto de puntos');
{
  // cruces exactos
  const cil = { tipo: 'cil', cx: 50, cz: 0, r: 0.25, y0: 0, y1: 1.7, rho: 0.1, id: 2 };
  const a = cruce(cil, 0, 1.8 - 1, 0, 1, 0, 0, 250);
  prueba('rayo al eje del cilindro: t = 50 − 0,25 y cosθ = 1', a && Math.abs(a[0] - 49.75) < 1e-12 && Math.abs(a[1] - 1) < 1e-12);
  const b = cruce(cil, 0, 0.8, 0, Math.cos(Math.asin(0.25 / 50)) * 0.999, 0, Math.sin(Math.asin(0.25 / 50)) * 0.999, 250);
  prueba('rayo tangente por dentro de la silueta cruza; por fuera no', !!b && cruce(cil, 0, 0.8, 0, Math.cos(Math.asin(0.26 / 50)), 0, Math.sin(Math.asin(0.26 / 50)), 250) === null);
  const box = { tipo: 'caja', x0: 30, x1: 34, y0: 0, y1: 2, z0: -1, z1: 1, rho: 0.5, id: 1 };
  const bx = cruce(box, 0, 1, 0, 1, 0, 0, 250);
  prueba('caja: rayo frontal toca la cara x = 30 con cosθ = 1', bx && Math.abs(bx[0] - 30) < 1e-12 && Math.abs(bx[1] - 1) < 1e-12);
  const ang = 30 * Math.PI / 180, bz = cruce({ tipo: 'caja', x0: -100, x1: 100, y0: 0, y1: 20, z0: 10, z1: 13, rho: 0.4, id: 1 }, 0, 1, 0, Math.cos(ang), 0, Math.sin(ang), 250);
  prueba('muro a 10 m, rayo a 30° del eje: t = 10/sen 30° = 20 m y cosθ = sen 30°', bz && Math.abs(bz[0] - 20) < 1e-9 && Math.abs(bz[1] - Math.sin(ang)) < 1e-9, `t = ${f(bz && bz[0], 6)} · cosθ = ${f(bz && bz[1], 4)}`);
  const sp = { tipo: 'esf', cx: 20, cy: 1, cz: 0, r: 1.5, rho: 0.2, id: 1 };
  const es = cruce(sp, 0, 1, 0, 1, 0, 0, 250);
  prueba('esfera: t = 20 − r y cosθ = 1 en el eje', es && Math.abs(es[0] - 18.5) < 1e-12 && Math.abs(es[1] - 1) < 1e-12);
  // suelo: anillos
  const mundoV = construyeMundo(60, 0, 0.1, false);
  const rr = [-3, -5, -10, -20]; let peor = 0;
  for (const phi of rr) { const e = phi * Math.PI / 180, h = trazaRayo([], 0, LIDAR.hs, 0, Math.cos(e), Math.sin(e), 0, 250); peor = Math.max(peor, Math.abs(h.t * Math.cos(e) - radioAnillo(phi))); }
  prueba('el rayo al suelo cae en r = h/tan φ (φ = −3°, −5°, −10°, −20°)', peor < 1e-9, `r(−3°) = ${f(radioAnillo(-3), 3)} m · r(−10°) = ${f(radioAnillo(-10), 3)} m`);
  // presupuesto: los pulsos por segundo son los puntos por segundo
  const cfg = { Nv: 32, dth: 0.2, f: 10, P: 50 }, g = geomBarrido(cfg);
  prueba('puntos/s = N_v · (120°/Δθ) · f exactos', g.Naz === 600 && g.rayos === 19200 && g.ptsSeg === 192000 && g.prfCanal === 6000, `${g.ptsSeg} pulsos/s`);
  let cont = 0; const nb = generaNube(cfg, { R: 60, rho: 0.1, clima: 'despejado' }, mundoV, 1, {}); cont = nb.rayos;
  prueba('el barrido lanza exactamente N_v·N_az pulsos', cont === g.rayos);
  prueba('los canales van de −25° a +7° con paso uniforme', elDeCanal(0, 32) === -25 && Math.abs(elDeCanal(31, 32) - 7) < 1e-12 && Math.abs(elDeCanal(1, 32) - elDeCanal(0, 32) - 32 / 31) < 1e-12);
  // el 3D y el modelo cuentan lo mismo: puntos de suelo por anillo en el barrido
  let maxDesv = 0, cnt = 0;
  const nbS = generaNube({ Nv: 16, dth: 0.5, f: 10, P: 150 }, { R: 60, rho: 0.1, clima: 'despejado' }, mundoV, 2, { sinRuido: true });
  for (let i = 0; i < 16; i++) { const phi = elDeCanal(i, 16); if (phi >= -3.5) continue; const r0 = radioAnillo(phi); if (r0 < 6 || r0 > 20) continue;
    for (let j = 0; j < nbS.Naz; j++) { const k = nbS.idx[i * nbS.Naz + j]; if (k < 0 || nbS.C[k] !== CLASE.SUELO) continue; maxDesv = Math.max(maxDesv, Math.abs(nbS.RH[k] - r0) / r0); cnt++; } }
  prueba('los puntos de suelo caen en el radio de su anillo (error < 6σ_R)', cnt > 50 && maxDesv < 0.02, `${cnt} puntos · mayor desviación relativa ${maxDesv.toExponential(2)}`);
}

console.log('6 · Cuántos puntos caen sobre el peatón (Monte Carlo contra la forma cerrada)');
{
  // horizontales: promedio sobre la fase del espejo = ancho angular / separación, exacto
  const R = 40, cfg = { Nv: 64, dth: 0.3, f: 10, P: 150 }, esc = { R, rho: 0.6, clima: 'despejado' }, mundo = construyeMundo(R, 0, 0.6);
  let suma = 0, K = 120; for (let u = 0; u < K; u++) { const nb = generaNube(cfg, esc, mundo, 1, { fase: (u + 0.5) / K, sinRuido: true }); suma += nb.nPeat; }
  const g = geomBarrido(cfg), an = anillosPeaton(cfg, R), esperado = 2 * Math.asin(0.25 / R) / (cfg.dth * Math.PI / 180) * an.nTotal;
  prueba('promedio sobre la fase del espejo: golpes = (2·asen(r/R)/Δθ) · anillos que lo tocan', Math.abs(suma / K - esperado) / esperado < 0.02, `simulado ${f(suma / K, 3)} · cerrada ${f(esperado, 3)} · anillos ${an.nTotal}`);
  prueba('el ancho angular del peatón a 40 m es 0,716° y el alto 2,43°', Math.abs(2 * Math.asin(0.25 / R) * 180 / Math.PI - 0.7162) < 1e-3 && Math.abs((Math.atan2(1.8, R) - Math.atan2(0.1, R)) * 180 / Math.PI - 2.4335) < 1e-3, `${f(2 * Math.asin(0.25 / R) * 180 / Math.PI, 4)}° · ${f((Math.atan2(1.8, R) - Math.atan2(0.1, R)) * 180 / Math.PI, 4)}°`);
  // separación entre puntos a la distancia del peatón
  const pe = pedEsperado(cfg, esc);
  prueba('separación horizontal entre puntos = R·Δθ', Math.abs(pe.sepH - R * 0.3 * Math.PI / 180) < 1e-12, `${f(pe.sepH * 100, 2)} cm a 40 m`);
  // clúster: media del tamaño del grupo del peatón frente a E
  const casos = [
    [{ Nv: 32, dth: 0.2, f: 10, P: 60 }, { R: 45, rho: 0.1, clima: 'despejado' }],
    [{ Nv: 64, dth: 0.15, f: 10, P: 80 }, { R: 70, rho: 0.1, clima: 'despejado' }],
    [{ Nv: 128, dth: 0.1, f: 10, P: 100 }, { R: 70, rho: 0.1, clima: 'despejado' }],
    [{ Nv: 64, dth: 0.3, f: 10, P: 25 }, { R: 40, rho: 0.6, clima: 'niebla' }],
    [{ Nv: 64, dth: 0.25, f: 10, P: 60 }, { R: 50, rho: 0.1, clima: 'lluvia' }],
    [{ Nv: 128, dth: 0.2, f: 10, P: 80 }, { R: 55, rho: 0.6, clima: 'despejado' }],
  ];
  let peorRel = 0; const filas = [];
  for (const [c, e] of casos) {
    const m = construyeMundo(e.R, 0, e.rho), N = 40; let st = 0; for (let s = 1; s <= N; s++) { const r = procesaBarrido(c, e, m, s * 13 + 7); st += r.tamPed; }
    const E = pedEsperado(c, e).E, med = st / N; peorRel = Math.max(peorRel, Math.abs(med - E) / Math.max(E, 4)); filas.push(`${f(med, 2)} / ${f(E, 2)}`);
  }
  prueba('tamaño medio del grupo del peatón (40 barridos) = puntos esperados, en 6 configuraciones (±10 % o 0,4 puntos)', peorRel < 0.10, `simulado / esperado: ${filas.join(' · ')}`);
  // el grupo no incluye al suelo: los pies se quedan fuera
  const rP = procesaBarrido({ Nv: 128, dth: 0.1, f: 10, P: 100 }, { R: 50, rho: 0.6, clima: 'despejado' }, construyeMundo(50, 0, 0.6), 3, {});
  prueba('con 128 canales a 50 m hay ≥ 1 punto del peatón clasificado como suelo (los pies, < 0,30 m) y el grupo no lo cuenta', rP.pedEnSuelo >= 1 && rP.tamPed <= rP.nPed - rP.pedEnSuelo, `golpes ${rP.nPed} · en suelo ${rP.pedEnSuelo} · grupo ${rP.tamPed}`);
}

console.log('7 · Segmentación del suelo y agrupamiento');
{
  // precisión de la segmentación con eco perfecto (P grande, sin ruido ni gotas)
  const cfg = { Nv: 64, dth: 0.4, f: 10, P: 150 }, esc = { R: 40, rho: 0.6, clima: 'despejado' }, mundo = construyeMundo(40, 0.5, 0.6);
  const nb = generaNube(cfg, esc, mundo, 4, { sinRuido: true, sinFantasmas: true }), su = segmentaSuelo(nb);
  let aciertos = 0, tot = 0, falsoSuelo = 0, falsoObj = 0, nS = 0, nO = 0;
  for (let k = 0; k < nb.n; k++) { const real = nb.C[k] === CLASE.SUELO || nb.Y[k] < LIDAR.zSuelo; tot++; if (!!su[k] === real) aciertos++; else if (su[k]) falsoSuelo++; else falsoObj++; if (real) nS++; else nO++; }
  prueba('suelo / obstáculo acertado en ≥ 99,5 % de los puntos', aciertos / tot >= 0.995, `${aciertos}/${tot} (${f(100 * aciertos / tot, 2)} %) · suelo ${nS} · obstáculos ${nO} · falsos suelo ${falsoSuelo} · falsos obstáculo ${falsoObj}`);
  let pared = 0, paredSuelo = 0; for (let k = 0; k < nb.n; k++) if (nb.Y[k] > 1.0) { pared++; if (su[k]) paredSuelo++; }
  prueba('ningún punto a más de 1 m de altura es suelo', pared > 100 && paredSuelo === 0, `${pared} puntos altos`);
  // agrupamiento: dos cajas lejos una de otra son dos grupos; el poste delante de la fachada no se une a ella
  const inc = new Uint8Array(nb.n); for (let k = 0; k < nb.n; k++) inc[k] = su[k] ? 0 : 1;
  const ag = agrupa(nb, inc);
  // grupos = objetos separados: todo grupo mezcla poco las dos alturas de la fachada y un poste
  const mundoS = { objs: [], xp: 0, zp: 0 };
  const mk = (o) => { mundoS.objs.push(o); };
  mk({ tipo: 'caja', x0: 30, x1: 34, y0: 0.3, y1: 2, z0: -3, z1: -1, rho: 0.5, id: 1 });
  mk({ tipo: 'caja', x0: 50, x1: 54, y0: 0.3, y1: 2, z0: 1, z1: 3, rho: 0.5, id: 1 });
  mk({ tipo: 'caja', x0: -10, x1: 260, y0: 0, y1: 20, z0: 12, z1: 14, rho: 0.4, id: 1 });
  mk({ tipo: 'cil', cx: 25, cz: 7, r: 0.1, y0: 0, y1: 7, rho: 0.35, id: 1 });
  for (const o of mundoS.objs) { const pts = o.tipo === 'caja' ? [[o.x0, o.z0], [o.x0, o.z1], [o.x1, o.z0], [o.x1, o.z1]] : [[o.cx, o.cz]]; let a0 = 1e9, a1 = -1e9; for (const [x, z] of pts) { const a = Math.atan2(z, Math.max(x, 0.01)); a0 = Math.min(a0, a); a1 = Math.max(a1, a); } o.a0 = a0 - 0.01; o.a1 = a1 + 0.01; }
  const nb2 = generaNube({ Nv: 64, dth: 0.2, f: 10, P: 150 }, { R: 40, rho: 0.6, clima: 'despejado' }, mundoS, 3, { sinRuido: true, sinFantasmas: true }), su2 = segmentaSuelo(nb2);
  const inc2 = new Uint8Array(nb2.n); for (let k = 0; k < nb2.n; k++) inc2[k] = su2[k] ? 0 : 1;
  const ag2 = agrupa(nb2, inc2);
  const gDe = (cond) => { const s = new Set(); for (let k = 0; k < nb2.n; k++) if (cond(k) && ag2.etiqueta[k] >= 0) s.add(ag2.etiqueta[k]); return s; };
  const gA = gDe(k => nb2.X[k] > 29 && nb2.X[k] < 35 && nb2.Z[k] < -0.5 && nb2.Z[k] > -4 && nb2.Y[k] > 0.4 && nb2.Y[k] < 2.1), gB = gDe(k => nb2.X[k] > 49 && nb2.X[k] < 55 && nb2.Z[k] > 0.5 && nb2.Z[k] < 4 && nb2.Y[k] > 0.4 && nb2.Y[k] < 2.1);
  const gP = gDe(k => Math.abs(nb2.Z[k] - 7) < 0.3 && Math.abs(nb2.X[k] - 25) < 0.3), gF = gDe(k => nb2.Z[k] > 11.9 && nb2.Y[k] > 0.5);
  prueba('dos cajas separadas dan dos grupos distintos, cada una uno solo', gA.size === 1 && gB.size === 1 && ![...gA].some(x => gB.has(x)), `caja A grupos ${[...gA]} · caja B ${[...gB]}`);
  prueba('el poste de delante no se une a la fachada de detrás (β ≈ 0 en el salto de distancia)', gP.size >= 1 && ![...gP].some(x => gF.has(x)), `poste ${[...gP]} · fachada ${gF.size} grupos`);
  // un peatón lejano no se parte en trozos aunque los puntos estén a más de 1 m
  const rr = procesaBarrido({ Nv: 128, dth: 0.2, f: 10, P: 100 }, { R: 60, rho: 0.6, clima: 'despejado' }, construyeMundo(60, 0, 0.6), 9, {});
  const sep = pedEsperado({ Nv: 128, dth: 0.2, f: 10, P: 100 }, { R: 60, rho: 0.6, clima: 'despejado' });
  prueba('un peatón con puntos separados más de 20 cm sigue siendo UN grupo (el enlace es por vecindad en la imagen, no en metros)', sep.sepH > 0.2 && rr.ag.grupos.filter(G => G.nPeat > 0).length === 1, `separación ${f(sep.sepH * 100, 1)} cm · ${rr.ag.grupos.filter(G => G.nPeat > 0).length} grupo(s) con puntos suyos`);
  // fantasmas de la niebla: aparecen como obstáculos pegados al coche
  const rf = procesaBarrido({ Nv: 32, dth: 0.3, f: 10, P: 100 }, { R: 40, rho: 0.6, clima: 'niebla' }, construyeMundo(40, 0, 0.6), 5, {});
  let cerca = 0, fant = 0; for (let k = 0; k < rf.nube.n; k++) if (rf.nube.C[k] === CLASE.FANTASMA) { fant++; if (Math.hypot(rf.nube.X[k], rf.nube.Z[k]) < LIDAR.hs * 20) cerca++; }
  prueba('en niebla los ecos falsos están a menos de r_bs del coche y la segmentación los toma por obstáculos', fant > 100 && cerca === fant && (() => { let obst = 0; for (let k = 0; k < rf.nube.n; k++) if (rf.nube.C[k] === CLASE.FANTASMA && !rf.suelo[k]) obst++; return obst > 0.5 * fant; })(), `${fant} falsos ecos`);
}

console.log('8 · Evaluación del reto: criterios, escenarios y coherencia con el procesado completo');
{
  const g10 = evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 60 }, { R: 50, rho: 0.1, clima: 'despejado', presupuesto: 1e9 });
  prueba('los seis criterios existen', g10.criterios.map(c => c.k).join() === 'eco,puntos,presupuesto,ojo,reaccion,fantasmas');
  const base = { R: 50, rho: 0.6, clima: 'despejado', presupuesto: 600000 };
  prueba('reacción: 3 barridos en ≤ 0,30 s → f ≥ 10 Hz (en 10 pasa, en 9 no)', evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 60 }, base).criterios[4].ok && !evaluaConfig({ Nv: 32, dth: 0.2, f: 9, P: 60 }, base).criterios[4].ok);
  prueba('ojo: 100 W pasa y 105 W no', evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 100 }, base).criterios[3].ok && !evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 105 }, base).criterios[3].ok);
  prueba('presupuesto: 192 000 pts/s cabe en 192 000 y en 191 999 no', evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 60 }, Object.assign({}, base, { presupuesto: 192000 })).criterios[2].ok && !evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 60 }, Object.assign({}, base, { presupuesto: 191999 })).criterios[2].ok);
  prueba('el margen del eco sube 3,01 dB al duplicar la potencia (sin atmósfera apreciable)', Math.abs(evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 20 }, Object.assign({}, base, { clima: 'despejado' })).pe.margenDB - evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 10 }, Object.assign({}, base, { clima: 'despejado' })).pe.margenDB - 3.0103) < 1e-6);
  const filas = [];
  for (const [k, esc] of Object.entries(ESCENARIOS)) {
    const v = ventanaReto(esc), porDefecto = evaluaConfig({ Nv: 32, dth: 0.2, f: 10, P: 60 }, esc), todo = evaluaConfig({ Nv: 128, dth: 0.1, f: 20, P: 150 }, esc);
    const incumple = porDefecto.criterios.filter(c => !c.ok).map(c => c.k).join('+');
    prueba(`«${k}»: tiene solución (${v.n} ajustes de la rejilla), no se aprueba con los mandos por defecto ni con todo al máximo`, v.n >= 30 && !porDefecto.ok && !todo.ok, `ventana: ${v.canales.join('/')} canales · Δθ ${f(v.dthMin, 2)}–${f(v.dthMax, 2)}° · f ${v.fMin}–${v.fMax} Hz · P ${v.Pmin}–${v.Pmax} W · por defecto falla ${incumple}`);
    filas.push(v.n);
  }
  prueba('ninguna solución es el máximo de todo: en cada escenario hay soluciones con menos de 128 canales o con Δθ > 0,1° o con P < 100 W',
    Object.values(ESCENARIOS).every(esc => { let hay = false; for (const Nv of NVS) for (let dth = 0.1; dth <= 0.8; dth += 0.05) for (let P = 5; P <= 100; P += 5) if (evaluaConfig({ Nv, dth: Math.round(dth * 100) / 100, f: 10, P }, esc).ok && !(Nv === 128 && P === 100 && dth < 0.101)) { hay = true; } return hay; }));
  // Monte Carlo de la decisión 'puntos': el grupo medio del peatón ≥ 10 coincide con E ≥ 10 en configuraciones al azar
  const rng = mulberry32(2026); let coincide = 0, N = 60;
  for (let q = 0; q < N; q++) {
    const Nv = NVS[Math.floor(rng() * 4)], dth = Math.round((0.1 + Math.floor(rng() * 15) * 0.05) * 100) / 100, P = 20 + Math.floor(rng() * 17) * 5, R = 35 + Math.floor(rng() * 12) * 5;
    const c = { Nv, dth, f: 10, P }, e = { R, rho: 0.1 + 0.5 * Math.floor(rng() * 2), clima: 'despejado' };
    const E = pedEsperado(c, e).E, m = construyeMundo(R, 0, e.rho); let st = 0; const M = 12; for (let s = 1; s <= M; s++) st += procesaBarrido(c, e, m, s * 31 + q).tamPed;
    if ((st / M >= LIDAR.Nmin) === (E >= LIDAR.Nmin) || Math.abs(st / M - E) < 1.2) coincide++;
  }
  prueba('la decisión analítica «≥ 10 puntos» coincide con el procesado completo (grupo medio de 12 barridos) en ≥ 90 % de 60 ajustes al azar', coincide / N >= 0.9, `${coincide}/${N}`);
}

console.log('\nResumen: ' + ok + ' pruebas ✓, ' + mal + ' ✗');
process.exit(mal ? 1 : 0);
