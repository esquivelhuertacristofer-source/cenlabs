import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-17",
  titulo: "Fuente de Alimentación Lineal Regulada",
  subtitulo: "Electrónica · Transformador + puente + filtro + regulador de 3 terminales",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Hasta ahora trabajaste el puente rectificador y el zener por separado. En esta práctica los vuelves a encontrar como parte de una cadena completa: transformador reductor → puente rectificador → capacitor de filtro → regulador lineal de 3 terminales tipo 7805. Es la fuente de alimentación lineal más común que vas a encontrar dentro de un equipo real, y cada bloque le entrega al siguiente un problema distinto de resolver.

El transformador reduce la línea (114–140 V CA, nominal 127 V/60 Hz) a un secundario de 6 a 18 V. El puente — modelado con el mismo par de uniones Shockley (Is, n) que ya usaste en la práctica de rectificación — convierte eso en CD pulsante. El capacitor de filtro suaviza esa señal, pero aquí no vas a ver la fórmula aproximada de rizo de un solo término: el simulador integra el capacitor por Runge-Kutta de 4º orden (RK4) contra la corriente real que demanda la carga, muestra a muestra. Y el regulador de 3 terminales toma ese voltaje filtrado — con su rizo y todo — y entrega una salida fija, siempre que tenga suficiente margen de voltaje para trabajar.

Ese margen es el concepto central de la práctica: el regulador necesita que el valle del voltaje filtrado se mantenga por encima de Vout más su caída de dropout. Si el transformador es chico, la línea cae, el capacitor es pequeño o la carga pide mucha corriente, ese margen se agota — el regulador entra en pérdida de regulación y el rizo empieza a "filtrarse" hacia la salida, exactamente lo que vas a poder ver y medir en el simulador, muestra a muestra y no como una simple bandera de sí/no.

El otro eje de la práctica es térmico. El regulador disipa potencia — la calculas de dos formas distintas para que compares el resultado exacto (integrado muestra a muestra) contra la fórmula simplificada de libro de texto, y vas a ver en qué condiciones esa fórmula simple deja de tener sentido físico. Esa potencia, combinada con la resistencia térmica del disipador que elijas (de "sin disipador" hasta "disipador grande"), determina la temperatura de unión del regulador — y si te pasas del límite del fabricante, el simulador te lo va a mostrar sin rodeos.`,
  conceptos: [
    { icono: '🔗', nombre: 'Cadena de cuatro bloques', descripcion: 'Transformador ideal → puente rectificador (modelo de Shockley de dos uniones) → capacitor de filtro (integración RK4 exacta) → regulador lineal de 3 terminales — cada bloque le entrega al siguiente un problema distinto de resolver.' },
    { icono: '📏', nombre: 'Margen de regulación (headroom)', descripcion: 'El regulador exige que el valle del voltaje filtrado supere Vout+Vdropout; cuando ese margen se agota, el rizo se filtra hacia la salida en vez de quedar bloqueado — reproducido muestra a muestra, no como bandera booleana.' },
    { icono: '⚖️', nombre: 'Disipación exacta vs. fórmula', descripcion: 'Pd calculada de dos formas — exacta (RK4, muestra a muestra) y por la fórmula simplificada de libro de texto con Vfiltro promedio — para comparar dónde la fórmula simple deja de tener sentido físico.' },
    { icono: '🌡️', nombre: 'Temperatura de unión vs. disipador', descripcion: 'Tj = Ta + Pd·θ en estado estable contra el límite Tj,max del fabricante, con el disipador (θ, en °C/W) como la palanca principal para bajarla sin cambiar el circuito.' },
  ],
  mision: [
    'FASE 1 · Explora: toca el esquema y el osciloscopio para revelar los valores de voltaje filtrado y voltaje regulado; cambia el tap del transformador (6–18 V), el capacitor de filtro (100 µF–4700 µF), el disipador, la línea (114–140 V) y la corriente de salida, y observa cómo se mueve el margen de regulación en el trazo dual del osciloscopio.',
    'FASE 2 · Predice: dado un circuito completo, calcula Vs_rms (secundario real), el voltaje de filtro promedio con su rizo, y la disipación de potencia del regulador — antes de que el medidor te lo confirme.',
    'FASE 3 · Barrido: recorre la corriente de salida o el capacitor de filtro con todo lo demás fijo, y observa cómo se degrada el margen de regulación a medida que crece la demanda o se achica el capacitor.',
    'FASE 4 · Reto de diseño térmico: enfréntate a un escenario de peor caso — línea baja, temperatura ambiente alta, transformador chico, sin disipador — y determina si el regulador sigue dentro de su ventana segura de temperatura de unión, o si el diseño necesita un disipador mejor.',
  ],
  aplicaciones: [
    { area: 'Fuentes de banco e instrumentación', ejemplo: 'Fuentes de banco y fuentes internas de equipo de laboratorio, instrumentación y control industrial que siguen usando regulación lineal por su bajo ruido, frente a fuentes conmutadas donde el ruido de conmutación es inaceptable.' },
    { area: 'Diagnóstico de campo', ejemplo: 'Un técnico que mide un regulador caliente o una salida con rizo excesivo necesita saber si el problema es falta de margen de regulación (transformador/capacitor/línea) o falta de disipación térmica (disipador insuficiente) — son fallas distintas con el mismo síntoma.' },
    { area: 'Diseño de la etapa de alimentación', ejemplo: 'Elegir el tap del transformador, el capacitor de filtro y el disipador correctos para que el regulador nunca pierda margen ni exceda su temperatura de unión en el peor caso esperado de línea y carga.' },
  ],
  retos: [
    '¿Por qué la fórmula simplificada de potencia disipada (con Vfiltro promedio) puede dar un resultado que no tiene sentido físico cuando el regulador pasa buena parte del ciclo en dropout? ¿Qué te dice eso sobre los límites de una fórmula de libro de texto frente a una integración exacta?',
    'Con línea baja (114 V) y un transformador de 6 V, ¿por qué crecer el capacitor de filtro no resuelve por sí solo la pérdida de regulación? ¿Qué parámetro sí la resolvería?',
    'En el peor caso térmico del modo Reto (línea alta, ambiente caliente, sin disipador), ¿el problema es de margen de voltaje, de temperatura, o de ambos a la vez? Justifica con los números que te entrega el simulador.',
  ],
};

export default briefing;
