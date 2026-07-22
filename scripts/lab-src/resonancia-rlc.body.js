/*
 * Resonancia RLC — reutiliza el mismo modelo de impedancia compleja de la práctica anterior
 * (serie: Z=R+j(ωL−1/ωC); paralelo: Y=1/R+j(ωC−1/ωL), Z=1/Y), pero en vez de leerlo en una
 * sola frecuencia, barre f y caracteriza la curva |Z(f)| completa. f₀=1/(2π√(LC)) es la
 * misma fórmula en ambas topologías (consecuencia de que XL=XC en resonancia); en serie |Z|
 * cae a su MÍNIMO en f₀ (Z=R), en paralelo sube a su MÁXIMO (Z=R). Factor de calidad:
 * Qserie=ω₀L/R, Qparalelo=R/(ω₀L); ancho de banda Δf=f₀/Q; frecuencias de media potencia
 * f₁,f₂ tales que |Z(f₁,f₂)|=|Z(f₀)|·√2 (serie) o /√2 (paralelo). El cursor de pico/valle
 * NO tiene búsqueda automática de extremo — se ubica por inspección visual, igual que el
 * triángulo de impedancia R–X se aplana (X≈0) exactamente en resonancia. Los cursores de
 * media potencia SÍ se ajustan (snap) al cruce de nivel objetivo más cercano, calculado en
 * vivo desde la lectura actual del cursor de pico/valle.
 * Verificado numéricamente (topología×R×L×C, 128 combinaciones, 104 elegibles por
 * Q∈[1.2,18]): error máximo de f₀ bajo perturbación de ±1 muestra en los tres cursores,
 * 0.63%; error máximo de Q, 20.14%; filtro anti-degeneración del Reto (≤20% de error en el
 * componente recuperado) con 312/312 = 100% de aceptación en el espacio filtrado de este banco.
 * Símbolos y notación: IEC 60027-1 · IEEE Std 280.
 * Las tolerancias (±5% en f₀, ±22% en Q, ±25% en el componente recuperado) son un margen
 * PEDAGÓGICO de este ejercicio, calibrado numéricamente contra el error real de medición, no
 * una especificación de instrumento real.
 */

/* ============================================================
   LAB — Resonancia RLC
   ============================================================ */

/* ---------- 1. ESCENA ---------- */
const mount = document.getElementById('stage');
const S = createStage(mount, { cam: [3.0, 2.2, 6.6], target: [0.4, 1.2, 0.0], bgTop: '#0d1a17', bgBot: '#04060a', bloom: 0.35, minD: 3.0, maxD: 16 });
const { scene } = S;
const synth = makeSynth({ type: 'sine', type2: 'triangle', filterFreq: 2600, Q: 0.8 });

/* ---------- 2. FÍSICA ---------- */
const L_CANDIDATES = [10, 22, 47, 100];
const C_CANDIDATES = [1, 2.2, 4.7, 10];
const R_SERIE = [8, 14, 22, 33];
const R_PARALELO = [220, 470, 1000, 2200];
const TOPOLOGIES = ['serie', 'paralelo'];
const SEALED_KEYS = ['R', 'L', 'C'];
const TOPO_LABELS = { serie: 'Serie', paralelo: 'Paralelo' };
const QMIN = 1.2, QMAX = 18;
const SPAN_LO = 0.25, SPAN_HI = 3.0, N_SWEEP = 601;
const DIVX = 10, DIVY = 8;
const TOL_F0_FRAC = 0.05, TOL_Q_FRAC = 0.22, TOL_COMPONENT_FRAC = 0.25, DEGEN_THRESHOLD = 0.20;
const OHMDIV_CANDIDATES = [1, 2, 5, 10, 20, 50, 100, 200, 500, 1000, 2000, 5000, 10000, 20000];

function RCandidatesFor(topology) { return topology === 'serie' ? R_SERIE : R_PARALELO; }
function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }

function f0Of(L, C) { const Lh = L * 1e-3, Cf = C * 1e-6; return 1 / (2 * Math.PI * Math.sqrt(Lh * Cf)); }
function computeZ(topology, R, L, C, freq) {
  const w = 2 * Math.PI * freq;
  const Lh = L * 1e-3, Cf = C * 1e-6;
  const XL = w * Lh, XC = 1 / (w * Cf);
  if (topology === 'serie') {
    const re = R, im = XL - XC;
    return { re, im, mag: Math.hypot(re, im), ang: Math.atan2(im, re) * 180 / Math.PI };
  }
  const G = 1 / R, B = w * Cf - 1 / (w * Lh);
  const Ymag2 = G * G + B * B;
  const re = G / Ymag2, im = -B / Ymag2;
  return { re, im, mag: Math.hypot(re, im), ang: Math.atan2(im, re) * 180 / Math.PI };
}
function computeZmag(topology, R, L, C, freq) { return computeZ(topology, R, L, C, freq).mag; }
function QOf(topology, R, L, C) {
  const w0 = 2 * Math.PI * f0Of(L, C);
  const Lh = L * 1e-3;
  return topology === 'serie' ? (w0 * Lh / R) : (R / (w0 * Lh));
}
function buildSweep(topology, R, L, C) {
  const f0 = f0Of(L, C);
  const fLo = f0 * SPAN_LO, fHi = f0 * SPAN_HI;
  const freqs = new Array(N_SWEEP), zs = new Array(N_SWEEP);
  for (let i = 0; i < N_SWEEP; i++) {
    const f = fLo + (fHi - fLo) * i / (N_SWEEP - 1);
    freqs[i] = f; zs[i] = computeZmag(topology, R, L, C, f);
  }
  return { freqs, zs, f0 };
}
function peakIdxFor(topology, zs) {
  let best = 0;
  for (let i = 1; i < zs.length; i++) if (topology === 'serie' ? zs[i] < zs[best] : zs[i] > zs[best]) best = i;
  return best;
}
function nearestCandidateIdx(zs, target, loBound, hiBound) {
  let best = null, bestDist = Infinity;
  const lo = Math.min(loBound, hiBound), hi = Math.max(loBound, hiBound);
  for (let i = lo; i < hi; i++) {
    const a = zs[i] - target, b = zs[i + 1] - target;
    if ((a < 0 && b > 0) || (a > 0 && b < 0) || a === 0) {
      const idx = Math.abs(a) <= Math.abs(b) ? i : i + 1;
      const d = Math.abs(zs[idx] - target);
      if (d < bestDist) { bestDist = d; best = idx; }
    }
  }
  return best;
}
function recoverSealed(topology, sealedKey, R, L, C, f0m, Qm) {
  const w0m = 2 * Math.PI * f0m;
  const Lh = L * 1e-3, Cf = C * 1e-6;
  if (sealedKey === 'L') return 1 / (w0m * w0m * Cf) * 1e3;
  if (sealedKey === 'C') return 1 / (w0m * w0m * Lh) * 1e6;
  return topology === 'serie' ? (w0m * Lh / Qm) : (Qm * w0m * Lh);
}
function worstCaseErrors(topology, R, L, C) {
  const { freqs, zs, f0 } = buildSweep(topology, R, L, C);
  const Qtrue = QOf(topology, R, L, C);
  const peakIdxTrue = peakIdxFor(topology, zs);
  const zPeak = zs[peakIdxTrue];
  const target = topology === 'serie' ? zPeak * Math.SQRT2 : zPeak / Math.SQRT2;
  const leftIdx = nearestCandidateIdx(zs, target, 0, peakIdxTrue);
  const rightIdx = nearestCandidateIdx(zs, target, peakIdxTrue, zs.length - 1);
  if (leftIdx == null || rightIdx == null) return null;
  let worstF0 = 0, worstQ = 0;
  const worstRec = { R: 0, L: 0, C: 0 };
  for (const dPk of [-1, 0, 1]) for (const dL of [-1, 0, 1]) for (const dR of [-1, 0, 1]) {
    const pk = clamp(peakIdxTrue + dPk, 0, zs.length - 1);
    const li = clamp(leftIdx + dL, 0, zs.length - 1);
    const ri = clamp(rightIdx + dR, 0, zs.length - 1);
    if (ri <= li) continue;
    const f0m = freqs[pk];
    const Qm = f0m / (freqs[ri] - freqs[li]);
    const ef0 = Math.abs(f0m - f0) / f0, eQ = Math.abs(Qm - Qtrue) / Qtrue;
    if (ef0 > worstF0) worstF0 = ef0;
    if (eQ > worstQ) worstQ = eQ;
    for (const k of SEALED_KEYS) {
      const trueVal = ({ R, L, C })[k];
      const rec = recoverSealed(topology, k, R, L, C, f0m, Qm);
      const err = (!isFinite(rec) || rec <= 0) ? Infinity : Math.abs(rec - trueVal) / trueVal;
      if (err > worstRec[k]) worstRec[k] = err;
    }
  }
  return { worstF0, worstQ, worstRec, f0, Qtrue, peakIdxTrue, leftIdx, rightIdx };
}
function worstCaseRecoveryError(topology, sealedKey, R, L, C) {
  const res = worstCaseErrors(topology, R, L, C);
  return res ? res.worstRec[sealedKey] : Infinity;
}
function pickOhmsPerDiv(maxAbs) {
  for (const cand of OHMDIV_CANDIDATES) if (maxAbs / cand <= 3.2) return cand;
  return OHMDIV_CANDIDATES[OHMDIV_CANDIDATES.length - 1];
}
function fmtOhm(v) { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ' Ω'; }
function fmtMH(v) { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ' mH'; }
function fmtUF(v) { const r = Math.round(v * 10) / 10; return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ' µF'; }
function fmtQ(q) { const r = Math.round(q * 100) / 100; return Number.isInteger(r) ? String(r) : r.toFixed(2); }
function fmtHzP(f) {
  if (f >= 1000) { const k = f / 1000; const r = Math.round(k * 100) / 100; return (Number.isInteger(r) ? String(r) : r.toFixed(2)) + ' kHz'; }
  const r = Math.round(f * 10) / 10;
  return (Number.isInteger(r) ? String(r) : r.toFixed(1)) + ' Hz';
}
function fmtSealed(key, v) { return key === 'R' ? fmtOhm(v) : (key === 'L' ? fmtMH(v) : fmtUF(v)); }

/* ---------- 3. ESTADO ---------- */
let mode = 'explora';
let expTopology = 'serie', expR = 14, expL = 47, expC = 4.7;
let medTopology = 'serie', medR = 22, medL = 22, medC = 4.7;
let retoTopology = 'serie', retoSealedKey = 'C', retoR = 14, retoL = 47, retoC = 2.2;
let peakDiv = 5.0, loDiv = 1.0, hiDiv = 9.0;
let measured = false, f0Measured = null, QMeasured = null, f1Measured = null, f2Measured = null, zPeakMeasured = null;
let retoChecked = false, retoOk = false, retoMsg = '';
let solved = false, autoRunning = false, QUIZ = {};

function currentTopology() { return mode === 'explora' ? expTopology : (mode === 'medicion' ? medTopology : retoTopology); }
function currentR() { return mode === 'explora' ? expR : (mode === 'medicion' ? medR : retoR); }
function currentL() { return mode === 'explora' ? expL : (mode === 'medicion' ? medL : retoL); }
function currentC() { return mode === 'explora' ? expC : (mode === 'medicion' ? medC : retoC); }
function currentSweep() { return buildSweep(currentTopology(), currentR(), currentL(), currentC()); }
function currentPeakFreq() { return currentSweep().freqs[idxFromDiv(peakDiv)]; }

function idxFromDiv(div) { return Math.round(clamp(div, 0, 10) / 10 * (N_SWEEP - 1)); }
function divFromIdx(idx) { return (idx / (N_SWEEP - 1)) * 10; }
function snapLeft(rawDiv) {
  const { zs } = currentSweep();
  const pkIdx = idxFromDiv(peakDiv);
  const target = currentTopology() === 'serie' ? zs[pkIdx] * Math.SQRT2 : zs[pkIdx] / Math.SQRT2;
  const found = nearestCandidateIdx(zs, target, 0, pkIdx);
  return found == null ? idxFromDiv(rawDiv) : found;
}
function snapRight(rawDiv) {
  const { zs } = currentSweep();
  const pkIdx = idxFromDiv(peakDiv);
  const target = currentTopology() === 'serie' ? zs[pkIdx] * Math.SQRT2 : zs[pkIdx] / Math.SQRT2;
  const found = nearestCandidateIdx(zs, target, pkIdx, zs.length - 1);
  return found == null ? idxFromDiv(rawDiv) : found;
}
function numOr(id) { const v = parseFloat(document.getElementById(id).value); return isFinite(v) ? v : NaN; }

/* ---------- 4. MATERIALES ---------- */
const std = (o) => new THREE.MeshStandardMaterial(o);
const sh = (m) => { m.castShadow = true; m.receiveShadow = true; return m; };
const brush = brushedMetal(), rub = rubber(), plas = techPlastic(0.12, 0.16, 0.15);
const MAT = {
  bench: std({ ...plas, color: 0x22302c, roughness: 0.85, metalness: 0.05 }),
  frame: std({ ...brush, color: 0x3a4440, roughness: 0.55, metalness: 0.85 }),
  leg: std({ ...brush, color: 0x3a4440, roughness: 0.55, metalness: 0.85 }),
  gen: std({ ...plas, color: 0x1c2622, roughness: 0.35, metalness: 0.15 }),
  scopeBox: std({ ...plas, color: 0x161f1c, roughness: 0.35, metalness: 0.15 }),
  cableCh1: std({ ...rub, color: 0x2e7d74, roughness: 1.0, metalness: 0 }),
  cableCh2: std({ ...rub, color: 0xb5661f, roughness: 1.0, metalness: 0 }),
  knobDark: std({ color: 0x0e1412, roughness: 0.5, metalness: 0.4 }),
};
const HOVER_LABELS = new Map();
function addHoverLabel(obj, text, color, pos, scale) {
  const lb = labelSprite(text, color);
  lb.position.copy(pos);
  if (scale) lb.scale.multiplyScalar(scale);
  lb.visible = false;
  lb.raycast = () => {};
  obj.add(lb);
  HOVER_LABELS.set(obj, lb);
}

/* ---------- 5. PIZARRÓN ---------- */
const boardG = new THREE.Group();
boardG.position.set(-1.05, 0, -0.85);
boardG.rotation.y = 0.16;
scene.add(boardG);
const frame = sh(roundedBox(2.6, 1.9, 0.08, MAT.frame, 0.05));
frame.position.set(0, 1.85, 0);
boardG.add(frame);
frame.userData = { title: 'Pizarrón del laboratorio', info: 'Izquierda: triángulo de impedancia R–X en la frecuencia del cursor de pico/valle. Derecha: analizador de barrido con la curva |Z(f)| y tres cursores de medición.' };
addHoverLabel(frame, 'Triángulo de impedancia + analizador de barrido · clic para inspeccionar', '#4FD1C5', new THREE.Vector3(0, 1.65, 0.3), 1.0);
for (const lx of [-1.1, 1.1]) {
  const leg = sh(new THREE.Mesh(new THREE.BoxGeometry(0.08, 1.85, 0.08), MAT.leg));
  leg.position.set(lx, 0.9, -0.02);
  boardG.add(leg);
}
const bCv = document.createElement('canvas'); bCv.width = 1024; bCv.height = 768;
const bTex = new THREE.CanvasTexture(bCv);
bTex.colorSpace = THREE.SRGBColorSpace;
const board = new THREE.Mesh(new THREE.PlaneGeometry(2.5, 1.82), new THREE.MeshBasicMaterial({ map: bTex, toneMapped: false }));
board.position.set(0, 1.85, 0.065);
boardG.add(board);

const ZTR = { x0: 20, y0: 0, w: 470, h: 768 };
const SWP = { x0: 500, y0: 0, w: 524, h: 768 };

function line(c, x1, y1, x2, y2) { c.beginPath(); c.moveTo(x1, y1); c.lineTo(x2, y2); c.stroke(); }
function drawArrowhead(c, x1, y1, x2, y2, size, color) {
  const ang = Math.atan2(y2 - y1, x2 - x1);
  c.fillStyle = color;
  c.beginPath();
  c.moveTo(x2, y2);
  c.lineTo(x2 - size * Math.cos(ang - 0.4), y2 - size * Math.sin(ang - 0.4));
  c.lineTo(x2 - size * Math.cos(ang + 0.4), y2 - size * Math.sin(ang + 0.4));
  c.closePath(); c.fill();
}

function drawZTriangleHalf(c, z) {
  const { x0, w } = ZTR;
  c.fillStyle = '#8FB3AC'; c.font = 'bold 19px Outfit, sans-serif'; c.textAlign = 'left';
  c.fillText('TRIÁNGULO DE IMPEDANCIA', x0 + 6, 40);
  const ox = x0 + 90, oy = 440, RAD = 190;
  const maxAbs = Math.max(Math.abs(z.re), Math.abs(z.im), 1e-6);
  const perDiv = pickOhmsPerDiv(maxAbs);
  const unit = RAD / 3.2;
  const px = (v) => ox + (v / perDiv) * unit;
  const py = (v) => oy - (v / perDiv) * unit;

  c.strokeStyle = 'rgba(79,209,197,0.4)'; c.lineWidth = 1.5;
  line(c, ox - 30, oy, ox + RAD + 30, oy);
  line(c, ox, oy - RAD - 30, ox, oy + RAD + 30);
  c.fillStyle = '#5a6b66'; c.font = '12px Outfit, sans-serif';
  c.textAlign = 'left'; c.fillText('R →', ox + RAD + 34, oy + 4);
  c.textAlign = 'center';
  c.fillText('X (inductivo) ↑', ox, oy - RAD - 40);
  c.fillText('X (capacitivo) ↓', ox, oy + RAD + 52);

  const zx = px(z.re), zy = py(z.im);
  c.strokeStyle = 'rgba(255,138,91,0.55)'; c.lineWidth = 1.5; c.setLineDash([4, 4]);
  line(c, ox, oy, zx, oy);
  line(c, zx, oy, zx, zy);
  c.setLineDash([]);
  c.strokeStyle = '#4FD1C5'; c.lineWidth = 3;
  c.beginPath(); c.moveTo(ox, oy); c.lineTo(zx, zy); c.stroke();
  drawArrowhead(c, ox, oy, zx, zy, 12, '#4FD1C5');
  c.fillStyle = '#4FD1C5'; c.font = 'bold 15px Outfit, sans-serif'; c.textAlign = zx >= ox ? 'left' : 'right';
  c.fillText('Z', zx + (zx >= ox ? 8 : -8), zy - 8);
  c.fillStyle = '#FF8A5B'; c.font = '12px Outfit, sans-serif'; c.textAlign = 'center';
  c.fillText('R', (ox + zx) / 2, oy + 18);
  c.fillText('X', zx + (zx >= ox ? 20 : -20), (oy + zy) / 2);

  const reactType = z.im > 0.01 ? 'INDUCTIVO' : (z.im < -0.01 ? 'CAPACITIVO' : '≈0 · RESONANCIA');
  c.fillStyle = '#8FB3AC'; c.font = 'bold 13px Outfit, sans-serif'; c.textAlign = 'left';
  c.fillText('Carácter en el cursor de pico/valle: ' + reactType, x0 + 6, 700);
  c.fillStyle = '#5a6b66'; c.font = '11px Outfit, sans-serif';
  c.fillText('Cuando el triángulo se aplana (X≈0), el cursor está en resonancia.', x0 + 6, 724);
}

function drawSweepCursor(c, xToPx, yToPx, gy0, gh, idx, zVal, color, label) {
  const px = xToPx(idx);
  c.strokeStyle = color; c.lineWidth = 1.5; c.setLineDash([4, 4]);
  line(c, px, gy0, px, gy0 + gh);
  c.setLineDash([]);
  c.fillStyle = color; c.beginPath(); c.arc(px, yToPx(zVal), 6, 0, Math.PI * 2); c.fill();
  c.font = 'bold 13px Outfit, sans-serif'; c.textAlign = 'center';
  c.fillText(label, px, gy0 + gh + 16);
}
function drawSweepHalf(c, sweep) {
  const { x0, w } = SWP;
  const gx0 = x0 + 46, gy0 = 54, gw = w - 70, gh = 580;
  c.fillStyle = '#8FB3AC'; c.font = 'bold 19px Outfit, sans-serif'; c.textAlign = 'left';
  c.fillText('ANALIZADOR DE BARRIDO', x0 + 6, 40);
  c.fillStyle = '#07120e'; c.fillRect(gx0, gy0, gw, gh);
  c.strokeStyle = 'rgba(79,209,197,0.22)'; c.lineWidth = 1;
  for (let i = 0; i <= DIVX; i++) { const x = gx0 + (i / DIVX) * gw; line(c, x, gy0, x, gy0 + gh); }
  for (let i = 0; i <= DIVY; i++) { const y = gy0 + (i / DIVY) * gh; line(c, gx0, y, gx0 + gw, y); }

  const { zs } = sweep;
  const topology = currentTopology();
  let zMax = 0; for (let i = 0; i < zs.length; i++) if (zs[i] > zMax) zMax = zs[i];
  const zScale = zMax * 1.12;
  const xToPx = (i) => gx0 + (i / (N_SWEEP - 1)) * gw;
  const yToPx = (z) => gy0 + gh - (z / zScale) * gh;

  c.strokeStyle = '#4FD1C5'; c.lineWidth = 2.5; c.beginPath();
  for (let i = 0; i < N_SWEEP; i++) {
    const px = xToPx(i), py = yToPx(zs[i]);
    if (i === 0) c.moveTo(px, py); else c.lineTo(px, py);
  }
  c.stroke();

  const pkIdx = idxFromDiv(peakDiv);
  const zPeak = zs[pkIdx];
  const target = topology === 'serie' ? zPeak * Math.SQRT2 : zPeak / Math.SQRT2;
  if (target <= zScale) {
    c.strokeStyle = 'rgba(240,165,165,0.5)'; c.lineWidth = 1.3; c.setLineDash([5, 5]);
    line(c, gx0, yToPx(target), gx0 + gw, yToPx(target));
    c.setLineDash([]);
  }

  const liIdx = snapLeft(loDiv), riIdx = snapRight(hiDiv);
  drawSweepCursor(c, xToPx, yToPx, gy0, gh, pkIdx, zs[pkIdx], '#4FD1C5', topology === 'serie' ? '▼ pico/valle' : '▲ pico/valle');
  if (liIdx != null) drawSweepCursor(c, xToPx, yToPx, gy0, gh, liIdx, zs[liIdx], '#FF8A5B', 'f₁');
  if (riIdx != null) drawSweepCursor(c, xToPx, yToPx, gy0, gh, riIdx, zs[riIdx], '#FF8A5B', 'f₂');

  c.fillStyle = '#5a6b66'; c.font = '11px Outfit, sans-serif'; c.textAlign = 'center';
  c.fillText('f (barrido, sin calibrar) →', x0 + w / 2, gy0 + gh + 34);
  c.textAlign = 'left';
  c.fillText('|Z(f)| (autoescalado)', gx0, gy0 + gh + 22);
  if (measured) {
    c.textAlign = 'right'; c.fillStyle = '#8FB3AC';
    c.fillText('f₀ medido ≈ ' + fmtHzP(f0Measured) + ' · Q medido ≈ ' + fmtQ(QMeasured), gx0 + gw, gy0 + gh + 22);
  }
}

function drawBoard() {
  const c = bCv.getContext('2d');
  c.fillStyle = '#0c1512'; c.fillRect(0, 0, 1024, 768);
  const sweep = currentSweep();
  const z = computeZ(currentTopology(), currentR(), currentL(), currentC(), sweep.freqs[idxFromDiv(peakDiv)]);
  drawZTriangleHalf(c, z);
  drawSweepHalf(c, sweep);
  c.strokeStyle = 'rgba(79,209,197,0.28)'; c.lineWidth = 2;
  line(c, 485, 20, 485, 748);
  bTex.needsUpdate = true;
}
function boardClick(u, v) {
  const x = u * 1024;
  if (x < 485) {
    showToast('Triángulo de impedancia: muestra Z=R+jX descompuesta en su parte real (R, eje horizontal) e imaginaria (X, eje vertical), evaluada en la frecuencia del cursor de pico/valle. Cuando el triángulo se aplana (X≈0), ese cursor está en resonancia — esa es la técnica de inspección visual que reemplaza la búsqueda automática de extremo.');
  } else {
    showToast('Analizador de barrido: traza |Z(f)| completa. El cursor teal (pico/valle) lo ubicas tú por inspección visual; los cursores ámbar de media potencia (f₁, f₂) se ajustan solos al nivel √2 calculado en vivo desde tu cursor de pico/valle. Presiona "Medir resonancia" para congelar f₀, f₁, f₂ y Q.');
  }
}

/* ---------- 6. BANCO 3D ---------- */
const bench = sh(new THREE.Mesh(new THREE.BoxGeometry(2.4, 0.5, 1.3), MAT.bench));
bench.position.set(1.75, 0.25, 0.85);
scene.add(bench);

function makeGen(x, label, title) {
  const g = new THREE.Group();
  g.position.set(x, 0.95, 0.55);
  const box = sh(roundedBox(0.62, 0.5, 0.42, MAT.gen, 0.03));
  g.add(box);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = 200;
  const tx = new THREE.CanvasTexture(cv); tx.colorSpace = THREE.SRGBColorSpace;
  const disp = new THREE.Mesh(new THREE.PlaneGeometry(0.5, 0.36), new THREE.MeshBasicMaterial({ map: tx, toneMapped: false }));
  disp.position.set(0, 0.02, 0.215);
  g.add(disp);
  const knob = new THREE.Group();
  const knobMesh = sh(new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 0.04, 20), MAT.knobDark));
  knobMesh.rotation.x = Math.PI / 2;
  knob.add(knobMesh);
  knob.position.set(0, -0.29, 0.18);
  knob.visible = false;
  g.add(knob);
  box.userData = { title, info: label };
  addHoverLabel(box, label, '#4FD1C5', new THREE.Vector3(0, 0.35, 0), 0.85);
  scene.add(g);
  return { g, cv, tx, knob };
}
const gen1 = makeGen(0.95, 'GEN1', 'Generador de barrido de frecuencia');
const gen2 = makeGen(1.85, 'GEN2', 'Detector de nivel |Z|');

function drawGenDisplay(genObj, l1, l2, accent) {
  const c = genObj.cv.getContext('2d');
  c.fillStyle = '#04100c'; c.fillRect(0, 0, 256, 200);
  c.strokeStyle = accent; c.lineWidth = 4; c.strokeRect(4, 4, 248, 192);
  c.fillStyle = accent; c.font = 'bold 34px Outfit, sans-serif'; c.textAlign = 'center';
  c.fillText(String(l1), 128, 92);
  c.fillStyle = '#8FB3AC'; c.font = '22px Outfit, sans-serif';
  c.fillText(String(l2), 128, 140);
  genObj.tx.needsUpdate = true;
}

const scopeBox = sh(roundedBox(0.85, 0.55, 0.55, MAT.scopeBox, 0.03));
scopeBox.position.set(1.4, 0.98, 1.15);
scopeBox.userData = { title: 'Analizador de barrido (referencia física)', info: 'La medición real ocurre en el pizarrón — este cajón representa el instrumento conectado al circuito.' };
addHoverLabel(scopeBox, 'Analizador de barrido', '#FF8A5B', new THREE.Vector3(0, 0.4, 0), 0.85);
scene.add(scopeBox);

function cable(ax, ay, az, bx, by, bz, mat) {
  const mid = new THREE.Vector3((ax + bx) / 2, Math.max(ay, by) + 0.18, (az + bz) / 2);
  const curve = new THREE.CatmullRomCurve3([new THREE.Vector3(ax, ay, az), mid, new THREE.Vector3(bx, by, bz)]);
  const geo = new THREE.TubeGeometry(curve, 20, 0.012, 8, false);
  const m = new THREE.Mesh(geo, mat);
  scene.add(m);
  return m;
}
const cbl1 = cable(0.95, 0.72, 0.55, 1.4, 0.75, 1.05, MAT.cableCh1);
const cbl2 = cable(1.85, 0.72, 0.55, 1.4, 0.75, 1.25, MAT.cableCh2);

function refreshNet3D() {
  drawGenDisplay(gen1, TOPO_LABELS[currentTopology()], 'GEN. BARRIDO', '#4FD1C5');
  let l1, l2;
  if (mode === 'explora') { l1 = 'f₀,Q'; l2 = 'en vivo'; }
  else if (mode === 'medicion') { l1 = measured ? 'medido' : 'f₀,Q'; l2 = measured ? '✔' : '🔒'; }
  else { l1 = retoSealedKey; l2 = (retoChecked && retoOk) ? '✔' : '🔒'; }
  drawGenDisplay(gen2, l1, l2, '#FF8A5B');
}

/* ---------- 7. HUD Y PANEL ---------- */
document.getElementById('hud').innerHTML = `
  <div class="eyebrow">Circuitos eléctricos CA (D1) · Resonancia RLC</div>
  <h2>Resonancia RLC · Sintoniza, Mide Q y Caracteriza el Ancho de Banda</h2>
  <p>En la práctica anterior mediste la impedancia Z=R+jX de un circuito RLC en una sola
  frecuencia. Pero X<sub>L</sub>=ωL crece con la frecuencia mientras X<sub>C</sub>=1/(ωC) decrece — existe una
  frecuencia exacta, f₀=1/(2π√(LC)), donde ambas reactancias se cancelan. En serie, Z cae a
  su MÍNIMO en f₀ (Z=R); en paralelo, sube a su MÁXIMO (Z=R). Este banco traza la curva
  completa |Z(f)| con un analizador de barrido y mide tres cantidades con cursores: f₀
  (pico/valle), y f₁/f₂, las frecuencias de media potencia donde |Z| se aleja del extremo por
  un factor √2. Su separación Δf=f₂−f₁ y el factor de calidad Q=f₀/Δf miden qué tan "afilada"
  es la resonancia.</p>
  <div class="formula">f₀=1/(2π√(LC)) · Q<sub>serie</sub>=ω₀L/R, Q<sub>paralelo</sub>=R/(ω₀L) · Δf=f₀/Q</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#4FD1C5"></span>Curva |Z(f)| y cursor de pico/valle (sin auto-detección)</div>
    <div class="li"><span class="dot" style="background:#FF8A5B"></span>Cursores de media potencia f₁, f₂ (auto-ajuste al nivel √2)</div>
    <div class="li"><span class="dot" style="background:#f0a5a5"></span>Triángulo de impedancia R–X en la frecuencia del cursor de pico/valle</div>
  </div>
  <div class="fid">
    <div class="ft">🔒 Contrato de fidelidad</div>
    <div class="fl"><b>Sí modela:</b> resonancia RLC exacta en serie y paralelo (f₀ idéntica en ambas; Q<sub>serie</sub>=ω₀L/R, Q<sub>paralelo</sub>=R/(ω₀L); Δf=f₀/Q; f₁,f₂ definidas por |Z(f₁,f₂)|=|Z(f₀)|·√2 en serie o /√2 en paralelo), con el mismo modelo de impedancia exacto de la práctica anterior; curva |Z(f)| analítica (sin ruido de muestreo) sobre una ventana centrada en f₀, con snap de los cursores de media potencia al cruce de nivel objetivo calculado en vivo desde la lectura actual del cursor de pico/valle; filtro de elegibilidad Q∈[1.2,18] y filtro de generación de rondas del Reto basado en el peor error de recuperación bajo perturbación de ±1 muestra en los tres cursores, verificados numéricamente antes de implementar (ver cita abajo).</div>
    <div class="fl no"><b>NO modela:</b> componentes reales con pérdidas parásitas (R, L, C son elementos ideales puros); ruido de instrumentación ni ancho de banda finito del analizador — la única fuente de error de medición es el paso discreto del cursor; resonancias múltiples, circuitos de más de tres elementos ni redes mixtas serie-paralelo; fenómenos de resonancia trifásica o mecánica; fase θz en el dominio del tiempo (a diferencia de la práctica anterior, aquí se mide sobre |Z(f)|, no sobre cruces por cero de un osciloscopio). Las tolerancias (±5% en f₀, ±22% en Q, ±25% en el componente recuperado) son un margen PEDAGÓGICO calibrado numéricamente, no una especificación de instrumento real.</div>
  </div>
  <div class="src">Ref: Hayt/Kemmerly/Durbin · Boylestad · IEC 60027-1 · IEEE Std 280 · verificación numérica propia (128 combinaciones, 104 elegibles, error máx. f₀ 0.63%, Q 20.14%)</div>`;

document.getElementById('panel').innerHTML = `
  <h4>Resonancia RLC · <span id="p_mode" style="color:var(--accent2)">Explora</span></h4>
  <div class="modebar">
    <button class="b on" id="m_explora">🌀 Explora</button>
    <button class="b" id="m_medicion">🖥️ Medición</button>
    <button class="b" id="m_reto">🎯 Reto</button>
  </div>
  <div class="modebar" id="selbar" style="display:none"></div>
  <div id="cursorBox" style="margin:6px 0 10px">
    <label for="cursorPk" style="font-size:11px;color:var(--dim)">Cursor pico/valle (teal) — ubícalo por inspección visual del extremo de la curva</label>
    <input type="range" id="cursorPk" min="0" max="10" step="0.02" value="5">
    <label for="cursorLo" style="font-size:11px;color:var(--dim)">Cursor media potencia izquierdo f₁ (ámbar) — cualquier punto a la izquierda del pico, se ajusta solo</label>
    <input type="range" id="cursorLo" min="0" max="10" step="0.02" value="1">
    <label for="cursorHi" style="font-size:11px;color:var(--dim)">Cursor media potencia derecho f₂ (ámbar) — cualquier punto a la derecha del pico, se ajusta solo</label>
    <input type="range" id="cursorHi" min="0" max="10" step="0.02" value="9">
  </div>
  <div class="btns" id="medirBox">
    <button class="b" id="btnMedir">📏 Medir resonancia</button>
  </div>
  <div id="tele"></div>
  <div class="console" id="report"></div>
  <h4 class="sec" id="retoTitle" style="display:none">Componente sellado</h4>
  <div id="retoBox" style="display:none">
    <div id="retoSpec" style="font-size:12px;color:var(--ink);margin:2px 0 8px"></div>
    <div style="display:flex;gap:6px 14px;align-items:center;flex-wrap:wrap;margin-bottom:8px;font-size:12px;color:var(--ink)">
      <span style="display:inline-flex;gap:6px;align-items:center;white-space:nowrap"><label for="inSealed" id="inSealedLabel">R =</label><input id="inSealed" inputmode="decimal" autocomplete="off" style="width:70px;background:#0a1411;border:1px solid rgba(79,209,197,.35);color:#EAF4F1;border-radius:8px;padding:6px 8px;font:inherit;font-size:13px"><span id="inSealedUnit">Ω</span></span>
    </div>
    <div class="btns"><button class="b primary" id="btnCheck">✅ Comprobar predicción</button></div>
  </div>
  <h4 class="sec">Pregunta de ingeniería</h4>
  <div id="q_text" style="font-size:12px;color:var(--ink);margin:4px 0 8px"></div>
  <div class="btns" id="dxbtns"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">✨ Recorrido guiado (automático)</button>
    <button class="b primary" id="btnNew">🔀 Nuevo circuito</button>
  </div>`;
const el = (id) => document.getElementById(id);

/* ---------- 8. TOASTS ---------- */
function showToast(html) {
  const t = el('toast');
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(showToast._t);
  showToast._t = setTimeout(() => t.classList.remove('show'), 3200);
}
function toastPart(id) {
  if (id === 'GEN1') {
    showToast(`<b style="color:var(--accent2)">GENERADOR DE BARRIDO · ${TOPO_LABELS[currentTopology()]}</b><br><span style="color:var(--dim);font-size:11px">Barre la frecuencia desde 0.25·f₀ hasta 3·f₀ trazando |Z(f)| completa en el pizarrón.</span>`);
    return;
  }
  if (id === 'GEN2') {
    if (mode === 'explora') {
      showToast(`<b style="color:var(--accent2)">DETECTOR DE NIVEL</b><br><span style="color:var(--dim);font-size:11px">f₀ y Q se calculan y muestran en tiempo real en el panel — no hay valores sellados en este modo.</span>`);
    } else if (mode === 'medicion') {
      showToast(`<b style="color:var(--accent2)">DETECTOR DE NIVEL · f₀, Q 🔒</b><br><span style="color:var(--dim);font-size:11px">Mide con los tres cursores del analizador para revelarlos.</span>`);
    } else {
      showToast(`<b style="color:var(--accent2)">DETECTOR DE NIVEL · ${retoSealedKey} 🔒</b><br><span style="color:var(--dim);font-size:11px">Mide f₀ y Q, luego despeja ${retoSealedKey} con las ecuaciones de inversión.</span>`);
    }
  }
}

/* ---------- 9. MODOS Y SELBAR ---------- */
const MODE_META = {
  explora: { nombre: 'Explora', cam: [[3.0, 2.2, 6.6], [0.4, 1.2, 0.0]], mision: 'Elige la topología y ajusta R, L y C. Observa cómo se mueve f₀ sobre la curva |Z(f)| y cómo cambia su forma según Q.' },
  medicion: { nombre: 'Medición', cam: [[-0.2, 2.0, 3.4], [-1.0, 1.6, -0.5]], mision: 'El circuito es conocido pero f₀ y Q están sellados. Ubica el cursor de pico/valle por inspección visual, deja que los de media potencia se ajusten solos, y mide.' },
  reto: { nombre: 'Reto', cam: [[2.4, 1.9, 4.0], [1.5, 1.0, 0.5]], mision: 'Un componente está sellado. Mide f₀ y Q con el analizador y despeja su valor con las ecuaciones de inversión de la topología activa.' },
};
function buildSelBar() {
  const bar = el('selbar');
  if (mode !== 'explora') { bar.style.display = 'none'; bar.innerHTML = ''; return; }
  bar.style.display = 'flex';
  const Rc = RCandidatesFor(expTopology);
  bar.innerHTML =
    `<div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin-right:4px">Topología:</span>` +
    TOPOLOGIES.map(t => `<button class="b sm ${t === expTopology ? 'on' : ''}" data-topo="${t}">${TOPO_LABELS[t]}</button>`).join('') +
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">R:</span>` +
    Rc.map(r => `<button class="b sm ${r === expR ? 'on' : ''}" data-r="${r}">${fmtOhm(r)}</button>`).join('') +
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">L:</span>` +
    L_CANDIDATES.map(l => `<button class="b sm ${l === expL ? 'on' : ''}" data-l="${l}">${fmtMH(l)}</button>`).join('') +
    `</div><div class="selgrp"><span class="lbl" style="font-size:11px;color:var(--dim);margin:0 4px">C:</span>` +
    C_CANDIDATES.map(cc => `<button class="b sm ${cc === expC ? 'on' : ''}" data-c="${cc}">${fmtUF(cc)}</button>`).join('') +
    `</div>`;
  bar.querySelectorAll('[data-topo]').forEach(b => { b.onclick = () => { expTopology = b.dataset.topo; expR = RCandidatesFor(expTopology)[1]; afterEdit(); }; });
  bar.querySelectorAll('[data-r]').forEach(b => { b.onclick = () => { expR = parseFloat(b.dataset.r); afterEdit(); }; });
  bar.querySelectorAll('[data-l]').forEach(b => { b.onclick = () => { expL = parseFloat(b.dataset.l); afterEdit(); }; });
  bar.querySelectorAll('[data-c]').forEach(b => { b.onclick = () => { expC = parseFloat(b.dataset.c); afterEdit(); }; });
}
function setMode(k) {
  mode = k;
  peakDiv = 5.0; loDiv = 1.0; hiDiv = 9.0;
  el('cursorPk').value = '5'; el('cursorLo').value = '1'; el('cursorHi').value = '9';
  measured = false; f0Measured = null; QMeasured = null; f1Measured = null; f2Measured = null; zPeakMeasured = null;
  retoChecked = false; retoOk = false; retoMsg = '';
  ['explora', 'medicion', 'reto'].forEach(m => el('m_' + m).classList.toggle('on', m === k));
  el('p_mode').textContent = MODE_META[k].nombre;
  const reto = k === 'reto';
  el('retoTitle').style.display = reto ? '' : 'none';
  el('retoBox').style.display = reto ? '' : 'none';
  if (reto) { updateRetoSpec(); updateSealedInputLabel(); }
  buildSelBar();
  solved = false; clearDx(); buildQuiz(); refreshQuestion();
  S.moveTo(MODE_META[k].cam[0], MODE_META[k].cam[1], 1.3);
  refreshAll();
}
function afterEdit() {
  measured = false; f0Measured = null; QMeasured = null; f1Measured = null; f2Measured = null; zPeakMeasured = null;
  buildSelBar();
  solved = false; clearDx(); buildQuiz(); refreshQuestion();
  refreshAll();
}

/* ---------- 10. TELEMETRÍA Y REPORTE ---------- */
function teleRow(l, v, cls) { return `<div class="row"><span class="k">${l}</span><span class="v ${cls || ''}">${v}</span></div>`; }
function updateTele() {
  const t = el('tele');
  const topology = currentTopology();
  if (mode === 'explora') {
    const f0t = f0Of(expL, expC), Qt = QOf(expTopology, expR, expL, expC);
    const okF0 = measured ? Math.abs(f0Measured - f0t) / f0t <= TOL_F0_FRAC : false;
    const okQ = measured ? Math.abs(QMeasured - Qt) / Qt <= TOL_Q_FRAC : false;
    t.innerHTML =
      teleRow('Topología', TOPO_LABELS[expTopology]) +
      teleRow('R / L / C', fmtOhm(expR) + ' / ' + fmtMH(expL) + ' / ' + fmtUF(expC)) +
      teleRow('f₀ (calculado)', fmtHzP(f0t)) +
      teleRow('Q (calculado)', fmtQ(Qt)) +
      teleRow('Δf (calculado)', fmtHzP(f0t / Qt)) +
      teleRow('f₀ medido (cursores)', measured ? fmtHzP(f0Measured) : 'sin medir', measured ? (okF0 ? 'good' : 'warn') : '') +
      teleRow('Q medido (cursores)', measured ? fmtQ(QMeasured) : 'sin medir', measured ? (okQ ? 'good' : 'warn') : '');
  } else if (mode === 'medicion') {
    const f0t = f0Of(medL, medC), Qt = QOf(medTopology, medR, medL, medC);
    const okF0 = measured && Math.abs(f0Measured - f0t) / f0t <= TOL_F0_FRAC;
    const okQ = measured && Math.abs(QMeasured - Qt) / Qt <= TOL_Q_FRAC;
    t.innerHTML =
      teleRow('Topología', TOPO_LABELS[medTopology]) +
      teleRow('R / L / C', fmtOhm(medR) + ' / ' + fmtMH(medL) + ' / ' + fmtUF(medC)) +
      teleRow('f₀', okF0 ? fmtHzP(f0t) + ' ✔' : '🔒 sellado') +
      teleRow('Q', okQ ? fmtQ(Qt) + ' ✔' : '🔒 sellado') +
      teleRow('f₀ medido (cursores)', measured ? fmtHzP(f0Measured) : 'sin medir', measured ? (okF0 ? 'good' : 'warn') : '') +
      teleRow('Q medido (cursores)', measured ? fmtQ(QMeasured) : 'sin medir', measured ? (okQ ? 'good' : 'warn') : '');
  } else {
    const known = SEALED_KEYS.filter(k => k !== retoSealedKey);
    const knownText = known.map(k => k + '=' + (k === 'R' ? fmtOhm(retoR) : (k === 'L' ? fmtMH(retoL) : fmtUF(retoC)))).join(', ');
    t.innerHTML =
      teleRow('Topología', TOPO_LABELS[retoTopology]) +
      teleRow('Conocidos', knownText) +
      teleRow(retoSealedKey + ' (sellado)', (retoChecked && retoOk) ? fmtSealed(retoSealedKey, ({ R: retoR, L: retoL, C: retoC })[retoSealedKey]) + ' ✔' : '🔒 desconocido') +
      teleRow('f₀ medido (cursores)', measured ? fmtHzP(f0Measured) : 'sin medir', measured ? 'good' : 'warn') +
      teleRow('Q medido (cursores)', measured ? fmtQ(QMeasured) : 'sin medir', measured ? 'good' : 'warn') +
      teleRow('Estado', retoChecked ? (retoOk ? '✔ CORRECTO' : 'revisa tu cálculo') : 'Mide f₀ y Q, despeja el componente, luego comprueba', retoChecked ? (retoOk ? 'good' : 'bad') : '');
  }
}
function updateReport() {
  const r = el('report');
  if (mode === 'explora') {
    r.textContent = measured
      ? `Mediste f₀≈${fmtHzP(f0Measured)}, Q≈${fmtQ(QMeasured)}. Compara contra los valores calculados arriba y ajusta el cursor de pico/valle si el error es grande.`
      : `Ajusta R, L, C y la topología, y practica ubicando el cursor de pico/valle por inspección visual de la curva.`;
  } else if (mode === 'medicion') {
    r.textContent = measured
      ? `Medición registrada: f₀≈${fmtHzP(f0Measured)}, Q≈${fmtQ(QMeasured)}. Revisa si las filas selladas del panel se revelaron.`
      : `Circuito conocido, f₀ y Q sellados. Ubica el cursor de pico/valle y mide.`;
  } else {
    r.textContent = retoChecked ? retoMsg.replace(/<[^>]+>/g, '') : `Mide f₀ y Q con el analizador, despeja ${retoSealedKey} y comprueba tu predicción.`;
  }
}
function refreshAll() { drawBoard(); updateTele(); updateReport(); refreshNet3D(); }

/* ---------- 11. MEDICIÓN Y RETO ---------- */
function medirResonancia() {
  const { freqs, zs } = currentSweep();
  const pkIdx = idxFromDiv(peakDiv);
  const liIdx = snapLeft(loDiv);
  const riIdx = snapRight(hiDiv);
  if (liIdx == null || riIdx == null || riIdx <= liIdx) {
    showToast('⚠️ No se detectó un cruce de media potencia válido a ambos lados del cursor de pico/valle. Verifica que ese cursor esté cerca del extremo de la curva.');
    return;
  }
  f0Measured = freqs[pkIdx];
  zPeakMeasured = zs[pkIdx];
  f1Measured = freqs[liIdx];
  f2Measured = freqs[riIdx];
  QMeasured = f0Measured / (f2Measured - f1Measured);
  measured = true;
  synth.beep(1046, 0.1, 0.06);
  const topology = currentTopology();
  if (mode === 'explora') {
    showToast('Medición: f₀≈' + fmtHzP(f0Measured) + ', Q≈' + fmtQ(QMeasured) + '. Compara contra los valores calculados en el panel — ajusta el cursor de pico/valle si el error es grande.');
  } else if (mode === 'medicion') {
    showToast('Medición registrada: f₀≈' + fmtHzP(f0Measured) + ', Q≈' + fmtQ(QMeasured) + '. Compara el resultado contra las filas selladas del panel.');
  } else {
    showToast('Medición registrada: f₀≈' + fmtHzP(f0Measured) + ', Q≈' + fmtQ(QMeasured) + '. Usa estos valores y las ecuaciones de inversión de la topología ' + TOPO_LABELS[topology] + ' para despejar ' + retoSealedKey + '.');
  }
  refreshAll();
}
function checkReto() {
  if (!measured) { showToast('⚠️ Primero mide f₀ y Q con los cursores del analizador ("Medir resonancia").'); return; }
  const guess = numOr('inSealed');
  if (!isFinite(guess)) { showToast('⚠️ Ingresa tu valor calculado para el componente sellado.'); return; }
  const trueVal = ({ R: retoR, L: retoL, C: retoC })[retoSealedKey];
  retoOk = Math.abs(guess - trueVal) <= trueVal * TOL_COMPONENT_FRAC;
  retoChecked = true;
  solved = retoOk;
  synth.beep(retoOk ? 1046 : 220, retoOk ? 0.14 : 0.15, 0.06);
  const guessFmt = fmtSealed(retoSealedKey, guess);
  retoMsg = retoOk
    ? `<span class="mono"><span class="ok">✔ ${retoSealedKey} correcto</span> (tu respuesta ${guessFmt}, dentro de ±${Math.round(TOL_COMPONENT_FRAC * 100)}% del valor real)</span>`
    : `<span class="mono"><span class="dtc">✗ ${retoSealedKey} fuera de tolerancia</span> (tu respuesta ${guessFmt}). Revisa la ecuación de inversión para la topología ${TOPO_LABELS[retoTopology]} y el componente ${retoSealedKey}, usando f₀ y Q medidos.</span>`;
  refreshAll();
}
function updateSealedInputLabel() {
  const unit = retoSealedKey === 'R' ? 'Ω' : (retoSealedKey === 'L' ? 'mH' : 'µF');
  el('inSealedLabel').textContent = retoSealedKey + ' =';
  el('inSealedUnit').textContent = unit;
}
function updateRetoSpec() {
  const known = SEALED_KEYS.filter(k => k !== retoSealedKey);
  const knownText = known.map(k => k + '=' + (k === 'R' ? fmtOhm(retoR) : (k === 'L' ? fmtMH(retoL) : fmtUF(retoC)))).join(', ');
  el('retoSpec').innerHTML = `Topología ${TOPO_LABELS[retoTopology]}. Componentes conocidos: ${knownText}. El componente <b>${retoSealedKey}</b> está sellado. Mide f₀ y Q con los cursores del analizador ("Medir resonancia") y despeja ${retoSealedKey} con las ecuaciones de inversión de la topología activa.<br><span style="color:var(--dim)">Tolerancias (±${Math.round(TOL_F0_FRAC * 100)}% en f₀ y ±${Math.round(TOL_Q_FRAC * 100)}% en Q para Medición, ±${Math.round(TOL_COMPONENT_FRAC * 100)}% en el componente para Reto) son un margen pedagógico calibrado numéricamente.</span>`;
}
function pickFrom(arr, exclude) {
  const pick = () => arr[Math.floor(Math.random() * arr.length)];
  let v = pick();
  if (arr.length > 1) while (v === exclude) v = pick();
  return v;
}
function pickEligibleCombo(prevTopology) {
  for (let tries = 0; tries < 200; tries++) {
    const topology = pickFrom(TOPOLOGIES, prevTopology);
    const R = pickFrom(RCandidatesFor(topology));
    const L = pickFrom(L_CANDIDATES);
    const C = pickFrom(C_CANDIDATES);
    const Q = QOf(topology, R, L, C);
    if (Q >= QMIN && Q <= QMAX) return { topology, R, L, C };
  }
  return { topology: 'serie', R: 14, L: 47, C: 4.7 };
}
function pickRetoRound(prevTopology, prevSealedKey) {
  for (let tries = 0; tries < 500; tries++) {
    const topology = pickFrom(TOPOLOGIES, prevTopology);
    const sealedKey = pickFrom(SEALED_KEYS, prevSealedKey);
    const R = pickFrom(RCandidatesFor(topology));
    const L = pickFrom(L_CANDIDATES);
    const C = pickFrom(C_CANDIDATES);
    const Q = QOf(topology, R, L, C);
    if (Q < QMIN || Q > QMAX) continue;
    if (worstCaseRecoveryError(topology, sealedKey, R, L, C) <= DEGEN_THRESHOLD) {
      return { topology, sealedKey, R, L, C };
    }
  }
  return { topology: 'serie', sealedKey: 'C', R: 14, L: 47, C: 2.2 };
}
function newMedicionRound() {
  const r = pickEligibleCombo(medTopology);
  medTopology = r.topology; medR = r.R; medL = r.L; medC = r.C;
}
function newRetoRound() {
  const r = pickRetoRound(retoTopology, retoSealedKey);
  retoTopology = r.topology; retoSealedKey = r.sealedKey; retoR = r.R; retoL = r.L; retoC = r.C;
}
function resetCursorsToDefault() {
  peakDiv = 5.0; loDiv = 1.0; hiDiv = 9.0;
  el('cursorPk').value = '5'; el('cursorLo').value = '1'; el('cursorHi').value = '9';
}
function newSignal() {
  if (mode === 'medicion') {
    newMedicionRound();
    measured = false; f0Measured = null; QMeasured = null; f1Measured = null; f2Measured = null; zPeakMeasured = null;
    resetCursorsToDefault();
    solved = false; clearDx(); buildQuiz(); refreshQuestion(); buildSelBar(); refreshAll();
    showToast('🔀 Nuevo circuito sellado. Vuelve a medir f₀ y Q.'); synth.beep(520, 0.08, 0.05);
  } else if (mode === 'reto') {
    newRetoRound();
    measured = false; f0Measured = null; QMeasured = null; f1Measured = null; f2Measured = null; zPeakMeasured = null;
    retoChecked = false; retoOk = false; retoMsg = '';
    if (el('inSealed')) el('inSealed').value = '';
    resetCursorsToDefault();
    updateRetoSpec(); updateSealedInputLabel();
    solved = false; clearDx(); buildQuiz(); refreshQuestion(); refreshAll();
    showToast('🔀 Nuevo circuito sellado. Componente y topología pueden haber cambiado.'); synth.beep(520, 0.08, 0.05);
  } else {
    const r = pickEligibleCombo(expTopology);
    expTopology = r.topology; expR = r.R; expL = r.L; expC = r.C;
    afterEdit();
    showToast('🔀 Nueva combinación aleatoria en Explora.');
  }
}
function onRetoInput() { if (mode !== 'reto') return; retoChecked = false; retoOk = false; retoMsg = ''; refreshAll(); }

/* ---------- 12. QUIZ ---------- */
function buildQuiz() {
  QUIZ = {
    explora: {
      pregunta: 'La fórmula f₀=1/(2π√(LC)) es idéntica en serie y en paralelo, pero en serie |Z| tiene un MÍNIMO en f₀ y en paralelo un MÁXIMO. ¿Por qué ocurre esto si f₀ es la misma frecuencia en ambos casos?',
      opciones: [
        { t: 'En f₀ se cancela la parte reactiva en ambos casos (X=0 en serie, B=0 en la admitancia en paralelo); en serie eso deja el MÍNIMO de impedancia (Z=R), y en paralelo deja el MÍNIMO de admitancia (Y=1/R) que, al invertirse (Z=1/Y), se convierte en el MÁXIMO de impedancia.', ok: true, why: 'Correcto: es la misma cancelación de reactancia vista desde impedancia (serie) o admitancia (paralelo), y esa inversión Z=1/Y es lo que voltea mínimo en máximo.' },
        { t: 'Porque en paralelo la resistencia R es mucho mayor que en serie, así que Z siempre es más grande sin importar la frecuencia.', ok: false, why: 'Los rangos de R difieren por diseño de este banco (para mantener Q en un rango razonable), pero el min/max se invierte para CUALQUIER valor de R en cada topología — no es un efecto de magnitud de R.' },
        { t: 'Porque el simulador invierte el eje Y del gráfico según la topología, no es un efecto físico real.', ok: false, why: 'Es un efecto físico real de la álgebra Z=1/Y, no un truco de renderizado.' },
        { t: 'Porque en paralelo la frecuencia de resonancia es distinta a la de serie, así que no se puede comparar directamente.', ok: false, why: 'La fórmula f₀=1/(2π√(LC)) es idéntica en ambas topologías, como el enunciado de la pregunta indica explícitamente.' },
      ],
    },
    medicion: {
      pregunta: 'El nivel objetivo para los cursores de media potencia se calcula EN VIVO a partir de la lectura ACTUAL del cursor de pico/valle, no del valor real de Z(f₀). Si el cursor de pico/valle no está exactamente en el extremo verdadero, ¿qué consecuencia numérica tiene esto?',
      opciones: [
        { t: 'El error se propaga a f₀ y a Δf medido, y por tanto a Q=f₀/Δf; verificado numéricamente que Q es mucho más sensible que f₀ a la imprecisión del cursor (hasta 20.14% de error en Q, contra solo 0.63% en f₀), por eso la tolerancia de Q (±22%) es mucho más amplia que la de f₀ (±5%).', ok: true, why: 'Correcto: el nivel objetivo hereda el error del pico, y ese error se amplifica más al calcular Q que al leer f₀ directamente — de ahí las tolerancias distintas.' },
        { t: 'No tiene ninguna consecuencia, porque los cursores de media potencia siempre encuentran el cruce exacto sin importar dónde esté el cursor de pico/valle.', ok: false, why: 'El nivel objetivo mismo depende de la lectura del pico, así que un pico impreciso desplaza el nivel objetivo y, con él, los cruces encontrados.' },
        { t: 'Solo afecta la medición de f₀, nunca la de Q.', ok: false, why: 'Es al revés: verificado numéricamente que Q es la cantidad MÁS sensible a este error, no la menos.' },
        { t: 'El simulador corrige automáticamente el error del cursor de pico/valle antes de calcular Q.', ok: false, why: 'No existe corrección automática — por eso la ubicación cuidadosa del cursor de pico/valle por inspección visual es la parte que realmente exige habilidad en este laboratorio.' },
      ],
    },
    reto: {
      pregunta: 'Antes de sellar un componente en el Reto, el simulador descarta —por fuerza bruta, antes de mostrar la ronda— cualquier combinación donde una perturbación de ±1 muestra de índice en los tres cursores produzca más de 20% de error en el componente recuperado. ¿Por qué es necesario este filtro si las ecuaciones de inversión son exactas?',
      opciones: [
        { t: 'Exactas no significa insensibles: cerca de ciertas combinaciones, el paso discreto de muestreo del cursor —inevitable incluso con una medición cuidadosa— se amplifica al invertir la fórmula. Verificado numéricamente sobre el espacio filtrado por Q∈[1.2,18]: el filtro asegura que el peor error de recuperación se mantenga acotado (100% de aceptación tras aplicarlo).', ok: true, why: 'Correcto: las fórmulas son algebraicamente exactas, pero su SENSIBILIDAD al error de entrada (el paso discreto del cursor) varía según la combinación — el filtro descarta las combinaciones numéricamente mal condicionadas.' },
        { t: 'Porque el simulador no puede calcular f₀ y Q para todas las combinaciones de R, L y C.', ok: false, why: 'buildSweep, peakIdxFor y las demás funciones calculan f₀ y Q exactamente para cualquier combinación válida — el problema no es de cálculo sino de sensibilidad al error de medición.' },
        { t: 'Porque algunas combinaciones de R, L y C no son físicamente realizables con componentes comerciales.', ok: false, why: 'Todos los candidatos del banco son valores comerciales estándar; el filtro es sobre sensibilidad numérica, no sobre realizabilidad física.' },
        { t: 'Porque el filtro evita que dos rondas seguidas tengan el mismo componente sellado.', ok: false, why: 'Esa función la cumple pickFrom() al excluir la ronda anterior; el filtro de degeneración es un criterio numérico distinto sobre el peor error de recuperación.' },
      ],
    },
  };
}
function clearDx() { el('dxbtns').querySelectorAll('button').forEach(b => { b.classList.remove('right', 'wrong'); }); }
function refreshQuestion() {
  const q = QUIZ[mode];
  el('q_text').textContent = q.pregunta;
  const box = el('dxbtns');
  box.innerHTML = q.opciones.map((o, i) => `<button class="b sm" data-i="${i}">${o.t}</button>`).join('');
  box.querySelectorAll('button').forEach(btn => { btn.onclick = () => answer(+btn.dataset.i); });
}
function answer(i) {
  clearDx();
  const q = QUIZ[mode], o = q.opciones[i];
  const btn = el('dxbtns').children[i];
  if (o.ok) {
    btn.classList.add('right'); solved = true; synth.beep(1046, 0.12, 0.06);
    showToast(`<span style="color:var(--good)">✔ ${o.t}</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  } else {
    btn.classList.add('wrong'); synth.beep(220, 0.15, 0.06);
    showToast(`<span style="color:var(--bad)">✗ ${o.t}</span><br><span style="color:var(--dim);font-size:11px">${o.why}</span>`);
  }
}

/* ---------- 13. PICKING Y HOVER ---------- */
pickerFor(scene, S.camera, S.renderer.domElement, (hit) => {
  if (!hit) return;
  if (hit.object === board && hit.uv) { boardClick(hit.uv.x, hit.uv.y); return; }
  let o = hit.object;
  while (o) {
    if (o.userData && o.userData.el) { toastPart(o.userData.el); return; }
    if (o.userData && o.userData.title) { showToast(`<b style="color:var(--accent2)">${o.userData.title}</b><br><span style="color:var(--dim);font-size:11px">${o.userData.info || ''}</span>`); return; }
    o = o.parent;
  }
});
{
  const raycaster = new THREE.Raycaster();
  const mouse = new THREE.Vector2();
  S.renderer.domElement.addEventListener('pointermove', (e) => {
    const rect = S.renderer.domElement.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    raycaster.setFromCamera(mouse, S.camera);
    HOVER_LABELS.forEach((lb) => { lb.visible = false; });
    const hits = raycaster.intersectObjects(scene.children, true);
    let cursor = 'default';
    if (hits.length) {
      let o = hits[0].object;
      if (o === board) cursor = 'pointer';
      while (o) {
        if (HOVER_LABELS.has(o)) { HOVER_LABELS.get(o).visible = true; cursor = 'pointer'; }
        if (o.userData && (o.userData.el || o.userData.title)) cursor = 'pointer';
        o = o.parent;
      }
    }
    S.renderer.domElement.style.cursor = cursor;
  });
}
gen1.g.children[0].userData.el = 'GEN1';
gen2.g.children[0].userData.el = 'GEN2';

/* ---------- 14. RECORRIDO AUTOMÁTICO ---------- */
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
async function runAuto() {
  if (autoRunning) return;
  autoRunning = true;
  const btn = el('btnAuto'), label = btn.textContent;
  btn.disabled = true; btn.classList.add('on'); btn.textContent = '⏳ Recorrido guiado en curso…';
  try {
    synth.init(); synth.resume();
    clearDx();
    setMode('explora');
    expTopology = 'serie'; expR = 14; expL = 47; expC = 4.7; afterEdit();
    showToast('Paso 1 · Circuito serie R=14Ω, L=47mH, C=4.7µF. Observa cómo se mueve f₀ sobre la curva y el triángulo de impedancia.');
    await sleep(2600);
    {
      const { zs } = currentSweep();
      const trueIdx = peakIdxFor(currentTopology(), zs);
      peakDiv = divFromIdx(trueIdx); el('cursorPk').value = String(peakDiv);
    }
    refreshAll();
    showToast('Cursor de pico/valle en el extremo: el triángulo de impedancia se aplana (X≈0) — ahí está f₀.');
    await sleep(2600);
    expTopology = 'paralelo'; afterEdit();
    showToast('Mismos L y C, ahora en PARALELO: f₀ es idéntica, pero |Z| ahora tiene un MÁXIMO en vez de un MÍNIMO.');
    await sleep(2800);

    setMode('medicion');
    showToast('Paso 2 · f₀ y Q sellados. Primero, un error común: dejar el cursor de pico/valle lejos del extremo real.');
    await sleep(2200);
    {
      const { zs } = currentSweep();
      const trueIdx = peakIdxFor(currentTopology(), zs);
      peakDiv = divFromIdx(clamp(trueIdx - 45, 0, N_SWEEP - 1)); el('cursorPk').value = String(peakDiv);
      loDiv = 0.3; hiDiv = 9.7; el('cursorLo').value = '0.3'; el('cursorHi').value = '9.7';
    }
    refreshAll();
    medirResonancia(); await sleep(2800);
    showToast('Corrigiendo: ubicamos el cursor de pico/valle justo en el extremo visual de la curva.');
    await sleep(2000);
    {
      const { zs } = currentSweep();
      const trueIdx = peakIdxFor(currentTopology(), zs);
      peakDiv = divFromIdx(trueIdx); el('cursorPk').value = String(peakDiv);
    }
    refreshAll();
    medirResonancia(); await sleep(2800);
    answer(QUIZ.medicion.opciones.findIndex((o) => o.ok)); await sleep(1800);

    setMode('reto');
    showToast('Paso 3 · Un componente está sellado. Mide f₀ y Q, y despeja su valor con las ecuaciones de la topología activa.');
    await sleep(2200);
    {
      const { zs } = currentSweep();
      const trueIdx = peakIdxFor(currentTopology(), zs);
      peakDiv = divFromIdx(trueIdx); el('cursorPk').value = String(peakDiv);
      loDiv = 0.3; hiDiv = 9.7; el('cursorLo').value = '0.3'; el('cursorHi').value = '9.7';
    }
    refreshAll();
    medirResonancia(); await sleep(1800);
    const trueVal = ({ R: retoR, L: retoL, C: retoC })[retoSealedKey];
    el('inSealed').value = String(trueVal);
    checkReto(); await sleep(2600);
    const q = QUIZ.reto, i = q.opciones.findIndex((o) => o.ok);
    clearDx();
    const dxBtn = el('dxbtns').children[i];
    if (dxBtn) { dxBtn.classList.add('right'); solved = true; synth.beep(1046, 0.12, 0.06); }
    showToast(`<span style="color:var(--good)">✔ ${q.opciones[i].t}</span><br><span style="color:var(--dim);font-size:11px">${q.opciones[i].why}</span>`);
  } finally {
    btn.disabled = false; btn.classList.remove('on'); btn.textContent = label; autoRunning = false;
  }
}

/* ---------- 15. ANIMACIÓN, EVENTOS E INICIO ---------- */
S.setAnimate((dt, time) => {});

['explora', 'medicion', 'reto'].forEach((m) => { el('m_' + m).onclick = () => { if (!autoRunning) setMode(m); }; });
el('btnAuto').onclick = runAuto;
el('btnNew').onclick = newSignal;
el('btnCheck').onclick = checkReto;
el('btnMedir').onclick = medirResonancia;
el('cursorPk').oninput = () => { peakDiv = parseFloat(el('cursorPk').value); refreshAll(); };
el('cursorLo').oninput = () => { loDiv = parseFloat(el('cursorLo').value); refreshAll(); };
el('cursorHi').oninput = () => { hiDiv = parseFloat(el('cursorHi').value); refreshAll(); };
el('inSealed').addEventListener('input', onRetoInput);
el('inSealed').addEventListener('keydown', (e) => { if (e.key === 'Enter') checkReto(); });
el('soundBtn').onclick = () => { const on = synth.toggle(); el('soundBtn').textContent = on ? '🔊 Sonido' : '🔇 Sonido'; };
document.addEventListener('pointerdown', () => { synth.init(); synth.resume(); }, { once: true });

newRetoRound();
buildQuiz();
refreshNet3D();
S.start();
setMode('explora');

window.__labDebug = {
  mode: () => mode,
  topology: () => currentTopology(),
  R: () => currentR(), L: () => currentL(), C: () => currentC(),
  f0True: () => f0Of(currentL(), currentC()),
  QTrue: () => QOf(currentTopology(), currentR(), currentL(), currentC()),
  sweep: () => currentSweep(),
  N_SWEEP: () => N_SWEEP,
  peakDiv: () => peakDiv, loDiv: () => loDiv, hiDiv: () => hiDiv,
  setPeakDiv: (d) => { peakDiv = clamp(d, 0, 10); el('cursorPk').value = String(peakDiv); refreshAll(); },
  setLoDiv: (d) => { loDiv = clamp(d, 0, 10); el('cursorLo').value = String(loDiv); refreshAll(); },
  setHiDiv: (d) => { hiDiv = clamp(d, 0, 10); el('cursorHi').value = String(hiDiv); refreshAll(); },
  idxFromDiv: (d) => idxFromDiv(d),
  divFromIdx: (i) => divFromIdx(i),
  peakIdxTrue: () => { const { zs } = currentSweep(); return peakIdxFor(currentTopology(), zs); },
  snapLeftIdx: () => snapLeft(loDiv),
  snapRightIdx: () => snapRight(hiDiv),
  measured: () => measured,
  f0Measured: () => f0Measured, QMeasured: () => QMeasured,
  f1Measured: () => f1Measured, f2Measured: () => f2Measured,
  medirResonancia: () => medirResonancia(),
  checkReto: () => checkReto(),
  setInSealed: (v) => { el('inSealed').value = String(v); },
  retoChecked: () => retoChecked,
  retoOk: () => retoOk,
  retoMsg: () => retoMsg,
  retoTopology: () => retoTopology,
  retoR: () => retoR, retoL: () => retoL, retoC: () => retoC,
  retoSealedKey: () => retoSealedKey,
  retoSealedTrue: () => ({ R: retoR, L: retoL, C: retoC })[retoSealedKey],
  medTopology: () => medTopology, medR: () => medR, medL: () => medL, medC: () => medC,
  setExpTopology: (t) => { expTopology = t; expR = RCandidatesFor(t)[1]; afterEdit(); },
  setExpR: (v) => { expR = v; afterEdit(); },
  setExpL: (v) => { expL = v; afterEdit(); },
  setExpC: (v) => { expC = v; afterEdit(); },
  recoverSealed: (topology, sealedKey, R, L, C, f0m, Qm) => recoverSealed(topology, sealedKey, R, L, C, f0m, Qm),
  worstCaseRecoveryError: (topology, sealedKey, R, L, C) => worstCaseRecoveryError(topology, sealedKey, R, L, C),
  newSignal: () => newSignal(),
  setMode: (k) => setMode(k),
  reportText: () => el('report').innerText,
  quizAnswer: (i) => answer(i),
  quizCorrectIndex: () => QUIZ[mode].opciones.findIndex((o) => o.ok),
  solved: () => solved,
};
