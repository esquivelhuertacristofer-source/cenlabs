/**
 * fis09/materialesCampo.ts — sombreadores de las líneas de campo y de las equipotenciales.
 *
 * Líneas: cintas que miran a la cámara con un ancho fijo EN PÍXELES (se leen igual de cerca
 * que de lejos) y perfil gaussiano. El color sale del potencial V en cada punto (blanco en
 * V = 0, rojo hacia +, azul hacia −) y el brillo de log|E| (más intensas donde el campo es
 * fuerte). Unos trazos («cometas») recorren cada línea en el sentido de E⃗: indican el
 * SENTIDO del campo, no un flujo de materia (lo dice la ficha). Mezcla aditiva: el orden de
 * dibujo no importa y no hay que ordenar transparencias.
 *
 * Equipotenciales: superficie casi invisible de frente y luminosa de canto (Fresnel), del
 * color de su potencial: se ven como pompas anidadas alrededor de cada carga.
 */
import * as THREE from 'three';
import { COLOR_POS, COLOR_NEG } from './piezas';

const COLOR_MEDIO = '#eef3ff';

export function materialLineas(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis09-lineas',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uT: { value: 0 },
      uLambda: { value: 6 },     // cm entre trazos
      uVel: { value: 3 },        // cm/s
      uRev: { value: 1e6 },      // cm: hasta dónde ha crecido cada línea
      uRes: { value: new THREE.Vector2(1, 1) },
      uAncho: { value: 1.5 },    // px (medio ancho)
      uOpac: { value: 1 },
      uFlujo: { value: 1 },
      uColPos: { value: new THREE.Color(COLOR_POS) },
      uColNeg: { value: new THREE.Color(COLOR_NEG) },
      uColMed: { value: new THREE.Color(COLOR_MEDIO) },
    },
    vertexShader: /* glsl */ `
      attribute vec3 aTan;
      attribute float aLado;
      attribute float aArco;
      attribute float aRev;
      attribute float aPot;
      attribute float aBri;
      attribute float aDesv;
      uniform vec2 uRes;
      uniform float uAncho;
      varying float vLado;
      varying float vArco;
      varying float vRev;
      varying float vPot;
      varying float vBri;
      varying float vDesv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vec3 t = aTan;
        float lt = length(t);
        t = lt > 1e-6 ? t / lt : vec3(1.0, 0.0, 0.0);
        vec4 mt = modelViewMatrix * vec4(position + t * 0.02, 1.0);
        vec4 c0 = projectionMatrix * mv;
        vec4 c1 = projectionMatrix * mt;
        vec2 p0 = c0.xy / max(1e-6, abs(c0.w)) * uRes;
        vec2 p1 = c1.xy / max(1e-6, abs(c1.w)) * uRes;
        vec2 d = p1 - p0;
        float l = length(d);
        d = l > 1e-5 ? d / l : vec2(1.0, 0.0);
        vec2 n = vec2(-d.y, d.x);
        c0.xy += n * aLado * (2.0 * uAncho / uRes) * c0.w;
        gl_Position = c0;
        vLado = aLado; vArco = aArco; vRev = aRev; vPot = aPot; vBri = aBri; vDesv = aDesv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uT;
      uniform float uLambda;
      uniform float uVel;
      uniform float uRev;
      uniform float uOpac;
      uniform float uFlujo;
      uniform vec3 uColPos;
      uniform vec3 uColNeg;
      uniform vec3 uColMed;
      varying float vLado;
      varying float vArco;
      varying float vRev;
      varying float vPot;
      varying float vBri;
      varying float vDesv;
      void main() {
        float perfil = exp(-vLado * vLado * 2.4);
        float fase = fract(vArco / uLambda - uT * uVel / uLambda);
        float cometa = pow(fase, 7.0) * (1.0 - smoothstep(0.94, 1.0, fase));
        float frente = 1.0 - smoothstep(uRev - 1.2, uRev, vRev);
        vec3 col = vPot >= 0.0 ? mix(uColMed, uColPos, clamp(vPot, 0.0, 1.0)) : mix(uColMed, uColNeg, clamp(-vPot, 0.0, 1.0));
        float I = (0.45 + 2.0 * cometa * uFlujo) * vBri * vDesv * frente * uOpac;
        gl_FragColor = vec4(col * I * perfil, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}

export function materialCapas(): THREE.ShaderMaterial {
  return new THREE.ShaderMaterial({
    name: 'fis09-equipotenciales',
    transparent: true,
    depthWrite: false,
    blending: THREE.AdditiveBlending,
    side: THREE.DoubleSide,
    uniforms: {
      uOpac: { value: 1 },
      uColPos: { value: new THREE.Color(COLOR_POS) },
      uColNeg: { value: new THREE.Color(COLOR_NEG) },
      uColMed: { value: new THREE.Color('#c9b8ff') },
    },
    vertexShader: /* glsl */ `
      attribute float aNivel;
      attribute float aDesv;
      varying vec3 vN;
      varying vec3 vVista;
      varying float vNivel;
      varying float vDesv;
      void main() {
        vec4 mv = modelViewMatrix * vec4(position, 1.0);
        vN = normalize(normalMatrix * normal);
        vVista = -mv.xyz;
        vNivel = aNivel; vDesv = aDesv;
        gl_Position = projectionMatrix * mv;
      }
    `,
    fragmentShader: /* glsl */ `
      uniform float uOpac;
      uniform vec3 uColPos;
      uniform vec3 uColNeg;
      uniform vec3 uColMed;
      varying vec3 vN;
      varying vec3 vVista;
      varying float vNivel;
      varying float vDesv;
      void main() {
        float c = abs(dot(normalize(vN), normalize(vVista)));
        float borde = pow(1.0 - c, 3.0);
        vec3 col = vNivel > 0.02 ? mix(uColMed, uColPos, 0.55 + 0.45 * vNivel)
                 : vNivel < -0.02 ? mix(uColMed, uColNeg, 0.55 - 0.45 * vNivel) : uColMed;
        // la superficie V = 0 (plano medio o esfera de Apolonio) se dibuja más tenue y con menos
        // borde: vista de canto, un plano con fresnel fuerte parece un haz de luz
        bool cero = abs(vNivel) < 0.02;
        float I = (cero ? 0.14 * (0.03 + 0.6 * borde) : 0.016 + 0.62 * borde) * vDesv * uOpac;
        gl_FragColor = vec4(col * I, 1.0);
        #include <tonemapping_fragment>
        #include <colorspace_fragment>
      }
    `,
  });
}
