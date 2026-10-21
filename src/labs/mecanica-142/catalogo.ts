import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Mild Hybrid de 48 V y Start-Stop: el Alternador-Arrancador",
  duracion: "40 min",
  teoria: "Un motor de gasolina al ralentí quema combustible sin mover el coche. En el ciclo urbano de este laboratorio (1,33 km, 75 s con el motor apagado) un coche convencional gasta 9,08 L/100 km; con start-stop gasta 7,88 (13 %), y con un alternador-arrancador de 48 V que recupera al frenar hasta 12 kW y asiste 1,2 kW baja a 7,07 L/100 km (22 %). El BSG arranca el motor caliente en 0,48 s con 1,3 kJ eléctricos; el motor se modela con la línea de Willans (combustible = (P + P_fricción)/η_i), el paquete de 10 A·h como V_oc(SOC) con R = 40 mΩ y todo el ciclo cierra su balance de energía. El óptimo está en el interior: un umbral de parada de unos 6 km/h (donde el embrague se abre) y una asistencia que deja el SOC final en 60 %. Es un modelo didáctico casi estático, no un ensayo de homologación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/mild-hybrid-48v-start-stop.html",
};

export default catalogo;
