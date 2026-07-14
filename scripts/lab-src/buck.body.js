/**
 * FICHA DE FIDELIDAD — Convertidor Reductor (Buck) en CCM: D, rizo de IL y ΔVout
 *
 * SÍ verificado:
 * - Ciclo de trabajo ideal en conducción continua (CCM), convertidor sin
 *   pérdidas: D=Vout/Vin — balance volt-segundo del inductor en estado
 *   estable (Texas Instruments SLVA477B "Basic Calculation of a Buck
 *   Converter's Power Stage"; TI SLVA057 "Understanding Buck Power Stages
 *   in Switchmode Power Supplies"; Erickson & Maksimovic, "Fundamentals
 *   of Power Electronics", cap.2).
 * - Rizo de corriente de inductor pico a pico: ΔIL=Vout·(1−D)/(L·fsw) —
 *   deducido de la pendiente de descarga del inductor durante el
 *   intervalo de apagado (TI SLVA477B; TI SLVA057; Erickson & Maksimovic
 *   cap.2).
 * - Frontera CCM/DCM: el convertidor permanece en conducción continua
 *   mientras la corriente de carga Iout sea mayor o igual a la corriente
 *   crítica Icrit=ΔIL/2; por debajo de ese punto la corriente de inductor
 *   llegaría a cero antes de terminar el ciclo y el diodo deja de
 *   conducir (conducción discontinua, DCM) — condición de frontera
 *   estándar (TI SLVA057; Erickson & Maksimovic cap.5).
 * - Corriente promedio de inductor igual a la corriente de carga
 *   (IL_avg=Iout), válida tanto en CCM como en DCM por conservación de
 *   carga en el capacitor de salida en estado estable.
 * - Rizo de voltaje de salida aproximado como la suma del término
 *   capacitivo (carga/descarga de C por el rizo de IL) y el término
 *   resistivo (caída en la ESR del capacitor): ΔVout≈ΔIL/(8·C·fsw) +
 *   ESR·ΔIL — deducción y aproximación de suma de ambos términos
 *   documentada en TI SLVA630A "Output Ripple Voltage of Buck Switching
 *   Regulators"; SLVA630A señala que en capacitores electrolíticos
 *   reales el término de ESR domina típicamente sobre el capacitivo.
 * - Corriente promedio de entrada Iin_avg=D·Iout — por conservación de
 *   potencia en un convertidor ideal sin pérdidas (Pin=Pout).
 * - Referencia real: familia LM2596 (Texas Instruments, hoja de datos
 *   SNVS124), regulador reductor monolítico de 3A con interruptor de
 *   potencia interno y frecuencia de conmutación fija de 150kHz; el
 *   punto de diseño de referencia de este simulador (Vin=12V, Vout=5V,
 *   Iout=3A, fsw=150kHz, L=68µH, Cout=220µF/25V, Cin=470µF/50V, diodo
 *   Schottky de rueda libre tipo 1N5825) reproduce un ejemplo de diseño
 *   típico de esa hoja de datos y de TI SLVA477B.
 *
 * NO modelado:
 * - La relación de conversión real en DCM, M(D,K)=2/(1+√(1+4K/D²)) con
 *   K=2L/(R·T) (Erickson & Maksimovic cap.5; TI SLVA057): en DCM, Vout
 *   real deja de ser D·Vin y depende también de la carga. Este simulador
 *   solo señala cualitativamente cuándo Iout cae por debajo de Icrit
 *   (frontera DCM): dibuja la curva triangular "ingenua" que predice la
 *   fórmula de CCM, recortada visualmente en cero, como advertencia de
 *   que el diodo no puede conducir corriente negativa — no recalcula
 *   Vout ni la forma de onda real de IL(t) en DCM. El modelado completo
 *   de DCM queda para el siguiente laboratorio de esta serie
 *   (boost/flyback).
 * - Pérdidas por conmutación, conducción del interruptor/diodo, y
 *   eficiencia (η<100%): este simulador trata el convertidor como ideal
 *   (sin pérdidas), por lo que Pin=Pout exactamente.
 * - Rectificación síncrona (MOSFET en vez de diodo de rueda libre): el
 *   LM2596 y el diseño de referencia usados aquí son de rectificación
 *   asíncrona (con diodo Schottky).
 * - Dinámica de lazo cerrado, compensación y estabilidad del regulador:
 *   este simulador calcula solo el punto de operación en estado estable
 *   (DC), no la respuesta transitoria ni el diseño del lazo de
 *   realimentación.
 * - Tolerancia real de fabricación de L y C, deriva térmica de la ESR, y
 *   saturación del inductor a alta corriente.
 *
 * Nota de rigor:
 * - Los valores de ESR listados para cada capacitor son cifras típicas
 *   de capacitores electrolíticos genéricos de baja ESR en esos rangos
 *   de capacitancia/voltaje, no una cifra literal tomada de la hoja de
 *   datos de un fabricante específico — la ESR real varía notablemente
 *   entre fabricantes, series y temperatura; consulta siempre la hoja de
 *   datos del capacitor real antes de diseñar con una cifra exacta.
 * - Regla de honestidad: no se inventan cifras de eficiencia, pérdidas ni
 *   comportamiento en DCM que no estén citadas en las fuentes; se listan
 *   como advertencias cualitativas en "NO modelado".
 *
 * Fuentes:
 * - Texas Instruments, SLVA477B, "Basic Calculation of a Buck Converter's
 *   Power Stage" — https://www.ti.com/lit/an/slva477b/slva477b.pdf
 * - Texas Instruments, SLVA057, "Understanding Buck Power Stages in
 *   Switchmode Power Supplies" — https://www.ti.com/lit/an/slva057/slva057.pdf
 * - Texas Instruments, SLVA630A, "Output Ripple Voltage of Buck Switching
 *   Regulators" — https://www.ti.com/lit/an/slva630a/slva630a.pdf
 * - Texas Instruments, hoja de datos LM2596 (SNVS124) —
 *   https://www.ti.com/lit/ds/symlink/lm2596.pdf
 * - Robert W. Erickson y Dragan Maksimovic, "Fundamentals of Power
 *   Electronics", cap.2 (CCM) y cap.5 (DCM)
 */
(function () {
  'use strict';
  const mount = document.getElementById('stage');
  const S = createStage(mount, { cam: [3.4, 2.6, 7.6], target: [0.5, 1.2, 0.3], bgTop: '#0d1420', bgBot: '#04060a', bloom: 0.35, minD: 3.0, maxD: 18 });
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
    lm2596: {
      name: 'LM2596 (versión ajustable)',
      vinMin: 4.5, vinMax: 40, ioutMax: 3, fswTyp: 150000,
      note: 'Regulador reductor (buck) monolítico, interruptor de potencia interno — el diseño externo solo añade L, diodo, Cin y Cout',
      color: 0x4a4a52,
    },
    diode: { name: '1N5825 (Schottky)', note: 'Diodo de rueda libre — bajo voltaje directo, recuperación rápida, uso típico en buck asíncrono' },
  };

  // ---------- Física ----------
  const VIN = 12;
  const FSW = 150000;

  function solveBuck(Vin, Vout, L, C, ESR, Fsw, Iout) {
    const D = Vout / Vin;
    const deltaIL = Vout * (1 - D) / (L * Fsw);
    const Icrit = deltaIL / 2;
    const ILavg = Iout;
    const ILpeak = ILavg + deltaIL / 2;
    const ILvalley = ILavg - deltaIL / 2;
    const mode = Iout >= Icrit ? 'CCM' : 'DCM';
    const deltaVoutC = deltaIL / (8 * C * Fsw);
    const deltaVoutESR = ESR * deltaIL;
    const deltaVout = deltaVoutC + deltaVoutESR;
    const IinAvg = D * Iout;
    return { Vin, Vout, L, C, ESR, Fsw, Iout, D, deltaIL, Icrit, ILavg, ILpeak, ILvalley, mode, deltaVoutC, deltaVoutESR, deltaVout, IinAvg };
  }
  function classifyMode(res) {
    if (res.mode === 'DCM') return { key: 'dcm', label: 'DCM — conducción discontinua (IL llegaría a 0 antes de terminar el ciclo)', color: '#f59e0b' };
    const margin = (res.Iout - res.Icrit) / Math.max(res.Icrit, 1e-12);
    if (margin < 0.25) return { key: 'ccm_near', label: 'CCM — cerca de la frontera con DCM', color: '#eab308' };
    return { key: 'ccm', label: 'CCM — conducción continua', color: '#22c55e' };
  }
  function ilTriangleNaive(res, N) {
    N = N || 120;
    const T = 1 / res.Fsw;
    const tOn = res.D * T;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * T;
      let il;
      if (t <= tOn) il = res.ILvalley + (res.ILpeak - res.ILvalley) * (t / tOn);
      else il = res.ILpeak - (res.ILpeak - res.ILvalley) * ((t - tOn) / (T - tOn));
      pts.push({ t, il });
    }
    return pts;
  }

  function fmtV(v) { return v.toFixed(v >= 10 ? 1 : 2) + ' V'; }
  function fmtVsmall(v) { return v < 1 ? (v * 1000).toFixed(0) + ' mV' : v.toFixed(3) + ' V'; }
  function fmtA(a) { return a >= 1 ? a.toFixed(2) + ' A' : (a * 1000).toFixed(0) + ' mA'; }
  function fmtL(l) { return (l * 1e6).toFixed(0) + ' µH'; }
  function fmtCuF(c) { return (c * 1e6).toFixed(0) + ' µF'; }
  function fmtOhmSmall(r) { return r < 1 ? (r * 1000).toFixed(0) + ' mΩ' : r.toFixed(2) + ' Ω'; }
  function fmtD(d) { return (d * 100).toFixed(1) + ' %'; }
  function fmtPct(p) { return p.toFixed(2) + ' %'; }
  function fmtUs(t) { return (t * 1e6).toFixed(2) + ' µs'; }

  // ---------- Estado ----------
  const VOUT_VALS = [1.8, 2.5, 3.3, 5.0, 6.0, 8.0, 9.0];
  const L_VALS = [22e-6, 33e-6, 47e-6, 68e-6, 100e-6, 150e-6, 220e-6];
  const IOUT_VALS = [0.1, 0.3, 0.5, 1.0, 1.5, 2.0, 3.0];
  const CAP_TABLE = [
    { c: 100e-6, v: 25, esr: 0.30 },
    { c: 220e-6, v: 25, esr: 0.15 },
    { c: 330e-6, v: 25, esr: 0.10 },
    { c: 470e-6, v: 50, esr: 0.08 },
    { c: 1000e-6, v: 25, esr: 0.05 },
  ];

  const state = {
    iVOUT: 3, iL: 3, iC: 1, iIOUT: 3,
    mode: 'explora', hide: false, _revealed: false,
    _sweepTrace: null, _predType: 'd', _reto: null,
  };

  function curVOUT() { return VOUT_VALS[state.iVOUT]; }
  function curL() { return L_VALS[state.iL]; }
  function curCEntry() { return CAP_TABLE[state.iC]; }
  function curC() { return curCEntry().c; }
  function curESR() { return curCEntry().esr; }
  function curIOUT() { return IOUT_VALS[state.iIOUT]; }
  function curSolveBuck() { return solveBuck(VIN, curVOUT(), curL(), curC(), curESR(), FSW, curIOUT()); }

  // ---------- Materiales y geometría 3D ----------
  const MAT = {
    board: { color: 0x2b2f36, roughness: 0.85, metalness: 0.1 },
    lead: { color: 0xc7c7c7, roughness: 0.35, metalness: 0.8 },
    icBody: { color: 0x4a4a52, roughness: 0.5, metalness: 0.2 },
    notch: { color: 0x08080c, roughness: 0.5, metalness: 0.1 },
    capBody: { color: 0x2255aa, roughness: 0.4, metalness: 0.3 },
    diodeBody: { color: 0x1a1a1a, roughness: 0.5, metalness: 0.2 },
    diodeBand: { color: 0xd7dee6, roughness: 0.4, metalness: 0.3 },
    windCopper: { color: 0xb87333, roughness: 0.35, metalness: 0.75 },
  };
  function std(spec) { return new THREE.MeshStandardMaterial(spec); }

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
  function makeDiode3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.2, 16), std(MAT.diodeBody));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.052, 0.052, 0.02, 16), std(MAT.diodeBand));
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.07;
    g.add(band);
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.007, 0.007, 0.1, 8), std(MAT.lead));
      leg.rotation.z = Math.PI / 2;
      leg.position.x = s * 0.15;
      g.add(leg);
    }
    g.userData.body = body;
    return g;
  }
  function makeInductor3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.13, 0.14, 0.12, 20), std({ color: 0x2b2b2b, roughness: 0.6, metalness: 0.3 }));
    g.add(body);
    const wind = new THREE.Mesh(new THREE.TorusGeometry(0.1, 0.025, 10, 24), std(MAT.windCopper));
    wind.rotation.x = Math.PI / 2;
    wind.position.y = 0.03;
    g.add(wind);
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.01, 0.01, 0.08, 8), std(MAT.lead));
      leg.position.set(s * 0.1, -0.1, 0);
      g.add(leg);
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
  function dcSourceGlyph(ctx, x, y, r, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, r, 0, Math.PI * 2); ctx.stroke();
    ctx.fillStyle = col || '#8fe3d0'; ctx.font = 'bold 15px sans-serif';
    ctx.fillText('+', x - 5, y - r * 0.3);
    ctx.font = 'bold 15px sans-serif';
    ctx.fillText('−', x - 5, y + r * 0.75);
  }
  function switchBoxGlyph(ctx, x0, x1, y, col) {
    ctx.strokeStyle = col || '#e8c568'; ctx.lineWidth = 2;
    ctx.strokeRect(x0, y - 12, x1 - x0, 24);
    ctx.beginPath(); ctx.moveTo(x0 + 5, y + 7); ctx.lineTo(x1 - 7, y - 7); ctx.stroke();
    ctx.fillStyle = col || '#e8c568'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('SW', (x0 + x1) / 2 - 10, y + 26);
  }
  function diodeGlyphV(ctx, x, yTop, yBot, col) {
    ctx.strokeStyle = col || '#e8c568'; ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(x - 10, yBot); ctx.lineTo(x + 10, yBot); ctx.lineTo(x, yTop); ctx.closePath(); ctx.stroke();
    line(ctx, x - 10, yTop, x + 10, yTop, 3, col || '#e8c568');
  }
  function inductorGlyph(ctx, x0, x1, y, col) {
    ctx.strokeStyle = col || '#8fe3d0'; ctx.lineWidth = 2;
    const n = 5, w = (x1 - x0) / n;
    ctx.beginPath();
    for (let i = 0; i < n; i++) {
      const cx = x0 + w * i + w / 2;
      ctx.arc(cx, y, w / 2 - 1, Math.PI, 0, false);
    }
    ctx.stroke();
  }

  // ---------- Layout ----------
  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const SRC_X = 90, SRC_Y = 260;
  const RAIL_Y = 90, GND_Y = 430;
  const CIN_X = 150;
  const SW_X0 = 200, SW_X1 = 260;
  const SWNODE_X = 300;
  const DIODE_Y0 = 150, DIODE_Y1 = 195;
  const OUTNODE_X = 460, COUT_X = 510, LOAD_X = 570;

  let HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id, x, y, w, h, label }); }

  function drawSchematic(ctx) {
    HIT = [];
    ctx.clearRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);

    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('CONVERTIDOR REDUCTOR (BUCK) — LM2596', PX0 + 10, PY0 + 14);

    // Fuente Vin
    dcSourceGlyph(ctx, SRC_X, SRC_Y, 28, '#8fe3d0');
    addHit('src', SRC_X - 20, SRC_Y - 28, 40, 56, 'Vin (12V fijo)');
    ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif';
    ctx.fillText('Vin=12V', SRC_X - 24, SRC_Y - 36);
    line(ctx, SRC_X, SRC_Y - 28, SRC_X, RAIL_Y, 2, '#8fe3d0');
    line(ctx, SRC_X, SRC_Y + 28, SRC_X, GND_Y, 2, '#8fe3d0');
    groundGlyph(ctx, SRC_X, GND_Y);

    // Riel Vin+
    line(ctx, SRC_X, RAIL_Y, SW_X0, RAIL_Y, 2, '#8fe3d0');

    // Cin
    line(ctx, CIN_X, RAIL_Y, CIN_X, 195, 2, '#8fe3d0');
    capGlyph(ctx, CIN_X, 200, '#5fb8ff');
    addHit('cin', CIN_X - 16, 192, 32, 24, 'Cin (entrada)');
    ctx.fillStyle = '#5fb8ff'; ctx.font = '12px sans-serif'; ctx.fillText('Cin', CIN_X + 12, 208);
    line(ctx, CIN_X, 211, CIN_X, GND_Y, 2, '#8fe3d0');

    // Interruptor interno (SW)
    switchBoxGlyph(ctx, SW_X0, SW_X1, RAIL_Y, '#e8c568');
    addHit('sw', SW_X0 - 5, RAIL_Y - 12 - 5, (SW_X1 - SW_X0) + 10, 24 + 10, 'LM2596 — interruptor interno (SW)');
    line(ctx, SW_X1, RAIL_Y, SWNODE_X, RAIL_Y, 2, '#8fe3d0');

    // Diodo de rueda libre
    line(ctx, SWNODE_X, RAIL_Y, SWNODE_X, DIODE_Y0, 2, '#8fe3d0');
    diodeGlyphV(ctx, SWNODE_X, DIODE_Y0, DIODE_Y1, '#e8c568');
    addHit('diode', SWNODE_X - 14, DIODE_Y0 - 4, 28, (DIODE_Y1 - DIODE_Y0) + 8, 'Diodo de rueda libre (D1)');
    ctx.fillStyle = '#e8c568'; ctx.fillText('D1', SWNODE_X + 16, (DIODE_Y0 + DIODE_Y1) / 2 + 4);
    line(ctx, SWNODE_X, DIODE_Y1, SWNODE_X, GND_Y, 2, '#8fe3d0');

    // Inductor
    inductorGlyph(ctx, SWNODE_X, OUTNODE_X, RAIL_Y, '#8fe3d0');
    addHit('l', SWNODE_X + 4, RAIL_Y - 16, (OUTNODE_X - SWNODE_X) - 8, 32, 'Inductor L');
    ctx.fillStyle = '#8fe3d0'; ctx.fillText('L', (SWNODE_X + OUTNODE_X) / 2 - 4, RAIL_Y - 20);

    // Riel Vout
    line(ctx, OUTNODE_X, RAIL_Y, LOAD_X, RAIL_Y, 2, '#8fe3d0');
    addHit('out', OUTNODE_X, RAIL_Y - 16, LOAD_X - OUTNODE_X, 16, 'Vout');

    // Cout
    line(ctx, COUT_X, RAIL_Y, COUT_X, 195, 2, '#8fe3d0');
    capGlyph(ctx, COUT_X, 200, '#5fb8ff');
    addHit('cout', COUT_X - 16, 192, 32, 24, 'Cout (salida)');
    ctx.fillStyle = '#5fb8ff'; ctx.fillText('Cout', COUT_X + 12, 208);
    line(ctx, COUT_X, 211, COUT_X, GND_Y, 2, '#8fe3d0');

    // Carga
    line(ctx, LOAD_X, RAIL_Y, LOAD_X, 190, 2, '#8fe3d0');
    vResistorGlyph(ctx, LOAD_X, 190, 70, '#c084fc');
    addHit('load', LOAD_X - 8, 190, 16, 70, 'Carga (Iout)');
    ctx.fillStyle = '#c084fc'; ctx.font = '12px sans-serif'; ctx.fillText('Carga', LOAD_X + 12, 230);
    line(ctx, LOAD_X, 260, LOAD_X, GND_Y, 2, '#8fe3d0');

    // Riel GND
    line(ctx, SRC_X, GND_Y, LOAD_X, GND_Y, 2, '#8fe3d0');
    groundGlyph(ctx, LOAD_X, GND_Y);

    const res = curSolveBuck();
    const cls = classifyMode(res);
    ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = cls.color;
    ctx.fillText('D=' + fmtD(res.D) + ' · ΔIL=' + fmtA(res.deltaIL) + ' · Icrit=' + fmtA(res.Icrit) + ' · ' + cls.label, PX0 + 10, PY1 - 12);
  }

  // ---------- Gráfica: IL(t) + barras de rizo de Vout ----------
  const IL_Y0 = 60, IL_Y1 = 300;
  const RIP_Y0 = 340, RIP_Y1 = 440;
  const GXA = GX0 + 55, GXB = GX1 - 15;

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    const res = curSolveBuck();
    const cls = classifyMode(res);
    const T = 1 / res.Fsw;

    const loIL = Math.min(0, res.ILvalley) * 1.25 - 0.005;
    const hiIL = res.ILpeak * 1.2 + 0.005;
    const xPixT = t => GXA + (t / T) * (GXB - GXA);
    const yPixIL = il => IL_Y1 - (il - loIL) / (hiIL - loIL) * (IL_Y1 - IL_Y0);

    // Ejes
    line(ctx, GXA, IL_Y0, GXA, IL_Y1, 1, '#233532');
    line(ctx, GXA, IL_Y1, GXB, IL_Y1, 1, '#233532');
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('IL(t) durante un periodo de conmutación', GXA, IL_Y0 - 8);

    // Línea de cero (crítica en DCM)
    const y0 = yPixIL(0);
    ctx.setLineDash([2, 3]); line(ctx, GXA, y0, GXB, y0, 1, '#4a5a56'); ctx.setLineDash([]);
    ctx.fillText('0 A', GX0 + 2, y0 + 3);

    // ILavg
    const yAvg = yPixIL(res.ILavg);
    ctx.setLineDash([4, 4]); line(ctx, GXA, yAvg, GXB, yAvg, 1, '#8fb3ac'); ctx.setLineDash([]);
    ctx.fillStyle = '#8fb3ac'; ctx.fillText('IL_avg=Iout=' + fmtA(res.ILavg), GXA + 4, yAvg - 4);

    // Marca de tOn
    const xOn = xPixT(res.D * T);
    ctx.setLineDash([2, 3]); line(ctx, xOn, IL_Y0, xOn, IL_Y1, 1, '#1a2b27'); ctx.setLineDash([]);
    ctx.fillStyle = '#6b8a83'; ctx.fillText('D·T=' + fmtUs(res.D * T), xOn - 20, IL_Y1 + 14);
    ctx.fillText('T=' + fmtUs(T), GXB - 60, IL_Y1 + 14);

    // Curva "ingenua" (fórmula CCM, puede ir bajo 0 si Iout<Icrit)
    const pts = ilTriangleNaive(res, 120);
    ctx.strokeStyle = '#5a6a66'; ctx.lineWidth = 1.5; ctx.setLineDash([3, 3]);
    ctx.beginPath();
    pts.forEach((p, i) => { const x = xPixT(p.t), y = yPixIL(p.il); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke(); ctx.setLineDash([]);

    // Curva física (recortada en 0 — el diodo no conduce en reversa)
    ctx.strokeStyle = cls.color; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => { const x = xPixT(p.t), y = yPixIL(Math.max(0, p.il)); if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y); });
    ctx.stroke();

    if (res.mode === 'DCM') {
      ctx.fillStyle = '#f59e0b'; ctx.font = '11px sans-serif';
      ctx.fillText('línea punteada = fórmula CCM (no física aquí) · línea sólida = IL real, recortada en 0', GXA + 4, IL_Y0 + 14);
    }

    // ---------- Barras de rizo de Vout ----------
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('Composición del rizo de Vout: ΔVout = ΔIL/(8·C·fsw) + ESR·ΔIL', GXA, RIP_Y0 - 8);
    const barX0 = GXA, barW = GXB - GXA, barY = RIP_Y0 + 10, barH = 26;
    const total = Math.max(res.deltaVout, 1e-9);
    const wC = barW * (res.deltaVoutC / total), wESR = barW * (res.deltaVoutESR / total);
    ctx.fillStyle = '#5fb8ff'; ctx.fillRect(barX0, barY, wC, barH);
    ctx.fillStyle = '#f59e0b'; ctx.fillRect(barX0 + wC, barY, wESR, barH);
    ctx.strokeStyle = '#233532'; ctx.lineWidth = 1; ctx.strokeRect(barX0, barY, barW, barH);
    ctx.fillStyle = '#EAF4F1'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText('ΔVout total ≈ ' + fmtVsmall(res.deltaVout) + ' (' + fmtPct(res.deltaVout / res.Vout * 100) + ' de Vout)', barX0, barY + barH + 18);
    ctx.font = '11px sans-serif';
    ctx.fillStyle = '#5fb8ff'; ctx.fillText('■ capacitivo: ' + fmtVsmall(res.deltaVoutC), barX0, barY + barH + 36);
    ctx.fillStyle = '#f59e0b'; ctx.fillText('■ ESR: ' + fmtVsmall(res.deltaVoutESR), barX0 + 160, barY + barH + 36);
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
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 1.8), std({ color: 0x2b2f36, roughness: 0.85, metalness: 0.1 }));
  mesa.position.set(0.5, 0.55, 1.0);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 1.2), std({ color: 0x0e4d33, roughness: 0.7, metalness: 0.1 }));
  pcb.position.set(0.5, 0.62, 1.0);
  benchG.add(mesa, pcb);

  const cinG = makeCapacitor3D(); cinG.position.set(-0.9, 0.76, 1.0); benchG.add(cinG);
  const icG = makeDIP3D(); icG.position.set(-0.25, 0.7, 1.0); benchG.add(icG);
  const diodeG = makeDiode3D(); diodeG.position.set(0.35, 0.68, 1.0); benchG.add(diodeG);
  const indG = makeInductor3D(); indG.position.set(1.0, 0.72, 1.0); benchG.add(indG);
  const coutG = makeCapacitor3D(); coutG.position.set(1.6, 0.76, 1.0); benchG.add(coutG);
  S.scene.add(benchG);

  function refreshBenchSel() {
    icG.userData.body.material.color.setHex(DEVS.lm2596.color);
    const scale = 0.85 + Math.min(0.4, curL() / 220e-6 * 0.4);
    indG.scale.setScalar(scale);
    const cScale = 0.8 + Math.min(0.5, curC() / 1000e-6 * 0.5);
    coutG.scale.setScalar(cScale);
  }

  const fuenteBox = makeDisplayBox(0.7, 0.42, 0.06, 220, 132);
  fuenteBox.position.set(-1.9, 0.95, 1.0); fuenteBox.rotation.y = 0.06 * Math.PI;
  const medidorBox = makeDisplayBox(0.7, 0.5, 0.06, 220, 156);
  medidorBox.position.set(2.6, 0.98, 1.0); medidorBox.rotation.y = -0.06 * Math.PI;
  const scopeBox = makeDisplayBox(1.0, 0.62, 0.06, 260, 160);
  scopeBox.position.set(0.6, 1.42, 0.62); scopeBox.rotation.x = -0.06 * Math.PI;
  benchG.add(fuenteBox, medidorBox, scopeBox);

  function drawFuenteScreen() {
    const { ctx, canvas, tex } = fuenteBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Vin=' + fmtV(VIN) + '  Vout=' + fmtV(curVOUT()), 14, 30);
    ctx.font = '13px sans-serif';
    ctx.fillText('L=' + fmtL(curL()) + '  C=' + fmtCuF(curC()) + '/' + curCEntry().v + 'V', 14, 54);
    ctx.fillText('ESR≈' + fmtOhmSmall(curESR()) + '  Iout=' + fmtA(curIOUT()), 14, 74);
    ctx.fillText(DEVS.lm2596.name + ' · fsw=150kHz', 14, 94);
    tex.needsUpdate = true;
  }
  function drawMedidorScreen() {
    const { ctx, canvas, tex } = medidorBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#6b8a83'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('D: ?  ΔIL: ?', 14, 40);
      ctx.fillText('¿CCM o DCM?', 14, 66);
    } else {
      const res = curSolveBuck();
      const cls = classifyMode(res);
      ctx.fillStyle = '#5fb8ff'; ctx.fillText('D = ' + fmtD(res.D), 14, 26);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('ΔIL = ' + fmtA(res.deltaIL) + '  Icrit = ' + fmtA(res.Icrit), 14, 46);
      ctx.fillStyle = cls.color; ctx.font = 'bold 13px sans-serif'; ctx.fillText(cls.label, 14, 68, 200);
      ctx.fillStyle = '#8fe3d0'; ctx.font = '13px sans-serif';
      ctx.fillText('ILpk=' + fmtA(res.ILpeak) + ' ILval=' + fmtA(Math.max(0, res.ILvalley)), 14, 92);
      ctx.fillText('ΔVout≈' + fmtVsmall(res.deltaVout) + ' Iin_avg=' + fmtA(res.IinAvg), 14, 112);
    }
    tex.needsUpdate = true;
  }
  function drawScopeScreen() {
    const { ctx, canvas, tex } = scopeBox.userData;
    ctx.fillStyle = '#05100c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#12312a'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (canvas.height - 20) / 4; line(ctx, 10, y, canvas.width - 10, y, 1, '#12312a'); }
    const res = curSolveBuck();
    const cycles = 2.2, N = 220;
    const toX = i => 10 + (i / N) * (canvas.width - 20);
    const hi = canvas.height - 24, lo = 20;
    ctx.strokeStyle = '#e8c568'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * cycles;
      const frac = t - Math.floor(t);
      const v = frac < res.D ? hi : lo;
      const x = toX(i);
      if (i === 0) ctx.moveTo(x, v); else ctx.lineTo(x, v);
    }
    ctx.stroke();
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('nodo de conmutación (SW) · D=' + fmtD(res.D) + ' · osciloscopio', 12, canvas.height - 4);
    tex.needsUpdate = true;
  }
  function refreshBenchDyn() { drawFuenteScreen(); drawMedidorScreen(); drawScopeScreen(); }

  // ---------- HUD ----------
  el('hud').innerHTML = `
    <div class="eyebrow">MEC · D2 · Electrónica de potencia</div>
    <div class="h2">Convertidor Reductor (Buck): Ciclo de Trabajo, Rizo de IL y CCM/DCM</div>
    <div class="p">Un convertidor buck reduce un voltaje DC a otro menor abriendo y cerrando un interruptor a alta frecuencia: durante el tiempo de encendido, el inductor almacena energía tomándola de Vin; durante el apagado, un diodo de rueda libre permite que el inductor entregue esa energía a la carga. El balance de energía en estado estable fija el <b>ciclo de trabajo</b> D=Vout/Vin, mientras la corriente del inductor sube y baja en un triángulo cuyo tamaño (<b>rizo ΔIL</b>) depende de L. Si la carga es muy ligera, la corriente puede llegar a cero antes de terminar el ciclo — el convertidor cruza a <b>conducción discontinua (DCM)</b>.</div>
    <div class="formula">D = Vout/Vin · ΔIL = Vout(1−D)/(L·fsw) · Icrit = ΔIL/2</div>
    <div class="legend">
      <span class="li"><span class="dot" style="background:#5fb8ff"></span>D — ciclo de trabajo (lo fija Vout/Vin)</span>
      <span class="li"><span class="dot" style="background:#f59e0b"></span>ΔIL — rizo de corriente del inductor (lo fija L)</span>
      <span class="li"><span class="dot" style="background:#22c55e"></span>Modo — CCM (continua) o DCM (discontinua) según Iout vs Icrit</span>
    </div>
    <div class="fid"><b>SÍ verificado:</b> D=Vout/Vin y ΔIL=Vout(1−D)/(L·fsw) deducidos del balance volt-segundo del inductor en CCM · frontera CCM/DCM en Icrit=ΔIL/2 · ΔVout≈ΔIL/(8Cfsw)+ESR·ΔIL (TI SLVA630A) · IC de referencia LM2596 (TI SNVS124, 150kHz, 3A).<br><b>NO modelado:</b> la relación de conversión real M(D,K) en DCM (Vout deja de ser D·Vin) · pérdidas de conmutación/conducción ni eficiencia (η&lt;100%) · dinámica de lazo cerrado y compensación · tolerancia real de L/C y saturación del inductor.</div>
    <div class="src">Fuentes: TI SLVA477B "Basic Calculation of a Buck Converter's Power Stage" · TI SLVA057 "Understanding Buck Power Stages in Switchmode Power Supplies" · TI SLVA630A "Output Ripple Voltage of Buck Switching Regulators" · hoja de datos LM2596 (TI, SNVS124) · Erickson &amp; Maksimovic, "Fundamentals of Power Electronics"</div>
  `;

  // ---------- Panel ----------
  el('panel').innerHTML = `
    <h4>Buck (LM2596) · <span id="p_mode">Explora</span></h4>
    <div class="modebar">
      <button class="b on" id="btn-mode-explora">🔍 Explora</button>
      <button class="b" id="btn-mode-predice">🧠 Predicción</button>
      <button class="b" id="btn-mode-medicion">📏 Medición</button>
      <button class="b" id="btn-mode-reto">🎯 Reto</button>
    </div>
    <div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
    <div class="btns" style="margin-top:8px">
      <button class="b" id="btnRef" style="flex:1 0 48%">⭐ Punto de referencia</button>
      <button class="b" id="btnDCM" style="flex:1 0 48%">⚠ Forzar DCM</button>
    </div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">
      <div>Vout</div><button class="b" id="voutDec" style="padding:2px 8px">−</button><span id="vVOUT">—</span><button class="b" id="voutInc" style="padding:2px 8px">+</button>
      <div>L</div><button class="b" id="lDec" style="padding:2px 8px">−</button><span id="vL">—</span><button class="b" id="lInc" style="padding:2px 8px">+</button>
      <div>C (salida)</div><button class="b" id="cDec" style="padding:2px 8px">−</button><span id="vC">—</span><button class="b" id="cInc" style="padding:2px 8px">+</button>
      <div>Iout</div><button class="b" id="ioutDec" style="padding:2px 8px">−</button><span id="vIOUT">—</span><button class="b" id="ioutInc" style="padding:2px 8px">+</button>
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
      <button class="b" id="sweepRun" style="width:100%">▶ Ejecutar barrido de Iout</button>
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
    explora: 'Ajusta Vout, L, C e Iout; observa cómo cambian D, el rizo de IL y si el convertidor opera en CCM o DCM. Prueba los atajos Punto de referencia y Forzar DCM.',
    predice: 'Antes de revelar el valor, predice D, el rizo de IL, o si el modo es CCM/DCM con los valores actuales.',
    medicion: 'Ejecuta el barrido automático de Iout y mide cómo el rizo de IL y el modo (CCM/DCM) cambian con la corriente de carga — como con una fuente de carga electrónica y un osciloscopio reales.',
    reto: 'Diseña Vout, Iout, L y C para alcanzar el objetivo asignado en CCM, con un rizo de salida ΔVout menor al 2% de Vout.',
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
    const spans = { vVOUT: fmtV(curVOUT()), vL: fmtL(curL()), vC: fmtCuF(curC()) + '/' + curCEntry().v + 'V', vIOUT: fmtA(curIOUT()) };
    Object.keys(spans).forEach(id => { const s = el(id); if (s) s.textContent = spans[id]; });
  }

  function genPredice() {
    state._revealed = false; state.hide = true;
    const p = Math.random();
    state._predType = p < 0.34 ? 'd' : (p < 0.67 ? 'ripple' : 'mode');
    const box = el('predBox');
    if (state._predType === 'd') {
      box.innerHTML = '<p>Predice el ciclo de trabajo <b>D</b> (%) con Vin=12V y el Vout actual:</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="%" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    } else if (state._predType === 'ripple') {
      box.innerHTML = '<p>Predice el rizo de corriente <b>ΔIL</b> (mA) con los valores actuales de Vout y L:</p>' +
        '<input id="predInput" type="number" step="1" placeholder="mA" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    } else {
      box.innerHTML = '<p>¿El convertidor opera en CCM o DCM con los valores actuales?</p>' +
        '<select id="predSelect" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">' +
        '<option value="ccm">CCM (conducción continua)</option>' +
        '<option value="dcm">DCM (conducción discontinua)</option>' +
        '</select>';
    }
    refreshAll();
  }
  function checkPredice() {
    const res = curSolveBuck();
    let ok, real;
    if (state._predType === 'd') {
      const guess = parseFloat(el('predInput').value);
      real = fmtD(res.D);
      const tol = Math.max(0.15 * res.D * 100, 2);
      ok = !isNaN(guess) && Math.abs(guess - res.D * 100) <= tol;
    } else if (state._predType === 'ripple') {
      const guess = parseFloat(el('predInput').value);
      const realMA = res.deltaIL * 1000;
      real = fmtA(res.deltaIL);
      const tol = Math.max(0.15 * realMA, 5);
      ok = !isNaN(guess) && Math.abs(guess - realMA) <= tol;
    } else {
      real = res.mode === 'CCM' ? 'CCM (conducción continua)' : 'DCM (conducción discontinua)';
      ok = el('predSelect').value === (res.mode === 'CCM' ? 'ccm' : 'dcm');
    }
    state._revealed = true; state.hide = false;
    refreshAll();
    showToast(ok ? '✅ Correcto — valor real: ' + real : '❌ No — valor real: ' + real, ok ? 'ok' : 'warn');
  }

  function newReto() {
    const vi = Math.floor(Math.random() * VOUT_VALS.length);
    const pool = IOUT_VALS.length - 2;
    const ii = 2 + Math.floor(Math.random() * pool);
    state._reto = { vout: VOUT_VALS[vi], iout: IOUT_VALS[ii], rippleMaxPct: 2 };
    el('retoBox').innerHTML = `<p>Objetivo: <b>Vout=${fmtV(state._reto.vout)}</b> a <b>Iout=${fmtA(state._reto.iout)}</b>, en <b>CCM</b>, con rizo de salida ΔVout ≤ <b>2%</b> de Vout. Ajusta Vout e Iout a esos valores, y elige L y C adecuados.</p>`;
    refreshAll();
  }
  function checkReto() {
    const res = curSolveBuck();
    const t = state._reto;
    const voutOk = Math.abs(curVOUT() - t.vout) < 1e-9;
    const ioutOk = Math.abs(curIOUT() - t.iout) < 1e-9;
    const ccmOk = res.mode === 'CCM';
    const ripplePct = res.deltaVout / curVOUT() * 100;
    const rippleOk = ripplePct <= t.rippleMaxPct;
    if (voutOk && ioutOk && ccmOk && rippleOk) {
      showToast(`✅ Diseño válido: Vout=${fmtV(res.Vout)}, Iout=${fmtA(res.Iout)}, ${res.mode}, rizo=${fmtPct(ripplePct)}`, 'ok');
    } else if (!voutOk) {
      showToast(`Ajusta Vout a ${fmtV(t.vout)} (actual: ${fmtV(curVOUT())}).`, 'warn');
    } else if (!ioutOk) {
      showToast(`Ajusta Iout a ${fmtA(t.iout)} (actual: ${fmtA(curIOUT())}).`, 'warn');
    } else if (!ccmOk) {
      showToast(`Estás en DCM (Iout=${fmtA(res.Iout)} < Icrit=${fmtA(res.Icrit)}). Sube L para bajar ΔIL y con ello Icrit.`, 'warn');
    } else {
      showToast(`Rizo de salida ${fmtPct(ripplePct)} > 2%. Sube C, baja la ESR (elige otro capacitor), o sube L para bajar ΔIL.`, 'warn');
    }
  }

  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < IOUT_VALS.length; i++) {
      state.iIOUT = i;
      const res = curSolveBuck();
      state._sweepTrace.push({ iout: IOUT_VALS[i], D: res.D, deltaIL: res.deltaIL, mode: res.mode, deltaVout: res.deltaVout });
      refreshAll();
      await sleep(350);
    }
    updateReport();
  }

  function updateTele() {
    const t = el('telemetry');
    if (!t) return;
    if (state.hide) { t.innerHTML = '<div>D: ? · ΔIL: ? · Modo: ?</div><div style="color:#8FB3AC">Predice antes de revelar.</div>'; return; }
    const res = curSolveBuck();
    const cls = classifyMode(res);
    t.innerHTML = '<div>D: ' + fmtD(res.D) + ' · ΔIL: ' + fmtA(res.deltaIL) + ' · Icrit: ' + fmtA(res.Icrit) + '</div>' +
      '<div style="color:' + cls.color + '">' + cls.label + '</div>' +
      '<div>ILpk: ' + fmtA(res.ILpeak) + ' · ILval: ' + fmtA(Math.max(0, res.ILvalley)) + ' · ΔVout: ' + fmtVsmall(res.deltaVout) + '</div>' +
      '<div style="color:#6a7a80">LM2596: fsw=150kHz típ · Iout_max=3A (no limitan aquí)</div>';
  }
  function updateReport() {
    const rep = el('report');
    if (!rep) return;
    if (state.mode !== 'medicion' || !state._sweepTrace || !state._sweepTrace.length) { rep.innerHTML = ''; return; }
    let rows = state._sweepTrace.map(pt => `<tr><td>${fmtA(pt.iout)}</td><td>${fmtD(pt.D)}</td><td>${fmtA(pt.deltaIL)}</td><td>${pt.mode}</td></tr>`).join('');
    rep.innerHTML = `<table class="repTable"><thead><tr><th>Iout</th><th>D</th><th>ΔIL</th><th>Modo</th></tr></thead><tbody>${rows}</tbody></table>`;
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
    { q: '¿Por qué el ciclo de trabajo ideal de un buck en CCM es D=Vout/Vin?', a: ['Porque en estado estable el balance volt-segundo del inductor exige que el área positiva y negativa de VL(t) sean iguales', 'Porque el diodo fija Vout directamente sin importar Vin', 'Porque D no depende de Vin ni de Vout'], correct: 0 },
    { q: 'Si bajas la corriente de carga Iout dejando L, C y Vout fijos, ¿qué le puede pasar al modo de conducción?', a: ['Nada, siempre queda en CCM', 'Puede cruzar a DCM, porque Icrit=ΔIL/2 no depende de Iout, pero Iout sí puede caer por debajo de Icrit', 'El convertidor deja de funcionar por completo'], correct: 1 },
    { q: '¿Qué reduce más el rizo de salida ΔVout: subir C o bajar la ESR del capacitor?', a: ['Depende de cuál término domine en ΔVout=ΔIL/(8Cfsw)+ESR·ΔIL — si el término de ESR es mayor, bajar la ESR ayuda más que subir C', 'Solo subir C ayuda, la ESR no importa', 'Solo la ESR importa, C no afecta el rizo'], correct: 0 },
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
    const labels = { src: 'Fuente Vin (12V fijo)', cin: 'Cin (entrada)', sw: 'LM2596 — interruptor interno (SW)', diode: 'Diodo de rueda libre (D1)', l: 'Inductor L', cout: 'Cout (salida)', out: 'Vout', load: 'Carga (Iout)' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) { return { cin: cinG, sw: icG, diode: diodeG, l: indG, cout: coutG }[name]; }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (!actor) return;
    const s0 = actor.scale.clone();
    actor.scale.multiplyScalar(1.15);
    setTimeout(() => actor.scale.copy(s0), 220);
  }
  const ACTOR_NAMES = ['cin', 'sw', 'diode', 'l', 'cout'];
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
    state.iVOUT = 3; state.iL = 3; state.iC = 1; state.iIOUT = 6; refreshAll(); await sleep(900);
    state.iIOUT = 0; refreshAll(); await sleep(1000);
    state.iIOUT = 3; refreshAll(); await sleep(400);
    setMode('medicion'); await runSweep();
  }

  // ---------- Wiring ----------
  MODES.forEach(m => { const b = el('btn-mode-' + m); if (b) b.addEventListener('click', () => setMode(m)); });
  function wireStep(id, getIdx, setIdx, max) {
    const dec = el(id + 'Dec'), inc = el(id + 'Inc');
    if (dec) dec.addEventListener('click', () => { setIdx(Math.max(0, getIdx() - 1)); onChange(); });
    if (inc) inc.addEventListener('click', () => { setIdx(Math.min(max, getIdx() + 1)); onChange(); });
  }
  wireStep('vout', () => state.iVOUT, v => state.iVOUT = v, VOUT_VALS.length - 1);
  wireStep('l', () => state.iL, v => state.iL = v, L_VALS.length - 1);
  wireStep('c', () => state.iC, v => state.iC = v, CAP_TABLE.length - 1);
  wireStep('iout', () => state.iIOUT, v => state.iIOUT = v, IOUT_VALS.length - 1);
  el('btnRef').addEventListener('click', () => { state.iVOUT = 3; state.iL = 3; state.iC = 1; state.iIOUT = 6; refreshAll(); showToast('Vout=5V, L=68µH, Cout=220µF/25V, Iout=3A — punto de referencia LM2596', 'info'); });
  el('btnDCM').addEventListener('click', () => { state.iIOUT = 0; refreshAll(); showToast('Iout=0.1A: por debajo de Icrit con L/Vout actuales → DCM', 'warn'); });
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
    state, DEVS, VIN, FSW, VOUT_VALS, L_VALS, IOUT_VALS, CAP_TABLE,
    solveBuck, classifyMode, ilTriangleNaive,
    curSolveBuck,
    setMode, genPredice, checkPredice, newReto, checkReto,
    runSweep, refreshAll,
  };
})();
