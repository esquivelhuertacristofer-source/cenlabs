'use client';
import {create} from 'zustand';
import type {Parametros,Resultado} from '@/domain/ciencias/tipos';
export interface Registro {signature:string;parameters:Parametros;date:string;duration:number;sample:Resultado;points:{t:number;values:Record<string,number>}[];}
interface Estado {id:string;p:Parametros;answer:string;accepted:boolean;running:boolean;record:Registro|null;history:Registro[];message:string;init:(id:string,p:Parametros)=>void;change:(key:string,value:number)=>void;respond:(value:string)=>void;}
export const firma=(p:Parametros)=>JSON.stringify(p);
export const useCienciaStore=create<Estado>((set)=>({id:'',p:{},answer:'',accepted:false,running:false,record:null,history:[],message:'',init:(id,p)=>set({id,p,answer:'',accepted:false,running:false,record:null,history:[],message:''}),change:(key,value)=>set(s=>({p:{...s.p,[key]:value},accepted:false,running:false,record:null,message:'Ajuste cambiado: adquiere un registro nuevo.'})),respond:answer=>set({answer,accepted:false})}));
