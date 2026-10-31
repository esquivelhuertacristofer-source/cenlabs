import assert from 'node:assert/strict';
import {landscape,landscapeGradient} from '../../src/domain/ciencias/decisiones.ts';
let checked=0,maxError=0;
for(let i=-30;i<=30;i++)for(let j=-30;j<=30;j++){const x=i/10,z=j/10,h=1e-5,[gx,gz]=landscapeGradient(x,z),dx=(landscape(x+h,z)-landscape(x-h,z))/(2*h),dz=(landscape(x,z+h)-landscape(x,z-h))/(2*h);maxError=Math.max(maxError,Math.abs(dx-gx),Math.abs(dz-gz));assert(Math.abs(dx-gx)<1e-8&&Math.abs(dz-gz)<1e-8);if(Math.hypot(gx,gz)>.01)assert(landscape(x-gx*1e-4,z-gz*1e-4)<landscape(x,z),'El campo debe descender');checked++;}
console.log(JSON.stringify({checked,maxError,field:'−∇f analítico, comprobado por diferencias centrales y descenso local'}));
