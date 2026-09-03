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
const S = createStage(mount, {
  cam: [5.6, 3.6, 6.2],
  target: [0, 1.0, -0.2],
});
const { scene, camera, renderer, controls } = S;

const bench = roundedBox(6.6, 0.28, 3.7, MAT.bench, 0.05);
bench.position.set(0, 0.6, 0);
bench.receiveShadow = true;
scene.add(registerPart(bench, 'banco', 'Banco de trabajo. Tres instrumentos distintos miden la temperatura del mismo bloque, cada uno con su propio principio físico.'));

/* --- Bloque caliente (blanco común) --- */
const targetGroup = new THREE.Group();
targetGroup.position.set(0, 0.9, -0.3);
scene.add(targetGroup);

const targetBody = roundedBox(0.9, 0.6, 0.9, MAT.target, 0.06);
targetBody.material = MAT.target.clone();
targetGroup.add(registerPart(targetBody, 'bloque', 'Punto de medición. Componente metálico caliente medido con tres instrumentos distintos — un termopar, una RTD y una pistola infrarroja — cada uno con su propio principio físico y su propio error característico si se usa mal. El color del bloque cambia con la temperatura sólo como convención visual didáctica; NO representa el color real de radiación térmica a estas temperaturas.'));

const targetLabel = labelSprite('BLOQUE', '#e8ecef');
targetLabel.position.set(0, 0.5, 0);
targetGroup.add(targetLabel);

/* --- Termopar (izquierda) --- */
const tcGroup = new THREE.Group();
tcGroup.position.set(0, 0, 0);
scene.add(tcGroup);

const tcMeterBody = roundedBox(0.55, 0.9, 0.4, MAT.toolBody, 0.06);
tcMeterBody.position.set(-2.3, 1.05, 0.6);
tcGroup.add(registerPart(tcMeterBody, 'lector_tc', 'Lector de termopar. Mide el voltaje generado por el termopar y lo convierte a temperatura. Necesita conocer la temperatura de SU PROPIA unión de referencia (compensación de junta fría, CJC) para no leer sistemáticamente bajo (IEC 60584).'));

const scrTexTC = document.createElement('canvas');
scrTexTC.width = 256; scrTexTC.height = 128;
const scrCtxTC = scrTexTC.getContext('2d');
const scrTexObjTC = new THREE.CanvasTexture(scrTexTC);
/* La pantalla estaba centrada en 1.42 y mide 0.22 de alto: su borde superior
   caia en 1.53 y la tapa de la caja esta en 1.50, o sea que sobresalia. Baja a
   1.33 y se le pone MARCO, que es lo que tiene cualquier instrumento. */
const tcScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.22), new THREE.MeshBasicMaterial({ map: scrTexObjTC }));
tcScreen.position.set(-2.3, 1.33, 0.81);
tcGroup.add(tcScreen);
const tcMarco = new THREE.Mesh(P3.extruido(
  [[-0.23, -0.14], [0.23, -0.14], [0.23, 0.14], [-0.23, 0.14]],
  { huecos: [[[-0.20, -0.11], [0.20, -0.11], [0.20, 0.11], [-0.20, 0.11]]],
    espesor: 0.024, bisel: 0.005 }), MAT.probe);
tcMarco.position.set(-2.3, 1.33, 0.798);
tcGroup.add(tcMarco);

const tcLedG = P3.led(MATP, { d: 0.075, color: 0x2ad9c2, patas: 0.05 });
tcLedG.rotation.x = Math.PI / 2;
tcLedG.position.set(-2.44, 1.10, 0.80);
tcGroup.add(registerPart(tcLedG, 'cjc_led', 'Indicador de compensación de junta fría (CJC). Encendido cuando el lector está midiendo activamente la temperatura de su propio bloque de terminales.'));
const tcLed = { material: tcLedG.userData.material };

/* EL ZOCALO DE TERMOPAR del lector, con su conector miniatura enchufado. Aqui
   dentro, en las palas, esta LA UNION DE REFERENCIA: es exactamente el sitio
   cuya temperatura tiene que medir la compensacion de junta fria, y por eso el
   LED de CJC esta al lado y no en cualquier otra parte de la caja. */
const tcPlug = P3.conectorTermopar(MATP, { ancho: 0.19, alto: 0.12, fondo: 0.20, color: 0x2e8b57 });
tcPlug.position.set(-2.3, 0.90, 0.80);
tcGroup.add(registerPart(tcPlug, 'conector_tc', 'Conector miniatura de termopar tipo K (verde, IEC 60584-3), enchufado en el zócalo del lector. Sus dos palas son de ANCHURA DISTINTA para que no pueda meterse invertido: invertirlo cambiaría el signo del voltaje medido. En estas palas está la unión de referencia (junta fría) que el lector debe compensar.'));

/* EL TERMOPAR no es una bolita: son DOS HILOS de aleaciones distintas trenzados
   y fundidos en una PERLA. Que se toquen en un solo punto ES el sensor —efecto
   Seebeck— y por eso cualquier empalme de mas en el cable es otra union. */
const tcBead = P3.unionTermopar(MATP, { d: 0.09, hilo: 0.018, largo: 0.30,
  colorA: 0xc8b560, colorB: 0xb9c2cb });
tcBead.rotation.z = 0.80;
tcBead.position.set(-0.46, 0.9, -0.55);
tcGroup.add(registerPart(tcBead, 'termopar', 'Termopar tipo K. Une dos aleaciones distintas (Cromel/Alumel) que generan un voltaje proporcional a la diferencia de temperatura entre la punta y la unión de referencia — efecto Seebeck (IEC 60584). El color verde del cable corresponde al código de color IEC 60584-3 para Tipo K.'));

const tcWire = cableTube(new THREE.Vector3(-2.30, 0.90, 1.03), new THREE.Vector3(-0.68, 1.11, -0.55), MAT.wireTC);
tcGroup.add(registerPart(tcWire, 'cable_tc', 'Cable de termopar Tipo K (código de color verde, IEC 60584-3). Cualquier unión adicional en este cable con metal distinto introduce otra unión termoeléctrica no deseada.'));

/* --- RTD (derecha) --- */
const rtdGroup = new THREE.Group();
scene.add(rtdGroup);

const rtdMeterBody = roundedBox(0.55, 0.9, 0.4, MAT.toolBody, 0.06);
rtdMeterBody.position.set(2.3, 1.05, 0.6);
rtdGroup.add(registerPart(rtdMeterBody, 'lector_rtd', 'Lector de RTD. Aplica una corriente conocida a la RTD y mide la caída de tensión para calcular su resistencia. En conexión a 2 hilos no puede distinguir la resistencia del sensor de la de los propios cables de extensión.'));

const scrTexRTD = document.createElement('canvas');
scrTexRTD.width = 256; scrTexRTD.height = 128;
const scrCtxRTD = scrTexRTD.getContext('2d');
const scrTexObjRTD = new THREE.CanvasTexture(scrTexRTD);
const rtdScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.4, 0.22), new THREE.MeshBasicMaterial({ map: scrTexObjRTD }));
rtdScreen.position.set(2.3, 1.33, 0.81);
rtdGroup.add(rtdScreen);
const rtdMarco = new THREE.Mesh(P3.extruido(
  [[-0.23, -0.14], [0.23, -0.14], [0.23, 0.14], [-0.23, 0.14]],
  { huecos: [[[-0.20, -0.11], [0.20, -0.11], [0.20, 0.11], [-0.20, 0.11]]],
    espesor: 0.024, bisel: 0.005 }), MAT.probe);
rtdMarco.position.set(2.3, 1.33, 0.798);
rtdGroup.add(rtdMarco);

/* LA BORNERA DE CUATRO VIAS del lector. No es adorno: son las cuatro vias las
   que hacen posible la conexion Kelvin —dos llevan la corriente y dos miden la
   tension sin que por ellas circule nada—, y por eso en 2 hilos solo se ocupan
   dos y la resistencia del cable se suma a la de la sonda. Va girada un cuarto
   de vuelta: los tornillos miran al frente y los cables entran por abajo, que
   es como se monta una bornera en un panel. */
const rtdBorn = P3.bornera(MATP, { vias: 4, paso: 0.10, alto: 0.11, fondo: 0.12, patas: 0.05 });
rtdBorn.rotation.x = Math.PI / 2;
rtdBorn.position.set(2.3, 1.02, 0.80);
rtdGroup.add(registerPart(rtdBorn, 'bornera_rtd', 'Bornera de 4 vías del lector. En conexión a 2 hilos sólo se usan dos y la resistencia de los cables se suma a la de la RTD; en conexión a 4 hilos (Kelvin) un par inyecta la corriente y el otro par mide la tensión sin caída propia, cancelando ese error.'));

/* LA SONDA no es un tubo liso: tiene PUNTA REDONDEADA —lo unico que toca la
   pieza—, CABEZAL de transicion por el que se agarra y MUELLE ANTITIRONES,
   que esta ahi porque el cable se rompe siempre justo en ese punto. */
const rtdProbe = P3.sondaTemperatura(MATP, { largo: 0.34, d: 0.085 });
rtdProbe.rotation.z = -Math.PI / 2;
rtdProbe.position.set(0.45, 0.9, -0.55);
rtdGroup.add(registerPart(rtdProbe, 'rtd', 'RTD Pt100. Resistencia de platino que cambia de valor de forma casi lineal con la temperatura: 100 Ω a 0 °C, +≈0.385 Ω por °C (coeficiente medio, IEC 60751).'));

/* Cada hilo sale de SU via de la bornera y llega al muelle antitirones de la
   sonda, no al aire ni a la mitad de la vaina. */
const rtdWireA1 = cableTube(new THREE.Vector3(2.15, 0.958, 0.84), new THREE.Vector3(1.07, 0.94, -0.55), MAT.wireRtdA, 0.02);
const rtdWireB1 = cableTube(new THREE.Vector3(2.25, 0.958, 0.84), new THREE.Vector3(1.07, 0.90, -0.58), MAT.wireRtdB, 0.02);
const rtdWireA2 = cableTube(new THREE.Vector3(2.35, 0.958, 0.84), new THREE.Vector3(1.07, 0.87, -0.52), MAT.wireRtdA, 0.017);
const rtdWireB2 = cableTube(new THREE.Vector3(2.45, 0.958, 0.84), new THREE.Vector3(1.07, 0.90, -0.51), MAT.wireRtdB, 0.017);
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
const irGun = P3.pistolaIR(MATP, { alto: 0.62, ancho: 0.20, cuerpo: 0xff8c1a });
irGun.rotation.y = Math.PI / 2;
irGun.position.set(0, 0.74, 1.55);
irGroup.add(registerPart(irGun, 'pistola_ir', 'Pistola infrarroja. Mide la radiación infrarroja emitida por la superficie y la convierte a temperatura ASUMIENDO un valor de emisividad configurado por el usuario — no mide temperatura de forma directa ni por contacto.'));
registerPart(irGun.userData.gatillo, 'gatillo_ir', 'Gatillo de la pistola. Mientras se mantiene apretado el instrumento mide de forma continua; al soltarlo, la última lectura queda retenida en pantalla (HOLD).');

const scrTexIR = document.createElement('canvas');
scrTexIR.width = 256; scrTexIR.height = 128;
const scrCtxIR = scrTexIR.getContext('2d');
const scrTexObjIR = new THREE.CanvasTexture(scrTexIR);
/* La pantalla va en el hueco que la propia pieza deja arriba, inclinado hacia
   quien dispara: no hay que colocarla a ojo. */
const irScreen = new THREE.Mesh(new THREE.PlaneGeometry(0.150, 0.075), new THREE.MeshBasicMaterial({ map: scrTexObjIR }));
irScreen.position.z = 0.012;
irGun.userData.pantalla.add(irScreen);

/* EL HAZ DE PUNTERIA, a la altura de la boca del cañón. Se ve para que quede
   claro adónde apunta el instrumento — y para que se vea también que el láser
   NO mide: lo que mide es la óptica, y el punto rojo sólo señala el sitio. */
const irBeam = new THREE.Mesh(new THREE.CylinderGeometry(0.006, 0.006, 0.981, 8), MAT.laser.clone());
irBeam.rotation.x = Math.PI / 2;
irBeam.position.set(0, 1.081, 0.6505);
irGroup.add(irBeam);

const laserDot = new THREE.Mesh(new THREE.CircleGeometry(0.035, 16), MAT.laser.clone());
laserDot.position.set(0, 1.081, 0.16);
irGroup.add(registerPart(laserDot, 'punto_laser', 'Punto láser de puntería. El láser NO participa en la medición de temperatura: solo ayuda a apuntar el sensor óptico hacia el punto deseado (advertencia estándar de todo fabricante de pistolas IR).'));

/* ===================== 4. Física — constantes declaradas ===================== */
const T_AMB = 22.0; // °C — ambiente típico de taller (ilustrativo)

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
    modeLabels: ['Emisividad de fábrica (0.95)', 'Emisividad corregida (0.20)'],
  },
};

const DX_HINT = {
  junta_fria: '✅ Correcto. Sin compensación de junta fría (CJC), el lector interpreta el voltaje como si la unión de referencia estuviera a 0 °C. El error resultante es igual, en magnitud, a la temperatura ambiente de esa unión — no es una falla del termopar.',
  resistencia_cable: '✅ Correcto. En conexión a 2 hilos, la resistencia de los propios cables de extensión se suma a la de la RTD y el lector no tiene forma de separarlas. La conexión a 4 hilos (Kelvin) cancela ese error midiendo tensión sin corriente por los hilos de detección.',
  emisividad: '✅ Correcto. La pistola infrarroja no mide temperatura directamente: infiere la temperatura a partir de la radiación emitida ASUMIENDO una emisividad. Si la superficie es más reflejante (menor ε) que el valor configurado, el instrumento subestima drásticamente la temperatura real.',
  falla: '❌ No es lo más probable. Antes de sospechar de una falla o descalibración del instrumento, siempre compare la lectura contra un método de referencia y revise primero la técnica de medición (compensación, conexión, configuración) — es la causa más común de discrepancias en campo.',
};

/* ===================== 6. Estado ===================== */
let scenarioKey = 'termopar';
let midiendo = false;
let energized = false;
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
  <div class="btns" id="dxbtns">
    <button class="b dx" data-dx="junta_fria">A · Falta de compensación de junta fría (CJC)</button>
    <button class="b dx" data-dx="resistencia_cable">B · Resistencia de los cables de extensión (2 hilos)</button>
    <button class="b dx" data-dx="emisividad">C · Emisividad configurada distinta a la real</button>
    <button class="b dx" data-dx="falla">D · El instrumento está descalibrado o dañado</button>
  </div>
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
document.querySelectorAll('.b.dx').forEach(btn => {
  btn.addEventListener('click', () => {
    const key = btn.getAttribute('data-dx');
    const correct = SCEN_META[scenarioKey].respuesta;
    clearDx();
    btn.classList.add(key === correct ? 'right' : 'wrong');
    if (key !== correct) {
      document.querySelector(`.b.dx[data-dx="${correct}"]`).classList.add('right');
    }
    el('dxfeedback').textContent = DX_HINT[key];
  });
});

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
  el('btnAuto').disabled = true;
  try {
    setScenario('termopar');
    setMode(false);
    setMedir(true);
    showToast('Termopar sin compensación de junta fría: la lectura queda por debajo de la temperatura real.');
    await sleep(2800);
    document.querySelector('.b.dx[data-dx="junta_fria"]').click();
    await sleep(2400);
    setMode(true);
    showToast('Con CJC activada, el lector suma la temperatura de su propia unión de referencia y corrige el error.');
    await sleep(2800);

    setScenario('rtd');
    setMode(false);
    showToast('RTD a 2 hilos: la resistencia de los cables de extensión se suma a la de la RTD y eleva la lectura.');
    await sleep(2800);
    document.querySelector('.b.dx[data-dx="resistencia_cable"]').click();
    await sleep(2400);
    setMode(true);
    showToast('A 4 hilos (Kelvin), un par mide corriente y el otro mide tensión sin caída por los cables: el error desaparece.');
    await sleep(2800);

    setScenario('infrarrojo');
    setMode(false);
    showToast('Pistola IR con emisividad de fábrica (0.95) sobre metal pulido (ε real ≈ 0.20): subestima la temperatura drásticamente.');
    await sleep(3000);
    document.querySelector('.b.dx[data-dx="emisividad"]').click();
    await sleep(2400);
    setMode(true);
    showToast('Al configurar la emisividad real de la superficie, la pistola IR indica la temperatura correcta.');
    await sleep(2800);

    showToast('Demostración terminada. Cada instrumento mide un fenómeno físico distinto — y cada uno tiene su propio modo de fallar si se ignora su configuración.');
  } finally {
    el('btnAuto').disabled = false;
  }
});

/* ===================== 14. Estado inicial ===================== */
setScenario('termopar');
setMedir(false);
S.start();   // sin esto el bucle de render nunca arranca y el lienzo 3D se queda en negro
