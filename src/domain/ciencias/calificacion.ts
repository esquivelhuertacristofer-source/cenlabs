import {esCienciaNueva} from './sesion';
/** El quiz cuenta aciertos; la columna académica guarda una nota entera sobre diez. */
export function calificacionGuardada(id:string,aciertos:number,total:number){
 if(!esCienciaNueva(id))return aciertos;
 if(!Number.isFinite(aciertos)||!Number.isInteger(total)||total<=0)return 0;
 return Math.round(Math.min(total,Math.max(0,aciertos))/total*10);
}
