// Verificación de la física de «Ciclo Atkinson/Miller del motor híbrido: comprimir menos, expandir más» (mecanica-159).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas (Otto: η = 1 − r^(1−γ); límite de combustión instantánea; primera ley), con integrales numéricas independientes de ∮p dV,
// con la conservación del par entre el motor térmico y el eléctrico, con la monotonía de la detonación y con el diseño del reto
// (ventana interior, nada se cumple «de fábrica», cada diagnóstico se distingue por sus síntomas).
// uso: node scripts/auditoria/verifica-ciclo-atkinson-miller-hibrido.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/ciclo-atkinson-miller-hibrido.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAD,clamp,MOT,A_P,A_M,VD,VD_TOT,X_PMS,R_GAS,GAMMA,CV,T_ADM,AFR,LHV,XI,xiDe,qAire,P_ESC,P_PLENA,ENC,DUR,IVO,EVO,EVC,L_VALV,IVC_REF,R_REF,IVC_MIN,IVC_MAX,R_MIN,R_MAX,LIM,S_EQ,ETA_MG,RETO,ESCENARIOS,escPorId,posBulon,vc,volumen,dVdth,vIVC,rEfec,xQuem,dxQuem,nucleo,etaIdeal,tauMs,detona,motor,parPleno,pmPara,hibrido,referencia,criterios,cumpleTodo,rangoPhi,barridoPhi,CASOS_DX,sintomas,traza,cerrado,elevacion,carrera,mapaMotor,fmep,ciclosPorSeg,NTR,PASO_TR};`)();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const simpson = (f, a, b, N) => { const h = (b - a) / N; let s = f(a) + f(b); for (let i = 1; i < N; i++) s += f(a + i * h) * (i % 2 ? 4 : 2); return s * h / 3; };

console.log('1 · Geometría biela-manivela');
{ cerca(F.VD, Math.PI / 4 * 0.0805 ** 2 * 0.0883, 1e-14, 'VD = π/4·B²·S'); cerca(F.VD * 1e6, 449.4, 1e-3, 'cada cilindro tiene 449 cm³'); cerca(F.VD_TOT * 1e3, 1.7976, 1e-3, 'el motor tiene 1,80 L');
  for (const r of [9, 10.5, 13, 17]) { cerca(F.volumen(r, 0), F.VD / (r - 1), 1e-13, `V(PMS) = Vd/(r−1), r=${r}`); cerca(F.volumen(r, 180), F.VD * r / (r - 1), 1e-12, `V(PMI) = Vd·r/(r−1), r=${r}`); cerca(F.volumen(r, 180) / F.volumen(r, 0), r, 1e-12, `V(PMI)/V(PMS) = r, r=${r}`); }
  for (const th of [10, 47, 90, 133, 170]) { cerca(F.volumen(13, th), F.volumen(13, -th), 1e-13, `V(θ) = V(−θ), θ=${th}`); cerca(F.volumen(13, th), F.volumen(13, 360 - th), 1e-13, `V(θ) = V(360−θ), θ=${th}`);
    const h = 1e-4; cerca(F.dVdth(th), (F.volumen(13, th + h) - F.volumen(13, th - h)) / (2 * h), 1e-7, `dV/dθ analítica = derivada numérica, θ=${th}`); }
  cerca(F.posBulon(0) - F.posBulon(180), F.MOT.S, 1e-13, 'la carrera es 2·a'); absc(F.dVdth(0), 0, 1e-15, 'dV/dθ = 0 en el PMS'); absc(F.dVdth(180), 0, 1e-15, 'dV/dθ = 0 en el PMI'); }

console.log('2 · Cierre de la admisión y relación de compresión efectiva');
{ for (const r of [9, 10.5, 13, 17]) { cerca(F.rEfec(r, 0), r, 1e-12, `con cierre en el PMI (Otto de libro) r_c = r, r=${r}`); }
  for (const r of [10.5, 13, 15]) { let prev = 1e9; for (let p = 0; p <= 110; p += 5) { const rc = F.rEfec(r, p); ok(rc < prev + 1e-12 && rc <= r + 1e-12, `r_c baja al retrasar el cierre (r=${r}, φ=${p}°)`, rc.toFixed(3)); prev = rc; } }
  // 90° después del PMI el pistón ha recorrido casi la mitad del volumen: r_c ≈ 1 + (r−1)·(1−cos…)/2
  const r = 13; const h = (1 - 0) ; absc(F.vIVC(r, 90), F.volumen(r, 90), 1e-15, 'V al cerrar a 90° = V(90°) (simetría)');
  ok(F.rEfec(13, 70) > 9.8 && F.rEfec(13, 70) < 10.0, 'el Atkinson típico (r=13, φ=70°) comprime como un Otto de 9,9', F.rEfec(13, 70).toFixed(3)); }

console.log('3 · Wiebe: la fracción quemada');
{ absc(F.xQuem(F.ENC, F.ENC, F.DUR), 0, 1e-15, 'x(inicio) = 0'); absc(F.xQuem(F.ENC + F.DUR, F.ENC, F.DUR), 1, 1e-15, 'x(fin) = 1 (normalizada)');
  let prev = -1, mono = true; for (let t = F.ENC; t <= F.ENC + F.DUR; t += 0.5) { const x = F.xQuem(t, F.ENC, F.DUR); if (x < prev - 1e-15) mono = false; prev = x; } ok(mono, 'x(θ) no decrece');
  cerca(simpson(t => F.dxQuem(t, F.ENC, F.DUR), F.ENC, F.ENC + F.DUR * (1 - 1e-12), 4000), 1, 1e-9, '∫dx/dθ dθ = 1');
  for (const t of [-5, 0, 10, 25]) { const h = 1e-5; cerca(F.dxQuem(t, F.ENC, F.DUR), (F.xQuem(t + h, F.ENC, F.DUR) - F.xQuem(t - h, F.ENC, F.DUR)) / (2 * h), 1e-6, `dx/dθ = derivada numérica, θ=${t}`); } }

console.log('4 · El ciclo cerrado: primera ley, límite ideal y Otto de libro');
{ const G = F.GAMMA;
  // combustión instantánea en el PMS → forma cerrada exacta
  for (const [r, phi] of [[10.5, 0], [10.5, 45], [13, 70], [15, 90], [17, 100], [9, 30]]) {
    const nu = F.nucleo(r, phi, { enc: -0.005, dur: 0.01, paso: 1e-4 });
    cerca(nu.eta_cerr, F.etaIdeal(r, phi), 5e-4, `η del ciclo cerrado con combustión instantánea = 1 − (T4−T1)/(T3−T2), r=${r}, φ=${phi}°`);
    // y el trabajo cerrado coincide con la integral numérica de p dV
  }
  // Otto de libro: cierre en el PMI → η = 1 − r^(1−γ) con la misma cantidad de calor
  for (const r of [9, 10.5, 13, 17]) { const nu = F.nucleo(r, 0, { enc: -0.005, dur: 0.01, paso: 1e-4 }); cerca(nu.eta_cerr, 1 - Math.pow(r, 1 - G), 5e-4, `Otto de libro: η = 1 − r^(1−γ), r=${r}`); }
  // primera ley contra la integral de p dV (Simpson, paso fino) de IVC a EVO
  for (const [r, phi] of [[10.5, 45], [13, 70], [15, 90], [17, 100]]) { const nu = F.nucleo(r, phi);
    const W = simpson(th => F.cerrado(nu, r, th).pr * F.dVdth(th), phi - 180, 180, 288000);   // de φ−180 a 180
    cerca(nu.Wcerr, W, 2e-5, `W_cerrado (primera ley) = ∫p dV (Simpson), r=${r}, φ=${phi}°`, ''); }
  // la combustión finita rinde menos que la ideal
  for (const [r, phi] of [[10.5, 45], [13, 70], [15, 90]]) { const nu = F.nucleo(r, phi); ok(nu.eta_cerr < F.etaIdeal(r, phi) && nu.eta_cerr > F.etaIdeal(r, phi) - 0.06, `la combustión de ${F.DUR}° rinde menos que la instantánea, pero poco`, `${nu.eta_cerr.toFixed(4)} < ${F.etaIdeal(r, phi).toFixed(4)}`); }
  // la presión máxima cae en el intervalo de la combustión y no hay presión negativa
  const nu = F.nucleo(13, 70); ok(nu.thPmax > 0 && nu.thPmax < 25, 'la presión máxima llega después del PMS', nu.thPmax.toFixed(2) + '°');
  // cota de Carnot entre T_max y T_adm
  for (const [r, phi] of [[10.5, 45], [13, 70], [17, 100]]) { const nu2 = F.nucleo(r, phi); ok(nu2.eta_cerr < 1 - F.T_ADM / nu2.Tmax, `η_cerrado < 1 − T1/Tmax (Carnot), r=${r}, φ=${phi}°`, `${nu2.eta_cerr.toFixed(3)} < ${(1 - F.T_ADM / nu2.Tmax).toFixed(3)}`); }
  // más expansión, más rendimiento (con cierre fijo y sin la pérdida de calor)
  let prev = 0; for (const r of [9, 10, 11, 13, 15, 17]) { const e = F.etaIdeal(r, 70); ok(e > prev, `η_ideal crece con la relación de expansión (r=${r})`, e.toFixed(4)); prev = e; }
  // cierre tardío con la misma r_c: más expansión = más rendimiento que un Otto de la misma compresión
  const ra = 13, pa = 70, rc = F.rEfec(ra, pa); const otto = 1 - Math.pow(rc, 1 - G); ok(F.etaIdeal(ra, pa) > otto, 'Atkinson (r_e=13, r_c=9,9) rinde más que un Otto de r=9,9', `${F.etaIdeal(ra, pa).toFixed(4)} > ${otto.toFixed(4)}`); }

console.log('5 · Bombeo, ciclo completo y trabajo neto');
{ for (const [r, phi, pm] of [[10.5, 45, 0.95e5], [13, 70, 0.95e5], [15, 90, 0.95e5], [10.5, 45, 0.6e5], [13, 100, 0.95e5]]) {
    const M = F.motor(r, phi, 2000, pm, 91), T = F.traza(r, phi, pm);
    // ∮p dV sobre la traza completa (720°) con el volumen de la geometría
    let W = 0; for (let i = 0; i < T.p.length - 1; i++) W += 0.5 * (T.p[i] + T.p[i + 1]) * (T.V[i + 1] - T.V[i]);
    cerca(M.Wnet, W, 1e-3, `W_neto analítico = ∮p dV de la traza (720°), r=${r}, φ=${phi}°, p_m=${(pm / 1e5).toFixed(2)} bar`);
    cerca(M.imep, M.Wnet / F.VD, 1e-13, 'IMEP = W/Vd');
    // el bombeo: con el cierre en el PMI es (p_m − p_esc)·Vd
    if (phi === 0) cerca(M.Wbomba, (pm - F.P_ESC) * F.VD, 1e-12, 'bombeo del Otto: (p_m − p_esc)·Vd'); }
  { const M0 = F.motor(10.5, 0, 2000, 0.95e5, 91); cerca(M0.Wbomba, (0.95e5 - F.P_ESC) * F.VD, 1e-12, 'con cierre en el PMI el bombeo es (p_m − p_esc)·Vd'); }
  // la traza es cerrada y continua en V y p donde el modelo es continuo
  const T = F.traza(13, 70, 0.95e5); ok(T.p.every(x => isFinite(x) && x > 0) && T.T.every(x => isFinite(x) && x > 0), 'la traza no tiene NaN ni presiones negativas');
  absc(T.V[0], T.V[T.V.length - 1], 1e-15, 'V(0°) = V(720°)'); ok(Math.abs(T.p[1] - T.p[0]) / T.p[0] < 0.05, 'la presión es continua cerca del PMS');
  // la presión de colector manda la masa: m = p_m·V_cierre/(R·T)
  const M = F.motor(13, 70, 2000, 0.8e5, 91); cerca(M.m, 0.8e5 * F.vIVC(13, 70) / (F.R_GAS * F.T_ADM), 1e-13, 'm = p_m·V_cierre/(R·T)');
  // linealidad del motor en p_m
  const a = F.motor(13, 70, 2000, 0.95e5, 91, true).par, b = F.motor(13, 70, 2000, 0.6e5, 91, true).par, c = F.motor(13, 70, 2000, 0.3e5, 91, true).par;
  cerca((a - b) / 0.35, (b - c) / 0.30, 1e-9, 'el par es lineal en p_m');
  // más cierre tardío = menos par a plena carga
  let prev = 1e9; for (let p = 0; p <= 110; p += 10) { const pl = F.parPleno(13, p, 2000); ok(pl < prev, `el par a plena carga baja al retrasar el cierre (φ=${p}°)`, pl.toFixed(1)); prev = pl; }
  // el par cuesta aprox. lo que cuesta el aire (masa) → cociente de masas
  cerca(F.motor(13, 100, 2000, 0.95e5, 91, true).m / F.motor(13, 45, 2000, 0.95e5, 91, true).m, F.vIVC(13, 100) / F.vIVC(13, 45), 1e-13, 'cociente de masas = cociente de volúmenes al cerrar');
  // la potencia de freno = par·ω y el par se reparte entre los 4 cilindros
  const m2 = F.motor(13, 70, 2400, 0.95e5, 91, true); cerca(m2.pot, m2.par * 2400 * F.DOSPI / 60, 1e-13, 'P = T·ω'); cerca(m2.par, m2.bmep * F.VD_TOT / (4 * Math.PI), 1e-13, 'T = BMEP·Vd_total/4π');
  cerca(m2.bsfc, m2.mdotF / m2.pot * 3.6e9, 1e-13, 'BSFC = ṁ_f/P'); cerca(m2.etaFreno, 3.6e9 / (m2.bsfc * F.LHV), 1e-12, 'η_freno = 3,6·10⁹/(BSFC·PCI)'); }

console.log('6 · Detonación (Livengood–Wu)');
{ const nu = F.nucleo(10.5, 45), ref = F.motor(10.5, 45, 2000, F.P_PLENA, 91);
  ok(ref.K > 0.7 && ref.K < 0.95, 'el motor de referencia a plena carga con 91 octanos está cerca del límite pero no detona (calibración)', ref.K.toFixed(3));
  // monotonía: más compresión efectiva, más detonación; menos octano, más detonación; más lento, más detonación; más carga, más detonación
  let prev = 0; for (const phi of [100, 80, 60, 40, 20, 0]) { const K = F.motor(13, phi, 2000, F.P_PLENA, 91).K; ok(K > prev, `K crece al adelantar el cierre (φ=${phi}°)`, K.toFixed(3)); prev = K; }
  ok(F.motor(13, 45, 2000, F.P_PLENA, 87).K > F.motor(13, 45, 2000, F.P_PLENA, 91).K, '87 octanos detona más que 91'); ok(F.motor(13, 45, 2000, F.P_PLENA, 91).K > F.motor(13, 45, 2000, F.P_PLENA, 98).K, '91 octanos detona más que 98');
  ok(F.motor(13, 45, 1500, F.P_PLENA, 91).K > F.motor(13, 45, 3500, F.P_PLENA, 91).K, 'a bajas rpm hay más tiempo para detonar');
  ok(F.motor(13, 45, 2000, F.P_PLENA, 91).K > F.motor(13, 45, 2000, 0.5 * F.P_PLENA, 91).K, 'con la mariposa cerrada detona menos');
  // la integral escala como p^1.7 con la presión del colector
  cerca(F.motor(13, 45, 2000, 0.95e5, 91).K / F.motor(13, 45, 2000, 0.475e5, 91).K, Math.pow(2, 1.7), 1e-9, 'K ∝ p_m^1,7 (el retardo de autoencendido va como p^−1,7)');
  // el retardo de Douaud–Eyzat en un punto de referencia a mano
  cerca(F.tauMs(101325 * 30, 900, 91), 1.4 * 17.68 * Math.pow(0.91, 3.402) * Math.pow(30, -1.7) * Math.exp(3800 / 900), 1e-12, 'τ(30 atm, 900 K, 91) contra la fórmula');
  // Livengood–Wu por Simpson contra la regla del trapecio de la implementación
  const nu2 = F.nucleo(13, 60); const Ts = 320 * Math.pow(nu2.V1 / nu2.Vs, F.GAMMA - 1); const dtg = 1 / (6 * 2000) * 1000;
  const f = th => { const u = (th - nu2.thS) / nu2.hh, i = Math.min(nu2.n - 1, Math.floor(u)), fr = u - i, pr = nu2.tab[i] * (1 - fr) + nu2.tab[i + 1] * fr; return 1 / F.tauMs(0.95e5 * pr, Ts * Math.pow(pr / nu2.ps, (F.GAMMA - 1) / F.GAMMA), 91); };
  cerca(F.detona(nu2, 0.95e5, 2000, 91), simpson(f, nu2.thS, nu2.thE, 4000) * dtg, 2e-4, 'K (trapecio) = K (Simpson fino)'); }

console.log('7 · El híbrido: el motor eléctrico completa el par');
{ for (const e of F.ESCENARIOS) {
    const ref = F.referencia(e);
    cerca(ref.M.par, e.par, 1e-9, `${e.id}: la referencia estrangula hasta dar exactamente el par pedido`); absc(ref.parMg, 0, 1e-9, `${e.id}: la referencia no usa el eléctrico`); ok(ref.apertura < 0.9 && ref.apertura > 0.5, `${e.id}: la referencia va estrangulada (la mariposa en ${(ref.apertura * 100).toFixed(0)} %)`);
    cerca(ref.bsfcEq, ref.M.bsfc, 1e-12, `${e.id}: sin ayuda el consumo equivalente = el de freno`);
    for (const [r, p] of [[13, 75], [15, 85], [14, 100], [17, 105], [10, 40]]) { const h = F.hibrido(e, r, p);
      cerca(h.M.par + h.parMg, e.par, 1e-9, `${e.id}: par del térmico + par del eléctrico = par pedido (r=${r}, φ=${p}°)`) ;
      if (h.parMg > 1e-6) { ok(h.abierta, `${e.id}: si el eléctrico ayuda, la mariposa va abierta del todo (r=${r}, φ=${p}°)`); cerca(h.M.pm, F.P_PLENA, 1e-12, 'p_m = presión de la mariposa abierta'); }
      cerca(h.bsfcEq, (h.M.mdotF + F.S_EQ * h.potMg / F.LHV) / h.potPedida * 3.6e9, 1e-12, `${e.id}: consumo equivalente = (ṁ_f + S·P_el/PCI)/P`);
      cerca(h.potMg, h.parMg * (e.n * F.DOSPI / 60) / F.ETA_MG, 1e-12, 'P_batería = T_mg·ω/η'); } } }

console.log('8 · Las válvulas');
{ for (const phi of [30, 70, 110]) { const ivc = 540 + phi;
    absc(F.elevacion(F.IVO, phi).adm, 0, 1e-12, `la admisión empieza en 0 (φ=${phi}°)`); absc(F.elevacion(ivc, phi).adm, 0, 1e-9, `la admisión termina en 0 (φ=${phi}°)`); cerca(F.elevacion((F.IVO + ivc) / 2, phi).adm, F.L_VALV, 1e-12, `la alzada máxima es ${F.L_VALV} mm a la mitad (φ=${phi}°)`);
    ok(F.elevacion(ivc + 3, phi).adm === 0 && F.elevacion(ivc - 3, phi).adm > 0, 'por encima del cierre la válvula está cerrada y justo antes está abierta');
    // la válvula sigue abierta mientras el pistón sube: ése es el empuje de vuelta
    ok(F.elevacion(540 + phi / 2, phi).adm > 0, `con φ=${phi}° la admisión sigue abierta con el pistón subiendo`); }
  absc(F.elevacion(F.EVO, 50).esc, 0, 1e-12, 'el escape abre en el PMI'); absc(F.elevacion(F.EVC, 50).esc, 0, 1e-9, 'el escape cierra a 10° después del PMS'); ok(F.elevacion(90, 50).esc === 0 && F.elevacion(270, 50).esc > 0, 'el escape sólo está abierto en la carrera de escape');
  ok(F.carrera(10) === 0 && F.carrera(200) === 1 && F.carrera(400) === 2 && F.carrera(600) === 3 && F.carrera(730) === 0, 'las cuatro carreras'); }

console.log('9 · El diseño del reto');
{ const R = F.RETO; ok(R.kMax < 1, 'el margen de detonación es menor que el límite físico (K=1)');
  for (const e of F.ESCENARIOS) {
    const ref = F.referencia(e), ini = F.criterios(e, F.R_REF, F.IVC_REF);
    ok(!ini.todo, `${e.id}: el motor de referencia (r=${F.R_REF}, φ=${F.IVC_REF}°) NO cumple de fábrica`);
    for (const [r, p] of [[F.R_MIN, F.IVC_MIN], [F.R_MIN, F.IVC_MAX], [F.R_MAX, F.IVC_MIN], [F.R_MAX, F.IVC_MAX]]) ok(!F.cumpleTodo(e, r, p), `${e.id}: la esquina (r=${r}, φ=${p}°) no cumple`);
    // rejilla: fracción que cumple, ventana
    let tot = 0, bien = 0, rMin = 99, rMax = 0, pMin = 999, pMax = 0; for (let r = F.R_MIN; r <= F.R_MAX + 1e-9; r += 0.25) for (let p = F.IVC_MIN; p <= F.IVC_MAX + 1e-9; p += 1) { tot++; if (F.cumpleTodo(e, r, p)) { bien++; rMin = Math.min(rMin, r); rMax = Math.max(rMax, r); pMin = Math.min(pMin, p); pMax = Math.max(pMax, p); } }
    const fr = bien / tot; ok(fr > 0.01 && fr < 0.12, `${e.id}: entre el 1 % y el 12 % de las combinaciones cumple (no es trivial ni imposible)`, (fr * 100).toFixed(1) + ' %');
    ok(pMin > F.IVC_MIN + 25 && pMax < F.IVC_MAX - 8, `${e.id}: la ventana de φ es INTERIOR (${pMin}°–${pMax}°)`); ok(rMin > F.R_MIN + 3, `${e.id}: la relación mínima que sirve está lejos del extremo bajo (r ≥ ${rMin})`);
    const w = F.rangoPhi(e, 15); ok(w && w[1] - w[0] >= 6, `${e.id}: con r=15 la ventana de φ mide ≥ 6° (${w ? w[0] + '–' + w[1] : '—'})`);
    // por qué falla cada lado: detonación por un lado, falta de par por el otro
    const izq = F.criterios(e, 15, pMin - 12), der = F.criterios(e, 15, pMax + 12); ok(!izq.c.golpeteo || !izq.c.consumo, `${e.id}: cerrar muy pronto falla (detona o no ahorra)`); ok(!der.c.par || !der.c.consumo, `${e.id}: cerrar muy tarde falla (falta par o no ahorra)`);
    // el reto no se cumple con la compresión baja aunque cierre en el sitio
    ok(!F.cumpleTodo(e, 10.5, (pMin + pMax) / 2), `${e.id}: con r=10,5 ningún cierre sirve (hay que expandir más)`); }
  // diagnósticos: cada caso da UN solo síntoma
  for (const c of F.CASOS_DX) { const s = F.sintomas(F.escPorId(c.esc), c.r, c.phi), claves = Object.keys(s).filter(k => s[k]); ok(claves.length === 1 && claves[0] === c.k, `diagnóstico «${c.k}»: sólo él da su síntoma`, JSON.stringify(s)); }
  ok(new Set(F.CASOS_DX.map(c => c.k)).size === 4, 'los cuatro diagnósticos son distintos'); }

console.log('10 · El mapa de consumo');
{ const M = F.mapaMotor(13, 70, 91, 16, 17); let mn = 1e9, mx = 0, vacios = 0; for (const b of M.cel) { if (isFinite(b)) { mn = Math.min(mn, b); mx = Math.max(mx, b); } else vacios++; }
  ok(mn > 225 && mn < 290, 'el mejor punto del motor Atkinson está entre 225 y 290 g/kWh', mn.toFixed(1)); ok(mx > mn && mx < 5000, 'los puntos de carga baja consumen más', mx.toFixed(0)); ok(vacios > 0, 'por encima de la curva de par máximo no hay datos');
  for (let i = 0; i < M.nx; i++) { const n = 1000 + 4000 * (i + 0.5) / M.nx; cerca(M.Tpl[i], F.parPleno(13, 70, n), 1e-12, 'la curva de par máximo del mapa = par a plena carga'); } }

console.log('11 · El reto de cálculo (fase 1) y las cifras de la prosa');
{ const CASOS_1 = new Function('return ' + html.split('const CASOS_1=')[1].split('];')[0] + ']')();
  ok(CASOS_1.length >= 6, 'hay varios casos de cálculo', String(CASOS_1.length));
  for (const c of CASOS_1) { const rc = 1 + (1 - c.f) * (c.r - 1); ok(rc < c.r && rc > 1, `caso r=${c.r}, f=${c.f}: la respuesta (${rc.toFixed(2)}) es menor que la relación geométrica`); ok(Math.abs(rc - c.r) > 0.12, `caso r=${c.r}, f=${c.f}: dar la relación geométrica NO acierta`); }
  const e = F.escPorId('carretera'); cerca(F.parPleno(10.5, 45, e.n), 130.7, 2e-3, 'la prosa dice 131 N·m a plena carga del motor normal'); cerca(F.parPleno(13, 75, e.n), 103.4, 2e-3, 'la prosa dice 103 N·m a plena carga con r=13 y cierre a 75°');
  cerca(F.referencia(e).M.etaFreno * 100, 28.7, 2e-3, 'la prosa dice 28,7 % del motor normal'); cerca(F.hibrido(e, 13, 75).M.etaFreno * 100, 30.1, 2e-3, 'la prosa dice 30,1 % con r=13 y cierre a 75°'); }

console.log(`\n${n - malas}/${n} comprobaciones` + (malas ? ` · ${malas} FALLAN` : ' · todas bien'));
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
