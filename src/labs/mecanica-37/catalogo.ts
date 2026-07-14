import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: 'Electrónica',
  titulo: 'Convertidor elevador (boost): ganancia 1/(1−D), frontera CCM/DCM y M(D,K)',
  duracion: '35 min',
  teoria:
    'Un convertidor elevador (boost) es una fuente de alimentación conmutada que produce un voltaje de salida mayor al de entrada, usando el mismo tipo de componentes que un reductor (buck) —transistor, diodo, inductor y capacitor de filtrado— pero con una topología distinta: el inductor se coloca entre la fuente y el nodo de conmutación, de modo que durante el encendido del transistor almacena energía tomándola directamente de la entrada, y durante el apagado esa energía se suma a la de la entrada y se entrega a la salida a través del diodo. En modo de conducción continua (CCM), el balance volt-segundo del inductor determina que la ganancia de voltaje sea Vout/Vin=1/(1−D), una relación que crece sin límite teórico conforme D se acerca a 1 y que, a diferencia del buck, no depende de la corriente de carga. El rizo pico a pico de la corriente del inductor en CCM es ΔIL=Vin·D/(L·fsw). Sin embargo, si la carga es lo bastante ligera, la corriente del inductor puede llegar a cero antes de terminar el periodo de conmutación: el convertidor entra en modo de conducción discontinua (DCM), donde la relación 1/(1−D) deja de cumplirse. La frontera entre ambos modos se determina comparando un parámetro adimensional K=2L/(R·Ts) contra un valor crítico que depende del ciclo de trabajo, Kcrit(D)=D(1−D)²: si K>Kcrit el convertidor opera en CCM, si K<Kcrit opera en DCM. En DCM la ganancia real es mayor a la predicción ingenua de CCM y sigue la expresión M(D,K)=[1+√(1+4D²/K)]/2 — un fenómeno de "elevación en carga ligera" que cualquier diseñador debe anticipar. El capacitor de salida filtra el rizo de corriente y produce un rizo de voltaje ΔVout compuesto por un término capacitivo y un término resistivo debido a su resistencia serie equivalente (ESR). Este laboratorio permite explorar estos fenómenos con un diseño de referencia basado en el regulador integrado TPS61030, un elevador síncrono ampliamente usado en aplicaciones portátiles alimentadas por batería.',
  estado: 'activo',
  simuladorHtml: '/labs/boost.html',
};

export default catalogo;
