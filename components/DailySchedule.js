'use client';

import { useXP } from '@/contexts/XPContext';
import { ICONOS_ACTIVIDAD, COLORES_ACTIVIDAD } from '@/lib/schedule';

/**
 * Horario del día con checklist interactivo.
 * Al marcar/desmarcar una actividad se guarda en Supabase (daily_completions)
 * a través de toggleActividad en XPContext.
 */
export default function DailySchedule() {
  const { horarioHoy, completadasHoy, toggleActividad, errorSync } = useXP();

  if (horarioHoy.length === 0) {
    return (
      <div
        className="bg-card rounded-2xl p-6 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-4xl mb-2">🎉</p>
        <p className="text-foreground font-medium">Día libre</p>
        <p className="text-sm text-muted mt-1">Disfruta tu descanso</p>
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
          const icono = ICONOS_ACTIVIDAD[actividad.tipo];
          const colores = COLORES_ACTIVIDAD[actividad.tipo];

          return (
            <button
              key={actividad.id}
              onClick={() => toggleActividad(actividad.id, actividad.xp, actividad.nombre)}
              className="w-full text-left"
            >
              <div
                className={`
                  bg-card rounded-2xl p-4 flex items-center gap-3
                  transition-all duration-200 active:scale-[0.98]
                  ${completada ? 'opacity-70' : ''}
                `}
                style={{
                  boxShadow: 'var(--shadow-card)',
                  borderLeft: `4px solid ${colores.border}`,
                }}
              >
                {/* Checkbox personalizado */}
                <div
                  className={`
                    w-6 h-6 rounded-full border-2 flex items-center justify-center
                    flex-shrink-0 transition-all duration-200
                  `}
                  style={{
                    borderColor: completada ? colores.text : colores.border,
                    backgroundColor: completada ? colores.text : 'transparent',
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

                {/* Icono de actividad */}
                <div
                  className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: colores.bg }}
                >
                  <span className="text-lg">{icono}</span>
                </div>

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
                  <p className="text-xs text-muted-light">
                    {actividad.hora}
                  </p>
                </div>

                {/* XP */}
                <div
                  className="text-xs font-semibold px-2 py-1 rounded-lg flex-shrink-0"
                  style={{
                    backgroundColor: completada ? colores.bg : 'var(--card-border)',
                    color: completada ? colores.text : 'var(--muted)',
                  }}
                >
                  +{actividad.xp} XP
                </div>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
}
