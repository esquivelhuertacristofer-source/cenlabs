/**
 * bio03/instancias.ts — geometrías compartidas y matrices de instancia (three).
 *
 * Todo lo numeroso (fosfatos, azúcares, bases, NTP libres, cuentas del péptido) va en
 * InstancedMesh: una llamada de dibujo por tipo de pieza. Aquí, las geometrías unitarias
 * y cómo se coloca cada instancia sin cuaterniones (base ortonormal + escala).
 */
import * as THREE from 'three';
import { RoundedBoxGeometry } from 'three/examples/jsm/geometries/RoundedBoxGeometry.js';
import { geoCache, sanearNormales } from '../_kit';
import type { Malla } from './superficie';
import type { V3 } from './molecular';

export const geoEsfera = (alta: boolean) => geoCache(`bio03:esf:${alta ? 'a' : 'm'}`, () => sanearNormales(new THREE.SphereGeometry(1, alta ? 12 : 9, alta ? 8 : 6)));
/** Losa de base nitrogenada: caja redondeada unitaria (largo x, grosor y, ancho z). */
export const geoLosa = () => geoCache('bio03:losa', () => sanearNormales(new RoundedBoxGeometry(1, 1, 1, 1, 0.22)));
export const geoVarilla = () => geoCache('bio03:varilla', () => sanearNormales(new THREE.CylinderGeometry(1, 1, 1, 8, 1)));

/** BufferGeometry de una superficie molecular. */
export function geometriaDeMalla(m: Malla): THREE.BufferGeometry {
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.BufferAttribute(m.posiciones, 3));
  g.setAttribute('normal', new THREE.BufferAttribute(m.normales, 3));
  // los colores de la malla están en sRGB (hex); el atributo de color va en lineal
  const lin = new Float32Array(m.colores.length);
  for (let i = 0; i < lin.length; i++) { const c = m.colores[i]; lin[i] = c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4); }
  g.setAttribute('color', new THREE.BufferAttribute(lin, 3));
  g.setIndex(new THREE.BufferAttribute(m.indices, 1));
  g.computeBoundingSphere();
  return g;
}

const _x = new THREE.Vector3(), _y = new THREE.Vector3(), _z = new THREE.Vector3(), _p = new THREE.Vector3();

/**
 * Losa de `a` (anclaje en el azúcar) a `b` (punta), con su grosor a lo largo de `arriba`
 * (el eje de la hélice o del ARN) y su ancho en la tercera dirección.
 */
export function matrizLosa(m: THREE.Matrix4, a: V3, b: V3, arriba: V3, grosor: number, ancho: number): THREE.Matrix4 {
  _x.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = Math.max(0.05, _x.length());
  _x.multiplyScalar(1 / L);
  _y.set(arriba[0], arriba[1], arriba[2]);
  _y.addScaledVector(_x, -_y.dot(_x));
  if (_y.lengthSq() < 1e-8) _y.set(0, 1, 0).addScaledVector(_x, -_x.y);
  _y.normalize();
  _z.crossVectors(_x, _y);
  m.makeBasis(_x.multiplyScalar(L), _y.multiplyScalar(grosor), _z.multiplyScalar(ancho));
  m.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return m;
}

/** Cuenta (esfera) de radio r en p. */
export function matrizCuenta(m: THREE.Matrix4, p: V3, r: number): THREE.Matrix4 {
  m.makeScale(r, r, r);
  m.setPosition(p[0], p[1], p[2]);
  return m;
}

/** Varilla (cilindro) de radio r entre a y b. */
export function matrizVarilla(m: THREE.Matrix4, a: V3, b: V3, r: number): THREE.Matrix4 {
  _y.set(b[0] - a[0], b[1] - a[1], b[2] - a[2]);
  const L = Math.max(1e-4, _y.length());
  _y.multiplyScalar(1 / L);
  _x.set(1, 0, 0);
  if (Math.abs(_y.x) > 0.9) _x.set(0, 0, 1);
  _z.crossVectors(_x, _y).normalize();
  _x.crossVectors(_y, _z).normalize();
  m.makeBasis(_x.multiplyScalar(r), _y.multiplyScalar(L), _z.multiplyScalar(r));
  m.setPosition((a[0] + b[0]) / 2, (a[1] + b[1]) / 2, (a[2] + b[2]) / 2);
  return m;
}

/** Instancia escondida (escala 0). */
export const OCULTA = new THREE.Matrix4().makeScale(0, 0, 0);

/** Aplica una matriz de grupo (rotación + traslación) a un punto. */
export function transformar(p: V3, m: THREE.Matrix4): V3 {
  _p.set(p[0], p[1], p[2]).applyMatrix4(m);
  return [_p.x, _p.y, _p.z];
}
