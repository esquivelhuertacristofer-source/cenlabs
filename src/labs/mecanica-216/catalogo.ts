import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Inspección de engranajes: juego y contacto",
  duracion: "40 min",
  teoria: "OT-216 · Ajusta juego 0,10–0,20 mm, contacto ≥90 % y carga lineal máxima ≤1,6 veces la media. Par de engranes, comparador de inversión y visor de contacto. Engranes rectos de 20/40 dientes, módulo 2 mm y ángulo de presión 20°. Juego j=0,08+2Δa tan(20°) mm, aproximación para desplazamientos pequeños. Contacto de fundación elástica: q(x)=K max(0,δ−x tanβ), K=1000 N/mm²; ∫q dx=400 N en b=20 mm. Inversión con operador de juego de semiancho j/(2rp), rp=20 mm, y relación 1:2. No simula contacto Hertziano, lubricación, flexión detallada del diente ni certificación de engranes. El mapa de tinta es un indicador esquemático del reparto lineal de carga, no una huella predictiva 3D. El indicador de inversión amplía el error angular 90 veces; el falso color muestra carga relativa. Giro de inspección alternativo, cuasiestático; sin impacto ni vibración dinámica.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/inspeccion-engranajes-contacto.html"
};
export default catalogo;
