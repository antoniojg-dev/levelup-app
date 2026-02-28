'use client';

import { useState, useEffect, useRef } from 'react';
import { useXP } from '@/contexts/XPContext';
import { supabase } from '@/lib/supabase';
import { DIAS_RECURRENCIA } from '@/lib/schedule';
import EventCard from '@/components/EventCard';
import ModalDetalleEvento from '@/components/ModalDetalleEvento';
import ModalEvento from '@/components/ModalEvento';

// ─── Constantes de timeline ───────────────────────────────────────────────────
const PX_POR_HORA  = 60;
const HORAS        = Array.from({ length: 24 }, (_, i) => i);
const TOTAL_ALTO   = 24 * PX_POR_HORA; // 1440 px
const ANCHO_HORAS  = 40; // px — columna de etiquetas de hora

// ─── Helpers de fechas (fecha local, no UTC) ──────────────────────────────────

function toDateStr(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function hoyStr() { return toDateStr(new Date()); }

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
    // Semana: lunes → domingo
    const lunes = new Date(fechaBase);
    const dow   = lunes.getDay();
    lunes.setDate(lunes.getDate() + (dow === 0 ? -6 : 1 - dow));
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

const LETRAS_DIA  = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];
const NOMBRES_DIA = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
const MESES_CORTO = ['Ene','Feb','Mar','Abr','May','Jun','Jul','Ago','Sep','Oct','Nov','Dic'];

// ─── Helpers de timeline ──────────────────────────────────────────────────────

function parseMinutos(timeStr) {
  if (!timeStr) return null;
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + (m || 0);
}

function calcTop(startTime) {
  const mins = parseMinutos(startTime);
  return mins === null ? 0 : (mins / 60) * PX_POR_HORA;
}

function calcAlto(startTime, endTime) {
  const start = parseMinutos(startTime);
  if (start === null) return PX_POR_HORA;
  const end = parseMinutos(endTime);
  if (end === null) return 30;
  return Math.max(((end - start) / 60) * PX_POR_HORA, 24); // mínimo 24 px
}

// ─── Línea de tiempo actual ───────────────────────────────────────────────────

function LineaActual() {
  const calcTopActual = () => {
    const n = new Date();
    return ((n.getHours() * 60 + n.getMinutes()) / 60) * PX_POR_HORA;
  };

  const [top, setTop] = useState(calcTopActual);

  useEffect(() => {
    const id = setInterval(() => setTop(calcTopActual()), 60_000);
    return () => clearInterval(id);
  }, []);

  return (
    <div
      style={{
        position: 'absolute',
        top,
        left: 0,
        right: 0,
        zIndex: 10,
        display: 'flex',
        alignItems: 'center',
        pointerEvents: 'none',
      }}
    >
      <div
        style={{
          width: 7,
          height: 7,
          borderRadius: '50%',
          backgroundColor: '#EF4444',
          flexShrink: 0,
        }}
      />
      <div style={{ flex: 1, height: 1.5, backgroundColor: '#EF4444' }} />
    </div>
  );
}

// ─── Vista Timeline — Día / 3 Días ───────────────────────────────────────────
/**
 * Layout:
 *   [40px col horas | 1px divisor | flex columnas de días]
 *
 * Los 3 días caben en pantalla sin scroll horizontal.
 * Scroll vertical mueve toda la cuadrícula.
 */
function VistaTimeline({ fechas, eventosPorFecha, hoy, vistaActiva, onEventoClick }) {
  const scrollRef  = useRef(null);
  const esCompacto = vistaActiva === '3dias';

  // Scroll automático a la hora actual al montar o cambiar de vista
  useEffect(() => {
    if (!scrollRef.current) return;
    const n      = new Date();
    const topNow = ((n.getHours() * 60 + n.getMinutes()) / 60) * PX_POR_HORA;
    scrollRef.current.scrollTop = Math.max(0, topNow - 120);
  }, [vistaActiva]);

  return (
    <div
      ref={scrollRef}
      style={{
        overflowY: 'auto',
        overflowX: 'hidden',
        // altura visible: viewport − top header del layout (pt-20=80px) −
        // toggle+nav+headers (~170px) − bottomnav+padding (~100px)
        height: 'calc(100dvh - 350px)',
        minHeight: 280,
        borderRadius: 16,
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow-card)',
        WebkitOverflowScrolling: 'touch',
      }}
    >
      <div style={{ display: 'flex', minHeight: TOTAL_ALTO }}>

        {/* Columna de etiquetas de hora */}
        <div style={{ width: ANCHO_HORAS, flexShrink: 0 }}>
          {HORAS.map(h => (
            <div
              key={h}
              style={{
                height: PX_POR_HORA,
                display: 'flex',
                alignItems: 'flex-start',
                paddingTop: 2,
                paddingRight: 6,
              }}
            >
              {h > 0 && (
                <span
                  style={{
                    fontSize: 10,
                    color: 'var(--muted-light)',
                    width: '100%',
                    textAlign: 'right',
                    lineHeight: 1,
                    userSelect: 'none',
                  }}
                >
                  {h}h
                </span>
              )}
            </div>
          ))}
        </div>

        {/* Separador vertical */}
        <div style={{ width: 1, backgroundColor: 'var(--card-border)', flexShrink: 0 }} />

        {/* Columnas de días */}
        <div style={{ flex: 1, display: 'flex', minWidth: 0 }}>
          {fechas.map((fecha, idx) => {
            const fechaStr        = toDateStr(fecha);
            const esHoy           = fechaStr === hoy;
            const eventos         = eventosPorFecha[fechaStr] || [];
            const eventosConHora  = eventos.filter(ev => ev.start_time);

            return (
              <div key={fechaStr} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
                {/* Separador entre columnas de días */}
                {idx > 0 && (
                  <div style={{ width: 1, backgroundColor: 'var(--card-border)', flexShrink: 0 }} />
                )}

                {/* Área de la columna del día */}
                <div style={{ flex: 1, position: 'relative', height: TOTAL_ALTO, minWidth: 0 }}>

                  {/* Líneas horizontales por hora */}
                  {HORAS.map(h => (
                    <div
                      key={h}
                      style={{
                        position: 'absolute',
                        top: h * PX_POR_HORA,
                        left: 0,
                        right: 0,
                        height: 1,
                        backgroundColor: 'var(--card-border)',
                      }}
                    />
                  ))}

                  {/* Resaltado suave de hoy */}
                  {esHoy && (
                    <div
                      style={{
                        position: 'absolute',
                        inset: 0,
                        backgroundColor: 'var(--accent)',
                        opacity: 0.03,
                        pointerEvents: 'none',
                      }}
                    />
                  )}

                  {/* Línea de tiempo actual (solo columna de hoy) */}
                  {esHoy && <LineaActual />}

                  {/* Bloques de eventos con hora */}
                  {eventosConHora.map(ev => (
                    <div
                      key={`${ev.id}-${fechaStr}`}
                      style={{
                        position: 'absolute',
                        top: calcTop(ev.start_time),
                        left: 2,
                        right: 2,
                        height: calcAlto(ev.start_time, ev.end_time),
                        zIndex: 5,
                      }}
                    >
                      <EventCard
                        evento={ev}
                        vista={esCompacto ? 'bloque-3dias' : 'bloque-dia'}
                        onClick={() => onEventoClick(ev)}
                      />
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// ─── Vista Semana — lista colapsable por día ──────────────────────────────────
/**
 * Cada día es una sección colapsable con:
 *   - Burbuja con letra y número del día
 *   - Nombre del día + conteo de eventos
 *   - Al expandir: chips horizontales con emoji + título truncado
 */
function VistaSemanaLista({ fechas, eventosPorFecha, hoy, onEventoClick }) {
  const [expandidos, setExpandidos] = useState(() => new Set([hoy]));

  const toggle = (fechaStr) =>
    setExpandidos(prev => {
      const next = new Set(prev);
      next.has(fechaStr) ? next.delete(fechaStr) : next.add(fechaStr);
      return next;
    });

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      {fechas.map(fecha => {
        const fechaStr  = toDateStr(fecha);
        const esHoy     = fechaStr === hoy;
        const expandido = expandidos.has(fechaStr);
        const eventos   = eventosPorFecha[fechaStr] || [];

        return (
          <div
            key={fechaStr}
            style={{
              borderRadius: 16,
              backgroundColor: 'var(--card)',
              boxShadow: 'var(--shadow-card)',
              overflow: 'hidden',
            }}
          >
            {/* Cabecera del día — botón colapsable */}
            <button
              onClick={() => toggle(fechaStr)}
              style={{
                width: '100%',
                display: 'flex',
                alignItems: 'center',
                gap: 12,
                padding: '10px 14px',
                textAlign: 'left',
                background: 'none',
                border: 'none',
                cursor: 'pointer',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              {/* Burbuja de fecha */}
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 11,
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0,
                  backgroundColor: esHoy ? 'var(--accent)' : 'var(--card-border)',
                }}
              >
                <span
                  style={{
                    fontSize: 9,
                    fontWeight: 700,
                    lineHeight: 1,
                    color: esHoy ? 'rgba(255,255,255,0.75)' : 'var(--muted-light)',
                    textTransform: 'uppercase',
                    letterSpacing: '0.05em',
                  }}
                >
                  {LETRAS_DIA[fecha.getDay()]}
                </span>
                <span
                  style={{
                    fontSize: 15,
                    fontWeight: 700,
                    lineHeight: 1,
                    marginTop: 2,
                    color: esHoy ? 'white' : 'var(--foreground)',
                  }}
                >
                  {fecha.getDate()}
                </span>
              </div>

              {/* Info del día */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <p
                  style={{
                    margin: 0,
                    fontSize: 13,
                    fontWeight: 600,
                    color: esHoy ? 'var(--accent)' : 'var(--foreground)',
                    lineHeight: 1.3,
                  }}
                >
                  {NOMBRES_DIA[fecha.getDay()]} {fecha.getDate()} {MESES_CORTO[fecha.getMonth()]}
                </p>
                <p style={{ margin: 0, fontSize: 11, color: 'var(--muted-light)', marginTop: 2, lineHeight: 1 }}>
                  {eventos.length === 0
                    ? 'Sin eventos'
                    : `${eventos.length} evento${eventos.length !== 1 ? 's' : ''}`}
                </p>
              </div>

              {/* Chevron */}
              <span
                style={{
                  fontSize: 14,
                  color: 'var(--muted-light)',
                  transform: expandido ? 'rotate(180deg)' : 'rotate(0deg)',
                  transition: 'transform 0.2s ease',
                  flexShrink: 0,
                  lineHeight: 1,
                }}
              >
                ▾
              </span>
            </button>

            {/* Chips de eventos */}
            {expandido && (
              <div
                style={{
                  padding: '0 12px 12px',
                  display: 'flex',
                  flexWrap: 'wrap',
                  gap: 6,
                }}
              >
                {eventos.length === 0 ? (
                  <p
                    style={{
                      margin: 0,
                      fontSize: 11,
                      color: 'var(--muted-light)',
                      width: '100%',
                      textAlign: 'center',
                      padding: '8px 0',
                    }}
                  >
                    Día libre
                  </p>
                ) : (
                  eventos.map(ev => (
                    <EventCard
                      key={`${ev.id}-${fechaStr}`}
                      evento={ev}
                      vista="semana"
                      onClick={() => onEventoClick(ev)}
                    />
                  ))
                )}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}

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

  const excMap = {};
  (excepciones || []).forEach(({ event_id, exception_date }) => {
    const k = String(event_id);
    if (!excMap[k]) excMap[k] = new Set();
    excMap[k].add(exception_date);
  });

  const porFecha = {};
  fechas.forEach(f => { porFecha[toDateStr(f)] = []; });

  (eventosUnicos || []).forEach(ev => {
    if (porFecha[ev.date] !== undefined) {
      porFecha[ev.date].push({ ...ev, _fechaVista: ev.date });
    }
  });

  fechas.forEach(fecha => {
    const fechaStr  = toDateStr(fecha);
    const claveHoy  = DIAS_RECURRENCIA[fecha.getDay()];
    (eventosRecurrentes || []).forEach(ev => {
      if (!ev.recurrence_days?.includes(claveHoy)) return;
      if (excMap[String(ev.id)]?.has(fechaStr)) return;
      porFecha[fechaStr].push({ ...ev, _fechaVista: fechaStr });
    });
  });

  Object.keys(porFecha).forEach(fechaStr => {
    porFecha[fechaStr].sort((a, b) => {
      if (!a.start_time) return 1;
      if (!b.start_time) return -1;
      return a.start_time.localeCompare(b.start_time);
    });
  });

  return porFecha;
}

// ─── Cabecera de días para vista Timeline ────────────────────────────────────
/**
 * Barra fija sobre el timeline, alineada con las columnas.
 * Clic en un día navega a la vista Día de esa fecha.
 */
function CabeceraTimeline({ fechas, hoy, vista, onClickDia }) {
  return (
    <div
      style={{
        display: 'flex',
        marginBottom: 4,
        borderRadius: 14,
        backgroundColor: 'var(--card)',
        boxShadow: 'var(--shadow-card)',
        overflow: 'hidden',
      }}
    >
      {/* Espacio que corresponde a la columna de horas + separador */}
      <div style={{ width: ANCHO_HORAS + 1, flexShrink: 0 }} />

      {fechas.map((fecha, idx) => {
        const fechaStr = toDateStr(fecha);
        const esHoy    = fechaStr === hoy;

        return (
          <div key={fechaStr} style={{ flex: 1, display: 'flex', minWidth: 0 }}>
            {idx > 0 && (
              <div style={{ width: 1, backgroundColor: 'var(--card-border)', flexShrink: 0 }} />
            )}
            <button
              onClick={() => onClickDia(fecha)}
              style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                padding: '8px 2px',
                background: esHoy ? 'var(--accent)' : 'none',
                border: 'none',
                cursor: vista !== 'dia' ? 'pointer' : 'default',
                WebkitTapHighlightColor: 'transparent',
              }}
            >
              <span
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  lineHeight: 1,
                  color: esHoy ? 'rgba(255,255,255,0.75)' : 'var(--muted-light)',
                  textTransform: 'uppercase',
                }}
              >
                {LETRAS_DIA[fecha.getDay()]}
              </span>
              <span
                style={{
                  fontSize: 15,
                  fontWeight: 700,
                  lineHeight: 1,
                  marginTop: 2,
                  color: esHoy ? 'white' : 'var(--foreground)',
                }}
              >
                {fecha.getDate()}
              </span>
            </button>
          </div>
        );
      })}
    </div>
  );
}

// ─── Componente principal ─────────────────────────────────────────────────────

export default function Calendario() {
  const { calendarVersion } = useXP();

  const [vista,            setVista]            = useState('semana');
  const [fechaBase,        setFechaBase]        = useState(new Date());
  const [eventosPorFecha,  setEventosPorFecha]  = useState({});
  const [cargando,         setCargando]         = useState(true);
  const [eventoDetalle,    setEventoDetalle]    = useState(null);
  const [eventoEditar,     setEventoEditar]     = useState(null);

  const fechas         = calcularFechas(fechaBase, vista);
  const hoy            = hoyStr();
  const esTimeline     = vista === 'dia' || vista === '3dias';

  useEffect(() => {
    let cancelado = false;
    setCargando(true);
    cargarEventosRango(calcularFechas(fechaBase, vista))
      .then(data => { if (!cancelado) { setEventosPorFecha(data); setCargando(false); } })
      .catch(() => { if (!cancelado) setCargando(false); });
    return () => { cancelado = true; };
  }, [fechaBase, vista, calendarVersion]);

  const irAHoy  = () => setFechaBase(new Date());
  const navegar = (dir) => setFechaBase(prev => navegarFecha(prev, vista, dir));

  const handleClickDia = (fecha) => {
    if (vista !== 'dia') {
      setVista('dia');
      setFechaBase(new Date(fecha));
    }
  };

  return (
    <div>
      {/* ── Toggle de vistas ─────────────────────────────────────────────── */}
      <div
        className="flex gap-1.5 mb-4 bg-card-border p-1 rounded-2xl"
        style={{ boxShadow: 'var(--shadow-sm)' }}
      >
        {[['dia', 'Día'], ['3dias', '3 Días'], ['semana', 'Semana']].map(([v, label]) => (
          <button
            key={v}
            onClick={() => setVista(v)}
            className="flex-1 py-2 rounded-xl text-sm font-semibold transition-all duration-200"
            style={{
              backgroundColor: vista === v ? 'var(--card)'  : 'transparent',
              color:           vista === v ? 'var(--accent)' : 'var(--muted)',
              boxShadow:       vista === v ? 'var(--shadow-card)' : 'none',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      {/* ── Navegación ───────────────────────────────────────────────────── */}
      <div className="flex items-center gap-2 mb-3">
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

      {/* ── Cuerpo principal ─────────────────────────────────────────────── */}
      {cargando ? (
        // Skeleton
        <div className="space-y-2 animate-pulse">
          {[1, 2, 3].map(i => (
            <div key={i} className="h-16 bg-card rounded-2xl" style={{ opacity: 1 - i * 0.2 }} />
          ))}
        </div>
      ) : esTimeline ? (
        <>
          {/* Cabecera de días alineada con las columnas del timeline */}
          <CabeceraTimeline
            fechas={fechas}
            hoy={hoy}
            vista={vista}
            onClickDia={handleClickDia}
          />

          {/* Timeline con scroll vertical */}
          <VistaTimeline
            fechas={fechas}
            eventosPorFecha={eventosPorFecha}
            hoy={hoy}
            vistaActiva={vista}
            onEventoClick={setEventoDetalle}
          />
        </>
      ) : (
        // Semana: lista colapsable
        <VistaSemanaLista
          fechas={fechas}
          eventosPorFecha={eventosPorFecha}
          hoy={hoy}
          onEventoClick={setEventoDetalle}
        />
      )}

      {/* ── Modal detalle ─────────────────────────────────────────────────── */}
      {eventoDetalle && (
        <ModalDetalleEvento
          evento={eventoDetalle}
          onCerrar={() => setEventoDetalle(null)}
          onEditar={(ev) => { setEventoDetalle(null); setEventoEditar(ev); }}
        />
      )}

      {/* ── Modal edición ─────────────────────────────────────────────────── */}
      <ModalEvento
        visible={!!eventoEditar}
        eventoInicial={eventoEditar}
        onCerrar={() => setEventoEditar(null)}
        onGuardado={() => setEventoEditar(null)}
      />
    </div>
  );
}
