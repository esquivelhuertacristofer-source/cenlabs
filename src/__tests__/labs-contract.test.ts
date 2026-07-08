/**
 * CONTRATO DE CARPETA — src/labs/<id>/
 * ─────────────────────────────────────────────────────────────────────────────
 * Verifica que TODO lab bajo el modelo "una carpeta = un lab" cumple el contrato
 * LabModule y que los registros generados están en sync con las carpetas en
 * disco. Es la red que hace seguro andamiar los ~200 labs nuevos con
 * `node scripts/new-lab.mjs`: un lab mal formado (id que no coincide con la
 * carpeta, categoría inválida, archivo faltante, registro desactualizado) rompe
 * este test en vez de fallar silenciosamente en runtime.
 *
 * Server-safe: importa los registros de DATOS/CATÁLOGO (nunca LAB_COMPONENTS,
 * que es 'use client' + next/dynamic). El contrato de components.ts se verifica
 * leyendo el archivo como texto, no importándolo.
 */
import fs from 'node:fs';
import path from 'node:path';
import { LABS } from '@/labs/_registry';
import { CATALOGO } from '@/labs/_catalogo';
import { categoriaDeId, ordenDeId } from '@/labs/_types';
import type { Categoria } from '@/labs/_types';

const LABS_DIR = path.join(__dirname, '..', 'labs');
const CATEGORIAS_VALIDAS: Categoria[] = [
  'quimica',
  'fisica',
  'matematicas',
  'biologia',
  'mecanica',
];

const has = (id: string, file: string) => fs.existsSync(path.join(LABS_DIR, id, file));
const read = (id: string, file: string) => fs.readFileSync(path.join(LABS_DIR, id, file), 'utf8');

/** Mismo criterio que scripts/gen-lab-registry.mjs (discoverLabDirs). */
function discoverLabDirs(): string[] {
  return fs
    .readdirSync(LABS_DIR)
    .filter((n) => !n.startsWith('_') && !n.startsWith('.'))
    .filter((n) => {
      try {
        return fs.statSync(path.join(LABS_DIR, n)).isDirectory();
      } catch {
        return false;
      }
    })
    .sort();
}

const LAB_DIRS = discoverLabDirs();
const DIRS_CON_INDEX = LAB_DIRS.filter((id) => has(id, 'index.ts'));
const DIRS_CON_CATALOGO = LAB_DIRS.filter((id) => has(id, 'catalogo.ts'));

/**
 * Un lab es "iframe 3D" (mecánica) si su catálogo declara `simuladorHtml`: su
 * simulador es un HTML three.js embebido por <iframe>, no un React 2.5D. Se
 * discrimina por ese campo —el criterio FUNCIONAL, no por el prefijo del id— para
 * que el contrato siga la forma real del lab. Los labs iframe NO tienen
 * contenido/tutorSteps/quiz/components y cumplen un contrato aparte (ver abajo).
 */
const esIframe = (id: string) => Boolean(CATALOGO[id]?.simuladorHtml);
const DIRS_25D = DIRS_CON_INDEX.filter((id) => !esIframe(id));
const DIRS_IFRAME = DIRS_CON_INDEX.filter((id) => esIframe(id));

describe('contrato de carpeta — src/labs/<id>', () => {
  it('hay al menos una carpeta de lab', () => {
    // Guarda contra una regresión donde el discovery deje de encontrar carpetas
    // (p.ej. un cambio de ruta) y los describe.each de abajo no corran nada.
    expect(LAB_DIRS.length).toBeGreaterThan(0);
  });

  describe.each(DIRS_25D)('%s (2.5D)', (id) => {
    it('tiene los archivos de datos requeridos', () => {
      for (const f of ['index.ts', 'contenido.ts', 'briefing.ts', 'tutorSteps.ts', 'quiz.ts', 'components.ts']) {
        expect(has(id, f)).toBe(true);
      }
    });

    it('está en el registro LABS y su id coincide con la carpeta', () => {
      expect(LABS[id]).toBeDefined();
      expect(LABS[id].id).toBe(id);
    });

    it('deriva una categoría válida del id', () => {
      expect(CATEGORIAS_VALIDAS).toContain(categoriaDeId(id));
      expect(ordenDeId(id)).toBeGreaterThan(0);
    });

    it('cumple la forma de LabModule (datos no vacíos)', () => {
      const lab = LABS[id];
      expect(typeof lab.contenido).toBe('object');
      expect(typeof lab.contenido!.titulo).toBe('string');
      expect(lab.contenido!.titulo.length).toBeGreaterThan(0);
      expect(typeof lab.briefing).toBe('object');
      expect(typeof lab.briefing.codigo).toBe('string');
      expect(typeof lab.briefing.duracion).toBe('number');
      expect(Array.isArray(lab.tutorSteps)).toBe(true);
      expect(lab.tutorSteps!.length).toBeGreaterThan(0);
      expect(Array.isArray(lab.quiz)).toBe(true);
      expect(lab.quiz!.length).toBeGreaterThan(0);
    });

    it('objetivos, si existe, es una función', () => {
      const { objetivos } = LABS[id];
      if (objetivos !== undefined) {
        expect(typeof objetivos).toBe('function');
      }
      // El archivo y el campo van de la mano: uno sin el otro es un error de wiring.
      expect(Boolean(objetivos)).toBe(has(id, 'objetivos.ts'));
    });

    it('components.ts exporta Piloto y Bitacora', () => {
      const src = read(id, 'components.ts');
      expect(src).toMatch(/export const Piloto\b/);
      expect(src).toMatch(/export const Bitacora\b/);
    });

    it('si tiene catalogo.ts, produce un CatalogoEntry válido y coincide con CATALOGO', () => {
      if (!has(id, 'catalogo.ts')) return;
      const entry = CATALOGO[id];
      expect(entry).toBeDefined();
      for (const campo of ['modulo', 'titulo', 'duracion', 'teoria', 'estado'] as const) {
        expect(typeof entry[campo]).toBe('string');
        expect(entry[campo].length).toBeGreaterThan(0);
      }
    });
  });

  // Contrato aparte para labs "iframe 3D" (mecánica): el simulador es un HTML
  // three.js embebido por <iframe>, así que NO tienen contenido/tutorSteps/quiz/
  // components. Solo aportan `briefing` a los facades de datos y declaran su HTML
  // en `catalogo.ts` (simuladorHtml). Ver LabModule/CatalogoEntry en _types.ts.
  describe.each(DIRS_IFRAME)('%s (iframe 3D)', (id) => {
    it('tiene los archivos requeridos (index, briefing, catalogo)', () => {
      for (const f of ['index.ts', 'briefing.ts', 'catalogo.ts']) {
        expect(has(id, f)).toBe(true);
      }
    });

    it('está en el registro LABS y su id coincide con la carpeta', () => {
      expect(LABS[id]).toBeDefined();
      expect(LABS[id].id).toBe(id);
    });

    it('deriva una categoría válida del id', () => {
      expect(CATEGORIAS_VALIDAS).toContain(categoriaDeId(id));
      expect(ordenDeId(id)).toBeGreaterThan(0);
    });

    it('solo aporta briefing (sin contenido/tutorSteps/quiz)', () => {
      const lab = LABS[id];
      expect(typeof lab.briefing).toBe('object');
      expect(typeof lab.briefing.codigo).toBe('string');
      expect(typeof lab.briefing.duracion).toBe('number');
      // No debe ensuciar MASTER_DATA / ALL_TUTOR_STEPS / ALL_QUIZZES.
      expect(lab.contenido).toBeUndefined();
      expect(lab.tutorSteps).toBeUndefined();
      expect(lab.quiz).toBeUndefined();
    });

    it('su catálogo declara el HTML del simulador y los metadatos base', () => {
      const entry = CATALOGO[id];
      expect(entry).toBeDefined();
      expect(typeof entry.simuladorHtml).toBe('string');
      expect(entry.simuladorHtml!.length).toBeGreaterThan(0);
      for (const campo of ['modulo', 'titulo', 'duracion', 'teoria', 'estado'] as const) {
        expect(typeof entry[campo]).toBe('string');
        expect(entry[campo].length).toBeGreaterThan(0);
      }
    });
  });

  describe('registros generados en sync con las carpetas', () => {
    it('LABS cubre exactamente las carpetas con index.ts', () => {
      expect(Object.keys(LABS).sort()).toEqual(DIRS_CON_INDEX);
    });

    it('CATALOGO cubre exactamente las carpetas con catalogo.ts', () => {
      expect(Object.keys(CATALOGO).sort()).toEqual(DIRS_CON_CATALOGO);
    });

    it('_components.generated.ts referencia cada carpeta con components.ts', () => {
      const gen = fs.readFileSync(path.join(LABS_DIR, '_components.generated.ts'), 'utf8');
      for (const id of LAB_DIRS.filter((d) => has(d, 'components.ts'))) {
        expect(gen).toContain(`'${id}':`);
      }
    });
  });
});
