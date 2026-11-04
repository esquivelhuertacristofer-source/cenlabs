import assert from 'node:assert/strict';
import {simulatePid, ultimateGain, ultimatePeriod} from '../../public/labs/_control-avanzado-pid.js';
import {criteria} from '../../public/labs/_control-avanzado-modelos.js';

// At phase -π the complex plant denominator has real part -8 and imaginary part 0.
const frequency = 2 * Math.PI / ultimatePeriod;
const normalized = frequency * .25;
assert.ok(Math.abs(1 - 3 * normalized ** 2 + ultimateGain) < 1e-12);
assert.ok(Math.abs(3 * normalized - normalized ** 3) < 1e-12);

const open = simulatePid(1, 0);
const corrected = simulatePid(1, 4);
assert.ok(open.recovery > 3.9);
assert.ok(corrected.recovery < 1.6);
assert.ok(corrected.tailError < .001);
assert.equal(open.samples[500].target, .55);
assert.equal(open.samples[499].target, 1.4);
assert.equal(criteria(291, {gain: 1, tracking: 4}).ok, true);
assert.equal(criteria(291, {gain: 1, tracking: 0}).ok, false);
assert.equal(criteria(291, {gain: 1.4, tracking: 4}).ok, false);

// Compare the first saturated segment to the analytic step response.
const sample = open.samples[100];
const t = sample.time / .25;
assert.ok(Math.abs(sample.speed - (1 - Math.exp(-t) * (1 + t + t * t / 2))) < 1e-12);
for (const gain of [.4, .7, 1, 1.4]) {
  for (const correction of [0, 2, 4, 8]) {
    const response = simulatePid(gain, correction);
    for (const point of response.samples) {
      assert.ok(Number.isFinite(point.integral));
      assert.ok(point.voltage >= 0 && point.voltage <= 1);
      assert.ok(point.speed >= -1e-12 && point.speed <= 1 + 1e-12);
    }
  }
}
const refined = simulatePid(1, 4, .0025);
assert.ok(Math.abs(refined.recovery - corrected.recovery) < .035);
console.log('PID: ganancia última, respuesta analítica, saturación, recuperación y convergencia correctas.');
