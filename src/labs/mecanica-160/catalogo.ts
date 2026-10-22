import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Llenado de un tanque de hidrógeno a 700 bar: el calor de la compresión",
  duracion: "40 min",
  teoria: "El hidrógeno a 700 bar es un gas real (Abel–Noble, Z ≈ 1,45): pesa 40,5 kg/m³ y un tanque de 125 L guarda 5,07 kg. Al llenarlo, el gas se calienta por compresión y por la entalpía de entrada: con gas a −40 °C y 25 MPa/min se llena en 191 s con un máximo de 74 °C y 0,208 kWh/kg de enfriamiento, mientras que a temperatura ambiente el llenado se corta a los 34 s con 29 % de carga al llegar a 85 °C. El reto es elegir rampa y pre-enfriamiento en una ventana interior.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/llenado-hidrogeno-700-bar.html",
};

export default catalogo;
