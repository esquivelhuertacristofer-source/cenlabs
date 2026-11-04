import {execFileSync} from 'node:child_process';
import {access, writeFile} from 'node:fs/promises';
const labId = Number(process.argv[2]);
const set = labId < 291 ? 'dinamica' : 'control-avanzado';
const {definitions} = await import('../public/labs/_' + set + '-definiciones.js');
const definition = definitions.find(item => item.id === labId);
if (!definition) throw new Error('ID de práctica desconocido');
const d = definition;
const id = 'mecanica-' + d.id;
const dir = 'src/labs/' + id;
const html = '/labs/' + d.slug + '.html';
const run = args => execFileSync(process.execPath, args, {stdio: 'inherit'});
const serialize = value => JSON.stringify(value, null, 2);

try {
  await access(dir + '/index.ts');
} catch {
  run(['scripts/new-lab.mjs', id, '--titulo', d.title, '--modulo', d.module, '--duracion', '40 min', '--iframe', html, '--no-gen']);
}
const catalog = {modulo: d.module, titulo: d.title, duracion: '40 min', teoria: d.equations + ' ' + d.limits, estado: 'activo', simuladorHtml: html};
await writeFile(dir + '/catalogo.ts', "import type { CatalogoEntry } from '../_types';\nconst catalogo: CatalogoEntry = " + serialize(catalog).replace(/"(\w+)":/g, '$1:') + ';\nexport default catalogo;\n');
const briefing = {
  codigo: 'MEC-' + d.id, titulo: d.title, subtitulo: d.module, acento: '#2A9D8F', duracion: 40, videoUrl: '',
  bienvenida: d.intro + '\n' + d.job, conceptos: d.concepts, mision: d.procedure,
  aplicaciones: [{area: d.module, ejemplo: d.explore}]
};
await writeFile(dir + '/briefing.ts', "import type { BriefingConfig } from '@/components/MissionBriefing';\nconst briefing: BriefingConfig = " + serialize(briefing) + ';\nexport default briefing;\n');
const ficha = {
  title: d.title, intro: d.intro,
  s1: {presentes: d.tools, omitidos: [d.limits]},
  s2: {title: 'Modelo del banco', rows: [['Relación', 'Detalle', 'Origen'], ['Dinámica', d.equations, 'Modelo didáctico'], ['Escena', d.caption, 'Escala del banco']]},
  s3: [d.task], s4: {intro: 'Procedimiento', items: d.procedure},
  s5: {modela: d.equations, noModela: d.limits}, s6: [d.sourceName + ' · ' + d.source]
};
await writeFile('public/labs/_ficha-' + d.slug + '.js', 'fichaTecnica(' + serialize(ficha) + ');\n');
await writeFile('scripts/lab-src/' + d.slug + '.json', serialize({mode: 'mecanismo', set, id: d.id, out: d.slug + '.html'}) + '\n');
run(['scripts/build-lab.mjs', d.slug]);
run(['scripts/gen-lab-registry.mjs']);
run(['scripts/gen-lab-briefings.mjs']);
