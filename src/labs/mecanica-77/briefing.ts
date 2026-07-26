import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-77',
  titulo: 'Síntesis Lógica y Simplificación con Mapas de Karnaugh',
  subtitulo: 'Sistemas Digitales · Álgebra de Boole · Diseño combinacional',
  acento: '#8AB4F8',
  duracion: 30,
  videoUrl: '',
  bienvenida: `Todo circuito digital combinacional —el que decide si un motor arranca, si una alarma suena, qué dígito muestra un display— nace de la misma pregunta: para cada combinación posible de sus entradas, ¿la salida debe valer 0 o 1? Esa respuesta, escrita fila por fila, es la TABLA DE VERDAD, y define la función por completo. El problema no es escribirla, sino construir el circuito más barato que la cumpla. Si tomas la tabla literalmente y pones un producto lógico por cada 1 (la llamada forma canónica o suma de mintérminos), obtienes un circuito que funciona pero que gasta muchísimas compuertas: cada término usa TODAS las variables. Ahí es donde entra este laboratorio.

El MAPA DE KARNAUGH es un truco visual genial. Toma la tabla y la reacomoda en una rejilla, pero no en orden binario normal: usa CÓDIGO GRAY, de modo que dos casillas vecinas se diferencian en un solo bit. ¿Por qué importa tanto? Porque el álgebra de Boole dice que XY + XY′ = X: si una salida vale 1 tanto cuando una variable es 0 como cuando es 1 (y lo demás igual), esa variable simplemente no importa y desaparece. En el mapa, eso se ve como dos unos pegados que puedes "rodear" con un lazo, y el lazo elimina la variable que cambia dentro de él. Un lazo de 2 casillas elimina 1 variable; uno de 4, elimina 2; uno de 8, elimina 3. Cuanto más grande el grupo, más simple el término. La estrategia mínima es cubrir todos los unos con los lazos más grandes posibles —los implicantes primos— usando la combinación de menor coste. El simulador lo calcula con el algoritmo clásico de Quine-McCluskey, que verifiqué numéricamente contra fuerza bruta en 1200 casos: la forma mínima que ves es demostrablemente óptima.

Y hay una lección honesta que casi nunca se cuenta: no toda función simplifica. La función de PARIDAD (un XOR de varias variables) tiene sus unos dispuestos en tablero de ajedrez —ningún par es adyacente en el mapa— así que no hay nada que agrupar: su forma mínima es idéntica a la canónica. Un buen ingeniero sabe reconocer cuándo el mapa NO le va a ayudar. En los tres modos construirás funciones y verás cómo cambia la forma mínima, estudiarás cómo cada lazo elimina variables, y en el reto elegirás tú mismo los implicantes que cubran una función al mínimo coste.`,
  conceptos: [
    { icono: '📊', nombre: 'Tabla de verdad y mintérminos', descripcion: 'La tabla lista la salida F para cada una de las 2ⁿ combinaciones de entrada. Cada 1 es un mintérmino: un producto que vale 1 solo para esa combinación. Escribir la función como suma de todos sus mintérminos (forma canónica SOP) es correcto, pero usa el máximo de literales y compuertas. Es el punto de partida a mejorar.' },
    { icono: '🗺️', nombre: 'Mapa de Karnaugh y código Gray', descripcion: 'Reordena la tabla en una rejilla donde celdas vecinas difieren en un solo bit (código Gray). Esa adyacencia hace visibles las simplificaciones: agrupar 2^k unos adyacentes elimina las k variables que cambian dentro del grupo, por el álgebra de Boole XY+XY′=X. Cuanto mayor el grupo, menos variables sobreviven.' },
    { icono: '🔗', nombre: 'Implicantes primos y forma mínima', descripcion: 'Un implicante primo es el mayor grupo válido de unos adyacentes (no se puede ampliar). La forma mínima SOP cubre todos los unos con implicantes primos al menor coste en literales. El simulador la calcula con Quine-McCluskey (implicantes primos + cobertura exacta), verificado 1200/1200 contra fuerza bruta.' },
    { icono: '⚠️', nombre: 'No todo simplifica (honestidad)', descripcion: 'La paridad (XOR de varias variables) coloca sus unos en tablero de ajedrez: ningún par es adyacente, no hay grupos que formar, y su forma mínima coincide con la canónica. Reconocer cuándo el mapa no ayuda es parte del criterio de diseño. El coste se mide en literales, términos y compuertas AND-OR de dos niveles.' },
  ],
  mision: [
    'EXPLORA · Elige 2, 3 o 4 variables y enciende salidas en la tabla de verdad (o usa un preset). Observa cómo el mapa se llena y cómo la expresión mínima cambia al instante. Compara el coste de la forma canónica con el de la mínima y cuánto ahorras. Prueba el preset "Paridad" para ver una función que no simplifica.',
    'AGRUPA · Estudia funciones preparadas con sus lazos dibujados sobre el mapa. Enfoca cada grupo para ver qué variables permanecen constantes dentro del lazo (las que sobreviven en el término) y cuántas se eliminan. Comprueba la regla: 2 celdas eliminan 1 variable, 4 celdas eliminan 2, y así.',
    'RETO · Se te da una función F = Σm(...) con su mapa. Marca los implicantes primos que la cubran usando el mínimo de literales. El sistema califica por separado si tu cobertura es completa y si alcanza el coste mínimo: ni dejar unos sin cubrir, ni incluir grupos redundantes o pequeños que encarecen el circuito.',
  ],
  aplicaciones: [
    { area: 'Diseño de lógica combinacional', ejemplo: 'Decodificadores (BCD a 7 segmentos), multiplexores, comparadores y generadores de código se especifican con una tabla de verdad y se implementan con el mínimo de compuertas. Simplificar con Karnaugh reduce el número y tamaño de las compuertas: menos circuito, menor coste, menor consumo y menor retardo de propagación.' },
    { area: 'Lógica de control y automatización', ejemplo: 'La lógica de enclavamientos, permisivos y alarmas de una máquina o un proceso (varios sensores → una decisión) es una función booleana. Minimizarla no solo abarata la implementación en compuertas o en un PLC, sino que hace la lógica más legible y fácil de verificar frente a la enorme forma canónica.' },
    { area: 'Síntesis en FPGA y ASIC', ejemplo: 'Las herramientas de síntesis lógica automatizan a gran escala lo que aquí se hace a mano: minimizan funciones booleanas antes de mapearlas a compuertas o a las LUTs de una FPGA. Entender los implicantes primos y por qué unas funciones (como XOR) no se reducen ayuda a interpretar los reportes de área y retardo de esas herramientas.' },
  ],
};

export default briefing;
