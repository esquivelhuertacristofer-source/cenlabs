import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Variador con PLC y límite de corriente",
  duracion: "40 min",
  teoria: "El PLC ordena marcha a 0,5 s y parada a 5,5 s. Rampa simétrica hasta 1200 rpm. J=0,008 kg·m², b=0,004 N·m·s, Kt=0,30 N·m/A. i*= [bω+J(αref+8(ωref−ω))]/Kt. i=sat(i*,±Imax). J·dω/dt=Kt·i−bω. Integración de 5 ms y ángulo visual ∫ω/20 dt. Accionamiento equivalente con par proporcional a corriente, frenado bidireccional y carga viscosa. Secuencia de PLC prescrita. La escena no representa el diseño eléctrico de potencia ni la energía del frenado. Giro mostrado a 1/20 de velocidad.",
  estado: "activo",
  simuladorHtml: "/labs/variador-plc-rampas-corriente.html"
};
export default catalogo;
