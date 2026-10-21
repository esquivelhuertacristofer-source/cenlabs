import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-134",
  titulo: "Autonomía de un VE: Ecuación de Carga de Ruta",
  subtitulo: "Autotrónica",
  acento: "#2DD4BF",
  duracion: 40,
  videoUrl: '',
  bienvenida: 'Un crossover eléctrico en media sección recorre una ruta de montaña: ves la batería vaciándose módulo a módulo y la energía viajando por el cable hasta la rueda.\nLas flechas sobre el techo son las cuatro fuerzas de la ecuación de carga: aire, rodadura, pendiente y la tracción que las iguala.\nPrimero calculas una autonomía a mano; luego planeas la velocidad de cada tramo para llegar con carga y a tiempo; y al final diagnosticas, sólo con la curva de consumo, por qué un coche gasta de más.',
  conceptos: [
    { icono: '⚖️', nombre: 'Ecuación de carga', descripcion: 'La fuerza en la rueda suma aire (v²), rodadura, pendiente y aceleración; multiplicada por la velocidad da la potencia que paga la batería.' },
    { icono: '📉', nombre: 'Consumo y óptimo', descripcion: 'El consumo por kilómetro no baja siempre con la velocidad: los auxiliares y las pérdidas fijas lo suben cuando vas muy despacio.' },
    { icono: '♻️', nombre: 'Regeneración limitada', descripcion: 'Al bajar, el motor devuelve energía hasta su tope de potencia; el aire, la rodadura y las pérdidas se llevan parte de lo que costó subir.' },
  ],
  mision: [
    'Calcula la autonomía de un VE a velocidad constante con la ecuación de carga.',
    'Planea la velocidad del llano, de la subida y de la bajada para llegar con al menos 10 % de carga sin pasarte del tiempo.',
    'Diagnostica si un coche gasta de más por neumáticos blandos, baca con carga o un auxiliar atascado.',
  ],
  aplicaciones: [
    { area: 'Planificación de viajes', ejemplo: 'Los navegadores de los VE integran el perfil de elevación y la velocidad para estimar con qué carga llegarás y dónde conviene cargar.' },
    { area: 'Eficiencia', ejemplo: 'Quitar la baca, inflar los neumáticos y apagar un auxiliar innecesario pueden devolver kilómetros de autonomía sin tocar la batería.' },
  ],
};

export default briefing;
