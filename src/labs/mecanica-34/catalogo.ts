import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Genera temporizaciones y oscilaciones con el 555 (astable)",
  duracion: "35 min",
  teoria: "El 555 contiene un divisor interno de tres resistores iguales que fija dos umbrales de voltaje: 2/3 Vcc (threshold, dispara la descarga) y 1/3 Vcc (trigger, dispara la carga). En la configuración astable de 3 terminales, el capacitor C se carga a través de RA+RB hasta 2/3 Vcc, y se descarga solo a través de RB hasta 1/3 Vcc, reiniciando el ciclo sin necesitar ninguna señal de entrada: tHigh=0.693(RA+RB)C, tLow=0.693·RB·C, f=1/(tHigh+tLow)=1.44/((RA+2RB)C), y duty=(RA+RB)/(RA+2RB) — siempre ≥50%, porque la carga (por RA+RB) tarda más que la descarga (solo por RB). El simulador dibuja la curva exponencial real de carga/descarga del capacitor (no una rampa lineal) y advierte cuando RA se diseña por debajo del mínimo recomendado (1kΩ), la guía que protege al transistor interno de descarga. Cuatro modos: Explora (Vcc/RA/RB/C libres, con la curva del capacitor y el osciloscopio en vivo), Predicción (frecuencia o duty cycle antes de revelar), Medición (barrido automático de RB que muestra cómo el duty cycle se acerca a 50% mientras baja la frecuencia) y Reto (diseñar RA/RB/C para alcanzar una frecuencia objetivo manteniendo el duty cycle cerca de 50% y RA sobre el mínimo recomendado).",
  estado: "activo",
  simuladorHtml: "/labs/ne555.html",
};

export default catalogo;
