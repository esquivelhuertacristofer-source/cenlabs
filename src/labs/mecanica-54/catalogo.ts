import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Sincronización de un Alternador a la Red",
  duracion: "35 min",
  teoria:
    'Antes de cerrar el interruptor que conecta un alternador a una red ya energizada, deben cumplirse cuatro condiciones independientes: la tensión del generador debe igualar a la de la red (dentro de una tolerancia), su frecuencia también (o el generador "desliza" respecto a la red), su secuencia de fases debe coincidir exactamente (una secuencia invertida produce un cortocircuito franco al cerrar, la falla más severa de las cuatro), y el ángulo de fase instantáneo debe estar cerca de cero (un ángulo residual grande produce un par pulsante transitorio, el "choque de sincronización"). El sincronoscopio —una aguja que gira mientras la frecuencia no coincide y se detiene al llegar a ángulo cero— y el indicador de tres lámparas —que revela una secuencia invertida por su patrón de parpadeo rotativo— son los dos instrumentos clásicos para verificar estas condiciones antes de la maniobra. El laboratorio expone las cuatro condiciones de forma simultánea e independiente, y en modo Reto exige identificar cuál de las cuatro es la que falla en un escenario dado.',
  estado: "activo",
  simuladorHtml: "/labs/sincronizacion-alternador-red.html",
};

export default catalogo;
