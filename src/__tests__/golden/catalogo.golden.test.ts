/**
 * GOLDEN MASTER — catálogo de labs (edit point #7)
 * ─────────────────────────────────────────────────────────────────────────────
 * Congela la salida del registro liviano CATALOGO, que antes vivía inline como
 * `const practicas<Cat>: Practica[]` dentro de cada página
 * src/app/alumno/laboratorio/<cat>/page.tsx. La extracción a
 * src/labs/<id>/catalogo.ts debe reproducir EXACTAMENTE esos datos.
 *
 * Además de los snapshots (guarda hacia adelante), hay aserciones explícitas de
 * correctitud (conteo, orden contiguo, práctica destacada por categoría) que NO
 * dependen de regenerar el snapshot: cazan un error de extracción aunque alguien
 * corra `jest -u` por accidente.
 *
 * Regla: NO actualizar estos snapshots (`jest -u`) al mover datos de sitio. Un
 * cambio de snapshot aquí durante un refactor es un BUG, no una actualización.
 */
import { catalogoDeCategoria, CATALOGO } from '@/labs/_catalogo';
import type { Categoria } from '@/labs/_types';

const CATEGORIAS: Categoria[] = ['quimica', 'fisica', 'matematicas', 'biologia'];

describe('golden master — catálogo por categoría (invariante ante extracción a src/labs)', () => {
  it('inventario de ids del catálogo es estable', () => {
    expect(Object.keys(CATALOGO).sort()).toMatchSnapshot();
  });

  for (const cat of CATEGORIAS) {
    it(`catalogoDeCategoria('${cat}')`, () => {
      expect(catalogoDeCategoria(cat)).toMatchSnapshot();
    });
  }

  it('cada categoría estándar tiene 10 prácticas con orden 1..10 contiguo', () => {
    for (const cat of CATEGORIAS) {
      const orden = catalogoDeCategoria(cat).map((i) => i.orden);
      expect(orden).toEqual([1, 2, 3, 4, 5, 6, 7, 8, 9, 10]);
    }
  });

  it('la práctica destacada de cada categoría es la original', () => {
    const esperado: Record<Categoria, string> = {
      quimica: 'quimica-7',
      fisica: 'fisica-1',
      matematicas: 'matematicas-1',
      biologia: 'biologia-1',
      mecanica: '', // sin carpeta/catálogo — bespoke
    };
    for (const cat of CATEGORIAS) {
      const destacada = catalogoDeCategoria(cat).find((i) => i.destacada);
      expect(destacada?.id).toBe(esperado[cat]);
    }
  });

  it('las pestañas de módulo se derivan en orden de aparición (== hardcode original)', () => {
    // Reproduce el `[...new Set(practicas.map(p => p.modulo))]` de cada página y
    // verifica que coincide con las listas que estaban hardcodeadas.
    const modulosDe = (cat: Categoria) => [
      ...new Set(catalogoDeCategoria(cat).map((i) => i.modulo)),
    ];
    expect(modulosDe('quimica')).toEqual(['Fundamentos', 'Estequiometría', 'Fisicoquímica']);
    expect(modulosDe('fisica')).toEqual(['Mecánica', 'Fluidos y Calor', 'Electromagnetismo']);
    expect(modulosDe('matematicas')).toEqual([
      'Álgebra y Funciones',
      'Geometría y Trigonometría',
      'Cálculo y Probabilidad',
    ]);
    expect(modulosDe('biologia')).toEqual([
      'Biología Celular y Molecular',
      'Genética y Evolución',
      'Anatomía y Ecología',
    ]);
  });
});
