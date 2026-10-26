import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Soldadura MIG robotizada: formación del cordón",
  duracion: "40 min",
  teoria: "OT-212 · Prepara 100 mm de cordón con aporte 400–650 J/mm, sección depositada 10–15 mm² y duración ≤20 s. Robot cartesiano, antorcha MIG, hilo y registro de energía y depósito. Arco a 22 V; rendimiento constante η=0,75. P=ηVI y H=P/v. Hilo de 1 mm a 6 m/min: Q=π(0,5)²·100 mm³/s. Sección depositada A=Q/v. Ancho ilustrativo de un cordón semielíptico w=√(8A/π). Recorrido lineal de 100 mm. Parámetros sintéticos independientes para enseñar balances; no reproduce la relación eléctrica de una fuente MIG real ni una WPS. Sin metalurgia, penetración, transferencia de gotas, gas, salpicadura o predicción de resistencia. El color es un indicador de enfriamiento ilustrativo, no termometría ni solución térmica. Pórtico robotizado cartesiano, no brazo de seis ejes. Los destellos son ilustrativos; no representan una distribución predicha de salpicadura.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/soldadura-mig-cordon-robot.html"
};
export default catalogo;
