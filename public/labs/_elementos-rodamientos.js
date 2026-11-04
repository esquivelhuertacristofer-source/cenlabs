// NSK Industrial Motor Bearings, PDF p23. Ratings are in N despite the
// catalogue's inconsistent (kN) heading; 14700 N = 14.7 kN. Same edition only.
export const bearingOptions=[
 {name:'6005',d:.025,D:.047,B:.012,C:10600,C0:5850,f0:14.5,balls:10},
 {name:'6205',d:.025,D:.052,B:.015,C:14700,C0:7850,f0:13.9,balls:9},
 {name:'6305',d:.025,D:.062,B:.017,C:21600,C0:11200,f0:13.2,balls:8},
];
export const factorTable=[
 [.172,.19,2.30],[.345,.22,1.99],[.689,.26,1.71],[1.03,.28,1.55],
 [1.38,.30,1.45],[2.07,.34,1.31],[3.45,.38,1.15],[5.17,.42,1.04],[6.89,.44,1],
];
export function bearingFactors(u){
 if(!Number.isFinite(u)||u<factorTable[0][0]||u>factorTable.at(-1)[0])throw RangeError('Factor fuera de la tabla NSK');
 const i=factorTable.findIndex(row=>row[0]>=u),a=factorTable[Math.max(0,i-1)],b=factorTable[i],f=a===b?0:(u-a[0])/(b[0]-a[0]);
 return {e:a[1]+f*(b[1]-a[1]),Y:a[2]+f*(b[2]-a[2])};
}
export function rollingBearing(p,time=0){
 const b=bearingOptions[p.bearing-1];if(!b||!(p.radial>0))throw RangeError('Rodamiento o carga inválidos');
 const Fr=p.radial,Fa=400,n=1500,u=b.f0*Fa/b.C0,{e,Y}=bearingFactors(u),combined=Fa/Fr>e,X=combined?.56:1;
 // The rounded table can yield P just below Fr near its switching point.
 const P=combined?Math.max(Fr,X*Fr+Y*Fa):Fr,L10=(b.C/P)**3,L10h=L10*1e6/(60*n),P0=Math.max(Fr,.6*Fr+.5*Fa),s0=b.C0/P0;
 const pitch=(b.d+b.D)/4,ballRadius=(b.D-b.d)*.14,omega=n*2*Math.PI/60,omegaCage=omega/2*(1-ballRadius/pitch),omegaBall=-omegaCage*pitch/ballRadius;
 return {...b,Fr,Fa,n,u,e,X,Y:combined?Y:0,P,L10,L10h,P0,s0,pitch,ballRadius,omega,omegaCage,omegaBall,thetaInner:omega*time/200,thetaCage:omegaCage*time/200,thetaBall:omegaBall*time/200,phase:time,duration:8,signal:P,reference:Fr};
}
