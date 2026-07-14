import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-40",
  titulo: "Calibrador Vernier: Lectura, Error de Cero y Repetibilidad",
  subtitulo: "Metrología dimensional",
  acento: "#2A9D8F",
  duracion: 50,
  videoUrl: '',
  bienvenida: `Con esta práctica arrancamos el dominio de metrología general (D10, sub-clúster de instrumentación de banco), dejando atrás el diagnóstico automotriz para volver a la herramienta de medición más común de cualquier taller: el calibrador vernier. Parece simple —dos escalas, un cursor que desliza— pero leerlo bien es una habilidad que se pierde fácil: hay que encontrar, entre todas las líneas del nonio, la ÚNICA que coincide exactamente con una línea de la escala principal, y esa línea es la que da la fracción de milímetro de tu lectura.

Pero incluso leyendo perfectamente, dos trampas esperan a quien mide en serio. La primera: ningún calibrador real marca 0.000 mm exactos con las mordazas cerradas — tiene un error de cero propio, que hay que conocer y restar (con su signo) de cada lectura antes de reportarla. La segunda: mide la misma pieza cinco veces y vas a obtener cinco números ligeramente distintos. Eso no es que el calibrador esté descompuesto — es la repetibilidad del operador, una fuente de incertidumbre tan real como la resolución del instrumento, y en esta práctica vas a comparar ambas, no a fingir que una no existe.`,
  conceptos: [
    { icono: '📏', nombre: 'Escala del nonio: LC = 1 mm / N', descripcion: 'Si el nonio tiene N divisiones que abarcan exactamente (N−1) mm de la escala principal, cada división mide (N−1)/N mm, y la mínima lectura discernible es LC=1mm/N. Este lab usa dos resoluciones: N=20 (LC=0.05 mm) y N=50 (LC=0.02 mm).' },
    { icono: '🎯', nombre: 'Error de cero: se corrige, no se ignora', descripcion: 'Todo calibrador real tiene un error de cero propio (la lectura con mordazas cerradas no es 0.000 mm exactos). Lectura corregida = Lectura cruda − Error de cero, respetando el signo — un error de cero positivo o negativo se corrige en sentidos opuestos.' },
    { icono: '🔍', nombre: 'Mordazas externas, internas y varilla de profundidad — un mismo nonio', descripcion: 'Las tres formas de medir (diámetros externos, diámetros internos, profundidad de ranuras) comparten exactamente la misma mecánica de escala principal + nonio: solo cambia qué parte del instrumento hace contacto con la pieza.' },
    { icono: '📊', nombre: 'Repetibilidad vs. resolución: ninguna domina sola', descripcion: 'Cinco lecturas del mismo objeto dan una media, un rango y una desviación estándar s (incertidumbre Tipo A, del operador) que se compara —sin descartar ninguna— contra la incertidumbre de resolución del instrumento, ±LC/2 (Tipo B).' },
  ],
  mision: [
    'FASE 1 · Explora: cierra las mordazas sobre cada una de las cuatro piezas (externa, interna, profundidad, repetibilidad), usa la lupa para leer la coincidencia entre escalas, y compara cómo cambia la lectura al cambiar la resolución de 0.05 mm a 0.02 mm.',
    'FASE 2 · Corrige: para cada caso, identifica el error de cero conocido del instrumento y calcula la lectura corregida — la telemetría te da la lectura cruda y el error de cero; a ti te toca combinarlos correctamente.',
    'FASE 3 · Repite: en el caso de repetibilidad, toma las 5 lecturas de la misma pieza y compara la dispersión del operador (media, rango, s) contra la incertidumbre de resolución ±LC/2 del instrumento.',
    'FASE 4 · Responde: en cada caso, elige entre varias lecturas parecidas (la corregida, la cruda sin corregir, un error de una línea del nonio, un error de un milímetro) la que realmente representa la medición correcta.',
  ],
  aplicaciones: [
    { area: 'Control de calidad e inspección dimensional', ejemplo: 'El calibrador vernier es la primera herramienta de verificación dimensional en casi cualquier taller o línea de producción: diámetros, espesores, profundidades y anchos de ranura antes de aceptar o rechazar una pieza contra su tolerancia de plano.' },
    { area: 'Metrología de trazabilidad (CENAM)', ejemplo: 'Antes de confiar en un calibrador para inspección, su error de cero y su indicación se verifican contra bloques patrón trazables a un laboratorio acreditado — el mismo principio de "conocer y corregir el error del instrumento" que se practica aquí, pero con certificado.' },
    { area: 'Manufactura y ensamble mecánico', ejemplo: 'Ajustes eje-barreno, holguras de ensamble y verificación de maquinado dependen de mediciones externas e internas consistentes; un operador que no domina la lectura del nonio (o que ignora el error de cero) introduce variación indetectable en el proceso.' },
  ],
};

export default briefing;
