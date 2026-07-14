import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-35",
  titulo: "Diseña filtros activos Sallen-Key de 2.º orden (fc, Q, Butterworth)",
  subtitulo: "Electrónica analógica · filtro pasa-bajas Sallen-Key con componentes iguales — R y C fijan fc, la ganancia del op-amp fija Q",
  acento: "#2A9D8F",
  duracion: 35,
  videoUrl: '',
  bienvenida: `Casi todos los filtros activos de 2.º orden que vas a encontrar en equipo real —desde la etapa anti-aliasing de un convertidor A/D hasta el filtro de salida de una fuente conmutada— usan alguna variante de la topología Sallen-Key. Su atractivo es que necesita un solo amplificador operacional: dos resistores y dos capacitores forman la red de frecuencia, y un divisor resistivo de dos resistores más fija la ganancia que controla la forma de la curva. Cuando los dos resistores de la red de frecuencia son iguales (R1=R2=R) y los dos capacitores también (C1=C2=C) —la variante de componentes iguales, la más común en la práctica— el diseño se reduce a dos ecuaciones independientes entre sí.

La primera fija la frecuencia de corte: fc=1/(2πRC). Solo depende de R y C — subir o bajar cualquiera de los dos mueve fc sin tocar nada más. La segunda fija el factor de calidad Q, que describe la forma de la curva cerca de fc: Q=1/(3−K), donde K=1+Rf/Rg es la ganancia de la etapa no inversora fijada por el divisor Rf/Rg. Ese desacoplo —R y C controlan dónde está el codo del filtro, K controla qué tan pronunciado es— es la razón por la que el Sallen-Key sigue siendo la topología de referencia para enseñar filtros activos.

El valor de Q determina el "carácter" de la curva. Con Q bajo (K cercano a 1), la respuesta es sobre-amortiguada: cae suave y gradualmente, sin ningún pico. En Q=1/√2≈0.7071 —que se alcanza con K≈1.586— la curva entra en el punto de respuesta Butterworth: la más plana posible en la banda de paso, el punto de diseño más buscado en la práctica porque no introduce ninguna resonancia ni distorsión de amplitud cerca de fc. Si sigues subiendo K más allá de ese punto, aparece un pico de resonancia cada vez más pronunciado —Q alto—, y si K se acerca a 3, Q crece sin límite: el filtro deja de ser un filtro y se convierte en un oscilador. Vas a poder llevar el circuito hasta ese límite en este simulador, de forma segura, y ver exactamente dónde se cruza la frontera entre "filtro con pico" e "inestable".`,
  conceptos: [
    { icono: '🎚️', nombre: 'fc: solo depende de R y C', descripcion: 'Con componentes iguales (R1=R2=R, C1=C2=C), la frecuencia de corte es fc=1/(2πRC) — ajustar R o C mueve dónde está el codo del filtro, sin afectar la forma de la curva cerca de ese codo.' },
    { icono: '📈', nombre: 'Q: solo depende de la ganancia K', descripcion: 'Q=1/(3−K), con K=1+Rf/Rg fijada por el divisor de realimentación positiva del op-amp — Q controla si la curva cae suave (Q bajo), plana (Q≈0.7071) o con un pico de resonancia (Q alto), sin mover fc.' },
    { icono: '✅', nombre: 'Punto Butterworth: K≈1.586, Q≈0.7071', descripcion: 'La respuesta más plana posible en la banda de paso, sin ningún pico de resonancia — el punto de diseño de referencia para la mayoría de las aplicaciones de filtrado de propósito general.' },
    { icono: '⚠️', nombre: 'K→3: el filtro se vuelve inestable', descripcion: 'A medida que K se acerca a 3, Q crece sin límite (Q=1/(3−K)) y la curva desarrolla un pico cada vez más agudo hasta que el circuito deja de comportarse como filtro y empieza a oscilar por sí solo.' },
  ],
  mision: [
    'FASE 1 · Explora: ajusta R, C y Rf, y observa cómo cambian fc, K y Q, junto con la curva de Bode (magnitud y fase) y el osciloscopio de atenuación en tiempo real.',
    'FASE 2 · Predicción: predice fc, Q o el tipo de respuesta (sobre-amortiguada, Butterworth, con pico o inestable) antes de que el simulador revele el valor real con los componentes actuales.',
    'FASE 3 · Medición: ejecuta el barrido automático de la relación f/fc y observa cómo se traza punto por punto la curva de atenuación real de la salida.',
    'FASE 4 · Reto: diseña R y C para alcanzar una frecuencia de corte objetivo mientras mantienes la respuesta en el punto Butterworth (Q≈0.7071).',
  ],
  aplicaciones: [
    { area: 'Filtros anti-aliasing', ejemplo: 'Antes de digitalizar una señal con un convertidor A/D, un filtro Sallen-Key pasa-bajas en el punto Butterworth elimina el contenido de alta frecuencia que causaría aliasing, sin distorsionar la amplitud de las frecuencias que sí interesa conservar.' },
    { area: 'Filtrado de salida de fuentes conmutadas', ejemplo: 'La tensión de salida de un convertidor buck o boost trae rizo a la frecuencia de conmutación; una etapa Sallen-Key adicional después del filtro LC principal puede atenuar ese rizo residual antes de entregar la tensión a circuitería sensible.' },
    { area: 'Acondicionamiento de señal en instrumentación', ejemplo: 'Sensores analógicos (temperatura, presión, audio) suelen alimentar un filtro Sallen-Key para limitar el ancho de banda antes de la etapa de amplificación o conversión, reduciendo ruido de alta frecuencia sin atenuar la señal útil.' },
  ],
  retos: [
    'Predice qué le pasa a fc y a Q si duplicas C sin tocar R ni Rf, y verifica con los deslizadores — ¿cuál de los dos cambia y cuál se mantiene igual?',
    'Sube Rf hasta acercar K a 3 y observa cómo crece Q hasta que el simulador clasifica la respuesta como inestable. ¿Por qué esa transición depende únicamente de K y nunca de R o C?',
    'Arma un Sallen-Key real con un TL072, dos resistores iguales, dos capacitores iguales y un divisor Rf/Rg calculado para K≈1.586, y mide la curva de magnitud con un generador de funciones y un osciloscopio: contrástala contra la curva de Bode que traza este simulador para los mismos componentes.',
  ],
};

export default briefing;
