import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Ciclo Atkinson/Miller del motor híbrido: comprimir menos, expandir más",
  duracion: "40 min",
  teoria: `Un motor Atkinson/Miller deja abierta la válvula de admisión cuando el pistón ya sube, de modo que devuelve parte del aire al tubo y comprime menos de lo que expande. La compresión efectiva es el volumen atrapado entre el de la cámara: con relación de expansión 13 y cierre a 75° tras el punto muerto inferior comprime 9,5 veces, igual que el motor normal (relación 10,5, cierre a 45°), pero se expande 13 veces, y en la carretera (2 400 rpm, 100 N·m) rinde 30,1 % en lugar de 28,7 %. El precio es el par: a plena carga da 103 N·m y no 131, porque atrapa menos aire y quema menos gasolina; el motor eléctrico del híbrido pone lo que falta. El modelo es un ciclo de aire con combustión de Wiebe integrada con la primera ley y verifica el límite ideal 1 − 1/r^(γ−1) con 344 comprobaciones; el golpeteo se mide con la integral de Livengood-Wu. El reto pide ahorrar 5,0 % (carretera), 4,0 % (cuesta) o 5,5 % (ciudad) frente al motor normal sin pasar del 80 % del límite de golpeteo y con el motor eléctrico poniendo menos de 15 N·m: sólo lo cumple entre el 5,6 % y el 7,1 % de la rejilla, con el cierre en el interior del mando (en la carretera con relación 15, de 64,5° a 83,5°); cerrar pronto detona o gasta lo mismo, y cerrar tarde deja sin aire. Se simplifican los conductos sin ondas, el gas con γ constante de 1,32 y la distribución con sólo el cierre móvil.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/ciclo-atkinson-miller-hibrido.html",
};

export default catalogo;
