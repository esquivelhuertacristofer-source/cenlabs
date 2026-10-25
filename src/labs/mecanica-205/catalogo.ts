import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Cortina óptica y parada de una prensa",
  duracion: "40 min",
  teoria: "OT-205 · Obtén reserva ≥100 mm, ocupación ≤800 mm, deceleración ≤80 rad/s² y respuesta total ≤0,25 s. Barrera óptica, registro de respuesta, freno y cuerpo de prueba. Banco ideal con inercia 10 kg·m² a 8 rad/s. Par constante: tstop=Jω/Tb. Respuesta electrónica fija 50 ms. Criterio conservador del escenario S=2000 mm/s·(0,05+tstop)+120 mm, sin reducción de la velocidad de aproximación. Reserva=distancia−S. Energía inicial 320 J. Ejemplo didáctico inspirado en la relaciónS=KT+C; NO aplica una evaluación completa deISO 13855 ni certifica distancias,PL oSIL. Sin acceso por arriba/abajo, rebote, dispersión del tiempo, fallo de sensores o circuito de seguridad real. No usar el informe para instalar una protección.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/cortina-optica-parada-prensa.html"
};
export default catalogo;
