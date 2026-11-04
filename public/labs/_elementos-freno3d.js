import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,arrow,rodMesh,setRod} from './_proceso-piezas.js';
const S=6,TAU=2*Math.PI,CY=1.70;
function ring(parent,profile,material){const g=group(parent);g.rotation.x=Math.PI/2;return lathe(g,profile.map(([r,z])=>[r*S,z*S]),material);}
function band(parent,r0,r1,material){const shape=new THREE.Shape(),start=Math.PI/6,end=3*Math.PI/2;shape.absarc(0,0,r1*S,start,end,false);shape.lineTo(r0*S*Math.cos(end),r0*S*Math.sin(end));shape.absarc(0,0,r0*S,end,start,true);shape.closePath();const g=new THREE.ExtrudeGeometry(shape,{depth:.08*S,steps:1,bevelEnabled:false,curveSegments:64}),mesh=new THREE.Mesh(g,material);mesh.position.z=-.04*S;mesh.castShadow=mesh.receiveShadow=true;parent.add(mesh);return mesh;}
function strap(parent,a,b,material,side=1){const length=Math.hypot(b[0]-a[0],b[1]-a[1]),g=group(parent,(a[0]+b[0])*S/2,(a[1]+b[1])*S/2,0);g.rotation.z=Math.atan2(b[1]-a[1],b[0]-a[0]);box(g,length*S,.003*S,.08*S,material,0,side*.0015*S,0);return g;}
export function buildBrake(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),core=group(hero,-.65,CY,0),v={id:268,hero,fixed,core,m,S:state,detail:[core],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:0}};foot(fixed,m,5.6,2.6);
 const back=group(fixed,-.65,CY,-.67);box(back,.25,1.5,.35,m.paint,0,-.85,0);box(back,.65,.12,.75,m.steel,0,-1.60,0);ring(back,[[.026,-.02],[.05,-.02],[.065,0],[.05,.02],[.026,.02],[.026,-.02]],m.paint);
 v.rotor=group(core);v.rotor.name='tambor-freno';ring(v.rotor,[[.168,-.04],[.195,-.04],[.2,-.035],[.2,.035],[.195,.04],[.168,.04],[.168,-.04]],m.steel);ring(v.rotor,[[.025,-.065],[.045,-.065],[.052,-.04],[.052,.04],[.045,.065],[.025,.065],[.025,-.065]],m.aluminum);
 for(let i=0;i<6;i++){const a=i*TAU/6,g=group(v.rotor);g.rotation.z=a;box(g,.70,.12,.15,m.aluminum,.66,0,0);const bolt=cylinder(v.rotor,.035,.025,m.copper,.89*Math.cos(a),.89*Math.sin(a),.0875);bolt.rotation.x=Math.PI/2;}
 const shaft=cylinder(v.rotor,.0245*S,1.25,m.steel,0,0,-.16);shaft.rotation.x=Math.PI/2;box(v.rotor,.025,.22,.008,m.copper,0,.12,.47);
 const lining=m.rubber.clone();lining.color.setHex(0x58463a);v.band=group(core);band(v.band,.2,.202,lining);band(v.band,.202,.204,m.copper);
 v.strap1=strap(core,[.2*Math.sqrt(3)/2,.1],[.2*Math.sqrt(3)/2+.09,.1-.18*Math.sqrt(3)/2],m.copper);v.strap2=strap(core,[0,-.2],[.38,-.2],m.copper,-1);
 v.endPins=[0,1].map(()=>{const g=cylinder(core,.035,.40,m.steel,0,0,.18);g.rotation.x=Math.PI/2;return g;});
 v.lever=group(core,0,0,.36);v.links=[rodMesh(v.lever,.045,m.steel),rodMesh(v.lever,.045,m.steel),rodMesh(v.lever,.045,m.steel)];v.pivot=group(v.lever);v.pivot.name='pivote-freno';const pin=cylinder(v.pivot,.09,.16,m.copper);pin.rotation.x=Math.PI/2;v.handle=group(v.lever);const grip=cylinder(v.handle,.075,.36,m.rubber);grip.rotation.z=Math.PI/2;
 v.support=group(hero);box(v.support,.65,1.0,.30,m.paint,0,0,-.1);v.supportHead=cylinder(v.support,.13,.60,m.steel,0,.5,.24);v.supportHead.rotation.x=Math.PI/2;
 v.forces=[arrow(v.lever,[0,0,0],[0,.2,0],0x7edfd5),arrow(v.lever,[0,0,0],[-.2,0,0],0x7edfd5),arrow(v.lever,[0,0,0],[0,.3,0],0xeeb978)];
 mergeByMaterial(fixed);return v;
}
export function updateBrake(v,q){
 v.endPins.forEach((g,i)=>{const a=i?q.A2:q.A1;g.position.x=a[0]*S;g.position.y=a[1]*S;});
 v.rotor.rotation.z=q.angle;const to3=p=>[p[0]*S,p[1]*S,0];v.pivot.position.set(...to3(q.pivot));v.handle.position.set(...to3(q.effort));setRod(v.links[0],to3(q.A1),to3(q.pivot));setRod(v.links[1],to3(q.A2),to3(q.pivot));setRod(v.links[2],to3(q.pivot),to3(q.effort));
 const supportY=CY+q.pivot[1]*S;v.support.position.set(-.65+q.pivot[0]*S,supportY-.5,-.13);
 for(const [i,[point,dir,force]]of [[q.A1,q.t1,q.T1],[q.A2,q.t2,q.T2],[q.effort,[0,1],q.F]].entries()){const a=v.forces[i],length=force*(i===2?.006:.00016);a.position.set(point[0]*S,point[1]*S,.12);a.setDirection(new THREE.Vector3(dir[0],dir[1],0));a.setLength(length,Math.min(.10,length*.4),Math.min(.055,length*.25));}
}
