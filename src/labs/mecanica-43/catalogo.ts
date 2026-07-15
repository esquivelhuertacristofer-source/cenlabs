import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Termopar, RTD e Infrarrojo: Medición de Temperatura",
  duracion: "35-45 min",
  teoria:
    'Un termopar genera un voltaje por efecto Seebeck proporcional a la diferencia de temperatura entre su punta y su unión de referencia; sin compensación de junta fría (CJC), el lector interpreta esa unión como si estuviera a 0 °C y lee sistemáticamente de menos (IEC 60584). Una RTD Pt100 cambia su resistencia de forma casi lineal con la temperatura (R₀=100 Ω, α≈0.00385 °C⁻¹, IEC 60751); en conexión a 2 hilos, la resistencia de los cables de extensión se suma a la de la RTD, error que la conexión a 4 hilos (Kelvin) elimina. Una pistola infrarroja infiere la temperatura a partir de la radiación emitida asumiendo un valor de emisividad configurado por el usuario: si ese valor no coincide con la emisividad real de la superficie, el error de lectura puede superar 100 °C sobre metales pulidos o brillantes.',
  estado: "activo",
  simuladorHtml: "/labs/termopar-rtd-infrarrojo.html",
};

export default catalogo;
