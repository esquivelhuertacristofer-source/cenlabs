import assert from 'node:assert/strict';
import {model,criteria,defaults,deltaAt,stewartAt,fourbarAt,TAU} from '../../public/labs/_mecanismos-modelos.js';
export const solutions={167:{rpm:80,torque:3.5},168:{lead:8,rpm:1000},169:{radius:280,height:650},170:{roll:10,height:900},171:{speed:600,delay:2000},172:{mass:33,angle:210},173:{stiffness:600,damping:1},174:{crank:75,rod:180},175:{rpm:10000,radius:200},176:{field:450,thickness:5}};
const only=process.argv.includes('--solo')?+process.argv[process.argv.indexOf('--solo')+1]:0;
let count=0;
const near=(a,b,rel=1e-7)=>{assert(Number.isFinite(a)&&Number.isFinite(b),`${a},${b}`);assert(Math.abs(a-b)<=rel*Math.max(1,Math.abs(a),Math.abs(b)),`${a} != ${b}`);count++;};
const norm=a=>Math.hypot(...a),sub=(a,b)=>a.map((x,i)=>x-b[i]);
for(let id=167;id<=176;id++){
 if(only&&id!==only)continue;const before=count,p=solutions[id];assert(!criteria(id,defaults[id]).ok,`Inicio regalado: ${id}`);assert(criteria(id,p).ok,`Reto imposible: ${id}`);count+=2;
 for(let i=0;i<121;i++){
  const t=.037+i*.061,m=model(id,t,p),eps=1e-5,plus=model(id,t+eps,p),minus=model(id,t-eps,p);
  if(id===167){near(m.ratio,-80);near((plus.phase-minus.phase)/(2*eps),p.rpm*TAU/60);near((plus.output-minus.output)/(2*eps),p.rpm*TAU/60/-80);near(m.power,m.torqueOut*Math.abs(m.rpmOut)*TAU/60+m.heat);}
  if(id===168){near((plus.x-minus.x)/(2*eps),m.v);near((plus.v-minus.v)/(2*eps),m.acc);near(m.torque*Math.abs(m.v)*TAU/(p.lead/1000)*.9,3500*Math.abs(m.v));assert(m.buckling>3500);count++;}
  if(id===169){const d=deltaAt(t,p);assert(d.valid);count++;for(const a of d.arms){near(norm(sub(a.base,a.elbow)),.4);near(norm(sub(a.elbow,a.tip)),.85);near(norm(sub(a.tip,d.center)),.12);}near(norm(d.center.filter((_,j)=>j!==1)),.28);}
  if(id===170){const d=stewartAt(t,p);assert(d.valid);const wrench=Array(6).fill(0);d.legs.forEach((l,k)=>{near(norm(sub(l.tip,l.base)),l.length);for(let j=0;j<6;j++)wrench[j]+=l.row[j]*d.forces[k];});wrench.forEach((x,j)=>near(x,j===1?2943:0,1e-8));}
  if(id===171){near(m.error,0);near(m.rate,90);near(model(id,t,{...p,delay:1900}).error,-.06);near(model(id,t,{...p,delay:2100}).error,.06);}
  if(id===172){near(m.static,0);near(m.force*.7,m.couple);near(model(id,t,{mass:1000*.006/.18,angle:210}).force,0);near(model(id,t,{mass:0,angle:0}).force,.006*(900*TAU/60)**2*.24/.7);}
  if(id===173){near(m.J*m.acc+p.damping*m.velocity+p.stiffness*m.delta,m.F*Math.sin(m.w*t));near((plus.delta-minus.delta)/(2*eps),m.velocity,1e-6);near(m.transmitted,p.stiffness*m.delta+p.damping*m.velocity);near(m.J,.072);}
  if(id===174){const d=fourbarAt(t,p);assert(d.valid);count++;near(norm(d.A),.075);near(norm(sub(d.B,d.A)),.180);near(norm(sub(d.B,[.2,0])),.12);}
  if(id===175){near(.5*m.J*m.omega*m.omega,m.E);near(m.E+m.delivered,m.E0);near((plus.phase-minus.phase)/(2*eps),m.omega,1e-6);near(model(id,t,{...p,rpm:20000}).stress,4*m.stress);}
  if(id===176){near(-m.J*(plus.omega-minus.omega)/(2*eps),m.torque);near(.5*m.J*m.omega*m.omega+m.energy,.5*m.J*120**2);near((plus.energy-minus.energy)/(2*eps),m.torque*m.omega,1e-6);near(model(id,t,{...p,field:900}).c,4*m.c);}
 }
 console.log(`${id}: ${count-before} comprobaciones · inicio rechazado y solución interior aceptada`);
}
console.log(`TOTAL: ${count} comprobaciones correctas`);
