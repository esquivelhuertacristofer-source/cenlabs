import {esCienciaNueva} from './sesion';
/** El quiz cuenta aciertos; los reportes académicos guardan una nota sobre diez. */
export function calificacionGuardada(id:string,aciertos:number,total:number){
 if(!esCienciaNueva(id))return aciertos;
 if(!Number.isFinite(aciertos)||!Number.isInteger(total)||total<=0)return 0;
 return Math.round(Math.min(total,Math.max(0,aciertos))/total*1000)/100;
}
