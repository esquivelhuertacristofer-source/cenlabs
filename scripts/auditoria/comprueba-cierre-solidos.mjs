import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';
import {createHash} from 'node:crypto';
import {execFileSync} from 'node:child_process';
import {definitions} from '../../public/labs/_solidos-definiciones.js';
import {revisionSolidos} from './revision-solidos.mjs';
const root=new URL('../../',import.meta.url),out=new URL('./.salida/solidos-251-260/',import.meta.url),json=async name=>JSON.parse(await readFile(new URL(name,out),'utf8')),revision=await revisionSolidos();
const rows=(await json('informe.json')).filter(r=>r.revision===revision&&r.full),map=new Map(rows.map(r=>[r.id+'-'+r.size.join(','),r])),sizes=['1366,768,1','1600,900,1','2020,1055,1.25','390,844,1'];
for(const d of definitions)for(const size of sizes){const r=map.get(d.id+'-'+size);assert(r,'Falta recorrido actual '+d.id+' '+size);assert.deepEqual(r.errors,[]);assert.equal(r.initial.health.normalesCero,0);assert.equal(r.initial.health.posicionesNaN,0);assert(!r.initial.overflow&&r.initial.prose<=120);assert(r.initial.health.llamadas<150&&r.initial.health.tri<400000);if(size!=='390,844,1')assert(r.initial.measure.altoPorcentaje>=55&&r.initial.measure.altoPorcentaje<=70,'Encuadre '+d.id+' '+size);}
assert.equal(map.size,40);
const code=await json('codigo.json');assert(code.success&&code.revision===revision);assert(code.results.every(r=>r.exitCode===0));const jest=await json('jest-final.json');assert(jest.success&&jest.numPassedTestSuites===50&&jest.numPassedTests===4289);const post=await json('jest-postvoz.json');assert(post.success);
const audio=await json('voz.json'),byText=new Map(audio.pruebas.map(p=>[p.texto,p.shaAudio]));
const raw=execFileSync(process.execPath,['--experimental-strip-types','--import','./scripts/_resolver-ts.mjs','--disable-warning=ExperimentalWarning','--disable-warning=MODULE_TYPELESS_PACKAGE_JSON','scripts/voz/extraer-voz.mjs'],{encoding:'utf8',maxBuffer:16*1024*1024}),clips=JSON.parse(raw).filter(x=>definitions.some(d=>'mecanica-'+d.id===x.carpeta));assert.equal(clips.length,150);
for(const clip of clips){const bytes=await readFile(new URL('public/assets/voz/'+clip.carpeta+'/'+clip.clave+'.mp3',root));assert.equal(createHash('sha256').update(bytes).digest('hex'),byText.get(clip.texto),'Voz vigente '+clip.carpeta+'/'+clip.clave);}
const visual=await json('autocritica.json');assert.equal(visual.revision,revision);
for(const d of definitions){const cover=await readFile(new URL('public/images/mecanica/prac_'+d.id+'.webp',root));assert(cover.length>2000&&cover.toString('ascii',0,4)==='RIFF'&&cover.toString('ascii',8,12)==='WEBP','Portada '+d.id);assert(visual.labs.some(v=>v.id===d.id&&v.aprobado===true&&v.observacion),'Revisión visual '+d.id);}
const summary={date:new Date().toISOString(),revision,labs:definitions.map(d=>d.id),recorridos:40,voiceClips:150,jest:{suites:50,tests:4289},codigo:true,visual:true,publicacion:'pendiente de autorización'};console.log(JSON.stringify(summary,null,2));
