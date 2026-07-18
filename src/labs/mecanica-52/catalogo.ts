import type { CatalogoEntry } from '../_types';

const catalogo: CatalogoEntry = {
  modulo: "Instrumentación",
  titulo: "Interpreta Placas de Datos y Selecciona Motores",
  duracion: "40 min",
  teoria:
    'La placa de datos de un motor de inducción codifica, en NEMA MG-1, todo lo necesario para seleccionarlo correctamente. La letra de código (A–V, sin I ni O) da el rango de kVA/HP a rotor bloqueado, de donde se calcula la corriente de arranque: I_LR=(kVA/HP·HP·1000)/(√3·V_línea). El Factor de Servicio (FS) multiplica el HP nominal para dar el HP continuo máximo permitido —un margen de sobrecarga, no una recomendación de operación sostenida— y el Diseño NEMA (B, C o D) fija la curva par-deslizamiento apropiada para el tipo de carga a arrancar. En México, NOM-016-ENER-2025 exige mínimos de eficiencia propios en su Tabla 1, sin adoptar las etiquetas IE1–IE4 de IEC 60034-30-1: son dos sistemas de clasificación distintos que no deben confundirse al leer una placa.',
  estado: "activo",
  simuladorHtml: "/labs/placa-datos-motor.html",
};

export default catalogo;
