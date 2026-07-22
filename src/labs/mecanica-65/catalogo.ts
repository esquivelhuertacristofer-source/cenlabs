import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Transitorio RL y Sobretensión Inductiva: el Diodo de Rueda Libre",
  duracion: "35 min",
  teoria: "Un inductor se opone a cambios bruscos de corriente (v=L·di/dt). Al energizar un circuito RL serie, la corriente —y por tanto v_R— sube exponencialmente con τ=L/R; al interrumpir la corriente sin dar una ruta alterna, el colapso súbito de corriente genera una sobretensión destructiva en el interruptor. Este laboratorio mide τ en un osciloscopio simulado y compara la interrupción segura (con diodo de rueda libre) contra la interrupción sin protección.",
  estado: "activo",
  simuladorHtml: "/labs/transitorio-rl.html",
};

export default catalogo;
