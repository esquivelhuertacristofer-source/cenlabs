import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-145",
  titulo: "LiDAR automotriz: tiempo de vuelo, nube de puntos y detección de obstáculos",
  subtitulo: "Autotrónica",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Sobre el techo del coche hay un láser que gira. Lanza destellos de luz y mide cuánto tardan en volver: así sabe a qué distancia está cada cosa.
Cada rebote es un punto, y miles de puntos forman una «nube» que dibuja la calle. A este sensor se le llama LiDAR.
Tu trabajo: ajustar el láser para que el coche vea a un peatón de ropa oscura a cierta distancia, sin pasarte del presupuesto de puntos por segundo ni de la fuerza que es segura para los ojos.
Un recorrido guiado te lleva paso a paso; después calculas, ajustas y diagnostizas.`,
  conceptos: [
    { icono: '⏱️', nombre: 'Tiempo de vuelo', descripcion: 'La luz va y vuelve: la distancia es d = c·t/2. Cada nanosegundo de ida y vuelta equivale a 15 cm.' },
    { icono: '🔆', nombre: 'Cuánta luz vuelve', descripcion: 'El eco cae con 1/R² y con la reflectividad del objeto, y la lluvia y la niebla lo apagan aún más. Por eso lo oscuro y lejano se pierde primero.' },
    { icono: '🧩', nombre: 'Nube de puntos', descripcion: 'La separación entre puntos crece con la distancia. Un filtro aparta el suelo y un agrupamiento junta puntos cercanos para declarar «aquí hay un objeto».' },
  ],
  mision: [
    'Convierte un tiempo de ida y vuelta de la luz en una distancia.',
    'Elige láseres apilados, separación entre rayos, barridos por segundo y fuerza del láser para detectar al peatón sin pasar el presupuesto ni el límite para los ojos.',
    'Diagnostica por qué un LiDAR falló: pocos puntos en el peatón, eco demasiado débil o falsos ecos por la niebla.',
  ],
  aplicaciones: [
    { area: 'Conducción autónoma', ejemplo: 'Los vehículos con LiDAR construyen una nube 3D de la calle para ubicar vehículos, peatones y bordillos con precisión de centímetros.' },
    { area: 'Diseño de sensores', ejemplo: 'Alcance, densidad y seguridad ocular se reparten con un presupuesto limitado de puntos por segundo y de potencia óptica; mejorar uno empeora otro.' },
  ],
};

export default briefing;
