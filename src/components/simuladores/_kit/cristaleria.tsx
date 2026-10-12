'use client';
/**
 * _kit/cristaleria.tsx — cristalería de laboratorio torneada con medidas reales.
 *
 * Todas las piezas tienen su origen en el CENTRO DE LA BASE (y = 0 apoyada en la
 * mesa) y su eje en +Y. La pared tiene grosor, el borde lleva cordón y los vasos y
 * probetas, pico vertedor. Las graduaciones se imprimen en una banda de lienzo
 * cuyas marcas salen de integrar el perfil (`alturaParaVolumen`): una marca de
 * 150 mL está exactamente donde llega el líquido cuando hay 150 mL.
 *
 * Cada pieza acepta las props normales de un <group> (position, rotation, scale…).
 */
import React, { useMemo } from 'react';
import * as THREE from 'three';
import type { ThreeElements } from '@react-three/fiber';
import {
  defVaso, defErlenmeyer, defAforado, defProbeta, defBureta, defBalon, defTubo, defVidrioReloj,
  defEmbudo, defJeringa, defCristalizador, radioExteriorEn, jeringaAlturaEmbolo, buretaVolumenDeLectura,
  mm, PROBETA_ALTO_PIE, type DefRecipiente, type P2,
} from './perfiles';
import { geoCache, tornear, deformarPico, bandaSobrePerfil, cilindro, extruir, formaRectRedondeado, sanearNormales } from './geometria';
import { useMateriales, useCalidad, type Materiales } from './materiales';
import { familiaTexto, useVersionFuentes, crearLienzo, texturaDeLienzo, rectRed } from './texturas';
import { Liquido } from './Liquido';

type GroupProps = ThreeElements['group'];
export interface LiquidoEn { volumenML: number; color?: string; menisco?: number }

const SEG = { alta: 72, media: 40 } as const;

// ───────────────────────────── vidrio torneado ─────────────────────────────

function geoVidrio(def: DefRecipiente, segs: number, conPico = true): THREE.BufferGeometry {
  return geoCache(`vidrio:${def.id}:${segs}:${conPico && !!def.pico}`, () => {
    const g = tornear(def.solido, segs);
    if (conPico && def.pico) deformarPico(g, { ...def.pico, yTop: def.altura });
    return g;
  });
}

function Vidrio({ def, conPico = true, material }: { def: DefRecipiente; conPico?: boolean; material?: THREE.Material }) {
  const m = useMateriales();
  const geo = geoVidrio(def, SEG[m.calidad], conPico);
  return <mesh geometry={geo} material={material ?? m.vidrio} renderOrder={3} castShadow customDepthMaterial={m.sombraVidrio} />;
}

// ───────────────────────────── bandas impresas ─────────────────────────────

interface CfgEscala {
  color: string;
  /** longitudes de raya por nivel, en fracción del ancho de la banda */
  rayas: [number, number, number];
  x0: number;        // inicio de las rayas (fracción)
  numX: number;      // posición del número (fracción)
  numMM: number;     // altura del número (mm)
  grosorMM: number;
  titulo?: string[];
  tituloMM?: number;
  /** mostrar sólo números (sin raya) en marcas de nivel 0 */
  sinMenores?: boolean;
}

const U_POR_PX = 0.0011; // 0,11 mm por píxel: rayas de 0,1 mL de bureta nítidas
const MAX_PX = 2000;

type Pieza = { geo: THREE.BufferGeometry; mat: THREE.MeshStandardMaterial };
const cacheBandas = new Map<string, Pieza[]>();

/** Banda impresa (esmalte) sobre el exterior de una pieza, partida en trozos ≤ 2000 px. */
function BandaImpresa({ def, clave, y0, y1, centro, ancho, dibujar }: {
  def: DefRecipiente; clave: string; y0: number; y1: number; centro: number; ancho: number;
  dibujar: (ctx: CanvasRenderingContext2D, W: number, H: number, yA: number, yB: number) => void;
}) {
  const vf = useVersionFuentes();
  const calidad = useCalidad();
  const piezas = useMemo(() => {
    if (typeof document === 'undefined') return [];
    const k = `${def.id}|${clave}|${vf}|${calidad}`;
    let p = cacheBandas.get(k);
    if (p) return p;
    const rExt = (y: number) => radioExteriorEn(def.solido, y);
    const rMed = rExt((y0 + y1) / 2);
    const arco = ancho / rMed;
    const altoPx = (y1 - y0) / U_POR_PX;
    const n = Math.max(1, Math.ceil(altoPx / MAX_PX));
    const W = Math.min(1024, Math.round(ancho / U_POR_PX));
    p = [];
    for (let i = 0; i < n; i++) {
      const yA = y0 + ((y1 - y0) * i) / n, yB = y0 + ((y1 - y0) * (i + 1)) / n;
      const H = Math.round((yB - yA) / U_POR_PX);
      const c = crearLienzo(W, H);
      const ctx = c.getContext('2d')!;
      dibujar(ctx, W, H, yA, yB);
      const tex = texturaDeLienzo(c);
      const filas = Math.max(4, Math.round((yB - yA) / 0.02));
      const geo = bandaSobrePerfil(rExt, yA, yB, { arco, centro, holgura: 0.0012, filas, segmentos: calidad === 'alta' ? 24 : 12 });
      const mat = new THREE.MeshStandardMaterial({
        map: tex, alphaTest: 0.42, roughness: 0.55, metalness: 0,
        polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
      });
      p.push({ geo, mat });
    }
    cacheBandas.set(k, p);
    return p;
  }, [def, clave, y0, y1, centro, ancho, vf, calidad, dibujar]);
  return <>{piezas.map((p, i) => <mesh key={i} geometry={p.geo} material={p.mat} renderOrder={2} />)}</>;
}

/** Dibuja rayas y números de una escala volumétrica. */
function escalaVolumetrica(def: DefRecipiente, cfg: CfgEscala, marcas = def.graduacion?.marcas ?? []) {
  return (ctx: CanvasRenderingContext2D, W: number, H: number, yA: number, yB: number) => {
    const py = (y: number) => ((yB - y) / (yB - yA)) * H;
    const px = (mmv: number) => (mmv * 0.01) / U_POR_PX;
    const fam = familiaTexto();
    ctx.fillStyle = cfg.color; ctx.strokeStyle = cfg.color;
    const g = px(cfg.grosorMM);
    const margen = px(cfg.numMM) * 1.2;
    for (const mk of marcas) {
      const y = py(def.alturaParaVolumen(mk.mL));
      if (y < -margen || y > H + margen) continue;
      if (!(cfg.sinMenores && mk.nivel === 0)) {
        const len = cfg.rayas[mk.nivel] * W;
        ctx.fillRect(cfg.x0 * W, y - g / 2, len, g);
      }
      if (mk.texto) {
        ctx.font = `600 ${px(cfg.numMM)}px ${fam}`;
        ctx.textBaseline = 'middle';
        ctx.fillText(mk.texto, cfg.numX * W, y);
      }
    }
    if (cfg.titulo) {
      const ult = marcas[marcas.length - 1];
      let y = py(def.alturaParaVolumen(ult?.mL ?? def.nominalML)) - px(cfg.numMM) * 1.5;
      cfg.titulo.forEach((t, i) => {
        const tam = i === 0 ? px(cfg.tituloMM ?? cfg.numMM * 1.4) : px(cfg.numMM * 0.85);
        ctx.font = `${i === 0 ? 700 : 500} ${tam}px ${fam}`;
        ctx.textBaseline = 'alphabetic';
        ctx.fillText(t, cfg.x0 * W, y);
        y -= tam * 1.15;
      });
    }
  };
}

/** Parche esmaltado para rotular (los vasos y matraces reales lo traen). */
function ParcheRotulo({ def, y0, y1, centro, ancho }: { def: DefRecipiente; y0: number; y1: number; centro: number; ancho: number }) {
  const dib = useMemo(() => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = '#f6f6f3';
    rectRed(ctx, 2, 2, W - 4, H - 4, Math.min(W, H) * 0.12); ctx.fill();
  }, []);
  return <BandaImpresa def={def} clave={`parche:${y0}:${centro}`} y0={y0} y1={y1} centro={centro} ancho={ancho} dibujar={dib} />;
}

// ───────────────────────────── piezas ─────────────────────────────

export interface PropsVaso extends GroupProps {
  capacidad?: 50 | 100 | 250 | 600;
  liquido?: LiquidoEn;
  graduado?: boolean;
}
/** Vaso de precipitados Griffin forma baja (50/100/250/600 mL). Pico hacia −X. */
export function VasoPrecipitado({ capacidad = 250, liquido, graduado = true, ...g }: PropsVaso) {
  const def = defVaso(capacidad);
  const marcas = def.graduacion!.marcas;
  const yA = def.alturaParaVolumen(marcas[0].mL) - 0.025;
  const yB = Math.min(def.altura * 0.93, def.alturaParaVolumen(marcas[marcas.length - 1].mL) + mm(16));
  const rEx = def.radioMax;
  const dib = useMemo(() => escalaVolumetrica(def, {
    color: '#fbfbf8', rayas: [0.26, 0.26, 0.4], x0: 0.04, numX: 0.5, numMM: capacidad >= 250 ? 4.2 : 3.4, grosorMM: 0.75,
    titulo: [`${capacidad} mL`], tituloMM: capacidad >= 250 ? 5.5 : 4.2,
  }), [def, capacidad]);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {graduado && (
        <>
          <BandaImpresa def={def} clave="grad" y0={yA} y1={yB} centro={0.42} ancho={Math.min(0.34, rEx * 0.95)} dibujar={dib} />
          <ParcheRotulo def={def} y0={def.altura * 0.28} y1={def.altura * 0.62} centro={-0.55} ancho={rEx * 0.62} />
        </>
      )}
      {liquido && <Liquido recipiente={def} {...liquido} />}
    </group>
  );
}

export interface PropsErlenmeyer extends GroupProps { capacidad?: 50 | 100 | 250 | 500; liquido?: LiquidoEn; graduado?: boolean; tapon?: boolean }
/** Matraz Erlenmeyer de cuello estrecho (50/100/250/500 mL). */
export function Erlenmeyer({ capacidad = 250, liquido, graduado = true, tapon = false, ...g }: PropsErlenmeyer) {
  const def = defErlenmeyer(capacidad);
  const marcas = def.graduacion!.marcas;
  const yA = def.alturaParaVolumen(marcas[0].mL) - 0.025;
  const yB = def.alturaParaVolumen(marcas[marcas.length - 1].mL) + mm(14);
  const dib = useMemo(() => escalaVolumetrica(def, {
    color: '#fbfbf8', rayas: [0.24, 0.24, 0.36], x0: 0.05, numX: 0.46, numMM: capacidad >= 250 ? 4 : 3.2, grosorMM: 0.75,
    titulo: [`${capacidad} mL`], tituloMM: capacidad >= 250 ? 5 : 3.8,
  }), [def, capacidad]);
  const rCuello = radioExteriorEn(def.solido, def.altura - 0.05);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {graduado && <BandaImpresa def={def} clave="grad" y0={yA} y1={yB} centro={0.2} ancho={radioExteriorEn(def.solido, (yA + yB) / 2) * 0.75} dibujar={dib} />}
      {liquido && <Liquido recipiente={def} {...liquido} />}
      {tapon && <TaponHule radioBoca={rCuello - def.grosor} position={[0, def.altura - 0.01, 0]} />}
    </group>
  );
}

export interface PropsAforado extends GroupProps { capacidad?: 50 | 100 | 250 | 500 | 1000; liquido?: LiquidoEn; tapon?: boolean; colorTapon?: string }
/** Matraz aforado clase A con marca de aforo calculada integrando el perfil. */
export function MatrazAforado({ capacidad = 250, liquido, tapon = true, colorTapon = '#2d6fb7', ...g }: PropsAforado) {
  const def = defAforado(capacidad);
  const m = useMateriales();
  const yAf = def.extra.yAforo;
  const rCuelloExt = def.extra.radioCuello + def.grosor;
  const yEsm = def.altura - mm(capacidad >= 500 ? 26 : 22);
  const dib = useMemo(() => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const fam = familiaTexto();
    const px = (v: number) => (v * 0.01) / U_POR_PX;
    ctx.fillStyle = '#fbfbf8';
    ctx.textAlign = 'center';
    ctx.font = `700 ${px(capacidad >= 250 ? 7 : 5)}px ${fam}`;
    ctx.fillText(`${capacidad} mL`, W / 2, H * 0.36);
    ctx.font = `600 ${px(capacidad >= 250 ? 4 : 3)}px ${fam}`;
    ctx.fillText('A   In 20 °C', W / 2, H * 0.62);
    const tol = { 50: 0.06, 100: 0.1, 250: 0.15, 500: 0.25, 1000: 0.4 }[capacidad] ?? 0.15;
    ctx.fillText(`± ${tol.toFixed(2)} mL`, W / 2, H * 0.86);
  }, [capacidad]);
  const yC = def.extra.radioBulbo ? def.grosor + 0.8 * def.extra.radioBulbo : def.altura * 0.25;
  return (
    <group {...g}>
      <Vidrio def={def} />
      {/* marca de aforo: anillo esmaltado completo alrededor del cuello */}
      <mesh geometry={cilindro(rCuelloExt + 0.0012, rCuelloExt + 0.0012, mm(0.8), 40, true)} material={m.impreso('#f8f8f6')} position={[0, yAf, 0]} />
      {/* esmerilado de la boca (cono NS) */}
      <mesh geometry={cilindro(rCuelloExt + 0.0008, rCuelloExt + 0.0008, def.altura - yEsm - mm(2.5), 40, true)} material={m.vidrioEsmerilado} position={[0, (def.altura - mm(2.5) + yEsm) / 2, 0]} />
      <BandaImpresa def={def} clave="rotulo" y0={yC - 0.12} y1={yC + 0.12} centro={0} ancho={def.extra.radioBulbo * 1.1} dibujar={dib} />
      {liquido && <Liquido recipiente={def} {...liquido} />}
      {tapon && <TaponPE radio={rCuelloExt} color={colorTapon} position={[0, def.altura - mm(9), 0]} />}
    </group>
  );
}

export interface PropsProbeta extends GroupProps { capacidad?: 10 | 25 | 50 | 100 | 250; liquido?: LiquidoEn; colorEscala?: string }
/** Probeta graduada de forma alta con pie hexagonal (10–250 mL). */
export function Probeta({ capacidad = 100, liquido, colorEscala = '#1d4f9e', ...g }: PropsProbeta) {
  const def = defProbeta(capacidad);
  const m = useMateriales();
  const marcas = def.graduacion!.marcas;
  const yA = def.alturaParaVolumen(marcas[0].mL) - 0.02;
  const yB = def.alturaParaVolumen(capacidad) + mm(22);
  const dib = useMemo(() => escalaVolumetrica(def, {
    color: colorEscala, rayas: [0.16, 0.26, 0.4], x0: 0.04, numX: 0.5, numMM: capacidad >= 50 ? 3.6 : 2.8, grosorMM: 0.5,
    titulo: [`${capacidad} mL`, 'In 20 °C'], tituloMM: capacidad >= 50 ? 4.6 : 3.4,
  }), [def, capacidad, colorEscala]);
  const pie = def.extra.pie;
  const geoPie = useMemo(() => geoCache(`pieHex:${pie}`, () => {
    const s = poligonoRedondeado(6, pie / 2 / Math.cos(Math.PI / 6), 0.14);
    const geo = extruir(s, PROBETA_ALTO_PIE, 6);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }), [pie]);
  // collarín que une el tubo al pie
  const rTubo = def.extra.radioInterior + def.grosor;
  const geoCuello = useMemo(() => geoCache(`collarin:${def.id}:${SEG[m.calidad]}`, () => {
    const p: P2[] = [[0.0005, PROBETA_ALTO_PIE - 0.001], [rTubo * 1.9, PROBETA_ALTO_PIE - 0.001], [rTubo * 1.35, PROBETA_ALTO_PIE + mm(3)], [rTubo * 1.05, PROBETA_ALTO_PIE + mm(7)], [rTubo * 0.6, PROBETA_ALTO_PIE + mm(7.2)]];
    return tornear(p, SEG[m.calidad]);
  }), [def.id, rTubo, m.calidad]);
  return (
    <group {...g}>
      <mesh geometry={geoPie} material={m.vidrio} renderOrder={3} />
      <mesh geometry={geoCuello} material={m.vidrio} renderOrder={3} />
      <Vidrio def={def} />
      <BandaImpresa def={def} clave={'grad' + colorEscala} y0={yA} y1={yB} centro={0.3} ancho={Math.min(0.26, rTubo * 1.6)} dibujar={dib} />
      {liquido && <Liquido recipiente={def} {...liquido} />}
    </group>
  );
}

export interface PropsBureta extends GroupProps {
  /** lectura en la escala (mL): 0 = lleno hasta el cero; 50 = en la última marca */
  lecturaML?: number;
  colorLiquido?: string;
  /** llave de paso: 0 cerrada (manija horizontal) … 1 abierta (manija vertical) */
  llave?: number;
  /** franja Schellbach (blanca con línea azul) en la espalda */
  schellbach?: boolean;
  /** sin líquido */
  vacia?: boolean;
}
/** Bureta 50 mL: 0 arriba, 50 abajo, división 0,1 mL; llave de PTFE girable. Origen en la PUNTA. */
export function Bureta({ lecturaML = 0, colorLiquido = '#cfe6ef', llave = 0, schellbach = true, vacia = false, ...g }: PropsBureta) {
  const def = defBureta();
  const m = useMateriales();
  const y0 = def.extra.y0Marca, y50 = def.extra.y50Marca;
  const dib = useMemo(() => escalaVolumetrica(def, {
    color: '#173f86', rayas: [0.22, 0.34, 0.56], x0: 0.02, numX: 0.62, numMM: 3.1, grosorMM: 0.32,
  }, def.graduacion!.marcas.map((k) => ({ ...k, mL: def.extra.volumenEnCero - k.mL }))), [def]);
  // el escalado de la bureta es al revés: la marca "k" está donde el volumen desde la punta es V0 − k
  const dibTitulo = useMemo(() => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    const fam = familiaTexto();
    const px = (v: number) => (v * 0.01) / U_POR_PX;
    ctx.fillStyle = '#173f86';
    ctx.font = `700 ${px(3.6)}px ${fam}`; ctx.fillText('50 mL', W * 0.06, H * 0.3);
    ctx.font = `500 ${px(2.6)}px ${fam}`; ctx.fillText('Ex 20 °C', W * 0.06, H * 0.58);
    ctx.fillText('± 0.05 mL  B', W * 0.06, H * 0.86);
  }, []);
  const dibStripe = useMemo(() => (ctx: CanvasRenderingContext2D, W: number, H: number) => {
    ctx.fillStyle = '#f7f7f4'; ctx.fillRect(0, 0, W, H);
    ctx.fillStyle = '#1f55b8'; ctx.fillRect(W * 0.42, 0, W * 0.16, H);
  }, []);
  const rEx = def.extra.radioInterior + def.grosor;
  const ancho = rEx * 1.9;
  const volumen = vacia ? 0 : buretaVolumenDeLectura(Math.max(-1.5, Math.min(50.5, lecturaML)));
  return (
    <group {...g}>
      <Vidrio def={def} />
      <BandaImpresa def={def} clave="escala" y0={y50 - 0.02} y1={y0 + 0.03} centro={0.28} ancho={ancho} dibujar={dib} />
      <BandaImpresa def={def} clave="titulo" y0={y0 + 0.07} y1={y0 + 0.17} centro={0.28} ancho={ancho} dibujar={dibTitulo} />
      {schellbach && <BandaImpresa def={def} clave="schellbach" y0={y50 - 0.08} y1={y0 + 0.08} centro={Math.PI} ancho={rEx * 1.25} dibujar={dibStripe} />}
      {volumen > 0 && <Liquido recipiente={def} volumenML={volumen} color={colorLiquido} />}
      <LlavePaso apertura={llave} position={[0, def.extra.yLlave, 0]} materiales={m} />
    </group>
  );
}

/** Llave de paso de PTFE (barril de vidrio horizontal en X, manija en +X). */
function LlavePaso({ apertura, materiales: m, ...g }: GroupProps & { apertura: number; materiales: Materiales }) {
  const segs = SEG[m.calidad];
  const barril = useMemo(() => geoCache(`barrilLlave:${segs}`, () => {
    const p: P2[] = [[0.0005, -0.17], [0.05, -0.17], [0.058, -0.165], [0.06, -0.15], [0.066, 0.15], [0.064, 0.165], [0.056, 0.17], [0.0005, 0.17]];
    const geo = tornear(p, segs);
    geo.rotateZ(-Math.PI / 2); // eje del torno (Y) → X
    return geo;
  }), [segs]);
  const tapon = useMemo(() => geoCache(`taponPTFE:${segs}`, () => {
    const geo = new THREE.CylinderGeometry(0.052, 0.046, 0.46, segs);
    geo.rotateZ(-Math.PI / 2);
    return geo;
  }), [segs]);
  const manija = useMemo(() => geoCache('manijaLlave', () => {
    const s = formaRectRedondeado(0.34, 0.11, 0.05);
    const geo = extruir(s, 0.035, 10);
    geo.translate(0, 0, -0.0175);
    geo.rotateY(Math.PI / 2); // la placa queda en el plano YZ
    return geo;
  }), []);
  const ang = (1 - Math.max(0, Math.min(1, apertura))) * (Math.PI / 2);
  return (
    <group {...g}>
      <mesh geometry={barril} material={m.vidrio} renderOrder={3} />
      <mesh geometry={tapon} material={m.ptfe} castShadow />
      {/* tuerca y arandela del lado −X */}
      <mesh geometry={cilindro(0.068, 0.068, 0.07, 6)} material={m.plastico('#2f6fc4', 0.5)} position={[-0.27, 0, 0]} rotation-z={Math.PI / 2} castShadow />
      <mesh geometry={cilindro(0.07, 0.07, 0.012, 24)} material={m.ptfe} position={[-0.226, 0, 0]} rotation-z={Math.PI / 2} />
      {/* manija: gira alrededor de X. Vertical (paralela a la bureta) = abierta */}
      <group position={[0.245, 0, 0]} rotation-x={ang}>
        <mesh geometry={cilindro(0.045, 0.05, 0.05, 24)} material={m.ptfe} rotation-z={Math.PI / 2} castShadow />
        <mesh geometry={manija} material={m.ptfe} position={[0.03, 0, 0]} castShadow />
      </group>
    </group>
  );
}

export interface PropsBalon extends GroupProps { capacidad?: 100 | 250 | 500; liquido?: LiquidoEn; aro?: boolean }
/** Matraz de fondo redondo (balón). Con `aro` se apoya en un aro de corcho. */
export function MatrazBalon({ capacidad = 250, liquido, aro = false, ...g }: PropsBalon) {
  const def = defBalon(capacidad);
  const Rb = def.extra.radioBulbo + def.grosor;
  const rAro = Rb * 0.62;
  const alzado = aro ? mm(22) - (Rb - Math.sqrt(Math.max(0, Rb * Rb - (rAro - mm(4)) ** 2))) : 0;
  return (
    <group {...g}>
      {aro && <AroCorcho radio={rAro} />}
      <group position={[0, alzado, 0]}>
        <Vidrio def={def} />
        {liquido && <Liquido recipiente={def} {...liquido} />}
      </group>
    </group>
  );
}

export interface PropsTubo extends GroupProps { tamano?: '13x100' | '16x150' | '18x180' | '25x150'; liquido?: LiquidoEn; tapon?: boolean }
/** Tubo de ensayo de borde rebordeado y fondo semiesférico. */
export function TuboEnsayo({ tamano = '16x150', liquido, tapon = false, ...g }: PropsTubo) {
  const def = defTubo(tamano);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {liquido && <Liquido recipiente={def} {...liquido} />}
      {tapon && <TaponHule radioBoca={def.interior[def.interior.length - 1][0]} position={[0, def.altura - 0.005, 0]} />}
    </group>
  );
}

export interface PropsReloj extends GroupProps { diametro?: 75 | 100 | 125; polvo?: string; cantidadPolvo?: number }
/** Vidrio de reloj; con `polvo` lleva un montoncito de sólido (p. ej. sal, sulfato). */
export function VidrioReloj({ diametro = 100, polvo, cantidadPolvo = 0.5, ...g }: PropsReloj) {
  const def = defVidrioReloj(diametro);
  const m = useMateriales();
  const geoPolvo = useMemo(() => geoCache(`polvo:${diametro}:${cantidadPolvo.toFixed(2)}`, () => {
    const R = mm(diametro) * 0.18 * (0.6 + cantidadPolvo * 0.8), H = R * 0.55;
    const pts: P2[] = [];
    for (let i = 0; i <= 14; i++) {
      const t = i / 14;
      const r = R * (1 - t);
      pts.push([r, Math.pow(1 - Math.pow(r / R, 1.6), 0.9) * H]);
    }
    // de la orilla (r = R, y = 0) a la cima (r = 0): normales hacia fuera
    pts[pts.length - 1] = [0, H];
    const geo = tornear(pts, 28);
    // grumos: perturbación determinista de la superficie
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), y = p.getY(i), z = p.getZ(i);
      const n = Math.sin(x * 140) * Math.cos(z * 130) * 0.004 + Math.sin((x + z) * 260) * 0.002;
      p.setY(i, y + (y > 0.002 ? n : 0));
    }
    geo.computeVertexNormals(); sanearNormales(geo);
    return geo;
  }), [diametro, cantidadPolvo]);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {polvo && <mesh geometry={geoPolvo} material={m.plastico(polvo, 0.9)} position={[0, def.y0 + 0.001, 0]} castShadow />}
    </group>
  );
}

export interface PropsEmbudo extends GroupProps { diametro?: 75 | 100; liquido?: LiquidoEn; filtro?: boolean }
/** Embudo de vidrio de 60° con vástago; `filtro` añade papel filtro plegado. Origen en la punta del vástago. */
export function Embudo({ diametro = 75, liquido, filtro = false, ...g }: PropsEmbudo) {
  const def = defEmbudo(diametro);
  const m = useMateriales();
  const geoFiltro = useMemo(() => geoCache(`filtro:${diametro}`, () => {
    // cono de papel ligeramente separado de la pared, con pliegues
    const yv = def.interior[2]?.[1] ?? 0.8;
    const ytop = def.interior[def.interior.length - 1][1] + mm(4);
    const pts: P2[] = [];
    for (let i = 0; i <= 12; i++) {
      const y = yv + mm(3) + ((ytop - yv - mm(3)) * i) / 12;
      pts.push([Math.max(0.0005, def.radioInteriorEn(Math.min(y, def.yMax)) - mm(1.2) + (y > def.yMax ? (y - def.yMax) * 0.6 : 0)), y]);
    }
    const geo = tornear(pts, 32);
    const p = geo.getAttribute('position') as THREE.BufferAttribute;
    for (let i = 0; i < p.count; i++) {
      const x = p.getX(i), z = p.getZ(i); const f = Math.atan2(x, z);
      const k = 1 - 0.035 * Math.abs(Math.sin(f * 8));
      p.setX(i, x * k); p.setZ(i, z * k);
    }
    geo.computeVertexNormals(); sanearNormales(geo);
    return geo;
  }), [diametro, def]);
  const matPapel = useMemo(() => {
    const mm2 = m.plastico('#f3f1ea', 0.95).clone(); mm2.side = THREE.DoubleSide; return mm2;
  }, [m]);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {filtro && <mesh geometry={geoFiltro} material={matPapel} castShadow />}
      {liquido && <Liquido recipiente={def} {...liquido} />}
    </group>
  );
}

export interface PropsJeringa extends GroupProps { capacidad?: 5 | 10 | 20; volumenML?: number; colorLiquido?: string; conLiquido?: boolean }
/** Jeringa de plástico con émbolo: `volumenML` coloca el émbolo. Punta hacia −Y, origen en la punta. */
export function Jeringa({ capacidad = 10, volumenML = 0, colorLiquido = '#cfe6ef', conLiquido = true, ...g }: PropsJeringa) {
  const def = defJeringa(capacidad);
  const m = useMateriales();
  const Ri = def.extra.radioInterior;
  const yEmb = jeringaAlturaEmbolo(capacidad, Math.max(0, Math.min(capacidad * 1.12, volumenML)));
  const yTop = def.altura;
  const dib = useMemo(() => escalaVolumetrica(def, {
    color: '#161a1d', rayas: [0.2, 0.32, 0.45], x0: 0.03, numX: 0.52, numMM: 2.6, grosorMM: 0.35,
    titulo: [`${capacidad} mL`], tituloMM: 3.2,
  }, def.graduacion!.marcas.map((k) => ({ ...k, mL: k.mL + def.extra.volumenMuerto }))), [def, capacidad]);
  const segs = SEG[m.calidad];
  const geoAletas = useMemo(() => geoCache(`aletas:${capacidad}`, () => {
    const s = formaRectRedondeado(Ri * 5.4, Ri * 2.6, Ri * 1.1);
    const h = new THREE.Path(); h.absarc(0, 0, Ri + def.grosor * 0.5, 0, Math.PI * 2, true); s.holes.push(h);
    const geo = extruir(s, mm(2.2), 24);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }), [capacidad, Ri, def.grosor]);
  const geoGoma = useMemo(() => geoCache(`gomaEmbolo:${capacidad}:${segs}`, () => {
    const r = Ri - 0.0004;
    const p: P2[] = [[0.0005, 0], [r * 0.5, mm(0.6)], [r * 0.92, mm(1.4)], [r, mm(2.2)], [r * 0.93, mm(3.2)], [r * 0.9, mm(4.4)], [r, mm(5.2)], [r * 0.9, mm(6.2)], [r * 0.6, mm(6.6)], [0.0005, mm(6.6)]];
    return tornear(p, segs);
  }), [capacidad, Ri, segs]);
  const largoVastago = yTop - yEmb + mm(12);
  return (
    <group {...g}>
      <mesh geometry={geoVidrio(def, segs, false)} material={m.plasticoClaro} renderOrder={3} />
      <mesh geometry={geoAletas} material={m.plasticoClaro} position={[0, yTop - mm(2.2), 0]} renderOrder={3} />
      <BandaImpresa def={def} clave="grad" y0={def.extra.yCero - 0.02} y1={def.extra.yCero + def.extra.escala * 1.0 + mm(9)} centro={0.15} ancho={Ri * 1.8} dibujar={dib} />
      {conLiquido && volumenML > 0 && (
        <Liquido recipiente={def} volumenML={def.volumenHastaAltura(yEmb) - 0.0001} color={colorLiquido} menisco={0} />
      )}
      {/* émbolo: goma negra + vástago en cruz + apoyo del pulgar */}
      <group position={[0, yEmb, 0]}>
        <mesh geometry={geoGoma} material={m.goma} />
        <mesh geometry={cilindro(Ri * 0.6, Ri * 0.6, mm(1.5), 24)} material={m.plastico('#f4f4f2', 0.4)} position={[0, mm(7.2), 0]} />
        <mesh position={[0, mm(7.5) + largoVastago / 2, 0]} material={m.plastico('#f4f4f2', 0.4)} castShadow>
          <boxGeometry args={[Ri * 1.7, largoVastago, mm(1.4)]} />
        </mesh>
        <mesh position={[0, mm(7.5) + largoVastago / 2, 0]} material={m.plastico('#f4f4f2', 0.4)} castShadow>
          <boxGeometry args={[mm(1.4), largoVastago, Ri * 1.7]} />
        </mesh>
        <mesh geometry={cilindro(Ri * 1.5, Ri * 1.5, mm(2), 32)} material={m.plastico('#f4f4f2', 0.4)} position={[0, mm(7.5) + largoVastago + mm(1), 0]} castShadow />
      </group>
    </group>
  );
}

export interface PropsCristalizador extends GroupProps { diametro?: 100 | 150 | 190; liquido?: LiquidoEn }
/** Cristalizador (plato hondo de vidrio, sin graduar). */
export function Cristalizador({ diametro = 150, liquido, ...g }: PropsCristalizador) {
  const def = defCristalizador(diametro);
  return (
    <group {...g}>
      <Vidrio def={def} />
      {liquido && <Liquido recipiente={def} {...liquido} />}
    </group>
  );
}

/** Aro de corcho para apoyar matraces de fondo redondo (sección rectangular redondeada). */
export function AroCorcho({ radio = 0.32, ...g }: GroupProps & { radio?: number }) {
  const m = useMateriales();
  const geo = useMemo(() => geoCache(`aroCorcho:${radio.toFixed(3)}`, () => {
    const a = mm(11), h = mm(22), r0 = radio - a / 2;
    const p: P2[] = [[r0 + a, mm(2)], [r0 + a, h - mm(3)], [r0 + a - mm(3), h], [r0 + mm(3), h], [r0, h - mm(3)], [r0, mm(2)], [r0 + mm(2), 0], [r0 + a - mm(2), 0]];
    p.push([r0 + a, mm(2)]);
    return tornear(p, 48); // antihorario en (r, y): normales hacia fuera
  }), [radio]);
  return <group {...g}><mesh geometry={geo} material={m.corcho} castShadow receiveShadow /></group>;
}

/** Polígono regular de n lados con esquinas redondeadas (fracción `redondeo` del lado). */
function poligonoRedondeado(n: number, R: number, redondeo: number): THREE.Shape {
  const s = new THREE.Shape();
  const v = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + Math.PI / n;
    return [Math.cos(a) * R, Math.sin(a) * R] as [number, number];
  });
  const lerp = (p: [number, number], q: [number, number], t: number) => [p[0] + (q[0] - p[0]) * t, p[1] + (q[1] - p[1]) * t] as [number, number];
  for (let i = 0; i < n; i++) {
    const prev = v[(i + n - 1) % n], c = v[i], next = v[(i + 1) % n];
    const a = lerp(c, prev, redondeo), b = lerp(c, next, redondeo);
    if (i === 0) s.moveTo(a[0], a[1]); else s.lineTo(a[0], a[1]);
    s.quadraticCurveTo(c[0], c[1], b[0], b[1]);
  }
  s.closePath();
  return s;
}

// ───────────────────────────── tapones y gradilla ─────────────────────────────

/** Tapón de hule cónico (se coloca con la base mayor arriba, en la boca). */
export function TaponHule({ radioBoca, color = '#3a2a24', ...g }: GroupProps & { radioBoca: number; color?: string }) {
  const m = useMateriales();
  const geo = useMemo(() => geoCache(`taponHule:${radioBoca.toFixed(4)}`, () => {
    const r1 = radioBoca * 0.86, r2 = radioBoca * 1.22, h = radioBoca * 1.5;
    return tornear([[0.0005, -h * 0.55], [r1, -h * 0.55], [r2, h * 0.42], [r2 * 0.97, h * 0.45], [0.0005, h * 0.45]], 32);
  }), [radioBoca]);
  return <group {...g}><mesh geometry={geo} material={m.plastico(color, 0.88)} castShadow /></group>;
}

/** Tapón de polietileno de cabeza octogonal (matraz aforado). */
export function TaponPE({ radio, color = '#2d6fb7', ...g }: GroupProps & { radio: number; color?: string }) {
  const m = useMateriales();
  const mat = m.plastico(color, 0.4);
  return (
    <group {...g}>
      <mesh geometry={cilindro(radio * 0.98, radio * 0.86, mm(14), 24)} material={mat} position={[0, -mm(2), 0]} />
      <mesh geometry={cilindro(radio * 1.55, radio * 1.55, mm(9), 8)} material={mat} position={[0, mm(9.5), 0]} castShadow />
      <mesh geometry={cilindro(radio * 1.35, radio * 1.55, mm(2), 8)} material={mat} position={[0, mm(15), 0]} castShadow />
    </group>
  );
}

/** Gradilla de polipropileno para tubos (n huecos). `posicionHueco(i)` da dónde va cada tubo. */
export function Gradilla({ huecos = 6, diametroTubo = 16, color = '#e8ecef', ...g }: GroupProps & { huecos?: number; diametroTubo?: number; color?: string }) {
  const m = useMateriales();
  const paso = mm(diametroTubo + 9);
  const L = paso * huecos + mm(14), A = mm(diametroTubo + 18);
  const geoPlaca = useMemo(() => geoCache(`placaGradilla:${huecos}:${diametroTubo}`, () => {
    const s = formaRectRedondeado(L, A, mm(3));
    for (let i = 0; i < huecos; i++) {
      const h = new THREE.Path();
      h.absarc(-((huecos - 1) * paso) / 2 + i * paso, 0, mm(diametroTubo / 2 + 1.2), 0, Math.PI * 2, true);
      s.holes.push(h);
    }
    const geo = extruir(s, mm(3), 20);
    geo.rotateX(-Math.PI / 2);
    return geo;
  }), [huecos, diametroTubo, L, A, paso]);
  const mat = m.plastico(color, 0.5);
  return (
    <group {...g}>
      <mesh geometry={geoPlaca} material={mat} position={[0, mm(70), 0]} castShadow receiveShadow />
      <mesh geometry={geoPlaca} material={mat} position={[0, mm(32), 0]} castShadow receiveShadow />
      <mesh material={mat} position={[0, mm(1.5), 0]} castShadow receiveShadow><boxGeometry args={[L, mm(3), A]} /></mesh>
      {[-1, 1].map((s) => (
        <mesh key={s} material={mat} position={[s * (L / 2 - mm(1.5)), mm(36.5), 0]} castShadow><boxGeometry args={[mm(3), mm(73), A]} /></mesh>
      ))}
    </group>
  );
}
/** Posición local (x) del hueco i de una gradilla. */
export function posicionHueco(i: number, huecos = 6, diametroTubo = 16): [number, number, number] {
  const paso = mm(diametroTubo + 9);
  return [-((huecos - 1) * paso) / 2 + i * paso, mm(4), 0];
}
