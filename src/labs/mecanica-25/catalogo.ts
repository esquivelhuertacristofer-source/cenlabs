import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Osciloscopio digital: base de tiempo, acoplamiento y disparo",
  duracion: "45 min",
  teoria: "El osciloscopio digital muestra la señal contra el tiempo, a diferencia del multímetro que solo da un número. El alumno domina sus 3 controles básicos: base de tiempo (T = divisiones × time/div, f = 1/T), acoplamiento (DC = señal completa, AC = filtro paso-alto que aísla la CA de la CD, GND = referencia de 0 V) y disparo (Auto fuerza un barrido, Normal solo dispara si se cumple la condición, Single captura un evento único y lo retiene). Resuelve 4 casos: lectura correcta de base de tiempo y volts/div (Vpp = 2×V_pico, V_rms = V_pico×0.707), aislamiento del offset de CD vía acoplamiento, máquina de estados del disparo con el nivel fuera de rango, y medición de desfase entre 2 canales por cruces por cero (Δφ° = 360°×Δt/T). Norma IEC 61010-1 + IEC 61010-2-030 (seguridad, osciloscopio); sin norma de exactitud — ancho de banda y muestreo son de hoja de datos del fabricante.",
  estado: "activo",
  simuladorHtml: "/labs/osciloscopio.html",
};

export default catalogo;
