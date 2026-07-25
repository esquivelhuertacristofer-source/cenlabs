import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-75',
  titulo: 'Puesta a Tierra y Resistencia de Tierra',
  subtitulo: 'Circuitos Eléctricos · Instalaciones eléctricas',
  acento: '#4FB0AE',
  duracion: 30,
  videoUrl: '',
  bienvenida: `Cuando ocurre una falla —un cable de fase que toca la carcasa metálica de un motor, o un rayo que cae cerca— alguien tiene que ofrecerle a esa corriente peligrosa un camino seguro hacia la tierra, lejos de las personas. Ese camino es el sistema de puesta a tierra, y su calidad se mide con un número: la resistencia a tierra, en ohms. Cuanto más baja, mejor: la corriente de falla se drena rápido, las protecciones disparan y el potencial peligroso no se queda "flotando" en las estructuras metálicas. Pero esa resistencia no depende solo de la varilla que clavas: depende, sobre todo, del terreno donde la clavas. Un mismo electrodo puede dar 8 Ω en un suelo húmedo y arcilloso, y más de 80 Ω en arena seca. Por eso, diseñar una buena tierra empieza por conocer el suelo.

El primer paso es MEDIR la resistividad del terreno, esa propiedad —en ohm·metro— que dice qué tan buen conductor es el suelo. La herramienta clásica es el método de Wenner: cuatro electrodos clavados en línea, igualmente separados una distancia a. Se inyecta corriente por los dos externos y se mide la tensión entre los dos internos; el telurómetro calcula R=ρ/(2πa), y de ahí despejas la resistividad ρ=2π·a·R. Algo importante que verás en el simulador: si cambias la separación a, la lectura R cambia, pero el ρ que despejas se mantiene, porque la resistividad es una propiedad del suelo, no del arreglo de medición (esto vale para un suelo homogéneo; los suelos reales por capas son más complejos).

Con ρ ya conocido viene el segundo paso: DIMENSIONAR el electrodo. La resistencia de una varilla vertical se calcula con la fórmula de Dwight, R₁=ρ/(2πL)·[ln(8L/d)−1]: baja si la varilla es más larga (L) y depende de su diámetro (d). ¿No basta con una varilla? Pones varias en paralelo, bien separadas, y la resistencia baja aproximadamente a R₁/N. Tu meta es cumplir el objetivo normativo: 25 Ω como valor general, 10 Ω deseable, 5 Ω en subestaciones y sistemas de pararrayos. Y aquí está la lección honesta de este laboratorio: en suelos muy resistivos vas a descubrir que ni ocho varillas de seis metros bajan de 25 Ω. Cuando el terreno no ayuda, ninguna cantidad de varillas resuelve el problema: hay que cambiar de estrategia —mallas de tierra, anillos perimetrales o tratamiento químico del suelo con bentonita o compuestos mejoradores—. En el reto tendrás que diseñar el electrodo MÍNIMO que cumple: ni de menos (no cumples), ni de más (desperdicias cobre).`,
  conceptos: [
    { icono: '🌍', nombre: 'Resistividad del suelo (ρ)', descripcion: 'Es la propiedad del terreno, en Ω·m, que determina qué tan buena tierra se puede lograr. Va desde ~30 Ω·m en suelos pantanosos hasta ~1000 Ω·m o más en roca y arena seca. Es lo primero que hay que medir: sin conocer ρ no se puede diseñar la tierra.' },
    { icono: '📐', nombre: 'Método de Wenner (4 electrodos)', descripcion: 'Cuatro electrodos equidistantes (separación a): se inyecta corriente por los externos y se mide tensión en los internos. El telurómetro da R=ρ/(2πa) y se despeja ρ=2π·a·R. En suelo homogéneo, ρ es constante aunque cambie a: es propiedad del suelo, no de la medición.' },
    { icono: '📏', nombre: 'Fórmula de Dwight (varilla vertical)', descripcion: 'La resistencia de una varilla vertical es R₁=ρ/(2πL)·[ln(8L/d)−1]: baja al aumentar la longitud L y depende del diámetro d. Varias varillas alejadas en paralelo dan R_N≈R₁/N (válido si están separadas ≥2·L, para que el acople mutuo sea despreciable).' },
    { icono: '🎯', nombre: 'Objetivos y sus límites', descripcion: 'Se busca R ≤ 25 Ω (general), ≤ 10 Ω (deseable) o ≤ 5 Ω (subestaciones/pararrayos). Pero en suelos muy resistivos ni el máximo de varillas alcanza el objetivo: entonces hay que usar malla de tierra, anillo perimetral o tratamiento del suelo (bentonita/GEM). Reconocer ese límite es parte del diseño.' },
  ],
  mision: [
    'ENSAMBLE · Instala el sistema de puesta a tierra pieza por pieza: toca cada componente del banco (varilla, abrazadera, conductor, barra de tierra, telurómetro y electrodos auxiliares) y luego su hueco luminoso. Al terminar se desbloquean los modos de medición y diseño.',
    'SUELO (WENNER) · Elige un tipo de terreno y varía la separación a de los electrodos. Observa que la lectura R del telurómetro cambia con a, pero el ρ que despejas (ρ=2π·a·R) se mantiene: la resistividad es propiedad del suelo. Usa el barrido automático para verlo de un vistazo.',
    'ELECTRODO · Con el suelo elegido, prueba longitudes de varilla y número de varillas en paralelo. La barra compara la resistencia obtenida con los objetivos 25/10/5 Ω. Prueba un suelo muy resistivo y comprueba que ni el máximo del catálogo baja de 25 Ω: ahí hacen falta mallas o tratamiento del terreno.',
    'RETO · Se sortea un terreno (con su ρ medido) y un objetivo de resistencia. Diseña el electrodo MÍNIMO que cumple —menos varillas y, para ese número, la más corta— y comprueba. Si te quedas corto no cumples; si te pasas, desperdicias cobre.',
  ],
  aplicaciones: [
    { area: 'Protección de personas y equipos', ejemplo: 'Una buena puesta a tierra mantiene las carcasas metálicas al potencial de tierra: si un cable de fase toca el gabinete de un tablero o de una máquina, la corriente de falla se drena y la protección dispara, en lugar de dejar la estructura energizada esperando a que alguien la toque. Es la base de la seguridad eléctrica en cualquier instalación.' },
    { area: 'Subestaciones y sistemas de pararrayos', ejemplo: 'En subestaciones y en la bajada de un pararrayos se exigen resistencias muy bajas (≤5 Ω) para disipar rápidamente corrientes de falla y descargas atmosféricas sin elevar peligrosamente el potencial del terreno. Ahí es común combinar mallas de tierra, múltiples varillas y tratamiento del suelo, precisamente porque una varilla sola no alcanza.' },
    { area: 'Telecomunicaciones y electrónica sensible', ejemplo: 'Torres de telecomunicaciones, centros de datos y equipos electrónicos sensibles requieren tierras de baja impedancia y estables para referencia de señal y para descargas. Medir la resistividad del terreno con el método de Wenner antes de instalar permite decidir cuántas varillas, de qué longitud, o si conviene un anillo o una malla desde el diseño.' },
  ],
};

export default briefing;
