// Verificación de la física de «Robot de 6 ejes: alcance, cinemática inversa y singularidades» (mecanica-166).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con
// la cinemática del modelo 3D (el TCP del archivo GLB en la pose cero), con propiedades exactas (ortonormalidad, longitudes de eslabón, ley de los
// cosenos), con derivadas numéricas (el jacobiano), con las singularidades (det J = 0 con la muñeca recta y con el brazo estirado; q̇ ∝ 1/sen),
// con el viaje de ida y vuelta de la cinemática inversa (con codo arriba y abajo), con el mapa de alcance y con el diseño del reto (nada se cumple
// «de fábrica», las ventanas son INTERIORES, cada diagnóstico tiene su firma, el quiz está barajado).
// uso: node scripts/auditoria/verifica-robot-6-ejes-cinematica-alcance.mjs [ruta al html]
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/robot-6-ejes-cinematica-alcance.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAD,clamp,suave,I3,mmul,mvec,mT,vsum,vres,vesc,vdot,vcruz,vnorma,vunit,col,rotAx,Rx,Ry,Rz,ESCALA,OFF,TCP_LOC,A4,AX,KAPPA,NOMBRES,LIM_DEG,VMAX_DEG,th5De,fk,jacobiano,resuelve,det,SOMBRO,L2,A2,WL,L3,A3,E_LAT,D_MAX,D_MIN,anguloCodo,distanciaCodo,brazoIK,descompMuneca,orientacion,dirAprox,errRot,ik,revisaLimites,manipulabilidad,indiceManip,velArticular,peorGanancia,mapaAlcance,IM_MIN,ESCENARIOS,escPorId,D_RANGO,HB_RANGO,V_RANGO,extremos,evaluaPasadaGen,evaluaPasada,ventanaD,ventanaV,getRef:()=>DET_REF};`)();
const { RAD, DOSPI } = F;
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0])();
const CASOS_DX = evalBloque('const CASOS_DX=', ';\nconst NOMBRE_DX');
const CASOS_1 = evalBloque('const CASOS_1=', ';\nfunction resCaso1');
const QUIZ = evalBloque('const QUIZ=', ';\nfunction iniciaQuiz');
const barajar = new Function('return ' + html.split('const barajar=')[1].split(';\nconst RETOS')[0])();

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗ FALLO', msg, extra); } };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
let sd = 12345; const rnd = () => { sd = (sd * 1103515245 + 12345) % 2147483648; return sd / 2147483648; };
const uni = (a, b) => a + (b - a) * rnd();
const qAleatorio = () => [uni(-2.4, 2.4), uni(-105, 40) * RAD, uni(-30, 110) * RAD, uni(-3, 3), uni(-1.9, 1.9) - F.KAPPA, uni(-3, 3)];   // codo arriba (q3 < 117°)

console.log('— Cinemática directa contra el modelo 3D —');
{ const f = F.fk([0, 0, 0, 0, 0, 0]);
  // TCP del GLB en la pose cero: (0,48; 0,60; −0,13) respecto del origen del archivo, con el pivote de J1 en (−0,29; 0; 0,05); escala 3
  const esperado = [(0.48 + 0.29) * 3, 0.60 * 3, (-0.13 - 0.05) * 3];
  for (let i = 0; i < 3; i++) cerca(f.tcp[i], esperado[i], 1e-9, 'TCP en la pose cero = el del modelo 3D, eje ' + 'xyz'[i]);
  const piv = [[-0.29, 0, 0.05], [-0.17, 0.40, 0.05], [-0.29, 0.79, 0.05], [0.17, 0.71, -0.11], [0.31, 0.71, -0.11], [0.33, 0.62, -0.13]];   // pivotes del archivo
  piv.forEach((p, i) => { for (let k = 0; k < 3; k++) cerca(f.P[i][k], (p[k] - piv[0][k]) * 3, 1e-9, `pivote de J${i + 1} en la pose cero, eje ${'xyz'[k]}`); });
  cerca(F.L2, Math.hypot(0.12, 0.39) * 3, 1e-12, 'L₂ = longitud hombro–codo del modelo'); cerca(F.D_MAX, F.L2 + F.L3, 1e-12, 'alcance máximo = L₂ + L₃'); cerca(F.D_MIN, Math.abs(F.L3 - F.L2), 1e-12, 'alcance mínimo = |L₃ − L₂|');
  cerca(F.KAPPA / RAD, Math.atan2(0.19, 0.98) / RAD, 1e-9, 'κ = inclinación del eje de J4 (≈ 11°)');
}
{ let maxO = 0, maxD = 0, maxL = 0;
  for (let i = 0; i < 400; i++) { const q = qAleatorio(), f = F.fk(q), R = f.R, RT = F.mT(R), I = F.mmul(R, RT);
    for (let k = 0; k < 9; k++) maxO = Math.max(maxO, Math.abs(I[k] - (k % 4 === 0 ? 1 : 0)));
    maxD = Math.max(maxD, Math.abs(F.det([[R[0], R[1], R[2]], [R[3], R[4], R[5]], [R[6], R[7], R[8]]]) - 1));
    maxL = Math.max(maxL, Math.abs(F.vnorma(F.vres(f.P[2], f.P[1])) - F.L2)); }
  ok(maxO < 1e-12 && maxD < 1e-12, 'la rotación de la herramienta es ortonormal con det = +1 (400 poses)', `(${maxO.toExponential(1)}, ${maxD.toExponential(1)})`);
  ok(maxL < 1e-12, 'la longitud del eslabón hombro–codo no cambia con ninguna articulación', maxL.toExponential(1));
}

console.log('— Jacobiano contra derivadas numéricas —');
{ let maxE = 0;
  for (let t = 0; t < 60; t++) { const q = qAleatorio(), J = F.jacobiano(F.fk(q)), h = 1e-6;
    for (let j = 0; j < 6; j++) { const qa = q.slice(), qb = q.slice(); qa[j] += h; qb[j] -= h; const fa = F.fk(qa), fb = F.fk(qb);
      for (let r = 0; r < 3; r++) maxE = Math.max(maxE, Math.abs((fa.tcp[r] - fb.tcp[r]) / (2 * h) - J[r][j]));
      // la parte angular: la rotación incremental R(q+h)·R(q−h)ᵀ ≈ I + h·[ω]×
      const dR = F.mmul(fa.R, F.mT(fb.R)), w = [dR[7] - dR[5], dR[2] - dR[6], dR[3] - dR[1]].map((x) => x / (4 * h));
      for (let r = 0; r < 3; r++) maxE = Math.max(maxE, Math.abs(w[r] - J[3 + r][j])); } }
  ok(maxE < 1e-6, 'J (6×6) = derivada numérica central de la posición y del giro de la punta (60 poses × 6 ejes)', maxE.toExponential(2));
}

console.log('— Ley de los cosenos y el brazo de dos eslabones —');
for (const phiDeg of [10, 45, 90, 135, 170]) cerca(F.anguloCodo(F.distanciaCodo(phiDeg * RAD)) / RAD, phiDeg, 1e-9, `φ → d → φ es la identidad (φ = ${phiDeg}°)`);
cerca(F.anguloCodo(F.D_MAX), 0, 1e-6, 'con d = L₂ + L₃ el brazo está estirado (φ = 0)'); cerca(F.anguloCodo(F.D_MIN) / RAD, 180, 1e-6, 'con d = |L₃ − L₂| el brazo está plegado (φ = 180°)');
{ let maxE = 0, nOk = 0;
  for (const rama of ['arriba', 'abajo']) for (let i = 0; i < 200; i++) {
    const q = [uni(-2, 2), uni(-100, 30) * RAD, uni(-20, 100) * RAD, 0, 0, 0], f = F.fk(q);
    const R3 = F.mmul(F.Ry(q[0]), F.mmul(F.Rz(q[1]), F.Rz(q[2]))), W = F.vsum(f.P[2], F.mvec(R3, F.WL));   // centro de la muñeca por FK
    const b = F.brazoIK(W, rama); if (!b.ok) continue; nOk++;
    const R3b = F.mmul(F.Ry(b.q1), F.mmul(F.Rz(b.q2), F.Rz(b.q3))), P2 = F.vsum(F.mvec(F.Ry(b.q1), F.OFF[0]), F.mvec(F.Ry(b.q1), F.OFF[1])), P3 = F.vsum(P2, F.mvec(F.mmul(F.Ry(b.q1), F.Rz(b.q2)), F.OFF[2])), Wb = F.vsum(P3, F.mvec(R3b, F.WL));
    maxE = Math.max(maxE, F.vnorma(F.vres(Wb, W))); }
  ok(nOk > 300 && maxE < 1e-9, 'brazoIK (ley de los cosenos): J1, J2 y J3 devueltos llevan el centro de la muñeca al punto pedido, con codo arriba y abajo', `${nOk} casos, error ${maxE.toExponential(1)} m`);
  const W0 = F.vsum(F.fk([0.4, -0.5, 0.6, 0, 0, 0]).P[2], F.mvec(F.mmul(F.Ry(0.4), F.Rz(0.1)), F.WL)), b = F.brazoIK(W0, 'arriba');
  cerca(b.d * b.d, F.L2 ** 2 + F.L3 ** 2 + 2 * F.L2 * F.L3 * Math.cos(b.phi), 1e-9, 'd² = L₂² + L₃² + 2·L₂·L₃·cos φ con el φ que devuelve el motor');
}
{ // codo abajo: la otra solución alcanza el MISMO punto
  let nAb = 0, maxE = 0, distintas = 0;
  for (let i = 0; i < 80; i++) { const q = [uni(-1, 1), uni(-80, 0) * RAD, uni(0, 90) * RAD, uni(-1, 1), uni(-1.2, 1.2) - F.KAPPA, uni(-1, 1)], g = F.fk(q), Rt = g.R;
    const dn = F.ik(g.tcp, Rt, 'abajo', null), up = F.ik(g.tcp, Rt, 'arriba', null);
    if (dn.llega) { nAb++; maxE = Math.max(maxE, F.vnorma(F.vres(F.fk(dn.q).tcp, g.tcp)) + dn.errOri); if (Math.abs(dn.q[2] - up.q[2]) > 0.2) distintas++; } }
  ok(nAb > 50 && maxE < 1e-8, 'la solución de codo abajo llega al mismo punto y a la misma orientación', `${nAb}/80, error ${maxE.toExponential(1)}`);
  ok(distintas >= nAb * 0.9, 'codo arriba y codo abajo son soluciones distintas (J3 difiere)', `${distintas}/${nAb}`);
}

console.log('— Cinemática inversa: viaje de ida y vuelta —');
{ let nOk = 0, tot = 0, maxP = 0, maxO = 0, dentro = 0;
  for (let i = 0; i < 1500; i++) { const q = qAleatorio(); const g = F.fk(q); tot++;
    const rama = Math.sin(F.A3 - F.A2 + q[2]) <= 0 ? 'arriba' : 'abajo'; const r = F.ik(g.tcp, g.R, rama, null); if (!r.llega) continue; nOk++;
    const g2 = F.fk(r.q); maxP = Math.max(maxP, F.vnorma(F.vres(g2.tcp, g.tcp))); maxO = Math.max(maxO, F.vnorma(F.errRot(g2.R, g.R))); if (r.enLimites) dentro++; }
  ok(nOk / tot > 0.85, 'la IK (con la rama de la pose) encuentra solución en más del 85 % de poses aleatorias; el resto (≈ 10 %) son poses con el codo muy cerrado (J3 > 50°) y orientación arbitraria, que el motor no resuelve (límite declarado)', `${nOk}/${tot}`);
  ok(maxP < 1e-6 && maxO < 1e-6, 'la FK de la solución reproduce la posición y la orientación pedidas (< 1 µm)', `${maxP.toExponential(1)} m, ${maxO.toExponential(1)} rad`);
}
{ // continuidad a lo largo de una recta
  const Rt = F.orientacion(F.dirAprox(-10 * RAD, 0), 0); let qp = null, maxSalto = 0, n1 = 0;
  for (let k = 0; k <= 200; k++) { const p = [2.2 + 1.0 * k / 200, 1.1, -0.6 + 1.2 * k / 200], r = F.ik(p, Rt, 'arriba', qp); if (!r.llega) continue; if (qp) { n1++; for (let i = 0; i < 6; i++) maxSalto = Math.max(maxSalto, Math.abs(r.q[i] - qp[i])); } qp = r.q; }
  ok(n1 === 200 && maxSalto < 0.08, 'a lo largo de una recta de 1,5 m los ángulos varían sin saltos (≤ 0,08 rad por paso de 7,5 mm)', `${n1} pasos, salto máximo ${maxSalto.toFixed(4)} rad`);
}
{ const r = F.ik([6, 1, 0], F.orientacion([1, 0, 0], 0), 'arriba', null); ok(!r.llega, 'un punto a 6 m de la base queda fuera de alcance (llega = falso)');
  const r2 = F.ik([0.2, 1.0, 0.1], F.orientacion([1, 0, 0], 0), 'arriba', null); ok(!r2.llega || !r2.enLimites, 'un punto pegado al eje queda en la zona muerta (no llega o rompe un límite)'); }
{ const L = F.revisaLimites([0, -2.0, 0, 0, -F.KAPPA, 0]); ok(!L.ok && L.mal.join() === '1', 'J2 = −115° viola su carrera [−105°, 45°]');
  ok(F.revisaLimites([0, 0, 0, 0, 0, 0]).ok, 'la pose cero está dentro de todos los límites');
  ok(F.revisaLimites([0, 0, 0, 0, 125 * RAD - F.KAPPA, 0]).mal.join() === '4', 'J5 se limita por θ5 = q5 + κ: θ5 = 125° pasa del límite de 120°'); }
{ let maxE = 0;
  for (let i = 0; i < 300; i++) { const A = F.descompMuneca; const q4 = uni(-3, 3), q5 = uni(0.1, 1.5) - F.KAPPA, q6 = uni(-3, 3);
    const Rw = F.mmul(F.mmul(F.rotAx(F.A4, q4), F.Rz(q5)), F.Rx(q6)), q = A(Rw, null), R2 = F.mmul(F.mmul(F.rotAx(F.A4, q[0]), F.Rz(q[1])), F.Rx(q[2]));
    for (let k = 0; k < 9; k++) maxE = Math.max(maxE, Math.abs(R2[k] - Rw[k])); }
  ok(maxE < 1e-10, 'la descomposición de la muñeca reconstruye la orientación: R = Ra(q4)·Rz(q5)·Rx(q6)', maxE.toExponential(1)); }

console.log('— Singularidades y manipulabilidad —');
{ // muñeca recta: J4 ∥ J6 (casi-singularidad: los pivotes del modelo real tienen desvíos, det J no llega a cero)
  const q = [0.3, -0.4, 0.5, 0.7, -F.KAPPA, -0.2], w = F.manipulabilidad(q), q2 = q.slice(); q2[4] = -F.KAPPA + 40 * RAD;
  ok(w < 0.2 * F.manipulabilidad(q2), 'con θ₅ = 0 (muñeca recta) |det J| cae a menos de la quinta parte que con θ₅ = 40°', `${w.toFixed(2)} vs ${F.manipulabilidad(q2).toFixed(2)}`);
  ok(w / F.getRef() < F.IM_MIN, 'con θ₅ = 0 el índice de manipulabilidad queda por debajo del umbral del reto', (w / F.getRef()).toFixed(3));
  let mono = true, prev = Infinity; for (const t of [40, 20, 10, 4, 2, 1, 0.5, 0]) { const m = F.manipulabilidad([0, -0.5, 0.6, 0.4, -F.KAPPA + t * RAD, -0.4]); if (m > prev + 1e-12) mono = false; prev = m; }
  ok(mono, '|det J| decrece sin saltos al cerrar θ₅ de 40° a 0°');
  // brazo estirado: la mínima manipulabilidad del brazo está cerca de φ ≈ 0 (en el modelo, φ ≈ 3°, por el desvío lateral de la muñeca)
  let mn = Infinity, phiMn = 0; for (let p = 0; p <= 40; p += 0.1) { const m = F.manipulabilidad([0, -0.8, F.A2 - F.A3 - p * RAD, 0.1, 0.5, 0.2]); if (m < mn) { mn = m; phiMn = p; } }
  ok(phiMn < 6 && mn < 0.05, 'el mínimo de |det J| con el brazo casi estirado está en φ < 6° y es < 0,05 (casi singular)', `φ = ${phiMn.toFixed(1)}°, det = ${mn.toFixed(3)}`);
  ok(F.manipulabilidad([0, -0.8, F.A2 - F.A3 - Math.PI, 0.1, 0.5, 0.2]) < 0.01, 'con el brazo plegado (φ = 180°) det J ≈ 0'); }
{ // la velocidad articular crece al acercarse a cada casi-singularidad (J4/J6 con la muñeca; J2/J3 con el brazo)
  const v = (th) => { const w = F.velArticular([0, -0.5, 0.6, 0.4, -F.KAPPA + th * RAD, -0.4], [0, 0, 0.5]); return Math.max(Math.abs(w[3]), Math.abs(w[5])) / RAD; };
  ok(v(0) > 2 * v(40) && v(2) > v(10) && v(10) > v(40), 'q̇(J4,J6) crece al cerrar θ₅: más del doble con θ₅ = 0 que con 40°', `${v(40).toFixed(0)} → ${v(0).toFixed(0)} °/s con 0,5 m/s`);
  const w2 = (phi) => { const w = F.velArticular([0, -0.8, F.A2 - F.A3 - phi * RAD, 0.1, 0.5, 0.2], [0.3, 0, 0]); return Math.max(Math.abs(w[1]), Math.abs(w[2])) / RAD; };
  ok(w2(3) > 10 * w2(45) && w2(6) > w2(20) && w2(20) > w2(90), 'q̇(J2,J3) se dispara con el brazo casi estirado: a φ = 3° es más de 10 veces la de φ = 45°', `${w2(45).toFixed(0)} → ${w2(3).toFixed(0)} °/s con 0,3 m/s`); }
{ let maxR = 0, maxD = 0;
  for (let t = 0; t < 80; t++) { const q = qAleatorio(); if (F.manipulabilidad(q) < 0.3) continue; const v = [uni(-1, 1), uni(-1, 1), uni(-1, 1)], w = F.velArticular(q, v), J = F.jacobiano(F.fk(q));
    const xi = [v[0], v[1], v[2], 0, 0, 0]; for (let r = 0; r < 6; r++) { let s = 0; for (let j = 0; j < 6; j++) s += J[r][j] * w[j]; maxR = Math.max(maxR, Math.abs(s - xi[r])); } }
  ok(maxR < 1e-8, 'q̇ = J⁻¹·[v;0] cumple J·q̇ = [v;0] (80 poses)', maxR.toExponential(1));
  // q̇ coincide con la derivada temporal de la IK a lo largo de una recta
  const Rt = F.orientacion(F.dirAprox(-10 * RAD, 0), 0), p0 = [2.8, 1.1, 0.0], dir = [0, 0, 1], h = 1e-5; let qa = F.ik([p0[0], p0[1], p0[2] - h], Rt, 'arriba', null).q, qb = F.ik([p0[0], p0[1], p0[2] + h], Rt, 'arriba', qa).q, qm = F.ik(p0, Rt, 'arriba', qa).q;
  const num = qa.map((x, i) => (qb[i] - x) / (2 * h)), ana = F.velArticular(qm, dir); for (let i = 0; i < 6; i++) maxD = Math.max(maxD, Math.abs(num[i] - ana[i]));
  ok(maxD < 1e-4, 'q̇ de J⁻¹ = dq/dt de la IK a lo largo de una recta (6 articulaciones)', maxD.toExponential(1)); }
{ // peor caso por articulación contra fuerza bruta
  const q = [0.1, -0.5, 0.7, 0.3, 0.4 - F.KAPPA, -0.2], g = F.peorGanancia(q); let mx = [0, 0, 0, 0, 0, 0];
  for (let t = 0; t < 4000; t++) { let v = [uni(-1, 1), uni(-1, 1), uni(-1, 1)]; const nv = F.vnorma(v); v = v.map((x) => x / nv); const w = F.velArticular(q, v); for (let i = 0; i < 6; i++) mx[i] = Math.max(mx[i], Math.abs(w[i]) / RAD); }
  ok(mx.every((m, i) => m <= g[i] * 1.0001 && m >= g[i] * 0.97), 'el peor caso de cada articulación (norma de la fila de J⁻¹) es el máximo sobre 4000 direcciones', mx.map((m, i) => (m / g[i]).toFixed(3)).join(' ')); }
ok(F.getRef() === 6, 'el índice de manipulabilidad se normaliza con una referencia redonda (6)');
{ let mx = 0; const Rt = F.orientacion(F.dirAprox(0, 0), 0); const mapa = F.mapaAlcance({ incl: 0, nx: 60, ny: 48, rmax: 4.4, hmin: -0.2, hmax: 3.6 });
  for (let k = 0; k < mapa.est.length; k++) if (mapa.est[k] === 2) mx = Math.max(mx, F.manipulabilidad(F.ik([mapa.r0 + (mapa.r1 - mapa.r0) * ((k % 60) + 0.5) / 60, mapa.h0 + (mapa.h1 - mapa.h0) * (Math.floor(k / 60) + 0.5) / 48, 0], Rt, 'arriba', null).q));
  ok(mx <= 6 && mx / 6 > 0.7, 'el máximo muestreado de |det J| en el volumen de trabajo (≈ 4,9) cabe bajo la referencia 6 sin saturar', mx.toFixed(2)); }

console.log('— Volumen de trabajo —');
{ const mapa = F.mapaAlcance({ incl: 0, nx: 56, ny: 44, rmax: 4.4, hmin: -0.2, hmax: 3.6 }), Rt = F.orientacion(F.dirAprox(0, 0), 0); let malas2 = 0, nEst = [0, 0, 0];
  for (let k = 0; k < mapa.est.length; k += 7) { const i = k % mapa.nx, j = Math.floor(k / mapa.nx), rho = mapa.r0 + (mapa.r1 - mapa.r0) * (i + 0.5) / mapa.nx, h = mapa.h0 + (mapa.h1 - mapa.h0) * (j + 0.5) / mapa.ny;
    if (rho < 0.30) continue; const r = F.ik([rho, h, 0], Rt, 'arriba', null); const e = !r.llega ? 0 : (r.enLimites ? 2 : 1); nEst[e]++; if (e !== mapa.est[k]) malas2++; }
  ok(malas2 === 0, 'cada celda del mapa de alcance coincide con una cinemática inversa directa', `${malas2} discrepancias; celdas ${nEst.join('/')}`);
  // radio máximo a h = 1,1 m: bisección con la IK
  const j = Math.floor((1.1 - mapa.h0) / (mapa.h1 - mapa.h0) * mapa.ny); let rmax = 0; for (let i = 0; i < mapa.nx; i++) if (mapa.est[j * mapa.nx + i] === 2) rmax = mapa.r0 + (mapa.r1 - mapa.r0) * (i + 1) / mapa.nx;
  let a = 3, b = 4.4; for (let it = 0; it < 40; it++) { const m = (a + b) / 2; { const rr = F.ik([m, 1.1, 0], Rt, 'arriba', null); if (rr.llega && rr.enLimites) a = m; else b = m; } }
  ok(Math.abs(rmax - a) < 0.1, 'el radio máximo del mapa coincide con la bisección de la IK a la misma altura (±1 celda)', `mapa ${rmax.toFixed(2)} m, bisección ${a.toFixed(3)} m`);
  ok(a > 3.0 && a < F.D_MAX + 1.2, 'el alcance de la punta dentro de límites y sin choques (≈ 3,5 m a 1,1 m de altura) cabe entre 3,0 m y L₂+L₃+1,2 m', a.toFixed(3));
  ok(nEst[1] > 0 && nEst[0] > 0 && nEst[2] > 0, 'el mapa tiene las tres zonas: no llega, llega pero un límite lo impide, llega'); }
{ const m0 = F.mapaAlcance({ incl: 0, nx: 30, ny: 24 }), m1 = F.mapaAlcance({ incl: 0, hb: 0.5, nx: 30, ny: 24 }); let d = 0; const dj = Math.round(0.5 / ((m0.h1 - m0.h0) / m0.ny)); void dj;
  ok(m1.est.some((e, k) => e !== m0.est[k]), 'subir la base 0,5 m cambia el volumen de trabajo respecto de la pieza'); }

console.log('— La pasada y el reto —');
for (const e of F.ESCENARIOS) {
  const r = F.evaluaPasada(e, 1.8, 0, 0.6, 60); ok(!r.ok, `«${e.id}»: el ajuste inicial (D = 1,8 m, base 0, 0,6 m/s) NO cumple nada de fábrica`, JSON.stringify([r.okAlcance, r.okSing, r.okVel, r.okCiclo]));
  for (const hb of (e.id === 'umbral' ? [0, 0.2] : [0.2, 0.4])) {
    const wD = F.ventanaD(e, hb, 1.6), wV = wD ? F.ventanaV(e, (wD[0] + wD[1]) / 2, hb) : null;
    ok(!!wD && wD[0] > F.D_RANGO[0] + 0.3 && wD[1] < F.D_RANGO[1] - 0.2, `«${e.id}» hb ${hb}: la ventana de la distancia es INTERIOR`, JSON.stringify(wD));
    ok(!!wV && wV[0] > F.V_RANGO[0] + 0.3 && wV[1] < F.V_RANGO[1] - 0.2, `«${e.id}» hb ${hb}: la ventana de la velocidad es INTERIOR`, JSON.stringify(wV));
    if (wD) { ok(!F.evaluaPasada(e, wD[0] - 0.1, hb, 1.6, 60).ok, `«${e.id}» hb ${hb}: un poco más cerca que la ventana falla`); ok(!F.evaluaPasada(e, wD[1] + 0.1, hb, 1.6, 60).ok, `«${e.id}» hb ${hb}: un poco más lejos falla`); }
    if (wV) { ok(!F.evaluaPasada(e, (wD[0] + wD[1]) / 2, hb, wV[0] - 0.1, 60).ok, `«${e.id}» hb ${hb}: más lento que la ventana no rinde`); ok(!F.evaluaPasada(e, (wD[0] + wD[1]) / 2, hb, wV[1] + 0.1, 60).ok, `«${e.id}» hb ${hb}: más rápido que la ventana excede una articulación`); }
  }
  // tolerancia a la resolución: 40 puntos y 120 puntos dan el mismo veredicto en el centro de la ventana
  const wD = F.ventanaD(e, 0.2, 1.6), Dm = (wD[0] + wD[1]) / 2; ok(F.evaluaPasada(e, Dm, 0.2, 1.6, 40).ok === F.evaluaPasada(e, Dm, 0.2, 1.6, 120).ok, `«${e.id}»: el veredicto no depende de la resolución de la pasada`);
}
{ // la altura de la base cambia la ventana (es un mando útil, no decorativo)
  const e = F.escPorId('puerta'); const a = F.ventanaD(e, 0.0, 1.6), b = F.ventanaD(e, 0.6, 1.6); ok(a && b && (Math.abs(a[0] - b[0]) > 0.05 || Math.abs(a[1] - b[1]) > 0.05), 'la altura de la base mueve la ventana de la distancia', JSON.stringify([a, b])); }
{ // ritmo de la línea: por debajo de vTakt falla sólo por el ciclo
  const e = F.escPorId('puerta'), r = F.evaluaPasada(e, 2.8, 0.3, e.vTakt - 0.2, 60); ok(r.okAlcance && r.okSing && r.okVel && !r.okCiclo, 'con v < ritmo de la línea sólo falla el ciclo'); }
console.log('— Diagnósticos con firma propia —');
{ const ev = (c) => F.evaluaPasadaGen(c.A, c.B, c.incl, 0, c.hb, c.v, 120, undefined, c.yaw);
  const R = Object.fromEntries(CASOS_DX.map((c) => [c.k, ev(c)]));
  ok(CASOS_DX.length === 4 && new Set(CASOS_DX.map((c) => c.k)).size === 4, 'hay 4 diagnósticos distintos');
  ok(R.muneca.llegaTodo && R.muneca.limTodo && R.muneca.imMin < F.IM_MIN && R.muneca.velMal.includes(3) && R.muneca.peor[3] > 1.5 && R.muneca.peor[1] < 0.3 && R.muneca.peor[0] < 0.5, '«muñeca»: llega, índice bajo y sólo J4 (y J6) pasan de su velocidad; J1 y J2 tranquilas', `im ${R.muneca.imMin.toFixed(2)} peor ${R.muneca.peor.map((x) => x.toFixed(2)).join(' ')}`);
  ok(R.codo.llegaTodo && R.codo.limTodo && R.codo.imMin < F.IM_MIN && R.codo.velMal.includes(2) && R.codo.peor[0] < 0.3, '«codo»: llega, índice bajo y J3 pasa de su velocidad; J1 tranquila', `im ${R.codo.imMin.toFixed(2)} peor ${R.codo.peor.map((x) => x.toFixed(2)).join(' ')}`);
  ok(!R.alcance.llegaTodo && R.alcance.pts.some((p) => p.llega) && R.alcance.pts.some((p) => !p.llega), '«alcance»: parte de la costura llega y parte no');
  ok(R.rapida.llegaTodo && R.rapida.limTodo && R.rapida.imMin > F.IM_MIN && R.rapida.velMal.length >= 2 && R.rapida.ratioMax < 2.0, '«rápida»: llega, el índice se mantiene alto y varias articulaciones pasan de su velocidad', `im ${R.rapida.imMin.toFixed(2)} mal ${R.rapida.velMal.map((i) => 'J' + (i + 1)).join(',')}`);
  // que ningún diagnóstico pueda confundirse con otro por la señal del dock
  ok(R.rapida.imMin > 2 * R.muneca.imMin && R.rapida.imMin > 2 * R.codo.imMin, 'la firma de «rápida» (índice alto) se distingue de las dos singularidades (índice bajo)'); }
console.log('— Calcula y quiz —');
{ ok(CASOS_1.length === 10, '10 casos de cálculo a mano');
  for (const c of CASOS_1) { if (c.tipo === 'codo') { const phi = F.anguloCodo(c.d); cerca(F.distanciaCodo(phi), c.d, 1e-9, `caso «codo» d = ${c.d}: φ = acos(...) cierra con d(φ)`); ok(c.d > F.D_MIN && c.d < F.D_MAX, `caso «codo» d = ${c.d} está dentro del alcance de la muñeca`); } }
  ok(QUIZ.length === 3 && QUIZ.every((q) => q.mal.length === 3), 'el quiz tiene 3 preguntas de 4 opciones');
  const cuenta = [0, 0, 0, 0], N = 8000; for (let t = 0; t < N; t++) { const o = barajar([QUIZ[0].ok, ...QUIZ[0].mal]); cuenta[o.indexOf(QUIZ[0].ok)]++; }
  ok(cuenta.every((c) => Math.abs(c / N - 0.25) < 0.03), 'la respuesta correcta del quiz cae en cada posición ≈ 25 % de las veces', cuenta.map((c) => (c / N).toFixed(3)).join(' ')); }
console.log(`\n${n} comprobaciones, ${malas} fallos`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
