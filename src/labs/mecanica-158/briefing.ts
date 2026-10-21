import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-158",
  titulo: "Posicionamiento del coche: GNSS más sensor inercial (IMU) en un túnel",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Ayudas a un coche a saber dónde está cuando entra a un túnel y pierde la señal del GPS.\nAfuera, el GPS se equivoca unos metros. Adentro no hay GPS, y el coche sólo cuenta con un sensor de giro, un acelerómetro y sus ruedas.\nEl sensor de giro tiene un pequeño error de fábrica (sesgo), y ese error hace que la posición se aparte más y más conforme pasa el tiempo.\nTu trabajo: calcular cuánto se desvía, elegir el sensor, la frecuencia del GPS y cuánto confiar en él, y comprobar que el coche cruce el túnel sin perderse.`,
  conceptos: [
    { icono: '🛰️', nombre: 'GNSS y su calidad', descripcion: 'Da la posición con ruido de metros. Mientras más satélites se ven y mejor repartidos (HDOP bajo), menos error. En un túnel no se ve ninguno.' },
    { icono: '🧭', nombre: 'Sensor inercial (IMU)', descripcion: 'Un giroscopio y un acelerómetro permiten seguir la cuenta sin satélites, pero el sesgo del giroscopio hace que el error lateral crezca como ½·v·b·t².' },
    { icono: '🧮', nombre: 'Filtro de Kalman', descripcion: 'Mezcla GPS, IMU y ruedas, aprende los sesgos mientras hay cielo y dibuja un círculo de duda que crece sin señal. Un buen filtro es honesto: su círculo cubre el error real.' },
  ],
  mision: [
    'Calcula la desviación lateral que produce un sesgo de giroscopio en un túnel.',
    'Elige la clase de sensor, la frecuencia del GPS y la confianza para cruzar el túnel con el error final bajo el límite.',
    'Diagnostica por qué fallan otros ajustes: sesgo alto, sin ruedas, exceso de fe en el GPS o un filtro que presume.',
  ],
  aplicaciones: [
    { area: 'Conducción asistida', ejemplo: 'Saber en qué carril va el coche dentro de un túnel para mantener el carril o mostrar la ruta.' },
    { area: 'Navegación y mapas', ejemplo: 'Los navegadores siguen la ruta en túneles y estacionamientos con la fusión de GPS, IMU y velocidad de ruedas.' },
    { area: 'Vehículos autónomos y drones', ejemplo: 'Estimar su posición cuando el GPS se degrada entre edificios altos o se interfiere.' },
  ],
};

export default briefing;
