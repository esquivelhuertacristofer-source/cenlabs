import assert from 'node:assert/strict';
import {shaftJoint,hubField} from '../../public/labs/_elementos-uniones-eje.js';
import {keyProfile,splineProfile} from '../../public/labs/_elementos-perfiles-eje.js';
import {criteria,solutions} from '../../public/labs/_elementos-modelos.js';
let checks=0;const near=(x,y,tol=1e-9)=>{assert(Math.abs(x-y)<=tol*Math.max(1,Math.abs(y)),`${x} != ${y}`);checks++;};
const ref=shaftJoint(solutions[270]);near(ref.pressure,33810000);near(ref.TkeyShear,691.2);near(ref.TkeyBearing,384);near(ref.Tspline,1728);near(ref.Tfit,489.4490770231492);near(ref.hubHoop,60690000);
for(let length=20;length<=60;length+=2)for(let interference=8;interference<=40;interference+=2){
 const p={length,interference},q=shaftJoint(p),a=q.d/2,b=q.D/2,inlet=hubField(q,a),outlet=hubField(q,b);
 near(inlet.radial,-q.pressure);near(outlet.radial,0,1e-6);near(inlet.hoop,q.hubHoop);
 const us=-q.pressure*(1-q.nu)*a/q.E;near(2*(inlet.displacement-us),q.delta,1e-13);
 for(let i=1;i<16;i++){const r=a+(b-a)*i/16,h=1e-7,lo=hubField(q,r-h),mid=hubField(q,r),hi=hubField(q,r+h);near((hi.radial-lo.radial)/(2*h),(mid.hoop-mid.radial)/r,1e-8);near((hi.displacement-lo.displacement)/(2*h),(mid.radial-q.nu*mid.hoop)/q.E,1e-10);near(mid.displacement/r,(mid.hoop-q.nu*mid.radial)/q.E,1e-12);}
 // Integrate tangential traction over nominal cylindrical contact area.
 let torque=0;for(let j=0;j<64;j++)for(let k=0;k<8;k++)torque+=q.mu*q.pressure*a*a*(2*Math.PI/64)*(q.L/8);near(torque,q.Tfit,1e-10);
 const doubleL=shaftJoint({...p,length:length*2}),doubleI=shaftJoint({...p,interference:interference*2});for(const key of ['Tkey','Tspline','Tfit'])near(doubleL[key],2*q[key]);near(doubleI.Tfit,2*q.Tfit);near(doubleI.pressure,2*q.pressure);
 near(2*q.TkeyShear/(q.d*q.b*q.L),60e6);near(4*q.TkeyBearing/(q.d*q.h*q.L),100e6);near(q.Tspline/(q.effectiveTeeth*q.flank*q.L*q.d/2),100e6);
 near(shaftJoint(p,2).angle,Math.PI);near(shaftJoint(p,4).angle,2*Math.PI);
}
const male=keyProfile(),female=keyProfile(true),seat=Math.sqrt(.02**2-.006**2);near(male.at(-1)[1],seat-.004);near(female.at(-1)[1],seat+.00405);near(seat-male.at(-1)[1],.004);near(female.at(-1)[1]-.00005-seat,.004);
const spline=splineProfile(),hole=splineProfile(.00005);assert.equal(spline.length,hole.length);checks++;for(let i=0;i<spline.length;i++)assert(Math.hypot(...hole[i])>Math.hypot(...spline[i]));checks+=spline.length;
const heads=spline.filter(p=>Math.abs(Math.hypot(...p)-Math.hypot(.021,.0015))<1e-10);assert.equal(heads.length,24);checks++; // Two corners per tooth.
assert(criteria(270,solutions[270]).ok);assert(!criteria(270,{length:28,interference:12}).ok);assert.throws(()=>shaftJoint({length:0,interference:10}));checks+=3;
console.log(`Elementos270: ${checks} comprobaciones correctas.`);
