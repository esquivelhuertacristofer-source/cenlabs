# Supabase — Schema y Migraciones

Este directorio es la fuente de verdad del schema de la base de datos de CEN Labs.
**El schema real vive en el dashboard de Supabase.** Este directorio debe mantenerse sincronizado.

---

## Por qué esto importa

Las RLS policies, triggers y el schema completo solo existen en el dashboard de Supabase.
Si el proyecto se elimina o se pierde el acceso, no hay forma de reconstruirlos sin este directorio.

---

## Cómo exportar el schema actual (una vez)

Requiere tener acceso al dashboard de Supabase y el CLI instalado.

```bash
# 1. Instalar Supabase CLI (si no está instalado)
npm install -g supabase

# 2. Login con tu cuenta de Supabase
supabase login
# Abre https://supabase.com/dashboard/account/tokens y pega el token

# 3. Vincular al proyecto (busca el Project Reference ID en Settings → General)
supabase link --project-ref TU_PROJECT_REF_ID

# 4. Exportar el schema completo (tablas + RLS + triggers + índices)
supabase db dump --linked -f supabase/schema.sql

# 5. Commitear
git add supabase/schema.sql
git commit -m "chore: export initial supabase schema"
```

---

## Cómo manejar cambios futuros al schema

Una vez exportado el schema inicial, **todo cambio debe hacerse como migración**:

```bash
# Crear una nueva migración (nombre descriptivo en snake_case)
supabase migration new add_institucion_id_to_profiles

# Editar el archivo generado en supabase/migrations/<timestamp>_add_institucion_id_to_profiles.sql
# Escribir el SQL del cambio, por ejemplo:
#   ALTER TABLE profiles ADD COLUMN institucion_id UUID REFERENCES instituciones(id);
#   CREATE POLICY "profiles: solo ver propios o de mi institución"
#     ON profiles FOR SELECT USING (institucion_id = auth.uid());

# Aplicar la migración al proyecto vinculado
supabase db push
```

---

## Archivos esperados en este directorio

```
supabase/
  README.md           — este archivo
  schema.sql          — dump completo del schema (pendiente de exportar)
  migrations/         — migraciones incrementales (una vez que schema.sql exista)
    001_initial.sql   — opcional: dividir schema.sql en archivo base
```

---

## Estado actual

- [ ] `schema.sql` exportado desde el dashboard  
- [ ] Trigger de auto-creación de profiles documentado  
- [ ] RLS policies documentadas  

**Pendiente:** Ejecutar `supabase db dump --linked -f supabase/schema.sql` con acceso al proyecto.

---

## Variables de entorno necesarias para Supabase CLI

```
NEXT_PUBLIC_SUPABASE_URL=https://tu-proyecto.supabase.co
SUPABASE_SERVICE_ROLE_KEY=tu-service-role-key
```

El Project Reference ID se encuentra en:  
`Supabase Dashboard → Tu Proyecto → Settings → General → Reference ID`
