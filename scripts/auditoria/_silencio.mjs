import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const PUB='public';
const srv=createServer(async(q,r)=>{const ruta=decodeURIComponent(q.url.split('?')[0]);
 if(ruta==='/'){r.writeHead(200,{'Content-Type':'text/html;charset=utf-8'});r.end('<!doctype html><meta charset=utf-8><title>s</title><body>');return;}
 let b=null;try{b=await readFile(join(PUB,ruta));}catch{}
 if(!b){r.writeHead(404);r.end('x');return;} r.writeHead(200,{'Content-Type':extname(ruta)==='.mp3'?'audio/mpeg':'text/plain'});r.end(b);});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${srv.address().port}`;
const nav=await chromium.launch(); const p=await nav.newPage();
await p.goto(base+'/',{waitUntil:'domcontentloaded'});
import { readdirSync } from 'node:fs';
const LABS=['mecanica-120','mecanica-60','mecanica-3','quimica-1','biologia-5','matematicas-7','fisica-2','mecanica-93'];
const pares=[];
for(const l of LABS){ const fs2=readdirSync(join(PUB,'assets','voz',l)).filter(n=>n.endsWith('.mp3'));
  for(const n of fs2.slice(0,10)) pares.push([l,n.replace('.mp3','')]); }
const claves=pares;
const r=await p.evaluate(async ({base,claves})=>{
  const ctx=new AudioContext();
  const out=[];
  for(const [lab,k] of claves){
    try{
      const buf=await (await fetch(`${base}/assets/voz/${lab}/${k}.mp3`)).arrayBuffer();
      const a=await ctx.decodeAudioData(buf);
      const d=a.getChannelData(0); const n=d.length; const sr=a.sampleRate;
      const umbral=0.008;
      let i=0; while(i<n && Math.abs(d[i])<umbral) i++;
      let j=n-1; while(j>0 && Math.abs(d[j])<umbral) j--;
      out.push({k:lab+'/'+k, total:+(n/sr).toFixed(3), ini:+(i/sr).toFixed(3), fin:+((n-1-j)/sr).toFixed(3)});
    }catch(e){ out.push({k:lab+'/'+k, err:String(e).slice(0,60)}); }
  }
  return out;
},{base,claves});
for(const x of r) console.log(x.err? `${x.k} ERR ${x.err}` :
  `${x.k.padEnd(18)} total ${String(x.total).padStart(7)} s   silencio inicio ${String(x.ini).padStart(6)}  final ${String(x.fin).padStart(6)}`);
const val=r.filter(x=>!x.err);
console.log('\nmedia silencio inicio', (val.reduce((a,b)=>a+b.ini,0)/val.length).toFixed(3),
            's · final', (val.reduce((a,b)=>a+b.fin,0)/val.length).toFixed(3),'s');
await nav.close(); srv.close();
