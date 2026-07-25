import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Circuitos Eléctricos",
  titulo: "Coordinación de Protecciones y Curvas Tiempo-Corriente",
  duracion: "30 min",
  teoria: "Un interruptor termomagnético protege un circuito con dos mecanismos que actúan según la magnitud de la sobrecorriente, y esa relación entre corriente y tiempo de disparo es su curva tiempo-corriente. El mecanismo térmico (bimetálico) protege contra sobrecargas con un retardo inverso: a más corriente, dispara más rápido; su característica se ancla a las compuertas de prueba de IEC 60898 (a 1.13× la corriente nominal no debe disparar; a 1.45× debe disparar en menos de una hora; a 2.55× entre 1 y 60 s). El mecanismo magnético (electroimán) protege contra cortocircuitos disparando casi al instante (~10 ms) al superar un umbral que define el TIPO DE CURVA: B (3–5× In), C (5–10× In) y D (10–20× In). La curva se elige según el pico de arranque de la carga: una curva B dispararía con el arranque de un motor (6–8× In), por eso los motores usan curva D. El costo de tardar en cortar se mide con la energía pasante I²t=I²·t, que estresa térmicamente al cable. La corriente nominal In se elige con el criterio Ib≤In≤Iz (que lleve la carga sin rebasar la ampacidad del cable). Cuando dos interruptores están en serie —general y derivado— deben coordinarse: el derivado ha de disparar antes que el general en todo el rango de falla para que una avería aísle solo su ramal. La lección honesta es que la selectividad MCB-MCB en cortocircuito no es automática: si ambos alcanzan su umbral magnético con la misma corriente de falla disparan a la vez (~10 ms), y para evitarlo la general necesita un umbral bastante mayor (más In y/o curva más alta). Referencias: IEC 60898-1 (curvas B/C/D), NOM-001-SEDE-2022 Art. 240, IEC 60947-2.",
  estado: "activo",
  simuladorHtml: "/labs/coordinacion-protecciones.html",
};

export default catalogo;
