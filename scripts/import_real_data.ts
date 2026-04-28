import { createClient } from '@supabase/supabase-js';
import * as dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('ERROR: No se encontraron las llaves en .env.local');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey);

// IDs de grupos pre-cargados en el SQL Maestro
const GRUPO_A_ID = 'a0a0a0a0-a0a0-a0a0-a0a0-a0a0a0a0a0a0';
const GRUPO_B_ID = 'b1b1b1b1-b1b1-b1b1-b1b1-b1b1b1b1b1b1';

const users = [
  // Profesores
  { email: 'prof.valenzuela@cenlabs.edu', fullName: 'Prof. Ricardo Valenzuela', role: 'profesor' },
  { email: 'prof.mendoza@cenlabs.edu', fullName: 'Dra. Elena Mendoza', role: 'profesor' },
  
  // Alumnos - Grupo A
  { email: 'estudiante.jara@cenlabs.edu', fullName: 'Jorge Jara', role: 'alumno', group_id: GRUPO_A_ID },
  { email: 'estudiante.ruiz@cenlabs.edu', fullName: 'Marina Ruiz', role: 'alumno', group_id: GRUPO_A_ID },
  { email: 'estudiante.diaz@cenlabs.edu', fullName: 'Samuel Díaz', role: 'alumno', group_id: GRUPO_A_ID },
  { email: 'estudiante.vega@cenlabs.edu', fullName: 'Sofía Vega', role: 'alumno', group_id: GRUPO_A_ID },
  { email: 'estudiante.cano@cenlabs.edu', fullName: 'Carlos Cano', role: 'alumno', group_id: GRUPO_A_ID },
  
  // Alumnos - Grupo B
  { email: 'estudiante.luna@cenlabs.edu', fullName: 'Beatriz Luna', role: 'alumno', group_id: GRUPO_B_ID },
  { email: 'estudiante.ponce@cenlabs.edu', fullName: 'Mateo Ponce', role: 'alumno', group_id: GRUPO_B_ID },
  { email: 'estudiante.rios@cenlabs.edu', fullName: 'Julia Ríos', role: 'alumno', group_id: GRUPO_B_ID },
  { email: 'estudiante.soto@cenlabs.edu', fullName: 'Fernando Soto', role: 'alumno', group_id: GRUPO_B_ID },
  { email: 'estudiante.alba@cenlabs.edu', fullName: 'Lucía Alba', role: 'alumno', group_id: GRUPO_B_ID },
];

async function runImport() {
  console.log('--- INICIANDO CARGA REAL DE 12 USUARIOS (CON GRUPOS) ---');
  
  for (const user of users) {
    console.log(`Creando ${user.email} con rol ${user.role}...`);
    
    // Metadata que el Trigger interceptará para llenar 'profiles' y 'alumnos_grupos'
    const metadata: any = {
      full_name: user.fullName,
      role: user.role
    };
    
    if (user.role === 'alumno' && user.group_id) {
      metadata.group_id = user.group_id;
    }

    const { data, error } = await supabase.auth.admin.createUser({
      email: user.email,
      password: 'CenLabs2026Password!',
      email_confirm: true,
      user_metadata: metadata
    });

    if (error) {
      console.error(`Error en ${user.email}:`, error.message);
    } else {
      console.log(`ÉXITO: ${user.fullName} creado y asignado.`);
    }
  }
  
  console.log('--- CARGA REAL FINALIZADA CON ÉXITO ---');
}

runImport();
