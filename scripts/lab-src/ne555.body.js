/**
 * FICHA DE FIDELIDAD — Temporizador 555 astable (NE555)
 *
 * SÍ verificado:
 * - Fórmulas estándar de multivibrador astable con NE555 (topología clásica
 *   RA/RB/C): tHigh=0.693·(RA+RB)·C, tLow=0.693·RB·C, T=tHigh+tLow,
 *   f=1/T≈1.44/((RA+2RB)·C), duty=tHigh/T=(RA+RB)/(RA+2RB) — siempre ≥50%
 *   en esta topología básica de 3 terminales (sin diodo en paralelo con RB).
 * - Umbrales internos del divisor resistivo de 3 resistores iguales del 555
 *   (el origen del nombre "555"): threshold (pin 6) dispara la descarga al
 *   llegar a 2/3 Vcc; trigger (pin 2) dispara la carga al caer a 1/3 Vcc.
 * - Curva de carga/descarga real (exponencial RC), no una rampa lineal:
 *   durante tHigh el capacitor carga hacia Vcc a través de RA+RB con
 *   τ_carga=(RA+RB)·C, partiendo de Vcc/3; durante tLow descarga a través
 *   de RB únicamente (pin de descarga, pin 7, a tierra) con τ_descarga=RB·C,
 *   partiendo de 2Vcc/3 — verificado en TI SLFS022I y Diodes Inc NE555.
 * - Rango de alimentación NE555: 4.5V–16V (hasta 18V en la variante SE555).
 * - Guía de diseño ampliamente citada: RA no debe ser demasiado pequeña
 *   (práctica común: no bajar de ~1kΩ) porque el transistor interno de
 *   descarga conduce la corriente de RA a tierra durante tLow, y una RA muy
 *   baja eleva esa corriente hacia el límite del transistor.
 *
 * NO modelado:
 * - El pin de control de voltaje (pin 5), normalmente desacoplado a tierra
 *   con un capacitor de 0.01–0.1µF; este simulador no expone ese pin ni
 *   permite alterar el umbral 2/3 Vcc con una tensión externa.
 * - La tolerancia empírica de fabricación de RA/RB/C ni del propio 555: las
 *   fórmulas de diseño del temporizador son aproximaciones que, según nota
 *   de varias fuentes técnicas consultadas, pueden diferir hasta ~20% del
 *   resultado medido en un circuito real — este simulador calcula f/duty de
 *   forma exacta según las fórmulas ideales, sin variabilidad de componente.
 * - El nivel de salida baja real (VOL) del 555 como un pequeño voltaje de
 *   saturación, no 0V exacto (aproximación estándar de la mayoría de los
 *   tratamientos introductorios, igual que la usada aquí).
 * - Corriente máxima de salida (~200mA típica), disipación de potencia y
 *   calentamiento del encapsulado a alta frecuencia o alta corriente.
 *
 * Nota de rigor:
 * - El límite de "RA≥1kΩ" es una guía de diseño ampliamente citada por
 *   fabricantes y tutoriales, no una cifra absoluta de una única hoja de
 *   datos con un valor numérico único — se presenta aquí como advertencia
 *   de diseño, no como un límite estricto de hoja de datos.
 *
 * Fuentes:
 * - Texas Instruments, "NE555 Precision Timers" (SLFS022I) —
 *   https://www.ti.com/lit/ds/symlink/ne555.pdf
 * - Diodes Incorporated, "NE555/SA555/NA555" datasheet —
 *   https://www.diodes.com/datasheet/download/NE555.pdf
 * - Daycounter, "NE555 Astable Multivibrator Frequency and Duty Cycle
 *   Calculator" — https://www.daycounter.com/Calculators/NE555-Calculator.phtml
 * - All About Circuits, "555 Timer Astable Oscillator Circuit" —
 *   https://www.allaboutcircuits.com/tools/555-timer-astable-circuit/
 * - Electronics Tutorials, "555 Oscillator Tutorial - The Astable
 *   Multivibrator" — https://www.electronics-tutorials.ws/waveforms/555_oscillator.html
 * - Electronics Club, "555 Astable" — https://electronicsclub.info/555astable.htm
 */
(function () {
  'use strict';
  const mount = document.getElementById('stage');
  const S = createStage(mount, { cam: [3.4, 2.6, 7.6], target: [0.5, 1.2, 0.3], bgTop: '#0d1a1a', bgBot: '#040a08', bloom: 0.35, minD: 3.0, maxD: 18 });
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

  // ---------- Constantes del dispositivo ----------
  const DEV = { name: 'NE555', vccMin: 4.5, vccMax: 16, raMinRec: 1000, color: 0x1a1a2e };
  const UTP_FRAC = 2 / 3, LTP_FRAC = 1 / 3;

  // ---------- Física ----------
  function solveAstable(Vcc, RA, RB, C) {
    const tHigh = 0.693 * (RA + RB) * C;
    const tLow = 0.693 * RB * C;
    const T = tHigh + tLow;
    const f = 1 / T;
    const duty = tHigh / T;
    const warnRA = RA < DEV.raMinRec;
    return { Vcc, RA, RB, C, tHigh, tLow, T, f, duty, warnRA };
  }

  function curveVC(res, nTotal) {
    nTotal = nTotal || 160;
    const nCharge = Math.max(2, Math.round(nTotal * res.duty));
    const nDischarge = Math.max(2, nTotal - nCharge);
    const tauC = (res.RA + res.RB) * res.C, tauD = res.RB * res.C;
    const pts = [];
    for (let i = 0; i <= nCharge; i++) {
      const t = (i / nCharge) * res.tHigh;
      const v = res.Vcc - (2 * res.Vcc / 3) * Math.exp(-t / tauC);
      pts.push({ tFrac: t / res.T, v, phase: 'charge' });
    }
    for (let i = 1; i <= nDischarge; i++) {
      const t = (i / nDischarge) * res.tLow;
      const v = (2 * res.Vcc / 3) * Math.exp(-t / tauD);
      pts.push({ tFrac: (res.tHigh + t) / res.T, v, phase: 'discharge' });
    }
    return pts;
  }
  function outAt(tFrac, res) { return tFrac < res.duty ? res.Vcc : 0; }

  function fmtV(v) {
    const av = Math.abs(v);
    if (av < 1) return (v * 1000).toFixed(0) + ' mV';
    return v.toFixed(2) + ' V';
  }
  function fmtR(r) {
    if (r >= 1000) { const k = r / 1000; return (Number.isInteger(k) ? k.toFixed(0) : k.toFixed(1)) + ' kΩ'; }
    return r.toFixed(0) + ' Ω';
  }
  function fmtC(c) {
    if (c >= 1e-6) return (c * 1e6).toFixed(1).replace(/\.0$/, '') + ' µF';
    return (c * 1e9).toFixed(0) + ' nF';
  }
  function fmtHz(f) {
    if (f >= 1000) return (f / 1000).toFixed(f >= 10000 ? 1 : 2) + ' kHz';
    return f.toFixed(f >= 10 ? 0 : 1) + ' Hz';
  }
  function fmtT(t) {
    if (t < 1e-6) return (t * 1e9).toFixed(0) + ' ns';
    if (t < 1e-3) return (t * 1e6).toFixed(1) + ' µs';
    if (t < 1) return (t * 1e3).toFixed(2) + ' ms';
    return t.toFixed(2) + ' s';
  }
  function fmtPct(x) { return (x * 100).toFixed(1) + '%'; }

  // ---------- Estado ----------
  const VCC_VALS = [5, 9, 12];
  const RA_VALS = [470, 1000, 2200, 4700, 10000, 22000, 47000];
  const RB_VALS = [2200, 4700, 10000, 22000, 47000, 100000];
  const C_VALS = [1e-8, 4.7e-8, 1e-7, 4.7e-7, 1e-6, 4.7e-6];

  const state = {
    iVCC: 1, iRA: 2, iRB: 2, iC: 2,
    mode: 'explora', hide: false, _revealed: false,
    _sweepTrace: null, _predType: 'f', _reto: null,
  };

  function curVCC() { return VCC_VALS[state.iVCC]; }
  function curRA() { return RA_VALS[state.iRA]; }
  function curRB() { return RB_VALS[state.iRB]; }
  function curC() { return C_VALS[state.iC]; }
  function curSolve() { return solveAstable(curVCC(), curRA(), curRB(), curC()); }

  // ---------- Materiales y geometría 3D ----------
  const MAT = {
    board: { color: 0x2b2f36, roughness: 0.85, metalness: 0.1 },
    resistorBody: { color: 0xd8c08a, roughness: 0.6, metalness: 0.05 },
    lead: { color: 0xc7c7c7, roughness: 0.35, metalness: 0.8 },
    icBody: { color: 0x1a1a2e, roughness: 0.5, metalness: 0.2 },
    notch: { color: 0x08080c, roughness: 0.5, metalness: 0.1 },
    capBody: { color: 0x2255aa, roughness: 0.4, metalness: 0.3 },
  };
  function std(spec) { return new THREE.MeshStandardMaterial(spec); }

  const BAND_COLORS = [0x1a1a1a, 0x8B4513, 0xff0000, 0xffa500, 0xffff00, 0x00ff00, 0x0000ff, 0x8B00FF, 0x808080, 0xffffff];
  function bandsFor(ohms) {
    const s = ohms.toExponential(1).split('e');
    const digit1 = Math.floor(Number(s[0]));
    const digit2 = Math.round((Number(s[0]) - digit1) * 10);
    const exp = Number(s[1]);
    return [BAND_COLORS[digit1], BAND_COLORS[digit2], BAND_COLORS[Math.max(0, exp)] || 0x1a1a1a];
  }
  function paintBands(group, ohms) {
    const bands = bandsFor(ohms);
    if (group.userData.bandMeshes) {
      group.userData.bandMeshes.forEach((m, i) => m.material.color.setHex(bands[i]));
    }
  }
  function makeResistor3D() {
    const g = new THREE.Group();
    const bodyGeo = new THREE.CylinderGeometry(0.045, 0.045, 0.26, 16);
    const body = new THREE.Mesh(bodyGeo, std(MAT.resistorBody));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const bandMeshes = [];
    for (let i = 0; i < 3; i++) {
      const bg = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.02, 16), std({ color: 0x1a1a1a }));
      bg.rotation.z = Math.PI / 2;
      bg.position.x = -0.06 + i * 0.06;
      g.add(bg); bandMeshes.push(bg);
    }
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.12, 8), std(MAT.lead));
      leg.rotation.z = Math.PI / 2;
      leg.position.x = s * 0.19;
      g.add(leg);
    }
    g.userData.bandMeshes = bandMeshes;
    g.userData.body = body;
    return g;
  }
  function makeCapacitor3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.16, 20), std(MAT.capBody));
    g.add(body);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.01, 20), std({ color: 0xd7dee6, roughness: 0.5, metalness: 0.2 }));
    top.position.y = 0.085;
    g.add(top);
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.1, 8), std(MAT.lead));
      leg.position.set(s * 0.04, -0.13, 0);
      g.add(leg);
    }
    g.userData.body = body;
    return g;
  }
  function makeDIP3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.16), std(MAT.icBody));
    g.add(body);
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.015, 0.015, 0.1, 12), std(MAT.notch));
    notch.rotation.x = Math.PI / 2;
    notch.position.set(-0.14, 0.05, 0);
    g.add(notch);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.06, 6), std(MAT.lead));
        leg.position.set(-0.12 + i * 0.08, -0.06, side * 0.09);
        g.add(leg);
      }
    }
    g.userData.body = body;
    return g;
  }
  function makeDisplayBox(w, h, dp, cw, ch) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), std({ color: 0x111318, roughness: 0.7, metalness: 0.2 }));
    g.add(frame);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.9, h * 0.82), new THREE.MeshBasicMaterial({ map: tex }));
    screen.position.z = dp / 2 + 0.002;
    g.add(screen);
    g.userData = { canvas, ctx, tex };
    return g;
  }

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
  function capGlyph(ctx, x, y, col) {
    ctx.strokeStyle = col || '#5fb8ff'; ctx.lineWidth = 3;
    line(ctx, x - 16, y, x + 16, y, 3, col || '#5fb8ff');
    line(ctx, x - 16, y + 10, x + 16, y + 10, 3, col || '#5fb8ff');
  }
  function icBoxGlyph(ctx, x, y, w, h, label, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y, w, h);
    ctx.fillStyle = col || '#8fe3d0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText(label, x + w / 2 - 18, y + h / 2 + 6);
  }

  // ---------- Layout ----------
  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const RAIL_Y = 70, NODE_A_Y = 190, NODE_B_Y = 300, GND_Y = 420;
  const LADDER_X = 150, IC_X = 340, IC_Y = 150, IC_W = 150, IC_H = 160, OUT_X = 560;

  let HIT = [];
  function addHit(id, x, y, w, h) { HIT.push({ id, x, y, w, h }); }

  function drawSchematic(ctx) {
    HIT = [];
    ctx.clearRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);

    // Riel Vcc
    line(ctx, LADDER_X - 40, RAIL_Y, LADDER_X + 40, RAIL_Y, 2, '#8fe3d0');
    ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif';
    ctx.fillText('+Vcc', LADDER_X - 20, RAIL_Y - 10);
    addHit('vcc', LADDER_X - 40, RAIL_Y - 16, 80, 16);
    line(ctx, LADDER_X, RAIL_Y, LADDER_X, NODE_A_Y, 2, '#8fe3d0');

    // RA: Vcc -> nodo A (descarga, pin 7)
    vResistorGlyph(ctx, LADDER_X, NODE_A_Y - 60, 60, '#e8c568');
    addHit('ra', LADDER_X, NODE_A_Y - 60, 16, 60);
    ctx.fillStyle = '#e8c568'; ctx.fillText('RA', LADDER_X + 20, NODE_A_Y - 26);
    line(ctx, LADDER_X, NODE_A_Y, LADDER_X, NODE_A_Y, 2, '#8fe3d0');
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('DIS (pin 7)', LADDER_X + 20, NODE_A_Y + 4);

    // RB: nodo A -> nodo B (threshold/trigger, pines 6+2)
    vResistorGlyph(ctx, LADDER_X, NODE_A_Y + 50, 60, '#e8c568');
    addHit('rb', LADDER_X, NODE_A_Y + 50, 16, 60);
    ctx.fillStyle = '#e8c568'; ctx.font = '12px sans-serif';
    ctx.fillText('RB', LADDER_X + 20, NODE_A_Y + 84);
    line(ctx, LADDER_X, NODE_A_Y + 110, LADDER_X, NODE_B_Y, 2, '#8fe3d0');
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('THR/TRIG (pines 6+2)', LADDER_X + 20, NODE_B_Y + 4);

    // C: nodo B -> GND
    line(ctx, LADDER_X, NODE_B_Y, LADDER_X, NODE_B_Y + 60, 2, '#8fe3d0');
    capGlyph(ctx, LADDER_X, NODE_B_Y + 65, '#5fb8ff');
    addHit('c', LADDER_X - 16, NODE_B_Y + 55, 32, 30);
    ctx.fillStyle = '#5fb8ff'; ctx.font = '12px sans-serif';
    ctx.fillText('C', LADDER_X + 24, NODE_B_Y + 74);
    line(ctx, LADDER_X, NODE_B_Y + 76, LADDER_X, GND_Y, 2, '#8fe3d0');
    groundGlyph(ctx, LADDER_X, GND_Y);

    // 555
    icBoxGlyph(ctx, IC_X, IC_Y, IC_W, IC_H, '555', '#8fe3d0');
    addHit('ic', IC_X, IC_Y, IC_W, IC_H);
    line(ctx, LADDER_X, NODE_A_Y, IC_X, IC_Y + 40, 2, '#8fe3d0');
    line(ctx, LADDER_X, NODE_B_Y, IC_X, IC_Y + 100, 2, '#8fe3d0');
    line(ctx, IC_X - 40, IC_Y + 40, IC_X, IC_Y + 40, 0, '#8fe3d0');

    // Salida
    line(ctx, IC_X + IC_W, IC_Y + IC_H / 2, OUT_X, IC_Y + IC_H / 2, 2, '#8fe3d0');
    addHit('out', IC_X + IC_W, IC_Y + IC_H / 2 - 10, OUT_X - IC_X - IC_W + 20, 20);
    ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif';
    ctx.fillText('Vout (pin 3)', OUT_X - 30, IC_Y + IC_H / 2 - 12);

    const res = curSolve();
    ctx.font = 'bold 13px sans-serif';
    if (res.warnRA) { ctx.fillStyle = '#ef4444'; ctx.fillText('⚠ RA por debajo del mínimo recomendado (1kΩ)', PX0 + 10, PY1 - 12); }
    else { ctx.fillStyle = '#22c55e'; ctx.fillText('f=' + fmtHz(res.f) + ' · duty=' + fmtPct(res.duty), PX0 + 10, PY1 - 12); }
  }

  // ---------- Gráfica: curva de carga/descarga del capacitor ----------
  function xPixT(tFrac) { return GX0 + 30 + tFrac * (GX1 - GX0 - 50); }
  function yPixV(v, Vcc) { return GY1 - 30 - (v / Vcc) * (GY1 - GY0 - 50); }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    const res = curSolve();
    const Vcc = res.Vcc;
    line(ctx, GX0 + 30, GY0 + 10, GX0 + 30, GY1 - 30, 1, '#233532');
    line(ctx, GX0 + 30, GY1 - 30, GX1 - 20, GY1 - 30, 1, '#233532');
    ctx.fillStyle = '#6b8a83'; ctx.font = '11px sans-serif';
    ctx.fillText('t / T', GX1 - 36, GY1 - 12);
    ctx.save(); ctx.translate(GX0 + 12, GY0 + 20); ctx.rotate(-Math.PI / 2);
    ctx.fillText('Vc', 0, 0); ctx.restore();

    const yUTP = yPixV(UTP_FRAC * Vcc, Vcc), yLTP = yPixV(LTP_FRAC * Vcc, Vcc);
    ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    line(ctx, GX0 + 30, yUTP, GX1 - 20, yUTP, 1, '#5fb8ff');
    line(ctx, GX0 + 30, yLTP, GX1 - 20, yLTP, 1, '#f59e0b');
    ctx.setLineDash([]);
    ctx.fillStyle = '#5fb8ff'; ctx.font = '11px sans-serif';
    ctx.fillText('UTP=2/3 Vcc', GX0 + 34, yUTP - 4);
    ctx.fillStyle = '#f59e0b';
    ctx.fillText('LTP=1/3 Vcc', GX0 + 34, yLTP + 14);

    const pts = curveVC(res, 160);
    ctx.lineWidth = 2.5;
    for (let i = 1; i < pts.length; i++) {
      const a = pts[i - 1], b = pts[i];
      const col = b.phase === 'charge' ? '#5fb8ff' : '#f59e0b';
      line(ctx, xPixT(a.tFrac), yPixV(a.v, Vcc), xPixT(b.tFrac), yPixV(b.v, Vcc), 2.5, col);
    }

    if (state.mode === 'medicion' && state._sweepTrace && state._sweepTrace.length) {
      ctx.fillStyle = '#c084fc'; ctx.font = '10px sans-serif';
      let ty = GY0 + 40;
      ctx.fillText('Barrido RB → f / duty:', GX0 + 34, ty);
      state._sweepTrace.forEach(pt => {
        ty += 13;
        ctx.fillText(fmtR(pt.rb) + ' → ' + fmtHz(pt.f) + ' · ' + fmtPct(pt.duty), GX0 + 34, ty);
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
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 768;
  const bctx = boardCanvas.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  const boardPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.15), boardMat);
  boardPlane.position.set(0.5, 2.0, -1.2);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(4.32, 3.27, 0.06), std({ color: 0x1b1f24, roughness: 0.8, metalness: 0.2 }));
  boardFrame.position.set(0.5, 2.0, -1.24);
  const boardG = new THREE.Group();
  boardG.add(boardFrame, boardPlane);
  S.scene.add(boardG);

  // ---------- Escena: banco ----------
  const benchG = new THREE.Group();
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.8), std({ color: 0x2b2f36, roughness: 0.85, metalness: 0.1 }));
  mesa.position.set(0.5, 0.55, 1.0);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 1.2), std({ color: 0x0e4d33, roughness: 0.7, metalness: 0.1 }));
  pcb.position.set(0.5, 0.62, 1.0);
  benchG.add(mesa, pcb);

  const raG = makeResistor3D(); raG.position.set(-0.7, 0.68, 1.0); benchG.add(raG);
  const rbG = makeResistor3D(); rbG.position.set(-0.1, 0.68, 1.0); benchG.add(rbG);
  const capG = makeCapacitor3D(); capG.position.set(0.5, 0.76, 1.0); benchG.add(capG);
  const icG = makeDIP3D(); icG.position.set(1.15, 0.7, 1.0); benchG.add(icG);
  S.scene.add(benchG);

  function refreshBenchSel() {
    paintBands(raG, curRA());
    paintBands(rbG, curRB());
    icG.userData.body.material.color.setHex(DEV.color);
  }

  const fuenteBox = makeDisplayBox(0.7, 0.42, 0.06, 220, 132);
  fuenteBox.position.set(-1.35, 0.95, 1.0); fuenteBox.rotation.y = 0.06 * Math.PI;
  const medidorBox = makeDisplayBox(0.7, 0.5, 0.06, 220, 156);
  medidorBox.position.set(1.75, 0.98, 1.0); medidorBox.rotation.y = -0.06 * Math.PI;
  const scopeBox = makeDisplayBox(1.0, 0.62, 0.06, 260, 160);
  scopeBox.position.set(0.5, 1.42, 0.62); scopeBox.rotation.x = -0.06 * Math.PI;
  benchG.add(fuenteBox, medidorBox, scopeBox);

  function drawFuenteScreen() {
    const { ctx, canvas, tex } = fuenteBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Vcc = ' + fmtV(curVCC()), 14, 30);
    ctx.font = '13px sans-serif';
    ctx.fillText(DEV.name + ' astable', 14, 54);
    ctx.fillText('RA=' + fmtR(curRA()) + ' RB=' + fmtR(curRB()), 14, 74);
    ctx.fillText('C=' + fmtC(curC()), 14, 94);
    tex.needsUpdate = true;
  }
  function drawMedidorScreen() {
    const { ctx, canvas, tex } = medidorBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#6b8a83'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('f: ?   duty: ?', 14, 40);
      ctx.fillText('¿cuánto valen?', 14, 66);
    } else {
      const res = curSolve();
      ctx.fillStyle = '#5fb8ff'; ctx.fillText('f = ' + fmtHz(res.f), 14, 26);
      ctx.fillStyle = '#8fe3d0'; ctx.fillText('T = ' + fmtT(res.T), 14, 46);
      ctx.fillText('tHigh = ' + fmtT(res.tHigh), 14, 66);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('tLow = ' + fmtT(res.tLow), 14, 86);
      ctx.fillStyle = '#8fe3d0'; ctx.fillText('duty = ' + fmtPct(res.duty), 14, 106);
      ctx.font = 'bold 13px sans-serif';
      if (res.warnRA) { ctx.fillStyle = '#ef4444'; ctx.fillText('RA < 1kΩ recomendado', 14, 128); }
      else { ctx.fillStyle = '#22c55e'; ctx.fillText('OK', 14, 128); }
    }
    tex.needsUpdate = true;
  }
  function drawScopeScreen() {
    const { ctx, canvas, tex } = scopeBox.userData;
    ctx.fillStyle = '#05100c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#12312a'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (canvas.height - 20) / 4; line(ctx, 10, y, canvas.width - 10, y, 1, '#12312a'); }
    const res = curSolve();
    const pts = curveVC(res, 160);
    const Vcc = res.Vcc;
    const toX = t => 10 + t * (canvas.width - 20);
    const toY = v => (canvas.height - 10) - (v / Vcc) * (canvas.height - 20);
    ctx.strokeStyle = '#5fb8ff'; ctx.lineWidth = 1.5; ctx.beginPath();
    pts.forEach((p, i) => { const x = toX(p.tFrac), y = toY(p.v); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();
    ctx.strokeStyle = res.warnRA ? '#ef4444' : '#22c55e'; ctx.lineWidth = 1.5; ctx.beginPath();
    const nSteps = 160;
    for (let i = 0; i <= nSteps; i++) {
      const t = i / nSteps;
      const x = toX(t), y = toY(outAt(t, res));
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('Vc / Vout · osciloscopio', 12, canvas.height - 4);
    tex.needsUpdate = true;
  }
  function refreshBenchDyn() { drawFuenteScreen(); drawMedidorScreen(); drawScopeScreen(); }

  // ---------- HUD ----------
  el('hud').innerHTML = `
    <div class="eyebrow">MEC · D2 · Electrónica integrada</div>
    <div class="h2">Temporizador 555 astable (NE555)</div>
    <div class="p">El 555 contiene un divisor interno de tres resistores iguales que fija dos umbrales: <b>2/3 Vcc</b> (threshold, dispara la descarga) y <b>1/3 Vcc</b> (trigger, dispara la carga). En el modo astable, RA y RB fijan cuánto tarda el capacitor en cargar (a través de RA+RB) y descargar (solo a través de RB) entre esos dos umbrales, generando una oscilación continua sin ninguna señal de entrada.</div>
    <div class="formula">f=1.44/((RA+2RB)·C) · tHigh=0.693(RA+RB)C · tLow=0.693·RB·C</div>
    <div class="formula">duty=(RA+RB)/(RA+2RB) — siempre ≥50% en esta topología de 3 terminales</div>
    <div class="legend">
      <span class="li"><span class="dot" style="background:#5fb8ff"></span>Carga — Vc sube hacia Vcc (salida alta, tHigh)</span>
      <span class="li"><span class="dot" style="background:#f59e0b"></span>Descarga — Vc baja hacia 0 (salida baja, tLow)</span>
      <span class="li"><span class="dot" style="background:#22c55e"></span>Vout — onda cuadrada resultante</span>
    </div>
    <div class="fid"><b>SÍ verificado:</b> fórmulas estándar de astable (tHigh/tLow/f/duty) con curva de carga/descarga RC real (no rampa lineal) · umbrales 2/3 Vcc y 1/3 Vcc del divisor interno · alimentación NE555 4.5–16V · guía de diseño RA≥1kΩ (protección del transistor de descarga interno).<br><b>NO modelado:</b> pin de control de voltaje (pin 5) ni su efecto sobre el umbral 2/3 Vcc · tolerancia real de RA/RB/C ni del 555 (±20% posible según varias fuentes) · VOL como saturación real (se aproxima a 0V) · corriente máxima de salida ni calentamiento.</div>
    <div class="src">Fuentes: TI NE555 datasheet (SLFS022I) · Diodes Inc NE555 datasheet · Daycounter, All About Circuits y Electronics Tutorials (calculadoras/tutoriales de astable 555)</div>
  `;

  // ---------- Panel ----------
  el('panel').innerHTML = `
    <h4>Temporizador 555 · <span id="p_mode">Explora</span></h4>
    <div class="modebar">
      <button class="b on" id="btn-mode-explora">🔍 Explora</button>
      <button class="b" id="btn-mode-predice">🧠 Predicción</button>
      <button class="b" id="btn-mode-medicion">📏 Medición</button>
      <button class="b" id="btn-mode-reto">🎯 Reto</button>
    </div>
    <div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">
      <div>Vcc</div><button class="b" id="vccDec" style="padding:2px 8px">−</button><span id="vVCC">—</span><button class="b" id="vccInc" style="padding:2px 8px">+</button>
      <div>RA</div><button class="b" id="raDec" style="padding:2px 8px">−</button><span id="vRA">—</span><button class="b" id="raInc" style="padding:2px 8px">+</button>
      <div>RB</div><button class="b" id="rbDec" style="padding:2px 8px">−</button><span id="vRB">—</span><button class="b" id="rbInc" style="padding:2px 8px">+</button>
      <div>C</div><button class="b" id="cDec" style="padding:2px 8px">−</button><span id="vC">—</span><button class="b" id="cInc" style="padding:2px 8px">+</button>
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
      </div>
    </div>
    <div id="sweepWrap" style="display:none;margin-top:10px">
      <button class="b" id="sweepRun" style="width:100%">▶ Ejecutar barrido de RB</button>
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
    explora: 'Ajusta Vcc, RA, RB y C, y observa cómo cambian tHigh, tLow, f y el duty cycle, junto con la curva de carga/descarga del capacitor y el osciloscopio.',
    predice: 'Antes de revelar el valor, predice la frecuencia f o el duty cycle con los valores actuales.',
    medicion: 'Ejecuta el barrido automático de RB y observa cómo el duty cycle se acerca a 50% mientras la frecuencia baja al crecer RB.',
    reto: 'Diseña RA/RB/C para lograr una frecuencia objetivo manteniendo el duty cycle lo más cercano posible a 50%, sin bajar RA de 1kΩ.',
  };

  function setMode(m) {
    state.mode = m;
    state.hide = (m === 'predice' && !state._revealed);
    el('predWrap').style.display = m === 'predice' ? 'block' : 'none';
    el('retoWrap').style.display = m === 'reto' ? 'block' : 'none';
    el('sweepWrap').style.display = m === 'medicion' ? 'block' : 'none';
    if (m === 'predice') genPredice();
    if (m === 'reto') newReto();
    el('missionText').textContent = MISIONES[m];
    refreshAll();
  }

  function syncCtrlBtns() {
    MODES.forEach(m => { const b = el('btn-mode-' + m); if (b) b.classList.toggle('on', state.mode === m); });
    el('p_mode').textContent = MODE_META[state.mode].label;
    const spans = { vVCC: fmtV(curVCC()), vRA: fmtR(curRA()), vRB: fmtR(curRB()), vC: fmtC(curC()) };
    Object.keys(spans).forEach(id => { const s = el(id); if (s) s.textContent = spans[id]; });
  }

  function genPredice() {
    state._revealed = false; state.hide = true;
    state._predType = Math.random() < 0.5 ? 'f' : 'duty';
    const box = el('predBox');
    if (state._predType === 'f') {
      box.innerHTML = '<p>Predice la <b>frecuencia f</b> (Hz) con los valores actuales:</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="Hz" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    } else {
      box.innerHTML = '<p>Predice el <b>duty cycle</b> (%) con los valores actuales:</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="%" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    }
    refreshAll();
  }
  function checkPredice() {
    const res = curSolve();
    const guess = parseFloat(el('predInput').value);
    let target, real, tol;
    if (state._predType === 'f') { target = res.f; real = fmtHz(target); tol = 0.15 * target; }
    else { target = res.duty * 100; real = fmtPct(res.duty); tol = 3; }
    const ok = !isNaN(guess) && Math.abs(guess - target) <= tol;
    state._revealed = true; state.hide = false;
    refreshAll();
    showToast(ok ? '✅ Correcto — valor real: ' + real : '❌ No — valor real: ' + real, ok ? 'ok' : 'warn');
  }

  function newReto() {
    const raI = 1 + Math.floor(Math.random() * (RA_VALS.length - 1));
    const rbI = Math.floor(Math.random() * RB_VALS.length);
    const cI = Math.floor(Math.random() * C_VALS.length);
    const target = solveAstable(curVCC(), RA_VALS[raI], RB_VALS[rbI], C_VALS[cI]).f;
    state._reto = { fTarget: target, tol: 0.15 };
    el('retoBox').innerHTML = `<p>Diseña RA, RB y C para lograr f ≈ <b>${fmtHz(target)}</b> (±15%), con duty cycle ≤ 55% y RA ≥ 1kΩ.</p>`;
    refreshAll();
  }
  function checkReto() {
    const res = curSolve();
    const target = state._reto.fTarget;
    const errRel = Math.abs(res.f - target) / target;
    if (res.warnRA) {
      showToast('RA=' + fmtR(res.RA) + ' está por debajo del mínimo recomendado (1kΩ): sube RA.', 'warn');
    } else if (errRel > state._reto.tol) {
      showToast(`f=${fmtHz(res.f)} está lejos del objetivo ${fmtHz(target)}: ajusta RB o C (f ∝ 1/((RA+2RB)·C)).`, 'warn');
    } else if (res.duty > 0.55) {
      showToast(`duty=${fmtPct(res.duty)} supera 55%: sube RB respecto a RA para acercarte a 50%.`, 'warn');
    } else {
      showToast(`✅ Diseño válido: f=${fmtHz(res.f)}, duty=${fmtPct(res.duty)}.`, 'ok');
    }
  }

  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < RB_VALS.length; i++) {
      state.iRB = i;
      const res = curSolve();
      state._sweepTrace.push({ rb: RB_VALS[i], f: res.f, duty: res.duty });
      refreshAll();
      await sleep(400);
    }
    updateReport();
  }

  function updateTele() {
    const t = el('telemetry');
    if (!t) return;
    if (state.hide) { t.innerHTML = '<div>f: ? · duty: ?</div><div style="color:#8FB3AC">Predice antes de revelar.</div>'; return; }
    const res = curSolve();
    t.innerHTML = '<div>f: ' + fmtHz(res.f) + ' · T: ' + fmtT(res.T) + ' · duty: ' + fmtPct(res.duty) + '</div>' +
      '<div>tHigh: ' + fmtT(res.tHigh) + ' · tLow: ' + fmtT(res.tLow) + '</div>' +
      (res.warnRA ? '<div style="color:#ef4444">⚠ RA < 1kΩ recomendado (corriente del transistor de descarga)</div>' : '<div style="color:#6a7a80">Umbrales: 2/3 Vcc (' + fmtV(2 * curVCC() / 3) + ') / 1/3 Vcc (' + fmtV(curVCC() / 3) + ')</div>');
  }
  function updateReport() {
    const rep = el('report');
    if (!rep) return;
    if (state.mode !== 'medicion' || !state._sweepTrace || !state._sweepTrace.length) { rep.innerHTML = ''; return; }
    let rows = state._sweepTrace.map(pt => `<tr><td>${fmtR(pt.rb)}</td><td>${fmtHz(pt.f)}</td><td>${fmtPct(pt.duty)}</td></tr>`).join('');
    rep.innerHTML = `<table class="repTable"><thead><tr><th>RB</th><th>f</th><th>duty</th></tr></thead><tbody>${rows}</tbody></table>`;
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
  const QUIZ = [
    { q: '¿Por qué la descarga del capacitor pasa solo por RB, mientras que la carga pasa por RA+RB juntas?', a: ['Porque el pin de descarga (pin 7) conecta a tierra internamente durante tLow, dejando fuera a RA', 'Porque RA se desconecta físicamente durante tLow', 'Porque el 555 invierte la corriente'], correct: 0 },
    { q: 'Si duplicas RB dejando RA y C fijos, ¿qué le pasa al duty cycle?', a: ['Se acerca más a 50%, porque (RA+RB)/(RA+2RB) tiende a 1/2 cuando RB≫RA', 'Se aleja de 50%', 'No cambia'], correct: 0 },
    { q: '¿Por qué el duty cycle de este astable de 3 terminales nunca puede ser menor a 50%?', a: ['Porque tHigh=0.693(RA+RB)C siempre es mayor o igual que tLow=0.693·RB·C, ya que RA≥0', 'Porque el 555 lo limita por software', 'Porque Vcc lo impide'], correct: 0 },
  ];
  let quizIdx = 0;
  function buildQuiz() { quizIdx = Math.floor(Math.random() * QUIZ.length); refreshQuestion(); }
  function refreshQuestion() {
    const item = QUIZ[quizIdx];
    const box = el('quizBox');
    if (!box) return;
    let html = '<div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Quiz rápido</div>';
    html += '<div style="font-size:13px;color:#EAF4F1;margin-bottom:8px">' + item.q + '</div>';
    item.a.forEach((opt, i) => { html += '<button class="b quizOpt" data-i="' + i + '" style="width:100%;text-align:left;margin-bottom:4px">' + opt + '</button>'; });
    box.innerHTML = html;
    box.querySelectorAll('.quizOpt').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        if (i === item.correct) { showToast('✅ Correcto', 'ok'); quizIdx = (quizIdx + 1) % QUIZ.length; refreshQuestion(); }
        else { showToast('❌ Intenta de nuevo', 'warn'); }
      });
    });
  }

  // ---------- Interacción 3D ----------
  function actToast(id) {
    const labels = { ra: 'RA', rb: 'RB', c: 'C', ic: 'NE555', vcc: 'Vcc', out: 'Vout' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) { return { ra: raG, rb: rbG, c: capG, ic: icG }[name]; }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (!actor) return;
    const s0 = actor.scale.clone();
    actor.scale.multiplyScalar(1.15);
    setTimeout(() => actor.scale.copy(s0), 220);
  }
  const ACTOR_NAMES = ['ra', 'rb', 'c', 'ic'];
  pickerFor(S.scene, S.camera, S.renderer.domElement, (hit) => {
    if (hit && hit.object === boardPlane && hit.uv) { boardClick(hit.uv.x, hit.uv.y); return; }
    let o = hit && hit.object;
    while (o) {
      for (const name of ACTOR_NAMES) { if (resolveActor(name) === o) { actToast(name); dispatch3D(name); return; } }
      o = o.parent;
    }
  });

  async function runAuto() {
    setMode('explora'); await sleep(600);
    state.iVCC = 1; state.iRA = 2; state.iRB = 1; state.iC = 2; refreshAll(); await sleep(900);
    state.iRB = 4; refreshAll(); await sleep(900);
    setMode('medicion'); await runSweep();
  }

  // ---------- Wiring ----------
  MODES.forEach(m => { const b = el('btn-mode-' + m); if (b) b.addEventListener('click', () => setMode(m)); });
  function wireStep(id, getIdx, setIdx, max) {
    const dec = el(id + 'Dec'), inc = el(id + 'Inc');
    if (dec) dec.addEventListener('click', () => { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
    if (inc) inc.addEventListener('click', () => { setIdx(Math.min(max, getIdx() + 1)); onChange(); });
  }
  wireStep('vcc', () => state.iVCC, v => state.iVCC = v, VCC_VALS.length - 1);
  wireStep('ra', () => state.iRA, v => state.iRA = v, RA_VALS.length - 1);
  wireStep('rb', () => state.iRB, v => state.iRB = v, RB_VALS.length - 1);
  wireStep('c', () => state.iC, v => state.iC = v, C_VALS.length - 1);
  el('predNew').addEventListener('click', genPredice);
  el('predCheck').addEventListener('click', checkPredice);
  el('retoNew').addEventListener('click', newReto);
  el('retoCheck').addEventListener('click', checkReto);
  el('sweepRun').addEventListener('click', runSweep);
  el('autoTour').addEventListener('click', runAuto);

  // ---------- Init ----------
  setMode('explora');
  buildQuiz();
  refreshAll();
  S.start();

  window.__labDebug = {
    state, DEV, solveAstable, curSolve, curveVC,
    setMode, genPredice, checkPredice, newReto, checkReto,
    runSweep, refreshAll,
  };
})();
