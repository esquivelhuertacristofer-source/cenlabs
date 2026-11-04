// Planar differential band brake. SI, kinetic Coulomb friction.
export function bandBrake(p,t=0){
 const mu=p.friction,b=p.arm/1000,a=.06,l=.2,R=.2,theta=4*Math.PI/3,F=80,J=12,omega0=60;
 const ratio=Math.exp(mu*theta),margin=a-b*ratio;if(!(mu>0)||!(b>0)||!(margin>0))throw RangeError('Palanca autobloqueada: no hay solución de deslizamiento positiva');
 const T2=F*l/margin,T1=T2*ratio,torque=(T1-T2)*R,reverseT2=F*l/(a*ratio-b),reverseTorque=(ratio-1)*reverseT2*R,stopTime=J*omega0/torque,phase=t%10,elapsed=Math.min(phase,stopTime),omega=Math.max(0,omega0-torque*phase/J),angle=(omega0*elapsed-torque*elapsed*elapsed/(2*J))/40;
 const heat=.5*J*(omega0*omega0-omega*omega),totalEnergy=.5*J*omega0*omega0,power=torque*omega,temperature=20+heat/(8*460);
 const t1=[-.5,Math.sqrt(3)/2],t2=[-1,0],A1=[R*Math.sqrt(3)/2+.09,R/2-.18*Math.sqrt(3)/2],A2=[.38,-R],pivotY=a-R,pivotX=(R-b-.5*pivotY)/(Math.sqrt(3)/2),pivot=[pivotX,pivotY],effort=[pivotX+l,pivotY];
 return {mu,b,a,l,R,theta,F,J,omega0,ratio,margin,T2,T1,torque,reverseTorque,stopTime,phase,elapsed,omega,angle,heat,totalEnergy,power,temperature,t1,t2,A1,A2,pivot,effort,duration:8,signal:omega,reference:0};
}
