'use client';

/**
 * Hábitos - Página placeholder
 * TODO: Rachas, estadísticas, historial
 */
export default function Habitos() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Hábitos</h1>
      <p className="text-muted text-sm mb-6">Rachas y estadísticas</p>

      <div
        className="bg-card rounded-2xl p-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-4xl mb-3">🔥</p>
        <p className="text-foreground font-medium">Próximamente</p>
        <p className="text-sm text-muted mt-1">
          Seguimiento de hábitos y rachas
        </p>
      </div>
    </div>
  );
}
