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
    _sweepTrace: null, _predType: 'f', _reto: null, _predDone: false,
    retoSolved: false, intentos: 0, fallosSeguidos: 0, pistas: 0, pistaLog: [],
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

    ctx.font = 'bold 13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.fillText('Estado oculto — predice antes de revelar', PX0 + 10, PY1 - 12);
    } else {
      const res = curSolve();
      if (res.warnRA) { ctx.fillStyle = '#ef4444'; ctx.fillText('⚠ RA por debajo del mínimo recomendado (1kΩ)', PX0 + 10, PY1 - 12); }
      else { ctx.fillStyle = '#22c55e'; ctx.fillText('f=' + fmtHz(res.f) + ' · duty=' + fmtPct(res.duty), PX0 + 10, PY1 - 12); }
    }
  }

  // ---------- Gráfica: curva de carga/descarga del capacitor ----------
  function xPixT(tFrac) { return GX0 + 30 + tFrac * (GX1 - GX0 - 50); }
  function yPixV(v, Vcc) { return GY1 - 30 - (v / Vcc) * (GY1 - GY0 - 50); }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    const Vcc = curVCC();
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

    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = 'bold 13px sans-serif';
      ctx.fillText('Curva oculta — predice antes de revelar', GX0 + 40, (GY0 + GY1) / 2 + 30);
      return;
    }

    const res = curSolve();
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
  /* El pizarrón (esquemático + curva) va arriba y al fondo; debajo, el montaje
     REAL sobre un protoboard: fuente a un lado, medidor al otro, el osciloscopio
     en medio y, entre todos, el astable cableado con los encapsulados de verdad. */
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 768;
  const bctx = boardCanvas.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  /* El lienzo sólo usa sus 480 px de arriba (de 768): el pizarrón enseña esa franja,
     con las UV remapeadas, así que boardClick sigue leyendo píxeles de lienzo bien. */
  const FR = 480 / 768;
  const boardGeo = new THREE.PlaneGeometry(4.2, 3.15 * FR);
  { const uv = boardGeo.attributes.uv; for (let i = 0; i < uv.count; i++) uv.setY(i, 1 - FR + uv.getY(i) * FR); }
  const boardPlane = new THREE.Mesh(boardGeo, boardMat);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(4.32, 3.15 * FR + 0.12, 0.06), std({ color: 0x1b1f24, roughness: 0.8, metalness: 0.2 }));
  boardFrame.position.z = -0.04;
  const boardG = new THREE.Group();
  boardG.add(boardFrame, boardPlane);
  boardG.scale.setScalar(0.78); boardG.position.set(0, 2.5, -1.55);
  S.scene.add(boardG);

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
  const BANCO = P3.bancoPrototipos(MATP, { cols: 18, K: 1.7, instrumentos: 2,
    dims: [{ ancho: 0.84, alto: 0.50 }, { ancho: 0.92, alto: 0.56, visorAlto: 0.62 }] });
  const benchG = BANCO;
  const circG = BANCO.userData.circ, H = BANCO.userData.H;
  const railNear = BANCO.userData.rielCerca;
  const fuenteInst = BANCO.userData.instrumento(0);
  const medidorInst = BANCO.userData.instrumento(1);
  const scopeInst = osciloscopioEnEstante(BANCO, 0, 0.56, 416);
  const fuenteBox = { userData: { canvas: fuenteInst.cv, ctx: fuenteInst.cx, tex: fuenteInst.tex } };
  const medidorBox = { userData: { canvas: medidorInst.cv, ctx: medidorInst.cx, tex: medidorInst.tex } };
  const scopeBox = { userData: { canvas: scopeInst.cv, ctx: scopeInst.cx, tex: scopeInst.tex } };
  const CABLE = { rojo: 0xd64545, negro: 0x1b1f24, azul: 0x2a5fa8, amarillo: 0xe0a21c, verde: 0x2f9e5b, naranja: 0xe07b22 };

  /* LA ZONA DE MONTAJE. Lo que depende del tipo de capacitor (cerámico o
     electrolítico) se rehace aquí; los resistores sólo repintan sus bandas. */
  let raG = null, rbG = null, capG = null, icG = null, ctrlG = null, circKey = '';
  function esElectrolitico(c) { return c >= 1e-6; }
  function armaCircuito() {
    const key = state.iC;
    if (key === circKey) return;
    circKey = key;
    BANCO.userData.limpia(); BANCO.userData.reiniciaRieles();
    function wire(a, b, col, o) { const w = P3.puente(MATP, a, b, Object.assign({ color: col }, o || {})); circG.add(w); return w; }
    function res(ohm, c1, f1, c2, f2) {
      const g = P3.resistorAxial(MATP, { ohm: ohm, paso: Math.abs(c2 - c1) * 0.1 });
      g.position.copy(H(c1, f1)).lerp(H(c2, f2), 0.5); g.position.y = H(c1, f1).y;
      circG.add(g); return g;
    }
    // El NE555 a caballo del canal: 1 GND · 2 TRIG · 3 OUT · 4 RESET delante; 8 VCC · 7 DIS · 6 THR · 5 CTRL detrás.
    const DC = 10;
    icG = P3.dipRotulado(MATP, { pines: 8, rotulo: 'NE555', rotulo2: 'CEN LABS' });
    icG.position.copy(H(DC + 1.5, 'e')).lerp(H(DC + 1.5, 'f'), 0.5); icG.position.y = H(DC, 'e').y;
    circG.add(icG);
    const alto = { minAlto: 0.30 };
    // alimentación y masa del integrado
    wire(H(DC, 'g'), railNear('+', DC), CABLE.rojo);                 // pin 8 → VCC
    wire(H(DC + 3, 'c'), railNear('+', DC + 3), CABLE.rojo, alto);   // pin 4 (RESET) → VCC
    wire(H(DC, 'c'), railNear('-', DC), CABLE.negro, alto);          // pin 1 → GND
    // RA: de VCC al pin 7 (DIS). RB: del pin 7 al pin 6 (THR). THR y TRIG, unidos.
    raG = res(curRA(), DC + 1, 'h', DC - 3, 'h');
    wire(H(DC - 3, 'j'), railNear('+', DC - 3), CABLE.naranja);
    rbG = res(curRB(), DC + 2, 'i', DC - 2, 'i');
    wire(H(DC - 2, 'g'), H(DC + 1, 'g'), CABLE.amarillo);            // extremo de RB → pin 7
    wire(H(DC + 1, 'd'), H(DC + 2, 'g'), CABLE.verde, { minAlto: 0.30 }); // pin 2 ↔ pin 6
    // C entre TRIG y GND: electrolítico (≥ 1 µF) o cerámico, a la izquierda del integrado
    const cM = DC - 2, cP = DC - 1;
    if (esElectrolitico(curC())) {
      capG = P3.electrolitico(MATP, { valor: fmtC(curC()).replace(' ', ''), volt: '16V', d: 0.22, alto: 0.36 });
    } else {
      capG = ceramicoDisco(curC(), '50V');
    }
    capG.position.copy(H(cM + 0.5, 'a')); capG.position.y = H(cM, 'a').y;
    circG.add(capG);
    wire(H(cP, 'c'), H(DC + 1, 'c'), CABLE.azul);                    // + de C → TRIG
    wire(H(cM, 'd'), H(DC, 'd'), CABLE.negro);                       // − de C → GND (columna del pin 1)
    // desacoplo del pin 5 (CTRL): 10 nF a tierra. No interviene en el cálculo (ver ficha).
    ctrlG = ceramicoDisco(1e-8, '50V');
    ctrlG.position.copy(H(DC + 4.5, 'h')); ctrlG.position.y = H(DC, 'h').y;
    circG.add(ctrlG);
    wire(H(DC + 3, 'g'), H(DC + 4, 'g'), CABLE.naranja);             // pin 5 → pata del cerámico
    wire(H(DC + 5, 'j'), railNear('-', DC + 5), CABLE.negro);
    // instrumentos: fuente en los rieles, medidor en OUT, osciloscopio en Vc (CH1) y OUT (CH2)
    cableDesde(BANCO, circG, bocaInstrumento(fuenteInst, 0), railNear('+', 2), CABLE.rojo);
    cableDesde(BANCO, circG, bocaInstrumento(fuenteInst, 1), railNear('-', 3), CABLE.negro);
    cableDesde(BANCO, circG, bocaInstrumento(medidorInst, 0), H(DC + 2, 'c'), CABLE.amarillo);
    cableDesde(BANCO, circG, bocaInstrumento(medidorInst, 1), railNear('-', 16), CABLE.verde);
    cableDesde(BANCO, circG, bocaBNC(scopeInst, 0), H(DC + 2, 'j'), CABLE.amarillo);   // CH1 en THR/TRIG = Vc, por detrás
    cableDesde(BANCO, circG, bocaBNC(scopeInst, 1), H(DC + 2, 'b'), CABLE.azul);
    circG.traverse(function (o) { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  }
  armaCircuito();
  boardPlane.castShadow = false; boardFrame.receiveShadow = true;
  S.scene.add(benchG);

  function refreshBenchSel() {
    armaCircuito();
    raG.userData.ponValor(curRA());
    rbG.userData.ponValor(curRB());
  }

  function drawFuenteScreen() {
    const { ctx, canvas, tex } = fuenteBox.userData; const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#08120f'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'left'; ctx.fillStyle = '#4FD1C5';
    ctx.font = 'bold ' + Math.round(h * 0.30) + 'px monospace';
    ctx.fillText('Vcc ' + fmtV(curVCC()), w * 0.05, h * 0.34);
    ctx.font = Math.round(h * 0.17) + 'px monospace'; ctx.fillStyle = '#8fe3d0';
    ctx.fillText('RA ' + fmtR(curRA()) + '  RB ' + fmtR(curRB()), w * 0.05, h * 0.62);
    ctx.fillText('C ' + fmtC(curC()), w * 0.05, h * 0.86);
    tex.needsUpdate = true;
  }
  function drawMedidorScreen() {
    const { ctx, canvas, tex } = medidorBox.userData; const w = canvas.width, h = canvas.height;
    ctx.fillStyle = '#08120f'; ctx.fillRect(0, 0, w, h);
    ctx.textAlign = 'left';
    if (state.hide) {
      ctx.fillStyle = '#6b8a83'; ctx.font = 'bold ' + Math.round(h * 0.17) + 'px monospace';
      ctx.fillText('f: ?   duty: ?', w * 0.06, h * 0.40);
      ctx.fillText('¿cuánto valen?', w * 0.06, h * 0.74);
    } else {
      const res = curSolve();
      const f1 = Math.round(h * 0.15);
      ctx.font = 'bold ' + f1 + 'px monospace';
      ctx.fillStyle = '#5fb8ff'; ctx.fillText('f = ' + fmtHz(res.f), w * 0.05, h * 0.18);
      ctx.fillStyle = '#8fe3d0'; ctx.fillText('T = ' + fmtT(res.T), w * 0.05, h * 0.40);
      ctx.fillText('duty ' + fmtPct(res.duty), w * 0.05, h * 0.62);
      ctx.font = Math.round(h * 0.13) + 'px monospace';
      ctx.fillStyle = '#8fe3d0'; ctx.fillText('tH ' + fmtT(res.tHigh), w * 0.58, h * 0.40);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('tL ' + fmtT(res.tLow), w * 0.58, h * 0.62);
      ctx.font = 'bold ' + Math.round(h * 0.15) + 'px monospace';
      if (res.warnRA) { ctx.fillStyle = '#ef4444'; ctx.fillText('RA < 1kΩ recomendado', w * 0.05, h * 0.90); }
      else { ctx.fillStyle = '#22c55e'; ctx.fillText('OK', w * 0.05, h * 0.90); }
    }
    tex.needsUpdate = true;
  }
  function drawScopeScreen() {
    const { ctx, canvas, tex } = scopeBox.userData;
    const k = canvas.width / 260;                    // las cotas de abajo están pensadas para 260 px de ancho
    ctx.setTransform(k, 0, 0, k, 0, 0);
    const W = canvas.width / k, Hh = canvas.height / k;
    ctx.fillStyle = '#05100c'; ctx.fillRect(0, 0, W, Hh);
    ctx.strokeStyle = '#12312a'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (Hh - 20) / 4; line(ctx, 10, y, W - 10, y, 1, '#12312a'); }
    for (let i = 0; i <= 6; i++) { const x = 10 + i * (W - 20) / 6; line(ctx, x, 10, x, Hh - 10, 1, '#12312a'); }
    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = '11px sans-serif';
      ctx.fillText('Vc / Vout ocultos — predice antes de revelar', 12, Hh / 2);
      tex.needsUpdate = true; ctx.setTransform(1, 0, 0, 1, 0, 0);
      return;
    }
    const res = curSolve();
    const pts = curveVC(res, 160);
    const Vcc = res.Vcc;
    const toX = t => 10 + t * (W - 20);
    const toY = v => (Hh - 10) - (v / Vcc) * (Hh - 20);
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
    ctx.fillText('Vc / Vout · osciloscopio', 12, Hh - 2);
    tex.needsUpdate = true; ctx.setTransform(1, 0, 0, 1, 0, 0);
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
        <button class="b" id="retoHint" style="flex:1 0 100%">💡 Pista (máx. 2)</button>
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

  function rnd(n) { return Math.floor(Math.random() * n); }
  function randomizeConfig() {
    state.iVCC = rnd(VCC_VALS.length); state.iRA = rnd(RA_VALS.length); state.iRB = rnd(RB_VALS.length); state.iC = rnd(C_VALS.length);
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
    const spans = { vVCC: fmtV(curVCC()), vRA: fmtR(curRA()), vRB: fmtR(curRB()), vC: fmtC(curC()) };
    Object.keys(spans).forEach(id => { const s = el(id); if (s) s.textContent = spans[id]; });
  }

  const INPUT_CSS = 'width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px';
  function genPredice() {
    state._revealed = false; state._predDone = false; state.hide = true;
    randomizeConfig(); // cada pregunta es un caso nuevo
    state._predType = Math.random() < 0.5 ? 'f' : 'duty';
    const box = el('predBox');
    if (state._predType === 'f') {
      box.innerHTML = '<p>Predice la <b>frecuencia f</b> (Hz) con los valores actuales (±15 %):</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="Hz" style="' + INPUT_CSS + '">';
    } else {
      box.innerHTML = '<p>Predice el <b>duty cycle</b> (%) con los valores actuales (±3 puntos):</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="%" style="' + INPUT_CSS + '">';
    }
    refreshAll();
  }
  function checkPredice() {
    if (state._predDone) { showToast('Esa pregunta ya se reveló: pulsa «Nuevo».', 'info'); return; }
    const res = curSolve();
    const guess = parseFloat(el('predInput').value);
    let target, real, tol;
    if (state._predType === 'f') { target = res.f; real = fmtHz(target); tol = 0.15 * target; }
    else { target = res.duty * 100; real = fmtPct(res.duty); tol = 3; }
    const ok = !isNaN(guess) && Math.abs(guess - target) <= tol;
    state._revealed = true; state._predDone = true; state.hide = false;
    refreshAll();
    showToast(ok ? '✅ Correcto — valor real: ' + real : '❌ No — valor real: ' + real, ok ? 'ok' : 'warn');
  }

  // ---------- Reto: frecuencia objetivo con duty ≤ 55 % ----------
  // El objetivo sale de un diseño realizable de la rejilla (semilla); el arranque neutro NO lo cumple.
  // Sin veredicto en vivo; a los 3 fallos seguidos hay caso nuevo; 2 pistas graduadas.
  const RETO_TOL = 0.10;
  function evalReto(R, res) {
    const fOk = Math.abs(res.f - R.fTarget) / R.fTarget <= R.tol;
    return { raOk: !res.warnRA, fOk: fOk, dutyOk: res.duty <= 0.55, ok: !res.warnRA && fOk && res.duty <= 0.55 };
  }
  function newReto() {
    let R = null, tries = 0;
    while (!R && tries < 400) {
      tries++;
      const vcc = state.iVCC;
      const raI = 1 + rnd(RA_VALS.length - 1), rbI = rnd(RB_VALS.length), cI = rnd(C_VALS.length);
      const seed = solveAstable(VCC_VALS[vcc], RA_VALS[raI], RB_VALS[rbI], C_VALS[cI]);
      if (seed.duty > 0.55 || seed.warnRA) continue;
      const c = { fTarget: seed.f, tol: RETO_TOL };
      const neutro = solveAstable(VCC_VALS[1], RA_VALS[2], RB_VALS[2], C_VALS[2]);
      if (!evalReto(c, neutro).ok) R = c;
    }
    if (!R) R = { fTarget: 700, tol: RETO_TOL };
    state._reto = R;
    state.iVCC = 1; state.iRA = 2; state.iRB = 2; state.iC = 2; // arranque neutro
    state.retoSolved = false; state.fallosSeguidos = 0; state.pistas = 0; state.pistaLog = [];
    renderReto('');
    refreshAll();
  }
  function renderReto(msg) {
    const R = state._reto;
    if (!R) return;
    el('retoBox').innerHTML = `<p>Diseña RA, RB y C para lograr f ≈ <b>${fmtHz(R.fTarget)}</b> (±${Math.round(R.tol * 100)}%), con duty cycle ≤ 55% y RA ≥ 1kΩ. Sin veredicto hasta «Comprobar».</p>` +
      `<div style="font-size:11px;color:#8FB3AC">Intentos: <b id="retoIntentos">${state.intentos}</b> · Pistas: ${state.pistas}/2${state.retoSolved ? ' · <b style="color:#3fae3f">✔ resuelto</b>' : ''}</div>` +
      (state.pistaLog.length ? '<div style="font-size:11px;margin-top:4px">' + state.pistaLog.map(h => '💡 ' + h).join('<br>') + '</div>' : '') +
      (msg ? `<div style="font-size:12px;margin-top:6px;color:${state.retoSolved ? '#3fae3f' : '#E8871E'}">${msg}</div>` : '');
  }
  function retoHint() {
    if (state.mode !== 'reto' || !state._reto) return;
    if (state.pistas >= 2) { showToast('Ya usaste las 2 pistas de este reto.', 'info'); return; }
    const H = ['La frecuencia depende del producto (RA+2RB)·C: varias parejas de valores dan la misma f, pero no el mismo duty.',
      'Duty = (RA+RB)/(RA+2RB): para acercarlo a 50 % hace falta que RB domine sobre RA, sin bajar RA de 1 kΩ.'];
    state.pistaLog.push(H[state.pistas]); state.pistas++;
    renderReto('');
  }
  function checkReto() {
    if (!state._reto) return;
    const res = curSolve();
    const e = evalReto(state._reto, res);
    state.intentos++;
    let msg;
    if (e.ok) {
      state.retoSolved = true; state.fallosSeguidos = 0;
      msg = `✅ Diseño válido: f=${fmtHz(res.f)}, duty=${fmtPct(res.duty)}.`;
    } else {
      state.retoSolved = false; state.fallosSeguidos++;
      const f = [];
      if (!e.raOk) f.push('RA está por debajo del mínimo recomendado');
      if (!e.fOk) f.push(res.f > state._reto.fTarget ? 'la frecuencia queda por encima del objetivo' : 'la frecuencia queda por debajo del objetivo');
      if (!e.dutyOk) f.push('el duty cycle supera el 55 %');
      msg = 'Aún no: ' + f.join('; ') + '.';
      if (state.fallosSeguidos >= 3) { newReto(); msg += ' Tres fallos seguidos: se plantea un caso nuevo.'; }
    }
    renderReto(msg);
    showToast(msg, e.ok ? 'ok' : 'warn');
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
  // Opciones barajadas (Fisher–Yates); la correcta no tiene posición fija ni es la más larga por sistema.
  const QUIZ = [
    { q: '¿Por qué la descarga del capacitor pasa solo por RB, mientras que la carga pasa por RA+RB juntas?',
      ok: 'Porque el pin 7 conecta a tierra internamente durante tLow y deja fuera a RA',
      bad: ['Porque RA se desconecta físicamente de Vcc durante tLow por un interruptor interno del 555', 'Porque el 555 invierte la corriente del capacitor al llegar al umbral de 2/3 Vcc', 'Porque RB es siempre mayor que RA y la corriente elige el camino de menor resistencia'] },
    { q: 'Si duplicas RB dejando RA y C fijos, ¿qué le pasa al duty cycle?',
      ok: 'Se acerca a 50 %, porque (RA+RB)/(RA+2RB) tiende a 1/2 cuando RB≫RA',
      bad: ['Se aleja de 50 %, porque tHigh crece más que tLow cuando sube RB', 'Se mantiene igual, porque el duty depende solo de C y de Vcc', 'Sube hasta 100 %, porque RB alarga el tiempo en que la salida permanece en alto'] },
    { q: '¿Por qué el duty cycle de este astable de 3 terminales nunca puede ser menor a 50 %?',
      ok: 'Porque tHigh=0,693(RA+RB)C es siempre mayor o igual que tLow=0,693·RB·C, ya que RA≥0',
      bad: ['Porque el 555 limita internamente el tiempo en bajo a la mitad del periodo total', 'Porque Vcc impide que el capacitor se descargue más rápido de lo que se carga', 'Porque el umbral de 1/3 Vcc es siempre menor que el de 2/3 Vcc, y eso fija el 50 %'] },
    { q: 'Cuatro veces más capacitancia C, con RA y RB fijas: ¿qué pasa con la frecuencia y el duty?',
      ok: 'La frecuencia baja a la cuarta parte y el duty no cambia, porque no depende de C',
      bad: ['La frecuencia baja a la mitad y el duty sube porque el capacitor tarda más en cargarse', 'La frecuencia sube porque el capacitor mayor almacena más carga por ciclo, y el duty baja', 'La frecuencia no cambia, porque solo RA y RB fijan los umbrales de conmutación del 555'] },
    { q: '¿Qué umbrales de voltaje usa el 555 para conmutar en este astable?',
      ok: 'Carga hasta 2/3 Vcc y descarga hasta 1/3 Vcc, de ahí el factor ln 2 ≈ 0,693',
      bad: ['Carga hasta Vcc y descarga hasta 0 V, y por eso el factor es ln 2 ≈ 0,693 en las fórmulas', 'Carga hasta 3/4 Vcc y descarga hasta 1/4 Vcc, con un factor de ln 3 ≈ 1,10 en los tiempos', 'Carga hasta 2/3 Vcc y descarga hasta 0 V, lo que hace tLow más largo que tHigh'] },
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

  // El tour es una DEMOSTRACIÓN: no toca el reto (nunca llama a checkReto) y al terminar
  // —o si algo falla— devuelve configuración, modo y barrido del alumno.
  let tourBusy = false;
  async function runAuto() {
    if (tourBusy) return;
    tourBusy = true;
    const btn = el('autoTour'); if (btn) btn.disabled = true;
    const keys = ['iVCC', 'iRA', 'iRB', 'iC', 'mode', 'hide', '_sweepTrace'];
    const snap = {};
    keys.forEach(k => { snap[k] = state[k]; });
    try {
      setMode('explora', true); await sleep(600);
      state.iVCC = 1; state.iRA = 2; state.iRB = 1; state.iC = 2; refreshAll(); await sleep(900);
      state.iRB = 4; refreshAll(); await sleep(900);
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
  wireStep('ra', () => state.iRA, v => state.iRA = v, RA_VALS.length - 1);
  wireStep('rb', () => state.iRB, v => state.iRB = v, RB_VALS.length - 1);
  wireStep('c', () => state.iC, v => state.iC = v, C_VALS.length - 1);
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
    state, DEV, solveAstable, curSolve, curveVC,
    setMode, genPredice, checkPredice, newReto, checkReto,
    runSweep, refreshAll, retoHint, runAuto, buildQuiz,
    get mode() { return state.mode; },
    get retoSolved() { return state.retoSolved; },
    get intentos() { return state.intentos; },
    get quizAnswer() { return quizAns; },
    get quizCorrectIndex() { return quizCorrectIdx(); },
  };
})();
