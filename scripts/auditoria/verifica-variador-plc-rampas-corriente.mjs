import assert from 'node:assert/strict';
import {simulateDrive} from '../../public/labs/_control-avanzado-variador.js';
import {criteria} from '../../public/labs/_control-avanzado-modelos.js';

const pass = simulateDrive(650, 4);
assert.equal(pass.samples[0].target, 0);
assert.equal(pass.samples[1100].target, 1200);
assert.equal(pass.samples.at(-1).target, 0);
assert.ok(pass.peak < 3.5 && pass.maxError < 3 && pass.stop < 1.85);
const saturated = simulateDrive(1000, 2);
assert.ok(saturated.maxError > 500);
assert.ok(saturated.samples.every(point => Math.abs(point.current) <= 2));
const refined = simulateDrive(650, 4, .0025);
assert.ok(Math.abs(refined.stop - pass.stop) < .015);
assert.equal(criteria(297, {ramp: 650, limit: 4}).ok, true);
assert.equal(criteria(297, {ramp: 350, limit: 4}).ok, false);
console.log('Variador: transiciones de PLC, límite, respuesta y convergencia correctas.');
