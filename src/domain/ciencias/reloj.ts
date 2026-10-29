/** Analytic models accept variable render intervals; the fluid still integrates fixed lattice steps. */
export function avanzarTiempo(t:number,delta:number){return t+Math.min(.5,Math.max(0,Number.isFinite(delta)?delta:0));}
export function pasosDeFluido(delta:number,carry:number){const total=carry+Math.max(0,delta)*160,count=Math.floor(total+1e-9);return {count,carry:Math.max(0,total-count)};}
