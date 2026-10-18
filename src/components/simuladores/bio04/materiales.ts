/**
 * bio04/materiales.ts — el aspecto de «ilustración celular» de la escena (three).
 *
 *  · CERA: PBR con entorno, brillo satinado (sheen) y un BORDE de luz (fresnel) que recorta
 *    cada pieza del fondo oscuro. Sin texturas de ruido: el color varía sólo con la luz.
 *  · CORTE: la misma cera con el plano de corte del cloroplasto (z = 0, se queda la mitad
 *    de atrás). Lo que se ve del INTERIOR por el corte (caras traseras) se pinta como cara
 *    de sección: tono de la pieza oscurecido, sin luz, con rayado técnico fino a 45° que se
 *    funde cuando el paso baja de 3 px (fwidth), y una línea clara en el borde del corte.
 *  · FANTASMA: cáscara translúcida cuyo alfa sube con el fresnel (la mitad delantera de la
 *    envoltura: dibuja la silueta sin tapar el interior).
 *  · BRILLO: emisivo por instancia (color × intensidad HDR) para lo que emite luz: fotones,
 *    destellos, electrones y H⁺. Es lo único que pasa el umbral del bloom.
 */
import * as THREE from 'three';

export interface OpcionesCera {
  color?: THREE.ColorRepresentation;
  vertexColors?: boolean;
  rugosidad?: number;
  borde?: THREE.ColorRepresentation;
  fuerzaBorde?: number;
  potenciaBorde?: number;
  sheen?: number;
  clearcoat?: number;
  emisivo?: THREE.ColorRepresentation;
  intensidadEmisiva?: number;
  transmision?: number;
}

const FRESNEL_GLSL = /* glsl */ `
  float frBorde = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), uPot);
`;

/** Cera con borde fresnel. */
export function materialCera(o: OpcionesCera = {}, clave = 'cera'): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? '#ffffff',
    vertexColors: !!o.vertexColors,
    roughness: o.rugosidad ?? 0.52,
    metalness: 0,
    // satinado del MISMO tono (un sheen blanco lechosea todo)
    sheen: o.sheen ?? 0,
    sheenRoughness: 0.5,
    sheenColor: new THREE.Color(o.color ?? '#ffffff').lerp(new THREE.Color('#ffffff'), 0.25),
    clearcoat: o.clearcoat ?? 0.14,
    clearcoatRoughness: 0.42,
    envMapIntensity: 0.8,
    emissive: o.emisivo ?? '#000000',
    emissiveIntensity: o.intensidadEmisiva ?? 1,
  });
  const uni = {
    uBorde: { value: new THREE.Color(o.borde ?? '#d8f5e0') },
    uFuerza: { value: o.fuerzaBorde ?? 0.32 },
    uPot: { value: o.potenciaBorde ?? 2.6 },
  };
  m.userData.uniformesBorde = uni;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uBorde; uniform float uFuerza; uniform float uPot;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      {
        ${FRESNEL_GLSL}
        gl_FragColor.rgb += uBorde * frBorde * uFuerza;
      }`);
  };
  m.customProgramCacheKey = () => `bio04${clave}`;
  return m;
}

export interface OpcionesCorte extends OpcionesCera {
  /** plano(s) de corte en el MUNDO (three conserva el semiespacio positivo de cada plano) */
  planos: THREE.Plane[];
  /** color de la cara de sección (por defecto, el de la pieza oscurecido) */
  colorSeccion?: THREE.ColorRepresentation;
  /** paso del rayado (u) */
  pasoRayado?: number;
  /** sentido del rayado (45° o −45°) */
  sentido?: 1 | -1;
  /** color de las caras delanteras distinto por instancia (lumen por pH) */
  colorUniforme?: boolean;
  /** recorta sólo lo que queda fuera de TODOS los planos (corte en cuña) */
  interseccion?: boolean;
}

/**
 * Cera cortada por un plano: las caras traseras que asoman por el corte son la SECCIÓN.
 * `uFrente` (si `colorUniforme`) tiñe las caras delanteras: lo usa el lumen para el pH.
 */
export function materialCorte(o: OpcionesCorte, clave: string): THREE.MeshPhysicalMaterial {
  const m = materialCera(o, clave);
  m.side = THREE.DoubleSide;
  m.clippingPlanes = o.planos;
  m.clipIntersection = !!o.interseccion;
  m.clipShadows = true;
  const seccion = new THREE.Color(o.colorSeccion ?? new THREE.Color(o.color ?? '#ffffff').multiplyScalar(0.55));
  const uni = {
    uSeccion: { value: seccion },
    uPaso: { value: o.pasoRayado ?? 0.05 },
  };
  m.userData.uniformesCorte = uni;
  const signo = (o.sentido ?? 1) > 0 ? '+' : '-';
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 pmB4 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          pmB4 = instanceMatrix * pmB4;
        #endif
        vPosMundo = (modelMatrix * pmB4).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMundo; uniform vec3 uSeccion; uniform float uPaso;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      if (!gl_FrontFacing) {
        // cara de sección: plana, del tono de la pieza, con rayado a 45° en el plano del corte
        // (x ± (y + z): en el plano z = 0 es x ± y; en el plano y = cte es x ± z)
        float u = (vPosMundo.x ${signo} (vPosMundo.y + vPosMundo.z)) / uPaso;
        float fw = fwidth(u);
        float t = min(fract(u), 1.0 - fract(u));
        float linea = (1.0 - smoothstep(0.12 - fw, 0.12 + fw, t)) * (1.0 - smoothstep(0.22, 0.34, fw));
        vec3 tapa = mix(uSeccion, uSeccion * 0.72, linea);
        gl_FragColor = vec4(tapa, 1.0);
        #include <colorspace_fragment>
      }`);
  };
  m.customProgramCacheKey = () => `bio04corte${clave}${signo}`;
  return m;
}

/** Cáscara fantasma: alfa por fresnel (0 de frente, `alfaBorde` en la silueta). */
export function materialFantasma(color: THREE.ColorRepresentation, alfaBorde: number, planos: THREE.Plane[] = []): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    clipping: planos.length > 0, clippingPlanes: planos,
    uniforms: { uColor: { value: new THREE.Color(color) }, uAlfa: { value: alfaBorde } },
    vertexShader: /* glsl */ `
      #include <clipping_planes_pars_vertex>
      varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 mvPosition = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mvPosition.xyz;
        gl_Position = projectionMatrix * mvPosition;
        #include <clipping_planes_vertex>
      }`,
    fragmentShader: /* glsl */ `
      #include <clipping_planes_pars_fragment>
      uniform vec3 uColor; uniform float uAlfa;
      varying vec3 vN; varying vec3 vV;
      void main() {
        #include <clipping_planes_fragment>
        float f = pow(1.0 - clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 2.4);
        gl_FragColor = vec4(uColor, uAlfa * f);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Emisivo por instancia: el color de instancia multiplica la emisión. En alta se pasa de 1
 * para que el bloom les dé halo; en media (sin bloom) se queda en ~1.
 */
export function materialBrillo(clave = 'brillo'): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#101412', roughness: 0.35, metalness: 0, emissive: '#ffffff', emissiveIntensity: 1 });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif',
    );
  };
  m.customProgramCacheKey = () => `bio04${clave}`;
  return m;
}

/**
 * Bicapa lipídica (vista de la membrana): cera translúcida. En las caras de arriba y de abajo
 * se ven las CABEZAS de los lípidos como cúpulas en red hexagonal (0,3 u ≈ 0,7 nm de paso:
 * el tamaño real de una cabeza), con su sombreado de relieve; la red se funde con el tono
 * medio cuando una celda baja de ~3 px (fwidth), así que nunca hace moaré ni «lija».
 */
export function materialBicapa(): THREE.MeshPhysicalMaterial {
  const m = materialCera({ color: '#e2c98f', rugosidad: 0.5, clearcoat: 0.25, borde: '#fff3d2', fuerzaBorde: 0.22 }, 'bicapa');
  m.transparent = true; m.opacity = 0.3; m.depthWrite = false;
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosBic; varying vec3 vNorBic;')
      .replace('#include <beginnormal_vertex>', '#include <beginnormal_vertex>\nvNorBic = normalize(mat3(modelMatrix) * objectNormal);')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPosBic = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosBic; varying vec3 vNorBic;
        vec3 celdaBic(vec2 q) {
          vec2 rr = vec2(1.0, 1.7320508), hh = rr * 0.5;
          vec2 a = mod(q, rr) - hh, b = mod(q - hh, rr) - hh;
          vec2 g = dot(a, a) < dot(b, b) ? a : b;
          return vec3(g, length(g));
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 qB = vPosBic.xz / 0.3;
        vec3 cB = celdaBic(qB);
        float fwB = max(fwidth(qB.x), fwidth(qB.y));
        float verB = (1.0 - smoothstep(0.2, 0.4, fwB)) * smoothstep(0.6, 0.9, abs(vNorBic.y));
        float cabB = 1.0 - smoothstep(0.3, 0.5, cB.z);
        diffuseColor.rgb *= mix(1.0, mix(0.74, 1.05, cabB), verB);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 tiltB = vec3(cB.x, 0.0, cB.y) * 1.3 * cabB * verB * sign(vNorBic.y);
        normal = normalize(normal + (viewMatrix * vec4(tiltB, 0.0)).xyz);`);
  };
  m.customProgramCacheKey = () => 'bio04bicapa';
  return m;
}

/**
 * Estela de un fotón: malla alargada en +z local (cabeza en z = 0, cola en z = −largo) que
 * se desvanece hacia la cola. Aditiva; el color de instancia es la λ del fotón (HDR en alta).
 */
export function materialEstela(largo: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uLargo: { value: largo } },
    vertexShader: /* glsl */ `
      uniform float uLargo;
      varying vec3 vColor; varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        vec4 p = vec4(position, 1.0);
        mat3 rot = mat3(1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
          rot = mat3(instanceMatrix);
        #endif
        vec4 mv = modelViewMatrix * p;
        gl_Position = projectionMatrix * mv;
        vT = clamp(1.0 + position.z / uLargo, 0.0, 1.0);
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = vec3(1.0);
        #endif
        vN = normalize(normalMatrix * rot * normal); vV = -mv.xyz;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vT; varying vec3 vN; varying vec3 vV;
      void main() {
        float centro = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.5);
        float a = vT * vT * (0.35 + 0.65 * centro);
        gl_FragColor = vec4(vColor * a, a);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

/** Halo aditivo (sprite redondo suave) para destellos y el haz. */
export function materialHalo(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aTam;
      uniform float uEscala;
      varying vec3 vColor;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        gl_PointSize = clamp(aTam * uEscala / max(0.5, -mv.z), 0.0, 220.0);
        vColor = aColor;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0) discard;
        float a = exp(-r * 4.5) + 0.35 * exp(-r * 1.4);
        gl_FragColor = vec4(vColor * a, a);
      }`,
    uniforms: { uEscala: { value: 400 } },
  });
}

/** Puntos de bokeh: discos suaves con tamaño en perspectiva, apagados por la niebla. */
export function materialBokeh(colorNiebla: THREE.Color): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uEscala: { value: 400 }, uNiebla: { value: colorNiebla }, uDens: { value: 0.018 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aTam;
      uniform float uEscala; uniform float uDens;
      varying vec3 vColor; varying float vNiebla; varying float vCerca;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float d = -mv.z;
        float tam = aTam * uEscala / max(1.0, d);
        gl_PointSize = clamp(tam, 1.0, 90.0);
        // las que quedarían enormes (pegadas a la cámara) se apagan: no tapan la pieza
        vCerca = 1.0 - smoothstep(34.0, 80.0, tam);
        vColor = aColor;
        vNiebla = 1.0 - exp(-uDens * uDens * d * d);
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uNiebla;
      varying vec3 vColor; varying float vNiebla; varying float vCerca;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0 || vCerca <= 0.0) discard;
        float a = smoothstep(1.0, 0.2, r) * 0.5 + smoothstep(1.0, 0.86, r) * 0.1;
        gl_FragColor = vec4(mix(vColor, uNiebla, vNiebla * 0.8), a * (1.0 - 0.6 * vNiebla) * vCerca);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Haz de luz de la lámpara: cono abierto aditivo, más brillante en el eje y que se apaga
 * en los bordes y al final (sin ruido). `uIntensidad` sigue a la PPFD.
 */
export function materialHaz(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.DoubleSide,
    uniforms: { uColor: { value: new THREE.Color('#ffffff') }, uIntensidad: { value: 0.5 } },
    vertexShader: /* glsl */ `
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal); vV = -mv.xyz;
        gl_Position = projectionMatrix * mv;
      }`,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor; uniform float uIntensidad;
      varying vec2 vUv; varying vec3 vN; varying vec3 vV;
      void main() {
        // de frente al eje (centro del cono) más denso; en la silueta del cono, nada
        float frente = pow(clamp(abs(dot(normalize(vN), normalize(vV))), 0.0, 1.0), 1.6);
        float largo = smoothstep(0.0, 0.25, vUv.y) * smoothstep(1.0, 0.7, vUv.y);
        float a = frente * largo * (0.05 + 0.2 * uIntensidad) * 1.6;
        gl_FragColor = vec4(uColor * a, a);
      }`,
  });
}

/** Escala de pH del lumen (indicador universal): 7,5 turquesa → 6,6 amarillo verdoso → 5,8 naranja. */
export function colorPH(ph: number, out = new THREE.Color()): THREE.Color {
  const a = new THREE.Color('#4fd1b8'), b = new THREE.Color('#d6dc5c'), c = new THREE.Color('#f4964c');
  const t = Math.min(1, Math.max(0, (7.5 - ph) / 1.7));
  if (t < 0.53) return out.copy(a).lerp(b, t / 0.53);
  return out.copy(b).lerp(c, (t - 0.53) / 0.47);
}
