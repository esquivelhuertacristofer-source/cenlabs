import assert from 'node:assert/strict';
import {servoPoles} from '../../public/labs/_control-avanzado-raices.js';
import {criteria} from '../../public/labs/_control-avanzado-modelos.js';

for (const gain of [1, 3, 7.5, 8, 8.5, 12]) {
  for (const lag of [.15, .25, .55]) {
    const p = servoPoles(gain, lag);
    assert.ok(Math.abs((1 + lag * p.realPole) ** 3 + gain) < 1e-12);
    const re = 1 + lag * p.real;
    const im = lag * p.imaginary;
    assert.ok(Math.abs(re ** 3 - 3 * re * im ** 2 + gain) < 1e-12);
    assert.ok(Math.abs(3 * re ** 2 * im - im ** 3) < 1e-12);
    assert.equal(Math.sign(p.real), Math.sign(gain - 8));
    if (gain < 8) assert.ok(Math.abs(Math.exp(p.real * p.decayTime) - .05) < 1e-12);
  }
}
assert.equal(criteria(293, {gain: 3, lag: .25}).ok, true);
assert.equal(criteria(293, {gain: 10, lag: .35}).ok, false);
console.log('Raíces: ecuación característica, frontera marginal y envolvente correctas.');
