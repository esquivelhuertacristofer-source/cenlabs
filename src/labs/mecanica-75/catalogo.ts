import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Puesta a Tierra y Resistencia de Tierra",
  duracion: "30 min",
  teoria: "Todo sistema eléctrico necesita una puesta a tierra de baja resistencia para desviar corrientes de falla y descargas atmosféricas, proteger a las personas y permitir que operen las protecciones. Diseñarla exige dos pasos. Primero se MIDE la resistividad del terreno (ρ, en Ω·m), la propiedad del suelo que determina qué tan buen conductor es: se usa el método de Wenner de cuatro electrodos equidistantes separados una distancia a, inyectando corriente por el par exterior y midiendo la tensión en el par interior; el telurómetro obtiene R=ρ/(2πa) y de ahí se despeja ρ=2π·a·R. En un suelo homogéneo la resistividad es constante aunque se cambie la separación a: es propiedad del suelo, no del arreglo de medición. Segundo, se DIMENSIONA el electrodo: la resistencia a tierra de una varilla vertical se calcula con la fórmula de Dwight R₁=ρ/(2πL)·[ln(8L/d)−1], donde L es la longitud, d el diámetro de la varilla (copperweld 5/8\" = 0.0159 m); varias varillas alejadas en paralelo dan R_N≈R₁/N. El objetivo es bajar de la resistencia normativa: 25 Ω en general, 10 Ω deseable y 5 Ω en subestaciones o pararrayos. La lección clave es honesta: en suelos muy resistivos (arena seca, roca) ni ocho varillas de seis metros bajan de 25 Ω, y entonces hay que recurrir a mallas de tierra, anillos perimetrales o tratamiento del terreno con bentonita o compuestos mejoradores (GEM).",
  estado: "activo",
  simuladorHtml: "/labs/puesta-a-tierra-wenner.html",
};

export default catalogo;
