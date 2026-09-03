/**
 * DIAGNÓSTICO DE ESCENA · Capa de pruebas para los laboratorios 3D
 * =============================================================================
 *
 * Los laboratorios viejos no tenían ningún asidero para probarlos: sin él, una
 * prueba sólo puede pulsar a ciegas en coordenadas de pantalla y una foto negra
 * no se puede diagnosticar —no se sabe si la pieza falta, si está fuera de
 * cuadro, o si está donde debe y lo que falla es otra cosa—.
 *
 * Se instala con una línea al final del laboratorio:
 *
 *     import { instalaDiag } from '/labs/_diag3d.js';
 *     instalaDiag('direccion-eps', { escena, camara, controles, renderizador,
 *                                    grupos:{ volante:wheelGrp, cremallera:rackGrp } });
 *
 * y añade a `window.__test` lo que hace falta para auditar el 3D sin tocar el
 * laboratorio: salud(), piezas(), hijos(), verHijo(), ver(), atrib() y mira().
 */
import * as THREE from 'three';

const red = (v) => +v.toFixed(2);
const arr = (v) => v.toArray().map(red);

export function instalaDiag(nombre, o) {
  const { escena, camara, controles, renderizador, grupos = {} } = o;
  const G = (k) => grupos[k];

  const api = {
    lab: nombre,
    /* La escena en crudo, para las preguntas que no cabe prever: una sonda que
       sólo pueda hacer lo que ya está escrito aquí se queda corta el día que
       falta una pieza y hay que ir a buscarla por el árbol. */
    escena, camara, controles, renderizador, THREE,

    /** Caja envolvente en coordenadas de MUNDO de lo que case con el filtro.
     *  Una pieza que no aparece en la foto está en un sitio: aquí se ve cuál. */
    caja: (filtro) => {
      const r = [];
      escena.traverse((o) => {
        if (!filtro(o)) return;
        const b = new THREE.Box3().setFromObject(o);
        let n = 0; o.traverse((m) => { if (m.isMesh) n++; });
        r.push({ id: o.userData.id || o.name || o.type, tipo: o.userData.kind || null,
          mallas: n, visible: o.visible, esc: red(o.scale.x), pos: arr(o.position),
          min: isFinite(b.min.x) ? arr(b.min) : null,
          max: isFinite(b.max.x) ? arr(b.max) : null });
      });
      return r;
    },

    /**
     * La prueba que más veces ha salvado una tarde: normales de longitud CERO.
     *
     * `computeVertexNormals()` las deja así en los vértices que sólo tocan
     * triángulos degenerados, y `ExtrudeGeometry` los fabrica a puñados en
     * cuanto el bisel de un contorno muy muestreado se pisa a sí mismo. Una
     * normal nula es FINITA: pasa `isFinite`, la esfera envolvente sale bien,
     * la caja de la pieza sale bien y no hay un solo error en consola. Sólo
     * estalla dentro del sombreador, donde `normalize(vec3(0))` da NaN — y un
     * único píxel NaN se reparte por TODA la imagen en el desenfoque del bloom
     * y deja la pantalla negra, plataforma y luces incluidas.
     */
    salud: () => {
      const rotas = [], sinNormal = [];
      let cero = 0, mallas = 0, nanPos = 0;
      escena.traverse((m) => {
        if (!m.isMesh) return;
        mallas++;
        const g = m.geometry;
        if (!g.boundingSphere) g.computeBoundingSphere();
        const b = g.boundingSphere;
        if (!b || !isFinite(b.radius) || !isFinite(b.center.x + b.center.y + b.center.z))
          rotas.push(m.name || g.type);
        const p = m.getWorldPosition(new THREE.Vector3());
        if (!isFinite(p.x + p.y + p.z)) nanPos++;
        const n = g.attributes.normal;
        if (!n) { sinNormal.push(m.name || g.type); return; }
        for (let i = 0; i < n.count; i++) {
          const x = n.getX(i), y = n.getY(i), z = n.getZ(i);
          if (x * x + y * y + z * z < 1e-12) cero++;
        }
      });
      return { mallas, normalesCero: cero, esferasRotas: rotas, sinNormal, posicionesNaN: nanPos,
        tri: renderizador ? renderizador.info.render.triangles : null,
        llamadas: renderizador ? renderizador.info.render.calls : null };
    },

    /** Dónde está cada grupo declarado y qué ocupa. Una pieza en (0,0,0) que
     *  debería estar montada es un montaje roto, aunque la foto no lo enseñe. */
    piezas: () => {
      const r = {};
      for (const k of Object.keys(grupos)) {
        const g = G(k); if (!g) continue;
        let n = 0; g.traverse((m) => { if (m.isMesh) n++; });
        const b = new THREE.Box3().setFromObject(g);
        r[k] = { mallas: n, visible: g.visible, pos: arr(g.position),
          min: isFinite(b.min.x) ? arr(b.min) : null,
          max: isFinite(b.max.x) ? arr(b.max) : null };
      }
      if (camara) r.camara = { pos: arr(camara.position),
        mira: controles ? arr(controles.target) : null };
      return r;
    },

    hijos: (k) => (G(k) ? G(k).children.map((c) =>
      (c.name || c.type) + '/' + (c.geometry ? c.geometry.type : '-')) : []),
    verHijo: (k, i, v) => { const g = G(k); if (g && g.children[i]) g.children[i].visible = v; return true; },
    ver: (k, v) => { const g = G(k); if (g) g.visible = v; return Object.keys(grupos)
      .map((x) => x + '=' + (G(x) ? G(x).visible : '?')); },

    /** Los atributos crudos de una pieza, para cuando hay que mirarle las
     *  costuras: cuántos vértices, cuántos NaN y cuántas normales nulas. */
    atrib: (k, i) => {
      const m = G(k) && G(k).children[i]; if (!m || !m.geometry) return null;
      const g = m.geometry, r = { tipo: g.type };
      for (const a of Object.keys(g.attributes)) {
        const v = g.attributes[a].array; let nan = 0, mx = 0;
        for (let j = 0; j < v.length; j++) {
          if (!isFinite(v[j])) nan++; else if (Math.abs(v[j]) > mx) mx = Math.abs(v[j]);
        }
        r[a] = { n: v.length, nan, max: +mx.toFixed(3) };
      }
      return r;
    },

    mira: (x, y, z, tx, ty, tz) => {
      if (camara) camara.position.set(x, y, z);
      if (controles) { controles.target.set(tx || 0, ty || 0, tz || 0); controles.update(); }
      return true;
    },
  };

  /* Dos puertas. `window.__test` es la cómoda, pero un laboratorio que declare
     el suyo DESPUÉS aplasta ésta sin decir nada; `window.__diag3d` es la que
     sobrevive siempre, y es la que usa el kit de escena compartido. */
  window.__diag3d = api;
  window.__test = Object.assign(window.__test || {}, api);
  return api;
}
