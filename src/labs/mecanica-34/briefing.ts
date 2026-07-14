import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-34",
  titulo: "Genera temporizaciones y oscilaciones con el 555 (astable)",
  subtitulo: "Electrónica analógica · multivibrador astable con NE555 — RA, RB y C fijan la frecuencia y el ciclo de trabajo de una oscilación continua",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: `El 555 es probablemente el circuito integrado más fabricado de la historia — miles de millones de unidades, en producción ininterrumpida desde 1972. Su secreto es simple: adentro solo hay un divisor resistivo de tres resistores iguales (el origen del nombre "555") que fija dos umbrales de voltaje, un par de comparadores que vigilan esos umbrales, y un latch que decide el estado de salida. Con eso, y tres componentes externos —dos resistores y un capacitor—, se construye un oscilador completo, sin necesitar ninguna señal de entrada.

En la configuración astable, el capacitor C se carga a través de RA+RB hasta llegar a 2/3 Vcc (el umbral de threshold, pin 6). En ese instante el 555 activa internamente el pin de descarga (pin 7), que conecta a tierra y descarga C — pero esta vez la corriente de descarga pasa solo por RB, no por RA. C sigue bajando hasta 1/3 Vcc (el umbral de trigger, pin 2), donde el ciclo se reinicia: carga de nuevo a través de RA+RB. Como la carga siempre tarda más que la descarga (RA+RB > RB, mientras RA no sea cero), el tiempo en alto tHigh siempre es mayor o igual que el tiempo en bajo tLow — el duty cycle de este circuito nunca puede bajar de 50%, sin importar qué valores elijas.

De ahí salen las fórmulas de diseño: tHigh=0.693·(RA+RB)·C, tLow=0.693·RB·C, y la frecuencia f=1/(tHigh+tLow), que se simplifica a la forma clásica f=1.44/((RA+2RB)·C). Ajustar RB mientras dejas RA y C fijos es la palanca más directa: subir RB acerca el duty cycle a 50% (porque RB empieza a dominar tanto la carga como la descarga) mientras baja la frecuencia — el mismo patrón que vas a trazar en el modo Medición de este simulador.

Hay una guía de diseño que vale la pena interiorizar: no conviene elegir RA por debajo de aproximadamente 1kΩ. Durante tLow, toda la corriente que pasa por RA termina fluyendo hacia el transistor interno de descarga del 555 — una RA demasiado pequeña empuja esa corriente hacia el límite del transistor. Este simulador te deja elegir una RA deliberadamente baja para que veas la advertencia aparecer, sin arriesgar ningún componente real.`,
  conceptos: [
    { icono: '⏱️', nombre: 'Astable: oscilación sin entrada', descripcion: 'RA, RB y C fijan tHigh=0.693(RA+RB)C y tLow=0.693·RB·C — el 555 oscila de forma continua entre los dos umbrales internos, sin necesitar ninguna señal externa que lo dispare.' },
    { icono: '📐', nombre: 'Frecuencia y duty cycle', descripcion: 'f=1/(tHigh+tLow)=1.44/((RA+2RB)C) y duty=(RA+RB)/(RA+2RB) — el duty cycle de esta topología de 3 terminales siempre es ≥50%, porque la carga (por RA+RB) siempre tarda más que la descarga (solo por RB).' },
    { icono: '🔋', nombre: 'Umbrales internos: 2/3 Vcc y 1/3 Vcc', descripcion: 'Un divisor de tres resistores iguales dentro del 555 fija el umbral de threshold (2/3 Vcc, dispara la descarga) y el de trigger (1/3 Vcc, dispara la carga) — el capacitor oscila exactamente entre esos dos puntos.' },
    { icono: '⚠️', nombre: 'RA mínimo recomendado', descripcion: 'Durante tLow toda la corriente de RA fluye hacia el transistor interno de descarga — bajar RA de aproximadamente 1kΩ es una práctica de diseño desaconsejada por fabricantes y tutoriales, no un límite arbitrario del simulador.' },
  ],
  mision: [
    'FASE 1 · Explora: ajusta Vcc, RA, RB y C, y observa cómo cambian tHigh, tLow, f y el duty cycle, junto con la curva real de carga/descarga del capacitor entre los umbrales 1/3 Vcc y 2/3 Vcc, y el osciloscopio virtual.',
    'FASE 2 · Predicción: predice la frecuencia f o el duty cycle antes de que el simulador revele el valor real con los componentes actuales.',
    'FASE 3 · Medición: ejecuta el barrido automático de RB y observa cómo el duty cycle se acerca a 50% mientras la frecuencia baja — sin tocar C.',
    'FASE 4 · Reto: diseña RA, RB y C para alcanzar una frecuencia objetivo manteniendo el duty cycle razonablemente cerca de 50% y sin bajar RA del mínimo recomendado.',
  ],
  aplicaciones: [
    { area: 'Osciladores de baja frecuencia y temporizadores', ejemplo: 'Luces intermitentes, generadores de tono, temporizadores de encendido/apagado periódico — cualquier circuito que necesite una oscilación estable sin un microcontrolador de por medio suele empezar con un 555 astable.' },
    { area: 'Generación de PWM básico', ejemplo: 'Aunque el duty cycle de un astable de 3 terminales siempre queda por encima de 50%, es la base conceptual de circuitos de control de velocidad de motores o brillo de LEDs antes de pasar a soluciones con diodo o a un microcontrolador con PWM dedicado.' },
    { area: 'Reloj para lógica digital simple', ejemplo: 'Contadores, registros de desplazamiento y otros circuitos digitales de laboratorio a menudo usan un 555 astable como fuente de reloj barata y fácil de ajustar en frecuencia, sin necesitar un cristal de cuarzo.' },
  ],
  retos: [
    'Predice qué le pasa a la frecuencia y al duty cycle si duplicas C sin tocar RA ni RB, y verifica con los deslizadores — ¿cuál de los dos cambia y cuál se mantiene igual?',
    'Baja RA hasta el valor más pequeño disponible en el simulador y observa la advertencia. ¿Por qué esa advertencia depende solo de RA y nunca aparece por subir RB o C?',
    'Arma un 555 astable real con un NE555, RA, RB y C, y mide f y el duty cycle en un osciloscopio: contrástalos contra los valores calculados por f=1.44/((RA+2RB)C) y duty=(RA+RB)/(RA+2RB) para los mismos componentes.',
  ],
};

export default briefing;
