import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Electrónica",
  titulo: "Diseña amplificadores inversor y no inversor con op-amp",
  duracion: "40 min",
  teoria: "Un amplificador operacional real se comporta como el modelo ideal de libro de texto — Av=−Rf/Ri en la topología inversora, Av=1+Rf/Ri en la no inversora — solo mientras la ganancia en lazo abierto siga siendo enorme frente a la ganancia de lazo cerrado pedida. Este simulador añade la limitación que el modelo ideal no muestra: el producto ganancia×ancho de banda (GBW) de un op-amp real es aproximadamente constante, así que fc=GBW/|Av| — subir la ganancia baja el ancho de banda disponible, graficado en vivo como una curva de Bode de magnitud con el punto de operación marcado sobre ella. Dos chips con personalidades distintas: LM358 (entrada bipolar, GBW≈1MHz, slew rate≈0.3V/µs, swing de salida asimétrico) y TL072 (entrada JFET, GBW≈3MHz, slew rate≈13V/µs, swing casi simétrico). El modelo separa dos límites independientes de la salida real: el recorte por headroom cuando la amplitud ideal excede el techo o el piso reales frente a ±Vs, y la distorsión por slew-rate — cuando la pendiente 2π·f·Vout que exige la señal excede la velocidad máxima de respuesta del dispositivo, la senoidal se deforma en un triángulo en el osciloscopio virtual. Cuatro modos: Explora (Ri/Rf/topología/dispositivo libres), Predicción (ganancia o ancho de banda antes de revelar), Medición (barrido automático de frecuencia deslizando el punto de operación por la curva de Bode) y Reto (diseñar Ri/Rf y elegir el op-amp correcto para cumplir a la vez una ganancia mínima y un ancho de banda mínimo, con el ancho de banda máximo alcanzable como retroalimentación cuando el objetivo es imposible con el dispositivo elegido).",
  estado: "activo",
  simuladorHtml: "/labs/opamp.html",
};

export default catalogo;
