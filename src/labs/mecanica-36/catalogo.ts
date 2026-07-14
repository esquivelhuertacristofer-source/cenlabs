import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: 'Electrónica',
  titulo: 'Convertidor reductor (buck): ciclo de trabajo, rizo de IL y CCM/DCM',
  duracion: '35 min',
  teoria:
    'Un convertidor reductor (buck) es una fuente de alimentación conmutada que produce un voltaje de salida menor al de entrada mediante la conmutación periódica de un transistor a una frecuencia fija, seguido de un diodo de rueda libre, un inductor de almacenamiento de energía y un capacitor de filtrado. En modo de conducción continua (CCM), el balance volt-segundo del inductor determina que el ciclo de trabajo D sea simplemente D=Vout/Vin, independiente de la carga. Durante la fase de encendido el inductor acumula energía y su corriente sube; durante la fase de apagado el diodo conduce y la corriente del inductor baja, generando una forma de onda triangular cuyo rizo pico a pico es ΔIL=Vout(1−D)/(L·fsw). Si la corriente de salida cae por debajo de la mitad de ese rizo (Icrit=ΔIL/2), la corriente del inductor llega a cero antes de terminar el periodo de conmutación y el convertidor entra en modo de conducción discontinua (DCM), donde D=Vout/Vin deja de ser válido. El capacitor de salida filtra el rizo de corriente del inductor y produce un rizo de voltaje ΔVout compuesto por un término capacitivo (relacionado con la carga/descarga del capacitor) y un término resistivo debido a su resistencia serie equivalente (ESR). Este laboratorio permite explorar estos fenómenos con un diseño de referencia basado en el regulador integrado LM2596, ampliamente usado en fuentes reductoras comerciales.',
  estado: 'activo',
  simuladorHtml: '/labs/buck.html',
};

export default catalogo;
