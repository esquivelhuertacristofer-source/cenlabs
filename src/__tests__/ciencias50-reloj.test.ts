/** @jest-environment node */
import {avanzarTiempo,pasosDeFluido} from '@/domain/ciencias/reloj';
import {TunelLBM} from '@/domain/ciencias/lbm';
it('un render lento conserva el tiempo transcurrido hasta medio segundo',()=>{expect(avanzarTiempo(1,.4)).toBe(1.4);expect(avanzarTiempo(1,8)).toBe(1.5);expect(avanzarTiempo(1,-1)).toBe(1);expect(avanzarTiempo(1,NaN)).toBe(1);});
it('el fluido recibe los mismos 960 pasos en seis segundos independientemente de FPS',()=>{for(const delta of [.01,.05,.1,.25,.5]){let carry=0,steps=0,t=0;for(let i=0;i<6/delta;i++){const next=avanzarTiempo(t,delta),q=pasosDeFluido(next-t,carry);steps+=q.count;carry=q.carry;t=next;}expect(t).toBeCloseTo(6,10);expect(steps).toBe(960);}});
it('agrupar pasos LBM por fotograma no cambia su solución',()=>{const a=new TunelLBM(80),b=new TunelLBM(80);a.step(160);for(let i=0;i<4;i++)b.step(40);expect(a.steps).toBe(b.steps);expect(a.f).toEqual(b.f);});
