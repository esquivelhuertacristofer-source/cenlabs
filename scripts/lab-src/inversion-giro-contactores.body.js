/* ============================================================
   LAB — Inversión de giro con contactores y enclavamiento (mecanica-58 / d5-15)
   Molde E+S: Ensamble 3D del arrancador (banco de trabajo, 8 piezas móviles
   sobre un panel de montaje fijo) → desbloquea 3 modos de simulación
   esquemática: Circuito (fuerza+control con enclavamiento eléctrico/mecánico),
   Térmico (clase de disparo del relevador térmico IEC 60947-4-1) y Reto
   (elige la clase de disparo mínima correcta dado un escenario de arranque).
   Contrato de fidelidad (declarado también en el HUD y en la ficha técnica):
   SÍ modela: la lógica de enclavamiento eléctrico+mecánico de un arrancador
   reversible (por qué NO se pueden energizar KM1/KM2 a la vez), la secuencia
   de fases invertida en el motor (L1-U/L2-V/L3-W vs L1-W/L2-V/L3-U), y la
   fórmula de tiempo de disparo máximo de un relevador térmico de clase 10/20/30
   a 7.2×In según IEC 60947-4-1 (t = t_max_clase · (7.2/m)²).
   NO modela: el circuito de control completo con bobinas/fusibles/protecciones
   dibujado a nivel de esquemático eléctrico normalizado (solo un diagrama
   simplificado didáctico), la dinámica térmica real del relevador (curva
   completa min/max de disparo — IEC 60947-4-1 solo fija el máximo por clase,
   el mínimo depende del fabricante y no se modela), ni el dimensionamiento de
   calibre de conductor o corriente de plena carga del motor.
   ============================================================ */

const mount = document.getElementById('stage');
const S = createStage(mount, {
  cam: [3.2, 2.4, 4.2],
  target: [0, 1.35, 0],
  bgTop: '#0d1720',
  bgBot: '#050a0e',
  bloom: 0.32,
  minD: 1.8,
  maxD: 9,
});
const { scene } = S;
const synth = makeSynth({ freq: 220 });
const std = (o) => new THREE.MeshStandardMaterial(o);
const el = (id) => document.getElementById(id);
const tf = (x, d = 0) => Number(x).toFixed(d);
function ease(x) { return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; }

let toastT = null;
function showToast(html, ms = 3300) {
  const t = el('toast');
  if (!t) return;
  t.innerHTML = html;
  t.classList.add('show');
  clearTimeout(toastT);
  toastT = setTimeout(() => t.classList.remove('show'), ms);
}

/* ---------------- Materiales ---------------- */
const alu = castAluminum(), brush = brushedMetal();
const MAT = {
  panel: std({ ...brush, color: 0x2b323a, metalness: 0.55, roughness: 0.55, envMapIntensity: 0.9 }),
  dinRail: std({ ...alu, color: 0x9aa4ad, metalness: 0.75, roughness: 0.35, envMapIntensity: 1.0 }),
  contactorBody: std({ color: 0x23272c, metalness: 0.15, roughness: 0.75 }),
  contactorClear: std({ color: 0x8fd1ff, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.35 }),
  termMetal: std({ ...alu, color: 0xb9c1c8, metalness: 0.8, roughness: 0.3, envMapIntensity: 1.0 }),
  dark: std({ color: 0x1b1f24, metalness: 0.2, roughness: 0.8 }),
  termLid: std({ color: 0xd8d2c2, metalness: 0.05, roughness: 0.6 }),
  needleRed: std({ color: 0xd64545, emissive: 0x4a0e0e, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 }),
  wireInterlock: std({ color: 0xf4c95d, metalness: 0.1, roughness: 0.5 }),
  bench: std({ color: 0x2a2f35, metalness: 0.3, roughness: 0.7 }),
  benchLeg: std({ ...alu, color: 0x7a828a, metalness: 0.7, roughness: 0.4 }),
  ped: std({ color: 0x1c2126, metalness: 0.25, roughness: 0.7 }),
  pedTop: std({ color: 0x3a4149, metalness: 0.3, roughness: 0.55 }),
  pedRing: std({ color: 0x43D9AD, emissive: 0x0e3d30, emissiveIntensity: 0.5, metalness: 0.2, roughness: 0.4 }),
};

/* ============================================================
   Datos de ingeniería — CERO Math.random() salvo en newChallenge()
   Fuente: IEC 60947-4-1 (arrancadores electromecánicos) — norma ancla real
   de d5-15 según docs/LISTA-MAESTRA-200-PRACTICAS.md. La norma fija el
   TIEMPO MÁXIMO de disparo a 7.2×In por clase de relevador térmico; el
   tiempo mínimo real depende del fabricante y NO se modela aquí (hedge
   declarado también en el HUD/ficha técnica).
   ============================================================ */
const TRIP_CLASSES = {
  10: { nombre: 'Clase 10', maxTime: 10 },
  20: { nombre: 'Clase 20', maxTime: 20 },
  30: { nombre: 'Clase 30', maxTime: 30 },
};
const CLASS_ORDER = [10, 20, 30];
function tripTime(m, clase) { return TRIP_CLASSES[clase].maxTime * Math.pow(7.2 / m, 2); }
function minClassFor(m, ts) {
  for (const c of CLASS_ORDER) { if (tripTime(m, c) > ts) return c; }
  return null;
}
// Verificado con `node -e` (recomputación fresca, no a mano): las 9 combinaciones
// producen minClassFor con margen positivo saludable (4.6s–15.6s) entre el tiempo
// de disparo de la clase elegida y el tiempo real de arranque del motor.
const RETO_SCENARIOS = [
  { m: 4.5, ts: 10 }, { m: 6.0, ts: 8 }, { m: 7.0, ts: 6 },
  { m: 6.0, ts: 20 }, { m: 6.5, ts: 18 }, { m: 7.0, ts: 15 },
  { m: 6.5, ts: 30 }, { m: 7.0, ts: 26 }, { m: 7.5, ts: 23 },
];

/* ---------------- Constructores de piezas ---------------- */
function buildPanelMontaje() {
  const g = new THREE.Group();
  const back = roundedBox(1.5, 2.5, 0.06, MAT.panel, 0.03);
  back.position.set(0, 0, -0.06);
  back.castShadow = true; back.receiveShadow = true;
  g.add(back);
  for (let i = 0; i < 4; i++) {
    const rail = new THREE.Mesh(new THREE.BoxGeometry(1.4, 0.035, 0.03), MAT.dinRail);
    rail.position.set(0, 1.0 - i * 0.6, -0.02);
    rail.castShadow = true; rail.receiveShadow = true;
    g.add(rail);
  }
  const lb = labelSprite('Panel de montaje', '#8A94A0');
  lb.position.set(0, -1.4, 0.05);
  lb.scale.multiplyScalar(0.6);
  g.add(lb);
  return g;
}

function buildTerminalBlock(labelText, tags) {
  const g = new THREE.Group();
  const base = roundedBox(0.5, 0.16, 0.16, MAT.termLid, 0.02);
  base.castShadow = true; base.receiveShadow = true;
  g.add(base);
  for (let i = 0; i < 3; i++) {
    const post = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.05, 12), MAT.termMetal);
    post.position.set(-0.16 + i * 0.16, 0.1, 0);
    post.castShadow = true;
    g.add(post);
    const tl = labelSprite(tags[i], '#dfe7ee');
    tl.position.set(-0.16 + i * 0.16, 0.17, 0);
    tl.scale.multiplyScalar(0.22);
    g.add(tl);
  }
  const lb = labelSprite(labelText, '#8A94A0');
  lb.position.set(0, -0.16, 0);
  lb.scale.multiplyScalar(0.52);
  g.add(lb);
  return g;
}
function buildTerminalesLinea() { return buildTerminalBlock('Terminales de línea', ['L1', 'L2', 'L3']); }
function buildTerminalesMotor() { return buildTerminalBlock('Terminales al motor', ['U', 'V', 'W']); }

function buildContactorBody(labelText, hex) {
  const cssColor = '#' + hex.toString(16).padStart(6, '0');
  const g = new THREE.Group();
  const body = roundedBox(0.34, 0.4, 0.28, MAT.contactorBody, 0.04);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const clear = roundedBox(0.24, 0.16, 0.02, MAT.contactorClear, 0.02);
  clear.position.set(0, 0.1, 0.15);
  g.add(clear);
  for (let i = 0; i < 3; i++) {
    const term = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.05, 10), MAT.termMetal);
    term.position.set(-0.1 + i * 0.1, 0.22, 0);
    term.castShadow = true;
    g.add(term);
    const term2 = term.clone();
    term2.position.set(-0.1 + i * 0.1, -0.22, 0);
    g.add(term2);
  }
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.028, 14, 10), std({
    color: hex, emissive: hex, emissiveIntensity: 0.05, metalness: 0.2, roughness: 0.4,
  }));
  led.position.set(0, -0.05, 0.15);
  g.add(led);
  g.userData.coilLed = led;
  const lb = labelSprite(labelText, cssColor);
  lb.position.set(0, -0.32, 0);
  lb.scale.multiplyScalar(0.55);
  g.add(lb);
  return g;
}
function buildKM1() { return buildContactorBody('KM1 · Adelante', 0x43D9AD); }
function buildKM2() { return buildContactorBody('KM2 · Reversa', 0xe0b23c); }

function buildEnclavamientoMecanico() {
  const g = new THREE.Group();
  const bar = roundedBox(0.46, 0.05, 0.05, MAT.dark, 0.015);
  bar.castShadow = true; bar.receiveShadow = true;
  g.add(bar);
  for (let i = -1; i <= 1; i += 2) {
    const bolt = new THREE.Mesh(new THREE.CylinderGeometry(0.02, 0.02, 0.07, 10), MAT.termMetal);
    bolt.rotation.z = Math.PI / 2;
    bolt.position.set(i * 0.2, 0, 0);
    bolt.castShadow = true;
    g.add(bolt);
  }
  const lb = labelSprite('Enclavamiento mecánico', '#8A94A0');
  lb.position.set(0, -0.14, 0);
  lb.scale.multiplyScalar(0.5);
  g.add(lb);
  return g;
}

function buildPuenteElectrico() {
  const g = new THREE.Group();
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, 0.06, 0),
    new THREE.Vector3(0, 0.14, 0.05),
    new THREE.Vector3(0.22, 0.06, 0),
  ]);
  const tube = new THREE.Mesh(new THREE.TubeGeometry(curve, 24, 0.012, 8, false), MAT.wireInterlock);
  tube.castShadow = true;
  g.add(tube);
  const curve2 = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-0.22, -0.06, 0),
    new THREE.Vector3(0, -0.14, 0.05),
    new THREE.Vector3(0.22, -0.06, 0),
  ]);
  const tube2 = new THREE.Mesh(new THREE.TubeGeometry(curve2, 24, 0.012, 8, false), MAT.wireInterlock);
  tube2.castShadow = true;
  g.add(tube2);
  const lb = labelSprite('Enclavamiento eléctrico (NC cruzado)', '#f4c95d');
  lb.position.set(0, -0.28, 0);
  lb.scale.multiplyScalar(0.48);
  g.add(lb);
  return g;
}

function buildRelevadorTermico() {
  const g = new THREE.Group();
  const body = roundedBox(0.4, 0.32, 0.2, MAT.termMetal, 0.03);
  body.castShadow = true; body.receiveShadow = true;
  g.add(body);
  const dial = new THREE.Mesh(new THREE.CylinderGeometry(0.09, 0.09, 0.015, 24), MAT.dark);
  dial.rotation.x = Math.PI / 2;
  dial.position.set(0, 0.02, 0.11);
  g.add(dial);
  const needleGeo = new THREE.BoxGeometry(0.075, 0.008, 0.006);
  needleGeo.translate(0.0375, 0, 0);
  const needle = new THREE.Mesh(needleGeo, MAT.needleRed);
  needle.position.set(0, 0.02, 0.12);
  g.add(needle);
  g.userData.needle = needle;
  for (let i = 0; i < 3; i++) {
    const term = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.04, 10), MAT.termMetal);
    term.position.set(-0.12 + i * 0.12, -0.19, 0);
    term.castShadow = true;
    g.add(term);
  }
  const lb = labelSprite('Relevador térmico', '#8A94A0');
  lb.position.set(0, -0.32, 0);
  lb.scale.multiplyScalar(0.5);
  g.add(lb);
  return g;
}

function buildBotonera() {
  const g = new THREE.Group();
  const box = roundedBox(0.3, 0.5, 0.16, MAT.panel, 0.04);
  box.castShadow = true; box.receiveShadow = true;
  g.add(box);
  const btns = [
    { y: 0.15, color: 0x43D9AD, name: 'Adelante' },
    { y: 0, color: 0xd64545, name: 'Paro' },
    { y: -0.15, color: 0xe0b23c, name: 'Reversa' },
  ];
  btns.forEach((b) => {
    const knob = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.05, 20), std({
      color: b.color, metalness: 0.3, roughness: 0.4,
    }));
    knob.rotation.x = Math.PI / 2;
    knob.position.set(0, b.y, 0.1);
    knob.castShadow = true;
    g.add(knob);
  });
  const lb = labelSprite('Botonera 3 hilos', '#8A94A0');
  lb.position.set(0, -0.32, 0);
  lb.scale.multiplyScalar(0.55);
  g.add(lb);
  return g;
}

/* ---------------- Registro de piezas ---------------- */
const HUB = [0, 1.35, 0];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const H = (dx, dy, dz) => V(HUB[0] + dx, HUB[1] + dy, HUB[2] + dz);

const PARTS = [
  { id: 'terminalesLinea', name: 'Terminales de línea', build: () => buildTerminalesLinea(), home: H(0, 0.62, 0.12), note: 'L1, L2, L3 llegan aquí desde la acometida trifásica — el punto de partida del circuito de fuerza.' },
  { id: 'km1', name: 'Contactor KM1 (Adelante)', build: () => buildKM1(), home: H(-0.42, 0.16, 0.15), note: 'KM1 energizado conecta L1→U, L2→V, L3→W: el motor gira en sentido Adelante.' },
  { id: 'km2', name: 'Contactor KM2 (Reversa)', build: () => buildKM2(), home: H(0.42, 0.16, 0.15), note: 'KM2 energizado invierte dos fases: L1→W, L2→V, L3→U — el motor gira en sentido Reversa.' },
  { id: 'enclavamiento', name: 'Enclavamiento mecánico', build: () => buildEnclavamientoMecanico(), home: H(0, 0.16, 0.3), note: 'Barra física entre KM1 y KM2: si uno está cerrado, impide mecánicamente que el otro cierre.' },
  { id: 'puenteElectrico', name: 'Enclavamiento eléctrico', build: () => buildPuenteElectrico(), home: H(0, 0.4, 0.24), note: 'Contacto NC de cada contactor cableado en la bobina del otro: segunda barrera, independiente de la mecánica.' },
  { id: 'relevadorTermico', name: 'Relevador térmico', build: () => buildRelevadorTermico(), home: H(0, -0.24, 0.15), note: 'Protege el motor por sobrecarga sostenida — su clase de disparo (10/20/30) se explora en el modo Térmico.' },
  { id: 'terminalesMotor', name: 'Terminales al motor', build: () => buildTerminalesMotor(), home: H(0, -0.6, 0.12), note: 'U, V, W: el lado de carga del arrancador, cableado al motor trifásico.' },
  { id: 'botonera', name: 'Botonera de 3 hilos', build: () => buildBotonera(), home: H(1.3, 0, 0.06), note: 'Paro (NC), Adelante (NO) y Reversa (NO) con contacto de sello — el circuito de control clásico de arranque reversible.' },
];
const ORDER = PARTS.map((p) => p.id);
const PART = Object.fromEntries(PARTS.map((p) => [p.id, p]));

const panelMontaje = buildPanelMontaje();
panelMontaje.position.set(...HUB);
scene.add(panelMontaje);

/* ---------------- Estado de ensamble (patrón genérico — reutilizable en las 150 prácticas) ---------------- */
const STAGE_S = 0.42;
const groups = {}, ghosts = {}, labels = {};
let placed = {}, selectedId = null, progress = 0, simUnlocked = false;
const tweens = [];
const trayObjs = [], ghostObjs = [], scratch = [];

const benchG = new THREE.Group();
scene.add(benchG);
function pedBaseXZ(i) {
  const n = PARTS.length;
  const cols = 4;
  const row = Math.floor(i / cols), col = i % cols;
  const x = -1.7 + col * 0.62;
  const z = 2.0 + row * 0.62;
  return [x, z];
}
(() => {
  const top = roundedBox(3.0, 0.08, 1.6, MAT.bench, 0.02);
  top.position.set(-0.5, -0.05, 2.3);
  top.receiveShadow = true;
  benchG.add(top);
  [[-1.9, -0.55, 1.55], [-1.9, -0.55, 3.05], [0.9, -0.55, 1.55], [0.9, -0.55, 3.05]].forEach((p) => {
    const leg = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 0.9, 10), MAT.benchLeg);
    leg.position.set(p[0], p[1], p[2]);
    leg.castShadow = true;
    benchG.add(leg);
  });
})();
function resetPedestals() {
  benchG.children.slice(2).forEach((c) => benchG.remove(c));
  PARTS.forEach((p, i) => {
    const [x, z] = pedBaseXZ(i);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.16, 0.18, 0.08, 20), MAT.ped);
    ped.position.set(x, 0.03, z);
    ped.receiveShadow = true;
    benchG.add(ped);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.14, 0.14, 0.02, 20), MAT.pedTop);
    top.position.set(x, 0.08, z);
    benchG.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.15, 0.008, 8, 24), MAT.pedRing);
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, 0.09, z);
    ring.material = ring.material.clone();
    ring.material.opacity = 0;
    ring.material.transparent = true;
    benchG.add(ring);
    p._ped = { ped, top, ring, x, z };
  });
}
function markPedestalDone(i) {
  const p = PARTS[i];
  if (!p._ped) return;
  p._ped.ring.material.opacity = 1;
}
resetPedestals();

function ghostMat() {
  return new THREE.MeshBasicMaterial({ color: 0x8fd1ff, transparent: true, opacity: 0.18, wireframe: false, depthWrite: false });
}
function makeGhost(part) {
  const g = part.build();
  g.traverse((o) => { if (o.isMesh) { o.material = ghostMat(); o.castShadow = false; o.receiveShadow = false; } });
  g.position.copy(part.home);
  g.userData.kind = 'slot';
  g.userData.partId = part.id;
  scene.add(g);
  ghostObjs.push(g);
  return g;
}
function showGhostFor(id) { if (ghosts[id]) ghosts[id].visible = true; }
function updateLabels() {}

function tagged(obj) { let o = obj; while (o && !o.userData.kind) o = o.parent; return o; }

function makePart(part, i) {
  const g = part.build();
  const [x, z] = pedBaseXZ(i);
  g.position.set(x, 0.14, z);
  g.scale.setScalar(STAGE_S * 0 + 1);
  g.userData.kind = 'part';
  g.userData.partId = part.id;
  g.userData.homePos = { x, y: 0.14, z };
  scene.add(g);
  trayObjs.push(g);
  return g;
}

function initAssembly() {
  Object.values(groups).forEach((g) => scene.remove(g));
  ghostObjs.forEach((g) => scene.remove(g));
  trayObjs.length = 0; ghostObjs.length = 0;
  Object.keys(groups).forEach((k) => delete groups[k]);
  Object.keys(ghosts).forEach((k) => delete ghosts[k]);
  placed = {}; selectedId = null; progress = 0; simUnlocked = false;
  resetPedestals();
  PARTS.forEach((part, i) => {
    const g = makePart(part, i);
    groups[part.id] = g;
    const gh = makeGhost(part);
    gh.visible = false;
    ghosts[part.id] = gh;
  });
  renderChecklist();
  renderProg();
  S.moveTo([3.2, 2.4, 4.2], [0, 1.35, 0], 1.3);
}

function selectPart(id) {
  if (placed[id]) return;
  selectedId = id;
  showGhostFor(id);
  showToast(`Seleccionaste: <b>${PART[id].name}</b>. Toca el pedestal marcado para colocarla.`, 2000);
  synth.beep(440, 0.06, 0.04);
}
function deselect() {
  if (selectedId && ghosts[selectedId]) ghosts[selectedId].visible = false;
  selectedId = null;
}
function placePart(id) {
  const part = PART[id];
  const g = groups[id];
  const i = ORDER.indexOf(id);
  const targetPos = part.home.clone();
  tweens.push({
    obj: g, t: 0, dur: 0.75,
    from: g.position.clone(), to: targetPos,
    onDone: () => {
      placed[id] = true;
      progress++;
      markPedestalDone(i);
      g.userData.kind = 'placed';
      if (ghosts[id]) ghosts[id].visible = false;
      showToast(`✔ ${part.name} colocado. ${part.note}`, 3600);
      synth.beep(880, 0.09, 0.05);
      renderChecklist(); renderProg();
      if (progress >= PARTS.length) finishAssembly();
    },
  });
  if (selectedId === id) deselect();
}
function wrongSlot(slotId) {
  showToast('<span style="color:var(--bad)">✗ Esa pieza no va en ese pedestal.</span>', 1800);
  synth.beep(160, 0.12, 0.06);
  const gh = ghosts[slotId];
  if (gh) scratch.push({ obj: gh, t: 0 });
}
function finishAssembly() {
  simUnlocked = true;
  syncCtrlbar();
  S.setCinematicIdle(true);
  showToast('🔓 Arrancador armado. Se desbloquearon los modos Circuito, Térmico y Reto.', 4200);
  synth.beep(660, 0.1, 0.05); setTimeout(() => synth.beep(990, 0.14, 0.06), 140);
}

pickerFor(scene, S.camera, mount, (hit) => {
  const t = tagged(hit);
  if (!t) return;
  if (t.userData.kind === 'part') {
    if (selectedId === t.userData.partId) placePart(t.userData.partId);
    else selectPart(t.userData.partId);
  } else if (t.userData.kind === 'slot') {
    if (selectedId && selectedId === t.userData.partId) placePart(selectedId);
    else if (selectedId) wrongSlot(t.userData.partId);
  } else if (t.userData.kind === 'placed') {
    showToast(`<b>${PART[t.userData.partId].name}</b> ya está en su lugar. ${PART[t.userData.partId].note}`, 2600);
  }
});

function renderChecklist() {
  const box = el('checklist');
  if (!box) return;
  box.innerHTML = ORDER.map((id) => {
    const done = !!placed[id];
    return `<div class="li"><span class="dot" style="background:${done ? '#43D9AD' : '#3a4149'}"></span>${PART[id].name}${done ? ' ✔' : ''}</div>`;
  }).join('');
}
function renderProg() {
  const p = el('progTxt');
  if (p) p.textContent = `${progress}/${PARTS.length}`;
}

/* ---------------- Tablero de simulación (canvas 1024×768) ---------------- */
const boardG = new THREE.Group();
const bFrame = roundedBox(1.66, 1.26, 0.06, MAT.termLid, 0.04);
boardG.add(bFrame);
const bCv = document.createElement('canvas');
bCv.width = 1024; bCv.height = 768;
const bCx = bCv.getContext('2d');
const bTex = new THREE.CanvasTexture(bCv);
const board = new THREE.Mesh(new THREE.PlaneGeometry(1.56, 1.16), new THREE.MeshBasicMaterial({ map: bTex, toneMapped: false }));
board.position.set(0, 0, 0.015);
boardG.add(board);
boardG.position.set(-2.6, 1.65, -0.2);
boardG.rotation.y = 0.28;
scene.add(boardG);

function line(x1, y1, x2, y2, color, w = 3) {
  bCx.strokeStyle = color; bCx.lineWidth = w;
  bCx.beginPath(); bCx.moveTo(x1, y1); bCx.lineTo(x2, y2); bCx.stroke();
}
function labelAt(x, y, text, color = '#dfe7ee', size = 20, align = 'left') {
  bCx.fillStyle = color; bCx.font = `${size}px system-ui, sans-serif`; bCx.textAlign = align;
  bCx.fillText(text, x, y);
}
function wrapText(x, y, text, color, size, maxW, lh = size * 1.35) {
  bCx.fillStyle = color; bCx.font = `${size}px system-ui, sans-serif`; bCx.textAlign = 'left';
  const words = text.split(' ');
  let line1 = '', yy = y;
  for (const w of words) {
    const test = line1 ? line1 + ' ' + w : w;
    if (bCx.measureText(test).width > maxW && line1) { bCx.fillText(line1, x, yy); line1 = w; yy += lh; }
    else line1 = test;
  }
  if (line1) { bCx.fillText(line1, x, yy); yy += lh; }
  return yy;
}

const STATE = {
  circ: { mode: 'parado', interlockOn: true, fault: false },
  term: { m: 6.0, clase: 20 },
};

function drawCircuito() {
  const c = STATE.circ;
  bCx.clearRect(0, 0, 1024, 768); bCx.fillStyle = '#0b1116'; bCx.fillRect(0, 0, 1024, 768);
  labelAt(40, 50, 'Circuito de fuerza — arranque reversible con enclavamiento', '#8fd1ff', 26);
  const busY = 100, busX = [300, 380, 460];
  ['L1', 'L2', 'L3'].forEach((t, i) => { labelAt(busX[i], busY - 16, t, '#8A94A0', 16, 'center'); line(busX[i], busY, busX[i], 140, '#5b6672', 3); });
  const km1X = 180, km1On = c.mode === 'adelante' || c.mode === 'ambos';
  const km1Color = c.fault ? '#d64545' : (km1On ? '#43D9AD' : '#3a4149');
  const boxKM1 = { x: km1X - 90, y: 150, w: 180, h: 70 };
  bCx.strokeStyle = km1Color; bCx.lineWidth = 3; bCx.strokeRect(boxKM1.x, boxKM1.y, boxKM1.w, boxKM1.h);
  labelAt(km1X, 185, 'KM1 · ADELANTE', km1Color, 18, 'center');
  labelAt(km1X, 208, km1On ? 'ENERGIZADO' : 'abierto', km1Color, 14, 'center');
  const km2X = 580, km2On = c.mode === 'reversa' || c.mode === 'ambos';
  const km2Color = c.fault ? '#d64545' : (km2On ? '#e0b23c' : '#3a4149');
  const boxKM2 = { x: km2X - 90, y: 150, w: 180, h: 70 };
  bCx.strokeStyle = km2Color; bCx.lineWidth = 3; bCx.strokeRect(boxKM2.x, boxKM2.y, boxKM2.w, boxKM2.h);
  labelAt(km2X, 185, 'KM2 · REVERSA', km2Color, 18, 'center');
  labelAt(km2X, 208, km2On ? 'ENERGIZADO' : 'abierto', km2Color, 14, 'center');
  labelAt(km1X, 240, 'L1→U  L2→V  L3→W', km1On ? '#43D9AD' : '#5b6672', 15, 'center');
  labelAt(km2X, 240, 'L1→W  L2→V  L3→U', km2On ? '#e0b23c' : '#5b6672', 15, 'center');
  const mx = 380, my = 340, mr = 70;
  bCx.strokeStyle = c.fault ? '#d64545' : '#8fd1ff'; bCx.lineWidth = 3;
  bCx.beginPath(); bCx.arc(mx, my, mr, 0, Math.PI * 2); bCx.stroke();
  labelAt(mx, my - 4, 'M', c.fault ? '#d64545' : '#dfe7ee', 30, 'center');
  labelAt(mx, my + 22, '3~', c.fault ? '#d64545' : '#8A94A0', 16, 'center');
  line(km1X, 220, mx - 30, my - mr, km1On ? km1Color : '#2a2f35', km1On ? 3 : 2);
  line(km2X, 220, mx + 30, my - mr, km2On ? km2Color : '#2a2f35', km2On ? 3 : 2);
  const rot = c.fault ? '⚡ FALLA' : (c.mode === 'adelante' ? '⟳ Horario (CW)' : (c.mode === 'reversa' ? '⟲ Antihorario (CCW)' : '— detenido'));
  labelAt(mx, my + mr + 34, rot, c.fault ? '#d64545' : (c.mode === 'parado' ? '#5b6672' : '#43D9AD'), 20, 'center');
  const ey = 470;
  labelAt(40, ey, 'Enclavamiento mecánico: presente (barra física entre KM1 y KM2)', '#8A94A0', 16);
  labelAt(40, ey + 30, `Enclavamiento eléctrico (NC cruzado): ${c.interlockOn ? 'ACTIVO' : 'DESACTIVADO (bypass didáctico)'}`, c.interlockOn ? '#43D9AD' : '#f4c95d', 18);
  if (c.fault) {
    labelAt(40, ey + 70, '⚡ CORTOCIRCUITO FASE-FASE: KM1 y KM2 energizados a la vez alimentan al motor con dos secuencias de fase distintas al mismo tiempo.', '#d64545', 16);
    wrapText(40, ey + 100, 'Esto es exactamente lo que el enclavamiento (mecánico + eléctrico) existe para impedir. En campo, jamás se desactivan ambos enclavamientos a la vez.', '#f4c95d', 15, 920);
  } else {
    wrapText(40, ey + 70, 'Con el enclavamiento activo, el circuito de control impide físicamente cerrar KM2 mientras KM1 está energizado (y viceversa): hay que pasar por Paro para cambiar de sentido.', '#8A94A0', 15, 920);
  }
  bTex.needsUpdate = true;
  const rt = el('circStatus');
  if (rt) rt.textContent = `Estado: ${c.mode.toUpperCase()} · Enclavamiento eléctrico: ${c.interlockOn ? 'ON' : 'OFF'}` + (c.fault ? ' · ⚡ FALLA: cortocircuito fase-fase' : '');
}

function drawTermico() {
  const { m, clase } = STATE.term;
  bCx.clearRect(0, 0, 1024, 768); bCx.fillStyle = '#0b1116'; bCx.fillRect(0, 0, 1024, 768);
  labelAt(40, 50, 'Relevador térmico — tiempo de disparo a 7.2× In', '#8fd1ff', 26);
  labelAt(40, 90, `Múltiplo de sobrecarga actual: m = ${tf(m, 1)} × Ir`, '#dfe7ee', 20);
  const ox = 280, oy = 140, barH = 56, gap = 34, maxT = 100, w = 620;
  CLASS_ORDER.forEach((c, i) => {
    const t = tripTime(m, c);
    const y = oy + i * (barH + gap);
    const sel = c === clase;
    const bw = Math.min(w, (t / maxT) * w);
    bCx.fillStyle = sel ? (c === 10 ? '#43D9AD' : c === 20 ? '#e0b23c' : '#d64545') : '#2a2f35';
    bCx.fillRect(ox, y, bw, barH);
    labelAt(ox - 16, y + barH * 0.65, `Clase ${c}`, sel ? '#dfe7ee' : '#7a8a96', 18, 'right');
    labelAt(ox + bw + 14, y + barH * 0.65, `${tf(t, 1)} s`, sel ? '#dfe7ee' : '#5b6672', 16, 'left');
  });
  const axisBottom = oy + CLASS_ORDER.length * (barH + gap) - gap + 10;
  line(ox, oy - 14, ox, axisBottom, '#5b6672', 2);
  for (let s = 0; s <= maxT; s += 20) { const x = ox + (s / maxT) * w; line(x, oy - 14, x, axisBottom, '#20262c', 1); labelAt(x, oy - 22, `${s}s`, '#5b6672', 14, 'center'); }
  const py = axisBottom + 50;
  labelAt(40, py, `Clase seleccionada: ${TRIP_CLASSES[clase].nombre}`, '#8fd1ff', 22);
  labelAt(40, py + 36, `Tiempo de disparo máximo a m=${tf(m, 1)}×Ir: ${tf(tripTime(m, clase), 2)} s`, '#dfe7ee', 18);
  wrapText(40, py + 72, 'IEC 60947-4-1 solo fija el tiempo MÁXIMO de disparo a 7.2×Ir por clase (10A/10/20/30); el tiempo mínimo real depende del fabricante y no se modela aquí.', '#8A94A0', 15, 920);
  bTex.needsUpdate = true;
  const rt = el('termStatus');
  if (rt) rt.textContent = `m=${tf(m, 1)}×Ir · Clase ${clase} · t_disparo(máx)=${tf(tripTime(m, clase), 2)} s`;
}

let RETO = { active: false, m: 6, ts: 8, answer: 20 };
let retoSolved = false;
function pick(a) { return a[Math.floor(Math.random() * a.length)]; }
function drawReto() {
  const r = RETO;
  bCx.clearRect(0, 0, 1024, 768); bCx.fillStyle = '#0b1116'; bCx.fillRect(0, 0, 1024, 768);
  labelAt(40, 50, 'Reto — ¿qué clase de relevador térmico eliges?', '#8fd1ff', 26);
  labelAt(40, 110, 'Escenario:', '#8fd1ff', 20);
  labelAt(40, 150, `Corriente de arranque del motor: m = ${tf(r.m, 1)} × Ir (equivalente a 7.2× In en la curva de disparo)`, '#dfe7ee', 18);
  labelAt(40, 185, `Tiempo real de arranque del motor: ts = ${r.ts} s`, '#dfe7ee', 20);
  const yy = wrapText(40, 230, 'Elige la clase de disparo (10, 20 o 30) más rápida que NO dispare en falso durante este arranque, pero sí proteja el motor ante una sobrecarga sostenida.', '#dfe7ee', 18, 920);
  labelAt(40, yy + 40, '¿Cuál es la clase mínima correcta? (elige abajo)', '#f4c95d', 22);
  if (retoSolved) labelAt(40, yy + 80, `✔ Correcto: Clase ${r.answer}`, '#43D9AD', 22);
  bTex.needsUpdate = true;
  const rt = el('retoText');
  if (rt) rt.textContent = `m=${tf(r.m, 1)}×Ir · ts=${r.ts}s` + (retoSolved ? ` ✔ Correcto: Clase ${r.answer}` : '');
}
function newChallenge() {
  const s = pick(RETO_SCENARIOS);
  RETO = { active: true, m: s.m, ts: s.ts, answer: minClassFor(s.m, s.ts) };
  retoSolved = false;
  drawReto();
  showToast('🎲 Nuevo escenario de arranque generado.');
  synth.beep(520, 0.08, 0.05);
}
function checkReto(guessClase) {
  const ok = Number(guessClase) === RETO.answer;
  retoSolved = ok;
  if (ok) { showToast('<span style="color:var(--good)">✔ Correcto: clase mínima que no dispara en falso durante el arranque.</span>'); synth.beep(1046, 0.12, 0.06); }
  else { showToast('<span style="color:var(--bad)">✗ No es correcto. Compara el tiempo de disparo de cada clase contra el tiempo de arranque.</span>'); synth.beep(180, 0.14, 0.06); }
  drawReto();
}

function drawBoard() {
  if (mode === 'circuito') drawCircuito();
  else if (mode === 'termico') drawTermico();
  else if (mode === 'reto') drawReto();
}
function updateTele() {
  const c = STATE.circ;
  const tm = el('t_circMode'); if (tm) tm.textContent = c.mode.toUpperCase();
  const ti = el('t_circInterlock'); if (ti) ti.textContent = c.interlockOn ? 'activo' : 'desactivado (bypass)';
  const tfa = el('t_circFault'); if (tfa) tfa.textContent = c.fault ? '⚡ SÍ — cortocircuito fase-fase' : 'no';
  const { m, clase } = STATE.term;
  const tmm = el('t_termM'); if (tmm) tmm.textContent = `${tf(m, 1)} × Ir`;
  const tc = el('t_termClase'); if (tc) tc.textContent = TRIP_CLASSES[clase].nombre;
  const tt = el('t_termTiempo'); if (tt) tt.textContent = `${tf(tripTime(m, clase), 2)} s`;
}
function refreshAll() { updateTele(); if (mode === 'circuito' || mode === 'termico' || mode === 'reto') drawBoard(); }

/* ---------------- Controles de circuito ---------------- */
function pressParo() {
  STATE.circ.mode = 'parado'; STATE.circ.fault = false;
  refreshAll();
  showToast('⏹ Paro — circuito de control abierto.');
  synth.beep(300, 0.08, 0.05);
}
function pressAdelante() {
  const c = STATE.circ;
  if (c.interlockOn && c.mode === 'reversa') { showToast('<span style="color:var(--bad)">🔒 Enclavado: primero pulsa Paro para cambiar de sentido.</span>'); synth.beep(220, 0.1, 0.05); return; }
  c.mode = (!c.interlockOn && c.mode === 'reversa') ? 'ambos' : 'adelante';
  c.fault = c.mode === 'ambos';
  refreshAll();
  if (c.fault) { showToast('<span style="color:var(--bad)">⚡ Sin enclavamiento: KM1 y KM2 energizados a la vez — cortocircuito fase-fase.</span>'); synth.beep(140, 0.2, 0.07); }
  else { showToast('▶ KM1 energizado — Adelante.'); synth.beep(660, 0.08, 0.05); }
}
function pressReversa() {
  const c = STATE.circ;
  if (c.interlockOn && c.mode === 'adelante') { showToast('<span style="color:var(--bad)">🔒 Enclavado: primero pulsa Paro para cambiar de sentido.</span>'); synth.beep(220, 0.1, 0.05); return; }
  c.mode = (!c.interlockOn && c.mode === 'adelante') ? 'ambos' : 'reversa';
  c.fault = c.mode === 'ambos';
  refreshAll();
  if (c.fault) { showToast('<span style="color:var(--bad)">⚡ Sin enclavamiento: KM1 y KM2 energizados a la vez — cortocircuito fase-fase.</span>'); synth.beep(140, 0.2, 0.07); }
  else { showToast('◀ KM2 energizado — Reversa.'); synth.beep(560, 0.08, 0.05); }
}
function toggleInterlock() {
  const c = STATE.circ;
  c.interlockOn = !c.interlockOn;
  if (c.interlockOn && c.mode === 'ambos') { c.mode = 'parado'; c.fault = false; showToast('🔒 Enclavamiento restaurado — el circuito fuerza Paro.'); }
  else { showToast(c.interlockOn ? '🔒 Enclavamiento eléctrico reactivado.' : '<span style="color:var(--bad)">⚠ Enclavamiento eléctrico desactivado (solo fines didácticos).</span>'); }
  refreshAll();
}
function setTermM(delta) {
  STATE.term.m = Math.max(4, Math.min(8, +(STATE.term.m + delta).toFixed(1)));
  refreshAll();
}
function setTermClase(c) { STATE.term.clase = Number(c); refreshAll(); }

/* ---------------- Modos ---------------- */
const MODE_META = {
  ensamble: { nombre: 'Ensamble', cam: [[3.2, 2.4, 4.2], [0, 1.35, 0]] },
  circuito: { nombre: 'Circuito', cam: [[-1.0, 2.05, 2.35], [-2.6, 1.65, -0.2]] },
  termico: { nombre: 'Térmico', cam: [[-1.0, 2.05, 2.35], [-2.6, 1.65, -0.2]] },
  reto: { nombre: 'Reto', cam: [[-1.0, 2.05, 2.35], [-2.6, 1.65, -0.2]] },
};
const modes = ['ensamble', 'circuito', 'termico', 'reto'];
let mode = 'ensamble';

function setMode(k) {
  if (k !== 'ensamble' && !simUnlocked) {
    showToast('<span style="color:var(--bad)">🔒 Arma primero el arrancador completo en el modo Ensamble.</span>');
    return;
  }
  mode = k;
  document.querySelectorAll('.modebar .b').forEach((b) => b.classList.toggle('on', b.dataset.mode === k));
  modes.forEach((m) => { const sec = el('sec' + m[0].toUpperCase() + m.slice(1)); if (sec) sec.style.display = m === k ? '' : 'none'; });
  const meta = MODE_META[k];
  S.moveTo(meta.cam[0], meta.cam[1], 1.3);
  if (k === 'reto' && !RETO.active) newChallenge();
  refreshAll();
}
function syncCtrlbar() {
  document.querySelectorAll('.modebar .b').forEach((b) => {
    if (b.dataset.mode === 'ensamble') return;
    b.disabled = !simUnlocked;
  });
}

/* ---------------- Recorridos guiados ---------------- */
const sleep = (ms) => new Promise((res) => setTimeout(res, ms));
let autoRunning = false;
async function autoAssemble() {
  if (autoRunning) return; autoRunning = true;
  const btn = el('btnAutoEns'); if (btn) btn.disabled = true;
  for (const id of ORDER) {
    if (placed[id]) continue;
    selectPart(id); await sleep(550);
    placePart(id); await sleep(950);
  }
  if (btn) btn.disabled = false; autoRunning = false;
}
async function autoCircuitoTour() {
  if (autoRunning) return; autoRunning = true;
  const btn = el('btnAutoCirc'); if (btn) btn.disabled = true;
  pressParo(); await sleep(900);
  pressAdelante(); await sleep(1600);
  pressParo(); await sleep(700);
  pressReversa(); await sleep(1600);
  pressParo(); await sleep(700);
  toggleInterlock(); await sleep(700);
  pressAdelante(); await sleep(900);
  pressReversa(); await sleep(1800);
  toggleInterlock(); await sleep(1200);
  if (btn) btn.disabled = false; autoRunning = false;
}
async function autoTermicoTour() {
  if (autoRunning) return; autoRunning = true;
  const btn = el('btnAutoTerm'); if (btn) btn.disabled = true;
  for (const clase of CLASS_ORDER) {
    STATE.term.clase = clase;
    const sel = el('selClase'); if (sel) sel.value = String(clase);
    refreshAll(); await sleep(1500);
  }
  for (const m of [4, 5, 6, 7, 8]) { STATE.term.m = m; refreshAll(); await sleep(1200); }
  if (btn) btn.disabled = false; autoRunning = false;
}

/* ---------------- Loop de animación ---------------- */
S.setAnimate((dt, t) => {
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt / tw.dur;
    const k = ease(Math.min(1, tw.t));
    tw.obj.position.lerpVectors(tw.from, tw.to, k);
    if (tw.t >= 1) { tw.obj.position.copy(tw.to); tweens.splice(i, 1); if (tw.onDone) tw.onDone(); }
  }
  for (let i = scratch.length - 1; i >= 0; i--) {
    const sc = scratch[i];
    sc.t += dt;
    sc.obj.position.x += Math.sin(sc.t * 40) * 0.002;
    if (sc.t > 0.3) { sc.obj.position.x = sc.obj.userData.partId ? PART[sc.obj.userData.partId].home.x : sc.obj.position.x; scratch.splice(i, 1); }
  }
  trayObjs.forEach((g) => {
    const isSel = g.userData.partId === selectedId;
    const home = g.userData.homePos;
    if (!home) return;
    const targetY = home.y + (isSel ? 0.08 + Math.sin(t * 3) * 0.02 : 0);
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 6);
    if (isSel) g.rotation.y += dt * 1.4;
  });
  ghostObjs.forEach((g) => {
    if (!g.visible) return;
    g.traverse((o) => { if (o.isMesh) o.material.opacity = 0.14 + 0.12 * (0.5 + 0.5 * Math.sin(t * 3)); });
  });
  if (groups.relevadorTermico && groups.relevadorTermico.userData.needle) {
    const nd = groups.relevadorTermico.userData.needle;
    const frac = (STATE.term.m - 4) / (8 - 4);
    const targetRot = -0.9 + frac * 1.8;
    nd.rotation.z += (targetRot - nd.rotation.z) * Math.min(1, dt * 4);
  }
  if (mode === 'circuito') {
    const km1On = STATE.circ.mode === 'adelante' || STATE.circ.mode === 'ambos';
    const km2On = STATE.circ.mode === 'reversa' || STATE.circ.mode === 'ambos';
    if (groups.km1 && groups.km1.userData.coilLed) groups.km1.userData.coilLed.material.emissiveIntensity = km1On ? (0.6 + 0.4 * Math.sin(t * 6)) : 0.05;
    if (groups.km2 && groups.km2.userData.coilLed) groups.km2.userData.coilLed.material.emissiveIntensity = km2On ? (0.6 + 0.4 * Math.sin(t * 6)) : 0.05;
  }
});
S.start();

/* ---------------- HUD ---------------- */
document.getElementById('hud').innerHTML = `
  <div class="eyebrow">Máquinas eléctricas · D5</div>
  <h2>Inversión de giro con contactores y enclavamiento</h2>
  <p>Arma un arrancador reversible sobre un panel de montaje —dos contactores, enclavamiento mecánico y eléctrico, relevador térmico y botonera de 3 hilos— y luego explora por qué el enclavamiento es obligatorio, cómo se elige la clase de disparo de un relevador térmico y resuelve retos de selección.</p>
  <div class="formula">t_disparo = t_máx(clase) · (7.2 / m)²  ·  clases 10 / 20 / 30 según IEC 60947-4-1</div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#43D9AD"></span>KM1 · Adelante (L1-U, L2-V, L3-W)</div>
    <div class="li"><span class="dot" style="background:#e0b23c"></span>KM2 · Reversa (L1-W, L2-V, L3-U)</div>
    <div class="li"><span class="dot" style="background:#f4c95d"></span>Enclavamiento eléctrico (NC cruzado)</div>
    <div class="li"><span class="dot" style="background:#d64545"></span>Relevador térmico (aguja de clase)</div>
    <div class="li"><span class="dot" style="background:#8A94A0"></span>Terminales de línea / motor</div>
  </div>
  <div class="fid">
    <div class="ft">Contrato de fidelidad</div>
    <div class="fl">SÍ modela: la lógica de enclavamiento eléctrico+mecánico de un arrancador reversible y por qué es obligatorio; la secuencia de fases invertida entre Adelante y Reversa; el tiempo MÁXIMO de disparo de un relevador térmico de clase 10/20/30 a 7.2×In según IEC 60947-4-1.</div>
    <div class="fl no">NO modela: el esquemático eléctrico completo con bobinas/fusibles a nivel normalizado; el tiempo MÍNIMO real de disparo (depende del fabricante, no lo fija la norma); el dimensionamiento de calibre de conductor o corriente de plena carga del motor.</div>
    <div class="fl">Norma ancla: IEC 60947-4-1 (arrancadores electromecánicos de baja tensión) — se cita el tiempo máximo de disparo a 7.2×In por clase; el mínimo no se modela.</div>
  </div>
  <div class="src">Fuente: IEC 60947-4-1 · convenciones estándar de arrancadores reversibles con enclavamiento eléctrico/mecánico.</div>
  <div class="modebar">
    <button class="b on" data-mode="ensamble">① Ensamble</button>
    <button class="b" data-mode="circuito" disabled>② Circuito</button>
    <button class="b" data-mode="termico" disabled>③ Térmico</button>
    <button class="b" data-mode="reto" disabled>④ Reto</button>
  </div>
`;

/* ---------------- PANEL ---------------- */
document.getElementById('panel').innerHTML = `
  <div id="secEnsamble">
    <div class="panel">
      <div class="fid" style="margin-bottom:10px"><div class="ft">Progreso: <span id="progTxt">0/8</span></div></div>
      <div id="checklist" class="legend"></div>
      <div class="btns"><button class="b auto" id="btnAutoEns">▶ Recorrido guiado</button></div>
    </div>
  </div>
  <div id="secCircuito" style="display:none">
    <div class="panel">
      <div class="console"><span id="circStatus">Estado: PARADO</span></div>
      <div class="btns">
        <button class="b primary" id="btnAdelante">▶ Adelante</button>
        <button class="b" id="btnParo">⏹ Paro</button>
        <button class="b" id="btnReversa">◀ Reversa</button>
      </div>
      <div class="btns"><button class="b" id="btnToggleInterlock">🔒 Alternar enclavamiento eléctrico</button></div>
      <div class="legend">
        <div class="li">Modo: <span id="t_circMode">PARADO</span></div>
        <div class="li">Enclavamiento: <span id="t_circInterlock">activo</span></div>
        <div class="li">Falla fase-fase: <span id="t_circFault">no</span></div>
      </div>
      <div class="btns"><button class="b auto" id="btnAutoCirc">▶ Recorrido guiado</button></div>
    </div>
  </div>
  <div id="secTermico" style="display:none">
    <div class="panel">
      <div class="console"><span id="termStatus">m=6.0×Ir · Clase 20</span></div>
      <div class="btns">
        <button class="b" id="btnTermMinus">− m</button>
        <button class="b" id="btnTermPlus">+ m</button>
      </div>
      <select id="selClase">
        <option value="10">Clase 10</option>
        <option value="20" selected>Clase 20</option>
        <option value="30">Clase 30</option>
      </select>
      <div class="legend">
        <div class="li">m actual: <span id="t_termM">6.0 × Ir</span></div>
        <div class="li">Clase: <span id="t_termClase">Clase 20</span></div>
        <div class="li">t_disparo(máx): <span id="t_termTiempo">28.80 s</span></div>
      </div>
      <div class="btns"><button class="b auto" id="btnAutoTerm">▶ Recorrido guiado</button></div>
    </div>
  </div>
  <div id="secReto" style="display:none">
    <div class="panel">
      <div class="console"><span id="retoText">—</span></div>
      <div class="btns">
        <button class="b dx" id="btnReto10">Clase 10</button>
        <button class="b dx" id="btnReto20">Clase 20</button>
        <button class="b dx" id="btnReto30">Clase 30</button>
      </div>
      <div class="btns"><button class="b" id="btnNewChallenge">🎲 Nuevo escenario</button></div>
    </div>
  </div>
`;

/* ---------------- Wiring adicional ---------------- */
const soundBtn = el('soundBtn');
if (soundBtn) soundBtn.onclick = () => { synth.resume(); synth.toggle(); soundBtn.classList.toggle('on', synth.isOn()); };
document.querySelectorAll('.modebar .b').forEach((b) => {
  b.addEventListener('click', (ev) => {
    const m = b.dataset.mode;
    if (mode === 'reto' && !retoSolved && m !== 'reto') {
      ev.stopImmediatePropagation();
      showToast('<span style="color:var(--bad)">🔒 Resuelve el reto actual antes de cambiar de modo.</span>');
    }
  }, true);
  b.addEventListener('click', () => setMode(b.dataset.mode));
});
el('btnAutoEns').onclick = () => autoAssemble();
el('btnAdelante').onclick = () => pressAdelante();
el('btnParo').onclick = () => pressParo();
el('btnReversa').onclick = () => pressReversa();
el('btnToggleInterlock').onclick = () => toggleInterlock();
el('btnAutoCirc').onclick = () => autoCircuitoTour();
el('btnTermMinus').onclick = () => setTermM(-0.5);
el('btnTermPlus').onclick = () => setTermM(0.5);
el('selClase').onchange = (ev) => setTermClase(ev.target.value);
el('btnAutoTerm').onclick = () => autoTermicoTour();
el('btnReto10').onclick = () => checkReto(10);
el('btnReto20').onclick = () => checkReto(20);
el('btnReto30').onclick = () => checkReto(30);
el('btnNewChallenge').onclick = () => newChallenge();

initAssembly();
syncCtrlbar();
setMode('ensamble');

window.__labDebug = {
  state: STATE,
  get mode() { return mode; },
  get progress() { return progress; },
  get simUnlocked() { return simUnlocked; },
  get reto() { return { ...RETO, solved: retoSolved }; },
  tripTime, minClassFor,
};
