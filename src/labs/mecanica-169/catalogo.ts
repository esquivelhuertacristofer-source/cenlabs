import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Robot delta: tres brazos que cooperan para mover una herramienta",
  duracion: "40 min",
  teoria: "Cada brazo debe llegar al mismo efector. Alejar la trayectoria o acercarla demasiado a la base cambia mucho las articulaciones. Tres bases a radio 0,50 m y plataforma de radio 0,12 m. Brazos superiores de 0,40 m e inferiores de 0,85 m. Para cada plano de motor: A cos q + B sin q = C, C=(|D|²+L1²−L2²)/(2L1). Se selecciona una rama fija del acos. Trayectoria x=r cos(2πt/3), z=r sin(2πt/3), y=1,5−h. Se verifica el cierre de cada lazo por distancias. Los dos tirantes de cada brazo forman un paralelogramo ideal. Sin dinámica, cargas, flexión, control de orientación, choques propios o con obstáculos. Topes didácticos −1,35≤q≤0,25 rad; el reto comprueba 121 posiciones del círculo y velocidades por diferencias de 25 ms. Un objetivo geométricamente imposible conserva la última postura y se avisa; no se promete atravesar zonas no comprobadas entre muestras.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-delta-paralelo.html"
};
export default catalogo;
