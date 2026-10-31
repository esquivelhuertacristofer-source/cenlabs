import {readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {createScene,prepararEscena} from '../../src/components/ciencias/escenas/registro.ts';
import {THREE,liberar} from '../../src/components/ciencias/escenas/kit.ts';
globalThis.fetch=async path=>({ok:true,json:async()=>JSON.parse(await readFile(new URL('../../public'+path,import.meta.url),'utf8'))});
let distances=0,residues=0;
for(const [id,code,scale]of [['biologia-11','1lyz',.065],['biologia-12','2xnd',.025]]){
 await prepararEscena(id);const source=JSON.parse(await readFile(new URL('../../public/labs-data/ciencias/estructuras/'+code+'.json',import.meta.url),'utf8')),scene=createScene(id),clouds=[];
 scene.root.traverse(o=>{if(o.name==='residuos-carbono-alfa')clouds.push(o);});
 assert.equal(clouds.length,Object.keys(source.chains).length);
 for(const [chain,points]of Object.entries(source.chains)){
  const cloud=clouds.find(c=>c.userData.sourceChain===chain);assert(cloud,'Cadena '+chain);assert.equal(cloud.count,points.length);residues+=cloud.count;
  for(let i=1;i<points.length;i++){const a=new THREE.Matrix4(),b=new THREE.Matrix4();cloud.getMatrixAt(i-1,a);cloud.getMatrixAt(i,b);const displayed=new THREE.Vector3().setFromMatrixPosition(a).distanceTo(new THREE.Vector3().setFromMatrixPosition(b)),expected=new THREE.Vector3(...points[i-1]).distanceTo(new THREE.Vector3(...points[i]))*scale;assert(Math.abs(displayed-expected)<1e-6,code+' distancias interresiduo');distances++;}
 }
 if(id==='biologia-12')for(const name of ['monocapa-superior','monocapa-inferior']){const leaf=scene.root.getObjectByName(name),[heads,tails]=leaf.children;assert.equal(tails.count,heads.count*2);const a=new THREE.Matrix4();for(let i=0;i<tails.count;i++){tails.getMatrixAt(i,a);assert(Math.abs(a.elements[13])<.27,'Colas dentro del núcleo hidrofóbico');}}
 liberar(scene.root);
}
console.log(JSON.stringify({residues,distances,structures:2,source:'Depósitos locales 1LYZ y 2XND; distancias Cα conservadas'}));
