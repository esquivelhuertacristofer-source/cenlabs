import {THREE,group,box,cylinder,lathe,rodMesh,setRod,foot,mergeByMaterial,arrow,bearing} from './_proceso-piezas.js';
import {gearSection} from './_elementos-geometria.js';
const S=12,TAU=2*Math.PI;
function gearMesh(q,index,material){
 const outer=gearSection(q,index),inner=Array.from({length:64},(_,i)=>{const a=-TAU*i/64,r=q['root'+index]*.68;return [r*Math.cos(a),r*Math.sin(a)];}),contours=[outer,inner],positions=[],indices=[],caps=[],steps=12;
 for(const contour of contours){const base=positions.length/3,N=contour.length;
  for(let j=0;j<=steps;j++){const z=q.b*(j/steps-.5),a=(index===1?1:-1)*z*Math.tan(q.beta)/q['R'+index],c=Math.cos(a),s=Math.sin(a);for(const [x,y]of contour)positions.push(S*(x*c-y*s),S*(x*s+y*c),S*z);}
  for(let j=0;j<steps;j++)for(let i=0;i<N;i++){const a=base+j*N+i,b=base+j*N+(i+1)%N,c=base+(j+1)*N+i,d=base+(j+1)*N+(i+1)%N;indices.push(a,b,c,b,d,c);}
 }
 const flat=[...outer,...inner],tris=THREE.ShapeUtils.triangulateShape(outer.map(p=>new THREE.Vector2(...p)),[inner.map(p=>new THREE.Vector2(...p))]);
 for(const sign of [-1,1]){const base=positions.length/3,z=sign*q.b/2,a=(index===1?1:-1)*z*Math.tan(q.beta)/q['R'+index],c=Math.cos(a),s=Math.sin(a);for(const [x,y]of flat){positions.push(S*(x*c-y*s),S*(x*s+y*c),S*z);caps.push([positions.length/3-1,sign]);}for(const tri of tris){const [i,j,k]=tri,A=flat[i],B=flat[j],C=flat[k],cross=(B[0]-A[0])*(C[1]-A[1])-(B[1]-A[1])*(C[0]-A[0]);indices.push(base+i,base+(cross*sign>0?j:k),base+(cross*sign>0?k:j));}}
 const geometry=new THREE.BufferGeometry();geometry.setAttribute('position',new THREE.Float32BufferAttribute(positions,3));geometry.setIndex(indices);geometry.computeVertexNormals();for(const [i,sign]of caps)geometry.attributes.normal.setXYZ(i,0,0,sign);geometry.computeBoundingSphere();const mesh=new THREE.Mesh(geometry,material);mesh.name='dentado-helicoidal';mesh.castShadow=mesh.receiveShadow=true;return mesh;
}
export function gearBody(parent,q,index,m){
 const mesh=gearMesh(q,index,index===1?m.copper:m.aluminum);parent.add(mesh);const depth=q.b*S,hub=group(parent);hub.rotation.x=Math.PI/2;lathe(hub,[[.096,-depth*.5-.06],[.19,-depth*.5-.06],[.21,-depth*.5],[.21,depth*.5],[.19,depth*.5+.06],[.096,depth*.5+.06],[.096,-depth*.5-.06]],m.steel);
 const radius=q['root'+index]*.68*S;
 for(let i=0;i<6;i++){const a=i*TAU/6,g=group(parent);g.rotation.z=a;box(g,radius-.14,.085,depth*.7,index===1?m.copper:m.aluminum,(radius+.14)/2,0,0);}
 return mesh;
}
export function buildHelical(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),v={id:263,hero,fixed,m,S:state,detail:[],axes:[],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:0}};foot(fixed,m,4.1,2.25);
 for(let i=0;i<2;i++){const cart=group(hero,0,1.2,0),support=group(cart),rotor=group(cart),body=group(rotor);body.name='ancho-engranaje';const shaft=cylinder(rotor,.095,1.7,m.steel);shaft.rotation.x=Math.PI/2;
  for(const z of [-.68,.68]){const supportPlate=group(support,0,0,z);box(supportPlate,.48,.10,.44,m.paint,0,-1.16,0);box(supportPlate,.30,1,.23,m.paint,0,-.72,0);const ring=group(supportPlate);ring.rotation.x=Math.PI/2;lathe(ring,[[.23,-.13],[.29,-.13],[.32,-.09],[.32,.09],[.29,.13],[.23,.13],[.23,-.13]],m.paint);bearing(ring,m,.23);for(const x of [-.15,.15])cylinder(supportPlate,.028,.025,m.copper,x,-1.10,.12);}
  mergeByMaterial(support);v.axes.push({cart,rotor,body});v.detail.push(rotor);
 }
 v.contactGroup=group(hero);v.contactLines=Array.from({length:6},()=>rodMesh(v.contactGroup,.008,m.copper));v.forceGroup=group(hero);v.forces=[arrow(v.forceGroup,[0,0,0],[-.4,0,0],0x7cded3),arrow(v.forceGroup,[0,0,0],[0,-.5,0],0xeebd7e),arrow(v.forceGroup,[0,0,0],[0,0,.4],0x93bff7)];v.detail.push(v.contactGroup,v.forceGroup);mergeByMaterial(fixed);return v;
}
export function updateHelical(v,q,p){
 const signature=p.beta+'|'+p.width;if(v.signature!==signature){v.signature=signature;v.axes.forEach((a,i)=>{a.body.traverse(o=>{if(o.isMesh)o.geometry.dispose();});a.body.clear();a.mesh=gearBody(a.body,q,i+1,v.m);a.cart.position.x=(i?.5:-.5)*q.center*S;});}
 v.axes[0].rotor.rotation.z=q.theta1;v.axes[1].rotor.rotation.z=q.theta2;
 v.contactLines.forEach((line,i)=>{line.visible=i<q.contacts.length;if(line.visible){const map=p=>[(p[0]-q.center/2)*S,1.2+p[1]*S,p[2]*S];setRod(line,map(q.contacts[i].start),map(q.contacts[i].end));}});
 const x=(q.R1-q.center/2)*S;v.forceGroup.position.set(x,1.2,q.b*S/2+.04);v.forces.forEach((a,i)=>a.setLength([q.Fr,q.Ft,q.Fa][i]*.00065));
}
