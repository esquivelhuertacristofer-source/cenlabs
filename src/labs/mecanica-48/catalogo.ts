import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Máquinas Eléctricas",
  titulo: "Generador de CD Autoexcitado: Curva de Magnetización",
  duracion: "40 min",
  teoria:
    'En un generador de CD shunt, el campo se autoexcita: toma su corriente If de los mismos bornes que produce. La curva de magnetización de vacío satura con la forma E0(If)=Em·If/(Ik+If) y escala con la velocidad, E(If,n)=E0(If)·(n/n0). El punto de operación es la intersección exacta entre esa curva y la recta Vt=Rf·If del circuito de campo, If*=máx(0, Em·(n/n0)/Rf−Ik). Existe solo si Rf está por debajo de la resistencia crítica Rc(n)=Rc0·(n/n0), con Rc0=Em/Ik la pendiente de la curva en el origen — por encima de ese umbral, el generador no autoexcita y la tensión colapsa a cero.',
  estado: "activo",
  simuladorHtml: "/labs/generador-cd-magnetizacion.html",
};

export default catalogo;
