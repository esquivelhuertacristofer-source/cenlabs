import type { CatalogoEntry } from '../_types';
const catalogo: CatalogoEntry = {
  modulo: "Mecatrónica",
  titulo: "Modbus RTU y TCP en un banco de PLC",
  duracion: "40 min",
  teoria: "Función 03 y cantidad 3. Los campos de 16 bits del PDU llevan el byte alto primero. RTU antepone unidad y añade CRC-16 Modbus (inicial 0xFFFF, polinomio reflejado 0xA001, byte bajo primero). TCP usa MBAP con transacción 0x1024, protocolo 0 y longitud que incluye unidad y PDU. Un rango ausente responde 83 02. La trama RTU con un bit alterado falla CRC y se descarta. Banco virtual de lectura. Direcciones PDU sin desplazamiento 40001. El mapa y la unidad 7 pertenecen a este escenario. La animación amplía el tiempo de transferencia y no representa latencia de red. El error RTU se inyecta tras calcular el CRC.",
  estado: "activo",
  simuladorHtml: "/labs/modbus-rtu-tcp-registros.html"
};
export default catalogo;
