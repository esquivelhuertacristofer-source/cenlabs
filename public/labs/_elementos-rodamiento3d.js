import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,arrow} from './_proceso-piezas.js';
const S=55,TAU=2*Math.PI;
function ring(parent,profile,material){const g=group(parent);g.rotation.x=Math.PI/2;return lathe(g,profile,material);}
export function raceProfile(q,outer){
 const R=q.pitch,r=q.ballRadius,rg=r*1.04,edge=.8*r,zs=Array.from({length:25},(_,i)=>-edge+2*edge*i/24);
 const groove=z=>outer?R-(rg-r)+Math.sqrt(rg*rg-z*z):R+(rg-r)-Math.sqrt(rg*rg-z*z);
 const h=q.B/2,land=groove(edge),boundary=outer?q.D/2:q.d/2,bevel=.00035;
 return [[boundary,-h+bevel],[boundary+(outer?-bevel:bevel),-h],[land,-h],...zs.map(z=>[groove(z),z]),[land,h],[boundary+(outer?-bevel:bevel),h],[boundary,h-bevel],[boundary,-h+bevel]].map(([r,z])=>[r*S,z*S]);
}
export function buildRolling(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),core=group(hero,0,1.9,0),v={id:266,hero,fixed,core,m,S:state,detail:[core],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.1}};core.name='rodamiento-seleccion';foot(fixed,m,4.2,2.6);
 box(fixed,2.1,.18,1.5,m.paint,0,.03,-.35);for(const x of [-1,1]){box(fixed,.14,1.9,.18,m.paint,x,.95,-.9);const bolt=cylinder(fixed,.06,.05,m.steel,x,.15,.22);bolt.geometry.dispose();bolt.geometry=new THREE.CylinderGeometry(.06,.06,.05,6);}
 box(fixed,2.2,.12,.25,m.steel,0,1.88,-.9);
 v.cartridge=group(core);v.inner=group(v.cartridge);v.outer=group(v.cartridge);v.cage=group(v.cartridge);v.ballGroups=[];
 v.shaft=group(core);const sh=cylinder(v.shaft,.0125*S,1.8,m.steel,0,0,-.30);sh.rotation.x=Math.PI/2;box(v.shaft,.026,.36,.008,m.copper,0,.41,.605);
 v.force=arrow(core,[0,2,.08],[0,1.5,.08],0xeeb978);v.axial=arrow(core,[1.4,0,1],[1.4,0,.6],0x7edfd5);
 mergeByMaterial(fixed);return v;
}
function clear(g){for(const c of [...g.children]){g.remove(c);c.traverse(o=>{if(o.geometry)o.geometry.dispose();});}}
export function updateRolling(v,q){
 if(v.design!==q.name){v.design=q.name;for(const g of [v.inner,v.outer,v.cage])clear(g);for(const g of v.ballGroups){clear(g);g.removeFromParent();}v.ballGroups=[];
  ring(v.inner,raceProfile(q,false),v.m.steel);ring(v.outer,raceProfile(q,true),v.m.aluminum);
  // Front face engraving substitutes: short radial metal inserts, no text.
  for(let i=0;i<8;i++){const a=i*TAU/8,r=q.D/2*S-.045;box(v.outer,.035,.012,.009,v.m.steel,r*Math.cos(a),r*Math.sin(a),q.B*S/2+.005);}
  const R=q.pitch*S,r=q.ballRadius*S,z=1.18*r;
  for(const side of [-1,1])ring(v.cage,[[R-.03,side*z-.012],[R+.03,side*z-.012],[R+.03,side*z+.012],[R-.03,side*z+.012],[R-.03,side*z-.012]],v.m.copper);
  for(let i=0;i<q.balls;i++){
   const a=(i+.5)*TAU/q.balls,bridge=group(v.cage,R*Math.cos(a),R*Math.sin(a),0);bridge.rotation.z=a;box(bridge,r*.8,.035,2*z+.024,v.m.copper);
   const ball=group(v.cartridge);ball.userData.rollingBall=true;const mesh=new THREE.Mesh(new THREE.SphereGeometry(r,32,24),v.m.steel);mesh.castShadow=true;ball.add(mesh);
   // Great-circle inlay makes absolute ball spin observable, without a spoke.
   const stripe=new THREE.Mesh(new THREE.TorusGeometry(r*1.001,.003,6,48),v.m.copper);stripe.rotation.x=Math.PI/2;ball.add(stripe);v.ballGroups.push(ball);
  }
 }
 v.inner.rotation.z=v.shaft.rotation.z=q.thetaInner;v.cage.rotation.z=q.thetaCage;
 q&&v.ballGroups.forEach((g,i)=>{const a=i*TAU/q.balls+q.thetaCage;g.position.set(q.pitch*S*Math.cos(a),q.pitch*S*Math.sin(a),0);g.rotation.z=q.thetaBall;});
 const length=q.Fr*.00030;v.force.position.set(0,q.D*S/2+length+.12,.08);v.force.setLength(length);v.axial.position.set(q.D*S/2+.10,0,.8);v.axial.setLength(q.Fa*.0008);
}
