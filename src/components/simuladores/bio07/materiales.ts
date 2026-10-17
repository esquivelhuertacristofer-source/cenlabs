/**
 * bio07/materiales.ts — los materiales del lab (three).
 *
 *  · Tejido: PBR satinado (sheen) con un borde de luz fresnel que recorta cada pieza del
 *    fondo oscuro, sin ruido de alta frecuencia. Variantes: membrana translúcida (alfa
 *    por fresnel: el centro deja ver el núcleo), vaina de mielina (lípido blanco nacarado,
 *    translúcido), músculo (rojo húmedo con fascículos de baja frecuencia), hueso, tendón.
 *  · MEMBRANA ACTIVA: la de axones y somas. Lee un PERFIL 1D (DataTexture de 512 × 1) que
 *    la escena escribe en cada cuadro desde el reloj: R = V normalizado, G = subida
 *    (dV/dt > 0, el frente), B = salida de K⁺. Cada vértice lleva `aU` (su posición en el
 *    perfil). Color: reposo → ámbar (V) y destello blanco dorado en el frente; bloom en alta.
 *  · Vidrio de las pipetas: fresnel puro (sin pasada de transmisión: es un capilar fino).
 */
import * as THREE from 'three';

/** Normaliza V (mV) a 0–1 para el perfil: −80 → 0, +40 → 1. */
export const vNorm = (V: number) => Math.min(1, Math.max(0, (V + 80) / 120));

export interface OpcionesTejido {
  color?: THREE.ColorRepresentation;
  rugosidad?: number;
  sheen?: number;
  clearcoat?: number;
  borde?: THREE.ColorRepresentation;
  fuerzaBorde?: number;
  potenciaBorde?: number;
  /** alfa en el centro y en el borde (translúcidos) */
  alfa?: [number, number];
  emisivo?: THREE.ColorRepresentation;
  intensidadEmisiva?: number;
  mapa?: THREE.Texture | null;
  lados?: THREE.Side;
}

/** Tejido satinado con borde fresnel (y alfa por fresnel si `alfa`). */
export function materialTejido(o: OpcionesTejido = {}): THREE.MeshPhysicalMaterial {
  const translucido = !!o.alfa;
  const m = new THREE.MeshPhysicalMaterial({
    color: o.color ?? '#ffffff',
    map: o.mapa ?? null,
    roughness: o.rugosidad ?? 0.5,
    metalness: 0,
    sheen: o.sheen ?? 0.6,
    sheenRoughness: 0.45,
    sheenColor: new THREE.Color('#ffffff'),
    clearcoat: o.clearcoat ?? 0.2,
    clearcoatRoughness: 0.35,
    envMapIntensity: 0.8,
    emissive: o.emisivo ?? '#000000',
    emissiveIntensity: o.intensidadEmisiva ?? 1,
    transparent: translucido,
    depthWrite: !translucido,
    side: o.lados ?? THREE.FrontSide,
  });
  const uni = {
    uBorde: { value: new THREE.Color(o.borde ?? '#cfe4ff') },
    uFuerza: { value: o.fuerzaBorde ?? 0.3 },
    uPot: { value: o.potenciaBorde ?? 2.6 },
    uA0: { value: o.alfa?.[0] ?? 1 },
    uA1: { value: o.alfa?.[1] ?? 1 },
  };
  m.userData.uniformes = uni;
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, uni);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform vec3 uBorde; uniform float uFuerza; uniform float uPot; uniform float uA0; uniform float uA1;')
      .replace('#include <opaque_fragment>', `#include <opaque_fragment>
      {
        float fr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), uPot);
        gl_FragColor.rgb += uBorde * fr * uFuerza;
        ${translucido ? 'gl_FragColor.a = mix(uA0, uA1, fr) * diffuseColor.a;' : ''}
      }`);
  };
  m.customProgramCacheKey = () => `bio07tejido:${translucido ? 't' : 'o'}`;
  return m;
}

/** Textura 1D del perfil de una fibra (RGBA, 512 muestras). */
export const N_PERFIL = 512;
export function nuevoPerfil(): THREE.DataTexture {
  const datos = new Uint8Array(N_PERFIL * 4);
  for (let i = 0; i < N_PERFIL; i++) { datos[4 * i] = Math.round(vNorm(-65) * 255); datos[4 * i + 3] = 255; }
  const t = new THREE.DataTexture(datos, N_PERFIL, 1, THREE.RGBAFormat);
  t.magFilter = THREE.LinearFilter; t.minFilter = THREE.LinearFilter;
  t.wrapS = THREE.ClampToEdgeWrapping; t.wrapT = THREE.ClampToEdgeWrapping;
  t.generateMipmaps = false;
  t.needsUpdate = true;
  return t;
}

export interface OpcionesMembrana {
  color: THREE.ColorRepresentation;
  /** color del despolarizado (ámbar) y del destello del frente */
  caliente?: THREE.ColorRepresentation;
  destello?: THREE.ColorRepresentation;
  /** intensidad del brillo (multiplica el emisivo) */
  ganancia?: number;
  /** perfil compartido (null: V uniforme por `uVUniforme`) */
  perfil: THREE.DataTexture | null;
  rugosidad?: number;
  alfa?: [number, number];
  /** textura de color (fibra muscular estriada) */
  mapa?: THREE.Texture | null;
  /** color del resplandor de la posthiperpolarización (V por debajo del reposo) */
  frio?: THREE.ColorRepresentation;
}

/**
 * Membrana excitable: tejido satinado cuyo emisivo sale del perfil (o de un V uniforme,
 * para somas). Atributo `aU` (0–1) y, opcional, `aNodo` (1 en los nodos de Ranvier: el
 * destello del frente es más intenso donde están los canales).
 */
export function materialMembrana(o: OpcionesMembrana): THREE.MeshPhysicalMaterial {
  const m = materialTejido({ color: o.color, rugosidad: o.rugosidad ?? 0.42, sheen: 0.55, clearcoat: 0.35, fuerzaBorde: 0.28, alfa: o.alfa, mapa: o.mapa });
  const uni = {
    uPerfil: { value: o.perfil },
    uUsaPerfil: { value: o.perfil ? 1 : 0 },
    uVUni: { value: vNorm(-65) },
    uSubUni: { value: 0 },
    uCaliente: { value: new THREE.Color(o.caliente ?? '#ffb04a') },
    uDestello: { value: new THREE.Color(o.destello ?? '#ff9f38') },
    uFrio: { value: new THREE.Color(o.frio ?? '#2f6dff').multiplyScalar(0.55) },
    uGanancia: { value: o.ganancia ?? 1 },
  };
  m.userData.membrana = uni;
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aU; attribute float aNodo; varying float vU; varying float vNodo;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vU = aU; vNodo = aNodo;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
        uniform sampler2D uPerfil; uniform float uUsaPerfil; uniform float uVUni; uniform float uSubUni;
        uniform vec3 uCaliente; uniform vec3 uDestello; uniform vec3 uFrio; uniform float uGanancia;
        varying float vU; varying float vNodo;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
        // V normalizado: −80 → 0, +40 → 1; despolarización por encima de −60 mV
        vec4 pfM = uUsaPerfil > 0.5 ? texture2D(uPerfil, vec2(clamp(vU, 0.0, 1.0), 0.5)) : vec4(uVUni, uSubUni, 0.0, 1.0);
        float depM = smoothstep(0.17, 0.85, pfM.r);
        // la membrana despolarizada cambia de tono (ámbar) en vez de blanquearse
        diffuseColor.rgb = mix(diffuseColor.rgb, uCaliente * 0.62, 0.85 * depM);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        {
          float frente = pfM.g * (0.4 + 0.6 * vNodo);
          // posthiperpolarización: por debajo del reposo (−65 mV → 0,125), un azul tenue
          float frio = 1.0 - smoothstep(0.06, 0.12, pfM.r);
          totalEmissiveRadiance += uGanancia * (uCaliente * (0.1 * depM + 0.42 * depM * depM) + uDestello * 2.2 * frente) + uFrio * frio;
        }`);
  };
  m.customProgramCacheKey = () => `bio07membrana:${o.alfa ? 't' : 'o'}:${o.mapa ? 'm' : '-'}`;
  return m;
}

/** Fija el V (mV) y la subida (0–1) de una membrana sin perfil (soma). */
export function fijarVMembrana(m: THREE.Material, V: number, subida = 0) {
  const u = m.userData.membrana as { uVUni: { value: number }; uSubUni: { value: number } } | undefined;
  if (!u) return;
  u.uVUni.value = vNorm(V);
  u.uSubUni.value = subida;
}

/**
 * Vaina de mielina: lípido nacarado, translúcido (deja ver el axón y su brillo), con un
 * leve resplandor interior cuando el axón de debajo está despolarizado (lee el perfil).
 */
export function materialMielina(perfil: THREE.DataTexture | null): THREE.MeshPhysicalMaterial {
  const m = materialTejido({ color: '#f4efe6', rugosidad: 0.32, sheen: 0.9, clearcoat: 0.6, fuerzaBorde: 0.42, borde: '#e9f3ff', potenciaBorde: 2.2, alfa: [0.8, 0.97] });
  const uni = { uPerfil: { value: perfil }, uUsaPerfil: { value: perfil ? 1 : 0 } };
  const previo = m.onBeforeCompile;
  m.onBeforeCompile = (sh, r) => {
    previo.call(m, sh, r);
    Object.assign(sh.uniforms, uni);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nattribute float aU; varying float vU;')
      .replace('#include <begin_vertex>', '#include <begin_vertex>\n  vU = aU;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', '#include <common>\nuniform sampler2D uPerfil; uniform float uUsaPerfil; varying float vU;')
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
        if (uUsaPerfil > 0.5) {
          vec4 pf = texture2D(uPerfil, vec2(clamp(vU, 0.0, 1.0), 0.5));
          float dep = smoothstep(0.17, 0.85, pf.r);
          totalEmissiveRadiance += vec3(1.0, 0.62, 0.25) * 0.1 * dep;
        }`);
  };
  m.customProgramCacheKey = () => 'bio07mielina';
  return m;
}

/** Vidrio de borosilicato de una micropipeta: casi invisible de frente, brillante en el borde. */
export function materialVidrio(): THREE.MeshPhysicalMaterial {
  const m = materialTejido({ color: '#dff3ff', rugosidad: 0.08, sheen: 0, clearcoat: 1, fuerzaBorde: 0.9, borde: '#e8f6ff', potenciaBorde: 2.0, alfa: [0.06, 0.75], lados: THREE.DoubleSide });
  m.metalness = 0;
  m.envMapIntensity = 1.4;
  m.userData.vidrio = true;
  return m;
}

/** Emisivo puro para lo que brilla (iones, vesículas, chispas). */
export function materialBrillo(color: THREE.ColorRepresentation, intensidad = 2): THREE.MeshStandardMaterial {
  return new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensidad, roughness: 1, metalness: 0 });
}

// ───────────────────────────── texturas de baja frecuencia ─────────────────────────────

/** PRNG pequeño con semilla (texturas deterministas). */
export function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6D2B79F5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const cacheTex = new Map<string, THREE.CanvasTexture>();
function lienzo(clave: string, w: number, h: number, pintar: (g: CanvasRenderingContext2D, w: number, h: number) => void, repetir?: [number, number]) {
  const hit = cacheTex.get(clave);
  if (hit) return hit;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d')!;
  pintar(g, w, h);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  cacheTex.set(clave, t);
  return t;
}

/**
 * Fascículos del músculo esquelético: bandas suaves a lo largo de la fibra (dirección u),
 * de anchos variados y contraste bajo, difuminadas: nada de ruido de alta frecuencia.
 */
export function texturaMusculo(): THREE.CanvasTexture {
  return lienzo('bio07:musculo', 512, 256, (g, w, h) => {
    g.fillStyle = '#9c3a33'; g.fillRect(0, 0, w, h);
    const rnd = azar(7);
    g.filter = 'blur(3px)';
    let y = 0;
    while (y < h) {
      const alto = 6 + rnd() * 14;
      const k = rnd();
      g.fillStyle = k > 0.5 ? `rgba(196,92,80,${0.28 + 0.2 * rnd()})` : `rgba(110,30,28,${0.25 + 0.2 * rnd()})`;
      g.fillRect(0, y, w, alto);
      y += alto + 2 + rnd() * 6;
    }
    g.filter = 'none';
    // perimisio: líneas claras muy finas y suaves entre fascículos
    g.globalAlpha = 0.18; g.strokeStyle = '#f0c9b8'; g.lineWidth = 1.5;
    for (let i = 0; i < 9; i++) { const yy = rnd() * h; g.beginPath(); g.moveTo(0, yy); g.bezierCurveTo(w * 0.3, yy + (rnd() - 0.5) * 10, w * 0.7, yy + (rnd() - 0.5) * 10, w, yy); g.stroke(); }
    g.globalAlpha = 1;
  }, [1, 1]);
}

/** Estriado de una fibra muscular (sarcómeros, bandas A/I suaves) para el banco. */
export function texturaEstriada(): THREE.CanvasTexture {
  return lienzo('bio07:estriada', 256, 64, (g, w, h) => {
    const grad = g.createLinearGradient(0, 0, w, 0);
    const n = 16;
    for (let i = 0; i <= n; i++) {
      const u = i / n;
      grad.addColorStop(Math.min(1, u), i % 2 ? '#c4655c' : '#8e312c');
    }
    g.fillStyle = grad; g.fillRect(0, 0, w, h);
  }, [6, 1]);
}

/** Hueso: marfil con veteado longitudinal muy suave. */
export function texturaHueso(): THREE.CanvasTexture {
  return lienzo('bio07:hueso', 256, 256, (g, w, h) => {
    g.fillStyle = '#e8dcc4'; g.fillRect(0, 0, w, h);
    const rnd = azar(3);
    g.filter = 'blur(6px)';
    for (let i = 0; i < 26; i++) {
      g.fillStyle = rnd() > 0.5 ? 'rgba(255,248,232,0.35)' : 'rgba(196,176,140,0.28)';
      g.fillRect(0, rnd() * h, w, 6 + rnd() * 16);
    }
    g.filter = 'none';
  });
}
