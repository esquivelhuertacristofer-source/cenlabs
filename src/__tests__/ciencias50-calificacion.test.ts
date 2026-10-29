import {calificacionGuardada} from '@/domain/ciencias/calificacion';
it.each(['fisica-11','quimica-14','matematicas-12','biologia-20'])('%s guarda un cuestionario perfecto como10/10',id=>{
 expect(calificacionGuardada(id,3,3)).toBe(10);
});
it('conserva la proporción de aciertos en una nota sobre diez',()=>{
 expect(calificacionGuardada('biologia-20',0,3)).toBe(0);
 expect(calificacionGuardada('biologia-20',1,3)).toBe(3.33);
 expect(calificacionGuardada('biologia-20',2,3)).toBe(6.67);
});
it('mantiene los contratos de las prácticas anteriores y de mecánica',()=>{
 expect(calificacionGuardada('fisica-1',7,7)).toBe(7);
 expect(calificacionGuardada('quimica-10',6,7)).toBe(6);
 expect(calificacionGuardada('mecanica-250',100,3)).toBe(100);
});
it('evita notas no finitas o fuera de escala en las nuevas ciencias',()=>{
 expect(calificacionGuardada('biologia-20',1,0)).toBe(0);
 expect(calificacionGuardada('biologia-20',NaN,3)).toBe(0);
 expect(calificacionGuardada('biologia-20',4,3)).toBe(10);
 expect(calificacionGuardada('biologia-20',-1,3)).toBe(0);
});
