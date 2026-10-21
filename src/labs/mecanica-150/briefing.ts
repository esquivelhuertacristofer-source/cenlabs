import type { BriefingConfig } from '@/components/MissionBriefing';

const briefing: BriefingConfig = {
  codigo: "MEC-150",
  titulo: "Carga bidireccional V2G/V2H: el coche como batería de la casa",
  subtitulo: "Autotrónica · decidir cuándo el coche carga y cuándo le devuelve energía a la casa",
  acento: "#2A9D8F",
  duracion: 40,
  videoUrl: '',
  bienvenida: `Aquí decides cuándo tu coche eléctrico carga y cuándo le devuelve energía a tu casa. El recorrido guiado te lo explica paso a paso, de la tarde a la mañana siguiente.

La electricidad cuesta distinto según la hora: barata de madrugada, cara en las horas de punta. Un coche con batería grande puede comprar barato y ayudar a la casa cuando sale caro.

Pero nada es gratis: el inversor pierde algo en cada viaje de la energía y cada kWh que devuelves gasta un poco la batería, sobre todo si la vacías mucho.

Tu misión es pagar lo menos posible, dejar el coche con la carga que necesita para el trayecto de mañana y no pasar del desgaste aceptable. La respuesta no está escrita: sale de la física y no está en los extremos.`,
  conceptos: [
    { icono: '🏠', nombre: 'V2H y V2G', descripcion: 'El coche devuelve energía a la casa (V2H) o a la red eléctrica (V2G) en lugar de sólo consumirla.' },
    { icono: '🔌', nombre: 'Inversor bidireccional', descripcion: 'Convierte entre la corriente de la batería y la de la casa en los dos sentidos; a poca potencia rinde peor.' },
    { icono: '💲', nombre: 'Tarifa por hora', descripcion: 'El kWh cuesta menos en valle y más en punta; ahí está la ganancia de mover la energía en el tiempo.' },
    { icono: '🔋', nombre: 'Reserva y desgaste', descripcion: 'La batería debe salir con la carga del trayecto de mañana, y cada descarga honda acorta su vida un poco más.' },
  ],
  mision: [
    'Sigue el recorrido guiado: mira por dónde va la energía y qué se pierde en el camino.',
    'Prueba el horario, la potencia y el piso de descarga, y observa el costo y el desgaste.',
    'En el reto, predice cuánta energía llega a la casa y programa la noche para cumplir los tres criterios.',
    'Diagnostica un plan fallido por sus síntomas y contesta la pregunta de cierre.',
  ],
  aplicaciones: [
    { area: 'Hogar y red', ejemplo: 'Con tarifa por horas, un coche con carga bidireccional puede alimentar la casa en la punta y recargarse en el valle, y en algunos países también apoyar a la red.' },
    { area: 'Taller y servicio', ejemplo: 'Instalar y configurar un cargador bidireccional exige conocer sus límites de potencia, su rendimiento y la garantía de la batería.' },
  ],
};

export default briefing;
