import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Sintonía de un servoeje PD",
  duracion: "40 min",
  teoria: "OT-189 · Sigue el escalón con sobreimpulso≤5 %, establecimiento≤0,8 s y fuerza≤150 N. Servo lineal, encoder y respuesta a escalón. M x″+(B+Kd)x′+Kp x=Kp r, M=5 kg, B=10 N·s/m, r=0,1 m. Solución cerrada de segundo orden incluyendo amortiguamiento crítico y sobreamortiguado. Fuerza=Kp(r−x)−Kd x′. Estadísticas por barrido0–8 s cada5 ms. PD ideal, sin integral, muestreo, saturación del actuador, ruido, fricción seca ni retardo. El límite de fuerza se comprueba pero no se impone como saturación. Cada3 s se repite un escalón independiente.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/sintonia-servoeje-pd.html"
};
export default catalogo;
