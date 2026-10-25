import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Reflectometría TDR de un cable",
  duracion: "40 min",
  teoria: "OT-202 · Resuelve ≤0,6 m, requiere ≤80 MHz y deja el valor absoluto de la reflexión final ≤0,05. Reflectómetro, generador gaussiano, terminador y cable seccionado. Cable 18 m, Z0=100 Ω, velocidad 0,66c. Γ=(R−Z0)/(R+Z0). Ecos sintéticos de primer orden en 6 y 7 m. Pulso gaussiano g(t)=exp[−4 ln 2(t/τ)²], τ=FWHM. Ancho de banda a−3 dB=√2 ln 2/(πτ). Resolución espacial del escenario=vτ/2, por la ida y vuelta. Superposición de ecos débiles sin atenuación distribuida, dispersión, reflexiones múltiples ni conectores reales. La resolución es una anchura espacialFWHM, no especificación de un equipo comercial. El punto luminoso indica el viaje de la onda, no luz real dentro del cable.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/reflectometria-cable-tdr.html"
};
export default catalogo;
