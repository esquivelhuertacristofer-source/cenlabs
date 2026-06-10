/**
 * POST /api/resultados  — guarda resultados de prácticas.
 * Headers: Authorization: Bearer <supabase_access_token>
 *
 * Rate limiting:
 *   Layer 1 — IP guard (pre-auth)  : 30 req / min  (DoS protection)
 *   Layer 2 — User guard (post-auth): 10 req / min  (per authenticated identity)
 *
 * Backend: Upstash Redis when UPSTASH_REDIS_REST_URL + UPSTASH_REDIS_REST_TOKEN
 * are set (shared across all serverless instances); falls back to in-process Map.
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';
import { validatePracticaId, validateScore } from '@/utils/validators';
import { ipLimiter, userLimiter } from '@/lib/rateLimiter';

export const dynamic = 'force-dynamic';

// ── Supabase client factory (lazy — reads env vars at request time, not build time) ──
function getServerClient() {
  return createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function clientIP(req: NextRequest): string {
  return (
    req.headers.get('x-forwarded-for')?.split(',')[0]?.trim() ||
    req.headers.get('x-real-ip') ||
    'unknown'
  );
}

function hashIP(ip: string): string {
  const salt = process.env.IP_SALT;
  if (!salt) console.warn('[API/resultados] IP_SALT env var no configurado — pseudonymización degradada');
  return crypto.createHash('sha256').update(ip + (salt ?? '')).digest('hex').substring(0, 16);
}

function rateLimitHeaders(remaining: number, limit: number): Record<string, string> {
  return {
    'X-RateLimit-Limit':     String(limit),
    'X-RateLimit-Remaining': String(remaining),
  };
}

// ── POST /api/resultados ──────────────────────────────────────────────────────
export async function POST(request: NextRequest) {
  try {
    const ip = clientIP(request);

    // ── 1. IP guard (pre-auth DoS protection) ────────────────────────────────
    const ipRL = await ipLimiter.check(ip);
    if (!ipRL.allowed) {
      const retryAfter = Math.ceil(ipRL.resetIn / 1000);
      return NextResponse.json(
        { success: false, error: 'Too many requests', retryAfter },
        { status: 429, headers: { 'Retry-After': String(retryAfter) } }
      );
    }

    // ── 2. Autenticación ─────────────────────────────────────────────────────
    const authHeader = request.headers.get('authorization');
    const token      = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

    if (!token) {
      return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
    }

    const { data: { user }, error: authError } = await getServerClient().auth.getUser(token);

    if (authError || !user) {
      return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
    }

    // ── 3. User guard (post-auth, per-identity rate limit) ───────────────────
    const userRL = await userLimiter.check(user.id);
    if (!userRL.allowed) {
      const retryAfter = Math.ceil(userRL.resetIn / 1000);
      return NextResponse.json(
        {
          success:    false,
          error:      'Demasiados envíos. Por favor espera antes de intentar de nuevo.',
          retryAfter,
        },
        {
          status:  429,
          headers: {
            'Retry-After':           String(retryAfter),
            'X-RateLimit-Remaining': '0',
            'X-RateLimit-Limit':     '10',
          },
        }
      );
    }

    // ── 4. Validación de body ─────────────────────────────────────────────────
    const body = await request.json();

    if (!body.practica_id || !validatePracticaId(body.practica_id)) {
      return NextResponse.json({ success: false, error: 'practica_id inválido' }, { status: 400 });
    }

    if (body.score === undefined || !validateScore(body.score)) {
      return NextResponse.json({ success: false, error: 'score inválido (debe ser 0-100)' }, { status: 400 });
    }

    // ── 5. Construir resultado final ──────────────────────────────────────────
    // Solo campos explícitamente permitidos — nunca spread del body del cliente.
    const VALID_STATUS = ['in_progress', 'completed', 'abandoned'] as const;
    const serverTimestamp = new Date().toISOString();
    const resultadoFinal  = {
      practica_id:         String(body.practica_id),
      score:               Number(body.score),
      sim_id:              typeof body.sim_id === 'string'   ? body.sim_id   : undefined,
      status:              VALID_STATUS.includes(body.status) ? body.status   : 'completed',
      total_time_seconds:  typeof body.total_time_seconds === 'number' ? body.total_time_seconds : undefined,
      last_step:           typeof body.last_step === 'number'           ? body.last_step          : undefined,
      bitacora_data:       body.bitacora_data && typeof body.bitacora_data === 'object' ? body.bitacora_data : undefined,
      // Campos del servidor — nunca del cliente
      id_alumno:            user.id,
      user_id:              user.id,
      validation_server_ts: serverTimestamp,
      ip_hash:              hashIP(ip),
      api_version:          '1.3.0',
    };

    // ── 6. Guardar en Supabase ────────────────────────────────────────────────
    const { guardarResultado } = await import('@/lib/supabase-helpers');
    await guardarResultado(resultadoFinal);

    return NextResponse.json(
      {
        success:              true,
        message:              'Resultado guardado correctamente',
        server_timestamp:     serverTimestamp,
        rate_limit_remaining: userRL.remaining,
      },
      { status: 200, headers: rateLimitHeaders(userRL.remaining, 10) }
    );

  } catch (error) {
    const requestId = crypto.randomUUID();
    console.error(`[API/resultados] Error (requestId=${requestId}):`, error);
    return NextResponse.json(
      { success: false, error: 'Error interno del servidor', requestId },
      { status: 500 }
    );
  }
}

// ── GET /api/resultados ───────────────────────────────────────────────────────
export async function GET() {
  return NextResponse.json(
    { success: false, error: 'Method Not Allowed' },
    { status: 405, headers: { Allow: 'POST' } }
  );
}
