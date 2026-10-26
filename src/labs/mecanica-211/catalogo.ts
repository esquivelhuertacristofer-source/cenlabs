import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Calibración cámara–robot: correspondencias planares",
  duracion: "40 min",
  teoria: "OT-211 · Ajusta la transformación para obtener RMS ≤0,5 mm, error máximo ≤0,7 mm y reproyección equivalente ≤0,7 px. SCARA, cámara, patrón, correspondencias y visor de residuos. Transformación rígida planar pG=R(θ)pC+[tx,−20] mm. Seis correspondencias sintéticas en el marco de la brida. Reproyección equivalente epx=800·e/600. Robot SCARA: x=0,85cos(q1)+0,65cos(q1+q2), z=0,85sin(q1)+0,65sin(q1+q2) m. Se ajustan θ y tx; ty y la escala óptica se conocen. Ejercicio reducido a dos grados de libertad; no resuelve AX=XB completo ni estima distorsión, orientación 3D, ruido de detección o incertidumbre del robot. Las muestras están pretransformadas al marco de brida. Rayos y cámara contextualizan la medición; no son un simulador de imágenes PnP. Residuos visuales amplificados 4 veces.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/calibracion-camara-robot-planar.html"
};
export default catalogo;
