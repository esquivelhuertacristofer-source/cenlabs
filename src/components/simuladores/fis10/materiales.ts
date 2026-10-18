/**
 * fis10/materiales.ts — materiales PBR del motor y sombreadores propios.
 *
 *  · Metales con el entorno de estudio (RoomEnvironment): acero del eje, chapa magnética,
 *    yugo pintado, imanes niquelados, cobre esmaltado (barniz = clearcoat), latón, aluminio.
 *    Sin texturas de ruido: el acabado sale de la rugosidad y del reflejo.
 *  · Caras de corte: rayado a 45° de bajo contraste en espacio de objeto que se desvanece
 *    cuando las rayas quedan a menos de ~3 px (fwidth): nunca muaré.
 *  · Haces de cobre cortados: la sección de cada hilo (red hexagonal de Ø 0,46 mm), que
 *    también se funde al color medio cuando el hilo mide menos de unos píxeles.
 *  · Líneas de campo: cintas de ancho fijo en píxeles con cometas en el sentido de B.
 *  · Corriente: trazos que recorren la cabeza de la bobina alimentada en el sentido de I.
 */
import * as THREE from 'three';

export type CalidadM = 'alta' | 'media';

type Params = THREE.MeshPhysicalMaterialParameters;

function mat(calidad: CalidadM, p: Params): THREE.MeshStandardMaterial {
  if (calidad === 'alta') return new THREE.MeshPhysicalMaterial(p);
  // media: sin capa de barniz ni transmisión (más barato), mismo color y rugosidad
  const { clearcoat, clearcoatRoughness, sheen, sheenColor, sheenRoughness, transmission, thickness, ior, specularIntensity, ...resto } = p;
  void clearcoat; void clearcoatRoughness; void sheen; void sheenColor; void sheenRoughness; void transmission; void thickness; void ior; void specularIntensity;
  return new THREE.MeshStandardMaterial(resto as THREE.MeshStandardMaterialParameters);
}

/** Rayado de corte a 45° (en el plano que sea: usa x + y + z del objeto). */
export function rayar<T extends THREE.MeshStandardMaterial>(m: T, paso = 0.16, contraste = 0.2): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uPasoR = { value: paso };
    sh.uniforms.uContR = { value: contraste };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosR;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosR = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosR;\nuniform float uPasoR;\nuniform float uContR;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          float u = (vPosR.x + vPosR.y + vPosR.z) / uPasoR;
          float w = fwidth(u);
          float d = abs(fract(u + 0.5) - 0.5);
          float raya = 1.0 - smoothstep(0.13 - w, 0.13 + w, d);
          float desv = smoothstep(3.0, 6.0, 1.0 / max(w, 1e-5));
          diffuseColor.rgb *= 1.0 - uContR * raya * desv;
        }`);
  };
  m.customProgramCacheKey = () => 'fis10-rayado';
  return m;
}

/** Sección de los hilos de un haz (red hexagonal de diámetro `d` cm). */
export function hilos<T extends THREE.MeshStandardMaterial>(m: T, d = 0.05): T {
  m.onBeforeCompile = (sh) => {
    sh.uniforms.uDiam = { value: d };
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosH;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\nvPosH = position;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosH;\nuniform float uDiam;')
      .replace('#include <color_fragment>', `#include <color_fragment>
        {
          vec2 p = vPosH.xy / uDiam;
          vec2 r = vec2(1.0, 1.7320508);
          vec2 h = r * 0.5;
          vec2 a = mod(p, r) - h;
          vec2 b = mod(p - h, r) - h;
          vec2 g = dot(a, a) < dot(b, b) ? a : b;
          float dist = length(g);
          float w = fwidth(p.x) + fwidth(p.y);
          float borde = smoothstep(0.40 - w, 0.40 + w, dist);
          float desv = smoothstep(3.5, 7.0, 1.0 / max(w, 1e-5));
          diffuseColor.rgb *= mix(1.0, 0.42, borde * desv);
        }`);
  };
  m.customProgramCacheKey = () => 'fis10-hilos';
  return m;
}

export interface MatsMotor {
  eje: THREE.MeshStandardMaterial; ejeCorte: THREE.MeshStandardMaterial;
  chapa: THREE.MeshStandardMaterial; chapaCorte: THREE.MeshStandardMaterial;
  yugo: THREE.MeshStandardMaterial; yugoCorte: THREE.MeshStandardMaterial; yugoInterior: THREE.MeshStandardMaterial;
  iman: THREE.MeshStandardMaterial; imanCorteN: THREE.MeshStandardMaterial; imanCorteS: THREE.MeshStandardMaterial;
  forro: THREE.MeshStandardMaterial; hueco: THREE.MeshStandardMaterial;
  cobreCorte: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  esmalte: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  hiloSalida: THREE.MeshStandardMaterial;
  delga: THREE.MeshStandardMaterial; mica: THREE.MeshStandardMaterial; carbon: THREE.MeshStandardMaterial;
  laton: THREE.MeshStandardMaterial; fenolico: THREE.MeshStandardMaterial; trenza: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial; fundicion: THREE.MeshStandardMaterial; base: THREE.MeshStandardMaterial;
  negro: THREE.MeshStandardMaterial; poliuretano: THREE.MeshStandardMaterial; cinta: THREE.MeshStandardMaterial;
  plastico: THREE.MeshStandardMaterial; lente: THREE.MeshStandardMaterial;
  cableRojo: THREE.MeshStandardMaterial; cableNegro: THREE.MeshStandardMaterial;
  plomo: THREE.MeshStandardMaterial; goma: THREE.MeshStandardMaterial; tornillo: THREE.MeshStandardMaterial;
  rodamiento: THREE.MeshStandardMaterial; resorte: THREE.MeshStandardMaterial;
  abs: THREE.MeshStandardMaterial; tapaRoja: THREE.MeshStandardMaterial; tapaNegra: THREE.MeshStandardMaterial;
  perilla: THREE.MeshStandardMaterial;
  todos: THREE.Material[];
}

export function crearMateriales(calidad: CalidadM): MatsMotor {
  const m = (p: Params) => mat(calidad, p);
  const cobre = (): Params => ({ color: '#bd6a35', metalness: 1, roughness: 0.3, clearcoat: 1, clearcoatRoughness: 0.14, emissive: '#ff8a3a', emissiveIntensity: 0 });
  const r: Omit<MatsMotor, 'todos'> = {
    eje: m({ color: '#cfd4da', metalness: 1, roughness: 0.2 }),
    ejeCorte: rayar(m({ color: '#8d949b', metalness: 0.45, roughness: 0.5, envMapIntensity: 0.6 }), 0.12, 0.22),
    chapa: m({ color: '#8c959f', metalness: 0.85, roughness: 0.4 }),
    chapaCorte: rayar(m({ color: '#5b636d', metalness: 0.3, roughness: 0.58, envMapIntensity: 0.55 }), 0.16, 0.26),
    yugo: m({ color: '#2a3542', metalness: 0.35, roughness: 0.46, clearcoat: 0.55, clearcoatRoughness: 0.32 }),
    yugoCorte: rayar(m({ color: '#4c545d', metalness: 0.3, roughness: 0.6, envMapIntensity: 0.55 }), 0.16, 0.26),
    yugoInterior: m({ color: '#7e8790', metalness: 0.85, roughness: 0.5 }),
    iman: m({ color: '#cdcac2', metalness: 1, roughness: 0.24 }),
    imanCorteN: rayar(m({ color: '#a4434a', metalness: 0.15, roughness: 0.55, envMapIntensity: 0.55 }), 0.16, 0.26),
    imanCorteS: rayar(m({ color: '#3a63a3', metalness: 0.15, roughness: 0.55, envMapIntensity: 0.55 }), 0.16, 0.26),
    forro: m({ color: '#9c8a62', metalness: 0, roughness: 0.82, envMapIntensity: 0.5 }),
    hueco: m({ color: '#22272e', metalness: 0, roughness: 0.9, envMapIntensity: 0.4 }),
    cobreCorte: [hilos(m({ ...cobre(), clearcoat: 0, color: '#b0693a', metalness: 0.75, roughness: 0.42, envMapIntensity: 0.7 })), hilos(m({ ...cobre(), clearcoat: 0, color: '#b0693a', metalness: 0.75, roughness: 0.42, envMapIntensity: 0.7 }))],
    esmalte: [m(cobre()), m(cobre())],
    hiloSalida: m({ color: '#c06c38', metalness: 1, roughness: 0.25, clearcoat: 1, clearcoatRoughness: 0.15 }),
    delga: m({ color: '#c8753f', metalness: 1, roughness: 0.17 }),
    mica: m({ color: '#3b2519', metalness: 0, roughness: 0.5 }),
    carbon: m({ color: '#232326', metalness: 0.12, roughness: 0.78 }),
    laton: m({ color: '#c9a453', metalness: 1, roughness: 0.27 }),
    fenolico: m({ color: '#5c3a25', metalness: 0, roughness: 0.42, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
    trenza: m({ color: '#b87346', metalness: 1, roughness: 0.55 }),
    aluminio: m({ color: '#c4c9cf', metalness: 1, roughness: 0.34 }),
    fundicion: m({ color: '#a9aeb4', metalness: 0.9, roughness: 0.56 }),
    base: m({ color: '#3a4049', metalness: 0.55, roughness: 0.5 }),
    negro: m({ color: '#1c1f24', metalness: 0.55, roughness: 0.4, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    poliuretano: m({ color: '#b3282e', metalness: 0, roughness: 0.5, clearcoat: 0.25, clearcoatRoughness: 0.5 }),
    cinta: m({ color: '#f2f3f4', metalness: 1, roughness: 0.1 }),
    plastico: m({ color: '#202327', metalness: 0, roughness: 0.55 }),
    lente: m({ color: '#0a0d11', metalness: 0, roughness: 0.06, clearcoat: 1, clearcoatRoughness: 0.03 }),
    cableRojo: m({ color: '#b3232b', metalness: 0, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    cableNegro: m({ color: '#17191c', metalness: 0, roughness: 0.42, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    plomo: m({ color: '#a2a7ac', metalness: 1, roughness: 0.42 }),
    goma: m({ color: '#141619', metalness: 0, roughness: 0.92 }),
    tornillo: m({ color: '#9ca2a8', metalness: 1, roughness: 0.3 }),
    rodamiento: m({ color: '#d5d9de', metalness: 1, roughness: 0.15 }),
    resorte: m({ color: '#c9ccd0', metalness: 1, roughness: 0.25 }),
    abs: m({ color: '#26292e', metalness: 0, roughness: 0.6 }),
    tapaRoja: m({ color: '#b5262d', metalness: 0, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    tapaNegra: m({ color: '#151719', metalness: 0, roughness: 0.45, clearcoat: 0.3, clearcoatRoughness: 0.35 }),
    perilla: m({ color: '#121417', metalness: 0.2, roughness: 0.35, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
  };
  // las tapas planas del corte llevan un pequeño desplazamiento de profundidad (sin parpadeo)
  for (const k of ['chapaCorte', 'yugoCorte', 'imanCorteN', 'imanCorteS', 'ejeCorte'] as const) {
    r[k].polygonOffset = true; r[k].polygonOffsetFactor = -1; r[k].polygonOffsetUnits = -1;
  }
  // forro < hueco < cobre: cada capa del corte de la ranura por encima de la anterior
  for (const [k, o] of [[r.forro, -2], [r.hueco, -3], [r.cobreCorte[0], -4], [r.cobreCorte[1], -4]] as const) {
    k.polygonOffset = true; k.polygonOffsetFactor = o; k.polygonOffsetUnits = o;
  }
  const todos = Object.values(r).flatMap((v) => (Array.isArray(v) ? v : [v])) as THREE.Material[];
  return { ...r, todos };
}

// ───────────────────────────── líneas de campo ─────────────────────────────

export function materialLineas(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis10-lineas',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uT: { value: 0 },
      uLambda: { value: 2.6 },   // cm entre cometas
      uVel: { value: 1.6 },      // cm/s de pantalla (sólo indica el sentido)
      uSentido: { value: 1 },
      uRes: { value: new THREE.Vector2(1, 1) },
      uAncho: { value: 1.3 },    // medio ancho en px
      uOpac: { value: 0 },
      uColBajo: { value: new THREE.Color('#7fb8ff') },
      uColAlto: { value: new THREE.Color('#dff4ff') },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTan;
      attribute float aLado;
      attribute float aArco;
      attribute float aB;
      uniform vec2 uRes;
      uniform float uAncho;
      varying float vLado;
      varying float vArco;
      varying float vB;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 t = aTan;
        float lt = length(t);
        t = lt > 1e-6 ? t / lt : vec3(1.0, 0.0, 0.0);
        vec4 c0 = projectionMatrix * mv;
        vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(position + t * 0.02, 1.0));
        vec2 p0 = c0.xy / max(1e-6, abs(c0.w)) * uRes;
        vec2 p1 = c1.xy / max(1e-6, abs(c1.w)) * uRes;
        vec2 d = p1 - p0;
        float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
        vec2 n = vec2(-d.y, d.x);
        c0.xy += n * aLado * (2.0 * uAncho / uRes) * c0.w;
        gl_Position = c0;
        vLado = aLado; vArco = aArco; vB = aB;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uT;
      uniform float uLambda;
      uniform float uVel;
      uniform float uSentido;
      uniform float uOpac;
      uniform vec3 uColBajo;
      uniform vec3 uColAlto;
      varying float vLado;
      varying float vArco;
      varying float vB;
      void main() {
        float perfil = exp(-vLado * vLado * 2.2);
        float fase = fract((vArco * uSentido) / uLambda - uT * uVel / uLambda);
        float cometa = pow(fase, 8.0) * (1.0 - smoothstep(0.93, 1.0, fase));
        float b = clamp((vB - 0.15) / 1.25, 0.0, 1.0);
        vec3 col = mix(uColBajo, uColAlto, b);
        float I = (0.38 + 0.5 * b + 1.5 * cometa) * uOpac;
        gl_FragColor = vec4(col * I * perfil, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// ───────────────────────────── corriente en la cabeza de bobina ─────────────────────────────

export function materialCorriente(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis10-corriente',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    uniforms: {
      uT: { value: 0 },
      uN: { value: 9 },          // trazos a lo largo de la cabeza
      uSentido: { value: 1 },
      uInt: { value: 0 },
      uCol: { value: new THREE.Color('#ffd27a') },
    },
    vertexShader: /* glsl */ `
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        vUv = uv;
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vV = normalize(-mv.xyz);
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uT;
      uniform float uN;
      uniform float uSentido;
      uniform float uInt;
      uniform vec3 uCol;
      varying vec2 vUv;
      varying vec3 vN;
      varying vec3 vV;
      void main() {
        float f = fract(vUv.x * uN - uT * uSentido);
        float traza = smoothstep(0.0, 0.18, f) * (1.0 - smoothstep(0.42, 0.62, f));
        float frente = pow(max(0.0, dot(normalize(vN), normalize(vV))), 0.6);
        gl_FragColor = vec4(uCol * traza * frente * uInt, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

/** Textura radial para chispas y destellos (lienzo pequeño, sin ruido). */
export function texturaDestello(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = c.height = 64;
  const g = c.getContext('2d');
  if (!g) return null;
  const gr = g.createRadialGradient(32, 32, 0, 32, 32, 32);
  gr.addColorStop(0, 'rgba(255,255,255,1)');
  gr.addColorStop(0.25, 'rgba(255,255,255,0.55)');
  gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 64, 64);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
