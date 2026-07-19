import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Conmutación de un Motor BLDC/PMSM",
  duracion: "35 min",
  teoria:
    'Un motor BLDC/PMSM no tiene escobillas: un inversor trifásico debe conmutar la corriente de cada fase en el instante exacto en que la FEM inducida de esa fase está en su tramo plano, siguiendo la posición del rotor que reportan los sensores Hall. Cuando la conmutación está perfectamente alineada con la FEM (error δ=0), el par instantáneo es plano e igual al ideal. Un error de temporización δ —por adelanto, atraso, o por el retardo fijo que introduce una detección "sensorless" del cruce por cero de la FEM— reduce el par promedio disponible y produce rizo de par, porque cada fase deja de conducir exactamente durante su ventana de FEM constante. El laboratorio permite explorar cómo cambian el par promedio y el rizo al mover el error de conmutación y la corriente comandada, comparar una conmutación con sensores Hall contra una conmutación sensorless cuyo error angular efectivo crece con la velocidad del rotor, y en modo Reto encontrar —a mano o por tanteo— la corriente comandada o el error de conmutación que producen un par objetivo dado.',
  estado: "activo",
  simuladorHtml: "/labs/conmutacion-bldc-pmsm.html",
};

export default catalogo;
