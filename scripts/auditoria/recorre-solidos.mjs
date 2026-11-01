// One browser process per lab and viewport while the host is memory constrained.
import {execFileSync} from 'node:child_process';
import {freemem} from 'node:os';
import {setTimeout} from 'node:timers/promises';
const sizes=['390,844,1','1366,768,1','1600,900,1','2020,1055,1.25'];
for(const size of sizes)for(let id=251;id<=260;id++){
 let attempts=0;
 while(freemem()<1536*1024**2){if(attempts++>=12)throw Error('Memoria insuficiente para abrir Chromium: se conserva la evidencia completada.');console.log('Esperando memoria para el siguiente navegador; no hay auditor activo.');await setTimeout(15000);}
 console.log(`\nLaboratorio ${id} · ${size}`);
 execFileSync(process.execPath,['scripts/auditoria/flujo-solidos-251-260.mjs','--solo',String(id),'--inspeccion','--reanudar'],{stdio:'inherit',env:{...process.env,QA_SIZE:size,QA_START:'251',QA_END:'260'}});
}
