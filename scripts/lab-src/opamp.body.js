/*
FICHA DE FIDELIDAD — Amplificador Operacional (LM358 / TL072): Inversor y No Inversor

SÍ (verificado / modelo estándar de libro de texto):
- Ganancia ideal en lazo cerrado: Av=−Rf/Ri (inversor), Av=1+Rf/Ri (no inversor) — fórmulas
  estándar (Sedra & Smith; Boylestad & Nashelsky), válidas porque el Avol real de ambos
  dispositivos (~100 dB ≈ 10^5 V/V típico) es varios órdenes de magnitud mayor que cualquier
  ganancia de lazo cerrado usada en esta práctica (Avol→∞ es una aproximación excelente aquí).
- Ancho de banda de polo dominante: fc=GBW/|Av|; |Av(f)|=|Av|/√(1+(f/fc)²) — modelo estándar
  de un solo polo para amplificadores realimentados con ganancia-ancho de banda constante.
- LM358: GBW≈1 MHz típico, SR≈0.3 V/µs típico, Vos=2 mV típ/7 mV máx, Ib=20 nA típ/250 nA máx
  — hoja de datos Texas Instruments, confirmados por convergencia de múltiples fuentes
  secundarias (ver Nota de rigor).
- TL072: GBW≈3 MHz típico, SR≈13 V/µs típico, Vos=3 mV típ/10 mV máx — hoja de datos Texas
  Instruments/STMicroelectronics, confirmados por convergencia de múltiples fuentes (ver Nota
  de rigor). El swing de salida del TL072 (±10 V mín/±12 V típ @ VCC=±15V, RL=2kΩ, 25°C) SÍ es
  una cifra mínima garantizada de hoja de datos, a diferencia del LM358.
- Distorsión por slew-rate cuando el slew requerido (2π·f·Vout,pico) excede el SR del
  dispositivo: consecuencia física estándar y bien documentada del slew-rate finito.

NO (simplificado / extensión propia / no modelado):
- LM358: swing modelado como techo fijo Vcc−1.5V y piso fijo ≈0V en todo el rango de ±Vs — la
  hoja de datos solo da "0V a Vcc−1.5V típico bajo carga ligera"; se trata como constante en
  ±Vs, no como función de la carga real ni de la temperatura (extensión propia declarada).
- TL072: headroom modelado como ±3V fijo en ambos rieles para todo ±Vs — extrapolación propia
  del único punto de hoja de datos disponible (±12V típico @ ±15V/2kΩ/25°C); no se modela la
  variación real del headroom con la carga ni con ±Vs.
- Ib del TL072 (65 pA típ/200 pA máx): proviene de una sola fuente consultada, no cruzada contra
  una segunda fuente independiente — tratar con más cautela que el resto de las cifras.
- Corriente de salida máxima / carga externa RL: no modelada. Este laboratorio no incluye una
  resistencia de carga externa, precisamente para no necesitar una cifra de corriente de salida
  máxima que no fue verificada en este ciclo de investigación.
- Impedancia de entrada del no inversor: tratada como "muy alta / ideal" solo cualitativamente
  (la entrada JFET del TL072 implica Zin varios órdenes de magnitud mayor que la entrada
  bipolar del LM358, consistente con su Ib ~300× menor) — sin cifra numérica de MΩ/TΩ.
- Desfase (retardo de fase) entre entrada y salida: se grafica magnitud (Bode) y recorte de
  amplitud, pero no se calcula ni dibuja el desfase real introducido por el polo dominante.
- Distorsión armónica de pequeña señal dentro del rango lineal, deriva térmica de Vos/Ib, y
  tolerancia de fabricación de Ri/Rf: no modeladas (mismo criterio que labs anteriores).

Nota de rigor: las hojas de datos originales de Texas Instruments (LM358, TL072) no pudieron
leerse directamente en este entorno (el renderizado de PDF no está disponible). Las cifras
anteriores provienen de la convergencia de múltiples fuentes secundarias verificadas de forma
cruzada, no de la lectura directa del PDF del fabricante.

Fuentes: Texas Instruments LM358 datasheet (vía fuentes secundarias convergentes) · Texas
Instruments/STMicroelectronics TL072 datasheet (vía fuentes secundarias convergentes) ·
Sedra & Smith, "Microelectronic Circuits" (modelo de polo dominante, ganancia ideal) ·
Boylestad & Nashelsky, "Electronic Devices and Circuit Theory".
*/
(function () {
  'use strict';

  const mount = document.getElementById('stage');
  const S = createStage(mount, {
    cam: [3.4, 2.6, 7.6],
    target: [0.5, 1.2, 0.3],
    bgTop: '#0d1a17',
    bgBot: '#04060a',
    bloom: 0.35,
    minD: 3.0,
    maxD: 18,
  });
  const synth = makeSynth();

  function el(id) { return document.getElementById(id); }
  function showToast(msg, kind) {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function () { t.className = 'toast'; }, 2200);
  }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  // ---------- Tabla de dispositivos ----------
  const DEVS = {
    lm358: {
      name: 'LM358',
      gbw: 1.0e6,        // GBW típico (Hz) — sin mín/máx garantizado en hoja de datos
      sr: 0.3e6,         // slew rate típico (V/s) = 0.3 V/µs
      vosTyp: 0.002, vosMax: 0.007,
      ibTyp: 20e-9, ibMax: 250e-9,
      dropPos: 1.5,      // headroom típico contra +Vs (V)
      dropNeg: 0.02,     // headroom típico contra −Vs bajo carga ligera (V) — asimétrico
      note: 'Swing asimétrico (0V a Vcc−1.5V típico, carga ligera). GBW y SR son solo típicos.',
      color: 0x1a1a2e,
    },
    tl072: {
      name: 'TL072',
      gbw: 3.0e6,
      sr: 13e6,
      vosTyp: 0.003, vosMax: 0.010,
      ibTyp: 65e-12, ibMax: 200e-12,
      dropPos: 3.0, dropNeg: 3.0, // extrapolado de ±12V típ @ ±15V/2kΩ/25°C (único punto disponible)
      note: 'Swing aprox. simétrico. Entrada JFET: Ib ~300× menor que el LM358.',
      color: 0x16213e,
    },
  };

  // ---------- Física pura ----------
  function solveOpAmp(dev, topology, Ri, Rf, Vs, freq, vinAmp) {
    const avIdeal = topology === 'inv' ? -(Rf / Ri) : (1 + Rf / Ri);
    const avMag = Math.abs(avIdeal);
    const fc = dev.gbw / avMag; // polo dominante: fc = GBW / |Av|
    const ratio = freq / fc;
    const avMagAtF = avMag / Math.sqrt(1 + ratio * ratio);
    const avAtF = (avIdeal < 0 ? -1 : 1) * avMagAtF;
    const voutIdealAmp = avMagAtF * vinAmp;

    const ceil = Vs - dev.dropPos;      // techo real de salida (V), referido a 0V central
    const floorMag = Vs - dev.dropNeg;  // piso real de salida, como magnitud (V)
    const swingClipped = voutIdealAmp > ceil || voutIdealAmp > floorMag;
    const voutRealAmp = Math.min(voutIdealAmp, ceil, floorMag);

    const requiredSlew = 2 * Math.PI * freq * voutIdealAmp; // V/s para senoidal sin distorsión
    const slewLimited = requiredSlew > dev.sr;

    return {
      avIdeal: avIdeal, avMag: avMag, fc: fc, avAtF: avAtF, avMagAtF: avMagAtF,
      voutIdealAmp: voutIdealAmp, ceil: ceil, floorMag: floorMag,
      swingClipped: swingClipped, voutRealAmp: voutRealAmp,
      requiredSlew: requiredSlew, slewLimited: slewLimited, zinInv: Ri,
    };
  }

  function waveformPoints(res, freq, sr, n) {
    n = n || 64;
    const pts = [];
    const amp = res.voutIdealAmp;
    const sign = res.avIdeal < 0 ? -1 : 1;
    const T = freq > 0 ? 1 / freq : 1;
    for (let i = 0; i < n; i++) {
      let v;
      if (res.slewLimited && amp > 0) {
        const half = T / 2;
        const tt = ((i / n) * T) % T;
        v = tt < half ? (-amp + sr * tt) : (amp - sr * (tt - half));
      } else {
        const th = (i / n) * Math.PI * 2;
        v = amp * Math.sin(th);
      }
      v *= sign;
      if (v > res.ceil) v = res.ceil;
      if (v < -res.floorMag) v = -res.floorMag;
      pts.push(v);
    }
    return pts;
  }

  // ---------- Formato ----------
  function fmtV(v) { return Math.abs(v) < 1 ? (v * 1000).toFixed(0) + ' mV' : v.toFixed(2) + ' V'; }
  function fmtR(r) {
    if (r >= 1000) return (r / 1000).toFixed(r >= 10000 ? 0 : 1) + ' kΩ';
    return r.toFixed(0) + ' Ω';
  }
  function fmtAv(av) { return Math.abs(av).toFixed(2) + ' V/V'; }
  function fmtHz(f) {
    if (f >= 1e6) return (f % 1e6 === 0 ? (f / 1e6).toFixed(0) : (f / 1e6).toFixed(2)) + ' MHz';
    if (f >= 1e3) return (f % 1e3 === 0 ? (f / 1e3).toFixed(0) : (f / 1e3).toFixed(1)) + ' kHz';
    return f.toFixed(0) + ' Hz';
  }
  function fmtSR(vps) { return (vps / 1e6).toFixed(vps >= 10e6 ? 1 : 2) + ' V/µs'; }
  function fmtI(a) {
    const m = Math.abs(a);
    if (m < 1e-9) return (a * 1e12).toFixed(0) + ' pA';
    if (m < 1e-6) return (a * 1e9).toFixed(0) + ' nA';
    if (m < 1e-3) return (a * 1e6).toFixed(1) + ' µA';
    return (a * 1e3).toFixed(2) + ' mA';
  }

  // ---------- Estado ----------
  const VS_VALS = [9, 12, 15];
  const RI_VALS = [1000, 2200, 4700, 10000, 22000];
  const RF_VALS = [1000, 2200, 4700, 10000, 22000, 47000, 100000];
  const VIN_VALS = [0.02, 0.05, 0.1, 0.2, 0.5];
  const FREQ_VALS = [100, 1000, 10000, 50000, 200000, 1000000];

  const state = {
    devKey: 'lm358',
    topology: 'inv',
    iVS: 1, iRI: 2, iRF: 3, iVIN: 1, iFREQ: 1,
    mode: 'explora',
    hide: false,
    _revealed: false,
    _sweepTrace: null,
    _predType: 'av',
    _reto: null,
  };

  function curDev() { return DEVS[state.devKey]; }
  function curVS() { return VS_VALS[state.iVS]; }
  function curRI() { return RI_VALS[state.iRI]; }
  function curRF() { return RF_VALS[state.iRF]; }
  function curVIN() { return VIN_VALS[state.iVIN]; }
  function curFreq() { return FREQ_VALS[state.iFREQ]; }
  function curSolveOpAmp() { return solveOpAmp(curDev(), state.topology, curRI(), curRF(), curVS(), curFreq(), curVIN()); }
  function curColor() {
    const res = curSolveOpAmp();
    if (res.slewLimited) return '#c0392b';
    if (res.swingClipped) return '#E8871E';
    return '#3fae3f';
  }

  // ---------- Materiales 3D ----------
  const MAT = {
    board: { color: 0x0d3d2e, roughness: 0.85, metalness: 0.05 },
    resistorBody: { color: 0xd8c39a, roughness: 0.6, metalness: 0.1 },
    lead: { color: 0xc9c9c9, roughness: 0.35, metalness: 0.7 },
    icBody: { color: 0x1a1a1a, roughness: 0.5, metalness: 0.2 },
    notch: { color: 0xcccccc, roughness: 0.4, metalness: 0.5 },
  };
  function std(spec) { return new THREE.MeshStandardMaterial(spec); }

  const BAND_COLORS = ['#000000', '#8B4513', '#FF0000', '#FFA500', '#FFFF00', '#00FF00', '#0000FF', '#8A2BE2', '#808080', '#FFFFFF'];
  function bandsFor(ohms) {
    let exp = 0, val = ohms;
    while (val >= 100) { val /= 10; exp++; }
    const d1 = Math.floor(val / 10), d2 = Math.round(val) % 10;
    return [d1, d2, exp];
  }
  function paintBands(group, ohms) {
    const bands = bandsFor(ohms);
    const meshes = group.userData.bandMeshes;
    if (!meshes) return;
    for (let i = 0; i < 3; i++) {
      meshes[i].material.color.set(BAND_COLORS[bands[i]] || '#000000');
    }
  }

  function makeResistor3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.34, 16), std(MAT.resistorBody));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const bandMeshes = [];
    for (let i = 0; i < 3; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.047, 0.047, 0.025, 16), std({ color: 0x000000 }));
      band.rotation.z = Math.PI / 2;
      band.position.x = -0.09 + i * 0.06;
      g.add(band);
      bandMeshes.push(band);
    }
    const legM = std(MAT.lead);
    const legL = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8), legM);
    legL.rotation.z = Math.PI / 2; legL.position.x = -0.25; g.add(legL);
    const legR = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.16, 8), legM);
    legR.rotation.z = Math.PI / 2; legR.position.x = 0.25; g.add(legR);
    g.userData.bandMeshes = bandMeshes;
    g.userData.body = body;
    return g;
  }

  function makeDIP3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.16), std(MAT.icBody));
    g.add(body);
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.1, 12), std(MAT.notch));
    notch.rotation.z = Math.PI / 2;
    notch.position.set(-0.16, 0.02, 0);
    g.add(notch);
    const legM = std(MAT.lead);
    for (let i = 0; i < 4; i++) {
      const legF = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), legM);
      legF.position.set(-0.12 + i * 0.08, -0.06, 0.09);
      g.add(legF);
      const legB = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.06, 8), legM);
      legB.position.set(-0.12 + i * 0.08, -0.06, -0.09);
      g.add(legB);
    }
    g.userData.body = body;
    return g;
  }

  function makeDisplayBox(w, h, dp, cw, ch) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), std({ color: 0x111318, roughness: 0.6, metalness: 0.3 }));
    g.add(frame);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.9, h * 0.82),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    screen.position.z = dp / 2 + 0.001;
    g.add(screen);
    g.userData = { canvas: canvas, ctx: ctx, tex: tex };
    return g;
  }

  // ---------- Canvas: glifos de esquemático ----------
  function line(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = w || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function groundGlyph(ctx, x, y) {
    ctx.strokeStyle = '#8a8a8a'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x, y + 10); ctx.stroke();
    for (let i = 0; i < 3; i++) {
      const w = 16 - i * 5;
      ctx.beginPath(); ctx.moveTo(x - w / 2, y + 10 + i * 6); ctx.lineTo(x + w / 2, y + 10 + i * 6); ctx.stroke();
    }
  }
  function vResistorGlyph(ctx, x, y, h, col) {
    const w = 16;
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y, w, h);
  }
  function hResistorGlyph(ctx, x, y, w, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.strokeRect(x, y - 8, w, 16);
  }
  function acSourceGlyph(ctx, x, y, r, col) {
    ctx.strokeStyle = col || '#4aa3ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y);
    for (let i = 0; i <= 12; i++) {
      const t = i / 12;
      ctx.lineTo(x - r * 0.6 + t * r * 1.2, y - Math.sin(t * Math.PI * 2) * r * 0.45);
    }
    ctx.stroke();
  }
  function opampGlyph(ctx, x, y, w, h, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x, y - h / 2);
    ctx.lineTo(x, y + h / 2);
    ctx.lineTo(x + w, y);
    ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = col || '#cfd8dc'; ctx.font = 'bold 15px monospace';
    ctx.fillText('−', x + 8, y - h / 4 + 6);
    ctx.fillText('+', x + 8, y + h / 4 + 6);
  }

  // ---------- Layout ----------
  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const OA_X = 340, OA_Y = 250, OA_W = 70, OA_H = 100;
  const MINUS_Y = OA_Y - 25, PLUS_Y = OA_Y + 25;
  const SRC_X = 90, SUM_X = 300, OUT_STUB = OA_X + OA_W + 30;
  const GND_Y = 430, DIV_Y = 340;

  const HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id: id, x: x, y: y, w: w, h: h, label: label }); }

  function drawSchematic(ctx) {
    HIT.length = 0;
    ctx.clearRect(PX0 - 20, PY0 - 20, PX1 - PX0 + 60, PY1 - PY0 + 60);
    const col = state.hide ? '#cfd8dc' : curColor();
    const dev = curDev();
    const inv = state.topology === 'inv';

    opampGlyph(ctx, OA_X, OA_Y, OA_W, OA_H, col);
    addHit('opamp', OA_X - 5, OA_Y - OA_H / 2 - 5, OA_W + 10, OA_H + 10, dev.name + ' (U1)');

    // Indicación de alimentación (estilizada, corta, sin recorrido de riel completo)
    line(ctx, OA_X + 15, OA_Y - OA_H / 2, OA_X + 15, OA_Y - OA_H / 2 - 20);
    ctx.fillStyle = '#4aa3ff'; ctx.font = '11px monospace';
    ctx.fillText('+' + curVS().toFixed(0) + 'V', OA_X + 20, OA_Y - OA_H / 2 - 10);
    line(ctx, OA_X + 15, OA_Y + OA_H / 2, OA_X + 15, OA_Y + OA_H / 2 + 20);
    ctx.fillText('−' + curVS().toFixed(0) + 'V', OA_X + 20, OA_Y + OA_H / 2 + 26);

    // Salida
    line(ctx, OA_X + OA_W, OA_Y, OUT_STUB, OA_Y);
    addHit('out', OA_X + OA_W, OA_Y - 12, OUT_STUB - OA_X - OA_W, 24, 'Salida Vout');
    line(ctx, OUT_STUB, OA_Y, OUT_STUB, 130);
    line(ctx, OUT_STUB, 130, SUM_X, 130);

    if (inv) {
      acSourceGlyph(ctx, SRC_X, MINUS_Y, 16, '#4aa3ff');
      addHit('src', SRC_X - 18, MINUS_Y - 26, 36, 52, 'Fuente AC vin');
      line(ctx, SRC_X + 16, MINUS_Y, SRC_X + 40, MINUS_Y);
      hResistorGlyph(ctx, SRC_X + 40, MINUS_Y, 60, col);
      addHit('ri', SRC_X + 40, MINUS_Y - 12, 60, 24, 'Ri ' + fmtR(curRI()));
      line(ctx, SRC_X + 100, MINUS_Y, SUM_X, MINUS_Y);
      line(ctx, SUM_X, MINUS_Y, OA_X, MINUS_Y);

      vResistorGlyph(ctx, SUM_X, 260, 80, col);
      addHit('rf', SUM_X - 14, 260, 28, 80, 'Rf ' + fmtR(curRF()));
      line(ctx, SUM_X, 130, SUM_X, 260);
      line(ctx, SUM_X, 340, SUM_X, MINUS_Y);

      line(ctx, OA_X, PLUS_Y, OA_X - 20, PLUS_Y);
      line(ctx, OA_X - 20, PLUS_Y, OA_X - 20, GND_Y);
      groundGlyph(ctx, OA_X - 20, GND_Y);
      ctx.fillStyle = '#8a8a8a'; ctx.font = '11px monospace';
      ctx.fillText('0V (ref.)', OA_X - 78, PLUS_Y - 6);
    } else {
      acSourceGlyph(ctx, SRC_X, PLUS_Y, 16, '#4aa3ff');
      addHit('src', SRC_X - 18, PLUS_Y - 26, 36, 52, 'Fuente AC vin');
      line(ctx, SRC_X + 16, PLUS_Y, OA_X, PLUS_Y);

      line(ctx, OA_X, MINUS_Y, SUM_X + 30, MINUS_Y);
      line(ctx, SUM_X + 30, MINUS_Y, SUM_X + 30, DIV_Y);
      line(ctx, SUM_X + 30, DIV_Y, SUM_X, DIV_Y);

      vResistorGlyph(ctx, SUM_X, 260, 80, col);
      addHit('rf', SUM_X - 14, 260, 28, 80, 'Rf ' + fmtR(curRF()));
      line(ctx, SUM_X, 130, SUM_X, 260);
      line(ctx, SUM_X, 340, SUM_X, DIV_Y);

      vResistorGlyph(ctx, SUM_X, DIV_Y, 60, col);
      addHit('ri', SUM_X - 14, DIV_Y, 28, 60, 'Ri ' + fmtR(curRI()));
      line(ctx, SUM_X, DIV_Y + 60, SUM_X, GND_Y);
      groundGlyph(ctx, SUM_X, GND_Y);
    }

    if (!state.hide) {
      const res = curSolveOpAmp();
      const label = res.slewLimited ? 'DISTORSIÓN (SLEW)' : (res.swingClipped ? 'RECORTE (SWING)' : 'LINEAL');
      ctx.fillStyle = col; ctx.font = 'bold 13px monospace';
      ctx.fillText(label, OA_X + 90, OA_Y + 45);
    }
    ctx.fillStyle = '#cfd8dc'; ctx.font = 'bold 13px monospace';
    ctx.fillText(inv ? 'INVERSOR' : 'NO INVERSOR', PX0, PY0 + 10);
  }

  // ---------- Gráfica de Bode ----------
  function graphRange() {
    const res = curSolveOpAmp();
    const topDB = Math.ceil((20 * Math.log10(res.avMag) + 10) / 10) * 10;
    const botDB = topDB - 70;
    return { lfmin: Math.log10(50), lfmax: Math.log10(2e6), dbmin: botDB, dbmax: topDB };
  }
  function xPixLog(f, rng) {
    const lf = Math.log10(Math.max(f, 1));
    return GX0 + (lf - rng.lfmin) / (rng.lfmax - rng.lfmin) * (GX1 - GX0);
  }
  function yPixDB(db, rng) {
    return GY1 - (db - rng.dbmin) / (rng.dbmax - rng.dbmin) * (GY1 - GY0);
  }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 40, GY0 - 20, GX1 - GX0 + 80, GY1 - GY0 + 60);
    const rng = graphRange();
    line(ctx, GX0, GY1, GX1, GY1, 2, '#cfd8dc');
    line(ctx, GX0, GY0, GX0, GY1, 2, '#cfd8dc');
    ctx.fillStyle = '#8a8a8a'; ctx.font = '11px monospace';
    ctx.fillText('f (Hz, log)', GX1 - 60, GY1 + 16);
    ctx.fillText('|Av| dB', GX0 - 34, GY0 - 6);

    [100, 1000, 10000, 100000, 1000000].forEach(function (f) {
      const x = xPixLog(f, rng);
      line(ctx, x, GY0, x, GY1, 1, 'rgba(207,216,220,0.15)');
      ctx.fillStyle = '#6a7a80'; ctx.font = '10px monospace';
      ctx.fillText(fmtHz(f), x - 14, GY1 + 30);
    });

    const res = curSolveOpAmp();
    const dev = curDev();

    ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    for (let i = 0; i <= 100; i++) {
      const lf = rng.lfmin + (i / 100) * (rng.lfmax - rng.lfmin);
      const f = Math.pow(10, lf);
      const mag = res.avMag / Math.sqrt(1 + (f / res.fc) * (f / res.fc));
      const db = 20 * Math.log10(Math.max(mag, 1e-6));
      const x = xPixLog(f, rng), y = yPixDB(Math.max(rng.dbmin, db), rng);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();

    const flatDB = 20 * Math.log10(res.avMag);
    ctx.strokeStyle = 'rgba(207,216,220,0.4)'; ctx.setLineDash([4, 4]); ctx.lineWidth = 1;
    ctx.beginPath(); ctx.moveTo(GX0, yPixDB(flatDB, rng)); ctx.lineTo(GX1, yPixDB(flatDB, rng)); ctx.stroke();
    const fcx = xPixLog(res.fc, rng);
    ctx.beginPath(); ctx.moveTo(fcx, GY0); ctx.lineTo(fcx, GY1); ctx.stroke();
    ctx.setLineDash([]);
    ctx.fillStyle = '#ffb347'; ctx.font = '11px monospace';
    ctx.fillText('fc=' + fmtHz(res.fc), Math.min(fcx + 4, GX1 - 70), GY0 + 12);

    const opDB = 20 * Math.log10(Math.max(res.avMagAtF, 1e-6));
    const opx = xPixLog(curFreq(), rng), opy = yPixDB(Math.max(rng.dbmin, opDB), rng);
    ctx.fillStyle = curColor();
    ctx.beginPath(); ctx.arc(opx, opy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; ctx.font = '12px monospace';
    ctx.fillText('Op', opx + 8, opy - 8);

    if (state.mode === 'medicion' && state._sweepTrace && state._sweepTrace.length > 1) {
      ctx.strokeStyle = '#c9a8ff'; ctx.lineWidth = 2;
      ctx.beginPath();
      state._sweepTrace.forEach(function (p, i) {
        const px = xPixLog(p.freq, rng), py = yPixDB(Math.max(rng.dbmin, p.db), rng);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }

    ctx.fillStyle = '#8a8a8a'; ctx.font = 'bold 12px monospace';
    ctx.fillText('GBW ' + fmtHz(dev.gbw) + ' · −20dB/década', GX0, GY0 - 16);
  }

  function drawBoard() {
    drawSchematic(bctx);
    drawGraph(bctx);
  }

  function boardClick(u, v) {
    const x = u * 1024, y = (1 - v) * 768;
    for (let i = 0; i < HIT.length; i++) {
      const h = HIT[i];
      if (x >= h.x && x <= h.x + h.w && y >= h.y && y <= h.y + h.h) {
        actToast(h.id);
        dispatch3D(h.id);
        return true;
      }
    }
    return false;
  }

  // ---------- Escena: pizarrón canvas ----------
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 768;
  const bctx = boardCanvas.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  const boardPlane = new THREE.Mesh(new THREE.PlaneGeometry(4.2, 3.15), boardMat);
  boardPlane.position.set(0.5, 2.0, -1.2);
  const boardFrame = new THREE.Mesh(
    new THREE.BoxGeometry(4.32, 3.27, 0.06),
    std({ color: 0x0b0f10, roughness: 0.7, metalness: 0.2 })
  );
  boardFrame.position.set(0.5, 2.0, -1.24);
  const boardG = new THREE.Group();
  boardG.add(boardFrame, boardPlane);
  S.scene.add(boardG);

  // ---------- Escena: banco 3D ----------
  const benchG = new THREE.Group();
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(3.6, 0.12, 1.8), std({ color: 0x2b2f33, roughness: 0.8, metalness: 0.1 }));
  mesa.position.set(0.5, 0.55, 1.0);
  benchG.add(mesa);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(2.6, 0.03, 1.2), std(MAT.board));
  pcb.position.set(0.5, 0.62, 1.0);
  benchG.add(pcb);
  S.scene.add(benchG);

  const riG = makeResistor3D(); riG.position.set(-0.5, 0.68, 1.0); benchG.add(riG);
  const rfG = makeResistor3D(); rfG.position.set(0.1, 0.68, 1.0); benchG.add(rfG);
  const icG = makeDIP3D(); icG.position.set(0.9, 0.7, 1.0); benchG.add(icG);

  function refreshBenchSel() {
    paintBands(riG, curRI());
    paintBands(rfG, curRF());
    icG.userData.body.material.color.setHex(curDev().color);
  }

  const fuenteBox = makeDisplayBox(0.7, 0.42, 0.06, 220, 132);
  fuenteBox.position.set(-1.35, 0.95, 1.0);
  fuenteBox.rotation.y = Math.PI * 0.06;
  benchG.add(fuenteBox);

  const medidorBox = makeDisplayBox(0.7, 0.5, 0.06, 220, 156);
  medidorBox.position.set(1.75, 0.98, 1.0);
  medidorBox.rotation.y = -Math.PI * 0.06;
  benchG.add(medidorBox);

  const scopeBox = makeDisplayBox(1.0, 0.62, 0.06, 260, 160);
  scopeBox.position.set(0.5, 1.42, 0.62);
  scopeBox.rotation.x = -Math.PI * 0.06;
  benchG.add(scopeBox);

  function drawFuenteScreen() {
    const c = fuenteBox.userData.ctx, W = fuenteBox.userData.canvas.width, H = fuenteBox.userData.canvas.height;
    c.fillStyle = '#06120a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#3fe089'; c.font = 'bold 20px monospace';
    c.fillText('±' + curVS().toFixed(0) + '.0 V', 14, 40);
    c.font = '13px monospace'; c.fillStyle = '#8fe0b8';
    c.fillText(curDev().name + ' · ' + (state.topology === 'inv' ? 'Inversor' : 'No inversor'), 14, 68);
    c.fillText('f = ' + fmtHz(curFreq()), 14, 92);
    fuenteBox.userData.tex.needsUpdate = true;
  }

  function drawMedidorScreen() {
    const c = medidorBox.userData.ctx, W = medidorBox.userData.canvas.width, H = medidorBox.userData.canvas.height;
    c.fillStyle = '#0a0a12'; c.fillRect(0, 0, W, H);
    if (state.hide) {
      c.fillStyle = '#556'; c.font = 'bold 18px monospace';
      c.fillText('¿ ? ?', 14, 70);
      medidorBox.userData.tex.needsUpdate = true;
      return;
    }
    const res = curSolveOpAmp();
    c.fillStyle = '#ffd54a'; c.font = 'bold 15px monospace';
    c.fillText('Av  ' + (res.avIdeal < 0 ? '-' : '') + fmtAv(res.avMag), 14, 26);
    c.fillText('fc  ' + fmtHz(res.fc), 14, 48);
    c.fillStyle = '#4ad3ff'; c.font = '13px monospace';
    c.fillText('Av@f ' + (res.avAtF < 0 ? '-' : '') + fmtAv(res.avMagAtF), 14, 70);
    c.fillText('Vout ' + fmtV(res.voutRealAmp), 14, 90);
    c.fillStyle = res.slewLimited ? '#ff6b6b' : (res.swingClipped ? '#ffb347' : '#8fe0b8');
    c.font = 'bold 12px monospace';
    c.fillText(res.slewLimited ? 'SLEW-LIMITADO' : (res.swingClipped ? 'RECORTE' : 'LINEAL'), 14, 118);
    medidorBox.userData.tex.needsUpdate = true;
  }

  function drawScopeScreen() {
    const c = scopeBox.userData.ctx, W = scopeBox.userData.canvas.width, H = scopeBox.userData.canvas.height;
    c.fillStyle = '#050505'; c.fillRect(0, 0, W, H);
    c.strokeStyle = '#1a3a1a'; c.lineWidth = 1;
    for (let gx = 0; gx <= W; gx += W / 10) { c.beginPath(); c.moveTo(gx, 0); c.lineTo(gx, H); c.stroke(); }
    for (let gy = 0; gy <= H; gy += H / 8) { c.beginPath(); c.moveTo(0, gy); c.lineTo(W, gy); c.stroke(); }
    const midY = H / 2;

    c.strokeStyle = '#2b6fd6'; c.lineWidth = 1.5;
    c.beginPath();
    for (let i = 0; i < 64; i++) {
      const x = (i / 63) * W;
      const y = midY - (curVIN() * Math.sin((i / 63) * Math.PI * 2)) * (H / 2) / (VIN_VALS[VIN_VALS.length - 1] * 1.4);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    }
    c.stroke();

    const res = curSolveOpAmp();
    const pts = waveformPoints(res, curFreq(), curDev().sr, 64);
    const maxAbs = Math.max(1e-6, res.ceil, res.floorMag);
    c.strokeStyle = res.slewLimited ? '#ff6b6b' : (res.swingClipped ? '#ffb347' : '#ffb347');
    c.lineWidth = 2;
    c.beginPath();
    pts.forEach(function (v, i) {
      const x = (i / (pts.length - 1)) * W;
      const y = midY - (v / maxAbs) * (H / 2 - 6);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    });
    c.stroke();
    c.fillStyle = '#cfcfcf'; c.font = '11px monospace';
    c.fillText('vin / vout · osciloscopio', 8, H - 8);
    scopeBox.userData.tex.needsUpdate = true;
  }

  function refreshBenchDyn() {
    drawFuenteScreen();
    drawMedidorScreen();
    drawScopeScreen();
  }

  // ---------- HUD ----------
  document.getElementById('hud').innerHTML =
    '<div class="eyebrow">D2 · Semiconductores — Práctica d2-11</div>' +
    '<div class="h2">Amplificador Operacional: Inversor y No Inversor, Limitado por GBW</div>' +
    '<div class="p">Con un op-amp ideal, la ganancia en lazo cerrado solo depende de Ri y Rf. Con un ' +
    'op-amp real, el producto ganancia×ancho de banda (GBW) es aproximadamente constante: subir la ' +
    'ganancia baja el ancho de banda disponible. Compara el LM358 (bipolar, GBW≈1MHz, SR≈0.3V/µs, ' +
    'swing asimétrico) con el TL072 (entrada JFET, GBW≈3MHz, SR≈13V/µs, swing casi simétrico) para ' +
    'ver cómo el mismo diseño se comporta distinto según el chip.</div>' +
    '<div class="formula">Ganancia ideal — Inversor: Av=−Rf/Ri · No inversor: Av=1+Rf/Ri<br>' +
    'Ancho de banda (polo dominante): fc=GBW/|Av| · |Av(f)|=|Av|/√(1+(f/fc)²)<br>' +
    'Distorsión por slew-rate si 2π·f·Vout,pico &gt; SR</div>' +
    '<div class="legend">' +
    '<span class="li"><span class="dot" style="background:#3fae3f"></span>Lineal</span>' +
    '<span class="li"><span class="dot" style="background:#E8871E"></span>Recorte por swing</span>' +
    '<span class="li"><span class="dot" style="background:#c0392b"></span>Distorsión por slew</span>' +
    '<span class="li"><span class="dot" style="background:#c9a8ff"></span>Traza de barrido</span>' +
    '</div>' +
    '<div class="fid">' +
    '<b>SÍ verificado:</b> Av ideal (Rf/Ri) · modelo de polo dominante fc=GBW/|Av| · GBW y SR ' +
    'típicos de LM358/TL072 (convergencia de fuentes) · swing mínimo garantizado del TL072 · ' +
    'distorsión por slew-rate cuando el slew requerido excede el SR.<br>' +
    '<b>NO modelado:</b> headroom de salida como función real de la carga/temperatura (se usa un ' +
    'valor fijo por dispositivo) · corriente de salida máxima ni RL externa · Zin numérica del no ' +
    'inversor (solo cualitativa) · desfase entrada-salida · distorsión armónica en zona lineal · ' +
    'Ib del TL072 proviene de una sola fuente, no cruzada dos veces.' +
    '</div>' +
    '<div class="src">Ref: Texas Instruments LM358 datasheet (fuentes secundarias convergentes) · ' +
    'Texas Instruments/STMicroelectronics TL072 datasheet (fuentes secundarias convergentes) · ' +
    'Sedra &amp; Smith, "Microelectronic Circuits" · Boylestad &amp; Nashelsky, "Electronic Devices ' +
    'and Circuit Theory". Los PDF originales no pudieron leerse directamente en este entorno.</div>';

  // ---------- Panel ----------
  document.getElementById('panel').innerHTML =
    '<h4>Amplificador Operacional · <span id="p_mode">Explora</span></h4>' +
    '<div class="modebar">' +
    '<button class="b on" id="btn-mode-explora">🔎 Explora</button>' +
    '<button class="b" id="btn-mode-predice">🧠 Predicción</button>' +
    '<button class="b" id="btn-mode-medicion">📏 Medición</button>' +
    '<button class="b" id="btn-mode-reto">🎯 Reto</button>' +
    '</div>' +
    '<div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>' +
    '<div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Amplificador operacional</div>' +
    '<select id="devSelect" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">' +
    '<option value="lm358">LM358</option><option value="tl072">TL072</option>' +
    '</select>' +
    '<div class="btns" style="margin-top:8px">' +
    '<button class="b on" id="topoToggle" style="width:100%">Topología: Inversor</button>' +
    '</div>' +
    '<div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">' +
    '<div>±Vs</div><button class="b" id="vsDec" style="padding:2px 8px">−</button><span id="vVS">—</span><button class="b" id="vsInc" style="padding:2px 8px">+</button>' +
    '<div>Ri</div><button class="b" id="riDec" style="padding:2px 8px">−</button><span id="vRI">—</span><button class="b" id="riInc" style="padding:2px 8px">+</button>' +
    '<div>Rf</div><button class="b" id="rfDec" style="padding:2px 8px">−</button><span id="vRF">—</span><button class="b" id="rfInc" style="padding:2px 8px">+</button>' +
    '<div>Vin</div><button class="b" id="vinDec" style="padding:2px 8px">−</button><span id="vVIN">—</span><button class="b" id="vinInc" style="padding:2px 8px">+</button>' +
    '<div>f</div><button class="b" id="freqDec" style="padding:2px 8px">−</button><span id="vFREQ">—</span><button class="b" id="freqInc" style="padding:2px 8px">+</button>' +
    '</div>' +
    '<div id="telemetry" style="margin-top:10px;font-size:12px;color:#EAF4F1;line-height:1.5"></div>' +
    '<div id="predWrap" style="display:none;margin-top:10px">' +
    '<div id="predBox"></div>' +
    '<div class="btns" style="margin-top:6px">' +
    '<button class="b" id="predNew" style="flex:1 0 48%">Nueva pregunta</button>' +
    '<button class="b" id="predCheck" style="flex:1 0 48%">Verificar</button>' +
    '</div></div>' +
    '<div id="retoWrap" style="display:none;margin-top:10px">' +
    '<div id="retoBox"></div>' +
    '<div class="btns" style="margin-top:6px">' +
    '<button class="b" id="retoNew" style="flex:1 0 48%">Nuevo reto</button>' +
    '<button class="b" id="retoCheck" style="flex:1 0 48%">Verificar diseño</button>' +
    '</div></div>' +
    '<div id="sweepWrap" style="display:none;margin-top:10px">' +
    '<button class="b" id="sweepRun" style="width:100%">▶ Barrer frecuencia</button>' +
    '</div>' +
    '<div id="report" style="margin-top:10px;font-size:11px;color:#8FB3AC;line-height:1.5"></div>' +
    '<div style="margin-top:14px;border-top:1px solid #1E3A34;padding-top:10px" id="quizBox"></div>' +
    '<button class="b" id="autoTour" style="width:100%;margin-top:10px">🎬 Tour guiado</button>';

  // ---------- Modos ----------
  const MODES = ['explora', 'predice', 'medicion', 'reto'];
  const MODE_META = {
    explora: { label: 'Explora', icon: '🔎' },
    predice: { label: 'Predicción', icon: '🧠' },
    medicion: { label: 'Medición', icon: '📏' },
    reto: { label: 'Reto', icon: '🎯' },
  };
  const MISIONES = {
    explora: 'Ajusta Ri, Rf, la topología y el op-amp, y observa cómo cambian Av, fc y la forma de onda de salida.',
    predice: 'Predice la ganancia o si la frecuencia actual está dentro del ancho de banda, antes de revelarlo.',
    medicion: 'Barre la frecuencia y observa el punto de operación deslizarse por la curva de Bode mientras el osciloscopio muestra el recorte o la distorsión resultante.',
    reto: 'Diseña Ri/Rf (y elige el op-amp correcto) para cumplir un objetivo simultáneo de ganancia y ancho de banda.',
  };

  function setMode(m) {
    state.mode = m;
    state.hide = (m === 'predice' && !state._revealed);
    const pw = el('predWrap'); if (pw) pw.style.display = m === 'predice' ? 'block' : 'none';
    const rw = el('retoWrap'); if (rw) rw.style.display = m === 'reto' ? 'block' : 'none';
    const sw = el('sweepWrap'); if (sw) sw.style.display = m === 'medicion' ? 'block' : 'none';
    if (m === 'predice') genPredice();
    if (m === 'reto') newReto();
    refreshAll();
    const mm = el('missionText');
    if (mm) mm.textContent = MISIONES[m];
  }

  function syncCtrlBtns() {
    MODES.forEach(function (m) {
      const b = el('btn-mode-' + m);
      if (b) b.classList.toggle('on', state.mode === m);
    });
    const devSel = el('devSelect');
    if (devSel && devSel.value !== state.devKey) devSel.value = state.devKey;
    const pm = el('p_mode');
    if (pm) pm.textContent = MODE_META[state.mode].label;
    const topoBtn = el('topoToggle');
    if (topoBtn) topoBtn.textContent = 'Topología: ' + (state.topology === 'inv' ? 'Inversor' : 'No inversor');
    const spans = {
      vVS: '±' + curVS().toFixed(0) + ' V', vRI: fmtR(curRI()), vRF: fmtR(curRF()),
      vVIN: fmtV(curVIN()), vFREQ: fmtHz(curFreq()),
    };
    Object.keys(spans).forEach(function (id) {
      const s = el(id);
      if (s) s.textContent = spans[id];
    });
  }

  function toggleTopology() {
    state.topology = state.topology === 'inv' ? 'noninv' : 'inv';
    refreshAll();
    showToast('Topología: ' + (state.topology === 'inv' ? 'Inversor' : 'No inversor'), 'info');
  }

  // ---------- Predicción ----------
  function genPredice() {
    state._revealed = false;
    state.hide = true;
    state._predType = Math.random() < 0.5 ? 'av' : 'bw';
    const box = el('predBox');
    if (box) {
      box.innerHTML = state._predType === 'av'
        ? '<p>¿Cuál es aproximadamente <b>|Av|</b> con Ri y Rf actuales?</p>' +
          '<input id="predAnswerAv" type="number" step="0.1" placeholder="V/V" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">'
        : '<p>¿La frecuencia actual (' + fmtHz(curFreq()) + ') está <b>dentro</b> o <b>fuera</b> del ancho de banda (−3dB)?</p>' +
          '<select id="predAnswerBW" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">' +
          '<option value="dentro">Dentro</option><option value="fuera">Fuera</option></select>';
    }
    refreshAll();
  }

  function checkPredice() {
    const res = curSolveOpAmp();
    let ok = false, real = '';
    if (state._predType === 'av') {
      const inp = el('predAnswerAv');
      const guess = inp ? parseFloat(inp.value) : NaN;
      ok = !isNaN(guess) && Math.abs(guess - res.avMag) / Math.max(res.avMag, 1e-9) < 0.15;
      real = fmtAv(res.avMag);
    } else {
      const sel = el('predAnswerBW');
      const guess = sel ? sel.value : '';
      const answer = curFreq() <= res.fc ? 'dentro' : 'fuera';
      ok = guess === answer;
      real = answer + ' (fc=' + fmtHz(res.fc) + ')';
    }
    state._revealed = true;
    state.hide = false;
    refreshAll();
    showToast(ok ? '¡Correcto! → ' + real : 'No exactamente. Valor real: ' + real, ok ? 'ok' : 'warn');
    return ok;
  }

  // ---------- Reto ----------
  function newReto() {
    const avTarget = 5 + Math.floor(Math.random() * 46);
    const bwTargetKHz = 5 + Math.floor(Math.random() * 76);
    state._reto = { avTarget: avTarget, bwTargetHz: bwTargetKHz * 1000 };
    const box = el('retoBox');
    if (box) {
      box.innerHTML = '<p>Diseña Ri/Rf (elige también el op-amp si hace falta) para lograr ' +
        '<b>|Av| ≥ ' + avTarget + ' V/V</b> con un ancho de banda (−3dB) <b>≥ ' + bwTargetKHz + ' kHz</b>.</p>';
    }
    refreshAll();
  }

  function checkReto() {
    const dev = curDev();
    const res = curSolveOpAmp();
    const avOk = res.avMag >= state._reto.avTarget;
    const bwOk = res.fc >= state._reto.bwTargetHz;
    const ok = avOk && bwOk;
    let msg;
    if (ok) {
      msg = '¡Diseño correcto! Av=' + fmtAv(res.avMag) + ', fc=' + fmtHz(res.fc) + '.';
    } else {
      const maxFcAtTarget = dev.gbw / state._reto.avTarget;
      const possible = maxFcAtTarget >= state._reto.bwTargetHz;
      msg = 'Aún no: Av=' + fmtAv(res.avMag) + (avOk ? ' ✓' : ' ✗ (falta ganancia)') +
        ', fc=' + fmtHz(res.fc) + (bwOk ? ' ✓' : ' ✗ (falta ancho de banda)') + '.' +
        (!possible ? ' Con ' + dev.name + ' el ancho de banda máximo posible a esa ganancia es ' +
          fmtHz(maxFcAtTarget) + ' — prueba con el otro op-amp.' : '');
    }
    showToast(msg, ok ? 'ok' : 'warn');
    return ok;
  }

  // ---------- Barrido ----------
  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < FREQ_VALS.length; i++) {
      state.iFREQ = i;
      const res = curSolveOpAmp();
      const db = 20 * Math.log10(res.avMagAtF);
      state._sweepTrace.push({ freq: curFreq(), db: db });
      refreshAll();
      await sleep(400);
    }
    updateReport();
  }

  // ---------- Telemetría / reporte ----------
  function updateTele() {
    const t = el('telemetry');
    if (!t) return;
    if (state.hide) {
      t.innerHTML = '<div>Av: ? · fc: ?</div><div style="color:#8FB3AC">Predice antes de revelar.</div>';
      return;
    }
    const res = curSolveOpAmp();
    const dev = curDev();
    let html = '<div>Av ' + (res.avIdeal < 0 ? '-' : '') + fmtAv(res.avMag) + ' (ideal) → ' +
      (res.avAtF < 0 ? '-' : '') + fmtAv(res.avMagAtF) + ' @ ' + fmtHz(curFreq()) + '</div>';
    html += '<div>fc (−3dB) ' + fmtHz(res.fc) + '</div>';
    html += '<div>Vout ' + fmtV(res.voutRealAmp) + (res.swingClipped ? ' (RECORTE)' : '') + '</div>';
    html += '<div>Slew requerido ' + fmtSR(res.requiredSlew) + ' / SR disp. ' + fmtSR(dev.sr) +
      (res.slewLimited ? ' (LIMITADO)' : '') + '</div>';
    if (state.topology === 'inv') {
      html += '<div>Zin ≈ Ri = ' + fmtR(res.zinInv) + '</div>';
    } else {
      html += '<div>Zin: muy alta (ideal); JFET (TL072) &gt;&gt; bipolar (LM358) — no modelada numéricamente</div>';
    }
    html += '<div style="color:#6a7a80">Vos ' + fmtV(dev.vosTyp) + ' típ · Ib ' + fmtI(dev.ibTyp) + ' típ</div>';
    t.innerHTML = html;
  }

  function updateReport() {
    const r = el('report');
    if (!r) return;
    const res = curSolveOpAmp();
    r.innerHTML =
      '<table class="repTable"><tr><td>Topología</td><td>' + (state.topology === 'inv' ? 'Inversor' : 'No inversor') + '</td></tr>' +
      '<tr><td>Av ideal</td><td>' + (res.avIdeal < 0 ? '-' : '') + fmtAv(res.avMag) + '</td></tr>' +
      '<tr><td>fc (−3dB)</td><td>' + fmtHz(res.fc) + '</td></tr>' +
      '<tr><td>Av @ f actual</td><td>' + (res.avAtF < 0 ? '-' : '') + fmtAv(res.avMagAtF) + '</td></tr>' +
      '<tr><td>Estado</td><td>' + (res.slewLimited ? 'Distorsión por slew-rate' : (res.swingClipped ? 'Recorte por swing' : 'Lineal')) + '</td></tr>' +
      '</table>';
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
    { q: '¿Por qué el ancho de banda fc baja cuando aumenta la ganancia Rf/Ri?', a: ['Porque el producto ganancia×ancho de banda (GBW) es aproximadamente constante para un op-amp dado', 'Porque Rf se calienta y cambia de valor', 'Porque el osciloscopio no puede medir frecuencias altas'], correct: 0 },
    { q: '¿Qué causa que la señal de salida se vuelva un triángulo en vez de una senoidal?', a: ['El slew rate finito del op-amp no puede seguir la pendiente requerida por la señal', 'El voltaje de alimentación es demasiado alto', 'Ri es demasiado grande'], correct: 0 },
    { q: '¿Por qué el TL072 tolera mejor las señales rápidas y de mayor amplitud que el LM358?', a: ['Tiene un slew rate y un GBW mucho mayores (13 V/µs y 3 MHz típicos, frente a 0.3 V/µs y 1 MHz del LM358)', 'Tiene una carcasa más grande', 'Usa una tierra distinta'], correct: 0 },
  ];
  let quizIdx = 0;
  function buildQuiz() { quizIdx = Math.floor(Math.random() * QUIZ.length); refreshQuestion(); }
  function refreshQuestion() {
    const box = el('quizBox');
    if (!box) return;
    const item = QUIZ[quizIdx];
    let html = '<div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Quiz rápido</div>';
    html += '<div style="font-size:13px;color:#EAF4F1;margin-bottom:8px">' + item.q + '</div>';
    item.a.forEach(function (opt, i) {
      html += '<button class="b quizOpt" data-i="' + i + '" style="width:100%;text-align:left;margin-bottom:4px">' + opt + '</button>';
    });
    box.innerHTML = html;
    box.querySelectorAll('.quizOpt').forEach(function (b) {
      b.addEventListener('click', function () {
        const i = parseInt(b.getAttribute('data-i'), 10);
        if (i === item.correct) {
          showToast('¡Correcto!', 'ok');
          quizIdx = (quizIdx + 1) % QUIZ.length;
          refreshQuestion();
        } else {
          showToast('No es esa. Intenta de nuevo.', 'warn');
        }
      });
    });
  }

  // ---------- Interacción 3D ----------
  function actToast(id) {
    const labels = { ri: 'Ri — resistencia de entrada/realimentación', rf: 'Rf — resistencia de realimentación', opamp: curDev().name, src: 'Fuente AC vin', out: 'Salida Vout' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) {
    const map = { ri: riG, rf: rfG, opamp: icG };
    return map[name] || null;
  }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (actor) {
      const orig = actor.scale.clone();
      actor.scale.multiplyScalar(1.15);
      setTimeout(function () { actor.scale.copy(orig); }, 220);
    }
  }
  const ACTOR_NAMES = ['ri', 'rf', 'opamp'];
  pickerFor(S.scene, S.camera, S.renderer.domElement, function (hit) {
    if (hit && hit.object === boardPlane) {
      boardClick(hit.uv.x, hit.uv.y);
      return;
    }
    if (!hit || !hit.object) return;
    let o = hit.object;
    while (o) {
      const found = ACTOR_NAMES.find(function (k) { return resolveActor(k) === o; });
      if (found) { actToast(found); dispatch3D(found); return; }
      o = o.parent;
    }
  });

  // ---------- Tour guiado ----------
  async function runAuto() {
    setMode('explora');
    await sleep(600);
    state.iVS = 1; state.iRI = 2; state.iRF = 4; refreshAll();
    await sleep(800);
    toggleTopology();
    await sleep(800);
    toggleTopology();
    await sleep(400);
    setMode('medicion');
    await runSweep();
  }

  // ---------- Wiring ----------
  MODES.forEach(function (m) {
    const b = el('btn-mode-' + m);
    if (b) b.addEventListener('click', function () { setMode(m); });
  });

  function wireStep(id, getIdx, setIdx, max) {
    const inc = el(id + 'Inc'), dec = el(id + 'Dec');
    if (inc) inc.addEventListener('click', function () { setIdx(Math.min(max - 1, getIdx() + 1)); onChange(); });
    if (dec) dec.addEventListener('click', function () { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
  }
  wireStep('vs', function () { return state.iVS; }, function (v) { state.iVS = v; }, VS_VALS.length);
  wireStep('ri', function () { return state.iRI; }, function (v) { state.iRI = v; }, RI_VALS.length);
  wireStep('rf', function () { return state.iRF; }, function (v) { state.iRF = v; }, RF_VALS.length);
  wireStep('vin', function () { return state.iVIN; }, function (v) { state.iVIN = v; }, VIN_VALS.length);
  wireStep('freq', function () { return state.iFREQ; }, function (v) { state.iFREQ = v; }, FREQ_VALS.length);

  const devSel = el('devSelect');
  if (devSel) devSel.addEventListener('change', function (e) { state.devKey = e.target.value; onChange(); });
  const topoBtn = el('topoToggle');
  if (topoBtn) topoBtn.addEventListener('click', toggleTopology);

  const predNew = el('predNew'); if (predNew) predNew.addEventListener('click', genPredice);
  const predCheck = el('predCheck'); if (predCheck) predCheck.addEventListener('click', checkPredice);
  const retoNew = el('retoNew'); if (retoNew) retoNew.addEventListener('click', newReto);
  const retoCheck = el('retoCheck'); if (retoCheck) retoCheck.addEventListener('click', checkReto);
  const sweepRun = el('sweepRun'); if (sweepRun) sweepRun.addEventListener('click', runSweep);
  const autoTour = el('autoTour'); if (autoTour) autoTour.addEventListener('click', runAuto);

  // ---------- Init ----------
  setMode('explora');
  buildQuiz();
  refreshAll();
  S.start();

  window.__labDebug = {
    state: state,
    DEVS: DEVS,
    solveOpAmp: solveOpAmp,
    curSolveOpAmp: curSolveOpAmp,
    curDev: curDev,
    setMode: setMode,
    toggleTopology: toggleTopology,
    genPredice: genPredice,
    checkPredice: checkPredice,
    newReto: newReto,
    checkReto: checkReto,
    runSweep: runSweep,
    setDevice: function (k) { state.devKey = k; onChange(); },
    setIdx: function (which, i) {
      if (which === 'vs') state.iVS = i;
      else if (which === 'ri') state.iRI = i;
      else if (which === 'rf') state.iRF = i;
      else if (which === 'vin') state.iVIN = i;
      else if (which === 'freq') state.iFREQ = i;
      onChange();
    },
    waveformPoints: waveformPoints,
    refreshAll: refreshAll,
  };
})();
