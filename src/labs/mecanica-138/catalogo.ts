import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Dinámica del Vehículo",
  titulo: "Diferencial y Reparto de Par en Curva",
  duracion: "35 min",
  teoria: "El diferencial obliga a que ω_L + ω_R = 2·ω_caja: a 36 km/h en una curva de 25 m la rueda interior gira a 299 rpm, la exterior a 318 y la caja a 308. Con hielo (μ = 0,25) bajo la interior, un diferencial abierto sólo pasa a cada rueda el par que aguanta la peor: 1 065 N de tracción, 0,59 m/s². Un autoblocante con TBR 3 lleva la tracción a 2 260 N (1,42 m/s²), pero reparte el par desigual y mete un momento de guiñada de 876 N·m. Con buen agarre en las dos ruedas y 20 % de acelerador, ese mismo autoblocante da ΔM = −550 N·m (subvira) y una vectorización de 800 N·m da +1 100 N·m. Es un modelo didáctico de régimen casi estacionario, no un ensayo de banco.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/diferencial-reparto-de-par.html",
};

export default catalogo;
