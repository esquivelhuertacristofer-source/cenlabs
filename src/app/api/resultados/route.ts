/**
 * ============================================
 * API ROUTE: /api/resultados
 * ============================================
 * Endpoint para guardar resultados de prácticas.
 * Implementa rate limiting y validación anti-cheat.
 * 
 * Método: POST
 * Body: ResultadoPractica
 */

import { NextRequest, NextResponse } from 'next/server';
import crypto from 'crypto';

export const dynamic = 'force-dynamic';

// WARNING: Este endpoint requiere protección JWT / Sesión de Servidor antes de la puesta en línea final.
// Actualmente confía en el user_id proporcionado por el cliente, lo que es vulnerable a suplantación.
// TODO: Implementar supabase.auth.getUser() del lado del servidor usando cookies.

// ============================================
// RATE LIMITING (In-Memory - Para producción usar Redis)
// ============================================
const RATE_LIMIT_WINDOW = 60 * 1000; // 1 minuto
const MAX_REQUESTS_PER_WINDOW = 10; // Máximo 10 submissions por minuto por IP

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
    return crypto.createHash('sha256').update(ip + process.env.IP_SALT || 'cen-labs-salt').digest('hex').substring(0, 16);
}

function validatePracticaId(practicaId: string): boolean {
    // Formato esperado: materia-numero (ej: quimica-1, fisica-3, matematicas-10)
    const regex = /^(quimica|fisica|matematicas|biologia)-\d{1,2}$/;
    return regex.test(practicaId);
}

function validateScore(score: number): boolean {
    // Score debe estar entre 0 y 100
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

        // 2. Parsear body
        const body = await request.json();

        // 3. Validaciones
        if (!body.user_id || typeof body.user_id !== 'string') {
            return NextResponse.json({ success: false, error: 'user_id inválido' }, { status: 400 });
        }

        if (!body.practica_id || !validatePracticaId(body.practica_id)) {
            return NextResponse.json({ success: false, error: 'practica_id inválido' }, { status: 400 });
        }

        if (body.score === undefined || !validateScore(body.score)) {
            return NextResponse.json({ success: false, error: 'score inválido (debe ser 0-100)' }, { status: 400 });
        }

        // 4. Agregar metadata de servidor para anti-cheat
        const serverTimestamp = new Date().toISOString();
        const ipHash = hashIP(ip);

        const resultadoFinal = {
            ...body,
            validation_server_ts: serverTimestamp,
            ip_hash: ipHash,
            api_version: '1.0.0'
        };

        // 5. Guardar en Supabase (cuando esté configurado)
        // Por ahora, solo logueamos
        console.log('[API/resultados] Nuevo resultado recibido:', {
            user_id: resultadoFinal.user_id,
            practica_id: resultadoFinal.practica_id,
            score: resultadoFinal.score,
            server_ts: serverTimestamp
        });

        // 5. Guardar en Supabase
        const { isSupabaseConfigured, guardarResultado } = await import('@/lib/supabase');
        if (isSupabaseConfigured()) {
            await guardarResultado(resultadoFinal);
        } else {
            console.warn('[API/resultados] Supabase no configurado. El resultado no se persistirá en la DB.');
        }

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
export async function GET(request: NextRequest) {
    // Para uso futuro: consultar historial de resultados
    // Requerirá autenticación JWT

    return NextResponse.json({
        success: true,
        message: 'API de resultados. Usa POST para guardar resultados.',
        endpoints: {
            POST: '/api/resultados - Guardar resultado de práctica',
            GET: '/api/resultados - Consultar historial (requiere auth)'
        }
    });
}
