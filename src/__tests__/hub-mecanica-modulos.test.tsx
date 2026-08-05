/**
 * src/__tests__/hub-mecanica-modulos.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * El hub de mecánica pasó de una lista plana de 112 prácticas a pestañas por
 * módulo, como las otras cuatro materias. Lo que aquí se protege no es el diseño
 * sino cuatro invariantes que, si se rompen, esconden prácticas SIN AVISAR —el
 * peor modo de fallo posible en un catálogo:
 *
 *  1. Las pestañas particionan el catálogo: cada práctica cae en exactamente una.
 *  2. La pestaña filtra de verdad (lo de fuera no se pinta) y cambiarla cambia todo.
 *  3. Buscar SALE de la pestaña y recorre toda la materia — si no, con nueve
 *     módulos el alumno escribiría "inducción" desde Autotrónica y no vería nada.
 *  4. Llegar con ?id=mecanica-N abre la pestaña que contiene ese lab. Con la
 *     lista plana cualquier id estaba montado; con pestañas casi ninguno lo está.
 *
 * `catalogoDeCategoria` NO se sustituye por un doble: el valor de estas pruebas
 * está justamente en correr contra el catálogo real. Y no se usa Testing Library
 * porque su peer `@testing-library/dom` no está instalado en el proyecto: se
 * monta con `createRoot` y el `act` que React 19 ya exporta.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import MecanicaCatalogPage from '@/app/alumno/laboratorio/mecanica/page';
import { catalogoDeCategoria } from '@/labs/_catalogo';

// Sin esta bandera React da por hecho que corre en un navegador y avisa en cada
// render de que `act(...)` no está soportado. Se pone aquí y no en jest.setup.ts
// para no cambiarle el entorno a las otras trece suites, que no montan nada.
(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const PRACTICAS = catalogoDeCategoria('mecanica');
const MODULOS = [...new Set(PRACTICAS.map((p) => p.modulo))];

let container: HTMLDivElement;
let root: Root;

/** Monta la página. El contenedor va al body: React delega los eventos ahí. */
function montar() {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(<MecanicaCatalogPage />); });
}

/** Ids de las tarjetas pintadas (SpotlightCard pone `id` = id del lab). */
const idsPintados = () =>
  Array.from(container.querySelectorAll('[id^="mecanica-"]')).map((n) => n.id).sort();

const botones = () => Array.from(container.querySelectorAll('button'));

/** Botón de una pestaña por su nombre de módulo. */
const pestana = (nombre: string) =>
  botones().find((b) => b.textContent?.startsWith(nombre));

const clic = (el: Element | undefined) => {
  if (!el) throw new Error('no se encontró el elemento a pulsar');
  act(() => { el.dispatchEvent(new MouseEvent('click', { bubbles: true })); });
};

/** Escribe en un input controlado por React (hay que usar el setter nativo). */
const escribe = (input: HTMLInputElement, texto: string) => {
  const setter = Object.getOwnPropertyDescriptor(
    window.HTMLInputElement.prototype, 'value',
  )!.set!;
  act(() => {
    setter.call(input, texto);
    input.dispatchEvent(new Event('input', { bubbles: true }));
  });
};

const caja = () => container.querySelector<HTMLInputElement>('input[type="text"]')!;
const hayTexto = (t: string) => (container.textContent ?? '').includes(t);

beforeAll(() => {
  // jsdom no implementa scrollIntoView y el efecto de ?id= lo llama.
  Element.prototype.scrollIntoView = jest.fn();
});

beforeEach(() => {
  window.history.replaceState({}, '', '/alumno/laboratorio/mecanica');
});

afterEach(() => {
  act(() => { root.unmount(); });
  container.remove();
});

describe('hub de mecánica — pestañas por módulo', () => {
  it('las pestañas particionan el catálogo: cada práctica en exactamente un módulo', () => {
    montar();

    let suma = 0;
    for (const m of MODULOS) {
      const btn = pestana(m);
      expect(btn).toBeDefined();
      // El contador vive en un <span> aparte dentro del botón.
      const contador = btn!.querySelector('span');
      suma += Number(contador!.textContent);
    }

    expect(suma).toBe(PRACTICAS.length);
    // Y ningún módulo aparece dos veces ni se cuela uno vacío.
    expect(MODULOS).toHaveLength(new Set(MODULOS).size);
    for (const m of MODULOS) {
      expect(PRACTICAS.filter((p) => p.modulo === m).length).toBeGreaterThan(0);
    }
  });

  it('la pestaña abierta pinta su módulo y sólo su módulo', () => {
    montar();
    const esperados = PRACTICAS.filter((p) => p.modulo === MODULOS[0]).map((p) => p.id).sort();
    expect(idsPintados()).toEqual(esperados);
  });

  it('cambiar de pestaña cambia el listado completo', () => {
    montar();
    const otro = MODULOS[MODULOS.length - 1];
    const esperados = PRACTICAS.filter((p) => p.modulo === otro).map((p) => p.id).sort();

    clic(pestana(otro));

    expect(idsPintados()).toEqual(esperados);
    expect(hayTexto(otro)).toBe(true);
  });

  it('buscar sale de la pestaña activa y recorre toda la materia', () => {
    montar();
    // Un lab que NO está en la pestaña por defecto, elegido del catálogo real.
    const fuera = PRACTICAS.find((p) => p.modulo !== MODULOS[0])!;
    expect(idsPintados()).not.toContain(fuera.id);

    escribe(caja(), fuera.titulo);

    expect(idsPintados()).toContain(fuera.id);
    expect(hayTexto('Resultados en toda la materia')).toBe(true);
  });

  it('una búsqueda sin coincidencias lo dice y se puede deshacer', () => {
    montar();
    escribe(caja(), 'zzzzz-no-existe');

    expect(idsPintados()).toHaveLength(0);
    expect(hayTexto('No hay coincidencias')).toBe(true);

    clic(botones().find((b) => b.textContent === 'Limpiar búsqueda'));
    expect(idsPintados().length).toBeGreaterThan(0);
  });

  it('las nueve pestañas caben en pantalla: se envuelven, no se ocultan tras un scroll', () => {
    // Regresión real: la barra se copió de matemáticas, que tiene tres módulos y
    // siempre caben, y venía con `overflow-x-auto` + `no-scrollbar`. Con nueve
    // pestañas no caben en ningún ancho, y sin barra de scroll visible (la rueda
    // del ratón no desplaza en horizontal) las últimas eran INALCANZABLES.
    //
    // jsdom no calcula diseño, así que no se puede medir el desbordamiento: lo
    // que se comprueba es que el contenedor sigue siendo de los que envuelven y
    // no de los que recortan. Es una comprobación de clases, no de píxeles.
    montar();
    const barra = pestana(MODULOS[0])!.parentElement!;

    expect(barra.className).toContain('flex-wrap');
    expect(barra.className).not.toContain('overflow-x-auto');
    expect(barra.className).not.toContain('no-scrollbar');
    // Y las nueve están en esa misma barra, no repartidas ni recortadas.
    expect(barra.querySelectorAll('button')).toHaveLength(MODULOS.length);
  });

  it('llegar con ?id= abre la pestaña que contiene ese lab, no la primera', () => {
    // Un lab de un módulo que NO es el que se abre por defecto: es el caso que
    // la lista plana resolvía sola y que las pestañas podrían romper en silencio.
    const objetivo = PRACTICAS.filter((p) => p.modulo !== MODULOS[0]).slice(-1)[0];
    window.history.replaceState({}, '', `/alumno/laboratorio/mecanica?id=${objetivo.id}`);

    montar();

    expect(idsPintados()).toContain(objetivo.id);
  });
});
