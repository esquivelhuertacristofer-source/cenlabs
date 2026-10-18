"use client";
/**
 * qmi10/piezas.tsx — las piezas de la columna de destilación, a escala real (1 u = 10 cm;
 * la mesa en y = 0; +Z mira al alumno; el eje de la columna en x = z = 0).
 *
 *  · COLUMNA DN80 DE VIDRIO en MEDIA SECCIÓN: el plano z = 0 la corta y se conserva la mitad
 *    trasera. Todo lo de acero (platos, campanas con sus ranuras, chimeneas, vertederos,
 *    faldones, bridas y tornillos) es UNA malla fusionada recortada por ese plano; sus caras
 *    traseras que asoman por el corte son la SECCIÓN: tono del acero oscurecido con rayado fino
 *    a 45° que se funde por debajo de 3 px (la técnica de los planos de taller).
 *  · LÍQUIDOS: otra malla fusionada (líquido sobre cada plato, cortina que cae por el vertedero,
 *    líquido retenido en cada bajante y el reflujo que entra al plato 1). Un sombreador la tiñe
 *    por ETAPA con el código de composición y la llena con el nivel de cada etapa.
 *  · CABEZA con divisor de reflujo (embudo de PTFE que bascula con un electroimán), vaina del
 *    Pt100, brazo de toma con llave hacia el receptor; CONDENSADOR DIMROTH con su serpentín de
 *    agua; HERVIDOR (balón de 1 L en una manta); RECEPTOR graduado de 250 mL en su repisa;
 *    alimentación con bomba peristáltica; bastidor y caja de control (sin cifras: los números
 *    van en el dock).
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mergeGeometries } from 'three/examples/jsm/utils/BufferGeometryUtils.js';
import {
  tornear, cilindro, esfera, extruir, cajaRedondeada, formaRectRedondeado, toro, tuboPolilinea, sanearNormales,
  crearLienzo, texturaDeLienzo, useMateriales, type Calidad, type P2,
} from '../_kit';
import { N_PLATOS } from './columna';
import {
  COL, yPlato, ladoVertedero, CAMPANAS, BALON, MANTA, GATO, CABEZA, CONDENSADOR, PUNTA_CONDENSADOR, EMBUDO,
  RECEPTOR, PUNTA_TOMA, Y_CODO_TOMA, BOMBA, FRASCO_ALIM, BASTIDOR, CONTROL, alturaEnEsfera, type V3,
} from './cotas';

type GroupProps = ThreeElements['group'];

/** El plano del corte: se conserva z ≤ 0 (three conserva la distancia con signo positiva). */
export const PLANO_CORTE = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0);
const PLANOS = [PLANO_CORTE];

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsQ10 {
  mesa: THREE.MeshPhysicalMaterial;
  aceroCorte: THREE.MeshStandardMaterial;
  ptfeCorte: THREE.MeshStandardMaterial;
  vidrioCorte: THREE.Material;
  canto: THREE.MeshStandardMaterial;
  acero: THREE.MeshStandardMaterial;
  ptfe: THREE.MeshPhysicalMaterial;
  pintura: THREE.MeshPhysicalMaterial;
  carcasa: THREE.MeshPhysicalMaterial;
  negro: THREE.MeshPhysicalMaterial;
  cobre: THREE.MeshStandardMaterial;
  tela: THREE.MeshStandardMaterial;
  refrigerante: THREE.MeshPhysicalMaterial;
  gota: THREE.MeshPhysicalMaterial;
  burbuja: THREE.MeshPhysicalMaterial;
  manguera: THREE.MeshPhysicalMaterial;
  ledNaranja: THREE.MeshStandardMaterial;
  ledVerde: THREE.MeshStandardMaterial;
  ledApagado: THREE.MeshStandardMaterial;
}

function texturasMesa(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#15181b'; c.fillRect(0, 0, S, S);
  o.fillStyle = `rgb(0, ${Math.round(0.5 * 255)}, 0)`; o.fillRect(0, 0, S, S);
  let sem = 9011;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  // manchas MUY suaves de baja frecuencia (resina epoxi): nada de grano
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.18 + rnd() * 0.3);
    const claro = rnd() > 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(48,54,60,0.3)' : 'rgba(10,12,14,0.3)'); g.addColorStop(1, 'rgba(30,35,40,0)');
      c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      const h = o.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      const v = Math.round((claro ? 0.42 : 0.58) * 255);
      h.addColorStop(0, `rgba(0,${v},0,0.45)`); h.addColorStop(1, `rgba(0,${v},0,0)`);
      o.fillStyle = h; o.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  const rep: [number, number] = [2, 1.2];
  return { mapa: texturaDeLienzo(col, { repetir: rep }), rug: texturaDeLienzo(rug, { srgb: false, repetir: rep }) };
}

/**
 * Material recortado por el plano z = 0: cara delantera normal; la trasera que asoma por el
 * corte es la SECCIÓN (tono oscurecido, rayado a 45° en el plano del corte, x + y).
 */
function conSeccion<T extends THREE.MeshStandardMaterial>(m: T, colorSeccion: string, paso: number, clave: string): T {
  m.side = THREE.DoubleSide;
  m.clippingPlanes = PLANOS;
  m.clipShadows = true;
  const uni = { uSeccionQ10: { value: new THREE.Color(colorSeccion) }, uPasoQ10: { value: paso } };
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMundoQ10;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 pmQ10 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          pmQ10 = instanceMatrix * pmQ10;
        #endif
        vMundoQ10 = (modelMatrix * pmQ10).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMundoQ10; uniform vec3 uSeccionQ10; uniform float uPasoQ10;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      if (!gl_FrontFacing) {
        float u = (vMundoQ10.x + vMundoQ10.y) / uPasoQ10;
        float fw = fwidth(u);
        float t = min(fract(u), 1.0 - fract(u));
        // la raya se funde cuando el paso baja de ~3 px
        float linea = (1.0 - smoothstep(0.14 - fw, 0.14 + fw, t)) * (1.0 - smoothstep(0.2, 0.34, fw));
        vec3 tapa = mix(uSeccionQ10, uSeccionQ10 * 0.7, linea);
        gl_FragColor = vec4(tapa, 1.0);
        #include <colorspace_fragment>
      }`);
  };
  m.customProgramCacheKey = () => 'q10-seccion-' + clave;
  return m;
}

export function useMatsQ10(calidad: Calidad): MatsQ10 {
  const tex = useMemo(() => texturasMesa(calidad), [calidad]);
  const m = useMemo<MatsQ10>(() => {
    const alta = calidad === 'alta';
    const vidrioCorte: THREE.Material = alta
      ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.05, transmission: 1, thickness: 0.03, ior: 1.47,
        specularIntensity: 1, envMapIntensity: 1.35, attenuationColor: new THREE.Color('#e6f4f0'), attenuationDistance: 1.2,
        side: THREE.DoubleSide, clippingPlanes: PLANOS, clipShadows: true, name: 'q10-vidrio-corte',
      })
      : new THREE.MeshPhysicalMaterial({
        color: '#a9bcc0', metalness: 0, roughness: 0.06, transparent: true, opacity: 0.16, depthWrite: false,
        envMapIntensity: 1.6, side: THREE.DoubleSide, clippingPlanes: PLANOS, name: 'q10-vidrio-corte-media',
      });
    return {
      mesa: new THREE.MeshPhysicalMaterial({
        color: '#ffffff', map: tex?.mapa ?? null, roughnessMap: tex?.rug ?? null, roughness: 1, metalness: 0,
        clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.42, envMapIntensity: 0.45, name: 'q10-mesa',
      }),
      // acero inoxidable de los platos: satinado, sin ruido (el corte lleva su rayado)
      aceroCorte: conSeccion(new THREE.MeshStandardMaterial({ color: '#c5cace', metalness: 1, roughness: 0.3, envMapIntensity: 1.1, name: 'q10-acero-corte' }), '#5d656c', 0.028, 'acero'),
      ptfeCorte: conSeccion(new THREE.MeshStandardMaterial({ color: '#efefea', metalness: 0, roughness: 0.42, name: 'q10-ptfe-corte' }), '#b9b8b1', 0.02, 'ptfe'),
      vidrioCorte,
      // canto pulido del vidrio cortado: lo que hace legible la pared contra el fondo oscuro
      canto: new THREE.MeshStandardMaterial({ color: '#a9cdd4', emissive: '#7fb8c8', emissiveIntensity: 0.12, roughness: 0.25, metalness: 0, transparent: true, opacity: 0.7, name: 'q10-canto' }),
      acero: new THREE.MeshStandardMaterial({ color: '#c9ccce', metalness: 1, roughness: 0.34, name: 'q10-acero' }),
      ptfe: new THREE.MeshPhysicalMaterial({ color: '#f4f4f1', metalness: 0, roughness: 0.38, sheen: alta ? 0.4 : 0, sheenColor: new THREE.Color('#ffffff'), name: 'q10-ptfe' }),
      // pintura en polvo grafito (bastidor, bomba)
      pintura: new THREE.MeshPhysicalMaterial({ color: '#2b333c', metalness: 0.25, roughness: 0.5, clearcoat: alta ? 0.3 : 0, clearcoatRoughness: 0.45, name: 'q10-pintura' }),
      carcasa: new THREE.MeshPhysicalMaterial({ color: '#46505a', metalness: 0, roughness: 0.46, clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.45, name: 'q10-carcasa' }),
      negro: new THREE.MeshPhysicalMaterial({ color: '#17191c', metalness: 0, roughness: 0.4, clearcoat: alta ? 0.5 : 0, name: 'q10-negro' }),
      cobre: new THREE.MeshStandardMaterial({ color: '#c9774a', metalness: 1, roughness: 0.32, name: 'q10-cobre' }),
      // tejido de fibra de vidrio de la manta: brilla con el calor (lo único que emite, con los pilotos)
      tela: new THREE.MeshStandardMaterial({ color: '#d6ccb6', roughness: 0.95, metalness: 0, emissive: new THREE.Color('#ff5a14'), emissiveIntensity: 0, name: 'q10-tela' }),
      // agua del serpentín (opaca a la transmisión: así se ve a través de la camisa)
      refrigerante: new THREE.MeshPhysicalMaterial({ color: '#7fc3e6', metalness: 0, roughness: 0.08, clearcoat: 1, clearcoatRoughness: 0.05, envMapIntensity: 1.4, name: 'q10-refrigerante' }),
      gota: new THREE.MeshPhysicalMaterial({ color: '#ffffff', metalness: 0, roughness: 0.04, clearcoat: 1, clearcoatRoughness: 0.02, envMapIntensity: 1.8, name: 'q10-gota' }),
      burbuja: new THREE.MeshPhysicalMaterial({
        color: '#f4fbff', metalness: 0, roughness: 0.05, clearcoat: 1, transparent: true, opacity: 0.85,
        envMapIntensity: 2.2, depthWrite: false, name: 'q10-burbuja',
      }),
      manguera: new THREE.MeshPhysicalMaterial({ color: '#4f6f80', metalness: 0, roughness: 0.55, name: 'q10-manguera' }),
      ledNaranja: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#ff7a1a', emissiveIntensity: 3, roughness: 0.4, name: 'q10-led-n' }),
      ledVerde: new THREE.MeshStandardMaterial({ color: '#000000', emissive: '#3dff9a', emissiveIntensity: 2.6, roughness: 0.4, name: 'q10-led-v' }),
      ledApagado: new THREE.MeshStandardMaterial({ color: '#2a2f33', roughness: 0.5, name: 'q10-led-off' }),
    };
  }, [calidad, tex]);
  useEffect(() => () => {
    Object.values(m).forEach((x) => { if (x instanceof THREE.Material) x.dispose(); });
    tex?.mapa.dispose(); tex?.rug.dispose();
  }, [m, tex]);
  return m;
}

// ───────────────────────────── utilidades de geometría ─────────────────────────────

/** Lámina horizontal: forma en (x, z) extruida hacia +y desde y0. */
function losa(puntos: [number, number][], y0: number, alto: number, huecos: [number, number, number][] = []): THREE.BufferGeometry {
  const s = new THREE.Shape(puntos.map(([x, z]) => new THREE.Vector2(x, -z)));
  for (const [cx, cz, r] of huecos) {
    const h = new THREE.Path();
    h.absarc(cx, -cz, r, 0, Math.PI * 2, true);
    s.holes.push(h);
  }
  const g = extruir(s, alto, 20);
  g.rotateX(-Math.PI / 2);
  g.translate(0, y0, 0);
  return g;
}

/** Arco de la pared entre dos x (z ≤ 0 si `atras`), de x0 a x1. */
function arcoPared(R: number, x0: number, x1: number, n: number, atras = true): [number, number][] {
  const p: [number, number][] = [];
  for (let i = 0; i <= n; i++) {
    const x = x0 + ((x1 - x0) * i) / n;
    const z = Math.sqrt(Math.max(0, R * R - x * x));
    p.push([x, atras ? -z : z]);
  }
  return p;
}

/** Perfil cerrado para un torno sólido (repite el primer punto al final). */
const cerrado = (p: P2[]): P2[] => [...p, p[0]];
/** Perfil cerrado de aristas vivas: cada vértice repetido, así el torno sombrea cada cara plana (sin degradados falsos). */
const duro = (p: P2[]): P2[] => cerrado(p).flatMap((q) => [q, q]);

function trasladar(g: THREE.BufferGeometry, p: V3): THREE.BufferGeometry { g.translate(p[0], p[1], p[2]); return g; }

/** Pico del embudo en sus dos posiciones (pivote y = yEmbudo, brazo de 0,14 u girado ±ángulo). */
const PICO = (lado: number): V3 => [lado * 0.14 * Math.sin(EMBUDO.angulo), CABEZA.yEmbudo - 0.14 * Math.cos(EMBUDO.angulo), 0];
const COPA_REFLUJO: V3 = [PICO(-1)[0] - 0.01, PICO(-1)[1] - 0.06, 0];
const COPA_TOMA: V3 = [PICO(1)[0] + 0.01, PICO(1)[1] - 0.05, 0];

function sinIndice(g: THREE.BufferGeometry): THREE.BufferGeometry {
  const n = g.index ? g.toNonIndexed() : g;
  if (!n.getAttribute('uv')) n.setAttribute('uv', new THREE.BufferAttribute(new Float32Array(n.getAttribute('position').count * 2), 2));
  return n;
}

function fusionar(partes: THREE.BufferGeometry[]): THREE.BufferGeometry {
  const g = mergeGeometries(partes.map(sinIndice), false)!;
  sanearNormales(g);
  g.computeBoundingSphere();
  return g;
}

/** Una pieza = [geometría (se clona), posición, giro XYZ]. */
type Parte = [THREE.BufferGeometry, V3?, V3?];
const _m4 = new THREE.Matrix4(), _q = new THREE.Quaternion(), _e = new THREE.Euler(), _p = new THREE.Vector3(), _s = new THREE.Vector3(1, 1, 1);
/** Junta varias piezas del mismo material en una sola malla (una llamada de dibujo). */
function juntar(partes: Parte[]): THREE.BufferGeometry {
  return fusionar(partes.map(([g, pos, rot]) => {
    const c = g.clone();
    const r = rot ?? [0, 0, 0], q = pos ?? [0, 0, 0];
    _e.set(r[0], r[1], r[2]); _q.setFromEuler(_e); _p.set(q[0], q[1], q[2]);
    return c.applyMatrix4(_m4.compose(_p, _q, _s));
  }));
}
/** Geometría juntada que se libera al desmontar. */
function useJuntar(crear: () => Parte[], deps: unknown[]): THREE.BufferGeometry {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const g = useMemo(() => juntar(crear()), deps);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

// ───────────────────────────── campana de burbujeo ─────────────────────────────

/** Campana de 13 mm con 12 ranuras, su chimenea y la base, todo en coordenadas del plato. */
function geoCampana(segs: number): THREE.BufferGeometry {
  const rc = COL.rCampana, ri = rc - 0.006, rch = COL.rChimenea;
  const partes: THREE.BufferGeometry[] = [];
  // chimenea (tubo de subida que atraviesa el plato)
  partes.push(tornear(duro([[rch - 0.006, -0.022], [rch, -0.022], [rch, 0.105], [rch - 0.006, 0.105]]), segs));
  // casquete: faldón superior y cúpula
  partes.push(tornear(cerrado([
    [ri, 0.075], [rc, 0.075], [rc, 0.148], [rc - 0.012, 0.165], [0.04, COL.hCampana], [0.0005, COL.hCampana],
    [0.0005, COL.hCampana - 0.008], [0.036, COL.hCampana - 0.009], [ri - 0.01, 0.157], [ri, 0.145],
  ]), segs));
  // dientes entre ranuras (12): pequeños bloques curvos del faldón
  const nD = 12;
  for (let k = 0; k < nD; k++) {
    const a = ((k + 0.5) / nD) * Math.PI * 2;
    const ancho = 2 * rc * Math.sin((0.5 * Math.PI) / nD) * 0.95;
    const b = new THREE.BoxGeometry(0.006, 0.054, ancho);
    b.translate(rc - 0.003, 0.048, 0);
    b.rotateY(-a);
    partes.push(b);
  }
  return fusionar(partes);
}

// ───────────────────────────── la columna: acero ─────────────────────────────

/** Platos, campanas, vertederos con su faldón, bridas con tornillos y los tubos interiores (una malla). */
function geoInternos(segs: number): { acero: THREE.BufferGeometry; ptfe: THREE.BufferGeometry } {
  const acero: THREE.BufferGeometry[] = [];
  const ptfe: THREE.BufferGeometry[] = [];
  const R = COL.rInt - 0.002, xw = COL.xVertedero;
  const camp = geoCampana(segs);
  const fi0 = Math.acos(xw / R);
  for (let n = 1; n <= N_PLATOS; n++) {
    const y = yPlato(n), s = ladoVertedero(n);
    // cubierta del plato: el disco sin el segmento de la bajante, con los agujeros de las chimeneas
    const pts: [number, number][] = [];
    const nA = 56;
    for (let i = 0; i <= nA; i++) {
      // s = +1: φ de φ0 a 2π − φ0 (x ≤ xw); s = −1: de −(π − φ0) a π − φ0 (x ≥ −xw)
      const f = s > 0 ? fi0 + ((2 * Math.PI - 2 * fi0) * i) / nA : -(Math.PI - fi0) + ((2 * (Math.PI - fi0)) * i) / nA;
      pts.push([R * Math.cos(f), R * Math.sin(f)]);
    }
    acero.push(losa(pts, y - 0.02, 0.02, CAMPANAS.map(([cx, cz]) => [cx, cz, COL.rChimenea - 0.001] as [number, number, number])));
    // campanas
    for (const [cx, cz] of CAMPANAS) { const c = camp.clone(); c.translate(cx, y, cz); acero.push(c); }
    // vertedero y faldón de la bajante (una chapa vertical en la cuerda)
    const zc = Math.sqrt(R * R - (xw + 0.012) ** 2) - 0.004;
    const yTop = y + COL.hVertedero, yBot = y - COL.espaciado + COL.holguraFaldon;
    const ybot = n === N_PLATOS ? COL.yBase + 0.12 : yBot;
    const chapa = new THREE.BoxGeometry(0.012, yTop - ybot, 2 * zc);
    chapa.translate(s * (xw + 0.006), (yTop + ybot) / 2, 0);
    acero.push(chapa);
    // bridas QVF: dos aros de acero con la junta de PTFE en medio, y 8 tornillos
    const rI = COL.rExt + 0.003, rE = COL.bridaREx, h = COL.bridaAlto / 2;
    acero.push(tornear(duro([[rI, y - 0.006 - h], [rE, y - 0.006 - h], [rE, y - 0.006], [rI, y - 0.006]]), segs * 2));
    acero.push(tornear(duro([[rI, y + 0.006], [rE, y + 0.006], [rE, y + 0.006 + h], [rI, y + 0.006 + h]]), segs * 2));
    ptfe.push(tornear(duro([[R + 0.002, y - 0.006], [rE - 0.025, y - 0.006], [rE - 0.025, y + 0.006], [R + 0.002, y + 0.006]]), segs * 2));
    for (let k = 0; k < 8; k++) {
      const a = ((k + 0.5) / 8) * Math.PI * 2;
      const b = cilindro(0.016, 0.016, 2 * h + 0.07, 10).clone();
      b.translate(Math.cos(a) * (rE - 0.06), y, Math.sin(a) * (rE - 0.06));
      acero.push(b);
      for (const sy of [-1, 1]) {
        const tu = cilindro(0.03, 0.03, 0.022, 6).clone();
        tu.translate(Math.cos(a) * (rE - 0.06), y + sy * (h + 0.017), Math.sin(a) * (rE - 0.06));
        acero.push(tu);
      }
    }
  }
  // bridas de los extremos (adaptador del balón y reducción de la cabeza)
  for (const y of [COL.yBase, COL.yTope]) {
    acero.push(tornear(duro([[COL.rExt + 0.003, y - 0.04], [COL.bridaREx, y - 0.04], [COL.bridaREx, y + 0.04], [COL.rExt + 0.003, y + 0.04]]), segs * 2));
  }
  // tubo de reflujo: del embudo baja a la zona de entrada del plato 1 (detrás del corte)
  acero.push(tuboPolilinea([...COPA_REFLUJO.map((v, i) => (i === 1 ? v - 0.04 : v)), COPA_REFLUJO[0], COL.yTope + 0.3, -0.03, -0.28, COL.yTope + 0.05, -0.13, -0.335, yPlato(1) + 0.62, -0.13, -0.335, yPlato(1) + 0.48, -0.13], 0.018, 12, true));
  // copa de PTFE que recoge el retorno y canalón hacia el brazo de toma (cortados por el plano)
  ptfe.push(trasladar(tornear(duro([[0.016, -0.05], [0.026, -0.05], [0.05, 0.03], [0.042, 0.03], [0.016, -0.03]]), segs), COPA_REFLUJO));
  ptfe.push(tuboPolilinea([COPA_TOMA[0], COPA_TOMA[1], 0, CABEZA.rInt + 0.01, CABEZA.ySalida, 0], 0.022, 12, true));
  // tubo de alimentación interior (de la boquilla a la zona de entrada del plato 3)
  acero.push(tuboPolilinea([-COL.rExt - 0.08, yPlato(3) + 0.5, -0.12, -0.345, yPlato(3) + 0.5, -0.12, -0.345, yPlato(3) + 0.44, -0.12], 0.018, 12, true));
  camp.dispose();
  return { acero: fusionar(acero), ptfe: fusionar(ptfe) };
}

// ───────────────────────────── la columna: líquidos ─────────────────────────────

/** Atributos por vértice del líquido: etapa (color y nivel), base (para escalar el nivel) y cortina. */
function marcar(g: THREE.BufferGeometry, etapa: number, base: number, flujo: number) {
  const n = sinIndice(g);
  const c = n.getAttribute('position').count;
  n.setAttribute('aEtapa', new THREE.BufferAttribute(new Float32Array(c).fill(etapa), 1));
  n.setAttribute('aBaseY', new THREE.BufferAttribute(new Float32Array(c).fill(base), 1));
  n.setAttribute('aFlujo', new THREE.BufferAttribute(new Float32Array(c).fill(flujo), 1));
  return n;
}

function geoLiquidos(): THREE.BufferGeometry {
  const partes: THREE.BufferGeometry[] = [];
  const RL = COL.rInt - 0.006, xw = COL.xVertedero, xb = xw + 0.013;
  for (let n = 1; n <= N_PLATOS; n++) {
    const y = yPlato(n), s = ladoVertedero(n);
    // líquido sobre el plato: entre las dos cuerdas, mitad trasera
    const zx = Math.sqrt(RL * RL - xw * xw);
    const losaPlato: [number, number][] = [[-xw, 0], [xw, 0], [xw, -zx], ...arcoPared(RL, xw, -xw, 28).slice(1, -1), [-xw, -zx]];
    partes.push(marcar(losa(losaPlato, y, COL.hLiquido), n, y, 0));
    // la cortina que cae por el vertedero hasta el líquido de la bajante
    const yPie = n === N_PLATOS ? COL.yBase + 0.14 : yPlato(n + 1) + COL.hBajante;
    const yCae = y + COL.hLiquido;
    const cort = new THREE.BoxGeometry(0.014, yCae - yPie, 0.27, 1, 12, 1);
    cort.translate(s * (xb + 0.009), (yCae + yPie) / 2, -0.145);
    partes.push(marcar(cort, n, yPie, 1));
    // líquido retenido en la bajante (sobre el plato de abajo, del lado del vertedero)
    if (n < N_PLATOS) {
      const zb = Math.sqrt(RL * RL - xb * xb);
      const p: [number, number][] = s > 0
        ? [[xb, 0], [RL, 0], ...arcoPared(RL, RL, xb, 16).slice(1, -1), [xb, -zb]]
        : [[-RL, 0], [-xb, 0], [-xb, -zb], ...arcoPared(RL, -xb, -RL, 16).slice(1, -1)];
      partes.push(marcar(losa(p, yPlato(n + 1), COL.hBajante), n, yPlato(n + 1), 0));
    }
  }
  // el reflujo que entra al plato 1 (etapa 0: el condensado de la cabeza)
  {
    const s1 = ladoVertedero(1), y = yPlato(1), zb = Math.sqrt(RL * RL - xb * xb);
    const p: [number, number][] = s1 > 0
      ? [[-RL, 0], [-xb, 0], [-xb, -zb], ...arcoPared(RL, -xb, -RL, 16).slice(1, -1)]
      : [[xb, 0], [RL, 0], ...arcoPared(RL, RL, xb, 16).slice(1, -1), [xb, -zb]];
    partes.push(marcar(losa(p, y, COL.hLiquido), 0, y, 0));
  }
  const g = mergeGeometries(partes, false)!;
  g.computeBoundingSphere();
  return g;
}

export const MAX_ETAPAS_Q10 = 8;

/** Uniformes del líquido de los platos: color y nivel por etapa, y el tiempo de la cortina. */
export function crearUniformesLiquido() {
  return {
    uColorEtapaQ10: { value: Array.from({ length: MAX_ETAPAS_Q10 }, () => new THREE.Color('#d9d2b8')) },
    uNivelQ10: { value: new Array(MAX_ETAPAS_Q10).fill(1) as number[] },
    uTiempoQ10: { value: 0 },
    /** etapa que la escalera del dock está dibujando (−1: ninguna) y su pulso 0–1 */
    uResaltadoQ10: { value: -1 },
    uPulsoQ10: { value: 0 },
  };
}
export type UniformesLiquido = ReturnType<typeof crearUniformesLiquido>;

/** Líquido translúcido de los platos (PBR, un solo programa): color por etapa y nivel por etapa. */
export function crearMaterialLiquido(u: UniformesLiquido, calidad: Calidad): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: '#ffffff', metalness: 0, roughness: 0.16, clearcoat: calidad === 'alta' ? 0.7 : 0, clearcoatRoughness: 0.1,
    transparent: true, opacity: 0.62, depthWrite: false, envMapIntensity: 1, name: 'q10-liquido-platos',
  });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
        attribute float aEtapa; attribute float aBaseY; attribute float aFlujo;
        uniform float uNivelQ10[${MAX_ETAPAS_Q10}];
        varying float vEtapaQ10; varying float vFlujoQ10; varying float vYQ10; varying float vNivelQ10; varying float vArribaQ10;`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
        float nvQ10 = uNivelQ10[int(aEtapa + 0.5)];
        if (aFlujo < 0.5) transformed.y = aBaseY + (transformed.y - aBaseY) * max(nvQ10, 0.002);
        vEtapaQ10 = aEtapa; vFlujoQ10 = aFlujo; vYQ10 = transformed.y; vNivelQ10 = nvQ10; vArribaQ10 = step(0.5, normal.y);`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform vec3 uColorEtapaQ10[${MAX_ETAPAS_Q10}];
        uniform float uTiempoQ10; uniform float uResaltadoQ10; uniform float uPulsoQ10;
        varying float vEtapaQ10; varying float vFlujoQ10; varying float vYQ10; varying float vNivelQ10; varying float vArribaQ10;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec3 colQ10 = uColorEtapaQ10[int(vEtapaQ10 + 0.5)];
        diffuseColor.rgb = colQ10;
        // las caras laterales, más transparentes que la superficie: se lee como líquido, no como bloque
        diffuseColor.a *= step(0.02, vNivelQ10) * mix(0.5, 1.0, vArribaQ10);
        if (vFlujoQ10 > 0.5) {
          // la cortina: estrías que bajan con el caudal
          float r = 0.5 + 0.5 * sin(vYQ10 * 64.0 + uTiempoQ10 * 7.0);
          diffuseColor.a *= vNivelQ10 * (0.45 + 0.4 * r);
        }`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        float resQ10 = (1.0 - step(0.5, abs(vEtapaQ10 - uResaltadoQ10))) * uPulsoQ10;
        totalEmissiveRadiance += colQ10 * (0.18 + 0.12 * vArribaQ10 + 0.55 * resQ10);`);
  };
  m.customProgramCacheKey = () => 'q10-liquido-' + calidad;
  return m;
}

/** La columna: vidrio cortado con sus cantos, el acero, el PTFE y los líquidos. */
export function Columna({ mats, matLiquido, calidad }: { mats: MatsQ10; matLiquido: THREE.Material; calidad: Calidad }) {
  const segs = calidad === 'alta' ? 40 : 24;
  const internos = useMemo(() => geoInternos(segs), [segs]);
  useEffect(() => () => { internos.acero.dispose(); internos.ptfe.dispose(); }, [internos]);
  const liquidos = useMemo(() => geoLiquidos(), []);
  useEffect(() => () => liquidos.dispose(), [liquidos]);
  // el cuerpo de vidrio entero: cono que entra en el cuello del balón, adaptador, columna, reducción y cabeza
  const vidrio = useMemo(() => {
    const t = 0.012;
    const ext: P2[] = [[BALON.rCuelloInt - 0.004, 1.98], [BALON.rCuelloInt - 0.004, BALON.yBoca], [COL.rExt, COL.yBase + 0.02], [COL.rExt, COL.yTope - 0.02], [CABEZA.rExt, CABEZA.yReduccion], [CABEZA.rExt, CABEZA.yTope]];
    const int: P2[] = [[CABEZA.rInt, CABEZA.yTope], [CABEZA.rInt, CABEZA.yReduccion], [COL.rInt, COL.yTope - 0.02 - t], [COL.rInt, COL.yBase + 0.02 + t], [BALON.rCuelloInt - 0.004 - t, BALON.yBoca], [BALON.rCuelloInt - 0.004 - t, 1.98]];
    return tornear(cerrado([...ext, ...int]), calidad === 'alta' ? 72 : 40);
  }, [calidad]);
  useEffect(() => () => vidrio.dispose(), [vidrio]);
  // cantos pulidos del corte (las dos aristas del vidrio en z = 0, en la columna y en la cabeza)
  const cantos = useMemo(() => {
    const p: THREE.BufferGeometry[] = [];
    for (const sx of [-1, 1]) {
      const a = new THREE.BoxGeometry(COL.rExt - COL.rInt, COL.yTope - COL.yBase - 0.06, 0.004);
      a.translate(sx * (COL.rInt + COL.rExt) / 2, (COL.yTope + COL.yBase) / 2, -0.002);
      p.push(a);
      const b = new THREE.BoxGeometry(CABEZA.rExt - CABEZA.rInt, CABEZA.yTope - CABEZA.yReduccion, 0.004);
      b.translate(sx * (CABEZA.rInt + CABEZA.rExt) / 2, (CABEZA.yTope + CABEZA.yReduccion) / 2, -0.002);
      p.push(b);
    }
    return fusionar(p);
  }, []);
  useEffect(() => () => cantos.dispose(), [cantos]);
  return (
    <group userData={{ pieza: 'columna' }}>
      <mesh geometry={internos.acero} material={mats.aceroCorte} castShadow receiveShadow userData={{ pieza: 'platos' }} />
      <mesh geometry={internos.ptfe} material={mats.ptfeCorte} />
      <mesh geometry={vidrio} material={mats.vidrioCorte} renderOrder={3} />
      <mesh geometry={cantos} material={mats.canto} />
      <mesh geometry={liquidos} material={matLiquido} renderOrder={6} userData={{ pieza: 'liquido' }} />
    </group>
  );
}

// ───────────────────────────── cabeza: divisor de reflujo ─────────────────────────────

/** Embudo de PTFE basculante (origen: pivote). `angulo()` 0 = retorno, 1 = toma. */
export function EmbudoDivisor({ mats, posicion }: { mats: MatsQ10; posicion: () => number }) {
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => tornear(cerrado([[0.012, -0.14], [0.02, -0.14], [0.022, -0.05], [0.085, 0.09], [0.078, 0.095], [0.016, -0.045], [0.012, -0.05]]), 32), []);
  useEffect(() => () => geo.dispose(), [geo]);
  useFrame(() => {
    const g = ref.current; if (!g) return;
    // retorno: el pico mira a la izquierda (al tubo de reflujo); toma: a la derecha (al brazo)
    g.rotation.z = -EMBUDO.angulo * (1 - 2 * posicion());
  });
  return (
    <group position={[0, CABEZA.yEmbudo, 0]}>
      <group ref={ref} userData={{ pieza: 'embudo' }}>
        <mesh geometry={geo} material={mats.ptfe} />
        {/* brazo con el núcleo de hierro encapsulado en vidrio (lo atrae el electroimán) */}
        <mesh geometry={cilindro(0.008, 0.008, 0.2, 10)} material={mats.acero} position={[-0.1, 0.0, 0]} rotation-z={Math.PI / 2} />
        <mesh geometry={esfera(0.028, 14)} material={mats.negro} position={[-0.19, 0, 0]} scale={[1.5, 1, 1]} />
      </group>
      {/* eje del pivote */}
      <mesh geometry={cilindro(0.01, 0.01, 0.3, 10)} material={mats.acero} rotation-x={Math.PI / 2} position={[0, 0, -0.06]} />
    </group>
  );
}

/** Electroimán del divisor (fuera de la cabeza, a la izquierda). */
export function Electroiman({ mats, activo }: { mats: MatsQ10; activo: () => boolean }) {
  const led = useRef<THREE.Mesh>(null);
  const bob = useMemo(() => {
    const p: P2[] = [];
    for (let i = 0; i <= 8; i++) { const t = i / 8; p.push([0.07 + 0.006 * Math.sin(Math.PI * t), -0.11 + 0.22 * t]); }
    return tornear(cerrado([[0.03, -0.11], ...p, [0.03, 0.11]]), 28);
  }, []);
  useEffect(() => () => bob.dispose(), [bob]);
  const tapas = useJuntar(() => [[cilindro(0.085, 0.085, 0.02, 24), [0, 0.12, 0]], [cilindro(0.085, 0.085, 0.02, 24), [0, -0.12, 0]]], []);
  useFrame(() => { if (led.current) led.current.material = activo() ? mats.ledVerde : mats.ledApagado; });
  return (
    <group position={[-CABEZA.rExt - 0.13, CABEZA.yEmbudo + 0.02, -0.02]} rotation-z={Math.PI / 2} userData={{ pieza: 'electroiman' }}>
      <mesh geometry={bob} material={mats.cobre} />
      <mesh geometry={tapas} material={mats.negro} />
      <mesh ref={led} geometry={esfera(0.014, 10)} material={mats.ledApagado} position={[0.09, 0.0, 0.05]} />
    </group>
  );
}

/** Vidrio que sale de la cabeza: brazo de toma con su llave, cuello del Pt100 (un solo vidrio). */
export function VidrioCabeza({ mats }: { mats: MatsQ10 }) {
  const m = useMateriales();
  const a = CABEZA.anguloSalida;
  const x0 = CABEZA.rExt - 0.01, y0 = CABEZA.ySalida, xb = PUNTA_TOMA[0];
  const yLlave = PUNTA_TOMA[1] + 0.28;
  const vidrio = useJuntar(() => [
    [tuboPolilinea([
      x0, y0, 0, xb - 0.07, y0 - (xb - 0.07 - x0) * Math.tan(a), 0, xb - 0.015, Y_CODO_TOMA - 0.035, 0, xb, Y_CODO_TOMA - 0.09, 0, xb, PUNTA_TOMA[1], 0,
    ], 0.034, 18, false)],
    [tuboPolilinea([-0.12, 7.28, 0, -0.42, 7.6, 0], 0.05, 18, false)],
    [cilindro(0.05, 0.05, 0.13, 20), [xb, yLlave, 0], [Math.PI / 2, 0, 0]],
  ], [x0, y0, xb, a, yLlave]);
  // llave de PTFE del brazo de toma
  const llave = useJuntar(() => [
    [cilindro(0.032, 0.026, 0.2, 16), [xb, yLlave, 0], [Math.PI / 2, 0, 0]],
    [cajaRedondeada(0.03, 0.12, 0.03, 0.01, 2), [xb, yLlave, 0.12]],
  ], [xb, yLlave]);
  const vaina = useMemo(() => tuboPolilinea([-0.52, 7.71, 0, ...CABEZA.puntaTermometro], 0.011, 10, true), []);
  useEffect(() => () => vaina.dispose(), [vaina]);
  return (
    <group>
      <mesh geometry={vidrio} material={m.vidrio} renderOrder={3} userData={{ pieza: 'toma' }} />
      <mesh geometry={llave} material={mats.ptfe} userData={{ pieza: 'toma' }} />
      {/* vaina del Pt100: punta en el vapor que sube al condensador */}
      <group userData={{ pieza: 'termometro' }}>
        <mesh geometry={vaina} material={mats.acero} />
        <mesh geometry={cilindro(0.04, 0.04, 0.12, 16)} material={mats.negro} position={[-0.56, 7.75, 0]} rotation-z={0.82} />
      </group>
    </group>
  );
}

// ───────────────────────────── condensador Dimroth ─────────────────────────────

/** Camisa de vidrio con el serpentín de agua por dentro; punta de goteo abajo. */
export function CondensadorDimroth({ mats }: { mats: MatsQ10 }) {
  const m = useMateriales();
  const C = CONDENSADOR;
  const camisa = useMemo(() => tornear(cerrado([
    [0.02, PUNTA_CONDENSADOR[1]], [0.034, PUNTA_CONDENSADOR[1]], [0.05, C.yBase + 0.02], [CABEZA.rInt - 0.003, C.yBase + 0.05], [CABEZA.rInt - 0.003, C.yBase + 0.18],
    [C.rCamisa + 0.012, C.yBase + 0.26], [C.rCamisa + 0.012, C.yTope - 0.1], [0.12, C.yTope], [0.06, C.yTope + 0.02], [0.06, C.yTope + 0.14],
    [0.048, C.yTope + 0.14], [0.048, C.yTope + 0.03], [0.11, C.yTope - 0.012], [C.rCamisa, C.yTope - 0.1], [C.rCamisa, C.yBase + 0.26],
    [CABEZA.rInt - 0.015, C.yBase + 0.18], [CABEZA.rInt - 0.015, C.yBase + 0.06], [0.04, C.yBase + 0.02], [0.022, PUNTA_CONDENSADOR[1] + 0.02],
  ]), 56), [C]);
  useEffect(() => () => camisa.dispose(), [camisa]);
  const helice = useMemo(() => {
    const pts: number[] = [];
    const y0 = C.yBase + 0.32, y1 = C.yTope - 0.2, n = C.vueltas * 28;
    // entra por arriba por el centro, baja en hélice y vuelve a subir por el centro
    pts.push(0.07, C.yTope + 0.12, 0.05, 0.07, y1 + 0.05, 0.05);
    for (let i = 0; i <= n; i++) {
      const t = i / n, a = t * C.vueltas * Math.PI * 2;
      pts.push(Math.cos(a) * C.rSerpentin, y1 - (y1 - y0) * t, Math.sin(a) * C.rSerpentin);
    }
    pts.push(-0.05, y0 - 0.04, 0, -0.06, y0 + 0.1, 0, -0.06, C.yTope + 0.12, -0.05);
    return pts;
  }, [C]);
  const serpentin = useMemo(() => tuboPolilinea(helice, C.rTubo, 10, true), [helice, C.rTubo]);
  useEffect(() => () => serpentin.dispose(), [serpentin]);
  return (
    <group userData={{ pieza: 'condensador' }}>
      <mesh geometry={camisa} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh geometry={serpentin} material={mats.refrigerante} />
      {/* olivas de agua arriba */}
      {[[0.07, 0.05], [-0.06, -0.05]].map(([x, z], i) => (
        <mesh key={i} geometry={cilindro(0.032, 0.032, 0.18, 14)} material={m.vidrio} position={[x, C.yTope + 0.2, z]} renderOrder={3} />
      ))}
    </group>
  );
}

// ───────────────────────────── hervidor ─────────────────────────────

/** Balón de 1 L (vidrio de borosilicato, cuello NS 29). Origen: mundo. */
export function BalonHervidor() {
  const m = useMateriales();
  const geo = useMemo(() => {
    const B = BALON, R = B.rInt, t = B.pared, rc = B.rCuelloInt;
    const yJ = B.yCentro + Math.sqrt((R + t) ** 2 - (rc + t) ** 2);
    const ext: P2[] = [];
    const n = 36;
    for (let i = 0; i <= n; i++) {
      const f = -Math.PI / 2 + (Math.asin((yJ - B.yCentro) / (R + t)) + Math.PI / 2) * (i / n);
      ext.push([Math.max(0.0005, (R + t) * Math.cos(f)), B.yCentro + (R + t) * Math.sin(f)]);
    }
    ext[0] = [0.0005, B.yCentro - R - t];
    ext.push([rc + t, B.yBoca - 0.02], [rc + t + 0.012, B.yBoca]);
    const int: P2[] = [[rc, B.yBoca]];
    const yJi = B.yCentro + Math.sqrt(R * R - rc * rc);
    int.push([rc, yJi]);
    for (let i = n; i >= 0; i--) {
      const f = -Math.PI / 2 + (Math.asin((yJi - B.yCentro) / R) + Math.PI / 2) * (i / n);
      int.push([Math.max(0.0005, R * Math.cos(f)), B.yCentro + R * Math.sin(f)]);
    }
    int[int.length - 1] = [0.0005, B.yCentro - R];
    return tornear([...ext, ...int], 64);
  }, []);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} userData={{ pieza: 'hervidor' }} />;
}

/** Líquido del hervidor: casquete esférico con el volumen exacto (V = πh²(3R − h)/3). */
export function LiquidoBalon({ mL, material }: { mL: number; material: THREE.Material }) {
  const R = BALON.rInt - 0.003;
  const h = Math.min(2 * R - 0.01, alturaEnEsfera(mL, R));
  const geo = useMemo(() => {
    const p: P2[] = [];
    const n = 32;
    const f1 = Math.asin((h - R) / R);
    for (let i = 0; i <= n; i++) {
      const f = -Math.PI / 2 + (f1 + Math.PI / 2) * (i / n);
      p.push([Math.max(0.0005, R * Math.cos(f)), R * Math.sin(f)]);
    }
    p[0] = [0.0005, -R];
    p.push([0.0005, h - R]);
    const g = tornear(p, 56);
    g.translate(0, BALON.yCentro, 0);
    return g;
  }, [h, R]);
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={material} renderOrder={1} />;
}

/** Manta calefactora de 1 L: carcasa de aluminio y casquete de tejido que brilla con el calor. */
export function Manta({ mats, calor }: { mats: MatsQ10; calor: () => number }) {
  const m = useMateriales();
  const M = MANTA;
  const cyRel = BALON.yCentro - M.yBase;
  const phi0 = Math.acos(Math.min(1, (cyRel - M.alto) / M.rCazo));
  const rBorde = M.rCazo * Math.sin(phi0);
  const carcasa = useMemo(() => tornear([
    [0.0005, 0], [M.rExt - 0.08, 0], [M.rExt - 0.01, 0.05], [M.rExt, 0.12], [M.rExt, M.alto - 0.07], [M.rExt - 0.04, M.alto], [rBorde + 0.03, M.alto], [rBorde + 0.02, M.alto - 0.03], [0.0005, cyRel - M.rCazo + 0.01],
  ], 56), [M, rBorde, cyRel]);
  useEffect(() => () => carcasa.dispose(), [carcasa]);
  const cazo = useMemo(() => {
    const p: P2[] = [];
    const n = 16;
    for (let i = 0; i <= n; i++) { const f = phi0 * (1 - i / n); p.push([M.rCazo * Math.sin(f), cyRel - M.rCazo * Math.cos(f)]); }
    p[p.length - 1] = [0.0005, cyRel - M.rCazo];
    return tornear(p, 56);
  }, [phi0, M, cyRel]);
  useEffect(() => () => cazo.dispose(), [cazo]);
  useFrame(() => { mats.tela.emissiveIntensity += (calor() * 1.6 - mats.tela.emissiveIntensity) * 0.06; });
  return (
    <group position={[0, M.yBase, 0]} userData={{ pieza: 'manta' }}>
      <mesh geometry={carcasa} material={m.aluminio} castShadow receiveShadow />
      <mesh geometry={cazo} material={mats.tela} />
      <mesh geometry={toro(0.11, 0.018, 8, 20, Math.PI)} material={m.acero} position={[M.rExt + 0.02, 0.22, 0]} rotation={[0, 0, -Math.PI / 2]} />
    </group>
  );
}

/** Gato de laboratorio (tijera) con su plataforma. */
export function Gato({ mats }: { mats: MatsQ10 }) {
  const m = useMateriales();
  const H = GATO.alto;
  const placas = useJuntar(() => [
    [cajaRedondeada(GATO.ancho, 0.05, GATO.fondo, 0.02, 2), [0, 0.025, 0]],
    [cajaRedondeada(GATO.ancho, 0.05, GATO.fondo, 0.02, 2), [0, H - 0.025, 0]],
  ], [H]);
  const tijera = useJuntar(() => {
    const p: Parte[] = [];
    for (const z of [-0.42, 0.42]) for (const s of [-1, 1]) p.push([new THREE.BoxGeometry(1.05, 0.04, 0.03), [0, H / 2, z], [0, 0, s * Math.atan2(H - 0.16, 1.0)]]);
    p.push([cilindro(0.025, 0.025, 1.1, 12), [0, H / 2, 0], [0, 0, Math.PI / 2]]);
    return p;
  }, [H]);
  return (
    <group userData={{ pieza: 'gato' }}>
      <mesh geometry={placas} material={mats.pintura} castShadow receiveShadow />
      <mesh geometry={tijera} material={m.acero} />
      <mesh geometry={esfera(0.07, 16)} material={mats.negro} position={[0.62, H / 2, 0]} />
    </group>
  );
}

// ───────────────────────────── receptor y alimentación ─────────────────────────────

/** Repisa del receptor (anclada al larguero derecho del bastidor) con su aro. */
export function RepisaReceptor({ mats }: { mats: MatsQ10 }) {
  const { x, z, yRepisa } = RECEPTOR;
  const varillas = useJuntar(() => [
    [tuboPolilinea([BASTIDOR.x, yRepisa - 0.05, BASTIDOR.z, x - 0.1, yRepisa - 0.05, z - 0.42, x, yRepisa - 0.05, z - 0.42], 0.022, 10, true)],
    [cilindro(0.022, 0.022, 0.42, 10), [x, yRepisa - 0.05, z - 0.21], [Math.PI / 2, 0, 0]],
    [cilindro(0.016, 0.016, 0.42, 8), [x, yRepisa + 1.7, z - 0.42], [Math.PI / 2, 0, 0]],
    [cilindro(0.02, 0.02, 1.8, 10), [x, yRepisa + 0.85, z - 0.63]],
  ], [x, z, yRepisa]);
  return (
    <group userData={{ pieza: 'receptor' }}>
      <mesh geometry={cilindro(0.44, 0.44, 0.04, 40)} material={mats.pintura} position={[x, yRepisa - 0.02, z]} castShadow receiveShadow />
      <mesh geometry={varillas} material={mats.pintura} />
      {/* aro que abraza la probeta */}
      <mesh geometry={toro(0.23, 0.014, 8, 36)} material={mats.negro} position={[x, yRepisa + 1.7, z]} rotation-x={Math.PI / 2} />
    </group>
  );
}

/** Bomba peristáltica: carcasa, rotor con tres rodillos que gira con el caudal y su tubo. */
export function BombaPeristaltica({ mats, girando }: { mats: MatsQ10; girando: () => boolean }) {
  const m = useMateriales();
  const rotor = useRef<THREE.Group>(null);
  const B = BOMBA;
  useFrame((_, dt) => { if (rotor.current && girando()) rotor.current.rotation.z -= Math.min(dt, 0.05) * 3.2; });
  const rodillos = useJuntar(() => [
    ...[0, 1, 2].map((k) => [cilindro(0.03, 0.03, 0.05, 14), [Math.cos((k * 2 * Math.PI) / 3) * 0.09, Math.sin((k * 2 * Math.PI) / 3) * 0.09, 0], [Math.PI / 2, 0, 0]] as Parte),
    [cilindro(0.04, 0.04, 0.06, 18), [0, 0, 0], [Math.PI / 2, 0, 0]],
  ], []);
  return (
    <group position={B.pos} rotation-y={0.35} userData={{ pieza: 'bomba' }}>
      <mesh geometry={cajaRedondeada(B.ancho, B.alto, B.fondo, 0.05, 3)} material={mats.carcasa} position={[0, B.alto / 2, 0]} castShadow receiveShadow />
      <group position={[0.06, B.alto * 0.55, B.fondo / 2 + 0.01]}>
        <mesh geometry={cilindro(0.15, 0.15, 0.03, 32)} material={mats.negro} rotation-x={Math.PI / 2} />
        <group ref={rotor} position={[0, 0, 0.03]}><mesh geometry={rodillos} material={m.acero} /></group>
        {/* el tubo que el rotor aprieta */}
        <mesh geometry={toro(0.135, 0.016, 8, 32, Math.PI * 1.2)} material={mats.manguera} rotation-z={-0.1 * Math.PI} position={[0, 0, 0.03]} />
      </group>
      <mesh geometry={esfera(0.018, 10)} material={mats.ledVerde} position={[-0.2, B.alto * 0.75, B.fondo / 2 + 0.005]} />
    </group>
  );
}

/** Frasco de alimentación (1 L, borosilicato, tapón GL 45) con la mezcla. */
export function FrascoAlimentacion({ matLiquido }: { matLiquido: THREE.Material }) {
  const m = useMateriales();
  const F = FRASCO_ALIM;
  const geo = useMemo(() => tornear(cerrado([
    [0.0005, 0], [F.r - 0.04, 0], [F.r, 0.05], [F.r, F.alto * 0.72], [F.r * 0.6, F.alto * 0.88], [0.2, F.alto * 0.9], [0.2, F.alto],
    [0.185, F.alto], [0.185, F.alto * 0.905], [F.r * 0.58, F.alto * 0.875], [F.r - 0.014, F.alto * 0.72], [F.r - 0.014, 0.06], [F.r - 0.05, 0.014], [0.0005, 0.014],
  ]), 48), [F]);
  useEffect(() => () => geo.dispose(), [geo]);
  const liq = useMemo(() => tornear([[0.0005, 0.02], [F.r - 0.02, 0.02], [F.r - 0.02, F.alto * 0.55], [0.0005, F.alto * 0.55]], 40), [F]);
  useEffect(() => () => liq.dispose(), [liq]);
  return (
    <group position={F.pos} userData={{ pieza: 'alimentacion' }}>
      <mesh geometry={geo} material={m.vidrio} renderOrder={3} />
      <mesh geometry={liq} material={matLiquido} renderOrder={1} />
      <mesh geometry={cilindro(0.23, 0.23, 0.14, 32)} material={m.plastico('#2462b0', 0.45)} position={[0, F.alto + 0.06, 0]} />
    </group>
  );
}

// ───────────────────────────── bastidor, caja de control, mesa ─────────────────────────────

/**
 * Bastidor: dos largueros de acero pintado (grafito, que no compitan con la columna) detrás del
 * montaje; brazos cortos a las abrazaderas de las bridas extremas y del condensador.
 */
export function Bastidor({ mats }: { mats: MatsQ10 }) {
  const { x, z, alto } = BASTIDOR;
  const geo = useJuntar(() => {
    const p: Parte[] = [];
    for (const sx of [-1, 1]) {
      p.push([cilindro(0.032, 0.032, alto, 18), [sx * x, alto / 2, z]]);
      p.push([new THREE.BoxGeometry(0.2, 0.05, 1.35), [sx * x, 0.025, z + 0.35]]);
    }
    // brazos: del larguero izquierdo a la columna, del derecho al condensador (por detrás)
    for (const [y, sx, r] of [[COL.yBase, -1, COL.bridaREx + 0.02], [COL.yTope, -1, COL.bridaREx + 0.02], [8.55, 1, CONDENSADOR.rCamisa + 0.04]] as [number, number, number][]) {
      p.push([tuboPolilinea([sx * x, y, z, sx * 0.25, y, z + 0.05, 0, y, -r - 0.02], 0.02, 10, true)]);
    }
    return p;
  }, [x, z, alto]);
  // abrazaderas: medio aro por detrás de cada brida extrema y del condensador
  const aros = useJuntar(() => ([[COL.yBase, COL.bridaREx + 0.02], [COL.yTope, COL.bridaREx + 0.02], [8.55, CONDENSADOR.rCamisa + 0.04]] as [number, number][])
    .map(([y, r]) => [new THREE.TorusGeometry(r, 0.018, 8, 36, Math.PI), [0, y, 0], [-Math.PI / 2, 0, 0]] as Parte), []);
  return (
    <group userData={{ pieza: 'bastidor' }}>
      <mesh geometry={geo} material={mats.pintura} castShadow />
      <mesh geometry={aros} material={mats.negro} />
    </group>
  );
}

/** Caja de control: mandos de la manta y del temporizador del divisor, y sus pilotos (sin cifras). */
export function CajaControl({ mats, calentando, toma }: { mats: MatsQ10; calentando: () => boolean; toma: () => boolean }) {
  const C = CONTROL;
  const l1 = useRef<THREE.Mesh>(null), l2 = useRef<THREE.Mesh>(null);
  const cuerpo = useMemo(() => {
    const s = new THREE.Shape();
    const d = C.fondo / 2, h = C.alto;
    s.moveTo(-d, 0); s.lineTo(d - 0.05, 0); s.quadraticCurveTo(d, 0, d, 0.05); s.lineTo(d, h * 0.35);
    s.lineTo(d - 0.2, h - 0.03); s.quadraticCurveTo(d - 0.23, h, d - 0.28, h); s.lineTo(-d + 0.05, h);
    s.quadraticCurveTo(-d, h, -d, h - 0.05); s.lineTo(-d, 0);
    const g = extruir(s, C.ancho, 16);
    g.translate(0, 0, -C.ancho / 2);
    g.rotateY(-Math.PI / 2);
    return g;
  }, [C]);
  useEffect(() => () => cuerpo.dispose(), [cuerpo]);
  useFrame(() => {
    if (l1.current) l1.current.material = calentando() ? mats.ledNaranja : mats.ledApagado;
    if (l2.current) l2.current.material = toma() ? mats.ledVerde : mats.ledApagado;
  });
  const pend = Math.atan2(0.2, C.alto * 0.65);
  // panel y mandos (negro) y las marcas de los mandos (acero), en coordenadas del panel
  const negro = useJuntar(() => [
    [cajaRedondeada(C.ancho - 0.1, C.alto * 0.62, 0.02, 0.02, 2), [0, 0, -0.01]],
    ...[-0.22, 0.22].map((x) => [cilindro(0.07, 0.076, 0.07, 28), [x, -0.02, 0.047], [Math.PI / 2, 0, 0]] as Parte),
  ], [C]);
  const marcas = useJuntar(() => [-0.22, 0.22].map((x) => [cajaRedondeada(0.012, 0.06, 0.01, 0.004, 1), [x, 0.01, 0.084]] as Parte), []);
  return (
    <group position={C.pos} rotation-y={-0.3} userData={{ pieza: 'control' }}>
      <mesh geometry={cuerpo} material={mats.carcasa} castShadow receiveShadow />
      <group position={[0, C.alto * 0.66, C.fondo / 2 - 0.1]} rotation-x={-pend}>
        <mesh geometry={negro} material={mats.negro} />
        <mesh geometry={marcas} material={mats.acero} />
        <mesh ref={l1} geometry={esfera(0.016, 10)} material={mats.ledApagado} position={[-0.22, 0.09, 0.012]} />
        <mesh ref={l2} geometry={esfera(0.016, 10)} material={mats.ledApagado} position={[0.22, 0.09, 0.012]} />
      </group>
    </group>
  );
}

export function Mesa({ mats }: { mats: MatsQ10 }) {
  return <mesh geometry={cajaRedondeada(9.5, 0.3, 5.2, 0.05, 3)} material={mats.mesa} position={[0, -0.15, -0.6]} receiveShadow />;
}

/** Atajo: rectángulo redondeado extruido (para quien lo necesite). */
export const placa = (w: number, h: number, r: number, e: number) => extruir(formaRectRedondeado(w, h, r), e, 12);

// ───────────────────────────── diagnóstico ─────────────────────────────

export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number } {
  let mallas = 0, normalesCero = 0;
  o.traverse((x) => {
    const g = (x as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!g || !(x as THREE.Mesh).isMesh) return;
    mallas++;
    const n = g.getAttribute('normal');
    if (!n) return;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
  });
  return { mallas, normalesCero };
}

export type { GroupProps, V3 };
