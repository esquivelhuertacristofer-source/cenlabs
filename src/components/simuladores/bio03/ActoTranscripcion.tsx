'use client';
/**
 * bio03/ActoTranscripcion.tsx — el complejo de alargamiento de la ARN polimerasa II
 * (marco de la polimerasa, 1 u = 1 nm).
 *
 *  · ADN B real (molecular.ts) a ambos lados: promotor, 5′ UTR (ya transcrita), el gen
 *    del reto y el flanco corriente abajo. En el marco de la polimerasa el ADN avanza en
 *    TORNILLO (0,338 nm y 34,3° por nucleótido): la polimerasa sigue el surco.
 *  · Burbuja de ≈ 13 nt: la hebra codificante se aparta por fuera hacia el bucle; la
 *    molde queda en su sitio y aparea con el ARN en el híbrido de 8 pb; el ARN se separa
 *    y sale por su canal hasta el exterior, con el capuchón 5′ en la punta.
 *  · Lo que hace el alumno: el NTP que ELIGE sube por el embudo (canal secundario) al
 *    sitio i+1; si aparea, se encienden sus puentes de H (2 en A–U, 3 en G–C), el Mg²⁺
 *    cataliza, se suelta el pirofosfato y la polimerasa transloca un paso. Si no aparea,
 *    se tambalea en rojo y se va.
 *  · NO REGALA: la hebra codificante del gen (igual al ARNm con T) está en gris perla
 *    por delante de la polimerasa; sólo toma color lo ya transcrito. El hueco i+1 está
 *    vacío hasta que el alumno elige.
 */
import React, { useEffect, useMemo, useRef } from 'react';
import * as THREE from 'three';
import { useFrame } from '@react-three/fiber';
import {
  COLOR_BASE, COLOR_NEUTRO, SECUENCIAS, UTR5, BURBUJA, NT_ARN_LIBRE, COMPLEMENTO_ADN, ADN_B,
  nucleotidoDuplex, nucleotidoCodificante, nucleotidoHibrido, caminoSalidaARN, puentesH, esPurina, type V3,
} from './molecular';
import { RelojSintesis, FASES_NTP, codificanteVisible } from './reloj';
import { geoEsfera, geoLosa, geoVarilla, matrizLosa, matrizCuenta, matrizVarilla, OCULTA } from './instancias';
import { materialCera, materialPreProfundidad, materialBrillo, texturaHalo, materialCorte, actualizarCorte } from './materiales';

// colores de las cadenas
const COL = {
  pMolde: '#4f6fcf', sMolde: '#93a9e4',
  pCodif: '#7d8db3', sCodif: '#b5c0d8',
  pARN: '#b06be8', sARN: '#dcb0f6',
  cap: '#ffd36e',
};
const ARN_MAX = UTR5 + 30;
const EJE_X: V3 = [1, 0, 0];
const sm = (a: number, b: number, x: number) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const mez = (p: V3, q: V3, k: number): V3 => [p[0] + (q[0] - p[0]) * k, p[1] + (q[1] - p[1]) * k, p[2] + (q[2] - p[2]) * k];
const resta = (p: V3, q: V3): V3 => [p[0] - q[0], p[1] - q[1], p[2] - q[2]];
const suma = (p: V3, q: V3): V3 => [p[0] + q[0], p[1] + q[1], p[2] + q[2]];
const escala = (p: V3, k: number): V3 => [p[0] * k, p[1] * k, p[2] * k];
const norma = (p: V3) => Math.hypot(p[0], p[1], p[2]);
const unit = (p: V3): V3 => { const l = norma(p) || 1; return [p[0] / l, p[1] / l, p[2] / l]; };
const cruz = (a: V3, b: V3): V3 => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];

/** Punta de la base acortada (hueco de ≈ 0,24 nm entre las dos bases de un par: los puentes de H). */
const recortar = (a: V3, b: V3, d = 0.12): V3 => { const v = resta(b, a), L = norma(v); return L > d + 0.05 ? suma(a, escala(v, (L - d) / L)) : b; };

/** Embudo de los NTP (canal secundario): de abajo-delante al sitio i+1. */
const F0: V3 = [1.7, -10, 4.4];
const F1: V3 = [0.9, -4.3, 2.1];
const bezier = (a: V3, b: V3, c: V3, t: number): V3 => {
  const u = 1 - t;
  return [u * u * a[0] + 2 * u * t * b[0] + t * t * c[0], u * u * a[1] + 2 * u * t * b[1] + t * t * c[1], u * u * a[2] + 2 * u * t * b[2] + t * t * c[2]];
};
/** Rota p alrededor de un eje unitario que pasa por o. */
function rotar(p: V3, o: V3, eje: V3, ang: number): V3 {
  const v = resta(p, o), c = Math.cos(ang), s = Math.sin(ang), d = v[0] * eje[0] + v[1] * eje[1] + v[2] * eje[2];
  const x = cruz(eje, v);
  return suma(o, [v[0] * c + x[0] * s + eje[0] * d * (1 - c), v[1] * c + x[1] * s + eje[1] * d * (1 - c), v[2] * c + x[2] * s + eje[2] * d * (1 - c)]);
}

/** Posición del Mg²⁺ catalítico: junto al extremo 3′ del ARN, del lado del embudo. */
export const POS_MG: V3 = suma(nucleotidoHibrido(-0.5, 'A').azucar, [0.15, -0.6, 0.35]);

export interface PropsTranscripcion {
  reloj: RelojSintesis;
  alta: boolean;
  geoPolimerasa: THREE.BufferGeometry | null;
  /** 0 → 1: la polimerasa suelta el ARN y se va (fin de la transcripción) */
  liberacion: React.RefObject<number>;
  /** polimerasa en corte (opaca, sin la mitad delantera) o entera y translúcida */
  corte: boolean;
}

/** Plano de corte de la polimerasa (marco propio): se quita lo que está por delante de z = 0,3 nm. */
const PLANO_POL = new THREE.Plane(new THREE.Vector3(0, 0, -1), 0.3);

export default function ActoTranscripcion({ reloj, alta, geoPolimerasa, liberacion, corte }: PropsTranscripcion) {
  // ── secuencia completa (hebra molde) y piezas
  const adnGen = reloj.hecho.adn;
  const sec = useMemo(() => {
    const molde = SECUENCIAS.promotorMolde + SECUENCIAS.utr5Molde + adnGen + SECUENCIAS.abajoMolde;
    return { molde, g0: -SECUENCIAS.promotorMolde.length, nGen: adnGen.length };
  }, [adnGen]);
  const nADN = sec.molde.length;
  const nCuentas = 4 * nADN + 2 * ARN_MAX + 12;
  const nLosas = 2 * nADN + ARN_MAX + 4;

  const cuentas = useRef<THREE.InstancedMesh>(null);
  const losas = useRef<THREE.InstancedMesh>(null);
  const puentes = useRef<THREE.InstancedMesh>(null);
  const mg = useRef<THREE.Mesh>(null);
  const halo = useRef<THREE.Sprite>(null);
  const haloMg = useRef<THREE.Sprite>(null);
  const haloNTP = useRef<THREE.Sprite>(null);
  const pol = useRef<THREE.Group>(null);

  const matMolecula = useMemo(() => materialCera({ rugosidad: 0.46, fuerzaBorde: 0.42, borde: '#d6e6ff' }), []);
  const matCascara = useMemo(() => materialCera({ vertexColors: true, rugosidad: 0.5, alfa: [0.09, 0.94], fuerzaBorde: 0.75, potenciaBorde: 2.4, borde: '#d9e8ff' }), []);
  const matPre = useMemo(() => materialPreProfundidad(), []);
  const matCorte = useMemo(() => materialCorte({ vertexColors: true, rugosidad: 0.52, fuerzaBorde: 0.38, potenciaBorde: 3.0, borde: '#e2ecff', plano: PLANO_POL }), []);
  const matPuente = useMemo(() => materialBrillo('#bff4ff', 2.6), []);
  const matMg = useMemo(() => materialBrillo('#9dffcf', 2.0), []);
  useEffect(() => () => { matMolecula.dispose(); matCascara.dispose(); matPre.dispose(); matCorte.dispose(); matPuente.dispose(); matMg.dispose(); }, [matMolecula, matCascara, matPre, matCorte, matPuente, matMg]);
  const haloMat = useMemo(() => new THREE.SpriteMaterial({ map: texturaHalo(), color: '#9fe8ff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }), []);
  const haloMgMat = useMemo(() => new THREE.SpriteMaterial({ map: texturaHalo(), color: '#7dffc4', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.4 }), []);
  const haloNTPMat = useMemo(() => new THREE.SpriteMaterial({ map: texturaHalo(), color: '#ffffff', transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, opacity: 0.5 }), []);
  useEffect(() => () => { haloMat.dispose(); haloMgMat.dispose(); haloNTPMat.dispose(); }, [haloMat, haloMgMat, haloNTPMat]);

  const m4 = useMemo(() => new THREE.Matrix4(), []);
  const col = useMemo(() => new THREE.Color(), []);
  const claveColor = useRef('');

  useFrame(() => {
    const C = cuentas.current, L = losas.current, P = puentes.current;
    if (!C || !L || !P) return;
    const t = reloj.t;
    const ev = reloj.actual;
    const f = reloj.fase;
    const nTx = reloj.hecho.nTx;
    const arnGen = reloj.hecho.arn;
    const sG = UTR5 + reloj.sTx;                 // nucleótidos transcritos (global)
    const lib = liberacion.current ?? 0;          // fin: la burbuja se cierra y el ARN se va
    const incorporando = ev?.tipo === 'incorporar' && f >= FASES_NTP.aparea;
    const nARN = UTR5 + nTx + (incorporando ? 1 : 0);
    let ic = 0, il = 0;
    const cuenta = (p: V3, r: number) => { C.setMatrixAt(ic++, matrizCuenta(m4, p, r)); };
    const losa = (a: V3, b: V3, arriba: V3, grosor: number, ancho: number) => { L.setMatrixAt(il++, matrizLosa(m4, a, recortar(a, b), arriba, grosor, ancho)); };

    // ── ADN: hebra molde y codificante
    for (let k = 0; k < nADN; k++) {
      const g = sec.g0 + k;
      const u = g - sG;
      const bm = sec.molde[k], bc = COMPLEMENTO_ADN[bm] ?? 'A';
      const m = nucleotidoDuplex(u, 0, bm);
      // al terminar, la burbuja se cierra: la codificante vuelve a su sitio
      const c0 = nucleotidoCodificante(u, bc);
      const c = lib > 0 ? (() => { const d = nucleotidoDuplex(u, 1, bc); return { azucar: mez(c0.azucar, d.azucar, lib), fosfato: mez(c0.fosfato, d.fosfato, lib), punta: mez(c0.punta, d.punta, lib) }; })() : c0;
      cuenta(m.fosfato, 0.27); cuenta(m.azucar, 0.235);
      cuenta(c.fosfato, 0.27); cuenta(c.azucar, 0.235);
      const g1 = esPurina(bm) ? 0.5 : 0.44, g2 = esPurina(bc) ? 0.5 : 0.44;
      losa(m.azucar, m.punta, EJE_X, 0.29, g1);
      losa(c.azucar, c.punta, EJE_X, 0.29, g2);
    }

    // ── ARN: híbrido y canal de salida (el 5′ es el índice 0)
    let previo: V3 | null = null;
    for (let r = nARN - 1; r >= 0; r--) {
      const base = r < UTR5 ? SECUENCIAS.utr5[r] : (r - UTR5 < nTx ? arnGen[r - UTR5] : ev?.valor ?? 'A');
      const u = r - sG;
      const hib = nucleotidoHibrido(Math.min(u, 0), base);
      let az: V3, fo: V3, pu: V3, arriba: V3 = EJE_X;
      // al soltarse (fin), todo el ARN sale del híbrido
      const uEf = u - lib * 12;
      if (uEf >= -BURBUJA.hibrido) { az = hib.azucar; fo = hib.fosfato; pu = hib.punta; }
      else {
        const sigma = (-BURBUJA.hibrido - uEf) * NT_ARN_LIBRE;
        const c = caminoSalidaARN(sigma, t);
        const c2 = caminoSalidaARN(sigma + 0.3, t);
        const tg = unit(resta(c2, c));
        const n1 = unit(cruz(tg, Math.abs(tg[1]) < 0.9 ? [0, 1, 0] : [1, 0, 0]));
        const n2 = cruz(tg, n1);
        const fi = 0.57 * r + 0.3 * Math.sin(0.4 * t + r);
        const dirB: V3 = [n1[0] * Math.cos(fi) + n2[0] * Math.sin(fi), n1[1] * Math.cos(fi) + n2[1] * Math.sin(fi), n1[2] * Math.cos(fi) + n2[2] * Math.sin(fi)];
        const largo = esPurina(base) ? 0.56 : 0.46;
        const libre = { az: c, fo: suma(c2, escala(dirB, -0.28)), pu: suma(c, escala(dirB, largo + 0.12)) };
        const w = sm(0, 1, -BURBUJA.hibrido - uEf);
        if (w < 1) { az = mez(hib.azucar, libre.az, w); fo = mez(hib.fosfato, libre.fo, w); pu = mez(hib.punta, libre.pu, w); arriba = EJE_X; }
        else { az = libre.az; fo = libre.fo; pu = libre.pu; arriba = tg; }
      }
      cuenta(fo, 0.27); cuenta(az, 0.235);
      losa(az, pu, arriba, 0.29, esPurina(base) ? 0.5 : 0.44);
      if (r === 0) {
        // capuchón 5′: 7-metilguanosina unida 5′–5′ por un trifosfato
        const dir = previo ? unit(resta(az, previo)) : [-1, 0.5, 0.3] as V3;
        const p1 = suma(az, escala(dir, 0.42)), p2 = suma(p1, escala(dir, 0.36)), p3 = suma(p2, escala(dir, 0.36));
        cuenta(p1, 0.2); cuenta(p2, 0.2); cuenta(p3, 0.2);
        const sCap = suma(p3, escala(dir, 0.42));
        cuenta(sCap, 0.25);
        const lado = unit(cruz(dir, [0, 0, 1]));
        losa(sCap, suma(sCap, escala(lado, 0.7)), dir, 0.3, 0.52);
        cuenta(suma(sCap, escala(lado, 0.85)), 0.14);   // el metilo del N7
      }
      previo = az;
    }

    // ── el NTP que eligió el alumno (llega por el embudo) y el pirofosfato que se suelta
    let puentesN = 0;
    let rojo = 0, catalisis = 0;
    let estela: V3 | null = null, estelaColor = '#ffffff';
    if (ev && (ev.tipo === 'incorporar' || ev.tipo === 'rechazarNTP')) {
      const ok = ev.tipo === 'incorporar';
      const base = ev.valor;
      const slot = nucleotidoHibrido(0, base);
      const llega = ok ? sm(0, FASES_NTP.llega, f) : sm(0, 0.4, f) * (1 - sm(0.62, 1, f));
      const vuelo = !ok || f < FASES_NTP.aparea;
      // tambaleo del mal apareado
      const temblor = !ok ? 0.5 * Math.sin(f * 60) * sm(0.38, 0.45, f) * (1 - sm(0.58, 0.65, f)) : 0;
      if (!ok) rojo = sm(0.4, 0.46, f) * (1 - sm(0.58, 0.66, f));
      if (vuelo) {
        const pos = bezier(F0, F1, slot.azucar, llega);
        const d = resta(pos, slot.azucar);
        const eje = unit([0.3, 0.8, 0.5]);
        const giro = (1 - llega) * 3.2 + temblor;
        const az = suma(slot.azucar, d);
        const pu = rotar(suma(slot.punta, d), az, eje, giro);
        const fo = rotar(suma(slot.fosfato, d), az, eje, giro);
        cuenta(fo, 0.27); cuenta(az, 0.235);
        losa(az, pu, rotar([1, 0, 0], [0, 0, 0], eje, giro), 0.29, esPurina(base) ? 0.5 : 0.44);
        // halo suave del color del NTP que eligió el alumno (para seguirlo por el embudo)
        estela = mez(az, pu, 0.5); estelaColor = COLOR_BASE[base] ?? '#ffffff';
        // trifosfato: β y γ colgando del α
        const cola = unit(resta(fo, az));
        cuenta(suma(fo, escala(cola, 0.4)), 0.24); cuenta(suma(fo, escala(cola, 0.78)), 0.24);
      }
      if (ok && f >= FASES_NTP.aparea) {
        // pirofosfato (β, γ) que vuelve por el embudo
        const k = sm(FASES_NTP.aparea, 1, f);
        const p0 = suma(slot.fosfato, [0.1, -0.4, 0.15]);
        const p = bezier(p0, F1, F0, k * 0.7);
        cuenta(p, 0.24); cuenta(suma(p, [0.18, -0.32, 0.12]), 0.24);
        catalisis = sm(FASES_NTP.aparea - 0.04, FASES_NTP.aparea + 0.02, f) * (1 - sm(FASES_NTP.pirofosfato, FASES_NTP.pirofosfato + 0.12, f));
      }
      // puentes de H entre la base molde (u = 0) y el NTP, sólo si aparean
      const brillo = ok ? sm(0.4, FASES_NTP.llega, f) * (1 - sm(0.8, 0.95, f)) : 0;
      if (brillo > 0.02) {
        const gM = sec.molde[UTR5 - sec.g0 + nTx];
        const nH = puentesH(gM ?? 'A', base);
        const mo = nucleotidoDuplex(0, 0, gM ?? 'A');
        const a = recortar(mo.azucar, mo.punta), b = recortar(slot.azucar, slot.punta);
        const ancho = unit(cruz(unit(resta(b, a)), EJE_X));
        for (let q = 0; q < nH; q++) {
          const off = (q - (nH - 1) / 2) * 0.13;
          P.setMatrixAt(puentesN++, matrizVarilla(m4, suma(a, escala(ancho, off)), suma(b, escala(ancho, off)), 0.022 * brillo + 0.004));
        }
      }
    }
    if (puentesN === 0) P.setMatrixAt(0, OCULTA);
    P.instanceMatrix.needsUpdate = true;

    // sólo se dibujan las instancias usadas
    C.count = ic; L.count = il; P.count = Math.max(1, puentesN);
    C.instanceMatrix.needsUpdate = true;
    L.instanceMatrix.needsUpdate = true;

    // ── colores (sólo cuando cambian)
    const clave = `${adnGen}|${nTx}|${incorporando ? 1 : 0}|${ev?.tipo ?? ''}${ev?.valor ?? ''}${ev && f < FASES_NTP.aparea ? 'v' : ''}|${nARN}`;
    if (clave !== claveColor.current) {
      claveColor.current = clave;
      let jc = 0, jl = 0;
      const cc = (hex: string) => { C.setColorAt(jc++, col.set(hex)); };
      const cl = (hex: string) => { L.setColorAt(jl++, col.set(hex)); };
      const nTxVis = nTx + (incorporando ? 1 : 0);
      for (let k = 0; k < nADN; k++) {
        const g = sec.g0 + k;
        const bm = sec.molde[k], bc = COMPLEMENTO_ADN[bm] ?? 'A';
        cc(COL.pMolde); cc(COL.sMolde); cc(COL.pCodif); cc(COL.sCodif);
        cl(COLOR_BASE[bm] ?? COLOR_NEUTRO);
        cl(codificanteVisible(g - UTR5, sec.nGen, nTxVis) ? (COLOR_BASE[bc] ?? COLOR_NEUTRO) : COLOR_NEUTRO);
      }
      for (let r = nARN - 1; r >= 0; r--) {
        const base = r < UTR5 ? SECUENCIAS.utr5[r] : (r - UTR5 < nTx ? arnGen[r - UTR5] : ev?.valor ?? 'A');
        cc(COL.pARN); cc(COL.sARN); cl(COLOR_BASE[base] ?? COLOR_NEUTRO);
        if (r === 0) { cc(COL.pARN); cc(COL.pARN); cc(COL.pARN); cc(COL.cap); cl(COL.cap); cc('#fff2c4'); }
      }
      if (ev && (ev.tipo === 'incorporar' || ev.tipo === 'rechazarNTP') && (ev.tipo === 'rechazarNTP' || f < FASES_NTP.aparea)) {
        cc(COL.pARN); cc(COL.sARN); cl(COLOR_BASE[ev.valor] ?? COLOR_NEUTRO); cc('#e0b04a'); cc('#e0b04a');
      }
      if (ev?.tipo === 'incorporar' && f >= FASES_NTP.aparea) { cc('#e0b04a'); cc('#e0b04a'); }
      if (C.instanceColor) C.instanceColor.needsUpdate = true;
      if (L.instanceColor) L.instanceColor.needsUpdate = true;
    }

    // ── brillos: base molde que se lee, Mg²⁺ y rechazo
    const leyendo = reloj.acto === 'transcripcion' && nTx < sec.nGen && lib === 0;
    if (halo.current) {
      const mo = nucleotidoDuplex(0, 0, 'A');
      const centro = mez(mo.azucar, mo.punta, 0.5);
      halo.current.position.set(centro[0], centro[1], centro[2] + 0.15);
      const pulso = 0.5 + 0.5 * Math.sin(reloj.t * 3.2);
      halo.current.visible = leyendo || rojo > 0;
      haloMat.color.set(rojo > 0 ? '#ff5a6a' : '#9fe8ff');
      haloMat.opacity = rojo > 0 ? rojo : 0.3 + 0.25 * pulso;
      halo.current.scale.setScalar(rojo > 0 ? 3.2 : 1.6 + 0.2 * pulso);
    }
    if (haloNTP.current) {
      haloNTP.current.visible = !!estela;
      if (estela) {
        haloNTP.current.position.set(estela[0], estela[1], estela[2]);
        haloNTPMat.color.set(rojo > 0 ? '#ff5a6a' : estelaColor);
        haloNTPMat.opacity = rojo > 0 ? 0.95 : 0.8;
        haloNTP.current.scale.setScalar(rojo > 0 ? 2.6 : 2.2);
      }
    }
    if (mg.current && haloMg.current) {
      mg.current.position.set(POS_MG[0], POS_MG[1], POS_MG[2]);
      haloMg.current.position.copy(mg.current.position);
      haloMgMat.opacity = 0.35 + 0.65 * catalisis;
      haloMg.current.scale.setScalar(1.0 + 1.6 * catalisis);
      matMg.emissiveIntensity = 1.6 + 3 * catalisis;
      mg.current.visible = haloMg.current.visible = lib < 0.5;
    }
    if (pol.current) {
      // al terminar, la polimerasa suelta el ADN y se aleja
      pol.current.position.set(-2 * lib, 7 * lib * lib, 3 * lib);
      pol.current.visible = lib < 0.98;
      pol.current.updateWorldMatrix(true, false);
      actualizarCorte(matCorte, pol.current.matrixWorld);
    }
  }, 0);

  const geoP = geoEsfera(alta);
  return (
    <group>
      <instancedMesh ref={cuentas} args={[geoP, matMolecula, nCuentas]} castShadow={alta} receiveShadow={alta} frustumCulled={false} />
      <instancedMesh ref={losas} args={[geoLosa(), matMolecula, nLosas]} castShadow={alta} receiveShadow={alta} frustumCulled={false} />
      <instancedMesh ref={puentes} args={[geoVarilla(), matPuente, 3]} frustumCulled={false} />
      <mesh ref={mg} geometry={geoP} material={matMg} scale={0.17} />
      <sprite ref={haloMg} material={haloMgMat} renderOrder={4} />
      <sprite ref={halo} material={haloMat} renderOrder={4} />
      <sprite ref={haloNTP} material={haloNTPMat} renderOrder={4} visible={false} />
      <group ref={pol}>
        {geoPolimerasa && (corte
          ? <mesh geometry={geoPolimerasa} material={matCorte} castShadow={alta} receiveShadow={alta} />
          : (
            <>
              <mesh geometry={geoPolimerasa} material={matPre} renderOrder={10} />
              <mesh geometry={geoPolimerasa} material={matCascara} renderOrder={11} />
            </>
          ))}
      </group>
    </group>
  );
}

/** Centro y tamaño del complejo (para la cámara). */
export const CAJA_TRANSCRIPCION = { centro: [-0.8, 1.2, 0] as V3, semiAlto: 9.2, semiAncho: 11 };
export const CAJA_BURBUJA = { centro: [-1.8, 0.6, 0.4] as V3, semiAlto: 5.6, semiAncho: 8.2 };
export const RADIO_ADN = ADN_B.radioP;
