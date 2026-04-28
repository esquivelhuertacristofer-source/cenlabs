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

async function nuclearClean() {
  console.log('--- INICIANDO LIMPIEZA NUCLEAR ---');
  
  // 1. Limpiar perfiles
  console.log('Borrando perfiles en public.profiles...');
  const { error: pError } = await supabase.from('profiles').delete().neq('id', '00000000-0000-0000-0000-000000000000');
  if (pError) console.error('Error limpiando perfiles:', pError.message);

  // 2. Limpiar Auth Users (los que terminan en @cenlabs.edu)
  console.log('Buscando usuarios en Auth...');
  const { data: { users }, error: uError } = await supabase.auth.admin.listUsers();
  
  if (uError) {
    console.error('Error listando usuarios:', uError.message);
    return;
  }

  const targeted = users.filter(u => u.email?.endsWith('@cenlabs.edu'));
  console.log(`Encontrados ${targeted.length} usuarios para eliminar.`);

  for (const u of targeted) {
    console.log(`Eliminando ${u.email}...`);
    const { error: dError } = await supabase.auth.admin.deleteUser(u.id);
    if (dError) console.error(`Error eliminando ${u.email}:`, dError.message);
  }

  console.log('--- LIMPIEZA COMPLETADA ---');
}

nuclearClean();
