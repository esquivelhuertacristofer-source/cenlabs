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
      // La tanda 167–176 cierra la reserva anterior: todas las categorías vuelven
      // a exigir continuidad completa, sin exenciones para nuevos IDs.
      const orden = catalogoDeCategoria(cat).map((i) => i.orden);
      const esperado = orden.map((_, idx) => idx + 1); // [1, 2, …, N]
      expect(orden).toEqual(esperado);
      expect(orden.length).toBeGreaterThanOrEqual(10); // ninguna categoría encoge
    }
  });

  // Desde 2026-10-13 las destacadas de cada categoría son los labs de
  // «clase mundial» (antes: quimica-7, fisica-1, matematicas-1, biologia-1, mecanica-1).
  // Segunda tanda (2026-10-17): quimica-2/9, fisica-6/10, biologia-4/7, matematicas-5/8, mecanica-7/112.
  // Tercera tanda (2026-10-18): quimica-7/10, fisica-1/3, matematicas-6/9, biologia-2/6, mecanica-1/4.
  it('las destacadas de cada categoría son los labs de clase mundial', () => {
    const esperado: Record<Categoria, string[]> = {
      quimica: ['quimica-1', 'quimica-2', 'quimica-7', 'quimica-9', 'quimica-10'],
      fisica: ['fisica-1', 'fisica-3', 'fisica-6', 'fisica-9', 'fisica-10'],
      matematicas: ['matematicas-5', 'matematicas-6', 'matematicas-7', 'matematicas-8', 'matematicas-9', 'matematicas-10'],
      biologia: ['biologia-2', 'biologia-3', 'biologia-4', 'biologia-6', 'biologia-7', 'biologia-8'],
      mecanica: ['mecanica-1', 'mecanica-3', 'mecanica-4', 'mecanica-7', 'mecanica-127', 'mecanica-128', 'mecanica-129', 'mecanica-130', 'mecanica-131', 'mecanica-132', 'mecanica-133', 'mecanica-134', 'mecanica-135', 'mecanica-136', 'mecanica-137', 'mecanica-138', 'mecanica-139', 'mecanica-140', 'mecanica-141', 'mecanica-142', 'mecanica-143', 'mecanica-144', 'mecanica-148', 'mecanica-149', 'mecanica-150', 'mecanica-151', 'mecanica-152', 'mecanica-153', 'mecanica-154', 'mecanica-155', 'mecanica-156', 'mecanica-157', 'mecanica-158', 'mecanica-159', 'mecanica-160', 'mecanica-161', 'mecanica-162', 'mecanica-163', 'mecanica-164', 'mecanica-165', 'mecanica-166', 'mecanica-167', 'mecanica-168', 'mecanica-169', 'mecanica-170', 'mecanica-171', 'mecanica-172', 'mecanica-173', 'mecanica-174', 'mecanica-175', 'mecanica-176', 'mecanica-177', 'mecanica-178', 'mecanica-179', 'mecanica-180', 'mecanica-181', 'mecanica-182', 'mecanica-183', 'mecanica-184', 'mecanica-185', 'mecanica-186', 'mecanica-187', 'mecanica-188', 'mecanica-189', 'mecanica-190', 'mecanica-191', 'mecanica-192', 'mecanica-193', 'mecanica-194', 'mecanica-195', 'mecanica-196', 'mecanica-197', 'mecanica-198', 'mecanica-199', 'mecanica-200', 'mecanica-201', 'mecanica-202', 'mecanica-203', 'mecanica-204', 'mecanica-205', 'mecanica-206', 'mecanica-207', 'mecanica-208', 'mecanica-209', 'mecanica-210', 'mecanica-211', 'mecanica-212', 'mecanica-213', 'mecanica-214', 'mecanica-215', 'mecanica-216', 'mecanica-217', 'mecanica-218', 'mecanica-219', 'mecanica-220', 'mecanica-221', 'mecanica-222', 'mecanica-223', 'mecanica-224', 'mecanica-225', 'mecanica-226', 'mecanica-227', 'mecanica-228', 'mecanica-229', 'mecanica-230', 'mecanica-145', 'mecanica-146', 'mecanica-147', 'mecanica-49', 'mecanica-111', 'mecanica-112', 'mecanica-123'],
    };
    for (const cat of CATEGORIAS) {
      const destacadas = catalogoDeCategoria(cat).filter((i) => i.destacada).map((i) => i.id).sort();
      expect(destacadas).toEqual([...esperado[cat]].sort());
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
    // Mecánica ya no cabía en el hardcode original: las 16 prácticas de máquinas
    // eléctricas (mecanica-44..59) colgaban de 'Instrumentación' y el motor de
    // combustión (mecanica-2, 111, 112) de 'Autotrónica'. Se separaron al montar
    // las pestañas del hub, así que esta lista es más larga a propósito.
    expect(modulosDe('mecanica')).toEqual([
      'Autotrónica',
      'Motor de Combustión Interna',
      'Mecatrónica',
      'Instrumentación',
      'Circuitos Eléctricos',
      'Electrónica',
      'Máquinas Eléctricas',
      'Sistemas Digitales',
      'Hidráulica y Neumática',
      'Dinámica del Vehículo',
    ]);
  });
});
