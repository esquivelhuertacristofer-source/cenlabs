'use client';
/**
 * bio03/Ambiente.tsx — el medio en que flotan las moléculas.
 *
 *  · Cielo: degradado radial en pantalla (nucleoplasma azul verdoso · citoplasma violeta)
 *    que se funde de uno a otro durante la exportación del ARNm.
 *  · Niebla exponencial con el color del medio: da profundidad (lo lejano se apaga).
 *  · Bokeh: partículas desenfocadas por delante y por detrás.
 *  · Proteínas lejanas (el medio está abarrotado: ~300 g/L de macromoléculas) que derivan.
 *  · Moléculas libres que difunden (movimiento browniano, Stokes–Einstein, mostrado ~10⁸
 *    veces más lento): NTP de los cuatro tipos en el núcleo; ARNt con su factor en el
 *    citoplasma. Ninguna sugiere qué base o qué ARNt toca: los NTP son de los cuatro
 *    tipos por igual y los ARNt del fondo no llevan anticodón visible.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import { rngConSemilla } from '@/domain/biologia';
import { COLOR_BASE, esPurina, pasoBrowniano, type V3 } from './molecular';
import { geoEsfera, geoLosa, matrizLosa, matrizCuenta } from './instancias';
import { materialCera, materialBokeh } from './materiales';
import type { RelojSintesis } from './reloj';

export const MEDIO = {
  nucleo: { centro: '#17384c', medio: '#0b2030', borde: '#04090f', niebla: '#0a1c29' },
  citoplasma: { centro: '#2a2244', medio: '#151127', borde: '#06050c', niebla: '#120e1f' },
} as const;

/** Cielo: esfera interior con degradado radial EN PANTALLA y mezcla núcleo → citoplasma. */
export function Cielo({ mezcla }: { mezcla: React.RefObject<number> }) {
  const size = useThree((s) => s.size);
  const gl = useThree((s) => s.gl);
  const mat = useMemo(() => new THREE.ShaderMaterial({
    side: THREE.BackSide, depthWrite: false, depthTest: false, fog: false,
    uniforms: {
      uMez: { value: 0 }, uRes: { value: new THREE.Vector2(1, 1) },
      a0: { value: new THREE.Color(MEDIO.nucleo.centro) }, a1: { value: new THREE.Color(MEDIO.nucleo.medio) }, a2: { value: new THREE.Color(MEDIO.nucleo.borde) },
      b0: { value: new THREE.Color(MEDIO.citoplasma.centro) }, b1: { value: new THREE.Color(MEDIO.citoplasma.medio) }, b2: { value: new THREE.Color(MEDIO.citoplasma.borde) },
    },
    vertexShader: /* glsl */ `void main(){ gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); gl_Position.z = gl_Position.w; }`,
    fragmentShader: /* glsl */ `
      uniform float uMez; uniform vec2 uRes;
      uniform vec3 a0; uniform vec3 a1; uniform vec3 a2; uniform vec3 b0; uniform vec3 b1; uniform vec3 b2;
      float h(vec2 p){ return fract(sin(dot(p, vec2(12.9898, 78.233))) * 43758.5453); }
      void main(){
        vec2 q = gl_FragCoord.xy / uRes;
        vec2 d = (q - vec2(0.5, 0.56)) * vec2(uRes.x / uRes.y, 1.0);
        float r = length(d) * 1.05;
        vec3 A = mix(mix(a0, a1, smoothstep(0.0, 0.45, r)), a2, smoothstep(0.42, 1.05, r));
        vec3 B = mix(mix(b0, b1, smoothstep(0.0, 0.45, r)), b2, smoothstep(0.42, 1.05, r));
        vec3 c = mix(A, B, uMez);
        c += (h(gl_FragCoord.xy) - 0.5) / 255.0;   // sin bandas
        gl_FragColor = vec4(c, 1.0);
        #include <colorspace_fragment>
      }`,
  }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const geo = useMemo(() => new THREE.SphereGeometry(1, 16, 12), []);
  useEffect(() => () => geo.dispose(), [geo]);
  const malla = useRef<THREE.Mesh>(null);
  useFrame(({ camera }) => {
    const pr = gl.getPixelRatio();
    mat.uniforms.uRes.value.set(size.width * pr, size.height * pr);
    mat.uniforms.uMez.value = mezcla.current ?? 0;
    if (malla.current) { malla.current.position.copy(camera.position); malla.current.scale.setScalar(camera.far * 0.9); }
  });
  return <mesh ref={malla} geometry={geo} material={mat} renderOrder={-100} frustumCulled={false} />;
}

/** Niebla con el color del medio; `espesor` la sube durante la exportación. */
export function Niebla({ mezcla, espesor }: { mezcla: React.RefObject<number>; espesor: React.RefObject<number> }) {
  const scene = useThree((s) => s.scene);
  const niebla = useMemo(() => new THREE.FogExp2(MEDIO.nucleo.niebla, 0.011), []);
  const cN = useMemo(() => new THREE.Color(MEDIO.nucleo.niebla), []);
  const cC = useMemo(() => new THREE.Color(MEDIO.citoplasma.niebla), []);
  useEffect(() => { const antes = scene.fog; scene.fog = niebla; return () => { scene.fog = antes; }; }, [scene, niebla]);
  useFrame(() => {
    niebla.color.copy(cN).lerp(cC, mezcla.current ?? 0);
    niebla.density = 0.011 + 0.008 * (espesor.current ?? 0);
  });
  return null;
}

/** Partículas desenfocadas (bokeh) alrededor de la escena. */
export function Bokeh({ alta, mezcla }: { alta: boolean; mezcla: React.RefObject<number> }) {
  const n = alta ? 420 : 200;
  const size = useThree((s) => s.size);
  const camera = useThree((s) => s.camera) as THREE.PerspectiveCamera;
  const { geo, vel } = useMemo(() => {
    const rng = rngConSemilla(91);
    const pos = new Float32Array(n * 3), colA = new Float32Array(n * 3), tam = new Float32Array(n);
    const vel = new Float32Array(n * 3);
    const pal = ['#7fd8e8', '#9fb8ff', '#c9a8ff', '#ffd6a0', '#a8ffd8'].map((h) => new THREE.Color(h));
    for (let i = 0; i < n; i++) {
      const r = 18 + 70 * Math.pow(rng(), 0.8), th = rng() * Math.PI * 2, ph = Math.acos(2 * rng() - 1);
      pos[3 * i] = r * Math.sin(ph) * Math.cos(th); pos[3 * i + 1] = r * Math.cos(ph) * 0.7; pos[3 * i + 2] = r * Math.sin(ph) * Math.sin(th) - 10;
      const c = pal[Math.floor(rng() * pal.length)];
      const k = 0.35 + 0.4 * rng();
      colA[3 * i] = c.r * k; colA[3 * i + 1] = c.g * k; colA[3 * i + 2] = c.b * k;
      tam[i] = 0.25 + 1.6 * rng() * rng();
      vel[3 * i] = (rng() - 0.5) * 0.3; vel[3 * i + 1] = (rng() - 0.5) * 0.2; vel[3 * i + 2] = (rng() - 0.5) * 0.3;
    }
    const g = new THREE.BufferGeometry();
    g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    g.setAttribute('aColor', new THREE.BufferAttribute(colA, 3));
    g.setAttribute('aTam', new THREE.BufferAttribute(tam, 1));
    return { geo: g, vel };
  }, [n]);
  useEffect(() => () => geo.dispose(), [geo]);
  const mat = useMemo(() => materialBokeh(new THREE.Color(MEDIO.nucleo.niebla), 400), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const cN = useMemo(() => new THREE.Color(MEDIO.nucleo.niebla), []);
  const cC = useMemo(() => new THREE.Color(MEDIO.citoplasma.niebla), []);
  const t0 = useRef(0);
  useFrame((_, dt) => {
    const pr = Math.min(2, window.devicePixelRatio || 1);
    mat.uniforms.uEscala.value = (size.height * pr) / (2 * Math.tan(THREE.MathUtils.degToRad(camera.fov) / 2));
    (mat.uniforms.uNiebla.value as THREE.Color).copy(cN).lerp(cC, mezcla.current ?? 0);
    // deriva lenta
    t0.current += dt;
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    const d = Math.min(0.05, dt);
    for (let i = 0; i < n; i++) { p.array[3 * i] += vel[3 * i] * d; p.array[3 * i + 1] += vel[3 * i + 1] * d; p.array[3 * i + 2] += vel[3 * i + 2] * d; }
    p.needsUpdate = true;
  });
  return <points geometry={geo} material={mat} renderOrder={1} frustumCulled={false} />;
}

/** Proteínas lejanas (instancias de unas pocas superficies), con deriva y giro lentos. */
export function ProteinasLejanas({ geos, colores, n = 14, semilla = 5, reloj }: { geos: THREE.BufferGeometry[]; colores: string[]; n?: number; semilla?: number; reloj: RelojSintesis }) {
  const mat = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.6, fuerzaBorde: 0.3, borde: '#cfe0ff' }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const datos = useMemo(() => {
    const rng = rngConSemilla(semilla);
    return geos.map(() => Array.from({ length: Math.ceil(n / geos.length) }, () => {
      // detrás y a los lados (nunca entre la cámara y la máquina)
      const r = 34 + 36 * rng(), th = -Math.PI * 0.62 + rng() * Math.PI * 1.24, y = (rng() - 0.5) * 34;
      return {
        p: [r * Math.sin(th), y, -r * Math.cos(th) * 0.9 - 8] as V3,
        eje: new THREE.Vector3(rng() - 0.5, rng() - 0.5, rng() - 0.5).normalize(),
        w: 0.05 + 0.08 * rng(), fase: rng() * 6, esc: 0.8 + 0.7 * rng(),
        color: colores[Math.floor(rng() * colores.length)],
      };
    }));
  }, [geos, n, semilla, colores]);
  const refs = useRef<(THREE.InstancedMesh | null)[]>([]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const q = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const s = useMemo(() => new THREE.Vector3(), []);
  useEffect(() => {
    const c = new THREE.Color();
    datos.forEach((lista, g) => { const im = refs.current[g]; if (!im) return; lista.forEach((d, i) => im.setColorAt(i, c.set(d.color))); if (im.instanceColor) im.instanceColor.needsUpdate = true; });
  }, [datos]);
  useFrame(() => {
    const t = reloj.t;
    datos.forEach((lista, g) => {
      const im = refs.current[g]; if (!im) return;
      lista.forEach((d, i) => {
        q.setFromAxisAngle(d.eje, d.fase + d.w * t);
        v.set(d.p[0] + 1.2 * Math.sin(0.05 * t + d.fase), d.p[1] + 0.9 * Math.sin(0.04 * t + 2 * d.fase), d.p[2]);
        im.setMatrixAt(i, m4.compose(v, q, s.setScalar(d.esc)));
      });
      im.instanceMatrix.needsUpdate = true;
    });
  });
  return (
    <>
      {geos.map((g, i) => (
        <instancedMesh key={i} ref={(el) => { refs.current[i] = el; }} args={[g, mat, datos[i].length]} frustumCulled={false} />
      ))}
    </>
  );
}

/**
 * NTP libres en el nucleoplasma (los cuatro tipos por igual), con difusión browniana:
 * paso gaussiano de σ = v·√(dt/3) por eje (la v mostrada es la de Stokes–Einstein
 * escalada; ver molecular.ts) y un giro aleatorio. Se mantienen fuera de la polimerasa.
 */
export function NTPLibres({ reloj, alta }: { reloj: RelojSintesis; alta: boolean }) {
  const n = alta ? 34 : 20;
  const losas = useRef<THREE.InstancedMesh>(null);
  const cuentas = useRef<THREE.InstancedMesh>(null);
  const mat = useMemo(() => materialCera({ rugosidad: 0.6, fuerzaBorde: 0.25 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  const est = useMemo(() => {
    const rng = rngConSemilla(17);
    const bases = ['A', 'U', 'C', 'G'];
    return Array.from({ length: n }, (_, i) => {
      let p: V3;
      do { p = [(rng() - 0.5) * 50, (rng() - 0.5) * 30, -16 + rng() * 26]; } while (fuera(p));
      return { p, q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 6, rng() * 6, rng() * 6)), b: bases[i % 4], rng: rngConSemilla(100 + i) };
    });
  }, [n]);
  useEffect(() => {
    const c = new THREE.Color();
    est.forEach((e, i) => {
      losas.current?.setColorAt(i, c.set(COLOR_BASE[e.b]));
      for (let k = 0; k < 4; k++) cuentas.current?.setColorAt(4 * i + k, c.set(k === 0 ? '#dcb0f6' : '#e0b04a'));
    });
    if (losas.current?.instanceColor) losas.current.instanceColor.needsUpdate = true;
    if (cuentas.current?.instanceColor) cuentas.current.instanceColor.needsUpdate = true;
  }, [est]);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const dq = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const tPrev = useRef(0);
  useFrame(() => {
    const L = losas.current, C = cuentas.current; if (!L || !C) return;
    const dt = Math.max(0, Math.min(0.1, reloj.t - tPrev.current));
    tPrev.current = reloj.t;
    const sig = pasoBrowniano(1.4, dt);
    est.forEach((e, i) => {
      if (dt > 0) {
        const g = () => { const u = Math.max(1e-9, e.rng()), w = e.rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
        const np: V3 = [e.p[0] + sig * g(), e.p[1] + sig * g(), e.p[2] + sig * g()];
        if (!fuera(np) && Math.abs(np[0]) < 26 && Math.abs(np[1]) < 16 && np[2] > -16 && np[2] < 12) e.p = np;
        dq.setFromEuler(new THREE.Euler(sig * g() * 0.8, sig * g() * 0.8, sig * g() * 0.8));
        e.q.multiply(dq).normalize();
      }
      // NTP: base + ribosa + trifosfato, en el marco de la molécula
      const P = (x: number, y: number, z: number): V3 => { v.set(x, y, z).applyQuaternion(e.q); return [v.x + e.p[0], v.y + e.p[1], v.z + e.p[2]]; };
      const az = P(0, 0, 0);
      L.setMatrixAt(i, matrizLosa(m4, az, P(esPurina(e.b) ? 0.6 : 0.48, 0, 0), P(0, 1, 0).map((x, k) => x - az[k]) as V3, 0.29, 0.48));
      C.setMatrixAt(4 * i, matrizCuenta(m4, az, 0.235));
      C.setMatrixAt(4 * i + 1, matrizCuenta(m4, P(-0.3, -0.25, 0.1), 0.25));
      C.setMatrixAt(4 * i + 2, matrizCuenta(m4, P(-0.62, -0.42, 0.18), 0.24));
      C.setMatrixAt(4 * i + 3, matrizCuenta(m4, P(-0.94, -0.6, 0.26), 0.24));
    });
    L.instanceMatrix.needsUpdate = true; C.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={losas} args={[geoLosa(), mat, n]} frustumCulled={false} />
      <instancedMesh ref={cuentas} args={[geoEsfera(false), mat, 4 * n]} frustumCulled={false} />
    </>
  );
}
/** ¿Dentro de la polimerasa o del ADN (zona prohibida para los NTP libres)? */
function fuera(p: V3): boolean {
  if (Math.hypot(p[0] + 0.5, p[1] - 0.6, p[2] + 1.2) < 12.5) return true;
  if (Math.hypot(p[1], p[2]) < 3.2) return true;
  return false;
}

/** ARNt libres en el citoplasma (sin anticodón visible), cada uno con su eEF1A, difundiendo. */
export function ARNtLibres({ reloj, geoARNt, geoEF }: { reloj: RelojSintesis; geoARNt: THREE.BufferGeometry; geoEF: THREE.BufferGeometry }) {
  const n = 7;
  const a = useRef<THREE.InstancedMesh>(null);
  const b = useRef<THREE.InstancedMesh>(null);
  const matA = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.55, fuerzaBorde: 0.35 }), []);
  const matB = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.55, fuerzaBorde: 0.35 }), []);
  useEffect(() => () => { matA.dispose(); matB.dispose(); }, [matA, matB]);
  const est = useMemo(() => {
    const rng = rngConSemilla(29);
    return Array.from({ length: n }, (_, i) => ({
      p: [i % 2 ? 26 + 14 * rng() : -26 - 14 * rng(), -10 + 24 * rng(), -62 + 16 * rng()] as V3,
      q: new THREE.Quaternion().setFromEuler(new THREE.Euler(rng() * 6, rng() * 6, rng() * 6)),
      rng: rngConSemilla(300 + i),
    }));
  }, []);
  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const dq = useMemo(() => new THREE.Quaternion(), []);
  const v = useMemo(() => new THREE.Vector3(), []);
  const uno = useMemo(() => new THREE.Vector3(1, 1, 1), []);
  const tPrev = useRef(0);
  useFrame(() => {
    const A = a.current, B = b.current; if (!A || !B) return;
    const dt = Math.max(0, Math.min(0.1, reloj.t - tPrev.current));
    tPrev.current = reloj.t;
    const sig = pasoBrowniano(0.5, dt);
    est.forEach((e, i) => {
      const g = () => { const u = Math.max(1e-9, e.rng()), w = e.rng(); return Math.sqrt(-2 * Math.log(u)) * Math.cos(2 * Math.PI * w); };
      if (dt > 0) {
        e.p = [e.p[0] + sig * g(), e.p[1] + sig * g(), e.p[2] + sig * g()];
        dq.setFromEuler(new THREE.Euler(0.15 * sig * g(), 0.15 * sig * g(), 0.15 * sig * g()));
        e.q.multiply(dq).normalize();
      }
      A.setMatrixAt(i, m4.compose(v.set(...e.p), e.q, uno));
      const pe = new THREE.Vector3(0.9, 6.0, 2.2).applyQuaternion(e.q).add(v.set(...e.p));
      B.setMatrixAt(i, m4.compose(pe, e.q, uno));
    });
    A.instanceMatrix.needsUpdate = true; B.instanceMatrix.needsUpdate = true;
  });
  return (
    <>
      <instancedMesh ref={a} args={[geoARNt, matA, n]} frustumCulled={false} />
      <instancedMesh ref={b} args={[geoEF, matB, n]} frustumCulled={false} />
    </>
  );
}
