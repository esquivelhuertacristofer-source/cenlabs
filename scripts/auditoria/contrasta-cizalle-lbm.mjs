/** Flujo uniforme y difusión de dos modos de cizalle, con error de resolución explícito. */
import assert from 'node:assert/strict';
import {writeFile,mkdir} from 'node:fs/promises';
import {TunelLBM} from '../../src/domain/ciencias/lbm.ts';
const uniform=new TunelLBM(80,.045,0);uniform.solid.fill(0);uniform.step(300);let errorUniform=0;
for(let i=0;i<uniform.N;i++)errorUniform=Math.max(errorUniform,Math.abs(uniform.rho[i]-1),Math.abs(uniform.ux[i]-.045),Math.abs(uniform.uy[i]));assert(errorUniform<1e-11,'El flujo uniforme no se conserva');
const modes=[];
for(const mode of [4,8]){const sim=new TunelLBM(80,.045,0);sim.solid.fill(0);const amplitude=.002,k=mode*Math.PI/64,nu=.045*12/80;
 for(let y=0;y<64;y++)for(let x=0;x<128;x++){const i=y*128+x,u=.045+amplitude*Math.cos(k*(y+.5));for(let q=0;q<9;q++)sim.f[q*sim.N+i]=sim.equilibrium(q,1,u,0);}
 function measure(){let sum=0,norm=0;for(let y=0;y<64;y++){let rho=0,u=0;const i=y*128+64;for(let q=0;q<9;q++){const f=sim.f[q*sim.N+i];rho+=f;u+=f*sim.cx[q];}const c=Math.cos(k*(y+.5));sum+=(u/rho-.045)*c;norm+=c*c;}return sum/norm;}
 sim.step(20);const at20=measure();sim.step(40);const at60=measure(),expectedFromStart=amplitude*Math.exp(-nu*k*k*60),expectedFrom20=at20*Math.exp(-nu*k*k*40),startupError=Math.abs(at60-expectedFromStart)/expectedFromStart,windowError=Math.abs(at60-expectedFrom20)/expectedFrom20;
 assert(windowError<.01,'Tramo20–60 fuera del1% de amplitud para el modo'+mode);assert(startupError<(mode===4?.005:.02),'Error de arranque fuera del criterio de resolución');modes.push({mode,wavelengthCells:128/mode,k,nu,at20,at60,expectedFromStart,expectedFrom20,startupError,windowError});
}
const ratio=modes[1].startupError/modes[0].startupError;assert(ratio>3&&ratio<6,'La mejora al reducir k no concuerda con error de segundo orden');
const report={uniform:{steps:300,maxError:errorUniform},modes,errorRatio:ratio,method:'u(y,0)=U+Acos(k(y+1/2)); referencia A(t)=A(0)exp(−νk²t). Se reportan tanto arranque0–60 como tramo20–60, sin ocultar el transitorio de inicializar con poblaciones de equilibrio. Sonda en el centro de la red.',limits:'Modos sin obstáculo, perturbación de entrada nula y paredes deslizantes; no valida arrastre industrial ni turbulencia. El modo de16 celdas tiene1,37% de error de amplitud desde el arranque; no se afirma1% de precisión de viscosidad.'};
const out=new URL('./.salida/ciencias50/',import.meta.url);await mkdir(out,{recursive:true});await writeFile(new URL('referencia-hidrodinamica.json',out),JSON.stringify(report,null,2));console.log(JSON.stringify(report));
