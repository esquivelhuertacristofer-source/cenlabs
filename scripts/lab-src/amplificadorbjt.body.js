/* ============================================================================
   CEN LABS · mecanica-21 · Amplificador BJT en Emisor Común (AC, hybrid-π)
   ----------------------------------------------------------------------------
   CONTRATO DE FIDELIDAD (declarado también en el panel HTML):

   SÍ verificado contra fuentes citadas:
     - Polarización DC por divisor de voltaje (Thevenin), idéntica al modelo
       de polarizacionbjt.body.js: VBE=0.7V constante, β dentro del rango de
       hoja de datos, punto Q resuelto en forma cerrada.
     - Modelo de pequeña señal hybrid-π: gm=ICQ/VT, rπ=β/gm, con VT=25mV fijo
       (aproximación estándar a temperatura ambiente).
     - Ganancia de voltaje con RE bypaseado: Av=-gm·(RC‖RL).
     - Recta de carga DC vs. recta de carga AC, con pendientes distintas.
     - BC547B: hFE sin cifra "típica" inventada — solo el rango de hoja de
       datos (mín-máx). VCEsat corregido a 600mV máx (no 400mV) para
       IC=100mA/IB=5mA, la condición de prueba real de la hoja de datos.

   NO verificado / extensión declarada:
     - Av con RE sin bypasear, Av=-β·(RC‖RL)/[rπ+(1+β)·RE], es una extensión
       propia derivada por KVL incremental estándar (no viene explícita en
       la fuente consultada para este laboratorio) — se declara como tal.
     - ro (resistencia de salida Early) es opcional y solo aparece si activas
       "modo avanzado": VA para 2N2222A es una estimación de orden de
       magnitud (~70-75V) tomada de modelos SPICE de terceros, NO un valor
       de hoja de datos tabulado. BC547B y 2N3904 no exponen esta opción por
       falta de una cifra de VA confiable.
     - 2N2222A: VCEsat (0.3V) y VCEO/VCBO/VEBO/IC/PD provienen de síntesis por
       búsqueda web tras fallos de acceso directo a 4 réplicas de hoja de
       datos distintas — tratar como referencia, no como cifra certificada.
     - 2N3904: hoja de datos original con acceso bloqueado (HTTP 403) al
       momento de la verificación — cifras tomadas de una réplica de
       distribuidor, no verificadas de forma independiente contra el
       fabricante original (ON Semiconductor).
   ========================================================================= */
(function () {
  'use strict';

  const mount = document.getElementById('stage');
  const S = createStage(mount, { cam: [3.4, 2.6, 7.6], target: [0.5, 1.2, 0.3], bgTop: '#0d1a17', bgBot: '#04060a', bloom: 0.35, minD: 3.0, maxD: 18 });
  const synth = makeSynth();

  function el(id) { return document.getElementById(id); }
  function showToast(msg, kind) {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(showToast._h);
    showToast._h = setTimeout(function () { t.className = 'toast'; }, 2600);
  }

  // ---------------------------------------------------------------------
  // Constantes físicas y tabla de dispositivos
  // ---------------------------------------------------------------------
  const VBE_ON = 0.7;
  const VT = 0.025; // 25 mV a temperatura ambiente

  const DEVS = {
    bc547b: {
      name: 'BC547B',
      hfeMin: 200, hfeMax: 450,
      vceSat: 0.09, vceSatMax: 0.6, // corregido: 600mV @ IC=100mA/IB=5mA
      vceo: 45, icMax: 0.1, ptot: 0.5, ptotNote: '0.5W @ 25°C (derating térmico no modelado)',
      vaHint: null,
      color: 0x2b2b2b,
    },
    n2n3904: {
      name: '2N3904',
      hfeMin: 100, hfeMax: 300,
      vceSat: 0.2, vceSatMax: 0.3,
      vceo: 40, icMax: 0.2, ptot: 0.625, ptotNote: '0.625W @ 25°C · hoja de datos de réplica (403 en fuente original)',
      vaHint: null,
      color: 0x1f1f1f,
    },
    n2222a: {
      name: '2N2222A',
      hfeMin: 100, hfeMax: 300,
      vceSat: 0.3, vceSatMax: 0.3,
      vceo: 40, icMax: 0.8, ptot: 0.5, ptotNote: '0.5W @ 25°C · síntesis por búsqueda web ⚑',
      vaHint: 72, // Early voltage, estimación de orden de magnitud, SOLO modo avanzado
      color: 0x3a3a3a,
    },
  };

  function betaDefault(dev) { return Math.round((dev.hfeMin + dev.hfeMax) / 2); }

  function parComb(a, b) {
    if (!isFinite(a)) return b;
    if (!isFinite(b)) return a;
    if (a <= 0) return b;
    if (b <= 0) return a;
    return (a * b) / (a + b);
  }

  // ---------------------------------------------------------------------
  // Solver DC (divisor de voltaje, topología única)
  // ---------------------------------------------------------------------
  function solveDC(dev, beta, VCC, R1, R2, RC, RE) {
    const VBB = VCC * R2 / (R1 + R2);
    const RBB = parComb(R1, R2);
    const IB = (VBB - VBE_ON) / (RBB + (beta + 1) * RE);
    if (IB <= 0) {
      return { corte: true, IB: 0, IC: 0, IE: 0, VCE: VCC, VB: VBB, ICsat: (VCC - dev.vceSat) / (RC + RE) };
    }
    let IC = beta * IB;
    let IE = IC + IB;
    let VCE = VCC - IC * RC - IE * RE;
    const ICsat = (VCC - dev.vceSat) / (RC + RE);
    let sat = false;
    if (VCE <= dev.vceSat) {
      sat = true;
      IC = ICsat;
      IE = IC; // aproximación de saturación: IB despreciable frente a IC
      VCE = dev.vceSat;
    }
    return { corte: false, sat: sat, IB: IB, IC: IC, IE: IE, VCE: VCE, VB: VBB, ICsat: ICsat };
  }

  // ---------------------------------------------------------------------
  // Solver AC (hybrid-π, pequeña señal)
  // ---------------------------------------------------------------------
  function solveAC(dev, beta, dc, RC, RE, RL, bypass, useRo) {
    if (dc.corte || dc.IC <= 0) {
      return { valid: false };
    }
    const gm = dc.IC / VT;
    const rpi = beta / gm;
    const ro = (useRo && dev.vaHint) ? (dev.vaHint / dc.IC) : 0;
    const RCeff = ro > 0 ? parComb(RC, ro) : RC;
    const acLoadR_bypass = parComb(RCeff, RL);
    let Av, acLoadR;
    if (bypass) {
      Av = -gm * acLoadR_bypass;
      acLoadR = acLoadR_bypass;
    } else {
      const RCRL = parComb(RCeff, RL);
      Av = -beta * RCRL / (rpi + (beta + 1) * RE);
      acLoadR = RCRL + RE; // pendiente de recta de carga AC extendida (extensión propia declarada)
    }
    // Recta de carga AC pivotea sobre el punto Q con pendiente -1/acLoadR (bypass)
    // o -1/(RC‖RL + RE) (sin bypass, extensión propia por KVL incremental).
    const downSwing = Math.max(0, dc.VCE - dev.vceSat); // límite por saturación
    const upSwing = dc.IC * acLoadR; // límite por corte (ic=0 en vce=VCEQ+upSwing)
    const maxSym = Math.min(downSwing, upSwing);
    return {
      valid: true, gm: gm, rpi: rpi, ro: ro, Av: Av, acLoadR: acLoadR,
      downSwing: downSwing, upSwing: upSwing, maxSym: maxSym,
    };
  }

  function waveformPoints(ac, vinAmp, n) {
    n = n || 64;
    const pts = [];
    if (!ac || !ac.valid) { for (let i = 0; i < n; i++) pts.push(0); return pts; }
    const voutIdeal = vinAmp * Math.abs(ac.Av);
    for (let i = 0; i < n; i++) {
      const th = (i / n) * Math.PI * 2;
      let v = voutIdeal * Math.sin(th);
      if (v > ac.upSwing) v = ac.upSwing;
      if (v < -ac.downSwing) v = -ac.downSwing;
      pts.push(v);
    }
    return pts;
  }

  function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }

  function fmtV(v) { return (Math.abs(v) < 1 ? (v * 1000).toFixed(0) + ' mV' : v.toFixed(2) + ' V'); }
  function fmtI(a) {
    if (Math.abs(a) < 1e-3) return (a * 1e6).toFixed(0) + ' µA';
    if (Math.abs(a) < 1) return (a * 1000).toFixed(2) + ' mA';
    return a.toFixed(3) + ' A';
  }
  function fmtP(p) { return (p * 1000).toFixed(1) + ' mW'; }
  function fmtR(r) {
    if (r >= 1000) return (r / 1000).toFixed(r >= 10000 ? 0 : 1) + ' kΩ';
    return r.toFixed(0) + ' Ω';
  }
  function fmtAv(av) { return (Math.abs(av)).toFixed(1) + ' V/V'; }
  function fmtS(s) {
    if (s >= 1e-6) return (s * 1e6).toFixed(2) + ' µS';
    return s.toExponential(2) + ' S';
  }

  // ---------------------------------------------------------------------
  // Estado
  // ---------------------------------------------------------------------
  const VCC_VALS = [9, 12, 15, 18];
  const R1_VALS = [10000, 15000, 22000, 33000, 47000];
  const R2_VALS = [2200, 3300, 4700, 6800, 10000];
  const RC_VALS = [1000, 2200, 3300, 4700];
  const RE_VALS = [220, 470, 1000, 1500];
  const RL_VALS = [Infinity, 10000, 4700, 2200];
  const VIN_VALS = [0.005, 0.01, 0.02, 0.05];

  const state = {
    devKey: 'bc547b',
    beta: betaDefault(DEVS.bc547b),
    iVCC: 1, iR1: 2, iR2: 2, iRC: 1, iRE: 1, iRL: 0, iVIN: 1,
    bypass: true,
    useRo: false,
    mode: 'explora',
    hide: false,
  };

  function curDev() { return DEVS[state.devKey]; }
  function curVCC() { return VCC_VALS[state.iVCC]; }
  function curR1() { return R1_VALS[state.iR1]; }
  function curR2() { return R2_VALS[state.iR2]; }
  function curRC() { return RC_VALS[state.iRC]; }
  function curRE() { return RE_VALS[state.iRE]; }
  function curRL() { return RL_VALS[state.iRL]; }
  function curVIN() { return VIN_VALS[state.iVIN]; }
  function curSolveDC() { return solveDC(curDev(), state.beta, curVCC(), curR1(), curR2(), curRC(), curRE()); }
  function curSolveAC() {
    const dc = curSolveDC();
    return solveAC(curDev(), state.beta, dc, curRC(), curRE(), curRL(), state.bypass, state.useRo);
  }

  // ---------------------------------------------------------------------
  // Materiales / colores de bandas (reutilizado del template de polarización)
  // ---------------------------------------------------------------------
  function std(hex) { return { color: hex, metalness: 0.3, roughness: 0.55 }; }
  const MAT = {
    board: std(0x1b3a2f), copper: std(0xb87333), pin: std(0xc9c9c9),
    body: std(0x2b2b2b), lead: std(0xd8d8d8), cap: std(0x3d6b8a),
    capBody: std(0x1c4a63),
  };
  const BAND_COLORS = {
    0: 0x2b2b2b, 1: 0x6b3e1e, 2: 0xc0392b, 3: 0xe67e22, 4: 0xf1c40f,
    5: 0x2e8b3d, 6: 0x2980b9, 7: 0x8e44ad, 8: 0x7f7f7f, 9: 0xffffff,
    gold: 0xd4af37,
  };
  function bandsFor(ohms) {
    let mult = 0, v = ohms;
    while (v >= 100) { v /= 10; mult++; }
    const d1 = Math.floor(v / 10), d2 = Math.round(v) % 10;
    return [BAND_COLORS[d1] || 0x2b2b2b, BAND_COLORS[d2] || 0x2b2b2b, BAND_COLORS[mult] || 0x2b2b2b, BAND_COLORS.gold];
  }

  // ---------------------------------------------------------------------
  // 2D: dibujo de esquemático + gráfica en canvas de tablero
  // ---------------------------------------------------------------------
  const board = document.createElement('canvas');
  board.width = 1024; board.height = 768;
  const bctx = board.getContext('2d');

  function line(ctx, x1, y1, x2, y2, w, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = w || 2;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function rr(ctx, x, y, w, h, r, fill, strokeCol) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.arcTo(x + w, y, x + w, y + h, r);
    ctx.arcTo(x + w, y + h, x, y + h, r);
    ctx.arcTo(x, y + h, x, y, r);
    ctx.arcTo(x, y, x + w, y, r);
    ctx.closePath();
    if (fill) { ctx.fillStyle = fill; ctx.fill(); }
    if (strokeCol) { ctx.strokeStyle = strokeCol; ctx.lineWidth = 1.5; ctx.stroke(); }
  }
  function groundGlyph(ctx, x, y) {
    line(ctx, x, y, x, y + 10, 2, '#cfd8dc');
    line(ctx, x - 12, y + 10, x + 12, y + 10, 2, '#cfd8dc');
    line(ctx, x - 7, y + 15, x + 7, y + 15, 2, '#cfd8dc');
    line(ctx, x - 3, y + 20, x + 3, y + 20, 2, '#cfd8dc');
  }
  function vResistorGlyph(ctx, x, y, h, col) {
    const w = 16;
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.strokeRect(x - w / 2, y, w, h);
  }
  function bjtGlyph(ctx, x, y, r, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    line(ctx, x - r * 0.55, y - r * 0.65, x - r * 0.55, y + r * 0.65, 3, col);
    line(ctx, x - r * 0.55, y - r * 0.2, x + r * 0.75, y - r * 0.75, 2, col);
    line(ctx, x - r * 0.55, y + r * 0.2, x + r * 0.75, y + r * 0.75, 2, col);
    // flecha de emisor
    const ex = x + r * 0.75, ey = y + r * 0.75;
    ctx.beginPath();
    ctx.moveTo(ex, ey);
    ctx.lineTo(ex - 8, ey - 3);
    ctx.lineTo(ex - 4, ey - 9);
    ctx.closePath();
    ctx.fillStyle = col || '#cfd8dc'; ctx.fill();
  }
  function capGlyph(ctx, x, y, vertical, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2.5;
    if (vertical) {
      line(ctx, x - 10, y, x + 10, y, 2.5, col);
      line(ctx, x - 10, y + 6, x + 10, y + 6, 2.5, col);
    } else {
      line(ctx, x, y - 10, x, y + 10, 2.5, col);
      line(ctx, x + 6, y - 10, x + 6, y + 10, 2.5, col);
    }
  }
  function acSourceGlyph(ctx, x, y, r, col) {
    ctx.strokeStyle = col || '#cfd8dc'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.beginPath();
    ctx.moveTo(x - r * 0.6, y);
    ctx.bezierCurveTo(x - r * 0.3, y - r * 0.6, x - r * 0.1, y - r * 0.6, x, y);
    ctx.bezierCurveTo(x + r * 0.2, y + r * 0.6, x + r * 0.4, y + r * 0.6, x + r * 0.6, y);
    ctx.stroke();
  }

  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const SRC_X = 70, CIN_X = 140, DIV_X = 210, BJT_X = 330, RC_X = 420, OUT_X = 500, CE_X = 210;
  const RAIL_Y = 60, GND_Y = 440, BJT_Y = 250;

  const HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id: id, x: x, y: y, w: w, h: h, label: label }); }

  function graphRange() {
    const dc = curSolveDC();
    const vmax = curVCC() * 1.08;
    const imax = Math.max(dc.ICsat, dc.IC) * 1.25 || 0.01;
    return { vmin: 0, vmax: vmax, imin: 0, imax: imax };
  }
  function xPix(v, rng) { return GX0 + (v - rng.vmin) / (rng.vmax - rng.vmin) * (GX1 - GX0); }
  function gyPix(i, rng) { return GY1 - (i - rng.imin) / (rng.imax - rng.imin) * (GY1 - GY0); }

  function curColor() {
    const dc = curSolveDC();
    if (dc.corte) return '#8a8a8a';
    if (dc.sat) return '#E8871E';
    return '#3fae3f';
  }

  function drawSchematic(ctx) {
    HIT.length = 0;
    ctx.clearRect(PX0 - 20, PY0 - 20, PX1 - PX0 + 60, PY1 - PY0 + 60);
    const col = state.hide ? '#cfd8dc' : curColor();
    const dev = curDev();

    // Fuente AC + Cin
    acSourceGlyph(ctx, SRC_X, BJT_Y, 18, '#4aa3ff');
    line(ctx, SRC_X, BJT_Y - 18, SRC_X, RAIL_Y);
    line(ctx, SRC_X, RAIL_Y, SRC_X, RAIL_Y);
    line(ctx, SRC_X, BJT_Y, SRC_X + 30, BJT_Y);
    capGlyph(ctx, CIN_X, BJT_Y, false, '#cfd8dc');
    line(ctx, SRC_X + 30, BJT_Y, CIN_X - 6, BJT_Y);
    line(ctx, CIN_X + 6, BJT_Y, DIV_X, BJT_Y);
    addHit('src', SRC_X - 20, BJT_Y - 30, 40, 60, 'Fuente AC vin');
    addHit('cin', CIN_X - 12, BJT_Y - 20, 24, 40, 'Capacitor de acoplo Cin');

    // Riel VCC
    line(ctx, DIV_X, RAIL_Y - 20, RC_X, RAIL_Y - 20);
    line(ctx, RC_X, RAIL_Y - 20, RC_X, RAIL_Y);
    groundGlyph(ctx, DIV_X, RAIL_Y - 32);
    ctx.fillStyle = '#cfd8dc'; ctx.font = '13px monospace';
    ctx.fillText('VCC ' + curVCC().toFixed(0) + 'V', RC_X + 8, RAIL_Y - 12);

    // Divisor R1/R2
    vResistorGlyph(ctx, DIV_X, RAIL_Y, 70, col);
    line(ctx, DIV_X, RAIL_Y - 20, DIV_X, RAIL_Y);
    line(ctx, DIV_X, RAIL_Y + 70, DIV_X, BJT_Y - 10);
    line(ctx, DIV_X, BJT_Y - 10, DIV_X + 40, BJT_Y - 10);
    addHit('r1', DIV_X - 14, RAIL_Y, 28, 70, 'R1 ' + fmtR(curR1()));
    vResistorGlyph(ctx, DIV_X, BJT_Y + 20, 70, col);
    line(ctx, DIV_X, BJT_Y - 10, DIV_X, BJT_Y + 20);
    line(ctx, DIV_X, BJT_Y + 90, DIV_X, GND_Y);
    groundGlyph(ctx, DIV_X, GND_Y);
    addHit('r2', DIV_X - 14, BJT_Y + 20, 28, 70, 'R2 ' + fmtR(curR2()));

    // BJT
    line(ctx, DIV_X + 40, BJT_Y - 10, BJT_X - 22, BJT_Y - 22);
    bjtGlyph(ctx, BJT_X, BJT_Y, 26, col);
    addHit('bjt', BJT_X - 30, BJT_Y - 30, 60, 60, dev.name + ' (Q1)');

    // Colector → RC → VCC
    line(ctx, BJT_X + 5, BJT_Y - 24, BJT_X + 5, RAIL_Y);
    line(ctx, BJT_X + 5, RAIL_Y, RC_X, RAIL_Y);
    vResistorGlyph(ctx, RC_X, RAIL_Y, 60, col);
    addHit('rc', RC_X - 14, RAIL_Y, 28, 60, 'RC ' + fmtR(curRC()));
    line(ctx, RC_X, RAIL_Y + 60, RC_X, BJT_Y);

    // Cout + RL
    line(ctx, RC_X, BJT_Y, RC_X + 30, BJT_Y);
    capGlyph(ctx, OUT_X, BJT_Y, false, '#cfd8dc');
    addHit('cout', OUT_X - 12, BJT_Y - 20, 24, 40, 'Capacitor de acoplo Cout');
    if (curRL() !== Infinity) {
      line(ctx, OUT_X + 6, BJT_Y, OUT_X + 40, BJT_Y);
      vResistorGlyph(ctx, OUT_X + 40, BJT_Y, 70, '#4aa3ff');
      line(ctx, OUT_X + 40, BJT_Y - 35, OUT_X + 40, RAIL_Y - 20);
      line(ctx, OUT_X + 40, RAIL_Y - 20, DIV_X, RAIL_Y - 20);
      line(ctx, OUT_X + 40, BJT_Y + 35, OUT_X + 40, GND_Y);
      groundGlyph(ctx, OUT_X + 40, GND_Y);
      addHit('rl', OUT_X + 26, BJT_Y, 28, 70, 'RL ' + fmtR(curRL()));
    } else {
      ctx.fillStyle = '#8a8a8a'; ctx.font = '12px monospace';
      ctx.fillText('RL: circuito abierto', OUT_X + 14, BJT_Y - 4);
    }

    // Emisor → RE (+ bypass Ce)
    line(ctx, BJT_X - 18, BJT_Y + 24, BJT_X - 18, BJT_Y + 40);
    vResistorGlyph(ctx, BJT_X - 18, BJT_Y + 40, 60, col);
    line(ctx, BJT_X - 18, BJT_Y + 100, BJT_X - 18, GND_Y);
    groundGlyph(ctx, BJT_X - 18, GND_Y);
    addHit('re', BJT_X - 32, BJT_Y + 40, 28, 60, 'RE ' + fmtR(curRE()));
    if (state.bypass) {
      capGlyph(ctx, BJT_X - 18 + 34, BJT_Y + 70, true, '#3fae3f');
      line(ctx, BJT_X - 18, BJT_Y + 70, BJT_X - 18 + 24, BJT_Y + 70);
      line(ctx, BJT_X - 18 + 44, BJT_Y + 70, BJT_X - 18, GND_Y);
      line(ctx, BJT_X - 18 + 44, BJT_Y + 70, BJT_X - 18 + 44, GND_Y);
      groundGlyph(ctx, BJT_X - 18 + 44, GND_Y);
      addHit('bypass', BJT_X - 18 + 20, BJT_Y + 55, 36, 30, 'Capacitor de bypass CE (' + (state.bypass ? 'activo' : 'inactivo') + ')');
    } else {
      addHit('bypass', BJT_X - 18 + 20, BJT_Y + 55, 36, 30, 'Bypass CE inactivo — click para activar');
    }

    if (!state.hide) {
      ctx.fillStyle = col; ctx.font = 'bold 13px monospace';
      const dc = curSolveDC();
      ctx.fillText(dc.corte ? 'CORTE' : (dc.sat ? 'SATURACIÓN' : 'ACTIVA'), BJT_X + 40, BJT_Y + 45);
    }
  }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 20, GY0 - 20, GX1 - GX0 + 60, GY1 - GY0 + 60);
    const rng = graphRange();
    line(ctx, GX0, GY1, GX1, GY1, 2, '#cfd8dc');
    line(ctx, GX0, GY0, GX0, GY1, 2, '#cfd8dc');
    ctx.fillStyle = '#8a8a8a'; ctx.font = '11px monospace';
    ctx.fillText('VCE (V)', GX1 - 50, GY1 + 16);
    ctx.fillText('IC', GX0 - 24, GY0 - 6);

    const dc = curSolveDC();
    const ac = curSolveAC();

    // Recta de carga DC
    ctx.strokeStyle = '#4aa3ff'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(xPix(0, rng), gyPix(dc.ICsat, rng));
    ctx.lineTo(xPix(curVCC(), rng), gyPix(0, rng));
    ctx.stroke();

    // Recta de carga AC (pivote en Q, extendida en ambas direcciones)
    if (ac.valid && state.mode !== 'predice') {
      const qx = xPix(dc.VCE, rng), qy = gyPix(dc.IC, rng);
      const dxV = ac.upSwing, dxI = ac.upSwing / ac.acLoadR;
      const x2 = xPix(dc.VCE + dxV, rng), y2 = gyPix(dc.IC - dxI, rng);
      const dnV = ac.downSwing, dnI = ac.downSwing / ac.acLoadR;
      const x1 = xPix(dc.VCE - dnV, rng), y1 = gyPix(dc.IC + dnI, rng);
      ctx.strokeStyle = '#e8871e'; ctx.lineWidth = 2; ctx.setLineDash([6, 4]);
      ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
      ctx.setLineDash([]);
    }

    // Punto Q
    const qpx = xPix(dc.VCE, rng), qpy = gyPix(dc.IC, rng);
    ctx.fillStyle = curColor();
    ctx.beginPath(); ctx.arc(qpx, qpy, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#cfd8dc'; ctx.font = '12px monospace';
    ctx.fillText('Q', qpx + 8, qpy - 8);

    // Insignia de estado del bypass
    ctx.fillStyle = state.bypass ? '#3fae3f' : '#8a8a8a';
    ctx.font = 'bold 12px monospace';
    ctx.fillText(state.bypass ? 'BYPASS: ON' : 'BYPASS: OFF', GX0, GY0 - 16);

    // Traza de barrido (modo Medición)
    if (state.mode === 'medicion' && state._sweepTrace) {
      ctx.strokeStyle = '#c9a8ff'; ctx.lineWidth = 2;
      ctx.beginPath();
      state._sweepTrace.forEach(function (p, i) {
        const px = xPix(p.vce, rng), py = gyPix(p.ic, rng);
        if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
      });
      ctx.stroke();
    }
  }

  function drawBoard() {
    if (!bctx) return;
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

  function toggleBypass() {
    state.bypass = !state.bypass;
    refreshAll();
    showToast('Bypass de RE: ' + (state.bypass ? 'activo' : 'inactivo'), 'info');
  }

  // ---------------------------------------------------------------------
  // Escena 3D
  // ---------------------------------------------------------------------
  const boardG = new THREE.Group();
  const boardTex = new THREE.CanvasTexture(board);
  boardTex.colorSpace = THREE.SRGBColorSpace;
  const boardMat = new THREE.MeshStandardMaterial({ map: boardTex, roughness: 0.55, metalness: 0.05 });
  const boardPlane = new THREE.Mesh(new THREE.PlaneGeometry(2.6, 1.95), boardMat);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(2.68, 2.03, 0.05), new THREE.MeshStandardMaterial(std(0x0c1a16)));
  boardFrame.position.z = -0.03;
  boardG.add(boardFrame, boardPlane);
  boardG.position.set(-1.05, 1.75, -0.85);
  boardG.rotation.y = 0.16;
  S.scene.add(boardG);

  const benchG = new THREE.Group();
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(4.2, 0.12, 2.8), new THREE.MeshStandardMaterial(std(0x2c2c2c)));
  mesa.position.set(0.7, -0.06, 1.1);
  benchG.add(mesa);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.4, 0.03, 2.0), new THREE.MeshStandardMaterial(MAT.board));
  pcb.position.set(0.7, 0.02, 1.1);
  benchG.add(pcb);
  S.scene.add(benchG);

  function leads(g) {
    const m = new THREE.MeshStandardMaterial(MAT.lead);
    const geo = new THREE.CylinderGeometry(0.012, 0.012, 0.16, 10);
    const l1 = new THREE.Mesh(geo, m); l1.position.set(-0.16, 0, 0); l1.rotation.z = Math.PI / 2;
    const l2 = new THREE.Mesh(geo, m); l2.position.set(0.16, 0, 0); l2.rotation.z = Math.PI / 2;
    g.add(l1, l2);
  }
  function makeResistor3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.26, 20), new THREE.MeshStandardMaterial(std(0xf0dca0)));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    leads(g);
    const bands = [];
    for (let i = 0; i < 4; i++) {
      const band = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.018, 20), new THREE.MeshStandardMaterial({ color: 0x333333 }));
      band.rotation.z = Math.PI / 2;
      band.position.x = -0.09 + i * 0.06;
      g.add(band);
      bands.push(band);
    }
    g.userData.body = body;
    g.userData.bands = bands;
    return g;
  }
  function paintBands(g, r) {
    const cols = bandsFor(r);
    g.userData.bands.forEach(function (band, i) { band.material.color.setHex(cols[i]); });
  }
  function makeBJT3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.06, 0.06, 0.18, 24), new THREE.MeshStandardMaterial(std(0x2b2b2b)));
    g.add(body);
    const legM = new THREE.MeshStandardMaterial(MAT.lead);
    [-0.03, 0, 0.03].forEach(function (dx) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.1, 8), legM);
      leg.position.set(dx, -0.14, 0);
      g.add(leg);
    });
    g.userData.body = body;
    return g;
  }
  function makeCap3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.16, 20), new THREE.MeshStandardMaterial(MAT.capBody));
    g.add(body);
    const m = new THREE.MeshStandardMaterial(MAT.lead);
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.09, 8), m);
    leg.position.set(0, -0.125, 0);
    g.add(leg);
    return g;
  }

  const r1G = makeResistor3D(); r1G.position.set(-0.7, 0.085, 1.0); benchG.add(r1G);
  const r2G = makeResistor3D(); r2G.position.set(-0.15, 0.085, 1.0); benchG.add(r2G);
  const bjtG = makeBJT3D(); bjtG.position.set(0.5, 0.15, 1.0); benchG.add(bjtG);
  const rcG = makeResistor3D(); rcG.position.set(1.2, 0.085, 1.0); benchG.add(rcG);
  const rlG = makeResistor3D(); rlG.position.set(1.9, 0.085, 1.0); benchG.add(rlG);
  const reG = makeResistor3D(); reG.position.set(0.0, 0.085, 1.75); benchG.add(reG);
  const ceG = makeCap3D(); ceG.position.set(0.5, 0.115, 1.75); benchG.add(ceG);

  function refreshBenchSel() {
    paintBands(r1G, curR1());
    paintBands(r2G, curR2());
    paintBands(rcG, curRC());
    paintBands(reG, curRE());
    if (curRL() !== Infinity) { rlG.visible = true; paintBands(rlG, curRL()); } else { rlG.visible = false; }
    ceG.visible = state.bypass;
    bjtG.userData.body.material.color.setHex(curDev().color);
  }

  function makeDisplayBox(w, h, dp, cw, ch) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), new THREE.MeshStandardMaterial(std(0x1a1a1a)));
    g.add(body);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    tex.colorSpace = THREE.SRGBColorSpace;
    const screen = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.86, h * 0.78), new THREE.MeshStandardMaterial({ map: tex, emissive: 0x0a1512, emissiveMap: tex, emissiveIntensity: 0.6, roughness: 0.4 }));
    screen.position.set(0, h * 0.04, dp / 2 + 0.001);
    g.add(screen);
    g.userData = { canvas: canvas, ctx: ctx, tex: tex };
    return g;
  }

  const fuenteBox = makeDisplayBox(0.6, 0.4, 0.13, 220, 140);
  fuenteBox.position.set(-0.3, 0.38, 0.35);
  benchG.add(fuenteBox);

  const medidorBox = makeDisplayBox(0.65, 0.45, 0.13, 240, 160);
  medidorBox.position.set(0.55, 0.4, 0.35);
  benchG.add(medidorBox);

  const scopeBox = makeDisplayBox(0.75, 0.5, 0.13, 280, 180);
  scopeBox.position.set(1.5, 0.42, 0.35);
  benchG.add(scopeBox);

  function drawFuenteScreen() {
    const c = fuenteBox.userData.ctx, W = fuenteBox.userData.canvas.width, H = fuenteBox.userData.canvas.height;
    c.fillStyle = '#06120a'; c.fillRect(0, 0, W, H);
    c.fillStyle = '#3fe089'; c.font = 'bold 20px monospace';
    c.fillText('VCC ' + curVCC().toFixed(0) + '.0 V', 14, 40);
    c.font = '13px monospace'; c.fillStyle = '#8fe0b8';
    c.fillText(curDev().name + '  β=' + state.beta, 14, 68);
    c.fillText('bypass: ' + (state.bypass ? 'ON' : 'OFF'), 14, 92);
    fuenteBox.userData.tex.needsUpdate = true;
  }

  function drawMedidorScreen() {
    const c = medidorBox.userData.ctx, W = medidorBox.userData.canvas.width, H = medidorBox.userData.canvas.height;
    c.fillStyle = '#0a0a12'; c.fillRect(0, 0, W, H);
    const dc = curSolveDC();
    const ac = curSolveAC();
    c.fillStyle = '#ffd54a'; c.font = 'bold 15px monospace';
    c.fillText('IC  ' + fmtI(dc.IC), 14, 26);
    c.fillText('VCE ' + fmtV(dc.VCE), 14, 48);
    c.fillStyle = '#4ad3ff'; c.font = '13px monospace';
    c.fillText('IB  ' + fmtI(dc.IB), 14, 70);
    c.fillText('VB  ' + fmtV(dc.VB), 14, 90);
    if (ac.valid) {
      c.fillStyle = '#c9a8ff'; c.font = 'bold 14px monospace';
      c.fillText('Av  ' + (ac.Av < 0 ? '-' : '') + fmtAv(ac.Av), 14, 118);
      c.font = '12px monospace';
      c.fillText('gm  ' + fmtS(ac.gm), 14, 138);
      c.fillText('rπ  ' + fmtR(ac.rpi), 14, 156);
    } else {
      c.fillStyle = '#8a8a8a'; c.fillText('BJT en corte', 14, 118);
    }
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
    const ac = curSolveAC();
    const pts = waveformPoints(ac, curVIN(), 64);
    const maxAbs = Math.max(1e-6, ac.valid ? Math.max(ac.upSwing, ac.downSwing) : 1);
    c.strokeStyle = ac.valid ? '#ffb347' : '#8a8a8a'; c.lineWidth = 2;
    c.beginPath();
    pts.forEach(function (v, i) {
      const x = (i / (pts.length - 1)) * W;
      const y = midY - (v / maxAbs) * (H / 2 - 6);
      if (i === 0) c.moveTo(x, y); else c.lineTo(x, y);
    });
    c.stroke();
    c.fillStyle = '#cfcfcf'; c.font = '11px monospace';
    c.fillText('vin/vout · osciloscopio', 8, H - 8);
    scopeBox.userData.tex.needsUpdate = true;
  }

  function refreshBenchDyn() {
    drawFuenteScreen();
    drawMedidorScreen();
    drawScopeScreen();
  }

  // ---------------------------------------------------------------------
  // HUD y panel
  // ---------------------------------------------------------------------
  document.getElementById('hud').innerHTML = `
  <div class="eyebrow">D2 · Semiconductores — Práctica d2-08</div>
  <h2>Amplificador BJT en Emisor Común: Ganancia de Pequeña Señal</h2>
  <p>Un BJT polarizado en la región activa puede amplificar una señal AC pequeña superpuesta a su punto de operación DC. Ajusta el divisor de polarización (R1/R2/RC/RE), activa o desactiva el capacitor de bypass sobre RE, y observa cómo cambia la ganancia Av — y cómo la señal de salida se recorta al chocar contra los límites de corte o saturación de la recta de carga AC.</p>
  <div class="formula">
    Punto Q (DC): IB=(VBB−VBE)/(RBB+(β+1)·RE) &nbsp;·&nbsp; IC=β·IB &nbsp;·&nbsp; VCE=VCC−IC·RC−IE·RE<br>
    Pequeña señal (hybrid-π): gm=ICQ/VT &nbsp;·&nbsp; rπ=β/gm<br>
    Con bypass: Av=−gm·(RC‖RL) &nbsp;·&nbsp; Sin bypass: Av=−β·(RC‖RL)/[rπ+(β+1)·RE]
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Señal de entrada (AC)</div>
    <div class="li"><span class="dot" style="background:#E8871E"></span>Señal de salida amplificada</div>
    <div class="li"><span class="dot" style="background:#FFB703"></span>Punto Q sobre la recta de carga</div>
    <div class="li"><span class="dot" style="background:#8a8a8a"></span>Recorte por corte/saturación</div>
  </div>
  <div class="fid"><span class="ft">CONTRATO DE FIDELIDAD</span>
  <span class="fl">SÍ:</span> Polarización DC por divisor (idéntica a d2-06): VBE=0.7V constante, β dentro del rango de hoja de datos, punto Q resuelto en forma cerrada. Modelo de pequeña señal hybrid-π: gm=ICQ/VT, rπ=β/gm, VT=25mV fijo. Ganancia con RE bypaseado: Av=−gm·(RC‖RL). Recta de carga DC vs. AC con pendientes distintas. BC547B: hFE solo como rango de hoja de datos (200–450), VCEsat corregido a 600mV máx @ IC=100mA/IB=5mA (condición de prueba real).<br>
  <span class="no">NO:</span> Av sin bypass (Av=−β·(RC‖RL)/[rπ+(β+1)·RE]) es una extensión propia por KVL incremental estándar, no viene explícita en la fuente. ro (Early) es opcional/modo avanzado: VA de 2N2222A es una estimación de orden de magnitud tomada de modelos SPICE de terceros, no una cifra de hoja de datos tabulada — BC547B/2N3904 no exponen esta opción. 2N2222A: VCEsat y límites vienen de síntesis por búsqueda web tras fallos de acceso a la hoja original. 2N3904: cifras de una réplica de distribuidor, hoja original con acceso bloqueado (HTTP 403).</div>
  <div class="src">Ref: ON Semiconductor BC546/D Rev.6 (BC547B) · STMicroelectronics 2N3904 Preliminary Data Feb-2003 · réplicas de hoja de datos para 2N2222A · Boylestad &amp; Nashelsky, "Electronic Devices and Circuit Theory". Nota: MEC-I.2/ETR-I.2 están pendientes de confirmación con el equipo curricular.</div>`;

  document.getElementById('panel').innerHTML = `
  <h4>Amplificador BJT · <span id="p_mode">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="btn-mode-explora">🔎 Explora</button>
    <button class="b" id="btn-mode-predice">🧠 Predicción</button>
    <button class="b" id="btn-mode-medicion">📏 Medición</button>
    <button class="b" id="btn-mode-reto">🎯 Reto</button>
  </div>
  <div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>

  <div style="font-size:12px;color:#8FB3AC;margin:6px 0 4px">Transistor</div>
  <select id="devSelect" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">
    <option value="bc547b">BC547B</option>
    <option value="n2n3904">2N3904</option>
    <option value="n2222a">2N2222A</option>
  </select>

  <div class="btns" style="margin-top:8px">
    <button class="b on" id="bypassToggle" style="flex:1 0 48%">Bypass RE</button>
    <button class="b" id="roToggle" style="flex:1 0 48%">ro (Early)</button>
  </div>

  <div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">
    <div>VCC</div><button class="b" id="vccDec" style="padding:2px 8px">−</button><span id="vVCC">—</span><button class="b" id="vccInc" style="padding:2px 8px">+</button>
    <div>R1</div><button class="b" id="r1Dec" style="padding:2px 8px">−</button><span id="vR1">—</span><button class="b" id="r1Inc" style="padding:2px 8px">+</button>
    <div>R2</div><button class="b" id="r2Dec" style="padding:2px 8px">−</button><span id="vR2">—</span><button class="b" id="r2Inc" style="padding:2px 8px">+</button>
    <div>RC</div><button class="b" id="rcDec" style="padding:2px 8px">−</button><span id="vRC">—</span><button class="b" id="rcInc" style="padding:2px 8px">+</button>
    <div>RE</div><button class="b" id="reDec" style="padding:2px 8px">−</button><span id="vRE">—</span><button class="b" id="reInc" style="padding:2px 8px">+</button>
    <div>RL</div><button class="b" id="rlDec" style="padding:2px 8px">−</button><span id="vRL">—</span><button class="b" id="rlInc" style="padding:2px 8px">+</button>
    <div>Vin</div><button class="b" id="vinDec" style="padding:2px 8px">−</button><span id="vVIN">—</span><button class="b" id="vinInc" style="padding:2px 8px">+</button>
  </div>

  <div id="telemetry" style="margin-top:10px;font-size:12px;color:#EAF4F1;line-height:1.5"></div>

  <div id="predWrap" style="display:none;margin-top:10px">
    <div id="predBox"></div>
    <div class="btns" style="margin-top:6px">
      <button class="b" id="predNew" style="flex:1 0 48%">Nueva pregunta</button>
      <button class="b" id="predCheck" style="flex:1 0 48%">Verificar</button>
    </div>
  </div>

  <div id="retoWrap" style="display:none;margin-top:10px">
    <div id="retoBox"></div>
    <div class="btns" style="margin-top:6px">
      <button class="b" id="retoNew" style="flex:1 0 48%">Nuevo reto</button>
      <button class="b" id="retoCheck" style="flex:1 0 48%">Verificar diseño</button>
    </div>
  </div>

  <div id="sweepWrap" style="display:none;margin-top:10px">
    <button class="b" id="sweepRun" style="width:100%">▶ Barrer Vin</button>
  </div>

  <div id="report" style="margin-top:10px;font-size:11px;color:#8FB3AC;line-height:1.5"></div>

  <div style="margin-top:14px;border-top:1px solid #1E3A34;padding-top:10px" id="quizBox"></div>

  <button class="b" id="autoTour" style="width:100%;margin-top:10px">🎬 Tour guiado</button>
  `;

  // ---------------------------------------------------------------------
  // Modos, misiones, lógica de interacción
  // ---------------------------------------------------------------------
  const MODES = ['explora', 'predice', 'medicion', 'reto'];
  const MODE_META = {
    explora: { label: 'Explora', icon: '🔎' },
    predice: { label: 'Predicción', icon: '🧠' },
    medicion: { label: 'Medición', icon: '📏' },
    reto: { label: 'Reto', icon: '🎯' },
  };
  const MISIONES = {
    explora: 'Ajusta los componentes y observa cómo cambian el punto Q y la ganancia Av.',
    predice: 'Predice el valor de Av o del punto Q antes de revelarlo.',
    medicion: 'Barre la amplitud de entrada y observa el recorte de la señal contra la recta de carga AC.',
    reto: 'Diseña un punto Q objetivo respetando el rango completo de β del dispositivo.',
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
    const bypassBtn = el('bypassToggle');
    if (bypassBtn) bypassBtn.classList.toggle('on', state.bypass);
    const roBtn = el('roToggle');
    if (roBtn) roBtn.classList.toggle('on', state.useRo);
    const devSel = el('devSelect');
    if (devSel && devSel.value !== state.devKey) devSel.value = state.devKey;
    const pm = el('p_mode');
    if (pm) pm.textContent = MODE_META[state.mode].label;
    const spans = {
      vVCC: curVCC().toFixed(0) + ' V', vVIN: fmtV(curVIN()), vR1: fmtR(curR1()), vR2: fmtR(curR2()),
      vRC: fmtR(curRC()), vRE: fmtR(curRE()), vRL: curRL() === Infinity ? '∞ (abierto)' : fmtR(curRL()),
    };
    Object.keys(spans).forEach(function (id) {
      const s = el(id);
      if (s) s.textContent = spans[id];
    });
  }

  function genPredice() {
    state._revealed = false;
    state.hide = true;
    state._predType = Math.random() < 0.5 ? 'Q' : 'Av';
    const box = el('predBox');
    if (box) {
      box.innerHTML = state._predType === 'Q'
        ? '<p>¿El BJT queda en <b>corte</b>, <b>activa</b> o <b>saturación</b>?</p>' +
          '<select id="predAnswerQ" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">' +
          '<option value="corte">Corte</option><option value="activa">Activa</option><option value="saturación">Saturación</option></select>'
        : '<p>¿Cuál es aproximadamente <b>|Av|</b> con el bypass ' + (state.bypass ? 'activo' : 'inactivo') + '?</p>' +
          '<input id="predAnswerAv" type="number" step="0.1" placeholder="V/V" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    }
    refreshAll();
  }

  function checkPredice(guess) {
    const dc = curSolveDC();
    const ac = curSolveAC();
    let ok = false, real = '';
    if (state._predType === 'Q') {
      const answer = dc.corte ? 'corte' : (dc.sat ? 'saturación' : 'activa');
      ok = guess === answer;
      real = answer;
    } else {
      const answer = ac.valid ? Math.abs(ac.Av) : 0;
      ok = Math.abs(guess - answer) / Math.max(answer, 1) < 0.25;
      real = fmtAv(answer);
    }
    state._revealed = true;
    state.hide = false;
    refreshAll();
    showToast(ok ? '¡Correcto! → ' + real : 'No exactamente. Valor real: ' + real, ok ? 'ok' : 'warn');
    return ok;
  }

  function newReto() {
    const dev = curDev();
    const betaLo = dev.hfeMin, betaHi = dev.hfeMax;
    const icTarget = (curVCC() / (2 * curRC())) * (0.6 + Math.random() * 0.3);
    state._reto = { icTarget: icTarget, betaLo: betaLo, betaHi: betaHi };
    const box = el('retoBox');
    if (box) {
      box.innerHTML = '<p>Diseña el divisor para lograr <b>ICQ ≈ ' + fmtI(icTarget) +
        '</b>, válido para <b>todo β</b> del ' + dev.name + ' (' + betaLo + '–' + betaHi + ').</p>';
    }
  }

  function checkReto() {
    const dev = curDev();
    const target = state._reto ? state._reto.icTarget : 0;
    let worstErr = 0, minSwing = Infinity;
    for (let b = dev.hfeMin; b <= dev.hfeMax; b += Math.max(1, Math.round((dev.hfeMax - dev.hfeMin) / 12))) {
      const dc = solveDC(dev, b, curVCC(), curR1(), curR2(), curRC(), curRE());
      const err = Math.abs(dc.IC - target) / Math.max(target, 1e-9);
      worstErr = Math.max(worstErr, err);
      const ac = solveAC(dev, b, dc, curRC(), curRE(), curRL(), state.bypass, state.useRo);
      if (ac.valid) minSwing = Math.min(minSwing, ac.maxSym);
    }
    const withinTolerance = worstErr < 0.2;
    const bonus = withinTolerance && minSwing > 0 && minSwing / curVCC() > 0.15;
    showToast(
      withinTolerance
        ? ('¡Diseño robusto en todo el rango de β!' + (bonus ? ' Bono: swing bien centrado.' : ''))
        : ('Error máximo en el rango de β: ' + (worstErr * 100).toFixed(0) + '% — ajusta el divisor.'),
      withinTolerance ? 'ok' : 'warn'
    );
    return withinTolerance;
  }

  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < VIN_VALS.length; i++) {
      state.iVIN = i;
      const dc = curSolveDC();
      const ac = curSolveAC();
      if (ac.valid) {
        state._sweepTrace.push({ vce: dc.VCE + ac.upSwing * 0.5, ic: dc.IC - (ac.upSwing * 0.5) / ac.acLoadR });
      }
      refreshAll();
      await sleep(350);
    }
    updateReport();
  }

  function updateTele() {
    const dc = curSolveDC();
    const ac = curSolveAC();
    const t = el('telemetry');
    if (!t) return;
    let html = '<div>IB ' + fmtI(dc.IB) + ' · IC ' + fmtI(dc.IC) + ' · VCE ' + fmtV(dc.VCE) + '</div>';
    if (ac.valid) {
      html += '<div>gm ' + fmtS(ac.gm) + ' · rπ ' + fmtR(ac.rpi) + (ac.ro ? ' · ro ' + fmtR(ac.ro) : '') + '</div>';
      html += '<div>Av ' + (ac.Av < 0 ? '-' : '') + fmtAv(ac.Av) + ' · swing± ' + fmtV(ac.maxSym) + '</div>';
    } else {
      html += '<div>BJT en corte — sin señal AC</div>';
    }
    t.innerHTML = html;
  }

  function updateReport() {
    const r = el('report');
    if (!r) return;
    const dc = curSolveDC();
    const ac = curSolveAC();
    r.innerHTML =
      '<table class="repTable"><tr><td>Estado</td><td>' + (dc.corte ? 'Corte' : (dc.sat ? 'Saturación' : 'Activa')) + '</td></tr>' +
      '<tr><td>ICQ</td><td>' + fmtI(dc.IC) + '</td></tr>' +
      '<tr><td>VCEQ</td><td>' + fmtV(dc.VCE) + '</td></tr>' +
      (ac.valid ? ('<tr><td>Av</td><td>' + (ac.Av < 0 ? '-' : '') + fmtAv(ac.Av) + '</td></tr>' +
        '<tr><td>Swing simétrico máx.</td><td>' + fmtV(ac.maxSym) + '</td></tr>') : '') +
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

  const QUIZ = [
    { q: '¿Qué hace el capacitor de bypass sobre RE?', a: ['Aumenta la ganancia AC al cortocircuitar RE en AC', 'Elimina la corriente DC de emisor', 'Sube el voltaje VCC'], correct: 0 },
    { q: '¿Por qué la recta de carga AC tiene distinta pendiente que la DC?', a: ['Porque el capacitor de acoplo cambia la resistencia vista en AC (p.ej. añade RL, quita RE si hay bypass)', 'Porque la corriente DC deja de fluir', 'Porque VCC cambia con la señal'], correct: 0 },
    { q: '¿Qué limita el swing hacia arriba (upSwing) de la señal de salida?', a: ['El corte del transistor (IC→0)', 'La saturación', 'El valor de VBE'], correct: 0 },
  ];
  let quizIdx = 0;
  function buildQuiz() { quizIdx = Math.floor(Math.random() * QUIZ.length); refreshQuestion(); }
  function refreshQuestion() {
    const box = el('quizBox');
    if (!box) return;
    const item = QUIZ[quizIdx];
    box.innerHTML = '<p>' + item.q + '</p>' + item.a.map(function (a, i) {
      return '<button class="quizOpt" data-i="' + i + '">' + a + '</button>';
    }).join('');
  }

  function actToast(id) {
    const labels = { r1: 'R1', r2: 'R2', rc: 'RC', re: 'RE', rl: 'RL', bjt: curDev().name, bypass: 'Cap. bypass CE', src: 'Fuente AC', cin: 'Cin', cout: 'Cout' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) {
    const map = { r1: r1G, r2: r2G, rc: rcG, re: reG, rl: rlG, bjt: bjtG, bypass: ceG };
    return map[name] || null;
  }
  function dispatch3D(id) {
    if (id === 'bypass') { toggleBypass(); return; }
    const actor = resolveActor(id);
    if (actor) {
      const orig = actor.scale.clone();
      actor.scale.multiplyScalar(1.15);
      setTimeout(function () { actor.scale.copy(orig); }, 220);
    }
  }

  const ACTOR_NAMES = ['r1', 'r2', 'rc', 're', 'rl', 'bjt', 'bypass'];
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

  async function runAuto() {
    setMode('explora');
    await sleep(600);
    state.iVCC = 1; state.iR1 = 2; state.iR2 = 2; refreshAll();
    await sleep(800);
    toggleBypass();
    await sleep(800);
    toggleBypass();
    await sleep(400);
    setMode('medicion');
    await runSweep();
  }

  // ---------------------------------------------------------------------
  // Wiring de eventos
  // ---------------------------------------------------------------------
  MODES.forEach(function (m) {
    const b = el('btn-mode-' + m);
    if (b) b.addEventListener('click', function () { setMode(m); });
  });
  function wireStep(id, getIdx, setIdx, max) {
    const inc = el(id + 'Inc'), dec = el(id + 'Dec');
    if (inc) inc.addEventListener('click', function () { setIdx(Math.min(max - 1, getIdx() + 1)); onChange(); });
    if (dec) dec.addEventListener('click', function () { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
  }
  wireStep('vcc', function () { return state.iVCC; }, function (v) { state.iVCC = v; }, VCC_VALS.length);
  wireStep('r1', function () { return state.iR1; }, function (v) { state.iR1 = v; }, R1_VALS.length);
  wireStep('r2', function () { return state.iR2; }, function (v) { state.iR2 = v; }, R2_VALS.length);
  wireStep('rc', function () { return state.iRC; }, function (v) { state.iRC = v; }, RC_VALS.length);
  wireStep('re', function () { return state.iRE; }, function (v) { state.iRE = v; }, RE_VALS.length);
  wireStep('rl', function () { return state.iRL; }, function (v) { state.iRL = v; }, RL_VALS.length);
  wireStep('vin', function () { return state.iVIN; }, function (v) { state.iVIN = v; }, VIN_VALS.length);

  const devSel = el('devSelect');
  if (devSel) devSel.addEventListener('change', function (e) {
    state.devKey = e.target.value;
    state.beta = betaDefault(curDev());
    onChange();
  });
  const bypassBtn = el('bypassToggle');
  if (bypassBtn) bypassBtn.addEventListener('click', toggleBypass);
  const roToggle = el('roToggle');
  if (roToggle) roToggle.addEventListener('click', function () { state.useRo = !state.useRo; onChange(); });

  const predBtn = el('predNew');
  if (predBtn) predBtn.addEventListener('click', genPredice);
  const predCheck = el('predCheck');
  if (predCheck) predCheck.addEventListener('click', function () {
    if (state._predType === 'Q') {
      const sel = el('predAnswerQ');
      checkPredice(sel ? sel.value : '');
    } else {
      const inp = el('predAnswerAv');
      checkPredice(inp ? parseFloat(inp.value) || 0 : 0);
    }
  });

  const retoBtn = el('retoNew');
  if (retoBtn) retoBtn.addEventListener('click', newReto);
  const retoCheck = el('retoCheck');
  if (retoCheck) retoCheck.addEventListener('click', checkReto);

  const sweepBtn = el('sweepRun');
  if (sweepBtn) sweepBtn.addEventListener('click', runSweep);

  const autoBtn = el('autoTour');
  if (autoBtn) autoBtn.addEventListener('click', runAuto);

  document.addEventListener('click', function (e) {
    if (e.target && e.target.classList && e.target.classList.contains('quizOpt')) {
      const i = parseInt(e.target.getAttribute('data-i'), 10);
      const ok = i === QUIZ[quizIdx].correct;
      showToast(ok ? '¡Correcto!' : 'Incorrecto, intenta otra.', ok ? 'ok' : 'warn');
      if (ok) buildQuiz();
    }
  });

  // ---------------------------------------------------------------------
  // Init
  // ---------------------------------------------------------------------
  setMode('explora');
  buildQuiz();
  refreshAll();
  S.start();

  window.__labDebug = {
    state: state,
    DEVS: DEVS,
    solveDC: solveDC,
    solveAC: solveAC,
    curSolveDC: curSolveDC,
    curSolveAC: curSolveAC,
    curDev: curDev,
    setMode: setMode,
    toggleBypass: toggleBypass,
    genPredice: genPredice,
    checkPredice: checkPredice,
    newReto: newReto,
    checkReto: checkReto,
    runSweep: runSweep,
    setDevice: function (k) { state.devKey = k; state.beta = betaDefault(curDev()); onChange(); },
    setIdx: function (which, i) {
      if (which === 'vcc') state.iVCC = i;
      else if (which === 'r1') state.iR1 = i;
      else if (which === 'r2') state.iR2 = i;
      else if (which === 'rc') state.iRC = i;
      else if (which === 're') state.iRE = i;
      else if (which === 'rl') state.iRL = i;
      else if (which === 'vin') state.iVIN = i;
      onChange();
    },
    waveformPoints: waveformPoints,
    refreshAll: refreshAll,
  };
})();
