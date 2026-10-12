"use client";
/**
 * Q10 · Destilación fraccionada — piezas propias del montaje (vidriería esmerilada y equipo).
 *
 *   MantaCalefactora    manta de casquete hemisférico (carcasa de acero + tejido de fibra de vidrio)
 *   ControladorManta    caja de control con pantalla de 7 segmentos (consigna) y perilla
 *   ColumnaVigreux      tubo con indentaciones alternas y juntas esmeriladas. Origen: extremo inferior.
 *   CabezaDestilacion   cabeza de destilación: cuello vertical con boca para el termómetro y brazo lateral
 *   CondensadorLiebig   tubo interior + camisa de agua + dos olivas para mangueras. Origen: extremo superior.
 *   AdaptadorSalida     alargadera acodada que lleva el destilado a la probeta
 *   Alcoholimetro       densímetro de escala de % v/v (flota más profundo cuanto más etanol hay)
 *   Recirculador        baño recirculador del agua de refrigeración
 *   AbrazaderaTubo      anillo forrado y brazo para sujetar un tubo inclinado a un soporte universal
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame, type ThreeElements } from '@react-three/fiber';
import {
  useMateriales, geoCache, tornear, cilindro, cajaRedondeada, esfera, toro, tuboPolilinea, bandaSobrePerfil, mm,
  useTexturaLienzo, dibujarSieteSegmentos, familiaTexto, Etiqueta, azar, type P2,
} from '../_kit';

type GroupProps = ThreeElements['group'];
type V3 = [number, number, number];

// ───────────────────────────── manta calefactora ─────────────────────────────

const R_CAZO = 0.6;      // radio del casquete (algo mayor que el del balón de 500 mL, 0,525)
export const MANTA_ALTO = 0.36;  // la manta cubre sólo la parte baja del balón: el líquido se ve por encima
/** Centro de la esfera del casquete sobre la base de la manta. */
export const MANTA_CENTRO_Y = 0.62;

/** Manta de calentamiento de 500 mL: `calor` 0–1 enciende el tejido (naranja). */
export function MantaCalefactora({ calor = 0, ...g }: GroupProps & { calor?: number }) {
  const m = useMateriales();
  const phi0 = Math.acos((MANTA_CENTRO_Y - MANTA_ALTO) / R_CAZO);   // ángulo del borde del casquete
  const rBorde = R_CAZO * Math.sin(phi0);
  const carcasa = useMemo(() => geoCache('q10mantaCarcasa2', () => tornear([
    [0.0005, 0], [0.5, 0], [0.7, 0.05], [0.74, 0.12], [0.74, MANTA_ALTO - 0.06], [0.71, MANTA_ALTO], [rBorde + 0.02, MANTA_ALTO], [rBorde + 0.02, MANTA_ALTO - 0.03], [0.0005, MANTA_CENTRO_Y - R_CAZO + 0.01],
  ], 48)), [rBorde]);
  const cazo = useMemo(() => geoCache('q10mantaCazo2', () => {
    const p: P2[] = [];
    const n = 14;
    for (let i = 0; i <= n; i++) { const f = phi0 * (1 - i / n); p.push([R_CAZO * Math.sin(f), MANTA_CENTRO_Y - R_CAZO * Math.cos(f)]); }
    p[p.length - 1] = [0.0005, MANTA_CENTRO_Y - R_CAZO];
    return tornear(p, 48);
  }), [phi0]);
  const mat = useMemo(() => new THREE.MeshStandardMaterial({ color: '#d9cfba', roughness: 0.95, metalness: 0, side: THREE.DoubleSide, emissive: new THREE.Color('#ff5a14'), emissiveIntensity: 0 }), []);
  useEffect(() => () => mat.dispose(), [mat]);
  useFrame(() => { mat.emissiveIntensity += (calor * 1.5 - mat.emissiveIntensity) * 0.08; });
  return (
    <group {...g}>
      <mesh geometry={carcasa} material={m.aluminio} castShadow receiveShadow />
      <mesh geometry={cazo} material={mat} />
      {/* asas de la carcasa */}
      <mesh geometry={toro(0.1, 0.018, 8, 20, Math.PI)} material={m.acero} position={[0.76, 0.2, 0]} rotation={[0, 0, -Math.PI / 2]} />
    </group>
  );
}

/** Gato de laboratorio: plataforma de acero sobre la que sube y baja la manta. */
export function GatoLaboratorio(props: GroupProps & { alto?: number }) {
  const m = useMateriales();
  const { alto = 0.5, ...g } = props;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(1.5, alto, 1.3, 0.04, 2)} material={m.hierroPintado} position={[0, alto / 2, 0]} castShadow receiveShadow />
      <mesh geometry={cilindro(0.05, 0.05, 0.2, 14)} material={m.acero} position={[0.75, alto * 0.5, 0.3]} rotation-z={-Math.PI / 2} />
      <mesh geometry={esfera(0.075, 14)} material={m.plastico('#16191c', 0.5)} position={[0.88, alto * 0.5, 0.3]} />
    </group>
  );
}

/** Controlador de la manta: pantalla con la consigna (°C), perilla y luz de calentamiento. */
export function ControladorManta({ consigna, calentando, ...g }: GroupProps & { consigna: number; calentando: boolean }) {
  const m = useMateriales();
  const txt = String(Math.round(consigna));
  const lcd = useTexturaLienzo(256, 128, (ctx, W, H) => {
    ctx.fillStyle = '#10181c'; ctx.fillRect(0, 0, W, H);
    dibujarSieteSegmentos(ctx, txt, W * 0.72, H * 0.14, H * 0.72, '#ff5a3a', 'rgba(255,90,58,0.07)', 0.08, 3);
    ctx.fillStyle = '#ff5a3a'; ctx.font = `700 ${H * 0.24}px ${familiaTexto()}`; ctx.textAlign = 'left'; ctx.textBaseline = 'alphabetic';
    ctx.fillText('°C', W * 0.76, H * 0.7);
  }, [txt]);
  const ang = -2.4 + Math.min(1, Math.max(0, consigna / 160)) * 4.8;
  return (
    <group {...g}>
      <mesh geometry={cajaRedondeada(1.5, 0.8, 0.95, 0.06, 3)} material={m.carcasaClara} position={[0, 0.4, 0]} castShadow receiveShadow />
      <mesh position={[-0.3, 0.55, 0.482]}>
        <planeGeometry args={[0.7, 0.35]} />
        <meshBasicMaterial map={lcd ?? undefined} color={lcd ? '#ffffff' : '#10181c'} toneMapped={false} />
      </mesh>
      <group position={[0.4, 0.42, 0.48]} rotation-x={Math.PI / 2}>
        <mesh geometry={cilindro(0.17, 0.18, 0.12, 28)} material={m.plastico('#1b1f23', 0.55)} position={[0, 0.06, 0]} castShadow />
        <group rotation-y={ang}><mesh material={m.plastico('#f2f2f2', 0.4)} position={[0, 0.125, -0.1]}><boxGeometry args={[0.025, 0.012, 0.13]} /></mesh></group>
      </group>
      <mesh geometry={esfera(0.03, 12)} material={calentando ? m.emisor('#ff5a1a', 3) : m.plastico('#4a2a1c')} position={[-0.3, 0.2, 0.482]} />
      <Etiqueta texto="consigna" modo="plano" position={[-0.3, 0.3, 0.484]} tamano={0.06} fondo={null} color="#cfd6da" peso={600} />
    </group>
  );
}

// ───────────────────────────── vidriería esmerilada ─────────────────────────────

/** Columna Vigreux: pared de vidrio con pares de puntas internas cada 2,2 cm, alternadas 90°. */
export function ColumnaVigreux({ largo = 1.5, vapor = 0, ...g }: GroupProps & { largo?: number; vapor?: number }) {
  const m = useMateriales();
  const R = 0.12;
  const cuerpo = useMemo(() => geoCache(`q10vigreux:${largo}`, () => tornear([
    [0.088, 0], [0.098, 0.04], [0.098, 0.3], [R, 0.34], [R, largo - 0.04], [0.098, largo - 0.02], [0.098, largo], [0.09, largo], [0.09, largo - 0.04], [R - 0.01, largo - 0.06], [R - 0.01, 0.38], [0.088, 0.3], [0.088, 0.04],
  ], 44)), [largo]);
  const nPares = Math.floor((largo - 0.5) / 0.24);
  const punta = useMemo(() => cilindro(0.0, 0.03, 0.1, 8), []);
  const ref = useRef<THREE.InstancedMesh>(null);
  useEffect(() => {
    const im = ref.current; if (!im) return;
    const o = new THREE.Object3D();
    let k = 0;
    for (let i = 0; i < nPares; i++) {
      for (let j = 0; j < 2; j++) {
        const a = (i % 2) * (Math.PI / 2) + j * Math.PI;
        // la punta nace de la pared, apunta al eje y se curva hacia arriba
        o.position.set(Math.sin(a) * (R - 0.04), 0.5 + i * 0.24 + 0.02 * j, Math.cos(a) * (R - 0.04));
        o.rotation.set(0, a - Math.PI / 2, Math.PI / 2 + 0.25);
        o.updateMatrix(); im.setMatrixAt(k++, o.matrix);
      }
    }
    im.count = k; im.instanceMatrix.needsUpdate = true;
  }, [nPares]);
  const vap = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), []);
  useEffect(() => () => vap.dispose(), [vap]);
  useFrame(() => { vap.opacity += (Math.min(1, vapor) * 0.16 - vap.opacity) * 0.06; });
  return (
    <group {...g}>
      <mesh geometry={cuerpo} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <instancedMesh ref={ref} args={[punta, m.vidrio, Math.max(1, nPares * 2)]} renderOrder={3} />
      {/* vapor ascendente (neblina tenue) */}
      <mesh geometry={cilindro(0.08, 0.08, largo - 0.1, 20)} material={vap} position={[0, largo / 2, 0]} renderOrder={4} />
      {/* juntas esmeriladas (anillo mate) */}
      <mesh geometry={cilindro(0.128, 0.128, 0.16, 32)} material={m.vidrioEsmerilado} position={[0, 0.3, 0]} renderOrder={3} />
      <mesh geometry={cilindro(0.128, 0.128, 0.16, 32)} material={m.vidrioEsmerilado} position={[0, largo - 0.06, 0]} renderOrder={3} />
    </group>
  );
}

/** Posiciones de interés de la cabeza de destilación (coordenadas locales, origen: extremo inferior). */
export const CABEZA = {
  alto: 0.95,
  /** eje del brazo lateral en la unión con el cuello */
  yBrazo: 0.62,
  /** extremo del brazo lateral (donde empalma el condensador) */
  fin: [0.12 + 0.9 * Math.cos(0.35), 0.62 - 0.9 * Math.sin(0.35), 0] as V3,
  anguloBrazo: 0.35,
  /** altura de la boca del termómetro */
  yBoca: 0.95,
};

/** Cabeza de destilación con boca superior (termómetro) y brazo lateral inclinado. */
export function CabezaDestilacion({ vapor = 0, ...g }: GroupProps & { vapor?: number }) {
  const m = useMateriales();
  const cuello = useMemo(() => geoCache('q10cabeza', () => tornear([
    [0.088, 0], [0.098, 0.04], [0.098, 0.2], [0.12, 0.26], [0.12, 0.8], [0.098, 0.88], [0.098, CABEZA.alto], [0.082, CABEZA.alto], [0.082, 0.88], [0.108, 0.8], [0.108, 0.26], [0.088, 0.2], [0.088, 0.04],
  ], 40)), []);
  const brazo = useMemo(() => {
    const a = CABEZA.anguloBrazo, L = 0.9;
    const pts: number[] = [];
    for (let i = 0; i <= 10; i++) { const s = i / 10; pts.push(0.08 + s * (L * Math.cos(a) + 0.04), CABEZA.yBrazo - s * L * Math.sin(a), 0); }
    return tuboPolilinea(pts, 0.08, 18, false);
  }, []);
  useEffect(() => () => brazo.dispose(), [brazo]);
  const vap = useMemo(() => new THREE.MeshBasicMaterial({ color: '#ffffff', transparent: true, opacity: 0, depthWrite: false }), []);
  useEffect(() => () => vap.dispose(), [vap]);
  useFrame(() => { vap.opacity += (Math.min(1, vapor) * 0.16 - vap.opacity) * 0.06; });
  return (
    <group {...g}>
      <mesh geometry={cuello} material={m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      <mesh geometry={brazo} material={m.vidrio} renderOrder={3} castShadow />
      <mesh geometry={cilindro(0.07, 0.07, 0.8, 18)} material={vap} position={[0, 0.5, 0]} renderOrder={4} />
      <mesh geometry={cilindro(0.128, 0.128, 0.16, 32)} material={m.vidrioEsmerilado} position={[0, 0.16, 0]} renderOrder={3} />
      {/* adaptador de hule para el termómetro */}
      <mesh geometry={cilindro(0.105, 0.09, 0.14, 24)} material={m.goma} position={[0, CABEZA.yBoca - 0.02, 0]} castShadow />
    </group>
  );
}

export const LIEBIG = { largo: 3.3, camisa: 2.9, rCamisa: 0.15, rTubo: 0.065 };

/** Condensador Liebig: eje en +X (el extremo superior en el origen). Olivas arriba (salida) y abajo (entrada). */
export function CondensadorLiebig(props: GroupProps) {
  const m = useMateriales();
  const L = LIEBIG;
  const ext = (L.largo - L.camisa) / 2;
  const camisa = useMemo(() => geoCache('q10camisa', () => {
    const g = tornear([[0.13, 0], [L.rCamisa, 0.08], [L.rCamisa, L.camisa - 0.08], [0.13, L.camisa], [0.12, L.camisa], [L.rCamisa - 0.012, L.camisa - 0.08], [L.rCamisa - 0.012, 0.08], [0.12, 0]], 36);
    g.rotateZ(-Math.PI / 2);
    return g;
  }), [L.camisa, L.rCamisa]);
  const tubo = useMemo(() => geoCache('q10tuboInterior', () => {
    const g = tornear([[L.rTubo, 0], [L.rTubo, L.largo], [L.rTubo - 0.012, L.largo], [L.rTubo - 0.012, 0]], 24);
    g.rotateZ(-Math.PI / 2);
    return g;
  }), [L.largo, L.rTubo]);
  return (
    <group {...props}>
      <mesh geometry={tubo} material={m.vidrio} renderOrder={3} castShadow />
      <mesh geometry={camisa} material={m.vidrio} position={[ext, 0, 0]} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />
      {/* agua de refrigeración en la camisa */}
      <mesh geometry={cilindro(L.rCamisa - 0.02, L.rCamisa - 0.02, L.camisa - 0.2, 28)} material={m.liquido('#b7dff0')} position={[ext + L.camisa / 2, 0, 0]} rotation-z={Math.PI / 2} />
      {/* olivas: la de arriba (cerca del brazo) es la salida; la de abajo, la entrada */}
      {[ext + 0.22, ext + L.camisa - 0.22].map((x, i) => (
        <mesh key={i} geometry={cilindro(0.04, 0.04, 0.22, 12)} material={m.vidrio} position={[x, 0.0, -0.2]} rotation-x={Math.PI / 2} renderOrder={3} />
      ))}
      {/* juntas esmeriladas en los extremos */}
      <mesh geometry={cilindro(0.1, 0.1, 0.2, 24)} material={m.vidrioEsmerilado} position={[0.12, 0, 0]} rotation-z={Math.PI / 2} renderOrder={3} />
      <mesh geometry={cilindro(0.1, 0.1, 0.2, 24)} material={m.vidrioEsmerilado} position={[L.largo - 0.12, 0, 0]} rotation-z={Math.PI / 2} renderOrder={3} />
    </group>
  );
}

/** Posición de las olivas en el sistema del condensador (x a lo largo, z hacia atrás). */
export const OLIVA_SALIDA: V3 = [(LIEBIG.largo - LIEBIG.camisa) / 2 + 0.22, 0, -0.31];
export const OLIVA_ENTRADA: V3 = [(LIEBIG.largo - LIEBIG.camisa) / 2 + LIEBIG.camisa - 0.22, 0, -0.31];

/**
 * Trayecto de la alargadera en coordenadas de mundo (plano XY): arranca con el rumbo del condensador
 * (`angulo` por debajo de la horizontal), gira hasta la vertical con radio `r` y baja `caida`.
 * Devuelve los puntos (x, y, z) relativos a la boca de entrada.
 */
export function trayectoAdaptador(angulo: number, caida: number, r = 0.32): number[] {
  const pts: number[] = [0, 0, 0];
  const giro = Math.PI / 2 - angulo, n = 14;
  let x = 0, y = 0;
  for (let i = 1; i <= n; i++) {
    const phi = -angulo - ((i - 0.5) / n) * giro;     // rumbo medio del tramo
    x += r * (giro / n) * Math.cos(phi); y += r * (giro / n) * Math.sin(phi);
    pts.push(x, y, 0);
  }
  pts.push(x, y - caida, 0);
  return pts;
}

/** Alargadera acodada: del extremo del condensador baja a la boca de la probeta. Origen: boca de entrada. */
export function AdaptadorSalida({ angulo, caida, ...g }: GroupProps & { angulo: number; caida: number }) {
  const m = useMateriales();
  const tubo = useMemo(() => tuboPolilinea(trayectoAdaptador(angulo, caida), 0.055, 16, false), [angulo, caida]);
  useEffect(() => () => tubo.dispose(), [tubo]);
  return (
    <group {...g}>
      <mesh geometry={tubo} material={m.vidrio} renderOrder={3} castShadow />
      <mesh geometry={cilindro(0.085, 0.085, 0.16, 20)} material={m.vidrioEsmerilado} position={[0.03 * Math.cos(angulo), -0.03 * Math.sin(angulo), 0]} rotation-z={Math.PI / 2 - angulo} renderOrder={3} />
    </group>
  );
}

// ───────────────────────────── instrumentos y accesorios ─────────────────────────────

/** Escala del alcoholímetro: 0 % abajo (flota alto), 100 % arriba. */
export const ALC = { y0: 0.55, rango: 1.1, largo: 1.8 };
/** Altura de la marca p (% v/v) sobre la base del densímetro. */
export const marcaAlcoholimetro = (pct: number) => ALC.y0 + (ALC.rango * Math.max(0, Math.min(100, pct))) / 100;

/** Alcoholímetro (densímetro de vástago graduado en % v/v). Origen: el fondo del lastre. */
export function Alcoholimetro(props: GroupProps) {
  const m = useMateriales();
  const R = 0.034;
  const perfil: P2[] = useMemo(() => [
    [0.0005, 0], [0.05, 0.02], [0.075, 0.1], [0.085, 0.2], [0.085, 0.38], [0.07, 0.46], [R, 0.54], [R, ALC.largo - 0.03], [R * 0.6, ALC.largo], [0.0005, ALC.largo],
  ], []);
  const geo = useMemo(() => geoCache('q10alcoholimetro', () => tornear(perfil, 28)), [perfil]);
  const radioEn = (y: number) => (y < 0.54 ? 0.07 : R);
  const y0 = ALC.y0 - 0.05, y1 = ALC.y0 + ALC.rango + 0.05;
  const alto = y1 - y0;
  const HPX = 2400, WPX = Math.max(32, Math.round((HPX * 1.6 * R) / alto));
  const tex = useTexturaLienzo(WPX, HPX, (ctx, W, H) => {
    const fam = familiaTexto();
    const pxu = H / alto;
    const py = (p: number) => H - (marcaAlcoholimetro(p) - y0) * pxu;
    ctx.fillStyle = '#111417';
    for (let p = 0; p <= 100; p++) {
      const y = py(p), l = p % 10 === 0 ? 0.46 : p % 5 === 0 ? 0.32 : 0.2;
      ctx.fillRect(0, y - pxu * 0.0014, W * l, pxu * 0.0028);
      if (p % 10 === 0) { ctx.font = `600 ${pxu * 0.06}px ${fam}`; ctx.textBaseline = 'middle'; ctx.fillText(String(p), W * 0.5, y); }
    }
  }, []);
  const banda = useMemo(() => bandaSobrePerfil(radioEn, y0, y1, { arco: 1.6, centro: 0, holgura: 0.0008, filas: 8, segmentos: 14 }), []); // eslint-disable-line react-hooks/exhaustive-deps
  useEffect(() => () => banda.dispose(), [banda]);
  const matBanda = useMemo(() => new THREE.MeshStandardMaterial({ map: tex, alphaTest: 0.4, roughness: 0.5, polygonOffset: true, polygonOffsetFactor: -2 }), [tex]);
  useEffect(() => () => matBanda.dispose(), [matBanda]);
  return (
    <group {...props}>
      <mesh geometry={geo} material={m.vidrio} renderOrder={3} castShadow />
      <mesh geometry={banda} material={matBanda} renderOrder={2} />
      {/* lastre de perdigones y papel con la escala dentro del vástago */}
      <mesh geometry={cilindro(0.06, 0.04, 0.16, 16)} material={m.acero} position={[0, 0.1, 0]} />
    </group>
  );
}

/** Baño recirculador de agua fría: caja con tapa y dos boquillas laterales. */
export function Recirculador(props: GroupProps) {
  const m = useMateriales();
  return (
    <group {...props}>
      <mesh geometry={cajaRedondeada(1.7, 1.3, 1.2, 0.06, 3)} material={m.plastico('#3a6075', 0.5)} position={[0, 0.65, 0]} castShadow receiveShadow />
      <mesh geometry={cajaRedondeada(1.5, 0.05, 1.0, 0.02, 2)} material={m.carcasaOscura} position={[0, 1.32, 0]} />
      <mesh geometry={cajaRedondeada(0.8, 0.3, 0.02, 0.01, 1)} material={m.carcasaOscura} position={[0, 0.9, 0.61]} />
      {[-0.35, 0.35].map((x) => (
        <mesh key={x} geometry={cilindro(0.05, 0.05, 0.3, 12)} material={m.cromo} position={[x, 1.1, 0.0]} />
      ))}
      <Etiqueta texto="Agua de refrigeración" modo="plano" position={[0, 0.5, 0.612]} tamano={0.1} fondo={null} color="#e8f0f4" peso={600} />
    </group>
  );
}

/** Anillo forrado de vinilo y brazo para sujetar un tubo inclinado al soporte. El anillo mira al eje `dir`. */
export function AbrazaderaTubo({ radio = 0.18, largo = 1.7, dir, ...g }: GroupProps & { radio?: number; largo?: number; dir: V3 }) {
  const m = useMateriales();
  const q = useMemo(() => new THREE.Quaternion().setFromUnitVectors(new THREE.Vector3(0, 0, 1), new THREE.Vector3(...dir).normalize()), [dir]);
  return (
    <group {...g}>
      <mesh geometry={cilindro(mm(5), mm(5), largo, 14)} material={m.acero} rotation-x={Math.PI / 2} position={[0, 0, largo / 2 - 0.12]} castShadow />
      <group position={[0, 0, largo]} quaternion={q}>
        <mesh geometry={toro(radio, 0.025, 10, 40)} material={m.plastico('#b8352b', 0.7)} castShadow />
        <mesh geometry={toro(radio + 0.03, 0.012, 8, 40)} material={m.acero} />
      </group>
    </group>
  );
}

/** Burbujas de ebullición que suben desde las piedras de ebullición hasta la superficie. */
export function Burbujas({ activa, rMax, yFondo, ySup, n = 26 }: { activa: boolean; rMax: number; yFondo: number; ySup: number; n?: number }) {
  const m = useMateriales();
  const ref = useRef<THREE.InstancedMesh>(null);
  const semilla = useMemo(() => {
    const rnd = azar(77);
    return Array.from({ length: n }, () => ({ a: rnd() * Math.PI * 2, r: Math.sqrt(rnd()) * rMax, f: rnd(), v: 0.4 + rnd() * 0.5, s: 0.012 + rnd() * 0.02 }));
  }, [n, rMax]);
  const geo = useMemo(() => esfera(1, 8), []);
  const tmp = useMemo(() => new THREE.Object3D(), []);
  useFrame((st) => {
    const im = ref.current; if (!im) return;
    im.visible = activa;
    if (!activa) return;
    const t = st.clock.elapsedTime;
    const alto = Math.max(0.05, ySup - yFondo);
    semilla.forEach((b, i) => {
      const f = (t * b.v * 0.5 + b.f) % 1;
      tmp.position.set(Math.cos(b.a) * b.r * (0.6 + 0.4 * f), yFondo + f * alto, Math.sin(b.a) * b.r * (0.6 + 0.4 * f));
      const s = b.s * (0.6 + f * 0.8);
      tmp.scale.setScalar(s); tmp.updateMatrix(); im.setMatrixAt(i, tmp.matrix);
    });
    im.instanceMatrix.needsUpdate = true;
  });
  return <instancedMesh ref={ref} args={[geo, m.plastico('#f4fafc', 0.2), n]} frustumCulled={false} renderOrder={5} />;
}
