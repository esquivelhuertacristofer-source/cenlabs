/** Utilidades de geometría compartidas por los labs de matemáticas 1 a 5. */
import * as THREE from 'three';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';

/** Une varias barras (segmentos [ax,ay,az,bx,by,bz] con un radio) en UNA geometría. */
export function geometriaBarras(barras: [number, number, number, number, number, number][], radio: number, segs = 5): THREE.BufferGeometry {
  const partes = barras.map(([ax, ay, az, bx, by, bz]) => {
    const a = new THREE.Vector3(ax, ay, az), b = new THREE.Vector3(bx, by, bz);
    const d = b.clone().sub(a), l = d.length();
    const g = new THREE.CylinderGeometry(radio, radio, l, segs, 1);
    const q = new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 1, 0), d.normalize());
    g.applyMatrix4(new THREE.Matrix4().compose(a.clone().add(b).multiplyScalar(0.5), q, new THREE.Vector3(1, 1, 1)));
    return g;
  });
  const u = mergeGeometries(partes, false)!;
  partes.forEach((p) => p.dispose());
  return u;
}
