/**
 * FICHA DE FIDELIDAD — Comparador Schmitt Trigger (LM393)
 *
 * SÍ verificado:
 * - Deducción de VTH/VTL/ΔV por análisis de nodo con superposición sobre un
 *   comparador con realimentación positiva (principio estándar de teoría de
 *   circuitos: Sedra & Smith, Boylestad & Nashelsky), para topología
 *   inversora (vin→V-, divisor R1/R2 en V+) y no inversora (vin→V+ vía R1,
 *   Vref fijo en V-, realimentación R2 hacia V+).
 * - LM393: rango de alimentación 2 V–36 V, corriente de polarización de
 *   entrada Ib≈65 nA típ / 250 nA máx, tensión de offset de entrada
 *   Vos≈1–2 mV típ / 5 mV máx, tensión de salida baja VOL=250 mV típ /
 *   400 mV máx @ Isink=4 mA — verificados en la hoja de datos vigente de
 *   Texas Instruments (fabricante actual de la parte, originalmente
 *   National Semiconductor).
 * - Salida en colector abierto: requiere resistor de pull-up externo (Rpu)
 *   hacia Vcc para producir un nivel alto; sin Rpu la salida no define HIGH.
 *
 * NO modelado:
 * - Tiempo de respuesta / propagación del comparador (LM393 ≈1.3 µs típico
 *   entre otras hojas de datos secundarias) — este simulador trata la
 *   transición de salida como instantánea frente a la rampa de entrada.
 * - Efecto de la corriente de polarización de entrada (Ib) sobre el punto
 *   exacto de VTH/VTL cuando R1/R2 son grandes — en un diseño real Ib
 *   introduce un desplazamiento adicional pequeño que aquí se desprecia.
 * - Carga real sobre el divisor Vref=Vcc/2 de la topología no inversora —
 *   se asume un divisor ideal sin carga (impedancia infinita en V-).
 * - Corriente de salida máxima, calentamiento del transistor de colector
 *   abierto y variación de VOL con la corriente real de Rpu.
 *
 * Nota de rigor:
 * - Varias hojas de datos de fabricantes que producen el LM393 como
 *   segunda fuente (ON Semiconductor, STMicroelectronics, TI) reportan
 *   valores típicos de VOL distintos según la corriente de prueba (se
 *   encontraron cifras entre 80 mV y 250 mV típico según fuente). Este
 *   simulador usa las cifras de la hoja de datos vigente de Texas
 *   Instruments, el fabricante actual de la parte — consulta siempre la
 *   hoja de datos del fabricante específico de tu componente físico.
 * - El margen de diseño del modo Reto (ΔV ≥ 1.5× el ruido pico-a-pico, y
 *   ΔV ≤ 60% de Vcc) es una convención pedagógica de este simulador, no
 *   una cifra de norma ni de hoja de datos.
 *
 * Fuentes:
 * - Texas Instruments, "LM393B, LM2903B, LM193, LM293, LM393 and LM2903
 *   Dual Comparators" — https://www.ti.com/lit/ds/symlink/lm393.pdf
 * - Texas Instruments, "LMx93-N, LM2903-N Low-Power, Low-Offset Voltage,
 *   Dual Comparators" — https://www.ti.com/lit/ds/symlink/lm393-n.pdf
 * - ON Semiconductor, "LM393 - Low Offset Voltage Dual Comparators" —
 *   https://www.onsemi.com/download/data-sheet/pdf/lm393-d.pdf
 * - Sedra & Smith, "Microelectronic Circuits"
 * - Boylestad & Nashelsky, "Electronic Devices and Circuit Theory"
 */
(function () {
  'use strict';
  const mount = document.getElementById('stage');
  const S = createStage(mount, { cam: [0, 4.5, 6.9], target: [0, 1.2, 0.45], bgTop: '#0d1a1a', bgBot: '#040a08', bloom: 0.35, minD: 3.0, maxD: 18 });
  const synth = makeSynth();

  function el(id) { return document.getElementById(id); }
  function showToast(msg, kind) {
    const t = el('toast');
    if (!t) return;
    clearTimeout(showToast._h);
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    showToast._h = setTimeout(() => { t.className = 'toast'; }, 2600);
  }
  function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

  // ---------- Dispositivo ----------
  const DEVS = {
    lm393: {
      name: 'LM393',
      volTyp: 0.25, volMax: 0.40,
      vosTyp: 0.002, vosMax: 0.005,
      ibTyp: 65e-9, ibMax: 250e-9,
      note: 'Comparador dual, colector abierto — requiere Rpu externo',
      color: 0x1a1a2e,
    },
  };
  const RPU = 4700;

  // ---------- Física ----------
  function solveSchmitt(topology, Vcc, R1, R2) {
    const dev = DEVS.lm393;
    const vol = dev.volTyp;
    let VTH, VTL;
    if (topology === 'inv') {
      VTH = Vcc * R1 / (R1 + R2);
      VTL = vol * R1 / (R1 + R2);
    } else {
      const vref = Vcc / 2;
      const x = R1 / R2;
      VTH = vref * (1 + x) - vol * x;
      VTL = vref * (1 + x) - Vcc * x;
    }
    const deltaV = VTH - VTL;
    const latchLow = topology === 'noninv' && VTH > Vcc;
    const latchHigh = topology === 'noninv' && VTL < 0;
    const outOfRange = latchLow || latchHigh;
    return { topology, Vcc, R1, R2, vol, VTH, VTL, deltaV, latchLow, latchHigh, outOfRange };
  }

  function rampVal(t, Vcc) {
    const tt = t % 1;
    return tt < 0.5 ? (tt * 2) * Vcc : (2 - tt * 2) * Vcc;
  }

  function simChatter(res, noiseAmp, n) {
    n = n || 200;
    const startHigh = res.topology === 'inv';
    let outHigh = startHigh;
    let transitions = 0;
    const vin = new Array(n), vout = new Array(n);
    for (let i = 0; i < n; i++) {
      const t = i / n;
      const noise = noiseAmp > 0 ? (Math.sin(i * 12.9898) * 43758.5453 % 1) : 0;
      const noiseV = noiseAmp > 0 ? ((noise - Math.floor(noise)) * 2 - 1) * noiseAmp : 0;
      const vinS = Math.max(0, Math.min(res.Vcc, rampVal(t, res.Vcc) + noiseV));
      vin[i] = vinS;
      let flip = false;
      if (res.topology === 'inv') {
        if (outHigh && vinS > res.VTH) { outHigh = false; flip = true; }
        else if (!outHigh && vinS < res.VTL) { outHigh = true; flip = true; }
      } else {
        if (!outHigh && vinS > res.VTH) { outHigh = true; flip = true; }
        else if (outHigh && vinS < res.VTL) { outHigh = false; flip = true; }
      }
      if (flip) transitions++;
      vout[i] = outHigh ? res.Vcc : res.vol;
    }
    return { vin, vout, transitions };
  }

  function fmtV(v) {
    const av = Math.abs(v);
    if (av < 1) return (v * 1000).toFixed(0) + ' mV';
    return v.toFixed(2) + ' V';
  }
  function fmtR(r) {
    if (r >= 1000) { const k = r / 1000; return (Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)) + ' kΩ'; }
    return r.toFixed(0) + ' Ω';
  }
  function fmtI(a) {
    const aa = Math.abs(a);
    if (aa < 1e-9) return (a * 1e12).toFixed(0) + ' pA';
    if (aa < 1e-6) return (a * 1e9).toFixed(0) + ' nA';
    if (aa < 1e-3) return (a * 1e6).toFixed(1) + ' µA';
    return (a * 1e3).toFixed(2) + ' mA';
  }

  // ---------- Estado ----------
  const VCC_VALS = [5, 9, 12];
  const R1_VALS = [1000, 2200, 4700, 10000, 22000];
  const R2_VALS = [4700, 10000, 22000, 47000, 100000, 220000];
  const NOISE_VALS = [0, 0.01, 0.02, 0.05, 0.1, 0.2];

  const state = {
    topology: 'inv',
    iVCC: 1, iR1: 2, iR2: 2, iNOISE: 2,
    mode: 'explora', hide: false, _revealed: false,
    _sweepTrace: null, _predType: 'vth', _reto: null, _predDone: false,
    retoSolved: false, intentos: 0, fallosSeguidos: 0, pistas: 0, pistaLog: [],
  };

  function curVCC() { return VCC_VALS[state.iVCC]; }
  function curR1() { return R1_VALS[state.iR1]; }
  function curR2() { return R2_VALS[state.iR2]; }
  function curNoise() { return NOISE_VALS[state.iNOISE]; }
  function curSolveSchmitt() { return solveSchmitt(state.topology, curVCC(), curR1(), curR2()); }
  function curSimChatter(res) { return simChatter(res || curSolveSchmitt(), curNoise(), 200); }
  function curColor() {
    const res = curSolveSchmitt();
    if (res.outOfRange) return 0xef4444;
    const sim = curSimChatter(res);
    return sim.transitions > 2 ? 0xf59e0b : 0x22c55e;
  }

  // ---------- Materiales y geometría 3D ----------
  const MAT = {
    board: { color: 0x2b2f36, roughness: 0.85, metalness: 0.1 },
    resistorBody: { color: 0xd8c08a, roughness: 0.6, metalness: 0.05 },
    lead: { color: 0xc7c7c7, roughness: 0.35, metalness: 0.8 },
    icBody: { color: 0x1a1a2e, roughness: 0.5, metalness: 0.2 },
    notch: { color: 0x08080c, roughness: 0.5, metalness: 0.1 },
  };
  function std(spec) { return new THREE.MeshStandardMaterial(spec); }

  /* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde
     ya importa), traducidos una vez a los materiales de este laboratorio. */
  const MATP = {
    aluminio: std({ color: 0x9aa3ad, roughness: 0.34, metalness: 0.86 }),
    acero: std(MAT.lead), cromo: std(MAT.lead),
    cobre: std({ color: 0xb87333, roughness: 0.35, metalness: 0.75 }),
    chapa: std({ color: 0x8f98a3, roughness: 0.40, metalness: 0.80 }),
    negro: std({ color: 0x14181e, roughness: 0.62, metalness: 0.06 }),
    goma: std({ color: 0x14181e, roughness: 0.8, metalness: 0.02 }),
    blanco: std({ color: 0xd7dee6, roughness: 0.4, metalness: 0.2 }),
    ceramica: std({ color: 0xd7dee6, roughness: 0.6, metalness: 0.05 }),
  };
  // ---------- Glifos de esquemático ----------
  function line(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = w || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function groundGlyph(ctx, x, y) {
    line(ctx, x, y, x, y + 10, 2, '#8fe3d0');
    line(ctx, x - 14, y + 10, x + 14, y + 10, 2, '#8fe3d0');
    line(ctx, x - 8, y + 16, x + 8, y + 16, 2, '#8fe3d0');
    line(ctx, x - 3, y + 22, x + 3, y + 22, 2, '#8fe3d0');
  }
  function vResistorGlyph(ctx, x, y, h, col) {
    ctx.strokeStyle = col || '#e8c568'; ctx.lineWidth = 2;
    ctx.strokeRect(x - 8, y, 16, h);
  }
  function hResistorGlyph(ctx, x, y, w, col) {
    ctx.strokeStyle = col || '#e8c568'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y - 8, w, 16);
  }
  function acSourceGlyph(ctx, x, y, r, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    for (let i = 0; i <= 20; i++) {
      const t = i / 20, xx = x - r * 0.6 + t * r * 1.2, yy = y + Math.sin(t * Math.PI * 2) * r * 0.35;
      if (i === 0) ctx.moveTo(xx, yy); else ctx.lineTo(xx, yy);
    }
    ctx.stroke();
  }
  function comparatorGlyph(ctx, x, y, w, h, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2); ctx.lineTo(x, y + h / 2); ctx.lineTo(x + w, y); ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = '#8fe3d0'; ctx.font = '13px sans-serif';
    ctx.fillText('−', x + 6, y - h / 2 + 20);
    ctx.fillText('+', x + 6, y + h / 2 - 12);
  }

  // ---------- Layout ----------
  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const CMP_X = 340, CMP_Y = 250, CMP_W = 70, CMP_H = 100;
  const MINUS_Y = CMP_Y - 25, PLUS_Y = CMP_Y + 25;
  const SRC_X = 90, SUM_X = 300, OUT_STUB = CMP_X + CMP_W + 30;
  const GND_Y = 430, DIV_Y = 340, RPU_X = OUT_STUB + 50;

  let HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id, x, y, w, h, label }); }

  function drawSchematic(ctx) {
    HIT = [];
    ctx.clearRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);

    comparatorGlyph(ctx, CMP_X, CMP_Y, CMP_W, CMP_H, '#8fe3d0');
    addHit('cmp', CMP_X, CMP_Y - CMP_H / 2, CMP_W, CMP_H, 'LM393');

    // Salida + Rpu hacia Vcc
    line(ctx, CMP_X + CMP_W, CMP_Y, OUT_STUB, CMP_Y, 2, '#8fe3d0');
    vResistorGlyph(ctx, RPU_X, CMP_Y - 60, 40, '#c99a3a');
    addHit('rpu', RPU_X, CMP_Y - 60, 16, 40, 'Rpu');
    line(ctx, RPU_X, CMP_Y - 20, RPU_X, CMP_Y, 2, '#8fe3d0');
    line(ctx, RPU_X, CMP_Y, OUT_STUB, CMP_Y, 2, '#8fe3d0');
    line(ctx, RPU_X, CMP_Y - 100, RPU_X, CMP_Y - 100, 2, '#8fe3d0');
    line(ctx, RPU_X, CMP_Y - 60 - 40, RPU_X, CMP_Y - 100, 2, '#8fe3d0');
    line(ctx, RPU_X - 30, CMP_Y - 100, RPU_X + 10, CMP_Y - 100, 2, '#8fe3d0');
    ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif';
    ctx.fillText('+Vcc', RPU_X - 20, CMP_Y - 108);
    line(ctx, OUT_STUB, CMP_Y, OUT_STUB + 40, CMP_Y, 2, '#8fe3d0');
    addHit('out', OUT_STUB, CMP_Y - 10, 60, 20, 'Vout');
    ctx.fillText('Vout', OUT_STUB + 44, CMP_Y + 4);

    // Fuente vin
    acSourceGlyph(ctx, SRC_X, MINUS_Y, 18, '#8fe3d0');
    addHit('src', SRC_X - 18, MINUS_Y - 18, 36, 36, 'vin');
    ctx.fillText('vin', SRC_X - 10, MINUS_Y - 26);
    groundGlyph(ctx, SRC_X, GND_Y - 20);
    line(ctx, SRC_X, MINUS_Y + 18, SRC_X, GND_Y - 20, 2, '#8fe3d0');

    if (state.topology === 'inv') {
      // vin -> V- directo
      line(ctx, SRC_X, MINUS_Y, CMP_X, MINUS_Y, 2, '#8fe3d0');
      // Divisor R1 (a GND) / R2 (feedback) en V+
      line(ctx, SUM_X, PLUS_Y, CMP_X, PLUS_Y, 2, '#8fe3d0');
      vResistorGlyph(ctx, SUM_X, PLUS_Y, 50, '#e8c568');
      addHit('r1', SUM_X, PLUS_Y, 16, 50, 'R1');
      line(ctx, SUM_X, PLUS_Y + 50, SUM_X, GND_Y, 2, '#8fe3d0');
      groundGlyph(ctx, SUM_X, GND_Y);
      vResistorGlyph(ctx, SUM_X, DIV_Y - 100, 60, '#e8c568');
      addHit('r2', SUM_X, DIV_Y - 100, 16, 60, 'R2');
      line(ctx, SUM_X, PLUS_Y, SUM_X, DIV_Y - 40, 2, '#8fe3d0');
      line(ctx, SUM_X, DIV_Y - 100, SUM_X, PY0 + 10, 2, '#8fe3d0');
      line(ctx, SUM_X, PY0 + 10, OUT_STUB + 40, PY0 + 10, 2, '#8fe3d0');
      line(ctx, OUT_STUB + 40, PY0 + 10, OUT_STUB + 40, CMP_Y, 2, '#8fe3d0');
      ctx.fillText('R1', SUM_X + 20, PLUS_Y + 28);
      ctx.fillText('R2', SUM_X + 20, DIV_Y - 68);
      ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('INVERSOR', PX0 + 10, PY0 + 14);
    } else {
      // vin -> R1 -> V+
      hResistorGlyph(ctx, SRC_X + 30, PLUS_Y, 60, '#e8c568');
      addHit('r1', SRC_X + 30, PLUS_Y, 60, 16, 'R1');
      line(ctx, SRC_X, PLUS_Y, SRC_X + 30, PLUS_Y, 2, '#8fe3d0');
      line(ctx, SRC_X, MINUS_Y, SRC_X, PLUS_Y, 0, '#8fe3d0');
      line(ctx, SRC_X + 90, PLUS_Y, CMP_X, PLUS_Y, 2, '#8fe3d0');
      ctx.fillText('R1', SRC_X + 45, PLUS_Y - 12);
      // Vref fijo en V-
      ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif';
      ctx.fillText('Vref = Vcc/2', CMP_X - 90, MINUS_Y - 8);
      line(ctx, CMP_X - 40, MINUS_Y, CMP_X, MINUS_Y, 2, '#8fe3d0');
      // Realimentación R2 desde Vout hacia V+
      vResistorGlyph(ctx, SRC_X + 60, DIV_Y - 90, 60, '#e8c568');
      addHit('r2', SRC_X + 60, DIV_Y - 90, 16, 60, 'R2');
      line(ctx, SRC_X + 60, PLUS_Y, SRC_X + 60, DIV_Y - 30, 2, '#8fe3d0');
      line(ctx, SRC_X + 60, DIV_Y - 90, SRC_X + 60, PY0 + 10, 2, '#8fe3d0');
      line(ctx, SRC_X + 60, PY0 + 10, OUT_STUB + 40, PY0 + 10, 2, '#8fe3d0');
      line(ctx, OUT_STUB + 40, PY0 + 10, OUT_STUB + 40, CMP_Y, 2, '#8fe3d0');
      ctx.fillText('R2', SRC_X + 76, DIV_Y - 58);
      ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 14px sans-serif';
      ctx.fillText('NO INVERSOR', PX0 + 10, PY0 + 14);
    }

    ctx.font = 'bold 13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.fillText('Estado oculto — predice antes de revelar', PX0 + 10, PY1 - 12);
    } else {
      const res = curSolveSchmitt();
      if (res.outOfRange) { ctx.fillStyle = '#ef4444'; ctx.fillText('ENGANCHADO (fuera de 0–Vcc)', PX0 + 10, PY1 - 12); }
      else {
        const sim = curSimChatter(res);
        if (sim.transitions > 2) { ctx.fillStyle = '#f59e0b'; ctx.fillText('REBOTE (chatter)', PX0 + 10, PY1 - 12); }
        else { ctx.fillStyle = '#22c55e'; ctx.fillText('CONMUTACIÓN LIMPIA', PX0 + 10, PY1 - 12); }
      }
    }
  }

  // ---------- Gráfica: lazo de histéresis ----------
  function xPixV(v, Vcc) { return GX0 + 30 + (v / Vcc) * (GX1 - GX0 - 50); }
  function yPixV(v, Vcc) { return GY1 - 30 - (v / Vcc) * (GY1 - GY0 - 50); }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    const Vcc = curVCC();
    ctx.strokeStyle = '#233532'; ctx.lineWidth = 1;
    line(ctx, GX0 + 30, GY0 + 10, GX0 + 30, GY1 - 30, 1, '#233532');
    line(ctx, GX0 + 30, GY1 - 30, GX1 - 20, GY1 - 30, 1, '#233532');
    ctx.fillStyle = '#6b8a83'; ctx.font = '11px sans-serif';
    ctx.fillText('Vin', GX1 - 40, GY1 - 12);
    ctx.save(); ctx.translate(GX0 + 12, GY0 + 20); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vout', 0, 0); ctx.restore();

    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Lazo oculto — predice antes de revelar', GX0 + 40, (GY0 + GY1) / 2);
      return;
    }

    const res = curSolveSchmitt();
    const vth = Math.max(0, Math.min(Vcc, res.VTH));
    const vtl = Math.max(0, Math.min(Vcc, res.VTL));
    const xTH = xPixV(vth, Vcc), xTL = xPixV(vtl, Vcc);
    const yHi = yPixV(Vcc, Vcc), yLo = yPixV(res.vol, Vcc);
    const x0 = xPixV(0, Vcc), x1 = xPixV(Vcc, Vcc);

    ctx.lineWidth = 2.5;
    if (res.topology === 'inv') {
      if (!res.outOfRange) {
        ctx.strokeStyle = '#5fb8ff';
        line(ctx, x0, yHi, xTH, yHi, 2.5, '#5fb8ff');
        line(ctx, xTH, yHi, xTH, yLo, 2.5, '#5fb8ff');
        line(ctx, xTH, yLo, x1, yLo, 2.5, '#5fb8ff');
        ctx.strokeStyle = '#f59e0b';
        line(ctx, x1, yLo, xTL, yLo, 2.5, '#f59e0b');
        line(ctx, xTL, yLo, xTL, yHi, 2.5, '#f59e0b');
        line(ctx, xTL, yHi, x0, yHi, 2.5, '#f59e0b');
      }
    } else {
      if (res.latchLow) { line(ctx, x0, yLo, x1, yLo, 2.5, '#ef4444'); }
      else if (res.latchHigh && !res.latchLow) {
        ctx.strokeStyle = '#5fb8ff';
        line(ctx, x0, yLo, xTH, yLo, 2.5, '#5fb8ff');
        line(ctx, xTH, yLo, xTH, yHi, 2.5, '#5fb8ff');
        line(ctx, xTH, yHi, x1, yHi, 2.5, '#5fb8ff');
      } else {
        ctx.strokeStyle = '#5fb8ff';
        line(ctx, x0, yLo, xTH, yLo, 2.5, '#5fb8ff');
        line(ctx, xTH, yLo, xTH, yHi, 2.5, '#5fb8ff');
        line(ctx, xTH, yHi, x1, yHi, 2.5, '#5fb8ff');
        ctx.strokeStyle = '#f59e0b';
        line(ctx, x1, yHi, xTL, yHi, 2.5, '#f59e0b');
        line(ctx, xTL, yHi, xTL, yLo, 2.5, '#f59e0b');
        line(ctx, xTL, yLo, x0, yLo, 2.5, '#f59e0b');
      }
    }
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    if (!res.outOfRange || res.latchHigh) { line(ctx, xTH, GY0 + 10, xTH, GY1 - 30, 1, '#5fb8ff'); }
    if (!res.outOfRange) { line(ctx, xTL, GY0 + 10, xTL, GY1 - 30, 1, '#f59e0b'); }
    ctx.setLineDash([]);
    ctx.fillStyle = '#5fb8ff'; ctx.font = '11px sans-serif';
    ctx.fillText('VTH=' + fmtV(res.VTH), GX0 + 34, GY0 + 24);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('VTL=' + fmtV(res.VTL), GX0 + 34, GY0 + 40);

    if (state.mode === 'medicion' && state._sweepTrace && state._sweepTrace.length) {
      ctx.fillStyle = '#c084fc'; ctx.font = '10px sans-serif';
      let ty = GY0 + 60;
      ctx.fillText('Barrido R2 → transiciones:', GX0 + 34, ty);
      state._sweepTrace.forEach(pt => {
        ty += 13;
        ctx.fillText(fmtR(pt.r2) + ' → ΔV=' + fmtV(pt.deltaV) + ' · ' + pt.transitions + ' transic.', GX0 + 34, ty);
      });
    }
  }

  function drawBoard() { drawSchematic(bctx); drawGraph(bctx); }

  function boardClick(u, v) {
    const px = u * 1024, py = (1 - v) * 768;
    for (const h of HIT) {
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        actToast(h.id); dispatch3D(h.id); return;
      }
    }
  }

  // ---------- Escena: tablero ----------
  /* El pizarrón (esquemático + lazo de histéresis) va arriba y al fondo; debajo, el
     montaje REAL sobre un protoboard: LM393 en su DIP-8, R1, R2 y Rpu con las bandas
     de su valor, el cableado que cambia entre inversor y no inversor, y en el
     estante la fuente, el generador (rampa + ruido), el osciloscopio y el medidor. */
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 768;
  const bctx = boardCanvas.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });

  // ---------- Escena: banco ----------
  /* ---------- Piezas del banco que la biblioteca aún no trae ---------- */
  // Código EIA de tres cifras de un cerámico: 100 nF → «104».
  function codigoEIA(F) {
    const pF = F * 1e12;
    let e = Math.floor(Math.log10(pF)) - 1;
    let m = Math.round(pF / Math.pow(10, e));
    if (m >= 100) { m = Math.round(m / 10); e += 1; }
    return String(m) + String(Math.max(0, e));
  }
  // Cerámico de disco: lenteja ocre con el código EIA impreso y dos patas rectas.
  function ceramicoDisco(F, volt) {
    const R = 0.115, t = 0.07, paso = 0.1, yc = R + 0.10;
    const g = new THREE.Group();
    const cuerpo = new THREE.Mesh(P3.revolucion([[0, -t / 2], [R * 0.90, -t / 2], [R, -t * 0.18],
      [R, t * 0.18], [R * 0.90, t / 2], [0, t / 2]], { seg: 32 }),
      new THREE.MeshStandardMaterial({ color: 0xc98a3a, roughness: 0.55, metalness: 0.05 }));
    cuerpo.rotation.x = Math.PI / 2; cuerpo.position.y = yc; cuerpo.castShadow = true; g.add(cuerpo);
    const cv = document.createElement('canvas'); cv.width = 256; cv.height = 192;
    const c = cv.getContext('2d');
    c.fillStyle = '#3a2410'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 92px sans-serif'; c.fillText(codigoEIA(F), 128, 78);
    c.font = '52px sans-serif'; c.fillText(volt || '50V', 128, 150);
    const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    const tinta = new THREE.Mesh(new THREE.PlaneGeometry(R * 1.45, R * 1.45 * 0.75),
      new THREE.MeshStandardMaterial({ map: tx, transparent: true, roughness: 0.6, depthWrite: false,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
    tinta.position.set(0, yc, t / 2 + 0.002); g.add(tinta);
    for (const sx of [-1, 1]) {
      const pata = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, yc + 0.12, 8), MATP.acero);
      pata.position.set(sx * paso / 2, (yc - 0.12) / 2 - 0.0, 0); g.add(pata);
    }
    g.userData = { F: F, paso: paso };
    return g;
  }
  // Osciloscopio de banco (P3.osciloscopioBanco) reducido sobre el estante, con un
  // lienzo propio para la pantalla y cables que salen de sus BNC.
  function osciloscopioEnEstante(BANCO, x, esc, cw) {
    const g = P3.osciloscopioBanco(MATP, { ancho: 1.9, alto: 1.2, fondo: 0.8, pantallaX: -0.30, pantallaY: 0.12,
      visor: [1.04, 0.80],
      mandos: [{ id: 'tiempo', x: 0.50, y: 0.34, r: 0.085, rotulo: 'BASE T.' }, { id: 'nivel', x: 0.80, y: 0.34, r: 0.085, rotulo: 'NIVEL' },
               { id: 'v1', x: 0.50, y: 0.00, r: 0.085, rotulo: 'V/DIV' }, { id: 'v2', x: 0.80, y: 0.00, r: 0.085, rotulo: 'POS.' }],
      bnc: [{ x: 0.55, color: 0xe0c040 }, { x: 0.82, color: 0x4fc3f7 }] });
    const vis = g.userData.visor;
    const cv = document.createElement('canvas'); cv.width = cw || 416; cv.height = Math.round((cw || 416) * vis.alto / vis.ancho);
    const cx = cv.getContext('2d');
    const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(vis.ancho, vis.alto), new THREE.MeshBasicMaterial({ map: tex, toneMapped: false }));
    g.userData.pantalla.add(screen);
    g.scale.setScalar(esc);
    g.position.set(x, BANCO.userData.estanteY + g.userData.apoyo * esc, -1.15);
    BANCO.add(g);
    return { g: g, cv: cv, cx: cx, tex: tex, screen: screen, esc: esc };
  }
  // Un cable de colores desde una boca de instrumento (en coordenadas del mundo) hasta un agujero.
  function cableDesde(BANCO, circG, boca, agujero, color) {
    const prot = BANCO.userData.prot, K = BANCO.userData.K;
    const B = boca.clone().sub(prot.position).multiplyScalar(1 / K);
    const w = P3.puente(MATP, agujero, B, { color: color, r: 0.026 / K, alto: 0.30, pinB: false });
    circG.add(w); return w;
  }
  function bocaInstrumento(inst, j) {
    inst.g.updateMatrixWorld(true);
    return inst.bocas[j].clone().applyMatrix4(inst.g.matrixWorld);
  }
  function bocaBNC(esc, j) {
    esc.g.updateMatrixWorld(true);
    const b = esc.g.userData.bnc[j];
    return new THREE.Vector3(0, 0, 0.10).applyMatrix4(b.matrixWorld);
  }
  // Un lienzo pensado para `base` px de ancho se pinta escalado sobre el real, sin tocar sus cotas.
  function lienzo(box, base) {
    const cv = box.userData.canvas, c = box.userData.ctx, k = cv.width / base;
    c.setTransform(k, 0, 0, k, 0, 0);
    return { c: c, W: cv.width / k, H: cv.height / k };
  }
  function cajaDe(inst) { return { userData: { canvas: inst.cv, ctx: inst.cx, tex: inst.tex } }; }
  // Recorta el pizarrón al tramo del lienzo (480 de 768 px) que de verdad se pinta; las UV
  // remapeadas hacen que boardClick siga leyendo píxeles de lienzo correctos.
  function pizarronRecortado(boardMat, marcoMat) {
    const FR = 480 / 768;
    const geo = new THREE.PlaneGeometry(4.2, 3.15 * FR);
    const uv = geo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - FR + uv.getY(i) * FR);
    const plano = new THREE.Mesh(geo, boardMat);
    const marco = new THREE.Mesh(new THREE.BoxGeometry(4.32, 3.15 * FR + 0.12, 0.06), marcoMat);
    marco.position.z = -0.04;
    const g = new THREE.Group(); g.add(marco, plano);
    g.scale.setScalar(0.78); g.position.set(0, 2.5, -1.55);
    return { g: g, plano: plano, marco: marco };
  }
  const PZ = pizarronRecortado(boardMat, std({ color: 0x1b1f24, roughness: 0.8, metalness: 0.2 }));
  const boardG = PZ.g, boardPlane = PZ.plano, boardFrame = PZ.marco;
  S.scene.add(boardG);

  const BANCO = P3.bancoPrototipos(MATP, { cols: 18, K: 1.7, instrumentos: 3,
    dims: [{ ancho: 0.84, alto: 0.56, visorAlto: 0.60 }, { ancho: 0.84, alto: 0.50 }, { ancho: 0.92, alto: 0.64, visorAlto: 0.68 }] });
  const benchG = BANCO;
  const circG = BANCO.userData.circ, H = BANCO.userData.H;
  const railNear = BANCO.userData.rielCerca;
  const fuenteInst = BANCO.userData.instrumento(0);
  const genInst = BANCO.userData.instrumento(1);
  const medidorInst = BANCO.userData.instrumento(2);
  fuenteInst.g.position.x = -1.72; genInst.g.position.x = -0.72; medidorInst.g.position.x = 1.62;
  const scopeInst = osciloscopioEnEstante(BANCO, 0.42, 0.52, 416);
  const fuenteBox = cajaDe(fuenteInst), genBox = cajaDe(genInst), medidorBox = cajaDe(medidorInst), scopeBox = cajaDe(scopeInst);
  const CABLE = { rojo: 0xd64545, negro: 0x1b1f24, azul: 0x2a5fa8, amarillo: 0xe0a21c, verde: 0x2f9e5b, naranja: 0xe07b22 };

  /* LA ZONA DE MONTAJE. Inversor y no inversor se cablean distinto —quién entra
     por IN− o por IN+, y si hace falta el divisor de Vref—, así que la placa se
     rehace al cambiar de topología; los valores sólo repintan bandas. */
  let r1G = null, r2G = null, rpuG = null, icG = null, circKey = '';
  function armaCircuito() {
    const key = state.topology;
    if (key === circKey) return;
    circKey = key;
    BANCO.userData.limpia(); BANCO.userData.reiniciaRieles();
    const inv = state.topology === 'inv';
    function wire(a, b, col, o) { const w = P3.puente(MATP, a, b, Object.assign({ color: col }, o || {})); circG.add(w); return w; }
    function res(ohm, c1, f1, c2, f2) {
      const g = P3.resistorAxial(MATP, { ohm: ohm, paso: Math.abs(c2 - c1) * 0.1 });
      g.position.copy(H(c1, f1)).lerp(H(c2, f2), 0.5); g.position.y = H(c1, f1).y;
      circG.add(g); return g;
    }
    // LM393: 1 OUT · 2 IN− · 3 IN+ · 4 GND delante; 8 V+ detrás (el comparador B queda libre).
    const DC = 7;
    icG = P3.dipRotulado(MATP, { pines: 8, rotulo: 'LM393', rotulo2: 'CEN LABS' });
    icG.position.copy(H(DC + 1.5, 'e')).lerp(H(DC + 1.5, 'f'), 0.5); icG.position.y = H(DC, 'e').y;
    circG.add(icG);
    const alto = { minAlto: 0.30 };
    wire(H(DC, 'g'), railNear('+', DC), CABLE.rojo);                  // pin 8 → +Vcc
    wire(H(DC + 3, 'd'), railNear('-', DC + 3), CABLE.negro, alto);   // pin 4 → GND
    // Rpu (colector abierto): de la salida a +Vcc
    rpuG = res(RPU, DC, 'd', DC - 4, 'd');
    wire(H(DC - 4, 'e'), railNear('+', DC - 4), CABLE.rojo, alto);
    // R2: realimentación positiva, de la salida a IN+ (puente corto de su extremo a la salida)
    r2G = res(curR2(), DC + 2, 'b', DC - 2, 'b');
    wire(H(DC - 2, 'c'), H(DC, 'c'), CABLE.verde);
    let nodoIN, nodoINb;
    if (inv) {
      // vin entra por IN−; R1 de IN+ a GND
      r1G = res(curR1(), DC + 2, 'c', DC + 6, 'c');
      wire(H(DC + 6, 'e'), railNear('-', DC + 6), CABLE.negro, alto);
      nodoIN = H(DC + 1, 'a'); nodoINb = H(DC + 1, 'c');
    } else {
      // vin entra por R1 hasta IN+; Vref = Vcc/2 en IN− con un divisor de dos resistores iguales
      r1G = res(curR1(), DC + 2, 'c', DC + 6, 'c');
      nodoIN = H(DC + 6, 'a'); nodoINb = H(DC + 6, 'b');
      wire(H(DC + 1, 'd'), H(DC + 7, 'g'), CABLE.amarillo, alto);      // IN− → nodo del divisor
      const ra = res(10000, DC + 7, 'h', DC + 10, 'h'); ra.userData.title = 'Divisor Vref: 10 kΩ a +Vcc';
      wire(H(DC + 10, 'j'), railNear('+', DC + 10), CABLE.rojo);
      const rb = res(10000, DC + 7, 'i', DC + 4, 'i'); rb.userData.title = 'Divisor Vref: 10 kΩ a GND';
      wire(H(DC + 4, 'g'), railNear('-', DC + 4), CABLE.negro);
    }
    // instrumentos: Vcc en los rieles; el generador (vin) en su nodo; el medidor en IN+
    cableDesde(BANCO, circG, bocaInstrumento(fuenteInst, 0), railNear('+', 3), CABLE.rojo);
    cableDesde(BANCO, circG, bocaInstrumento(fuenteInst, 1), railNear('-', 4), CABLE.negro);
    cableDesde(BANCO, circG, bocaInstrumento(genInst, 0), nodoIN, CABLE.amarillo);
    cableDesde(BANCO, circG, bocaInstrumento(genInst, 1), railNear('-', 5), CABLE.negro);
    cableDesde(BANCO, circG, bocaBNC(scopeInst, 0), nodoINb, CABLE.amarillo);
    cableDesde(BANCO, circG, bocaBNC(scopeInst, 1), H(DC, 'a'), CABLE.naranja);
    cableDesde(BANCO, circG, bocaInstrumento(medidorInst, 0), H(DC + 2, 'd'), CABLE.verde);
    cableDesde(BANCO, circG, bocaInstrumento(medidorInst, 1), railNear('-', 14), CABLE.negro);
    circG.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  armaCircuito();
  boardPlane.castShadow = false; boardFrame.receiveShadow = true;
  S.scene.add(benchG);

  function refreshBenchSel() {
    armaCircuito();
    r1G.userData.ponValor(curR1());
    r2G.userData.ponValor(curR2());
  }

  function drawGenScreen() {
    const L = lienzo(genBox, 220), c = L.c, W = L.W, Hh = L.H;
    c.fillStyle = '#0b1310'; c.fillRect(0, 0, W, Hh);
    c.fillStyle = '#5fb8ff'; c.font = 'bold 15px sans-serif';
    c.fillText('rampa 0 – ' + fmtV(curVCC()), 12, 28);
    c.fillStyle = '#8fe3d0'; c.font = '13px sans-serif';
    c.fillText('ruido ' + (curNoise() > 0 ? fmtV(curNoise()) + ' pico' : 'sin ruido'), 12, 50);
    c.strokeStyle = '#5fb8ff'; c.lineWidth = 2; c.beginPath();
    c.moveTo(12, Hh * 0.88); c.lineTo(W / 2, Hh * 0.62); c.lineTo(W - 12, Hh * 0.88);
    c.stroke();
    genBox.userData.tex.needsUpdate = true;
  }
  function drawFuenteScreen() {
    const L = lienzo(fuenteBox, 220), ctx = L.c, canvas = { width: L.W, height: L.H }, tex = fuenteBox.userData.tex;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Vcc = ' + fmtV(curVCC()), 14, 30);
    ctx.font = '13px sans-serif';
    ctx.fillText(DEVS.lm393.name, 14, 54);
    ctx.fillText(state.topology === 'inv' ? 'Inversor' : 'No inversor', 14, 74);
    ctx.fillText('Rpu = ' + fmtR(RPU), 14, 94);
    tex.needsUpdate = true;
  }
  function drawMedidorScreen() {
    const L = lienzo(medidorBox, 220), ctx = L.c, canvas = { width: L.W, height: L.H }, tex = medidorBox.userData.tex;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#6b8a83'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('VTH: ?   VTL: ?', 14, 40);
      ctx.fillText('¿limpio o rebote?', 14, 66);
    } else {
      const res = curSolveSchmitt();
      const sim = curSimChatter(res);
      ctx.fillStyle = '#5fb8ff'; ctx.fillText('VTH = ' + fmtV(res.VTH), 14, 26);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('VTL = ' + fmtV(res.VTL), 14, 46);
      ctx.fillStyle = '#8fe3d0'; ctx.fillText('ΔV = ' + fmtV(res.deltaV), 14, 66);
      ctx.fillText('Transiciones: ' + sim.transitions, 14, 86);
      ctx.font = 'bold 13px sans-serif';
      if (res.outOfRange) { ctx.fillStyle = '#ef4444'; ctx.fillText('ENGANCHADO', 14, 110); }
      else if (sim.transitions > 2) { ctx.fillStyle = '#f59e0b'; ctx.fillText('REBOTE', 14, 110); }
      else { ctx.fillStyle = '#22c55e'; ctx.fillText('LIMPIO', 14, 110); }
    }
    tex.needsUpdate = true;
  }
  function drawScopeScreen() {
    const L = lienzo(scopeBox, 260), ctx = L.c, canvas = { width: L.W, height: L.H }, tex = scopeBox.userData.tex;
    ctx.fillStyle = '#05100c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#12312a'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (canvas.height - 20) / 4; line(ctx, 10, y, canvas.width - 10, y, 1, '#12312a'); }
    const res = curSolveSchmitt();
    const sim = curSimChatter(res);
    const Vcc = res.Vcc;
    const toX = i => 10 + (i / sim.vin.length) * (canvas.width - 20);
    const toY = v => (canvas.height - 10) - (v / Vcc) * (canvas.height - 20);
    ctx.strokeStyle = '#5fb8ff'; ctx.lineWidth = 1.5; ctx.beginPath();
    sim.vin.forEach((v, i) => { const x = toX(i), y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();

    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = '11px sans-serif';
      ctx.fillText('vout oculto — predice antes de revelar', 12, canvas.height - 4);
      tex.needsUpdate = true;
      return;
    }

    ctx.strokeStyle = res.outOfRange ? '#ef4444' : (sim.transitions > 2 ? '#f59e0b' : '#22c55e');
    ctx.lineWidth = 1.5; ctx.beginPath();
    sim.vout.forEach((v, i) => { const x = toX(i), y = toY(v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('vin / vout · osciloscopio', 12, canvas.height - 4);
    tex.needsUpdate = true;
  }
  function refreshBenchDyn() { drawFuenteScreen(); drawGenScreen(); drawMedidorScreen(); drawScopeScreen(); }


  // ---------- HUD ----------
  el('hud').innerHTML = `
    <div class="eyebrow">MEC · D2 · Electrónica integrada</div>
    <div class="h2">Comparador Schmitt Trigger (LM393)</div>
    <div class="p">Un comparador simple conmuta en un único umbral: si la señal tiene ruido cerca de ese punto, la salida rebota (chatter). El Schmitt trigger resuelve esto con <b>realimentación positiva</b>: dos umbrales distintos, VTH (para subir) y VTL (para bajar), que abren una ventana de histéresis ΔV mayor que el ruido esperado.</div>
    <div class="formula">Inversor: VTH=Vcc·R1/(R1+R2) · VTL=VOL·R1/(R1+R2)</div>
    <div class="formula">No inversor: VTH=Vref(1+R1/R2)−VOL·R1/R2 · VTL=Vref(1+R1/R2)−Vcc·R1/R2</div>
    <div class="legend">
      <span class="li"><span class="dot" style="background:#5fb8ff"></span>VTH — umbral de subida</span>
      <span class="li"><span class="dot" style="background:#f59e0b"></span>VTL — umbral de bajada</span>
      <span class="li"><span class="dot" style="background:#22c55e"></span>ΔV=VTH−VTL — ventana de histéresis</span>
    </div>
    <div class="fid"><b>SÍ verificado:</b> VTH/VTL/ΔV deducidos por análisis de nodo con realimentación positiva (topología inversora y no inversora) · LM393: Ib, Vos, VOL de hoja de datos TI vigente · salida en colector abierto requiere Rpu externo.<br><b>NO modelado:</b> tiempo de respuesta/propagación (~1.3µs típico, tratado como instantáneo) · efecto de Ib en el punto exacto de VTH/VTL · carga real sobre el divisor Vref=Vcc/2 · calentamiento y variación de VOL con la corriente de Rpu.</div>
    <div class="src">Fuentes: TI LM393(-N) datasheet · ON Semi LM393 datasheet · Sedra &amp; Smith, "Microelectronic Circuits" · Boylestad &amp; Nashelsky, "Electronic Devices and Circuit Theory"</div>
  `;

  // ---------- Panel ----------
  el('panel').innerHTML = `
    <h4>Schmitt Trigger · <span id="p_mode">Explora</span></h4>
    <div class="modebar">
      <button class="b on" id="btn-mode-explora">🔍 Explora</button>
      <button class="b" id="btn-mode-predice">🧠 Predicción</button>
      <button class="b" id="btn-mode-medicion">📏 Medición</button>
      <button class="b" id="btn-mode-reto">🎯 Reto</button>
    </div>
    <div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
    <div class="btns" style="margin-top:8px">
      <button class="b on" id="topoToggle" style="width:100%">Topología: Inversor</button>
    </div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">
      <div>Vcc</div><button class="b" id="vccDec" style="padding:2px 8px">−</button><span id="vVCC">—</span><button class="b" id="vccInc" style="padding:2px 8px">+</button>
      <div>R1</div><button class="b" id="r1Dec" style="padding:2px 8px">−</button><span id="vR1">—</span><button class="b" id="r1Inc" style="padding:2px 8px">+</button>
      <div>R2</div><button class="b" id="r2Dec" style="padding:2px 8px">−</button><span id="vR2">—</span><button class="b" id="r2Inc" style="padding:2px 8px">+</button>
      <div>Ruido</div><button class="b" id="noiseDec" style="padding:2px 8px">−</button><span id="vNOISE">—</span><button class="b" id="noiseInc" style="padding:2px 8px">+</button>
    </div>
    <div id="telemetry" style="margin-top:10px;font-size:12px;color:#EAF4F1;line-height:1.5"></div>
    <div id="predWrap" style="display:none;margin-top:10px">
      <div id="predBox"></div>
      <div class="btns" style="margin-top:6px">
        <button class="b" id="predNew" style="flex:1 0 48%">Nuevo</button>
        <button class="b" id="predCheck" style="flex:1 0 48%">Comprobar</button>
      </div>
    </div>
    <div id="retoWrap" style="display:none;margin-top:10px">
      <div id="retoBox"></div>
      <div class="btns" style="margin-top:6px">
        <button class="b" id="retoNew" style="flex:1 0 48%">Nuevo reto</button>
        <button class="b" id="retoCheck" style="flex:1 0 48%">Comprobar</button>
        <button class="b" id="retoHint" style="flex:1 0 100%">💡 Pista (máx. 2)</button>
      </div>
    </div>
    <div id="sweepWrap" style="display:none;margin-top:10px">
      <button class="b" id="sweepRun" style="width:100%">▶ Ejecutar barrido de R2</button>
    </div>
    <div id="report" style="margin-top:10px;font-size:11px;color:#8FB3AC;line-height:1.5"></div>
    <div style="margin-top:14px;border-top:1px solid #1E3A34;padding-top:10px" id="quizBox"></div>
    <button class="b" id="autoTour" style="width:100%;margin-top:10px">🎬 Tour guiado</button>
  `;

  const MODES = ['explora', 'predice', 'medicion', 'reto'];
  const MODE_META = {
    explora: { label: 'Explora', icon: '🔍' },
    predice: { label: 'Predicción', icon: '🧠' },
    medicion: { label: 'Medición', icon: '📏' },
    reto: { label: 'Reto', icon: '🎯' },
  };
  const MISIONES = {
    explora: 'Ajusta Vcc, R1, R2 y el ruido; cambia de topología y observa cómo se mueve el lazo de histéresis y el osciloscopio.',
    predice: 'Antes de revelar el valor, predice el umbral pedido o si la señal va a conmutar limpio, rebotar, o quedar enganchada.',
    medicion: 'Ejecuta el barrido automático de R2 y observa cómo se ensancha el lazo — y baja el conteo de transiciones — al crecer la histéresis.',
    reto: 'Con el Vcc y el ruido que da el reto, diseña R1/R2 para lograr conmutación limpia sin volverte demasiado insensible a la señal real.',
  };

  function rnd(n) { return Math.floor(Math.random() * n); }
  function randomizeConfig() {
    state.topology = rnd(2) ? 'inv' : 'noninv';
    state.iVCC = rnd(VCC_VALS.length); state.iR1 = rnd(R1_VALS.length); state.iR2 = rnd(R2_VALS.length); state.iNOISE = rnd(NOISE_VALS.length);
  }
  // keep=true: solo cambia de pestaña (el tour restaura el modo sin resembrar nada).
  function setMode(m, keep) {
    const prev = state.mode;
    // La pregunta sin responder no se lleva a Explora: la respuesta quedaría a la vista.
    if (!keep && prev === 'predice' && m !== 'predice' && !state._revealed) randomizeConfig();
    state.mode = m;
    state.hide = (m === 'predice' && !state._revealed);
    el('predWrap').style.display = m === 'predice' ? 'block' : 'none';
    el('retoWrap').style.display = m === 'reto' ? 'block' : 'none';
    el('sweepWrap').style.display = m === 'medicion' ? 'block' : 'none';
    if (!keep) {
      if (m === 'predice') genPredice();
      if (m === 'reto') newReto();
    }
    el('missionText').textContent = MISIONES[m];
    refreshAll();
  }
  function syncCtrlBtns() {
    MODES.forEach(m => { const b = el('btn-mode-' + m); if (b) b.classList.toggle('on', state.mode === m); });
    el('p_mode').textContent = MODE_META[state.mode].label;
    el('topoToggle').textContent = 'Topología: ' + (state.topology === 'inv' ? 'Inversor' : 'No inversor');
    const spans = { vVCC: fmtV(curVCC()), vR1: fmtR(curR1()), vR2: fmtR(curR2()), vNOISE: fmtV(curNoise()) + ' pico' };
    Object.keys(spans).forEach(id => { const s = el(id); if (s) s.textContent = spans[id]; });
  }

  function toggleTopology() {
    state.topology = state.topology === 'inv' ? 'noninv' : 'inv';
    refreshAll();
    showToast('Topología: ' + (state.topology === 'inv' ? 'Inversor' : 'No inversor'), 'info');
  }

  const INPUT_CSS = 'width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px';
  function genPredice() {
    state._revealed = false; state._predDone = false; state.hide = true;
    randomizeConfig(); // cada pregunta es un caso nuevo
    state._predType = Math.random() < 0.5 ? 'vth' : 'chatter';
    const box = el('predBox');
    if (state._predType === 'vth') {
      const which = Math.random() < 0.5 ? 'VTH' : 'VTL';
      state._predWhich = which;
      box.innerHTML = '<p>Predice <b>' + which + '</b> (V) con los valores actuales (±15 %):</p>' +
        '<input id="predInput" type="number" step="0.01" placeholder="V" style="' + INPUT_CSS + '">';
    } else {
      box.innerHTML = '<p>¿Cómo conmuta la salida con los valores actuales?</p>' +
        '<select id="predSelect" style="' + INPUT_CSS + '">' +
        '<option value="limpio">Conmutación limpia</option>' +
        '<option value="rebote">Rebote (chatter)</option>' +
        '<option value="enganchado">Enganchado (fuera de rango)</option>' +
        '</select>';
    }
    refreshAll();
  }
  function checkPredice() {
    if (state._predDone) { showToast('Esa pregunta ya se reveló: pulsa «Nueva».', 'info'); return; }
    const res = curSolveSchmitt();
    let ok, real;
    if (state._predType === 'vth') {
      const guess = parseFloat(el('predInput').value);
      const target = state._predWhich === 'VTH' ? res.VTH : res.VTL;
      real = fmtV(target);
      const tol = Math.max(0.15 * Math.abs(target), 0.1);
      ok = !isNaN(guess) && Math.abs(guess - target) <= tol;
    } else {
      const sim = curSimChatter(res);
      const label = res.outOfRange ? 'enganchado' : (sim.transitions > 2 ? 'rebote' : 'limpio');
      real = label;
      ok = el('predSelect').value === label;
    }
    state._revealed = true; state._predDone = true; state.hide = false;
    refreshAll();
    showToast(ok ? '✅ Correcto — valor real: ' + real : '❌ No — valor real: ' + real, ok ? 'ok' : 'warn');
  }

  // ---------- Reto: conmutación limpia sin volverse insensible ----------
  // Cada reto fija Vcc y el ruido (≥ 0,02 V pico). Criterio, el mismo que se anuncia: 1,5× ≤ ΔV/ruido pico-a-pico ≤ 3×
  // (y ΔV ≤ 60 % de Vcc), umbrales dentro de 0–Vcc y sin rebote en la simulación. El arranque neutro NO lo cumple.
  // Sin veredicto en vivo; a los 3 fallos seguidos hay caso nuevo; 2 pistas graduadas.
  function evalRetoDiseno(topo, vcc, r1, r2, noisePk) {
    const res = solveSchmitt(topo, vcc, r1, r2);
    const sim = simChatter(res, noisePk, 200);
    const noisePP = noisePk * 2;
    const ruido = res.deltaV >= 1.5 * noisePP;
    const rango = !res.outOfRange;
    const limpio = rango && sim.transitions <= 2;
    const sensible = res.deltaV <= 3 * noisePP && res.deltaV <= 0.6 * vcc;
    return { res: res, ruido: ruido, rango: rango, limpio: limpio, sensible: sensible, ok: ruido && rango && limpio && sensible };
  }
  function newReto() {
    let R = null, tries = 0;
    const prev = state._reto; // el caso nuevo no repite el anterior
    while (!R && tries < 300) {
      tries++;
      const iV = rnd(VCC_VALS.length), iN = 2 + rnd(NOISE_VALS.length - 2);
      let win = 0, total = 0;
      ['inv', 'noninv'].forEach(tp => R1_VALS.forEach(r1 => R2_VALS.forEach(r2 => { total++; if (evalRetoDiseno(tp, VCC_VALS[iV], r1, r2, NOISE_VALS[iN]).ok) win++; })));
      const neutro = evalRetoDiseno('inv', VCC_VALS[iV], R1_VALS[0], R2_VALS[5], NOISE_VALS[iN]);
      if (win >= 2 && win <= total * 0.2 && !neutro.ok && !(prev && prev.iV === iV && prev.iN === iN)) R = { iV: iV, iN: iN };
    }
    if (!R) R = { iV: 1, iN: 3 };
    state._reto = { iV: R.iV, iN: R.iN, noisePP: NOISE_VALS[R.iN] * 2 };
    state.topology = 'inv'; state.iVCC = R.iV; state.iNOISE = R.iN; state.iR1 = 0; state.iR2 = 5; // arranque neutro
    state.retoSolved = false; state.fallosSeguidos = 0; state.pistas = 0; state.pistaLog = [];
    renderReto('');
    refreshAll();
  }
  function renderReto(msg) {
    const R = state._reto;
    if (!R) return;
    el('retoBox').innerHTML = `<p>Con Vcc = ${VCC_VALS[R.iV]} V y ruido pico-a-pico de ${fmtV(R.noisePP)}, ajusta R1/R2 (y la topología si quieres) para que ΔV quede entre 1,5× y 3× el ruido pico-a-pico (sin superar el 60 % de Vcc) y la simulación no rebote. Sin veredicto hasta «Comprobar».</p>` +
      `<div style="font-size:11px;color:#8FB3AC">Intentos: <b id="retoIntentos">${state.intentos}</b> · Pistas: ${state.pistas}/2${state.retoSolved ? ' · <b style="color:#3fae3f">✔ resuelto</b>' : ''}</div>` +
      (state.pistaLog.length ? '<div style="font-size:11px;margin-top:4px">' + state.pistaLog.map(h => '💡 ' + h).join('<br>') + '</div>' : '') +
      (msg ? `<div style="font-size:12px;margin-top:6px;color:${state.retoSolved ? '#3fae3f' : '#E8871E'}">${msg}</div>` : '');
  }
  function retoHint() {
    if (state.mode !== 'reto' || !state._reto) return;
    if (state.pistas >= 2) { showToast('Ya usaste las 2 pistas de este reto.', 'info'); return; }
    const H = ['En la topología inversora ΔV = (Vcc − Vol)·R1/(R1+R2): solo depende de la relación R1/R2, no de sus valores absolutos.',
      'Un lazo demasiado ancho te vuelve insensible a la señal real, y uno demasiado estrecho no frena el ruido: busca el término medio, y cuida que los umbrales no salgan de 0–Vcc.'];
    state.pistaLog.push(H[state.pistas]); state.pistas++;
    renderReto('');
  }
  function checkReto() {
    if (!state._reto) return;
    const R = state._reto;
    state.iVCC = R.iV; state.iNOISE = R.iN; // el enunciado manda
    const e = evalRetoDiseno(state.topology, curVCC(), curR1(), curR2(), curNoise());
    state.intentos++;
    let msg;
    if (e.ok) {
      state.retoSolved = true; state.fallosSeguidos = 0;
      msg = `✅ Diseño válido: ΔV=${fmtV(e.res.deltaV)} está dentro del rango seguro (sin rebote en la simulación).`;
    } else {
      state.retoSolved = false; state.fallosSeguidos++;
      const f = [];
      if (!e.rango) f.push('un umbral queda fuera de 0–Vcc: el comparador se engancha');
      else {
        if (!e.ruido) f.push('el lazo es demasiado estrecho frente al ruido');
        else if (!e.limpio) f.push('la simulación todavía muestra rebote');
        if (!e.sensible) f.push('el lazo es demasiado ancho para este ruido: el circuito se vuelve insensible');
      }
      msg = 'Aún no: ' + f.join('; ') + '.';
      if (state.fallosSeguidos >= 3) { newReto(); msg += ' Tres fallos seguidos: se plantea un caso nuevo.'; }
    }
    renderReto(msg);
    refreshAll();
    showToast(msg, e.ok ? 'ok' : 'warn');
  }
  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < R2_VALS.length; i++) {
      state.iR2 = i;
      const res = curSolveSchmitt();
      const sim = curSimChatter(res);
      state._sweepTrace.push({ r2: R2_VALS[i], deltaV: res.deltaV, transitions: sim.transitions });
      refreshAll();
      await sleep(400);
    }
    updateReport();
  }

  function updateTele() {
    const t = el('telemetry');
    if (!t) return;
    if (state.hide) { t.innerHTML = '<div>VTH: ? · VTL: ? · Transiciones: ?</div><div style="color:#8FB3AC">Predice antes de revelar.</div>'; return; }
    const res = curSolveSchmitt();
    const sim = curSimChatter(res);
    t.innerHTML = '<div>VTH: ' + fmtV(res.VTH) + ' · VTL: ' + fmtV(res.VTL) + ' · ΔV: ' + fmtV(res.deltaV) + '</div>' +
      '<div>Transiciones/ciclo: ' + sim.transitions + '</div>' +
      '<div style="color:#6a7a80">Vos ' + fmtV(DEVS.lm393.vosTyp) + ' típ · Ib ' + fmtI(DEVS.lm393.ibTyp) + ' típ</div>';
  }
  function updateReport() {
    const rep = el('report');
    if (!rep) return;
    if (state.mode !== 'medicion' || !state._sweepTrace || !state._sweepTrace.length) { rep.innerHTML = ''; return; }
    let rows = state._sweepTrace.map(pt => `<tr><td>${fmtR(pt.r2)}</td><td>${fmtV(pt.deltaV)}</td><td>${pt.transitions}</td></tr>`).join('');
    rep.innerHTML = `<table class="repTable"><thead><tr><th>R2</th><th>ΔV</th><th>Transiciones</th></tr></thead><tbody>${rows}</tbody></table>`;
  }

  function onChange() { refreshAll(); }
  function refreshAll() {
    drawBoard();
    boardTex.needsUpdate = true;
    refreshBenchSel();
    refreshBenchDyn();
    updateTele();
    syncCtrlBtns();
    if (state.mode === 'medicion') updateReport();
  }

  // ---------- Quiz ----------
  // Opciones barajadas (Fisher–Yates); la correcta no tiene posición fija ni es la más larga por sistema.
  const QUIZ = [
    { q: '¿Por qué un comparador simple (sin histéresis) puede generar transiciones falsas con una señal ruidosa cerca del umbral?',
      ok: 'Porque solo hay un umbral: cualquier cruce provocado por el ruido dispara un cambio de estado',
      bad: ['Porque el LM393 es lento y deja pasar los picos de ruido hasta la salida sin filtrarlos', 'Porque el ruido modifica la tensión de alimentación Vcc y con ello el umbral de decisión', 'Porque la salida de colector abierto no puede cambiar de estado más de una vez por ciclo'] },
    { q: 'En la topología inversora, si aumentas R2 dejando R1 fijo, ¿qué le pasa a ΔV=VTH−VTL?',
      ok: 'Disminuye, porque la fracción R1/(R1+R2) que se realimenta baja',
      bad: ['Aumenta, porque una R2 mayor entrega más tensión de salida al nodo de realimentación', 'No cambia, porque ΔV depende solo de Vcc y de la tensión de saturación baja Vol', 'Aumenta con el cuadrado de R2, porque la histéresis crece con la resistencia total'] },
    { q: 'En la topología no inversora, si R1/R2 es tan grande que VTL calculado da negativo, ¿qué pasa?',
      ok: 'El comparador se engancha: una vez en HIGH ya no vuelve a LOW dentro del rango 0–Vcc',
      bad: ['Nada: un VTL negativo funciona igual porque el comparador acepta entradas bajo tierra', 'La salida Vout se vuelve negativa, porque el comparador pasa a alimentarse con tensión dual', 'El lazo de histéresis se hace más estrecho, porque VTL negativo reduce ΔV hasta cero'] },
    { q: 'Con el mismo R1/R2, ¿qué efecto tiene subir el ruido de la señal sobre la conmutación limpia?',
      ok: 'Hace falta una histéresis mayor que el ruido pico-a-pico; si no, aparecen cruces falsos y rebote',
      bad: ['Ninguno: la histéresis ya elimina por sí misma cualquier ruido, sea cual sea su amplitud', 'Se necesita menos histéresis, porque el ruido ayuda a que la señal cruce más rápido el umbral', 'Solo importa la frecuencia del ruido y no su amplitud, ya que el umbral es de tensión continua'] },
    { q: '¿Por qué conviene que ΔV no sea mucho mayor que el ruido pico-a-pico?',
      ok: 'Porque una histéresis excesiva vuelve al circuito insensible a variaciones pequeñas de la señal real',
      bad: ['Porque ΔV grande descarga el capacitor de salida y baja la frecuencia máxima de conmutación', 'Porque ΔV grande aumenta el consumo del LM393 y puede sobrecalentarlo con facilidad', 'Porque ΔV grande hace que Vout nunca llegue a Vcc, al caer la tensión en la resistencia'] },
  ];
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  let quizIdx = 0, quizOpts = [], quizAns = -1, quizFallos = 0;
  function buildQuiz(next) {
    quizIdx = next ? (quizIdx + 1) % QUIZ.length : Math.floor(Math.random() * QUIZ.length);
    const item = QUIZ[quizIdx];
    quizOpts = shuffled([{ t: item.ok, ok: true }].concat(item.bad.map(t => ({ t: t, ok: false }))));
    quizAns = -1; quizFallos = 0;
    refreshQuestion();
  }
  function quizCorrectIdx() { return quizOpts.findIndex(o => o.ok); }
  function refreshQuestion() {
    const item = QUIZ[quizIdx];
    const box = el('quizBox');
    if (!box) return;
    const done = quizAns >= 0 && quizOpts[quizAns].ok;
    let html = '<div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Quiz rápido</div>';
    html += '<div style="font-size:13px;color:#EAF4F1;margin-bottom:8px">' + item.q + '</div>';
    quizOpts.forEach((opt, i) => {
      html += '<button class="b quizOpt" data-i="' + i + '" ' + (opt.gastada || done ? 'disabled ' : '') + 'style="width:100%;text-align:left;margin-bottom:4px' + (opt.gastada ? ';opacity:.45' : '') + '">' + opt.t + '</button>';
    });
    if (done) html += '<button class="b" id="quizNext" style="width:100%;margin-top:4px">Siguiente pregunta</button>';
    box.innerHTML = html;
    box.querySelectorAll('.quizOpt').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        quizAns = i;
        if (quizOpts[i].ok) { showToast('✅ Correcto', 'ok'); }
        else {
          quizOpts[i].gastada = true; quizFallos++;
          if (quizFallos >= 2) { showToast('Dos fallos: se plantea otra pregunta.', 'warn'); buildQuiz(true); return; }
          showToast('❌ No es esa: repasa la pregunta e inténtalo otra vez', 'warn');
        }
        refreshQuestion();
      });
    });
    const nx = el('quizNext'); if (nx) nx.addEventListener('click', () => buildQuiz(true));
  }
  // ---------- Interacción 3D ----------
  function actToast(id) {
    const labels = { r1: 'R1', r2: 'R2', rpu: 'Rpu (pull-up)', cmp: 'LM393', src: 'Fuente vin', out: 'Vout' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) { return { r1: r1G, r2: r2G, rpu: rpuG, cmp: icG }[name]; }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (!actor) return;
    const s0 = actor.scale.clone();
    actor.scale.multiplyScalar(1.15);
    setTimeout(() => actor.scale.copy(s0), 220);
  }
  const ACTOR_NAMES = ['r1', 'r2', 'rpu', 'cmp'];
  pickerFor(S.scene, S.camera, S.renderer.domElement, (hit) => {
    if (hit && hit.object === boardPlane && hit.uv) { boardClick(hit.uv.x, hit.uv.y); return; }
    let o = hit && hit.object;
    while (o) {
      for (const name of ACTOR_NAMES) { if (resolveActor(name) === o) { actToast(name); dispatch3D(name); return; } }
      o = o.parent;
    }
  });

  // El tour es una DEMOSTRACIÓN: no toca el reto (nunca llama a checkReto) y al terminar
  // —o si algo falla— devuelve configuración, modo y barrido del alumno.
  let tourBusy = false;
  async function runAuto() {
    if (tourBusy) return;
    tourBusy = true;
    const btn = el('autoTour'); if (btn) btn.disabled = true;
    const keys = ['topology', 'iVCC', 'iR1', 'iR2', 'iNOISE', 'mode', 'hide', '_sweepTrace'];
    const snap = {};
    keys.forEach(k => { snap[k] = state[k]; });
    try {
      setMode('explora', true); await sleep(600);
      state.iVCC = 1; state.iR1 = 2; state.iR2 = 1; refreshAll(); await sleep(800);
      toggleTopology(); await sleep(900);
      toggleTopology(); await sleep(600);
      setMode('medicion', true); await runSweep();
    } finally {
      keys.forEach(k => { state[k] = snap[k]; });
      setMode(snap.mode, true);
      state.hide = snap.hide;
      refreshAll();
      if (btn) btn.disabled = false;
      tourBusy = false;
    }
  }

  // ---------- Wiring ----------
  MODES.forEach(m => { const b = el('btn-mode-' + m); if (b) b.addEventListener('click', () => setMode(m)); });
  function wireStep(id, getIdx, setIdx, max) {
    const dec = el(id + 'Dec'), inc = el(id + 'Inc');
    if (dec) dec.addEventListener('click', () => { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
    if (inc) inc.addEventListener('click', () => { setIdx(Math.min(max, getIdx() + 1)); onChange(); });
  }
  wireStep('vcc', () => state.iVCC, v => state.iVCC = v, VCC_VALS.length - 1);
  wireStep('r1', () => state.iR1, v => state.iR1 = v, R1_VALS.length - 1);
  wireStep('r2', () => state.iR2, v => state.iR2 = v, R2_VALS.length - 1);
  wireStep('noise', () => state.iNOISE, v => state.iNOISE = v, NOISE_VALS.length - 1);
  el('topoToggle').addEventListener('click', toggleTopology);
  el('predNew').addEventListener('click', genPredice);
  el('predCheck').addEventListener('click', checkPredice);
  el('retoNew').addEventListener('click', newReto);
  el('retoCheck').addEventListener('click', checkReto);
  el('retoHint').addEventListener('click', retoHint);
  el('sweepRun').addEventListener('click', runSweep);
  el('autoTour').addEventListener('click', runAuto);

  // ---------- Init ----------
  setMode('explora');
  buildQuiz();
  refreshAll();
  S.start();

  window.__labDebug = {
    state, DEVS, solveSchmitt, curSolveSchmitt, simChatter, curSimChatter,
    setMode, toggleTopology, genPredice, checkPredice, newReto, checkReto,
    runSweep, refreshAll, retoHint, runAuto, buildQuiz, evalRetoDiseno,
    get mode() { return state.mode; },
    get retoSolved() { return state.retoSolved; },
    get intentos() { return state.intentos; },
    get quizAnswer() { return quizAns; },
    get quizCorrectIndex() { return quizCorrectIdx(); },
  };
})();
