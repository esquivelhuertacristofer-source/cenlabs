export type Parametros=Record<string,number>;
export interface Control {key:string;label:string;min:number;max:number;step:number;unit:string;initial:number;}
export interface Magnitud {key:string;label:string;unit:string;digits?:number;scale?:number;}
export interface Resultado {answer:number;values:Record<string,number>;valid?:boolean;warning?:string;}
export interface PracticaCiencia {
 id:string;title:string;intro:string;mission:string;formula:string;limits:string;scale:string;
 controls:Control[];readings:Magnitud[];answerLabel:string;answerUnit:string;tolerance:number;absoluteTolerance?:number;
 source:{name:string;url:string}[];concepts:{title:string;description:string}[];
 quiz?:{pregunta:string;opciones:string[];respuestaCorrecta:number;explicacion:string}[];
 previewTime?:number;previewPaused?:boolean;sampleEvery?:number;plotKey?:string;plotX?:string;
 model:(p:Parametros,t:number)=>Resultado;
}
