import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-14',
  titulo: 'Curva I–V del diodo: trazador y ajuste exponencial',
  subtitulo: 'Electrónica · Caracterización de dispositivos',
  acento: '#2A9D8F',
  duracion: 40,
  bienvenida: `¡Bienvenido al trazador de curvas de CEN Labs! Un diodo real no es un interruptor perfecto: es una exponencial. William Shockley escribió su ecuación en 1949 — I = Is·(e^(V/(n·VT)) − 1) — y hoy sigue siendo el modelo que corre dentro de cualquier simulador SPICE.\n\nEn el banco tienes un circuito fuente–resistor–diodo resuelto en vivo: el punto de operación Q se calcula exactamente por bisección sobre la recta de carga, y la ley de temperatura de SPICE hace que el coeficiente térmico del silicio (≈ −2 mV/K) emerja solo, sin estar programado a mano. Compara silicio, Schottky y LED, cambia Vs, R y T, y mira la curva en escala lineal y semilogarítmica.\n\nEn el modo Ajuste vas a extraer n e Is de solo dos mediciones — así se caracteriza un diodo de verdad con un trazador de curvas. Y en el Reto, un dispositivo desconocido: mide dos puntos, resuelve el sistema y predice Vd e Id ANTES de que la curva se revele.`,
  conceptos: [
    { icono: '⚡', nombre: 'Ecuación de Shockley', descripcion: 'I = Is·(e^(V/(n·VT)) − 1). Is es la corriente de saturación inversa, n el factor de idealidad y VT = kT/q el voltaje térmico (≈ 25.9 mV a 27 °C).' },
    { icono: '🌡️', nombre: 'Is(T) — ley de SPICE2', descripcion: 'Is crece con la temperatura según la ley de SPICE2 (Nagel, 1975); de ahí emerge que Vf baja ≈ −2 mV/K en el silicio — sin que ese número esté escrito en ningún lado del modelo.' },
    { icono: '📐', nombre: 'Recta de carga y punto Q', descripcion: 'Id = (Vs − Vd)/R es una recta; la exponencial del diodo es una curva. Donde se cruzan está el punto de operación real del circuito, resuelto aquí por bisección.' },
    { icono: '📈', nombre: 'Vista semilogarítmica', descripcion: 'En escala log(I) vs V la exponencial se vuelve una recta de pendiente n·VT·ln 10 — la base del método de 2 puntos para extraer n e Is de un diodo real.' },
  ],
  mision: [
    'FASE 1 · Explora: reconoce el circuito (fuente, resistor limitador, diodo) y el punto Q donde la recta de carga cruza la curva. Cambia de dispositivo, Vs, R y T.',
    'FASE 2 · Curva: haz un barrido de corrientes fijas (escalera de décadas) y observa cómo la exponencial se vuelve una recta en escala semilog.',
    'FASE 3 · Ajuste: con dos puntos de tu barrido, calcula n = (V2 − V1)/(VT·ln(I2/I1)) y compara tu resultado contra el modelo — incluido el pequeño sesgo que introduce el "−1" de Shockley cerca de Is.',
    'FASE 4 · Reto: dispositivo desconocido. Mide dos puntos, resuelve el sistema 2×2 y predice Vd e Id del punto Q antes de que el simulador los revele (tolerancia: Vd ±2 %, Id ±5 %).',
  ],
  aplicaciones: [
    { area: 'Diseño de fuentes y protección', ejemplo: 'Elegir un diodo Schottky (Vf bajo) o uno de silicio estándar depende de esta misma curva — la caída de voltaje define pérdidas y disipación.' },
    { area: 'Diseño de iluminación LED', ejemplo: 'Dimensionar el resistor limitador R = (Vs − Vf)/If de un LED usa exactamente esta ecuación — y respetar If máx evita destruir el LED.' },
    { area: 'Simulación SPICE', ejemplo: 'LTspice y ngspice resuelven cada diodo del circuito con esta misma ecuación de Shockley y la misma ley de temperatura — el modelo .model de un diodo trae Is, n, Eg y XTI.' },
  ],
  retos: [
    'Predice cómo cambia Vf si subes la temperatura 50 °C sin volver a mirar la curva — y verifica con el deslizador de T.',
    'Compara el n extraído en modo Ajuste para el Schottky contra el n del modelo: ¿por qué queda sistemáticamente un poco más bajo cerca de Is?',
    'Con un 1N4148 y un 1N5819 reales, un multímetro y una fuente variable, levanta la curva punto por punto y contrasta contra la hoja de datos (ver la práctica del multímetro).',
  ],
};

export default briefing;
