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
 * Proteína en CORTE con VENTANA: la misma cera, opaca, a la que se le quita una región
 * —la intersección de los semiespacios negativos de `planos` (three: clipIntersection)—
 * para ver lo de dentro sin perder la silueta (la pinza de la Pol II, la cabeza de la
 * 40S, la protuberancia central y los tallos de la 60S quedan enteros).
 *  · Cara de sección (lo que se ve del interior por la ventana): tono OSCURO del color
 *    del dominio, sin luz, con RAYADO fino a 45° anclado a la molécula (paso 0,36 nm), en
 *    sentidos opuestos en piezas vecinas, como en un plano de taller; de lejos el rayado
 *    se funde en el tono medio (sin moaré).
 *  · Borde de corte: una línea clara de ≈ 0,1 nm donde la superficie toca la ventana.
 * Los planos están en el marco de la molécula: `actualizarCorte` los lleva cada cuadro
 * al mundo (el conjunto gira despacio).
 */
export function materialCorte(o: OpcionesCera & { planos: THREE.Plane[]; sentidoRayado?: 1 | -1 }): THREE.MeshPhysicalMaterial {
  const m = materialCera({ ...o, alfa: undefined });
  m.side = THREE.DoubleSide;
  m.clippingPlanes = o.planos.map((q) => q.clone());
  m.clipIntersection = o.planos.length > 1;
  m.userData.planosLocales = o.planos.map((q) => q.clone());
  const signo = (o.sentidoRayado ?? 1) > 0 ? '+' : '-';
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosObj;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vPosObj = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosObj;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      {
        // distancia (nm) a la región quitada: la mayor de las distancias con signo a los planos
        float sCorte = 1e5;
        #if NUM_CLIPPING_PLANES > 0
          sCorte = -1e5;
          for (int i = 0; i < NUM_CLIPPING_PLANES; i++) {
            vec4 pl = clippingPlanes[i];
            sCorte = max(sCorte, pl.w - dot(vClipPosition, pl.xyz));
          }
        #endif
        float bordeCorte = 1.0 - smoothstep(0.05, 0.16, sCorte);
        if (!gl_FrontFacing) {
          #if defined( USE_COLOR ) || defined( USE_COLOR_ALPHA )
            vec3 base = vColor.rgb;
          #else
            vec3 base = diffuse;
          #endif
          float luma = dot(base, vec3(0.2126, 0.7152, 0.0722));
          vec3 tapa = mix(base, vec3(luma), 0.35) * 0.36;
          // rayado a 45°, paso 0,36 nm, anclado a la molécula; se funde si se aprieta
          float u = (vPosObj.x ${signo} vPosObj.y) / 0.36;
          float fw = fwidth(u);
          float t = min(fract(u), 1.0 - fract(u));
          float linea = (1.0 - smoothstep(0.11 - fw, 0.11 + fw, t)) * (1.0 - smoothstep(0.16, 0.34, fw));
          tapa = mix(tapa, tapa * 0.45, linea);
          tapa = mix(tapa, vec3(0.86, 0.84, 0.8), 0.8 * bordeCorte);
          gl_FragColor = vec4(tapa, 1.0);
          #include <colorspace_fragment>
        } else {
          gl_FragColor.rgb = mix(gl_FragColor.rgb, vec3(1.0, 0.97, 0.9), 0.75 * bordeCorte);
        }
      }`);
  };
  m.customProgramCacheKey = () => `bio03corte${signo}`;
  return m;
}

/** Lleva los planos de la ventana (en el marco de la molécula) al mundo. */
export function actualizarCorte(m: THREE.Material, mundo: THREE.Matrix4) {
  const locales = m.userData.planosLocales as THREE.Plane[] | undefined;
  if (!locales || !m.clippingPlanes) return;
  for (let i = 0; i < locales.length && i < m.clippingPlanes.length; i++) m.clippingPlanes[i].copy(locales[i]).applyMatrix4(mundo);
}
