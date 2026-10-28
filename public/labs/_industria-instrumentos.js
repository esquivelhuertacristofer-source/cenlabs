import {definitions} from './_industria-definiciones.js';
import {TAU,model} from './_industria-modelos.js';
export function drawInstrument(g,w,h,id,m,p,ready,mode='full',validated=false){
 g.clearRect(0,0,w,h);g.font='11px Outfit,system-ui';g.fillStyle='#bdd3df';if(!ready){g.fillText('Completa el ensayo para adquirir un registro.',8,26);return;}
 if(mode==='peak'||!validated){g.fillStyle='#bedee5';g.fillText(validated?'Lecturas conservadas del ensayo':'Registro del ajuste · valida para comparar curvas',10,16,w-20);definitions.find(d=>d.id===id).metrics.forEach((c,i)=>{const y=39+i*37;g.font='10px Outfit,system-ui';g.fillStyle='#9ab7c7';g.fillText(c.label,12,y,w-24);g.font='14px Outfit,system-ui';g.fillStyle='#7de7d4';const value=m[c.key]*c.scale;g.fillText((Number.isFinite(value)?value.toFixed(c.decimals).replace('.',','):'Fuera de alcance')+' '+c.unit,12,y+17,w-24);g.strokeStyle='#284252';g.beginPath();g.moveTo(12,y+23);g.lineTo(w-12,y+23);g.stroke();});return;}
 const L=48,R=w-15,T=30,B=h-28,W=R-L,H=B-T,pts=(n,f)=>Array.from({length:n+1},(_,i)=>f(i/n));
 function axes(x0,x1,y0,y1,title,xu,yu){g.fillStyle='#cce1e9';g.fillText(title,5,13);g.strokeStyle='#294555';g.beginPath();for(let i=0;i<5;i++){const y=T+i*H/4;g.moveTo(L,y);g.lineTo(R,y);}g.stroke();g.fillStyle='#95b5c3';g.fillText(yu,1,T);g.fillText(Number(y1.toPrecision(3)),1,T+15);g.fillText(Number(y0.toPrecision(3)),1,B);g.fillText(Number(x0.toPrecision(3)),L,B+17);g.fillText(Number(x1.toPrecision(3))+' '+xu,Math.max(L,R-80),B+17);return (x,y)=>[L+(x-x0)/(x1-x0)*W,B-(y-y0)/(y1-y0)*H];}
 function line(data,xy,color='#78e8d3'){g.save();g.beginPath();g.rect(L,T,W,H);g.clip();g.strokeStyle=color;g.lineWidth=1.7;g.beginPath();data.forEach(([x,y],i)=>{const q=xy(x,y);if(i)g.lineTo(...q);else g.moveTo(...q);});g.stroke();g.restore();}
 function dot(xy,x,y){g.fillStyle='#f9be79';g.beginPath();g.arc(...xy(x,y),3,0,TAU);g.fill();}

 const d=definitions.find(d=>d.id===id),c=d.controls[0],metric=d.metrics[0];
 if(id===242){const xy=axes(0,4,0,Math.max(25,m.peak*1.1),'Contacto adquirido · fuerza en el tiempo','s','N');line(m.forces.filter((_,i)=>i%10===0).map((F,i)=>[i*.01,F]),xy);line([[0,m.finalForce],[4,m.finalForce]],xy,'#f9be79');return;}
 if(id===244){const xy=axes(0,m.duration,0,1600,'Sincronización de cono · diferencia de régimen','s','rpm');line(pts(200,u=>[u*m.duration,model(id,u*m.duration*.99999,p).rpmDifference]),xy);return;}
 if(id===249){const xy=axes(-m.A*m.w,m.A*m.w,-m.peak*1.1,m.peak*1.1,'Fuerza resistente frente a velocidad · Bingham','m/s','N');line(pts(300,u=>{const q=model(id,u*.5,p);return [q.velocity,q.force];}),xy);return;}
 if(id===250){const xy=axes(0,1.25,-20,120,'Margen estático durante un ciclo de trípodes','s','mm');line(pts(240,u=>[u*1.25,model(id,u*1.25,p).margin*1000]),xy);line([[0,25],[1.25,25]],xy,'#f9be79');return;}
 if(id===247){const xy=axes(0,8,19,27,'Radio del tubo · rampa y descarga sin recuperación','s','mm');line(pts(200,u=>[u*8,model(id,u*8*.99999,p).live.radius*1000]),xy);return;}
 const data=pts(120,u=>{const x=c.min+(c.max-c.min)*u;return [x,model(id,m.phase,{...p,[c.id]:x})[metric.key]*metric.scale];}),ys=data.map(q=>q[1]).filter(Number.isFinite),lo=Math.min(0,...ys),hi=Math.max(...ys,lo+1)*1.08,xy=axes(c.min,c.max,lo,hi,'Comparación de diseño · '+metric.label,c.unit,metric.unit);line(data,xy);dot(xy,p[c.id],m[metric.key]*metric.scale);
}
