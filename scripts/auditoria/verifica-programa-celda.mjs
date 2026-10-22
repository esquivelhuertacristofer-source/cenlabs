import assert from 'node:assert/strict';
import {readFile} from 'node:fs/promises';

// Aísla el intérprete puro del import de Three.js para comprobarlo en Node.
const path=new URL('../../public/labs/_programa-celda.js',import.meta.url);
const source=(await readFile(path,'utf8')).replace(/^import[^\n]+\n/,'');
const {compileBlocks,gripCapacity,smooth}=await import('data:text/javascript;base64,'+Buffer.from(source).toString('base64'));
assert.throws(()=>compileBlocks([{type:'end'}]),/sin inicio/);
assert.throws(()=>compileBlocks([{type:'repeat'}]),/Falta/);
assert.throws(()=>compileBlocks([{type:'repeat'},{type:'end'}]),/vacío/);
assert.throws(()=>compileBlocks(Array(41).fill({type:'wait'})),/40/);
const ast=compileBlocks([{type:'repeat',count:2},{type:'ifHeld'},{type:'move',value:'salida'},{type:'end'},{type:'end'}]);
assert.equal(ast[0].children[0].children[0].value,'salida');
assert(gripCapacity(20)<2.5*9.81);
assert(gripCapacity(60)>2.5*9.81);
assert.equal(smooth(0),0);assert.equal(smooth(1),1);
let previous=0;
for(let i=0;i<=1000;i++){const x=smooth(i/1000);assert(x>=previous&&x<=1);previous=x;}
const eps=1e-5;
assert(Math.abs((smooth(eps)-smooth(0))/eps)<1e-7);
assert(Math.abs((smooth(1)-smooth(1-eps))/eps)<1e-7);
console.log('Programa de celda: sintaxis, anidamiento, límites, agarre y trayectoria quíntica OK.');
