// scripts/seed-schedule.js
// Inserta el horario fijo del usuario en Supabase usando la service role key.
// Uso: node scripts/seed-schedule.js

import { readFileSync } from 'fs';
import { resolve, dirname } from 'path';
import { fileURLToPath } from 'url';
import { createClient } from '@supabase/supabase-js';

// ---------------------------------------------------------------------------
// Leer y parsear .env.local manualmente (sin depender de dotenv)
// ---------------------------------------------------------------------------
const __dirname = dirname(fileURLToPath(import.meta.url));
const envPath = resolve(__dirname, '../.env.local');

function cargarEnv(ruta) {
  const contenido = readFileSync(ruta, 'utf8');
  const vars = {};
  for (const linea of contenido.split('\n')) {
    const limpia = linea.trim();
    if (!limpia || limpia.startsWith('#')) continue;
    const indiceIgual = limpia.indexOf('=');
    if (indiceIgual === -1) continue;
    const clave = limpia.slice(0, indiceIgual).trim();
    const valor = limpia.slice(indiceIgual + 1).trim().replace(/^["']|["']$/g, '');
    vars[clave] = valor;
  }
  return vars;
}

const env = cargarEnv(envPath);

const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL;
const serviceRoleKey = env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error('❌  Faltan variables de entorno:');
  if (!supabaseUrl)      console.error('   - NEXT_PUBLIC_SUPABASE_URL');
  if (!serviceRoleKey)   console.error('   - SUPABASE_SERVICE_ROLE_KEY');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false },
});

// ---------------------------------------------------------------------------
// Fecha base: hoy
// ---------------------------------------------------------------------------
const hoy = new Date().toISOString().split('T')[0]; // "YYYY-MM-DD"

// ---------------------------------------------------------------------------
// Definición del horario fijo
// ---------------------------------------------------------------------------
const eventos = [
  {
    title: 'Cardio',
    emoji: '🏃',
    color: '#3B82F6',
    start_time: '07:15',
    end_time: '09:00',
    recurrence_days: ['lun', 'mar', 'mie', 'jue', 'vie'],
    xp_reward: 50,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Trabajo',
    emoji: '💻',
    color: '#F39C12',
    start_time: '09:00',
    end_time: '14:00',
    recurrence_days: ['lun', 'mar', 'mie', 'jue', 'vie'],
    xp_reward: 40,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Pesas',
    emoji: '🏋️',
    color: '#9B59B6',
    start_time: '14:30',
    end_time: '16:00',
    recurrence_days: ['lun', 'mie', 'vie'],
    xp_reward: 75,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Curso programación',
    emoji: '👨‍💻',
    color: '#27AE60',
    start_time: '16:30',
    end_time: '18:30',
    recurrence_days: ['lun', 'mar', 'mie', 'vie'],
    xp_reward: 80,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'MMA',
    emoji: '🥊',
    color: '#E74C3C',
    start_time: '20:00',
    end_time: '21:30',
    recurrence_days: ['mar', 'jue'],
    xp_reward: 100,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Pesas Sábado',
    emoji: '🏋️',
    color: '#9B59B6',
    start_time: '08:00',
    end_time: '09:30',
    recurrence_days: ['sab'],
    xp_reward: 75,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Cardio Sábado',
    emoji: '🏃',
    color: '#3B82F6',
    start_time: '14:00',
    end_time: '15:00',
    recurrence_days: ['sab'],
    xp_reward: 50,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Salsa',
    emoji: '💃',
    color: '#E91E8C',
    start_time: '10:00',
    end_time: '13:00',
    recurrence_days: ['dom'],
    xp_reward: 60,
    fixed_schedule: true,
    recurring: true,
  },
  {
    title: 'Curso Domingo',
    emoji: '👨‍💻',
    color: '#27AE60',
    start_time: '14:00',
    end_time: '16:00',
    recurrence_days: ['dom'],
    xp_reward: 80,
    fixed_schedule: true,
    recurring: true,
  },
];

// ---------------------------------------------------------------------------
// Insertar en Supabase
// ---------------------------------------------------------------------------
async function seedSchedule() {
  console.log(`\n📅  Fecha base: ${hoy}`);
  console.log(`🚀  Insertando ${eventos.length} eventos en calendar_events...\n`);

  const filas = eventos.map((ev) => ({
    title: ev.title,
    type: 'evento',
    start_time: ev.start_time,
    end_time: ev.end_time,
    date: hoy,
    color: ev.color,
    recurring: ev.recurring,
    fixed_schedule: ev.fixed_schedule,
    emoji: ev.emoji,
    recurrence_days: ev.recurrence_days,
    xp_reward: ev.xp_reward,
  }));

  const { data, error } = await supabase
    .from('calendar_events')
    .insert(filas)
    .select('id, title');

  if (error) {
    console.error('❌  Error al insertar eventos:', error.message);
    process.exit(1);
  }

  console.log(`✅  Eventos insertados: ${data.length}\n`);
  for (const ev of data) {
    const def = filas.find((f) => f.title === ev.title);
    const dias = def?.recurrence_days?.join(', ') ?? '-';
    console.log(`   [${ev.id}] ${def?.emoji ?? ''} ${ev.title}  (${dias})`);
  }

  console.log('\n✨  Seed completado.\n');
}

seedSchedule();
