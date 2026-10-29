import {TunelLBM} from '../../src/domain/ciencias/lbm.ts';
import {mkdir,writeFile} from 'node:fs/promises';
const out=new URL('../../public/labs-data/ciencias/fluidos/',import.meta.url);await mkdir(out,{recursive:true});
for(const Re of [10,40,80,120]){const sim=new TunelLBM(Re);sim.step(30000);await writeFile(new URL('re-'+Re+'.bin',out),Buffer.from(sim.f.buffer));console.log('Campo D2Q9 preparado: Re='+Re+'; 30000 pasos.');}
await writeFile(new URL('modelo.json',out),JSON.stringify({method:'D2Q9-BGK',width:128,height:64,diameter:12,U:.045,reynolds:[10,40,80,120],steps:30000,format:'Float64 little-endian, direction-major, nine populations',purpose:'Condición inicial para un solver vivo; tras cambiar Re se integran las nuevas condiciones, no se reproduce una animación.'},null,2));
