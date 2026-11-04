import {vibrationScene} from './_dinamica-vibraciones-escenas.js';
import {thermalScene} from './_dinamica-termofluidos-escenas.js';

export function build(id, options) {
  return id <= 280 ? vibrationScene(id, options) : thermalScene(id, options);
}

export function update(visual, point) {
  visual.update(point);
}
