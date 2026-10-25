import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Ultrasonido para espesor y corrosión",
  duracion: "40 min",
  teoria: "OT-193 · Ajusta velocidad y cero: los patrones de5 y15 mm deben quedar dentro de±0,05 mm. Palpador, patrones escalonados y trazaA-scan virtual. La velocidad c y el retardo τ0 se determinan con dos patrones del mismo material. El instrumento aporta sus tiempos de vuelo. τ=2d/c+τ0; dmed=cconfig(τ−τ0config)/2. Placa d(x)=10−4 exp(−((x−0,55)/0,14)²) mm. El eco recorre ida y vuelta. Incidencia normal, un solo eco y velocidad constante. Sin dispersión, acoplamiento variable, rugosidad, tamaño del haz ni interpretación de grietas. La animación del pulso se ralentiza×100000 para hacerlo visible. La sección de espesor está ampliada respecto del ancho para hacer visible la corrosión.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ultrasonido-espesor-corrosion.html"
};
export default catalogo;
