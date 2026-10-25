import {boot,fmt} from './_insignia-auto.js';
import {definitions} from './_mecanismos-definiciones.js';
import {model,criteria,defaults} from './_mecanismos-modelos.js';
import {buildMechanism,updateMechanism} from './_mecanismos-escenas.js';
export function launch(id,bundle={}){
 const defs=bundle.definitions||definitions,compute=bundle.model||model,judge=bundle.criteria||criteria,initial=bundle.defaults||defaults,build=bundle.build||buildMechanism,update=bundle.update||updateMechanism;
 const d=defs.find(d=>d.id===id);if(!d)throw Error('Práctica desconocida');let history=[];
 const cfg={...d,slug:d.slug,shortTitle:d.title,subtitle:'Diseña · observa · comprueba',area:d.area||'AUTOTRÓNICA',views:d.views||[{id:'assembly',name:'Mecanismo',dir:id===174?[.3,.25,1.5]:[.8,.7,1.3],mobileDir:id===174?[.2,.25,1.5]:[.6,.6,1.5]}],
  controls:d.controls.map(c=>({...c,value:initial[id][c.id]})),
  metrics:d.metrics.map(c=>({label:c.label,value:m=>Number.isFinite(m[c.key])?fmt(m[c.key]*c.scale,c.decimals)+' '+c.unit:(c.empty||'Fuera de alcance')})),
  model:(t,p)=>{const m=compute(id,t,p);m.t=t;if(id===169){m.toolY=m.center[1];m.joint0=m.arms[0]?.q;}if(id===170)m.leg0=m.legs[0].length;if(id===171)m.travel=m.tau*p.speed/1000;if(id===174){m.motorDeg=m.theta%(2*Math.PI)*180/Math.PI;m.ground=.20;}return m;},
  challenge:p=>{const r=judge(id,p);return {ok:r.ok,checks:r.checks.map(c=>({...c,value:Number.isFinite(c.value)?fmt(c.value,Math.abs(c.value)<1?3:1)+' '+c.unit:'Fuera de alcance'}))};},
  success:'El diseño cumple todos los criterios. Explica la causa y responde la pregunta de cierre.',failure:'Hay criterios pendientes. Compara lo que gana y lo que pierde el mecanismo al cambiar cada ajuste.',
  quiz:{question:d.quiz,answers:d.answers.map((text,i)=>({text,ok:i===0})),explanation:d.answers[0]},
  faults:d.faults.map(([answer,symptom,why],i)=>({id:String(i),answer,symptom,why})),
  labels:d.labels||({167:'Generador de onda · copa flexible · corona fija · brida de salida',168:'Motor · husillo · tuerca · guías · carro',169:'Base · tres motores · brazos · tirantes · plataforma · ventosa',170:'Base · cilindros · vástagos · rótulas · plataforma',171:'Cámara · iluminación · cinta · piezas · expulsor',172:'Rueda · eje · apoyos · planos de corrección',173:'Masa primaria · masa secundaria · resortes · rodamiento',174:'Motor · manivela · biela · balancín · escobilla',175:'Aro · eje · motor-generador · apoyos · envolvente',176:'Disco conductor · bobinas · polos · eje · apoyos'})[id],
  modelHTML:`<p>${d.equations}</p><p>${d.limits}</p><p>Traza DOM: ${d.signals}. Las dos señales comparten el reloj del mecanismo; se ajusta automáticamente la escala vertical para que se lean. El recorrido se reinicia al cambiar un control.</p><p>Fuente del principio: <a href="${d.source}" target="_blank" rel="noopener">${d.sourceName}</a>. Parámetros y límites numéricos de este escenario son didácticos, salvo las constantes físicas indicadas.</p>`,
  chartLabel:'Traza: '+d.signals+' · últimas lecturas',
  graph(ctx,w,h,m){if(bundle.graph){bundle.graph(ctx,w,h,m);return;}if(history.length&&m.t<history.at(-1).t)history=[];if(!history.length||m.t!==history.at(-1).t)history.push({t:m.t,a:m.signal,b:m.reference});if(history.length>120)history.shift();const finite=history.flatMap(x=>[x.a,x.b]).filter(Number.isFinite),scale=Math.max(.05,...finite.map(Math.abs));ctx.strokeStyle='#2b4356';ctx.beginPath();ctx.moveTo(0,h/2);ctx.lineTo(w,h/2);ctx.stroke();for(const [key,color]of [['a','#74e8da'],['b','#ffce86']]){ctx.strokeStyle=color;ctx.lineWidth=1.8;ctx.beginPath();history.forEach((p,i)=>{const x=i/119*w,y=h/2-p[key]/scale*(h*.43);if(!Number.isFinite(y))return;if(i===0)ctx.moveTo(x,y);else ctx.lineTo(x,y);});ctx.stroke();}},
  build(context){const v=build(id,context);const notice=document.createElement('div');notice.setAttribute('role','status');notice.style.cssText='position:absolute;left:20px;top:60px;max-width:240px;color:#ffd297;background:#382b20dd;padding:8px;border-radius:8px;font-size:11px;pointer-events:none';notice.hidden=true;document.getElementById('stage').append(notice);v.notice=notice;return v;},
  update(v,m,p){update(v,m,p);const invalid=m.valid===false,deltaLimit=id===169&&m.valid&&m.arms.some(a=>a.q< -1.35||a.q>.25);v.notice.hidden=!invalid&&!deltaLimit&&!m.warning;v.notice.textContent=m.warning|| (invalid?'Objetivo imposible: se conserva la última postura alcanzable. Cambia las dimensiones.':deltaLimit?'Geometría alcanzable, pero fuera de los topes de motor del reto.':'');},
  change(v,values,state){history=[];cfg.update(v,cfg.model(state.t,values,state),values,state);app.frame();}
 };
 const css=document.createElement('style');css.textContent='@media(min-width:761px){#tour{bottom:224px}}@media(max-width:760px){.dock{width:178px}.metrics{grid-template-columns:repeat(2,minmax(0,1fr))}.metric{min-width:0}.metric strong{font-size:14px;letter-spacing:-.02em}#tour{position:fixed;bottom:47px;left:18px;right:18px;width:auto}}';document.head.append(css);
 const app=boot(cfg);window.__labDebug.criterios=()=>judge(id,app.S.values);window.__labDebug.id=id;return app;
}
