/**
 * src/__tests__/hub-ingenieria-avanzada.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * La ficha «Ingeniería Avanzada» y su catálogo: las siete prácticas estrella y las
 * de formación industrial (ACT, CTL, PLC, CNC, ELA), agrupadas por área.
 * Estas prácticas son paquetes estáticos (public/estrellas/<id>/) que se abren en
 * otra pestaña y NO escriben en la base. Lo que aquí se protege:
 *
 *  1. El catálogo ofrece todas, cada una con un enlace que abre SU archivo en
 *     pestaña nueva con rel="noopener", y avisa de que el avance queda en el navegador.
 *     Las de formación industrial van en su sección de área, en el orden del catálogo.
 *  2. Cada enlace y cada portada apuntan a un archivo que EXISTE en public/, y
 *     `huellas.json` dice la verdad sobre lo copiado (un paquete a medio copiar
 *     se vería como una pestaña en blanco, sin error en ningún lado). Cada práctica
 *     industrial publicada trae en huellas.json la versión y las comprobaciones de la
 *     suite que la validó, y no queda ningún paquete huérfano fuera del hub.
 *  3. La ficha del inicio no pinta un anillo «0 / N» y —lo importante— NO entra en
 *     el porcentaje general: con 9 de 45 prácticas completadas el alumno ve 20 %,
 *     no el que saldría de sumar prácticas que nunca pueden contarse.
 *  4. /estrellas/ queda fuera del middleware (se sirve sin sesión, como /labs/),
 *     y el catálogo sigue dentro de /alumno, que sí la exige.
 *
 * Igual que en hub-mecanica-modulos: sin Testing Library (falta su peer), se monta
 * con `createRoot` y el `act` de React 19.
 */
import React, { act } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import IngenieriaAvanzadaCatalogPage from '@/app/alumno/laboratorio/ingenieria-avanzada/page';
import AlumnoInicio from '@/app/alumno/inicio/page';
import {
  AREAS_INDUSTRIALES,
  ESTRELLAS,
  MOSAICO_ESTRELLAS,
  PRACTICAS_INDUSTRIALES,
  TOTAL_PRACTICAS_HUB,
} from '@/lib/estrellas';

/** Todas las prácticas del hub, estrellas primero: lo que se publica en public/estrellas. */
const TODAS = [...ESTRELLAS, ...PRACTICAS_INDUSTRIALES];

(globalThis as unknown as { IS_REACT_ACT_ENVIRONMENT: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

// ── Dobles para la pantalla de inicio (la única que habla con la sesión y la base) ──
// 9 completadas repartidas en las cinco materias, más una en curso que no cuenta.
const INTENTOS = [
  ...['quimica-1', 'quimica-2', 'quimica-3', 'fisica-1', 'fisica-2', 'biologia-4', 'matematicas-5', 'mecanica-1', 'mecanica-2']
    .map((sim_id) => ({ sim_id, status: 'completed', started_at: '2026-11-01T00:00:00Z' })),
  { sim_id: 'fisica-9', status: 'in_progress', started_at: '2026-11-02T00:00:00Z' },
];
const ALUMNO = { id: 'u-prueba', role: 'alumno', full_name: 'Alumna de Prueba', email: 'alumna@prueba.invalid' };

jest.mock('next/navigation', () => {
  // El MISMO objeto en cada render, como el router de verdad: el efecto de la página
  // depende de él y con uno nuevo cada vez se volvería a lanzar sin fin.
  const router = { push: jest.fn(), replace: jest.fn(), prefetch: jest.fn() };
  return { useRouter: () => router };
});
jest.mock('next/image', () => ({
  __esModule: true,
  // Sin el optimizador de Next: basta con saber qué imagen se pide.
  default: ({ src, alt }: { src: string; alt: string }) => React.createElement('img', { src, alt }),
}));
jest.mock('@/lib/supabase-helpers', () => ({ getCurrentProfile: jest.fn(async () => ALUMNO) }));
jest.mock('@/lib/supabase-browser', () => {
  const consulta: Record<string, unknown> = {};
  for (const m of ['select', 'eq', 'in']) consulta[m] = () => consulta;
  consulta.order = async () => ({ data: INTENTOS, error: null });
  return {
    supabase: {
      auth: {
        getUser: async () => ({ data: { user: { id: 'u-prueba' } }, error: null }),
        getSession: async () => ({ data: { session: null } }),
        signOut: async () => ({ error: null }),
      },
      from: () => consulta,
    },
  };
});

const PUBLIC = path.join(process.cwd(), 'public');
const enPublic = (ruta: string) => path.join(PUBLIC, ...ruta.split('/').filter(Boolean));

let container: HTMLDivElement;
let root: Root;

function montar(nodo: React.ReactElement) {
  container = document.createElement('div');
  document.body.appendChild(container);
  root = createRoot(container);
  act(() => { root.render(nodo); });
}

afterEach(() => {
  act(() => { root?.unmount(); });
  container?.remove();
});

describe('catálogo de Ingeniería Avanzada', () => {
  it('son siete prácticas, E1 a E7, sin repetir', () => {
    expect(ESTRELLAS.map((p) => p.id)).toEqual(['E1', 'E2', 'E3', 'E4', 'E5', 'E6', 'E7']);
    expect(new Set(ESTRELLAS.map((p) => p.titulo)).size).toBe(7);
    for (const p of ESTRELLAS) {
      expect(p.frase.length).toBeGreaterThan(40);
      expect(p.area.length).toBeGreaterThan(0);
    }
  });

  it('pinta una tarjeta por práctica con su número, título, frase, área y portada', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    const tarjetas = Array.from(container.querySelectorAll('#estrellas article'));
    expect(tarjetas.map((t) => t.id)).toEqual(ESTRELLAS.map((p) => p.id));
    tarjetas.forEach((t, i) => {
      const p = ESTRELLAS[i];
      const texto = t.textContent ?? '';
      expect(texto).toContain(p.titulo);
      expect(texto).toContain(p.frase);
      expect(texto).toContain(`Práctica ${i + 1} • ${p.area}`);
      expect(t.querySelector('img')?.getAttribute('src')).toBe(p.portada);
    });
  });

  it('cada «Abrir práctica» abre SU archivo en pestaña nueva con rel="noopener"', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    const enlaces = Array.from(container.querySelectorAll<HTMLAnchorElement>('#estrellas article a'));
    expect(enlaces).toHaveLength(7);
    enlaces.forEach((a, i) => {
      expect(a.getAttribute('href')).toBe(`/estrellas/E${i + 1}/index.html`);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener');
      expect(a.textContent).toContain('Abrir práctica');
    });
  });

  it('avisa de que se abre aparte y de que el avance queda en ese navegador, y deja volver al hub', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    const aviso = container.querySelector('[role="note"]')?.textContent ?? '';
    expect(aviso).toMatch(/se abre aparte/);
    expect(aviso).toMatch(/se guarda en ese navegador/);
    const volver = Array.from(container.querySelectorAll('a')).find((a) => a.getAttribute('href') === '/alumno/inicio');
    expect(volver).toBeDefined();
  });
});


describe('catálogo de formación industrial', () => {
  const ORDEN = AREAS_INDUSTRIALES.map((a) => a.prefijo);

  it('las áreas son Actuadores, Controladores, PLC, CNC, Electrónica avanzada, Semiconductores, Robótica e integración, Capacitores, Manufactura, Producción y ERP, en ese orden', () => {
    expect(AREAS_INDUSTRIALES.map((a) => [a.prefijo, a.nombre])).toEqual([
      ['ACT', 'Actuadores'],
      ['CTL', 'Controladores'],
      ['PLC', 'PLC'],
      ['CNC', 'CNC'],
      ['ELA', 'Electrónica avanzada'],
      ['SEM', 'Semiconductores'],
      ['ING', 'Robótica e integración'],
      ['CAP', 'Capacitores'],
      ['MAN', 'Manufactura'],
      ['PRO', 'Producción'],
      ['ERP', 'Planeación de recursos (ERP)'],
    ]);
    for (const a of AREAS_INDUSTRIALES) expect(a.resumen.length).toBeGreaterThan(30);
  });

  it('cada práctica tiene código del catálogo, sin repetir, ordenada por área y por número', () => {
    expect(PRACTICAS_INDUSTRIALES.length).toBeGreaterThan(0);
    const ids = PRACTICAS_INDUSTRIALES.map((p) => p.id);
    for (const id of ids) expect(id).toMatch(/^(ACT|CTL|PLC|CNC|ELA|SEM|ING|CAP|MAN|PRO|ERP)-\d{2}$/);
    expect(new Set(ids).size).toBe(ids.length);
    const ordenados = [...ids].sort((a, b) => ORDEN.indexOf(a.slice(0, 3)) - ORDEN.indexOf(b.slice(0, 3)) || a.localeCompare(b));
    expect(ids).toEqual(ordenados);
    expect(TOTAL_PRACTICAS_HUB).toBe(ESTRELLAS.length + PRACTICAS_INDUSTRIALES.length);
  });

  it('título llano y frase completa en cada una; ningún título se repite en todo el hub', () => {
    for (const p of PRACTICAS_INDUSTRIALES) {
      expect(p.area).toBe(AREAS_INDUSTRIALES.find((a) => a.prefijo === p.id.slice(0, 3))!.nombre);
      expect(p.titulo.length).toBeGreaterThan(5);
      expect(p.titulo).not.toMatch(/^CEN|·/); // el título del index.html trae «CEN · ACT-01 · …»
      expect(p.frase.length).toBeGreaterThan(40);
      expect(p.frase).toMatch(/^[A-ZÁÉÍÓÚÑ].*\.$/);
      expect(p.href).toBe(`/estrellas/${p.id}/index.html`);
      expect(p.portada).toBe(`/estrellas/portadas/${p.id}.webp`);
    }
    const titulos = TODAS.map((p) => p.titulo);
    expect(new Set(titulos).size).toBe(titulos.length);
  });

  it('la lista que copia scripts/estrellas/copiar-practicas.mjs es la misma del hub', () => {
    // El script lee los códigos de src/lib/estrellas.ts con esta misma expresión.
    const fuente = fs.readFileSync(path.join(process.cwd(), 'src', 'lib', 'estrellas.ts'), 'utf8');
    const delScript = [...fuente.matchAll(/practica\(\s*'([A-Z]{3}-\d{2})'/g)].map((m) => m[1]);
    expect(delScript).toEqual(PRACTICAS_INDUSTRIALES.map((p) => p.id));
  });

  it('pinta una sección por área con su título, su cuenta y sus tarjetas en orden', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    const conPracticas = AREAS_INDUSTRIALES.filter((a) => PRACTICAS_INDUSTRIALES.some((p) => p.id.startsWith(`${a.prefijo}-`)));
    const secciones = Array.from(container.querySelectorAll('section[id^="area-"]'));
    expect(secciones.map((s) => s.id)).toEqual(conPracticas.map((a) => `area-${a.prefijo}`));
    secciones.forEach((s, i) => {
      const area = conPracticas[i];
      const suyas = PRACTICAS_INDUSTRIALES.filter((p) => p.id.startsWith(`${area.prefijo}-`));
      expect(s.querySelector('h2')?.textContent).toBe(area.nombre);
      expect(s.textContent).toContain(`${suyas.length} ${suyas.length === 1 ? 'práctica' : 'prácticas'}`);
      expect(s.textContent).toContain(area.resumen);
      const tarjetas = Array.from(s.querySelectorAll('article'));
      expect(tarjetas.map((t) => t.id)).toEqual(suyas.map((p) => p.id));
      tarjetas.forEach((t, j) => {
        const p = suyas[j];
        const texto = t.textContent ?? '';
        expect(texto).toContain(p.titulo);
        expect(texto).toContain(p.frase);
        expect(texto).toContain(`${p.id} • ${area.nombre}`);
        expect(t.querySelector('img')?.getAttribute('src')).toBe(p.portada);
        expect(t.querySelector('img')?.getAttribute('alt')).toBe(`Escena 3D de la práctica: ${p.titulo}`);
      });
    });
    // Ninguna tarjeta suelta fuera de su sección, y cada id aparece una sola vez en la página.
    const todas = Array.from(container.querySelectorAll('article')).map((a) => a.id);
    expect(todas).toEqual(TODAS.map((p) => p.id));
  });

  it('cada «Abrir práctica» industrial abre SU archivo en pestaña nueva con rel="noopener"', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    const enlaces = Array.from(container.querySelectorAll<HTMLAnchorElement>('section[id^="area-"] article a'));
    expect(enlaces).toHaveLength(PRACTICAS_INDUSTRIALES.length);
    enlaces.forEach((a, i) => {
      const p = PRACTICAS_INDUSTRIALES[i];
      expect(a.getAttribute('href')).toBe(`/estrellas/${p.id}/index.html`);
      expect(a.getAttribute('target')).toBe('_blank');
      expect(a.getAttribute('rel')).toBe('noopener');
      expect(a.textContent).toContain('Abrir práctica');
      expect(a.getAttribute('aria-label')).toBe(`Abrir práctica ${p.id}: ${p.titulo} (se abre en otra pestaña)`);
    });
  });

  it('el encabezado cuenta todas y el índice salta a cada grupo con su cuenta', () => {
    montar(<IngenieriaAvanzadaCatalogPage />);
    expect(container.querySelector('h1')?.parentElement?.textContent).toContain(`${TOTAL_PRACTICAS_HUB} prácticas`);
    const indice = container.querySelector('nav[aria-label="Grupos de prácticas"]')!;
    const saltos = Array.from(indice.querySelectorAll('a')).map((a) => [a.getAttribute('href'), a.textContent]);
    const esperados = [
      ['#estrellas', `Prácticas estrella · ${ESTRELLAS.length}`],
      ...AREAS_INDUSTRIALES.map((a) => [a, PRACTICAS_INDUSTRIALES.filter((p) => p.id.startsWith(`${a.prefijo}-`)).length] as const)
        .filter(([, n]) => n > 0)
        .map(([a, n]) => [`#area-${a.prefijo}`, `${a.nombre} · ${n}`]),
    ];
    expect(saltos).toEqual(esperados);
    for (const [href] of saltos) expect(container.querySelector(href!)).not.toBeNull();
  });
});

describe('archivos de las prácticas en public/estrellas', () => {
  const huellas = JSON.parse(fs.readFileSync(enPublic('/estrellas/huellas.json'), 'utf8')) as {
    versiones: Record<string, string | null>;
    validacion?: Record<string, { version: string; comprobaciones: number }>;
    archivos: Record<string, { sha256: string; bytes: number }>;
  };

  it('cada práctica tiene su index.html, su app.js y su portada', () => {
    for (const p of TODAS) {
      expect(fs.existsSync(enPublic(p.href))).toBe(true);
      expect(fs.existsSync(enPublic(`/estrellas/${p.id}/app.js`))).toBe(true);
      expect(fs.existsSync(enPublic(p.portada))).toBe(true);
    }
    expect(fs.existsSync(enPublic(MOSAICO_ESTRELLAS))).toBe(true);
  });

  it('todo lo que el index.html de cada práctica carga está copiado junto a él', () => {
    for (const p of TODAS) {
      const html = fs.readFileSync(enPublic(p.href), 'utf8');
      const scripts = [...html.matchAll(/<script[^>]*\ssrc="([^"]+)"/g)].map((m) => m[1]);
      expect(scripts).toContain('app.js');
      for (const s of scripts) {
        // Solo rutas relativas: el paquete no depende de ninguna CDN.
        expect(s).not.toMatch(/^(https?:)?\/\//);
        expect(fs.existsSync(enPublic(`/estrellas/${p.id}/${s}`))).toBe(true);
      }
    }
  });

  it('cada práctica industrial publicada trae la versión y las comprobaciones de la suite que la validó', () => {
    for (const p of PRACTICAS_INDUSTRIALES) {
      const version = huellas.versiones[p.id];
      expect(version).toMatch(new RegExp(`^${p.id}-\\d+\\.\\d+$`));
      const js = fs.readFileSync(enPublic(`/estrellas/${p.id}/app.js`), 'utf8');
      expect(js).toMatch(new RegExp(`VERSION\\s*=\\s*["']${version!.replace(/\./g, '\\.')}["']`));
      const v = huellas.validacion?.[p.id];
      expect(v).toBeDefined();
      expect(v!.version).toBe(version);
      expect(v!.comprobaciones).toBeGreaterThan(100);
    }
  });

  it('no hay paquetes huérfanos: cada carpeta de public/estrellas es una práctica del hub', () => {
    const carpetas = fs.readdirSync(enPublic('/estrellas'), { withFileTypes: true })
      .filter((e) => e.isDirectory() && e.name !== 'portadas')
      .map((e) => e.name)
      .sort();
    expect(carpetas).toEqual(TODAS.map((p) => p.id).sort());
    expect(Object.keys(huellas.versiones).sort()).toEqual(carpetas);
    const portadas = fs.readdirSync(enPublic('/estrellas/portadas')).filter((f) => f !== 'mosaico.webp').sort();
    expect(portadas).toEqual(TODAS.map((p) => `${p.id}.webp`).sort());
  });

  it('las portadas son fotos de la escena (webp de 960 px a 16:10), no imágenes vacías', () => {
    for (const p of TODAS) {
      const datos = fs.readFileSync(enPublic(p.portada));
      expect(datos.subarray(0, 4).toString('latin1')).toBe('RIFF');
      expect(datos.subarray(8, 12).toString('latin1')).toBe('WEBP');
      // Una foto plana o en negro de 960×600 comprime a menos de 3 KiB.
      expect(datos.length).toBeGreaterThan(8 * 1024);
    }
    for (const p of PRACTICAS_INDUSTRIALES) {
      // VP8 con pérdida: el ancho y el alto van en los bytes 26-29 (14 bits cada uno).
      const datos = fs.readFileSync(enPublic(p.portada));
      expect(datos.subarray(12, 16).toString('latin1')).toBe('VP8 ');
      const ancho = datos.readUInt16LE(26) & 0x3fff;
      const alto = datos.readUInt16LE(28) & 0x3fff;
      expect(ancho).toBe(960);
      expect(Math.abs(ancho / alto - 1.6)).toBeLessThan(0.01);
    }
  });

  it('huellas.json coincide con lo que hay en disco, sin archivos de más ni de menos', () => {
    const enDisco: string[] = [];
    const recorrer = (dir: string) => {
      for (const e of fs.readdirSync(dir, { withFileTypes: true })) {
        const abs = path.join(dir, e.name);
        if (e.isDirectory()) recorrer(abs);
        else enDisco.push(path.relative(enPublic('/estrellas'), abs).split(path.sep).join('/'));
      }
    };
    recorrer(enPublic('/estrellas'));
    expect(enDisco.filter((f) => f !== 'huellas.json').sort()).toEqual(Object.keys(huellas.archivos).sort());
    // Los .md del paquete son para el docente: no se publican.
    expect(enDisco.filter((f) => f.endsWith('.md'))).toEqual([]);

    for (const [rel, h] of Object.entries(huellas.archivos)) {
      const datos = fs.readFileSync(enPublic(`/estrellas/${rel}`));
      expect(datos.length).toBe(h.bytes);
      expect(crypto.createHash('sha256').update(datos).digest('hex')).toBe(h.sha256);
      // Tope por archivo de los assets de Cloudflare Workers.
      expect(h.bytes).toBeLessThan(25 * 1024 * 1024);
    }
  });
});

describe('ficha de Ingeniería Avanzada en el inicio del alumno', () => {
  async function montarInicio() {
    montar(<AlumnoInicio />);
    // La sesión y los intentos llegan en promesas encadenadas: se dejan asentar.
    for (let i = 0; i < 10; i++) await act(async () => { await Promise.resolve(); });
  }
  const ficha = () =>
    Array.from(container.querySelectorAll('a'))
      .find((a) => a.getAttribute('href') === '/alumno/laboratorio/ingenieria-avanzada')!
      .closest('.group') as HTMLElement;

  it('va después de Mecánica, a todo lo ancho, con el nombre sin «Laboratorio de»', async () => {
    await montarInicio();
    const destinos = Array.from(container.querySelectorAll('a'))
      .map((a) => a.getAttribute('href') ?? '')
      .filter((h) => h.startsWith('/alumno/laboratorio/'));
    expect(destinos).toEqual([
      '/alumno/laboratorio/quimica',
      '/alumno/laboratorio/fisica',
      '/alumno/laboratorio/biologia',
      '/alumno/laboratorio/matematicas',
      '/alumno/laboratorio/mecanica',
      '/alumno/laboratorio/ingenieria-avanzada',
    ]);
    expect(ficha().className).toContain('xl:col-span-2');
    expect(ficha().querySelector('h2')?.textContent).toBe('Ingeniería Avanzada');
    expect(ficha().querySelector('img')?.getAttribute('src')).toBe(MOSAICO_ESTRELLAS);
  });

  it('no muestra anillo ni «0 / N»: dice cuántas prácticas son en total y su subtítulo', async () => {
    await montarInicio();
    const texto = ficha().textContent ?? '';
    expect(texto).toContain(`${7 + PRACTICAS_INDUSTRIALES.length} prácticas · nivel licenciatura`);
    expect(texto).toContain(`7 prácticas estrella y ${PRACTICAS_INDUSTRIALES.length} de formación industrial: actuadores, controladores, PLC, CNC y electrónica avanzada`);
    expect(texto).not.toMatch(/Prácticas Completadas/i);
    expect(texto).not.toMatch(/\d+\s*\/\s*\d+/);
    // El anillo de progreso es el único <svg> con <circle> de las fichas.
    expect(ficha().querySelector('circle')).toBeNull();
  });

  it('las otras cinco fichas conservan su anillo y su cuenta', async () => {
    await montarInicio();
    const texto = container.textContent ?? '';
    expect((texto.match(/Prácticas Completadas/g) ?? []).length).toBe(5);
    expect(texto).toContain('3 / 10'); // química
    expect(texto).toContain('2 / 5');  // mecánica
  });

  it('queda fuera del porcentaje general: 9 de 45 es 20 %, no 9 de 52', async () => {
    await montarInicio();
    const texto = container.textContent ?? '';
    expect(texto).toContain('20% Platinum');
    expect(texto).not.toContain('17% Platinum');
  });
});

describe('las prácticas se sirven sin sesión', () => {
  // El matcher se lee del archivo: importar el middleware arrastraría `next/server`,
  // que no carga en jsdom. Se evalúa como lo hace Next: una ruta que NO casa no pasa por él.
  const fuente = fs.readFileSync(path.join(process.cwd(), 'src', 'middleware.ts'), 'utf8');
  const matcher = /matcher:\s*\[\s*'([^']+)'/.exec(fuente)![1].replace(/\\\\/g, '\\');
  const pasaPorMiddleware = (ruta: string) => new RegExp(`^${matcher}$`).test(ruta);

  it('/estrellas/ no pasa por el middleware, igual que /labs/', () => {
    expect(pasaPorMiddleware('/labs/algo.html')).toBe(false);
    for (const p of TODAS) {
      expect(pasaPorMiddleware(p.href)).toBe(false);
      expect(pasaPorMiddleware(`/estrellas/${p.id}/app.js`)).toBe(false);
      expect(pasaPorMiddleware(p.portada)).toBe(false);
    }
  });

  it('el catálogo sí pasa, y /alumno sigue siendo un prefijo protegido', () => {
    expect(pasaPorMiddleware('/alumno/laboratorio/ingenieria-avanzada')).toBe(true);
    expect(fuente).toMatch(/PROTECTED_PREFIXES = \[[^\]]*'\/alumno'/);
    // Y ninguna regla protege /estrellas por accidente.
    expect(/PROTECTED_PREFIXES = \[([^\]]*)\]/.exec(fuente)![1]).not.toContain('estrellas');
  });

  it('el service worker las trata como los labs: red primero, con copia para abrir sin internet', () => {
    const sw = fs.readFileSync(enPublic('/sw.js'), 'utf8');
    const esLab = /function esLab\(url\) \{([\s\S]*?)\n\}/.exec(sw)![1];
    expect(esLab).toContain("'/estrellas/'");
    expect(sw).toContain("'/alumno/laboratorio/ingenieria-avanzada'");
  });
});
