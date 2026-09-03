import { createServer } from 'node:http';
import { readFile, mkdir } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const RAIZ='c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard';
const PUB=join(RAIZ,'public');
const OUT='C:/Users/crist/AppData/Local/Temp/claude/c--Users-crist--gemini-antigravity-scratch-Proyecto-LABS/686fb186-9010-4099-80c9-f72bf4cb4265/scratchpad/shotA2';
const TIPOS={'.html':'text/html','.js':'text/javascript','.css':'text/css','.json':'application/json','.woff2':'font/woff2','.webp':'image/webp','.png':'image/png'};
const srv=createServer(async(q,r)=>{ let c=null; try{ c=await readFile(join(PUB,decodeURIComponent(q.url.split('?')[0]))); }catch{}
  if(!c){ r.writeHead(404); r.end('404'); return; }
  r.writeHead(200,{'Content-Type':TIPOS[extname(q.url)]||'application/octet-stream'}); r.end(c); });
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const BASE=`http://127.0.0.1:${srv.address().port}`;
await mkdir(OUT,{recursive:true});
const nav=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const pag=await nav.newPage({viewport:{width:1600,height:900},deviceScaleFactor:3});
await pag.goto(`${BASE}/labs/carga-alternador-balance.html`,{waitUntil:'load',timeout:90000});
await pag.waitForFunction(()=>window.__labDebug&&window.__labDebug.frames>3,null,{timeout:60000});
await pag.evaluate(()=>window.__labDebug.monta());
await pag.waitForFunction(()=>window.__labDebug.simUnlocked,null,{timeout:30000});
await pag.waitForTimeout(600);
await pag.screenshot({path:join(OUT,'03_zoom.png'),
  clip:{x:900,y:500,width:340,height:260}});
await pag.screenshot({path:join(OUT,'04_zoom_bat.png'),
  clip:{x:1080,y:560,width:300,height:230}});
await nav.close(); srv.close(); console.log('ok');
