import * as THREE from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {RoomEnvironment} from 'three/addons/environments/RoomEnvironment.js';
import {RoundedBoxGeometry} from 'three/addons/geometries/RoundedBoxGeometry.js';
import * as P3 from './_piezas3d.js';
import {instalaDiag} from './_diag3d.js';

export {THREE,P3};
export const fmt=(n,d=0)=>Number.isFinite(n)?Number(n).toFixed(d).replace('.',','):'—';
export const clamp=(x,a,b)=>Math.max(a,Math.min(b,x));
export function mergeByMaterial(group){
 group.updateMatrixWorld(true);const inv=group.matrixWorld.clone().invert(),map=new Map();
 group.traverse(o=>{if(!o.isMesh)return;if(o.isInstancedMesh)throw Error('No fusionar instancias');const id=o.material.uuid;if(!map.has(id))map.set(id,{material:o.material,geos:[]});map.get(id).geos.push(o.geometry.clone().applyMatrix4(o.matrixWorld).applyMatrix4(inv));o.geometry.dispose();});
 group.clear();for(const {material,geos}of map.values()){const mesh=new THREE.Mesh(P3.fusiona(geos),material);mesh.castShadow=true;mesh.receiveShadow=true;group.add(mesh);geos.forEach(g=>g.dispose());}
 return group;
}
export function box(parent,w,h,d,mat,x=0,y=0,z=0){const o=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(w,h,d)*.13),mat);o.position.set(x,y,z);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export function lathe(parent,profile,mat,pos=[0,0,0],opts={}){const o=new THREE.Mesh(P3.revolucion(profile,{seg:48,...opts}),mat);o.position.set(...pos);o.castShadow=true;o.receiveShadow=true;parent.add(o);return o;}
export function tube(parent,pts,r,mat){const curve=new THREE.CatmullRomCurve3(pts.map(p=>new THREE.Vector3(...p)),false,'centripetal');const o=new THREE.Mesh(new THREE.TubeGeometry(curve,40,r,10,false),mat);o.castShadow=true;parent.add(o);return o;}
export function studioMaterials(){return {
 aluminum:new THREE.MeshStandardMaterial({color:0x9eadb5,metalness:.9,roughness:.27}),
 steel:new THREE.MeshStandardMaterial({color:0x465d6b,metalness:.86,roughness:.28}),
 dark:new THREE.MeshStandardMaterial({color:0x182735,metalness:.68,roughness:.35}),
 rubber:new THREE.MeshStandardMaterial({color:0x121b24,roughness:.65}),
 copper:new THREE.MeshStandardMaterial({color:0xc48d50,metalness:.85,roughness:.27}),
 paint:new THREE.MeshStandardMaterial({color:0x174b56,metalness:.48,roughness:.34}),
 orange:new THREE.MeshStandardMaterial({color:0xdd6d26,metalness:.2,roughness:.4}),
 glass:new THREE.MeshPhysicalMaterial({color:0x8ed7e1,metalness:.03,roughness:.05,transmission:.55,thickness:.15,transparent:true,opacity:.5,depthWrite:false,side:THREE.DoubleSide}),
 glow:new THREE.MeshStandardMaterial({color:0x63e4cb,emissive:0x138575,emissiveIntensity:.5,metalness:.35,roughness:.25})};}

const shuffle=a=>{const b=a.slice();for(let i=b.length-1;i>0;i--){const j=Math.floor(Math.random()*(i+1));[b[i],b[j]]=[b[j],b[i]];}return b;};
const esc=s=>String(s).replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));

export function boot(cfg){
 const $=id=>document.getElementById(id),reduced=matchMedia('(prefers-reduced-motion: reduce)').matches;
 const S={values:Object.fromEntries(cfg.controls.map(c=>[c.id,c.value])),t:0,paused:reduced,mode:'explorar',view:cfg.views[0].id,solved:false,attempts:0,quizAnswer:-1,quizCorrectIndex:-1,dx:0,dxOK:false,quality:innerWidth<820||/Mobi|Android/.test(navigator.userAgent)||(navigator.hardwareConcurrency||8)<=2?'media':'alta',labels:false};
 const root=document.createElement('div');root.id='labRoot';document.body.prepend(root);
 root.innerHTML=`<header><div><b>CEN / ${esc(cfg.area||'AUTOTRÓNICA')}</b><small>Práctica ${cfg.id} · 40 min</small></div><div class="title">${esc(cfg.shortTitle)}<small>${esc(cfg.subtitle)}</small></div></header>
 <main id="stage" aria-label="Escena tridimensional"><div class="viewbar">${cfg.views.map(v=>`<button data-view="${esc(v.id)}">${esc(v.name)}</button>`).join('')}<button id="btnLabels" aria-pressed="false">Rótulos</button></div><div id="caption">${esc(cfg.caption)}</div><div id="pieceLabel" style="position:absolute;left:20px;bottom:42px;font-size:11px;color:#c5e2ec;display:none"></div></main>
 <aside><div class="eyebrow">${esc(cfg.eyebrow)}</div><h1>${esc(cfg.title)}</h1><p class="intro">${esc(cfg.intro)}</p><nav class="tabs"><button data-mode="explorar" class="on">Explorar</button><button data-mode="reto">Reto</button><button data-mode="diagnostico">Diagnóstico</button></nav>
 <div class="controls">${cfg.controls.map(c=>`<label><span>${esc(c.label)}<output id="out-${esc(c.id)}"></output></span><input id="${esc(c.id)}" type="range" min="${c.min}" max="${c.max}" step="${c.step||1}" value="${c.value}" aria-label="${esc(c.label)}"></label>`).join('')}</div>
 <section class="content show" id="explorar"><p>${esc(cfg.explore)}</p><div class="row"><button id="restart">Repetir</button>${cfg.action?`<button id="action">${esc(cfg.action.name)}</button>`:''}</div></section>
 <section class="content" id="reto"><p id="task">${esc(cfg.task)}</p><button id="validate" class="primary">Validar</button><div class="results" id="results"></div><div id="feedback" role="status"></div><button id="openQuiz" hidden>Pregunta de cierre →</button></section>
 <section class="content" id="diagnostico"><p id="symptom"></p><div id="diagnosisOptions" class="options"></div><p id="diagnosisFeedback" role="status"></p><button id="newCase">Otro caso</button></section>
 <section class="content" id="quiz"><p>${esc(cfg.quiz.question)}</p><div class="options" id="quizOptions"></div><p id="quizFeedback" role="status"></p></section>
 <div class="footer"><button id="btnAuto">Guía</button><button id="btnPause">${S.paused?'Continuar':'Pausar'}</button><button id="btnQuality">Calidad: ${S.quality}</button><button id="btnModel">Modelo</button></div></aside>
 <section class="dock" aria-label="Instrumentos"><div class="metrics">${cfg.metrics.map((m,i)=>`<div class="metric"><small>${esc(m.label)}</small><strong id="metric-${i}" class="${i===0?'accent':''}"></strong></div>`).join('')}</div><div class="chart"><div class="legend">${esc(cfg.chartLabel)}</div><canvas id="trace" aria-label="Instrumentos del modelo"></canvas></div></section>
 <section id="tour" role="dialog" aria-label="Recorrido guiado"><div class="eyebrow" id="tourCount"></div><h2 id="tourTitle"></h2><p id="tourText"></p><div class="row"><button id="tourPrev">Atrás</button><button id="tourNext" class="primary">Siguiente</button><button id="tourSkip">Saltar</button></div></section>
 <div id="model" role="dialog" aria-label="Modelo físico"><div class="modelcard"><button id="closeModel">Cerrar</button><h2>${esc(cfg.title)}</h2>${cfg.modelHTML}</div></div>`;
 // La ficha y el puente son componentes compartidos del proyecto. El módulo no los reemplaza.
 const stage=$('stage'),renderer=new THREE.WebGLRenderer({antialias:true,powerPreference:'low-power'});
 renderer.setPixelRatio(Math.min(devicePixelRatio,S.quality==='alta'?2:1.5));renderer.setClearColor(0x07111e,0);renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.1;renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.shadowMap.enabled=true;renderer.shadowMap.type=THREE.PCFSoftShadowMap;stage.appendChild(renderer.domElement);
 const scene=new THREE.Scene(),camera=new THREE.PerspectiveCamera(34,1,.01,100),controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.enablePan=false;controls.minDistance=.15;controls.maxDistance=40;
 const pm=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment();scene.environment=pm.fromScene(room,.06).texture;scene.environmentIntensity=.65;room.dispose();pm.dispose();scene.add(new THREE.HemisphereLight(0xb8ddff,0x112034,.72));
 const key=new THREE.DirectionalLight(0xffedda,3.5);key.position.set(-3,7,5);key.castShadow=true;key.shadow.mapSize.set(1536,1536);key.shadow.normalBias=.015;key.shadow.bias=-.00015;Object.assign(key.shadow.camera,{left:-8,right:8,top:8,bottom:-8,near:.1,far:30});scene.add(key);
 const rim=new THREE.DirectionalLight(0x84c8ff,2);rim.position.set(4,2,-4);scene.add(rim);
 const mats=studioMaterials(),visual=cfg.build({THREE,P3,scene,mats,S,renderer});
 const floor=new THREE.Mesh(new THREE.PlaneGeometry(50,50),new THREE.ShadowMaterial({color:0x000610,opacity:.32}));floor.rotation.x=-Math.PI/2;floor.position.y=visual.floorY??-.8;floor.receiveShadow=true;scene.add(floor);
 const getGroup=()=>visual.views[S.view]||visual.hero;
 function dims(){const b=stage.getBoundingClientRect();return {w:b.width,h:b.height};}
 function frame(){const {w,h}=dims();renderer.setSize(w,h);camera.aspect=w/h;camera.updateProjectionMatrix();scene.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(getGroup()),center=b.getCenter(new THREE.Vector3());
  const def=cfg.views.find(v=>v.id===S.view),dir=new THREE.Vector3(...(innerWidth<761?(def.mobileDir||def.dir||[.6,.6,1]):(def.dir||[.6,.6,1]))).normalize();let d=Math.max(.3,b.getSize(new THREE.Vector3()).length()*1.4);
  for(let k=0;k<10;k++){camera.position.copy(center).addScaledVector(dir,d);camera.lookAt(center);camera.updateMatrixWorld(true);const p=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])p.push(new THREE.Vector3(x,y,z).project(camera));const xs=p.map(p=>p.x),ys=p.map(p=>p.y);d*=Math.max((Math.max(...xs)-Math.min(...xs))/1.72,(Math.max(...ys)-Math.min(...ys))/1.30);}
  controls.target.copy(center);controls.update();
 }
 function view(id){S.view=id;for(const [name,g]of Object.entries(visual.views))g.visible=name===id;floor.position.y=visual.floorYs?.[id]??visual.floorY??-.8;document.querySelectorAll('[data-view]').forEach(e=>e.classList.toggle('on',e.dataset.view===id));frame();}
 function model(){return cfg.model(S.t,S.values,S);}
 function readouts(m){for(const c of cfg.controls)$('out-'+c.id).textContent=c.format?c.format(S.values[c.id]):fmt(S.values[c.id],c.decimals||0)+(c.unit?' '+c.unit:'');cfg.metrics.forEach((metric,i)=>$('metric-'+i).textContent=metric.value(m,S.values,S));}
 function graph(m){const canvas=$('trace'),r=canvas.getBoundingClientRect(),dpr=Math.min(devicePixelRatio,2);if(canvas.width!==Math.round(r.width*dpr)||canvas.height!==Math.round(r.height*dpr)){canvas.width=Math.round(r.width*dpr);canvas.height=Math.round(r.height*dpr);}const ctx=canvas.getContext('2d');ctx.setTransform(dpr,0,0,dpr,0,0);ctx.clearRect(0,0,r.width,r.height);cfg.graph(ctx,r.width,r.height,m,S.values,S);}
 let last=performance.now(),lastUI=-1;
 function loop(now){requestAnimationFrame(loop);const dt=Math.min((now-last)/1000,.1);last=now;if(!S.paused)S.t+=dt*(cfg.timeScale??1);const m=model();cfg.update(visual,m,S.values,S);controls.update();renderer.render(scene,camera);if(now-lastUI>100){lastUI=now;readouts(m);graph(m);}}
 function mode(name){S.mode=name;document.querySelectorAll('.content').forEach(e=>e.classList.toggle('show',e.id===name));document.querySelectorAll('[data-mode]').forEach(e=>e.classList.toggle('on',e.dataset.mode===name));if(name==='diagnostico')diagnosis();}
 function invalidate(){S.solved=false;S.t=0;$('results').replaceChildren();$('feedback').textContent='';$('openQuiz').hidden=true;cfg.change?.(visual,S.values,S);}
 for(const c of cfg.controls)$(c.id).oninput=e=>{S.values[c.id]=+e.target.value;invalidate();readouts(model());};
 document.querySelectorAll('[data-mode]').forEach(e=>e.onclick=()=>mode(e.dataset.mode));document.querySelectorAll('[data-view]').forEach(e=>e.onclick=()=>view(e.dataset.view));
 $('restart').onclick=()=>{S.t=0;};if(cfg.action)$('action').onclick=()=>cfg.action.run(S,visual);
 $('btnPause').onclick=()=>{S.paused=!S.paused;$('btnPause').textContent=S.paused?'Continuar':'Pausar';};$('btnQuality').onclick=()=>{S.quality=S.quality==='alta'?'media':'alta';renderer.setPixelRatio(Math.min(devicePixelRatio,S.quality==='alta'?2:1.5));$('btnQuality').textContent='Calidad: '+S.quality;frame();};
 $('btnLabels').onclick=()=>{S.labels=!S.labels;$('btnLabels').setAttribute('aria-pressed',String(S.labels));$('pieceLabel').style.display=S.labels?'block':'none';$('pieceLabel').textContent=cfg.labels||'';};
 $('btnModel').onclick=()=>$('model').classList.add('show');$('closeModel').onclick=()=>$('model').classList.remove('show');
 $('validate').onclick=()=>{S.attempts++;const r=cfg.challenge(S.values,S);S.solved=r.ok;$('results').replaceChildren(...r.checks.map(c=>{const e=document.createElement('div');e.className='result';const a=document.createElement('span'),b=document.createElement('b');a.textContent=c.name;b.className=c.ok?'good':'bad';b.textContent=(c.ok?'✓ ':'✕ ')+c.value;e.append(a,b);return e;}));$('feedback').className=r.ok?'good':'bad';$('feedback').textContent=r.ok?cfg.success:cfg.failure;$('openQuiz').hidden=!r.ok;};
 const answers=shuffle(cfg.quiz.answers);S.quizCorrectIndex=answers.findIndex(a=>a.ok);for(const [i,a]of answers.entries()){const b=document.createElement('button');b.textContent=a.text;b.onclick=()=>{if(S.quizAnswer>=0)return;S.quizAnswer=i;$('quizFeedback').className=a.ok?'good':'bad';$('quizFeedback').textContent=a.ok?cfg.quiz.explanation:'Revisa el modelo. '+cfg.quiz.explanation;$('quizOptions').querySelectorAll('button').forEach(e=>e.disabled=true);};$('quizOptions').appendChild(b);}$('openQuiz').onclick=()=>mode('quiz');
 function diagnosis(){const f=cfg.faults[S.dx];$('symptom').textContent=typeof f.symptom==='function'?f.symptom(S.values):f.symptom;$('diagnosisFeedback').textContent='';$('diagnosisOptions').replaceChildren(...shuffle(cfg.faults).map(a=>{const b=document.createElement('button');b.textContent=a.answer;b.onclick=()=>{const ok=a.id===f.id;S.dxOK=ok;$('diagnosisFeedback').className=ok?'good':'bad';$('diagnosisFeedback').textContent=ok?f.why:'Esa causa no explica todos los síntomas. Compara las observaciones.';};return b;}));}$('newCase').onclick=()=>{S.dx=(S.dx+1)%cfg.faults.length;diagnosis();};
 let ti=0;function tour(){const t=cfg.tour[ti];$('tourCount').textContent='Guía · '+(ti+1)+' / '+cfg.tour.length;$('tourTitle').textContent=t.title;$('tourText').textContent=t.text;$('tourPrev').disabled=ti===0;$('tourNext').textContent=ti===cfg.tour.length-1?'Comenzar':'Siguiente';if(t.view)view(t.view);}
 $('tourPrev').onclick=()=>{ti=Math.max(0,ti-1);tour();};$('tourNext').onclick=()=>{if(ti===cfg.tour.length-1){$('tour').hidden=true;mode('reto');}else{ti++;tour();}};$('tourSkip').onclick=()=>$('tour').hidden=true;$('btnAuto').onclick=()=>{ti=0;$('tour').hidden=false;tour();};
 function measure(){scene.updateMatrixWorld(true);camera.updateMatrixWorld(true);const b=new THREE.Box3().setFromObject(getGroup()),ys=[];for(const x of [b.min.x,b.max.x])for(const y of [b.min.y,b.max.y])for(const z of [b.min.z,b.max.z])ys.push(new THREE.Vector3(x,y,z).project(camera).y);return {vista:S.view,altoPorcentaje:(Math.max(...ys)-Math.min(...ys))*50,lienzo:dims()};}
 window.__labDebug={get mode(){return S.mode;},get solved(){return S.solved;},get quizAnswer(){return S.quizAnswer;},get quizCorrectIndex(){return S.quizCorrectIndex;},state:()=>({resuelto:S.solved,intentos:S.attempts,values:{...S.values},t:S.t,view:S.view,paused:S.paused,diagnostico:S.dxOK}),modelo:model,mideObjeto:measure,escena:()=>({llamadas:renderer.info.render.calls,tri:renderer.info.render.triangles,calidad:S.quality,pixel:renderer.getPixelRatio()})};
 instalaDiag(cfg.slug,{escena:scene,camara:camera,controles:controls,renderizador:renderer,grupos:visual.views});cfg.update(visual,model(),S.values,S);new ResizeObserver(frame).observe(stage);view(S.view);tour();readouts(model());requestAnimationFrame(loop);
 return {S,visual,renderer,scene,camera,frame,view};
}
