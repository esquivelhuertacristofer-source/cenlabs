import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Volante de inercia: almacenar energía sin exceder el esfuerzo del aro",
  duracion: "40 min",
  teoria: "Un radio o giro mayor guarda más energía, pero también aumenta la tensión que tiende a abrir el aro. El motor-generador entrega un pulso y recupera la energía. Aro delgado de masa fija 25 kg: J=mr², E=Jω²/2, tensión de aro σ=ρr²ω² con ρ=7800 kg/m³. Velocidad mínima de servicio 5000 rpm. Energía útil = E0−Emin. Pulso ideal de 40 kW durante hasta 3 s, limitado por Emin; recarga desde el segundo 5 durante el mismo tiempo. ω(t)=√(2E/J), ángulo por integración analítica de la raíz. Ciclo de energía de 8 s físicos. Esfuerzo circunferencial de aro delgado; no es la fórmula de un disco macizo. Sin tensiones de montaje, defectos, fatiga, rodamientos magnéticos activos, pérdidas de vacío, pérdidas eléctricas, contención de fragmentos o FEM. La carcasa y motor son estructurales. El criterio de 350 MPa es didáctico y no certifica un rotor real. Se reinicia el ciclo de energía cada 8 s físicos.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/volante-inercia-almacenamiento.html"
};
export default catalogo;
