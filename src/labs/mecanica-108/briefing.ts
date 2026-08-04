import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: 'MEC-108',
  titulo: 'Calcula Pérdidas de Carga y Selecciona Conducciones',
  subtitulo: 'Hidráulica y Neumática · Darcy–Weisbach, Reynolds y coste de propiedad',
  acento: '#EFB13A',
  duracion: 45,
  videoUrl: '',
  bienvenida: `Delante tienes cinco tramos de una misma central hidráulica: la aspiración de la bomba, la línea de presión hasta la válvula, el retorno al depósito, el drenaje de carcasa del motor y una línea larga que alimenta un actuador a 26 metros. Para cada uno hay que elegir tres cosas: qué conducción se monta —entre 19 referencias de tubo de acero, manguera de dos trenzas y manguera de espiral—, por dónde va —directa, perimetral o compacta— y cuántas líneas se ponen en paralelo. Son 855 montajes posibles y sólo 192 aguantan los siete criterios de la instalación.

La cadena de cálculo es la misma en los cinco tramos y se ve entera en pantalla. El caudal y el diámetro interior dan la velocidad; el trazado da la longitud real y, sobre todo, la longitud equivalente de los accesorios, que se cuenta en diámetros: 30 D cada codo, 20 D cada te, 8 D la válvula, 20 D la entrada y 40 D la salida. Con la longitud equivalente, la viscosidad a la temperatura de régimen y la rugosidad relativa sale el número de Reynolds; el factor de fricción es 64/Re mientras el flujo es laminar y Colebrook–White cuando es turbulento. Y con el factor de fricción, Darcy–Weisbach entrega la caída de presión.

Ahí empiezan las sorpresas. En la aspiración, el trazado compacto ahorra 36 centímetros de manguera y añade 10,31 metros equivalentes, porque mete diez codos donde había dos. En la línea larga, la misma tubería que pierde 0,6018 bar a 50 °C pierde 18,1492 bar a −5 °C: treinta veces más, exactamente el factor en que crece la viscosidad, porque en laminar la pérdida es proporcional a ν. Y en la línea de presión, el tubo de 22 milímetros que parece sobrado para 210 bar se cae por el golpe de ariete: a 3,930 m/s, cerrar de golpe levanta 43,52 bar sobre los 210 de trabajo y se pasa de los 223 bar que Barlow le concede.

El laboratorio cierra con la pregunta que se hace un jefe de mantenimiento y casi nunca un estudiante: cuánto cuesta esa conducción a cinco años. La energía que se disipa en la línea la paga el motor eléctrico —con rendimiento de grupo 0,80 y 0,18 €/kWh—, y en la línea de presión, el montaje más barato de comprar (192,00 €) termina costando 512,59 €, mientras que el que cuesta 242,40 € de compra cierra en 314,61 €. Elegir por precio de etiqueta sale un 63 % más caro.`,
  conceptos: [
    {
      icono: '📉',
      nombre: 'Darcy–Weisbach y longitud equivalente',
      descripcion: 'Δp = f·(L_eq/D)·ρv²/2. La longitud que entra en la fórmula no es la que mide la cinta: los accesorios se cuentan en diámetros y en la aspiración llegan a ser el 65,1 % del total.',
    },
    {
      icono: '🌀',
      nombre: 'Reynolds, laminar y Colebrook–White',
      descripcion: 'Re = v·D/ν decide la fórmula del factor de fricción: 64/Re por debajo de 2 000, Colebrook–White por encima de 4 000, y una banda de transición entre ambos donde la instalación no debe trabajar.',
    },
    {
      icono: '🧊',
      nombre: 'Viscosidad y arranque en frío',
      descripcion: 'La viscosidad del ISO VG 46 pasa de 29,97 cSt a 50 °C a 903,97 cSt a −5 °C según Walther/ASTM D341. En laminar la pérdida crece con ella: los mismos 0,6018 bar se vuelven 18,1492.',
    },
    {
      icono: '🔨',
      nombre: 'Golpe de ariete y coste de propiedad',
      descripcion: 'Korteweg da la celeridad (1 273 m/s en tubo, 350 y 240 en manguera) y Joukowsky el pico: Δp = ρ·c·v. Y a cinco años, la energía disipada decide qué conducción es realmente la barata.',
    },
  ],
  mision: [
    'RECONOCE el banco: 19 conducciones (11 tubos de acero, 6 mangueras de dos trenzas, 2 de espiral), 3 trazados y 3 líneas en paralelo, sobre 5 faenas — 855 montajes de los que sólo 192 son válidos.',
    'CUENTA la longitud equivalente en diámetros: 30 D por codo, 20 D por te, 8 D la válvula, 20 D la entrada, 40 D la salida. Compara los 88 D del trazado directo con los 368 D del compacto en la aspiración.',
    'CALCULA el Reynolds y elige la fórmula del factor de fricción; contrasta Colebrook–White por punto fijo con la explícita de Swamee–Jain y comprueba cuánto se apartan.',
    'ENFRÍA la instalación a la temperatura de arranque y observa cómo la pérdida de la línea larga se multiplica por 30,2 cuando la viscosidad hace lo mismo — 0,6018 bar pasan a 18,1492.',
    'MIDE el golpe de ariete: celeridad de Korteweg, pico de Joukowsky y límite de Barlow con coeficiente 4. Descubre por qué una manguera absorbe el golpe que un tubo transmite entero.',
    'CENSA los siete criterios faena por faena y averigua cuál tumba más montajes él solo: el arranque en frío invalida 108 sin ayuda de nadie, y la compatibilidad de presión invalida 162 pero nunca en solitario.',
    'COMPARA comprar contra poseer: en la línea de presión, 192,00 € de compra terminan en 512,59 € a cinco años, y 242,40 € terminan en 314,61 €.',
    'RETO · Selecciona conducción, trazado y número de líneas para la faena que te toque, de forma que pase los siete criterios y sea la de menor coste de propiedad a cinco años. La solución es única en las cinco faenas.',
  ],
  aplicaciones: [
    {
      area: 'Ingeniería de la instalación hidráulica',
      ejemplo: 'Dimensionar la aspiración de una central es lo que decide si la bomba caviteta o no: el laboratorio calcula la presión absoluta en la boca restando a la atmosférica la pérdida de la línea y la columna de aceite, y sólo 17 de 171 montajes la mantienen por encima del límite en régimen y en frío.',
    },
    {
      area: 'Mantenimiento y eficiencia energética',
      ejemplo: 'Una línea mal dimensionada no avisa: funciona. Lo que hace es disipar potencia cada hora de servicio. Poner cifras a esos vatios —y multiplicarlos por las horas de servicio de la faena, que en la línea de presión son 4 000 al año, por cinco años y por 0,18 €/kWh— es la forma de justificar un cambio de tubería ante quien firma el gasto.',
    },
    {
      area: 'Puesta en marcha en clima frío',
      ejemplo: 'Muchas averías de arranque no son averías: son viscosidad. La línea larga que a 50 °C pierde 0,6018 bar pierde 18,1492 a −5 °C, y no por avería alguna: la viscosidad ha crecido treinta veces. El criterio de arranque en frío de esta práctica es, él solo, el que más montajes invalida. El paso siguiente —control en lazo cerrado de la posición de un actuador— es materia de la práctica d4-A4.',
    },
  ],
};

export default briefing;
