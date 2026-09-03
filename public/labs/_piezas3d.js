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
/**
 * NORMALES SANAS —y esto no es una manía de limpieza, es un fallo que deja la
 * pantalla NEGRA—.
 *
 * `computeVertexNormals()` deja la normal en (0,0,0) en todo vértice que sólo
 * toca triángulos degenerados, y `ExtrudeGeometry` los fabrica a puñados en
 * cuanto el bisel de un contorno muy muestreado se pisa a sí mismo. Una normal
 * nula no salta a la vista: es finita, pasa cualquier prueba de `isFinite`, la
 * esfera envolvente sale bien y la caja de la pieza sale bien. Sólo estalla ya
 * dentro del sombreador, donde `normalize(vec3(0))` da NaN. Y un solo píxel NaN
 * se reparte por TODA la imagen en el desenfoque del bloom: la escena entera se
 * va a negro —plataforma, luces y demás piezas incluidas— sin un solo error en
 * consola. Se diagnostica en media hora larga; se evita aquí en diez líneas.
 */
export function sanaNormales(geo) {
  const n = geo.attributes.normal; if (!n) return geo;
  const p = geo.attributes.position; let malas = 0;
  for (let i = 0; i < n.count; i++) {
    const x = n.getX(i), y = n.getY(i), z = n.getZ(i);
    if (x * x + y * y + z * z > 1e-12) continue;
    malas++;
    // Se sustituye por la dirección radial del vértice, que en una pieza de
    // revolución o extruida es la normal correcta salvo en las tapas; y si el
    // vértice cae justo en el eje, por la normal de la tapa.
    const vx = p.getX(i), vy = p.getY(i), L = Math.hypot(vx, vy);
    if (L > 1e-6) n.setXYZ(i, vx / L, vy / L, 0); else n.setXYZ(i, 0, 0, 1);
  }
  if (malas) { n.needsUpdate = true; geo.userData.normalesReparadas = malas; }
  return geo;
}

export function revolucion(perfil, opts = {}) {
  const { seg = 48, fase = 0, arco = Math.PI * 2 } = opts;
  let P = perfil.map(([r, y]) => [Math.max(0, r), y]);
  if (areaConSigno(P) < 0) P = P.slice().reverse();
  const g = new THREE.LatheGeometry(P.map(([r, y]) => new THREE.Vector2(r, y)), seg, fase, arco);
  g.computeVertexNormals(); sanaNormales(g);
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
  g.computeVertexNormals(); sanaNormales(g);
  return g;
}

/**
 * CÁSCARA paramétrica con espesor: la forma de fabricar cualquier pieza de
 * CHAPA CURVA —un álabe, una garra de alternador, una teja de imán— que no sale
 * ni de un perfil de revolución ni de un contorno extruido.
 *
 * `f(u,v)` devuelve el punto [x,y,z] de la superficie media para u y v en [0,1].
 * A cada punto se le da espesor desplazándolo por la NORMAL de la superficie, y
 * se cierran los cuatro cantos: sin eso la pieza es una lámina de grosor cero,
 * que a contraluz desaparece y que ninguna sombra puede proyectar.
 */
export function cascara(f, opts = {}) {
  const { nu = 20, nv = 8, espesor = 0.02 } = opts;
  const pos = [], idx = [], h = 1e-3;
  const res = (A, B) => [A[0] - B[0], A[1] - B[1], A[2] - B[2]];
  const cru = (A, B) => [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2], A[0] * B[1] - A[1] * B[0]];
  const uni = (V) => { const L = Math.hypot(V[0], V[1], V[2]) || 1; return [V[0] / L, V[1] / L, V[2] / L]; };
  for (let i = 0; i <= nu; i++) for (let j = 0; j <= nv; j++) {
    const u = i / nu, v = j / nv, c = f(u, v);
    const du = res(f(Math.min(1, u + h), v), f(Math.max(0, u - h), v));
    const dv = res(f(u, Math.min(1, v + h)), f(u, Math.max(0, v - h)));
    const n = uni(cru(du, dv));
    for (const sg of [1, -1]) pos.push(c[0] + n[0] * sg * espesor / 2,
      c[1] + n[1] * sg * espesor / 2, c[2] + n[2] * sg * espesor / 2);
  }
  const V = (i, j, k) => (i * (nv + 1) + j) * 2 + k;
  for (let i = 0; i < nu; i++) for (let j = 0; j < nv; j++) {
    idx.push(V(i, j, 0), V(i, j + 1, 0), V(i + 1, j, 0), V(i, j + 1, 0), V(i + 1, j + 1, 0), V(i + 1, j, 0));
    idx.push(V(i, j, 1), V(i + 1, j, 1), V(i, j + 1, 1), V(i, j + 1, 1), V(i + 1, j, 1), V(i + 1, j + 1, 1));
  }
  for (let i = 0; i < nu; i++) {                       // los dos cantos en v
    idx.push(V(i, 0, 0), V(i + 1, 0, 0), V(i, 0, 1), V(i, 0, 1), V(i + 1, 0, 0), V(i + 1, 0, 1));
    idx.push(V(i, nv, 0), V(i, nv, 1), V(i + 1, nv, 0), V(i, nv, 1), V(i + 1, nv, 1), V(i + 1, nv, 0));
  }
  for (let j = 0; j < nv; j++) {                       // los dos cantos en u
    idx.push(V(0, j, 0), V(0, j, 1), V(0, j + 1, 0), V(0, j + 1, 0), V(0, j, 1), V(0, j + 1, 1));
    idx.push(V(nu, j, 0), V(nu, j + 1, 0), V(nu, j, 1), V(nu, j, 1), V(nu, j + 1, 0), V(nu, j + 1, 1));
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  g.setIndex(idx);
  g.computeVertexNormals(); sanaNormales(g);
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
    else if (eje === 'z') { t.position.set(Math.cos(a) * r, Math.sin(a) * r, y); t.rotation.x = Math.PI / 2; }
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
  /* `hCorona` es la ALTURA DE COMPRESIÓN: del eje del bulón a la cara de la
     cabeza. No es un detalle de dibujo —es la cota que, con la carrera y la
     biela, decide dónde queda el pistón en el PMS y por tanto la relación de
     compresión—, y va de 0,30 a 0,50 veces el diámetro según el motor. Sin
     poder fijarla, la pieza sólo servía para el motor para el que se dibujó.
     Cuando se da, el pistón se estira o se achata en vertical para cumplirla, y
     el BULÓN queda en el origen del grupo; sin ella se mantiene el reparto
     original (cabeza en +0,46·D) para no mover los laboratorios ya hechos. */
  const { D = 0.6, seg = 40, bulon = true, hCorona = null } = opts;
  const g = new THREE.Group();
  const k = hCorona ? hCorona / (D * 0.68) : 1;
  const R = D / 2, H = D * 0.92 * k;
  const yc = H * 0.5;                       // cara de la cabeza
  const rSeg = R * 0.965;                   // fondo de las ranuras
  // Perfil de la cabeza, las tres ranuras y la falda. Los puntos repetidos son
  // los cantos vivos: el del plato y los dos de cada ranura.
  const p = [];
  p.push([0, yc], [R * 0.86, yc]);                       // plato con su valle
  p.push([R, yc - D * 0.03 * k], [R, yc - D * 0.03 * k]);   // canto de la cabeza
  let y = yc - D * 0.10 * k;
  for (const [ancho, hueco] of [[0.045, 1], [0.045, 1], [0.062, 1]]) {
    p.push([R, y], [rSeg, y], [rSeg, y - D * ancho * k], [R, y - D * ancho * k],
           [R, y - D * ancho * k]);
    y -= D * (ancho + 0.055) * k * hueco;
  }
  // El escalón entre la zona de segmentos y la falda: dos décimas de milímetro
  // en un pistón de verdad, aquí exagerado para que se vea que están a
  // diámetros distintos.
  p.push([R, y + D * 0.010 * k], [R * 0.972, y - D * 0.004 * k], [R * 0.972, -H * 0.42],
         [R * 0.955, -H * 0.5]);
  // Y de vuelta por DENTRO: el hueco de la falda, que es donde va el pie de la
  // biela. Un pistón macizo no deja sitio para la biela, y eso ya no es una
  // simplificación: es enseñar una pieza que no podría funcionar.
  p.push([R * 0.68, -H * 0.5], [R * 0.68, yc - D * 0.34 * k], [0, yc - D * 0.34 * k]);
  const cuerpo = new THREE.Mesh(revolucion(p, { seg }), mat.aluminio);
  cuerpo.castShadow = true; g.add(cuerpo);
  // Los tres segmentos, metidos en sus ranuras. Se ven porque son de otro
  // material: son de fundición y el pistón es de aluminio.
  let ys = yc - D * 0.125 * k;
  for (let i = 0; i < 3; i++) {
    const s = new THREE.Mesh(
      new THREE.TorusGeometry(R * 0.995, D * (i === 2 ? 0.026 : 0.020) * Math.min(1, k), 8, seg),
      mat.hierro);
    s.rotation.x = Math.PI / 2; s.position.y = ys; g.add(s);
    ys -= D * (i === 1 ? 0.117 : 0.100) * k;
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
    b.rotation.x = Math.PI / 2; b.position.y = -D * 0.22 * k; g.add(b);
  }
  g.userData.alturaBulon = -D * 0.22 * k;
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
  /* `corte` abre la carcasa por un sector —{ini, arco} en radianes, medidos como
     los de THREE.CylinderGeometry— para poder ver lo que hay dentro; con él, las
     aletas se reparten sólo por la parte que queda de chapa, porque una aleta
     flotando sobre el hueco delata el truco. `tapas` se apaga cuando las tapas
     son piezas aparte, como en un laboratorio de montaje. */
  const { d = 0.6, largo = 0.9, nAletas = 16, patas = true, bornes = true,
          corte = null, tapas = true } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const ini = corte ? corte.ini : 0, arco = corte ? corte.arco : Math.PI * 2;
  const cu = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R, largo, 40, 1, !!corte, ini, arco), mat.aluminio);
  if (corte) { const m = cu.material.clone(); m.side = THREE.DoubleSide; cu.material = m; }
  cu.rotation.z = Math.PI / 2; cu.castShadow = true; g.add(cu);
  for (let i = 0; i < nAletas; i++) {
    const a = corte ? ini + (i / Math.max(1, nAletas - 1)) * arco
                    : (i / nAletas) * Math.PI * 2;
    const al = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.94, d * 0.075, d * 0.030), mat.aluminio);
    al.position.set(0, Math.cos(a) * (R + d * 0.030), Math.sin(a) * (R + d * 0.030));
    al.rotation.x = -a; g.add(al);
  }
  if (tapas) for (const s of [-1, 1]) {
    const t = new THREE.Mesh(revolucion([
      [0, 0], [R * 0.98, 0], [R * 0.98, d * 0.05], [R * 0.72, d * 0.09], [0, d * 0.09]],
      { seg: 36 }), mat.aluminio);
    t.rotation.z = s * Math.PI / 2; t.position.x = s * largo / 2; g.add(t);
  }
  if (corte) for (const s of [-1, 1]) {      // los dos aros de refuerzo del tubo
    const ar = new THREE.Mesh(
      new THREE.CylinderGeometry(R * 1.03, R * 1.03, d * 0.05, 40, 1, false, ini, arco),
      mat.aluminio);
    ar.rotation.z = Math.PI / 2; ar.position.x = s * (largo / 2 - d * 0.03); g.add(ar);
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

/* ==========================================================================
   §7 · MÁQUINAS ELÉCTRICAS
   ========================================================================== */

/**
 * NÚCLEO E–I laminado: el de un transformador pequeño y el de una bobina de
 * encendido. Se dibuja como lo que es, un montón de CHAPAS apiladas, y no como
 * un bloque macizo, porque el laminado no es un detalle de fabricación: cada
 * chapa corta las corrientes de Foucault que si no calentarían el hierro, y es
 * la razón de que un núcleo macizo del mismo tamaño se pusiera al rojo.
 *
 * La VENTANA es por donde pasa el devanado. El ENTREHIERRO entre la E y la I no
 * está en todos: en un transformador se busca que NO lo haya —cuanto menos
 * entrehierro, menos corriente de vacío—, y en una bobina de encendido se pone
 * a propósito, porque ahí es donde se almacena la energía que luego sale por la
 * chispa. La misma pieza, con el hueco o sin él, dice de qué máquina se trata.
 *
 * Las chapas se apilan en Z; la cara de la E mira a ±Z. `userData.brazo` da el
 * centro y las cotas del brazo central, que es donde se enrolla la bobina.
 */
export function nucleoEI(mat, opts = {}) {
  const { ancho = 0.30, alto = 0.34, prof = 0.14, chapas = 8,
          entrehierro = 0, cierre = true } = opts;
  const g = new THREE.Group();
  const t = ancho * 0.26;                    // lomo de la E y espesor de la I
  const b = alto * 0.24;                     // espesor de los tres brazos
  const E = [
    [0, 0], [ancho, 0], [ancho, b], [t, b],
    [t, alto / 2 - b / 2], [ancho, alto / 2 - b / 2],
    [ancho, alto / 2 + b / 2], [t, alto / 2 + b / 2],
    [t, alto - b], [ancho, alto - b], [ancho, alto], [0, alto],
  ];
  const xI = ancho + entrehierro;
  const I = [[xI, 0], [xI + t, 0], [xI + t, alto], [xI, alto]];
  const e = prof / chapas;
  const mch = mat.chapa || mat.hierro || mat.acero;
  for (let i = 0; i < chapas; i++) {
    const z = -prof / 2 + e * (i + 0.5);
    const a = new THREE.Mesh(extruido(E, { espesor: e * 0.86, bisel: e * 0.12 }), mch);
    a.position.z = z; a.castShadow = true; g.add(a);
    if (cierre) {
      const c = new THREE.Mesh(extruido(I, { espesor: e * 0.86, bisel: e * 0.12 }), mch);
      c.position.z = z; g.add(c);
    }
  }
  const dx = -(xI + (cierre ? t : 0)) / 2, dy = -alto / 2;
  for (const c of g.children) { c.position.x += dx; c.position.y += dy; }
  g.userData.brazo = { x: (t + ancho) / 2 + dx, y: 0, largo: ancho - t, alto: b, prof };
  g.userData.ventana = { alto: alto / 2 - b * 1.5, largo: ancho - t };
  return g;
}

/**
 * POLO SALIENTE de una máquina de CD o de un alternador: núcleo de chapa y
 * ZAPATA POLAR curva. La zapata no es un adorno rectangular: está torneada al
 * radio de la armadura, y eso es lo que mantiene el ENTREHIERRO constante bajo
 * todo el polo. Dibujado como un taco recto, el entrehierro sería mínimo en el
 * centro y enorme en las puntas, y no se entendería por qué el flujo entra
 * radial ni por qué la zapata es más ancha que el núcleo (para repartir el
 * flujo y, de paso, sujetar la bobina, que si no se saldría).
 *
 * El polo se dibuja apuntando a +Y con la armadura en el origen, y su espesor
 * —el apilado de chapas— va en +Z, como todas las piezas extruidas de la casa.
 * `userData.nucleo` da el rectángulo del núcleo para colgarle la bobina.
 */
export function poloSaliente(mat, opts = {}) {
  const { rArm = 0.24, entrehierro = 0.022, arcoPolo = 1.45, altoZapata = 0.085,
          anchoNucleo = 0.26, rYugo = 0.58, largo = 0.9, chapas = 0 } = opts;
  const g = new THREE.Group();
  const Ri = rArm + entrehierro;            // cara interior de la zapata
  const Rz = Ri + altoZapata;               // espalda de la zapata
  const h = arcoPolo / 2;                   // semiángulo del arco polar
  const w = anchoNucleo / 2;
  const pol = (a, r) => [Math.cos(a) * r, Math.sin(a) * r];
  const P = Math.PI / 2;
  const der = [
    pol(P - h, Ri),
    pol(P - h, Ri + altoZapata * 0.45),     // la punta de la zapata es más fina
    pol(P - h * 0.55, Rz),
    [w, Rz * Math.sin(P - h * 0.55) + 0.02],
    [w, rYugo],
  ];
  const contorno = [
    ...arco(0, 0, Ri, P + h, P - h, 22),    // cara cóncava, del extremo izq al der
    ...der,
    ...der.slice().reverse().map(([x, y]) => [-x, y]),
  ];
  const cuerpo = contornoRedondeado(contorno, 0.012, 2);
  if (chapas > 0) {
    // Apilado visible: el polo de una máquina de CD es un paquete de chapas
    // remachado, no una pieza maciza.
    const e = largo / chapas;
    for (let i = 0; i < chapas; i++) {
      const m = new THREE.Mesh(extruido(cuerpo, { espesor: e * 0.9, bisel: 0 }),
        mat.chapa || mat.acero);
      m.position.z = -largo / 2 + e * (i + 0.5);
      m.castShadow = true;
      g.add(m);
    }
  } else {
    const m = new THREE.Mesh(extruido(cuerpo, { espesor: largo, bisel: 0.006 }),
      mat.chapa || mat.acero);
    m.castShadow = true;
    g.add(m);
  }
  const yNuc = (Rz * Math.sin(P - h * 0.55) + 0.02 + rYugo) / 2;
  g.userData = { nucleo: { y: yNuc, ancho: anchoNucleo, alto: rYugo - (Rz * Math.sin(P - h * 0.55) + 0.02), largo }, Ri, Rz };
  return g;
}

/**
 * BOBINA DE CAMPO: el hilo enrollado sobre el núcleo del polo, vuelta a vuelta
 * y capa a capa. Se dibuja como lo que es —un hilo continuo que sube dando
 * vueltas— y no como un montón de aros sueltos, porque de ahí sale lo que hay
 * que ver: que el campo lo hace el NÚMERO DE VUELTAS por la corriente, y que
 * dos bobinas con la misma corriente y distinto número de vueltas no dan el
 * mismo flujo. El eje del arrollamiento es +Y (el del polo).
 */
export function bobinaCampo(mat, opts = {}) {
  const { ancho = 0.26, prof = 0.9, alto = 0.3, vueltas = 9, hilo = 0.026,
          capas = 2, seg = 5 } = opts;
  const g = new THREE.Group();
  const col = mat.cobre || mat.acero;
  for (let c = 0; c < capas; c++) {
    const d = hilo * 2 * c;
    const rect = contornoRedondeado([
      [-ancho / 2 - d, -prof / 2 - d], [ancho / 2 + d, -prof / 2 - d],
      [ancho / 2 + d, prof / 2 + d], [-ancho / 2 - d, prof / 2 + d],
    ], Math.min(ancho, prof) * 0.28 + d, seg);
    const K = rect.length;
    const paso = (alto - hilo * 2) / vueltas;
    const y0 = -alto / 2 + hilo;
    const pts = [];
    for (let t = 0; t < vueltas; t++) {
      for (let k = 0; k < K; k++) {
        // Las capas impares se enrollan de vuelta hacia abajo: es como se
        // devana de verdad, sin cortar el hilo al llegar al final de una capa.
        const u = t + k / K;
        const y = c % 2 === 0 ? y0 + u * paso : y0 + (vueltas - u) * paso;
        const [x, z] = rect[k];
        pts.push(new THREE.Vector3(x, y, z));
      }
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts, false), pts.length, hilo, 6, false), col);
    m.castShadow = true;
    g.add(m);
  }
  g.userData = { ancho, prof, alto };
  return g;
}

/**
 * NÚCLEO RANURADO: la chapa de un estator o de un rotor, con sus ranuras y sus
 * zapatas de diente.
 *
 * Un tubo liso con cajas pegadas por dentro no es un estator. Un estator es UNA
 * CHAPA troquelada —repetida unos cientos de veces— cuyo contorno tiene tantas
 * ranuras como conductores hay que meter, y cada diente acaba en una ZAPATA más
 * ancha que el diente. La zapata no es un adorno: es lo que cierra la ranura
 * para que el conductor no se salga y lo que reparte el flujo en el entrehierro.
 * Dibujarlo sin zapatas quita de la vista lo único que distingue un estator de
 * un tubo con aletas.
 *
 * `hacia` dice a qué lado miran las ranuras: 'dentro' para un estator —las
 * ranuras se abren al eje— y 'fuera' para un rotor de jaula o bobinado.
 */
export function nucleoRanurado(mat, opts = {}) {
  const { rExt = 1.18, rInt = 0.62, ranuras = 48, largo = 0.9,
          hacia = 'dentro', anchoRanura = 0.46, fondo = 0.55, zapata = 0.34 } = opts;
  // `fondo` es la FRACCIÓN de la altura radial que ocupa la ranura, no una
  // medida: así una chapa pequeña y una grande salen igual de proporcionadas.
  const hRad = Math.max(1e-6, rExt - rInt), prof = hRad * Math.min(0.9, fondo);
  const c = [];
  const paso = Math.PI * 2 / ranuras;
  // El radio del entrehierro es el que lleva las ranuras; el otro es la corona.
  const rD = hacia === 'dentro' ? rInt : rExt;   // donde se abren las ranuras
  const rF = hacia === 'dentro' ? rInt + prof : rExt - prof;    // fondo de ranura
  const sg = hacia === 'dentro' ? 1 : -1;
  const semi = paso * anchoRanura / 2;           // media ranura, en ángulo
  const boca = semi * (1 - zapata);              // la boca, estrechada por la zapata
  for (let i = 0; i < ranuras; i++) {
    const a = i * paso;
    // Diente: se recorre el arco del entrehierro hasta la boca de la ranura...
    for (let k = 0; k <= 5; k++) {
      const t = a - paso / 2 + (paso / 2 - boca) * (k / 5);
      c.push([Math.cos(t) * rD, Math.sin(t) * rD]);
    }
    // ...se entra por la boca, se abre a la anchura de la ranura, se llega al
    // fondo, y se sale por el otro lado en espejo. Ese escalón es la ZAPATA.
    c.push([Math.cos(a - boca) * (rD + sg * 0.06 * prof), Math.sin(a - boca) * (rD + sg * 0.06 * prof)]);
    c.push([Math.cos(a - semi) * (rD + sg * 0.16 * prof), Math.sin(a - semi) * (rD + sg * 0.16 * prof)]);
    for (let k = 0; k <= 5; k++) {
      const t = a - semi + 2 * semi * (k / 5);
      c.push([Math.cos(t) * rF, Math.sin(t) * rF]);
    }
    c.push([Math.cos(a + semi) * (rD + sg * 0.16 * prof), Math.sin(a + semi) * (rD + sg * 0.16 * prof)]);
    c.push([Math.cos(a + boca) * (rD + sg * 0.06 * prof), Math.sin(a + boca) * (rD + sg * 0.06 * prof)]);
    for (let k = 0; k <= 5; k++) {
      const t = a + boca + (paso / 2 - boca) * (k / 5);
      c.push([Math.cos(t) * rD, Math.sin(t) * rD]);
    }
  }
  let geo;
  if (hacia === 'dentro') {
    // El contorno dentado es el AGUJERO de la chapa; el borde exterior es un
    // círculo liso, que es la culata por donde se cierra el flujo.
    geo = extruido(circulo(0, 0, rExt, 96), { huecos: [c], espesor: largo, bisel: largo * 0.012 });
  } else {
    geo = extruido(c, { huecos: [circulo(0, 0, rInt, 48)], espesor: largo, bisel: largo * 0.012 });
  }
  const m = new THREE.Mesh(normalizaUV(geo, 3), mat.chapa || mat.acero);
  m.castShadow = m.receiveShadow = true;
  const g = new THREE.Group(); g.add(m);
  g.userData.ranuras = ranuras; g.userData.rExt = rExt; g.userData.rInt = rInt;
  return g;
}

/**
 * DEVANADO metido en las ranuras: los conductores dentro y las CABEZAS DE
 * BOBINA doblando por los dos extremos. Las cabezas son la mitad del cobre de
 * una máquina y la razón de que un motor sea más largo que su chapa; dibujar
 * sólo un anillo por cada lado las esconde y con ellas se esconde por qué el
 * cobre se calienta donde no hay hierro que lo refrigere.
 */
export function devanado(mat, opts = {}) {
  /* `desde` y `salto` son lo que hace falta para dibujar una máquina TRIFÁSICA:
     cada fase ocupa una de cada tres ranuras, así que se llama tres veces con
     desde = 0, 1 y 2 y salto = 3. Sin ellos, las bobinas salían todas seguidas
     en las primeras ranuras y el devanado parecía un motor con el cobre
     amontonado en un lado, que es justo lo que no es. */
  const { r = 0.98, ranuras = 48, largo = 0.9, paso = 6, hilo = 0.052, bobinas = 0,
          desde = 0, salto = 1 } = opts;
  const g = new THREE.Group();
  const n = bobinas || ranuras;
  const col = mat.cobre || mat.acero;
  for (let i = 0; i < n; i++) {
    const a0 = ((desde + i * salto) / ranuras) * Math.PI * 2;
    const a1 = ((desde + i * salto + paso) / ranuras) * Math.PI * 2;
    // Una espira: baja por su ranura, cruza por la cabeza, sube por la ranura
    // de vuelta y cierra por la otra cabeza.
    const pts = [];
    const dentro = (a, z) => new THREE.Vector3(Math.cos(a) * r, Math.sin(a) * r, z);
    const cabeza = (a, z) => new THREE.Vector3(Math.cos(a) * r * 1.02, Math.sin(a) * r * 1.02, z);
    pts.push(dentro(a0, -largo / 2), dentro(a0, largo / 2));
    pts.push(cabeza((a0 + a1) / 2, largo / 2 + largo * 0.16));
    pts.push(dentro(a1, largo / 2), dentro(a1, -largo / 2));
    pts.push(cabeza((a0 + a1) / 2, -largo / 2 - largo * 0.16));
    pts.push(dentro(a0, -largo / 2));
    const m = new THREE.Mesh(
      new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts, true), 40, hilo, 7, true), col);
    m.castShadow = true;
    g.add(m);
  }
  return g;
}

/**
 * ROTOR DE IMANES PERMANENTES enterrados, en V. Los imanes de un motor de
 * tracción no van pegados por fuera: van METIDOS en bolsillos dentro de la
 * chapa, y en V. La V no es capricho —concentra el flujo y añade par de
 * reluctancia, que es de donde sale una parte del par del motor— y un rotor
 * dibujado como un cilindro liso con pegatinas no lo puede enseñar.
 */
export function rotorImanes(mat, opts = {}) {
  const { r = 0.56, largo = 0.92, polos = 8, dEje = 0.34, apertura = 0.42,
          imanN = null, imanS = null } = opts;
  const g = new THREE.Group();
  const bolsillos = [];
  for (let i = 0; i < polos; i++) {
    const a = (i / polos) * Math.PI * 2;
    for (const s of [-1, 1]) {
      const b = a + s * apertura * (Math.PI / polos);
      bolsillos.push(contornoRedondeado([
        [-r * 0.20, -r * 0.045], [r * 0.20, -r * 0.045],
        [r * 0.20, r * 0.045], [-r * 0.20, r * 0.045],
      ], r * 0.02, 2).map(([x, y]) => {
        // El bolsillo se dibuja en su propio marco —x tangencial, y hacia el
        // eje—, se tumba su ángulo, y se lleva a su polo. Los dos de un mismo
        // polo se tumban en sentidos contrarios: eso es la V.
        const incl = s * 0.55;
        const xr = x * Math.cos(incl) - y * Math.sin(incl);
        const yr = x * Math.sin(incl) + y * Math.cos(incl);
        const ur = [Math.cos(b), Math.sin(b)];          // radial hacia fuera
        const tg = [-Math.sin(b), Math.cos(b)];         // tangencial
        const R = r * 0.62;
        return [R * ur[0] + xr * tg[0] - yr * ur[0],
                R * ur[1] + xr * tg[1] - yr * ur[1]];
      }));
    }
  }
  const chapa = new THREE.Mesh(normalizaUV(extruido(circulo(0, 0, r, 72), {
    huecos: [circulo(0, 0, dEje / 2, 32), ...bolsillos], espesor: largo, bisel: largo * 0.010,
  }), 3), mat.chapa || mat.acero);
  chapa.castShadow = true; g.add(chapa);
  // Los imanes dentro de sus bolsillos, con los polos alternados.
  bolsillos.forEach((b, k) => {
    const norte = Math.floor(k / 2) % 2 === 0;
    const m = new THREE.Mesh(extruido(b, { espesor: largo * 0.96 }),
      norte ? (imanN || mat.negro || mat.acero) : (imanS || mat.cobre || mat.acero));
    g.add(m);
  });
  g.userData.polos = polos;
  return g;
}

/**
 * RODAMIENTO de bolas: pistas interior y exterior, y las bolas entre las dos.
 * Es la pieza por la que un eje gira, y en un despiece no puede faltar porque es
 * lo único que explica por qué el rotor no roza con el estator.
 */
/**
 * ROTOR DE GARRAS (Lundell): el rotor de CUALQUIER alternador de coche, y una
 * de las piezas más reconocibles que hay. Son dos platos con dedos triangulares
 * que se meten unos entre otros SIN TOCARSE, y dentro de esa jaula, quieta, una
 * sola bobina de excitación. Los dedos de un plato salen norte y los del otro
 * sur, alternándose: por eso un rotor de doce garras da SEIS pares de polos y
 * la frecuencia sale a seis veces las vueltas. Con un cilindro con imanes
 * pegados encima no hay forma de contar los polos ni de explicar por qué la
 * bobina no gira con un colector.
 *
 * Eje en +Y. `userData.bobina` es el anillo de excitación, que es lo que hay
 * que apagar y encender cuando el laboratorio hable del regulador.
 */
export function rotorGarras(mat, opts = {}) {
  const { r = 0.34, largo = 0.30, polos = 12, dEje = 0.12, espesor = null } = opts;
  const N = Math.max(4, Math.round(polos / 2) * 2), M = N / 2;   // M garras por plato
  const T = espesor == null ? r * 0.17 : espesor;
  const g = new THREE.Group();
  const paso = Math.PI * 2 / M, anchoBase = paso * 0.42;
  for (const sy of [-1, 1]) {
    // El plato: disco con su cubo, del que salen las garras.
    const pl = new THREE.Mesh(revolucion(
      [[dEje / 2, 0], [r * 0.74, 0], [r * 0.74, largo * 0.16], [dEje / 2, largo * 0.16]], { seg: 40 }), mat.acero);
    pl.position.y = sy > 0 ? largo / 2 - largo * 0.16 : -largo / 2;
    pl.castShadow = true; g.add(pl);
    for (let k = 0; k < M; k++) {
      const th0 = k * paso + (sy > 0 ? 0 : paso / 2);
      /* La garra ARRANCA en el borde del plato y se abre hasta el diámetro
         exterior en el primer palmo: si naciera ya en el diámetro exterior, el
         plato la taparía entera y el rotor volvería a ser un tambor liso. */
      const sup = (u, v) => {
        const t = Math.min(1, u / 0.20);
        const R = r * 0.74 + (r - T / 2 - r * 0.74) * t;
        const semi = anchoBase * (1 - 0.72 * u);          // la garra se afila
        const th = th0 - semi + v * 2 * semi;
        const y = sy * (largo / 2 - largo * 0.16) - sy * u * (largo - largo * 0.20);
        return [Math.cos(th) * R, y, Math.sin(th) * R];
      };
      const m = new THREE.Mesh(cascara(sup, { nu: 12, nv: 5, espesor: T }), mat.acero);
      m.castShadow = true; g.add(m);
    }
  }
  // La bobina de excitación: va DENTRO de la jaula y NO gira con el campo, gira
  // con el rotor. Es la que se alimenta por las escobillas y los anillos rozantes.
  const bob = new THREE.Mesh(revolucion(
    [[dEje * 0.62, -largo * 0.28], [r * 0.70, -largo * 0.28],
      [r * 0.70, largo * 0.28], [dEje * 0.62, largo * 0.28]], { seg: 34 }),
    mat.cobre || mat.acero);
  g.add(bob); g.userData.bobina = bob;
  const eje = new THREE.Mesh(revolucion(
    [[0, -largo * 0.95], [dEje / 2, -largo * 0.95], [dEje / 2, largo * 0.95], [0, largo * 0.95]],
    { seg: 20 }), mat.cromo || mat.acero);
  g.add(eje);
  // Los dos anillos rozantes, por donde entra la corriente de excitación.
  for (const sy of [-1, 1]) {
    const an = new THREE.Mesh(revolucion(
      [[dEje * 0.62, 0], [dEje * 0.82, 0], [dEje * 0.82, largo * 0.09], [dEje * 0.62, largo * 0.09]],
      { seg: 24 }), mat.cobre || mat.acero);
    an.position.y = -largo * 0.72 + (sy > 0 ? largo * 0.13 : 0); g.add(an);
  }
  g.userData.polos = N;
  return g;
}

export function rodamiento(mat, opts = {}) {
  const { dExt = 0.42, dInt = 0.22, ancho = 0.14, bolas = 9 } = opts;
  const g = new THREE.Group();
  const Re = dExt / 2, Ri = dInt / 2, rm = (Re + Ri) / 2, rb = (Re - Ri) * 0.26;
  const pista = (r0, r1) => new THREE.Mesh(revolucion(
    [[r0, -ancho / 2], [r1, -ancho / 2], [r1, ancho / 2], [r0, ancho / 2]], { seg: 40 }), mat.acero);
  const ext = pista(rm + rb * 0.75, Re), int = pista(Ri, rm - rb * 0.75);
  ext.rotation.x = Math.PI / 2; int.rotation.x = Math.PI / 2;
  ext.castShadow = int.castShadow = true; g.add(ext, int);
  for (let i = 0; i < bolas; i++) {
    const a = (i / bolas) * Math.PI * 2;
    const b = new THREE.Mesh(new THREE.SphereGeometry(rb, 14, 10), mat.cromo || mat.acero);
    b.position.set(Math.cos(a) * rm, Math.sin(a) * rm, 0);
    g.add(b);
  }
  return g;
}

/* ==========================================================================
   §8 · ELECTRÓNICA DE POTENCIA Y CUADROS
   Las piezas que se repiten en el inversor, el cargador, el BMS y el escáner.
   ========================================================================== */

/**
 * DISIPADOR: base y peine de aletas, sacado de UN contorno extruido en vez de
 * apilar cajas sueltas. Una aleta suelta no toca la base; un peine sí, y es lo
 * que hace que el calor salga del silicio —que es de lo que va el laboratorio—.
 * `taladros` pone los agujeros de sujeción, que son por donde el módulo se
 * atornilla con su pasta térmica.
 */
export function disipador(mat, opts = {}) {
  const { ancho = 3.0, fondo = 1.6, base = 0.18, alto = 0.32,
          aletas: n = 12, espesorAleta = 0.05 } = opts;
  const g = new THREE.Group();
  // El peine, dibujado de perfil: se sube y se baja una vez por aleta.
  const c = [[-fondo / 2, 0]];
  const paso = fondo / n;
  for (let i = 0; i < n; i++) {
    const z = -fondo / 2 + i * paso + (paso - espesorAleta) / 2;
    c.push([z, base], [z, base + alto], [z + espesorAleta, base + alto], [z + espesorAleta, base]);
  }
  c.push([fondo / 2, 0]);
  const m = new THREE.Mesh(normalizaUV(extruido(c, { espesor: ancho, bisel: 0.008, curvaSeg: 2 }), 2),
    mat.aluminio);
  m.rotation.y = Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
  g.userData.base = base; g.userData.alto = base + alto;
  return g;
}

/**
 * CONDENSADOR de bus: lata con su reborde engarzado, la CRUZ DE ALIVIO en la
 * tapa y dos bornes de tornillo. La cruz no es un dibujo: es por donde revienta
 * de forma controlada si el condensador se embala, y es lo primero que se mira
 * al abrir un inversor quemado. Una lata lisa no cuenta nada de eso.
 */
export function condensador(mat, opts = {}) {
  const { d = 0.52, alto = 0.76, bornes = 2, aislante = null } = opts;
  const g = new THREE.Group(); const R = d / 2;
  const cuerpo = new THREE.Mesh(revolucion([
    [0, 0], [R, 0], [R, alto * 0.94], [R * 0.96, alto * 0.96],
    [R * 0.86, alto * 0.96], [R * 0.90, alto], [R * 0.86, alto * 1.02], [0, alto * 1.02],
  ], { seg: 34 }), aislante || mat.negro || mat.aluminio);
  cuerpo.castShadow = true; g.add(cuerpo);
  // El engarce: el anillo donde la lata se cierra sobre la tapa.
  const engarce = new THREE.Mesh(new THREE.TorusGeometry(R * 0.97, R * 0.045, 8, 34), mat.aluminio);
  engarce.rotation.x = Math.PI / 2; engarce.position.y = alto * 0.93; g.add(engarce);
  // La cruz de alivio, rebajada en la tapa.
  for (const a of [0, Math.PI / 2]) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(R * 1.30, R * 0.05, R * 0.16), mat.aluminio);
    r.position.y = alto * 1.02; r.rotation.y = a; g.add(r);
  }
  for (let i = 0; i < bornes; i++) {
    const x = bornes === 1 ? 0 : (i - (bornes - 1) / 2) * R * 0.90;
    const b = new THREE.Mesh(revolucion([
      [0, 0], [R * 0.20, 0], [R * 0.20, alto * 0.055], [R * 0.13, alto * 0.065],
      [R * 0.13, alto * 0.14], [0, alto * 0.14]], { seg: 14 }), mat.cobre || mat.acero);
    b.position.set(x, alto * 1.02, 0); g.add(b);
  }
  g.userData.alto = alto * 1.16;
  return g;
}

/**
 * MÓDULO DE POTENCIA (IGBT, MOSFET, puente): base metálica, carcasa de plástico
 * negro, taladros de sujeción en las esquinas, terminales de potencia arriba y
 * la peineta de pines de mando. Los terminales son la mitad de la pieza: es por
 * donde entra el bus de continua y por donde sale la fase, y sin ellos el
 * módulo es un ladrillo negro que no se sabe cómo se conecta.
 */
export function moduloPotencia(mat, opts = {}) {
  const { ancho = 0.38, fondo = 0.46, alto = 0.18, potencia = 3, pines = 5,
          carcasa = null } = opts;
  const g = new THREE.Group();
  const suela = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -fondo / 2], [ancho / 2, -fondo / 2], [ancho / 2, fondo / 2], [-ancho / 2, fondo / 2]],
    ancho * 0.10, 3), { espesor: alto * 0.22, bisel: alto * 0.02 }), mat.aluminio);
  suela.rotation.x = -Math.PI / 2; suela.position.y = alto * 0.11;
  suela.castShadow = true; g.add(suela);
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho * 0.44, -fondo * 0.44], [ancho * 0.44, -fondo * 0.44],
     [ancho * 0.44, fondo * 0.44], [-ancho * 0.44, fondo * 0.44]], ancho * 0.10, 3),
    { espesor: alto * 0.78, bisel: alto * 0.04 }), carcasa || mat.negro || mat.aluminio);
  cuerpo.rotation.x = -Math.PI / 2; cuerpo.position.y = alto * 0.61;
  cuerpo.castShadow = true; g.add(cuerpo);
  // Los taladros de sujeción: dos casquillos en las esquinas largas.
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(revolucion([
      [ancho * 0.055, 0], [ancho * 0.13, 0], [ancho * 0.13, alto * 0.24], [ancho * 0.055, alto * 0.24],
    ], { seg: 14 }), mat.acero);
    t.position.set(0, alto * 0.11, s * fondo * 0.40); g.add(t);
  }
  // Terminales de potencia: pletinas con su agujero de tornillo.
  for (let i = 0; i < potencia; i++) {
    const x = (i - (potencia - 1) / 2) * ancho * 0.52;
    const p = new THREE.Mesh(extruido(contornoRedondeado(
      [[-ancho * 0.10, -fondo * 0.07], [ancho * 0.10, -fondo * 0.07],
       [ancho * 0.10, fondo * 0.07], [-ancho * 0.10, fondo * 0.07]], ancho * 0.05, 3),
      { huecos: [circulo(0, 0, ancho * 0.045, 10)], espesor: alto * 0.10 }), mat.cobre || mat.acero);
    p.rotation.x = -Math.PI / 2; p.position.set(x, alto * 1.05, -fondo * 0.26);
    g.add(p);
  }
  // La peineta de mando.
  for (let i = 0; i < pines; i++) {
    const x = (i - (pines - 1) / 2) * ancho * 0.13;
    const pin = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.035, alto * 0.55, ancho * 0.035),
      mat.cobre || mat.acero);
    pin.position.set(x, alto * 1.25, fondo * 0.30); g.add(pin);
  }
  g.userData.alto = alto * 1.5; g.userData.cuerpo = cuerpo;
  return g;
}

/**
 * PLACA de circuito: sustrato con esquinas redondeadas, taladros de montaje y
 * —lo que la hace reconocible— un puñado de componentes de verdad encima. Una
 * caja plana verde no es una placa; una placa se reconoce por su relieve.
 */
export function placa(mat, opts = {}) {
  const { ancho = 2.6, fondo = 1.2, espesor = 0.05, taladros = true,
          verde = null } = opts;
  const g = new THREE.Group();
  const hue = [];
  if (taladros) {
    for (const sx of [-1, 1]) for (const sz of [-1, 1])
      hue.push(circulo(sx * (ancho / 2 - ancho * 0.035), sz * (fondo / 2 - fondo * 0.06),
        Math.min(ancho, fondo) * 0.018, 10));
  }
  const sub = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-ancho / 2, -fondo / 2], [ancho / 2, -fondo / 2], [ancho / 2, fondo / 2], [-ancho / 2, fondo / 2]],
    Math.min(ancho, fondo) * 0.05, 3), { huecos: hue, espesor, bisel: espesor * 0.15 }), 2),
    verde || mat.verde || mat.negro || mat.aluminio);
  sub.rotation.x = -Math.PI / 2; sub.castShadow = sub.receiveShadow = true; g.add(sub);
  g.userData.cara = espesor / 2;
  return g;
}

/**
 * CIRCUITO INTEGRADO encapsulado, con sus patillas por los cuatro lados y la
 * muesca del pin 1. La muesca importa: es lo que dice por dónde va montado, y
 * es la primera cosa que se busca al soldar uno.
 */
export function chip(mat, opts = {}) {
  const { lado = 0.40, alto = 0.06, pines = 10, patilla = null } = opts;
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado(
    [[-lado / 2, -lado / 2], [lado / 2, -lado / 2], [lado / 2, lado / 2], [-lado / 2, lado / 2]],
    lado * 0.06, 3), { espesor: alto, bisel: alto * 0.12 }), mat.negro || mat.aluminio);
  cuerpo.rotation.x = -Math.PI / 2; cuerpo.position.y = alto / 2; cuerpo.castShadow = true;
  g.add(cuerpo);
  const marca = new THREE.Mesh(new THREE.CylinderGeometry(lado * 0.05, lado * 0.05, alto * 0.12, 12),
    mat.blanco || mat.acero);
  marca.position.set(-lado * 0.34, alto, -lado * 0.34); g.add(marca);
  const mp = patilla || mat.acero;
  for (let lado_i = 0; lado_i < 4; lado_i++) {
    for (let i = 0; i < pines; i++) {
      const t = (i + 0.5) / pines - 0.5;
      const p = new THREE.Mesh(new THREE.BoxGeometry(lado * 0.035, alto * 0.18, lado * 0.13), mp);
      const d = lado * 0.56;
      if (lado_i === 0) p.position.set(t * lado * 0.9, alto * 0.16, -d);
      else if (lado_i === 1) { p.position.set(d, alto * 0.16, t * lado * 0.9); p.rotation.y = Math.PI / 2; }
      else if (lado_i === 2) p.position.set(t * lado * 0.9, alto * 0.16, d);
      else { p.position.set(-d, alto * 0.16, t * lado * 0.9); p.rotation.y = Math.PI / 2; }
      g.add(p);
    }
  }
  return g;
}

/**
 * BARRA DE COBRE: pletina plana doblada, con su terminal taladrado en cada
 * punta. Un palo redondo no es una barra: la barra es plana porque así disipa,
 * y va taladrada porque se atornilla —que es como se conecta la potencia—.
 */
export function barraCobre(mat, opts = {}) {
  const { largo = 1.3, ancho = 0.14, espesor = 0.04, doblez = 0.18, color = null } = opts;
  const perfil = [
    [-largo / 2, 0], [-largo / 2 + doblez, 0], [-largo / 2 + doblez * 1.6, doblez * 0.9],
    [largo / 2 - doblez * 1.6, doblez * 0.9], [largo / 2 - doblez, 0], [largo / 2, 0],
    [largo / 2, espesor], [largo / 2 - doblez, espesor],
    [largo / 2 - doblez * 1.6, doblez * 0.9 + espesor],
    [-largo / 2 + doblez * 1.6, doblez * 0.9 + espesor], [-largo / 2 + doblez, espesor],
    [-largo / 2, espesor],
  ];
  const m = new THREE.Mesh(extruido(perfil, { espesor: ancho, bisel: espesor * 0.12, curvaSeg: 2 }),
    color || mat.cobre || mat.acero);
  m.rotation.y = Math.PI / 2; m.castShadow = true;
  const g = new THREE.Group(); g.add(m);
  return g;
}

/**
 * BORNE de tornillo: casquillo, tuerca hexagonal y arandela. Es la pieza por la
 * que se aprieta un cable de potencia, y la que se afloja y provoca la mitad de
 * las averías térmicas de un cuadro.
 */
export function borne(mat, opts = {}) {
  const { d = 0.10, alto = 0.14 } = opts;
  const g = new THREE.Group();
  const base = new THREE.Mesh(revolucion([
    [0, 0], [d * 0.9, 0], [d * 0.9, alto * 0.22], [d * 0.55, alto * 0.30], [0, alto * 0.30],
  ], { seg: 18 }), mat.aluminio);
  g.add(base);
  const ar = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.72, d * 0.72, alto * 0.10, 18), mat.acero);
  ar.position.y = alto * 0.36; g.add(ar);
  const tu = tornilloHex(mat, { d: d * 1.05, largo: alto * 0.55 });
  tu.position.y = alto * 0.42; g.add(tu);
  return g;
}

/* ==========================================================================
   §9 · TURBOMÁQUINAS E INTERCAMBIADORES
   La bomba de agua, el turbo, el ventilador y el radiador comparten dos
   formas que con cajas y cilindros no salen: la VOLUTA —el caracol cuyo
   radio crece con el ángulo— y el RODETE de álabes curvos. Y todo radiador,
   intercooler, evaporador o condensador es el mismo PANAL de tubos y aletas.
   ========================================================================== */

/**
 * VOLUTA: la pared en espiral de una bomba centrífuga, de un compresor o de
 * una turbina. Su radio crece con el ángulo porque va recogiendo el caudal que
 * el rodete lanza hacia fuera, y al ensancharse lo frena: ahí es donde la
 * velocidad se convierte en presión. Dibujada como un tambor —que es como
 * salía con un cilindro— esa ley no tiene de dónde salir en la pantalla.
 *
 * Se devuelve como PARED, no como plancha maciza: por la boca abierta se ve el
 * rodete girando dentro, que es lo que enseña una bomba de corte de taller.
 * El salto del radio final al inicial sobre el mismo eje es la LENGÜETA, el
 * filo que separa lo que sale de lo que vuelve a dar otra vuelta.
 *
 * Eje en Z (es una pieza extruida); con `eje:'y'` se entrega ya tumbada para
 * montarla contra un `rodete`, que sí tiene su eje en +Y. `fase` gira el
 * caracol entero: es por dónde queda la boca de salida, y eso lo manda el
 * montaje —hacia arriba en un compresor, hacia abajo en una turbina—.
 */
export function voluta(opts = {}) {
  const { r0 = 0.55, r1 = 1, espesor = 0.10, ancho = 0.8, seg = 72,
    bisel = 0.005, eje = 'z', fase = 0 } = opts;
  const TAU = Math.PI * 2, cara = [];
  const rv = (t) => r0 + (r1 - r0) * t;
  for (let i = 0; i <= seg; i++) {
    const a = fase + (i / seg) * TAU, r = rv(i / seg) + espesor;
    cara.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  for (let i = seg; i >= 0; i--) {
    const a = fase + (i / seg) * TAU, r = rv(i / seg);
    cara.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const g = normalizaUV(extruido(cara, { espesor: ancho, bisel }), 2);
  if (eje === 'y') g.rotateX(-Math.PI / 2);
  return g;
}

/**
 * RODETE de flujo radial: la rueda del compresor de un turbo, la de la turbina,
 * el impulsor de una bomba. Sus álabes NO son paletas planas: entran por el ojo
 * en dirección axial, giran noventa grados y salen por el diámetro exterior
 * barriendo un ángulo —la ENVOLTURA—, y esa curvatura hacia atrás es lo que
 * hace que la máquina no se embale cuando se le abre la salida.
 *
 * El álabe se construye como superficie reglada entre la línea del CUBO y la
 * de la CUBIERTA —las dos curvas meridianas del canal—, y se le da espesor
 * desplazando cada punto por la normal de la superficie. Con una caja girada no
 * hay forma de enseñar ni el inductor ni el ángulo de salida.
 *
 * Eje en +Y: la entrada mira a +Y y el disco de salida queda en y=0.
 */
export function rodete(mat, opts = {}) {
  const {
    rExt = 0.30, rOjo = 0.20, rCubo = 0.075, largo = 0.22,
    b2 = null, alabes = 8, envoltura = 0.85, espesor = null,
    sentido = 1, seg = 20, tuerca = true,
  } = opts;
  const B2 = b2 == null ? rExt * 0.20 : b2;
  const E = espesor == null ? rExt * 0.055 : espesor;
  const acero = mat.aluminio || mat.acero || mat.cromo;
  const g = new THREE.Group();

  // --- las dos curvas meridianas, en (radio, altura) -----------------------
  const hub = (u) => [rCubo + (rExt - rCubo) * Math.pow(Math.sin(u), 1.5),
    largo * Math.pow(Math.cos(u), 1.1)];
  const shr = (u) => [rOjo + (rExt - rOjo) * Math.pow(Math.sin(u), 1.1),
    B2 + (largo - B2) * Math.pow(Math.cos(u), 0.9)];
  const giro = (t) => sentido * envoltura * Math.pow(t, 1.35);

  // --- los álabes, todos en una sola geometría -----------------------------
  const pos = [], idx = [];
  const P = (t, j, fase) => {
    const u = (t * Math.PI) / 2, [rh, yh] = hub(u), [rs, ys] = shr(u);
    const r = rh + (rs - rh) * j, y = yh + (ys - yh) * j, a = giro(t) + fase;
    return [Math.cos(a) * r, y, Math.sin(a) * r];
  };
  const resta = (A, B) => [A[0] - B[0], A[1] - B[1], A[2] - B[2]];
  const cruz = (A, B) => [A[1] * B[2] - A[2] * B[1], A[2] * B[0] - A[0] * B[2],
    A[0] * B[1] - A[1] * B[0]];
  const unit = (V) => { const L = Math.hypot(V[0], V[1], V[2]) || 1;
    return [V[0] / L, V[1] / L, V[2] / L]; };
  for (let k = 0; k < alabes; k++) {
    const fase = (k / alabes) * Math.PI * 2, base = pos.length / 3;
    // Dos capas (t, j) desplazadas por la normal: la cara y el dorso del álabe.
    for (let i = 0; i <= seg; i++) for (let j = 0; j <= 1; j++) {
      const t = i / seg, c = P(t, j, fase);
      const dt = resta(P(Math.min(1, t + 1e-3), j, fase), P(Math.max(0, t - 1e-3), j, fase));
      const dj = resta(P(t, 1, fase), P(t, 0, fase));
      const n = unit(cruz(dt, dj));
      for (const sg of [1, -1]) pos.push(c[0] + n[0] * sg * E / 2,
        c[1] + n[1] * sg * E / 2, c[2] + n[2] * sg * E / 2);
    }
    // Índice del vértice (i, j, capa): cuatro por cada paso meridiano.
    const V = (i, j, c) => base + i * 4 + j * 2 + c;
    for (let i = 0; i < seg; i++) {
      idx.push(V(i, 0, 0), V(i, 1, 0), V(i + 1, 0, 0), V(i, 1, 0), V(i + 1, 1, 0), V(i + 1, 0, 0));
      idx.push(V(i, 0, 1), V(i + 1, 0, 1), V(i, 1, 1), V(i, 1, 1), V(i + 1, 0, 1), V(i + 1, 1, 1));
      // El canto: el álabe tiene grosor y hay que cerrarlo por los cuatro lados.
      idx.push(V(i, 1, 0), V(i, 1, 1), V(i + 1, 1, 0), V(i, 1, 1), V(i + 1, 1, 1), V(i + 1, 1, 0));
      idx.push(V(i, 0, 0), V(i + 1, 0, 0), V(i, 0, 1), V(i, 0, 1), V(i + 1, 0, 0), V(i + 1, 0, 1));
    }
    idx.push(V(0, 0, 0), V(0, 0, 1), V(0, 1, 0), V(0, 1, 0), V(0, 0, 1), V(0, 1, 1));
    idx.push(V(seg, 0, 0), V(seg, 1, 0), V(seg, 0, 1), V(seg, 0, 1), V(seg, 1, 0), V(seg, 1, 1));
  }
  const gal = new THREE.BufferGeometry();
  gal.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  gal.setIndex(idx);
  gal.computeVertexNormals(); sanaNormales(gal);
  const mAl = new THREE.Mesh(gal, acero);
  mAl.castShadow = true; g.add(mAl);

  // --- el cubo: la pieza maciza sobre la que van los álabes ----------------
  const perf = [[0, 0], [rExt, 0]];
  for (let i = seg; i >= 0; i--) { const u = (i / seg) * Math.PI / 2; perf.push(hub(u)); }
  perf.push([0, largo]);
  const cubo = new THREE.Mesh(revolucion(perf, { seg: 44 }), acero);
  cubo.castShadow = true; g.add(cubo);
  if (tuerca) {
    const tu = new THREE.Mesh(revolucion([[0, 0], [rCubo * 0.85, 0],
      [rCubo * 0.62, rCubo * 0.9], [0, rCubo * 0.9]], { seg: 22 }),
      mat.cromo || mat.acero || acero);
    tu.position.y = largo; g.add(tu);
  }
  g.userData.rExt = rExt; g.userData.largo = largo;
  return g;
}

/**
 * GEROTOR: la bomba de aceite de casi cualquier motor, y también la de muchas
 * transmisiones hidrostáticas. Son DOS rotores: el interior, con `dientes`
 * lóbulos, va calado en el eje; el exterior tiene UNO MÁS y gira suelto,
 * descentrado. Esa diferencia de un diente es toda la máquina: entre los dos
 * quedan cámaras que crecen por el lado de la aspiración y se encogen por el de
 * la impulsión, y por eso la bomba es VOLUMÉTRICA —da caudal proporcional a las
 * vueltas, pase lo que pase con la presión—, que es la hipótesis de la que
 * cuelga cualquier balance de caudales.
 *
 * El rotor exterior se dibuja con sus lóbulos circulares, que es como se fabrica.
 * El interior NO se dibuja: se CALCULA como la envolvente de esos lóbulos a lo
 * largo de una vuelta entera —el perfil conjugado, el único que engrana sin
 * holgura—. Dibujarlo a ojo daría una estrella que no cierra ninguna cámara.
 *
 * Eje en Z (piezas extruidas). `userData.interior` y `userData.exterior` son los
 * dos grupos que hay que girar: el exterior, a `dientes/(dientes+1)` de la
 * velocidad del interior, que es la relación que impone el engrane.
 */
export function gerotor(mat, opts = {}) {
  const { dientes = 6, rExt = 0.42, ancho = 0.16, exc = null, seg = 168, pasos = 240 } = opts;
  const n = Math.max(3, Math.round(dientes)), N = n + 1;
  /* Las tres cotas de un gerotor no son libres: los lóbulos del rotor exterior
     tienen que quedar TANGENTES entre sí —si se solapan, el agujero se vuelve
     redondo y el rotor interior se queda en un alfiler— y la excentricidad vale
     el radio del círculo de centros dividido por el número de lóbulos. */
  const Rt = rExt * 0.58;                       // círculo de centros de los lóbulos
  const rt = Rt * Math.sin(Math.PI / N) * 1.03;
  const E = exc == null ? Rt / N : exc;         // excentricidad entre los dos ejes
  const acero = mat.acero || mat.aluminio;

  // --- el rotor EXTERIOR: un anillo cuyo agujero son N lóbulos circulares ----
  const centros = [];
  for (let k = 0; k < N; k++) {
    const a = (k / N) * Math.PI * 2;
    centros.push([Math.cos(a) * Rt, Math.sin(a) * Rt]);
  }
  const hueco = [];
  for (let i = 0; i < seg; i++) {
    const f = (i / seg) * Math.PI * 2, ux = Math.cos(f), uy = Math.sin(f);
    let r = 0;
    for (const [cx, cy] of centros) {
      const cu = cx * ux + cy * uy, d2 = cx * cx + cy * cy - cu * cu;
      if (d2 > rt * rt) continue;
      const q = cu + Math.sqrt(rt * rt - d2);
      if (q > r) r = q;
    }
    hueco.push([ux * r, uy * r]);
  }
  const gExt = extruido(circulo(0, 0, rExt, 72), { huecos: [hueco], espesor: ancho, bisel: ancho * 0.05 });
  const mExt = new THREE.Mesh(normalizaUV(gExt, 2), acero);
  mExt.castShadow = true;

  // --- el rotor INTERIOR: la envolvente de esos lóbulos, muestreada -----------
  // Se mira desde el rotor interior: mientras la bomba gira un vuelta entera,
  // cada lóbulo del exterior barre una circunferencia, y el perfil interior es
  // lo que queda DENTRO de todas ellas.
  const RMAX = Rt + rt, perfil = new Array(seg).fill(RMAX);
  for (let p = 0; p < pasos; p++) {
    const al = (p / pasos) * Math.PI * 2, be = al * n / N;
    for (let k = 0; k < N; k++) {
      const a = be + (k / N) * Math.PI * 2;
      // centro del lóbulo, llevado al sistema del rotor interior
      const wx = E + Math.cos(a) * Rt, wy = Math.sin(a) * Rt;
      const cx = wx * Math.cos(-al) - wy * Math.sin(-al);
      const cy = wx * Math.sin(-al) + wy * Math.cos(-al);
      for (let i = 0; i < seg; i++) {
        const f = (i / seg) * Math.PI * 2, ux = Math.cos(f), uy = Math.sin(f);
        const cu = cx * ux + cy * uy;
        if (cu <= 0) continue;
        const d2 = cx * cx + cy * cy - cu * cu;
        if (d2 > rt * rt) continue;
        const q = cu - Math.sqrt(rt * rt - d2);
        if (q < perfil[i]) perfil[i] = q;
      }
    }
  }
  const cara = perfil.map((r, i) => {
    const f = (i / seg) * Math.PI * 2;
    return [Math.cos(f) * r, Math.sin(f) * r];
  });
  const gInt = extruido(cara, { huecos: [circulo(0, 0, rExt * 0.13, 24)], espesor: ancho * 0.98, bisel: ancho * 0.05 });
  const mInt = new THREE.Mesh(normalizaUV(gInt, 2), mat.cromo || acero);
  mInt.castShadow = true;

  const g = new THREE.Group();
  const iInt = new THREE.Group(), iExt = new THREE.Group();
  iInt.add(mInt); iExt.add(mExt); iExt.position.x = E;
  g.add(iInt, iExt);
  g.userData.interior = iInt; g.userData.exterior = iExt;
  g.userData.relacion = n / N; g.userData.exc = E;
  return g;
}

/**
 * PANAL de tubos y aletas: el núcleo de un radiador, de un intercooler, de un
 * evaporador. El fluido va por los TUBOS, el aire pasa entre las ALETAS, y toda
 * la superficie que un método ε-NTU pone en la cuenta está justo ahí. Con una
 * plancha rayada no se ve ni por dónde pasa el aire.
 *
 * La aleta corrugada de cada hueco sale de UN contorno extruido —el mismo truco
 * del peine del disipador—, así que TOCA los dos tubos en vez de flotar delante.
 * `userData.matTubo` es el material de los tubos, propio de cada panal: es el
 * que hay que repintar cuando el laboratorio quiera enseñar la temperatura del
 * fluido, que la llevan los tubos y no las aletas.
 */
export function panal(mat, opts = {}) {
  const { ancho = 1, alto = 0.7, prof = 0.09, tubos = 17, eje = 'y',
    onda = 11, colorTubo = 0x39434f, colorAleta = 0x4a5663 } = opts;
  const g = new THREE.Group();
  const base = mat.aluminio || mat.acero;
  const nuevo = (col) => { const m = base.clone(); m.color = new THREE.Color(col); return m; };
  const mTubo = mat.tubo || nuevo(colorTubo), mAleta = mat.aleta || nuevo(colorAleta);
  const paso = (ancho * 0.96) / tubos;
  for (let i = 0; i < tubos; i++) {
    const x = -ancho * 0.48 + paso * (i + 0.5);
    const t = new THREE.Mesh(extruido(contornoRedondeado(
      [[-paso * 0.20, -alto * 0.46], [paso * 0.20, -alto * 0.46],
        [paso * 0.20, alto * 0.46], [-paso * 0.20, alto * 0.46]], paso * 0.19, 3),
      { espesor: prof * 0.94, bisel: prof * 0.045 }), mTubo);
    t.position.x = x; t.castShadow = true; g.add(t);
    if (i === tubos - 1) continue;
    const c = [], xa = x + paso * 0.20, xb = x + paso * 0.80;
    for (let k = 0; k <= onda; k++) { const y = -alto * 0.44 + alto * 0.88 * (k / onda);
      c.push([k % 2 ? xa : xb, y], [k % 2 ? xb : xa, y]); }
    for (let k = onda; k >= 0; k--) { const y = -alto * 0.44 + alto * 0.88 * (k / onda);
      c.push([k % 2 ? xb : xa, y + alto * 0.008], [k % 2 ? xa : xb, y + alto * 0.008]); }
    g.add(new THREE.Mesh(extruido(c, { espesor: prof * 0.82, bisel: prof * 0.02, curvaSeg: 1 }), mAleta));
  }
  if (eje === 'x') g.rotation.z = Math.PI / 2;
  g.userData.matTubo = mTubo; g.userData.matAleta = mAleta;
  return g;
}

/**
 * SONDA LAMBDA (o de NOx, o de temperatura de escape: todas se parecen). Lo que
 * la hace reconocible no es el cuerpo, es el TUBO DE PROTECCIÓN ranurado de la
 * punta: el gas tiene que llegar al elemento de circonio, pero el elemento no
 * puede recibir el chorro directo ni el agua de condensación. Esas ranuras son
 * la pieza. Y el hexágono no es adorno: una sonda se aprieta con una llave de
 * vaso partido porque el cable no se puede pasar por la llave.
 *
 * Eje en +Y, con la punta hacia −Y: se enrosca mirando hacia abajo, como va.
 */
export function sondaLambda(mat, opts = {}) {
  const { d = 0.10, largo = 0.42, ranuras = 6, cable = true } = opts;
  const R = d / 2, g = new THREE.Group();
  const cuerpo = new THREE.Mesh(revolucion([
    [0, largo * 0.10], [R * 0.72, largo * 0.10], [R * 0.72, largo * 0.30],
    [R * 0.52, largo * 0.34], [R * 0.52, largo * 0.52], [0, largo * 0.52]],
    { seg: 24 }), mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  const hex = new THREE.Mesh(revolucion(
    [[0, 0], [R, 0], [R, largo * 0.13], [0, largo * 0.13]], { seg: 6 }), mat.acero);
  g.add(hex);
  const rosc = new THREE.Mesh(revolucion(
    [[0, -largo * 0.16], [R * 0.66, -largo * 0.16], [R * 0.66, 0], [0, 0]], { seg: 20 }), mat.acero);
  g.add(rosc);
  g.add(rosca(mat, { r: R * 0.70, paso: largo * 0.038, vueltas: 4, grueso: largo * 0.016 })
    .translateY(-largo * 0.08));
  // El tubo de protección, con sus ranuras.
  const tubo = new THREE.Mesh(revolucion([
    [R * 0.40, -largo * 0.46], [R * 0.56, -largo * 0.46],
    [R * 0.56, -largo * 0.16], [R * 0.40, -largo * 0.16]], { seg: 20 }), mat.cromo || mat.acero);
  g.add(tubo);
  for (let i = 0; i < ranuras; i++) {
    const a = (i / ranuras) * Math.PI * 2;
    const r = new THREE.Mesh(new THREE.BoxGeometry(R * 0.20, largo * 0.16, R * 0.34), mat.negro || mat.acero);
    r.position.set(Math.cos(a) * R * 0.50, -largo * 0.34, Math.sin(a) * R * 0.50);
    r.rotation.y = -a; g.add(r);
  }
  if (cable) {
    const c = new THREE.Mesh(revolucion(
      [[0, largo * 0.52], [R * 0.24, largo * 0.52], [R * 0.24, largo * 0.86], [0, largo * 0.86]],
      { seg: 14 }), mat.negro || mat.goma || mat.acero);
    g.add(c);
  }
  g.userData.largo = largo;
  return g;
}

/**
 * MONOLITO cerámico: el interior de un catalizador o de un filtro de partículas.
 * Es un panal de miles de canales rectos y paralelos —«celdas por pulgada
 * cuadrada»—, y esa geometría es la razón de todo: da una superficie enorme sin
 * ahogar el escape, y por eso un catalizador convierte sin costar apenas
 * contrapresión... hasta que se funde y los canales se cierran.
 *
 * Las paredes se sacan de dos peines de planchas cruzadas: da la lectura de
 * panal con unas decenas de mallas en vez de con miles de agujeros extruidos,
 * que es lo que costaría dibujar celda a celda. Eje en Z.
 */
export function monolito(mat, opts = {}) {
  const { r = 0.32, largo = 0.46, celdas = 13, carcasa = true } = opts;
  const g = new THREE.Group();
  const paso = (r * 2 * 0.94) / celdas;
  const cer = mat.ceramica || mat.blanco || mat.aluminio;
  for (let i = 1; i < celdas; i++) {
    const t = -r * 0.94 + paso * i;
    const semi = Math.sqrt(Math.max(0, (r * 0.94) ** 2 - t * t));
    if (semi < paso * 0.4) continue;
    for (const eje of [0, 1]) {
      const m = new THREE.Mesh(new THREE.BoxGeometry(
        eje ? semi * 2 : paso * 0.10, eje ? paso * 0.10 : semi * 2, largo), cer);
      m.position.set(eje ? 0 : t, eje ? t : 0, 0);
      g.add(m);
    }
  }
  if (carcasa) {
    const car = new THREE.Mesh(revolucion(
      [[r * 0.95, -largo / 2], [r, -largo / 2], [r, largo / 2], [r * 0.95, largo / 2]],
      { seg: 34 }), mat.acero);
    car.rotation.x = Math.PI / 2; g.add(car);
  }
  return g;
}

/**
 * FILTRO PLISADO: el elemento de papel de un filtro de aire. Lo que filtra es
 * la SUPERFICIE, y el plisado es la manera de meter un metro cuadrado de papel
 * en una caja de un palmo: por eso un filtro sucio ahoga el motor y por eso se
 * cuenta el número de pliegues. Sale de un contorno en estrella extruido, de
 * una pieza, en vez de repartir tablillas sueltas alrededor de un cilindro.
 */
export function filtroPlisado(mat, opts = {}) {
  const { rExt = 0.30, rInt = 0.20, alto = 0.30, pliegues = 34 } = opts;
  const cara = [];
  for (let i = 0; i < pliegues; i++) {
    const a0 = (i / pliegues) * Math.PI * 2, a1 = ((i + 0.5) / pliegues) * Math.PI * 2;
    cara.push([Math.cos(a0) * rInt, Math.sin(a0) * rInt],
      [Math.cos(a1) * rExt, Math.sin(a1) * rExt]);
  }
  const g = new THREE.Group();
  const pap = new THREE.Mesh(normalizaUV(extruido(cara,
    { espesor: alto, bisel: 0.004, curvaSeg: 1 }), 3), mat.papel || mat.blanco || mat.aluminio);
  pap.castShadow = true; g.add(pap);
  g.rotation.x = -Math.PI / 2;   // eje en +Y, como toda pieza de revolución
  return g;
}

/* ==========================================================================
   §10 · HIDRÁULICA Y NEUMÁTICA
   Las piezas de un banco de fluidos. Casi todas se dibujaban como cilindros
   lisos y cajas, y ahí se perdía justo lo que hay que reconocer: que un
   manómetro tiene una esfera con divisiones que se LEEN, que un cilindro lleva
   cuatro tirantes porque la presión intenta separarle las tapas, que una
   válvula direccional tiene solenoides y accionamiento manual de emergencia, y
   que una bomba de pistones se manda inclinando un plato.
   ========================================================================== */

/**
 * MANÓMETRO de esfera. La esfera mira a +Z y el racor sale por −Y, que es como
 * se monta en una toma horizontal.
 *
 * `userData.marca(f)` pone la aguja en la fracción 0..1 del barrido: llamarlo
 * es lo que convierte la pieza en un instrumento y no en un adorno. La aguja va
 * en un grupo propio para que gire sobre su eje y no sobre el de la esfera.
 */
export function manometro(mat, opts = {}) {
  const { d = 0.24, divisiones = 10, barrido = Math.PI * 1.5, fondo = 0xf1ede2,
          color = 0xd6452f, racor = true } = opts;
  const R = d / 2, g = new THREE.Group();
  const caja = new THREE.Mesh(revolucion([
    [0, -R * 0.32], [R * 0.94, -R * 0.32], [R * 0.94, R * 0.02],
    [R, R * 0.04], [R, R * 0.15], [R * 0.87, R * 0.15],
    [R * 0.87, R * 0.06], [0, R * 0.06],
  ], { seg: 34 }), mat.acero);
  caja.rotation.x = Math.PI / 2; caja.castShadow = true; g.add(caja);
  // La esfera lleva algo de emisión propia: un manómetro se lee tambien cuando
  // le da la sombra, y una esfera que se apaga con la luz de la escena deja de
  // ser un instrumento y pasa a ser un adorno.
  const esf = new THREE.Mesh(new THREE.CircleGeometry(R * 0.87, 34),
    new THREE.MeshStandardMaterial({ color: fondo, roughness: 0.88, metalness: 0.02,
      emissive: fondo, emissiveIntensity: 0.42 }));
  esf.position.z = R * 0.055; g.add(esf);
  const tinta = new THREE.MeshBasicMaterial({ color: 0x232a31 });
  for (let i = 0; i <= divisiones; i++) {
    const a = Math.PI / 2 + barrido / 2 - (i / divisiones) * barrido;
    const largo = (i % 5 === 0) ? R * 0.22 : R * 0.12;
    const t = new THREE.Mesh(new THREE.BoxGeometry(R * 0.05, largo, R * 0.02), tinta);
    const rr = R * 0.78 - largo / 2;
    t.position.set(Math.cos(a) * rr, Math.sin(a) * rr, R * 0.062);
    t.rotation.z = a - Math.PI / 2; g.add(t);
  }
  const aguja = new THREE.Group(); aguja.position.z = R * 0.075; g.add(aguja);
  const ag = new THREE.Mesh(new THREE.BoxGeometry(R * 0.055, R * 0.76, R * 0.02),
    new THREE.MeshBasicMaterial({ color }));
  ag.position.y = R * 0.30; aguja.add(ag);
  const cubo = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.10, R * 0.10, R * 0.07, 14), mat.acero);
  cubo.rotation.x = Math.PI / 2; aguja.add(cubo);
  if (racor) {
    const hex = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.21, R * 0.21, R * 0.24, 6), mat.acero);
    hex.position.y = -R * 1.06; g.add(hex);
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.14, R * 0.14, R * 0.34, 14),
      mat.cromo || mat.acero);
    tb.position.y = -R * 1.34; g.add(tb);
  }
  g.userData.aguja = aguja;
  g.userData.marca = (f) => {
    aguja.rotation.z = barrido / 2 - Math.max(0, Math.min(1, f || 0)) * barrido;
  };
  g.userData.marca(0);
  g.userData.d = d;
  return g;
}

/**
 * CILINDRO de doble efecto, hidráulico o neumático. Lo que lo hace reconocible
 * no es el tubo: son los cuatro TIRANTES que unen las dos tapas —la presión
 * empuja las tapas hacia fuera y son los tirantes los que las sujetan; por eso
 * un cilindro de tirantes se puede desarmar y uno soldado no—, la brida del
 * cabezal por donde sale el vástago y las dos tomas, una a cada lado del émbolo.
 *
 * Eje en +Y, con el vástago saliendo por +Y. `userData.vastago` es el grupo que
 * se desplaza: ponerle `position.y = salida` es sacar el cilindro.
 */
export function cilindroHidraulico(mat, opts = {}) {
  const { d = 0.20, carrera = 0.40, vastago = 0.09, tirantes = 4,
          horquilla = true, tomas = true } = opts;
  const R = d / 2, rv = vastago / 2, g = new THREE.Group();
  const L = carrera + d * 0.85;
  const cam = new THREE.Mesh(revolucion([
    [R * 0.84, -L / 2], [R, -L / 2], [R, L / 2], [R * 0.84, L / 2]], { seg: 30 }), mat.acero);
  cam.castShadow = true; g.add(cam);
  for (const sy of [-1, 1]) {                       // las dos tapas
    // La de arriba va TALADRADA: por ahí sale el vástago, y ese agujero con su
    // reten es por donde un cilindro gastado empieza a gotear.
    const r0 = sy > 0 ? rv * 1.14 : 0;
    const t = new THREE.Mesh(revolucion([
      [r0, 0], [R * 1.16, 0], [R * 1.16, d * 0.16], [R * 0.90, d * 0.18], [r0, d * 0.18]],
      { seg: 26 }), mat.aluminio || mat.acero);
    t.position.y = sy * L / 2; t.rotation.z = sy > 0 ? 0 : Math.PI;
    t.castShadow = true; g.add(t);
  }
  for (let i = 0; i < tirantes; i++) {              // los tirantes
    const a = (i + 0.5) / tirantes * Math.PI * 2;
    const tt = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.045, d * 0.045, L + d * 0.36, 10),
      mat.acero);
    tt.position.set(Math.cos(a) * R * 1.03, 0, Math.sin(a) * R * 1.03); g.add(tt);
    for (const sy of [-1, 1]) {
      const tu = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.075, d * 0.075, d * 0.075, 6),
        mat.acero);
      tu.position.set(Math.cos(a) * R * 1.03, sy * (L / 2 + d * 0.20), Math.sin(a) * R * 1.03);
      g.add(tu);
    }
  }
  if (tomas) for (const sy of [-1, 1]) {            // una toma a cada lado del émbolo
    const bo = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.12, d * 0.12, d * 0.22, 12),
      mat.acero);
    bo.rotation.z = Math.PI / 2;
    bo.position.set(R * 1.05, sy * (L / 2 - d * 0.32), 0); g.add(bo);
    const co = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.075, d * 0.075, d * 0.20, 10),
      mat.cromo || mat.acero);
    co.position.set(R * 1.14, sy * (L / 2 - d * 0.32) + d * 0.10, 0); g.add(co);
  }
  const vas = new THREE.Group(); g.add(vas);
  const largoV = carrera + d * 0.62;
  const vr = new THREE.Mesh(new THREE.CylinderGeometry(rv, rv, largoV, 18), mat.cromo || mat.acero);
  vr.position.y = L / 2 + largoV / 2 - d * 0.30; vr.castShadow = true; vas.add(vr);
  if (horquilla) {                                  // la horquilla del extremo
    const yh = L / 2 + largoV - d * 0.30;
    for (const sz of [-1, 1]) {
      const o = new THREE.Mesh(extruido(contornoRedondeado(
        [[-rv * 1.5, 0], [rv * 1.5, 0], [rv * 1.5, rv * 3.2], [-rv * 1.5, rv * 3.2]], rv * 0.9, 4),
        { huecos: [circulo(0, rv * 2.2, rv * 0.8, 14)], espesor: rv * 0.7, bisel: rv * 0.08 }),
        mat.acero);
      o.position.set(0, yh, sz * rv * 1.1); vas.add(o);
    }
    const pi = new THREE.Mesh(new THREE.CylinderGeometry(rv * 0.75, rv * 0.75, rv * 3.4, 12),
      mat.acero);
    pi.rotation.x = Math.PI / 2; pi.position.set(0, yh + rv * 2.2, 0); vas.add(pi);
  }
  g.userData.vastago = vas; g.userData.carrera = carrera; g.userData.L = L;
  g.userData.d = d;
  return g;
}

/**
 * VÁLVULA DIRECCIONAL de corredera, con su base de montaje. Los SOLENOIDES no
 * son adorno: son por donde se manda, y el pulsador de emergencia que llevan en
 * la punta es la manera de mover la corredera con el dedo cuando no hay
 * corriente —comprobar con él si el problema es eléctrico o hidráulico es lo
 * primero que se hace en una avería—. Las tomas van por debajo, en la base,
 * porque es una válvula de placa: se cambia sin tocar la tubería.
 *
 * Cuerpo a lo largo de X. `userData.tomas` da los centros de los orificios.
 */
export function valvulaDireccional(mat, opts = {}) {
  const { ancho = 0.34, alto = 0.11, fondo = 0.12, vias = 5, solenoides = 2,
          base = true } = opts;
  const g = new THREE.Group();
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2]],
    alto * 0.16, 3), { espesor: fondo, bisel: alto * 0.05 }), mat.aluminio || mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  const tapa = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho * 0.30, -alto * 0.30], [ancho * 0.30, -alto * 0.30],
     [ancho * 0.30, alto * 0.30], [-ancho * 0.30, alto * 0.30]], alto * 0.12, 3),
    { espesor: fondo * 1.06, bisel: alto * 0.04 }), mat.acero);
  tapa.position.y = alto * 0.34; g.add(tapa);
  for (let i = 0; i < solenoides; i++) {
    const sx = i === 0 ? -1 : 1;
    const bob = new THREE.Mesh(revolucion([
      [0, 0], [alto * 0.52, 0], [alto * 0.52, alto * 0.90], [0, alto * 0.90]], { seg: 18 }),
      mat.negro || mat.acero);
    bob.rotation.z = -sx * Math.PI / 2;
    bob.position.x = sx * (ancho / 2 + alto * 0.06); g.add(bob);
    const nu = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.20, alto * 0.20, alto * 0.34, 12),
      mat.acero);
    nu.rotation.z = Math.PI / 2;
    nu.position.x = sx * (ancho / 2 + alto * 1.10); g.add(nu);
    // el pulsador de emergencia, en la punta
    const pu = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.08, alto * 0.08, alto * 0.16, 10),
      mat.rojo || mat.cromo || mat.acero);
    pu.rotation.z = Math.PI / 2;
    pu.position.x = sx * (ancho / 2 + alto * 1.34); g.add(pu);
    const con = conector(mat, { ancho: alto * 0.7, alto: alto * 0.6, fondo: alto * 0.5, pines: 2 });
    con.position.set(sx * (ancho / 2 + alto * 0.50), alto * 0.62, 0); g.add(con);
  }
  const tomas = [];
  if (base) {
    const b = new THREE.Mesh(extruido(contornoRedondeado(
      [[-ancho * 0.56, -alto * 0.30], [ancho * 0.56, -alto * 0.30],
       [ancho * 0.56, alto * 0.30], [-ancho * 0.56, alto * 0.30]], alto * 0.10, 3),
      { espesor: fondo * 1.30, bisel: alto * 0.04 }), mat.acero);
    b.position.y = -alto * 0.80; g.add(b);
    for (let i = 0; i < vias; i++) {
      const x = (-(vias - 1) / 2 + i) * (ancho * 0.96 / vias);
      const bo = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.16, alto * 0.16, alto * 0.30, 12),
        mat.cromo || mat.acero);
      bo.position.set(x, -alto * 1.22, 0); g.add(bo);
      tomas.push([x, -alto * 1.37, 0]);
    }
  }
  g.userData.tomas = tomas; g.userData.ancho = ancho;
  return g;
}

/**
 * BOMBA (o MOTOR) DE PISTONES AXIALES, en corte. Es la máquina de la que va
 * media hidráulica y la que peor se entiende cerrada: por fuera es un bidón.
 * Por dentro, un TAMBOR con siete pistones gira arrastrado por el eje, y cada
 * pistón apoya su patín sobre un PLATO INCLINADO que no gira. Cuanto más
 * inclinado está el plato, más carrera hace cada pistón por vuelta: el ángulo
 * del plato ES la cilindrada, y por eso una transmisión hidrostática no lleva
 * caja de cambios. Detrás, la placa de distribución con sus dos riñones separa
 * la mitad de la vuelta que aspira de la mitad que impulsa.
 *
 * Eje en +Z. `userData.plato` es el grupo del plato (girarlo en X cambia la
 * cilindrada) y `userData.tambor` el que gira con el eje.
 */
export function bombaPistones(mat, opts = {}) {
  const { d = 0.30, largo = 0.34, pistones = 7, angulo = 0.30, carcasa = true } = opts;
  const R = d / 2, g = new THREE.Group();
  const rp = R * 0.62;                    // círculo de centros de los pistones
  const rPis = R * 0.17;
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.13, R * 0.13, largo * 1.9, 18),
    mat.acero);
  eje.rotation.x = Math.PI / 2; g.add(eje);
  const tambor = new THREE.Group(); g.add(tambor);
  // El tambor va ABIERTO por el mismo lado que la carcasa. Entero, sus siete
  // pistones quedarían dentro del metal y no se vería ninguno: una bomba de
  // pistones cerrada es un bidón, y un bidón no explica de dónde sale el caudal.
  const tb = new THREE.Mesh(revolucion([
    [R * 0.14, -largo * 0.30], [R * 0.82, -largo * 0.30],
    [R * 0.82, largo * 0.30], [R * 0.14, largo * 0.30]],
    { seg: 30, fase: Math.PI * 1.29, arco: Math.PI * 1.42 }), mat.acero);
  const tc = tb.material.clone(); tc.side = THREE.DoubleSide; tb.material = tc;
  tb.rotation.x = Math.PI / 2; tambor.add(tb);
  for (let i = 0; i < pistones; i++) {
    const a = (i / pistones) * Math.PI * 2;
    const x = Math.cos(a) * rp, y = Math.sin(a) * rp;
    // La carrera de cada pistón sale del plato: z = y·tan(ángulo). Es la misma
    // cuenta que hace la máquina, y por eso el dibujo no puede inventarla.
    const z = -largo * 0.34 - y * Math.tan(angulo);
    const pi = new THREE.Mesh(new THREE.CylinderGeometry(rPis, rPis, largo * 0.62, 14),
      mat.cromo || mat.acero);
    pi.rotation.x = Math.PI / 2; pi.position.set(x, y, z + largo * 0.02); tambor.add(pi);
    const pat = new THREE.Mesh(revolucion([
      [0, 0], [rPis * 1.5, 0], [rPis * 1.5, largo * 0.05], [0, largo * 0.05]], { seg: 12 }),
      mat.cobre || mat.acero);
    pat.rotation.x = -Math.PI / 2;
    pat.position.set(x, y, z - largo * 0.30); tambor.add(pat);
  }
  const plato = new THREE.Group(); g.add(plato);
  const pl = new THREE.Mesh(revolucion([
    [0, 0], [R * 0.94, 0], [R * 0.94, largo * 0.10], [0, largo * 0.10]], { seg: 30 }), mat.acero);
  pl.rotation.x = -Math.PI / 2; plato.add(pl);
  plato.position.z = -largo * 0.44; plato.rotation.x = angulo;
  // La placa de distribución, con sus dos riñones.
  const pd = new THREE.Mesh(revolucion([
    [R * 0.16, 0], [R * 0.92, 0], [R * 0.92, largo * 0.09], [R * 0.16, largo * 0.09]], { seg: 30 }),
    mat.acero);
  pd.rotation.x = -Math.PI / 2; pd.position.z = largo * 0.40; g.add(pd);
  for (const s of [1, -1]) {
    const c = [];
    for (const [r, a0, a1, n] of [[rp * 1.24, 0.22, Math.PI - 0.22, 12],
                                  [rp * 0.76, Math.PI - 0.22, 0.22, 12]]) {
      c.push(...arco(0, 0, r, s * a0, s * a1, n));
    }
    const ri = new THREE.Mesh(extruido(c, { espesor: largo * 0.10, bisel: largo * 0.008 }),
      mat.negro || mat.acero);
    ri.position.z = largo * 0.415; g.add(ri);
  }
  if (carcasa) {
    const ca = new THREE.Mesh(revolucion([
      [R * 1.02, -largo * 0.62], [R * 1.12, -largo * 0.62],
      [R * 1.12, largo * 0.52], [R * 1.02, largo * 0.52]],
      // El hueco del corte mira ARRIBA una vez tumbada la carcasa sobre Z: en
      // el torno la fase 0 apunta a +Z, y al girar la pieza 90° sobre X ese +Z
      // acaba mirando a −Y. La fase se calcula, no se tantea.
      { seg: 34, fase: Math.PI * 1.29, arco: Math.PI * 1.42 }), mat.aluminio || mat.acero);
    const cc = ca.material.clone(); cc.side = THREE.DoubleSide; ca.material = cc;
    ca.rotation.x = Math.PI / 2; ca.castShadow = true; g.add(ca);
  }
  g.userData.plato = plato; g.userData.tambor = tambor;
  g.userData.inclina = (rad) => { plato.rotation.x = rad; };
  return g;
}

/**
 * DEPÓSITO de aceite con su NIVEL VISOR. El visor es la pieza: es lo único de
 * un depósito que se mira, y el nivel que marca es el que decide si la bomba
 * aspira aceite o aire. Lleva además su tapón de llenado con respiradero —un
 * depósito estanco se abolla al vaciarse— y su tapón de vaciado.
 *
 * `userData.nivel(f)` pone el aceite del visor en la fracción 0..1.
 */
export function deposito(mat, opts = {}) {
  const { ancho = 0.80, alto = 0.44, fondo = 0.50, nivel = 0.6,
          aceite = 0xd9a441 } = opts;
  const g = new THREE.Group();
  const cuba = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, 0], [ancho / 2, 0], [ancho / 2, alto], [-ancho / 2, alto]], alto * 0.06, 3),
    { espesor: fondo, bisel: alto * 0.02 }), mat.acero);
  cuba.castShadow = true; g.add(cuba);
  // el visor de nivel, en un costado, con su aceite dentro
  const zv = fondo / 2 + 0.004;
  const marco = new THREE.Mesh(new THREE.BoxGeometry(alto * 0.16, alto * 0.66, 0.012),
    mat.negro || mat.acero);
  marco.position.set(ancho * 0.34, alto * 0.50, zv); g.add(marco);
  const oil = new THREE.Mesh(new THREE.BoxGeometry(alto * 0.10, 1, 0.014),
    new THREE.MeshStandardMaterial({ color: aceite, roughness: 0.30, metalness: 0.10,
      emissive: aceite, emissiveIntensity: 0.16 }));
  oil.position.z = zv + 0.002; g.add(oil);
  const y0 = alto * 0.19, hv = alto * 0.62;
  g.userData.nivel = (f) => {
    const q = Math.max(0.02, Math.min(1, f));
    oil.scale.y = hv * q;
    oil.position.set(ancho * 0.34, y0 + hv * q / 2, zv + 0.002);
  };
  g.userData.nivel(nivel);
  // tapón de llenado con respiradero y tapón de vaciado
  const bo = new THREE.Mesh(revolucion([
    [0, 0], [alto * 0.13, 0], [alto * 0.13, alto * 0.10], [alto * 0.09, alto * 0.12], [0, alto * 0.12]],
    { seg: 16 }), mat.cromo || mat.acero);
  bo.position.set(-ancho * 0.30, alto, 0); g.add(bo);
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.06, alto * 0.06, alto * 0.08, 6),
    mat.acero);
  dr.position.set(ancho * 0.34, alto * 0.04, 0); g.add(dr);
  g.userData.alto = alto; g.userData.ancho = ancho;
  return g;
}

/**
 * ELEMENTO DE UNA UNIDAD FRL: filtro, lubricador o secador. Los tres comparten
 * el CABEZAL con sus dos tomas y se distinguen por lo que cuelga debajo: el
 * filtro lleva un vaso transparente con el elemento plisado y la purga; el
 * lubricador, un vaso con aceite y la cúpula por la que se ven caer las gotas
 * —contarlas es como se regula—; el secador, un cuerpo ciego con aletas.
 *
 * Eje en +Y, con el cabezal arriba y las tomas en ±X.
 */
export function vasoFRL(mat, opts = {}) {
  const { d = 0.16, alto = 0.30, tipo = 'filtro', purga = true } = opts;
  const R = d / 2, g = new THREE.Group();
  const cab = new THREE.Mesh(extruido(contornoRedondeado(
    [[-d * 0.62, -d * 0.26], [d * 0.62, -d * 0.26], [d * 0.62, d * 0.26], [-d * 0.62, d * 0.26]],
    d * 0.08, 3), { espesor: d * 0.86, bisel: d * 0.03 }), mat.aluminio || mat.acero);
  cab.position.y = alto * 0.86; cab.castShadow = true; g.add(cab);
  for (const sx of [-1, 1]) {
    const to = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, d * 0.26, 12),
      mat.cromo || mat.acero);
    to.rotation.z = Math.PI / 2; to.position.set(sx * d * 0.72, alto * 0.86, 0); g.add(to);
  }
  if (tipo === 'secador') {
    const cu = new THREE.Mesh(revolucion([
      [0, 0], [R, 0], [R, alto * 0.72], [0, alto * 0.72]], { seg: 24 }), mat.aluminio || mat.acero);
    g.add(cu);
    for (let i = 0; i < 7; i++) {
      const al = new THREE.Mesh(revolucion([
        [R, 0], [R * 1.22, 0], [R * 1.22, alto * 0.018], [R, alto * 0.018]], { seg: 24 }),
        mat.aluminio || mat.acero);
      al.position.y = alto * (0.08 + i * 0.085); g.add(al);
    }
  } else {
    const vidrio = new THREE.MeshStandardMaterial({ color: 0xbcd6e4, roughness: 0.10,
      metalness: 0.02, transparent: true, opacity: 0.26, side: THREE.DoubleSide });
    const vaso = new THREE.Mesh(revolucion([
      [R * 0.86, alto * 0.10], [R, alto * 0.10], [R, alto * 0.76], [R * 0.86, alto * 0.76]],
      { seg: 26 }), vidrio);
    g.add(vaso);
    const fon = new THREE.Mesh(revolucion([
      [0, alto * 0.04], [R, alto * 0.04], [R, alto * 0.12], [0, alto * 0.12]], { seg: 26 }),
      mat.acero);
    g.add(fon);
    // la jaula que protege el vaso: sin ella, un vaso de plástico a 10 bar es
    // una granada, y por eso todos los vasos llevan una
    for (let i = 0; i < 6; i++) {
      const a = (i / 6) * Math.PI * 2;
      const b = new THREE.Mesh(new THREE.BoxGeometry(R * 0.10, alto * 0.66, R * 0.10),
        mat.acero);
      b.position.set(Math.cos(a) * R * 1.02, alto * 0.43, Math.sin(a) * R * 1.02); g.add(b);
    }
    if (tipo === 'lubricador') {
      const oil = new THREE.Mesh(revolucion([
        [0, alto * 0.12], [R * 0.90, alto * 0.12], [R * 0.90, alto * 0.42], [0, alto * 0.42]],
        { seg: 24 }), new THREE.MeshStandardMaterial({ color: 0xd9a441, roughness: 0.28,
          metalness: 0.08, transparent: true, opacity: 0.85 }));
      g.add(oil);
      const cup = new THREE.Mesh(new THREE.SphereGeometry(R * 0.34, 16, 12, 0, Math.PI * 2, 0, Math.PI / 2),
        vidrio);
      cup.position.y = alto * 0.80; g.add(cup);
    } else {
      const el = filtroPlisado({ papel: mat.papel || mat.blanco || mat.aluminio },
        { rExt: R * 0.74, rInt: R * 0.42, alto: alto * 0.52, pliegues: 26 });
      el.position.y = alto * 0.42; g.add(el);
    }
    if (purga) {
      const pu = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.16, R * 0.16, alto * 0.10, 10),
        mat.negro || mat.acero);
      pu.position.y = alto * 0.02; g.add(pu);
    }
  }
  g.userData.alto = alto; g.userData.d = d;
  return g;
}

/**
 * REGULADOR DE PRESIÓN de membrana. Lo que hay que reconocer es el SOMBRERETE
 * —la campana que aloja el muelle y la membrana— y el mando que lo comprime:
 * girar el mando no ajusta ninguna presión directamente, aprieta un muelle, y
 * el equilibrio entre ese muelle y la presión de salida es lo que fija el
 * valor. Por eso la presión regulada CAE cuando aumenta el caudal: es el
 * «droop», y sale de que el muelle se relaja al abrirse la válvula.
 */
export function reguladorPresion(mat, opts = {}) {
  const { d = 0.16, alto = 0.30 } = opts;
  const R = d / 2, g = new THREE.Group();
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado(
    [[-d * 0.62, -d * 0.26], [d * 0.62, -d * 0.26], [d * 0.62, d * 0.26], [-d * 0.62, d * 0.26]],
    d * 0.08, 3), { espesor: d * 0.86, bisel: d * 0.03 }), mat.aluminio || mat.acero);
  cuerpo.castShadow = true; g.add(cuerpo);
  for (const sx of [-1, 1]) {
    const to = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, d * 0.26, 12),
      mat.cromo || mat.acero);
    to.rotation.z = Math.PI / 2; to.position.x = sx * d * 0.72; g.add(to);
  }
  const somb = new THREE.Mesh(revolucion([
    [0, d * 0.24], [R * 1.10, d * 0.26], [R * 1.10, alto * 0.44],
    [R * 0.98, alto * 0.48], [R * 0.98, alto * 0.54],
    [R * 0.34, alto * 0.58], [R * 0.34, alto * 0.62], [0, alto * 0.62]], { seg: 24 }),
    mat.aluminio || mat.acero);
  somb.castShadow = true; g.add(somb);
  const mando = new THREE.Mesh(revolucion([
    [0, alto * 0.64], [R * 0.68, alto * 0.68], [R * 0.68, alto * 0.96],
    [R * 0.50, alto * 1.00], [0, alto * 1.00]], { seg: 20 }), mat.negro || mat.acero);
  g.add(mando);
  for (let i = 0; i < 12; i++) {                     // el moleteado del mando
    const a = (i / 12) * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(R * 0.08, alto * 0.26, R * 0.08),
      mat.negro || mat.acero);
    m.position.set(Math.cos(a) * R * 0.68, alto * 0.82, Math.sin(a) * R * 0.68);
    m.rotation.y = -a; g.add(m);
  }
  g.userData.mando = mando; g.userData.alto = alto;
  return g;
}

/**
 * VENTOSA de fuelle. Los pliegues no son decoración: son lo que le deja bajar
 * sobre una pieza que no está a la altura prevista y lo que le permite agarrar
 * una superficie inclinada. Y el labio, que es lo único que sella, es la parte
 * que se gasta: una ventosa vieja no agarra menos porque tire menos la bomba,
 * sino porque el labio ya no cierra.
 *
 * Boca hacia −Y, racor hacia +Y.
 */
export function ventosa(mat, opts = {}) {
  const { d = 0.10, fuelles = 2, racor = true } = opts;
  const R = d / 2, g = new THREE.Group();
  const p = [[0, 0], [R * 0.30, 0], [R * 0.30, R * 0.30]];
  let y = R * 0.30;
  for (let i = 0; i < fuelles; i++) {
    p.push([R * 0.62, y + R * 0.12], [R * 0.34, y + R * 0.30]);
    y += R * 0.34;
  }
  p.push([R * 0.52, y + R * 0.22], [R * 0.98, y + R * 0.62], [R, y + R * 0.70], [R * 0.86, y + R * 0.70]);
  const goma = new THREE.Mesh(revolucion(p, { seg: 26 }), mat.goma || mat.negro || mat.acero);
  goma.rotation.z = Math.PI;                       // la boca, hacia abajo
  goma.castShadow = true; g.add(goma);
  if (racor) {
    const hx = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, R * 0.26, 6), mat.acero);
    hx.position.y = R * 0.14; g.add(hx);
    const tb = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.20, R * 0.20, R * 0.50, 12),
      mat.cromo || mat.acero);
    tb.position.y = R * 0.48; g.add(tb);
  }
  g.userData.d = d; g.userData.alturaBoca = -(y + R * 0.70);
  return g;
}
