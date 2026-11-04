const word = value => [(value >> 8) & 255, value & 255];
const map = new Map([[105, 12], [106, 16], [107, 1450], [108, 235], [109, 24], [110, 1]]);
export const unit = 7;
export const transaction = 0x1024;

export function crc16(bytes) {
  let crc = 0xffff;
  for (const value of bytes) {
    crc ^= value;
    for (let bit = 0; bit < 8; bit++) {
      crc = crc & 1 ? (crc >>> 1) ^ 0xa001 : crc >>> 1;
    }
  }
  return crc;
}

export function rtuFrame(pdu) {
  const data = [unit, ...pdu];
  const crc = crc16(data);
  return [...data, crc & 255, crc >>> 8];
}

export function tcpFrame(pdu) {
  return [...word(transaction), 0, 0, ...word(pdu.length + 1), unit, ...pdu];
}

export function exchange(transport, address) {
  const frame = transport === 2 ? tcpFrame : rtuFrame;
  const request = frame([3, ...word(address), ...word(3)]);
  if (transport === 3) request[3] ^= 1;
  if (transport !== 2 && crc16(request) !== 0) {
    return {request, response: [], registers: [], status: -1, exception: 0};
  }
  const registers = Array.from({length: 3}, (_, i) => map.get(address + i));
  if (registers.some(value => value === undefined)) {
    return {request, response: frame([0x83, 2]), registers: [], status: 0, exception: 2};
  }
  return {request, response: frame([3, 6, ...registers.flatMap(word)]), registers, status: 1, exception: 0};
}
