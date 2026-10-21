import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Carga bidireccional V2G/V2H: el coche como batería de la casa",
  duracion: "40 min",
  teoria: "Un coche eléctrico enchufado puede cargar y también devolver energía a la casa (V2H) o a la red (V2G). Cada paso por el inversor pierde energía (rinde 85,8 % a 0,5 kW y 95,1 % a 3 kW) y la ida y vuelta completa conserva cerca del 90 % a 4 kW; además cada kWh devuelto desgasta la batería, más si se descarga hondo. Se programa la noche para pagar menos sin bajar de la reserva del trayecto de mañana ni pasar el desgaste aceptable.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/v2g-v2h-carga-bidireccional.html",
};

export default catalogo;
