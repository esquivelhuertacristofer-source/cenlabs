/** Cierre local: exige 200 recorridos vigentes antes de promover las 50 prácticas. */
import {revisionNativa} from './ciencias50-versiones.mjs';
import {readFile,writeFile,readdir,copyFile} from 'node:fs/promises';
import {execFileSync} from 'node:child_process';
import {createRequire} from 'node:module';
import assert from 'node:assert/strict';
const sharp=createRequire(import.meta.url)('sharp'),ids=(await readdir('src/components/ciencias/definiciones')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3)),dir='scripts/auditoria/.salida/ciencias50',reports=[];
assert.equal(ids.length,50);
const special=JSON.parse(await readFile('scripts/auditoria/.salida/ciencias50-especiales/informe.json','utf8'));
assert.equal(special.length,8,'Faltan comparación, precisión, sincronías o reducción de movimiento');assert(special.every(r=>!r.errors.length&&!r.remote.length));
assert.equal(special.filter(r=>r.id==='matematicas-12'&&r.details.dragFraming).length,2,'Falta comprobar seguimiento tras arrastre en escritorio y móvil');assert(special.some(r=>r.id==='quimica-14'&&r.details.reject15Percent),'Falta comprobar la tolerancia del3 % con pérdidas pequeñas');
const legacyUI=JSON.parse(await readFile('scripts/auditoria/.salida/ciencias40-regresion/informe.json','utf8'));
assert.equal(legacyUI.length,40,'Faltan aperturas de las 40 anteriores');assert(legacyUI.every(r=>!r.error&&!r.errors.length));
const references=JSON.parse(await readFile('scripts/auditoria/.salida/ciencias40-regresion/referencias.json','utf8'));assert.equal(references.length,6);assert(references.every(r=>r.reference&&r.notebook&&!r.errors.length),'Falta comprobar las seis bitácoras originales');
const tests=JSON.parse(await readFile(`${dir}/jest-sin-goldens.json`,'utf8'));assert.equal(tests.exitCode,0);assert.equal(tests.suites,46);assert.equal(tests.tests,4195);
const certificate=JSON.parse(await readFile(`${dir}/jest-certificado.json`,'utf8'));assert(certificate.success&&certificate.numPassedTests===2,'Falta comprobar estabilidad y foco de los certificados nuevos y previos');
const flow=JSON.parse(await readFile('scripts/auditoria/.salida/tunel-interactivo/informe.json','utf8'));assert.equal(flow.length,4);assert(flow.every(r=>r.version>=2&&r.solidProbe&&!r.errors.length),'Falta comprobar sonda, tinta y vistas del túnel en cuatro tamaños');
for(const id of ids)for(const [width,dpr]of [[1366,1],[1600,1],[2020,1.25],[390,1]]){
 const r=JSON.parse(await readFile(`${dir}/${id}-${width}-dpr${dpr}-informe.json`,'utf8'));
 assert(r.version>=revisionNativa(id)&&r.prose?.version>=2&&r.prose.words<=120&&r.flow&&r.exploration&&r.downloaded&&r.states.length>=4&&!r.errors.length&&!r.remote.length,'QA incompleto: '+id+' / '+width);reports.push(r);
 assert(r.states.every(s=>s.calls>0&&s.calls<150&&s.tri>0&&s.tri<400000&&!s.zero&&!s.nan&&!s.overflow),'Hay un estado vacío o fuera de presupuesto: '+id+' / '+width);
}
// Verificar todos los activos antes de modificar una sola ficha.
for(const id of ids){const data=await readFile(`${dir}/portadas/${id}.webp`),meta=await sharp(data).metadata();assert(data.length>1000&&meta.width>=900,'Portada incompleta: '+id);}
const legacy=new Map();for(const f of await readdir('public/labs-data/briefing'))if(f.endsWith('.json')&&!ids.includes(f.slice(0,-5)))legacy.set(f,JSON.parse(await readFile('public/labs-data/briefing/'+f,'utf8')));assert.equal(legacy.size,290);
for(const id of ids){await copyFile(`${dir}/portadas/${id}.webp`,`public/images/ciencias/${id}.webp`);const path=`src/labs/${id}/catalogo.ts`,text=await readFile(path,'utf8');assert(/"destacada": (false|true)/.test(text));await writeFile(path,text.replace('"destacada": false','"destacada": true'));}
const golden='src/__tests__/golden/catalogo.golden.test.ts';let text=await readFile(golden,'utf8');for(const area of ['quimica','fisica','matematicas','biologia']){const pattern=new RegExp('(      '+area+': \\[)([^\\]]*)(\\],)'),match=text.match(pattern);assert(match,'Expectativa de catálogo ausente: '+area);const previous=[...match[2].matchAll(/'([^']+)'/g)].map(m=>m[1]),expected=[...new Set([...previous,...ids.filter(id=>id.startsWith(area+'-'))])];text=text.replace(pattern,()=>match[1]+expected.map(id=>"'"+id+"'").join(', ')+match[3]);}await writeFile(golden,text);
const flags=['--experimental-strip-types','--import','./scripts/_resolver-ts.mjs','--disable-warning=ExperimentalWarning','--disable-warning=MODULE_TYPELESS_PACKAGE_JSON'];
execFileSync(process.execPath,[...flags,'scripts/genera-ciencia-nativa.mjs',...ids],{stdio:'inherit'});
for(const script of ['scripts/gen-lab-registry.mjs','scripts/gen-lab-briefings.mjs'])execFileSync(process.execPath,[script],{stdio:'inherit'});
for(const [file,data]of legacy)assert.deepEqual(JSON.parse(await readFile('public/labs-data/briefing/'+file,'utf8')),data,'Briefing anterior alterado: '+file);
await writeFile(`${dir}/cierre-recorridos.json`,JSON.stringify({date:new Date().toISOString(),labs:50,flows:reports.length,proseMax:Math.max(...reports.map(r=>r.prose.words)),covers:50,legacyBriefingsPreserved:290,featured:true,published:false},null,2));
await writeFile('docs/continuidad/ciencias50-evidencia.json',JSON.stringify({date:new Date().toISOString(),status:'Validación local; publicación pendiente',labs:50,flows:reports.length,proseMax:Math.max(...reports.map(r=>r.prose.words)),legacyOpenings:legacyUI.length,legacyNotebooks:references.length,specific:special,tunnel:flow,cases:reports.map(r=>({id:r.id,width:r.width,height:r.height,dpr:r.dpr,version:r.version,flow:r.flow,exploration:r.exploration,downloaded:r.downloaded,proseWords:r.prose.words,maxCalls:Math.max(...r.states.map(s=>s.calls)),maxTriangles:Math.max(...r.states.map(s=>s.tri)),errors:r.errors})),release:null},null,2));
console.log('200 recorridos vigentes, 50 portadas finales y fichas destacadas; 290 briefings anteriores conservados. Falta publicación comprobada.');
