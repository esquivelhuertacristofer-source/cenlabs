import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Relación de Transformación y Prueba de Polaridad",
  duracion: "50 min",
  teoria:
    'La relación de transformación en vacío de un transformador monofásico se define como a=N1/N2=V1/V2, donde N1/N2 son las vueltas de los devanados de alta y baja tensión: la placa de datos declara un valor nominal que debe verificarse aplicando una tensión reducida al devanado primario (jamás la tensión nominal) y comparando la relación medida contra la de placa, con una tolerancia de ±0.5% (IEC 60076-1, Cláusula 10, Tabla 1, ítem 2) — fuera de ese margen, el devanado tiene una falla (cortocircuito entre espiras, número de vueltas incorrecto). La prueba de polaridad, independiente de la anterior, determina si el devanado secundario es aditivo o sustractivo: se conecta un puente entre una terminal de alta (H1) y la adyacente de baja (X1), se aplica tensión reducida entre H1-H2 y se mide entre H2-X2; si la lectura es mayor que la tensión aplicada (V=Vap·(1+N_BT/N_AT)) la polaridad es aditiva, si es menor (V=Vap·(1−N_BT/N_AT)) es sustractiva. La norma ANSI/IEEE C57.12.00 (Cláusula 5.7.1) fija además una regla de fábrica: transformadores de ≤200 kVA y ≤8660 V de alta tensión se construyen con polaridad aditiva; el resto, sustractiva — una regla de diseño que la prueba de campo debe confirmar, no asumir.',
  estado: "activo",
  simuladorHtml: "/labs/relacion-polaridad-transformador.html",
};

export default catalogo;
