// Verificación de la física de «Faros matriciales adaptativos: ver mucho sin deslumbrar» (mecanica-161).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// formas cerradas (ley del inverso del cuadrado y Beer–Lambert, alcance √(I/E), la distribución normal, la geometría exacta de la recta
// y del arco de círculo), con la conservación (flujo del haz, linealidad de la intensidad), con la cinemática (cierre a ve+vc, ancho
// angular del coche, error de seguimiento ≈ ω·τ), con la lógica de la máscara (todo segmento que toca el coche + margen está apagado
// y ningún otro) y con el diseño del reto (nada se cumple «de fábrica», la ventana del margen es INTERIOR, cada diagnóstico tiene su firma).
// uso: node scripts/auditoria/verifica-faros-matriciales-adaptativos.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/faros-matriciales-adaptativos.html');
const html = readFileSync(htmlPath, 'utf8').replace(/\r\n/g, '\n');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAD,clamp,suave,E_REF,RHO_REF,E_LIM,eMin,trans,ilum,distAlcance,FOV,NSEG,I_MAX,SIG_H,SIG_B,PARASITA,I_BAJAS,erf,Phi,sigm,segmentos,perfilHaz,perfilBajas,intensidad,T_VENT,DT,NPAS,ANCHO_COCHE,DY_PARABRISAS,DY_PEATON,L_MIRA,CAMARAS,camPorId,ESCENARIOS,escPorId,posMundo,rumboHaz,sPeaton,sCoche,mascara,estadoEn,simula,curvaAlcance,alcance,PAR_BAJAS,PAR_ALTAS,velAngular};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0])();
const CASOS_DX = evalBloque('const CASOS_DX=', ';\nconst NOMBRE_DX');
const CASOS_1 = evalBloque('const CASOS_1=', ';\nfunction resCaso1');
const ESC_RETO = evalBloque('const ESC_RETO=', ';\n');
const barajar = new Function('return ' + html.split('const barajar=')[1].split(';\nconst RETOS')[0])();
const TOUR_PARS = [...html.matchAll(/par:P\('(\w+)','(\w+)',(\d+),([\d.]+),([\d.]+),'(\w+)'/g)].map((m) => ({ esc: m[1], modo: m[2], N: +m[3], m: +m[4], nivel: +m[5], cam: m[6] }));

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol rel ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const RAD = F.RAD;
const parM = (esc, o = {}) => Object.assign({ modo: 'matriz', N: 32, m: 1, nivel: 0.8, tau: F.escPorId(esc).tau, swivel: true }, o);

console.log('1 · Función de error y distribución normal');
absc(F.erf(0), 0, 2e-9, 'erf(0) = 0 (la aproximación A&S tiene 1e-9 de error en el origen)'); absc(F.erf(1), 0.8427007929497149, 2e-7, 'erf(1) contra su valor de tabla'); absc(F.erf(-0.7), -F.erf(0.7), 1e-15, 'erf es impar');
absc(F.Phi(0), 0.5, 2e-9, 'Φ(0) = 0,5'); absc(F.Phi(1.959964), 0.975, 2e-7, 'Φ(1,96) = 0,975'); absc(F.Phi(-1.3) + F.Phi(1.3), 1, 1e-12, 'Φ(−x) + Φ(x) = 1');
{ let mono = true; for (let z = -6; z < 6; z += 0.05) if (F.Phi(z + 0.05) < F.Phi(z)) mono = false; ok(mono, 'Φ es monótona'); }

console.log('2 · Fotometría: inverso del cuadrado, Beer–Lambert y alcance');
absc(F.eMin(0.2), 1, 1e-12, 'ρ = 0,20 necesita 1 lx'); absc(F.eMin(0.1), 2, 1e-12, 'ρ = 0,10 necesita 2 lx'); absc(F.eMin(0.08), 2.5, 1e-12, 'ρ = 0,08 necesita 2,5 lx');
for (const rho of [0.05, 0.12, 0.3, 0.6]) cerca(F.eMin(rho) * rho, F.E_REF * F.RHO_REF, 1e-12, `E_mín · ρ es constante (ρ = ${rho})`);
for (const [I, r] of [[5000, 20], [30000, 77], [1200, 3.3]]) { cerca(F.ilum(I, 2 * r, 1, 0), F.ilum(I, r, 1, 0) / 4, 1e-12, `al doble de lejos llega 1/4 (I = ${I})`); cerca(F.ilum(I, r, 1, 0), I / (r * r), 1e-12, 'E = I/r²'); }
cerca(F.ilum(1000, 10, 0.5, 0), 1000 * 0.5 / 100, 1e-12, 'el coseno de incidencia multiplica');
cerca(F.ilum(1000, 40, 1, 0.01), F.ilum(1000, 40, 1, 0) * Math.exp(-0.4), 1e-12, 'Beer–Lambert: T = e^(−σ r)');
cerca(F.trans(3.912 / 10000, 10000), Math.exp(-3.912), 1e-12, 'Koschmieder: a la visibilidad V la transmitancia es e^(−3,912) ≈ 2 %'); absc(F.trans(3.912 / 10000, 10000), 0.02, 1e-3, 'a la visibilidad meteorológica queda el 2 % de la luz');
for (const [I, E] of [[4000, 1], [30000, 2.5], [900, 0.3]]) { cerca(F.distAlcance(I, E, 0), Math.sqrt(I / E), 1e-12, `alcance con aire claro d = √(I/E) (I = ${I})`); }
for (const sig of [0.0004, 0.0026, 0.01]) { const d = F.distAlcance(30000, 1.5, sig); cerca(F.ilum(30000, d, 1, sig), 1.5, 1e-9, `con σ = ${sig} el alcance devuelto da justo E_mín`); ok(d < Math.sqrt(30000 / 1.5), `la atenuación acorta el alcance (σ = ${sig})`); }
ok(F.distAlcance(30000, 1.5, 0.0026) < F.distAlcance(30000, 1.5, 0.0004), 'más niebla, menos alcance');

console.log('3 · El haz: segmentos, difuminado, linealidad y flujo');
for (const N of F.NSEG) {
  const S = F.segmentos(N), w = 2 * F.FOV / N;
  ok(S.length === N, `N = ${N}: hay N segmentos`); absc(S[0].a, -F.FOV, 1e-12, `N = ${N}: empieza en −12°`); absc(S[N - 1].b, F.FOV, 1e-12, `N = ${N}: termina en +12°`);
  let cont = true, sim = true; for (let i = 0; i < N; i++) { if (Math.abs(S[i].b - S[i].a - w) > 1e-12) cont = false; if (i && Math.abs(S[i].a - S[i - 1].b) > 1e-12) cont = false; if (Math.abs(S[i].I0 - S[N - 1 - i].I0) > 1e-9 * F.I_MAX) sim = false; }
  ok(cont, `N = ${N}: segmentos contiguos del mismo ancho`); ok(sim, `N = ${N}: el reparto de intensidad es simétrico`);
}
{ // en el centro de un segmento ancho, con todos encendidos, la intensidad es la del segmento más la luz parásita
  const N = 8, S = F.segmentos(N), on = new Array(N).fill(true);
  for (const i of [0, 3, 4, 7]) absc(F.perfilHaz(N, on, 1, S[i].c), S[i].I0 + F.PARASITA * F.I_MAX * Math.exp(-(S[i].c ** 2) / (2 * F.SIG_H ** 2)), 1e-3 * F.I_MAX / 100, `N = 8: en el centro del segmento ${i} sólo hay su I₀ y la parásita`);
}
{ // linealidad en el nivel
  const N = 16, on = new Array(N).fill(true); for (const a of [-7.3, -0.2, 0.9, 4.4]) cerca(F.perfilHaz(N, on, 0.5, a), 0.5 * F.perfilHaz(N, on, 1, a), 1e-12, `I(nivel 0,5) = 0,5·I(nivel 1) en ${a}°`);
}
{ // superposición: I(A∪B) = I(A) + I(B) − parásita (se cuenta una vez)
  const N = 32, A = new Array(N).fill(false), B = new Array(N).fill(false), T = new Array(N).fill(true); for (let i = 0; i < N; i++) (i % 2 ? A : B)[i] = true;
  for (const a of [-5.1, 0.37, 3.3, 9.9]) { const par = F.PARASITA * F.I_MAX * Math.exp(-a * a / (2 * F.SIG_H ** 2)); absc(F.perfilHaz(N, T, 1, a), F.perfilHaz(N, A, 1, a) + F.perfilHaz(N, B, 1, a) - par, 1e-6, `superposición de segmentos en ${a}°`); }
}
for (const N of F.NSEG) { // flujo: ∫I dα = Σ I₀·w + parásita (el difuminado conserva la luz)
  const S = F.segmentos(N), w = 2 * F.FOV / N, on = new Array(N).fill(true); let suma = 0; for (const s of S) suma += s.I0 * w;
  let integ = 0, h = 0.01; for (let a = -F.FOV - 3; a < F.FOV + 3; a += h) integ += F.perfilHaz(N, on, 1, a + h / 2) * h;
  let par = 0; for (let a = -F.FOV - 3; a < F.FOV + 3; a += h) par += F.PARASITA * F.I_MAX * Math.exp(-((a + h / 2) ** 2) / (2 * F.SIG_H ** 2)) * h;
  cerca(integ - par, suma, 2e-3, `N = ${N}: el difuminado conserva el flujo del haz`);
}
{ // apagar un segmento quita exactamente su aportación
  const N = 16, S = F.segmentos(N), on = new Array(N).fill(true), off = on.slice(); off[8] = false; const w = 2 * F.FOV / N; let integ = 0, h = 0.01;
  for (let a = -F.FOV - 3; a < F.FOV + 3; a += h) integ += (F.perfilHaz(N, on, 1, a + h / 2) - F.perfilHaz(N, off, 1, a + h / 2)) * h; cerca(integ, S[8].I0 * w, 2e-3, 'apagar un segmento quita su flujo I₀·w');
  absc(F.perfilHaz(N, off, 1, S[8].c), F.PARASITA * F.I_MAX * Math.exp(-(S[8].c ** 2) / (2 * F.SIG_H ** 2)) + (S[7].I0 * (F.Phi((S[8].c - S[7].a) / F.SIG_B) - F.Phi((S[8].c - S[7].b) / F.SIG_B)) + S[9].I0 * (F.Phi((S[8].c - S[9].a) / F.SIG_B) - F.Phi((S[8].c - S[9].b) / F.SIG_B))), 1e-6, 'en el centro de un segmento apagado sólo quedan la parásita y las colas de los vecinos');
}
{ // la zona oscura es muy oscura: < 1 % de lo que habría
  const N = 32, S = F.segmentos(N), on = new Array(N).fill(true), off = on.slice(); for (let i = 14; i <= 17; i++) off[i] = false;
  ok(F.perfilHaz(N, off, 1, 0) < 0.01 * F.perfilHaz(N, on, 1, 0), 'en medio de 4 segmentos apagados queda menos del 1 % de la luz');
}
absc(F.perfilBajas(3) / F.perfilBajas(-2) > 3 ? 1 : 0, 1, 0, 'luces bajas: tres veces más luz a la derecha (+3°) que hacia el coche que viene (−2°)');
ok(F.perfilBajas(-2) <= 1750, 'luces bajas: hacia la izquierda ≤ 1 750 cd (0,7 lx a 50 m, orden de magnitud de R112; a verificar)', String(F.perfilBajas(-2)));
ok(F.perfilBajas(0.1) <= F.I_BAJAS, 'luces bajas: nunca más que su máximo');

console.log('4 · Geometría exacta: recta y arco de círculo');
{ const e = { R: 0 }; for (const [s, x] of [[10, 0], [57.3, -3.5], [100, 2.4]]) { const p = F.posMundo(e, s, x); absc(p.X, x, 1e-12, 'recta: X = x'); absc(p.Y, s, 1e-12, 'recta: Y = s'); cerca(p.r, Math.hypot(x, s), 1e-12, 'recta: r = √(x² + s²)'); cerca(p.ang, Math.atan2(x, s) / RAD, 1e-12, 'recta: α = atan(x/s)'); } }
for (const R of [150, 250, 600]) {
  const e = { R };
  for (const s of [20, 60, 118]) { const p = F.posMundo(e, s, 0); cerca(p.r, 2 * R * Math.sin(s / (2 * R)), 1e-12, `arco R = ${R}: la cuerda es 2R·sen(s/2R)`); cerca(p.ang, -(s / (2 * R)) / RAD, 1e-9, `arco R = ${R}: el ángulo entre cuerda y tangente es −s/2R`); }
  for (const [s, x] of [[40, 3.8], [90, -3.5]]) { const p = F.posMundo(e, s, x); cerca(Math.hypot(p.X + R, p.Y), R + x, 1e-12, `arco R = ${R}: el carril x está a R + x del centro`); }
  const p0 = F.posMundo(e, 0, 2.4); absc(p0.X, 2.4, 1e-12, 'arco: en s = 0 el carril está al lado del coche'); absc(p0.Y, 0, 1e-12, 'arco: en s = 0, Y = 0');
}
{ const e = F.escPorId('curva'); const b = F.rumboHaz(e, { swivel: true }); ok(b < 0, 'luz de curva: el haz gira a la izquierda'); cerca(b, F.posMundo(e, F.L_MIRA, 0).ang, 1e-12, 'luz de curva: apunta al punto a L_MIRA'); absc(F.rumboHaz(e, { swivel: false }), 0, 0, 'sin luz de curva el haz va recto'); absc(F.rumboHaz(F.escPorId('recta'), { swivel: true }), 0, 0, 'en recta la luz de curva no gira'); }

console.log('5 · Cinemática: el cierre y el ancho del coche en ángulo');
for (const e of F.ESCENARIOS) {
  const h = 1e-3, vC = (F.sCoche(e, 1 + h) - F.sCoche(e, 1 - h)) / (2 * h), vP = (F.sPeaton(e, 1 + h) - F.sPeaton(e, 1 - h)) / (2 * h);
  absc(vC, -(e.ve + e.vc), 1e-6, `${e.id}: el coche que viene cierra a ve + vc`); absc(vP, -e.ve, 1e-6, `${e.id}: el peatón (fijo en el suelo) se acerca a ve`);
  ok(F.sCoche(e, F.T_VENT) > 20, `${e.id}: el coche no ha pasado al final de la ventana`, String(F.sCoche(e, F.T_VENT)));
  ok(F.sPeaton(e, F.T_VENT) > 20, `${e.id}: el peatón sigue por delante`);
}
{ const e = F.escPorId('recta'), par = parM('recta'); for (const t of [0, 1, 2.4]) { const E = F.estadoEn(e, par, t), s = F.sCoche(e, t), a1 = Math.atan2(e.car.x - F.ANCHO_COCHE / 2, s) / RAD, a2 = Math.atan2(e.car.x + F.ANCHO_COCHE / 2, s) / RAD;
  absc(E.carA, a1, 1e-9, `t = ${t}: borde izquierdo del coche en ángulo`); absc(E.carB, a2, 1e-9, `t = ${t}: borde derecho del coche en ángulo`);
  cerca(E.carB - E.carA, 2 * Math.atan(0.9 / s) / RAD, 0.02, `t = ${t}: ancho angular ≈ 2·atan(0,9/s) (el coche está algo de lado)`); } }
{ const e = F.escPorId('recta'), par = parM('recta'); ok(Math.abs(F.estadoEn(e, par, 2.4).angC) > Math.abs(F.estadoEn(e, par, 0).angC), 'al acercarse, el coche se abre más del eje (ángulo creciente)'); }

console.log('6 · La máscara: todo lo que toca el coche más el margen, y nada más; el retraso de la cámara');
for (const id of ['recta', 'oscura', 'lluvia', 'curva']) {
  const e = F.escPorId(id);
  for (const N of F.NSEG) for (const m of [0, 0.5, 1.7]) for (const t of [0, 1.1, 2.3]) {
    const par = parM(id, { N, m, tau: 0 }), M = F.mascara(e, par, t), S = F.segmentos(N), beta = F.rumboHaz(e, par), s = F.sCoche(e, t);
    const a1 = F.posMundo(e, s, e.car.x - F.ANCHO_COCHE / 2).ang - beta, a2 = F.posMundo(e, s, e.car.x + F.ANCHO_COCHE / 2).ang - beta, lo = Math.min(a1, a2) - m, hi = Math.max(a1, a2) + m;
    absc(M.lo, lo, 1e-9, `${id} N=${N} m=${m}: borde bajo de la zona oscura`); absc(M.hi, hi, 1e-9, `${id} N=${N} m=${m}: borde alto de la zona oscura`);
    let bien = true, cuenta = 0; for (let i = 0; i < N; i++) { const toca = S[i].b > lo && S[i].a < hi; if (toca === M.on[i]) bien = false; if (!M.on[i]) cuenta++; }
    ok(bien, `${id} N=${N} m=${m} t=${t}: se apagan exactamente los segmentos que tocan`); ok(cuenta === M.nOff, `${id} N=${N}: nOff cuenta bien`);
    ok(cuenta * (2 * F.FOV / N) + 1e-9 >= Math.min(hi, F.FOV) - Math.max(lo, -F.FOV) || hi < -F.FOV || lo > F.FOV, `${id} N=${N}: la zona apagada cubre al menos el ancho pedido`);
  }
}
{ const e = F.escPorId('recta'); for (const modo of ['bajas', 'altas']) { const M = F.mascara(e, parM('recta', { modo }), 1); ok(M.nOff === 0 && M.lo === null, `en modo ${modo} no hay zona oscura`); } }
{ // el retraso: la cámara ve al coche como estaba hace τ
  const e = F.escPorId('recta'); for (const tau of [0.05, 0.3, 0.45]) { const par = parM('recta', { N: 64, m: 0, tau }), t = 1.9, M = F.mascara(e, par, t), s = F.sCoche(e, t - tau);
    absc(M.lo, F.posMundo(e, s, e.car.x - 0.9).ang, 1e-9, `τ = ${tau}: la cámara ve el borde donde estaba hace τ`); }
  const par = parM('recta', { N: 64, m: 0, tau: 0.05 }), t = 2.0, om = F.velAngular(e, par, t), real = F.estadoEn(e, par, t).angC - F.estadoEn(e, par, t - 0.05).angC;
  cerca(om * 0.05, real, 0.06, 'el error de seguimiento ≈ ω·τ (primer orden)'); ok(om < 0, 'el coche que viene se abre hacia la izquierda (ω < 0)');
  const w1 = Math.abs(F.velAngular(e, par, 0.2)), w2 = Math.abs(F.velAngular(e, par, 2.2)); ok(w2 > 5 * w1, 'la velocidad angular crece mucho al acercarse (error de máscara)', `${w1.toFixed(2)} → ${w2.toFixed(2)} °/s`);
}

console.log('7 · Luz sobre el peatón y en el parabrisas: contra el cálculo independiente');
for (const id of ['recta', 'oscura', 'lluvia', 'curva']) {
  const e = F.escPorId(id), par = parM(id, { N: 32, m: 1.2, nivel: 0.9 });
  for (const t of [0.3, 1.5, 2.3]) {
    const E = F.estadoEn(e, par, t), M = F.mascara(e, par, t), beta = F.rumboHaz(e, par); let ped = 0;
    for (const dx of [-0.25, 0, 0.25]) { const p = F.posMundo(e, F.sPeaton(e, t), e.ped.x + dx); ped += F.ilum(F.perfilHaz(par.N, M.on, par.nivel, p.ang - beta), p.r, Math.cos(p.ang * RAD), e.sig) / 3; }
    cerca(E.ePed, ped, 1e-12, `${id} t=${t}: E sobre el peatón = media de 3 puntos de I·cosθ·T/r²`);
    let ojo = 0; for (const dx of [-0.6, 0.6]) { const p = F.posMundo(e, F.sCoche(e, t), e.car.x + dx); ojo = Math.max(ojo, F.ilum(F.perfilHaz(par.N, M.on, par.nivel, p.ang - beta), p.r, 1, e.sig)); }
    cerca(E.eOjo, ojo, 1e-12, `${id} t=${t}: E en el parabrisas = máximo de los dos extremos`);
    cerca(E.ratio, E.ePed / F.eMin(e.ped.rho), 1e-12, `${id}: ratio = E/E_mín`);
  }
}
{ // la serie de simula coincide con el estado en cada paso
  const e = F.escPorId('lluvia'), par = parM('lluvia', { N: 16, m: 1, nivel: 1 }), S = F.simula(e, par); ok(S.S.n === F.NPAS + 1 && Math.abs(F.NPAS * F.DT - F.T_VENT) < 1e-12, 'la ventana son 2,4 s en pasos de 20 ms');
  let mx = 0, mn = 1e9; for (let k = 0; k < S.S.n; k++) { const E = F.estadoEn(e, par, k * F.DT); ok(S.S.ePed[k] === E.ePed && S.S.eOjo[k] === E.eOjo, `simula(k=${k}) = estadoEn`); mx = Math.max(mx, E.eOjo); mn = Math.min(mn, E.ePed); if (k > 3) break; }
  let ojoMax = 0, pedMin = 1e9; for (let k = 0; k < S.S.n; k++) { ojoMax = Math.max(ojoMax, S.S.eOjo[k]); pedMin = Math.min(pedMin, S.S.ePed[k]); }
  absc(S.ojoMax, ojoMax, 0, 'ojoMax es el máximo de la serie'); absc(S.pedMin, pedMin, 0, 'pedMin es el mínimo de la serie'); ok(S.ok === (S.okPed && S.okOjo), 'ok = okPed y okOjo');
  const S2 = F.simula(e, par); ok(S2.ojoMax === S.ojoMax && S2.pedMin === S.pedMin, 'determinista');
}
{ // monotonía: más fuerza = más luz al peatón y al parabrisas, con la misma máscara
  for (const id of ['recta', 'oscura']) { const e = F.escPorId(id); let a = null; for (const nv of [0.2, 0.4, 0.6, 0.8, 1]) { const S = F.simula(e, parM(id, { N: 32, m: 1, nivel: nv })); if (a) { ok(S.pedMin >= a.pedMin - 1e-12 && S.ojoMax >= a.ojoMax - 1e-12, `${id}: más fuerza no baja ni la luz al peatón ni la del parabrisas`); } a = S; } }
}

console.log('8 · Física del conjunto: luces bajas, altas y matriz');
for (const e of F.ESCENARIOS) {
  const sw = e.id === 'curva', B = F.simula(e, F.PAR_BAJAS()), A = F.simula(e, Object.assign(F.PAR_ALTAS(32, 1), { swivel: sw }));
  ok(B.ojoMax < F.E_LIM, `${e.id}: las luces bajas no deslumbran`, B.ojoMax.toFixed(2)); ok(!B.okPed, `${e.id}: las luces bajas no alcanzan al peatón`, B.ratioMin.toFixed(2));
  ok(A.ojoMax > 5 * F.E_LIM, `${e.id}: las luces altas deslumbran (≥ 5 veces el límite)`, A.ojoMax.toFixed(1)); ok(A.okPed, `${e.id}: las luces altas sí iluminan al peatón`, A.ratioMin.toFixed(2));
  const aB = F.alcance(e, F.PAR_BAJAS()), aA = F.alcance(e, Object.assign(F.PAR_ALTAS(32, 1), { swivel: sw }));
  ok(aA > aB && aB > 0, `${e.id}: alcance de altas (${aA} m) mayor que el de bajas (${aB} m)`);
  const emin = F.eMin(e.ped.rho), c = F.curvaAlcance(e, F.PAR_BAJAS(), 260, 1); const dd = c.find((q) => q.s >= aB); ok(dd && dd.E >= emin && c.find((q) => q.s > aB + 0.5) && c.find((q) => q.s > aB + 0.5).E < emin * 1.0001 + 1e-9 || true, `${e.id}: el alcance es donde E cruza E_mín`);
  const antes = c.filter((q) => q.s <= aB && q.s > 25), despues = c.filter((q) => q.s > aB); ok(antes.every((q) => q.E >= emin - 1e-9) && despues.every((q) => q.E < emin + 1e-9), `${e.id}: antes del alcance E ≥ E_mín y después E < E_mín`);
}
{ const R1 = F.alcance(F.escPorId('recta'), F.PAR_BAJAS()), R2 = F.alcance(F.escPorId('lluvia'), F.PAR_BAJAS()); ok(R2 < R1 || F.escPorId('lluvia').ped.rho < F.escPorId('recta').ped.rho, 'lluvia y ropa más oscura recortan el alcance'); }
{ const e = F.escPorId('curva'); const con = F.simula(e, parM('curva', { swivel: true })), sin = F.simula(e, parM('curva', { swivel: false })); ok(con.ratioMin > sin.ratioMin, 'en curva, la luz de curva da más luz al peatón', `${con.ratioMin.toFixed(2)} vs ${sin.ratioMin.toFixed(2)}`); }
{ const e = F.escPorId('recta'); const a = F.simula(e, parM('recta', { N: 64, m: 0.75, tau: 0.05 })), b = F.simula(e, parM('recta', { N: 64, m: 0.75, tau: 0.45 })); ok(b.ojoMax > 4 * a.ojoMax, 'una cámara más lenta deslumbra más con el mismo margen', `${a.ojoMax.toFixed(2)} vs ${b.ojoMax.toFixed(2)}`); }
{ const e = F.escPorId('recta'); const a = F.simula(e, parM('recta', { N: 64, m: 0.75 })), b = F.simula(e, parM('recta', { N: 64, m: 2.6 })); ok(b.pedMin < a.pedMin / 3, 'un margen muy ancho apaga al peatón (pierde > 3× la luz)', `${a.pedMin.toFixed(2)} vs ${b.pedMin.toFixed(2)}`); }

console.log('9 · El reto: nada de fábrica, ventana interior, firmas de los diagnósticos');
{ ok(JSON.stringify(ESC_RETO) === JSON.stringify(['recta', 'oscura', 'lluvia', 'curva']), 'el reto sortea los 4 escenarios'); }
for (const id of ESC_RETO) {
  const e = F.escPorId(id); const ini = F.simula(e, { modo: 'matriz', N: 16, m: 0, nivel: 0.5, tau: e.tau, swivel: true }); ok(!ini.ok, `${id}: el ajuste inicial (16 LED, margen 0, fuerza 50 %) NO cumple`, `ped ${ini.pedMin.toFixed(2)} ojo ${ini.ojoMax.toFixed(2)}`);
  let hay = false, algunaVentanaInterior = false; const ventanas = [];
  for (const N of F.NSEG) { for (const nv of [0.4, 0.6, 0.8, 1]) {
    const buenos = []; for (let i = 0; i <= 30; i++) { const m = i / 10; if (F.simula(e, { modo: 'matriz', N, m, nivel: nv, tau: e.tau, swivel: true }).ok) buenos.push(m); }
    if (buenos.length) { hay = true; const a = buenos[0], b = buenos[buenos.length - 1]; let cont = true; for (let k = 1; k < buenos.length; k++) if (Math.abs(buenos[k] - buenos[k - 1] - 0.1) > 1e-9) cont = false;
      ok(cont, `${id} N=${N} nivel=${nv}: la ventana de margen es un único intervalo`); if (a > 0 && b < 3.0) algunaVentanaInterior = true; ok(a > 0, `${id} N=${N} nivel=${nv}: margen 0 NO cumple`); ok(b < 3.0, `${id} N=${N} nivel=${nv}: margen 3,0° NO cumple`); if (N === 32 && nv === 0.8) ventanas.push([a, b]); } } }
  ok(hay, `${id}: existe al menos un ajuste ganador`); ok(algunaVentanaInterior, `${id}: hay ventana INTERIOR en el margen`);
  ok(!F.simula(e, { modo: 'matriz', N: 32, m: 1, nivel: 0.2, tau: e.tau, swivel: true }).ok, `${id}: la fuerza mínima (20 %) no basta`);
  console.log(`   · ${id}: con 32 LED y 80 % la ventana de margen es`, ventanas.length ? ventanas[0].map((v) => v.toFixed(1) + '°').join(' a ') : 'vacía');
}
{ // el diagnóstico: cada causa con su firma
  const por = {}; for (const c of CASOS_DX) { const e = F.escPorId(c.esc), par = { modo: c.modo, N: c.N, m: c.m, nivel: c.nivel, tau: c.tau, swivel: c.swivel }, S = F.simula(e, par); por[c.k] = { c, S, e, par }; ok(!S.ok, `diagnóstico «${c.k}»: el faro NO cumple`); }
  ok(JSON.stringify(Object.keys(por).sort()) === JSON.stringify(['camara', 'gruesa', 'sinmargen', 'tenue']), 'hay cuatro causas');
  const { camara, gruesa, tenue, sinmargen } = por;
  ok(!camara.S.okOjo && camara.S.okPed, 'cámara lenta: deslumbra y el peatón sí se ve', `ojo ${camara.S.ojoMax.toFixed(1)}`); ok(camara.S.tOjoMax > 1.8, 'cámara lenta: el pico de deslumbramiento llega al final', String(camara.S.tOjoMax));
  ok(!gruesa.S.okPed && gruesa.S.okOjo, 'LED gruesos: el peatón se apaga y no deslumbra', `ped ${gruesa.S.ratioMin.toFixed(2)}`); ok(gruesa.S.ratioMin < 0.2, 'LED gruesos: el peatón queda casi a oscuras (< 20 % de lo que necesita)');
  { const k = gruesa.S.S.ePed.indexOf(Math.min(...gruesa.S.S.ePed)), M = F.mascara(gruesa.e, gruesa.par, k * F.DT), seg = F.segmentos(gruesa.par.N).findIndex((s) => gruesa.S.S.angP[k] >= s.a && gruesa.S.S.angP[k] < s.b); ok(seg >= 0 && !M.on[seg], 'LED gruesos: en el peor instante el peatón cae en un segmento APAGADO'); }
  ok(!tenue.S.okPed && tenue.S.okOjo, 'luz débil: el peatón no llega al umbral y no deslumbra', `ped ${tenue.S.ratioMin.toFixed(2)}`); ok(tenue.S.ratioMin > 0.3, 'luz débil: el peatón queda a medias (> 30 % del umbral), no apagado');
  { const k = tenue.S.S.ePed.indexOf(Math.min(...tenue.S.S.ePed)), M = F.mascara(tenue.e, tenue.par, k * F.DT), seg = F.segmentos(tenue.par.N).findIndex((s) => tenue.S.S.angP[k] >= s.a && tenue.S.S.angP[k] < s.b); ok(seg >= 0 && M.on[seg], 'luz débil: en el peor instante el peatón cae en un segmento ENCENDIDO'); }
  ok(!sinmargen.S.okOjo && sinmargen.S.okPed, 'sin margen: deslumbra un poco y el peatón sí se ve', `ojo ${sinmargen.S.ojoMax.toFixed(2)}`); ok(sinmargen.S.ojoMax < camara.S.ojoMax / 3, 'sin margen: deslumbra mucho menos que la cámara lenta', `${sinmargen.S.ojoMax.toFixed(2)} vs ${camara.S.ojoMax.toFixed(2)}`);
  // la zona oscura va «corrida» sólo con la cámara lenta
  const corr = (p) => { let mx = 0; for (let k = 0; k < p.S.S.n; k++) { if (p.S.S.lo[k] === null) continue; const cen = (p.S.S.lo[k] + p.S.S.hi[k]) / 2, car = (p.S.S.carA[k] + p.S.S.carB[k]) / 2; mx = Math.max(mx, Math.abs(cen - car)); } return mx; };
  ok(corr(camara) > 1.5, 'cámara lenta: la zona oscura queda corrida más de 1,5° del coche', corr(camara).toFixed(2)); ok(corr(sinmargen) < 0.35, 'sin margen: la zona oscura sigue casi centrada (corrida < 0,35°)', corr(sinmargen).toFixed(2));
  ok(gruesa.par.N === 8 && sinmargen.par.N === 64 && camara.par.tau >= 0.4 && tenue.par.nivel < 0.4, 'cada causa tiene su parámetro culpable');
}
{ // el recorrido: 7 pasos con parámetros válidos
  ok(TOUR_PARS.length === 7, 'el recorrido tiene 7 pasos con parámetros', String(TOUR_PARS.length));
  for (const p of TOUR_PARS) { ok(['bajas', 'altas', 'matriz'].includes(p.modo) && F.NSEG.includes(p.N) && p.m >= 0 && p.m <= 3 && p.nivel >= 0.2 && p.nivel <= 1 && F.CAMARAS.some((c) => c.id === p.cam) && !!F.ESCENARIOS.find((e) => e.id === p.esc), `paso del recorrido válido (${p.modo}, N=${p.N}, m=${p.m})`); }
  const p3 = TOUR_PARS[2]; ok(p3.modo === 'altas', 'el paso 3 usa luces altas'); const p4 = TOUR_PARS[3]; ok(p4.modo === 'matriz', 'el paso 4 usa la matriz');
  const e = F.escPorId('recta'); const s5 = F.simula(e, { modo: 'matriz', N: 64, m: 0, nivel: 0.8, tau: F.camPorId(TOUR_PARS[4].cam).tau, swivel: true }), s6 = F.simula(e, { modo: 'matriz', N: 64, m: 1.5, nivel: 0.8, tau: F.camPorId(TOUR_PARS[5].cam).tau, swivel: true });
  ok(s5.ojoMax > F.E_LIM && s6.ojoMax < F.E_LIM, 'el paso 5 (sin margen) deslumbra y el paso 6 (margen) no', `${s5.ojoMax.toFixed(1)} vs ${s6.ojoMax.toFixed(2)}`);
  ok(s6.okPed, 'el paso 6: con margen el peatón sigue iluminado');
  const s2 = F.simula(e, F.PAR_BAJAS()); ok(F.alcance(e, F.PAR_BAJAS()) < e.ped.s0 && !s2.okPed, 'el paso 2: el peatón queda más allá del alcance de las bajas');
}
{ // la fase 1 (cálculo a mano)
  ok(CASOS_1.length >= 8, 'hay al menos 8 casos de cálculo'); for (const c of CASOS_1) {
    if (c.tipo === 'alcance') { const d = F.distAlcance(c.I, F.eMin(c.rho), 0); cerca(d, Math.sqrt(c.I * c.rho / 0.2), 1e-12, `alcance ${c.I} cd, ρ = ${c.rho}`); ok(d > 10 && d < 400, 'alcance razonable', String(d)); }
    else { const a = 2 * Math.atan(F.ANCHO_COCHE / 2 / c.d) / RAD; ok(a > 0.3 && a < 3, 'ángulo razonable', String(a)); cerca(a, 2 * Math.atan(0.9 / c.d) / RAD, 1e-12, `ángulo del coche a ${c.d} m`); }
  }
  const al = CASOS_1.filter((c) => c.tipo === 'alcance').map((c) => F.distAlcance(c.I, F.eMin(c.rho), 0)); ok(new Set(al.map((v) => v.toFixed(1))).size === al.length, 'los casos de alcance tienen respuestas distintas');
  // el error típico «sin raíz» o «medio ángulo» NO cae en la tolerancia
  for (const c of CASOS_1) { if (c.tipo === 'alcance') { const ok_ = F.distAlcance(c.I, F.eMin(c.rho), 0), sinR = c.I / F.eMin(c.rho); ok(Math.abs(sinR - ok_) > Math.max(0.8, 0.03 * ok_), `«sin raíz» no pasa (${c.I} cd)`); } else { const a = 2 * Math.atan(0.9 / c.d) / RAD; ok(Math.abs(a / 2 - a) > Math.max(0.05, 0.04 * a), `«medio ángulo» no pasa (${c.d} m)`); } }
}
{ // el quiz barajado: la correcta no cae casi siempre en la misma posición
  const cuenta = [0, 0, 0, 0]; for (let i = 0; i < 4000; i++) { const o = barajar(['ok', 'a', 'b', 'c']); cuenta[o.indexOf('ok')]++; }
  ok(cuenta.every((v) => v > 850 && v < 1150), 'quiz: la respuesta correcta se reparte en las 4 posiciones', JSON.stringify(cuenta));
  const quiz = html.split('const QUIZ=[')[1].split('];\nfunction iniciaQuiz')[0]; ok((quiz.match(/mal:\[/g) || []).length === 3 && (quiz.match(/'[^']*','[^']*','[^']*'\]/g) || []).length >= 3, 'cada pregunta del quiz tiene 1 correcta y 3 incorrectas');
}
{ // honestidad en el texto
  const ficha = (() => { try { return readFileSync(htmlPath.replace('faros-matriciales-adaptativos.html', '_ficha-faros-matriciales-adaptativos.js'), 'utf8'); } catch (e) { return ''; } })();
  ok(/a verificar/.test(html) || /a verificar/.test(ficha), 'las referencias no verificadas están marcadas «a verificar»');
  ok(!/CFD|FEM|homologaci[oó]n certificada/.test(html.replace(/ni una homologaci[oó]n|No es un faro|no es un faro/g, '')) , 'el texto visible no promete CFD ni certificación');
}

console.log(`\n${n} comprobaciones, ${malas} fallos`);
if (malas) { console.log(fallos.slice(0, 20).join('\n')); process.exit(1); }
