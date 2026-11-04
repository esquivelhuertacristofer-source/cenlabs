import assert from 'node:assert/strict';
import {gray, grayDecode, channel, recordEncoder} from '../../public/labs/_control-avanzado-encoder.js';

for (let sector = 0; sector < 64; sector++) {
  const changed = gray(sector) ^ gray((sector + 1) % 64);
  assert.ok(changed !== 0 && (changed & (changed - 1)) === 0);
  assert.equal(grayDecode(gray(sector)), sector);
}
assert.deepEqual([0,1,2,3].map(channel), [0,2,3,1]);
for (const speed of [900, 1000, 1200, -1200]) {
  const record = recordEncoder(speed, 1500);
  assert.equal(record.error, 0);
  assert.equal(record.invalid, 0);
}
const aliased = recordEncoder(1200, 500);
assert.ok(aliased.invalid > 0);
assert.ok(aliased.error < -1000);
assert.ok(aliased.samples.every(sample => sample.absolute === ((sample.exact % 64) + 64) % 64));
console.log('Encoder: Gray cíclico, lectura X4 en ambos sentidos y alias correctos.');
