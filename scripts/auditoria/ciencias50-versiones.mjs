/** Report revisions are per lab: untouched geometry keeps its verified revision. */
export const refinados7=new Set(['biologia-15','biologia-18','fisica-12','fisica-18','fisica-20','fisica-23','fisica-15','fisica-17','fisica-21','matematicas-11','matematicas-17','matematicas-19','quimica-12','quimica-19','quimica-24']);
export const revisionExploracion=id=>id==='fisica-15'?10:id==='matematicas-12'?9:id==='fisica-12'?8:refinados7.has(id)?7:6;
// Q14: el error absoluto no debe ampliar el 3 % en pérdidas de espesor pequeñas.
export const revisionNativa=id=>id==='quimica-14'?209:200+revisionExploracion(id);
