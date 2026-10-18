/**
 * mat05/luz.ts — la LUZ del instrumento, con sombreadores propios y baratos (sin three
 * de alto nivel: `Cinta` y `Destellos` son objetos imperativos que la escena reescribe
 * en su useFrame, una vez por cuadro, con el estado del reloj).
 *
 *  - CINTA: polilíneas de luz como tiras orientadas a la cámara, continuas en los vértices
 *    (dirección media prev→next), con perfil gaussiano: núcleo nítido + halo suave. Ancho
 *    mínimo de 0,7 px de núcleo y 2 px de halo para que no parpadeen al alejarse. Varias
 *    polilíneas por cinta, cada una con su brillo por vértice (rastro que se desvanece).
 *  - DESTELLOS: puntos que emiten (el punto del círculo, la pluma de la onda, la punta de
 *    los epiciclos): un sprite con núcleo gaussiano y corona.
 *
 * Todo es aditivo y no escribe profundidad: la luz se suma sobre el vidrio y el latón.
 * En calidad alta el posproceso añade un bloom moderado SÓLO a lo que pasa de 1 (HDR).
 */
import * as THREE from 'three';

const VERT_CINTA = /* glsl */ `
attribute vec3 aPrev;
attribute vec3 aNext;
attribute float aLado;
attribute float aBrillo;
uniform float uPxMundo;
uniform float uNucleo;
uniform float uHalo;
varying float vX;
varying float vSigN;
varying float vSigH;
varying float vBrillo;
void main() {
  vec3 P = (modelMatrix * vec4(position, 1.0)).xyz;
  vec3 A = (modelMatrix * vec4(aPrev, 1.0)).xyz;
  vec3 B = (modelMatrix * vec4(aNext, 1.0)).xyz;
  vec3 d = B - A;
  if (dot(d, d) < 1e-14) d = vec3(1.0, 0.0, 0.0);
  d = normalize(d);
  vec3 aCam = cameraPosition - P;
  float dist = max(1e-4, length(aCam));
  vec3 lado = cross(d, aCam / dist);
  float L = length(lado);
  lado = L > 1e-5 ? lado / L : vec3(0.0, 1.0, 0.0);
  float px = uPxMundo * dist;
  float sigN = max(uNucleo, 0.7 * px);
  float sigH = max(uHalo, 2.0 * px);
  float W = 3.0 * sigH;
  vX = aLado * W; vSigN = sigN; vSigH = sigH; vBrillo = aBrillo;
  gl_Position = projectionMatrix * viewMatrix * vec4(P + lado * aLado * W, 1.0);
}`;

const FRAG_CINTA = /* glsl */ `
uniform vec3 uColor;
uniform float uKn;
uniform float uKh;
uniform float uNucleo;
varying float vX;
varying float vSigN;
varying float vSigH;
varying float vBrillo;
void main() {
  float x = vX;
  // si el núcleo se ensancha hasta el píxel mínimo, baja su pico (no inventa luz)
  float k = mix(1.0, uNucleo / vSigN, 0.6);
  float p = uKn * k * exp(-0.5 * x * x / (vSigN * vSigN)) + uKh * exp(-0.5 * x * x / (vSigH * vSigH));
  gl_FragColor = vec4(uColor * p * vBrillo, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

const aditivo = { transparent: true, depthWrite: false, depthTest: true, blending: THREE.AdditiveBlending } as const;

export interface OpcionesCinta {
  /** color lineal (puede pasar de 1: HDR para el bloom) */
  color: THREE.ColorRepresentation;
  intensidad?: number;
  /** σ del núcleo y del halo, en unidades de escena */
  nucleo?: number;
  halo?: number;
  /** pesos del núcleo y del halo */
  kn?: number;
  kh?: number;
  /** puntos máximos (todas las polilíneas juntas) */
  capacidad: number;
  orden?: number;
}

/** Varias polilíneas de luz en una sola llamada de dibujo. */
export class Cinta {
  readonly mesh: THREE.Mesh;
  readonly material: THREE.ShaderMaterial;
  private readonly geo: THREE.BufferGeometry;
  private readonly cap: number;
  private readonly pos: THREE.BufferAttribute;
  private readonly prev: THREE.BufferAttribute;
  private readonly next: THREE.BufferAttribute;
  private readonly brillo: THREE.BufferAttribute;
  private readonly indices: Uint32Array;
  private readonly idx: THREE.BufferAttribute;

  constructor(o: OpcionesCinta) {
    this.cap = o.capacidad;
    const nV = this.cap * 2;
    const g = new THREE.BufferGeometry();
    this.pos = new THREE.BufferAttribute(new Float32Array(nV * 3), 3);
    this.prev = new THREE.BufferAttribute(new Float32Array(nV * 3), 3);
    this.next = new THREE.BufferAttribute(new Float32Array(nV * 3), 3);
    this.brillo = new THREE.BufferAttribute(new Float32Array(nV), 1);
    const lado = new Float32Array(nV);
    for (let i = 0; i < nV; i++) lado[i] = i % 2 === 0 ? -1 : 1;
    [this.pos, this.prev, this.next, this.brillo].forEach((a) => a.setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('position', this.pos);
    g.setAttribute('aPrev', this.prev);
    g.setAttribute('aNext', this.next);
    g.setAttribute('aBrillo', this.brillo);
    g.setAttribute('aLado', new THREE.BufferAttribute(lado, 1));
    this.indices = new Uint32Array(Math.max(1, this.cap - 1) * 6);
    this.idx = new THREE.BufferAttribute(this.indices, 1);
    this.idx.setUsage(THREE.DynamicDrawUsage);
    g.setIndex(this.idx);
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    this.geo = g;
    const c = new THREE.Color(o.color).multiplyScalar(o.intensidad ?? 1);
    this.material = new THREE.ShaderMaterial({
      vertexShader: VERT_CINTA, fragmentShader: FRAG_CINTA, ...aditivo,
      uniforms: {
        uColor: { value: c }, uPxMundo: { value: 0.001 }, uNucleo: { value: o.nucleo ?? 0.006 }, uHalo: { value: o.halo ?? 0.03 },
        uKn: { value: o.kn ?? 1.6 }, uKh: { value: o.kh ?? 0.22 },
      },
    });
    this.mesh = new THREE.Mesh(g, this.material);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = o.orden ?? 10;
  }

  /** Color lineal × intensidad. */
  color(c: THREE.ColorRepresentation, intensidad = 1) {
    (this.material.uniforms.uColor.value as THREE.Color).set(c).multiplyScalar(intensidad);
  }

  /** Tamaño de un píxel en el mundo a distancia 1 (para el ancho mínimo). */
  pixel(px: number) { this.material.uniforms.uPxMundo.value = px; }

  /**
   * Reescribe las polilíneas: cada una es [x, y, z, x, y, z, …]; `brillos[i]` (opcional)
   * da el brillo de cada uno de sus puntos (por defecto 1).
   */
  fijar(lineas: ArrayLike<number>[], brillos?: (ArrayLike<number> | number | undefined)[]) {
    const P = this.pos.array as Float32Array, A = this.prev.array as Float32Array, B = this.next.array as Float32Array;
    const L = this.brillo.array as Float32Array;
    let v = 0, ni = 0;
    for (let li = 0; li < lineas.length; li++) {
      const pts = lineas[li];
      const n = Math.floor(pts.length / 3);
      if (n < 2 || v / 2 + n > this.cap) continue;
      const br = brillos?.[li];
      const base = v;
      for (let i = 0; i < n; i++) {
        const ip = Math.max(0, i - 1), inx = Math.min(n - 1, i + 1);
        const b = br == null ? 1 : typeof br === 'number' ? br : br[i] ?? 1;
        for (let s = 0; s < 2; s++) {
          const o = (v + s) * 3;
          P[o] = pts[i * 3]; P[o + 1] = pts[i * 3 + 1]; P[o + 2] = pts[i * 3 + 2];
          A[o] = pts[ip * 3]; A[o + 1] = pts[ip * 3 + 1]; A[o + 2] = pts[ip * 3 + 2];
          B[o] = pts[inx * 3]; B[o + 1] = pts[inx * 3 + 1]; B[o + 2] = pts[inx * 3 + 2];
          L[v + s] = b;
        }
        v += 2;
      }
      for (let i = 0; i < n - 1; i++) {
        const a = base + i * 2;
        this.indices[ni++] = a; this.indices[ni++] = a + 1; this.indices[ni++] = a + 2;
        this.indices[ni++] = a + 2; this.indices[ni++] = a + 1; this.indices[ni++] = a + 3;
      }
    }
    this.pos.needsUpdate = true; this.prev.needsUpdate = true; this.next.needsUpdate = true; this.brillo.needsUpdate = true;
    this.idx.needsUpdate = true;
    this.geo.setDrawRange(0, ni);
  }

  dispose() { this.geo.dispose(); this.material.dispose(); }
}

// ───────────────────────────── destellos ─────────────────────────────

const VERT_DESTELLO = /* glsl */ `
attribute vec3 aC;
attribute vec3 aRgb;
attribute vec3 aQ; // esquina (x, y) y tamaño
varying vec3 vRgb;
varying vec2 vQ;
void main() {
  vec4 mv = viewMatrix * vec4(aC, 1.0);
  mv.xy += aQ.xy * aQ.z;
  vRgb = aRgb; vQ = aQ.xy;
  gl_Position = projectionMatrix * mv;
}`;
const FRAG_DESTELLO = /* glsl */ `
varying vec3 vRgb;
varying vec2 vQ;
void main() {
  float d2 = dot(vQ, vQ);
  float f = 1.6 * exp(-d2 * 26.0) + 0.5 * exp(-d2 * 7.0) + 0.12 * exp(-d2 * 2.0);
  f *= 1.0 - smoothstep(0.8, 1.0, sqrt(d2));
  gl_FragColor = vec4(vRgb * f, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`;

export interface Destello { p: [number, number, number]; rgb: [number, number, number]; tam: number }

/** Puntos que emiten luz (sprites aditivos), una sola llamada de dibujo. */
export class Destellos {
  readonly mesh: THREE.Mesh;
  private readonly geo: THREE.BufferGeometry;
  private readonly mat: THREE.ShaderMaterial;
  private readonly cap: number;

  constructor(capacidad: number) {
    this.cap = capacidad;
    const g = new THREE.BufferGeometry();
    const nV = capacidad * 4;
    g.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aC', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aRgb', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    g.setAttribute('aQ', new THREE.BufferAttribute(new Float32Array(nV * 3), 3));
    const idx: number[] = [];
    for (let i = 0; i < capacidad; i++) { const b = i * 4; idx.push(b, b + 1, b + 2, b + 2, b + 1, b + 3); }
    g.setIndex(idx);
    g.setDrawRange(0, 0);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    this.geo = g;
    this.mat = new THREE.ShaderMaterial({ vertexShader: VERT_DESTELLO, fragmentShader: FRAG_DESTELLO, ...aditivo });
    this.mesh = new THREE.Mesh(g, this.mat);
    this.mesh.frustumCulled = false;
    this.mesh.renderOrder = 20;
  }

  fijar(ds: Destello[]) {
    const n = Math.min(this.cap, ds.length);
    const pos = this.geo.getAttribute('position') as THREE.BufferAttribute;
    const C = this.geo.getAttribute('aC') as THREE.BufferAttribute, R = this.geo.getAttribute('aRgb') as THREE.BufferAttribute;
    const Q = this.geo.getAttribute('aQ') as THREE.BufferAttribute;
    const esq = [[-1, -1], [1, -1], [-1, 1], [1, 1]];
    for (let i = 0; i < n; i++) {
      const d = ds[i];
      for (let k = 0; k < 4; k++) {
        const v = i * 4 + k;
        pos.setXYZ(v, d.p[0], d.p[1], d.p[2]);
        C.setXYZ(v, d.p[0], d.p[1], d.p[2]);
        R.setXYZ(v, d.rgb[0], d.rgb[1], d.rgb[2]);
        Q.setXYZ(v, esq[k][0], esq[k][1], d.tam);
      }
    }
    [pos, C, R, Q].forEach((a) => { a.needsUpdate = true; });
    this.geo.setDrawRange(0, n * 6);
  }

  dispose() { this.geo.dispose(); this.mat.dispose(); }
}
