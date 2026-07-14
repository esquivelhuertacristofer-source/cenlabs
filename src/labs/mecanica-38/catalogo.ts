import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: 'Electrónica',
  titulo: 'Amplificador de instrumentación INA128 + puente de galgas: sensibilidad y CMRR',
  duracion: '35 min',
  teoria:
    'Una galga extensométrica es un resistor cuyo valor cambia ligeramente cuando se deforma junto con la superficie sobre la que está montada, según el factor de galga GF=(ΔR/R)/ε (para galgas de constantano, GF≈2.0–2.1). Ese cambio de resistencia, del orden de partes por diez mil, se convierte en un voltaje medible montando la galga en un puente de Wheatstone. Con una sola galga activa (cuarto de puente) la salida sigue la fórmula exacta Vout/Vex=(GF·ε/4)/(1+GF·ε/2), que incluye un término no lineal en el denominador; con dos galgas activas en oposición (medio puente, típico de una viga en flexión) el término no lineal se cancela y la relación es exactamente Vout/Vex=GF·ε/2; con cuatro galgas activas (puente completo) la relación es Vout/Vex=GF·ε, con el doble de sensibilidad del medio puente. En cualquier configuración, la señal diferencial resultante son apenas unos milivoltios montados sobre un voltaje de modo común Vcm≈Vex/2 —del orden de voltios—, mucho mayor que la señal de interés. Amplificar esa señal exige un amplificador de instrumentación de alto CMRR (razón de rechazo de modo común); el INA128 de Texas Instruments fija su ganancia con una sola resistencia externa, G=1+50kΩ/R_G (rango G=1 a 10,000), y alcanza hasta 130 dB de CMRR típico según la ganancia elegida, según su hoja de datos. El error de salida inducido por el CMRR se calcula como error≈G·Vcm/CMRR_lineal, y depende únicamente de la ganancia G, el voltaje de excitación Vex y el CMRR de la hoja de datos a esa ganancia —no del tipo de puente elegido—, aunque el error relativo a la señal sí es menor en el puente completo por tener mayor señal de partida. Este laboratorio permite explorar estos fenómenos con un diseño de referencia basado en el INA128.',
  estado: 'activo',
  simuladorHtml: '/labs/instrumentacion.html',
};

export default catalogo;
