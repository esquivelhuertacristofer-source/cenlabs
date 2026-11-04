import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "PID de velocidad con anti-windup",
  duracion: "40 min",
  teoria: "Planta de tres retardos iguales P(s)=1/(1+0,25s)³. El ensayo proporcional ideal da Ku=8 y Pu=2π·0,25/√3. Z–N de ganancia última da Kp=0,6Ku, Ti=Pu/2 y Td=Pu/8. El primer mando escala Kp, Ki y Kd. La derivada usa la salida medida. u=limitar(Kp·e+I−Kd·dy/dt,0,1), dI/dt=Ki·e+Kt·(u−u_sin_límite). Muestreo de 5 ms con retención del mando y avance exacto de la planta entre muestras. Velocidad y tensión normalizadas. Consigna 140 % durante 2,5 s y 55 % hasta 8 s. La referencia inicial provoca saturación deliberada. La recuperación se mide desde el cambio hasta la última salida de la banda. La planta es equivalente y el giro del rodillo representa una vuelta por segundo al 100 %. La regla Z–N proporciona un punto de partida para este modelo.",
  estado: "activo",
  simuladorHtml: "/labs/pid-ziegler-nichols-antiwindup.html"
};
export default catalogo;
