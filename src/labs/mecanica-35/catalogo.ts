import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Diseña filtros activos Sallen-Key de 2.º orden (fc, Q, Butterworth)",
  duracion: "35 min",
  teoria: "El filtro Sallen-Key es la topología de filtro activo de 2.º orden más común, construida con un solo amplificador operacional en configuración no inversora y dos resistores más dos capacitores iguales entre sí (R1=R2=R, C1=C2=C). Esa igualdad de componentes simplifica el diseño a dos ecuaciones: la frecuencia de corte fc=1/(2πRC), que depende solo de R y C, y el factor de calidad Q=1/(3−K), que depende solo de la ganancia K=1+Rf/Rg fijada por el divisor resistivo de realimentación positiva del op-amp. Ajustar R o C mueve fc sin tocar Q; ajustar K (vía Rf) mueve Q sin tocar fc — un desacoplo que hace del Sallen-Key una topología muy usada en la práctica. Cuando K≈1.586, Q≈0.7071 (1/√2), el punto de respuesta Butterworth: la curva de magnitud más plana posible en la banda de paso, sin ningún pico de resonancia. Si K se acerca a 3, Q crece sin límite y el filtro se vuelve inestable (oscila). El simulador dibuja la curva de Bode (magnitud y fase, normalizada a f/fc) en vivo, un osciloscopio que muestra la atenuación y el desfase reales de la señal de salida frente a la de entrada, y clasifica automáticamente la respuesta (sobre-amortiguada, Butterworth, con pico de resonancia, o inestable) según el valor de Q. Cuatro modos: Explora (R/C/Rf libres, con Bode y osciloscopio en vivo), Predicción (fc, Q o el tipo de respuesta antes de revelar), Medición (barrido de la relación f/fc que traza la curva de atenuación punto por punto) y Reto (diseñar R y C para alcanzar una fc objetivo mientras se mantiene la respuesta en el punto Butterworth).",
  estado: "activo",
  simuladorHtml: "/labs/sallenkey.html",
};

export default catalogo;
