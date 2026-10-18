/**
 * fis03/materiales.ts — materiales PBR del banco del péndulo y sombreadores propios.
 *
 *  · Metales con el entorno de estudio (RoomEnvironment + ACES): latón pulido de la esfera,
 *    acero de tornillería, aluminio anodizado del riel y del brazo, aluminio satinado del
 *    transportador (grabado en un lienzo nítido, con mipmaps y anisotropía), negro anodizado
 *    de la fotopuerta. Sin texturas de ruido: el acabado sale de la rugosidad y del reflejo.
 *  · Fantasma lineal: vidrio azulado translúcido (no escribe profundidad).
 *  · Estela: cinta aditiva con alfa por vértice (sólo ella y el LED pasan del umbral del bloom).
 */
import * as THREE from 'three';

export type CalidadM = 'alta' | 'media';
type Params = THREE.MeshPhysicalMaterialParameters;

function mat(calidad: CalidadM, p: Params): THREE.MeshStandardMaterial {
  if (calidad === 'alta') return new THREE.MeshPhysicalMaterial(p);
  // media: sin barniz ni transmisión (más barato), mismo color y rugosidad
  const { clearcoat, clearcoatRoughness, sheen, sheenColor, sheenRoughness, transmission, thickness, ior, specularIntensity, ...resto } = p;
  void clearcoat; void clearcoatRoughness; void sheen; void sheenColor; void sheenRoughness; void transmission; void thickness; void ior; void specularIntensity;
  return new THREE.MeshStandardMaterial(resto as THREE.MeshStandardMaterialParameters);
}

export interface MatsPendulo {
  laton: THREE.MeshStandardMaterial;
  latonOscuro: THREE.MeshStandardMaterial;
  acero: THREE.MeshStandardMaterial;
  tornillo: THREE.MeshStandardMaterial;
  anodizado: THREE.MeshStandardMaterial;
  satinado: THREE.MeshStandardMaterial;
  grabado: THREE.MeshStandardMaterial;
  negro: THREE.MeshStandardMaterial;
  goma: THREE.MeshStandardMaterial;
  perilla: THREE.MeshStandardMaterial;
  lente: THREE.MeshStandardMaterial;
  cable: THREE.MeshStandardMaterial;
  hilo: THREE.MeshStandardMaterial;
  estudio: THREE.MeshStandardMaterial;
  indice: THREE.MeshStandardMaterial;
  fantasma: THREE.MeshStandardMaterial;
  fantasmaHilo: THREE.MeshBasicMaterial;
  led: THREE.MeshBasicMaterial;
  haz: THREE.MeshBasicMaterial;
  estrobo: THREE.MeshBasicMaterial;
  todos: THREE.Material[];
}

/** Grabado del transportador: semicírculo inferior ±90°, marcas cada grado y cifras cada 10°. */
function texturaTransportador(): THREE.CanvasTexture | null {
  if (typeof document === 'undefined') return null;
  const N = 2048;
  const c = document.createElement('canvas');
  c.width = N; c.height = N;
  const g = c.getContext('2d');
  if (!g) return null;
  const cx = N / 2, cy = N / 2, R = N / 2;
  // aluminio satinado: un degradado suave de baja frecuencia (sin moteado)
  const fondo = g.createRadialGradient(cx, cy, R * 0.1, cx, cy, R);
  fondo.addColorStop(0, '#e2e5e8'); fondo.addColorStop(1, '#cfd4d9');
  g.fillStyle = fondo; g.fillRect(0, 0, N, N);
  const tinta = '#1c232b';
  g.strokeStyle = tinta; g.fillStyle = tinta; g.lineCap = 'butt';
  // arcos de referencia
  g.lineWidth = 3;
  for (const f of [0.965, 0.81]) { g.beginPath(); g.arc(cx, cy, R * f, 0, Math.PI); g.stroke(); }
  // marcas: 0° en la vertical hacia abajo, ±90° en la horizontal
  for (let d = -90; d <= 90; d++) {
    const a = d * (Math.PI / 180);
    const largo = d % 10 === 0 ? 0.135 : d % 5 === 0 ? 0.09 : 0.05;
    g.lineWidth = d % 10 === 0 ? 5 : d % 5 === 0 ? 3.4 : 2;
    const sx = Math.sin(a), sy = Math.cos(a);
    g.beginPath();
    g.moveTo(cx + sx * R * 0.965, cy + sy * R * 0.965);
    g.lineTo(cx + sx * R * (0.965 - largo), cy + sy * R * (0.965 - largo));
    g.stroke();
    if (d % 10 === 0 && Math.abs(d) <= 80) {
      g.save();
      g.translate(cx + sx * R * 0.745, cy + sy * R * 0.745);
      g.rotate(-a);
      g.font = `600 ${Math.round(N * 0.034)}px Outfit, system-ui, sans-serif`;
      g.textAlign = 'center'; g.textBaseline = 'middle';
      g.fillText(String(Math.abs(d)), 0, 0);
      g.restore();
    }
  }
  // radios cada 30° (finos) y el eje vertical
  g.lineWidth = 1.6; g.globalAlpha = 0.55;
  for (const d of [-60, -30, 30, 60]) {
    const a = d * (Math.PI / 180);
    g.beginPath(); g.moveTo(cx + Math.sin(a) * R * 0.12, cy + Math.cos(a) * R * 0.12); g.lineTo(cx + Math.sin(a) * R * 0.69, cy + Math.cos(a) * R * 0.69); g.stroke();
  }
  g.globalAlpha = 1; g.lineWidth = 2.6;
  g.beginPath(); g.moveTo(cx, cy + R * 0.06); g.lineTo(cx, cy + R * 0.69); g.stroke();
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.generateMipmaps = true;
  t.minFilter = THREE.LinearMipmapLinearFilter;
  t.magFilter = THREE.LinearFilter;
  t.anisotropy = 8;
  return t;
}

export function crearMateriales(calidad: CalidadM): MatsPendulo & { texturas: THREE.Texture[] } {
  const m = (p: Params) => mat(calidad, p);
  const grabadoTex = texturaTransportador();
  const r: Omit<MatsPendulo, 'todos'> = {
    laton: m({ color: '#caa055', metalness: 1, roughness: 0.2, clearcoat: 0.5, clearcoatRoughness: 0.12 }),
    latonOscuro: m({ color: '#9c7a3e', metalness: 1, roughness: 0.34 }),
    acero: m({ color: '#cdd2d8', metalness: 1, roughness: 0.24 }),
    // tornillería cincada mate: sin destellos que el bloom convierta en luces
    tornillo: m({ color: '#7f868e', metalness: 1, roughness: 0.5, envMapIntensity: 0.7 }),
    anodizado: m({ color: '#4b5562', metalness: 0.78, roughness: 0.36, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    satinado: m({ color: '#9aa3ac', metalness: 0.9, roughness: 0.42 }),
    grabado: m({ color: '#9ea6ae', map: grabadoTex ?? undefined, metalness: 0.35, roughness: 0.55, envMapIntensity: 0.55 }),
    negro: m({ color: '#1b1f24', metalness: 0.5, roughness: 0.38, clearcoat: 0.35, clearcoatRoughness: 0.3 }),
    goma: m({ color: '#121417', metalness: 0, roughness: 0.9 }),
    perilla: m({ color: '#14171b', metalness: 0.15, roughness: 0.32, clearcoat: 0.6, clearcoatRoughness: 0.25 }),
    lente: m({ color: '#2a0d10', metalness: 0, roughness: 0.05, clearcoat: 1, clearcoatRoughness: 0.03 }),
    cable: m({ color: '#191b1f', metalness: 0, roughness: 0.48, clearcoat: 0.3, clearcoatRoughness: 0.4 }),
    hilo: m({ color: '#efe5cf', metalness: 0, roughness: 0.62 }),
    estudio: m({ color: '#ffffff', vertexColors: true, metalness: 0, roughness: 0.93, envMapIntensity: 0.15 }),
    indice: m({ color: '#c8323a', metalness: 0.2, roughness: 0.4, clearcoat: 0.6, clearcoatRoughness: 0.2 }),
    fantasma: new THREE.MeshStandardMaterial({
      color: '#a9cbff', emissive: '#3e6cb8', emissiveIntensity: 0.55, metalness: 0, roughness: 0.25,
      transparent: true, opacity: 0.3, depthWrite: false,
    }),
    fantasmaHilo: new THREE.MeshBasicMaterial({ color: '#9cc2ff', transparent: true, opacity: 0.55, depthWrite: false }),
    led: new THREE.MeshBasicMaterial({ color: '#3a1012', toneMapped: false }),
    haz: new THREE.MeshBasicMaterial({ color: new THREE.Color('#ff2a2a').multiplyScalar(0.9), transparent: true, opacity: 0.55, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
    estrobo: new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, depthWrite: false, toneMapped: false, blending: THREE.AdditiveBlending }),
  };
  // la cara grabada va pegada a su placa: un desplazamiento de profundidad evita el parpadeo
  r.grabado.polygonOffset = true; r.grabado.polygonOffsetFactor = -2; r.grabado.polygonOffsetUnits = -2;
  const todos = Object.values(r) as THREE.Material[];
  return { ...r, todos, texturas: grabadoTex ? [grabadoTex] : [] };
}

// ───────────────────────────── estela ─────────────────────────────

/** Cinta aditiva: color y alfa por vértice; los valores > 1 los recoge el bloom. */
export function materialEstela(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis03-estela',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: { uOpac: { value: 1 } },
    vertexShader: /* glsl */ `
      attribute vec4 aCol;
      attribute float aLado;
      varying vec4 vCol;
      varying float vLado;
      void main() {
        vCol = aCol; vLado = aLado;
        gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpac;
      varying vec4 vCol;
      varying float vLado;
      void main() {
        float perfil = exp(-vLado * vLado * 2.6);
        gl_FragColor = vec4(vCol.rgb * vCol.a * perfil * uOpac, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
