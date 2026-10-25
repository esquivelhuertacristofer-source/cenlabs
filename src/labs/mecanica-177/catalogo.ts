import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Puesta en marcha de un indexador de Ginebra: ciclo, reposo y aceleración",
  duracion: "40 min",
  teoria: "OT-177 · La estación de marcado necesita seis posiciones como mínimo y800 ms de pieza detenida. Debes entregar un ajuste que conserve al menos40 piezas/min sin exceder la aceleración del útil. Tacómetro, señal de ventana de avance y registro temporal virtuales. Para N ranuras: k=r/c=sin(π/N), c=1 unidad visual. El pasador engrana durante 2α, α=π/2−π/N. Durante ese intervalo ψ=−atan2(k sinφ,1−k cosφ), con incremento de una estación 2π/N por vuelta. Fuera de él, la mesa permanece detenida. Se usan derivadas analíticas para velocidad y aceleración. La duración del reposo es (π+2π/N)/ω. Se revisan721 posturas por ciclo. Cinemática de un mecanismo rígido ideal. El bloqueo durante el reposo está impuesto; no se calcula el contacto del disco de bloqueo, impacto del pasador, flexión, desgaste ni dinámica del motor. Las ranuras muestran el acoplamiento, no tolerancias de fabricación. No se simula PLC de seguridad ni una célula real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/puesta-marcha-indexador-ginebra.html"
};
export default catalogo;
