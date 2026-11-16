// =============================================================================
// Ingeniería Avanzada: las siete prácticas estrella.
//
// Cada práctica es un paquete estático y autónomo (public/estrellas/E#/, copiado por
// `node scripts/estrellas/copiar-estrellas.mjs`). No pasa por /alumno/simulador ni por la
// tabla `intentos`: se abre en su propia pestaña y guarda su avance en el navegador.
// Por eso aquí solo está lo que el catálogo necesita para presentarlas.
//
// Los títulos y las frases salen del `index.html` y del `experiencia-datos.js` de cada
// paquete (capítulos «Portada» y «Tu misión»), dichos en llano: los lee gente no especialista.
// =============================================================================

export type Estrella = {
  /** Carpeta del paquete: E1 … E7. */
  id: string;
  titulo: string;
  /** Qué hace el alumno, en una frase. */
  frase: string;
  area: string;
  /** Archivo estático de la práctica; se abre en pestaña nueva. */
  href: string;
  /** Captura de la escena 3D de la propia práctica (16:10). */
  portada: string;
};

const estrella = (n: number, titulo: string, area: string, frase: string): Estrella => ({
  id: `E${n}`,
  titulo,
  frase,
  area,
  href: `/estrellas/E${n}/index.html`,
  portada: `/estrellas/portadas/E${n}.webp`,
});

export const ESTRELLAS: Estrella[] = [
  estrella(1, 'Mezcladora de tres silos con PLC', 'Automatización',
    'Programas el controlador que dosifica tres silos sobre una banda y demuestras con pruebas que funciona, también cuando algo falla.'),
  estrella(2, 'Robot industrial de 6 ejes', 'Robótica',
    'Compruebas con cálculo y con medición si el robot alcanza todos los puntos de trabajo de una celda, antes de que el cliente la compre.'),
  estrella(3, 'Torneado CNC: de la primera pieza a la capacidad del proceso', 'Manufactura',
    'Programas el torno, ajustas la primera pieza, mides dos lotes y decides con datos si se libera la producción.'),
  estrella(4, 'Corrección del factor de potencia y recibo de CFE', 'Energía',
    'Mides el consumo de una planta, diseñas el banco de capacitores que quita el recargo del recibo y demuestras cuánto ahorra.'),
  estrella(5, 'Motor de inducción: arranque directo, estrella-delta, arrancador suave y variador', 'Máquinas eléctricas',
    'Comparas cuatro formas de arrancar un motor y eliges con números la que no hunde la tensión de la red ni dispara la protección.'),
  estrella(6, 'Semiconductores contra su hoja de datos', 'Electrónica',
    'Mides una muestra de piezas electrónicas como lo pide su fabricante y decides si se acepta un lote de 2000.'),
  estrella(7, 'Sintonía de un lazo de temperatura con PID', 'Control',
    'Ensayas un horno industrial, ajustas su controlador de temperatura y demuestras que el ajuste nuevo es mejor y es seguro.'),
];

/** Ilustración de la ficha y del encabezado: mosaico de las siete escenas, con fondo transparente. */
export const MOSAICO_ESTRELLAS = '/estrellas/portadas/mosaico.webp';
