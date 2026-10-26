import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Cavitación: aspiración de una bomba centrífuga",
  duracion: "40 min",
  teoria: "OT-220 · Mantén margen NPSH ≥1 m, caudal ≥2,5 L/s, potencia ≤1200 W y una hipótesis compatible con líquido continuo. Depósito, línea de aspiración, bomba seccionada y balance NPSH. Agua a 20 °C: ρ=998 kg/m³,pv=2340 Pa,patm=101325 Pa,g=9,81. Aspiración L=10 m,D=0,04 m,f=0,025,ΣK=4: hf=(fL/D+ΣK)v²/(2g). NPSHa=(patm−pv)/(ρg)+z−hf. Curva sintética NPSHr=2+0,12Q² m, Q en L/s. Hnom=25−0,8Q² m; indicador de déficit c=clamp(−margen/NPSHr,0,1); H=Hnom(1−0,15c),P=ρgQH/0,68. Caudal impuesto para estudiar la aspiración; no resuelve el punto de operación de la instalación. NPSHr, reducción de altura y umbral de margen son sintéticos. NPSH3 real no garantiza ausencia de toda cavitación. Las burbujas representan déficit normalizado, no fracción de vapor ni dinámica Rayleigh–Plesset. Si NPSHa≤0 la hipótesis estacionaria deja de ser admisible. Impulsor estroboscópico ×1/120 y flujo visible ralentizado ×1/20.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/cavitacion-bomba-centrifuga.html"
};
export default catalogo;
