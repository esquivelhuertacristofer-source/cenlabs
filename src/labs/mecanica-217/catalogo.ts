import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Impedancia de batería: ajuste de un circuito equivalente",
  duracion: "40 min",
  teoria: "OT-217 · Ajusta el espectro medido hasta obtener residuo complejo RMS ≤0,6 mΩ y coherencia de la constante dinámica. Celda virtual en corte, conexión Kelvin y analizador Nyquist/Bode. Circuito reducido Rs+(Rct∥C), Rs=8 mΩ conocido. Z=Rs+Rct/(1+j2πf Rct C); 41 frecuencias de 0,1 a 1000 Hz. Datos sintéticos sin ruido. Frecuencia característica fc=1/(2πRct C). Excitación ilustrativa a 1 Hz y 0,1 A; tensión incremental obtenida del mismo circuito medido. Resistencia y capacidad desconocidas se ajustan a los datos. No es un modelo electroquímico completo ni estima salud, capacidad útil o seguridad de una batería real. Sin difusión Warburg, CPE, inductancia de cables, SOC, temperatura o no linealidad. Capas y portadores en 3D son un esquema físico ampliado; la medición se presenta en DOM. La prueba no controla una batería ni un potenciostato real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/impedancia-bateria-eis.html"
};
export default catalogo;
