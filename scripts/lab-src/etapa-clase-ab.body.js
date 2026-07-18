/**
 * FICHA DE FIDELIDAD — Etapa de salida Clase AB: distorsión de cruce, disipación de potencia y diseño del disipador
 *
 * SÍ verificado:
 * - Análisis estándar de libro de texto de una etapa de salida complementaria
 *   push-pull (par NPN/PNP en seguidor de emisor) manejando una carga
 *   resistiva RL con una señal senoidal de amplitud (voltaje pico) Vo_pk,
 *   alimentada por rieles simétricos ±Vcc: potencia entregada a la carga
 *   P_load=Vo_pk²/(2·RL); potencia total extraída de ambos rieles de
 *   alimentación P_supply=(2/π)·Vcc·Vo_pk/RL (cada riel entrega una
 *   corriente promedio de medio seno rectificado, Ipk/π, durante su medio
 *   ciclo de conducción); potencia disipada en los dos transistores de
 *   salida combinados P_diss=P_supply−P_load — deducción estándar de
 *   Sedra & Smith, "Microelectronic Circuits", capítulo de etapas de
 *   salida y amplificadores de potencia (análisis de la etapa Clase B/AB);
 *   confirmada de forma cruzada en Boylestad, "Electronic Devices and
 *   Circuit Theory", sección de amplificadores de potencia Clase B.
 * - El punto de PEOR CASO de disipación NO ocurre a swing completo
 *   (Vo_pk=Vcc) sino en Vo_pk=2Vcc/π≈0.637·Vcc, obtenido al derivar
 *   P_diss(Vo_pk) respecto a Vo_pk e igualar a cero (P_diss es una
 *   parábola invertida en Vo_pk, no una función monótona) — con disipación
 *   máxima total P_diss_max=2·Vcc²/(π²·RL), la mitad para cada transistor
 *   — misma fuente (Sedra & Smith), verificado numéricamente en este
 *   simulador que P_diss(Vo_pk=2Vcc/π) efectivamente excede a P_diss en
 *   Vo_pk=Vcc y en cualquier otro punto del rango 0<Vo_pk≤Vcc.
 * - Circuito multiplicador de VBE ("bias spreader") para polarizar la
 *   etapa de salida en Clase AB: un transistor con dos resistores R1
 *   (colector-base) y R2 (base-emisor) fija un voltaje colector-emisor
 *   V_CE=VBE·(1+R1/R2) que sigue térmicamente al VBE de los transistores
 *   de salida (mismo coeficiente térmico negativo, cancelando la deriva
 *   térmica de la corriente de reposo) — Sedra & Smith y Boylestad, misma
 *   sección; ampliamente documentado en notas de aplicación de
 *   amplificadores de audio Clase AB.
 * - El compromiso central de la polarización Clase AB: con polarización
 *   insuficiente (V_bias por debajo de ≈2×VBE_on, aprox. 1.2V para
 *   silicio) ningún transistor conduce cerca del cruce por cero →
 *   distorsión de cruce (zona muerta en la curva de transferencia
 *   entrada-salida); con polarización excesiva, ambos transistores
 *   conducen una corriente de reposo alta incluso sin señal, disipando
 *   calor adicional de forma continua (acercándose a Clase A) — concepto
 *   estándar presente en ambos textos citados.
 * - Cadena de resistencia térmica de la unión al ambiente:
 *   Tj=Ta+P·(RθJC+RθCS+RθSA) cuando se usa disipador (suma en serie de
 *   unión-a-cápsula, cápsula-a-disipador e interfaz, y disipador-a-
 *   ambiente), o Tj=Ta+P·RθJA cuando el transistor opera sin disipador
 *   (resistencia térmica unión-a-ambiente directa) — modelo estándar de
 *   diseño térmico de semiconductores de potencia, documentado en
 *   cualquier hoja de datos de un transistor de potencia en TO-220 y en
 *   notas de aplicación de gestión térmica (p. ej. ON Semiconductor,
 *   "Thermal Resistance — Theory and Practice").
 * - Valores de referencia del par complementario TIP31C/TIP32C (ON
 *   Semiconductor, TO-220): RθJC=3.125 °C/W, RθJA (sin disipador)=62.5
 *   °C/W, Tj_max=150 °C — cifras publicadas en la hoja de datos del
 *   fabricante, usadas aquí como par de referencia representativo de un
 *   transistor de potencia genérico en TO-220 para una etapa de salida de
 *   audio de baja/media potencia.
 * - JEDEC JESD51 (familia de estándares para la caracterización térmica
 *   de componentes de semiconductor en condiciones de convección natural)
 *   frente a JESD51-14 (método específico de "doble interfaz transitoria"
 *   para medir RθJC de forma directa, más preciso que estimarlo a partir
 *   de mediciones de RθJA): la distinción importa porque un RθJC de hoja
 *   de datos medido con metodologías distintas no siempre es directamente
 *   comparable — estándares JEDEC, citados por nombre.
 *
 * NO modelado:
 * - La física exponencial completa de Ebers-Moll de la unión base-emisor:
 *   la corriente de reposo (ICQ) asociada a cada nivel de polarización de
 *   este simulador es una cifra ilustrativa y representativa del
 *   compromiso cualitativo (más V_bias → más ICQ → más calor de reposo),
 *   NO derivada de un cálculo exponencial real ni de resistores de
 *   emisor (degeneración) específicos — un diseño real requiere elegir
 *   resistores de emisor y verificar ICQ con las curvas reales del
 *   transistor.
 * - Fuga térmica (thermal runaway): el acoplamiento térmico real entre la
 *   temperatura de unión creciente y el aumento de ICQ (que a su vez
 *   incrementa la disipación, en un lazo potencialmente inestable sin
 *   compensación) no se simula — este simulador calcula Tj en estado
 *   estable para una ICQ fija, no una dinámica térmica realimentada.
 * - Distorsión armónica más allá de la zona muerta de cruce: no se
 *   modelan otras no-linealidades (saturación, corte, ganancia finita del
 *   transistor, ancho de banda).
 * - Pérdidas de conmutación (no aplica: es una etapa lineal, no
 *   conmutada) ni impedancia de salida finita del seguidor de emisor.
 * - Tolerancia real de fabricación de RθJC entre unidades, envejecimiento
 *   de la interfaz térmica, ni la resistencia de contacto real de una
 *   pasta/almohadilla térmica específica.
 *
 * Nota de rigor:
 * - RθCS (cápsula-a-disipador) se modela con un valor representativo fijo
 *   de 1.0 °C/W (interfaz típica con almohadilla/pasta térmica en TO-220),
 *   no una cifra de un producto específico — consulta siempre la hoja de
 *   datos del material de interfaz térmica real.
 * - Regla de honestidad: no se inventan cifras de ICQ ni de Tj_max de un
 *   dispositivo que no esté citado; el umbral de seguridad usado en el
 *   modo Reto (Tj≤130 °C, con margen de 20 °C bajo Tj_max=150 °C) es una
 *   decisión pedagógica explícita de margen de diseño, no una
 *   especificación de fabricante.
 *
 * Fuentes:
 * - Adel S. Sedra y Kenneth C. Smith, "Microelectronic Circuits" — cap.
 *   de etapas de salida y amplificadores de potencia (análisis Clase
 *   B/AB, multiplicador de VBE, peor caso de disipación en Vo_pk=2Vcc/π)
 * - Robert L. Boylestad y Louis Nashelsky, "Electronic Devices and
 *   Circuit Theory" — sección de amplificadores de potencia Clase B
 * - ON Semiconductor, hoja de datos TIP31C/TIP32C — RθJC, RθJA, Tj_max
 * - ON Semiconductor, nota de aplicación "Thermal Resistance — Theory and
 *   Practice" — cadena de resistencia térmica Tj=Ta+P·ΣRθ
 * - JEDEC, familia de estándares JESD51 (caracterización térmica) y
 *   JESD51-14 (método de doble interfaz transitoria para RθJC)
 */
(function () {
  'use strict';
  const mount = document.getElementById('stage');
  const S = createStage(mount, { cam: [3.4, 2.6, 7.6], target: [0.5, 1.2, 0.3], bgTop: '#170e0a', bgBot: '#04060a', bloom: 0.35, minD: 3.0, maxD: 18 });
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

  // ---------- Dispositivo de referencia ----------
  const DEV = {
    name: 'TIP31C / TIP32C (par complementario NPN/PNP, TO-220, ON Semiconductor)',
    note: 'Par de referencia representativo de una etapa de salida de audio de baja/media potencia. RθJC, RθJA y Tj_max tomados de la hoja de datos del fabricante — consulta siempre la hoja de datos vigente del transistor real elegido.',
  };
  const VBE = 0.65; // V, caída base-emisor representativa de silicio
  const RTH_JC = 3.125; // °C/W — TIP31C/TIP32C, hoja de datos ON Semiconductor
  const RTH_CS = 1.0;   // °C/W — interfaz térmica representativa (pasta/almohadilla)
  const RTH_JA_NO_HS = 62.5; // °C/W — TIP31C/TIP32C sin disipador, hoja de datos
  const TJ_MAX = 150;   // °C — representativo (consulta la hoja de datos: algunos dispositivos llegan a 175–200 °C)
  const TJ_SAFE_MAX = 130; // °C — umbral de diseño con margen (20 °C bajo Tj_max), usado en el modo Reto
  const DEADZONE_THRESHOLD = 1.2; // V — bias total mínimo (≈2×VBE_on) para eliminar la distorsión de cruce

  // ---------- Física ----------
  function solveClaseAB(Vcc, RL, VoPkFrac, bias, heatsink, Ta) {
    const VoPk = VoPkFrac * Vcc;
    const Pload = (VoPk * VoPk) / (2 * RL);
    const Psupply = (2 / Math.PI) * Vcc * VoPk / RL;
    const PdissSignalTotal = Math.max(0, Psupply - Pload);
    const Pq = bias.vbeTotal * bias.icq;
    const PdissTotalBoth = PdissSignalTotal + Pq;
    const PdissEach = PdissTotalBoth / 2;

    const VoPkWorst = 2 * Vcc / Math.PI;
    const PloadWorst = (VoPkWorst * VoPkWorst) / (2 * RL);
    const PsupplyWorst = (2 / Math.PI) * Vcc * VoPkWorst / RL;
    const PdissSignalWorstTotal = PsupplyWorst - PloadWorst;
    const PdissWorstBoth = PdissSignalWorstTotal + Pq;
    const PdissWorstEach = PdissWorstBoth / 2;

    const RthTotal = heatsink.rsa == null ? RTH_JA_NO_HS : (RTH_JC + RTH_CS + heatsink.rsa);
    const Tj = Ta + PdissEach * RthTotal;
    const TjWorst = Ta + PdissWorstEach * RthTotal;
    const distortion = bias.vbeTotal < DEADZONE_THRESHOLD;
    const deadzoneV = Math.max(0, DEADZONE_THRESHOLD - bias.vbeTotal);

    return {
      Vcc, RL, VoPkFrac, VoPk, Pload, Psupply, PdissSignalTotal, Pq, PdissTotalBoth, PdissEach,
      VoPkWorst, PdissWorstBoth, PdissWorstEach, RthTotal, Ta, Tj, TjWorst, distortion, deadzoneV,
    };
  }
  function pdissEachAtFrac(Vcc, RL, frac, bias) {
    const VoPk = frac * Vcc;
    const Pload = (VoPk * VoPk) / (2 * RL);
    const Psupply = (2 / Math.PI) * Vcc * VoPk / RL;
    const PdissSignalTotal = Math.max(0, Psupply - Pload);
    return (PdissSignalTotal + bias.vbeTotal * bias.icq) / 2;
  }
  function classifyTj(tj) {
    if (tj >= TJ_MAX) return { key: 'danger', label: 'PELIGRO — Tj ≥ Tj_max (' + TJ_MAX + ' °C)', color: '#ef4444' };
    if (tj >= TJ_SAFE_MAX) return { key: 'caution', label: 'Precaución — poco margen bajo Tj_max', color: '#eab308' };
    return { key: 'safe', label: 'Seguro — margen saludable bajo Tj_max', color: '#22c55e' };
  }
  function transferCurve(VoPk, deadzoneV, N) {
    N = N || 100;
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const vin = -VoPk + (2 * VoPk) * (i / N);
      let vout;
      if (Math.abs(vin) <= deadzoneV / 2) vout = 0;
      else vout = vin - Math.sign(vin) * (deadzoneV / 2);
      pts.push({ vin, vout });
    }
    return pts;
  }

  function fmtV(v) { return v.toFixed(v >= 10 ? 1 : 2) + ' V'; }
  function fmtW(w) { return w < 1 ? (w * 1000).toFixed(0) + ' mW' : w.toFixed(2) + ' W'; }
  function fmtOhm(r) { return (Number.isInteger(r) ? r.toFixed(0) : r.toFixed(2)) + ' Ω'; }
  function fmtRth(r) { return r.toFixed(2) + ' °C/W'; }
  function fmtC(t) { return t.toFixed(1) + ' °C'; }
  function fmtPct(p) { return p.toFixed(1) + ' %'; }
  function fmtA(a) { return a >= 1 ? a.toFixed(2) + ' A' : (a * 1000).toFixed(0) + ' mA'; }

  // ---------- Estado ----------
  const VCC_VALS = [12, 15, 18, 24, 28, 35, 40];
  const RL_VALS = [4, 8, 16, 32, 100];
  const VOPK_FRAC_VALS = [0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.637, 0.7, 0.8, 0.9];
  const BIAS_VALS = [
    { label: 'Bases unidas (Clase B pura, sin red)', short: 'Sin red', vbeTotal: 0, icq: 0, r1: null, r2: 1000 },
    { label: 'Multiplicador VBE, R1=0 (mínimo)', short: 'Mínimo', vbeTotal: 0.65, icq: 0.003, r1: 0, r2: 1000 },
    { label: 'Multiplicador VBE, R1=R2 (nominal AB)', short: 'Nominal AB', vbeTotal: 1.30, icq: 0.025, r1: 1000, r2: 1000 },
    { label: 'Multiplicador VBE, R1=2·R2 (sobre-polarizado)', short: 'Sobre-polarizado', vbeTotal: 1.95, icq: 0.070, r1: 2000, r2: 1000 },
    { label: 'Multiplicador VBE, R1=3·R2 (excesivo)', short: 'Excesivo', vbeTotal: 2.60, icq: 0.150, r1: 3000, r2: 1000 },
  ];
  const HEATSINK_VALS = [
    { label: 'Sin disipador (TO-220 libre)', short: 'Sin disipador', rsa: null, finN: 0 },
    { label: 'Pequeño (clip-on)', short: 'Pequeño', rsa: 20, finN: 3 },
    { label: 'Mediano (perfil de aluminio)', short: 'Mediano', rsa: 8, finN: 5 },
    { label: 'Grande (perfil extruido + pasta térmica)', short: 'Grande', rsa: 3, finN: 7 },
    { label: 'Grande + ventilador forzado', short: 'Grande+fan', rsa: 1.2, finN: 7 },
  ];
  const TA = 25; // °C, ambiente de referencia estándar de hoja de datos

  const state = {
    iVCC: 3, iRL: 1, iVoPk: 1, iBias: 2, iHS: 2,
    mode: 'explora', hide: false, _revealed: false,
    _sweepTrace: null, _predType: 'pdiss', _reto: null,
  };

  function curVCC() { return VCC_VALS[state.iVCC]; }
  function curRL() { return RL_VALS[state.iRL]; }
  function curVoPkFrac() { return VOPK_FRAC_VALS[state.iVoPk]; }
  function curBias() { return BIAS_VALS[state.iBias]; }
  function curHS() { return HEATSINK_VALS[state.iHS]; }
  function curSolve() { return solveClaseAB(curVCC(), curRL(), curVoPkFrac(), curBias(), curHS(), TA); }

  // ---------- Materiales y geometría 3D ----------
  const MAT = {
    lead: { color: 0xc7c7c7, roughness: 0.35, metalness: 0.8 },
    to220Body: { color: 0x1c1c1c, roughness: 0.55, metalness: 0.2 },
    tab: { color: 0xc7c7c7, roughness: 0.3, metalness: 0.85 },
    heatBase: { color: 0x9aa0a6, roughness: 0.4, metalness: 0.7 },
    heatFin: { color: 0xb7bcc2, roughness: 0.4, metalness: 0.7 },
    resBody: { color: 0xc9a66b, roughness: 0.6, metalness: 0.1 },
    to92Body: { color: 0x2b2b2b, roughness: 0.6, metalness: 0.2 },
  };
  function std(spec) { return new THREE.MeshStandardMaterial(spec); }

  function makeTO220_3D(bodyColor) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.BoxGeometry(0.15, 0.2, 0.05), std({ color: bodyColor || MAT.to220Body.color, roughness: 0.55, metalness: 0.2 }));
    g.add(body);
    const tab = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.09, 0.015), std(MAT.tab));
    tab.position.set(0, 0.13, -0.02);
    g.add(tab);
    for (let i = -1; i <= 1; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.14, 8), std(MAT.lead));
      leg.position.set(i * 0.045, -0.17, 0.02);
      g.add(leg);
    }
    g.userData.body = body;
    return g;
  }
  function makeHeatsink3D() {
    const g = new THREE.Group();
    const base = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.06, 0.42), std(MAT.heatBase));
    g.add(base);
    const fins = [];
    const n = 7;
    for (let i = 0; i < n; i++) {
      const fin = new THREE.Mesh(new THREE.BoxGeometry(0.55, 0.24, 0.025), std(MAT.heatFin));
      fin.position.set(0, 0.15, -0.19 + i * (0.38 / (n - 1)));
      g.add(fin);
      fins.push(fin);
    }
    const fan = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.16, 0.04, 20), std({ color: 0x2b2f36, roughness: 0.6, metalness: 0.3 }));
    fan.rotation.x = Math.PI / 2;
    fan.position.set(0, 0.15, 0.32);
    fan.visible = false;
    g.add(fan);
    g.userData = { base, fins, fan };
    return g;
  }
  function makeTO92_3D() {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.07, 16), std(MAT.to92Body));
    g.add(body);
    for (let i = -1; i <= 1; i++) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.005, 0.005, 0.09, 6), std(MAT.lead));
      leg.position.set(i * 0.022, -0.075, 0);
      g.add(leg);
    }
    g.userData.body = body;
    return g;
  }
  function makeResistor3D(bandColor) {
    const g = new THREE.Group();
    const body = new THREE.Mesh(new THREE.CylinderGeometry(0.032, 0.032, 0.15, 16), std(MAT.resBody));
    body.rotation.z = Math.PI / 2;
    g.add(body);
    const band = new THREE.Mesh(new THREE.CylinderGeometry(0.034, 0.034, 0.014, 16), std({ color: bandColor || 0x333333, roughness: 0.5, metalness: 0.2 }));
    band.rotation.z = Math.PI / 2;
    band.position.x = 0.035;
    g.add(band);
    for (let s = -1; s <= 1; s += 2) {
      const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.07, 8), std(MAT.lead));
      leg.rotation.z = Math.PI / 2;
      leg.position.x = s * 0.11;
      g.add(leg);
    }
    g.userData.body = body;
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
  function transistorGlyph(ctx, x, y, kind, col) {
    ctx.strokeStyle = col || '#5fb8ff'; ctx.lineWidth = 2;
    ctx.beginPath(); ctx.arc(x, y, 22, 0, Math.PI * 2); ctx.stroke();
    line(ctx, x - 10, y - 14, x - 10, y + 14, 2, col);
    line(ctx, x - 10, y - 5, x + 14, y - 16, 2, col);
    const dir = kind === 'npn' ? 1 : -1;
    line(ctx, x - 10, y + 5, x + 14, y + 16, 2, col);
    ctx.beginPath();
    const ax = x + (dir > 0 ? 14 : 0.6), ay = y + (dir > 0 ? 16 : 5.6);
    ctx.moveTo(ax, ay);
    ctx.lineTo(ax - dir * 7, ay - 3); ctx.lineTo(ax - dir * 2, ay + 7); ctx.closePath();
    ctx.fillStyle = col; ctx.fill();
    ctx.fillStyle = col; ctx.font = 'bold 11px sans-serif';
    ctx.fillText(kind.toUpperCase(), x + 26, y + 4);
  }

  // ---------- Layout ----------
  const PX0 = 40, PX1 = 620, PY0 = 40, PY1 = 460;
  const GX0 = 660, GX1 = 1000, GY0 = 40, GY1 = 460;
  const IN_X = 90, IN_Y = 250;
  const RAIL_TOP_Y = 80, RAIL_BOT_Y = 430;
  const BIAS_X = 200;
  const Q1_X = 420, Q1_Y = 150;
  const Q2_X = 420, Q2_Y = 350;
  const OUT_X = 520, OUT_Y = 250;
  const LOAD_X = 580;

  let HIT = [];
  function addHit(id, x, y, w, h, label) { HIT.push({ id, x, y, w, h, label }); }

  function drawSchematic(ctx) {
    HIT = [];
    ctx.clearRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(PX0 - 10, PY0 - 10, PX1 - PX0 + 20, PY1 - PY0 + 20);
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 14px sans-serif';
    ctx.fillText('ETAPA DE SALIDA CLASE AB — PAR COMPLEMENTARIO TIP31C/TIP32C', PX0 + 10, PY0 + 14);

    // Rieles
    line(ctx, PX0 + 20, RAIL_TOP_Y, PX1 - 20, RAIL_TOP_Y, 2, '#5fb8ff');
    ctx.fillStyle = '#5fb8ff'; ctx.font = '12px sans-serif'; ctx.fillText('+Vcc = ' + fmtV(curVCC()), PX0 + 24, RAIL_TOP_Y - 8);
    line(ctx, PX0 + 20, RAIL_BOT_Y, PX1 - 20, RAIL_BOT_Y, 2, '#f59e0b');
    ctx.fillStyle = '#f59e0b'; ctx.fillText('−Vcc = −' + fmtV(curVCC()), PX0 + 24, RAIL_BOT_Y + 18);

    // Entrada
    line(ctx, IN_X, IN_Y - 40, IN_X, IN_Y + 40, 2, '#c084fc');
    line(ctx, IN_X - 20, IN_Y, IN_X, IN_Y, 2, '#c084fc');
    ctx.fillStyle = '#c084fc'; ctx.fillText('Vin', IN_X - 34, IN_Y - 46);
    addHit('in', IN_X - 20, IN_Y - 40, 40, 80, 'Entrada de señal Vin');

    // Red de polarización (multiplicador VBE)
    line(ctx, IN_X, IN_Y - 40, BIAS_X, RAIL_TOP_Y + 25, 2, '#c084fc');
    line(ctx, IN_X, IN_Y + 40, BIAS_X, RAIL_BOT_Y - 25, 2, '#c084fc');
    ctx.strokeStyle = '#c084fc'; ctx.lineWidth = 2; ctx.strokeRect(BIAS_X - 26, RAIL_TOP_Y + 25, 52, RAIL_BOT_Y - 25 - (RAIL_TOP_Y + 25));
    ctx.fillStyle = '#c084fc'; ctx.font = 'bold 11px sans-serif'; ctx.fillText('Multiplic.', BIAS_X - 24, IN_Y - 4);
    ctx.fillText('VBE', BIAS_X - 14, IN_Y + 10);
    ctx.font = '11px sans-serif'; ctx.fillText(curBias().short, BIAS_X - 30, IN_Y + 28);
    addHit('bias', BIAS_X - 26, RAIL_TOP_Y + 25, 52, RAIL_BOT_Y - 25 - (RAIL_TOP_Y + 25), 'Red de polarización (multiplicador VBE)');
    line(ctx, BIAS_X, RAIL_TOP_Y + 25, BIAS_X, RAIL_TOP_Y, 2, '#c084fc');
    line(ctx, BIAS_X, RAIL_BOT_Y - 25, BIAS_X, RAIL_BOT_Y, 2, '#c084fc');

    // Q1 (NPN, superior)
    line(ctx, BIAS_X, RAIL_TOP_Y + 25, Q1_X - 22, Q1_Y, 2, '#5fb8ff');
    line(ctx, Q1_X, Q1_Y - 22, Q1_X, RAIL_TOP_Y, 2, '#5fb8ff');
    transistorGlyph(ctx, Q1_X, Q1_Y, 'npn', '#5fb8ff');
    addHit('npn', Q1_X - 24, Q1_Y - 24, 60, 48, 'Q1 — TIP31C (NPN, mitad superior del ciclo)');

    // Q2 (PNP, inferior)
    line(ctx, BIAS_X, RAIL_BOT_Y - 25, Q2_X - 22, Q2_Y, 2, '#f59e0b');
    line(ctx, Q2_X, Q2_Y + 22, Q2_X, RAIL_BOT_Y, 2, '#f59e0b');
    transistorGlyph(ctx, Q2_X, Q2_Y, 'pnp', '#f59e0b');
    addHit('pnp', Q2_X - 24, Q2_Y - 24, 60, 48, 'Q2 — TIP32C (PNP, mitad inferior del ciclo)');

    // Nodo de salida (emisores unidos)
    line(ctx, Q1_X, Q1_Y + 22, Q1_X, OUT_Y, 2, '#8fe3d0');
    line(ctx, Q2_X, Q2_Y - 22, Q2_X, OUT_Y, 2, '#8fe3d0');
    line(ctx, Q1_X, OUT_Y, OUT_X, OUT_Y, 2, '#8fe3d0');
    ctx.fillStyle = '#8fe3d0'; ctx.font = '12px sans-serif'; ctx.fillText('Vout', OUT_X - 14, OUT_Y - 10);

    // Carga
    line(ctx, LOAD_X, OUT_Y, LOAD_X, OUT_Y + 40, 2, '#8fe3d0');
    vResistorGlyph(ctx, LOAD_X, OUT_Y + 40, 70, '#8fe3d0');
    addHit('rl', LOAD_X - 8, OUT_Y + 40, 16, 70, 'Carga RL');
    ctx.fillStyle = '#8fe3d0'; ctx.fillText('RL=' + fmtOhm(curRL()), LOAD_X + 12, OUT_Y + 78);
    line(ctx, LOAD_X, OUT_Y + 110, LOAD_X, RAIL_BOT_Y, 2, '#8fe3d0');
    groundGlyph(ctx, LOAD_X, RAIL_BOT_Y);

    // Disipador (glifo simple sobre Q1/Q2)
    ctx.strokeStyle = '#9aa0a6'; ctx.lineWidth = 2;
    ctx.strokeRect(Q1_X - 40, Q1_Y - 46, 80, Q2_Y - Q1_Y + 92);
    addHit('heatsink', Q1_X - 40, Q1_Y - 46, 80, Q2_Y - Q1_Y + 92, 'Disipador (' + curHS().short + ')');
    ctx.fillStyle = '#9aa0a6'; ctx.font = '10px sans-serif'; ctx.fillText('disipador: ' + curHS().short, Q1_X - 38, Q2_Y + 62);

    if (state.hide) {
      ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = '#556677';
      ctx.fillText('Vo_pk / Pdiss / Tj ocultos — predice antes de revelar', PX0 + 10, PY1 - 12);
    } else {
      const res = curSolve();
      const cls = classifyTj(res.Tj);
      ctx.font = 'bold 13px sans-serif'; ctx.fillStyle = cls.color;
      ctx.fillText('Vo_pk=' + fmtV(res.VoPk) + ' · Pdiss(c/u)=' + fmtW(res.PdissEach) + ' · Tj=' + fmtC(res.Tj) + ' · ' + cls.label, PX0 + 10, PY1 - 12);
    }
  }

  // ---------- Gráfica: curva de transferencia (cruce) + Pdiss vs Vo_pk ----------
  const XFER_Y0 = 60, XFER_Y1 = 250;
  const PCURVE_Y0 = 290, PCURVE_Y1 = 440;
  const GXA = GX0 + 55, GXB = GX1 - 15;

  function drawGraph(ctx) {
    ctx.clearRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    ctx.fillStyle = '#0b1310'; ctx.fillRect(GX0 - 10, GY0 - 10, GX1 - GX0 + 20, GY1 - GY0 + 20);
    const res = curSolve();

    // ---------- Curva de transferencia (distorsión de cruce) — escaffold seguro ----------
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('Curva de transferencia Vout(Vin) — zona muerta de cruce', GXA, XFER_Y0 - 8);
    const half = XFER_Y1 - XFER_Y0;
    const xMid = (GXA + GXB) / 2, yMid = XFER_Y0 + half / 2;
    const scaleX = (GXB - GXA) / 2 / Math.max(res.VoPk, 0.01);
    const scaleY = (half / 2) / Math.max(res.VoPk, 0.01);
    line(ctx, GXA, yMid, GXB, yMid, 1, '#233532');
    line(ctx, xMid, XFER_Y0, xMid, XFER_Y1, 1, '#233532');
    ctx.setLineDash([2, 3]);
    line(ctx, GXA, XFER_Y0 + (half - (half)), GXB, XFER_Y0, 1, '#2a3d38');
    ctx.strokeStyle = '#3a4d47'; ctx.beginPath(); ctx.moveTo(GXA, XFER_Y1); ctx.lineTo(GXB, XFER_Y0); ctx.stroke();
    ctx.setLineDash([]);

    // ---------- Pdiss(Vo_pk) — escaffold seguro (ejes + marca de peor caso, sin magnitud) ----------
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('Disipación por transistor vs amplitud de salida Vo_pk', GXA, PCURVE_Y0 - 8);
    const xFrac = f => GXA + f * (GXB - GXA);
    line(ctx, GXA, PCURVE_Y1, GXB, PCURVE_Y1, 1, '#233532');
    line(ctx, GXA, PCURVE_Y0, GXA, PCURVE_Y1, 1, '#233532');
    // Marca del peor caso teórico (2Vcc/π ≈ 0.637) — sólo posición en x, depende de Vcc/RL (visibles), no de Pdiss
    const xWorst = xFrac(2 / Math.PI);
    ctx.setLineDash([3, 3]); line(ctx, xWorst, PCURVE_Y0, xWorst, PCURVE_Y1, 1, '#eab308'); ctx.setLineDash([]);
    ctx.fillStyle = '#eab308'; ctx.font = 'bold 11px sans-serif';
    ctx.fillText('peor caso: Vo_pk=2Vcc/π≈0.637·Vcc', xWorst - 90, PCURVE_Y0 - 8 + 20);

    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = 'bold 12px sans-serif';
      ctx.fillText('Curva y distorsión ocultas — predice antes de revelar', GXA + 4, yMid + 4);
      ctx.fillText('Curva de Pdiss oculta — predice antes de revelar', GXA + 4, (PCURVE_Y0 + PCURVE_Y1) / 2);
      return;
    }

    const pts = transferCurve(res.VoPk, res.deadzoneV, 100);
    ctx.strokeStyle = res.distortion ? '#ef4444' : '#22c55e'; ctx.lineWidth = 2;
    ctx.beginPath();
    pts.forEach((p, i) => {
      const x = xMid + p.vin * scaleX, y = yMid - p.vout * scaleY;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    });
    ctx.stroke();
    ctx.fillStyle = res.distortion ? '#ef4444' : '#22c55e'; ctx.font = 'bold 12px sans-serif';
    ctx.fillText(res.distortion ? 'Distorsión de cruce presente (zona muerta ≈' + fmtV(res.deadzoneV) + ')' : 'Sin distorsión de cruce', GXA + 4, XFER_Y0 + 14);

    const pMaxDisplay = pdissEachAtFrac(res.Vcc, res.RL, 2 / Math.PI, curBias()) * 1.15;
    const yP = p => PCURVE_Y1 - Math.min(1, p / Math.max(pMaxDisplay, 1e-9)) * (PCURVE_Y1 - PCURVE_Y0);
    ctx.strokeStyle = '#8fe3d0'; ctx.lineWidth = 2; ctx.beginPath();
    for (let i = 0; i <= 60; i++) {
      const f = i / 60;
      const p = pdissEachAtFrac(res.Vcc, res.RL, f, curBias());
      const x = xFrac(f), y = yP(p);
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    // Punto de operación actual
    const xCur = xFrac(res.VoPkFrac), yCur = yP(res.PdissEach);
    ctx.fillStyle = '#5fb8ff'; ctx.beginPath(); ctx.arc(xCur, yCur, 5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#EAF4F1'; ctx.font = '11px sans-serif';
    ctx.fillText('Pdiss actual (c/u): ' + fmtW(res.PdissEach) + ' a Vo_pk=' + fmtPct(res.VoPkFrac * 100) + ' de Vcc', GXA + 4, PCURVE_Y1 + 18);
    ctx.fillText('Pdiss peor caso (c/u): ' + fmtW(res.PdissWorstEach), GXA + 4, PCURVE_Y1 + 34);

    // Traza del barrido (modo Medición)
    if (state._sweepTrace && state._sweepTrace.length) {
      ctx.fillStyle = '#c084fc';
      state._sweepTrace.forEach(pt => {
        const x = xFrac(pt.frac), y = yP(pt.pdiss);
        ctx.beginPath(); ctx.arc(x, y, 3, 0, Math.PI * 2); ctx.fill();
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
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(4.4, 0.12, 1.8), std({ color: 0x2b2f36, roughness: 0.85, metalness: 0.1 }));
  mesa.position.set(0.5, 0.55, 1.0);
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(3.2, 0.03, 1.2), std({ color: 0x0e4d33, roughness: 0.7, metalness: 0.1 }));
  pcb.position.set(0.5, 0.62, 1.0);
  benchG.add(mesa, pcb);

  const heatG = makeHeatsink3D(); heatG.position.set(-0.35, 0.68, 1.0); benchG.add(heatG);
  const npnG = makeTO220_3D(0x1c1c1c); npnG.position.set(-0.55, 0.86, 1.05); npnG.rotation.z = 0.05; benchG.add(npnG);
  const pnpG = makeTO220_3D(0x241414); pnpG.position.set(-0.16, 0.86, 1.05); pnpG.rotation.z = -0.05; benchG.add(pnpG);
  const biasG = makeTO92_3D(); biasG.position.set(0.45, 0.72, 1.0); benchG.add(biasG);
  const r1G = makeResistor3D(0xd4a017); r1G.position.set(0.68, 0.72, 1.0); benchG.add(r1G);
  const r2G = makeResistor3D(0x8a2be2); r2G.position.set(0.9, 0.72, 1.0); benchG.add(r2G);
  const rlG = makeResistor3D(0x2255aa); rlG.position.set(1.5, 0.72, 1.0); benchG.add(rlG);
  S.scene.add(benchG);

  function refreshBenchSel() {
    const hs = curHS();
    heatG.visible = hs.rsa != null;
    if (hs.rsa != null) {
      const idx = state.iHS;
      const scale = [null, 0.55, 0.8, 1.05, 1.05][idx];
      heatG.scale.setScalar(scale);
      heatG.userData.fan.visible = idx === 4;
    }
    const rlScale = 0.7 + Math.min(0.5, curRL() / 100 * 0.5);
    rlG.scale.setScalar(rlScale);
    const b = curBias();
    const r1Scale = b.r1 == null ? 0.01 : 0.6 + Math.min(0.6, b.r1 / 3000 * 0.6);
    r1G.scale.setScalar(r1Scale);
    r1G.visible = b.r1 !== null;
  }

  const fuenteBox = makeDisplayBox(0.7, 0.42, 0.06, 220, 132);
  fuenteBox.position.set(-1.9, 0.95, 1.0); fuenteBox.rotation.y = 0.06 * Math.PI;
  const medidorBox = makeDisplayBox(0.7, 0.5, 0.06, 220, 156);
  medidorBox.position.set(2.6, 0.98, 1.0); medidorBox.rotation.y = -0.06 * Math.PI;
  const scopeBox = makeDisplayBox(1.0, 0.62, 0.06, 260, 160);
  scopeBox.position.set(0.6, 1.42, 0.62); scopeBox.rotation.x = -0.06 * Math.PI;
  benchG.add(fuenteBox, medidorBox, scopeBox);

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

  function drawFuenteScreen() {
    const { ctx, canvas, tex } = fuenteBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.fillStyle = '#8fe3d0'; ctx.font = 'bold 16px sans-serif';
    ctx.fillText('Vcc=±' + fmtV(curVCC()) + '  RL=' + fmtOhm(curRL()), 14, 30);
    ctx.font = '13px sans-serif';
    ctx.fillText('Vo_pk=' + fmtPct(curVoPkFrac() * 100) + ' de Vcc', 14, 54);
    ctx.fillText('Polarización: ' + curBias().short, 14, 74);
    ctx.fillText('Disipador: ' + curHS().short, 14, 94);
    tex.needsUpdate = true;
  }
  function drawMedidorScreen() {
    const { ctx, canvas, tex } = medidorBox.userData;
    ctx.fillStyle = '#0b1310'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = '13px sans-serif';
    if (state.hide) {
      ctx.fillStyle = '#6b8a83'; ctx.font = 'bold 18px sans-serif';
      ctx.fillText('Pdiss: ?  Tj: ?', 14, 40);
      ctx.fillText('¿distorsión de cruce?', 14, 66);
    } else {
      const res = curSolve();
      const cls = classifyTj(res.Tj);
      ctx.fillStyle = '#5fb8ff'; ctx.fillText('Pdiss (c/u) = ' + fmtW(res.PdissEach), 14, 26);
      ctx.fillStyle = '#f59e0b'; ctx.fillText('Tj = ' + fmtC(res.Tj), 14, 46);
      ctx.fillStyle = cls.color; ctx.font = 'bold 13px sans-serif'; ctx.fillText(cls.label, 14, 68, 200);
      ctx.fillStyle = '#8fe3d0'; ctx.font = '13px sans-serif';
      ctx.fillText('RθTotal=' + fmtRth(res.RthTotal), 14, 92);
      ctx.fillText(res.distortion ? 'Distorsión de cruce: SÍ' : 'Distorsión de cruce: NO', 14, 112);
    }
    tex.needsUpdate = true;
  }
  function drawScopeScreen() {
    const { ctx, canvas, tex } = scopeBox.userData;
    ctx.fillStyle = '#05100c'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#12312a'; ctx.lineWidth = 1;
    for (let i = 0; i <= 4; i++) { const y = 10 + i * (canvas.height - 20) / 4; line(ctx, 10, y, canvas.width - 10, y, 1, '#12312a'); }

    if (state.hide) {
      ctx.fillStyle = '#556677'; ctx.font = '11px sans-serif';
      ctx.fillText('Vout(t) oculto — predice antes de revelar', 12, canvas.height / 2);
      tex.needsUpdate = true;
      return;
    }

    const res = curSolve();
    const N = 200;
    const toX = i => 10 + (i / N) * (canvas.width - 20);
    const midY = canvas.height / 2;
    const scale = (canvas.height / 2 - 16) / Math.max(res.VoPk, 0.01);
    const pts = transferCurve(res.VoPk, res.deadzoneV, N);
    ctx.strokeStyle = res.distortion ? '#ef4444' : '#22c55e'; ctx.lineWidth = 1.5; ctx.beginPath();
    for (let i = 0; i <= N; i++) {
      const t = (i / N) * Math.PI * 2;
      const vin = res.VoPk * Math.sin(t);
      const p = pts.reduce((a, b) => Math.abs(b.vin - vin) < Math.abs(a.vin - vin) ? b : a);
      const x = toX(i), y = midY - p.vout * scale;
      if (i === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
    }
    ctx.stroke();
    ctx.fillStyle = '#6b8a83'; ctx.font = '10px sans-serif';
    ctx.fillText('Vout(t) en el nodo de salida · Vo_pk=' + fmtV(res.VoPk), 12, canvas.height - 4);
    tex.needsUpdate = true;
  }
  function refreshBenchDyn() { drawFuenteScreen(); drawMedidorScreen(); drawScopeScreen(); }

  // ---------- HUD ----------
  el('hud').innerHTML = `
    <div class="eyebrow">MEC · D2 · Electrónica de potencia</div>
    <div class="h2">Etapa de Salida Clase AB: Distorsión de Cruce, Disipación de Potencia y Diseño del Disipador</div>
    <div class="p">Un par complementario de transistores (NPN arriba, PNP abajo) en configuración seguidor de emisor entrega la corriente de salida de un amplificador de audio: el NPN conduce la mitad positiva del ciclo, el PNP la mitad negativa. Sin ninguna polarización, cada transistor solo empieza a conducir cuando la señal de entrada supera su propio VBE (~0.6–0.7V) — dejando una <b>zona muerta</b> alrededor del cruce por cero donde NINGÚN transistor conduce: la <b>distorsión de cruce</b>. Un <b>multiplicador de VBE</b> (un transistor con dos resistores) fija un pequeño voltaje de polarización entre las bases para mantener ambos transistores apenas encendidos en el cruce — eso es la <b>Clase AB</b>: ni Clase B pura (con distorsión) ni Clase A (que disiparía calor constante e innecesario).</div>
    <div class="p">El resultado más contraintuitivo de esta etapa es que la disipación de potencia en los transistores <b>NO es máxima a volumen máximo</b>. La potencia entregada a la carga crece con Vo_pk², pero la potencia extraída de la fuente solo crece linealmente con Vo_pk — así que la diferencia (lo que se disipa como calor) es una parábola que <b>alcanza su pico en Vo_pk=2·Vcc/π≈0.637·Vcc</b>, un nivel de volumen MODERADO, no el máximo. Un disipador dimensionado solo para "el peor caso a todo volumen" puede fallar exactamente a mitad de volumen.</div>
    <div class="formula">Pload=Vo_pk²/(2RL) · Psupply=(2/π)·Vcc·Vo_pk/RL · Pdiss=Psupply−Pload · pico en Vo_pk=2Vcc/π · Tj=Ta+P·ΣRθ</div>
    <div class="legend">
      <span class="li"><span class="dot" style="background:#5fb8ff"></span>Pdiss por transistor — potencia disipada como calor, no entregada a la carga</span>
      <span class="li"><span class="dot" style="background:#eab308"></span>Peor caso — Vo_pk=2Vcc/π≈0.637·Vcc, no a swing completo</span>
      <span class="li"><span class="dot" style="background:#22c55e"></span>Tj — temperatura de unión, comparada contra Tj_max del transistor</span>
    </div>
    <div class="fid"><b>SÍ verificado:</b> Pload=Vo_pk²/(2RL), Psupply=(2/π)·Vcc·Vo_pk/RL y Pdiss=Psupply−Pload deducidos del análisis estándar de la etapa Clase B/AB (Sedra &amp; Smith; Boylestad) · pico de disipación en Vo_pk=2Vcc/π con Pdiss_max=2Vcc²/(π²RL) · multiplicador de VBE V_CE=VBE(1+R1/R2) · cadena térmica Tj=Ta+P·(RθJC+RθCS+RθSA) o Tj=Ta+P·RθJA sin disipador · par de referencia TIP31C/TIP32C (ON Semiconductor: RθJC=3.125°C/W, RθJA=62.5°C/W, Tj_max=150°C) · distinción JEDEC JESD51 vs JESD51-14 para la medición de RθJC.<br><b>NO modelado:</b> física exponencial de Ebers-Moll de ICQ (valores ilustrativos) · fuga térmica (thermal runaway) dinámica · otras no-linealidades más allá de la zona muerta de cruce · tolerancia de fabricación ni envejecimiento de la interfaz térmica.</div>
    <div class="src">Fuentes: Sedra &amp; Smith, "Microelectronic Circuits" (etapas de salida Clase B/AB) · Boylestad &amp; Nashelsky, "Electronic Devices and Circuit Theory" · hoja de datos TIP31C/TIP32C (ON Semiconductor) · ON Semiconductor, "Thermal Resistance — Theory and Practice" · JEDEC JESD51 / JESD51-14</div>
  `;

  // ---------- Panel ----------
  el('panel').innerHTML = `
    <h4>Clase AB (TIP31C/TIP32C) · <span id="p_mode">Explora</span></h4>
    <div class="modebar">
      <button class="b on" id="btn-mode-explora">🔍 Explora</button>
      <button class="b" id="btn-mode-predice">🧠 Predicción</button>
      <button class="b" id="btn-mode-medicion">📏 Medición</button>
      <button class="b" id="btn-mode-reto">🎯 Reto</button>
    </div>
    <div id="missionText" style="font-size:12px;color:#8FB3AC;margin-bottom:8px"></div>
    <div class="btns" style="margin-top:8px">
      <button class="b" id="btnRef" style="flex:1 0 48%">⭐ Punto de referencia</button>
      <button class="b" id="btnWorst" style="flex:1 0 48%">⚠ Ir al peor caso (0.637·Vcc)</button>
    </div>
    <div style="margin-top:10px;display:grid;grid-template-columns:1fr auto auto auto;gap:6px 8px;align-items:center;font-size:12px;color:#EAF4F1">
      <div>Vcc</div><button class="b" id="vccDec" style="padding:2px 8px">−</button><span id="vVCC">—</span><button class="b" id="vccInc" style="padding:2px 8px">+</button>
      <div>RL</div><button class="b" id="rlDec" style="padding:2px 8px">−</button><span id="vRL">—</span><button class="b" id="rlInc" style="padding:2px 8px">+</button>
      <div>Vo_pk</div><button class="b" id="vopkDec" style="padding:2px 8px">−</button><span id="vVOPK">—</span><button class="b" id="vopkInc" style="padding:2px 8px">+</button>
      <div>Polarización</div><button class="b" id="biasDec" style="padding:2px 8px">−</button><span id="vBIAS">—</span><button class="b" id="biasInc" style="padding:2px 8px">+</button>
      <div>Disipador</div><button class="b" id="hsDec" style="padding:2px 8px">−</button><span id="vHS">—</span><button class="b" id="hsInc" style="padding:2px 8px">+</button>
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
      <button class="b" id="sweepRun" style="width:100%">▶ Ejecutar barrido de Vo_pk (0 → Vcc)</button>
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
    explora: 'Ajusta Vcc, RL, Vo_pk, la polarización y el disipador; observa Pdiss, Tj y si hay distorsión de cruce. Prueba Punto de referencia e Ir al peor caso.',
    predice: 'Antes de revelar el valor, predice la disipación total, la temperatura de unión Tj, o si hay distorsión de cruce con los valores actuales.',
    medicion: 'Ejecuta el barrido automático de Vo_pk (de silencio a swing completo) y observa cómo Pdiss traza una parábola que NO alcanza su pico al final.',
    reto: 'Con el Vcc y RL asignados, elige la polarización (sin distorsión de cruce) y el disipador más pequeño que mantenga Tj seguro incluso en el PEOR CASO (Vo_pk=0.637·Vcc), no solo en tu ajuste actual.',
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
    const spans = { vVCC: fmtV(curVCC()), vRL: fmtOhm(curRL()), vVOPK: fmtPct(curVoPkFrac() * 100), vBIAS: curBias().short, vHS: curHS().short };
    Object.keys(spans).forEach(id => { const s = el(id); if (s) s.textContent = spans[id]; });
  }

  function genPredice() {
    state._revealed = false; state.hide = true;
    const p = Math.random();
    state._predType = p < 0.34 ? 'pdiss' : (p < 0.67 ? 'tj' : 'distortion');
    const box = el('predBox');
    if (state._predType === 'pdiss') {
      box.innerHTML = '<p>Predice la disipación de potencia por transistor <b>Pdiss</b> (W) con los valores actuales de Vcc, RL y Vo_pk:</p>' +
        '<input id="predInput" type="number" step="0.01" placeholder="W" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    } else if (state._predType === 'tj') {
      box.innerHTML = '<p>Predice la temperatura de unión <b>Tj</b> (°C) con los valores actuales de Pdiss y el disipador elegido:</p>' +
        '<input id="predInput" type="number" step="0.1" placeholder="°C" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">';
    } else {
      box.innerHTML = '<p>¿Hay distorsión de cruce con la polarización actual (compara V_bias contra ≈2×VBE_on≈1.2V)?</p>' +
        '<select id="predSelect" style="width:100%;background:#0c1a16;color:#EAF4F1;border:1px solid #1E3A34;padding:6px;border-radius:6px">' +
        '<option value="si">Sí, hay distorsión de cruce</option>' +
        '<option value="no">No, la polarización es suficiente</option>' +
        '</select>';
    }
    refreshAll();
  }
  function checkPredice() {
    const res = curSolve();
    let ok, real;
    if (state._predType === 'pdiss') {
      const guess = parseFloat(el('predInput').value);
      real = fmtW(res.PdissEach);
      const tol = Math.max(0.15 * res.PdissEach, 0.05);
      ok = !isNaN(guess) && Math.abs(guess - res.PdissEach) <= tol;
    } else if (state._predType === 'tj') {
      const guess = parseFloat(el('predInput').value);
      real = fmtC(res.Tj);
      const tol = Math.max(0.1 * (res.Tj - TA), 2);
      ok = !isNaN(guess) && Math.abs(guess - res.Tj) <= tol;
    } else {
      real = res.distortion ? 'Sí, hay distorsión de cruce' : 'No, la polarización es suficiente';
      ok = el('predSelect').value === (res.distortion ? 'si' : 'no');
    }
    state._revealed = true; state.hide = false;
    refreshAll();
    showToast(ok ? '✅ Correcto — valor real: ' + real : '❌ No — valor real: ' + real, ok ? 'ok' : 'warn');
  }

  function retoFeasible(vcc, rl) {
    // ¿existe al menos una combinación (polarización sin distorsión, disipador) que
    // mantenga Tj≤TJ_SAFE_MAX incluso en el peor caso? Si no, el reto es irresoluble.
    for (const bias of BIAS_VALS) {
      if (bias.vbeTotal < DEADZONE_THRESHOLD) continue;
      for (const hs of HEATSINK_VALS) {
        if (solveClaseAB(vcc, rl, 2 / Math.PI, bias, hs, TA).TjWorst <= TJ_SAFE_MAX) return true;
      }
    }
    return false;
  }
  function newReto() {
    let vcc, rl, tries = 0;
    do {
      const vi = Math.floor(Math.random() * VCC_VALS.length);
      const ri = Math.floor(Math.random() * RL_VALS.length);
      vcc = VCC_VALS[vi]; rl = RL_VALS[ri];
      tries++;
    } while (!retoFeasible(vcc, rl) && tries < 40);
    state._reto = { vcc, rl };
    el('retoBox').innerHTML = `<p>Objetivo: con <b>Vcc=±${fmtV(vcc)}</b> y <b>RL=${fmtOhm(rl)}</b>, elige una polarización <b>sin distorsión de cruce</b> y el disipador <b>más pequeño</b> que mantenga <b>Tj≤130°C</b> incluso en el PEOR CASO de amplitud (Vo_pk=0.637·Vcc) — no solo en el Vo_pk que tengas ajustado ahora mismo.</p>`;
    refreshAll();
  }
  function checkReto() {
    const t = state._reto;
    const vccOk = Math.abs(curVCC() - t.vcc) < 1e-9;
    const rlOk = Math.abs(curRL() - t.rl) < 1e-9;
    const bias = curBias();
    const distOk = bias.vbeTotal >= DEADZONE_THRESHOLD;
    const worst = solveClaseAB(curVCC(), curRL(), 2 / Math.PI, bias, curHS(), TA);
    const thermOk = worst.Tj <= TJ_SAFE_MAX;
    if (vccOk && rlOk && distOk && thermOk) {
      showToast(`✅ Diseño válido: Tj en el peor caso=${fmtC(worst.Tj)}, sin distorsión de cruce, disipador=${curHS().short}`, 'ok');
    } else if (!vccOk) {
      showToast(`Ajusta Vcc a ±${fmtV(t.vcc)} (actual: ±${fmtV(curVCC())}).`, 'warn');
    } else if (!rlOk) {
      showToast(`Ajusta RL a ${fmtOhm(t.rl)} (actual: ${fmtOhm(curRL())}).`, 'warn');
    } else if (!distOk) {
      showToast(`Hay distorsión de cruce con la polarización "${bias.short}". Sube la polarización a Nominal AB o más.`, 'warn');
    } else {
      showToast(`Tj en el peor caso (Vo_pk=0.637·Vcc) = ${fmtC(worst.Tj)} supera el umbral de 130°C. Elige un disipador más grande.`, 'warn');
    }
  }

  async function runSweep() {
    state._sweepTrace = [];
    for (let i = 0; i < VOPK_FRAC_VALS.length; i++) {
      state.iVoPk = i;
      const res = curSolve();
      state._sweepTrace.push({ frac: VOPK_FRAC_VALS[i], pdiss: res.PdissEach, tj: res.Tj });
      refreshAll();
      await sleep(300);
    }
    updateReport();
  }

  function updateTele() {
    const t = el('telemetry');
    if (!t) return;
    if (state.hide) { t.innerHTML = '<div>Pdiss: ? · Tj: ? · Distorsión: ?</div><div style="color:#8FB3AC">Predice antes de revelar.</div>'; return; }
    const res = curSolve();
    const cls = classifyTj(res.Tj);
    t.innerHTML =
      '<div class="g"><div class="gl">Pload <b>' + fmtW(res.Pload) + '</b></div>' +
      '<div class="gl">Psupply <b>' + fmtW(res.Psupply) + '</b></div>' +
      '<div class="gl">Pdiss (c/u) <b class="' + (cls.key === 'danger' ? 'bad' : cls.key === 'caution' ? 'warn' : 'good') + '">' + fmtW(res.PdissEach) + '</b></div>' +
      '<div class="gl">Pdiss peor caso (c/u) <b>' + fmtW(res.PdissWorstEach) + '</b></div>' +
      '<div class="gl">RθTotal <b>' + fmtRth(res.RthTotal) + '</b></div>' +
      '<div class="gl">Tj <b class="' + (cls.key === 'danger' ? 'bad' : cls.key === 'caution' ? 'warn' : 'good') + '">' + fmtC(res.Tj) + '</b></div>' +
      '<div class="gl">Distorsión de cruce <b class="' + (res.distortion ? 'bad' : 'good') + '">' + (res.distortion ? 'SÍ' : 'NO') + '</b></div></div>' +
      '<div style="color:#6a7a80">' + DEV.name + ' · Tj_max≈' + TJ_MAX + '°C típico</div>';
  }
  function updateReport() {
    const rep = el('report');
    if (!rep) return;
    if (state.mode !== 'medicion' || !state._sweepTrace || !state._sweepTrace.length) { rep.innerHTML = ''; return; }
    let rows = state._sweepTrace.map(pt => `<tr><td>${fmtPct(pt.frac * 100)}</td><td>${fmtW(pt.pdiss)}</td><td>${fmtC(pt.tj)}</td></tr>`).join('');
    rep.innerHTML = `<table class="repTable"><thead><tr><th>Vo_pk (% Vcc)</th><th>Pdiss (c/u)</th><th>Tj</th></tr></thead><tbody>${rows}</tbody></table>`;
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
    { q: '¿Por qué la disipación máxima de los transistores de salida ocurre en Vo_pk≈0.637·Vcc y NO a swing completo (Vo_pk=Vcc)?', a: ['Porque Pdiss=Psupply−Pload es una parábola en Vo_pk: al principio Psupply crece más rápido que Pload, pero cerca del swing completo Pload (que crece con Vo_pk²) alcanza a Psupply (que crece linealmente), así que la diferencia tiene un máximo intermedio', 'Porque el transistor se satura antes de llegar a Vcc y deja de disipar potencia', 'Porque a swing completo toda la potencia se va a la carga y no queda ninguna diferencia que disipar'], correct: 0 },
    { q: '¿Por qué una etapa Clase AB necesita algo de corriente de reposo (polarización) en vez de operar en Clase B pura (sin polarización)?', a: ['Porque sin polarización ningún transistor conduce cerca del cruce por cero de la señal, produciendo distorsión de cruce — una pequeña corriente de reposo mantiene ambos transistores apenas encendidos ahí', 'Porque sin polarización los transistores se dañan permanentemente', 'Porque la Clase B pura no puede alimentar cargas resistivas'], correct: 0 },
    { q: 'El multiplicador de VBE usa un transistor con dos resistores para fijar la polarización en vez de solo dos diodos. ¿Cuál es la ventaja térmica de que sea un transistor y no diodos fijos?', a: ['Su VBE decrece con la temperatura igual que el VBE de los transistores de salida, así que la polarización seguida térmicamente compensa la deriva de la corriente de reposo cuando el disipador se calienta', 'Los transistores son más baratos que los diodos', 'Un transistor permite ajustar la ganancia de voltaje de la etapa de salida'], correct: 0 },
  ];
  function shuffled(arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      const tmp = a[i]; a[i] = a[j]; a[j] = tmp;
    }
    return a;
  }
  let quizIdx = 0;
  let quizOpts = [];
  function buildQuiz() { quizIdx = Math.floor(Math.random() * QUIZ.length); refreshQuestion(); }
  function refreshQuestion() {
    const item = QUIZ[quizIdx];
    const box = el('quizBox');
    if (!box) return;
    quizOpts = shuffled(item.a.map((opt, i) => ({ t: opt, ok: i === item.correct })));
    let html = '<div style="font-size:12px;color:#8FB3AC;margin-bottom:6px">Quiz rápido</div>';
    html += '<div style="font-size:13px;color:#EAF4F1;margin-bottom:8px">' + item.q + '</div>';
    quizOpts.forEach((opt, i) => { html += '<button class="b quizOpt" data-i="' + i + '" style="width:100%;text-align:left;margin-bottom:4px">' + opt.t + '</button>'; });
    box.innerHTML = html;
    box.querySelectorAll('.quizOpt').forEach(btn => {
      btn.addEventListener('click', () => {
        const i = Number(btn.dataset.i);
        if (quizOpts[i].ok) { showToast('✅ Correcto', 'ok'); quizIdx = (quizIdx + 1) % QUIZ.length; refreshQuestion(); }
        else { showToast('❌ Intenta de nuevo', 'warn'); }
      });
    });
  }

  // ---------- Interacción 3D ----------
  function actToast(id) {
    const labels = { in: 'Entrada de señal Vin', bias: 'Red de polarización (multiplicador VBE)', npn: 'Q1 — TIP31C (NPN)', pnp: 'Q2 — TIP32C (PNP)', rl: 'Carga RL', heatsink: 'Disipador' };
    if (labels[id]) showToast(labels[id], 'info');
  }
  function resolveActor(name) { return { npn: npnG, pnp: pnpG, bias: biasG, heatsink: heatG, rl: rlG }[name]; }
  function dispatch3D(id) {
    const actor = resolveActor(id);
    if (!actor) return;
    const s0 = actor.scale.clone();
    actor.scale.multiplyScalar(1.15);
    setTimeout(() => actor.scale.copy(s0), 220);
  }
  const ACTOR_NAMES = ['npn', 'pnp', 'bias', 'heatsink', 'rl'];
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
    state.iVCC = 3; state.iRL = 1; state.iVoPk = 1; state.iBias = 2; state.iHS = 2; refreshAll(); await sleep(900);
    state.iVoPk = 6; refreshAll(); await sleep(1000);
    state.iVoPk = 1; refreshAll(); await sleep(400);
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
  wireStep('rl', () => state.iRL, v => state.iRL = v, RL_VALS.length - 1);
  wireStep('vopk', () => state.iVoPk, v => state.iVoPk = v, VOPK_FRAC_VALS.length - 1);
  wireStep('bias', () => state.iBias, v => state.iBias = v, BIAS_VALS.length - 1);
  wireStep('hs', () => state.iHS, v => state.iHS = v, HEATSINK_VALS.length - 1);
  el('btnRef').addEventListener('click', () => { state.iVCC = 3; state.iRL = 1; state.iVoPk = 1; state.iBias = 2; state.iHS = 2; refreshAll(); showToast('Vcc=±24V, RL=8Ω, Vo_pk=20% de Vcc, polarización Nominal AB, disipador Mediano — punto de referencia seguro', 'info'); });
  el('btnWorst').addEventListener('click', () => { state.iVoPk = 6; refreshAll(); showToast('Vo_pk=0.637·Vcc: el punto de PEOR disipación, aunque no sea el volumen máximo', 'warn'); });
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
    state, DEV, VBE, RTH_JC, RTH_CS, RTH_JA_NO_HS, TJ_MAX, TJ_SAFE_MAX, DEADZONE_THRESHOLD,
    VCC_VALS, RL_VALS, VOPK_FRAC_VALS, BIAS_VALS, HEATSINK_VALS,
    solveClaseAB, pdissEachAtFrac, classifyTj, transferCurve, retoFeasible,
    curSolve,
    setMode, genPredice, checkPredice, newReto, checkReto,
    runSweep, refreshAll,
  };
})();
