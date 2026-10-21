// Verificación de la física de «Control de crucero adaptativo (ACC): mantener la distancia con el coche de adelante» (mecanica-154).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas del lazo longitudinal: el perfil exacto del líder (rampa suave S(u) = 3u² − 2u³: derivada, integral y pico de aceleración),
// la respuesta exacta del control de crucero (sobreamortiguado, segundo orden), el retardo puro del actuador, el equilibrio con e = 0, la
// cinemática (∫a = Δv, ∫v = Δx), la respuesta en frecuencia de la cadena Γ(jω) contra la transformada de Fourier de la simulación, la condición
// cerrada de estabilidad de cadena y el diseño del reto (ventana interior, nada se cumple «de fábrica», cada diagnóstico tiene su síntoma).
// uso: node scripts/auditoria/verifica-control-crucero-adaptativo-acc.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/control-crucero-adaptativo-acc.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {G,DOSPI,clamp,suave,LCOCHE,D0,LIM,K_CRUCERO,RADAR,DTS,TFIN,NPAS,NCOCHES,prng,normal,ESCENARIOS,escPorId,durTramo,velLider,acelLider,posLider,distDeseada,deriv,rk4,ordenAcc,simula,metricas,gananciaGamma,picoCadena,cadenaCerrada,cumple,cumpleTodo,corre,distMano};`)();
// los casos del reto y el ajuste del recorrido viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + fin.replace(/\n/g, ''))();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');
const PAR_BIEN = new Function('return ' + html.split('const PAR_BIEN=')[1].split(';\n')[0])();
const TOUR_PARES = [...html.matchAll(/par:(\{esc:'[a-z]+',h:[\d.]+,p:[\d.]+,d:[\d.]+\}|PAR_BIEN)/g)].map((m) => (m[1] === 'PAR_BIEN' ? PAR_BIEN : new Function('return ' + m[1])()));
const INI_AJUSTA = (() => { const m = html.match(/GUIA\.r2=\{esc:e,h:([\d.]+),p:([\d.]+),d:([\d.]+)/); return { h: +m[1], p: +m[2], d: +m[3] }; })();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } else if (process.env.V) console.log('  ✓', msg, extra); };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const { DTS, TFIN, NPAS, D0, LIM, LCOCHE, RADAR, ESCENARIOS } = F;
const f2 = (x, d = 2) => x.toFixed(d);
const R0 = { sigD: RADAR.sigD, sigV: RADAR.sigV, dt: RADAR.dt };
const sinRuido = () => { RADAR.sigD = 0; RADAR.sigV = 0; };
const conRuido = () => { RADAR.sigD = R0.sigD; RADAR.sigV = R0.sigV; RADAR.dt = R0.dt; };

console.log('1 · Generador pseudoaleatorio y normal');
{ const r = F.prng(12345), s = []; for (let i = 0; i < 6; i++) s.push(r()); const r2 = F.prng(12345); ok(s.every((v) => v === r2()), 'misma semilla, misma secuencia');
  const rr = F.prng(777); let m = 0, v = 0, N = 200000; const xs = new Float64Array(N); for (let i = 0; i < N; i++) { xs[i] = F.normal(rr); m += xs[i]; } m /= N; for (let i = 0; i < N; i++) v += (xs[i] - m) ** 2; v /= N;
  absc(m, 0, 0.01, 'media de la normal ≈ 0'); absc(v, 1, 0.02, 'varianza de la normal ≈ 1'); }

console.log('2 · Constantes y política de tiempo de brecha');
{ cerca(D0, 5, 1e-14, 'distancia de parada d0 = 5 m'); cerca(LCOCHE, 4.4, 1e-14, 'largo del coche = 4,4 m (nariz 2,05 + cola 2,35)');
  ok(LIM.amin === -3.5 && LIM.amax === 2.0, 'topes de confort −3,5 y +2,0 m/s²');
  for (const [h, v] of [[1.0, 10], [1.5, 27.78], [2.4, 0], [0.6, 36]]) cerca(F.distDeseada(h, v), D0 + h * v, 1e-14, `d* = d0 + h·v  (h = ${h} s, v = ${v} m/s)`);
  const c = F.distMano(90, 1.5); cerca(c.v, 25, 1e-14, '90 km/h = 25 m/s'); cerca(c.d, 42.5, 1e-14, 'cálculo a mano: 5 + 1,5·25 = 42,5 m');
  // la política crece de forma lineal con la velocidad: al doble de velocidad la parte dinámica se duplica
  cerca(F.distDeseada(1.3, 40) - D0, 2 * (F.distDeseada(1.3, 20) - D0), 1e-14, 'la parte dinámica de d* se duplica al duplicar v'); }

console.log('3 · Perfil exacto del líder (rampa suave S(u) = 3u² − 2u³)');
{ for (const esc of ESCENARIOS) {
    let v = esc.v0; const tr0 = esc.tramos[0], T0 = F.durTramo(esc.v0, tr0);
    cerca(T0, 1.5 * Math.abs(tr0.v - esc.v0) / tr0.a, 1e-14, `${esc.id}: duración de la 1.ª maniobra T = 1,5·|Δv|/a = ${f2(T0)} s`);
    // aceleración máxima de la rampa = a pedida (en u = ½), medida con la derivada exacta
    let pico = 0; for (let t = tr0.t; t <= tr0.t + T0; t += T0 / 4000) pico = Math.max(pico, Math.abs(F.acelLider(esc, t)));
    cerca(pico, tr0.a, 1e-6, `${esc.id}: la aceleración máxima del líder es la pedida (${tr0.a} m/s²)`);
    // la velocidad final de cada tramo se alcanza exactamente y es continua
    for (const tr of esc.tramos) { const T = F.durTramo(v, tr); absc(F.velLider(esc, tr.t + T + 0.001), tr.v, 1e-3 * tr.a, `${esc.id}: llega a ${f2(tr.v * 3.6, 0)} km/h`); absc(F.velLider(esc, tr.t - 1e-9), F.velLider(esc, tr.t + 1e-9), 1e-6, `${esc.id}: la velocidad es continua al empezar el tramo`); v = tr.v; }
    // la aceleración es la derivada de la velocidad (diferencias centrales) y la posición es su integral (Simpson)
    let eD = 0, eX = 0; for (let t = 0.5; t < TFIN - 0.5; t += 0.37) { const h = 1e-4, d = (F.velLider(esc, t + h) - F.velLider(esc, t - h)) / (2 * h); eD = Math.max(eD, Math.abs(d - F.acelLider(esc, t))); }
    absc(eD, 0, 1e-5, `${esc.id}: aceleración = dv/dt (error máx. ${eD.toExponential(1)})`);
    const N = 40000, dt = TFIN / N; let I = 0; for (let k = 0; k <= N; k++) { const w = (k === 0 || k === N) ? 1 : (k % 2 ? 4 : 2); I += w * F.velLider(esc, k * dt); } I *= dt / 3;
    cerca(F.posLider(esc, TFIN), I, 1e-8, `${esc.id}: la posición del líder (forma cerrada) = ∫v dt (Simpson)`);
    cerca(F.posLider(esc, 0), 0, 1, `${esc.id}: x(0) = 0`);
  } }

console.log('4 · Control de crucero (sin líder): solución exacta del segundo orden sobreamortiguado');
{ sinRuido(); RADAR.dt = DTS;
  const esc = F.escPorId('autopista'), tau = 0.30, Kc = F.K_CRUCERO, dlt = 1.5;      // 1,5 m/s por debajo de la velocidad fijada: la orden 0,6 m/s² no satura
  const A = F.simula(esc, { h: 1.3, kp: 0.3, kd: 0.8, tau, theta: 0, vset: esc.v0 + dlt, libre: true });
  const disc = Math.sqrt(1 - 4 * Kc * tau), s1 = (-1 + disc) / (2 * tau), s2 = (-1 - disc) / (2 * tau);
  const c1 = dlt * s2 / (s1 - s2), c2b = -dlt - c1;                 // v − v_f = c1·e^{s1 t} + c2·e^{s2 t} con v(0) − v_f = −dlt y a(0) = 0
  // (a) el modelo continuo: la discretización a 10 ms con la orden retenida un paso cuesta O(Δt), unos 1e-3 m/s aquí
  let e = 0; for (const t of [0.5, 1, 2, 4, 8, 15]) { const k = Math.round(t / DTS), ex = esc.v0 + dlt + c1 * Math.exp(s1 * t) + c2b * Math.exp(s2 * t); e = Math.max(e, Math.abs(A.c[0].v[k] - ex)); }
  absc(e, 0, 2e-3, 'v(t) = solución exacta continua de τ·v̈ + v̇ + K_c·v = K_c·v_fijada (la orden se retiene 10 ms)', `(error ${e.toExponential(1)})`);
  // (b) el mapa exacto de un paso con la orden retenida: a(t) = u + (a0 − u)e^{−t/τ}, v(t) = v0 + u·t + (a0 − u)·τ·(1 − e^{−t/τ})
  { let v = esc.v0, a = 0, eM = 0; const E = Math.exp(-DTS / tau);
    for (let k = 0; k < 1500; k++) { eM = Math.max(eM, Math.abs(A.c[0].v[k] - v), Math.abs(A.c[0].a[k] - a)); const u = Kc * (esc.v0 + dlt - v); const vn = v + u * DTS + (a - u) * tau * (1 - E), an = u + (a - u) * E; v = vn; a = an; }
    absc(eM, 0, 1e-8, 'RK4 reproduce el mapa exacto de un paso con orden retenida (1500 pasos)', `(error ${eM.toExponential(1)})`); }
  ok(disc > 0 && s1 < 0 && s2 < 0, 'con K_c = 0,4 y τ = 0,3 s el lazo de crucero es sobreamortiguado (sin rebase de la velocidad fijada)');
  let rebase = 0; for (let k = 0; k <= NPAS; k++) rebase = Math.max(rebase, A.c[0].v[k] - (esc.v0 + dlt)); absc(rebase, 0, 1e-6, 'la velocidad nunca pasa de la fijada');
  absc(A.c[0].v[NPAS], esc.v0 + dlt, 1e-3, 'al final llega a la velocidad fijada');
  conRuido(); }

console.log('5 · Retardo puro del actuador y tope de confort');
{ sinRuido(); RADAR.dt = DTS;
  const esc = F.escPorId('autopista'), th = 0.15;
  const A = F.simula(esc, { h: 1.3, kp: 0.3, kd: 0.8, tau: 0.30, theta: th, vset: esc.v0 + 1.5, libre: true }), E = A.c[0];
  const kt = Math.round(th / DTS); let antes = 0; for (let k = 0; k < kt; k++) antes = Math.max(antes, Math.abs(E.a[k]));
  absc(antes, 0, 1e-15, 'la aceleración REAL es exactamente 0 durante el retardo puro θ');
  ok(E.a[kt + 20] > 1e-3, 'después de θ la aceleración empieza a crecer'); ok(E.ac[0] > 0.5, 'la orden existe desde t = 0 (el retardo es del actuador, no del radar)');
  // tope de confort: una velocidad fijada muy lejana pide más de +2 m/s² y la orden se satura
  const B = F.simula(esc, { h: 1.3, kp: 0.3, kd: 0.8, tau: 0.30, theta: th, vset: esc.v0 + 20, libre: true });
  let aM = 0, oM = 0; for (let k = 0; k <= NPAS; k++) { aM = Math.max(aM, B.c[0].a[k]); oM = Math.max(oM, B.c[0].ac[k]); }
  cerca(oM, LIM.amax, 1e-12, 'la orden satura exactamente en +2,0 m/s²'); ok(aM <= LIM.amax + 1e-9, 'la aceleración real nunca pasa del tope', `(${aM})`);
  // el retardo de transporte retrasa la respuesta exactamente θ: v(t; θ) ≈ v(t − θ; 0) para el lazo sin saturar es sólo aproximado, así que se mide el instante en que a cruza 0,05 m/s²
  const A0 = F.simula(esc, { h: 1.3, kp: 0.3, kd: 0.8, tau: 0.30, theta: 0, vset: esc.v0 + 1.5, libre: true });
  const t05 = (X) => { for (let k = 0; k <= NPAS; k++) if (X.c[0].a[k] > 0.05) return k * DTS; return NaN; };
  absc(t05(A) - t05(A0), th, 0.0151, 'el retardo desplaza la respuesta θ = 0,15 s'); conRuido(); }

console.log('6 · Equilibrio y cinemática');
{ sinRuido(); RADAR.dt = DTS;
  const esc = Object.assign({}, F.escPorId('autopista'), { tramos: [] });
  const A = F.simula(esc, { h: 1.3, kp: 0.3, kd: 0.8 }), E = A.c[0]; let ea = 0, ed = 0;
  for (let k = 0; k <= NPAS; k++) { ea = Math.max(ea, Math.abs(E.a[k])); ed = Math.max(ed, Math.abs(E.d[k] - F.distDeseada(1.3, esc.v0))); }
  absc(ea, 0, 1e-9, 'con e = 0 y líder a velocidad constante, la aceleración es 0'); absc(ed, 0, 1e-9, 'la distancia se queda exactamente en d* (sin ruido)');
  conRuido();
  const R = F.corre(F.escPorId('autopista'), { h: 1.3, p: 0.3, d: 0.8 }), C = R.A.c[0];
  let Iv = 0, Ia = 0; for (let k = 1; k <= NPAS; k++) { Iv += 0.5 * (C.v[k] + C.v[k - 1]) * DTS; Ia += 0.5 * (C.a[k] + C.a[k - 1]) * DTS; }
  absc(Ia, C.v[NPAS] - C.v[0], 5e-3, '∫a dt = Δv del coche propio'); absc(Iv, C.x[NPAS] - C.x[0], 5e-3, '∫v dt = Δx del coche propio');
  // la distancia entre parachoques es exactamente x_líder − x − largo
  let eD = 0; for (let k = 0; k <= NPAS; k += 37) eD = Math.max(eD, Math.abs(C.d[k] - (R.A.xl[k] - C.x[k] - LCOCHE))); absc(eD, 0, 1e-9, 'd = x_líder − x − 4,4 m');
  // reproducible: la misma semilla da la misma simulación
  const R2 = F.corre(F.escPorId('autopista'), { h: 1.3, p: 0.3, d: 0.8 }); ok(R2.A.c[0].a[1234] === C.a[1234] && R2.m.dmin === R.m.dmin, 'la simulación es reproducible (ruido de semilla fija)');
  // el coche no retrocede aunque el líder se detenga del todo
  const T = F.corre(F.escPorId('atasco'), { h: 1.3, p: 0.3, d: 0.8 }); let vmin = 1e9; for (let k = 0; k <= NPAS; k++) vmin = Math.min(vmin, T.A.c[0].v[k]); ok(vmin >= 0, 'en el atasco la velocidad nunca es negativa', `(${vmin})`);
  const k17 = Math.round(17 / DTS); absc(T.A.c[0].d[k17], D0, 1.2, 'detenido el líder, el coche se para a ≈ d0 = 5 m', `(d = ${f2(T.A.c[0].d[k17])} m)`); absc(T.A.c[0].v[k17], 0, 0.15, 'y queda prácticamente detenido (|v| < 0,15 m/s)'); }

console.log('7 · Respuesta en frecuencia de la cadena: Γ(jω) contra la DFT de la simulación (maniobra suave, sin saturar)');
{ sinRuido(); RADAR.dt = DTS;
  const esc = Object.assign({}, F.escPorId('autopista'), { tramos: [{ t: 5, v: F.escPorId('autopista').v0 - 2, a: 0.8 }] });       // −2 m/s a 0,8 m/s²: no satura ni con una cadena que amplifica
  for (const [h, p, d, tau, theta] of [[1.3, 0.3, 0.8, 0.30, 0.15], [0.6, 0.3, 0.8, 0.30, 0.15], [1.3, 0.3, 0.2, 0.30, 0.15], [1.3, 0.5, 1.2, 0.45, 0.20], [1.7, 0.2, 0.6, 0.30, 0.15]]) {
    const A = F.simula(esc, { h, kp: p, kd: d, tau, theta, vset: 200 }), a1 = A.c[0].a, a2 = A.c[1].a;
    let sat = 0; for (let k = 0; k <= NPAS; k++) sat += A.c[0].sat[k] + A.c[1].sat[k];
    ok(sat === 0, `(h ${h}, P ${p}, D ${d}) la simulación no satura: el modelo lineal es exacto`, `(${sat} pasos)`);
    for (const w of [0.15, 0.3, 0.5, 0.8]) {
      let r1 = 0, i1 = 0, r2 = 0, i2 = 0; for (let k = 0; k <= NPAS; k++) { const c = Math.cos(w * k * DTS), s = -Math.sin(w * k * DTS); r1 += a1[k] * c; i1 += a1[k] * s; r2 += a2[k] * c; i2 += a2[k] * s; }
      const g = Math.hypot(r2, i2) / Math.hypot(r1, i1);
      // la orden retenida 10 ms añade media muestra (5 ms) de retardo equivalente: Γ se evalúa con θ + Δt/2
      cerca(g, F.gananciaGamma(w, h, p, d, tau, theta + DTS / 2), 6e-4, `|Γ(j${w})| de la DFT = fórmula con θ + Δt/2  (h ${h}, P ${p}, D ${d}, τ ${tau}, θ ${theta})`);
    } }
  conRuido(); }

console.log('8 · Estabilidad de cadena: fórmula cerrada y pico numérico');
{ cerca(F.gananciaGamma(1e-6, 1.3, 0.3, 0.8, 0.3, 0.15), 1, 1e-6, 'Γ(0) = 1: a baja frecuencia la frenada pasa igual al coche de atrás');
  // identidad algebraica sin retardo puro: |D|² − |N|² = ω²·B + ω⁴·C + τ²ω⁶ con B = P²h² + 2PDh − 2P y C = 1 − 2τ(D + Ph)
  let eI = 0; for (const [h, p, d, tau, w] of [[1.3, 0.3, 0.8, 0.3, 0.7], [0.6, 0.5, 0.2, 0.45, 1.9], [2.0, 0.1, 1.5, 0.2, 3.1], [1.0, 0.8, 0.4, 0.3, 0.05]]) {
    const g = F.gananciaGamma(w, h, p, d, tau, 0), N2 = p * p + d * d * w * w, D2 = (p - w * w) ** 2 + w * w * (d + p * h - tau * w * w) ** 2, B = p * p * h * h + 2 * p * d * h - 2 * p, C = 1 - 2 * tau * (d + p * h);
    eI = Math.max(eI, Math.abs(g * g - N2 / D2), Math.abs((D2 - N2) - (w * w * B + w ** 4 * C + tau * tau * w ** 6))); }
  absc(eI, 0, 1e-12, '|Γ|² = |N|²/|D|² y |D|² − |N|² = ω²B + ω⁴C + τ²ω⁶ (identidad exacta)', `(${eI.toExponential(1)})`);
  // la condición cerrada coincide con el pico numérico en una rejilla (θ = 0)
  let dif = 0, tot = 0, sal = 0; for (let h = 0.4; h <= 2.6; h += 0.1) for (const p of [0.03, 0.1, 0.3, 0.8]) for (const d of [0.2, 0.5, 0.8, 1.2, 2.0]) for (const tau of [0.2, 0.3, 0.45]) {
    const cer = F.cadenaCerrada(h, p, d, tau), num = F.picoCadena(h, p, d, tau, 0).estable; tot++; if (cer !== num) { // la frontera exacta (B ≈ 0 ó C² ≈ 4Bτ²) puede caer a ±1e-6 de la rejilla
      const B = p * p * h * h + 2 * p * d * h - 2 * p, C = 1 - 2 * tau * (d + p * h); if (Math.abs(B) < 1e-6 || Math.abs(C * C - 4 * B * tau * tau) < 1e-4) sal++; else dif++; } }
  ok(dif === 0, 'estable ⇔ B ≥ 0 y (C ≥ 0 ó C² ≤ 4Bτ²) en toda la rejilla', `(${dif} discrepancias de ${tot}; ${sal} en la frontera)`);
  // física: h corta amplifica, h larga no; D muy alta o muy baja también
  ok(!F.picoCadena(0.6, 0.3, 0.8, 0.3, 0.15).estable && F.picoCadena(1.3, 0.3, 0.8, 0.3, 0.15).estable, 'h = 0,6 s amplifica y h = 1,3 s no (D = 0,8)');
  ok(!F.picoCadena(1.3, 0.3, 0.2, 0.3, 0.15).estable && !F.picoCadena(1.3, 0.3, 2.0, 0.3, 0.15).estable, 'con D = 0,2 o D = 2,0 la cadena amplifica a h = 1,3 s');
  // más retardo resta estabilidad
  ok(F.picoCadena(1.3, 0.3, 0.8, 0.3, 0.15).estable && !F.picoCadena(1.3, 0.3, 0.8, 0.3, 0.6).estable, 'con más retardo puro (0,6 s) el mismo ajuste deja de ser estable');
  // el pico de una cadena inestable se ve en la simulación: el 3.er coche frena más que el 1.º
  const mal = F.corre(F.escPorId('autopista'), { h: 0.6, p: 0.3, d: 0.8 }), bien = F.corre(F.escPorId('autopista'), { h: 1.3, p: 0.3, d: 0.8 });
  ok(bien.m.amplif < 1, 'cadena estable: el 3.er coche frena MENOS que el 1.º', `(×${f2(bien.m.amplif)})`);
  ok(mal.cad.pico > 1.1, 'h = 0,6 s: la ganancia pico de la cadena supera 1,10', `(×${f2(mal.cad.pico, 3)})`); }

console.log('9 · Diseño del reto: ventana interior, nada se cumple «de fábrica», cada diagnóstico tiene su síntoma');
{ const esc = F.escPorId('autopista');
  for (const E of ESCENARIOS) { const r = F.corre(E, PAR_BIEN); ok(F.cumpleTodo(r.m, E, r.cad), `${E.id}: el ajuste del recorrido (h ${PAR_BIEN.h}, P ${PAR_BIEN.p}, D ${PAR_BIEN.d}) cumple los cinco criterios`);
    const r0 = F.corre(E, INI_AJUSTA); ok(!F.cumpleTodo(r0.m, E, r0.cad), `${E.id}: el ajuste inicial del reto (h ${INI_AJUSTA.h}, P ${INI_AJUSTA.p}, D ${INI_AJUSTA.d}) NO cumple`); }
  // ventana: a partir del ajuste bueno, cada mando tiene un hueco con los extremos NO cumpliendo (interior)
  const lg = (a, b, i, N) => a * Math.pow(b / a, i / N);
  for (const E of ESCENARIOS) {
    const rangos = {}; for (const cual of ['h', 'p', 'd']) { const ok_ = []; for (let i = 0; i <= 120; i++) { const x = cual === 'h' ? 0.6 + 1.8 * i / 120 : (cual === 'p' ? lg(0.01, 0.8, i, 120) : lg(0.2, 2.0, i, 120)); const q = Object.assign({}, PAR_BIEN, { [cual]: x }); const r = F.corre(E, q); ok_.push(F.cumpleTodo(r.m, E, r.cad)); } rangos[cual] = ok_; }
    for (const cual of ['h', 'd']) { const v = rangos[cual], a = v.indexOf(true), b = v.lastIndexOf(true); ok(a > 0 && b < v.length - 1 && v.slice(a, b + 1).every(Boolean), `${E.id}: la ventana de ${cual.toUpperCase()} es INTERIOR y de un solo tramo`, `(posiciones ${a}…${b} de ${v.length - 1})`); }
    { const v = rangos.p, a = v.indexOf(true), b = v.lastIndexOf(true); ok(a >= 0 && v.slice(a, b + 1).every(Boolean), `${E.id}: la ventana de P es de un solo tramo (P es la ganancia más tolerante: la interior es la de h y D)`, `(posiciones ${a}…${b} de ${v.length - 1})`); } }
  // fracción de combinaciones que cumplen en la rejilla de los mandos del alumno (h 0,6–2,4 · P 0,03–0,8 · D 0,2–2,0)
  const fr = {}; for (const E of ESCENARIOS) { let ok_ = 0, tot = 0; for (let i = 0; i <= 18; i++) for (let j = 0; j <= 16; j++) for (let k = 0; k <= 16; k++) { const r = F.corre(E, { h: 0.6 + 1.8 * i / 18, p: lg(0.01, 0.8, j, 16), d: lg(0.2, 2.0, k, 16) }); tot++; if (F.cumpleTodo(r.m, E, r.cad)) ok_++; } fr[E.id] = ok_ / tot; ok(fr[E.id] > 0.01 && fr[E.id] < 0.2, `${E.id}: sólo cumple el ${f2(100 * fr[E.id], 1)} % de las combinaciones (no se adivina, pero existe)`); }
  console.log('     fracción que cumple:', JSON.stringify(Object.fromEntries(Object.entries(fr).map(([k, v]) => [k, +(100 * v).toFixed(1)]))));
  // diagnóstico: cada caso falla y su síntoma es distinto
  const dx = {}; for (const c of CASOS_DX) { const r = F.corre(F.escPorId(c.esc), c); dx[c.k] = { m: r.m, cad: r.cad, c: F.cumple(r.m, F.escPorId(c.esc), r.cad) }; ok(!F.cumpleTodo(r.m, F.escPorId(c.esc), r.cad), `diagnóstico «${c.k}»: el sistema NO cumple`); }
  ok(dx.corto.m.dmin < dx.nervioso.m.dmin && dx.corto.m.dmin < dx.lejos.m.dmin && dx.corto.m.dmin < 8, '«corto»: es el que más se acerca al de adelante', `(${f2(dx.corto.m.dmin, 1)} m)`);
  ok(dx.tarde.m.sat > 1.0 && dx.tarde.m.sat > dx.nervioso.m.sat * 3, '«tarde»: llega al tope de confort durante más de 1 s', `(${f2(dx.tarde.m.sat)} s)`);
  ok(dx.nervioso.m.osc > 1.0 && dx.nervioso.m.sat < 0.5, '«nervioso»: sigue oscilando al final y no toca el tope', `(vaivén ${f2(dx.nervioso.m.osc)} m)`);
  ok(dx.lejos.c.lejos === false && dx.lejos.c.d && dx.lejos.c.conf && dx.lejos.c.cad, '«lejos»: sólo falla por quedarse lejos; es seguro y estable', JSON.stringify(dx.lejos.c));
  ok(dx.corto.c.cad === false, '«corto»: la cadena amplifica');
  // la respuesta del cálculo a mano
  for (const c of CASOS_1) { const r = F.distMano(c.kmh, c.h); cerca(r.d, D0 + c.h * c.kmh / 3.6, 1e-14, `cálculo a mano ${c.kmh} km/h, h = ${c.h} s: ${f2(r.d, 1)} m`); }
  ok(new Set(CASOS_1.map((c) => c.kmh + '|' + c.h)).size === CASOS_1.length && CASOS_1.length >= 6, 'los casos del cálculo a mano son distintos (≥ 6)');
  // el recorrido: cada paso corre y su efecto es el que dice el texto
  for (const p of TOUR_PARES) { const E = F.escPorId(p.esc), r = F.corre(E, p); ok(isFinite(r.m.dmin) && r.m.dmin > 0, `recorrido: (h ${p.h}, P ${p.p}, D ${p.d}) corre sin chocar`, `(dmin ${f2(r.m.dmin, 1)} m)`); }
  const t5 = TOUR_PARES.find((p) => p.h === 0.6), t6 = TOUR_PARES.find((p) => p.d === 0.2);
  ok(t5 && !F.picoCadena(t5.h, t5.p, t5.d, esc.act.tau, esc.act.theta).estable, 'recorrido «Demasiado pegado»: la cadena amplifica');
  ok(t6 && F.corre(esc, t6).m.sat > 1, 'recorrido «El tope de confort»: la orden llega al tope más de 1 s', `(${t6 ? f2(F.corre(esc, t6).m.sat) : '—'} s)`); }

console.log('10 · Métricas');
{ const esc = F.escPorId('autopista'), R = F.corre(esc, PAR_BIEN), m = R.m, C = R.A.c[0];
  let mn = 1e9; for (let k = 0; k <= NPAS; k++) mn = Math.min(mn, C.d[k]); cerca(m.dmin, mn, 1e-14, 'dmin = mínimo de la distancia');
  let am = 0; for (let k = 0; k <= NPAS; k++) am = Math.min(am, C.a[k]); cerca(m.frenaMax, -am, 1e-14, 'frenada máxima = −mín(a)');
  ok(m.frenaMax <= -LIM.amin + 1e-9, 'la frenada real no supera el tope de confort'); ok(m.tDmin > esc.tramos[0].t && m.tDmin < 25, 'el mínimo ocurre después de que el de adelante empieza a frenar', `(t = ${f2(m.tDmin, 1)} s)`);
  const choca = F.corre(esc, { h: 0.5, p: 0.03, d: 0.2 }); ok(choca.m.choca && choca.m.dmin < 0, 'un ajuste malo CHOCA (dmin < 0)', `(${f2(choca.m.dmin, 1)} m)`); }

console.log(`\n${n - malas}/${n} comprobaciones` + (malas ? `  ·  ${malas} FALLOS` : '  ·  todas correctas'));
if (malas) { for (const f of fallos) console.log('  ✗', f); process.exit(1); }
