/**
 * ============================================================================
 *  CEN LABS · BIBLIOTECA DE PIEZAS 3D
 * ============================================================================
 *
 *  Por qué existe este archivo.
 *
 *  El kit de escena que comparten los laboratorios sabe hacer dos cosas: cajas
 *  con las esquinas redondeadas y cilindros. Con eso se puede insinuar casi
 *  cualquier montaje, y por eso durante ciento y pico laboratorios nadie echó de
 *  menos nada. Pero una caja no es una pieza: un pistón tiene cabeza, ranuras de
 *  segmentos, alojamiento de bulón y falda, y un cilindro liso no enseña ninguna
 *  de las cuatro. El alumno que abre el capó de un coche de verdad después de
 *  haber visto una caja naranja donde va la mordaza no reconoce la mordaza.
 *
 *  Lo que faltaba no era detalle, era VOCABULARIO. Una pieza torneada se
 *  describe con su perfil y una revolución; una pieza fundida o cortada, con su
 *  contorno, sus agujeros y una extrusión biselada. Con esas dos operaciones —y
 *  no hacen falta más— salen pistones, válvulas, bujías, inyectores, discos
 *  ventilados, mordazas, bielas, levas, engranes y bridas.
 *
 *  Cómo se usa. Es un módulo ES y se resuelve con el mismo `importmap` que el
 *  laboratorio ya declara para `three`, así que funciona sin conexión igual que
 *  todo lo demás:
 *
 *      import * as P3 from '/labs/_piezas3d.js';
 *
 *  Las PRIMITIVAS devuelven geometría, no mallas, para que cada laboratorio
 *  ponga sus propios materiales: un laboratorio que reparte materiales desde
 *  fuera es un laboratorio en el que el centinela de materiales falsos sigue
 *  sirviendo de algo. Las PIEZAS COMPLETAS devuelven un grupo, porque una pieza
 *  de verdad lleva más de un material, y reciben ese diccionario de materiales
 *  como primer argumento.
 *
 *  Convenio de ejes y de origen, que vale para toda la biblioteca:
 *    · Las piezas de revolución tienen su eje en +Y y el origen en su centro.
 *    · Las piezas extruidas tienen su espesor en Z y el origen en su centro.
 *    · Todas las medidas están en las unidades del laboratorio que llame; los
 *      parámetros se dan como proporciones de una cota característica —el
 *      diámetro del cilindro, el del disco— porque así una pieza sigue siendo
 *      la misma pieza cuando el laboratorio cambia de escala.
 * ============================================================================
 */
import * as THREE from 'three';

/* ==========================================================================
   §1 · PRIMITIVAS DE FORMA
   ========================================================================== */

/**
 * Pieza de revolución a partir de su perfil, que es como se describe cualquier
 * cosa que haya salido de un torno.
 *
 * `perfil` es la lista de puntos [radio, altura] leídos de abajo arriba. El
 * radio nunca debe ser negativo, y un radio 0 cierra la pieza sobre el eje.
 *
 * EL TRUCO DE LAS ARISTAS. `LatheGeometry` promedia la normal entre segmentos
 * consecutivos, así que un perfil con un codo sale redondeado aunque el codo sea
 * de noventa grados. Para que una arista salga VIVA —el canto de la cabeza de un
 * pistón, el asiento de una válvula— hay que repetir el punto:
 *
 *     [[0,0],[0.5,0],[0.5,0],[0.5,1]]   ← canto vivo en el radio 0,5
 *     [[0,0],[0.5,0],[0.5,1]]           ← el mismo codo, pero redondeado
 *
 * Es un poco incómodo y es a propósito: obliga a decidir, pieza por pieza, qué
 * canto está mecanizado a filo y cuál lleva su radio de acuerdo.
 *
 * EL SENTIDO NO HAY QUE RECORDARLO. El orden en que se recorre el perfil decide
 * hacia dónde miran las normales, y un perfil escrito al revés da una pieza
 * VUELTA: se pinta sin dar ningún error, pero se le ve el interior y el exterior
 * desaparece. Ya pasó una vez con el pistón y no se notó hasta mirar una
 * captura. Así que aquí se mide el área con signo del perfil, cerrado contra el
 * eje, y si sale negativa se le da la vuelta. Un perfil correcto no se toca.
 */
export function revolucion(perfil, opts = {}) {
  const { seg = 48, fase = 0, arco = Math.PI * 2 } = opts;
  let P = perfil.map(([r, y]) => [Math.max(0, r), y]);
  if (areaConSigno(P) < 0) P = P.slice().reverse();
  const g = new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), seg, fase, arco);
  g.computeVertexNormals();
  return g;
}
/** Área con signo de la poligonal, cerrándola por donde haga falta. Positiva
 *  quiere decir recorrida en sentido antihorario en el plano (radio, altura),
 *  que es el sentido en que `LatheGeometry` saca las normales hacia fuera. */
function areaConSigno(P) {
  let a = 0;
  for (let i = 0; i < P.length; i++) {
    const [x1, y1] = P[i], [x2, y2] = P[(i + 1) % P.length];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

/**
 * Pieza extruida a partir de su contorno, que es como se describe cualquier
 * cosa cortada de una plancha o sacada de un molde: una biela, una mordaza, una
 * escuadra, un piñón, una tapa.
 *
 * `contorno` es la lista de puntos [x,y] del borde exterior. `huecos` son
 * contornos cerrados que se restan: agujeros de tornillo, aligeramientos,
 * ventanas. El BISEL no es adorno —es lo que hace que una pieza se lea como
 * fundida y no como una calcomanía—, y por eso viene puesto por defecto.
 */
export function extruido(contorno, opts = {}) {
  const { huecos = [], espesor = 1, bisel = 0, biselSeg = 2, curvaSeg = 12 } = opts;
  const forma = contorno instanceof THREE.Shape ? contorno : aShape(contorno);
  for (const h of huecos) forma.holes.push(aPath(h));
  const g = new THREE.ExtrudeGeometry(forma, {
    depth: espesor - bisel * 2,
    bevelEnabled: bisel > 0,
    bevelThickness: bisel, bevelSize: bisel, bevelOffset: 0, bevelSegments: biselSeg,
    curveSegments: curvaSeg,
  });
  // El origen en el centro del espesor: el ensamble coloca las piezas por su
  // centro, y una pieza cuyo origen está en una cara se monta descentrada.
  g.translate(0, 0, -(espesor - bisel * 2) / 2);
  g.computeVertexNormals();
  return g;
}

/**
 * Reescala las UV de una geometria para que una textura la cubra `veces` veces.
 *
 * `ExtrudeGeometry` genera las UV en UNIDADES DEL MUNDO: una pieza de tres
 * unidades de ancho repite la textura tres veces, y con la proporcion cambiada
 * si no es cuadrada. Un grano fino de fundicion se convierte asi en grava, y no
 * hay forma de darse cuenta mirando el codigo —solo mirando la pieza.
 */
export function normalizaUV(geo, veces = 1) {
  geo.computeBoundingBox();
  const b = geo.boundingBox, uv = geo.attributes.uv;
  if (!uv) return geo;
  const w = Math.max(1e-6, b.max.x - b.min.x), h = Math.max(1e-6, b.max.y - b.min.y);
  const d = Math.max(w, h) / veces;
  for (let i = 0; i < uv.count; i++) uv.setXY(i, uv.getX(i) / d, uv.getY(i) / d);
  uv.needsUpdate = true;
  return geo;
}

function aShape(pts) {
  if (pts instanceof THREE.Shape) return pts;
  const s = new THREE.Shape();
  pts.forEach(([x, y], i) => (i ? s.lineTo(x, y) : s.moveTo(x, y)));
  s.closePath();
  return s;
}
function aPath(pts) {
  if (pts instanceof THREE.Path || pts instanceof THREE.Shape) return pts;
  const p = new THREE.Path();
  pts.forEach(([x, y], i) => (i ? p.lineTo(x, y) : p.moveTo(x, y)));
  p.closePath();
  return p;
}

/** Un círculo como contorno o como hueco. El caso más frecuente con diferencia. */
export function circulo(cx, cy, r, seg = 32) {
  const p = [];
  for (let i = 0; i < seg; i++) {
    const a = (i / seg) * Math.PI * 2;
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}

/** Un arco de circunferencia, para encadenar contornos que no son polígonos. */
export function arco(cx, cy, r, a0, a1, seg = 20) {
  const p = [];
  for (let i = 0; i <= seg; i++) {
    const a = a0 + (a1 - a0) * (i / seg);
    p.push([cx + Math.cos(a) * r, cy + Math.sin(a) * r]);
  }
  return p;
}

/**
 * Redondea las esquinas de un contorno poligonal.
 *
 * Una pieza fundida no tiene esquinas vivas: el molde no las suelta y la pieza
 * se rompe por ahí. Pasar el contorno por aquí antes de extruirlo es la
 * diferencia entre una pieza y una silueta recortada. `r` puede ser un número
 * —el mismo radio en todas— o una lista con el radio de cada vértice, que es lo
 * que hace falta cuando una pieza tiene un canto mecanizado y el resto fundido.
 */
export function contornoRedondeado(pts, r, seg = 6) {
  const n = pts.length, out = [];
  const R = i => (Array.isArray(r) ? r[i % r.length] : r);
  for (let i = 0; i < n; i++) {
    const a = pts[(i - 1 + n) % n], b = pts[i], c = pts[(i + 1) % n];
    const ri = R(i);
    if (!ri) { out.push(b.slice()); continue; }
    const v1 = [a[0] - b[0], a[1] - b[1]], v2 = [c[0] - b[0], c[1] - b[1]];
    const l1 = Math.hypot(v1[0], v1[1]), l2 = Math.hypot(v2[0], v2[1]);
    if (l1 < 1e-9 || l2 < 1e-9) { out.push(b.slice()); continue; }
    const u1 = [v1[0] / l1, v1[1] / l1], u2 = [v2[0] / l2, v2[1] / l2];
    // Un vértice que ya viene de un arco es casi recto, y redondear lo recto
    // sólo multiplica los puntos por siete. Se deja como está.
    if (u1[0] * u2[0] + u1[1] * u2[1] < -0.985) { out.push(b.slice()); continue; }
    // El corte no puede comerse más de la mitad de ninguno de los dos lados, o
    // el redondeo de una esquina se solapa con el de la siguiente y el contorno
    // se cruza consigo mismo.
    const d = Math.min(ri, l1 / 2, l2 / 2);
    const p1 = [b[0] + u1[0] * d, b[1] + u1[1] * d];
    const p2 = [b[0] + u2[0] * d, b[1] + u2[1] * d];
    for (let k = 0; k <= seg; k++) {
      const t = k / seg, s = 1 - t;
      out.push([s * s * p1[0] + 2 * s * t * b[0] + t * t * p2[0],
                s * s * p1[1] + 2 * s * t * b[1] + t * t * p2[1]]);
    }
  }
  return out;
}

/* ==========================================================================
   §2 · RASGOS DE FABRICACIÓN
   Lo que distingue una pieza de un volumen: por dónde se atornilla, por dónde
   se refrigera, por dónde se agarra la llave.
   ========================================================================== */

/**
 * Tornillo de cabeza hexagonal, con su arandela y su vástago. El hexágono
 * importa: es lo que dice de un vistazo que ahí va una llave, y una cabeza
 * cilíndrica no lo dice.
 */
export function tornilloHex(mat, opts = {}) {
  const { d = 0.05, largo = 0.14, cabeza = 0.9, arandela = true } = opts;
  const g = new THREE.Group();
  const rc = d * 0.95;
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(rc, rc, d * cabeza, 6), mat.acero);
  cab.position.y = d * cabeza / 2;
  g.add(cab);
  if (arandela) {
    const ar = new THREE.Mesh(new THREE.CylinderGeometry(rc * 1.25, rc * 1.25, d * 0.16, 18), mat.acero);
    ar.position.y = d * 0.08; g.add(ar);
  }
  const vas = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.5, d * 0.5, largo, 12), mat.acero);
  vas.position.y = -largo / 2; g.add(vas);
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  return g;
}

/** Una corona de tornillos: la brida de una tapa, de un buje, de una brida. */
export function corona(mat, opts = {}) {
  const { r = 1, n = 6, d = 0.05, largo = 0.12, y = 0, fase = 0, eje = 'y' } = opts;
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = fase + (i / n) * Math.PI * 2;
    const t = tornilloHex(mat, { d, largo });
    if (eje === 'y') t.position.set(Math.cos(a) * r, y, Math.sin(a) * r);
    else { t.position.set(y, Math.cos(a) * r, Math.sin(a) * r); t.rotation.z = -Math.PI / 2; }
    g.add(t);
  }
  return g;
}

/**
 * Aletas de refrigeración: un paquete de discos o de placas finas separadas.
 * Es el rasgo que hace que un cilindro de motocicleta, un radiador de aceite o
 * la carcasa de un motor eléctrico se reconozcan al instante.
 */
export function aletas(mat, opts = {}) {
  const { r = 0.5, rInt = 0.35, n = 8, paso = 0.09, espesor = 0.022, seg = 32 } = opts;
  const g = new THREE.Group();
  for (let i = 0; i < n; i++) {
    const a = new THREE.Mesh(
      revolucion([[rInt, 0], [r, 0], [r, espesor], [rInt, espesor]], { seg }), mat.aluminio);
    a.position.y = (i - (n - 1) / 2) * paso;
    a.castShadow = true; g.add(a);
  }
  return g;
}

/**
 * Rosca: una hélice de sección triangular alrededor del vástago. No es una
 * rosca de verdad —no hay flancos ni fondo—, pero a la distancia a la que se
 * mira una pieza en estos laboratorios hace exactamente el trabajo de una: dice
 * «esto se enrosca». Una bujía sin rosca visible no es una bujía.
 */
export function rosca(mat, opts = {}) {
  const { r = 0.06, paso = 0.02, vueltas = 8, grueso = 0.008, seg = 16 } = opts;
  const pts = [];
  const total = Math.max(2, Math.round(vueltas * seg));
  for (let i = 0; i <= total; i++) {
    const t = i / seg;
    pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 2) * r,
                               t * paso,
                               Math.sin(t * Math.PI * 2) * r));
  }
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), total, grueso, 6, false), mat.acero);
  m.position.y = -vueltas * paso / 2;
  m.castShadow = true;
  return m;
}

/**
 * Engrane cilíndrico de dientes rectos, con perfil de EVOLVENTE de verdad.
 *
 * Se podría dibujar un diente trapezoidal y nadie se quejaría, pero entonces dos
 * engranes de módulos distintos encajarían igual de bien —que es justamente lo
 * que un alumno de transmisiones tiene que aprender que NO pasa—. Con la
 * evolvente, el número de dientes y el módulo mandan sobre la forma, como en el
 * taller: `z` dientes y módulo `m` dan un primitivo de z·m/2 y punto.
 */
export function engrane(opts = {}) {
  const { z = 20, m = 0.1, ancho = 0.2, angulo = 20 * Math.PI / 180, seg = 6 } = opts;
  const rp = z * m / 2;                    // primitivo
  const rb = rp * Math.cos(angulo);        // base
  const ra = rp + m;                       // cabeza
  const rf = rp - 1.25 * m;                // pie
  const inv = a => Math.tan(a) - a;
  const tBase = inv(angulo);
  // Medio hueco angular en el primitivo, que es lo que centra el diente.
  const medio = Math.PI / (2 * z) + tBase;
  const flanco = [];
  for (let i = 0; i <= seg; i++) {
    const r = rb + (ra - rb) * (i / seg);
    const a = Math.acos(Math.min(1, rb / r));
    flanco.push([r, medio - inv(a)]);
  }
  const pts = [];
  for (let d = 0; d < z; d++) {
    const g0 = (d / z) * Math.PI * 2;
    // Pie -> flanco de subida -> cabeza -> flanco de bajada -> pie.
    pts.push([Math.cos(g0 - medio) * rf, Math.sin(g0 - medio) * rf]);
    for (const [r, a] of flanco) pts.push([Math.cos(g0 - a) * r, Math.sin(g0 - a) * r]);
    for (let i = flanco.length - 1; i >= 0; i--) {
      const [r, a] = flanco[i];
      pts.push([Math.cos(g0 + a) * r, Math.sin(g0 + a) * r]);
    }
    pts.push([Math.cos(g0 + medio) * rf, Math.sin(g0 + medio) * rf]);
  }
  return { contorno: pts, rp, ra, rf, geo: espesorDe(pts, ancho) };
}
function espesorDe(pts, ancho) {
  return extruido(pts, { espesor: ancho, bisel: Math.min(0.012, ancho * 0.08), curvaSeg: 4 });
}

/**
 * Cremallera: el otro miembro del par piñón-cremallera. Misma regla, el módulo
 * manda: los dientes de una cremallera de módulo m son trapecios de paso π·m y
 * flancos al ángulo de presión, y por eso engranan con CUALQUIER piñón de ese
 * módulo y con ninguno de otro.
 */
export function cremallera(opts = {}) {
  const { z = 10, m = 0.1, alto = 0.28, ancho = 0.2, angulo = 20 * Math.PI / 180 } = opts;
  const paso = Math.PI * m, ha = m, hf = 1.25 * m;
  const t = Math.tan(angulo);
  const pts = [[-z * paso / 2, -alto]];
  for (let i = 0; i < z; i++) {
    const x = -z * paso / 2 + i * paso;
    pts.push([x, 0 - hf]);
    pts.push([x + paso * 0.25 - t * (ha + hf), 0 - hf]);
    pts.push([x + paso * 0.25 + t * 0, ha]);
    pts.push([x + paso * 0.5, ha]);
    pts.push([x + paso * 0.75 + t * (ha + hf), -hf]);
    pts.push([x + paso, -hf]);
  }
  pts.push([z * paso / 2, -alto]);
  return { contorno: pts, geo: extruido(pts, { espesor: ancho, bisel: 0.01, curvaSeg: 2 }) };
}

/* ==========================================================================
   §3 · PIEZAS DEL MOTOR
   Todas piden un diccionario `mat` con, al menos: aluminio, acero, hierro,
   cromo, negro. El laboratorio los pone; la biblioteca no inventa materiales.
   ========================================================================== */

/**
 * PISTÓN. La cota que manda es el diámetro `D`; todo lo demás va en
 * proporción, que es como se dimensiona de verdad.
 *
 * Lleva las cuatro cosas por las que un pistón es un pistón y un cilindro no:
 *   · la CABEZA, con su plato y su canto vivo;
 *   · las tres RANURAS DE SEGMENTOS, dos de compresión y una de engrase, con
 *     sus segmentos puestos —el de engrase es más ancho y va más abajo;
 *   · el ALOJAMIENTO DEL BULÓN, que es el agujero transversal por donde entra
 *     el pasador que lo une a la biela;
 *   · la FALDA, que no es un tubo: está recortada por los lados para dejar sitio
 *     a los contrapesos del cigüeñal, y por eso un pistón visto de frente y
 *     visto de perfil no se parecen.
 */
export function piston(mat, opts = {}) {
  const { D = 0.6, seg = 40, bulon = true } = opts;
  const g = new THREE.Group();
  const R = D / 2, H = D * 0.92;
  const yc = H * 0.5;                       // cara de la cabeza
  const rSeg = R * 0.965;                   // fondo de las ranuras
  // Perfil de la cabeza, las tres ranuras y la falda. Los puntos repetidos son
  // los cantos vivos: el del plato y los dos de cada ranura.
  const p = [];
  p.push([0, yc], [R * 0.86, yc]);                       // plato con su valle
  p.push([R, yc - D * 0.03], [R, yc - D * 0.03]);        // canto de la cabeza
  let y = yc - D * 0.10;
  for (const [ancho, hueco] of [[0.045, 1], [0.045, 1], [0.062, 1]]) {
    p.push([R, y], [rSeg, y], [rSeg, y - D * ancho], [R, y - D * ancho], [R, y - D * ancho]);
    y -= D * (ancho + 0.055) * hueco;
  }
  // El escalón entre la zona de segmentos y la falda: dos décimas de milímetro
  // en un pistón de verdad, aquí exagerado para que se vea que están a
  // diámetros distintos.
  p.push([R, y + D * 0.010], [R * 0.972, y - D * 0.004], [R * 0.972, -H * 0.42],
         [R * 0.955, -H * 0.5]);
  // Y de vuelta por DENTRO: el hueco de la falda, que es donde va el pie de la
  // biela. Un pistón macizo no deja sitio para la biela, y eso ya no es una
  // simplificación: es enseñar una pieza que no podría funcionar.
  p.push([R * 0.68, -H * 0.5], [R * 0.68, yc - D * 0.34], [0, yc - D * 0.34]);
  const cuerpo = new THREE.Mesh(revolucion(p, { seg }), mat.aluminio);
  cuerpo.castShadow = true; g.add(cuerpo);
  // Los tres segmentos, metidos en sus ranuras. Se ven porque son de otro
  // material: son de fundición y el pistón es de aluminio.
  let ys = yc - D * 0.125;
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.995, D * (i === 2 ? 0.026 : 0.020), 8, seg), mat.hierro);
    s.rotation.x = Math.PI / 2; s.position.y = ys; g.add(s);
    ys -= D * (i === 1 ? 0.117 : 0.100);
  }
  // Los dos ALIVIOS de la falda: en un pistón de verdad la falda está recortada
  // por los lados del bulón para dejar pasar el contrapeso del cigüeñal, y por
  // eso un pistón visto de frente y visto de perfil no se parecen. Sin CSG no se
  // puede restar, así que se marcan con dos rebajes pegados por fuera.
  for (const s of [1, -1]) {
    const al = new THREE.Mesh(
      revolucion([[R * 0.80, -H * 0.50], [R * 0.955, -H * 0.50],
                  [R * 0.955, -H * 0.14], [R * 0.80, -H * 0.10]],
        { seg: 20, fase: (s > 0 ? -0.44 : Math.PI - 0.44), arco: 0.88 }), mat.negro || mat.hierro);
    g.add(al);
  }
  if (bulon) {
    const b = new THREE.Mesh(
      new THREE.CylinderGeometry(D * 0.115, D * 0.115, D * 0.80, 20, 1, true), mat.acero);
    b.rotation.x = Math.PI / 2; b.position.y = -D * 0.22; g.add(b);
  }
  g.userData.alturaBulon = -D * 0.22;
  g.userData.D = D;
  return g;
}

/**
 * BIELA. Un perfil recortado y extruido, que es exactamente como se hace: se
 * forja y se mecaniza. Lleva pie, cuerpo con su alma en doble T, cabeza,
 * sombrerete partido por su plano y los dos tornillos que lo cierran. Lo de que
 * la cabeza esté PARTIDA no es un adorno: es la razón de que una biela se pueda
 * montar en un cigüeñal de una pieza.
 */
export function biela(mat, opts = {}) {
  const { largo = 1.0, dPie = 0.14, dCabeza = 0.26, espesor = 0.10 } = opts;
  const g = new THREE.Group();
  const rp = dPie / 2 * 1.55, rc = dCabeza / 2 * 1.32;
  const w = espesor * 0.62;                 // media anchura del alma
  // Contorno: ojo del pie, estrechamiento, ojo de la cabeza. Con las esquinas
  // redondeadas, porque una biela forjada no tiene cantos.
  const c = [];
  c.push(...arco(0, largo, rp, -Math.PI * 0.14, Math.PI * 1.14, 18));
  c.push([-w * 1.7, largo * 0.70], [-w, largo * 0.26]);
  c.push(...arco(0, 0, rc, Math.PI * 0.86, Math.PI * 2.14, 26));
  c.push([w, largo * 0.26], [w * 1.7, largo * 0.70]);
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado(c, 0.012, 3), {
    huecos: [circulo(0, largo, dPie / 2, 20), circulo(0, 0, dCabeza / 2, 26)],
    espesor, bisel: espesor * 0.10,
  }), mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  // El sombrerete y sus dos tornillos, por debajo del plano de partición.
  const somb = new THREE.Mesh(extruido(
    contornoRedondeado([[-rc * 1.05, -0.02], [rc * 1.05, -0.02],
                        [rc * 0.92, -rc * 0.95], [-rc * 0.92, -rc * 0.95]], 0.02, 3),
    { huecos: [circulo(0, 0, dCabeza / 2, 26)], espesor: espesor * 0.98, bisel: espesor * 0.08 }),
    mat.acero);
  somb.castShadow = true; g.add(somb);
  for (const s of [1, -1]) {
    const t = tornilloHex(mat, { d: espesor * 0.34, largo: rc * 0.9, arandela: false });
    t.position.set(s * rc * 0.78, -rc * 0.86, 0); t.rotation.x = Math.PI;
    g.add(t);
  }
  g.userData.largo = largo;
  return g;
}

/**
 * CIGÜEÑAL de N muñequillas. Lo que lo hace un cigüeñal y no un eje es que las
 * muñequillas están DESCENTRADAS: ahí es donde el empuje del pistón se
 * convierte en par, y el radio de ese descentrado es media carrera. Los
 * contrapesos son de riñón y van enfrentados a su muñequilla, que es lo que
 * equilibra el conjunto.
 *
 * Devuelve, en `userData.muñequillas`, la posición y el ángulo de cada una: el
 * laboratorio que anima el motor necesita justo eso y no debería recalcularlo.
 */
export function ciguenal(mat, opts = {}) {
  const { n = 4, paso = 0.64, carrera = 0.5, dApoyo = 0.28, dMuneq = 0.22,
          angulos = null, volante = true } = opts;
  const g = new THREE.Group();
  const r = carrera / 2, L = n * paso;
  const ang = angulos || [0, Math.PI, Math.PI, 0].slice(0, n);
  const brazo = dApoyo * 1.28;
  const muñequillas = [];
  // Eje de apoyos: un tramo entre cada dos manivelas, más los dos extremos.
  for (let i = 0; i <= n; i++) {
    const ap = new THREE.Mesh(
      new THREE.CylinderGeometry(dApoyo / 2, dApoyo / 2, paso * 0.30, 24), mat.acero);
    ap.rotation.z = Math.PI / 2;
    ap.position.x = -L / 2 + i * paso;
    ap.castShadow = true; g.add(ap);
  }
  for (let i = 0; i < n; i++) {
    const x = -L / 2 + (i + 0.5) * paso, a = ang[i];
    const dy = Math.cos(a) * r, dz = Math.sin(a) * r;
    // La muñequilla.
    const mu = new THREE.Mesh(
      new THREE.CylinderGeometry(dMuneq / 2, dMuneq / 2, paso * 0.40, 22), mat.acero);
    mu.rotation.z = Math.PI / 2; mu.position.set(x, dy, dz);
    mu.castShadow = true; g.add(mu);
    muñequillas.push({ x, y: dy, z: dz, ang: a });
    // Los dos brazos de manivela, con su contrapeso de riñón al otro lado.
    for (const s of [-1, 1]) {
      const c = contornoRedondeado([
        [-brazo * 0.62, -brazo * 0.35], [brazo * 0.62, -brazo * 0.35],
        [brazo * 0.92, brazo * 0.30], [brazo * 0.55, brazo * 1.05],
        [-brazo * 0.55, brazo * 1.05], [-brazo * 0.92, brazo * 0.30],
      ], brazo * 0.22, 4);
      const br = new THREE.Mesh(extruido(c, { espesor: paso * 0.22, bisel: paso * 0.02 }), mat.acero);
      br.rotation.y = Math.PI / 2;
      // El contrapeso mira al lado CONTRARIO de la muñequilla: si mirase al
      // mismo lado no equilibraría nada, sumaría.
      br.rotation.x = a + Math.PI;
      br.position.set(x + s * paso * 0.33, 0, 0);
      br.castShadow = true; g.add(br);
    }
  }
  // Nariz para la polea y brida del volante, que son los dos extremos por los
  // que un cigüeñal se conecta con el resto del coche.
  const nariz = new THREE.Mesh(
    new THREE.CylinderGeometry(dApoyo * 0.34, dApoyo * 0.34, paso * 0.55, 18), mat.acero);
  nariz.rotation.z = Math.PI / 2; nariz.position.x = -L / 2 - paso * 0.32;
  g.add(nariz);
  if (volante) {
    const vol = new THREE.Mesh(revolucion([
      [0, 0], [dApoyo * 1.9, 0], [dApoyo * 1.9, 0.03], [dApoyo * 2.05, 0.03],
      [dApoyo * 2.05, 0.10], [dApoyo * 1.9, 0.10], [dApoyo * 1.9, 0.13], [0, 0.13],
    ], { seg: 40 }), mat.hierro);
    vol.rotation.z = Math.PI / 2; vol.position.x = L / 2 + paso * 0.20;
    vol.castShadow = true; g.add(vol);
  }
  g.userData.muñequillas = muñequillas;
  g.userData.largo = L;
  return g;
}

/**
 * VÁLVULA de asiento. El detalle que importa es el CHAFLÁN de 45° de la cabeza:
 * ahí es donde sella, y es la única superficie de la pieza que se rectifica.
 * Debajo van el vástago y la garganta de los semiconos, que es por donde la
 * sujeta el plato del muelle.
 */
export function valvula(mat, opts = {}) {
  const { d = 0.20, largo = 0.62, vastago = 0.05 } = opts;
  const R = d / 2, rv = vastago / 2;
  const p = [
    [0, 0], [R * 0.90, 0], [R, R * 0.16], [R, R * 0.16],   // plato y canto
    [R * 0.62, R * 0.50],                                   // el chaflán del asiento
    [rv, R * 0.92], [rv, largo - R * 0.72],
    [rv * 0.78, largo - R * 0.60], [rv * 0.78, largo - R * 0.42], // garganta
    [rv, largo - R * 0.30], [rv, largo], [0, largo],
  ];
  const m = new THREE.Mesh(revolucion(p, { seg: 30 }), mat.acero);
  m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData.largo = largo; g.userData.d = d;
  return g;
}

/**
 * MUELLE de válvula: una hélice de verdad, no un cilindro. Se ve comprimirse, y
 * ver cómo se comprime es la mitad de entender por qué un motor tiene un régimen
 * máximo.
 */
export function muelle(mat, opts = {}) {
  const { r = 0.09, largo = 0.34, vueltas = 6, hilo = 0.014, seg = 14 } = opts;
  const pts = [];
  const total = Math.round(vueltas * seg);
  for (let i = 0; i <= total; i++) {
    const t = i / seg;
    pts.push(new THREE.Vector3(Math.cos(t * Math.PI * 2) * r,
                               (i / total) * largo - largo / 2,
                               Math.sin(t * Math.PI * 2) * r));
  }
  const m = new THREE.Mesh(
    new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), total, hilo, 6, false), mat.acero);
  m.castShadow = true;
  return m;
}

/**
 * ÁRBOL DE LEVAS. La leva no es un óvalo: es un círculo base con una nariz, y la
 * diferencia entre el radio de la nariz y el del círculo base ES el alzado de la
 * válvula. Dibujarla como una elipse pierde justo eso, que es lo único que hay
 * que entender de un árbol de levas.
 */
export function arbolLevas(mat, opts = {}) {
  const { n = 8, paso = 0.32, dEje = 0.13, rBase = 0.10, alzado = 0.055,
          angulos = null, ancho = 0.09 } = opts;
  const g = new THREE.Group();
  const L = n * paso;
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(dEje / 2, dEje / 2, L + paso, 20), mat.acero);
  eje.rotation.z = Math.PI / 2; eje.castShadow = true; g.add(eje);
  for (let i = 0; i < n; i++) {
    const a0 = angulos ? angulos[i] : (i / n) * Math.PI * 2;
    // Círculo base en casi toda la vuelta, y una nariz suave en unos 100°.
    const c = [];
    const rN = rBase + alzado, abre = Math.PI * 0.56;
    for (let k = 0; k <= 72; k++) {
      const t = (k / 72) * Math.PI * 2;
      const d = Math.abs(((t - a0 + Math.PI * 3) % (Math.PI * 2)) - Math.PI);
      // Fuera del sector de apertura, radio base clavado; dentro, una subida
      // suave y simétrica hasta la nariz.
      const u = d > abre ? 0 : 0.5 * (1 + Math.cos((d / abre) * Math.PI));
      const r = rBase + alzado * u * u * (3 - 2 * u) / 1;
      c.push([Math.cos(t) * Math.min(r, rN), Math.sin(t) * Math.min(r, rN)]);
    }
    const leva = new THREE.Mesh(
      extruido(c, { espesor: ancho, bisel: ancho * 0.10, curvaSeg: 2 }), mat.acero);
    leva.rotation.y = Math.PI / 2;
    leva.position.x = -L / 2 + (i + 0.5) * paso;
    leva.castShadow = true; g.add(leva);
  }
  g.userData.largo = L;
  return g;
}

/**
 * BUJÍA. Hexágono de la llave, aislador de porcelana con sus corrugas, cuerpo
 * roscado y electrodo de masa doblado sobre el central. Las corrugas del
 * aislador no son decoración: alargan el camino de fuga para que los 25 kV no se
 * vayan por fuera en vez de saltar en la punta.
 */
export function bujia(mat, opts = {}) {
  const { d = 0.09, largo = 0.46 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  // Aislador: cuerpo cónico con cuatro corrugas.
  const p = [[0, largo * 0.52], [R * 0.62, largo * 0.52], [R * 0.62, largo * 0.34]];
  for (let i = 0; i < 4; i++) {
    const y = largo * (0.30 - i * 0.055);
    p.push([R * 0.86, y], [R * 0.86, y], [R * 0.62, y - largo * 0.028], [R * 0.62, y - largo * 0.028]);
  }
  p.push([R * 0.70, largo * 0.06], [R * 0.70, largo * 0.04]);
  const ais = new THREE.Mesh(revolucion(p, { seg: 26 }), mat.ceramica || mat.blanco || mat.aluminio);
  ais.castShadow = true; g.add(ais);
  const hex = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.05, R * 1.05, largo * 0.13, 6), mat.acero);
  hex.position.y = largo * 0.0; g.add(hex);
  const cuerpo = new THREE.Mesh(
    revolucion([[0, -largo * 0.30], [R * 0.80, -largo * 0.30], [R * 0.80, -largo * 0.06],
                [R * 1.02, -largo * 0.06], [R * 1.02, -largo * 0.02], [0, -largo * 0.02]],
      { seg: 22 }), mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  const rs = rosca(mat, { r: R * 0.83, paso: largo * 0.035, vueltas: 7, grueso: largo * 0.014 });
  rs.position.y = -largo * 0.17; g.add(rs);
  // Electrodo central y electrodo de masa, con su hueco entre los dos: la
  // chispa salta ahí y en ningún otro sitio. El electrodo central lleva material
  // PROPIO —clonado, no compartido— porque quien encienda una bujía va a
  // encenderla poniéndole emisivo a su material, y con el material compartido se
  // encenderían las cuatro a la vez.
  const cen = new THREE.Mesh(
    new THREE.CylinderGeometry(R * 0.10, R * 0.10, largo * 0.10, 10), mat.acero.clone());
  cen.position.y = -largo * 0.34; g.add(cen);
  g.userData.chispa = cen;
  const masa = new THREE.Mesh(
    new THREE.TorusGeometry(R * 0.55, R * 0.09, 6, 12, Math.PI * 0.62), mat.acero);
  masa.rotation.y = Math.PI / 2; masa.rotation.z = -Math.PI * 0.31;
  masa.position.y = -largo * 0.31; g.add(masa);
  g.userData.puntaY = -largo * 0.40;
  return g;
}

/**
 * INYECTOR. Conector eléctrico arriba, cuerpo con su junta tórica, y tobera
 * abajo. La junta importa: es lo que se seca y lo que hace que un inyector
 * gotee, y en un despiece tiene que verse.
 */
export function inyector(mat, opts = {}) {
  const { d = 0.10, largo = 0.44 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const cuerpo = new THREE.Mesh(revolucion([
    [0, largo * 0.50], [R * 0.92, largo * 0.50], [R * 0.92, largo * 0.30],
    [R, largo * 0.26], [R, -largo * 0.08], [R * 0.72, -largo * 0.14],
    [R * 0.72, -largo * 0.34], [R * 0.34, -largo * 0.46], [0, -largo * 0.50],
  ], { seg: 26 }), mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  const con = new THREE.Mesh(
    extruido(contornoRedondeado([[-R * 1.1, -R * 0.5], [R * 1.1, -R * 0.5],
                                 [R * 1.1, R * 0.5], [-R * 1.1, R * 0.5]], R * 0.25, 3),
      { espesor: R * 1.5, bisel: R * 0.08 }), mat.negro || mat.acero);
  con.position.y = largo * 0.56; g.add(con);
  for (let i = 0; i < 2; i++) {
    const or = new THREE.Mesh(new THREE.TorusGeometry(R * 0.80, R * 0.16, 8, 24), mat.goma || mat.negro);
    or.rotation.x = Math.PI / 2; or.position.y = -largo * (0.20 + i * 0.10);
    g.add(or);
  }
  g.userData.puntaY = -largo * 0.50;
  return g;
}

/* ==========================================================================
   §4 · PIEZAS DE FRENO
   ========================================================================== */

/**
 * DISCO DE FRENO VENTILADO. Dos pistas separadas por aletas radiales y unidas
 * por la campana. Que sea ventilado no es un detalle estético: es la razón de
 * que un disco aguante una bajada de puerto, y un cilindro liso enseña lo
 * contrario. `nAletas` sale del disco real; `perforado` le hace los taladros.
 */
export function discoFreno(mat, opts = {}) {
  const { dExt = 1.0, dInt = 0.56, espesor = 0.11, nAletas = 36,
          campana = true, perforado = 0, ranurado = 0 } = opts;
  const g = new THREE.Group();
  const Re = dExt / 2, Ri = dInt / 2, e = espesor, ep = e * 0.28;
  const pista = ([y0, y1]) => new THREE.Mesh(revolucion([
    [Ri, y0], [Re, y0], [Re, y0], [Re, y1], [Re, y1], [Ri, y1]], { seg: 64 }), mat.hierro);
  const a = pista([e / 2 - ep, e / 2]), b = pista([-e / 2, -e / 2 + ep]);
  a.castShadow = b.castShadow = true; g.add(a, b);
  // Las aletas de ventilación, entre las dos pistas. Son radiales y curvadas en
  // los discos buenos; aquí van rectas, que ya dice lo que hay que decir.
  for (let i = 0; i < nAletas; i++) {
    const ang = (i / nAletas) * Math.PI * 2;
    const al = new THREE.Mesh(
      new THREE.BoxGeometry((Re - Ri) * 0.86, e - ep * 2, dExt * 0.022), mat.hierro);
    al.position.set(Math.cos(ang) * (Ri + Re) / 2, 0, Math.sin(ang) * (Ri + Re) / 2);
    al.rotation.y = -ang;
    g.add(al);
  }
  if (campana) {
    const c = new THREE.Mesh(revolucion([
      [Ri * 0.42, -e / 2 - dExt * 0.10], [Ri, -e / 2 - dExt * 0.10],
      [Ri, e / 2], [Ri * 0.94, e / 2], [Ri * 0.94, -e / 2 - dExt * 0.07],
      [Ri * 0.42, -e / 2 - dExt * 0.07],
    ], { seg: 44 }), mat.hierro);
    c.castShadow = true; g.add(c);
    g.add(corona(mat, { r: Ri * 0.66, n: 5, d: dExt * 0.030, largo: dExt * 0.06,
                        y: -e / 2 - dExt * 0.10 }));
  }
  // Los taladros y las ranuras se marcan sobre la pista: no atraviesan, pero se
  // ven, que es para lo que están en un disco de calle.
  for (let i = 0; i < perforado; i++) {
    const ang = (i / perforado) * Math.PI * 2, rr = (Ri + Re) / 2;
    for (const s of [1, -1]) {
      const h = new THREE.Mesh(
        new THREE.CylinderGeometry(dExt * 0.016, dExt * 0.016, ep * 1.2, 10), mat.negro || mat.hierro);
      h.position.set(Math.cos(ang) * rr, s * (e / 2 - ep / 2), Math.sin(ang) * rr);
      g.add(h);
    }
  }
  for (let i = 0; i < ranurado; i++) {
    const ang = (i / ranurado) * Math.PI * 2;
    for (const s of [1, -1]) {
      const r = new THREE.Mesh(
        new THREE.BoxGeometry((Re - Ri) * 0.80, ep * 0.5, dExt * 0.014), mat.negro || mat.hierro);
      r.position.set(Math.cos(ang) * (Ri + Re) / 2, s * (e / 2 - ep * 0.25),
                     Math.sin(ang) * (Ri + Re) / 2);
      r.rotation.y = -ang + 0.22;
      g.add(r);
    }
  }
  g.userData.dExt = dExt; g.userData.espesor = espesor;
  return g;
}

/**
 * MORDAZA flotante con sus pastillas. El cuerpo abraza el disco por fuera —de
 * ahí la forma de C, que es lo que hay que reconocer— y los pistones empujan
 * sólo por dentro: la pastilla de fuera aprieta porque la mordaza se desliza,
 * que es precisamente lo que se le agarrota a una mordaza vieja.
 */
export function mordaza(mat, opts = {}) {
  const { dDisco = 1.0, espesorDisco = 0.11, ancho = 0.30, nPistones = 2, sangrador = true } = opts;
  const g = new THREE.Group();
  const Re = dDisco / 2;
  const alto = dDisco * 0.30, hueco = espesorDisco * 1.9;
  const brazo = dDisco * 0.055;
  // La C, dibujada en el plano que corta el disco y extruida a lo ancho.
  const c = contornoRedondeado([
    [-hueco / 2 - brazo, -alto / 2], [hueco / 2 + brazo, -alto / 2],
    [hueco / 2 + brazo, alto / 2], [hueco / 2, alto / 2],
    [hueco / 2, -alto / 2 + brazo * 1.5], [-hueco / 2, -alto / 2 + brazo * 1.5],
    [-hueco / 2, alto / 2], [-hueco / 2 - brazo, alto / 2],
  ], brazo * 0.30, 3);
  const cuerpo = new THREE.Mesh(extruido(c, { espesor: ancho, bisel: brazo * 0.18 }), mat.aluminio);
  cuerpo.rotation.y = Math.PI / 2;
  cuerpo.castShadow = true; g.add(cuerpo);
  // Las dos pastillas, una a cada lado del disco, con su soporte de chapa.
  for (const s of [1, -1]) {
    const pas = new THREE.Mesh(
      new THREE.BoxGeometry(ancho * 0.86, alto * 0.52, espesorDisco * 0.42), mat.friccion || mat.negro);
    pas.position.set(0, -alto * 0.06, s * (espesorDisco / 2 + espesorDisco * 0.24));
    pas.castShadow = true; g.add(pas);
    const sop = new THREE.Mesh(
      new THREE.BoxGeometry(ancho * 0.92, alto * 0.56, espesorDisco * 0.12), mat.acero);
    sop.position.set(0, -alto * 0.06, s * (espesorDisco / 2 + espesorDisco * 0.51));
    g.add(sop);
  }
  // Los pistones, sólo en el lado de dentro. Es lo que la hace FLOTANTE.
  for (let i = 0; i < nPistones; i++) {
    const x = nPistones === 1 ? 0 : (-0.5 + i / (nPistones - 1)) * ancho * 0.52;
    const p = new THREE.Mesh(revolucion([
      [0, 0], [dDisco * 0.075, 0], [dDisco * 0.075, espesorDisco * 0.52],
      [dDisco * 0.062, espesorDisco * 0.58], [0, espesorDisco * 0.58]], { seg: 22 }), mat.cromo || mat.acero);
    p.rotation.x = Math.PI / 2;
    p.position.set(x, -alto * 0.06, -(espesorDisco / 2 + espesorDisco * 0.30));
    g.add(p);
  }
  if (sangrador) {
    const s = new THREE.Mesh(
      new THREE.CylinderGeometry(dDisco * 0.016, dDisco * 0.022, dDisco * 0.075, 6), mat.acero);
    s.position.set(ancho * 0.30, alto * 0.46, 0); g.add(s);
  }
  g.userData.alto = alto;
  return g;
}

/* ==========================================================================
   §5 · PIEZAS ELÉCTRICAS Y DE CHASIS
   ========================================================================== */

/**
 * CARCASA de máquina eléctrica: tubo con aletas longitudinales, patas y caja de
 * bornes. Es la silueta por la que se reconoce un motor desde el otro lado del
 * taller.
 */
export function carcasaMotor(mat, opts = {}) {
  const { d = 0.6, largo = 0.9, nAletas = 16, patas = true, bornes = true } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const cu = new THREE.Mesh(new THREE.CylinderGeometry(R, R, largo, 40), mat.aluminio);
  cu.rotation.z = Math.PI / 2; cu.castShadow = true; g.add(cu);
  for (let i = 0; i < nAletas; i++) {
    const a = (i / nAletas) * Math.PI * 2;
    const al = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.94, d * 0.075, d * 0.030), mat.aluminio);
    al.position.set(0, Math.cos(a) * (R + d * 0.030), Math.sin(a) * (R + d * 0.030));
    al.rotation.x = -a; g.add(al);
  }
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(revolucion([
      [0, 0], [R * 0.98, 0], [R * 0.98, d * 0.05], [R * 0.72, d * 0.09], [0, d * 0.09]],
      { seg: 36 }), mat.aluminio);
    t.rotation.z = s * Math.PI / 2; t.position.x = s * largo / 2; g.add(t);
  }
  if (patas) for (const s of [-1, 1]) {
    const p = new THREE.Mesh(extruido(contornoRedondeado([
      [-largo * 0.20, 0], [largo * 0.20, 0], [largo * 0.20, -d * 0.16], [-largo * 0.20, -d * 0.16],
    ], d * 0.03, 3), { espesor: d * 0.16, bisel: d * 0.012 }), mat.aluminio);
    p.position.set(s * largo * 0.28, -R * 0.95, 0); g.add(p);
  }
  if (bornes) {
    const b = new THREE.Mesh(extruido(contornoRedondeado([
      [-largo * 0.13, -d * 0.10], [largo * 0.13, -d * 0.10],
      [largo * 0.13, d * 0.10], [-largo * 0.13, d * 0.10]], d * 0.03, 3),
      { espesor: d * 0.14, bisel: d * 0.012 }), mat.negro || mat.aluminio);
    b.rotation.x = Math.PI / 2; b.position.y = R + d * 0.075; g.add(b);
  }
  g.userData.d = d; g.userData.largo = largo;
  return g;
}

/**
 * POLEA de correa trapezoidal o poli-V, con sus gargantas de verdad. Una polea
 * lisa no dice por dónde va la correa; una con gargantas, sí.
 */
export function polea(mat, opts = {}) {
  const { d = 0.3, ancho = 0.12, gargantas = 5, dEje = 0.06 } = opts;
  const R = d / 2, p = ancho / gargantas;
  const perf = [[dEje / 2, -ancho / 2], [R * 0.55, -ancho / 2], [R * 0.55, -ancho / 2 + ancho * 0.18]];
  for (let i = 0; i < gargantas; i++) {
    const y = -ancho / 2 + i * p;
    perf.push([R, y], [R * 0.88, y + p * 0.5], [R, y + p]);
  }
  perf.push([R * 0.55, ancho / 2 - ancho * 0.18], [R * 0.55, ancho / 2], [dEje / 2, ancho / 2]);
  const m = new THREE.Mesh(revolucion(perf, { seg: 44 }), mat.acero);
  m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData.d = d;
  return g;
}

/**
 * CONECTOR de mazo: la caja con su clip y sus pines. En un laboratorio de
 * diagnóstico es la pieza que más se toca y la que peor estaba representada: un
 * cable que acaba en el aire no se puede desconectar, y desconectar es
 * justamente lo que se le pide al alumno.
 */
export function conector(mat, opts = {}) {
  const { ancho = 0.14, alto = 0.09, fondo = 0.07, pines = 4 } = opts;
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado([
    [-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2],
  ], alto * 0.18, 3), { espesor: fondo, bisel: alto * 0.04 }), mat.negro || mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  const clip = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.34, alto * 0.16, fondo * 0.8),
    mat.negro || mat.acero);
  clip.position.set(0, alto * 0.56, 0); g.add(clip);
  for (let i = 0; i < pines; i++) {
    const x = pines === 1 ? 0 : (-0.5 + i / (pines - 1)) * ancho * 0.62;
    const p = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.055, alto * 0.34, fondo * 0.9),
      mat.cobre || mat.acero);
    p.position.set(x, -alto * 0.05, fondo * 0.55); g.add(p);
  }
  return g;
}

/**
 * MANGUERA o latiguillo, de un punto a otro, con sus abrazaderas. Se le pasa la
 * lista de puntos por los que tiene que ir y ella hace la curva: un tubo recto
 * entre dos piezas se lee como una barra, no como una manguera.
 */
export function manguera(mat, opts = {}) {
  const { puntos = [], r = 0.02, seg = 40, abrazaderas = true } = opts;
  const g = new THREE.Group();
  if (puntos.length < 2) return g;
  const curva = new THREE.CatmullRomCurve3(puntos.map(p =>
    p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2])));
  const t = new THREE.Mesh(new THREE.TubeGeometry(curva, seg, r, 12, false), mat.goma || mat.negro);
  t.castShadow = true; g.add(t);
  if (abrazaderas) for (const u of [0.02, 0.98]) {
    const p = curva.getPointAt(u), d = curva.getTangentAt(u);
    const a = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.35, r * 1.35, r * 1.1, 16), mat.acero);
    a.position.copy(p);
    a.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.add(a);
  }
  return g;
}

/* ==========================================================================
   §6 · RUEDA, FRENO ELECTRÓNICO Y CAJAS DE MANDO
   ========================================================================== */

/**
 * NEUMÁTICO con su llanta. Un toro liso es una rosquilla: lo que hace que una
 * rueda se lea como una rueda son los TACOS del dibujo, el flanco con su hombro
 * y la llanta con sus radios y su pestaña. Y el dibujo no es adorno en un
 * laboratorio de ABS: la huella es de donde sale el rozamiento del que va todo.
 */
export function neumatico(mat, opts = {}) {
  const { dExt = 1.2, dLlanta = 0.66, ancho = 0.34, tacos = 28, radios = 5 } = opts;
  const g = new THREE.Group();
  const Re = dExt / 2, Rl = dLlanta / 2, a = ancho / 2;
  // El flanco: de la pestaña de la llanta al hombro, con la curva del flanco.
  const goma = new THREE.Mesh(revolucion([
    [Rl, -a * 0.86], [Rl * 1.06, -a * 0.94], [Re * 0.80, -a], [Re * 0.94, -a * 0.86],
    [Re, -a * 0.62], [Re, a * 0.62], [Re * 0.94, a * 0.86], [Re * 0.80, a],
    [Rl * 1.06, a * 0.94], [Rl, a * 0.86],
  ], { seg: 56 }), mat.goma || mat.negro);
  goma.rotation.z = Math.PI / 2; goma.castShadow = true; g.add(goma);
  // Los tacos, en dos hileras y al tresbolillo, que es como van.
  for (let i = 0; i < tacos; i++) {
    const ang = (i / tacos) * Math.PI * 2;
    for (const [k, z] of [[0, -0.30], [1, 0.30]]) {
      const t = new THREE.Mesh(
        new THREE.BoxGeometry(ancho * 0.34, dExt * 0.022, dExt * 0.055),
        mat.goma || mat.negro);
      const off = k ? Math.PI / tacos : 0;
      t.position.set(z * ancho, Math.cos(ang + off) * Re, Math.sin(ang + off) * Re);
      t.rotation.x = -(ang + off);
      g.add(t);
    }
  }
  // La llanta: aro con sus dos pestañas, plato y radios.
  const aro = new THREE.Mesh(revolucion([
    [Rl * 0.62, -a * 0.90], [Rl * 0.98, -a * 0.90], [Rl * 0.98, -a * 0.72],
    [Rl * 0.90, -a * 0.60], [Rl * 0.90, a * 0.60], [Rl * 0.98, a * 0.72],
    [Rl * 0.98, a * 0.90], [Rl * 0.62, a * 0.90],
  ], { seg: 48 }), mat.aluminio);
  aro.rotation.z = Math.PI / 2; aro.castShadow = true; g.add(aro);
  const plato = new THREE.Mesh(
    new THREE.CylinderGeometry(Rl * 0.34, Rl * 0.34, ancho * 0.30, 26), mat.aluminio);
  plato.rotation.z = Math.PI / 2; plato.position.x = -a * 0.34; g.add(plato);
  for (let i = 0; i < radios; i++) {
    const ang = (i / radios) * Math.PI * 2;
    const r = new THREE.Mesh(
      new THREE.BoxGeometry(ancho * 0.20, Rl * 0.62, dLlanta * 0.15), mat.aluminio);
    r.position.set(-a * 0.34, Math.cos(ang) * Rl * 0.62, Math.sin(ang) * Rl * 0.62);
    r.rotation.x = -ang; r.castShadow = true; g.add(r);
  }
  // Los cinco espárragos con sus tuercas: es por donde se quita una rueda.
  g.add(corona(mat, { r: Rl * 0.22, n: 5, d: dLlanta * 0.035, largo: ancho * 0.12,
                      y: -a * 0.50, eje: 'x' }));
  g.userData.dExt = dExt; g.userData.ancho = ancho;
  return g;
}

/**
 * RUEDA FÓNICA del ABS: la corona dentada que pasa por delante del captador. Los
 * dientes SON la señal —cada uno da un pulso, y la cuenta de pulsos por vuelta
 * fija la resolución del sistema—. Un aro liso no da ninguna señal, y dibujarlo
 * liso deja el laboratorio sin explicar de dónde sale la medida.
 */
export function ruedaFonica(mat, opts = {}) {
  const { d = 0.92, dientes = 48, alto = 0.05, ancho = 0.04 } = opts;
  const R = d / 2, c = [];
  for (let i = 0; i < dientes; i++) {
    const a0 = (i / dientes) * Math.PI * 2, p = Math.PI * 2 / dientes;
    for (const [t, r] of [[0, R], [p * 0.5, R], [p * 0.5, R - alto], [p, R - alto]]) {
      c.push([Math.cos(a0 + t) * r, Math.sin(a0 + t) * r]);
    }
  }
  const cor = new THREE.Mesh(extruido(c, { espesor: ancho, bisel: ancho * 0.10, curvaSeg: 2 }),
    mat.acero);
  cor.rotation.y = Math.PI / 2; cor.castShadow = true;
  const g = new THREE.Group(); g.add(cor);
  g.userData.dientes = dientes; g.userData.d = d;
  return g;
}

/**
 * CAPTADOR inductivo o de efecto Hall: cuerpo cilíndrico con brida de sujeción,
 * punta afinada y conector. Lo que hay que reconocer es que APUNTA a algo, y un
 * cilindro suelto no apunta a nada.
 */
export function captador(mat, opts = {}) {
  const { d = 0.09, largo = 0.30 } = opts;
  const g = new THREE.Group(); const R = d / 2;
  const cuerpo = new THREE.Mesh(revolucion([
    [0, -largo * 0.50], [R * 0.62, -largo * 0.50], [R * 0.62, -largo * 0.34],
    [R, -largo * 0.26], [R, largo * 0.30], [R * 0.86, largo * 0.36], [0, largo * 0.36],
  ], { seg: 22 }), mat.negro || mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  // La brida por la que se atornilla al soporte: sin ella el captador flota.
  const brida = new THREE.Mesh(extruido(contornoRedondeado(
    [[-R * 0.9, -R * 0.5], [R * 2.4, -R * 0.5], [R * 2.4, R * 0.5], [-R * 0.9, R * 0.5]], R * 0.4, 3),
    { huecos: [circulo(R * 1.7, 0, R * 0.42, 12)], espesor: R * 0.5, bisel: R * 0.06 }),
    mat.acero);
  brida.rotation.x = Math.PI / 2; brida.position.y = largo * 0.06; g.add(brida);
  const con = conector(mat, { ancho: d * 1.5, alto: d * 0.9, fondo: d * 0.8, pines: 2 });
  con.position.y = largo * 0.52; con.rotation.x = -Math.PI / 2; g.add(con);
  g.userData.puntaY = -largo * 0.50;
  return g;
}

/**
 * GRUPO HIDRÁULICO de ABS: el bloque de aluminio con sus electroválvulas
 * encima, el motor de la bomba de retorno a un lado y los racores de las
 * tuberías. Son tres cosas distintas y una caja gris no enseña ninguna: sin ver
 * las válvulas no se entiende qué modula, y sin ver la bomba no se entiende de
 * dónde vuelve el líquido que se libera.
 */
export function grupoABS(mat, opts = {}) {
  const { ancho = 0.56, alto = 0.34, fondo = 0.40, valvulas = 8, canales = 4 } = opts;
  const g = new THREE.Group();
  const bloque = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2]],
    alto * 0.10, 3), { espesor: fondo, bisel: alto * 0.03 }), 2), mat.aluminio);
  bloque.castShadow = true; g.add(bloque);
  // Las electroválvulas: una de admisión y una de escape por canal, en dos filas.
  for (let i = 0; i < valvulas; i++) {
    const f = i % 2, c = Math.floor(i / 2);
    const v = new THREE.Mesh(revolucion([
      [0, 0], [ancho * 0.042, 0], [ancho * 0.042, alto * 0.30],
      [ancho * 0.052, alto * 0.32], [ancho * 0.052, alto * 0.52],
      [ancho * 0.030, alto * 0.56], [0, alto * 0.56]], { seg: 18 }), mat.acero);
    v.position.set((c - (valvulas / 2 - 1) / 2) * ancho * 0.21, alto / 2,
                   (f - 0.5) * fondo * 0.42);
    g.add(v);
  }
  // El motor de la bomba de retorno, en el costado.
  const bomba = new THREE.Mesh(
    new THREE.CylinderGeometry(alto * 0.30, alto * 0.30, ancho * 0.30, 26), mat.negro || mat.acero);
  bomba.rotation.z = Math.PI / 2; bomba.position.set(-ancho * 0.62, -alto * 0.06, 0);
  bomba.castShadow = true; g.add(bomba);
  // Los racores de las tuberías, en la cara de abajo.
  for (let i = 0; i < canales; i++) {
    const r = new THREE.Mesh(
      new THREE.CylinderGeometry(ancho * 0.026, ancho * 0.032, alto * 0.22, 6), mat.acero);
    r.position.set((i - (canales - 1) / 2) * ancho * 0.20, -alto * 0.60, fondo * 0.10);
    g.add(r);
  }
  g.userData.ancho = ancho;
  return g;
}

/**
 * CAJA DE MANDO —una ECU, una centralita, un módulo—: carcasa de aluminio con
 * aletas de disipación, tapa y el conector del mazo. El conector es la mitad de
 * la pieza: es por donde se diagnostica y por donde se desenchufa, y en un
 * laboratorio de diagnóstico es justo lo que se le pide al alumno que haga.
 */
export function cajaMando(mat, opts = {}) {
  const { ancho = 0.5, alto = 0.30, fondo = 0.42, aletas: nAl = 9, pines = 8 } = opts;
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2]],
    alto * 0.13, 4), { espesor: fondo, bisel: alto * 0.035 }), 2), mat.aluminio);
  cuerpo.castShadow = true; g.add(cuerpo);
  for (let i = 0; i < nAl; i++) {
    const a = new THREE.Mesh(
      new THREE.BoxGeometry(ancho * 0.92, alto * 0.055, fondo * 0.30 / nAl * 3), mat.aluminio);
    a.position.set(0, alto / 2 + alto * 0.028, (i - (nAl - 1) / 2) * (fondo * 0.92 / nAl));
    g.add(a);
  }
  const tapa = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.96, alto * 0.05, fondo * 0.96),
    mat.negro || mat.acero);
  tapa.position.y = -alto / 2 - alto * 0.02; g.add(tapa);
  const con = conector(mat, { ancho: ancho * 0.52, alto: alto * 0.46, fondo: fondo * 0.22, pines });
  con.position.set(0, -alto * 0.10, fondo / 2 + fondo * 0.11);
  g.add(con);
  g.userData.conector = con;
  return g;
}
