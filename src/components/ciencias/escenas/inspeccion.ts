import {THREE} from './kit';
export interface DatosPieza {id:string;nombre:string;descripcion:string;control:number;}
export interface PiezaEscena extends DatosPieza {objeto:THREE.Object3D;}
/** Explicit semantic parts, authored per experiment. Never inferred from colours/materials. */
export function pieza(objeto:THREE.Object3D,nombre:string,descripcion:string,control=0){objeto.userData.inspeccion={nombre,descripcion,control};return objeto;}
export function piezasDe(root:THREE.Object3D):PiezaEscena[]{const result:PiezaEscena[]=[];root.traverse(objeto=>{const data=objeto.userData.inspeccion;if(data)result.push({...data,id:'pieza-'+result.length,objeto});});return result;}
export function valorArrastrado(inicial:number,pixeles:number,c:{min:number;max:number;step:number}){const raw=inicial+pixeles/220*(c.max-c.min),quantized=c.min+Math.round((raw-c.min)/c.step)*c.step;return Number(Math.max(c.min,Math.min(c.max,quantized)).toFixed(8));}
