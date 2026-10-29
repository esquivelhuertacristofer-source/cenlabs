/** Pruebas de comportamiento que no se cubren repitiendo el recorrido común. */
import {createRequire} from 'node:module';
import {mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const out='scripts/auditoria/.salida/ciencias50-especiales';await mkdir(out,{recursive:true});
const reports=[];let browser;
async function followsPoint(page){
 await page.getByRole('button',{name:'Explorar en 3D',exact:true}).click();const panel=page.getByRole('region',{name:'Exploración de componentes'});await panel.getByRole('button',{name:'Punto de control P1',exact:true}).click();await page.locator('.ciencia-escena canvas').scrollIntoViewIfNeeded();await page.waitForTimeout(1400);
 const point=await page.evaluate(()=>{const d=__cienciaDebug,c=document.querySelector('.ciencia-escena canvas').getBoundingClientRect(),o=d.scene.parent.getObjectByName('mando-control-ciencia'),p=o.getWorldPosition(d.camera.position.clone()).project(d.camera);return {x:c.x+(p.x+1)*c.width/2,y:c.y+(1-p.y)*c.height/2,before:d.state().p.h1};});
 await page.mouse.move(point.x,point.y);await page.mouse.down();for(let i=1;i<=12;i++){await page.mouse.move(point.x+140*i/12,point.y);await page.waitForTimeout(50);}await page.mouse.up();await page.waitForTimeout(1600);
 const result=await page.evaluate(()=>{const d=__cienciaDebug;let part;d.scene.traverse(o=>{if(o.userData.inspeccion?.nombre==='Punto de control P1')part=o;});const p=part.getWorldPosition(d.camera.position.clone()).project(d.camera);return {ndc:p.toArray(),value:d.state().p.h1};});assert.notEqual(result.value,point.before);assert.equal(result.value,Number(await panel.getByRole('slider').getAttribute('max')),'Se debe probar un desplazamiento completo');assert(Math.abs(result.ndc[0])<.95&&Math.abs(result.ndc[1])<.95,'La pieza arrastrada debe volver al encuadre: '+result.ndc);await panel.getByRole('button',{name:'Cerrar exploración',exact:true}).click();return result;
}
async function specimen(id,check,{reduced=false,width=1600,height=900}={}){
 const context=await browser.newContext({viewport:{width,height},reducedMotion:reduced?'reduce':'no-preference'}),errors=[],remote=[];
 try{await context.addInitScript(()=>{speechSynthesis.cancel();Object.defineProperty(speechSynthesis,'speak',{value:()=>{},configurable:true});});
 await context.route(/https:\/\/(cdn\.jsdelivr\.net|raw\.githack\.com)\//,r=>{remote.push(r.request().url());return r.abort();});
 const page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));
 await page.goto('http://localhost:3011/dev/lab/'+id,{waitUntil:'domcontentloaded',timeout:120000});
 await page.getByRole('button',{name:/Iniciar Práctica/i}).click({timeout:90000});await page.waitForFunction(()=>!!window.__cienciaDebug,null,{timeout:90000});await page.waitForTimeout(800);
 const details=await check(page);assert.deepEqual(errors,[]);assert.deepEqual(remote,[]);
 await page.screenshot({path:`${out}/${id}${reduced?'-reducido':''}.png`});
 const report={id,reduced,details,errors,remote,date:new Date().toISOString()};reports.push(report);console.log(JSON.stringify(report));
 }finally{await context.close();}
}
try{browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
 await specimen('quimica-11',async page=>{
  await page.click('[data-acquire]');await page.waitForFunction(()=>__cienciaDebug.state().history.length===1,null,{timeout:90000});
  await page.getByRole('slider',{name:'Factor de dilución',exact:true}).fill('4');assert.equal(await page.evaluate(()=>__cienciaDebug.state().record),null);
  await page.click('[data-acquire]');await page.waitForFunction(()=>__cienciaDebug.state().history.length===2,null,{timeout:90000});
  const values=await page.evaluate(()=>__cienciaDebug.state().history.map(r=>({p:r.parameters,a:r.sample.values.absorbance,points:r.points.length,from:r.points[0].t,to:r.points.at(-1).t})));
  assert(Math.abs(values[0].a/values[1].a-2)<1e-8);assert(values.every(r=>r.points>=13&&r.from===0&&Math.abs(r.to-6)<1e-8));
  await page.getByText('Comparar ensayos · 2',{exact:true}).click();await page.getByLabel('Usar 1/X',{exact:true}).check();
  const plot=page.getByRole('img',{name:'Comparación de mediciones entre ensayos'});await plot.waitFor();assert.match(await plot.textContent(),/1 \/ Factor de dilución/);assert.equal(await plot.locator('circle').count(),2);
  const [download]=await Promise.all([page.waitForEvent('download'),page.getByRole('button',{name:'Descargar registro',exact:true}).click()]);
  const txt=await readFile(await download.path(),'utf8');assert(txt.includes('Comparación de ensayos'));assert(txt.includes('Serie temporal'));const rows=txt.split('Comparación de ensayos\n')[1].split('\n\nModelo:')[0].trim().split('\n');assert.equal(rows.length,3);await writeFile(`${out}/uvvis-dos-ensayos.txt`,txt);
  await page.getByRole('button',{name:'Reiniciar',exact:true}).click();const reset=await page.evaluate(()=>{const s=__cienciaDebug.state();return {history:s.history.length,record:s.record,answer:s.answer,accepted:s.accepted,running:s.running,p:s.p};});assert.deepEqual(reset,{history:0,record:null,answer:'',accepted:false,running:false,p:{dilution:2,path:1}});return {values,exportRows:rows.length,reset};
 });
 await specimen('quimica-14',async page=>{
  await page.getByRole('slider',{name:'Potencial del banco',exact:true}).fill('0.05');await page.getByRole('slider',{name:'Exposición',exact:true}).fill('1');
  await page.click('[data-acquire]');await page.waitForFunction(()=>!!__cienciaDebug.state().record,null,{timeout:90000});
  const fraction=1/(1+Math.exp(-(.05-.36)/.018)),current=(1-fraction)*.001*10**(.05/.12)+fraction*.02,expected=current*.001*3600*55.845/(2*96485.33212*7.87)*10;
  await page.locator('[data-answer]').fill(String(expected*1.15));await page.click('[data-validate-science]');await page.waitForTimeout(1000);assert.equal(await page.evaluate(()=>__cienciaDebug.state().accepted),false,'Un error del15 % no cabe en una tolerancia del3 %');
  await page.locator('[data-answer]').fill(String(expected));await page.click('[data-validate-science]');await page.waitForFunction(()=>__cienciaDebug.state().accepted,null,{timeout:10000});return {referenceMm:expected,reject15Percent:true,acceptFaradayReference:true};
 });
 await specimen('biologia-12',async page=>{
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  const samples=[];for(const t of [1,1.1]){samples.push(await page.evaluate(async t=>{const d=__cienciaDebug;d.clock.t=t;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const h=d.scene.getObjectByName('protones-c8'),a=d.scene.getObjectByName('productos-atp');return {angle:d.scene.getObjectByName('rotor-c8').rotation.y,h:.5-h.instanceMatrix.array[13],atp:(a.instanceMatrix.array[13]-1.6)/.8,model:d.model().values};},t));}
  const turns=(samples[1].angle-samples[0].angle)/(2*Math.PI),mod=x=>(x%1+1)%1,h=32*mod(samples[1].h-samples[0].h)/turns,atp=18*mod(samples[1].atp-samples[0].atp)/turns;
  assert(Math.abs(h-8)<.001,'8 protones por vuelta: '+h);assert(Math.abs(atp-3)<.001,'3 ATP por vuelta: '+atp);return {samples,hPerTurn:h,atpPerTurn:atp};
 });
 await specimen('matematicas-12',async page=>{
  await page.getByRole('button',{name:'Pausar',exact:true}).click();
  const data=await page.evaluate(async()=>{const d=__cienciaDebug;d.clock.t=2;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)));const curve=d.scene.getObjectByName('trayectoria-bezier').geometry.attributes.position,p=d.state().p;let maxError=0;for(let i=0;i<161;i++){const u=i/160,a=1-u,x=-a*a*a-1.5*a*a*u+1.5*a*u*u+u*u*u,y=3*a*a*u*p.h1+3*a*u*u*p.h2;maxError=Math.max(maxError,Math.abs(curve.getX(i)-1.2*x),Math.abs(curve.getZ(i)-1.2*y));}const tool=d.scene.getObjectByName('herramienta-cnc'),v=tool.getWorldPosition(d.camera.position.clone());d.scene.worldToLocal(v);const model=d.model().values;return {maxError,tool:[v.x,v.z],expected:[1.2*model.x,1.2*model.y],vertices:curve.count};});
  assert.equal(data.vertices,161);assert(data.maxError<1e-6);assert(data.tool.every((v,i)=>Math.abs(v-data.expected[i])<1e-8));return {...data,dragFraming:await followsPoint(page)};
 });
 for(const id of ['quimica-11','fisica-18','matematicas-12','biologia-12'])await specimen(id,async page=>{
  const t=await page.evaluate(()=>({t:__cienciaDebug.clock.t,paused:__cienciaDebug.clock.paused}));assert.equal(t.paused,true);await page.waitForTimeout(600);assert.equal(await page.evaluate(()=>__cienciaDebug.clock.t),t.t);
  await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForTimeout(500);assert(await page.evaluate(()=>__cienciaDebug.clock.t)>t.t);await page.getByRole('button',{name:'Reiniciar',exact:true}).click();assert.equal(await page.evaluate(()=>__cienciaDebug.clock.paused),true);return {pausedAtStart:true,explicitPlay:true,resetPaused:true,...(id==='matematicas-12'?{dragFraming:await followsPoint(page)}:{})};
 },{reduced:true,width:390,height:844});
}finally{await browser?.close();await writeFile(`${out}/informe.json`,JSON.stringify(reports,null,2));}
