import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Cadena de rodillos: efecto poligonal",
  duracion: "40 min",
  teoria: "OT-223 · Transporta a 0,8–1,2 m/s, ondulación ≤1 % y carga en apoyos ≤300 N. Cadena de 80 pasos, dos ruedas y balance de tracción. Paso p=12,7 mm, 80 eslabones, ruedas iguales de z dientes pares. R=p/[2sin(π/z)], C=(80−z)p/2. Velocidad media=pzn/60; instantánea=ωRcosδ, |δ|≤π/z. Ondulación=(vmax−vmin)/vmedia. Potencia útil 120 W y pretensión 50 N: ΔT=P/vmedia; carga aproximada=100+ΔT. Geometría de paso exacto; contorno del diente ilustrativo, sin perfil normalizado de fabricante, desgaste, vibración o elasticidad. Selección limitada a ruedas iguales y z par. Giro estroboscópico ×1/30; esfuerzos y velocidades se expresan en tiempo físico.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/cadena-rodillos-efecto-poligonal.html"
};
export default catalogo;
