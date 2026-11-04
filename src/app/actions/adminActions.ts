"use server";

import { getAdminClient } from "@/lib/supabase-admin";
import { usuarioConRol } from "@/lib/supabase-server";

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
  // Labs sobre D1: sesión propia; el rol se lee del servidor, nunca del navegador.
  const yo = await usuarioConRol();
  if (!yo) throw new Error('No autorizado');
  if (yo.role !== 'admin') {
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
  // Listas cerradas: el tipo de TypeScript no existe en tiempo de ejecución (manual 3c).
  if (role !== "alumno" && role !== "profesor") throw new Error("Rol inválido.");
  if (!Array.isArray(names) || names.length > 200) throw new Error("Lista de nombres inválida (máximo 200).");

  if (!customPassword || customPassword.trim().length < 8) {
    throw new Error('Se requiere una contraseña de al menos 8 caracteres.');
  }
  const admin = await getAdminClient();
  const password = customPassword.trim();

  const results = {
    success: [] as { name: string; email: string }[],
    errors: [] as { name: string; message: string }[],
  };

  for (const rawName of names) {
    const name = String(rawName ?? "").trim().slice(0, 120);
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
