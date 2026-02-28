'use client';

import { useState } from 'react';
import { useXP } from '@/contexts/XPContext';

/**
 * Horario del día con checklist interactivo.
 * Los eventos se cargan desde Supabase (calendar_events) a través de XPContext.
 * Al marcar/desmarcar una actividad se guarda en Supabase (daily_completions).
 */
export default function DailySchedule() {
  const { horarioHoy, completadasHoy, toggleActividad, errorSync } = useXP();
  // IDs de actividades con micro-animación activa al completar
  const [animando, setAnimando] = useState(new Set());

  /** Dispara animación solo al marcar (no al desmarcar) */
  const handleToggle = (id, xp, nombre) => {
    if (!completadasHoy.includes(id)) {
      setAnimando(prev => new Set([...prev, id]));
      setTimeout(() => {
        setAnimando(prev => {
          const next = new Set(prev);
          next.delete(id);
          return next;
        });
      }, 400);
    }
    toggleActividad(id, xp, nombre);
  };

  /** Quita los segundos de una hora en formato HH:MM:SS → HH:MM */
  const formatearHora = (hora) => hora?.slice(0, 5) ?? '';

  if (horarioHoy.length === 0) {
    return (
      <div
        className="bg-card rounded-2xl p-6 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-4xl mb-2">📋</p>
        <p className="text-foreground font-medium">No hay actividades hoy</p>
        <p className="text-sm text-muted mt-1">Agrega eventos desde el calendario</p>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-lg font-semibold text-foreground mb-3">
        Horario de hoy
      </h2>

      {/* Banner de error de sincronización */}
      {errorSync && (
        <div className="mb-3 px-4 py-2 rounded-xl text-sm"
          style={{ backgroundColor: '#FEF2F2', color: '#DC2626' }}
        >
          ⚠️ {errorSync} — los cambios están guardados localmente.
        </div>
      )}

      <div className="space-y-2">
        {horarioHoy.map((actividad) => {
          const completada = completadasHoy.includes(actividad.id);
          // Color principal del evento (hex 6 dígitos), fondo con opacidad ~12%
          const color = actividad.color || '#3B82F6';
          const colorBg = color + '20';

          return (
            <button
              key={actividad.id}
              onClick={() => handleToggle(actividad.id, actividad.xp, actividad.nombre)}
              className="w-full text-left"
            >
              <div
                className={`
                  bg-card rounded-2xl p-4 flex items-center gap-3
                  transition-all duration-200 active:scale-[0.98]
                  ${completada ? 'opacity-70' : ''}
                  ${animando.has(actividad.id) ? 'animate-complete-scale' : ''}
                `}
                style={{
                  boxShadow: 'var(--shadow-card)',
                  borderLeft: `4px solid ${color}`,
                }}
              >
                {/* Checkbox personalizado */}
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    flex-shrink-0 transition-all duration-200
                  `}
                  style={{
                    borderColor: completada ? color : color + '80',
                    backgroundColor: completada ? color : 'transparent',
                  }}
                >
                  {completada && (
                    <svg
                      className="w-3.5 h-3.5 text-white animate-check"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={3}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M5 13l4 4L19 7"
                      />
                    </svg>
                  )}
                </div>

                {/* Emoji del evento — flotante sin fondo */}
                <span className="text-2xl flex-shrink-0">{actividad.emoji}</span>

                {/* Info de la actividad */}
                <div className="flex-1 min-w-0">
                  <p
                    className={`
                      font-medium text-sm
                      ${completada ? 'line-through text-muted' : 'text-foreground'}
                    `}
                  >
                    {actividad.nombre}
                  </p>
                  {actividad.hora && (
                    <p className="text-xs text-muted-light">
                      {formatearHora(actividad.hora)}
                    </p>
                  )}
                </div>

                {/* XP */}
                {actividad.xp > 0 && (
                  <div
                    className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                    style={{
                      backgroundColor: completada ? colorBg : 'var(--card-border)',
                      color: completada ? color : 'var(--muted)',
                    }}
                  >
                    +{actividad.xp} XP
                  </div>
                )}
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
