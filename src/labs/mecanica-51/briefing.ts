import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-51",
  titulo: "Circuito Equivalente del Motor de Inducción por Ensayos",
  subtitulo: "Transformadores y máquinas eléctricas · Ensayos IEEE 112",
  acento: "#2A9D8F",
  duracion: 45,
  videoUrl: '',
  bienvenida: `Un motor de inducción es, eléctricamente, casi un transformador con el rotor como secundario en corto — pero "casi" esconde una rama entera del circuito que no se puede medir en un solo ensayo. Para caracterizar completamente un motor sin abrirlo, un técnico hace tres mediciones simples con el motor detenido y con el motor girando: una resistencia de CD, un ensayo sin carga y un ensayo con el rotor bloqueado. De esas tres mediciones —y nada más— se deriva el circuito equivalente completo del motor: cada resistencia, cada reactancia, y con ellas la curva de par que el motor puede entregar en cualquier punto de operación.

Este laboratorio te pone a hacer exactamente esos tres ensayos, en el orden y bajo las condiciones que exige la norma IEEE Std 112: CD con el motor apagado, vacío con el motor girando libre, y rotor bloqueado a frecuencia reducida para no distorsionar la medición. Tu misión es entender por qué cada ensayo aísla una parte distinta del circuito equivalente, por qué el ensayo de rotor bloqueado se hace deliberadamente a una frecuencia menor que la nominal, y cómo esas tres mediciones separadas se combinan en un solo circuito en T que predice el par de arranque y el par máximo del motor sin necesidad de llevarlo jamás a esas condiciones extremas en la práctica.`,
  conceptos: [
    { icono: '🔌', nombre: 'Ensayo de CD: la resistencia que no depende de la frecuencia', descripcion: 'Con el motor detenido y desenergizado, medir la resistencia entre dos terminales de línea (con el estátor en estrella) da dos devanados en serie: R1=Rll/2. Es la única de las tres mediciones que se hace en corriente directa, precisamente porque a CD no hay reactancia que estorbe la lectura.' },
    { icono: '🌀', nombre: 'Ensayo de vacío: aísla la rama de magnetización', descripcion: 'Con el motor girando sin carga en el eje, casi toda la corriente que toma de la línea va a magnetizar el núcleo y a vencer la fricción y ventilación — muy poca va al rotor, porque el deslizamiento es casi cero. Esto permite separar la impedancia de vacío (Znl) en su parte resistiva (pérdidas rotacionales, Prot) y su parte reactiva (Xnl, dominada por Xm).' },
    { icono: '🔒', nombre: 'Rotor bloqueado a frecuencia reducida: aísla la rama serie', descripcion: 'Con el rotor mecánicamente trabado, el deslizamiento es s=1 y el motor se comporta como un transformador con el secundario en corto — la corriente casi no pasa por la rama de magnetización y el ensayo aísla la impedancia serie (R1+R2\', X1+X2\'). Se hace a frecuencia reducida (≤25% de la nominal, IEEE 112 §5.9.1) porque a frecuencia nominal el efecto piel distorsiona la resistencia del rotor; la reactancia medida se corrige después, escalándola linealmente a la frecuencia nominal.' },
    { icono: '🧩', nombre: 'El circuito en T: por qué Xm no está en la fuente', descripcion: 'A diferencia de la aproximación simplificada de un transformador (donde la rama de magnetización se dibuja directamente en las terminales de la fuente porque Xm es enorme frente a X1), en un motor de inducción Xm es comparable en magnitud a X1 — así que la rama de magnetización se coloca correctamente DESPUÉS de R1+jX1, en paralelo con la rama del rotor. Esa diferencia de topología es la que permite calcular con precisión el par de arranque y el par máximo.' },
  ],
  mision: [
    'MIDE · Realiza los tres ensayos —CD, vacío y rotor bloqueado— en las condiciones exactas que exige IEEE 112, y observa qué parte del circuito equivalente aísla cada uno.',
    'DERIVA · Calcula R1, Xnl, Rbl y Xbl a partir de las lecturas de cada ensayo, aplicando la corrección de frecuencia donde corresponde.',
    'ENSAMBLA · Combina los tres resultados en el circuito equivalente en T completo (reparto NEMA Diseño B de X1/X2\') y ubica la rama de magnetización en su lugar correcto.',
    'PREDICE · Usa el circuito equivalente de Thévenin para trazar la curva par-deslizamiento completa y ubicar el par de arranque y el par máximo del motor.',
  ],
  aplicaciones: [
    { area: 'Caracterización de un motor sin datos de placa completos', ejemplo: 'Cuando un motor llega a mantenimiento sin ficha técnica legible o de un fabricante desconocido, los tres ensayos de IEEE 112 permiten reconstruir su circuito equivalente completo con instrumentos de taller —sin necesidad de una prueba destructiva ni de correr el motor a plena carga— y así predecir su comportamiento antes de reinstalarlo.' },
    { area: 'Verificación de motores nuevos antes de puesta en marcha', ejemplo: 'Los fabricantes reportan los parámetros del circuito equivalente en el reporte de pruebas de fábrica; repetir el ensayo de rotor bloqueado en sitio permite verificar que el motor no sufrió daño en el transporte comparando la impedancia serie medida contra la de fábrica.' },
    { area: 'Diagnóstico de fallas en el devanado del rotor', ejemplo: 'Un valor de R2\' anormalmente alto frente al de fábrica —obtenido del mismo ensayo de rotor bloqueado— es un indicador temprano de barras de rotor agrietadas o de mal contacto en los anillos de un rotor devanado, antes de que la falla se vuelva catastrófica.' },
  ],
};

export default briefing;
