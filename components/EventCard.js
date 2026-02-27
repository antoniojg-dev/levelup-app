'use client';

/**
 * Tarjeta de evento para la vista del calendario.
 * Tres niveles de densidad según la vista activa.
 */
export default function EventCard({ evento, vista = 'dia', onClick }) {
  const color = evento.color || '#3B82F6';
  const colorBg = color + '18'; // ~10% opacidad

  const formatHora = (t) => t ? t.substring(0, 5).replace(/^0/, '') : '';

  // ── Vista semana: bloque ultra-compacto, solo emoji ───────────────────────
  if (vista === 'semana') {
    return (
      <button
        onClick={onClick}
        className="w-full mb-0.5 text-left"
        title={evento.title}
      >
        <div
          className="rounded-md px-1 py-0.5 flex items-center gap-0.5 transition-opacity active:opacity-60"
          style={{ backgroundColor: colorBg, borderLeft: `2px solid ${color}` }}
        >
          <span className="text-[11px] leading-none">{evento.emoji || '📅'}</span>
          <span
            className="text-[9px] font-medium truncate leading-tight"
            style={{ color }}
          >
            {evento.title}
          </span>
        </div>
      </button>
    );
  }

  // ── Vista 3 días: compacta, emoji + título ────────────────────────────────
  if (vista === '3dias') {
    return (
      <button
        onClick={onClick}
        className="w-full mb-1 text-left"
      >
        <div
          className="rounded-lg p-1.5 flex items-start gap-1 transition-opacity active:opacity-60"
          style={{ backgroundColor: colorBg, borderLeft: `2px solid ${color}` }}
        >
          <span className="text-xs leading-none mt-0.5">{evento.emoji || '📅'}</span>
          <div className="flex-1 min-w-0">
            <p
              className="text-[11px] font-semibold leading-tight truncate"
              style={{ color }}
            >
              {evento.title}
            </p>
            {evento.start_time && (
              <p className="text-[10px] text-muted-light leading-tight">
                {formatHora(evento.start_time)}
              </p>
            )}
          </div>
          {evento.fixed_schedule && (
            <span className="text-[10px] flex-shrink-0">🔒</span>
          )}
        </div>
      </button>
    );
  }

  // ── Vista día: completa ───────────────────────────────────────────────────
  const hora = evento.start_time
    ? evento.end_time
      ? `${formatHora(evento.start_time)} – ${formatHora(evento.end_time)}`
      : formatHora(evento.start_time)
    : '';

  return (
    <button
      onClick={onClick}
      className="w-full mb-2 text-left"
    >
      <div
        className="rounded-xl p-3 flex items-center gap-3 transition-opacity active:opacity-70"
        style={{
          backgroundColor: colorBg,
          borderLeft: `3px solid ${color}`,
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <span className="text-xl flex-shrink-0">{evento.emoji || '📅'}</span>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground truncate">{evento.title}</p>
          {hora && <p className="text-xs text-muted mt-0.5">{hora}</p>}
          {evento.xp_reward > 0 && (
            <span className="text-xs font-medium mt-0.5 block" style={{ color }}>
              +{evento.xp_reward} XP
            </span>
          )}
        </div>
        {evento.fixed_schedule && (
          <span className="text-sm flex-shrink-0">🔒</span>
        )}
      </div>
    </button>
  );
}
