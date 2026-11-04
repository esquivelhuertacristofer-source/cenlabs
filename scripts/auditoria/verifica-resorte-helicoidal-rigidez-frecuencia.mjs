import assert from 'node:assert/strict';
import {spring} from '../../public/labs/_elementos-resorte.js';
import {criteria,solutions} from '../../public/labs/_elementos-modelos.js';
let checks=0;const near=(x,y,tol=1e-9)=>{assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} != ${y}`);checks++;};
const ref=spring({wire:2.4,coil:32});near(ref.k,1241.89453125);near(ref.fn,3.231144698779377);near(ref.deflection,.02415664071715028);near(ref.stress,211955888.65021953);near(spring({wire:3,coil:24}).Wahl,1.1840178571428572);
let minClearance=Infinity,maxRayleighError=0;
for(let wire=2;wire<3.001;wire+=.1)for(let coil=24;coil<=34;coil++){
 const p={wire,coil},q=spring(p),J=Math.PI*q.d**4/32,torque=q.F*q.D/2;
 // Strain energy from torsion, integrated over active wire length.
 const U=torque**2/(2*q.G*J)*Math.PI*q.D*q.Na;near(2*U/q.F,q.deflection);
 near(spring({...p,wire:wire*2}).k/q.k,16);near(spring({...p,coil:coil*2}).k/q.k,1/8);
 const m=q.mass+q.oneTurn,ms=q.activeMass;let lo=0,hi=Math.PI/2;
 // Exact distributed spring, fixed at one end with tip mass: x tan x=ms/m.
 for(let i=0;i<70;i++){const x=(lo+hi)/2;if(x*Math.tan(x)>ms/m)hi=x;else lo=x;}
 const exact=(lo+hi)/2*Math.sqrt(q.k/ms)/(2*Math.PI),error=Math.abs(q.fn/exact-1);assert(error<3e-6);checks++;maxRayleighError=Math.max(error,maxRayleighError);
 // Rayleigh kinetic integral for the assumed linear velocity mode.
 let integrated=0;const n=2000;for(let i=0;i<=n;i++){const x=i/n,weight=(i===0||i===n?1:i%2?4:2)/(3*n);integrated+=x*x*ms*weight;}near(integrated,ms/3);
 for(let i=0;i<=64;i++){
  const time=i*.13,m=spring(p,time),realTime=time/4,phase=m.omega*realTime;
  near(m.length,m.L0-m.F/m.k-m.A*Math.cos(phase));near(m.force,m.k*(m.L0-m.length));near(m.energy,.5*m.k*m.A*m.A);
  near(m.effective*m.A*m.omega*m.omega*Math.cos(phase),m.force-m.F);
  // End coils have pitch d; each active turn has this remaining pitch.
  assert((m.length-3*m.d)/8>m.d);checks++;assert(m.length>m.solid);checks++;
 }
 minClearance=Math.min(minClearance,q.clearance);near(q.solid,11*q.d);
}
assert(criteria(267,solutions[267]).ok);assert(!criteria(267,{wire:2,coil:30}).ok);checks+=2;
console.log(`Elementos267: ${checks} comprobaciones correctas; holgura mínima ${(minClearance*1000).toFixed(5)} mm; error Rayleigh máximo ${maxRayleighError}.`);
