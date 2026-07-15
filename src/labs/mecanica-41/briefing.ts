import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-41",
  titulo: "Micrómetro y Comparador de Carátula: Resolución 0.01 mm",
  subtitulo: "Metrología de precisión",
  acento: "#2A9D8F",
  duracion: 50,
  videoUrl: '',
  bienvenida: `Con el vernier dominado, subimos un escalón de resolución: el micrómetro. Su principio es distinto al del nonio — un husillo con rosca de paso 0.5 mm/vuelta avanza o retrocede al girar el tambor, y ese tambor trae grabadas 50 divisiones, así que cada división equivale a 0.5mm/50=0.01 mm. Leerlo es sumar tres términos: los milímetros completos del manguito, la media vuelta si la marca del medio está descubierta, y la división del tambor que coincide con la línea de referencia. Igual que el vernier, ningún micrómetro real marca 0.000 mm exactos con las caras en contacto — tiene su propio error de cero que hay que restar de cada lectura cruda, con su signo. Aquí lo corregimos aritméticamente (como en la práctica anterior) para que puedas comparar el método; en un micrómetro físico esa corrección casi siempre se hace mecánicamente, ajustando el manguito con la llave de ajuste — una diferencia que esta práctica te señala explícitamente para que no la confundas.

La segunda mitad de la práctica cambia de instrumento y de propósito: el comparador de carátula (dial indicator) no mide una dimensión absoluta, mide una diferencia relativa mientras la pieza gira o mientras recorres una superficie. Con la pieza girando sobre soportes en V, seis lecturas cada 60° te dan el TIR (Total Indicator Reading = lectura máxima − lectura mínima), que evalúa el runout — cuánto se "bambolea" el eje al girar. Con la pieza fija, cinco puntos sobre una placa te dan la planitud de la misma forma: máximo menos mínimo entre los puntos palpados. El comparador que usamos aquí es de tipo émbolo (plunger), no de palanca (lever) — una distinción que importa porque el tipo de palanca introduce un error de coseno que este modelo no reproduce ni necesita reproducir para lo que estás aprendiendo.`,
  conceptos: [
    { icono: '🔩', nombre: 'Lectura del micrómetro: manguito + media vuelta + tambor×0.01 mm', descripcion: 'El husillo avanza 0.5 mm por vuelta completa del tambor; el tambor tiene 50 divisiones, así que cada división vale 0.01 mm. La lectura final suma: milímetros enteros visibles en el manguito + 0.5 mm si la marca intermedia está descubierta + (división del tambor alineada) × 0.01 mm.' },
    { icono: '🎯', nombre: 'Error de cero: mismo principio, distinta corrección real', descripcion: 'Todo micrómetro real tiene un error de cero propio. Lectura corregida = Lectura cruda − Error de cero, igual que en el vernier — pero en un instrumento físico esa corrección se hace mecánicamente (girando el manguito con la llave de ajuste), no restando a mano; este lab la resuelve aritméticamente por comparación pedagógica con la práctica anterior, y lo declara así para no confundir el modelo con la realidad.' },
    { icono: '🧭', nombre: 'Trinquete: fuerza de medición constante, no una cifra memorizable', descripcion: 'El trinquete (ratchet stop) existe para que distintos operadores apliquen una fuerza de contacto similar y repetible entre mediciones — pero la magnitud exacta del error si se aprieta directamente del tambor en vez del trinquete no está estandarizada de forma verificable, así que esta práctica evalúa el concepto (para qué sirve y cómo se usa) sin inventar un número de error que no se puede sostener con una norma citable.' },
    { icono: '📐', nombre: 'Comparador de carátula: TIR (runout) y planitud por diferencia', descripcion: 'El comparador no mide una dimensión absoluta: mide cuánto se mueve la aguja respecto a una referencia. Runout: TIR = lectura máxima − lectura mínima entre varios ángulos de giro. Planitud: máxima − mínima entre varios puntos palpados sobre una superficie con la pieza fija sobre una placa de referencia.' },
  ],
  mision: [
    'FASE 1 · Explora: cierra el micrómetro sobre cada eje de calibración y gira el tambor para ver cómo el manguito y la marca intermedia construyen la lectura; luego cambia al comparador de carátula y observa cómo la aguja se mueve al girar la pieza o al recorrer los puntos de la placa.',
    'FASE 2 · Corrige: para cada eje del micrómetro, identifica el error de cero conocido del instrumento y calcula la lectura corregida a partir de la lectura cruda que te da la telemetría.',
    'FASE 3 · Evalúa: toma las 6 lecturas de runout cada 60° y calcula el TIR; toma las 5 lecturas de planitud y calcula la diferencia máxima−mínima; compara ambos resultados contra su tolerancia de aceptación.',
    'FASE 4 · Responde: en cada caso —incluido el conceptual del trinquete— elige, entre varias opciones parecidas, la que realmente representa el resultado o el criterio correcto.',
  ],
  aplicaciones: [
    { area: 'Control de calidad de precisión', ejemplo: 'El micrómetro es el instrumento de referencia cuando la tolerancia de una pieza es más fina de lo que un vernier puede discernir con confianza — ejes, calibres pasa/no-pasa, espesores de lámina, diámetros de rodamiento.' },
    { area: 'Tolerancias geométricas (GD&T)', ejemplo: 'El runout y la planitud son controles geométricos normados (ASME Y14.5 / ISO 1101) que un plano de manufactura puede exigir además de la dimensión — un eje puede cumplir su diámetro nominal y aun así rechazarse por exceso de runout si va a girar en un rodamiento.' },
    { area: 'Metrología de trazabilidad (CENAM)', ejemplo: 'Igual que el vernier, el error de cero y la indicación de un micrómetro o comparador se verifican periódicamente contra patrones trazables a un laboratorio acreditado — sin esa verificación, ni la resolución más fina del instrumento garantiza una medición confiable.' },
  ],
};

export default briefing;
