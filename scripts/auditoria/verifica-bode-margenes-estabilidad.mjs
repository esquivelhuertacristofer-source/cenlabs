import assert from 'node:assert/strict';
import {openLoop, margins} from '../../public/labs/_control-avanzado-bode.js';
import {criteria} from '../../public/labs/_control-avanzado-modelos.js';

const marginal = margins(8, 1);
assert.ok(Math.abs(marginal.crossover - 4 * Math.sqrt(3)) < 1e-12);
assert.ok(Math.abs(marginal.phaseMargin) < 1e-12);
assert.ok(Math.abs(marginal.gainMargin) < 1e-12);
for (const gain of [2, 3, 8, 14]) {
  for (const lead of [1, 2, 3, 5]) {
    const result = margins(gain, lead);
    assert.ok(Math.abs(openLoop(result.crossover, gain, lead).magnitude - 1) < 1e-12);
    assert.ok(Math.abs(openLoop(result.phaseCrossover, gain, lead).phase + Math.PI) < 1e-12);
    // Check each complex factor directly at the magnitude crossover.
    const x = result.crossover / 4;
    const real = 1 - x * x - 2 * x * x / lead;
    const imaginary = 2 * x + (1 - x * x) * x / lead;
    assert.ok(Math.abs(Math.hypot(real, imaginary) - gain) < 1e-12);
  }
}
assert.equal(criteria(292, {gain: 3, lead: 3}).ok, true);
assert.equal(criteria(292, {gain: 8, lead: 1}).ok, false);
console.log('Bode: casos marginales, cruces complejos y criterios correctos.');
