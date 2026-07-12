import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Pérdidas de un MOSFET de Potencia en PWM: Conducción, Conmutación y Frecuencia de Cruce",
  duracion: "35 min",
  teoria: "Un MOSFET conmutando en PWM disipa energía por dos mecanismos independientes que este simulador calcula por separado. La pérdida de conducción Pcond=D·I²·RDS(on) usa el RDS(on) máximo garantizado de hoja de datos — la misma cifra que en la práctica anterior se mostraba solo como referencia, ahora sí participa en el cálculo. La pérdida de conmutación Psw=½·V·I·fsw·(tr+tf) usa la aproximación lineal estándar de libro de texto de electrónica de potencia, con tr+tf tomado directamente de hoja de datos a la condición de prueba del fabricante. El simulador despeja algebraicamente la frecuencia de cruce fsw*=2·D·I·RDS(on)/(V·(tr+tf)) — el punto donde ambas pérdidas se igualan — y la marca en vivo sobre una gráfica de Pcond/Psw/Ptot contra fsw, con un modo Barrido que anima la frecuencia y se detiene en el cruce exacto. Tres dispositivos con parámetros de hoja de datos verificados (IRF540N, IRLZ44N, 2N7000); para el 2N7000, ninguna hoja de datos consultada especifica tr+tf, así que el simulador muestra 'no disponible' para su pérdida de conmutación en vez de inventar una cifra, y solo calcula su pérdida de conducción. Cuatro modos: Explora, Predicción, Barrido de frecuencia con cruce animado, y Reto de diseño dentro de los límites de catálogo del dispositivo.",
  estado: "activo",
  simuladorHtml: "/labs/mosfet-pwm.html",
};

export default catalogo;
