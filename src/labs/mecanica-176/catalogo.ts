import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Corrientes parásitas: frenar un disco sin tocarlo",
  duracion: "40 min",
  teoria: "El disco en movimiento induce corrientes que se oponen al giro. Al bajar la velocidad, el par se reduce: este freno no mantiene inmóvil una carga. Aproximación resistiva de baja velocidad: T=cω, c=κ σ B² d A r². κ=0,02 geométrico didáctico; σ=35 MS/m, área polar total A=0,008 m², radio de actuación 0,18 m. Disco anular de aluminio ρ=2700 kg/m³, radios 0,28 y 0,04 m; Jtotal=0,32+Jdisco. ω=120 exp(−ct/J), Ecalor=J(ω0²−ω²)/2; ΔT=Ecalor/(m·900). Campo y conductividad uniformes. Coeficiente geométrico sintético, no predicción de un freno comercial. Sin reacción inductiva, efecto pelicular, saturación, dependencia térmica de conductividad, refrigeración o fuerzas laterales. El modelo lineal sólo representa el régimen resistivo; su rango no está validado para materiales reales a estas velocidades. No hay par de retención en reposo. Se repite el pulso a temperatura inicial, sin acumular calor entre ciclos.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/freno-corrientes-parasitas.html"
};
export default catalogo;
