/**
 * bio03/materiales.ts — el aspecto de «animación molecular» (three).
 *
 *  · Cera: PBR con entorno, rugosidad media, brillo satinado (sheen) y un BORDE de luz
 *    (fresnel) que recorta cada molécula del fondo, como en las animaciones de WEHI.
 *  · Cáscara translúcida (polimerasa, ribosoma): la misma cera, pero el alfa sube con
 *    el fresnel: el centro deja ver lo que hay dentro (la burbuja, los ARNt) y el borde
 *    dibuja la forma. Para que una superficie cóncava no se mezcle consigo misma se pinta
 *    antes una pasada SÓLO de profundidad (`preProfundidad`): de la cáscara se ve sólo su
 *    capa delantera. Ambas van en la cola transparente, DESPUÉS de lo opaco de dentro.
 *  · Brillos (Mg²⁺, puentes de H, chispa del enlace peptídico): emisivos por encima del
 *    umbral del bloom; nada más brilla.
 *  · Bokeh: discos suaves de partículas desenfocadas del fondo (nucleoplasma/citoplasma).
 */
import * as THREE from 'three';

export interface OpcionesCera {
  color?: THREE.ColorRepresentation;
  vertexColors?: boolean;
  rugosidad?: number;
  borde?: THREE.ColorRepresentation;
  fuerzaBorde?: number;
  potenciaBorde?: number;
  /** alfa en el centro y en el borde (sólo cáscaras) */
  alfa?: [number, number];
  emisivo?: THREE.ColorRepresentation;
  intensidadEmisiva?: number;
  clearcoat?: number;
}

/** Cera molecular con borde fresnel (y alfa por fresnel si `alfa`). */
export function materialCera(o: OpcionesCera = {}): THREE.MeshPhysicalMaterial {
  const translucido = !!o.alfa;
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? '#ffffff',
    vertexColors: !!o.vertexColors,
    roughness: o.rugosidad ?? 0.5,
    metalness: 0,
    sheen: 0.65,
    sheenRoughness: 0.42,
    sheenColor: new THREE.Color('#ffffff'),
    clearcoat: o.clearcoat ?? 0.18,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.75,
    emissive: o.emisivo ?? '#000000',
    emissiveIntensity: o.intensidadEmisiva ?? 1,
    transparent: translucido,
    depthWrite: !translucido,
    side: THREE.FrontSide,
  });
  const borde = new THREE.Color(o.borde ?? '#cfe4ff');
  const uni = {
    uBorde: { value: borde },
    uFuerza: { value: o.fuerzaBorde ?? 0.35 },
    uPot: { value: o.potenciaBorde ?? 2.6 },
    uA0: { value: o.alfa?.[0] ?? 1 },
    uA1: { value: o.alfa?.[1] ?? 1 },
  };
  m.userData.uniformesBorde = uni;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uBorde; uniform float uFuerza; uniform float uPot; uniform float uA0; uniform float uA1;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      {
        float frBorde = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), uPot);
        gl_FragColor.rgb += uBorde * frBorde * uFuerza;
        ${translucido ? 'gl_FragColor.a = mix(uA0, uA1, frBorde) * diffuseColor.a;' : ''}
      }`);
  };
  m.customProgramCacheKey = () => `bio03cera:${translucido ? 't' : 'o'}`;
  return m;
}

/** Pasada sólo de profundidad para una cáscara translúcida (va justo antes que ella). */
export function materialPreProfundidad(): THREE.MeshBasicMaterial {
  return new THREE.MeshBasicMaterial({ colorWrite: false, depthWrite: true, transparent: true, side: THREE.FrontSide });
}

/** Emisivo puro para lo que brilla (con bloom en calidad alta). */
export function materialBrillo(color: THREE.ColorRepresentation, intensidad = 2.2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensidad, roughness: 1, metalness: 0, toneMapped: true });
}

/** Textura de halo radial (para brillos en sprite). */
let haloCache: THREE.CanvasTexture | null = null;
export function texturaHalo(): THREE.CanvasTexture {
  if (haloCache) return haloCache;
  const c = document.createElement('canvas');
  c.width = c.height = 128;
  const g = c.getContext('2d')!;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.18, 'rgba(255,255,255,0.75)');
  gr.addColorStop(0.45, 'rgba(255,255,255,0.18)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  haloCache = new THREE.CanvasTexture(c);
  haloCache.colorSpace = THREE.SRGBColorSpace;
  return haloCache;
}

/**
 * Puntos de bokeh: discos suaves con tamaño en perspectiva (nm), atenuados con la
 * distancia como la niebla. `aColor` y `aTam` por punto.
 */
export function materialBokeh(colorNiebla: THREE.Color, pixeles: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true,
    depthWrite: false,
    blending: THREE.NormalBlending,
    uniforms: { uEscala: { value: pixeles }, uNiebla: { value: colorNiebla }, uDens: { value: 0.012 }, uOpac: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aTam;
      uniform float uEscala; uniform float uDens;
      varying vec3 vColor; varying float vNiebla;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        gl_PointSize = clamp(aTam * uEscala / max(1.0, d), 1.0, 160.0);
        vColor = aColor;
        vNiebla = 1.0 - exp(-uDens * uDens * d * d);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uNiebla; uniform float uOpac;
      varying vec3 vColor; varying float vNiebla;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        float a = smoothstep(1.0, 0.25, r) * 0.55 + smoothstep(1.0, 0.86, r) * 0.12;
        vec3 c = mix(vColor, uNiebla, vNiebla * 0.85);
        gl_FragColor = vec4(c, a * (1.0 - 0.6 * vNiebla) * uOpac);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Proteína en CORTE: la misma cera, opaca, recortada por un plano (lo de delante se
 * quita) y con la cara de sección PLANA, sin sombreado (el interior que deja ver el corte),
 * de un tono claro del color del dominio. El plano está en el marco de la molécula:
 * `actualizarCorte` lo lleva cada cuadro al mundo (el conjunto gira despacio).
 */
export function materialCorte(o: OpcionesCera & { plano: THREE.Plane }): THREE.MeshPhysicalMaterial {
  const m = materialCera({ ...o, alfa: undefined });
  m.side = THREE.DoubleSide;
  m.clippingPlanes = [o.plano.clone()];
  m.userData.planoLocal = o.plano.clone();
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    sh.fragmentShader = sh.fragmentShader.replace('#include <dithering_fragment>', `#include <dithering_fragment>
      if (!gl_FrontFacing) {
        #if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
          vec3 base = vColor.rgb;
        #else
          vec3 base = diffuse;
        #endif
        float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
        vec3 tapa = mix(base, vec3(luma), 0.3) * 0.58;
        gl_FragColor = vec4(tapa, 1.0);
        #include <colorspace_fragment>
      }`);
  };
  m.customProgramCacheKey = () => 'bio03corte';
  return m;
}

/** Lleva el plano de corte (en el marco de la molécula) al mundo. */
export function actualizarCorte(m: THREE.Material, mundo: THREE.Matrix4) {
  const local = m.userData.planoLocal as THREE.Plane | undefined;
  if (!local || !m.clippingPlanes?.length) return;
  m.clippingPlanes[0].copy(local).applyMatrix4(mundo);
}
