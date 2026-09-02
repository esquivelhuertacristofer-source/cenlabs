import { createServer } from 'node:http';
import { readFile } from 'node:fs/promises';
import { join, extname } from 'node:path';
import { chromium } from 'playwright';
const PUB='c:/Users/crist/.gemini/antigravity/scratch/Proyecto LABS/cen-dashboard/public';
const srv=createServer(async(q,r)=>{let c=null;try{c=await readFile(join(PUB,decodeURIComponent(q.url.split('?')[0])));}catch{c=null;}
 if(!c){r.writeHead(404);r.end('404');return;} r.writeHead(200,{'Content-Type':{'.html':'text/html','.js':'text/javascript','.css':'text/css'}[extname(q.url)]||'application/octet-stream'});r.end(c);});
await new Promise(r=>srv.listen(0,'127.0.0.1',r));
const B=`http://127.0.0.1:${srv.address().port}`;
const nav=await chromium.launch({args:['--use-gl=swiftshader','--enable-unsafe-swiftshader']});
const p=await nav.newPage({viewport:{width:1600,height:900}});
await p.goto(`${B}/labs/${process.argv[2]}.html`,{waitUntil:'load',timeout:90000});
await p.waitForFunction(()=>window.__labDebug&&window.__labDebug.frames>3,null,{timeout:90000});
await p.waitForTimeout(1200);
await p.screenshot({path:process.argv[3]});
await nav.close();srv.close();
