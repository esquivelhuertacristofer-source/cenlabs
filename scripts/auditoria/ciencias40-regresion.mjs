/** Regresión de las 40 prácticas anteriores al ampliar el registro y shell. */
import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright'),out='scripts/auditoria/.salida/ciencias40-regresion';await mkdir(out,{recursive:true});
const subset=process.argv.slice(2),ids=subset.length?subset:['quimica','fisica','matematicas','biologia'].flatMap(a=>Array.from({length:10},(_,i)=>`${a}-${i+1}`)),references=new Set(['quimica-1','fisica-9','matematicas-7','matematicas-10','biologia-3','biologia-8']),reports=[];let browser;
try{browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 for(const id of ids){let context;const errors=[];try{
  context=await browser.newContext({viewport:{width:1600,height:900}});await context.addInitScript(()=>{speechSynthesis.cancel();Object.defineProperty(speechSynthesis,'speak',{value:()=>{},configurable:true});});
  const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  const response=await page.goto('http://localhost:3011/dev/lab/'+id,{waitUntil:'domcontentloaded',timeout:180000});assert.equal(response.status(),200);
  await page.getByRole('button',{name:/Iniciar Práctica/i}).click({timeout:90000});await page.waitForFunction(()=>[...document.querySelectorAll('canvas')].some(c=>{const r=c.getBoundingClientRect();return r.width>100&&r.height>100;}),null,{timeout:90000});
  await page.waitForTimeout(references.has(id)?10000:2500);
  const state=await page.evaluate(()=>({canvas:[...document.querySelectorAll('canvas')].map(c=>({width:c.width,height:c.height,clientWidth:c.clientWidth,clientHeight:c.clientHeight})),overflow:document.documentElement.scrollWidth>innerWidth,unexpectedNewScience:!!window.__cienciaDebug}));
  assert.equal(state.overflow,false,'Desborde '+id);assert.equal(state.unexpectedNewScience,false,'Interceptación de una práctica anterior');assert.deepEqual(errors,[]);
  await page.screenshot({path:`${out}/${id}.png`});
  // En escritorio la bitácora ya está visible: el botón de apertura es sólo móvil.
  let notebook=false;if(references.has(id)){const title=page.getByText('Bitácora de Observaciones',{exact:true});await title.waitFor();const body=title.locator('..').locator('..').locator(':scope > div').last();assert((await body.innerText()).trim().length>100,'La bitácora debe contener el instrumento original');await page.screenshot({path:`${out}/${id}-bitacora.png`});notebook=true;}
  const r={id,state,reference:references.has(id),notebook,errors,date:new Date().toISOString()};reports.push(r);console.log(JSON.stringify(r));
 }catch(e){reports.push({id,error:e.message,errors});console.error('FALLO '+id+' '+e.message);process.exitCode=1;}finally{await context?.close();}}
}finally{await browser?.close();await writeFile(`${out}/${subset.length?'referencias':'informe'}.json`,JSON.stringify(reports,null,2));}
