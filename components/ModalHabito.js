'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';

const COLORES = [
  { label: 'Azul',    hex: '#3B82F6' },
  { label: 'Verde',   hex: '#10B981' },
  { label: 'Rojo',    hex: '#EF4444' },
  { label: 'Naranja', hex: '#F59E0B' },
  { label: 'Morado',  hex: '#8B5CF6' },
  { label: 'Rosa',    hex: '#EC4899' },
];

/**
 * Modal para crear o editar hábitos.
 * Slide-up desde abajo (estilo iOS sheet).
 * Props:
 *   visible        — boolean: mostrar/ocultar
 *   habitoInicial  — null para crear, objeto hábito para editar
 *   onCerrar       — callback al cerrar
 *   onGuardado     — callback tras guardar exitosamente
 */
export default function ModalHabito({ visible, habitoInicial, onCerrar, onGuardado }) {
  const [emoji, setEmoji]                   = useState('💪');
  const [nombre, setNombre]                 = useState('');
  const [descripcion, setDescripcion]       = useState('');
  const [frecuencia, setFrecuencia]         = useState('daily');
  const [color, setColor]                   = useState('#3B82F6');
  const [eventosVinculados, setEventosVinculados] = useState([]);
  const [eventosCalendario, setEventosCalendario] = useState([]);
  const [guardando, setGuardando]           = useState(false);
  const [error, setError]                   = useState('');

  useEffect(() => {
    if (!visible) return;

    // Resetear formulario
    if (habitoInicial) {
      setEmoji(habitoInicial.emoji || habitoInicial.icon || '💪');
      setNombre(habitoInicial.name || '');
      setDescripcion(habitoInicial.description || '');
      setFrecuencia(habitoInicial.frequency || 'daily');
      setColor(habitoInicial.color || '#3B82F6');
      setEventosVinculados(habitoInicial.linked_event_ids || []);
    } else {
      setEmoji('💪');
      setNombre('');
      setDescripcion('');
      setFrecuencia('daily');
      setColor('#3B82F6');
      setEventosVinculados([]);
    }
    setError('');

    // Cargar eventos del calendario para vincular
    async function cargarEventos() {
      const { data } = await supabase
        .from('calendar_events')
        .select('id, title, emoji, color')
        .order('title');
      setEventosCalendario(data || []);
    }
    cargarEventos();
  }, [visible, habitoInicial]);

  const toggleEvento = (id) => {
    setEventosVinculados(prev =>
      prev.includes(id) ? prev.filter(e => e !== id) : [...prev, id]
    );
  };

  const guardar = async () => {
    if (!nombre.trim()) { setError('El nombre es obligatorio'); return; }

    setGuardando(true);
    setError('');

    const datos = {
      name: nombre.trim(),
      emoji,
      description: descripcion.trim() || null,
      frequency: frecuencia,
      color,
      linked_event_ids: eventosVinculados,
    };

    try {
      if (habitoInicial) {
        const { error: err } = await supabase
          .from('habits')
          .update(datos)
          .eq('id', habitoInicial.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('habits')
          .insert(datos);
        if (err) throw err;
      }
      onGuardado?.();
      onCerrar();
    } catch (err) {
      console.error('Error guardando hábito:', err);
      setError('Error al guardar. Intenta de nuevo.');
    } finally {
      setGuardando(false);
    }
  };

  if (!visible) return null;

  const colorBg = color + '15';

  return (
    <>
      {/* Overlay */}
      <div
        className="fixed inset-0 bg-black/40 z-50 backdrop-blur-sm"
        onClick={onCerrar}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto max-h-[92vh] overflow-hidden flex flex-col slide-up">
        <div className="bg-card rounded-t-3xl shadow-xl flex flex-col max-h-[92vh]">

          {/* Header pegajoso */}
          <div className="px-6 pt-5 pb-4 border-b border-card-border flex-shrink-0">
            <div className="w-10 h-1 bg-card-border rounded-full mx-auto mb-4" />
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-bold text-foreground">
                {habitoInicial ? 'Editar hábito' : 'Nuevo hábito'}
              </h2>
              <button
                onClick={onCerrar}
                className="w-8 h-8 rounded-full bg-card-border flex items-center justify-center text-muted text-sm transition-opacity active:opacity-60"
              >
                ✕
              </button>
            </div>
          </div>

          {/* Formulario con scroll */}
          <div className="px-6 py-5 pb-10 space-y-5 overflow-y-auto">

            {/* Emoji + Nombre */}
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
                placeholder="Nombre del hábito"
                value={nombre}
                onChange={(e) => setNombre(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            {/* Descripción */}
            <textarea
              placeholder="Descripción (opcional)"
              value={descripcion}
              onChange={(e) => setDescripcion(e.target.value)}
              rows={2}
              className="w-full px-4 py-3 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent resize-none"
            />

            {/* Color */}
            <div>
              <p className="text-xs font-medium text-muted mb-2">Color</p>
              <div className="flex gap-2.5">
                {COLORES.map(c => (
                  <button
                    key={c.hex}
                    onClick={() => setColor(c.hex)}
                    className="w-8 h-8 rounded-full transition-transform active:scale-90"
                    style={{
                      backgroundColor: c.hex,
                      outline: color === c.hex ? `3px solid ${c.hex}` : 'none',
                      outlineOffset: '2px',
                    }}
                    aria-label={c.label}
                  />
                ))}
              </div>
            </div>

            {/* Frecuencia */}
            <div>
              <p className="text-xs font-medium text-muted mb-2">Frecuencia</p>
              <div className="grid grid-cols-2 gap-2">
                {[
                  { val: 'daily',  label: 'Diario' },
                  { val: 'weekly', label: 'Semanal' },
                ].map(f => (
                  <button
                    key={f.val}
                    onClick={() => setFrecuencia(f.val)}
                    className="h-10 rounded-xl text-sm font-medium transition-colors"
                    style={{
                      backgroundColor: frecuencia === f.val ? color : 'var(--card-border)',
                      color: frecuencia === f.val ? 'white' : 'var(--muted)',
                    }}
                  >
                    {f.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Vincular a actividades del calendario */}
            {eventosCalendario.length > 0 && (
              <div>
                <p className="text-xs font-medium text-muted mb-1">Vincular a actividades del calendario</p>
                <p className="text-xs text-muted mb-3">
                  Al completar esas actividades, este hábito se marca automáticamente
                </p>
                <div className="space-y-2 max-h-44 overflow-y-auto">
                  {eventosCalendario.map(ev => {
                    const vinculado = eventosVinculados.includes(ev.id);
                    return (
                      <button
                        key={ev.id}
                        onClick={() => toggleEvento(ev.id)}
                        className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl border transition-colors text-left"
                        style={{
                          borderColor: vinculado ? color : 'var(--card-border)',
                          backgroundColor: vinculado ? colorBg : 'transparent',
                        }}
                      >
                        <span className="text-lg flex-shrink-0">{ev.emoji || '📅'}</span>
                        <span className="flex-1 text-sm text-foreground font-medium truncate">
                          {ev.title}
                        </span>
                        {vinculado && (
                          <span className="text-xs font-bold flex-shrink-0" style={{ color }}>✓</span>
                        )}
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Error */}
            {error && (
              <p className="text-sm font-medium text-center" style={{ color: 'var(--danger)' }}>
                {error}
              </p>
            )}

            {/* Botón guardar */}
            <button
              onClick={guardar}
              disabled={guardando}
              className="w-full h-12 rounded-xl text-white font-semibold text-sm transition-opacity active:opacity-80 disabled:opacity-50"
              style={{ backgroundColor: color }}
            >
              {guardando ? 'Guardando...' : habitoInicial ? 'Guardar cambios' : 'Crear hábito'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
