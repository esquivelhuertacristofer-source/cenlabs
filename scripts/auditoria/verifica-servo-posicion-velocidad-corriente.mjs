import assert from 'node:assert/strict';
import {simulateCascade} from '../../public/labs/_control-avanzado-cascada.js';
import {criteria} from '../../public/labs/_control-avanzado-modelos.js';

const good = simulateCascade(4, 12);
const bad = simulateCascade(7, 4);
assert.ok(good.overshoot < .004);
assert.ok(bad.overshoot > .30);
assert.ok(Math.abs(good.finalError - .012 / (.02 * 12 * 4)) < 1e-8);
assert.equal(good.samples[999].load, 0);
assert.equal(good.samples[1000].load, .012);
for (const point of good.samples) {
  assert.ok(Math.abs(point.currentTarget) <= 3);
  assert.ok(Math.abs(point.current) <= 3);
  assert.ok(Math.abs(point.speedTarget) <= 4);
}
const finer = simulateCascade(4, 12, .001);
assert.ok(Math.abs(finer.overshoot - good.overshoot) < .002);
assert.ok(Math.abs(finer.peakCurrent - good.peakCurrent) < .02);
assert.equal(criteria(294, {positionGain: 4, speedBandwidth: 12}).ok, true);
assert.equal(criteria(294, {positionGain: 7, speedBandwidth: 4}).ok, false);
console.log('Cascada: límites, carga escalón, error de equilibrio y convergencia correctos.');
