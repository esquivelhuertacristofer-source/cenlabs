/* ===================== 1. Materiales ===================== */
const std = o => new THREE.MeshStandardMaterial(o);
const alu = castAluminum();
const brush = brushedMetal();
const rub = rubber();
const plas = techPlastic(0.14, 0.14, 0.16);

const MAT = {
  bench: std({ ...plas, metalness: 0.15, roughness: 0.75 }),
  target: std({ ...alu, color: 0x8a8f96, metalness: 0.55, roughness: 0.48 }),
  toolBody: std({ ...plas, color: 0xff8c1a, metalness: 0.25, roughness: 0.5 }),
  toolGrip: std({ ...rub, color: 0x14100c, roughness: 1.0, metalness: 0.0 }),
  probe: std({ ...brush, color: 0xd8d8d8, metalness: 0.85, roughness: 0.3 }),
  bead: std({ ...brush, color: 0xc9ad5a, metalness: 0.7, roughness: 0.35 }),
  wireTC: std({ ...rub, color: 0x2e8b57, roughness: 0.9, metalness: 0.0 }),
  wireRtdA: std({ ...rub, color: 0xb8342f, roughness: 0.9, metalness: 0.0 }),
  wireRtdB: std({ ...rub, color: 0xd9d5c8, roughness: 0.85, metalness: 0.0 }),
  screen: std({ color: 0x050706, roughness: 0.35, metalness: 0.05 }),
  led: std({ color: 0x0a1210, emissive: 0x2ad9c2, emissiveIntensity: 0.25, roughness: 0.35, metalness: 0.1 }),
  laser: std({ color: 0x220000, emissive: 0xff2b2b, emissiveIntensity: 0.0, roughness: 0.4, metalness: 0.0 }),
};

/* Los nombres con los que trabaja la biblioteca de piezas (`P3`, que el molde ya
   importa), traducidos una vez a los materiales de este laboratorio. */
const MATP = {
  aluminio: MAT.probe, acero: MAT.probe, cromo: MAT.probe, chapa: MAT.probe,
  cobre: std({ color: 0xb87333, roughness: 0.35, metalness: 0.75 }),
  negro: std({ color: 0x14181e, roughness: 0.62, metalness: 0.06 }),
  goma: MAT.toolGrip,
  blanco: std({ color: 0xd7dee6, roughness: 0.40, metalness: 0.20 }),
  ceramica: std({ color: 0xd7dee6, roughness: 0.60, metalness: 0.05 }),
};

/* ===================== 2. Hover / picking ===================== */
const HOVER_LABELS = {};
function registerPart(mesh, name, desc) {
  if (!mesh) return mesh;
  mesh.userData.partName = name;
  HOVER_LABELS[name] = desc;
  return mesh;
}

function cableTube(pA, pB, mat, radius = 0.028) {
  const mid = pA.clone().lerp(pB, 0.5).add(new THREE.Vector3(0, -0.08, 0));
  const curve = new THREE.QuadraticBezierCurve3(pA, mid, pB);
  const geo = new THREE.TubeGeometry(curve, 20, radius, 8, false);
  return new THREE.Mesh(geo, mat);
}

/* ===================== 3. Escena 3D ===================== */
const mount = document.getElementById('stage');
/* El encuadre: el montaje entero cabe en el hueco entre los dos paneles —el
   bloque al centro, el lector a un lado y la sonda entre los dos—, no en una losa
   de seis metros con tres juguetes encima. */
const S = createStage(mount, {
  cam: [1.9, 2.9, 4.6],
  target: [0.05, 1.05, -0.05],
  minD: 2.2,
});
const { scene, camera, renderer, controls } = S;
const YB = 0.74;                       // cara superior del banco

const bench = roundedBox(5.0, 0.28, 3.0, MAT.bench, 0.05);
bench.position.set(0, 0.6, 0);
bench.receiveShadow = true;
scene.add(registerPart(bench, 'banco', 'Banco de trabajo. Tres instrumentos distintos miden la temperatura del mismo bloque, cada uno con su propio principio físico.'));

/* Cable libre: pasa por los puntos que se le den, con la comba que ellos dibujan. */
function cableLibre(pts, mat, radius = 0.022) {
  const cv = new THREE.CatmullRomCurve3(pts.map(p => p.clone ? p.clone() : new THREE.Vector3(...p)));
  const m = new THREE.Mesh(new THREE.TubeGeometry(cv, 40, radius, 8, false), mat);
  m.castShadow = true; return m;
}

/* --- Bloque caliente (blanco común): un bloque de calibración de aluminio sobre
   su placa calefactora, con un taladro en la cara superior y otro en el costado
   izquierdo, que es donde se meten las sondas de contacto. --- */
const targetGroup = new THREE.Group();
targetGroup.position.set(0.3, YB, -0.3);
scene.add(targetGroup);

const placaCal = new THREE.Mesh(P3.extruido(P3.contornoRedondeado(
  [[-0.58, -0.58], [0.58, -0.58], [0.58, 0.58], [-0.58, 0.58]], 0.05, 3), { espesor: 0.10, bisel: 0.012 }), MATP.negro);
placaCal.rotation.x = -Math.PI / 2; placaCal.position.y = 0.05; placaCal.castShadow = placaCal.receiveShadow = true;
targetGroup.add(placaCal);
for (const sx of [-1, 1]) {            // las cuatro patas de goma de la placa
  for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.045, 0.045, 0.02, 10), MAT.toolGrip);
    p.position.set(sx * 0.50, 0.01, sz * 0.50); targetGroup.add(p);
  }
}
const BH = 0.56;
const targetBody = roundedBox(0.82, BH, 0.82, MAT.target, 0.05);
targetBody.material = MAT.target.clone();
targetBody.position.y = 0.10 + BH / 2;
targetGroup.add(registerPart(targetBody, 'bloque', 'Punto de medición. Componente metálico caliente medido con tres instrumentos distintos — un termopar, una RTD y una pistola infrarroja — cada uno con su propio principio físico y su propio error característico si se usa mal. El color del bloque cambia con la temperatura sólo como convención visual didáctica; NO representa el color real de radiación térmica a estas temperaturas.'));
const matHueco = new THREE.MeshBasicMaterial({ color: 0x050607 });
const huecoTop = new THREE.Mesh(new THREE.CircleGeometry(0.052, 20), matHueco);
huecoTop.rotation.x = -Math.PI / 2; huecoTop.position.set(0, 0.10 + BH + 0.0015, 0); targetGroup.add(huecoTop);
const huecoLado = new THREE.Mesh(new THREE.CircleGeometry(0.030, 20), matHueco);
huecoLado.rotation.y = -Math.PI / 2; huecoLado.position.set(-0.41 - 0.0015, 0.10 + BH / 2, 0); targetGroup.add(huecoLado);
// los cables de los dos cartuchos calefactores, que salen por detrás de la placa
for (const sx of [-0.2, 0.2]) {
  targetGroup.add(cableLibre([[sx, 0.05, -0.58], [sx, 0.04, -0.75], [sx + 0.05, 0.02, -0.95]].map(p => new THREE.Vector3(...p)), MATP.negro, 0.018));
}

const targetLabel = labelSprite('BLOQUE', '#e8ecef');
targetLabel.position.set(0.55, 0.95, 0.35);
targetLabel.scale.multiplyScalar(0.5);
targetGroup.add(targetLabel);

/* El lector de mano (TC y RTD): inclinado hacia atrás sobre el banco, que es
   como se deja un termómetro de taller cuando no se lleva en la mano. */
function ponLector(grupoPadre, x, z, giro, colorCuerpo) {
  const m = P3.termometroManual(MATP, { ancho: 0.60, alto: 0.95, fondo: 0.20, color: colorCuerpo });
  const th = 0.30, H = 0.95, D = 0.20;
  m.rotation.x = -th;
  m.position.y = (H / 2) * Math.cos(th) + (D / 2) * Math.sin(th);
  const w = new THREE.Group(); w.position.set(x, YB, z); w.rotation.y = giro; w.add(m);
  grupoPadre.add(w);
  return m;
}
function pantallaLector(m, tex) {
  const v = m.userData.visor;
  const p = new THREE.Mesh(new THREE.PlaneGeometry(v.ancho * 0.98, v.alto * 0.98), new THREE.MeshBasicMaterial({ map: tex }));
  m.userData.pantalla.add(p); return p;
}

/* --- Termopar (izquierda) --- */
const tcGroup = new THREE.Group();
scene.add(tcGroup);

const scrTexTC = document.createElement('canvas');
scrTexTC.width = 256; scrTexTC.height = 128;
const scrCtxTC = scrTexTC.getContext('2d');
const scrTexObjTC = new THREE.CanvasTexture(scrTexTC);
const tcMeterBody = ponLector(tcGroup, -1.05, 0.55, 0.45, 0xd9731a);
registerPart(tcMeterBody, 'lector_tc', 'Lector de termopar. Mide el voltaje generado por el termopar y lo convierte a temperatura. Necesita conocer la temperatura de SU PROPIA unión de referencia (compensación de junta fría, CJC) para no leer sistemáticamente bajo (IEC 60584).');
pantallaLector(tcMeterBody, scrTexObjTC);

const tcLedG = P3.led(MATP, { d: 0.06, color: 0x2ad9c2, patas: 0.04 });
tcLedG.rotation.x = Math.PI / 2;
tcLedG.position.set(-0.22, -0.03, 0.10);
tcMeterBody.add(registerPart(tcLedG, 'cjc_led', 'Indicador de compensación de junta fría (CJC). Encendido cuando el lector está midiendo activamente la temperatura de su propio bloque de terminales.'));
const tcLed = { material: tcLedG.userData.material };

/* EL ZOCALO DE TERMOPAR del lector está en su canto SUPERIOR, con el conector
   miniatura enchufado. Aqui dentro, en las palas, esta LA UNION DE REFERENCIA: es
   exactamente el sitio cuya temperatura tiene que medir la compensacion de junta
   fria, y por eso el LED de CJC esta en el frente del mismo instrumento. */
const tcPlug = P3.conectorTermopar(MATP, { ancho: 0.19, alto: 0.12, fondo: 0.20, color: 0x2e8b57 });
tcPlug.rotation.x = -Math.PI / 2;
tcPlug.position.set(0, tcMeterBody.userData.alto / 2 - 0.004, 0);
tcMeterBody.add(registerPart(tcPlug, 'conector_tc', 'Conector miniatura de termopar tipo K (verde, IEC 60584-3), enchufado en el zócalo del lector. Sus dos palas son de ANCHURA DISTINTA para que no pueda meterse invertido: invertirlo cambiaría el signo del voltaje medido. En estas palas está la unión de referencia (junta fría) que el lector debe compensar.'));

/* EL TERMOPAR de vaina: un tubo fino de acero con la UNION SOLDADA dentro de la
   punta (las dos aleaciones, Cromel y Alumel, tocándose en un solo punto: efecto
   Seebeck), su racor hexagonal, el mango verde de la norma y el muelle
   antitirones. Se mete en el taladro del costado del bloque; cualquier empalme de
   mas en su cable es otra union. */
const tcBead = P3.termoparVaina(MATP, { largo: 0.46, d: 0.05, color: 0x2e8b57, mango: 0.26 });
tcBead.rotation.z = Math.PI / 2;       // el +Y de la pieza pasa a apuntar hacia −X
tcBead.position.set(0.3 - 0.41 + 0.14, YB + 0.10 + BH / 2, -0.3);
tcGroup.add(registerPart(tcBead, 'termopar', 'Termopar tipo K. Une dos aleaciones distintas (Cromel/Alumel) que generan un voltaje proporcional a la diferencia de temperatura entre la punta y la unión de referencia — efecto Seebeck (IEC 60584). El color verde del cable corresponde al código de color IEC 60584-3 para Tipo K.'));

scene.updateMatrixWorld(true);
const tcA = tcBead.localToWorld(tcBead.userData.salida.clone());
const tcB = tcPlug.localToWorld(tcPlug.userData.salida.clone());
/* Un soporte con aro sostiene la sonda a la altura del taladro: en el aire,
   sin sostén, un tubo de acero metido en un agujero se caería. */
const yEje = YB + 0.10 + BH / 2;
const posteX = tcA.x + 0.12;
const poste = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, yEje - YB - 0.05, 10), MATP.acero);
poste.position.set(posteX, YB + (yEje - YB - 0.05) / 2, -0.3); poste.castShadow = true; tcGroup.add(poste);
const base = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.12, 0.025, 20), MATP.negro);
base.position.set(posteX, YB + 0.0125, -0.3); tcGroup.add(base);
const aro = new THREE.Mesh(new THREE.TorusGeometry(0.058, 0.011, 8, 22), MATP.acero);
aro.rotation.y = Math.PI / 2; aro.position.set(posteX, yEje, -0.3); tcGroup.add(aro);
const tcWire = cableLibre([tcA, new THREE.Vector3(tcA.x - 0.18, yEje - 0.05, tcA.z + 0.10),
  new THREE.Vector3(tcA.x - 0.34, YB + 0.05, 0.10),
  new THREE.Vector3(tcB.x + 0.30, YB + 0.05, tcB.z + 0.05),
  new THREE.Vector3(tcB.x + 0.17, tcB.y + 0.06, tcB.z), tcB], MAT.wireTC, 0.026);
tcGroup.add(registerPart(tcWire, 'cable_tc', 'Cable de termopar Tipo K (código de color verde, IEC 60584-3). Cualquier unión adicional en este cable con metal distinto introduce otra unión termoeléctrica no deseada.'));

/* --- RTD (derecha) --- */
const rtdGroup = new THREE.Group();
scene.add(rtdGroup);

const scrTexRTD = document.createElement('canvas');
scrTexRTD.width = 256; scrTexRTD.height = 128;
const scrCtxRTD = scrTexRTD.getContext('2d');
const scrTexObjRTD = new THREE.CanvasTexture(scrTexRTD);
const rtdMeterBody = ponLector(rtdGroup, 1.40, 0.55, -0.45, 0xd9731a);
registerPart(rtdMeterBody, 'lector_rtd', 'Lector de RTD. Aplica una corriente conocida a la RTD y mide la caída de tensión para calcular su resistencia. En conexión a 2 hilos no puede distinguir la resistencia del sensor de la de los propios cables de extensión.');
pantallaLector(rtdMeterBody, scrTexObjRTD);

/* LA BORNERA DE CUATRO VIAS del lector, en su canto superior. No es adorno: son las
   cuatro vias las que hacen posible la conexion Kelvin —dos llevan la corriente y
   dos miden la tension sin que por ellas circule nada—, y por eso en 2 hilos solo
   se ocupan dos y la resistencia del cable se suma a la de la sonda. */
const rtdBorn = P3.bornera(MATP, { vias: 4, paso: 0.10, alto: 0.11, fondo: 0.12, patas: 0.03 });
rtdBorn.position.set(0, rtdMeterBody.userData.alto / 2, 0);
rtdMeterBody.add(registerPart(rtdBorn, 'bornera_rtd', 'Bornera de 4 vías del lector. En conexión a 2 hilos sólo se usan dos y la resistencia de los cables se suma a la de la RTD; en conexión a 4 hilos (Kelvin) un par inyecta la corriente y el otro par mide la tensión sin caída propia, cancelando ese error.'));

/* LA SONDA no es un tubo liso: tiene PUNTA REDONDEADA —lo unico que toca la
   pieza—, CABEZAL de transicion por el que se agarra y MUELLE ANTITIRONES, que
   esta ahi porque el cable se rompe siempre justo en ese punto. Va de pie, con la
   punta metida en el taladro de la cara superior del bloque. */
const rtdProbe = P3.sondaTemperatura(MATP, { largo: 0.30, d: 0.075 });
rtdProbe.position.set(0.3, YB + 0.10 + BH - 0.20, -0.3);
rtdGroup.add(registerPart(rtdProbe, 'rtd', 'RTD Pt100. Resistencia de platino que cambia de valor de forma casi lineal con la temperatura: 100 Ω a 0 °C, +≈0.385 Ω por °C (coeficiente medio, IEC 60751).'));

/* Cada hilo sale de SU via de la bornera y llega al muelle antitirones de la
   sonda, no al aire ni a la mitad de la vaina. */
scene.updateMatrixWorld(true);
const pSal = rtdProbe.localToWorld(rtdProbe.userData.salida.clone());
const hiloRtd = (via, matH, r, dz, dy) => {
  const a = rtdBorn.localToWorld(rtdBorn.userData.boca(via));
  const sob = new THREE.Vector3(pSal.x + (via - 1.5) * 0.012, pSal.y - 0.02 + dy, pSal.z + dz);
  return cableLibre([a, new THREE.Vector3(a.x + 0.05, a.y + 0.22 + via * 0.02, a.z + 0.12),
    new THREE.Vector3((a.x + sob.x) / 2, Math.max(a.y, sob.y) + 0.30, (a.z + sob.z) / 2 + 0.05), sob], matH, r);
};
const rtdWireA1 = hiloRtd(0, MAT.wireRtdA, 0.016, 0.00, 0.00);
const rtdWireB1 = hiloRtd(1, MAT.wireRtdB, 0.016, 0.01, -0.02);
const rtdWireA2 = hiloRtd(2, MAT.wireRtdA, 0.014, -0.01, -0.04);
const rtdWireB2 = hiloRtd(3, MAT.wireRtdB, 0.014, 0.00, -0.06);
rtdGroup.add(registerPart(rtdWireA1, 'cable_rtd', 'Cables de extensión de la RTD. En conexión a 2 hilos, su resistencia se suma directamente a la de la RTD y el lector no puede separarlas. En conexión a 4 hilos (Kelvin), un par mide corriente y el otro par mide tensión sin caída por los cables, cancelando ese error.'));
rtdGroup.add(rtdWireB1);
rtdGroup.add(registerPart(rtdWireA2, 'cable_rtd_2', 'Segundo par de hilos, activo sólo en conexión a 4 hilos (Kelvin).'));
rtdGroup.add(rtdWireB2);

/* --- Pistola infrarroja (frente) --- */
const irGroup = new THREE.Group();
scene.add(irGroup);

/* LA PISTOLA, apoyada en el banco por la base de su culata. Lo que la convierte
   en una pistola —y no en una caja con mango, que era lo que habia— es el
   perfil: culata con nervios, GUARDAMONTE con el GATILLO dentro y OPTICA al
   frente. Apunta hacia el bloque. */
const irGun = P3.pistolaIR(MATP, { alto: 0.66, ancho: 0.22, cuerpo: 0xd9731a });
irGun.rotation.y = Math.PI;          // apunta hacia −X: se la ve de perfil, con su silueta de pistola
irGun.position.set(1.62, YB, -0.3);
irGroup.add(registerPart(irGun, 'pistola_ir', 'Pistola infrarroja. Mide la radiación infrarroja emitida por la superficie y la convierte a temperatura ASUMIENDO un valor de emisividad configurado por el usuario — no mide temperatura de forma directa ni por contacto.'));
registerPart(irGun.userData.gatillo, 'gatillo_ir', 'Gatillo de la pistola. Mientras se mantiene apretado el instrumento mide de forma continua; al soltarlo, la última lectura queda retenida en pantalla (HOLD).');

const scrTexIR = document.createElement('canvas');
scrTexIR.width = 256; scrTexIR.height = 128;
const scrCtxIR = scrTexIR.getContext('2d');
const scrTexObjIR = new THREE.CanvasTexture(scrTexIR);
/* La pantalla va en el hueco que la propia pieza deja arriba, inclinado hacia
   quien dispara: no hay que colocarla a ojo. */
const irScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.150 * 1.10, 0.075 * 1.10), new THREE.MeshBasicMaterial({ map: scrTexObjIR }));
irScreen.position.z = 0.012;
irGun.userData.pantalla.add(irScreen);

/* EL HAZ DE PUNTERIA, a la altura de la boca del cañón y hasta la cara del
   bloque. Se ve para que quede claro adónde apunta el instrumento — y para que se
   vea también que el láser NO mide: lo que mide es la óptica, y el punto rojo
   sólo señala el sitio. */
const xBoca = 1.62 - 0.66 * 0.66, xCara = 0.3 + 0.41;
const irBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, xBoca - xCara, 8), MAT.laser.clone());
irBeam.rotation.z = Math.PI / 2;
irBeam.position.set((xBoca + xCara) / 2, YB + 0.66 * 0.55, -0.3);
irGroup.add(irBeam);

const laserDot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), MAT.laser.clone());
laserDot.rotation.y = Math.PI / 2;
laserDot.position.set(xCara + 0.002, YB + 0.66 * 0.55, -0.3);
irGroup.add(registerPart(laserDot, 'punto_laser', 'Punto láser de puntería. El láser NO participa en la medición de temperatura: solo ayuda a apuntar el sensor óptico hacia el punto deseado (advertencia estándar de todo fabricante de pistolas IR).'));

/* ===================== 4. Física — constantes declaradas ===================== */
let T_AMB = 22.0; // °C — ambiente de la unión de referencia (se sortea por caso)

// Termopar tipo K
const TC = {
  tTrue: 260.0,   // °C — punto ilustrativo (p.ej. zona de colector de escape)
  sK: 0.041,      // mV/°C — coeficiente de Seebeck PROMEDIO Tipo K cerca de este rango
};
function tcVoltageMv() { return TC.sK * (TC.tTrue - T_AMB); }
function tcIndicated(cjcOn) {
  const vRead = tcVoltageMv();
  return cjcOn ? (vRead / TC.sK) + T_AMB : (vRead / TC.sK);
}

// RTD Pt100
const RTD = {
  r0: 100.0,       // Ω a 0 °C (IEC 60751)
  alpha: 0.003850, // °C⁻¹ — coeficiente medio nominal IEC 60751 (aprox. lineal)
  tTrue: 85.0,     // °C — punto ilustrativo (p.ej. línea de refrigerante/aceite)
  rLead: 0.35,     // Ω por hilo — ilustrativo (≈5 m de cable calibre 22 + contactos)
};
function rtdTrueResistance() { return RTD.r0 * (1 + RTD.alpha * RTD.tTrue); }
function rtdMeasuredResistance(wire4) {
  return wire4 ? rtdTrueResistance() : rtdTrueResistance() + 2 * RTD.rLead;
}
function rtdIndicated(wire4) {
  const r = rtdMeasuredResistance(wire4);
  return (r / RTD.r0 - 1) / RTD.alpha;
}

// Infrarrojo
const IR = {
  tTrueC: 150.0,   // °C — superficie metálica caliente (p.ej. borne/conector de barra colectora)
  epsActual: 0.20, // emisividad real ilustrativa de metal pulido/ligeramente oxidado (rango típico 0.1–0.3)
  epsFactory: 0.95, // emisividad de fábrica típica en pistolas IR de consumo/taller
};
function kelvinOf(c) { return c + 273.15; }
function celsiusOf(k) { return k - 273.15; }
function irIndicatedC(epsSet) {
  const tRealK = kelvinOf(IR.tTrueC);
  const tApparentK = tRealK * Math.pow(IR.epsActual / epsSet, 0.25);
  return celsiusOf(tApparentK);
}

/* ---------- datos de los casos: se sortean al abrir el lab y al resembrar el caso ----------
   La demostración guiada usa DEMO: otras cifras que nunca salen del sorteo. */
const pick = a => a[Math.floor(Math.random() * a.length)];
const shuffled = a => { const b = a.slice(); for (let i = b.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [b[i], b[j]] = [b[j], b[i]]; } return b; };
const DEMO = { T_AMB: 25, tcT: 310, rtdT: 100, rLead: 0.60, irT: 200, eps: 0.15 };
function seedCase(key) {
  if (key === 'termopar') { const p = [T_AMB, TC.tTrue]; do { T_AMB = pick([18, 22, 26, 30]); TC.tTrue = pick([180, 260, 340, 400]); } while (T_AMB === p[0] && TC.tTrue === p[1]); }
  else if (key === 'rtd') { const p = [RTD.tTrue, RTD.rLead]; do { RTD.tTrue = pick([45, 85, 120, 160]); RTD.rLead = pick([0.20, 0.35, 0.50, 0.80]); } while (RTD.tTrue === p[0] && RTD.rLead === p[1]); }
  else { const p = [IR.tTrueC, IR.epsActual]; do { IR.tTrueC = pick([90, 150, 220, 300]); IR.epsActual = pick([0.10, 0.20, 0.30]); } while (IR.tTrueC === p[0] && IR.epsActual === p[1]); }
}
['termopar', 'rtd', 'infrarrojo'].forEach(seedCase);
const guardaDatos = () => ({ T_AMB, tcT: TC.tTrue, rtdT: RTD.tTrue, rLead: RTD.rLead, irT: IR.tTrueC, eps: IR.epsActual });
function restauraDatos(d) { T_AMB = d.T_AMB; TC.tTrue = d.tcT; RTD.tTrue = d.rtdT; RTD.rLead = d.rLead; IR.tTrueC = d.irT; IR.epsActual = d.eps; }

/* ===================== 5. Escenarios y diagnóstico ===================== */
const SCEN_ORDER = ['termopar', 'rtd', 'infrarrojo'];
const SCEN_META = {
  termopar: {
    nombre: 'Termopar Tipo K',
    unidadCruda: 'mV',
    respuesta: 'junta_fria',
    modeLabels: ['CJC desactivada', 'CJC activada'],
  },
  rtd: {
    nombre: 'RTD Pt100',
    unidadCruda: 'Ω',
    respuesta: 'resistencia_cable',
    modeLabels: ['2 hilos', '4 hilos (Kelvin)'],
  },
  infrarrojo: {
    nombre: 'Pistola infrarroja',
    unidadCruda: 'ε config.',
    respuesta: 'emisividad',
    get modeLabels() { return ['Emisividad de fábrica (' + IR.epsFactory.toFixed(2) + ')', 'Emisividad corregida (' + IR.epsActual.toFixed(2) + ')']; },
  },
};

/* Error que produce cada causa en ESTE caso (indicada − real). */
function errorDe(c) {
  if (c === 'junta_fria') return tcIndicated(false) - TC.tTrue;
  if (c === 'resistencia_cable') return rtdIndicated(false) - RTD.tTrue;
  if (c === 'emisividad') return irIndicatedC(IR.epsFactory) - IR.tTrueC;
  return 3;
}
const fmtErr = e => Math.abs(e).toFixed(1) + ' °C ' + (e < 0 ? 'por debajo' : 'por encima') + ' del valor real';
const DX_HINT = {
  junta_fria: () => '✅ Correcto. Sin compensación de junta fría (CJC), el lector interpreta el voltaje como si la unión de referencia estuviera a 0 °C. El error resultante es igual, en magnitud, a la temperatura ambiente de esa unión (' + T_AMB.toFixed(0) + ' °C aquí); no es una falla del termopar.',
  resistencia_cable: () => '✅ Correcto. En conexión a 2 hilos, la resistencia de los propios cables de extensión (2 × ' + RTD.rLead.toFixed(2) + ' Ω) se suma a la de la RTD y el lector no tiene forma de separarlas: ' + errorDe('resistencia_cable').toFixed(1) + ' °C de error. La conexión a 4 hilos (Kelvin) cancela ese error midiendo tensión sin corriente en los hilos de sensado.',
  emisividad: () => '✅ Correcto. La pistola infrarroja no mide temperatura directamente: infiere la temperatura a partir de la radiación emitida ASUMIENDO una emisividad. Si la superficie es más reflejante (ε = ' + IR.epsActual.toFixed(2) + ') que el valor configurado (' + IR.epsFactory.toFixed(2) + '), el instrumento subestima la temperatura: aquí ' + Math.abs(errorDe('emisividad')).toFixed(0) + ' °C por debajo.',
  falla: () => '❌ No es lo más probable. Antes de sospechar de una falla o descalibración del instrumento, compara la lectura contra un método de referencia y revisa primero la técnica de medición (compensación, conexión, configuración).',
};
/* Cada opción lleva su causa Y una cifra de error. Solo la correcta trae la cifra
   que la telemetría realmente muestra; las demás son otras causas (con la cifra
   que producirían aquí) o la misma causa con una cifra equivocada. */
function frase(c, f) {
  if (c === 'junta_fria') return 'Falta de compensación de junta fría (CJC): la lectura sale ' + fmtErr(errorDe(c) * f);
  if (c === 'resistencia_cable') return 'Resistencia de los cables de extensión (2 hilos): la lectura sale ' + fmtErr(errorDe(c) * f);
  if (c === 'emisividad') return 'Emisividad configurada distinta a la real: la lectura sale ' + fmtErr(errorDe(c) * f);
  return 'El instrumento está descalibrado o dañado: la lectura sale ' + fmtErr(errorDe(c) * f);
}
function buildQuiz(key) {
  const C = SCEN_META[key].respuesta;
  const W = 'Pista: compara el error que muestra la telemetría con la cifra de la opción y con lo que cambia al mover el modo del instrumento.';
  const ok = { t: frase(C, 1), ok: true, why: DX_HINT[C](), concepto: C };
  const mal = [
    ...['junta_fria', 'resistencia_cable', 'emisividad', 'falla'].filter(c => c !== C).map(c => ({ t: frase(c, 1), ok: false, why: W, concepto: c })),
    { t: frase(C, 0.5), ok: false, why: W, concepto: C }, { t: frase(C, 2), ok: false, why: W, concepto: C },
  ];
  const vistos = new Set([ok.t]);
  return { concepto: C, opciones: [ok, ...mal.filter(o => { if (vistos.has(o.t)) return false; vistos.add(o.t); return true; })] };
}

/* ===================== 6. Estado ===================== */
let scenarioKey = 'termopar';
let midiendo = false;
let energized = false;
/* Contabilidad del reto. Tres fallos seguidos en un caso lo resiembran. */
const answered = { termopar: false, rtd: false, infrarrojo: false };
const fallosCaso = { termopar: 0, rtd: 0, infrarrojo: 0 };
const RETO = { intentos: 0, resiembras: 0 };
let quizNow = { opciones: [] };
let autoRunning = false;
const MODE_STATE = { termopar: false, rtd: false, infrarrojo: false };

function readingFor(key) {
  const m = MODE_STATE[key];
  if (key === 'termopar') {
    return {
      tReal: TC.tTrue,
      signal: tcVoltageMv().toFixed(3) + ' mV',
      tInd: tcIndicated(m),
      modo: SCEN_META.termopar.modeLabels[m ? 1 : 0],
    };
  }
  if (key === 'rtd') {
    return {
      tReal: RTD.tTrue,
      signal: rtdMeasuredResistance(m).toFixed(3) + ' Ω',
      tInd: rtdIndicated(m),
      modo: SCEN_META.rtd.modeLabels[m ? 1 : 0],
    };
  }
  const epsSet = m ? IR.epsActual : IR.epsFactory;
  return {
    tReal: IR.tTrueC,
    signal: 'ε=' + epsSet.toFixed(2) + ' (real=' + IR.epsActual.toFixed(2) + ')',
    tInd: irIndicatedC(epsSet),
    modo: SCEN_META.infrarrojo.modeLabels[m ? 1 : 0],
  };
}

/* ===================== 7. Interacción — picker ===================== */
let selectedName = null;
pickerFor(scene, camera, renderer.domElement, (hit) => {
  /* `pickerFor` entrega la INTERSECCION del rayo, no la malla: `hit.userData`
     no existe y la linea anterior reventaba en cada clic, de modo que ningun
     rotulo de pieza llego nunca a aparecer. Ademas hay que SUBIR por los padres,
     porque las piezas de la biblioteca son grupos y lo que se toca es un hijo. */
  if (!hit) return;
  let o = hit.object;
  while (o && !(o.userData && o.userData.partName)) o = o.parent;
  if (!o) return;
  selectedName = o.userData.partName;
  const desc = HOVER_LABELS[selectedName] || '';
  showToast(desc);
});

function showToast(msg) {
  const t = el('toast');
  if (!t) return;
  t.textContent = msg;
  t.classList.add('show');
  clearTimeout(showToast._h);
  showToast._h = setTimeout(() => t.classList.remove('show'), 4200);
}

function el(id) { return document.getElementById(id); }
function tf(n, d = 2) { return Number.isFinite(n) ? n.toFixed(d) : '—'; }

/* ===================== 8. HUD y panel (estático, se llena una vez) ===================== */
el('hud').innerHTML = `
  <div class="eyebrow">Instrumentación · Medición de temperatura</div>
  <h2>🌡️ Termopar · RTD · Infrarrojo</h2>
  <div class="formula">
    Termopar: V = S_K·(T − T_amb) &nbsp;|&nbsp; T_ind = V/S_K (+T_amb si hay CJC)<br/>
    RTD: R = R₀·(1+α·T) &nbsp;|&nbsp; T_ind = (R/R₀ − 1)/α<br/>
    IR: T_ap[K] = T_real[K]·(ε_real/ε_config)^¼
  </div>
  <div class="legend">
    <div class="li"><span class="dot" style="background:#2e8b57"></span>Cable termopar (verde, IEC 60584-3)</div>
    <div class="li"><span class="dot" style="background:#b8342f"></span>Hilo RTD (rojo)</div>
    <div class="li"><span class="dot" style="background:#d9d5c8"></span>Hilo RTD (blanco)</div>
    <div class="li"><span class="dot" style="background:#ff2b2b"></span>Punto láser (sólo puntería, no mide)</div>
  </div>
  <div class="fid">
    <div class="ft">✔ Sí modela</div>
    <div class="fl">Efecto Seebeck lineal (Tipo K) y el error real de omitir la compensación de junta fría (CJC), igual en magnitud a la temperatura ambiente de la unión de referencia.</div>
    <div class="fl">Ecuación de Callendar–Van Dusen simplificada a su forma lineal (coeficiente medio α, IEC 60751) y el error real de conexión a 2 hilos frente a 4 hilos (Kelvin) por resistencia de cable.</div>
    <div class="fl">Relación graybody simplificada entre radiación emitida, emisividad y temperatura, y el riesgo real y documentado de subestimar la temperatura de superficies metálicas brillantes si no se corrige la emisividad.</div>
    <div class="ft no">✘ NO modela</div>
    <div class="fl no">Termopar: la tabla de referencia no lineal completa Tipo K (curva polinómica IEC 60584-1); aquí se usa un coeficiente de Seebeck promedio constante, válido como aproximación didáctica, no para uso metrológico.</div>
    <div class="fl no">RTD: la forma cuadrática completa de Callendar–Van Dusen, el autocalentamiento por corriente de excitación, ni la tolerancia de clase de una Pt100 individual.</div>
    <div class="fl no">IR: radiación de fondo reflejada, transmisión atmosférica, tamaño de punto (spot size)/distancia focal, ni ruido del detector.</div>
  </div>`;

el('panel').innerHTML = `
  <h4 id="p_title">Termopar Tipo K</h4>
  <div class="modebar">
    <button class="b" id="btnNew">🔀 Otro instrumento</button>
    <button class="b" id="btnMedir">🌡️ Iniciar medición</button>
  </div>
  <div class="modebar" id="modebar">
    <button class="b on" id="btnModeA"></button>
    <button class="b" id="btnModeB"></button>
  </div>
  <div id="tele">
    <div class="g"><div class="gl"><span>T real del punto</span><b id="t_treal">—</b></div></div>
    <div class="g"><div class="gl"><span>Señal cruda del sensor</span><b id="t_signal">—</b></div></div>
    <div class="g"><div class="gl"><span>T indicada por el instrumento</span><b id="t_tind">—</b></div></div>
    <div class="g"><div class="gl"><span>Error (indicada − real)</span><b id="t_error">—</b></div></div>
    <div class="g"><div class="gl"><span>Modo del instrumento</span><b id="t_modo">—</b></div></div>
  </div>
  <h4 class="sec">¿Cuál es la causa del error observado?</h4>
  <div class="btns" id="dxbtns"></div>
  <div class="console" id="dxfeedback"></div>
  <div class="btns">
    <button class="b auto" id="btnAuto">▶️ Demostración guiada</button>
  </div>`;

/* ===================== 9. Render de pantallas canvas ===================== */
function drawScreen(ctx, canvas, lines) {
  ctx.fillStyle = '#050706';
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  ctx.fillStyle = '#39e6b0';
  ctx.font = '700 26px monospace';
  ctx.textBaseline = 'top';
  lines.forEach((l, i) => ctx.fillText(l, 10, 8 + i * 32));
}

function updateScreens() {
  if (!midiendo) {
    drawScreen(scrCtxTC, scrTexTC, ['T ---.- °C', 'V --.-- mV']);
    drawScreen(scrCtxRTD, scrTexRTD, ['T ---.- °C', 'R ---.- Ω']);
    drawScreen(scrCtxIR, scrTexIR, ['---.- °C']);
    scrTexObjTC.needsUpdate = true; scrTexObjRTD.needsUpdate = true; scrTexObjIR.needsUpdate = true;
    return;
  }
  const rTC = readingFor('termopar');
  drawScreen(scrCtxTC, scrTexTC, ['T ' + tf(rTC.tInd, 1) + ' °C', 'V ' + tcVoltageMv().toFixed(2) + ' mV']);
  const rRTD = readingFor('rtd');
  drawScreen(scrCtxRTD, scrTexRTD, ['T ' + tf(rRTD.tInd, 1) + ' °C', 'R ' + rtdMeasuredResistance(MODE_STATE.rtd).toFixed(2) + ' Ω']);
  const rIR = readingFor('infrarrojo');
  drawScreen(scrCtxIR, scrTexIR, [tf(rIR.tInd, 1) + ' °C']);
  scrTexObjTC.needsUpdate = true; scrTexObjRTD.needsUpdate = true; scrTexObjIR.needsUpdate = true;
}

/* ===================== 10. Telemetría y visibilidad de grupos ===================== */
function classify(err) {
  const a = Math.abs(err);
  if (a < 1.0) return 'good';
  if (a < 10.0) return 'warn';
  return 'bad';
}

function updateTele() {
  const tR = el('t_treal'), tS = el('t_signal'), tI = el('t_tind'), tE = el('t_error'), tM = el('t_modo');
  if (!midiendo) {
    [tR, tS, tI, tE, tM].forEach(n => { n.textContent = '—'; n.className = ''; });
    return;
  }
  const r = readingFor(scenarioKey);
  const err = r.tInd - r.tReal;
  tR.textContent = tf(r.tReal, 1) + ' °C';
  tS.textContent = r.signal;
  tI.textContent = tf(r.tInd, 1) + ' °C';
  tE.textContent = (err >= 0 ? '+' : '') + tf(err, 1) + ' °C';
  tE.className = classify(err);
  tM.textContent = r.modo;
  updateScreens();
}

function setGroupsVisibility() {
  tcGroup.visible = scenarioKey === 'termopar';
  rtdGroup.visible = scenarioKey === 'rtd';
  irGroup.visible = scenarioKey === 'infrarrojo';
}

function refreshModeBar() {
  const labels = SCEN_META[scenarioKey].modeLabels;
  const m = MODE_STATE[scenarioKey];
  el('btnModeA').textContent = labels[0];
  el('btnModeB').textContent = labels[1];
  el('btnModeA').classList.toggle('on', !m);
  el('btnModeB').classList.toggle('on', m);
}

function clearDx() {
  document.querySelectorAll('.b.dx').forEach(b => b.classList.remove('right', 'wrong'));
  el('dxfeedback').textContent = '';
}

function setScenario(key) {
  scenarioKey = key;
  el('p_title').textContent = SCEN_META[key].nombre;
  setGroupsVisibility();
  refreshModeBar();
  clearDx();
  updateTele();
  refreshQuestion();
}

function setMode(v) {
  MODE_STATE[scenarioKey] = v;
  refreshModeBar();
  updateTele();
}

function setMedir(on) {
  midiendo = on;
  energized = on;
  el('btnMedir').textContent = on ? '⏹️ Detener medición' : '🌡️ Iniciar medición';
  el('btnMedir').classList.toggle('on', on);
  updateTele();
}

/* ===================== 11. Wiring de botones ===================== */
el('btnNew').addEventListener('click', () => {
  const i = SCEN_ORDER.indexOf(scenarioKey);
  setScenario(SCEN_ORDER[(i + 1) % SCEN_ORDER.length]);
});
el('btnMedir').addEventListener('click', () => setMedir(!midiendo));
el('btnModeA').addEventListener('click', () => setMode(false));
el('btnModeB').addEventListener('click', () => setMode(true));
function renderQuiz() {
  el('dxbtns').innerHTML = quizNow.opciones.map((o, i) => '<button class="b dx" data-i="' + i + '">' + 'ABCD'[i] + ' · ' + o.t + '</button>').join('');
  el('dxbtns').querySelectorAll('.b.dx').forEach(btn => { btn.addEventListener('click', () => answer(+btn.dataset.i)); });
}
/* Una correcta + 3 del banco de distractores, barajadas: ni la posición ni el
   largo delatan la respuesta, y tras una resiembra salen otras cifras. */
function refreshQuestion() {
  const q = buildQuiz(scenarioKey);
  const buenas = q.opciones.filter(o => o.ok), malas = q.opciones.filter(o => !o.ok);
  // como mucho UNA variante de la misma causa con cifra equivocada: si no, la causa repetida delata la respuesta
  const misma = shuffled(malas.filter(o => o.concepto === q.concepto)), otras = shuffled(malas.filter(o => o.concepto !== q.concepto));
  quizNow = { opciones: shuffled(buenas.concat(misma.slice(0, 1), otras.slice(0, 2))) };
  renderQuiz();
  el('dxfeedback').textContent = '';
}
function resiembra() {
  fallosCaso[scenarioKey] = 0; RETO.resiembras++;
  seedCase(scenarioKey);
  MODE_STATE[scenarioKey] = false; refreshModeBar(); updateTele();
  refreshQuestion();
}
function answer(i) {
  if (!midiendo) { showToast('Primero inicia la medición.'); return; }
  if (autoRunning) return;                 // la demostración enseña, no puntúa
  if (answered[scenarioKey]) { showToast('Este caso ya está resuelto: pasa al siguiente.'); return; }
  const o = quizNow.opciones[i];
  clearDx();
  const btn = el('dxbtns').children[i];
  RETO.intentos++;
  if (o.ok) {
    btn.classList.add('right'); answered[scenarioKey] = true; fallosCaso[scenarioKey] = 0;
    el('dxfeedback').textContent = o.why;
  } else {
    btn.classList.add('wrong');
    fallosCaso[scenarioKey]++;
    if (fallosCaso[scenarioKey] >= 3) {
      resiembra();
      el('dxfeedback').textContent = '✗ Tres fallos en este caso: cambian las cifras del instrumento y las opciones. Vuelve a medir con calma.';
    } else {
      el('dxfeedback').textContent = '✗ No es la causa principal aquí. ' + o.why + ' (fallos en este caso: ' + fallosCaso[scenarioKey] + '/3)';
    }
  }
}

/* ===================== 12. Animación ===================== */
S.setAnimate(() => {
  const glow = energized ? 0.35 + 0.15 * Math.sin(performance.now() / 260) : 0.0;
  targetBody.material.emissive = new THREE.Color(0xff5a1a);
  targetBody.material.emissiveIntensity = energized ? glow : 0.0;
  tcLed.material.emissiveIntensity = (energized && scenarioKey === 'termopar' && MODE_STATE.termopar) ? 0.9 : 0.15;
  const apunta = (energized && scenarioKey === 'infrarrojo') ? 1.0 : 0.0;
  laserDot.material.emissiveIntensity = apunta;
  irBeam.material.emissiveIntensity = apunta * 0.75;
  irBeam.visible = apunta > 0;
  /* El segundo par de hilos SOLO existe en la conexion a 4 hilos. Dibujarlo
     siempre contradecia el propio enunciado del laboratorio. */
  rtdWireA2.visible = rtdWireB2.visible = MODE_STATE.rtd;
  controls.update();
  renderer.render(scene, camera);
});

/* ===================== 13. Demostración guiada ===================== */
function sleep(ms) { return new Promise(r => setTimeout(r, ms)); }

el('btnAuto').addEventListener('click', async () => {
  if (autoRunning) return;
  autoRunning = true;
  el('btnAuto').disabled = true;
  const panel = el('panel'); panel.style.pointerEvents = 'none';   // el alumno no toca los controles a mitad
  const prev = { datos: guardaDatos(), escenario: scenarioKey, modos: { ...MODE_STATE }, midiendo, quiz: quizNow };
  try {
    // La demostración trabaja con OTRAS cifras (DEMO): lo del alumno no se toca.
    restauraDatos({ T_AMB: DEMO.T_AMB, tcT: DEMO.tcT, rtdT: DEMO.rtdT, rLead: DEMO.rLead, irT: DEMO.irT, eps: DEMO.eps });
    setScenario('termopar');
    setMode(false);
    setMedir(true);
    const eTC = errorDe('junta_fria');
    showToast('Termopar sin compensación de junta fría (cifras de ejemplo): la lectura queda ' + fmtErr(eTC) + '.');
    await sleep(2800);
    showToast(DX_HINT.junta_fria());
    await sleep(3200);
    setMode(true);
    showToast('Con CJC activada, el lector suma la temperatura de su propia unión de referencia y corrige el error.');
    await sleep(2800);

    setScenario('rtd');
    setMode(false);
    showToast('RTD a 2 hilos: la resistencia de los cables de extensión se suma a la de la RTD y eleva la lectura ' + errorDe('resistencia_cable').toFixed(1) + ' °C.');
    await sleep(2800);
    showToast(DX_HINT.resistencia_cable());
    await sleep(3200);
    setMode(true);
    showToast('A 4 hilos (Kelvin), un par mide corriente y el otro mide tensión sin caída por los cables: el error desaparece.');
    await sleep(2800);

    setScenario('infrarrojo');
    setMode(false);
    showToast('Pistola IR con emisividad de fábrica (' + IR.epsFactory.toFixed(2) + ') sobre metal pulido (ε real ≈ ' + IR.epsActual.toFixed(2) + '): la lectura queda ' + fmtErr(errorDe('emisividad')) + '.');
    await sleep(3000);
    showToast(DX_HINT.emisividad());
    await sleep(3200);
    setMode(true);
    showToast('Al configurar la emisividad real de la superficie, la pistola IR indica la temperatura correcta.');
    await sleep(2800);

    showToast('Demostración terminada (cifras de ejemplo). Tu avance en el reto no cambió.');
    await sleep(1600);
  } finally {
    restauraDatos(prev.datos);
    autoRunning = false;
    Object.assign(MODE_STATE, prev.modos);
    setScenario(prev.escenario);
    setMedir(prev.midiendo);
    quizNow = prev.quiz; renderQuiz(); el('dxfeedback').textContent = '';
    updateTele();
    panel.style.pointerEvents = '';
    el('btnAuto').disabled = false;
  }
});

/* ===================== 14. Estado inicial ===================== */
window.__labDebug = {
  get mode() { return scenarioKey; },
  get solved() { return Object.values(answered).every(Boolean); },
  get intentos() { return RETO.intentos; },
  state() { return { caso: scenarioKey, midiendo, answered: { ...answered }, intentos: RETO.intentos,
    fallos: { ...fallosCaso }, resiembras: RETO.resiembras, resuelto: Object.values(answered).every(Boolean), autoRunning }; },
  datos() { return guardaDatos(); },
  setScenario(k) { setScenario(k); },
  mide() { if (!midiendo) el('btnMedir').click(); },
  opciones() { return [...document.querySelectorAll('#dxbtns .b.dx')].map((b, i) => ({ t: b.textContent, ok: !!quizNow.opciones[i].ok })); },
};
setScenario('termopar');
setMedir(false);
S.start();   // sin esto el bucle de render nunca arranca y el lienzo 3D se queda en negro
