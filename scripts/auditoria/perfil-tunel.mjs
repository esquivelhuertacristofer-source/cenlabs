import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {performance} from 'node:perf_hooks';
import {tunel,prepararTunel} from '../../src/components/ciencias/escenas/fluidos.ts';
import {THREE,liberar} from '../../src/components/ciencias/escenas/kit.ts';
import {TunelLBM} from '../../src/domain/ciencias/lbm.ts';
import assert from 'node:assert/strict';
globalThis.fetch=async path=>{const bytes=await readFile(new URL('../../public'+path,import.meta.url));return {ok:true,arrayBuffer:async()=>bytes.buffer.slice(bytes.byteOffset,bytes.byteOffset+bytes.byteLength)};};
await prepararTunel('fisica-18');
const obj=tunel(),values={Re:80,velocity:.02};obj.root.userData.flowMode='vectores';
let start=performance.now();obj.update(values,{},0);const reset=performance.now()-start;
const runs=[];for(let i=1;i<=120;i++){start=performance.now();obj.update(values,{},i/60);runs.push(performance.now()-start);}
const sum=a=>a.reduce((x,y)=>x+y,0)/a.length,p95=a=>a.toSorted((x,y)=>x-y)[Math.floor(a.length*.95)];
obj.root.updateMatrixWorld(true);
const ray=new THREE.Raycaster(new THREE.Vector3(.4,5,.2),new THREE.Vector3(0,-1,0));
function picking(){const samples=[];for(let i=0;i<100;i++){start=performance.now();ray.intersectObject(obj.root,true);samples.push(performance.now()-start);}return {mean:sum(samples),p95:p95(samples)};}
const pickingAfter=picking(),restore=[];
obj.root.traverse(o=>{if(o instanceof THREE.Mesh||o instanceof THREE.Line){restore.push([o,o.raycast]);o.raycast=o instanceof THREE.InstancedMesh?THREE.InstancedMesh.prototype.raycast:o instanceof THREE.Mesh?THREE.Mesh.prototype.raycast:THREE.Line.prototype.raycast;}});
const pickingBefore=picking();for(const [o,fn] of restore)o.raycast=fn;
const fluid=new TunelLBM(80);fluid.step(20);start=performance.now();fluid.step(720);const oldWarmup=performance.now()-start;
const report={environment:'Node CPU, no equivale a FPS de GPU ni del navegador',resetMs:reset,previous720WarmupMs:oldWarmup,updateMs:{mean:sum(runs),p95:p95(runs)},pickingBeforeMs:pickingBefore,pickingAfterMs:pickingAfter};
assert(reset<oldWarmup,'Se elimina bloqueo de calentamiento');assert(pickingAfter.mean<pickingBefore.mean,'Menor coste de seleccionar');
const out=new URL('./.salida/tunel-interactivo/',import.meta.url);await mkdir(out,{recursive:true});await writeFile(new URL('rendimiento-cpu.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));liberar(obj.root);
