'use client';

/**
 * Asistente IA - Página placeholder
 * TODO: Chat con Anthropic API para mover horario y generar tareas
 */
export default function Asistente() {
  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Asistente IA</h1>
      <p className="text-muted text-sm mb-6">Tu asistente personal</p>

      <div
        className="bg-card rounded-2xl p-8 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-4xl mb-3">✨</p>
        <p className="text-foreground font-medium">Próximamente</p>
        <p className="text-sm text-muted mt-1">
          Chat IA para reorganizar tu horario y crear tareas
        </p>
      </div>
    </div>
  );
}
