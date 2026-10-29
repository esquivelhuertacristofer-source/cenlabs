import {readFile,readdir,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createScene,prepararEscena} from '../../src/components/ciencias/escenas/registro.ts';
import {piezasDe} from '../../src/components/ciencias/escenas/inspeccion.ts';
import {THREE,liberar} from '../../src/components/ciencias/escenas/kit.ts';
globalThis.fetch=async path=>{const bytes=await readFile(new URL('../../public'+path,import.meta.url));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength),json:async()=>JSON.parse(bytes.toString('utf8'))};};
const reports=[];
for(const file of (await readdir(new URL('../../src/components/ciencias/definiciones/',import.meta.url))).filter(f=>f.endsWith('.ts'))){
const {default:d}=await import(new URL('../../src/components/ciencias/definiciones/'+file,import.meta.url));await prepararEscena(d.id);const scene=createScene(d.id),p=Object.fromEntries(d.controls.map(c=>[c.key,c.initial]));scene.update(d.model(p,d.previewTime??.8).values,p,d.previewTime??.8);scene.root.updateMatrixWorld(true);const parts=piezasDe(scene.root);assert(parts.length>=2,d.id+' sin dos componentes');assert(parts.length<=8);
for(const part of parts){let parent=part.objeto,attached=false;while(parent){if(parent===scene.root)attached=true;parent=parent.parent;}assert(attached,d.id+' pieza suelta '+part.nombre);assert(part.control<0||d.controls[Math.min(part.control,d.controls.length-1)],d.id+' control inválido');const b=new THREE.Box3().setFromObject(part.objeto);assert(!b.isEmpty(),d.id+' caja vacía '+part.nombre);assert([...b.min.toArray(),...b.max.toArray()].every(Number.isFinite),d.id+' caja no finita');}
let zero=0,nan=0,triangles=0;scene.root.traverse(o=>{if(!(o instanceof THREE.Mesh))return;const n=o.geometry.attributes.normal;for(let i=0;i<n?.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-8)zero++;for(const a of [o.geometry.attributes.position?.array,o.instanceMatrix?.array])for(const v of a||[])if(!Number.isFinite(v))nan++;triangles+=Math.min(o.geometry.index?.count??o.geometry.attributes.position.count,o.geometry.drawRange.count)/3*(o instanceof THREE.InstancedMesh?o.count:1);});assert.equal(zero,0,d.id+' normales nulas');assert.equal(nan,0,d.id+' no finito');assert(triangles<400000,d.id+' triangulos '+triangles);
reports.push({id:d.id,triangles,parts:parts.map(({nombre,control})=>({nombre,control}))});liberar(scene.root);
}
const out=new URL('./.salida/ciencias50/',import.meta.url);await mkdir(out,{recursive:true});await writeFile(new URL('piezas-interactivas.json',out),JSON.stringify(reports,null,2));console.log(JSON.stringify({labs:reports.length,parts:reports.reduce((n,r)=>n+r.parts.length,0)}));
