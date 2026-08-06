// Reencuadre de la camara de three.js DESDE FUERA del modulo del lab, sin tocar
// ni un archivo del proyecto. Tres piezas:
//
//   1. gancho()      addInitScript: define __THREE_DEVTOOLS__ antes de que corra
//                    el lab. three.js r160 despacha 'observe' al construir Scene
//                    y WebGLRenderer; parcheando renderer.render se captura ademas
//                    la camara de cada pasada.
//   2. rutaOrbit()   page.route sobre el OrbitControls.js del CDN: se le añade un
//                    parche para registrar las instancias. Hace falta porque
//                    controls.update() reimpone camera.lookAt(target) en CADA
//                    frame, asi que apuntar la camara a mano no sobrevive.
//   3. REENCUADRE    funcion que corre en la pagina: quita pizarra y rotulos, mide
//                    la maquina y coloca camara + target ajustando EN PANTALLA.
//
// Reglas de medida (MEDIDAS sobre las escenas reales, no supuestas):
//   · el suelo de estudio es un CircleGeometry de 80 mas unos RingGeometry: fuera.
//   · CanvasTexture NO marca "texto": 177 de los 193 objetos del motor llevan una
//     como superficie procedural. Lo que si marca rotulo:
//        - Sprite con mapa            → etiqueta flotante (renderOrder 999, sin depthTest)
//        - PlaneGeometry + MeshBasic  → superficie sin iluminar; si pasa de 1,5 m
//          es la pizarra teorica, si mide centimetros es el display de un aparato.
//   · 5 labs (motor-electrico, brazo-robotico, carga-ev, inversor-trifasico,
//     motor-combustion) dibujan los rotulos en una `labelScene` APARTE con una
//     segunda pasada de render. Hay que limpiar TODAS las escenas capturadas.
//   · el numero de vertices NO sirve como peso: los labs construyen casi todo con
//     roundedBox, que da 2916 vertices mida 3 m o 0,5 m. Con ese peso el centroide
//     se iba al banco de trabajo.
//   · el pedestal no siempre es el "banco" macizo de 3 x 0,5 x 1,7 a ras de suelo:
//     en la prensa es una mesa con patas cuyo tablero esta a 0,84 m. Lo estable es
//     "la losa horizontal ancha y delgada de mayor huella"; el sujeto es lo que
//     descansa encima.
//   · encuadrar por esfera envolvente deja la maquina pequeña y baja: la esfera
//     incluye la profundidad y el cuadro es 3:2. Se ajusta proyectando las esquinas
//     sobre los ejes de pantalla y resolviendo la distancia minima que las mete.

export function gancho() {
  return () => {
    window.__cap = { pares: [], controles: [], errores: [] };
    // Cual de las escenas capturadas es la del lab. Por conteo de mallas NO vale:
    // three genera el mapa de entorno con PMREM dibujando un RoomEnvironment —un
    // cuarto de 31x28x28 con 13 cajas— y lo hace con camara en perspectiva, asi
    // que entra en `pares` como una mas. En labs de pocas piezas ese cuarto ganaba
    // (medido: mecanica-74 encuadraba una caja de 27,96 m y salia una foto plana
    // de 40 tonos), y ademas ganaba solo DESPUES de quitar la pizarra, que es
    // cuando la escena real baja de mallas. Se distingue por actividad: el cuarto
    // se dibuja 6 veces al arrancar y no vuelve; la del lab va a 60 fps. Entre las
    // que siguen vivas gana la de mas mallas (asi la principal le gana a labelScene).
    window.__cap.elegir = () => {
      const ps = window.__cap.pares;
      if (!ps.length) return null;
      const ahora = performance.now();
      const vivas = ps.filter((p) => ahora - p.ultimo < 1000);
      let mejor = null, mejorN = -1;
      for (const p of (vivas.length ? vivas : ps)) {
        let n = 0; p.esc.traverse((o) => { if (o.isMesh) n++; });
        if (n > mejorN) { mejorN = n; mejor = p; }
      }
      mejor.mallas = mejorN;
      return mejor;
    };
    const et = new EventTarget();
    et.addEventListener('observe', (e) => {
      try {
        const o = e.detail;
        if (o && o.isWebGLRenderer && typeof o.render === 'function') {
          const orig = o.render.bind(o);
          o.render = (esc, cam) => {
            // El EffectComposer tambien llama a render(), pero con un quad de
            // pantalla completa y camara ortografica: esa pasada no vale.
            if (esc && esc.isScene && cam && cam.isPerspectiveCamera) {
              let p = window.__cap.pares.find((q) => q.esc === esc);
              if (p) p.cam = cam; else window.__cap.pares.push((p = { esc, cam, veces: 0, ultimo: 0 }));
              // Cuantas veces y cuando se dibuja cada escena. Es lo que distingue
              // la del lab (60 fps para siempre) del cuarto de PMREM, que se
              // dibuja 6 veces al arrancar y no vuelve (ver `elegir`).
              p.veces++; p.ultimo = performance.now();
              // Congelado (ver FIJAR): hay labs que animan la camara en su bucle,
              // y ademas controls.update() la reimpone en cada frame. Reponer la
              // pose JUSTO antes de dibujar es lo unico que gana siempre, porque
              // render() recalcula matrixWorld a partir de position/quaternion.
              const f = window.__cap.fijo;
              if (f && cam === f.cam) {
                const d = Math.hypot(cam.position.x - f.p[0], cam.position.y - f.p[1], cam.position.z - f.p[2]);
                if (d > f.max) f.max = d;               // cuanto intento moverse
                cam.position.set(f.p[0], f.p[1], f.p[2]);
                cam.quaternion.set(f.q[0], f.q[1], f.q[2], f.q[3]);
              }
            }
            return orig(esc, cam);
          };
        }
      } catch (err) { window.__cap.errores.push(String(err)); }
    });
    window.__THREE_DEVTOOLS__ = et;
  };
}

export async function rutaOrbit(destino) {
  // destino: page o context
  await destino.route('**/controls/OrbitControls.js*', async (route) => {
    try {
      const r = await route.fetch();
      const src = await r.text();
      // OJO: en r160 OrbitControls asigna `this.update = function(){...}` DENTRO
      // del constructor, asi que parchear el prototipo no engancha nada. Lo que
      // si funciona es reemplazar la propia clase: el binding exportado es vivo y
      // este parche corre al evaluar el modulo, antes que el cuerpo del lab que
      // lo importa.
      const parche = `
;(() => { try {
  const __OC = OrbitControls;
  OrbitControls = class extends __OC {
    constructor(...a) {
      super(...a);
      const c = (window.__cap = window.__cap || {});
      (c.controles = c.controles || []).push(this);
    }
  };
  window.__parcheOrbit = 'ok';
} catch (e) { window.__parcheOrbit = 'error: ' + e; } })();
`;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/javascript; charset=utf-8', 'access-control-allow-origin': '*' },
        body: src + parche,
      });
    } catch { await route.continue(); }
  });
}

// Se pasa entera a page.evaluate, asi que no puede referirse a nada de fuera.
export const REENCUADRE = ({ margen, margenV, cobertura, subir, forzarBanco }) => {
  const c = window.__cap;
  if (!c || !c.pares || !c.pares.length) return { ok: false, motivo: 'sin escena' };

  const mejor = c.elegir();
  const mejorN = mejor.mallas;
  const esc = mejor.esc, cam = mejor.cam;
  const ctr = (c.controles || []).find((k) => k.object === cam) || (c.controles || [])[0] || null;

  // Visible DE VERDAD para la portada: ni el objeto ni ningun antepasado puede
  // estar apagado, y tampoco vale lo que ya mandamos a la capa 31 (ver ocultar).
  const visible = (o) => {
    let p = o;
    while (p) { if (!p.visible || (p.userData && p.userData.__portadaOculta)) return false; p = p.parent; }
    return true;
  };
  // Ocultar SIN tocar el grafo. Descolgar el objeto (removeFromParent) desplaza
  // los indices de parent.children y hay labs que los usan en su bucle: asi es
  // como se rompia alguno con "cannot read properties of undefined". La capa 31
  // no la mira ninguna camara (por defecto solo miran la 0), no la reponen los
  // labs —ninguno toca layers— y sobrevive a que el lab reponga visible=true.
  // Ojo: las capas NO se heredan (projectObject recorre los hijos igual), asi
  // que hay que marcar el subarbol entero.
  const ocultar = (o) => o.traverse((x) => { x.layers.set(31); x.userData.__portadaOculta = true; });
  const caja = (o) => {
    const g = o.geometry; if (!g) return null;
    if (!g.boundingBox) g.computeBoundingBox();
    const b = g.boundingBox; if (!b) return null;
    o.updateWorldMatrix(true, false);
    const m = o.matrixWorld.elements;
    const lo = [Infinity, Infinity, Infinity], hi = [-Infinity, -Infinity, -Infinity];
    for (const x of [b.min.x, b.max.x]) for (const y of [b.min.y, b.max.y]) for (const z of [b.min.z, b.max.z]) {
      const v = [m[0] * x + m[4] * y + m[8] * z + m[12],
                 m[1] * x + m[5] * y + m[9] * z + m[13],
                 m[2] * x + m[6] * y + m[10] * z + m[14]];
      for (let i = 0; i < 3; i++) { if (v[i] < lo[i]) lo[i] = v[i]; if (v[i] > hi[i]) hi[i] = v[i]; }
    }
    return { lo, hi };
  };

  // ── 1. Fuera la pizarra teorica y los rotulos, en TODAS las escenas ──────
  // No basta con visible=false: hay labs que reponen la visibilidad en su bucle
  // segun el estado del ejercicio. Se manda a la capa 31 (ver `ocultar`).
  const limpiarTodo = () => {
    let pizarras = 0, etiquetas = 0;
    for (const par of c.pares) {
      const fuera = [];
      par.esc.traverse((o) => {
        if (!visible(o)) return;             // ya oculto, o hijo de algo oculto
        if (o.isSprite) {                    // sprite con mapa = etiqueta flotante
          const m = o.material;
          if (m && m.map) { fuera.push(o); etiquetas++; }
          return;
        }
        if (!o.isMesh || !o.geometry || o.geometry.type !== 'PlaneGeometry') return;
        const ms = Array.isArray(o.material) ? o.material : [o.material];
        // Sin iluminar = rotulo/pantalla. Las caras de maquina son Standard/Physical.
        if (!ms.some((m) => m && m.isMeshBasicMaterial && m.map)) return;
        const b = caja(o); if (!b) return;
        const anc = Math.max(b.hi[0] - b.lo[0], b.hi[2] - b.lo[2]), alt = b.hi[1] - b.lo[1];
        // Corte medido: la pizarra ronda 3,4 x 2,6; los displays de aparato no
        // llegan a 0,6. En medio no hay nada en los 112.
        if (Math.max(anc, alt) < 1.5) return;
        // El pizarron se monta como Group(marco + 2 patas + plano): quitar el
        // grupo entero evita dejar el bastidor flotando sin la hoja.
        const g = o.parent;
        fuera.push(g && g !== par.esc && g.type === 'Group' && g.children.length <= 8 ? g : o);
        pizarras++;
      });
      for (const o of fuera) ocultar(o);
      // Por si el lab hubiera abierto todas las capas de su camara.
      if (par.cam && par.cam.layers) par.cam.layers.disable(31);
    }
    return { pizarras, etiquetas };
  };
  const limpieza = limpiarTodo();
  c.limpiar = limpiarTodo;                   // para repasar justo antes de la foto

  // ── 2. Medir la maquina ──────────────────────────────────────────────────
  const todas = [];
  esc.traverse((o) => {
    if (!o.isMesh || !visible(o)) return;
    const b = caja(o); if (!b) return;
    const s = [b.hi[0] - b.lo[0], b.hi[1] - b.lo[1], b.hi[2] - b.lo[2]];
    const gt = o.geometry.type;
    const plano = Math.max(s[0], s[2]);
    // Nada del atrezo de estudio: suelo (circulo de 80), anillos, tarima de sala.
    // Ninguna maquina de los 112 pasa de 9 m de lado.
    if (!isFinite(plano) || plano > 9) return;
    if (!isFinite(s[1]) || s[1] > 9) return;   // tampoco por lo alto: paredes, cielos
    if ((gt === 'CircleGeometry' || gt === 'RingGeometry') && plano > 3) return;
    todas.push({
      lo: b.lo, hi: b.hi, gt,
      c: [(b.hi[0] + b.lo[0]) / 2, (b.hi[1] + b.lo[1]) / 2, (b.hi[2] + b.lo[2]) / 2],
      r: Math.hypot(s[0], s[1], s[2]) / 2,
      area: s[0] * s[2], s,
    });
  });
  if (!todas.length) return { ok: false, motivo: 'sin piezas' };

  // El pedestal: losa horizontal ancha y delgada de mayor huella. Es el mueble,
  // no el tema. Excluye Ring/Circle/Plane porque los adornos del suelo son de
  // altura 0 y ganarian por area (el anillo interior mide 4 x 4).
  const Wtodo = todas.reduce((s, p) => s + p.r * p.r, 0);
  const candBanco = todas
    .filter((p) => p.gt !== 'RingGeometry' && p.gt !== 'CircleGeometry' && p.gt !== 'PlaneGeometry'
      && p.s[1] >= 0.05 && p.s[1] <= 0.7 && Math.max(p.s[0], p.s[2]) >= 1.4 && p.area >= 2.0)
    .sort((a, b) => b.area - a.area);
  // Un pedestal SOSTIENE la maquina. Si encima de la losa elegida solo queda una
  // minucia, esa losa no era el banco sino un panel alto, la tapa del propio
  // aparato o un tablero de pared, y recortar por ahi deja fuera el tema (medido:
  // labs 6 y 11 encuadraban 2 piezas de 22 y 5 de 42). Se prueban por huella
  // decreciente y solo vale la que deja arriba >= 3 piezas y >= 1/4 del peso.
  let banco = null, piezas = todas, sobreBanco = -1;
  for (const b of candBanco) {
    const arriba = todas.filter((p) => p !== b && p.c[1] > b.hi[1] - 0.02 && p.hi[1] > b.hi[1] + 0.02);
    // `forzarBanco` levanta los dos filtros para el puñado de labs cuyo montaje
    // cabe en DOS aparatos (fasores, impedancias, transitorios RC/RL): ahi la
    // losa nunca se descartaba —arriba.length valia 2— y la portada acababa
    // siendo una mesa vacia con un circuito diminuto en una esquina. Es opcion
    // por lab, no regla general: aflojarla para todos devolveria el fallo
    // documentado de los labs 6 y 11 (encuadraban 2 piezas de 22 y 5 de 42).
    if (!forzarBanco) {
      if (arriba.length < 3) continue;
      if (arriba.reduce((s, p) => s + p.r * p.r, 0) < Wtodo * 0.25) continue;
    } else if (!arriba.length) continue;
    banco = b; piezas = arriba; sobreBanco = arriba.length; break;
  }
  const cima = banco ? banco.hi[1] : -Infinity;

  // Peso = tamaño (radio al cuadrado): lo que ocupa cuadro es lo que manda. Con
  // el numero de vertices el centroide se iba al banco (roundedBox = 2916 siempre).
  const W = piezas.reduce((s, p) => s + p.r * p.r, 0);
  const cenW = [0, 1, 2].map((i) => piezas.reduce((s, p) => s + p.r * p.r * p.c[i], 0) / W);
  // Radio que cubre `cobertura` del peso: deja fuera accesorios lejanos sueltos
  // (la bandeja de pesas al otro extremo del banco) sin abrir el plano entero.
  const orden = piezas
    .map((p) => ({ p, d: Math.hypot(p.c[0] - cenW[0], p.c[1] - cenW[1], p.c[2] - cenW[2]) + p.r }))
    .sort((a, b) => a.d - b.d);
  let acc = 0; const dentro = [];
  for (const q of orden) { dentro.push(q.p); acc += q.p.r * q.p.r; if (acc >= W * cobertura) break; }

  const lo = [0, 1, 2].map((i) => Math.min(...dentro.map((p) => p.lo[i])));
  const hi = [0, 1, 2].map((i) => Math.max(...dentro.map((p) => p.hi[i])));
  const cen = [0, 1, 2].map((i) => (lo[i] + hi[i]) / 2);
  let R = 0.3;
  for (const p of dentro) R = Math.max(R, Math.hypot(p.c[0] - cen[0], p.c[1] - cen[1], p.c[2] - cen[2]) + p.r);

  // ── 3. Colocar camara: ajuste EN PANTALLA ────────────────────────────────
  // Se conserva la DIRECCION de vista que eligio el autor del lab (es la que luce
  // la maquina); solo se recentra y se acerca hasta que la caja del sujeto toque
  // los bordes con el aire pedido.
  const V = cam.position.constructor;                 // Vector3, sin importar three
  const tgt = ctr ? ctr.target : new V(0, 0, 0);
  const dir = cam.position.clone().sub(tgt);
  if (dir.lengthSq() < 1e-6) dir.set(0, 0.5, 1);
  dir.normalize();
  const arribaMundo = cam.up && cam.up.lengthSq() > 0.5 ? cam.up.clone() : new V(0, 1, 0);
  // Base de pantalla con el mismo convenio que Object3D.lookAt: x = up × z, y = z × x.
  let der = new V().crossVectors(arribaMundo, dir);
  if (der.lengthSq() < 1e-6) der = new V(1, 0, 0);    // vista cenital: base degenerada
  der.normalize();
  const arr = new V().crossVectors(dir, der).normalize();

  const proy = [];
  let aMin = Infinity, aMax = -Infinity, bMin = Infinity, bMax = -Infinity;
  for (const p of dentro) {
    for (const x of [p.lo[0], p.hi[0]]) for (const y of [p.lo[1], p.hi[1]]) for (const z of [p.lo[2], p.hi[2]]) {
      const v = new V(x - cen[0], y - cen[1], z - cen[2]);
      const a = v.dot(der), b = v.dot(arr), w = v.dot(dir);
      if (a < aMin) aMin = a; if (a > aMax) aMax = a;
      if (b < bMin) bMin = b; if (b > bMax) bMax = b;
      proy.push([a, b, w]);
    }
  }
  const ca = (aMin + aMax) / 2;
  const cb = (bMin + bMax) / 2 + (bMax - bMin) * subir;
  const objetivo = new V(cen[0], cen[1], cen[2]).addScaledVector(der, ca).addScaledVector(arr, cb);

  const t = Math.tan((cam.fov * Math.PI) / 180 / 2);
  const asp = cam.aspect || 1;
  // Distancia minima que mete cada esquina en cuadro. Se resuelve por punto para
  // que la perspectiva cuente: lo que esta cerca de la camara proyecta mas grande.
  let dist = 0.1;
  for (const [a, b, w] of proy) {
    dist = Math.max(dist,
      w + (Math.abs(a - ca) * margen) / (t * asp),
      w + (Math.abs(b - cb) * margenV) / t);
  }

  cam.position.copy(objetivo).addScaledVector(dir, dist);
  // El near del lab ya vale (nos acercamos, no nos alejamos); el far solo se
  // agranda si hiciera falta, para no estropear la precision del pase de bokeh.
  if (cam.far < dist + R * 6) cam.far = dist + R * 6;
  cam.updateProjectionMatrix();
  if (ctr) {
    // Los limites del lab (minDistance/maxDistance) recortarian el dolly en el
    // proximo update(); para una foto fija no estorban.
    ctr.minDistance = 0.01; ctr.maxDistance = 1e6;
    ctr.target.copy(objetivo);
    ctr.update();
  } else {
    cam.lookAt(objetivo);
  }

  return {
    ok: true, escenas: c.pares.length, mallas: mejorN,
    piezas: dentro.length, candidatas: todas.length, sobreBanco,
    banco: banco ? +cima.toFixed(2) : null,
    pizarras: limpieza.pizarras, etiquetas: limpieza.etiquetas, controles: !!ctr,
    R: +R.toFixed(2), dist: +dist.toFixed(2),
    ancho: +(aMax - aMin).toFixed(2), alto: +(bMax - bMin).toFixed(2),
    cen: cen.map((x) => +x.toFixed(2)),
    puesta: cam.position.toArray().map((x) => +x.toFixed(3)),
  };
};

// Repaso de rotulos justo antes de disparar (labs que reponen o crean etiquetas).
export const LIMPIAR = () => (window.__cap && window.__cap.limpiar ? window.__cap.limpiar() : null);

// Clava la camara donde la dejo el reencuadre. Sin esto, los labs con camara
// animada (el brazo robotico llegaba a una deriva de 5,12) se fotografian donde
// les da la gana. El parche de gancho() repone la pose en cada render.
export const FIJAR = () => {
  const c = window.__cap;
  if (!c || !c.pares || !c.pares.length) return false;
  const cam = c.elegir().cam;
  cam.updateMatrixWorld(true);
  c.fijo = { cam, p: cam.position.toArray(), q: cam.quaternion.toArray(), max: 0 };
  return true;
};

// Cuanto se movio la camara despues del reencuadre, en relativo. Con FIJAR puesto
// devuelve cuanto INTENTO moverse el lab antes de que se le repusiera la pose:
// sirve de diagnostico, ya no de aviso de foto torcida.
export const DERIVA = (puesta) => {
  const c = window.__cap;
  if (!c || !c.pares || !c.pares.length) return -1;
  const escala = Math.max(1e-6, Math.hypot(puesta[0], puesta[1], puesta[2]));
  if (c.fijo) return +(c.fijo.max / escala).toFixed(3);
  const p = c.elegir().cam.position;
  const d = Math.hypot(p.x - puesta[0], p.y - puesta[1], p.z - puesta[2]);
  return +(d / escala).toFixed(3);
};
