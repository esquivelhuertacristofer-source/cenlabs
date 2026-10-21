import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Posicionamiento del coche: GNSS más sensor inercial (IMU) en un túnel",
  duracion: "40 min",
  teoria: `Sin GPS dentro de un túnel, el coche navega a ciegas con un sensor inercial y sus ruedas, y el sesgo del giroscopio hace que el error lateral crezca como ½·v·b·t² (con 20 m/s, 0,05 °/s y 30 s son 7,85 m). Un filtro de Kalman fusiona GNSS (error de metros, σ = 2,0 m·HDOP), IMU y odometría, aprende los sesgos y reporta su duda (NEES). En el túnel de 520 m el IMU básico se aparta 25,8 m, el de consumo 5,9 m y el industrial 1,0 m; fiarse demasiado del GPS correlacionado (NEES 241 a 10 Hz en el cañón urbano) hace que el filtro presuma de una precisión que no tiene.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/posicionamiento-gnss-imu.html",
};

export default catalogo;
