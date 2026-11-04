import assert from 'node:assert/strict';
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {mkdir, readFile, writeFile} from 'node:fs/promises';
import {extname, resolve, sep} from 'node:path';
import {definitions as control} from '../../public/labs/_control-avanzado-definiciones.js';
import {definitions as dynamics} from '../../public/labs/_dinamica-definiciones.js';

const definitions = [...dynamics, ...control];

const {chromium} = createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const root = resolve('public');
const output = resolve('scripts/auditoria/.salida/control-avanzado');
const type = {'.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.woff2': 'font/woff2'};
const server = createServer(async (request, response) => {
  try {
    const path = resolve(root, '.' + decodeURIComponent(new URL(request.url, 'http://localhost').pathname));
    if (!path.startsWith(root + sep)) throw new Error('Ruta inválida');
    response.setHeader('Content-Type', type[extname(path)] ?? 'application/octet-stream');
    response.end(await readFile(path));
  } catch {
    response.writeHead(404).end();
  }
});
const definition = definitions.find(item => item.id === Number(process.argv[2] ?? 291));
assert.ok(definition);
const sizes = [[1366,768,1],[1600,900,1],[2020,1055,1.25],[390,844,1]];
const widthsArg = process.argv.find(arg => arg.startsWith('--anchos='));
const widths = widthsArg ? widthsArg.slice('--anchos='.length).split(',').map(Number) : sizes.map(([width]) => width);
assert.ok(widths.length && widths.every(width => sizes.some(([valid]) => width === valid)));
const viewports = sizes.filter(([width]) => widths.includes(width));
await mkdir(output, {recursive: true});
await new Promise(ok => server.listen(0, '127.0.0.1', ok));
const browser = await chromium.launch({headless: true, args: ['--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-watchdog','--mute-audio']});
const reports = [];
try {
  for (const [width, height, deviceScaleFactor] of viewports) {
    const context = await browser.newContext({viewport: {width, height}, deviceScaleFactor});
    try {
      const page = await context.newPage();
      const errors = [];
      page.on('pageerror', error => errors.push(error.message));
      page.on('console', message => { if (message.type() === 'error') errors.push(message.text()); });
      page.on('requestfailed', request => errors.push(request.failure().errorText + ' ' + request.url()));
      await page.addInitScript(() => { speechSynthesis.speak = () => {}; });
      await page.goto('http://127.0.0.1:' + server.address().port + '/labs/' + definition.slug + '.html');
      await page.waitForFunction(() => window.__labDebug && window.__diag3d);
      assert.equal(await page.locator('#reviewPosition').isVisible(), false);
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-inicio.png'});
      const geometry = await page.evaluate(() => window.__diag3d.salud());
      assert.equal(geometry.normalesCero, 0);
      assert.equal(geometry.posicionesNaN, 0);
      assert.ok(geometry.llamadas < 150, 'Presupuesto de llamadas de dibujo');
      assert.deepEqual(geometry.sinNormal, []);
      assert.deepEqual(geometry.esferasRotas, []);
      await page.click('#tourSkip');
      await page.click('#fichaFab');
      await page.click('#fichaClose');
      await page.click('[data-view="inspection"]');
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-inspeccion.png'});
      await page.click('[data-view="assembly"]');
      const adjustments = {
        271: {a: 4, b: 40},
        272: {a: 2, b: 0.15},
        273: {a: 900, b: 0.25},
        274: {a: 1, b: 0.22},
        275: {a: 2200, b: 90},
        276: {a: 75, b: 0.1},
        277: {a: 1, b: 2},
        278: {a: 65, b: 45},
        279: {a: 0.8, b: 0.5},
        280: {a: 0.85, b: 10},
        281: {a: 2.5, b: 0.65},
        282: {a: 160, b: 45},
        283: {a: 7, b: 550},
        284: {a: -6, b: 8},
        285: {a: 1750, b: 0.021},
        286: {a: 1.5, b: 0.001},
        287: {a: 65, b: 0.5},
        288: {a: 10, b: 3},
        289: {a: 12, b: 3},
        290: {a: 2.5, b: 0.7},
        291: {tracking: 4}, 292: {gain: 3, lead: 3}, 293: {gain: 3, lag: .25},
        294: {positionGain: 4, speedBandwidth: 12}, 295: {transport: 2, address: 107},
        296: {io: 5, updateIndex: 1}, 297: {ramp: 650, limit: 4},
        298: {rpm: 1000, sampleRate: 1400}, 299: {architecture: 3, fault: 2},
        300: {window: 16, interval: 2}
      };
      const adjustment = adjustments[definition.id];
      for (const [control, value] of Object.entries(adjustment)) {
        await page.locator('#' + control).fill(String(value));
      }
      await page.click('#openJob');
      await page.click('#prepareJob');
      await page.click('#action');
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-ensayo.png'});
      await page.waitForFunction(() => window.__labDebug.ensayo().completed, null, {timeout: 60000});
      await page.click('[data-mode="reto"]');
      await page.click('#validate');
      assert.ok(await page.evaluate(() => window.__labDebug.solved));
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-validado.png'});
      await page.click('#openQuiz');
      await page.getByRole('button', {name: definition.answers[0], exact: true}).click();
      assert.ok(await page.evaluate(() => window.__labDebug.quizAnswer === window.__labDebug.quizCorrectIndex));
      await page.click('[data-mode="explorar"]');
      await page.click('#openJob');
      await page.locator('#fftBand').selectOption('low');
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-instrumento.png'});
      const download = page.waitForEvent('download');
      await page.click('#exportJob');
      assert.match(await readFile(await (await download).path(), 'utf8'), /Ajuste conforme/);
      await page.click('#closeJob');
      assert.equal(await page.locator('#reviewPosition').isVisible(), true);
      await page.locator('#reviewPosition').fill('2.25');
      const review = await page.evaluate(() => window.__labDebug.state());
      assert.equal(review.t, 2.25);
      assert.equal(review.paused, true);
      const quality = page.locator('#btnQuality');
      if (!(await quality.textContent()).includes('media')) await quality.click();
      assert.match(await quality.textContent(), /media/);
      await page.screenshot({path: output + '/' + definition.id + '-' + width + '-calidad.png'});
      const changedControl = page.locator('#' + Object.keys(adjustment)[0]);
      await changedControl.fill(await changedControl.getAttribute('min'));
      await page.waitForFunction(() => document.getElementById('reviewCursor').hidden);
      assert.deepEqual(errors, []);
      reports.push({width, height, deviceScaleFactor, geometry, errors});
      console.log(definition.id, width, height, 'correcto');
    } finally {
      await context.close();
    }
  }
  const suffix = widthsArg ? '-' + widths.join('-') : '';
  await writeFile(output + '/' + definition.id + suffix + '-informe.json', JSON.stringify(reports, null, 2));
} finally {
  await browser.close();
  server.close();
}
