/**
 * LO QUE SE ESCRIBE NO ES LO QUE SE PRONUNCIA.
 *
 * Este archivo convierte el texto de un briefing en el texto que se le da al
 * sintetizador. No es maquillaje: en una plataforma de mecánica la notación ES
 * el contenido, y un símbolo que el motor se salta cambia lo que el alumno oye.
 * «H₂O» leído como «H O» no es un detalle de estilo, es agua convertida en otra
 * cosa.
 *
 * TODO LO DE AQUÍ ESTÁ MEDIDO, NO SUPUESTO. El método: se sintetiza «El valor
 * es X» con el símbolo y con su lectura escrita, y se comparan los tamaños. Si
 * coinciden, el motor ya lo lee bien y tocarlo sólo puede empeorarlo; si el del
 * símbolo se parece al de la frase sin nada, el símbolo se está cayendo.
 * Medido sobre `es-MX-DaliaNeural` con rate=+10% (bytes de MP3; la frase base
 * «El valor es» pesa 10 656):
 *
 *   YA SE LEEN BIEN — NO SE TOCAN, tocarlos sólo puede empeorarlos
 *     λ 11 808 = «lambda» 11 808        Δ 11 376 = «delta» 11 376
 *     η 10 944 = «eta» 10 944           Ω 13 392 = «ohmios» 13 392
 *     ≤ 14 400 ≈ «menor o igual que» 14 544
 *     °C 17 856 = «grados centígrados» 17 856
 *     % 14 544 = «por ciento» 14 544    m² 16 416 = «metros cuadrados» 16 416
 *     rpm 19 152 = «revoluciones por minuto» 19 152
 *     «14,60» = «catorce coma sesenta», y el espacio fino de los miles (3 039)
 *     se lee igual que el espacio normal.
 *
 *   SE CAEN O SE LEEN MAL — hay que traducirlos
 *     ₂ de CO₂       11 088 ≈ base      el subíndice se IGNORA: «CO₂» suena «CO»
 *     → de A → B     11 088 = «A B»     la flecha se IGNORA por completo
 *     ·  de uno · dos 10 656 = base     el punto medio se IGNORA, ni pausa deja
 *     ω              11 232 ≠ «omega» 11 664
 *     µ / μ          10 656 = base      se IGNORA: «µF» pierde el «micro» entero
 *     kV 14 112 ≠ «kilovoltios» 15 552  ·  Hz 14 112 ≠ «hercios» 15 120
 *     _ (guión bajo) se pronuncia
 *
 *   SE LEEN EN VOZ ALTA Y NO DEBERÍAN — esto es lo más grave
 *     **negrita** 14 832 contra «muy alto» 11 952: los asteriscos del markdown
 *       SE DICEN. Los briefings de CEN ponen en negrita la tesis de cada
 *       párrafo, así que sin esta línea la locutora dice «asterisco asterisco»
 *       varias veces por párrafo. Es, por sí solo, motivo para que exista este
 *       archivo.
 *     «hola» 14 544 contra hola sin comillas 11 952: las angulares también.
 *
 * Y una que no es de pronunciación: `edge_tts` devolvió `NoAudioReceived` en un
 * caso de esta misma tanda y al repetirlo salió bien. El fallo es pasajero y el
 * narrador tiene que reintentar; ver INTENTOS en `narrar.py`.
 */

/**
 * LOS SIETE PAPELES, con sus dos mitades.
 *
 * Esta tabla la leen DOS sitios y por eso vive aquí y no en el narrador: el
 * ritmo lo usa `scripts/voz/narrar.py` al grabar, y la pausa la usa
 * `src/components/voz/Lector.tsx` al reproducir. Si el ritmo estuviera en el
 * script de Python y la pausa en el componente, cambiar la dirección de un
 * papel serían dos ediciones en dos lenguajes, y la segunda se olvida.
 *
 * `ritmo` va tal cual a `edge_tts`. `antes`/`despues` son segundos de silencio
 * que mete el reproductor, y son un AÑADIDO: cada MP3 de edge-tts ya trae su
 * propio silencio pegado a los extremos, así que la separación real entre dos
 * frases es esa base más lo de aquí. Lo que se está eligiendo son las
 * diferencias entre papeles, no los tiempos absolutos.
 *
 * Los ritmos salen de la escala medida sobre este corpus; está en la cabecera
 * de `scripts/voz/narrar.py` con el método. Resumen: +0 % son 143 palabras
 * escritas por minuto y +30 % son 186, y el cuerpo va en +12 % (~160), que es
 * la banda en la que narran los audiolibros.
 */
export const PAPELES = {
  rotulo:    { ritmo: '+0%',  antes: 0.00, despues: 0.34 },
  entrada:   { ritmo: '+8%',  antes: 0.00, despues: 0.10 },
  dato:      { ritmo: '+12%', antes: 0.12, despues: 0.00 },
  contraste: { ritmo: '+20%', antes: 0.06, despues: 0.00 },
  giro:      { ritmo: '+2%',  antes: 0.40, despues: 0.06 },
  remate:    { ritmo: '+0%',  antes: 0.30, despues: 0.00 },
  orden:     { ritmo: '+4%',  antes: 0.28, despues: 0.06 },
} as const;

export type Papel = keyof typeof PAPELES;

/** Segundos de silencio entre dos clips seguidos. */
export function pausaEntre(anterior: Papel | null, siguiente: Papel): number {
  const despues = anterior ? PAPELES[anterior].despues : 0;
  return despues + PAPELES[siguiente].antes;
}

/**
 * EL SILENCIO QUE TRAE PEGADO CADA CLIP, Y POR QUÉ HAY QUE QUITARLO.
 *
 * `edge_tts` devuelve cada frase con silencio en los dos extremos. Se midió
 * decodificando 81 clips de ocho labs distintos con `AudioContext`:
 *
 *     al principio   mínimo 0,149 s   media 0,170 s
 *     al final       mínimo 0,758 s   media 0,817 s
 *
 * O sea casi UN SEGUNDO muerto por frase, y muy estable. Encadenando veinte
 * frases —un bloque de bienvenida normal— eso son veinte segundos de nada, y
 * sobre todo convierte la dirección en decorado: una pausa de `giro` de 0,40 s
 * y una de `contraste` de 0,06 s son indistinguibles cuando las dos van encima
 * de un segundo fijo.
 *
 * Así que el reproductor entra el clip ya empezado y salta al siguiente antes
 * de que termine. Los dos recortes van por DEBAJO del mínimo medido con margen
 * de sobra: cortan silencio, nunca voz.
 *
 * Esto es la razón de ser del reproductor de dos elementos. Con uno solo no se
 * puede adelantar la entrada del siguiente, porque cambiarle el `src` al que
 * está sonando lo corta.
 */
export const RECORTE = {
  /** Se empieza a reproducir aquí. Mínimo medido 0,149. */
  entrada: 0.12,
  /** Se salta al siguiente a esta distancia del final. Mínimo medido 0,758. */
  salida: 0.60,
} as const;

/** Subíndices Unicode al dígito normal, que sí se lee. */
const SUB: Record<string, string> = {
  '₀': '0', '₁': '1', '₂': '2', '₃': '3', '₄': '4',
  '₅': '5', '₆': '6', '₇': '7', '₈': '8', '₉': '9', 'ₓ': 'x',
};

/* ² y ³ NO entran: «m²» ya se lee «metros cuadrados» y pasarlo a «m2» lo
   empeora. Sólo se traducen los superíndices que nunca son de unidad. */
const SUP: Record<string, string> = {
  '⁰': '0', '¹': '1', '⁴': '4', '⁵': '5',
  '⁶': '6', '⁷': '7', '⁸': '8', '⁹': '9', '⁻': 'menos ',
};

/**
 * Unidades que el motor no arma solo. EL ORDEN IMPORTA: `kHz` va antes que
 * `Hz`, porque al revés la regla corta parte el prefijo y sale «k hercios».
 */
const UNIDADES: [RegExp, string][] = [
  [/\bkWh\b/g, 'kilovatios hora'],
  [/\bkHz\b/g, 'kilohercios'], [/\bMHz\b/g, 'megahercios'], [/\bHz\b/g, 'hercios'],
  [/\bkV\b/g, 'kilovoltios'], [/\bmV\b/g, 'milivoltios'], [/\bkW\b/g, 'kilovatios'],
  [/\bmA\b/g, 'miliamperios'], [/\bkA\b/g, 'kiloamperios'],
  [/\bkPa\b/g, 'kilopascales'], [/\bMPa\b/g, 'megapascales'],
  [/[µμ]F\b/g, 'microfaradios'], [/[µμ]m\b/g, 'micrómetros'],
  [/[µμ]s\b/g, 'microsegundos'], [/[µμ]A\b/g, 'microamperios'],
  [/[µμ]H\b/g, 'microhenrios'],
  [/\bnF\b/g, 'nanofaradios'], [/\bpF\b/g, 'picofaradios'], [/\bmH\b/g, 'milihenrios'],
  [/[µμ]/g, 'micro'],
  [/ω/g, 'omega'],
  [/\bN[·.]m\b/g, 'newton metro'],
];

/**
 * El texto tal como hay que decirlo.
 *
 * Es la ÚNICA fuente: el hash que decide si un clip se regenera se calcula
 * sobre esta salida, así que tocar una regla de aquí vuelve a narrar
 * exactamente los clips a los que esa regla afecta, y ninguno más.
 */
export function paraDecir(t: unknown): string {
  let s = String(t ?? '');

  // 1. Markdown fuera. Va primero porque los asteriscos SE PRONUNCIAN.
  s = s.replace(/\*\*([\s\S]+?)\*\*/g, '$1').replace(/\*([\s\S]+?)\*/g, '$1');
  s = s.replace(/`([\s\S]+?)`/g, '$1');
  s = s.replace(/\[([\s\S]+?)\]\([\s\S]+?\)/g, '$1');

  // 2. Comillas: se leen en voz alta como «comilla».
  s = s.replace(/[«»“”‘’„‟]/g, '');

  // 3. Subíndices e índices: el motor los ignora, el dígito va plano.
  s = s.replace(/[₀-₉ₓ]/g, (c) => SUB[c] ?? '');
  s = s.replace(/[⁰¹⁴-⁹⁻]/g, (c) => SUP[c] ?? '');

  // 4. Unidades que no arma solo.
  for (const [re, txt] of UNIDADES) s = s.replace(re, txt);

  // 5. Signos que se caen sin dejar ni pausa. La flecha es «a» porque en esta
  //    prosa siempre marca una transición (R-134a → R-1234yf).
  s = s.replace(/\s*→\s*/g, ' a ');
  s = s.replace(/\s*[·•]\s*/g, ', ');
  s = s.replace(/\s*[—–]\s*/g, ', ');
  s = s.replace(/_/g, ' ');

  // 6. Un salto de línea suelto dentro del párrafo mete pausa donde no hay
  //    frase.
  s = s.replace(/\s*\n\s*/g, ' ');
  s = s.replace(/\s{2,}/g, ' ');

  // 7. Una frase sin punto final sale cortada en seco al pegarla con la
  //    siguiente.
  s = s.trim();
  if (s && !/[.!?…:]$/.test(s)) s += '.';
  return s;
}

/**
 * En cuántas frases se parte un párrafo para dirigirlo.
 *
 * No se parte por punto a secas: «NOM-041-SEMARNAT-2015.» y «1,05.» llevan
 * puntos que no terminan nada, y cortar ahí deja frases de dos palabras que
 * suenan a telegrama.
 */
export function frases(parrafo: unknown): string[] {
  const bruto = String(parrafo).split(/(?<=[.!?…])\s+(?=[«"¿¡A-ZÁÉÍÓÚÑ])/g);
  const salida: string[] = [];
  for (const f of bruto) {
    const t = f.trim();
    if (!t) continue;
    // Menos de 25 caracteres casi nunca es una frase: es una cifra o una sigla
    // que arrastró el punto. Se pega a la anterior.
    if (salida.length && t.length < 25) salida[salida.length - 1] += ' ' + t;
    else salida.push(t);
  }
  return salida;
}

/**
 * QUÉ PAPEL HACE CADA FRASE, deducido del propio texto.
 *
 * En la plataforma de robótica el papel se escribía a mano, frase por frase, en
 * un guión de diez renglones. Aquí son casi siete mil frases y nadie las va a
 * etiquetar, así que hay que deducirlas.
 *
 * LO QUE NO SE PUEDE DEDUCIR, Y SE MIDIÓ ANTES DE INTENTARLO. La primera
 * versión de esto daba por hecho que el corpus marcaba su propio énfasis en
 * negrita. Se contó: **6 briefings de 160** usan negrita, 71 veces en total.
 * Sobre esa base el papel `giro` —el de la revelación, el que lleva la pausa
 * larga delante— caía en 58 de 6 668 frases. La premisa era falsa, así que el
 * `giro` se queda como lo que de verdad es: un extra para los seis briefings
 * que sí lo marcan, no un pilar de la dirección.
 *
 * LO QUE SÍ SE PUEDE DEDUCIR, y es sobre lo que se apoya todo:
 *   · la POSICIÓN dentro del bloque —abre, cierra— no falla nunca;
 *   · los CONECTORES de oposición, que en este corpus arrancan 31 frases sólo
 *     con «pero», más las de «en cambio» y «sin embargo»;
 *   · el ROTULO, que se reconoce porque quien llama sabe que lo es: un título,
 *     el nombre de un concepto, el área de una aplicación. No es prosa y no se
 *     dice como prosa;
 *   · la ORDEN de un paso de misión, que en este corpus arranca con el verbo en
 *     mayúsculas (MIRA, PON, VE, CAMBIA, RETO).
 *
 *   rotulo     una etiqueta, no una frase. Pausa DESPUÉS, no antes.
 *   orden      un paso de misión. El alumno lo va a ejecutar con las manos.
 *   entrada    abre un bloque de prosa.
 *   contraste  gira el argumento: pero, en cambio, sin embargo.
 *   giro       llevaba negrita en el original. Raro, y por eso vale.
 *   remate     cierra el bloque.
 *   dato       el cuerpo, y la mayoría.
 *
 * Recibe el texto ORIGINAL, con su markdown puesto: la negrita es justo la
 * marca que se está leyendo, y `paraDecir` ya se la habrá quitado.
 */
export function papelDe(textoOriginal: string, i: number, total: number): Papel {
  const t = String(textoOriginal).trim();
  if (/\*\*[\s\S]+?\*\*/.test(t)) return 'giro';
  if (/^(pero|en cambio|sin embargo|y sin embargo|aun as[íi]|no obstante|ahora bien|y luego)\b/i.test(t)) return 'contraste';
  if (i === 0) return 'entrada';
  if (i === total - 1 && total > 2) return 'remate';
  return 'dato';
}

/** ¿Este paso de misión arranca con el verbo en mayúsculas, como todo el corpus? */
export function esOrden(texto: string): boolean {
  return /^(?:RETO|[A-ZÁÉÍÓÚÑ]{2,})\b/.test(String(texto).trim());
}
