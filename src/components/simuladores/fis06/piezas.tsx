'use client';
/**
 * fis06/piezas.tsx — las piezas del banco de Arquímedes, a escala real (1 u = 1 dm; la
 * cubierta de la mesa en y = 0; +Z mira al alumno; el tanque centrado en x = z = 0).
 *
 *  · TANQUE de vidrio de 6 mm (interior 32 × 20 × 26 cm) pegado con silicona sobre un zócalo
 *    de aluminio anodizado; los cantos del vidrio se ven verdosos (el hierro del vidrio
 *    flotado). Detrás, la pared alicatada del laboratorio: ni paneles ni pantallas.
 *  · LÍQUIDO con su superficie VIVA: la malla sigue el campo de ondas del reloj y el nivel
 *    medio de la hidrostática; contra el vidrio trepa el MENISCO con el perfil exacto de
 *    Laplace–Young (agua: 3,9 mm). Calidad alta: transmisión con el índice del líquido.
 *  · CUERPOS: el juego de cuatro bloques de igual volumen (pino con su veta, hielo turbio,
 *    aluminio satinado, hierro) y el cilindro problema pintado (no delata su material).
 *    Su parte sumergida se tiñe de cian con la línea de flotación luminosa: es el volumen
 *    de líquido desalojado, el que da el empuje.
 *  · SOPORTE universal con nuez y brazo, y DINAMÓMETRO de tubo con su muelle, índice y
 *    escala de rayas (sin cifras: la lectura va en el dock).
 */
import React, { useEffect, useLayoutEffect, useMemo } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cajaRedondeada, cilindro, esfera, tornear, toro, tuboPolilinea, crearLienzo, texturaDeLienzo, sanearNormales, type Calidad } from '../_kit';
import {
  TANQUE, ESCALA_DINAMOMETRO, perfilMenisco, alturaMenisco, longitudCapilar,
  type Cuerpo, type IdMaterial, type Liquido,
} from './flotacion';
import type { RelojTanque } from './reloj';

export type V3 = [number, number, number];
/** Unidades de escena por metro. */
export const U = 10;

// ───────────────────────────── cotas ─────────────────────────────

export const COTAS = {
  vidrio: 0.06,
  zocalo: 0.12,
  /** fondo interior (cara de arriba del vidrio del fondo) */
  yFondo: 0.18,
  /** semilargo, semiancho y alto INTERIORES */
  ix: (TANQUE.largo * U) / 2,
  iz: (TANQUE.ancho * U) / 2,
  ih: TANQUE.alto * U,
  /** soporte universal: eje de la varilla */
  xVarilla: -2.6,
  altoVarilla: 9.2,
  /** dinamómetro: del aro al gancho sin carga (u) */
  largoDin: 2.0,
  /** del aro del dinamómetro al brazo */
  colgadero: 0.12,
} as const;
export const Y_BORDE = COTAS.yFondo + COTAS.ih;

/** Del sistema del modelo (m, fondo interior en y = 0) a la escena. */
export const aEscenaY = (y: number) => COTAS.yFondo + y * U;

// ───────────────────────────── materiales ─────────────────────────────

/** Uniformes compartidos por los materiales de los cuerpos: nivel del líquido y brillo del volumen sumergido. */
export interface UniformesNivel { uNivel: { value: number }; uBrillo: { value: number }; uColor: { value: THREE.Color } }
export function crearUniformesNivel(): UniformesNivel {
  return { uNivel: { value: 2 }, uBrillo: { value: 1 }, uColor: { value: new THREE.Color('#46d6ff') } };
}

/**
 * Añade al material el VOLUMEN SUMERGIDO: bajo el nivel (coordenada de mundo) se tiñe de cian
 * con un borde de Fresnel, y la línea de flotación se dibuja luminosa (HDR > 1: el bloom la
 * recoge). El ancho de la línea se mide en píxeles (fwidth): nítida a cualquier distancia.
 */
function conVolumenSumergido<T extends THREE.MeshStandardMaterial>(m: T, u: UniformesNivel, clave: string): T {
  m.onBeforeCompile = (s) => {
    s.uniforms.uNivel = u.uNivel; s.uniforms.uBrillo = u.uBrillo; s.uniforms.uColor = u.uColor;
    s.vertexShader = s.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMundoF6;')
      .replace('#include <project_vertex>', '#include <project_vertex>\nvMundoF6 = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    s.fragmentShader = s.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vMundoF6;\nuniform float uNivel;\nuniform float uBrillo;\nuniform vec3 uColor;')
      .replace('#include <opaque_fragment>', `
        float f6Bajo = 1.0 - smoothstep(-0.0015, 0.0015, vMundoF6.y - uNivel);
        float f6Fr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.2);
        outgoingLight = mix(outgoingLight, outgoingLight * 0.7 + uColor * 0.08, f6Bajo * uBrillo * 0.32);
        outgoingLight += uColor * f6Bajo * uBrillo * (0.03 + 0.42 * f6Fr);
        float f6W = clamp(fwidth(vMundoF6.y) * 1.6, 0.004, 0.025);
        float f6Linea = 1.0 - smoothstep(0.0, f6W, abs(vMundoF6.y - uNivel));
        outgoingLight += uColor * f6Linea * uBrillo * 1.5;
        #include <opaque_fragment>`);
  };
  m.customProgramCacheKey = () => 'f6-sumergido-' + clave;
  return m;
}

/** Vidrio fino SIN pasada de transmisión: transparente con el borde de Fresnel (el líquido sí transmite dentro). */
function vidrioFino(color: string, opacidad: number, borde: number, clave: string, difuso = 1): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.04, metalness: 0, transparent: true, opacity: opacidad, depthWrite: false,
    specularIntensity: 1, envMapIntensity: 1.5, side: THREE.DoubleSide,
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor, name: 'f6-vidrio-' + clave,
  });
  m.onBeforeCompile = (s) => {
    // Premultiplicado (difuso × α + especular entero), pero la premultiplicación se hace DESPUÉS
    // del tono y del paso a sRGB: si se convierte un color ya premultiplicado, sRGB(α·c) ≫ α·sRGB(c)
    // y, pintando directo al lienzo (calidad media, sin posproceso), el vidrio salía blanco. Ahí,
    // además, la suma del especular ocurre en sRGB (más brillante que en lineal): se rebaja a 0,45.
    s.fragmentShader = s.fragmentShader
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      float f6Fr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 3.0);
      float f6A = clamp(diffuseColor.a + f6Fr * ${borde.toFixed(3)}, 0.0, 0.9);
      vec3 f6Dif = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
      vec3 f6Resto = max(outgoingLight - f6Dif, vec3(0.0));
      gl_FragColor = vec4(f6Dif * ${difuso.toFixed(3)}, f6A);`)
      .replace('#include <colorspace_fragment>', `#include <colorspace_fragment>
      vec3 f6R = f6Resto;
      #if defined( TONE_MAPPING )
        f6R = toneMapping(f6R);
      #endif
      f6R = linearToOutputTexel(vec4(f6R, 1.0)).rgb;
      gl_FragColor.rgb = gl_FragColor.rgb * gl_FragColor.a + f6R * ${(difuso < 1 ? 0.45 : 1).toFixed(3)};`);
  };
  m.customProgramCacheKey = () => 'f6-vidrio-fino-' + clave + borde.toFixed(3) + '-' + difuso.toFixed(3);
  return m;
}

/** Veta del pino: bandas anchas y onduladas (baja frecuencia), sin grano fino. */
function texturaPino(testa: boolean) {
  const W = testa ? 256 : 512, H = 256;
  const c = crearLienzo(W, H);
  const g = c.getContext('2d')!;
  const fondo = g.createLinearGradient(0, 0, W, H);
  fondo.addColorStop(0, '#d9b07a'); fondo.addColorStop(0.5, '#e2bd88'); fondo.addColorStop(1, '#d3a56d');
  g.fillStyle = fondo; g.fillRect(0, 0, W, H);
  let s = testa ? 917 : 311;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  if (testa) {
    // anillos de crecimiento: arcos concéntricos con el centro fuera de la pieza
    const cx = W * 0.35, cy = H * 1.9;
    for (let r = 40; r < 900; r += 13 + rnd() * 16) {
      g.strokeStyle = `rgba(150,96,46,${0.16 + rnd() * 0.16})`;
      g.lineWidth = 3 + rnd() * 5;
      g.beginPath(); g.arc(cx, cy, r, Math.PI * 1.05, Math.PI * 1.95); g.stroke();
    }
  } else {
    for (let i = 0; i < 26; i++) {
      const y0 = rnd() * H, a = 4 + rnd() * 10, f = 0.6 + rnd() * 1.4, fase = rnd() * 6;
      g.strokeStyle = `rgba(150,96,46,${0.1 + rnd() * 0.16})`;
      g.lineWidth = 2.5 + rnd() * 7;
      g.beginPath();
      for (let x = -10; x <= W + 10; x += 8) {
        const y = y0 + Math.sin((x / W) * Math.PI * 2 * f + fase) * a + Math.sin((x / W) * Math.PI * 5 * f) * a * 0.25;
        if (x < 0) g.moveTo(x, y); else g.lineTo(x, y);
      }
      g.stroke();
    }
  }
  // velo suave para fundir las bandas (nada de grano)
  g.filter = 'blur(2px)';
  g.drawImage(c, 0, 0);
  g.filter = 'none';
  return texturaDeLienzo(c);
}

/** Hielo de cubitera: núcleo blanquecino (aire atrapado) que se aclara hacia los bordes. */
function texturaHielo() {
  const S = 256;
  const c = crearLienzo(S, S);
  const g = c.getContext('2d')!;
  g.fillStyle = '#cfe6f0'; g.fillRect(0, 0, S, S);
  const r = g.createRadialGradient(S / 2, S / 2, 6, S / 2, S / 2, S * 0.62);
  r.addColorStop(0, 'rgba(255,255,255,0.95)'); r.addColorStop(0.45, 'rgba(240,248,252,0.55)'); r.addColorStop(1, 'rgba(190,222,236,0)');
  g.fillStyle = r; g.fillRect(0, 0, S, S);
  let s = 77;
  const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
  for (let i = 0; i < 18; i++) {
    const x = S * (0.3 + rnd() * 0.4), y = S * (0.3 + rnd() * 0.4), rr = 3 + rnd() * 7;
    const b = g.createRadialGradient(x, y, 0, x, y, rr);
    b.addColorStop(0, 'rgba(255,255,255,0.7)'); b.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = b; g.fillRect(x - rr, y - rr, 2 * rr, 2 * rr);
  }
  return texturaDeLienzo(c);
}

/** Resina negra de la mesa: manchas muy suaves de baja frecuencia (sin grano). */
function texturasMesa(calidad: Calidad) {
  const S = calidad === 'alta' ? 512 : 256;
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#1d2227'; c.fillRect(0, 0, S, S);
  o.fillStyle = 'rgb(0,128,0)'; o.fillRect(0, 0, S, S);
  let sem = 4111;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let i = 0; i < 14; i++) {
    const x = rnd() * S, y = rnd() * S, r = S * (0.18 + rnd() * 0.3), claro = rnd() > 0.5;
    for (const dx of [-S, 0, S]) for (const dy of [-S, 0, S]) {
      const g = c.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      g.addColorStop(0, claro ? 'rgba(48,54,60,0.3)' : 'rgba(12,14,16,0.3)'); g.addColorStop(1, 'rgba(29,34,39,0)');
      c.fillStyle = g; c.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
      const h = o.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, r);
      const v = Math.round((claro ? 0.42 : 0.58) * 255);
      h.addColorStop(0, `rgba(0,${v},0,0.45)`); h.addColorStop(1, `rgba(0,${v},0,0)`);
      o.fillStyle = h; o.fillRect(x + dx - r, y + dy - r, 2 * r, 2 * r);
    }
  }
  const rep: [number, number] = [2, 1.1];
  return { mapa: texturaDeLienzo(col, { repetir: rep }), rug: texturaDeLienzo(rug, { srgb: false, repetir: rep }) };
}

/**
 * Azulejo de laboratorio (15 × 15 cm) con su junta: 4 × 4 piezas por lienzo, cada una con un
 * leve cambio de tono (baja frecuencia, sin grano). La rugosidad: esmalte brillante, junta mate.
 */
function texturasAzulejo(calidad: Calidad) {
  const S = calidad === 'alta' ? 512 : 256, n = 4, t = S / n, j = Math.max(2, Math.round(S / 170));
  const col = crearLienzo(S, S), rug = crearLienzo(S, S);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  c.fillStyle = '#4b535a'; c.fillRect(0, 0, S, S);
  o.fillStyle = 'rgb(0,235,0)'; o.fillRect(0, 0, S, S);
  let sem = 2207;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  for (let a = 0; a < n; a++) for (let b = 0; b < n; b++) {
    const v = Math.round(170 + (rnd() - 0.5) * 10);
    const g = c.createLinearGradient(a * t, b * t, a * t + t, b * t + t);
    g.addColorStop(0, `rgb(${v + 3},${v + 7},${v + 10})`); g.addColorStop(1, `rgb(${v - 4},${v},${v + 3})`);
    c.fillStyle = g; c.fillRect(a * t + j / 2, b * t + j / 2, t - j, t - j);
    o.fillStyle = 'rgb(0,52,0)'; o.fillRect(a * t + j / 2, b * t + j / 2, t - j, t - j);
  }
  const rep: [number, number] = [2.5, 1.5];
  return { mapa: texturaDeLienzo(col, { repetir: rep }), rug: texturaDeLienzo(rug, { srgb: false, repetir: rep }) };
}

/** Escala del dinamómetro: rayas negras sobre esmalte blanco, SIN cifras. */
function texturaEscala(divisiones: number) {
  const W = 64, H = 1024;
  const c = crearLienzo(W, H);
  const g = c.getContext('2d')!;
  g.fillStyle = '#f2efe6'; g.fillRect(0, 0, W, H);
  g.fillStyle = '#16181a';
  const m = 24;
  for (let i = 0; i <= divisiones; i++) {
    const y = m + (i / divisiones) * (H - 2 * m);
    const mayor = i % 5 === 0;
    g.fillRect(0, y - (mayor ? 2.5 : 1.5), W * (mayor ? 0.62 : 0.34), mayor ? 5 : 3);
  }
  return texturaDeLienzo(c);
}

export interface MatsF6 {
  mesa: THREE.MeshPhysicalMaterial;
  pared: THREE.MeshStandardMaterial;
  zocalo: THREE.MeshPhysicalMaterial;
  placaFondo: THREE.MeshStandardMaterial;
  vidrio: THREE.MeshPhysicalMaterial;
  canto: THREE.MeshPhysicalMaterial;
  silicona: THREE.MeshPhysicalMaterial;
  acero: THREE.MeshStandardMaterial;
  pintura: THREE.MeshPhysicalMaterial;
  nuez: THREE.MeshPhysicalMaterial;
  perilla: THREE.MeshPhysicalMaterial;
  tubo: THREE.MeshPhysicalMaterial;
  tapa: THREE.MeshPhysicalMaterial;
  indice: THREE.MeshPhysicalMaterial;
  escala: THREE.MeshStandardMaterial;
  hilo: THREE.MeshStandardMaterial;
  flechaP: THREE.MeshStandardMaterial;
  flechaE: THREE.MeshStandardMaterial;
  flechaT: THREE.MeshStandardMaterial;
  flechaN: THREE.MeshStandardMaterial;
  marcaG: THREE.MeshStandardMaterial;
  marcaGOscura: THREE.MeshStandardMaterial;
  marcaB: THREE.MeshStandardMaterial;
  cuerpo: Record<IdMaterial | 'problema', THREE.MeshPhysicalMaterial | THREE.MeshPhysicalMaterial[]>;
  nivel: UniformesNivel;
}

export function useMatsF6(calidad: Calidad, divisiones: number): MatsF6 {
  const nivel = useMemo(crearUniformesNivel, []);
  const tex = useMemo(() => (typeof document === 'undefined' ? null : {
    mesa: texturasMesa(calidad), pared: texturasAzulejo(calidad), pinoVeta: texturaPino(false), pinoTesta: texturaPino(true), hielo: texturaHielo(),
  }), [calidad]);
  const texEscala = useMemo(() => (typeof document === 'undefined' ? null : texturaEscala(divisiones)), [divisiones]);
  const m = useMemo<MatsF6>(() => {
    const alta = calidad === 'alta';
    const pino = (testa: boolean) => conVolumenSumergido(new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map: (testa ? tex?.pinoTesta : tex?.pinoVeta) ?? null, roughness: 0.66, metalness: 0,
      sheen: alta ? 0.25 : 0, sheenColor: new THREE.Color('#ffe7c4'), sheenRoughness: 0.6, name: 'f6-pino',
    }), nivel, testa ? 'pino-testa' : 'pino-veta');
    const veta = pino(false), testa = pino(true);
    const hielo = conVolumenSumergido(new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map: tex?.hielo ?? null, roughness: 0.14, metalness: 0, clearcoat: alta ? 1 : 0.4, clearcoatRoughness: 0.08,
      specularIntensity: 1, envMapIntensity: 1.3, sheen: alta ? 0.5 : 0, sheenColor: new THREE.Color('#e8f6ff'), name: 'f6-hielo',
    }), nivel, 'hielo');
    const metal = (color: string, rug: number, clave: string, capa = 0) => conVolumenSumergido(new THREE.MeshPhysicalMaterial({
      color, metalness: 1, roughness: rug, clearcoat: alta ? capa : 0, clearcoatRoughness: 0.3, envMapIntensity: 1.1, name: 'f6-' + clave,
    }), nivel, clave);
    const problema = conVolumenSumergido(new THREE.MeshPhysicalMaterial({
      color: '#3f5361', metalness: 0.15, roughness: 0.46, clearcoat: alta ? 0.45 : 0, clearcoatRoughness: 0.35, name: 'f6-problema',
    }), nivel, 'problema');
    // flechas: diagrama sobre la escena (sin prueba de profundidad: se ven enteras aunque crucen el vidrio o el fondo)
    const emisor = (color: string, k = 0.55) => new THREE.MeshStandardMaterial({ color, emissive: color, emissiveIntensity: k, roughness: 0.4, metalness: 0, transparent: true, depthTest: false, depthWrite: false, name: 'f6-flecha' });
    return {
      mesa: new THREE.MeshPhysicalMaterial({ color: '#ffffff', map: tex?.mesa.mapa ?? null, roughnessMap: tex?.mesa.rug ?? null, roughness: 1, metalness: 0, clearcoat: alta ? 0.35 : 0, clearcoatRoughness: 0.38, name: 'f6-mesa' }),
      pared: new THREE.MeshStandardMaterial({ color: '#ffffff', map: tex?.pared.mapa ?? null, roughnessMap: tex?.pared.rug ?? null, roughness: 1, metalness: 0, envMapIntensity: 0.5, name: 'f6-pared' }),
      zocalo: new THREE.MeshPhysicalMaterial({ color: '#2b3036', metalness: 0.75, roughness: 0.38, clearcoat: alta ? 0.25 : 0, name: 'f6-zocalo' }),
      placaFondo: new THREE.MeshStandardMaterial({ color: '#c4cbd0', roughness: 0.82, metalness: 0, name: 'f6-placa-fondo' }),
      // media pinta directo al lienzo (mezcla en sRGB): el difuso del vidrio pesa más y se rebaja
      vidrio: vidrioFino('#d8ece6', 0.045, 0.38, 'tanque', alta ? 1 : 0.35),
      canto: new THREE.MeshPhysicalMaterial({ color: '#8fd3bb', roughness: 0.1, metalness: 0, transparent: true, opacity: 0.55, depthWrite: false, envMapIntensity: 1.2, name: 'f6-canto' }),
      silicona: new THREE.MeshPhysicalMaterial({ color: '#3a4046', roughness: 0.35, metalness: 0, transparent: true, opacity: 0.6, depthWrite: false, name: 'f6-silicona' }),
      acero: new THREE.MeshStandardMaterial({ color: '#d4d8db', metalness: 1, roughness: 0.26, name: 'f6-acero' }),
      pintura: new THREE.MeshPhysicalMaterial({ color: '#2a3138', metalness: 0.3, roughness: 0.5, clearcoat: alta ? 0.3 : 0, clearcoatRoughness: 0.4, name: 'f6-pintura' }),
      nuez: new THREE.MeshPhysicalMaterial({ color: '#a7afb6', metalness: 0.8, roughness: 0.42, name: 'f6-nuez' }),
      perilla: new THREE.MeshPhysicalMaterial({ color: '#16191c', metalness: 0, roughness: 0.4, clearcoat: alta ? 0.4 : 0, name: 'f6-perilla' }),
      tubo: vidrioFino('#eef4f6', 0.06, 0.45, 'tubo', alta ? 1 : 0.35),
      tapa: new THREE.MeshPhysicalMaterial({ color: '#2f7d55', metalness: 0, roughness: 0.38, clearcoat: alta ? 0.5 : 0, name: 'f6-tapa' }),
      indice: new THREE.MeshPhysicalMaterial({ color: '#d12f2a', metalness: 0, roughness: 0.35, clearcoat: alta ? 0.5 : 0, name: 'f6-indice' }),
      escala: new THREE.MeshStandardMaterial({ color: '#ffffff', map: texEscala, roughness: 0.55, metalness: 0, name: 'f6-escala' }),
      hilo: new THREE.MeshStandardMaterial({ color: '#efe9d8', roughness: 0.7, metalness: 0, name: 'f6-hilo' }),
      flechaP: emisor('#ffad3b'),
      flechaE: emisor('#3fd2ff'),
      flechaT: emisor('#7be08f'),
      flechaN: emisor('#c9d2da', 0.3),
      marcaG: new THREE.MeshStandardMaterial({ color: '#f4f6f8', emissive: '#f4f6f8', emissiveIntensity: 0.35, roughness: 0.5, name: 'f6-marca-g' }),
      marcaGOscura: new THREE.MeshStandardMaterial({ color: '#15181b', roughness: 0.5, name: 'f6-marca-g2' }),
      marcaB: new THREE.MeshStandardMaterial({ color: '#3fd2ff', emissive: '#3fd2ff', emissiveIntensity: 0.9, roughness: 0.4, name: 'f6-marca-b' }),
      cuerpo: {
        // orden de los grupos de la caja: +x, −x, +y, −y, +z, −z (la veta corre a lo largo de x)
        pino: [testa, testa, veta, veta, veta, veta],
        hielo,
        aluminio: metal('#d7dadd', 0.3, 'aluminio'),
        hierro: metal('#6c7177', 0.46, 'hierro', 0.15),
        problema,
      },
      nivel,
    };
  }, [calidad, tex, texEscala, nivel]);
  useEffect(() => () => {
    for (const v of Object.values(m)) if (v instanceof THREE.Material) v.dispose();
    for (const v of Object.values(m.cuerpo)) (Array.isArray(v) ? v : [v]).forEach((x) => x.dispose());
    tex?.mesa.mapa.dispose(); tex?.mesa.rug.dispose(); tex?.pared.mapa.dispose(); tex?.pared.rug.dispose(); tex?.pinoVeta.dispose(); tex?.pinoTesta.dispose(); tex?.hielo.dispose();
  }, [m, tex]);
  useEffect(() => () => { texEscala?.dispose(); }, [texEscala]);
  return m;
}

/** Material del líquido. Alta: transmisión con el índice del líquido; media: transparente. */
export function crearMaterialLiquido(liq: Liquido, calidad: Calidad): THREE.MeshPhysicalMaterial {
  // tinte: el agua casi incolora con un velo cian; la glicerina, ámbar muy pálido
  const tinte = liq.id === 'glicerina' ? '#f4ead0' : liq.id === 'alcohol' ? '#eaf6f6' : '#d3eff4';
  if (calidad === 'alta') {
    // espesor pequeño: la transmisión de three desplaza la imagen en pantalla según espesor·refracción;
    // con 6 cm la parte sumergida se veía partida y corrida. El tinte va en el color (multiplica lo transmitido).
    return new THREE.MeshPhysicalMaterial({
      color: tinte, metalness: 0, roughness: 0.06, transmission: 1, ior: liq.n, thickness: 0.05,
      specularIntensity: 1, envMapIntensity: 1.0,
      side: THREE.DoubleSide, name: 'f6-liquido',
    });
  }
  const tinteMedia = liq.id === 'glicerina' ? '#e2d3a6' : liq.id === 'alcohol' ? '#bfe3e6' : '#93d0de';
  return new THREE.MeshPhysicalMaterial({
    color: tinteMedia, metalness: 0, roughness: 0.04, transparent: true, opacity: 0.26, specularIntensity: 1,
    envMapIntensity: 1.2, depthWrite: false, side: THREE.DoubleSide, name: 'f6-liquido',
  });
}

// ───────────────────────────── mesa y tanque ─────────────────────────────

export function Mesa({ mats }: { mats: MatsF6 }) {
  return <mesh geometry={cajaRedondeada(14, 0.3, 6.4, 0.05, 3)} material={mats.mesa} position={[-0.6, -0.15, -0.6]} receiveShadow />;
}

/** Pared alicatada al fondo de la mesa: da al agua algo real que refractar (las juntas se ondulan con las ondas). */
export function Pared({ mats }: { mats: MatsF6 }) {
  return (
    <mesh material={mats.pared} position={[-0.6, 4.5, -3.8]} receiveShadow>
      <planeGeometry args={[15, 9]} />
    </mesh>
  );
}

/** Tanque de vidrio pegado con silicona sobre su zócalo. Origen en la mesa. */
export function Tanque({ mats }: { mats: MatsF6 }) {
  const { vidrio: t, ix, iz, ih, zocalo, yFondo } = COTAS;
  const ox = ix + t, oz = iz + t;
  const yMuro = yFondo + ih / 2;
  // cantos verdes: los bordes de arriba de las cuatro paredes y las aristas verticales
  const cantos = useMemo(() => {
    const e = 0.004, a = Y_BORDE + e / 2;
    return [
      { p: [0, a, iz + t / 2] as V3, s: [2 * ox, e, t] as V3 },
      { p: [0, a, -iz - t / 2] as V3, s: [2 * ox, e, t] as V3 },
      { p: [ix + t / 2, a, 0] as V3, s: [t, e, 2 * iz] as V3 },
      { p: [-ix - t / 2, a, 0] as V3, s: [t, e, 2 * iz] as V3 },
      { p: [ox - e / 2, yMuro, oz - t / 2] as V3, s: [e, ih, t] as V3 },
      { p: [-ox + e / 2, yMuro, oz - t / 2] as V3, s: [e, ih, t] as V3 },
      { p: [ox - e / 2, yMuro, -oz + t / 2] as V3, s: [e, ih, t] as V3 },
      { p: [-ox + e / 2, yMuro, -oz + t / 2] as V3, s: [e, ih, t] as V3 },
    ];
  }, [ix, iz, ih, ox, oz, t, yMuro]);
  // cordones de silicona en las aristas interiores (cuarto de caña)
  const silicona = useMemo(() => {
    const r = 0.022;
    const lista: { g: THREE.BufferGeometry; p: V3; r: V3 }[] = [];
    for (const sx of [-1, 1]) for (const sz of [-1, 1]) lista.push({ g: cilindro(r, r, ih, 8), p: [sx * (ix - r * 0.3), yMuro, sz * (iz - r * 0.3)], r: [0, 0, 0] });
    for (const sz of [-1, 1]) lista.push({ g: cilindro(r, r, 2 * ix, 8), p: [0, yFondo + r * 0.3, sz * (iz - r * 0.3)], r: [0, 0, Math.PI / 2] });
    for (const sx of [-1, 1]) lista.push({ g: cilindro(r, r, 2 * iz, 8), p: [sx * (ix - r * 0.3), yFondo + r * 0.3, 0], r: [Math.PI / 2, 0, 0] });
    return lista;
  }, [ix, iz, ih, yFondo, yMuro]);
  return (
    <group userData={{ pieza: 'tanque' }}>
      {/* zócalo de aluminio anodizado y la placa clara del fondo (se ve a través del vidrio) */}
      <mesh geometry={cajaRedondeada(2 * ox + 0.1, zocalo, 2 * oz + 0.1, 0.025, 3)} material={mats.zocalo} position={[0, zocalo / 2, 0]} castShadow receiveShadow />
      <mesh material={mats.placaFondo} position={[0, zocalo + 0.002, 0]} rotation-x={-Math.PI / 2} receiveShadow>
        <planeGeometry args={[2 * ox - 0.02, 2 * oz - 0.02]} />
      </mesh>
      {/* vidrio: fondo y cuatro paredes */}
      <mesh geometry={cajaRedondeada(2 * ox, t, 2 * oz, 0.004, 1)} material={mats.vidrio} position={[0, zocalo + t / 2, 0]} renderOrder={4} />
      <mesh geometry={cajaRedondeada(2 * ox, ih, t, 0.004, 1)} material={mats.vidrio} position={[0, yMuro, iz + t / 2]} renderOrder={6} />
      <mesh geometry={cajaRedondeada(2 * ox, ih, t, 0.004, 1)} material={mats.vidrio} position={[0, yMuro, -iz - t / 2]} renderOrder={4} />
      <mesh geometry={cajaRedondeada(t, ih, 2 * iz, 0.004, 1)} material={mats.vidrio} position={[ix + t / 2, yMuro, 0]} renderOrder={5} />
      <mesh geometry={cajaRedondeada(t, ih, 2 * iz, 0.004, 1)} material={mats.vidrio} position={[-ix - t / 2, yMuro, 0]} renderOrder={5} />
      {cantos.map((c, i) => (
        <mesh key={i} material={mats.canto} position={c.p} renderOrder={7}><boxGeometry args={c.s} /></mesh>
      ))}
      {silicona.map((s, i) => <mesh key={i} geometry={s.g} material={mats.silicona} position={s.p} rotation={s.r} renderOrder={3} />)}
    </group>
  );
}

// ───────────────────────────── el líquido ─────────────────────────────

const N_MENISCO = 7;

/**
 * Líquido del tanque: superficie (malla de la planta de las ondas), cuatro paredes y fondo,
 * y la franja del menisco contra el vidrio. Todo se reescribe en el sitio cada cuadro con el
 * nivel medio y el campo de ondas del reloj.
 */
export function Liquido3D({ reloj, liq, calidad }: { reloj: React.MutableRefObject<RelojTanque>; liq: Liquido; calidad: Calidad }) {
  const mat = useMemo(() => crearMaterialLiquido(liq, calidad), [liq, calidad]);
  useEffect(() => () => mat.dispose(), [mat]);
  const o = reloj.current.ondas;
  const nx = o.nx, nz = o.nz;
  const { ix, iz, yFondo } = COTAS;
  const ins = 0.002;
  const x0 = -ix + ins, x1 = ix - ins, z0 = -iz + ins, z1 = iz - ins;
  const dxU = (x1 - x0) / nx, dzU = (z1 - z0) / nz;

  // perfil del menisco: (distancia a la pared, altura) en u, de la pared hacia el líquido
  const perfil = useMemo(() => {
    const h0 = alturaMenisco(liq);
    const lc = longitudCapilar(liq);
    const p: [number, number][] = [];
    for (let i = 0; i < N_MENISCO; i++) {
      const z = h0 * Math.pow(1 - i / (N_MENISCO - 1), 1.6) * 0.98 + h0 * 0.02 * (1 - i / (N_MENISCO - 1));
      const x = i === N_MENISCO - 1 ? Math.max(perfilMenisco(liq, h0 * 0.06), 2.2 * lc) : perfilMenisco(liq, Math.max(z, h0 * 0.06));
      p.push([x * U, i === N_MENISCO - 1 ? 0 : z * U]);
    }
    return p;
  }, [liq]);

  const { geo, nTop, lados } = useMemo(() => {
    const vx = nx + 1, vz = nz + 1;
    const nTop = vx * vz;
    // paredes: 4 tiras de (n+1)×2 vértices; fondo: 4 vértices
    const lados = [
      { n: vx, fijo: z1, eje: 'x' as const, normal: [0, 0, 1] as V3, fila: (q: number) => [q, nz] as [number, number] },
      { n: vx, fijo: z0, eje: 'x' as const, normal: [0, 0, -1] as V3, fila: (q: number) => [q, 0] as [number, number] },
      { n: vz, fijo: x1, eje: 'z' as const, normal: [1, 0, 0] as V3, fila: (q: number) => [nx, q] as [number, number] },
      { n: vz, fijo: x0, eje: 'z' as const, normal: [-1, 0, 0] as V3, fila: (q: number) => [0, q] as [number, number] },
    ];
    const nLados = lados.reduce((s, l) => s + l.n * 2, 0);
    const total = nTop + nLados + 4;
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    const idx: number[] = [];
    for (let k = 0; k < vz; k++) for (let i = 0; i < vx; i++) {
      const v = k * vx + i;
      pos.set([x0 + i * dxU, 2, z0 + k * dzU], v * 3); nor.set([0, 1, 0], v * 3);
    }
    for (let k = 0; k < nz; k++) for (let i = 0; i < nx; i++) {
      const a = k * vx + i, b = a + 1, c = a + vx, d = c + 1;
      idx.push(a, c, b, b, c, d);
    }
    let base = nTop;
    for (const l of lados) {
      for (let q = 0; q < l.n; q++) {
        const t = l.eje === 'x' ? x0 + q * dxU : z0 + q * dzU;
        const pTop = l.eje === 'x' ? [t, 2, l.fijo] : [l.fijo, 2, t];
        const pBot = l.eje === 'x' ? [t, yFondo + 0.001, l.fijo] : [l.fijo, yFondo + 0.001, t];
        pos.set(pTop, (base + q * 2) * 3); pos.set(pBot, (base + q * 2 + 1) * 3);
        nor.set(l.normal, (base + q * 2) * 3); nor.set(l.normal, (base + q * 2 + 1) * 3);
      }
      for (let q = 0; q < l.n - 1; q++) {
        const a = base + q * 2, b = a + 1, c = a + 2, d = a + 3;
        // caras hacia fuera (el material es de dos caras: el orden sólo afecta a la sombra)
        if (l.normal[0] + l.normal[2] > 0) idx.push(a, b, c, c, b, d); else idx.push(a, c, b, c, d, b);
      }
      base += l.n * 2;
    }
    const f = base;
    pos.set([x0, yFondo + 0.001, z0, x1, yFondo + 0.001, z0, x0, yFondo + 0.001, z1, x1, yFondo + 0.001, z1], f * 3);
    for (let q = 0; q < 4; q++) nor.set([0, -1, 0], (f + q) * 3);
    idx.push(f, f + 1, f + 2, f + 1, f + 3, f + 2);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3).setUsage(THREE.DynamicDrawUsage));
    g.setIndex(idx);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 1.8, 0), 3.4);
    return { geo: g, nTop, lados };
  }, [nx, nz, x0, x1, z0, z1, dxU, dzU, yFondo]);
  useEffect(() => () => geo.dispose(), [geo]);

  // menisco: una tira por pared, de la pared (arriba) hacia dentro (abajo, hasta el nivel)
  const menisco = useMemo(() => {
    const paredes = [
      { n: nx + 1, fila: (q: number) => [q, nz] as [number, number], dir: [0, -1] as [number, number], borde: (q: number) => [x0 + q * dxU, z1] as [number, number] },
      { n: nx + 1, fila: (q: number) => [q, 0] as [number, number], dir: [0, 1] as [number, number], borde: (q: number) => [x0 + q * dxU, z0] as [number, number] },
      { n: nz + 1, fila: (q: number) => [nx, q] as [number, number], dir: [-1, 0] as [number, number], borde: (q: number) => [x1, z0 + q * dzU] as [number, number] },
      { n: nz + 1, fila: (q: number) => [0, q] as [number, number], dir: [1, 0] as [number, number], borde: (q: number) => [x0, z0 + q * dzU] as [number, number] },
    ];
    const total = paredes.reduce((s, p) => s + p.n * N_MENISCO, 0);
    const pos = new Float32Array(total * 3), nor = new Float32Array(total * 3);
    const idx: number[] = [];
    let base = 0;
    for (const p of paredes) {
      for (let q = 0; q < p.n; q++) for (let s = 0; s < N_MENISCO; s++) {
        // normal del perfil: perpendicular a la tangente (dx, dz) del menisco, hacia arriba y hacia la pared
        const a = perfil[Math.max(0, s - 1)], b = perfil[Math.min(N_MENISCO - 1, s + 1)];
        const tx = b[0] - a[0], tz = b[1] - a[1];
        const l = Math.hypot(tx, tz) || 1;
        const nh = -tz / l, nv = tx / l; // componente hacia el líquido (+dir) y vertical
        const v = base + q * N_MENISCO + s;
        nor.set([p.dir[0] * nh, nv, p.dir[1] * nh], v * 3);
      }
      for (let q = 0; q < p.n - 1; q++) for (let s = 0; s < N_MENISCO - 1; s++) {
        const a = base + q * N_MENISCO + s, b = a + 1, c = a + N_MENISCO, d = c + 1;
        idx.push(a, b, c, c, b, d);
      }
      base += p.n * N_MENISCO;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3).setUsage(THREE.DynamicDrawUsage));
    g.setAttribute('normal', new THREE.BufferAttribute(nor, 3));
    g.setIndex(idx);
    sanearNormales(g);
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(0, 2, 0), 3.4);
    return { g, paredes };
  }, [nx, nz, x0, x1, z0, z1, dxU, dzU, perfil]);
  useEffect(() => () => menisco.g.dispose(), [menisco]);

  const alturas = useMemo(() => new Float32Array((nx + 1) * (nz + 1)), [nx, nz]);
  useFrame(() => {
    const r = reloj.current;
    const on = r.ondas;
    if (on.nx !== nx || on.nz !== nz) return;
    const yMedio = yFondo + r.s.ys * U;
    const vx = nx + 1;
    for (let k = 0; k <= nz; k++) for (let i = 0; i <= nx; i++) alturas[k * vx + i] = yMedio + on.alturaVertice(i, k) * U;
    const pos = geo.getAttribute('position') as THREE.BufferAttribute;
    const nor = geo.getAttribute('normal') as THREE.BufferAttribute;
    const P = pos.array as Float32Array, N = nor.array as Float32Array;
    for (let k = 0; k <= nz; k++) for (let i = 0; i <= nx; i++) {
      const v = k * vx + i;
      P[v * 3 + 1] = alturas[v];
      const hl = alturas[k * vx + Math.max(0, i - 1)], hr = alturas[k * vx + Math.min(nx, i + 1)];
      const hd = alturas[Math.max(0, k - 1) * vx + i], hu = alturas[Math.min(nz, k + 1) * vx + i];
      const gx = (hr - hl) / ((Math.min(nx, i + 1) - Math.max(0, i - 1)) * dxU);
      const gz = (hu - hd) / ((Math.min(nz, k + 1) - Math.max(0, k - 1)) * dzU);
      const l = Math.hypot(gx, 1, gz);
      N[v * 3] = -gx / l; N[v * 3 + 1] = 1 / l; N[v * 3 + 2] = -gz / l;
    }
    let base = nTop;
    for (const l of lados) {
      for (let q = 0; q < l.n; q++) { const [i, k] = l.fila(q); P[(base + q * 2) * 3 + 1] = alturas[k * vx + i]; }
      base += l.n * 2;
    }
    pos.needsUpdate = true; nor.needsUpdate = true;
    // menisco
    const pm = menisco.g.getAttribute('position') as THREE.BufferAttribute;
    const M = pm.array as Float32Array;
    let b = 0;
    for (const p of menisco.paredes) {
      for (let q = 0; q < p.n; q++) {
        const [i, k] = p.fila(q);
        const h = alturas[k * vx + i];
        const [bx, bz] = p.borde(q);
        for (let s = 0; s < N_MENISCO; s++) {
          const v = (b + q * N_MENISCO + s) * 3;
          M[v] = bx + p.dir[0] * perfil[s][0]; M[v + 1] = h + perfil[s][1]; M[v + 2] = bz + p.dir[1] * perfil[s][0];
        }
      }
      b += p.n * N_MENISCO;
    }
    pm.needsUpdate = true;
  }, -1);

  return (
    <group userData={{ pieza: 'liquido' }}>
      <mesh geometry={geo} material={mat} renderOrder={2} />
      <mesh geometry={menisco.g} material={mat} renderOrder={2} />
    </group>
  );
}

// ───────────────────────────── cuerpos ─────────────────────────────

/** Bloque del juego de igual volumen (geometría tumbada de 8 × 4 × 8 cm; la postura de canto la gira 90°). */
export function Bloque({ material, mats }: { material: IdMaterial; mats: MatsF6 }) {
  const radio = material === 'hielo' ? 0.045 : material === 'pino' ? 0.018 : 0.012;
  return (
    <mesh geometry={cajaRedondeada(0.8, 0.4, 0.8, radio, 4)} material={mats.cuerpo[material]} castShadow receiveShadow userData={{ pieza: 'cuerpo' }} />
  );
}

/** Cilindro problema torneado con chaflanes y su armella. Origen en G (el centro). */
export function CilindroProblema({ c, mats }: { c: Cuerpo; mats: MatsF6 }) {
  const r = c.r * U, h = c.h * U, ch = Math.min(0.025, r * 0.12);
  const geo = useMemo(() => tornear([
    [0.0005, -h / 2], [r - ch, -h / 2], [r, -h / 2 + ch], [r, h / 2 - ch], [r - ch, h / 2], [0.0005, h / 2],
  ], 56), [r, h, ch]);
  useEffect(() => () => geo.dispose(), [geo]);
  return (
    <group userData={{ pieza: 'cuerpo' }}>
      <mesh geometry={geo} material={mats.cuerpo.problema} castShadow receiveShadow />
      <mesh geometry={cilindro(0.028, 0.034, 0.03, 16)} material={mats.acero} position={[0, h / 2 + 0.015, 0]} castShadow />
      <mesh geometry={toro(0.042, 0.011, 8, 22)} material={mats.acero} position={[0, h / 2 + 0.072, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── soporte, dinamómetro e hilo ─────────────────────────────

/** Soporte universal con su base, la varilla, la nuez (a la altura `yBrazo`) y el brazo hasta x = 0. */
export function Soporte({ mats, grupoNuez }: { mats: MatsF6; grupoNuez: React.RefObject<THREE.Group | null> }) {
  const { xVarilla, altoVarilla } = COTAS;
  const largo = -xVarilla + 0.06;
  const base = useMemo(() => cajaRedondeada(1.5, 0.16, 2.3, 0.08, 4), []);
  return (
    <group userData={{ pieza: 'soporte' }}>
      <mesh geometry={base} material={mats.pintura} position={[xVarilla - 0.25, 0.08, 0.35]} castShadow receiveShadow />
      <mesh geometry={tornear([[0.0005, 0], [0.17, 0], [0.17, 0.03], [0.1, 0.11], [0.0005, 0.11]], 32)} material={mats.pintura} position={[xVarilla, 0.16, 0]} castShadow />
      <mesh geometry={cilindro(0.06, 0.06, altoVarilla, 24)} material={mats.acero} position={[xVarilla, 0.16 + altoVarilla / 2, 0]} castShadow />
      <mesh geometry={esfera(0.06, 16)} material={mats.acero} position={[xVarilla, 0.16 + altoVarilla, 0]} scale={[1, 0.4, 1]} />
      <group ref={grupoNuez} position={[xVarilla, 5, 0]}>
        <mesh geometry={cajaRedondeada(0.3, 0.42, 0.28, 0.05, 3)} material={mats.nuez} castShadow />
        <mesh geometry={cajaRedondeada(0.3, 0.26, 0.3, 0.05, 3)} material={mats.nuez} position={[0.26, -0.02, 0]} castShadow />
        <mesh geometry={cilindro(0.025, 0.025, 0.22, 12)} material={mats.acero} position={[0, 0.03, -0.24]} rotation-x={Math.PI / 2} />
        <mesh geometry={cajaRedondeada(0.24, 0.07, 0.07, 0.03, 2)} material={mats.perilla} position={[0, 0.03, -0.36]} castShadow />
        <mesh geometry={cilindro(0.025, 0.025, 0.2, 12)} material={mats.acero} position={[0.26, 0.17, 0]} />
        <mesh geometry={cajaRedondeada(0.07, 0.07, 0.22, 0.03, 2)} material={mats.perilla} position={[0.26, 0.28, 0]} castShadow />
        {/* brazo de acero hasta el eje del tanque */}
        <mesh geometry={cilindro(0.045, 0.045, largo, 16)} material={mats.acero} position={[largo / 2 + 0.1, -0.02, 0]} rotation-z={Math.PI / 2} castShadow />
        <mesh geometry={toro(0.055, 0.012, 8, 20)} material={mats.acero} position={[-xVarilla, -0.1, 0]} castShadow />
      </group>
    </group>
  );
}

/** Hélice del muelle (de 0 a −1 en y; se escala con el alargamiento). */
let GEO_MUELLE: THREE.BufferGeometry | null = null;
function geoMuelle() {
  if (!GEO_MUELLE) {
    const pts: number[] = [];
    const vueltas = 26, n = vueltas * 18;
    for (let i = 0; i <= n; i++) { const t = i / n, a = t * vueltas * Math.PI * 2; pts.push(Math.cos(a) * 0.055, -t, Math.sin(a) * 0.055); }
    GEO_MUELLE = tuboPolilinea(new Float32Array(pts), 0.008, 6, false);
  }
  return GEO_MUELLE;
}

/**
 * Dinamómetro de tubo. Origen en el ARO; cuelga hacia −Y. Las partes móviles (muelle,
 * índice, vástago y gancho) las mueve la escena cada cuadro por las refs.
 */
export function Dinamometro({ mats, muelle, movil }: { mats: MatsF6; muelle: React.RefObject<THREE.Mesh | null>; movil: React.RefObject<THREE.Group | null> }) {
  const R = 0.13, L = COTAS.largoDin, escala = ESCALA_DINAMOMETRO * U;
  const yCero = -0.42;
  return (
    <group userData={{ pieza: 'dinamometro' }}>
      <mesh geometry={toro(0.075, 0.014, 8, 24)} material={mats.acero} castShadow />
      <mesh geometry={cilindro(0.014, 0.014, 0.12, 8)} material={mats.acero} position={[0, -0.11, 0]} />
      <mesh geometry={tornear([[0.0005, 0], [R + 0.018, 0], [R + 0.022, 0.03], [R + 0.022, 0.12], [R + 0.01, 0.15], [0.0005, 0.15]], 32)} material={mats.tapa} position={[0, -0.32, 0]} castShadow />
      <mesh geometry={cilindro(R, R, L - 0.5, 32, true)} material={mats.tubo} position={[0, -0.32 - (L - 0.5) / 2, 0]} renderOrder={8} />
      <mesh geometry={tornear([[0.0005, 0], [R + 0.016, 0], [R + 0.016, 0.06], [0.03, 0.08], [0.0005, 0.08]], 32)} material={mats.tapa} position={[0, -L + 0.12, 0]} castShadow />
      {/* escala de rayas, del cero al alcance */}
      <mesh material={mats.escala} position={[0, yCero - escala / 2, 0]} rotation-y={0.0}>
        <cylinderGeometry args={[R * 0.74, R * 0.74, escala + 0.05, 24, 1, true, -0.55, 1.1]} />
      </mesh>
      <mesh ref={muelle} geometry={geoMuelle()} material={mats.acero} position={[0, -0.33, 0]} />
      <group ref={movil} position={[0, yCero, 0]}>
        <mesh geometry={cilindro(R * 0.85, R * 0.85, 0.03, 24)} material={mats.indice} />
        <mesh geometry={cilindro(0.013, 0.013, -yCero + L - 0.42, 8)} material={mats.acero} position={[0, -(-yCero + L - 0.42) / 2, 0]} />
        <mesh geometry={tuboPolilinea(new Float32Array(ganchoPts(-L - yCero)), 0.011, 8, true)} material={mats.acero} castShadow />
      </group>
    </group>
  );
}
/** Gancho en J al final del vástago (punto de cuelgue en y = yG). */
function ganchoPts(yG: number) {
  const r = 0.05, p: number[] = [0, yG + 0.08, 0, 0, yG + r, 0];
  for (let i = 0; i <= 18; i++) { const a = Math.PI + (i / 18) * Math.PI * 1.3; p.push(r * Math.cos(a) + r, yG + r + r * Math.sin(a), 0); }
  return p;
}

/** Hilo de nailon: recto si está tenso; con flecha (parábola) si cuelga flojo. */
export function Hilo({ mats, malla }: { mats: MatsF6; malla: React.RefObject<THREE.Mesh | null> }) {
  return <mesh ref={malla} material={mats.hilo}><bufferGeometry /></mesh>;
}
export function geoHilo(a: V3, b: V3, flojo: number): THREE.BufferGeometry {
  const n = 14, p: number[] = [];
  for (let i = 0; i <= n; i++) {
    const t = i / n;
    p.push(a[0] + (b[0] - a[0]) * t + Math.sin(Math.PI * t) * flojo * 0.35, a[1] + (b[1] - a[1]) * t - Math.sin(Math.PI * t) * flojo, a[2] + (b[2] - a[2]) * t);
  }
  return tuboPolilinea(new Float32Array(p), 0.0045, 5, false);
}

// ───────────────────────────── flechas de fuerza y marcas G, B ─────────────────────────────

/** Flecha unidad (de 0 a +1 en y): asta y punta. Se escala en y con la fuerza. */
export function geoFlecha(radio: number) {
  const asta = cilindro(radio, radio, 1, 12);
  return asta;
}
export function geoPunta(radio: number) {
  return tornear([[0.0005, 0], [radio * 2.6, 0], [0.0005, radio * 6.5]], 16);
}

/** Marca del centro de masa: disco a cuartos blanco y negro (el símbolo de los planos). */
export function MarcaG({ mats, r = 0.05 }: { mats: MatsF6; r?: number }) {
  const cuartos = useMemo(() => [0, 1, 2, 3].map((k) => {
    const g = new THREE.CircleGeometry(r, 12, (k * Math.PI) / 2, Math.PI / 2);
    return g;
  }), [r]);
  useEffect(() => () => cuartos.forEach((g) => g.dispose()), [cuartos]);
  return (
    <group>
      <mesh geometry={toro(r, r * 0.12, 6, 28)} material={mats.marcaGOscura} />
      {cuartos.map((g, k) => <mesh key={k} geometry={g} material={k % 2 ? mats.marcaGOscura : mats.marcaG} />)}
    </group>
  );
}

/** Hook auxiliar: una geometría que se libera al desmontar. */
export function useGeo<T extends THREE.BufferGeometry>(crear: () => T, deps: unknown[]): T {
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const g = useMemo(crear, deps);
  useEffect(() => () => g.dispose(), [g]);
  return g;
}

/** Cuenta normales nulas o no finitas de la escena (diagnóstico de pantalla negra). */
export function contarNormalesCero(o: THREE.Object3D): { mallas: number; normalesCero: number; conCero: string[] } {
  let mallas = 0, normalesCero = 0;
  const conCero: string[] = [];
  o.traverse((x) => {
    const g = (x as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
    if (!g || !(x as THREE.Mesh).isMesh) return;
    mallas++;
    const n = g.getAttribute('normal');
    if (!n) return;
    let c = 0;
    for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) c++;
    if (c) conCero.push(`${x.name || g.type}:${c}`);
    normalesCero += c;
  });
  return { mallas, normalesCero, conCero };
}

/** Fija una vez la matriz de un objeto estático. */
export function useEstatico(ref: React.RefObject<THREE.Object3D | null>) {
  useLayoutEffect(() => { const o = ref.current; if (!o) return; o.updateMatrixWorld(true); o.matrixAutoUpdate = false; }, [ref]);
}

