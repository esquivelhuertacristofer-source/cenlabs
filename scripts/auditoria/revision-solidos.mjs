import {createHash} from 'node:crypto';
import {readFile} from 'node:fs/promises';
import {definitions} from '../../public/labs/_solidos-definiciones.js';
const modules=['_solidos-runtime.js','_solidos-modelos.js','_solidos-definiciones.js','_solidos-escenas.js','_solidos-instrumentos.js','_industria-runtime.js','_mecanismos-runtime.js','_insignia-auto.js','_insignia-auto.css','_piezas3d.js','_proceso-piezas.js','_inspeccion-mecanismos.js'];
export async function revisionSolidos(){
 const hash=createHash('sha256');
 for(const name of [...modules,...definitions.flatMap(d=>[d.slug+'.html','_ficha-'+d.slug+'.js'])])hash.update(await readFile(new URL('../../public/labs/'+name,import.meta.url)));
 for(const name of ['flujo-solidos-251-260.mjs','revision-solidos.mjs'])hash.update(await readFile(new URL(name,import.meta.url)));
 return hash.digest('hex');
}
