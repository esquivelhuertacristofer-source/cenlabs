// Verificación de la física de «Control vectorial (FOC) del motor de tracción: de tres corrientes a dos números» (mecanica-155).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas (respuesta de primer orden, par por coenergía, MTPA por barrido de ángulo, velocidad base), con la conservación de la
// energía (P_entrada = pérdidas en el cobre + d(energía magnética)/dt + par·ω), con la invarianza de la potencia de Clarke/Park y con el
// diseño del reto (ventana interior, nada se cumple «de fábrica», cada falla del diagnóstico se distingue de las demás).
// uso: node scripts/auditoria/verifica-control-vectorial-foc-motor.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/control-vectorial-foc-motor.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAIZ3,clamp,suave,MOT,VMAX,TS,SUB,TFIN,TSTEP,NP,KSTEP,FRAC_T0,clarke,iclarke,park,ipark,abcDeDq,dqDeAbc,omegaE,par,vReg,derivs,rk4,mtpaId,mtpaPunto,mtpaParaPar,corrienteCaracteristica,consignas,simula,metricas,centroTension,elipseTension,isoPar,parMaximo,velocidadBase,ESCENARIOS,escPorId,RETO,referenciaCobre,cumple,cumpleTodo,corre,par1};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_1 = evalBloque('const CASOS_1=', '];\n');
const QUIZ = evalBloque('const QUIZ=', '];\n');
const { MOT, VMAX, DOSPI } = F;

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const sinNaN = (a) => { for (const x of a) if (!Number.isFinite(x)) return false; return true; };

console.log('1 · Clarke y Park');
{ // una flecha (id, iq) fija en el rotor da tres corrientes que giran; vistas desde el rotor vuelven a ser (id, iq) constantes
  const id0 = 250 * Math.cos(0.9), iq0 = 250 * Math.sin(0.9), we = 1700, tiempos = [0, 0.0007, 0.0031, 0.0124, 0.02];
  for (const t of tiempos) {
    const th = we * t, r = F.abcDeDq(id0, iq0, th), d = F.dqDeAbc(r.a, r.b, r.c, th);
    absc(d.d, id0, 1e-9, `abc→dq: id constante a t=${t}`); absc(d.q, iq0, 1e-9, `abc→dq: iq constante a t=${t}`);
    absc(r.a + r.b + r.c, 0, 1e-9, 'la suma de las tres corrientes es cero (sin homopolar)');
    cerca(Math.max(Math.abs(r.a), Math.abs(r.b), Math.abs(r.c)) >= 250 * Math.sqrt(3) / 2 - 1e-9 ? 1 : 0, 1, 1e-12, 'el pico de las tres fases no baja de √3/2 de la amplitud');
  }
  // ida y vuelta con cualquier terna de suma cero
  for (const [a, b] of [[100, -40], [-210, 130], [0, 77], [301, -150]]) {
    const c = -a - b, cl = F.clarke(a, b, c), r = F.iclarke(cl.al, cl.be); absc(r.a, a, 1e-9, 'Clarke inversa: a'); absc(r.b, b, 1e-9, 'Clarke inversa: b'); absc(r.c, c, 1e-9, 'Clarke inversa: c');
    const pk = F.park(cl.al, cl.be, 1.234), ip = F.ipark(pk.d, pk.q, 1.234); absc(ip.al, cl.al, 1e-9, 'Park inversa: α'); absc(ip.be, cl.be, 1e-9, 'Park inversa: β');
  }
  // la amplitud de la flecha αβ es la amplitud de las fases (transformada de amplitud invariante)
  { const I = 180, r = F.abcDeDq(I, 0, 0.77), cl = F.clarke(r.a, r.b, r.c); cerca(Math.hypot(cl.al, cl.be), I, 1e-12, 'el módulo de la flecha αβ es la amplitud de fase'); }
  // la sombra de la flecha sobre cada eje de fase es la corriente de esa fase (lo que dibuja el visor): i_k = |i|·cos(θ + δ − 2πk/3)
  { const id = -120, iq = 210, th = 2.2, r = F.abcDeDq(id, iq, th), I = Math.hypot(id, iq), dl = Math.atan2(iq, id);
    for (let k = 0; k < 3; k++) cerca([r.a, r.b, r.c][k], I * Math.cos(th + dl - k * DOSPI / 3), 1e-9, `la sombra sobre el eje de la fase ${'abc'[k]} es su corriente`); }
  // invarianza de la potencia: va·ia + vb·ib + vc·ic = 3/2·(vd·id + vq·iq)
  for (const [id, iq, vd, vq, th] of [[-100, 200, -50, 120, 0.4], [-30, 90, 12, -70, 2.9], [0, 300, 170, 33, 5.1]]) {
    const i = F.abcDeDq(id, iq, th), v = F.abcDeDq(vd, vq, th); cerca(v.a * i.a + v.b * i.b + v.c * i.c, 1.5 * (vd * id + vq * iq), 1e-12, 'potencia: abc = 3/2·(dq)');
  }
}

console.log('2 · Par: coenergía, reluctancia y MTPA');
{
  for (const [id, iq] of [[0, 100], [-80, 200], [-150, 250], [-30, 40]]) {
    const ld = MOT.Ld * id + MOT.psi, lq = MOT.Lq * iq;
    cerca(F.par(id, iq), 1.5 * MOT.p * (ld * iq - lq * id), 1e-12, `T = 3/2·p·(λd·iq − λq·id) con id=${id}, iq=${iq}`);
    cerca(F.par(id, iq), 1.5 * MOT.p * MOT.psi * iq + 1.5 * MOT.p * (MOT.Ld - MOT.Lq) * id * iq, 1e-12, 'par = parte de imanes + parte de reluctancia');
  }
  ok(F.par(-100, 200) > F.par(0, 200), 'con Lq > Ld, una id negativa SUMA par (reluctancia)');
  { const M2 = { ...MOT, Lq: MOT.Ld }; cerca(F.par(-100, 200, M2), F.par(0, 200, M2), 1e-12, 'con Ld = Lq no hay par de reluctancia'); }
  // MTPA: para cada |i| el ángulo de la fórmula cerrada es el que maximiza el par (barrido fino del ángulo)
  for (const Is of [40, 120, 230, 350]) {
    const p = F.mtpaPunto(Is); cerca(Math.hypot(p.id, p.iq), Is, 1e-12, `el punto MTPA tiene módulo ${Is}`);
    let mejor = -1e9, ang = 0; for (let a = Math.PI / 2; a <= Math.PI; a += 1e-5) { const T = F.par(Is * Math.cos(a), Is * Math.sin(a)); if (T > mejor) { mejor = T; ang = a; } }
    cerca(F.par(p.id, p.iq), mejor, 1e-9, `MTPA: par máximo a |i| = ${Is} A (barrido de ángulo)`); absc(Math.atan2(p.iq, p.id), ang, 2e-5, 'el ángulo de la fórmula cerrada es el del barrido');
    ok(F.par(p.id, p.iq) >= F.par(0, Is) - 1e-9, 'MTPA no da menos par que id = 0 con la misma corriente');
  }
  // mtpaParaPar: el par del punto devuelto es el pedido
  for (const T of [20, 90, 150, 220, 260]) { const p = F.mtpaParaPar(T); cerca(F.par(p.id, p.iq), T, 1e-9, `mtpaParaPar(${T}) da ese par`); }
  { const ps = [40, 100, 160, 220].map((T) => F.mtpaParaPar(T).Is); ok(ps.every((v, i) => i === 0 || v > ps[i - 1]), 'la corriente MTPA crece con el par pedido'); }
  // sobre la curva de par constante, el MTPA es el punto de menor corriente (barrido de id)
  for (const T of [80, 150, 230]) { const p = F.mtpaParaPar(T); let mn = 1e9; for (const [d, q] of F.isoPar(T, -420, 0, 8400)) mn = Math.min(mn, Math.hypot(d, q)); cerca(p.Is, mn, 2e-4, `MTPA = punto de mínima corriente sobre la curva de ${T} N·m`); }
  cerca(F.corrienteCaracteristica(), MOT.psi / MOT.Ld, 1e-15, 'corriente característica ψm/Ld');
}

console.log('3 · La planta en ejes dq: respuesta exacta, régimen y energía');
{
  // ωe = 0 (desacoplado): did/dt = (v − R·id)/Ld → id(t) = (v/R)(1 − e^(−R t/Ld)); un paso de RK4 muy fino lo reproduce
  { const v = 30, we = 0; let s = [0, 0]; const dt = 2e-7; for (let i = 0; i < 20000; i++) s = F.rk4(s, [v, 0], we, dt);
    const t = 20000 * dt; cerca(s[0], (v / MOT.R) * (1 - Math.exp(-MOT.R * t / MOT.Ld)), 1e-9, 'escalón de tensión en d: primera exponencial exacta'); absc(s[1], 0, 1e-12, 'sin acople no aparece iq'); }
  { const v = 30, we = 0; let s = [0, 0]; const dt = 2e-7; for (let i = 0; i < 20000; i++) s = F.rk4(s, [0, v], we, dt);
    const t = 20000 * dt; cerca(s[1], (v / MOT.R) * (1 - Math.exp(-MOT.R * t / MOT.Lq)), 1e-9, 'escalón de tensión en q: primera exponencial exacta'); }
  // en régimen: con v = vReg(id, iq), las derivadas son cero
  for (const [id, iq, n] of [[-100, 200, 3000], [-30, 90, 1000], [0, 250, 4500]]) { const we = F.omegaE(n), v = F.vReg(id, iq, we), d = F.derivs([id, iq], [v.vd, v.vq], we); absc(d[0], 0, 1e-6, `régimen: did/dt = 0 (${n} rpm)`); absc(d[1], 0, 1e-6, `régimen: diq/dt = 0 (${n} rpm)`); }
  // y converge a él desde cero con ese voltaje constante
  { const id = -100, iq = 200, we = F.omegaE(3000), v = F.vReg(id, iq, we); let s = [0, 0]; for (let i = 0; i < 250000; i++) s = F.rk4(s, [v.vd, v.vq], we, 2e-6);
    absc(s[0], id, 1e-3, 'converge al régimen: id'); absc(s[1], iq, 1e-3, 'converge al régimen: iq'); }
  // balance de energía: ∫P_entrada dt = ∫P_cobre dt + ΔW_mag + ∫par·ωm dt, con W_mag = 3/4·(Ld·id² + Lq·iq²) (amplitud invariante)
  { const we = F.omegaE(3200), wm = we / MOT.p, dt = 2e-7, N = 60000; let s = [-20, 60], Ein = 0, Ecu = 0, Emec = 0;
    const W = (x) => 0.75 * (MOT.Ld * x[0] * x[0] + MOT.Lq * x[1] * x[1]), W0 = W(s);
    const pot = (x, v) => ({ pin: 1.5 * (v[0] * x[0] + v[1] * x[1]), pcu: 1.5 * MOT.R * (x[0] * x[0] + x[1] * x[1]), pm: F.par(x[0], x[1]) * wm });
    for (let i = 0; i < N; i++) { const t = i * dt, v = [-60 + 40 * Math.sin(2000 * t), 150 + 30 * Math.cos(1500 * t)];
      const a = pot(s, v);
      const s2 = F.rk4(s, v, we, dt), b = pot(s2, v);
      Ein += (a.pin + b.pin) / 2 * dt; Ecu += (a.pcu + b.pcu) / 2 * dt; Emec += (a.pm + b.pm) / 2 * dt; s = s2; }
    const dW = W(s) - W0; absc(Ein - Ecu - dW - Emec, 0, 2e-3 * Math.abs(Ein), 'energía: entrada = cobre + Δ(energía magnética) + trabajo mecánico'); }
  // el trabajo mecánico en régimen es la potencia de entrada menos el cobre
  { const id = -100, iq = 200, we = F.omegaE(3000), v = F.vReg(id, iq, we); cerca(1.5 * (v.vd * id + v.vq * iq) - 1.5 * MOT.R * (id * id + iq * iq), F.par(id, iq) * we / MOT.p, 1e-12, 'régimen: P_entrada − P_cobre = par·ωm'); }
}

console.log('4 · El círculo de tensión, la elipse y la velocidad base');
{
  cerca(VMAX, MOT.Vdc / Math.sqrt(3), 1e-15, 'Vmax = Vdc/√3 (modulación vectorial lineal)');
  for (const n of [1500, 3000, 4500]) {
    const we = F.omegaE(n), E = F.elipseTension(we, VMAX, 120), c = F.centroTension(we);
    ok(E.every(([d, q]) => Math.abs(F.vReg(d, q, we).v - VMAX) < 1e-6), `${n} rpm: todos los puntos de la elipse tienen |v| = Vmax`);
    // el centro es el mínimo de |v|: el gradiente es cero y cualquier vecino es peor
    const v0 = F.vReg(c.id, c.iq, we).v; ok([[1, 0], [-1, 0], [0, 1], [0, -1]].every(([a, b]) => F.vReg(c.id + a, c.iq + b, we).v > v0), `${n} rpm: el centro de la elipse es el mínimo de la tensión`);
    // sin resistencia, el centro es (−ψm/Ld, 0)
    const sinR = F.centroTension(we, { ...MOT, R: 0 }); cerca(sinR.id, -MOT.psi / MOT.Ld, 1e-9, 'con R = 0 el centro es −ψm/Ld'); absc(sinR.iq, 0, 1e-9, 'con R = 0 el centro está en iq = 0');
  }
  // velocidad base: |v| = Vmax justo ahí, y más allá se pasa
  for (const [id, iq] of [[-113, 200], [-60, 150], [-140, 235]]) {
    const nb = F.velocidadBase(id, iq), we = F.omegaE(nb); cerca(F.vReg(id, iq, we).v, VMAX, 1e-9, `velocidad base de (${id}, ${iq}): |v| = Vmax`);
    ok(F.vReg(id, iq, F.omegaE(nb * 1.01)).v > VMAX && F.vReg(id, iq, F.omegaE(nb * 0.99)).v < VMAX, 'por encima de la velocidad base la tensión se acaba');
  }
  // los imanes inducen ωe·ψm: con corriente cero la tensión es esa
  { const we = F.omegaE(4000); cerca(F.vReg(0, 0, we).v, we * MOT.psi, 1e-12, 'a corriente cero la tensión es la fuerza contraelectromotriz ωe·ψm'); }
}

console.log('5 · Estrategias de consigna');
{
  for (const T of [60, 150, 220]) {
    const c0 = F.consignas('cero', T, 2000, 0.9); absc(c0.id, 0, 0, 'id = 0'); if (!c0.limita) cerca(F.par(c0.id, c0.iq), T, 1e-9, `«sólo iq» da exactamente ${T} N·m`);
    const cm = F.consignas('mtpa', T, 2000, 0.9); cerca(F.par(cm.id, cm.iq), T, 1e-9, `MTPA da exactamente ${T} N·m`); ok(cm.I <= c0.I + 1e-9 || c0.limita, 'MTPA usa menos corriente que id = 0');
  }
  // id = 0 no llega a 190 N·m con la corriente máxima; MTPA sí
  { const c = F.consignas('cero', 190, 2600, 0.9); ok(c.limita && F.par(c.id, c.iq) < 190, 'con id = 0 el par de 190 N·m choca con Imax'); const m = F.consignas('mtpa', 190, 2600, 0.9); ok(!m.limita && m.cabe, 'MTPA da 190 N·m a 2 600 rpm sin chocar con Imax ni con la tensión'); }
  // debilitamiento: donde MTPA no cabe en tensión, la consigna fw sí, con el par exacto y la menor |id| que cabe
  for (const [T, nn, k] of [[150, 4000, 0.9], [110, 4400, 0.9], [150, 4000, 0.93], [120, 4200, 0.85]]) {
    const we = F.omegaE(nn), m = F.consignas('mtpa', T, nn, k), w = F.consignas('fw', T, nn, k);
    ok(F.vReg(m.id, m.iq, we).v > k * VMAX, `${T} N·m a ${nn} rpm: MTPA no cabe en k = ${k}`);
    ok(F.vReg(w.id, w.iq, we).v <= k * VMAX + 1e-9, 'fw: la tensión cabe en la reserva pedida'); cerca(F.par(w.id, w.iq), T, 1e-9, 'fw: el par es el pedido'); ok(w.I <= MOT.Imax + 1e-9, 'fw: respeta la corriente máxima');
    ok(w.id < m.id, 'fw: id más negativa que la de MTPA');
    // mínima |id|: moverse 1 A hacia id menos negativa sobre la curva de par constante ya no cabe en tensión
    const den = 1.5 * MOT.p * (MOT.psi + (MOT.Ld - MOT.Lq) * (w.id + 0.5)), q2 = T / den; ok(F.vReg(w.id + 0.5, q2, we).v > k * VMAX - 1e-6 || w.id + 0.5 > m.id, 'fw: es la |id| mínima que cabe (barrido de 0,25 A)');
  }
  // donde MTPA ya cabe, fw = MTPA
  { const m = F.consignas('mtpa', 190, 2600, 0.9), w = F.consignas('fw', 190, 2600, 0.9); absc(w.id, m.id, 1e-12, 'a baja velocidad debilitar el campo no hace falta: fw = MTPA'); }
  // la corriente nunca pasa de Imax, aunque se pida un par imposible
  for (const est of ['cero', 'mtpa', 'fw']) for (const [T, nn] of [[400, 1000], [300, 4800], [260, 5000]]) { const c = F.consignas(est, T, nn, 0.9); ok(c.I <= MOT.Imax + 1e-9, `${est}: |i| ≤ Imax aun pidiendo ${T} N·m a ${nn} rpm`); }
  // par máximo a la velocidad n con k: crece con la reserva y baja con la velocidad
  { const a = F.parMaximo(3000, 1), b = F.parMaximo(4000, 1), c = F.parMaximo(5000, 1); ok(a > b && b > c, 'el par máximo baja con la velocidad (debilitamiento)'); ok(F.parMaximo(4000, 0.8) < F.parMaximo(4000, 1), 'menos reserva de tensión, menos par máximo');
    const T = 0.97 * F.parMaximo(4400, 1), w = F.consignas('fw', T, 4400, 1); ok(w.cabe && !w.limita, 'justo por debajo del par máximo, fw encuentra un punto factible'); const T2 = 1.05 * F.parMaximo(4400, 1), w2 = F.consignas('fw', T2, 4400, 1); ok(!w2.cabe || w2.limita, 'por encima del par máximo no hay punto factible'); }
}

console.log('6 · El lazo de corriente');
{
  // sin velocidad (sin acople) el lazo es lineal y su recursión discreta tiene solución EXACTA: el cálculo del paso k se aplica en el k+1;
  // la planta de cada eje es i[k+1] = a·i[k] + b·v[k] con a = e^(−R·Ts/L), b = (1 − a)/R; el PI actualiza el integrador con el error NUEVO
  for (const f of [40, 80, 120, 150]) {
    const S = F.simula({ n: 0, T1: 150, f, zr: 1, est: 'cero', desac: true }), al = DOSPI * f, L = MOT.Lq, a = Math.exp(-MOT.R * F.TS / L), b = (1 - a) / MOT.R, kp = al * L, ki = al * MOT.R;
    let i = S.r0.iq, I = MOT.R * i, v = MOT.R * i, eMax = 0;      // en régimen: el integrador lleva R·i (con desacople y ωe = 0)
    for (let k = 0; k <= F.NP; k++) {
      eMax = Math.max(eMax, Math.abs(S.iq[k] - i));
      const r = k >= F.KSTEP ? S.r1.iq : S.r0.iq, e = r - i; I += ki * F.TS * e; const u = kp * e + I;
      i = a * i + b * v; v = u; }
    ok(eMax < 1e-6, `f = ${f} Hz, sin acople: el lazo de iq reproduce la recursión discreta exacta`, `(error máx. ${eMax.toExponential(2)} A)`);
    absc(S.id[F.NP], 0, 1e-6, 'sin velocidad id se queda en 0'); absc(S.iq[F.NP], S.r1.iq, 0.005 * (S.r1.iq - S.r0.iq) + 1e-6, `f = ${f} Hz: iq llega a su consigna (la exponencial e^(−α·t) ya cayó)`);
  }
  // y a baja rapidez se parece a la exponencial continua 1 − e^(−α·t), como pide la teoría (kp = α·L y ki = α·R cancelan el polo)
  { const S = F.simula({ n: 0, T1: 150, f: 40, zr: 1, est: 'cero', desac: true }), al = DOSPI * 40, i0 = S.r0.iq, i1 = S.r1.iq; let eMax = 0;
    for (let k = F.KSTEP + 3; k <= F.NP; k++) { const t = (k - F.KSTEP) * F.TS - 0.5 * F.TS, ideal = i0 + (i1 - i0) * (1 - Math.exp(-al * t)); eMax = Math.max(eMax, Math.abs(S.iq[k] - ideal)); }
    ok(eMax < 0.02 * (i1 - i0), 'f = 40 Hz: iq sigue la exponencial de primer orden con un error < 2 % del escalón', `(error máx. ${eMax.toFixed(2)} A de ${(i1 - i0).toFixed(0)} A)`); }
  // el tiempo de asentamiento a ±5 % del par pedido se parece al de primer orden: ln(Δ/(0,05·T))/α (el retardo y la discretización lo mueven ≲ 12 %)
  for (const f of [60, 100]) { const S = F.simula({ n: 0, T1: 150, f, zr: 1, est: 'cero', desac: true }), teo = Math.log((S.T1 - S.T0) / (0.05 * S.T1)) / (DOSPI * f); cerca(S.met.asenta, teo, 0.12, `f = ${f} Hz: asentamiento ≈ ln(Δ/0,05·T)/α`); }
  // la tensión nunca pasa del círculo
  for (const e of F.ESCENARIOS) for (const f of [60, 300, 1200]) for (const est of ['cero', 'mtpa', 'fw']) { const S = F.simula({ n: e.n, T1: e.T1, f, zr: 1, est, k: 0.9, desac: true }); let mx = 0; for (let k = 0; k <= F.NP; k++) mx = Math.max(mx, Math.hypot(S.vd[k], S.vq[k])); ok(mx <= VMAX * (1 + 1e-9), `${e.id}, ${f} Hz, ${est}: |v| ≤ Vmax siempre`); ok(sinNaN(S.T) && sinNaN(S.id) && sinNaN(S.iq), 'sin NaN'); }
  // tope de tensión: si la consigna no cabe, la corriente se queda corta, el integrador no se dispara (anti-windup) y nada diverge
  { const S = F.simula({ n: 4000, T1: 150, f: 130, zr: 1, est: 'mtpa', k: 0.9, desac: true }); ok(S.met.errPar > 0.2, 'sin cabida de tensión el par se queda muy corto'); ok(S.met.vUso > 0.99, 'y la tensión está en el tope'); let mx = 0; for (let k = 0; k <= F.NP; k++) mx = Math.max(mx, Math.hypot(S.id[k], S.iq[k])); ok(mx <= 1.02 * Math.hypot(S.r1.id, S.r1.iq), 'sin windup: la corriente no se pasa de la consigna'); }
  // el desacople separa los ejes: con él, id sigue su respuesta ideal; sin él, se aparta mucho
  { const a = F.simula({ n: 2600, T1: 190, f: 130, zr: 1, est: 'mtpa', desac: true }).met, b = F.simula({ n: 2600, T1: 190, f: 130, zr: 1, est: 'mtpa', desac: false }).met;
    ok(b.interf > 8 * a.interf, 'sin desacople, id se aparta ≥ 8 veces más de su respuesta ideal', `(${a.interf.toFixed(1)} A contra ${b.interf.toFixed(1)} A)`); ok(a.errPar < 0.03 && b.errPar > 0.2, 'con desacople el par llega; sin él, en 24 ms no'); }
  // zr: la parte integral >1 produce sobreimpulso; = 1 no
  { const a = F.simula({ n: 2600, T1: 190, f: 150, zr: 1, est: 'mtpa' }).met, b = F.simula({ n: 2600, T1: 190, f: 150, zr: 8, est: 'mtpa' }).met; ok(b.os > 0.12 && a.os < 0.03, 'parte integral ×8 da sobreimpulso; ×1 casi nada', `(${(a.os * 100).toFixed(1)} % y ${(b.os * 100).toFixed(1)} %)`); }
  // determinismo
  { const a = F.simula({ n: 3000, T1: 120, f: 200, zr: 1, est: 'fw', k: 0.9 }), b = F.simula({ n: 3000, T1: 120, f: 200, zr: 1, est: 'fw', k: 0.9 }); ok(a.T.every((v, i) => v === b.T[i]), 'la simulación es determinista'); }
}

console.log('7 · El reto: ventana interior y nada de fábrica');
{
  const fs = Array.from({ length: 41 }, (_, i) => 30 * Math.pow(50, i / 40)), zrs = [0.25, 0.5, 1, 2, 4, 8], ks = [0.6, 0.7, 0.8, 0.85, 0.9, 0.93, 0.96, 1.0], ests = ['cero', 'mtpa', 'fw'];
  for (const e of F.ESCENARIOS) {
    // valores iniciales del lab (f = 40 Hz, ×1, «sólo iq», 90 %) no cumplen
    ok(!F.corre(e, { f: 40, zr: 1, est: 'cero', k: 0.9 }).ok, `${e.id}: el ajuste inicial no cumple`);
    // «sólo iq» no lo cumple con ninguna rapidez ni parte integral; tampoco «mínima corriente» si la tensión no cabe
    let nCero = 0, nMtpa = 0, nFw = 0, tot = 0, nTodas = 0; const okFw = [];
    for (const est of ests) for (const k of (est === 'fw' ? ks : [0.9])) for (const zr of zrs) for (const f of fs) { tot++; const r = F.corre(e, { f, zr, est, k }); if (r.ok) { nTodas++; if (est === 'cero') nCero++; else if (est === 'mtpa') nMtpa++; else { nFw++; okFw.push({ f, zr, k }); } } }
    ok(nCero === 0, `${e.id}: ninguna rapidez ni parte integral cumple con «sólo iq»`, `(${nCero})`);
    if (e.id === 'ciudad') ok(nMtpa > 0 && nFw > 0, 'ciudad: a baja velocidad basta MTPA (y fw = MTPA)'); else ok(nMtpa === 0 && nFw > 0, `${e.id}: MTPA no cabe en tensión; sólo debilitar el campo cumple`, `(mtpa ${nMtpa}, fw ${nFw})`);
    // ventana interior en cada eje: los extremos fallan y hay un interior que cumple
    const bueno = okFw[Math.floor(okFw.length / 2)]; ok(!!bueno, `${e.id}: hay combinaciones que cumplen`);
    const fOk = fs.filter((f) => F.corre(e, { f, zr: bueno.zr, est: 'fw', k: bueno.k }).ok); ok(fOk.length >= 2 && fOk[0] > fs[0] * 1.5 && fOk[fOk.length - 1] < fs[fs.length - 1] / 1.5, `${e.id}: la ventana de f es interior (de ${fOk[0].toFixed(0)} a ${fOk[fOk.length - 1].toFixed(0)} Hz)`);
    ok(!F.corre(e, { f: fs[0], zr: bueno.zr, est: 'fw', k: bueno.k }).ok && !F.corre(e, { f: fs[fs.length - 1], zr: bueno.zr, est: 'fw', k: bueno.k }).ok, `${e.id}: los dos extremos de f fallan`);
    const zOk = zrs.filter((z) => F.corre(e, { f: bueno.f, zr: z, est: 'fw', k: bueno.k }).ok); ok(zOk.length >= 1 && !zOk.includes(8), `${e.id}: la parte integral ×8 falla`, `(cumplen ${zOk.join(', ')})`);
    if (e.id !== 'ciudad') { const kOk = ks.filter((k) => F.corre(e, { f: bueno.f, zr: bueno.zr, est: 'fw', k }).ok); ok(kOk.length >= 2 && kOk[0] > ks[0] && kOk[kOk.length - 1] < ks[ks.length - 1], `${e.id}: la ventana de la reserva de tensión es interior (de ${kOk[0]} a ${kOk[kOk.length - 1]})`); }
    console.log(`     ${e.id}: ${nTodas} de ${tot} combinaciones de la rejilla cumplen (${(100 * nTodas / tot).toFixed(1)} %)`);
    ok(nTodas / tot < (e.id === 'ciudad' ? 0.25 : 0.05), `${e.id}: la rejilla está lejos de cumplirse por azar`);
  }
  // reto 1: el par a mano
  { const tol = 0.8; ok(CASOS_1.length >= 6 && new Set(CASOS_1.map((c) => c.id + ',' + c.iq)).size === CASOS_1.length, 'hay ≥ 6 casos distintos para la fase 1');
    for (const c of CASOS_1) { const T = F.par1(c.id, c.iq), sinReluc = 1.5 * MOT.p * MOT.psi * c.iq, restaReluc = 1.5 * MOT.p * (MOT.psi * c.iq - (MOT.Ld - MOT.Lq) * c.id * c.iq), sin32 = MOT.p * (MOT.psi * c.iq + (MOT.Ld - MOT.Lq) * c.id * c.iq);
      cerca(T, 1.5 * MOT.p * MOT.psi * c.iq + 1.5 * MOT.p * (MOT.Ld - MOT.Lq) * c.id * c.iq, 1e-12, `fase 1 (${c.id}, ${c.iq}): par = imanes + reluctancia`);
      ok(Math.abs(sin32 - T) > tol, `(${c.id}, ${c.iq}): olvidar el 3/2 se distingue`); if (c.id !== 0) { ok(Math.abs(sinReluc - T) > tol, `(${c.id}, ${c.iq}): olvidar la reluctancia se distingue`); ok(Math.abs(restaReluc - T) > tol, `(${c.id}, ${c.iq}): restar la reluctancia se distingue`); } } }
  // diagnóstico: cada falla deja un síntoma propio
  { const clasifica = (m) => { if (m.errPar > F.RETO.par && m.vUso > 0.97) return 'tension'; if (m.errPar > F.RETO.par && m.interf > 100) return 'acople'; if (m.os > F.RETO.os && m.asenta > F.RETO.asenta) return 'integral'; if (m.asenta > F.RETO.asenta && m.os <= F.RETO.os && m.errPar <= F.RETO.par) return 'lento'; return '?'; };
    ok(CASOS_DX.length === 4 && new Set(CASOS_DX.map((c) => c.id)).size === 4, 'cuatro fallas distintas');
    for (const c of CASOS_DX) { const S = F.simula({ n: c.n, T1: c.T1, f: c.f, zr: c.zr, est: c.est, k: c.k, desac: c.desac }), m = S.met; ok(clasifica(m) === c.id, `«${c.id}» se reconoce por sus síntomas`, `(${clasifica(m)}: par ${(m.errPar * 100).toFixed(1)} %, sobreimpulso ${(m.os * 100).toFixed(1)} %, asenta ${(m.asenta * 1000).toFixed(1)} ms, vUso ${m.vUso.toFixed(2)}, interf ${m.interf.toFixed(0)})`);
      ok(!F.cumpleTodo(m, { id: 'x', n: c.n, T1: c.T1 }), `«${c.id}» no cumple el reto`); } }
  // el quiz: la correcta no cae casi siempre en el mismo sitio (el HTML baraja con Fisher–Yates)
  { const barajar = (a, rnd) => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(rnd() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
    ok(html.includes('const j=Math.floor(Math.random()*(i+1)); [b[i],b[j]]=[b[j],b[i]]'), 'el quiz se baraja con Fisher–Yates');
    let sem = 12345; const rnd = () => { sem = (sem * 1664525 + 1013904223) % 4294967296; return sem / 4294967296; };
    for (const Q of QUIZ) { const cuenta = [0, 0, 0, 0]; for (let i = 0; i < 4000; i++) cuenta[barajar([Q.ok, ...Q.mal], rnd).indexOf(Q.ok)]++; ok(cuenta.every((c) => c > 800 && c < 1200), `quiz: la correcta cae en las cuatro posiciones por igual`, JSON.stringify(cuenta)); ok(Q.mal.length === 3 && !Q.mal.includes(Q.ok), 'tres distractores distintos de la correcta'); } }
}

console.log(`\n${n - malas}/${n} comprobaciones correctas${malas ? ' · FALLAN ' + malas : ''}`);
if (malas) { for (const f of fallos) console.log(' -', f); process.exit(1); }
