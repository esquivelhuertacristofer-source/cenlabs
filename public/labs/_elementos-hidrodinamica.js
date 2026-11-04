// Ocvirk/NACA TN2808: short, isoviscous bearing; positive-pressure half only.
// Friction uses the same report's linear circumferential velocity assumption.
const R=.025,L=.020,c=50e-6,targetLoad=2000,roughness=4e-6,cache=new Map();
export function shortBearingLoad(e,mu,omega){return mu*omega*R*L**3/c**2*e*Math.sqrt(16*e*e+Math.PI**2*(1-e*e))/(4*(1-e*e)**2);}
export function bearingPressure(q,theta,z=0){if(theta<=0||theta>=Math.PI||Math.abs(z)>=q.L/2)return 0;const h=q.c*(1+q.e*Math.cos(theta));return 3*q.mu*q.omega*q.c*q.e*Math.sin(theta)*(q.L*q.L/4-z*z)/h**3;}
export function bearingFromEccentricity(e,mu,omega){
 if(!(e>=0&&e<1&&mu>0&&omega>0))throw Error('Parámetros fuera del dominio hidrodinámico');
 const A=mu*omega*R*L**3/c**2,Wx=-A*e*e/(1-e*e)**2,Wy=Math.PI*A*e/(4*(1-e*e)**1.5),load=Math.hypot(Wx,Wy),phi=Math.atan2(Wy,-Wx),gamma=Math.PI/2+phi,minFilm=c*(1-e),frictionForce=2*Math.PI*mu*omega*R*R*L/(c*Math.sqrt(1-e*e)),torque=frictionForce*R;
 const q={R,L,c,mu,omega,e,Wx,Wy,load,phi,gamma,minFilm,roughness,lambda:minFilm/roughness,centerX:e*c*Math.sin(phi),centerY:-e*c*Math.cos(phi),frictionForce,frictionCoefficient:load>0?frictionForce/load:null,torque,power:torque*omega,oilFlow:omega*R*c*L*e,thetaPressureMax:Math.acos(-6*e/(1+Math.sqrt(1+24*e*e)))};
 q.pressureMax=bearingPressure(q,q.thetaPressureMax,0);return q;
}
export function hydrodynamic(p){
 const key=p.viscosity+'|'+p.speed;if(cache.has(key))return cache.get(key);
 const mu=p.viscosity/1000,omega=p.speed*2*Math.PI/60;if(!(mu>0&&omega>0))throw Error('Se requiere viscosidad y régimen positivos');let lo=0,hi=.999999;
 for(let i=0;i<72;i++){const mid=(lo+hi)/2;if(shortBearingLoad(mid,mu,omega)>targetLoad)hi=mid;else lo=mid;}
 const q={...bearingFromEccentricity((lo+hi)/2,mu,omega),targetLoad};if(cache.size>=256)cache.delete(cache.keys().next().value);cache.set(key,q);return q;
}
// Depth-averaged flow of the same short-bearing approximation:
// thetaDot=Omega/2, zDot=Omega*c*e*sin(theta)*z/(2*h), hence z*h=constant.
// Tracers are reseeded at the inlet after axial discharge or theta=pi.
export function meanFlowTrace(q,time,index){
 const lane=Math.floor(index/8),column=index%8,z0=-q.L/2*(lane+.5)/6,h0=q.c*(1+q.e),threshold=-2*z0*h0/q.L,exit=threshold<=q.minFilm?Math.PI:Math.acos(Math.max(-1,Math.min(1,(threshold/q.c-1)/q.e))),theta=(q.omega*time/400+column*exit/8)%exit,h=q.c*(1+q.e*Math.cos(theta));
 return {theta,z:z0*h0/h,invariant:z0*h0,exit};
}
