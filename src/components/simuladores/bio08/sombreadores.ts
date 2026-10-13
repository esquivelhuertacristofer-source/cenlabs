/**
 * bio08/sombreadores.ts — materiales del corazón, del sistema de conducción, del
 * fantasma del corte y del torso de vidrio.
 *
 * Todos leen los MISMOS uniformes de tiempo (un objeto compartido que la escena
 * actualiza una vez por cuadro desde el reloj cardiaco): por eso la onda que se ve
 * en el miocardio, el impulso en el sistema de conducción y la contracción van con
 * la pluma de la tira de ECG.
 *
 * Tiempos brutos → tiempos del dominio (lo mismo que `tiemposDominio` y
 * `tiempoConduccion` de reloj.ts, aquí en GLSL):
 *   aurícula      τ_d = τ·kA,                      ρ_d = ρ·kA
 *   ventrículo    τ_d = t0_dep + (τ − τmin)·sV,    ρ_d = t0_rep + (ρ − ρmin)·sR
 *   conducción    A: t·kA · AV: tAV + (tHis − tAV)·f · V: tHis + t·kV
 *
 * Color de la onda (emisivo, sólo donde hay miocardio):
 *   frente de despolarización  dorado, borde de ~1,5 ms y cola de ~9 ms
 *   meseta (despolarizado)     brasa tenue
 *   repolarización             banda azul de ~8 ms alrededor de ρ_d
 */
import * as THREE from 'three';
import { MECANICA } from './reloj';
import { CORTE, MARCO } from './anatomia';

export interface UniformesTiempo {
  [k: string]: THREE.IUniform;
  uT: { value: number }; uRR: { value: number };
  uKA: { value: number }; uVDep0: { value: number }; uSV: { value: number }; uVRep0: { value: number }; uSR: { value: number };
  uVMin: { value: number }; uRMin: { value: number };
  uTAV: { value: number }; uTHis: { value: number }; uKV: { value: number };
  /** contracción ventricular media (arrastre del plano AV) */
  uCV: { value: number };
  /** amplitud de la mecánica (1 = la del modelo) */
  uAmp: { value: number };
  /** 1 = mapa de isócronas de activación */
  uIso: { value: number };
  /** duración de la activación auricular y ventricular en el dominio (para la rampa) */
  uDurA: { value: number }; uDurV: { value: number };
  /** 1 = corte de cuatro cámaras activo (las piezas recortables se ocultan en la parte quitada) */
  uCorte: { value: number };
}

export function nuevosUniformes(): UniformesTiempo {
  const u = (value: number) => ({ value });
  return {
    uT: u(0), uRR: u(800), uKA: u(1), uVDep0: u(160), uSV: u(1), uVRep0: u(400), uSR: u(1), uVMin: u(0), uRMin: u(0),
    uTAV: u(50), uTHis: u(150), uKV: u(1), uCV: u(0), uAmp: u(1), uIso: u(0), uDurA: u(100), uDurV: u(90), uCorte: u(1),
  };
}

const f = (x: number) => x.toFixed(4);

/** Declaraciones y funciones GLSL comunes. */
const COMUN = /* glsl */ `
uniform float uT; uniform float uRR;
uniform float uKA; uniform float uVDep0; uniform float uSV; uniform float uVRep0; uniform float uSR;
uniform float uVMin; uniform float uRMin;
uniform float uTAV; uniform float uTHis; uniform float uKV;
uniform float uCV; uniform float uAmp; uniform float uIso; uniform float uDurA; uniform float uDurV;
vec2 tiemposDominio(float tau, float rho, float proc) {
  if (proc < 0.5) return vec2(-1.0e4);
  if (proc < 1.5) return vec2(tau * uKA, rho * uKA);
  return vec2(uVDep0 + (tau - uVMin) * uSV, uVRep0 + (rho - uRMin) * uSR);
}
float c1(float t, float tau, float rho, float re, float sube, float rel) {
  return smoothstep(tau + re, tau + re + sube, t) * (1.0 - smoothstep(rho + 10.0, rho + 10.0 + rel, t));
}
float contraccion(float t, float tau, float rho, float proc) {
  bool v = proc > 1.5;
  float re = v ? ${f(MECANICA.retardoV)} : ${f(MECANICA.retardoA)};
  float sube = v ? ${f(MECANICA.subidaV)} : ${f(MECANICA.subidaA)};
  float rel = v ? ${f(MECANICA.relajaV)} : ${f(MECANICA.relajaA)};
  return max(c1(t, tau, rho, re, sube, rel), c1(t + uRR, tau, rho, re, sube, rel));
}
`;

/** Emisión de la onda en un punto de miocardio con tiempos del dominio td = (τ_d, ρ_d). */
const ONDA = /* glsl */ `
vec3 ondaElectrica(float t, vec2 td) {
  float dt = t - td.x;
  float frente = dt >= 0.0 ? exp(-dt / 9.0) : exp(-(dt * dt) / 2.2);
  float meseta = step(0.0, dt) * (1.0 - smoothstep(td.y - 12.0, td.y + 6.0, t));
  float dr = t - td.y;
  float repol = exp(-(dr * dr) / (8.0 * 8.0));
  return vec3(1.8, 0.95, 0.26) * frente + vec3(0.16, 0.034, 0.01) * meseta + vec3(0.1, 0.42, 1.15) * repol;
}
`;

/** Ruido de valor 3D suave (moteado del tejido; frecuencia baja a propósito: nada de grano). */
const RUIDO = /* glsl */ `
float hash13(vec3 p) { p = fract(p * 0.1031); p += dot(p, p.zyx + 31.32); return fract((p.x + p.y) * p.z); }
float vnoise(vec3 x) {
  vec3 i = floor(x); vec3 fr = fract(x); vec3 u = fr * fr * (3.0 - 2.0 * fr);
  return mix(mix(mix(hash13(i), hash13(i + vec3(1,0,0)), u.x), mix(hash13(i + vec3(0,1,0)), hash13(i + vec3(1,1,0)), u.x), u.y),
             mix(mix(hash13(i + vec3(0,0,1)), hash13(i + vec3(1,0,1)), u.x), mix(hash13(i + vec3(0,1,1)), hash13(i + vec3(1,1,1)), u.x), u.y), u.z);
}
`;

/** Rampa de isócronas: temprano = marfil, tarde = violeta profundo. */
const RAMPA = /* glsl */ `
vec3 rampaIso(float s) {
  s = clamp(s, 0.0, 1.0);
  vec3 c0 = vec3(1.0, 0.95, 0.70), c1 = vec3(0.98, 0.70, 0.22), c2 = vec3(0.86, 0.30, 0.16), c3 = vec3(0.50, 0.12, 0.38), c4 = vec3(0.16, 0.08, 0.42);
  if (s < 0.25) return mix(c0, c1, s / 0.25);
  if (s < 0.5) return mix(c1, c2, (s - 0.25) / 0.25);
  if (s < 0.75) return mix(c2, c3, (s - 0.5) / 0.25);
  return mix(c3, c4, (s - 0.75) / 0.25);
}
`;

// ───────────────────────────── miocardio ─────────────────────────────

/**
 * Material del corazón: PBR (tejido húmedo: brillo de barniz + terciopelo) con la
 * onda eléctrica como emisión, la contracción como desplazamiento de vértices y,
 * a petición, el mapa de isócronas con líneas cada 10 ms.
 */
export function materialCorazon(u: UniformesTiempo, alta: boolean, recortable = false): THREE.MeshStandardMaterial {
  const m = alta
    ? new THREE.MeshPhysicalMaterial({
      color: '#ffffff', vertexColors: true, roughness: 0.42, metalness: 0,
      clearcoat: 0.75, clearcoatRoughness: 0.24, sheen: 0.25, sheenRoughness: 0.5, sheenColor: new THREE.Color('#ff7d6e'),
      specularIntensity: 0.5, envMapIntensity: 0.8,
    })
    : new THREE.MeshStandardMaterial({ color: '#ffffff', vertexColors: true, roughness: 0.4, metalness: 0, envMapIntensity: 0.9 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
${COMUN}
attribute float aTau; attribute float aRho; attribute float aProc; attribute float aExc; attribute float aSec;
attribute vec3 aDesp; attribute vec3 aArr;
varying vec2 vTD; varying float vExc; varying float vSec; varying float vProc; varying vec3 vPObj;`)
      .replace('#include <begin_vertex>', `vec3 transformed = vec3(position);
vec2 td = tiemposDominio(aTau, aRho, aProc);
vTD = td; vExc = aExc; vSec = aSec; vProc = aProc; vPObj = position;
float cc = aProc > 0.5 ? contraccion(uT, td.x, td.y, aProc) : 0.0;
transformed += (aDesp * cc + aArr * uCV) * uAmp;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
${COMUN}
${ONDA}
${RUIDO}
${RAMPA}
varying vec2 vTD; varying float vExc; varying float vSec; varying float vProc; varying vec3 vPObj;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
{
  float mot = vnoise(vPObj * 21.0) * 0.6 + vnoise(vPObj * 43.0) * 0.4;
  diffuseColor.rgb *= 0.9 + 0.18 * mot;
  if (uIso > 0.5 && vProc > 0.5) {
    bool aur = vProc < 1.5;
    float s = aur ? vTD.x / uDurA : (vTD.x - uVDep0) / uDurV;
    vec3 c = rampaIso(s);
    float q = vTD.x / 10.0;
    float w = fwidth(q);
    float d = abs(fract(q + 0.5) - 0.5);
    float linea = (1.0 - smoothstep(0.5 * w, 1.5 * w, d)) * (1.0 - smoothstep(0.12, 0.3, w));
    diffuseColor.rgb = mix(diffuseColor.rgb, c * (1.0 - 0.6 * linea), 0.9 * vExc);
  }
}`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
if (vProc > 0.5 && vExc > 0.01) totalEmissiveRadiance += ondaElectrica(uT, vTD) * vExc * (uIso > 0.5 ? 0.6 : 1.0);`);
    if (recortable) {
      const n = CORTE.n, p0 = CORTE.p0, o = MARCO.o, ey = MARCO.ey;
      sh.fragmentShader = sh.fragmentShader
        .replace('#include <common>', `#include <common>
uniform float uCorte;`)
        .replace('#include <clipping_planes_fragment>', `#include <clipping_planes_fragment>
if (uCorte > 0.5) {
  float dC = dot(vPObj - vec3(${f(p0[0])}, ${f(p0[1])}, ${f(p0[2])}), vec3(${f(n[0])}, ${f(n[1])}, ${f(n[2])}));
  float hC = dot(vPObj - vec3(${f(o[0])}, ${f(o[1])}, ${f(o[2])}), vec3(${f(ey[0])}, ${f(ey[1])}, ${f(ey[2])}));
  if (dC > 0.0 && hC < ${f(CORTE.techo)}) discard;
}`);
    }
  };
  m.customProgramCacheKey = () => `bio08-corazon-${alta ? 'a' : 'm'}${recortable ? '-r' : ''}`;
  return m;
}

// ───────────────────────────── fantasma del corte ─────────────────────────────

/**
 * La parte que el corte quita, como cáscara translúcida (borde de Fresnel) que
 * sigue latiendo y deja ver pasar la onda: el corazón se lee entero.
 */
export function materialFantasma(u: UniformesTiempo): THREE.ShaderMaterial {
  const n = CORTE.n, p0 = CORTE.p0, o = MARCO.o, ey = MARCO.ey;
  return new THREE.ShaderMaterial({
    uniforms: u,
    transparent: true, depthWrite: false, side: THREE.FrontSide,
    vertexShader: /* glsl */ `
${COMUN}
attribute float aTau; attribute float aRho; attribute float aProc; attribute float aExc;
attribute vec3 aDesp; attribute vec3 aArr;
varying vec2 vTD; varying float vExc; varying float vProc; varying vec3 vPObj; varying vec3 vN; varying vec3 vV;
void main() {
  vec3 p = position;
  vec2 td = tiemposDominio(aTau, aRho, aProc);
  float cc = aProc > 0.5 ? contraccion(uT, td.x, td.y, aProc) : 0.0;
  p += (aDesp * cc + aArr * uCV) * uAmp;
  vTD = td; vExc = aExc; vProc = aProc; vPObj = position;
  vec4 w = modelMatrix * vec4(p, 1.0);
  vN = normalize(mat3(modelMatrix) * normal);
  vV = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */ `
${COMUN}
${ONDA}
varying vec2 vTD; varying float vExc; varying float vProc; varying vec3 vPObj; varying vec3 vN; varying vec3 vV;
void main() {
  vec3 q = vPObj - vec3(${f(p0[0])}, ${f(p0[1])}, ${f(p0[2])});
  float d = dot(q, vec3(${f(n[0])}, ${f(n[1])}, ${f(n[2])}));
  float hb = dot(vPObj - vec3(${f(o[0])}, ${f(o[1])}, ${f(o[2])}), vec3(${f(ey[0])}, ${f(ey[1])}, ${f(ey[2])}));
  if (d < -0.004 || hb > ${f(CORTE.techo)} + 0.004) discard;
  float fr = pow(1.0 - abs(dot(normalize(vN), normalize(vV))), 2.2);
  vec3 col = vec3(0.95, 0.45, 0.45) * (0.25 + 0.9 * fr);
  float a = 0.015 + 0.30 * fr;
  if (vProc > 0.5 && vExc > 0.01) { vec3 e = ondaElectrica(uT, vTD) * vExc; col += e * 0.5; a += min(0.22, dot(e, vec3(0.12))); }
  gl_FragColor = vec4(col, min(a, 0.6));
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

// ───────────────────────────── sistema de conducción ─────────────────────────────

/**
 * Fibras de conducción: marfil, con el impulso como destello que viaja a su
 * velocidad (rápido en His-Purkinje, lento en el nodo AV). Se adelantan 1,2 mm
 * hacia la cámara en espacio de vista para que no las tape la pared en la que
 * están embebidas (no atraviesan paredes de verdad: el miocardio mide ≥ 3,5 mm).
 */
export function materialConduccion(u: UniformesTiempo): THREE.MeshStandardMaterial {
  const m = new THREE.MeshStandardMaterial({ color: '#efe3bd', roughness: 0.35, metalness: 0, emissive: '#000000', envMapIntensity: 0.8 });
  m.onBeforeCompile = (sh) => {
    Object.assign(sh.uniforms, u);
    sh.vertexShader = sh.vertexShader
      .replace('#include <common>', `#include <common>
${COMUN}
attribute float aT; attribute float aProcC; attribute float aPk;
varying float vTC; varying float vPk;
float tCond(float t, float p) { if (p < 0.5) return t * uKA; if (p < 1.5) return uTAV + (uTHis - uTAV) * t; return uTHis + t * uKV; }`)
      .replace('#include <begin_vertex>', `#include <begin_vertex>
vTC = tCond(aT, aProcC); vPk = aPk;`)
      .replace('#include <project_vertex>', `#include <project_vertex>
mvPosition.xyz += normalize(-mvPosition.xyz) * 0.012;
gl_Position = projectionMatrix * mvPosition;`);
    sh.fragmentShader = sh.fragmentShader
      .replace('#include <common>', `#include <common>
uniform float uT;
varying float vTC; varying float vPk;`)
      .replace('#include <color_fragment>', `#include <color_fragment>
diffuseColor.rgb = mix(diffuseColor.rgb, vec3(0.60, 0.33, 0.30), vPk * 0.8);`)
      .replace('#include <emissivemap_fragment>', `#include <emissivemap_fragment>
{
  float dt = uT - vTC;
  float frente = dt >= 0.0 ? exp(-dt / 9.0) : exp(-(dt * dt) / 1.5);
  float rastro = dt >= 0.0 ? 0.22 * exp(-dt / 90.0) : 0.0;
  totalEmissiveRadiance += (vec3(2.6, 1.9, 0.85) * frente + vec3(0.45, 0.28, 0.08) * rastro) * (1.0 - 0.35 * vPk);
}`);
  };
  m.customProgramCacheKey = () => 'bio08-conduccion';
  return m;
}

/**
 * Red de Purkinje: sólo luz. En reposo no se ve (suma cero); cuando el impulso la
 * recorre a 2,5 m/s aparece como hilos que se encienden sobre el endocardio.
 */
export function materialPurkinje(u: UniformesTiempo): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    uniforms: u, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
    vertexShader: /* glsl */ `
${COMUN}
attribute float aT; attribute float aProcC;
varying float vTC;
void main() {
  vTC = aProcC < 0.5 ? aT * uKA : (aProcC < 1.5 ? uTAV + (uTHis - uTAV) * aT : uTHis + aT * uKV);
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  mv.xyz += normalize(-mv.xyz) * 0.012;
  gl_Position = projectionMatrix * mv;
}`,
    fragmentShader: /* glsl */ `
uniform float uT;
varying float vTC;
void main() {
  float dt = uT - vTC;
  float f = dt >= 0.0 ? exp(-dt / 7.0) : exp(-(dt * dt) / 1.5);
  float rastro = dt >= 0.0 ? 0.1 * exp(-dt / 50.0) : 0.0;
  gl_FragColor = vec4(vec3(1.35, 0.95, 0.4) * f + vec3(0.22, 0.12, 0.03) * rastro, 1.0);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}

// ───────────────────────────── torso de vidrio ─────────────────────────────

/**
 * Vidrio barato y limpio: Fresnel + un reflejo de la luz clave; se desvanece arriba
 * y abajo. Se dibuja dos veces: la cara trasera, tenue, da el volumen del cuerpo.
 */
export function materialTorso(trasera = false): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, side: trasera ? THREE.BackSide : THREE.FrontSide,
    uniforms: { uK: { value: trasera ? 0.42 : 1 } },
    vertexShader: /* glsl */ `
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vW = w.xyz; vN = normalize(mat3(modelMatrix) * normal); vV = normalize(cameraPosition - w.xyz);
  gl_Position = projectionMatrix * viewMatrix * w;
}`,
    fragmentShader: /* glsl */ `
uniform float uK;
varying vec3 vN; varying vec3 vV; varying vec3 vW;
void main() {
  vec3 n = normalize(vN) * (gl_FrontFacing ? 1.0 : -1.0), v = normalize(vV);
  float fr = pow(1.0 - abs(dot(n, v)), 3.0);
  vec3 l = normalize(vec3(-0.45, 0.7, 0.55));
  float esp = pow(max(dot(reflect(-l, n), v), 0.0), 60.0);
  float esp2 = pow(max(dot(reflect(-normalize(vec3(0.8, 0.2, 0.5)), n), v), 0.0), 24.0) * 0.35;
  vec3 col = mix(vec3(0.42, 0.62, 0.78), vec3(0.86, 0.95, 1.0), fr) * 0.9 + vec3(1.0) * (esp + esp2);
  float a = 0.018 + 0.30 * fr + 0.55 * esp + 0.25 * esp2;
  a *= smoothstep(-2.75, -2.15, vW.y) * (1.0 - smoothstep(2.0, 2.55, vW.y)) * uK;
  gl_FragColor = vec4(col, a);
  #include <tonemapping_fragment>
  #include <colorspace_fragment>
}`,
  });
}
