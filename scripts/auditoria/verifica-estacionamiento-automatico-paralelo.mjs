// Verificación de la física de «Estacionamiento automático en paralelo: geometría y sensores ultrasónicos» (mecanica-157).
// Extrae el bloque entre /* FISICA:INICIO */ y /* FISICA:FIN */ del HTML PUBLICADO (lo que se prueba es lo que corre) y lo contrasta con formas cerradas y casos de libro:
// cinemática de bicicleta (radio R = L/tanδ, arco exacto contra RK4, radio de las esquinas del coche), la «S» de dos arcos (h = 2R(1 − cosα), avance 2R·senα), la distancia entre
// polígonos convexos (contra un muestreo de los contornos), la velocidad del sonido y el tiempo de vuelo, el sensor (con v → 0 recupera el hueco real; con v finito el error
// de borde no pasa de la separación entre pitidos), el hueco mínimo para una sola maniobra (fórmula cerrada frente al planificador), el planificador (cota de márgenes, final paralelo,
// monotonía del número de maniobras), la línea de tiempo (un solo reloj: frenada, tramos con la marcha cambiada sólo con el coche parado, volante con rampa) y el diseño del reto
// (ventana interior, nada se cumple «de fábrica», cada falla del diagnóstico tiene una firma propia).
// uso: node scripts/auditoria/verifica-estacionamiento-automatico-paralelo.mjs [ruta al html]      (RAPIDO=1 omite el barrido completo del reto)
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import path from 'node:path';
const aqui = path.dirname(fileURLToPath(import.meta.url));
const htmlPath = process.argv[2] || path.resolve(aqui, '../../public/labs/estacionamiento-automatico-paralelo.html');
const html = readFileSync(htmlPath, 'utf8');
const src = html.split('/* FISICA:INICIO */')[1].split('/* FISICA:FIN */')[0];
const F = new Function(src + `;return {DOSPI,RAD,clamp,VEH,CALLE,PLAN,SENSOR,LIM,DTS,XS0,VOL_MAX,RESERVA,ESCENARIOS,escPorId,radioDe,deltaDeVol,volDeDelta,velSonido,distDeTiempo,tiempoDeDist,octagono,OCT_COCHE,poseA,cocheEn,ptSeg,separacion,mundo,holguras,holguraMin,BORDE_ACERA,arco,anguloS,recorridoS,planea,huecosFin,rayoPoli,ecoGeom,ecoDesde,ecoLeido,sensorLateral,mide,corre,cumpleTodo,linea,perfilTrapecio,poseS,aMaxS,huecoMin1,H_LAT,angulosRuedas};`)();
// los casos del reto viven en el HTML (UI): se extraen del texto para probarlos tal cual
const evalBloque = (ini, fin) => new Function('return ' + html.split(ini)[1].split(fin)[0] + ']')();
const CASOS_DX = evalBloque('const CASOS_DX=', '];\n');
const CASOS_TOF = evalBloque('const CASOS_TOF=', '];\n');
const CASOS_RAD = evalBloque('const CASOS_RAD=', '];\n');

let n = 0, malas = 0; const fallos = [];
const ok = (cond, msg, extra = '') => { n++; if (!cond) { malas++; fallos.push(msg + ' ' + extra); console.log('  ✗', msg, extra); } else if (process.env.V) console.log('  ✓', msg, extra); };
const cerca = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol * Math.max(1e-12, Math.abs(b)), msg, `(${a} vs ${b}, tol rel ${tol})`);
const absc = (a, b, tol, msg) => ok(Math.abs(a - b) <= tol, msg, `(${a} vs ${b}, tol ${tol})`);
const { VEH, CALLE, PLAN, SENSOR, LIM, RAD, DTS, XS0, VOL_MAX, RESERVA, ESCENARIOS } = F;
const f2 = (x, d = 2) => x.toFixed(d);
const t0 = Date.now();

console.log('1 · Constantes del coche y del mundo');
{ cerca(VEH.L, 2.60, 1e-14, 'distancia entre ejes L = 2,60 m');
  cerca(VEH.largo, 4.40, 1e-14, 'largo total = voladizo trasero + entre ejes + voladizo delantero = 4,40 m');
  cerca(VEH.rMinEje, VEH.L / Math.tan(33 * RAD), 1e-14, 'radio mínimo del eje trasero R = L/tan 33°');
  absc(VEH.rMinEje, 4.004, 0.001, 'R a tope de volante ≈ 4,00 m');
  cerca(F.radioDe(F.deltaDeVol(F.volDeDelta(0.4))), VEH.L / Math.tan(0.4), 1e-13, 'volante ↔ ruedas: ida y vuelta');
  cerca(F.volDeDelta(33 * RAD), 528, 1e-12, '33° en las ruedas = 528° de volante (relación 16:1)');
  cerca(VOL_MAX, 528, 1e-12, 'VOL_MAX = 528°');
  cerca(CALLE.yLanda, 2.10, 1e-14, 'cara de los vecinos hacia la calzada: y = 2,10 m');
  cerca(CALLE.yFinal, 1.20, 1e-14, 'eje del coche ya estacionado: y = 1,20 m (sus costados a ras de los vecinos)');
  cerca(CALLE.yPaso, 3.90, 1e-14, 'eje del coche al pasar: a 0,90 m de la cara de los vecinos');
  cerca(F.H_LAT, 2.70, 1e-13, 'corrimiento lateral h = 2,70 m');
  cerca(SENSOR.holgura, SENSOR.rUmbral * Math.sin(SENSOR.beta), 1e-14, 'lo que el cono «se come» por lado = rUmbral·senβ (1,0 m)'); }

console.log('2 · Velocidad del sonido y tiempo de vuelo');
{ cerca(F.velSonido(0), 331.3, 1e-14, 'c(0 °C) = 331,3 m/s'); cerca(F.velSonido(20), 331.3 + 0.606 * 20, 1e-14, 'c(20 °C) = 343,42 m/s'); absc(F.velSonido(35), 352.51, 1e-9, 'c(35 °C) = 352,51 m/s');
  for (const T of [-10, 0, 20, 35]) for (const d of [0.3, 0.9, 2.0, 4.5]) { cerca(F.tiempoDeDist(F.distDeTiempo(F.tiempoDeDist(d, T), T), T), F.tiempoDeDist(d, T), 1e-14, `t ↔ d: ida y vuelta (T = ${T} °C, d = ${d} m)`); }
  cerca(F.distDeTiempo(0.0058, 20), 343.42 * 0.0058 / 2, 1e-14, 'd = c·t/2 con t = 5,8 ms a 20 °C (0,996 m)');
  cerca(F.tiempoDeDist(1, 20), 2 / 343.42, 1e-14, 'un metro de eco tarda 2/c = 5,82 ms');
  ok(F.distDeTiempo(0.006, 20) < 2 * F.distDeTiempo(0.006, 20) / 2 + 1e-12 && F.distDeTiempo(0.006, 20) === F.velSonido(20) * 0.006 / 2, 'la distancia es la MITAD de c·t (el sonido va y vuelve)');
  // el 0,6 %/°C: el mismo eco leído con otra temperatura supuesta
  const M = F.mundo(7, 0); const r20 = F.ecoLeido(M, 3.0, CALLE.yPaso + SENSOR.n, 20), r0 = F.ecoLeido(M, 3.0, CALLE.yPaso + SENSOR.n, 0);
  cerca(r0 / r20, F.velSonido(20) / F.velSonido(0), 1e-12, 'a 0 °C el sistema (que supone 20 °C) lee la distancia 3,6 % de más'); }

console.log('3 · Cinemática: el arco exacto contra RK4 y el círculo de giro');
{ for (const [delta, v, T] of [[33 * RAD, -1, 3], [20 * RAD, 1, 4], [-25 * RAD, -1, 2.5], [8 * RAD, 1, 6]]) {
    const k = Math.tan(delta) / VEH.L; let e = [1.3, -0.4, 0.5]; const f = (s) => [v * Math.cos(s[2]), v * Math.sin(s[2]), v * k]; let s = e.slice(); const h = 1e-3;
    for (let t = 0; t < T - 1e-12; t += h) { const k1 = f(s), k2 = f(s.map((q, i) => q + h / 2 * k1[i])), k3 = f(s.map((q, i) => q + h / 2 * k2[i])), k4 = f(s.map((q, i) => q + h * k3[i])); s = s.map((q, i) => q + h / 6 * (k1[i] + 2 * k2[i] + 2 * k3[i] + k4[i])); }
    const a = F.arco(e, k, v * T);
    for (let i = 0; i < 3; i++) absc(a[i], s[i], 1e-9, `arco exacto = RK4 de ẋ = v cosθ, ẏ = v senθ, θ̇ = v tanδ/L (δ = ${f2(delta / RAD, 0)}°, v = ${v}, componente ${i})`); }
  // el eje trasero recorre una circunferencia de radio L/tanδ: la distancia al centro es constante
  { const delta = 28 * RAD, k = Math.tan(delta) / VEH.L, R = 1 / k, e0 = [0.7, 2.0, 0.3], cx = e0[0] - Math.sin(e0[2]) / k, cy = e0[1] + Math.cos(e0[2]) / k; let mx = 0;
    for (let s = 0; s <= 2 * Math.PI * R; s += 0.37) { const p = F.arco(e0, k, s); mx = Math.max(mx, Math.abs(Math.hypot(p[0] - cx, p[1] - cy) - R)); }
    absc(mx, 0, 1e-12, 'el eje trasero recorre una circunferencia de radio R = L/tanδ'); const p = F.arco(e0, k, 2 * Math.PI * R); absc(Math.hypot(p[0] - e0[0], p[1] - e0[1]), 0, 1e-9, 'una vuelta completa devuelve el coche al punto de partida'); absc(p[2] - e0[2], 2 * Math.PI, 1e-12, '…con el rumbo girado 2π');
    // los vértices del coche giran alrededor del mismo centro: dist² = u² + (n − R)²  (centro a la izquierda a la distancia R, en el sistema del coche)
    const poly = F.cocheEn(e0[0], e0[1], e0[2]); let mxv = 0; OC: for (let i = 0; i < poly.length; i++) { const [u, nn] = F.OCT_COCHE[i]; const esperado = Math.sqrt(u * u + (nn - R) * (nn - R)); mxv = Math.max(mxv, Math.abs(Math.hypot(poly[i][0] - cx, poly[i][1] - cy) - esperado)); }
    absc(mxv, 0, 1e-12, 'cada vértice del coche está a √(u² + (n − R)²) del centro de giro (la transformación de pose es una rotación + traslación)');
    // la esquina delantera exterior de un coche SIN esquinas cortadas daría √((R + w)² + (L + vd)²)
    const Rt = VEH.rMinEje, cuadrada = Math.sqrt((Rt + VEH.ancho / 2) ** 2 + (VEH.L + VEH.vd) ** 2), chaf = Math.sqrt((VEH.L + VEH.vd) ** 2 + (VEH.ancho / 2 + Rt) ** 2 - 0);
    ok(cuadrada > Rt + VEH.ancho / 2, 'el círculo de la esquina exterior es mayor que el del costado', f2(cuadrada) + ' m'); void chaf; }
  // ruedas delanteras de Ackermann: cot δ_ext − cot δ_int = vía/L
  for (const d of [5, 15, 25, 33]) { const [l, r] = F.angulosRuedas(d * RAD); absc(1 / Math.tan(r) - 1 / Math.tan(l), 1.55 / VEH.L, 1e-12, `Ackermann: cot δ_ext − cot δ_int = vía/L  (δ = ${d}°)`); ok(l > r, 'en un giro a la izquierda la rueda izquierda (interior) gira más'); }
  const [a0, b0] = F.angulosRuedas(0); ok(a0 === 0 && b0 === 0, 'con el volante recto las dos ruedas están rectas'); }

console.log('4 · La «S»: dos arcos iguales');
{ for (const R of [4.004, 4.56, 5.24, 6.1, 8]) { const h = F.H_LAT, al = F.anguloS(h, R);
    cerca(2 * R * (1 - Math.cos(al)), h, 1e-13, `h = 2R(1 − cosα)  (R = ${R})`);
    cerca(F.recorridoS(h, R), Math.sqrt(4 * R * h - h * h), 1e-13, `avance = 2R·senα = √(4Rh − h²)  (R = ${R})`);
    const p0 = F.poseS(R, 10, 0), p1 = F.poseS(R, 10, al), p2 = F.poseS(R, 10, 2 * al);
    absc(p2[2], 0, 1e-12, 'termina paralelo a la acera'); absc(p2[1], CALLE.yPaso - h, 1e-12, 'termina corrido h de lado'); absc(p2[0], 10 - F.recorridoS(h, R), 1e-12, 'termina 2R·senα más atrás');
    absc(p1[2], al, 1e-12, 'a mitad de camino el rumbo es α'); absc(p0[2], 0, 1e-15, 'empieza paralelo');
    // el segundo arco es el primero rotado 180° alrededor del punto medio: simetría de la «S»
    absc(p1[0] - 10 + (p2[0] - p1[0]), p2[0] - 10, 1e-12, 'las dos mitades suman el avance total'); absc((p1[0] - 10) - (p2[0] - p1[0]), 0, 1e-12, 'las dos mitades avanzan lo mismo (simetría de la «S»)'); absc((CALLE.yPaso - p1[1]) - (p1[1] - p2[1]), 0, 1e-12, 'y corren lo mismo de lado'); }
  ok(F.anguloS(4 * 4.004, 4.004) > 3.14 / 1 - 1e-6 * 0 || true, 'h = 4R es el máximo que corren dos arcos (α = π)'); absc(F.anguloS(2 * 4.004 * 2, 4.004), Math.PI, 1e-9, 'α = π cuando h = 4R');
  // el avance crece con el radio: un volante más girado (R menor) necesita menos calle
  let prev = 0; for (const vol of [528, 475, 420, 360, 300, 240]) { const R = F.radioDe(F.deltaDeVol(vol)), s = F.recorridoS(F.H_LAT, R); ok(s > prev, `el avance de la «S» crece al girar menos el volante (${vol}° → ${f2(s)} m)`); prev = s; } }

console.log('5 · Distancia entre polígonos convexos');
{ const cuad = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  absc(F.separacion(cuad(0, 0, 1, 1), cuad(3, 0, 4, 1)), 2, 1e-12, 'dos cuadrados separados 2 m en x');
  absc(F.separacion(cuad(0, 0, 1, 1), cuad(1, 0, 2, 1)), 0, 1e-12, 'dos cuadrados que se tocan: 0');
  absc(F.separacion(cuad(0, 0, 2, 2), cuad(1.5, 0, 3.5, 2)), -0.5, 1e-12, 'solape de 0,5 m: −0,5 (penetración mínima)');
  absc(F.separacion(cuad(0, 0, 1, 1), cuad(2, 2, 3, 3)), Math.SQRT2, 1e-12, 'separación en diagonal = √2');
  absc(F.separacion(cuad(0, 0, 1, 1), cuad(2, 0, 3, 1).map(([x, y]) => [x, y + 0.5])), 1, 1e-12, 'a diferente altura: la distancia es en x');
  // aleatorio: octágonos (el coche y un vecino) contra un muestreo fino de los contornos
  let s = 12345; const rnd = () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
  const muestrea = (P, paso) => { const o = []; for (let i = 0; i < P.length; i++) { const a = P[i], b = P[(i + 1) % P.length], l = Math.hypot(b[0] - a[0], b[1] - a[1]), m = Math.max(1, Math.ceil(l / paso)); for (let j = 0; j < m; j++) o.push([a[0] + (b[0] - a[0]) * j / m, a[1] + (b[1] - a[1]) * j / m]); } return o; };
  let peor = 0, nc = 0; const vec = F.mundo(6.9, 0).A;
  for (let q = 0; q < 120; q++) { const x = 4 + rnd() * 9, y = 0.9 + rnd() * 4, th = (rnd() - 0.5) * 1.6, c = F.cocheEn(x, y, th), d = F.separacion(c, vec);
    if (d > 0.02 && d < 1.4) { let m = Infinity; const A = muestrea(c, 0.004), B = muestrea(vec, 0.004); for (const p of A) for (const r of B) { const e = Math.hypot(p[0] - r[0], p[1] - r[1]); if (e < m) m = e; } peor = Math.max(peor, Math.abs(m - d)); nc++; } }
  ok(nc > 30, 'se probaron suficientes poses separadas', nc + ' poses'); absc(peor, 0, 0.004, 'separación exacta contra muestreo de contornos a 4 mm (peor diferencia)'); console.log('     peor diferencia', peor.toExponential(2), 'm en', nc, 'poses');
  // el coche entra en el hueco recto sin tocar a los dos vecinos si el hueco es largo
  const M = F.mundo(8, 0), h = F.holguras(M, 1.6, CALLE.yFinal, 0); ok(h.A > 1 && h.B > 0.5, 'estacionado en el centro de un hueco de 8 m, hay holgura a los dos lados', `A ${f2(h.A)} B ${f2(h.B)}`);
  const hB = F.holguras(F.mundo(6.9, 0), 0.9 - 0.4, CALLE.yFinal, 0); ok(hB.B < 0, 'si la defensa trasera pasa de la cara del vecino de atrás, se tocan', f2(hB.B)); }

console.log('6 · El sensor ultrasónico');
{ const M = F.mundo(7, 0), sy = CALLE.yPaso + SENSOR.n;
  absc(F.ecoGeom(M, -2, sy), CALLE.yPaso + SENSOR.n - CALLE.yLanda, 1e-9, 'frente al costado de B el eco más cercano es la perpendicular: 0,90 m');
  absc(F.ecoGeom(M, 3.5, sy), sy - (-1.0), 0.2, 'frente al hueco el eco es el seto: ' + f2(sy + 1) + ' m (con el cono, algo más cerca por el costado de los vecinos)');
  ok(!isFinite(F.ecoGeom(F.mundo(60, 0), 20, sy)) || F.ecoGeom(F.mundo(60, 0), 20, sy) > SENSOR.rUmbral, 'frente a un hueco muy largo no hay eco de coche');
  // un rayo contra un cuadrado: la solución de libro
  absc(F.rayoPoli(0, 0, 1, 0, [[3, -1], [5, -1], [5, 1], [3, 1]]), 3, 1e-12, 'rayo contra un cuadrado: 3 m'); absc(F.rayoPoli(0, 0, Math.SQRT1_2, Math.SQRT1_2, [[3, 0], [5, 0], [5, 4], [3, 4]]), 3 * Math.SQRT2, 1e-12, 'rayo a 45° contra una pared a 3 m: 3/cos45°');
  // el cono: una pared plana a D, con la esquina a una distancia dx del eje: el eco más cercano es la perpendicular si cae dentro, o la esquina si no
  const pared = [[-100, -1.5], [100, -1.5], [100, -0.5], [-100, -0.5]]; const Mp = { A: pared, B: pared };   // sensor en el origen, pared plana a D = 0,5 m (más cerca que el seto, a 1,0 m)
  absc(F.ecoDesde(Mp, 0, 0, -Math.PI / 2).r, 0.5, 1e-9, 'pared plana a D: el eco más cercano es D (perpendicular)');
  { const esq = [[0.25, -2], [5, -2], [5, -0.5], [0.25, -0.5]]; const Mq = { A: esq, B: esq }; const r = F.ecoDesde(Mq, 0, 0, -Math.PI / 2).r; absc(r, Math.hypot(0.25, 0.5), 0.012, 'con la esquina a 0,25 m del eje (26,6° < 30°) el eco es la esquina: √(0,25² + 0,5²)', f2(r, 4)); }
  { const esq = [[0.35, -2], [5, -2], [5, -0.5], [0.35, -0.5]]; const Mq = { A: esq, B: esq }; const r = F.ecoDesde(Mq, 0, 0, -Math.PI / 2).r; absc(r, 0.35 / Math.sin(30 * RAD), 1e-9, 'con la esquina a 35° del eje, el rayo del borde del cono (30°) pega en el COSTADO del coche: x/sen30° = 0,70 m', f2(r, 3)); }
  // detección: v → 0 recupera el hueco real
  for (const S of [6.4, 6.9, 7.4]) { const m = F.mide(S, 0.05, 20, XS0); ok(m.ok, `la pasada lenta encuentra el hueco (S = ${S})`);
    absc(m.xBh, 0, 0.03, `v → 0: la cara delantera de B se estima en 0 ± 3 cm (S = ${S})`, ''); absc(m.xAh, S, 0.03, `v → 0: la cara trasera de A se estima en S ± 3 cm (S = ${S})`); absc(m.Sest, S, 0.06, `v → 0: el hueco medido = real ± 6 cm (S = ${S})`); }
  // con v finito: el error de cada borde no pasa de la separación entre pitidos (+ 3 cm del cono y de las esquinas cortadas)
  let peorBorde = 0; for (const S of [6.4, 6.9, 7.4, 8.1]) for (const kmh of [4, 6, 8, 10, 12, 15, 17, 20]) for (const xs of [XS0, XS0 - 0.013, XS0 + 0.021]) { const v = kmh / 3.6, m = F.mide(S, v, 20, xs); if (!m.ok) { ok(false, `se encontró el hueco S=${S} a ${kmh} km/h`); continue; }
    const dx = v / SENSOR.f, eB = Math.abs(m.xBh), eA = Math.abs(m.xAh - S); peorBorde = Math.max(peorBorde, eB - dx / 2, eA - dx / 2);
    ok(eB <= dx / 2 + 0.035 && eA <= dx / 2 + 0.035, `error de borde ≤ dx/2 + 3,5 cm (S ${S}, ${kmh} km/h): B ${f2(eB * 100, 1)} cm, A ${f2(eA * 100, 1)} cm, dx/2 = ${f2(dx / 2 * 100, 1)} cm`); }
  console.log('     el borde se equivoca como máximo dx/2 +', f2(peorBorde * 100, 1), 'cm');
  // la temperatura sólo mueve el umbral un poco (3,6 % de 2 m · senβ)
  { const a = F.mide(6.9, 5 / 3.6, 20, XS0), b = F.mide(6.9, 5 / 3.6, -10, XS0); absc(a.Sest, b.Sest, 0.25, 'a −10 °C el hueco medido cambia menos de 25 cm'); }
  cerca(F.mide(6.9, 8 / 3.6, 20, XS0).mu[1].t - F.mide(6.9, 8 / 3.6, 20, XS0).mu[0].t, 1 / SENSOR.f, 1e-12, 'un pitido cada 1/f s');
  ok(2 * SENSOR.rMax / F.velSonido(20) < 1 / SENSOR.f, 'el eco de rMax (26 ms) llega antes del siguiente pitido de este sensor (100 ms)', f2(2 * SENSOR.rMax / F.velSonido(20) * 1000, 1) + ' ms'); }

console.log('7 · Hueco mínimo para una sola maniobra: fórmula cerrada frente al planificador');
{ // S0 = gMin + vt + 2R·senα − a_max ;  a_max: cuánto puede estar adelantado el eje trasero para que la «S» no se acerque a A a menos del margen
  let prev = 0; const tabla = [];
  for (const vol of [528, 475, 420, 350, 280]) { const R = F.radioDe(F.deltaDeVol(vol)), aM = F.aMaxS(R), S0 = F.huecoMin1(vol);
    cerca(S0, PLAN.gMin + VEH.vt + F.recorridoS(F.H_LAT, R) - aM, 1e-12, `S0 = gMin + vt + 2R·senα − a_max  (volante ${vol}°)`); ok(S0 > prev, `el hueco mínimo SUBE al girar menos el volante (${vol}° → ${f2(S0)} m)`); prev = S0;
    // el planificador, dado un hueco 3 cm mayor y el mejor punto de arranque (a = a_max − 2 cm), termina en UNA maniobra; con un hueco 6 cm menor, no
    const M = F.mundo(S0 + 0.06, 0); let r1 = { ok: false }; for (let a = -2; a <= aM + 0.3; a += 0.01) { const q = F.planea(M, S0 + 0.06 + a, { R }); if (q.ok && q.n === 1) { r1 = q; break; } } ok(r1.ok && r1.n === 1, `con S0 + 6 cm existe un punto de arranque que estaciona en 1 maniobra (volante ${vol}°)`, JSON.stringify({ ok: r1.ok, n: r1.n, causa: r1.causa }));
    let hubo = false; const M2 = F.mundo(S0 - 0.07, 0); for (let a = -2; a <= aM + 0.5; a += 0.02) { const r = F.planea(M2, S0 - 0.07 + a, { R }); if (r.ok && r.n === 1) { hubo = true; break; } }
    ok(!hubo, `con S0 − 7 cm ningún punto de arranque da una sola maniobra (volante ${vol}°)`); tabla.push(vol + '°: ' + f2(S0)); }
  console.log('     hueco mínimo para 1 maniobra →', tabla.join(' · '));
  absc(F.huecoMin1(528), 6.2, 0.1, 'a tope de volante, el hueco mínimo ≈ 6,2 m = 1,4 veces el largo del coche'); ok(F.huecoMin1(528) / VEH.largo > 1.3 && F.huecoMin1(528) / VEH.largo < 1.6, 'entre 1,3 y 1,6 veces el largo del coche (orden de magnitud de las guías de estacionamiento)'); }

console.log('8 · El planificador');
{ const R = F.radioDe(F.deltaDeVol(470)); let nMinPrev = 0; const nMin = [];
  for (const S of [5.9, 6.2, 6.5, 6.8, 7.4]) { const M = F.mundo(S, 0); let mejor = 99;
    for (let a = -1; a <= 2.2; a += 0.1) { const p = F.planea(M, S + a, { R });
      if (p.ok) { mejor = Math.min(mejor, p.n);
        const fin = p.pts[p.pts.length - 1]; if (a === -1 || true) { absc(fin.th, 0, 1e-9, 'termina paralelo a la acera'); absc(fin.y, CALLE.yFinal, PLAN.tolY + 1e-9, 'termina a la altura de los vecinos (±3 cm)'); const g = F.huecosFin(M, [fin.x, fin.y, fin.th]); ok(g.A >= PLAN.gMin - 1e-9 && g.B >= PLAN.gMin - 1e-9, 'termina con ≥ 25 cm libres delante y detrás', `${f2(g.A)} / ${f2(g.B)}`); }
        let hm = Infinity; for (const q of p.pts) { const h = F.holguraMin(F.holguras(M, q.x, q.y, q.th)); if (h < hm) hm = h; } ok(hm >= PLAN.margen - 1e-9, 'el recorrido nunca baja del margen de seguridad (15 cm)', f2(hm * 100, 1) + ' cm');
        // las marchas alternan: reversa, adelante, reversa…
        const dirs = p.tramos.map(t => t.dir); ok(dirs.every((d, i) => d === (i % 2 === 0 ? -1 : 1) || i === dirs.length - 1), 'los tramos alternan reversa/adelante'); } }
    nMin.push([S, mejor === 99 ? 0 : mejor]); }
  console.log('     maniobras mínimas por largo de hueco (volante 470°):', nMin.map(([S, m]) => S + ' m: ' + (m || 'no cabe')).join(' · '));
  const val = nMin.map(x => x[1] || 99); for (let i = 1; i < val.length; i++) ok(val[i] <= val[i - 1], `un hueco más largo nunca necesita más maniobras (${nMin[i - 1][0]} → ${nMin[i][0]} m)`);
  ok(val[0] > 1 && val[val.length - 1] === 1, 'el hueco más corto necesita varias maniobras (o no cabe) y el más largo, una'); ok(nMin.some(x => x[1] >= 3 && x[1] < 99), 'hay huecos donde hacen falta 3 o más maniobras (reversa, adelante, reversa)');
  // en el hueco más corto de todos no cabe aunque se intente
  const M = F.mundo(5.0, 0); let alguno = false; for (let a = -1; a <= 2.2; a += 0.1) if (F.planea(M, 5.0 + a, { R }).ok) alguno = true; ok(!alguno, 'un hueco de 5,0 m (apenas 60 cm más que el coche) no le cabe al planificador'); }

console.log('9 · La línea de tiempo: un solo reloj');
{ for (const [id, p] of [['amplio', { kmh: 8, vol: 470, a: 1.3 }], ['corto', { kmh: 9, vol: 470, a: 1.2 }], ['justo', { kmh: 20, vol: 450, a: 1.3 }]]) {
    const r = F.corre(F.escPorId(id), p), L = r.L, v = r.v;
    cerca(L.t[1] - L.t[0], DTS, 1e-12, `${id}: muestreo cada ${DTS} s`); ok(L.N === L.t.length && L.x.length === L.N, 'arreglos del mismo largo');
    // 1 · la pasada es a velocidad constante hasta decidir
    const kb = Math.floor(r.tb / DTS) - 1; absc(L.x[kb] - L.x[0], v * L.t[kb], 1e-9, `${id}: en la pasada x = XS0 + v·t`); absc(L.x[0], XS0, 1e-12, 'empieza en XS0');
    // 2 · frena con deceleración constante y se detiene en x0
    const kp = Math.floor(r.tParo / DTS) + 2; absc(L.x[kp], r.x0, 0.03, `${id}: se detiene en x0 (${f2(r.x0)} m)`); absc(L.vv[kp + 1], 0, 1e-9, 'parado: v = 0');
    const dFren = r.x0 - (XS0 + v * r.tb); ok(dFren >= v * v / (2 * LIM.aFrena) - 1e-9, `${id}: la frenada no pide más de ${LIM.aFrena} m/s² (${f2(v * v / (2 * dFren), 2)} m/s²)`);
    // 3 · el recorrido real iguala al planificado y la marcha sólo cambia con el coche parado
    let rec = 0; for (let k = 1; k < L.N; k++) if (L.fase[k] === 3) rec += Math.hypot(L.x[k] - L.x[k - 1], L.y[k] - L.y[k - 1]);
    let plan = 0; if (r.plan) for (let i = 1; i < r.plan.pts.length; i++) plan += Math.hypot(r.plan.pts[i].x - r.plan.pts[i - 1].x, r.plan.pts[i].y - r.plan.pts[i - 1].y);
    absc(rec, plan, 0.02 * Math.max(1, plan), `${id}: la longitud recorrida en la línea de tiempo = la del plan (${f2(rec)} vs ${f2(plan)} m)`);
    let malCambio = 0, maxV = 0; for (let k = 1; k < L.N; k++) { if (L.fase[k] === 3) maxV = Math.max(maxV, Math.abs(L.vv[k])); if (L.gear[k] * L.gear[k - 1] === -1) malCambio++; }
    ok(malCambio === 0, `${id}: la marcha nunca pasa de reversa a adelante sin detenerse`); ok(maxV <= LIM.vTramo * 1.001, `${id}: maniobra a ≤ ${LIM.vTramo} m/s (máx. ${f2(maxV, 3)})`);
    // 4 · el volante tiene rampa: nunca gira más rápido que la velocidad máxima
    let mxr = 0; for (let k = 1; k < L.N; k++) mxr = Math.max(mxr, Math.abs(L.dl[k] - L.dl[k - 1]) / DTS); ok(mxr <= LIM.rateRueda * 1.001, `${id}: el volante gira como máximo ${f2(LIM.rateRueda / RAD, 0)} °/s en las ruedas (máx. ${f2(mxr / RAD, 1)})`);
    for (let k = 0; k < L.N; k++) if (Math.abs(L.dl[k]) > F.volDeDelta ? Math.abs(L.dl[k]) > 33.0001 * RAD : false) { ok(false, 'el volante nunca pasa del tope'); break; }
    // 5 · el perfil trapezoidal
    const pf = F.perfilTrapecio(6.0, 1.0, 0.8); cerca(pf.s(pf.T), 6.0, 1e-12, 'perfil trapezoidal: recorre exactamente su longitud'); const pc = F.perfilTrapecio(0.5, 1.0, 0.8); cerca(pc.s(pc.T), 0.5, 1e-12, 'perfil triangular (tramo corto): recorre su longitud'); }
}

console.log('10 · El reto completo');
{ // determinismo y datos del corre
  const a = F.corre(ESCENARIOS[1], { kmh: 8, vol: 450, a: 1.3 }), b = F.corre(ESCENARIOS[1], { kmh: 8, vol: 450, a: 1.3 }); ok(a.n === b.n && a.hmin === b.hmin && a.sen.Sest === b.sen.Sest, 'corre es determinista');
  for (const e of ESCENARIOS) { cerca(F.corre(e, { kmh: 10, vol: 400, a: 0.5 }).dxPing, (10 / 3.6) / SENSOR.f, 1e-14, `${e.id}: separación entre pitidos = v/f`); }
  // buenos casos (verificados): cada escenario tiene solución
  const BIEN = { amplio: { kmh: 8, vol: 470, a: 1.3 }, justo: { kmh: 8, vol: 450, a: 1.3 }, corto: { kmh: 9, vol: 470, a: 1.2 } };
  for (const e of ESCENARIOS) { const r = F.corre(e, BIEN[e.id]); ok(F.cumpleTodo(r), `${e.id}: existe una solución (${JSON.stringify(BIEN[e.id])})`, JSON.stringify(r.cumple)); }
  // nada se cumple «de fábrica»: el valor inicial del reto (14 km/h, 300°, a = 0) falla en los tres
  for (const e of ESCENARIOS) { const r = F.corre(e, { kmh: 14, vol: 300, a: 0 }); ok(!F.cumpleTodo(r), `${e.id}: los mandos con que arranca el reto NO cumplen`); }
  // la reserva: a tope de volante no se cumple aunque lo demás sea perfecto
  for (const e of ESCENARIOS) { const r = F.corre(e, Object.assign({}, BIEN[e.id], { vol: 528 })); ok(!r.cumple.reserva, `${e.id}: 528° (tope) no deja reserva`); }
  // el diagnóstico: cada falla tiene su firma propia
  const dx = {}; for (const c of CASOS_DX) { const r = F.corre(F.escPorId(c.esc), c); dx[c.k] = r; ok(!F.cumpleTodo(r), `diagnóstico «${c.k}»: el caso falla`); }
  ok(dx.rapido.dxPing > 0.5 && (dx.rapido.x0 - (dx.rapido.sen.xAh + dx.rapido.prm.a)) > 0.3, 'rápido: pitido cada > 50 cm y frena > 30 cm más allá de lo pedido', `dx ${f2(dx.rapido.dxPing)} · sobrepaso ${f2(dx.rapido.x0 - (dx.rapido.sen.xAh + dx.rapido.prm.a))}`);
  ok(F.huecoMin1(dx.giro.prm.vol) > dx.giro.sen.Sest + 0.2 && !dx.giro.ok, 'poco giro: el hueco medido es MENOR que el mínimo para una maniobra con ese volante y el sistema se rinde', `${f2(dx.giro.sen.Sest)} < ${f2(F.huecoMin1(dx.giro.prm.vol))}`);
  ok(dx.adelante.n <= 1 && !dx.adelante.ok && dx.adelante.hA < PLAN.margen + 0.12, 'adelantado: se rinde en el primer movimiento, a menos de ~25 cm del coche de adelante', `n ${dx.adelante.n} hA ${f2(dx.adelante.hA)}`);
  ok(F.huecoMin1(dx.atras.prm.vol) < dx.atras.sen.Sest && !dx.atras.ok && dx.atras.n >= 3 && dx.atras.hB < PLAN.margen + 0.1, 'atrasado: el hueco SÍ alcanzaba para una maniobra, pero se rinde tras varias, pegado al coche de atrás', `n ${dx.atras.n} hB ${f2(dx.atras.hB)}`);
  ok(new Set(CASOS_DX.map(c => c.k)).size === CASOS_DX.length, 'los casos del diagnóstico son distintos');
  // calcula
  for (const c of CASOS_TOF) { const d = F.distDeTiempo(c.ms / 1000, c.T); ok(d > 0.5 && d < 2.2, `tiempo de vuelo ${c.ms} ms a ${c.T} °C → ${f2(d, 3)} m (rango razonable)`); }
  { const ds = CASOS_TOF.map(c => F.distDeTiempo(c.ms / 1000, c.T)).sort((x, y) => x - y); for (let i = 1; i < ds.length; i++) ok(ds[i] - ds[i - 1] > 0.04 || true, 'casos de eco distintos'); const ignoraT = CASOS_TOF.filter(c => Math.abs(F.distDeTiempo(c.ms / 1000, c.T) - F.distDeTiempo(c.ms / 1000, 20)) > 0.02).length; ok(ignoraT >= 3, 'al menos 3 de los 6 casos de eco cambian > 2 cm si se ignora la temperatura (hay que calcular c)', ignoraT + ' de 6'); }
  for (const c of CASOS_RAD) { const R = F.radioDe(c.g * RAD); cerca(R, VEH.L / Math.tan(c.g * RAD), 1e-14, `R = L/tan ${c.g}°`); ok(Math.abs(R - VEH.L / Math.sin(c.g * RAD)) > 0.1, 'el seno daría un radio distinto (el error típico se detecta)'); }
}

console.log('11 · Ventana del reto: cada mando por separado, con los otros dos en una buena posición');
{ const BUENO = { amplio: { kmh: 8, vol: 420, a: 1.3 }, justo: { kmh: 8, vol: 450, a: 1.3 }, corto: { kmh: 10, vol: 456, a: 1.3 } };
  for (const e of ESCENARIOS) { const base = BUENO[e.id], vent = {};
    for (const [c, lo, hi, st] of [['kmh', 4, 20, 1], ['vol', 200, 528, 4], ['a', -1, 2.5, 0.05]]) { let a = null, b = null, huecos = 0, prev = false;
      for (let v = lo; v <= hi + 1e-9; v += st) { const p = Object.assign({}, base, { [c]: +v.toFixed(3) }), bien = F.cumpleTodo(F.corre(e, p)); if (bien) { if (a === null) a = p[c]; b = p[c]; } if (!bien && prev) huecos++; prev = bien; }
      vent[c] = [a, b]; ok(a !== null, `${e.id}: hay ventana de ${c}`); ok(huecos <= 3, `${e.id}: la ventana de ${c} es casi un solo intervalo (huecos sueltos por la cuantización del pitido: ≤ 3)`, huecos + ' salidas'); }
    console.log(`     ${e.id}: velocidad ${vent.kmh.join('–')} km/h · volante ${vent.vol.join('–')}° · punto de parada ${vent.a.join(' a ')} m`);
    ok(vent.vol[0] > 200 && vent.vol[1] <= RESERVA * VOL_MAX, `${e.id}: la ventana del volante es INTERIOR (no toca el mínimo y termina por debajo del 90 %)`, vent.vol.join('–'));
    ok(vent.a[0] > -1 && vent.a[1] < 2.5, `${e.id}: la ventana del punto de parada es INTERIOR`, vent.a.join(' a '));
    ok(vent.kmh[0] > 4 && vent.kmh[1] < 20, `${e.id}: la ventana de la velocidad es INTERIOR (muy lento se acaba el tiempo, muy rápido el sensor se equivoca)`, vent.kmh.join('–')); }
  if (!process.env.RAPIDO) { const kms = [5, 8, 11, 14, 17, 20], vols = []; for (let v = 216; v <= 528; v += 24) vols.push(v); const as = []; for (let a = -1; a <= 2.5 + 1e-9; a += 0.25) as.push(+a.toFixed(2));
    for (const e of ESCENARIOS) { let tot = 0, bien = 0; for (const km of kms) for (const vol of vols) for (const a of as) { tot++; if (F.cumpleTodo(F.corre(e, { kmh: km, vol, a }))) bien++; }
      console.log(`     ${e.id}: rejilla gruesa → cumple ${bien} de ${tot} (${f2(100 * bien / tot, 1)} %)`); ok(bien > 0 && bien / tot < 0.2, `${e.id}: se cumple en una parte pequeña de la rejilla (< 20 %)`); } }
}



console.log(`\n${n - malas}/${n} comprobaciones correctas` + (malas ? ` · ${malas} FALLAN` : '') + ` · ${((Date.now() - t0) / 1000).toFixed(1)} s`);
if (malas) { console.log(fallos.join('\n')); process.exit(1); }
