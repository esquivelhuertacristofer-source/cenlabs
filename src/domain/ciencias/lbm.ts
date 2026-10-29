/** D2Q9 BGK, colisión+streaming; obstáculo circular no-slip por bounce-back.
 * Entrada de equilibrio, salida extrapolada y paredes superior/inferior deslizantes.
 * Red de128×64; el tiempo físico se obtiene de U_lattice/U_física y dx=D/12.
 */
export class TunelLBM {
 readonly width=128;readonly height=64;readonly N=this.width*this.height;
 readonly cx=[0,1,0,-1,0,1,-1,-1,1];readonly cy=[0,0,1,0,-1,1,1,-1,-1];readonly weights=[4/9,1/9,1/9,1/9,1/9,1/36,1/36,1/36,1/36];readonly opposite=[0,3,4,1,2,7,8,5,6];
 f:Float64Array;next:Float64Array;ux:Float64Array;uy:Float64Array;rho:Float64Array;solid:Uint8Array;steps=0;omega:number;readonly reynolds:number;readonly speed:number;readonly perturbation:number;
 constructor(reynolds=80,speed=.045,perturbation=.00003){this.reynolds=reynolds;this.speed=speed;this.perturbation=perturbation;this.f=new Float64Array(9*this.N);this.next=new Float64Array(9*this.N);this.ux=new Float64Array(this.N);this.uy=new Float64Array(this.N);this.rho=new Float64Array(this.N);this.solid=new Uint8Array(this.N);this.omega=1/(.5+3*speed*12/reynolds);for(let y=0;y<this.height;y++)for(let x=0;x<this.width;x++){const k=y*this.width+x;this.solid[k]=(x-31)**2+(y-31.5)**2<36?1:0;this.rho[k]=1;this.ux[k]=this.solid[k]?0:speed;for(let q=0;q<9;q++)this.f[q*this.N+k]=this.equilibrium(q,1,speed,0);}}
 equilibrium(q:number,rho:number,u:number,v:number){const e=this.cx[q]*u+this.cy[q]*v;return this.weights[q]*rho*(1+3*e+4.5*e*e-1.5*(u*u+v*v));}
 step(count=1){const W=this.width,H=this.height,N=this.N;for(let it=0;it<count;it++){this.next.fill(0);for(let y=0;y<H;y++)for(let x=0;x<W;x++){const k=y*W+x;if(this.solid[k])continue;let rho=0,u=0,v=0;for(let q=0;q<9;q++){const f=this.f[q*N+k];rho+=f;u+=f*this.cx[q];v+=f*this.cy[q];}u/=rho;v/=rho;if(x===0){rho=1;u=this.speed;v=this.perturbation*Math.sin(this.steps*.013)*Math.exp(-1*(((y-H/2)/12)**2));}if(!Number.isFinite(rho)||rho<.5||rho>1.5)throw Error('LBM fuera de estabilidad numérica');this.rho[k]=rho;this.ux[k]=u;this.uy[k]=v;for(let q=0;q<9;q++){const post=this.f[q*N+k]+this.omega*(this.equilibrium(q,rho,u,v)-this.f[q*N+k]);const nx=x+this.cx[q],ny=y+this.cy[q];if(ny<0||ny>=H){const mirrored=[0,1,4,3,2,8,7,6,5][q];this.next[mirrored*N+k]+=post;continue;}if(nx<0||nx>=W)continue;const to=ny*W+nx;if(this.solid[to])this.next[this.opposite[q]*N+k]+=post;else this.next[q*N+to]+=post;}}
 for(let y=0;y<H;y++){const left=y*W,right=left+W-1,near=right-1;for(let q=0;q<9;q++){this.next[q*N+left]=this.equilibrium(q,1,this.speed,this.perturbation*Math.sin(this.steps*.013)*Math.exp(-1*(((y-H/2)/12)**2)));this.next[q*N+right]=this.next[q*N+near];}}
 [this.f,this.next]=[this.next,this.f];this.steps++;}}
 velocity(x:number,y:number){const i=Math.max(0,Math.min(this.width-1,Math.round(x))),j=Math.max(0,Math.min(this.height-1,Math.round(y))),k=j*this.width+i;return [this.ux[k],this.uy[k]] as const;}
}
