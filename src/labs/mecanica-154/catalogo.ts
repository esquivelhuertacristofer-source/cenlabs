import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Control de crucero adaptativo (ACC): mantener la distancia con el coche de adelante",
  duracion: "40 min",
  teoria: `Un crucero adaptativo mide con un radar la distancia y la velocidad relativa con el coche de adelante y pide aceleración con una ley PD, a = P·(d − d*) + D·(v_líder − v), para mantener la distancia deseada d* = d0 + h·v: con d0 = 5 m y h = 1,3 s son 41,1 m a 100 km/h y 23,1 m a 50 km/h. El motor y los frenos tardan (retardo de 0,15 s y constante de 0,30 s) y la orden se limita a −3,5 y +2,0 m/s² por confort. Cuando el de adelante frena a 3,3 m/s² de 100 a 30 km/h, con h = 1,3 s, P = 0,3 y D = 0,8 el coche no baja de 16,4 m, frena como máximo a 3,3 m/s² (sin llegar al tope), queda a 1,0 m de la distancia ideal como mucho y la cadena no amplifica: la ganancia pico es ×1,00 y el tercer coche de la fila frena 0,93 veces lo que frena el primero. Con h = 0,6 s la frenada se amplifica en cadena (×1,15); con D = 0,2 el freno está 2,8 s en el tope; y con h = 2,4 s se queda a 51 m, donde se cuelan otros coches. Con P = 0,3 y D = 0,8 la cadena es estable desde h = 1,05 s sin retardo (1,07 s con el del actuador). La ventana que cumple a la vez distancia mínima, confort, precisión, estabilidad de cadena y no quedarse lejos es el 5,3 % de las combinaciones en la autopista: h de 1,07 a 1,46 s (con P = 0,3 y D = 0,8) y D de 0,67 a 0,90 (con h = 1,3 s).`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/control-crucero-adaptativo-acc.html",
};

export default catalogo;
