import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Pintura en polvo: transporte y captura electrostática",
  duracion: "40 min",
  teoria: "OT-248 · Consigue captura80–95 %, espesor60–90 µm y corriente de polvo capturado ≤2 µA. Cabina seccionada, nube de partículas y balance de masa y carga. Campo uniforme E=V/0,2 m. Partículas40 µm,ρp=1500 kg/m³,µaire=1,8·10⁻⁵ Pa·s: τ=ρpd²/(18µ). Carga específica uniforme en128 clases de0,0001 a0,0009 C/kg. Movimiento desde v0=0,5 m/s: x=v0t+(q/m)Eτ[t−τ(1−exp(−t/τ))]. Captura si alcanza0,2 m en0,2 s. Espesor=ṁη/(ρp·ancho0,2 m·velocidad0,04 m/s). Corriente suma de cargas capturadas. Campo y distribución de carga sintéticos, sin corona, carga espacial, resistividad, geometría de bordes, retroionización o cámara de curado. Tiempo de vuelo es el mismo del modelo; recorrido visual escalado5 unidades/m y espesor×200. Espesor equivalente de masa depositada, no película curada ni eficiencia comercial. Corriente sólo del polvo, no consumo total de pistola.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/pintura-polvo-electrostatica.html"
};
export default catalogo;
