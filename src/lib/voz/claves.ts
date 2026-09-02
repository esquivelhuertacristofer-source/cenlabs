/**
 * QUÉ SE NARRA DE UN BRIEFING, Y CON QUÉ NOMBRE.
 *
 * Este archivo lo leen los DOS extremos y por eso está en `src/lib` y no en
 * `scripts/`: el extractor lo usa al grabar, para saber qué frases mandar al
 * sintetizador y con qué nombre guardarlas; y el reproductor lo usa en el
 * navegador, sobre el MISMO briefing que ya bajó para pintarlo, para saber qué
 * MP3 pedir. Una sola copia.
 *
 * En la plataforma de robótica esto está escrito dos veces —una en el script de
 * extracción y otra en el componente— con un comentario que avisa de que tienen
 * que salir iguales. Aquí no hace falta el aviso: es el mismo código, y una
 * clave que cambie cambia en los dos sitios a la vez o no compila.
 *
 * QUÉ LLEVA BOCINA Y QUÉ NO. El briefing es la portada de misión: es prosa, se
 * lee de arriba abajo y es lo único que el alumno consume ANTES de tocar el
 * simulador. Por eso lleva voz. Dentro del lab no: ahí está manipulando, y una
 * locutora encima estorba.
 *
 * SE PARTE POR FRASES, y esa es la decisión de diseño de todo el narrador. Un
 * párrafo entero en un MP3 se dice con un solo ritmo, que es exactamente lo que
 * hace que un sintetizador suene a sintetizador. Partido por frases, cada una
 * lleva el ritmo y la pausa de su papel, y además el reproductor sabe cuál está
 * sonando y la puede marcar en pantalla mientras la dice.
 */
import { paraDecir, frases, papelDe, esOrden, PAPELES } from './decir';
import type { Papel } from './decir';

/** Lo mínimo del briefing que hace falta para sacar las claves. */
export interface BriefingNarrable {
  titulo?: string;
  subtitulo?: string;
  bienvenida?: string;
  conceptos?: { nombre?: string; descripcion?: string }[];
  mision?: string[];
  aplicaciones?: { area?: string; ejemplo?: string }[];
}

export interface Clip {
  /** `bienvenida-3-1` = segunda frase del cuarto párrafo. */
  clave: string;
  /** El texto YA normalizado: es lo que se oye, no lo que está en pantalla. */
  texto: string;
  papel: Papel;
  /** El bloque de pantalla al que pertenece, para la bocina que lo encola. */
  bloque: Bloque;
}

/** Los bloques que tienen bocina propia en la portada de misión. */
export type Bloque = 'titulo' | 'bienvenida' | 'conceptos' | 'mision' | 'aplicaciones';

/**
 * Todas las frases narrables de un briefing, en el orden en que se leen.
 *
 * Es puro: mismo briefing, mismas claves, siempre. De eso depende que el
 * navegador acierte a pedir un archivo que se grabó hace semanas.
 */
export function clipsDeBriefing(b: BriefingNarrable): Clip[] {
  const salida: Clip[] = [];
  const add = (clave: string, bruto: unknown, papel: Papel, bloque: Bloque) => {
    const texto = paraDecir(bruto);
    if (texto) salida.push({ clave, texto, papel, bloque });
  };

  /* Título y subtítulo van de una pieza: son etiquetas, no prosa, y partir el
     subtítulo por frases dejaría su lista de conceptos hecha trozos. */
  add('titulo', b.titulo, 'rotulo', 'titulo');
  add('subtitulo', b.subtitulo, 'dato', 'titulo');

  // La bienvenida es el bloque largo: párrafos separados por línea en blanco.
  const parrafos = String(b.bienvenida ?? '').split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean);
  parrafos.forEach((parrafo, p) => {
    const fs = frases(parrafo);
    fs.forEach((f, i) => add(`bienvenida-${p}-${i}`, f, papelDe(f, i, fs.length), 'bienvenida'));
  });

  /* Un concepto es una tarjeta: el nombre es su rótulo —cuatro palabras, no una
     frase— y la descripción es la prosa que lo desarrolla. */
  (b.conceptos ?? []).forEach((c, i) => {
    add(`concepto-${i}-0`, c.nombre, 'rotulo', 'conceptos');
    const fs = frases(String(c.descripcion ?? ''));
    fs.forEach((f, j) => add(`concepto-${i}-${j + 1}`, f, papelDe(f, j, fs.length), 'conceptos'));
  });

  /* Los pasos de la misión son ÓRDENES: el alumno las va a ejecutar con las
     manos, no las lee de corrido. La primera frase lleva el verbo en mayúsculas
     —así está escrito todo el corpus— y es la que manda; el resto del paso
     explica por qué. */
  (b.mision ?? []).forEach((m, i) => {
    const fs = frases(String(m));
    fs.forEach((f, j) => {
      const papel: Papel = j === 0 && esOrden(f) ? 'orden' : papelDe(f, j, fs.length);
      add(`mision-${i}-${j}`, f, papel, 'mision');
    });
  });

  (b.aplicaciones ?? []).forEach((a, i) => {
    add(`aplicacion-${i}-0`, a.area, 'rotulo', 'aplicaciones');
    const fs = frases(String(a.ejemplo ?? ''));
    fs.forEach((f, j) => add(`aplicacion-${i}-${j + 1}`, f, papelDe(f, j, fs.length), 'aplicaciones'));
  });

  return salida;
}

/** Las claves de un bloque de pantalla, para la bocina que lo lee entero. */
export function clipsDeBloque(b: BriefingNarrable, bloque: Bloque): Clip[] {
  return clipsDeBriefing(b).filter((c) => c.bloque === bloque);
}

/** El ritmo con el que se grabó un clip. Lo necesita el extractor, no la página. */
export function ritmoDe(papel: Papel): string {
  return PAPELES[papel].ritmo;
}

/** Dónde vive el audio de un clip. */
export function rutaVoz(labId: string, clave: string): string {
  return `/assets/voz/${labId}/${clave}.mp3`;
}
