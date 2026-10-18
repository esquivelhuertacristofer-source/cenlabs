/**
 * fis01/materiales.ts — materiales PBR, texturas de lienzo y sombreadores del polígono de tiro.
 *
 *  · Metales con el entorno del cielo (PMREM del propio cielo): acero pulido del cañón y del
 *    balín, anodizado negro, fundición pintada, latón grabado, aluminio, galvanizado.
 *  · Superficies grandes SIN ruido de alta frecuencia: el pasto lleva franjas de corte de 5 m y
 *    una variación de tono de baja frecuencia; el concreto, juntas cada 5 m y manchas suaves.
 *  · Graduaciones grabadas en lienzo con mipmaps y anisotropía (regla del suelo, cuadrante del
 *    cañón, pantalla de sombras): legibles al acercarse, sin parpadeo al alejarse.
 *  · Cinta de trayectoria: ancho fijo en píxeles, crece con el reloj (aT ≤ uT) y puede ir a trazos.
 */
import * as THREE from 'three';

export type CalidadM = 'alta' | 'media';
type Params = THREE.MeshPhysicalMaterialParameters;

function mat(calidad: CalidadM, p: Params): THREE.MeshStandardMaterial {
  if (calidad === 'alta') return new THREE.MeshPhysicalMaterial(p);
  const { clearcoat, clearcoatRoughness, sheen, sheenColor, sheenRoughness, transmission, thickness, ior, specularIntensity, ...resto } = p;
  void clearcoat; void clearcoatRoughness; void sheen; void sheenColor; void sheenRoughness; void transmission; void thickness; void ior; void specularIntensity;
  return new THREE.MeshStandardMaterial(resto as THREE.MeshStandardMaterialParameters);
}

// ───────────────────────────── lienzos ─────────────────────────────

function lienzo(w: number, h: number): [HTMLCanvasElement, CanvasRenderingContext2D] | null {
  if (typeof document === 'undefined') return null;
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  const g = c.getContext('2d');
  return g ? [c, g] : null;
}
function textura(c: HTMLCanvasElement, srgb = true, repetir?: [number, number]): THREE.CanvasTexture {
  const t = new THREE.CanvasTexture(c);
  if (srgb) t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 8;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  if (repetir) { t.wrapS = t.wrapT = THREE.RepeatWrapping; t.repeat.set(repetir[0], repetir[1]); }
  t.needsUpdate = true;
  return t;
}
/** Generador determinista (mulberry32). */
function azar(semilla: number) {
  let a = semilla >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}
/** Manchas grandes y suaves (baja frecuencia): gradientes radiales de muy poco contraste. */
function manchas(g: CanvasRenderingContext2D, w: number, h: number, n: number, rMin: number, rMax: number, alfa: number, claro: string, oscuro: string, semilla: number) {
  const r = azar(semilla);
  for (let i = 0; i < n; i++) {
    const x = r() * w, y = r() * h, R = rMin + r() * (rMax - rMin);
    const col = r() > 0.5 ? claro : oscuro;
    // se repite en los bordes para que la textura enlace sin costura
    for (const dx of [-w, 0, w]) for (const dy of [-h, 0, h]) {
      const gr = g.createRadialGradient(x + dx, y + dy, 0, x + dx, y + dy, R);
      gr.addColorStop(0, col.replace('A', String(alfa)));
      gr.addColorStop(1, col.replace('A', '0'));
      g.fillStyle = gr;
      g.fillRect(x + dx - R, y + dy - R, 2 * R, 2 * R);
    }
  }
}

const FUENTE = (px: number, peso = 600) => `${peso} ${px}px Outfit, "Segoe UI", system-ui, sans-serif`;

/**
 * Pasto segado: sólo las franjas de corte de 5 m (claro/oscuro) con el borde difuminado. Una
 * baldosa = 10 m. La variación de tono NO va en la baldosa (se vería repetida en rejilla): la
 * pone `variacionMacro` en coordenadas de mundo.
 */
export function texPasto(base: string, franja: number): THREE.CanvasTexture | null {
  // franjas paralelas a la pista (x): el tono cambia a lo largo de z (v)
  const l = lienzo(64, 512); if (!l) return null;
  const [c, g] = l;
  g.fillStyle = base; g.fillRect(0, 0, 64, 512);
  const gr = g.createLinearGradient(0, 0, 0, 512);
  gr.addColorStop(0, `rgba(255,255,240,${franja})`); gr.addColorStop(0.44, `rgba(255,255,240,${franja})`);
  gr.addColorStop(0.5, 'rgba(255,255,240,0)'); gr.addColorStop(0.94, 'rgba(255,255,240,0)'); gr.addColorStop(1, `rgba(255,255,240,${franja})`);
  g.fillStyle = gr; g.fillRect(0, 0, 64, 512);
  return textura(c, true, [1, 1]);
}

/**
 * Variación de tono de muy baja frecuencia en coordenadas de MUNDO (ruido de valor, 3 octavas
 * desde `escala` m): rompe la repetición de las baldosas sin meter ruido fino.
 */
export function variacionMacro(m: THREE.Material, escala: number, amp: number) {
  m.onBeforeCompile = (sh) => {
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', '#include <common>\nvarying vec3 vPosMacro;')
      .replace('#include <worldpos_vertex>', '#include <worldpos_vertex>\nvPosMacro = (modelMatrix * vec4(transformed, 1.0)).xyz;');
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
varying vec3 vPosMacro;
float hashMacro(vec2 p) { return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453); }
float ruidoMacro(vec2 p) {
  vec2 i = floor(p), f = fract(p), u = f * f * (3.0 - 2.0 * f);
  return mix(mix(hashMacro(i), hashMacro(i + vec2(1.0, 0.0)), u.x), mix(hashMacro(i + vec2(0.0, 1.0)), hashMacro(i + vec2(1.0, 1.0)), u.x), u.y);
}`)
      .replace('#include <map_fragment>', `#include <map_fragment>
{
  vec2 q = vPosMacro.xz / ${escala.toFixed(2)};
  float n = ruidoMacro(q) * 0.57 + ruidoMacro(q * 2.07 + 7.13) * 0.29 + ruidoMacro(q * 4.13 + 3.71) * 0.14;
  diffuseColor.rgb *= 1.0 + ${amp.toFixed(3)} * (n - 0.5) * 2.0;
}`);
  };
  m.customProgramCacheKey = () => `fis01-macro-${escala}-${amp}`;
}

/** Concreto: manchas suaves y juntas de dilatación (una baldosa = 5 m). */
export function texConcreto(base: string, junta: boolean, semilla = 3): THREE.CanvasTexture | null {
  const l = lienzo(512, 512); if (!l) return null;
  const [c, g] = l;
  g.fillStyle = base; g.fillRect(0, 0, 512, 512);
  manchas(g, 512, 512, 22, 40, 150, 0.03, 'rgba(255,255,255,A)', 'rgba(40,36,30,A)', semilla);
  if (junta) {
    g.fillStyle = 'rgba(40,40,40,0.38)'; g.fillRect(0, 0, 3, 512);
    g.fillStyle = 'rgba(255,255,255,0.18)'; g.fillRect(3, 0, 2, 512);
  }
  return textura(c, true, [1, 1]);
}

/** Paneles prefabricados del muro (2 m × 1 m): tono por panel y junta. Baldosa = 4 × 4 paneles. */
export function texPaneles(): THREE.CanvasTexture | null {
  const l = lienzo(512, 512); if (!l) return null;
  const [c, g] = l;
  const r = azar(19);
  for (let f = 0; f < 8; f++) for (let k = 0; k < 2; k++) {
    const v = 170 + Math.floor(r() * 14);
    g.fillStyle = `rgb(${v},${v - 4},${v - 10})`;
    g.fillRect(k * 256, f * 64, 256, 64);
  }
  manchas(g, 512, 512, 18, 40, 120, 0.05, 'rgba(255,255,255,A)', 'rgba(30,26,20,A)', 23);
  g.fillStyle = 'rgba(30,30,30,0.45)';
  for (let f = 0; f <= 8; f++) g.fillRect(0, f * 64 - 2, 512, 3);
  for (let k = 0; k <= 2; k++) g.fillRect(k * 256 - 2, 0, 3, 512);
  return textura(c, true, [1, 1]);
}

/**
 * Regla de acero grabada a lo largo de x: rayas cada 0,5 m, más largas cada metro y cada 5 m,
 * números cada 5 m. `largo` en m; 40 px por metro.
 */
export function texRegla(largo: number): THREE.CanvasTexture | null {
  const pxm = 48, W = Math.min(8192, Math.ceil(largo * pxm)), H = 128;
  const l = lienzo(W, H); if (!l) return null;
  const [c, g] = l;
  const ppm = W / largo;
  const gr = g.createLinearGradient(0, 0, 0, H);
  gr.addColorStop(0, '#d9dde1'); gr.addColorStop(0.5, '#c9ced3'); gr.addColorStop(1, '#d4d8dc');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#1c2228';
  // las rayas salen del borde de arriba del lienzo (el lado de la línea de sombras)
  for (let i = 0; i <= largo * 2; i++) {
    const x = (i / 2) * ppm;
    const m5 = i % 10 === 0, m1 = i % 2 === 0;
    const alto = m5 ? H * 0.46 : m1 ? H * 0.3 : H * 0.16;
    const ancho = m5 ? 4 : m1 ? 2.6 : 1.6;
    g.fillRect(x - ancho / 2, 0, ancho, alto);
    if (m5 && i > 0) {
      g.font = FUENTE(44, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(i / 2), x, H * 0.74);
    }
  }
  g.fillRect(0, H - 3, W, 3);
  return textura(c, true);
}

/** Cuadrante grabado del cañón (lienzo cuadrado: el centro es el eje de muñones). 0° a la
 *  izquierda (−x), 90° abajo (−y): la culata señala el ángulo de elevación. */
export function texCuadrante(rIn: number, rOut: number): THREE.CanvasTexture | null {
  const N = 1024;
  const l = lienzo(N, N); if (!l) return null;
  const [c, g] = l;
  const cx = N / 2, cy = N / 2, esc = (N / 2) / rOut;
  // latón cepillado (gradiente cónico suave)
  g.fillStyle = '#b8954a'; g.fillRect(0, 0, N, N);
  const gr = g.createLinearGradient(0, 0, N, N);
  gr.addColorStop(0, 'rgba(255,240,200,0.20)'); gr.addColorStop(0.5, 'rgba(255,255,255,0)'); gr.addColorStop(1, 'rgba(80,50,10,0.18)');
  g.fillStyle = gr; g.fillRect(0, 0, N, N);
  g.strokeStyle = '#2a2116'; g.fillStyle = '#2a2116';
  for (let d = 0; d <= 90; d++) {
    const a = Math.PI + (d * Math.PI) / 180;   // 0° → −x ; 90° → −y
    const ux = Math.cos(a), uy = -Math.sin(a);  // y del lienzo hacia abajo
    const largo = d % 15 === 0 ? 0.3 : d % 5 === 0 ? 0.2 : 0.11;
    g.lineWidth = d % 15 === 0 ? 5 : d % 5 === 0 ? 3.2 : 1.8;
    const r1 = rOut * esc * 0.985, r0 = r1 - (rOut - rIn) * esc * largo;
    g.beginPath(); g.moveTo(cx + ux * r0, cy + uy * r0); g.lineTo(cx + ux * r1, cy + uy * r1); g.stroke();
    if (d % 15 === 0) {
      const rt = rIn * esc + (rOut - rIn) * esc * 0.42;
      g.save(); g.translate(cx + ux * rt, cy + uy * rt);
      g.font = FUENTE(46, 700); g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(d), 0, 0); g.restore();
    }
  }
  g.lineWidth = 3;
  g.beginPath(); g.arc(cx, cy, rOut * esc * 0.985, Math.PI / 2, Math.PI, false); g.stroke();
  return textura(c, true);
}

/**
 * Pantalla de proyección con escala de alturas grabada en los bordes (64 px/m en los dos ejes).
 * `base` = altura del borde inferior del tablero sobre el suelo: la escala marca la altura REAL
 * (la raya «5» está a 5 m del suelo). Los números van pegados al borde izquierdo, lejos de la
 * columna central donde cae la sombra.
 */
export function texPantalla(alto: number, ancho: number, base: number): THREE.CanvasTexture | null {
  const ppm = Math.min(64, 2048 / alto), H = Math.round(alto * ppm), W = Math.round(ancho * ppm);
  const l = lienzo(W, H); if (!l) return null;
  const [c, g] = l;
  g.fillStyle = '#efece5'; g.fillRect(0, 0, W, H);
  const gr = g.createLinearGradient(0, 0, W, 0);
  gr.addColorStop(0, 'rgba(0,0,0,0.05)'); gr.addColorStop(0.3, 'rgba(0,0,0,0)'); gr.addColorStop(1, 'rgba(0,0,0,0.04)');
  g.fillStyle = gr; g.fillRect(0, 0, W, H);
  g.fillStyle = '#26303a';
  const fuente = Math.round(ppm * 0.42);
  for (let i = 1; i <= (alto + base) * 2; i++) {
    const y = H - (i / 2 - base) * ppm;
    if (y < 2 || y > H - 2) continue;
    const m5 = i % 10 === 0, m1 = i % 2 === 0;
    const largo = Math.round(ppm * (m5 ? 0.32 : m1 ? 0.2 : 0.1));
    const gr2 = m5 ? 3 : 2;
    g.fillRect(0, y - gr2 / 2, largo, gr2);
    g.fillRect(W - largo, y - gr2 / 2, largo, gr2);
    if (m5) {
      g.font = FUENTE(fuente, 700); g.textAlign = 'left'; g.textBaseline = 'middle';
      g.fillText(String(i / 2), largo + ppm * 0.06, y);
    }
  }
  return textura(c, true);
}

/** Diana pintada en el suelo (anillos rojo/blanco). */
export function texDiana(): THREE.CanvasTexture | null {
  const l = lienzo(512, 512); if (!l) return null;
  const [c, g] = l;
  const R = 250;
  for (let i = 5; i >= 1; i--) {
    g.fillStyle = i % 2 ? '#c4322c' : '#f1eee6';
    g.beginPath(); g.arc(256, 256, (i / 5) * R, 0, Math.PI * 2); g.fill();
  }
  g.strokeStyle = 'rgba(40,20,20,0.5)'; g.lineWidth = 3;
  for (let i = 1; i <= 5; i++) { g.beginPath(); g.arc(256, 256, (i / 5) * R, 0, Math.PI * 2); g.stroke(); }
  return textura(c, true);
}

/** Disco de sombra suave (alfa radial) para las proyecciones del balín. */
export function texSombra(): THREE.CanvasTexture | null {
  const l = lienzo(128, 128); if (!l) return null;
  const [c, g] = l;
  const gr = g.createRadialGradient(64, 64, 0, 64, 64, 64);
  gr.addColorStop(0, 'rgba(255,255,255,1)'); gr.addColorStop(0.55, 'rgba(255,255,255,0.85)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
  g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  return textura(c, false);
}

/** Bocanada (aire o polvo): mancha radial blanda. */
export function texBocanada(): THREE.CanvasTexture | null {
  const l = lienzo(128, 128); if (!l) return null;
  const [c, g] = l;
  const r = azar(5);
  for (let i = 0; i < 9; i++) {
    const x = 64 + (r() - 0.5) * 34, y = 64 + (r() - 0.5) * 34, R = 26 + r() * 22;
    const gr = g.createRadialGradient(x, y, 0, x, y, R);
    gr.addColorStop(0, 'rgba(255,255,255,0.55)'); gr.addColorStop(1, 'rgba(255,255,255,0)');
    g.fillStyle = gr; g.fillRect(0, 0, 128, 128);
  }
  return textura(c, true);
}

// ───────────────────────────── materiales ─────────────────────────────

export interface MatsTiro {
  aceroPulido: THREE.MeshStandardMaterial; balin: THREE.MeshStandardMaterial; fantasma: THREE.MeshStandardMaterial;
  anodizado: THREE.MeshStandardMaterial; fundicion: THREE.MeshStandardMaterial; laton: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial; aluminio: THREE.MeshStandardMaterial; galvanizado: THREE.MeshStandardMaterial;
  chapa: THREE.MeshStandardMaterial; pintura: THREE.MeshStandardMaterial; tanque: THREE.MeshStandardMaterial;
  pantalla: THREE.MeshStandardMaterial; concreto: THREE.MeshStandardMaterial; muroConcreto: THREE.MeshStandardMaterial;
  terraza: THREE.MeshStandardMaterial; regla: THREE.MeshStandardMaterial; pasto: THREE.MeshStandardMaterial;
  paneles: THREE.MeshStandardMaterial; albardilla: THREE.MeshStandardMaterial; rojo: THREE.MeshStandardMaterial; blanco: THREE.MeshStandardMaterial;
  diana: THREE.MeshStandardMaterial; plastico: THREE.MeshStandardMaterial; carbono: THREE.MeshStandardMaterial; helice: THREE.MeshStandardMaterial;
  led: THREE.MeshStandardMaterial; tela: [THREE.MeshStandardMaterial, THREE.MeshStandardMaterial];
  colina: THREE.MeshStandardMaterial; arbol: THREE.MeshStandardMaterial; tronco: THREE.MeshStandardMaterial;
  manometro: THREE.MeshStandardMaterial; vidrio: THREE.MeshStandardMaterial;
  todos: THREE.Material[];
  texturas: THREE.Texture[];
}

export function crearMateriales(calidad: CalidadM): MatsTiro {
  const m = (p: Params) => mat(calidad, p);
  const tPasto = texPasto('#5e7f3e', 0.06);
  const tConcreto = texConcreto('#bdb8ae', true, 3);
  const tMuro = texConcreto('#a9a49b', false, 9);
  const tTerraza = texConcreto('#7f7c77', true, 13);
  const tPaneles = texPaneles();
  const tDiana = texDiana();
  const r: Omit<MatsTiro, 'todos' | 'texturas'> = {
    aceroPulido: m({ color: '#d3d8de', metalness: 1, roughness: 0.17 }),
    balin: m({ color: '#e6e9ec', metalness: 1, roughness: 0.09, clearcoat: 0.6, clearcoatRoughness: 0.05 }),
    fantasma: m({ color: '#c3ccd6', metalness: 0.9, roughness: 0.2, transparent: true, opacity: 0.72, depthWrite: false }),
    anodizado: m({ color: '#202429', metalness: 0.6, roughness: 0.34, clearcoat: 0.45, clearcoatRoughness: 0.3 }),
    fundicion: m({ color: '#2d4c66', metalness: 0.35, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.28 }),
    laton: m({ color: '#c9a453', metalness: 0.85, roughness: 0.32 }),
    goma: m({ color: '#17191c', metalness: 0, roughness: 0.88 }),
    aluminio: m({ color: '#c3c8ce', metalness: 1, roughness: 0.3 }),
    galvanizado: m({ color: '#9ea6ae', metalness: 0.9, roughness: 0.42 }),
    chapa: m({ color: '#5c646c', metalness: 0.8, roughness: 0.45 }),
    pintura: m({ color: '#d9a21b', metalness: 0.15, roughness: 0.45, clearcoat: 0.4, clearcoatRoughness: 0.3 }),
    tanque: m({ color: '#b12f2a', metalness: 0.25, roughness: 0.38, clearcoat: 0.7, clearcoatRoughness: 0.18 }),
    pantalla: m({ color: '#ffffff', metalness: 0, roughness: 0.86 }),
    concreto: m({ color: '#ffffff', map: tConcreto ?? undefined, metalness: 0, roughness: 0.93 }),
    muroConcreto: m({ color: '#ffffff', map: tMuro ?? undefined, metalness: 0, roughness: 0.95 }),
    terraza: m({ color: '#ffffff', map: tTerraza ?? undefined, metalness: 0, roughness: 0.94 }),
    regla: m({ color: '#ffffff', metalness: 0.55, roughness: 0.38 }),
    pasto: m({ color: '#ffffff', map: tPasto ?? undefined, metalness: 0, roughness: 1 }),
    paneles: m({ color: '#ffffff', map: tPaneles ?? undefined, metalness: 0, roughness: 0.92 }),
    albardilla: m({ color: '#c9c4ba', metalness: 0, roughness: 0.85 }),
    rojo: m({ color: '#c0322b', metalness: 0, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    blanco: m({ color: '#efede8', metalness: 0, roughness: 0.55, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    diana: m({ color: '#ffffff', map: tDiana ?? undefined, metalness: 0, roughness: 0.8, polygonOffset: true, polygonOffsetFactor: -4, polygonOffsetUnits: -4 }),
    plastico: m({ color: '#3a3f46', metalness: 0.1, roughness: 0.42, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    carbono: m({ color: '#17191c', metalness: 0.3, roughness: 0.35, clearcoat: 0.8, clearcoatRoughness: 0.15 }),
    helice: m({ color: '#101215', metalness: 0, roughness: 0.5, side: THREE.DoubleSide }),
    led: m({ color: '#2a0806', emissive: '#ff3322', emissiveIntensity: 2.6, metalness: 0, roughness: 0.3 }),
    tela: [
      m({ color: '#e8641f', metalness: 0, roughness: 0.82, side: THREE.DoubleSide }),
      m({ color: '#f1efe9', metalness: 0, roughness: 0.82, side: THREE.DoubleSide }),
    ],
    colina: m({ color: '#7f9a86', metalness: 0, roughness: 1 }),
    arbol: m({ color: '#34502c', metalness: 0, roughness: 0.95 }),
    tronco: m({ color: '#4a3a2c', metalness: 0, roughness: 0.95 }),
    manometro: m({ color: '#f4f2ec', metalness: 0, roughness: 0.4 }),
    vidrio: m({ color: '#e8f0f5', metalness: 0, roughness: 0.05, transparent: true, opacity: 0.25, clearcoat: 1, clearcoatRoughness: 0.03 }),
  };
  variacionMacro(r.pasto, 34, 0.13);
  variacionMacro(r.concreto, 9, 0.06);
  variacionMacro(r.terraza, 7, 0.06);
  // la regla y la diana van pegadas al suelo: un desplazamiento de profundidad evita el parpadeo
  for (const k of [r.regla, r.concreto] as THREE.Material[]) { k.polygonOffset = true; k.polygonOffsetFactor = -1; k.polygonOffsetUnits = -1; }
  r.regla.polygonOffsetFactor = -2; r.regla.polygonOffsetUnits = -2;
  const todos = Object.values(r).flatMap((v) => (Array.isArray(v) ? v : [v])) as THREE.Material[];
  const texturas = [tPasto, tConcreto, tMuro, tTerraza, tPaneles, tDiana].filter(Boolean) as THREE.Texture[];
  return { ...r, todos, texturas };
}

// ───────────────────────────── cinta de trayectoria ─────────────────────────────

/**
 * Cinta de ancho constante en píxeles (como las líneas de campo del motor): crece con el reloj
 * (sólo se dibujan los vértices con aT ≤ uT) y puede ir a trazos (uTrazo > 0, en metros).
 */
export function materialCinta(color: string, ancho: number, opacidad: number, trazo = 0): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis01-cinta',
    transparent: true,
    depthWrite: false,
    side: THREE.DoubleSide,
    uniforms: {
      uRes: { value: new THREE.Vector2(1, 1) },
      uAncho: { value: ancho },
      uColor: { value: new THREE.Color(color) },
      uOpac: { value: opacidad },
      uT: { value: 1e9 },
      uTrazo: { value: trazo },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTan;
      attribute float aLado;
      attribute float aT;
      attribute float aS;
      uniform vec2 uRes;
      uniform float uAncho;
      varying float vLado;
      varying float vT;
      varying float vS;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec4 c0 = projectionMatrix * mv;
        vec4 c1 = projectionMatrix * (modelViewMatrix * vec4(position + aTan * 0.05, 1.0));
        vec2 p0 = c0.xy / max(1e-6, abs(c0.w)) * uRes;
        vec2 p1 = c1.xy / max(1e-6, abs(c1.w)) * uRes;
        vec2 d = p1 - p0;
        float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
        vec2 n = vec2(-d.y, d.x);
        c0.xy += n * aLado * (2.0 * uAncho / uRes) * c0.w;
        gl_Position = c0;
        vLado = aLado; vT = aT; vS = aS;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uColor;
      uniform float uOpac;
      uniform float uT;
      uniform float uTrazo;
      varying float vLado;
      varying float vT;
      varying float vS;
      void main() {
        if (vT > uT) discard;
        if (uTrazo > 0.0 && fract(vS / uTrazo) > 0.55) discard;
        float perfil = 1.0 - smoothstep(0.55, 1.0, abs(vLado));
        gl_FragColor = vec4(uColor, uOpac * perfil);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

// ───────────────────────────── cielo ─────────────────────────────

export interface DefCielo { cenit: string; horizonte: string; suelo: string; sol: string; brillo: number }

/** Cúpula de cielo: degradado horizonte → cenit, halo del sol y suelo lejano bajo el horizonte. */
export function materialCielo(def: DefCielo, dirSol: THREE.Vector3): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis01-cielo',
    side: THREE.BackSide,
    depthWrite: false,
    fog: false,
    uniforms: {
      uCenit: { value: new THREE.Color(def.cenit) },
      uHorizonte: { value: new THREE.Color(def.horizonte) },
      uSuelo: { value: new THREE.Color(def.suelo) },
      uSol: { value: new THREE.Color(def.sol) },
      uBrillo: { value: def.brillo },
      uDirSol: { value: dirSol.clone().normalize() },
    },
    vertexShader: /* glsl */ `
      varying vec3 vDir;
      void main() {
        vDir = normalize(position);
        vec4 p = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
        gl_Position = p.xyww;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform vec3 uCenit;
      uniform vec3 uHorizonte;
      uniform vec3 uSuelo;
      uniform vec3 uSol;
      uniform float uBrillo;
      uniform vec3 uDirSol;
      varying vec3 vDir;
      void main() {
        vec3 d = normalize(vDir);
        float h = d.y;
        vec3 col = h >= 0.0 ? mix(uHorizonte, uCenit, pow(clamp(h, 0.0, 1.0), 0.55)) : mix(uHorizonte, uSuelo, clamp(-h * 6.0, 0.0, 1.0));
        float s = max(0.0, dot(d, normalize(uDirSol)));
        col += uSol * (pow(s, 380.0) * 6.0 + pow(s, 12.0) * 0.18) * uBrillo;
        gl_FragColor = vec4(col, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
