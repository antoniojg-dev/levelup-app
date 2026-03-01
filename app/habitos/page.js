'use client';

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { useXP } from '@/contexts/XPContext';
import ModalHabito from '@/components/ModalHabito';

// ─── Helpers de fecha ──────────────────────────────────────────────────────────

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function restarDias(fechaStr, dias) {
  const d = new Date(fechaStr + 'T00:00:00');
  d.setDate(d.getDate() - dias);
  return d.toISOString().split('T')[0];
}

function ultimos7Dias() {
  const hoy = fechaHoy();
  return Array.from({ length: 7 }, (_, i) => restarDias(hoy, 6 - i));
}

// Días desde el lunes de esta semana hasta hoy (inclusive)
function diasSemanaActual() {
  const hoy = new Date(fechaHoy() + 'T00:00:00');
  const diaSemana = hoy.getDay(); // 0=domingo, 1=lunes...
  const diasDesdelunes = diaSemana === 0 ? 6 : diaSemana - 1;
  return Array.from({ length: diasDesdelunes + 1 }, (_, i) => {
    const d = new Date(hoy);
    d.setDate(d.getDate() - diasDesdelunes + i);
    return d.toISOString().split('T')[0];
  });
}

const LETRAS_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function letraDia(fechaStr) {
  return LETRAS_DIA[new Date(fechaStr + 'T00:00:00').getDay()];
}

// ─── Cálculos de racha ─────────────────────────────────────────────────────────

function calcularRachaActual(logs) {
  const hoy = fechaHoy();
  const set = new Set(logs);
  let racha = 0;
  let fecha = hoy;
  while (set.has(fecha)) {
    racha++;
    const d = new Date(fecha + 'T00:00:00');
    d.setDate(d.getDate() - 1);
    fecha = d.toISOString().split('T')[0];
  }
  return racha;
}

function calcularRachaMaxima(logs) {
  if (!logs.length) return 0;
  const sorted = [...logs].sort();
  let max = 1;
  let actual = 1;
  for (let i = 1; i < sorted.length; i++) {
    const prev = new Date(sorted[i - 1] + 'T00:00:00');
    const curr = new Date(sorted[i] + 'T00:00:00');
    const diff = (curr - prev) / (1000 * 60 * 60 * 24);
    if (diff === 1) {
      actual++;
      if (actual > max) max = actual;
    } else if (diff > 1) {
      actual = 1;
    }
  }
  return max;
}

// ─── HabitCard ────────────────────────────────────────────────────────────────

function HabitCard({ habito, logs7, onTap, onCompletar }) {
  const hoy = fechaHoy();
  const [animando, setAnimando] = useState(false);
  const dias = ultimos7Dias();
  const diasSemana = diasSemanaActual();
  const completadoHoy = logs7.includes(hoy);
  const completadosDias = diasSemana.filter(d => logs7.includes(d)).length;
  const meta = diasSemana.length;
  const progreso = meta > 0 ? Math.min(completadosDias / meta, 1) : 0;
  const racha = calcularRachaActual(logs7);

  const handleCompletar = (e) => {
    e.stopPropagation();
    setAnimando(true);
    onCompletar(habito.id, completadoHoy);
    setTimeout(() => setAnimando(false), 400);
  };

  return (
    <div
      onClick={() => onTap(habito)}
      role="button"
      tabIndex={0}
      className="w-full rounded-2xl p-4 cursor-pointer select-none transition-all active:scale-[0.98]"
      style={{
        backgroundColor: completadoHoy ? '#F0FDF4' : 'var(--card)',
        boxShadow: 'var(--shadow-card)',
        borderLeft: `4px solid ${completadoHoy ? '#22C55E' : 'transparent'}`,
      }}
    >
      <div className="flex items-center gap-3 mb-3">
        {/* Emoji con fondo de color */}
        <div
          className="w-11 h-11 rounded-xl flex items-center justify-center text-xl flex-shrink-0"
          style={{ backgroundColor: habito.color + '20' }}
        >
          {habito.emoji || habito.icon || '💪'}
        </div>

        <div className="flex-1 min-w-0">
          <p className="font-semibold text-foreground text-sm truncate">{habito.name}</p>
          {racha > 0 && (
            <p className="text-xs text-muted mt-0.5">
              🔥 {racha} día{racha !== 1 ? 's' : ''} de racha
            </p>
          )}
        </div>

        {/* Botón completar (toggle) */}
        <button
          onClick={handleCompletar}
          className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${animando ? 'scale-125' : 'scale-100'}`}
          style={{ backgroundColor: completadoHoy ? '#22C55E' : 'var(--card-border)' }}
          aria-label={completadoHoy ? 'Desmarcar hábito' : 'Marcar hábito como completado'}
        >
          {completadoHoy ? (
            <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          ) : (
            <div className="w-3 h-3 rounded-full" style={{ backgroundColor: habito.color + '60' }} />
          )}
        </button>
      </div>

      {/* Mini calendario de 7 días */}
      <div className="flex gap-1 mb-2.5">
        {dias.map(d => {
          const completado = logs7.includes(d);
          const esHoy = d === hoy;
          return (
            <div key={d} className="flex-1 flex flex-col items-center gap-0.5">
              <span className="text-[9px] text-muted">{letraDia(d)}</span>
              <div
                className="w-full aspect-square rounded-full"
                style={{
                  backgroundColor: completado
                    ? (completadoHoy && esHoy ? '#22C55E' : habito.color)
                    : esHoy
                    ? habito.color + '30'
                    : 'var(--card-border)',
                  outline: esHoy ? `2px solid ${completadoHoy ? '#22C55E' : habito.color}` : 'none',
                  outlineOffset: '1px',
                  maxWidth: '22px',
                  margin: '0 auto',
                }}
              />
            </div>
          );
        })}
      </div>

      {/* Barra de progreso — X/días transcurridos esta semana */}
      <div className="flex items-center gap-2">
        <div className="flex-1 h-1.5 bg-card-border rounded-full overflow-hidden">
          <div
            className="h-full rounded-full progress-bar"
            style={{
              width: `${progreso * 100}%`,
              backgroundColor: completadoHoy ? '#22C55E' : habito.color,
            }}
          />
        </div>
        <span className="text-xs text-muted flex-shrink-0">{completadosDias}/{meta}</span>
      </div>
    </div>
  );
}

// ─── Modal Detalle Hábito ─────────────────────────────────────────────────────

function ModalDetalleHabito({
  habito, logs7, todosLogs, eventosCalendario,
  onCerrar, onToggle, onEditar, onEliminar,
}) {
  if (!habito) return null;

  const hoy = fechaHoy();
  const completadoHoy = logs7.includes(hoy);
  const racha = calcularRachaActual(todosLogs);
  const record = calcularRachaMaxima(todosLogs);
  const diasSemana = ultimos7Dias();

  const eventosVinculados = (habito.linked_event_ids || [])
    .map(id => eventosCalendario.find(e => e.id === id))
    .filter(Boolean);
  const tieneVinculo = eventosVinculados.length > 0;

  return (
    <>
      <div className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm" onClick={onCerrar} />
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto max-h-[88vh] flex flex-col slide-up">
        <div className="bg-card rounded-t-3xl shadow-xl flex flex-col max-h-[88vh]">

          {/* Handle */}
          <div className="pt-3 pb-1 flex justify-center flex-shrink-0">
            <div className="w-10 h-1 bg-card-border rounded-full" />
          </div>

          {/* Header */}
          <div className="px-6 py-4 border-b border-card-border flex-shrink-0">
            <div className="flex items-center gap-3">
              <div
                className="w-14 h-14 rounded-2xl flex items-center justify-center text-3xl flex-shrink-0"
                style={{ backgroundColor: habito.color + '20' }}
              >
                {habito.emoji || habito.icon || '💪'}
              </div>
              <div className="flex-1 min-w-0">
                <h2 className="text-lg font-bold text-foreground truncate">{habito.name}</h2>
                <div className="flex items-center gap-2 mt-0.5 flex-wrap">
                  <span
                    className="text-xs px-2 py-0.5 rounded-full"
                    style={{ backgroundColor: habito.color + '20', color: habito.color }}
                  >
                    {habito.frequency === 'daily' ? 'Diario' : 'Semanal'}
                  </span>
                  {habito.description && (
                    <span className="text-xs text-muted line-clamp-1">{habito.description}</span>
                  )}
                </div>
              </div>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-muted text-sm active:opacity-60 flex-shrink-0"
              >
                ✕
              </button>
            </div>
          </div>

          <div className="px-6 py-5 space-y-5 overflow-y-auto">

            {/* Stats racha */}
            <div className="grid grid-cols-2 gap-3">
              <div className="bg-background rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{racha}</p>
                <p className="text-xs text-muted mt-0.5">🔥 Racha actual</p>
              </div>
              <div className="bg-background rounded-2xl p-3 text-center">
                <p className="text-2xl font-bold text-foreground">{record}</p>
                <p className="text-xs text-muted mt-0.5">🏆 Récord</p>
              </div>
            </div>

            {/* Calendario de los últimos 7 días */}
            <div>
              <p className="text-xs font-medium text-muted mb-3">Últimos 7 días</p>
              <div className="flex gap-2">
                {diasSemana.map(d => {
                  const completado = todosLogs.includes(d);
                  const esHoy = d === hoy;
                  const esFuturo = d > hoy;
                  return (
                    <div key={d} className="flex-1 flex flex-col items-center gap-1">
                      <span className="text-[10px] text-muted">{letraDia(d)}</span>
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center"
                        style={{
                          backgroundColor: completado
                            ? habito.color
                            : esFuturo
                            ? 'var(--card-border)'
                            : 'var(--danger-light)',
                          outline: esHoy ? `2px solid ${habito.color}` : 'none',
                          outlineOffset: '2px',
                        }}
                      >
                        {completado ? (
                          <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                          </svg>
                        ) : !esFuturo ? (
                          <span className="text-xs font-bold" style={{ color: 'var(--danger)' }}>✕</span>
                        ) : null}
                      </div>
                      <span className="text-[9px] text-muted">
                        {new Date(d + 'T00:00:00').getDate()}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Eventos vinculados */}
            {tieneVinculo && (
              <div>
                <p className="text-xs font-medium text-muted mb-2">Vinculado a</p>
                <div className="space-y-1.5">
                  {eventosVinculados.map(ev => (
                    <div
                      key={ev.id}
                      className="flex items-center gap-2 px-3 py-2 rounded-xl"
                      style={{ backgroundColor: (ev.color || habito.color) + '15' }}
                    >
                      <span>{ev.emoji || '📅'}</span>
                      <span className="flex-1 text-sm text-foreground font-medium">{ev.title}</span>
                      <span className="text-xs text-muted">Auto ✓</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Botón toggle completado — funciona para todos los hábitos */}
            <button
              onClick={() => onToggle(habito.id, completadoHoy)}
              className="w-full h-12 rounded-xl font-semibold text-sm transition-all active:opacity-80"
              style={{
                backgroundColor: completadoHoy ? '#F0FDF4' : habito.color,
                color: completadoHoy ? '#22C55E' : 'white',
                border: completadoHoy ? '2px solid #22C55E' : 'none',
              }}
            >
              {completadoHoy ? '✓ Completado · Toca para desmarcar' : 'Marcar como completado hoy'}
            </button>
            {tieneVinculo && !completadoHoy && (
              <p className="text-xs text-center text-muted -mt-2">
                También se completa al marcar las actividades vinculadas
              </p>
            )}

            {/* Editar / Eliminar */}
            <div className="flex gap-2 pb-2">
              <button
                onClick={() => onEditar(habito)}
                className="flex-1 h-10 rounded-xl text-sm font-medium border border-card-border text-foreground active:opacity-70"
              >
                Editar
              </button>
              <button
                onClick={() => onEliminar(habito.id)}
                className="flex-1 h-10 rounded-xl text-sm font-medium active:opacity-70"
                style={{ backgroundColor: 'var(--danger-light)', color: 'var(--danger)' }}
              >
                Eliminar
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

// ─── Estadísticas semanales con barras CSS ─────────────────────────────────────

function EstadisticasSemanales({ logsMap, habitos }) {
  const dias = ultimos7Dias();
  const hoy = fechaHoy();
  const maxPorDia = habitos.length || 1;

  const totalCompletados = dias.reduce(
    (acc, d) => acc + habitos.filter(h => (logsMap[h.id] || []).includes(d)).length,
    0
  );
  const diasActivos = dias.filter(
    d => habitos.some(h => (logsMap[h.id] || []).includes(d))
  ).length;
  const completitud = habitos.length > 0
    ? Math.round((totalCompletados / (habitos.length * 7)) * 100)
    : 0;

  return (
    <div className="bg-card rounded-2xl p-4" style={{ boxShadow: 'var(--shadow-card)' }}>
      <p className="font-semibold text-foreground text-sm mb-4">Esta semana</p>

      {/* Barras CSS */}
      <div className="flex items-end gap-1.5" style={{ height: '56px' }}>
        {dias.map(d => {
          const count = habitos.filter(h => (logsMap[h.id] || []).includes(d)).length;
          const pct = count / maxPorDia;
          const esHoy = d === hoy;
          return (
            <div key={d} className="flex-1 flex flex-col items-center justify-end gap-1">
              <div
                className="w-full rounded-t-lg transition-all duration-500"
                style={{
                  height: `${Math.max(pct * 44, count > 0 ? 6 : 2)}px`,
                  backgroundColor: esHoy
                    ? 'var(--accent)'
                    : pct > 0
                    ? 'var(--accent-light)'
                    : 'var(--card-border)',
                  minHeight: '2px',
                }}
              />
              <span className="text-[9px] text-muted">{letraDia(d)}</span>
            </div>
          );
        })}
      </div>

      {/* Métricas */}
      <div className="flex justify-between mt-4 pt-3 border-t border-card-border">
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{totalCompletados}</p>
          <p className="text-xs text-muted">completados</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{diasActivos}</p>
          <p className="text-xs text-muted">días activos</p>
        </div>
        <div className="text-center">
          <p className="text-sm font-bold text-foreground">{completitud}%</p>
          <p className="text-xs text-muted">completitud</p>
        </div>
      </div>
    </div>
  );
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function Habitos() {
  const { racha, habitosVersion, invalidarHabitos } = useXP();

  const [habitos, setHabitos]               = useState([]);
  const [logsMap, setLogsMap]               = useState({});     // { habitId: ['2026-02-28', ...] } últimos 7 días
  const [todosLogsMap, setTodosLogsMap]     = useState({});     // todos los logs para racha máxima
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [cargando, setCargando]             = useState(true);
  const [habitoDetalle, setHabitoDetalle]   = useState(null);
  const [modalHabito, setModalHabito]       = useState(false);
  const [habitoEditando, setHabitoEditando] = useState(null);
  const [version, setVersion]               = useState(0);

  const recargar = useCallback(() => setVersion(v => v + 1), []);

  // Recargar cuando el FAB cree un hábito nuevo
  useEffect(() => {
    if (habitosVersion > 0) recargar();
  }, [habitosVersion]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      try {
        const hoy = fechaHoy();
        const hace7 = restarDias(hoy, 6);

        const [
          { data: habitosData },
          { data: logsRecientes },
          { data: todosLogs },
          { data: eventos },
        ] = await Promise.all([
          supabase.from('habits').select('*').order('created_at', { ascending: true }),
          supabase.from('habit_logs').select('habit_id, completed_date')
            .gte('completed_date', hace7).lte('completed_date', hoy),
          supabase.from('habit_logs').select('habit_id, completed_date'),
          supabase.from('calendar_events').select('id, title, emoji, color').order('title'),
        ]);

        // Construir mapas { habitId: [fechas] }
        const map7 = {};
        (logsRecientes || []).forEach(l => {
          if (!map7[l.habit_id]) map7[l.habit_id] = [];
          map7[l.habit_id].push(l.completed_date);
        });

        const mapTodos = {};
        (todosLogs || []).forEach(l => {
          if (!mapTodos[l.habit_id]) mapTodos[l.habit_id] = [];
          mapTodos[l.habit_id].push(l.completed_date);
        });

        setHabitos(habitosData || []);
        setLogsMap(map7);
        setTodosLogsMap(mapTodos);
        setEventosCalendario(eventos || []);
      } catch (e) {
        console.error('Error cargando hábitos:', e);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [version]);

  // ─── Stats globales ────────────────────────────────────────────────────────
  const diasSemana = ultimos7Dias();

  const mejorRachaHabitos = habitos.reduce((max, h) => {
    const r = calcularRachaMaxima(todosLogsMap[h.id] || []);
    return Math.max(max, r);
  }, 0);

  const completadosEstaSemana = diasSemana.reduce(
    (acc, d) => acc + habitos.filter(h => (logsMap[h.id] || []).includes(d)).length,
    0
  );

  // ─── Acciones ──────────────────────────────────────────────────────────────
  const toggleHabito = async (habitId, yaCompletado) => {
    const hoy = fechaHoy();

    // Actualización optimista en ambos mapas
    const actualizarMap = (prev) => {
      const arr = prev[habitId] || [];
      if (yaCompletado) return { ...prev, [habitId]: arr.filter(d => d !== hoy) };
      if (arr.includes(hoy)) return prev;
      return { ...prev, [habitId]: [...arr, hoy] };
    };
    setLogsMap(actualizarMap);
    setTodosLogsMap(actualizarMap);

    try {
      if (yaCompletado) {
        await supabase.from('habit_logs')
          .delete()
          .eq('habit_id', habitId)
          .eq('completed_date', hoy);
      } else {
        await supabase.from('habit_logs').upsert(
          { habit_id: habitId, completed_date: hoy },
          { onConflict: 'habit_id,completed_date' }
        );
      }
    } catch (e) {
      console.error('Error toggling hábito:', e);
      recargar(); // Revertir en caso de error
    }
  };

  const eliminarHabito = async (habitId) => {
    try {
      await supabase.from('habits').delete().eq('id', habitId);
      recargar();
      setHabitoDetalle(null);
    } catch (e) {
      console.error('Error eliminando hábito:', e);
    }
  };

  const abrirEditar = (habito) => {
    setHabitoDetalle(null);
    setHabitoEditando(habito);
    setModalHabito(true);
  };

  // ─── Skeleton ──────────────────────────────────────────────────────────────
  if (cargando) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-6 bg-card rounded-xl w-1/3" />
        <div className="h-20 bg-card rounded-2xl" />
        <div className="space-y-3">
          {[1, 2, 3].map(i => <div key={i} className="h-28 bg-card rounded-2xl" />)}
        </div>
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-foreground mb-1">Hábitos</h1>
      <p className="text-sm text-muted mb-5">Rachas y estadísticas</p>

      {/* Header de stats */}
      <div
        className="bg-card rounded-2xl p-4 mb-5"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div className="grid grid-cols-3 divide-x divide-card-border">
          <div className="text-center pr-3">
            <p className="text-2xl font-bold text-foreground">{racha}</p>
            <p className="text-xs text-muted mt-0.5">🔥 Racha actual</p>
          </div>
          <div className="text-center px-3">
            <p className="text-2xl font-bold text-foreground">{mejorRachaHabitos}</p>
            <p className="text-xs text-muted mt-0.5">🏆 Récord hábitos</p>
          </div>
          <div className="text-center pl-3">
            <p className="text-2xl font-bold text-foreground">{completadosEstaSemana}</p>
            <p className="text-xs text-muted mt-0.5">✅ Esta semana</p>
          </div>
        </div>
      </div>

      {/* Lista de hábitos */}
      {habitos.length === 0 ? (
        <div
          className="bg-card rounded-2xl p-8 text-center mb-5"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-4xl mb-3">💪</p>
          <p className="text-foreground font-medium">Sin hábitos aún</p>
          <p className="text-sm text-muted mt-1">
            Toca el botón + para crear tu primer hábito
          </p>
        </div>
      ) : (
        <div className="space-y-3 mb-5">
          {habitos.map(h => (
            <HabitCard
              key={h.id}
              habito={h}
              logs7={logsMap[h.id] || []}
              onTap={setHabitoDetalle}
              onCompletar={toggleHabito}
            />
          ))}
        </div>
      )}

      {/* Estadísticas semanales */}
      {habitos.length > 0 && (
        <div className="mb-5">
          <EstadisticasSemanales logsMap={logsMap} habitos={habitos} />
        </div>
      )}

      {/* Modal detalle */}
      {habitoDetalle && (
        <ModalDetalleHabito
          habito={habitoDetalle}
          logs7={logsMap[habitoDetalle.id] || []}
          todosLogs={todosLogsMap[habitoDetalle.id] || []}
          eventosCalendario={eventosCalendario}
          onCerrar={() => setHabitoDetalle(null)}
          onToggle={toggleHabito}
          onEditar={abrirEditar}
          onEliminar={eliminarHabito}
        />
      )}

      {/* Modal crear/editar hábito */}
      <ModalHabito
        visible={modalHabito}
        habitoInicial={habitoEditando}
        onCerrar={() => { setModalHabito(false); setHabitoEditando(null); }}
        onGuardado={recargar}
      />
    </>
  );
}
