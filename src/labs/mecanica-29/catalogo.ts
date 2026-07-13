import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Autotrónica",
  titulo: "Monitores de Disponibilidad (Readiness) y Tabla 1",
  duracion: "45 min",
  teoria: "El Sistema de Diagnóstico a Bordo (SDB) no solo lee códigos de falla: también reporta el estado de 11 monitores de disponibilidad (readiness) — 3 continuos y 8 no continuos. La Tabla 1 exige tres criterios independientes para aprobar la verificación vehicular: conexión exitosa con el SDB, sin códigos de falla confirmados en los monitores del num. 4.1.1, y esos monitores obligatorios (5 para SDB tipo OBD-II/EOBD Euro 5+) 'completados' con cero tolerancia. 'No soportado' no es lo mismo que 'no completado': un monitor ausente de fábrica por diseño no cuenta en contra. El método SDB aplica a vehículos año-modelo 2006 en adelante; antes de 2006 aplica el método Dinámica. Normas NOM-167-SEMARNAT-2017 (método SDB) y NOM-047-SEMARNAT-2014.",
  estado: "activo",
  simuladorHtml: "/labs/readiness-obd.html",
};

export default catalogo;
