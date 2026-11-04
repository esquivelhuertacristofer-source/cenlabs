import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Servo con tres lazos en cascada",
  duracion: "40 min",
  teoria: "Consigna θ=1,3 rad. ω*=sat(Kθ·error,±4). i*=sat((bω+Jλv(ω*−ω))/Kt,±3). El lazo cerrado de corriente se aproxima por di/dt=60(i*−i). J·dω/dt=Kt·i−bω−T_carga y dθ/dt=ω. J=0,02 kg·m², b=0,055 N·m·s, Kt=0,22 N·m/A. A los 2 s entra una carga de 0,012 N·m. Paso de 2 ms. Modelo equivalente con lazo interno de corriente ideal de primer orden. La velocidad usa compensación de fricción nominal y acción proporcional. La carga constante deja error estacionario en este ajuste. Sin dinámica de convertidor, holgura ni elasticidad de la correa. El carro avanza 0,42 unidades de escena por radián.",
  estado: "activo",
  simuladorHtml: "/labs/servo-posicion-velocidad-corriente.html"
};
export default catalogo;
