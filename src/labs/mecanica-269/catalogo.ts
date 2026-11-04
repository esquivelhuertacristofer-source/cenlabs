import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Elementos de Máquina",
  titulo: "Cuatro barras: diseña una trayectoria",
  duracion: "40 min",
  teoria: "OT-269 · Selecciona acoplador y balancín para reproducir una trayectoria de trazado sin degradar la transmisión. Mecanismo plano: apoyos O=(0,0),D=(140,0) mm; manivela r=40 mm, giro uniforme7,5 rpm (una vuelta real en8 s). A=r(cosθ,sinθ). B es la intersección positiva de círculos de radios a,b centrados en A,D. Con dvec=D−A,s=|dvec|,u=dvec/s: x=(a²−b²+s²)/(2s),h=√(a²−x²),B=A+xu+h(−uy,ux). Punto P=A+0,65(B−A)+25mm·nAB. Se comparan360 fases uniformes con la plantilla propia fija: RMS=√[Σ|P−Pobjetivo|²/360], además del error máximo. Ángulo de transmisión agudo μ=acos|[(A−B)·(D−B)]/(ab)|. Se toma el mínimo durante360°. Velocidades por derivación del cierre: vB=vA+αdot k×(B−A)=βdot k×(B−D); vP se deriva en el mismo sistema. Cinemática de barras rígidas y articulaciones ideales; sin pares, masas, elasticidad, fricción ni dinámica de motor. El objetivo es una trayectoria propia, no perfil de una máquina comercial. Error comparado en la misma fase de entrada, no distancia al punto más cercano ni ajuste libre de giro/escala. Rango completo Grashof estricto; las circunferencias se cortan sin tangencia durante toda la vuelta. El programa rechaza geometrías que no cierran fuera del rango. Planos axiales separados para evitar choques; pasadores unen las piezas y el soporte fijo. Longitudes a20 unidades/m; barras con chaflán y holgura ilustrativa. La línea dorada es la plantilla espacial objetivo, no una medida experimental. La línea turquesa acumula posiciones del lápiz durante una vuelta después de cada cambio de mandos; la predicción completa se reserva al instrumento después de validar. No se deducen fuerzas ni seguridad de máquina del ángulo por sí solo.",
  estado: "activo",
  simuladorHtml: "/labs/cuatro-barras-sintesis-trayectoria.html"
};
export default catalogo;
