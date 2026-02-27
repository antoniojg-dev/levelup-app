'use client';

import { useState } from 'react';
import { supabase } from '@/lib/supabase';
import { useXP } from '@/contexts/XPContext';

/**
 * Sheet de detalle de un evento del calendario.
 * Permite editar o borrar (con manejo de recurrentes).
 * fixed_schedule=true muestra badge informativo — el botón Editar sigue activo.
 * El candado solo indica que la IA no puede mover el evento; el usuario sí puede editarlo.
 */
export default function ModalDetalleEvento({ evento, onCerrar, onEditar }) {
  const { invalidarCalendario } = useXP();
  const [eliminando, setEliminando]               = useState(false);
  const [confirmarEliminar, setConfirmarEliminar] = useState(false);

  if (!evento) return null;

  const color   = evento.color || '#3B82F6';
  const colorBg = color + '15';

  const formatHora = (t) => t ? t.substring(0, 5).replace(/^0/, '') : '';
  const hora = evento.start_time
    ? evento.end_time
      ? `${formatHora(evento.start_time)} – ${formatHora(evento.end_time)}`
      : formatHora(evento.start_time)
    : null;

  const eliminar = async (soloHoy = false) => {
    setEliminando(true);
    try {
      if (evento.recurring && soloHoy) {
        await supabase.from('recurring_exceptions').insert({
          event_id: evento.id,
          exception_date: evento._fechaVista,
        });
      } else {
        await supabase.from('calendar_events').delete().eq('id', evento.id);
      }
      invalidarCalendario();
      onCerrar();
    } catch (err) {
      console.error('Error eliminando evento:', err);
    } finally {
      setEliminando(false);
    }
  };

  return (
    <>
      {/* Overlay — semitransparente sin blur */}
      <div
        className="fixed inset-0 z-50"
        style={{ background: 'rgba(0,0,0,0.4)' }}
        onClick={onCerrar}
      />

      {/* Sheet */}
      <div className="fixed bottom-0 left-0 right-0 z-50 max-w-lg mx-auto slide-up">
        <div
          className="bg-white rounded-t-3xl shadow-2xl overflow-y-auto"
          style={{
            maxHeight: 'calc(85vh - 65px - env(safe-area-inset-bottom))',
            padding: '24px',
            paddingBottom: 'calc(65px + env(safe-area-inset-bottom) + 16px)',
          }}
        >

          {/* Handle — indicador de arrastre */}
          <div
            className="rounded-full mx-auto mb-6"
            style={{ width: 48, height: 6, backgroundColor: '#D1D5DB' }}
          />

          {/* Cabecera del evento */}
          <div className="flex items-start gap-3 mb-5">
            <div
              className="w-12 h-12 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
              style={{ backgroundColor: colorBg }}
            >
              {evento.emoji || '📅'}
            </div>
            <div className="flex-1 min-w-0">
              <h2 className="text-lg font-bold leading-tight" style={{ color: '#111827' }}>
                {evento.title}
              </h2>
              {hora && (
                <p className="text-sm mt-1" style={{ color: '#6B7280' }}>{hora}</p>
              )}
              {evento.xp_reward > 0 && (
                <span
                  className="text-xs font-semibold mt-1.5 inline-block px-2.5 py-1 rounded-lg"
                  style={{ backgroundColor: colorBg, color }}
                >
                  +{evento.xp_reward} XP
                </span>
              )}
            </div>
          </div>

          {/* Badge Horario Fijo — informativo, no bloquea edición */}
          {evento.fixed_schedule && (
            <div className="mb-4">
              <span
                className="text-xs font-medium px-3 py-1.5 rounded-full inline-flex items-center gap-1.5"
                style={{ backgroundColor: '#FEF9C3', color: '#92400E' }}
              >
                🔒 Horario Fijo — la IA no puede moverlo
              </span>
            </div>
          )}

          {/* Info recurrencia */}
          {evento.recurring && evento.recurrence_days?.length > 0 && (
            <div
              className="flex items-center gap-2 text-sm rounded-xl px-3 py-2 mb-5"
              style={{ backgroundColor: '#F3F4F6' }}
            >
              <span>🔁</span>
              <span style={{ color: '#6B7280' }}>
                Repite cada: {evento.recurrence_days.join(', ')}
              </span>
            </div>
          )}

          {/* Acciones */}
          <div className="mt-6">
            {confirmarEliminar ? (
              <div className="space-y-3">
                <p className="text-sm font-semibold text-center mb-3" style={{ color: '#111827' }}>
                  {evento.recurring ? '¿Qué quieres eliminar?' : '¿Eliminar este evento?'}
                </p>

                {evento.recurring && (
                  <button
                    onClick={() => eliminar(true)}
                    disabled={eliminando}
                    className="w-full rounded-2xl font-semibold text-sm transition-opacity active:opacity-70 disabled:opacity-50"
                    style={{
                      padding: '14px',
                      backgroundColor: '#FEF3C7',
                      color: '#D97706',
                    }}
                  >
                    Solo este día
                  </button>
                )}

                <button
                  onClick={() => eliminar(false)}
                  disabled={eliminando}
                  className="w-full rounded-2xl font-semibold text-sm transition-opacity active:opacity-70 disabled:opacity-50"
                  style={{
                    padding: '14px',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                  }}
                >
                  {eliminando ? 'Eliminando...' : evento.recurring ? 'Eliminar todos' : 'Eliminar'}
                </button>

                <button
                  onClick={() => setConfirmarEliminar(false)}
                  className="w-full rounded-2xl font-semibold text-sm transition-opacity active:opacity-70"
                  style={{
                    padding: '14px',
                    backgroundColor: '#F3F4F6',
                    color: '#6B7280',
                  }}
                >
                  Cancelar
                </button>
              </div>
            ) : (
              <div className="flex gap-3">
                {/* Eliminar — rojo suave */}
                <button
                  onClick={() => setConfirmarEliminar(true)}
                  className="flex-1 rounded-2xl font-semibold text-sm transition-opacity active:opacity-70"
                  style={{
                    padding: '14px',
                    backgroundColor: '#FEE2E2',
                    color: '#EF4444',
                  }}
                >
                  Eliminar
                </button>

                {/* Editar — siempre activo, azul sólido */}
                <button
                  onClick={() => { onEditar(evento); onCerrar(); }}
                  className="flex-1 rounded-2xl font-semibold text-sm text-white transition-opacity active:opacity-70"
                  style={{
                    padding: '14px',
                    backgroundColor: '#3B82F6',
                  }}
                >
                  Editar
                </button>
              </div>
            )}
          </div>

        </div>
      </div>
    </>
  );
}
