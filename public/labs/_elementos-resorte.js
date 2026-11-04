// Close-coiled torsion, Wahl correction, Rayleigh effective active mass.
// Maruho/Tokai formulas; mass/end-fixture assumptions declared in the ficha.
export function spring(p,t=0){
 const d=p.wire/1000,D=p.coil/1000,Na=8,Nt=10,G=78.5e9,rho=7850,L0=.1,F=30,mass=3,A=.002;
 const k=G*d**4/(8*D**3*Na),C=D/d,Wahl=(4*C-1)/(4*C-4)+.615/C;
 const oneTurn=rho*Math.PI*d*d/4*Math.PI*D,activeMass=Na*oneTurn,effective=mass+oneTurn+activeMass/3,omega=Math.sqrt(k/effective),fn=omega/(2*Math.PI),deflection=F/k;
 const dynamic=A*Math.cos(omega*t/4),length=L0-deflection-dynamic,velocity=A*omega*Math.sin(omega*t/4),force=F+k*dynamic,peakForce=F+k*A;
 return {phase:t,duration:8,signal:force,reference:F,d,D,Na,Nt,G,rho,L0,F,mass,A,k,C,Wahl,oneTurn,activeMass,effective,omega,fn,deflection,length,velocity,force,peakForce,stress:Wahl*8*peakForce*D/(Math.PI*d**3),solid:(Nt+1)*d,clearance:L0-deflection-A-(Nt+1)*d,energy:.5*k*dynamic*dynamic+.5*effective*velocity*velocity};
}
