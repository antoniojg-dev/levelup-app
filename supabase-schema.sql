-- =========================================================
-- Mi Vida App - Schema de Supabase
-- Ejecutar en: Supabase Dashboard > SQL Editor
-- =========================================================
-- NOTA: RLS está desactivado (app monousuario sin auth).
-- Activarlo cuando se implemente autenticación.
-- =========================================================


-- =========================================================
-- 1. user_progress
-- Una sola fila (id = 1) que guarda el estado global del usuario
-- =========================================================
CREATE TABLE IF NOT EXISTS user_progress (
  id         bigint      PRIMARY KEY DEFAULT 1,
  xp         integer     NOT NULL DEFAULT 0,
  rank       text        NOT NULL DEFAULT 'F',
  streak     integer     NOT NULL DEFAULT 0,
  last_activity_date date,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE user_progress DISABLE ROW LEVEL SECURITY;


-- =========================================================
-- 2. daily_completions
-- Registra cada actividad del horario completada por día
-- =========================================================
CREATE TABLE IF NOT EXISTS daily_completions (
  id            bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  date          date        NOT NULL,
  activity_id   text        NOT NULL,
  activity_name text        NOT NULL,
  xp_earned     integer     NOT NULL DEFAULT 0,
  completed_at  timestamptz NOT NULL DEFAULT now(),
  UNIQUE (date, activity_id)  -- evita duplicados si se re-marca
);

ALTER TABLE daily_completions DISABLE ROW LEVEL SECURITY;

-- Índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_daily_completions_date
  ON daily_completions (date);


-- =========================================================
-- 3. habits
-- Hábitos configurados por el usuario
-- =========================================================
CREATE TABLE IF NOT EXISTS habits (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name        text        NOT NULL,
  description text,
  frequency   text        NOT NULL DEFAULT 'daily',  -- daily | weekly | custom
  color       text        NOT NULL DEFAULT '#3B82F6',
  icon        text,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE habits DISABLE ROW LEVEL SECURITY;


-- =========================================================
-- 4. habit_logs
-- Registra cada vez que se completa un hábito
-- =========================================================
CREATE TABLE IF NOT EXISTS habit_logs (
  id             bigint GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  habit_id       bigint NOT NULL REFERENCES habits (id) ON DELETE CASCADE,
  completed_date date   NOT NULL,
  created_at     timestamptz NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_date)  -- un log por hábito por día
);

ALTER TABLE habit_logs DISABLE ROW LEVEL SECURITY;

-- Índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_habit_logs_completed_date
  ON habit_logs (completed_date);


-- =========================================================
-- 5. tasks
-- Tareas con fecha límite y recompensa en XP
-- =========================================================
CREATE TABLE IF NOT EXISTS tasks (
  id          bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title       text        NOT NULL,
  description text,
  due_date    date,
  completed   boolean     NOT NULL DEFAULT false,
  xp_reward   integer     NOT NULL DEFAULT 0,
  created_at  timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE tasks DISABLE ROW LEVEL SECURITY;


-- =========================================================
-- 6. calendar_events
-- Eventos del calendario (únicos o recurrentes)
-- =========================================================
CREATE TABLE IF NOT EXISTS calendar_events (
  id         bigint      GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  title      text        NOT NULL,
  type       text        NOT NULL DEFAULT 'evento',  -- evento | tarea | recordatorio
  start_time time,
  end_time   time,
  date       date        NOT NULL,
  color      text        NOT NULL DEFAULT '#3B82F6',
  recurring  boolean     NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);

ALTER TABLE calendar_events DISABLE ROW LEVEL SECURITY;

-- Índice para consultas por fecha
CREATE INDEX IF NOT EXISTS idx_calendar_events_date
  ON calendar_events (date);
