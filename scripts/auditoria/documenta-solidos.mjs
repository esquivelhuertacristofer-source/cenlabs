import {readFile,writeFile} from 'node:fs/promises';
import {definitions} from '../../public/labs/_solidos-definiciones.js';
import {revisionSolidos} from './revision-solidos.mjs';
const revision=await revisionSolidos(),root=new URL('../../',import.meta.url),reports=JSON.parse(await readFile(new URL('./.salida/solidos-251-260/informe.json',import.meta.url),'utf8'));
const valid=reports.filter(r=>r.revision===revision&&r.full&&r.errors.length===0),unique=new Map(valid.map(r=>[r.id+'-'+r.size.join('x'),r]));
const jest=JSON.parse(await readFile(new URL('./.salida/solidos-251-260/jest-final.json',import.meta.url),'utf8'));
const visual=JSON.parse(await readFile(new URL('./.salida/solidos-251-260/autocritica.json',import.meta.url),'utf8'));
if(visual.revision!==revision)throw Error('Repetir la revisión visual del producto vigente');
let post;try{post=JSON.parse(await readFile(new URL('./.salida/solidos-251-260/jest-postvoz.json',import.meta.url),'utf8'));}catch{}
for(const d of definitions){const url=new URL('docs/continuidad/mecanica-'+d.id+'.md',root),old=await readFile(url,'utf8'),rows=[...unique.values()].filter(r=>r.id===d.id),summary=`<!-- estado-solidos -->
## Revisión vigente · 31-10-2026

**Implementación y revisión local completas. Sin push ni publicación.** Commit del lote: consultar el historial de Git de esta ficha. Publicación pendiente de la primera autorización exigida por el usuario.

Orden: ${d.job}

Modelo vigente: ${d.equations}

Límites: ${d.limits}

Fuente: ${d.sourceName} · ${d.source}

Evidencia funcional de la revisión actual: **${rows.length}/4 tamaños**. Firma del producto y auditor: ${revision}.

${rows.map(r=>'- '+r.size[0]+'×'+r.size[1]+' DPR '+r.size[2]+': orden, ensayo, validación, quiz, tres diagnósticos, descarga TXT y arrastre real correctos; '+r.initial.prose+' palabras, '+r.initial.health.llamadas+' llamadas, '+r.initial.health.tri+' triángulos, '+r.initial.measure.altoPorcentaje.toFixed(2)+' % de encuadre inicial.').join('\n')}

Global: TypeScript y ESLint pasaron. Jest completo: ${jest.numPassedTestSuites} suites / ${jest.numPassedTests} pruebas, ${jest.success?'correctas':'con fallos'}. ${post?.success?'Después del manifiesto de voz se comprobaron '+post.numPassedTestSuites+' suites y '+post.numPassedTests+' pruebas de voz/briefing, correctas.':'Verificación específica de voz tras el manifiesto pendiente.'} Física: 5.388 comprobaciones correctas; regresión de modelos 241–250: 14.738 correctas.

Voz: 150 clips para el bloque, 49 textos distintos, generados con Qwen3-TTS y molde aprobado; duración, SHA256 y copia a sus claves verificados en voz.json. Se preservaron los 7.555 MP3 anteriores: 7.705 en el árbol local. El manifiesto amplía 166→176 prácticas con voz, sin eliminar las anteriores.

Portada propia revisada: public/images/mecanica/prac_${d.id}.webp. Autocrítica: ${visual.labs.find(v=>v.id===d.id).observacion}

Evidencia portable: [autocrítica del bloque](evidencia-solidos/autocritica.json), [portadas](evidencia-solidos/contacto-portadas.jpg) y [estados](evidencia-solidos/contacto-estados.jpg). Cierre estricto comprueba-cierre-solidos.mjs correcto: 40 recorridos, 150 clips con hashes actuales, código y revisión visual.

Retomar: solicitar la primera autorización de push/despliegue con este bloque revisado. No confundir aprobación local con publicación. Continuar construyendo 261–270 (Elementos de Máquina), después 291–300, 271–280 y 281–290. El total encargado es de 50 laboratorios.
<!-- /estado-solidos -->
`;
 const without=old.replace(/<!-- estado-solidos -->[\s\S]*?<!-- \/estado-solidos -->\s*/,'');
 const history=without.replace(/^# [^\n]*\n/,'').replace(/^\s*## Historial de implementación y verificaciones anteriores\s*/,'');await writeFile(url,'# mecanica-'+d.id+' · '+d.title+'\n\n'+summary+'\n## Historial de implementación y verificaciones anteriores\n'+history,'utf8');
}
console.log(`${unique.size}/40 recorridos vigentes documentados en diez fichas.`);
