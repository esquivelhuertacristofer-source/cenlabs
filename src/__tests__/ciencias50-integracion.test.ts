import {esCienciaNueva,registrarJuezCiencia,reiniciarJuezCiencia,validarCiencia} from '@/domain/ciencias/sesion';
import {useSimuladorStore} from '@/store/simuladorStore';
import {useCienciaStore,firma,type Registro} from '@/components/ciencias/estado';
const IDS=Object.entries({fisica:24,quimica:24,matematicas:22,biologia:20}).flatMap(([area,max])=>Array.from({length:max-10},(_,i)=>`${area}-${i+11}`));
afterEach(()=>IDS.forEach(reiniciarJuezCiencia));
describe('puente de las 50 ciencias nativas',()=>{
 it.each(IDS)('%s no aprueba antes de montar un juez',id=>{expect(esCienciaNueva(id)).toBe(true);useSimuladorStore.getState().entrarLab(id);expect(useSimuladorStore.getState().validarLab(id).ok).toBe(false);});
 it.each(IDS)('%s pierde un éxito al reabrirse',id=>{registrarJuezCiencia(id,()=>({ok:true}));expect(validarCiencia(id).ok).toBe(true);useSimuladorStore.getState().entrarLab(id);expect(useSimuladorStore.getState().validarLab(id).ok).toBe(false);});
 it('no intercepta las cuarenta prácticas anteriores ni ids fuera del contrato',()=>{for(const area of ['fisica','quimica','matematicas','biologia'])for(let i=1;i<=10;i++)expect(esCienciaNueva(`${area}-${i}`)).toBe(false);expect(esCienciaNueva('mecanica-11')).toBe(false);expect(esCienciaNueva('biologia-21')).toBe(false);});
 it('un cleanup antiguo no elimina el juez de un montaje nuevo',()=>{const old=registrarJuezCiencia('quimica-11',()=>({ok:false}));const latest=registrarJuezCiencia('quimica-11',()=>({ok:true}));old();expect(validarCiencia('quimica-11').ok).toBe(true);latest();expect(validarCiencia('quimica-11').ok).toBe(false);});
 it('el reset del shell nativo también reinicia el experimento nuevo',()=>{const reset=jest.fn();registrarJuezCiencia('quimica-11',()=>({ok:true}),reset);useSimuladorStore.getState().resetPractica();expect(reset).toHaveBeenCalledTimes(1);});
});
describe('evidencia transitoria del cuaderno científico',()=>{
 const seed=()=>{const p={path:1,dilution:2};useCienciaStore.getState().init('quimica-11',p);const record:Registro={signature:firma(p),parameters:p,date:'2026-10-28T00:00:00Z',duration:6,sample:{answer:37.5,values:{absorbance:.225}},points:[{t:6,values:{absorbance:.225}}]};useCienciaStore.setState({record,history:[record],accepted:true,answer:'37.5'});};
 it('cambiar y restaurar un control no recupera ni registro ni aprobación',()=>{seed();useCienciaStore.getState().change('path',1.1);useCienciaStore.getState().change('path',1);expect(useCienciaStore.getState().record).toBeNull();expect(useCienciaStore.getState().accepted).toBe(false);expect(useCienciaStore.getState().history).toHaveLength(1);});
 it('otra respuesta obliga a validar de nuevo pero conserva el registro medido',()=>{seed();useCienciaStore.getState().respond('40');expect(useCienciaStore.getState().accepted).toBe(false);expect(useCienciaStore.getState().record).not.toBeNull();});
 it('otra apertura empieza sin datos de la práctica anterior',()=>{seed();useCienciaStore.getState().init('biologia-11',{substrate:3,inhibitor:1});expect(useCienciaStore.getState()).toMatchObject({id:'biologia-11',record:null,answer:'',accepted:false,running:false,history:[]});});
});
