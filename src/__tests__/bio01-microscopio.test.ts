/**
 * BIO-01 · Microscopio digital con casos.
 *  1. Óptica: aumento, campo, barra de escala, resolución (0,61·λ/AN), profundidad de
 *     campo y desenfoque dependiente de la apertura numérica.
 *  2. Preparaciones: escalas reales en µm y determinismo (misma semilla → misma lámina).
 *  3. Validación de casos: la respuesta correcta aprueba, las equivocadas típicas no,
 *     y sin imagen fiable (foco, luz, aceite, objetivo) no hay dato.
 */
import * as O from '@/domain/microscopia/optica';
import * as P from '@/domain/microscopia/preparaciones';
import * as C from '@/domain/microscopia/casos';
import * as B from '@/domain/biologia';
import { useSimuladorStore } from '@/store/simuladorStore';
import type { MicroscopioStateB1, MuestraB1, ObjetivoMagB1, RespuestaCasoB1 } from '@/store/types';

const S = () => useSimuladorStore.getState();
const SEMILLAS = Array.from({ length: 60 }, (_, i) => 1 + i * 7919);

describe('óptica del microscopio', () => {
  it('aumento total = objetivo × ocular (10×)', () => {
    expect(O.MAGS.map(O.aumentoTotal)).toEqual([40, 100, 400, 1000]);
  });

  it('campo visual = número de campo (18 mm) / objetivo', () => {
    expect(O.MAGS.map(O.campoUm)).toEqual([4500, 1800, 450, 180]);
  });

  it('la barra de escala es un valor 1-2-5 que cabe en el 22 % del campo y no baja del 9 %', () => {
    expect(O.MAGS.map(O.barraEscalaUm)).toEqual([500, 200, 50, 20]);
    for (const m of O.MAGS) {
      const frac = O.barraEscalaUm(m) / O.campoUm(m);
      expect(frac).toBeLessThanOrEqual(0.22);
      expect(frac).toBeGreaterThan(0.09);
    }
  });

  it('resolución con el diafragma abierto = 0,61·λ/AN (Rayleigh)', () => {
    for (const m of O.MAGS) {
      expect(O.resolucionUm(m, true, 1)).toBeCloseTo((0.61 * O.LAMBDA_UM) / O.OBJETIVOS_OPTICOS[m].an, 10);
    }
    expect(O.resolucionUm(4, false)).toBeCloseTo(3.355, 3);
    expect(O.resolucionUm(40, false)).toBeCloseTo(0.516, 3);
    expect(O.resolucionUm(100, true)).toBeCloseTo(0.268, 3);
  });

  it('más apertura numérica resuelve más; cerrar el diafragma o quitar el aceite resuelve menos', () => {
    const d = O.MAGS.map((m) => O.resolucionUm(m, true));
    expect(d[0]).toBeGreaterThan(d[1]); expect(d[1]).toBeGreaterThan(d[2]); expect(d[2]).toBeGreaterThan(d[3]);
    expect(O.resolucionUm(40, false, 0.3)).toBeGreaterThan(O.resolucionUm(40, false, 1));
    // d = 1,22·λ/(AN_obj + AN_cond): con el condensador al 50 % de la AN del objetivo
    expect(O.resolucionUm(40, false, 0.5)).toBeCloseTo((1.22 * 0.55) / (0.65 * 1.5), 10);
    expect(O.resolucionUm(100, false)).toBeGreaterThan(O.resolucionUm(100, true));
    expect(O.anEfectiva(100, false)).toBe(0.85);
    expect(O.anEfectiva(100, true)).toBe(1.25);
  });

  it('contraste contra resolución: cerrar el diafragma sube el contraste y empeora la resolución', () => {
    expect(O.contrasteRelativo(0.2)).toBeGreaterThan(O.contrasteRelativo(0.7));
    expect(O.contrasteRelativo(0.7)).toBeGreaterThan(O.contrasteRelativo(1));
    expect(O.contrasteRelativo(1)).toBeLessThan(1);
    expect(O.resolucionUm(100, true, 0.2)).toBeGreaterThan(O.resolucionUm(100, true, 1));
  });

  it('profundidad de campo = n·λ/AN² y se desploma con el aumento', () => {
    expect(O.profundidadCampoUm(4, false)).toBeCloseTo(55, 6);
    expect(O.profundidadCampoUm(10, false)).toBeCloseTo(8.8, 6);
    expect(O.profundidadCampoUm(40, false)).toBeCloseTo(0.55 / 0.65 ** 2, 6);
    expect(O.profundidadCampoUm(100, true)).toBeCloseTo((1.515 * 0.55) / 1.25 ** 2, 6);
    // cerrar el diafragma gana profundidad de campo
    expect(O.profundidadCampoUm(40, false, 0.4)).toBeGreaterThan(O.profundidadCampoUm(40, false, 1));
  });

  it('el desenfoque es nulo dentro de la profundidad de campo y crece con la apertura numérica', () => {
    for (const m of O.MAGS) expect(O.desenfoqueUm(O.profundidadCampoUm(m, true) / 2, m, true)).toBe(0);
    // mismo error de enfoque (20 µm): círculo de confusión mayor cuanto mayor la AN
    const c = O.MAGS.map((m) => O.desenfoqueUm(40, m, true));
    expect(c[0]).toBeLessThan(c[1]); expect(c[1]).toBeLessThan(c[2]); expect(c[2]).toBeLessThan(c[3]);
    // geometría: c = 2·(Δz − PdC/2)·tan(asin(AN/n))
    const esperado = 2 * (40 - O.profundidadCampoUm(10, false) / 2) * Math.tan(Math.asin(0.25));
    expect(O.desenfoqueUm(40, 10, false)).toBeCloseTo(esperado, 10);
    expect(O.desenfoqueUm(-40, 10, false)).toBeCloseTo(esperado, 10);
  });

  it('el marco de conteo mide un tercio del campo', () => {
    expect(O.ladoMarcoUm(100)).toBe(60);
    expect(O.ladoMarcoUm(40)).toBe(150);
    expect(O.ladoMarcoUm(10)).toBe(600);
  });
});

describe('preparaciones: escala real y determinismo', () => {
  const campo = (mag: ObjetivoMagB1, x = 0, y = 0) => P.rectCentrado(x, y, O.campoUm(mag));

  it('eritrocitos de 7–8,2 µm de diámetro; la misma semilla da la misma lámina', () => {
    const a = P.eritrocitosSangre(42, campo(100));
    expect(a.length).toBeGreaterThan(250);
    for (const e of a) { expect(e.r * 2).toBeGreaterThanOrEqual(7); expect(e.r * 2).toBeLessThanOrEqual(8.2); }
    expect(P.eritrocitosSangre(42, campo(100))).toEqual(a);
    expect(P.eritrocitosSangre(43, campo(100))).not.toEqual(a);
  });

  it('una célula vista con dos ventanas distintas es la misma célula', () => {
    const grande = P.eritrocitosSangre(7, P.rectCentrado(0, 0, 400), 0);
    const chica = P.eritrocitosSangre(7, P.rectCentrado(30, -20, 60), 0);
    const clave = (e: P.Eritrocito) => `${e.i},${e.j}`;
    const mapa = new Map(grande.map((e) => [clave(e), e]));
    expect(chica.length).toBeGreaterThan(20);
    for (const e of chica) expect(mapa.get(clave(e))).toEqual(e);
  });

  it('la parasitemia realizada sigue a la de la semilla (5–14 %)', () => {
    for (const s of SEMILLAS.slice(0, 12)) {
      const p = P.parasitemiaSangre(s);
      expect(p).toBeGreaterThanOrEqual(0.05); expect(p).toBeLessThanOrEqual(0.14);
      const c = P.contarSangre(s, P.rectCentrado(0, 0, 900));
      expect(c.total).toBeGreaterThan(5000);
      expect(c.parasitados / c.total).toBeGreaterThan(p - 0.02);
      expect(c.parasitados / c.total).toBeLessThan(p + 0.02);
    }
  });

  it('los leucocitos (9–18 µm) no quedan tapados por eritrocitos', () => {
    const r = P.rectCentrado(0, 0, 1200);
    const leucos = P.leucocitosSangre(5, r), rojos = P.eritrocitosSangre(5, r);
    expect(leucos.length).toBeGreaterThan(10);
    for (const l of leucos) {
      expect(l.r * 2).toBeGreaterThanOrEqual(8.8); expect(l.r * 2).toBeLessThanOrEqual(18);
      for (const e of rojos) expect(Math.hypot(e.x - l.x, e.y - l.y)).toBeGreaterThanOrEqual(l.r + e.r * 0.75 - 1e-9);
    }
  });

  it('raíz de cebolla: células de ≈ 21 × 22 µm en el meristemo, más largas en la zona de elongación', () => {
    const mer = P.celulasRaiz(9, P.rectCentrado(0, P.RAIZ.yApice - 400, 300)).filter((c) => c.zona === 'meristemo');
    const elo = P.celulasRaiz(9, P.rectCentrado(0, P.RAIZ.yApice - 1500, 300)).filter((c) => c.zona === 'elongacion');
    const media = (v: number[]) => v.reduce((a, b) => a + b, 0) / v.length;
    expect(media(mer.map((c) => c.h))).toBeGreaterThan(18); expect(media(mer.map((c) => c.h))).toBeLessThan(26);
    expect(media(elo.map((c) => c.h))).toBeGreaterThan(media(mer.map((c) => c.h)) * 1.8);
    // nada en mitosis lejos de la punta
    expect(elo.every((c) => c.fase === 'interfase')).toBe(true);
  });

  it('el índice mitótico del meristemo sigue al de la semilla (10–22 %) y la cofia no se divide', () => {
    for (const s of SEMILLAS.slice(0, 12)) {
      const im = P.indiceMitoticoRaiz(s);
      expect(im).toBeGreaterThanOrEqual(0.1); expect(im).toBeLessThanOrEqual(0.22);
      const c = P.contarMitosis(s, { x0: -300, x1: 300, y0: P.RAIZ.yApice - 760, y1: P.RAIZ.yApice - 120 });
      expect(c.total).toBeGreaterThan(600);
      expect(c.enMitosis / c.total).toBeGreaterThan(im - 0.04);
      expect(c.enMitosis / c.total).toBeLessThan(im + 0.04);
      // la profase es la fase más larga: la más frecuente entre las que se dividen
      expect(c.porFase.profase).toBeGreaterThan(c.porFase.anafase);
      const todas = P.celulasRaiz(s, P.rectCentrado(0, P.RAIZ.yApice, 900));
      expect(todas.filter((x) => x.zona === 'cofia').every((x) => x.fase === 'interfase')).toBe(true);
    }
  });

  it('epidermis de cebolla: el largo medio de las células es el de la semilla (190–310 µm)', () => {
    for (const s of SEMILLAS.slice(0, 12)) {
      const L = P.largoMedioCebolla(s);
      expect(L).toBeGreaterThanOrEqual(190); expect(L).toBeLessThanOrEqual(310);
      const cel = P.celulasCebolla(s, P.rectCentrado(0, 0, 4000), 0);
      const medio = cel.reduce((a, c) => a + (c.x1 - c.x0), 0) / cel.length;
      expect(Math.abs(medio - L) / L).toBeLessThan(0.03);
      // ninguna célula se sale del margen con el que se juzga la medida
      for (const c of cel) expect(Math.abs(c.x1 - c.x0 - L) / L).toBeLessThan(0.31);
    }
  });

  it('estomas: nunca dos contiguos, y densidad de 8 a 40 por mm²', () => {
    for (const s of SEMILLAS.slice(0, 12)) {
      const sitios = P.sitiosEpidermis(s, P.rectCentrado(0, 0, 3000));
      const est = new Set(sitios.filter((x) => x.estoma).map((x) => `${x.i},${x.j}`));
      for (const x of sitios) if (x.estoma) {
        for (const [di, dj] of [[1, 0], [0, 1], [1, 1], [-1, 1]]) expect(est.has(`${x.i + di},${x.j + dj}`)).toBe(false);
      }
      const dens = P.contarEstomas(s, P.rectCentrado(0, 0, 3000)) / 9;
      expect(dens).toBeGreaterThan(8); expect(dens).toBeLessThan(40);
    }
  });

  it('Gram: siempre una bacteria positiva y otra negativa, y domina la que dice la semilla', () => {
    for (const s of SEMILLAS) {
      const { dominante, secundaria } = P.mezclaGram(s);
      expect(P.GRAM_POSITIVAS.includes(dominante)).not.toBe(P.GRAM_POSITIVAS.includes(secundaria));
      const col = P.coloniasGram(s, P.rectCentrado(0, 0, 1200), 0);
      const nDom = col.filter((c) => c.tipo === dominante).length;
      expect(nDom / col.length).toBeGreaterThan(0.68);
      expect(col.some((c) => c.tipo === secundaria)).toBe(true);
    }
    // las cinco opciones salen en algún intento
    expect(new Set(Array.from({ length: 300 }, (_, i) => P.mezclaGram(i + 1).dominante)).size).toBe(5);
  });

  it('paramecio de 175–280 µm (Paramecium caudatum)', () => {
    for (const s of SEMILLAS) { const L = P.largoParamecio(s); expect(L).toBeGreaterThanOrEqual(175); expect(L).toBeLessThanOrEqual(280); }
  });
});

describe('validación de casos', () => {
  /** Estado con la óptica en regla para responder `caso` en (x, y). */
  function listo(caso: MuestraB1, semilla: number, x = 0, y = 0): MicroscopioStateB1 {
    const c = C.CASOS_B1[caso];
    const mag = c.objetivoExacto ?? (c.objetivoMin < 10 ? 10 : c.objetivoMin);
    const foco = C.focoCasoB1(50.5, caso);
    return {
      ...S().microscopio, semilla, muestra: caso, objetivoMag: mag, focoIdealZ: 50.5, enfoqueZ: foco,
      enfoqueMacro: Math.floor(foco), enfoqueMicro: (foco - Math.floor(foco)) * 10,
      iluminacion: mag === 100 ? 100 : 75, apertura: 0.8, aceiteInmersionAplicado: mag === 100, posicionX: x, posicionY: y, respuestas: {},
    };
  }
  const juzgar = (caso: MuestraB1, m: MicroscopioStateB1, valores: number[], cambios: Partial<RespuestaCasoB1> = {}) =>
    C.evaluarRespuestaB1(caso, m.semilla, m.focoIdealZ, { ...C.tomarRespuestaB1(m, valores), ...cambios });
  /** Posición de la platina donde cada caso de conteo tiene material suficiente. */
  const SITIO: Partial<Record<MuestraB1, [number, number]>> = { mitosis: [0, P.RAIZ.yApice - 350] };

  it.each(C.ORDEN_CASOS_B1)('%s: la verdad aprueba en todas las semillas y la respuesta en blanco no', (caso) => {
    for (const s of SEMILLAS) {
      const [x, y] = SITIO[caso] ?? [0, 0];
      const m = listo(caso, s, x, y);
      const v = C.verdadCasoB1(caso, s, { x, y, objetivoMag: m.objetivoMag });
      expect(v).toHaveLength(C.CASOS_B1[caso].campos.length);
      if (caso === 'estomas' && v[0] < 2) continue; // campo sin estomas: el juez pide mover la platina
      expect(juzgar(caso, m, v)).toEqual({ ok: true });
      expect(C.evaluarRespuestaB1(caso, s, m.focoIdealZ, undefined).ok).toBe(false);
      expect(juzgar(caso, m, v.map(() => NaN)).ok).toBe(false);
      expect(juzgar(caso, m, []).ok).toBe(false);
    }
  });

  it('medidas: ±12 % en el paramecio y ±20 % en la célula de cebolla; fuera de eso, no', () => {
    for (const s of SEMILLAS) {
      const mp = listo('estanque', s), L = P.largoParamecio(s);
      expect(juzgar('estanque', mp, [L * 1.1]).ok).toBe(true);
      expect(juzgar('estanque', mp, [L * 0.9]).ok).toBe(true);
      expect(juzgar('estanque', mp, [L * 1.15]).ok).toBe(false);
      expect(juzgar('estanque', mp, [L * 0.8]).ok).toBe(false);
      expect(juzgar('estanque', mp, [55]).ok).toBe(false); // el tamaño de una euglena
      const mc = listo('cebolla', s), Lc = P.largoMedioCebolla(s);
      expect(juzgar('cebolla', mc, [Lc * 1.18]).ok).toBe(true);
      expect(juzgar('cebolla', mc, [Lc * 0.75]).ok).toBe(false);
      expect(juzgar('cebolla', mc, [P.CEBOLLA.alto]).ok).toBe(false); // midió el ancho
    }
  });

  it('Gram: sólo aprueba la bacteria dominante', () => {
    for (const s of SEMILLAS) {
      const m = listo('gram', s);
      const bien = P.ORDEN_GRAM.indexOf(P.mezclaGram(s).dominante);
      for (let k = 0; k < P.ORDEN_GRAM.length; k++) expect(juzgar('gram', m, [k]).ok).toBe(k === bien);
      // confundir la dominante con la acompañante es el error típico
      expect(juzgar('gram', m, [P.ORDEN_GRAM.indexOf(P.mezclaGram(s).secundaria)]).ok).toBe(false);
    }
  });

  it('sangre: el conteo se juzga contra lo que hay DENTRO del marco en esa posición de la platina', () => {
    for (const s of SEMILLAS) {
      const m = listo('sangre', s, 120, -80);
      const [par, tot] = C.verdadCasoB1('sangre', s, { x: 120, y: -80, objetivoMag: 100 });
      expect(tot).toBeGreaterThan(25); expect(tot).toBeLessThan(75); // ≈ 50 eritrocitos en 60 × 60 µm
      expect(juzgar('sangre', m, [par, tot]).ok).toBe(true);
      expect(juzgar('sangre', m, [par + 1, tot + 3]).ok).toBe(true);   // dudas de borde
      expect(juzgar('sangre', m, [par + 3, tot]).ok).toBe(false);
      expect(juzgar('sangre', m, [0, tot]).ok).toBe(par <= 1);
      expect(juzgar('sangre', m, [par, tot * 2]).ok).toBe(false);
      expect(juzgar('sangre', m, [par, Math.round(tot / 2)]).ok).toBe(false);
      // contar todo el campo en lugar del marco no vale
      const campo = P.contarSangre(s, P.rectCentrado(120, -80, 150));
      expect(juzgar('sangre', m, [campo.parasitados, campo.total]).ok).toBe(false);
    }
  });

  it('mitosis: exige estar en el meristemo y contar bien las células en división', () => {
    for (const s of SEMILLAS) {
      const [x, y] = SITIO.mitosis!;
      const m = listo('mitosis', s, x, y);
      const [mit, tot] = C.verdadCasoB1('mitosis', s, { x, y, objetivoMag: 40 });
      expect(tot).toBeGreaterThan(30);
      if (mit < 1) continue;
      expect(juzgar('mitosis', m, [mit, tot]).ok).toBe(true);
      expect(juzgar('mitosis', m, [mit + 3, tot]).ok).toBe(mit >= 12);
      expect(juzgar('mitosis', m, [mit, tot + 12]).ok).toBe(false);
      // en la zona de elongación no hay mitosis: el juez manda volver a la punta
      const lejos = listo('mitosis', s, 0, P.RAIZ.yApice - 1700);
      const r = juzgar('mitosis', lejos, [0, 10]);
      expect(r.ok).toBe(false);
      expect(r.mensaje).toMatch(/meristem/);
    }
  });

  it('estomas: conteo exacto (±1) y densidad = estomas ÷ 0,36 mm²', () => {
    let juzgados = 0;
    for (const s of SEMILLAS) {
      const m = listo('estomas', s);
      const [n, dens] = C.verdadCasoB1('estomas', s, { x: 0, y: 0, objetivoMag: 10 });
      expect(dens).toBeCloseTo(n / 0.36, 8);
      if (n < 2) continue;
      juzgados++;
      expect(juzgar('estomas', m, [n, n / 0.36]).ok).toBe(true);
      expect(juzgar('estomas', m, [n + 2, (n + 2) / 0.36]).ok).toBe(false);
      expect(juzgar('estomas', m, [n, n]).ok).toBe(false);          // olvidó dividir entre el área
      expect(juzgar('estomas', m, [n, n / 0.6]).ok).toBe(false);     // usó el lado en vez del área
    }
    expect(juzgados).toBeGreaterThan(50);
  });

  it('sin imagen fiable no hay dato: foco, luz, aceite y objetivo', () => {
    const s = 77;
    const m = listo('sangre', s);
    const v = C.verdadCasoB1('sangre', s, { x: 0, y: 0, objetivoMag: 100 });
    expect(juzgar('sangre', m, v).ok).toBe(true);
    expect(juzgar('sangre', m, v, { aceite: false }).mensaje).toMatch(/aceite/);
    expect(juzgar('sangre', m, v, { iluminacion: 50 }).mensaje).toMatch(/oscura/);
    expect(juzgar('sangre', m, v, { apertura: 0.2 }).mensaje).toMatch(/oscura/);
    expect(juzgar('sangre', m, v, { enfoqueZ: m.enfoqueZ + 0.2 }).mensaje).toMatch(/foco/); // 2 µm a 100×
    expect(juzgar('sangre', m, v, { enfoqueZ: m.enfoqueZ + 0.03 }).ok).toBe(true);          // 0,3 µm: dentro
    const a40 = C.verdadCasoB1('sangre', s, { x: 0, y: 0, objetivoMag: 40 });
    expect(juzgar('sangre', { ...m, objetivoMag: 40 }, a40, { iluminacion: 75 }).mensaje).toMatch(/100×/);
    // a 4× el mismo error de 2 µm sigue en foco (55 µm de profundidad de campo)
    const mc = listo('cebolla', s);
    expect(juzgar('cebolla', { ...mc, objetivoMag: 4 }, [P.largoMedioCebolla(s)], { enfoqueZ: mc.enfoqueZ + 0.2, iluminacion: 60 }).ok).toBe(true);
    // deslumbrada
    expect(juzgar('cebolla', { ...mc, objetivoMag: 4 }, [P.largoMedioCebolla(s)], { iluminacion: 100, apertura: 1 }).mensaje).toMatch(/deslumbrada/);
    // el paramecio no se mide a 4×
    const mp = listo('estanque', s);
    expect(juzgar('estanque', { ...mp, objetivoMag: 4 }, [P.largoParamecio(s)], { iluminacion: 60 }).mensaje).toMatch(/aumento/);
  });

  it('cada preparación tiene su plano focal: al cambiar de caso hay que reenfocar a gran aumento', () => {
    const m = listo('estanque', 5);
    expect(B.enFocoB1({ ...m, objetivoMag: 40 })).toBe(true);
    expect(B.enFocoB1({ ...m, muestra: 'sangre', objetivoMag: 100, aceiteInmersionAplicado: true })).toBe(false);
    expect(B.enFocoB1({ ...m, muestra: 'sangre', objetivoMag: 4 })).toBe(true); // a 4× sigue en foco
    // y siempre se alcanza con el micrométrico (0–10 µm) desde su posición media
    for (const c of C.ORDEN_CASOS_B1) expect(Math.abs(C.CASOS_B1[c].desfaseFoco) * O.UM_POR_UNIDAD_ENFOQUE).toBeLessThan(4.5);
  });

  it('la práctica aprueba con tres casos bien resueltos, ni uno menos', () => {
    const s = 31337;
    let m: MicroscopioStateB1 = { ...listo('estanque', s), respuestas: {} };
    expect(B.evaluarB1(m).ok).toBe(false);
    const responder = (caso: MuestraB1, valores?: number[]) => {
      const [x, y] = SITIO[caso] ?? [0, 0];
      const e = listo(caso, s, x, y);
      const v = valores ?? C.verdadCasoB1(caso, s, { x, y, objetivoMag: e.objetivoMag });
      m = { ...m, respuestas: { ...m.respuestas, [caso]: C.tomarRespuestaB1(e, v) } };
    };
    responder('estanque'); responder('gram');
    expect(C.casosResueltosB1(m)).toEqual(['estanque', 'gram']);
    expect(B.evaluarB1(m).mensaje).toMatch(/2 de 3/);
    responder('cebolla', [20]); // mal resuelto: no cuenta, y el juez dice cuál
    expect(C.estadoCasoB1(m, 'cebolla')).toBe('incorrecto');
    expect(B.evaluarB1(m).mensaje).toMatch(/Cebolla/);
    responder('cebolla');
    expect(B.evaluarB1(m)).toEqual({ ok: true });
    // mover la platina o desenfocar DESPUÉS no invalida lo ya respondido
    expect(B.evaluarB1({ ...m, posicionX: 900, enfoqueZ: 0, iluminacion: 0 })).toEqual({ ok: true });
    // otra semilla es otra preparación: las mismas respuestas ya no valen todas
    expect(B.evaluarB1({ ...m, semilla: s + 1 }).ok).toBe(false);
  });

  it('los mensajes de fallo no revelan el valor correcto', () => {
    for (const s of SEMILLAS.slice(0, 20)) {
      for (const caso of C.ORDEN_CASOS_B1) {
        const [x, y] = SITIO[caso] ?? [0, 0];
        const m = listo(caso, s, x, y);
        const v = C.verdadCasoB1(caso, s, { x, y, objetivoMag: m.objetivoMag });
        const r = juzgar(caso, m, v.map((n) => n * 3 + 7));
        expect(r.ok).toBe(false);
        // en el mensaje no queda ninguna cifra, salvo las de procedimiento (el objetivo: «100×»)
        expect((r.mensaje ?? '').replace(/\d+×/g, '').replace(/mm²/g, '')).not.toMatch(/\d/);
      }
    }
  });
});
