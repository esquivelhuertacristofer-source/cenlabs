-- Reversa EXACTA del hotfix del 2026-11-03: deja profiles y handle_new_user como estaban
-- (textos tomados de la exportación READ ONLY de ese día, .export/dump.json).
DROP TRIGGER IF EXISTS cen_proteger_perfil ON public.profiles;
DROP FUNCTION IF EXISTS public.cen_proteger_perfil();

DROP POLICY IF EXISTS "Perfiles: el propio, o docentes y admin" ON public.profiles;
CREATE POLICY "Perfiles visibles para autenticados" ON public.profiles
  AS PERMISSIVE FOR SELECT TO public
  USING ((auth.role() = 'authenticated'::text));
DROP FUNCTION IF EXISTS public.cen_es_docente();

CREATE OR REPLACE FUNCTION public.handle_new_user()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
BEGIN
  -- Insertamos el perfil
  INSERT INTO public.profiles (id, email, full_name, role)
  VALUES (
    new.id,
    new.email,
    COALESCE(new.raw_user_meta_data->>'full_name', 'Usuario Nuevo'),
    COALESCE(new.raw_user_meta_data->>'role', 'alumno')
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
