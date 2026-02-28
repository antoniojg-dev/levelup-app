'use client';

/**
 * Tarjeta de evento — cuatro variantes según contexto:
 *   bloque-dia    → bloque en timeline de día (ocupa alto proporcional)
 *   bloque-3dias  → bloque en timeline 3 días (compacto, título ≤8 chars)
 *   semana        → chip horizontal para lista colapsable de semana
 *   dia (default) → tarjeta completa en lista (no se usa en timeline)
 */
export default function EventCard({ evento, vista = 'dia', onClick }) {
  const color   = evento.color || '#3B82F6';
  const colorBg = color + '20';

  const formatHora = (t) => (t ? t.slice(0, 5).replace(/^0/, '') : '');

  // ── bloque-dia: llena el contenedor absoluto del timeline ────────────────
  if (vista === 'bloque-dia') {
    const hora = evento.start_time
      ? evento.end_time
        ? `${formatHora(evento.start_time)} – ${formatHora(evento.end_time)}`
        : formatHora(evento.start_time)
      : '';

    return (
      <button
        onClick={onClick}
        title={evento.title}
        style={{
          width: '100%',
          height: '100%',
          textAlign: 'left',
          backgroundColor: colorBg,
          borderLeft: `3px solid ${color}`,
          borderRadius: 8,
          padding: '3px 6px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 4, minWidth: 0 }}>
          <span style={{ fontSize: 13, lineHeight: 1, flexShrink: 0 }}>{evento.emoji || '📅'}</span>
          <span
            style={{
              fontSize: 11,
              fontWeight: 600,
              color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {evento.title}
          </span>
        </div>
        {hora && (
          <span style={{ fontSize: 10, color: 'var(--muted)', lineHeight: 1, marginTop: 2 }}>
            {hora}
          </span>
        )}
        {evento.xp_reward > 0 && (
          <span style={{ fontSize: 9, color, lineHeight: 1, marginTop: 1 }}>
            +{evento.xp_reward} XP
          </span>
        )}
      </button>
    );
  }

  // ── bloque-3dias: compacto, título truncado ───────────────────────────────
  if (vista === 'bloque-3dias') {
    const titulo =
      evento.title.length > 8 ? evento.title.slice(0, 8) + '…' : evento.title;
    const hora = evento.start_time ? formatHora(evento.start_time) : '';

    return (
      <button
        onClick={onClick}
        title={evento.title}
        style={{
          width: '100%',
          height: '100%',
          textAlign: 'left',
          backgroundColor: colorBg,
          borderLeft: `2px solid ${color}`,
          borderRadius: 6,
          padding: '2px 4px',
          overflow: 'hidden',
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'flex-start',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 2, minWidth: 0 }}>
          <span style={{ fontSize: 10, lineHeight: 1, flexShrink: 0 }}>{evento.emoji || '📅'}</span>
          <span
            style={{
              fontSize: 9,
              fontWeight: 600,
              color,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap',
              lineHeight: 1.2,
            }}
          >
            {titulo}
          </span>
        </div>
        {hora && (
          <span style={{ fontSize: 8, color: 'var(--muted)', lineHeight: 1, marginTop: 1 }}>
            {hora}
          </span>
        )}
      </button>
    );
  }

  // ── semana: chip horizontal ───────────────────────────────────────────────
  if (vista === 'semana') {
    const titulo =
      evento.title.length > 8 ? evento.title.slice(0, 8) + '…' : evento.title;

    return (
      <button
        onClick={onClick}
        title={evento.title}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 4,
          backgroundColor: colorBg,
          border: `1px solid ${color}40`,
          borderRadius: 20,
          padding: '4px 8px',
          cursor: 'pointer',
          WebkitTapHighlightColor: 'transparent',
          flexShrink: 0,
        }}
      >
        <span style={{ fontSize: 12, lineHeight: 1 }}>{evento.emoji || '📅'}</span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color,
            whiteSpace: 'nowrap',
            lineHeight: 1,
          }}
        >
          {titulo}
        </span>
      </button>
    );
  }

  // ── dia: tarjeta completa (vista lista) ──────────────────────────────────
  const hora = evento.start_time
    ? evento.end_time
      ? `${formatHora(evento.start_time)} – ${formatHora(evento.end_time)}`
      : formatHora(evento.start_time)
    : '';

  return (
    <button onClick={onClick} className="w-full mb-2 text-left">
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
        {evento.fixed_schedule && <span className="text-sm flex-shrink-0">🔒</span>}
      </div>
    </button>
  );
}
