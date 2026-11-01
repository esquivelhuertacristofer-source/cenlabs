import {execFileSync} from 'node:child_process';
import {writeFile} from 'node:fs/promises';
import {revisionSolidos} from './revision-solidos.mjs';
const revision=await revisionSolidos(),steps=[
 ['TypeScript',['--max-old-space-size=1536','node_modules/typescript/bin/tsc','--noEmit','-p','.']],
 ['ESLint',['--max-old-space-size=1024','node_modules/eslint/bin/eslint.js','src','--quiet']],
 ['Voz y briefing',['--max-old-space-size=1536','node_modules/jest/bin/jest.js','src/__tests__/voz.test.ts','src/__tests__/briefing-carga.test.tsx','--runInBand','--silent','--json','--outputFile','scripts/auditoria/.salida/solidos-251-260/jest-postvoz.json']],
 ['Registro',['scripts/gen-lab-registry.mjs','--check']],
 ['Briefings',['scripts/gen-lab-briefings.mjs','--check']],
 ['Física',['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON','scripts/auditoria/verifica-solidos-251-260.mjs']],
 ['Regresión física',['--disable-warning=MODULE_TYPELESS_PACKAGE_JSON','scripts/auditoria/verifica-industria-241-250.mjs']]
],results=[];
for(const [name,args]of steps){const start=Date.now();try{execFileSync(process.execPath,args,{stdio:'inherit'});results.push({name,args,exitCode:0,elapsedMs:Date.now()-start});}catch(error){results.push({name,args,exitCode:error.status??-1,elapsedMs:Date.now()-start});await save(false);throw error;}}
if(await revisionSolidos()!==revision){await save(false);throw Error('Cambió el producto durante la verificación.');}await save(true);
async function save(success){await writeFile(new URL('./.salida/solidos-251-260/codigo.json',import.meta.url),JSON.stringify({date:new Date().toISOString(),revision,success,results},null,2));}
