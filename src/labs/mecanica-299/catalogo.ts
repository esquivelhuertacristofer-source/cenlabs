import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Paro de emergencia y contactores",
  duracion: "40 min",
  teoria: "K1 y K2 son contactos de potencia en serie en la arquitectura redundante. El paro se ordena a 2 s, el rearme se intenta a 5 s y se solicita una nueva marcha a 7 s. Con alimentación cortada, la velocidad decae como exp(−Δt/0,62 s). El ejemplo de subsistemas independientes suma PFHᴅ = 4×10⁻⁸ + 8×10⁻⁸ + 2×10⁻⁷ = 3,2×10⁻⁷ h⁻¹, dentro de la banda numérica d. Se simula una sola soldadura. La banda de PFHᴅ es ilustrativa y requiere revisar arquitectura, diagnóstico, fallos comunes y otros requisitos para determinar el PL de una función real.",
  estado: "activo",
  simuladorHtml: "/labs/paro-emergencia-contactores-edm.html"
};
export default catalogo;
