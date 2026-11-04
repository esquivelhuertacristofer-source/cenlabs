import assert from 'node:assert/strict';
import {bandBrake} from '../../public/labs/_elementos-freno.js';
import {criteria,solutions} from '../../public/labs/_elementos-modelos.js';
let checks=0;const near=(x,y,tol=1e-9)=>{assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} != ${y}`);checks++;};
const cross=(a,b)=>a[0]*b[1]-a[1]*b[0],sub=(a,b)=>a.map((x,i)=>x-b[i]);
const ref=bandBrake(solutions[268]);near(ref.T1,2514.4822406048725);near(ref.T2,811.4711521310558);near(ref.torque,340.60221769476334);near(ref.stopTime,2.113902853813009);near(ref.reverseTorque,38.83724973788907);near(ref.totalEnergy,21600);
let minMargin=Infinity;
for(let friction=.1;friction<.301;friction+=.005)for(let arm=6;arm<=16;arm+=.5){
 const p={friction,arm},q=bandBrake(p);minMargin=Math.min(minMargin,q.margin);assert(q.T1>q.T2&&q.T2>0);checks++;
 near(cross(sub(q.A1,q.pivot),q.t1),q.b);near(cross(sub(q.A2,q.pivot),q.t2),-q.a);near(cross(sub(q.effort,q.pivot),[0,1]),q.l);
 near(q.F*q.l+q.T1*q.b-q.T2*q.a,0,1e-10);near(Math.log(q.T1/q.T2),q.mu*q.theta);near(q.torque,(q.T1-q.T2)*q.R);
 // Tangency to the drum and nominal endpoint moment, independently of pivot.
 near(cross(q.A1,q.t1),q.R);near(cross(q.A2,q.t2),-q.R);
 // Integrate friction stress over the finite wrap instead of tension difference.
 let torque=0;const N=512,h=q.theta/N,w=.08;
 for(let i=0;i<=N;i++){const angle=i*h,pressure=q.T2*Math.exp(q.mu*angle)/(w*q.R),weight=(i===0||i===N?1:i%2?4:2)*h/3;torque+=q.mu*pressure*w*q.R*q.R*weight;}
 near(torque,q.torque,1e-9);
 for(const fraction of [0,.1,.5,.9,1,1.1]){const t=q.stopTime*fraction,m=bandBrake(p,t<10?t:9.9),expectedOmega=Math.max(0,m.omega0-m.torque*m.phase/m.J);near(m.omega,expectedOmega);near(m.heat+.5*m.J*m.omega*m.omega,21600);assert(m.omega>=0&&m.heat>=0&&m.heat<=21600);checks++;near(m.power,m.torque*m.omega);}
 // Use a single stop for energy/angle, independent of the ten-second reset.
 const stop=bandBrake(p,Math.min(q.stopTime,9.9));if(q.stopTime<9.9){near(stop.omega,0);near(stop.angle,q.omega0*q.stopTime/(2*40));near(stop.heat,21600);near(bandBrake(p,Math.min(9.99,q.stopTime+.01)).angle,stop.angle);}
}
assert(minMargin>0);assert.throws(()=>bandBrake({friction:.5,arm:16}));assert(criteria(268,solutions[268]).ok);assert(!criteria(268,{friction:.18,arm:10}).ok);checks+=4;
console.log(`Elementos268: ${checks} comprobaciones correctas; margen mínimo ${(minMargin*1000).toFixed(5)} mm.`);
