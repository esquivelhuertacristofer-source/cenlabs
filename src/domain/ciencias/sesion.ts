/** Registro transitorio del juez de cada Piloto nativo. Nunca se persiste un veredicto. */
type Veredicto={ok:boolean;mensaje?:string};
const jueces=new Map<string,{juez:()=>Veredicto;reset?:()=>void}>();
export function esCienciaNueva(id:string){const [area,num]=id.split('-'),n=Number(num);return n>=11&&n<=({fisica:24,quimica:24,matematicas:22,biologia:20}[area]??0);}
export function registrarJuezCiencia(id:string,juez:()=>Veredicto,reset?:()=>void){const entry={juez,reset};jueces.set(id,entry);return ()=>{if(jueces.get(id)===entry)jueces.delete(id);};}
export function reiniciarJuezCiencia(id:string){jueces.delete(id);}
export function reiniciarExperimentosCiencia(){jueces.forEach(entry=>entry.reset?.());}
export function validarCiencia(id:string):Veredicto{return jueces.get(id)?.juez()??{ok:false,mensaje:'Prepara el experimento y espera a que cargue el laboratorio.'};}
