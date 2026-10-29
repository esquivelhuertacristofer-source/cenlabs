import {readdir,mkdir,writeFile} from 'node:fs/promises';
import assert from 'node:assert/strict';
const root=new URL('../../',import.meta.url),directory=new URL('src/components/ciencias/definiciones/',root),files=(await readdir(directory)).filter(f=>f.endsWith('.ts')),definitions=new Map();
for(const file of files){const {default:d}=await import(new URL(file,directory));definitions.set(d.id,d);}
assert.equal(definitions.size,50);let checks=0;const perLab={};
function near(actual,expected,rtol=1e-9,atol=1e-10){assert(Number.isFinite(actual));assert(Math.abs(actual-expected)<=atol+rtol*Math.abs(expected),`${actual} ≠ ${expected}`);checks++;}
function test(id,p,expected,t=6,tol=1e-9){near(definitions.get(id).model(p,t).answer,expected,tol);}
// Closed-form reference cases and limiting cases, before randomized domain sweeps.
test('fisica-11',{tension:12,ratio:4},100/9);
test('fisica-12',{wavelength:600,slits:.3},3);
test('fisica-13',{force:.8,thickness:4},10);
test('fisica-14',{cladding:1.44,angle:18},Math.asin(Math.sqrt(.1168))*180/Math.PI);
test('fisica-15',{absorption:.2},19.32/37.6);
test('fisica-16',{thickness:40,conductivity:.12},90);
test('fisica-17',{irradiance:0,emissivity:.8},20);
test('fisica-18',{velocity:.02,diameter:4},80);
test('fisica-19',{velocity:1,closing:.05},1.1976);
test('fisica-20',{radius:.4,angle:60},.0728/(998*9.80665*.0004)*1000);
test('fisica-21',{voltage:1000,field:.2},40);
test('fisica-22',{current:5,field:.5},8.5);
test('fisica-23',{wavelength:500,voltage:.2},.3296839686640052,6,1e-8);
test('fisica-24',{rpm:1800,arm:5},.196133/(.002*60*Math.PI));
test('quimica-11',{dilution:2,path:1},37.5);
test('quimica-12',{flow:1,selectivity:1},0);
near(definitions.get('quimica-13').model({stiffness:1200,isotope:16},6).values.mu/1.66053906892e-27,48/7);
test('quimica-14',{potential:.3,hours:0},0);
test('quimica-15',{current:1,minutes:0,efficiency:90},0);
test('quimica-16',{current:5,voltage:2},4*96485.33212/(.00201588*3600000));
test('quimica-17',{flow:.4,feed:1},50);
test('quimica-18',{concentration:1,volume:100,loss:0},-52);
test('quimica-19',{wavelength:1.54,size:50},3.6);
test('quimica-20',{temperature:60,minutes:0},0);
test('quimica-21',{pH:6,volume:1},97.8);
near(definitions.get('quimica-22').model({dose:35,mixing:20},6).values.radius,75);
test('quimica-23',{length:20,feed:100},2400);
test('quimica-24',{temperature:840,composition:60},50);
test('matematicas-11',{x:2,y:1},2);
test('matematicas-12',{h1:0,h2:0},2);
test('matematicas-13',{resource:60,profit:30},1200);
test('matematicas-14',{curvature:0,outlier:0},1.7);
test('matematicas-15',{offset:0,sigma:.05,drift:0},4/3);
test('matematicas-16',{sample:10,defects:0},100);
test('matematicas-17',{shape:2,hours:1200},100/Math.E);
const monte=definitions.get('matematicas-18').model({gap:.1,sigma:.08},6);assert(monte.answer>20&&monte.answer<28);checks++;
test('matematicas-19',{start:0,z:0},0);
test('matematicas-20',{holeX:1.5,radius:.4},1.5);
test('matematicas-21',{step:1},100*Math.abs(.2**6-Math.exp(-4.8)));
test('matematicas-22',{prevalence:10,falsePositive:5},100*.095/.14);
test('biologia-11',{substrate:2.4,inhibitor:0},40);
test('biologia-12',{gradient:200,energy:50},150e6/(8*96485.33212));
test('biologia-13',{cycles:25,efficiency:100},17);
test('biologia-14',{voltage:100,minutes:20},850);
test('biologia-15',{substrate:0,oxygen:100},.5);
test('biologia-16',{compliance:50,resistance:10},.5);
const hem=definitions.get('biologia-17').model({rate:70,pressure:125,resistance:.2},1);near(hem.answer*.2,hem.values.peakGradient);
test('biologia-18',{length:2.2,activation:100},120);
test('biologia-19',{concentration:8,slope:2},50);
test('biologia-20',{transfer:10,cleaning:3},10);
let seed=4931;function random(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
for(const [id,d]of definitions){const before=checks;for(let i=0;i<100;i++){const p=Object.fromEntries(d.controls.map(c=>[c.key,i===0?c.initial:i===1?c.min:i===2?c.max:c.min+Math.floor(random()*((c.max-c.min)/c.step+1))*c.step])),copy=JSON.stringify(p);for(const t of [0,.05,1.23,3,6]){const result=d.model(p,t);assert(Number.isFinite(result.answer),id+' respuesta no finita');checks++;for(const [key,value]of Object.entries(result.values)){assert(Number.isFinite(value),id+' '+key+' no finito');checks++;}for(const reading of d.readings){assert(Number.isFinite(result.values[reading.key]),id+' falta lectura '+reading.key);checks++;}assert.equal(JSON.stringify(p),copy);checks++;}}
 const p=Object.fromEntries(d.controls.map(c=>[c.key,c.initial])),v=d.model(p,6).values;
 if(id==='fisica-11'){near(v.energyR+v.energyT,1);near(v.transmission,1+v.r);}
 if(id==='fisica-16')near((v.hot-v.interfaceT)/(v.L1/v.k1),(v.interfaceT-v.cold)/(v.L2/v.k2));
 if(id==='fisica-17')near(v.Qin,p.emissivity*5.670374419e-8*(v.Teq**4-v.ambient**4));
 if(id==='fisica-21')near(v.radius*p.field,Math.sqrt(2*40*1.66053906892e-27*p.voltage/1.602176634e-19));
 if(id==='quimica-15')near(v.mass,8.96*100*v.thickness/10000);
 if(id==='quimica-16'){near(v.moles,2*v.oxygen);near(v.energy,p.voltage*p.current*v.seconds);}
 if(id==='quimica-17')near(p.flow*(p.feed-v.steady),v.V*v.k*v.steady);
 if(id==='quimica-18')near(v.mass*4.184*v.deltaT,52000*v.n*(1-v.loss));
 if(id==='quimica-24')near(v.fraction*v.solid+(1-v.fraction)*v.liquid,p.composition);
 if(id==='matematicas-13'){assert(2*v.x+v.y<=p.resource+1e-8);assert(v.x+2*v.y<=p.resource+1e-8);checks+=2;}
 if(id==='matematicas-22')near(v.TP/(v.TP+v.FP),v.posterior);
 if(id==='biologia-13'){const target=d.model(p,6).answer;assert(100*(1+p.efficiency/100)**target>=1e7);assert(100*(1+p.efficiency/100)**(target-1)<1e7);checks+=2;}
 if(id==='biologia-16'){near(d.model(p,2-1e-9).values.volume,d.model(p,2+1e-9).values.volume,1e-5);near(d.model(p,4-1e-9).values.volume,d.model(p,1e-9).values.volume,1e-5);}
 perLab[id]=checks-before;console.log(id+': '+perLab[id]+' comprobaciones');}
const {TunelLBM}=await import(new URL('src/domain/ciencias/lbm.ts',root));
for(const Re of [10,40,80,120]){const sim=new TunelLBM(Re);near(sim.weights.reduce((a,b)=>a+b),1);for(const u of [0,.02,.045]){let rho=0,ux=0,uy=0;for(let q=0;q<9;q++){const f=sim.equilibrium(q,1,u,0);rho+=f;ux+=f*sim.cx[q];uy+=f*sim.cy[q];}near(rho,1);near(ux,u);near(uy,0);}sim.step(3000);for(let k=0;k<sim.N;k++){if(sim.solid[k])continue;assert(sim.rho[k]>.90&&sim.rho[k]<1.10);assert(Number.isFinite(sim.ux[k])&&Number.isFinite(sim.uy[k]));checks+=2;}console.log('D2Q9 Re='+Re+': estable 3000 pasos');}
const out=new URL('scripts/auditoria/.salida/ciencias50/',root);await mkdir(out,{recursive:true});await writeFile(new URL('numerica50.json',out),JSON.stringify({checks,perLab,count:definitions.size},null,2));console.log('TOTAL '+checks+' comprobaciones correctas ·50 modelos');
