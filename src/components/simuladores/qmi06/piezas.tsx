"use client";
/**
 * Q6 · Solubilidad y cristalización — piezas propias del montaje.
 *
 *   CristalesCama  los cristales que quedan sin disolver en el fondo del vaso, con el HÁBITO real
 *                  de cada sal (instanciados):
 *                    KNO₃   agujas prismáticas alargadas (ortorrómbico)
 *                    NaCl   cubos (cúbico)
 *                    CuSO₄  prismas romboidales azules (CuSO₄·5H₂O, triclínico)
 *                    KClO₃  láminas hexagonales delgadas (monoclínico)
 *   DENSIDAD_SAL   densidad del sólido (g/mL) para convertir masa precipitada en volumen de cama.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import { useMateriales, geoCache, tornear, azar, type P2 } from '../_kit';

type GroupProps = ThreeElements['group'];

export type SalId = 'kno3' | 'nacl' | 'cuso4' | 'kclo3';

export const DENSIDAD_SAL: Record<SalId, number> = { kno3: 2.11, nacl: 2.16, cuso4: 2.29, kclo3: 2.34 };
export const MAX_CRISTALES = 260;

/** Geometría unitaria (≈ 1 u de largo mayor) del hábito de cada sal. */
function geoHabito(id: SalId): THREE.BufferGeometry {
  return geoCache(`q6hab:${id}`, () => {
    switch (id) {
      case 'kno3': {
        // aguja prismática hexagonal con extremos piramidales: radio 0,11, largo 1
        const p: P2[] = [[0.0005, -0.5], [0.11, -0.4], [0.11, 0.4], [0.0005, 0.5]];
        return tornear(p, 6);
      }
      case 'nacl': {
        const g = new THREE.BoxGeometry(0.62, 0.62, 0.62);
        return g;
      }
      case 'cuso4': {
        // prisma oblicuo: caja cizallada (cristal triclínico, caras no ortogonales)
        const g = new THREE.BoxGeometry(0.78, 0.5, 0.42);
        const sh = new THREE.Matrix4().set(1, 0.32, 0.18, 0, 0, 1, 0.22, 0, 0, 0, 1, 0, 0, 0, 0, 1);
        g.applyMatrix4(sh);
        g.computeVertexNormals();
        return g;
      }
      default: {
        // lámina hexagonal delgada
        const p: P2[] = [[0.0005, -0.05], [0.5, -0.05], [0.5, 0.05], [0.0005, 0.05]];
        return tornear(p, 6);
      }
    }
  });
}

const COLOR_CRISTAL: Record<SalId, string> = { kno3: '#f3f5f6', nacl: '#f7f6f1', cuso4: '#2c78cf', kclo3: '#eef3f2' };
/** Tamaño característico (u) de un cristal «tipo» de cada sal. */
const TAM_BASE: Record<SalId, number> = { kno3: 0.2, nacl: 0.075, cuso4: 0.11, kclo3: 0.15 };
/** Volumen relativo de la geometría unitaria respecto de un cubo de lado 1 (para ajustar la cama). */
const VOL_UNIDAD: Record<SalId, number> = { kno3: 0.04, nacl: 0.24, cuso4: 0.16, kclo3: 0.05 };

/**
 * Cama de cristales en el fondo de un vaso de radio interior `radio` (origen: centro del fondo
 * interior). `masaG` = gramos de sal SIN disolver. El volumen aparente de la cama es
 * masa/densidad/0,55 (empaquetado), repartido en N cristales de tamaño uniforme.
 */
export function CristalesCama({ sal, masaG, radio, ...g }: GroupProps & { sal: SalId; masaG: number; radio: number }) {
  const m = useMateriales();
  const ref = useRef<THREE.InstancedMesh>(null);
  const geo = geoHabito(sal);
  const mat = useMemo(() => {
    const base = COLOR_CRISTAL[sal];
    return sal === 'cuso4' ? m.plastico(base, 0.18) : m.plastico(base, 0.3);
  }, [sal, m]);

  // volumen de sólido (u³; 1 u³ = 1 L) y cantidad de cristales
  const vSolido = masaG > 0.02 ? masaG / DENSIDAD_SAL[sal] / 1000 : 0;
  const tam0 = TAM_BASE[sal];
  const v1 = VOL_UNIDAD[sal] * tam0 ** 3;
  const n = vSolido > 0 ? Math.min(MAX_CRISTALES, Math.max(2, Math.round(vSolido / v1))) : 0;
  const tam = n > 0 ? Math.cbrt(vSolido / n / VOL_UNIDAD[sal]) : tam0;
  const alto = n > 0 ? Math.min(0.62, (vSolido / 0.55) / (Math.PI * radio * radio)) : 0;

  useLayoutEffect(() => {
    const im = ref.current; if (!im) return;
    const rnd = azar(1000 + sal.length * 97 + sal.charCodeAt(0));
    const o = new THREE.Object3D();
    const R = Math.max(0.05, radio - tam * 0.7);
    for (let i = 0; i < MAX_CRISTALES; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * R;
      // la cama sube con el índice: los primeros tapizan el fondo, los últimos la coronan
      const h = Math.max(0, alto - tam) * Math.pow(i / Math.max(1, n), 0.8) * (0.7 + 0.3 * rnd());
      o.position.set(Math.cos(a) * r, tam * 0.4 + h, Math.sin(a) * r);
      o.rotation.set((rnd() - 0.5) * 2.6, rnd() * Math.PI * 2, (rnd() - 0.5) * 2.6);
      const k = tam * (0.8 + 0.4 * rnd());
      o.scale.set(k, k, k);
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    }
    im.count = n;
    im.instanceMatrix.needsUpdate = true;
  }, [sal, n, tam, alto, radio]);
  useEffect(() => () => { /* geometría y material compartidos: se liberan con el kit */ }, []);

  return (
    <group {...g}>
      <instancedMesh key={sal} ref={ref} args={[geo, mat, MAX_CRISTALES]} castShadow frustumCulled={false} />
    </group>
  );
}
