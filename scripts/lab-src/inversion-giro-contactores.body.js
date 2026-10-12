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
  cam: [1.7, 3.4, 7.5],
  target: [1.35, 1.3, 0.4],
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
  panel: std({ color: 0x2b323a, metalness: 0.4, roughness: 0.6, envMapIntensity: 0.7 }),
  dinRail: std({ ...alu, color: 0x9aa4ad, metalness: 0.75, roughness: 0.35, envMapIntensity: 1.0 }),
  contactorBody: std({ color: 0x23272c, metalness: 0.15, roughness: 0.75 }),
  contactorClear: std({ color: 0x8fd1ff, metalness: 0.1, roughness: 0.2, transparent: true, opacity: 0.35 }),
  termMetal: std({ ...alu, color: 0xb9c1c8, metalness: 0.8, roughness: 0.3, envMapIntensity: 1.0 }),
  dark: std({ color: 0x1b1f24, metalness: 0.2, roughness: 0.8 }),
  termLid: std({ color: 0xd8d2c2, metalness: 0.05, roughness: 0.6 }),
  needleRed: std({ color: 0xd64545, emissive: 0x4a0e0e, emissiveIntensity: 0.4, metalness: 0.3, roughness: 0.4 }),
  wireInterlock: std({ color: 0xf4c95d, metalness: 0.1, roughness: 0.5 }),
  bench: std({ color: 0x2a2f35, metalness: 0.3, roughness: 0.7 }),
  benchLeg: std({ color: 0x3a4149, metalness: 0.6, roughness: 0.5 }),
  ped: std({ color: 0x1c2126, metalness: 0.25, roughness: 0.7 }),
  pedTop: std({ color: 0x454d56, metalness: 0.4, roughness: 0.55 }),
  pedRing: std({ color: 0x2a9a7e, emissive: 0x0e3d30, emissiveIntensity: 0.15, metalness: 0.1, roughness: 0.6 }),
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

/* ---------------- piezas de la biblioteca (§17-B) y ayudas ---------------- */
const { revolucion, gabinete, maquinaElectrica, contactorTripolar, enclavamientoMecanico, releTermico, botoneraControl, regletaBornes, rielDIN, canaleta } = P3;   // §17-B de la biblioteca
/* ---------------- Constructores de piezas (3D de oficio, §17-B de la biblioteca) ---------------- */
const MATP = {
  aluminio: std({ color: 0xb6bdc4, roughness: 0.42, metalness: 0.7, envMapIntensity: 0.8 }),
  acero: std({ color: 0x8f979f, roughness: 0.38, metalness: 0.85, envMapIntensity: 0.8 }),
  cromo: std({ color: 0xc4cad0, roughness: 0.3, metalness: 0.9, envMapIntensity: 0.8 }),
  chapa: std({ color: 0x9aa2aa, roughness: 0.5, metalness: 0.6 }),
  cobre: std({ color: 0xb87333, roughness: 0.4, metalness: 0.8 }),
  negro: std({ color: 0x14181e, roughness: 0.62, metalness: 0.06 }),
  goma: std({ color: 0x14181e, roughness: 0.85, metalness: 0.02 }),
  blanco: std({ color: 0xd7dee6, roughness: 0.40, metalness: 0.20 }),
  ceramica: std({ color: 0xd7dee6, roughness: 0.60, metalness: 0.05 }),
  hierro: std({ color: 0x4a4f55, roughness: 0.55, metalness: 0.7 }),
};
const lbl = (g, txt, col, y, sc) => { const lb = labelSprite(txt, col); lb.position.set(0, y, 0); lb.scale.multiplyScalar(sc); g.add(lb); };
const WCOL = [0x8a5a2e, 0x3c4046, 0x8d949b];          // L1 café · L2 negro · L3 gris (código de colores de fase)

function buildPanelMontaje() {
  const g = new THREE.Group();
  // el gabinete con su placa de montaje naranja galvanizada; la placa queda en z = −0,03
  const gab = gabinete(MATP, { ancho: 1.95, alto: 2.6, fondo: 0.44, puerta: false, color: 0x8c949b, colorPlaca: 0xc4701a });
  gab.position.set(0, -1.30, 0.156); g.add(gab);
  // rieles DIN (uno por hilera de aparatos) y canaletas ranuradas entre ellas
  [0.98, 0.42, -0.10, -0.75].forEach((y) => { const r = rielDIN(MATP, { largo: 1.72 }); r.position.set(0, y, -0.03); g.add(r); });
  [[0.77, [0x8a5a2e, 0x3c4046, 0x8d949b]], [0.13, [0x8a5a2e, 0x3c4046, 0x8d949b]], [-0.46, [0x8a5a2e, 0x3c4046, 0x8d949b]]].forEach(([y, cs]) => {
    const c = canaleta(MATP, { largo: 1.72, ancho: 0.10, alto: 0.07, cables: cs }); c.position.set(0, y, -0.03); g.add(c); });
  [-0.84, 0.84].forEach((x) => { const c = canaleta(MATP, { largo: 2.34, ancho: 0.10, alto: 0.07, cables: [0x3c4046, 0x2f9e6a] }); c.rotation.z = Math.PI / 2; c.position.set(x, 0.02, -0.03); g.add(c); });
  return g;
}

function buildTerminalesLinea(l = true) {
  const g = new THREE.Group();
  g.add(regletaBornes(MATP, { vias: 3, rotulos: ['L1', 'L2', 'L3'], colores: WCOL }));
  if (l) lbl(g, 'Terminales de línea', '#8A94A0', 0.26, 0.52);
  return g;
}
function buildTerminalesMotor(l = true) {
  const g = new THREE.Group();
  g.add(regletaBornes(MATP, { vias: 3, rotulos: ['U', 'V', 'W'], colores: WCOL }));
  if (l) lbl(g, 'Terminales al motor', '#8A94A0', 0.26, 0.52);
  return g;
}
function buildContactorBody(labelText, hex, rotulo, aux, l = true) {
  const cssColor = '#' + hex.toString(16).padStart(6, '0');
  const g = new THREE.Group();
  const c = contactorTripolar(MATP, { rotulo, ledColor: hex, aux }); g.add(c);
  g.userData.coilLed = c.userData.led;
  if (l) lbl(g, labelText, cssColor, 0.36, 0.55);
  return g;
}
function buildKM1(l = true) { return buildContactorBody('KM1 · Adelante', 0x43D9AD, 'KM1', 1, l); }
function buildKM2(l = true) { return buildContactorBody('KM2 · Reversa', 0xe0b23c, 'KM2', -1, l); }

function buildEnclavamientoMecanico(l = true) {
  const g = new THREE.Group();
  const e = enclavamientoMecanico(MATP, { ancho: 0.52 }); g.add(e);
  g.userData.balancin = e.userData.balancin;
  if (l) lbl(g, 'Enclavamiento mecánico', '#8A94A0', 0.22, 0.5);
  return g;
}
function buildPuenteElectrico(l = true) {
  // dos hilos que cruzan el contacto NC de cada contactor a la bobina del otro, con sus puntas (casquillos)
  const g = new THREE.Group();
  const mW = std({ color: 0xc9a02c, metalness: 0.1, roughness: 0.55 });
  const mF = std({ color: 0xb8bfc6, metalness: 0.85, roughness: 0.35 });
  const w = [[-0.175, 0.0156, 0.175, -0.0258, 0.050], [-0.175, -0.0258, 0.175, 0.0156, 0.034]];
  w.forEach(([x0, y0, x1, y1, bz]) => {
    const cur = new THREE.CatmullRomCurve3([V(x0, y0, 0.082), V(x0 + 0.04, y0, 0.082 + bz * 0.8), V(0, (y0 + y1) / 2, 0.082 + bz), V(x1 - 0.04, y1, 0.082 + bz * 0.8), V(x1, y1, 0.082)]);
    const t = new THREE.Mesh(new THREE.TubeGeometry(cur, 30, 0.0095, 6, false), mW); t.castShadow = true; g.add(t);
    [[x0, y0], [x1, y1]].forEach(([x, y]) => { const c = new THREE.Mesh(new THREE.CylinderGeometry(0.013, 0.013, 0.022, 8), mF); c.rotation.x = Math.PI / 2; c.position.set(x, y, 0.086); g.add(c); });
  });
  if (l) lbl(g, 'Enclavamiento eléctrico (NC cruzado)', '#f4c95d', 0.20, 0.46);
  return g;
}
function buildRelevadorTermico(l = true) {
  const g = new THREE.Group();
  const r = releTermico(MATP, { rotulo: 'F1', escala: [4, 8] }); g.add(r);
  g.userData.needle = r.userData.needle;
  if (l) lbl(g, 'Relevador térmico', '#8A94A0', 0.26, 0.5);
  return g;
}
function buildBotonera(l = true) {
  const g = new THREE.Group();
  g.add(botoneraControl(MATP, { ancho: 0.30, fondo: 0.14 }));
  if (l) lbl(g, 'Botonera 3 hilos', '#8A94A0', 0.40, 0.55);
  return g;
}

/* ---------------- Registro de piezas ---------------- */
const HUB = [0, 1.35, 0];
const V = (x, y, z) => new THREE.Vector3(x, y, z);
const H = (dx, dy, dz) => V(HUB[0] + dx, HUB[1] + dy, HUB[2] + dz);

const PARTS = [
  { id: 'terminalesLinea', name: 'Terminales de línea', build: (l) => buildTerminalesLinea(l), s: 0.62, home: H(0, 0.98, 0.04), note: 'L1, L2, L3 llegan aquí desde la acometida trifásica — el punto de partida del circuito de fuerza.' },
  { id: 'km1', name: 'Contactor KM1 (Adelante)', build: (l) => buildKM1(l), s: 0.55, home: H(-0.42, 0.42, 0.10), note: 'KM1 energizado conecta L1→U, L2→V, L3→W: el motor gira en sentido Adelante.' },
  { id: 'km2', name: 'Contactor KM2 (Reversa)', build: (l) => buildKM2(l), s: 0.55, home: H(0.42, 0.42, 0.10), note: 'KM2 energizado invierte dos fases: L1→W, L2→V, L3→U — el motor gira en sentido Reversa.' },
  { id: 'enclavamiento', name: 'Enclavamiento mecánico', build: (l) => buildEnclavamientoMecanico(l), s: 0.7, home: H(0, 0.57, 0.09), note: 'Barra física entre KM1 y KM2: si uno está cerrado, impide mecánicamente que el otro cierre.' },
  { id: 'puenteElectrico', name: 'Enclavamiento eléctrico', build: (l) => buildPuenteElectrico(l), s: 0.8, home: H(0, 0.42, 0.16), note: 'Contacto NC de cada contactor cableado en la bobina del otro: segunda barrera, independiente de la mecánica.' },
  { id: 'relevadorTermico', name: 'Relevador térmico', build: (l) => buildRelevadorTermico(l), s: 0.6, home: H(0, -0.10, 0.07), note: 'Protege el motor por sobrecarga sostenida — su clase de disparo (10/20/30) se explora en el modo Térmico.' },
  { id: 'terminalesMotor', name: 'Terminales al motor', build: (l) => buildTerminalesMotor(l), s: 0.62, home: H(0, -0.75, 0.04), note: 'U, V, W: el lado de carga del arrancador, cableado al motor trifásico.' },
  { id: 'botonera', name: 'Botonera de 3 hilos', build: (l) => buildBotonera(l), s: 0.5, home: H(1.40, 0.18, 0.07), note: 'Paro (NC), Adelante (NO) y Reversa (NO) con contacto de sello — el circuito de control clásico de arranque reversible.' },
];
const ORDER = PARTS.map((p) => p.id);
const PART = Object.fromEntries(PARTS.map((p) => [p.id, p]));

const panelMontaje = buildPanelMontaje();
panelMontaje.position.set(...HUB);
scene.add(panelMontaje);

/* el motor trifásico (fijo) con su caja de bornes y el conducto flexible hasta el tablero */
const motor = (() => {
  const g = new THREE.Group();
  const pad = roundedBox(1.55, 0.08, 0.86, std({ color: 0x6d7077, roughness: 0.92, metalness: 0.02 }), 0.06); pad.position.set(2.75, 0.04, 0.50); g.add(pad);
  const base = roundedBox(1.25, 0.04, 0.62, MATP.hierro, 0.2); base.position.set(2.75, 0.10, 0.50); g.add(base);
  const m = maquinaElectrica({ ...MATP, aluminio: std({ color: 0x2b5584, roughness: 0.5, metalness: 0.35, envMapIntensity: 0.7 }) }, { d: 0.62, largo: 0.90, aletas: 16, patas: true, bornes: false, ventilador: true, eje: 0.32, placa: true });
  m.position.set(2.75, 0.503, 0.50); g.add(m);
  // caja de bornes: tapa con tornillos y prensaestopas hacia el tablero
  const cb = roundedBox(0.30, 0.15, 0.24, std({ color: 0x7d858d, roughness: 0.5, metalness: 0.5 }), 0.1); cb.position.set(2.75, 0.503 + 0.31 + 0.075, 0.50); g.add(cb);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.012, 6), MATP.acero); t.position.set(2.75 + sx * 0.11, 0.503 + 0.31 + 0.156, 0.50 + sz * 0.085); g.add(t); }
  const gl = new THREE.Mesh(revolucion([[0, 0], [0.04, 0], [0.04, 0.016], [0.03, 0.03], [0.03, 0.07], [0, 0.07]], { seg: 14 }), std({ color: 0x15181c, roughness: 0.8 }));
  gl.rotation.z = Math.PI / 2; gl.position.set(2.75 - 0.15 - 0.0, 0.503 + 0.31 + 0.075, 0.50); gl.rotation.z = Math.PI / 2; g.add(gl);
  // conducto flexible corrugado: de la caja de bornes al costado del tablero
  const tx = new THREE.CanvasTexture((() => { const c = document.createElement('canvas'); c.width = 64; c.height = 16; const x = c.getContext('2d');
    x.fillStyle = '#2a2f36'; x.fillRect(0, 0, 64, 16); x.fillStyle = '#12151a'; x.fillRect(0, 0, 24, 16); return c; })());
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(70, 1); tx.colorSpace = THREE.SRGBColorSpace;
  const cur = new THREE.CatmullRomCurve3([V(2.60 - 0.05, 0.503 + 0.31 + 0.075, 0.50), V(2.30, 1.10, 0.48), V(1.70, 1.05, 0.40), V(1.25, 0.80, 0.30), V(1.02, 0.60, 0.16)]);
  const cd = new THREE.Mesh(new THREE.TubeGeometry(cur, 70, 0.032, 10, false), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.7, metalness: 0.1 }));
  cd.castShadow = true; g.add(cd);
  scene.add(g);
  return m;
})();

/* cables de fuerza entre aparatos: sólo existen cuando están colocados los dos extremos */
const wiresG = new THREE.Group(); scene.add(wiresG);
const WIRES = [];
function buildCables() {
  const km = contactorTripolar(MATP, { rotulo: 'KM1', aux: 1 }).userData;
  const rl = releTermico(MATP, {}).userData;
  const rg = regletaBornes(MATP, { vias: 3 }).userData;
  const P = (id) => PART[id].home;
  const hilo = (A, B, ductY, i, col, need) => {
    const dz = -0.014;
    const mx = (A.x + B.x) / 2 + (i - 1) * 0.018;
    const pts = [A, V(A.x, A.y + (ductY > A.y ? 0.05 : -0.05), A.z + 0.03), V(A.x + (B.x - A.x) * 0.25, ductY + (i - 1) * 0.022, dz),
                 V(mx, ductY + (i - 1) * 0.022, dz), V(B.x + (A.x - B.x) * 0.25, ductY + (i - 1) * 0.022, dz), V(B.x, B.y + (ductY > B.y ? 0.05 : -0.05), B.z + 0.03), B];
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, false, 'catmullrom', 0.3), 50, 0.0105, 6, false), std({ color: col, roughness: 0.6, metalness: 0.05 }));
    m.castShadow = true; m.visible = false; wiresG.add(m); WIRES.push({ m, need });
  };
  for (let i = 0; i < 3; i++) {
    const L = P('terminalesLinea').clone().add(rg.bornas[i]);
    hilo(L, P('km1').clone().add(km.sup[i]), HUB[1] + 0.77, i, WCOL[i], ['terminalesLinea', 'km1']);
    hilo(L, P('km2').clone().add(km.sup[i]), HUB[1] + 0.77, i, WCOL[i], ['terminalesLinea', 'km2']);
    hilo(P('km1').clone().add(km.inf[i]), P('relevadorTermico').clone().add(rl.sup[i]), HUB[1] + 0.13, i, WCOL[i], ['km1', 'relevadorTermico']);
    hilo(P('km2').clone().add(km.inf[i]), P('relevadorTermico').clone().add(rl.sup[2 - i]), HUB[1] + 0.13, i, WCOL[i], ['km2', 'relevadorTermico']);
    hilo(P('relevadorTermico').clone().add(rl.inf[i]), P('terminalesMotor').clone().add(rg.bornas[i]), HUB[1] - 0.46, i, WCOL[i], ['relevadorTermico', 'terminalesMotor']);
  }
  // el cable colgante de la botonera, hasta el costado del tablero
  const bt = P('botonera');
  const cur = new THREE.CatmullRomCurve3([bt.clone().add(V(0, 0.31 * 1 + 0.10, 0)), bt.clone().add(V(0, 0.50, 0.02)), V(1.32, 1.62, 0.14), V(1.10, 1.82, 0.18), V(0.99, 1.78, 0.16)]);
  const m = new THREE.Mesh(new THREE.TubeGeometry(cur, 40, 0.016, 8, false), std({ color: 0x1d2025, roughness: 0.8 }));
  m.castShadow = true; m.visible = false; wiresG.add(m); WIRES.push({ m, need: ['botonera'] });
}
buildCables();

/* ---------------- Estado de ensamble (patrón genérico — reutilizable en las 150 prácticas) ---------------- */
const STAGE_S = 0.5;
const stageS = (id) => PART[id].s || STAGE_S;
const groups = {}, ghosts = {}, labels = {};
let placed = {}, selectedId = null, progress = 0, simUnlocked = false;
const tweens = [];
const trayObjs = [], ghostObjs = [], scratch = [];

/* banco de piezas: una mesa baja delante del tablero, con dos hileras de pedestales */
const BENCH_Y = 0.50;
const benchG = new THREE.Group();
const pedG = new THREE.Group();
scene.add(benchG); scene.add(pedG);
function pedBaseXZ(i) {
  const cols = 4;
  const row = Math.floor(i / cols), col = i % cols;
  return [-0.05 + col * 0.62, 2.10 + row * 0.66];
}
(() => {
  const top = roundedBox(2.75, 0.09, 1.60, MAT.bench, 0.2);
  top.position.set(0.88, BENCH_Y - 0.045, 2.43);
  top.receiveShadow = true;
  benchG.add(top);
  [[-0.37, 1.75], [-0.37, 3.11], [2.13, 1.75], [2.13, 3.11]].forEach((p) => {
    const leg = new THREE.Mesh(new THREE.BoxGeometry(0.09, BENCH_Y - 0.09, 0.09), MAT.benchLeg);
    leg.position.set(p[0], (BENCH_Y - 0.09) / 2, p[1]);
    leg.castShadow = true;
    benchG.add(leg);
  });
})();
const PED_TOP = BENCH_Y + 0.10;
function resetPedestals() {
  pedG.children.slice().forEach((c) => pedG.remove(c));
  PARTS.forEach((p, i) => {
    const [x, z] = pedBaseXZ(i);
    const ped = new THREE.Mesh(new THREE.CylinderGeometry(0.19, 0.21, 0.08, 24), MAT.ped);
    ped.position.set(x, BENCH_Y + 0.04, z);
    ped.receiveShadow = true;
    pedG.add(ped);
    const top = new THREE.Mesh(new THREE.CylinderGeometry(0.18, 0.18, 0.02, 24), MAT.pedTop);
    top.position.set(x, BENCH_Y + 0.09, z);
    pedG.add(top);
    const ring = new THREE.Mesh(new THREE.TorusGeometry(0.19, 0.009, 8, 28), MAT.pedRing.clone());
    ring.rotation.x = Math.PI / 2;
    ring.position.set(x, BENCH_Y + 0.10, z);
    ring.material.opacity = 0;
    ring.material.transparent = true;
    pedG.add(ring);
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
  const g = part.build(true);
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
  const g = part.build(true);
  g.userData.sprites = [];
  g.traverse((o) => { if (o.isSprite) { o.scale.multiplyScalar(1.5); g.userData.sprites.push(o); o.visible = false; } });
  const s = part.s || STAGE_S;
  g.scale.setScalar(s);
  const [x, z] = pedBaseXZ(i);
  const box = new THREE.Box3().setFromObject(g);
  const y = PED_TOP + 0.012 - box.min.y;
  g.position.set(x, y, z);
  g.userData.kind = 'part';
  g.userData.partId = part.id;
  g.userData.homePos = { x, y, z };
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
  S.moveTo([1.7, 3.4, 7.5], [1.35, 1.3, 0.4], 1.3);
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
  g.userData.kind = 'placed';
  g.traverse((o) => { if (o.isSprite) o.visible = false; });
  tweens.push({
    obj: g, t: 0, dur: 0.75,
    from: g.position.clone(), to: targetPos, fromS: g.scale.x, toS: 1,
    onDone: () => {
      g.rotation.set(0, 0, 0); g.scale.setScalar(1);
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
const bFrame = roundedBox(1.66, 1.26, 0.06, MAT.panel, 0.04);
bFrame.position.z = -0.02;   // el marco va DETRÁS del plano del pizarrón: con z=0 lo tapaba y el tablero de simulación no se veía
boardG.add(bFrame);
const bLeg = new THREE.Mesh(new THREE.CylinderGeometry(0.05, 0.05, 1.5, 16), MAT.panel); bLeg.position.set(0, -1.38, -0.02); bLeg.castShadow = true; boardG.add(bLeg);   // el pizarrón no flota: tiene su pie
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
let retoSolved = false, intentos = 0;
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
  else labelAt(40, yy + 80, `Intentos fallidos: ${intentos}/2`, '#8A94A0', 18);
  bTex.needsUpdate = true;
  const rt = el('retoText');
  if (rt) rt.textContent = `m=${tf(r.m, 1)}×Ir · ts=${r.ts}s` + (retoSolved ? ` ✔ Correcto: Clase ${r.answer}` : ` · intentos fallidos: ${intentos}/2`);
}
function newChallenge() {
  // escenario distinto del que estaba en pantalla
  let s;
  do { s = pick(RETO_SCENARIOS); } while (RETO.active && s.m === RETO.m && s.ts === RETO.ts && RETO_SCENARIOS.length > 1);
  RETO = { active: true, m: s.m, ts: s.ts, answer: minClassFor(s.m, s.ts) };
  retoSolved = false; intentos = 0;
  ['btnReto10', 'btnReto20', 'btnReto30'].forEach((id) => { const bt = el(id); if (bt) { bt.disabled = false; bt.classList.remove('wrong', 'right'); } });
  drawReto();
  showToast('🎲 Nuevo escenario de arranque generado.');
  synth.beep(520, 0.08, 0.05);
}
function checkReto(guessClase) {
  if (retoSolved) return;
  const ok = Number(guessClase) === RETO.answer;
  retoSolved = ok;
  const bt = el('btnReto' + Number(guessClase));
  if (ok) {
    if (bt) bt.classList.add('right');
    ['btnReto10', 'btnReto20', 'btnReto30'].forEach((id) => { const x = el(id); if (x) x.disabled = true; });
    showToast('<span style="color:var(--good)">✔ Correcto: clase mínima que no dispara en falso durante el arranque.</span>'); synth.beep(1046, 0.12, 0.06);
  } else {
    // con solo 3 opciones, el 2.º fallo ya delataría la tercera: a los 2 fallos el escenario se cambia
    if (bt) { bt.classList.add('wrong'); bt.disabled = true; }
    intentos++; synth.beep(180, 0.14, 0.06);
    if (intentos >= 2) { newChallenge(); showToast('<span style="color:var(--bad)">✗ Dos intentos fallidos: te dejo un escenario NUEVO. Calcula el tiempo de disparo de cada clase a ese m y compáralo con el tiempo de arranque.</span>'); return; }
    showToast('<span style="color:var(--bad)">✗ No es correcto (intento ' + intentos + '/2). Compara el tiempo de disparo de la clase que elegiste, a ese múltiplo m, con el tiempo real de arranque.</span>');
  }
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
  ensamble: { nombre: 'Ensamble', cam: [[1.7, 3.4, 7.5], [1.35, 1.3, 0.4]] },
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
  mode = k; boardG.visible = (k !== 'ensamble');
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
  const prevC = { ...STATE.circ };   // demostración: se devuelve el circuito al estado del alumno
  pressParo(); await sleep(900);
  pressAdelante(); await sleep(1600);
  pressParo(); await sleep(700);
  pressReversa(); await sleep(1600);
  pressParo(); await sleep(700);
  toggleInterlock(); await sleep(700);
  pressAdelante(); await sleep(900);
  pressReversa(); await sleep(1800);
  toggleInterlock(); await sleep(1200);
  Object.assign(STATE.circ, prevC); refreshAll();
  if (btn) btn.disabled = false; autoRunning = false;
}
async function autoTermicoTour() {
  if (autoRunning) return; autoRunning = true;
  const btn = el('btnAutoTerm'); if (btn) btn.disabled = true;
  const prevT = { ...STATE.term };   // demostración: se devuelven m y clase al alumno
  for (const clase of CLASS_ORDER) {
    STATE.term.clase = clase;
    const sel = el('selClase'); if (sel) sel.value = String(clase);
    refreshAll(); await sleep(1500);
  }
  for (const m of [4, 5, 6, 7, 8]) { STATE.term.m = m; refreshAll(); await sleep(1200); }
  Object.assign(STATE.term, prevT); { const sel = el('selClase'); if (sel) sel.value = String(prevT.clase); } refreshAll();
  if (btn) btn.disabled = false; autoRunning = false;
}

/* ---------------- Loop de animación ---------------- */
let motorW = 0, motorA = 0;
S.setAnimate((dt, t) => {
  WIRES.forEach((w) => { w.m.visible = !tweens.length && w.need.every((id) => placed[id]); });
  {
    const cc = STATE.circ;
    const tgt = simUnlocked ? (cc.mode === 'adelante' ? 1 : cc.mode === 'reversa' ? -1 : 0) : 0;
    motorW += (tgt * 9 - motorW) * Math.min(1, dt * 3); motorA += motorW * dt; motor.userData.gira(motorA);
    const bal = groups.enclavamiento && groups.enclavamiento.userData.balancin;
    if (bal && placed.enclavamiento) bal.rotation.z += ((cc.mode === 'adelante' ? 0.22 : cc.mode === 'reversa' ? -0.22 : 0) - bal.rotation.z) * Math.min(1, dt * 6);
  }
  for (let i = tweens.length - 1; i >= 0; i--) {
    const tw = tweens[i];
    tw.t += dt / tw.dur;
    const k = ease(Math.min(1, tw.t));
    tw.obj.position.lerpVectors(tw.from, tw.to, k);
    if (tw.toS !== undefined) tw.obj.scale.setScalar(tw.fromS + (tw.toS - tw.fromS) * k);
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
    if (!home || g.userData.kind !== 'part') return;   // una pieza ya colocada no vuelve al banco
    const targetY = home.y + (isSel ? 0.08 + Math.sin(t * 3) * 0.02 : 0);
    g.position.y += (targetY - g.position.y) * Math.min(1, dt * 6);
    if (isSel) g.rotation.y += dt * 1.4;
    (g.userData.sprites || []).forEach((sp) => { sp.visible = isSel; });   // el rótulo sólo de la pieza elegida: en el banco se leen por su forma
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
  <div class="eyebrow">Máquinas eléctricas · Arrancadores</div>
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
  get reto() { return { ...RETO, solved: retoSolved, intentos }; },
  get solved() { return retoSolved; },
  get intentos() { return intentos; },
  checkReto, newChallenge,
  tripTime, minClassFor,
};
