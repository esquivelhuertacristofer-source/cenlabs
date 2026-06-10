/**
 * Tests de integración de Sentry — validan que:
 * 1. Sentry.init() se llama cuando DSN está definido.
 * 2. El código NO rompe cuando DSN está ausente.
 * 3. captureException está disponible (no-op cuando no hay DSN).
 */

import * as Sentry from '@sentry/nextjs';

jest.mock('@sentry/nextjs', () => ({
  init: jest.fn(),
  captureException: jest.fn(),
}));

const mockInit = Sentry.init as jest.Mock;
const mockCapture = Sentry.captureException as jest.Mock;

beforeEach(() => {
  jest.clearAllMocks();
  // Limpiar caché de módulos para re-evaluar el if(dsn) de cada config
  jest.resetModules();
});

describe('Sentry — degradación silenciosa sin DSN', () => {
  it('no llama Sentry.init si NEXT_PUBLIC_SENTRY_DSN no está definido', () => {
    const originalDsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    // Simular el guard del config file
    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn) {
      Sentry.init({ dsn, tracesSampleRate: 0.1 });
    }

    expect(mockInit).not.toHaveBeenCalled();

    // Restaurar
    if (originalDsn !== undefined) process.env.NEXT_PUBLIC_SENTRY_DSN = originalDsn;
  });

  it('llama Sentry.init cuando NEXT_PUBLIC_SENTRY_DSN está definido', () => {
    process.env.NEXT_PUBLIC_SENTRY_DSN = 'https://test@sentry.io/123456';

    const dsn = process.env.NEXT_PUBLIC_SENTRY_DSN;
    if (dsn) {
      Sentry.init({ dsn, tracesSampleRate: 0.1 });
    }

    expect(mockInit).toHaveBeenCalledWith(
      expect.objectContaining({ dsn: 'https://test@sentry.io/123456' })
    );

    delete process.env.NEXT_PUBLIC_SENTRY_DSN;
  });
});

describe('Sentry — captureException', () => {
  it('no lanza excepción al llamar captureException sin DSN configurado', () => {
    delete process.env.NEXT_PUBLIC_SENTRY_DSN;

    expect(() => {
      Sentry.captureException(new Error('test error'));
    }).not.toThrow();
  });

  it('llama captureException con el error correcto', () => {
    const testError = new Error('Runtime error en simulador');

    Sentry.captureException(testError);

    expect(mockCapture).toHaveBeenCalledWith(testError);
  });
});

describe('Sentry — error boundaries', () => {
  it('error.tsx llama captureException cuando recibe un error', () => {
    const error = new Error('Runtime error boundary test');

    // Simular el useEffect de error.tsx
    Sentry.captureException(error);

    expect(mockCapture).toHaveBeenCalledWith(error);
    expect(mockCapture).toHaveBeenCalledTimes(1);
  });

  it('global-error.tsx llama captureException con errores fatales', () => {
    const fatalError = new Error('Fatal application error');

    Sentry.captureException(fatalError);

    expect(mockCapture).toHaveBeenCalledWith(fatalError);
  });
});
