import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Incertidumbre GUM y Trazabilidad Metrológica",
  duracion: "35-45 min",
  teoria:
    'La incertidumbre de medición (GUM, JCGM 100:2008) cuantifica el rango de valores razonablemente atribuible a una medición. La incertidumbre Tipo A se evalúa estadísticamente a partir de lecturas repetidas (u_A = s/√n); las incertidumbres Tipo B provienen de otras fuentes, como la resolución del instrumento (u = resolución/√12) o el certificado de calibración de un patrón (u = U/k). Todas se combinan por suma cuadrática (u_c = √Σuᵢ²) y se multiplican por un factor de cobertura k para obtener la incertidumbre expandida U = k·u_c que se reporta. La trazabilidad metrológica (VIM, JCGM 200:2012) es la cadena documentada de calibraciones —en México, de CENAM a un laboratorio acreditado EMA y de ahí al instrumento de taller— que vincula cada medición a una referencia, y cuyo contenido mínimo en un certificado está definido por ISO/IEC 17025:2017 §7.8.',
  estado: "activo",
  simuladorHtml: "/labs/incertidumbre-trazabilidad.html",
};

export default catalogo;
