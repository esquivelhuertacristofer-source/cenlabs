"use server";

import { getAdminClient } from "@/lib/supabase-admin";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export interface UserImport {
  email: string;
  fullName: string;
  role: "alumno" | "profesor";
}

// Configurable via INSTITUTIONAL_EMAIL_DOMAIN env var; fallback al dominio CEN
const DEFAULT_EMAIL_DOMAIN =
  process.env.INSTITUTIONAL_EMAIL_DOMAIN ?? "cenlaboratorios.com";

/**
 * Genera un correo electrónico institucional a partir de un nombre completo.
 * Ejemplo: "Juan Pérez" -> "juan.perez@cenlaboratorios.com"
 */
function generateEmail(fullName: string, domain: string = DEFAULT_EMAIL_DOMAIN): string {
  const clean = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .replace(/[^a-z0-9 ]/g, "")
    .trim()
    .replace(/\s+/g, ".");

  return `${clean}@${domain}`;
}

async function requireAdminRole(): Promise<void> {
  const cookieStore = await cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
        setAll() {},
      },
    }
  );
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) throw new Error('No autorizado');

  const admin = getAdminClient();
  const { data: profile } = await admin
    .from('profiles')
    .select('role')
    .eq('id', user.id)
    .single();

  if (!profile || profile.role !== 'admin') {
    throw new Error('Acceso denegado: se requiere rol de administrador');
  }
}

export interface OnboardUser {
  fullName: string;
  role: "alumno" | "profesor";
  groupId?: string;
}

/**
 * Motor de Fábrica de Usuarios: Procesa una lista de nombres y crea la infraestructura.
 * Requiere rol de administrador verificado en el servidor.
 */
export async function onboardInstitutionalUsers(
  names: string[],
  groupId: string | null,
  role: "alumno" | "profesor",
  customPassword: string
) {
  await requireAdminRole();

  if (!customPassword || customPassword.trim().length < 8) {
    throw new Error('Se requiere una contraseña de al menos 8 caracteres.');
  }
  const admin = getAdminClient();
  const password = customPassword.trim();

  const results = {
    success: [] as { name: string; email: string }[],
    errors: [] as { name: string; message: string }[],
  };

  for (const rawName of names) {
    const name = rawName.trim();
    if (!name) continue;

    const email = generateEmail(name);

    try {
      // 1. Crear en Auth
      const { error: authError } = await admin.auth.admin.createUser({
        email,
        password,
        email_confirm: true,
        user_metadata: {
          full_name: name,
          role: role,
          group_id: groupId
        }
      });

      if (authError) {
        results.errors.push({ name, message: authError.message });
        continue;
      }

      // El Trigger se encargará de crear el perfil y vincularlo al grupo
      // gracias a que pasamos el group_id en la metadata.

      results.success.push({ name, email });

    } catch (err: any) {
      results.errors.push({ name, message: err.message });
    }
  }

  return results;
}
