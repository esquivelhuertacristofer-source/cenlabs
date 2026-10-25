import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Volante bimasa: aislar las vibraciones de torsión del motor",
  duracion: "40 min",
  teoria: "El giro medio sigue pasando, pero las pequeñas oscilaciones se filtran. La rigidez y el amortiguamiento determinan qué parte del pulso atraviesa el volante. J1=0,18 y J2=0,12 kg·m²; Jred=J1J2/(J1+J2)=0,072. A 850 rpm y orden 2, ω=2·850·2π/60. Jred δ″+Bδ′+Kδ=24 sin(ωt) N·m: forzamiento equivalente de un pulso de 60 N·m aplicado a la primera masa. Solución compleja exacta; par interno Kδ+Bδ′ y calor medio B(ωδamp)²/2. El giro medio se superpone a las oscilaciones, conservando su reparto inercial. Sólo pequeña oscilación lineal en régimen permanente. Sin arranque, topes, muelles de rigidez variable, fricción seca, embrague, pendulares centrífugos o variación de régimen. La pérdida media usa amortiguamiento viscoso ideal. La animación amplifica únicamente la oscilación, no el giro medio.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/volante-bimasa-vibracion.html"
};
export default catalogo;
