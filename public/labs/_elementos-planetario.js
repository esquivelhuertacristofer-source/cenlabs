import {THREE,group,box,cylinder,lathe,foot,mergeByMaterial,bearing} from './_proceso-piezas.js';
import {gearBody} from './_elementos-engranes.js';
import {helical} from './_elementos-modelos.js';
import {internalRingSection} from './_elementos-geometria.js';
const S=12,TAU=2*Math.PI,CENTER=1.72,OUTER=(.108+.003*1.25+.012)*S,ROLLER=.12;
function internalMesh(material){
 const shape=new THREE.Shape(),N=192;shape.moveTo(OUTER,0);for(let i=1;i<N;i++)shape.lineTo(OUTER*Math.cos(i*TAU/N),OUTER*Math.sin(i*TAU/N));shape.closePath();
 const points=internalRingSection().reverse(),hole=new THREE.Path();hole.moveTo(points[0][0]*S,points[0][1]*S);for(const [x,y]of points.slice(1))hole.lineTo(x*S,y*S);hole.closePath();shape.holes.push(hole);
 const geometry=new THREE.ExtrudeGeometry(shape,{depth:.024*S,bevelEnabled:false,steps:1,curveSegments:1});const mesh=new THREE.Mesh(geometry,material);mesh.position.z=-.012*S;mesh.castShadow=mesh.receiveShadow=true;mesh.name='corona-72-dientes';return mesh;
}
function axialRing(parent,profile,material,z=0){const g=group(parent,0,0,z);g.rotation.x=Math.PI/2;lathe(g,profile,material);return g;}
export function buildPlanetary(scene,m,state){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),kin=group(hero,0,CENTER,0);kin.name='tren-planetario';
 const v={id:264,hero,fixed,kin,m,S:state,planets:[],pins:[],rollers:[],detail:[kin],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:0}};foot(fixed,m,4.6,2.4);
 v.ring=group(kin);v.ring.add(internalMesh(m.steel));for(let i=0;i<12;i++){const a=i*TAU/12,r=OUTER-.07,b=cylinder(v.ring,.025,.035,m.copper,r*Math.cos(a),r*Math.sin(a),.17);b.rotation.x=Math.PI/2;}
 v.sun=group(kin);v.sunBody=group(v.sun);const spur=helical({beta:0,width:24},24,24);gearBody(v.sunBody,spur,1,m);const shaft=cylinder(v.sun,.095,1.5,m.steel,0,0,.20);shaft.rotation.x=Math.PI/2;box(v.sun,.018,.065,.005,m.copper,0,.04,.952);
 for(let i=0;i<3;i++){const g=group(kin);gearBody(g,spur,2,m);v.planets.push(g);}
 v.carrier=group(kin);axialRing(v.carrier,[[.15,.20],[.23,.20],[.26,.25],[.26,.36],[.22,.40],[.22,.85],[.15,.85],[.15,.20]],m.aluminum);
 for(let i=0;i<3;i++){const phi=i*TAU/3,g=group(v.carrier);g.rotation.z=phi;box(g,.864,.105,.075,m.paint,.432,0,.34);const pin=cylinder(g,.095,.60,m.steel,.864,0,.07);pin.rotation.x=Math.PI/2;v.pins.push(pin);const cap=cylinder(g,.125,.04,m.copper,.864,0,.39);cap.rotation.x=Math.PI/2;}
 // Front carrier bushing: its bore0.223 clears the output sleeve radius0.22.
 const front=group(fixed,0,CENTER,.72);axialRing(front,[[.223,-.12],[.30,-.12],[.32,-.07],[.32,.07],[.30,.12],[.223,.12],[.223,-.12]],m.paint);box(front,.28,1.43,.23,m.paint,0,-1.01,0);box(front,.50,.10,.48,m.steel,0,-1.71,0);
 const rear=group(fixed,0,CENTER,-.45),rb=group(rear);rb.rotation.x=Math.PI/2;bearing(rb,m,.23);box(rear,.25,1.5,.20,m.paint,0,-.97,0);box(rear,.48,.10,.44,m.steel,0,-1.71,0);
 for(const phi of [Math.PI/6,5*Math.PI/6,3*Math.PI/2]){const r=OUTER+ROLLER,x=r*Math.cos(phi),y=CENTER+r*Math.sin(phi),support=group(fixed,x,y,-.42);box(support,.16,y+.04,.18,m.paint,0,-(y+.04)/2,0);box(support,.32,.08,.40,m.steel,0,-y,0);const axle=cylinder(support,.035,.55,m.steel,0,0,.21);axle.rotation.x=Math.PI/2;const roller=group(hero,x,y,0),disk=cylinder(roller,ROLLER,.36,m.rubber);disk.rotation.x=Math.PI/2;box(roller,.018,.09,.008,m.copper,0,.05,.185);v.rollers.push(roller);}
 mergeByMaterial(fixed);mergeByMaterial(v.ring);return v;
}
export function updatePlanetary(v,q){
 v.sun.rotation.z=q.thetaSun;v.ring.rotation.z=q.thetaRing;v.carrier.rotation.z=q.thetaCarrier;q.planets.forEach((p,i)=>{v.planets[i].position.set(p.x*S,p.y*S,0);v.planets[i].rotation.z=p.angle;});v.rollers.forEach(r=>r.rotation.z=-OUTER/ROLLER*q.thetaRing);
}
