/**
 * ============================================
 * API ROUTE: /api/resultados
 * ============================================
 * Endpoint para guardar resultados de prácticas.
 * Implementa autenticación JWT, rate limiting y validación anti-cheat.
 *
 * Método: POST
 * Headers: Authorization: Bearer <supabase_access_token>
 * Body: ResultadoPractica
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';
import { createClient } from '@supabase/supabase-js';

export const dynamic = 'force-dynamic';

// ============================================
// RATE LIMITING (In-Memory)
// ============================================
const RATE_LIMIT_WINDOW = 60 * 1000;
const MAX_REQUESTS_PER_WINDOW = 10;

const rateLimitMap = new Map<string, { count: number; resetTime: number }>();

function checkRateLimit(ip: string): { allowed: boolean; remaining: number; resetIn: number } {
    const now = Date.now();
    const record = rateLimitMap.get(ip);

    if (!record || now > record.resetTime) {
        rateLimitMap.set(ip, { count: 1, resetTime: now + RATE_LIMIT_WINDOW });
        return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - 1, resetIn: RATE_LIMIT_WINDOW };
    }

    if (record.count >= MAX_REQUESTS_PER_WINDOW) {
        return { allowed: false, remaining: 0, resetIn: record.resetTime - now };
    }

    record.count++;
    return { allowed: true, remaining: MAX_REQUESTS_PER_WINDOW - record.count, resetIn: record.resetTime - now };
}

// ============================================
// HELPERS
// ============================================
function hashIP(ip: string): string {
    const salt = process.env.IP_SALT || 'cen-labs-salt';
    return crypto.createHash('sha256').update(ip + salt).digest('hex').substring(0, 16);
}

function validatePracticaId(practicaId: string): boolean {
    const regex = /^(quimica|fisica|matematicas|biologia)-\d{1,2}$/;
    return regex.test(practicaId);
}

function validateScore(score: number): boolean {
    return typeof score === 'number' && score >= 0 && score <= 100;
}

// ============================================
// POST /api/resultados
// ============================================
export async function POST(request: NextRequest) {
    try {
        // 1. Rate Limiting
        const ip = request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip') || 'unknown';
        const rateLimitResult = checkRateLimit(ip);

        if (!rateLimitResult.allowed) {
            return NextResponse.json(
                {
                    success: false,
                    error: 'Too many requests. Please wait before submitting again.',
                    retryAfter: Math.ceil(rateLimitResult.resetIn / 1000)
                },
                {
                    status: 429,
                    headers: {
                        'Retry-After': String(Math.ceil(rateLimitResult.resetIn / 1000)),
                        'X-RateLimit-Remaining': '0',
                        'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW)
                    }
                }
            );
        }

        // 2. Verificar autenticación — Bearer token de Supabase
        const authHeader = request.headers.get('authorization');
        const token = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : null;

        if (!token) {
            return NextResponse.json({ success: false, error: 'No autorizado' }, { status: 401 });
        }

        const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
        const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!;
        const serverClient = createClient(supabaseUrl, supabaseAnonKey);
        const { data: { user }, error: authError } = await serverClient.auth.getUser(token);

        if (authError || !user) {
            return NextResponse.json({ success: false, error: 'Token inválido o expirado' }, { status: 401 });
        }

        // 3. Parsear body
        const body = await request.json();

        // 4. Validaciones de campos
        if (!body.practica_id || !validatePracticaId(body.practica_id)) {
            return NextResponse.json({ success: false, error: 'practica_id inválido' }, { status: 400 });
        }

        if (body.score === undefined || !validateScore(body.score)) {
            return NextResponse.json({ success: false, error: 'score inválido (debe ser 0-100)' }, { status: 400 });
        }

        // 5. El user_id SIEMPRE viene del token verificado, nunca del body
        const serverTimestamp = new Date().toISOString();
        const ipHash = hashIP(ip);

        const resultadoFinal = {
            ...body,
            user_id: user.id,           // Sobrescribir cualquier user_id del cliente
            validation_server_ts: serverTimestamp,
            ip_hash: ipHash,
            api_version: '1.1.0'
        };

        // 6. Guardar en Supabase
        const { guardarResultado } = await import('@/lib/supabase');
        await guardarResultado(resultadoFinal);

        return NextResponse.json(
            {
                success: true,
                message: 'Resultado guardado correctamente',
                server_timestamp: serverTimestamp,
                rate_limit_remaining: rateLimitResult.remaining
            },
            {
                status: 200,
                headers: {
                    'X-RateLimit-Remaining': String(rateLimitResult.remaining),
                    'X-RateLimit-Limit': String(MAX_REQUESTS_PER_WINDOW)
                }
            }
        );

    } catch (error) {
        console.error('[API/resultados] Error:', error);
        return NextResponse.json(
            { success: false, error: 'Error interno del servidor' },
            { status: 500 }
        );
    }
}

// ============================================
// GET /api/resultados
// ============================================
export async function GET() {
    return NextResponse.json({
        success: true,
        message: 'API de resultados CEN Labs. Usa POST con Bearer token para guardar resultados.',
    });
}
