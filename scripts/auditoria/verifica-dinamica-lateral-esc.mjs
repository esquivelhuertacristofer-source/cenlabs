// Verificación de la física del lab dinamica-lateral-esc: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, conservación (energía) y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-dinamica-lateral-esc.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { VEH, G, RAD, coefs, pacejka, vCritica, gananciaGuinada, guinadaDeseada, fuerzas, rk4, energiaCinetica, PISTA, pistaLargo, pistaPunto, pistaProyecta, nuevaCorrida, pasoCorrida, simula, velocidadLimite } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);

console.log('1 · Neumático de fórmula mágica');
{
  const mu = 0.9, c = coefs(1, mu), Fz = c.Fzf, D = mu * Fz;
  const h = 1e-5, pend = (pacejka(h, c.Bf, VEH.C, D, VEH.E) - pacejka(-h, c.Bf, VEH.C, D, VEH.E)) / (2 * h);
  prueba('pendiente en el origen = rigidez de deriva Cα (B·C·D)', rel(pend, c.Cf) < 1e-6, `${f(pend, 3)} vs ${f(c.Cf, 3)} N/rad`);
  let mx = 0, am = 0; for (let a = 0; a < 1.2; a += 1e-4) { const y = pacejka(a, c.Bf, VEH.C, D, VEH.E); if (y > mx) { mx = y; am = a; } }
  prueba('el pico de la fuerza es la adherencia μ·Fz', rel(mx, D) < 1e-6, `pico ${f(mx, 1)} N a α = ${f(am / RAD, 2)}° (μFz = ${f(D, 1)})`);
  const cola = pacejka(40, c.Bf, VEH.C, D, VEH.E), teo = D * Math.sin(VEH.C * Math.PI / 2);
  prueba('con deriva enorme cae a D·sen(C·π/2) (el neumático «desliza»)', rel(cola, teo) < 2e-3, `${f(cola / D, 4)} frente a ${f(teo / D, 4)} de μFz`);
  prueba('es impar: F(−α) = −F(α)', Math.abs(pacejka(0.1, c.Bf, VEH.C, D, VEH.E) + pacejka(-0.1, c.Bf, VEH.C, D, VEH.E)) < 1e-9);
  for (const m of [0.55, 0.25, 0.12]) { const c2 = coefs(1, m); prueba(`Cα ∝ μ: a μ = ${m} la rigidez es ${f(c2.Cf / c.Cf, 4)}× la del seco`, rel(c2.Cf / c.Cf, m / 0.9) < 1e-12); }
}

console.log('2 · Gradiente de subviraje y ganancia de guiñada');
{
  let peor = 0, n = 0;
  for (const K0 of [3, 2, 0.5, 0, -1, -1.5]) for (const mu of [0.9, 0.55, 0.25]) {
    const c = coefs(K0, mu);
    for (const kmh of [20, 40, 60, 80, 100]) {
      const V = kmh / 3.6; if (c.K < 0 && V >= 0.8 * vCritica(c.K)) continue;
      // régimen estacionario con volante pequeño y fijo; sin resistencia (la velocidad se mantiene)
      const d = 0.002 / gananciaGuinada(V, c.K), u = { delta: d, Fx: [0, 0, 0, 0] }; let s = { x: 0, y: 0, psi: 0, vx: V, vy: 0, r: 0 };   // volante tal que r ≈ 0,002 rad/s (régimen lineal)
      for (let i = 0; i < 20000; i++) s = rk4(s, u, c, 0.001, true);
      const gan = s.r / d, teo = gananciaGuinada(V, c.K); peor = Math.max(peor, rel(gan, teo)); n++;
    }
  }
  prueba(`r/δ simulado = V/(L + K·V²) en ${n} casos (K de −3 a +3 °/g, 3 adherencias, 20–100 km/h)`, peor < 5e-4, `peor error relativo ${peor.toExponential(2)}`);
  const c = coefs(2, 0.9), Kfor = (VEH.m / VEH.L) * (VEH.b / c.Cf - VEH.a / c.Cr);
  prueba('K0 pedido (°/g) se reproduce con K = (m/L)(b/Cf − a/Cr)', Math.abs(Kfor * G / RAD - 2) < 1e-9, `${f(Kfor * G / RAD, 6)} °/g`);
  const cn = coefs(0, 0.9); prueba('coche neutro (K0 = 0): K = 0 con a·Cf = b·Cr', Math.abs(cn.K) < 1e-15 && rel(VEH.a * cn.Cf, VEH.b * cn.Cr) < 1e-12);
  // K ∝ 1/μ
  prueba('K crece al bajar μ (K ∝ 1/μ): K(0,55)/K(0,9) = 0,9/0,55', rel(coefs(2, 0.55).K / coefs(2, 0.9).K, 0.9 / 0.55) < 1e-12);
}

console.log('3 · Velocidad crítica de sobreviraje');
{
  let peorV = 0, n = 0, estab = true;
  for (const K0 of [-0.5, -1, -1.5, -3]) for (const mu of [0.9, 0.55, 0.12]) {
    const c = coefs(K0, mu), Vc = vCritica(c.K);
    const det = V => { const { m, Iz, a, b } = VEH, cf = c.Cf, cr = c.Cr;
      const A11 = -(cf + cr) / (m * V), A12 = -(a * cf - b * cr) / (m * V) - V, A21 = -(a * cf - b * cr) / (Iz * V), A22 = -(a * a * cf + b * b * cr) / (Iz * V);
      return { det: A11 * A22 - A12 * A21, tr: A11 + A22 }; };
    let lo = 1, hi = 150; for (let i = 0; i < 200; i++) { const mid = (lo + hi) / 2; if (det(mid).det > 0) lo = mid; else hi = mid; }
    peorV = Math.max(peorV, rel(lo, Vc)); n++;
    if (!(det(0.9 * Vc).det > 0 && det(0.9 * Vc).tr < 0 && det(1.1 * Vc).det < 0)) estab = false;
  }
  prueba(`det(A) del sistema lineal se anula en V = √(−L/K) (${n} casos)`, peorV < 1e-9, `error relativo máx ${peorV.toExponential(2)}`);
  prueba('estable (det > 0, traza < 0) por debajo de V_crit e inestable (det < 0) por encima', estab);
  const c = coefs(-1.5, 0.9); prueba('ejemplo: K = −1,5 °/g → V_crit', rel(vCritica(c.K), Math.sqrt(-VEH.L / c.K)) < 1e-15, `${f(vCritica(c.K) * 3.6, 1)} km/h a μ = 0,9`);
  const c2 = coefs(-1.5, 0.12); prueba('V_crit baja con la adherencia (hielo < seco)', vCritica(c2.K) < vCritica(c.K), `${f(vCritica(c2.K) * 3.6, 1)} km/h a μ = 0,12`);
  prueba('un coche subvirador (K > 0) no tiene V_crit', vCritica(coefs(1, 0.9).K) === Infinity);
  // un coche sobrevirador por encima de V_crit diverge en la simulación lineal (pequeño volante y gran tiempo)
  const cc = coefs(-1.5, 0.9), Vc = vCritica(cc.K), u = { delta: 0.0005, Fx: [0, 0, 0, 0] };
  const corre = (V, T) => { let s = { x: 0, y: 0, psi: 0, vx: V, vy: 0, r: 0 }; for (let i = 0; i < T * 1000; i++) s = rk4(s, u, cc, 0.001, true); return Math.abs(s.r); };
  const g1 = corre(1.2 * Vc, 6) / corre(1.2 * Vc, 3), g0 = corre(0.5 * Vc, 6) / corre(0.5 * Vc, 3);
  prueba('con el volante fijo, por debajo de V_crit la guiñada se asienta (r(6 s)/r(3 s) ≈ 1); por encima se dispara (> 3×)', g0 < 1.01 && g1 > 3, `${f(g0, 4)}× y ${f(g1, 1)}×`);
}

console.log('4 · Conservación de la energía (sin ESC, sin acelerador, sin resistencia) a baja adherencia');
{
  for (const mu of [0.12, 0.25]) {
    const c = coefs(-1.5, mu); let s = { x: 0, y: 0, psi: 0, vx: 16, vy: 0, r: 0 }, W = 0, Pprev = null, monot = true; const E0 = energiaCinetica(s), h = 0.0005;
    const pot = (s, u) => { const F = fuerzas(s, u, c, true); const vyf = s.vy + VEH.a * s.r, vyr = s.vy - VEH.b * s.r;
      return -F.Fyf * Math.sin(u.delta) * s.vx + F.Fyf * Math.cos(u.delta) * vyf + F.Fyr * vyr; };
    let t = 0;
    while (t < 6) { const d = 0.1 * Math.sin(2 * Math.PI * 0.35 * t) + (t > 2 ? 0.12 : 0), u = { delta: d, Fx: [0, 0, 0, 0] };
      const P0 = pot(s, u); const s2 = rk4(s, u, c, h, true); const P1 = pot(s2, u); W += 0.5 * (P0 + P1) * h;     // potencia de las fuerzas de contacto
      if (P0 > 1e-6) monot = false; s = s2; t += h; }
    const dE = energiaCinetica(s) - E0;
    prueba(`μ = ${mu}: ΔE_cinética = ∫ P_neumáticos dt`, rel(dE, W) < 1e-4, `${f(dE / 1000, 4)} kJ frente a ${f(W / 1000, 4)} kJ (error ${(rel(dE, W)).toExponential(1)})`);
    prueba(`μ = ${mu}: los neumáticos sólo disipan (P ≤ 0 en todo el recorrido)`, monot);
  }
  // sin fuerzas laterales (volante recto, sin deriva) la energía se conserva exactamente
  const c = coefs(0, 0.9); let s = { x: 0, y: 0, psi: 0, vx: 20, vy: 0, r: 0 }; const E0 = energiaCinetica(s); for (let i = 0; i < 4000; i++) s = rk4(s, { delta: 0, Fx: [0, 0, 0, 0] }, c, 0.001, true);
  prueba('en recta y sin resistencia la energía y la velocidad no cambian', rel(energiaCinetica(s), E0) < 1e-14);
}

console.log('5 · Momento de guiñada y elipse de fricción');
{
  const c = coefs(1, 0.9), s = { x: 0, y: 0, psi: 0, vx: 20, vy: 0, r: 0 };
  const F0 = fuerzas(s, { delta: 0, Fx: [0, 0, 0, 0] }, c, true);
  for (const [i, nombre] of [[0, 'delantera izquierda'], [1, 'delantera derecha'], [2, 'trasera izquierda'], [3, 'trasera derecha']]) {
    const Fx = [0, 0, 0, 0]; Fx[i] = -1500;
    const F1 = fuerzas(s, { delta: 0, Fx }, c, true), esperado = (i % 2 === 0 ? 1 : -1) * 1500 * VEH.t / 2;
    prueba(`frenar la rueda ${nombre} con 1 500 N da ΔM = ${esperado > 0 ? '+' : '−'}F·t/2`, Math.abs((F1.Mz - F0.Mz) - esperado) < 1e-9, `${f(F1.Mz - F0.Mz, 3)} N·m`);
  }
  const Dw = c.mu * c.Fzr / 2, sD = { x: 0, y: 0, psi: 0, vx: 20, vy: 0.5, r: 0 };
  const Fa = fuerzas(sD, { delta: 0, Fx: [0, 0, 0, 0] }, c, true), Fb = fuerzas(sD, { delta: 0, Fx: [0, 0, 0.6 * Dw, 0.6 * Dw] }, c, true);
  prueba('con tracción trasera al 60 % de μFz la fuerza lateral trasera cae a √(1 − 0,6²) = 0,8', rel(Fb.Fyr / Fa.Fyr, 0.8) < 1e-12, f(Fb.Fyr / Fa.Fyr, 6));
  const cd = Math.cos(0.2), sd = Math.sin(0.2), Fd = fuerzas(sD, { delta: 0.2, Fx: [0, 0, 0, 0] }, c, true);
  prueba('con Fx = 0 el momento es a·Fyf·cosδ − b·Fyr', Math.abs(Fd.Mz - (VEH.a * Fd.Fyf * cd - VEH.b * Fd.Fyr)) < 1e-9);
  prueba('y la fuerza lateral total, Fyf·cosδ + Fyr', Math.abs(Fd.FyB - (Fd.Fyf * cd + Fd.Fyr)) < 1e-9);
}

console.log('6 · Orden del integrador (Runge–Kutta 4)');
{
  // transitorio libre (volante fijo, perturbación inicial): la entrada es constante, así que el error es sólo el del integrador
  const c = coefs(-1, 0.55), correT = h => { let s = { x: 0, y: 0, psi: 0, vx: 17, vy: 1.2, r: 0.25 }; const N = Math.round(2 / h);
    for (let i = 0; i < N; i++) s = rk4(s, { delta: 0.04, Fx: [0, 0, 0, 0] }, c, h, true); return s; };
  const ref = correT(0.00025), e = h => { const s = correT(h); return Math.hypot(s.x - ref.x, s.y - ref.y, 10 * (s.psi - ref.psi)); };
  const e1 = e(0.008), e2 = e(0.004), e3 = e(0.002);
  prueba('el error cae ≈ 16× al bajar h a la mitad (orden 4)', e1 / e2 > 8 && e2 / e3 > 8, `${f(e1 / e2, 1)}× y ${f(e2 / e3, 1)}× (errores ${e1.toExponential(1)}, ${e2.toExponential(1)}, ${e3.toExponential(1)} m)`);
}

console.log('7 · La pista');
{
  for (const R of [40, 70, 120]) {
    let maxSalto = 0, maxRumbo = 0, maxLong = 0, prev = pistaPunto(0, R), L = 0;
    const N = Math.round(pistaLargo(R) * 200);
    for (let i = 1; i <= N; i++) { const s = i / 200, p = pistaPunto(s, R); L += Math.hypot(p.x - prev.x, p.y - prev.y); maxSalto = Math.max(maxSalto, Math.hypot(p.x - prev.x, p.y - prev.y) - 1 / 200 * 1.0000001); maxRumbo = Math.max(maxRumbo, Math.abs(p.h - prev.h)); prev = p; }
    maxLong = Math.abs(L - pistaLargo(R));
    prueba(`R = ${R} m: la longitud de arco coincide con s (la pista está parametrizada por s)`, maxLong < 1e-2 && maxSalto < 1e-5, `|ΔL| = ${maxLong.toExponential(1)} m`);
  }
  let peor = 0;
  for (const R of [40, 70]) for (const s of [10, 59.9, 60.1, 75, 60 + R * Math.PI / 4, 60 + R * Math.PI / 2 - 0.1, 60 + R * Math.PI / 2 + 0.1, 60 + R * Math.PI / 2 + 20]) for (const d of [-2.5, -1, 0, 1.2, 2.7]) {
    const p = pistaPunto(s, R), x = p.x - d * Math.sin(p.h), y = p.y + d * Math.cos(p.h);
    const q = pistaProyecta(x, y, R, Math.max(0, s - 0.7)); peor = Math.max(peor, Math.abs(q.s - s), Math.abs(q.ey - d)); }
  prueba('la proyección recupera (s, desvío lateral) de puntos a ±2,7 m de la línea central', peor < 1e-5, `error máx ${peor.toExponential(1)}`);
}

console.log('8 · Conductor y ESC');
{
  const q = simula({ K0deg: 0.5, mu: 0.9, R: 120, V: 50 / 3.6, esc: false });
  prueba('conductor: a 50 km/h en seco el coche sigue la línea central (desvío máx < 0,3 m)', q.causa === 'ok' && q.maxEy < 0.3, `desvío máx ${f(q.maxEy, 3)} m · ${q.causa}`);
  for (const [K0, nombre, rueda, kmh] of [[2, 'subvirador', 2, 70], [-1.5, 'sobrevirador', 1, 66]]) {
    const q2 = nuevaCorrida({ K0deg: K0, mu: 0.55, R: 70, V: kmh / 3.6, esc: true }); const imp = [0, 0, 0, 0]; let n = 0;
    while (!q2.fin && n++ < 5000) { pasoCorrida(q2, 0.004); if (q2.esc.act) imp[q2.esc.rueda] += q2.esc.Fb * 0.004; }       // impulso de frenado de cada rueda (N·s)
    const dom = imp.indexOf(Math.max(...imp));
    prueba(`ESC en un coche ${nombre}: la rueda que más frena es la ${['delantera izquierda', 'delantera derecha', 'trasera izquierda', 'trasera derecha'][rueda]} (${rueda === 2 ? 'trasera interior' : 'delantera exterior'})`, dom === rueda, `impulsos ${imp.map(v => f(v, 0)).join(' · ')} N·s`);
  }
  const lim = guinadaDeseada(30, 0.3, 0, 0.12);
  prueba('r_des queda acotada por la adherencia: |r| ≤ μg/V', Math.abs(lim - 0.12 * G / 30) < 1e-12, f(lim, 5) + ' rad/s');
  prueba('r_des = V·δ/(L + K·V²) cuando la adherencia no la acota', Math.abs(guinadaDeseada(15, 0.01, 0.002, 0.9) - 15 * 0.01 / (VEH.L + 0.002 * 225)) < 1e-12);
}

console.log('9 · Lo que el ESC cambia (propiedades de ESCENARIO, no leyes): velocidad límite de entrada en una curva de R = 70 m');
{
  const filas = [];
  for (const [K0, mu] of [[-1.5, 0.9], [-1.5, 0.55], [-1.5, 0.25], [-1.5, 0.12], [0, 0.55], [2, 0.55], [2, 0.12]]) {
    const base = { K0deg: K0, mu, R: 70 }, off = velocidadLimite(base, false), on = velocidadLimite(base, true), c = coefs(K0, mu);
    filas.push({ K0, mu, off, on, Vc: c.K < 0 ? vCritica(c.K) * 3.6 : Infinity, Vn: Math.sqrt(mu * G * 70) * 3.6 });
    console.log(`     K0 ${K0 >= 0 ? '+' : ''}${K0} °/g · μ ${mu} · V_lím sin ESC ${off} km/h · con ESC ${on} km/h · (V_crit ${isFinite(filas.at(-1).Vc) ? f(filas.at(-1).Vc, 0) : '—'} · √(μgR) ${f(filas.at(-1).Vn, 0)})`);
  }
  prueba('en el sobrevirador mojado el ESC sube el límite en más de un 12 %', filas[1].on >= 1.12 * filas[1].off, `${filas[1].off} → ${filas[1].on} km/h`);
  prueba('el límite sin ESC baja con la adherencia (seco > mojado > nieve > hielo) en el sobrevirador', filas[0].off > filas[1].off && filas[1].off > filas[2].off && filas[2].off > filas[3].off);
  prueba('sin ESC, ningún coche supera √(μgR) (la física no se negocia)', filas.every(r => r.off <= r.Vn * 1.001));
  prueba('con ESC el límite no baja respecto de sin ESC en ningún escenario probado', filas.every(r => r.on >= r.off));
}
console.log(`\n${ok} pruebas bien, ${mal} mal`);
process.exit(mal ? 1 : 0);
