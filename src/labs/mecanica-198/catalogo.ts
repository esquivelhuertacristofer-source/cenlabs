import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Alineación láser de maquinaria",
  duracion: "40 min",
  teoria: "OT-198 · Deja desplazamiento≤0,03 mm y ángulo≤0,1 mrad ajustando ambos apoyos. Cabezal láser, receptor, apoyos y registro de alineación. Desalineación inicial:0,35 mm y0,6 mrad. Apoyos a200 y600 mm del acople. Pendiente corregida=0,6+(hr−hf)/0,4 mrad; offset=0,35+hf−0,2(hr−hf)/0,4 mm. Sólo plano vertical y ejes rígidos. Correcciones firmadas representan posicionamiento equivalente, no retirar calzas físicamente inexistentes. Sin pie cojo, crecimiento térmico ni tolerancias normativas. Desviación visual amplificada×100.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/alineacion-laser-maquinaria.html"
};
export default catalogo;
