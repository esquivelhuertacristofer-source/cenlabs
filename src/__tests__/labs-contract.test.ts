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

describe('contrato de carpeta — src/labs/<id>', () => {
  it('hay al menos una carpeta de lab', () => {
    // Guarda contra una regresión donde el discovery deje de encontrar carpetas
    // (p.ej. un cambio de ruta) y los describe.each de abajo no corran nada.
    expect(LAB_DIRS.length).toBeGreaterThan(0);
  });

  describe.each(DIRS_CON_INDEX)('%s', (id) => {
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
      expect(typeof lab.contenido.titulo).toBe('string');
      expect(lab.contenido.titulo.length).toBeGreaterThan(0);
      expect(typeof lab.briefing).toBe('object');
      expect(typeof lab.briefing.codigo).toBe('string');
      expect(typeof lab.briefing.duracion).toBe('number');
      expect(Array.isArray(lab.tutorSteps)).toBe(true);
      expect(lab.tutorSteps.length).toBeGreaterThan(0);
      expect(Array.isArray(lab.quiz)).toBe(true);
      expect(lab.quiz.length).toBeGreaterThan(0);
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
