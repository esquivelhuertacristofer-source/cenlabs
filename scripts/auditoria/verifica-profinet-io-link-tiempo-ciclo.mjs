import assert from 'node:assert/strict';
import {schedule, updates} from '../../public/labs/_control-avanzado-ciclo-io.js';

// Exhaustively step independent quarter-millisecond clocks.
for (let io = 2; io <= 10; io++) {
  for (let index = 0; index < updates.length; index++) {
    const pn = updates[index];
    let greatest = 0;
    for (let event = .001; event < io * pn * 4; event += .25) {
      let tick = Math.ceil(event * 4);
      while (tick % (io * 4) !== 0) tick++;
      tick++;
      while (tick % (pn * 4) !== 2) tick++;
      while (tick % 16 !== 3) tick++;
      greatest = Math.max(greatest, tick / 4 - event);
    }
    assert.ok(Math.abs(schedule(io, index).latency - greatest - .001) < 1e-9);
    assert.ok(schedule(io, index).latency <= schedule(io, index).upperBound);
  }
}
assert.equal(schedule(5, 1).latency, 8.75);
assert.equal(schedule(9, 3).latency, 16.75);
console.log('Ciclo IO: simulación de relojes independiente y cota correctas.');
