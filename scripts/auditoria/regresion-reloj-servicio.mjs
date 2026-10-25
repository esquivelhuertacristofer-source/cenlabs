// Un navegador, ocho familias previas y protección del indicio MCSA.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {definitions} from '../../public/labs/_servicio-definiciones.js';
import {solutions} from '../../public/labs/_servicio-modelos.js';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const root=resolve(fileURLToPath(new URL('../../public/',import.meta.url))),out=new URL('./.salida/servicio-201-210/',import.meta.url);
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
await mkdir(out,{recursive:true});
const server=createServer(async(req,res)=>{try{const p=resolve(join(root,decodeURIComponent(req.url.split('?')[0])));if(!p.startsWith(root+'\\')&&!p.startsWith(root+'/'))throw Error('Ruta');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;const results=[];
try{
 browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 for(const id of [164,167,176,177,181,187,193,200]){
  const context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));
  try{
   await page.addInitScript(()=>{const raf=window.requestAnimationFrame.bind(window);let first=true;window.__clockSamples=[];window.requestAnimationFrame=cb=>raf(t=>{if(first&&window.__labDebug){first=false;cb(t-1000);}else cb(t);const s=window.__labDebug?.state?.();if(Number.isFinite(s?.t)&&window.__clockSamples.length<300)window.__clockSamples.push(s.t);});});
   const cat=await readFile(join(root,`../src/labs/mecanica-${id}/catalogo.ts`),'utf8'),url=cat.match(/simuladorHtml:\s*["']([^"']+)/)[1];
   await page.goto(`http://127.0.0.1:${server.address().port}${url}`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__diag3d&&window.__labDebug);await page.waitForTimeout(600);
   const state=await page.evaluate(()=>({samples:window.__clockSamples,health:__diag3d.salud()}));assert(state.samples.length>0);assert(state.samples.every((t,i)=>t>=0&&(!i||t>=state.samples[i-1])));assert.equal(state.health.normalesCero,0);assert.equal(state.health.posicionesNaN,0);assert.deepEqual(errors,[]);
   results.push({id,frames:state.samples.length,initialTimestampOffsetMs:-1000,minimum:Math.min(...state.samples),monotonic:true,normalesCero:0,errors});console.log(JSON.stringify(results.at(-1)));
  }finally{await context.close();}
 }
 const d=definitions.find(d=>d.id===209),context=await browser.newContext({viewport:{width:1366,height:768}}),page=await context.newPage();
 for(const correct of [false,true])try{
  const errors=[];page.on('pageerror',e=>errors.push(e.message));await page.goto(`http://127.0.0.1:${server.address().port}/labs/${d.slug}.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__labDebug);
  const visible=()=>page.evaluate(()=>__diag3d.escena.getObjectByName('indicador-barra-rotor').visible);
  assert.equal(await visible(),true);for(let i=0;i<d.tour.length;i++)await page.click('#tourNext');
  for(const [key,val]of Object.entries(solutions[209])){await page.locator('#'+key).fill(String(val));await page.locator('#'+key).dispatchEvent('input');}
  await page.click('[data-mode="explorar"]');await page.click('#openJob');await page.click('#prepareJob');await page.click('#action');await page.waitForFunction(()=>__labDebug.ensayo().completed,null,{timeout:90000});await page.click('[data-mode="reto"]');await page.click('#validate');assert.equal(await page.evaluate(()=>__labDebug.solved),true);assert.equal(await visible(),true);
  await page.click('#openQuiz');await page.getByRole('button',{name:d.answers[correct?0:1],exact:true}).click();await page.waitForTimeout(120);assert.equal(await visible(),!correct);
  await page.click('[data-mode="explorar"]');await page.evaluate(()=>{const c=document.getElementById('load');c.value='71';c.dispatchEvent(new Event('input',{bubbles:true}));c.value='70';c.dispatchEvent(new Event('input',{bubbles:true}));});assert.equal(await page.evaluate(()=>__labDebug.ensayo().completed),false,'Cambiar y restaurar en el mismo turno no debe revivir el ensayo');await page.waitForFunction(()=>__diag3d.escena.getObjectByName('indicador-barra-rotor').visible);assert.deepEqual(errors,[]);
  results.push({id:209,indicioAntes:'oculto',trasValidar:'oculto',respuesta:correct?'correcta':'incorrecta',indicioTrasResponder:correct?'visible':'oculto',cambioYDeshacerSinFotograma:'registro inválido e indicio oculto',errors});
 }finally{if(!correct)await page.reload({waitUntil:'networkidle'});else await context.close();}
 await writeFile(new URL('regresion-reloj-e-indicio.json',out),JSON.stringify(results,null,2));
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
