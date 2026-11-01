/** Prueba real de las diez altas. Secretos/cabeceras sólo en memoria. */
import {createRequire} from 'node:module';
import {readFile,writeFile,mkdir} from 'node:fs/promises';
import assert from 'node:assert/strict';
import {definitions} from '../../public/labs/_solidos-definiciones.js';
import {solutions} from '../../public/labs/_solidos-modelos.js';
import {aplica,SESION_VACIA,resumeDe} from '../../src/lib/puente.ts';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const [doc,who,base='https://www.cenlaboratorios.com.mx']=process.argv.slice(2),out='scripts/auditoria/.salida/solidos-produccion';await mkdir(out,{recursive:true});
assert(doc&&who,'Se requiere documento privado y cuenta de prueba');
const row=(await readFile(doc,'utf8')).split('\n').find(l=>l.startsWith('|')&&l.includes(who));assert(row,'Cuenta piloto no encontrada');
const cells=row.split('|').map(x=>x.trim().replace(/`/g,'')).filter(Boolean),email=cells.find(x=>x.includes('@')),password=cells[cells.indexOf(email)+1];assert(email&&password&&password!==email);
const redact=s=>String(s).split(email).join('[correo omitido]').split(password).join('[clave omitida]').replace(/eyJ[A-Za-z0-9_.-]+/g,'[token omitido]').replace(/[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f-]{22,}/gi,'[identificador omitido]');
const errors=[],reports=[],saved=new Map();let browser;
try{
 browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader','--ignore-gpu-blocklist','--disable-gpu-watchdog']});
 const context=await browser.newContext({viewport:{width:1366,height:768}});await context.addInitScript(()=>{speechSynthesis.cancel();speechSynthesis.speak=()=>{};window.__qaMessages=[];addEventListener('message',e=>{if(e.origin===location.origin&&e.data?.fuente==='cen-lab')window.__qaMessages.push(e.data);});});const page=await context.newPage();
 page.on('pageerror',e=>errors.push(redact(e.message)));page.on('console',m=>{if(m.type()==='error')errors.push(redact(m.text()));});
 page.on('response',async r=>{try{const req=r.request();if(!r.url().includes('/rest/v1/intentos')||req.method()!=='POST')return;let body=req.postDataJSON();if(Array.isArray(body))body=body[0];if(body?.status!=='completed')return;saved.set(body.sim_id,{status:r.status(),body,url:r.url().split('?')[0],headers:await req.allHeaders()});}catch{}});
 await page.goto(base+'/login',{waitUntil:'networkidle',timeout:120000});await page.locator('input[type="email"],input[placeholder*="@"]').first().fill(email);await page.locator('input[type="password"]').fill(password);await page.getByText(/He le.do y acepto/i).click({position:{x:20,y:8}});await page.getByRole('button',{name:/iniciar sesi/i}).click();await page.waitForURL(u=>!u.pathname.startsWith('/login'),{timeout:90000});console.log('Login real correcto; datos omitidos.');
 await page.goto(base+'/alumno/laboratorio/mecanica',{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('button',{name:/Mecánica de Sólidos/}).click();await page.locator('#mecanica-251').waitFor();assert.equal(await page.locator('[id^="mecanica-25"],#mecanica-260').count(),10);await page.screenshot({path:out+'/hub-solidos.png'});
 for(const d of definitions){const id='mecanica-'+d.id;
  await page.goto(base+'/alumno/simulador/'+id,{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('button',{name:/Iniciar Práctica/i}).waitFor({timeout:90000});
  const cover=await page.request.get(base+'/images/mecanica/prac_'+d.id+'.webp');assert.equal(cover.status(),200);assert((await cover.body()).length>2000);
  await page.getByRole('button',{name:/Iniciar Práctica/i}).click();const iframe=page.locator('iframe[src*="'+d.slug+'.html"]');await iframe.waitFor({timeout:60000});const frame=await iframe.elementHandle().then(el=>el.contentFrame());assert(frame);await frame.waitForFunction(id=>window.__labDebug?.id===id,d.id,{timeout:90000});await frame.click('#tourSkip');
  const health=await frame.evaluate(()=>__diag3d.salud());assert.equal(health.normalesCero,0);assert.equal(health.posicionesNaN,0);assert(health.llamadas>0&&health.llamadas<150);assert(health.tri<400000);
  for(const [key,value]of Object.entries(solutions[d.id])){await frame.locator('#'+key).fill(String(value));await frame.locator('#'+key).dispatchEvent('input');}
  await frame.click('#openJob');await frame.click('#prepareJob');await frame.click('#action');await frame.waitForFunction(()=>__labDebug.ensayo().completed,null,{timeout:120000});await frame.click('[data-mode="reto"]');await frame.waitForTimeout(1250);await frame.click('#validate');assert(await frame.evaluate(()=>__labDebug.solved));
  await frame.click('#openQuiz');await frame.getByRole('button',{name:d.answers[0],exact:true}).click();await frame.waitForTimeout(1250);await frame.click('[data-mode="diagnostico"]');await frame.getByRole('button',{name:d.faults[0][0],exact:true}).click();await frame.waitForTimeout(1250);
  await page.waitForFunction(slug=>__qaMessages.some(m=>m.slug===slug&&m.segundos>=22),d.slug,{timeout:120000});
  let session=(await page.evaluate(()=>__qaMessages)).filter(m=>m.slug===d.slug).reduce((s,m)=>aplica(s,m),{...SESION_VACIA,modos:[]});assert(session.resuelto&&session.quizAcierto&&session.modos.length>=4);
  let expected=resumeDe(session).score;
  for(let i=0;i<80&&saved.get(id)?.body.score!==expected;i++){await page.waitForTimeout(250);session=(await page.evaluate(()=>__qaMessages)).filter(m=>m.slug===d.slug).reduce((s,m)=>aplica(s,m),{...SESION_VACIA,modos:[]});expected=resumeDe(session).score;}
  const save=saved.get(id);assert(save,'Sin guardado del intento');assert.equal(save.body.score,expected);assert([200,201,204].includes(save.status));
  const url=new URL(save.url);for(const [key,value]of Object.entries({select:'sim_id,status,score',sim_id:'eq.'+id,status:'eq.completed',id_alumno:'eq.'+save.body.id_alumno}))url.searchParams.set(key,value);
  const headers={};for(const key of ['apikey','authorization'])if(save.headers[key])headers[key]=save.headers[key];const readback=await context.request.get(url.href,{headers});assert.equal(readback.status(),200);assert((await readback.json()).some(r=>r.sim_id===id&&r.status==='completed'&&r.score===expected));
  await page.screenshot({path:out+'/'+id+'.png'});const report={id,slug:d.slug,health,coverHTTP:200,iframe:true,solved:true,quiz:true,persisted:{status:'completed',score:expected,maxScore:100,writeStatus:save.status,readStatus:200},errors:[]};reports.push(report);console.log(JSON.stringify(report));await writeFile(out+'/informe.json',JSON.stringify({date:new Date().toISOString(),base,labs:reports,errors,complete:false},null,2));
 }
 assert.equal(reports.length,10);assert.deepEqual(errors,[]);await writeFile(out+'/informe.json',JSON.stringify({date:new Date().toISOString(),base,labs:reports,errors,complete:true},null,2));
}catch(e){console.error(redact(e.message));process.exitCode=1;}finally{await browser?.close();}
