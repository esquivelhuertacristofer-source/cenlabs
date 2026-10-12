'use client';
/**
 * _kit/montaje.tsx — soporte universal, nuez, pinzas, aro, mechero, parrilla
 * agitadora, baño de hielo y termómetro.
 *
 * Montaje en soporte (coordenadas):
 *   <SoporteUniversal position={…}>            origen = pie de la varilla, varilla en +Y
 *     <Nuez altura={3.4}>                      la nuez se sujeta a la varilla a esa altura;
 *       <Pinza tipo="bureta" diametro={0.13}>  sus hijos van en el canal del brazo (+X) y la
 *         <Bureta position={[0, -4.6, 0]} />   pinza avanza en +Z: sus hijos quedan en el
 *       </Pinza>                               CENTRO DEL AGARRE.
 *     </Nuez>
 *   </SoporteUniversal>
 * `puntoAgarre(altura, largo)` da ese centro en coordenadas del soporte.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mm, defCristalizador, type P2 } from './perfiles';
import { geoCache, tornear, cajaRedondeada, cilindro, toro, esfera, extruir, formaRectRedondeado, tuboPolilinea } from './geometria';
import { useMateriales } from './materiales';
import { azar, familiaTexto, useTexturaLienzo } from './texturas';
import { Cristalizador } from './cristaleria';
import { bandaSobrePerfil } from './geometria';

type GroupProps = ThreeElements['group'];

// ───────────────────────────── soporte universal ─────────────────────────────

export const SOPORTE = {
  /** la base sobresale hacia +Z desde la varilla */
  base: { ancho: 1.6, fondo: 2.5, alto: 0.16, desplazamientoZ: 0.85 },
  radioVarilla: mm(6),
};
export const NUEZ_DX = mm(26); // del eje de la varilla al eje del canal del brazo
export const PINZA_LARGO = 1.6;

export function puntoAgarre(altura: number, largo = PINZA_LARGO): [number, number, number] {
  return [NUEZ_DX, altura, largo];
}

/** Soporte universal: base de fundición pintada + varilla de acero. */
export function SoporteUniversal({ alturaVarilla = 6, children, ...g }: GroupProps & { alturaVarilla?: number }) {
  const m = useMateriales();
  const B = SOPORTE.base;
  const geoBase = useMemo(() => geoCache('baseSoporte', () => {
    // plancha de esquinas redondeadas con chaflán superior (perfil extruido + tapa)
    const s = formaRectRedondeado(B.ancho, B.fondo, 0.14);
    const geo = extruir(s, B.alto - 0.03, 20);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }), [B.ancho, B.fondo, B.alto]);
  const geoTapa = useMemo(() => geoCache('tapaSoporte', () => {
    const s = formaRectRedondeado(B.ancho - 0.06, B.fondo - 0.06, 0.11);
    const geo = extruir(s, 0.03, 20);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }), [B.ancho, B.fondo]);
  const geoBoss = useMemo(() => geoCache('bossSoporte', () =>
    tornear([[0.0005, 0], [0.2, 0], [0.2, 0.02], [0.15, 0.09], [0.1, 0.12], [0.0005, 0.12]], 40)), []);
  return (
    <group {...g}>
      <group position={[0, 0, B.desplazamientoZ]}>
        <mesh geometry={geoBase} material={m.hierroPintado} castShadow receiveShadow />
        <mesh geometry={geoTapa} material={m.hierroPintado} position={[0, B.alto - 0.03, 0]} castShadow receiveShadow />
      </group>
      <mesh geometry={geoBoss} material={m.hierroPintado} position={[0, B.alto - 0.01, 0]} castShadow />
      <mesh geometry={cilindro(SOPORTE.radioVarilla, SOPORTE.radioVarilla, alturaVarilla, 24)} material={m.acero} position={[0, alturaVarilla / 2 + 0.1, 0]} castShadow />
      <mesh geometry={esfera(SOPORTE.radioVarilla, 16)} material={m.acero} position={[0, alturaVarilla + 0.1, 0]} scale={[1, 0.4, 1]} />
      {children}
    </group>
  );
}

/** Tornillo de mariposa (T) con vástago; el eje del tornillo es +Y local. */
function TornilloT({ largo = 0.22, giro = 0, escala = 0.75, material }: { largo?: number; giro?: number; escala?: number; material: THREE.Material }) {
  const m = useMateriales();
  const geoAla = useMemo(() => geoCache('alaTornillo', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.2, -0.035); s.quadraticCurveTo(-0.24, 0, -0.2, 0.05); s.lineTo(-0.06, 0.03);
    s.lineTo(0.06, 0.03); s.lineTo(0.2, 0.05); s.quadraticCurveTo(0.24, 0, 0.2, -0.035); s.lineTo(-0.2, -0.035);
    const geo = extruir(s, 0.035, 8); geo.translate(0, 0, -0.0175);
    return geo;
  }), []);
  return (
    <group rotation-y={giro}>
      <mesh geometry={cilindro(0.028, 0.028, largo, 16)} material={m.acero} position={[0, largo / 2, 0]} />
      <group position={[0, largo, 0]} scale={escala}>
        <mesh geometry={cilindro(0.05, 0.05, 0.05, 20)} material={material} position={[0, 0.02, 0]} castShadow />
        <mesh geometry={geoAla} material={material} position={[0, 0.07, 0]} castShadow />
      </group>
    </group>
  );
}

/** Nuez doble (boss head): sujeta la varilla y ofrece un canal horizontal para el brazo
 *  de una pinza o un aro. Los hijos se colocan en el canal del brazo. */
export function Nuez({ altura = 3, giro = 0, children, ...g }: GroupProps & { altura?: number; giro?: number }) {
  const m = useMateriales();
  const cuerpo = m.pintura('#9aa3aa');
  return (
    <group position={[0, altura, 0]} rotation-y={giro} {...g}>
      {/* bloque de fundición inyectada: dos cuerpos cruzados */}
      <mesh geometry={cajaRedondeada(0.3, 0.42, 0.26, 0.04, 2)} material={cuerpo} position={[0.02, 0, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(0.24, 0.26, 0.36, 0.04, 2)} material={cuerpo} position={[NUEZ_DX, -0.02, 0.02]} castShadow receiveShadow />
      {/* tornillo que aprieta la varilla (sale por −Z) y el del brazo (sale por +Y) */}
      <group position={[0.0, 0.05, -0.12]} rotation-x={-Math.PI / 2}><TornilloT material={m.plastico('#1e2328', 0.5)} /></group>
      <group position={[NUEZ_DX, 0.1, 0.03]}><TornilloT largo={0.16} giro={0.6} material={m.plastico('#1e2328', 0.5)} /></group>
      <group position={[NUEZ_DX, -0.02, 0]}>{children}</group>
    </group>
  );
}

export interface PropsPinza extends GroupProps {
  tipo?: 'bureta' | 'matraz';
  /** diámetro del objeto sujetado (u) */
  diametro?: number;
  largo?: number;
  colorForro?: string;
}
/** Pinza de bureta (mordazas en V forradas) o de tres dedos para matraz. Avanza en +Z. */
export function Pinza({ tipo = 'bureta', diametro = 0.13, largo = PINZA_LARGO, colorForro = '#b8352b', children, ...g }: PropsPinza) {
  const m = useMateriales();
  const forro = m.plastico(colorForro, 0.7);
  const r = diametro / 2;
  // dedos curvos forrados de vinilo que abrazan un cilindro de radio r: dos para la
  // bureta (pinza de dos dedos), tres para el matraz (dos arriba y abajo de un lado, uno
  // en medio del otro)
  const grueso = tipo === 'bureta' ? mm(4) : mm(4.5);
  const zCuerpo = -r - mm(42);
  const dedos = useMemo(() => {
    const rr = r + grueso + mm(0.5);
    const crea = (lado: number, dy: number) => {
      // tallo que sale del cuerpo hacia +Z y se curva (Catmull-Rom centrípeta, sin
      // esquinas) para rodear el objeto desde su espalda hasta pasado su costado
      const ctrl: THREE.Vector3[] = [
        new THREE.Vector3(lado * mm(10), dy, zCuerpo + mm(8)),
        new THREE.Vector3(lado * mm(12), dy, (zCuerpo + mm(8) - rr) / 2),
      ];
      const a0 = -Math.PI / 2 + 0.35, a1 = Math.PI * (tipo === 'bureta' ? 0.2 : 0.28);
      for (let i = 0; i <= 8; i++) {
        const a = a0 + ((a1 - a0) * i) / 8;
        ctrl.push(new THREE.Vector3(lado * rr * Math.cos(a), dy, rr * Math.sin(a)));
      }
      const curva = new THREE.CatmullRomCurve3(ctrl, false, 'centripetal');
      const pts = curva.getSpacedPoints(48);
      const arr = new Float32Array(pts.length * 3);
      pts.forEach((p, i) => p.toArray(arr, i * 3));
      return { geo: tuboPolilinea(arr, grueso, 14, false), ini: pts[0], fin: pts[pts.length - 1] };
    };
    return tipo === 'bureta'
      ? [crea(1, mm(6)), crea(-1, -mm(6))]
      : [crea(1, mm(15)), crea(1, -mm(15)), crea(-1, 0)];
  }, [tipo, r, grueso, zCuerpo]);
  useEffect(() => () => { dedos.forEach((d) => d.geo.dispose()); }, [dedos]);
  const punta = esfera(grueso, 14);
  const largoBrazo = Math.max(0.1, largo + zCuerpo - mm(14) + 0.12);
  const cuerpo = m.pintura('#8f989f');
  return (
    <group {...g}>
      {/* brazo */}
      <mesh geometry={cilindro(mm(5), mm(5), largoBrazo, 20)} material={m.acero} rotation-x={Math.PI / 2} position={[0, 0, largoBrazo / 2 - 0.12]} castShadow />
      <group position={[0, 0, largo]}>
        {/* cuerpo fundido donde nacen los dedos, con el tornillo de apriete lateral */}
        <mesh geometry={cajaRedondeada(0.16, 0.13, 0.26, 0.03, 2)} material={cuerpo} position={[0, 0, zCuerpo - mm(4)]} castShadow />
        <group position={[mm(7), 0, zCuerpo + mm(6)]} rotation-z={-Math.PI / 2}><TornilloT largo={0.09} escala={0.55} material={m.plastico('#1e2328', 0.5)} /></group>
        {dedos.map((d, i) => (
          <group key={i}>
            <mesh geometry={d.geo} material={forro} castShadow />
            {/* puntas redondeadas (el vinilo del forro termina en bola) */}
            <mesh geometry={punta} material={forro} position={d.fin} />
            <mesh geometry={punta} material={forro} position={d.ini} />
          </group>
        ))}
        {children}
      </group>
    </group>
  );
}

/** Aro de hierro con brazo y abrazadera; los hijos quedan en el centro del aro. */
export function Aro({ altura = 2, diametro = 1.0, conRejilla = false, children, ...g }: GroupProps & { altura?: number; diametro?: number; conRejilla?: boolean }) {
  const m = useMateriales();
  const R = diametro / 2;
  return (
    <group position={[0, altura, 0]} {...g}>
      <mesh geometry={cajaRedondeada(0.26, 0.24, 0.3, 0.04, 2)} material={m.pintura('#3f5566')} position={[0, 0, 0.05]} castShadow />
      <group position={[0.06, 0.02, -0.14]} rotation-x={-Math.PI / 2}><TornilloT largo={0.12} material={m.plastico('#1e2328', 0.5)} /></group>
      <mesh geometry={cilindro(mm(4), mm(4), 0.5, 12)} material={m.hierroPintado} rotation-x={Math.PI / 2} position={[0, 0, 0.42]} castShadow />
      <mesh geometry={toro(R, mm(3.5), 10, 64)} material={m.hierroPintado} rotation-x={Math.PI / 2} position={[0, 0, 0.62 + R]} castShadow />
      <group position={[0, mm(3.5), 0.62 + R]}>
        {conRejilla && <RejillaAlambre lado={diametro * 1.25} />}
        {children}
      </group>
    </group>
  );
}

/** Tela de alambre con centro cerámico (rejilla de asbesto ya no: cerámica). */
export function RejillaAlambre({ lado = 1.4, ...g }: GroupProps & { lado?: number }) {
  const m = useMateriales();
  const tex = useTexturaLienzo(256, 256, (ctx, w, h) => {
    ctx.clearRect(0, 0, w, h);
    ctx.strokeStyle = '#6d7175'; ctx.lineWidth = 1.6;
    for (let i = 0; i <= w; i += 8) { ctx.beginPath(); ctx.moveTo(i, 0); ctx.lineTo(i, h); ctx.stroke(); ctx.beginPath(); ctx.moveTo(0, i); ctx.lineTo(w, i); ctx.stroke(); }
    ctx.strokeStyle = '#4a4e52'; ctx.lineWidth = 4; ctx.strokeRect(2, 2, w - 4, h - 4);
  }, []);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.3, metalness: 0.6, roughness: 0.5, side: THREE.DoubleSide }), [tex]);
  useEffect(() => () => mat.dispose(), [mat]);
  return (
    <group {...g}>
      <mesh rotation-x={-Math.PI / 2} material={mat} castShadow receiveShadow><planeGeometry args={[lado, lado]} /></mesh>
      <mesh geometry={cilindro(lado * 0.3, lado * 0.3, mm(1.5), 32)} material={m.plastico('#d9d4c8', 0.95)} position={[0, mm(0.8), 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── mechero Bunsen ─────────────────────────────

const VS_LLAMA = /* glsl */ `
  uniform float uTiempo; uniform float uOnda;
  varying float vAltura; varying vec3 vN; varying vec3 vV;
  void main() {
    vec3 p = position;
    float h = clamp(p.y, 0.0, 1.0);
    float ondula = sin(uTiempo * 9.0 + p.y * 7.0) * 0.06 + sin(uTiempo * 15.3 + p.y * 13.0) * 0.03;
    p.x += ondula * h * h * uOnda;
    p.z += cos(uTiempo * 11.0 + p.y * 9.0) * 0.04 * h * h * uOnda;
    vAltura = h;
    vec4 mv = modelViewMatrix * vec4(p, 1.0);
    vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
    gl_Position = projectionMatrix * mv;
  }`;
const FS_LLAMA = /* glsl */ `
  uniform vec3 uColorBase; uniform vec3 uColorPunta; uniform float uIntensidad;
  varying float vAltura; varying vec3 vN; varying vec3 vV;
  void main() {
    float borde = pow(abs(dot(normalize(vN), normalize(vV))), 1.6);
    vec3 c = mix(uColorBase, uColorPunta, smoothstep(0.0, 1.0, vAltura));
    float a = borde * (1.0 - smoothstep(0.55, 1.0, vAltura)) * smoothstep(0.0, 0.08, vAltura) * uIntensidad;
    gl_FragColor = vec4(c * a, a);
  }`;

function useMaterialLlama(base: string, punta: string, intensidad: number, onda: number) {
  const mat = useMemo(() => new THREE.ShaderMaterial({
    vertexShader: VS_LLAMA, fragmentShader: FS_LLAMA, transparent: true, depthWrite: false,
    blending: THREE.AdditiveBlending, side: THREE.DoubleSide, toneMapped: false,
    uniforms: { uTiempo: { value: 0 }, uOnda: { value: onda }, uColorBase: { value: new THREE.Color(base) }, uColorPunta: { value: new THREE.Color(punta) }, uIntensidad: { value: intensidad } },
  }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => {
    mat.uniforms.uColorBase.value.set(base); mat.uniforms.uColorPunta.value.set(punta);
    mat.uniforms.uIntensidad.value = intensidad; mat.uniforms.uOnda.value = onda;
  }, [mat, base, punta, intensidad, onda]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

/** Cono de llama de altura 1 (escalable): perfil de gota. */
function geoLlama(): THREE.BufferGeometry {
  return geoCache('llama', () => {
    const p: P2[] = [];
    for (let i = 0; i <= 24; i++) {
      const t = i / 24;
      const r = Math.sin(Math.PI * Math.pow(t, 0.62)) * (1 - t * 0.35) * 0.5;
      p.push([Math.max(0.0005, r), t]);
    }
    p[0][0] = 0.0005; p[p.length - 1][0] = 0.0005;
    return tornear(p, 24);
  });
}

export interface PropsMechero extends GroupProps {
  encendido?: boolean;
  /** apertura del collar de aire 0…1: 0 = llama luminosa amarilla; 1 = llama azul con cono interior */
  aire?: number;
  /** caudal de gas 0…1 (altura de la llama) */
  gas?: number;
}
/** Mechero Bunsen con llama animada. Boca del tubo a y = MECHERO_BOCA. */
export const MECHERO_BOCA = 1.62;
export function MecheroBunsen({ encendido = true, aire = 0.8, gas = 0.7, ...g }: PropsMechero) {
  const m = useMateriales();
  const a = Math.max(0, Math.min(1, aire)), q = Math.max(0.1, Math.min(1, gas));
  const exterior = useMaterialLlama(a > 0.5 ? '#3b5bff' : '#ff8a1c', a > 0.5 ? '#7c4dff' : '#ffd36b', a > 0.5 ? 0.55 + 0.2 * a : 0.95, a > 0.5 ? 0.35 : 1.2);
  const interior = useMaterialLlama('#59c8ff', '#9be7ff', 1.1 * a, 0.15);
  const grupoLlama = useRef<THREE.Group>(null);
  useFrame((st) => {
    const t = st.clock.elapsedTime;
    exterior.uniforms.uTiempo.value = t; interior.uniforms.uTiempo.value = t;
    if (grupoLlama.current) grupoLlama.current.scale.y = 1 + Math.sin(t * 23) * 0.02 + Math.sin(t * 7.1) * 0.02 * (1 - a);
  });
  const geoBase = useMemo(() => geoCache('baseMechero', () =>
    tornear([[0.0005, 0], [0.42, 0], [0.45, 0.02], [0.44, 0.06], [0.36, 0.1], [0.16, 0.16], [0.1, 0.22], [0.0005, 0.22]], 40)), []);
  const geoCollar = useMemo(() => geoCache('collarMechero', () =>
    tornear([[0.072, 0], [0.076, 0.005], [0.076, 0.215], [0.072, 0.22], [0.065, 0.22], [0.065, 0], [0.072, 0]], 32)), []);
  const alturaLlama = (a > 0.5 ? 0.75 : 1.1) * (0.5 + q * 0.7);
  return (
    <group {...g}>
      <mesh geometry={geoBase} material={m.hierroPintado} castShadow receiveShadow />
      {/* entrada de gas con espiga */}
      <group position={[0, 0.28, 0]}>
        <mesh geometry={cilindro(0.06, 0.06, 0.22, 24)} material={m.laton} castShadow />
        <mesh geometry={cilindro(0.032, 0.04, 0.42, 16)} material={m.laton} rotation-z={Math.PI / 2} position={[-0.28, -0.02, 0]} castShadow />
        {[0, 1, 2].map((i) => <mesh key={i} geometry={cilindro(0.036, 0.046, 0.05, 16)} material={m.laton} rotation-z={Math.PI / 2} position={[-0.36 - i * 0.055, -0.02, 0]} />)}
        {/* válvula de aguja (perilla moleteada) */}
        <mesh geometry={cilindro(0.06, 0.06, 0.09, 18)} material={m.plastico('#2b2f33', 0.6)} rotation-z={Math.PI / 2} position={[0.12, -0.06, 0]} castShadow />
      </group>
      {/* tubo */}
      <mesh geometry={cilindro(0.058, 0.058, 1.25, 28)} material={m.laton} position={[0, 0.39 + 0.62, 0]} castShadow />
      {/* collar de aire: gira con `aire` y deja ver la ventana */}
      <group position={[0, 0.42, 0]} rotation-y={a * Math.PI * 0.5}>
        <mesh geometry={geoCollar} material={m.laton} castShadow />
      </group>
      <mesh geometry={toro(0.058, 0.006, 6, 24)} material={m.laton} rotation-x={Math.PI / 2} position={[0, MECHERO_BOCA, 0]} />
      {encendido && (
        <group ref={grupoLlama} position={[0, MECHERO_BOCA + 0.005, 0]}>
          <mesh geometry={geoLlama()} material={exterior} scale={[0.22 + 0.1 * (1 - a), alturaLlama, 0.22 + 0.1 * (1 - a)]} renderOrder={20} />
          {a > 0.35 && <mesh geometry={geoLlama()} material={interior} scale={[0.12, alturaLlama * 0.38 * (0.6 + 0.4 * a), 0.12]} renderOrder={21} />}
        </group>
      )}
    </group>
  );
}

// ───────────────────────────── parrilla agitadora ─────────────────────────────

/** Altura de la placa de la parrilla (donde se apoya un vaso). */
export const PARRILLA_ALTURA = 0.87;
/** Centro de la placa (donde va el vaso), en coordenadas de la parrilla. */
export const PARRILLA_CENTRO: [number, number, number] = [0, 0.87, -0.12];

/** Barra magnética de PTFE (25 mm). Gira a `rpm`. Origen apoyado en el fondo. */
export function BarraMagnetica({ rpm = 0, largo = 0.25, ...g }: GroupProps & { rpm?: number; largo?: number }) {
  const m = useMateriales();
  const ref = useRef<THREE.Group>(null);
  const geo = useMemo(() => geoCache(`barraMag:${largo}`, () => {
    const g2 = new THREE.CapsuleGeometry(mm(3.8), largo - mm(7.6), 8, 16);
    g2.rotateZ(Math.PI / 2);
    return g2;
  }), [largo]);
  useFrame((_, dt) => { if (ref.current && rpm > 0) ref.current.rotation.y += (rpm / 60) * Math.PI * 2 * Math.min(dt, 0.05); });
  return (
    <group {...g}>
      <group ref={ref} position={[0, mm(3.8), 0]}>
        <mesh geometry={geo} material={m.ptfe} castShadow />
        <mesh geometry={toro(mm(3.9), mm(0.9), 8, 20)} material={m.ptfe} rotation-y={Math.PI / 2} />
      </group>
    </group>
  );
}

/** Parrilla de calentamiento con agitación magnética: placa cerámica 18×18 cm, dos perillas. */
export function ParrillaAgitadora({ calor = 0, agitacion = 0, encendida = true, ...g }: GroupProps & { calor?: number; agitacion?: number; encendida?: boolean }) {
  const m = useMateriales();
  const placa = useMemo(() => geoCache('placaParrilla', () => {
    const s = formaRectRedondeado(1.8, 1.8, 0.12);
    const geo = extruir(s, 0.05, 12); geo.rotateX(-Math.PI / 2);
    return geo;
  }), []);
  const panel = useMemo(() => geoCache('panelParrilla', () => {
    // perfil lateral de la carcasa con frente inclinado (extruido en X)
    const s = new THREE.Shape();
    s.moveTo(-1.35, 0); s.lineTo(1.25, 0); s.quadraticCurveTo(1.35, 0, 1.35, 0.1); s.lineTo(1.35, 0.42);
    s.lineTo(1.05, 0.82); s.lineTo(-1.25, 0.82); s.quadraticCurveTo(-1.35, 0.82, -1.35, 0.72); s.lineTo(-1.35, 0);
    const geo = extruir(s, 2.0, 8); geo.translate(0, 0, -1.0);
    // rotar −90° en Y: la X de la forma pasa a +Z (el frente inclinado mira al alumno)
    geo.rotateY(-Math.PI / 2);
    return geo;
  }), []);
  const carcasa = m.plastico('#e6e8e9', 0.42);
  const tapaPanel = m.plastico('#2c3238', 0.5);
  const ang = (v: number) => -2.4 + v * 4.8;
  const rpmMax = 1500;
  const angAg = ang(Math.min(1, agitacion / rpmMax));
  const pendiente = Math.atan2(0.3, 0.4); // el frente sube 0,4 en 0,3 de fondo
  return (
    <group {...g}>
      <mesh geometry={panel} material={carcasa} castShadow receiveShadow />
      <mesh geometry={placa} material={m.ceramica} position={[0, 0.82, -0.12]} castShadow receiveShadow />
      <mesh material={m.plastico('#c9ced2', 0.5)} position={[0, 0.85, -0.12]} receiveShadow>
        <boxGeometry args={[1.84, 0.03, 1.84]} />
      </mesh>
      {/* frente inclinado con dos perillas y pilotos */}
      <group position={[0, 0.62, 1.2]} rotation-x={-pendiente}>
        <mesh material={tapaPanel} position={[0, 0, 0.005]}><boxGeometry args={[1.86, 0.44, 0.01]} /></mesh>
        {[{ x: -0.48, v: ang(calor) }, { x: 0.48, v: angAg }].map((k, i) => (
          <group key={i} position={[k.x, -0.02, 0.01]} rotation-x={Math.PI / 2}>
            <mesh geometry={cilindro(0.13, 0.14, 0.12, 32)} material={m.plastico('#1b1f23', 0.55)} position={[0, 0.06, 0]} castShadow />
            <group rotation-y={k.v}>
              <mesh material={m.plastico('#f2f2f2', 0.4)} position={[0, 0.125, -0.07]}><boxGeometry args={[0.018, 0.012, 0.11]} /></mesh>
            </group>
          </group>
        ))}
        <mesh geometry={esfera(0.022, 12)} material={encendida && calor > 0.01 ? m.emisor('#ff7a1a', 3) : m.plastico('#55331c')} position={[-0.12, 0.12, 0.012]} />
        <mesh geometry={esfera(0.022, 12)} material={encendida && agitacion > 0 ? m.emisor('#40d06a', 2.5) : m.plastico('#1f3a26')} position={[0.12, 0.12, 0.012]} />
      </group>
    </group>
  );
}

// ───────────────────────────── baño de hielo ─────────────────────────────

/** Baño de hielo: cristalizador con agua y cubos de hielo flotando. */
export function BanoHielo({ diametro = 190, cubos = 14, nivel = 0.6, colorAgua = '#d7ecf3', ...g }: GroupProps & { diametro?: 100 | 150 | 190; cubos?: number; nivel?: number; colorAgua?: string }) {
  const m = useMateriales();
  const def = defCristalizador(diametro);
  const vol = def.volumenHastaAltura(def.y0 + (def.yMax - def.y0) * nivel);
  const ySup = def.alturaParaVolumen(vol);
  const ref = useRef<THREE.InstancedMesh>(null);
  const geoCubo = cajaRedondeada(0.24, 0.2, 0.22, 0.05, 2);
  useEffect(() => {
    const im = ref.current; if (!im) return;
    const rnd = azar(diametro + cubos);
    const o = new THREE.Object3D();
    const Rmax = def.radioInteriorEn(ySup) - 0.16;
    for (let i = 0; i < cubos; i++) {
      const a = rnd() * Math.PI * 2, r = Math.sqrt(rnd()) * Rmax;
      o.position.set(Math.sin(a) * r, ySup - 0.03 + rnd() * 0.05, Math.cos(a) * r);
      o.rotation.set((rnd() - 0.5) * 0.6, rnd() * Math.PI, (rnd() - 0.5) * 0.6);
      const s = 0.8 + rnd() * 0.45; o.scale.set(s, s * (0.8 + rnd() * 0.3), s);
      o.updateMatrix(); im.setMatrixAt(i, o.matrix);
    }
    im.instanceMatrix.needsUpdate = true;
  }, [cubos, diametro, def, ySup]);
  return (
    <group {...g}>
      <Cristalizador diametro={diametro} liquido={{ volumenML: vol, color: colorAgua, menisco: 0.5 }} />
      <instancedMesh ref={ref} args={[geoCubo, m.hielo, cubos]} castShadow />
    </group>
  );
}

// ───────────────────────────── termómetro ─────────────────────────────

export interface PropsTermometro extends GroupProps {
  temperatura?: number;
  min?: number;
  max?: number;
  liquido?: 'alcohol' | 'mercurio';
  /** longitud total (u); 3,05 = 305 mm */
  longitud?: number;
}
/** Termómetro de líquido en vidrio con franja esmaltada. Origen en la PUNTA del bulbo, eje +Y. */
export function Termometro({ temperatura = 20, min = -10, max = 110, liquido = 'alcohol', longitud = 3.05, ...g }: PropsTermometro) {
  const m = useMateriales();
  const R = mm(3.3), bulboL = mm(14), y0 = bulboL + mm(28); // la escala empieza 28 mm sobre el bulbo
  const y1 = longitud - mm(30);
  const yDe = (T: number) => y0 + ((T - min) / (max - min)) * (y1 - y0);
  const solido: P2[] = useMemo(() => [
    [0.0005, 0], [mm(1.5), mm(0.4)], [mm(2.5), mm(2)], [mm(2.6), bulboL - mm(2)], [mm(2.2), bulboL + mm(2)],
    [R, bulboL + mm(8)], [R, longitud - mm(4)], [R * 0.8, longitud - mm(0.8)], [0.0005, longitud],
  ], [R, bulboL, longitud]);
  const segs = m.calidad === 'alta' ? 32 : 18;
  const geoVidrio = useMemo(() => geoCache(`termometro:${longitud}:${segs}`, () => tornear(solido, segs)), [longitud, segs, solido]);
  const rEn = (y: number) => (y < bulboL + mm(8) ? mm(2.6) : R);
  const color = liquido === 'alcohol' ? '#d3262e' : '#c5c9cc';
  const matCol = liquido === 'alcohol' ? m.plastico(color, 0.35) : m.cromo;
  const ARCO = 2.5;
  const altoBanda = y1 - y0 + mm(12);
  const HPX = 3000, WPX = Math.max(32, Math.round((HPX * ARCO * R) / altoBanda));
  const tex = useTexturaLienzo(WPX, HPX, (ctx, W, H) => {
    const fam = familiaTexto();
    const pxmm = H / (altoBanda * 100);
    const py = (y: number) => H - ((y - (y0 - mm(6))) / altoBanda) * H;
    ctx.fillStyle = '#111417';
    for (let T = Math.ceil(min); T <= max; T++) {
      const y = py(yDe(T));
      const l = T % 10 === 0 ? 0.34 : T % 5 === 0 ? 0.24 : 0.15;
      ctx.fillRect(0, y - pxmm * 0.12, W * l, pxmm * 0.24);
      if (T % 10 === 0) {
        ctx.font = `600 ${pxmm * 2.3}px ${fam}`; ctx.textBaseline = 'middle';
        ctx.fillText(String(T), W * 0.38, y);
      }
    }
    ctx.font = `700 ${pxmm * 2.4}px ${fam}`; ctx.textBaseline = 'middle'; ctx.fillText('°C', W * 0.38, py(y1) + pxmm * 4);
  }, [min, max, longitud]);  const banda = useMemo(() => {
    const geo = bandaSobrePerfil(rEn, y0 - mm(6), y1 + mm(6), { arco: ARCO, centro: 0.35, holgura: 0.0008, filas: 8, segmentos: 16 });
    return geo;
  }, [y0, y1]); // eslint-disable-line react-hooks/exhaustive-deps
  const franja = useMemo(() => bandaSobrePerfil(rEn, bulboL + mm(10), longitud - mm(8), { arco: 1.6, centro: Math.PI, holgura: 0.0008, filas: 4, segmentos: 10 }), [bulboL, longitud]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => { banda.dispose(); franja.dispose(); }, [banda, franja]);
  const matBanda = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }), [tex]);
  useEffect(() => () => matBanda.dispose(), [matBanda]);
  const T = Math.max(min - 2, Math.min(max + 2, temperatura));
  const hCol = Math.max(0.001, yDe(T) - (bulboL - mm(2)));
  return (
    <group {...g}>
      <mesh geometry={geoVidrio} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh geometry={banda} material={matBanda} renderOrder={2} />
      <mesh geometry={franja} material={m.impreso('#f4f4f1')} />
      {/* bulbo lleno y columna capilar (cilindro unitario escalado: no se regenera) */}
      <mesh geometry={esfera(1, 16)} material={matCol} position={[0, bulboL / 2 + mm(0.5), 0]} scale={[mm(2.0), bulboL / 2 - mm(0.3), mm(2.0)]} />
      <mesh geometry={cilindro(1, 1, 1, 10)} material={matCol} position={[0, bulboL - mm(2) + hCol / 2, 0]} scale={[mm(0.9), hCol, mm(0.9)]} />
    </group>
  );
}
