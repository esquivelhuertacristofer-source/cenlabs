import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Robot suspendido: cables, tensiones y cabrestantes",
  duracion: "40 min",
  teoria: "OT-231 · Traslada ≥12 kg en la trayectoria prescrita con tensiones 12–110 N y potencia máxima de izado ≤80 W. Robot por cables, cuatro cabrestantes y registro de longitudes y tensiones. Anclajes (±s,2,2,±s) m. Unión común: x=0,45sin(2πt/20), y=0,8, z=0,35cos(2πt/20). Masa total=carga+6 kg. Unidades de cable ui=(ai−x)/Li. Reparto de mínima norma T=Aᵀ(AAᵀ)⁻¹[0,mg,0]; AT equilibra el peso. dLi/dt=−ui·v. Tambor de radio40 mm y eficiencia0,8. Se revisan241 posiciones del recorrido. Modelo cuasiestático de traslación: los cuatro cables convergen en una rótula común y no controlan orientación ni guiñada. Sin aceleración de carga, elasticidad, pandeo, control real de winches o certificación de elevación. Tensiones negativas se rechazan; no representan cables que empujan. Recorrido acelerado×2.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/robot-cables-tensiones.html"
};
export default catalogo;
