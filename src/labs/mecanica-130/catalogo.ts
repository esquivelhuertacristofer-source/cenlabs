import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Caja de Doble Embrague (DCT): cambio sin interrupción de par",
  duracion: "40 min",
  teoria: "Una caja de doble embrague preselecciona la marcha siguiente en el otro árbol y cambia pasando el par de un embrague al otro. En la fase de par el embrague entrante sube y el saliente baja sin que caiga el par de salida; en la fase de inercia el motor (Je·dωe/dt = Te − Tc1 − Tc2) baja al régimen sincrónico y cada embrague disipa E = ∫Tc·Δω dt. En un 1→2 a 3 500 rpm y pedal al 85 % el régimen sincrónico es 2 110 rpm; con rampa de 260 ms y reducción de par del 22 % el cambio dura 1,02 s, el tirón máximo es 11,4 m/s³ y se disipan 16,2 kJ. Sin reducción de par el motor no baja: no sincroniza y el calor sube a 56 kJ; con rampa de 90 ms el tirón sube a 29 m/s³.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/transmision-doble-embrague.html",
};

export default catalogo;
