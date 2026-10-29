/** Los goldens crecen intencionalmente; las 290 entradas previas deben conservarse. */
import {createRequire} from 'node:module';
import {execFileSync} from 'node:child_process';
import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import {runInNewContext} from 'node:vm';
import assert from 'node:assert/strict';
const require=createRequire(import.meta.url),JSON5=require('json5'),baseline='8ab2f6f',dir='src/__tests__/golden/__snapshots__/',allowed=new Set((await readdir('src/components/ciencias/definiciones')).filter(x=>x.endsWith('.ts')).map(x=>x.slice(0,-3))),reports=[];
// pretty-format permite saltos de línea dentro de cadenas: no es JSON.
// Se comparan bloques literales por ID para conservar también toda su prosa.
function parseSnapshot(value){
 const v=value.replace(/\r\n/g,'\n').trim();
 if(v.startsWith('{')){const marks=[...v.matchAll(/^  "([^"]+)": /gm)];return Object.fromEntries(marks.map((m,i)=>[m[1],v.slice(m.index,marks[i+1]?.index??v.lastIndexOf('\n}')).trim().replace(/,$/,'')]));}
 if(/^  \{/m.test(v)){const marks=[...v.matchAll(/^  \{\n/gm)];return marks.map((m,i)=>{const blob=v.slice(m.index,marks[i+1]?.index??v.lastIndexOf('\n]')).trim().replace(/,$/,'');const id=blob.match(/^    "id": "([^"]+)"/m)?.[1];assert(id,'Entrada de catálogo sin ID');return {id,blob};});}
 return JSON5.parse(v);
}
function snapshots(text){const context={exports:{}};runInNewContext(text,context,{timeout:5000});return Object.fromEntries(Object.entries(context.exports).map(([k,v])=>[k,parseSnapshot(v)]));}
for(const file of ['data-stores.golden.test.ts.snap','catalogo.golden.test.ts.snap']){
 const old=snapshots(execFileSync('git',['show',baseline+':'+dir+file],{encoding:'utf8',maxBuffer:16*1024*1024})),current=snapshots(await readFile(dir+file,'utf8'));
 for(const [key,before]of Object.entries(old)){const after=current[key];assert(after,'Snapshot eliminado: '+key);let preserved=0,added=[];
  if(Array.isArray(before)){if(before.every(x=>typeof x==='string')){const kept=after.filter(x=>!allowed.has(x));assert.deepEqual(kept,before,'Inventario anterior alterado: '+key);preserved=before.length;added=after.filter(x=>allowed.has(x));}
   else{for(const row of before){assert.deepEqual(after.find(x=>x.id===row.id),row,'Catálogo anterior alterado: '+row.id);preserved++;}added=after.filter(x=>!before.some(q=>q.id===x.id)).map(x=>x.id);}}
  else{for(const [id,row]of Object.entries(before)){assert.deepEqual(after[id],row,'Datos anteriores alterados: '+key+' / '+id);preserved++;}added=Object.keys(after).filter(id=>!(id in before));}
  assert(added.every(id=>allowed.has(id)),'Adición fuera de las 50 autorizadas: '+key);reports.push({snapshot:key,preserved,added:added.length});
 }
}
assert(reports.some(r=>r.added===50),'El snapshot no recoge la ampliación de 50');const out='scripts/auditoria/.salida/ciencias50';await mkdir(out,{recursive:true});await writeFile(out+'/goldens-conservacion.json',JSON.stringify({baseline,allowed:allowed.size,reports},null,2));console.log(JSON.stringify({baseline,snapshots:reports.length,entriesPreserved:reports.reduce((n,r)=>n+r.preserved,0),newLabs:50}));
