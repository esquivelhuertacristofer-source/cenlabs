// Se ejecuta al acabar los40 recorridos. No publica ni aprueba la calidad visual.
import {execFileSync} from 'node:child_process';
import {readFile,writeFile} from 'node:fs/promises';
import {freemem} from 'node:os';
import {setTimeout} from 'node:timers/promises';
import assert from 'node:assert/strict';
import {definitions} from '../../public/labs/_solidos-definiciones.js';
import {revisionSolidos} from './revision-solidos.mjs';
const out=new URL('./.salida/solidos-251-260/',import.meta.url),revision=await revisionSolidos(),rows=JSON.parse(await readFile(new URL('informe.json',out),'utf8')),valid=new Map(rows.filter(r=>r.revision===revision&&r.full&&r.errors.length===0).map(r=>[r.id+'-'+r.size.join(','),r]));assert.equal(valid.size,40,'Completar primero la cola de40 recorridos vigentes');
const steps=[];
async function run(name,args,env={}){let wait=0;while(freemem()<1536*1024**2){if(wait++>=12)throw Error('Falta memoria antes de '+name);await setTimeout(15000);}console.log('\n'+name);const start=Date.now();try{execFileSync(process.execPath,['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON',...args],{stdio:'inherit',env:{...process.env,...env}});steps.push({name,args,exitCode:0,elapsedMs:Date.now()-start});}catch(e){steps.push({name,args,exitCode:e.status??-1,elapsedMs:Date.now()-start});await save();throw e;}await save();}
async function save(){await writeFile(new URL('preparacion.json',out),JSON.stringify({revision,steps,date:new Date().toISOString()},null,2));}
await run('Regresión del runtime por defecto:250',['scripts/auditoria/regresion-runtime-250.mjs']);
await run('Comprobaciones finales sin navegador',['scripts/auditoria/comprueba-codigo-solidos.mjs']);
for(const d of definitions){await run('Reconstrucción '+d.id,['scripts/build-lab.mjs',d.slug]);await run('Verificación numérica individual '+d.id,['scripts/auditoria/verifica-'+d.slug+'.mjs']);}
for(const start of [0,5]){const group=definitions.slice(start,start+5);await run('Barrido oficial '+group[0].id+'–'+group.at(-1).id,['scripts/auditoria/barrido-labs.mjs','--solo',group.map(d=>d.slug).join(',')],{BARRIDO_A_LA_VEZ:'1'});const report=JSON.parse(await readFile(new URL('./.salida/barrido.json',import.meta.url),'utf8'));assert.equal(report.length,5);assert(report.every(r=>r.ok),'Hallazgos en el barrido oficial');await writeFile(new URL('barrido-'+group[0].id+'.json',out),JSON.stringify({revision,report},null,2));}
for(const d of definitions){await run('Portada propia '+d.id,['scripts/portadas/capturar-portadas.mjs','--solo',String(d.id)]);const report=JSON.parse(await readFile(new URL('../portadas/.salida/informe-portadas.json',import.meta.url),'utf8'));await writeFile(new URL('portada-'+d.id+'.json',out),JSON.stringify({revision,report},null,2));}
assert.equal(await revisionSolidos(),revision,'Producto estable durante la preparación');console.log('Preparación local terminada. Revisar imágenes y completar autocrítica; no hay publicación.');
