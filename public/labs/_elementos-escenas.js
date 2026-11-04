import {buildShaftJoints,updateShaftJoints} from './_elementos-uniones-eje3d.js';
import {buildFourBar,updateFourBar} from './_elementos-cuatro-barras3d.js';
import {buildBrake,updateBrake} from './_elementos-freno3d.js';
import {buildSpring,updateSpring} from './_elementos-resorte3d.js';
import {THREE,group,box,cylinder,lathe,rodMesh,setRod,foot,mergeByMaterial,arrow,shell,coil,instance} from './_proceso-piezas.js';
import {buildHelical,updateHelical} from './_elementos-engranes.js';
import {buildPlanetary,updatePlanetary} from './_elementos-planetario.js';
import {buildHydrodynamic,updateHydrodynamic} from './_elementos-cojinete.js';
import {buildRolling,updateRolling} from './_elementos-rodamiento3d.js';
const SCALE=25,AMPLIFY=80;
function hex(g,r,h,m,y){const q=new THREE.Mesh(new THREE.CylinderGeometry(r,r,h,6),m);q.position.y=y;q.castShadow=q.receiveShadow=true;g.add(q);return q;}
function washer(g,m,y){return lathe(g,[[.17,y],[.29,y],[.29,y+.05],[.17,y+.05],[.17,y]],m);}
export function build(id,{scene,mats:m,S}){
 if(id===270)return buildShaftJoints(scene,m,S);
 if(id===269)return buildFourBar(scene,m,S);
 if(id===268)return buildBrake(scene,m,S);
 if(id===267)return buildSpring(scene,m,S);
 if(id===266)return buildRolling(scene,m,S);
 if(id===265)return buildHydrodynamic(scene,m,S);
 if(id===264)return buildPlanetary(scene,m,S);
 if(id===263)return buildHelical(scene,m,S);
 if(id===262)return buildEccentric(scene,m,S);
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),joint=group(hero);foot(fixed,m,2.8,1.6);
 const v={id,hero,fixed,joint,m,S,detail:[joint],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.25}};
 for(const x of [-1.08,1.08]){box(fixed,.18,2.95,.24,m.paint,x,1.425,-.18);cylinder(fixed,.035,2.7,m.aluminum,x,1.425,.01);box(fixed,.32,.1,.50,m.steel,x,.02,-.18);}
 box(fixed,2.4,.16,.4,m.paint,0,2.9,-.18);
 for(const x of [-.5,.5]){box(fixed,.2,.49,.38,m.paint,x,.205,-.18);box(fixed,.28,.06,.50,m.steel,x,.42,-.18);}
 v.bottom=group(joint,0,.45,0);v.top=group(joint);v.bolt=group(joint);v.bolt.name='tornillo-precargado';
 // Coupe removes the front quadrant so shank, contact and washers remain visible.
 for(const g of [v.bottom,v.top]){v[g===v.bottom?'lowerPlate':'upperPlate']=shell(g,[[.19,0],[.68,0],[.73,.03],[.73,.47],[.68,.5],[.19,.5],[.19,0]],m.aluminum,Math.PI*.05,Math.PI*1.42);}
 v.shaft=cylinder(v.bolt,.148,1,m.steel);v.thread=coil(v.bolt,m.steel,.152,.45,9);v.thread.scale.set(1,1,.999);v.head=hex(v.bolt,.255,.18,m.steel,.2);v.nut=group(joint);hex(v.nut,.255,.18,m.steel,.09);washer(v.nut,m.aluminum,-.05);v.bottomWasher=group(joint,0,.39,0);washer(v.bottomWasher,m.aluminum,0);
 v.wrench=group(v.nut,0,.11,0);const ring=lathe(v.wrench,[[.26,-.025],[.34,-.025],[.34,.025],[.26,.025],[.26,-.025]],m.copper);box(v.wrench,.14,.05,.75,m.copper,0,0,-.65);v.wrench.rotation.y=-.7;
 v.puller=group(hero);lathe(v.puller,[[0,0],[.11,0],[.14,.04],[.14,.36],[.11,.4],[0,.4]],m.steel);v.actuatorRod=rodMesh(hero,.035,m.aluminum);v.links=[-1,1].map(()=>rodMesh(hero,.022,m.steel));
 v.force=arrow(joint,[.85,1.3,0],[.85,1.85,0],0xeec18c);
 mergeByMaterial(fixed);return v;
}
export function update(v,m,p){if(v.id===270){updateShaftJoints(v,m,p);return;}if(v.id===269){updateFourBar(v,m,p);return;}if(v.id===268){updateBrake(v,m);return;}if(v.id===267){updateSpring(v,m);return;}if(v.id===266){updateRolling(v,m);return;}if(v.id===265){updateHydrodynamic(v,m,p);return;}if(v.id===264){updatePlanetary(v,m);return;}if(v.id===263){updateHelical(v,m,p);return;}if(v.id===262){updateEccentric(v,m);return;}const q=m.live,compression=q.Fc/q.kj*SCALE*AMPLIFY,gap=q.gap*SCALE*AMPLIFY,plate=.5-compression/2;
 v.lowerPlate.scale.y=plate/.5;v.upperPlate.scale.y=plate/.5;v.top.position.y=.45+plate+gap;
 const top=.45+2*plate+gap;v.nut.position.y=top+.05;v.shaft.position.y=(.25+top+.3)/2;v.shaft.scale.y=top+.3-.25;v.thread.position.y=top-.22;v.head.position.y=.28;v.wrench.rotation.y=-.7;
 v.puller.position.set(0,top+.38,0);setRod(v.actuatorRod,[0,top+.78,0],[0,2.9,0]);v.links.forEach((r,i)=>setRod(r,[(i?1:-1)*.50,top,0],[(i?1:-1)*.08,top+.38,0]));v.force.position.y=top;v.force.setLength(.25+.4*q.P/45000);
 v.joint.userData.state={compression:q.compression,gap:q.gap,plateHeight:plate,opening:gap};
}
function buildEccentric(scene,m,S){
 m.paint.color.setHex(0x376b96);const hero=group(scene),fixed=group(hero),v={id:262,hero,fixed,m,S,detail:[],assemblies:[],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:.05}};foot(fixed,m,4.8,1.8);
 for(const [i,x]of [[0,-1.25],[1,1.05]]){
  const base=group(fixed,x,0,0);box(base,.85,.16,.65,m.paint,0,.04,-.15);for(const a of [-.28,.28]){box(base,.10,1.65,.16,m.paint,a,.88,-.26);cylinder(base,.035,.05,m.copper,a,.14,-.15);}box(base,.92,.12,.32,m.paint,0,1.73,-.22);
  box(base,.86,1.10,.10,m.steel,0,1.05,-.13);const joint=group(hero,x,1.05,0);v.detail.push(joint);
  box(joint,.64,.87,.06,m.aluminum,0,0,-.04);const arm=group(joint);arm.name='brazo-excentrico';const beam=box(arm,1,.10,.16,m.aluminum,.5,0,.04);const eye=group(arm);const eyeBody=lathe(eye,[[.06,-.04],[.11,-.04],[.12,0],[.11,.04],[.06,.04],[.06,-.04]],m.steel);eyeBody.rotation.x=Math.PI/2;
  const local=[];
  if(i===1){for(const x of [-.24,.24])for(const y of [-.36,.36]){const g=group(joint,x,y,.02);const rivet=lathe(g,[[0,-.10],[.026,-.10],[.026,.015],[.043,.02],[.048,.04],[.04,.06],[0,.065]],m.copper);rivet.rotation.x=Math.PI/2;}}
  else{const material=m.copper.clone(),beads=instance(joint,new THREE.CapsuleGeometry(.016,.018,3,8),material,48,'cordones-soldados'),o=new THREE.Object3D();for(let j=0;j<48;j++){o.position.set(j<24?-.24:.24,-.36+(j%24)*.72/23,.025);o.updateMatrix();beads.setMatrixAt(j,o.matrix);}beads.instanceMatrix.needsUpdate=true;}
  for(const x of [-.24,.24])for(const y of [-.36,.36])local.push(arrow(joint,[x,y,.13],[x,y-.1,.13],i?'#e9b780':'#78ddd7'));
  const applied=arrow(joint,[.7,.55,.05],[.7,.12,.05],0xe9bc7e),loadLink=rodMesh(joint,.014,m.steel);v.assemblies.push({joint,arm,beam,eye,local,applied,loadLink});
 }mergeByMaterial(fixed);return v;
}
function updateEccentric(v,m){
 const q=m.live;v.assemblies.forEach((a,i)=>{const reach=q.e*6;a.beam.scale.x=reach;a.beam.position.x=reach/2;a.eye.position.set(reach,0,.04);a.applied.position.set(reach,.55,.05);a.applied.setLength(.35+.12*q.F/12000);setRod(a.loadLink,[reach,.08,.05],[reach,.20,.05]);
  (i?q.rivets:q.welds).forEach((f,j)=>{const x=i?f.fx:f.tx,y=i?f.fy:f.ty,dir=new THREE.Vector3(x,y,0),len=dir.length()*(i?6e-5:1e-8);a.local[j].setDirection(dir.normalize());a.local[j].setLength(len,Math.min(.08,len*.35),Math.min(.04,len*.18));});
 });
}
