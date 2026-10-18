/**
 * bio02/materiales.ts — el aspecto de «ilustración molecular» del lab de transporte (three).
 *
 *  · CERA: PBR con entorno, satinado del mismo tono y un BORDE de luz (fresnel) que recorta cada
 *    pieza del fondo oscuro. Sin texturas de ruido: el color varía sólo con la luz.
 *  · CORTE: la cera con los planos de corte de la membrana (z = 0, sólo dentro de la bicapa).
 *    Lo que se ve del interior por el corte (caras traseras) es la CARA DE SECCIÓN: el tono de la
 *    pieza oscurecido, sin luz, con rayado técnico fino a 45° que se funde por debajo de 3 px.
 *  · ALFOMBRA: la cara de arriba de la bicapa lejana, con las cabezas de los lípidos como
 *    cúpulas en red hexagonal (0,8 nm de paso, su tamaño real) que se funden al alejarse.
 *  · BRILLO: emisivo por instancia para lo único que emite: el destello de la fosforilación.
 *  · BOKEH: discos suaves desenfocados para lo que queda fuera de foco.
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
  transparente?: number;
}

const FRESNEL = /* glsl */ `float frB2 = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), uPotB2);`;

/** Cera con borde fresnel. */
export function materialCera(o: OpcionesCera = {}, clave = 'cera'): THREE.MeshPhysicalMaterial {
  const base = new THREE.Color(o.color ?? '#ffffff');
  const m = new THREE.MeshPhysicalMaterial({
    color: base,
    vertexColors: !!o.vertexColors,
    roughness: o.rugosidad ?? 0.5,
    metalness: 0,
    sheen: o.sheen ?? 0.25,
    sheenRoughness: 0.55,
    sheenColor: base.clone().lerp(new THREE.Color('#ffffff'), 0.3),
    clearcoat: o.clearcoat ?? 0.18,
    clearcoatRoughness: 0.4,
    envMapIntensity: 0.85,
  });
  if (o.transparente !== undefined) { m.transparent = true; m.opacity = o.transparente; m.depthWrite = false; }
  const uni = {
    uBordeB2: { value: new THREE.Color(o.borde ?? '#e8f4ff') },
    uFuerzaB2: { value: o.fuerzaBorde ?? 0.28 },
    uPotB2: { value: o.potenciaBorde ?? 2.6 },
  };
  m.userData.uniformesBorde = uni;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uBordeB2; uniform float uFuerzaB2; uniform float uPotB2;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      {
        ${FRESNEL}
        gl_FragColor.rgb += uBordeB2 * frB2 * uFuerzaB2;
      }`);
  };
  m.customProgramCacheKey = () => `bio02${clave}`;
  return m;
}

/** Planos que quitan la mitad de delante (z > 0) SÓLO dentro de la bicapa (|y| < e). */
export function planosCorte(e: number): THREE.Plane[] {
  return [
    new THREE.Plane(new THREE.Vector3(0, 0, -1), 0),   // fuera si z > 0
    new THREE.Plane(new THREE.Vector3(0, 1, 0), -e),   // fuera si y < e
    new THREE.Plane(new THREE.Vector3(0, -1, 0), -e),  // fuera si y > −e
  ];
}

export interface OpcionesCorte extends OpcionesCera {
  planos: THREE.Plane[];
  /** color de la cara de sección (por defecto: el de la pieza oscurecido) */
  colorSeccion?: THREE.ColorRepresentation;
  pasoRayado?: number;
}

/**
 * Cera cortada: las caras traseras que asoman por el corte son la SECCIÓN (tono de la pieza
 * oscurecido —con colores de vértice, el del vértice—, rayado a 45° en el plano z = 0).
 */
export function materialCorte(o: OpcionesCorte, clave: string): THREE.MeshPhysicalMaterial {
  const m = materialCera(o, clave);
  m.side = THREE.DoubleSide;
  m.clippingPlanes = o.planos;
  m.clipIntersection = true;
  m.clipShadows = true;
  const uni = {
    uSeccionB2: { value: new THREE.Color(o.colorSeccion ?? '#000000') },
    uUsaSeccionB2: { value: o.colorSeccion ? 1 : 0 },
    uPasoB2: { value: o.pasoRayado ?? 0.16 },
  };
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPmB2;')
      .replace('#include <worldpos_vertex>', `#include <worldpos_vertex>
        vec4 pmB2 = vec4(transformed, 1.0);
        #ifdef USE_INSTANCING
          pmB2 = instanceMatrix * pmB2;
        #endif
        vPmB2 = (modelMatrix * pmB2).xyz;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPmB2; uniform vec3 uSeccionB2; uniform float uUsaSeccionB2; uniform float uPasoB2;')
      .replace('#include <dithering_fragment>', `#include <dithering_fragment>
      if (!gl_FrontFacing) {
        vec3 baseS = uUsaSeccionB2 > 0.5 ? uSeccionB2 : diffuseColor.rgb * 0.5;
        float u = (vPmB2.x + vPmB2.y) / uPasoB2;
        float fw = fwidth(u);
        float t = min(fract(u), 1.0 - fract(u));
        float linea = (1.0 - smoothstep(0.12 - fw, 0.12 + fw, t)) * (1.0 - smoothstep(0.22, 0.34, fw));
        gl_FragColor = vec4(mix(baseS, baseS * 0.7, linea), 1.0);
        #include <colorspace_fragment>
      }`);
  };
  m.customProgramCacheKey = () => `bio02corte${clave}`;
  return m;
}

/** Emisivo por instancia (el color de instancia multiplica la emisión; HDR > 1 en alta). */
export function materialBrillo(clave = 'brillo'): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#101214', roughness: 0.35, metalness: 0, emissive: '#ffffff', emissiveIntensity: 1 });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <emissivemap_fragment>',
      '#include <emissivemap_fragment>\n#ifdef USE_INSTANCING_COLOR\n totalEmissiveRadiance *= vColor.rgb;\n#endif',
    );
  };
  m.customProgramCacheKey = () => `bio02${clave}`;
  return m;
}

/**
 * Alfombra de cabezas de la bicapa lejana: cera con cúpulas en red hexagonal de 0,8 nm (la
 * cabeza real de un fosfolípido) sombreadas como relieve; se funden con el tono medio cuando
 * una celda baja de ~3 px (fwidth), así que no hace moaré ni «lija».
 */
export function materialAlfombra(color: THREE.ColorRepresentation): THREE.MeshPhysicalMaterial {
  const m = materialCera({ color, rugosidad: 0.55, clearcoat: 0.2, borde: '#fff3dc', fuerzaBorde: 0.12, sheen: 0.3 }, 'alfombra');
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosAl;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPosAl = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        varying vec3 vPosAl;
        vec3 celdaAl(vec2 q) {
          vec2 rr = vec2(1.0, 1.7320508), hh = rr * 0.5;
          vec2 a = mod(q, rr) - hh, b = mod(q - hh, rr) - hh;
          vec2 g = dot(a, a) < dot(b, b) ? a : b;
          return vec3(g, length(g));
        }`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        vec2 qA = vPosAl.xz / 0.8;
        vec3 cA = celdaAl(qA);
        float fwA = max(fwidth(qA.x), fwidth(qA.y));
        float verA = 1.0 - smoothstep(0.18, 0.4, fwA);
        float cabA = 1.0 - smoothstep(0.32, 0.5, cA.z);
        diffuseColor.rgb *= mix(0.86, mix(0.62, 1.04, cabA), verA);`)
      .replace('#include <normal_fragment_maps>', `#include <normal_fragment_maps>
        vec3 tiltA = vec3(cA.x, 0.0, cA.y) * 1.5 * cabA * verA;
        normal = normalize(normal + (viewMatrix * vec4(tiltA, 0.0)).xyz);`);
  };
  m.customProgramCacheKey = () => 'bio02alfombra';
  return m;
}

/** Puntos de bokeh: discos suaves con tamaño en perspectiva (lo que queda fuera de foco). */
export function materialBokeh(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false,
    uniforms: { uEscala: { value: 400 } },
    vertexShader: /* glsl */ `
      attribute vec3 aColor; attribute float aTam;
      uniform float uEscala;
      varying vec3 vColor; varying float vCerca;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        gl_Position = projectionMatrix * mv;
        float tam = aTam * uEscala / max(1.0, -mv.z);
        gl_PointSize = clamp(tam, 1.0, 140.0);
        vCerca = 1.0 - smoothstep(90.0, 140.0, tam);
        vColor = aColor;
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vCerca;
      void main() {
        vec2 p = gl_PointCoord * 2.0 - 1.0;
        float r = dot(p, p);
        if (r > 1.0 || vCerca <= 0.0) discard;
        float a = smoothstep(1.0, 0.25, r) * 0.55 + smoothstep(1.0, 0.85, r) * 0.08;
        gl_FragColor = vec4(vColor, a * vCerca);
        #include <colorspace_fragment>
      }`,
  });
}

/**
 * Estela de una partícula en viaje: malla alargada en +z local (cabeza en z = 0, cola en
 * z = −largo) que se desvanece hacia la cola; aditiva y suave (no emite: sólo marca el camino).
 */
export function materialEstela(largo: number): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uLargo: { value: largo } },
    vertexShader: /* glsl */ `
      uniform float uLargo;
      varying vec3 vColor; varying float vT;
      void main() {
        vec4 p = vec4(position, 1.0);
        #ifdef USE_INSTANCING
          p = instanceMatrix * p;
        #endif
        gl_Position = projectionMatrix * modelViewMatrix * p;
        vT = clamp(1.0 + position.z / uLargo, 0.0, 1.0);
        #ifdef USE_INSTANCING_COLOR
          vColor = instanceColor;
        #else
          vColor = vec3(1.0);
        #endif
      }`,
    fragmentShader: /* glsl */ `
      varying vec3 vColor; varying float vT;
      void main() {
        float a = vT * vT * 0.45;
        gl_FragColor = vec4(vColor * a, a);
        #include <colorspace_fragment>
      }`,
  });
}
