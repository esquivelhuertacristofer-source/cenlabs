import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,arrow} from './_proceso-piezas.js';
import {circleProfile,keyProfile,splineProfile} from './_elementos-perfiles-eje.js';
const S=20,TAU=2*Math.PI;
function shapeFrom(points,Type=THREE.Shape){const s=new Type();s.moveTo(points[0][0]*S,points[0][1]*S);for(const p of points.slice(1))s.lineTo(p[0]*S,p[1]*S);s.closePath();return s;}
function meshProfile(parent,outer,hole,length,material,z){const s=shapeFrom(outer);if(hole)s.holes.push(shapeFrom(hole,THREE.Path));const g=new THREE.ExtrudeGeometry(s,{depth:length,bevelEnabled:false,steps:1}),mesh=new THREE.Mesh(g,material);mesh.position.z=z;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function clear(group){for(const child of [...group.children]){group.remove(child);child.traverse(o=>o.geometry?.dispose());}}
function ring(parent,profile,material,z=0){const g=group(parent,0,0,z);g.rotation.x=Math.PI/2;lathe(g,profile,material);}
export function buildShaftJoints(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),v={id:270,hero,fixed,m,S:state,stations:[],detail:[],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.1}};foot(fixed,m,5.9,4.3);
 box(fixed,3.2,.12,1.9,m.paint,0,2.0,-1.1);for(const x of [-1.45,1.45]){box(fixed,.15,2,.18,m.paint,x,.95,-1.6);box(fixed,.45,.10,.5,m.steel,x,.015,-1.6);}
 for(const [i,[x,y,z]]of [[-1.35,1.08,.35],[1.35,1.08,.35],[0,3.0,-.8]].entries()){
  const core=group(hero,x,y,z),rotor=group(core),station={core,rotor,index:i};rotor.name='uniones-eje-cubo';v.detail.push(core);v.stations.push(station);
  const baseline=i===2?2.06:0;
  for(const zz of [-.95,-.70]){const bearing=group(fixed,x,y,z+zz);ring(bearing,[[.402,-.075],[.51,-.075],[.56,-.04],[.56,.04],[.51,.075],[.402,.075],[.402,-.075]],m.paint);box(fixed,.26,y-baseline-.1,.18,m.paint,x,(y+baseline-.1)/2,z+zz);box(fixed,.6,.08,.42,m.steel,x,baseline+.015,z+zz);}
  station.dynamic=group(rotor);station.pressure=[];
  if(i===2)for(let j=0;j<8;j++)station.pressure.push(arrow(core,[0,0,.07],[0,.2,.07],0x79dfd4));
 }
 const canvas=document.createElement('canvas');canvas.width=canvas.height=64;const ctx=canvas.getContext('2d');ctx.fillStyle='#d7dfe4';ctx.fillRect(0,0,64,64);ctx.strokeStyle='#c0cbd2';ctx.lineWidth=1;for(let i=-64;i<128;i+=16){ctx.beginPath();ctx.moveTo(i,0);ctx.lineTo(i+64,64);ctx.stroke();}v.sectionTexture=new THREE.CanvasTexture(canvas);v.sectionTexture.wrapS=v.sectionTexture.wrapT=THREE.RepeatWrapping;v.sectionTexture.repeat.set(3,3);v.sectionMaterials=[m.aluminum,m.paint,m.copper].map(base=>{const cap=base.clone();cap.map=v.sectionTexture;cap.roughness=.55;return [cap,base];});mergeByMaterial(fixed);return v;
}
export function updateShaftJoints(v,q,p){
 const signature=p.length+'|'+p.interference;
 if(v.signature!==signature){v.signature=signature;
  for(const s of v.stations){clear(s.dynamic);const i=s.index,shaft=i===0?keyProfile():i===1?splineProfile():circleProfile(.02),hole=i===0?keyProfile(true):i===1?splineProfile(.00005):circleProfile(.02),length=q.L*S;
   s.shaft=meshProfile(s.dynamic,shaft,null,length,v.m.steel,-length/2);s.rear=meshProfile(s.dynamic,circleProfile(.02),null,1.10-length/2,v.m.steel,-1.10);
   s.hub=meshProfile(s.dynamic,circleProfile(.0375),hole,length/2,v.sectionMaterials[i],-length/2);
   if(i===0){s.key=new THREE.Mesh(new THREE.BoxGeometry(.012*S,.008*S,length),v.m.copper);s.key.position.y=Math.sqrt(.02**2-.006**2)*S;s.key.castShadow=s.key.receiveShadow=true;s.dynamic.add(s.key);}
   const pts=circleProfile(.0375).map(([x,y])=>new THREE.Vector3(x*S,y*S,length/2));pts.push(pts[0].clone());s.omitted=new THREE.Line(new THREE.BufferGeometry().setFromPoints(pts),new THREE.LineBasicMaterial({color:0x97b9ca,transparent:true,opacity:.4}));s.dynamic.add(s.omitted);
  }
 }
 v.stations.forEach(s=>s.rotor.rotation.z=q.angle);
 const station=v.stations[2],R=.02*S,length=q.pressure*5e-9;
 station.pressure.forEach((arrow,i)=>{const a=i*TAU/8,cos=Math.cos(a),sin=Math.sin(a);arrow.position.set((R+length)*cos,(R+length)*sin,.06);arrow.setDirection(new THREE.Vector3(-cos,-sin,0));arrow.setLength(length,Math.min(.06,length*.4),Math.min(.03,length*.2));});
}
