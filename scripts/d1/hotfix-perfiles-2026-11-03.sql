-- =============================================================================
-- Hotfix de PRODUCCIÓN para Labs (Supabase wbvcclpxxwzkuddjxqig), 2026-11-03.
-- Aprobado por el usuario («Sí, ciérralo ya»). Cierra la escalada a admin que ya existía:
--   1. Un usuario con sesión podía cambiarse `role` (política UPDATE sin límite de columnas).
--   2. La acción ensureProfileServer (service_role) escribía el rol y el correo que mandara
--      el navegador, para CUALQUIER id.
--   3. handle_new_user copiaba `role` de los metadatos del alta; con el registro público
--      encendido, cualquiera podía registrarse como admin.
--   4. Cualquier usuario con sesión leía nombre y correo de TODOS los perfiles.
-- Lo que NO cambia: las altas del admin (onboardInstitutionalUsers, alumno/profesor), el
-- trigger de grupo, y los cambios hechos por SQL directo (panel de Supabase / postgres).
-- Probado antes contra el oráculo local (scripts/d1/probar-hotfix.mts). Reversa:
-- hotfix-perfiles-2026-11-03.reversa.sql
-- =============================================================================

-- 1 y 2. Por la API (PostgREST: hay request.jwt.claims, sea authenticated o service_role)
--        el rol, el id y el correo de un perfil no se pueden cambiar. Un perfil creado por la
--        API toma el rol de su alta (alumno/profesor), nunca el que mande el cliente.
CREATE OR REPLACE FUNCTION public.cen_proteger_perfil()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
DECLARE
  via_api boolean := coalesce(nullif(current_setting('request.jwt.claims', true), ''), '{}') <> '{}';
  rol_alta text;
BEGIN
  IF NOT via_api THEN
    RETURN NEW;            -- SQL directo y el trigger de alta: sin cambio
  END IF;
  IF TG_OP = 'UPDATE' THEN
    NEW.id    := OLD.id;
    NEW.role  := OLD.role;
    NEW.email := OLD.email;
  ELSE
    SELECT u.raw_user_meta_data->>'role', u.email INTO rol_alta, NEW.email
      FROM auth.users u WHERE u.id = NEW.id;
    NEW.role := CASE WHEN rol_alta IN ('alumno', 'profesor') THEN rol_alta ELSE 'alumno' END;
  END IF;
  RETURN NEW;
END;
$function$;

DROP TRIGGER IF EXISTS cen_proteger_perfil ON public.profiles;
CREATE TRIGGER cen_proteger_perfil
  BEFORE INSERT OR UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.cen_proteger_perfil();

-- 3. El alta nunca da `admin` por los metadatos (los admin se nombran por SQL).
CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insertamos el perfil. Hotfix 2026-11-03: solo alumno o profesor desde los metadatos.
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    CASE WHEN new.raw_user_meta_data->>'role' IN ('alumno', 'profesor')
         THEN new.raw_user_meta_data->>'role' ELSE 'alumno' END
  );

  -- Si viene un group_id en la metadata, lo vinculamos automáticamente
  IF (new.raw_user_meta_data->>'group_id') IS NOT NULL THEN
    INSERT INTO public.alumnos_grupos (id_alumno, id_grupo)
    VALUES (new.id, (new.raw_user_meta_data->>'group_id')::uuid)
    ON CONFLICT DO NOTHING;
  END IF;

  RETURN new;
END;
$function$;

-- 4. Un alumno solo lee su propio perfil; docentes y admin, todos (como hoy: sus pantallas
--    buscan alumnos por correo para asignarlos a grupo). La función lee el rol sin pasar por
--    RLS (si la política consultara profiles directo, se llamaría a sí misma).
CREATE OR REPLACE FUNCTION public.cen_es_docente()
 RETURNS boolean
 LANGUAGE sql
 STABLE
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
  SELECT EXISTS (SELECT 1 FROM public.profiles WHERE id = auth.uid() AND role IN ('profesor', 'admin'))
$function$;
REVOKE EXECUTE ON FUNCTION public.cen_es_docente() FROM PUBLIC, anon;
GRANT EXECUTE ON FUNCTION public.cen_es_docente() TO authenticated;

DROP POLICY IF EXISTS "Perfiles visibles para autenticados" ON public.profiles;
CREATE POLICY "Perfiles: el propio, o docentes y admin" ON public.profiles
  AS PERMISSIVE FOR SELECT TO authenticated
  USING (auth.uid() = id OR public.cen_es_docente());

-- Las funciones de trigger no se llaman por RPC.
REVOKE EXECUTE ON FUNCTION public.cen_proteger_perfil() FROM PUBLIC, anon, authenticated;
