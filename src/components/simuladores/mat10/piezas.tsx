'use client';
/**
 * mat10/piezas.tsx — la máquina de Galton de sobremesa, a escala real (1 u = 1 cm):
 *
 *  - TABLERO de nogal barnizado (28 × 47 cm) con fondo lacado azul noche y frente de
 *    VIDRIO (sólo reflejos: el vidrio transmite ~92 % y su reflejo de Fresnel se SUMA).
 *  - TOLVA en V con la reserva de bolitas y una garganta del ancho exacto del modelo de
 *    impacto (centro de la bolita en ±w).
 *  - 55 CLAVOS de latón Ø 3,4 mm en red triangular de paso 22,2 mm (instanciados).
 *  - 10 TABIQUES de aluminio satinado con filo en punta, bajo los clavos de la última
 *    fila; canales de 21,2 mm (3,5 bolitas) donde la pila se empaqueta hexagonal.
 *  - PLACA de latón con los números k = 0…10 grabados (la escala del instrumento).
 *  - NIVEL DE BURBUJA en el travesaño superior: vial curvo de R = 50 cm; la burbuja se
 *    corre s = R·α hacia el lado alto (0,87 cm por grado).
 *  - PEANA de nogal con el soporte de fundición y el eje de giro (pomo moleteado): el
 *    tablero entero gira α en su plano alrededor de ese eje.
 *
 * Coordenadas del TABLERO (las de galton.ts): origen en el eje del clavo de la fila 0,
 * +z hacia el alumno; las bolitas viven en z = 0, entre el fondo y el vidrio.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { cajaRedondeada, extruir, tornear, crearLienzo, texturaDeLienzo, familiaTexto, useVersionFuentes, type Calidad } from '../_kit';
import {
  FILAS, CONTENEDORES, R_BOLA, R_CLAVO, ESPESOR_TABIQUE, ANCHO_CANAL, Y_SALIDA, Y_TABIQUE, Y_BOCA, Y_FONDO, X_PARED, W_IMPACTO,
  CAPAS, PASO_CAPA, clavo, clavos, xContenedor, xTabique, burbuja,
} from './galton';

// ───────────────────────────── cotas del mueble ─────────────────────────────

/** Cara del fondo y cara interior del vidrio: la bolita (Ø 6 mm) juega entre ellas con 0,5 mm a cada lado. */
export const Z_FONDO = -(R_BOLA + 0.05);
export const Z_VIDRIO = R_BOLA + 0.05;
const ESP_VIDRIO = 0.3;
const ESP_FONDO = 0.6;
/** Marco: travesaños y largueros. */
const ANCHO_LARGUERO = 2.0;
const ALTO_TRAV_SUP = 2.2;
const ALTO_TRAV_INF = 2.4;
const Z_MARCO_ATRAS = Z_FONDO - ESP_FONDO - 0.2;
const Z_MARCO_FRENTE = Z_VIDRIO + ESP_VIDRIO + 0.3;
const FONDO_MARCO = Z_MARCO_FRENTE - Z_MARCO_ATRAS;
const Z_MARCO_C = (Z_MARCO_FRENTE + Z_MARCO_ATRAS) / 2;
/** Techo interior (bajo el travesaño superior) y garganta de la tolva. */
export const Y_TECHO = Y_SALIDA + 5.6;
const SEMI_GARGANTA = W_IMPACTO + R_BOLA + 0.04;
const Y_GARGANTA = Y_SALIDA - 0.25;
/** Bordes exteriores del tablero. */
export const X_EXT = X_PARED + ANCHO_LARGUERO;
export const Y_SUP_EXT = Y_TECHO + ALTO_TRAV_SUP;
export const Y_INF_EXT = Y_FONDO - ALTO_TRAV_INF;
/** Eje de giro, 1,2 cm bajo el canto inferior del tablero. */
export const Y_PIVOTE = Y_INF_EXT - 1.2;
/** Peana: su cara superior queda 1,6 cm bajo el eje. */
export const ALTO_PEANA = 2.2;
export const Y_PEANA_SUP = Y_PIVOTE - 1.6;
/** Tolva: las paredes suben desde la garganta con 36° sobre la horizontal. */
const TOLVA_ALTO = 4.6;
const TOLVA_ANCHO = 6.4;
const ESP_TOLVA = 0.5;

/** Vértices interiores de la pared derecha de la tolva (garganta → arriba). */
export const TOLVA_INTERIOR: [[number, number], [number, number]] = [[SEMI_GARGANTA, Y_GARGANTA], [SEMI_GARGANTA + TOLVA_ANCHO, Y_GARGANTA + TOLVA_ALTO]];

// ───────────────────────────── texturas ─────────────────────────────

/**
 * Nogal americano: veta LARGA y de baja frecuencia (anillos que ondulan despacio),
 * sin ruido fino (bajo el foco haría «lija»). Color y rugosidad en dos lienzos.
 */
function texturasNogal(calidad: Calidad) {
  if (typeof document === 'undefined') return null;
  const W = calidad === 'alta' ? 1024 : 512, H = W / 4;
  const col = crearLienzo(W, H), rug = crearLienzo(W, H);
  const c = col.getContext('2d')!, o = rug.getContext('2d')!;
  let sem = 1234567;
  const rnd = () => { sem = (sem * 16807) % 2147483647; return sem / 2147483647; };
  const g = c.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#5b3a25'); g.addColorStop(0.5, '#6a452c'); g.addColorStop(1, '#583823');
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  o.fillStyle = 'rgb(0,120,0)'; o.fillRect(0, 0, W, H);
  // vetas: curvas suaves a lo largo de x, de anchura y tono variables
  for (let i = 0; i < 46; i++) {
    const y0 = rnd() * H, amp = 2 + rnd() * 7, per = W * (0.35 + rnd() * 0.8), fase = rnd() * Math.PI * 2;
    const oscura = rnd() < 0.62;
    c.strokeStyle = oscura ? `rgba(38,22,13,${0.18 + rnd() * 0.25})` : `rgba(140,96,62,${0.12 + rnd() * 0.18})`;
    c.lineWidth = 0.8 + rnd() * (oscura ? 2.6 : 3.4);
    o.strokeStyle = oscura ? 'rgba(0,150,0,0.35)' : 'rgba(0,100,0,0.3)'; o.lineWidth = c.lineWidth;
    for (const ctx of [c, o]) {
      ctx.beginPath();
      for (let x = -8; x <= W + 8; x += 8) {
        const y = y0 + amp * Math.sin((x / per) * Math.PI * 2 + fase) + 0.35 * amp * Math.sin((x / per) * Math.PI * 5.3 + fase * 2);
        if (x <= -8) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
  }
  // manchas largas de figura (tono), muy suaves
  for (let i = 0; i < 7; i++) {
    const x = rnd() * W, y = rnd() * H, rx = W * (0.15 + rnd() * 0.25);
    const r = c.createRadialGradient(x, y, 0, x, y, rx);
    r.addColorStop(0, rnd() < 0.5 ? 'rgba(120,80,48,0.18)' : 'rgba(40,24,14,0.2)'); r.addColorStop(1, 'rgba(0,0,0,0)');
    c.save(); c.translate(x, y); c.scale(1, 0.18); c.translate(-x, -y); c.fillStyle = r; c.fillRect(x - rx, y - rx, 2 * rx, 2 * rx); c.restore();
  }
  const mapa = texturaDeLienzo(col);
  const rugosidad = texturaDeLienzo(rug, { srgb: false });
  return { mapa, rugosidad };
}

/** Placa de latón con los números 0…10 grabados (relleno de laca oscura) bajo cada canal. */
function dibujarPlaca(ctx: CanvasRenderingContext2D, w: number, h: number, ancho: number, orm: boolean) {
  const k = w / ancho;
  ctx.fillStyle = orm ? 'rgb(0,90,255)' : '#c9a75a';
  ctx.fillRect(0, 0, w, h);
  if (!orm) {
    // cepillado horizontal muy tenue (latón satinado)
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, 'rgba(255,240,200,0.18)'); g.addColorStop(0.5, 'rgba(255,255,255,0)'); g.addColorStop(1, 'rgba(80,50,10,0.18)');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
  }
  ctx.fillStyle = orm ? 'rgb(0,200,0)' : '#2a2116';
  ctx.font = `600 ${Math.round(h * 0.6)}px ${familiaTexto()}`;
  ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
  for (let i = 0; i < CONTENEDORES; i++) ctx.fillText(String(i), (xContenedor(i) + ancho / 2) * k, h * 0.54);
  // filetes grabados
  ctx.fillRect(0, h * 0.06, w, Math.max(1, h * 0.025));
  ctx.fillRect(0, h * 0.915, w, Math.max(1, h * 0.025));
}

/** Escala del vial: dos líneas de enrase y marcas de 1° (0,873 cm) hasta ±6°. */
function dibujarEscalaVial(ctx: CanvasRenderingContext2D, w: number, h: number, largo: number) {
  const k = w / largo;
  ctx.clearRect(0, 0, w, h);
  ctx.fillStyle = '#16181b';
  const semi = 1.0; // semilongitud de la burbuja + holgura
  for (const s of [-1, 1]) ctx.fillRect(w / 2 + s * semi * k - 1.5, h * 0.1, 3, h * 0.8);
  for (let g = 1; g <= 6; g++) for (const s of [-1, 1]) {
    const x = w / 2 + s * (semi + g * 0.8727) * k;
    if (x < 2 || x > w - 2) continue;
    ctx.fillRect(x - 0.9, h * 0.3, 1.8, h * 0.4);
  }
}

/**
 * Grabado dorado del fondo (sólo trazos; el resto transparente):
 *  - la RED de caminos: cada clavo unido a los dos de la fila siguiente (y los de la
 *    última fila a la boca de sus dos canales): los 2¹⁰ caminos posibles de una bolita;
 *  - en los canales, una línea cada 4 capas = 12 bolitas (la pila es una regla).
 * Ni números ni curvas: nada de lo que salga μ ni σ.
 */
function dibujarGrabado(ctx: CanvasRenderingContext2D, w: number, h: number, x0: number, y1: number, ancho: number, alto: number) {
  const k = w / ancho;
  const P = (x: number, y: number): [number, number] => [(x - x0) * k, (y1 - y) * k];
  ctx.clearRect(0, 0, w, h);
  ctx.lineCap = 'round';
  // red de caminos
  ctx.strokeStyle = 'rgba(214,178,98,0.55)';
  ctx.lineWidth = Math.max(1, 0.045 * k);
  const linea = (a: [number, number], b: [number, number]) => {
    const [ax, ay] = P(a[0], a[1]), [bx, by] = P(b[0], b[1]);
    ctx.beginPath(); ctx.moveTo(ax, ay); ctx.lineTo(bx, by); ctx.stroke();
  };
  for (let i = 0; i < FILAS; i++) for (let j = 0; j <= i; j++) {
    const a = clavo(i, j);
    if (i < FILAS - 1) { linea(a, clavo(i + 1, j)); linea(a, clavo(i + 1, j + 1)); }
    else { linea(a, [xContenedor(j), Y_BOCA]); linea(a, [xContenedor(j + 1), Y_BOCA]); }
  }
  linea([0, Y_SALIDA], clavo(0, 0));
  // graduación de los canales
  ctx.strokeStyle = 'rgba(214,178,98,0.42)';
  ctx.lineWidth = Math.max(1, 0.035 * k);
  for (let c = 4; c < CAPAS; c += 4) {
    const y = Y_FONDO + c * PASO_CAPA;
    for (let q = 0; q < CONTENEDORES; q++) {
      const xc = xContenedor(q);
      linea([xc - ANCHO_CANAL / 2 + 0.12, y], [xc + ANCHO_CANAL / 2 - 0.12, y]);
    }
  }
}

/**
 * Reflejo del estudio en el vidrio frontal, con Fresnel (Schlick, n = 1,52 → F₀ = 4 %):
 * R = reflect(−V, N) se compara con la dirección de una tira de luz vertical que está
 * delante y a la izquierda del alumno; se SUMA (mezcla aditiva) a lo que hay detrás.
 * Al orbitar, la banda se desliza como lo haría en un cristal de verdad.
 */
export function crearVidrioEstudio() {
  return new THREE.ShaderMaterial({
    name: 'galton-vidrio-estudio',
    transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    uniforms: { uIntensidad: { value: 1.8 } },
    vertexShader: /* glsl */`
      varying vec3 vPos; varying vec3 vNor;
      void main() {
        vec4 w = modelMatrix * vec4(position, 1.0);
        vPos = w.xyz; vNor = normalize(mat3(modelMatrix) * normal);
        gl_Position = projectionMatrix * viewMatrix * w;
      }`,
    fragmentShader: /* glsl */`
      uniform float uIntensidad;
      varying vec3 vPos; varying vec3 vNor;
      void main() {
        vec3 V = normalize(cameraPosition - vPos);
        vec3 N = normalize(vNor);
        vec3 R = reflect(-V, N);
        float F = 0.04 + 0.96 * pow(1.0 - clamp(dot(N, V), 0.0, 1.0), 5.0);
        // tira vertical estrecha: acimut −20,4° (delante, a la izquierda), ±0,5° con borde suave
        float az = degrees(atan(R.x, R.z));
        float banda = 1.0 - smoothstep(0.35, 1.0, abs(az + 20.4));
        float halo = 0.1 * (1.0 - smoothstep(0.8, 3.0, abs(az + 20.4)));
        float vert = smoothstep(-0.55, -0.25, R.y) * (1.0 - smoothstep(0.25, 0.5, R.y));
        // techo del estudio: reflejos rasantes arriba
        float techo = 0.35 * smoothstep(0.3, 0.75, R.y);
        vec3 c = vec3(1.0, 0.98, 0.95) * F * uIntensidad * ((banda + halo) * vert + techo);
        gl_FragColor = vec4(c, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }`,
  });
}

// ───────────────────────────── materiales ─────────────────────────────

export interface MaterialesGalton {
  nogal: THREE.MeshPhysicalMaterial;
  nogalVertical: THREE.MeshPhysicalMaterial;
  laca: THREE.MeshPhysicalMaterial;
  laton: THREE.MeshStandardMaterial;
  latonPulido: THREE.MeshStandardMaterial;
  acero: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial;
  fundicion: THREE.MeshStandardMaterial;
  vidrio: THREE.MeshPhysicalMaterial;
  liquido: THREE.MeshPhysicalMaterial;
  burbuja: THREE.MeshStandardMaterial;
  mesa: THREE.MeshPhysicalMaterial;
}

export function useMaterialesGalton(calidad: Calidad): MaterialesGalton {
  const tex = useMemo(() => texturasNogal(calidad), [calidad]);
  const m = useMemo<MaterialesGalton>(() => {
    const vertical = tex ? { mapa: tex.mapa.clone(), rugosidad: tex.rugosidad.clone() } : null;
    if (vertical) for (const t of [vertical.mapa, vertical.rugosidad]) { t.center.set(0.5, 0.5); t.rotation = Math.PI / 2; t.needsUpdate = true; }
    const madera = (map: THREE.Texture | null, rug: THREE.Texture | null, nombre: string) => new THREE.MeshPhysicalMaterial({
      color: '#ffffff', map, roughnessMap: rug, roughness: 0.62, metalness: 0,
      clearcoat: 0.55, clearcoatRoughness: 0.28, name: nombre,
    });
    return {
      nogal: madera(tex?.mapa ?? null, tex?.rugosidad ?? null, 'galton-nogal'),
      nogalVertical: madera(vertical?.mapa ?? null, vertical?.rugosidad ?? null, 'galton-nogal-v'),
      // laca azul noche satinada: hace que el acero y el latón destaquen
      laca: new THREE.MeshPhysicalMaterial({ color: '#1a2536', roughness: 0.48, metalness: 0, clearcoat: 0.25, clearcoatRoughness: 0.45, name: 'galton-laca' }),
      laton: new THREE.MeshStandardMaterial({ color: '#d4ae5c', metalness: 1, roughness: 0.3, name: 'galton-laton' }),
      latonPulido: new THREE.MeshStandardMaterial({ color: '#e0bd6c', metalness: 1, roughness: 0.17, name: 'galton-laton-pulido' }),
      // acero de rodamiento (AISI 52100) pulido: refleja el estudio
      acero: new THREE.MeshStandardMaterial({ color: '#eceff3', metalness: 1, roughness: 0.2, envMapIntensity: 1.7, name: 'galton-acero' }),
      aluminio: new THREE.MeshStandardMaterial({ color: '#c3c8cf', metalness: 1, roughness: 0.36, name: 'galton-aluminio' }),
      fundicion: new THREE.MeshStandardMaterial({ color: '#2a2d32', metalness: 0.55, roughness: 0.52, name: 'galton-fundicion' }),
      // vidrio float: base negra + mezcla ADITIVA → sólo suma su reflejo de Fresnel sobre lo que hay detrás
      vidrio: new THREE.MeshPhysicalMaterial({
        color: '#000000', metalness: 0, roughness: 0.12, ior: 1.52, specularIntensity: 1, envMapIntensity: 1.1,
        transparent: true, blending: THREE.AdditiveBlending, depthWrite: false, name: 'galton-vidrio',
      }),
      liquido: new THREE.MeshPhysicalMaterial({ color: '#cddc4c', roughness: 0.12, metalness: 0, transparent: true, opacity: 0.78, clearcoat: 1, clearcoatRoughness: 0.05, name: 'galton-alcohol' }),
      burbuja: new THREE.MeshStandardMaterial({ color: '#f6f8ea', roughness: 0.25, metalness: 0, transparent: true, opacity: 0.92, name: 'galton-burbuja' }),
      mesa: new THREE.MeshPhysicalMaterial({ color: '#1a1c20', roughness: 0.58, metalness: 0, clearcoat: 0.12, clearcoatRoughness: 0.5, name: 'galton-mesa' }),
    };
  }, [tex]);
  useEffect(() => () => {
    Object.values(m).forEach((x) => x.dispose());
    tex?.mapa.dispose(); tex?.rugosidad.dispose();
    m.nogalVertical.map?.dispose(); m.nogalVertical.roughnessMap?.dispose();
  }, [m, tex]);
  return m;
}

// ───────────────────────────── geometrías ─────────────────────────────

/** Clavo de latón torneado: fuste Ø 3,4 mm de fondo a vidrio, con chaflán de 0,3 mm en la punta. */
function geoClavo(segs: number) {
  const L = Z_VIDRIO - Z_FONDO - 0.02;
  const r = R_CLAVO, ch = 0.03;
  // perfil [radio, altura] a lo largo del eje; se tornea en Y y se tumba sobre Z
  const g = tornear([[0, 0], [r, 0], [r, L - ch], [r - ch, L], [0, L]], segs);
  // rotateX(+90°) lleva el eje +Y del torno a +Z: el clavo va del fondo (−z) al vidrio (+z)
  g.rotateX(Math.PI / 2);
  g.translate(0, 0, Z_FONDO + 0.01);
  return g;
}

/** Tabique de aluminio: lámina de 1 mm con filo en punta, de fondo a vidrio. */
function geoTabique() {
  const alto = Y_TABIQUE - Y_FONDO, t = ESPESOR_TABIQUE;
  const s = new THREE.Shape();
  s.moveTo(-t / 2, 0); s.lineTo(t / 2, 0); s.lineTo(t / 2, alto - 0.14); s.lineTo(0, alto); s.lineTo(-t / 2, alto - 0.14); s.closePath();
  const g = extruir(s, Z_VIDRIO - Z_FONDO - 0.02, 4);
  g.translate(0, Y_FONDO, Z_FONDO + 0.01);
  return g;
}

/** Pared de la tolva (paralelogramo inclinado), de fondo a vidrio. `lado` = ±1. */
function geoTolva(lado: 1 | -1) {
  const [[x0, y0], [x1, y1]] = TOLVA_INTERIOR;
  const s = new THREE.Shape();
  // cara interior de la garganta a lo alto, y su paralela desplazada ESP hacia fuera (normal de la pared)
  const dx = x1 - x0, dy = y1 - y0, L = Math.hypot(dx, dy);
  const nx = dy / L, ny = -dx / L; // normal hacia fuera-abajo
  const e = ESP_TOLVA;
  const pts: [number, number][] = [[x0, y0], [x1, y1], [X_PARED, y1], [X_PARED, y1 - 0.6], [x0 + nx * e, y0 + ny * e]];
  pts.forEach(([x, y], i) => (i ? s.lineTo(lado * x, y) : s.moveTo(lado * x, y)));
  s.closePath();
  const g = extruir(s, Z_VIDRIO - Z_FONDO - 0.02, 4);
  g.translate(0, 0, Z_FONDO + 0.01);
  return g;
}

// ───────────────────────────── el tablero ─────────────────────────────

/** Instancias fijas: escribe las matrices una vez. */
function useInstancias(ref: React.RefObject<THREE.InstancedMesh | null>, posiciones: [number, number, number][]) {
  useLayoutEffect(() => {
    const mesh = ref.current; if (!mesh) return;
    const o = new THREE.Object3D();
    posiciones.forEach((p, i) => { o.position.set(p[0], p[1], p[2]); o.updateMatrix(); mesh.setMatrixAt(i, o.matrix); });
    mesh.instanceMatrix.needsUpdate = true;
    mesh.computeBoundingSphere();
  }, [ref, posiciones]);
}

export function Tablero({ m, calidad }: { m: MaterialesGalton; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const gClavo = useMemo(() => geoClavo(alta ? 20 : 12), [alta]);
  const gTabique = useMemo(() => geoTabique(), []);
  const gTolvaI = useMemo(() => geoTolva(-1), []);
  const gTolvaD = useMemo(() => geoTolva(1), []);
  useEffect(() => () => { gClavo.dispose(); gTabique.dispose(); gTolvaI.dispose(); gTolvaD.dispose(); }, [gClavo, gTabique, gTolvaI, gTolvaD]);

  const posClavos = useMemo<[number, number, number][]>(() => clavos().map(([x, y]) => [x, y, 0]), []);
  const posTabiques = useMemo<[number, number, number][]>(() => Array.from({ length: FILAS }, (_, i) => [xTabique(i + 1), 0, 0]), []);
  const refClavos = useRef<THREE.InstancedMesh>(null);
  const refTabiques = useRef<THREE.InstancedMesh>(null);
  useInstancias(refClavos, posClavos);
  useInstancias(refTabiques, posTabiques);

  // placa numerada: color y rugosidad/metalicidad (el grabado es laca mate, no metal)
  const vf = useVersionFuentes();
  const anchoPlaca = 2 * X_PARED;
  const placa = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = alta ? 2048 : 1024, H = Math.round(W * (1.3 / anchoPlaca));
    const col = crearLienzo(W, H), orm = crearLienzo(W, H);
    dibujarPlaca(col.getContext('2d')!, W, H, anchoPlaca, false);
    dibujarPlaca(orm.getContext('2d')!, W, H, anchoPlaca, true);
    const mapa = texturaDeLienzo(col), rug = texturaDeLienzo(orm, { srgb: false });
    const mat = new THREE.MeshStandardMaterial({ color: '#ffffff', map: mapa, roughnessMap: rug, metalnessMap: rug, roughness: 1, metalness: 1, name: 'galton-placa' });
    return { mapa, rug, mat };
    // vf: redibuja con la tipografía del lab cuando llega
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [alta, vf]);
  useEffect(() => () => { placa?.mapa.dispose(); placa?.rug.dispose(); placa?.mat.dispose(); }, [placa]);

  const altoInt = Y_TECHO - Y_FONDO;
  const yInt = (Y_TECHO + Y_FONDO) / 2;
  const grabado = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const ancho = 2 * X_PARED, W = alta ? 1024 : 640, H = Math.round(W * (altoInt / ancho));
    const c = crearLienzo(W, H);
    dibujarGrabado(c.getContext('2d')!, W, H, -X_PARED, Y_TECHO, ancho, altoInt);
    const t = texturaDeLienzo(c);
    const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, metalness: 0.6, roughness: 0.35, depthWrite: false, name: 'galton-grabado' });
    return { t, mat };
  }, [alta, altoInt]);
  const vidrioEstudio = useMemo(() => crearVidrioEstudio(), []);
  useEffect(() => () => { grabado?.t.dispose(); grabado?.mat.dispose(); vidrioEstudio.dispose(); }, [grabado, vidrioEstudio]);
  const altoTotal = Y_SUP_EXT - Y_INF_EXT;
  const yTotal = (Y_SUP_EXT + Y_INF_EXT) / 2;
  const R_CANTO = 0.28;

  return (
    <group>
      {/* fondo lacado */}
      <mesh userData={{ pieza: 'fondo' }} material={m.laca} position={[0, yInt, Z_FONDO - ESP_FONDO / 2]} receiveShadow geometry={cajaRedondeada(2 * X_PARED + 0.4, altoInt + 0.4, ESP_FONDO, 0.05, 2)} />
      {grabado && (
        <mesh material={grabado.mat} position={[0, yInt, Z_FONDO + 0.004]} receiveShadow raycast={() => null}>
          <planeGeometry args={[2 * X_PARED, altoInt]} />
        </mesh>
      )}
      {/* largueros (veta vertical) y travesaños (veta horizontal) */}
      {[-1, 1].map((s) => (
        <mesh key={s} userData={{ pieza: 'marco' }} material={m.nogalVertical} position={[s * (X_PARED + ANCHO_LARGUERO / 2), yTotal, Z_MARCO_C]} castShadow receiveShadow
          geometry={cajaRedondeada(ANCHO_LARGUERO, altoTotal, FONDO_MARCO, R_CANTO, 3)} />
      ))}
      <mesh userData={{ pieza: 'marco' }} material={m.nogal} position={[0, Y_TECHO + ALTO_TRAV_SUP / 2, Z_MARCO_C]} castShadow receiveShadow
        geometry={cajaRedondeada(2 * X_PARED + 0.02, ALTO_TRAV_SUP, FONDO_MARCO, R_CANTO, 3)} />
      <mesh userData={{ pieza: 'marco' }} material={m.nogal} position={[0, Y_FONDO - ALTO_TRAV_INF / 2, Z_MARCO_C]} castShadow receiveShadow
        geometry={cajaRedondeada(2 * X_PARED + 0.02, ALTO_TRAV_INF, FONDO_MARCO, R_CANTO, 3)} />
      {/* tolva */}
      <mesh userData={{ pieza: 'tolva' }} geometry={gTolvaI} material={m.nogal} castShadow receiveShadow />
      <mesh userData={{ pieza: 'tolva' }} geometry={gTolvaD} material={m.nogal} castShadow receiveShadow />
      {/* clavos y tabiques */}
      <instancedMesh userData={{ pieza: 'clavo' }} ref={refClavos} args={[gClavo, m.laton, posClavos.length]} castShadow receiveShadow />
      <instancedMesh userData={{ pieza: 'tabique' }} ref={refTabiques} args={[gTabique, m.aluminio, posTabiques.length]} castShadow receiveShadow />
      {/* placa numerada en el frente del travesaño inferior */}
      {placa && (
        <mesh userData={{ pieza: 'placa' }} material={placa.mat} position={[0, Y_FONDO - ALTO_TRAV_INF / 2, Z_MARCO_FRENTE + 0.03]}>
          <boxGeometry args={[anchoPlaca, 1.3, 0.06]} />
        </mesh>
      )}
      {/* vidrio frontal: sólo su reflejo */}
      <mesh material={vidrioEstudio} position={[0, yInt, Z_VIDRIO + ESP_VIDRIO]} renderOrder={10} raycast={() => null}>
        <planeGeometry args={[2 * X_PARED, altoInt]} />
      </mesh>
    </group>
  );
}

// ───────────────────────────── nivel de burbuja ─────────────────────────────

const LARGO_VIAL = 10.5;
const R_VIAL_TUBO = 0.36;
/** Burbuja: semilongitud 0,75 cm. */
const SEMI_BURBUJA = 0.75;

export function NivelBurbuja({ m, alfa, calidad }: { m: MaterialesGalton; alfa: React.MutableRefObject<number>; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const burbujaRef = useRef<THREE.Mesh>(null);
  const escala = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const W = alta ? 1024 : 512, H = Math.round(W * (0.62 / LARGO_VIAL));
    const c = crearLienzo(W, H);
    dibujarEscalaVial(c.getContext('2d')!, W, H, LARGO_VIAL);
    const t = texturaDeLienzo(c);
    const mat = new THREE.MeshStandardMaterial({ map: t, transparent: true, roughness: 0.5, metalness: 0, name: 'galton-vial-escala', depthWrite: false });
    return { t, mat };
  }, [alta]);
  useEffect(() => () => { escala?.t.dispose(); escala?.mat.dispose(); }, [escala]);
  const gBurbuja = useMemo(() => { const g = new THREE.CapsuleGeometry(R_VIAL_TUBO * 0.72, 2 * SEMI_BURBUJA - 2 * R_VIAL_TUBO * 0.72, 6, 16); g.rotateZ(Math.PI / 2); return g; }, []);
  useEffect(() => () => gBurbuja.dispose(), [gBurbuja]);
  const y = Y_TECHO + ALTO_TRAV_SUP / 2, z = Z_MARCO_FRENTE + 0.55;
  useFrame(() => {
    const b = burbujaRef.current; if (!b) return;
    const s = THREE.MathUtils.clamp(burbuja(alfa.current), -(LARGO_VIAL / 2 - SEMI_BURBUJA - 0.3), LARGO_VIAL / 2 - SEMI_BURBUJA - 0.3);
    b.position.x = s;
  });
  return (
    <group position={[0, y, z]} userData={{ pieza: 'nivel' }}>
      {/* caja de latón con ventana */}
      <mesh material={m.latonPulido} position={[0, 0, -0.32]} castShadow geometry={cajaRedondeada(LARGO_VIAL + 1.6, 1.25, 0.5, 0.18, 3)} />
      <mesh material={m.fundicion} position={[0, 0, -0.06]}>
        <boxGeometry args={[LARGO_VIAL + 0.2, 0.95, 0.02]} />
      </mesh>
      {/* vial: alcohol teñido y burbuja */}
      <mesh material={m.liquido} rotation-z={Math.PI / 2} position={[0, 0, 0.3]}>
        <cylinderGeometry args={[R_VIAL_TUBO, R_VIAL_TUBO, LARGO_VIAL, alta ? 32 : 16, 1]} />
      </mesh>
      <mesh ref={burbujaRef} geometry={gBurbuja} material={m.burbuja} position={[0, R_VIAL_TUBO * 0.18, 0.36]} />
      {escala && (
        <mesh material={escala.mat} position={[0, 0, 0.3 + R_VIAL_TUBO + 0.005]}>
          <planeGeometry args={[LARGO_VIAL, 0.62]} />
        </mesh>
      )}
      {/* vidrio del vial: reflejo */}
      <mesh material={m.vidrio} rotation-z={Math.PI / 2} position={[0, 0, 0.3]} renderOrder={11}>
        <cylinderGeometry args={[R_VIAL_TUBO + 0.04, R_VIAL_TUBO + 0.04, LARGO_VIAL + 0.1, alta ? 32 : 16, 1, true]} />
      </mesh>
      {/* tapones de latón */}
      {[-1, 1].map((s) => (
        <mesh key={s} material={m.latonPulido} rotation-z={Math.PI / 2} position={[s * (LARGO_VIAL / 2 + 0.25), 0, 0.3]}>
          <cylinderGeometry args={[R_VIAL_TUBO + 0.08, R_VIAL_TUBO + 0.08, 0.5, alta ? 24 : 12]} />
        </mesh>
      ))}
    </group>
  );
}

// ───────────────────────────── soporte y peana ─────────────────────────────

/** Lo que gira con el tablero: la lengüeta de latón que baja al eje. */
export function Lengueta({ m }: { m: MaterialesGalton }) {
  return (
    <mesh material={m.laton} position={[0, (Y_INF_EXT + Y_PIVOTE) / 2 - 0.25, -0.1]} castShadow geometry={cajaRedondeada(2.0, Y_INF_EXT - Y_PIVOTE + 1.3, 0.7, 0.12, 2)} userData={{ pieza: 'eje' }} />
  );
}

/** Lo que NO gira: peana, soporte de fundición y pomo del eje (en coordenadas del mundo, con el eje en el origen). */
export function Soporte({ m, calidad }: { m: MaterialesGalton; calidad: Calidad }) {
  const alta = calidad === 'alta';
  const gPomo = useMemo(() => {
    // pomo moleteado: torno con estrías finas (el moleteado se sugiere con el perfil escalonado)
    const g = tornear([[0, 0], [0.95, 0], [1.0, 0.08], [1.0, 0.5], [0.92, 0.6], [0.55, 0.66], [0.5, 0.9], [0, 0.9]], alta ? 40 : 20);
    g.rotateX(Math.PI / 2);
    return g;
  }, [alta]);
  useEffect(() => () => gPomo.dispose(), [gPomo]);
  const altoSoporte = 1.6 + 0.9;
  return (
    <group>
      {/* peana de nogal */}
      <mesh userData={{ pieza: 'peana' }} material={m.nogal} position={[0, -1.6 - ALTO_PEANA / 2, -0.1]} castShadow receiveShadow geometry={cajaRedondeada(36, ALTO_PEANA, 13, 0.5, 4)} />
      {/* soporte de fundición: dos orejas, delante y detrás de la lengüeta */}
      {[1, -1].map((s) => (
        <mesh key={s} userData={{ pieza: 'eje' }} material={m.fundicion} position={[0, -1.6 + altoSoporte / 2, -0.1 + s * 0.75]} castShadow receiveShadow
          geometry={cajaRedondeada(3.4, altoSoporte, 0.7, 0.2, 3)} />
      ))}
      <mesh userData={{ pieza: 'eje' }} material={m.fundicion} position={[0, -1.6 + 0.25, -0.1]} castShadow geometry={cajaRedondeada(4.4, 0.5, 3.0, 0.15, 2)} />
      {/* pomo del eje */}
      <mesh userData={{ pieza: 'eje' }} geometry={gPomo} material={m.latonPulido} position={[0, 0, -0.1 + 0.75 + 0.35]} castShadow />
    </group>
  );
}

/** Mesa de estudio y fondo con caída de luz (no recibe luz: es el «ciclorama»). */
export function Estudio({ m, calidad }: { m: MaterialesGalton; calidad: Calidad }) {
  const tex = useMemo(() => {
    if (typeof document === 'undefined') return null;
    const S = calidad === 'alta' ? 1024 : 512;
    const c = crearLienzo(S, S), ctx = c.getContext('2d')!;
    const g = ctx.createRadialGradient(S * 0.5, S * 0.42, S * 0.02, S * 0.5, S * 0.5, S * 0.62);
    g.addColorStop(0, '#2a3446'); g.addColorStop(0.45, '#151b26'); g.addColorStop(1, '#07090d');
    ctx.fillStyle = g; ctx.fillRect(0, 0, S, S);
    return texturaDeLienzo(c);
  }, [calidad]);
  const matFondo = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, color: '#ffffff', name: 'galton-ciclorama', fog: false }), [tex]);
  useEffect(() => () => { tex?.dispose(); matFondo.dispose(); }, [tex, matFondo]);
  return (
    <group>
      <mesh rotation-x={-Math.PI / 2} position={[0, 0, 0]} material={m.mesa} receiveShadow>
        <planeGeometry args={[400, 240]} />
      </mesh>
      <mesh position={[0, 60, -90]} material={matFondo}>
        <planeGeometry args={[420, 260]} />
      </mesh>
    </group>
  );
}
