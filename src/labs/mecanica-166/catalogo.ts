import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Robot de 6 ejes: alcance, cinemática inversa y singularidades",
  duracion: "40 min",
  teoria: `Un robot de seis ejes lleva la punta a un punto con la cinemática inversa: J1 apunta la base, J2 y J3 forman un brazo de dos eslabones que se resuelve con la ley de los cosenos (codo arriba o abajo) y J4, J5 y J6 orientan la herramienta. Con eslabones de 1,22 y 1,81 m el centro de la muñeca alcanza de 0,59 a 3,04 m. El jacobiano da el índice de manipulabilidad y las velocidades articulares q̇ = J⁻¹·v: con la muñeca recta o el brazo estirado casi pierde rango y J4, J6, J2 y J3 se disparan.`,
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-6-ejes-cinematica-alcance.html",
};

export default catalogo;
