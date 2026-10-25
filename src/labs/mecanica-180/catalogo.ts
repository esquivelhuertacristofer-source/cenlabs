import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Alineación de una transmisión de doble Cardán: fase y ondulación de velocidad",
  duracion: "40 min",
  teoria: "OT-180 · Un eje transmite5 kW a300 rpm y necesita superar un obstáculo con al menos25° de desvío. Verifica fase y par pulsante antes de aceptar la transmisión. Dos tacómetros virtuales, traza de relación instantánea y registro de par. Junta simple: γ=atan2(cosβ sinθ,cosθ) con ángulo desenrollado. Segunda junta compensadora: ψ=atan2(sin(γ+δ),cosβ cos(γ+δ))−δ. Se derivan ambas transformaciones para la relación instantánea. Con δ=0 se obtiene ψ=θ. Entrada a300 rpm y potencia ideal constante5 kW: Tsalida=P/ωsalida. Se revisa una vuelta completa en721 posturas. Ángulos de junta iguales ejes de entrada/salida paralelos; error de fase δ impuesto. Sin elasticidad, desequilibrio, desgaste, fuerzas de rodamiento, holgura ni límites comerciales de velocidad. No es un procedimiento de alineación bajo un vehículo real. Las crucetas siguen las direcciones ortogonales deducidas de la cinemática.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/alineacion-doble-cardan.html"
};
export default catalogo;
