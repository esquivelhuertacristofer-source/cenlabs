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

/**
 * BOBINA DE ENCENDIDO DE LÁPIZ (bobina sobre bujía, COP): el conector de tres
 * vías arriba, el cuerpo de plástico con su brida de sujeción, y abajo la BOTA
 * de goma que baja al pozo de la bujía.
 *
 * La bota es la pieza que hay que reconocer. Es lo que distingue esta bobina de
 * un cilindro cualquiera: dentro lleva el muelle que entrega los ~25 kV al
 * electrodo, y por fuera es el faldón que sella el pozo para que la chispa no
 * se vaya a masa por el aceite o el agua que se acumulan ahí. Quien diagnostica
 * un fallo de encendido tira JUSTO de esta pieza —la desenchufa, la saca del
 * pozo y mira la bujía—, así que un laboratorio de fallo de encendido que
 * dibuje cilindros lisos está escondiendo el gesto que enseña.
 *
 * Eje +Y: la punta de la bota apoya en y = 0 (la cara de la tapa de balancines)
 * y la bobina sube. `userData.pozoY` es la profundidad a la que quedaría la
 * bujía si el laboratorio quiere dibujarla debajo.
 */
export function bobinaEncendido(mat, opts = {}) {
  const { alto = 0.42, d = 0.075, color = 0x2a3038, brida = true, seg = 20 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const plas = new THREE.MeshStandardMaterial({ color, roughness: 0.56, metalness: 0.06 });
  const gom = mat.goma || new THREE.MeshStandardMaterial({ color: 0x0f1216, roughness: 0.94, metalness: 0.0 });
  /* LA BOTA: faldón acampanado abajo y cuello estrecho arriba. */
  const bot = new THREE.Mesh(revolucion([
    [0, 0], [R * 0.96, 0], [R * 1.04, alto * 0.04], [R * 0.80, alto * 0.13],
    [R * 0.62, alto * 0.22], [R * 0.60, alto * 0.32], [0, alto * 0.32]], { seg }), gom);
  bot.castShadow = true; g.add(bot);
  /* EL CUERPO, con el hombro por el que se agarra al tirar. */
  const cue = new THREE.Mesh(revolucion([
    [0, alto * 0.26], [R * 0.64, alto * 0.26], [R * 0.98, alto * 0.38],
    [R, alto * 0.86], [R * 0.88, alto * 0.94], [0, alto * 0.94]], { seg }), plas);
  cue.castShadow = true; g.add(cue);
  /* LA BRIDA con su taladro y el tornillo: una bobina no se sujeta sola en el
     pozo, se atornilla a la tapa, y sin la oreja no se ve por dónde. */
  if (brida) {
    const or = new THREE.Mesh(extruido(contornoRedondeado(
      [[-R * 0.5, -R * 0.62], [R * 2.5, -R * 0.62], [R * 2.5, R * 0.62], [-R * 0.5, R * 0.62]],
      R * 0.5, 3), { huecos: [circulo(R * 1.75, 0, R * 0.42, 12)], espesor: R * 0.44, bisel: R * 0.05 }),
      plas);
    or.rotation.x = Math.PI / 2; or.position.y = alto * 0.40; g.add(or);
    const tor = tornilloHex(mat, { d: R * 0.52, largo: R * 0.6, arandela: false });
    tor.position.set(R * 1.75, alto * 0.40 + R * 0.22, 0); g.add(tor);
  }
  const con = conector(mat, { ancho: d * 1.55, alto: d * 0.86, fondo: d * 0.72, pines: 3 });
  con.position.y = alto * 0.98; con.rotation.x = -Math.PI / 2; g.add(con);
  g.userData = { alto, d, cuerpo: cue, bota: bot, conector: con,
                 pozoY: -alto * 0.30, salida: new THREE.Vector3(0, alto * 1.06, 0) };
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
 * TAPA DEL VENTILADOR: el sombrerete con rejilla que cierra el lado opuesto al
 * accionamiento de casi cualquier motor, con el ventilador dentro.
 *
 * Es, junto con las aletas, la silueta por la que se reconoce un motor a diez
 * metros. Y dice algo que importa: el motor se enfria con SU PROPIO
 * ventilador, calado al eje —por eso a media velocidad ventila la mitad, que es
 * justo el problema de un motor con variador—. Eje +X, saliendo del origen.
 */
export function tapaVentilador(mat, opts = {}) {
  const { d = 0.62, largo = 0.22, radios = 8, aspas = 7, seg = 32,
          ventilador = true } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = mat.aluminio || mat.acero;
  const mch = mat.chapa || met;
  const fal = new THREE.Mesh(
    new THREE.CylinderGeometry(R, R * 0.95, largo * 0.80, seg, 1, true), mch);
  const mm = fal.material.clone(); mm.side = THREE.DoubleSide; fal.material = mm;
  fal.rotation.z = Math.PI / 2; fal.position.x = largo * 0.40; fal.castShadow = true;
  g.add(fal);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(R * 0.94, d * 0.020, 8, seg), mch);
  aro.rotation.y = Math.PI / 2; aro.position.x = largo * 0.80; g.add(aro);
  for (let i = 0; i < radios; i++) {
    const a = (i / radios) * Math.PI;
    const rb = new THREE.Mesh(new THREE.BoxGeometry(d * 0.018, R * 1.86, d * 0.026), mch);
    rb.rotation.x = a; rb.position.x = largo * 0.80; g.add(rb);
  }
  const cub = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.20, R * 0.20, d * 0.05, 14), mch);
  cub.rotation.z = Math.PI / 2; cub.position.x = largo * 0.80; g.add(cub);
  let rot = null;
  if (ventilador) {
    const neg = mat.negro || mat.goma || mch;
    // El ventilador va en SU PROPIO grupo, centrado en el eje: así el
    // laboratorio puede hacerlo girar con el eje y no con la carcasa.
    rot = new THREE.Group(); g.add(rot);
    const buje = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.24, R * 0.24, largo * 0.32, 14), neg);
    buje.rotation.z = Math.PI / 2; buje.position.x = largo * 0.34; rot.add(buje);
    for (let i = 0; i < aspas; i++) {
      const a = (i / aspas) * Math.PI * 2;
      const as = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.26, R * 0.62, d * 0.020), neg);
      as.position.set(largo * 0.34, Math.cos(a) * R * 0.54, Math.sin(a) * R * 0.54);
      as.rotation.x = -a; as.rotation.y = 0.55; rot.add(as);
    }
  }
  g.userData = { d, largo, rotor: rot };
  return g;
}

/**
 * MÁQUINA ELÉCTRICA COMPLETA, vista por fuera: carcasa con aletas, patas y caja
 * de bornes, tapa del ventilador con su rejilla, eje saliendo por el lado de
 * accionamiento y placa de datos.
 *
 * Un cilindro liso con un disco pegado no es un motor: es un bote. Lo que
 * distingue a un motor de un bote son las ALETAS —la superficie por donde
 * evacúa lo que no convierte en par—, la TAPA DEL VENTILADOR, las PATAS por
 * donde se atornilla a la bancada y la CAJA DE BORNES por donde entra la
 * alimentación. Ninguna de las cuatro es decorativa. Eje X; el eje de salida
 * sale por +X.
 */
export function maquinaElectrica(mat, opts = {}) {
  const { d = 0.60, largo = 0.90, aletas = 16, patas = true, bornes = true,
          ventilador = true, eje = 0.34, dEje = null, placa = true } = opts;
  const g = new THREE.Group();
  g.add(carcasaMotor(mat, { d, largo, nAletas: aletas, patas, bornes }));
  const R = d / 2, De = dEje || d * 0.14;
  const met = mat.acero || mat.cromo || mat.aluminio;
  // Todo lo que GIRA va en un grupo aparte, centrado en el eje X: el eje con su
  // chavetero y el ventilador. Así el laboratorio hace girar lo que gira y deja
  // quieto lo que no —que es la carcasa—.
  const gir = new THREE.Group(); g.add(gir);
  const ej = new THREE.Mesh(new THREE.CylinderGeometry(De / 2, De / 2, eje, 16), met);
  ej.rotation.z = Math.PI / 2; ej.position.x = largo / 2 + eje / 2 - d * 0.02;
  ej.castShadow = true; gir.add(ej);
  const cha = new THREE.Mesh(new THREE.BoxGeometry(eje * 0.34, De * 0.22, De * 0.34), met);
  cha.position.set(largo / 2 + eje * 0.72, De * 0.52, 0); gir.add(cha);   // el chavetero
  let vent = null;
  if (ventilador) {
    const t = tapaVentilador(mat, { d: d * 1.02, largo: d * 0.34 });
    t.rotation.y = Math.PI; t.position.x = -largo / 2 - d * 0.01; g.add(t);
    vent = t.userData.rotor;
  }
  if (placa) {
    const a = -0.95;
    const pl = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.30, d * 0.20, d * 0.012),
      mat.blanco || mat.aluminio);
    pl.position.set(0, Math.cos(a) * (R + d * 0.055), Math.sin(a) * (R + d * 0.055));
    pl.rotation.x = -a; g.add(pl);
    g.userData.placa = pl;
  }
  g.userData.d = d; g.userData.largo = largo;
  g.userData.eje = { x: largo / 2 + eje - d * 0.02, d: De };
  g.userData.rotor = gir;
  /* `gira(a)` pone el eje Y EL VENTILADOR en el mismo ángulo. El ventilador
     está calado al eje: si el motor gira, ventila, y si va a la mitad de
     velocidad, ventila la mitad. La tapa está girada media vuelta, así que su
     ángulo es el contrario. */
  g.userData.gira = (a) => { gir.rotation.x = a; if (vent) vent.rotation.x = -a; };
  g.userData.frente = largo / 2 + eje - d * 0.02;
  g.userData.cola = -largo / 2 - d * 0.01 - d * 0.34;
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
 * RUEDA FÓNICA: la corona dentada que pasa por delante del captador. Los
 * dientes SON la señal —cada uno da un pulso, y la cuenta de pulsos por vuelta
 * fija la resolución del sistema—. Un aro liso no da ninguna señal, y dibujarlo
 * liso deja el laboratorio sin explicar de dónde sale la medida.
 *
 * `falta` quita ese número de dientes seguidos. En una rueda de ABS no falta
 * ninguno; en la del cigüeñal de un motor faltan DOS de sesenta, y ese hueco no
 * es un defecto: es la única marca angular que tiene el eje, la referencia por
 * la que la centralita sabe en qué vuelta y en qué grado está. Sin el hueco, la
 * rueda no dice dónde está el punto muerto superior y el dibujo se calla justo
 * lo que hace falta explicar. El eje de giro es +X.
 */
export function ruedaFonica(mat, opts = {}) {
  const { d = 0.92, dientes = 48, alto = 0.05, ancho = 0.04, falta = 0 } = opts;
  const R = d / 2, c = [];
  for (let i = 0; i < dientes; i++) {
    const a0 = (i / dientes) * Math.PI * 2, p = Math.PI * 2 / dientes;
    const hueco = i < falta;                 // los que faltan, seguidos, al inicio
    const tramos = hueco
      ? [[0, R - alto], [p, R - alto]]
      : [[0, R], [p * 0.5, R], [p * 0.5, R - alto], [p, R - alto]];
    for (const [t, r] of tramos) {
      c.push([Math.cos(a0 + t) * r, Math.sin(a0 + t) * r]);
    }
  }
  const cor = new THREE.Mesh(extruido(c, { espesor: ancho, bisel: ancho * 0.10, curvaSeg: 2 }),
    mat.acero);
  cor.rotation.y = Math.PI / 2; cor.castShadow = true;
  const g = new THREE.Group(); g.add(cor);
  g.userData.dientes = dientes; g.userData.d = d; g.userData.falta = falta;
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
 * TRANSFORMADOR E-I MONTADO: el de una fuente de banco, entero. Núcleo E-I de
 * chapas, CARRETE PARTIDO con el primario y el secundario cada uno en su hueco
 * —sobre EL MISMO hierro— y fleje de sujeción con patas para atornillarlo.
 *
 * Un taco con dos cilindros pegados a los lados no dice de dónde sale la
 * tensión del secundario. Lo que la explica es que los dos devanados abrazan la
 * MISMA columna de hierro: por ahí pasa el flujo que induce en uno lo que se
 * mete por el otro. Si los devanados están dibujados fuera del núcleo, el
 * dibujo enseña justo lo contrario de lo que hay que entender.
 */
export function transformadorEI(mat, opts = {}) {
  const { ancho = 0.30, alto = 0.34, prof = 0.22, chapas = 9, vueltas = 7,
          hilo = 0.009, primario = 0xb87333, secundario = 0x8a5a2c,
          fleje = true, carrete = 0x14181e } = opts;
  const g = new THREE.Group();
  const nuc = nucleoEI(mat, { ancho, alto, prof, chapas });
  g.add(nuc);
  const brazo = nuc.userData.brazo;
  const t = ancho * 0.26, b = alto * 0.24, ventana = alto / 2 - b * 1.5;
  const largoBrazo = ancho - t;
  const flanY = b / 2 + ventana * 0.94, flanZ = prof / 2 + prof * 0.16;
  const hueY = b / 2 + alto * 0.014, hueZ = prof / 2 + prof * 0.04;
  const matC = new THREE.MeshStandardMaterial({ color: carrete, roughness: 0.66, metalness: 0.04 });
  for (const dx of [-largoBrazo * 0.45, 0, largoBrazo * 0.45]) {
    const f = new THREE.Mesh(extruido(
      [[-flanZ, -flanY], [flanZ, -flanY], [flanZ, flanY], [-flanZ, flanY]],
      { huecos: [[[-hueZ, -hueY], [hueZ, -hueY], [hueZ, hueY], [-hueZ, hueY]]],
        espesor: largoBrazo * 0.055, bisel: largoBrazo * 0.009 }), matC);
    f.rotation.y = Math.PI / 2;
    f.position.set(brazo.x + dx, brazo.y, 0);
    g.add(f);
  }
  const coilY = 2 * (b / 2 + ventana * 0.72) - hilo * 4;
  const coilZ = prof * 1.08;
  [[-largoBrazo * 0.225, primario], [largoBrazo * 0.225, secundario]].forEach(([dx, col]) => {
    const w = bobinaCampo(
      { cobre: new THREE.MeshStandardMaterial({ color: col, roughness: 0.38, metalness: 0.72 }) },
      { ancho: coilY, prof: coilZ, alto: largoBrazo * 0.39, vueltas, hilo, capas: 2, seg: 4 });
    w.rotation.z = -Math.PI / 2;
    w.position.set(brazo.x + dx, brazo.y, 0);
    g.add(w);
  });
  let base = -alto / 2;
  if (fleje) {
    const mch = mat.chapa || mat.acero || mat.aluminio;
    const e = alto * 0.047;
    const fl = new THREE.Mesh(new THREE.BoxGeometry(ancho * 1.40, e, prof * 1.36), mch);
    fl.position.y = -alto / 2 - e / 2; g.add(fl);
    for (const sx of [-1, 1]) {
      const pa = new THREE.Mesh(new THREE.BoxGeometry(e, alto * 0.47, prof * 1.18), mch);
      pa.position.set(sx * (ancho + t) / 2 * 0.90, -alto * 0.29, 0); g.add(pa);
    }
    base = -alto / 2 - e;
  }
  g.traverse(o => { if (o.isMesh) o.castShadow = true; });
  g.userData = { ancho, alto, prof, base, brazo, salida: { x: (ancho + t) / 2, y: -b, z: prof * 0.32 } };
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
          pilotos = 0, base = true } = opts;
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
  /* TAPAS DE PILOTAJE. Una válvula pilotada por AIRE no lleva bobina: lleva una
     tapa con su racor, y la orden le llega por un tubo en vez de por un cable.
     En un mando en cascada esa es toda la diferencia —lo que conmuta la memoria
     es la línea de presión del grupo—, así que dibujarle solenoides sería decir
     que el mando es eléctrico cuando no lo es. */
  const pilotosPos = [];
  for (let i = 0; i < pilotos; i++) {
    const sx = i === 0 ? -1 : 1;
    const cap = new THREE.Mesh(revolucion([
      [0, 0], [alto * 0.44, 0], [alto * 0.44, alto * 0.62],
      [alto * 0.34, alto * 0.74], [0, alto * 0.74]], { seg: 18 }),
      mat.aluminio || mat.acero);
    cap.rotation.z = -sx * Math.PI / 2;
    cap.position.x = sx * (ancho / 2 + alto * 0.03); g.add(cap);
    const rac = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.13, alto * 0.15, alto * 0.30, 12),
      mat.negro || mat.acero);
    rac.rotation.z = Math.PI / 2;
    rac.position.x = sx * (ancho / 2 + alto * 0.90); g.add(rac);
    pilotosPos.push([sx * (ancho / 2 + alto * 1.05), 0, 0]);
  }
  g.userData.pilotos = pilotosPos;

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


/**
 * TIRA DE PINES macho, el conector de 2,54 mm de toda placa: base de plastico
 * negro y pines de seccion CUADRADA, no redondos. Son cuadrados porque asi
 * muerden el contacto elastico del conector hembra y porque asi se les puede
 * enganchar una pinza sin que resbale — que es exactamente lo que se hace para
 * pinchar un bus. Convenio §11: la cara de la placa es y = 0 y las patas bajan.
 */
export function tiraPines(mat, opts = {}) {
  const { n = 4, filas = 1, paso = 0.10, alto = 0.06, pin = 0.09, patas = 0.05,
          cuerpo = 0x14171b } = opts;
  const g = new THREE.Group();
  const met = mat.cobre || mat.acero || mat.aluminio;
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.66, metalness: 0.05 });
  const W = n * paso, D = filas * paso;
  const base = new THREE.Mesh(new THREE.BoxGeometry(W, alto, D), matC);
  base.position.y = alto / 2; base.castShadow = true; g.add(base);
  const e = paso * 0.24;                              // el lado del pin cuadrado
  const pines = [];
  for (let i = 0; i < n; i++) for (let j = 0; j < filas; j++) {
    const x = (i - (n - 1) / 2) * paso, z = (j - (filas - 1) / 2) * paso;
    const pn = new THREE.Mesh(new THREE.BoxGeometry(e, pin, e), met);
    pn.position.set(x, alto + pin / 2, z); pn.castShadow = true; g.add(pn);
    pines.push(pn);                       // el laboratorio los enciende uno a uno
    if (patas > 0) {
      const pt = new THREE.Mesh(new THREE.BoxGeometry(e, patas, e), met);
      pt.position.set(x, -patas / 2, z); g.add(pt);
    }
  }
  g.userData = { n, filas, paso, alto, pin, ancho: W, fondo: D, pines,
    punta: (i, j = 0) => new THREE.Vector3(
      (i - (n - 1) / 2) * paso, alto + pin, (j - (filas - 1) / 2) * paso) };
  return g;
}

/**
 * PINZA DE GARRA (grabber) de punta de prueba: el cuerpo de plastico del color
 * del canal, el GANCHO metalico que sale por la punta y el aro por el que
 * asoma. Es la pieza que convierte un cable suelto en una conexion que se queda
 * puesta: el gancho se retrae con el embolo, se engancha en el pin y ahi se
 * queda mientras dura la captura. Eje +Y: el gancho MUERDE en y = 0 y el cable
 * sale por arriba.
 */
export function pinzaGarra(mat, opts = {}) {
  const { largo = 0.16, d = 0.030, color = 0xd8a12a, seg = 12 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = mat.acero || mat.aluminio || mat.cromo;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.10 });
  const cue = new THREE.Mesh(revolucion([
    [0, largo * 0.24], [R * 0.50, largo * 0.24], [R, largo * 0.36],
    [R, largo * 0.86], [R * 0.72, largo], [0, largo]], { seg }), matC);
  cue.castShadow = true; g.add(cue);
  const emb = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.52, R * 0.52, largo * 0.24, seg), met);
  emb.position.y = largo * 1.06; g.add(emb);
  /* EL GANCHO en J: sale por la punta, baja, se curva y vuelve a subir. Ese
     rizo es lo que abraza el pin y lo que hace que la pinza se quede puesta;
     un arco escondido dentro del cuerpo no sujetaria nada. */
  const gan = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    new THREE.Vector3(0, largo * 0.26, 0),
    new THREE.Vector3(0, largo * 0.07, 0),
    new THREE.Vector3(R * 0.32, largo * 0.005, 0),
    new THREE.Vector3(R * 1.10, largo * 0.02, 0),
    new THREE.Vector3(R * 1.48, largo * 0.10, 0),
    new THREE.Vector3(R * 1.22, largo * 0.20, 0),
  ], false), 26, R * 0.17, 6, false), met);
  gan.castShadow = true; g.add(gan);
  g.userData = { largo, d, color, salida: new THREE.Vector3(0, largo * 1.18, 0) };
  return g;
}

/* ==========================================================================
   §12 · MEDIDA DE TEMPERATURA
   --------------------------------------------------------------------------
   Un termopar dibujado como una bolita y una RTD dibujada como un tubo liso
   dejan fuera justo lo que se ensena: que el termopar MIDE EN LA UNION de dos
   metales distintos —y por eso cualquier empalme de mas es otra union—, que la
   sonda se agarra por su CABEZAL y no por el cable, y que el conector de
   termopar esta POLARIZADO —una pala mas ancha que la otra— porque invertirlo
   invierte el signo de la medida.
   Convenio: eje +Y, con la PUNTA en y = 0. La sonda crece hacia +Y.
   ========================================================================== */

/**
 * SONDA DE VAINA (RTD Pt100, termopar de vaina, termistor de proceso): la
 * VAINA de acero con la PUNTA REDONDEADA que es lo unico que toca la pieza, el
 * CABEZAL de transicion —el manguito donde la vaina se une al cable, la parte
 * por la que se agarra— y el MUELLE ANTITIRONES, que esta ahi porque el cable
 * se rompe siempre en ese punto y no en otro.
 */
export function sondaTemperatura(mat, opts = {}) {
  const { largo = 0.50, d = 0.09, cabezal = true, muelle = true, seg = 20 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = mat.acero || mat.aluminio || mat.cromo;
  const gom = mat.goma || mat.negro || met;
  const va = new THREE.Mesh(revolucion(
    [[0, 0], [R * 0.55, R * 0.14], [R * 0.87, R * 0.48], [R, R], [R, largo], [0, largo]],
    { seg }), met);
  va.castShadow = true; g.add(va);
  let y = largo;
  if (cabezal) {
    const hc = d * 0.95;
    const ca = new THREE.Mesh(new THREE.CylinderGeometry(R * 2.0, R * 2.0, hc, 6), met);
    ca.position.y = y + hc / 2; ca.castShadow = true; g.add(ca);
    const co = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.35, R * 1.35, hc * 0.42, seg), met);
    co.position.y = y + hc + hc * 0.21; g.add(co);
    y += hc * 1.42;
  }
  if (muelle) {
    const hm = d * 1.9, N = 7, SEG = 14, pts = [];
    for (let i = 0; i <= N * SEG; i++) {
      const t = i / (N * SEG), a = t * Math.PI * 2 * N;
      pts.push(new THREE.Vector3(Math.cos(a) * R * 0.74, y + t * hm, Math.sin(a) * R * 0.74));
    }
    const mu = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts, false), N * SEG, R * 0.17, 6, false), gom);
    mu.castShadow = true; g.add(mu);
    y += hm;
  }
  g.userData = { largo, d, alto: y, punta: new THREE.Vector3(0, 0, 0),
                 salida: new THREE.Vector3(0, y, 0) };
  return g;
}

/**
 * UNION DE TERMOPAR de bolita soldada: los DOS HILOS de aleaciones distintas,
 * TRENZADOS entre si y fundidos en una PERLA. La perla es el sensor entero —no
 * hay nada mas— y que sean dos hilos de metales distintos que se tocan en un
 * solo punto es literalmente el efecto Seebeck dibujado. Un cable trenzado con
 * dos colores tambien dice cual es cual sin leer nada.
 */
export function unionTermopar(mat, opts = {}) {
  const { d = 0.09, hilo = 0.016, largo = 0.30, vueltas = 3.5,
          colorA = 0xc8b560, colorB = 0xb9c2cb, seg = 16 } = opts;
  const g = new THREE.Group();
  const met = mat.acero || mat.aluminio || mat.cromo;
  const per = new THREE.Mesh(new THREE.SphereGeometry(d / 2, seg, Math.max(8, seg / 2)), met);
  per.castShadow = true; g.add(per);
  const y0 = d * 0.30, rt = hilo * 0.95, N = Math.max(24, Math.round(vueltas * 12));
  for (const [fase, col] of [[0, colorA], [Math.PI, colorB]]) {
    const pts = [];
    for (let i = 0; i <= N; i++) {
      const t = i / N, a = fase + t * Math.PI * 2 * vueltas;
      const r = rt * Math.min(1, t * 6);          // los dos hilos NACEN de la perla
      pts.push(new THREE.Vector3(Math.cos(a) * r, y0 + t * (largo - y0), Math.sin(a) * r));
    }
    const h = new THREE.Mesh(new THREE.TubeGeometry(
      new THREE.CatmullRomCurve3(pts, false), N, hilo / 2, 6, false),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.42, metalness: 0.65 }));
    h.castShadow = true; g.add(h);
  }
  g.userData = { d, largo, punta: new THREE.Vector3(0, 0, 0),
                 salida: new THREE.Vector3(0, largo, 0) };
  return g;
}

/**
 * CONECTOR MINIATURA DE TERMOPAR, enchufado en su base: cuerpo plano de plastico
 * del color de la norma —verde para tipo K en IEC 60584-3— y las DOS PALAS
 * PLANAS, una MAS ANCHA que la otra. Esa diferencia de anchura no es un
 * capricho de fabricacion: es lo unico que impide meterlo del reves, y meterlo
 * del reves invierte el signo de la medida. Ahi dentro, en las palas, es donde
 * esta la UNION DE REFERENCIA que la compensacion de junta fria tiene que medir.
 * Eje +Z: el origen se pone EN LA CARA del panel y el cuerpo crece hacia +Z.
 */
export function conectorTermopar(mat, opts = {}) {
  const { ancho = 0.19, alto = 0.12, fondo = 0.20, color = 0x2e8b57, pala = 0.09 } = opts;
  const g = new THREE.Group();
  const met = mat.acero || mat.aluminio || mat.cromo;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.04 });
  const hueco = pala * 0.30;                       // el trozo de pala que se ve
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2]],
    alto * 0.16, 3), { espesor: fondo, bisel: fondo * 0.06 }), matC);
  cue.position.z = hueco + fondo / 2; cue.castShadow = true; g.add(cue);
  const esp = alto * 0.16;
  [[-ancho * 0.22, ancho * 0.30], [ancho * 0.24, ancho * 0.22]].forEach(([x, w]) => {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(w, esp, pala + hueco), met);
    pa.position.set(x, 0, (hueco - pala) / 2); g.add(pa);
  });
  g.userData = { ancho, alto, fondo, palas: hueco,
                 salida: new THREE.Vector3(0, 0, hueco + fondo) };
  return g;
}

/**
 * PISTOLA DE INFRARROJOS. Lo que la hace una pistola —y no una caja con mango—
 * es el PERFIL: culata inclinada, GUARDAMONTE con su hueco y el GATILLO dentro,
 * cuerpo que se estrecha hacia el morro y OPTICA al frente. El gatillo no es
 * adorno: mientras se aprieta el instrumento mide, y al soltarlo la lectura
 * queda retenida. La lente es lo que fija el campo de vision, o sea de que
 * tamano es la mancha que se esta midiendo a cada distancia.
 *
 * Se dibuja de una pieza a partir de su SILUETA, con el hueco del guardamonte
 * como agujero de la extrusion: recortar el hueco es lo que da el contorno.
 * Apunta a +X y se apoya por la base de la culata en y = 0.
 */
export function pistolaIR(mat, opts = {}) {
  const { alto = 0.60, ancho = 0.16, cuerpo = 0xff8c1a, seg = 18 } = opts;
  const g = new THREE.Group();
  const H = alto, A = ancho;
  const P = (a) => a.map(([x, y]) => [x * H, y * H]);
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.50, metalness: 0.20 });
  const gom = mat.goma || mat.negro || matC;
  /* La goma de las cachas va un punto mas clara que la del resto: una superficie
     negra y mate contra el cuerpo naranja no se lee como goma, se lee como un
     agujero. Y va en NERVIOS, que es de lo que agarra la mano. */
  const gomC = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.82, metalness: 0.06 });
  const met = mat.acero || mat.aluminio || mat.cromo;
  const oscuro = new THREE.MeshStandardMaterial({ color: 0x0b0f14, roughness: 0.22, metalness: 0.38 });

  const perfil = contornoRedondeado(P([
    [0.46, 0.70], [0.50, 0.64], [0.50, 0.46], [0.46, 0.40],
    [0.25, 0.40], [0.25, 0.30], [0.23, 0.20], [0.17, 0.13],
    [0.08, 0.12], [0.08, 0.00], [-0.14, 0.00], [-0.18, 0.16],
    [-0.14, 0.40], [-0.18, 0.56], [-0.18, 0.74], [0.30, 0.76], [0.44, 0.72],
  ]), H * 0.022, 3);
  const guarda = contornoRedondeado(
    P([[0.105, 0.180], [0.210, 0.180], [0.218, 0.362], [0.105, 0.362]]), H * 0.040, 5);
  const cue = new THREE.Mesh(extruido(perfil, { huecos: [guarda], espesor: A, bisel: A * 0.10 }), matC);
  cue.castShadow = true; g.add(cue);

  const gat = new THREE.Mesh(extruido(contornoRedondeado(
    P([[0.140, 0.196], [0.180, 0.208], [0.190, 0.350], [0.152, 0.350]]), H * 0.016, 3),
    { espesor: A * 0.44, bisel: A * 0.04 }), gom);
  gat.castShadow = true; g.add(gat);

  for (const sz of [-1, 1]) for (let k = 0; k < 5; k++) {
    const ri = new THREE.Mesh(new THREE.BoxGeometry(H * 0.17, H * 0.024, A * 0.06), gomC);
    ri.position.set(-H * 0.040, H * (0.085 + k * 0.052), sz * (A / 2 + A * 0.012));
    g.add(ri);
  }

  const can = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.100, H * 0.115, H * 0.17, seg), matC);
  can.rotation.z = -Math.PI / 2; can.position.set(H * 0.575, H * 0.55, 0);
  can.castShadow = true; g.add(can);
  const aro = new THREE.Mesh(new THREE.TorusGeometry(H * 0.100, H * 0.017, 8, seg), met);
  aro.rotation.y = Math.PI / 2; aro.position.set(H * 0.657, H * 0.55, 0); g.add(aro);
  const len = new THREE.Mesh(new THREE.CircleGeometry(H * 0.088, seg), oscuro);
  len.rotation.y = Math.PI / 2; len.position.set(H * 0.660, H * 0.55, 0); g.add(len);

  /* EL ANCLA DE LA PANTALLA: tres giros encadenados en vez de un Euler, para
     que se lea lo que hace cada uno —tumbarla, inclinarla hacia quien dispara y
     poner su «arriba» mirando a la culata— y no haya que fiarse del orden. */
  const inc = new THREE.Group(); inc.position.set(H * 0.06, H * 0.768, 0); inc.rotation.z = 0.24;
  const tum = new THREE.Group(); tum.rotation.x = -Math.PI / 2; inc.add(tum);
  const ori = new THREE.Group(); ori.rotation.z = Math.PI / 2; tum.add(ori);
  g.add(inc);
  const vis = new THREE.Mesh(new THREE.BoxGeometry(A * 0.84, H * 0.20, H * 0.020), oscuro);
  vis.position.z = -H * 0.008; ori.add(vis);
  for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(A * 0.17, H * 0.05, H * 0.028), gomC);
    b.position.set(sx * A * 0.23, -H * 0.165, 0); ori.add(b);
  }

  const tapa = new THREE.Mesh(new THREE.BoxGeometry(H * 0.20, H * 0.022, A * 0.84), gomC);
  tapa.position.set(-H * 0.03, H * 0.011, 0); g.add(tapa);

  g.userData = { alto: H, ancho: A, gatillo: gat, pantalla: ori,
                 boca: new THREE.Vector3(H * 0.66, H * 0.55, 0) };
  return g;
}

/* ==========================================================================
   §11 · COMPONENTES DE PLACA
   --------------------------------------------------------------------------
   Un laboratorio de electronica dibujado con un rectangulo negro, un cilindro
   azul y un taco sobre una plancha verde no ensena nada: no se ve por donde
   entra la corriente, ni cual es el positivo, ni por que un componente se monta
   de una manera y no de otra. Lo que convierte un taco en un COMPONENTE son las
   PATAS —donde se suelda—, las MARCAS —bandas, franjas, chaflanes— y la forma
   del encapsulado, que es lo que se reconoce en la mano.
   Convenio: la cara de la placa es y = 0 y las patas bajan a y negativa. Los
   componentes AXIALES se tumban en +X; los RADIALES se levantan en +Y.
   ========================================================================== */

function _hilo(pts, r, mat) {
  return new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts), Math.max(8, pts.length * 6), r, 7, false), mat);
}

/**
 * RESISTENCIA axial con sus BANDAS DE COLOR y sus patas dobladas. El cuerpo es
 * abarrilado, con hombros: no es un tubo recto, y esa forma es la que se
 * reconoce en la mano. Las bandas se pasan como colores, en el orden en que se
 * leen —empezando por el extremo mas cercano a la primera—, de modo que el
 * dibujo diga el mismo valor que el panel.
 */
export function resistencia(mat, opts = {}) {
  const { largo = 0.20, d = 0.075, bandas = ['#7a4a1e', '#111318', '#b03a2e', '#c9a227'],
          patas = 0.12, paso = null, cuerpo = 0x9a815c, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2, L = largo;
  const yb = d * 0.62;                      // el eje del cuerpo, POR ENCIMA de la placa
  const cue = new THREE.Mesh(revolucion([
    [0, -L / 2], [R * 0.40, -L / 2], [R * 0.74, -L / 2 + L * 0.07],
    [R, -L / 2 + L * 0.18], [R, L / 2 - L * 0.18], [R * 0.74, L / 2 - L * 0.07],
    [R * 0.40, L / 2], [0, L / 2]], { seg }),
    new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.88, metalness: 0.02 }));
  cue.rotation.z = -Math.PI / 2; cue.position.y = yb; cue.castShadow = true; g.add(cue);
  /* Las bandas. Con cuatro, las tres primeras van juntas hacia un extremo y la
     TOLERANCIA separada al otro: esa separacion es la que dice por que lado se
     empieza a leer, y sin ella el mismo dibujo vale para dos valores distintos.
     Con tres, van agrupadas y se lee desde el extremo mas cercano. */
  const n = bandas.length, conTol = n >= 4;
  const cintas = [];
  bandas.forEach((col, i) => {
    const x = conTol
      ? (i < n - 1 ? -L * 0.30 + i * L * 0.155 : L * 0.32)
      : -L * 0.24 + i * L * 0.17;
    const bb = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.03, R * 1.03, L * 0.085, seg),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.62, metalness: 0.05 }));
    bb.rotation.z = Math.PI / 2; bb.position.set(x, yb, 0); g.add(bb); cintas.push(bb);
  });
  const P = (paso || L + d * 2.2) / 2;
  const met = mat.cromo || mat.acero || mat.aluminio;
  for (const sx of [-1, 1]) {
    g.add(_hilo([
      new THREE.Vector3(sx * L * 0.48, yb, 0),
      new THREE.Vector3(sx * (P - d * 0.35), yb, 0),
      new THREE.Vector3(sx * P, yb - d * 0.42, 0),
      new THREE.Vector3(sx * P, -patas, 0)], d * 0.10, met));
  }
  g.userData = { largo: L, d, paso: P * 2, cuerpo: cue, bandas: cintas, alturaEje: yb };
  return g;
}

/**
 * DIODO de encapsulado axial (DO-41) con su BANDA DE CATODO. La banda es la
 * pieza de informacion: dice hacia donde conduce, y montar el diodo al reves es
 * la averia mas repetida de un montaje de practicas. Por eso se dibuja.
 */
export function diodoAxial(mat, opts = {}) {
  const { largo = 0.13, d = 0.06, patas = 0.12, paso = null,
          cuerpo = 0x1d2229, banda = 0xdfe6ee, catodo = 1, seg = 16 } = opts;
  const g = new THREE.Group();
  const R = d / 2, L = largo;
  const yb = d * 0.62;                      // el eje del cuerpo, POR ENCIMA de la placa
  const cue = new THREE.Mesh(revolucion([
    [0, -L / 2], [R * 0.52, -L / 2], [R, -L / 2 + L * 0.10],
    [R, L / 2 - L * 0.10], [R * 0.52, L / 2], [0, L / 2]], { seg }),
    new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.45, metalness: 0.10 }));
  cue.rotation.z = -Math.PI / 2; cue.position.y = yb; cue.castShadow = true; g.add(cue);
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.04, R * 1.04, L * 0.14, seg),
    new THREE.MeshStandardMaterial({ color: banda, roughness: 0.55, metalness: 0.05 }));
  bd.rotation.z = Math.PI / 2; bd.position.set(catodo * L * 0.30, yb, 0); g.add(bd);
  const P = (paso || L + d * 3.0) / 2;
  const met = mat.cromo || mat.acero || mat.aluminio;
  for (const sx of [-1, 1]) {
    g.add(_hilo([
      new THREE.Vector3(sx * L * 0.48, yb, 0),
      new THREE.Vector3(sx * (P - d * 0.35), yb, 0),
      new THREE.Vector3(sx * P, yb - d * 0.42, 0),
      new THREE.Vector3(sx * P, -patas, 0)], d * 0.10, met));
  }
  g.userData = { largo: L, d, paso: P * 2, catodo, cuerpo: cue, banda: bd, alturaEje: yb };
  return g;
}

/**
 * CONDENSADOR ELECTROLITICO radial. Lleva las tres marcas que tiene uno de
 * verdad y que ninguna lata lisa tiene: el ENGARCE del fondo, donde la lata se
 * cierra sobre el tapon de goma; la CRUZ de la tapa, que es una entalla hecha
 * para que reviente por ahi y no por el fondo; y la FRANJA del negativo. Un
 * electrolitico montado al reves se hincha y abre esa cruz, y esa es la razon
 * de que la franja este dibujada.
 */
export function condensadorRadial(mat, opts = {}) {
  const { d = 0.18, alto = 0.24, patas = 0.12, paso = null,
          lata = 0x2a4a68, franja = 0xd8e4f0, seg = 22 } = opts;
  const g = new THREE.Group();
  const R = d / 2, H = alto;
  const matLata = new THREE.MeshStandardMaterial({ color: lata, roughness: 0.42, metalness: 0.22 });
  const cue = new THREE.Mesh(revolucion([
    [0, 0], [R * 0.92, 0], [R, R * 0.10], [R, H * 0.90],
    [R * 0.97, H * 0.94], [R * 0.97, H], [0, H]], { seg }), matLata);
  cue.castShadow = true; g.add(cue);
  const eng = new THREE.Mesh(new THREE.TorusGeometry(R * 0.99, R * 0.075, 8, seg), matLata);
  eng.rotation.x = Math.PI / 2; eng.position.y = R * 0.16; g.add(eng);
  // la cruz de alivio de la tapa
  const tinta = new THREE.MeshStandardMaterial({ color: 0x11161c, roughness: 0.9, metalness: 0 });
  for (const a of [0, Math.PI / 2]) {
    const e = new THREE.Mesh(new THREE.BoxGeometry(R * 1.55, R * 0.06, R * 0.10), tinta);
    e.position.y = H + R * 0.02; e.rotation.y = a; g.add(e);
  }
  // la franja del negativo, en un costado
  const fr = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.012, R * 1.012, H * 0.74, seg, 1, true,
    Math.PI * 0.82, Math.PI * 0.36),
    new THREE.MeshStandardMaterial({ color: franja, roughness: 0.7, metalness: 0.03,
      side: THREE.DoubleSide }));
  fr.position.y = H * 0.48; g.add(fr);
  const P = (paso || d * 0.55) / 2;
  const met = mat.cromo || mat.acero || mat.aluminio;
  for (const sx of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.045, d * 0.045, patas + 0.02, 8), met);
    l.position.set(sx * P, -(patas + 0.02) / 2 + 0.01, 0); g.add(l);
  }
  g.userData = { d, alto: H, paso: P * 2, cuerpo: cue };
  return g;
}

/**
 * ENCAPSULADO DIP con PATAS. Las patas son la mitad del dibujo: un integrado no
 * es un rectangulo negro, es un bicho de catorce patas dobladas hacia dentro, y
 * la MUESCA de un extremo —con el punto de la patilla 1— es lo unico que dice
 * como se orienta. Montarlo girado media vuelta lo quema; por eso la muesca.
 */
export function dip(mat, opts = {}) {
  const { pines = 8, paso = 0.055, ancho = 0.17, alto = 0.045, patas = 0.10,
          cuerpo = 0x14181e } = opts;
  const g = new THREE.Group();
  const n = Math.max(2, Math.round(pines / 2));
  const L = n * paso + paso * 0.6;
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.62, metalness: 0.06 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-L / 2, -ancho / 2], [L / 2, -ancho / 2], [L / 2, ancho / 2], [-L / 2, ancho / 2]],
    ancho * 0.06, 2), { espesor: alto, bisel: alto * 0.14 }), matC);
  cue.rotation.x = -Math.PI / 2; cue.position.y = alto / 2 + 0.004; cue.castShadow = true;
  g.add(cue);
  // la muesca del extremo y el punto de la patilla 1
  const mu = new THREE.Mesh(new THREE.CylinderGeometry(ancho * 0.16, ancho * 0.16, alto * 0.7, 14),
    new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.95, metalness: 0 }));
  mu.position.set(-L / 2 + ancho * 0.05, alto * 0.72, 0); g.add(mu);
  const pt = new THREE.Mesh(new THREE.CylinderGeometry(ancho * 0.07, ancho * 0.07, alto * 0.5, 12),
    new THREE.MeshStandardMaterial({ color: 0x05070a, roughness: 0.95, metalness: 0 }));
  pt.position.set(-L / 2 + paso * 0.8, alto * 0.80, -ancho * 0.26); g.add(pt);
  const met = mat.cromo || mat.acero || mat.aluminio;
  for (const sz of [-1, 1]) for (let i = 0; i < n; i++) {
    const x = -((n - 1) / 2) * paso + i * paso;
    const z0 = sz * ancho / 2, z1 = sz * (ancho / 2 + paso * 0.30);
    const pa = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.34, alto * 0.28, paso * 0.36), met);
    pa.position.set(x, alto * 0.42, (z0 + z1) / 2); g.add(pa);
    const pb = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.34, patas + alto * 0.4, alto * 0.24), met);
    pb.position.set(x, alto * 0.30 - (patas + alto * 0.4) / 2, z1); g.add(pb);
  }
  g.userData = { largo: L, ancho, pines: n * 2, paso, cuerpo: cue };
  return g;
}

/**
 * ENCAPSULADO TO-220: el del regulador y el del transistor de potencia. Lo que
 * lo hace reconocible es la ALETA metalica con su agujero de tornillo —por ahi
 * se atornilla al disipador, y esa aleta suele estar conectada a una de las
 * patas, que es la razon de que a veces haga falta una mica aislante— y las
 * TRES patas en un solo lado.
 */
export function to220(mat, opts = {}) {
  const { ancho = 0.20, alto = 0.24, fondo = 0.06, patas = 0.14, paso = 0.06,
          cuerpo = 0x14181e } = opts;
  const g = new THREE.Group();
  const met = mat.aluminio || mat.acero;
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.66, metalness: 0.05 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, 0], [ancho / 2, 0], [ancho / 2, alto * 0.62], [-ancho / 2, alto * 0.62]],
    ancho * 0.05, 2), { espesor: fondo, bisel: fondo * 0.16 }), matC);
  cue.castShadow = true; g.add(cue);
  // la aleta: chapa con su agujero, mas ancha que el plastico por arriba
  const ale = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, alto * 0.58], [ancho / 2, alto * 0.58], [ancho / 2, alto],
     [-ancho / 2, alto]], ancho * 0.10, 3),
    { huecos: [circulo(0, alto * 0.86, ancho * 0.13, 14)], espesor: fondo * 0.42,
      bisel: fondo * 0.06 }), met);
  ale.castShadow = true; g.add(ale);
  for (let i = -1; i <= 1; i++) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.32, patas, fondo * 0.32), met);
    pa.position.set(i * paso, -patas / 2, 0); g.add(pa);
  }
  g.userData = { ancho, alto, paso, cuerpo: cue, aleta: ale };
  return g;
}

/**
 * ENCAPSULADO TO-92: el del transistor pequeno. Es medio cilindro con una CARA
 * PLANA, y esa cara plana no es un capricho de moldeo: es la referencia con la
 * que se identifican las tres patas. Un cilindro liso deja al alumno sin saber
 * cual es la base, y equivocarse de pata es no polarizar nada.
 */
export function to92(mat, opts = {}) {
  const { d = 0.11, alto = 0.17, patas = 0.13, paso = 0.032,
          cuerpo = 0x1d2229, seg = 20 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const aFlat = Math.acos(0.62), cont = [];
  for (let k = 0; k <= seg; k++) {
    const a2 = aFlat + (2 * Math.PI - 2 * aFlat) * (k / seg);
    cont.push([Math.cos(a2) * R, Math.sin(a2) * R]);
  }
  const cue = new THREE.Mesh(extruido(cont, { espesor: alto, bisel: R * 0.30, biselSeg: 3 }),
    new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.66, metalness: 0.05 }));
  cue.rotation.x = -Math.PI / 2; cue.position.y = alto; cue.castShadow = true; g.add(cue);
  const met = mat.cromo || mat.acero || mat.aluminio;
  for (let i = -1; i <= 1; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.055, d * 0.055, patas + 0.02, 8), met);
    l.position.set(i * paso, -(patas + 0.02) / 2 + 0.01, i === 0 ? -R * 0.30 : R * 0.06);
    g.add(l);
  }
  g.userData = { d, alto, cuerpo: cue };
  return g;
}

/**
 * INDUCTOR de nucleo de tambor, CON SU HILO A LA VISTA. Una bobina dibujada
 * como un taco negro esconde lo unico que hay que entender: que una inductancia
 * son VUELTAS de hilo alrededor de un nucleo, y que por eso una bobina de mas
 * inductancia es mas gorda y aguanta menos corriente antes de saturar.
 */
export function inductorTambor(mat, opts = {}) {
  const { d = 0.24, alto = 0.16, vueltas = 9, hilo = 0.017, patas = 0.12,
          nucleo = 0x2a2f36, seg = 22 } = opts;
  const g = new THREE.Group();
  const R = d / 2, rn = R * 0.52;
  const matN = new THREE.MeshStandardMaterial({ color: nucleo, roughness: 0.78, metalness: 0.08 });
  const tam = new THREE.Mesh(revolucion([
    [0, 0], [R, 0], [R, alto * 0.16], [rn, alto * 0.24], [rn, alto * 0.76],
    [R, alto * 0.84], [R, alto], [0, alto]], { seg }), matN);
  tam.castShadow = true; g.add(tam);
  const col = mat.cobre || mat.acero;
  const pts = [];
  const K = 26, y0 = alto * 0.27, y1 = alto * 0.73;
  for (let i = 0; i <= vueltas * K; i++) {
    const t = i / K, a = t * Math.PI * 2;
    const y = y0 + (y1 - y0) * (t / vueltas);
    pts.push(new THREE.Vector3(Math.cos(a) * (rn + hilo * 0.9), y, Math.sin(a) * (rn + hilo * 0.9)));
  }
  const bob = new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts), pts.length, hilo, 6, false), col);
  bob.castShadow = true; g.add(bob);
  for (const sx of [-1, 1]) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(hilo * 0.8, hilo * 0.8, patas + 0.02, 8), col);
    l.position.set(sx * R * 0.62, -(patas + 0.02) / 2 + 0.01, 0); g.add(l);
  }
  g.userData = { d, alto, cuerpo: tam };
  return g;
}

/**
 * LED de 5 mm, con la CARA PLANA del catodo y la pata corta. Las dos marcas
 * dicen lo mismo —cual es el negativo— y estan ahi porque un LED al reves no
 * quema nada pero tampoco luce, y es la primera cosa que se comprueba.
 */
export function led(mat, opts = {}) {
  const { d = 0.10, color = 0xd64545, patas = 0.14, encendido = false, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const matL = new THREE.MeshStandardMaterial({ color, roughness: 0.18, metalness: 0.0,
    transparent: true, opacity: 0.82, emissive: color,
    emissiveIntensity: encendido ? 1.15 : 0.10 });
  const cuerpo = new THREE.Mesh(revolucion([
    [0, 0], [R, 0], [R, d * 0.62], [R * 0.86, d * 0.86], [R * 0.52, d * 1.02],
    [0, d * 1.06]], { seg }), matL);
  cuerpo.castShadow = true; g.add(cuerpo);
  /* La pestana no es redonda: tiene un CHAFLAN plano en el lado del catodo. Es
     la marca que se busca con el dedo cuando el LED ya esta montado y no se le
     ven las patas, asi que se dibuja como lo que es —un corte en la pestana— y
     no como una pegatina en el costado. */
  const aFlat = Math.acos(-0.86), pest = [];
  for (let k = 0; k <= 22; k++) {
    const a2 = -aFlat + (2 * aFlat) * (k / 22);
    pest.push([Math.cos(a2) * R * 1.16, Math.sin(a2) * R * 1.16]);
  }
  const pes = new THREE.Mesh(extruido(pest, { espesor: d * 0.10, bisel: d * 0.012 }), matL);
  pes.rotation.x = -Math.PI / 2; pes.position.y = d * 0.05; g.add(pes);
  const met = mat.cromo || mat.acero || mat.aluminio;
  // anodo largo, catodo corto: en un LED la pata larga es el +
  [[1, patas], [-1, patas * 0.72]].forEach(([sx, lg]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.05, d * 0.05, lg + 0.02, 8), met);
    l.position.set(sx * R * 0.42, -(lg + 0.02) / 2 + 0.01, 0); g.add(l);
  });
  g.userData = { d, material: matL, enciende: (v) => { matL.emissiveIntensity = v ? 1.15 : 0.10; } };
  return g;
}

/**
 * CONECTOR BNC de panel, el de cualquier osciloscopio o generador: barrilete,
 * los DOS TETONES de la bayoneta, el aislante y el pin central.
 *
 * Los tetones no son adorno: son lo que convierte al conector en una BAYONETA
 * —se mete y se gira un cuarto de vuelta— y lo que hace que no se salga solo
 * tirando del cable, que es justo por lo que un osciloscopio no lleva bananas.
 * El anillo de color es lo que dice qué canal es. Eje +Z, saliendo del panel.
 */
export function bnc(mat, opts = {}) {
  const { d = 0.11, largo = 0.10, color = null, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = mat.cromo || mat.acero || mat.aluminio;
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(R, R, largo, seg), met);
  bar.rotation.x = Math.PI / 2; bar.position.z = largo / 2; bar.castShadow = true; g.add(bar);
  const bri = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.28, R * 1.28, largo * 0.16, seg), met);
  bri.rotation.x = Math.PI / 2; bri.position.z = largo * 0.08; g.add(bri);
  for (const sx of [-1, 1]) {           // los tetones de la bayoneta
    const te = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.17, R * 0.17, R * 0.34, 10), met);
    te.rotation.z = Math.PI / 2;
    te.position.set(sx * (R + R * 0.14), 0, largo * 0.62); g.add(te);
  }
  const ais = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.62, R * 0.62, largo * 0.30, seg),
    new THREE.MeshStandardMaterial({ color: 0xd7dee6, roughness: 0.55, metalness: 0.02 }));
  ais.rotation.x = Math.PI / 2; ais.position.z = largo * 0.86; g.add(ais);
  const pin = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.13, R * 0.13, largo * 0.5, 10), met);
  pin.rotation.x = Math.PI / 2; pin.position.z = largo * 0.90; g.add(pin);
  if (color !== null) {
    const an = new THREE.Mesh(new THREE.TorusGeometry(R * 1.34, R * 0.14, 8, seg),
      new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.1 }));
    an.position.z = largo * 0.04; g.add(an);
    g.userData.anillo = an;
  }
  g.userData.d = d; g.userData.largo = largo;
  return g;
}

/**
 * BUJE DE PORCELANA: por donde sale una terminal de un tanque —de un
 * transformador, de un interruptor— sin tocar la chapa.
 *
 * Las FALDAS no son un adorno: alargan el camino que tendría que recorrer el
 * agua o la suciedad para puentear la terminal con el tanque, y por eso un buje
 * de más tensión tiene más faldas. Un poste liso con una bola encima no dice
 * nada de eso, y es la pieza que más se reconoce de un transformador.
 */
export function bujePorcelana(mat, opts = {}) {
  const { alto = 0.24, d = 0.10, faldas = 3, color = 0xbfc4c9, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2, h = alto;
  const pts = [[0, 0], [R * 1.7, 0], [R * 1.7, h * 0.07]];
  for (let k = 0; k < faldas; k++) {
    const y0 = h * (0.10 + 0.76 * k / faldas);
    const y1 = h * (0.10 + 0.76 * (k + 0.62) / faldas);
    pts.push([R * 0.74, y0], [R * 1.50, y0 + h * 0.035],
             [R * 1.50, y0 + h * 0.065], [R * 0.74, y1]);
  }
  pts.push([R * 0.74, h * 0.90], [R * 0.58, h * 0.94], [0, h * 0.94]);
  const por = new THREE.Mesh(revolucion(pts, { seg }),
    new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.04 }));
  por.castShadow = true; g.add(por);
  const met = mat.cromo || mat.acero || mat.aluminio;
  const esp = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.34, R * 0.34, h * 0.36, 12), met);
  esp.position.y = h * 1.02; g.add(esp);
  const tue = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.52, R * 0.52, h * 0.09, 6), met);
  tue.position.y = h * 0.97; g.add(tue);
  g.userData = { alto: h, d, porcelana: por, borne: esp, borneY: h * 1.14 };
  return g;
}

/**
 * BORNERA de tornillo: la regleta por la que entra y sale un cable en cualquier
 * banco. Cuerpo de plástico con una BOCA por vía, el TORNILLO encima —que es lo
 * que aprieta el cable contra la jaula— y las patas por debajo.
 *
 * Es la pieza que dice dónde termina un cable y empieza la placa. Sin ella los
 * cables aparecen clavados en el aire.
 */
export function bornera(mat, opts = {}) {
  const { vias = 2, paso = 0.13, alto = 0.11, fondo = 0.12, patas = 0.06,
          cuerpo = 0x1c5fa8 } = opts;
  const g = new THREE.Group();
  const W = vias * paso;
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.72, metalness: 0.04 });
  const met = mat.cromo || mat.acero || mat.aluminio;
  const tinta = new THREE.MeshStandardMaterial({ color: 0x0a0d11, roughness: 0.95, metalness: 0 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, 0], [W / 2, 0], [W / 2, alto], [-W / 2, alto]], paso * 0.10, 2),
    { espesor: fondo, bisel: fondo * 0.10 }), matC);
  cue.castShadow = true; g.add(cue);
  for (let i = 0; i < vias; i++) {
    const x = (i - (vias - 1) / 2) * paso;
    const boca = new THREE.Mesh(new THREE.CylinderGeometry(paso * 0.21, paso * 0.21, fondo * 0.62, 12), tinta);
    boca.rotation.x = Math.PI / 2;
    boca.position.set(x, alto * 0.36, fondo * 0.22); g.add(boca);
    const tor = new THREE.Mesh(new THREE.CylinderGeometry(paso * 0.26, paso * 0.26, alto * 0.16, 14), met);
    tor.position.set(x, alto * 1.02, 0); g.add(tor);
    const ran = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.42, alto * 0.03, paso * 0.09), tinta);
    ran.position.set(x, alto * 1.10, 0); g.add(ran);
    const pin = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.14, patas, fondo * 0.16), met);
    pin.position.set(x, -patas / 2, 0); g.add(pin);
  }
  g.userData = { vias, paso, alto, fondo, ancho: W,
    boca: (i) => new THREE.Vector3((i - (vias - 1) / 2) * paso, alto * 0.36, fondo * 0.52) };
  return g;
}


/* ==========================================================================
   §13 · INSTRUMENTOS DE DIAGNÓSTICO
   Los aparatos que se tienen EN LA MANO. Un instrumento de mano se reconoce por
   tres cosas y ninguna es la caja: por dónde se agarra (el sobremoldeado de
   goma), por dónde se manda (el teclado o el selector) y por dónde sale el
   cable. Un rectángulo con una pantalla pegada no es ninguna de las tres.
   Convenio: la cara del frontal mira a +Z y el origen está en el centro del
   cuerpo; `userData.pantalla` es el ancla donde el laboratorio cuelga SU lienzo.
   ========================================================================== */

/**
 * ESCÁNER DE DIAGNÓSTICO de mano. Cuerpo con sobremoldeado de goma en los dos
 * costados —por ahí se agarra y por eso sobrevive a una caída en el taller—,
 * visor rebajado en su marco, teclado en cruz con la tecla de aceptar en el
 * centro y dos teclas de función, y el prensaestopas por donde sale el cable
 * hacia el conector de diagnóstico.
 *
 * La cruz de teclas no es adorno: un escáner se maneja recorriendo menús
 * —modo $01, $07, $03, $02— y sin teclas no se ve por dónde se recorre nada.
 */
export function escanerOBD(mat, opts = {}) {
  const { ancho = 1.15, alto = 1.70, fondo = 0.24,
          color = 0x152420, goma = 0x0c1512, visor = 0.60, seg = 3 } = opts;
  const g = new THREE.Group();
  const W = ancho, A = alto, F = fondo;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.30 });
  const matG = new THREE.MeshStandardMaterial({ color: goma, roughness: 0.96, metalness: 0.0 });
  const matT = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.80, metalness: 0.05 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, -A / 2], [W / 2, -A / 2], [W / 2, A / 2], [-W / 2, A / 2]], W * 0.12, 4),
    { espesor: F, bisel: F * 0.10 }), matC);
  cue.castShadow = true; g.add(cue);
  /* EL SOBREMOLDEADO: dos costillas de goma que envuelven los cantos. */
  for (const sx of [-1, 1]) {
    const b = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W * 0.055, -A * 0.40], [W * 0.055, -A * 0.40], [W * 0.055, A * 0.40], [-W * 0.055, A * 0.40]],
      W * 0.05, 3), { espesor: F * 1.06, bisel: F * 0.10 }), matG);
    b.position.x = sx * (W / 2 - W * 0.028); g.add(b);
  }
  /* EL VISOR: marco rebajado y el ancla donde va el lienzo del laboratorio. */
  const vw = W * 0.80, vh = A * visor, vy = A * 0.165;
  const mar = new THREE.Mesh(extruido(
    [[-vw / 2 - W * 0.045, -vh / 2 - W * 0.045], [vw / 2 + W * 0.045, -vh / 2 - W * 0.045],
     [vw / 2 + W * 0.045, vh / 2 + W * 0.045], [-vw / 2 - W * 0.045, vh / 2 + W * 0.045]],
    { huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]],
      espesor: F * 0.14, bisel: F * 0.02 }), matT);
  mar.position.set(0, vy, F / 2 - F * 0.03); g.add(mar);
  const pan = new THREE.Group(); pan.position.set(0, vy, F / 2 + 0.004); g.add(pan);
  /* EL TECLADO: cruz de cuatro flechas, aceptar en el centro y dos de función. */
  const teclas = [];
  const kc = A * -0.28, k = W * 0.115;
  const pone = (x, y, w, h, r) => {
    const t = new THREE.Mesh(extruido(contornoRedondeado(
      [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r, 3),
      { espesor: F * 0.16, bisel: F * 0.03 }), matG);
    t.position.set(x, y, F / 2 - F * 0.02); g.add(t); teclas.push(t); return t;
  };
  pone(0, kc + k * 1.15, k, k * 0.78, k * 0.22);
  pone(0, kc - k * 1.15, k, k * 0.78, k * 0.22);
  pone(-k * 1.15, kc, k * 0.78, k, k * 0.22);
  pone(k * 1.15, kc, k * 0.78, k, k * 0.22);
  const ok = new THREE.Mesh(new THREE.CylinderGeometry(k * 0.44, k * 0.44, F * 0.18, 20), matT);
  ok.rotation.x = Math.PI / 2; ok.position.set(0, kc, F / 2 - F * 0.01); g.add(ok);
  for (const sx of [-1, 1]) pone(sx * W * 0.24, A * -0.44, W * 0.26, A * 0.045, W * 0.02);
  /* EL PRENSAESTOPAS y su alivio de tensión: por aquí sale el cable. */
  const pe = new THREE.Mesh(new THREE.CylinderGeometry(F * 0.30, F * 0.34, A * 0.045, 16), matT);
  pe.position.set(0, A / 2 + A * 0.02, 0); g.add(pe);
  const al = new THREE.Mesh(revolucion([
    [0, 0], [F * 0.28, 0], [F * 0.20, A * 0.055], [F * 0.15, A * 0.10], [0, A * 0.10]], { seg: 16 }), matG);
  al.position.set(0, A / 2 + A * 0.04, 0); g.add(al);
  g.userData = { ancho: W, alto: A, fondo: F, pantalla: pan, teclas,
                 visor: { ancho: vw, alto: vh },
                 salida: new THREE.Vector3(0, A / 2 + A * 0.14, 0) };
  return g;
}

/**
 * MULTÍMETRO DIGITAL de mano. El SELECTOR GIRATORIO es la pieza: es lo que
 * distingue un multímetro de una caja con una pantalla, y es donde está la
 * decisión que más se equivoca —medir corriente con el selector en volts, o al
 * revés—. Por eso lleva su testigo apuntando y sus marcas alrededor. Debajo,
 * las bornas: la de común y las de las magnitudes, separadas y de distinto
 * color porque cambiar de borna es parte de cambiar de medida.
 *
 * `userData.selector` es el grupo que gira (el laboratorio le pone el ángulo) y
 * `userData.pantalla` el ancla del lienzo. Las bornas salen en `userData.bornas`.
 */
export function multimetro(mat, opts = {}) {
  const { ancho = 0.62, alto = 0.95, fondo = 0.16, color = 0x1d2a26,
          bornas: nB = 3, marcas = 8, visor = 0.24, visorY = 0.30 } = opts;
  const g = new THREE.Group();
  const W = ancho, A = alto, F = fondo;
  const met = mat.cromo || mat.acero || mat.aluminio;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.25 });
  const matG = new THREE.MeshStandardMaterial({ color: 0x101614, roughness: 0.95, metalness: 0.0 });
  const matM = new THREE.MeshStandardMaterial({ color: 0xd7dee6, roughness: 0.5, metalness: 0.1 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, -A / 2], [W / 2, -A / 2], [W / 2, A / 2], [-W / 2, A / 2]], W * 0.13, 4),
    { espesor: F, bisel: F * 0.12 }), matC);
  cue.castShadow = true; g.add(cue);
  for (const sx of [-1, 1]) {                       // el sobremoldeado del canto
    const b = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W * 0.05, -A * 0.34], [W * 0.05, -A * 0.34], [W * 0.05, A * 0.34], [-W * 0.05, A * 0.34]],
      W * 0.045, 3), { espesor: F * 1.08, bisel: F * 0.12 }), matG);
    b.position.x = sx * (W / 2 - W * 0.024); g.add(b);
  }
  const vw = W * 0.78, vh = A * visor, vy = A * visorY;
  const mar = new THREE.Mesh(extruido(
    [[-vw / 2 - W * 0.05, -vh / 2 - W * 0.05], [vw / 2 + W * 0.05, -vh / 2 - W * 0.05],
     [vw / 2 + W * 0.05, vh / 2 + W * 0.05], [-vw / 2 - W * 0.05, vh / 2 + W * 0.05]],
    { huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]],
      espesor: F * 0.18, bisel: F * 0.03 }), matG);
  mar.position.set(0, vy, F / 2 - F * 0.04); g.add(mar);
  const pan = new THREE.Group(); pan.position.set(0, vy, F / 2 + 0.004); g.add(pan);
  /* LAS MARCAS del dial, alrededor del selector: sin ellas girar no significa
     nada. Son rayas —cada laboratorio pone las suyas con texto si las quiere—,
     pero tienen que estar para que el selector sea un selector. */
  const rs = W * 0.26, cy = -A * 0.13;
  for (let i = 0; i < marcas; i++) {
    const a = -Math.PI * 0.72 + (i / (marcas - 1)) * Math.PI * 1.44;
    const m = new THREE.Mesh(new THREE.BoxGeometry(W * 0.018, W * 0.075, F * 0.05), matM);
    m.position.set(Math.sin(a) * rs * 1.26, cy + Math.cos(a) * rs * 1.26, F / 2 - F * 0.01);
    m.rotation.z = -a; g.add(m);
  }
  /* EL SELECTOR: cuerpo estriado y testigo. Gira sobre +Z. */
  const sel = new THREE.Group(); sel.position.set(0, cy, F / 2 - F * 0.02); g.add(sel);
  const cub = new THREE.Mesh(new THREE.CylinderGeometry(rs, rs * 1.06, F * 0.44, 26), matG);
  cub.rotation.x = Math.PI / 2; cub.position.z = F * 0.20; cub.castShadow = true; sel.add(cub);
  for (let i = 0; i < 12; i++) {                    // el estriado por el que se gira
    const a = i / 12 * Math.PI * 2;
    const e = new THREE.Mesh(new THREE.BoxGeometry(rs * 0.10, rs * 0.10, F * 0.40), matC);
    e.position.set(Math.cos(a) * rs * 0.98, Math.sin(a) * rs * 0.98, F * 0.20); sel.add(e);
  }
  const tes = new THREE.Mesh(new THREE.BoxGeometry(rs * 0.16, rs * 0.86, F * 0.10), matM);
  tes.position.set(0, rs * 0.46, F * 0.42); sel.add(tes);
  /* LAS BORNAS, con su casquillo metálico y su aro de color. */
  /* Rojo, negro (comun) y rojo otra vez es el orden clasico de tres bornas; con
     cuatro se anade la de amperios altos. El laboratorio puede pasar los suyos. */
  const bornas = [], cols = [0xd64545, 0x14181e, 0xd64545, 0xd8a12a];
  for (let i = 0; i < nB; i++) {
    const x = (i - (nB - 1) / 2) * W * 0.30;
    const bg = new THREE.Group(); bg.position.set(x, -A * 0.40, F / 2 - F * 0.05); g.add(bg);
    const an = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.075, W * 0.075, F * 0.14, 18),
      new THREE.MeshStandardMaterial({ color: cols[i % cols.length], roughness: 0.6, metalness: 0.08 }));
    an.rotation.x = Math.PI / 2; an.position.z = F * 0.06; bg.add(an);
    const hu = new THREE.Mesh(new THREE.CylinderGeometry(W * 0.042, W * 0.042, F * 0.16, 16), met);
    hu.rotation.x = Math.PI / 2; bg.add(hu);
    bornas.push(bg);
  }
  g.userData = { ancho: W, alto: A, fondo: F, pantalla: pan, selector: sel, bornas,
                 visor: { ancho: vw, alto: vh },
                 boca: (i) => new THREE.Vector3((i - (nB - 1) / 2) * W * 0.30, -A * 0.40, F / 2 + F * 0.09) };
  return g;
}

/* ==========================================================================
   §14 · MÓDULOS DE UN BANCO DE PRÁCTICAS DE CA
   Un laboratorio de circuitos de corriente alterna no se monta con cubos: se
   monta con MÓDULOS que se enchufan entre sí por bornas de 4 mm. Cada módulo
   lleva encima el componente de verdad —una resistencia bobinada de cerámica,
   una bobina sobre núcleo de chapa, un condensador de lata— y por eso el
   alumno puede señalar en la pantalla la R, la L y la C de las que habla la
   fórmula. Un banco con dos cajitas y ningún componente enseña lo contrario:
   que el circuito está en otro sitio, no delante.
   ========================================================================== */

/**
 * BORNA DE 4 mm (banana). Es la pieza que convierte un montaje en un montaje:
 * el color dice la polaridad o la fase, el collar aislante es lo único que se
 * puede tocar con tensión puesta, y el TALADRO —no un disco pintado— es lo que
 * dice que ahí se ENCHUFA algo. La boca mira a +Y; `userData.boca` da el punto
 * donde entra la clavija, para colgar de ahí el cable sin cifras a mano.
 */
export function bornaBanana(mat, opts = {}) {
  const { d = 0.10, alto = 0.062, color = 0xd64545, seg = 20 } = opts;
  const g = new THREE.Group();
  const R = d / 2, rb = R * 0.40;           // rb: el radio del taladro de 4 mm
  const matI = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.04 });
  /* Perfil CERRADO: sube por fuera, cruza el chaflán de la boca, baja por la
     pared del taladro y vuelve por debajo. Sin la vuelta por el taladro la
     borna sería un tapón macizo y no habría dónde enchufar. */
  const collar = new THREE.Mesh(revolucion([
    [rb, 0], [R, 0], [R, alto * 0.72], [R * 0.88, alto * 0.86], [R * 0.88, alto],
    [rb * 1.22, alto], [rb, alto * 0.86], [rb, 0],
  ], { seg }), matI);
  collar.castShadow = true; g.add(collar);
  // El casquillo metálico del fondo: es lo que de verdad hace contacto.
  const casq = new THREE.Mesh(new THREE.CylinderGeometry(rb * 0.94, rb * 0.94, alto * 0.62, 12),
    mat.cromo || mat.acero || mat.aluminio);
  casq.position.y = alto * 0.30; g.add(casq);
  g.userData = { d, alto, boca: new THREE.Vector3(0, alto * 0.90, 0), color };
  return g;
}

/**
 * RESISTENCIA BOBINADA de potencia, la de un banco de prácticas: tubo de
 * cerámica, HILO DE NICROMO enrollado a la vista y dos casquillos con su
 * tornillo. El hilo enrollado es la explicación entera de la pieza —más vueltas
 * y más fino, más ohmios— y de por qué una resistencia de potencia es un
 * componente con inductancia parásita, cosa que en un lab de CA importa.
 *
 * Eje en X, como la resistencia axial de §11. `userData.bornas` da los dos
 * puntos de conexión.
 */
export function resistenciaBobinada(mat, opts = {}) {
  const { largo = 0.62, d = 0.17, vueltas = 18, hilo = 0.015,
          ceramica = 0xe4ded0, patas = true, seg = 22 } = opts;
  const g = new THREE.Group();
  const R = d / 2, L = largo, rt = R * 0.80;
  const matC = new THREE.MeshStandardMaterial({ color: ceramica, roughness: 0.74, metalness: 0.02 });
  const tubo = new THREE.Mesh(new THREE.CylinderGeometry(rt, rt, L, seg), matC);
  tubo.rotation.z = Math.PI / 2; tubo.castShadow = true; g.add(tubo);
  // El nicromo. Se enrolla sólo en el tramo central: los extremos son donde
  // aprietan los casquillos, y ahí no puede haber hilo.
  const col = mat.acero || mat.cromo || mat.aluminio;
  const pts = [];
  const K = 22, x0 = -L * 0.34, x1 = L * 0.34, rr = rt + hilo * 0.55;
  for (let i = 0; i <= vueltas * K; i++) {
    const t = i / K, a = t * Math.PI * 2;
    pts.push(new THREE.Vector3(x0 + (x1 - x0) * (t / vueltas), Math.cos(a) * rr, Math.sin(a) * rr));
  }
  const bob = new THREE.Mesh(new THREE.TubeGeometry(
    new THREE.CatmullRomCurve3(pts, false), pts.length, hilo * 0.5, 6, false), col);
  bob.castShadow = true; g.add(bob);
  const bornas = [];
  for (const sx of [-1, 1]) {
    const cap = new THREE.Mesh(new THREE.CylinderGeometry(R, R, L * 0.13, seg),
      mat.aluminio || mat.acero);
    cap.rotation.z = Math.PI / 2; cap.position.x = sx * L * 0.435; cap.castShadow = true; g.add(cap);
    const tor = tornilloHex(mat, { d: R * 0.52, largo: R * 0.42, arandela: false });
    tor.position.set(sx * L * 0.435, R * 0.98, 0); g.add(tor);
    bornas.push(new THREE.Vector3(sx * L * 0.435, R * 1.30, 0));
  }
  if (patas) {
    for (const sx of [-1, 1]) {
      const pa = new THREE.Mesh(new THREE.BoxGeometry(L * 0.10, R * 1.15, d * 0.72),
        mat.chapa || mat.acero);
      pa.position.set(sx * L * 0.30, -R * 1.05, 0); pa.castShadow = true; g.add(pa);
    }
  }
  g.userData = { largo: L, d, cuerpo: tubo, hilo: bob, bornas };
  return g;
}

/**
 * BOBINA DE HIERRO de banco: núcleo E-I de chapa con su carrete devanado en la
 * COLUMNA CENTRAL. Es la pieza que hace que una L deje de ser un símbolo: el
 * hierro es el que fija la inductancia, y el ENTREHIERRO —si lo tiene— es el
 * que decide a qué corriente se satura, que es justo la razón de que la L de un
 * banco no valga lo mismo a 1 A que a 5 A.
 *
 * Las chapas se apilan en Z, como en `nucleoEI`. El grupo queda centrado en su
 * núcleo, con `userData.alto` para poder apoyarlo.
 */
export function bobinaHierro(mat, opts = {}) {
  const { ancho = 0.30, alto = 0.34, prof = 0.16, chapas = 9, entrehierro = 0,
          vueltas = 9, hilo = 0.011, capas = 2 } = opts;
  const g = new THREE.Group();
  const nuc = nucleoEI(mat, { ancho, alto, prof, chapas, entrehierro });
  g.add(nuc);
  const br = nuc.userData.brazo;
  const car = new THREE.Mesh(new THREE.BoxGeometry(br.largo * 0.30, br.alto * 1.5, prof * 1.5),
    mat.negro || mat.chapa);
  car.position.set(br.x, br.y, 0); g.add(car);
  /* La bobina se devana ALREDEDOR de la columna central, y esa columna va en X.
     `bobinaCampo` entrega el devanado con su eje en +Y, así que se tumba un
     cuarto de vuelta sobre Z —y sólo sobre Z: una segunda rotación lo dejaría
     enrollado sobre el apilado de chapas, que es justo por donde el flujo NO
     pasa—. Al tumbarla, su `ancho` pasa a ser la altura de la ventana y su
     `prof` el espesor del paquete: por eso van cruzados. */
  const bob = bobinaCampo(mat, {
    ancho: br.alto * 2.0, prof: prof * 1.9, alto: br.largo * 0.74,
    vueltas, hilo, capas,
  });
  bob.rotation.z = Math.PI / 2;
  bob.position.set(br.x, br.y, 0); g.add(bob);
  g.userData = { ancho, alto, prof, nucleo: nuc, bobina: bob, alturaTotal: alto };
  return g;
}

/**
 * MÓDULO DE BANCO: la bandeja sobre la que va montado un componente, con sus
 * patas de goma y sus BORNAS de 4 mm. Es lo que hace que en la pantalla se vea
 * un montaje y no un montón de piezas sueltas: el componente está sujeto a algo
 * y sus dos extremos salen a dos bornas por las que se enchufan los cables.
 *
 * `userData.bornas` son las bornas creadas (en el orden en que se piden) y
 * `userData.bocas` sus puntos de enchufe ya en coordenadas del módulo.
 */
export function moduloBanco(mat, opts = {}) {
  const { ancho = 0.52, fondo = 0.34, alto = 0.055, color = 0x2a3138,
          bornas = [-1, 1], dBorna = 0.085, colores = null, patas = true } = opts;
  const g = new THREE.Group();
  const matB = new THREE.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.14 });
  const base = new THREE.Mesh(extruido(contornoRedondeado([
    [-ancho / 2, -fondo / 2], [ancho / 2, -fondo / 2],
    [ancho / 2, fondo / 2], [-ancho / 2, fondo / 2]], Math.min(ancho, fondo) * 0.10, 3),
    { espesor: alto, bisel: alto * 0.16 }), matB);
  base.rotation.x = -Math.PI / 2;            // la plancha, tumbada sobre el banco
  base.position.y = alto / 2; base.castShadow = true; base.receiveShadow = true; g.add(base);
  if (patas) {
    const mg = mat.goma || mat.negro || matB;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.42, alto * 0.42, alto * 0.5, 10), mg);
      p.position.set(sx * ancho * 0.40, -alto * 0.25, sz * fondo * 0.34); g.add(p);
    }
  }
  const cols = colores || bornas.map((_, i) => (i % 2 === 0 ? 0xd64545 : 0x14181e));
  const lista = [], bocas = [];
  bornas.forEach((sx, i) => {
    const b = bornaBanana(mat, { d: dBorna, color: cols[i] });
    b.position.set(sx * ancho * 0.40, alto, -fondo * 0.28);
    g.add(b); lista.push(b);
    bocas.push(b.position.clone().add(b.userData.boca));
  });
  g.userData = { ancho, fondo, alto, base, bornas: lista, bocas };
  return g;
}

/** Alias interno: dentro de `instrumentoBanco` el nombre `bnc` es un parámetro. */
const bnc_ = bnc;

/**
 * INSTRUMENTO DE BANCO: un generador de funciones, un osciloscopio, un
 * frecuencímetro. Lo que hace que un aparato de laboratorio se reconozca no es
 * la caja —todas las cajas son iguales—: es su FRENTE. El visor rebajado en su
 * marco, la fila de mandos con su índice, los conectores BNC por los que entra
 * y sale la señal y las patas de goma con el pie inclinable. Un cubo gris con
 * una pantalla pegada encima puede ser cualquier cosa, incluso un microondas.
 *
 * El frente mira a +Z. `userData.pantalla` es el punto donde colgar el plano
 * de la señal (ya rebajado en el marco) y `userData.bnc` da los conectores
 * creados, para engancharles el cable sin cifras a mano.
 */
export function instrumentoBanco(mat, opts = {}) {
  const { ancho = 0.72, alto = 0.46, fondo = 0.34, color = 0x8b9490,
          visor = 0.56, visorAlto = 0.46, mandos = 3, bnc = 0,
          bncColores = null, rejilla = true, pie = true } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, D = fondo;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.58, metalness: 0.30 });
  const cuerpo = new THREE.Mesh(extruido(contornoRedondeado([
    [-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]],
    Math.min(W, H) * 0.09, 3), { espesor: D, bisel: D * 0.05 }), matC);
  cuerpo.castShadow = true; cuerpo.receiveShadow = true; g.add(cuerpo);

  /* EL MARCO DEL VISOR. La pantalla de un instrumento va HUNDIDA: el marco la
     protege de los golpes y del reflejo. Pegada por fuera, el aparato parece
     una tableta con imanes. */
  const vw = W * visor, vh = H * visorAlto;
  const my = H * 0.14;
  /* El marco es un MARCO: lleva su hueco. Extruido macizo tapaba la pantalla
     que dice proteger, y las tres pantallas del banco salían en negro. */
  const marco = new THREE.Mesh(extruido(contornoRedondeado([
    [-vw / 2 - W * 0.030, -vh / 2 - W * 0.030], [vw / 2 + W * 0.030, -vh / 2 - W * 0.030],
    [vw / 2 + W * 0.030, vh / 2 + W * 0.030], [-vw / 2 - W * 0.030, vh / 2 + W * 0.030]],
    W * 0.022, 3), { espesor: W * 0.045, bisel: W * 0.010,
      huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]] }),
    mat.negro || mat.chapa);
  marco.position.set(-W * 0.10, my, D / 2 + W * 0.015); g.add(marco);
  const fondoV = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh),
    new THREE.MeshStandardMaterial({ color: 0x070d0b, roughness: 0.42, metalness: 0.06 }));
  fondoV.position.set(-W * 0.10, my, D / 2 + W * 0.026); g.add(fondoV);
  const pantalla = new THREE.Group();
  pantalla.position.set(-W * 0.10, my, D / 2 + W * 0.030); g.add(pantalla);

  /* LOS MANDOS. Cada uno con su índice: un mando sin índice no dice en qué
     posición está, que es justo para lo que sirve un mando. */
  const mandosL = [];
  const matM = mat.negro || mat.chapa;
  const matI = mat.blanco || mat.cromo || mat.acero;
  for (let i = 0; i < mandos; i++) {
    const k = new THREE.Group();
    const rk = H * 0.085;
    const cu = new THREE.Mesh(revolucion([
      [0, 0], [rk, 0], [rk, H * 0.055], [rk * 0.72, H * 0.070], [0, H * 0.070]], { seg: 20 }), matM);
    cu.rotation.x = Math.PI / 2; k.add(cu);
    /* El índice va POR FUERA de la cara del mando: a la altura del cuerpo se
       quedaba dentro y el mando volvía a ser un botón sin posición. */
    const ix = new THREE.Mesh(new THREE.BoxGeometry(rk * 0.20, rk * 1.02, H * 0.014), matI);
    ix.position.set(0, rk * 0.46, H * 0.074); k.add(ix);
    // Los mandos, en la franja de abajo a la DERECHA; los BNC, abajo a la
    // izquierda. Repartidos por el centro se comían el visor.
    const x = W * 0.42 - i * Math.min(W * 0.16, H * 0.30);
    k.position.set(x, -H * 0.30, D / 2 + H * 0.006);
    g.add(k); mandosL.push(k);
  }

  /* LOS BNC. Es por donde entra y sale la señal: sin ellos, el cable de un
     osciloscopio nace de un costado cualquiera de la caja. */
  const bncL = [];
  for (let i = 0; i < bnc; i++) {
    const b = bnc_(mat, { d: H * 0.20, largo: H * 0.20,
      color: bncColores ? bncColores[i % bncColores.length] : 0xd8a12a });
    const x = -W * 0.40 + i * Math.min(W * 0.16, H * 0.30);
    b.position.set(x, -H * 0.30, D / 2);
    g.add(b); bncL.push(b);
  }

  if (rejilla) {                        // la rejilla de ventilación de un costado
    const mr = mat.negro || mat.chapa;
    for (let i = 0; i < 5; i++) {
      const r = new THREE.Mesh(new THREE.BoxGeometry(W * 0.012, H * 0.30, D * 0.55), mr);
      r.position.set(W / 2 - W * 0.006, -H * 0.06, -D * 0.06 + (i - 2) * D * 0.085);
      g.add(r);
    }
  }
  if (pie) {                            // las cuatro patas de goma
    const mg = mat.goma || mat.negro || matC;
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.CylinderGeometry(H * 0.045, H * 0.045, H * 0.055, 10), mg);
      p.position.set(sx * W * 0.40, -H / 2 - H * 0.026, sz * D * 0.34); g.add(p);
    }
  }
  g.userData = { ancho: W, alto: H, fondo: D, pantalla, mandos: mandosL, bnc: bncL,
    visor: { ancho: vw, alto: vh }, alturaPata: H * 0.055 };
  return g;
}

/* ==========================================================================
   §15 · PROTOBOARD Y ENCAPSULADOS DE SEMICONDUCTORES, A ESCALA DE PULGADA
   --------------------------------------------------------------------------
   Los componentes de §11 están dibujados «de oído»: sirven sueltos sobre una
   placa, pero no encajan entre sí. Aquí todo está a la MISMA escala, y esa
   escala es la de los agujeros: 1 unidad = 1 pulgada, de modo que el PASO de un
   protoboard es 0,1 y cada pata cae en un agujero de verdad. Un resistor de
   1/4 W mide 0,25 de largo y separa sus patas 0,4 —cuatro agujeros—; un TO-92
   mide 0,2 y sus patas van en tres agujeros contiguos. Con esa regla, montar un
   circuito es decir «columna 12, fila e» y no ajustar cifras a ojo.

   Convenio: el protoboard está centrado en el origen, sus columnas corren en X
   y sus filas en Z (la fila «a» mira a la cámara); `userData.hoyo(col, fila)`
   da el punto de la cara superior de ese agujero, en coordenadas del grupo. Los
   componentes tienen su origen en la CARA de la placa (y = 0) y sus patas bajan
   por debajo, igual que los de §11. Los de patas en línea (TO-92, TO-220, LED)
   tienen el origen en la pata central; los axiales y los radiales de dos
   patas, entre sus dos patas.
   Los rótulos impresos son una textura sobre la cara plana del encapsulado: es
   lo que dice QUÉ ES la pieza, y un transistor sin tipo es un cilindro negro.
   ========================================================================== */

const _PASO = 0.1;
const _metal15 = (mat) => mat.cromo || mat.acero || mat.aluminio;
const _V = (x, y, z) => new THREE.Vector3(x, y, z);

/** Textura de canvas para rótulos: con mipmaps, que es lo que evita el
 *  hormigueo de un texto pequeño visto en ángulo. */
function _etiqueta(w, h, pinta) {
  const cv = document.createElement('canvas'); cv.width = w; cv.height = h;
  const c = cv.getContext('2d'); pinta(c, w, h);
  const t = new THREE.CanvasTexture(cv); t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  return t;
}
/** Un plano con tinta encima de una cara: transparente salvo el texto. */
function _tinta(tex, w, h) {
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({
    map: tex, transparent: true, roughness: 0.55, metalness: 0,
    depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2 }));
  m.renderOrder = 2;
  return m;
}

/**
 * PROTOBOARD de 400 puntos (o los que se pidan): los dos bloques de terminales
 * —filas a–e y f–j, unidas por columna— separados por el CANAL central, que es
 * por donde se monta un integrado DIP, y los dos pares de RIELES de
 * alimentación con su raya roja (+) y azul (−). Los agujeros están en la
 * textura de la cara superior, con su mapa de relieve para que se vean
 * hundidos, y cada bloque está levantado sobre la placa de fondo: la ranura
 * entre bloques es lo que se reconoce de lejos como un protoboard.
 *
 *   hoyo(col, fila)        col 1…cols, fila 'a'…'j'
 *   riel(signo, lado, k)   signo '+'|'-', lado 'tras'|'frente', k 0…24
 */
export function protoboard(mat, opts = {}) {
  const { cols = 30, paso = _PASO, color = 0xcfcabb, rieles = true } = opts;
  const p = paso, alto = 0.26, base = 0.10;
  const g = new THREE.Group();
  const ancho = cols * p + 0.40;
  const zB0 = 0.75 * p, zB1 = 6.25 * p;               // los bloques de terminales
  const zR0 = 7.25 * p, zR1 = 9.55 * p;               // los pares de rieles
  /* `rieles`: true|'ambos' (los dos pares), 'tras' (sólo el de atrás, el que
     queda junto a quien alimenta) o false. Con uno solo la placa se acorta por
     delante, que es lo que hace una media placa de las baratas. */
  const rielAtras = rieles !== false, rielFrente = rieles === true || rieles === 'ambos';
  const zMin = -(rielAtras ? zR1 : zB1) - 0.14, zMax = (rielFrente ? zR1 : zB1) + 0.14;
  const fondo = zMax - zMin;
  const hex = '#' + color.toString(16).padStart(6, '0');

  const matLado = new THREE.MeshStandardMaterial({ color, roughness: 0.66, metalness: 0.0 });
  const matBase = new THREE.MeshStandardMaterial({ color: 0x9d9888, roughness: 0.80, metalness: 0.0 });
  const placa = new THREE.Mesh(new THREE.BoxGeometry(ancho, base, fondo), matBase);
  placa.position.set(0, base / 2, (zMin + zMax) / 2); placa.receiveShadow = true;
  placa.castShadow = true; g.add(placa);

  const xCol = (c) => (c - (cols + 1) / 2) * p;

  /* Un bloque de agujeros. Su textura lleva los huecos, las letras y los
     números; su mapa de relieve lleva sólo los huecos, en negro. La cara
     superior de una caja tiene la fila de ATRÁS arriba en la imagen. */
  function bloque(w, d, huecos, rotulos, rayas) {
    const E = 384, cw = Math.round(w * E), ch = Math.round(d * E);
    const pinta = (c, relieve) => {
      c.fillStyle = relieve ? '#fff' : hex; c.fillRect(0, 0, cw, ch);
      if (!relieve && rayas) for (const r of rayas) {
        c.fillStyle = r.col; c.fillRect(0, (r.z + d / 2) * E - 2.5, cw, 5);
      }
      for (const [x, z] of huecos) {
        const px = (x + w / 2) * E, pz = (z + d / 2) * E, s = p * E * 0.42;
        if (relieve) { c.fillStyle = '#000'; c.fillRect(px - s / 2, pz - s / 2, s, s); }
        else {
          c.fillStyle = '#14171a'; c.fillRect(px - s / 2, pz - s / 2, s, s);
          c.fillStyle = '#6b7680'; c.fillRect(px - s / 2 + 1, pz + s * 0.20, s - 2, s * 0.22);
        }
      }
      if (!relieve && rotulos) rotulos(c, E);
    };
    const cvT = document.createElement('canvas'); cvT.width = cw; cvT.height = ch; pinta(cvT.getContext('2d'), false);
    const cvB = document.createElement('canvas'); cvB.width = cw; cvB.height = ch; pinta(cvB.getContext('2d'), true);
    const tx = new THREE.CanvasTexture(cvT); tx.colorSpace = THREE.SRGBColorSpace; tx.anisotropy = 8;
    const bp = new THREE.CanvasTexture(cvB); bp.anisotropy = 8;
    const arriba = new THREE.MeshStandardMaterial({ map: tx, bumpMap: bp, bumpScale: 1.6,
      roughness: 0.62, metalness: 0.0 });
    const m = new THREE.Mesh(new THREE.BoxGeometry(w, alto - base, d),
      [matLado, matLado, arriba, matLado, matLado, matLado]);
    m.castShadow = true; m.receiveShadow = true;
    return m;
  }

  // Terminales: cada columna es un nodo de cinco agujeros. lado +1 = delante.
  const wB = cols * p + 0.20, dB = zB1 - zB0;
  for (const lado of [-1, 1]) {
    const zc = lado * (zB0 + dB / 2);
    const hu = [];
    for (let c = 1; c <= cols; c++) for (let k = 0; k < 5; k++) {
      hu.push([xCol(c), lado * (1.5 * p + k * p) - zc]);       // locales al bloque
    }
    const nombres = lado > 0 ? 'edcba' : 'fghij';
    const rot = (c, E) => {
      c.fillStyle = '#716d62'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = `bold ${Math.round(p * E * 0.34)}px sans-serif`;
      for (let k = 0; k < 5; k++) {
        c.fillText(nombres[k], 0.07 * E, (lado * (1.5 * p + k * p) - zc + dB / 2) * E);
      }
      for (let n = 5; n <= cols; n += 5) {
        c.fillText(String(n), (xCol(n) + wB / 2) * E, lado > 0 ? (dB - 0.05) * E : 0.05 * E);
      }
    };
    const b = bloque(wB, dB, hu, rot);
    b.position.set(0, (base + alto) / 2, zc);
    g.add(b);
  }

  // Rieles: grupos de cinco agujeros por hilera (los que quepan), dos hileras por par.
  const grupos = Math.max(1, Math.floor((cols + 1) / 6)), nRiel = grupos * 5;
  const posiciones = nRiel + grupos - 1;
  const xRiel = (i) => (i + Math.floor(i / 5) - (posiciones - 1) / 2) * p;
  const rielPos = { tras: {}, frente: {} };
  if (rielAtras) {
    const wR = posiciones * p + 0.20, dR = zR1 - zR0;
    for (const lado of [-1, 1]) {
      if (lado > 0 && !rielFrente) continue;
      const zc = lado * (zR0 + dR / 2);
      // «+» es la hilera exterior (raya roja al borde) y «−» la interior (azul).
      const zMas = lado * 0.70 * p, zMenos = -lado * 0.70 * p;
      const hu = [];
      for (let i = 0; i < nRiel; i++) { hu.push([xRiel(i), zMas], [xRiel(i), zMenos]); }
      const rayas = [{ z: zMas + lado * 0.36 * p, col: '#c0392b' },
                     { z: zMenos - lado * 0.36 * p, col: '#2c63b5' }];
      const b = bloque(wR, dR, hu, null, rayas);
      b.position.set(0, (base + alto) / 2, zc);
      g.add(b);
      const nom = lado > 0 ? 'frente' : 'tras';
      for (let i = 0; i < nRiel; i++) {
        rielPos[nom]['+' + i] = _V(xRiel(i), alto, zc + zMas);
        rielPos[nom]['-' + i] = _V(xRiel(i), alto, zc + zMenos);
      }
    }
  }

  // j…f atrás (z<0), e…a delante (z>0); el canal queda entre f y e.
  const hoyo = (col, fila) => {
    const f = 'abcdefghij'.indexOf(String(fila).toLowerCase());
    return _V(xCol(col), alto, f < 5 ? (5.5 - f) * p : -(f - 3.5) * p);
  };
  g.userData = { ancho, fondo, alto, paso: p, cols, hoyo, xCol, zMin, zMax, nRiel,
    riel: (signo, lado, k) => rielPos[lado][signo + k].clone() };
  return g;
}

/**
 * CÓDIGO DE COLORES de un resistor: de un valor en ohmios a la lista de
 * colores de sus bandas, en el orden en que se leen. Con tolerancia del 5 % o
 * del 10 % son cuatro bandas (dos cifras, multiplicador, tolerancia); con el
 * 1 % o el 2 %, cinco (tres cifras). Un valor por debajo de 10 Ω usa el
 * multiplicador dorado (×0,1) o plateado (×0,01).
 */
export function codigoColores(ohm, tol = 5) {
  const CIF = ['#141414', '#6b3a1a', '#c0281e', '#e0711a', '#e8c81a',
               '#2e9a3c', '#2a62c8', '#8a46c8', '#8a8a8a', '#ececec'];
  const ORO = '#c9a227', PLATA = '#b8bcc4';
  const n = tol <= 2 ? 3 : 2;
  const v = Math.max(ohm, 0.01);
  let e = Math.floor(Math.log10(v));
  let m = Math.round(v / Math.pow(10, e - (n - 1)));
  if (m >= Math.pow(10, n)) { m = Math.round(m / 10); e += 1; }
  const mult = e - (n - 1);
  const cols = String(m).padStart(n, '0').split('').map((d) => CIF[+d]);
  cols.push(mult === -1 ? ORO : mult <= -2 ? PLATA : CIF[Math.min(9, Math.max(0, mult))]);
  cols.push(tol <= 1 ? CIF[1] : tol <= 2 ? CIF[2] : tol <= 5 ? ORO : PLATA);
  return cols;
}

/**
 * RESISTOR axial de 1/4 W con el código de colores de SU VALOR: el dibujo dice
 * lo mismo que el panel. `ponValor(ohm)` repinta las bandas sin rehacer nada,
 * que es lo que hace falta cuando el alumno cambia la resistencia con un botón.
 * Sus patas separan 0,4 (cuatro agujeros) salvo que se pida otro `paso`.
 */
export function resistorAxial(mat, opts = {}) {
  const { ohm = 1000, tol = 5, largo = 0.25, d = 0.095, paso = 0.4, patas = 0.08 } = opts;
  const metalFilm = tol <= 2;
  const g = resistencia(mat, { largo, d, paso, patas, bandas: codigoColores(ohm, tol),
    cuerpo: metalFilm ? 0x6f9bc4 : 0xcdb687 });
  g.userData.ponValor = (nuevo) => {
    const cs = codigoColores(nuevo, tol);
    g.userData.bandas.forEach((b, i) => b.material.color.set(cs[i]));
    g.userData.ohm = nuevo;
  };
  g.userData.ohm = ohm; g.userData.tol = tol;
  g.userData.puntas = [_V(-paso / 2, 0, 0), _V(paso / 2, 0, 0)];
  return g;
}

/** Cuerpo axial común a los diodos DO-41 (epoxi) y DO-35 (vidrio): tumbado en
 *  +X, con la banda del CÁTODO en `catodo` (+1 = hacia +X) y las patas dobladas
 *  que bajan a dos agujeros separados `paso`. */
function _diodoAxialReal(mat, o) {
  const { largo, d, cuerpo, banda, bandaAncho, rotulo, tinta, vidrio, paso, patas,
          catodo, rPata } = o;
  const g = new THREE.Group();
  const R = d / 2, L = largo, yb = R + 0.028;
  const met = _metal15(mat);
  const matC = vidrio
    ? new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.18, metalness: 0.0,
        transparent: true, opacity: 0.72, emissive: cuerpo, emissiveIntensity: 0.12 })
    : new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.52, metalness: 0.08 });
  const cue = new THREE.Mesh(revolucion([
    [0, -L / 2], [R * 0.80, -L / 2], [R, -L / 2 + R * 0.20], [R, L / 2 - R * 0.20],
    [R * 0.80, L / 2], [0, L / 2]], { seg: 20 }), matC);
  cue.rotation.z = -Math.PI / 2; cue.position.y = yb; cue.castShadow = true; g.add(cue);
  const bd = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.012, R * 1.012, L * bandaAncho, 20),
    new THREE.MeshStandardMaterial({ color: banda, roughness: 0.5, metalness: banda === 0xc9ced4 ? 0.5 : 0.04 }));
  bd.rotation.z = Math.PI / 2; bd.position.set(catodo * (L / 2 - L * bandaAncho / 2 - R * 0.05), yb, 0);
  g.add(bd);
  if (vidrio) {
    // Por dentro del vidrio se ve lo que hay: dos tapones de dumet y la pastilla.
    for (const sx of [-1, 1]) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.62, R * 0.62, L * 0.30, 14), met);
      t.rotation.z = Math.PI / 2; t.position.set(sx * L * 0.30, yb, 0); g.add(t);
    }
    const pa = new THREE.Mesh(new THREE.BoxGeometry(L * 0.10, R * 0.55, R * 0.55),
      new THREE.MeshStandardMaterial({ color: 0x0f1216, roughness: 0.5 }));
    pa.position.set(0, yb, 0); g.add(pa);
  }
  if (rotulo) {
    const tx = _etiqueta(256, 64, (c, w, h) => {
      c.fillStyle = tinta; c.font = 'bold 40px sans-serif'; c.textAlign = 'center';
      c.textBaseline = 'middle'; c.fillText(rotulo, w / 2, h / 2 + 2);
    });
    const t = _tinta(tx, L * (0.62 - bandaAncho * 0.5), d * 0.62);
    t.position.set(-catodo * L * 0.08, yb, R * 1.012); g.add(t);
  }
  const P = paso / 2;
  for (const sx of [-1, 1]) {
    g.add(_hilo([_V(sx * L * 0.49, yb, 0), _V(sx * (P - R * 0.9), yb, 0),
      _V(sx * P, yb - R * 1.1, 0), _V(sx * P, -patas, 0)], rPata, met));
  }
  g.userData = { largo: L, d, paso, catodo, cuerpo: cue, banda: bd, alturaEje: yb,
    puntas: [_V(-P, 0, 0), _V(P, 0, 0)] };
  return g;
}

/**
 * DIODO de encapsulado DO-41, el de un 1N4007 o un 1N5819: cuerpo de epoxi
 * negro, BANDA PLATEADA en el cátodo y el código impreso a lo largo. La banda
 * es el dato: dice hacia dónde conduce, y montarlo al revés es la avería más
 * repetida de un montaje de prácticas.
 */
export function diodoRectificador(mat, opts = {}) {
  const { rotulo = '1N4007', cuerpo = 0x1b1e22, banda = 0xc9ced4, paso = 0.4,
          patas = 0.08, catodo = 1 } = opts;
  return _diodoAxialReal(mat, { largo: 0.20, d: 0.106, cuerpo, banda, bandaAncho: 0.16,
    rotulo, tinta: '#cfd5db', vidrio: false, paso, patas, catodo, rPata: 0.016 });
}

/**
 * DIODO de VIDRIO DO-35, el de un 1N4148 o un zener de 500 mW: cuerpo
 * translúcido —por dentro se ven la pastilla y los dos tapones de dumet— y la
 * banda NEGRA del cátodo. Es la pieza más pequeña de un montaje y la más
 * fácil de montar al revés.
 */
export function diodoVidrio(mat, opts = {}) {
  const { rotulo = null, cuerpo = 0xd9822b, banda = 0x101215, paso = 0.4,
          patas = 0.08, catodo = 1 } = opts;
  return _diodoAxialReal(mat, { largo: 0.135, d: 0.071, cuerpo, banda, bandaAncho: 0.17,
    rotulo, tinta: '#1b1b1b', vidrio: true, paso, patas, catodo, rPata: 0.011 });
}

/**
 * TRANSISTOR TO-92 con su CARA PLANA ROTULADA. El cuerpo es un cilindro
 * truncado y la cara plana lleva el tipo impreso —«BC547B», «2N3904»—: es lo
 * que dice qué es y, con la hoja de datos delante, cuál es cada pata. Las tres
 * van en línea, a un paso de distancia, y el origen es la pata central.
 * `userData.patas` da, en orden, el punto de cada pata en la cara de la placa.
 */
export function to92Rotulado(mat, opts = {}) {
  const { d = 0.20, alto = 0.20, patas = 0.12, paso = _PASO, rotulo = 'BC547',
          cuerpo = 0x1e2329, levanta = 0.07, pines = ['C', 'B', 'E'] } = opts;
  const g = new THREE.Group();
  const R = d / 2, yf = 0.60 * R, bis = R * 0.26;
  /* `extruido` ENGROSA el contorno con el bisel, así que se dibuja más chico en
     lo que va a engordar: la caja final mide justo `d`. */
  const Rc = R - bis, yc = yf - bis, a0 = Math.atan2(-yc, Math.sqrt(Rc * Rc - yc * yc));
  const cont = [];
  for (let k = 0; k <= 26; k++) {
    const a = a0 + (Math.PI - 2 * a0) * (k / 26);
    cont.push([Math.cos(a) * Rc, Math.sin(a) * Rc]);
  }
  // El contorno vive en XY y se tumba: su y pasa a ser −z, así que la cara plana
  // (y = −yf) queda mirando a +Z, hacia la cámara.
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.60, metalness: 0.04 });
  const cue = new THREE.Mesh(extruido(cont, { espesor: alto, bisel: bis, biselSeg: 3 }), matC);
  cue.rotation.x = -Math.PI / 2; cue.position.y = levanta + alto / 2; cue.castShadow = true; g.add(cue);
  const tx = _etiqueta(256, 128, (c, w, h) => {
    c.fillStyle = '#d4d9de'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 44px sans-serif'; c.fillText(rotulo, w / 2, h * 0.38);
    c.font = '30px sans-serif'; c.fillText('CEN', w / 2, h * 0.76);
  });
  const t = _tinta(tx, R * 1.10, R * 1.10 * 0.5);
  t.position.set(0, levanta + alto * 0.52, yf + 0.0015); g.add(t);
  const met = _metal15(mat);
  const pts = [];
  for (let i = -1; i <= 1; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, patas + levanta + 0.02, 8), met);
    l.position.set(i * paso, (levanta + 0.02 - patas) / 2, yf * 0.45); g.add(l);
    pts.push(_V(i * paso, 0, yf * 0.45));
  }
  g.userData = { d, alto, cuerpo: cue, patas: pts, pines, alturaTotal: levanta + alto, rotulo: t };
  return g;
}

/**
 * TRANSISTOR TO-220 con ALETA y RÓTULO: cuerpo de plástico negro con el tipo
 * impreso, la aleta metálica por detrás con su AGUJERO para el tornillo y las
 * tres patas planas en línea. La aleta no es adorno: en un MOSFET o un
 * regulador está conectada eléctricamente a una pata —el drenador, aquí—, y
 * por eso a veces hace falta una mica aislante al atornillarla a un disipador.
 * El origen es la pata central, en la cara de la placa.
 */
export function to220Rotulado(mat, opts = {}) {
  const { ancho = 0.40, alto = 0.36, grueso = 0.17, aletaAlto = 0.25, patas = 0.34,
          paso = _PASO, rotulo = 'IRF540N', rotulo2 = 'G  D  S', levanta = 0.16,
          cuerpo = 0x191c20, tumbado = false } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const matC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.62, metalness: 0.04 });
  const y0 = levanta, pa = tumbado ? 0.02 : patas;
  const pla = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, 0], [ancho / 2, 0], [ancho / 2, alto], [-ancho / 2, alto]], ancho * 0.04, 3),
    { espesor: grueso, bisel: grueso * 0.10 }), matC);
  pla.position.set(0, y0, 0); pla.castShadow = true; g.add(pla);
  const e = 0.045;                                  // espesor de la aleta
  const ale = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, alto * 0.30], [ancho / 2, alto * 0.30], [ancho / 2, alto + aletaAlto],
     [-ancho / 2, alto + aletaAlto]], [0, 0, ancho * 0.12, ancho * 0.12], 4),
    { huecos: [circulo(0, alto + aletaAlto * 0.56, ancho * 0.145, 18)],
      espesor: e, bisel: e * 0.15 }), met);
  ale.position.set(0, y0, -grueso / 2 + e / 2); ale.castShadow = true; g.add(ale);
  const tx = _etiqueta(512, 192, (c, w, h) => {
    c.fillStyle = '#d4d9de'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 84px sans-serif'; c.fillText(rotulo, w / 2, h * 0.30);
    c.font = '46px sans-serif'; c.fillText('CEN LABS', w / 2, h * 0.64);
    c.font = '34px monospace'; c.fillStyle = '#9aa3ab'; c.fillText(rotulo2, w / 2, h * 0.88);
  });
  const t = _tinta(tx, ancho * 0.84, ancho * 0.84 * 192 / 512);
  t.position.set(0, y0 + alto * 0.52, grueso / 2 + 0.0015); g.add(t);
  const pts = [];
  for (let i = -1; i <= 1; i++) {
    const hombro = new THREE.Mesh(new THREE.BoxGeometry(0.058, 0.08, 0.022), met);
    hombro.position.set(i * paso, y0 - 0.04, 0.012); g.add(hombro);
    const Ll = pa + y0 - 0.08;
    const l = new THREE.Mesh(new THREE.BoxGeometry(0.030, Ll, 0.020), met);
    l.position.set(i * paso, (y0 - 0.08 - pa) / 2, 0.012); g.add(l);
    pts.push(_V(i * paso, 0, 0.012));
  }
  g.userData = { ancho, alto, cuerpo: pla, aleta: ale, patas: pts, rotulo: t,
    alturaTotal: y0 + alto + aletaAlto };
  if (!tumbado) return g;
  /* TUMBADO: así se monta en un protoboard un TO-220 que no va a un disipador,
     con las patas dobladas noventa grados. Queda a ras de la placa, con el
     rótulo hacia arriba y la aleta hacia el fondo; tapa mucho menos y se lee
     igual. Se gira el cuerpo entero un cuarto de vuelta sobre X —su cara
     delantera pasa a mirar arriba y su «arriba» al fondo— y cada pata baja al
     agujero con un tramo vertical. El cuerpo queda DETRÁS del agujero. */
  const w = new THREE.Group();
  g.rotation.x = -Math.PI / 2; g.position.y = grueso / 2 + 0.02; w.add(g);
  for (let i = -1; i <= 1; i++) {
    const v = new THREE.Mesh(new THREE.BoxGeometry(0.030, grueso + 0.14, 0.020), met);
    v.position.set(i * paso, (grueso + 0.14) / 2 - 0.14 + 0.02, 0); w.add(v);
  }
  w.userData = Object.assign({}, g.userData, { tumbado: true,
    largoAtras: y0 + alto + aletaAlto, rotuloPlano: t });
  return w;
}

/**
 * CONDENSADOR ELECTROLÍTICO radial con su FUNDA impresa: manga de color con el
 * valor y la tensión escritos en vertical, la FRANJA DEL NEGATIVO con sus
 * signos «−», la tapa de aluminio con la entalla de alivio y el asiento de
 * goma. La pata larga es el positivo. Montado al revés se hincha y revienta por
 * la entalla, que es la razón de que la franja esté a la vista.
 * El origen es el centro entre las dos patas; el negativo queda en −X.
 */
export function electrolitico(mat, opts = {}) {
  const { d = 0.25, alto = 0.43, paso = _PASO, valor = '100µF', volt = '25V',
          manga = 0x1b3358, patas = 0.30 } = opts;
  const g = new THREE.Group();
  const R = d / 2, sh = 0.03;
  const al = new THREE.MeshStandardMaterial({ color: 0xb7bcc2, roughness: 0.34, metalness: 0.85 });
  const lata = new THREE.Mesh(revolucion([
    [0, sh], [R * 0.96, sh], [R * 0.96, alto - R * 0.34], [R * 0.90, alto - R * 0.26],
    [R * 0.90, alto - R * 0.10], [R * 0.96, alto - R * 0.04], [R * 0.96, alto], [0, alto]],
    { seg: 28 }), al);
  lata.castShadow = true; g.add(lata);
  const asi = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.97, R * 0.97, sh, 28),
    mat.goma || new THREE.MeshStandardMaterial({ color: 0x14181e, roughness: 0.85 }));
  asi.position.y = sh / 2; g.add(asi);
  const tinta = new THREE.MeshStandardMaterial({ color: 0x23282e, roughness: 0.8 });
  for (const a of [0, Math.PI / 2]) {                 // la entalla de alivio de la tapa
    const en = new THREE.Mesh(new THREE.BoxGeometry(R * 1.30, R * 0.04, R * 0.07), tinta);
    en.position.y = alto + R * 0.004; en.rotation.y = a; g.add(en);
  }
  const hexM = '#' + manga.toString(16).padStart(6, '0');
  const tx = _etiqueta(1024, 512, (c, w, h) => {
    c.fillStyle = hexM; c.fillRect(0, 0, w, h);
    // la franja del negativo, centrada en u = 0,25 (−X), con sus signos
    const x0 = w * 0.25 - w * 0.075, wf = w * 0.15;
    c.fillStyle = '#dfe6ee'; c.fillRect(x0, 0, wf, h);
    c.fillStyle = '#23324a'; c.font = 'bold 120px sans-serif'; c.textAlign = 'center';
    c.textBaseline = 'middle';
    for (let k = 0; k < 4; k++) c.fillText('−', x0 + wf / 2, h * (0.14 + 0.24 * k));
    // el texto, en vertical y de abajo arriba, en la cara que mira a +Z (u = 0,5)
    // El texto va por DOS lados (delante y detrás, partido por la costura): el
    // condensador se monta con el negativo a un lado u otro según el circuito.
    for (const cxm of [w * 0.50, 0, w]) {
      c.save(); c.translate(cxm, h * 0.5); c.rotate(-Math.PI / 2);
      c.fillStyle = '#e6edf4'; c.font = 'bold 118px sans-serif'; c.textAlign = 'center';
      c.fillText((valor + ' ' + volt).trim(), 0, -40);
      c.font = '70px sans-serif'; c.fillStyle = '#b9c7d8'; c.fillText('105°C  CEN', 0, 70); c.restore();
    }
  });
  const man = new THREE.Mesh(new THREE.CylinderGeometry(R * 1.012, R * 1.012, alto - sh - R * 0.30, 32, 1,
    true, -Math.PI, Math.PI * 2),
    new THREE.MeshStandardMaterial({ map: tx, roughness: 0.46, metalness: 0.10, side: THREE.FrontSide }));
  man.position.y = sh + (alto - sh - R * 0.30) / 2; man.castShadow = true; g.add(man);
  const met = _metal15(mat);
  const largo = [patas + 0.07, patas];                // [+, −]: la larga es el positivo
  [[1, largo[0]], [-1, largo[1]]].forEach(([s, lg]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0125, 0.0125, lg + sh, 8), met);
    l.position.set(s * paso / 2, (sh - lg) / 2, 0); g.add(l);
  });
  g.userData = { d, alto, paso, cuerpo: lata, manga: man,
    mas: _V(paso / 2, 0, 0), menos: _V(-paso / 2, 0, 0) };
  return g;
}

/**
 * LED de 5 mm con lo que se ve por dentro: el yunque donde apoya la pastilla
 * en la pata del CÁTODO, el poste con su hilo en la del ánodo, la brida con su
 * CHAFLÁN plano en el lado del cátodo y las patas de DISTINTO LARGO —la larga
 * es el ánodo—. Cuatro marcas que dicen lo mismo: cuál es el negativo.
 * Origen en el centro entre las patas; el cátodo queda en −X.
 * `enciende(v)` va de 0 a 1 y sólo toca el emisivo: sin halos pegados.
 */
export function led5mm(mat, opts = {}) {
  const { color = 0xd2342b, paso = _PASO, levanta = 0.10, patas = 0.34, encendido = 0 } = opts;
  const g = new THREE.Group();
  const d = 0.197, R = d / 2;
  const matL = new THREE.MeshStandardMaterial({ color, roughness: 0.16, metalness: 0.0,
    transparent: true, opacity: 0.74, emissive: color, emissiveIntensity: 0.06 + 0.5 * encendido });
  const cup = [[0, 0], [R, 0], [R, 0.17]];
  for (let k = 1; k <= 10; k++) {
    const a = (k / 10) * Math.PI / 2;
    cup.push([R * Math.cos(a), 0.17 + 0.165 * Math.sin(a)]);
  }
  const epox = new THREE.Mesh(revolucion(cup, { seg: 28 }), matL);
  epox.position.y = levanta + 0.04; epox.castShadow = true; g.add(epox);
  const Rf = R * 1.18, a = Math.acos(-0.86), br = [];
  for (let k = 0; k <= 24; k++) {
    const t = -a + 2 * a * (k / 24);
    br.push([Math.cos(t) * Rf, Math.sin(t) * Rf]);
  }
  const bri = new THREE.Mesh(extruido(br, { espesor: 0.04, bisel: 0.006 }), matL);
  bri.rotation.x = -Math.PI / 2; bri.position.y = levanta + 0.02; g.add(bri);
  const met = _metal15(mat);
  // por dentro: el yunque (copa) sobre la pata corta y el poste de la larga
  const copa = new THREE.Mesh(revolucion([[0, 0], [0.026, 0], [0.050, 0.042], [0.040, 0.042],
    [0.0, 0.016]], { seg: 14 }), met);
  copa.position.set(-paso / 2, levanta + 0.17, 0); g.add(copa);
  const post = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.19, 8), met);
  post.position.set(paso / 2, levanta + 0.04 + 0.095, 0); g.add(post);
  const hilo = new THREE.Mesh(new THREE.CylinderGeometry(0.004, 0.004, paso * 1.0, 6), met);
  hilo.rotation.z = Math.PI / 2; hilo.position.set(0, levanta + 0.215, 0); g.add(hilo);
  const pie = [patas + 0.08, patas - 0.04];           // [ánodo, cátodo]: la larga es el ánodo
  [[1, pie[0], 0.0125], [-1, pie[1], 0.0125]].forEach(([s, lg, r]) => {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(r, r, lg + levanta, 8), met);
    l.position.set(s * paso / 2, (levanta - lg) / 2, 0); g.add(l);
  });
  g.userData = { d, cuerpo: epox, material: matL,
    anodo: _V(paso / 2, 0, 0), catodo: _V(-paso / 2, 0, 0),
    enciende: (v) => { matL.emissiveIntensity = 0.06 + 0.5 * Math.max(0, Math.min(1, v)); } };
  return g;
}

/**
 * DIODO SMD en su PLACA ADAPTADORA, que es como llega un SMA o un SMB —el del
 * TVS, el del Schottky de potencia— a un protoboard: no tiene patas, así que se
 * suelda a una plaquita de cobre que sí las tiene. El cuerpo lleva la banda del
 * cátodo, las dos pistas con sus almohadillas y las espigas de 2,54 mm.
 * El origen es el centro entre las espigas, que separan `paso`.
 */
export function diodoSMD(mat, opts = {}) {
  const { rotulo = 'SMAJ5.0A', paso = 0.4, catodo = 1, placa = 0x1f7a49, banda = 0xc9ced4 } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const W = paso + 0.20, D = 0.22, esp = 0.04, y0 = 0.10;
  const pcb = new THREE.Mesh(new THREE.BoxGeometry(W, esp, D),
    new THREE.MeshStandardMaterial({ color: placa, roughness: 0.55, metalness: 0.05 }));
  pcb.position.y = y0 + esp / 2; pcb.castShadow = true; g.add(pcb);
  const oro = new THREE.MeshStandardMaterial({ color: 0xd8b04c, roughness: 0.35, metalness: 0.85 });
  for (const s of [-1, 1]) {
    const pad = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.004, 0.14), oro);
    pad.position.set(s * 0.115, y0 + esp + 0.002, 0); g.add(pad);
    const pista = new THREE.Mesh(new THREE.BoxGeometry(paso / 2 - 0.115 + 0.01, 0.004, 0.05), oro);
    pista.position.set(s * (0.115 + 0.085 + (paso / 2 - 0.115 - 0.085) / 2), y0 + esp + 0.002, 0);
    g.add(pista);
    const esp1 = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, y0 + esp + 0.10 + 0.08, 6), met);
    esp1.position.set(s * paso / 2, (-0.10 - 0.08 + (y0 + esp)) / 2 + 0.0, 0); g.add(esp1);
  }
  const zy = y0 + esp + 0.004;
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-0.085, -0.05], [0.085, -0.05], [0.085, 0.05], [-0.085, 0.05]], 0.012, 2),
    { espesor: 0.085, bisel: 0.010 }), new THREE.MeshStandardMaterial({ color: 0x1b1e22, roughness: 0.55 }));
  cue.rotation.x = -Math.PI / 2; cue.position.set(0, zy + 0.0425, 0); cue.castShadow = true; g.add(cue);
  const bd = new THREE.Mesh(new THREE.BoxGeometry(0.022, 0.087, 0.101),
    new THREE.MeshStandardMaterial({ color: banda, roughness: 0.4, metalness: 0.5 }));
  bd.position.set(catodo * 0.062, zy + 0.0435, 0); g.add(bd);
  const tx = _etiqueta(256, 64, (c, w, h) => {
    c.fillStyle = '#e7ecf1'; c.font = 'bold 38px sans-serif'; c.textAlign = 'center';
    c.textBaseline = 'middle'; c.fillText(rotulo, w / 2, h / 2);
  });
  const tt = _tinta(tx, 0.20, 0.20 * 0.25);
  tt.rotation.x = -Math.PI / 2; tt.position.set(0, y0 + esp + 0.09, 0); tt.visible = true;
  g.add(tt); tt.position.y = zy + 0.0865;
  g.userData = { paso, catodo, cuerpo: cue, banda: bd, puntas: [_V(-paso / 2, 0, 0), _V(paso / 2, 0, 0)] };
  return g;
}

/**
 * PUENTE (jumper) de protoboard: hilo rígido con su aislante de color, que sale
 * recto del agujero, hace un arco y baja al otro. `A` y `B` son los puntos de la
 * cara de la placa —los que da `hoyo()` o `riel()`—. Con `pinA` o `pinB` en
 * falso, ese extremo no lleva espiga y queda libre: sirve para cables que
 * llegan de un instrumento, con `r` mayor. `minAlto` fuerza un arco mínimo: un
 * puente corto que cruza el canal por encima de un TO-92 tiene que subir más
 * que el transistor, y la fórmula por defecto lo dejaría pegado a la placa.
 */
export function puente(mat, A, B, opts = {}) {
  const { color = 0xd64545, r = 0.022, alto = 0.30, pinA = true, pinB = true, sale = 0.08,
          minAlto = 0 } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const dist = A.distanceTo(B);
  const h = Math.max(minAlto, Math.min(alto, 0.05 + dist * 0.10));
  const pts = [];
  pts.push(A.clone().add(_V(0, sale, 0)));
  const f = (t, k) => A.clone().lerp(B, t).add(_V(0, sale + k * h, 0));
  pts.push(f(0.18, 0.85), f(0.5, 1.0), f(0.82, 0.85));
  pts.push(B.clone().add(_V(0, sale, 0)));
  const curva = new THREE.CatmullRomCurve3(pts);
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(curva, 36, r, 8, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.50, metalness: 0.04 }));
  tubo.castShadow = true; g.add(tubo);
  [[A, pinA], [B, pinB]].forEach(([P, hay]) => {
    if (!hay) return;
    const pin = new THREE.Mesh(new THREE.CylinderGeometry(0.0115, 0.0115, sale + 0.09, 8), met);
    pin.position.set(P.x, P.y + (sale - 0.09) / 2 - 0.0, P.z); g.add(pin);
    const tapa = new THREE.Mesh(new THREE.CylinderGeometry(r * 1.0, r * 1.0, 0.02, 8),
      tubo.material);
    tapa.position.set(P.x, P.y + sale, P.z); g.add(tapa);
  });
  g.userData = { tubo };
  return g;
}

/**
 * INSTRUMENTO DE BANCO CON PANTALLA PROPIA: una fuente o un medidor con su
 * visor rebajado, sus mandos y sus BORNAS de 4 mm en la parte baja del frente.
 * Devuelve el canvas listo para pintar (`cv`, `cx`, `tex`) y los puntos donde
 * enchufa cada cable (`bocas`, en coordenadas del propio instrumento), que es
 * lo que hace que el cable nazca de una borna y no de un costado cualquiera.
 * El grupo se apoya en el banco con `userData.apoyo`: es la altura a la que hay
 * que poner su origen para que las patas de goma toquen la mesa.
 */
export function instrumentoConPantalla(mat, opts = {}) {
  const { ancho = 0.9, alto = 0.5, fondo = 0.36, mandos = 2, cw = 400,
          bornas = [0xd64545, 0x14181e], color = 0x8b9490,
          visor = 0.70, visorAlto = 0.46 } = opts;
  const g = instrumentoBanco(mat, { ancho, alto, fondo, mandos, bnc: 0, color, visor, visorAlto });
  const vis = g.userData.visor;
  const ch = Math.round(cw * vis.alto / vis.ancho);
  const cv = document.createElement('canvas'); cv.width = cw; cv.height = ch;
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const screen = new THREE.Mesh(new THREE.PlaneGeometry(vis.ancho * 0.98, vis.alto * 0.98),
    new THREE.MeshStandardMaterial({ map: tex, emissive: 0x0a1512, emissiveMap: tex,
      emissiveIntensity: 0.6, roughness: 0.4 }));
  g.userData.pantalla.add(screen);
  const bocas = [];
  bornas.forEach((col, i) => {
    const b = bornaBanana(mat, { d: ancho * 0.095, color: col });
    b.rotation.x = Math.PI / 2;
    b.position.set(-ancho * 0.40 + i * ancho * 0.14, -alto * 0.30, fondo / 2);
    g.add(b);
    bocas.push(b.position.clone().add(_V(0, 0, b.userData.boca.y)));
  });
  g.userData.apoyo = alto / 2 + alto * 0.0535;
  Object.assign(g.userData, { cv, cx, tex, screen, bocas, ch });
  return g;
}

/**
 * BANCO DE PROTOTIPOS: la mesa, el estante con sus instrumentos y el
 * protoboard, ya montados y a una escala (`K` unidades por pulgada) con la que
 * el circuito llena el cuadro. Es lo que tienen en común los laboratorios de
 * electrónica de semiconductores, y lo que cambia de uno a otro es sólo el
 * circuito que se arma en `circ`.
 *
 * Los instrumentos van ELEVADOS en un estante, detrás del montaje: a esta
 * escala el protoboard sube casi medio palmo y, en el suelo, se los comería.
 *
 *   H(col, fila)            punto de la cara del protoboard (coordenadas locales)
 *   rielCerca(signo, col)   el agujero libre del riel trasero más cercano en X
 *   instrumento(i)          { g, cv, cx, tex, screen, bocas } del i-ésimo
 *   cable(i, j, agujero, color)  del conector j del instrumento i a un agujero
 *   reiniciaRieles()        olvida qué agujeros de riel están ocupados
 *   limpia()                vacía `circ` liberando geometrías y texturas
 *
 * Valores recomendados para el resto de la escena: cámara en (0, 4.3, 6.9)
 * mirando a (0, 1.15, 0.5); el pizarrón, a escala 1, en (0, 2.3, −1.55).
 */
export function bancoPrototipos(mat, opts = {}) {
  const { cols = 18, K = 1.7, color = 0x9a978a, instrumentos = 2, anchoInst = null,
          bornas = null, dims = null } = opts;
  const g = new THREE.Group();
  const mMesa = mat.mesa || new THREE.MeshStandardMaterial({ color: 0x0e1512, roughness: 0.9, metalness: 0.05 });
  const mEst = mat.estante || new THREE.MeshStandardMaterial({ color: 0x11201c, roughness: 0.6, metalness: 0.3 });
  const mesa = new THREE.Mesh(new THREE.BoxGeometry(4.5, 0.10, 3.9), mMesa);
  mesa.position.set(0, -0.05, 0.55); mesa.receiveShadow = true; g.add(mesa);
  const EY = 0.60;
  const est = new THREE.Mesh(new THREE.BoxGeometry(4.3, 0.06, 0.62), mEst);
  est.position.set(0, EY - 0.03, -1.15); est.castShadow = est.receiveShadow = true; g.add(est);
  for (const sx of [-1, 1]) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.06, EY - 0.06, 0.5), mEst);
    pa.position.set(sx * 2.1, (EY - 0.06) / 2, -1.15); pa.castShadow = true; g.add(pa);
  }
  const prot = protoboard(mat, { cols, rieles: 'tras', color });
  prot.scale.setScalar(K); prot.position.set(0, 0, 1.15); g.add(prot);
  const circ = new THREE.Group(); prot.add(circ);
  const H = prot.userData.hoyo;

  const n = instrumentos;
  const xs = n === 1 ? [0] : n === 2 ? [-1.45, 1.45] : n === 3 ? [-1.55, 0, 1.55]
    : Array.from({ length: n }, (_, i) => -1.7 + i * 3.4 / (n - 1));
  const ai = anchoInst || (n >= 3 ? 0.80 : 0.84);
  const lista = xs.map((x, i) => {
    const dm = (dims && dims[i]) || {};
    const ins = instrumentoConPantalla(mat, { ancho: dm.ancho || ai, alto: dm.alto || 0.48,
      fondo: dm.fondo || 0.36, mandos: 2, bornas: bornas ? bornas[i] : undefined,
      visorAlto: dm.visorAlto || 0.46 });
    ins.position.set(x, EY + ins.userData.apoyo, -1.15); g.add(ins);
    return ins;
  });
  const usados = {};
  const rielCerca = (signo, col) => {
    const x = H(col, 'e').x; let mejor = -1, dm = 1e9;
    for (let i = 0; i < prot.userData.nRiel; i++) {
      if (usados[signo + i]) continue;
      const d = Math.abs(prot.userData.riel(signo, 'tras', i).x - x);
      if (d < dm) { dm = d; mejor = i; }
    }
    usados[signo + mejor] = 1;
    return prot.userData.riel(signo, 'tras', mejor);
  };
  const aProt = (ins, j) => ins.userData.bocas[j].clone().add(ins.position)
    .sub(prot.position).multiplyScalar(1 / K);
  /* Una borna, un cable. Los labs que rearman la placa vuelven a cablear los
     instrumentos tras `limpia()`, que sólo vacía `circ`; como el cable cuelga
     de `prot`, cada rearmado dejaba el anterior colgando. Recablear la misma
     borna sustituye el cable viejo, y el que se cablea una sola vez al montar
     sigue ahí después de `limpia()`. */
  const cables = new Map();
  const cable = (i, j, agujero, col, extra = {}) => {
    const clave = i + '/' + j;
    const viejo = cables.get(clave);
    if (viejo) {
      prot.remove(viejo);
      viejo.traverse((o) => { if (o.geometry) o.geometry.dispose(); });
    }
    const w = puente(mat, agujero, aProt(lista[i], j),
      Object.assign({ color: col, r: 0.026 / K, alto: 0.30, pinB: false }, extra));
    prot.add(w); cables.set(clave, w); return w;
  };
  const instrumento = (i) => {
    const u = lista[i].userData;
    return { g: lista[i], cv: u.cv, cx: u.cx, tex: u.tex, screen: u.screen, bocas: u.bocas };
  };
  const limpia = () => {
    while (circ.children.length) {
      const v = circ.children[0]; circ.remove(v);
      v.traverse((o) => { if (o.geometry) o.geometry.dispose(); if (o.material && o.material.map) o.material.map.dispose(); });
    }
  };
  const reiniciaRieles = () => { for (const k in usados) delete usados[k]; };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = { prot, circ, K, H, rielCerca, instrumento, cable, limpia, reiniciaRieles,
    cuenta: n, estanteY: EY };
  return g;
}

/**
 * CIRCUITO INTEGRADO DIP con RÓTULO y MUESCA, a paso de protoboard. Se monta a
 * caballo del canal central: las patas de una fila caen en la fila «e» y las de
 * la otra en la «f». Con la muesca a la izquierda, la pata 1 es la de la fila
 * delantera, a la izquierda, y se numera en sentido antihorario visto desde
 * arriba: delante 1…n/2 de izquierda a derecha, detrás n…n/2+1 de izquierda a
 * derecha. `userData.pata(k)` da el punto de la pata k (1…pines) en la cara de
 * la placa. El origen es el centro del cuerpo.
 */
export function dipRotulado(mat, opts = {}) {
  const { pines = 8, rotulo = 'DRIVER', rotulo2 = 'CEN LABS', alto = 0.13, patas = 0.12 } = opts;
  const p = _PASO, n = pines / 2;
  const g = dip(mat, { pines, paso: p, ancho: 0.24, alto, patas, cuerpo: 0x181b1f });
  const L = g.userData.largo;
  const tx = _etiqueta(512, 192, (c, w, h) => {
    c.fillStyle = '#cfd5db'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 76px sans-serif'; c.fillText(rotulo, w / 2, h * 0.36);
    c.font = '40px sans-serif'; c.fillStyle = '#98a2ab'; c.fillText(rotulo2, w / 2, h * 0.74);
  });
  const t = _tinta(tx, L * 0.64, L * 0.64 * 192 / 512);
  t.rotation.x = -Math.PI / 2; t.position.set(L * 0.04, alto + 0.007, 0); g.add(t);
  const pata = (k) => {
    const delante = k <= n, i = delante ? k - 1 : pines - k;
    return _V(-((n - 1) / 2) * p + i * p, 0, delante ? 0.15 : -0.15);
  };
  g.userData.pata = pata; g.userData.n = n;
  return g;
}

/**
 * RESISTENCIA DE CEMENTO (de potencia): bloque cerámico blanco con el valor
 * IMPRESO y las dos patas gruesas. Es la que va donde un 1/4 W se quemaría: de
 * carga, de sensado de corriente, de descarga. Se distingue de la de capa
 * porque no tiene bandas de color —el valor va escrito— y porque es del tamaño
 * de un dedo meñique. `ponValor(ohm)` repinta el texto sin rehacer la pieza.
 */
export function resistenciaCemento(mat, opts = {}) {
  const { largo = 0.46, alto = 0.22, ancho = 0.22, paso = 0.6, rotulo = '10 Ω',
          cuerpo = 0xb9ae93, patas = 0.08 } = opts;
  const g = new THREE.Group();
  const bis = 0.025, yb = alto / 2 + 0.05;
  const met = _metal15(mat);
  const mC = new THREE.MeshStandardMaterial({ color: cuerpo, roughness: 0.72, metalness: 0.02 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-largo / 2 + bis, -alto / 2 + bis], [largo / 2 - bis, -alto / 2 + bis],
     [largo / 2 - bis, alto / 2 - bis], [-largo / 2 + bis, alto / 2 - bis]], 0.03, 3),
    { espesor: ancho, bisel: bis }), mC);
  cue.position.y = yb; cue.castShadow = true; g.add(cue);
  const pinta = (txt) => (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#2b2a28'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 130px sans-serif'; c.fillText(txt, w / 2, h * 0.50);
  };
  const tx = _etiqueta(512, 256, pinta(rotulo));
  const t = _tinta(tx, largo * 0.70, largo * 0.70 * 0.5);
  t.position.set(0, yb, ancho / 2 + 0.0015); g.add(t);
  const P = paso / 2;
  for (const sx of [-1, 1]) {
    g.add(_hilo([_V(sx * largo * 0.49, yb, 0), _V(sx * (P - 0.05), yb, 0),
      _V(sx * P, yb - 0.08, 0), _V(sx * P, -patas, 0)], 0.019, met));
  }
  g.userData = { largo, alto, ancho, paso, cuerpo: cue, rotulo: t,
    ponTexto: (txt) => { pinta(txt)(tx.image.getContext('2d'), tx.image.width, tx.image.height); tx.needsUpdate = true; },
    puntas: [_V(-P, 0, 0), _V(P, 0, 0)] };
  return g;
}

/**
 * TRANSISTOR DE LATA METÁLICA (TO-18), el del 2N2222A original: una cápsula de
 * metal con su BRIDA en la base, la UÑETA que marca el lado del emisor y el
 * tipo grabado en la tapa. Es la prueba de que no todo transistor pequeño es un
 * TO-92: la lata blinda, disipa mejor y se reconoce de lejos. Las tres patas
 * van en línea, y el origen es la pata central. La uñeta queda en −X, del
 * lado del emisor.
 */
export function to18Metal(mat, opts = {}) {
  const { d = 0.21, alto = 0.19, patas = 0.14, paso = _PASO, rotulo = '2N2222A',
          levanta = 0.08, lata = 0x9aa2aa } = opts;
  const g = new THREE.Group();
  const R = d / 2, Rb = R * 1.14;
  const mL = new THREE.MeshStandardMaterial({ color: lata, roughness: 0.30, metalness: 0.92 });
  const cuerpo = new THREE.Mesh(revolucion([
    [0, 0], [Rb, 0], [Rb, 0.016], [R, 0.016], [R, alto - R * 0.16], [R * 0.93, alto - R * 0.05],
    [R * 0.80, alto], [0, alto]], { seg: 28 }), mL);
  cuerpo.position.y = levanta; cuerpo.castShadow = true; g.add(cuerpo);
  const una = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.012, 0.045), mL);
  una.position.set(-Rb - 0.02, levanta + 0.008, 0); g.add(una);
  const tx = _etiqueta(256, 128, (c, w, h) => {
    c.clearRect(0, 0, w, h);
    c.fillStyle = '#23272b'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 54px sans-serif'; c.fillText(rotulo, w / 2, h / 2);
  });
  const t = _tinta(tx, R * 1.4, R * 0.7);
  t.rotation.x = -Math.PI / 2; t.position.set(0, levanta + alto + 0.0015, 0.0); g.add(t);
  const met = _metal15(mat), pts = [];
  for (let i = -1; i <= 1; i++) {
    const l = new THREE.Mesh(new THREE.CylinderGeometry(0.0105, 0.0105, patas + levanta + 0.02, 8), met);
    l.position.set(i * paso, (levanta + 0.02 - patas) / 2, 0); g.add(l);
    pts.push(_V(i * paso, 0, 0));
  }
  g.userData = { d, alto, cuerpo, patas: pts, pines: ['E', 'B', 'C'], alturaTotal: levanta + alto };
  return g;
}

/* ==========================================================================
   §16 · INSTRUMENTACIÓN DE MANO, SENSORES Y MÓDULOS DE POTENCIA
   --------------------------------------------------------------------------
   Los laboratorios de medición (temperatura, corriente, señal, metrología,
   diagnóstico) dibujaban sus instrumentos como cajas con una pantalla pegada, y
   un termómetro, una pinza y una sonda de osciloscopio no se reconocen por la
   caja: se reconocen por lo que se agarra y por lo que toca el circuito. La
   pinza es una MORDAZA abierta con su gatillo; el shunt, una barra de aleación
   entre dos tacos de cobre con CUATRO terminales —dos de corriente y dos de
   tensión, que es lo que lo hace un shunt y no una resistencia—; la sonda, un
   cuerpo en la mano, un gancho de punta y un cable con su pinza de masa.
   Todas respetan el convenio de la biblioteca: el origen en el centro de la
   pieza, el frente hacia +Z y las medidas en las unidades del laboratorio.
   ========================================================================== */

/**
 * PORTACELDAS de un módulo de baterías cilíndricas: la plancha de plástico con
 * un taladro por celda que mantiene las celdas a su paso y las aísla entre sí.
 * Sin ella, doce celdas sueltas son doce pilas en una caja; con ella son un
 * módulo. Va tumbada (normal +Y) y centrada. `userData.hueco(c, f)` da el
 * centro del taladro de la columna c y la fila f.
 */
export function portaCeldas(mat, opts = {}) {
  const { cols = 3, filas = 4, pasoX = 0.15, pasoZ = 0.20, rHueco = 0.064,
          marco = 0.05, espesor = 0.03, color = 0x39424a } = opts;
  const g = new THREE.Group();
  const W = (cols - 1) * pasoX + 2 * (rHueco + marco);
  const L = (filas - 1) * pasoZ + 2 * (rHueco + marco);
  const hue = [], pos = [];
  for (let f = 0; f < filas; f++) for (let c = 0; c < cols; c++) {
    const x = (c - (cols - 1) / 2) * pasoX, z = (f - (filas - 1) / 2) * pasoZ;
    // el contorno se dibuja en (x, −z): la rotación de −π/2 sobre X lo devuelve a (x, z)
    hue.push(circulo(x, -z, rHueco, 18)); pos.push(_V(x, 0, z));
  }
  const m = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-W / 2, -L / 2], [W / 2, -L / 2], [W / 2, L / 2], [-W / 2, L / 2]], marco * 0.7, 3),
    { huecos: hue, espesor, bisel: espesor * 0.15 }), 2),
    new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 }));
  m.rotation.x = -Math.PI / 2; m.castShadow = m.receiveShadow = true; g.add(m);
  g.userData = { ancho: W, largo: L, hueco: (c, f) => pos[f * cols + c].clone() };
  return g;
}

/**
 * TERMÓMETRO DE MANO para termopar o RTD (el clásico de taller, tipo Fluke 51):
 * cuerpo del color de la casa con su BUMPER DE GOMA arriba y abajo, visor
 * rebajado en su marco —con el ancla `pantalla` para pintar el lienzo del
 * laboratorio—, dos filas de teclas (HOLD, MAX/MIN, °C/°F, REL) y el botón
 * redondo de encendido. El zócalo va en el CANTO SUPERIOR, que es por donde
 * entra la sonda: un instrumento con la toma al frente o en el costado no se
 * parece a nada que haya en un taller.
 *
 * Frente a +Z, origen en el centro. `userData.pantalla` es el ancla del visor
 * (su plano mira a +Z) y `userData.visor` su tamaño; `userData.zocalo` es el
 * punto del canto superior donde enchufa el conector, con la normal en +Y.
 */
export function termometroManual(mat, opts = {}) {
  const { ancho = 0.62, alto = 1.0, fondo = 0.20, color = 0xe8a21a } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, D = fondo;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.12 });
  const matG = new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.90, metalness: 0.02 });
  const matT = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.78, metalness: 0.05 });
  const matB = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.55, metalness: 0.02 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]], W * 0.12, 4),
    { espesor: D, bisel: D * 0.12 }), matC);
  cue.castShadow = true; g.add(cue);
  // el bumper: dos tapones de goma que abrazan las esquinas
  for (const sy of [-1, 1]) {
    const b = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W / 2 - W * 0.012, -H * 0.075], [W / 2 + W * 0.012, -H * 0.075],
       [W / 2 + W * 0.012, H * 0.075], [-W / 2 - W * 0.012, H * 0.075]], W * 0.10, 4),
      { espesor: D * 1.10, bisel: D * 0.12 }), matG);
    b.position.y = sy * (H / 2 - H * 0.075); b.castShadow = true; g.add(b);
  }
  // el visor: marco con hueco y un fondo oscuro detrás del lienzo
  const vw = W * 0.80, vh = vw * 0.50, vy = H * 0.16, e = W * 0.04;
  const mar = new THREE.Mesh(extruido(contornoRedondeado(
    [[-vw / 2 - e, -vh / 2 - e], [vw / 2 + e, -vh / 2 - e], [vw / 2 + e, vh / 2 + e], [-vw / 2 - e, vh / 2 + e]], e * 0.6, 3),
    { huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]],
      espesor: D * 0.16, bisel: D * 0.025 }), matT);
  mar.position.set(0, vy, D / 2 - D * 0.02); g.add(mar);
  const fon = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh),
    new THREE.MeshStandardMaterial({ color: 0x070d0b, roughness: 0.4, metalness: 0.05 }));
  fon.position.set(0, vy, D / 2 + D * 0.012); g.add(fon);
  const pan = new THREE.Group(); pan.position.set(0, vy, D / 2 + D * 0.018); g.add(pan);
  // teclas: fila de cuatro de función y el botón de encendido
  const tecla = (x, y, w, h, m) => {
    const t = new THREE.Mesh(extruido(contornoRedondeado(
      [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], Math.min(w, h) * 0.30, 3),
      { espesor: D * 0.15, bisel: D * 0.03 }), m || matT);
    t.position.set(x, y, D / 2 - D * 0.01); g.add(t); return t;
  };
  for (let i = 0; i < 4; i++) tecla((i - 1.5) * W * 0.21, -H * 0.10, W * 0.17, H * 0.055);
  for (let i = 0; i < 2; i++) tecla((i - 0.5) * W * 0.30, -H * 0.20, W * 0.24, H * 0.05);
  const on = new THREE.Mesh(revolucion([[0, 0], [W * 0.12, 0], [W * 0.12, D * 0.12], [W * 0.10, D * 0.14], [0, D * 0.14]], { seg: 22 }), matT);
  on.rotation.x = Math.PI / 2; on.position.set(0, -H * 0.31, D / 2 - D * 0.01); g.add(on);
  // la ranura del zócalo, en el canto superior
  const ra = new THREE.Mesh(new THREE.BoxGeometry(W * 0.40, D * 0.30, D * 0.62), matG);
  ra.position.set(0, H / 2 + 0.0005, 0); g.add(ra);
  g.userData = { ancho: W, alto: H, fondo: D, pantalla: pan, visor: { ancho: vw, alto: vh },
                 zocalo: _V(0, H / 2 + D * 0.15, 0) };
  return g;
}

/**
 * SONDA DE TERMOPAR CON VAINA, de las que se meten en un agujero de la pieza:
 * un tubo de acero inoxidable fino con la punta redondeada —dentro va la unión
 * de las dos aleaciones, ya soldada y aislada—, un RACOR HEXAGONAL que es por
 * donde se aprieta, el MANGO de plástico del color de la norma (verde, tipo K,
 * IEC 60584-3) con su alivio de tensión de muelle, y de ahí el cable. Va en +Y
 * con la punta en el origen; `userData.salida` es donde nace el cable.
 */
export function termoparVaina(mat, opts = {}) {
  const { largo = 0.55, d = 0.035, color = 0x2e8b57, mango = 0.20, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = _metal15(mat);
  const mP = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.04 });
  const va = new THREE.Mesh(revolucion(
    [[0, 0], [R * 0.55, R * 0.12], [R * 0.90, R * 0.45], [R, R], [R, largo], [0, largo]], { seg }), met);
  va.castShadow = true; g.add(va);
  const hx = new THREE.Mesh(new THREE.CylinderGeometry(R * 2.1, R * 2.1, d * 1.2, 6), met);
  hx.position.y = largo + d * 0.6; hx.castShadow = true; g.add(hx);
  const y0 = largo + d * 1.2;
  const ma = new THREE.Mesh(revolucion([
    [0, 0], [R * 2.0, 0], [R * 2.2, R * 0.6], [R * 2.4, mango * 0.55], [R * 2.1, mango * 0.90],
    [R * 1.3, mango], [0, mango]], { seg }), mP);
  ma.position.y = y0; ma.castShadow = true; g.add(ma);
  // el muelle antitirones y el cable que sale por él
  const N = 6, SEG = 12, pts = [], ym = y0 + mango, hm = d * 1.6;
  for (let i = 0; i <= N * SEG; i++) {
    const t = i / (N * SEG), a = t * Math.PI * 2 * N, r = R * 1.0 * (1 - t * 0.25);
    pts.push(_V(Math.cos(a) * r, ym + t * hm, Math.sin(a) * r));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), N * SEG, R * 0.16, 6, false), met));
  g.userData = { largo, d, alto: ym + hm, punta: _V(0, 0, 0), salida: _V(0, ym + hm, 0) };
  return g;
}

/**
 * PINZA AMPERIMÉTRICA. Lo que la hace una pinza es la MORDAZA: dos mitades de
 * núcleo que se abren por una bisagra y se cierran alrededor del conductor sin
 * tocarlo, y por eso la pinza no altera el circuito que mide. Debajo, el cuerpo
 * con su visor, su teclado y el SELECTOR GIRATORIO, y en el costado la PALANCA
 * (el gatillo) que abre la mordaza.
 *
 * Posición «de fábrica»: mordaza ARRIBA y cuerpo abajo, frente a +Z; el hueco
 * de la mordaza tiene su eje en Z —el cable atraviesa el aro en la dirección en
 * que mira el visor, que es como se ve en cualquier pinza—. El origen es el
 * CENTRO DEL ARO. `userData.anillo` agrupa las dos mitades (el laboratorio lo
 * escala para abrazar uno o dos conductores), `userData.pantalla` es el ancla
 * del visor y `userData.cuerpo` el cuerpo.
 */
export function pinzaAmperimetrica(mat, opts = {}) {
  const { ri = 0.105, ro = 0.158, grosor = 0.085, ancho = 0.42, alto = 0.66, fondo = 0.17,
          color = 0xe08a1a, visor = 0.78 } = opts;
  const g = new THREE.Group();
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.12 });
  const matG = new THREE.MeshStandardMaterial({ color: 0x15191d, roughness: 0.90, metalness: 0.02 });
  const matT = new THREE.MeshStandardMaterial({ color: 0x2b3138, roughness: 0.78, metalness: 0.05 });
  const matJ = new THREE.MeshStandardMaterial({ color: 0xbfc4ca, roughness: 0.34, metalness: 0.80 });
  const matI = new THREE.MeshStandardMaterial({ color: 0xe9edf0, roughness: 0.55, metalness: 0.02 });
  const PI = Math.PI;
  // las dos mitades de la mordaza: la fija abraza por abajo, la móvil cierra por arriba
  const anillo = new THREE.Group(); g.add(anillo);
  const media = (a0, a1) => {
    const c = [...arco(0, 0, ro, a0, a1, 24), ...arco(0, 0, ri, a1, a0, 24)];
    const m = new THREE.Mesh(extruido(c, { espesor: grosor, bisel: grosor * 0.07 }), matJ);
    m.castShadow = true; return m;
  };
  const fija = media(0.78 * PI, 2.22 * PI);          // izquierda, fondo y derecha
  const movil = media(0.22 * PI, 0.78 * PI);         // la tapa superior, que se abre
  anillo.add(fija, movil);
  // las caras de contacto: el entrehierro de un núcleo magnético está a la vista
  for (const a of [0.22 * PI, 0.78 * PI]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(ro - ri + 0.006, 0.010, grosor * 1.02), matT);
    t.position.set(Math.cos(a) * (ro + ri) / 2, Math.sin(a) * (ro + ri) / 2, 0); t.rotation.z = a; anillo.add(t);
  }
  const piv = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, grosor * 1.2, 12), matT);
  piv.rotation.x = PI / 2; piv.position.set(Math.cos(0.78 * PI) * (ro + ri) / 2, Math.sin(0.78 * PI) * (ro + ri) / 2, 0); anillo.add(piv);
  // el cuerpo: cabeza que arranca bajo el aro y mango de goma
  const y0 = -ro * 0.55, W = ancho, H = alto;
  const cu = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, y0 - H], [W / 2, y0 - H], [W / 2, y0], [-W / 2, y0]], W * 0.16, 4),
    { espesor: fondo, bisel: fondo * 0.12 }), matC);
  cu.castShadow = true; g.add(cu);
  const mango = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2 - 0.004, y0 - H - 0.002], [W / 2 + 0.004, y0 - H - 0.002], [W / 2 + 0.004, y0 - H * 0.74], [-W / 2 - 0.004, y0 - H * 0.74]],
    W * 0.14, 4), { espesor: fondo * 1.08, bisel: fondo * 0.12 }), matG);
  mango.castShadow = true; g.add(mango);
  // visor rebajado, ancla del lienzo del laboratorio
  const vw = W * visor, vh = vw * 1.14, vy = y0 - H * 0.30, e = W * 0.035;
  const mar = new THREE.Mesh(extruido(contornoRedondeado(
    [[-vw / 2 - e, -vh / 2 - e], [vw / 2 + e, -vh / 2 - e], [vw / 2 + e, vh / 2 + e], [-vw / 2 - e, vh / 2 + e]], e * 0.7, 3),
    { huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]],
      espesor: fondo * 0.14, bisel: fondo * 0.02 }), matT);
  mar.position.set(0, vy, fondo / 2 - fondo * 0.02); g.add(mar);
  const fon = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh),
    new THREE.MeshStandardMaterial({ color: 0x06120f, roughness: 0.4, metalness: 0.05 }));
  fon.position.set(0, vy, fondo / 2 + fondo * 0.01); g.add(fon);
  const pan = new THREE.Group(); pan.position.set(0, vy, fondo / 2 + fondo * 0.016); g.add(pan);
  // selector giratorio con su índice, y dos teclas de función
  const dy = y0 - H * 0.69;
  const dial = new THREE.Mesh(revolucion([[0, 0], [W * 0.26, 0], [W * 0.26, fondo * 0.20], [W * 0.22, fondo * 0.26], [0, fondo * 0.26]], { seg: 28 }), matG);
  dial.rotation.x = PI / 2; dial.position.set(0, dy, fondo / 2 - fondo * 0.02); g.add(dial);
  const ix = new THREE.Mesh(new THREE.BoxGeometry(W * 0.045, W * 0.18, fondo * 0.04), matI);
  ix.position.set(0, dy + W * 0.10, fondo / 2 + fondo * 0.25); g.add(ix);
  for (const sx of [-1, 1]) {
    const k = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W * 0.10, -H * 0.022], [W * 0.10, -H * 0.022], [W * 0.10, H * 0.022], [-W * 0.10, H * 0.022]], W * 0.03, 3),
      { espesor: fondo * 0.14, bisel: fondo * 0.03 }), matT);
    k.position.set(sx * W * 0.24, y0 - H * 0.53, fondo / 2 - fondo * 0.01); g.add(k);
  }
  // la palanca del costado: el pulgar la aprieta y la mordaza se abre
  const gat = new THREE.Mesh(extruido(contornoRedondeado(
    [[0, 0], [W * 0.17, 0.02], [W * 0.17, H * 0.22], [0, H * 0.24]], W * 0.03, 3),
    { espesor: fondo * 0.66, bisel: fondo * 0.04 }), matG);
  gat.position.set(-W / 2 - W * 0.14, y0 - H * 0.46, 0); gat.castShadow = true; g.add(gat);
  g.userData = { ancho: W, alto: H, fondo, anillo, fija, movil, cuerpo: cu, gatillo: gat,
                 pantalla: pan, visor: { ancho: vw, alto: vh }, ri, ro };
  return g;
}

/**
 * SHUNT DE CUATRO TERMINALES. Dos tacos de COBRE macizo por donde entra y sale
 * TODA la corriente —cada uno con su perno grande— unidos por varias láminas de
 * MANGANINA, la aleación cuya resistencia casi no depende de la temperatura. Y
 * ahí está lo que lo hace un shunt y no una resistencia: además de los dos
 * pernos de potencia lleva DOS TORNILLOS FINOS de medida, uno por taco, desde
 * los que se lee la caída de tensión sin que por ellos pase corriente (conexión
 * Kelvin). El shunt se usa porque convierte amperios en milivoltios; sin esos
 * dos terminales la lectura incluiría la caída de los propios contactos.
 *
 * Eje en X, la placa de características mira a +Z, el origen está en el centro
 * de la cara inferior de la base. `userData.bornas` da los cuatro puntos
 * {i1, i2, v1, v2}.
 */
export function shuntKelvin(mat, opts = {}) {
  const { largo = 0.78, ancho = 0.22, alto = 0.12, bloque = 0.18, laminas = 4, rotulo = '75 mV' } = opts;
  const g = new THREE.Group();
  const cob = new THREE.MeshStandardMaterial({ color: 0xc27a3e, roughness: 0.34, metalness: 0.92 });
  const man = new THREE.MeshStandardMaterial({ color: 0xa79a80, roughness: 0.36, metalness: 0.85 });
  const bas = new THREE.MeshStandardMaterial({ color: 0xb6ad99, roughness: 0.66, metalness: 0.04 });
  const met = _metal15(mat);
  const hb = 0.03;
  const base = new THREE.Mesh(extruido(contornoRedondeado(
    [[-largo / 2 - 0.02, -ancho / 2 - 0.02], [largo / 2 + 0.02, -ancho / 2 - 0.02],
     [largo / 2 + 0.02, ancho / 2 + 0.02], [-largo / 2 - 0.02, ancho / 2 + 0.02]], 0.02, 3),
    { espesor: hb, bisel: 0.004 }), bas);
  base.rotation.x = -Math.PI / 2; base.position.y = hb / 2; base.castShadow = base.receiveShadow = true; g.add(base);
  const bornas = {};
  for (const s of [-1, 1]) {
    const x = s * (largo / 2 - bloque / 2);
    const b = new THREE.Mesh(extruido(contornoRedondeado(
      [[-bloque / 2, -ancho / 2], [bloque / 2, -ancho / 2], [bloque / 2, ancho / 2], [-bloque / 2, ancho / 2]], 0.012, 3),
      { espesor: alto, bisel: 0.008 }), cob);
    b.rotation.x = -Math.PI / 2; b.position.set(x, hb + alto / 2, 0); b.castShadow = true; g.add(b);
    // el perno de potencia: cabeza hexagonal con su arandela
    const perno = tornilloHex({ acero: met }, { d: 0.050, largo: 0.04 });
    perno.position.set(x, hb + alto, 0); g.add(perno);
    // el tornillo fino de medida, con su terminal de ojal
    const tf = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, 0.026, 12), met);
    tf.position.set(x, hb + alto + 0.013, ancho * 0.31); g.add(tf);
    const oj = new THREE.Mesh(new THREE.TorusGeometry(0.019, 0.005, 6, 16), met);
    oj.rotation.x = Math.PI / 2; oj.position.copy(tf.position).setY(hb + alto + 0.006); g.add(oj);
    bornas[s < 0 ? 'i1' : 'i2'] = _V(x, hb + alto + 0.045, 0);
    bornas[s < 0 ? 'v1' : 'v2'] = _V(tf.position.x, hb + alto + 0.026, tf.position.z);
  }
  // las láminas de manganina, que son la resistencia patrón
  const lx = largo - 2 * bloque + 0.02;
  for (let i = 0; i < laminas; i++) {
    const z = (i - (laminas - 1) / 2) * (ancho * 0.78 / Math.max(1, laminas - 1));
    const l = new THREE.Mesh(new THREE.BoxGeometry(lx, 0.016, ancho * 0.14), man);
    l.position.set(0, hb + alto * 0.62, z); l.castShadow = true; g.add(l);
  }
  // placa de características
  const tx = _etiqueta(256, 96, (c, w, h) => {
    c.fillStyle = '#d7dee6'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#1b1f23'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 44px sans-serif'; c.fillText(rotulo, w / 2, h * 0.40);
    c.font = '22px sans-serif'; c.fillText('SHUNT · 4 TERMINALES', w / 2, h * 0.80);
  });
  const pl = new THREE.Mesh(new THREE.PlaneGeometry(0.24, 0.09), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.5, metalness: 0.2 }));
  pl.position.set(0, hb + 0.045, ancho / 2 + 0.022); g.add(pl);
  g.userData = { largo, ancho, alto: hb + alto, bornas, base };
  return g;
}

/**
 * OSCILOSCOPIO DE BANCO. Lo que lo hace un osciloscopio y no una caja con una
 * pantalla es el reparto del frente: la PANTALLA grande a un lado, en su marco
 * rebajado y cuadriculada; al otro, las PERILLAS agrupadas por función —cada una
 * con su rótulo, porque «volts por división» y «tiempo por división» no se
 * distinguen más que por lo que dice debajo—; abajo, la fila de teclas de menú y
 * los conectores BNC por donde entra la señal, con el anillo del color de su
 * canal; y fuera, el ASA de transporte, las patas de goma y el patín inclinable.
 *
 * El frente mira a +Z y el origen está en el centro del cuerpo. Los mandos se
 * piden con su posición en el frente (x, y), así cada laboratorio reparte los
 * suyos como el instrumento que quiere dibujar:
 *   mandos:   [{ id, x, y, r, rotulo }]      → userData.mandos[id] = { grupo, grip }
 *   botones:  [{ id, x, y, ancho, alto, luz }] → userData.botones[id] (mesh; con
 *             `luz` lleva material emisivo propio para encenderlo)
 *   bnc:      [{ x, color, id }]              → userData.bnc[i]
 *   terminales:[{ x, color, id }]             → userData.terminales[i]
 *   led:      { x, y }                        → userData.led (mesh emisivo)
 * `userData.pantalla` es el ancla del visor (plano a +Z), `userData.visor` su
 * tamaño, `userData.apoyo` la altura a la que poner el origen para que las
 * patas toquen la mesa y `userData.frente` la z del plano de los mandos.
 */
export function osciloscopioBanco(mat, opts = {}) {
  const { ancho = 1.9, alto = 1.20, fondo = 0.80, color = 0x232a38,
          mandos = [], botones = [], bnc: bncs = [], terminales = [], led = null,
          pantallaX = -0.40, pantallaY = 0.20, visor = [0.90, 0.72], teclas = true } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, D = fondo, F = D / 2;
  const matC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.28 });
  const matP = new THREE.MeshStandardMaterial({ color: 0x323c4d, roughness: 0.60, metalness: 0.22 });
  const matN = new THREE.MeshStandardMaterial({ color: 0x0e1117, roughness: 0.85, metalness: 0.05 });
  const matK = new THREE.MeshStandardMaterial({ color: 0x1a1f27, roughness: 0.75, metalness: 0.10 });
  const matT = new THREE.MeshStandardMaterial({ color: 0xe8edf2, roughness: 0.5, metalness: 0.05 });
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, -H / 2], [W / 2, -H / 2], [W / 2, H / 2], [-W / 2, H / 2]], 0.09, 4),
    { espesor: D, bisel: D * 0.05 }), matC);
  cue.castShadow = cue.receiveShadow = true; g.add(cue);
  // el panel frontal, un punto más claro: es lo que separa el frente del chasis
  const fr = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2 + 0.05, -H / 2 + 0.05], [W / 2 - 0.05, -H / 2 + 0.05], [W / 2 - 0.05, H / 2 - 0.05], [-W / 2 + 0.05, H / 2 - 0.05]], 0.06, 4),
    { espesor: 0.03, bisel: 0.006 }), matP);
  fr.position.z = F + 0.004; g.add(fr);
  const ZF = F + 0.019;                               // la cara del panel frontal
  // la pantalla: marco rebajado con hueco, fondo negro y ancla del lienzo
  const [vw, vh] = visor, e = 0.045;
  const mar = new THREE.Mesh(extruido(contornoRedondeado(
    [[-vw / 2 - e, -vh / 2 - e], [vw / 2 + e, -vh / 2 - e], [vw / 2 + e, vh / 2 + e], [-vw / 2 - e, vh / 2 + e]], 0.03, 3),
    { huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]],
      espesor: 0.04, bisel: 0.008 }), matN);
  mar.position.set(pantallaX, pantallaY, ZF + 0.004); g.add(mar);
  const fon = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), new THREE.MeshStandardMaterial({ color: 0x03080a, roughness: 0.4 }));
  fon.position.set(pantallaX, pantallaY, ZF + 0.006); g.add(fon);
  const pan = new THREE.Group(); pan.position.set(pantallaX, pantallaY, ZF + 0.012); g.add(pan);
  // rótulos serigrafiados: un plano de tinta por texto
  const rot = (txt, x, y, ancho = 0.30, tam = 34) => {
    const tx = _etiqueta(256, 48, (c, w, h) => {
      c.clearRect(0, 0, w, h); c.fillStyle = '#e8edf2'; c.textAlign = 'center'; c.textBaseline = 'middle';
      c.font = 'bold ' + tam + 'px sans-serif'; c.fillText(txt, w / 2, h / 2);
    });
    const t = _tinta(tx, ancho, ancho * 48 / 256); t.position.set(x, y, ZF + 0.002); g.add(t); return t;
  };
  // las perillas: base de goma con falda, cuerpo con su chaflán y la raya de índice
  const mapa = {};
  for (const m of mandos) {
    const r = m.r || 0.075;
    const k = new THREE.Group(); k.position.set(m.x, m.y, ZF); k.rotation.x = Math.PI / 2; g.add(k);
    const falda = new THREE.Mesh(revolucion([[0, 0], [r * 1.20, 0], [r * 1.20, 0.012], [r * 1.05, 0.020], [0, 0.020]], { seg: 28 }), matN);
    k.add(falda);
    const grip = new THREE.Mesh(revolucion([[0, 0], [r, 0], [r, r * 0.55], [r * 0.86, r * 0.72], [0, r * 0.72]], { seg: 28 }), matK);
    grip.position.y = 0.020; grip.castShadow = true; k.add(grip);
    const tick = new THREE.Mesh(new THREE.BoxGeometry(r * 0.10, r * 0.05, r * 0.52), matT);
    tick.position.set(0, r * 0.72, r * 0.44); grip.add(tick);
    mapa[m.id] = { grupo: k, grip };
    if (m.rotulo) rot(m.rotulo, m.x, m.y - r * 1.55, 0.30, 30);
  }
  // las teclas de menú, bajo la pantalla, y las del frente que pida el laboratorio
  const tecla = (x, y, w, h, mm) => {
    const t = new THREE.Mesh(extruido(contornoRedondeado(
      [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], Math.min(w, h) * 0.25, 3),
      { espesor: 0.026, bisel: 0.006 }), mm || matK);
    t.position.set(x, y, ZF + 0.006); t.castShadow = true; g.add(t); return t;
  };
  if (teclas) for (let i = 0; i < 5; i++) tecla(pantallaX - vw / 2 + 0.09 + i * (vw - 0.18) / 4, pantallaY - vh / 2 - 0.115, 0.12, 0.05);
  const botonesM = {};
  for (const b of botones) {
    const mm = b.luz ? new THREE.MeshStandardMaterial({ color: 0x0a1210, emissive: 0x3ad9c2, emissiveIntensity: 0.05, roughness: 0.35, metalness: 0.1 }) : matK;
    botonesM[b.id] = tecla(b.x, b.y, b.ancho || 0.10, b.alto || 0.06, mm);
  }
  // los conectores de entrada
  const lisBnc = [], lisTer = [];
  for (const c of bncs) {
    const b = bnc(mat, { d: 0.11, largo: 0.10, color: c.color }); b.position.set(c.x, -H * 0.37, ZF); g.add(b); lisBnc.push(b);
  }
  for (const c of terminales) {
    const t = new THREE.Mesh(revolucion([[0, 0], [0.032, 0], [0.032, 0.03], [0.020, 0.045], [0, 0.045]], { seg: 14 }),
      new THREE.MeshStandardMaterial({ color: c.color || 0xc77dff, roughness: 0.4, metalness: 0.75 }));
    t.rotation.x = Math.PI / 2; t.position.set(c.x, -H * 0.37, ZF); g.add(t); lisTer.push(t);
  }
  // el piloto de disparo
  let ledM = null;
  if (led) {
    ledM = new THREE.Mesh(new THREE.SphereGeometry(0.030, 12, 12), new THREE.MeshStandardMaterial(
      { color: 0x0a1210, emissive: 0x3ad9c2, emissiveIntensity: 0.05, roughness: 0.35, metalness: 0.1 }));
    ledM.position.set(led.x, led.y, ZF + 0.004); g.add(ledM);
  }
  // el asa de transporte, las patas, el patín y la rejilla de ventilación
  const asa = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    _V(-W * 0.40, H / 2 - 0.02, 0), _V(-W * 0.40, H / 2 + 0.17, 0), _V(0, H / 2 + 0.22, 0),
    _V(W * 0.40, H / 2 + 0.17, 0), _V(W * 0.40, H / 2 - 0.02, 0)], false), 28, 0.030, 8, false), matK);
  asa.castShadow = true; g.add(asa);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.062, 0.05, 12), matK);
    p.position.set(sx * W * 0.42, -H / 2 - 0.025, sz * D * 0.36); g.add(p);
  }
  for (const sx of [-1, 1]) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(0.12, 0.05, 0.05), matK);
    pa.position.set(sx * W * 0.36, -H / 2 + 0.01, F + 0.04); g.add(pa);
  }
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(1.10, 0.014, 0.035), matN);
    r.position.set(0, H / 2 + 0.003, -D * 0.38 + i * 0.07); g.add(r);
  }
  g.userData = { ancho: W, alto: H, fondo: D, pantalla: pan, visor: { ancho: vw, alto: vh },
                 mandos: mapa, botones: botonesM, bnc: lisBnc, terminales: lisTer, led: ledM,
                 apoyo: H / 2 + 0.05, frente: ZF, rotulo: rot };
  return g;
}

/**
 * CABEZA DE SONDA DE OSCILOSCOPIO (pasiva 1X/10X): el cuerpo que se agarra, el
 * DESLIZADOR de atenuación —1X o 10X—, la PUNTA de acero, el GANCHO de punta
 * retráctil y, saliendo de la empuñadura, el cable de masa con su pinza de
 * cocodrilo. Lo que se sostiene es la cabeza; el cable largo, el BNC y la caja de
 * compensación están en el otro extremo, junto al osciloscopio.
 *
 * Eje en X: la punta apunta a +X y el cable sale por −X. `userData.deslizador`
 * se mueve en X entre `userData.posSelector['1x' | '10x']`; `punta` es el punto
 * de la punta, `salida` donde nace el cable y `pinza` la pinza de masa.
 */
export function sondaOsciloscopio(mat, opts = {}) {
  const { largo = 0.78, d = 0.085, color = 0x1a1d24 } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.06 });
  const mG = new THREE.MeshStandardMaterial({ color: 0x2a2f38, roughness: 0.85, metalness: 0.04 });
  const R = d / 2;
  // la empuñadura: perfil de torno, más gruesa por detrás y estrechándose a la punta
  const per = [[0, 0], [R * 0.60, 0], [R * 0.80, largo * 0.06], [R * 0.80, largo * 0.45], [R * 0.55, largo * 0.80], [R * 0.34, largo * 0.88], [0, largo * 0.88]];
  const cu = new THREE.Mesh(revolucion(per, { seg: 22 }), mC);
  cu.rotation.z = -Math.PI / 2; cu.position.x = -largo * 0.55; cu.castShadow = true; g.add(cu);
  // los anillos de goma de la empuñadura
  for (let i = 0; i < 4; i++) {
    const a = new THREE.Mesh(new THREE.TorusGeometry(R * 0.82, 0.007, 6, 18), mG);
    a.rotation.y = Math.PI / 2; a.position.x = -largo * 0.55 + largo * (0.12 + i * 0.045); g.add(a);
  }
  // el deslizador 1X/10X en una ranura de la cara superior
  const ranura = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.012, 0.045), mG);
  ranura.position.set(-largo * 0.28, R * 0.80, 0); g.add(ranura);
  const posSelector = { '1x': -largo * 0.28 - 0.045, '10x': -largo * 0.28 + 0.045 };
  const desliz = new THREE.Mesh(new THREE.BoxGeometry(0.05, 0.03, 0.058),
    new THREE.MeshStandardMaterial({ color: 0xffd166, roughness: 0.5, metalness: 0.3 }));
  desliz.position.set(posSelector['10x'], R * 0.82 + 0.006, 0); desliz.castShadow = true; g.add(desliz);
  // la punta y su gancho
  const pu = new THREE.Mesh(revolucion([[0, 0], [R * 0.30, 0], [R * 0.22, 0.10], [R * 0.05, 0.19], [0, 0.20]], { seg: 14 }), met);
  pu.rotation.z = -Math.PI / 2; pu.position.x = largo * 0.33; pu.castShadow = true; g.add(pu);
  const co = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.36, R * 0.36, 0.04, 14), met);
  co.rotation.z = Math.PI / 2; co.position.x = largo * 0.33 - 0.01; g.add(co);
  // el cable de masa con su pinza de cocodrilo
  const ptsM = [_V(-largo * 0.05, -R * 0.7, 0), _V(largo * 0.05, -R * 2.1, R * 0.8), _V(largo * 0.22, -R * 2.4, R * 1.8)];
  g.add(_hilo(ptsM, 0.007, mG));
  const pin = new THREE.Mesh(extruido(contornoRedondeado([[-0.04, -0.012], [0.04, -0.012], [0.03, 0.022], [-0.03, 0.022]], 0.006, 2),
    { espesor: 0.022, bisel: 0.004 }), new THREE.MeshStandardMaterial({ color: 0xb23a2e, roughness: 0.6, metalness: 0.1 }));
  pin.position.copy(ptsM[2]).add(_V(0.01, -0.015, 0)); g.add(pin);
  // el alivio de tensión, por donde sale el cable
  const al = new THREE.Mesh(revolucion([[0, 0], [R * 0.52, 0], [R * 0.30, 0.10], [R * 0.20, 0.17], [0, 0.17]], { seg: 14 }), mC);
  al.rotation.z = Math.PI / 2; al.position.x = -largo * 0.55; g.add(al);
  g.userData = { largo, d, deslizador: desliz, posSelector, punta: _V(largo * 0.33 + 0.20, 0, 0),
                 salida: _V(-largo * 0.55 - 0.17, 0, 0), pinza: pin, cuerpo: cu };
  return g;
}

/**
 * ENCHUFE BNC DE SONDA con su CAJA DE COMPENSACIÓN: el extremo del cable de una
 * sonda que va al osciloscopio. El enchufe se mete en el jack girando un cuarto
 * de vuelta; la caja que lo sigue aloja el trimmer —un condensador variable que
 * se ajusta con un destornillador de plástico— que iguala la sonda 10X al
 * canal. Sin compensar, un flanco rápido sale redondeado o con sobreimpulso.
 *
 * Eje en Z: el enchufe apunta a −Z (hacia el jack) y el cable sale por +Z. El
 * origen está en la cara del panel donde asienta el enchufe.
 * `userData.trimmer` gira sobre su eje (Y), `userData.caja` es la caja.
 */
export function bncCompensacion(mat, opts = {}) {
  const { color = 0x2c2440, anillo = 0xc77dff } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.12 });
  const bar = new THREE.Mesh(new THREE.CylinderGeometry(0.072, 0.072, 0.10, 20), met);
  bar.rotation.x = Math.PI / 2; bar.position.z = 0.05; bar.castShadow = true; g.add(bar);
  const gr = new THREE.Mesh(new THREE.TorusGeometry(0.075, 0.009, 6, 20), met);
  gr.position.z = 0.09; g.add(gr);
  for (const sx of [-1, 1]) {                         // las ranuras de la bayoneta
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.010, 0.012, 0.045), mC);
    r.position.set(sx * 0.073, 0, 0.045); g.add(r);
  }
  const caja = new THREE.Mesh(extruido(contornoRedondeado(
    [[-0.10, -0.07], [0.10, -0.07], [0.10, 0.07], [-0.10, 0.07]], 0.03, 4),
    { espesor: 0.20, bisel: 0.016 }), mC);
  caja.position.z = 0.10 + 0.10; caja.castShadow = true; g.add(caja);
  const an = new THREE.Mesh(new THREE.TorusGeometry(0.083, 0.008, 6, 20),
    new THREE.MeshStandardMaterial({ color: anillo, roughness: 0.5, metalness: 0.4 }));
  an.position.z = 0.115; g.add(an);
  // el trimmer, con su ranura, en una ventana de la cara superior
  const tr = new THREE.Group(); tr.position.set(0, 0.07, 0.20); g.add(tr);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(0.024, 0.024, 0.016, 14),
    new THREE.MeshStandardMaterial({ color: 0xb8bcc4, roughness: 0.4, metalness: 0.7 }));
  cab.position.y = 0.008; tr.add(cab);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(0.040, 0.008, 0.007), mC);
  ra.position.y = 0.017; tr.add(ra);
  const al = new THREE.Mesh(revolucion([[0, 0], [0.040, 0], [0.026, 0.07], [0.018, 0.13], [0, 0.13]], { seg: 12 }), mC);
  al.rotation.x = Math.PI / 2; al.position.z = 0.30; g.add(al);
  g.userData = { caja, trimmer: tr, salida: _V(0, 0, 0.43) };
  return g;
}

/**
 * COMPARADOR DE CARÁTULA (reloj comparador): la caja redonda con su BISEL
 * moleteado —el aro que se gira para poner el cero—, la OREJETA trasera por donde
 * lo sujeta el brazo del soporte y el casquillo del VÁSTAGO por donde sale el
 * palpador. Esta pieza es sólo la CAJA: la esfera con su aguja es lo que cada
 * laboratorio dibuja en el lienzo que cuelga de `userData.cara`, y el palpador
 * lo pone el laboratorio en `userData.casquillo`, que es por donde sale.
 *
 * El frente mira a +Z y el origen está en el centro de la esfera. La cara
 * delantera del bisel queda en `userData.frente` (z).
 */
export function comparadorCaratula(mat, opts = {}) {
  const { R = 0.26, fondo = 0.08, seg = 48 } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const mN = new THREE.MeshStandardMaterial({ color: 0x0b0f12, roughness: 0.42, metalness: 0.35 });
  const mS = new THREE.MeshStandardMaterial({ color: 0x9aa2aa, roughness: 0.38, metalness: 0.80 });
  const h = fondo / 2;
  // la caja: una lata con su tapa trasera redondeada (eje de revolución = Z)
  const caja = new THREE.Mesh(revolucion([[0, -h], [R * 0.92, -h], [R * 0.98, -h * 0.80], [R * 0.98, h * 0.55], [R * 0.90, h * 0.55], [0, h * 0.55]], { seg }), mN);
  caja.rotation.x = Math.PI / 2; caja.castShadow = true; g.add(caja);
  // el bisel: aro de acero con el canto moleteado
  const bis = new THREE.Mesh(revolucion([[R * 0.80, 0], [R * 1.04, 0], [R * 1.04, fondo * 0.62], [R * 0.80, fondo * 0.62]], { seg }), mS);
  bis.rotation.x = Math.PI / 2; bis.position.z = h * 0.30; bis.castShadow = true; g.add(bis);
  const NM = 56;
  const mol = new THREE.InstancedMesh(new THREE.BoxGeometry(0.016, 0.014, fondo * 0.58), mS, NM);
  const m4 = new THREE.Matrix4(), q = new THREE.Quaternion(), s = new THREE.Vector3(1, 1, 1), p = new THREE.Vector3();
  for (let i = 0; i < NM; i++) {
    const a = (i / NM) * Math.PI * 2;
    q.setFromAxisAngle(new THREE.Vector3(0, 0, 1), a);
    p.set(Math.cos(a) * R * 1.045, Math.sin(a) * R * 1.045, h * 0.30 + fondo * 0.31);
    m4.compose(p, q, s); mol.setMatrixAt(i, m4);
  }
  g.add(mol);
  // la orejeta trasera con su taladro: por ahí se aprieta el brazo del soporte
  const ore = new THREE.Mesh(extruido(contornoRedondeado(
    [[-0.08, 0], [0.08, 0], [0.08, R * 0.55], [-0.08, R * 0.55]], 0.03, 3),
    { huecos: [circulo(0, R * 0.30, 0.028, 14)], espesor: 0.03, bisel: 0.006 }), mS);
  ore.position.set(0, R * 0.72, -h - 0.015); g.add(ore);
  // el casquillo del vástago, abajo
  const cas = new THREE.Mesh(revolucion([[0, 0], [0.050, 0], [0.050, 0.07], [0.036, 0.09], [0, 0.09]], { seg: 20 }), mS);
  cas.rotation.x = Math.PI; cas.position.y = -R * 0.98; cas.castShadow = true; g.add(cas);
  g.userData = { R, fondo, frente: h * 0.30 + fondo * 0.62, cara: _V(0, 0, h * 0.55),
                 casquillo: _V(0, -R * 0.98 - 0.09, 0), orejeta: _V(0, R * 0.72, -h - 0.015) };
  return g;
}

/**
 * MICRÓMETRO DE EXTERIORES: el instrumento de taller por excelencia. Un ARCO en
 * «U» de acero con su aislante de plástico por donde se agarra, el YUNQUE fijo en
 * un extremo y, en el otro, el HUSILLO que se mueve girando el TAMBOR, con su
 * manguito grabado y la MATRACA que limita la presión de medida. El eje de
 * medida va en X; el arco queda bajo el eje, y el origen está en el centro del
 * hueco entre yunque y husillo, a la altura del eje.
 */
export function micrometro(mat, opts = {}) {
  const { R = 0.30, brazo = 0.20, apertura = 0.18, seg = 28 } = opts;
  const g = new THREE.Group();
  const mA = new THREE.MeshStandardMaterial({ color: 0x2a3f4e, roughness: 0.50, metalness: 0.55 });
  const mN = new THREE.MeshStandardMaterial({ color: 0x161a20, roughness: 0.80, metalness: 0.05 });
  const mS = new THREE.MeshStandardMaterial({ color: 0xcfd4d9, roughness: 0.28, metalness: 0.90 });
  const ri = R - 0.075, esp = 0.07, ye = brazo * 0.62;
  const X = (m, x) => { m.rotation.z = -Math.PI / 2; m.position.set(x, ye, 0); m.castShadow = true; g.add(m); return m; };
  // el arco: media corona inferior más los dos brazos que suben hasta el eje
  const contorno = [...arco(0, 0, R, Math.PI, 2 * Math.PI, 24), [R, brazo], [ri, brazo],
    ...arco(0, 0, ri, 2 * Math.PI, Math.PI, 24), [-ri, brazo], [-R, brazo]];
  const marco = new THREE.Mesh(extruido(contorno, { espesor: esp, bisel: esp * 0.12 }), mA);
  marco.castShadow = true; g.add(marco);
  // el aislante térmico, donde se agarra
  const ais = new THREE.Mesh(extruido([...arco(0, 0, R + 0.004, 1.12 * Math.PI, 1.62 * Math.PI, 12),
    ...arco(0, 0, ri - 0.004, 1.62 * Math.PI, 1.12 * Math.PI, 12)], { espesor: esp * 1.10, bisel: esp * 0.10 }), mN);
  ais.castShadow = true; g.add(ais);
  // el yunque, fijo al brazo izquierdo y con la cara de medida hacia el centro
  X(new THREE.Mesh(revolucion([[0, 0], [0.026, 0], [0.026, ri - apertura / 2 - 0.01], [0.022, ri - apertura / 2], [0, ri - apertura / 2]], { seg: 18 }), mS), -ri);
  // el husillo: la varilla pulida que entra por el brazo derecho
  X(new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, ri - apertura / 2 + 0.06, 14), mS), apertura / 2 + (ri - apertura / 2 + 0.06) / 2).rotation.z = Math.PI / 2;
  // el manguito grabado, el tambor moleteado y la matraca, fuera del brazo derecho
  X(new THREE.Mesh(revolucion([[0, 0], [0.040, 0], [0.040, R + 0.20 - ri], [0, R + 0.20 - ri]], { seg }), mS), ri);
  for (let i = 0; i < 12; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(0.004, 0.012 + (i % 5 === 0 ? 0.012 : 0), 0.0016), mN);
    r.position.set(R + 0.005 + i * 0.011, ye + 0.0405, 0); g.add(r);
  }
  const tam = X(new THREE.Mesh(revolucion([[0, 0], [0.058, 0], [0.058, 0.20], [0.050, 0.22], [0, 0.22]], { seg }), mS), R + 0.05);
  for (let i = 0; i < 20; i++) {                      // el moleteado del tambor
    const a = (i / 20) * Math.PI * 2;
    const mo = new THREE.Mesh(new THREE.BoxGeometry(0.17, 0.008, 0.008), mN);
    mo.position.set(R + 0.16, ye + Math.cos(a) * 0.058, Math.sin(a) * 0.058); mo.rotation.x = -a; g.add(mo);
  }
  X(new THREE.Mesh(revolucion([[0, 0], [0.045, 0], [0.045, 0.09], [0.036, 0.10], [0, 0.10]], { seg: 20 }), mN), R + 0.27);
  // la palanca de bloqueo del husillo
  const lev = new THREE.Mesh(new THREE.BoxGeometry(0.03, 0.07, 0.016), mN);
  lev.position.set(ri + 0.04, ye + 0.07, 0); g.add(lev);
  g.userData = { R, eje: ye, tambor: tam, marco, longitud: R * 2 + 0.37 };
  return g;
}

/**
 * TOMA DE DIAGNÓSTICO J1962 (el DLC, el conector OBD-II del coche). Es un
 * TRAPECIO —ancho arriba, estrecho abajo— y esa asimetría es lo que impide
 * enchufar el escáner del revés. Dentro, sobre el fondo, los 16 PINES en dos
 * filas de ocho: arriba los pines 1–8 y abajo los 9–16 —el 16, a la derecha de
 * la fila inferior, es el +12 V de batería; el 4 y el 5, masas; el 6 y el 14, el
 * CAN—. El pin 1 es el de la izquierda de la fila superior.
 *
 * Eje +Z: la boca mira a +Z y el origen está en el centro de la cara posterior.
 * `userData.boca` es el z de la boca y `userData.pin(k)` da la posición del pin k.
 */
export function tomaJ1962(mat, opts = {}) {
  const { ancho = 0.46, alto = 0.20, fondo = 0.14, color = 0x1a1f22, pared = 0.025 } = opts;
  const g = new THREE.Group();
  const met = _metal15(mat);
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.35 });
  const mP = new THREE.MeshStandardMaterial({ color: 0xc9a227, roughness: 0.35, metalness: 0.85 });
  const trap = (a, h, k) => [[-a / 2, h / 2], [a / 2, h / 2], [a / 2 * k, -h / 2], [-a / 2 * k, -h / 2]];
  const K = 0.84;
  const exterior = contornoRedondeado(trap(ancho, alto, K), 0.022, 3);
  const interior = contornoRedondeado(trap(ancho - pared * 2, alto - pared * 2, K), 0.014, 3);
  const cue = new THREE.Mesh(extruido(exterior, { huecos: [interior], espesor: fondo, bisel: 0.008 }), mC);
  cue.castShadow = true; g.add(cue);
  const fon = new THREE.Mesh(extruido(interior, { espesor: 0.02, bisel: 0.004 }), mC);
  fon.position.z = -fondo / 2 + 0.012; g.add(fon);
  // el chaflán que marca el lado: una uñeta en el borde inferior
  const una = new THREE.Mesh(new THREE.BoxGeometry(0.06, 0.012, fondo * 0.7), mC);
  una.position.set(ancho * 0.22, -alto / 2 + pared + 0.004, 0); g.add(una);
  const pines = [];
  for (let fila = 0; fila < 2; fila++) for (let i = 0; i < 8; i++) {
    const w = (ancho - pared * 2) * (fila === 0 ? 0.80 : 0.68);
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.0095, 0.0095, fondo * 0.55, 8), mP);
    p.rotation.x = Math.PI / 2;
    p.position.set(-w / 2 + i * w / 7, fila === 0 ? alto * 0.19 : -alto * 0.19, -fondo / 2 + 0.02 + fondo * 0.275);
    g.add(p); pines.push(p);
  }
  g.userData = { ancho, alto, fondo, boca: fondo / 2, pin: (k) => pines[k - 1].position.clone() };
  return g;
}

/**
 * ENCHUFE J1962 del cable del escáner: la mitad hembra, con su cuerpo trapecial
 * que casa con la toma, los 16 taladros en la cara, el AGARRE de goma con sus
 * nervios —por ahí se tira para sacarlo— y el alivio de tensión por donde sale el
 * cable. Es lo que se ve enchufado en el DLC del coche.
 *
 * Eje +Z: la CARA que entra en la toma mira a −Z y el cuerpo crece hacia +Z; el
 * origen está en la cara. `userData.salida` es donde nace el cable.
 */
export function enchufeJ1962(mat, opts = {}) {
  const { ancho = 0.40, alto = 0.17, largo = 0.20, color = 0x1d2226 } = opts;
  const g = new THREE.Group();
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0.20 });
  const mG = new THREE.MeshStandardMaterial({ color: 0x0f1216, roughness: 0.92, metalness: 0.02 });
  const mH = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.8, metalness: 0.1 });
  const trap = (a, h, k) => [[-a / 2, h / 2], [a / 2, h / 2], [a / 2 * k, -h / 2], [-a / 2 * k, -h / 2]];
  const cue = new THREE.Mesh(extruido(contornoRedondeado(trap(ancho, alto, 0.84), 0.02, 3),
    { espesor: largo * 0.45, bisel: 0.008 }), mC);
  cue.position.z = largo * 0.225; cue.castShadow = true; g.add(cue);
  for (let fila = 0; fila < 2; fila++) for (let i = 0; i < 8; i++) {        // los taladros de la cara
    const w = ancho * (fila === 0 ? 0.70 : 0.58);
    const h = new THREE.Mesh(new THREE.CircleGeometry(0.0105, 10), mH);
    h.rotation.y = Math.PI;                                                  // mira a −Z
    h.position.set(-w / 2 + i * w / 7, fila === 0 ? alto * 0.19 : -alto * 0.19, -0.0008); g.add(h);
  }
  // el agarre de goma, más ancho que el cuerpo, con sus nervios
  const ag = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho * 0.58, -alto * 0.62], [ancho * 0.58, -alto * 0.62], [ancho * 0.58, alto * 0.62], [-ancho * 0.58, alto * 0.62]], 0.04, 4),
    { espesor: largo * 0.55, bisel: 0.014 }), mG);
  ag.position.z = largo * 0.45 + largo * 0.275; ag.castShadow = true; g.add(ag);
  for (let i = 0; i < 5; i++) {
    const r = new THREE.Mesh(new THREE.BoxGeometry(ancho * 1.18, 0.012, 0.012), mC);
    r.position.set(0, alto * 0.64, largo * 0.55 + i * 0.026); g.add(r);
  }
  const al = new THREE.Mesh(revolucion([[0, 0], [0.050, 0], [0.038, 0.09], [0.030, 0.16], [0, 0.16]], { seg: 16 }), mG);
  al.rotation.x = Math.PI / 2; al.position.z = largo; g.add(al);
  g.userData = { ancho, alto, largo, salida: _V(0, 0, largo + 0.16) };
  return g;
}

/* ==========================================================================
   §17-C · BANCO DE PRUEBAS DE MÁQUINAS ELÉCTRICAS
   La bancada, la placa base ranurada, el variador mural, el servomotor, el
   dinamómetro de freno, el acople elástico, el volante, el banco de resistencias
   de frenado, el contactor modular, el reóstato tubular y la tarjeta de sensores
   Hall. Es lo que comparten los laboratorios de D5 (variador V/f, curvas V,
   conmutación BLDC, frenado, ensayos del circuito equivalente): hasta ahora cada
   uno ponía una losa flotante con cuatro cajas de colores encima.

   Convenio: las máquinas giratorias tienen su eje en +X y el origen en el eje;
   las cajas de mando miran a +Z y tienen su origen en el centro de su base.
   ========================================================================== */

const _bmMat = (color, rough = 0.5, metal = 0.2, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const _bmCaja = (w, h, d, m, x = 0, y = 0, z = 0) => {
  const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m);
  b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; return b;
};
const _bmCil = (r, h, m, seg = 20, r2 = null) => {
  const c = new THREE.Mesh(new THREE.CylinderGeometry(r, r2 == null ? r : r2, h, seg), m);
  c.castShadow = true; return c;
};
const _bmRect = (w, h, r = 0.02) =>
  contornoRedondeado([[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r, 3);
/** Una plancha con contorno redondeado, en el plano XY y con su espesor en Z. */
const _bmPlancha = (w, h, esp, m, r = 0.02, bisel = 0.006, huecos = []) => {
  const p = new THREE.Mesh(extruido(_bmRect(w, h, r), { espesor: esp, bisel, huecos }), m);
  p.castShadow = p.receiveShadow = true; return p;
};
/** Un rótulo de texto en un plano: placas de características, serigrafía. */
function _bmRotulo(texto, w, h, fondo = '#e9edf0', tinta = '#14181e', px = 256) {
  const cv = document.createElement('canvas');
  cv.width = px; cv.height = Math.max(16, Math.round(px * h / w));
  const c = cv.getContext('2d');
  c.fillStyle = fondo; c.fillRect(0, 0, cv.width, cv.height);
  c.fillStyle = tinta; c.textAlign = 'center'; c.textBaseline = 'middle';
  const lineas = String(texto).split('\n');
  const fs = Math.min(cv.height / (lineas.length + 0.6), cv.width / Math.max(3, Math.max(...lineas.map(l => l.length)) * 0.62));
  c.font = `bold ${fs}px system-ui, sans-serif`;
  lineas.forEach((l, i) => c.fillText(l, cv.width / 2, cv.height * (i + 1) / (lineas.length + 1)));
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const m = new THREE.Mesh(new THREE.PlaneGeometry(w, h), new THREE.MeshStandardMaterial({ map: tex, color: 0xb4bbc0, roughness: 0.85, metalness: 0 }));
  return m;
}

/**
 * BANCADA de laboratorio de máquinas: tablero con canto, delantal, cuatro patas
 * de tubo con sus niveladores, estante inferior y —opcional— el RESPALDO con su
 * barra de distribución sobre aisladores, que es donde en un taller se cuelgan
 * las tomas de fuerza. Origen en el suelo, centrada. `userData.topY` es la cara
 * superior del tablero; `userData.bus` da la altura de las barras y su z.
 */
export function bancoPruebasMaquinas(mat, opts = {}) {
  const { ancho = 5.4, fondo = 2.2, alto = 0.95, grosor = 0.07, respaldo = 0.5, color = 0x2e3d49 } = opts;
  const g = new THREE.Group();
  const mTop = mat.mesa || _bmMat(color, 0.70, 0.08);
  const mFe = _bmMat(0x3b4650, 0.58, 0.40);
  const mAc = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85);
  const mGo = mat.goma || _bmMat(0x14181e, 0.8, 0.02);
  const top = new THREE.Mesh(extruido(_bmRect(ancho, fondo, 0.06), { espesor: grosor, bisel: 0.012 }), mTop);
  top.rotation.x = -Math.PI / 2; top.position.y = alto - grosor / 2; top.castShadow = top.receiveShadow = true; g.add(top);
  // el canto de acero que protege el tablero: un perfil en C por todo el perímetro
  const hC = grosor * 0.55, yC = alto - grosor + hC / 2 - 0.004;
  for (const s of [-1, 1]) {
    g.add(_bmCaja(ancho + 0.012, hC, 0.012, mAc, 0, yC, s * (fondo / 2 + 0.003)));
    g.add(_bmCaja(0.012, hC, fondo + 0.012, mAc, s * (ancho / 2 + 0.003), yC, 0));
  }
  // el delantal que rigidiza el tablero por debajo
  const hD = 0.10, yD = alto - grosor - hD / 2;
  for (const s of [-1, 1]) {
    g.add(_bmCaja(ancho - 0.22, hD, 0.035, mFe, 0, yD, s * (fondo / 2 - 0.09)));
    g.add(_bmCaja(0.035, hD, fondo - 0.22, mFe, s * (ancho / 2 - 0.09), yD, 0));
  }
  const hP = alto - grosor - 0.035;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = sx * (ancho / 2 - 0.12), z = sz * (fondo / 2 - 0.12);
    g.add(_bmCaja(0.075, hP, 0.075, mFe, x, 0.035 + hP / 2, z));
    const pie = _bmCil(0.05, 0.035, mGo, 16); pie.position.set(x, 0.0175, z); g.add(pie);
    const tor = _bmCil(0.014, 0.05, mAc, 8); tor.position.set(x, 0.055, z); g.add(tor);
  }
  // el estante inferior y sus travesaños
  const yE = 0.28;
  const est = new THREE.Mesh(extruido(_bmRect(ancho - 0.30, fondo - 0.30, 0.04), { espesor: 0.03, bisel: 0.006 }), mFe);
  est.rotation.x = -Math.PI / 2; est.position.y = yE; est.castShadow = est.receiveShadow = true; g.add(est);
  for (const sz of [-1, 1]) g.add(_bmCaja(ancho - 0.22, 0.04, 0.03, mFe, 0, yE - 0.035, sz * (fondo / 2 - 0.12)));
  for (const sx of [-1, 1]) g.add(_bmCaja(0.03, 0.04, fondo - 0.22, mFe, sx * (ancho / 2 - 0.12), yE - 0.035, 0));
  g.userData.topY = alto;

  if (respaldo > 0) {
    // El respaldo: chapa vertical al fondo con una canaleta por arriba y dos
    // barras de cobre sobre aisladores de porcelana, que es el «bus» del banco.
    const zR = -fondo / 2 + 0.07, hR = respaldo;
    const pl = _bmPlancha(ancho - 0.20, hR, 0.025, mFe, 0.03, 0.004); pl.position.set(0, alto + hR / 2, zR); g.add(pl);
    const ca = _bmCaja(ancho - 0.20, 0.07, 0.07, _bmMat(0x2a323a, 0.5, 0.5), 0, alto + hR + 0.035, zR + 0.01); g.add(ca);
    const mCu = mat.cobre || _bmMat(0xb87333, 0.35, 0.8);
    const mPor = mat.ceramica || _bmMat(0xd9d6cb, 0.45, 0.1);
    const ys = [alto + hR * 0.34, alto + hR * 0.64];
    ys.forEach((y) => {
      g.add(_bmCaja(ancho - 0.5, 0.045, 0.012, mCu, 0, y, zR + 0.075));
      for (let i = 0; i < 5; i++) {
        const ai = _bmCil(0.022, 0.05, mPor, 12); ai.rotation.x = Math.PI / 2;
        ai.position.set(-(ancho - 0.9) / 2 + i * (ancho - 0.9) / 4, y, zR + 0.045); g.add(ai);
      }
    });
    g.userData.bus = { y: ys, z: zR + 0.075, x0: -(ancho - 0.5) / 2, x1: (ancho - 0.5) / 2 };
  }
  return g;
}

/**
 * PLACA BASE RANURADA: la chapa de fundición con ranuras en T sobre la que se
 * atornillan la máquina, el acople y el freno para que queden ALINEADOS. Sin
 * ella, tres máquinas sobre una mesa son tres máquinas sobre una mesa; con ella,
 * son un tren de ensayo. Origen en el centro de su cara inferior.
 */
export function placaBaseRanurada(mat, opts = {}) {
  const { largo = 4.2, ancho = 1.2, alto = 0.07, ranuras = 3 } = opts;
  const g = new THREE.Group();
  const mP = mat.fundicion || _bmMat(0x3d4650, 0.6, 0.40);
  const huecos = [];
  for (let i = 0; i < ranuras; i++) {
    const z = (i - (ranuras - 1) / 2) * (ancho * 0.28);
    huecos.push([[-largo * 0.45, z - 0.017], [largo * 0.45, z - 0.017], [largo * 0.45, z + 0.017], [-largo * 0.45, z + 0.017]]);
  }
  const p = new THREE.Mesh(extruido(_bmRect(largo, ancho, 0.03), { espesor: alto, bisel: 0.006, huecos }), mP);
  p.rotation.x = -Math.PI / 2; p.position.y = alto / 2; p.castShadow = p.receiveShadow = true; g.add(p);
  // el fondo oscuro de las ranuras, para que se lean como ranuras y no como agujeros
  const mF = _bmMat(0x0a0e12, 0.9, 0.1);
  for (let i = 0; i < ranuras; i++) {
    const z = (i - (ranuras - 1) / 2) * (ancho * 0.28);
    const f = _bmCaja(largo * 0.9, 0.004, 0.034, mF, 0, 0.012, z); f.castShadow = false; g.add(f);
  }
  // los pies de nivelación en las esquinas
  const mG = mat.goma || _bmMat(0x14181e, 0.8, 0.02);
  g.userData.sup = alto; g.userData.ranuras = ranuras;
  return g;
}

/**
 * VARIADOR / DRIVE de pared sobre su PLACA DE MONTAJE, de pie sobre la bancada.
 * El aparato se reconoce por tres cosas: la ventana del teclado con sus teclas y
 * sus tres pilotos, la rejilla de ventilación de arriba y la tapa de bornes de
 * abajo con sus prensaestopas, de donde salen los cables. `userData.visor` da
 * la ventana (en coordenadas locales) para pegarle la pantalla del laboratorio.
 */
export function variadorMural(mat, opts = {}) {
  const { ancho = 0.74, alto = 1.0, fondo = 0.30, color = 0x2f4d63, tapa = 0x243a4a,
          placa = true, glandulas = 3, rotulo = 'VFD' } = opts;
  const g = new THREE.Group();
  const mC = _bmMat(color, 0.42, 0.30), mT = _bmMat(tapa, 0.45, 0.30);
  const mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06);
  const mAc = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85);
  const y0 = placa ? 0.10 : 0, zP = placa ? 0.03 : 0;
  if (placa) {
    const pl = _bmPlancha(ancho * 1.30, alto * 1.12, 0.03, mat.chapa || _bmMat(0xaab4bb, 0.5, 0.5), 0.03, 0.004,
      [circulo(-ancho * 0.58, alto * 0.53, 0.014, 10), circulo(ancho * 0.58, alto * 0.53, 0.014, 10),
       circulo(-ancho * 0.58, -alto * 0.53, 0.014, 10), circulo(ancho * 0.58, -alto * 0.53, 0.014, 10)]);
    pl.position.set(0, y0 + alto * 0.56, 0.015); g.add(pl);
    for (const s of [-1, 1]) g.add(_bmCaja(0.05, y0 + 0.02, 0.22, _bmMat(0x39434c, 0.45, 0.6), s * ancho * 0.50, y0 / 2, 0.11));
  }
  const cuerpo = new THREE.Mesh(extruido(_bmRect(ancho, alto * 0.76, 0.05), { espesor: fondo, bisel: 0.014 }), mC);
  cuerpo.position.set(0, y0 + alto * 0.62, zP + fondo / 2); cuerpo.castShadow = cuerpo.receiveShadow = true; g.add(cuerpo);
  const zF = zP + fondo;                       // la cara frontal del cuerpo
  // la tapa de bornes, algo más saliente que el cuerpo
  const tb = new THREE.Mesh(extruido(_bmRect(ancho * 0.92, alto * 0.25, 0.04), { espesor: fondo * 1.12, bisel: 0.012 }), mT);
  tb.position.set(0, y0 + alto * 0.125, zP + fondo * 0.56); tb.castShadow = tb.receiveShadow = true; g.add(tb);
  const zT = zP + fondo * 1.12;
  // las rejillas de ventilación de arriba: ranuras a lo ancho
  for (let i = 0; i < 9; i++) g.add(_bmCaja(ancho * 0.62, alto * 0.012, 0.012, mN, 0, y0 + alto * (0.96 - i * 0.022), zF + 0.002));
  // el bisel del teclado: una ventana con marco oscuro
  const yV = y0 + alto * 0.68;
  const vw = ancho * 0.52, vh = vw / 1.6;
  const mar = new THREE.Mesh(extruido(_bmRect(vw + 0.07, vh + 0.07, 0.015), { espesor: 0.024, bisel: 0.005,
    huecos: [[[-vw / 2, -vh / 2], [vw / 2, -vh / 2], [vw / 2, vh / 2], [-vw / 2, vh / 2]]] }), mN);
  mar.position.set(0, yV, zF + 0.002); g.add(mar);
  const fondoV = new THREE.Mesh(new THREE.PlaneGeometry(vw, vh), _bmMat(0x05080a, 0.4, 0.05));
  fondoV.position.set(0, yV, zF + 0.006); g.add(fondoV);
  const pantalla = new THREE.Group(); pantalla.position.set(0, yV, zF + 0.010); g.add(pantalla);
  // las teclas del panel y los tres pilotos
  const mK = _bmMat(0xc9d1d6, 0.5, 0.25);
  for (let i = 0; i < 5; i++) {
    const k = _bmPlancha(ancho * 0.085, ancho * 0.05, 0.016, i === 4 ? _bmMat(0x2f9e6f, 0.5, 0.2) : mK, 0.008, 0.003);
    k.position.set(-ancho * 0.25 + i * ancho * 0.125, yV - vh / 2 - 0.09, zF + 0.008); g.add(k);
  }
  const leds = [0x35d07f, 0xf0b429, 0xe05252].map((c, i) => {
    const l = new THREE.Mesh(new THREE.SphereGeometry(0.014, 10, 8),
      new THREE.MeshStandardMaterial({ color: c, emissive: c, emissiveIntensity: 0.55, roughness: 0.4 }));
    l.position.set(-ancho * 0.38, yV + vh * 0.38 - i * 0.045, zF + 0.012); g.add(l); return l;
  });
  // la placa de características y el rótulo
  const rt = _bmRotulo(rotulo, ancho * 0.30, ancho * 0.075, '#dfe6ea', '#14181e');
  rt.position.set(ancho * 0.30, y0 + alto * 0.435, zF + 0.002); g.add(rt);
  // los prensaestopas de la tapa de bornes y los cables que salen de ellos
  const bocas = [];
  for (let i = 0; i < glandulas; i++) {
    const x = (i - (glandulas - 1) / 2) * ancho * 0.26;
    const gl = _bmCil(0.036, 0.05, mN, 16); gl.rotation.x = Math.PI / 2; gl.position.set(x, y0 + alto * 0.075, zT + 0.025); g.add(gl);
    const tu = _bmCil(0.046, 0.022, mAc, 6); tu.rotation.x = Math.PI / 2; tu.position.set(x, y0 + alto * 0.075, zT + 0.002); g.add(tu);
    bocas.push(new THREE.Vector3(x, y0 + alto * 0.075, zT + 0.05));
  }
  g.userData = { ancho, alto, fondo, visor: { ancho: vw, alto: vh }, pantalla, leds, bocas, frente: zT };
  return g;
}

/**
 * SERVOMOTOR / motor BLDC-PMSM de brida: cuerpo liso, tapa trasera con su
 * encoder, brida delantera con centrador y cuatro taladros, eje con chaveta y
 * el conector de potencia radial. Se distingue a diez metros de un asíncrono
 * por lo que NO tiene: ni aletas, ni ventilador, ni patas. Eje en +X.
 */
export function servoMotor(mat, opts = {}) {
  const { d = 0.62, largo = 0.78, eje = 0.34, color = 0x2f3a44, cuna = 0 } = opts;
  const g = new THREE.Group();
  const R = d / 2, De = d * 0.16;
  const mC = _bmMat(color, 0.38, 0.55), mAl = mat.aluminio || _bmMat(0xaab4bb, 0.35, 0.8);
  const mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06), mAc = mat.acero || _bmMat(0xb9c4c9, 0.25, 0.9);
  // el estator: cuerpo con un par de cintas de refrigeración y el cuello trasero
  const per = [[0, -largo / 2], [R * 0.86, -largo / 2], [R * 0.86, -largo / 2], [R * 0.86, -largo * 0.40],
    [R, -largo * 0.40], [R, -largo * 0.40], [R, largo * 0.40], [R, largo * 0.40],
    [R * 0.90, largo * 0.40], [R * 0.90, largo * 0.40], [R * 0.90, largo / 2], [0, largo / 2]];
  const cu = new THREE.Mesh(revolucion(per, { seg: 48 }), mC);
  cu.rotation.z = -Math.PI / 2; cu.castShadow = cu.receiveShadow = true; g.add(cu);
  // las cintas de refrigeración a lo largo del cuerpo (pequeñas nervaduras)
  for (let i = 0; i < 4; i++) {
    const a = Math.PI / 4 + i * Math.PI / 2;
    const cinta = _bmCaja(largo * 0.80, 0.016, 0.03, mC, 0, Math.cos(a) * R, Math.sin(a) * R);
    cinta.rotation.x = -a; g.add(cinta);
  }
  // la tapa trasera con el encoder / resolver
  const tr = new THREE.Mesh(revolucion([[0, 0], [R * 0.70, 0], [R * 0.70, 0], [R * 0.70, d * 0.17],
    [R * 0.56, d * 0.20], [R * 0.56, d * 0.20], [0, d * 0.20]], { seg: 36 }), mN);
  tr.rotation.z = Math.PI / 2; tr.position.x = -largo / 2 + 0.002; tr.castShadow = true; g.add(tr);
  // la brida delantera (cuadrada, con taladros) y su centrador
  const ancho = d * 1.12;
  const hue = [];
  for (const sx of [-1, 1]) for (const sy of [-1, 1]) hue.push(circulo(sx * ancho * 0.39, sy * ancho * 0.39, d * 0.036, 10));
  const br = new THREE.Mesh(extruido(_bmRect(ancho, ancho, d * 0.10), { espesor: d * 0.10, bisel: d * 0.008, huecos: hue }), mAl);
  br.rotation.y = Math.PI / 2; br.position.x = largo / 2 + d * 0.04; br.castShadow = true; g.add(br);
  const ce = new THREE.Mesh(revolucion([[0, 0], [d * 0.30, 0], [d * 0.30, 0], [d * 0.30, d * 0.05], [d * 0.30, d * 0.05], [0, d * 0.05]], { seg: 32 }), mAl);
  ce.rotation.z = -Math.PI / 2; ce.position.x = largo / 2 + d * 0.09; g.add(ce);
  // el eje y su chaveta: lo único que gira
  const gir = new THREE.Group(); g.add(gir);
  const ej = _bmCil(De / 2, eje + d * 0.09, mAc, 24); ej.rotation.z = Math.PI / 2; ej.position.x = largo / 2 + d * 0.09 + eje / 2 - d * 0.045; gir.add(ej);
  const ch = _bmCaja(eje * 0.62, De * 0.2, De * 0.30, mAc, largo / 2 + d * 0.10 + eje * 0.55, De * 0.50, 0); gir.add(ch);
  // conectores radiales de potencia y de señal sobre el cuerpo
  const co = _bmCil(d * 0.085, d * 0.16, mN, 20); co.position.set(-largo * 0.18, R + d * 0.07, 0); g.add(co);
  const cs = _bmCil(d * 0.055, d * 0.12, mN, 16); cs.position.set(largo * 0.05, R + d * 0.05, 0); g.add(cs);
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2 + Math.PI / 4;
    const pi = _bmCil(0.008, 0.02, mAc, 6); pi.position.set(-largo * 0.18 + Math.cos(a) * d * 0.035, R + d * 0.155, Math.sin(a) * d * 0.035); g.add(pi);
  }
  // las CUNAS: un servo no tiene patas, así que en el banco descansa sobre dos
  // cunas en V con su abrazadera, a la altura `cuna` bajo el cuerpo
  if (cuna > 0) {
    const mFe = _bmMat(0x39434c, 0.58, 0.40);
    for (const s of [-1, 1]) {
      const x = s * largo * 0.24;
      const cu2 = new THREE.Mesh(extruido(contornoRedondeado([[-R * 0.85, -R - cuna], [R * 0.85, -R - cuna],
        [R * 0.50, -R * 0.80], [-R * 0.50, -R * 0.80]], 0.015, 3), { espesor: 0.06, bisel: 0.008 }), mFe);
      cu2.rotation.y = Math.PI / 2; cu2.position.x = x; cu2.castShadow = true; g.add(cu2);
      const pl = _bmPlancha(0.20, R * 1.9, 0.02, mFe, 0.02, 0.004); pl.rotation.x = -Math.PI / 2; pl.position.set(x, -R - cuna + 0.01, 0); g.add(pl);
      const ab = new THREE.Mesh(new THREE.TorusGeometry(R * 1.02, 0.014, 6, 28, Math.PI), mFe);
      ab.rotation.y = Math.PI / 2; ab.position.x = x; ab.castShadow = true; g.add(ab);
      for (const z of [-1, 1]) { const tn = _bmCil(0.016, 0.05, mAc, 6); tn.position.set(x, 0.0, z * R * 1.05); tn.rotation.z = Math.PI / 2; g.add(tn); }
    }
  }
  // la placa de características, pegada al cuerpo por el lado de la cámara
  const rt = _bmRotulo('PMSM\n3~ 400 V', largo * 0.30, d * 0.14, '#dfe6ea', '#14181e');
  rt.position.set(largo * 0.12, 0, R * 1.003); g.add(rt);
  g.userData = { d, largo, rotor: gir, gira: (a) => { gir.rotation.x = a; },
    frente: largo / 2 + d * 0.09 + eje - d * 0.045, ejeY: 0, pie: -R * 0.999 };
  return g;
}

/**
 * ACOPLE ELÁSTICO de garras con araña de elastómero: dos cubos con sus garras
 * entrelazadas y la araña roja entre ellas. Es lo que une el eje del motor con el
 * del freno y absorbe el desalineamiento; en el banco es la pieza que gira a la
 * vista. Eje en +X, centrado. Todo el grupo gira junto.
 */
export function acopleElastico(mat, opts = {}) {
  const { d = 0.26, largo = 0.34, dEje = 0.10 } = opts;
  const g = new THREE.Group();
  const mAl = mat.aluminio || _bmMat(0xaab4bb, 0.35, 0.8), mAc = mat.acero || _bmMat(0xb9c4c9, 0.25, 0.9);
  const mR = _bmMat(0xd2552b, 0.65, 0.02);
  const R = d / 2, L = largo / 2;
  for (const s of [-1, 1]) {
    const per = [[dEje / 2, 0], [R * 0.92, 0], [R * 0.92, 0], [R * 0.92, L * 0.55], [R * 0.72, L * 0.55], [dEje / 2, L * 0.55]];
    const cubo = new THREE.Mesh(revolucion(per, { seg: 32 }), mAl);
    cubo.rotation.z = -s * Math.PI / 2; cubo.position.x = s * (L * 0.40); cubo.castShadow = true; g.add(cubo);
    // las garras: tres, que se meten entre las de enfrente
    for (let i = 0; i < 3; i++) {
      const a = (i / 3) * Math.PI * 2 + (s > 0 ? Math.PI / 3 : 0);
      const ga = _bmCaja(L * 0.62, R * 0.46, R * 0.34, mAl, s * L * 0.09, Math.cos(a) * R * 0.66, Math.sin(a) * R * 0.66);
      ga.rotation.x = -a; g.add(ga);
    }
    // el prisionero de cada cubo
    const pr = _bmCil(R * 0.07, R * 0.30, mAc, 6); pr.position.set(s * L * 0.70, R * 0.98, 0); g.add(pr);
  }
  // la araña: estrella de seis brazos entre las garras
  const arco = [];
  const n = 6, rI = R * 0.40, rE = R * 0.78;
  for (let i = 0; i < n * 2; i++) {
    const a = (i / (n * 2)) * Math.PI * 2, r = i % 2 === 0 ? rE : rI;
    arco.push([Math.cos(a) * r, Math.sin(a) * r]);
  }
  const ar = new THREE.Mesh(extruido(contornoRedondeado(arco, R * 0.10, 3), { espesor: L * 0.50, bisel: 0.006,
    huecos: [circulo(0, 0, dEje * 0.55, 16)] }), mR);
  ar.rotation.y = Math.PI / 2; ar.castShadow = true; g.add(ar);
  return g;
}

/**
 * VOLANTE DE INERCIA: la masa que almacena la energía cinética del frenado.
 * Disco de fundición con un cubo, una llanta gruesa y seis ventanas de
 * aligeramiento entre los radios; sin ellas es un tambor, no un volante. Eje +X.
 */
export function volanteInercia(mat, opts = {}) {
  const { d = 0.70, ancho = 0.12, dEje = 0.08 } = opts;
  const g = new THREE.Group();
  const mF = mat.volante || _bmMat(0x59626b, 0.5, 0.7);
  const R = d / 2;
  const hue = [];
  for (let i = 0; i < 6; i++) { const a = (i / 6) * Math.PI * 2 + Math.PI / 6; hue.push(circulo(Math.cos(a) * R * 0.56, Math.sin(a) * R * 0.56, R * 0.20, 20)); }
  const disco = new THREE.Mesh(extruido(circulo(0, 0, R * 0.98, 56), { espesor: ancho * 0.55, bisel: 0.01, huecos: hue }), mF);
  disco.rotation.y = Math.PI / 2; disco.castShadow = true; g.add(disco);
  const llanta = new THREE.Mesh(revolucion([[R * 0.80, -ancho / 2], [R * 0.80, -ancho / 2], [R, -ancho / 2], [R, -ancho / 2],
    [R, ancho / 2], [R, ancho / 2], [R * 0.80, ancho / 2], [R * 0.80, ancho / 2]], { seg: 56 }), mF);
  llanta.rotation.z = Math.PI / 2; llanta.castShadow = true; g.add(llanta);
  const cubo = new THREE.Mesh(revolucion([[dEje / 2, -ancho * 0.9], [R * 0.20, -ancho * 0.9], [R * 0.20, -ancho * 0.9],
    [R * 0.20, ancho * 0.9], [R * 0.20, ancho * 0.9], [dEje / 2, ancho * 0.9]], { seg: 28 }), mat.acero || mF);
  cubo.rotation.z = Math.PI / 2; g.add(cubo);
  // los taladros de equilibrado sobre la llanta
  const mN = mat.negro || _bmMat(0x14181e, 0.6, 0.1);
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2;
    const t = _bmCil(R * 0.025, ancho * 0.05, mN, 8); t.rotation.z = Math.PI / 2;
    t.position.set(ancho / 2, Math.cos(a) * R * 0.90, Math.sin(a) * R * 0.90); g.add(t);
  }
  return g;
}

/**
 * DINAMÓMETRO / FRENO de carga de corrientes de Foucault, montado en
 * muñones: la carcasa con aros de refrigeración, el eje con su brida de
 * acoplamiento, los dos soportes con su cojinete, y el BRAZO DE PAR que se apoya
 * en una célula de carga. El par que mide el banco es la fuerza en esa célula por
 * la longitud del brazo, y por eso la carcasa «flota»: lo que se lee es lo que
 * intenta girar el freno, no lo que gira. Eje +X, origen en el eje.
 */
export function dinamometroFreno(mat, opts = {}) {
  const { d = 0.66, largo = 0.56, eje = 0.26, base = 0.13, color = 0x315d83 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const mC = _bmMat(color, 0.42, 0.45), mAc = mat.acero || _bmMat(0xb9c4c9, 0.25, 0.9);
  const mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06), mFe = _bmMat(0x39434c, 0.58, 0.40);
  const mAl = mat.aluminio || _bmMat(0xaab4bb, 0.35, 0.8);
  // la carcasa con sus aros de refrigeración
  const n = 7, y0 = -largo / 2 + 0.07, y1 = largo / 2 - 0.07, paso = (y1 - y0) / n;
  const per = [[0, -largo / 2], [R * 0.80, -largo / 2], [R * 0.80, -largo / 2], [R * 0.80, y0]];
  for (let i = 0; i < n; i++) {
    const ya = y0 + i * paso + paso * 0.18, yb = y0 + (i + 1) * paso - paso * 0.18;
    per.push([R * 0.88, ya], [R, ya], [R, ya], [R, yb], [R, yb], [R * 0.88, yb]);
  }
  per.push([R * 0.80, y1], [R * 0.80, largo / 2], [R * 0.80, largo / 2], [0, largo / 2]);
  const cu = new THREE.Mesh(revolucion(per, { seg: 48 }), mC);
  cu.rotation.z = -Math.PI / 2; cu.castShadow = cu.receiveShadow = true; g.add(cu);
  // los muñones (cojinetes) y sus soportes en A hasta la placa
  const yB = -(R + base);
  const sopC = [[-R * 0.78, yB], [R * 0.78, yB], [R * 0.34, -R * 0.10], [-R * 0.34, -R * 0.10]];
  for (const s of [-1, 1]) {
    const x = s * (largo / 2 + 0.065);
    const so = new THREE.Mesh(extruido(contornoRedondeado(sopC, 0.02, 3), { espesor: 0.05, bisel: 0.008 }), mFe);
    so.rotation.y = Math.PI / 2; so.position.x = x; so.castShadow = true; g.add(so);
    const cj = new THREE.Mesh(revolucion([[R * 0.12, -0.035], [R * 0.30, -0.035], [R * 0.30, -0.035], [R * 0.30, 0.035], [R * 0.30, 0.035], [R * 0.12, 0.035]], { seg: 28 }), mAl);
    cj.rotation.z = Math.PI / 2; cj.position.x = x; g.add(cj);
    const pl = _bmPlancha(0.20, R * 1.7, 0.02, mFe, 0.02, 0.004); pl.rotation.x = -Math.PI / 2; pl.position.set(x, yB + 0.01, 0); g.add(pl);
  }
  // el eje: pasa de lado a lado y lleva en la entrada la brida de acoplamiento
  const gir = new THREE.Group(); g.add(gir);
  const ej = _bmCil(R * 0.085, largo + 0.13 * 2 + eje * 2, mAc, 24); ej.rotation.z = Math.PI / 2; gir.add(ej);
  const x0 = -(largo / 2 + 0.13 + eje);
  const br = new THREE.Mesh(extruido(circulo(0, 0, R * 0.30, 28), { espesor: 0.035, bisel: 0.005,
    huecos: [0, 1, 2, 3].map(i => circulo(Math.cos(i * Math.PI / 2 + 0.78) * R * 0.21, Math.sin(i * Math.PI / 2 + 0.78) * R * 0.21, R * 0.035, 8)) }), mAc);
  br.rotation.y = Math.PI / 2; br.position.x = x0 + 0.02; gir.add(br);
  const ch = _bmCaja(eje * 0.5, R * 0.025, R * 0.045, mAc, largo / 2 + 0.13 + eje * 0.55, R * 0.085, 0); gir.add(ch);
  // el brazo de par: sale tangente hacia +Z hasta la célula de carga
  const bz = R * 0.92;
  g.add(_bmCaja(0.075, 0.07, 0.09, mFe, 0, 0, R * 0.98));
  const brazo = _bmCaja(0.04, 0.034, 0.52, mFe, 0, 0, bz + 0.30); g.add(brazo);
  const zc = bz + 0.56;
  const cel = _bmCaja(0.05, 0.14, 0.05, mAl, 0, -0.09, zc); g.add(cel);
  const gal = _bmCaja(0.052, 0.035, 0.052, _bmMat(0xe2c03a, 0.5, 0.3), 0, -0.09, zc); g.add(gal);   // las galgas, bajo su cubierta
  const hPo = -0.16 - yB;
  g.add(_bmCaja(0.07, hPo, 0.07, mFe, 0, yB + hPo / 2, zc));
  const pz = _bmPlancha(0.24, 0.20, 0.02, mFe, 0.02, 0.004); pz.rotation.x = -Math.PI / 2; pz.position.set(0, yB + 0.01, zc); g.add(pz);
  // el cable de la célula de carga, que sube hasta el acondicionador
  const cab = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    _V(0.03, -0.09, zc + 0.03), _V(0.10, -0.2, zc + 0.12), _V(0.14, yB + 0.03, zc + 0.30)]), 12, 0.009, 6), mN);
  g.add(cab);
  // la caja de bornes de la bobina de excitación, arriba
  g.add(_bmCaja(0.17, 0.07, 0.13, mFe, 0, R + 0.03, 0));
  const gl = _bmCil(0.022, 0.05, mN, 12); gl.position.set(0.05, R + 0.09, 0); g.add(gl);
  const rt = _bmRotulo('FRENO\nFOUCAULT', largo * 0.62, 0.13, '#dfe6ea', '#14181e');
  rt.position.set(0, R * 0.5, R * 0.866 + 0.004); rt.rotation.x = -Math.PI / 6; g.add(rt);
  g.userData = { d, largo, rotor: gir, gira: (a) => { gir.rotation.x = a; }, pie: yB, entrada: x0 };
  return g;
}

/**
 * BANCO DE RESISTENCIAS DE FRENADO: una jaula de chapa con persianas al frente
 * y, detrás, los tubos cerámicos con su arrollamiento de hilo resistivo. Los
 * tubos se ven entre las lamas; el hilo es de aleación Ni-Cr, y por eso
 * `userData.alambre` es un material propio: el laboratorio puede encenderlo
 * (emisivo) cuando de verdad está disipando la energía del frenado.
 */
export function bancoResistenciasFrenado(mat, opts = {}) {
  const { ancho = 0.80, alto = 0.62, fondo = 0.46, tubos = 5, color = 0x6b3a2a } = opts;
  const g = new THREE.Group();
  const mC = _bmMat(color, 0.5, 0.45), mFe = _bmMat(0x39434c, 0.58, 0.40);
  const mCer = mat.ceramica || _bmMat(0xd9d6cb, 0.55, 0.05);
  const mAl = _bmMat(0x4a3f3a, 0.45, 0.8);
  const alambre = _bmMat(0x6a5448, 0.4, 0.85, { emissive: 0xff5a1a, emissiveIntensity: 0 });
  // el bastidor: base, techo con ventilación y dos laterales
  g.add(_bmCaja(ancho, 0.03, fondo, mFe, 0, 0.015, 0));
  g.add(_bmCaja(ancho, 0.03, fondo, mC, 0, alto - 0.015, 0));
  for (const s of [-1, 1]) g.add(_bmCaja(0.03, alto, fondo, mC, s * (ancho / 2 - 0.015), alto / 2, 0));
  g.add(_bmCaja(ancho - 0.06, alto - 0.06, 0.02, mC, 0, alto / 2, -fondo / 2 + 0.01));
  for (let i = 0; i < 8; i++) g.add(_bmCaja(ancho * 0.7, 0.006, 0.018, _bmMat(0x14181e, 0.8, 0.1), 0, alto - 0.001, -fondo * 0.38 + i * fondo * 0.108));
  // los tubos cerámicos, con el hilo en hélice
  const hRes = alto - 0.15;
  for (let i = 0; i < tubos; i++) {
    const x = (i - (tubos - 1) / 2) * (ancho - 0.2) / Math.max(1, tubos - 1);
    const tu = _bmCil(0.045, hRes, mCer, 16); tu.position.set(x, 0.03 + hRes / 2 + 0.03, -0.03); g.add(tu);
    const pts = [], vueltas = 18;
    for (let k = 0; k <= vueltas * 10; k++) {
      const t = k / (vueltas * 10), a = t * vueltas * Math.PI * 2;
      pts.push(_V(x + Math.cos(a) * 0.050, 0.03 + 0.03 + 0.04 + t * (hRes - 0.08), -0.03 + Math.sin(a) * 0.050));
    }
    g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), vueltas * 10, 0.006, 5), alambre));
    for (const yy of [0.065, hRes + 0.03]) { const an = _bmCil(0.052, 0.025, mAl, 14); an.position.set(x, yy, -0.03); g.add(an); }
  }
  // las persianas del frente: lamas inclinadas que dejan ver los tubos
  const nL = 7;
  for (let i = 0; i < nL; i++) {
    const l = _bmCaja(ancho - 0.06, 0.016, 0.040, mC, 0, 0.09 + i * (alto - 0.20) / (nL - 1), fondo / 2 - 0.012);
    l.rotation.x = 0.40; g.add(l);
  }
  // los bornes de potencia: dos pletinas con su tornillo, arriba y de lado
  const mCu = mat.cobre || _bmMat(0xb87333, 0.35, 0.8);
  for (let i = 0; i < 2; i++) {
    g.add(_bmCaja(0.10, 0.02, 0.05, mCu, -0.12 + i * 0.24, alto + 0.012, 0.06));
    const ts = _bmCil(0.017, 0.03, mFe, 6); ts.position.set(-0.12 + i * 0.24, alto + 0.035, 0.06); g.add(ts);
  }
  const rt = _bmRotulo('R EXT\n2 Ω · 5 kW', ancho * 0.5, 0.09, '#e9d28a', '#2a1a10');
  rt.position.set(0, alto - 0.075, fondo / 2 + 0.002); g.add(rt);
  g.userData = { ancho, alto, fondo, alambre, brillo: (k) => { alambre.emissiveIntensity = k; } };
  return g;
}

/** RIEL OMEGA (DIN de 35 mm) con sus agujeros alargados. Origen en el centro de su cara. */
export function rielOmega(mat, opts = {}) {
  const { largo = 1.0 } = opts;
  const g = new THREE.Group();
  const m = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85);
  g.add(_bmCaja(largo, 0.035, 0.004, m, 0, 0, 0));
  g.add(_bmCaja(largo, 0.004, 0.012, m, 0, 0.0155, 0.007)); g.add(_bmCaja(largo, 0.004, 0.012, m, 0, -0.0155, 0.007));
  g.add(_bmCaja(largo, 0.025, 0.003, m, 0, 0, 0.0145));
  return g;
}

/**
 * CONTACTOR modular tripolar: cuerpo gris oscuro, los tres bornes de potencia
 * arriba y los tres de salida abajo con sus tornillos de cabeza cruzada, la
 * bobina A1/A2 a un lado, la placa azul y el botón de maniobra manual. Es lo que un
 * electricista identifica antes de leer ninguna etiqueta. Frente a +Z, origen
 * en el centro de su base (la que va al riel).
 */
export function contactorModular(mat, opts = {}) {
  const { ancho = 0.34, alto = 0.46, fondo = 0.28, rotulo = 'K1', color = 0x2b3139 } = opts;
  const g = new THREE.Group();
  const mC = _bmMat(color, 0.55, 0.15), mT = _bmMat(0x181c21, 0.6, 0.15);
  const mAc = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85), mAz = _bmMat(0x2b6cb0, 0.5, 0.2);
  const cu = new THREE.Mesh(extruido(_bmRect(ancho, alto, 0.02), { espesor: fondo, bisel: 0.008 }), mC);
  cu.position.set(0, 0, fondo / 2); cu.castShadow = cu.receiveShadow = true; g.add(cu);
  // las dos bandas de bornes, algo más salientes y más oscuras que el cuerpo
  g.add(_bmCaja(ancho * 0.96, alto * 0.25, 0.014, mT, 0, alto * 0.375, fondo + 0.007));
  g.add(_bmCaja(ancho * 0.96, alto * 0.25, 0.014, mT, 0, -alto * 0.375, fondo + 0.007));
  // los bornes: tres arriba (1,3,5) y tres abajo (2,4,6): mordaza de acero con su
  // tornillo de cabeza ranurada y, por el borde, la boca por donde entra el cable
  const bocas = { arriba: [], abajo: [] };
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * ancho * 0.30;
    for (const [y, lado, sg] of [[alto * 0.40, 'arriba', 1], [-alto * 0.40, 'abajo', -1]]) {
      g.add(_bmCaja(ancho * 0.21, alto * 0.115, 0.034, mAc, x, y, fondo + 0.022));
      const tn = _bmCil(ancho * 0.052, 0.012, mT, 14); tn.position.set(x, y, fondo + 0.044); tn.rotation.x = Math.PI / 2; g.add(tn);
      g.add(_bmCaja(ancho * 0.078, 0.008, 0.004, mAc, x, y, fondo + 0.052));
      g.add(_bmCaja(ancho * 0.12, alto * 0.03, 0.03, _bmMat(0x07090b, 0.8, 0.05), x, y + sg * alto * 0.088, fondo + 0.020));
      bocas[lado].push(new THREE.Vector3(x, y + sg * alto * 0.11, fondo + 0.02));
    }
  }
  // la placa del frente: franja blanca con el nombre y la referencia, y la azul de la bobina
  const pl = _bmRotulo(rotulo, ancho * 0.50, alto * 0.13, '#eef1f3', '#14181e');
  pl.position.set(-ancho * 0.18, alto * 0.14, fondo + 0.002); g.add(pl);
  const bob = _bmRotulo('A1\nA2', ancho * 0.22, alto * 0.13, '#2b6cb0', '#ffffff');
  bob.position.set(ancho * 0.30, alto * 0.14, fondo + 0.002); g.add(bob);
  // el botón de maniobra manual, que se pulsa con un destornillador
  const bt = _bmCaja(ancho * 0.26, alto * 0.05, 0.02, mAz, 0, -alto * 0.10, fondo + 0.006); g.add(bt);
  // el piloto de bobina: se enciende (emisivo) cuando el contactor está accionado
  const mPi = new THREE.MeshStandardMaterial({ color: 0xf0b429, emissive: 0xf0b429, emissiveIntensity: 0.0, roughness: 0.4 });
  const pu = _bmCil(ancho * 0.03, 0.02, mPi, 10); pu.rotation.x = Math.PI / 2; pu.position.set(ancho * 0.34, -alto * 0.10, fondo + 0.006); g.add(pu);
  // los dos garfios del riel, en la base
  for (const s of [-1, 1]) g.add(_bmCaja(ancho * 0.18, alto * 0.06, 0.02, mAc, s * ancho * 0.26, -alto * 0.20, -0.008));
  g.userData = { ancho, alto, fondo, bocas, frente: fondo, piloto: mPi };
  return g;
}

/**
 * REÓSTATO TUBULAR: el tubo cerámico con su arrollamiento de hilo, la
 * corredera con su cursor y la manivela. Mover el cursor cambia cuántas espiras
 * quedan en el circuito, que es exactamente lo que hace un control de campo.
 * Eje +X, origen en el centro; `userData.cursor` se desplaza en x para dar el
 * valor (de -largo/2 a +largo/2).
 */
export function reostatoTubular(mat, opts = {}) {
  const { largo = 0.80, d = 0.16 } = opts;
  const g = new THREE.Group();
  const mCer = mat.ceramica || _bmMat(0xd9d6cb, 0.55, 0.05), mFe = _bmMat(0x39434c, 0.58, 0.40);
  const mAc = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85), mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06);
  const mH = _bmMat(0x7a6252, 0.4, 0.85);
  const tu = _bmCil(d / 2, largo, mCer, 24); tu.rotation.z = Math.PI / 2; g.add(tu);
  const pts = [], vueltas = 34;
  for (let k = 0; k <= vueltas * 8; k++) {
    const t = k / (vueltas * 8), a = t * vueltas * Math.PI * 2;
    pts.push(_V(-largo * 0.46 + t * largo * 0.92, Math.cos(a) * (d / 2 + 0.004), Math.sin(a) * (d / 2 + 0.004)));
  }
  g.add(new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), vueltas * 8, 0.0045, 5), mH));
  for (const s of [-1, 1]) {
    const tapa = _bmCil(d * 0.62, 0.04, mFe, 20); tapa.rotation.z = Math.PI / 2; tapa.position.x = s * (largo / 2 + 0.02); g.add(tapa);
    const pie = _bmCaja(0.05, d * 0.9, d * 1.5, mFe, s * (largo / 2 + 0.02), -d * 0.55, 0); g.add(pie);
    const bn = _bmCil(0.014, 0.05, mAc, 10); bn.position.set(s * (largo / 2 + 0.02), d * 0.62 + 0.02, 0); g.add(bn);
    const tu2 = _bmCil(0.024, 0.014, mN, 12); tu2.position.set(s * (largo / 2 + 0.02), d * 0.62 + 0.05, 0); g.add(tu2);
  }
  // la barra guía por encima y el cursor que corre por ella
  const guia = _bmCil(0.007, largo + 0.04, mAc, 8); guia.rotation.z = Math.PI / 2; guia.position.set(0, d * 0.82, 0); g.add(guia);
  for (const s of [-1, 1]) g.add(_bmCaja(0.016, d * 0.40, 0.016, mAc, s * (largo / 2 + 0.02), d * 0.62, 0));
  const cursor = new THREE.Group(); cursor.position.set(0, d * 0.82, 0); g.add(cursor);
  cursor.add(_bmCaja(0.06, 0.04, 0.05, mN, 0, 0, 0));
  const esc = _bmCaja(0.012, d * 0.30, 0.012, mAc, 0, -d * 0.18, 0); cursor.add(esc);   // la escobilla que toca el hilo
  const man = _bmCil(0.028, 0.05, _bmMat(0xc43d3d, 0.5, 0.2), 14); man.position.set(0, 0.045, 0); cursor.add(man);
  g.userData = { largo, d, cursor, pone: (t) => { cursor.position.x = -largo * 0.46 + t * largo * 0.92; } };
  return g;
}

/**
 * TARJETA DE SENSORES HALL: el anillo de circuito impreso con los tres sensores
 * (TO-92) a 120° eléctricos, su conector de cinco vías y, delante, el imán del
 * rotor: un anillo con sus polos pintados N y S. Es lo que decide qué fases
 * conducen en la conmutación de seis pasos. De pie sobre su peana, mirando a +Z.
 */
export function tarjetaHall(mat, opts = {}) {
  const { d = 0.50, polos = 4 } = opts;
  const g = new THREE.Group();
  const mP = _bmMat(0x1f6b3a, 0.55, 0.1), mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06);
  const mAc = mat.acero || _bmMat(0xb9c4c9, 0.3, 0.85), mFe = _bmMat(0x39434c, 0.58, 0.40);
  const R = d / 2, yC = R + 0.07;
  const peana = _bmPlancha(d * 0.62, 0.14, 0.024, mFe, 0.02, 0.004);
  peana.rotation.x = -Math.PI / 2; peana.position.y = 0.012; g.add(peana);
  g.add(_bmCaja(0.05, yC - 0.02, 0.05, mFe, 0, (yC + 0.02) / 2 - 0.0, 0));
  const pcb = new THREE.Mesh(extruido(circulo(0, 0, R, 48), { espesor: 0.016, bisel: 0.003,
    huecos: [circulo(0, 0, R * 0.46, 36), ...[0, 1, 2].map(i => circulo(Math.cos(i * 2.094 + 0.5) * R * 0.78, Math.sin(i * 2.094 + 0.5) * R * 0.78, 0.014, 8))] }), mP);
  pcb.position.set(0, yC, 0); pcb.castShadow = true; g.add(pcb);
  // los tres sensores, cada uno con su rótulo H1/H2/H3
  for (let i = 0; i < 3; i++) {
    const a = i * (Math.PI * 2 / 3) + Math.PI / 2;
    const s = new THREE.Mesh(revolucion([[0, 0], [0.034, 0], [0.034, 0.020], [0.034, 0.030], [0.0, 0.034]], { seg: 14 }), mN);
    s.rotation.x = Math.PI / 2; s.position.set(Math.cos(a) * R * 0.74, yC + Math.sin(a) * R * 0.74, 0.008); s.castShadow = true; g.add(s);
    for (const dx of [-0.014, 0, 0.014]) g.add(_bmCaja(0.004, 0.02, 0.003, mAc, Math.cos(a) * R * 0.74 + dx, yC + Math.sin(a) * R * 0.74 - 0.025, 0.004));
  }
  // el conector de cinco vías en la cara baja del anillo
  g.add(_bmCaja(0.17, 0.045, 0.034, _bmMat(0xe8e6dc, 0.5, 0.05), 0, yC - R * 0.93, 0.018));
  for (let i = 0; i < 5; i++) g.add(_bmCaja(0.008, 0.02, 0.008, mAc, -0.064 + i * 0.032, yC - R * 0.93 - 0.032, 0.018));
  // el imán del rotor, enfrente: anillo con polos N-S alternos
  const gi = new THREE.Group(); gi.position.set(0, yC, 0.11);
  const rI = R * 0.40;
  for (let i = 0; i < polos; i++) {
    const a0 = (i / polos) * Math.PI * 2, a1 = ((i + 1) / polos) * Math.PI * 2 - 0.05;
    const seg = new THREE.Mesh(new THREE.CylinderGeometry(rI, rI, 0.06, 20, 1, false, a0, a1 - a0),
      _bmMat(i % 2 ? 0x2f6fb4 : 0xc0392b, 0.5, 0.45));
    seg.rotation.x = Math.PI / 2; seg.castShadow = true; gi.add(seg);
  }
  const nuc = _bmCil(rI * 0.55, 0.07, mFe, 20); nuc.rotation.x = Math.PI / 2; gi.add(nuc);
  g.add(gi);
  g.userData = { iman: gi, giraIman: (a) => { gi.rotation.z = a; }, d };
  return g;
}

/**
 * SOPORTE DE PIZARRÓN: dos montantes de tubo con su pie en T y un travesaño por
 * detrás, para que la pantalla grande deje de flotar sobre la mesa. Origen en
 * el suelo, en el plano de la parte trasera de la pantalla; la pantalla se
 * cuelga a la altura que se quiera por encima de `userData.alturaBase`.
 */
export function soportePizarron(mat, opts = {}) {
  const { ancho = 3.2, alto = 2.35, y = 2.35 } = opts;
  const g = new THREE.Group();
  const mFe = _bmMat(0x39434c, 0.58, 0.40), mGo = mat.goma || _bmMat(0x14181e, 0.8, 0.02);
  const hP = y + alto * 0.30;
  for (const s of [-1, 1]) {
    const x = s * (ancho / 2 - 0.20);
    g.add(_bmCaja(0.09, hP, 0.09, mFe, x, hP / 2, -0.06));
    g.add(_bmCaja(0.09, 0.05, 0.9, mFe, x, 0.025, 0.20));
    for (const z of [-0.20, 0.62]) { const p = _bmCil(0.05, 0.03, mGo, 14); p.position.set(x, 0.015 - 0.015, z); p.position.y = 0.015; g.add(p); }
  }
  g.add(_bmCaja(ancho - 0.2, 0.08, 0.06, mFe, 0, y - alto * 0.34, -0.055));
  g.add(_bmCaja(ancho - 0.2, 0.08, 0.06, mFe, 0, y + alto * 0.28, -0.055));
  return g;
}

/**
 * PERILLA GRADUADA en su caja de mando: la caja con el frontal serigrafiado
 * (escala de 270° con sus marcas y cifras) y el mando de aluminio con su
 * índice. `pone(t)` con t en [0, 1] lleva el índice de la marca mínima a la
 * máxima, que es lo que el laboratorio necesita para que la perilla del 3D
 * diga lo mismo que el deslizador. Frente a +Z, origen en el centro de la base.
 */
export function perillaGraduada(mat, opts = {}) {
  const { ancho = 0.52, alto = 0.46, fondo = 0.30, etiqueta = 'f', min = 0, max = 100, marcas = 11 } = opts;
  const g = new THREE.Group();
  const mC = _bmMat(0x2b3139, 0.5, 0.3), mAl = mat.aluminio || _bmMat(0xaab4bb, 0.35, 0.8);
  const mN = mat.negro || _bmMat(0x14181e, 0.62, 0.06);
  const cu = new THREE.Mesh(extruido(_bmRect(ancho, alto, 0.04), { espesor: fondo, bisel: 0.01 }), mC);
  cu.position.set(0, alto / 2, fondo / 2); cu.castShadow = cu.receiveShadow = true; g.add(cu);
  // el frontal serigrafiado: escala de 270°, marcas y cifras
  const px = 256, cv = document.createElement('canvas'); cv.width = cv.height = px;
  const c = cv.getContext('2d');
  c.fillStyle = '#d9dee2'; c.fillRect(0, 0, px, px);
  c.strokeStyle = '#14181e'; c.fillStyle = '#14181e'; c.textAlign = 'center'; c.textBaseline = 'middle';
  for (let i = 0; i < marcas; i++) {
    const t = i / (marcas - 1), a = (0.5 - t) * 1.5 * Math.PI;       // misma ley que el índice
    const dx = -Math.sin(a), dy = -Math.cos(a);                      // 0 → abajo-izquierda
    c.lineWidth = i % 5 === 0 ? 5 : 3;
    c.beginPath(); c.moveTo(px / 2 + dx * 80, px / 2 + dy * 80); c.lineTo(px / 2 + dx * 100, px / 2 + dy * 100); c.stroke();
    if (i % 5 === 0 || marcas <= 6) { c.font = 'bold 22px system-ui'; c.fillText(String(Math.round(min + (max - min) * t)), px / 2 + dx * 120, px / 2 + dy * 120); }
  }
  c.font = 'bold 30px system-ui'; c.fillText(etiqueta, px / 2, px * 0.90);
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const lado = Math.min(ancho, alto) * 0.92;
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(lado, lado), new THREE.MeshStandardMaterial({ map: tex, color: 0x9aa2a8, roughness: 0.85, metalness: 0 }));
  fr.position.set(0, alto / 2, fondo + 0.001); g.add(fr);
  // el mando: cuerpo moleteado, tapa y el índice
  const mando = new THREE.Group(); mando.position.set(0, alto / 2, fondo + 0.004); g.add(mando);
  const rk = lado * 0.20;
  const cuerpo = new THREE.Mesh(revolucion([[0, 0], [rk, 0], [rk, 0], [rk, lado * 0.10], [rk * 0.86, lado * 0.13], [0, lado * 0.13]], { seg: 28 }), mN);
  cuerpo.rotation.x = Math.PI / 2; cuerpo.castShadow = true; mando.add(cuerpo);
  const ind = _bmCaja(rk * 0.16, rk * 0.95, lado * 0.02, _bmMat(0xf2f5f7, 0.4, 0.2), 0, rk * 0.50, lado * 0.134); mando.add(ind);
  const rueda = _bmCil(rk * 0.45, lado * 0.02, mAl, 20); rueda.rotation.x = Math.PI / 2; rueda.position.z = lado * 0.134; mando.add(rueda);
  const pone = (t) => { mando.rotation.z = (0.5 - Math.max(0, Math.min(1, t))) * 1.5 * Math.PI; };
  pone(0.5);
  g.userData = { ancho, alto, fondo, mando, pone };
  return g;
}

/* ==========================================================================
   §17-A · ESQUINA DE VEHÍCULO (suspensión y frenos) E INYECCIÓN MPFI
   Piezas para montar una esquina de coche sobre un banco —mangueta, brazo de
   suspensión, amortiguador con muelle— y un riel de combustible sobre su
   colector de admisión y su culata. Todas siguen el convenio de la biblioteca:
   reciben el diccionario de materiales del laboratorio y devuelven un grupo.
   Materiales que leen (todos con sustituto): `hierro`/`acero` (fundición y
   chapa), `bastidor` (pintura del banco), `amort` y `muelle` (pintura del
   amortiguador y del muelle), `colector` (plástico del colector), `oring`.
   ========================================================================== */

/**
 * MANGUETA (el «nudillo» de dirección): la fundición que sostiene el buje, une
 * la rueda con la suspensión y lleva atornillada la mordaza. Se reconoce por su
 * silueta: la caja del rodamiento en el centro, el cuello que sube a la pinza
 * del amortiguador, la rótula de abajo, el brazo de dirección que sale hacia
 * delante y las dos orejas traseras donde se atornilla la mordaza.
 *
 * Eje de la rueda en +X (la placa es normal a X); el frente del coche, en −Z.
 * El origen es el eje del buje. `userData` da, en coordenadas locales, la
 * rótula inferior, el extremo del brazo de dirección, el cuello del amortiguador
 * y las orejas de la mordaza, para que el laboratorio cuelgue de ahí el resto.
 */
export function mangueta(mat, opts = {}) {
  const { escala = 1, grueso = 0.09 } = opts;
  const e = escala, g = new THREE.Group();
  const M = mat.hierro || mat.acero;
  const P = [[-0.10, -0.36], [0.10, -0.36], [0.10, -0.20], [0.42, -0.20], [0.42, -0.10],
    [0.17, -0.06], [0.17, 0.12], [0.11, 0.16], [0.11, 0.52], [-0.11, 0.52], [-0.11, 0.16],
    [-0.18, 0.12], [-0.34, 0.12], [-0.34, 0.00], [-0.18, -0.06], [-0.18, -0.20], [-0.10, -0.20]]
    .map(([u, v]) => [u * e, v * e]);
  const placa = new THREE.Mesh(extruido(contornoRedondeado(P, 0.035 * e, 3), {
    huecos: [circulo(0, 0, 0.11 * e, 24), circulo(0, 0.43 * e, 0.024 * e, 10),
             circulo(0, 0.31 * e, 0.024 * e, 10), circulo(-0.26 * e, 0.06 * e, 0.022 * e, 10)],
    espesor: grueso * e, bisel: 0.012 * e }), M);
  placa.rotation.y = Math.PI / 2;               // el contorno se lee con +u hacia delante (−Z)
  placa.castShadow = true; g.add(placa);
  // La caja del rodamiento: el cubo que atraviesa la placa.
  const caja = new THREE.Mesh(revolucion([
    [0.062 * e, -0.115 * e], [0.150 * e, -0.115 * e], [0.150 * e, -0.115 * e], [0.150 * e, 0.115 * e],
    [0.150 * e, 0.115 * e], [0.062 * e, 0.115 * e]], { seg: 32 }), M);
  caja.rotation.z = Math.PI / 2; caja.castShadow = true; g.add(caja);
  // La rótula de abajo: espárrago cónico con su guardapolvo de goma.
  const rotula = new THREE.Mesh(revolucion([
    [0, 0], [0.050 * e, 0], [0.050 * e, 0.012 * e], [0.036 * e, 0.060 * e], [0.024 * e, 0.075 * e],
    [0, 0.075 * e]], { seg: 20 }), mat.negro || M);
  rotula.position.y = -0.36 * e - 0.07 * e; g.add(rotula);
  // Los dos pernos del cuello (los que sujetan la pinza del amortiguador).
  for (const y of [0.43, 0.31]) {
    const t = tornilloHex(mat, { d: 0.05 * e, largo: 0.20 * e });
    t.rotation.z = Math.PI / 2; t.position.set(-grueso * e * 0.5, y * e, 0); g.add(t);
  }
  // Los dos pernos de la mordaza, en las orejas traseras (+Z).
  for (const y of [0.12, 0.00]) {
    const t = tornilloHex(mat, { d: 0.045 * e, largo: 0.16 * e });
    t.rotation.z = Math.PI / 2; t.position.set(-grueso * e * 0.5, y * e, 0.26 * e); g.add(t);
  }
  // La rótula del brazo de dirección, en la punta del brazo.
  const bd = new THREE.Mesh(revolucion([
    [0, 0], [0.040 * e, 0], [0.032 * e, 0.07 * e], [0.02 * e, 0.09 * e], [0, 0.09 * e]], { seg: 16 }),
    mat.negro || M);
  bd.position.set(0, -0.20 * e, -0.36 * e); g.add(bd);
  g.userData = { rotulaInf: _V(0, -0.36 * e, 0), brazoDir: _V(0, -0.15 * e, -0.36 * e),
    cuello: _V(0, 0.52 * e, 0), orejas: _V(0, 0.06 * e, 0.26 * e), grueso: grueso * e };
  return g;
}

/**
 * BRAZO DE SUSPENSIÓN inferior (trapecio o «A»): la chapa estampada con su
 * aligeramiento, los dos casquillos de goma que giran sobre el larguero y la
 * rótula que sube a la mangueta. En un coche de verdad es la pieza que mueve
 * la rueda arriba y abajo sin dejarla escapar hacia los lados.
 *
 * El origen es el centro de la chapa en la punta; el brazo se extiende hacia +X
 * (hacia el interior del coche) `largo`, y los dos casquillos quedan sobre el
 * eje común paralelo a Z en x = largo, separados `ancho`. La rótula sube 0,14.
 */
export function brazoSuspension(mat, opts = {}) {
  const { largo = 1.0, ancho = 0.8, grueso = 0.045, d = 0.10 } = opts;
  const g = new THREE.Group();
  const M = mat.bastidor || mat.acero, A = ancho / 2, L = largo;
  const T = [[0, -0.075], [L, -A - 0.075], [L, A + 0.075], [0, 0.075]];
  const H = [[L * 0.20, -0.02], [L * 0.84, -A * 0.66], [L * 0.84, A * 0.66], [L * 0.20, 0.02]];
  const placa = new THREE.Mesh(extruido(contornoRedondeado(T, 0.04, 3), {
    huecos: [contornoRedondeado(H, 0.05, 3)], espesor: grueso, bisel: grueso * 0.22 }), M);
  placa.rotation.x = -Math.PI / 2; placa.castShadow = true; g.add(placa);
  // El nervio: un reborde en el borde exterior, que es lo que rigidiza la chapa.
  for (const s of [1, -1]) {
    const ln = Math.hypot(L, A);
    const n = new THREE.Mesh(new THREE.BoxGeometry(ln, grueso * 1.9, 0.016), M);
    n.position.set(L / 2, grueso * 0.30, s * (A / 2 + 0.075)); n.rotation.y = -s * Math.atan2(A, L);
    g.add(n);
  }
  // Los dos casquillos: camisa de acero y goma, ejes paralelos a Z.
  for (const s of [1, -1]) {
    const cam = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.62, d * 0.62, d * 1.25, 20), M);
    cam.rotation.x = Math.PI / 2; cam.position.set(L, 0, s * A); cam.castShadow = true; g.add(cam);
    const goma = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.44, d * 0.44, d * 1.34, 18),
      mat.goma || mat.negro);
    goma.rotation.x = Math.PI / 2; goma.position.copy(cam.position); g.add(goma);
    const ej = new THREE.Mesh(new THREE.CylinderGeometry(d * 0.17, d * 0.17, d * 1.6, 10), mat.acero || M);
    ej.rotation.x = Math.PI / 2; ej.position.copy(cam.position); g.add(ej);
  }
  // La rótula de la punta, con su guardapolvo.
  const r = new THREE.Mesh(revolucion([[0, 0.02], [d * 0.58, 0.02], [d * 0.50, 0.075],
    [d * 0.34, 0.12], [d * 0.22, 0.14], [0, 0.14]], { seg: 22 }), mat.negro || M);
  g.add(r);
  g.userData = { largo, ancho, rotula: _V(0, 0.14, 0), casquillos: [_V(L, 0, -A), _V(L, 0, A)] };
  return g;
}

/**
 * AMORTIGUADOR con muelle (la «pata» MacPherson): tubo de amortiguador con su
 * placa de sujeción a la mangueta, el asiento inferior y el muelle helicoidal
 * —que es lo que se ve—, el guardapolvo de fuelle sobre el vástago y la copela
 * superior con sus tres tuercas. Origen en el extremo de abajo del tubo; sube
 * +Y `largo`. La placa de la mangueta cae a −X (hacia fuera de la rueda).
 */
export function amortiguadorMuelle(mat, opts = {}) {
  const { largo = 0.75, d = 0.09, rMuelle = 0.092, vueltas = 7, hilo = 0.0165 } = opts;
  const g = new THREE.Group(), R = d / 2, L = largo;
  const Pt = mat.amort || mat.acero, Mu = mat.muelle || mat.acero;
  const tubo = new THREE.Mesh(revolucion([[0, 0], [R, 0], [R, 0], [R, L * 0.50], [R * 0.86, L * 0.52],
    [R * 0.86, L * 0.56], [0, L * 0.56]], { seg: 26 }), Pt);
  tubo.castShadow = true; g.add(tubo);
  // La placa que se atornilla a la mangueta.
  const placa = new THREE.Mesh(new THREE.BoxGeometry(0.03, L * 0.36, d * 1.55), mat.acero);
  placa.position.set(-R - 0.012, L * 0.18, 0); placa.castShadow = true; g.add(placa);
  // El asiento del muelle (abajo) y el de arriba.
  const asiento = (y) => new THREE.Mesh(revolucion([[R * 0.9, y], [rMuelle + 0.026, y], [rMuelle + 0.026, y],
    [rMuelle + 0.026, y + 0.016], [R * 0.9, y + 0.016]], { seg: 28 }), mat.acero);
  g.add(asiento(L * 0.16)); g.add(asiento(L * 0.80));
  const m = muelle({ acero: Mu }, { r: rMuelle, largo: L * 0.64 - 0.016, vueltas, hilo, seg: 16 });
  m.position.y = L * 0.16 + 0.016 + (L * 0.64 - 0.016) / 2; g.add(m);
  // El vástago cromado y el guardapolvo de fuelle (con sus pliegues).
  const va = new THREE.Mesh(new THREE.CylinderGeometry(0.016, 0.016, L * 0.34, 12), mat.cromo || mat.acero);
  va.position.y = L * 0.56 + L * 0.15; g.add(va);
  const per = [[0, L * 0.58]];
  for (let i = 0; i < 6; i++) { const y = L * 0.58 + i * L * 0.032;
    per.push([0.040, y], [0.056, y + L * 0.012], [0.040, y + L * 0.020]); }
  per.push([0.040, L * 0.80], [0, L * 0.80]);
  g.add(new THREE.Mesh(revolucion(per, { seg: 20 }), mat.negro || Pt));
  // La copela superior (goma y chapa) con sus tres tuercas.
  const cop = new THREE.Mesh(revolucion([[0, L * 0.80], [0.082, L * 0.80], [0.082, L * 0.80],
    [0.082, L * 0.86], [0.070, L * 0.895], [0.030, L * 0.905], [0.030, L * 0.935], [0, L * 0.935]], { seg: 28 }),
    mat.negro || Pt);
  cop.castShadow = true; g.add(cop);
  for (let i = 0; i < 3; i++) {
    const a = (i / 3) * Math.PI * 2;
    const t = tornilloHex(mat, { d: 0.032, largo: 0.05, arandela: false });
    t.position.set(Math.cos(a) * 0.055, L * 0.89, Math.sin(a) * 0.055); g.add(t);
  }
  g.userData = { largo, arriba: _V(0, L * 0.935, 0), placaX: -R - 0.012 };
  return g;
}

/**
 * PLATAFORMA DE BANCO: la base sobre la que se monta un conjunto de taller. No
 * es un suelo: es una bandeja de chapa con su reborde, atornillada a un marco de
 * perfil rectangular con travesaños y patas de goma. Que el montaje se apoye en
 * algo que se reconoce como un banco es lo que deja de hacerlo flotar.
 *
 * El origen es el centro de la CARA SUPERIOR; la pieza baja `alto` hasta el
 * suelo (y = −alto). Ocupa `ancho` en X y `fondo` en Z.
 */
export function plataformaBanco(mat, opts = {}) {
  const { ancho = 4.0, fondo = 2.0, alto = 0.14 } = opts;
  const g = new THREE.Group(), M = mat.bastidor || mat.acero;
  const placa = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -fondo / 2], [ancho / 2, -fondo / 2], [ancho / 2, fondo / 2], [-ancho / 2, fondo / 2]], 0.07, 4),
    { espesor: 0.035, bisel: 0.008 }), M);
  placa.rotation.x = -Math.PI / 2; placa.position.y = -0.0175; placa.receiveShadow = true;
  placa.castShadow = true; g.add(placa);
  // El reborde de ángulo, alrededor.
  for (const [w, d, x, z] of [[ancho, 0.045, 0, fondo / 2 - 0.0225], [ancho, 0.045, 0, -fondo / 2 + 0.0225],
                              [0.045, fondo - 0.09, ancho / 2 - 0.0225, 0], [0.045, fondo - 0.09, -ancho / 2 + 0.0225, 0]]) {
    const b = new THREE.Mesh(new THREE.BoxGeometry(w, 0.05, d), M);
    b.position.set(x, 0.005, z); b.castShadow = true; g.add(b);
  }
  // Los tornillos de la bandeja, en dos filas a lo largo.
  const nx = Math.max(4, Math.round(ancho / 0.38));
  for (let i = 0; i < nx; i++) for (const s of [1, -1]) {
    const t = tornilloHex(mat, { d: 0.04, largo: 0.03, arandela: true });
    t.position.set(-ancho / 2 + 0.22 + i * (ancho - 0.44) / (nx - 1), 0.0, s * (fondo / 2 - 0.15));
    t.scale.setScalar(0.8); g.add(t);
  }
  // El marco de debajo: dos largueros, tres travesaños y cuatro patas de goma.
  const hb = alto - 0.04;
  for (const s of [1, -1]) {
    const l = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.3, hb, 0.10), M);
    l.position.set(0, -0.035 - hb / 2, s * (fondo / 2 - 0.20)); l.castShadow = true; g.add(l);
  }
  for (let i = 0; i < 3; i++) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(0.10, hb * 0.8, fondo - 0.50), M);
    c.position.set(-ancho / 2 + 0.35 + i * (ancho - 0.70) / 2, -0.035 - hb * 0.4, 0); g.add(c);
  }
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.065, 0.075, 0.04, 16), mat.goma || mat.negro);
    p.position.set(sx * (ancho / 2 - 0.30), -alto + 0.02, sz * (fondo / 2 - 0.20)); g.add(p);
  }
  g.userData = { ancho, fondo, alto };
  return g;
}

/**
 * INYECTOR de alimentación superior con conector LATERAL, como el de cualquier
 * MPFI: filtro-cesta arriba, junta tórica superior que sella en la copa del
 * riel, cuerpo de acero con la torreta del conector moldeada en plástico, junta
 * tórica inferior que sella en el colector y la tobera con su placa de orificios.
 * Eje +Y, tobera en −Y; el conector sale hacia +Z.
 * `userData.puntaY` (la punta) y `userData.conector` (donde enchufa) para
 * colgar el chorro y el mazo.
 */
export function inyectorTopFeed(mat, opts = {}) {
  const { d = 0.15, largo = 0.46 } = opts;
  const R = d / 2, g = new THREE.Group(), L = largo, Zf = R * 2.65;
  const Ac = mat.acero || mat.aluminio, Pl = mat.negro || Ac, Go = mat.oring || mat.goma || Pl;
  g.add(new THREE.Mesh(revolucion([[0, L * 0.50], [R * 0.62, L * 0.50], [R * 0.62, L * 0.50],
    [R * 0.62, L * 0.42], [R * 0.80, L * 0.40], [0, L * 0.40]], { seg: 20 }), Pl));        // cesta del filtro
  const oringSup = new THREE.Mesh(new THREE.TorusGeometry(R * 0.74, R * 0.15, 8, 24), Go);
  oringSup.rotation.x = Math.PI / 2; oringSup.position.y = L * 0.36; g.add(oringSup);
  const cuerpo = new THREE.Mesh(revolucion([[0, L * 0.30], [R * 0.80, L * 0.30], [R * 0.80, L * 0.30],
    [R * 0.80, L * 0.24], [R * 0.92, L * 0.22], [R * 0.92, -L * 0.02], [R * 0.74, -L * 0.04],
    [R * 0.74, -L * 0.28], [0, -L * 0.28]], { seg: 26 }), Ac);
  cuerpo.castShadow = true; g.add(cuerpo);
  // La torreta del conector: plástico moldeado que envuelve el cuerpo y sale de lado.
  const col = new THREE.Mesh(revolucion([[0, L * 0.26], [R * 1.22, L * 0.26], [R * 1.22, L * 0.26],
    [R * 1.22, L * 0.06], [R * 1.05, L * 0.04], [0, L * 0.04]], { seg: 22 }), Pl);
  col.castShadow = true; g.add(col);
  const torre = new THREE.Mesh(extruido(contornoRedondeado(
    [[-R * 0.95, -L * 0.095], [R * 0.95, -L * 0.095], [R * 0.95, L * 0.095], [-R * 0.95, L * 0.095]], R * 0.20, 3),
    { espesor: Zf - R * 1.0, bisel: R * 0.06 }), Pl);
  torre.position.set(0, L * 0.16, (Zf + R * 1.0) / 2); torre.castShadow = true; g.add(torre);
  // El hueco del conector con sus dos pines.
  const hueco = new THREE.Mesh(new THREE.BoxGeometry(R * 1.30, L * 0.10, 0.012),
    new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.9 }));
  hueco.position.set(0, L * 0.16, Zf + 0.002); g.add(hueco);
  for (const sx of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.BoxGeometry(R * 0.14, L * 0.055, R * 0.40), mat.cobre || Ac);
    p.position.set(sx * R * 0.34, L * 0.16, Zf + R * 0.10); g.add(p);
  }
  const clip = new THREE.Mesh(new THREE.BoxGeometry(R * 0.7, L * 0.03, R * 0.9), Pl);
  clip.position.set(0, L * 0.16 + L * 0.105, R * 2.0); g.add(clip);
  const oringInf = new THREE.Mesh(new THREE.TorusGeometry(R * 0.70, R * 0.15, 8, 24), Go);
  oringInf.rotation.x = Math.PI / 2; oringInf.position.y = -L * 0.20; g.add(oringInf);
  g.add(new THREE.Mesh(revolucion([[0, -L * 0.28], [R * 0.64, -L * 0.28], [R * 0.64, -L * 0.34],
    [R * 0.50, -L * 0.40], [R * 0.44, -L * 0.48], [R * 0.44, -L * 0.50], [0, -L * 0.50]], { seg: 20 }), Ac)); // tobera
  g.userData = { puntaY: -L * 0.50, conector: _V(0, L * 0.16, Zf + R * 0.4) };
  return g;
}

/**
 * RIEL DE COMBUSTIBLE: tubo de acero inoxidable con una COPA por inyector (donde
 * encaja su junta tórica superior), el racor rápido de entrada en un extremo, el
 * alojamiento del regulador de presión en el otro, la válvula Schrader con su
 * tapón —por donde se conecta el manómetro— y las patas de sujeción.
 * Eje X, centrado; las copas miran a −Y y se inclinan `inclina` rad hacia −Z
 * (la inclinación a la que va el inyector). `userData.copas[i]` da el centro de
 * cada copa (el punto donde remata la cabeza del inyector), `userData.entrada` y
 * `userData.regulador` los extremos. Con `pata > 0` salen dos patas de esa
 * longitud hacia abajo (a `patasX` del extremo), para atornillar el riel a la culata.
 */
export function rielCombustible(mat, opts = {}) {
  const { largo = 2.6, n = 4, paso = 0.6, d = 0.15, inclina = 0, pata = 0, patasX = 0.30 } = opts;
  const g = new THREE.Group(), R = d / 2, Ac = mat.acero || mat.aluminio, Pl = mat.negro || Ac;
  const tubo = new THREE.Mesh(revolucion([[0, -largo / 2], [R, -largo / 2], [R, -largo / 2],
    [R, largo / 2], [R, largo / 2], [0, largo / 2]], { seg: 28 }), mat.cromo || Ac);
  tubo.rotation.z = -Math.PI / 2; tubo.castShadow = true; g.add(tubo);
  const copas = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * paso;
    const gr = new THREE.Group(); gr.position.set(x, 0, 0); gr.rotation.x = inclina;
    const c = new THREE.Mesh(revolucion([[R * 0.60, 0], [R * 1.05, 0], [R * 1.05, -R * 0.85],
      [R * 0.90, -R * 1.00], [R * 0.60, -R * 1.00]], { seg: 22 }), mat.cromo || Ac);
    c.castShadow = true; gr.add(c); g.add(gr);
    copas.push(_V(x, -Math.cos(inclina) * R * 1.0, -Math.sin(inclina) * R * 1.0));
  }
  // El racor rápido de entrada, con su collar y la púa donde entra la manguera.
  const ent = new THREE.Mesh(revolucion([[0, 0], [R * 0.70, 0], [R * 0.70, R * 0.60], [R * 0.95, R * 0.70],
    [R * 0.95, R * 1.20], [R * 0.60, R * 1.30], [R * 0.60, R * 1.60], [R * 0.78, R * 1.70],
    [R * 0.78, R * 2.00], [R * 0.52, R * 2.10], [R * 0.52, R * 2.50], [0, R * 2.50]], { seg: 20 }), Ac);
  ent.rotation.z = Math.PI / 2; ent.position.x = -largo / 2 - R * 0.10; g.add(ent);
  // El alojamiento del regulador, al otro extremo: un casquillo ancho con su collar.
  const reg = new THREE.Mesh(revolucion([[0, 0], [R * 1.35, 0], [R * 1.35, R * 0.30],
    [R * 1.05, R * 0.38], [R * 1.05, R * 0.85], [0, R * 0.85]], { seg: 24 }), Ac);
  reg.rotation.z = -Math.PI / 2; reg.position.x = largo / 2 + R * 0.10; reg.castShadow = true; g.add(reg);
  // La válvula Schrader: cuerpo y tapón de plástico.
  const sch = new THREE.Group(); sch.position.set(-largo / 2 + 0.42, R * 0.94, 0);
  sch.add(new THREE.Mesh(revolucion([[0, 0], [R * 0.58, 0], [R * 0.58, R * 0.40], [R * 0.36, R * 0.48],
    [R * 0.36, R * 1.05], [0, R * 1.05]], { seg: 18 }), Ac));
  const tapon = new THREE.Mesh(revolucion([[0, R * 1.05], [R * 0.46, R * 1.05], [R * 0.46, R * 1.35],
    [R * 0.36, R * 1.42], [0, R * 1.42]], { seg: 6 }), Pl);
  tapon.position.y = -R * 0.10; sch.add(tapon); g.add(sch);
  // Las patas de sujeción: un brazo, un cuello y una pestaña atornillada.
  if (pata > 0) for (const s of [-1, 1]) {
    const x = s * (largo / 2 - patasX);
    const brazo = new THREE.Mesh(new THREE.BoxGeometry(0.08, 0.035, 0.12), Ac);
    brazo.position.set(x, -R * 0.6, -0.04); g.add(brazo);
    const col = new THREE.Mesh(new THREE.CylinderGeometry(0.030, 0.030, pata, 12), Ac);
    col.position.set(x, -R * 0.6 - pata / 2, -0.10); col.castShadow = true; g.add(col);
    const pie = new THREE.Mesh(new THREE.CylinderGeometry(0.055, 0.055, 0.02, 18), Ac);
    pie.position.set(x, -R * 0.6 - pata, -0.10); g.add(pie);
  }
  g.userData = { copas, entrada: _V(-largo / 2 - R * 2.6, 0, 0), regulador: _V(largo / 2 + R * 0.95, 0, 0),
    schrader: sch };
  return g;
}

/**
 * REGULADOR DE PRESIÓN DE COMBUSTIBLE (membrana): una lata de chapa en dos
 * mitades crimpadas, con la toma de vacío —la púa de arriba— conectada al
 * colector, y el retorno al depósito saliendo de lado. Es la pieza que fija los
 * ~3,5 bar de diferencia entre el riel y el colector: el vacío de arriba le
 * resta al muelle, de ahí que la presión baje con la carga.
 * Eje +Y; el retorno sale hacia +X. `userData.vacio` es la punta de la púa.
 */
export function reguladorCombustible(mat, opts = {}) {
  const { d = 0.22, alto = 0.26 } = opts;
  const R = d / 2, g = new THREE.Group(), Ac = mat.acero || mat.aluminio, Pl = mat.negro || Ac;
  const inf = new THREE.Mesh(revolucion([[0, 0], [R * 0.72, 0], [R * 0.72, alto * 0.10], [R * 0.96, alto * 0.14],
    [R * 0.96, alto * 0.50], [R * 1.02, alto * 0.52], [R * 1.02, alto * 0.58], [0, alto * 0.58]], { seg: 32 }), Ac);
  inf.castShadow = true; g.add(inf);
  const sup = new THREE.Mesh(revolucion([[0, alto * 0.56], [R * 1.04, alto * 0.56], [R * 1.04, alto * 0.64],
    [R * 0.98, alto * 0.70], [R * 0.80, alto * 0.90], [R * 0.50, alto * 1.00], [0, alto * 1.00]], { seg: 32 }), Ac);
  sup.castShadow = true; g.add(sup);
  const nip = new THREE.Mesh(revolucion([[0, alto * 0.98], [R * 0.20, alto * 0.98], [R * 0.20, alto * 1.18],
    [R * 0.30, alto * 1.20], [R * 0.30, alto * 1.26], [R * 0.22, alto * 1.30], [R * 0.22, alto * 1.40],
    [0, alto * 1.40]], { seg: 14 }), Pl);
  g.add(nip);
  const ret = new THREE.Mesh(revolucion([[0, 0], [R * 0.30, 0], [R * 0.30, R * 0.70], [R * 0.44, R * 0.78],
    [R * 0.44, R * 1.00], [R * 0.32, R * 1.06], [R * 0.32, R * 1.60], [0, R * 1.60]], { seg: 14 }), Ac);
  ret.rotation.z = -Math.PI / 2; ret.position.set(R * 0.90, alto * 0.22, 0); g.add(ret);
  g.userData = { vacio: _V(0, alto * 1.40, 0), retorno: _V(R * 0.90 + R * 1.60, alto * 0.22, 0) };
  return g;
}

/**
 * CULATA (el tramo de admisión): el bloque de aluminio sobre el que se atornilla
 * el colector, con la boca de cada conducto —aro y fondo oscuro— y las dos
 * costillas de refrigeración de la cara delantera. El origen es el centro; la
 * cara de arriba está en y = +alto/2, y `userData.puertos` da la x de cada boca.
 * Es lo que da al colector un sitio donde asentarse.
 */
export function culataAdmision(mat, opts = {}) {
  const { largo = 2.6, fondo = 0.72, alto = 0.36, n = 4, paso = 0.6 } = opts;
  const g = new THREE.Group(), Al = mat.aluminio || mat.acero;
  const bloque = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-largo / 2, -alto / 2], [largo / 2, -alto / 2], [largo / 2, alto / 2], [-largo / 2, alto / 2]], 0.04, 4),
    { espesor: fondo, bisel: 0.015 }), 2), Al);
  bloque.castShadow = bloque.receiveShadow = true; g.add(bloque);
  const negro = mat.negro || Al, puertos = [];
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * paso; puertos.push(x);
    const aro = new THREE.Mesh(revolucion([[0.085, 0], [0.135, 0], [0.135, 0.012], [0.085, 0.012]], { seg: 24 }), mat.acero || Al);
    aro.position.set(x, alto / 2, 0); g.add(aro);
    const boca = new THREE.Mesh(new THREE.CircleGeometry(0.085, 20), new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.95 }));
    boca.rotation.x = -Math.PI / 2; boca.position.set(x, alto / 2 + 0.004, 0); g.add(boca);
    // Dos espárragos con su tuerca, a los lados de cada boca.
    for (const sz of [-1, 1]) {
      const t = tornilloHex(mat, { d: 0.034, largo: 0.012 });
      t.position.set(x, alto / 2 + 0.0, sz * 0.25); g.add(t);
    }
  }
  // Las costillas de la cara delantera (+Z).
  for (const y of [-alto * 0.22, alto * 0.14]) {
    const c = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.94, 0.03, 0.03), Al);
    c.position.set(0, y, fondo / 2 + 0.01); g.add(c);
  }
  // Las bridas de los conductos de escape, atrás: cuatro tetones redondos.
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * paso;
    const b = new THREE.Mesh(revolucion([[0.06, 0], [0.12, 0], [0.12, 0.05], [0.06, 0.05]], { seg: 20 }), negro);
    b.rotation.x = -Math.PI / 2; b.position.set(x, -alto * 0.08, -fondo / 2); g.add(b);
  }
  g.userData = { puertos, topY: alto / 2, fondo, largo };
  return g;
}

/**
 * COLECTOR DE ADMISIÓN de plástico con su plenum, sus `n` conductos curvos, la
 * brida de asiento sobre la culata y el cuerpo de mariposa en la boca del
 * plenum. Los conductos largos y curvados no son adorno: su longitud sintoniza
 * el llenado. Origen en el CENTRO DE LA BRIDA, cara de abajo (y = 0) sobre la
 * culata; el plenum queda atrás (−Z) y arriba, la mariposa a −X.
 * `userData`: `puertos` (x de cada boca), `mariposa` (el plato, para girarlo),
 * `tps` (donde monta el sensor de posición), `map` (la toma de presión),
 * `boca` (la entrada de aire).
 */
export function colectorAdmision(mat, opts = {}) {
  const { largo = 2.6, n = 4, paso = 0.6, rConducto = 0.098, hPlenum = 0.66, zPlenum = -0.50, rPlenum = 0.27 } = opts;
  const g = new THREE.Group(), Co = mat.colector || mat.negro, Al = mat.aluminio || mat.acero;
  const puertos = [];
  const brida = new THREE.Mesh(extruido(contornoRedondeado(
    [[-largo / 2, -0.20], [largo / 2, -0.20], [largo / 2, 0.20], [-largo / 2, 0.20]], 0.07, 4), {
    huecos: Array.from({ length: n }, (_, i) => circulo((i - (n - 1) / 2) * paso, 0, rConducto * 0.8, 20)),
    espesor: 0.045, bisel: 0.008 }), Co);
  brida.rotation.x = -Math.PI / 2; brida.position.y = 0.0225; brida.castShadow = true; g.add(brida);
  for (let i = 0; i <= n; i++) for (const sz of [-1, 1]) {            // la tornillería entre bocas
    const t = tornilloHex(mat, { d: 0.036, largo: 0.012 });
    t.position.set((i - n / 2) * paso, 0.045, sz * 0.15); g.add(t);
  }
  const zB = zPlenum + rPlenum * 0.7;
  for (let i = 0; i < n; i++) {
    const x = (i - (n - 1) / 2) * paso; puertos.push(x);
    const pts = [[x, 0.04, 0], [x, 0.18, 0], [x, hPlenum * 0.52, zB * 0.16], [x, hPlenum * 0.76, zB * 0.55],
      [x, hPlenum * 0.94, zB * 0.95], [x, hPlenum, zB]].map(p => _V(p[0], p[1], p[2]));
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(pts), 40, rConducto, 18, false), Co);
    t.castShadow = true; g.add(t);
    const af = new THREE.Mesh(revolucion([[rConducto * 0.8, 0], [rConducto * 1.45, 0], [rConducto * 1.08, 0.07],
      [rConducto, 0.09], [rConducto * 0.8, 0.09]], { seg: 22 }), Co);
    af.position.y = 0.045; g.add(af);                                // el abocinado del pie
  }
  // El plenum: un cilindro con las tapas abombadas, nervios y la toma de presión.
  const Lp = largo * 0.86;
  const plenum = new THREE.Mesh(revolucion([[0, -Lp / 2], [rPlenum * 0.55, -Lp / 2], [rPlenum * 0.92, -Lp / 2 + 0.07],
    [rPlenum, -Lp / 2 + 0.16], [rPlenum, Lp / 2 - 0.16], [rPlenum * 0.92, Lp / 2 - 0.07], [rPlenum * 0.55, Lp / 2],
    [0, Lp / 2]], { seg: 34 }), Co);
  plenum.rotation.z = Math.PI / 2; plenum.position.set(0, hPlenum, zPlenum); plenum.castShadow = true; g.add(plenum);
  for (let i = 0; i < 7; i++) {
    const r = new THREE.Mesh(new THREE.TorusGeometry(rPlenum * 1.005, 0.012, 6, 36), Co);
    r.rotation.y = Math.PI / 2; r.position.set(-Lp / 2 + 0.30 + i * (Lp - 0.60) / 6, hPlenum, zPlenum); g.add(r);
  }
  const mapp = new THREE.Mesh(revolucion([[0, 0], [0.050, 0], [0.050, 0.05], [0.036, 0.07], [0.036, 0.12], [0, 0.12]],
    { seg: 14 }), Co);
  mapp.position.set(-largo * 0.18, hPlenum + rPlenum * 0.96, zPlenum); g.add(mapp);
  // El cuerpo de mariposa y el manguito de goma de la entrada de aire.
  const xm = -Lp / 2 - 0.16;
  const cuerpo = new THREE.Mesh(revolucion([[0.145, -0.14], [0.205, -0.14], [0.205, -0.10], [0.16, -0.075],
    [0.16, 0.075], [0.205, 0.10], [0.205, 0.14], [0.145, 0.14]], { seg: 30 }), Al);
  cuerpo.rotation.z = Math.PI / 2; cuerpo.position.set(xm, hPlenum, zPlenum); cuerpo.castShadow = true; g.add(cuerpo);
  const plato = new THREE.Mesh(new THREE.CylinderGeometry(0.152, 0.152, 0.012, 28), mat.cromo || Al);
  plato.rotation.z = Math.PI / 2; plato.rotation.x = 0.5; plato.position.copy(cuerpo.position); g.add(plato);
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.018, 0.018, 0.44, 10), mat.acero || Al);
  eje.rotation.x = Math.PI / 2; eje.position.copy(cuerpo.position); g.add(eje);
  const manguito = new THREE.Mesh(revolucion([[0.17, 0], [0.18, 0], [0.205, 0.06], [0.185, 0.12], [0.205, 0.18],
    [0.185, 0.24], [0.205, 0.30], [0.17, 0.30]], { seg: 28 }), mat.goma || Co);
  manguito.rotation.z = Math.PI / 2; manguito.position.set(xm - 0.14, hPlenum, zPlenum);   // abre hacia −X
  g.add(manguito);
  g.userData = { puertos, mariposa: plato, tps: _V(xm, hPlenum, zPlenum + 0.24),
    map: _V(-largo * 0.18, hPlenum + rPlenum + 0.12, zPlenum),
    boca: _V(xm - 0.44, hPlenum, zPlenum), plenumY: hPlenum, plenumZ: zPlenum };
  return g;
}


/* ============================================================================
   §17-B · INSTRUMENTACIÓN Y CAMPO DE LA PUESTA A TIERRA (telurómetro, picas,
   carrete, registro, gabinete)
   ----------------------------------------------------------------------------
   El método de Wenner se hace a la intemperie con cuatro picas en línea, un
   telurómetro de campo y los carretes de cable por donde van las mediciones.
   El sistema que se mide es una varilla con su abrazadera dentro de un
   registro de concreto, unida por el conductor a la barra de tierra de un
   gabinete. Todo se dibuja como se ve en una obra: la caja amarilla del
   instrumento con sus cuatro bornas de colores, la pica de acero con su anilla
   de hincado, el carrete con su manivela, el brocal con su tapa a un lado.

   Convenio: todas estas piezas apoyan en y = 0 (el piso o la línea del
   terreno), salvo que se diga otra cosa; el frente mira a +Z.
   ========================================================================== */

/**
 * TELURÓMETRO DE CAMPO (4 terminales): la caja amarilla con esquineros de
 * goma, la pantalla de cristal líquido, el selector rotativo, el botón de
 * ensayo y, abajo, las cuatro bornas C1·P1·P2·C2 con su color. Es la pieza
 * que más se reconoce de una medición de tierras: un alumno la identifica
 * por las cuatro bornas en fila y la asa de transporte.
 *
 * Frente a +Z, origen en el centro de la base. `userData.bornas[i]` es el
 * punto (coordenadas locales) donde enchufa el cable i; `pinta(texto)` escribe
 * en la pantalla; `selector` es el grupo de la perilla (gira en su eje).
 */
export function telurometro(mat, opts = {}) {
  const { ancho = 0.62, alto = 0.34, fondo = 0.44, color = 0xc48a12,
          colores = [0xd64545, 0xc9a02c, 0x3aa86b, 0x3a7fd6],
          rotulos = ['C1', 'P1', 'P2', 'C2'] } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, D = fondo, F = D / 2;
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.52, metalness: 0.06 });
  const mN = new THREE.MeshStandardMaterial({ color: 0x14171b, roughness: 0.88, metalness: 0.04 });
  const mP = new THREE.MeshStandardMaterial({ color: 0x23282f, roughness: 0.62, metalness: 0.18 });
  const met = mat.cromo || mat.acero || mat.aluminio;
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W / 2, 0], [W / 2, 0], [W / 2, H], [-W / 2, H]], 0.05, 4), { espesor: D, bisel: 0.012 }), mC);
  cue.castShadow = cue.receiveShadow = true; g.add(cue);
  // esquineros de goma: lo que aguanta el golpe en el campo
  for (const sx of [-1, 1]) for (const sy of [0, 1]) {
    const q = new THREE.Mesh(extruido(contornoRedondeado(
      [[-0.06, -0.06], [0.06, -0.06], [0.06, 0.06], [-0.06, 0.06]], 0.025, 3),
      { espesor: D + 0.03, bisel: 0.01 }), mN);
    q.position.set(sx * (W / 2 - 0.04), sy ? H - 0.04 : 0.04, 0); q.castShadow = true; g.add(q);
  }
  // el frente: un panel oscuro, un punto hundido respecto a la caja
  const pan = new THREE.Mesh(extruido(contornoRedondeado(
    [[-W * 0.44, -H * 0.41], [W * 0.44, -H * 0.41], [W * 0.44, H * 0.41], [-W * 0.44, H * 0.41]], 0.03, 3),
    { espesor: 0.018, bisel: 0.004 }), mP);
  pan.position.set(0, H / 2, F + 0.002); g.add(pan);
  const ZF = F + 0.012;
  // pantalla LCD: marco, cristal y los dígitos
  const lw = W * 0.46, lh = H * 0.34, lx = -W * 0.22, ly = H * 0.64;
  const mar = new THREE.Mesh(extruido(contornoRedondeado(
    [[-lw / 2 - 0.012, -lh / 2 - 0.012], [lw / 2 + 0.012, -lh / 2 - 0.012], [lw / 2 + 0.012, lh / 2 + 0.012], [-lw / 2 - 0.012, lh / 2 + 0.012]], 0.012, 3),
    { espesor: 0.014, bisel: 0.003 }), mN);
  mar.position.set(lx, ly, ZF + 0.002); g.add(mar);
  const cv = document.createElement('canvas'); cv.width = 256; cv.height = Math.round(256 * lh / lw);
  const cx = cv.getContext('2d');
  const tex = new THREE.CanvasTexture(cv); tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  const pinta = (txt, unidad = 'Ω') => {
    cx.fillStyle = '#a7b89a'; cx.fillRect(0, 0, cv.width, cv.height);
    cx.fillStyle = 'rgba(40,60,40,.10)'; cx.fillRect(0, 0, cv.width, 6);
    cx.fillStyle = '#1c2a1c'; cx.textBaseline = 'middle'; cx.textAlign = 'right';
    cx.font = 'bold ' + Math.round(cv.height * 0.58) + 'px monospace';
    cx.fillText(String(txt), cv.width * 0.78, cv.height * 0.54);
    cx.textAlign = 'left'; cx.font = 'bold ' + Math.round(cv.height * 0.30) + 'px sans-serif';
    cx.fillText(unidad, cv.width * 0.80, cv.height * 0.62);
    cx.font = 'bold ' + Math.round(cv.height * 0.16) + 'px sans-serif';
    cx.fillText('4P', cv.width * 0.05, cv.height * 0.16);
    tex.needsUpdate = true;
  };
  pinta('0.00');
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(lw, lh), new THREE.MeshStandardMaterial({
    map: tex, roughness: 0.35, metalness: 0.0, emissive: 0x0d140d, emissiveMap: tex, emissiveIntensity: 0.25 }));
  lcd.position.set(lx, ly, ZF + 0.0105); g.add(lcd);
  // selector rotativo, con su corona de rótulos
  const sx = W * 0.27, sy = H * 0.62, rs = H * 0.26;
  const corona = _etiqueta(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = '#e8edf2'; c.fillStyle = '#e8edf2'; c.lineWidth = 6;
    c.font = 'bold 30px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const R0 = 100;
    ['OFF', 'R', 'ρ', 'ESC'].forEach((t, i) => {
      const a = (-130 + i * 85) * Math.PI / 180;
      c.beginPath(); c.moveTo(w / 2 + Math.sin(a) * (R0 - 14), h / 2 - Math.cos(a) * (R0 - 14));
      c.lineTo(w / 2 + Math.sin(a) * (R0 - 2), h / 2 - Math.cos(a) * (R0 - 2)); c.stroke();
      c.fillText(t, w / 2 + Math.sin(a) * (R0 + 18), h / 2 - Math.cos(a) * (R0 + 18));
    });
  });
  const cor = _tinta(corona, rs * 3.1, rs * 3.1); cor.position.set(sx, sy, ZF + 0.004); g.add(cor);
  const sel = new THREE.Group(); sel.position.set(sx, sy, ZF + 0.008); sel.rotation.x = Math.PI / 2; g.add(sel);
  const falda = new THREE.Mesh(revolucion([[0, 0], [rs * 1.12, 0], [rs * 1.12, 0.012], [rs * 0.96, 0.022], [0, 0.022]], { seg: 28 }), mN);
  sel.add(falda);
  const grip = new THREE.Mesh(revolucion([[0, 0], [rs, 0], [rs, rs * 0.5], [rs * 0.84, rs * 0.68], [0, rs * 0.68]], { seg: 28 }), mN);
  grip.position.y = 0.022; grip.castShadow = true; sel.add(grip);
  for (let i = 0; i < 12; i++) {                                   // el moleteado del canto
    const a = i / 12 * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(rs * 0.10, rs * 0.4, rs * 0.12), mP);
    m.position.set(Math.cos(a) * rs * 0.98, 0.022 + rs * 0.26, Math.sin(a) * rs * 0.98); m.rotation.y = -a; grip.add(m);
  }
  const idx = new THREE.Mesh(new THREE.BoxGeometry(rs * 0.12, rs * 0.04, rs * 0.55),
    new THREE.MeshStandardMaterial({ color: 0xf1f4f7, roughness: 0.5 }));
  idx.position.set(0, 0.022 + rs * 0.69, -rs * 0.35); sel.add(idx);
  sel.rotation.y = 0;
  // botón de ensayo y piloto
  const bt = new THREE.Mesh(revolucion([[0, 0], [H * 0.075, 0], [H * 0.075, 0.012], [H * 0.06, 0.024], [0, 0.024]], { seg: 20 }),
    new THREE.MeshStandardMaterial({ color: 0x2f9e6a, roughness: 0.45, metalness: 0.05 }));
  bt.rotation.x = Math.PI / 2; bt.position.set(W * 0.27, H * 0.33, ZF + 0.006); g.add(bt);
  // las cuatro bornas, en fila, cada una con su color y su rótulo
  const bornas = [];
  colores.forEach((col, i) => {
    const x = (-0.30 + i * 0.20) * W, y = H * 0.19;
    const b = new THREE.Group(); b.position.set(x, y, ZF); b.rotation.x = Math.PI / 2; g.add(b);
    b.add(new THREE.Mesh(revolucion([[0, 0], [0.034, 0], [0.034, 0.008], [0.026, 0.012], [0, 0.012]], { seg: 16 }), met));
    const cap = new THREE.Mesh(revolucion([[0, 0.012], [0.026, 0.012], [0.026, 0.040], [0.021, 0.050], [0.012, 0.050], [0, 0.044]], { seg: 16 }),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.08 }));
    cap.castShadow = true; b.add(cap);
    const hueco = new THREE.Mesh(new THREE.CylinderGeometry(0.008, 0.008, 0.01, 10),
      new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.8 }));
    hueco.position.y = 0.048; b.add(hueco);
    const rt = _etiqueta(128, 48, (c, w, h) => { c.clearRect(0, 0, w, h); c.fillStyle = '#e8edf2'; c.textAlign = 'center';
      c.textBaseline = 'middle'; c.font = 'bold 34px sans-serif'; c.fillText(rotulos[i] || '', w / 2, h / 2); });
    const t = _tinta(rt, 0.095, 0.095 * 48 / 128); t.position.set(x, y - 0.066, ZF + 0.003); g.add(t);
    bornas.push(_V(x, y, ZF + 0.052));
  });
  // asa de transporte
  const asa = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    _V(-W * 0.30, H, 0), _V(-W * 0.28, H + 0.09, 0), _V(0, H + 0.12, 0), _V(W * 0.28, H + 0.09, 0), _V(W * 0.30, H, 0)], false),
    24, 0.017, 8, false), mN);
  asa.castShadow = true; g.add(asa);
  // patas de goma
  for (const sx2 of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.025, 0.028, 0.012, 10), mN);
    p.position.set(sx2 * W * 0.40, 0.004, sz * D * 0.36); g.add(p);
  }
  g.userData = { ancho: W, alto: H, fondo: D, bornas, pinta, selector: sel, cv, tex, frente: ZF };
  return g;
}

/**
 * PICA DE TIERRA: la varilla de acero o de copperweld que se hinca, con su
 * PUNTA CÓNICA, su cabeza de golpeo (hongo achaflanado) o su ANILLA de
 * hincado, y —si se pide— una borna de color donde se engancha la pinza del
 * cable. Una varilla lisa con una bola encima no se reconoce; la punta y la
 * cabeza sí.
 *
 * Eje Y; el ORIGEN ESTÁ EN LA LÍNEA DEL TERRENO. `largo` es lo que mide el
 * vástago (sin punta), `sobre` lo que sobresale del suelo; la punta cónica
 * se suma por debajo. `userData.borna` es el punto de enganche del cable.
 */
export function picaTierra(mat, opts = {}) {
  const { largo = 1.4, sobre = 0.16, r = 0.04, color = 0xb87333, cabeza = 'hongo',
          borna = null, punta = 0.22 } = opts;
  const g = new THREE.Group();
  const y0 = -(largo - sobre), y1 = sobre;
  const mR = new THREE.MeshStandardMaterial({ color, roughness: 0.34, metalness: 0.88 });
  const va = new THREE.Mesh(new THREE.CylinderGeometry(r, r, largo, 18), mR);
  va.position.y = (y0 + y1) / 2; va.castShadow = true; g.add(va);
  const pu = new THREE.Mesh(new THREE.ConeGeometry(r, punta, 18), mR);
  pu.rotation.x = Math.PI; pu.position.y = y0 - punta / 2; pu.castShadow = true; g.add(pu);
  let tope = y1;
  if (cabeza === 'anilla') {
    const an = new THREE.Mesh(new THREE.TorusGeometry(r * 2.4, r * 0.55, 8, 20), mR);
    an.position.y = y1 + r * 2.4; g.add(an); tope = y1 + r * 4.8;
  } else {
    const ho = new THREE.Mesh(revolucion([[0, 0], [r, 0], [r * 1.35, r * 0.30], [r * 1.35, r * 0.85], [r * 1.05, r * 1.15], [0, r * 1.15]], { seg: 18 }),
      new THREE.MeshStandardMaterial({ color: 0x6b727a, roughness: 0.5, metalness: 0.85 }));
    ho.position.y = y1; ho.castShadow = true; g.add(ho); tope = y1 + r * 1.15;
  }
  let b = _V(0, y1 - r * 0.5, 0);
  if (borna !== null) {
    const y = y1 - r * 1.1;
    const co = new THREE.Mesh(revolucion([[r, 0], [r * 1.9, 0], [r * 1.9, r * 1.6], [r, r * 1.6]], { seg: 14 }),
      new THREE.MeshStandardMaterial({ color: borna, roughness: 0.5, metalness: 0.15 }));
    co.position.y = y; g.add(co);
    const to = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.35, r * 0.35, r * 2.6, 8), mat.acero || mat.cromo);
    to.rotation.z = Math.PI / 2; to.position.set(r * 1.1, y + r * 0.8, 0); g.add(to);
    b = _V(r * 1.7, y + r * 0.8, 0);
  }
  g.userData = { largo, sobre, r, tope, borna: b };
  return g;
}

/**
 * ABRAZADERA DE TIERRA (tipo GR): el anillo de bronce que muerde la varilla,
 * su cuña lateral con el tornillo de cabeza hexagonal y el conductor de cobre
 * que sale por un lado. Eje Y (el de la varilla). `userData.salida` es donde
 * nace el conductor.
 */
export function abrazaderaTierra(mat, opts = {}) {
  const { r = 0.04, color = 0xb88a3c } = opts;
  const g = new THREE.Group();
  const mB = new THREE.MeshStandardMaterial({ color, roughness: 0.36, metalness: 0.85 });
  const R = r * 1.9, h = r * 2.4;
  const anillo = new THREE.Mesh(extruido(contornoRedondeado(
    [[-R, -R * 0.82], [R, -R * 0.82], [R, R * 0.82], [-R, R * 0.82]], R * 0.35, 4),
    { huecos: [circulo(0, 0, r * 1.02, 24)], espesor: h, bisel: 0.004 }), mB);
  anillo.rotation.x = -Math.PI / 2; anillo.castShadow = true; g.add(anillo);
  const lug = new THREE.Mesh(extruido(contornoRedondeado(
    [[R * 0.7, -R * 0.55], [R * 1.75, -R * 0.55], [R * 1.75, R * 0.55], [R * 0.7, R * 0.55]], R * 0.25, 3),
    { espesor: h * 0.8, bisel: 0.004 }), mB);
  lug.rotation.x = -Math.PI / 2; lug.castShadow = true; g.add(lug);
  const tor = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.62, r * 0.62, r * 0.55, 6), mB);
  tor.position.set(R * 1.25, h * 0.5 + r * 0.25, 0); tor.castShadow = true; g.add(tor);
  const ro = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.88, r * 0.88, r * 0.14, 14), mat.acero || mB);
  ro.position.set(R * 1.25, h * 0.4 + r * 0.04, 0); g.add(ro);
  const cu = new THREE.Mesh(new THREE.CylinderGeometry(r * 0.46, r * 0.46, r * 1.6, 12),
    new THREE.MeshStandardMaterial({ color: 0xc0703a, roughness: 0.3, metalness: 0.9 }));
  cu.rotation.z = Math.PI / 2; cu.position.set(R * 1.75 + r * 0.7, 0, 0); g.add(cu);
  g.userData = { R, h, salida: _V(R * 1.75 + r * 1.5, 0, 0) };
  return g;
}

/**
 * CARRETE DE CABLE de campo: dos platos con su borde, el cable enrollado a la
 * vista (con sus vueltas), el eje, la MANIVELA y el soporte con asa. Se usa
 * para tender los cables de medida hasta cada pica. Eje en Z; origen en el
 * centro de la base. `userData.punta` es la salida del cable.
 */
export function carreteCable(mat, opts = {}) {
  const { d = 0.46, ancho = 0.20, color = 0xd64545 } = opts;
  const g = new THREE.Group();
  const R = d / 2, hub = R * 0.26, yc = R + 0.045;
  const mP = new THREE.MeshStandardMaterial({ color: 0x2b3038, roughness: 0.6, metalness: 0.35 });
  const mN = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.85, metalness: 0.05 });
  const met = mat.cromo || mat.acero || mat.aluminio;
  const rueda = new THREE.Group(); rueda.position.y = yc; g.add(rueda);
  for (const s of [-1, 1]) {
    const pl = new THREE.Mesh(revolucion([[hub, 0], [R * 0.96, 0], [R, 0.010], [R, 0.026], [R * 0.94, 0.026],
      [R * 0.90, 0.012], [hub, 0.012]], { seg: 40 }), mP);
    pl.rotation.x = Math.PI / 2; pl.position.z = s * ancho / 2 - (s > 0 ? 0.0 : 0.026); pl.castShadow = true; rueda.add(pl);
  }
  const tx = _etiqueta(256, 256, (c, w, h) => { c.fillStyle = '#' + new THREE.Color(color).getHexString(); c.fillRect(0, 0, w, h);
    c.fillStyle = 'rgba(0,0,0,.28)'; for (let i = 0; i < 16; i++) c.fillRect(0, i * 16 + 13, w, 3); });
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(1, 1);
  const cab = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.80, R * 0.80, ancho - 0.02, 36),
    new THREE.MeshStandardMaterial({ color: 0xffffff, map: tx, roughness: 0.7, metalness: 0.02 }));
  cab.rotation.x = Math.PI / 2; cab.castShadow = true; rueda.add(cab);
  const nu = new THREE.Mesh(new THREE.CylinderGeometry(hub, hub, ancho + 0.07, 18), met);
  nu.rotation.x = Math.PI / 2; rueda.add(nu);
  // manivela: brazo y empuñadura, del lado +Z
  const br = new THREE.Mesh(new THREE.BoxGeometry(0.022, R * 0.78, 0.014), met);
  br.position.set(0, R * 0.39, ancho / 2 + 0.050); rueda.add(br);
  const em = new THREE.Mesh(new THREE.CylinderGeometry(0.020, 0.020, 0.07, 10), mN);
  em.rotation.x = Math.PI / 2; em.position.set(0, R * 0.78, ancho / 2 + 0.085); rueda.add(em);
  // soporte: dos montantes, una barra de base y el asa
  for (const s of [-1, 1]) {
    const mo = new THREE.Mesh(new THREE.BoxGeometry(0.022, yc + 0.015, 0.028), mP);
    mo.position.set(0, (yc + 0.015) / 2, s * (ancho / 2 + 0.075)); mo.castShadow = true; g.add(mo);
    const pie = new THREE.Mesh(new THREE.BoxGeometry(d * 0.80, 0.022, 0.032), mP);
    pie.position.set(0, 0.011, s * (ancho / 2 + 0.075)); pie.castShadow = true; g.add(pie);
  }
  const asa = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3([
    _V(0, yc + R * 0.55, -(ancho / 2 + 0.075)), _V(0, yc + R * 1.08, -ancho * 0.25),
    _V(0, yc + R * 1.08, ancho * 0.25), _V(0, yc + R * 0.55, ancho / 2 + 0.075)], false), 20, 0.011, 6, false), mN);
  g.add(asa);
  g.userData = { rueda, punta: _V(R * 0.80, yc, -ancho * 0.1), R, yc };
  return g;
}

/**
 * REGISTRO DE TIERRA: el brocal de concreto por donde se llega a la cabeza de
 * la varilla para medir o revisar la conexión, con su MARCO de acero y su TAPA
 * apoyada de canto contra un lado (con el símbolo de tierra). Con `corte` el
 * frente queda abierto —un corte de taller— y se ve por dentro.
 * Apoya en y = 0; el frente abierto mira a +Z. `userData.interior` da el
 * centro y el ancho libre.
 */
export function registroTierra(mat, opts = {}) {
  const { ancho = 0.60, fondo = 0.50, alto = 0.26, pared = 0.07, corte = true, tapa = true } = opts;
  const g = new THREE.Group();
  const tx = _etiqueta(128, 128, (c, w, h) => { c.fillStyle = '#9a9ca0'; c.fillRect(0, 0, w, h);
    const r = (() => { let s = 7; return () => (s = (s * 1664525 + 1013904223) >>> 0) / 4294967296; })();
    for (let i = 0; i < 160; i++) { c.fillStyle = r() < 0.5 ? 'rgba(70,72,78,.14)' : 'rgba(210,212,216,.14)';
      c.beginPath(); c.arc(r() * w, r() * h, 2 + r() * 7, 0, 7); c.fill(); } });
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping;
  const mH = new THREE.MeshStandardMaterial({ color: 0xffffff, map: tx, roughness: 0.94, metalness: 0.0 });
  const W = ancho, D = fondo, p = pared;
  const U = corte
    ? [[-W / 2, D / 2], [-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [W / 2 - p, D / 2], [W / 2 - p, -D / 2 + p], [-W / 2 + p, -D / 2 + p], [-W / 2 + p, D / 2]]
    : null;
  const geo = corte
    ? extruido(U.map(([x, z]) => [x, -z]), { espesor: alto, bisel: 0.006, curvaSeg: 2 })
    : extruido([[-W / 2, -D / 2], [W / 2, -D / 2], [W / 2, D / 2], [-W / 2, D / 2]],
        { huecos: [[[-W / 2 + p, -D / 2 + p], [W / 2 - p, -D / 2 + p], [W / 2 - p, D / 2 - p], [-W / 2 + p, D / 2 - p]]], espesor: alto, bisel: 0.006, curvaSeg: 2 });
  normalizaUV(geo, 1);
  const bro = new THREE.Mesh(geo, mH);
  bro.rotation.x = -Math.PI / 2; bro.position.y = alto / 2; bro.castShadow = bro.receiveShadow = true; g.add(bro);
  // marco de acero en la boca
  const mA = new THREE.MeshStandardMaterial({ color: 0x3a4048, roughness: 0.5, metalness: 0.8 });
  const mar = new THREE.Mesh(extruido(corte
    ? [[-W / 2 - 0.012, D / 2], [-W / 2 - 0.012, -D / 2 - 0.012], [W / 2 + 0.012, -D / 2 - 0.012], [W / 2 + 0.012, D / 2], [W / 2 - p * 0.45, D / 2], [W / 2 - p * 0.45, -D / 2 + p * 0.45], [-W / 2 + p * 0.45, -D / 2 + p * 0.45], [-W / 2 + p * 0.45, D / 2]].map(([x, z]) => [x, -z])
    : [[-W / 2 - 0.012, -D / 2 - 0.012], [W / 2 + 0.012, -D / 2 - 0.012], [W / 2 + 0.012, D / 2 + 0.012], [-W / 2 - 0.012, D / 2 + 0.012]],
    { huecos: corte ? [] : [[[-W / 2 + p * 0.45, -D / 2 + p * 0.45], [W / 2 - p * 0.45, -D / 2 + p * 0.45], [W / 2 - p * 0.45, D / 2 - p * 0.45], [-W / 2 + p * 0.45, D / 2 - p * 0.45]]],
      espesor: 0.022, bisel: 0.004, curvaSeg: 2 }), mA);
  mar.rotation.x = -Math.PI / 2; mar.position.y = alto + 0.002; g.add(mar);
  let lid = null;
  if (tapa) {
    lid = new THREE.Group();
    const pl = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W / 2, -W / 2], [W / 2, -W / 2], [W / 2, W / 2], [-W / 2, W / 2]], 0.03, 3), { espesor: 0.045, bisel: 0.006 }), mA);
    pl.rotation.x = -Math.PI / 2; pl.castShadow = true; lid.add(pl);
    const ts = _etiqueta(128, 128, (c, w, h) => { c.clearRect(0, 0, w, h); c.strokeStyle = '#e6c15a'; c.fillStyle = '#e6c15a';
      c.lineWidth = 9; c.beginPath(); c.moveTo(64, 20); c.lineTo(64, 66); c.stroke();
      for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(64 - (46 - i * 14), 70 + i * 16); c.lineTo(64 + (46 - i * 14), 70 + i * 16); c.stroke(); } });
    const t = _tinta(ts, W * 0.5, W * 0.5); t.rotation.x = -Math.PI / 2; t.position.y = 0.0245; lid.add(t);
    for (const s of [-1, 1]) {
      const tor = new THREE.Mesh(new THREE.CylinderGeometry(0.012, 0.012, 0.012, 8), mat.acero || mA);
      tor.position.set(s * W * 0.36, 0.027, W * 0.36); lid.add(tor);
    }
    const a = Math.asin(Math.min(0.95, alto / W));
    lid.rotation.x = -a; lid.position.set(0, alto * 0.5 + 0.03, -D / 2 - W / 2 * Math.cos(a) - 0.01);
    g.add(lid);
  }
  g.userData = { ancho: W, fondo: D, alto, interior: { ancho: W - 2 * p, fondo: D - p }, tapa: lid };
  return g;
}

/**
 * GABINETE ELÉCTRICO de chapa: la caja con su borde doblado, la PLACA DE
 * MONTAJE naranja galvanizada al fondo —donde se atornillan rieles, bornes y
 * aparatos— y la PUERTA con su manija, abierta el ángulo que se pida. El
 * prensaestopa del fondo es por donde entra el cable.
 * Apoya en y = 0, frente a +Z, centrado en X y en Z.
 * `userData.placa` = z de la cara de la placa; `puerta` = el grupo que gira.
 */
export function gabinete(mat, opts = {}) {
  const { ancho = 0.9, alto = 1.35, fondo = 0.38, apertura = 1.7, color = 0x8c949b,
          colorPlaca = 0xc4701a, pared = 0.022, puerta = true } = opts;
  const g = new THREE.Group();
  const mG = new THREE.MeshStandardMaterial({ color, roughness: 0.46, metalness: 0.3 });
  const mI = new THREE.MeshStandardMaterial({ color: 0xaab0b6, roughness: 0.55, metalness: 0.3 });
  const mO = new THREE.MeshStandardMaterial({ color: colorPlaca, roughness: 0.42, metalness: 0.55 });
  const mN = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.8, metalness: 0.1 });
  const W = ancho, H = alto, D = fondo, p = pared;
  const caja = (w, h, d, x, y, z, m) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), m); b.position.set(x, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  caja(W, H, p, 0, H / 2, -D / 2 + p / 2, mI);                              // fondo
  caja(p, H, D, -W / 2 + p / 2, H / 2, 0, mG); caja(p, H, D, W / 2 - p / 2, H / 2, 0, mG);
  caja(W, p, D, 0, H - p / 2, 0, mG); caja(W, p, D, 0, p / 2, 0, mG);       // techo y piso
  const labio = (w, h, x, y) => caja(w, h, 0.012, x, y, D / 2 - 0.006, mG);  // el borde doblado del frente
  labio(W, 0.03, 0, H - 0.015); labio(W, 0.03, 0, 0.015); labio(0.03, H, -W / 2 + 0.015, H / 2); labio(0.03, H, W / 2 - 0.015, H / 2);
  const zP = -D / 2 + p + 0.012;
  caja(W - 2 * p - 0.05, H - 2 * p - 0.06, 0.012, 0, H / 2, zP - 0.006, mO);  // placa de montaje
  for (const [x, y] of [[-1, 1], [1, 1], [-1, -1], [1, -1]]) {               // sus tornillos de sujeción
    const t = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.01, 8), mat.acero || mI);
    t.rotation.x = Math.PI / 2; t.position.set(x * (W / 2 - p - 0.045), H / 2 + y * (H / 2 - p - 0.05), zP + 0.003); g.add(t);
  }
  for (const x of [-0.16, 0.16]) {                                           // prensaestopas del piso
    const pe = new THREE.Mesh(revolucion([[0, 0], [0.034, 0], [0.034, 0.012], [0.026, 0.026], [0.026, 0.045], [0, 0.045]], { seg: 14 }), mN);
    pe.position.set(x, -0.045, 0); g.add(pe);
  }
  let door = null;
  if (puerta) {
    door = new THREE.Group(); door.position.set(W / 2 - 0.004, 0, D / 2 + 0.01); g.add(door);
    const pa = new THREE.Mesh(extruido(contornoRedondeado(
      [[-W + 0.01, 0.02], [0, 0.02], [0, H - 0.02], [-W + 0.01, H - 0.02]], 0.01, 3), { espesor: 0.02, bisel: 0.004 }), mG);
    pa.castShadow = true; door.add(pa);
    const ma = new THREE.Mesh(new THREE.BoxGeometry(0.04, 0.16, 0.025), mN);
    ma.position.set(-W + 0.07, H * 0.5, 0.022); door.add(ma);
    const bi = new THREE.Mesh(new THREE.CylinderGeometry(0.014, 0.014, 0.09, 8), mat.acero || mI);
    bi.position.set(0.004, H * 0.2, 0); door.add(bi);
    const bi2 = bi.clone(); bi2.position.y = H * 0.8; door.add(bi2);
    door.rotation.y = apertura;
  }
  g.userData = { ancho: W, alto: H, fondo: D, placa: zP, puerta: door };
  return g;
}



/* ============================================================================
   §17-B (cont.) · TABLERO DE MANDO Y FUERZA: contactor, relé térmico, enclavamiento,
   botonera, regleta de bornes, riel DIN y canaleta
   ----------------------------------------------------------------------------
   Lo que se ve al abrir un tablero de arranque de motores: los aparatos van
   enganchados a un riel DIN, los bornes de potencia arriba (1/L1·3/L2·5/L3) y
   abajo (2/T1·4/T2·6/T3), los cables corren por canaletas ranuradas y el motor
   se arranca desde una botonera. Convenio de estas piezas: frente a +Z, origen
   en el centro del cuerpo y arriba +Y; el riel y la canaleta tienen su eje en X
   y su «altura» sale hacia +Z (es decir, vienen listos para pegarse a un panel
   vertical).
   ========================================================================== */

/** Cuerpo de aparato modular con escalones: un nivel central ancho y los dos
 *  niveles de bornes, más retirados. El perfil se extruye a lo ancho. */
function _cuerpoEscalonado(mat, W, H, F, mC, ret = 0.76) {
  const perfil = [[-F, -H / 2], [F * ret, -H / 2], [F * ret, -0.26 * H], [F, -0.26 * H], [F, 0.14 * H],
                  [F * ret, 0.14 * H], [F * ret, H / 2], [-F, H / 2]];
  const cue = new THREE.Mesh(extruido(contornoRedondeado(perfil.map(([z, y]) => [-z, y]), 0.012, 2),
    { espesor: W, bisel: 0.006, curvaSeg: 2 }), mC);
  cue.rotation.y = Math.PI / 2; cue.castShadow = cue.receiveShadow = true;
  return cue;
}
/** Borne de tornillo de potencia: la jaula, la cabeza ranurada y el hueco por donde entra el cable. */
function _bornePotencia(mat, ancho = 0.07) {
  const g = new THREE.Group();
  const mJ = new THREE.MeshStandardMaterial({ color: 0x8a9199, roughness: 0.42, metalness: 0.75 });
  const mO = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.8, metalness: 0.1 });
  const ja = new THREE.Mesh(new THREE.BoxGeometry(ancho, ancho * 1.05, ancho * 0.62), mJ);
  ja.castShadow = true; g.add(ja);
  const hu = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.64, ancho * 0.36, ancho * 0.05), mO);
  hu.position.set(0, -ancho * 0.28, ancho * 0.31); g.add(hu);
  const tor = new THREE.Mesh(revolucion([[0, 0], [ancho * 0.26, 0], [ancho * 0.26, ancho * 0.07], [ancho * 0.20, ancho * 0.12], [0, ancho * 0.12]], { seg: 14 }),
    new THREE.MeshStandardMaterial({ color: 0xcdd3d9, roughness: 0.32, metalness: 0.85 }));
  tor.rotation.x = Math.PI / 2; tor.position.set(0, ancho * 0.18, ancho * 0.31); g.add(tor);
  const ra = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.40, ancho * 0.05, ancho * 0.03), mO);
  ra.position.set(0, ancho * 0.18, ancho * 0.45); ra.rotation.z = 0.45; g.add(ra);
  return g;
}
const _rotuloIEC = (g, txt, x, y, z, w = 0.075, tam = 34, col = '#e8edf2') => {
  const tx = _etiqueta(128, 48, (c, ww, hh) => { c.clearRect(0, 0, ww, hh); c.fillStyle = col; c.textAlign = 'center';
    c.textBaseline = 'middle'; c.font = 'bold ' + tam + 'px sans-serif'; c.fillText(txt, ww / 2, hh / 2); });
  const t = _tinta(tx, w, w * 48 / 128); t.position.set(x, y, z); g.add(t); return t;
};

/**
 * CONTACTOR TRIPOLAR IEC: el cuerpo escalonado de baquelita negra con sus tres
 * bornes de potencia arriba (1/L1 3/L2 5/L3) y abajo (2/T1 4/T2 6/T3), la
 * ventana por donde se ve la BOBINA con su núcleo, la placa con el nombre del
 * aparato, el piloto de bobina energizada y, si se pide, el bloque de
 * CONTACTOS AUXILIARES (NA/NC) a un lado. El tacón de abajo es el que engancha
 * al riel DIN. Frente a +Z.
 *
 * `aux`: 0 sin bloque, 1 a la derecha, −1 a la izquierda. `userData.led` es el
 * piloto (material propio: el laboratorio lo enciende cuando hay corriente en la
 * bobina); `sup[i]`/`inf[i]` son los puntos de enganche de los cables de
 * potencia y `bornasAux[k]` los del bloque auxiliar.
 */
export function contactorTripolar(mat, opts = {}) {
  const { ancho = 0.34, alto = 0.46, fondo = 0.26, rotulo = 'KM1', ledColor = 0x43D9AD, aux = 1, color = 0x262b32 } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, F = fondo / 2;
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.62, metalness: 0.08 });
  const mP = new THREE.MeshStandardMaterial({ color: 0x3a4149, roughness: 0.6, metalness: 0.1 });
  g.add(_cuerpoEscalonado(mat, W, H, F, mC));
  const ZF = F + 0.001;
  // ventana de la bobina: fondo oscuro con la bobina de cobre y la armadura vistas por dentro
  const ww = W * 0.54, wh = H * 0.20, wx = -W * 0.14, wy = -0.06 * H;
  const marco = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ww / 2 - 0.01, -wh / 2 - 0.01], [ww / 2 + 0.01, -wh / 2 - 0.01], [ww / 2 + 0.01, wh / 2 + 0.01], [-ww / 2 - 0.01, wh / 2 + 0.01]], 0.01, 2),
    { espesor: 0.012, bisel: 0.003, curvaSeg: 2 }), mP);
  marco.position.set(wx, wy, ZF + 0.004); g.add(marco);
  const dentro = _etiqueta(256, Math.round(256 * wh / ww), (c, w, h) => {
    c.fillStyle = '#0b0e12'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#6a737c'; c.fillRect(w * 0.06, h * 0.12, w * 0.20, h * 0.76);          // núcleo (E)
    c.fillStyle = '#6a737c'; c.fillRect(w * 0.74, h * 0.12, w * 0.20, h * 0.76);           // armadura
    for (let i = 0; i < 9; i++) { c.fillStyle = i % 2 ? '#b8692f' : '#d58a45'; c.fillRect(w * 0.28, h * (0.18 + i * 0.075), w * 0.44, h * 0.062); } // bobina
    c.fillStyle = 'rgba(255,255,255,.07)'; c.fillRect(0, 0, w, h * 0.18);
  });
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshStandardMaterial({ map: dentro, roughness: 0.4, metalness: 0.1 }));
  vent.position.set(wx, wy, ZF + 0.0105); g.add(vent);
  const cris = new THREE.Mesh(new THREE.PlaneGeometry(ww, wh), new THREE.MeshStandardMaterial({
    color: 0xa8d4f0, transparent: true, opacity: 0.10, roughness: 0.08, metalness: 0.0, depthWrite: false }));
  cris.position.set(wx, wy, ZF + 0.0125); cris.renderOrder = 3; g.add(cris);
  // placa con el nombre
  const pl = _etiqueta(256, 64, (c, w, h) => { c.fillStyle = '#d9dde2'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#14181e'; c.textAlign = 'left'; c.textBaseline = 'middle'; c.font = 'bold 40px sans-serif'; c.fillText(rotulo, 14, h / 2);
    c.textAlign = 'right'; c.font = 'bold 20px sans-serif'; c.fillText('3P · 25 A · 24 V~', w - 12, h * 0.34); c.fillText('AC-3 · IEC 60947-4-1', w - 12, h * 0.72); });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.84, W * 0.84 * 64 / 256), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5, metalness: 0.0 }));
  placa.position.set(0, -0.20 * H, ZF + 0.0015); g.add(placa);
  // piloto de bobina (material propio, apagado por defecto)
  const led = new THREE.Mesh(new THREE.SphereGeometry(0.022, 14, 10), new THREE.MeshStandardMaterial({
    color: ledColor, emissive: ledColor, emissiveIntensity: 0.05, roughness: 0.35, metalness: 0.1 }));
  led.position.set(W * 0.31, wy, ZF + 0.008); led.scale.z = 0.5; g.add(led);
  // bornes de potencia: arriba y abajo, tres cada lado
  const sup = [], inf = [];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * W * 0.30;
    const bs = _bornePotencia(mat, 0.075); bs.position.set(x, 0.32 * H, F * 0.76 + 0.023); g.add(bs);
    const bi = _bornePotencia(mat, 0.075); bi.position.set(x, -0.355 * H, F * 0.76 + 0.023); g.add(bi);
    _rotuloIEC(g, `${2 * i + 1}/L${i + 1}`, x, 0.47 * H, F * 0.76 + 0.001, 0.085, 28);
    _rotuloIEC(g, `${2 * i + 2}/T${i + 1}`, x, -0.468 * H, F * 0.76 + 0.001, 0.085, 28);
    sup.push(_V(x, 0.38 * H, F * 0.76 + 0.055)); inf.push(_V(x, -0.41 * H, F * 0.76 + 0.055));
  }
  // tacón del riel DIN
  const tac = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, 0.032, 0.03), new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.5, metalness: 0.3 }));
  tac.position.set(0, -H / 2 + 0.018, -F - 0.012); g.add(tac);
  // bloque de contactos auxiliares, enganchado al costado
  const bornasAux = [];
  if (aux) {
    const s = aux > 0 ? 1 : -1;
    const ab = new THREE.Mesh(extruido(contornoRedondeado([[-F * 0.55, -0.26 * H], [F, -0.26 * H], [F, 0.14 * H], [-F * 0.55, 0.14 * H]].map(([z, y]) => [-z, y]), 0.008, 2),
      { espesor: 0.09, bisel: 0.004, curvaSeg: 2 }), new THREE.MeshStandardMaterial({ color: 0x3b4c5e, roughness: 0.6, metalness: 0.08 }));
    ab.rotation.y = Math.PI / 2; ab.position.x = s * (W / 2 + 0.045); ab.castShadow = true; g.add(ab);
    [[-0.03, 0.045], [0.03, 0.045], [-0.03, -0.03], [0.03, -0.03]].forEach(([dx, dy], k) => {
      const tt = new THREE.Mesh(revolucion([[0, 0], [0.016, 0], [0.016, 0.006], [0.012, 0.009], [0, 0.009]], { seg: 10 }),
        new THREE.MeshStandardMaterial({ color: 0xcdd3d9, roughness: 0.32, metalness: 0.85 }));
      tt.rotation.x = Math.PI / 2; tt.position.set(s * (W / 2 + 0.045) + dx, dy * H * 1.2 - 0.02 * H, F + 0.001); g.add(tt);
      bornasAux.push(_V(s * (W / 2 + 0.045) + dx, dy * H * 1.2 - 0.02 * H, F + 0.012));
    });
    _rotuloIEC(g, 'NC · NA', s * (W / 2 + 0.045), 0.10 * H, F + 0.0015, 0.10, 28);
  }
  g.userData = { ancho: W, alto: H, fondo: fondo, led, sup, inf, bornasAux, frente: F };
  return g;
}

/**
 * BLOQUE DE ENCLAVAMIENTO MECÁNICO: la pieza que se engancha ENTRE los dos
 * contactores de un arrancador reversible. Lleva un BALANCÍN pivotado en el
 * centro: cuando un contactor cierra empuja un extremo y el otro queda
 * bloqueado, de modo que ni con la bobina energizada puedan cerrar los dos a la
 * vez. Por eso se pone aunque ya exista el enclavamiento eléctrico. Frente a +Z.
 * `userData.balancin` es el grupo que gira (eje Z).
 */
export function enclavamientoMecanico(mat, opts = {}) {
  const { ancho = 0.52, alto = 0.18, fondo = 0.14 } = opts;
  const g = new THREE.Group();
  const mC = new THREE.MeshStandardMaterial({ color: 0x353c45, roughness: 0.6, metalness: 0.1 });
  const mY = new THREE.MeshStandardMaterial({ color: 0xc9a02c, roughness: 0.5, metalness: 0.2 });
  const met = mat.cromo || mat.acero || mat.aluminio;
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -alto / 2], [ancho / 2, -alto / 2], [ancho / 2, alto / 2], [-ancho / 2, alto / 2]], 0.02, 3),
    { espesor: fondo, bisel: 0.008 }), mC);
  cue.castShadow = true; g.add(cue);
  for (const s of [-1, 1]) {                                     // las orejas que se clavan en cada contactor
    const o = new THREE.Mesh(new THREE.BoxGeometry(0.06, alto * 0.55, fondo * 0.7), mY);
    o.position.set(s * (ancho / 2 + 0.002), 0, 0); g.add(o);
  }
  const ventana = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.60, alto * 0.50, 0.006), new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.8 }));
  ventana.position.set(0, 0, fondo / 2 + 0.001); g.add(ventana);
  const bal = new THREE.Group(); bal.position.set(0, 0, fondo / 2 + 0.012); g.add(bal);
  const bar = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.54, alto * 0.14, 0.014), met);
  bar.castShadow = true; bal.add(bar);
  for (const s of [-1, 1]) {
    const d = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.10, alto * 0.10, 0.016, 12), mY);
    d.rotation.x = Math.PI / 2; d.position.set(s * ancho * 0.25, 0, 0.002); bal.add(d);
  }
  const pi = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.07, alto * 0.07, 0.022, 10), met);
  pi.rotation.x = Math.PI / 2; pi.position.z = 0.004; bal.add(pi);
  bal.rotation.z = 0.10;
  g.userData = { ancho, alto, fondo, balancin: bal };
  return g;
}

/**
 * RELÉ TÉRMICO DE SOBRECARGA: los tres bornes de entrada arriba (1/L1·3/L2·5/L3
 * que se atornillan al contactor) y los tres de salida abajo (al motor), el DIAL
 * de regulación con su escala y su aguja, el botón azul de rearme/prueba y el rojo
 * de paro. El dial es lo que lo distingue de cualquier otra caja del riel.
 * La escala va de `escala[0]` a `escala[1]` y la aguja gira alrededor de su
 * centro desde +X (rotation.z de −0,9 a +0,9 rad cubre la escala completa).
 * `userData.needle` es la aguja.
 */
export function releTermico(mat, opts = {}) {
  const { ancho = 0.40, alto = 0.34, fondo = 0.20, rotulo = 'F1', escala = [4, 8] } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, F = fondo / 2;
  const mC = new THREE.MeshStandardMaterial({ color: 0x3f4852, roughness: 0.6, metalness: 0.1 });
  g.add(_cuerpoEscalonado(mat, W, H, F, mC, 0.74));
  const ZF = F + 0.001;
  const dr = H * 0.19, dx = -W * 0.12, dy = -0.05 * H;
  const disco = new THREE.Mesh(revolucion([[0, 0], [dr * 1.12, 0], [dr * 1.12, 0.010], [dr, 0.014], [0, 0.014]], { seg: 32 }),
    new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.7, metalness: 0.1 }));
  disco.rotation.x = Math.PI / 2; disco.position.set(dx, dy, ZF); g.add(disco);
  const esc = _etiqueta(256, 256, (c, w, h) => {
    c.clearRect(0, 0, w, h); c.strokeStyle = '#e8edf2'; c.fillStyle = '#e8edf2'; c.lineWidth = 5;
    c.font = 'bold 26px sans-serif'; c.textAlign = 'center'; c.textBaseline = 'middle';
    for (let i = 0; i <= 4; i++) {
      const a = (-0.9 + i * 0.45);
      const R0 = 104;
      c.beginPath(); c.moveTo(w / 2 + Math.cos(a) * (R0 - 16), h / 2 - Math.sin(a) * (R0 - 16));
      c.lineTo(w / 2 + Math.cos(a) * (R0 - 2), h / 2 - Math.sin(a) * (R0 - 2)); c.stroke();
      c.fillText(String(escala[0] + i * (escala[1] - escala[0]) / 4), w / 2 + Math.cos(a) * (R0 - 36), h / 2 - Math.sin(a) * (R0 - 36));
    }
    c.font = 'bold 22px sans-serif'; c.fillText('×In', w * 0.30, h * 0.58);
  });
  const tinta = _tinta(esc, dr * 2.0, dr * 2.0); tinta.position.set(dx, dy, ZF + 0.0145); g.add(tinta);
  const ndGeo = new THREE.BoxGeometry(dr * 0.86, 0.008, 0.006); ndGeo.translate(dr * 0.43, 0, 0);
  const needle = new THREE.Mesh(ndGeo, new THREE.MeshStandardMaterial({ color: 0xd64545, roughness: 0.45, metalness: 0.3, emissive: 0x4a0e0e, emissiveIntensity: 0.12 }));
  needle.position.set(dx, dy, ZF + 0.018); g.add(needle);
  const eje = new THREE.Mesh(new THREE.CylinderGeometry(0.011, 0.011, 0.012, 10), mat.acero || mat.cromo);
  eje.rotation.x = Math.PI / 2; eje.position.set(dx, dy, ZF + 0.017); g.add(eje);
  // pulsadores: azul (rearme / prueba) y rojo (paro)
  [[W * 0.26, dy + H * 0.09, 0x2457b0, 0.05], [W * 0.26, dy - H * 0.09, 0xb83a3a, 0.04]].forEach(([x, y, col, r]) => {
    const b = new THREE.Mesh(revolucion([[0, 0], [r, 0], [r, 0.012], [r * 0.82, 0.020], [0, 0.020]], { seg: 18 }),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.45, metalness: 0.05 }));
    b.rotation.x = Math.PI / 2; b.position.set(x, y, ZF); g.add(b);
  });
  _rotuloIEC(g, rotulo, W * 0.26, dy + H * 0.20, ZF + 0.001, 0.07, 30);
  const sup = [], inf = [];
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * W * 0.30;
    const bs = _bornePotencia(mat, 0.075); bs.position.set(x, 0.32 * H, F * 0.74 + 0.023); g.add(bs);
    const bi = _bornePotencia(mat, 0.075); bi.position.set(x, -0.355 * H, F * 0.74 + 0.023); g.add(bi);
    _rotuloIEC(g, `${2 * i + 1}/L${i + 1}`, x, 0.47 * H, F * 0.74 + 0.001, 0.085, 28);
    _rotuloIEC(g, `${2 * i + 2}/T${i + 1}`, x, -0.468 * H, F * 0.74 + 0.001, 0.085, 28);
    sup.push(_V(x, 0.38 * H, F * 0.74 + 0.055)); inf.push(_V(x, -0.41 * H, F * 0.74 + 0.055));
  }
  const tac = new THREE.Mesh(new THREE.BoxGeometry(W * 0.62, 0.032, 0.03), new THREE.MeshStandardMaterial({ color: 0x8a929a, roughness: 0.5, metalness: 0.3 }));
  tac.position.set(0, -H / 2 + 0.018, -F - 0.012); g.add(tac);
  g.userData = { ancho: W, alto: H, fondo, needle, sup, inf };
  return g;
}

/**
 * BOTONERA DE MANDO: la caja de plástico con sus pulsadores de 22 mm en
 * columna, cada uno con su anillo, su capuchón del color de la función y su
 * leyenda, y el prensaestopas por donde sale el cable. Los colores son los de la
 * norma: verde marcha, rojo paro, amarillo/negro las demás funciones.
 *   botones: [{ color, rotulo, hongo }]   (de arriba abajo)
 * `userData.cable` es el punto donde nace el cable (arriba).
 */
export function botoneraControl(mat, opts = {}) {
  const { ancho = 0.30, fondo = 0.14, botones = [{ color: 0x2f9e6a, rotulo: 'ADELANTE' }, { color: 0xd64545, rotulo: 'PARO', hongo: true }, { color: 0xc9a02c, rotulo: 'REVERSA' }] } = opts;
  const g = new THREE.Group();
  const n = botones.length, paso = ancho * 0.62, H = n * paso + 0.06;
  const mC = new THREE.MeshStandardMaterial({ color: 0x4b5560, roughness: 0.55, metalness: 0.12 });
  const met = mat.cromo || mat.acero || mat.aluminio;
  const cue = new THREE.Mesh(extruido(contornoRedondeado(
    [[-ancho / 2, -H / 2], [ancho / 2, -H / 2], [ancho / 2, H / 2], [-ancho / 2, H / 2]], 0.035, 4), { espesor: fondo, bisel: 0.010 }), mC);
  cue.castShadow = true; g.add(cue);
  botones.forEach((b, i) => {
    const y = H / 2 - 0.03 - paso * (i + 0.5) + 0.03;
    const anillo = new THREE.Mesh(revolucion([[0.040, 0], [0.056, 0], [0.056, 0.014], [0.046, 0.020], [0.040, 0.020]], { seg: 24 }), met);
    anillo.rotation.x = Math.PI / 2; anillo.position.set(0, y, fondo / 2); g.add(anillo);
    const r = b.hongo ? 0.050 : 0.039;
    const cap = new THREE.Mesh(revolucion(b.hongo
      ? [[0, 0], [r, 0], [r, 0.018], [r * 0.86, 0.034], [0, 0.040]]
      : [[0, 0], [r, 0], [r, 0.012], [r * 0.80, 0.024], [0, 0.026]], { seg: 22 }),
      new THREE.MeshStandardMaterial({ color: b.color, roughness: 0.4, metalness: 0.05 }));
    cap.rotation.x = Math.PI / 2; cap.position.set(0, y, fondo / 2 + 0.014); cap.castShadow = true; g.add(cap);
    _rotuloIEC(g, b.rotulo, 0, y - 0.083, fondo / 2 + 0.001, 0.15, 21, '#f1f4f7');
  });
  const pe = new THREE.Mesh(revolucion([[0, 0], [0.032, 0], [0.032, 0.014], [0.024, 0.030], [0.024, 0.06], [0, 0.06]], { seg: 14 }),
    new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.8 }));
  pe.position.set(0, H / 2, 0); g.add(pe);
  g.userData = { ancho, alto: H, fondo, cable: _V(0, H / 2 + 0.06, 0) };
  return g;
}

/**
 * REGLETA DE BORNES sobre riel DIN: una fila de bornes de paso, cada uno con su
 * tornillo, el hueco del cable, su color de cuerpo y su rótulo (L1·L2·L3,
 * U·V·W…), cerrada con dos topes. Es lo que separa «lo que llega» de «lo que
 * va al aparato» en cualquier tablero. `userData.bornas[i]` es el punto de
 * enganche del cable i (arriba, junto al tornillo).
 */
export function regletaBornes(mat, opts = {}) {
  const { vias = 3, paso = 0.16, alto = 0.20, fondo = 0.14, rotulos = ['L1', 'L2', 'L3'],
          colores = [0x8a5a2e, 0x24282e, 0x7d848c] } = opts;
  const g = new THREE.Group();
  const mC = new THREE.MeshStandardMaterial({ color: 0x777e86, roughness: 0.62, metalness: 0.05 });
  const mO = new THREE.MeshStandardMaterial({ color: 0x07090b, roughness: 0.8, metalness: 0.1 });
  const mT = new THREE.MeshStandardMaterial({ color: 0x4a525a, roughness: 0.6, metalness: 0.15 });
  const bornas = [];
  const F = fondo / 2, H = alto;
  const perfil = [[-F, -H / 2], [F, -H / 2], [F, H * 0.12], [F * 0.55, H / 2], [-F * 0.15, H / 2], [-F, H * 0.22]];
  for (let i = 0; i < vias; i++) {
    const x = (i - (vias - 1) / 2) * paso;
    const b = new THREE.Mesh(extruido(contornoRedondeado(perfil.map(([z, y]) => [-z, y]), 0.01, 2),
      { espesor: paso * 0.94, bisel: 0.005, curvaSeg: 2 }), mC);
    b.rotation.y = Math.PI / 2; b.position.x = x; b.castShadow = true; g.add(b);
    const bar = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.94, H * 0.16, 0.006), new THREE.MeshStandardMaterial({ color: colores[i % colores.length], roughness: 0.55 }));
    bar.position.set(x, H * 0.02, F + 0.001); g.add(bar);
    const hu = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.46, H * 0.22, 0.01), mO);
    hu.position.set(x, -H * 0.25, F + 0.001); g.add(hu);
    const tor = new THREE.Mesh(revolucion([[0, 0], [paso * 0.20, 0], [paso * 0.20, 0.006], [paso * 0.15, 0.010], [0, 0.010]], { seg: 14 }),
      new THREE.MeshStandardMaterial({ color: 0xcdd3d9, roughness: 0.32, metalness: 0.85 }));
    tor.position.set(x, H / 2 - 0.0, F * 0.20); tor.rotation.x = -0.35; g.add(tor);
    const ra = new THREE.Mesh(new THREE.BoxGeometry(paso * 0.28, 0.004, 0.008), mO);
    ra.position.set(x, H / 2 + 0.006, F * 0.20); ra.rotation.z = 0.5; g.add(ra);
    _rotuloIEC(g, rotulos[i] || '', x, H * 0.31, F + 0.0015, paso * 0.72, 40, '#14181e');
    bornas.push(_V(x, H / 2 + 0.01, F * 0.2 + 0.015));
  }
  for (const s of [-1, 1]) {
    const t = new THREE.Mesh(new THREE.BoxGeometry(0.02, H * 1.04, fondo * 0.95), mT);
    t.position.set(s * (vias * paso / 2 + 0.014), 0, 0); t.castShadow = true; g.add(t);
  }
  g.userData = { ancho: vias * paso, alto: H, fondo, bornas };
  return g;
}

/**
 * RIEL DIN (TS 35, perfil sombrero) con sus ranuras: es lo que sujeta, de un
 * clic, el contactor, el relé y la regleta. Eje X; la cara que sale del panel
 * es +Z; origen en el centro de la cara posterior. El ancho (35 mm) se
 * escala con `ancho`.
 */
export function rielDIN(mat, opts = {}) {
  const { largo = 1.4, ancho = 0.075 } = opts;
  const g = new THREE.Group();
  const e = ancho * 0.04, h = ancho * 0.21;
  const m = new THREE.MeshStandardMaterial({ color: 0x8c949b, roughness: 0.5, metalness: 0.7, envMapIntensity: 0.5 });
  const caja = (w, d, hh, y, z, mm) => { const b = new THREE.Mesh(new THREE.BoxGeometry(w, d, hh), mm || m); b.position.set(0, y, z); b.castShadow = b.receiveShadow = true; g.add(b); return b; };
  for (const s of [-1, 1]) caja(largo, ancho * 0.17, e, s * ancho * 0.415, e / 2);
  for (const s of [-1, 1]) caja(largo, e, h, s * ancho * 0.33, h / 2);
  const tx = _etiqueta(256, 32, (c, w, hh) => { c.fillStyle = '#c8d0d6'; c.fillRect(0, 0, w, hh); c.fillStyle = '#10151a';
    for (let i = 0; i < 6; i++) { const x = 12 + i * 40; c.beginPath(); c.roundRect ? c.roundRect(x, 8, 26, 16, 8) : c.rect(x, 8, 26, 16); c.fill(); } });
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(largo / 0.15, 1);
  const top = new THREE.Mesh(new THREE.PlaneGeometry(largo, ancho * 0.66), new THREE.MeshStandardMaterial({ map: tx, roughness: 0.45, metalness: 0.5 }));
  top.position.set(0, 0, h + 0.0005); g.add(top);
  g.userData = { largo, ancho, h };
  return g;
}

/**
 * CANALETA RANURADA para cables: el fondo, las dos paredes con sus dientes y,
 * dentro, los cables de colores que corren por ella. Eje X; abre hacia +Z;
 * origen en el centro de la cara posterior. `cables` es la lista de colores.
 */
export function canaleta(mat, opts = {}) {
  const { largo = 1.4, ancho = 0.10, alto = 0.07, cables = [0x8a5a2e, 0x24282e, 0x7d848c], color = 0x9ba2a9 } = opts;
  const g = new THREE.Group();
  const mC = new THREE.MeshStandardMaterial({ color, roughness: 0.6, metalness: 0.05 });
  const tx = _etiqueta(64, 16, (c, w, h) => { c.fillStyle = '#ffffff'; c.fillRect(0, 0, w, h); c.fillStyle = '#5b636b'; c.fillRect(w * 0.6, 0, w * 0.4, h); });
  tx.wrapS = tx.wrapT = THREE.RepeatWrapping; tx.repeat.set(largo / 0.05, 1);
  const mD = new THREE.MeshStandardMaterial({ color, map: tx, roughness: 0.6, metalness: 0.05 });
  const fondo = new THREE.Mesh(new THREE.BoxGeometry(largo, ancho, 0.006), new THREE.MeshStandardMaterial({ color: 0x8e969d, roughness: 0.6 }));
  fondo.position.z = 0.003; fondo.receiveShadow = true; g.add(fondo);
  for (const s of [-1, 1]) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(largo, 0.012, alto), [mC, mC, mC, mC, mD, mC]);
    pa.geometry.attributes.uv.needsUpdate = true;
    pa.position.set(0, s * (ancho / 2 - 0.006), alto / 2); pa.castShadow = true; g.add(pa);
  }
  cables.forEach((col, i) => {
    const w = new THREE.Mesh(new THREE.CylinderGeometry(0.0085, 0.0085, largo * 0.98, 8), new THREE.MeshStandardMaterial({ color: col, roughness: 0.6 }));
    w.rotation.z = Math.PI / 2; w.position.set(0, (i - (cables.length - 1) / 2) * 0.020, 0.016); g.add(w);
  });
  g.userData = { largo, ancho, alto };
  return g;
}



/* ============================================================================
   §17-B (cont.) · CABLEADO COAXIAL
   ----------------------------------------------------------------------------
   Un cable de señal no es un tubo de color: es un coaxial NEGRO con un
   conector BNC macho en cada punta —la tuerca de bayoneta, el cuerpo y el
   guardacable de goma que impide que se doble en el cuello—, tendido sobre el
   banco con holgura. La señal que viaja por dentro no se ve, y no debe
   dibujarse como un tubo luminoso: la única luz de un banco de instrumentos
   es la de las pantallas y los pilotos.
   ========================================================================== */

/**
 * CONECTOR BNC MACHO de cable: tuerca de bayoneta con sus dos ranuras, cuerpo
 * cromado, casquillo de engaste y guardacable cónico de goma. Eje +Z; el
 * origen está en la cara que asienta contra el conector hembra y la pieza
 * crece hacia +Z. `userData.salida` es donde nace el cable.
 */
export function plugBNC(mat, opts = {}) {
  const { d = 0.11, largo = 0.12, seg = 18 } = opts;
  const g = new THREE.Group();
  const R = d / 2;
  const met = mat.cromo || mat.acero || mat.aluminio;
  const mB = new THREE.MeshStandardMaterial({ color: 0x15181c, roughness: 0.85, metalness: 0.03 });
  const mO = new THREE.MeshStandardMaterial({ color: 0x050607, roughness: 0.8, metalness: 0.1 });
  const tue = new THREE.Mesh(revolucion([[R * 0.82, 0], [R * 1.30, 0], [R * 1.30, largo * 0.50], [R * 1.16, largo * 0.56], [R * 0.82, largo * 0.56]], { seg }), met);
  tue.rotation.x = Math.PI / 2; tue.castShadow = true; g.add(tue);
  for (let i = 0; i < 12; i++) {                                   // el moleteado de la tuerca
    const a = i / 12 * Math.PI * 2;
    const m = new THREE.Mesh(new THREE.BoxGeometry(R * 0.07, R * 0.16, largo * 0.30), mO);
    m.position.set(Math.cos(a) * R * 1.30, Math.sin(a) * R * 1.30, largo * 0.34); m.rotation.z = a; g.add(m);
  }
  for (const s of [-1, 1]) {                                       // las ranuras de la bayoneta
    const r = new THREE.Mesh(new THREE.BoxGeometry(R * 0.16, R * 0.34, largo * 0.20), mO);
    r.position.set(s * R * 1.28, 0, largo * 0.16); g.add(r);
  }
  const cu = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.92, R * 0.92, largo * 0.42, seg), met);
  cu.rotation.x = Math.PI / 2; cu.position.z = largo * 0.56 + largo * 0.21; g.add(cu);
  const en = new THREE.Mesh(new THREE.CylinderGeometry(R * 0.66, R * 0.66, largo * 0.20, seg), met);
  en.rotation.x = Math.PI / 2; en.position.z = largo * 0.98 + largo * 0.10 - largo * 0.10; g.add(en);
  const gu = new THREE.Mesh(revolucion([[0, 0], [R * 0.66, 0], [R * 0.58, 0.04], [R * 0.40, 0.09], [R * 0.34, 0.12], [0, 0.12]], { seg: 14 }), mB);
  gu.rotation.x = Math.PI / 2; gu.position.z = largo; gu.castShadow = true; g.add(gu);
  g.userData = { d, largo, salida: _V(0, 0, largo + 0.12) };
  return g;
}

/**
 * CABLE COAXIAL entre dos conectores BNC hembra: un conector macho en cada
 * extremo, y el cable que sale de cada guardacable, baja a la mesa y se tiende
 * por ella con holgura —abombado hacia fuera, nunca tenso—.
 *
 *   A, B       puntos (en coordenadas de mundo) donde asienta cada macho: la
 *              boca de los conectores hembra
 *   dirA, dirB hacia dónde mira cada hembra (vector unitario, p. ej. +Z)
 *   suelo      altura de la mesa por donde corre el cable (opcional)
 *
 * Se devuelve en coordenadas de MUNDO: se añade directamente a la escena.
 */
export function cableCoaxial(mat, A, dirA, B, dirB, opts = {}) {
  const { r = 0.024, color = 0x15181c, suelo = null, d = 0.11, largoPlug = 0.12, holgura = 0.14 } = opts;
  const g = new THREE.Group();
  const Z = _V(0, 0, 1);
  [[A, dirA], [B, dirB]].forEach(([P, dir]) => {
    const pl = plugBNC(mat, { d, largo: largoPlug });
    pl.quaternion.setFromUnitVectors(Z, dir.clone().normalize()); pl.position.copy(P); g.add(pl);
  });
  const sale = largoPlug + 0.12 - 0.01;
  const A1 = A.clone().addScaledVector(dirA, sale), B1 = B.clone().addScaledVector(dirB, sale);
  const y0 = suelo !== null ? suelo + r : Math.min(A.y, B.y) - 0.15;
  const tramo = (P1, dir) => {
    const alto = Math.max(0, P1.y - y0);
    const P2 = P1.clone().addScaledVector(dir, 0.16); P2.y -= alto * 0.35;
    const P3 = P1.clone().addScaledVector(dir, 0.42); P3.y = y0;
    return [P2, P3];
  };
  const [A2, A3] = tramo(A1, dirA), [B2, B3] = tramo(B1, dirB);
  const M = A3.clone().add(B3).multiplyScalar(0.5); M.y = y0;
  M.addScaledVector(dirA, holgura);
  const cur = new THREE.CatmullRomCurve3([A1, A2, A3, M, B3, B2, B1], false, 'catmullrom', 0.4);
  const tubo = new THREE.Mesh(new THREE.TubeGeometry(cur, 90, r, 10, false),
    new THREE.MeshStandardMaterial({ color, roughness: 0.78, metalness: 0.03 }));
  tubo.castShadow = true; g.add(tubo);
  g.userData = { curva: cur };
  return g;
}

/* ==========================================================================
   §18 · BLOQUE DE MOTOR Y BATERÍA DE AUTOMOCIÓN (mec3d · motor de combustión)
   Lo que antes eran una caja con cuatro discos encima y un ladrillo con dos
   postes: el bloque con su cárter, su culata y su tapa de balancines, y la
   batería con su carcasa nervada, su asa y su tira de tapones de vaso.
   ========================================================================== */

/**
 * BLOQUE DE MOTOR de combustión en línea, entero y de un vistazo: el CÁRTER de
 * chapa abajo (más estrecho que el bloque, con su brida atornillada y el tapón
 * de vaciado), el BLOQUE fundido con los tapones de expansión de la camisa de
 * agua y los nervios en la cara delantera, la JUNTA oscura, la CULATA con sus
 * costillas, la TAPA DE BALANCINES con su costilla central, el TAPÓN DE ACEITE
 * y, de cada cilindro, la BOBINA que asoma por el pozo de la bujía. Por la cara
 * de atrás sale el COLECTOR DE ESCAPE: un tubo corto por cilindro y el de reunión.
 *
 * Eje largo en X (el cigüeñal), arriba en +Y, la cara delantera en +Z. El origen
 * es el centro de la caja `largo × alto × ancho`; todo cabe dentro de ella salvo
 * el colector, que sobresale por -Z. No lleva campana ni polea: cada laboratorio
 * pone la suya donde le toca.
 *   cil       número de cilindros (de 2 a 8; tapones y bobinas se reparten en X)
 *   bobinas   true: una bobina por cilindro sobre la tapa (gasolina);
 *             false: nada (diésel: la tapa va lisa)
 *   escape    true: colector de escape por la cara de atrás
 *   cuna      si > 0, dos apoyos de esa altura bajo el cárter, para que el motor
 *             no flote cuando se ha puesto más alto que el suelo
 *   tapa      false: sin tapa de balancines, tapon ni bobinas (la culata queda a la
 *             vista y el laboratorio monta la suya); `userData.yCulata` sigue
 *             dando la cara baja de la culata
 */
export function bloqueMotor(mat, opts = {}) {
  const { largo = 1.8, alto = 1.2, ancho = 1.2, cil = 4, bobinas = true, escape = true, cuna = 0, tapa = true } = opts;
  const g = new THREE.Group();
  const Al = mat.aluminio || mat.acero, Fe = mat.hierro || mat.acero || Al;
  const Ne = mat.negro || Fe, Ch = mat.chapa || Al;
  const mk = (pts, r, esp, bis, m) => {
    const geo = normalizaUV(extruido(contornoRedondeado(pts, r, 4), { espesor: esp, bisel: bis }), 2);
    const me = new THREE.Mesh(geo, m); me.castShadow = me.receiveShadow = true; return me;
  };
  const rect = (x0, y0, x1, y1) => [[x0, y0], [x1, y0], [x1, y1], [x0, y1]];
  const y0 = -alto / 2;
  const hPan = alto * 0.25, hBlq = alto * 0.38, hJun = alto * 0.014, hCul = alto * 0.20, hTap = alto * 0.13;
  const yPan = y0, yBlq = yPan + hPan, yJun = yBlq + hBlq, yCul = yJun + hJun, yTap = yCul + hCul;
  // El cárter: perfil de cubeta, más hondo hacia un extremo (donde está el sumidero).
  g.add(mk([[-largo * 0.40, yPan + hPan], [largo * 0.42, yPan + hPan], [largo * 0.42, yPan + hPan * 0.35],
    [largo * 0.30, yPan], [-largo * 0.22, yPan], [-largo * 0.30, yPan + hPan * 0.35],
    [-largo * 0.40, yPan + hPan * 0.35]], 0.02 * alto, ancho * 0.74, alto * 0.012, Ch));
  g.add(mk(rect(-largo * 0.455, yPan + hPan * 0.90, largo * 0.455, yPan + hPan * 1.04), 0.01 * alto,
    ancho * 0.92, alto * 0.006, Fe));
  // El bloque: cuerpo fundido, un poco más ancho que la culata.
  g.add(mk(rect(-largo / 2, yBlq, largo / 2, yBlq + hBlq), 0.03 * alto, ancho, alto * 0.012, Fe));
  // Tapones de expansión de la camisa de agua y nervios, en la cara delantera.
  const paso = largo * 0.78 / Math.max(1, cil - 1);
  const x0 = cil > 1 ? -largo * 0.39 : 0;
  for (let i = 0; i < cil; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.045, alto * 0.045, alto * 0.02, 18), Ch);
    t.rotation.x = Math.PI / 2; t.position.set(x0 + i * paso, yBlq + hBlq * 0.60, ancho / 2 + alto * 0.008);
    t.castShadow = true; g.add(t);
  }
  for (let i = 0; i <= cil; i++) {
    const xn = cil > 1 ? x0 - paso / 2 + i * paso : (i ? largo * 0.46 : -largo * 0.46);
    if (Math.abs(xn) > largo * 0.49) continue;
    const n = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.012, hBlq * 0.86, alto * 0.025), Fe);
    n.position.set(xn, yBlq + hBlq * 0.50, ancho / 2 + alto * 0.006); g.add(n);
  }
  // La junta de culata, oscura, y la culata con sus tres costillas de refrigeración.
  g.add(mk(rect(-largo * 0.495, yJun, largo * 0.495, yJun + hJun), 0.004 * alto, ancho * 0.96, alto * 0.004, Ne));
  g.add(mk(rect(-largo * 0.485, yCul, largo * 0.485, yCul + hCul), 0.025 * alto, ancho * 0.92, alto * 0.010, Al));
  for (let k = 0; k < 3; k++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.94, alto * 0.016, alto * 0.016), Al);
    a.position.set(0, yCul + hCul * (0.28 + k * 0.27), ancho * 0.46 + alto * 0.004); g.add(a);
  }
  // `tapa:false` deja la culata a la vista: el laboratorio monta la suya, con sus bobinas.
  if (tapa) {
    // La tapa de balancines (trapecio: más ancha abajo), con su costilla central.
    g.add(mk([[-largo * 0.40, yTap], [largo * 0.40, yTap], [largo * 0.38, yTap + hTap], [-largo * 0.38, yTap + hTap]],
      0.03 * alto, ancho * 0.60, alto * 0.012, Al));
    const cos = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.70, hTap * 0.20, ancho * 0.10), Al);
    cos.position.set(0, yTap + hTap + hTap * 0.08, 0); g.add(cos);
    // El tapón del aceite, en el extremo, con su asa.
    const tp = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.060, alto * 0.066, alto * 0.034, 18), Ne);
    tp.position.set(-largo * 0.32, yTap + hTap + alto * 0.012, ancho * 0.12); tp.castShadow = true; g.add(tp);
    const as = new THREE.Mesh(new THREE.BoxGeometry(alto * 0.11, alto * 0.020, alto * 0.028), Ne);
    as.position.set(-largo * 0.32, yTap + hTap + alto * 0.034, ancho * 0.12); g.add(as);
  }
  // Las bobinas sobre el pozo de cada bujía.
  if (bobinas && tapa) {
    for (let i = 0; i < cil; i++) {
      const b = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.038, alto * 0.044, alto * 0.14, 14), Ne);
      b.position.set(x0 + i * paso, yTap + hTap + alto * 0.05, -ancho * 0.12); b.castShadow = true; g.add(b);
      const c = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.050, alto * 0.050, alto * 0.016, 14), Ne);
      c.position.set(x0 + i * paso, yTap + hTap + alto * 0.005, -ancho * 0.12); g.add(c);
    }
  }
  // El colector de escape por la cara de atrás: un tubo por cilindro y el de reunión.
  if (escape) {
    const zT = -ancho * 0.46, zR = -ancho * 0.70, yE = yCul + hCul * 0.46;
    for (let i = 0; i < cil; i++) {
      const t = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.036, alto * 0.036, zT - zR, 12), Fe);
      t.rotation.x = Math.PI / 2; t.position.set(x0 + i * paso, yE, (zT + zR) / 2); t.castShadow = true; g.add(t);
    }
    const col = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.050, alto * 0.050, largo * 0.86, 16), Fe);
    col.rotation.z = Math.PI / 2; col.position.set(0, yE, zR); col.castShadow = true; g.add(col);
    const br = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.060, alto * 0.060, alto * 0.025, 18), Fe);
    br.rotation.z = Math.PI / 2; br.position.set(largo * 0.43 + alto * 0.012, yE, zR); g.add(br);
  }
  // El tapón de vaciado del cárter y la varilla del aceite.
  const dr = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.030, alto * 0.030, alto * 0.025, 6), Fe);
  dr.rotation.z = Math.PI / 2; dr.position.set(-largo * 0.215, yPan + alto * 0.035, ancho * 0.30); g.add(dr);
  const va = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.008, alto * 0.008, hBlq * 0.9, 8), mat.cobre || Fe);
  va.position.set(largo * 0.18, yBlq + hBlq * 0.62, ancho / 2 + alto * 0.030); g.add(va);
  if (cuna > 0) {
    for (const sx of [-1, 1]) {
      const p = new THREE.Mesh(new THREE.BoxGeometry(largo * 0.08, cuna, ancho * 0.60), Ne);
      p.position.set(sx * largo * 0.36, y0 - cuna / 2, 0); p.castShadow = true; g.add(p);
    }
  }
  g.userData = { largo, alto, ancho, cil, yBloque: yBlq, yCulata: yCul, yTapa: yTap + hTap,
    puertos: Array.from({ length: cil }, (_, i) => x0 + i * paso) };
  return g;
}

/**
 * BATERÍA DE AUTOMOCIÓN 12 V de plomo-ácido: carcasa con NERVIOS de refuerzo en
 * las caras largas, el escalón de la tapa, el ASA, la TIRA DE TAPONES de los seis
 * vasos y los DOS POSTES cónicos con su capuchón —el positivo, rojo y más
 * grueso—. Los postes quedan en el borde delantero, a `postX` del centro
 * (fracción del ancho) y a `postZ` (fracción del fondo, desde el centro).
 * Origen en el centro de la base; la tapa queda en y = `alto`.
 *   ancho, alto, fondo   cota de la carcasa
 *   vasos                número de tapones (6 en una de 12 V)
 *   caja, tapa           colores de la carcasa y de la tapa
 * `userData.positivo` y `userData.negativo` son los postes (mallas).
 */
export function bateriaAutomocion(mat, opts = {}) {
  const { ancho = 0.52, alto = 0.44, fondo = 0.34, vasos = 6, postX = 0.34, postZ = 0.24,
          caja = 0x1c2430, tapa = 0x2c3846 } = opts;
  const g = new THREE.Group();
  const mC = new THREE.MeshStandardMaterial({ color: caja, roughness: 0.62, metalness: 0.06 });
  const mT = new THREE.MeshStandardMaterial({ color: tapa, roughness: 0.58, metalness: 0.06 });
  const Pb = mat.plomo || mat.aluminio || mat.acero;
  const cuerpo = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-ancho / 2, 0], [ancho / 2, 0], [ancho / 2, alto * 0.90], [-ancho / 2, alto * 0.90]], alto * 0.03, 3),
    { espesor: fondo, bisel: alto * 0.012 }), 2), mC);
  cuerpo.castShadow = cuerpo.receiveShadow = true; g.add(cuerpo);
  // El escalón de la tapa: una plancha más baja, un poco hacia dentro.
  const tp = new THREE.Mesh(normalizaUV(extruido(contornoRedondeado(
    [[-ancho * 0.48, alto * 0.88], [ancho * 0.48, alto * 0.88], [ancho * 0.48, alto], [-ancho * 0.48, alto]], alto * 0.02, 3),
    { espesor: fondo * 0.94, bisel: alto * 0.008 }), 2), mT);
  tp.castShadow = true; g.add(tp);
  // Nervios verticales en las dos caras largas.
  for (const sz of [-1, 1]) for (let i = 0; i < 6; i++) {
    const n = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.030, alto * 0.62, fondo * 0.020), mC);
    n.position.set(-ancho * 0.40 + i * ancho * 0.16, alto * 0.46, sz * (fondo / 2 + fondo * 0.008)); g.add(n);
  }
  // El asa: un arco bajo, a lo ancho, detrás de los tapones.
  const asa = new THREE.Mesh(new THREE.TorusGeometry(ancho * 0.30, alto * 0.016, 8, 22, Math.PI), mT);
  asa.scale.set(1, 0.30, 1); asa.position.set(0, alto, -fondo * 0.22); g.add(asa);
  // La tira de tapones de vaso.
  for (let i = 0; i < vasos; i++) {
    const t = new THREE.Mesh(new THREE.CylinderGeometry(alto * 0.040, alto * 0.044, alto * 0.030, 14), mC);
    t.position.set((i - (vasos - 1) / 2) * ancho * 0.12, alto + alto * 0.012, -fondo * 0.04); g.add(t);
    const r = new THREE.Mesh(new THREE.BoxGeometry(alto * 0.062, alto * 0.012, alto * 0.010), mT);
    r.position.set(t.position.x, alto + alto * 0.030, t.position.z); g.add(r);
  }
  // Los postes cónicos y sus capuchones: positivo rojo y más grueso.
  const poste = (sx, rb, rt, col) => {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(rt, rb, alto * 0.16, 16), Pb);
    p.position.set(sx * ancho * postX, alto + alto * 0.08, fondo * postZ); p.castShadow = true; g.add(p);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rb * 1.18, rb * 1.18, alto * 0.026, 16),
      new THREE.MeshStandardMaterial({ color: col, roughness: 0.55, metalness: 0.05 }));
    c.position.set(p.position.x, alto + alto * 0.012, p.position.z); g.add(c);
    return p;
  };
  g.userData = { alto, ancho, fondo,
    positivo: poste(1, alto * 0.046, alto * 0.036, 0xc23b3b),
    negativo: poste(-1, alto * 0.040, alto * 0.031, 0x20242a) };
  return g;
}

/* ==========================================================================
   §19 · ENTRENADOR LÓGICO, PLC, LAZO 4-20 mA, PUENTE H Y KNX (mec3d · sistemas digitales)
   --------------------------------------------------------------------------
   Los laboratorios de lógica y automatización se montaban con «una placa verde
   con cuatro LEDs sobre una losa». Aquí está lo que un técnico espera ver en
   su banco: el ENTRENADOR LÓGICO de maleta (protoboard, interruptores, LEDs,
   displays de 7 segmentos, reloj manual y fuente de 5 V), el PLC compacto en
   riel DIN con su fuente de 24 V, el transmisor de campo del lazo 4-20 mA, el
   driver de puente H con su motor de CD y la botonera de pared del bus KNX.
   Todo a escala de PULGADA, como §15: un paso de protoboard es 0,1.

   Convenio: los entrenadores y módulos de banco tienen su origen en el centro
   de la planta y apoyan en y = 0; las piezas de riel DIN miran a +Z y tienen
   su origen en el centro de su base, como las de §17.
   ========================================================================== */

const _s19Hex = (c) => '#' + c.toString(16).padStart(6, '0');
const _s19Cromo = (mat) => mat.cromo || mat.acero || mat.aluminio;

/** Contorno de un segmento de display (hexágono alargado) en horizontal. */
function _s19Segmento(L, t, vertical) {
  const p = [[-L / 2, 0], [-L / 2 + t / 2, t / 2], [L / 2 - t / 2, t / 2], [L / 2, 0], [L / 2 - t / 2, -t / 2], [-L / 2 + t / 2, -t / 2]];
  return vertical ? p.map(([x, y]) => [y, x]) : p;
}

/**
 * DISPLAY DE 7 SEGMENTOS (cátodo común, de los de 0,56"): cuerpo negro, ventana
 * ahumada y siete segmentos hexagonales —a, b, c, d, e, f, g— más el punto
 * decimal. Cada segmento tiene SU material, así que el laboratorio enciende el
 * patrón que quiera con `ponSeg`. Mira a +Z; para ponerlo sobre un panel se
 * tumba con rotation.x = −π/2 (o se inclina un poco hacia el que mira).
 *   userData.seg[0..6] segmentos a…g · userData.dp el punto · ponSeg(mascara, v)
 */
export function display7seg(mat, opts = {}) {
  const { alto = 0.8, color = 0xff4a35, apagado = 0x2a1613 } = opts;
  const g = new THREE.Group();
  const h = alto, w = alto * 0.62, d = alto * 0.20;
  const cue = _bmPlancha(w, h, d, _bmMat(0x14161a, 0.55, 0.08), w * 0.05, d * 0.08); g.add(cue);
  const vent = new THREE.Mesh(new THREE.PlaneGeometry(w * 0.88, h * 0.90),
    new THREE.MeshStandardMaterial({ color: 0x1a0f0f, roughness: 0.28, metalness: 0.05 }));
  vent.position.z = d / 2 + 0.002; g.add(vent);
  const t = alto * 0.09, L = alto * 0.36, gap = t * 0.18, s = L + gap, xv = (L + gap) / 2;
  const zS = d / 2 + 0.005;
  const seg = [], pos = [[0, s, 0], [xv, s / 2, 1], [xv, -s / 2, 1], [0, -s, 0], [-xv, -s / 2, 1], [-xv, s / 2, 1], [0, 0, 0]];
  pos.forEach(([x, y, v]) => {
    const m = new THREE.Mesh(extruido(_s19Segmento(L, t, v), { espesor: 0.014 }),
      new THREE.MeshStandardMaterial({ color: apagado, emissive: color, emissiveIntensity: 0, roughness: 0.4, metalness: 0.05 }));
    m.position.set(x, y, zS); g.add(m); seg.push(m);
  });
  const dp = new THREE.Mesh(new THREE.CylinderGeometry(t * 0.55, t * 0.55, 0.014, 12),
    new THREE.MeshStandardMaterial({ color: apagado, emissive: color, emissiveIntensity: 0, roughness: 0.4 }));
  dp.rotation.x = Math.PI / 2; dp.position.set(xv + t * 1.15, -s - t * 0.2, zS); g.add(dp);
  // patillas en los dos cantos (las que se ven si se mira de lado)
  const met = _s19Cromo(mat);
  for (const sy of [-1, 1]) for (let i = 0; i < 5; i++) {
    const pa = new THREE.Mesh(new THREE.BoxGeometry(w * 0.04, 0.05, 0.012), met);
    pa.position.set((i - 2) * w * 0.2, sy * (h / 2 + 0.018), -d * 0.3); g.add(pa);
  }
  /** mascara: lista de 7 (o más) valores; v es la intensidad emisiva de los encendidos. */
  const ponSeg = (mascara, v = 1.3, hex = color) => {
    seg.forEach((m, i) => { const on = !!(mascara && mascara[i]); m.material.emissiveIntensity = on ? v : 0.02;
      m.material.color.setHex(on ? hex : apagado); m.material.emissive.setHex(hex); });
  };
  g.userData = { alto: h, ancho: w, fondo: d, seg, dp, ponSeg };
  return g;
}

/**
 * INTERRUPTOR DE PALANCA (toggle) de panel: tuerca hexagonal cromada, funda de
 * goma y la palanca con su bola. `pon(true)` la inclina hacia el fondo (ON, el
 * lado de arriba en un panel) y `pon(false)` hacia el que mira. Origen en la
 * cara del panel.
 */
export function palancaToggle(mat, opts = {}) {
  const { largo = 0.20, color = 0xc8ced4 } = opts;
  const g = new THREE.Group();
  const met = _s19Cromo(mat);
  const cue = _bmCaja(0.17, 0.06, 0.15, _bmMat(0x15181c, 0.6, 0.1), 0, 0.03, 0); g.add(cue);
  const tuerca = _bmCil(0.072, 0.03, met, 6); tuerca.position.y = 0.075; g.add(tuerca);
  const funda = new THREE.Mesh(revolucion([[0, 0], [0.04, 0], [0.034, 0.03], [0.022, 0.05], [0, 0.05]], { seg: 14 }), _bmMat(0x20252b, 0.8, 0.02));
  funda.position.y = 0.09; g.add(funda);
  const pal = new THREE.Group(); pal.position.y = 0.12; g.add(pal);
  const bar = _bmCil(0.016, largo, _bmMat(color, 0.25, 0.9), 12, 0.011); bar.position.y = largo / 2; pal.add(bar);
  const bola = new THREE.Mesh(new THREE.SphereGeometry(0.03, 14, 10), _bmMat(color, 0.2, 0.9)); bola.position.y = largo; pal.add(bola);
  const pon = (on) => { pal.rotation.x = on ? -0.55 : 0.55; };
  pon(false);
  g.userData = { palanca: pal, pon };
  return g;
}

/**
 * PULSADOR REDONDO de panel (el del reloj manual): aro cromado y casquete
 * rojo. `pulsar(v)` lo hunde de 0 a 1. Origen en la cara del panel.
 */
export function pulsadorPanel(mat, opts = {}) {
  const { color = 0xd64545, d = 0.26 } = opts;
  const g = new THREE.Group(), R = d / 2;
  const aro = new THREE.Mesh(revolucion([[R * 0.78, 0], [R, 0], [R, 0.035], [R * 0.90, 0.055], [R * 0.78, 0.055]], { seg: 28 }), _s19Cromo(mat));
  aro.castShadow = true; g.add(aro);
  const cap = new THREE.Mesh(revolucion([[0, 0], [R * 0.74, 0], [R * 0.74, 0.03], [R * 0.60, 0.058], [0, 0.066]], { seg: 26 }),
    _bmMat(color, 0.38, 0.05)); cap.position.y = 0.022; cap.castShadow = true; g.add(cap);
  g.userData = { cap, pulsar: (v) => { cap.position.y = 0.022 - 0.02 * Math.max(0, Math.min(1, v)); } };
  return g;
}

/**
 * LED INDICADOR DE PANEL: aro cromado y lente de domo con SU material (el
 * laboratorio sólo toca `lente.material.emissiveIntensity` y `.color`). Origen
 * en la cara del panel.
 */
export function ledPanel(mat, opts = {}) {
  const { color = 0x8ab4f8, apagado = null, r = 0.075 } = opts;
  const g = new THREE.Group();
  const aro = new THREE.Mesh(revolucion([[r * 0.86, 0], [r * 1.22, 0], [r * 1.22, 0.022], [r * 1.05, 0.034], [r * 0.86, 0.034]], { seg: 24 }), _s19Cromo(mat));
  g.add(aro);
  const dom = [[0, 0], [r * 0.9, 0]];
  for (let k = 1; k <= 8; k++) { const a = (k / 8) * Math.PI / 2; dom.push([r * 0.9 * Math.cos(a), r * 0.95 * Math.sin(a)]); }
  const lente = new THREE.Mesh(revolucion(dom, { seg: 22 }), new THREE.MeshStandardMaterial({
    color: apagado == null ? color : apagado, emissive: color, emissiveIntensity: 0.12, roughness: 0.22, metalness: 0.0 }));
  lente.position.y = 0.012; g.add(lente);
  g.userData = { lente };
  return g;
}

/**
 * ENTRENADOR LÓGICO DE BANCO (maleta): chasis con su labio, panel serigrafiado,
 * protoboard central con rieles, una franja de LEDs de estado con su jack de
 * entrada cada uno, una franja de interruptores de palanca con su jack de
 * salida, y la franja trasera con la fuente (bornas +5 V / GND, interruptor y
 * LED de encendido), el reloj manual (pulsador + LED), de 0 a 3 displays de 7
 * segmentos y —opcional— una pantalla de estado. Es el equipo con el que se
 * enseñan los contadores, los registros, los MUX o los sumadores, y lo que
 * cambia de una práctica a otra son los CHIPS y los PUENTES que se montan en
 * el protoboard.
 *
 * Escala de pulgada (paso 0,1): con 24 columnas mide ~3,8 de ancho. El grupo se
 * puede escalar entero. Origen en el centro de la planta, apoyo en y = 0.
 *
 *   H(col, fila)          punto de un agujero, en coordenadas del PROTOBOARD
 *                         (lo que piden `dip`, `cable` y `circ`)
 *   Hg(col, fila)         el mismo punto en coordenadas del GRUPO
 *   dip(col, {pines, rotulo, rotulo2})  monta un DIP con la pata 1 en (col,'e')
 *   ptoPata(chip, k)      la pata k de un chip montado, en coordenadas del protoboard
 *   cable(A, B, color)    puente de protoboard entre dos agujeros ([col,fila] o Vector3)
 *   hilo(A, B, color)     cable largo entre dos puntos en coordenadas del GRUPO
 *                         (de un jack a otro, de la borna a la placa…)
 *   leds[i]               la lente del LED i (izq → der): material propio
 *   ledJack(i) · swJack(i) · bornas.{mas,gnd}   puntos de enganche, en el GRUPO
 *   sw[i].userData.pon(bool)   palancas · clk.userData.pulsar(v) · clkLed · pwrLed
 *   disp[i].userData.ponSeg(mascara7) · pantalla  (Mesh con material básico: se le pone `.map`)
 */
export function entrenadorLogico(mat, opts = {}) {
  const { cols = 24, rieles = 'tras', nLed = 8, nSw = 8, nDisp = 0, dispColor = 0xff4a35,
          pantalla = null, ledColor = 0x8ab4f8, ledColores = null, ledRotulos = null, swRotulos = null,
          rotulo = 'ENTRENADOR LÓGICO', serie = 'CEN-DL1 · 5 V', panel = 0x1d3850, protoColor = 0x9c988a,
          pantallaRotulo = 'ESTADO', dispAlto = 0.70 } = opts;
  const g = new THREE.Group();
  const met = _s19Cromo(mat);
  const prot = protoboard(mat, { cols, rieles, color: protoColor });
  const pu = prot.userData;
  const paso = 0.36;
  const W = Math.max(pu.ancho + 1.0, Math.max(nLed, nSw) * paso + 0.8, 3.6);
  const FRENTE = 1.15, ATRAS = 1.10;
  const D = pu.fondo + FRENTE + ATRAS;
  const HC = 0.30;
  const zF = D / 2, zS = zF - FRENTE, zB = -D / 2 + ATRAS;      // franja delantera / trasera
  prot.position.set(0, HC, zS - pu.zMax);
  g.add(prot);
  const circ = new THREE.Group(); prot.add(circ);

  // ---- chasis con su labio y la placa del panel (donde va la serigrafía)
  const Wp = W - 0.20, Dp = D - 0.20;
  const mCaja = _bmMat(0x1b2128, 0.5, 0.3);
  const caja = _bmPlancha(W, D, HC + 0.05, mCaja, 0.16, 0.03,
    [_bmRect(Wp, Dp, 0.08).map(([x, y]) => [x, y])]);
  caja.rotation.x = -Math.PI / 2; caja.position.y = (HC + 0.05) / 2; g.add(caja);
  const fondoCaja = _bmCaja(W - 0.04, 0.05, D - 0.04, mCaja, 0, 0.025, 0); g.add(fondoCaja);

  // ---- serigrafía: una sola textura sobre la cara superior del panel
  const S = 300;
  const px = (x) => (x + Wp / 2) * S, pz = (z) => (z + Dp / 2) * S;
  const xLed = (i) => (i - (nLed - 1) / 2) * paso, xSw = (i) => (i - (nSw - 1) / 2) * paso;
  const zLedJ = zS + 0.14, zLed = zS + 0.34, zLedL = zS + 0.52, zSwJ = zS + 0.70, zSw = zS + 0.90, zSwL = zS + 1.07;
  const zb = -D / 2 + 0.70;                                        // línea de centros de la franja trasera
  const xPw = -W / 2 + 0.45, xRk = -W / 2 + 1.12, xClk = -W / 2 + 1.62, xClkL = -W / 2 + 1.98;
  const xReg0 = -W / 2 + 2.25, xReg1 = W / 2 - 0.14;               // la región de displays / pantalla
  const pitD = dispAlto * 0.62 * 1.10;
  const txP = _etiqueta(Math.round(Wp * S), Math.round(Dp * S), (c, w, h) => {
    c.fillStyle = _s19Hex(panel); c.fillRect(0, 0, w, h);
    const gr = c.createLinearGradient(0, 0, 0, h); gr.addColorStop(0, 'rgba(255,255,255,0.06)'); gr.addColorStop(1, 'rgba(0,0,0,0.10)');
    c.fillStyle = gr; c.fillRect(0, 0, w, h);
    const tinta = 'rgba(236,242,246,0.92)';
    c.fillStyle = tinta; c.strokeStyle = 'rgba(236,242,246,0.70)'; c.lineWidth = 2.2; c.textBaseline = 'middle';
    const T = (txt, x, z, tam, al = 'center', col = tinta) => { c.font = `bold ${tam}px sans-serif`; c.textAlign = al; c.fillStyle = col; c.fillText(txt, px(x), pz(z)); };
    const caja2 = (x0, z0, x1, z1) => { c.beginPath(); c.roundRect ? c.roundRect(px(x0), pz(z0), px(x1) - px(x0), pz(z1) - pz(z0), 8) : c.rect(px(x0), pz(z0), px(x1) - px(x0), pz(z1) - pz(z0)); c.stroke(); };
    // título y serie, a lo largo del borde trasero
    T(rotulo, -W / 2 + 0.34, -D / 2 + 0.30, 40, 'left');
    T(serie, W / 2 - 0.34, -D / 2 + 0.30, 26, 'right', 'rgba(236,242,246,0.65)');
    c.beginPath(); c.moveTo(px(-W / 2 + 0.32), pz(-D / 2 + 0.46)); c.lineTo(px(W / 2 - 0.32), pz(-D / 2 + 0.46)); c.stroke();
    // fuente
    caja2(-W / 2 + 0.24, zb - 0.30, -W / 2 + 1.34, zb + 0.34);
    T('FUENTE', -W / 2 + 0.79, zb - 0.20, 20); T('+5 V', xPw, zb + 0.24, 21, 'center', '#ffb3aa'); T('GND', xPw + 0.30, zb + 0.24, 21);
    T('ON', xRk, zb + 0.24, 21);
    // reloj
    caja2(-W / 2 + 1.44, zb - 0.30, -W / 2 + 2.14, zb + 0.34);
    T('RELOJ', xClk + 0.18, zb - 0.20, 20); T('CLK', xClk, zb + 0.24, 21); T('LED', xClkL, zb + 0.24, 18);
    // displays / pantalla
    if (nDisp || pantalla) {
      caja2(xReg0 - 0.08, zb - 0.30, xReg1 + 0.06, zb + 0.34);
      T(nDisp && !pantalla ? 'DISPLAYS 7 SEG' : (pantalla ? pantallaRotulo : ''), (xReg0 + xReg1) / 2, zb - 0.22, 18);
    }
    // LEDs y jacks
    for (let i = 0; i < nLed; i++) T(ledRotulos ? ledRotulos[i] : 'L' + i, xLed(i), zLedL, 22);
    T('SALIDAS', xLed(0) - 0.40, zLed, 21, 'right');
    for (let i = 0; i < nSw; i++) T(swRotulos ? swRotulos[i] : 'S' + i, xSw(i), zSwL, 22);
    T('ENTRADAS', xSw(0) - 0.40, zSw, 21, 'right');
  });
  txP.wrapS = txP.wrapT = THREE.ClampToEdgeWrapping;
  const mPlaca = new THREE.MeshStandardMaterial({ map: txP, roughness: 0.55, metalness: 0.05 });
  const mLado = _bmMat(0x1a2128, 0.6, 0.2);
  const plato = new THREE.Mesh(new THREE.BoxGeometry(Wp, 0.04, Dp), [mLado, mLado, mPlaca, mLado, mLado, mLado]);
  plato.position.set(0, HC - 0.02, 0); plato.receiveShadow = true; g.add(plato);

  // ---- bornas de la fuente, interruptor y LEDs de encendido y reloj
  const bMas = bornaBanana(mat, { d: 0.17, color: 0xd64545 }); bMas.position.set(xPw, HC, zb); g.add(bMas);
  const bGnd = bornaBanana(mat, { d: 0.17, color: 0x15181c }); bGnd.position.set(xPw + 0.30, HC, zb); g.add(bGnd);
  const marcoRk = _bmCaja(0.20, 0.03, 0.30, met, xRk, HC + 0.015, zb - 0.03); g.add(marcoRk);
  const rk = _bmCaja(0.16, 0.06, 0.24, _bmMat(0x14181c, 0.45, 0.1), xRk, HC + 0.055, zb - 0.03); rk.rotation.x = -0.22; g.add(rk);
  const pwrLed = ledPanel(mat, { color: 0x6fe39a, r: 0.055 }); pwrLed.position.set(xRk, HC, zb - 0.34 + 0.06); g.add(pwrLed);
  pwrLed.userData.lente.material.emissiveIntensity = 1.0;
  const clk = pulsadorPanel(mat, { d: 0.26 }); clk.position.set(xClk, HC, zb - 0.02); g.add(clk);
  const clkLed = ledPanel(mat, { color: 0x7cd992, r: 0.058 }); clkLed.position.set(xClkL, HC, zb - 0.02); g.add(clkLed);

  // ---- LEDs de estado y sus jacks
  const leds = [], ledJacks = [];
  for (let i = 0; i < nLed; i++) {
    const col = ledColores ? ledColores[i % ledColores.length] : ledColor;
    const l = ledPanel(mat, { color: col, apagado: 0x2a3550, r: 0.07 }); l.position.set(xLed(i), HC, zLed); g.add(l);
    leds.push(l.userData.lente);
    const j = bornaBanana(mat, { d: 0.10, alto: 0.04, color: 0x8c949c }); j.position.set(xLed(i), HC, zLedJ); g.add(j);
    ledJacks.push(_V(xLed(i), HC + 0.036, zLedJ));
  }
  // ---- interruptores de palanca y sus jacks
  const sw = [], swJacks = [];
  for (let i = 0; i < nSw; i++) {
    const s = palancaToggle(mat, {}); s.position.set(xSw(i), HC, zSw); g.add(s); sw.push(s);
    const j = bornaBanana(mat, { d: 0.10, alto: 0.04, color: 0xd6b84a }); j.position.set(xSw(i), HC, zSwJ); g.add(j);
    swJacks.push(_V(xSw(i), HC + 0.036, zSwJ));
  }

  // ---- región de displays y pantalla, inclinados hacia quien mira
  const TILT = 0.55;
  const inclina = (obj, h, d) => {
    obj.rotation.x = -Math.PI / 2 + TILT;
    obj.position.y = HC + (h / 2) * Math.sin(TILT) + (d / 2) * Math.cos(TILT) + 0.01;
  };
  const disp = []; let xCur = xReg0 + 0.04;
  for (let i = 0; i < nDisp; i++) {
    const d7 = display7seg(mat, { alto: dispAlto, color: dispColor });
    inclina(d7, dispAlto, dispAlto * 0.2); d7.position.x = xCur + dispAlto * 0.31; d7.position.z = zb + 0.02;
    xCur += pitD; g.add(d7); disp.push(d7);
  }
  let pant = null;
  if (pantalla) {
    const rest = xReg1 - xCur - 0.04;
    const pw = Math.min(pantalla.ancho || rest, rest), ph = pantalla.alto || pw * 0.62;
    const mar = _bmPlancha(pw + 0.08, ph + 0.08, 0.07, _bmMat(0x101317, 0.5, 0.2), 0.03, 0.01);
    const gp = new THREE.Group(); gp.add(mar);
    pant = new THREE.Mesh(new THREE.PlaneGeometry(pw, ph), new THREE.MeshBasicMaterial({ color: 0x0a141c }));
    pant.position.z = 0.036; gp.add(pant);
    inclina(gp, ph + 0.08, 0.07); gp.position.x = xCur + 0.02 + pw / 2; gp.position.z = zb + 0.02; g.add(gp);
    pant.userData = { ancho: pw, alto: ph };
  }

  // ---- pies de goma y cierres (lo que dice «maleta»)
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const pie = _bmCil(0.09, 0.05, _bmMat(0x0c0e11, 0.9, 0.0), 14); pie.position.set(sx * (W / 2 - 0.25), -0.02, sz * (D / 2 - 0.25)); g.add(pie);
  }
  for (const sx of [-1, 1]) {
    const cie = _bmCaja(0.34, 0.12, 0.05, met, sx * W * 0.28, HC * 0.45, zF + 0.012); g.add(cie);
    const asa = _bmCaja(0.26, 0.05, 0.03, _bmMat(0x14181c, 0.5, 0.2), sx * W * 0.28, HC * 0.45, zF + 0.04); g.add(asa);
  }
  g.position.y = 0.0;

  // ---- utilidades de montaje
  const H = (col, fila) => pu.hoyo(col, fila);
  const Hg = (col, fila) => pu.hoyo(col, fila).add(prot.position);
  const aPunto = (p) => Array.isArray(p) ? pu.hoyo(p[0], p[1]) : p;
  const dipM = (col, o = {}) => {
    const pines = o.pines || 16;
    const c = dipRotulado(mat, { pines, rotulo: o.rotulo || '74HC00', rotulo2: o.rotulo2 || 'CEN LABS' });
    const p1 = pu.hoyo(col, 'e');
    c.position.set(p1.x + ((pines / 2 - 1) / 2) * 0.1, p1.y, 0); circ.add(c); return c;
  };
  const ptoPata = (chip, k) => chip.userData.pata(k).add(chip.position);
  const cable = (A, B, color = 0xd64545, o = {}) => { const w = puente(mat, aPunto(A), aPunto(B), { color, ...o }); circ.add(w); return w; };
  const hilo = (A, B, color = 0xd64545, o = {}) => { const w = puente(mat, A, B, { color, r: 0.024, alto: 0.5, sale: 0.10, ...o }); g.add(w); return w; };
  g.traverse((o) => { if (o.isMesh) { o.castShadow = true; o.receiveShadow = true; } });
  g.userData = Object.assign(g.userData || {}, { prot, circ, H, Hg, dip: dipM, ptoPata, cable, hilo, leds, sw, disp,
    pantalla: pant, clk, clkLed: clkLed.userData.lente, pwrLed: pwrLed.userData.lente, alto: HC, ancho: W, fondo: D,
    ledJack: (i) => ledJacks[i].clone(), swJack: (i) => swJacks[i].clone(),
    bornas: { mas: _V(xPw, HC + 0.056, zb), gnd: _V(xPw + 0.30, HC + 0.056, zb) } });
  return g;
}

/* --------------------------------------------------------------------------
   §19-B · AUTOMATIZACIÓN EN RIEL DIN: PLC compacto, fuente de 24 V, relé
   temporizador, panel HMI, estación de mando y aparatos modulares KNX
   --------------------------------------------------------------------------
   Todo mira a +Z y tiene el origen en el centro de su cuerpo, igual que el
   contactor de §17 y a su escala (un contactor mide 0,34 de ancho: 45 mm).
   Los LED de estado son lentes con SU material (`userData.di[i]`,
   `.led`…): el laboratorio sólo toca `material.emissiveIntensity`/`.color`. */

/** Lente plana de LED de un aparato (media esfera aplastada), con su propio material. */
function _s19Lente(color, r = 0.018, apagado = null) {
  const m = new THREE.Mesh(new THREE.SphereGeometry(r, 12, 8), new THREE.MeshStandardMaterial({
    color: apagado == null ? color : apagado, emissive: color, emissiveIntensity: 0.12, roughness: 0.3, metalness: 0 }));
  m.scale.z = 0.45; return m;
}
/** Tornillo de borne visto de frente (cabeza cromada con su ranura). */
function _s19Tornillo(mat, r = 0.016) {
  const t = new THREE.Mesh(revolucion([[0, 0], [r, 0], [r, 0.006], [r * 0.8, 0.010], [0, 0.010]], { seg: 12 }),
    new THREE.MeshStandardMaterial({ color: 0xcdd3d9, roughness: 0.32, metalness: 0.85 }));
  t.rotation.x = Math.PI / 2; return t;
}

/**
 * PLC COMPACTO en riel DIN (tipo CPU 1214C): cuerpo gris claro con las dos
 * PUERTAS de bornes oscuras —arriba las entradas, abajo las salidas—, una fila
 * de LED verdes de entradas DI justo bajo la puerta de arriba y otra de salidas
 * DQ sobre la de abajo, la columna de estado (RUN/STOP, ERROR, MANT), la placa
 * con el nombre de la CPU y el puerto Ethernet. Es lo que un electricista
 * identifica sin leer nada.
 *   userData.di[i] · dq[i] · run · stop · err · maint  (lentes con material propio)
 *   userData.bornasSup[i] · bornasInf[i]               (puntos de enganche del cable)
 */
export function plcCompacto(mat, opts = {}) {
  const { ancho = 0.90, alto = 0.78, fondo = 0.44, nDI = 8, nDQ = 6, rotulo = 'CPU 1214C', sub = 'DC/DC/DC',
          marca = 'CEN-PLC', color = 0xc4c9cf } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, F = fondo / 2;
  const mC = _bmMat(color, 0.55, 0.05), mD = _bmMat(0x2b3037, 0.6, 0.08);
  const cue = _bmPlancha(W, H, fondo, mC, 0.022, 0.008); g.add(cue);
  const hP = H * 0.21, zP = F + 0.012, zFr = F + 0.0345;              // puertas de bornes
  const nSup = nDI + 2, nInf = nDQ + 2;
  const bornasSup = [], bornasInf = [];
  const puerta = (s, n, rotulos) => {
    const y = s * (H / 2 - hP / 2);
    const pt = _bmCaja(W * 0.97, hP, 0.047, mD, 0, y, zP); g.add(pt);
    const tx = _etiqueta(512, Math.round(512 * hP / (W * 0.97)), (c, w, h) => {
      c.clearRect(0, 0, w, h); c.textAlign = 'center'; c.textBaseline = 'middle';
      for (let i = 0; i < n; i++) {
        const x = w * (0.08 + 0.84 * i / (n - 1));
        c.fillStyle = 'rgba(0,0,0,0.38)'; c.fillRect(x - w * 0.020, h * (s > 0 ? 0.50 : 0.18), w * 0.040, h * 0.30);
        c.fillStyle = '#d5dade'; c.font = 'bold ' + Math.round(h * 0.17) + 'px sans-serif';
        c.fillText(rotulos[i], x, h * (s > 0 ? 0.28 : 0.88));
      }
    });
    const pl = _tinta(tx, W * 0.97, hP); pl.position.set(0, y, zFr + 0.0005); g.add(pl);
    for (let i = 0; i < n; i++) {
      const x = (-0.5 + (0.08 + 0.84 * i / (n - 1))) * W * 0.97;
      const ts = _s19Tornillo(mat, 0.017); ts.position.set(x, y + s * (-hP * 0.0) + (s > 0 ? -hP * 0.0 : 0), zFr + 0.004); g.add(ts);
      (s > 0 ? bornasSup : bornasInf).push(_V(x, y, zFr + 0.03));
    }
  };
  const rotSup = ['1M', ...Array.from({ length: nDI }, (_, i) => '.' + i), '2M'].slice(0, nSup);
  const rotInf = ['3L+', ...Array.from({ length: nDQ }, (_, i) => '.' + i), 'M'].slice(0, nInf);
  puerta(1, nSup, rotSup); puerta(-1, nInf, rotInf);
  // franja central: serigrafía, placa y estado
  const Hm = H - 2 * hP - 0.02, Wm = W * 0.96;
  const yDI = Hm / 2 - 0.045, yDQ = -Hm / 2 + 0.045;
  const S = 420;
  const txM = _etiqueta(Math.round(Wm * S), Math.round(Hm * S), (c, w, h) => {
    c.fillStyle = _s19Hex(color); c.fillRect(0, 0, w, h);
    c.textBaseline = 'middle'; c.textAlign = 'center';
    const px = (x) => (x + Wm / 2) * S, py = (y) => (Hm / 2 - y) * S;
    c.fillStyle = '#2a2f35'; c.font = 'bold ' + Math.round(S * 0.034) + 'px sans-serif';
    for (let i = 0; i < nDI; i++) c.fillText('.' + i, px(((-0.5 + (0.08 + 0.84 * (i + 1) / (nSup - 1))) * W * 0.97)), py(yDI - 0.040));
    for (let i = 0; i < nDQ; i++) c.fillText('.' + i, px(((-0.5 + (0.08 + 0.84 * (i + 1) / (nInf - 1))) * W * 0.97)), py(yDQ + 0.040));
    c.textAlign = 'left'; c.fillText('DI a', px(-Wm / 2 + 0.01), py(yDI)); c.fillText('DQ a', px(-Wm / 2 + 0.01), py(yDQ));
    // columna de estado
    c.font = 'bold ' + Math.round(S * 0.036) + 'px sans-serif';
    c.fillText('RUN/STOP', px(-W * 0.34 + 0.05), py(0.075)); c.fillText('ERROR', px(-W * 0.34 + 0.05), py(0.0)); c.fillText('MANT', px(-W * 0.34 + 0.05), py(-0.075));
    // placa de la CPU
    c.fillStyle = '#e8ecef'; c.fillRect(px(-W * 0.02), py(0.105), W * 0.34 * S, 0.21 * S);
    c.strokeStyle = '#7b848c'; c.lineWidth = 2; c.strokeRect(px(-W * 0.02), py(0.105), W * 0.34 * S, 0.21 * S);
    c.fillStyle = '#14181e'; c.textAlign = 'center';
    c.font = 'bold ' + Math.round(S * 0.050) + 'px sans-serif'; c.fillText(rotulo, px(W * 0.15), py(0.062));
    c.font = Math.round(S * 0.034) + 'px sans-serif'; c.fillText(sub + ' · ' + marca, px(W * 0.15), py(0.005));
    c.fillStyle = '#0f5f8f'; c.fillRect(px(-W * 0.02), py(-0.085), W * 0.34 * S, 0.026 * S);
    c.fillStyle = '#e8ecef'; c.font = 'bold ' + Math.round(S * 0.022) + 'px sans-serif'; c.fillText('PROFINET · 24 V DC', px(W * 0.15), py(-0.072));
    // puerto Ethernet
    c.fillStyle = '#2a2f35'; c.font = Math.round(S * 0.028) + 'px sans-serif'; c.fillText('X1 P1', px(W * 0.405), py(-0.12));
  });
  const fr = new THREE.Mesh(new THREE.PlaneGeometry(Wm, Hm), new THREE.MeshStandardMaterial({ map: txM, roughness: 0.55, metalness: 0.03 }));
  fr.position.set(0, 0, F + 0.0012); g.add(fr);
  const lentes = (n, y, col, nT) => Array.from({ length: n }, (_, i) => {
    const l = _s19Lente(col, 0.017, 0x28442f); l.position.set((-0.5 + (0.08 + 0.84 * (i + 1) / (nT - 1))) * W * 0.97, y, F + 0.004); g.add(l); return l; });
  const di = lentes(nDI, yDI, 0x7cd992, nSup), dq = lentes(nDQ, yDQ, 0x7cd992, nInf);
  const run = _s19Lente(0x7cd992, 0.020, 0x28442f), stop = _s19Lente(0xe9a23b, 0.020, 0x4a3a1a), err = _s19Lente(0xff5a4d, 0.020, 0x4a2220), maint = _s19Lente(0xe9a23b, 0.020, 0x4a3a1a);
  run.position.set(-W * 0.40, 0.075, F + 0.004); stop.position.set(-W * 0.40 + 0.05, 0.075, F + 0.004);
  err.position.set(-W * 0.40, 0.0, F + 0.004); maint.position.set(-W * 0.40, -0.075, F + 0.004);
  // el estado por defecto es RUN
  [run, stop, err, maint].forEach((l) => g.add(l));
  run.material.emissiveIntensity = 1.0;
  // puerto Ethernet RJ45: marco, escudo cromado y dos LED de enlace
  const rj = _bmCaja(0.115, 0.075, 0.03, _bmMat(0x14171b, 0.6, 0.1), W * 0.405, -0.045, F + 0.004); g.add(rj);
  const esc = _bmCaja(0.085, 0.052, 0.024, _s19Cromo(mat), W * 0.405, -0.045, F + 0.012); g.add(esc);
  const hue = _bmCaja(0.062, 0.030, 0.012, _bmMat(0x050607, 0.9, 0), W * 0.405, -0.047, F + 0.022); g.add(hue);
  const lk = _s19Lente(0x7cd992, 0.010, 0x28442f), ac = _s19Lente(0xe9a23b, 0.010, 0x4a3a1a);
  lk.position.set(W * 0.405 - 0.04, -0.092, F + 0.004); ac.position.set(W * 0.405 + 0.04, -0.092, F + 0.004); g.add(lk, ac);
  lk.material.emissiveIntensity = 0.8;
  // tacón del riel DIN
  const tac = _bmCaja(W * 0.5, 0.034, 0.03, _bmMat(0x8a929a, 0.5, 0.3), 0, -H / 2 + 0.02, -F - 0.012); g.add(tac);
  g.userData = { ancho: W, alto: H, fondo, di, dq, run, stop, err, maint, link: lk, act: ac, bornasSup, bornasInf, frente: F + 0.035 };
  return g;
}

/**
 * FUENTE DE ALIMENTACIÓN DE 24 V PARA RIEL (tipo SITOP/QUINT): cuerpo gris
 * oscuro escalonado, bornes de entrada (L, N, PE) abajo y de salida (+ + − −)
 * arriba, la placa con 24 V DC / 5 A, el LED «DC OK» y el potenciómetro de
 * ajuste de tensión. `userData.ok` es el LED (material propio).
 */
export function fuenteRiel24(mat, opts = {}) {
  const { ancho = 0.40, alto = 0.78, fondo = 0.42, rotulo = '24 V DC · 5 A', color = 0x39414a } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, F = fondo / 2;
  g.add(_cuerpoEscalonado(mat, W, H, F, _bmMat(color, 0.6, 0.08), 0.80));
  const sup = [], inf = [];
  for (let i = 0; i < 4; i++) {
    const x = (i - 1.5) * W * 0.235;
    const b = _bornePotencia(mat, 0.072); b.position.set(x, 0.32 * H, F * 0.80 + 0.023); g.add(b);
    _rotuloIEC(g, ['+', '+', '−', '−'][i], x, 0.465 * H, F * 0.80 + 0.001, 0.07, 36);
    sup.push(_V(x, 0.38 * H, F * 0.80 + 0.055));
  }
  for (let i = 0; i < 3; i++) {
    const x = (i - 1) * W * 0.30;
    const b = _bornePotencia(mat, 0.072); b.position.set(x, -0.355 * H, F * 0.80 + 0.023); g.add(b);
    _rotuloIEC(g, ['L', 'N', 'PE'][i], x, -0.468 * H, F * 0.80 + 0.001, 0.07, 32);
    inf.push(_V(x, -0.41 * H, F * 0.80 + 0.055));
  }
  const zF = F + 0.008;
  const pl = _etiqueta(256, 180, (c, w, h) => {
    c.fillStyle = '#e9edf0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#14181e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 36px sans-serif'; c.fillText(rotulo, w / 2, h * 0.22);
    c.font = '17px sans-serif'; c.fillText('IN 100–240 V~ · OUT 24 V', w / 2, h * 0.46);
    c.fillStyle = '#2b6cb0'; c.fillRect(0, h * 0.62, w, h * 0.16);
    c.fillStyle = '#fff'; c.font = 'bold 22px sans-serif'; c.fillText('DC OK', w * 0.74, h * 0.70); c.fillText('V adj', w * 0.20, h * 0.70);
    c.fillStyle = '#14181e'; c.font = '20px sans-serif'; c.fillText('FUENTE CONMUTADA', w / 2, h * 0.92);
  });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.86, W * 0.86 * 180 / 256), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 }));
  placa.position.set(0, -0.05 * H, zF); g.add(placa);
  const ok = _s19Lente(0x6fe39a, 0.021, 0x1d3a28); ok.position.set(W * 0.24, -0.05 * H - 0.040, zF + 0.002); g.add(ok); ok.material.emissiveIntensity = 1.0;
  const pot = new THREE.Mesh(revolucion([[0, 0], [0.032, 0], [0.032, 0.012], [0.026, 0.018], [0, 0.018]], { seg: 18 }), _bmMat(0xd0d5da, 0.4, 0.5));
  pot.rotation.x = Math.PI / 2; pot.position.set(-W * 0.24, -0.05 * H - 0.040, zF + 0.002); g.add(pot);
  const ra = _bmCaja(0.05, 0.007, 0.006, _bmMat(0x14181e, 0.7, 0.1), -W * 0.24, -0.05 * H - 0.040, zF + 0.022); ra.rotation.z = 0.5; g.add(ra);
  const tac = _bmCaja(W * 0.62, 0.032, 0.03, _bmMat(0x8a929a, 0.5, 0.3), 0, -H / 2 + 0.018, -F - 0.012); g.add(tac);
  g.userData = { ancho: W, alto: H, fondo, ok, bornasSup: sup, bornasInf: inf, frente: F };
  return g;
}

/**
 * RELÉ TEMPORIZADOR DE 22,5 mm (el TON de estrella-delta): cuerpo claro
 * escalonado, la escala de tiempo con su perilla, el selector de función, los
 * LED de alimentación «U» y de relé «R» y los bornes A1/15/18 arriba, A2/16
 * abajo. `userData.ledU` y `userData.ledR` son lentes con material propio;
 * `perilla` gira con rotation.z.
 */
export function temporizadorRiel(mat, opts = {}) {
  const { ancho = 0.20, alto = 0.62, fondo = 0.36, rotulo = 'KT1', rango = '0,1–30 s', funcion = 'TON', color = 0xcfd4d9 } = opts;
  const g = new THREE.Group();
  const W = ancho, H = alto, F = fondo / 2;
  g.add(_cuerpoEscalonado(mat, W, H, F, _bmMat(color, 0.55, 0.05), 0.76));
  const zF = F + 0.008;
  const ba = ['A1', '15', '18'], bb = ['A2', '16'];
  ba.forEach((t, i) => { const x = (i - 1) * W * 0.30; const b = _bornePotencia(mat, 0.060); b.position.set(x, 0.32 * H, F * 0.76 + 0.020); g.add(b); _rotuloIEC(g, t, x, 0.465 * H, F * 0.76 + 0.001, 0.07, 30); });
  bb.forEach((t, i) => { const x = (i - 0.5) * W * 0.40; const b = _bornePotencia(mat, 0.060); b.position.set(x, -0.355 * H, F * 0.76 + 0.020); g.add(b); _rotuloIEC(g, t, x, -0.468 * H, F * 0.76 + 0.001, 0.07, 30); });
  const pl = _etiqueta(256, 256, (c, w, h) => {
    c.fillStyle = '#e9edf0'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#14181e'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold 54px sans-serif'; c.fillText(rotulo, w / 2, h * 0.14);
    c.font = '30px sans-serif'; c.fillText(funcion + ' · ' + rango, w / 2, h * 0.30);
    c.strokeStyle = '#14181e'; c.lineWidth = 3;
    c.beginPath(); c.arc(w / 2, h * 0.64, w * 0.34, Math.PI * 0.8, Math.PI * 2.2); c.stroke();
    for (let k = 0; k <= 10; k++) { const a = Math.PI * 0.8 + (Math.PI * 1.4) * k / 10; c.beginPath();
      c.moveTo(w / 2 + Math.cos(a) * w * 0.34, h * 0.64 + Math.sin(a) * w * 0.34); c.lineTo(w / 2 + Math.cos(a) * w * 0.40, h * 0.64 + Math.sin(a) * w * 0.40); c.stroke(); }
    c.font = '26px sans-serif'; c.fillText('U', w * 0.20, h * 0.93); c.fillText('R', w * 0.80, h * 0.93);
  });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.92, W * 0.92), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 }));
  placa.position.set(0, -0.045 * H, zF); g.add(placa);
  const perilla = new THREE.Group(); perilla.position.set(0, -0.045 * H + W * 0.92 * (0.64 - 0.5) * -1, zF + 0.002);
  const pe = new THREE.Mesh(revolucion([[0, 0], [W * 0.17, 0], [W * 0.17, 0.016], [W * 0.14, 0.024], [0, 0.024]], { seg: 22 }), _bmMat(0x2b3037, 0.5, 0.2));
  pe.rotation.x = Math.PI / 2; perilla.add(pe);
  const pu = _bmCaja(0.012, W * 0.14, 0.010, _bmMat(0xe9a23b, 0.5, 0.1), 0, W * 0.07, 0.027); perilla.add(pu);
  g.add(perilla);
  const ledU = _s19Lente(0x6fe39a, 0.015, 0x1d3a28), ledR = _s19Lente(0xe9a23b, 0.015, 0x4a3a1a);
  ledU.position.set(-W * 0.30, -0.045 * H - W * 0.92 * 0.43, zF + 0.003); ledR.position.set(W * 0.30, ledU.position.y, zF + 0.003);
  g.add(ledU, ledR); ledU.material.emissiveIntensity = 1.0;
  const tac = _bmCaja(W * 0.62, 0.030, 0.03, _bmMat(0x8a929a, 0.5, 0.3), 0, -H / 2 + 0.018, -F - 0.012); g.add(tac);
  g.userData = { ancho: W, alto: H, fondo, ledU, ledR, perilla, frente: F };
  return g;
}

/**
 * PANEL DE OPERADOR (HMI táctil): marco negro con su pantalla y la franja de
 * teclas de función. `userData.pantalla` es un Mesh de material básico al que
 * el laboratorio le pone su canvas en `.material.map` (y `color` a 0xffffff).
 * `userData.ancho/alto` son las medidas de la pantalla. Frente a +Z.
 */
export function panelHMI(mat, opts = {}) {
  const { ancho = 0.90, alto = 0.62, fondo = 0.09, teclas = 4, rotulo = 'HMI' } = opts;
  const g = new THREE.Group();
  const marco = _bmPlancha(ancho, alto, fondo, _bmMat(0x181b1f, 0.45, 0.25), 0.03, 0.010); g.add(marco);
  const sw = ancho * 0.90, sh = alto * 0.70;
  const aro = _bmPlancha(sw + 0.02, sh + 0.02, 0.012, _bmMat(0x07090b, 0.5, 0.1), 0.012, 0.003); aro.position.set(0, alto * 0.06, fondo / 2 + 0.001); g.add(aro);
  const pant = new THREE.Mesh(new THREE.PlaneGeometry(sw, sh), new THREE.MeshBasicMaterial({ color: 0x0a141c }));
  pant.position.set(0, alto * 0.06, fondo / 2 + 0.009); g.add(pant);
  for (let i = 0; i < teclas; i++) {
    const t = _bmPlancha(ancho * 0.13, alto * 0.065, 0.014, _bmMat(0x3a4048, 0.6, 0.2), 0.008, 0.003);
    t.position.set((i - (teclas - 1) / 2) * ancho * 0.18, -alto * 0.40, fondo / 2 + 0.002); g.add(t);
    _rotuloIEC(g, 'F' + (i + 1), t.position.x, t.position.y, fondo / 2 + 0.012, 0.07, 36, '#d5dade');
  }
  _rotuloIEC(g, rotulo, ancho * 0.40, -alto * 0.40, fondo / 2 + 0.003, 0.12, 36, '#8c949c');
  g.userData = { ancho: sw, alto: sh, fondo, pantalla: pant, frente: fondo / 2 };
  return g;
}

/**
 * ESTACIÓN DE MANDO: la placa con sus pulsadores, selectores y pilotos de 22 mm
 * en fila, cada uno con su aro cromado y su rótulo. `items`: lista de
 * { tipo: 'pulsador' | 'hongo' | 'selector' | 'piloto', color, rotulo }.
 * `userData.items[i]` = { grupo, cap, lente } (el piloto trae `lente` con
 * material propio; el pulsador, `pulsar(v)`; el selector, `pon(k)` con k 0/1/2).
 */
export function mandoPanel(mat, opts = {}) {
  const { items = [{ tipo: 'pulsador', color: 0x2f9e6a, rotulo: 'MARCHA' }, { tipo: 'hongo', color: 0xd64545, rotulo: 'PARO' }, { tipo: 'piloto', color: 0x6fe39a, rotulo: 'MOTOR' }],
          paso = 0.20, fondo = 0.10 } = opts;
  const g = new THREE.Group();
  const n = items.length, W = n * paso + 0.06, H = 0.34;
  g.add(_bmPlancha(W, H, fondo, _bmMat(0x59626c, 0.55, 0.15), 0.03, 0.008));
  const met = _s19Cromo(mat);
  const out = items.map((it, i) => {
    const x = (i - (n - 1) / 2) * paso, gr = new THREE.Group(); gr.position.set(x, 0.03, fondo / 2); g.add(gr);
    const aro = new THREE.Mesh(revolucion([[0.040, 0], [0.058, 0], [0.058, 0.012], [0.050, 0.018], [0.040, 0.018]], { seg: 24 }), met);
    aro.rotation.x = Math.PI / 2; gr.add(aro);
    const res = { grupo: gr };
    if (it.tipo === 'piloto') {
      const dom = [[0, 0], [0.042, 0]];
      for (let k = 1; k <= 8; k++) { const a = (k / 8) * Math.PI / 2; dom.push([0.042 * Math.cos(a), 0.030 * Math.sin(a)]); }
      const len = new THREE.Mesh(revolucion(dom, { seg: 22 }), new THREE.MeshStandardMaterial({ color: new THREE.Color(it.color).multiplyScalar(0.28), emissive: it.color, emissiveIntensity: 0.15, roughness: 0.25 }));
      len.rotation.x = Math.PI / 2; len.position.z = 0.012; gr.add(len); res.lente = len;
    } else if (it.tipo === 'selector') {
      const cap = new THREE.Mesh(revolucion([[0, 0], [0.036, 0], [0.032, 0.030], [0.020, 0.036], [0, 0.036]], { seg: 20 }), _bmMat(0x14181c, 0.5, 0.1));
      cap.rotation.x = Math.PI / 2; cap.position.z = 0.010; gr.add(cap);
      const pal = _bmCaja(0.014, 0.060, 0.016, _bmMat(0xe9ecef, 0.4, 0.1), 0, 0.012, 0.050); const pv = new THREE.Group(); pv.add(pal); pv.position.z = 0; cap.add(pv);
      pv.rotation.set(0, 0, 0); res.cap = cap; res.pon = (k) => { pal.parent.rotation.z = (1 - k) * 0.7; };
      res.pon(1);
    } else {
      const r = it.tipo === 'hongo' ? 0.050 : 0.040;
      const cap = new THREE.Mesh(revolucion(it.tipo === 'hongo'
        ? [[0, 0], [r, 0], [r, 0.020], [r * 0.86, 0.036], [0, 0.044]] : [[0, 0], [r, 0], [r, 0.014], [r * 0.80, 0.026], [0, 0.028]], { seg: 24 }),
        _bmMat(it.color, 0.4, 0.05));
      cap.rotation.x = Math.PI / 2; cap.position.z = 0.012; gr.add(cap); res.cap = cap;
      res.pulsar = (v) => { cap.position.z = 0.012 - 0.012 * Math.max(0, Math.min(1, v)); };
    }
    _rotuloIEC(g, it.rotulo, x, -0.095, fondo / 2 + 0.001, paso * 0.92, 30, '#f1f4f7');
    return res;
  });
  g.userData = { ancho: W, alto: H, fondo, items: out, frente: fondo / 2 };
  return g;
}

/**
 * APARATO MODULAR DE RIEL (KNX): fuente de bus, actuador de n canales,
 * repetidor, pasarela IP. Cuerpo claro escalonado de `unidades` módulos de
 * 18 mm, el conector de BUS rojo/negro arriba, los bornes de salida abajo, la
 * placa con el nombre y, por canal, un pulsador de maniobra manual con su LED.
 *   tipo: 'fuente' | 'actuador' | 'repetidor' | 'pasarela'
 *   userData.led (el primero) · leds[i] · bus (punto del conector) · bornasInf[i]
 */
export function moduloDIN(mat, opts = {}) {
  const { unidades = 2, tipo = 'actuador', rotulo = 'ACTUADOR', canales = unidades >= 4 ? 4 : 1,
          alto = 0.62, fondo = 0.36, color = 0xc9ced4, sub = '' } = opts;
  const g = new THREE.Group();
  const W = unidades * 0.135, H = alto, F = fondo / 2;
  g.add(_cuerpoEscalonado(mat, W, H, F, _bmMat(color, 0.5, 0.05), 0.76));
  const zF = F + 0.008;
  // placa de nombre
  const ph = H * 0.20;
  const pl = _etiqueta(256, Math.round(256 * ph / (W * 0.88)), (c, w, h) => {
    c.fillStyle = '#2b3037'; c.fillRect(0, 0, w, h); c.fillStyle = '#e8edf1'; c.textAlign = 'center'; c.textBaseline = 'middle';
    const fs = Math.min(h * 0.46, w / (rotulo.length * 0.62 + 1)); c.font = 'bold ' + fs + 'px sans-serif'; c.fillText(rotulo, w / 2, h * 0.38);
    c.font = Math.round(h * 0.26) + 'px sans-serif'; c.fillStyle = '#7ad39a'; c.fillText(sub || 'KNX', w / 2, h * 0.76);
  });
  const placa = new THREE.Mesh(new THREE.PlaneGeometry(W * 0.88, ph), new THREE.MeshStandardMaterial({ map: pl, roughness: 0.5 })); placa.position.set(0, 0.04 * H, zF); g.add(placa);
  // canales: pulsador manual + LED
  const leds = [], bornasInf = [];
  const nC = tipo === 'actuador' ? canales : 1;
  for (let i = 0; i < nC; i++) {
    const x = (i - (nC - 1) / 2) * (W * 0.88 / Math.max(1, nC));
    if (tipo === 'actuador') { const b = _bmCaja(Math.min(0.07, W * 0.18), 0.034, 0.012, _bmMat(0x8f979f, 0.4, 0.5), x, -0.065 * H, zF + 0.004); g.add(b); }
    const l = _s19Lente(0xe9c46a, 0.012, 0x4a3f1a); l.position.set(x, -0.065 * H + 0.040, zF + 0.003); g.add(l); leds.push(l);
  }
  if (tipo === 'fuente') {
    const bob = new THREE.Mesh(new THREE.TorusGeometry(W * 0.10, W * 0.035, 10, 22), _bmMat(0xb87333, 0.45, 0.7));
    bob.position.set(0, -0.13 * H, zF + 0.012); bob.scale.z = 0.5; g.add(bob);
  }
  if (tipo === 'pasarela') {
    const rj = _bmCaja(W * 0.40, 0.055, 0.03, _bmMat(0x14171b, 0.6, 0.1), 0, -0.085 * H, zF + 0.010); g.add(rj);
    g.add(_bmCaja(W * 0.30, 0.036, 0.022, _s19Cromo(mat), 0, -0.085 * H, zF + 0.020));
  }
  // conector de bus (rojo +, negro −) y bornes de salida
  const bus = new THREE.Group(); bus.position.set(0, 0.36 * H, F * 0.76 + 0.03);
  bus.add(_bmCaja(W * 0.52, 0.060, 0.045, _bmMat(0x1d2126, 0.6, 0.05)));
  [[-1, 0xd64545], [1, 0x14181c]].forEach(([s, c]) => { const p = _bmCil(0.016, 0.050, _bmMat(c, 0.5, 0.1), 12); p.rotation.x = Math.PI / 2; p.position.set(s * W * 0.14, 0, 0.012); bus.add(p); });
  g.add(bus);
  const nB = Math.max(2, Math.min(4, Math.round(W / 0.13)));
  for (let i = 0; i < nB; i++) {
    const x = (i - (nB - 1) / 2) * W * 0.80 / nB * 1.2; const b = _bornePotencia(mat, Math.min(0.07, W / nB * 0.8)); b.position.set(x, -0.355 * H, F * 0.76 + 0.020); g.add(b);
    bornasInf.push(_V(x, -0.41 * H, F * 0.76 + 0.050));
  }
  const tac = _bmCaja(W * 0.70, 0.030, 0.03, _bmMat(0x8a929a, 0.5, 0.3), 0, -H / 2 + 0.018, -F - 0.012); g.add(tac);
  g.userData = { ancho: W, alto: H, fondo, leds, led: leds[0], bus: _V(0, 0.40 * H, F * 0.76 + 0.06), bornasInf, frente: F };
  return g;
}

/**
 * PULSADOR / SENSOR DE PARED (empotrable): marco cuadrado blanco con sus dos
 * balancines y el LED de estado. `userData.lente` es el LED (material propio),
 * `balancin[0/1]` giran con rotation.x. Frente a +Z; origen en el centro.
 */
export function pulsadorPared(mat, opts = {}) {
  const { lado = 0.34, color = 0xf0efea, ledColor = 0x6fe39a } = opts;
  const g = new THREE.Group();
  const marco = _bmPlancha(lado, lado, 0.035, _bmMat(color, 0.45, 0.02), lado * 0.08, 0.008); g.add(marco);
  const mB = _bmMat(0xe3e2dc, 0.4, 0.02);
  const balancin = [-1, 1].map((s) => {
    const b = _bmPlancha(lado * 0.38, lado * 0.62, 0.02, mB, 0.02, 0.006); b.position.set(s * lado * 0.21, lado * 0.06, 0.028); b.rotation.x = 0.07; g.add(b); return b; });
  const lente = _s19Lente(ledColor, 0.014, 0x1d3a28); lente.position.set(0, -lado * 0.36, 0.022); g.add(lente);
  const raya = _bmCaja(0.004, lado * 0.60, 0.004, _bmMat(0x9a9a92, 0.6, 0.0), 0, lado * 0.06, 0.020); g.add(raya);
  g.userData = { lado, lente, balancin };
  return g;
}

/* --------------------------------------------------------------------------
   §19-C · INSTRUMENTACIÓN DE CAMPO Y ELECTRÓNICA EMBEBIDA: transmisor de campo
   de 2 hilos, placa de microcontrolador y encoder óptico
   -------------------------------------------------------------------------- */

/**
 * TRANSMISOR DE CAMPO DE 2 HILOS (presión / nivel): la conexión a proceso con
 * su hexágono y su rosca, el cuello, la CAJA DE ELECTRÓNICA cilíndrica pintada
 * con sus dos tapas roscadas —una de ellas con la ventana del indicador—, la
 * entrada de cable con su prensaestopas y el cable que sale. Es el aparato que
 * se ve en lo alto de cualquier tanque instrumentado. Eje +Y: el origen está en
 * la cara inferior del hexágono (la rosca queda por debajo, y negativa).
 *   userData.cable   punto donde nace el cable del lazo (arriba)
 *   userData.ponLCD(l1, l2)   repinta las dos líneas del indicador
 */
export function transmisorCampo(mat, opts = {}) {
  const { color = 0x2f5f9e, texto1 = '11,04 mA', texto2 = '44,0 %', escala = 1 } = opts;
  const g = new THREE.Group();
  const met = _s19Cromo(mat);
  const mAc = _bmMat(0xaab2ba, 0.32, 0.85), mPint = _bmMat(color, 0.38, 0.35), mNeg = _bmMat(0x15181c, 0.7, 0.1);
  // conexión a proceso: rosca, hexágono y cuello
  const ros = _bmCil(0.052, 0.09, mAc, 18); ros.position.y = -0.045; g.add(ros);
  for (let i = 0; i < 5; i++) { const fi = _bmCil(0.056, 0.008, mAc, 18); fi.position.y = -0.015 - i * 0.016; g.add(fi); }
  const hex = _bmCil(0.092, 0.05, mAc, 6); hex.position.y = 0.025; g.add(hex);
  const cue = _bmCil(0.062, 0.14, mAc, 20); cue.position.y = 0.12; g.add(cue);
  const modulo = _bmCil(0.085, 0.07, mAc, 24); modulo.position.y = 0.225; g.add(modulo);
  // caja de electrónica (eje X)
  const Y = 0.33, R = 0.105, L = 0.34;
  const caja = new THREE.Mesh(revolucion([[0, -L / 2], [R, -L / 2], [R, L / 2], [0, L / 2]], { seg: 32 }), mPint);
  caja.rotation.z = Math.PI / 2; caja.position.y = Y; caja.castShadow = true; g.add(caja);
  const base = _bmCaja(0.17, 0.05, 0.16, mPint, 0, Y - R * 0.86, 0); g.add(base);
  for (const s of [-1, 1]) {
    const tapa = new THREE.Mesh(revolucion([[0, 0], [R * 1.04, 0], [R * 1.04, 0.05], [R * 0.96, 0.07], [R * 0.60, 0.11], [0, 0.125]], { seg: 32 }), mPint);
    tapa.rotation.z = -s * Math.PI / 2; tapa.position.set(s * (L / 2 - 0.008), Y, 0); tapa.castShadow = true; g.add(tapa);
    const aro = new THREE.Mesh(new THREE.TorusGeometry(R * 1.03, 0.008, 8, 32), mNeg);
    aro.rotation.y = Math.PI / 2; aro.position.set(s * (L / 2 + 0.002), Y, 0); g.add(aro);
  }
  // ventana del indicador, al frente
  const vc = document.createElement('canvas'); vc.width = 256; vc.height = 128; const vx = vc.getContext('2d');
  const vt = new THREE.CanvasTexture(vc); vt.colorSpace = THREE.SRGBColorSpace; vt.anisotropy = 8;
  const ponLCD = (l1, l2) => {
    vx.fillStyle = '#b9c8b4'; vx.fillRect(0, 0, 256, 128);
    vx.fillStyle = '#1b2a1b'; vx.textAlign = 'center'; vx.textBaseline = 'middle';
    vx.font = 'bold 54px monospace'; vx.fillText(l1, 128, 46); vx.font = 'bold 36px monospace'; vx.fillText(l2, 128, 100);
    vt.needsUpdate = true;
  };
  ponLCD(texto1, texto2);
  const mar = _bmPlancha(0.22, 0.12, 0.018, mNeg, 0.02, 0.004); mar.position.set(0, Y + 0.012, R - 0.004); mar.rotation.x = -0.05; g.add(mar);
  const lcd = new THREE.Mesh(new THREE.PlaneGeometry(0.195, 0.095), new THREE.MeshStandardMaterial({ map: vt, emissive: 0x16241a, emissiveMap: vt, emissiveIntensity: 0.5, roughness: 0.35 }));
  lcd.position.set(0, Y + 0.012, R + 0.0065); lcd.rotation.x = -0.05; g.add(lcd);
  // placa de características en la parte trasera/baja del cuello
  const pl = _bmRotulo('LT-4201\n4–20 mA · HART', 0.10, 0.06, '#d8dde2', '#14181e'); pl.position.set(0, 0.255, 0.064); pl.rotation.x = -0.3; g.add(pl);
  // entrada de cable: cuello hexagonal, prensaestopas y cable
  const ent = _bmCil(0.032, 0.05, mAc, 6); ent.position.set(0.075, Y + R + 0.012, 0); g.add(ent);
  const pre = new THREE.Mesh(revolucion([[0, 0], [0.026, 0], [0.020, 0.05], [0.014, 0.075], [0, 0.075]], { seg: 14 }), mNeg);
  pre.position.set(0.075, Y + R + 0.036, 0); g.add(pre);
  g.userData = { cable: _V(0.075, Y + R + 0.115, 0), lcd, ponLCD, alto: Y + R + 0.12 };
  g.scale.setScalar(escala);
  return g;
}

/**
 * PLACA DE MICROCONTROLADOR tipo UNO (ATmega328P): circuito azul con los dos
 * regletas de cabeceras negras —digitales arriba, analógicas y alimentación
 * abajo—, el conector USB-B y el de alimentación a un lado, el chip DIP-28
 * rotulado, el cristal de 16 MHz, el botón de reset y los LED ON / L / TX / RX.
 * Escala de pulgada (2,7 × 2,1); escálala entera. Origen en el centro, apoyada
 * en y = 0 (la cara superior de la placa está en y = 0,06).
 *   userData.led13 · ledTx · ledRx · ledOn  lentes con material propio
 *   userData.pin(i)  punta del pin digital i (0…13), en coordenadas de la pieza
 */
export function placaMicro(mat, opts = {}) {
  const { color = 0x0e6a8c, rotulo = 'CEN-UNO', chip = 'ATmega328P' } = opts;
  const g = new THREE.Group();
  const met = _s19Cromo(mat);
  const W = 2.7, D = 2.1, T = 0.06;
  const mP = _bmMat(color, 0.50, 0.12);
  const pcb = _bmPlancha(W, D, T, mP, 0.10, 0.012);
  pcb.rotation.x = -Math.PI / 2; pcb.position.y = T / 2; g.add(pcb);
  // serigrafía
  const px = (x) => (x + W / 2) * 150, pz = (z) => (z + D / 2) * 150;
  const ser = _etiqueta(Math.round(W * 150), Math.round(D * 150), (c, w, h) => {
    c.clearRect(0, 0, w, h); c.fillStyle = 'rgba(240,246,250,0.92)'; c.textAlign = 'center'; c.textBaseline = 'middle';
    c.font = 'bold ' + Math.round(h * 0.075) + 'px sans-serif'; c.fillText(rotulo, px(0.45), pz(-0.30));
    c.font = Math.round(h * 0.040) + 'px sans-serif'; c.fillText('DIGITAL (PWM ~)', px(0.45), pz(-0.80)); c.fillText('POWER · ANALOG IN', px(0.25), pz(0.80));
    c.font = Math.round(h * 0.034) + 'px sans-serif'; c.fillText('RESET', px(-0.96), pz(-0.02));
    [['L', 0.0], ['TX', 0.28], ['RX', 0.56], ['ON', 0.84]].forEach(([t, x]) => c.fillText(t, px(x), pz(-0.50)));
    c.strokeStyle = 'rgba(240,246,250,0.7)'; c.lineWidth = 2; c.strokeRect(px(-0.34), pz(0.02), 1.60 * 150, 0.46 * 150);
  });
  const tn = _tinta(ser, W, D); tn.rotation.x = -Math.PI / 2; tn.position.y = T + 0.002; g.add(tn);
  // conectores del costado izquierdo (que mira a −X)
  const usb = _bmCaja(0.62, 0.42, 0.50, met, -W / 2 + 0.22, T + 0.21, -0.52); g.add(usb);
  const usbH = _bmCaja(0.04, 0.26, 0.36, _bmMat(0x090a0c, 0.9, 0), -W / 2 - 0.095, T + 0.21, -0.52); g.add(usbH);
  const dc = _bmCaja(0.56, 0.42, 0.52, _bmMat(0x14161a, 0.6, 0.1), -W / 2 + 0.18, T + 0.21, 0.55); g.add(dc);
  const dcH = _bmCil(0.09, 0.05, _bmMat(0x050607, 0.9, 0), 16); dcH.rotation.z = Math.PI / 2; dcH.position.set(-W / 2 - 0.10, T + 0.22, 0.55); g.add(dcH);
  // cabeceras
  const hd = tiraPines(mat, { n: 18, paso: 0.1, alto: 0.26, pin: 0.10, patas: 0 }); hd.position.set(0.42, T, -D / 2 + 0.11); g.add(hd);
  const ha = tiraPines(mat, { n: 8, paso: 0.1, alto: 0.26, pin: 0.10, patas: 0 }); ha.position.set(0.12 - 0.35, T, D / 2 - 0.11); g.add(ha);
  const hb = tiraPines(mat, { n: 6, paso: 0.1, alto: 0.26, pin: 0.10, patas: 0 }); hb.position.set(0.12 + 0.75, T, D / 2 - 0.11); g.add(hb);
  // chip DIP-28, cristal, reset, regulador, condensadores
  const ic = dipRotulado(mat, { pines: 28, rotulo: chip, rotulo2: 'AVR · 16 MHz', alto: 0.14 }); ic.position.set(0.45, T, 0.25); g.add(ic);
  const cri = _bmCaja(0.40, 0.11, 0.17, _bmMat(0xc9ced3, 0.28, 0.9), -0.50, T + 0.055, 0.12); g.add(cri);
  const rst = _bmCaja(0.22, 0.10, 0.22, _bmMat(0xd8d0b8, 0.5, 0.1), -0.96, T + 0.05, -0.20); g.add(rst);
  const rstB = _bmCil(0.055, 0.04, _bmMat(0x14161a, 0.6, 0.1), 14); rstB.position.set(-0.96, T + 0.115, -0.20); g.add(rstB);
  const reg = _bmCaja(0.22, 0.16, 0.14, _bmMat(0x14161a, 0.6, 0.1), -0.80, T + 0.08, 0.50); g.add(reg);
  const aleta = _bmCaja(0.22, 0.02, 0.10, met, -0.80, T + 0.17, 0.46); g.add(aleta);
  [[-0.55, 0.62], [-0.30, 0.62], [-0.95, -0.62]].forEach(([x, z]) => { const c = _bmCil(0.075, 0.18, _bmMat(0x20262c, 0.5, 0.3), 14); c.position.set(x, T + 0.09, z); g.add(c); });
  // LED ON / L / TX / RX
  const ledOn = _s19Lente(0x6fe39a, 0.035, 0x1d3a28), led13 = _s19Lente(0xe9a23b, 0.035, 0x4a3a1a), ledTx = _s19Lente(0x7aa8ff, 0.035, 0x1d2a4a), ledRx = _s19Lente(0x7aa8ff, 0.035, 0x1d2a4a);
  [[led13, 0.0], [ledTx, 0.28], [ledRx, 0.56], [ledOn, 0.84]].forEach(([l, x]) => { l.rotation.x = -Math.PI / 2; l.position.set(x, T + 0.012, -0.62); g.add(l); });
  ledOn.material.emissiveIntensity = 1.0;
  g.userData = { ancho: W, fondo: D, alto: T, led13, ledTx, ledRx, ledOn, chip: ic,
    pin: (i) => hd.position.clone().add(hd.userData.punta(17 - i)) };
  return g;
}

/**
 * ENCODER ÓPTICO incremental: el DISCO ranurado calado al eje y la HORQUILLA
 * (diodo emisor y fototransistor, uno a cada lado) por donde pasan las ranuras.
 * Eje en X. `userData.disco` es el grupo que gira (rotation.x).
 */
export function encoderOptico(mat, opts = {}) {
  const { d = 0.40, ranuras = 24 } = opts;
  const g = new THREE.Group(), R = d / 2;
  const disco = new THREE.Group(); g.add(disco);
  const hue = [];
  for (let i = 0; i < ranuras; i++) {
    const a0 = (i / ranuras) * Math.PI * 2, a1 = a0 + Math.PI * 2 / ranuras * 0.5;
    const r0 = R * 0.66, r1 = R * 0.92;
    hue.push([[r0 * Math.cos(a0), r0 * Math.sin(a0)], [r1 * Math.cos(a0), r1 * Math.sin(a0)], [r1 * Math.cos(a1), r1 * Math.sin(a1)], [r0 * Math.cos(a1), r0 * Math.sin(a1)]]);
  }
  const circ = Array.from({ length: 48 }, (_, k) => [R * Math.cos(k / 48 * Math.PI * 2), R * Math.sin(k / 48 * Math.PI * 2)]);
  const dm = new THREE.Mesh(extruido(circ, { espesor: 0.014, huecos: hue }), _bmMat(0x20252b, 0.45, 0.4));
  dm.rotation.y = Math.PI / 2; dm.castShadow = true; disco.add(dm);
  const cubo = _bmCil(R * 0.26, 0.05, _s19Cromo(mat), 20); cubo.rotation.z = Math.PI / 2; disco.add(cubo);
  const pu = _bmCaja(0.016, R * 0.10, R * 0.10, _bmMat(0xe9c46a, 0.4, 0.1), 0, R * 0.52, 0); disco.add(pu);
  // horquilla fija: U que abraza la corona de ranuras en la parte alta
  const hq = new THREE.Group(); hq.position.set(0, R * 0.79, 0);
  const mH = _bmMat(0x14171b, 0.55, 0.12);
  const aw = R * 0.18;
  hq.add(_bmCaja(0.02, R * 0.30, aw, mH, -0.03, 0, 0)); hq.add(_bmCaja(0.02, R * 0.30, aw, mH, 0.03, 0, 0));
  hq.add(_bmCaja(0.08, 0.03, aw, mH, 0, R * 0.15 + 0.015, 0));
  const le = _s19Lente(0xff5a4d, 0.008, 0x4a2220); le.rotation.y = Math.PI / 2; le.position.set(-0.019, 0, 0); le.material.emissiveIntensity = 0.9; hq.add(le);
  g.add(hq);
  g.userData = { disco, horquilla: hq, d };
  return g;
}

/* ==========================================================================
   §20 · ARNÉS, CONECTOR MULTIPIN, ECU DE FUNDICIÓN Y MESA DE TALLER
        (mec3d · autotrónica: bus CAN, ECU, fallo de encendido, escáner OBD)
   --------------------------------------------------------------------------
   Lo que el mecánico ve al abrir el capó y no era ninguna caja: el MAZO de
   cables con su funda corrugada y sus vueltas de cinta, el CONECTOR sellado de
   muchos pines con su pestaña de bloqueo, la ECU de aluminio fundido con sus
   aletas y sus orejas de fijación, y la mesa de trabajo sobre la que se
   desmonta todo (tapete antiestático con canto de acero, no una losa gris).
   Convenio: los conectores y la ECU miran a +Z; el mazo se da por los puntos
   por los que tiene que pasar, igual que `manguera`. Todo a la escala del
   laboratorio que llame: las cotas son proporciones de las que se piden.
   ========================================================================== */

const _s20M = (color, rough = 0.6, metal = 0.1, extra = {}) =>
  new THREE.MeshStandardMaterial({ color, roughness: rough, metalness: metal, ...extra });
const _s20Rect = (w, h, r) => contornoRedondeado(
  [[-w / 2, -h / 2], [w / 2, -h / 2], [w / 2, h / 2], [-w / 2, h / 2]], r, 3);

/**
 * CONECTOR SELLADO DE MUCHOS PINES (tipo AMP/Deutsch de automoción). Se
 * reconoce por cuatro cosas: la CAMISA rectangular que abraza al macho, el
 * FONDO con sus cavidades en rejilla, la PESTAÑA DE BLOQUEO encima y, por detrás,
 * el SELLO de silicona azul del que salen los cables. Dentro, dos nervios de
 * polarización asimétricos: es lo que impide enchufarlo del revés.
 *
 * La boca mira a +Z y el origen está en el centro de la caja. `pines:true`
 * pone las espigas doradas dentro de las cavidades; con `false` quedan los
 * agujeros, para que el laboratorio ponga las suyas (con nombre y color).
 *   cols, filas   rejilla de cavidades; `paso` = [px, py] si se quiere fija
 *   cables        cuántos cables salen por detrás (hasta cols·filas)
 * `userData.cara` es la z del fondo de las cavidades, `cavidad(i, j)` su posición
 * (i = columna, j = fila contada desde arriba), `salida` donde nacen los cables.
 */
export function conectorMultipin(mat, opts = {}) {
  const { ancho = 0.52, alto = 0.42, fondo = 0.16, cols = 3, filas = 3, paso = null,
          color = 0x1b2026, sello = 0x3b5b73, llave = 0xd9a21b, palanca = true,
          pines = false, cables = 0,
          colores = [0xc0392b, 0x1a1a1a, 0xd9a21b, 0x2e8b57, 0x2f6fb5, 0xe8e8e8, 0x8a5a2b, 0x7b4ea3, 0xe07b39] } = opts;
  const g = new THREE.Group();
  const mC = _s20M(color, 0.58, 0.12), mI = _s20M(0x06080a, 0.9, 0.04), mS = _s20M(sello, 0.72, 0.02);
  const pw = Math.min(ancho, alto) * 0.075;                 // pared de la camisa
  const zF = fondo / 2, lCam = fondo * 0.60;                // la camisa ocupa la mitad delantera
  const cam = new THREE.Mesh(extruido(_s20Rect(ancho, alto, alto * 0.09),
    { huecos: [_s20Rect(ancho - pw * 2, alto - pw * 2, alto * 0.05)], espesor: lCam, bisel: pw * 0.16 }), mC);
  cam.position.z = zF - lCam / 2; cam.castShadow = cam.receiveShadow = true; g.add(cam);
  // el cuerpo trasero macizo, un punto más pequeño que la camisa
  const lTra = fondo - lCam + pw;
  const tra = new THREE.Mesh(extruido(_s20Rect(ancho * 0.94, alto * 0.90, alto * 0.08), { espesor: lTra, bisel: pw * 0.12 }), mC);
  tra.position.z = -zF + lTra / 2; tra.castShadow = true; g.add(tra);
  // el fondo de la camisa, oscuro, donde nacen las cavidades
  const zI = zF - lCam + pw + 0.003;
  const ins = new THREE.Mesh(extruido(_s20Rect(ancho - pw * 2 + 0.004, alto - pw * 2 + 0.004, alto * 0.05),
    { espesor: pw * 0.5, bisel: 0.0015 }), _s20M(0x101418, 0.8, 0.05));
  ins.position.z = zI - pw * 0.25; g.add(ins);
  // los dos nervios de polarización, asimétricos a propósito
  for (const [sx, k] of [[-1, 0.9], [1, 1.5]]) {
    const n = new THREE.Mesh(new THREE.BoxGeometry(pw * 1.5 * k, pw * 1.1, lCam * 0.72), mC);
    n.position.set(sx * (ancho / 2 - pw * 1.9), alto / 2 - pw * 1.55, zI + lCam * 0.34); g.add(n);
  }
  // la rejilla de cavidades (instanciada: un conector de ECU lleva decenas)
  const px = paso ? paso[0] : (ancho - pw * 2) * 0.84 / Math.max(1, cols);
  const py = paso ? paso[1] : (alto - pw * 2) * 0.78 / Math.max(1, filas);
  const rc = Math.min(px, py) * 0.30;
  const pos = (i, j) => new THREE.Vector3((i - (cols - 1) / 2) * px, ((filas - 1) / 2 - j) * py, zI);
  const nCav = cols * filas, M4 = new THREE.Matrix4();
  const gAro = new THREE.CylinderGeometry(rc * 1.45, rc * 1.45, 0.004, 14); gAro.rotateX(Math.PI / 2);
  const gHue = new THREE.CylinderGeometry(rc, rc, 0.006, 14); gHue.rotateX(Math.PI / 2);
  const aros = new THREE.InstancedMesh(gAro, _s20M(0x242b32, 0.6, 0.15), nCav);
  const hues = new THREE.InstancedMesh(gHue, mI, nCav);
  for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
    const p = pos(i, j), k = j * cols + i;
    M4.makeTranslation(p.x, p.y, p.z + 0.002); aros.setMatrixAt(k, M4);
    M4.makeTranslation(p.x, p.y, p.z + 0.004); hues.setMatrixAt(k, M4);
  }
  g.add(aros); g.add(hues);
  if (pines) {
    const gP = new THREE.CylinderGeometry(rc * 0.42, rc * 0.42, lCam * 0.62, 8); gP.rotateX(Math.PI / 2);
    const ps = new THREE.InstancedMesh(gP, _s20M(0xc9a227, 0.35, 0.85), nCav);
    for (let j = 0; j < filas; j++) for (let i = 0; i < cols; i++) {
      const p = pos(i, j); M4.makeTranslation(p.x, p.y, p.z + lCam * 0.31); ps.setMatrixAt(j * cols + i, M4);
    }
    g.add(ps);
  }
  // la pestaña de bloqueo: un puente con su uña, y el seguro secundario de color
  if (palanca) {
    const lv = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.44, pw * 1.3, lCam * 0.58), mC);
    lv.position.set(0, alto / 2 + pw * 0.55, zF - lCam * 0.40); lv.castShadow = true; g.add(lv);
    const un = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.30, pw * 1.9, lCam * 0.10), mC);
    un.position.set(0, alto / 2 + pw * 0.85, zF - lCam * 0.02); g.add(un);
    const sg = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.16, pw * 0.8, lCam * 0.16), _s20M(llave, 0.55, 0.05));
    sg.position.set(ancho * 0.30, alto / 2 + pw * 0.20, zF - lCam * 0.22); g.add(sg);
  }
  // el sello de silicona y los cables que salen por detrás
  const sel = new THREE.Mesh(extruido(_s20Rect(ancho * 0.80, alto * 0.72, alto * 0.06), { espesor: fondo * 0.12, bisel: 0.004 }), mS);
  sel.position.z = -zF - fondo * 0.05; g.add(sel);
  const nC = Math.min(cables, nCav), rcab = Math.min(px, py) * 0.17;
  for (let k = 0; k < nC; k++) {
    const i = k % cols, j = Math.floor(k / cols);
    const p = pos(i, j);
    const c = new THREE.Mesh(new THREE.CylinderGeometry(rcab, rcab, 0.14, 8), _s20M(colores[k % colores.length], 0.7, 0.02));
    c.rotation.x = Math.PI / 2; c.position.set(p.x * 0.80, p.y * 0.80, -zF - fondo * 0.11 - 0.07); g.add(c);
  }
  g.userData = { ancho, alto, fondo, cara: zI, cavidad: (i, j) => pos(i, j), paso: [px, py], camisa: cam,
                 salida: new THREE.Vector3(0, 0, -zF - fondo * 0.11 - 0.14), cols, filas };
  return g;
}

/**
 * ECU / CENTRALITA de fundición: la caja que se ve bajo el capó o detrás de la
 * guantera. Dos mitades de aluminio fundido —BASE y TAPA— con la JUNTA negra en
 * la unión, las ALETAS de refrigeración de la tapa (que es por donde evacua el
 * calor, sin ventilador), las OREJAS de fijación con su tornillo, la ETIQUETA
 * con su código de barras y, en el frente, uno o dos CONECTORES multipin.
 * Mira a +Z (el conector); las aletas, arriba.
 *   conectores   'auto' (dos conectores de 15 y 12 vías), [] (ninguno: el
 *                laboratorio pone el suyo) o una lista de
 *                { x, y, ancho, alto, cols, filas, paso, fondo, cables }
 *   rotulo       texto de la etiqueta (líneas separadas por \n)
 * `userData.conectores` son los grupos de `conectorMultipin`; `frente` la z de
 * la cara en la que se enchufan.
 */
export function ecuAutomotriz(mat, opts = {}) {
  const { ancho = 0.85, alto = 0.40, fondo = 0.62, aletas = 9, conectores = 'auto',
          rotulo = 'ECM-4C · 12 V\n0 281 0XX XXX' } = opts;
  const g = new THREE.Group();
  const Al = mat.aluminio || mat.acero, Ne = mat.negro || Al;
  const y0 = -alto / 2, hB = alto * 0.52, hT = alto - hB;
  const base = new THREE.Mesh(normalizaUV(extruido(_s20Rect(ancho, hB, alto * 0.07),
    { espesor: fondo, bisel: alto * 0.03 }), 6), Al);
  base.position.y = y0 + hB / 2; base.castShadow = base.receiveShadow = true; g.add(base);
  const tapa = new THREE.Mesh(normalizaUV(extruido(_s20Rect(ancho * 0.975, hT, alto * 0.07),
    { espesor: fondo * 0.975, bisel: alto * 0.03 }), 6), Al);
  tapa.position.y = y0 + hB + hT / 2; tapa.castShadow = true; g.add(tapa);
  // la junta de la unión, que sobresale un pelo por los cuatro lados
  const jun = new THREE.Mesh(new THREE.BoxGeometry(ancho * 1.004, alto * 0.022, fondo * 1.004), Ne);
  jun.position.y = y0 + hB; g.add(jun);
  // las aletas de la tapa, a lo largo del fondo
  for (let i = 0; i < aletas; i++) {
    const a = new THREE.Mesh(new THREE.BoxGeometry(ancho * 0.030, alto * 0.13, fondo * 0.80), Al);
    a.position.set((i - (aletas - 1) / 2) * (ancho * 0.84 / Math.max(1, aletas - 1)), alto / 2 + alto * 0.05, 0);
    a.castShadow = true; g.add(a);
  }
  // las orejas de fijación, cuatro, con su tornillo
  const ear = ancho * 0.10;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const o = new THREE.Group();
    const pl = new THREE.Mesh(extruido(contornoRedondeado(
      [[0, -fondo * 0.10], [ear, -fondo * 0.10], [ear, fondo * 0.10], [0, fondo * 0.10]], ear * 0.35, 3),
      { huecos: [circulo(ear * 0.58, 0, ear * 0.20, 12)], espesor: alto * 0.07, bisel: alto * 0.012 }), Al);
    pl.rotation.x = -Math.PI / 2; pl.castShadow = true; o.add(pl);
    const t = tornilloHex(mat, { d: ear * 0.34, largo: alto * 0.10, arandela: true });
    t.position.set(ear * 0.58, alto * 0.035, 0); o.add(t);
    o.position.set(sx * ancho / 2, y0 + alto * 0.07, sz * fondo * 0.28);
    o.rotation.y = sx < 0 ? Math.PI : 0;
    g.add(o);
  }
  // los conectores del frente
  const lista = conectores === 'auto' ? [
    { x: -ancho * 0.215, ancho: ancho * 0.40, alto: alto * 0.66, cols: 5, filas: 3, cables: 6 },
    { x: ancho * 0.265, ancho: ancho * 0.31, alto: alto * 0.66, cols: 4, filas: 3, cables: 5 }] : conectores;
  const cons = [];
  for (const c of lista) {
    const cf = c.fondo || fondo * 0.30;
    const k = conectorMultipin(mat, { ancho: c.ancho, alto: c.alto, fondo: cf, cols: c.cols, filas: c.filas,
      paso: c.paso || null, cables: c.cables || 0, pines: c.pines || false });
    k.position.set(c.x || 0, c.y || 0, fondo / 2 + cf / 2);
    g.add(k); cons.push(k);
  }
  // la etiqueta del fabricante, en el costado derecho, con su código de barras
  if (rotulo) {
    const tex = _etiqueta(256, 112, (c, w, h) => {
      c.fillStyle = '#d9dde0'; c.fillRect(0, 0, w, h);
      c.fillStyle = '#14181e'; c.textAlign = 'left'; c.textBaseline = 'top'; c.font = 'bold 22px sans-serif';
      rotulo.split('\n').forEach((l, i) => c.fillText(l, 12, 10 + i * 26));
      for (let x = 12, i = 0; x < w - 12; i++) { const a = 2 + ((i * 7) % 4); c.fillRect(x, 70, a, 30); x += a + 2 + (i % 3); }
    });
    const et = new THREE.Mesh(new THREE.PlaneGeometry(fondo * 0.62, fondo * 0.62 * 112 / 256),
      new THREE.MeshStandardMaterial({ map: tex, roughness: 0.6, metalness: 0.1 }));
    et.rotation.y = Math.PI / 2; et.position.set(ancho / 2 + 0.002, y0 + hB + hT * 0.5, fondo * 0.04); g.add(et);
  }
  g.userData = { ancho, alto, fondo, conectores: cons, frente: fondo / 2 };
  return g;
}

/**
 * MAZO DE CABLES: un haz de hilos de colores que sigue una curva, con tramos
 * cubiertos por FUNDA CORRUGADA (anillos que se ven de lado: es lo que distingue
 * un mazo de «un cable gordo»), VUELTAS DE CINTA y, en los extremos, los hilos
 * sueltos de colores listos para entrar al conector. Se da por los puntos por
 * los que pasa, como `manguera`.
 *   r        radio del haz;   colores   un hilo por color
 *   funda    tramos cubiertos, en fracción de la longitud: [[u0, u1], ...]
 *   cinta    posiciones (0…1) de las vueltas de cinta
 *   torcido  vueltas que da el haz sobre sí mismo en todo el tramo
 * `userData.curva` es la trayectoria y `punto(u)` / `tangente(u)` la leen.
 */
export function arnes(mat, puntos, opts = {}) {
  const { colores = [0xc0392b, 0x1a1a1a, 0xd9a21b, 0x2e8b57, 0x2f6fb5, 0xe8e8e8], r = 0.05,
          funda = [[0.16, 0.84]], cinta = [], torcido = 0, seg = 90, colorFunda = 0x14181c } = opts;
  const g = new THREE.Group();
  const P = puntos.map(p => p.isVector3 ? p : new THREE.Vector3(p[0], p[1], p[2]));
  const curva = new THREE.CatmullRomCurve3(P);
  const N = colores.length, fr = curva.computeFrenetFrames(seg, false);
  const ro = N > 1 ? r * 0.50 : 0;
  const rw = N > 1 ? Math.min(r * 0.46, ro * Math.sin(Math.PI / N) * 0.95) : r * 0.8;
  for (let k = 0; k < N; k++) {
    const q = [];
    for (let i = 0; i <= seg; i++) {
      const t = i / seg, a = (k / N) * Math.PI * 2 + torcido * t * Math.PI * 2;
      q.push(curva.getPointAt(t).clone()
        .addScaledVector(fr.normals[i], Math.cos(a) * ro).addScaledVector(fr.binormals[i], Math.sin(a) * ro));
    }
    const m = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q), seg, rw, 6, false),
      _s20M(colores[k], 0.7, 0.02));
    m.castShadow = true; g.add(m);
  }
  const Rf = r * 1.18, mF = _s20M(colorFunda, 0.78, 0.05), Z = new THREE.Vector3(0, 0, 1);
  const largo = curva.getLength();
  const trozo = (u0, u1, rad, mm, n = 30) => {
    const q = []; for (let i = 0; i <= n; i++) q.push(curva.getPointAt(u0 + (u1 - u0) * i / n).clone());
    const t = new THREE.Mesh(new THREE.TubeGeometry(new THREE.CatmullRomCurve3(q), n, rad, 12, false), mm);
    t.castShadow = true; return t;
  };
  for (const [u0, u1] of funda) {
    g.add(trozo(u0, u1, Rf, mF));
    const sp = Rf * 0.62, nA = Math.max(2, Math.floor(largo * (u1 - u0) / sp));
    const aro = new THREE.InstancedMesh(new THREE.TorusGeometry(Rf * 1.0, Rf * 0.11, 5, 14), mF, nA + 1);
    const M4 = new THREE.Matrix4(), Q = new THREE.Quaternion();
    for (let i = 0; i <= nA; i++) {
      const u = u0 + (u1 - u0) * i / nA;
      Q.setFromUnitVectors(Z, curva.getTangentAt(u).normalize());
      M4.compose(curva.getPointAt(u), Q, new THREE.Vector3(1, 1, 1)); aro.setMatrixAt(i, M4);
    }
    g.add(aro);
  }
  for (const u of cinta) g.add(trozo(Math.max(0, u - 0.012), Math.min(1, u + 0.012), Rf * 1.12, _s20M(0xb9a15a, 0.8, 0.02), 6));
  g.userData = { curva, longitud: largo, punto: (u) => curva.getPointAt(u), tangente: (u) => curva.getTangentAt(u) };
  return g;
}

/**
 * MESA DE TALLER (la mesa de trabajo de un laboratorio de diagnóstico): chapa de
 * acero con su canto, TAPETE ANTIESTÁTICO de goma con el grano de rombos que
 * llevan todos, y cuatro patas de goma. El origen está en el centro de la cara
 * del tapete (y = 0); el cuerpo queda por debajo. Sustituye a la losa gris.
 */
export function mesaTaller(mat, opts = {}) {
  const { ancho = 5.2, fondo = 3.0, grueso = 0.14, tapete = 0x24332f, canto = 0x8d96a0 } = opts;
  const g = new THREE.Group();
  const ch = new THREE.Mesh(extruido(_s20Rect(ancho, fondo, 0.10), { espesor: grueso, bisel: 0.014 }),
    _s20M(canto, 0.42, 0.78));
  ch.rotation.x = -Math.PI / 2; ch.position.y = -grueso / 2 - 0.012; ch.castShadow = ch.receiveShadow = true; g.add(ch);
  const tex = _etiqueta(128, 128, (c, w, h) => {
    c.fillStyle = '#e6e6e6'; c.fillRect(0, 0, w, h);
    c.fillStyle = '#c4c4c4';
    for (let y = 0; y < 8; y++) for (let x = 0; x < 8; x++) {
      const cx = x * 16 + 8, cy = y * 16 + 8;
      c.beginPath(); c.moveTo(cx, cy - 6); c.lineTo(cx + 6, cy); c.lineTo(cx, cy + 6); c.lineTo(cx - 6, cy); c.closePath(); c.fill();
    }
  });
  tex.wrapS = tex.wrapT = THREE.RepeatWrapping; tex.repeat.set(ancho * 4, fondo * 4);
  const mt = new THREE.Mesh(extruido(_s20Rect(ancho - 0.26, fondo - 0.26, 0.07), { espesor: 0.024, bisel: 0.006 }),
    new THREE.MeshStandardMaterial({ color: tapete, map: tex, roughness: 0.85, metalness: 0.0 }));
  mt.rotation.x = -Math.PI / 2; mt.position.y = -0.006; mt.receiveShadow = true; g.add(mt);
  // la regleta de acero atornillada al canto delantero
  const rg = new THREE.Mesh(new THREE.BoxGeometry(ancho - 0.5, 0.012, 0.05), _s20M(0xb7bec6, 0.35, 0.85));
  rg.position.set(0, 0.0, fondo / 2 - 0.10); g.add(rg);
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const p = new THREE.Mesh(new THREE.CylinderGeometry(0.11, 0.13, 0.05, 14), mat.goma || _s20M(0x0f1216, 0.94, 0));
    p.position.set(sx * (ancho / 2 - 0.34), -grueso - 0.04, sz * (fondo / 2 - 0.34)); g.add(p);
  }
  g.userData = { ancho, fondo, grueso, cara: 0 };
  return g;
}
