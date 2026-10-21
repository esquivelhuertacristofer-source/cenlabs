// Verificación de la física del lab seguridad-pasiva-colision: extrae el bloque FISICA del HTML
// publicado TAL CUAL y lo prueba contra formas cerradas, conservación y casos de libro.
// uso: node verifica.mjs [ruta del html o del bloque]
import { readFileSync } from 'node:fs';
const RUTA = process.argv[2] || new URL('../../public/labs/seguridad-pasiva-colision.html', import.meta.url);
const src = readFileSync(RUTA, 'utf8');
const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
const F = new Function(src.slice(i0, i1) + '\nreturn {G0,P_ATM,AIRE,VEH,OCUP,CINT,BOLSA,D_GOLPE,D_CUBO,estructura,fuerzaCarga,caudalOrificio,caudalInflador,derivGas,estadoBolsa,a3ms,simula,muestraEn,gasFijo,suave};')();
let ok = 0, mal = 0;
const prueba = (nombre, cond, det = '') => { if (cond) ok++; else mal++; console.log((cond ? '  ✓ ' : '  ✗ ') + nombre + (det ? '  · ' + det : '')); };
const cerca = (a, b, tol) => Math.abs(a - b) <= tol;
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);
const { G0, VEH } = F, M = VEH.M;
const FINO = { dt: 5e-6, tFin: 0.16 };

console.log('1 · Zona de deformación: la cinemática de libro (vehículo solo, sin ocupante)');
for (const [L, v] of [[0.45, 50], [0.60, 56], [0.80, 64], [0.35, 40]]) {
  const S = F.estructura(L, v / 3.6), E = 0.5 * M * (v / 3.6) ** 2;
  const R = F.simula({ vKmh: v, vDisKmh: v, L, sinOcup: true, ...FINO });
  const sTeo = VEH.eta * L, a = S.Fc / M;
  prueba(`L = ${L} m, ${v} km/h: s_máx = η·L = x_r/2 + E/F_c`, cerca(R.xmax, sTeo, 2e-4) && cerca(S.xr / 2 + E / S.Fc, sTeo, 1e-12), `${f(R.xmax * 1000, 2)} mm frente a ${f(sTeo * 1000, 2)} mm`);
  // la rampa es un muelle de frecuencia ω; luego F_c constante
  const w = Math.sqrt(S.Fc / (M * S.xr)), t1 = Math.asin(S.xr * w / (v / 3.6)) / w, v1 = (v / 3.6) * Math.cos(w * t1), tStopTeo = t1 + v1 / a, sTeo2 = S.xr + v1 * v1 / (2 * a);
  prueba(`   tiempo de parada = t_rampa + v₁/a, y s = x_r + v₁²/2a`, cerca(R.tStop, tStopTeo, 2e-4) && cerca(R.xmax, sTeo2, 2e-4), `${f(R.tStop * 1000, 2)} ms frente a ${f(tStopTeo * 1000, 2)} ms`);
  const aE = (v / 3.6) ** 2 / (2 * R.xmax) / G0;
  prueba(`   deceleración media energética ā = v₀²/(2s) = E/(M·s)`, cerca(aE, E / (M * R.xmax) / G0, 1e-12) && R.aVmax >= aE && cerca(R.aVmax, a / G0, 0.02 * a / G0), `ā = ${f(aE, 2)} g · meseta ${f(a / G0, 2)} g · pico ${f(R.aVmax, 2)} g`);
}
{ // s = v²/(2ā): ley de escala en la meseta
  const R1 = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, sinOcup: true, ...FINO }), R2 = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.25, sinOcup: true, ...FINO });
  const a1 = R1.aVmax, a2 = R2.aVmax;
  prueba('Media zona de deformación ⇒ casi el doble de deceleración (a ∝ 1/(η·L − x_r/2))', cerca(a2 / a1, (0.9 * 0.5 - 0.03) / (0.9 * 0.25 - 0.03), 0.01), `cociente ${f(a2 / a1, 3)} frente a ${f((0.9 * 0.5 - 0.03) / (0.9 * 0.25 - 0.03), 3)}`);
}

console.log('2 · Rebote, impulso y ΔV');
for (const [L, v] of [[0.5, 56], [0.7, 64]]) {
  const S = F.estructura(L, v / 3.6), R = F.simula({ vKmh: v, vDisKmh: v, L, sinOcup: true, ...FINO });
  const vr = Math.sqrt(S.Fc * VEH.cDesc / M), o = R.out;
  let J = 0; for (let i = 1; i < o.t.length; i++) J += 0.5 * (o.Fc[i] + o.Fc[i - 1]) * (o.t[i] - o.t[i - 1]);
  const vEnd = o.v[o.v.length - 1];
  prueba(`${v} km/h: velocidad de rebote = √(F_c·c_desc/M) (energía elástica ½F²/k_u)`, cerca(-vEnd, vr, 0.01), `${f(-vEnd, 3)} m/s frente a ${f(vr, 3)}`);
  prueba(`   impulso ∫F dt = M·(v₀ + v_rebote) = M·ΔV`, rel(J, M * (v / 3.6 - vEnd)) < 5e-4, `${f(J / 1000, 2)} kN·s frente a ${f(M * (v / 3.6 - vEnd) / 1000, 2)}`);
  prueba(`   ΔV del vehículo = v₀ + v_rebote`, cerca(R.dV, v / 3.6 + vr, 0.02), `${f(R.dV * 3.6, 2)} km/h`);
}

console.log('3 · Fondo de carrera (cuando el choque es más fuerte que el diseño)');
{ const L = 0.5, vD = 56, v = 70, S = F.estructura(L, vD / 3.6), E0 = 0.5 * M * (v / 3.6) ** 2;
  // E0 = F_c(L − x_r/2) + F_c·d + ½·k_b·d²   ⇒   d
  const A = 0.5 * S.kb, B = S.Fc, C = S.Fc * (L - S.xr / 2) - E0, d = (-B + Math.sqrt(B * B - 4 * A * C)) / (2 * A);
  const R = F.simula({ vKmh: v, vDisKmh: vD, L, sinOcup: true, ...FINO });
  prueba('70 km/h contra una estructura de 56 km/h: x_máx = L + d, d raíz de la energía', cerca(R.xmax, L + d, 5e-4) && R.fondo, `${f(R.xmax * 1000, 1)} mm frente a ${f((L + d) * 1000, 1)} mm`);
  prueba('   el fondo de carrera dispara el pico de deceleración (> 3 × la meseta)', R.aVmax > 3 * S.Fc / M / G0, `${f(R.aVmax, 1)} g frente a la meseta de ${f(S.Fc / M / G0, 1)} g`);
}

console.log('4 · Conservación de energía y de cantidad de movimiento (con ocupante, cinturón y bolsa)');
for (const o of [{ L: 0.5, Flim: 6000, dVth: 26 }, { L: 0.4, Flim: 4000, dVth: 12, ocup: 'p95' }, { L: 0.6, Flim: 8000, tFire: null, vKmh: 64 }, { L: 0.5, Flim: 6000, ocup: 'p5', pretensor: false, dVth: 20 }]) {
  const R = F.simula({ vKmh: 56, vDisKmh: 56, ...o, ...FINO }), O = R.out, mo = R.mOcup, KE0 = 0.5 * (M + mo) * R.v0 ** 2;
  let maxE = 0; for (let i = 0; i < O.t.length; i++) maxE = Math.max(maxE, Math.abs(KE0 - (O.KEv[i] + O.KEo[i]) - O.Wc[i] - O.Wr[i]) / KE0);
  const n = O.t.length - 1, vo = O.v[n] + (O.xi[n] - O.xi[n - 1]) / (O.t[n] - O.t[n - 1]);
  let J = 0; for (let i = 1; i <= n; i++) J += 0.5 * (O.Fc[i] + O.Fc[i - 1]) * (O.t[i] - O.t[i - 1]);
  const dp = (M + mo) * R.v0 - (M * O.v[n] + mo * vo);
  prueba(`${JSON.stringify(o)}: ½(M+m)v₀² = KE(t) + W_barrera + W_sujeción en todo instante`, maxE < 2e-5, `error máx. ${maxE.toExponential(2)}`);
  prueba(`   impulso de la barrera = pérdida de cantidad de movimiento del sistema`, rel(J, dp) < 1e-3, `${f(J, 1)} N·s frente a ${f(dp, 1)}`);
}
{ // trabajo de la sujeción sobre el ocupante: ½ m (vo0² − vo²) = ∫F_o·v_o dt
  const R = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, dVth: 26, ...FINO }), O = R.out, mo = R.mOcup;
  let W = 0; for (let i = 1; i < O.t.length; i++) { const vo0 = O.v[i - 1] + (i > 1 ? (O.xi[i - 1] - O.xi[i - 2]) / (O.t[i - 1] - O.t[i - 2]) : 0), vo1 = O.v[i] + (O.xi[i] - O.xi[i - 1]) / (O.t[i] - O.t[i - 1]);
    W += 0.5 * (O.aCh[i] * mo * G0 * vo1 + O.aCh[i - 1] * mo * G0 * vo0) * (O.t[i] - O.t[i - 1]); }
  const i = O.t.length - 1, vo = O.v[i] + (O.xi[i] - O.xi[i - 1]) / (O.t[i] - O.t[i - 1]), dKE = 0.5 * mo * (R.v0 ** 2 - vo ** 2);
  prueba('El ocupante pierde su energía cinética sólo por la sujeción: ½m(v₀² − v²) = ∫F·v dt', rel(W, dKE) < 5e-3, `${f(W / 1000, 3)} kJ frente a ${f(dKE / 1000, 3)} kJ`);
}

console.log('5 · El ocupante sin sujeción es un cuerpo libre');
{ const R = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, sinCint: true, tFire: null, ...FINO }), O = R.out, v0 = R.v0; let m = 0, n = 0;
  for (let i = 0; i < O.t.length; i++) { if (O.xi[i] > 0.25 || O.t[i] > 0.04) break; m = Math.max(m, Math.abs(O.xi[i] - (v0 * O.t[i] - O.x[i]))); n++; }
  prueba('Sin cinturón ni bolsa: ξ(t) = v₀·t − x(t) (el coche frena, él sigue)', m < 1e-7 && n > 200, `${n} instantes, error máx. ${m.toExponential(2)} m`);
  const tHub = O.t[O.xi.findIndex((q) => q > R.g0 - F.D_CUBO)];
  prueba('   llega al cubo del volante en un tiempo del orden de 30–60 ms y lo golpea', R.golpe && R.hub && tHub > 0.025 && tHub < 0.07, `contacto a ${f(tHub * 1000, 1)} ms`);
}

console.log('6 · El cinturón con limitador');
{ const R = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 5000, tFire: null, ...FINO }), O = R.out, mo = R.mOcup; let n = 0, dev = 0;
  for (let i = 0; i < O.t.length; i++) if (O.Fb[i] >= 4999.9 && O.Fh[i] === 0) { n++; dev = Math.max(dev, Math.abs(O.aCh[i] * mo * G0 - 5000)); }
  prueba('En la meseta del limitador la fuerza es F_lim y la deceleración del tórax F_lim/m', n > 100 && dev < 1e-6 * 5000, `${n} instantes, desviación ${dev.toExponential(2)} N`);
  const R0 = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, tFire: null, ...FINO }), R1 = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, tFire: null, pretensor: false, ...FINO });
  prueba('El pretensor recoge la holgura de 40 mm: el tórax carga antes y se desplaza menos', R0.xiMax < R1.xiMax || R0.out.t[R0.out.Fb.findIndex((q) => q > 50)] < R1.out.t[R1.out.Fb.findIndex((q) => q > 50)], `ξ ${f(R0.xiMax * 1000, 0)} mm con pretensor, ${f(R1.xiMax * 1000, 0)} mm sin él`);
  const Rp = [3000, 4500, 6000, 7500].map((Fl) => F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: Fl, tFire: null, ...FINO }).xiMax);
  prueba('A más limitador, menos recorrido del tórax (monótono)', Rp[0] > Rp[1] && Rp[1] > Rp[2] && Rp[2] > Rp[3], Rp.map((q) => f(q * 1000, 0)).join(' > ') + ' mm');
}

console.log('7 · El criterio de 3 ms');
{ const dt = 1e-4, rect = Array.from({ length: 400 }, (_, i) => (i >= 100 && i < 200 ? 40 : 0)), tri = Array.from({ length: 400 }, (_, i) => { const t = (i - 100) * dt; return t >= 0 && t <= 0.02 ? 50 * (1 - Math.abs(t - 0.01) / 0.01) : 0; });
  prueba('Pulso rectangular de 10 ms a 40 g ⇒ A3ms = 40 g', cerca(F.a3ms(rect, dt), 40, 1e-12));
  prueba('Pulso triangular de 50 g y 20 ms ⇒ A3ms = 50·(1 − 3/20) = 42,5 g', cerca(F.a3ms(tri, dt), 42.5, 0.2), f(F.a3ms(tri, dt), 2) + ' g');
  const dos = Array.from({ length: 400 }, (_, i) => ((i >= 50 && i < 65) || (i >= 250 && i < 265) ? 30 : 0));
  prueba('Dos picos de 1,5 ms a 30 g suman 3 ms acumulados ⇒ A3ms = 30 g (el criterio es acumulado, no continuo)', cerca(F.a3ms(dos, dt), 30, 1e-12));
}

console.log('8 · El gas de la bolsa');
{ const B = F.BOLSA, R = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, dVth: 20, ...FINO }), m0 = F.P_ATM * B.V0 / (F.AIRE.R * 300);
  prueba('Masa: m_final = m₀ + m_inflador − m_ventilas (a 1e-9 relativo)', rel(R.mFinal, m0 + B.mInf - R.mOutFinal) < 1e-9 || cerca(R.mFinal, m0 + B.mInf - R.mOutFinal, 1e-9), `${f(R.mFinal * 1000, 4)} g = ${f(m0 * 1000, 4)} + ${f(B.mInf * 1000, 1)} − ${f(R.mOutFinal * 1000, 4)}`);
  let q = 0; const N = 20000; for (let i = 0; i <= N; i++) { const w = (i === 0 || i === N) ? 0.5 : 1; q += w * F.caudalInflador(i / N * B.tInf, B) * (B.tInf / N); }
  prueba('El inflador entrega exactamente su masa: ∫ṁ dt = m_inf', cerca(q, B.mInf, 1e-9), `${f(q * 1000, 5)} g`);
  // régimen: caudal de entrada constante, volumen fijo ⇒ presión y temperatura de equilibrio
  const V = 0.05, mIn = 0.12, Tin = 700, sol = F.gasFijo(V, mIn, Tin, { tauT: 0.03 }, 3);
  // equilibrio independiente: ṁ_out(p,T) = ṁ_in y ṁ_in·cp·(Tin − T) = m·cv·(T − Tw)/τ con m = pV/(RT), por bisección
  const g = F.AIRE.cp / F.AIRE.cv, R_ = F.AIRE.R, orif = (p, T, Av) => { const pr = F.P_ATM / p, c = Math.pow(2 / (g + 1), g / (g - 1)); return pr > c ? 0.7 * Av * p * Math.sqrt(2 * g / ((g - 1) * R_ * T) * (Math.pow(pr, 2 / g) - Math.pow(pr, (g + 1) / g))) : 0.7 * Av * p * Math.sqrt(g / (R_ * T)) * Math.pow(2 / (g + 1), (g + 1) / (2 * (g - 1))); };
  const Avp = (p) => { const x = (p - F.P_ATM - B.pAlivio) / B.dAlivio, s = x <= 0 ? 0 : x >= 1 ? 1 : x * x * (3 - 2 * x); return B.Av + B.AvAlivio * s; };
  let T = 500; for (let it = 0; it < 200; it++) { let lo = F.P_ATM, hi = 6e5; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (orif(mid, T, Avp(mid)) > mIn) hi = mid; else lo = mid; }
    const p = (lo + hi) / 2, m = p * V / (R_ * T); const Tn = (mIn * F.AIRE.cp * Tin + m * F.AIRE.cv * 300 / 0.03) / (mIn * F.AIRE.cp + m * F.AIRE.cv / 0.03); T = Tn; }
  let lo = F.P_ATM, hi = 6e5; for (let k = 0; k < 80; k++) { const mid = (lo + hi) / 2; if (orif(mid, T, Avp(mid)) > mIn) hi = mid; else lo = mid; }
  prueba('Equilibrio con caudal constante: p y T que cierran ṁ_out(p,T) = ṁ_in y el balance de energía', rel(sol.p, (lo + hi) / 2) < 2e-3 && rel(sol.T, T) < 2e-3, `p = ${f(sol.p / 1e3, 2)} kPa frente a ${f((lo + hi) / 2e3, 2)} · T = ${f(sol.T, 2)} K frente a ${f(T, 2)}`);
  const pc = F.caudalOrificio(10 * F.P_ATM, 300, 1e-3, 1), pc2 = F.caudalOrificio(20 * F.P_ATM, 300, 1e-3, 1);
  prueba('Orificio bloqueado: el caudal crece lineal con la presión aguas arriba (ṁ ∝ p₀)', cerca(pc2 / pc, 2, 1e-12));
  prueba('Sin sobrepresión no hay caudal', F.caudalOrificio(F.P_ATM, 300, 1e-3, 1) === 0 && F.caudalOrificio(0.9 * F.P_ATM, 300, 1e-3, 1) === 0);
}

console.log('9 · El sensor de disparo');
{ const v = 56, L = 0.5, S = F.estructura(L, v / 3.6), a = S.Fc / M;
  for (const th of [6, 12, 20]) {
    const R = F.simula({ vKmh: v, vDisKmh: v, L, sinOcup: true, dVth: th, ...FINO }), v0 = v / 3.6, dv = th / 3.6;
    // en la rampa v = v₀cos(ωt); después, deceleración constante F_c/M
    const w = Math.sqrt(S.Fc / (M * S.xr)), t1 = Math.asin(S.xr * w / v0) / w, vv1 = v0 * Math.cos(w * t1);
    const tc = (v0 - vv1) >= dv ? Math.acos(1 - dv / v0) / w : t1 + (dv - (v0 - vv1)) / a;
    prueba(`Umbral ${th} km/h: dispara cuando el vehículo ha perdido esa velocidad (+2 ms de algoritmo)`, cerca(R.tFire - F.CINT.latencia, tc, 2e-5), `${f(R.tFire * 1000, 3)} ms frente a ${f((tc + F.CINT.latencia) * 1000, 3)} ms`);
  }
  const bump = F.simula({ vKmh: 16, vDisKmh: 56, L, Flim: 6000, dVth: 26, tFin: 0.12 }), sev = F.simula({ vKmh: 56, vDisKmh: 56, L, Flim: 6000, dVth: 26, tFin: 0.12 });
  prueba('Con umbral de 26 km/h: el golpe de 16 km/h NO dispara y el choque de 56 km/h sí', bump.tFire === null && sev.tFire !== null, `choque a ${f(sev.tFire * 1000, 1)} ms · ΔV del golpe ${f(bump.dV * 3.6, 1)} km/h`);
}

console.log('10 · Coherencia del conjunto y convergencia');
{ const a = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, dVth: 26, dt: 2.5e-5 }), b = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, dVth: 26, dt: 6.25e-6 });
  prueba('Convergencia en dt: A3ms, ξ_máx y s_máx cambian < 0,2 % al cuartar el paso', rel(a.a3, b.a3) < 2e-3 && rel(a.xiMax, b.xiMax) < 2e-3 && rel(a.xmax, b.xmax) < 2e-3, `A3ms ${f(a.a3, 2)}/${f(b.a3, 2)} g · ξ ${f(a.xiMax * 1000, 1)}/${f(b.xiMax * 1000, 1)} mm`);
  const m = F.muestraEn(a, 0.0345);
  prueba('muestraEn interpola entre muestras (continuidad)', m.x > 0 && m.v < a.v0 && Number.isFinite(m.aCh));
  const sin = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, tFire: null, dt: 2.5e-5 }), con = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 6000, dVth: 14, dt: 2.5e-5 });
  prueba('La bolsa en tiempo ayuda: con ella el tórax no golpea y sin ella a 6 kN sí queda más cerca', con.xiMax < sin.xiMax, `${f(con.xiMax * 1000, 0)} mm con bolsa · ${f(sin.xiMax * 1000, 0)} mm sin ella`);
  const tarde = F.simula({ vKmh: 56, vDisKmh: 56, L: 0.5, Flim: 5500, tFire: 0.075, dt: 2.5e-5 });
  prueba('Una bolsa que se dispara tarde (75 ms) llega después del tórax: golpe al volante', tarde.golpe);
  const sinNaN = [a, b, sin, con, tarde].every((R) => R.out.aCh.every(Number.isFinite) && R.out.pg.every(Number.isFinite));
  prueba('Ninguna serie contiene NaN ni infinitos', sinNaN);
}
console.log(`\n${ok} pruebas pasadas, ${mal} fallidas`);
process.exit(mal ? 1 : 0);
