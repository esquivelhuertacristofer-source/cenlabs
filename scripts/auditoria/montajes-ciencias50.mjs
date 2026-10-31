import {createRequire} from 'node:module';
import {readdir,mkdir,writeFile,readFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const out='scripts/auditoria/.salida/montajes50';await mkdir(out,{recursive:true});
const args=process.argv.slice(2),ids=args.filter(x=>!x.startsWith('--')),all=(await readdir('src/components/ciencias/definiciones')).filter(f=>f.endsWith('.ts')).map(f=>f.slice(0,-3));
const sizes=(process.env.QA_MONTAJES_SIZES||'1600,900,1;390,844,1').split(';').map(x=>x.split(',').map(Number));
const revision=id=>['biologia-11','biologia-12','biologia-15','biologia-16','matematicas-19','quimica-12'].includes(id)?2:1;
const reports=[],browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
try{for(const [width,height,dpr]of sizes)for(const id of ids.length?ids:all){
 const file=`${out}/${id}-${width}.json`;if(args.includes('--pendientes')){try{const old=JSON.parse(await readFile(file,'utf8'));if(old.version===revision(id)&&old.ok){reports.push(old);continue;}}catch{}}
 const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr,reducedMotion:'reduce'});let page;const errors=[];
 try{
  await context.addInitScript(()=>{Object.defineProperty(speechSynthesis,'speak',{value:()=>{},configurable:true});});page=await context.newPage();page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error')errors.push(m.text());});
  await page.goto('http://localhost:3011/dev/lab/'+id,{waitUntil:'domcontentloaded',timeout:120000});await page.getByRole('button',{name:/Iniciar Práctica/i}).click({timeout:90000});await page.waitForFunction(()=>!!window.__cienciaDebug,null,{timeout:90000});await page.waitForTimeout(350);
  const initial=await page.evaluate(health);assert.equal(initial.assemblies,2);assert.equal(initial.zero,0);assert.equal(initial.nan,0);assert(initial.calls<150,`draw calls ${initial.calls}`);assert(initial.triangles<400000,`triángulos ${initial.triangles}`);assert(!initial.overflow);
  await page.screenshot({path:`${out}/${id}-${width}-equipo.png`});
  await page.getByRole('button',{name:'Explorar en 3D',exact:true}).click();const panel=page.getByRole('region',{name:'Exploración de componentes'});await panel.waitFor();
  assert.equal(await page.locator('[data-acquire]').isVisible(),false,'El inspector reemplaza los ajustes del ensayo');
  const before=await page.evaluate(snapshot);await panel.getByRole('slider',{name:'Desmontaje del equipo',exact:true}).fill('1');await page.waitForTimeout(200);const opened=await page.evaluate(snapshot);
  assert.equal(opened.parameters,before.parameters);assert.equal(opened.clock,before.clock);assert.notDeepEqual(opened.positions,before.positions);assert.deepEqual(opened.sample,before.sample);
  await page.screenshot({path:`${out}/${id}-${width}-desmontado.png`});
  const passive=await page.evaluate(()=>{let name='';__cienciaDebug.scene.traverse(o=>{if(o.userData.inspeccion?.descripcion.includes('Desmontaje didáctico'))name=o.userData.inspeccion.nombre;});return name;});
  await panel.getByRole('button',{name:passive,exact:true}).click();assert.equal(await panel.getByRole('slider',{name:/^Explorar:/}).count(),0);await panel.getByRole('button',{name:'Aislar componente',exact:true}).click();await panel.getByRole('button',{name:'Corte visual',exact:true}).click();await page.waitForTimeout(100);assert.deepEqual(errors,[]);
  await panel.getByRole('button',{name:'Cerrar exploración',exact:true}).click();await page.waitForTimeout(150);const restored=await page.evaluate(snapshot);assert.deepEqual(restored.positions,before.positions);assert.equal(restored.parameters,before.parameters);assert.equal(restored.clock,before.clock);assert(await page.locator('[data-acquire]').isVisible());
  const final=await page.evaluate(health);assert(!final.overflow);assert.deepEqual(errors,[]);const report={version:revision(id),id,width,height,dpr,date:new Date().toISOString(),ok:true,initial,final,errors};await writeFile(file,JSON.stringify(report,null,2));reports.push(report);console.log(JSON.stringify({id,width,calls:initial.calls,tri:initial.triangles,ok:true}));
 }catch(e){await page?.screenshot({path:`${out}/${id}-${width}-fallo.png`}).catch(()=>{});const report={version:revision(id),id,width,ok:false,error:e.stack,errors};await writeFile(file,JSON.stringify(report,null,2));reports.push(report);console.error(JSON.stringify(report));process.exitCode=1;}finally{await context.close();}
}}finally{await browser.close();await writeFile(`${out}/ultimo-barrido.json`,JSON.stringify(reports,null,2));}
function snapshot(){const d=__cienciaDebug,positions=[];d.scene.traverse(o=>{if(o.userData.inspeccion?.descripcion.includes('Desmontaje didáctico'))positions.push(o.position.toArray());});return {parameters:JSON.stringify(d.state().p),clock:d.clock.t,sample:d.model(),positions};}
function health(){const d=__cienciaDebug;let zero=0,nan=0;d.scene.traverse(o=>{if(!o.isMesh)return;const n=o.geometry.attributes.normal;for(let i=0;i<n?.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-8)zero++;for(const a of [o.geometry.attributes.position?.array,o.instanceMatrix?.array])for(const v of a||[])if(!Number.isFinite(v))nan++;});return {zero,nan,calls:d.renderer.info.render.calls,triangles:d.renderer.info.render.triangles,assemblies:d.scene.userData.assemblyCount,overflow:document.documentElement.scrollWidth>innerWidth};}
