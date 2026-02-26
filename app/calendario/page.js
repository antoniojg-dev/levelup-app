'use client';

/**
 * Calendario & Tareas - Página placeholder
 * TODO: Horario semanal editable con drag & drop
 */
export default function Calendario() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Calendario</h1>
      <p className="text-muted text-sm mb-6">Horario semanal y tareas</p>

      <div
        className="bg-card rounded-2xl p-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-4xl mb-3">📅</p>
        <p className="text-foreground font-medium">Próximamente</p>
        <p className="text-sm text-muted mt-1">
          Vista semanal con drag & drop
        </p>
      </div>
    </div>
  );
}
