/**
 * EL PUENTE: QUE LO QUE HIZO EL ALUMNO LLEGUE ENTERO Y NO SE INVENTE NADA.
 *
 * Se prueba `src/lib/puente.ts`, que es la parte que decide cómo una sesión de
 * trabajo se convierte en una calificación. Es una decisión pedagógica, no de
 * interfaz, y por eso es una función pura y se prueba sin montar un iframe.
 *
 * Lo que más se vigila aquí es la distinción entre «no lo resolvió» y «esto no
 * se puede saber». Veintisiete de los 121 labs no publican su estado; si el
 * resumen aplanara los dos casos, el panel del profesor acusaría de no haber
 * hecho nada a un alumno que trabajó media hora.
 */
import { esMensajeLab, aplica, resumeDe, SESION_VACIA } from '@/lib/puente';
import type { MensajeLab, Sesion } from '@/lib/puente';

const listo = (extra: Partial<MensajeLab> = {}): MensajeLab => ({
  fuente: 'cen-lab', v: 1, tipo: 'listo', slug: 'gases-verificacion', ...extra,
});
const avance = (extra: Partial<MensajeLab> = {}): MensajeLab => ({
  fuente: 'cen-lab', v: 1, tipo: 'avance', slug: 'gases-verificacion',
  cobertura: 'completa', segundos: 60, modos: ['quimica'], resuelto: false, ...extra,
});

/** Aplica una tanda de mensajes seguidos, como llegarían de verdad. */
const correr = (...ms: MensajeLab[]): Sesion => ms.reduce(aplica, SESION_VACIA);

describe('esMensajeLab · lo que llega a window no es todo nuestro', () => {
  it('acepta el sobre del puente', () => {
    expect(esMensajeLab(listo())).toBe(true);
  });

  it('descarta lo que manda cualquier otro', () => {
    // Next en desarrollo, extensiones del navegador y anuncios mandan mensajes
    // a `window` continuamente.
    expect(esMensajeLab({ type: 'webpackHotUpdate' })).toBe(false);
    expect(esMensajeLab({ fuente: 'otra-cosa', v: 1, tipo: 'listo', slug: 'x' })).toBe(false);
    expect(esMensajeLab('hola')).toBe(false);
    expect(esMensajeLab(null)).toBe(false);
    expect(esMensajeLab(undefined)).toBe(false);
  });

  it('descarta una versión de sobre que no conoce', () => {
    expect(esMensajeLab({ ...listo(), v: 2 })).toBe(false);
  });

  it('descarta un tipo que no existe', () => {
    expect(esMensajeLab({ ...listo(), tipo: 'borrar' })).toBe(false);
  });
});

describe('aplica · acumular sin perder lo ganado', () => {
  it('un lab que no llegó a montar queda marcado', () => {
    expect(correr(listo({ sinCanvas: true })).monto).toBe(false);
    expect(correr(listo()).monto).toBe(true);
  });

  it('los modos visitados sólo crecen y no se repiten', () => {
    const s = correr(
      listo(),
      avance({ modos: ['quimica'] }),
      avance({ modos: ['quimica', 'cat'] }),
      avance({ modos: ['traza'] }),
    );
    expect(s.modos.sort()).toEqual(['cat', 'quimica', 'traza']);
  });

  /* La que de verdad importa: al salir del modo «reto» el lab deja de decir que
     está resuelto, y sin esto el único logro de la sesión se borraría justo
     antes de guardarla. */
  it('un reto resuelto sigue resuelto aunque el lab deje de decirlo', () => {
    const s = correr(
      listo(),
      avance({ resuelto: true }),
      avance({ resuelto: false, modo: 'cat' }),
    );
    expect(s.resuelto).toBe(true);
  });

  it('un acierto del cuestionario tampoco se desanda', () => {
    const s = correr(
      listo(),
      avance({ quiz: { respondida: true, acierto: true } }),
      avance({ quiz: { respondida: false, acierto: false } }),
    );
    expect(s.quizAcierto).toBe(true);
    expect(s.quizRespondido).toBe(true);
  });

  it('una sola lectura completa hace observable la sesión', () => {
    const s = correr(
      listo(),
      avance({ cobertura: 'parcial', resuelto: null }),
      avance({ cobertura: 'completa', resuelto: false }),
    );
    expect(s.cobertura).toBe('completa');
  });

  it('el reloj es el último que dijo el lab, no la suma', () => {
    expect(correr(listo(), avance({ segundos: 60 }), avance({ segundos: 300 })).segundos).toBe(300);
  });

  it('no se cree un reloj negativo', () => {
    expect(correr(listo(), avance({ segundos: 120 }), avance({ segundos: -5 })).segundos).toBe(120);
  });
});

describe('resumeDe · de una sesión a una calificación', () => {
  const completa = (extra: Partial<Sesion> = {}): Sesion => ({
    ...SESION_VACIA, slug: 'x', monto: true, cobertura: 'completa', ...extra,
  });

  it('quien lo hace todo saca 100', () => {
    const r = resumeDe(completa({
      resuelto: true, quizAcierto: true, quizRespondido: true,
      modos: ['a', 'b', 'c', 'd'], segundos: 900,
    }));
    expect(r.score).toBe(100);
    expect(r.evaluable).toBe(true);
  });

  it('quien abre el lab y no hace nada saca 0, y es una nota honesta', () => {
    expect(resumeDe(completa({ resuelto: false, modos: [], segundos: 0 })).score).toBe(0);
  });

  it('el reto pesa más que ninguna otra cosa', () => {
    const conReto = resumeDe(completa({ resuelto: true, modos: [], segundos: 0 })).score;
    const conTodoMenosReto = resumeDe(completa({
      resuelto: false, quizAcierto: true, modos: ['a', 'b', 'c', 'd'], segundos: 900,
    })).score;
    expect(conReto).toBe(40);
    expect(conReto).toBeGreaterThan(conTodoMenosReto - 40 + 1);
    expect(conTodoMenosReto).toBe(60);
  });

  it('el tiempo satura: estar tres horas no vale más que estar ocho minutos', () => {
    const a = resumeDe(completa({ segundos: 8 * 60 })).score;
    const b = resumeDe(completa({ segundos: 3 * 3600 })).score;
    expect(a).toBe(b);
  });

  it('recorrer más de cuatro vistas tampoco suma de más', () => {
    const cuatro = resumeDe(completa({ modos: ['a', 'b', 'c', 'd'] })).score;
    const ocho = resumeDe(completa({ modos: ['a', 'b', 'c', 'd', 'e', 'f', 'g', 'h'] })).score;
    expect(cuatro).toBe(ocho);
  });

  it('nunca pasa de 100 por mucho que se acumule', () => {
    const r = resumeDe(completa({
      resuelto: true, quizAcierto: true, quizRespondido: true,
      modos: ['a', 'b', 'c', 'd', 'e', 'f'], segundos: 99999,
    }));
    expect(r.score).toBeLessThanOrEqual(100);
  });

  /* El corazón del asunto: un lab que no publica su estado sólo permite medir
     participación, y el resumen tiene que decirlo en vez de fingir una nota. */
  describe('cuando el lab no publica su estado', () => {
    const parcial = (extra: Partial<Sesion> = {}): Sesion => ({
      ...SESION_VACIA, slug: 'x', monto: true, cobertura: 'parcial', resuelto: null, ...extra,
    });

    it('lo declara, para que el panel no lo enseñe como nota de logro', () => {
      expect(resumeDe(parcial()).evaluable).toBe(false);
    });

    it('no acusa de nada: trabajar de verdad no puede dar cero', () => {
      const r = resumeDe(parcial({ modos: ['a', 'b', 'c', 'd'], segundos: 900 }));
      expect(r.score).toBe(60);
    });

    it('tampoco regala la práctica: sin reto medible no se llega a 100', () => {
      const r = resumeDe(parcial({ modos: ['a', 'b', 'c', 'd'], segundos: 99999 }));
      expect(r.score).toBeLessThanOrEqual(60);
    });

    it('marca como NO medidos los conceptos que no puede ver', () => {
      const r = resumeDe(parcial());
      const reto = r.detalle.find((d) => d.concepto === 'Reto resuelto');
      expect(reto?.medido).toBe(false);
      expect(reto?.de).toBe(0);   // no cuenta contra el alumno
    });
  });

  it('el detalle explica de dónde sale cada punto', () => {
    const r = resumeDe(completa({ resuelto: true, modos: ['a', 'b'], segundos: 240 }));
    expect(r.detalle.reduce((a, d) => a + d.puntos, 0)).toBe(r.score);
    for (const d of r.detalle) expect(d.puntos).toBeLessThanOrEqual(Math.max(d.de, 0));
  });
});
