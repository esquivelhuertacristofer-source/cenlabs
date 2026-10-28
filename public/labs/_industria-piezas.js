import {THREE,group,foot,mergeByMaterial} from './_proceso-piezas.js';
export * from './_proceso-piezas.js';
export function base(id,scene,m,S){m.paint.color.setHex([0x2b9295,0x5277a3,0x357f9d,0x399083,0xd39837,0x527ba3,0x798b75,0x398d9b,0xa86c43,0x3e7f9e][id-241]);const hero=group(scene),fixed=group(hero);hero.name=`equipo-${id}`;foot(fixed,m,id===250?3.6:3.25,id===250?2.8:1.8);return {id,hero,fixed,m,S,detail:[],views:{assembly:hero},floorY:-.29,floorYs:{assembly:-.29,inspection:0}};}
export function finish(v){mergeByMaterial(v.fixed);for(const [i,o]of v.detail.entries())o.name ||= 'pieza-'+v.id+'-'+i;return v;}
export function replaceGeometry(mesh,geometry){mesh.geometry.dispose();mesh.geometry=geometry;}
export function sphere(g,r,m,x=0,y=0,z=0){const q=new THREE.Mesh(new THREE.SphereGeometry(r,16,10),m);q.position.set(x,y,z);q.castShadow=true;g.add(q);return q;}
