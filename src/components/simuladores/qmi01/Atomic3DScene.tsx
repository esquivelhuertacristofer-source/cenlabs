"use client";
/**
 * Q1 · Construcción atómica — escena 3D (R3F + kit) con TRES vistas conmutables.
 *
 * «ÁTOMO» (la de inicio): escenario vivo donde se forja el átomo — ver ModoAtomo.tsx.
 *
 * «ORBITALES» (el modelo cuántico). Todo sale de qmi01/orbitales.ts:
 *   · Nube de puntos de cada orbital ocupado (1s, 2s, 2pₓ, 2p_y, 2p_z): muestras
 *     independientes de |ψ|² hidrogenoide en la variable reducida ρ = Z_eff·r/a₀,
 *     escaladas por a₀/Z_eff con la Z_eff de Slater que lleva el RELOJ (una sola
 *     fuente para escena y gráfica). Se dibujan ocupación × (puntos por electrón):
 *     la densidad de puntos ES la densidad electrónica.
 *   · Color = FASE de ψ en cada punto (+ ámbar / − azul): lóbulos del 2p y nodo
 *     radial del 2s.
 *   · «Cortar la nube»: se descarta el semiespacio z > 0 y la cara z = 0 muestra
 *     |ψ|² EXACTA (evaluada en el sombreador con las mismas fórmulas), en escala
 *     logarítmica, con anillos cada 50 pm: el nodo del 2s aparece como un anillo
 *     oscuro y el plano z = 0 es el plano nodal del 2p_z.
 *   · «Contorno 90 %»: superficie de isodensidad que encierra el 90 % de la
 *     probabilidad de cada orbital (esferas del 1s y 2s, lóbulos del 2p por torno).
 *   · Núcleo: nucleones empaquetados (red FCC) AMPLIADOS; el rótulo da el aumento
 *     y «escala real» lo encoge hasta su tamaño verdadero, R = 1,2 fm·A^(1/3).
 *   · Los puntos titilan (cada punto = una posible medida de posición); |ψ|² de un
 *     estado estacionario NO cambia con el tiempo y la nube no gira.
 *   · «Volumen» (por defecto en calidad alta): la misma |ψ|² integrada a lo largo de
 *     cada rayo (raymarching en el sombreador), color por fase, brillo ∝ (densidad
 *     relativa a la de valencia)^0,85 y 1 − e^(−k·∫) como respuesta: una nebulosa
 *     que con un solo electrón ya es una esfera de luz con su gradiente real. La ψ
 *     del sombreador la GENERA glslOrbitales.ts desde las mismas expresiones que la
 *     prueba compara con psi().
 *
 * «BOHR (1913)» — histórico, esquema de libro: capas K y L planas, radios y
 *   velocidades NO a escala (se rotula). Los electrones dejan una estela.
 *
 * Inestabilidad: a nivel 2 el núcleo vibra; a nivel 3 se desintegra. La corteza no.
 */
import React, { useEffect, useLayoutEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import type { OrbitControls as OrbitControlsImpl } from 'three-stdlib';
import { EffectComposer, Bloom, ToneMapping } from '@react-three/postprocessing';
import { LabCanvas, Etiqueta, useMateriales, useCalidad, esfera, toro, tornear, geoCache, type Calidad } from '../_kit';
import {
  A0_PM, ORBITALES, isodensidad, miles, muestrearOrbital, radioNuclearFm,
  type EstadoAtomo, type IdOrbital,
} from './orbitales';
import type { RelojAtomo } from './reloj';
import { glslPsi } from './glslOrbitales';
import { sitiosNucleo, esProton, radioNucleonDibujado, radioCumulo, materialNucleon, COL_PROTON, COL_NEUTRON, type V3 } from './nucleo';
import ModoAtomoVivo, { radioEncuadreAtomo, ENCUADRE_ATOMO, semiAnchoAtomo } from './ModoAtomo';

export type ModoAtomo = 'atomo' | 'cuantico' | 'bohr';
export type VistaNube = 'puntos' | 'volumen';

export interface RefsDomAtomo {
  /** barra de escala de 100 pm (su ancho se fija cada cuadro) */
  regla?: React.RefObject<HTMLDivElement | null>;
  /** texto del aumento del núcleo («×2 800») */
  aumento?: React.RefObject<HTMLSpanElement | null>;
  /** marca del núcleo a escala real (se muestra cuando ya encogió) */
  marcaNucleo?: React.RefObject<HTMLDivElement | null>;
  /** rótulo flotante del fotón / ionización (modo Átomo) */
  foton?: React.RefObject<HTMLDivElement | null>;
}

interface Atomic3DSceneProps {
  protons: number;
  neutrons: number;
  electrons: number;
  instability: number;
  modo?: ModoAtomo;
  estado?: EstadoAtomo;
  reloj?: RelojAtomo;
  corte?: boolean;
  contorno?: boolean;
  escalaReal?: boolean;
  pausa?: boolean;
  foco?: IdOrbital | null;
  refsDom?: RefsDomAtomo;
  /** Orbitales: nube de puntos o volumen; null = según la calidad (alta → volumen) */
  nube?: VistaNube | null;
  /** avisa de la calidad gráfica efectiva (para el valor por defecto del DOM) */
  onCalidad?: (c: Calidad) => void;
}

// ───────────────────────────── constantes ─────────────────────────────

/** Modelo cuántico: unidades de escena por radio de Bohr (1 a₀ = 52,9 pm). */
export const U_A0 = 0.75;
/** Colores de fase de ψ (convención de libro: + y − con colores opuestos). */
export const COL_FASE_POS = '#ffb347';
export const COL_FASE_NEG = '#4fb6ff';

// Bohr (esquema)
const R_NUCLEON = 0.4;
const R_K = 2.7;
const R_L = 4.5;
const R_ELECTRON = 0.14;
const CAP_K = 2;
const CAP_L = 8;
const MAX_VISIBLES = 160;
// Cuántico: nucleón dibujado (el núcleo de ¹²C mide ~0,1 u ≈ 0,14 a₀: ampliado ×2 800)
const R_NUCLEON_Q = 0.042;

// ───────────────────────────── núcleo ─────────────────────────────

function Nucleo({ protons, neutrons, instability, rBase, escala }: {
  protons: number; neutrons: number; instability: number; rBase: number;
  /** factor de escala del grupo (lo anima «escala real»); 1 si no se da */
  escala?: React.RefObject<number>;
}) {
  const calidad = useCalidad();
  const total = Math.min(MAX_VISIBLES, protons + neutrons);
  const r = radioNucleonDibujado(total, rBase);
  const sitios = useMemo(() => sitiosNucleo(total, r), [total, r]);
  const pVis = Math.round((protons / Math.max(1, protons + neutrons)) * total);
  const geo = esfera(r, calidad === 'alta' ? 28 : 18);
  const matP = useMemo(() => materialNucleon(COL_PROTON, calidad === 'alta'), [calidad]);
  const matN = useMemo(() => materialNucleon(COL_NEUTRON, calidad === 'alta'), [calidad]);
  useEffect(() => () => { matP.dispose(); matN.dispose(); }, [matP, matN]);
  const grupo = useRef<THREE.Group>(null);
  const expl = useRef(0);

  useFrame((s, dt) => {
    const g = grupo.current; if (!g) return;
    g.scale.setScalar(escala ? escala.current : 1);
    const t = s.clock.elapsedTime;
    const destruye = instability >= 3;
    expl.current = destruye ? Math.min(1, expl.current + dt * 0.5) : Math.max(0, expl.current - dt * 2);
    const e = expl.current;
    const vib = instability >= 2 ? 0.018 * (instability - 1) : 0;
    for (let i = 0; i < g.children.length; i++) {
      const hijo = g.children[i];
      const b = sitios[i]; if (!b) continue;
      const fase = i * 1.7;
      const j = vib * Math.sin(t * 38 + fase);
      const k = 1 + e * 6 + j;
      hijo.position.set(b[0] * k, b[1] * k, b[2] * k);
      hijo.scale.setScalar(1 - 0.8 * e);
    }
  });

  return (
    <group ref={grupo}>
      {sitios.map((p, i) => (
        <mesh key={i} geometry={geo} material={esProton(i, total, pVis) ? matP : matN} position={p} castShadow={false} />
      ))}
    </group>
  );
}

// ───────────────────────────── fondo y cámara ─────────────────────────────

/** Fondo de estudio: degradado radial oscuro (con tramado para que no haga bandas). */
function FondoAtomo() {
  const scene = useThree((s) => s.scene);
  useLayoutEffect(() => {
    const c = document.createElement('canvas');
    c.width = 512; c.height = 512;
    const g = c.getContext('2d');
    if (!g) return;
    const grad = g.createRadialGradient(256, 240, 10, 256, 256, 380);
    grad.addColorStop(0, '#1d3247');
    grad.addColorStop(0.5, '#122233');
    grad.addColorStop(1, '#070e17');
    g.fillStyle = grad; g.fillRect(0, 0, 512, 512);
    const img = g.getImageData(0, 0, 512, 512);
    let s = 12345;
    for (let i = 0; i < img.data.length; i += 4) {
      s = (s * 1103515245 + 12345) & 0x7fffffff;
      const d = ((s >> 16) & 3) - 1.5;
      img.data[i] += d; img.data[i + 1] += d; img.data[i + 2] += d;
    }
    g.putImageData(img, 0, 0);
    const tex = new THREE.CanvasTexture(c);
    tex.colorSpace = THREE.SRGBColorSpace;
    const antes = scene.background;
    scene.background = tex;
    return () => { scene.background = antes; tex.dispose(); };
  }, [scene]);
  return null;
}

interface Vista { centro: V3; semiAlto: number; semiAncho: number; dir: V3 }
const VISTAS: Record<ModoAtomo, Vista> = {
  // Átomo: algo desde arriba, para leer el plinto y las fuentes; el alto se ajusta al radio
  atomo: { centro: [0, ENCUADRE_ATOMO.centroY, 0], semiAlto: ENCUADRE_ATOMO.semiAlto, semiAncho: semiAnchoAtomo(3), dir: [0, ENCUADRE_ATOMO.dirY, 1] },
  // 3/4 desde +z: se ven los tres ejes y la cara z = 0 del corte casi de frente
  cuantico: { centro: [0, 0, 0], semiAlto: 4.0, semiAncho: 4.0, dir: [0.58, 0.42, 1] },
  bohr: { centro: [-0.3, 0.75, 0], semiAlto: 6.1, semiAncho: 6.0, dir: [0, 0.07, 1] },
};

/**
 * Vista del modo Átomo para un átomo de radio exterior R (esquemático): la cámara
 * compensa sólo parte del cambio de tamaño (∝ R^0,65), así que un catión se ve
 * más pequeño y un anión más grande, pero ninguno desaparece ni se sale.
 */
function vistaAtomo(R: number): Vista {
  const v = VISTAS.atomo;
  const k = Math.pow(Math.max(1, R) / 3, 0.65);
  // en lienzos estrechos manda el ancho: el átomo cabe con margen y las fuentes se acercan (ModoAtomo.xFuentes)
  return { ...v, semiAlto: Math.min(ENCUADRE_ATOMO.semiAltoMax, Math.max(ENCUADRE_ATOMO.semiAltoMin, v.semiAlto * k)), semiAncho: semiAnchoAtomo(R) };
}

/** Encuadre por modo (y por tamaño del átomo en «Átomo»), con transición suave. */
function CamaraAtomo({ modo, radio }: { modo: ModoAtomo; radio: number }) {
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;
  const anim = useRef<{ t: number; dur: number; p0: THREE.Vector3; p1: THREE.Vector3; o0: THREE.Vector3; o1: THREE.Vector3 } | null>(null);
  const modoPrevio = useRef<ModoAtomo | null>(null);
  useLayoutEffect(() => {
    const v = modo === 'atomo' ? vistaAtomo(radio) : VISTAS[modo];
    const aspect = size.width / Math.max(1, size.height);
    const fovV = THREE.MathUtils.degToRad(camera.fov);
    const fovH = 2 * Math.atan(Math.tan(fovV / 2) * aspect);
    const dist = Math.max(v.semiAlto / Math.tan(fovV / 2), v.semiAncho / Math.tan(fovH / 2)) * 1.04;
    const o1 = new THREE.Vector3(...v.centro);
    const primera = !controls || modoPrevio.current === null;
    const cambiaModo = !primera && modoPrevio.current !== modo;
    // al cambiar de modo, su dirección de vista; si sólo cambia el tamaño, la que el alumno dejó
    const dir = primera || cambiaModo
      ? new THREE.Vector3(...v.dir).normalize()
      : camera.position.clone().sub(controls!.target).normalize();
    const p1 = o1.clone().addScaledVector(dir, dist);
    if (primera) {
      camera.position.copy(p1);
      camera.lookAt(o1);
      if (controls) { controls.target.copy(o1); controls.update(); modoPrevio.current = modo; }
      anim.current = null;
      return;
    }
    modoPrevio.current = modo;
    anim.current = { t: 0, dur: cambiaModo ? 0.9 : 0.75, p0: camera.position.clone(), p1, o0: controls!.target.clone(), o1 };
  }, [modo, radio, size.width, size.height, camera, controls]);
  useFrame((_, dt) => {
    const a = anim.current;
    if (!a || !controls) return;
    a.t = Math.min(1, a.t + dt / a.dur);
    const k = a.t * a.t * (3 - 2 * a.t);
    controls.target.lerpVectors(a.o0, a.o1, k);
    camera.position.lerpVectors(a.p0, a.p1, k);
    controls.update();
    if (a.t >= 1) anim.current = null;
  });
  return null;
}

// ───────────────────────────── sombreadores ─────────────────────────────

const VERT_PUNTOS = /* glsl */ `
  uniform float uEscala;
  uniform float uTam;
  uniform float uPx;
  uniform float uTiempo;
  uniform float uParpadeo;
  uniform float uDist;
  uniform float uProf;
  attribute float aSigno;
  attribute float aFase;
  attribute float aTam;
  varying float vSigno;
  varying float vZ;
  varying float vA;
  void main() {
    vec3 p = position * uEscala;
    vec4 w = modelMatrix * vec4(p, 1.0);
    vZ = w.z;
    vec4 mv = viewMatrix * w;
    gl_Position = projectionMatrix * mv;
    gl_PointSize = max(1.6, uTam * aTam * uPx / max(0.01, -mv.z));
    // titileo: cada punto aparece y se apaga con su propia fase (posibles medidas)
    float f = fract(uTiempo * 0.32 + aFase);
    float env = smoothstep(0.0, 0.14, f) * (1.0 - smoothstep(0.62, 1.0, f));
    vA = mix(1.0, 0.25 + 0.75 * env, uParpadeo);
    // señal de profundidad: lo que queda detrás del núcleo se ve más tenue
    vA *= 1.0 - 0.5 * smoothstep(-uProf, uProf * 1.6, -mv.z - uDist);
    vSigno = aSigno;
  }
`;

const FRAG_PUNTOS = /* glsl */ `
  uniform vec3 uColPos;
  uniform vec3 uColNeg;
  uniform float uAlfa;
  uniform float uCorte;
  varying float vSigno;
  varying float vZ;
  varying float vA;
  void main() {
    if (uCorte > 0.5 && vZ > 0.0) discard;
    vec2 c = gl_PointCoord - 0.5;
    float d2 = dot(c, c);
    if (d2 > 0.25) discard;
    float a = (1.0 - smoothstep(0.05, 0.25, d2)) * uAlfa * vA;
    gl_FragColor = vec4(vSigno > 0.0 ? uColPos : uColNeg, a);
    #include <colorspace_fragment>
  }
`;

const VERT_CONTORNO = /* glsl */ `
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    vN = normalize(mat3(modelMatrix) * normal);
    vV = cameraPosition - w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

const FRAG_CONTORNO = /* glsl */ `
  uniform vec3 uCol;
  uniform float uAlfa;
  uniform float uCorte;
  varying vec3 vN;
  varying vec3 vV;
  varying vec3 vW;
  void main() {
    if (uCorte > 0.5 && vW.z > 0.0) discard;
    float f = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
    gl_FragColor = vec4(uCol, (0.05 + 0.5 * f) * uAlfa);
    #include <colorspace_fragment>
  }
`;

const VERT_CARA = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;

/**
 * Cara del corte (plano z = 0): |ψ|² EXACTA de los orbitales visibles, con la ψ
 * GENERADA por glslOrbitales.ts (las mismas expresiones que prueba jest). Escala logarítmica de uDec décadas bajo
 * la densidad de referencia (el máximo de la capa de valencia; el 1s, más denso, se
 * blanquea); color = mezcla de fases ponderada por la densidad; líneas: contorno
 * del 90 % y anillos cada 50 pm.
 */
const FRAG_CARA = /* glsl */ `
  uniform float uZ[5];
  uniform float uOcc[5];
  uniform float uVis[5];
  uniform float uT[5];
  uniform float uUA0;
  uniform float uRef;
  uniform float uDec;
  uniform float uR;
  uniform float uAnillo;
  uniform float uContorno;
  uniform vec3 uColPos;
  uniform vec3 uColNeg;
  uniform vec3 uBase;
  varying vec3 vW;
  ${glslPsi()}
  void main() {
    float rr = length(vW.xy);
    if (rr > uR) discard;
    vec3 q = vec3(vW.xy, 0.0) / uUA0;
    float tot = 0.0;
    vec3 col = vec3(0.0);
    float linea = 0.0;
    for (int i = 0; i < 5; i++) {
      if (uVis[i] < 0.5 || uOcc[i] < 0.5 || uZ[i] <= 0.0) continue;
      float p = psiOrb(i, q, uZ[i]);
      float d = uOcc[i] * p * p;
      tot += d;
      col += d * (p >= 0.0 ? uColPos : uColNeg);
      if (uContorno > 0.5) {
        float g = log(max(p * p, 1e-30) / uT[i]);
        float w = fwidth(g);
        linea = max(linea, 1.0 - smoothstep(0.6, 1.6, abs(g) / max(w, 1e-6)));
      }
    }
    vec3 fase = tot > 0.0 ? col / tot : uColPos;
    float Ir = 1.0 + log(max(tot, 1e-30) / uRef) / (uDec * 2.302585);
    float I = clamp(Ir, 0.0, 1.0);
    // la mezcla es en espacio lineal: I^2,8 ≈ brillo percibido I^1,3 tras la salida sRGB
    vec3 c = mix(uBase, fase, pow(I, 2.8));
    // por encima de la referencia (el 1s, mucho más denso que la valencia) se blanquea
    c = mix(c, vec3(1.0, 0.96, 0.88), clamp(Ir - 1.0, 0.0, 1.0) * 0.55);
    // anillos de distancia cada 50 pm (finos, sutiles)
    float an = rr / uAnillo;
    float fa = abs(fract(an + 0.5) - 0.5) / max(fwidth(an), 1e-6);
    c = mix(c, vec3(0.62, 0.72, 0.8), (1.0 - smoothstep(0.4, 1.3, fa)) * 0.18 * step(0.5, an));
    // contorno del 90 %
    c = mix(c, vec3(0.96, 0.98, 1.0), linea * 0.85);
    // borde de la cara
    float borde = smoothstep(uR * 0.985, uR * 0.995, rr);
    c = mix(c, vec3(0.55, 0.64, 0.72), borde);
    gl_FragColor = vec4(c, 1.0);
    #include <colorspace_fragment>
  }
`;

/**
 * Volumen (raymarching): para cada píxel, el rayo atraviesa la esfera que contiene
 * la nube y suma la emisión de |ψ|² de los orbitales visibles en PASOS muestras
 * (con desfase aleatorio por píxel, para que no haga bandas). Emisión e = (ρ/ρ_ref)^γ
 * (ρ_ref = suma de los picos de la capa de valencia, γ = 0,85, tope 5), color = mezcla de fases
 * ponderada por la densidad, respuesta I = 1 − e^(−k·∫e ds). Con «cortar» sólo se
 * integra el semiespacio z ≤ 0 y el rayo que choca con la cara opaca se descarta.
 */
const VERT_VOL = /* glsl */ `
  varying vec3 vW;
  void main() {
    vec4 w = modelMatrix * vec4(position, 1.0);
    vW = w.xyz;
    gl_Position = projectionMatrix * viewMatrix * w;
  }
`;
const fragVolumen = (pasos: number) => /* glsl */ `
  #define PASOS ${pasos}
  uniform float uZ[5];
  uniform float uOcc[5];
  uniform float uUA0;
  uniform float uRef;
  uniform float uR;
  uniform float uK;
  uniform float uGam;
  uniform float uCorte;
  uniform float uRcara;
  uniform vec3 uColPos;
  uniform vec3 uColNeg;
  varying vec3 vW;
  ${glslPsi()}
  float azar12(vec2 p) {
    vec3 p3 = fract(vec3(p.xyx) * 0.1031);
    p3 += dot(p3, p3.yzx + 33.33);
    return fract((p3.x + p3.y) * p3.z);
  }
  void main() {
    vec3 ro = cameraPosition;
    vec3 rd = normalize(vW - ro);
    float b = dot(ro, rd);
    float c = dot(ro, ro) - uR * uR;
    float h = b * b - c;
    if (h <= 0.0) discard;
    h = sqrt(h);
    float t0 = max(0.0, -b - h);
    float t1 = -b + h;
    if (uCorte > 0.5) {
      if (ro.z > 0.0) {
        if (rd.z > -1e-5) discard;
        float tp = -ro.z / rd.z;
        vec3 pp = ro + rd * tp;
        if (length(pp.xy) < uRcara) discard;
        t0 = max(t0, tp);
      } else if (rd.z > 1e-5) {
        t1 = min(t1, -ro.z / rd.z);
      }
      if (t1 <= t0) discard;
    }
    float dt = (t1 - t0) / float(PASOS);
    float t = t0 + dt * azar12(gl_FragCoord.xy);
    vec3 acc = vec3(0.0);
    float accE = 0.0;
    float tope = 4.6 / max(uK * dt, 1e-6); // con I > 0,99 ya no cambia nada: se corta el rayo
    for (int s = 0; s < PASOS; s++) {
      if (accE > tope) break;
      vec3 q = (ro + rd * t) / uUA0;
      float tot = 0.0;
      vec3 col = vec3(0.0);
      for (int i = 0; i < 5; i++) {
        if (uOcc[i] < 0.5) continue;
        float p = psiOrb(i, q, uZ[i]);
        float d = uOcc[i] * p * p;
        tot += d;
        col += d * (p >= 0.0 ? uColPos : uColNeg);
      }
      if (tot > 0.0) {
        float e = min(pow(tot / uRef, uGam), 5.0);
        acc += (col / tot) * e;
        accE += e;
      }
      t += dt;
    }
    float I = 1.0 - exp(-uK * accE * dt);
    vec3 fase = accE > 0.0 ? acc / accE : uColPos;
    // donde la nube satura (el 1s, muy denso) el color se blanquea un poco
    fase = mix(fase, vec3(1.0, 0.95, 0.86), smoothstep(0.85, 1.0, I) * 0.3);
    gl_FragColor = vec4(fase * (0.45 + 0.85 * I), I);
    #include <colorspace_fragment>
  }
`;
/** Radio reducido ρ hasta el que se integra el volumen (fuera, la emisión es < 2 % de la de valencia). */
const RHO_VOL: number[] = [4.5, 11, 11, 11, 11];
/** exponente de la emisión: e = (ρ/ρ_ref)^γ */
const GAMMA_VOL = 0.85;

// ───────────────────────────── modelo cuántico ─────────────────────────────

/** Normalización de |ψ|² (a₀⁻³) sobre la densidad reducida: 1s 1/π; n = 2 1/32π. */
const NORMA: number[] = [1 / Math.PI, 1 / (32 * Math.PI), 1 / (32 * Math.PI), 1 / (32 * Math.PI), 1 / (32 * Math.PI)];
/**
 * Máximo de |ψ|²/Z³ de cada orbital FUERA del núcleo (referencia de la escala log):
 * 1s en r = 0; 2s el de su lóbulo exterior (ρ = 4); 2p el de sus lóbulos (ρ = 2).
 */
const PICO: number[] = [1 / Math.PI, (4 * Math.exp(-4)) / (32 * Math.PI), (4 * Math.exp(-2)) / (32 * Math.PI), (4 * Math.exp(-2)) / (32 * Math.PI), (4 * Math.exp(-2)) / (32 * Math.PI)];
const Z_MIN_VISIBLE = 0.08;


function geoLobulo(segs: number) {
  return geoCache(`qmi01-lobulo2p:${segs}`, () => tornear(isodensidad('2pz').perfil, segs));
}

interface PropsCuantico {
  estado: EstadoAtomo;
  reloj: RelojAtomo;
  corte: boolean;
  contorno: boolean;
  foco: IdOrbital | null;
  pausa: boolean;
  volumen: boolean;
}

function NubesCuanticas({ estado, reloj, corte, contorno, foco, pausa, volumen }: PropsCuantico) {
  const calidad = useCalidad();
  const alta = calidad === 'alta';
  const ppe = alta ? 2600 : 1000; // puntos por electrón
  const gl = useThree((s) => s.gl);
  const tiempo = useRef(0);
  const tmp = useMemo(() => new THREE.Vector2(), []);

  // ── nubes: geometría (muestras fijas en ρ) + material por orbital ──
  const nubes = useMemo(() => ORBITALES.map((o, i) => {
    const m = muestrearOrbital(o.id, 2 * ppe, 101 + 7919 * i);
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(m.pos, 3));
    g.setAttribute('aSigno', new THREE.BufferAttribute(m.signo, 1));
    const fase = new Float32Array(m.n), tam = new Float32Array(m.n);
    let s = 977 + i;
    const rnd = () => { s = (s * 16807) % 2147483647; return s / 2147483647; };
    for (let k = 0; k < m.n; k++) { fase[k] = rnd(); tam[k] = 0.65 + 0.7 * rnd(); }
    g.setAttribute('aFase', new THREE.BufferAttribute(fase, 1));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    // la caja envolvente la mueve el sombreador (uEscala): sin recorte por tronco
    g.boundingSphere = new THREE.Sphere(new THREE.Vector3(), 1e4);
    const mat = new THREE.ShaderMaterial({
      vertexShader: VERT_PUNTOS, fragmentShader: FRAG_PUNTOS, transparent: true, depthWrite: false,
      uniforms: {
        uEscala: { value: 1 }, uTam: { value: alta ? 0.034 : 0.046 }, uPx: { value: 600 },
        uTiempo: { value: 0 }, uParpadeo: { value: 1 }, uDist: { value: 15 }, uProf: { value: 2 }, uColPos: { value: new THREE.Color(COL_FASE_POS) },
        uColNeg: { value: new THREE.Color(COL_FASE_NEG) }, uAlfa: { value: 0.6 }, uCorte: { value: 0 },
      },
    });
    return { id: o.id, g, mat };
  }), [ppe, alta]);
  useEffect(() => () => nubes.forEach((n) => { n.g.dispose(); n.mat.dispose(); }), [nubes]);
  const refsPuntos = useRef<(THREE.Object3D | null)[]>([]);

  // ── contornos del 90 % ──
  const iso = useMemo(() => ({ s1: isodensidad('1s'), s2: isodensidad('2s'), p: isodensidad('2pz') }), []);
  const lobulo = geoLobulo(alta ? 72 : 40);
  const geoEsf = esfera(1, alta ? 56 : 32);
  const matsContorno = useMemo(() => ORBITALES.map(() => {
    const mk = (c: string) => new THREE.ShaderMaterial({
      vertexShader: VERT_CONTORNO, fragmentShader: FRAG_CONTORNO, transparent: true, depthWrite: false, side: THREE.DoubleSide,
      uniforms: { uCol: { value: new THREE.Color(c) }, uAlfa: { value: 1 }, uCorte: { value: 0 } },
    });
    return { pos: mk(COL_FASE_POS), neg: mk(COL_FASE_NEG) };
  }), []);
  useEffect(() => () => matsContorno.forEach((m) => { m.pos.dispose(); m.neg.dispose(); }), [matsContorno]);
  const refsContorno = useRef<(THREE.Group | null)[]>([]);
  const refsRotulo = useRef<(THREE.Group | null)[]>([]);

  // ── cara del corte ──
  const matCara = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_CARA, fragmentShader: FRAG_CARA,
    uniforms: {
      uZ: { value: [1, 1, 1, 1, 1] }, uOcc: { value: [0, 0, 0, 0, 0] }, uVis: { value: [1, 1, 1, 1, 1] }, uT: { value: [1, 1, 1, 1, 1] },
      uUA0: { value: U_A0 }, uRef: { value: 1 }, uDec: { value: 2.4 }, uR: { value: 4 }, uAnillo: { value: (50 / A0_PM) * U_A0 },
      uContorno: { value: 0 }, uColPos: { value: new THREE.Color(COL_FASE_POS) }, uColNeg: { value: new THREE.Color(COL_FASE_NEG) },
      uBase: { value: new THREE.Color('#0c1824') },
    },
  }), []);
  useEffect(() => () => matCara.dispose(), [matCara]);
  const geoCara = useMemo(() => new THREE.CircleGeometry(1, 160), []);
  useEffect(() => () => geoCara.dispose(), [geoCara]);
  const refCara = useRef<THREE.Mesh>(null);

  // ── volumen ──
  const matVol = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VERT_VOL, fragmentShader: fragVolumen(alta ? 52 : 36), transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.BackSide,
    uniforms: {
      uZ: { value: [1, 1, 1, 1, 1] }, uOcc: { value: [0, 0, 0, 0, 0] }, uUA0: { value: U_A0 }, uRef: { value: 1 }, uR: { value: 4 },
      uK: { value: 1 }, uGam: { value: GAMMA_VOL }, uCorte: { value: 0 }, uRcara: { value: 0 },
      uColPos: { value: new THREE.Color(COL_FASE_POS) }, uColNeg: { value: new THREE.Color(COL_FASE_NEG) },
    },
  }), [alta]);
  useEffect(() => () => matVol.dispose(), [matVol]);
  const geoVol = esfera(1, 48);
  const refVol = useRef<THREE.Mesh>(null);

  // radios de contorno por orbital en ρ (para colocar los rótulos)
  const rhoRotulo = useMemo(() => ORBITALES.map((o) => (o.l === 1 ? iso.p.perfil[iso.p.perfil.length - 1][1] : o.id === '2s' ? iso.s2.radios[2] : iso.s1.radios[0])), [iso]);

  useFrame((state, dt) => {
    if (!pausa) tiempo.current += dt;
    const cam = state.camera as THREE.PerspectiveCamera;
    gl.getDrawingBufferSize(tmp);
    const uPx = tmp.y / (2 * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
    const uDist = cam.position.length(); // el objetivo es el núcleo (sin paneo)
    let ref = 0, ref1s = 0, radioCara = 0;
    const u = matCara.uniforms;
    // el rótulo «1s» sólo cuando es la capa externa (si no, cae en el centro denso)
    const hayN2 = estado.orbitales.some((o, i) => i > 0 && o.ligado && (!foco || foco === o.def.id));
    for (let i = 0; i < ORBITALES.length; i++) {
      const o = estado.orbitales[i];
      const z = reloj.zEff[i];
      const visible = o.ligado && z > Z_MIN_VISIBLE;
      const enFoco = !foco || foco === o.def.id;
      const esc = U_A0 / Math.max(Z_MIN_VISIBLE, z);
      // nube
      const pts = refsPuntos.current[i];
      if (pts) {
        pts.visible = visible && !volumen;
        const mu = nubes[i].mat.uniforms;
        mu.uEscala.value = esc;
        mu.uPx.value = uPx;
        mu.uDist.value = uDist;
        mu.uProf.value = Math.max(0.4, rhoRotulo[i] * esc * 0.6);
        mu.uTiempo.value = tiempo.current;
        mu.uParpadeo.value = pausa ? 0 : 1;
        mu.uAlfa.value = enFoco ? (alta ? 0.55 : 0.7) : 0.06;
        mu.uCorte.value = corte ? 1 : 0;
        nubes[i].g.setDrawRange(0, o.ocupacion * ppe);
      }
      // contorno
      const gc = refsContorno.current[i];
      if (gc) {
        gc.visible = contorno && visible;
        gc.scale.setScalar(esc);
        // un orbital con 1 e⁻ tiene la mitad de densidad: su burbuja, más tenue (Hund se ve)
        const aC = (enFoco ? 1 : 0.12) * (o.ocupacion === 1 ? 0.55 : 1);
        matsContorno[i].pos.uniforms.uAlfa.value = aC;
        matsContorno[i].neg.uniforms.uAlfa.value = aC;
        matsContorno[i].pos.uniforms.uCorte.value = corte ? 1 : 0;
        matsContorno[i].neg.uniforms.uCorte.value = corte ? 1 : 0;
      }
      // rótulo en la punta del contorno
      const gr = refsRotulo.current[i];
      if (gr) {
        gr.visible = visible && enFoco && (i > 0 || !hayN2);
        const d = rhoRotulo[i] * esc + 0.18;
        const ax = o.def.eje;
        if (ax === 0) gr.position.set(d, 0, 0);
        else if (ax === 1) gr.position.set(0, d, 0);
        else if (ax === 2) gr.position.set(0, 0, d);
        else if (o.def.id === '2s') gr.position.set(-d * 0.7071, -d * 0.7071, 0);
        else gr.position.set(d * 0.7071, -d * 0.7071, 0);
      }
      // cara del corte
      u.uZ.value[i] = Math.max(0, z);
      u.uOcc.value[i] = visible ? o.ocupacion : 0;
      u.uVis.value[i] = enFoco ? 1 : 0;
      u.uT.value[i] = NORMA[i] * Math.pow(Math.max(z, 1e-3), 3) * (i === 0 ? iso.s1.umbral : i === 1 ? iso.s2.umbral : iso.p.umbral);
      if (visible && enFoco) {
        const pico = o.ocupacion * PICO[i] * Math.pow(z, 3);
        if (i === 0) ref1s = pico; else ref = Math.max(ref, pico);
        radioCara = Math.max(radioCara, (rhoRotulo[i] / z) * U_A0);
      }
    }
    u.uRef.value = ref > 0 ? ref : ref1s > 0 ? ref1s * 0.2 : 1;
    u.uDec.value = ref > 0 ? 2.1 : 2.6;
    // la cara abarca el contorno del 90 % con holgura (el resto de la nube sigue en 3D)
    u.uR.value = Math.min(7.5, Math.max(0.9, radioCara * 1.15));
    u.uContorno.value = contorno ? 1 : 0;
    const cara = refCara.current;
    const caraVisible = corte && (ref > 0 || ref1s > 0);
    if (cara) { cara.visible = caraVisible; cara.scale.setScalar(u.uR.value); }

    // volumen: mismas Z_eff, ocupaciones y foco que la cara
    const vol = refVol.current;
    if (vol) {
      const uv = matVol.uniforms;
      let rVol = 0, zRef = 1;
      for (let i = 0; i < ORBITALES.length; i++) {
        const o = estado.orbitales[i];
        const z = reloj.zEff[i];
        const on = volumen && o.ligado && z > Z_MIN_VISIBLE && (!foco || foco === o.def.id);
        uv.uZ.value[i] = Math.max(Z_MIN_VISIBLE, z);
        uv.uOcc.value[i] = on ? o.ocupacion : 0;
        if (on) rVol = Math.max(rVol, (RHO_VOL[i] / z) * U_A0);
      }
      // referencia: el pico de valencia (o el del 1s si no hay capa 2); k escala con su tamaño
      const valencia = estado.orbitales.findIndex((o, i) => i > 0 && uv.uOcc.value[i] > 0);
      zRef = valencia > 0 ? Math.max(Z_MIN_VISIBLE, reloj.zEff[valencia]) : Math.max(Z_MIN_VISIBLE, reloj.zEff[0]);
      // ρ_ref: SUMA de los picos de la capa de valencia (con la capa llena la densidad se suma)
      let refVol = 0;
      for (let i = 1; i < ORBITALES.length; i++) if (uv.uOcc.value[i] > 0) refVol += uv.uOcc.value[i] * PICO[i] * Math.pow(uv.uZ.value[i], 3);
      if (refVol <= 0) refVol = uv.uOcc.value[0] > 0 ? uv.uOcc.value[0] * PICO[0] * Math.pow(uv.uZ.value[0], 3) : 1;
      uv.uRef.value = refVol;
      uv.uK.value = (valencia > 0 ? 0.65 : 1.8) * zRef / U_A0;
      uv.uR.value = Math.min(7.5, Math.max(0.5, rVol));
      uv.uCorte.value = corte ? 1 : 0;
      uv.uRcara.value = caraVisible ? u.uR.value : 0;
      vol.visible = volumen && rVol > 0;
      vol.scale.setScalar(uv.uR.value);
    }
  });

  return (
    <group>
      {nubes.map((n, i) => (
        <points key={n.id} ref={(o) => { refsPuntos.current[i] = o; }} geometry={n.g} material={n.mat} frustumCulled={false} renderOrder={2} />
      ))}
      {/* contornos del 90 % (en ρ; el grupo escala por a₀/Z_eff) */}
      {ORBITALES.map((o, i) => (
        <group key={o.id} ref={(g) => { refsContorno.current[i] = g; }} visible={false}>
          {o.id === '1s' && <mesh geometry={geoEsf} material={matsContorno[i].pos} scale={iso.s1.radios[0]} renderOrder={3} />}
          {o.id === '2s' && (
            <>
              <mesh geometry={geoEsf} material={matsContorno[i].pos} scale={iso.s2.radios[0]} renderOrder={3} />
              <mesh geometry={geoEsf} material={matsContorno[i].neg} scale={iso.s2.radios[1]} renderOrder={3} />
              <mesh geometry={geoEsf} material={matsContorno[i].neg} scale={iso.s2.radios[2]} renderOrder={3} />
            </>
          )}
          {o.l === 1 && (
            // el lóbulo se tornea alrededor de +Y; se orienta al eje del orbital
            <group rotation={o.eje === 0 ? [0, 0, -Math.PI / 2] : o.eje === 2 ? [Math.PI / 2, 0, 0] : [0, 0, 0]}>
              <mesh geometry={lobulo} material={matsContorno[i].pos} renderOrder={3} />
              <mesh geometry={lobulo} material={matsContorno[i].neg} rotation={[Math.PI, 0, 0]} renderOrder={3} />
            </group>
          )}
        </group>
      ))}
      {/* rótulos de los orbitales */}
      {ORBITALES.map((o, i) => (
        <group key={o.id} ref={(g) => { refsRotulo.current[i] = g; }} visible={false}>
          <Etiqueta texto={o.etiqueta} tamano={0.2} fondo="rgba(9,17,27,0.78)" color="#eef4f8" peso={600}
            ancla={o.id === '1s' ? [0, 1] : o.eje === null ? [1, 1] : [0, 0.5]} siempreVisible />
        </group>
      ))}
      <mesh ref={refCara} geometry={geoCara} material={matCara} visible={false} renderOrder={0} />
      <mesh ref={refVol} geometry={geoVol} material={matVol} visible={false} renderOrder={1} frustumCulled={false} />
    </group>
  );
}

/** Ejes x, y, z finos que pasan por el núcleo (para leer la orientación de los 2p). */
function Ejes({ L = 4.3 }: { L?: number }) {
  const geo = useMemo(() => {
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.Float32BufferAttribute([-L, 0, 0, L, 0, 0, 0, -L, 0, 0, L, 0, 0, 0, -L, 0, 0, L], 3));
    return g;
  }, [L]);
  const mat = useMemo(() => new THREE.LineBasicMaterial({ color: '#7f95a8', transparent: true, opacity: 0.38, depthWrite: false }), []);
  useEffect(() => () => { geo.dispose(); mat.dispose(); }, [geo, mat]);
  return (
    <group>
      <lineSegments geometry={geo} material={mat} renderOrder={1} />
      <Etiqueta texto="*x*" position={[L + 0.18, 0, 0]} tamano={0.19} color="#a9bccb" />
      <Etiqueta texto="*y*" position={[0, L + 0.2, 0]} tamano={0.19} color="#a9bccb" />
      <Etiqueta texto="*z*" position={[0, 0, L + 0.18]} tamano={0.19} color="#a9bccb" />
    </group>
  );
}

/** Núcleo del modelo cuántico + «escala real» + barra de escala (DOM). */
function NucleoCuantico({ protons, neutrons, instability, escalaReal, refsDom }: {
  protons: number; neutrons: number; instability: number; escalaReal: boolean; refsDom?: RefsDomAtomo;
}) {
  const A = protons + neutrons;
  const total = Math.min(MAX_VISIBLES, A);
  const rDib = useMemo(() => radioCumulo(total, R_NUCLEON_Q), [total]);
  /** radio nuclear real en u: R[fm] → a₀ → u */
  const rReal = (radioNuclearFm(A) / (A0_PM * 1000)) * U_A0;
  const logEsc = useRef(0);
  const escala = useRef(1);
  const ultimo = useRef('');
  const size = useThree((s) => s.size);
  const controls = useThree((s) => s.controls) as unknown as OrbitControlsImpl | null;

  useFrame((state, dt) => {
    const objetivo = escalaReal && rDib > 0 && rReal > 0 ? Math.log(rReal / rDib) : 0;
    const k = 1 - Math.exp(-dt / 0.38);
    logEsc.current += (objetivo - logEsc.current) * k;
    if (Math.abs(objetivo - logEsc.current) < 1e-3) logEsc.current = objetivo;
    escala.current = Math.exp(logEsc.current);
    // aumento mostrado: radio dibujado / radio real
    const aum = rReal > 0 ? (rDib * escala.current) / rReal : 0;
    const txt = aum > 0 ? (aum < 1.5 ? '×1 (escala real)' : `×${miles(aum)}`) : '—';
    if (refsDom?.aumento?.current && txt !== ultimo.current) { refsDom.aumento.current.textContent = txt; ultimo.current = txt; }
    if (refsDom?.marcaNucleo?.current) refsDom.marcaNucleo.current.style.opacity = escalaReal && aum < 3 && A > 0 ? '1' : '0';
    // barra de 100 pm: px por u a la distancia del objetivo
    if (refsDom?.regla?.current) {
      const cam = state.camera as THREE.PerspectiveCamera;
      const dist = controls ? cam.position.distanceTo(controls.target) : cam.position.length();
      const pxU = size.height / (2 * dist * Math.tan(THREE.MathUtils.degToRad(cam.fov) / 2));
      const w = (100 / A0_PM) * U_A0 * pxU;
      refsDom.regla.current.style.width = `${w.toFixed(1)}px`;
    }
  });

  return <Nucleo protons={protons} neutrons={neutrons} instability={instability} rBase={R_NUCLEON_Q} escala={escala} />;
}

// ───────────────────────────── modelo de Bohr ─────────────────────────────

/** Estela que deja el electrón: arco de toro con alfa por vértice (0 → 1 hacia el electrón). */
function geoEstela(R: number, arco: number) {
  return geoCache(`qmi01-estela:${R}:${arco.toFixed(3)}`, () => {
    const segT = 48, segR = 6;
    const g = new THREE.TorusGeometry(R, 0.045, segR, segT, arco);
    const n = g.getAttribute('position').count;
    const col = new Float32Array(n * 4);
    for (let j = 0; j <= segR; j++) for (let i = 0; i <= segT; i++) {
      const k = j * (segT + 1) + i;
      const a = Math.pow(i / segT, 1.6);
      col.set([1, 0.83, 0.32, a * 0.55], k * 4);
    }
    g.setAttribute('color', new THREE.BufferAttribute(col, 4));
    return g;
  });
}

function Corteza({ electrons, pausa }: { electrons: number; pausa: boolean }) {
  const m = useMateriales();
  const nK = Math.min(CAP_K, electrons);
  const nL = Math.min(CAP_L, Math.max(0, electrons - CAP_K));
  const geoE = esfera(R_ELECTRON, 20);
  const matE = useMemo(() => m.plastico('#f0bd22', 0.28), [m]);
  const matOrbLlena = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0.75 }), []);
  const matOrbVacia = useMemo(() => new THREE.MeshBasicMaterial({ color: '#dfe7ec', transparent: true, opacity: 0.22 }), []);
  const matEstela = useMemo(() => new THREE.MeshBasicMaterial({ vertexColors: true, transparent: true, depthWrite: false }), []);
  useEffect(() => () => { matOrbLlena.dispose(); matOrbVacia.dispose(); matEstela.dispose(); }, [matOrbLlena, matOrbVacia, matEstela]);
  const ARCO = 0.95;
  const estelaK = geoEstela(R_K, ARCO), estelaL = geoEstela(R_L, ARCO * 0.6);

  const refs = useRef<(THREE.Mesh | null)[]>([]);
  const refsEst = useRef<(THREE.Mesh | null)[]>([]);
  const t = useRef(0);
  useFrame((_, dt) => {
    if (!pausa) t.current += dt;
    for (let i = 0; i < nK + nL; i++) {
      const enK = i < nK;
      const idx = enK ? i : i - nK, cuantos = enK ? nK : nL;
      const R = enK ? R_K : R_L;
      const w = enK ? 0.9 : 0.5;
      const a = t.current * w + (idx / cuantos) * Math.PI * 2 + (enK ? 0.6 : 0);
      const me = refs.current[i];
      if (me) me.position.set(Math.cos(a) * R, Math.sin(a) * R, 0);
      const es = refsEst.current[i];
      if (es) { es.rotation.z = a - (enK ? ARCO : ARCO * 0.6); es.visible = !pausa; }
    }
  });

  return (
    <group>
      <mesh geometry={toro(R_K, 0.02, 8, 160)} material={nK > 0 ? matOrbLlena : matOrbVacia} />
      <mesh geometry={toro(R_L, 0.02, 8, 200)} material={nL > 0 ? matOrbLlena : matOrbVacia} />
      {Array.from({ length: nK + nL }, (_, i) => (
        <React.Fragment key={i}>
          <mesh ref={(o) => { refs.current[i] = o; }} geometry={geoE} material={matE} />
          <mesh ref={(o) => { refsEst.current[i] = o; }} geometry={i < nK ? estelaK : estelaL} material={matEstela} renderOrder={2} />
        </React.Fragment>
      ))}
      <Etiqueta texto={`Capa K (n = 1) · ${nK}/${CAP_K}`} position={[0, R_K + 0.12, 0]} tamano={0.27} ancla={[0.5, 0]} color="#f4f7f8" />
      <Etiqueta texto={`Capa L (n = 2) · ${nL}/${CAP_L}`} position={[0, R_L + 0.12, 0]} tamano={0.27} ancla={[0.5, 0]} color="#f4f7f8" />
    </group>
  );
}

/**
 * Diagnóstico SÓLO en desarrollo: `window.__qmi01.salud()` cuenta llamadas de
 * dibujo, triángulos, puntos y normales nulas (la sonda de Playwright lo lee).
 */
const DEV = process.env.NODE_ENV !== 'production';
function DiagnosticoDev() {
  const gl = useThree((s) => s.gl);
  const scene = useThree((s) => s.scene);
  const medida = useRef({ llamadas: 0, triangulos: 0, puntos: 0, lineas: 0, fps: 0, n: 0, t0: 0 });
  // con EffectComposer el renderer se llama varias veces por cuadro: se acumula a mano
  useEffect(() => {
    if (!DEV) return;
    const antes = gl.info.autoReset;
    gl.info.autoReset = false;
    return () => { gl.info.autoReset = antes; };
  }, [gl]);
  useFrame(() => {
    if (!DEV) return;
    const r = gl.info.render, m = medida.current;
    m.llamadas = r.calls; m.triangulos = r.triangles; m.puntos = r.points; m.lineas = r.lines;
    gl.info.reset();
    const ahora = performance.now();
    m.n++;
    if (!m.t0) m.t0 = ahora;
    if (ahora - m.t0 >= 1000) { m.fps = (m.n * 1000) / (ahora - m.t0); m.n = 0; m.t0 = ahora; }
  }, -10);
  useEffect(() => {
    if (!DEV || typeof window === 'undefined') return;
    const w = window as unknown as { __qmi01?: unknown };
    w.__qmi01 = {
      salud() {
        let normalesCero = 0, mallas = 0;
        scene.traverse((o) => {
          const g = (o as THREE.Mesh).geometry as THREE.BufferGeometry | undefined;
          if (!g || !(o as THREE.Mesh).isMesh) return;
          mallas++;
          const n = g.getAttribute('normal');
          if (!n) return;
          for (let i = 0; i < n.count; i++) if (!(Math.hypot(n.getX(i), n.getY(i), n.getZ(i)) > 1e-6)) normalesCero++;
        });
        const m = medida.current;
        return { llamadas: m.llamadas, triangulos: m.triangulos, puntos: m.puntos, lineas: m.lineas, mallas, normalesCero, fps: Math.round(m.fps * 10) / 10 };
      },
    };
    return () => { delete w.__qmi01; };
  }, [gl, scene]);
  return null;
}

// ───────────────────────────── escena ─────────────────────────────

/** Bloom moderado (sólo calidad alta) + tono neutro (el EffectComposer apaga el del renderer). */
const TONO_NEUTRO = 8; // ToneMappingMode.NEUTRAL de postprocessing 6.39 (no lo re-exporta @react-three/postprocessing)
/**
 * Props CONSTANTES a propósito: si cambiaran (p. ej. otra intensidad por modo), el
 * composer rehace sus pasadas, y con el contexto WebGL perdido eso revienta.
 */
function Posproceso() {
  const calidad = useCalidad();
  if (calidad !== 'alta') return null;
  return (
    <EffectComposer multisampling={4} enableNormalPass={false}>
      <Bloom mipmapBlur intensity={0.75} luminanceThreshold={0.82} luminanceSmoothing={0.25} radius={0.7} />
      <ToneMapping mode={TONO_NEUTRO} />
    </EffectComposer>
  );
}

function InformarCalidad({ onCalidad }: { onCalidad?: (c: Calidad) => void }) {
  const calidad = useCalidad();
  useEffect(() => { onCalidad?.(calidad); }, [calidad, onCalidad]);
  return null;
}

// ───────────────────────────── escena ─────────────────────────────

export default function Atomic3DScene({
  protons, neutrons, electrons, instability, modo = 'atomo', estado, reloj, corte = false, contorno = false,
  escalaReal = false, pausa = false, foco = null, refsDom, nube = null, onCalidad,
}: Atomic3DSceneProps) {
  const cuantico = modo === 'cuantico' && !!estado && !!reloj;
  const vista: ModoAtomo = modo === 'cuantico' && !cuantico ? 'bohr' : modo;
  const radio = vista === 'atomo' ? Math.round(radioEncuadreAtomo(protons, electrons) * 100) / 100 : 0;
  return (
    <LabCanvas
      fondo="pizarron"
      sombras={false}
      camara={{ posicion: [0, 1.2, 16], objetivo: [0, 0, 0], fov: 35 }}
      controles={{ minDistancia: cuantico ? 2.2 : 6, maxDistancia: cuantico ? 34 : 32, paneo: false }}
    >
      <FondoAtomo />
      <DiagnosticoDev />
      <InformarCalidad onCalidad={onCalidad} />
      <CamaraAtomo modo={vista} radio={radio} />
      {vista === 'atomo' ? (
        <ModoAtomoVivo protons={protons} neutrons={neutrons} electrons={electrons} instability={instability} pausa={pausa} rotuloFoton={refsDom?.foton} />
      ) : cuantico ? (
        <group>
          <Ejes />
          <NucleoCuantico protons={protons} neutrons={neutrons} instability={instability} escalaReal={escalaReal} refsDom={refsDom} />
          <NubesCuanticas estado={estado!} reloj={reloj!} corte={corte} contorno={contorno} foco={foco} pausa={pausa} volumen={nube === 'volumen'} />
        </group>
      ) : (
        // El plano de las órbitas se inclina un poco para que se lea el volumen
        <group rotation={[-0.32, 0.12, 0]}>
          <Nucleo protons={protons} neutrons={neutrons} instability={instability} rBase={R_NUCLEON} />
          <Corteza electrons={electrons} pausa={pausa} />
        </group>
      )}
      <Posproceso />
    </LabCanvas>
  );
}
