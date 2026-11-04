import {solveVibration} from './_dinamica-vibraciones.js';
import {solveThermal} from './_dinamica-termofluidos.js';

export const period = 8;

export function solve(id, a, b, time) {
  return id <= 280 ? solveVibration(id, a, b, time) : solveThermal(id, a, b, time);
}

export function valueAt(id, time, p) {
  const elapsed = Math.min(period, time % (period + 2));
  return {...solve(id, p.a, p.b, elapsed), duration: period};
}

export function validate(id, p, specs) {
  const point = valueAt(id, period, p);
  const checks = specs.map(([name, field, min, max, unit]) => ({
    name, value: point[field], unit, ok: point[field] >= min && point[field] <= max
  }));
  return {checks, ok: checks.every(check => check.ok)};
}
