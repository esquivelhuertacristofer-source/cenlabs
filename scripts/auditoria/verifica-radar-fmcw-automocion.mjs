// Verificación de la física del lab radar-fmcw-automocion: extrae el bloque FISICA del HTML publicado TAL CUAL
// y lo prueba contra formas cerradas, la DFT directa y casos de libro.
// uso: node scripts/auditoria/verifica-radar-fmcw-automocion.mjs [ruta del html]
import { readFileSync } from 'node:fs';
const RUTA_HTML = new URL('../../public/labs/radar-fmcw-automocion.html', import.meta.url);
export function cargaFisica(ruta=RUTA_HTML){
  const src = readFileSync(ruta, 'utf8');
  const i0 = src.indexOf('/* FISICA:INICIO */'), i1 = src.indexOf('/* FISICA:FIN */');
  if (i0 < 0 || i1 < 0) throw new Error('no encuentro el bloque FISICA');
  return new Function(src.slice(i0, i1) + '\nreturn {DOSPI,C0,KB,clamp,RADAR,LAM,RCS,pot2,mulberry32,gauss,fft,dft,ventana,respuestaVentana,sumasVentana,derivados,fBatido,fDoppler,rangoDePico,dB,deDB,ecuacionRadar,potRuido,snrMuestra,snrProcesada,alcanceDeteccion,visibleEnADC,generaCubo,mapaRD,cfarGeom,alfaCFAR,preparaCFAR,detectaCFAR,mideDeteccion,procesaCiclo,resueltos,resolucionEfectiva,ESCENARIOS,evaluaConfig,preparaNominal,deteccionAnalitica,MARGEN_DET,VALLE_RETO};')();
}

const RUTA = process.argv[2];
const F = RUTA ? cargaFisica(RUTA) : cargaFisica();
const { DOSPI, C0, RADAR, LAM, RCS, pot2, mulberry32, gauss, fft, dft, ventana, respuestaVentana, sumasVentana, derivados, fBatido, fDoppler, rangoDePico,
  dB, deDB, ecuacionRadar, potRuido, snrMuestra, snrProcesada, alcanceDeteccion, visibleEnADC, generaCubo, mapaRD, alfaCFAR, preparaCFAR, detectaCFAR,
  mideDeteccion, procesaCiclo, resueltos, resolucionEfectiva, ESCENARIOS, evaluaConfig, preparaNominal } = F;
let ok = 0, mal = 0;
const prueba = (n, c, d = '') => { if (c) ok++; else mal++; console.log((c ? '  ✓ ' : '  ✗ ') + n + (d ? '  · ' + d : '')); };
const rel = (a, b) => Math.abs(a - b) / Math.max(Math.abs(b), 1e-300);
const f = (x, d = 3) => (+x).toFixed(d);

console.log('1 · FFT propia contra la DFT directa');
{
  let peor = 0;
  for (const n of [2, 4, 8, 16, 64, 128, 256, 512]) {
    const re = new Float64Array(n), im = new Float64Array(n); const rng = mulberry32(n);
    for (let i = 0; i < n; i++) { re[i] = gauss(rng); im[i] = gauss(rng); }
    const r2 = re.slice(), i2 = im.slice(); fft(r2, i2, n); const d = dft(re, im);
    let e = 0, s = 0; for (let i = 0; i < n; i++) { e = Math.max(e, Math.hypot(r2[i] - d.re[i], i2[i] - d.im[i])); s = Math.max(s, Math.hypot(d.re[i], d.im[i])); }
    peor = Math.max(peor, e / s);
  }
  prueba('FFT = DFT directa para n = 2…512 (señales gaussianas complejas)', peor < 1e-13, `peor error relativo ${peor.toExponential(2)}`);
  const n = 256, re = new Float64Array(n), im = new Float64Array(n), rng = mulberry32(5); let e1 = 0; for (let i = 0; i < n; i++) { re[i] = gauss(rng); im[i] = gauss(rng); e1 += re[i] * re[i] + im[i] * im[i]; }
  fft(re, im, n); let e2 = 0; for (let i = 0; i < n; i++) e2 += re[i] * re[i] + im[i] * im[i];
  prueba('Parseval: Σ|X|² = N·Σ|x|²', rel(e2, n * e1) < 1e-13, `${rel(e2, n * e1).toExponential(2)}`);
  // un tono en el bin k cae exacto en el bin k
  const k0 = 37, a = new Float64Array(n), b = new Float64Array(n); for (let i = 0; i < n; i++) { a[i] = Math.cos(DOSPI * k0 * i / n); b[i] = Math.sin(DOSPI * k0 * i / n); }
  fft(a, b, n); let argmax = 0; for (let i = 1; i < n; i++) if (Math.hypot(a[i], b[i]) > Math.hypot(a[argmax], b[argmax])) argmax = i;
  prueba('un tono e^{j2πkn/N} produce un solo pico, de módulo N, en el bin k', argmax === k0 && Math.abs(Math.hypot(a[k0], b[k0]) - n) < 1e-9);
}

console.log('2 · Ventanas: respuesta en forma cerrada contra la suma directa');
{
  let peor = 0;
  for (const tipo of ['rect', 'hann']) for (const L of [16, 64, 500, 1024]) {
    const w = ventana(tipo, L), W0 = w.reduce((x, y) => x + y, 0);
    for (const del of [0, 0.3, 0.5, 1, 1.7, 2.5, 3.4, 7.9]) {
      let sr = 0, si = 0; for (let n = 0; n < L; n++) { const a = -DOSPI * del * n / L; sr += w[n] * Math.cos(a); si += w[n] * Math.sin(a); }
      peor = Math.max(peor, Math.abs(Math.hypot(sr, si) / W0 - respuestaVentana(tipo, L, del)));
    }
  }
  prueba('|W(δ)|/|W(0)| cerrada = suma directa (rect y Hann, L = 16…1024)', peor < 1e-10, `peor ${peor.toExponential(2)}`);
  const sr = sumasVentana('rect', 256), sh = sumasVentana('hann', 256);
  prueba('N_eff de la ventana: rect = N, Hann = 2N/3 (pérdida de 1,76 dB)', Math.abs(sr.neff - 256) < 1e-9 && Math.abs(sh.neff / 256 - 2 / 3) < 1e-9, `Hann ${f(dB(sh.neff / 256), 3)} dB`);
  // primer lóbulo lateral: rect −13,26 dB, Hann −31,47 dB
  let mr = 0, mh = 0; for (let x = 1.05; x < 6; x += 0.002) mr = Math.max(mr, respuestaVentana('rect', 2048, x)); for (let x = 2.05; x < 8; x += 0.002) mh = Math.max(mh, respuestaVentana('hann', 2048, x));
  prueba('primer lóbulo lateral: rectangular −13,3 dB; Hann −31,5 dB', Math.abs(dB(mr * mr) + 13.26) < 0.1 && Math.abs(dB(mh * mh) + 31.47) < 0.15, `${f(dB(mr * mr), 2)} y ${f(dB(mh * mh), 2)} dB`);
}

console.log('3 · Frecuencia de batido y distancia: el pico de la FFT en el bin teórico');
{
  const rng = mulberry32(11); let peorBin = 0, peorR = 0, peorFB = 0, n = 0, coupling = 0, peorCoup = 0;
  for (let i = 0; i < 60; i++) {
    const B = (0.2 + 2.5 * rng()) * 1e9, Tc = (12 + 30 * rng()) * 1e-6, win = rng() < 0.5 ? 'rect' : 'hann';
    const cfg = { B, Tc, N: 32, win }, d = derivados(cfg);
    const R = (10 + 0.8 * (d.Rmax - 10) * rng()), v = (rng() * 2 - 1) * 0.8 * d.vmax;
    const o = { R, v, sigma: 10, fase: DOSPI * rng() };
    if (!visibleEnADC(cfg, o)) continue;
    const cubo = generaCubo(cfg, [o], 3, { sinRuido: true, amp: 1 }), mapa = mapaRD(cfg, cubo);
    let kmax = 0; for (let k = 1; k < mapa.P.length; k++) if (mapa.P[k] > mapa.P[kmax]) kmax = k;
    const kr = kmax % mapa.Nr, kd = Math.floor(kmax / mapa.Nr);
    const fbTeor = fBatido(d.S, R) + fDoppler(v), binTeor = fbTeor * mapa.Nr / RADAR.fs;
    peorBin = Math.max(peorBin, Math.abs(kr - binTeor));
    const m = mideDeteccion(mapa, cfg, { kr, kd });
    peorFB = Math.max(peorFB, Math.abs(m.fpico - fbTeor) / (RADAR.fs / mapa.Nr));
    peorR = Math.max(peorR, Math.abs(m.R - R) / d.dR); peorCoup = Math.max(peorCoup, Math.abs((m.Rsin - R) - C0 * fDoppler(v) / (2 * d.S)) / d.dR); n++;
  }
  prueba(`f_b = 2·S·R/c + f_D: el pico máximo cae a ±½ bin del teórico (${n} configuraciones al azar)`, peorBin <= 0.5 + 1e-9, `peor ${f(peorBin, 3)} bins`);
  prueba('interpolación parabólica del pico (en log-potencia): f_b medida a menos de 0,12 bin', peorFB < 0.12, `peor ${f(peorFB, 3)} bins`);
  prueba('distancia medida (con el acoplamiento corregido) a menos de 0,15·ΔR de la real', peorR < 0.15, `peor ${f(peorR, 3)}·ΔR`);
  prueba('sesgo de acoplamiento rango–Doppler sin corregir = c·f_D/(2S) (a menos de 0,12·ΔR)', peorCoup < 0.12, `peor ${f(peorCoup, 3)}·ΔR`);
  // fórmulas puras
  const S = 1e9 / 50e-6;
  prueba('f_b(R = 75 m; B = 1 GHz, T_c = 50 µs) = 2·S·R/c = 10,007 MHz', Math.abs(fBatido(S, 75) - 2 * S * 75 / 299792458) < 1e-6 && Math.abs(fBatido(S, 75) / 1e6 - 10.007) < 0.001, `${(fBatido(S, 75) / 1e6).toFixed(4)} MHz`);
  prueba('ΔR = c/(2B) y R_max = f_s·c/(2S) = N_s·ΔR', (() => { const d = derivados({ B: 1e9, Tc: 50e-6, N: 64, win: 'hann' }); return rel(d.dR, C0 / 2e9) < 1e-15 && rel(d.Rmax, RADAR.fs * C0 / (2 * S)) < 1e-15 && rel(d.Rmax, d.Ns * d.dR) < 1e-12; })());
  prueba('v_max = λ/(4T_c) y Δv = λ/(2·N·T_c); N·Δv = 2·v_max', (() => { const d = derivados({ B: 1e9, Tc: 50e-6, N: 64, win: 'hann' }); return rel(d.vmax, LAM / (4 * 50e-6)) < 1e-15 && rel(d.dv, LAM / (2 * 64 * 50e-6)) < 1e-15 && rel(64 * d.dv, 2 * d.vmax) < 1e-12; })());
  prueba('la fase entre chirps Δφ = 4π·v·T_c/λ equivale a f_D·T_c·2π', rel(DOSPI * fDoppler(10) * 40e-6, 4 * Math.PI * 10 * 40e-6 / LAM) < 1e-14);
}

console.log('4 · Resolución en distancia: ΔR = c/(2B), dos objetivos separados justo por ΔR y por 0,8·ΔR');
{
  // dos ecos IGUALES de fase relativa aleatoria: se promedia la potencia sobre la fase (los términos cruzados se anulan)
  const Ns = 512, Tc = Ns / RADAR.fs, B = 1e9, cfgBase = { B, Tc, N: 16 };
  const perfil = (win, sep, zp = 16) => {
    const dR = C0 / (2 * B), P = new Float64Array(Ns * zp);
    for (let q = 0; q < 24; q++) {
      const re = new Float64Array(Ns * zp), im = new Float64Array(Ns * zp), w = ventana(win, Ns), S = B / Tc;
      for (const [Rm, fase] of [[300, 0], [300 + sep * dR, DOSPI * q / 24]]) {
        // tono de batido en sí (sin portadora ni migración): el bin fraccionario sale de la distancia
        const fb = 2 * S * Rm / C0; for (let n = 0; n < Ns; n++) { const a = DOSPI * fb * n / RADAR.fs + fase; re[n] += w[n] * Math.cos(a); im[n] += w[n] * Math.sin(a); }
      }
      fft(re, im, Ns * zp); for (let k = 0; k < P.length; k++) P[k] += (re[k] * re[k] + im[k] * im[k]) / 24;
    }
    return P;
  };
  const picos = (P) => { let mx = 0; for (const x of P) mx = Math.max(mx, x); let n = 0; for (let k = 1; k < P.length - 1; k++) if (P[k] > P[k - 1] && P[k] > P[k + 1] && P[k] > 0.4 * mx) n++; return n; };
  // la separación debe medirse en bins de resolución (1/Tc): Δf = 2·S·ΔR/c = 1/Tc·(ΔR/δR)
  const rr = resolucionEfectiva('rect', 512), rh = resolucionEfectiva('hann', 512);
  prueba('rectangular: 1,0·ΔR → dos picos; 0,8·ΔR → uno solo', picos(perfil('rect', 1.0)) === 2 && picos(perfil('rect', 0.8)) === 1, `separación mínima efectiva ${f(rr, 3)}·ΔR (Rayleigh ≈ 0,95)`);
  prueba('Hann: 0,8·ΔR → uno; 1,2·ΔR → uno; 1,7·ΔR → dos', picos(perfil('hann', 0.8)) === 1 && picos(perfil('hann', 1.2)) === 1 && picos(perfil('hann', 1.7)) === 2, `separación mínima efectiva ${f(rh, 3)}·ΔR`);
  prueba('la ventana de Hann ensancha el lóbulo: resolución efectiva 1,52·ΔR > rectangular 0,95·ΔR', rr < 1 && rr > 0.8 && rh > 1.4 && rh < 1.7);
  // el criterio del lab (resueltos) coincide con el experimento en distancia pura
  const mk = (win, sep) => resueltos({ B, Tc, N: 16, win }, { R: 80, v: 0, sigma: 10 }, { R: 80 + sep * C0 / (2 * B), v: 0, sigma: 10 });
  prueba('resueltos(): rect 1,0 sí / 0,8 no; Hann 1,7 sí / 1,2 no', mk('rect', 1.0).resuelto && !mk('rect', 0.8).resuelto && mk('hann', 1.7).resuelto && !mk('hann', 1.2).resuelto);
}

console.log('5 · Velocidad: resolución Δv = λ/(2·N·T_c) y ambigüedad en v_max = λ/(4·T_c)');
{
  const cfg = { B: 0.2e9, Tc: 40e-6, N: 64, win: 'rect' }, d = derivados(cfg);
  const medidoW = (c, v) => { const o = { R: 60, v, sigma: 10, fase: 0.7 }; const cubo = generaCubo(c, [o], 9, { sinRuido: true, amp: 1 }), mapa = mapaRD(c, cubo);
    let kmax = 0; for (let k = 1; k < mapa.P.length; k++) if (mapa.P[k] > mapa.P[kmax]) kmax = k; return mideDeteccion(mapa, c, { kr: kmax % mapa.Nr, kd: Math.floor(kmax / mapa.Nr) }).v; };
  const medido = (v) => medidoW(cfg, v);
  const cfgH = Object.assign({}, cfg, { win: 'hann' });
  let peor = 0; for (const v of [-0.8, -0.3, 0, 1.1, 5.5, 9.7, -17.2]) peor = Math.max(peor, Math.abs(medidoW(cfgH, v) - v) / d.dv);
  prueba('velocidad medida = real dentro de ±v_max (Hann, interpolación parabólica: a menos de 0,06·Δv)', peor < 0.06, `peor ${f(peor, 3)}·Δv (Δv = ${f(d.dv, 3)} m/s, v_max = ${f(d.vmax, 2)} m/s)`);
  const delta = 3 * d.dv;
  const vA = medido(d.vmax + delta), vB = medido(-d.vmax - delta), vC = medido(d.vmax - delta);
  prueba('alias exacto: v = v_max + δ se mide como −v_max + δ', Math.abs(vA - (-d.vmax + delta)) < 0.15 * d.dv, `${f(d.vmax + delta, 3)} → ${f(vA, 3)} m/s (esperado ${f(-d.vmax + delta, 3)})`);
  prueba('alias exacto en el otro sentido: −v_max − δ se mide como +v_max − δ', Math.abs(vB - (d.vmax - delta)) < 0.15 * d.dv, `${f(vB, 3)} m/s`);
  prueba('justo por debajo del límite no hay alias (v_max − δ se mide bien)', Math.abs(vC - (d.vmax - delta)) < 0.15 * d.dv);
  prueba('la velocidad se repite cada 2·v_max: v y v + 2·v_max dan la misma medida (Hann, a menos de 0,15·Δv)', Math.abs(medidoW(cfgH, 3.3) - medidoW(cfgH, 3.3 + 2 * d.vmax)) < 0.15 * d.dv);
  // resolución Doppler: dos ecos a Δv (rect) → dos picos; 0,8·Δv → uno
  const dopp = (sep) => { const P = new Float64Array(64 * 16);
    for (let q = 0; q < 24; q++) { const re = new Float64Array(64 * 16), im = new Float64Array(64 * 16);
      for (const [v, ph] of [[2, 0], [2 + sep * d.dv, DOSPI * q / 24]]) for (let m = 0; m < 64; m++) { const a = DOSPI * fDoppler(v) * m * cfg.Tc + ph; re[m] += Math.cos(a); im[m] += Math.sin(a); }
      fft(re, im, 64 * 16); for (let k = 0; k < P.length; k++) P[k] += (re[k] * re[k] + im[k] * im[k]) / 24; }
    let mx = 0; for (const x of P) mx = Math.max(mx, x); let n = 0; for (let k = 1; k < P.length - 1; k++) if (P[k] > P[k - 1] && P[k] > P[k + 1] && P[k] > 0.4 * mx) n++; return n; };
  prueba('resolución en velocidad Δv = λ/(2NT_c): 1,0·Δv → dos picos; 0,8·Δv → uno', dopp(1.0) === 2 && dopp(0.8) === 1);
  prueba('el mismo experimento en el plano completo coincide con resueltos()', resueltos(cfg, { R: 60, v: 2, sigma: 10 }, { R: 60, v: 2 + d.dv, sigma: 10 }).resuelto && !resueltos(cfg, { R: 60, v: 2, sigma: 10 }, { R: 60, v: 2 + 0.8 * d.dv, sigma: 10 }).resuelto);
}

console.log('6 · Ecuación del radar y relación señal–ruido');
{
  prueba('P_r ∝ σ/R⁴: ×2 en R → −12,04 dB; ×10 en σ → +10 dB', Math.abs(dB(ecuacionRadar(1, 200) / ecuacionRadar(1, 100)) + 40 * Math.log10(2)) < 1e-9 && Math.abs(dB(ecuacionRadar(10, 100) / ecuacionRadar(1, 100)) - 10) < 1e-9);
  prueba('ruido kT₀·F·f_s = −89,0 dBm (f_s = 20 MHz, F = 12 dB)', Math.abs(dB(potRuido() * 1000) + 88.96) < 0.05, `${f(dB(potRuido() * 1000), 2)} dBm`);
  const cfg = { B: 1e9, Tc: 51.2e-6, N: 64, win: 'rect' };   // Ns = 1024: sin relleno de ceros
  const cfgH = Object.assign({}, cfg, { win: 'hann' });
  // SNR medida en el mapa (pico / potencia media del ruido) frente a la analítica, con el eco centrado en su bin
  const medidaSNR = (c, sigma) => { const d = derivados(c), R = 40 * d.dR, o = { R, v: 0, sigma, fase: 0.3 }; let sp = 0, sn = 0, nF = 24;
    for (let s = 1; s <= nF; s++) { const cubo = generaCubo(c, [o], s), mapa = mapaRD(c, cubo); const kr = Math.round(R / d.dR) * (mapa.Nr / d.Ns), kd = c.N >> 1;
      sp += mapa.P[kd * mapa.Nr + kr]; let t = 0, cnt = 0; for (let k = 0; k < mapa.P.length; k++) { const kk = k % mapa.Nr, rr = Math.floor(k / mapa.Nr); if (Math.abs(kk - kr) > 12 || Math.abs(rr - kd) > 6) { t += mapa.P[k]; cnt++; } } sn += t / cnt; }
    return sp / sn; };
  const sw = (c) => sumasVentana(c.win, derivados(c).Ns).suma2 * sumasVentana(c.win, c.N).suma2;   // potencia media del ruido tras las ventanas
  for (const [c, sg] of [[cfg, 4e3], [cfgH, 4e3], [cfg, 4e4]]) {
    const med = dB(medidaSNR(c, sg)), teo = dB(snrProcesada(sg, 40 * derivados(c).dR, c));
    prueba(`SNR del pico en el mapa = analítica (${c.win}, σ = ${sg} m²)`, Math.abs(med - teo) < 1.0, `medida ${f(med, 2)} dB · teórica ${f(teo, 2)} dB`);
  }
  prueba('alcance de detección ∝ σ^¼ (σ ×16 → R ×2)', rel(alcanceDeteccion(16, 15, cfg), 2 * alcanceDeteccion(1, 15, cfg)) < 1e-12);
  prueba('ganancia de procesado: SNR_pico = SNR_muestra · N_eff,rango · N_eff,Doppler', rel(snrProcesada(5, 70, cfgH), snrMuestra(5, 70) * (2 / 3) * 1024 * (2 / 3) * 64) < 1e-9);
}

console.log('7 · CFAR de celda promediada: tasa de falsa alarma empírica contra la teórica');
{
  const cfg = { B: 1e9, Tc: 25.6e-6, N: 32, win: 'rect' };   // Ns = 512, N = 32: celdas independientes (FFT sin relleno, ventana rectangular)
  for (const [Pfa, tol] of [[1e-3, 0.08], [1e-4, 0.22]]) {
    let sobre = 0, celdas = 0; const nF = Pfa === 1e-3 ? 130 : 400;
    for (let s = 1; s <= nF; s++) { const cubo = generaCubo(cfg, [], 1000 + s), mapa = mapaRD(cfg, cubo), ctx = preparaCFAR(mapa, cfg, Pfa);
      for (let kd = 0; kd < mapa.N; kd++) for (let kr = 0; kr < mapa.Nr; kr++) { celdas++; if (mapa.P[kd * mapa.Nr + kr] > ctx.umbral(kd, kr)) sobre++; } }
    const emp = sobre / celdas;
    prueba(`P_fa empírica = ${Pfa.toExponential(0)} de diseño (${(celdas / 1e6).toFixed(1)} M celdas, rect)`, Math.abs(emp / Pfa - 1) < tol, `medida ${emp.toExponential(2)} · cociente ${f(emp / Pfa, 3)} · ${sobre} falsas alarmas`);
  }
  {   // con Hann y relleno de ceros las celdas vecinas están correlacionadas: se mide y se declara
    const cfgH = { B: 1e9, Tc: 25e-6, N: 32, win: 'hann' }; let sobre = 0, celdas = 0;
    for (let s = 1; s <= 130; s++) { const cubo = generaCubo(cfgH, [], 5000 + s), mapa = mapaRD(cfgH, cubo), ctx = preparaCFAR(mapa, cfgH, 1e-3);
      for (let kd = 0; kd < mapa.N; kd++) for (let kr = 0; kr < mapa.Nr; kr++) { celdas++; if (mapa.P[kd * mapa.Nr + kr] > ctx.umbral(kd, kr)) sobre++; } }
    const c = (sobre / celdas) / 1e-3;
    prueba('con Hann y relleno de ceros la P_fa queda del mismo orden (0,5×…2× la de diseño)', c > 0.5 && c < 2, `cociente ${f(c, 3)} (celdas correlacionadas: se declara en la ficha)`);
  }
  // detección: un eco fuerte se detecta siempre y uno débil casi nunca
  const cfg2 = { B: 1e9, Tc: 51.2e-6, N: 64, win: 'hann' }, d2 = derivados(cfg2);
  const Pd = (snrDb) => { const o = { R: 41.3 * d2.dR, v: 3.1, sigma: 1 }; const amp = Math.sqrt(deDB(snrDb) / (sumasVentana('hann', d2.Ns).neff * sumasVentana('hann', 64).neff)); let det = 0;
    for (let s = 1; s <= 30; s++) { const cubo = generaCubo(cfg2, [o], 77 + s, { amp }), mapa = mapaRD(cfg2, cubo), cf = detectaCFAR(mapa, cfg2, 1e-6);
      const m = cf.det.map((x) => mideDeteccion(mapa, cfg2, x)); if (m.some((x) => Math.abs(x.R - o.R) < 2 * d2.dR && Math.abs(x.v - o.v) < 2 * d2.dv)) det++; } return det / 30; };
  const umbralDB = dB(alfaCFAR(preparaNominal(cfg2), 1e-6));
  prueba(`eco con SNR de pico ${f(umbralDB + 8, 1)} dB (umbral + 8 dB) se detecta ≥ 95 % de los ciclos`, Pd(umbralDB + 8) >= 0.95, `P_d = ${f(Pd(umbralDB + 8), 2)}`);
  prueba(`eco con SNR de pico ${f(umbralDB - 8, 1)} dB (umbral − 8 dB) casi nunca se detecta`, Pd(umbralDB - 8) <= 0.1, `P_d = ${f(Pd(umbralDB - 8), 2)}`);
}

console.log('8 · Migración de celda, objetivo fuera del ADC y el procesado completo');
{
  const cfg = { B: 1e9, Tc: 30e-6, N: 64, win: 'hann' }, d = derivados(cfg);
  const o = { R: 0.8 * d.Rmax, v: 5, sigma: 100 };
  const out = procesaCiclo(cfg, [o, { R: 1.3 * d.Rmax, v: 0, sigma: 100 }], 4);
  prueba('un eco más allá de R_max lo corta el filtro anti-aliasing: no aparece', out.meds.every((m) => Math.abs(m.R - 1.3 * d.Rmax) > 5 * d.dR) && !visibleEnADC(cfg, { R: 1.3 * d.Rmax, v: 0 }));
  const m = out.meds.find((x) => Math.abs(x.R - o.R) < 3 * d.dR);
  prueba('el procesado completo mide el objetivo (distancia y velocidad)', !!m && Math.abs(m.R - o.R) < 0.5 * d.dR + 0.02 && Math.abs(m.v - o.v) < 0.3 * d.dv, m ? `R ${f(m.R, 3)} m (real ${o.R}) · v ${f(m.v, 3)} m/s (real ${o.v})` : 'no detectado');
}

console.log('9 · Reto: los criterios, contra el procesado real');
{
  for (const [k, esc] of Object.entries(ESCENARIOS)) {
    const Bs = [], Tcs = []; for (let b = 0.1; b <= 4.001; b += 0.05) Bs.push(+b.toFixed(2)); for (let t = 8; t <= 80; t++) Tcs.push(t);
    const Ns = [16, 32, 64, 128, 256]; const sol = []; let tot = 0;
    for (const B of Bs) for (const Tc of Tcs) for (const N of Ns) { tot++; if (evaluaConfig({ B: B * 1e9, Tc: Tc * 1e-6, N, win: 'hann' }, esc, undefined, true).ok) sol.push({ B, Tc, N }); }
    const rg = (g) => [Math.min(...sol.map(g)), Math.max(...sol.map(g))];
    const pct = 100 * sol.length / tot;
    prueba(`«${esc.nombre}»: hay solución y es una parte pequeña del espacio (${f(pct, 2)} % de ${tot})`, sol.length > 0 && pct < 5, `B ${rg((s) => s.B)} GHz · T_c ${rg((s) => s.Tc)} µs · N ${[...new Set(sol.map((s) => s.N))].join('/')}`);
    const [bl, bh] = rg((s) => s.B), [tl, th] = rg((s) => s.Tc);
    prueba(`«${esc.nombre}»: la ventana es INTERIOR (ni B ni T_c en el tope de su mando)`, bl > 0.1 && bh < 4 && tl > 8 && th < 80);
    const extremos = [{ B: 4e9, Tc: 80e-6, N: 256 }, { B: 0.1e9, Tc: 8e-6, N: 16 }, { B: 4e9, Tc: 8e-6, N: 16 }, { B: 0.1e9, Tc: 80e-6, N: 256 }, { B: 4e9, Tc: 80e-6, N: 16 }, { B: 0.1e9, Tc: 8e-6, N: 256 }];
    prueba(`«${esc.nombre}»: ninguna combinación de topes de los mandos sirve`, extremos.every((c) => !evaluaConfig(Object.assign({ win: 'hann' }, c), esc).ok));
    // coherencia con el procesado real: si el veredicto analítico dice «bien», el procesado completo (con ruido) mide bien LOS DOS ecos
    // con detecciones distintas; y entre las configuraciones al azar que el veredicto rechaza, pocas se miden bien de todos modos
    const rng = mulberry32(k.length * 7 + 3); let bienOk = 0, totOk = 0, falsoOk = 0, total = 0;
    const mide = (cfg, sem) => { const dd = derivados(cfg); const out = procesaCiclo(cfg, [esc.a, esc.b], sem);
      const dist = (m, o) => Math.hypot((m.R - o.R) / dd.dR, (m.v - o.v) / dd.dv);
      for (let i = 0; i < out.meds.length; i++) for (let j = 0; j < out.meds.length; j++) { if (i === j) continue;
        const A = out.meds[i], B = out.meds[j];
        if (dist(A, esc.a) < 2.5 && dist(B, esc.b) < 2.5 && dist(A, esc.a) < dist(A, esc.b) && dist(B, esc.b) < dist(B, esc.a)) return true; }
      return false; };
    for (let i = 0; i < 60; i++) {
      let cfg;
      if (i < 24 && sol.length) { const pick = sol[Math.floor(rng() * sol.length)]; cfg = { win: 'hann', B: pick.B * 1e9, Tc: pick.Tc * 1e-6, N: pick.N }; }
      else cfg = { win: 'hann', B: (0.15 + 3 * rng() * (i % 2 ? 0.5 : 1)) * 1e9, Tc: (10 + 55 * rng()) * 1e-6, N: [16, 32, 64, 128, 256][Math.floor(rng() * 5)] };
      const ev = evaluaConfig(cfg, esc); if (!derivados(cfg).memOk) continue;
      if (ev.ok) { for (let s = 0; s < 3; s++) { totOk++; if (mide(cfg, 700 + 10 * i + s)) bienOk++; } }
      else { total++; if (mide(cfg, 900 + i)) falsoOk++; }
    }
    prueba(`«${esc.nombre}»: en las configuraciones que el veredicto da por buenas, el procesado real mide bien los dos ecos (≥ 90 %)`, totOk > 0 && bienOk / totOk >= 0.9, `${bienOk}/${totOk} ciclos con ruido distinto`);
    prueba(`«${esc.nombre}»: de las rechazadas, el procesado real rara vez las mide bien de todos modos (≤ 20 %: el criterio es conservador, no permisivo)`, total === 0 || falsoOk / total <= 0.2, `${falsoOk}/${total} rechazadas medidas bien`);
  }
}

console.log(`\n${mal === 0 ? 'TODO EN VERDE' : 'HAY FALLOS'} · ${ok} pruebas pasan, ${mal} fallan`);
process.exit(mal ? 1 : 0);
