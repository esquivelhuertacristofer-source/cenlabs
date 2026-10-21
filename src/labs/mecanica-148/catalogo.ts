import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Frenado Regenerativo Mezclado: el Motor y los Frenos Juntos",
  duracion: "40 min",
  teoria: "Al frenar, un coche eléctrico reparte lo que pide el pedal entre el motor, que funciona como generador y devuelve energía a la batería, y los frenos de disco, que la convierten en calor. En el ejemplo del laboratorio (1 850 kg, 60 km/h, 0,35 g, motor al 60 % y batería al 55 %) el coche para en 44 m: de 257 kJ vuelven 128 kJ a la batería (50 %), 98 kJ se pierden en los discos, 20 kJ en el motor y la batería y 10 kJ en rodadura y aire; la eficiencia de ida y vuelta es del 75 %. El motor tiene cuatro techos (par de 8,7 kN en la rueda, potencia de 90 kW, la corriente que admite la batería y la caída a baja velocidad): con la batería al 97 % sólo pueden volver 60 kJ (23 %). Además, un coche con motor trasero sólo con el motor patina a 0,397 g en seco, porque al frenar el peso se va hacia delante. El reto pide parar antes de la línea, sin que ningún eje patine y recuperando la mayor energía: el reparto óptimo está en el interior, no en los extremos. Es un modelo didáctico, no una homologación.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/frenado-regenerativo-mezclado.html",
};

export default catalogo;
