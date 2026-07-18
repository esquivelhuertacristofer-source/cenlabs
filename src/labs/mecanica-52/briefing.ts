import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-52",
  titulo: "Interpreta Placas de Datos y Selecciona Motores",
  subtitulo: "Transformadores y máquinas eléctricas · NEMA MG-1 · NOM-016-ENER-2025",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `La placa de un motor de inducción es, en unos cuantos centímetros de metal grabado, todo lo que necesitas saber para decidir si ese motor sirve para tu aplicación —o si va a fallar en el arranque, a sobrecalentarse en tres meses, o a disparar la protección cada vez que arranca una carga pesada. El problema es que la placa habla en un código que no es obvio: una letra sola (¿qué significa "F"?), un número con dos decimales llamado Factor de Servicio, una letra de "Diseño" que no tiene nada que ver con la letra de código. Cada uno de esos campos es la salida comprimida de una norma completa.

En este laboratorio vas a aprender a leer esa placa como lo hace un ingeniero: a traducir la letra de código NEMA MG-1 en un rango de corriente de arranque real en amperes, a usar el Factor de Servicio para saber cuánta sobrecarga continua puede tolerar el motor sin dañarse, y a distinguir el Diseño NEMA (B, C o D) que determina si el motor puede arrancar la carga que le vas a conectar. Al final, vas a enfrentar el ejercicio real de un técnico de planta: te dan los requisitos de una aplicación y un motor candidato, y tienes que decidir —con los cuatro criterios normativos, no por intuición— si ese motor es el correcto o no.`,
  conceptos: [
    { icono: '🏷️', nombre: 'La placa como fuente normada, no como sugerencia', descripcion: 'Cada campo de la placa de datos (HP, voltaje, frecuencia, RPM, factor de potencia, eficiencia, Factor de Servicio, letra de código, Diseño NEMA) está definido por NEMA MG-1 y debe leerse en el orden y con el significado que la norma establece —no son datos sueltos, son un contrato de desempeño del fabricante.' },
    { icono: '⚡', nombre: 'Letra de código: la corriente de arranque escondida en una letra', descripcion: 'La letra de código (A a V, sin I ni O) traduce a un rango de kVA por HP a rotor bloqueado. Combinada con el HP y el voltaje de línea, esa letra permite calcular el rango real de corriente de arranque en amperes —el dato que decide si la protección del circuito derivado va a disparar o no en el arranque.' },
    { icono: '🛡️', nombre: 'Factor de Servicio: margen, no invitación', descripcion: 'El Factor de Servicio (FS) multiplica el HP nominal para dar el HP continuo máximo que el motor puede entregar sin exceder su límite térmico de diseño —pero operar cerca de ese límite de forma sostenida reduce la vida útil del aislamiento. Es un margen de ingeniería, no una recomendación de operación permanente.' },
    { icono: '⚙️', nombre: 'Diseño NEMA: el motor correcto para la carga correcta', descripcion: 'Los Diseños B, C y D describen curvas par-deslizamiento distintas: B para uso general, C para arranques con carga ya conectada y baja corriente de inrush, D para cargas de alta inercia o pulsantes. Elegir el Diseño equivocado para una carga no es un error cosmético: el motor puede no arrancar, o dañarse en el intento.' },
  ],
  mision: [
    'EXPLORA · Recorre los 9 campos de la placa de datos y entiende qué significa cada uno según NEMA MG-1, incluyendo por qué la eficiencia mostrada en la placa NO se clasifica con las etiquetas IE1–IE4 en México.',
    'CALCULA CORRIENTE · Usa la letra de código junto con el HP y el voltaje para calcular el rango de corriente de arranque a rotor bloqueado del motor.',
    'CALCULA FACTOR DE SERVICIO · Determina el HP continuo máximo permitido por el Factor de Servicio y entiende su relación con la vida útil del aislamiento.',
    'SELECCIONA · Enfréntate a un motor candidato y una aplicación con requisitos definidos, y decide —evaluando los 4 criterios normativos— si el motor es apto o cuál criterio incumple.',
  ],
  aplicaciones: [
    { area: 'Selección de motor de repuesto en mantenimiento de planta', ejemplo: 'Cuando un motor falla y hay que reemplazarlo con lo disponible en almacén, leer correctamente la letra de código y el Factor de Servicio del candidato evita instalar un motor que dispare la protección al arrancar o que se sobrecaliente bajo la carga real de la línea de producción.' },
    { area: 'Coordinación de protecciones eléctricas', ejemplo: 'El calibre del alimentador y el ajuste del arrancador/protección térmica se dimensionan a partir de la corriente de arranque calculada desde la letra de código de la placa —un cálculo mal hecho aquí puede dejar el motor sin protección o con disparos falsos constantes.' },
    { area: 'Cumplimiento normativo en proyectos nuevos', ejemplo: 'NOM-016-ENER-2025 exige que los motores nuevos instalados en México cumplan con los mínimos de eficiencia de su Tabla 1 —un ingeniero de proyecto debe saber leer la placa y no confundir esa tabla con las clases IE internacionales al momento de aceptar un equipo del proveedor.' },
  ],
};

export default briefing;
