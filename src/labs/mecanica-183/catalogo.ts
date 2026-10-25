import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Dimensionado de un reductor cicloidal: excentricidad, carga y velocidad",
  duracion: "40 min",
  teoria: "OT-183 · Un eje de robot necesita entre8 y12 rpm. Debes elegir entrada y excentricidad sin rebasar las exigencias equivalentes del apoyo. Tacómetros de entrada/salida y registro de fuerza y aceleración equivalentes. 11 rodillos y10 lóbulos: ωsalida=−ωentrada/10. Entrada8 N·m, η=0,9: salida72 N·m. Exigencia ideal equivalente F=Tentrada/e; aceleración orbital eω². El perfil se deriva como envolvente desplazada de Q(u)=[Rcosu−ecos11u,Rsin u−esin11u], R=0,10 m, rodillo8 mm; P=Q−r n, con n normal unitaria exterior. Centro del disco e[cosθ,sinθ] y orientación−θ/10. Sólo geometría ideal y estimación equivalente de carga de entrada. F=T/e no es cálculo de reparto entre rodillos ni vida del rodamiento. Sin elasticidad, lubricación, holgura, carga dinámica del portador, desgaste o perfil comercial. Los pasadores de salida son estructurales; no se resuelve contacto en sus alojamientos.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/dimensionado-reductor-cicloidal.html"
};
export default catalogo;
