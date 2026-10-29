import {numeroCiencia} from '@/domain/ciencias/formato';
import {interferencia} from '@/domain/ciencias/ondas';
it('conserva concentraciones traza en lugar de mostrarlas como cero',()=>{
 for(const x of [2.2e-8,2.2e-14,5.701652693e-6,1.698339e-221]){const text=numeroCiencia(x,6);expect(Number(text)).not.toBe(0);expect(Math.abs(Number(text)/x-1)).toBeLessThan(1e-5);}
});
it('permite copiar lecturas al cálculo sin separadores de millares',()=>{
 for(const x of [1738.3,12000,1.5e9,-12345,.003141592]){const text=numeroCiencia(x,6);expect(text).not.toContain(',');expect(Math.abs(Number(text)/x-1)).toBeLessThan(1e-5);}
});
it('distingue un cero del modelo de una lectura fuera de alcance',()=>{
 expect(numeroCiencia(0)).toBe('0');expect(numeroCiencia(Infinity)).toBe('Fuera de alcance');expect(numeroCiencia(NaN)).toBe('Fuera de alcance');
 expect(interferencia({wavelength:550,slits:.3},3).values.position).toBe(0);
});
