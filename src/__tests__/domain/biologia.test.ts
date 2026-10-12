/**
 * Dominio de Biología: ciencia de cada modelo y barrido de semillas.
 * Cada lab: (1) el intento recién abierto NO aprueba; (2) para 500 semillas
 * existe una posición de los controles que SÍ aprueba; (3) las respuestas
 * equivocadas típicas no aprueban.
 */
import * as B from '@/domain/biologia';
import { useSimuladorStore } from '@/store/simuladorStore';
import type { ColorLuzB4, GenotipoB6, PolillaB6, ProporcionB5 } from '@/store/types';

const S = () => useSimuladorStore.getState();
const SEMILLAS = 500;
const SEMILLAS_B6 = 200; // cada semilla juega 6 generaciones de caza: más lento

// ── B1 Microscopio ───────────────────────────────────────────────────────────
describe('B1 microscopio', () => {
  it('la nitidez depende de |enfoqueZ − focoIdealZ| y del objetivo', () => {
    const base = { focoIdealZ: 47.3, objetivoMag: 40 as const, aceiteInmersionAplicado: false };
    expect(B.desenfoqueB1({ ...base, enfoqueZ: 47.3 })).toBe(0);
    expect(B.desenfoqueB1({ ...base, enfoqueZ: 50.5 })).toBeGreaterThan(B.desenfoqueB1({ ...base, enfoqueZ: 48 }));
    // El mismo error de enfoque desenfoca más a 100x que a 4x (menor profundidad de campo).
    expect(B.desenfoqueB1({ ...base, objetivoMag: 100, aceiteInmersionAplicado: true, enfoqueZ: 49 }))
      .toBeGreaterThan(B.desenfoqueB1({ ...base, objetivoMag: 4, enfoqueZ: 49 }));
    // Sin aceite, 100x nunca queda nítido.
    expect(B.desenfoqueB1({ ...base, objetivoMag: 100, enfoqueZ: 47.3 })).toBeGreaterThan(0);
  });

  it('barrido: el intento nuevo no aprueba y siempre existe una configuración que sí', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-1');
      expect(S().validarLab('biologia-1').ok).toBe(false);
      const m = S().microscopio;
      const macro = Math.floor(m.focoIdealZ);
      const micro = Math.round((m.focoIdealZ - macro) * 100) / 10;
      // Objetivo insuficiente o preparación equivocada: no aprueba.
      S().setMicroscopio({ muestra: m.muestraObjetivo, objetivoMag: 4, iluminacion: 60, enfoqueMacro: macro, enfoqueMicro: micro });
      if (m.magMin > 4) expect(S().validarLab('biologia-1').ok).toBe(false);
      S().setMicroscopio({ objetivoMag: 100, aceiteInmersionAplicado: true, iluminacion: 100 });
      expect(S().validarLab('biologia-1')).toEqual({ ok: true });
      S().setMicroscopio({ muestra: m.muestraObjetivo === 'animal' ? 'bacteria' : 'animal' });
      expect(S().validarLab('biologia-1').ok).toBe(false);
    }
  });

  it('a 100x hay que subir la lámpara (transmisión menor) y poner aceite', () => {
    const base = { ...S().microscopio, muestra: 'bacteria' as const, muestraObjetivo: 'bacteria' as const, magMin: 100 as const, objetivoMag: 100 as const, focoIdealZ: 50, enfoqueZ: 50 };
    expect(B.evaluarB1({ ...base, iluminacion: 60, aceiteInmersionAplicado: true }).ok).toBe(false); // 36 % efectivo
    expect(B.evaluarB1({ ...base, iluminacion: 100, aceiteInmersionAplicado: false }).ok).toBe(false);
    expect(B.evaluarB1({ ...base, iluminacion: 100, aceiteInmersionAplicado: true }).ok).toBe(true);
  });
});

// ── B2 Ósmosis ───────────────────────────────────────────────────────────────
describe('B2 ósmosis (Boyle–van ’t Hoff)', () => {
  it('el volumen de equilibrio es V0·Osm_int/Osm_ext y la pared limita a la célula vegetal', () => {
    expect(B.volumenEquilibrioB2('animal', 0.3, 0.6)).toBeCloseTo(50);
    expect(B.volumenEquilibrioB2('animal', 0.3, 0.15)).toBeCloseTo(200);
    expect(B.volumenEquilibrioB2('vegetal', 0.3, 0.15)).toBe(B.VMAX_VEGETAL_B2);
  });

  it('la integración converge al volumen de equilibrio (sin quedarse en un tope)', () => {
    let v = 100;
    for (let i = 0; i < 4000; i++) v = B.pasoVolumenB2(v, 'animal', 0.3, 0.4, 25, 0.01);
    expect(v).toBeCloseTo(75, 1);
    v = 100;
    for (let i = 0; i < 4000; i++) v = B.pasoVolumenB2(v, 'animal', 0.3, 0.3, 25, 0.01);
    expect(v).toBeCloseTo(100, 5);
  });

  it('barrido: medio inicial hipertónico; existe una mezcla isotónica con los pasos de los controles', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-2');
      expect(S().validarLab('biologia-2').ok).toBe(false);
      const osm = B.osmolaridadCitoplasmaB2(S().transporte.concInt);
      // Solo NaCl con paso de 0.005 M (0.01 Osm): el más cercano basta.
      const nacl = Math.round((osm / 2) / 0.005) * 0.005;
      S().setTransporte({ concExt: nacl, glucosaExt: 0 });
      expect(S().validarLab('biologia-2').ok).toBe(true);
      // Con hemólisis no aprueba aunque el medio sea isotónico.
      S().setTransporte({ lisada: true });
      expect(S().validarLab('biologia-2').ok).toBe(false);
    }
  });
});

// ── B3 Síntesis de proteínas ─────────────────────────────────────────────────
describe('B3 síntesis de proteínas', () => {
  it('transcripción y traducción con el código genético estándar', () => {
    expect(B.transcribir('TACCAGGGTATT')).toBe('AUGGUCCCAUAA');
    expect(B.traducir('AUGGUCCCAUAA')).toEqual(['Met', 'Val', 'Pro']);
    expect(Object.keys(B.CODIGO_GENETICO)).toHaveLength(64);
    expect(B.CODIGO_GENETICO.UGA.name).toBe('STOP');
    expect(B.anticodonB3('AUG')).toBe('UAC');
  });

  it('barrido: solo aprueba al llegar al codón de paro con la cadena correcta', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-3');
      expect(S().validarLab('biologia-3').ok).toBe(false);
      const adn = S().sintesis.adnPlantilla;
      S().addNucleotido('T'); // la timina no existe en el ARN: error
      for (const b of B.transcribir(adn)) S().addNucleotido(b);
      expect(S().sintesis.fase).toBe('traduccion');
      const traducirUno = () => {
        const s = S().sintesis;
        const codon = s.arnMensajero.slice(s.currentIndex, s.currentIndex + 3);
        S().advanceRibosoma(B.CODIGO_GENETICO[codon].name === 'STOP' ? B.LIBERACION_B3 : B.anticodonB3(codon));
      };
      traducirUno(); // solo Met: aún no aprueba
      expect(S().validarLab('biologia-3').ok).toBe(false);
      S().advanceRibosoma('AAA'); // ARNt equivocado: error y el ribosoma no avanza
      for (let k = 0; k < 10 && !S().sintesis.terminada; k++) traducirUno();
      expect(S().sintesis.terminada).toBe(true);
      expect(S().validarLab('biologia-3').ok).toBe(true);
    }
  });

  it('demasiados errores de apareamiento no aprueban', () => {
    S().entrarLab('biologia-3');
    for (let k = 0; k <= B.MAX_ERRORES_B3; k++) S().addNucleotido('T');
    for (const b of B.transcribir(S().sintesis.adnPlantilla)) S().addNucleotido(b);
    for (let k = 0; k < 10 && !S().sintesis.terminada; k++) {
      const s = S().sintesis;
      const codon = s.arnMensajero.slice(s.currentIndex, s.currentIndex + 3);
      S().advanceRibosoma(B.CODIGO_GENETICO[codon].name === 'STOP' ? B.LIBERACION_B3 : B.anticodonB3(codon));
    }
    expect(S().sintesis.terminada).toBe(true);
    expect(S().validarLab('biologia-3').ok).toBe(false);
  });
});

// ── B4 Fotosíntesis ──────────────────────────────────────────────────────────
describe('B4 fotosíntesis', () => {
  it('la tasa satura con la intensidad y el rojo rinde más por fotón que el verde', () => {
    const cerca = B.tasaNetaB4('rojo', 10), medio = B.tasaNetaB4('rojo', 20), lejos = B.tasaNetaB4('rojo', 40);
    expect(cerca).toBeGreaterThan(medio);
    // Saturación: cuadruplicar la luz NO cuadruplica la tasa.
    expect((cerca + B.RESPIRACION_B4) / (medio + B.RESPIRACION_B4)).toBeLessThan(2);
    expect(B.tasaNetaB4('verde', 20)).toBeGreaterThan(0); // el verde sí impulsa la fotosíntesis
    expect(B.tasaNetaB4('rojo', 20)).toBeGreaterThan(B.tasaNetaB4('azul', 20));
    expect(B.o2EnsayoB4('verde', 60)).toBeGreaterThanOrEqual(0);
  });

  it('barrido: solo la mejor luz a la distancia mínima alcanza la meta', () => {
    const colores: ColorLuzB4[] = ['blanco', 'azul', 'verde', 'amarillo'];
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-4');
      expect(S().validarLab('biologia-4').ok).toBe(false);
      const { dMin } = S().fotosintesis;
      for (const c of colores) {
        S().setFotosintesis({ color: c, distancia: dMin });
        S().registrarEnsayoB4();
      }
      S().setFotosintesis({ color: 'rojo', distancia: dMin + 8 });
      S().registrarEnsayoB4();
      expect(S().validarLab('biologia-4').ok).toBe(false);
      S().setFotosintesis({ color: 'rojo', distancia: dMin });
      S().registrarEnsayoB4();
      expect(S().validarLab('biologia-4').ok).toBe(true);
    }
  });
});

// ── B5 Mendel ────────────────────────────────────────────────────────────────
describe('B5 herencia mendeliana', () => {
  it('proporciones teóricas clásicas', () => {
    const enDieciseisavos = (p1: string, p2: string) => B.proporcionEsperadaB5(p1, p2).map((x) => x * 16);
    expect(enDieciseisavos('AaBb', 'AaBb')).toEqual([9, 3, 3, 1]);
    expect(enDieciseisavos('AaBb', 'aabb')).toEqual([4, 4, 4, 4]);
    expect(enDieciseisavos('AaBb', 'Aabb')).toEqual([6, 6, 2, 2]);
    expect(B.prediccionCorrectaB5([9, 3, 3, 1], 'AaBb', 'AaBb')).toBe(true);
    expect(B.prediccionCorrectaB5([1, 1, 1, 1], 'AaBb', 'AaBb')).toBe(false);
    expect(B.prediccionCorrectaB5([3, 3, 1, 1], 'AaBb', 'Aabb')).toBe(true);
  });

  it('χ² pequeño cuando lo observado coincide con lo predicho', () => {
    const r = B.chiCuadradaB5([90, 30, 30, 10], [9, 3, 3, 1])!;
    expect(r.chi2).toBeCloseTo(0);
    expect(r.gl).toBe(3);
    expect(r.critico).toBe(7.815);
    expect(B.chiCuadradaB5([25, 25, 25, 25], [9, 3, 3, 1])!.chi2).toBeGreaterThan(7.815);
  });

  it('barrido: hay que predecir bien y cruzar con N ≥ 100', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-5');
      expect(S().validarLab('biologia-5').ok).toBe(false);
      const { padre1, padre2 } = S().genetica;
      const esp = B.proporcionEsperadaB5(padre1, padre2).map((x) => x * 16) as ProporcionB5;
      S().setGenetica({ prediccion: [1, 1, 1, 1], tamanioMuestra: 500 });
      S().generarF1();
      if (!B.prediccionCorrectaB5([1, 1, 1, 1], padre1, padre2)) expect(S().validarLab('biologia-5').ok).toBe(false);
      S().setGenetica({ prediccion: esp, tamanioMuestra: 10 });
      S().generarF1();
      expect(S().validarLab('biologia-5').ok).toBe(false);
      S().setGenetica({ tamanioMuestra: 100 });
      S().generarF1();
      expect(S().validarLab('biologia-5').ok).toBe(true);
    }
  });
});

// ── B6 Selección natural ─────────────────────────────────────────────────────
describe('B6 selección natural', () => {
  it('la reproducción conserva la frecuencia alélica de las supervivientes', () => {
    const rng = B.rngConSemilla(7);
    const pob = B.crearPoblacionB6(0.3, 30, rng);
    expect(B.frecuenciaAleloB6(pob.map((b) => b.genotipo), 'C')).toBeCloseTo(18 / 60);
    const hijos = B.reproducirB6(pob.map((b, i) => ({ ...b, cazada: i < 10 })), 30, rng);
    const vivas = pob.slice(10).map((b) => b.genotipo);
    expect(B.frecuenciaAleloB6(hijos.map((b) => b.genotipo), 'C')).toBeCloseTo(Math.round(60 * B.frecuenciaAleloB6(vivas, 'C')) / 60);
  });

  it('q estimada sale del fenotipo recesivo: q = √f(cc)', () => {
    const bugs: PolillaB6[] = (['cc', 'cc', 'cc', 'cc', 'Cc', 'CC', 'Cc', 'Cc', 'CC', 'Cc', 'CC', 'Cc', 'Cc', 'CC', 'Cc', 'Cc'] as GenotipoB6[])
      .map((g, i) => ({ id: i, genotipo: g, tipo: B.fenotipoB6(g), x: 0, y: 0, angle: 0, cazada: false }));
    expect(B.qEstimadaB6(bugs)).toBeCloseTo(0.5);
  });

  /** Juega como un ave: caza primero las polillas que contrastan con la corteza (o las camufladas, si `alReves`). */
  const jugar = (alReves: boolean) => {
    for (let g = 0; g < B.GENERACIONES_MAX_B6; g++) {
      const e = S().evolucion;
      const visible = e.ambiente === 'industrial' ? 'clara' : 'oscura';
      const orden = [...e.bugs].sort((a, b) => Number((b.tipo === visible) !== alReves) - Number((a.tipo === visible) !== alReves));
      for (const bug of orden.slice(0, e.cuota)) S().cazarPolilla(bug.id);
      S().finalizarGeneracion();
      if (!alReves && S().evolucion.historial.length >= B.GENERACIONES_MIN_B6 && S().validarLab('biologia-6').ok) return true;
    }
    return S().validarLab('biologia-6').ok;
  };

  it('barrido: cazar las conspicuas sube el alelo favorecido; cazar las camufladas no aprueba', () => {
    for (let i = 0; i < SEMILLAS_B6; i++) {
      S().entrarLab('biologia-6');
      expect(S().validarLab('biologia-6').ok).toBe(false);
      expect(jugar(false)).toBe(true);
      S().entrarLab('biologia-6');
      expect(jugar(true)).toBe(false);
    }
  });

  it('cazar al azar casi nunca aprueba (la deriva no es selección)', () => {
    let aprobadas = 0;
    for (let i = 0; i < 300; i++) {
      S().entrarLab('biologia-6');
      for (let g = 0; g < B.GENERACIONES_MAX_B6; g++) {
        const e = S().evolucion;
        const orden = [...e.bugs].sort(() => Math.random() - 0.5);
        for (const bug of orden.slice(0, e.cuota)) S().cazarPolilla(bug.id);
        S().finalizarGeneracion();
      }
      if (S().validarLab('biologia-6').ok) aprobadas++;
    }
    expect(aprobadas / 300).toBeLessThan(0.1);
  });

  it('no se puede pasar de generación sin cumplir la cuota de caza', () => {
    S().entrarLab('biologia-6');
    S().finalizarGeneracion();
    expect(S().evolucion.historial).toHaveLength(0);
  });
});

// ── B7 Arco reflejo ──────────────────────────────────────────────────────────
describe('B7 arco reflejo', () => {
  it('latencia = distancia / velocidad + retardos sináptico y de placa', () => {
    expect(B.velocidadConduccionB7(100)).toBeCloseTo(65);
    expect(B.latenciaB7(1.0, 100)).toBeCloseTo(1000 / 65 + 1.5, 1);
    expect(B.latenciaB7(1.0, 40)).toBeGreaterThan(B.latenciaB7(1.0, 100));
    expect(B.diagnosticoRealB7(100)).toBe('normal');
    expect(B.diagnosticoRealB7(50)).toBe('desmielinizante');
  });

  it('barrido: umbral todo-o-nada + velocidad calculada + diagnóstico', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-7');
      expect(S().validarLab('biologia-7').ok).toBe(false);
      const { umbral, distancia } = S().sistemaNervioso;
      S().setB7State({ fuerzaGolpe: 100 });
      const golpe = S().registrarGolpeB7();
      expect(golpe.respuesta).toBe(true);
      // Velocidad bien calculada con la latencia MEDIDA (redondeada a 0.1 ms).
      const v = distancia / ((golpe.latencia! - B.RETARDO_SINAPSIS_B7 - B.RETARDO_PLACA_B7) / 1000);
      const dx = v >= B.VEL_NORMAL_MIN_B7 ? 'normal' : 'desmielinizante';
      S().setB7State({ velocidadEstimada: Math.round(v), diagnostico: dx });
      expect(S().validarLab('biologia-7').ok).toBe(false); // falta el golpe subumbral
      S().setB7State({ fuerzaGolpe: umbral - 1 });
      expect(S().registrarGolpeB7().respuesta).toBe(false);
      expect(S().validarLab('biologia-7').ok).toBe(true);
      // Sin restar los retardos, la velocidad no cuadra.
      S().setB7State({ velocidadEstimada: distancia / (golpe.latencia! / 1000) * 0.8 });
      expect(S().validarLab('biologia-7').ok).toBe(false);
    }
  });
});

// ── B8 ECG ───────────────────────────────────────────────────────────────────
describe('B8 electrocardiograma', () => {
  it('trazo PQRST: R positiva, línea base en PR y ST, T dentro del ciclo', () => {
    const rr = 1000;
    const c = B.tiemposCicloB8(rr);
    expect(B.ecgMvB8(c.pr + 0.39 * (c.qrsFin - c.pr), rr)).toBeCloseTo(1.2);
    expect(B.ecgMvB8(130, rr)).toBe(0);
    expect(B.faseCicloB8(130, rr)).toMatch(/PR/);
    expect(B.faseCicloB8(c.qrsFin + 10, rr)).toMatch(/ST/);
    expect(c.tFin).toBeLessThan(rr);
    expect(B.tiemposCicloB8(300).tFin).toBeLessThan(300);
  });

  it('los ventrículos se CONTRAEN (no se inflan) tras el QRS y se relajan en diástole', () => {
    const rr = 800, c = B.tiemposCicloB8(rr);
    expect(B.contraccionB8((c.qrsFin + c.tFin) / 2, rr).ventriculos).toBeGreaterThan(0.5);
    expect(B.contraccionB8(rr - 10, rr).ventriculos).toBe(0);
    expect(B.contraccionB8(c.p, rr).auriculas).toBeGreaterThan(0);
  });

  it('barrido: diagnóstico + fármaco correcto + lectura de la FC', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-8');
      expect(S().validarLab('biologia-8').ok).toBe(false);
      const { tipo } = S().cardio;
      expect(Number.isInteger(S().cardio.ritmoBPM)).toBe(true);
      S().setCardio({ diagnostico: tipo });
      const farmaco = tipo === 'bradicardia' ? 'atropina' : 'metoprolol';
      for (let k = 0; k < 8 && B.clasificarRitmoB8(S().cardio.ritmoBPM) !== 'normal'; k++) S().administrarFarmacoB8(farmaco);
      expect(B.clasificarRitmoB8(S().cardio.ritmoBPM)).toBe('normal');
      expect(S().validarLab('biologia-8').ok).toBe(false); // falta la lectura
      S().setCardio({ lecturaFC: S().cardio.ritmoBPM + 3 });
      expect(S().validarLab('biologia-8').ok).toBe(true);
      S().setCardio({ diagnostico: tipo === 'bradicardia' ? 'taquicardia' : 'bradicardia' });
      expect(S().validarLab('biologia-8').ok).toBe(false);
    }
  });
});

// ── B9 Digestión ─────────────────────────────────────────────────────────────
describe('B9 digestión', () => {
  it('especificidad ≠ desnaturalización ≠ pH subóptimo', () => {
    expect(B.incubarB9('almidon', 'pepsina', 2, false).resultado).toBe('sin_reaccion');
    expect(B.incubarB9('proteina', 'pepsina', 8, false).resultado).toBe('desnaturalizada');
    expect(B.incubarB9('proteina', 'tripsina', 2, false).resultado).toBe('parcial'); // inactiva, no destruida
    expect(B.incubarB9('proteina', 'pepsina', 2, false).resultado).toBe('completa');
    expect(B.incubarB9('lipido', 'lipasa', 8, false).resultado).toBe('parcial'); // sin bilis
    expect(B.incubarB9('lipido', 'lipasa', 8, true).resultado).toBe('completa');
  });

  it('barrido: digestión completa + órgano de la enzima + absorción en el intestino delgado', () => {
    for (let i = 0; i < SEMILLAS; i++) {
      S().entrarLab('biologia-9');
      expect(S().validarLab('biologia-9').ok).toBe(false);
      const macro = S().digestion.macronutriente;
      const [enzima] = (Object.entries(B.ENZIMAS_B9).find(([, e]) => e.sustrato === macro)!) as [keyof typeof B.ENZIMAS_B9, unknown];
      const e = B.ENZIMAS_B9[enzima];
      S().setDigestion({ enzimaSeleccionada: enzima, nivelPH: Math.round(e.phOptimo * 2) / 2, bilis: true });
      S().incubarB9();
      expect(S().digestion.ensayo?.resultado).toBe('completa');
      S().setDigestion({ organoRespuesta: e.organo, absorcionRespuesta: 'estomago' });
      expect(S().validarLab('biologia-9').ok).toBe(false);
      S().setDigestion({ absorcionRespuesta: 'delgado' });
      expect(S().validarLab('biologia-9').ok).toBe(true);
      S().setDigestion({ organoRespuesta: 'grueso' });
      expect(S().validarLab('biologia-9').ok).toBe(false);
    }
  });
});

// ── B10 Lotka-Volterra ───────────────────────────────────────────────────────
describe('B10 Lotka-Volterra con RK4', () => {
  it('RK4 conserva la cantidad de Lotka-Volterra (las órbitas no se abren en espiral)', () => {
    const p = { alpha: 1, beta: 0.05, gamma: 0.5, delta: 0.005 };
    const V = (x: number, y: number) => p.delta * x - p.gamma * Math.log(x) + p.beta * y - p.alpha * Math.log(y);
    let x = 150, y = 25;
    const v0 = V(x, y);
    for (let i = 0; i < 5000; i++) [x, y] = B.pasoRK4B10(x, y, p);
    expect(Math.abs(V(x, y) - v0)).toBeLessThan(1e-6);
  });

  it('barrido: los parámetros sembrados colapsan; existen parámetros en rango que sostienen 50 años', () => {
    const paso = (x: number, d: number) => Math.round(x / d) * d;
    for (let i = 0; i < 200; i++) {
      S().entrarLab('biologia-10');
      expect(S().validarLab('biologia-10').ok).toBe(false);
      const e = S().ecosistema;
      expect(B.simularLVB10(e.parametros, e.presasIniciales, e.depredadoresIniciales).extincion).not.toBe(false);
      // Equilibrio colocado cerca del punto inicial: γ/δ ≈ x0, α/β ≈ y0.
      const delta = 0.005, beta = 0.05;
      const p = { alpha: paso(beta * e.depredadoresIniciales, 0.01), beta, gamma: paso(delta * e.presasIniciales, 0.01), delta };
      S().setEcosistema({ parametros: p });
      const sim = B.simularLVB10(p, e.presasIniciales, e.depredadoresIniciales);
      expect(sim.extincion).toBe(false);
      S().registrarCorridaB10({ t: sim.t, extincion: false, parametros: p }, sim.x, sim.y, []);
      expect(S().validarLab('biologia-10').ok).toBe(true);
      // Una corrida interrumpida no basta.
      S().registrarCorridaB10({ t: 20, extincion: false, parametros: p }, sim.x, sim.y, []);
      expect(S().validarLab('biologia-10').ok).toBe(false);
    }
  });
});
