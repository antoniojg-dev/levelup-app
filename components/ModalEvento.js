'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useXP } from '@/contexts/XPContext';

const COLORES = [
  { label: 'Azul',    hex: '#3B82F6' },
  { label: 'Verde',   hex: '#10B981' },
  { label: 'Rojo',    hex: '#EF4444' },
  { label: 'Naranja', hex: '#F59E0B' },
  { label: 'Morado',  hex: '#8B5CF6' },
  { label: 'Rosa',    hex: '#EC4899' },
];

const DIAS = [
  { clave: 'lun', label: 'L' },
  { clave: 'mar', label: 'M' },
  { clave: 'mie', label: 'X' },
  { clave: 'jue', label: 'J' },
  { clave: 'vie', label: 'V' },
  { clave: 'sab', label: 'S' },
  { clave: 'dom', label: 'D' },
];

/**
 * Modal para crear o editar eventos del calendario.
 * Slide-up desde abajo (estilo iOS sheet).
 * Props:
 *   visible       — boolean: mostrar/ocultar
 *   eventoInicial — null para crear, objeto evento para editar
 *   onCerrar      — callback al cerrar
 *   onGuardado    — callback tras guardar exitosamente
 */
export default function ModalEvento({ visible, eventoInicial, onCerrar, onGuardado }) {
  const { invalidarCalendario } = useXP();

  const [emoji, setEmoji]             = useState('📅');
  const [titulo, setTitulo]           = useState('');
  const [color, setColor]             = useState('#3B82F6');
  const [fecha, setFecha]             = useState('');
  const [horaInicio, setHoraInicio]   = useState('08:00');
  const [horaFin, setHoraFin]         = useState('09:00');
  const [repite, setRepite]           = useState(false);
  const [diasRep, setDiasRep]         = useState([]);
  const [horarioFijo, setHorarioFijo] = useState(false);
  const [xp, setXp]                   = useState(0);
  const [guardando, setGuardando]     = useState(false);
  const [error, setError]             = useState('');

  // Cargar datos cuando se abre el modal
  useEffect(() => {
    if (!visible) return;

    const hoy = (() => {
      const d = new Date();
      return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
    })();

    if (eventoInicial) {
      setEmoji(eventoInicial.emoji || '📅');
      setTitulo(eventoInicial.title || '');
      setColor(eventoInicial.color || '#3B82F6');
      setFecha(eventoInicial.date || hoy);
      setHoraInicio(eventoInicial.start_time?.substring(0, 5) || '08:00');
      setHoraFin(eventoInicial.end_time?.substring(0, 5) || '09:00');
      setRepite(eventoInicial.recurring || false);
      setDiasRep(eventoInicial.recurrence_days || []);
      setHorarioFijo(eventoInicial.fixed_schedule || false);
      setXp(eventoInicial.xp_reward || 0);
    } else {
      setEmoji('📅');
      setTitulo('');
      setColor('#3B82F6');
      setFecha(hoy);
      setHoraInicio('08:00');
      setHoraFin('09:00');
      setRepite(false);
      setDiasRep([]);
      setHorarioFijo(false);
      setXp(0);
    }
    setError('');
  }, [visible, eventoInicial]);

  const toggleDia = (clave) => {
    setDiasRep(prev =>
      prev.includes(clave) ? prev.filter(d => d !== clave) : [...prev, clave]
    );
  };

  const guardar = async () => {
    if (!titulo.trim()) { setError('El título es obligatorio'); return; }
    if (repite && diasRep.length === 0) { setError('Selecciona al menos un día de repetición'); return; }

    setGuardando(true);
    setError('');

    const datos = {
      title: titulo.trim(),
      emoji,
      color,
      date: fecha,
      start_time: horaInicio || null,
      end_time: horaFin || null,
      recurring: repite,
      recurrence_days: repite ? diasRep : null,
      fixed_schedule: horarioFijo,
      xp_reward: Number(xp) || 0,
    };

    try {
      if (eventoInicial) {
        const { error: err } = await supabase
          .from('calendar_events')
          .update(datos)
          .eq('id', eventoInicial.id);
        if (err) throw err;
      } else {
        const { error: err } = await supabase
          .from('calendar_events')
          .insert(datos);
        if (err) throw err;
      }
      invalidarCalendario();
      onGuardado?.();
      onCerrar();
    } catch (err) {
      console.error('Error guardando evento:', err);
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
                {eventoInicial ? 'Editar evento' : 'Nuevo evento'}
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
                placeholder="Nombre del evento"
                value={titulo}
                onChange={(e) => setTitulo(e.target.value)}
                className="flex-1 h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent"
                autoFocus
              />
            </div>

            {/* Selector de color */}
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

            {/* Fecha */}
            <div>
              <p className="text-xs font-medium text-muted mb-2">Fecha</p>
              <input
                type="date"
                value={fecha}
                onChange={(e) => setFecha(e.target.value)}
                disabled={horarioFijo}
                className="w-full h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent disabled:opacity-50"
              />
            </div>

            {/* Horas */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="text-xs font-medium text-muted mb-2">Hora inicio</p>
                <input
                  type="time"
                  value={horaInicio}
                  onChange={(e) => setHoraInicio(e.target.value)}
                  disabled={horarioFijo}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
              <div>
                <p className="text-xs font-medium text-muted mb-2">Hora fin</p>
                <input
                  type="time"
                  value={horaFin}
                  onChange={(e) => setHoraFin(e.target.value)}
                  disabled={horarioFijo}
                  className="w-full h-12 px-4 rounded-xl border border-card-border bg-background text-foreground text-sm focus:outline-none focus:border-accent disabled:opacity-50"
                />
              </div>
            </div>

            {/* Toggle Recurrencia */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <p className="text-sm font-medium text-foreground">¿Se repite?</p>
                <button
                  onClick={() => setRepite(!repite)}
                  className="relative w-11 h-6 rounded-full transition-colors duration-200"
                  style={{ backgroundColor: repite ? color : 'var(--card-border)' }}
                >
                  <span
                    className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
                    style={{ left: repite ? 'calc(100% - 1.375rem)' : '2px' }}
                  />
                </button>
              </div>

              {repite && (
                <div className="flex gap-1 mt-3">
                  {DIAS.map(d => (
                    <button
                      key={d.clave}
                      onClick={() => toggleDia(d.clave)}
                      className="flex-1 h-9 rounded-lg text-xs font-bold transition-colors"
                      style={{
                        backgroundColor: diasRep.includes(d.clave) ? color : 'var(--card-border)',
                        color: diasRep.includes(d.clave) ? 'white' : 'var(--muted)',
                      }}
                    >
                      {d.label}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Toggle Horario Fijo */}
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-foreground">Horario Fijo 🔒</p>
                <p className="text-xs text-muted">No se puede mover ni editar hora/fecha</p>
              </div>
              <button
                onClick={() => setHorarioFijo(!horarioFijo)}
                className="relative w-11 h-6 rounded-full transition-colors duration-200"
                style={{ backgroundColor: horarioFijo ? color : 'var(--card-border)' }}
              >
                <span
                  className="absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-all duration-200"
                  style={{ left: horarioFijo ? 'calc(100% - 1.375rem)' : '2px' }}
                />
              </button>
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
                <span
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-xs font-bold px-2 py-1 rounded-lg"
                  style={{ backgroundColor: colorBg, color }}
                >
                  XP
                </span>
              </div>
            </div>

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
              {guardando ? 'Guardando...' : eventoInicial ? 'Guardar cambios' : 'Crear evento'}
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
