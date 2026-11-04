-- Generado por scripts/d1/generar.mjs desde la exportación del 2026-11-03.

-- Login propio: auth_users sustituye a auth.users de Supabase.

CREATE TABLE auth_users (
  id TEXT PRIMARY KEY,
  email TEXT NOT NULL UNIQUE,
  encrypted_password TEXT,
  email_confirmed_at TEXT,
  raw_app_meta_data TEXT NOT NULL DEFAULT '{}',
  raw_user_meta_data TEXT NOT NULL DEFAULT '{}',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  updated_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  last_sign_in_at TEXT,
  banned_until TEXT,
  sesion_version INTEGER NOT NULL DEFAULT 1
);

-- Pausa por cuenta tras contraseñas equivocadas (no por IP: una escuela entera sale por una sola IP).
CREATE TABLE auth_fallos (email TEXT PRIMARY KEY, fallos INTEGER NOT NULL DEFAULT 0, desde TEXT NOT NULL);

CREATE TABLE profiles (
  id TEXT NOT NULL,
  email TEXT NOT NULL,
  full_name TEXT DEFAULT 'Usuario Nuevo',
  role TEXT DEFAULT 'alumno',
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  UNIQUE (email),
  FOREIGN KEY (id) REFERENCES auth_users(id) ON DELETE CASCADE,
  PRIMARY KEY (id),
  CHECK ((role IN ('alumno', 'profesor', 'admin')))
);

CREATE TABLE grupos (
  id TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',1+(abs(random())%4),1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6)))),
  nombre TEXT NOT NULL,
  id_profesor TEXT,
  created_at TEXT NOT NULL DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (id_profesor) REFERENCES profiles(id) ON DELETE SET NULL,
  PRIMARY KEY (id)
);

CREATE TABLE alumnos_grupos (
  id_alumno TEXT NOT NULL,
  id_grupo TEXT NOT NULL,
  FOREIGN KEY (id_alumno) REFERENCES profiles(id) ON DELETE CASCADE,
  FOREIGN KEY (id_grupo) REFERENCES grupos(id) ON DELETE CASCADE,
  PRIMARY KEY (id_alumno, id_grupo)
);

CREATE TABLE asignaciones (
  id TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',1+(abs(random())%4),1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6)))),
  id_profesor TEXT NOT NULL,
  sim_id TEXT NOT NULL,
  planned_date TEXT NOT NULL,
  id_grupo TEXT DEFAULT 'all',
  created_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  FOREIGN KEY (id_profesor) REFERENCES auth_users(id),
  PRIMARY KEY (id)
);

CREATE TABLE intentos (
  id TEXT NOT NULL DEFAULT (lower(hex(randomblob(4))||'-'||hex(randomblob(2))||'-4'||substr(hex(randomblob(2)),2)||'-'||substr('89ab',1+(abs(random())%4),1)||substr(hex(randomblob(2)),2)||'-'||hex(randomblob(6)))),
  id_alumno TEXT,
  sim_id TEXT NOT NULL,
  status TEXT DEFAULT 'in_progress',
  score INTEGER DEFAULT 0,
  total_time_seconds INTEGER DEFAULT 0,
  last_step INTEGER DEFAULT 0,
  bitacora_data TEXT,
  started_at TEXT DEFAULT (strftime('%Y-%m-%dT%H:%M:%fZ','now')),
  completed_at TEXT,
  FOREIGN KEY (id_alumno) REFERENCES profiles(id) ON DELETE CASCADE,
  UNIQUE (id_alumno, sim_id, status),
  PRIMARY KEY (id),
  CHECK ((status IN ('in_progress', 'completed', 'abandoned')))
);

CREATE INDEX d1_alumnos_grupos_grupo ON alumnos_grupos (id_grupo);

CREATE INDEX d1_alumnos_grupos_alumno ON alumnos_grupos (id_alumno);

CREATE INDEX d1_grupos_profesor ON grupos (id_profesor);

CREATE INDEX d1_intentos_alumno ON intentos (id_alumno, status);

CREATE INDEX d1_asignaciones_profesor ON asignaciones (id_profesor);

-- El login busca por lower(email): sin esto recorre toda la tabla de usuarios.
CREATE INDEX d1_auth_email_lower ON auth_users (lower(email));
CREATE INDEX d1_auth_creado ON auth_users (created_at);
