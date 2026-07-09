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

const CATEGORIAS: Categoria[] = ['quimica', 'fisica', 'matematicas', 'biologia', 'mecanica'];

describe('golden master — catálogo por categoría (invariante ante extracción a src/labs)', () => {
  it('inventario de ids del catálogo es estable', () => {
    expect(Object.keys(CATALOGO).sort()).toMatchSnapshot();
  });

  for (const cat of CATEGORIAS) {
    it(`catalogoDeCategoria('${cat}')`, () => {
      expect(catalogoDeCategoria(cat)).toMatchSnapshot();
    });
  }

  it('cada categoría tiene orden contiguo 1..N (sin huecos ni duplicados)', () => {
    // Invariante durable ante el crecimiento del catálogo (se añaden labs nuevos):
    // el `orden` derivado del id debe ir 1..N sin saltos ni repetidos, y
    // catalogoDeCategoria debe devolverlos en ese orden ascendente.
    // (Cazar un hueco/duplicado sigue funcionando aunque N crezca; NO fijamos N=10
    //  porque el proyecto suma prácticas nuevas — p. ej. mecánica ya tiene 11.)
    for (const cat of CATEGORIAS) {
      const orden = catalogoDeCategoria(cat).map((i) => i.orden);
      const esperado = orden.map((_, idx) => idx + 1); // [1, 2, …, N]
      expect(orden).toEqual(esperado);
      expect(orden.length).toBeGreaterThanOrEqual(10); // ninguna categoría encoge
    }
  });

  it('la práctica destacada de cada categoría es la original', () => {
    const esperado: Record<Categoria, string> = {
      quimica: 'quimica-7',
      fisica: 'fisica-1',
      matematicas: 'matematicas-1',
      biologia: 'biologia-1',
      mecanica: 'mecanica-1', // == destacada del practicasMecanica original
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
    expect(modulosDe('mecanica')).toEqual(['Autotrónica', 'Mecatrónica']);
  });
});
