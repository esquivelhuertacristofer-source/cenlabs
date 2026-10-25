import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Husillo de bolas: avance, par y velocidad crítica de un eje",
  duracion: "40 min",
  teoria: "Un paso mayor avanza más por vuelta, pero necesita más par para empujar la misma carga. Un eje largo limita el giro admisible. vmax = nmax p/60; T = Fp/(2πη), con F=3500 N y η=0,90. La carrera es x = 0,2[1−cos(ωt)] m, ω = vmax/0,2; θ = 2πx/p. Viga simplemente apoyada: ncr = 30π/L² √(EI/ρA); d=16 mm, L=1,2 m, E=210 GPa, ρ=7850 kg/m³. El límite elegido es 0,8 ncr. El empuje es cuasiestático y se informa su módulo; no es par de aceleración. Sin precarga, rozamiento variable, rigidez de apoyos reales, resonancia acoplada, inercia del carro, frenado, error de paso o recirculación dinámica de bolas. Las bolas visibles sólo representan la construcción de la tuerca.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/husillo-bolas-eje-lineal.html"
};
export default catalogo;
