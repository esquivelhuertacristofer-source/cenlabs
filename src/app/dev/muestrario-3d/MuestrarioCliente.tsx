'use client';
/**
 * Vitrina del kit 3D. Cada sección es una escena completa hecha SOLO con piezas
 * del kit, como las montaría un lab. `?s=` elige la sección, `?calidad=` la
 * calidad, `?foto=1` congela el bucle tras unos fotogramas (para Playwright) y
 * `?s=detalle&p=<pieza>` encuadra una sola pieza.
 */
import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame, useThree } from '@react-three/fiber';
import {
  LabCanvas, VasoPrecipitado, Erlenmeyer, MatrazAforado, Probeta, MatrazBalon, TuboEnsayo, Bureta,
  VidrioReloj, Embudo, Jeringa, Gradilla, posicionHueco, COLORES_LIQUIDO, type Calidad, type Fondo,
  SoporteUniversal, Nuez, Pinza, Aro, MecheroBunsen, ParrillaAgitadora, PARRILLA_CENTRO, BarraMagnetica,
  BanoHielo, Termometro, Manometro, MultimetroDigital, FuenteBanco, BalanzaAnalitica, BALANZA_PLATO,
  Dinamometro, Fotopuerta, Cronometro, Regla, CintaMetrica, Transportador, ResorteHelicoidal, Portapesas,
  FlechaFuerza, Polea, Cuerda, CuerdaEnPolea, Bloque, PlanoCartesiano, CurvaFuncion, ArcoAngulo, PuntoMarcado,
  EtiquetaMath, Etiqueta, EncuadrarCaja, defBureta, dinamometroAlargamiento, PesaRanurada, mm,
} from '@/components/simuladores/_kit';
import LabLayout, { Lectura, GrupoControles, Deslizador, BotonLab, Segmentado } from '@/components/simulador/LabLayout';

type V3 = [number, number, number];
interface Seccion { id: string; titulo: string; fondo: Fondo; camara: { posicion: V3; objetivo: V3; fov?: number } }
const SECCIONES: Seccion[] = [
  { id: 'quimica', titulo: 'Química', fondo: 'laboratorio', camara: { posicion: [0, 3.2, 8.5], objetivo: [0, 0.7, 0.6], fov: 32 } },
  { id: 'bureta', titulo: 'Titulación', fondo: 'laboratorio', camara: { posicion: [-4.2, 4.4, 9.2], objetivo: [0.0, 3.0, 0.0], fov: 36 } },
  { id: 'calor', titulo: 'Calor', fondo: 'laboratorio', camara: { posicion: [0.5, 3.6, 9], objetivo: [0.2, 1.5, 0.4], fov: 32 } },
  { id: 'instrumentos', titulo: 'Instrumentos', fondo: 'laboratorio', camara: { posicion: [0, 4.2, 10.5], objetivo: [0, 1.0, 0.4], fov: 36 } },
  { id: 'mecanica', titulo: 'Mecánica', fondo: 'laboratorio', camara: { posicion: [0.8, 3.7, 12.0], objetivo: [0.6, 3.0, 0.2], fov: 36 } },
  { id: 'matematicas', titulo: 'Matemáticas', fondo: 'pizarron', camara: { posicion: [0, 0, 14], objetivo: [0, 0, 0], fov: 35 } },
  { id: 'campo', titulo: 'Campo', fondo: 'campo', camara: { posicion: [-5, 3.5, 11], objetivo: [5, 1.0, 0], fov: 42 } },
  { id: 'layout', titulo: 'LabLayout', fondo: 'laboratorio', camara: { posicion: [0.3, 3.1, 9.6], objetivo: [0.3, 2.5, 0], fov: 34 } },
  { id: 'detalle', titulo: 'Detalle', fondo: 'laboratorio', camara: { posicion: [0, 2, 5], objetivo: [0, 0.6, 0], fov: 30 } },
];

/** Instala window.__kit.salud() y marca data-listo tras unos fotogramas. */
function Sonda({ onListo, foto }: { onListo: () => void; foto?: boolean }) {
  const scene = useThree((s) => s.scene);
  const gl = useThree((s) => s.gl);
  const setFrameloop = useThree((s) => s.setFrameloop);
  const n = useRef(0);
  useEffect(() => {
    (window as unknown as { __kit: unknown }).__kit = {
      salud() {
        let normalesCero = 0, posNaN = 0, mallas = 0, triangulos = 0;
        scene.traverse((o) => {
          const m = o as THREE.Mesh;
          if (!m.isMesh || !m.geometry) return;
          mallas++;
          const g = m.geometry;
          const nn = g.getAttribute('normal');
          const pp = g.getAttribute('position');
          if (nn) for (let i = 0; i < nn.count; i++) if (!(Math.hypot(nn.getX(i), nn.getY(i), nn.getZ(i)) > 1e-6)) normalesCero++;
          if (pp) for (let i = 0; i < pp.count; i++) if (!Number.isFinite(pp.getX(i) + pp.getY(i) + pp.getZ(i))) posNaN++;
          triangulos += (g.index ? g.index.count / 3 : (pp?.count ?? 0) / 3) * ((m as THREE.InstancedMesh).count ?? 1);
        });
        return { mallas, triangulos: Math.round(triangulos), normalesCero, posNaN, llamadas: gl.info.render.calls, programas: gl.info.programs?.length };
      },
    };
  }, [scene, gl]);
  useFrame(() => {
    n.current++;
    // en modo foto se congela el bucle: swiftshader tarda segundos por fotograma
    if (n.current === (foto ? 5 : 8)) { if (foto) setFrameloop('never'); onListo(); }
  });
  return null;
}

// ───────────────────────────── escenas ─────────────────────────────

function EscenaQuimica() {
  return (
    <>
      <VasoPrecipitado capacidad={600} position={[-3.6, 0, 0.2]} liquido={{ volumenML: 420, color: COLORES_LIQUIDO.agua }} />
      <VasoPrecipitado capacidad={250} position={[-2.3, 0, 0.9]} liquido={{ volumenML: 150, color: COLORES_LIQUIDO.sulfatoCobre }} />
      <VasoPrecipitado capacidad={100} position={[-1.4, 0, 1.6]} liquido={{ volumenML: 60, color: COLORES_LIQUIDO.dicromato }} />
      <VasoPrecipitado capacidad={50} position={[-0.7, 0, 2.1]} rotation-y={-1.2} />
      <Erlenmeyer capacidad={250} position={[-0.6, 0, 0.3]} liquido={{ volumenML: 100, color: COLORES_LIQUIDO.fenolftaleina }} />
      <MatrazAforado capacidad={250} position={[0.7, 0, -0.2]} liquido={{ volumenML: 250, color: COLORES_LIQUIDO.permanganato }} />
      <Probeta capacidad={100} position={[1.7, 0, 0.5]} liquido={{ volumenML: 64, color: COLORES_LIQUIDO.agua }} />
      <MatrazBalon capacidad={250} aro position={[2.9, 0, -0.1]} liquido={{ volumenML: 120, color: COLORES_LIQUIDO.verdeBromocresol }} />
      <Gradilla position={[3.2, 0, 1.5]} />
      {[0, 1, 2, 3].map((i) => (
        <TuboEnsayo key={i} position={[3.2 + posicionHueco(i)[0], posicionHueco(i)[1], 1.5]}
          liquido={i < 3 ? { volumenML: 6 + i * 3, color: [COLORES_LIQUIDO.sulfatoCobre, COLORES_LIQUIDO.naranjaMetilo, COLORES_LIQUIDO.rojoMetilo][i] } : undefined} />
      ))}
      <VidrioReloj position={[0.8, 0, 1.8]} polvo="#3d7fd1" />
      <Embudo position={[-3.0, 0.38, 2.0]} rotation-z={Math.PI / 2 - 0.12} filtro />
      <Jeringa position={[1.9, 0.09, 2.1]} rotation={[0, 0.4, Math.PI / 2]} volumenML={6.5} colorLiquido={COLORES_LIQUIDO.agua} />
    </>
  );
}

function EscenaBureta() {
  const def = defBureta();
  const altNuez = 5.2;
  // el agarre queda a la altura de la nuez; la bureta se coloca para que la pinza la
  // sujete por encima de la marca de 50 mL
  const yPinzaEnBureta = def.extra.y50Marca + 1.6;
  return (
    <>
      <SoporteUniversal position={[0, 0, -1.4]} alturaVarilla={7}>
        <Nuez altura={altNuez}>
          <Pinza tipo="bureta" diametro={0.135}>
            <Bureta position={[0, -yPinzaEnBureta, 0]} lecturaML={12.4} llave={0.15} colorLiquido="#d8eef6" />
          </Pinza>
        </Nuez>
      </SoporteUniversal>
      <ParrillaAgitadora position={[mm(26), 0, 0.3]} calor={0} agitacion={600} />
      <group position={[mm(26) + PARRILLA_CENTRO[0], PARRILLA_CENTRO[1], 0.3 + PARRILLA_CENTRO[2]]}>
        <Erlenmeyer capacidad={250} liquido={{ volumenML: 75, color: COLORES_LIQUIDO.fenolftaleinaTenue }} />
        <BarraMagnetica rpm={600} position={[0, mm(1.6), 0]} />
      </group>
      <VasoPrecipitado capacidad={100} position={[-1.6, 0, 1.2]} liquido={{ volumenML: 40, color: '#d8eef6' }} />
      <Termometro position={[1.8, 0.05, 1.3]} rotation={[0, 0.2, Math.PI / 2 - 0.05]} temperatura={23.5} />
      <Etiqueta texto="Lectura: 12.4 mL" tamano={0.16} fondo="#ffffff" color="#173f86" position={[1.0, 5.6, 0.2]} />
    </>
  );
}

function EscenaCalor() {
  return (
    <>
      <SoporteUniversal position={[-0.9, 0, -1.2]} alturaVarilla={5}>
        <Aro altura={2.3} diametro={0.9} conRejilla>
          <VasoPrecipitado capacidad={250} position={[0, 0.005, 0]} liquido={{ volumenML: 180, color: COLORES_LIQUIDO.agua }} />
        </Aro>
        <Nuez altura={3.9}>
          <Pinza tipo="matraz" diametro={0.07} largo={1.07}>
            <Termometro position={[0, -1.43, 0]} temperatura={78} />
          </Pinza>
        </Nuez>
      </SoporteUniversal>
      <MecheroBunsen position={[-0.9, 0.16, -1.2 + 1.07]} aire={0.85} gas={0.8} />
      <MecheroBunsen position={[1.6, 0, 0.9]} aire={0.0} gas={0.7} />
      <BanoHielo position={[2.9, 0, -0.2]} />
      <Termometro position={[3.2, 0.12, -0.1]} rotation-z={0.25} temperatura={2} liquido="mercurio" />
      <MatrazBalon capacidad={250} aro position={[-3.0, 0, 0.6]} liquido={{ volumenML: 90, color: COLORES_LIQUIDO.yodo }} />
    </>
  );
}

function EscenaInstrumentos() {
  return (
    <>
      <MultimetroDigital position={[-3.4, 0, 0.6]} lectura={12.04} unidad="V" modo="V⎓" puntaRoja={[1.3, 0.62, 0.55]} puntaNegra={[1.3, 0.62, 0.15]} direccionRoja={[1, -0.6, -0.2]} direccionNegra={[1, -0.6, 0.2]} />
      <FuenteBanco position={[-1.4, 0, -0.9]} voltaje={12.0} corriente={0.482} />
      <BalanzaAnalitica position={[1.4, 0, -1.0]} lectura={25.0384} puertaAbierta={0.35} />
      <group position={[1.4 + BALANZA_PLATO[0], BALANZA_PLATO[1], -1.0 + BALANZA_PLATO[2]]}>
        <VidrioReloj diametro={75} polvo="#f4f1ea" cantidadPolvo={0.4} />
      </group>
      <Manometro position={[3.6, 1.15, -0.6]} valor={6.3} max={10} unidad="bar" titulo="PRESIÓN" zonaRoja={[8, 10]} />
      <Manometro position={[4.4, 0.9, 0.4]} rotation-y={-0.4} diametro={0.5} valor={42} min={0} max={100} unidad="kPa" divisiones={10} />
      <Cronometro position={[-0.2, 0, 1.6]} rotation-y={0.25} tiempo={83.47} corriendo />
      <Regla position={[-3.3, 0, 2.3]} rotation-y={0.04} longitud={30} />
      <Regla position={[0.6, 0, 2.6]} longitud={30} material="acero" ancho={0.25} />
      <Transportador position={[3.0, 0.02, 1.7]} rotation-x={-Math.PI / 2} />
      <group position={[4.2, 0, 1.3]}>
        <Fotopuerta position={[0, 1.4, 0]} bloqueada />
      </group>
    </>
  );
}

function EscenaMecanica() {
  // ley de Hooke: el resorte oscila por ref (sin re-render) y el portapesas lo sigue
  const L = useRef(1.6);
  const colgante = useRef<THREE.Group>(null);
  const OJAL = 0.19;
  useFrame((st) => {
    L.current = 1.75 + Math.sin(st.clock.elapsedTime * 3) * 0.22;
    if (colgante.current) colgante.current.position.y = -0.2 - L.current - OJAL;
  });
  const rP = 0.25 - mm(5); // radio de la garganta de la polea
  const brazo = (largo: number) => (
    <mesh position={[0, 0, largo / 2 - 0.1]} rotation-x={Math.PI / 2} castShadow>
      <cylinderGeometry args={[mm(5), mm(5), largo, 16]} /><meshStandardMaterial color="#cfd3d6" metalness={1} roughness={0.3} />
    </mesh>
  );
  return (
    <>
      {/* 1 · Hooke: resorte, portapesas y regla vertical */}
      <SoporteUniversal position={[-2.6, 0, -1.2]} alturaVarilla={6.6}>
        <Nuez altura={6.1}>
          {brazo(1.3)}
          <group position={[0, -0.01, 1.05]}>
            <ResorteHelicoidal longitudRef={L} espiras={22} radio={0.11} grosor={0.011} position={[0, -0.2, 0]} />
            <group ref={colgante}><Portapesas masas={[100, 50, 20]} /></group>
          </group>
        </Nuez>
        <Regla position={[NUEZ_REGLA, 0.17, 1.05]} rotation={[Math.PI / 2, Math.PI / 2, 0]} longitud={50} material="acero" ancho={0.3} />
      </SoporteUniversal>
      {/* 2 · máquina de Atwood: polea en el brazo, dos portapesas */}
      <SoporteUniversal position={[0.6, 0, -1.2]} alturaVarilla={6.6}>
        <Nuez altura={6.2}>
          {brazo(1.0)}
          <group position={[0, 0, 0.8]}>
            <Polea radio={0.25} velocidadAngular={0.8} conSoporte={false} />
            <CuerdaEnPolea radio={0.25} desde={0} hasta={Math.PI} />
            <Cuerda desde={[rP, 0, 0]} hasta={[rP, -2.4, 0]} />
            <Cuerda desde={[-rP, 0, 0]} hasta={[-rP, -3.3, 0]} />
            <group position={[rP, -2.4, 0]}><Portapesas masas={[100, 20]} /></group>
            <group position={[-rP, -3.3, 0]}><Portapesas masas={[100]} /></group>
          </group>
        </Nuez>
      </SoporteUniversal>
      {/* 3 · dinamómetro con carga */}
      <SoporteUniversal position={[3.6, 0, -1.2]} alturaVarilla={6.6}>
        <Nuez altura={6.2}>
          {brazo(1.0)}
          <group position={[0, -0.05, 0.8]}>
            <Dinamometro fuerza={1.47} max={5} colorTapa="#c62828" />
            <group position={[0, -0.32 - dinamometroAlargamiento(1.47, 5) - 2.6 * 0.84 + 0.02 - 0.1, 0]}>
              <Portapesas masas={[100, 50]} />
            </group>
          </group>
        </Nuez>
      </SoporteUniversal>
      {/* bloque sobre la mesa con su diagrama de cuerpo libre */}
      <group position={[-0.6, 0, 1.7]}>
        <Bloque />
        <FlechaFuerza position={[0, 0.2, 0.26]} vector={[0, -9.8, 0]} escala={0.07} tipo="peso" etiqueta="P" />
        <FlechaFuerza position={[0, 0.4, 0.26]} vector={[0, 9.8, 0]} escala={0.07} tipo="normal" etiqueta="N" />
        <FlechaFuerza position={[0.5, 0.2, 0.26]} vector={[6, 0, 0]} escala={0.07} tipo="aplicada" etiqueta="F" />
        <FlechaFuerza position={[-0.42, 0.03, 0.26]} vector={[-3.5, 0, 0]} escala={0.07} tipo="friccion" etiqueta="f_k" />
      </group>
      <PesaRanurada gramos={200} position={[1.6, 0, 2.0]} />
      <PesaRanurada gramos={100} position={[2.2, 0, 2.3]} rotation-y={1} />
      <PesaRanurada gramos={50} position={[1.85, 0, 2.7]} rotation-y={2.2} material="hierro" />
      <PesaRanurada gramos={20} position={[2.45, 0, 2.8]} rotation-y={0.4} />
    </>
  );
}
const NUEZ_REGLA = 0.62;

function EscenaMatematicas() {
  const esc = 0.55;
  return (
    <>
      <EncuadrarCaja caja={[[-11 * esc, -6.4 * esc, 0], [11 * esc, 6.6 * esc, 0]]} margen={1.02} direccion={[0, 0, 1]} />
      <PlanoCartesiano rangoX={[-10, 10]} rangoY={[-6, 6]} escala={esc} />
      <CurvaFuncion f={(x) => 0.15 * x * x - 3} rango={[-10, 10]} escala={esc} recorteY={[-6, 6]} color="#ffb703" />
      <CurvaFuncion f={(x) => 3 * Math.sin(x)} rango={[-10, 10]} escala={esc} color="#8ecae6" />
      <CurvaFuncion f={(x) => 1 / (x - 4)} rango={[-10, 10]} escala={esc} recorteY={[-6, 6]} color="#f28482" />
      <ArcoAngulo desde={0} hasta={[3, 2]} radio={1.0} etiqueta="θ = 33.7°" color="#90be6d" />
      <ArcoAngulo desde={180} hasta={90} radio={0.45} sentido="horario" color="#f9c74f" position={[-4 * esc, 2 * esc, 0]} />
      <ArcoAngulo desde={[-1, 0]} hasta={[-0.3, -1]} radio={0.7} sentido="antihorario" etiqueta="α" color="#cdb4db" position={[5 * esc, -3 * esc, 0]} />
      <PuntoMarcado x={3} y={2} escala={esc} etiqueta="P(3, 2)" proyecciones />
      <PuntoMarcado x={-4} y={2} escala={esc} color="#f9c74f" etiqueta="Q" />
      <EtiquetaMath texto="f(x) = 0.15x^2 − 3" modo="plano" tamano={0.28} color="#ffb703" position={[-9.5 * esc, 5.3 * esc, 0.01]} ancla={[0, 0.5]} />
      <EtiquetaMath texto="g(x) = 3 sin x" modo="plano" tamano={0.28} color="#8ecae6" position={[-9.5 * esc, 4.5 * esc, 0.01]} ancla={[0, 0.5]} />
    </>
  );
}

function EscenaCampo() {
  return (
    <>
      <CintaMetrica extension={300} position={[0, 0.0, 1.2]} />
      {[...Array(6)].map((_, i) => (
        <group key={i} position={[i * 4, 0, -0.6]}>
          <mesh position={[0, 0.5, 0]} castShadow><cylinderGeometry args={[0.03, 0.04, 1, 8]} /><meshStandardMaterial color={i % 2 ? '#e53935' : '#fafafa'} roughness={0.6} /></mesh>
          <Etiqueta texto={`${i * 4 / 10} m`} tamano={0.14} fondo="#ffffff" color="#222" position={[0, 1.15, 0]} />
        </group>
      ))}
      <FlechaFuerza position={[0, 0.6, 0]} vector={[8, 6, 0]} escala={0.25} tipo="velocidad" etiqueta="v_0" />
      <Fotopuerta position={[6, 0.55, 0]} />
      <Cronometro position={[1.5, 0, 1.6]} tiempo={1.42} />
    </>
  );
}

function EscenaLayout() {
  return (
    <>
      <EscenaPendulo />
    </>
  );
}
function EscenaPendulo() {
  const g = useRef<THREE.Group>(null);
  useFrame((st) => { if (g.current) g.current.rotation.z = Math.sin(st.clock.elapsedTime * 2.2) * 0.35; });
  return (
    <>
      <SoporteUniversal position={[0, 0, -1.2]} alturaVarilla={5}>
        <Nuez altura={4.6}>
          <mesh position={[0, 0, 0.7]} rotation-x={Math.PI / 2}><cylinderGeometry args={[mm(5), mm(5), 1.5, 16]} /><meshStandardMaterial color="#cfd3d6" metalness={1} roughness={0.3} /></mesh>
          <group position={[0, 0, 1.35]} ref={g}>
            <Cuerda desde={[0, 0, 0]} hasta={[0, -3.2, 0]} />
            <mesh position={[0, -3.32, 0]} castShadow><sphereGeometry args={[0.13, 32, 20]} /><meshStandardMaterial color="#c9ccce" metalness={1} roughness={0.25} /></mesh>
          </group>
        </Nuez>
      </SoporteUniversal>
      <Transportador position={[mm(26), 4.6, 0.1]} rotation-z={Math.PI} radio={0.6} />
      <Fotopuerta position={[mm(26), 1.28, 0.15]} rotation-y={Math.PI / 2} />
      <Cronometro position={[1.6, 0, 1.0]} tiempo={1.79} />
    </>
  );
}

/** Pieza suelta encuadrada (s=detalle&p=…). */
function EscenaDetalle({ pieza }: { pieza: string }) {
  const piezas: Record<string, { el: React.ReactNode; caja: [V3, V3]; dir?: V3 }> = {
    vaso: { el: <VasoPrecipitado capacidad={250} rotation-y={0.9} liquido={{ volumenML: 150, color: COLORES_LIQUIDO.sulfatoCobre }} />, caja: [[-0.4, 0, -0.4], [0.4, 1.0, 0.4]] },
    aforado: { el: <MatrazAforado capacidad={250} liquido={{ volumenML: 250, color: COLORES_LIQUIDO.agua }} />, caja: [[-0.45, 0, -0.45], [0.45, 2.3, 0.45]] },
    aforo: { el: <MatrazAforado capacidad={250} liquido={{ volumenML: 250, color: COLORES_LIQUIDO.sulfatoCobre }} />, caja: [[-0.12, 1.45, -0.1], [0.12, 1.75, 0.1]] },
    bureta: { el: <Bureta lecturaML={12.4} llave={0.3} colorLiquido="#d8eef6" />, caja: [[-0.3, 0, -0.2], [0.3, 1.6, 0.2]] },
    buretaEscala: { el: <Bureta lecturaML={12.4} colorLiquido={COLORES_LIQUIDO.permanganato} />, caja: [[-0.15, 5.0, -0.1], [0.15, 5.5, 0.1]] },
    probeta: { el: <Probeta capacidad={100} liquido={{ volumenML: 64, color: COLORES_LIQUIDO.agua }} />, caja: [[-0.4, 0, -0.4], [0.4, 2.5, 0.4]] },
    jeringa: { el: <Jeringa capacidad={10} volumenML={6.5} colorLiquido={COLORES_LIQUIDO.sulfatoCobre} />, caja: [[-0.2, 0, -0.2], [0.2, 1.3, 0.2]] },
    mechero: { el: <MecheroBunsen aire={0.85} gas={0.8} />, caja: [[-0.5, 0, -0.5], [0.5, 2.6, 0.5]] },
    multimetro: { el: <MultimetroDigital lectura={4.987} unidad="V" decimales={3} />, caja: [[-0.8, 0, -0.4], [1.4, 2.0, 1.6]] },
    parrilla: { el: <ParrillaAgitadora calor={0.5} agitacion={800} />, caja: [[-1.1, 0, -1.4], [1.1, 1.0, 1.5]] },
    nuez: { el: <SoporteUniversal alturaVarilla={2}><Nuez altura={1.4}><Pinza tipo="bureta" largo={1.0} diametro={0.16}><TuboEnsayo tamano="16x150" position={[0, -1.15, 0]} /></Pinza></Nuez></SoporteUniversal>, caja: [[-0.4, 1.0, -0.3], [0.5, 1.8, 1.3]], dir: [1, 0.45, 0.75] },
    pinzaMatraz: { el: <SoporteUniversal alturaVarilla={2}><Nuez altura={1.4}><Pinza tipo="matraz" largo={1.0} diametro={0.3}><MatrazBalon capacidad={250} position={[0, -1.32, 0]} liquido={{ volumenML: 120, color: COLORES_LIQUIDO.permanganato }} /></Pinza></Nuez></SoporteUniversal>, caja: [[-0.4, 0.4, -0.3], [0.6, 1.8, 1.4]], dir: [1, 0.45, 0.75] },
    termometro: { el: <Termometro temperatura={37} />, caja: [[-0.1, 1.0, -0.1], [0.1, 1.8, 0.1]] },
    manometro: { el: <Manometro valor={6.3} max={10} titulo="PRESIÓN" zonaRoja={[8, 10]} position={[0, 0.6, 0]} />, caja: [[-0.4, 0.0, -0.2], [0.4, 1.0, 0.2]] },
    balanza: { el: <BalanzaAnalitica lectura={25.0384} />, caja: [[-1.3, -0.2, -2.0], [1.3, 3.4, 2.2]], dir: [0.3, 0.5, 1] },
    pesas: { el: <Portapesas masas={[100, 50, 20, 10]} position={[0, 1.3, 0]} />, caja: [[-0.3, 0, -0.3], [0.3, 1.4, 0.3]] },
    polea: { el: <Polea position={[0, 0.8, 0]} />, caja: [[-0.4, 0.0, -0.3], [0.4, 1.1, 0.3]] },
  };
  const p = piezas[pieza] ?? piezas.vaso;
  return (<><EncuadrarCaja caja={p.caja} direccion={p.dir ?? [0.35, 0.35, 1]} margen={1.15} />{p.el}</>);
}

// ───────────────────────────── simulación de la columna real ─────────────────────────────

/** Reproduce el marco de SimuladorClient (guía 30 %, cabecera 80 px, bitácora 400 px) para
 *  ver LabLayout en el tamaño real que tendrá. */
function MarcoSimulador({ calidad, foto, onListo }: { calidad: Calidad; foto?: boolean; onListo: () => void }) {
  const [angulo, setAngulo] = useState(20);
  const [longitud, setLongitud] = useState(1.0);
  const [modo, setModo] = useState<'libre' | 'medir'>('libre');
  const sec = SECCIONES.find((s) => s.id === 'layout')!;
  return (
    <div className="flex h-full w-full bg-[#F8FAFC]">
      <aside className="w-[30%] shrink-0 bg-[#023047] p-6 text-white/70"><div className="text-2xl font-black text-white">CEN Labs</div><div className="mt-6 h-40 rounded-3xl bg-white/10" /></aside>
      <main className="flex min-w-0 flex-1 flex-col">
        <header className="flex h-20 shrink-0 items-center border-b border-slate-100 bg-white px-8 text-sm font-black text-[#023047]">Cabecera de SimuladorClient</header>
        <div className="flex min-h-0 flex-1">
          <div className="relative min-w-0 flex-1 bg-slate-100" data-columna-lab="">
            <LabLayout
              tituloPanel="Datos"
              barraSuperior={<>
                <Lectura etiqueta="θ₀" valor={angulo.toFixed(0)} unidad="°" />
                <Lectura etiqueta="L" valor={longitud.toFixed(2)} unidad="m" />
                <Lectura etiqueta="T medido" valor="1.791" unidad="s" acento />
                <Lectura etiqueta="T teórico" valor={(2 * Math.PI * Math.sqrt(longitud / 9.81)).toFixed(3)} unidad="s" />
              </>}
              escena={
                <LabCanvas calidad={calidad} fondo="laboratorio" camara={sec.camara} frameloop="always">
                  <Sonda foto={foto} onListo={onListo} />
                  <EscenaLayout />
                </LabCanvas>
              }
              controles={
                <GrupoControles>
                  <Deslizador etiqueta="Ángulo inicial" valor={angulo} min={5} max={60} unidad="°" onChange={setAngulo} />
                  <Deslizador etiqueta="Longitud" valor={longitud} min={0.2} max={2} paso={0.01} unidad="m" onChange={setLongitud} />
                  <Segmentado etiqueta="Modo" opciones={[{ valor: 'libre', texto: 'Libre' }, { valor: 'medir', texto: 'Medir' }]} valor={modo} onChange={setModo} />
                  <BotonLab>Soltar</BotonLab>
                  <BotonLab variante="secundario">Reiniciar</BotonLab>
                </GrupoControles>
              }
              panelLateral={
                <div className="space-y-2">
                  <p className="text-slate-300">Oscilaciones registradas por la fotopuerta:</p>
                  <table className="w-full text-[12px] tabular-nums"><tbody>
                    {[1.788, 1.791, 1.794, 1.79].map((t, i) => <tr key={i} className="border-b border-white/5"><td className="py-1 text-slate-400">{i + 1}</td><td className="text-right font-mono">{t.toFixed(3)} s</td></tr>)}
                  </tbody></table>
                </div>
              }
            />
          </div>
          <div className="w-[400px] shrink-0 border-l border-slate-100 bg-slate-50 p-6 text-[10px] font-black uppercase tracking-widest text-slate-400">Bitácora</div>
        </div>
      </main>
    </div>
  );
}

export default function MuestrarioCliente({ seccionInicial, calidadInicial, foto, pieza }: { seccionInicial: string; calidadInicial: Calidad; pieza?: string; foto?: boolean }) {
  const [seccion, setSeccion] = useState(seccionInicial);
  const [calidad, setCalidad] = useState<Calidad>(calidadInicial);
  const [listo, setListo] = useState(false);
  useEffect(() => { setListo(false); }, [seccion, calidad]);
  const sec = SECCIONES.find((s) => s.id === seccion) ?? SECCIONES[0];
  return (
    <div className="flex h-screen w-screen flex-col bg-[#0b1220] text-slate-100" data-listo={listo ? '1' : '0'}>
      {seccion !== 'layout' && (
        <div className="flex shrink-0 flex-wrap items-center gap-2 border-b border-white/10 px-3 py-2 text-xs">
          <span className="mr-2 font-bold uppercase tracking-widest text-[#8ECAE6]">Kit 3D · muestrario</span>
          {SECCIONES.filter((s) => s.id !== 'detalle').map((s) => (
            <button key={s.id} onClick={() => setSeccion(s.id)} className={`rounded-md px-2.5 py-1 ${seccion === s.id ? 'bg-[#219EBC] text-white' : 'bg-white/5 text-slate-300 hover:bg-white/10'}`}>{s.titulo}</button>
          ))}
          <span className="ml-auto" />
          {(['alta', 'media'] as const).map((c) => (
            <button key={c} onClick={() => setCalidad(c)} className={`rounded-md px-2.5 py-1 ${calidad === c ? 'bg-[#FB8500] text-white' : 'bg-white/5 text-slate-300'}`}>calidad {c}</button>
          ))}
        </div>
      )}
      <div className="relative min-h-0 flex-1">
        {seccion === 'layout' ? (
          <MarcoSimulador key={calidad} calidad={calidad} foto={foto} onListo={() => setListo(true)} />
        ) : (
          <LabCanvas key={seccion + calidad + (pieza ?? '')} calidad={calidad} fondo={sec.fondo} camara={sec.camara}
            controles={sec.fondo === 'pizarron' ? { maxPolar: Math.PI, paneo: true } : true}>
            <Sonda foto={foto} onListo={() => setListo(true)} />
            {seccion === 'quimica' && <EscenaQuimica />}
            {seccion === 'bureta' && <EscenaBureta />}
            {seccion === 'calor' && <EscenaCalor />}
            {seccion === 'instrumentos' && <EscenaInstrumentos />}
            {seccion === 'mecanica' && <EscenaMecanica />}
            {seccion === 'matematicas' && <EscenaMatematicas />}
            {seccion === 'campo' && <EscenaCampo />}
            {seccion === 'detalle' && <EscenaDetalle pieza={pieza ?? 'vaso'} />}
          </LabCanvas>
        )}
      </div>
    </div>
  );
}
