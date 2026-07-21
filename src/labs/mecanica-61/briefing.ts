import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-61',
  titulo: 'Divisores de Tensión y Corriente: Diseño con Efecto de Carga',
  subtitulo: 'Circuitos Eléctricos · Diseño y dimensionamiento',
  acento: '#2A9D8F',
  duracion: 35,
  videoUrl: '',
  bienvenida: `Todo curso de circuitos enseña la misma fórmula en la primera semana: Vo = V·R2/(R1+R2). Es correcta — pero solo si nadie conecta nada a la salida. En cuanto atornillas ese divisor a un circuito real, ese "nada" se convierte en una resistencia de carga RL, y Vo deja de ser el valor de libro. Este es el error de diseño más común de un principiante: calcular el divisor ideal y sorprenderse cuando el voltaje medido no coincide.

En este banco reutilizas el mismo motor de análisis nodal (MNA) del laboratorio de Kirchhoff: primero exploras el divisor sin carga, luego conectas una RL y ves a Vo caer — con el error de carga calculado en vivo y contrastado contra la equivalencia de Thévenin del propio divisor (Vth y Rth). Un segundo circuito, con una fuente de corriente ideal, te muestra el caso hermano: el divisor de corriente, donde el resistor MENOR se lleva la mayor parte de la corriente.

Y en el reto no hay una sola respuesta correcta que memorizar: te dan un voltaje objetivo, una carga fija y dos presupuestos — error de carga máximo y corriente de reposo máxima — y tú propones R1 y R2. Valores pequeños hacen el divisor "rígido" (bajo error) pero consumen más corriente; valores grandes ahorran corriente pero se dejan cargar más. Diseñar es navegar esa disyuntiva, no despejar una incógnita.`,
  conceptos: [
    { icono: '➗', nombre: 'Divisor de tensión ideal', descripcion: 'Vo = V·R2/(R1+R2): exacto solo cuando la salida no alimenta ninguna carga — el punto de partida de todo diseño, nunca el final.' },
    { icono: '⚠️', nombre: 'Efecto de carga', descripcion: 'Al conectar RL en paralelo con R2, Vo_cargado = V·(R2‖RL)/(R1+(R2‖RL)) < Vo_ideal. El error crece cuanto más se acerca RL al orden de magnitud de R2.' },
    { icono: '🔀', nombre: 'Equivalencia de Thévenin del divisor', descripcion: 'Visto desde la salida, el divisor ES una fuente Vth = V·R2/(R1+R2) con resistencia interna Rth = R1‖R2 — la misma herramienta que explica por qué toda fuente "real" cae bajo carga.' },
    { icono: '🔁', nombre: 'Divisor de corriente', descripcion: 'I1 = I0·R2/(R1+R2), I2 = I0·R1/(R1+R2): el reparto es inverso a la resistencia — el camino de menor resistencia se lleva la mayor corriente.' },
  ],
  mision: [
    'EXPLORA · Elige R1 y R2 de una lista de valores comerciales E12 y observa Vo del divisor ideal (sin carga) sobre el esquema IEC 60617, resuelto en vivo por el mismo motor MNA de Kirchhoff.',
    'CARGA · Conecta una resistencia RL en paralelo con R2 y cuantifica cuánto cae Vo respecto al ideal — verifica el resultado contra la equivalencia de Thévenin del propio divisor (Vth, Rth).',
    'CORRIENTE · Analiza un segundo circuito con una fuente de corriente ideal y dos resistores en paralelo: verifica que el reparto de corriente es inverso a la resistencia de cada rama.',
    'RETO · Diseña: con un voltaje objetivo, una carga fija y dos presupuestos (error de carga ≤5 %, corriente de reposo ≤25 mA), propone valores de R1 y R2 que cumplan las tres condiciones a la vez.',
  ],
  aplicaciones: [
    { area: 'Polarización de entradas analógicas', ejemplo: 'Un divisor genera el voltaje de referencia para un sensor o comparador; si no se dimensiona contra la impedancia de entrada real del siguiente circuito, la lectura queda desplazada.' },
    { area: 'Diseño de fuentes de referencia', ejemplo: 'Reguladores ajustables (ej. familia LM317) fijan su voltaje de salida con un divisor externo — el mismo cálculo de rigidez-vs-consumo de este laboratorio determina los valores recomendados por el fabricante.' },
    { area: 'Reparto de corriente en ramas paralelas', ejemplo: 'Al conectar cargas en paralelo sobre un mismo riel, el divisor de corriente predice cuánta corriente exige cada rama — clave para dimensionar conductores y protecciones.' },
  ],
};

export default briefing;
