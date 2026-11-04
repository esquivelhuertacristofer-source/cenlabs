import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,arrow} from './_proceso-piezas.js';
const S=30,SEG=400,SIDES=8,TAU=2*Math.PI;
function springGeometry(){const g=new THREE.BufferGeometry(),pos=new Float32Array((SEG+1)*(SIDES+1)*3),idx=[];g.setAttribute('position',new THREE.BufferAttribute(pos,3));g.setAttribute('normal',new THREE.BufferAttribute(pos.slice(),3));for(let j=0;j<SEG;j++)for(let k=0;k<SIDES;k++){const a=j*(SIDES+1)+k,b=a+SIDES+1;idx.push(a,a+1,b,a+1,b+1,b);}g.setIndex(idx);return g;}
export function springCenters(q,j){const u=10*j/SEG,a=TAU*u;let x,pitch;if(u<1){x=q.d*u;pitch=q.d;}else if(u<=9){x=q.d+(q.length-3*q.d)*(u-1)/8;pitch=(q.length-3*q.d)/8;}else{x=q.length-2*q.d+q.d*(u-9);pitch=q.d;}return {x:q.d/2+x,a,pitch};}
export function buildSpring(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),core=group(hero,0,1.10,0),v={id:267,hero,fixed,core,m,S:state,detail:[core],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.1}};foot(fixed,m,5.6,2.5);box(fixed,.45,.60,1.2,m.paint,-1.82,.25,0);
 for(const z of [-.63,.63]){box(fixed,4.8,.10,.16,m.steel,0,.30,z);for(const x of [-2.05,2.05])box(fixed,.25,.35,.30,m.paint,x,.12,z);}
 v.anchor=group(core,-1.7,0,0);box(v.anchor,.20,1.08,1.2,m.paint,-.12,-.03,0);v.slider=group(core);v.slider.name='carro-resorte';box(v.slider,.65,.80,1.12,m.aluminum,.4,-.02,0);box(v.slider,.65,.16,1.30,m.paint,.4,-.50,0);
 for(const x of [.15,.65])for(const z of [-.66,.66]){const wheel=cylinder(v.slider,.095,.06,m.steel,x,-.655,z);wheel.rotation.x=Math.PI/2;}
 function cup(g){const a=group(g);a.rotation.z=-Math.PI/2;lathe(a,[[0,-.06],[.44,-.06],[.53,-.02],[.53,.02],[.45,.08],[.33,.08],[.33,.02],[0,.02]],m.copper);return a;}
 v.leftCup=cup(v.anchor);v.rightCup=cup(v.slider);v.rightCup.rotation.z=Math.PI/2;
 v.wire=new THREE.Mesh(springGeometry(),m.steel);v.wire.castShadow=v.wire.receiveShadow=true;v.wire.name='alambre-activo';core.add(v.wire);
 v.force=arrow(v.slider,[.9,0,.02],[.5,0,.02],0xeeb978);v.guide=group(fixed,0,1.10,-.88);const rail=cylinder(v.guide,.025,4.5,m.aluminum);rail.rotation.z=Math.PI/2;box(v.slider,.16,.16,.25,m.steel,.4,0,-.88);
 mergeByMaterial(fixed);return v;
}
export function updateSpring(v,q){
 v.slider.position.x=-1.7+q.length*S;const p=v.wire.geometry.attributes.position,n=v.wire.geometry.attributes.normal,R=q.D/2,r=q.d/2;
 for(let j=0;j<=SEG;j++){const {x,a,pitch}=springCenters(q,j),c=Math.cos(a),s=Math.sin(a),h=pitch/TAU,den=Math.hypot(R,h),bx=-R/den,by=-h*s/den,bz=h*c/den;
  for(let k=0;k<=SIDES;k++){const ph=k*TAU/SIDES,co=Math.cos(ph),si=Math.sin(ph),nx=si*bx,ny=co*c+si*by,nz=co*s+si*bz,i=j*(SIDES+1)+k;p.setXYZ(i,-1.7+(x+r*nx)*S,(R*c+r*ny)*S,(R*s+r*nz)*S);n.setXYZ(i,nx,ny,nz);}}
 p.needsUpdate=n.needsUpdate=true;v.wire.geometry.computeBoundingSphere();
 const cup=(q.D+q.d)*S/2/.45;v.leftCup.scale.set(cup,1,cup);v.rightCup.scale.set(cup,1,cup);
 v.force.setLength(q.F*.012);v.force.position.set(.95,0,.02);
}
