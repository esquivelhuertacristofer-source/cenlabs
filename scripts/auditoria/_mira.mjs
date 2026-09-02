import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const PUB = 'public';
const T={'.html':'text/html;charset=utf-8','.js':'text/javascript;charset=utf-8','.css':'text/css','.png':'image/png','.webp':'image/webp','.woff2':'font/woff2','.json':'application/json'};
const srv=createServer(async(q,r)=>{try{const b=await readFile(join(PUB,decodeURIComponent(q.url.split('?')[0])));r.writeHead(200,{'Content-Type':T[extname(q.url)]??'application/octet-stream'});r.end(b);}catch{r.writeHead(404);r.end('404');}});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const base=`http://127.0.0.1:${srv.address().port}`;
const b=await chromium.launch({args:['--use-angle=swiftshader']});
const p=await b.newPage({viewport:{width:1280,height:800}});
const errs=[];
p.on('pageerror',e=>errs.push('PAGEERROR '+e.message.slice(0,300)));
p.on('console',m=>{if(m.type()==='error')errs.push('CONSOLE '+m.text().slice(0,300));if(m.type()==='warning')errs.push('WARN '+m.text().slice(0,160));});
await p.goto(`${base}/labs/${process.argv[2]}`,{waitUntil:'domcontentloaded',timeout:120000});
await p.waitForTimeout(Number(process.argv[3]??12000));
await p.screenshot({path:'/tmp/mira.png'});
const info=await p.evaluate(()=>{
  const c=document.querySelector('canvas');
  return {canvas:c?{w:c.width,h:c.height,cw:c.clientWidth,ch:c.clientHeight,estilo:c.getAttribute('style')}:null,
    debug: typeof window.__labDebug==='object'? Object.keys(window.__labDebug):null,
    modo: (()=>{try{return window.__labDebug&&window.__labDebug.mode&&window.__labDebug.mode();}catch(e){return 'ERR '+e.message}})(),
    hud: (document.querySelector('#hud')||{}).textContent?.slice(0,120)};
});
console.log(JSON.stringify(info,null,1));
console.log('--- errores ---'); for(const e of [...new Set(errs)].slice(0,12)) console.log(' ',e);
await b.close(); srv.close();
