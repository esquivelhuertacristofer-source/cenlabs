// GENERADO por scripts/d1/generar.mjs — no editar a mano.
// Columnas por tabla (clase de valor) y políticas RLS de Postgres traducidas a SQLite.
// En las políticas, {{uid}} {{role}} {{jwtrole}} los sustituye la capa compatible con
// literales del usuario de la petición.
export type ClaseCol = 'txt' | 'num' | 'bool' | 'json' | 'arr'
export const TABLAS: Record<string, { vista: boolean; cols: Record<string, ClaseCol> }> = {
  "alumnos_grupos": {
    "vista": false,
    "cols": {
      "id_alumno": "txt",
      "id_grupo": "txt"
    }
  },
  "asignaciones": {
    "vista": false,
    "cols": {
      "id": "txt",
      "id_profesor": "txt",
      "sim_id": "txt",
      "planned_date": "txt",
      "id_grupo": "txt",
      "created_at": "txt"
    }
  },
  "grupos": {
    "vista": false,
    "cols": {
      "id": "txt",
      "nombre": "txt",
      "id_profesor": "txt",
      "created_at": "txt"
    }
  },
  "intentos": {
    "vista": false,
    "cols": {
      "id": "txt",
      "id_alumno": "txt",
      "sim_id": "txt",
      "status": "txt",
      "score": "num",
      "total_time_seconds": "num",
      "last_step": "num",
      "bitacora_data": "json",
      "started_at": "txt",
      "completed_at": "txt"
    }
  },
  "profiles": {
    "vista": false,
    "cols": {
      "id": "txt",
      "email": "txt",
      "full_name": "txt",
      "role": "txt",
      "created_at": "txt"
    }
  }
}

export type Politica = { nombre: string; cmd: 'ALL' | 'SELECT' | 'INSERT' | 'UPDATE' | 'DELETE'; anon: boolean; using: string | null; check: string | null }
export const POLITICAS: Record<string, Politica[]> = {
  "alumnos_grupos": [
    {
      "nombre": "Alumno ve sus grupos",
      "cmd": "SELECT",
      "anon": true,
      "using": "({{uid}} = id_alumno)",
      "check": null
    },
    {
      "nombre": "profesor_ve_miembros_de_su_grupo",
      "cmd": "SELECT",
      "anon": true,
      "using": "((id_alumno = {{uid}}) OR (EXISTS ( SELECT 1\n   FROM grupos g\n  WHERE ((g.id = alumnos_grupos.id_grupo) AND (g.id_profesor = {{uid}})))) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = {{uid}}) AND (p.role = 'admin')))))",
      "check": null
    }
  ],
  "asignaciones": [
    {
      "nombre": "Lectura pública de asignaciones",
      "cmd": "SELECT",
      "anon": true,
      "using": "({{jwtrole}} = 'authenticated')",
      "check": null
    },
    {
      "nombre": "Profesores gestionan sus propias asignaciones",
      "cmd": "ALL",
      "anon": true,
      "using": "({{uid}} = id_profesor)",
      "check": null
    }
  ],
  "grupos": [
    {
      "nombre": "Grupos visibles para autenticados",
      "cmd": "SELECT",
      "anon": true,
      "using": "({{jwtrole}} = 'authenticated')",
      "check": null
    }
  ],
  "intentos": [
    {
      "nombre": "Alumno puede actualizar sus intentos",
      "cmd": "UPDATE",
      "anon": true,
      "using": "({{uid}} = id_alumno)",
      "check": null
    },
    {
      "nombre": "Alumno puede guardar sus intentos",
      "cmd": "INSERT",
      "anon": true,
      "using": null,
      "check": "({{uid}} = id_alumno)"
    },
    {
      "nombre": "Alumno ve sus propios intentos",
      "cmd": "SELECT",
      "anon": true,
      "using": "({{uid}} = id_alumno)",
      "check": null
    },
    {
      "nombre": "profesor_ve_intentos_de_su_grupo",
      "cmd": "SELECT",
      "anon": true,
      "using": "((id_alumno = {{uid}}) OR (EXISTS ( SELECT 1\n   FROM (alumnos_grupos ag\n     JOIN grupos g ON ((g.id = ag.id_grupo)))\n  WHERE ((ag.id_alumno = intentos.id_alumno) AND (g.id_profesor = {{uid}})))) OR (EXISTS ( SELECT 1\n   FROM profiles p\n  WHERE ((p.id = {{uid}}) AND (p.role = 'admin')))))",
      "check": null
    }
  ],
  "profiles": [
    {
      "nombre": "Perfiles: el propio, o docentes y admin",
      "cmd": "SELECT",
      "anon": false,
      "using": "(({{uid}} = id) OR ({{role}} IN ('profesor', 'admin')))",
      "check": null
    },
    {
      "nombre": "Usuario puede actualizar su propio perfil",
      "cmd": "UPDATE",
      "anon": true,
      "using": "({{uid}} = id)",
      "check": null
    },
    {
      "nombre": "Usuario puede crear su propio perfil",
      "cmd": "INSERT",
      "anon": true,
      "using": null,
      "check": "({{uid}} = id)"
    }
  ]
}

export type Relacion = { tipo: 'uno' | 'muchos'; local: string; remota: string }
export const RELACIONES: Record<string, Record<string, Relacion>> = {
  "alumnos_grupos": {
    "profiles": {
      "tipo": "uno",
      "local": "id_alumno",
      "remota": "id"
    },
    "grupos": {
      "tipo": "uno",
      "local": "id_grupo",
      "remota": "id"
    }
  },
  "profiles": {
    "alumnos_grupos": {
      "tipo": "muchos",
      "local": "id",
      "remota": "id_alumno"
    },
    "grupos": {
      "tipo": "muchos",
      "local": "id",
      "remota": "id_profesor"
    },
    "intentos": {
      "tipo": "muchos",
      "local": "id",
      "remota": "id_alumno"
    }
  },
  "grupos": {
    "alumnos_grupos": {
      "tipo": "muchos",
      "local": "id",
      "remota": "id_grupo"
    },
    "profiles": {
      "tipo": "uno",
      "local": "id_profesor",
      "remota": "id"
    }
  },
  "intentos": {
    "profiles": {
      "tipo": "uno",
      "local": "id_alumno",
      "remota": "id"
    }
  }
}

/** Funciones de public que existen en producción: rpc.ts responde PGRST202 a las demás, como PostgREST. */
export const FUNCIONES: readonly string[] = ["cen_es_docente","cen_proteger_perfil","handle_new_user","rls_auto_enable"]

/** Columnas que una sesión de usuario no puede leer (permisos por columna de producción). */
export const REVOCADAS: Record<string, ReadonlySet<string>> = {
}
