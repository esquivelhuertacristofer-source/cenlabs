'use client';
/**
 * fis09/piezas.tsx — el banco de Coulomb a tamaño real (1 u = 1 dm).
 *
 *  · Riel de perfil de aluminio anodizado satinado (6,2 × 3 cm) con ranuras en T y aristas
 *    achaflanadas, tapas de POM y patas niveladoras.
 *  · Regla de acero inoxidable con grabado al ácido: mm, medios cm y cm numerados (0 en la
 *    esfera fija). Textura de 4096 px con mipmaps y anisotropía: se lee de cerca y no titila.
 *  · Carros de aluminio anodizado negro con ventana de lectura (hilo rojo sobre la regla) y
 *    pomo de latón moleteado; columna aislante de acrílico (Ø 1,2 cm) con pie de POM y
 *    casquillo de latón; esfera de latón niquelado de Ø 1,8 cm.
 *
 * La esfera cargada lleva un brillo del color de su signo (rojo +, azul −) cuya intensidad
 * crece con |q|: es la única pieza emisiva del banco (lo demás es metal, plástico y vidrio).
 */
import React, { useEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useMateriales, useCalidad, useTexturaLienzo, familiaTexto, cajaRedondeada, cilindro, esfera, tornear, extruir, geoCache, texturaCompartida, sanearNormales } from '../_kit';
import {
  X_CERO, LARGO_RIEL, X_RIEL0, ALTO_RIEL, ANCHO_RIEL, ALTO_CARRO, ALTO_CASQUILLO, ALTO_COLUMNA, ALTO_PORTAESFERA,
  R_ESFERA, Y_BASE_COLUMNA, Y_EJE, Z_REGLA,
} from './constantes';

export const COLOR_POS = '#ff5a3c';
export const COLOR_NEG = '#3d8bff';

// ───────────────────────────── materiales propios ─────────────────────────────

type MaterialesBanco = ReturnType<typeof crearMaterialesBanco>;
const cacheBanco = new Map<string, MaterialesBanco>();

function crearMaterialesBanco(m: ReturnType<typeof useMateriales>, alta: boolean) {
  // aluminio anodizado grafito: la capa de óxido es dieléctrica (reflejo débil, F0 ≈ 0,04), así
  // que el chaflán no hace un filo blanco quemado bajo la luz clave
  const rielMat = new THREE.MeshStandardMaterial({
    color: '#5b646f', metalness: 0.35, roughness: 0.6, envMapIntensity: 0.55,
    roughnessMap: (m.aluminio as THREE.MeshStandardMaterial).roughnessMap ?? null, name: 'fis09-riel',
  });
  const negro = new THREE.MeshPhysicalMaterial({ color: '#202429', metalness: 0.55, roughness: 0.42, clearcoat: alta ? 0.35 : 0, clearcoatRoughness: 0.35, envMapIntensity: 0.8, name: 'fis09-anodizado' });
  const pom = new THREE.MeshStandardMaterial({ color: '#17191c', roughness: 0.55, metalness: 0, name: 'fis09-pom' });
  const laton = new THREE.MeshStandardMaterial({ color: '#d4ad5f', metalness: 1, roughness: 0.26, envMapIntensity: 0.9, name: 'fis09-laton' });
  const acrilico = materialAcrilico();
  const hilo = new THREE.MeshStandardMaterial({ color: '#ff2a2a', emissive: '#ff1a1a', emissiveIntensity: 0.6, roughness: 0.4, name: 'fis09-hilo' });
  return { rielMat, negro, pom, laton, acrilico, hilo, goma: m.goma };
}

/**
 * Acrílico de las columnas aislantes. En un estudio oscuro la transmisión pura deja ver sólo
 * el fondo (la columna desaparece y la esfera parece flotar): aquí es transparente con la
 * opacidad subiendo en el borde (Fresnel) y el reflejo especular sin atenuar, que es lo que
 * hace leer «varilla de vidrio». No escribe profundidad: las líneas de campo que pasan detrás
 * se siguen viendo a través.
 */
function materialAcrilico() {
  const mt = new THREE.MeshPhysicalMaterial({
    color: '#8fb1c4', roughness: 0.04, metalness: 0, transparent: true, opacity: 0.05, depthWrite: false,
    specularIntensity: 1, envMapIntensity: 1.25, name: 'fis09-acrilico',
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  mt.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
       float acrFr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.0);
       float acrA = clamp(diffuseColor.a + acrFr * 0.6, 0.0, 0.85);
       vec3 acrDif = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
       vec3 acrResto = max(outgoingLight - acrDif, vec3(0.0));
       gl_FragColor = vec4(acrDif * acrA + acrResto + vec3(0.55, 0.7, 0.8) * acrFr * 0.18, acrA);`,
    );
  };
  mt.customProgramCacheKey = () => 'fis09-acrilico-fresnel';
  return mt;
}

/** Materiales del banco: uno por calidad, compartidos por todas las piezas (nunca se liberan: son pocos). */
export function useMaterialesBanco(): MaterialesBanco {
  const m = useMateriales();
  const calidad = useCalidad();
  let mt = cacheBanco.get(calidad);
  if (!mt) { mt = crearMaterialesBanco(m, calidad === 'alta'); cacheBanco.set(calidad, mt); }
  return mt;
}

// ───────────────────────────── riel y regla ─────────────────────────────

/** Perfil del riel (en el plano z–y): rectángulo achaflanado con una ranura en T por cada costado. */
function perfilRiel(): THREE.Shape {
  const w = ANCHO_RIEL / 2, h = ALTO_RIEL, c = 0.022;          // chaflán
  const ry = h * 0.5, ra = 0.05, rp = 0.035;                     // ranura: centro, abertura, profundidad
  const s = new THREE.Shape();
  s.moveTo(-w + c, 0);
  s.lineTo(w - c, 0); s.lineTo(w, c);
  // ranura del costado +z (la del alumno)
  s.lineTo(w, ry - ra / 2); s.lineTo(w - rp, ry - ra / 2 - 0.012); s.lineTo(w - rp, ry + ra / 2 + 0.012); s.lineTo(w, ry + ra / 2);
  s.lineTo(w, h - c); s.lineTo(w - c, h);
  s.lineTo(-w + c, h); s.lineTo(-w, h - c);
  s.lineTo(-w, ry + ra / 2); s.lineTo(-w + rp, ry + ra / 2 + 0.012); s.lineTo(-w + rp, ry - ra / 2 - 0.012); s.lineTo(-w, ry - ra / 2);
  s.lineTo(-w, c);
  s.closePath();
  return s;
}

/** Textura de la regla grabada: −5 … 45 cm, mm finos, medios cm y cm numerados cada 5. */
function useTexturaRegla(largo: number) {
  return useTexturaLienzo(4096, 256, (ctx, W, H) => {
    const fam = familiaTexto();
    // acero inoxidable satinado: degradado suave, sin moteado
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, '#cfd4d8'); g.addColorStop(0.5, '#e3e7ea'); g.addColorStop(1, '#c4c9cd');
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
    const pxcm = W / (largo * 10);
    const cm0 = -5;
    ctx.fillStyle = '#1a1d21';
    ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic';
    for (let mm = 0; mm <= largo * 100; mm++) {
      const cm = cm0 + mm / 10;
      const x = (mm / 10) * pxcm;
      const esCm = mm % 10 === 0, esMedio = mm % 5 === 0;
      const l = esCm ? (Math.round(cm) % 5 === 0 ? 0.42 : 0.32) : esMedio ? 0.24 : 0.15;
      const a = esCm ? 3.2 : 1.8;
      ctx.fillRect(x - a / 2, 0, a, H * l);
      if (esCm && Math.round(cm) % 5 === 0 && cm >= 0 && cm <= 45) {
        ctx.font = `600 ${H * 0.3}px ${fam}`;
        ctx.fillText(String(Math.round(cm)), x, H * 0.8);
      }
    }
    ctx.font = `600 ${H * 0.2}px ${fam}`; ctx.textAlign = 'left';
    ctx.fillText('cm', 8, H * 0.95);
    // borde inferior biselado (más oscuro)
    ctx.fillStyle = 'rgba(40,46,52,0.35)'; ctx.fillRect(0, H - 6, W, 6);
  }, [largo]);
}

export function Riel() {
  const mt = useMaterialesBanco();
  const largoRegla = 5.0; // u: de −5 a 45 cm
  const tex = useTexturaRegla(largoRegla);
  const matRegla = useMemo(() => new THREE.MeshPhysicalMaterial({ map: tex, metalness: 0.55, roughness: 0.32, clearcoat: 0.3, clearcoatRoughness: 0.35, name: 'fis09-regla' }), [tex]);
  useEffect(() => () => matRegla.dispose(), [matRegla]);
  const geoRiel = useMemo(() => geoCache('fis09-riel', () => {
    const g = extruir(perfilRiel(), LARGO_RIEL, 4);
    // la extrusión va en +z: se gira para que el riel corra a lo largo de X
    g.rotateY(Math.PI / 2);
    return g;
  }), []);
  const cx = X_RIEL0 + LARGO_RIEL / 2;
  return (
    <group>
      <mesh geometry={geoRiel} material={mt.rielMat} position={[X_RIEL0, 0, 0]} castShadow receiveShadow />
      {/* regla de acero embutida en la cara superior, hacia el alumno */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[X_CERO - 0.5 + largoRegla / 2, ALTO_RIEL + 0.0015, Z_REGLA]} material={matRegla} receiveShadow>
        <planeGeometry args={[largoRegla, 0.17]} />
      </mesh>
      {/* tapas de POM */}
      {[-1, 1].map((s) => (
        <mesh key={s} geometry={cajaRedondeada(0.07, ALTO_RIEL + 0.02, ANCHO_RIEL + 0.03, 0.012, 2)} material={mt.pom}
          position={[cx + s * (LARGO_RIEL / 2 + 0.035), (ALTO_RIEL + 0.02) / 2 - 0.01, 0]} castShadow />
      ))}
      {/* patas niveladoras */}
      {[-1, 1].flatMap((sx) => [-1, 1].map((sz) => (
        <group key={`${sx}${sz}`} position={[cx + sx * (LARGO_RIEL / 2 - 0.25), 0, sz * (ANCHO_RIEL / 2 - 0.08)]}>
          <mesh geometry={cilindro(0.045, 0.05, 0.02, 20)} material={mt.goma} position={[0, -0.01, 0]} />
        </group>
      )))}
    </group>
  );
}

// ───────────────────────────── carro, columna y esfera ─────────────────────────────

/** Pomo de latón moleteado (perfil torneado con estrías). */
function geoPomo() {
  return geoCache('fis09-pomo', () => {
    const n = 48, pts: [number, number][] = [];
    for (let i = 0; i <= 12; i++) {
      const y = (i / 12) * 0.05;
      pts.push([0.026 + (i === 0 || i === 12 ? -0.004 : 0), y]);
    }
    const g = tornear([[0, 0], ...pts, [0, 0.05]], n);
    // moleteado: ondula el radio con 24 estrías
    const p = g.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i), r = Math.hypot(x, z);
      if (r < 0.02) continue;
      const a = Math.atan2(x, z);
      const k = 1 + 0.05 * Math.cos(a * 24);
      p.setXYZ(i, x * k, p.getY(i), z * k);
    }
    g.computeVertexNormals();
    // los polos del torno (r = 0) sólo tocan triángulos degenerados: normal nula → sanear
    return sanearNormales(g);
  });
}

/** Columna aislante con portaesfera. Origen: base de la columna (sobre el carro), en el eje de la esfera. */
function Columna() {
  const mt = useMaterialesBanco();
  return (
    <group>
      <mesh geometry={cilindro(0.075, 0.08, ALTO_CASQUILLO, 28)} material={mt.pom} position={[0, ALTO_CASQUILLO / 2, 0]} castShadow />
      <mesh geometry={cilindro(0.06, 0.06, ALTO_COLUMNA, 28)} material={mt.acrilico} position={[0, ALTO_CASQUILLO + ALTO_COLUMNA / 2, 0]} renderOrder={2} />
      <mesh geometry={cilindro(0.032, 0.05, ALTO_PORTAESFERA, 24)} material={mt.laton} position={[0, ALTO_CASQUILLO + ALTO_COLUMNA + ALTO_PORTAESFERA / 2 - 0.004, 0]} castShadow />
    </group>
  );
}

/** Carro sobre el riel con su columna. Origen: x = centro de la esfera, sobre la cara superior del riel. */
/**
 * Carro estrecho (1,9 cm a lo largo del riel): dos carros caben a 2 cm entre centros, la
 * separación mínima del banco. Bloque sobre la mitad trasera del riel (z −0,29 … 0,09) y un
 * índice que asoma sobre la regla.
 */
const Z_CARRO0 = -0.29, Z_CARRO1 = 0.09;
export const ANCHO_CARRO = 0.19;
export function Carro() {
  const mt = useMaterialesBanco();
  const fondo = Z_CARRO1 - Z_CARRO0;
  return (
    <group>
      <mesh geometry={cajaRedondeada(ANCHO_CARRO, ALTO_CARRO, fondo, 0.025, 3)} material={mt.negro} position={[0, ALTO_RIEL + ALTO_CARRO / 2, (Z_CARRO0 + Z_CARRO1) / 2]} castShadow receiveShadow />
      {/* índice: lámina que asoma sobre la regla con su hilo rojo en x = centro de la esfera */}
      <mesh geometry={cajaRedondeada(0.15, 0.01, 0.15, 0.004, 1)} material={mt.negro} position={[0, ALTO_RIEL + 0.012, Z_CARRO1 + 0.06]} castShadow />
      <mesh geometry={cajaRedondeada(0.007, 0.003, 0.12, 0.001, 1)} material={mt.hilo} position={[0, ALTO_RIEL + 0.0185, Z_CARRO1 + 0.07]} />
      {/* pomo de apriete en la cara delantera */}
      <mesh geometry={geoPomo()} material={mt.laton} rotation={[Math.PI / 2, 0, 0]} position={[0, ALTO_RIEL + ALTO_CARRO * 0.66, Z_CARRO1 - 0.002]} castShadow />
      <group position={[0, Y_BASE_COLUMNA, 0]}><Columna /></group>
    </group>
  );
}

// ───────────────────────────── esfera cargada ─────────────────────────────

/** Textura de halo (gaussiana radial) compartida. */
export function texturaHalo() {
  return texturaCompartida('fis09-halo', 256, 256, (ctx, w, h) => {
    const g = ctx.createRadialGradient(w / 2, h / 2, 0, w / 2, h / 2, w / 2);
    for (let i = 0; i <= 16; i++) {
      const t = i / 16;
      g.addColorStop(t, `rgba(255,255,255,${Math.exp(-t * t * 5.5) * (1 - t)})`);
    }
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }, { srgb: false });
}

/**
 * Material de la esfera según su carga: latón niquelado pulido con un brillo emisivo
 * suave del color del signo; la intensidad crece con |q| (1 → 6 μC).
 */
export function materialEsfera(q: number, alta: boolean) {
  const col = q > 0 ? COLOR_POS : COLOR_NEG;
  return new THREE.MeshPhysicalMaterial({
    color: '#d9d6cf', metalness: 1, roughness: 0.14, clearcoat: alta ? 1 : 0, clearcoatRoughness: 0.08,
    emissive: col, emissiveIntensity: 0.28 + 0.07 * Math.min(6, Math.abs(q)), name: 'fis09-esfera',
  });
}

export const GEO_ESFERA = () => esfera(R_ESFERA, 48);
export { Y_EJE, X_CERO };
