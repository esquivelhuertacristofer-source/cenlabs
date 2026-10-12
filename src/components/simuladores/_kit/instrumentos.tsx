'use client';
/**
 * _kit/instrumentos.tsx — instrumentos de medida con lectura por prop.
 *
 * Todas las carátulas, pantallas y escalas se DIBUJAN en lienzo (sin red). Las
 * pantallas sólo se redibujan cuando cambia su lectura; las agujas se mueven por
 * transformación (no se regenera nada por fotograma).
 *
 * Orígenes: los aparatos de banco (multímetro, fuente, balanza, cronómetro) tienen
 * el origen en el centro de su base, apoyados en y = 0, con el frente hacia +Z.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import { mm, type P2 } from './perfiles';
import { geoCache, tornear, cajaRedondeada, cilindro, toro, esfera, extruir, tuboPolilinea } from './geometria';
import { puntosCatenaria, formatoCronometro, dinamometroAlargamiento } from './calculos';
import { useMateriales } from './materiales';
import { familiaTexto, useTexturaLienzo, dibujarSieteSegmentos, fmt } from './texturas';

type GroupProps = ThreeElements['group'];
type V3 = [number, number, number];

/** Material de pantalla (emisivo: es una pantalla que emite o un LCD retroiluminado). */
function useMatPantalla(tex: THREE.Texture | null, emisiva = true, brillo = 1) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({
    map: tex, emissiveMap: emisiva ? tex : null, emissive: emisiva ? new THREE.Color('#ffffff') : new THREE.Color('#000000'),
    emissiveIntensity: emisiva ? 0.55 * brillo : 0, roughness: 0.35, metalness: 0,
  }), [tex, emisiva, brillo]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}
function useMatImpreso(tex: THREE.Texture | null, rugosidad = 0.5, transparente = false) {
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, roughness: rugosidad, metalness: 0, alphaTest: transparente ? 0.35 : 0, transparent: false }), [tex, rugosidad, transparente]);
  useEffect(() => () => mat.dispose(), [mat]);
  return mat;
}

// ───────────────────────────── cable con catenaria ─────────────────────────────

export interface PropsCable { desde: V3; hasta: V3; holgura?: number; grosor?: number; color?: string; ySuelo?: number; segmentos?: number }
/** Cable flexible con forma de catenaria (TubeGeometry propio). Se regenera sólo al cambiar extremos. */
export function Cable({ desde, hasta, holgura = 0.25, grosor = mm(2), color = '#c62828', ySuelo, segmentos = 56 }: PropsCable) {
  const m = useMateriales();
  const clave = [...desde, ...hasta, holgura, grosor, ySuelo ?? 'x', segmentos].map(String).join(',');
  const geo = useMemo(() => tuboPolilinea(puntosCatenaria(desde, hasta, holgura, segmentos, ySuelo !== undefined ? ySuelo + grosor : undefined), grosor, 8, false),
    [clave]); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => geo.dispose(), [geo]);
  return <mesh geometry={geo} material={m.plastico(color, 0.55)} castShadow />;
}

// ───────────────────────────── manómetro / reloj analógico ─────────────────────────────

export interface PropsManometro extends GroupProps {
  valor?: number; min?: number; max?: number; unidad?: string; titulo?: string;
  /** número de divisiones numeradas (por defecto 10) y menores por división */
  divisiones?: number; menores?: number;
  /** zona coloreada del arco [desde, hasta] (p. ej. sobrepresión) */
  zonaRoja?: [number, number];
  /** diámetro de la carátula en u (0,63 = 63 mm) */
  diametro?: number;
  conVastago?: boolean;
  /** constante de tiempo de la aguja (s); 0 = instantánea */
  suavizado?: number;
  decimales?: number;
}
/** Manómetro de Bourdon / carátula analógica. Origen en el centro de la carátula, mira a +Z. */
export function Manometro({
  valor = 0, min = 0, max = 10, unidad = 'bar', titulo, divisiones = 10, menores = 5, zonaRoja, diametro = 0.63,
  conVastago = true, suavizado = 0.25, decimales, ...g
}: PropsManometro) {
  const m = useMateriales();
  const R = diametro / 2;
  const tex = useTexturaLienzo(1024, 1024, (ctx, W) => {
    const fam = familiaTexto();
    const c = W / 2, r = W * 0.46;
    const grad = ctx.createRadialGradient(c, c * 0.8, r * 0.1, c, c, r * 1.1);
    grad.addColorStop(0, '#ffffff'); grad.addColorStop(1, '#eceeec');
    ctx.fillStyle = grad; ctx.beginPath(); ctx.arc(c, c, W / 2, 0, Math.PI * 2); ctx.fill();
    const a0 = (-225 * Math.PI) / 180, a1 = (45 * Math.PI) / 180; // 270° de arco, cero abajo-izquierda
    const ang = (v: number) => a0 + ((v - min) / (max - min)) * (a1 - a0);
    if (zonaRoja) {
      ctx.strokeStyle = '#d32f2f'; ctx.lineWidth = W * 0.03;
      ctx.beginPath(); ctx.arc(c, c, r * 0.86, ang(zonaRoja[0]), ang(zonaRoja[1])); ctx.stroke();
    }
    ctx.strokeStyle = '#15191c'; ctx.fillStyle = '#15191c';
    ctx.lineWidth = W * 0.004;
    ctx.beginPath(); ctx.arc(c, c, r * 0.92, a0, a1); ctx.stroke();
    const total = divisiones * menores;
    const dec = decimales ?? (Math.abs((max - min) / divisiones) < 1 ? 1 : 0);
    for (let i = 0; i <= total; i++) {
      const v = min + ((max - min) * i) / total;
      const a = ang(v);
      const mayor = i % menores === 0;
      const r1 = r * 0.92, r2 = r * (mayor ? 0.8 : i % (menores / (menores % 2 === 0 ? 2 : 1)) === 0 && menores % 2 === 0 ? 0.85 : 0.87);
      ctx.lineWidth = W * (mayor ? 0.009 : 0.004);
      ctx.beginPath(); ctx.moveTo(c + Math.cos(a) * r1, c + Math.sin(a) * r1); ctx.lineTo(c + Math.cos(a) * r2, c + Math.sin(a) * r2); ctx.stroke();
      if (mayor) {
        ctx.font = `600 ${W * 0.068}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(v.toFixed(dec), c + Math.cos(a) * r * 0.66, c + Math.sin(a) * r * 0.66);
      }
    }
    ctx.font = `700 ${W * 0.07}px ${fam}`; ctx.fillText(unidad, c, c + r * 0.42);
    if (titulo) { ctx.font = `500 ${W * 0.045}px ${fam}`; ctx.fillStyle = '#4a5157'; ctx.fillText(titulo, c, c - r * 0.36); }
    ctx.font = `500 ${W * 0.032}px ${fam}`; ctx.fillStyle = '#6a7177'; ctx.fillText('CL 1.6', c, c + r * 0.62);
  }, [min, max, unidad, titulo, divisiones, menores, zonaRoja?.[0], zonaRoja?.[1], decimales]);
  const matCara = useMatImpreso(tex, 0.6);
  const geoCaja = useMemo(() => geoCache(`cajaManometro:${diametro}`, () => {
    const p: P2[] = [[0.0005, -0.12 * diametro / 0.63], [R * 0.98, -0.12 * diametro / 0.63], [R * 1.04, -0.1 * diametro / 0.63], [R * 1.04, 0.0], [R * 0.99, 0.004], [R * 0.99, -0.004], [0.0005, -0.004]];
    const geo = tornear(p, 48); geo.rotateX(Math.PI / 2); // eje del torno → +Z
    return geo;
  }), [diametro, R]);
  const geoBisel = useMemo(() => geoCache(`biselManometro:${diametro}`, () => {
    const p: P2[] = [[R * 0.97, 0.0], [R * 1.06, 0.0], [R * 1.08, 0.02], [R * 1.05, 0.045], [R * 0.99, 0.05], [R * 0.95, 0.03], [R * 0.97, 0.0]];
    const geo = tornear(p, 48); geo.rotateX(Math.PI / 2); // eje del torno → +Z
    return geo;
  }), [diametro, R]);
  const geoAguja = useMemo(() => geoCache('agujaManometro', () => {
    const s = new THREE.Shape();
    s.moveTo(-0.018, -0.12); s.lineTo(0.018, -0.12); s.lineTo(0.007, 0.84); s.lineTo(0, 0.88); s.lineTo(-0.007, 0.84); s.lineTo(-0.018, -0.12);
    return extruir(s, 0.012, 4);
  }), []);
  const aguja = useRef<THREE.Group>(null);
  const objetivo = useRef(0);
  const angulo = (v: number) => (135 - 270 * ((Math.max(min - (max - min) * 0.02, Math.min(max * 1.02, v)) - min) / (max - min))) * (Math.PI / 180);
  objetivo.current = angulo(valor);
  useEffect(() => { if (aguja.current && suavizado <= 0) aguja.current.rotation.z = objetivo.current; }, [valor, suavizado]);
  useFrame((_, dt) => {
    const a = aguja.current; if (!a) return;
    if (suavizado <= 0) { a.rotation.z = objetivo.current; return; }
    a.rotation.z += (objetivo.current - a.rotation.z) * Math.min(1, dt / suavizado);
  });
  return (
    <group {...g}>
      <mesh geometry={geoCaja} material={m.carcasaOscura} castShadow />
      <mesh geometry={geoBisel} material={m.cromo} castShadow />
      <mesh material={matCara} position={[0, 0, 0.002]}><circleGeometry args={[R * 0.97, 64]} /></mesh>
      <group ref={aguja} position={[0, 0, 0.014]} scale={[R * 0.9, R * 0.9, 1]}>
        <mesh geometry={geoAguja} material={m.plastico('#1a1d20', 0.4)} />
      </group>
      <mesh geometry={cilindro(R * 0.07, R * 0.07, 0.03, 20)} material={m.plastico('#1a1d20', 0.3)} rotation-x={Math.PI / 2} position={[0, 0, 0.022]} />
      <mesh material={m.vidrio} position={[0, 0, 0.04]} renderOrder={3}><circleGeometry args={[R * 0.97, 48]} /></mesh>
      {conVastago && (
        <group position={[0, -R * 1.02, -0.06 * diametro / 0.63]}>
          <mesh geometry={cilindro(0.05, 0.05, 0.12, 6)} material={m.laton} position={[0, -0.08, 0]} castShadow />
          <mesh geometry={cilindro(0.032, 0.032, 0.18, 16)} material={m.laton} position={[0, -0.22, 0]} castShadow />
        </group>
      )}
    </group>
  );
}
/** Alias: reloj analógico genérico. */
export const AnalogGauge = Manometro;

// ───────────────────────────── multímetro digital ─────────────────────────────

export type ModoMultimetro = 'OFF' | 'V⎓' | 'V~' | 'mV' | 'Ω' | 'A' | 'mA' | 'continuidad';
const MODOS: ModoMultimetro[] = ['OFF', 'V⎓', 'V~', 'mV', 'Ω', 'continuidad', 'mA', 'A'];

export interface PropsMultimetro extends GroupProps {
  lectura?: number | string;
  unidad?: string;
  modo?: ModoMultimetro;
  /** posición de la punta roja y negra (coordenadas LOCALES del multímetro) */
  puntaRoja?: V3; puntaNegra?: V3;
  /** dirección hacia la que apunta cada punta (del mango a la punta) */
  direccionRoja?: V3; direccionNegra?: V3;
  conPuntas?: boolean;
  /** inclinación hacia atrás (rad), como apoyado en su patita */
  inclinacion?: number;
  decimales?: number;
}

const MM = { ancho: 0.9, alto: 1.8, fondo: 0.42 };
/** Posición local de las bornas (mA, COM, VΩ, 10A) en la cara del multímetro. */
export const MULTIMETRO_BORNAS = { A: [-0.3, 0.2] as [number, number], mA: [-0.1, 0.2] as [number, number], COM: [0.1, 0.2] as [number, number], V: [0.3, 0.2] as [number, number] };

/** Multímetro digital de mano con funda, LCD, selector y puntas con cable en catenaria. */
export function MultimetroDigital({
  lectura = 0, unidad = 'V', modo = 'V⎓', puntaRoja = [0.6, 0.02, 1.4], puntaNegra = [-0.5, 0.02, 1.5],
  direccionRoja = [0.3, -0.3, 1], direccionNegra = [-0.3, -0.3, 1], conPuntas = true, inclinacion = 0.22, decimales = 2, ...g
}: PropsMultimetro) {
  const m = useMateriales();
  const texto = typeof lectura === 'number' ? (modo === 'OFF' ? '' : fmt(lectura, decimales)) : lectura;
  const lcd = useTexturaLienzo(512, 240, (ctx, W, H) => {
    ctx.fillStyle = '#b7c2a6'; ctx.fillRect(0, 0, W, H);
    const gr = ctx.createLinearGradient(0, 0, 0, H); gr.addColorStop(0, 'rgba(255,255,255,0.18)'); gr.addColorStop(1, 'rgba(0,0,0,0.08)');
    ctx.fillStyle = gr; ctx.fillRect(0, 0, W, H);
    if (modo === 'OFF') return;
    dibujarSieteSegmentos(ctx, texto, W * 0.8, H * 0.2, H * 0.58, '#1b2119', 'rgba(27,33,25,0.06)', 0.1, 4);
    const fam = familiaTexto();
    ctx.fillStyle = '#1b2119';
    ctx.font = `700 ${H * 0.2}px ${fam}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText(unidad, W * 0.83, H * 0.76);
    ctx.font = `600 ${H * 0.11}px ${fam}`;
    ctx.fillText(modo === 'V~' ? 'AC' : modo === 'V⎓' || modo === 'mV' ? 'DC' : '', W * 0.05, H * 0.17);
    ctx.fillText('AUTO', W * 0.18, H * 0.17);
  }, [texto, unidad, modo]);
  const cara = useTexturaLienzo(512, 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#2a2f34'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#e8ecef'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${W * 0.06}px ${fam}`; ctx.fillText('MULTÍMETRO DIGITAL', W / 2, H * 0.035);
    // leyenda del selector alrededor del centro (cx, cy)
    const cx = W / 2, cy = H * 0.53, r = W * 0.36;
    MODOS.forEach((md, i) => {
      const a = -Math.PI / 2 - Math.PI * 0.75 + (i / (MODOS.length - 1)) * Math.PI * 1.5;
      ctx.fillStyle = md === 'OFF' ? '#f2f2f2' : md.includes('A') ? '#ffcc4d' : '#e8ecef';
      ctx.font = `700 ${W * 0.052}px ${fam}`;
      ctx.fillText(md === 'continuidad' ? '•))' : md, cx + Math.cos(a) * r, cy + Math.sin(a) * r);
    });
    ctx.strokeStyle = '#55606a'; ctx.lineWidth = 3; ctx.beginPath(); ctx.arc(cx, cy, W * 0.26, 0, Math.PI * 2); ctx.stroke();
    // bornas
    const etq = ['10A', 'mA', 'COM', 'VΩ'];
    etq.forEach((t, i) => {
      ctx.fillStyle = i === 2 ? '#e8ecef' : i < 2 ? '#ffcc4d' : '#ff6b5e';
      ctx.font = `700 ${W * 0.045}px ${fam}`;
      ctx.fillText(t, W * (0.17 + i * 0.22), H * 0.955);
    });
    ctx.fillStyle = '#ff6b5e'; ctx.font = `600 ${W * 0.03}px ${fam}`; ctx.fillText('CAT III 600V', W * 0.5, H * 0.79);
  }, []);
  const matLcd = useMatPantalla(lcd, false);
  const matCara = useMatImpreso(cara, 0.6);
  const iModo = Math.max(0, MODOS.indexOf(modo));
  const angSel = Math.PI * 0.75 - (iModo / (MODOS.length - 1)) * Math.PI * 1.5;
  const funda = m.plastico('#f2a516', 0.75);
  // bornas en coordenadas locales (cara frontal en z = fondo/2)
  const zCara = MM.fondo / 2 + 0.005;
  const bornas = useMemo(() => {
    const o = (x: number): V3 => [x, 0.17, zCara];
    return { A: o(-0.33), mA: o(-0.11), COM: o(0.11), V: o(0.33) };
  }, [zCara]);
  return (
    <group {...g}>
      <group rotation-x={-inclinacion} position={[0, 0, -MM.fondo / 2]}>
        <group position={[0, 0, MM.fondo / 2]}>
          <mesh geometry={cajaRedondeada(MM.ancho, MM.alto, MM.fondo, 0.12, 4)} material={funda} position={[0, MM.alto / 2, 0]} castShadow receiveShadow />
          <mesh geometry={cajaRedondeada(MM.ancho - 0.12, MM.alto - 0.14, 0.04, 0.05, 2)} material={m.carcasaOscura} position={[0, MM.alto / 2, MM.fondo / 2 - 0.005]} />
          <mesh material={matCara} position={[0, MM.alto / 2 - 0.02, zCara + 0.012]}><planeGeometry args={[MM.ancho - 0.16, MM.alto - 0.22]} /></mesh>
          {/* ventana LCD */}
          <mesh material={m.carcasaOscura} position={[0, 1.42, zCara + 0.014]}><planeGeometry args={[0.72, 0.36]} /></mesh>
          <mesh material={matLcd} position={[0, 1.42, zCara + 0.016]}><planeGeometry args={[0.66, 0.31]} /></mesh>
          {/* selector rotatorio */}
          <group position={[0, MM.alto / 2 - 0.02 + (0.5 - 0.53) * (MM.alto - 0.22), zCara + 0.012]}>
            <mesh geometry={cilindro(0.2, 0.21, 0.06, 40)} material={m.plastico('#1b1e21', 0.5)} rotation-x={Math.PI / 2} position={[0, 0, 0.03]} castShadow />
            <group rotation-z={angSel}>
              <mesh material={m.plastico('#1b1e21', 0.5)} position={[0, 0.0, 0.08]} castShadow><boxGeometry args={[0.07, 0.38, 0.06]} /></mesh>
              <mesh material={m.plastico('#f4f4f4', 0.4)} position={[0, 0.15, 0.112]}><boxGeometry args={[0.018, 0.07, 0.005]} /></mesh>
            </group>
          </group>
          {/* bornas */}
          {(Object.entries(bornas) as [keyof typeof bornas, V3][]).map(([k, p]) => (
            <group key={k} position={p}>
              <mesh geometry={cilindro(0.055, 0.055, 0.03, 20)} material={k === 'COM' ? m.plastico('#1b1e21') : k === 'V' ? m.plastico('#c62828') : m.plastico('#e0a800')} rotation-x={Math.PI / 2} />
              <mesh geometry={cilindro(0.025, 0.025, 0.032, 16)} material={m.plastico('#050505', 0.9)} rotation-x={Math.PI / 2} position={[0, 0, 0.002]} />
            </group>
          ))}
          {conPuntas && <Clavija posicion={bornas.V} color="#c62828" />}
          {conPuntas && <Clavija posicion={bornas.COM} color="#1d1f22" />}
        </group>
      </group>
      {conPuntas && (
        <>
          <PuntaPrueba punta={puntaRoja} direccion={direccionRoja} color="#c62828" />
          <PuntaPrueba punta={puntaNegra} direccion={direccionNegra} color="#1d1f22" />
          <CableMultimetro inclinacion={inclinacion} borna={bornas.V} punta={puntaRoja} direccion={direccionRoja} color="#c62828" />
          <CableMultimetro inclinacion={inclinacion} borna={bornas.COM} punta={puntaNegra} direccion={direccionNegra} color="#1d1f22" />
        </>
      )}
    </group>
  );
}

function Clavija({ posicion, color }: { posicion: V3; color: string }) {
  const m = useMateriales();
  return (
    <group position={posicion}>
      <mesh geometry={cilindro(0.04, 0.045, 0.16, 16)} material={m.plastico(color, 0.5)} rotation-x={Math.PI / 2} position={[0, 0, 0.08]} castShadow />
      <mesh geometry={cilindro(0.03, 0.04, 0.08, 16)} material={m.plastico(color, 0.5)} rotation-x={Math.PI / 2} position={[0, 0, 0.2]} />
    </group>
  );
}

const LARGO_PUNTA = 1.25;
function PuntaPrueba({ punta, direccion, color }: { punta: V3; direccion: V3; color: string }) {
  const m = useMateriales();
  const q = useMemo(() => {
    const d = new THREE.Vector3(...direccion).normalize();
    return new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, -1, 0), d);
  }, [direccion[0], direccion[1], direccion[2]]); // eslint-disable-line react-hooks/exhaustive-deps
  const geo = useMemo(() => geoCache('mangoPunta', () => tornear([
    [0.0005, 0.22], [0.012, 0.22], [0.022, 0.26], [0.03, 0.28], [0.055, 0.3], [0.055, 0.33], [0.036, 0.35], [0.04, 0.6], [0.042, 1.1], [0.036, 1.2], [0.022, 1.25], [0.0005, 1.25],
  ], 20)), []);
  // el mango se construye con la punta en el origen y el cuerpo hacia +Y; q lleva −Y a la dirección,
  // así el cuerpo queda DETRÁS de la punta
  return (
    <group position={punta} quaternion={q}>
      <mesh geometry={cilindro(0.002, 0.008, 0.22, 10)} material={m.acero} position={[0, 0.11, 0]} />
      <mesh geometry={geo} material={m.plastico(color, 0.45)} castShadow />
    </group>
  );
}

function CableMultimetro({ borna, punta, direccion, color, inclinacion }: { borna: V3; punta: V3; direccion: V3; color: string; inclinacion: number }) {
  // extremo trasero de la clavija (en el marco inclinado) → coordenadas del multímetro
  const desde = useMemo((): V3 => {
    // mismo encadenado que el JSX: (0,0,−D/2) + Rx(−incl)·(p + (0,0,D/2))
    const v = new THREE.Vector3(borna[0], borna[1], borna[2] + 0.24 + MM.fondo / 2).applyAxisAngle(new THREE.Vector3(1, 0, 0), -inclinacion);
    return [v.x, v.y, v.z - MM.fondo / 2];
  }, [borna, inclinacion]);
  const hasta = useMemo((): V3 => {
    const d = new THREE.Vector3(...direccion).normalize();
    return [punta[0] - d.x * LARGO_PUNTA, punta[1] - d.y * LARGO_PUNTA, punta[2] - d.z * LARGO_PUNTA];
  }, [punta, direccion]);
  return <Cable desde={desde} hasta={hasta} holgura={0.35} grosor={mm(2.2)} color={color} ySuelo={0} />;
}

// ───────────────────────────── fuente de alimentación ─────────────────────────────

export interface PropsFuente extends GroupProps { voltaje?: number; corriente?: number; encendida?: boolean; limitando?: boolean }
/** Fuente de banco de CD con displays de 7 segmentos (V rojo, A verde), perillas y bornes. */
export function FuenteBanco({ voltaje = 12, corriente = 0.5, encendida = true, limitando = false, ...g }: PropsFuente) {
  const m = useMateriales();
  const W = 1.9, H = 1.3, D = 2.4;
  const disp = useTexturaLienzo(512, 160, (ctx, w, h) => {
    ctx.fillStyle = '#0d0f10'; ctx.fillRect(0, 0, w, h);
    if (!encendida) return;
    dibujarSieteSegmentos(ctx, fmt(voltaje, voltaje < 10 ? 2 : 1), w * 0.45, h * 0.2, h * 0.56, '#ff3b2f', 'rgba(255,59,47,0.07)', 0.08, 4);
    dibujarSieteSegmentos(ctx, fmt(corriente, 3), w * 0.95, h * 0.2, h * 0.56, '#3cff6a', 'rgba(60,255,106,0.07)', 0.08, 4);
  }, [voltaje, corriente, encendida]);
  const panel = useTexturaLienzo(768, 512, (ctx, w, h) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#30363c'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#d9dee2'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
    ctx.font = `700 ${h * 0.05}px ${fam}`; ctx.fillText('FUENTE DE CD  0–30 V / 0–5 A', w * 0.5, h * 0.06);
    ctx.font = `600 ${h * 0.045}px ${fam}`;
    ctx.fillText('VOLTAJE', w * 0.25, h * 0.47); ctx.fillText('CORRIENTE', w * 0.75, h * 0.47);
    ctx.fillText('V', w * 0.43, h * 0.17); ctx.fillText('A', w * 0.93, h * 0.17);
    ctx.fillText('CV', w * 0.08, h * 0.62); ctx.fillText('CC', w * 0.08, h * 0.72);
    ctx.fillText('+', w * 0.62, h * 0.92); ctx.fillText('GND', w * 0.75, h * 0.92); ctx.fillText('−', w * 0.88, h * 0.92);
    ctx.fillText('ENCENDIDO', w * 0.2, h * 0.92);
  }, []);
  const matDisp = useMatPantalla(disp, true, 1.3);
  const matPanel = useMatImpreso(panel, 0.6);
  const zF = D / 2 + 0.006;
  const xD = (u: number) => -W / 2 + u * W, yD = (v: number) => H - v * H;
  const perilla = (x: number, y: number, v: number) => (
    <group position={[x, y, zF]}>
      <mesh geometry={cilindro(0.11, 0.12, 0.1, 28)} material={m.plastico('#16191c', 0.5)} rotation-x={Math.PI / 2} position={[0, 0, 0.05]} castShadow />
      <mesh material={m.plastico('#e9e9e9', 0.4)} rotation-z={2.4 - v * 4.8} position={[0, 0, 0.102]}><boxGeometry args={[0.014, 0.16, 0.004]} /></mesh>
    </group>
  );
  const borne = (x: number, color: string) => (
    <group position={[x, yD(0.83), zF]}>
      <mesh geometry={cilindro(0.05, 0.055, 0.12, 6)} material={m.plastico(color, 0.45)} rotation-x={Math.PI / 2} position={[0, 0, 0.06]} castShadow />
      <mesh geometry={cilindro(0.022, 0.022, 0.05, 12)} material={m.laton} rotation-x={Math.PI / 2} position={[0, 0, 0.14]} />
    </group>
  );
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(W, H, D, 0.04, 2)} material={m.pintura('#c9ced2')} position={[0, H / 2, 0]} castShadow receiveShadow />
      <mesh material={matPanel} position={[0, H / 2, zF - 0.003]}><planeGeometry args={[W - 0.06, H - 0.06]} /></mesh>
      <mesh material={matDisp} position={[0, yD(0.2), zF]}><planeGeometry args={[W * 0.86, W * 0.86 * (160 / 512)]} /></mesh>
      {perilla(xD(0.25), yD(0.64), Math.min(1, voltaje / 30))}
      {perilla(xD(0.75), yD(0.64), Math.min(1, corriente / 5))}
      <mesh geometry={esfera(0.022, 10)} material={encendida && !limitando ? m.emisor('#3cff6a', 2) : m.plastico('#203a26')} position={[xD(0.14), yD(0.62), zF]} />
      <mesh geometry={esfera(0.022, 10)} material={encendida && limitando ? m.emisor('#ff3b2f', 2) : m.plastico('#3a2020')} position={[xD(0.14), yD(0.72), zF]} />
      {borne(xD(0.62), '#c62828')}{borne(xD(0.75), '#2e7d32')}{borne(xD(0.88), '#1d1f22')}
      <mesh geometry={cajaRedondeada(0.24, 0.13, 0.06, 0.02, 2)} material={encendida ? m.plastico('#2e7d32', 0.5) : m.plastico('#1d1f22', 0.5)} position={[xD(0.2), yD(0.83), zF + 0.02]} castShadow />
      {/* patas de goma */}
      {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
        <mesh key={i} geometry={cilindro(0.07, 0.08, 0.04, 12)} material={m.goma} position={[a * (W / 2 - 0.15), -0.0, b * (D / 2 - 0.2)]} />
      ))}
    </group>
  );
}

// ───────────────────────────── balanza analítica ─────────────────────────────

/** Centro del platillo (superficie) de la balanza, en sus coordenadas. */
export const BALANZA_PLATO: V3 = [0, 1.12, -0.35];

export interface PropsBalanza extends GroupProps { lectura?: number; decimales?: number; unidad?: string; puertaAbierta?: number; encendida?: boolean; estable?: boolean }
/** Balanza analítica (0,1 mg) con cámara antirráfagas de vidrio y display. */
export function BalanzaAnalitica({ lectura = 0, decimales = 4, unidad = 'g', puertaAbierta = 0, encendida = true, estable = true, ...g }: PropsBalanza) {
  const m = useMateriales();
  const W = 2.2, D = 3.4, hBase = 0.95;
  const disp = useTexturaLienzo(640, 160, (ctx, w, h) => {
    ctx.fillStyle = encendida ? '#c9d6c2' : '#38403a'; ctx.fillRect(0, 0, w, h);
    if (!encendida) return;
    dibujarSieteSegmentos(ctx, fmt(lectura, decimales), w * 0.84, h * 0.2, h * 0.52, '#18211a', 'rgba(24,33,26,0.05)', 0.06, 8);
    const fam = familiaTexto();
    ctx.fillStyle = '#18211a'; ctx.font = `700 ${h * 0.36}px ${fam}`; ctx.textBaseline = 'alphabetic';
    ctx.fillText(unidad, w * 0.87, h * 0.78);
    if (estable) { ctx.font = `700 ${h * 0.2}px ${fam}`; ctx.fillText('○', w * 0.03, h * 0.35); }
  }, [lectura, decimales, unidad, encendida, estable]);
  const panel = useTexturaLienzo(512, 128, (ctx, w, h) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#e8eaeb'; ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#5b646b'; ctx.textAlign = 'center'; ctx.textBaseline = 'middle'; ctx.font = `700 ${h * 0.2}px ${fam}`;
    ['ON/OFF', 'CAL', 'MODE', 'TARE', 'TARE'].forEach((t, i) => ctx.fillText(t, w * (0.1 + i * 0.2), h * 0.25));
  }, []);
  const matDisp = useMatPantalla(disp, true, 0.6);
  const matPanel = useMatImpreso(panel);
  const carcasa = m.plastico('#eef0f0', 0.4);
  const marco = m.plastico('#d9dcde', 0.45);
  const camH = 2.3, camW = W - 0.1, camD = 2.3, z0 = -0.35;
  const ap = Math.max(0, Math.min(1, puertaAbierta));
  return (
    <group {...g}>
      {/* base con frente inclinado */}
      <mesh geometry={cajaRedondeada(W, hBase, D, 0.1, 3)} material={carcasa} position={[0, hBase / 2, 0]} castShadow receiveShadow />
      <group position={[0, hBase * 0.42, D / 2 + 0.17]} rotation-x={-0.5}>
        <mesh geometry={cajaRedondeada(W - 0.12, 0.56, 0.08, 0.04, 2)} material={m.plastico('#dfe2e4', 0.5)} castShadow />
        <mesh material={m.carcasaOscura} position={[0, 0.08, 0.042]}><planeGeometry args={[1.5, 0.36]} /></mesh>
        <mesh material={matDisp} position={[0, 0.08, 0.044]}><planeGeometry args={[1.42, 0.31]} /></mesh>
        <mesh material={matPanel} position={[0, -0.2, 0.042]}><planeGeometry args={[1.9, 0.12]} /></mesh>
        {[0, 1, 2, 3, 4].map((i) => (
          <mesh key={i} geometry={cajaRedondeada(0.24, 0.07, 0.04, 0.02, 2)} material={i >= 3 ? m.plastico('#2f6fc4', 0.5) : m.plastico('#9aa3aa', 0.5)} position={[-0.76 + i * 0.38, -0.2, 0.05]} />
        ))}
      </group>
      {/* nivel de burbuja */}
      <mesh geometry={cilindro(0.06, 0.06, 0.02, 20)} material={m.plastico('#c8e88a', 0.2)} position={[0.85, hBase + 0.005, D / 2 - 0.35]} />
      {/* platillo con guardaplato */}
      <mesh geometry={cilindro(0.48, 0.48, 0.02, 48)} material={m.acero} position={[BALANZA_PLATO[0], BALANZA_PLATO[1] - 0.01, BALANZA_PLATO[2]]} castShadow receiveShadow />
      <mesh geometry={cilindro(0.05, 0.05, BALANZA_PLATO[1] - hBase, 12)} material={m.acero} position={[0, (BALANZA_PLATO[1] + hBase) / 2, z0]} />
      <mesh geometry={toro(0.62, 0.012, 6, 48)} material={m.acero} rotation-x={Math.PI / 2} position={[0, hBase + 0.06, z0]} />
      {/* cámara antirráfagas: marco + paneles de vidrio; la puerta derecha se desliza hacia atrás */}
      <group position={[0, hBase, z0]}>
        {[[-1, -1], [1, -1], [-1, 1], [1, 1]].map(([a, b], i) => (
          <mesh key={i} material={marco} position={[a * camW / 2, camH / 2, b * camD / 2]} castShadow><boxGeometry args={[0.06, camH, 0.06]} /></mesh>
        ))}
        <mesh geometry={cajaRedondeada(camW + 0.06, 0.12, camD + 0.06, 0.03, 2)} material={marco} position={[0, camH, 0]} castShadow />
        <mesh material={m.vidrio} position={[0, camH / 2, -camD / 2]} renderOrder={3}><boxGeometry args={[camW, camH - 0.1, 0.02]} /></mesh>
        <mesh material={m.vidrio} position={[0, camH / 2, camD / 2]} renderOrder={3}><boxGeometry args={[camW, camH - 0.1, 0.02]} /></mesh>
        <mesh material={m.vidrio} position={[-camW / 2, camH / 2, 0]} renderOrder={3}><boxGeometry args={[0.02, camH - 0.1, camD]} /></mesh>
        <mesh material={m.vidrio} position={[camW / 2 + 0.03, camH / 2, -ap * camD * 0.85]} renderOrder={3}><boxGeometry args={[0.02, camH - 0.1, camD]} /></mesh>
        <mesh material={m.plastico('#cfd3d6', 0.4)} position={[camW / 2 + 0.06, camH * 0.55, camD * 0.38 - ap * camD * 0.85]}><boxGeometry args={[0.04, 0.4, 0.06]} /></mesh>
        <mesh material={m.vidrio} position={[0, camH - 0.02, 0]} renderOrder={3}><boxGeometry args={[camW, 0.02, camD]} /></mesh>
      </group>
    </group>
  );
}

// ───────────────────────────── dinamómetro ─────────────────────────────

export interface PropsDinamometro extends GroupProps { fuerza?: number; max?: number; longitud?: number; colorTapa?: string }
/** Dinamómetro de resorte (tubo transparente). Origen en la ANILLA superior; cuelga hacia −Y. */
export function Dinamometro({ fuerza = 0, max = 10, longitud = 2.6, colorTapa = '#2e7d32', ...g }: PropsDinamometro) {
  const m = useMateriales();
  const R = 0.11, escala = longitud * 0.72, yCero = -0.32;
  const dx = dinamometroAlargamiento(fuerza, max, longitud);
  const tex = useTexturaLienzo(128, 1600, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f4f2ea'; ctx.fillRect(0, 0, W, H);
    const pasos = max <= 2 ? max * 20 : max <= 10 ? max * 10 : max * 2;
    const num = max <= 2 ? 0.5 : max <= 10 ? 1 : 5;
    ctx.fillStyle = '#121416';
    for (let i = 0; i <= pasos; i++) {
      const v = (i / pasos) * max;
      const y = 40 + (i / pasos) * (H - 80);
      const mayor = Math.abs(v / num - Math.round(v / num)) < 1e-6;
      ctx.fillRect(0, y - 1.5, W * (mayor ? 0.45 : 0.25), 3);
      if (mayor) { ctx.font = `700 34px ${fam}`; ctx.textBaseline = 'middle'; ctx.fillText(String(+v.toFixed(2)), W * 0.52, y); }
    }
    ctx.font = `700 30px ${fam}`; ctx.fillText('N', W * 0.6, 18);
  }, [max]);
  const matEscala = useMatImpreso(tex);
  const geoResorte = useMemo(() => geoCache('resorteDinamometro', () => {
    const pts: number[] = [];
    const n = 22, seg = n * 16;
    for (let i = 0; i <= seg; i++) { const t = i / seg; const a = t * n * Math.PI * 2; pts.push(Math.cos(a) * 0.05, -t, Math.sin(a) * 0.05); }
    return tuboPolilinea(new Float32Array(pts), 0.007, 6, false);
  }), []);
  const largoResorte = escala * 0.5 + dx;
  return (
    <group {...g}>
      <mesh geometry={toro(0.07, 0.012, 8, 24)} material={m.acero} position={[0, 0.0, 0]} castShadow />
      <mesh geometry={cilindro(0.012, 0.012, 0.12, 8)} material={m.acero} position={[0, -0.11, 0]} />
      <mesh geometry={cilindro(R + 0.012, R + 0.012, 0.12, 24)} material={m.plastico(colorTapa, 0.45)} position={[0, -0.22, 0]} castShadow />
      {/* tubo exterior transparente */}
      <mesh geometry={cilindro(R, R, longitud * 0.84, 28, true)} material={m.plasticoClaro} position={[0, -0.28 - longitud * 0.42, 0]} renderOrder={3} />
      {/* tubo interior con la escala */}
      <mesh material={matEscala} position={[0, yCero - escala / 2, 0]} rotation-y={0.35}>
        <cylinderGeometry args={[R * 0.72, R * 0.72, escala + 0.08, 24, 1, true, -0.9, 1.8]} />
      </mesh>
      {/* resorte (se estira escalando: la hélice es de alambre fino) */}
      <mesh geometry={geoResorte} material={m.acero} position={[0, yCero + 0.02, 0]} scale={[1, largoResorte, 1]} />
      {/* índice deslizante y vástago con gancho */}
      <group position={[0, yCero - dx, 0]}>
        <mesh geometry={cilindro(R * 0.9, R * 0.9, 0.03, 24)} material={m.plastico('#d32f2f', 0.4)} position={[0, -escala * 0.0, 0]} />
        <mesh geometry={cilindro(0.012, 0.012, longitud * 0.84 - 0.1, 8)} material={m.acero} position={[0, -(longitud * 0.84 - 0.1) / 2, 0]} />
        <group position={[0, -longitud * 0.84 + 0.02, 0]}>
          <Gancho />
        </group>
      </group>
    </group>
  );
}

/** Gancho en S/J de alambre de acero; origen en el punto de cuelgue superior. */
export function Gancho({ radio = 0.05, alambre = 0.009 }: { radio?: number; alambre?: number }) {
  const m = useMateriales();
  const geo = useMemo(() => geoCache(`gancho:${radio}:${alambre}`, () => {
    const pts: number[] = [0, 0, 0, 0, -radio * 1.2, 0];
    for (let i = 0; i <= 20; i++) { const a = Math.PI + (i / 20) * Math.PI * 1.35; pts.push(radio * Math.cos(a) + radio, -radio * 1.2 + radio * Math.sin(a), 0); }
    return tuboPolilinea(new Float32Array(pts), alambre, 8, true);
  }), [radio, alambre]);
  return <mesh geometry={geo} material={m.acero} castShadow />;
}

// ───────────────────────────── fotopuerta ─────────────────────────────

/** Fotopuerta en U con emisor/receptor infrarrojo y LED. Origen en el HAZ (centro del hueco). */
export function Fotopuerta({ bloqueada = false, abertura = 0.75, ...g }: GroupProps & { bloqueada?: boolean; abertura?: number }) {
  const m = useMateriales();
  const cuerpo = m.plastico('#23272b', 0.55);
  const brazoAlto = 0.95, grosor = 0.17, ancho = abertura + 2 * grosor, fondo = 0.26;
  const yBase = -0.55;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(ancho, 0.22, fondo, 0.05, 2)} material={cuerpo} position={[0, yBase, 0]} castShadow receiveShadow />
      {[-1, 1].map((s) => (
        <group key={s} position={[s * (abertura / 2 + grosor / 2), yBase + brazoAlto / 2, 0]}>
          <mesh geometry={cajaRedondeada(grosor, brazoAlto + 0.1, fondo, 0.05, 2)} material={cuerpo} castShadow receiveShadow />
          <mesh geometry={cilindro(0.035, 0.035, 0.02, 16)} material={m.plastico(s < 0 ? '#3b1a1a' : '#111111', 0.2)} rotation-z={Math.PI / 2} position={[-s * (grosor / 2 + 0.003), -yBase - brazoAlto / 2, 0]} />
        </group>
      ))}
      <mesh geometry={esfera(0.04, 12)} material={bloqueada ? m.emisor('#ff3030', 3) : m.plastico('#4a1d1d', 0.3)} position={[-(abertura / 2 + grosor / 2), yBase + brazoAlto + 0.06, 0.06]} />
      <mesh geometry={cilindro(mm(5), mm(5), 1.2, 16)} material={m.acero} position={[0, yBase - 0.7, 0]} castShadow />
    </group>
  );
}

// ───────────────────────────── cronómetro ─────────────────────────────

/** Cronómetro digital de mano (de pie, pantalla hacia +Z). */
export function Cronometro({ tiempo = 0, corriendo = false, ...g }: GroupProps & { tiempo?: number; corriendo?: boolean }) {
  const m = useMateriales();
  const txt = formatoCronometro(tiempo);
  const lcd = useTexturaLienzo(512, 200, (ctx, w, h) => {
    ctx.fillStyle = '#c3cbb6'; ctx.fillRect(0, 0, w, h);
    dibujarSieteSegmentos(ctx, txt, w * 0.95, h * 0.26, h * 0.5, '#1a1f18', 'rgba(26,31,24,0.06)', 0.08, 0);
    const fam = familiaTexto();
    ctx.fillStyle = '#1a1f18'; ctx.font = `700 ${h * 0.13}px ${fam}`; ctx.fillText(corriendo ? '▶ RUN' : 'STOP', w * 0.05, h * 0.15);
  }, [txt, corriendo]);
  const matLcd = useMatPantalla(lcd, false);
  const geoCuerpo = useMemo(() => geoCache('cuerpoCrono', () => {
    const s = new THREE.Shape(); s.absellipse(0, 0, 0.36, 0.42, 0, Math.PI * 2, false, 0);
    const geo = extruir(s, 0.16, 48); geo.translate(0, 0, -0.08);
    return geo;
  }), []);
  return (
    <group {...g}>
      <group position={[0, 0.44, 0]} rotation-x={-0.12}>
        <mesh geometry={geoCuerpo} material={m.plastico('#1f4e8c', 0.5)} castShadow receiveShadow />
        <mesh geometry={cajaRedondeada(0.56, 0.28, 0.02, 0.03, 2)} material={m.carcasaOscura} position={[0, 0.05, 0.08]} />
        <mesh material={matLcd} position={[0, 0.05, 0.092]}><planeGeometry args={[0.5, 0.2]} /></mesh>
        {[-0.2, 0, 0.2].map((x, i) => (
          <mesh key={i} geometry={cilindro(0.05, 0.055, 0.08, 16)} material={i === 1 ? m.plastico('#c62828', 0.4) : m.plastico('#d9dcde', 0.4)} position={[x, 0.42 - Math.abs(x) * 0.35, 0]} castShadow />
        ))}
        <mesh geometry={toro(0.05, 0.012, 8, 20)} material={m.acero} position={[0, -0.45, 0]} />
      </group>
    </group>
  );
}

// ───────────────────────────── reglas, cinta y transportador ─────────────────────────────

export interface PropsRegla extends GroupProps { longitud?: number; material?: 'madera' | 'acero' | 'plastico'; ancho?: number }
/** Regla graduada en cm y mm, apoyada (cara +Y). Origen en la marca 0; crece hacia +X. */
export function Regla({ longitud = 30, material = 'madera', ancho = 0.32, ...g }: PropsRegla) {
  const m = useMateriales();
  const L = longitud / 10; // cm → u
  const pxCm = 64;
  const tex = useTexturaLienzo(Math.min(8192, Math.round((longitud + 2) * pxCm)), Math.round(pxCm * ancho * 10), (ctx, W, H) => {
    const fam = familiaTexto();
    const base = material === 'madera' ? null : material === 'acero' ? '#d5d9dc' : '#f4f1e6';
    if (base) { ctx.fillStyle = base; ctx.fillRect(0, 0, W, H); } else { ctx.clearRect(0, 0, W, H); }
    ctx.fillStyle = material === 'acero' ? '#15181b' : '#1a1410';
    const x0 = pxCm; // 1 cm de margen
    for (let i = 0; i <= longitud * 10; i++) {
      const x = x0 + (i / 10) * pxCm;
      const l = i % 10 === 0 ? 0.36 : i % 5 === 0 ? 0.26 : 0.17;
      ctx.fillRect(x - 0.9, H - H * l, 1.8, H * l);
      if (i % 10 === 0) { ctx.font = `600 ${H * 0.2}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'alphabetic'; ctx.fillText(String(i / 10), x, H - H * 0.4); }
    }
    ctx.font = `600 ${H * 0.13}px ${fam}`; ctx.textAlign = 'left'; ctx.fillText('cm', x0 * 0.2, H * 0.2);
  }, [longitud, material, ancho]);
  const matCara = useMemo(() => {
    const base = material === 'madera' ? m.madera : material === 'acero' ? m.acero : m.plastico('#f4f1e6');
    const mt = (base as THREE.MeshStandardMaterial).clone();
    if (material === 'madera') { mt.map = m.madera.map; }
    return mt;
  }, [material, m]);
  const matEscala = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, transparent: false, alphaTest: material === 'madera' ? 0.35 : 0, roughness: material === 'acero' ? 0.4 : 0.6, metalness: material === 'acero' ? 0.6 : 0, polygonOffset: true, polygonOffsetFactor: -1 }), [tex, material]);
  useEffect(() => () => { matCara.dispose(); matEscala.dispose(); }, [matCara, matEscala]);
  const esp = material === 'acero' ? 0.012 : 0.03;
  const largoTotal = L + 0.2;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(largoTotal, esp, ancho, Math.min(esp / 2.1, 0.012), 2)} material={matCara} position={[L / 2, esp / 2, 0]} castShadow receiveShadow />
      <mesh material={matEscala} rotation-x={-Math.PI / 2} position={[L / 2, esp + 0.0008, 0]}><planeGeometry args={[largoTotal, ancho]} /></mesh>
    </group>
  );
}

/** Cinta métrica extendida (cinta amarilla de 19 mm). Origen en el cero (gancho); la caja queda en +X. */
export function CintaMetrica({ extension = 100, ...g }: GroupProps & { extension?: number }) {
  const m = useMateriales();
  const L = extension / 10;
  const pxCm = Math.min(40, 8000 / Math.max(1, extension)), ancho = 0.19;
  const tex = useTexturaLienzo(Math.round(extension * pxCm), Math.max(16, Math.round(ancho * 10 * pxCm)), (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.fillStyle = '#f2c230'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#111';
    const cada = pxCm >= 30 ? 1 : pxCm >= 12 ? 5 : 10;
    for (let i = 0; i <= extension * 10; i++) {
      const x = (i / 10) * pxCm;
      const l = i % 10 === 0 ? 0.4 : i % 5 === 0 ? 0.28 : 0.18;
      ctx.fillRect(x - 0.7, 0, 1.4, H * l);
      if (i % (10 * cada) === 0 && i > 0) { ctx.font = `700 ${H * 0.32}px ${fam}`; ctx.textAlign = 'center'; ctx.fillStyle = i % 100 === 0 ? '#c62828' : '#111'; ctx.fillText(String(i / 10), x, H * 0.82); ctx.fillStyle = '#111'; }
    }
  }, [extension]);
  const mat = useMatImpreso(tex, 0.45);
  return (
    <group {...g}>
      <mesh material={mat} rotation-x={-Math.PI / 2} position={[L / 2, 0.008, 0]} receiveShadow><planeGeometry args={[L, ancho]} /></mesh>
      <mesh material={m.acero} position={[-0.004, 0.03, 0]} castShadow><boxGeometry args={[0.012, 0.06, ancho]} /></mesh>
      <group position={[L + 0.3, 0, 0]}>
        <mesh geometry={cajaRedondeada(0.7, 0.7, 0.32, 0.16, 4)} material={m.plastico('#f2c230', 0.5)} position={[0, 0.35, 0]} castShadow receiveShadow />
        <mesh geometry={cilindro(0.2, 0.2, 0.34, 32)} material={m.plastico('#1d1f22', 0.6)} rotation-x={Math.PI / 2} position={[0, 0.35, 0]} />
        <mesh geometry={cajaRedondeada(0.18, 0.12, 0.34, 0.03, 2)} material={m.plastico('#1d1f22', 0.6)} position={[0, 0.66, 0]} />
      </group>
    </group>
  );
}

export interface PropsTransportador extends GroupProps { radio?: number; tipo?: 180 | 360; color?: string }
/** Transportador de plástico transparente. Origen en el vértice; 0° hacia +X, 90° hacia +Y (plano XY, mira a +Z). */
export function Transportador({ radio = 0.75, tipo = 180, color = '#0d47a1', ...g }: PropsTransportador) {
  const m = useMateriales();
  const tex = useTexturaLienzo(1024, tipo === 180 ? 560 : 1024, (ctx, W, H) => {
    const fam = familiaTexto();
    ctx.clearRect(0, 0, W, H);
    const cx = W / 2, cy = tipo === 180 ? H - 24 : H / 2, R = W / 2 - 8;
    ctx.strokeStyle = color; ctx.fillStyle = color;
    const n = tipo;
    for (let d = 0; d <= n; d++) {
      if (tipo === 360 && d === 360) continue;
      const a = (d * Math.PI) / 180;
      const l = d % 10 === 0 ? 0.13 : d % 5 === 0 ? 0.09 : 0.055;
      ctx.lineWidth = d % 10 === 0 ? 2.6 : 1.5;
      ctx.beginPath(); ctx.moveTo(cx + Math.cos(a) * R, cy - Math.sin(a) * R); ctx.lineTo(cx + Math.cos(a) * R * (1 - l), cy - Math.sin(a) * R * (1 - l)); ctx.stroke();
      if (d % 10 === 0) {
        ctx.font = `600 ${W * 0.026}px ${fam}`; ctx.textAlign = 'center'; ctx.textBaseline = 'middle';
        ctx.fillText(String(d), cx + Math.cos(a) * R * 0.8, cy - Math.sin(a) * R * 0.8);
        if (tipo === 180) { ctx.font = `500 ${W * 0.019}px ${fam}`; ctx.fillText(String(180 - d), cx + Math.cos(a) * R * 0.7, cy - Math.sin(a) * R * 0.7); }
      }
    }
    ctx.lineWidth = 2; ctx.beginPath(); ctx.moveTo(cx - R, cy); ctx.lineTo(cx + R, cy); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(cx, cy); ctx.lineTo(cx, cy - R * 0.5); ctx.stroke();
    ctx.beginPath(); ctx.arc(cx, cy, 6, 0, Math.PI * 2); ctx.stroke();
  }, [tipo, color]);
  const matEscala = useMemo(() => new THREE.MeshBasicMaterial({ map: tex, transparent: true, alphaTest: 0.2, depthWrite: false, side: THREE.DoubleSide }), [tex]);
  useEffect(() => () => matEscala.dispose(), [matEscala]);
  const geo = useMemo(() => geoCache(`transportador:${radio}:${tipo}`, () => {
    const s = new THREE.Shape();
    if (tipo === 180) { s.moveTo(-radio, -0.04); s.lineTo(radio, -0.04); s.lineTo(radio, 0); s.absarc(0, 0, radio, 0, Math.PI, false); s.lineTo(-radio, -0.04); }
    else { s.absarc(0, 0, radio, 0, Math.PI * 2, false); const h = new THREE.Path(); h.absarc(0, 0, radio * 0.25, 0, Math.PI * 2, true); s.holes.push(h); }
    const g2 = extruir(s, 0.015, 64); g2.translate(0, 0, -0.0075);
    return g2;
  }), [radio, tipo]);
  // el lienzo pone el vértice en (W/2, cy) y el radio en 504 px: u por píxel = radio/504
  const s = radio / 504, Hpx = tipo === 180 ? 560 : 1024, cyPx = tipo === 180 ? 536 : 512;
  return (
    <group {...g}>
      <mesh geometry={geo} material={m.plasticoClaro} renderOrder={3} />
      <mesh material={matEscala} position={[0, (cyPx - Hpx / 2) * s, 0.009]} renderOrder={4}>
        <planeGeometry args={[1024 * s, Hpx * s]} />
      </mesh>
    </group>
  );
}
