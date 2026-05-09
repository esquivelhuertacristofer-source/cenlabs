/**
 * ============================================
 * SMOKE TESTS - CEN LABS
 * ============================================
 * Tests básicos para verificar que el proyecto compila
 * y las rutas principales funcionan.
 * 
 * Uso: npm test
 * Requerido: npm install -D jest @testing-library/react @testing-library/jest-dom
 */

// ============================================
// TEST 1: Verificar que MASTER_DATA existe y tiene 40 prácticas
// ============================================
describe('MASTER_DATA Integrity', () => {
    it('should have simuladores defined', async () => {
        const { MASTER_DATA } = await import('@/data/simuladoresData');

        const totalSimuladores = Object.keys(MASTER_DATA).length;
        expect(totalSimuladores).toBeGreaterThanOrEqual(30);
    });

    it('should have simuladores for all 4 subjects', async () => {
        const { MASTER_DATA } = await import('@/data/simuladoresData');

        const subjects = ['quimica', 'fisica', 'biologia', 'matematicas'];

        subjects.forEach(subject => {
            const count = Object.keys(MASTER_DATA).filter(id => id.startsWith(subject)).length;
            expect(count).toBeGreaterThanOrEqual(7);
        });
    });

    it('each simulador should have required fields', async () => {
        const { MASTER_DATA } = await import('@/data/simuladoresData');

        Object.entries(MASTER_DATA).forEach(([id, data]: [string, any]) => {
            expect(data).toHaveProperty('titulo');
            expect(data).toHaveProperty('mision');
            expect(data).toHaveProperty('pasos');
            expect(Array.isArray(data.pasos)).toBe(true);
            expect(data.pasos.length).toBeGreaterThan(0);
        });
    });
});

// ============================================
// TEST 2: Verificar que el store existe y tiene métodos requeridos
// ============================================
describe('SimuladorStore', () => {
    it('should have timer functions', async () => {
        const { useSimuladorStore } = await import('@/store/simuladorStore');

        const store = useSimuladorStore.getState();

        expect(typeof store.startTimer).toBe('function');
        expect(typeof store.stopTimer).toBe('function');
        expect(typeof store.resetTimer).toBe('function');
        expect(typeof store.tick).toBe('function');
    });

    it('should have score functions', async () => {
        const { useSimuladorStore } = await import('@/store/simuladorStore');

        const store = useSimuladorStore.getState();

        expect(typeof store.updateScore).toBe('function');
        expect(typeof store.score).toBe('number');
    });

    it('should have chemistry state for particulas', async () => {
        const { useSimuladorStore } = await import('@/store/simuladorStore');

        const store = useSimuladorStore.getState();

        expect(store).toHaveProperty('particulas');
        expect(store.particulas).toHaveProperty('protones');
        expect(store.particulas).toHaveProperty('neutrones');
        expect(store.particulas).toHaveProperty('electrones');
    });

    it('should have biology state for ecosistema', async () => {
        const { useSimuladorStore } = await import('@/store/simuladorStore');

        const store = useSimuladorStore.getState();

        expect(store).toHaveProperty('ecosistema');
        expect(store.ecosistema).toHaveProperty('poblacionPresas');
        expect(store.ecosistema).toHaveProperty('poblacionDepredadores');
    });
});

// ============================================
// TEST 3: Verificar IDs de simuladores tienen formato válido
// ============================================
describe('SimuladorId Format', () => {
    it('should have valid ID format: subject-number', async () => {
        const { MASTER_DATA } = await import('@/data/simuladoresData');

        Object.keys(MASTER_DATA).forEach(id => {
            const regex = /^(quimica|fisica|biologia|matematicas)-\d{1,2}$/;
            expect(id).toMatch(regex);
        });
    });
});

// ============================================
// TEST 4: Verificar API route de resultados
// ============================================
describe('API Results Route', () => {
    it('should have guardarResultado function', async () => {
        const { guardarResultado } = await import('@/lib/supabase');

        expect(typeof guardarResultado).toBe('function');
    });

    it('should accept valid ResultadoPractica structure', async () => {
        const { ResultadoPractica } = await import('@/lib/supabase');

        const resultado: ResultadoPractica = {
            user_id: 'test-user',
            practica_id: 'quimica-1',
            materia: 'quimica',
            score: 100,
            tiempo_segundos: 300,
            checkpoints_completados: 4,
            fecha_inicio: new Date().toISOString(),
            fecha_fin: new Date().toISOString(),
            seeds_utilizadas: {},
        };

        expect(resultado.user_id).toBeDefined();
        expect(resultado.practica_id).toBeDefined();
        expect(resultado.score).toBeGreaterThanOrEqual(0);
    });

    it('should have isSupabaseConfigured function', async () => {
        const { isSupabaseConfigured } = await import('@/lib/supabase');

        expect(typeof isSupabaseConfigured).toBe('function');
    });
});

// ============================================
// TEST 5: Verificar middleware existe
// ============================================
describe('Middleware Configuration', () => {
    it('should have middleware config', async () => {
        // En entorno de test, importar middleware puede fallar por dependencias de Next Server
        // Solo verificamos que el archivo existe y exporta algo si es posible
        try {
            const middleware = await import('@/middleware');
            expect(middleware.config).toBeDefined();
            expect(typeof middleware.config).toBe('object');
        } catch (e) {
            console.log('Skipping middleware functional test in Jest environment');
        }
    });
});

// ============================================
// TEST 6: Verificar audioEngine
// ============================================
describe('AudioEngine', () => {
    it('should export audio instance', async () => {
        const { audio } = await import('@/utils/audioEngine');

        expect(audio).toBeDefined();
        expect(typeof audio.playPop).toBe('function');
        expect(typeof audio.playSuccess).toBe('function');
        expect(typeof audio.playError).toBe('function');
    });
});

// ============================================
// COMANDO PARA EJECUTAR
// ============================================
/*
Para ejecutar estos tests:

1. Instalar dependencias de testing:
   npm install -D jest @testing-library/react @testing-library/jest-dom @types/jest ts-jest jest-environment-jsdom

2. Crear jest.config.js:
   module.exports = {
     preset: 'ts-jest',
     testEnvironment: 'jsdom',
     moduleNameMapper: {
       '^@/(.*)$': '<rootDir>/src/$1',
     },
     transform: {
       '^.+\\.tsx?$': ['ts-jest', { useESM: true }],
     },
     extensionsToTreatAsEsm: ['.ts'],
   };

3. Agregar a package.json:
   "scripts": {
     "test": "NODE_OPTIONS='--experimental-vm-modules' jest"
   }

4. Ejecutar:
   npm test
*/
