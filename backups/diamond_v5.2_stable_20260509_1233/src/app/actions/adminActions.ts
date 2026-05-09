"use server";

import { getAdminClient } from "@/lib/supabase";

export interface UserImport {
  email: string;
  fullName: string;
  role: "alumno" | "profesor";
}

/**
 * Genera un correo electrónico institucional a partir de un nombre completo.
 * Ejemplo: "Juan Pérez" -> "juan.perez@cenlaboratorios.com"
 */
function generateEmail(fullName: string, domain: string = "cenlaboratorios.com"): string {
  const clean = fullName
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "") // Quitar acentos
    .replace(/[^a-z0-9 ]/g, "")      // Quitar caracteres especiales
    .trim()
    .replace(/\s+/g, ".");           // Espacios a puntos

  return `${clean}@${domain}`;
}

export interface OnboardUser {
  fullName: string;
  role: "alumno" | "profesor";
  groupId?: string;
}

/**
 * Motor de Fábrica de Usuarios: Procesa una lista de nombres y crea la infraestructura.
 */
export async function onboardInstitutionalUsers(
  names: string[], 
  groupId: string | null, 
  role: "alumno" | "profesor",
  customPassword?: string
) {
  console.log(`[AdminAction] Iniciando Fábrica de Usuarios para ${names.length} nombres...`);
  const admin = getAdminClient();
  const password = customPassword || "CenLabs2026Password!";
  
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
      const { data, error: authError } = await admin.auth.admin.createUser({
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
        // Si el usuario ya existe, lo omitimos o reportamos
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
