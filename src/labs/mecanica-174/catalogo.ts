import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Limpiaparabrisas de cuatro barras: de giro continuo a barrido",
  duracion: "40 min",
  teoria: "La manivela da vueltas completas; la biela empuja un balancín. Las longitudes determinan cuánto barre y si aparece una mala postura de transmisión. Bancada d=0,20 m; balancín c=0,12 m. A=r[cosθ,sinθ], θ=πt. B es la intersección de un círculo de radio b centrado en A y otro de radio c centrado en [d,0]. Se conserva una rama de montaje. El ángulo de transmisión sale de cos γ=(b²+c²−|A−O2|²)/(2bc), tomando el ángulo agudo equivalente. Reto: 361 posturas por vuelta, barrido máximo menos mínimo del balancín. Sin holguras, elasticidad, fuerzas en articulaciones, roce de goma, área limpiada, lluvia ni regulación electrónica. La orientación del conjunto puede ajustarse al montar: se estudia la amplitud angular, no una homologación del barrido sobre un vidrio comercial. Si no cierran los círculos, se conserva la última postura y se avisa.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/limpiaparabrisas-cuatro-barras.html"
};
export default catalogo;
