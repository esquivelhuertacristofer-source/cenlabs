import assert from 'node:assert/strict';
import {crc16, exchange} from '../../public/labs/_control-avanzado-modbus.js';

assert.equal(crc16(Buffer.from('123456789')), 0x4b37);
const rtu = exchange(1, 107);
assert.deepEqual(rtu.request.slice(0, 6), [7, 3, 0, 107, 0, 3]);
assert.deepEqual(rtu.registers, [1450, 235, 24]);
assert.equal(crc16(rtu.request), 0);
assert.equal(crc16(rtu.response), 0);
const tcp = exchange(2, 107);
assert.deepEqual(tcp.request, [0x10, 0x24, 0, 0, 0, 6, 7, 3, 0, 107, 0, 3]);
assert.deepEqual(tcp.response, [0x10, 0x24, 0, 0, 0, 9, 7, 3, 6, 5, 170, 0, 235, 0, 24]);
assert.deepEqual(exchange(2, 112).response, [0x10, 0x24, 0, 0, 0, 3, 7, 0x83, 2]);
assert.equal(exchange(3, 107).status, -1);
assert.equal(exchange(3, 107).response.length, 0);
console.log('Modbus: vector CRC, bytes RTU/TCP, excepción y descarte correctos.');
