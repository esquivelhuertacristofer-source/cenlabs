/*
 * SÍ verificado:
 * - Factor de galga (Gauge Factor) GF=(ΔR/R)/ε para galgas de constantano ≈2.0–2.1
 *   (Vishay Precision Group, "Strain Gage Data Book": constantano=2.05; Omega Engineering,
 *   nota técnica E-94: "nominally 2" para galgas de constantano/Ni-Cr). Este simulador usa
 *   GF=2.0 como valor representativo fijo.
 * - Cuarto de puente (1 brazo activo), fórmula EXACTA (National Instruments, AN078,
 *   "Measuring Strain with Strain Gages"): Vout/Vex=(GF·ε/4)/(1+GF·ε/2). Esta fórmula
 *   incluye el término no lineal (1+GF·ε/2) en el denominador; el error de la aproximación
 *   lineal Vout/Vex≈GF·ε/4 es <0.1% para deformaciones por debajo de ~5000 µε.
 * - Medio puente (2 brazos activos adyacentes, signo opuesto — viga en flexión), fórmula
 *   EXACTA (NI AN078): Vout/Vex=GF·ε/2. A diferencia del cuarto de puente, esta configuración
 *   es EXACTAMENTE lineal (los términos no lineales se cancelan entre los dos brazos activos).
 * - Puente completo (4 brazos activos, signo alternado), fórmula EXACTA (NI AN078):
 *   Vout/Vex=GF·ε. También exactamente lineal, con 4× la sensibilidad del cuarto de puente.
 * - Voltaje de excitación del puente Vex, rango típico 2.5 V–10 V (NI AN078); el límite
 *   superior real lo impone el autocalentamiento de la galga (no modelado aquí).
 * - Amplificador de instrumentación de referencia: Texas Instruments INA128 (familia de hoja
 *   de datos SBOS051; compatible en pines/ganancia con el AD620). Ganancia G=1+50 kΩ/R_G,
 *   rango G=1 a 10 000 V/V.
 * - Tabla de CMRR del INA128 (grado estándar), mínimo/típico en dB, verificada por dos vías
 *   independientes de extracción de la hoja de datos SBOS051:
 *     G=1    → mín 80 dB  / típ 86 dB
 *     G=10   → mín 100 dB / típ 106 dB
 *     G=100  → mín 120 dB / típ 125 dB
 *     G=1000 → mín 120 dB / típ 130 dB
 * - CMRR(dB)=20·log10(Adif/Acm) — definición estándar.
 * - Voltaje de modo común del puente Vcm≈Vex/2 para un puente balanceado (Texas Instruments,
 *   nota de circuito de ingeniería analógica sboa247/tidub00).
 * - Error de salida inducido por CMRR: error referido a la entrada E_I=Vcm/CMRR_lineal
 *   (CMRR_lineal=10^(CMRR_dB/20)); error referido a la salida ≈G·E_I. Este simulador usa el
 *   CMRR MÍNIMO (peor caso garantizado por hoja de datos) para el error "peor caso" y el CMRR
 *   TÍPICO para el error "típico".
 *
 * NO modelado:
 * - Compensación de resistencia de cables (conexión a 3 hilos) — práctica estándar para
 *   galgas remotas, no simulada aquí (esta práctica asume conexión de 2 hilos ideal, sin
 *   resistencia de cableado).
 * - Autocalentamiento de la galga como límite real de Vex.
 * - Offset de voltaje, deriva térmica y error de ganancia propios del INA128 (solo se modela
 *   el error inducido por CMRR).
 * - Ruido del amplificador y del puente.
 * - Límite de swing de salida del INA128 según el riel de alimentación: este simulador NO
 *   recorta VoutIdeal aunque supere el rango de salida real del amplificador para la
 *   alimentación usada — consulta siempre la hoja de datos para VS+/VS− y el swing de salida.
 * - Tolerancia real de fabricación de las galgas y de los resistores de compleción del puente.
 * - Para el interpolador de CMRR: la hoja de datos solo publica G=1,10,100,1000; los valores
 *   intermedios de G se obtienen por interpolación log-lineal entre esos puntos (aproximación
 *   razonable, consistente con la curva "CMRR vs Gain" mostrada gráficamente en la hoja de
 *   datos, pero no un dato publicado punto a punto).
 *
 * Nota de rigor: GF=2.0 y R_galga=350 Ω son valores representativos de una galga de
 * constantano típica — consulta siempre la hoja de datos del fabricante de la galga real.
 * Ningún valor numérico específico de fabricante se presenta como universal.
 *
 * Fuentes:
 * - National Instruments, AN078 — "Measuring Strain with Strain Gages"
 * - Vishay Precision Group — "Strain Gage Data Book", sección Gauge Factor
 * - Omega Engineering, nota técnica E-94 — "The Strain Gage"
 * - Texas Instruments, INA128/INA129 datasheet (SBOS051)
 * - Texas Instruments, sboa247/tidub00 — "Bridge Measurement Circuit" analog engineer's note
 */
(function () {
  'use strict';

  const mount = document.getElementById('stage');
  const S = createStage(mount, {
    cam: [1.7, 1.35, 2.1],
    target: [0, 0.12, 0],
    bgTop: '#0b1220',
    bgBot: '#050810',
    bloom: 0.35,
    minD: 1.1,
    maxD: 5.5,
  });
  const synth = makeSynth();

  function el(id) { return document.getElementById(id); }
  let toastTimer = null;
  function showToast(msg, kind) {
    const t = el('toast');
    if (!t) return;
    t.textContent = msg;
    t.className = 'toast show' + (kind ? ' ' + kind : '');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => { t.className = 'toast'; }, 3200);
  }
  function sleep(ms) { return new Promise((r) => setTimeout(r, ms)); }

  // ---------- Dispositivos ----------
  const DEVS = {
    ina128: { name: 'TI INA128 (amp. de instrumentación, 3 op-amps)', gainMin: 1, gainMax: 10000, note: 'G=1+50kΩ/R_G', color: 0x8fe3d0 },
    gauge: { name: 'Galga extensométrica (constantano)', GF: 2.0, R: 350, note: 'GF≈2.0–2.1 típico', color: 0xb87333 },
  };
  const GF = DEVS.gauge.GF;
  const R_GAUGE = DEVS.gauge.R;

  // ---------- Física ----------
  const CMRR_ANCHORS = [
    { g: 1, min: 80, typ: 86 },
    { g: 10, min: 100, typ: 106 },
    { g: 100, min: 120, typ: 125 },
    { g: 1000, min: 120, typ: 130 },
  ];
  function cmrrDb(G) {
    const g = Math.max(1, Math.min(1000, G));
    const lg = Math.log10(g);
    for (let i = 0; i < CMRR_ANCHORS.length - 1; i++) {
      const a = CMRR_ANCHORS[i], b = CMRR_ANCHORS[i + 1];
      if (g >= a.g && g <= b.g) {
        const la = Math.log10(a.g), lb = Math.log10(b.g);
        const t = lb === la ? 0 : (lg - la) / (lb - la);
        return { min: a.min + (b.min - a.min) * t, typ: a.typ + (b.typ - a.typ) * t };
      }
    }
    const last = CMRR_ANCHORS[CMRR_ANCHORS.length - 1];
    return { min: last.min, typ: last.typ };
  }

  function bridgeOutput(bridgeType, Vex, eps, gf) {
    if (bridgeType === 'quarter') return Vex * (gf * eps / 4) / (1 + gf * eps / 2);
    if (bridgeType === 'half') return Vex * gf * eps / 2;
    return Vex * gf * eps; // full
  }

  function activeArms(bridgeType) {
    if (bridgeType === 'quarter') return 1;
    if (bridgeType === 'half') return 2;
    return 4;
  }

  function solveInstrumentacion(Vex, epsilon_ue, bridgeType, gf, G) {
    const eps = epsilon_ue * 1e-6;
    const Vbridge = bridgeOutput(bridgeType, Vex, eps, gf);
    const VoutIdeal = G * Vbridge;
    const Vcm = Vex / 2;
    const cmrr = cmrrDb(G);
    const cmrrLinMin = Math.pow(10, cmrr.min / 20);
    const cmrrLinTyp = Math.pow(10, cmrr.typ / 20);
    const errInMin = Vcm / cmrrLinMin;
    const errInTyp = Vcm / cmrrLinTyp;
    const errOutMin = G * errInMin;
    const errOutTyp = G * errInTyp;
    const denom = Math.abs(VoutIdeal);
    const errPctMin = denom > 1e-12 ? (errOutMin / denom) * 100 : Infinity;
    const errPctTyp = denom > 1e-12 ? (errOutTyp / denom) * 100 : Infinity;
    const RG = G > 1 ? 50000 / (G - 1) : Infinity;
    return {
      Vex, epsilon_ue, bridgeType, GF: gf, G, eps,
      Vbridge, VoutIdeal, Vcm,
      cmrrMinDb: cmrr.min, cmrrTypDb: cmrr.typ,
      errInMin, errInTyp, errOutMin, errOutTyp, errPctMin, errPctTyp,
      RG, arms: activeArms(bridgeType),
    };
  }

  function classifyError(res) {
    const p = res.errPctMin;
    if (!isFinite(p)) return { key: 'na', label: 'sin señal', color: '#64748b' };
    if (p < 0.5) return { key: 'bajo', label: 'error bajo', color: '#34d399' };
    if (p <= 2) return { key: 'moderado', label: 'error moderado', color: '#f59e0b' };
    return { key: 'alto', label: 'error alto', color: '#ef4444' };
  }

  // ---------- Formato ----------
  function fmtVAuto(v) {
    const av = Math.abs(v);
    if (av >= 1) return v.toFixed(3) + ' V';
    if (av >= 1e-3) return (v * 1e3).toFixed(3) + ' mV';
    if (av >= 1e-6) return (v * 1e6).toFixed(2) + ' µV';
    return '0 V';
  }
  function fmtMv(v) { return (v * 1e3).toFixed(4) + ' mV'; }
  function fmtEps(ue) { return (ue > 0 ? '+' : '') + ue.toFixed(0) + ' µε'; }
  function fmtG(g) { return g.toFixed(0) + '×'; }
  function fmtDb(d) { return d.toFixed(1) + ' dB'; }
  function fmtPct(p) { return isFinite(p) ? p.toFixed(3) + ' %' : '—'; }
  function fmtRG(rg) {
    if (!isFinite(rg)) return '∞ (circuito abierto)';
    if (rg >= 1000) return (rg / 1000).toFixed(2) + ' kΩ';
    return rg.toFixed(0) + ' Ω';
  }
  function fmtVex(v) { return v.toFixed(1) + ' V'; }

  // ---------- Estado ----------
  const VEX_VALS = [2.5, 3.3, 5, 6, 8, 10];
  const EPS_VALS = [-2000, -1000, -500, -100, 100, 500, 1000, 2000];
  const BRIDGE_TYPES = [
    { key: 'quarter', label: 'Cuarto de puente', short: '¼ puente (1 galga)' },
    { key: 'half', label: 'Medio puente', short: '½ puente (2 galgas)' },
    { key: 'full', label: 'Puente completo', short: 'Completo (4 galgas)' },
  ];
  const GAIN_VALS = [1, 10, 50, 100, 200, 500, 1000];

  const state = {
    iVEX: 2, iEPS: 6, iBridge: 0, iG: 3,
    mode: 'explora', hide: false,
    _revealed: false, _sweepTrace: null, _predType: null, _reto: null,
  };

  function curVex() { return VEX_VALS[state.iVEX]; }
  function curEps() { return EPS_VALS[state.iEPS]; }
  function curBridge() { return BRIDGE_TYPES[state.iBridge].key; }
  function curG() { return GAIN_VALS[state.iG]; }
  function curSolve() { return solveInstrumentacion(curVex(), curEps(), curBridge(), GF, curG()); }

  // ---------- Materiales y meshes 3D ----------
  const MAT = {
    lead: { color: 0xcfd6de, roughness: 0.35, metalness: 0.8 },
    pcb: { color: 0x0e3b2e, roughness: 0.85, metalness: 0.05 },
    ic: { color: 0x1c1f24, roughness: 0.5, metalness: 0.2 },
  };
  function std(o) { return new THREE.MeshStandardMaterial(o); }

  function makeDIP3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.32, 0.09, 0.16), std(MAT.ic));
    g.add(body);
    const notch = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.1, 12), std({ color: 0x05070a, roughness: 0.6 }));
    notch.rotation.z = Math.PI / 2;
    notch.position.set(-0.15, 0.046, 0);
    g.add(notch);
    for (let side = -1; side <= 1; side += 2) {
      for (let i = 0; i < 4; i++) {
        const leg = new THREE.Mesh(new THREE.BoxGeometry(0.018, 0.014, 0.02), std(MAT.lead));
        leg.position.set(-0.12 + i * 0.08, -0.05, side * 0.09);
        g.add(leg);
      }
    }
    g.userData.body = body;
    return g;
  }

  function makeResistor3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.035, 0.035, 0.14, 16), std({ color: 0xc9a46b, roughness: 0.5, metalness: 0.15 }));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    for (const s of [-1, 1]) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.08, 8), std(MAT.lead));
      leg.rotation.z = Math.PI / 2;
      leg.position.x = s * 0.11;
      g.add(leg);
    }
    g.userData.body = body;
    return g;
  }

  function makeBeamGauge3D() {
    const g = new THREE.Group();
    const beam = new THREE.Mesh(new THREE.BoxGeometry(0.9, 0.05, 0.22), std({ color: 0xb8bec7, roughness: 0.5, metalness: 0.6 }));
    g.add(beam);
    const gauge = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.1), std({ color: 0xb87333, roughness: 0.4, metalness: 0.3 }));
    gauge.position.set(0.05, 0.031, 0);
    g.add(gauge);
    const gauge2 = new THREE.Mesh(new THREE.BoxGeometry(0.14, 0.012, 0.1), std({ color: 0x64748b, roughness: 0.4, metalness: 0.3 }));
    gauge2.position.set(-0.3, 0.031, 0);
    g.add(gauge2);
    g.userData = { beam, gauge, gauge2 };
    return g;
  }

  function makeDisplayBox(w, h, dp, cw, ch) {
    const g = new THREE.Group();
    const frame = new THREE.Mesh(new THREE.BoxGeometry(w, h, dp), std({ color: 0x11151b, roughness: 0.6, metalness: 0.3 }));
    g.add(frame);
    const canvas = document.createElement('canvas');
    canvas.width = cw; canvas.height = ch;
    const ctx = canvas.getContext('2d');
    const tex = new THREE.CanvasTexture(canvas);
    const screen = new THREE.Mesh(
      new THREE.PlaneGeometry(w * 0.88, h * 0.82),
      new THREE.MeshBasicMaterial({ map: tex })
    );
    screen.position.z = dp / 2 + 0.001;
    g.add(screen);
    g.userData = { canvas, ctx, tex, screen, frame };
    return g;
  }

  // ---------- Glifos 2D (esquemático) ----------
  function line(ctx, x1, y1, x2, y2, w, color) {
    ctx.strokeStyle = color; ctx.lineWidth = w;
    ctx.beginPath(); ctx.moveTo(x1, y1); ctx.lineTo(x2, y2); ctx.stroke();
  }
  function groundGlyph(ctx, x, y) {
    ctx.strokeStyle = '#94a3b8'; ctx.lineWidth = 2;
    line(ctx, x, y, x, y + 10, 2, '#94a3b8');
    for (let i = 0; i < 3; i++) {
      const w = 16 - i * 5;
      line(ctx, x - w / 2, y + 10 + i * 6, x + w / 2, y + 10 + i * 6, 2, '#94a3b8');
    }
  }
  function dcSourceGlyph(ctx, x, y) {
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 20, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = '#f59e0b'; ctx.font = '13px monospace'; ctx.textAlign = 'center';
    ctx.fillText('Vex', x, y + 4);
  }
  function opampTriGlyph(ctx, x, y, label, color) {
    ctx.strokeStyle = color || '#8fe3d0'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 22, y - 20); ctx.lineTo(x - 22, y + 20); ctx.lineTo(x + 22, y); ctx.closePath();
    ctx.stroke();
    ctx.fillStyle = color || '#8fe3d0'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText(label || '', x - 4, y + 4);
  }

  let HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id, x, y, w, h, label }); }

  function armGlyph(ctx, id, x1, y1, x2, y2, active, labelTop) {
    const mx = (x1 + x2) / 2, my = (y1 + y2) / 2;
    const ang = Math.atan2(y2 - y1, x2 - x1);
    const color = active ? '#f59e0b' : '#64748b';
    ctx.save();
    ctx.translate(mx, my); ctx.rotate(ang);
    ctx.strokeStyle = color; ctx.fillStyle = active ? 'rgba(245,158,11,0.12)' : 'rgba(100,116,139,0.08)';
    ctx.lineWidth = 2;
    ctx.fillRect(-20, -8, 40, 16);
    ctx.strokeRect(-20, -8, 40, 16);
    ctx.restore();
    const dx = Math.cos(ang) * 20, dy = Math.sin(ang) * 20;
    line(ctx, x1, y1, mx - dx, my - dy, 2, color);
    line(ctx, mx + dx, my + dy, x2, y2, 2, color);
    ctx.fillStyle = color; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText(labelTop, mx, my - 14);
    addHit(id, Math.min(x1, x2) - 10, Math.min(y1, y2) - 10, Math.abs(x2 - x1) + 20, Math.abs(y2 - y1) + 20, id);
  }

  // ---------- Esquemático ----------
  const PX0 = 30, PY0 = 30, PX1 = 610, PY1 = 470;
  const GX0 = 650, GX1 = 1000, GY0 = 30, GY1 = 470;

  function drawSchematic(ctx) {
    HIT = [];
    ctx.clearRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#0b1220'; ctx.fillRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 14px monospace'; ctx.textAlign = 'left';
    ctx.fillText('Puente de Wheatstone + INA128', PX0, PY0 + 14);

    const bt = curBridge();
    const activeCount = activeArms(bt);
    const active = { r1: false, r2: false, r3: false, r4: false };
    if (bt === 'quarter') active.r4 = true;
    else if (bt === 'half') { active.r1 = true; active.r4 = true; }
    else { active.r1 = true; active.r2 = true; active.r3 = true; active.r4 = true; }

    const cx = 230, cy = 250, half = 120;
    const top = { x: cx, y: cy - half };
    const right = { x: cx + half, y: cy };
    const bottom = { x: cx, y: cy + half };
    const left = { x: cx - half, y: cy };

    dcSourceGlyph(ctx, cx, top.y - 45);
    line(ctx, cx, top.y - 25, top.x, top.y, 2, '#f59e0b');
    groundGlyph(ctx, cx, bottom.y + 14);
    line(ctx, bottom.x, bottom.y, cx, bottom.y + 14, 2, '#94a3b8');
    addHit('vex', cx - 22, top.y - 68, 44, 44, 'vex');

    armGlyph(ctx, 'r1', top.x, top.y, left.x, left.y, active.r1, active.r1 ? 'R1 galga' : 'R1');
    armGlyph(ctx, 'r2', top.x, top.y, right.x, right.y, active.r2, active.r2 ? 'R2 galga' : 'R2');
    armGlyph(ctx, 'r3', right.x, right.y, bottom.x, bottom.y, active.r3, active.r3 ? 'R3 galga' : 'R3');
    armGlyph(ctx, 'r4', left.x, left.y, bottom.x, bottom.y, active.r4, active.r4 ? 'R4 galga' : 'R4');

    ctx.fillStyle = '#94a3b8'; ctx.font = '11px monospace'; ctx.textAlign = 'center';
    ctx.fillText('V+', top.x, top.y - 8);
    ctx.fillText('V−', left.x - 14, left.y + 4);
    ctx.fillText('V+', right.x + 14, right.y + 4);
    ctx.fillText('GND', bottom.x, bottom.y + 26);

    const inaX = 440, inaY = 250;
    line(ctx, left.x, left.y, left.x, left.y - 60, 2, '#38bdf8');
    line(ctx, left.x, left.y - 60, inaX - 40, inaY - 24, 2, '#38bdf8');
    line(ctx, right.x, right.y, right.x, right.y + 60, 2, '#38bdf8');
    line(ctx, right.x, right.y + 60, inaX - 40, inaY + 24, 2, '#38bdf8');

    opampTriGlyph(ctx, inaX, inaY, 'INA128', '#8fe3d0');
    addHit('ina', inaX - 26, inaY - 26, 52, 52, 'ina');

    const rgX = inaX, rgY = inaY - 55;
    ctx.save();
    ctx.strokeStyle = '#c9a46b'; ctx.lineWidth = 2;
    ctx.strokeRect(rgX - 22, rgY - 8, 44, 16);
    ctx.fillStyle = '#c9a46b'; ctx.font = '10px monospace'; ctx.textAlign = 'center';
    ctx.fillText('R_G', rgX, rgY - 12);
    ctx.restore();
    line(ctx, inaX - 12, inaY - 12, rgX - 22, rgY, 2, '#c9a46b');
    line(ctx, rgX + 22, rgY, inaX + 12, inaY - 12, 2, '#c9a46b');
    addHit('rg', rgX - 24, rgY - 14, 48, 24, 'rg');

    line(ctx, inaX + 22, inaY, inaX + 70, inaY, 2, '#38bdf8');
    ctx.beginPath(); ctx.arc(inaX + 84, inaY, 8, 0, Math.PI * 2); ctx.strokeStyle = '#38bdf8'; ctx.lineWidth = 2; ctx.stroke();
    ctx.fillStyle = '#38bdf8'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('Vout', inaX + 96, inaY + 4);
    addHit('out', inaX + 60, inaY - 16, 46, 32, 'out');

    ctx.fillStyle = '#64748b'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('galgas activas: ' + activeCount + '/4  (' + BRIDGE_TYPES.find((b) => b.key === bt).short + ')', PX0, PY1 - 8);
  }

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1220'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#e2e8f0'; ctx.font = 'bold 13px monospace'; ctx.textAlign = 'left';
    ctx.fillText('CMRR vs. ganancia (INA128, hoja de datos)', GX0, GY0 + 14);

    const plotX0 = GX0 + 40, plotX1 = GX1 - 10, plotY0 = GY0 + 30, plotY1 = GY0 + 210;
    const dbMin = 70, dbMax = 135;
    function gx(g) { return plotX0 + (Math.log10(Math.max(1, g)) / 3) * (plotX1 - plotX0); }
    function gy(db) { return plotY1 - ((db - dbMin) / (dbMax - dbMin)) * (plotY1 - plotY0); }

    ctx.strokeStyle = '#334155'; ctx.lineWidth = 1;
    ctx.strokeRect(plotX0, plotY0, plotX1 - plotX0, plotY1 - plotY0);
    ctx.fillStyle = '#64748b'; ctx.font = '9px monospace'; ctx.textAlign = 'center';
    [1, 10, 100, 1000].forEach((g) => { ctx.fillText(String(g), gx(g), plotY1 + 12); });

    function plotCurve(field, color) {
      ctx.strokeStyle = color; ctx.lineWidth = 2; ctx.beginPath();
      for (let i = 0; i <= 60; i++) {
        const lg = (i / 60) * 3;
        const g = Math.pow(10, lg);
        const c = cmrrDb(g);
        const x = gx(g), y = gy(c[field]);
        if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    plotCurve('min', '#ef4444');
    plotCurve('typ', '#34d399');

    const G = curG();
    const c = cmrrDb(G);
    const xg = gx(G);
    ctx.strokeStyle = '#f59e0b'; ctx.lineWidth = 1; ctx.setLineDash([4, 3]);
    line(ctx, xg, plotY0, xg, plotY1, 1, '#f59e0b');
    ctx.setLineDash([]);
    [['min', c.min, '#ef4444'], ['typ', c.typ, '#34d399']].forEach(([, v, color]) => {
      ctx.beginPath(); ctx.arc(xg, gy(v), 4, 0, Math.PI * 2); ctx.fillStyle = color; ctx.fill();
    });
    ctx.fillStyle = '#94a3b8'; ctx.font = '10px monospace'; ctx.textAlign = 'left';
    ctx.fillText('rojo=mín  verde=típ  ámbar=G actual', plotX0, plotY0 - 4);

    const res = curSolve();
    const barY = plotY1 + 40, barH = 20, barX0 = plotX0, barW = plotX1 - plotX0;
    const cls = classifyError(res);
    const pctClamped = isFinite(res.errPctMin) ? Math.min(res.errPctMin, 5) : 5;
    ctx.strokeStyle = '#334155'; ctx.strokeRect(barX0, barY, barW, barH);
    ctx.fillStyle = cls.color;
    ctx.fillRect(barX0, barY, barW * (pctClamped / 5), barH);
    ctx.fillStyle = '#e2e8f0'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    ctx.fillText('error CMRR (peor caso) / señal: ' + fmtPct(res.errPctMin) + '   [' + cls.label + ']', barX0, barY - 6);
    ctx.fillStyle = '#64748b'; ctx.font = '9px monospace';
    ctx.fillText('escala 0–5%', barX0, barY + barH + 12);

    const ty0 = barY + 46;
    ctx.fillStyle = '#e2e8f0'; ctx.font = '11px monospace'; ctx.textAlign = 'left';
    const lines = [
      'Vbridge = ' + fmtVAuto(res.Vbridge),
      'VoutIdeal = G·Vbridge = ' + fmtVAuto(res.VoutIdeal),
      'Vcm = Vex/2 = ' + fmtVAuto(res.Vcm),
      'CMRR(G) = ' + fmtDb(res.cmrrMinDb) + ' mín / ' + fmtDb(res.cmrrTypDb) + ' típ',
      'error salida (peor caso) = ' + fmtVAuto(res.errOutMin),
      'error salida (típico) = ' + fmtVAuto(res.errOutTyp),
    ];
    lines.forEach((t, i) => ctx.fillText(t, GX0, ty0 + i * 16));
    if (Math.abs(res.VoutIdeal) > 12) {
      ctx.fillStyle = '#f59e0b'; ctx.font = '10px monospace';
      ctx.fillText('⚠ VoutIdeal supera el rango de salida realista del INA128 (no se modela el recorte)', GX0, ty0 + lines.length * 16 + 4);
    }
  }

  function drawBoard() { drawSchematic(bctx); drawGraph(bctx); }

  function boardClick(u, v) {
    const px = PX0 + u * (1024 - 0);
    const py = v * 768;
    for (const h of HIT) {
      if (px >= h.x && px <= h.x + h.w && py >= h.y && py <= h.y + h.h) {
        actToast(h.id);
        return;
      }
    }
  }

  // ---------- Escena 3D ----------
  const boardCanvas = document.createElement('canvas');
  boardCanvas.width = 1024; boardCanvas.height = 768;
  const bctx = boardCanvas.getContext('2d');
  const boardTex = new THREE.CanvasTexture(boardCanvas);
  const boardMat = new THREE.MeshBasicMaterial({ map: boardTex });
  const boardPlane = new THREE.Mesh(new THREE.PlaneGeometry(1.7, 1.28), boardMat);
  const boardFrame = new THREE.Mesh(new THREE.BoxGeometry(1.76, 1.34, 0.03), std({ color: 0x1c2430, roughness: 0.6 }));
  boardFrame.position.z = -0.02;
  const boardG = new THREE.Group();
  boardG.add(boardFrame, boardPlane);
  boardG.position.set(0, 0.62, -0.55);
  S.scene.add(boardG);

  const benchG = new THREE.Group();
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(1.9, 0.05, 0.9), std({ color: 0x1a2230, roughness: 0.8 }));
  mesa.position.y = -0.02;
  benchG.add(mesa);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(0.7, 0.015, 0.5), std(MAT.pcb));
  pcb.position.set(0.3, 0.008, 0.1);
  benchG.add(pcb);

  const beamGaugeG = makeBeamGauge3D();
  beamGaugeG.position.set(-0.55, 0.05, 0);
  benchG.add(beamGaugeG);

  const icG = makeDIP3D();
  icG.position.set(0.15, 0.06, 0.1);
  benchG.add(icG);

  const rgG = makeResistor3D();
  rgG.position.set(0.42, 0.06, -0.05);
  benchG.add(rgG);

  const bridgeResG = new THREE.Group();
  for (let i = 0; i < 3; i++) {
    const r = makeResistor3D();
    r.scale.set(0.6, 0.6, 0.6);
    r.position.set(0.45 + i * 0.09, 0.03, 0.28);
    bridgeResG.add(r);
  }
  benchG.add(bridgeResG);

  S.scene.add(benchG);

  const fuenteBox = makeDisplayBox(0.4, 0.26, 0.04, 420, 280);
  fuenteBox.position.set(-0.7, 0.32, -0.3);
  fuenteBox.rotation.y = 0.35;
  S.scene.add(fuenteBox);

  const medidorBox = makeDisplayBox(0.4, 0.26, 0.04, 420, 280);
  medidorBox.position.set(0.7, 0.32, -0.3);
  medidorBox.rotation.y = -0.35;
  S.scene.add(medidorBox);

  function drawFuenteScreen() {
    const ctx = fuenteBox.userData.ctx;
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, 420, 280);
    ctx.fillStyle = '#f59e0b'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'left';
    ctx.fillText('AJUSTES', 16, 34);
    ctx.font = '15px monospace'; ctx.fillStyle = '#e2e8f0';
    const bt = BRIDGE_TYPES.find((b) => b.key === curBridge());
    const rows = [
      'Vex: ' + fmtVex(curVex()),
      'ε: ' + fmtEps(curEps()),
      'puente: ' + bt.short,
      'G: ' + fmtG(curG()),
      'R_G: ' + fmtRG(curSolve().RG),
      'GF (fijo): ' + GF.toFixed(1),
    ];
    rows.forEach((t, i) => ctx.fillText(t, 16, 68 + i * 30));
    fuenteBox.userData.tex.needsUpdate = true;
  }

  function drawMedidorScreen() {
    const ctx = medidorBox.userData.ctx;
    ctx.fillStyle = '#05070a'; ctx.fillRect(0, 0, 420, 280);
    ctx.fillStyle = '#38bdf8'; ctx.font = 'bold 20px monospace'; ctx.textAlign = 'left';
    ctx.fillText('MEDICIÓN', 16, 34);
    ctx.font = '15px monospace'; ctx.fillStyle = '#e2e8f0';
    if (state.hide) {
      ctx.fillStyle = '#64748b';
      ctx.fillText('— oculto —', 16, 90);
    } else {
      const res = curSolve();
      const rows = [
        'Vbridge: ' + fmtMv(res.Vbridge),
        'VoutIdeal: ' + fmtVAuto(res.VoutIdeal),
        'error(mín): ' + fmtVAuto(res.errOutMin),
        'error%: ' + fmtPct(res.errPctMin),
      ];
      rows.forEach((t, i) => ctx.fillText(t, 16, 68 + i * 30));
    }
    medidorBox.userData.tex.needsUpdate = true;
  }

  function refreshBenchSel() {
    const eps = curEps();
    const color = eps > 0 ? 0xef4444 : (eps < 0 ? 0x3b82f6 : 0xb87333);
    beamGaugeG.userData.gauge.material.color.setHex(color);
    beamGaugeG.rotation.z = Math.max(-0.18, Math.min(0.18, (eps / 2000) * 0.15));
    const bt = curBridge();
    beamGaugeG.userData.gauge2.material.color.setHex(bt === 'quarter' ? 0x64748b : color);
  }

  function refreshBenchDyn() {
    drawFuenteScreen();
    drawMedidorScreen();
  }

  // ---------- HUD ----------
  el('hud').innerHTML = `
    <div class="eyebrow">MEC-38 · Electrónica de instrumentación</div>
    <h2>Amplificador de instrumentación + puente de galgas</h2>
    <p>Una galga extensométrica cambia su resistencia con la deformación mecánica ε (en microdeformaciones, µε=1e-6). Montada en un puente de Wheatstone, esa variación de resistencia produce un voltaje diferencial diminuto (mV o menos) sobre un voltaje de modo común Vcm≈Vex/2. Un amplificador de instrumentación (INA128) amplifica solo la diferencia, rechazando el modo común según su CMRR.</p>
    <div class="formula">
      Vbridge/Vex = GF·ε/4 (¼ puente, no lineal) · GF·ε/2 (½ puente) · GF·ε (puente completo)<br/>
      Vout = G·Vbridge &nbsp;&nbsp; error(salida) ≈ G·Vcm/CMRR_lineal
    </div>
    <div class="legend">
      <span><i style="background:#f59e0b"></i>brazo activo (galga)</span>
      <span><i style="background:#64748b"></i>brazo fijo</span>
      <span><i style="background:#38bdf8"></i>señal diferencial</span>
      <span><i style="background:#8fe3d0"></i>INA128</span>
    </div>
    <div class="fid">
      <b>SÍ verificado:</b> fórmulas exactas de ¼/½/puente completo (NI AN078), GF≈2.0 (Vishay/Omega), G=1+50kΩ/R_G y tabla CMRR del INA128 (SBOS051), Vcm≈Vex/2 (TI sboa247).<br/>
      <b>NO modelado:</b> compensación a 3 hilos, autocalentamiento, offset/deriva/ruido del INA128, recorte por swing de salida, tolerancia de fabricación.
    </div>
    <div class="src">Fuentes: NI AN078 · Vishay Strain Gage Data Book · Omega E-94 · TI INA128 datasheet (SBOS051) · TI sboa247/tidub00</div>
  `;

  // ---------- Panel ----------
  const MODES = ['explora', 'predice', 'medicion', 'reto'];
  const MODE_META = {
    explora: { label: 'Explora', icon: '🔍' },
    predice: { label: 'Predicción', icon: '🎯' },
    medicion: { label: 'Medición', icon: '📊' },
    reto: { label: 'Reto', icon: '🏆' },
  };
  const MISIONES = {
    explora: 'FASE 1 · Explora: ajusta Vex, ε, tipo de puente y ganancia G. Observa cómo cambian Vbridge, VoutIdeal y el error inducido por CMRR.',
    predice: 'FASE 2 · Predicción: antes de revelar el valor, predice Vbridge, VoutIdeal o si el error absoluto de CMRR depende del tipo de puente.',
    medicion: 'FASE 3 · Medición: ejecuta un barrido de deformación ε y registra cómo evoluciona Vbridge, VoutIdeal y el error relativo.',
    reto: 'FASE 4 · Reto: dado un Vex y ε fijos, elige el tipo de puente y la ganancia G para alcanzar el VoutIdeal objetivo manteniendo el error de CMRR ≤2%.',
  };

  el('panel').innerHTML = `
    <div class="mode-bar">
      ${MODES.map((m) => `<button id="btn-mode-${m}" class="mode-btn">${MODE_META[m].icon} ${MODE_META[m].label}</button>`).join('')}
    </div>
    <div id="missionText" class="mission"></div>

    <div class="ref-row">
      <button id="btnRef" class="ref-btn">📍 Punto de referencia</button>
      <button id="btnHighError" class="ref-btn">⚠ Error alto (G↑, ε↓)</button>
    </div>

    <div class="bridge-row">
      ${BRIDGE_TYPES.map((b) => `<button id="btn-bridge-${b.key}" class="bridge-btn">${b.short}</button>`).join('')}
    </div>

    <div class="ctrl-grid">
      <div class="ctrl"><label>Vex</label><button id="vexDec">−</button><span id="vVEX"></span><button id="vexInc">+</button></div>
      <div class="ctrl"><label>ε</label><button id="epsDec">−</button><span id="vEPS"></span><button id="epsInc">+</button></div>
      <div class="ctrl"><label>G</label><button id="gDec">−</button><span id="vG"></span><button id="gInc">+</button></div>
    </div>

    <div id="telemetry" class="telemetry"></div>

    <div id="predWrap" class="pred-wrap" style="display:none">
      <div id="predBox"></div>
      <button id="predNew">Nueva predicción</button>
      <button id="predCheck">Comprobar</button>
    </div>

    <div id="sweepWrap" class="sweep-wrap" style="display:none">
      <button id="sweepRun">▶ Ejecutar barrido de ε</button>
    </div>

    <div id="retoWrap" class="reto-wrap" style="display:none">
      <div id="retoBox"></div>
      <button id="retoNew">Nuevo reto</button>
      <button id="retoCheck">Verificar diseño</button>
    </div>

    <div id="report" class="report"></div>

    <div id="quizBox" class="quiz"></div>

    <button id="autoTour" class="auto-tour">▶ Recorrido guiado</button>
  `;

  function setMode(m) {
    state.mode = m;
    el('predWrap').style.display = m === 'predice' ? 'block' : 'none';
    el('sweepWrap').style.display = m === 'medicion' ? 'block' : 'none';
    el('retoWrap').style.display = m === 'reto' ? 'block' : 'none';
    state.hide = m === 'predice' && !state._revealed;
    el('missionText').textContent = MISIONES[m];
    if (m === 'predice') genPredice();
    if (m === 'reto' && !state._reto) newReto();
    refreshAll();
  }

  function syncCtrlBtns() {
    MODES.forEach((m) => { el('btn-mode-' + m).className = 'mode-btn' + (state.mode === m ? ' on' : ''); });
    BRIDGE_TYPES.forEach((b) => { el('btn-bridge-' + b.key).className = 'bridge-btn' + (curBridge() === b.key ? ' on' : ''); });
    el('vVEX').textContent = fmtVex(curVex());
    el('vEPS').textContent = fmtEps(curEps());
    el('vG').textContent = fmtG(curG());
  }

  function genPredice() {
    state._revealed = false;
    state.hide = true;
    const r = Math.random();
    let type;
    if (r < 0.34) type = 'vbridge';
    else if (r < 0.67) type = 'voutideal';
    else type = 'errsame';
    state._predType = type;
    const box = el('predBox');
    if (type === 'vbridge') {
      box.innerHTML = `<p>¿Cuál es el voltaje diferencial del puente Vbridge (en mV)?</p><input id="predInput" type="number" step="0.0001" placeholder="mV" />`;
    } else if (type === 'voutideal') {
      box.innerHTML = `<p>¿Cuál es el voltaje de salida ideal VoutIdeal=G·Vbridge (en V)?</p><input id="predInput" type="number" step="0.0001" placeholder="V" />`;
    } else {
      box.innerHTML = `<p>Para el mismo Vex, ε y G: ¿el error absoluto de salida inducido por CMRR (en mV) cambia según el tipo de puente (¼, ½, completo)?</p>
        <select id="predInput"><option value="si">Sí, cambia con el tipo de puente</option><option value="no">No, es el mismo error absoluto</option></select>`;
    }
    refreshAll();
  }

  function checkPredice() {
    const res = curSolve();
    const type = state._predType;
    let ok = false, real = '', guess = '';
    if (type === 'vbridge') {
      const v = parseFloat(el('predInput').value);
      const realMv = res.Vbridge * 1e3;
      ok = isFinite(v) && Math.abs(v - realMv) <= Math.max(0.02 * Math.abs(realMv), 0.0005);
      real = realMv.toFixed(4) + ' mV'; guess = String(v);
    } else if (type === 'voutideal') {
      const v = parseFloat(el('predInput').value);
      ok = isFinite(v) && Math.abs(v - res.VoutIdeal) <= Math.max(0.02 * Math.abs(res.VoutIdeal), 0.0005);
      real = fmtVAuto(res.VoutIdeal); guess = String(v);
    } else {
      const v = el('predInput').value;
      ok = v === 'no';
      real = 'No (el error de salida depende solo de G, Vcm y CMRR(G) — no del tipo de puente)';
      guess = v;
    }
    state._revealed = true;
    state.hide = false;
    refreshAll();
    showToast(ok ? '✅ ¡Correcto! ' + real : '❌ Incorrecto. Valor real: ' + real, ok ? 'ok' : 'err');
  }

  function newReto() {
    let vex, epsilon, hiddenBridge, hiddenG, voutTarget;
    let tries = 0;
    do {
      vex = VEX_VALS[Math.floor(Math.random() * VEX_VALS.length)];
      epsilon = EPS_VALS[Math.floor(Math.random() * EPS_VALS.length)];
      hiddenBridge = BRIDGE_TYPES[Math.floor(Math.random() * BRIDGE_TYPES.length)].key;
      hiddenG = GAIN_VALS[Math.floor(Math.random() * GAIN_VALS.length)];
      const eps = epsilon * 1e-6;
      voutTarget = hiddenG * bridgeOutput(hiddenBridge, vex, eps, GF);
      tries++;
    } while (Math.abs(voutTarget) > 12 && tries < 40);
    state._reto = { vex, epsilon, voutTarget, errorMaxPct: 2 };
    el('retoBox').innerHTML = `
      <p>Con <b>Vex=${fmtVex(vex)}</b> y <b>ε=${fmtEps(epsilon)}</b> (fijos), elige el tipo de puente y la ganancia G para lograr:</p>
      <p><b>VoutIdeal ≈ ${fmtVAuto(voutTarget)}</b> (tolerancia ±5%)<br/>y error de CMRR (peor caso) ≤ 2% de la señal.</p>
    `;
    refreshAll();
  }

  function checkReto() {
    const t = state._reto;
    if (!t) return;
    const res = curSolve();
    const vexOk = Math.abs(curVex() - t.vex) < 1e-9;
    const epsOk = Math.abs(curEps() - t.epsilon) < 1e-9;
    const tol = Math.max(0.05 * Math.abs(t.voutTarget), 0.001);
    const voutOk = Math.abs(res.VoutIdeal - t.voutTarget) <= tol;
    const errorOk = res.errPctMin <= t.errorMaxPct;
    if (!vexOk) { showToast('❌ Ajusta Vex a ' + fmtVex(t.vex), 'err'); return; }
    if (!epsOk) { showToast('❌ Ajusta ε a ' + fmtEps(t.epsilon), 'err'); return; }
    if (!voutOk) { showToast('❌ VoutIdeal=' + fmtVAuto(res.VoutIdeal) + ', objetivo ' + fmtVAuto(t.voutTarget) + '. Cambia el tipo de puente o G.', 'err'); return; }
    if (!errorOk) { showToast('❌ Error CMRR=' + fmtPct(res.errPctMin) + ' excede 2%. Prueba con un puente de mayor sensibilidad (½ o completo) o menor G.', 'err'); return; }
    showToast('✅ Diseño válido: VoutIdeal=' + fmtVAuto(res.VoutIdeal) + ', error=' + fmtPct(res.errPctMin), 'ok');
  }

  async function runSweep() {
    state._sweepTrace = [];
    const savedEps = state.iEPS;
    for (let i = 0; i < EPS_VALS.length; i++) {
      state.iEPS = i;
      refreshAll();
      const res = curSolve();
      state._sweepTrace.push({ epsilon: res.epsilon_ue, Vbridge: res.Vbridge, VoutIdeal: res.VoutIdeal, errPct: res.errPctMin });
      updateReport();
      await sleep(300);
    }
    state.iEPS = savedEps;
    refreshAll();
  }

  function updateTele() {
    const t = el('telemetry');
    if (state.hide) { t.innerHTML = '<p class="hidden-note">— valores ocultos hasta responder —</p>'; return; }
    const res = curSolve();
    t.innerHTML = `
      <div class="tele-row"><span>Vbridge</span><b>${fmtMv(res.Vbridge)}</b></div>
      <div class="tele-row"><span>VoutIdeal</span><b>${fmtVAuto(res.VoutIdeal)}</b></div>
      <div class="tele-row"><span>Vcm</span><b>${fmtVAuto(res.Vcm)}</b></div>
      <div class="tele-row"><span>CMRR</span><b>${fmtDb(res.cmrrMinDb)} mín / ${fmtDb(res.cmrrTypDb)} típ</b></div>
      <div class="tele-row"><span>error (peor caso)</span><b>${fmtVAuto(res.errOutMin)} (${fmtPct(res.errPctMin)})</b></div>
      <div class="tele-row"><span>R_G</span><b>${fmtRG(res.RG)}</b></div>
    `;
  }

  function updateReport() {
    const r = el('report');
    if (!state._sweepTrace || !state._sweepTrace.length) { r.innerHTML = ''; return; }
    r.innerHTML = '<table class="report-table"><tr><th>ε</th><th>Vbridge</th><th>VoutIdeal</th><th>error%</th></tr>' +
      state._sweepTrace.map((p) => `<tr><td>${fmtEps(p.epsilon)}</td><td>${fmtMv(p.Vbridge)}</td><td>${fmtVAuto(p.VoutIdeal)}</td><td>${fmtPct(p.errPct)}</td></tr>`).join('') +
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
    {
      q: '¿Por qué el cuarto de puente tiene un término no lineal (1+GF·ε/2) en el denominador, mientras que el medio puente y el puente completo son exactamente lineales?',
      a: [
        'Porque en ½ y puente completo los términos no lineales de los brazos activos adyacentes se cancelan entre sí',
        'Porque el cuarto de puente usa una galga de menor calidad',
        'Porque el voltaje de excitación Vex es distinto en cada configuración',
      ],
      correct: 0,
    },
    {
      q: 'Al subir la ganancia G de 100 a 1000, el CMRR mínimo del INA128 se mantiene igual (120 dB) según la hoja de datos. ¿Qué le pasa al error de salida inducido por el voltaje de modo común?',
      a: [
        'Se mantiene igual, porque el CMRR no cambió',
        'Sube proporcionalmente con G, porque el CMRR no mejoró al mismo ritmo que la ganancia',
        'Baja, porque mayor ganancia siempre reduce el error relativo',
      ],
      correct: 1,
    },
    {
      q: '¿Por qué el puente completo (4 galgas activas) es 4 veces más sensible que el cuarto de puente para la misma deformación ε?',
      a: [
        'Porque usa un Vex más alto automáticamente',
        'Porque las 4 galgas contribuyen con el mismo signo de cambio diferencial, sumando su efecto',
        'Porque el INA128 detecta mejor señales de 4 fuentes',
      ],
      correct: 1,
    },
  ];
  let quizIdx = 0;
  function buildQuiz() { quizIdx = 0; refreshQuestion(); }
  function refreshQuestion() {
    const box = el('quizBox');
    if (quizIdx >= QUIZ.length) { box.innerHTML = '<p class="quiz-done">✅ Cuestionario completo.</p>'; return; }
    const item = QUIZ[quizIdx];
    box.innerHTML = `<p class="quiz-q">${item.q}</p>` +
      item.a.map((a, i) => `<button class="quiz-opt" data-i="${i}">${a}</button>`).join('');
    box.querySelectorAll('.quiz-opt').forEach((btn) => {
      btn.addEventListener('click', () => {
        const i = parseInt(btn.dataset.i, 10);
        if (i === item.correct) {
          showToast('✅ Correcto', 'ok');
          quizIdx++;
          refreshQuestion();
        } else {
          showToast('❌ Intenta de nuevo', 'err');
        }
      });
    });
  }

  // ---------- Interacción 3D ----------
  function actToast(id) {
    const msgs = {
      vex: 'Fuente de excitación del puente Vex.',
      r1: 'Brazo del puente R1.', r2: 'Brazo del puente R2.', r3: 'Brazo del puente R3.', r4: 'Brazo del puente R4.',
      ina: 'Amplificador de instrumentación INA128.',
      rg: 'Resistor de ganancia R_G — fija G=1+50kΩ/R_G.',
      out: 'Salida amplificada Vout.',
      beam: 'Viga instrumentada con galga extensométrica.',
      ic: 'INA128 (DIP-8).',
    };
    showToast(msgs[id] || id);
  }
  function resolveActor(name) {
    return { beam: beamGaugeG, ic: icG, rg: rgG }[name];
  }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (!actor) { actToast(id); return; }
    actToast(id);
    const s0 = actor.scale.x;
    actor.scale.setScalar(s0 * 1.08);
    setTimeout(() => actor.scale.setScalar(s0), 160);
  }
  pickerFor(S.scene, S.camera, S.renderer.domElement, (hit) => {
    if (hit && hit.object === boardPlane && hit.uv) {
      boardClick(hit.uv.x, hit.uv.y);
      return;
    }
    if (!hit) return;
    let o = hit.object;
    while (o) {
      if (o === beamGaugeG) { dispatch3D('beam'); return; }
      if (o === icG) { dispatch3D('ic'); return; }
      if (o === rgG) { dispatch3D('rg'); return; }
      o = o.parent;
    }
  });

  async function runAuto() {
    setMode('explora');
    await sleep(600);
    state.iVEX = 2; state.iEPS = 6; state.iBridge = 0; state.iG = 3;
    refreshAll();
    await sleep(900);
    state.iBridge = 2;
    refreshAll();
    await sleep(900);
    state.iG = 6;
    refreshAll();
    await sleep(900);
    setMode('medicion');
    await runSweep();
  }

  // ---------- Wiring ----------
  MODES.forEach((m) => el('btn-mode-' + m).addEventListener('click', () => setMode(m)));
  BRIDGE_TYPES.forEach((b) => el('btn-bridge-' + b.key).addEventListener('click', () => {
    state.iBridge = BRIDGE_TYPES.findIndex((x) => x.key === b.key);
    onChange();
  }));

  function wireStep(id, getIdx, setIdx, max) {
    el(id + 'Dec').addEventListener('click', () => { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
    el(id + 'Inc').addEventListener('click', () => { setIdx(Math.min(max - 1, getIdx() + 1)); onChange(); });
  }
  wireStep('vex', () => state.iVEX, (v) => { state.iVEX = v; }, VEX_VALS.length);
  wireStep('eps', () => state.iEPS, (v) => { state.iEPS = v; }, EPS_VALS.length);
  wireStep('g', () => state.iG, (v) => { state.iG = v; }, GAIN_VALS.length);

  el('btnRef').addEventListener('click', () => {
    state.iVEX = 2; state.iEPS = 6; state.iBridge = 0; state.iG = 3;
    onChange();
    showToast('📍 Referencia: Vex=5V, ε=+1000µε, ¼ puente, G=100 → VoutIdeal≈250mV, error≈0.1%');
  });
  el('btnHighError').addEventListener('click', () => {
    state.iVEX = 2; state.iEPS = 4; state.iBridge = 0; state.iG = 6;
    onChange();
    showToast('⚠ ε pequeño (+100µε) con G=1000: el error de CMRR crece a ~1% de la señal');
  });

  el('predNew').addEventListener('click', genPredice);
  el('predCheck').addEventListener('click', checkPredice);
  el('retoNew').addEventListener('click', newReto);
  el('retoCheck').addEventListener('click', checkReto);
  el('sweepRun').addEventListener('click', runSweep);
  el('autoTour').addEventListener('click', runAuto);

  setMode('explora');
  buildQuiz();
  refreshAll();
  S.start();

  window.__labDebug = {
    state, DEVS, GF, R_GAUGE,
    VEX_VALS, EPS_VALS, BRIDGE_TYPES, GAIN_VALS,
    bridgeOutput, cmrrDb, activeArms,
    solveInstrumentacion, classifyError,
    curVex, curEps, curBridge, curG, curSolve,
    setMode, genPredice, checkPredice, newReto, checkReto, runSweep, refreshAll,
  };
})();
