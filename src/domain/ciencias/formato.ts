/** Cifras significativas sin separadores ambiguos al copiar una lectura. */
export function numeroCiencia(x:number,d=3){
 if(!Number.isFinite(x))return 'Fuera de alcance';
 if(x===0)return '0';
 const digits=Math.max(1,Math.min(12,Math.floor(d))),rounded=Number(x.toPrecision(digits)),a=Math.abs(rounded);
 return a<1e-4||a>=1e7?rounded.toExponential(digits-1):rounded.toLocaleString('es-MX',{maximumSignificantDigits:digits,useGrouping:false});
}
