import assert from 'node:assert/strict';
import {pathToFileURL} from 'node:url';
import {definitions} from '../../public/labs/_dinamica-definiciones.js';
import {solve, validate} from '../../public/labs/_dinamica-modelos.js';
import {darcyFactor, nozzle} from '../../public/labs/_dinamica-termofluidos.js';
import {stopCycle, examplePfh, predict, history, alarm} from '../../public/labs/_control-avanzado-diagnostico.js';

const reference = new Map([
  [271, [4, 40]],
  [272, [2, 0.15]],
  [273, [900, 0.25]],
  [274, [1, 0.22]],
  [275, [2200, 90]],
  [276, [75, 0.1]],
  [277, [1, 2]],
  [278, [65, 45]],
  [279, [0.8, 0.5]],
  [280, [0.85, 10]],
  [281, [2.5, 0.65]],
  [282, [160, 45]],
  [283, [7, 550]],
  [284, [-6, 8]],
  [285, [1750, 0.021]],
  [286, [1.5, 0.001]],
  [287, [65, 0.5]],
  [288, [10, 3]],
  [289, [12, 3]],
  [290, [2.5, 0.7]]
]);
const range = ({min, max, step}) => Array.from({length: Math.round((max - min) / step) + 1}, (_, i) => Number((min + i * step).toFixed(6)));
const near = (a, b, precision = 1e-8) => assert.ok(Math.abs(a - b) <= precision, a + ' ≠ ' + b);

const invariant = {
  271() {
    near(solve(271, 4, 40, 0).signal, 50);
  },
  272() {
    near(solve(272, 1, .1, 0).m1, 5);
  },
  273() {
    near(solve(273, 1200, .2, 0).m2 * solve(273, 1200, .2, 0).m3, 1500 ** 2);
  },
  274() {
    near(solve(274, 1, .2, 0).m1, 0);
  },
  275() {
    near(solve(275, 1800, 90, 0).m2, 0);
  },
  276() {
    near(solve(276, 75, .1, 0).m2, 48 * 9.81 / 75);
  },
  277() {
    near(solve(277, .5, 2, 0).m1 / solve(277, 1, 2, 0).m1, 4);
  },
  278() {
    near(solve(278, 25, 50, 0).m3, -25);
    near(solve(278, 65, 45, 0).m3, 20);
  },
  279() {
    near(solve(279, 1, .5, 8).m3, 2 * 9.81 * .75);
  },
  280() {
    near(solve(280, 1, 10, 0).m2, .5 * (5 * Math.PI) ** 2);
    const before = solve(280, .1, 20, 1.47);
    const after = solve(280, .1, 20, 1.471);
    near((after.theta - before.theta) / .001, (after.signal + before.signal) / 10, .015);
  },
  281() {
    const heat = solve(281, 2.5, .65, 8);
    near((80 - heat.m2) * .65, heat.m3 - 20);
    near(heat.reference, 20);
  },
  282() {
    assert.ok(solve(282, 160, 45, 4).signal > solve(282, 160, 45, 8).signal);
  },
  283() {
    const [h1, h2, h3, h4] = solve(283, 7, 550, 0).profile;
    near((h3 - h2) - (h4 - h1), solve(283, 7, 550, 0).m3);
  },
  284() {
    near(solve(284, -6, 8, 0).profile[2], solve(284, -6, 8, 0).profile[3]);
  },
  285() {
    const pump = solve(285, 1750, .021, 0);
    const end = solve(285, 1750, .021, 8);
    const onCurve = solve(285, 1750, .021, 8 * pump.m1 / end.flowProbe);
    near(end.signal, 0);
    near(onCurve.signal, onCurve.reference);
  },
  286() {
    assert.ok(solve(286, 2, .001, 8).m3 > solve(286, 1, .001, 8).m3);
    near(darcyFactor(1000, .001), .064);
    near(darcyFactor(1500, .001), darcyFactor(1500, .008));
    assert.ok(darcyFactor(60000, .001) < darcyFactor(60000, .008));
  },
  287() {
    assert.ok(solve(287, 65, .5, 0).m1 > solve(287, 65, .35, 0).m1);
  },
  288() {
    assert.ok(solve(288, 10, 3, 0).m1 < solve(288, 10, 1, 0).m1);
  },
  289() {
    assert.ok(solve(289, 7, 3, 0).m2 > solve(289, 5, 3, 0).m2);
    assert.ok(solve(289, 7, 3, 0).m2 > solve(289, 9, 3, 0).m2);
  },
  290() {
    const shock = nozzle(2.5, .7, 1);
    near(shock.pressure, .7);
    assert.ok(nozzle(2.5, .7, shock.shock - 1e-4).mach > 1);
    assert.ok(nozzle(2.5, .7, shock.shock + 1e-4).mach < 1);
    assert.ok(nozzle(2.5, .8, 1).shock < shock.shock);
    assert.equal(nozzle(2.5, .98, 1).regime, 0);
    assert.equal(nozzle(2.5, .3, 1).regime, 2);
  },
  299() {
    for (const arch of [1,2,3]) for (const fault of [0,1,2]) {
      assert.equal(stopCycle(arch, fault, 0).power, 1);
      assert.equal(stopCycle(arch, fault, 5).power, Number(arch === 1 && fault === 1));
      assert.equal(stopCycle(arch, fault, 7.1).power, Number(arch !== 3 || !fault));
    }
    near(stopCycle(3, 2, 2.62).speed, Math.exp(-1));
    near(stopCycle(2, 2, 7 - 1e-10).angle, stopCycle(2, 2, 7 + 1e-10).angle);
    near(examplePfh, 3.2e-7, 1e-15);
    assert.ok(examplePfh >= 1e-7 && examplePfh < 1e-6);
  },
  300() {
    near(predict(16, 2).remaining, 8.75503, .00001);
    assert.ok(predict(50, 5).remaining > 20);
    for (let w = 12; w <= 56; w += 2) for (let d = 1; d <= 5; d++) {
      const fit = predict(w, d);
      assert.ok(fit.slope > 0 && fit.count >= 2);
      near(fit.intercept + fit.slope * (history.at(-1).day + fit.remaining), alarm);
    }
  }
};

export function verify(id) {
  const selected = id ? definitions.filter(d => d.id === id) : definitions;
  if (id && !invariant[id]) throw new Error('Práctica sin verificador: ' + id);
  let combinations = 0;
  for (const d of selected) {
    const [a, b] = reference.get(d.id);
    const checks = validate(d.id, {a, b}, d.specs);
    assert.ok(checks.ok, d.id + ' ' + JSON.stringify(checks.checks));
    assert.ok(!validate(d.id, d.start, d.specs).ok, d.id + ' arranca resuelto');
    for (const a of range(d.controls[0])) for (const b of range(d.controls[1])) {
      for (const time of [0, .35, 2, 4, 8]) {
        const point = solve(d.id, a, b, time);
        for (const key of ['m1', 'm2', 'm3', 'signal', 'reference', 'x', 'y', 'theta']) {
          assert.ok(Number.isFinite(point[key]), [d.id, a, b, time, key].join(' / '));
        }
      }
      combinations++;
    }
    console.log(d.id + ' · ' + checks.checks.map(c => c.value.toFixed(4)).join(' / '));
  }
  for (const key of id ? [id] : Object.keys(invariant)) invariant[key]();
  if (combinations) console.log(combinations + ' combinaciones de controles y verificaciones físicas correctas.');
  else console.log(id + ' · verificaciones físicas correctas.');
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) verify();
