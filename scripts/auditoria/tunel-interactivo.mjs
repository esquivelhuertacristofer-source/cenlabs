import {createRequire} from 'node:module';
import {mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const {chromium}=createRequire('C:/Users/crist/AppData/Roaming/npm/node_modules/')('playwright');
const out='scripts/auditoria/.salida/tunel-interactivo';await mkdir(out,{recursive:true});
const browser=await chromium.launch({headless:true,args:['--mute-audio','--use-angle=swiftshader','--enable-unsafe-swiftshader']});
const reports=[];
try{for(const [width,height,dpr] of (process.env.QA_TUNEL_SIZES?JSON.parse(process.env.QA_TUNEL_SIZES):[[1366,768,1],[1600,900,1],[390,844,1],[2020,1055,1.25]])){
const context=await browser.newContext({viewport:{width,height},deviceScaleFactor:dpr});
await context.addInitScript(()=>{Object.defineProperty(speechSynthesis,'speak',{value:()=>{},configurable:true});});
try{const page=await context.newPage(),errors=[];page.on('pageerror',e=>errors.push(e.message));
await page.goto('http://localhost:3011/dev/lab/fisica-18',{waitUntil:'domcontentloaded',timeout:120000});
await page.getByRole('button',{name:/Iniciar Práctica/i}).click({timeout:90000});
await page.waitForFunction(()=>!!window.__cienciaDebug,null,{timeout:90000});
await page.waitForTimeout(1500);
await page.screenshot({path:`${out}/${width}-perspectiva.png`});
await page.getByRole('button',{name:'Pausar',exact:true}).click();
for(const name of ['Velocidad','Vectores','Vórtices']){await page.getByRole('button',{name,exact:true}).click();await page.waitForTimeout(150);assert.equal(await page.getByRole('button',{name,exact:true}).getAttribute('aria-pressed'),'true');}
await page.getByRole('button',{name:'Vectores',exact:true}).click();
await page.getByRole('button',{name:'Vista cenital',exact:true}).click();await page.waitForTimeout(1400);
await page.getByRole('button',{name:'Sonda',exact:true}).click();await page.waitForFunction(()=>__cienciaDebug.scene.userData.probeEnabled);
const point=await page.evaluate(()=>{const d=window.__cienciaDebug,c=document.querySelector('.ciencia-escena canvas').getBoundingClientRect(),v=d.camera.position.clone().set(.4,.29,.2).project(d.camera);return {x:c.x+(v.x+1)*c.width/2,y:c.y+(1-v.y)*c.height/2};});
await page.screenshot({path:`${out}/${width}-beforeclick.png`});await page.mouse.click(point.x,point.y);await page.waitForTimeout(300);
await page.getByRole('button',{name:'Soltar sonda',exact:true}).waitFor({timeout:5000});
assert.match(await page.locator('.ciencia-sonda').textContent(),/Sonda fija/);
const paused=await page.evaluate(()=>__cienciaDebug.clock.t);await page.waitForTimeout(250);assert.equal(await page.evaluate(()=>__cienciaDebug.clock.t),paused);
await page.screenshot({path:`${out}/${width}-sonda-vectores.png`});
const health=await page.evaluate(()=>{const d=__cienciaDebug;let zero=0,nan=0;d.scene.traverse(o=>{if(!o.isMesh)return;const n=o.geometry.attributes.normal;for(let i=0;i<n?.count;i++)if(Math.hypot(n.getX(i),n.getY(i),n.getZ(i))<1e-8)zero++;for(const a of [o.geometry.attributes.position?.array,o.instanceMatrix?.array])for(const v of a||[])if(!Number.isFinite(v))nan++;});return {zero,nan,calls:d.renderer.info.render.calls,triangles:d.renderer.info.render.triangles,overflow:document.documentElement.scrollWidth>innerWidth,arrows:d.scene.getObjectByName('vecteurs-vitesse').count};});
assert.equal(health.zero,0);assert.equal(health.nan,0);assert.equal(health.overflow,false);assert(health.calls<150);assert(health.triangles<400000);assert(health.arrows>100);
await page.getByRole('button',{name:'Trazadores',exact:true}).click();await page.waitForFunction(()=>!__cienciaDebug.scene.getObjectByName('traceurs-advection').visible);
await page.getByRole('button',{name:'Soltar sonda',exact:true}).click();
const solid=await page.evaluate(()=>{const d=__cienciaDebug,c=document.querySelector('.ciencia-escena canvas').getBoundingClientRect(),v=d.camera.position.clone().set(-33/32,.29,0).project(d.camera);return {x:c.x+(v.x+1)*c.width/2,y:c.y+(1-v.y)*c.height/2};});
await page.mouse.click(solid.x,solid.y);await page.getByRole('button',{name:'Soltar sonda',exact:true}).waitFor({timeout:5000});
assert.match(await page.locator('.ciencia-sonda').innerText(),/u 0(?:\.0+)? m\/s · v 0(?:\.0+)? m\/s/,'La velocidad dentro del sólido debe ser nula');
await page.screenshot({path:`${out}/${width}-sonda-solido.png`});
await page.getByRole('button',{name:'Sonda',exact:true}).click();assert.equal(await page.locator('.ciencia-sonda').count(),0);
await page.getByRole('button',{name:'Inyectar tinta',exact:true}).click();await page.waitForFunction(()=>__cienciaDebug.scene.userData.dyeEnabled);await page.mouse.click(point.x,point.y);await page.waitForFunction(()=>!!__cienciaDebug.scene.userData.dyeSource);const injection=await page.evaluate(()=>({source:__cienciaDebug.scene.userData.dyeSource,camera:__cienciaDebug.camera.position.toArray()}));console.log(JSON.stringify({width,injection}));assert(Math.abs(injection.source.x-76.8)<2);await page.getByRole('button',{name:'Continuar',exact:true}).click();await page.waitForTimeout(1800);assert(await page.evaluate(()=>{const o=__cienciaDebug.scene.getObjectByName('tinta-pasiva');return o.visible&&Array.from({length:o.count},(_,i)=>o.instanceMatrix.array[i*16]).some(x=>x>0);}));await page.screenshot({path:`${out}/${width}-tinta.png`});await page.getByRole('button',{name:'Vista cenital',exact:true}).click();await page.waitForTimeout(1400);assert(await page.evaluate(()=>Math.abs(__cienciaDebug.camera.position.z)>1));
assert.deepEqual(errors,[]);reports.push({version:2,width,height,dpr,health,solidProbe:true,errors});console.log(JSON.stringify(reports.at(-1)));
}finally{await context.close();}
}}finally{await browser.close();await writeFile(`${out}/informe.json`,JSON.stringify(reports,null,2));}
