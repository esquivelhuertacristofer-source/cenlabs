import {createRequire} from 'node:module';
import {readdir,readFile,writeFile} from 'node:fs/promises';
import {fileURLToPath} from 'node:url';
import {revisionNativa} from './ciencias50-versiones.mjs';
const sharp=createRequire(import.meta.url)('sharp'),root=new URL('../../',import.meta.url),out=new URL('scripts/auditoria/.salida/ciencias50/',root),directory=new URL('src/components/ciencias/definiciones/',root),files=(await readdir(directory)).filter(f=>f.endsWith('.ts')),words={},cards=[];
for(const file of files){const id=file.slice(0,-3);
 const report=JSON.parse(await readFile(new URL(id+'-1366-dpr1-informe.json',out),'utf8'));if(report.version<revisionNativa(id)||report.prose?.version<2)throw Error('Falta evidencia vigente: '+id);words[id]=report.prose.words;
 const rect=report.health.canvas,img=new URL(id+'-1366-dpr1-inicial.png',out),data=await sharp(fileURLToPath(img)).extract({left:Math.ceil(rect.left),top:Math.ceil(rect.top),width:Math.floor(rect.width),height:Math.floor(rect.height)}).resize(310,280,{fit:'contain',background:'#091725'}).png().toBuffer(),label=Buffer.from(`<svg width="310" height="30"><rect width="310" height="30" fill="#102b3b"/><text x="12" y="22" fill="#bfe2e6" font-family="Arial" font-size="16">${id}</text></svg>`);cards.push(await sharp({create:{width:310,height:310,channels:4,background:'#091725'}}).composite([{input:label,top:0,left:0},{input:data,top:30,left:0}]).png().toBuffer());
}
for(let i=0;i<cards.length;i+=15){const group=cards.slice(i,i+15);await sharp({create:{width:1550,height:Math.ceil(group.length/5)*310,channels:4,background:'#091725'}}).composite(group.map((input,j)=>({input,left:j%5*310,top:Math.floor(j/5)*310}))).png().toFile(fileURLToPath(new URL('contactos-'+(i/15+1)+'.png',out)));}
await writeFile(new URL('prosa-inicial.json',out),JSON.stringify({method:'Medición DOM real de los50 informes1366 vigentes, prosa v2: párrafos visibles y mensaje completo del tutor; excluye controles, cifras, fuentes y desplegables cerrados.',max:Math.max(...Object.values(words)),words},null,2));console.log(cards.length+' vistas compuestas; máximo '+Math.max(...Object.values(words))+' palabras de prosa inicial en1366.');
