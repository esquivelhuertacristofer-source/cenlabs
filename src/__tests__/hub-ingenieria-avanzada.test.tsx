/**
 * src/__tests__/hub-ingenieria-avanzada.test.tsx
 * ─────────────────────────────────────────────────────────────────────────────
 * La ficha «Ingeniería Avanzada» y su catálogo de siete prácticas estrella.
 * Estas prácticas son paquetes estáticos (public/estrellas/E#/) que se abren en
 * otra pestaña y NO escriben en la base. Lo que aquí se protege:
 *
 *  1. El catálogo ofrece las siete, cada una con un enlace que abre SU archivo en
 *     pestaña nueva con rel="noopener", y avisa de que el avance queda en el navegador.
 *  2. Cada enlace y cada portada apuntan a un archivo que EXISTE en public/, y
 *     `huellas.json` dice la verdad sobre lo copiado (un paquete a medio copiar
 *     se vería como una pestaña en blanco, sin error en ningún lado).
 *  3. La ficha del inicio no pinta un anillo «0 / 7» y —lo importante— NO entra en
 *     el porcentaje general: con 9 de 45 prácticas completadas el alumno ve 20 %,
 *     no el 17 % que saldría de sumar siete prácticas que nunca pueden contarse.
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
import { ESTRELLAS, MOSAICO_ESTRELLAS } from '@/lib/estrellas';

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
    const tarjetas = Array.from(container.querySelectorAll('article'));
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
    const enlaces = Array.from(container.querySelectorAll<HTMLAnchorElement>('article a'));
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

describe('archivos de las prácticas en public/estrellas', () => {
  const huellas = JSON.parse(fs.readFileSync(enPublic('/estrellas/huellas.json'), 'utf8')) as {
    archivos: Record<string, { sha256: string; bytes: number }>;
  };

  it('cada práctica tiene su index.html, su app.js y su portada', () => {
    for (const p of ESTRELLAS) {
      expect(fs.existsSync(enPublic(p.href))).toBe(true);
      expect(fs.existsSync(enPublic(`/estrellas/${p.id}/app.js`))).toBe(true);
      expect(fs.existsSync(enPublic(p.portada))).toBe(true);
    }
    expect(fs.existsSync(enPublic(MOSAICO_ESTRELLAS))).toBe(true);
  });

  it('todo lo que el index.html de cada práctica carga está copiado junto a él', () => {
    for (const p of ESTRELLAS) {
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

  it('no muestra anillo ni «0 / 7»: dice «7 prácticas · nivel licenciatura» y su subtítulo', async () => {
    await montarInicio();
    const texto = ficha().textContent ?? '';
    expect(texto).toContain('7 prácticas · nivel licenciatura');
    expect(texto).toContain('7 prácticas estrella de la industria: automatización, robótica, manufactura, energía y control');
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
    for (const p of ESTRELLAS) {
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
