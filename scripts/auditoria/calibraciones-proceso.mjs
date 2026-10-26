// Comprueba que Modelo/Ficha no den la calibración antes del ensayo validado.
import {createRequire} from 'node:module';
import {createServer} from 'node:http';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
import {definitions} from '../../public/labs/_proceso-definiciones.js';
import {solutions} from '../../public/labs/_proceso-modelos.js';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const root=resolve(fileURLToPath(new URL('../../public/',import.meta.url))),out=new URL('./.salida/protecciones-proceso/',import.meta.url);
await mkdir(out,{recursive:true});
const types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=resolve(join(root,decodeURIComponent(req.url.split('?')[0])));if(!p.startsWith(root+'\\')&&!p.startsWith(root+'/'))throw Error('Ruta');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));let browser;const result=[];
const hidden={222:[/ganancia\s*1[,\.]035/i,/c=0[,\.]040/],227:[/patrón[^.]*28[,\.]00/i]};
try{browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader']});
 for(const size of [[1366,768],[390,844]])for(const d of definitions.filter(d=>d.referenceAfterValidation)){
  const context=await browser.newContext({viewport:{width:size[0],height:size[1]}}),page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
  try{await page.goto(`http://127.0.0.1:${server.address().port}/labs/${d.slug}.html`,{waitUntil:'networkidle'});await page.waitForFunction(()=>window.__labDebug);assert.equal(await page.locator('[data-calibration-reference]').count(),2);for(let i=0;i<d.tour.length;i++)await page.click('#tourNext');
   for(const [open,body,close]of [['#btnModel','#model','#closeModel'],['#fichaFab','#fichaCard','#fichaClose']]){await page.click(open);const text=await page.locator(body).innerText();assert(!text.includes(d.referenceAfterValidation));assert(hidden[d.id].every(re=>!re.test(text)),'Constantes anticipadas: '+d.id);await page.click(close);}
   for(const [key,value]of Object.entries(solutions[d.id])){await page.locator('#'+key).fill(String(value));await page.locator('#'+key).dispatchEvent('input');}
   await page.click('[data-mode="explorar"]');await page.click('#openJob');await page.click('#prepareJob');await page.click('#action');await page.waitForFunction(()=>__labDebug.ensayo().completed,null,{timeout:90000});
   assert.equal(await page.evaluate(()=>__labDebug.solved),false);assert((await page.locator('[data-calibration-reference]').allTextContents()).every(t=>!t.includes(d.referenceAfterValidation)));
   await page.click('[data-mode="reto"]');await page.click('#validate');assert.equal(await page.evaluate(()=>__labDebug.solved),true);
   for(const [open,body,close]of [['#btnModel','#model','#closeModel'],['#fichaFab','#fichaCard','#fichaClose']]){await page.click(open);assert((await page.locator(body).innerText()).includes(d.referenceAfterValidation));await page.click(close);}
   await page.click('[data-mode="explorar"]');await page.click('#openJob');const [download]=await Promise.all([page.waitForEvent('download'),page.click('#exportJob')]);const evidence=await readFile(await download.path(),'utf8');assert(evidence.includes(d.id===222?'SG0':'fase fraccionaria'));assert(evidence.includes('Ajuste conforme'));await page.click('#closeJob');
   const c=d.controls[0],val=Number((solutions[d.id][c.id]+c.step).toFixed(6));await page.locator('#'+c.id).fill(String(val));await page.locator('#'+c.id).dispatchEvent('input');assert.equal(await page.evaluate(()=>__labDebug.solved),false);assert((await page.locator('[data-calibration-reference]').allTextContents()).every(t=>!t.includes(d.referenceAfterValidation)));assert.equal(await page.evaluate(()=>__labDebug.ensayo().completed),false);
   assert.deepEqual(errors,[]);const row={id:d.id,size,antes:'oculto',ensayoSinValidar:'oculto',validado:'visible',ajusteCambiado:'oculto'};result.push(row);console.log(JSON.stringify(row));await writeFile(new URL('informe.json',out),JSON.stringify(result,null,2));
  }finally{await context.close();}
 }
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
