import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-26",
  titulo: "Sonda de osciloscopio: atenuación, compensación, cursores y FFT",
  subtitulo: "Instrumentación · La sonda, los cursores y el espectro",
  acento: "#2A9D8F",
  duracion: 45,
  videoUrl: '',
  bienvenida: `¡De vuelta al banco de instrumentación de CEN Labs! En la práctica anterior conectaste la señal directo al osciloscopio. En el taller real casi nunca es así: hay una <b>sonda</b> de por medio, y es la parte del sistema de medición donde más errores comete un técnico nuevo — errores que se ven perfectamente razonables en pantalla hasta que alguien pregunta "¿y verificaste la sonda?".\n\nVas a resolver 4 casos guiados. En el Caso 1 descubres qué pasa cuando la posición física del selector 1X/10X de la sonda NO coincide con el ajuste de canal del osciloscopio — la pantalla muestra un número perfectamente creíble que está mal por un factor de 10. En el Caso 2 compensas una sonda 10X contra una señal de calibración y aprendes a distinguir sub-compensada, correcta y sobre-compensada por la forma de una onda cuadrada. En el Caso 3 usas cursores manuales de voltaje y de tiempo — y el error clásico de mezclar un cruce de subida con uno de bajada, que mide medio periodo y no el periodo completo. En el Caso 4 llegas al análisis FFT: una transformada real, calculada en vivo, donde ves con tus propios ojos qué es el aliasing cuando la frecuencia de la señal supera la de Nyquist.\n\nAl final vas a entender por qué ningún técnico serio confía en un número del osciloscopio sin antes verificar la sonda, la compensación, y el criterio de muestreo. ¡A medir con criterio, de la punta al espectro!`,
  conceptos: [
    { icono: '➗', nombre: 'Atenuación de sonda 1X/10X', descripcion: 'Una sonda 10X divide la señal entre 10 antes de llegar al osciloscopio. Si el ajuste de canal no coincide con la posición física del selector, la lectura queda mal por un factor de 10 — sin ningún aviso del instrumento.' },
    { icono: '🔧', nombre: 'Compensación de sonda', descripcion: 'El trimmer de la sonda 10X se ajusta con una onda cuadrada de calibración: esquinas redondeadas = sub-compensada, pico de sobrepaso = sobre-compensada, flancos rectos = correcta.' },
    { icono: '✛', nombre: 'Cursores manuales (ΔV, Δt)', descripcion: 'Los cursores miden directamente entre dos puntos de la traza. Deben comparar el mismo tipo de evento (mismo flanco, mismo nivel) — mezclar tipos da un número sin sentido físico.' },
    { icono: '📊', nombre: 'FFT y el criterio de Nyquist', descripcion: 'Δf = F_s/N y f_Nyquist = F_s/2. Si la señal supera Nyquist, su frecuencia se "refleja" en el espectro (aliasing): f_alias = |f_real − F_s|.' },
  ],
  mision: [
    'FASE 1 · Caso Sonda — ajusta la posición física del selector 1X/10X y el ajuste de canal hasta que coincidan, y recupera el voltaje real cuando no coinciden.',
    'FASE 2 · Caso Compensación — ajusta el trimmer de una sonda 10X frente a una onda cuadrada de calibración hasta lograr flancos rectos.',
    'FASE 3 · Caso Cursores — mide ΔV y Δt con cursores manuales, evitando el error de mezclar cruces de distinto tipo.',
    'FASE 4 · Caso FFT — calcula el espectro en vivo de 3 señales y reconoce el aliasing cuando la frecuencia supera Nyquist.',
  ],
  aplicaciones: [
    { area: 'Mantenimiento industrial', ejemplo: 'Verificación de sonda y compensación antes de diagnosticar un variador de frecuencia o un sensor de alta velocidad — un error de sonda se confunde fácilmente con una falla real.' },
    { area: 'Electrónica', ejemplo: 'Medición precisa de periodo y amplitud con cursores en circuitos de disparo, osciladores y filtros.' },
    { area: 'Automotriz', ejemplo: 'Análisis espectral (FFT) de señales de sensores de velocidad y de encendido para separar la frecuencia real de ruido eléctrico o de un submuestreo mal configurado.' },
  ],
  retos: [
    'Explica por qué una sonda 10X con el canal del osciloscopio en 1X no dispara ninguna alarma, aunque la lectura esté mal por 10×.',
    'Predice la forma de la onda cuadrada de calibración si el trimmer de la sonda tiene DEMASIADA capacitancia (ver la ficha técnica).',
    'Calcula a qué frecuencia aparecería en el espectro una señal real de 1800 Hz muestreada a F_s = 2000 Hz.',
  ],
};

export default briefing;
