/**
 * mat06/geometria.ts — geometrías del taller que se pueden probar en jest (sólo three).
 *
 *  - La pieza de vidrio: el polígono PIEZA extruido SIN bisel, centrado en z, con tres
 *    grupos de material: 0 = cara de delante (+z), 1 = dorso (−z), 2 = cantos. Al voltear
 *    la pieza en una reflexión se ve el dorso: la orientación invertida se VE.
 *  - Su huella plana (la sombra ortogonal sobre el vidrio): un rectángulo que cubre la
 *    pieza con margen, sobre el que va la silueta difuminada.
 */
import * as THREE from 'three';
import { PIEZA, cajaDe } from './transformaciones';

/** Pieza de vidrio extruida (grupos: 0 frente, 1 dorso, 2 cantos). */
export function geometriaPieza(grosor: number): THREE.BufferGeometry {
  const forma = new THREE.Shape(PIEZA.map(([x, y]) => new THREE.Vector2(x, y)));
  const g = new THREE.ExtrudeGeometry(forma, { depth: grosor, bevelEnabled: false, curveSegments: 1 });
  g.translate(0, 0, -grosor / 2);
  // ExtrudeGeometry: grupo 0 = tapas (primero la de abajo, z = 0, y luego la de arriba), grupo 1 = cantos
  const grupos = g.groups.slice();
  g.clearGroups();
  for (const gr of grupos) {
    if (gr.materialIndex === 0) {
      const mitad = gr.count / 2;
      g.addGroup(gr.start, mitad, 1);
      g.addGroup(gr.start + mitad, mitad, 0);
    } else g.addGroup(gr.start, gr.count, 2);
  }
  g.computeBoundingSphere();
  return g;
}

/** Margen (u de la pieza) de la huella difuminada alrededor de la pieza. */
export const MARGEN_HUELLA = 0.55;
/** Caja de la huella en coordenadas de la pieza: [x0, y0, x1, y1]. */
export function cajaHuella(): [number, number, number, number] {
  const c = cajaDe(PIEZA);
  return [c.x0 - MARGEN_HUELLA, c.y0 - MARGEN_HUELLA, c.x1 + MARGEN_HUELLA, c.y1 + MARGEN_HUELLA];
}

/** Rectángulo de la huella (z = 0, UV de 0 a 1 sobre la caja). */
export function geometriaHuella(): THREE.BufferGeometry {
  const [x0, y0, x1, y1] = cajaHuella();
  const g = new THREE.PlaneGeometry(x1 - x0, y1 - y0);
  g.translate((x0 + x1) / 2, (y0 + y1) / 2, 0);
  return g;
}

/** Cuenta mallas y normales nulas de una escena (una normal nula deja la pantalla negra). */
export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number } {
  let mallas = 0, normalesCero = 0;
  o.traverse((x) => {
    const m = x as THREE.Mesh;
    if (!m.isMesh) return;
    mallas++;
    const n = (m.geometry as THREE.BufferGeometry | undefined)?.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero };
}
