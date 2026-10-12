"use client";

/**
 * Selección natural en 3D (polillas de Manchester). El alumno es el ave:
 *   · tronco de roble a escala real (polilla ≈ 7 cm): corteza clara con líquenes en el
 *     aire limpio, o ennegrecida por hollín en la zona industrial;
 *   · las polillas están posadas con las alas abiertas; ninguna se resalta —el mismo
 *     tamaño, pose y material—: sólo el contraste con la corteza las delata;
 *   · al cazar, el ave sale de su rama, atrapa la polilla y vuelve con ella en el pico
 *     (animación ligada al estado: una captura por cada polilla marcada `cazada`).
 * Las frecuencias NO se dibujan aquí: viven en el panel del lab.
 */
import React, { useEffect, useMemo, useRef, useState } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import { LabCanvas, EncuadrarCaja } from '../_kit';
import {
  Tronco, Rama, Polilla, Ave, PERCHA, puntoDeTronco, relajarPosiciones, posicionEnTronco,
  type Ambiente, type RefsAve, type FenotipoPolilla,
} from './piezas';

type Bug = {
  id: number;
  tipo: FenotipoPolilla;
  x: number;      // 0..100 (posición del store en %)
  y: number;      // 0..100
  angle: number;
  cazada: boolean;
};

interface Captura { id: number; destino: THREE.Vector3; tipo: FenotipoPolilla }
type Fase = 'reposo' | 'ida' | 'vuelta' | 'comer';

const PERCHA_AVE = PERCHA.clone().add(new THREE.Vector3(0, 0.7, 0));
const T_IDA = 0.75, T_VUELTA = 0.8, T_COMER = 0.45;
const Y_ARRIBA = new THREE.Vector3(0, 1, 0);

/** Bézier cuadrática. */
function bezier(a: THREE.Vector3, c: THREE.Vector3, b: THREE.Vector3, t: number, out: THREE.Vector3) {
  const u = 1 - t;
  return out.set(
    u * u * a.x + 2 * u * t * c.x + t * t * b.x,
    u * u * a.y + 2 * u * t * c.y + t * t * b.y,
    u * u * a.z + 2 * u * t * c.z + t * t * b.z,
  );
}
const suave = (x: number) => { const t = Math.min(1, Math.max(0, x)); return t * t * (3 - 2 * t); };

/** El ave posada en su rama y, cuando hay capturas pendientes, cazando. */
function AveCazadora({ cola, onCapturada }: { cola: React.MutableRefObject<Captura[]>; onCapturada: (id: number) => void }) {
  const g = useRef<THREE.Group>(null);
  const refs: RefsAve = {
    alaI: useRef<THREE.Group>(null), alaD: useRef<THREE.Group>(null),
    cabeza: useRef<THREE.Group>(null), presa: useRef<THREE.Group>(null),
  };
  const presaClara = useRef<THREE.Group>(null), presaOscura = useRef<THREE.Group>(null);
  const est = useRef({
    fase: 'reposo' as Fase, t: 0, cap: null as Captura | null,
    ctrl: new THREE.Vector3(), objetivo: new THREE.Vector3(), tmp: new THREE.Vector3(), prev: new THREE.Vector3(), dir: new THREE.Vector3(),
  });

  useFrame((state, dt) => {
    const ave = g.current; if (!ave) return;
    const s = est.current;
    const ritmo = cola.current.length > 1 ? 1.7 : 1; // si hay varias en cola, el ave se apura
    const tt = state.clock.elapsedTime;
    const dtc = Math.min(dt, 0.05);
    if (s.fase === 'reposo') {
      ave.position.copy(PERCHA_AVE);
      ave.rotation.set(0, -Math.PI / 2 + Math.sin(tt * 0.35) * 0.25, 0); // mira hacia el tronco, mueve la cabeza
      if (refs.cabeza.current) refs.cabeza.current.rotation.set(Math.sin(tt * 1.3) * 0.08, Math.sin(tt * 0.7) * 0.5, 0);
      s.t = 0;
      const sig = cola.current[0];
      if (sig) {
        s.cap = sig; s.fase = 'ida'; s.t = 0;
        s.objetivo.copy(sig.destino);
        s.ctrl.copy(PERCHA_AVE).lerp(sig.destino, 0.5).add(new THREE.Vector3(0.3, 1.1, 2.6));
      }
    } else if (s.fase === 'ida' || s.fase === 'vuelta') {
      const dur = (s.fase === 'ida' ? T_IDA : T_VUELTA) / ritmo;
      s.t += dtc / dur;
      const k = suave(Math.min(1, s.t));
      s.prev.copy(ave.position);
      if (s.fase === 'ida') bezier(PERCHA_AVE, s.ctrl, s.objetivo, k, s.tmp);
      else bezier(s.objetivo, s.ctrl, PERCHA_AVE, k, s.tmp);
      ave.position.copy(s.tmp);
      s.dir.copy(s.tmp).sub(s.prev);
      if (s.dir.lengthSq() > 1e-7) {
        s.dir.normalize();
        const yaw = Math.atan2(s.dir.x, s.dir.z);
        ave.rotation.set(-Math.asin(THREE.MathUtils.clamp(s.dir.y, -1, 1)) * 0.8, yaw, 0, 'YXZ');
      }
      if (s.t >= 1) {
        if (s.fase === 'ida') {
          // atrapa la polilla: desaparece del tronco y viaja en el pico
          if (s.cap) onCapturada(s.cap.id);
          s.fase = 'vuelta'; s.t = 0;
        } else { s.fase = 'comer'; s.t = 0; }
      }
    } else {
      s.t += dtc / T_COMER;
      ave.position.copy(PERCHA_AVE);
      ave.rotation.set(0, -Math.PI / 2, 0);
      if (refs.cabeza.current) refs.cabeza.current.rotation.set(0.35 * Math.sin(s.t * Math.PI * 4), 0, 0);
      if (s.t >= 1) {
        cola.current.shift(); s.cap = null; s.fase = 'reposo';
      }
    }
    // presa en el pico: sólo de regreso y mientras la traga
    const llevando = (s.fase === 'vuelta' || (s.fase === 'comer' && s.t < 0.6)) && !!s.cap;
    if (refs.presa.current) refs.presa.current.visible = llevando;
    if (presaClara.current) presaClara.current.visible = !!s.cap && s.cap.tipo === 'clara';
    if (presaOscura.current) presaOscura.current.visible = !!s.cap && s.cap.tipo === 'oscura';
    // alas: plegadas al posarse; abiertas y batiendo en vuelo
    const vuelo = s.fase === 'ida' || s.fase === 'vuelta';
    const plegado = vuelo ? 0 : 1;
    const bate = vuelo ? Math.sin(tt * 30) * 0.75 : 0;
    if (refs.alaD.current) refs.alaD.current.rotation.set(0, plegado * (Math.PI / 2 - 0.12), -bate - 0.1 * (1 - plegado));
    if (refs.alaI.current) refs.alaI.current.rotation.set(0, -plegado * (Math.PI / 2 - 0.12), bate + 0.1 * (1 - plegado));
  });

  return (
    <group ref={g} position={PERCHA_AVE} scale={1.5}>
      <Ave refs={refs}>
        {/* la presa se ve de lado, con las alas hacia el pico */}
        <group rotation={[Math.PI / 2, 0, 0]} scale={0.55}>
          <group ref={presaClara} visible={false}><Polilla fenotipo="clara" objetivo={false} /></group>
          <group ref={presaOscura} visible={false}><Polilla fenotipo="oscura" objetivo={false} /></group>
        </group>
      </Ave>
    </group>
  );
}

/** Todas las polillas posadas en la corteza. */
function Polillas({ bugs, capturadas, onHunt }: { bugs: Bug[]; capturadas: ReadonlySet<number>; onHunt: (id: number) => void }) {
  const lugares = useMemo(() => {
    const pts = bugs.map((b) => ({ id: b.id, ...puntoDeTronco(b.x, b.y) }));
    return relajarPosiciones(pts);
  }, [bugs]);
  return (
    <>
      {bugs.map((b) => {
        if (b.cazada && capturadas.has(b.id)) return null;
        const l = lugares.get(b.id)!;
        const p = posicionEnTronco(l.theta, l.h, 0.025);
        // la cabeza hacia arriba con un giro de hasta ±50° (las polillas se posan en cualquier orientación)
        const giro = ((b.angle % (Math.PI * 2)) / (Math.PI * 2) - 0.5) * 1.8;
        return (
          <group key={b.id} position={p} rotation={[0, l.theta, 0]}>
            <group rotation={[0, 0, giro]}>
              <Polilla fenotipo={b.tipo} onClick={b.cazada ? undefined : () => onHunt(b.id)} />
            </group>
          </group>
        );
      })}
    </>
  );
}

function Escena({ bugs, ambiente, onHunt }: { bugs: Bug[]; ambiente: Ambiente; onHunt: (id: number) => void }) {
  const cola = useRef<Captura[]>([]);
  const procesadas = useRef<Set<number> | null>(null);
  const [capturadas, setCapturadas] = useState<ReadonlySet<number>>(() => new Set(bugs.filter((b) => b.cazada).map((b) => b.id)));

  // Cada polilla marcada `cazada` que aún no se procesó entra en la cola del ave.
  useEffect(() => {
    const cazadasAhora = new Set(bugs.filter((b) => b.cazada).map((b) => b.id));
    if (procesadas.current === null) { procesadas.current = new Set(cazadasAhora); return; }
    const antes = procesadas.current;
    let reinicio = false;
    antes.forEach((id) => { if (!cazadasAhora.has(id)) reinicio = true; });
    if (reinicio) {
      // nueva generación o nueva población: se reinicia el ave y lo capturado
      cola.current = []; procesadas.current = new Set(cazadasAhora); setCapturadas(new Set(cazadasAhora));
      return;
    }
    const lugares = relajarPosiciones(bugs.map((b) => ({ id: b.id, ...puntoDeTronco(b.x, b.y) })));
    for (const b of bugs) {
      if (b.cazada && !antes.has(b.id)) {
        antes.add(b.id);
        const l = lugares.get(b.id)!;
        cola.current.push({ id: b.id, tipo: b.tipo, destino: posicionEnTronco(l.theta, l.h, 0.35) });
      }
    }
  }, [bugs]);

  const capturada = (id: number) => setCapturadas((prev) => (prev.has(id) ? prev : new Set(prev).add(id)));

  return (
    <>
      <EncuadrarCaja caja={[[-4.4, 0, -1], [8.2, 8.3, 1.5]]} direccion={[0.04, 0.1, 1]} margen={1.02} />
      <Tronco ambiente={ambiente} />
      <Rama ambiente={ambiente} />
      <Polillas bugs={bugs} capturadas={capturadas} onHunt={onHunt} />
      <AveCazadora cola={cola} onCapturada={capturada} />
    </>
  );
}

export default function SeleccionNatural3DScene({ bugs, ambiente, onHunt }: {
  bugs: Bug[];
  ambiente: Ambiente;
  generacion?: number;
  onHunt: (id: number) => void;
}) {
  return (
    <LabCanvas
      fondo="campo"
      camara={{ posicion: [1.5, 4.2, 15], objetivo: [1.8, 4.1, 0], fov: 38 }}
      controles={{ minDistancia: 4, maxDistancia: 26, maxPolar: 1.5, paneo: false }}
    >
      <Escena bugs={bugs} ambiente={ambiente} onHunt={onHunt} />
    </LabCanvas>
  );
}
