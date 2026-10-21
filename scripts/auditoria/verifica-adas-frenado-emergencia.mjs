// Verificación de la física del lab adas-frenado-emergencia: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-adas-frenado-emergencia.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { G, AEB, dParada, dParadaLibro, ttcDe, aRequerida, vImpactoCerrada, betaBB, nuevoFiltro, actualizaFiltro, vrrPosicion, mulberry32, gauss,
  tEntra, colisionableSinFrenar, nuevaCorrida, pasoCorrida, simula, paramsDe, evaluaConjunto, ventanaTu, CONJUNTOS_RETO } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
const base = (o) => Object.assign({ v0: 50 / 3.6, d0: 60, mu: 0.8, y0: 0, vp: 0, Tu: 99, alfa: 0.5, aeb: false, conductor: false, semilla: 1 }, o);
const corre = (q, max = 40000) => { let n = 0; while (!q.fin && n < max) { pasoCorrida(q); n++; } return q; };

console.log('1 · TTC, deceleración requerida y distancia de parada');
{
  prueba('TTC = d / v_rel', ttcDe(30, 15) === 2 && ttcDe(10, 0) === Infinity);
  prueba('a_req = v² / (2d)', rel(aRequerida(20, 10), 2.5) < 1e-15);
  const v = 50 / 3.6, mu = 0.8;
  prueba('fórmula de libro d = v·t_r + v²/(2μg)', rel(dParadaLibro(v, mu, 1.0), v + v * v / (2 * mu * G)) < 1e-15, `${f(dParadaLibro(v, mu, 1.0), 2)} m a 50 km/h, seco, t_r = 1 s`);
  // la parada del sistema (latencia + rampa) frente a la simulación: orden de frenado total desde t=0, obstáculo lejano en el carril
  let peor = 0, n = 0;
  for (const kmh of [20, 40, 60, 90]) for (const m of [0.8, 0.55, 0.25, 0.12]) {
    const q = nuevaCorrida(base({ v0: kmh / 3.6, d0: 400, mu: m }));
    q.tDriver = 0; corre(q);
    peor = Math.max(peor, Math.abs(q.s - dParada(kmh / 3.6, m))); n++;
  }
  prueba(`distancia de parada con latencia y rampa = fórmula exacta (${n} casos)`, peor < 1e-6, `peor diferencia ${peor.toExponential(2)} m`);
  const P2 = Object.assign({}, AEB, { tau: 0, J: Infinity });
  prueba('sin latencia ni rampa se reduce a v²/(2μg)', rel(dParada(20, 0.8, P2), 20 * 20 / (2 * 0.8 * G)) < 1e-12);
}

console.log('2 · Velocidad de impacto si no se evita (solución cerrada)');
{
  // freno total con latencia pero sin rampa (J = ∞): v² = v0² − 2a(d − v·τ)
  const saveJ = AEB.J; AEB.J = Infinity;
  let peor = 0, n = 0;
  for (const kmh of [30, 50, 70]) for (const m of [0.8, 0.55]) for (const d of [10, 14, 18]) {
    const v = kmh / 3.6, a = m * G, q = nuevaCorrida(base({ v0: v, d0: d, mu: m }));
    q.tDriver = 0; corre(q);
    const teo = vImpactoCerrada(v, d, a, AEB.tau);
    if (q.res.causa === 'choque') { peor = Math.max(peor, Math.abs(q.res.vImp - teo)); n++; }
  }
  prueba(`v_impacto simulada = √(v² − 2a(d − v·τ)) en ${n} choques`, n > 5 && peor < 1e-6, `peor diferencia ${peor.toExponential(2)} m/s`);
  AEB.J = saveJ;
  const q = simula(base({ y0: 0, vp: 0, d0: 30 }));
  prueba('sin frenar, el impacto es a v0', q.res.causa === 'choque' && rel(q.res.vImp, 50 / 3.6) < 1e-12, `${f(q.res.vImpKmh, 3)} km/h`);
  // con rampa, el impacto es menor que sin latencia y mayor que con freno instantáneo ideal
  const v = 50 / 3.6, a = 0.8 * G, d = 12, q2 = corre(Object.assign(nuevaCorrida(base({ v0: v, d0: d, mu: 0.8 })), { tDriver: 0 }));
  const ideal = vImpactoCerrada(v, d, a, 0), conLat = vImpactoCerrada(v, d, a, AEB.tau);
  prueba('con latencia y rampa el impacto queda entre el ideal y el peor', q2.res.vImp > ideal && q2.res.vImp > conLat - 0.001, `ideal ${f(ideal * 3.6, 1)} · con latencia ${f(conLat * 3.6, 1)} · con rampa ${f(q2.res.vImp * 3.6, 1)} km/h`);
}

console.log('3 · Conservación de la energía y rampa de la presión');
{
  const P = base({ v0: 25, d0: 500, mu: 0.8 }), q = nuevaCorrida(P); q.tDriver = 0;
  let trabajo = 0, n = 0, sPrev = q.s;
  while (!q.fin && n < 40000) { const a0 = q.a; pasoCorrida(q); trabajo += 0.5 * (a0 + q.a) * (q.s - sPrev); sPrev = q.s; n++; }
  const energia = 0.5 * P.v0 * P.v0;
  prueba('energía cinética inicial = trabajo de la deceleración (hasta parar)', rel(energia, trabajo) < 5e-3, `${f(energia, 3)} contra ${f(trabajo, 3)} J/kg`);
  const a = 0.8 * G, Tr = a / AEB.J;
  prueba('la rampa tarda Tr = a/J en llegar a μg', Math.abs(Tr - 0.1308) < 1e-3, `Tr = ${f(Tr * 1000, 1)} ms`);
}

console.log('4 · Filtro alfa-beta');
{
  const T = AEB.T;
  for (const al of [0.2, 0.5, 0.8]) {
    const be = betaBB(al);
    const s = 2 - al - be, disc = s * s - 4 * (1 - al);
    const mod = disc >= 0 ? Math.max(Math.abs((s + Math.sqrt(disc)) / 2), Math.abs((s - Math.sqrt(disc)) / 2)) : Math.sqrt(1 - al);
    prueba(`α = ${al}: β = α²/(2−α) = ${f(be, 4)} y los polos están dentro del círculo unidad`, mod < 1, `|z|máx = ${f(mod, 4)}`);
  }
  for (const al of [0.2, 0.5, 0.8]) {
    const fl = nuevoFiltro(al); let d = 60; const v = 14;
    for (let i = 0; i < 600; i++) { d -= v * T; actualizaFiltro(fl, d); }
    prueba(`seguimiento de una rampa a α = ${al}: error de distancia ${Math.abs(fl.x - d).toExponential(1)} m y de velocidad ${Math.abs(fl.v + v).toExponential(1)} m/s`, Math.abs(fl.x - d) < 1e-9 && Math.abs(fl.v + v) < 1e-9);
  }
  for (const al of [0.3, 0.5, 0.7]) {
    const fl = nuevoFiltro(al), be = fl.beta, ac = 3.0; let z = 0;
    for (let i = 0; i < 800; i++) { const t = i * T; z = 100 - 0.5 * ac * t * t; actualizaFiltro(fl, z); }
    const retardo = Math.abs(z - fl.x);
    prueba(`aceleración constante a α = ${al}: residuo = a·T²/β y retardo = (1−α)·a·T²/β`, rel(Math.abs(fl.r), ac * T * T / be) < 1e-6 && rel(retardo, (1 - al) * ac * T * T / be) < 1e-6,
      `residuo ${f(Math.abs(fl.r) * 1000, 3)} mm (teoría ${f(ac * T * T / be * 1000, 3)}); retardo ${f(retardo * 1000, 3)} mm`);
  }
  for (const al of [0.3, 0.5, 0.8]) {
    const fl = nuevoFiltro(al), rnd = mulberry32(7), N = 400000; let acc = 0;
    for (let i = 0; i < 200; i++) actualizaFiltro(fl, gauss(rnd));
    for (let i = 0; i < N; i++) { actualizaFiltro(fl, gauss(rnd)); acc += fl.x * fl.x; }
    const vrr = acc / N, teo = vrrPosicion(al, fl.beta);
    prueba(`varianza del ruido tras el filtro, α = ${al}: ${f(vrr, 4)} contra Brookner ${f(teo, 4)}`, rel(vrr, teo) < 0.03);
  }
  { const rnd = mulberry32(3); let s1 = 0, s2 = 0; const N = 200000; for (let i = 0; i < N; i++) { const g = gauss(rnd); s1 += g; s2 += g * g; }
    prueba('gauss: media 0 y varianza 1', Math.abs(s1 / N) < 0.01 && Math.abs(s2 / N - 1) < 0.02, `media ${f(s1 / N, 4)} · var ${f(s2 / N, 4)}`); }
}

console.log('5 · El peatón y el corredor');
{
  const P = { y0: 3.2, vp: 1.0, d0: 30, v0: 10 };
  prueba('tEntra = (y0 − H)/vp', rel(tEntra(P), (3.2 - AEB.H) / 1.0) < 1e-15, `${f(tEntra(P), 3)} s`);
  prueba('un peatón que se detiene en la acera nunca entra', tEntra({ y0: 3.2, vp: 1, tStop: 1.0 }) === Infinity);
  prueba('un obstáculo ya en el carril entra a t = 0', tEntra({ y0: 0, vp: 0 }) === 0);
  prueba('colisionable: llega a t = 3 s y el peatón está en el carril de 2,0 a 4,4 s', colisionableSinFrenar(P));
  prueba('no colisionable: llega cuando el peatón ya cruzó', !colisionableSinFrenar({ y0: 3.2, vp: 1, d0: 80, v0: 10 }));
}

console.log('6 · Los escenarios del reto');
for (let c = 0; c < CONJUNTOS_RETO.length; c++) {
  const L = CONJUNTOS_RETO[c];
  for (const E of L) {
    const P = paramsDe(E, 99, 0.5);
    prueba(`conjunto ${c + 1} · ${E.id}: ${E.tipo === 'cruza' ? 'colisiona' : 'es inofensivo'} si el coche no frena`, colisionableSinFrenar(P) === (E.tipo === 'cruza'));
    const q = simula(Object.assign({}, P, { aeb: false }));
    prueba(`   y la simulación sin AEB lo confirma (${q.res.causa}${q.res.causa === 'choque' ? ' a ' + f(q.res.vImpKmh, 1) + ' km/h' : ''})`, (E.tipo === 'cruza') === (q.res.causa === 'choque'));
  }
  const w = ventanaTu(L, 0.5);
  prueba(`conjunto ${c + 1}: existe una ventana de umbral Tu`, !!w && w.hi - w.lo >= 0.2, w ? `Tu de ${f(w.lo, 2)} a ${f(w.hi, 2)} s` : 'ninguna');
  if (w) {
    const bajo = evaluaConjunto(L, w.lo - 0.05, 0.5), alto = evaluaConjunto(L, w.hi + 0.05, 0.5);
    prueba(`   por debajo de ${f(w.lo, 2)} s alguno choca`, bajo.some(r => r.colisionable && r.causa === 'choque'), bajo.filter(r => !r.ok).map(r => r.id + ' ' + r.causa + ' ' + f(r.vImpKmh, 1) + ' km/h').join(', '));
    prueba(`   por encima de ${f(w.hi, 2)} s el inofensivo frena en falso`, alto.some(r => !r.colisionable && r.falsoPos));
    let robusto = true;
    for (const sem of [2, 3, 4, 5, 6, 7]) {
      const Tm = +(0.5 * (w.lo + w.hi)).toFixed(2);
      const r = L.map(E => { const q = simula(Object.assign(paramsDe(E, Tm, 0.5), { semilla: sem })); const re = q.res; return E.tipo === 'cruza' ? re.causa !== 'choque' : !re.falsoPos; });
      if (!r.every(Boolean)) robusto = false;
    }
    prueba(`   el centro de la ventana (${f(0.5 * (w.lo + w.hi), 2)} s) pasa con 6 semillas de ruido distintas`, robusto);
  }
}

console.log('7 · Efecto del filtro');
{
  const E = CONJUNTOS_RETO[0][1];
  // con el coche frenando a fondo, la velocidad de cierre estimada se queda atrás (sobreestima) tanto más cuanto menor es α
  const sesgo = (al) => { const q = simula(paramsDe(E, 1.6, al)); const hs = q.hist.filter(h => h.t > 1.7 && h.t < 2.3); return hs.reduce((a, h) => a + (h.vEst - h.v), 0) / hs.length; };
  const rapido = sesgo(0.8), lento = sesgo(0.15);
  prueba('con el coche frenando, un α pequeño deja la velocidad de cierre estimada por encima de la real', lento > rapido + 0.5, `sesgo medio de v̂ − v: α 0,15 → ${f(lento, 2)} m/s; α 0,8 → ${f(rapido, 2)} m/s`);
  const sd = (al) => { const q = simula(paramsDe(E, 99, al)); const v = q.hist.filter(h => h.t > 0 && h.t < 1.0).map(h => h.vEst - 55 / 3.6); return Math.sqrt(v.reduce((a, b) => a + b * b, 0) / v.length); };
  prueba('la velocidad de cierre estimada es más ruidosa cuanto mayor es α', sd(0.9) > sd(0.3), `desviación de v̂: α 0,9 → ${f(sd(0.9), 2)} m/s; α 0,3 → ${f(sd(0.3), 2)} m/s`);
}
console.log(`\n${ok} comprobaciones bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
