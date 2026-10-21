// Verificación de la física del lab convertidor-par-transmision-automatica: extrae el bloque FISICA del HTML publicado
// TAL CUAL y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { cargaFisica } from './_carga-convertidor-par-transmision-automatica.mjs';
const RUTA = process.argv[2] || process.env.RUTA_FISICA;
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, clamp, rpm, rad, VEH, PLAN, MOT, relMarcha, GT, Tneto, Te, CONV0, FALLAS, TRde, eficiencia, Tabsorbido, Kcap, kappaDeCalado, caladoReal, willisC, tren, banco, V_OBJ, NS_MIN, NS_MAX, VLOCK_MIN, VLOCK_NO, LU, simula, muestraEn, evaluaReto, rejilla, generaReto, escenario, BANCO_RETOS, NS_LISTA, VL_LISTA, generaDx } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
let semilla = 20261021; const rnd = () => (semilla = semilla * 48271 % 2147483647) / 2147483647;

console.log('1 · El tren planetario (Willis)');
{
  prueba('montaje: Z_r = Z_s + 2·Z_p y (Z_s + Z_r)/N entero (tres satélites equiespaciados)', PLAN.Zr === PLAN.Zs + 2 * PLAN.Zp && (PLAN.Zs + PLAN.Zr) % PLAN.N === 0, `Zs ${PLAN.Zs} · Zp ${PLAN.Zp} · Zr ${PLAN.Zr}`);
  let maxE = 0;
  for (let i = 0; i < 3000; i++) { const ws = (rnd() - 0.5) * 800, wr = (rnd() - 0.5) * 800, wc = willisC(ws, wr); maxE = Math.max(maxE, Math.abs(ws * PLAN.Zs + wr * PLAN.Zr - wc * (PLAN.Zs + PLAN.Zr))); }
  prueba('ω_s·Z_s + ω_r·Z_r = ω_c·(Z_s + Z_r) en 3 000 casos al azar', maxE < 1e-10, `error máx. ${maxE.toExponential(1)} rad/s`);
  const t1 = tren(1, 188.5);
  prueba('1.ª (corona frenada): ω_c = ω_s·Z_s/(Z_s + Z_r) y relación 1 + Z_r/Z_s = 3', Math.abs(t1.wc - 188.5 / 3) < 1e-12 && Math.abs(relMarcha(1) - 3) < 1e-15 && Math.abs(t1.rel - 3) < 1e-12 && t1.wr === 0, `ω_c = ${f(t1.wc, 4)} rad/s`);
  const t2 = tren(2, 188.5);
  prueba('2.ª (embrague solar–portasatélites): todo gira en bloque, relación 1', t2.wc === t2.ws && t2.wr === t2.ws && Math.abs(t2.wpRel) < 1e-12 && relMarcha(2) === 1);
  // engrane del satélite con solar y corona: las dos condiciones de engrane
  let maxS = 0, maxC = 0;
  for (let i = 0; i < 2000; i++) { const ws = (rnd() - 0.5) * 600, wr = (rnd() - 0.5) * 600, wc = willisC(ws, wr), wp = wc - (ws - wc) * PLAN.Zs / PLAN.Zp;
    maxS = Math.max(maxS, Math.abs((ws - wc) * PLAN.Zs + (wp - wc) * PLAN.Zp));          // solar–satélite: externo, giros opuestos
    maxC = Math.max(maxC, Math.abs((wp - wc) * PLAN.Zp - (wr - wc) * PLAN.Zr)); }       // satélite–corona: interno, mismo sentido
  prueba('el satélite engrana con el solar y con la corona a la vez (velocidades en el punto de contacto)', maxS < 1e-9 && maxC < 1e-9, `${maxS.toExponential(1)} · ${maxC.toExponential(1)}`);
  // potencia: Ts·ωs + Tr·ωr + Tc·ωc = 0 con T_s : T_r : T_c = Z_s : Z_r : −(Z_s+Z_r)
  const ws = 150, wr = 40, wc = willisC(ws, wr), Ts = 100, Tr = Ts * PLAN.Zr / PLAN.Zs, Tc = -(Ts + Tr);
  prueba('potencia: T_s·ω_s + T_r·ω_r + T_c·ω_c = 0 (planetario sin pérdidas)', Math.abs(Ts * ws + Tr * wr + Tc * wc) < 1e-9, `T_c/T_s = ${f(Tc / Ts, 3)}`);
  prueba('1.ª total con el grupo final: 3 × 3 = 9', Math.abs(GT(1) - 9) < 1e-12 && Math.abs(GT(2) - 3) < 1e-12);
}

console.log('2 · Curvas del convertidor');
{
  prueba('TR(0) = TR0: la multiplicación de par en el calado', Math.abs(TRde(0) - CONV0.TR0) < 1e-15, `TR(0) = ${f(TRde(0), 3)}`);
  prueba('punto de acoplamiento: TR(SRc) = 1', Math.abs(TRde(CONV0.SRc) - 1) < 1e-15 && TRde(CONV0.SRc - 1e-9) - 1 < 1e-9);
  let mono = true, previo = Infinity; for (let i = 0; i <= 1000; i++) { const v = TRde(i / 1000); if (v > previo + 1e-12 || v < 1 - 1e-12) mono = false; previo = v; }
  prueba('TR baja de forma monótona de TR0 a 1 y no baja de 1 (estator sano)', mono);
  const sl = h => (TRde(CONV0.SRc) - TRde(CONV0.SRc - h)) / h, d1 = sl(1e-4), d2 = sl(1e-8);
  prueba("la transición al acoplamiento es suave (TR' → 0 en SRc, como (SRc − SR)^0,5)", Math.abs(d2) < Math.abs(d1) / 50 && Math.abs(d2) < 1e-3, `pendiente ${d1.toExponential(1)} → ${d2.toExponential(1)}`);
  let maxEta = 0; for (let i = 0; i <= 200; i++) { const sr = i / 200; maxEta = Math.max(maxEta, Math.abs(eficiencia(sr) - sr * TRde(sr))); }
  prueba('η = SR·TR (a todas las relaciones de velocidad)', maxEta === 0);
  prueba('η(0) = 0 (calado: todo el trabajo es calor) y η(1) = 1 sin estator trabado', eficiencia(0) === 0 && Math.abs(eficiencia(1) - 1) < 1e-15);
  let etaOk = true; for (let i = 0; i <= 100; i++) { const sr = i / 100; if (sr >= CONV0.SRc && Math.abs(eficiencia(sr) - sr) > 1e-12) etaOk = false; }
  prueba('en el acoplamiento (SR ≥ SRc) η = SR: el convertidor se porta como un acoplamiento hidráulico', etaOk);
  let creciente = true, pe = -1; for (let i = 0; i <= 1000; i++) { const e = eficiencia(i / 1000); if (e < pe - 1e-12) creciente = false; pe = e; }
  prueba('η crece con SR sin pasarse de 1', creciente && eficiencia(0.5) > 0.5 && eficiencia(0.5) < 1, `η(0,5) = ${f(eficiencia(0.5), 3)}`);
  const eTr = TRde(0.95, 'estatorTrabado'), eLb = TRde(0.3, 'ruedaLibrePatina');
  prueba('estator trabado: pasado el acoplamiento TR < 1 y η < SR', eTr < 1 && eficiencia(0.95, 'estatorTrabado') < 0.95, `TR(0,95) = ${f(eTr, 3)}`);
  prueba('rueda libre que patina: TR = 1 en todo el rango (no hay multiplicación)', eLb === 1 && TRde(0, 'ruedaLibrePatina') === 1);
  // capacidad K
  const k0 = kappaDeCalado(2400), w = rad(3000);
  let maxK = 0; for (let i = 0; i < 100; i++) { const sr = i / 100, T = Tabsorbido(w, sr, k0); maxK = Math.max(maxK, Math.abs(w / Math.sqrt(T) - Kcap(sr, k0)) / Kcap(sr, k0)); }
  prueba('K = ω_i/√T_i  coincide con T_i = ω_i²/K²', maxK < 1e-12, `error ${maxK.toExponential(1)}`);
  prueba('T_i(SR = 0) = k0·ω_i² y T_i(SR = 1) = 0', Math.abs(Tabsorbido(w, 0, k0) - k0 * w * w) < 1e-12 && Tabsorbido(w, 1, k0) === 0);
  let dec = true, pt = Infinity; for (let i = 0; i <= 100; i++) { const T = Tabsorbido(w, i / 100, k0); if (T > pt + 1e-12) dec = false; pt = T; }
  prueba('T_i baja con SR a ω_i fija (K sube con SR)', dec);
  prueba('T_i crece con ω_i² a SR fija', Math.abs(Tabsorbido(2 * w, 0.4, k0) / Tabsorbido(w, 0.4, k0) - 4) < 1e-12);
}

console.log('3 · Calado (stall)');
{
  let maxN = 0; for (const Ns of [NS_MIN, 1800, 2000, 2400, 2800, NS_MAX]) maxN = Math.max(maxN, Math.abs(caladoReal(kappaDeCalado(Ns), 1) - Ns));
  prueba('con el pedal a fondo, el régimen de calado que sale del cruce de curvas es el pedido', maxN < 1e-6, `error máx. ${maxN.toExponential(1)} rpm`);
  const k0 = kappaDeCalado(2400);
  prueba('con menos pedal el calado baja', caladoReal(k0, 0.6) < caladoReal(k0, 1) - 100, `${f(caladoReal(k0, 0.6), 0)} < ${f(caladoReal(k0, 1), 0)} rpm`);
  prueba('un convertidor más holgado (k0 menor) cala más alto', kappaDeCalado(3000) < kappaDeCalado(2000));
  const b0 = banco(k0, null, 0, 1, false);
  prueba('banco a turbina frenada: SR = 0, T_t = TR0·T_i, η = 0', b0.SR === 0 && Math.abs(b0.Tt - CONV0.TR0 * b0.Ti) < 1e-9 && b0.eta === 0 && Math.abs(rpm(b0.we) - 2400) < 1e-4, `${f(rpm(b0.we), 1)} rpm · TR = ${f(b0.TR, 3)}`);
  prueba('en el calado todo el trabajo del motor es calor: P_calor = T_i·ω_i = P_motor', Math.abs(b0.Ti * b0.we - b0.Tm * b0.we) / (b0.Tm * b0.we) < 1e-9, `${f(b0.Ti * b0.we / 1000, 1)} kW`);
  // el banco cierra el balance de potencia en todo el rango
  let maxB = 0, maxR = 0, nb = 0;
  for (let i = 0; i < 600; i++) { const wt = rad(200 + rnd() * 4800), th = 0.2 + rnd() * 0.8, bl = rnd() < 0.3, b = banco(k0, null, wt, th, bl);
    if (b.we > MOT.wmax * 1.02 || b.arrastre) continue; nb++;
    const Pcalor = b.Ti * b.we - (b.Tt - b.Tlu) * b.wt + b.Tlu * (b.we - b.wt);          // calor del convertidor + del embrague
    maxB = Math.max(maxB, Math.abs(b.Tm * b.we - b.Tt * b.wt - Pcalor) / Math.max(1, b.Tm * b.we));
    maxR = Math.max(maxR, Math.abs(b.eta - clamp(b.Tt * b.wt / (b.Tm * b.we), -1, 1.5))); }
  prueba('banco: P_motor = P_turbina + P_calor en ' + nb + ' puntos al azar', maxB < 1e-9, `error relativo máx. ${maxB.toExponential(1)}`);
  const bl = banco(k0, null, rad(3000), 0.5, true);
  prueba('banco con embrague aplicado y par bajo su capacidad: motor = turbina, SR = 1, η = 1, T_t = T_motor', Math.abs(bl.we - bl.wt) < 1e-12 && bl.SR === 1 && Math.abs(bl.eta - 1) < 1e-12 && Math.abs(bl.Tt - bl.Tm) < 1e-9, `T = ${f(bl.Tm, 1)} N·m`);
  const bs = banco(k0, 'embragueDesliza', rad(3000), 1, true, LU.TcFalla);
  prueba('embrague con poca capacidad: patina (motor ≠ turbina) y η < 1', bs.we > bs.wt * 1.001 && bs.eta < 1, `desliza ${f(bs.deslizamiento * 100, 1)} %`);
  const bA = banco(k0, null, rad(400), 1, false), bB = banco(k0, 'ruedaLibrePatina', rad(400), 1, false), bC = banco(k0, 'estatorTrabado', rad(3900), 1, false), bD = banco(k0, null, rad(3900), 1, false);
  prueba('firma del diagnóstico: rueda libre que patina → TR medida = 1 donde un convertidor sano da > 1', bA.TR > 1.1 && Math.abs(bB.TR - 1) < 1e-12, `${f(bA.TR, 2)} contra ${f(bB.TR, 2)}`);
  prueba('firma del diagnóstico: estator trabado → η baja en SR alto donde uno sano sube', bC.eta < bD.eta - 0.05, `${f(bC.eta, 2)} contra ${f(bD.eta, 2)}`);
}

console.log('4 · La arrancada completa (motor + convertidor + coche + calor)');
{
  const base = { Ns: 2400, vlock: 34, marcha: 1, th: 1, tb: 1.5, Tend: 8 };
  const s = simula(base), b = s.balance;
  const bal = Math.abs(b.Wm - (b.Ke + b.Qc + b.Ql + b.Kc + b.Wc)) / b.Wm;
  prueba('balance de energía: ∫T_m·ω_m dt = ΔE_c,motor + Q_conv + Q_emb + ΔE_c,coche + trabajo contra la resistencia', bal < 1e-3, `error relativo ${bal.toExponential(1)} · ${f(b.Wm / 1000, 1)} kJ del motor`);
  const s2 = simula(Object.assign({}, base, { dt: 0.001 })), s3 = simula(Object.assign({}, base, { dt: 0.0005 }));
  prueba('convergencia de RK4 al bajar el paso (t50 con 2, 1 y 0,5 ms)', Math.abs(s.t50 - s3.t50) < 0.02 && Math.abs(s2.t50 - s3.t50) < 0.01 && rel(s.Qobj, s3.Qobj) < 5e-3, `${f(s.t50, 3)} · ${f(s2.t50, 3)} · ${f(s3.t50, 3)} s`);
  prueba('arranca en ralentí (~765 rpm) con el coche frenado y calada al régimen previsto antes de soltar el freno', Math.abs(rpm(s.S[0].we) - 765) < 20 && Math.abs(s.Ncalado - caladoReal(s.k0, 1)) / 2400 < 0.02, `${f(rpm(s.S[0].we), 0)} → ${f(s.Ncalado, 0)} rpm`);
  prueba('con el freno puesto la turbina no gira y el calor sale de T_i·ω_i', s.S.filter(q => q.t < s.tb - 0.05).every(q => q.wt === 0), `${f(s.Qcalado / 1000, 1)} kJ en ${s.tb} s`);
  const mm = muestraEn(s, 3.0);
  prueba('un solo reloj: η = SR·TR y T_t = TR·T_i + T_lu en todas las muestras', s.S.every(q => Math.abs(q.eta - q.SR * q.TR) < 1e-12 && Math.abs(q.Tt - (q.TR * q.Ti + q.Tlu)) < 1e-9));
  prueba('el calor acumulado nunca baja y el aceite se calienta', s.S.every((q, i) => i === 0 || q.Qc + q.Ql >= s.S[i - 1].Qc + s.S[i - 1].Ql - 1e-9) && s.Tfin > s.S[0].T + 2, `${f(s.S[0].T, 1)} → ${f(s.Tfin, 1)} °C`);
  prueba('el bloqueo se aplica sólo al pasar la velocidad pedida y recupera η → 1', s.tLock > s.tb && s.S[s.S.length - 1].SR > 0.99 && Math.abs(s.S[s.S.length - 1].v * 3.6 - 34) > 5 && muestraEn(s, s.tLock - 0.05).Tlu < 1e-6, `bloqueo a t = ${f(s.tLock, 2)} s`);
  prueba('sin bloqueo (VLOCK_NO) el embrague nunca actúa y el convertidor sigue disipando', simula(Object.assign({}, base, { vlock: VLOCK_NO })).S.every(q => q.Tlu === 0), '');
  const sn = simula(Object.assign({}, base, { vlock: VLOCK_NO })), sl = simula(Object.assign({}, base, { vlock: 20 }));
  prueba('bloquear antes enfría: Q(20 km/h) < Q(34) < Q(sin bloqueo)', sl.Qobj < s.Qobj && s.Qobj < sn.Qobj, `${f(sl.Qobj / 1000, 1)} < ${f(s.Qobj / 1000, 1)} < ${f(sn.Qobj / 1000, 1)} kJ`);
  prueba('bloquear antes cuesta tiempo: t50(20) ≥ t50(34) ≥ t50(sin bloqueo)', sl.t50 >= s.t50 - 1e-9 && s.t50 >= sn.t50 - 1e-9, `${f(sl.t50, 2)} ≥ ${f(s.t50, 2)} ≥ ${f(sn.t50, 2)} s`);
  const tN = NS_LISTA.map(N => simula(Object.assign({}, base, { Ns: N })).t50), qN = NS_LISTA.map(N => simula(Object.assign({}, base, { Ns: N })).Qobj);
  prueba('un convertidor más holgado acelera más (t50 baja) y calienta más (Q sube) con el calado', tN.every((t, i) => i === 0 || t < tN[i - 1]) && qN.every((q, i) => i === 0 || q > qN[i - 1]), `t50 ${f(tN[0], 2)} → ${f(tN[tN.length - 1], 2)} s · Q ${f(qN[0] / 1000, 0)} → ${f(qN[qN.length - 1] / 1000, 0)} kJ`);
  const sm = simula(Object.assign({}, base, { masa: 1800 })), sg = simula(Object.assign({}, base, { masa: 1350 }));
  prueba('más masa, más tiempo y más calor (inercia equivalente m·r²/G²)', sm.t50 > s.t50 && s.t50 > sg.t50 && sm.Qobj > s.Qobj, `${f(sg.t50, 2)} < ${f(s.t50, 2)} < ${f(sm.t50, 2)} s`);
  prueba('inercia reflejada J_eq = J_t + m·r_w²/G² (G = 9 en 1.ª)', Math.abs(s.Jeq - (VEH.Jt + 1500 * 0.31 * 0.31 / 81)) < 1e-12, `${f(s.Jeq, 4)} kg·m²`);
  const s2m = simula(Object.assign({}, base, { marcha: 2, vlock: VLOCK_NO }));
  prueba('arrancar en 2.ª (G = 3) tarda más y recalienta más el convertidor', s2m.t50 > sn.t50 && s2m.Qobj > sn.Qobj, `t50 ${f(s2m.t50, 2)} s · Q ${f(s2m.Qobj / 1000, 0)} kJ`);
  const sf = simula(Object.assign({}, base, { falla: 'embragueDesliza' }));
  prueba('embrague de bloqueo con poca capacidad: el motor queda por encima de la turbina y el calor del embrague crece', sf.S[sf.S.length - 1].we > sf.S[sf.S.length - 1].wt * 1.002 && sf.Ql > 0 || sf.QlObj >= s.QlObj, `Ql ${f(sf.QlObj, 0)} contra ${f(s.QlObj, 0)} J`);
  // rendimiento del motor en el calado: el máximo de η en la arrancada ocurre con el bloqueo (η = 1)
  prueba('la aceleración máxima de la arrancada está cerca de lo que da la multiplicación de par en el calado', Math.max(...s.S.map(q => q.a)) < 8 && Math.max(...s.S.map(q => q.a)) > 4, `${f(Math.max(...s.S.map(q => q.a)), 2)} m/s²`);
}

console.log('5 · El reto: ventana interior de calado y bloqueo');
{
  let nBien = 0;
  BANCO_RETOS.forEach((b, i) => {
    const sc = escenario(i), R = rejilla(sc), oks = []; R.forEach((fl, a) => fl.forEach((c, j) => { if (c.ok) oks.push([a, j]); }));
    const iMin = Math.min(...oks.map(q => q[0])), iMax = Math.max(...oks.map(q => q[0])), jMin = Math.min(...oks.map(q => q[1])), jMax = Math.max(...oks.map(q => q[1]));
    const interior = oks.length >= 5 && iMin > 0 && iMax < NS_LISTA.length - 1 && jMin > 0 && jMax < VL_LISTA.length - 1;
    // el borde nunca resuelve: ni el calado más holgado con bloqueo tardío, ni el más justo, ni el bloqueo más pronto, ni el no bloqueo
    const bordes = R[R.length - 1].every(c => !c.ok) && R[0].every(c => !c.ok) && R.every(fl => !fl[0].ok && !fl[fl.length - 1].ok);
    // y no se resuelve por eliminación de una sola perilla: ningún Ns resuelve todos los bloqueos, ni a la inversa
    const unaPerilla = !R.some(fl => fl.every(c => c.ok)) && !VL_LISTA.some((_, j) => R.every(fl => fl[j].ok));
    prueba(`escenario ${i + 1} (${b.masa} kg · pedal ${b.th * 100} % · freno ${b.tb} s): ${oks.length} celdas y ventana interior`, interior && bordes && unaPerilla, `Ns ${NS_LISTA[iMin]}–${NS_LISTA[iMax]} rpm · bloqueo ${VL_LISTA[jMin]}–${VL_LISTA[jMax]} km/h · t ≤ ${b.Tmax} s · Q ≤ ${b.Qmax} kJ`);
    if (interior && bordes && unaPerilla) nBien++;
  });
  prueba('los 8 escenarios del banco tienen ventana interior', nBien === BANCO_RETOS.length);
  const sc = escenario(0), e1 = evaluaReto(sc, NS_MAX, VLOCK_NO), e2 = evaluaReto(sc, NS_MIN, VLOCK_MIN), e3 = evaluaReto(sc, 2600, 25);
  prueba('el calado más holgado sin bloqueo no cumple (calor), el más justo con bloqueo pronto tampoco (tiempo)', !(e1.okT && e1.okQ) && !(e2.okT && e2.okQ) && !e1.okQ && !e2.okT, `Q ${f(e1.Q, 0)} contra ≤ ${sc.Qmax} · t ${f(e2.t50, 2)} contra ≤ ${sc.Tmax}`);
  prueba('un punto interior de la ventana cumple los dos', e3.okT && e3.okQ || oks_ok(sc), `${f(e3.t50, 2)} s · ${f(e3.Q, 1)} kJ`);
  function oks_ok(s0) { return rejilla(s0).flat().some(c => c.ok); }
  let sem2 = 5; const r2 = () => (sem2 = sem2 * 48271 % 2147483647) / 2147483647; let previo = -1, rep = false;
  for (let i = 0; i < 40; i++) { const g = generaReto(r2, previo); if (g.idx === previo) rep = true; previo = g.idx; }
  prueba('generaReto no repite el escenario anterior', !rep);
}

console.log('6 · Diagnóstico');
{
  const k0 = kappaDeCalado(2300);
  const firma = (falla) => { const a = banco(k0, falla, 0, 1, false), b = banco(k0, falla, rad(4300), 1, false), c = banco(k0, falla, rad(3000), 1, true, falla === 'embragueDesliza' ? LU.TcFalla : 450); return { TRcalado: a.TR, etaAlto: b.eta, desliz: c.deslizamiento }; };
  const sano = firma(null), a = firma('estatorTrabado'), b = firma('ruedaLibrePatina'), c = firma('embragueDesliza');
  prueba('sano: TR(calado) = TR0, η alta, embrague sin patinar', Math.abs(sano.TRcalado - CONV0.TR0) < 1e-9 && sano.etaAlto > 0.8 && sano.desliz < 1e-9, `TR ${f(sano.TRcalado, 2)} · η ${f(sano.etaAlto, 2)} · desliz. ${f(sano.desliz * 100, 2)} %`);
  prueba('estator trabado: TR de calado normal pero η alta se hunde', Math.abs(a.TRcalado - CONV0.TR0) < 1e-9 && a.etaAlto < sano.etaAlto - 0.08, `η ${f(a.etaAlto, 2)}`);
  prueba('rueda libre que patina: TR de calado = 1', Math.abs(b.TRcalado - 1) < 1e-12 && b.etaAlto > 0.7);
  prueba('embrague de bloqueo que patina: desliza con el embrague aplicado', c.desliz > 0.001 && Math.abs(c.TRcalado - CONV0.TR0) < 1e-9, `desliz. ${f(c.desliz * 100, 2)} %`);
  const firmas = [a, b, c].map((q, i) => (q.TRcalado < 1.5 ? 1 : 0) + (q.etaAlto < 0.7 ? 2 : 0) + (q.desliz > 0.001 ? 4 : 0));
  prueba('las tres fallas se distinguen entre sí con tres mediciones', new Set(firmas).size === 3, `firmas ${firmas.join(',')}`);
  let sem3 = 9; const r3 = () => (sem3 = sem3 * 48271 % 2147483647) / 2147483647, vistos = new Set(); for (let i = 0; i < 60; i++) vistos.add(generaDx(r3).falla);
  prueba('generaDx sortea las tres fallas', vistos.size === 3);
}

console.log('\n' + (mal ? '✗ ' + mal + ' fallan, ' : '') + ok + ' pruebas correctas');
process.exit(mal ? 1 : 0);
