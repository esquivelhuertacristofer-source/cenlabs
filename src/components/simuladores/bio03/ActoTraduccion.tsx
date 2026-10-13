'use client';
/**
 * bio03/ActoTraduccion.tsx — el ribosoma 80S traduciendo (marco del ribosoma, 1 u = 1 nm).
 *
 *  · ARNm con su capuchón 5′, la 5′ UTR (ya recorrida por la 40S), el gen y la 3′ UTR
 *    con la cola poli(A); pasa recto por el canal de la 40S y fuera se curva y ondula.
 *  · Iniciación: la 40S espera en el AUG con el sitio P VACÍO y la 60S suelta encima.
 *    Cuando el alumno elige el ARNt iniciador, llega al sitio P con su factor (eIF2) y la
 *    60S baja y se une (80S). En la célula el iniciador viaja con la 40S durante el
 *    escaneo: aquí llega después porque es lo que el alumno decide.
 *  · Alargamiento (ciclo por codón): el ARNt elegido llega con eEF1A al sitio A (estado
 *    A/T), aparea (puentes de H), el factor se va, el ARNt se acomoda con su extremo CCA
 *    en el centro peptidiltransferasa, la cadena pasa al aminoácido nuevo (enlace
 *    peptídico) y el ribosoma transloca un codón: A → P, P → E; el ARNt del E sale en
 *    el ciclo siguiente.
 *  · Error: el ARNt elegido llega, no aparea (rojo) y se va.
 *  · Paro: entra el factor de liberación eRF1 (imita a un ARNt), hidroliza, la cadena
 *    sale por el túnel y las subunidades se separan.
 *  · NO REGALA: el sitio que se decide está vacío hasta que el alumno elige; los ARNt del
 *    fondo no llevan anticodón visible.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  COLOR_BASE, COLOR_NEUTRO, SECUENCIAS, UTR5, NT_ARNM, LARGO_CODON, CPT, INCLINACION_AP, CA_CA, LARGO_TUNEL,
  caminoARNm, caminoTunel, xNucleotidoRibosoma, colorAA, radioResiduo, esPurina, anticodonDe, aminoacidoDe, puentesH, type V3,
} from './molecular';
import { L_ARNT } from './superficie';
import { rngConSemilla } from '@/domain/biologia';
import { RelojSintesis, FASES_ELONGACION } from './reloj';
import { geoEsfera, geoLosa, geoVarilla, matrizLosa, matrizCuenta, matrizVarilla, OCULTA } from './instancias';
import { materialCera, materialPreProfundidad, materialBrillo, texturaHalo, materialCorte, actualizarCorte } from './materiales';

const COL = { p: '#b06be8', s: '#dcb0f6', cap: '#ffd36e', arnt: '#ffffff' };
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mez = (p: V3, q: V3, k: number): V3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
const resta = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const suma = (p: V3, q: V3): V3 => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const escala = (p: V3, k: number): V3 => [p[0] * k, p[1] * k, p[2] * k];
const unit = (p: V3): V3 => { const l = Math.hypot(p[0], p[1], p[2]) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

const MAX_ARNT = 6;
/** Tinte (multiplica el color del ARNt) según el sitio. */
const TINTE = { E: '#8e99a8', P: '#c9e2ff', A: '#ffffff', rojo: '#ff5c5c' };
const MAX_RES = 32;
const Y_ANCLA = 0.62;
/** De dónde llegan los ARNt (y su factor) y adónde se van: arriba a la derecha (lado del sitio A) y arriba a la izquierda (E). */
const LLEGADA: V3 = [11, 9, 5];
const SALIDA_E: V3 = [-11, 9, 4];

/** Dónde queda la proteína liberada (marco del ribosoma), ya lejos de las subunidades. */
export const POS_PEPTIDO: V3 = [0, 3.6, 3];
/** Ovillo estadístico fijo de la cadena liberada (paso Cα–Cα 0,38 nm, ángulo ≈ 110°, torsión al azar). */
const OVILLO: V3[] = (() => {
  const rng = rngConSemilla(71);
  const out: V3[] = [[0, 0, 0]];
  let d: V3 = [1, 0, 0];
  let ref: V3 = [0, 1, 0];
  for (let i = 1; i < MAX_RES; i++) {
    // gira d ≈ 70° (ángulo de enlace virtual ≈ 110°) en torno a un eje perpendicular al azar
    const perp = unit(cruz(d, ref));
    const tors = (rng() - 0.5) * 2 * Math.PI;
    const eje = unit(suma(escala(perp, Math.cos(tors)), escala(unit(cruz(perp, d)), Math.sin(tors))));
    const a = (70 * Math.PI) / 180;
    const c = Math.cos(a), s = Math.sin(a);
    const x = cruz(eje, d);
    d = unit([d[0] * c + x[0] * s, d[1] * c + x[1] * s, d[2] * c + x[2] * s]);
    ref = perp;
    const q = out[i - 1];
    out.push([q[0] + CA_CA * d[0], q[1] + CA_CA * d[1], q[2] + CA_CA * d[2]]);
  }
  return out;
})();

/** Pose de un ARNt: ancla (centro del anticodón) y rotación. */
interface Pose { ancla: V3; q: THREE.Quaternion; escala: number }

const _e = new THREE.Euler();
const qDe = (x: number, y: number, z: number) => new THREE.Quaternion().setFromEuler(_e.set(x, y, z, 'ZXY'));
/** Inclinación (en torno a z) de un ARNt según su sitio (o = codón − kP: A = 1, P = 0, E = −1). */
const inclinacion = (o: number) => (o >= 0 ? -INCLINACION_AP + 2 * INCLINACION_AP * Math.min(1, o) : -INCLINACION_AP + (0.34 + INCLINACION_AP) * Math.min(1, -o));
/** Estado A/T: el factor sujeta el extremo aceptor fuera del CPT, hacia delante. */
const Q_AT = qDe(0.55, 0, -0.42);

export interface PropsTraduccion {
  reloj: RelojSintesis;
  alta: boolean;
  geo: { menor: THREE.BufferGeometry; mayor: THREE.BufferGeometry; arnt: THREE.BufferGeometry; erf: THREE.BufferGeometry; ef: THREE.BufferGeometry } | null;
  /** 0 → 1 durante la exportación: el ARNm entra desde la izquierda */
  llegada: React.RefObject<number>;
  /** subunidades en corte (opacas, sin la mitad delantera) o enteras y translúcidas */
  corte: boolean;
}

/** Corte de la 40S (marco propio): se quita lo que está por delante de z = 0,9 nm (deja ver el canal del ARNm). */
const PLANO_RIBO = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.9);
/**
 * Corte de la 60S: un plano que CONTIENE el eje del túnel de salida (pasa 0,2 nm por
 * detrás del centro peptidiltransferasa y se inclina hacia atrás al subir, como el
 * túnel): deja a la vista los ARNt, el CPT y la cadena dentro del túnel.
 */
const N_60S = new THREE.Vector3(0, -0.32, -0.9).normalize();
const PLANO_60S = new THREE.Plane(N_60S, -N_60S.dot(new THREE.Vector3(CPT[0], CPT[1], CPT[2])) - 0.2);

export default function ActoTraduccion({ reloj, alta, geo, llegada, corte }: PropsTraduccion) {
  const arnGen = reloj.hecho.arn;
  const sec = useMemo(() => SECUENCIAS.utr5 + arnGen + SECUENCIAS.utr3 + 'A'.repeat(SECUENCIAS.poliA), [arnGen]);
  const nNt = sec.length;
  const nCuentas = 2 * nNt + 8;
  const nLosas = nNt + 3 * MAX_ARNT + 2;

  const cuentas = useRef<THREE.InstancedMesh>(null);
  const losas = useRef<THREE.InstancedMesh>(null);
  const arnts = useRef<THREE.InstancedMesh>(null);
  const residuos = useRef<THREE.InstancedMesh>(null);
  const enlaces = useRef<THREE.InstancedMesh>(null);
  const puentes = useRef<THREE.InstancedMesh>(null);
  const menor = useRef<THREE.Group>(null);
  const mayor = useRef<THREE.Group>(null);
  const ef = useRef<THREE.Mesh>(null);
  const erf = useRef<THREE.Mesh>(null);
  const destello = useRef<THREE.Sprite>(null);
  const alerta = useRef<THREE.Sprite>(null);

  const matMol = useMemo(() => materialCera({ rugosidad: 0.46, fuerzaBorde: 0.42, borde: '#d6e6ff' }), []);
  const matARNt = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.5, fuerzaBorde: 0.5, borde: '#d8fff6' }), []);
  const matFactor = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.5, fuerzaBorde: 0.45, borde: '#ffe6dc' }), []);
  const matResiduo = useMemo(() => materialCera({ rugosidad: 0.35, fuerzaBorde: 0.6, borde: '#ffffff', clearcoat: 0.5 }), []);
  const matCascara = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.55, alfa: [0.13, 0.9], fuerzaBorde: 0.5, potenciaBorde: 2.3, borde: '#d6e6ff' }), []);
  const matPre = useMemo(() => materialPreProfundidad(), []);
  const matCorteMenor = useMemo(() => materialCorte({ vertexColors: true, rugosidad: 0.52, fuerzaBorde: 0.36, potenciaBorde: 3.0, borde: '#fff3dc', plano: PLANO_RIBO }), []);
  const matCorteMayor = useMemo(() => materialCorte({ vertexColors: true, rugosidad: 0.52, fuerzaBorde: 0.36, potenciaBorde: 3.0, borde: '#e2ecff', plano: PLANO_60S }), []);
  const matPuente = useMemo(() => materialBrillo('#bff4ff', 2.6), []);
  useEffect(() => () => { [matMol, matARNt, matFactor, matResiduo, matCascara, matPre, matCorteMenor, matCorteMayor, matPuente].forEach((m) => m.dispose()); }, [matMol, matARNt, matFactor, matResiduo, matCascara, matPre, matCorteMenor, matCorteMayor, matPuente]);
  const matDestello = useMemo(() => new THREE.SpriteMaterial({ map: texturaHalo(), color: '#fff1c2', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0 }), []);
  // el aviso de error se ve aunque lo tape el ARNt (sin prueba de profundidad)
  const matAlerta = useMemo(() => new THREE.SpriteMaterial({ map: texturaHalo(), color: '#ff5a6a', transparent: true, depthWrite: false, depthTest: false, blending: THREE.AdditiveBlending, opacity: 0 }), []);
  useEffect(() => () => { matDestello.dispose(); matAlerta.dispose(); }, [matDestello, matAlerta]);

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const mT = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const vTmp = useMemo(() => new THREE.Vector3(), []);
  const claveColor = useRef('');

  /** Punto local del ARNt → mundo. */
  const aMundo = (p: V3, pose: Pose): V3 => {
    vTmp.set(p[0], p[1], p[2]).multiplyScalar(pose.escala).applyQuaternion(pose.q);
    return [vTmp.x + pose.ancla[0], vTmp.y + pose.ancla[1], vTmp.z + pose.ancla[2]];
  };

  useFrame(() => {
    const C = cuentas.current, L = losas.current, T = arnts.current, R = residuos.current, E = enlaces.current, P = puentes.current;
    if (!C || !L || !T || !R || !E || !P) return;
    const t = reloj.t;
    const ev = reloj.actual;
    const f = reloj.fase;
    const kP = reloj.kP;
    const nCod = reloj.hecho.nCod;
    const ens = reloj.ensamblado;
    const sep = reloj.separacion;
    const entra = llegada.current ?? 1;
    let ic = 0, il = 0;
    const cuenta = (p: V3, r: number) => { C.setMatrixAt(ic++, matrizCuenta(m4, p, r)); };
    const losa = (a: V3, b: V3, arriba: V3, grosor: number, ancho: number) => { L.setMatrixAt(il++, matrizLosa(m4, a, b, arriba, grosor, ancho)); };

    // ── ARNm (m = 0 es la A del AUG; la UTR va en negativo). Al exportarse entra desde la izquierda.
    const desliz = (1 - entra) * -40;
    const soltado = 0.5 * sep;   // al separarse las subunidades el ARNm queda libre (cae un poco)
    let previo: V3 | null = null;
    for (let i = 0; i < nNt; i++) {
      const m = i - UTR5;
      const x = xNucleotidoRibosoma(m, kP) + desliz;
      const c = caminoARNm(x, t);
      c[1] -= 1.2 * soltado;
      const c2 = caminoARNm(x + 0.3, t); c2[1] -= 1.2 * soltado;
      const tg = unit(resta(c2, c));
      const dentro = Math.abs(x) < 8.5;
      const n1: V3 = dentro ? [0, 1, 0] : unit(cruz(tg, [0, 0, 1]));
      const fi = dentro ? 0 : 0.5 * (Math.abs(x) - 8.5) * 0.4 + 0.25 * Math.sin(0.5 * t + i);
      const n2 = cruz(tg, n1);
      const dirB: V3 = [n1[0] * Math.cos(fi) + n2[0] * Math.sin(fi), n1[1] * Math.cos(fi) + n2[1] * Math.sin(fi), n1[2] * Math.cos(fi) + n2[2] * Math.sin(fi)];
      const az: V3 = [c[0], c[1] - 0.05, c[2]];
      const fo = suma(mez(c, c2, 1), escala(dirB, -0.3));
      const base = sec[i];
      const largo = esPurina(base) ? 0.47 : 0.4;
      cuenta(fo, 0.25); cuenta(az, 0.22);
      losa(az, suma(az, escala(dirB, largo)), tg, 0.27, esPurina(base) ? 0.48 : 0.42);
      if (i === 0) {
        const dir = previo ? unit(resta(az, previo)) : unit(resta(c, c2));
        const p1 = suma(az, escala(dir, 0.4)), p2 = suma(p1, escala(dir, 0.34)), p3 = suma(p2, escala(dir, 0.34));
        cuenta(p1, 0.2); cuenta(p2, 0.2); cuenta(p3, 0.2);
        const sCap = suma(p3, escala(dir, 0.4)); cuenta(sCap, 0.25);
        const lado = unit(cruz(dir, [0, 0, 1]));
        losa(sCap, suma(sCap, escala(lado, 0.66)), dir, 0.3, 0.52);
      }
      previo = az;
    }

    // ── poses de los ARNt
    const poses: { pose: Pose; anticodon: string; vis: boolean; tinte: string }[] = [];
    let ccaCadena: V3 | null = null;        // extremo CCA que sujeta la cadena
    let aaNuevo: { pos: V3; aa: string } | null = null;
    let transferido: string | null = null;  // aminoácido ya unido a la cadena aunque el ciclo no haya acabado
    const tipo = ev?.tipo;
    for (let k = 0; k < nCod; k++) {
      const o = k - kP;
      if (o < -1.6) continue;
      // el del sitio E sale en el ciclo siguiente (o al terminar)
      let sale = 0;
      if (o <= -0.99) sale = tipo === 'elongar' ? sm(0, 0.42, f) : tipo === 'terminar' ? sm(0.6, 0.9, f) : reloj.hecho.terminada ? 1 : 0;
      if (o > -0.99 && (tipo === 'terminar' || reloj.hecho.terminada)) sale = tipo === 'terminar' ? sm(0.72, 1, f) : 1;
      if (sale >= 0.999) continue;
      const ancla: V3 = [o * LARGO_CODON, Y_ANCLA, 0];
      const pose: Pose = { ancla: mez(ancla, o <= -0.99 ? SALIDA_E : suma(ancla, [0, 10, 12]), sale * sale), q: qDe(0, 0, inclinacion(o)), escala: 1 - 0.5 * sale };
      // tinte por sitio: el del E (de salida) apagado, el del P azulado, el del A tal cual
      poses.push({ pose, anticodon: anticodonDe(arnGen.slice(3 * k, 3 * k + 3)), vis: true, tinte: o <= -0.5 ? TINTE.E : o < 0.5 ? TINTE.P : TINTE.A });
      // la cadena cuelga del último ARNt aceptado (salvo durante la transferencia)
      if (k === nCod - 1 && !(tipo === 'terminar' && f > 0.42) && !reloj.hecho.terminada) ccaCadena = aMundo(L_ARNT.cca, pose);
    }
    // el ARNt (o el factor) que eligió el alumno
    let rojo = 0, parear = 0, chispa = 0;
    let poseEF: Pose | null = null;
    let poseRF: Pose | null = null;
    if (tipo === 'iniciar' || tipo === 'elongar' || tipo === 'rechazarARNt') {
      const k = ev!.indice;
      const enP = k === 0;                       // iniciación: al sitio P
      const o = enP ? 0 : k - kP;
      const destino: V3 = [o * LARGO_CODON, Y_ANCLA, 0];
      const ok = tipo !== 'rechazarARNt';
      const fl = FASES_ELONGACION;
      const llega = ok ? sm(0, fl.llega, f) : sm(0, 0.36, f) * (1 - sm(0.66, 1, f));
      const acomoda = ok ? sm(fl.aparea, fl.acomoda, f) : 0;
      const temblor = !ok ? 0.08 * Math.sin(f * 70) * sm(0.36, 0.42, f) * (1 - sm(0.6, 0.66, f)) : 0;
      if (!ok) rojo = sm(0.36, 0.42, f) * (1 - sm(0.6, 0.68, f));
      if (ok) parear = sm(fl.llega - 0.04, fl.llega + 0.02, f) * (1 - sm(fl.enlace, fl.enlace + 0.15, f));
      const qFin = qDe(0, 0, enP ? -INCLINACION_AP : inclinacion(o));
      const qLlega = Q_AT.clone().multiply(qDe(0.9 * (1 - llega), 1.6 * (1 - llega), temblor));
      const q = qLlega.slerp(qFin, acomoda);
      const pose: Pose = { ancla: mez(suma(destino, LLEGADA), destino, llega), q, escala: 1 };
      poses.push({ pose, anticodon: ev!.valor, vis: true, tinte: TINTE.A });
      // el factor (eEF1A o eIF2) acompaña hasta que el ARNt se acomoda
      const efSale = ok ? sm(fl.aparea, fl.acomoda + 0.05, f) : sm(0.66, 1, f);
      const pEF = aMundo([0.9, 6.0, 2.2], { ...pose, q: Q_AT.clone().multiply(qDe(0.9 * (1 - llega), 1.6 * (1 - llega), 0)) });
      poseEF = { ancla: mez(pEF, suma(pEF, [8, 6, 10]), efSale * efSale), q: qDe(0.3 + t * 0.02, 0.6, 0.2), escala: 1 };
      const aa = ok ? ev!.aa! : aminoacidoDe(anticodonDe(ev!.valor));   // un ARNt equivocado trae SU aminoácido
      if (aa && aa !== 'STOP' && aa !== '???') {
        const pc = aMundo(L_ARNT.cca, pose);
        // transferencia: la cadena pasa del ARNt del P al aminoácido del recién llegado
        if (ok && tipo === 'elongar' && f >= fl.acomoda + 0.03) { ccaCadena = pc; transferido = aa; chispa = sm(fl.acomoda + 0.03, fl.acomoda + 0.07, f) * (1 - sm(fl.enlace, fl.enlace + 0.08, f)); }
        else aaNuevo = { pos: pc, aa };
      }
    }
    if (tipo === 'terminar') {
      const destino: V3 = [LARGO_CODON, Y_ANCLA, 0];
      const llega = sm(0, 0.3, f);
      const sale = sm(0.72, 1, f);
      poseRF = { ancla: mez(mez(suma(destino, LLEGADA), destino, llega), suma(destino, [4, 12, 12]), sale * sale), q: Q_AT.clone().multiply(qDe(0.9 * (1 - llega), 1.6 * (1 - llega), 0)).slerp(qDe(0, 0, INCLINACION_AP), sm(0.22, 0.32, f)), escala: 1 };
      chispa = sm(0.32, 0.36, f) * (1 - sm(0.42, 0.5, f));
    }

    // cuerpos de ARNt y anticodones
    T.count = Math.max(1, Math.min(MAX_ARNT, poses.length));
    if (!poses.length) T.setMatrixAt(0, OCULTA);
    for (let q = 0; q < MAX_ARNT; q++) {
      const it = poses[q];
      if (!it) continue;
      mT.compose(vTmp.set(...it.pose.ancla), it.pose.q, new THREE.Vector3(it.pose.escala, it.pose.escala, it.pose.escala));
      T.setMatrixAt(q, mT);
      for (let b = 0; b < 3; b++) {
        const xl = (b - 1) * NT_ARNM;
        losa(aMundo([xl, 0.46, 0], it.pose), aMundo([xl, 0.0, 0], it.pose), aMundo([1, 0, 0], { ...it.pose, ancla: [0, 0, 0] }), 0.27, esPurina(it.anticodon[b]) ? 0.48 : 0.42);
      }
    }
    T.instanceMatrix.needsUpdate = true;
    for (let q = 0; q < poses.length && q < MAX_ARNT; q++) T.setColorAt(q, col.set(rojo > 0.05 && q === poses.length - 1 && tipo === 'rechazarARNt' ? TINTE.rojo : poses[q].tinte));
    if (T.instanceColor) T.instanceColor.needsUpdate = true;

    // puentes de H codón–anticodón del recién llegado (sólo si aparea)
    let np = 0;
    if (parear > 0.02 && ev) {
      const k = ev.indice;
      const it = poses[poses.length - 1];
      const codon = arnGen.slice(3 * k, 3 * k + 3);
      for (let b = 0; b < 3; b++) {
        const nH = puentesH(codon[b], ev.valor[b]);
        const xm = xNucleotidoRibosoma(3 * k + b, kP);
        const a: V3 = [xm, 0.4, 0];
        const bb = aMundo([(b - 1) * NT_ARNM, 0.0, 0], it.pose);
        for (let h = 0; h < nH && np < 9; h++) {
          const off = (h - (nH - 1) / 2) * 0.12;
          P.setMatrixAt(np++, matrizVarilla(m4, [a[0], a[1], a[2] + off], [bb[0], bb[1], bb[2] + off], 0.02 * parear + 0.004));
        }
      }
    }
    if (np === 0) P.setMatrixAt(0, OCULTA);
    P.count = Math.max(1, np);
    P.instanceMatrix.needsUpdate = true;

    // ── la cadena polipeptídica: del CCA por el túnel (N-terminal delante)
    const pep = transferido ? [...reloj.peptido, transferido] : reloj.peptido;
    const nRes = pep.length;
    let ir = 0, ie = 0;
    let anterior: V3 | null = null;
    // al terminar: la cadena se suelta, sale por el túnel y queda libre, delante, en ovillo
    const liberada = tipo === 'terminar' ? sm(0.42, 0.72, f) : reloj.hecho.terminada ? 1 : 0;
    const vitrina = tipo === 'terminar' ? sm(0.66, 1, f) : reloj.hecho.terminada ? 1 : 0;
    const avance = liberada * (LARGO_TUNEL + 2);
    const cOvillo = (() => { let cx = 0, cy = 0, cz = 0; for (let j = 0; j < nRes; j++) { cx += OVILLO[j][0]; cy += OVILLO[j][1]; cz += OVILLO[j][2]; } const k = Math.max(1, nRes); return [cx / k, cy / k, cz / k] as V3; })();
    for (let j = nRes - 1; j >= 0; j--) {
      const atras = nRes - 1 - j;           // 0 = el más reciente (junto al CCA)
      let p: V3;
      const s = atras * CA_CA * 0.92 + avance;
      if (ccaCadena && liberada === 0) p = atras === 0 ? ccaCadena : mez(ccaCadena, caminoTunel(s), Math.min(1, atras));
      else p = caminoTunel(s);
      if (s > LARGO_TUNEL) {
        // ya fuera: se enrolla al azar (θ_hélice ≈ 0 con 4–6 residuos) y deriva despacio
        const e = s - LARGO_TUNEL;
        p = suma(caminoTunel(LARGO_TUNEL), [-0.3 * e + 0.35 * Math.sin(1.7 * j + 0.3 * t), 0.5 * e + 0.3 * Math.sin(2.3 * j), -0.2 * e + 0.3 * Math.cos(1.9 * j + 0.25 * t)]);
      }
      // zigzag del esqueleto extendido
      p = suma(p, [0.1 * (j % 2 ? 1 : -1), 0, 0.06 * (j % 2 ? -1 : 1)]);
      if (vitrina > 0) {
        // ovillo estadístico (θ_hélice ≈ 0 con 4–6 residuos), con agitación térmica suave
        const o = OVILLO[j];
        const w = 0.05;
        const q: V3 = [POS_PEPTIDO[0] + o[0] - cOvillo[0] + w * Math.sin(1.3 * t + j), POS_PEPTIDO[1] + o[1] - cOvillo[1] + w * Math.sin(1.7 * t + 2 * j), POS_PEPTIDO[2] + o[2] - cOvillo[2] + w * Math.cos(1.1 * t + j)];
        p = mez(p, q, vitrina * vitrina * (3 - 2 * vitrina));
      }
      R.setMatrixAt(ir++, matrizCuenta(m4, p, radioResiduo(pep[j]) * 1.15));
      if (anterior) E.setMatrixAt(ie++, matrizVarilla(m4, anterior, p, 0.07));
      anterior = p;
    }
    if (aaNuevo) {
      R.setMatrixAt(ir++, matrizCuenta(m4, aaNuevo.pos, radioResiduo(aaNuevo.aa) * 1.15));
    }
    if (ir === 0) R.setMatrixAt(0, OCULTA);
    if (ie === 0) E.setMatrixAt(0, OCULTA);
    R.count = Math.max(1, ir); E.count = Math.max(1, ie);
    R.instanceMatrix.needsUpdate = true; E.instanceMatrix.needsUpdate = true;
    // sólo se dibujan las instancias usadas
    C.count = ic; L.count = il;
    C.instanceMatrix.needsUpdate = true; L.instanceMatrix.needsUpdate = true;

    // ── colores (cuando cambian)
    const clave = `${arnGen}|${poses.map((p) => p.anticodon).join(',')}|${pep.join(',')}|${aaNuevo?.aa ?? ''}`;
    if (clave !== claveColor.current) {
      claveColor.current = clave;
      let jc = 0, jl = 0;
      for (let i = 0; i < nNt; i++) {
        C.setColorAt(jc++, col.set(COL.p)); C.setColorAt(jc++, col.set(COL.s));
        L.setColorAt(jl++, col.set(COLOR_BASE[sec[i]] ?? COLOR_NEUTRO));
        if (i === 0) { for (let q = 0; q < 3; q++) C.setColorAt(jc++, col.set(COL.p)); C.setColorAt(jc++, col.set(COL.cap)); L.setColorAt(jl++, col.set(COL.cap)); }
      }
      for (const it of poses) for (let b = 0; b < 3; b++) L.setColorAt(jl++, col.set(COLOR_BASE[it.anticodon[b]] ?? COLOR_NEUTRO));
      let kr = 0;
      for (let j = nRes - 1; j >= 0; j--) R.setColorAt(kr++, col.set(colorAA(pep[j])));
      if (aaNuevo) R.setColorAt(kr++, col.set(colorAA(aaNuevo.aa)));
      [C, L, R].forEach((im) => { if (im.instanceColor) im.instanceColor.needsUpdate = true; });
    }

    // ── subunidades, factores y destellos
    // al terminar, las subunidades se separan y se alejan (fuera del encuadre de la proteína)
    if (menor.current) { menor.current.position.set(-3 * sep, -18 * sep, 4 * sep); menor.current.updateWorldMatrix(true, false); actualizarCorte(matCorteMenor, menor.current.matrixWorld); }
    if (mayor.current) {
      const fuera = 1 - ens;
      // antes de la iniciación la 60S espera libre, detrás y a la derecha; al final se separa
      mayor.current.position.set(15 * fuera + 4 * sep, -1 * fuera + 22 * sep, -20 * fuera - 2 * sep);
      mayor.current.updateWorldMatrix(true, false); actualizarCorte(matCorteMayor, mayor.current.matrixWorld);
    }
    if (ef.current) {
      ef.current.visible = !!poseEF;
      if (poseEF) { ef.current.position.set(...poseEF.ancla); ef.current.quaternion.copy(poseEF.q); }
    }
    if (erf.current) {
      erf.current.visible = !!poseRF;
      if (poseRF) { erf.current.position.set(...poseRF.ancla); erf.current.quaternion.copy(poseRF.q); }
    }
    if (destello.current) {
      destello.current.position.set(CPT[0], CPT[1], CPT[2]);
      matDestello.opacity = chispa;
      destello.current.scale.setScalar(1.5 + 3 * chispa);
      destello.current.visible = chispa > 0.01;
    }
    if (alerta.current && ev) {
      const k = ev.indice, o = k === 0 ? 0 : k - kP;
      alerta.current.position.set(o * LARGO_CODON, 0.5, 0.3);
      matAlerta.opacity = 0.95 * rojo;
      alerta.current.scale.setScalar(2.6);
      alerta.current.visible = rojo > 0.01;
    } else if (alerta.current) alerta.current.visible = false;
  }, 0);

  const geoP = geoEsfera(alta);
  return (
    <group>
      <instancedMesh ref={cuentas} args={[geoP, matMol, nCuentas]} castShadow={alta} receiveShadow={alta} frustumCulled={false} />
      <instancedMesh ref={losas} args={[geoLosa(), matMol, nLosas]} castShadow={alta} receiveShadow={alta} frustumCulled={false} />
      <instancedMesh ref={residuos} args={[geoP, matResiduo, MAX_RES]} castShadow={alta} frustumCulled={false} />
      <instancedMesh ref={enlaces} args={[geoVarilla(), matMol, MAX_RES]} frustumCulled={false} />
      <instancedMesh ref={puentes} args={[geoVarilla(), matPuente, 9]} frustumCulled={false} />
      {geo && (
        <>
          <instancedMesh ref={arnts} args={[geo.arnt, matARNt, MAX_ARNT]} castShadow={alta} receiveShadow={alta} frustumCulled={false} />
          <mesh ref={ef} geometry={geo.ef} material={matFactor} castShadow={alta} visible={false} />
          <mesh ref={erf} geometry={geo.erf} material={matFactor} castShadow={alta} visible={false} />
          <group ref={menor}>
            {corte
              ? <mesh geometry={geo.menor} material={matCorteMenor} castShadow={alta} receiveShadow={alta} />
              : <><mesh geometry={geo.menor} material={matPre} renderOrder={10} /><mesh geometry={geo.menor} material={matCascara} renderOrder={11} /></>}
          </group>
          <group ref={mayor}>
            {corte
              ? <mesh geometry={geo.mayor} material={matCorteMayor} castShadow={alta} receiveShadow={alta} />
              : <><mesh geometry={geo.mayor} material={matPre} renderOrder={12} /><mesh geometry={geo.mayor} material={matCascara} renderOrder={13} /></>}
          </group>
        </>
      )}
      <sprite ref={destello} material={matDestello} renderOrder={4} />
      <sprite ref={alerta} material={matAlerta} renderOrder={30} />
    </group>
  );
}

export const CAJA_RIBOSOMA = { centro: [0, 3.4, 0] as V3, semiAlto: 12.6, semiAncho: 14.5 };
export const CAJA_SITIOS = { centro: [0.2, 3.9, 0.4] as V3, semiAlto: 8.4, semiAncho: 10 };
/** La proteína recién liberada con el ARNm debajo. */
export const CAJA_PEPTIDO = { centro: [0, 2.5, 2.8] as V3, semiAlto: 3.5, semiAncho: 4.6 };
