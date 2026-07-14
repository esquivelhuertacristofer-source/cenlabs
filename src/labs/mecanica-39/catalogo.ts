import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: 'Electrónica',
  titulo: 'Etapa de salida Clase AB: disipación, polarización VBE y disipador',
  duracion: '35 min',
  teoria:
    'Una etapa de salida push-pull complementaria (un transistor NPN y uno PNP en configuración seguidor de emisor, alimentados por rieles simétricos ±Vcc) entrega corriente a una carga RL: el NPN conduce el semiciclo positivo, el PNP el negativo. Sin polarización (Clase B pura) aparece distorsión de cruce, una zona muerta cerca del cruce por cero donde ninguno de los dos transistores conduce todavía; se elimina polarizando ambos transistores con una pequeña corriente de reposo mediante una red "multiplicador VBE" (V_CE=VBE·(1+R1/R2)), dando la Clase AB. La potencia entregada a la carga es P_load=Vo_pk²/(2·RL); la potencia tomada de la fuente es P_supply=(2/π)·Vcc·Vo_pk/RL (derivada de la corriente promedio de media onda rectificada por riel); la disipación en los transistores es P_diss=P_supply−P_load. Derivando P_diss respecto a Vo_pk e igualando a cero se obtiene el punto de disipación máxima, Vo_pk=2Vcc/π≈0.637·Vcc, con P_diss_max=2Vcc²/(π²RL) — un resultado contraintuitivo: la etapa disipa más calor a una amplitud intermedia que al volumen máximo. Ese calor generado en la unión de silicio (Tj) debe salir hacia el ambiente (Ta) a través de una cadena de resistencias térmicas, Tj=Ta+P·(RθJC+RθCS+RθSA) con disipador o Tj=Ta+P·RθJA sin disipador, y no puede superar la Tj_max del transistor sin arriesgar su destrucción. Este laboratorio usa como referencia el par complementario TIP31C/TIP32C (ON Semiconductor, TO-220), y permite explorar cómo Vcc, RL, la amplitud, la polarización y el disipador elegido determinan si el diseño es térmicamente seguro.',
  estado: 'activo',
  simuladorHtml: '/labs/etapa-clase-ab.html',
};

export default catalogo;
