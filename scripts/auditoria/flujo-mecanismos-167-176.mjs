import {createRequire} from 'node:module';
import {mkdir,readFile,writeFile} from 'node:fs/promises';
import {createServer} from 'node:http';
import {resolve,join,extname} from 'node:path';
import {fileURLToPath} from 'node:url';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
import {definitions as defs} from '../../public/labs/_mecanismos-definiciones.js';
const {solutions}=await import('./verifica-mecanismos-167-176.mjs');
const out=new URL('./.salida/mecanismos-167-176/',import.meta.url);await mkdir(out,{recursive:true});const reports=[];
const root=resolve(fileURLToPath(new URL('../../public/',import.meta.url))),types={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2'};
const server=createServer(async(req,res)=>{try{const p=resolve(join(root,decodeURIComponent(req.url.split('?')[0])));if(!p.startsWith(root+'/')&&!p.startsWith(root+'\\'))throw Error('Ruta inválida');res.setHeader('Content-Type',types[extname(p)]||'application/octet-stream');res.end(await readFile(p));}catch{res.writeHead(404);res.end();}});
await new Promise(ok=>server.listen(0,'127.0.0.1',ok));const base='http://127.0.0.1:'+server.address().port;
const only=process.argv.includes('--solo')?+process.argv[process.argv.indexOf('--solo')+1]:0;
const initialOnly=process.argv.includes('--inicial');const startId=+(process.env.QA_START||167);let browser;
try{browser=await chromium.launch({headless:true,args:['--use-angle=swiftshader','--disable-gpu-sandbox']});
 for(const size of (process.env.QA_MOBILE_ONLY?[[390,844,1]]:initialOnly?[[1366,768,1]]:[[1366,768,1],[1600,900,1],[2020,1055,1.25],[390,844,1]]))for(const d of defs.filter(d=>d.id>=startId&&(!only||d.id===only))){
  const context=await browser.newContext({viewport:{width:size[0],height:size[1]},deviceScaleFactor:size[2]}),page=await context.newPage(),errors=[];
  page.on('pageerror',e=>errors.push(e.message));page.on('console',e=>{if(e.type()==='error')errors.push(e.text());});
  try{await page.goto(base+'/labs/'+d.slug+'.html',{waitUntil:'networkidle',timeout:90000});await page.waitForFunction(()=>window.__labDebug,{timeout:60000});await page.waitForTimeout(500);
   const initial=await page.evaluate(()=>({health:__diag3d.salud(),measure:__labDebug.mideObjeto(),prose:[...document.querySelectorAll('p')].filter(e=>e.getClientRects().length).reduce((s,e)=>s+e.textContent.trim().split(/\s+/).length,0),overflow:document.documentElement.scrollWidth>innerWidth||document.querySelector('aside').scrollHeight>document.querySelector('aside').clientHeight}));
   await page.screenshot({path:fileURLToPath(new URL(`${d.id}-${size[0]}-inicial.png`,out)),timeout:60000});assert.equal(initial.health.normalesCero,0);assert.equal(initial.overflow,false);assert(initial.prose<=120,`Prosa ${initial.prose}`);assert(initial.health.llamadas<150);assert(initial.health.tri<400000);
   if(!initialOnly){for(let i=0;i<d.tour.length;i++)await page.click('#tourNext');await page.click('#validate');assert.equal(await page.evaluate(()=>__labDebug.solved),false);
    for(const [key,val] of Object.entries(solutions[d.id])){await page.locator('#'+key).fill(String(val));await page.locator('#'+key).dispatchEvent('input');}await page.waitForTimeout(800);await page.click('#validate');assert.equal(await page.evaluate(()=>__labDebug.solved),true);
    await page.screenshot({path:fileURLToPath(new URL(`${d.id}-${size[0]}-reto.png`,out)),timeout:60000});await page.click('#openQuiz');await page.getByRole('button',{name:d.answers[0],exact:true}).click();assert.equal(await page.evaluate(()=>__labDebug.quizAnswer===__labDebug.quizCorrectIndex),true);
    await page.click('[data-mode="diagnostico"]');for(let i=0;i<3;i++){await page.getByRole('button',{name:d.faults[i][0],exact:true}).click();assert.equal(await page.evaluate(()=>__labDebug.state().diagnostico),true);if(i<2)await page.click('#newCase');}
    await page.click('#btnModel');await page.click('#closeModel');await page.click('#fichaFab');await page.click('#fichaClose');await page.click('[data-mode="explorar"]');await page.click('#btnQuality');await page.screenshot({path:fileURLToPath(new URL(`${d.id}-${size[0]}-calidad.png`,out)),timeout:60000});
   }
   assert.deepEqual(errors,[]);const r={id:d.id,size,initial,errors};reports.push(r);console.log(JSON.stringify(r));await writeFile(new URL(process.env.QA_MOBILE_ONLY?'informe-movil.json':'informe.json',out),JSON.stringify(reports,null,2));
  }catch(e){console.log('FALLO',d.id,size[0],e.message,'CONSOLE',errors);throw e;}finally{await context.close();}
 }
}finally{await browser?.close();await new Promise(ok=>server.close(ok));}
