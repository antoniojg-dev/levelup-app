'use client';

import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react';
import { obtenerRango, obtenerSiguienteRango, calcularProgresoRango } from '@/lib/ranks';
import { calcularXPGanado, BONIFICACIONES } from '@/lib/xp-config';
import { obtenerClaveRecurrencia } from '@/lib/schedule';
import { supabase } from '@/lib/supabase';

const XPContext = createContext(null);

// Clave para localStorage (fallback cuando Supabase no está disponible)
const STORAGE_KEY = 'mi-vida-app-data';

// ID fijo para la fila única de user_progress (app monousuario)
const USER_PROGRESS_ID = 1;

/**
 * Obtener fecha actual como string YYYY-MM-DD
 */
function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Cargar datos guardados de localStorage (fallback)
 */
function cargarDatosLocales() {
  if (typeof window === 'undefined') return null;
  try {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (datos) return JSON.parse(datos);
  } catch {
    // Si hay error, empezar desde cero
  }
  return null;
}

/**
 * Guardar datos en localStorage (siempre, como caché local)
 */
function guardarDatosLocales(datos) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch {
    // Silenciar errores de localStorage
  }
}

/**
 * Mapear un evento de Supabase al formato interno de actividad
 */
function mapearEvento(ev) {
  let hora = '';
  if (ev.start_time && ev.end_time) {
    hora = `${ev.start_time} - ${ev.end_time}`;
  } else if (ev.start_time) {
    hora = ev.start_time;
  }

  return {
    id: String(ev.id),
    nombre: ev.title,
    hora,
    emoji: ev.emoji || '📅',
    color: ev.color || '#3B82F6',
    xp: ev.xp_reward || 0,
  };
}

/**
 * Cargar el horario de hoy desde Supabase:
 * - Eventos únicos con date = hoy
 * - Eventos recurrentes cuyo recurrence_days contiene la clave de hoy
 * - Excluir los que tienen una excepción para hoy
 */
async function cargarHorarioDesdeSupabase(hoy) {
  const claveHoy = obtenerClaveRecurrencia();

  // Eventos únicos de hoy
  const { data: eventosUnicos } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('date', hoy)
    .eq('recurring', false)
    .order('start_time', { ascending: true });

  // Eventos recurrentes para el día de hoy
  const { data: eventosRecurrentes } = await supabase
    .from('calendar_events')
    .select('*')
    .eq('recurring', true)
    .filter('recurrence_days', 'cs', `{${claveHoy}}`)
    .order('start_time', { ascending: true });

  // Excepciones: eventos recurrentes cancelados específicamente para hoy
  const { data: excepciones } = await supabase
    .from('recurring_exceptions')
    .select('event_id')
    .eq('exception_date', hoy);

  const idsExcepciones = new Set((excepciones || []).map(e => String(e.event_id)));

  // Combinar, filtrar excepciones y ordenar por hora
  const todos = [
    ...(eventosUnicos || []),
    ...(eventosRecurrentes || []).filter(ev => !idsExcepciones.has(String(ev.id))),
  ].sort((a, b) => {
    if (!a.start_time) return 1;
    if (!b.start_time) return -1;
    return a.start_time.localeCompare(b.start_time);
  });

  return todos.map(mapearEvento);
}

export function XPProvider({ children }) {
  const [xpTotal, setXPTotal] = useState(0);
  const [completadasHoy, setCompletadasHoy] = useState([]);
  const [horarioHoy, setHorarioHoy] = useState([]);
  const [racha, setRacha] = useState(0);
  // Versión del calendario — incrementar para forzar recarga en CalendarioPage
  const [calendarVersion, setCalendarVersion] = useState(0);
  const invalidarCalendario = useCallback(() => setCalendarVersion(v => v + 1), []);
  const [fechaActual, setFechaActual] = useState('');
  const [xpGanadoAnimacion, setXPGanadoAnimacion] = useState(null);
  const [cargado, setCargado] = useState(false);
  const [errorSync, setErrorSync] = useState(null);

  // Ref para acceder al horario actual dentro de callbacks sin stale closure
  const horarioHoyRef = useRef([]);

  // Ref para el timer de debounce del sync a Supabase
  const syncTimerRef = useRef(null);

  // Mantener ref sincronizada con el estado
  useEffect(() => {
    horarioHoyRef.current = horarioHoy;
  }, [horarioHoy]);

  // ─── Inicialización: cargar desde Supabase con fallback a localStorage ──────
  useEffect(() => {
    async function inicializar() {
      const hoy = fechaHoy();

      try {
        // Cargar progreso del usuario desde Supabase
        const { data: progreso, error: errorProgreso } = await supabase
          .from('user_progress')
          .select('xp, streak')
          .eq('id', USER_PROGRESS_ID)
          .maybeSingle();

        if (errorProgreso) throw errorProgreso;

        // Cargar completaciones de hoy desde Supabase
        const { data: completaciones, error: errorCompletaciones } = await supabase
          .from('daily_completions')
          .select('activity_id')
          .eq('date', hoy);

        if (errorCompletaciones) throw errorCompletaciones;

        // Cargar horario de hoy desde Supabase
        const horario = await cargarHorarioDesdeSupabase(hoy);

        if (progreso) {
          setXPTotal(progreso.xp ?? 0);
          setRacha(progreso.streak ?? 0);
        } else {
          // Primera vez: leer desde localStorage si existe
          const local = cargarDatosLocales();
          if (local) {
            setXPTotal(local.xpTotal ?? 0);
            setRacha(local.racha ?? 0);
          }
        }

        if (completaciones) {
          setCompletadasHoy(completaciones.map(c => c.activity_id));
        } else {
          // Fallback local para el día actual
          const local = cargarDatosLocales();
          if (local?.fechaUltimaActividad === hoy) {
            setCompletadasHoy(local.completadasHoy ?? []);
          }
        }

        setHorarioHoy(horario);
        horarioHoyRef.current = horario;
        setErrorSync(null);
      } catch (error) {
        console.error('Error cargando desde Supabase, usando localStorage:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          raw: error,
        });

        // Fallback completo a localStorage
        const local = cargarDatosLocales();
        if (local) {
          setXPTotal(local.xpTotal ?? 0);
          setRacha(local.racha ?? 0);
          if (local.fechaUltimaActividad === hoy) {
            setCompletadasHoy(local.completadasHoy ?? []);
          }
        }
        // Sin horario disponible en fallback local → queda vacío
      } finally {
        setFechaActual(hoy);
        setCargado(true);
      }
    }

    inicializar();
  }, []);

  // ─── Guardar en localStorage y sincronizar user_progress a Supabase ──────────
  useEffect(() => {
    if (!cargado) return;

    // Guardar siempre en localStorage como caché local
    guardarDatosLocales({
      xpTotal,
      completadasHoy,
      racha,
      fechaUltimaActividad: fechaActual || fechaHoy(),
    });

    // Sincronizar con Supabase con debounce (espera 1.5s sin cambios antes de guardar)
    clearTimeout(syncTimerRef.current);
    syncTimerRef.current = setTimeout(async () => {
      try {
        const { error } = await supabase.from('user_progress').upsert(
          {
            id: USER_PROGRESS_ID,
            xp: xpTotal,
            rank: obtenerRango(xpTotal).id,
            streak: racha,
            last_activity_date: fechaActual || fechaHoy(),
          },
          { onConflict: 'id' }
        );

        if (error) throw error;
        setErrorSync(null);
      } catch (error) {
        console.error('Error sincronizando progreso con Supabase:', {
          message: error?.message,
          code: error?.code,
          details: error?.details,
          hint: error?.hint,
          raw: error,
        });
        setErrorSync('No se pudo guardar el progreso en la nube');
      }
    }, 1500);

    return () => clearTimeout(syncTimerRef.current);
  }, [xpTotal, racha, cargado, fechaActual]);

  // ─── Toggle de actividad: actualización optimista + guardado en Supabase ─────
  const toggleActividad = useCallback((actividadId, xpActividad, actividadNombre) => {
    const hoy = fechaHoy();

    setCompletadasHoy(prev => {
      const yaCompletada = prev.includes(actividadId);

      if (yaCompletada) {
        // Descompletar: restar XP
        setXPTotal(xp => Math.max(0, xp - xpActividad));

        // Eliminar completación de Supabase en background
        supabase
          .from('daily_completions')
          .delete()
          .eq('date', hoy)
          .eq('activity_id', actividadId)
          .then(({ error }) => {
            if (error) {
              console.error('Error eliminando completación:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                raw: error,
              });
              setErrorSync('Error al desmarcar actividad en la nube');
            }
          });

        return prev.filter(id => id !== actividadId);
      } else {
        // Completar: sumar XP
        setXPTotal(xp => xp + xpActividad);
        setXPGanadoAnimacion({ xp: xpActividad, key: Date.now() });

        const nuevasCompletadas = [...prev, actividadId];

        // Usar ref para acceder al horario actual sin stale closure
        const horarioActual = horarioHoyRef.current;
        const todasCompletadas = horarioActual.every(act =>
          nuevasCompletadas.includes(act.id)
        );

        if (todasCompletadas && horarioActual.length > 0) {
          // Bonus por día completo
          setXPTotal(xp => xp + BONIFICACIONES.dia_completo);
          setXPGanadoAnimacion({
            xp: xpActividad + BONIFICACIONES.dia_completo,
            key: Date.now(),
            bonus: true,
          });
          setRacha(r => r + 1);
        }

        // Guardar completación en Supabase en background (upsert evita error 23505)
        supabase
          .from('daily_completions')
          .upsert(
            {
              date: hoy,
              activity_id: actividadId,
              activity_name: actividadNombre || actividadId,
              xp_earned: xpActividad,
              completed_at: new Date().toISOString(),
            },
            { onConflict: 'date,activity_id' }
          )
          .then(({ error }) => {
            if (error) {
              console.error('Error guardando completación:', {
                message: error?.message,
                code: error?.code,
                details: error?.details,
                hint: error?.hint,
                raw: error,
              });
              setErrorSync('Error al guardar actividad en la nube');
            }
          });

        return nuevasCompletadas;
      }
    });
  }, []);

  // ─── Datos derivados ────────────────────────────────────────────────────────
  const rangoActual = obtenerRango(xpTotal);
  const siguienteRango = obtenerSiguienteRango(xpTotal);
  const progresoRango = calcularProgresoRango(xpTotal);
  const xpHoy = calcularXPGanado(horarioHoy, completadasHoy);
  const totalActividadesHoy = horarioHoy.length;
  const actividadesCompletadasHoy = completadasHoy.length;
  const progresoDia = totalActividadesHoy > 0
    ? Math.round((actividadesCompletadasHoy / totalActividadesHoy) * 100)
    : 0;

  const valor = {
    // Estado
    xpTotal,
    completadasHoy,
    horarioHoy,
    racha,
    cargado,
    xpGanadoAnimacion,
    errorSync,

    // Datos derivados
    rangoActual,
    siguienteRango,
    progresoRango,
    xpHoy,
    progresoDia,
    totalActividadesHoy,
    actividadesCompletadasHoy,

    // Acciones
    toggleActividad,
    invalidarCalendario,

    // Versión del calendario (para forzar recarga desde otros componentes)
    calendarVersion,
  };

  return (
    <XPContext.Provider value={valor}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP debe usarse dentro de un XPProvider');
  }
  return context;
}
