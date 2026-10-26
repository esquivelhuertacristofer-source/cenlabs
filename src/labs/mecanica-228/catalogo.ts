import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Rugosímetro: perfil, filtro y muestreo",
  duracion: "40 min",
  teoria: "OT-228 · Separa ondulación con fuga ≤0,1 µm y conserva ≥95 % de la rugosidad; toma ≥20 muestras por onda corta en ≤20 s. Rugosímetro, perfil mecanizado y separación gaussiana. Perfil de 4 mm: amplitudes 2/0,65/0,2 µm y longitudes 2/0,08/0,04 mm; última fase 0,7 rad. Paso alto gaussiano H=1−exp[−ln2(λc/λ)²]. Ra=media|r| y Rq=√media(r²), 4000 puntos periódicos. Muestreo de adquisición 200 Hz; muestras por onda corta=0,04·200/v. Perfil sintético periódico y filtro analítico sin efectos de borde, no evaluación ISO completa. Punta ideal sin convolución por radio ni dinámica de palpador. Altura de topografía ×100, punta ampliada esquemática. El modelo evalúa retención y muestreo, no certifica acabado real.",
  estado: "activo",
  destacada: true,
  simuladorHtml: "/labs/rugosimetro-filtro-perfil.html"
};
export default catalogo;
