import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Engranes helicoidales: empuje y recubrimiento",
  duracion: "40 min",
  teoria: "OT-263 · Ajusta una pareja helicoidal para ganar continuidad de contacto sin sobrecargar el apoyo axial. Engranes exteriores sin corrección: módulo normal mn=3 mm, αn=20°, z1=24, z2=48, T1=30 N·m, n1=600 rpm. mt=mn/cosβ; tanαt=tanαn/cosβ; Ri=mt zi/2, rai=Ri+mn, rbi=Ri cosαt. Ft=T1/R1, Fa=Ft tanβ, Fr=Ft tanαt. εα=[√(ra1²−rb1²)+√(ra2²−rb2²)−(R1+R2)sinαt]/(πmt cosαt); εβ=b sinβ/(πmn); εγ=εα+εβ. ω2=−ω1 z1/z2. Flancos por involuta barrida: giro de sección=±z tanβ/R. Las líneas nominales de contacto se recortan por ambos círculos de cabeza y por el ancho. Geometría ideal de involuta y fuerzas estáticas sin pérdidas. No calcula flexión del diente, Hertz, lubricación, ruido ni vida de rodamientos. El recubrimiento es un promedio de pares en contacto, no el número instantáneo constante. Las líneas doradas indican contacto nominal; la malla incluye 0,05 mm de juego transversal para separar visualmente los flancos. Pie del diente radial simplificado, sin trocoide de herramienta. Giro mostrado ×1/100: 600/300 rpm reales, 6/3 rpm visibles. Fuerzas en el piñón: radial −X, tangencial −Y y axial +Z, escala común 0,00065 unidades/N. Banco abierto didáctico, no equipo comercial.",
  estado: "activo",
  simuladorHtml: "/labs/engranes-helicoidales-empuje.html"
};
export default catalogo;
