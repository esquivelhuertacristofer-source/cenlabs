// Vista de inspección del MISMO mecanismo: comparte geometrías y copia su pose.
import {THREE} from './_insignia-auto.js';
export function attachInspection(v,scene,select){const group=new THREE.Group();group.visible=false;scene.add(group);v.views.inspection=group;v.inspection={group,select,pairs:[],signature:null};}
export function syncInspection(v,p){const ins=v.inspection,signature=JSON.stringify(p);if(ins.signature!==signature){ins.group.clear();ins.pairs=[];for(const source of ins.select(v).filter(Boolean)){
 function copy(o,isRoot=false){if(o.userData.skipInspection)return null;const c=o.clone(false);ins.pairs.push({source:o,copy:c,isRoot});for(const child of o.children){const cc=copy(child);if(cc)c.add(cc);}return c;}
 const clone=copy(source,true);if(clone)ins.group.add(clone);
 }ins.signature=signature;}
 v.hero.updateMatrixWorld(true);for(const pair of ins.pairs){const {source:o,copy:c,isRoot}=pair;if(isRoot)o.matrixWorld.decompose(c.position,c.quaternion,c.scale);else{c.position.copy(o.position);c.quaternion.copy(o.quaternion);c.scale.copy(o.scale);}c.visible=o.visible;}
}
