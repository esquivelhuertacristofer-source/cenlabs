/**
 * Entrada y validación de los 40 labs base.
 *
 * `entrarLab` debe dejar cada lab en un intento NUEVO: un éxito viejo no puede
 * sobrevivir a una reapertura (antes reabría el overlay de «misión cumplida» y
 * aprobaba sin repetir la práctica), y la bitácora solo sobrevive si se vuelve
 * al MISMO lab. `validarLab` es el único juez y nunca aprueba un lab recién
 * abierto sin tocar.
 */
import { useSimuladorStore } from '@/store/simuladorStore';

const IDS = ['quimica', 'fisica', 'biologia', 'matematicas'].flatMap((m) =>
  Array.from({ length: 10 }, (_, i) => `${m}-${i + 1}`)
);

// Objeto de estado de cada lab y su campo de veredicto.
const VEREDICTO: Record<string, [string, string]> = {
  'quimica-2': ['gases', 'status'], 'quimica-4': ['limitante', 'status'], 'quimica-5': ['soluciones', 'status'],
  'quimica-6': ['solubilidad', 'status'], 'quimica-7': ['titulacion', 'status'], 'quimica-8': ['equilibrio', 'status'],
  'quimica-9': ['celda', 'status'], 'quimica-10': ['destilacion', 'status'],
  'fisica-2': ['plano2', 'resultado'], 'fisica-3': ['pendulo3', 'resultado'], 'fisica-4': ['hooke4', 'resultado'],
  'fisica-5': ['prensa5', 'resultado'], 'fisica-6': ['arquimedes6', 'resultado'], 'fisica-7': ['dilatacion7', 'resultado'],
  'fisica-8': ['ohm8', 'resultado'], 'fisica-9': ['electrostatica9', 'resultado'], 'fisica-10': ['motor10', 'resultado'],
  'matematicas-1': ['cuadraticas', 'status'], 'matematicas-2': ['sistemas2x2', 'status'], 'matematicas-3': ['richter', 'status'],
  'matematicas-4': ['pitagoras', 'status'], 'matematicas-5': ['trigonometria', 'status'], 'matematicas-6': ['geometria6', 'status'],
  'matematicas-7': ['optica7', 'status'], 'matematicas-8': ['derivada8', 'status'], 'matematicas-9': ['integral9', 'status'],
  'matematicas-10': ['galton10', 'status'],
  'biologia-1': ['microscopio', 'status'], 'biologia-2': ['transporte', 'status'], 'biologia-8': ['cardio', 'status'],
  'biologia-9': ['digestion', 'status'], 'biologia-10': ['ecosistema', 'status'],
};

describe('entrarLab', () => {
  it.each(IDS)('%s abre sin lanzar', (id) => {
    expect(() => useSimuladorStore.getState().entrarLab(id)).not.toThrow();
  });

  it.each(Object.entries(VEREDICTO))('%s no conserva un éxito anterior', (id, [obj, campo]) => {
    const st = useSimuladorStore.getState() as unknown as Record<string, Record<string, unknown>>;
    const exito = campo === 'resultado' ? 'exito' : 'success';
    useSimuladorStore.setState({ [obj]: { ...st[obj], [campo]: exito } } as never);
    useSimuladorStore.getState().entrarLab(id);
    const despues = (useSimuladorStore.getState() as unknown as Record<string, Record<string, unknown>>)[obj];
    expect(despues[campo]).not.toBe(exito);
  });

  it('la bitácora sobrevive al mismo lab pero no a otro, y nunca conserva banderas de éxito', () => {
    const s = useSimuladorStore.getState();
    s.entrarLab('fisica-5');
    s.setBitacora({ ensayo: 'mis notas', fisica5: { exito: true } });
    s.entrarLab('fisica-5');
    let b = useSimuladorStore.getState().bitacoraData;
    expect(b.ensayo).toBe('mis notas');
    expect(b.fisica5).toBeUndefined();
    s.entrarLab('quimica-1');
    b = useSimuladorStore.getState().bitacoraData;
    expect(b.ensayo).toBeUndefined();
    expect(b.labId).toBe('quimica-1');
  });
});

describe('validarLab', () => {
  it('rechaza un id desconocido con mensaje', () => {
    const r = useSimuladorStore.getState().validarLab('quimica-99');
    expect(r.ok).toBe(false);
  });

  it.each(IDS)('%s devuelve un veredicto booleano', (id) => {
    const s = useSimuladorStore.getState();
    s.entrarLab(id);
    expect(typeof s.validarLab(id).ok).toBe('boolean');
  });

  // Labs cuyo validador todavía aprueba un intento recién abierto, sin tocar
  // nada. La lista solo puede ENCOGER: al arreglar uno, se quita de aquí.
  const APRUEBAN_SIN_TOCAR = new Set(['fisica-9', 'matematicas-9']);

  it.each(IDS)('%s no aprueba un intento recién abierto', (id) => {
    const s = useSimuladorStore.getState();
    s.entrarLab(id);
    expect(useSimuladorStore.getState().validarLab(id).ok).toBe(APRUEBAN_SIN_TOCAR.has(id));
  });
});
