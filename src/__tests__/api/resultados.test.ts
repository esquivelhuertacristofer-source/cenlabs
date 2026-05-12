/**
 * Tests para POST /api/resultados
 * Cubre: autenticación, rate limiting, validación del body, caso exitoso, errores internos
 *
 * @jest-environment node
 */

// ── Mocks (babel-jest los hoista antes de los imports) ────────────────────────

jest.mock('@supabase/supabase-js', () => ({
  createClient: jest.fn().mockReturnValue({
    auth: {
      getUser: jest.fn().mockResolvedValue({
        data: { user: { id: 'mock-user-id' } },
        error: null,
      }),
    },
  }),
}));

jest.mock('@/lib/rateLimiter', () => ({
  ipLimiter: {
    check: jest.fn().mockResolvedValue({ allowed: true, remaining: 29, resetIn: 60000 }),
  },
  userLimiter: {
    check: jest.fn().mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60000 }),
  },
}));

jest.mock('@/lib/supabase-helpers', () => ({
  guardarResultado: jest.fn().mockResolvedValue(undefined),
}));

// ── Imports ───────────────────────────────────────────────────────────────────

import { NextRequest } from 'next/server';
import { POST, GET } from '@/app/api/resultados/route';

// ── Helper: construir NextRequest ─────────────────────────────────────────────

function makeRequest(
  body: object,
  extraHeaders: Record<string, string> = {},
): NextRequest {
  return new NextRequest('http://localhost/api/resultados', {
    method: 'POST',
    headers: {
      'content-type': 'application/json',
      'x-forwarded-for': '10.0.0.1',
      ...extraHeaders,
    },
    body: JSON.stringify(body),
  });
}

const AUTH = { authorization: 'Bearer valid-test-token' };
const VALID_BODY = { practica_id: 'quimica-1', score: 85 };

// ── Helpers para acceder a los mocks después de la inicialización del módulo ──

function getMockIp() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/rateLimiter').ipLimiter;
}
function getMockUser() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/rateLimiter').userLimiter;
}
function getMockGuardar() {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  return require('@/lib/supabase-helpers').guardarResultado;
}

// ── GET /api/resultados ───────────────────────────────────────────────────────

describe('GET /api/resultados', () => {
  it('retorna mensaje de info de la API', async () => {
    const res = await GET();
    const json = await res.json();
    expect(res.status).toBe(200);
    expect(json.success).toBe(true);
    expect(json.message).toMatch(/v1\.3/);
  });
});

// ── Autenticación ─────────────────────────────────────────────────────────────

describe('POST /api/resultados — autenticación', () => {
  it('401 sin header Authorization', async () => {
    const req = makeRequest(VALID_BODY); // sin Authorization
    const res = await POST(req);
    expect(res.status).toBe(401);
    expect((await res.json()).success).toBe(false);
  });

  it('401 con header mal formado (no Bearer)', async () => {
    const req = makeRequest(VALID_BODY, { authorization: 'Basic abc123' });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});

// ── Validación del body ───────────────────────────────────────────────────────

describe('POST /api/resultados — validación del body', () => {
  beforeEach(() => {
    getMockIp().check.mockResolvedValue({ allowed: true, remaining: 29, resetIn: 60000 });
    getMockUser().check.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60000 });
  });

  it('400 cuando practica_id está ausente', async () => {
    const req = makeRequest({ score: 80 }, AUTH);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/practica_id/);
  });

  it('400 cuando practica_id tiene formato inválido', async () => {
    const req = makeRequest({ practica_id: 'ciencias-1', score: 80 }, AUTH);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 cuando score está ausente', async () => {
    const req = makeRequest({ practica_id: 'fisica-3' }, AUTH);
    const res = await POST(req);
    expect(res.status).toBe(400);
    expect((await res.json()).error).toMatch(/score/);
  });

  it('400 cuando score es mayor que 100', async () => {
    const req = makeRequest({ practica_id: 'biologia-5', score: 101 }, AUTH);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });

  it('400 cuando score es negativo', async () => {
    const req = makeRequest({ practica_id: 'matematicas-2', score: -1 }, AUTH);
    const res = await POST(req);
    expect(res.status).toBe(400);
  });
});

// ── Rate limiting ─────────────────────────────────────────────────────────────

describe('POST /api/resultados — rate limiting', () => {
  beforeEach(() => {
    getMockIp().check.mockResolvedValue({ allowed: true, remaining: 29, resetIn: 60000 });
    getMockUser().check.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60000 });
  });

  it('429 cuando la IP supera el límite — incluye Retry-After y retryAfter', async () => {
    getMockIp().check.mockResolvedValueOnce({ allowed: false, remaining: 0, resetIn: 30000 });

    const req = makeRequest(VALID_BODY, AUTH);
    const res = await POST(req);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.retryAfter).toBe(30);
    expect(res.headers.get('Retry-After')).toBe('30');
  });

  it('429 cuando el usuario supera su límite personal — mensaje descriptivo', async () => {
    getMockUser().check.mockResolvedValueOnce({ allowed: false, remaining: 0, resetIn: 60000 });

    const req = makeRequest(VALID_BODY, AUTH);
    const res = await POST(req);

    expect(res.status).toBe(429);
    const json = await res.json();
    expect(json.error).toMatch(/espera/i);
    expect(res.headers.get('X-RateLimit-Remaining')).toBe('0');
  });
});

// ── Caso exitoso ──────────────────────────────────────────────────────────────

describe('POST /api/resultados — caso exitoso', () => {
  beforeEach(() => {
    getMockIp().check.mockResolvedValue({ allowed: true, remaining: 29, resetIn: 60000 });
    getMockUser().check.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60000 });
    getMockGuardar().mockResolvedValue(undefined);
  });

  it('200 con success, server_timestamp y rate_limit_remaining', async () => {
    const req = makeRequest(VALID_BODY, AUTH);
    const res = await POST(req);

    expect(res.status).toBe(200);
    const json = await res.json();
    expect(json.success).toBe(true);
    expect(json.server_timestamp).toBeDefined();
    expect(json.rate_limit_remaining).toBe(9);
  });

  it('user_id guardado viene del token verificado, nunca del body', async () => {
    const req = makeRequest({ ...VALID_BODY, user_id: 'hacker-injected-id' }, AUTH);
    await POST(req);

    const saved = getMockGuardar().mock.calls.at(-1)[0];
    expect(saved.user_id).toBe('mock-user-id');
    expect(saved.user_id).not.toBe('hacker-injected-id');
  });

  it('payload guardado incluye ip_hash y api_version correcta', async () => {
    const req = makeRequest(VALID_BODY, AUTH);
    await POST(req);

    const saved = getMockGuardar().mock.calls.at(-1)[0];
    expect(saved.ip_hash).toBeDefined();
    expect(saved.ip_hash).toHaveLength(16); // substring(0, 16) del hash sha256
    expect(saved.api_version).toBe('1.3.0');
  });

  it('acepta IDs válidos de todas las materias (boundary)', async () => {
    const casos = [
      'quimica-1', 'quimica-10',
      'fisica-1',  'fisica-10',
      'biologia-1', 'biologia-9',
      'matematicas-1', 'matematicas-5',
    ];
    for (const practica_id of casos) {
      const req = makeRequest({ practica_id, score: 0 }, AUTH);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
  });

  it('score 0 y score 100 son válidos (extremos del rango)', async () => {
    for (const score of [0, 100]) {
      const req = makeRequest({ practica_id: 'quimica-3', score }, AUTH);
      const res = await POST(req);
      expect(res.status).toBe(200);
    }
  });
});

// ── Error interno ─────────────────────────────────────────────────────────────

describe('POST /api/resultados — error interno', () => {
  beforeEach(() => {
    getMockIp().check.mockResolvedValue({ allowed: true, remaining: 29, resetIn: 60000 });
    getMockUser().check.mockResolvedValue({ allowed: true, remaining: 9, resetIn: 60000 });
  });

  it('500 cuando guardarResultado lanza excepción — respuesta incluye requestId', async () => {
    getMockGuardar().mockRejectedValueOnce(new Error('DB connection failed'));

    const req = makeRequest(VALID_BODY, AUTH);
    const res = await POST(req);

    expect(res.status).toBe(500);
    const json = await res.json();
    expect(json.success).toBe(false);
    expect(json.requestId).toBeDefined(); // para correlación en logs de Vercel
  });
});
