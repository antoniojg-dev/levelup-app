'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';

/**
 * Sheet para crear una nueva tarea.
 * Props:
 *   visible    — boolean
 *   onCerrar   — callback al cerrar
 *   onGuardado — callback tras guardar exitosamente
 */
export default function ModalTarea({ visible, onCerrar, onGuardado }) {
  const [emoji, setEmoji]       = useState('✅');
  const [titulo, setTitulo]     = useState('');
  const [fecha, setFecha]       = useState('');
  const [xp, setXp]             = useState(0);
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState('');

  const guardar = async () => {
    if (!titulo.trim()) { setError('El título es obligatorio'); return; }

    setGuardando(true);
    setError('');

    try {
      const { error: err } = await supabase.from('tasks').insert({
        title: titulo.trim(),
        description: '',
        due_date: fecha || null,
        xp_reward: Number(xp) || 0,
      });
      if (err) throw err;

      onGuardado?.();
      onCerrar();
      // Resetear para próxima apertura
      setTitulo('');
      setEmoji('✅');
      setFecha('');
      setXp(0);
    } catch (err) {
      console.error('Error creando tarea:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (!visible) return null;

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onCerrar}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto slide-up">
        <div className="bg-card rounded-t-3xl p-6 pb-10 shadow-xl">

          {/* Handle + header */}
          <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-4" />
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-lg font-bold text-foreground">Nueva tarea</h2>
            <button
              onClick={onCerrar}
              className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-muted text-sm transition-opacity active:opacity-60"
            >
              ✕
            </button>
          </div>

          <div className="space-y-4">
            {/* Emoji + Título */}
            <div className="flex gap-3">
              <input
                type="text"
                value={emoji}
                onChange={(e) => setEmoji(e.target.value)}
                className="w-14 h-12 text-2xl text-center rounded-xl border border-card-border bg-background focus:outline-none focus:border-accent"
                maxLength={2}
              />
              <input
                type="text"
                placeholder="Nombre de la tarea"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            {/* Fecha límite */}
            <div>
              <p className="text-xs font-medium text-muted mb-2">Fecha límite (opcional)</p>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                className="w-full h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
              />
            </div>

            {/* XP */}
            <div>
              <p className="text-xs font-medium text-muted mb-2">XP al completar</p>
              <div className="relative">
                <input
                  type="number"
                  value={xp}
                  onChange={(e) => setXp(e.target.value)}
                  min="0"
                  max="500"
                  step="5"
                  className="w-full h-12 pl-4 pr-16 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
                  placeholder="0"
                />
                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg bg-accent-light text-accent">
                  XP
                </span>
              </div>
            </div>

            {error && (
              <p className="text-sm font-medium text-center" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full h-12 rounded-xl bg-accent text-white font-semibold text-sm transition-opacity active:opacity-80 disabled:opacity-50"
            >
              {guardando ? 'Guardando...' : 'Crear tarea'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
