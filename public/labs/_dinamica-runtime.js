import {launch as workOrder} from './_industria-runtime.js';
import {preciseFraming} from './_elementos-encuadre.js';
import {definitions} from './_dinamica-definiciones.js';
import {solve, valueAt, validate, period} from './_dinamica-modelos.js';
import {build, update} from './_dinamica-escenas.js';
import {cantileverShape} from './_dinamica-vibraciones.js';
import {nozzle} from './_dinamica-termofluidos.js';
import {attachReviewCursor} from './_banco-revision-ensayo.js';

const defaults = Object.fromEntries(definitions.map(d => [d.id, d.start]));
const blue = '#7ee4d7';
const amber = '#ebbd7f';

function trace(ctx, points, x, y, color) {
  ctx.strokeStyle = color;
  ctx.beginPath();
  for (const [i, [u, v]] of points.entries()) {
    if (i === 0) ctx.moveTo(x(u), y(v));
    else ctx.lineTo(x(u), y(v));
  }
  ctx.stroke();
}

function graph(ctx, width, height, series, caption) {
  const all = series.flatMap(s => s[0]);
  const minX = Math.min(...all.map(p => p[0]));
  const maxX = Math.max(...all.map(p => p[0]));
  const minY = Math.min(...all.map(p => p[1]));
  const maxY = Math.max(...all.map(p => p[1]));
  const x = u => 39 + (u - minX) / (maxX - minX || 1) * (width - 55);
  const y = v => height - 27 - (v - minY) / (maxY - minY || 1) * (height - 70);
  ctx.fillText(caption, 12, 18, width - 24);
  ctx.strokeStyle = '#28404a';
  for (let i = 0; i < 5; i++) {
    const level = minY + (maxY - minY) * i / 4;
    ctx.beginPath();
    ctx.moveTo(38, y(level));
    ctx.lineTo(width - 15, y(level));
    ctx.stroke();
    ctx.fillText(level.toPrecision(3), 4, y(level) + 4, 31);
  }
  for (const [points, color] of series) trace(ctx, points, x, y, color);
  ctx.fillText(minX.toPrecision(3), 39, height - 8);
  const last = maxX.toPrecision(3);
  ctx.fillText(last, width - ctx.measureText(last).width - 14, height - 8);
}

function details(ctx, width, height, definition, p) {
  const {id} = definition;
  const point = solve(id, p.a, p.b, period);
  if (id === 272 || id === 274 || id === 276) {
    const {min, max, label} = definition.controls[0];
    const points = Array.from({length: 91}, (_, i) => {
      const a = min + i * (max - min) / 90;
      const v = solve(id, a, p.b, 0);
      return [a, v];
    });
    const series = [[points.map(([a, v]) => [a, v.m1]), blue]];
    if (id !== 276) series.push([points.map(([a, v]) => [a, v.m2]), amber]);
    const markerY = Math.max(point.m1, id === 276 ? 0 : point.m2);
    series.push([[[p.a, 0], [p.a, markerY]], '#9cb1bb']);
    return graph(ctx, width, height, series, 'Barrido · ' + label.toLowerCase() + ' · ajuste marcado en gris');
  }
  if (id === 273) {
    const points = Array.from({length: 41}, (_, i) => {
      const rpm = 300 + i * 52.5;
      return [rpm, solve(id, rpm, p.b, 0)];
    });
    return graph(ctx, width, height, [
      [points.map(([rpm, v]) => [rpm, v.m2]), blue],
      [points.map(([rpm, v]) => [rpm, v.m3]), amber],
      [[[300,300],[2400,2400]], '#9cb1bb']
    ], 'Campbell · directa / inversa / giro (rpm)');
  }
  if (id === 278) {
    const circle = radius => Array.from({length: 61}, (_, i) => {
      const angle = i * Math.PI / 30;
      return [radius * Math.cos(angle), radius * Math.sin(angle)];
    });
    const side = Math.min(width, height);
    return graph(ctx, side, height, [[circle(point.m1), amber], [circle(point.m2), blue]], 'Holgura / órbita (µm)');
  }
  if (id === 277) {
    const points = Array.from({length: 65}, (_, i) => [p.a * i / 64, cantileverShape(point.beta, i / 64) / 2]);
    return graph(ctx, width, height, [[points, blue], [[[0,0],[p.a,0]], amber]], 'Forma modal relativa · distancia al empotramiento (m)');
  }
  if (id === 286) {
    const points = Array.from({length: 51}, (_, i) => {
      const velocity = .025 * 120 ** (i / 50);
      return [Math.log10(velocity * 40000), solve(id, velocity, p.b, 0).m2];
    });
    const selected = Math.log10(point.m1);
    return graph(ctx, width, height, [[points, blue], [[[selected, .014], [selected, point.m2]], amber]], 'Moody · f de Darcy frente a log₁₀(Re)');
  }
  if (id === 289) {
    const points = Array.from({length: 73}, (_, i) => [i / 2, solve(id, p.a, p.b, i / 9).signal]);
    const baseline = point.reference;
    const critical = Math.max(0, point.m1 - 8);
    const peak = solve(id, p.a, p.b, critical * period / 36).signal;
    return graph(ctx, width, height, [
      [points, blue],
      [[[0,baseline],[36,baseline]], amber],
      [[[critical,Math.min(baseline,peak)],[critical,peak]], '#ff765f'],
      [[[p.a,Math.min(baseline,point.m2)],[p.a,Math.max(baseline,point.m2)]], '#b8c7cc']
    ], 'Pérdida (W/m) frente a espesor (mm) · máximo en rojo');
  }
  if (id === 290) {
    const points = Array.from({length: 101}, (_, i) => [i, nozzle(p.a, p.b, i / 100).pressure]);
    return graph(ctx, width, height, [[points, blue], [[[0,p.b],[100,p.b]], amber]], 'Presión estática / total · contrapresión en dorado');
  }
  if (point.profile) {
    const marks = id === 283 ? ['Salida de condensador','Salida de bomba','Entrada a turbina','Descarga de turbina']
      : ['Aspiración','Descarga','Líquido subenfriado','Salida de válvula'];
    point.profile.forEach((h, i) => ctx.fillText((i + 1) + ' · ' + marks[i] + ' · ' + h.toFixed(1) + ' kJ/kg', 12, 28 + i * 25, width - 24));
    return;
  }
  definition.metrics.forEach(({label, key, unit, decimals}, i) => {
    ctx.fillText(label + ' · ' + point[key].toFixed(decimals) + ' ' + unit, 12, 26 + i * 29, width - 24);
  });
  ctx.fillText('Ajuste registrado · ' + p.a + ' / ' + p.b, 12, 26 + definition.metrics.length * 29, width - 24);
}

function drawInstrument(ctx, width, height, id, point, p, ready, view) {
  ctx.clearRect(0, 0, width, height);
  ctx.font = '13px sans-serif';
  ctx.fillStyle = '#d7e8ee';
  if (!ready) {
    ctx.fillText('Prepara y ejecuta un ensayo para registrar las señales.', 12, 22, width - 24);
    return;
  }
  const definition = definitions.find(d => d.id === id);
  if (view === 'peak' || view === 'low') {
    if (view === 'low') return details(ctx, width, height, definition, p);
    definition.metrics.forEach(({label, key, unit, decimals}, i) => {
      ctx.fillText(label + ' · ' + point[key].toFixed(decimals) + ' ' + unit, 12, 26 + i * 29, width - 24);
    });
    return;
  }
  const points = Array.from({length: 97}, (_, i) => {
    const time = i * period / 96;
    const value = solve(id, p.a, p.b, time);
    const axis = id === 285 ? value.flowProbe : id >= 281 ? 100 * time / period : time;
    return [axis, value];
  });
  const axisLabel = id === 285 ? ' · caudal (m³/h)' : id >= 281 ? ' · recorrido (%)' : ' · tiempo de escena (s)';
  graph(ctx, width, height, [
    [points.map(([x, v]) => [x, v.signal]), blue],
    [points.map(([x, v]) => [x, v.reference]), amber]
  ], definition.signals + axisLabel);
}

export function launch(id) {
  const definition = definitions.find(d => d.id === id);
  const app = workOrder(id, {definitions, defaults, model: valueAt, build, update, drawInstrument,
    criteria: (id, p) => validate(id, p, definition.specs)});
  attachReviewCursor(app);
  preciseFraming(app, definition);
  return app;
}
