/**
 * DE QUÉ MATERIA ES UNA PRÁCTICA.
 *
 * Una función de tres líneas con dos pruebas de peso, porque los dos errores
 * que sustituye eran del tipo que no da error: repartían mal las notas y el
 * panel del profesor se pintaba igual de bonito con los números cambiados.
 *
 *   · `AlumnosContent` tenía Matemáticas como omisión, así que TODO lo que no
 *     fuera química, física o biología —las 120 prácticas de mecánica— habría
 *     ido al eje de matemáticas del radar del alumno.
 *   · `GroupRadarChart` comparaba contra `QMI`, `FIS`, `BIO`, que son los
 *     identificadores viejos. `FISICA-1` y `BIOLOGIA-1` acertaban de casualidad;
 *     `QUIMICA-1` no empieza por `QMI`, así que la química entera se estaba
 *     contando como matemáticas y su eje del radar de grupo salía en cero.
 */
import { materiaDe, rotuloMateria, MATERIAS, ROTULOS } from '@/lib/materias';

describe('materiaDe', () => {
  it('reconoce las cinco materias del catálogo', () => {
    expect(materiaDe('quimica-1')).toBe('quimica');
    expect(materiaDe('fisica-10')).toBe('fisica');
    expect(materiaDe('biologia-4')).toBe('biologia');
    expect(materiaDe('matematicas-7')).toBe('matematicas');
    expect(materiaDe('mecanica-120')).toBe('mecanica');
  });

  it('no adivina: lo que no reconoce es null, no una materia de omisión', () => {
    // Ésta es la prueba del primer error. Con una omisión, esto devolvería
    // 'matematicas' y nadie se enteraría.
    expect(materiaDe('robotica-3')).toBeNull();
    expect(materiaDe('qmi-1')).toBeNull();
    expect(materiaDe('')).toBeNull();
    expect(materiaDe(null)).toBeNull();
    expect(materiaDe(undefined)).toBeNull();
  });

  it('no se deja engañar por un prefijo que sólo empieza igual', () => {
    // La prueba del segundo error: comparar por principio de cadena en vez de
    // por el segmento entero es justo lo que hacía que `BIOLOGIA-1` acertara
    // por casualidad y `QUIMICA-1` no.
    expect(materiaDe('fisicaquimica-1')).toBeNull();
    expect(materiaDe('mecanicaX-1')).toBeNull();
  });

  it('da igual cómo esté escrito el identificador', () => {
    expect(materiaDe('MECANICA-120')).toBe('mecanica');
    expect(materiaDe('Quimica-1')).toBe('quimica');
  });
});

describe('rotuloMateria', () => {
  it('escribe el nombre con su acento', () => {
    expect(rotuloMateria('mecanica-120')).toBe('Mecánica');
    expect(rotuloMateria('quimica-1')).toBe('Química');
    expect(rotuloMateria('fisica-1')).toBe('Física');
    expect(rotuloMateria('biologia-1')).toBe('Biología');
    expect(rotuloMateria('matematicas-1')).toBe('Matemáticas');
  });

  it('lo que no clasifica se ve raro a propósito, para que se note', () => {
    expect(rotuloMateria('robotica-3')).toBe('ROBOTICA');
    expect(rotuloMateria('')).toBe('Sin clasificar');
    expect(rotuloMateria(null)).toBe('Sin clasificar');
  });
});

describe('el radar tiene un eje por materia', () => {
  it('los rótulos son tantos como materias, y en el mismo orden', () => {
    expect(ROTULOS).toHaveLength(MATERIAS.length);
    expect(ROTULOS).toEqual(MATERIAS.map((m) => rotuloMateria(`${m}-1`)));
  });

  it('mecánica tiene su propio eje: es el 75 % del catálogo', () => {
    expect(ROTULOS).toContain('Mecánica');
  });
});
