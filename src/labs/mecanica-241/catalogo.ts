import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot de centro remoto: orientar sin desplazar el pivote",
  duracion: "40 min",
  teoria: "OT-241 · Sigue el anillo patrón con error ≤3 mm, inserción ≥100 mm y par gravitatorio ≤2,5 N·m. Robot de guías circulares, pivote fijo y comparador de trayectoria. Pivote O fijo; u=[sinθcosψ,−cosθ,sinθsinψ], punta=O+Lu. Yaw ψ=2πt/12. Anillo patrón: radio84,853 mm y descenso84,853 mm respecto de O. Error euclídeo entre punta y punto homólogo del anillo. Carga puntual2 kg en la punta: par gravitatorio=mgLsinθ. Mecanismo ideal de guías circulares concéntricas con ejes que se cruzan en O, no reproduce el doble paralelogramo del artículo. Inserción rígida y trayectoria prescrita, sin flexibilidad, colisiones ni control de un equipo real. No es dispositivo médico. Escala geométrica7 unidades/m; ciclo12 s.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-centro-remoto.html"
};
export default catalogo;
