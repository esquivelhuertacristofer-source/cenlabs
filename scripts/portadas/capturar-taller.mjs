// Portadas reproducibles del shell modular 187–200. Un solo navegador.
import {createServer} from 'node:http';
import {readFile,mkdir,writeFile} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import {createRequire} from 'node:module';
import {definitions} from '../../public/labs/_taller-definiciones.js';
const root=resolve(fileURLToPath(new URL('../../public/',import.meta.url)));
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2','.json':'application/json'};
const onlyIndex=process.argv.indexOf('--solo'),only=onlyIndex>=0?+process.argv[onlyIndex+1]:0;
const server=createServer(async(req,res)=>{try{const p=resolve(join(root,decodeURIComponent(req.url.split('?')[0])));if(!p.startsWith(root+'/')&&!p.startsWith(root+'\\'))throw Error('Ruta inválida');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;
try{
 await mkdir(join(root,'images/mecanica'),{recursive:true});
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 const context=await browser.newContext({viewport:{width:1080,height:720},deviceScaleFactor:1,reducedMotion:'reduce'});
 for(const d of definitions.filter(d=>!only||d.id===only)){const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));try{
  await page.goto(`http://127.0.0.1:${server.address().port}/labs/${d.slug}.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__labDebug);await page.addStyleTag({content:'#labRoot>*:not(#stage),#fichaFab{display:none!important}#stage{inset:0!important}#stage>*:not(canvas){display:none!important}'});await page.waitForTimeout(600);
  await page.evaluate(()=>{const d=window.__diag3d;d.camara.position.sub(d.controles.target).multiplyScalar(.92).add(d.controles.target);d.controles.update();});await page.waitForTimeout(150);
  const png=await page.locator('#stage').screenshot({type:'png'});
  const result=await page.evaluate(async b64=>{const img=new Image();await new Promise((ok,no)=>{img.onload=ok;img.onerror=no;img.src='data:image/png;base64,'+b64;});const c=document.createElement('canvas');c.width=720;c.height=480;const g=c.getContext('2d');g.drawImage(img,0,0,720,480);const pixels=g.getImageData(0,0,720,480).data,colors=new Set();for(let i=0;i<pixels.length;i+=100)colors.add(pixels[i]+','+pixels[i+1]+','+pixels[i+2]);return {url:c.toDataURL('image/webp',.85),colors:colors.size};},png.toString('base64'));
  if(errors.length||result.colors<100)throw Error(`${d.id}: portada inválida ${errors.join(',')}`);
  const bytes=Buffer.from(result.url.split(',')[1],'base64');await writeFile(join(root,`images/mecanica/prac_${d.id}.webp`),bytes);console.log(`${d.id}: ${bytes.length} bytes · ${result.colors} colores · escena propia`);
 }finally{await page.close();}}
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
