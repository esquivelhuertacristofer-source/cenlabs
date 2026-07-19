import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Curvas V del Motor Síncrono",
  duracion: "35 min",
  teoria:
    'Un motor síncrono de rotor liso, alimentado a tensión y frecuencia fijas, puede ajustar su corriente de campo (If) sin cambiar de velocidad ni de carga mecánica. Para cada nivel de carga, la corriente de armadura (Ia) trazada contra If dibuja una curva en forma de "V": un mínimo exacto en el punto donde el motor opera a factor de potencia unitario. A la izquierda de ese mínimo (subexcitación) el motor consume reactivos de la red igual que un motor de inducción; a la derecha (sobreexcitación) los entrega, comportándose como un capacitor — el principio detrás de usar un motor síncrono como compensador de factor de potencia en una planta industrial que comparte el mismo bus con cargas inductivas. El laboratorio permite explorar la familia de curvas V para tres niveles de carga, comparar cómo se desplaza el mínimo de cada una, y en modo Reto resolver dos tipos de problema: calcular a mano la corriente mínima de una curva, o ajustar el reóstato de campo hasta maximizar el factor de potencia total del bus frente a una carga industrial inductiva dada — respetando siempre el límite térmico de la armadura.',
  estado: "activo",
  simuladorHtml: "/labs/curvas-v-motor-sincrono.html",
};

export default catalogo;
