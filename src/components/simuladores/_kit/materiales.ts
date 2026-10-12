/**
 * _kit/materiales.ts — biblioteca de materiales del kit, MEMOIZADA y COMPARTIDA.
 *
 * `useMateriales(calidad)` devuelve siempre el MISMO objeto para cada calidad:
 * todas las piezas comparten material (un programa de sombreado por tipo).
 *   - "alta": vidrio con transmisión real (MeshPhysicalMaterial, ior 1,47 del
 *     borosilicato, thickness, rugosidad baja). OJO: transmisión y `opacity` no se
 *     combinan: la opacidad anula la transmisión.
 *   - "media": vidrio barato (transparente con borde de Fresnel), sin pasada de
 *     transmisión; texturas de detalle desactivadas. Pensado para portátiles con
 *     GPU integrada.
 *
 * El LÍQUIDO es siempre opaco: three no dibuja un objeto con transmisión DENTRO de
 * otro con transmisión (la pasada de transmisión sólo captura lo opaco), así que
 * un líquido transmisivo dentro de un vaso desaparecería.
 *
 * Nada es emisivo salvo lo que emite luz de verdad (LED, llama, pantallas): para
 * eso están `emisor(color)` y `pantalla(...)`.
 */
import * as THREE from 'three';
import { createContext, useContext } from 'react';
import { dibujarMoteado, texturaCompartida, azar } from './texturas';

export type Calidad = 'alta' | 'media';

export interface ContextoKit { calidad: Calidad }
export const KitContexto = createContext<ContextoKit>({ calidad: 'alta' });
export const useCalidad = () => useContext(KitContexto).calidad;

export interface Materiales {
  calidad: Calidad;
  vidrio: THREE.Material;
  vidrioEsmerilado: THREE.Material;
  /** material de profundidad para que el vidrio proyecte una sombra TENUE (alpha hash) */
  sombraVidrio: THREE.MeshDepthMaterial;
  plasticoClaro: THREE.Material;     // polipropileno translúcido (jeringa)
  acero: THREE.MeshStandardMaterial; // inoxidable cepillado
  cromo: THREE.MeshStandardMaterial;
  aluminio: THREE.MeshStandardMaterial;
  laton: THREE.MeshStandardMaterial;
  cobre: THREE.MeshStandardMaterial;
  hierroPintado: THREE.MeshStandardMaterial; // fundición pintada (martillado)
  goma: THREE.MeshStandardMaterial;
  madera: THREE.MeshStandardMaterial;
  ceramica: THREE.MeshStandardMaterial;
  resinaMesa: THREE.MeshPhysicalMaterial;
  ptfe: THREE.MeshStandardMaterial;
  corcho: THREE.MeshStandardMaterial;
  carcasaClara: THREE.MeshStandardMaterial;  // ABS gris claro de instrumentos
  carcasaOscura: THREE.MeshStandardMaterial; // ABS gris carbón
  hielo: THREE.MeshPhysicalMaterial;
  plastico(color: string, rugosidad?: number): THREE.MeshStandardMaterial;
  pintura(color: string): THREE.MeshStandardMaterial;
  liquido(color: string): THREE.MeshPhysicalMaterial;
  emisor(color: string, intensidad?: number): THREE.MeshStandardMaterial;
  impreso(color: string): THREE.MeshStandardMaterial;
}

const porCalidad = new Map<Calidad, Materiales>();

/** Rugosidad cepillada: rayas finas horizontales (se usa como roughnessMap). */
function texCepillado() {
  return texturaCompartida('cepillado', 256, 256, (ctx, w, h) => {
    ctx.fillStyle = '#8a8a8a'; ctx.fillRect(0, 0, w, h);
    const rnd = azar(7);
    for (let i = 0; i < 900; i++) {
      const y = rnd() * h, g = 100 + Math.floor(rnd() * 90);
      ctx.strokeStyle = `rgb(${g},${g},${g})`; ctx.globalAlpha = 0.35;
      ctx.lineWidth = 0.6 + rnd();
      ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(w, y + (rnd() - 0.5) * 2); ctx.stroke();
    }
    ctx.globalAlpha = 1;
  }, { srgb: false, repetir: [2, 2] });
}

/** Pintura martillada de fundición (rugosidad con "cráteres"). */
function texMartillado() {
  return texturaCompartida('martillado', 256, 256, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#8c8c8c', [
      { color: '#5a5a5a', n: 260, r: [3, 9], alfa: 0.35 },
      { color: '#c8c8c8', n: 220, r: [2, 6], alfa: 0.3 },
    ], 3);
  }, { srgb: false, repetir: [3, 3] });
}

function texResina() {
  return texturaCompartida('resina', 512, 512, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#ffffff', [
      { color: '#9aa2a8', n: 2600, r: [0.5, 1.4], alfa: 0.45 },
      { color: '#ffffff', n: 900, r: [0.6, 1.6], alfa: 0.5 },
      { color: '#6f777d', n: 300, r: [0.8, 1.8], alfa: 0.3 },
    ], 11);
  }, { repetir: [6, 3] });
}

function texMadera() {
  return texturaCompartida('madera', 512, 128, (ctx, w, h) => {
    const g = ctx.createLinearGradient(0, 0, 0, h);
    g.addColorStop(0, '#c99a62'); g.addColorStop(0.5, '#d6aa72'); g.addColorStop(1, '#c4935a');
    ctx.fillStyle = g; ctx.fillRect(0, 0, w, h);
    const rnd = azar(5);
    for (let i = 0; i < 70; i++) {
      const y0 = rnd() * h, a = 1 + rnd() * 3, f = 2 + rnd() * 5;
      ctx.strokeStyle = rnd() > 0.5 ? '#a8763f' : '#e2bb88'; ctx.globalAlpha = 0.18 + rnd() * 0.25;
      ctx.lineWidth = 0.6 + rnd() * 1.6;
      ctx.beginPath();
      for (let x = 0; x <= w; x += 8) {
        const y = y0 + Math.sin((x / w) * Math.PI * f + i) * a;
        if (x === 0) ctx.moveTo(x, y); else ctx.lineTo(x, y);
      }
      ctx.stroke();
    }
    ctx.globalAlpha = 1;
  });
}

function texCorcho() {
  return texturaCompartida('corcho', 256, 256, (ctx, w, h) => {
    dibujarMoteado(ctx, w, h, '#c9a27a', [
      { color: '#8c6440', n: 900, r: [1, 3.2], alfa: 0.55 },
      { color: '#e0c29c', n: 600, r: [0.8, 2.2], alfa: 0.5 },
      { color: '#5e4128', n: 160, r: [1, 2], alfa: 0.5 },
    ], 17);
  }, { repetir: [4, 1] });
}

function crear(calidad: Calidad): Materiales {
  const alta = calidad === 'alta';
  const detalle = alta && typeof document !== 'undefined';

  const vidrio = alta
    ? new THREE.MeshPhysicalMaterial({
        color: '#ffffff', metalness: 0, roughness: 0.04, transmission: 1, thickness: 0.035,
        ior: 1.47, specularIntensity: 1, envMapIntensity: 1.25, attenuationColor: new THREE.Color('#e9f7f2'),
        attenuationDistance: 1.2,
      })
    : vidrioBarato('#93a6a4', 0.05, 0.42);
  vidrio.name = 'kit-vidrio';

  const vidrioEsmerilado = alta
    ? new THREE.MeshPhysicalMaterial({ color: '#f4f6f7', roughness: 0.62, transmission: 0.85, thickness: 0.02, ior: 1.47 })
    : vidrioBarato('#dfe5e6', 0.45, 0.25);

  const sombraVidrio = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, alphaHash: true, opacity: 0.28 });

  const plasticoClaro = alta
    ? new THREE.MeshPhysicalMaterial({ color: '#f7f9fa', roughness: 0.22, transmission: 0.92, thickness: 0.03, ior: 1.49 })
    : vidrioBarato('#d9e0e2', 0.22, 0.3);

  const cep = detalle ? texCepillado() : null;
  const acero = new THREE.MeshStandardMaterial({ color: '#c9ccce', metalness: 1, roughness: 0.32, roughnessMap: cep, name: 'kit-acero' });
  const cromo = new THREE.MeshStandardMaterial({ color: '#e4e6e8', metalness: 1, roughness: 0.08, name: 'kit-cromo' });
  const aluminio = new THREE.MeshStandardMaterial({ color: '#d4d7da', metalness: 1, roughness: 0.38, roughnessMap: cep, name: 'kit-aluminio' });
  const laton = new THREE.MeshStandardMaterial({ color: '#d9b25d', metalness: 1, roughness: 0.28, name: 'kit-laton' });
  const cobre = new THREE.MeshStandardMaterial({ color: '#d98a5f', metalness: 1, roughness: 0.3, name: 'kit-cobre' });
  const mart = detalle ? texMartillado() : null;
  const hierroPintado = new THREE.MeshStandardMaterial({ color: '#3f5566', metalness: 0.35, roughness: 0.55, roughnessMap: mart, bumpMap: mart, bumpScale: 0.6, name: 'kit-hierro' });
  const goma = new THREE.MeshStandardMaterial({ color: '#1d1f22', roughness: 0.85, metalness: 0, name: 'kit-goma' });
  const madera = new THREE.MeshStandardMaterial({ color: '#ffffff', map: detalle ? texMadera() : null, roughness: 0.62, name: 'kit-madera' });
  if (!detalle) madera.color.set('#cfa06a');
  const ceramica = new THREE.MeshStandardMaterial({ color: '#f3f1ec', roughness: 0.35, name: 'kit-ceramica' });
  const resinaMesa = new THREE.MeshPhysicalMaterial({
    color: '#8a949b', roughness: 0.42, metalness: 0, map: detalle ? texResina() : null,
    clearcoat: alta ? 0.25 : 0, clearcoatRoughness: 0.35, name: 'kit-resina',
  });
  const ptfe = new THREE.MeshStandardMaterial({ color: '#f5f5f2', roughness: 0.45, name: 'kit-ptfe' });
  const corcho = new THREE.MeshStandardMaterial({ color: '#a88462', roughness: 0.95, map: detalle ? texCorcho() : null, bumpMap: detalle ? texCorcho() : null, bumpScale: 1.5, name: 'kit-corcho' });
  const carcasaClara = new THREE.MeshStandardMaterial({ color: '#e3e5e6', roughness: 0.48, name: 'kit-carcasa-clara' });
  const carcasaOscura = new THREE.MeshStandardMaterial({ color: '#2b2f33', roughness: 0.55, name: 'kit-carcasa-oscura' });
  const hielo = new THREE.MeshPhysicalMaterial({
    color: '#b9d9e6', roughness: 0.12, metalness: 0, clearcoat: alta ? 1 : 0, clearcoatRoughness: 0.05,
    specularIntensity: 1, envMapIntensity: 1.4, sheen: alta ? 0.6 : 0, sheenColor: new THREE.Color('#ffffff'), sheenRoughness: 0.4,
    transparent: !alta, opacity: alta ? 1 : 0.8, name: 'kit-hielo',
  });

  const plasticos = new Map<string, THREE.MeshStandardMaterial>();
  const pinturas = new Map<string, THREE.MeshStandardMaterial>();
  const liquidos = new Map<string, THREE.MeshPhysicalMaterial>();
  const emisores = new Map<string, THREE.MeshStandardMaterial>();
  const impresos = new Map<string, THREE.MeshStandardMaterial>();

  return {
    calidad, vidrio, vidrioEsmerilado, sombraVidrio, plasticoClaro, acero, cromo, aluminio, laton, cobre, hierroPintado,
    goma, madera, ceramica, resinaMesa, ptfe, corcho, carcasaClara, carcasaOscura, hielo,
    plastico(color, rugosidad = 0.45) {
      const k = color + rugosidad;
      let m = plasticos.get(k);
      if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: rugosidad, metalness: 0, name: 'kit-plastico' }); plasticos.set(k, m); }
      return m;
    },
    pintura(color) {
      let m = pinturas.get(color);
      if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.5, metalness: 0.3, roughnessMap: mart, name: 'kit-pintura' }); pinturas.set(color, m); }
      return m;
    },
    liquido(color) {
      let m = liquidos.get(color);
      if (!m) {
        const c = new THREE.Color(color);
        const hsl = { h: 0, s: 0, l: 0 }; c.getHSL(hsl);
        const claro = hsl.l > 0.8 || hsl.s < 0.12; // agua y disoluciones casi incoloras
        if (alta) {
          // Transmisión con atenuación (Beer-Lambert): el color sale del espesor
          // atravesado. DoubleSide es lo que permite verlo A TRAVÉS del vidrio: three
          // pinta las caras traseras de los transmisivos DoubleSide en su pasada de
          // transmisión, y el vidrio (también transmisivo) las refracta.
          m = new THREE.MeshPhysicalMaterial({
            color: new THREE.Color('#ffffff').lerp(c, claro ? 0.15 : 0.45), metalness: 0, roughness: 0.04,
            transmission: 1, thickness: 0.3, ior: 1.34, attenuationColor: c,
            attenuationDistance: claro ? 1.5 : 0.18, specularIntensity: 1, envMapIntensity: 1,
            side: THREE.DoubleSide, name: 'kit-liquido',
          });
        } else {
          m = new THREE.MeshPhysicalMaterial({
            color: c, metalness: 0, roughness: 0.06, transparent: true, opacity: claro ? 0.4 : 0.84,
            specularIntensity: 1, envMapIntensity: 1, depthWrite: true, name: 'kit-liquido',
          });
        }
        liquidos.set(color, m);
      }
      return m;
    },
    emisor(color, intensidad = 2) {
      const k = color + intensidad;
      let m = emisores.get(k);
      if (!m) { m = new THREE.MeshStandardMaterial({ color: '#000000', emissive: color, emissiveIntensity: intensidad, roughness: 0.4, name: 'kit-emisor' }); emisores.set(k, m); }
      return m;
    },
    impreso(color) {
      let m = impresos.get(color);
      if (!m) { m = new THREE.MeshStandardMaterial({ color, roughness: 0.55, metalness: 0, name: 'kit-impreso' }); impresos.set(color, m); }
      return m;
    },
  };
}

/**
 * Vidrio sin transmisión: transparente, con la opacidad subiendo en el borde
 * (Fresnel) para que el contorno de la pieza se lea como en el vidrio real.
 */
function vidrioBarato(color: string, opacidad: number, borde: number): THREE.MeshPhysicalMaterial {
  const m = new THREE.MeshPhysicalMaterial({
    color, roughness: 0.06, metalness: 0, transparent: true, opacity: opacidad, depthWrite: false,
    specularIntensity: 1, envMapIntensity: 1.6, side: THREE.FrontSide,
    // alfa premultiplicado: el reflejo especular NO se atenúa con la opacidad
    // (en el vidrio real el brillo es lo que más se ve)
    blending: THREE.CustomBlending, blendSrc: THREE.OneFactor, blendDst: THREE.OneMinusSrcAlphaFactor,
    blendSrcAlpha: THREE.OneFactor, blendDstAlpha: THREE.OneMinusSrcAlphaFactor,
  });
  m.onBeforeCompile = (s) => {
    s.fragmentShader = s.fragmentShader.replace(
      '#include <opaque_fragment>',
      `#include <opaque_fragment>
       float kitFr = pow(1.0 - clamp(abs(dot(normalize(normal), normalize(vViewPosition))), 0.0, 1.0), 2.5);
       float kitA = clamp(diffuseColor.a + kitFr * ${borde.toFixed(3)}, 0.0, 0.92);
       vec3 kitDif = reflectedLight.directDiffuse + reflectedLight.indirectDiffuse;
       vec3 kitResto = max(outgoingLight - kitDif, vec3(0.0));
       gl_FragColor = vec4(kitDif * kitA + kitResto, kitA);`,
    );
  };
  m.customProgramCacheKey = () => 'kit-vidrio-barato-' + borde.toFixed(3);
  return m;
}

/** Biblioteca de materiales compartida para una calidad. */
export function obtenerMateriales(calidad: Calidad): Materiales {
  let m = porCalidad.get(calidad);
  if (!m) { m = crear(calidad); porCalidad.set(calidad, m); }
  return m;
}

/** Hook: materiales de la calidad pedida o, si no se da, la del LabStage. */
export function useMateriales(calidad?: Calidad): Materiales {
  const ctx = useCalidad();
  return obtenerMateriales(calidad ?? ctx);
}

/** Colores de líquidos habituales en las prácticas. */
export const COLORES_LIQUIDO = {
  agua: '#cfe6ef',
  fenolftaleina: '#e04f9a',
  fenolftaleinaTenue: '#f2a7cb',
  sulfatoCobre: '#2f8fd6',
  permanganato: '#7a1f6e',
  dicromato: '#e07a12',
  yodo: '#8a4a12',
  azulMetileno: '#1f4fb0',
  naranjaMetilo: '#ef7d22',
  rojoMetilo: '#d8334a',
  aceite: '#d9b84a',
  sangre: '#8a1020',
  cloruroHierro: '#c98a1c',
  verdeBromocresol: '#2f9d6b',
  leche: '#f3f0e6',
} as const;
