'use client';

import { useState, useEffect } from 'react';
import { useXP } from '@/contexts/XPContext';
import { supabase } from '@/lib/supabase';
import { DIAS_RECURRENCIA } from '@/lib/schedule';
import EventCard from '@/components/EventCard';
import ModalDetalleEvento from '@/components/ModalDetalleEvento';
import ModalEvento from '@/components/ModalEvento';

// ─── Helpers de fechas (usando fecha local, no UTC) ───────────────────────────

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hoyStr() {
  return toDateStr(new Date());
}

/**
 * Calcular el array de fechas visibles según la vista activa.
 * Semana: lunes a domingo.
 */
function calcularFechas(fechaBase, vista) {
  const fechas = [];

  if (vista === 'dia') {
    fechas.push(new Date(fechaBase));
  } else if (vista === '3dias') {
    for (let i = 0; i < 3; i++) {
      const d = new Date(fechaBase);
      d.setDate(d.getDate() + i);
      fechas.push(d);
    }
  } else {
    // Semana: encontrar el lunes de la semana de fechaBase
    const lunes = new Date(fechaBase);
    const diaSemana = lunes.getDay(); // 0=dom, 1=lun...
    const diff = diaSemana === 0 ? -6 : 1 - diaSemana;
    lunes.setDate(lunes.getDate() + diff);
    for (let i = 0; i < 7; i++) {
      const d = new Date(lunes);
      d.setDate(d.getDate() + i);
      fechas.push(d);
    }
  }

  return fechas;
}

function navegarFecha(fechaBase, vista, dir) {
  const nueva = new Date(fechaBase);
  const pasos = { dia: 1, '3dias': 3, semana: 7 };
  nueva.setDate(nueva.getDate() + pasos[vista] * dir);
  return nueva;
}

function formatMesAnio(fechas) {
  const MESES = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];
  const primera = fechas[0];
  const ultima  = fechas[fechas.length - 1];

  if (primera.getMonth() === ultima.getMonth()) {
    return `${MESES[primera.getMonth()]} ${primera.getFullYear()}`;
  }
  return `${MESES[primera.getMonth()]} – ${MESES[ultima.getMonth()]} ${ultima.getFullYear()}`;
}

// Letras de cabecera (índice 0 = domingo en JS)
const LETRAS_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

// ─── Carga de eventos desde Supabase ─────────────────────────────────────────

async function cargarEventosRango(fechas) {
  const inicio = toDateStr(fechas[0]);
  const fin    = toDateStr(fechas[fechas.length - 1]);

  const [
    { data: eventosUnicos },
    { data: eventosRecurrentes },
    { data: excepciones },
  ] = await Promise.all([
    supabase
      .from('calendar_events')
      .select('*')
      .eq('recurring', false)
      .gte('date', inicio)
      .lte('date', fin)
      .order('start_time', { ascending: true }),

    supabase
      .from('calendar_events')
      .select('*')
      .eq('recurring', true)
      .order('start_time', { ascending: true }),

    supabase
      .from('recurring_exceptions')
      .select('event_id, exception_date')
      .gte('exception_date', inicio)
      .lte('exception_date', fin),
  ]);

  // Construir mapa de excepciones: id_evento → Set<fechaString>
  const excMap = {};
  (excepciones || []).forEach(({ event_id, exception_date }) => {
    const k = String(event_id);
    if (!excMap[k]) excMap[k] = new Set();
    excMap[k].add(exception_date);
  });

  // Inicializar bucket por fecha
  const porFecha = {};
  fechas.forEach(f => { porFecha[toDateStr(f)] = []; });

  // Eventos únicos
  (eventosUnicos || []).forEach(ev => {
    if (porFecha[ev.date] !== undefined) {
      porFecha[ev.date].push({ ...ev, _fechaVista: ev.date });
    }
  });

  // Eventos recurrentes: aparecen en cada fecha visible donde corresponde el día
  fechas.forEach(fecha => {
    const fechaStr = toDateStr(fecha);
    const claveHoy = DIAS_RECURRENCIA[fecha.getDay()];

    (eventosRecurrentes || []).forEach(ev => {
      if (!ev.recurrence_days?.includes(claveHoy)) return;
      if (excMap[String(ev.id)]?.has(fechaStr)) return; // tiene excepción hoy
      porFecha[fechaStr].push({ ...ev, _fechaVista: fechaStr });
    });
  });

  // Ordenar cada día por hora de inicio
  Object.keys(porFecha).forEach(fechaStr => {
    porFecha[fechaStr].sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
  });

  return porFecha;
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Calendario() {
  const { calendarVersion } = useXP();

  const [vista, setVista]           = useState('semana');
  const [fechaBase, setFechaBase]   = useState(new Date());
  const [eventosPorFecha, setEventosPorFecha] = useState({});
  const [cargando, setCargando]     = useState(true);
  const [eventoDetalle, setEventoDetalle] = useState(null);
  const [eventoEditar, setEventoEditar]   = useState(null);

  const fechas = calcularFechas(fechaBase, vista);
  const hoy    = hoyStr();

  // Recargar cuando cambia la vista, la fecha base o se modifica un evento (calendarVersion)
  useEffect(() => {
    let cancelado = false;
    setCargando(true);

    cargarEventosRango(calcularFechas(fechaBase, vista))
      .then(data => {
        if (!cancelado) {
          setEventosPorFecha(data);
          setCargando(false);
        }
      })
      .catch(() => {
        if (!cancelado) setCargando(false);
      });

    return () => { cancelado = true; };
  }, [fechaBase, vista, calendarVersion]);

  const irAHoy   = () => setFechaBase(new Date());
  const navegar  = (dir) => setFechaBase(prev => navegarFecha(prev, vista, dir));

  const numCols  = fechas.length;

  return (
    <div>
      {/* ── Toggle de vistas ────────────────────────────────────────────── */}
      <div className="flex gap-1.5 mb-4 bg-card-border p-1 rounded-2xl" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[['dia', 'Día'], ['3dias', '3 Días'], ['semana', 'Semana']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: vista === v ? 'var(--card)' : 'transparent',
              color:           vista === v ? 'var(--accent)' : 'var(--muted)',
              boxShadow:       vista === v ? 'var(--shadow-card)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Navegación ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-4">
        <button
          onClick={() => navegar(-1)}
          className="w-9 h-9 rounded-xl bg-card flex items-center justify-center font-bold text-muted text-lg transition-opacity active:opacity-60"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          ‹
        </button>

        <div className="flex-1 text-center">
          <p className="text-sm font-bold text-foreground">{formatMesAnio(fechas)}</p>
        </div>

        <button
          onClick={() => navegar(1)}
          className="w-9 h-9 rounded-xl bg-card flex items-center justify-center font-bold text-muted text-lg transition-opacity active:opacity-60"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          ›
        </button>

        <button
          onClick={irAHoy}
          className="h-9 px-3 rounded-xl text-accent text-xs font-bold transition-opacity active:opacity-60"
          style={{ backgroundColor: 'var(--accent-light)' }}
        >
          Hoy
        </button>
      </div>

      {/* ── Cabecera de días ────────────────────────────────────────────── */}
      <div
        className="grid gap-px bg-card rounded-2xl overflow-hidden mb-3"
        style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)`, boxShadow: 'var(--shadow-card)' }}
      >
        {fechas.map(fecha => {
          const fechaStr = toDateStr(fecha);
          const esHoy    = fechaStr === hoy;

          return (
            <div
              key={fechaStr}
              className="flex flex-col items-center py-2.5 cursor-pointer transition-opacity"
              style={{ backgroundColor: esHoy ? 'var(--accent)' : 'var(--card)' }}
              onClick={() => {
                // Clic en cabecera navega a vista "día" de esa fecha
                if (vista !== 'dia') {
                  setVista('dia');
                  setFechaBase(new Date(fecha));
                }
              }}
            >
              <p
                className="text-[10px] font-semibold"
                style={{ color: esHoy ? 'rgba(255,255,255,0.75)' : 'var(--muted-light)' }}
              >
                {LETRAS_DIA[fecha.getDay()]}
              </p>
              <p
                className="text-base font-bold mt-0.5"
                style={{ color: esHoy ? 'white' : 'var(--foreground)' }}
              >
                {fecha.getDate()}
              </p>
            </div>
          );
        })}
      </div>

      {/* ── Cuerpo: columnas de eventos ─────────────────────────────────── */}
      {cargando ? (
        <div
          className="grid gap-2 animate-pulse"
          style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
        >
          {fechas.map((_, i) => (
            <div key={i} className="space-y-1.5">
              <div className="h-10 bg-card-border rounded-xl" />
              <div className="h-10 bg-card-border rounded-xl opacity-60" />
            </div>
          ))}
        </div>
      ) : (
        <div
          className="grid gap-2"
          style={{ gridTemplateColumns: `repeat(${numCols}, 1fr)` }}
        >
          {fechas.map(fecha => {
            const fechaStr      = toDateStr(fecha);
            const eventosDelDia = eventosPorFecha[fechaStr] || [];

            return (
              <div key={fechaStr} className="min-h-[48px]">
                {eventosDelDia.length === 0 ? (
                  <div
                    className="h-10 rounded-xl flex items-center justify-center"
                    style={{ backgroundColor: 'var(--card-border)', opacity: 0.5 }}
                  >
                    <span className="text-[10px] text-muted-light">—</span>
                  </div>
                ) : (
                  eventosDelDia.map(ev => (
                    <EventCard
                      key={`${ev.id}-${fechaStr}`}
                      evento={ev}
                      vista={vista}
                      onClick={() => setEventoDetalle(ev)}
                    />
                  ))
                )}
              </div>
            );
          })}
        </div>
      )}

      {/* ── Modal detalle ────────────────────────────────────────────────── */}
      {eventoDetalle && (
        <ModalDetalleEvento
          evento={eventoDetalle}
          onCerrar={() => setEventoDetalle(null)}
          onEditar={(ev) => {
            setEventoDetalle(null);
            setEventoEditar(ev);
          }}
        />
      )}

      {/* ── Modal edición ────────────────────────────────────────────────── */}
      <ModalEvento
        visible={!!eventoEditar}
        eventoInicial={eventoEditar}
        onCerrar={() => setEventoEditar(null)}
        onGuardado={() => setEventoEditar(null)}
      />
    </div>
  );
}
