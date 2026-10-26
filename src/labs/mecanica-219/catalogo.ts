import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Cambiador de herramientas: secuencia por bloques",
  duracion: "40 min",
  teoria: "OT-219 · Verifica el programa de nueve bloques; usa cota ≥150 mm, velocidad ≤0,7 m/s, par ≤0,7 N·m y ciclo ≤8,5 s. Brazo doble, husillo, herramientas y editor de secuencia por bloques. Preflight de nueve comandos: orientar, subir, tomar, desbloquear, extraer, girar, insertar, bloquear y liberar. Giro π con perfil quintico s=10u³−15u⁴+6u⁵. Radio físico 0,22 m, dos herramientas de 1,4 kg: J=2mr². vmax=r·1,875π/T; τmax=J·(10√3/3)π/T². Tiempos restantes sintéticos y cota/150 s para elevar. Autómata didáctico de preflight, no lógica de un control Haas ni PLC de seguridad. Una permutación incoherente o cota insuficiente detiene la demostración antes de mover. Movimiento y tiempos de agarre prescritos; sin contacto FEM, flexibilidad, presión neumática o verificación de un equipo real. La secuencia se edita con bloques reordenables; no exporta código de máquina.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/cambiador-herramientas-bloques.html"
};
export default catalogo;
