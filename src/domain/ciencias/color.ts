/** Paleta paramétrica aproximada para visualizar luz visible, no conversión colorimétrica calibrada.
 * Fuera del visible se dibuja una guía violeta: no se afirma que el UV sea visible.
 */
export function colorLongitudDeOnda(nm:number):[number,number,number]{
 const w=Math.max(380,Math.min(780,nm));if(w<440)return [(440-w)/60,0,1];
 if(w<490)return [0,(w-440)/50,1];if(w<510)return [0,1,(510-w)/20];
 if(w<580)return [(w-510)/70,1,0];if(w<645)return [1,(645-w)/65,0];return [1,0,0];
}
