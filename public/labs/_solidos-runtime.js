import {launch as launchWorkOrder} from './_industria-runtime.js';
import {definitions} from './_solidos-definiciones.js';
import {model,criteria,defaults} from './_solidos-modelos.js';
import {build,update} from './_solidos-escenas.js';
import {drawInstrument} from './_solidos-instrumentos.js';
import {THREE} from './_insignia-auto.js';
export function launch(id){
 const app=launchWorkOrder(id,{definitions,model,criteria,defaults,build,update,drawInstrument});
 if(id===252){app.S.t=4;update(app.visual,model(id,4,app.S.values),app.S.values);app.frame();}
 const d=definitions.find(q=>q.id===id),surface=app.renderer.domElement,ray=new THREE.Raycaster(),pointer=new THREE.Vector2();let drag=null;
 const targets={251:['viga-con-fibras','height'],252:['probeta-reloj','stress'],253:['columna-imperfecta','diameter'],254:['corte-orientable','angle'],255:['eje-macizo','diameter'],256:['filete-hombro','radius'],257:['eje-macizo','diameter'],258:['pared-seccionada','thickness'],259:['barra-regulable','height'],260:['placa-agrietada','crack']};
 const [name,parameter]=targets[id],c=d.controls.find(c=>c.id===parameter);
 if(id===254)app.visual.cut.name=name;if(id===259)app.visual.bars.forEach(q=>q.name=name);
 if(id===260)app.visual.plate.name=name;
 function hit(e){const r=surface.getBoundingClientRect();pointer.set((e.clientX-r.left)/r.width*2-1,1-(e.clientY-r.top)/r.height*2);ray.setFromCamera(pointer,app.camera);const root=app.visual.views[app.S.view];return ray.intersectObject(root,true).some(q=>{for(let o=q.object;o&&o!==root;o=o.parent)if(o.name===name)return true;return false;});}
 surface.addEventListener('pointerdown',e=>{if(e.button!==0||!hit(e))return;drag={id:e.pointerId,y:e.clientY,value:app.S.values[c.id],height:surface.getBoundingClientRect().height};surface.setPointerCapture(e.pointerId);surface.style.cursor='ns-resize';e.preventDefault();e.stopImmediatePropagation();},true);
 surface.addEventListener('pointermove',e=>{if(!drag){surface.style.cursor=hit(e)?'ns-resize':'';return;}if(e.pointerId!==drag.id)return;const raw=drag.value+(drag.y-e.clientY)/drag.height*(c.max-c.min)*1.5,value=Math.max(c.min,Math.min(c.max,c.min+Math.round((raw-c.min)/c.step)*c.step)),input=document.getElementById(c.id);input.value=String(Number(value.toFixed(8)));input.dispatchEvent(new Event('input',{bubbles:true}));e.preventDefault();e.stopImmediatePropagation();},true);
 function end(e){if(!drag||e.pointerId!==drag.id)return;drag=null;if(surface.hasPointerCapture(e.pointerId))surface.releasePointerCapture(e.pointerId);surface.style.cursor='';app.frame();e.stopImmediatePropagation();}
 surface.addEventListener('pointerup',end,true);surface.addEventListener('pointercancel',end,true);
 const hint=document.createElement('p');hint.textContent='Arrastra la pieza hacia arriba o abajo para cambiar '+c.label.toLowerCase()+'.';hint.style.cssText='font-size:11px;color:#91b8c4';document.getElementById('explorar').prepend(hint);
 window.__labDebug.arrastre=()=>{app.scene.updateMatrixWorld(true);let target;app.visual.views[app.S.view].traverse(o=>{if(!target&&o.name===name)target=o;});if(!target)return null;const center=new THREE.Box3().setFromObject(target).getCenter(new THREE.Vector3()).project(app.camera),r=surface.getBoundingClientRect();return {x:r.left+(center.x+1)*r.width/2,y:r.top+(1-center.y)*r.height/2,parameter:c.id,value:app.S.values[c.id]};};
 if(id===254)window.__labDebug.tracciones=()=>{app.scene.updateMatrixWorld(true);const vector=q=>{const tip=q.children[1],length=q.visible?tip.position.y+tip.scale.y/2:0;return new THREE.Vector3(0,1,0).applyQuaternion(q.getWorldQuaternion(new THREE.Quaternion())).multiplyScalar(length);};return app.visual.arrows.map(q=>({side:q.side,resultante:vector(q.normal).add(vector(q.shear)).toArray()}));};
 if(id===258)window.__labDebug.pared=()=>{const lathe=app.visual.wall.children[0].children.find(o=>o.isMesh),position=lathe.geometry.attributes.position,radii=Array.from({length:position.count},(_,i)=>Math.hypot(position.getX(i),position.getZ(i)));return {inner:Math.min(...radii),outer:Math.max(...radii)};};
 if(id===252)window.__labDebug.extensometro=()=>{app.scene.updateMatrixWorld(true);const v=app.visual,position=v.sample.geometry.attributes.position,rest=v.sample.userData.rest,point=target=>{let index=0;for(let i=1;i<position.count;i++)if(Math.abs(rest[i*3+1]-target)<Math.abs(rest[index*3+1]-target))index=i;return new THREE.Vector3().fromBufferAttribute(position,index).applyMatrix4(v.sample.matrixWorld).y;};return {jaws:v.jaws[1].getWorldPosition(new THREE.Vector3()).y-v.jaws[0].getWorldPosition(new THREE.Vector3()).y,specimen:point(.86)-point(.36)};};
 return app;
}
