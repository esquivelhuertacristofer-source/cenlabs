import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Corrección de Factor de Potencia: Diseña el Banco de Capacitores",
  duracion: "30 min",
  teoria: "Una carga inductiva consume potencia reactiva Q para magnetizarse, lo que reduce su factor de potencia FP=cos θ por debajo de 1 y obliga a sobredimensionar la instalación eléctrica que la alimenta — por eso CFE exige un FP mínimo (0.90 en cargas menores a 1 MW) y penaliza económicamente cuando cae por debajo. La corrección estándar es instalar un banco de capacitores en paralelo con la carga: el capacitor aporta potencia reactiva de signo contrario, cancelando parte de la Q original sin tocar P. La cantidad necesaria es Qc=P·(tan φ₁−tan φ₂), donde φ₁ es el ángulo de potencia actual y φ₂ el ángulo objetivo (típicamente FP=0.95). Los bancos comerciales vienen en pasos estándar discretos (5 a 50 kVAR por unidad), así que diseñar el banco es una combinatoria: encontrar qué pasos conectar para caer dentro de la banda de cumplimiento, minimizando el kVAR total instalado.",
  estado: "activo",
  simuladorHtml: "/labs/correccion-factor-potencia.html",
};

export default catalogo;
