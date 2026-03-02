'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useXP } from '@/contexts/XPContext';
import { obtenerSiguienteRango } from '@/lib/ranks';
import { DIAS_RECURRENCIA } from '@/lib/schedule';

// ─── Helpers de fecha ─────────────────────────────────────────────────────────

function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

function inicioSemana(fechaStr) {
  const d = new Date(fechaStr + 'T00:00:00');
  const dia = d.getDay();
  const diasDesdelunes = dia === 0 ? 6 : dia - 1;
  d.setDate(d.getDate() - diasDesdelunes);
  return d.toISOString().split('T')[0];
}

function inicioMes(fechaStr) {
  return fechaStr.slice(0, 7) + '-01';
}

function semanaCompleta(hoy) {
  const lunes = new Date(inicioSemana(hoy) + 'T00:00:00');
  return Array.from({ length: 7 }, (_, i) => {
    const d = new Date(lunes);
    d.setDate(lunes.getDate() + i);
    return d.toISOString().split('T')[0];
  });
}

function generarDias(desde, hasta) {
  const dias = [];
  let d = new Date(desde + 'T00:00:00');
  const fin = new Date(hasta + 'T00:00:00');
  while (d <= fin) {
    dias.push(d.toISOString().split('T')[0]);
    d.setDate(d.getDate() + 1);
  }
  return dias;
}

function claveRecurrenciaDia(fechaStr) {
  return DIAS_RECURRENCIA[new Date(fechaStr + 'T00:00:00').getDay()];
}

const LETRAS_DIA = ['D', 'L', 'M', 'X', 'J', 'V', 'S'];

function letraDia(fechaStr) {
  return LETRAS_DIA[new Date(fechaStr + 'T00:00:00').getDay()];
}

function parsearMinutos(t) {
  if (!t) return 0;
  const [h, m] = t.split(':').map(Number);
  return h * 60 + (m || 0);
}

function formatearHora(min) {
  const h = Math.floor(min / 60);
  const m = min % 60;
  if (h > 0 && m > 0) return `${h}h ${m}m`;
  if (h > 0) return `${h}h`;
  return `${m}m`;
}

// ─── Funciones de análisis ────────────────────────────────────────────────────

function calcularRecordRacha(fechas) {
  if (!fechas.length) return 0;
  const sorted = [...new Set(fechas)].sort();
  let max = 1, actual = 1;
  for (let i = 1; i < sorted.length; i++) {
    const diff = (new Date(sorted[i] + 'T00:00:00') - new Date(sorted[i - 1] + 'T00:00:00')) / 86400000;
    if (diff === 1) { actual++; if (actual > max) max = actual; }
    else if (diff > 1) actual = 1;
  }
  return max;
}

function calcularDiasPerfectos(completaciones, totalDiario) {
  if (!totalDiario) return 0;
  const porDia = {};
  completaciones.forEach(c => { porDia[c.date] = (porDia[c.date] || 0) + 1; });
  return Object.values(porDia).filter(n => n >= totalDiario).length;
}

function calcularConsistencia(completaciones, eventos, diasSemana) {
  const resultado = {};
  eventos.forEach(ev => {
    const id = String(ev.id);
    if (!resultado[id]) resultado[id] = { nombre: ev.title, emoji: ev.emoji || '📅', total: 0, completados: 0 };
    diasSemana.forEach(dia => {
      const programado = ev.recurring
        ? (ev.recurrence_days || []).includes(claveRecurrenciaDia(dia))
        : ev.date === dia;
      if (programado) {
        resultado[id].total++;
        if (completaciones.some(c => c.date === dia && c.activity_id === id)) resultado[id].completados++;
      }
    });
  });
  return Object.values(resultado)
    .filter(a => a.total > 0)
    .map(a => ({ ...a, pct: Math.round((a.completados / a.total) * 100) }))
    .sort((a, b) => b.pct - a.pct);
}

function calcularMejorFranja(completaciones) {
  const franjas = { mañana: 0, tarde: 0, noche: 0, madrugada: 0 };
  completaciones.forEach(c => {
    if (!c.completed_at) return;
    const h = new Date(c.completed_at).getHours();
    if (h >= 6 && h < 12) franjas.mañana++;
    else if (h >= 12 && h < 18) franjas.tarde++;
    else if (h >= 18) franjas.noche++;
    else franjas.madrugada++;
  });
  const [nombre, count] = Object.entries(franjas).sort((a, b) => b[1] - a[1])[0];
  return count > 0 ? { nombre, count } : null;
}

function calcularXPPorSemana(completaciones, desde, hasta) {
  const semanas = [];
  let d = new Date(desde + 'T00:00:00');
  const fin = new Date(hasta + 'T00:00:00');
  while (d <= fin) {
    const iS = d.toISOString().split('T')[0];
    const nxt = new Date(d);
    nxt.setDate(d.getDate() + 6);
    const fS = (nxt > fin ? fin : nxt).toISOString().split('T')[0];
    semanas.push({ inicio: iS, fin: fS });
    d.setDate(d.getDate() + 7);
  }
  const xpPorSemana = semanas.map(s =>
    completaciones
      .filter(c => c.date >= s.inicio && c.date <= s.fin)
      .reduce((sum, c) => sum + (c.xp_earned || 0), 0)
  );
  return { xpPorSemana, semanasMes: semanas };
}

function calcularPrediccionRango(xpActual, completaciones7d) {
  const xp7d = completaciones7d.reduce((s, c) => s + (c.xp_earned || 0), 0);
  const promDiario = xp7d / 7;
  if (promDiario <= 0) return null;
  const siguiente = obtenerSiguienteRango(xpActual);
  if (!siguiente) return null;
  const dias = Math.ceil((siguiente.minXP - xpActual) / promDiario);
  if (dias > 365) return null;
  return { nombre: siguiente.nombre, color: siguiente.color, dias };
}

// ─── Componentes UI ───────────────────────────────────────────────────────────

function Card({ children, className = '', padding = 'p-4' }) {
  return (
    <div
      className={`bg-card rounded-2xl ${padding} ${className}`}
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {children}
    </div>
  );
}

function NumeroGrande({ valor, label, color = '#3B82F6', sub = '' }) {
  return (
    <div className="text-center py-2">
      <p className="text-5xl font-bold leading-none" style={{ color }}>{valor}</p>
      <p className="text-base font-semibold text-foreground mt-2">{label}</p>
      {sub && <p className="text-sm text-muted mt-1">{sub}</p>}
    </div>
  );
}

function BarraProgreso({ valor, total, color = '#3B82F6' }) {
  const pct = total > 0 ? Math.min(Math.round((valor / total) * 100), 100) : 0;
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-2 bg-card-border rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-700"
          style={{ width: `${pct}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-xs text-muted w-9 text-right">{pct}%</span>
    </div>
  );
}

// ─── Vista Hoy ────────────────────────────────────────────────────────────────

function VistaHoy({ datos }) {
  const {
    xpHoy,
    actividadesCompletadas,
    actividadesTotal,
    habitosCompletados,
    habitosTotal,
    listaCompletadas,
    tiempoTotalMin,
    diasPerfectos,
  } = datos;

  return (
    <div className="space-y-4">
      {/* XP ganado hoy */}
      <Card>
        <NumeroGrande
          valor={xpHoy}
          label="XP ganado hoy"
          color="#3B82F6"
          sub={xpHoy === 0 ? 'Completa actividades para ganar XP' : '¡Sigue así!'}
        />
      </Card>

      {/* Stats rápidos */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold text-foreground">{actividadesCompletadas}/{actividadesTotal}</p>
          <p className="text-[11px] text-muted mt-1">Actividades</p>
        </Card>
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold text-foreground">{habitosCompletados}/{habitosTotal}</p>
          <p className="text-[11px] text-muted mt-1">Hábitos</p>
        </Card>
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold" style={{ color: '#22C55E' }}>{diasPerfectos}</p>
          <p className="text-[11px] text-muted mt-1">Días 🏅</p>
        </Card>
      </div>

      {/* Barras de progreso */}
      <Card>
        <div className="flex justify-between items-center mb-2">
          <p className="text-sm font-semibold text-foreground">Actividades</p>
          <span className="text-xs text-muted">{actividadesCompletadas}/{actividadesTotal}</span>
        </div>
        <BarraProgreso valor={actividadesCompletadas} total={actividadesTotal} color="#3B82F6" />
        <div className="flex justify-between items-center mb-2 mt-4">
          <p className="text-sm font-semibold text-foreground">Hábitos</p>
          <span className="text-xs text-muted">{habitosCompletados}/{habitosTotal}</span>
        </div>
        <BarraProgreso valor={habitosCompletados} total={habitosTotal} color="#22C55E" />
      </Card>

      {/* Tiempo total */}
      {tiempoTotalMin > 0 && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">⏱️</span>
            <div>
              <p className="text-xl font-bold text-foreground">{formatearHora(tiempoTotalMin)}</p>
              <p className="text-xs text-muted">Tiempo en actividades completadas</p>
            </div>
          </div>
        </Card>
      )}

      {/* Lista de completadas */}
      {listaCompletadas.length > 0 ? (
        <Card>
          <p className="text-sm font-semibold text-foreground mb-3">Completadas hoy</p>
          <div className="space-y-0">
            {listaCompletadas.map((item, i) => (
              <div
                key={i}
                className="flex items-center gap-3 py-2.5 border-b border-card-border last:border-0"
              >
                <span className="text-xl">{item.emoji}</span>
                <span className="flex-1 text-sm text-foreground">{item.nombre}</span>
                {item.xp > 0 && (
                  <span className="text-xs font-semibold" style={{ color: '#3B82F6' }}>
                    +{item.xp} XP
                  </span>
                )}
              </div>
            ))}
          </div>
        </Card>
      ) : (
        <Card className="text-center py-6">
          <p className="text-3xl mb-2">🌅</p>
          <p className="text-sm font-medium text-foreground">Aún no has completado nada hoy</p>
          <p className="text-xs text-muted mt-1">¡Ve al Dashboard y marca tus actividades!</p>
        </Card>
      )}
    </div>
  );
}

// ─── Vista Semana ─────────────────────────────────────────────────────────────

function GraficaBarrasSemana({ xpPorDia, diasSemana, hoy }) {
  const maxXP = Math.max(...diasSemana.map(d => xpPorDia[d] || 0), 1);
  const diaMax = diasSemana.reduce(
    (best, d) => (xpPorDia[d] || 0) > (xpPorDia[best] || 0) ? d : best,
    diasSemana[0]
  );

  return (
    <div className="flex items-end gap-1.5" style={{ height: '88px' }}>
      {diasSemana.map(d => {
        const xp = xpPorDia[d] || 0;
        const pct = xp / maxXP;
        const esMejor = d === diaMax && xp > 0;
        const esHoy = d === hoy;
        const esFuturo = d > hoy;
        return (
          <div key={d} className="flex-1 flex flex-col items-center justify-end gap-1">
            {esMejor && (
              <span className="text-[8px] font-bold" style={{ color: '#3B82F6' }}>{xp}</span>
            )}
            <div
              className="w-full rounded-t-md transition-all duration-700"
              style={{
                height: `${Math.max(pct * 64, xp > 0 ? 6 : 2)}px`,
                backgroundColor: esFuturo
                  ? 'var(--card-border)'
                  : esMejor
                  ? '#3B82F6'
                  : esHoy
                  ? '#93C5FD'
                  : xp > 0
                  ? '#BFDBFE'
                  : 'var(--card-border)',
                minHeight: '2px',
              }}
            />
            <span className={`text-[9px] ${esHoy ? 'font-bold text-accent' : 'text-muted'}`}>
              {letraDia(d)}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function VistaSemana({ datos, hoy }) {
  const {
    xpSemana,
    xpPorDia,
    diasSemana,
    consistenciaActividades,
    mejorFranja,
    racha,
    recordRacha,
    porcentajeSemana,
  } = datos;

  const DIAS_NOMBRE = ['Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'];
  const nombreDia = d => DIAS_NOMBRE[new Date(d + 'T00:00:00').getDay()];
  const diaMaximo = diasSemana.reduce(
    (best, d) => (xpPorDia[d] || 0) > (xpPorDia[best] || 0) ? d : best,
    diasSemana[0]
  );

  return (
    <div className="space-y-4">
      {/* XP total semana */}
      <Card>
        <NumeroGrande
          valor={xpSemana}
          label="XP esta semana"
          color="#3B82F6"
          sub={`${porcentajeSemana}% de actividades completadas`}
        />
      </Card>

      {/* Gráfica de barras */}
      <Card>
        <div className="flex justify-between items-center mb-4">
          <p className="text-sm font-semibold text-foreground">XP por día</p>
          {xpPorDia[diaMaximo] > 0 && (
            <span className="text-xs font-medium" style={{ color: '#3B82F6' }}>
              🏆 {nombreDia(diaMaximo)}
            </span>
          )}
        </div>
        <GraficaBarrasSemana xpPorDia={xpPorDia} diasSemana={diasSemana} hoy={hoy} />
      </Card>

      {/* Racha */}
      <div className="grid grid-cols-2 gap-3">
        <Card padding="p-3" className="text-center">
          <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>🔥 {racha}</p>
          <p className="text-xs text-muted mt-1">Racha actual</p>
        </Card>
        <Card padding="p-3" className="text-center">
          <p className="text-2xl font-bold text-foreground">🏆 {recordRacha}</p>
          <p className="text-xs text-muted mt-1">Récord</p>
        </Card>
      </div>

      {/* Mejor franja horaria */}
      {mejorFranja && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🕐</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Mejor momento del día</p>
              <p className="text-xs text-muted mt-0.5">
                Completas más en la <strong>{mejorFranja.nombre}</strong> ({mejorFranja.count} completadas)
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Consistencia por actividad */}
      {consistenciaActividades.length > 0 && (
        <Card>
          <p className="text-sm font-semibold text-foreground mb-4">Consistencia por actividad</p>
          <div className="space-y-3">
            {consistenciaActividades.slice(0, 8).map((item, i) => (
              <div key={i}>
                <div className="flex justify-between items-center mb-1.5">
                  <div className="flex items-center gap-2 min-w-0 flex-1">
                    <span className="text-sm flex-shrink-0">{item.emoji}</span>
                    <span className="text-xs text-foreground truncate">{item.nombre}</span>
                  </div>
                  <span className="text-xs text-muted flex-shrink-0 ml-2">
                    {item.completados}/{item.total} días
                  </span>
                </div>
                <BarraProgreso
                  valor={item.completados}
                  total={item.total}
                  color={item.pct >= 80 ? '#22C55E' : item.pct >= 50 ? '#3B82F6' : '#F59E0B'}
                />
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Gráfica de línea SVG inline ──────────────────────────────────────────────

function GraficaLinea({ valores, etiquetas }) {
  if (!valores || valores.length < 2) return null;
  const max = Math.max(...valores, 1);
  const W = 300, H = 80, PAD = 12;
  const n = valores.length;
  const xP = i => PAD + (i / (n - 1)) * (W - PAD * 2);
  const yP = v => H - PAD - ((v / max) * (H - PAD * 2));
  const linea = valores.map((v, i) => `${xP(i)},${yP(v)}`).join(' ');
  const area = [
    `${xP(0)},${H - PAD}`,
    ...valores.map((v, i) => `${xP(i)},${yP(v)}`),
    `${xP(n - 1)},${H - PAD}`,
  ].join(' ');

  return (
    <div>
      <svg viewBox={`0 0 ${W} ${H}`} className="w-full" style={{ height: '80px' }}>
        <polygon points={area} fill="#3B82F615" />
        <polyline
          points={linea}
          fill="none"
          stroke="#3B82F6"
          strokeWidth="2"
          strokeLinejoin="round"
          strokeLinecap="round"
        />
        {valores.map((v, i) => (
          <circle key={i} cx={xP(i)} cy={yP(v)} r="3" fill="white" stroke="#3B82F6" strokeWidth="2" />
        ))}
      </svg>
      <div className="flex justify-between mt-1 px-1">
        {etiquetas.map((e, i) => (
          <span key={i} className="text-[9px] text-muted">{e}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Vista Mes ────────────────────────────────────────────────────────────────

function VistaMes({ datos }) {
  const {
    xpMes,
    xpPorSemana,
    semanasMes,
    diasActivos,
    diasMes,
    diasPerfectos,
    topHabitos,
    racha,
    recordRacha,
    prediccionRango,
  } = datos;

  const etiquetasSemanas = semanasMes.map((_, i) => `S${i + 1}`);

  return (
    <div className="space-y-4">
      {/* XP total mes */}
      <Card>
        <NumeroGrande
          valor={xpMes}
          label="XP este mes"
          color="#3B82F6"
          sub={`${diasActivos} de ${diasMes} días activos`}
        />
      </Card>

      {/* Tendencia XP por semana */}
      <Card>
        <p className="text-sm font-semibold text-foreground mb-3">Tendencia XP por semana</p>
        <GraficaLinea valores={xpPorSemana} etiquetas={etiquetasSemanas} />
      </Card>

      {/* Stats del mes */}
      <div className="grid grid-cols-3 gap-3">
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold text-foreground">{diasActivos}</p>
          <p className="text-[11px] text-muted mt-1">Días activos</p>
        </Card>
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold" style={{ color: '#22C55E' }}>{diasPerfectos}</p>
          <p className="text-[11px] text-muted mt-1">Días perfectos</p>
        </Card>
        <Card padding="p-3" className="text-center">
          <p className="text-xl font-bold" style={{ color: '#F59E0B' }}>{racha}</p>
          <p className="text-[11px] text-muted mt-1">🔥 Racha</p>
        </Card>
      </div>

      {/* Rachas históricas */}
      <Card>
        <p className="text-sm font-semibold text-foreground mb-3">Rachas históricas</p>
        <div className="flex gap-4">
          <div className="flex-1 text-center bg-background rounded-xl p-3">
            <p className="text-2xl font-bold" style={{ color: '#F59E0B' }}>{racha}</p>
            <p className="text-xs text-muted mt-0.5">🔥 Racha actual</p>
          </div>
          <div className="flex-1 text-center bg-background rounded-xl p-3">
            <p className="text-2xl font-bold text-foreground">{recordRacha}</p>
            <p className="text-xs text-muted mt-0.5">🏆 Mejor racha</p>
          </div>
        </div>
      </Card>

      {/* Top 3 hábitos del mes */}
      {topHabitos.length > 0 && (
        <Card>
          <p className="text-sm font-semibold text-foreground mb-3">Top hábitos del mes</p>
          <div className="space-y-3">
            {topHabitos.slice(0, 3).map((h, i) => {
              const medallas = ['🥇', '🥈', '🥉'];
              const colores = ['#F59E0B', '#9CA3AF', '#CD7C32'];
              return (
                <div key={h.id}>
                  <div className="flex justify-between items-center mb-1.5">
                    <div className="flex items-center gap-2 min-w-0 flex-1">
                      <span className="flex-shrink-0">{medallas[i]}</span>
                      <span className="text-sm flex-shrink-0">{h.emoji || h.icon || '💪'}</span>
                      <span className="text-xs text-foreground truncate">{h.name}</span>
                    </div>
                    <span className="text-xs text-muted flex-shrink-0 ml-2">
                      {h.completados}d
                    </span>
                  </div>
                  <BarraProgreso valor={h.completados} total={diasMes} color={colores[i]} />
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Predicción de rango */}
      {prediccionRango && (
        <Card>
          <div className="flex items-center gap-3">
            <span className="text-2xl">🚀</span>
            <div>
              <p className="text-sm font-semibold text-foreground">Predicción de rango</p>
              <p className="text-xs text-muted mt-0.5">
                A este ritmo subirás a{' '}
                <strong style={{ color: prediccionRango.color }}>{prediccionRango.nombre}</strong>
                {' '}en ~{prediccionRango.dias} días
              </p>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}

// ─── Pantalla principal ───────────────────────────────────────────────────────

export default function Reportes() {
  const { racha, xpTotal } = useXP();
  const [vista, setVista] = useState('hoy');
  const [cargando, setCargando] = useState(true);
  const [datosHoy, setDatosHoy] = useState(null);
  const [datosSemana, setDatosSemana] = useState(null);
  const [datosMes, setDatosMes] = useState(null);

  useEffect(() => {
    async function cargar() {
      setCargando(true);
      const hoy = fechaHoy();
      const inSem = inicioSemana(hoy);
      const inMes = inicioMes(hoy);
      const diasSem = semanaCompleta(hoy);

      try {
        const [
          { data: compHoy },
          { data: eventos },
          { data: habLogHoy },
          { data: habitos },
          { data: compSemana },
          { data: compMes },
          { data: habLogsMes },
          { data: todosHabLogs },
          { data: progreso },
        ] = await Promise.all([
          supabase.from('daily_completions')
            .select('activity_id, activity_name, xp_earned, completed_at')
            .eq('date', hoy),
          supabase.from('calendar_events')
            .select('id, title, emoji, start_time, end_time, xp_reward, recurrence_days, recurring, date')
            .order('start_time'),
          supabase.from('habit_logs').select('habit_id').eq('completed_date', hoy),
          supabase.from('habits').select('id, name, emoji, icon, color').order('created_at'),
          supabase.from('daily_completions')
            .select('date, activity_id, xp_earned, completed_at')
            .gte('date', inSem).lte('date', hoy),
          supabase.from('daily_completions')
            .select('date, xp_earned')
            .gte('date', inMes).lte('date', hoy),
          supabase.from('habit_logs')
            .select('habit_id, completed_date')
            .gte('completed_date', inMes).lte('completed_date', hoy),
          supabase.from('habit_logs').select('completed_date'),
          supabase.from('user_progress').select('streak, xp').eq('id', 1).maybeSingle(),
        ]);

        // ─── Procesar HOY ─────────────────────────────────────────────────────
        const claveHoy = claveRecurrenciaDia(hoy);
        const eventosDeHoy = (eventos || []).filter(ev =>
          ev.recurring
            ? (ev.recurrence_days || []).includes(claveHoy)
            : ev.date === hoy
        );

        const idsCompletados = new Set((compHoy || []).map(c => c.activity_id));
        let tiempoMin = 0;
        eventosDeHoy.forEach(ev => {
          if (idsCompletados.has(String(ev.id)) && ev.start_time && ev.end_time) {
            tiempoMin += parsearMinutos(ev.end_time) - parsearMinutos(ev.start_time);
          }
        });

        const listaCompletadas = (compHoy || []).map(c => {
          const ev = eventosDeHoy.find(e => String(e.id) === c.activity_id);
          return {
            nombre: c.activity_name || c.activity_id,
            emoji: ev?.emoji || '✅',
            xp: c.xp_earned || 0,
          };
        });

        // Días perfectos: mes actual, usando total de hoy como referencia
        const diasPerfectosAcum = calcularDiasPerfectos(compMes || [], eventosDeHoy.length);

        setDatosHoy({
          xpHoy: (compHoy || []).reduce((s, c) => s + (c.xp_earned || 0), 0),
          actividadesCompletadas: (compHoy || []).length,
          actividadesTotal: eventosDeHoy.length,
          habitosCompletados: (habLogHoy || []).length,
          habitosTotal: (habitos || []).length,
          listaCompletadas,
          tiempoTotalMin: tiempoMin,
          diasPerfectos: diasPerfectosAcum,
        });

        // ─── Procesar SEMANA ──────────────────────────────────────────────────
        const xpPorDia = {};
        diasSem.forEach(d => { xpPorDia[d] = 0; });
        (compSemana || []).forEach(c => {
          xpPorDia[c.date] = (xpPorDia[c.date] || 0) + (c.xp_earned || 0);
        });

        const xpSemana = Object.values(xpPorDia).reduce((s, v) => s + v, 0);
        const consistencia = calcularConsistencia(compSemana || [], eventos || [], diasSem);
        const mejorFranja = calcularMejorFranja(compSemana || []);

        const totalPosSemana = consistencia.reduce((s, a) => s + a.total, 0);
        const porcentajeSemana = totalPosSemana > 0
          ? Math.round(((compSemana || []).length / totalPosSemana) * 100)
          : 0;

        const fechasHabitos = (todosHabLogs || []).map(l => l.completed_date);
        const recordRacha = calcularRecordRacha(fechasHabitos);

        setDatosSemana({
          xpSemana,
          xpPorDia,
          diasSemana: diasSem,
          consistenciaActividades: consistencia,
          mejorFranja,
          racha: progreso?.streak ?? racha,
          recordRacha,
          porcentajeSemana,
        });

        // ─── Procesar MES ─────────────────────────────────────────────────────
        const diasDelMes = generarDias(inMes, hoy).length;
        const diasActivosMes = new Set((compMes || []).map(c => c.date)).size;
        const { xpPorSemana, semanasMes } = calcularXPPorSemana(compMes || [], inMes, hoy);
        const diasPerfectosMes = calcularDiasPerfectos(compMes || [], eventosDeHoy.length);
        const xpMes = (compMes || []).reduce((s, c) => s + (c.xp_earned || 0), 0);

        const habPorCompl = {};
        (habLogsMes || []).forEach(l => {
          habPorCompl[l.habit_id] = (habPorCompl[l.habit_id] || 0) + 1;
        });
        const topHabitos = (habitos || [])
          .map(h => ({ ...h, completados: habPorCompl[h.id] || 0 }))
          .filter(h => h.completados > 0)
          .sort((a, b) => b.completados - a.completados);

        setDatosMes({
          xpMes,
          xpPorSemana,
          semanasMes,
          diasActivos: diasActivosMes,
          diasMes: diasDelMes,
          diasPerfectos: diasPerfectosMes,
          topHabitos,
          racha: progreso?.streak ?? racha,
          recordRacha,
          prediccionRango: calcularPrediccionRango(xpTotal, compSemana || []),
        });
      } catch (e) {
        console.error('Error cargando reportes:', e);
      } finally {
        setCargando(false);
      }
    }

    cargar();
  }, [racha, xpTotal]);

  if (cargando) {
    return (
      <div className="space-y-4 animate-pulse">
        <div className="h-7 bg-card rounded-xl w-1/3" />
        <div className="h-10 bg-card rounded-xl" />
        <div className="h-40 bg-card rounded-2xl" />
        <div className="grid grid-cols-3 gap-3">
          {[1, 2, 3].map(i => <div key={i} className="h-20 bg-card rounded-2xl" />)}
        </div>
        <div className="h-48 bg-card rounded-2xl" />
      </div>
    );
  }

  return (
    <>
      <h1 className="text-xl font-bold text-foreground mb-1">Reportes</h1>
      <p className="text-sm text-muted mb-5">Tu progreso y estadísticas</p>

      {/* Toggle principal */}
      <div className="flex bg-card-border rounded-xl p-1 mb-5" style={{ boxShadow: 'var(--shadow-sm)' }}>
        {[
          { key: 'hoy', label: 'Hoy' },
          { key: 'semana', label: 'Semana' },
          { key: 'mes', label: 'Mes' },
        ].map(({ key, label }) => (
          <button
            key={key}
            onClick={() => setVista(key)}
            className={`flex-1 h-9 rounded-lg text-sm font-medium transition-all duration-200 ${
              vista === key ? 'bg-card text-foreground shadow-sm' : 'text-muted'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {vista === 'hoy' && datosHoy && <VistaHoy datos={datosHoy} />}
      {vista === 'semana' && datosSemana && <VistaSemana datos={datosSemana} hoy={fechaHoy()} />}
      {vista === 'mes' && datosMes && <VistaMes datos={datosMes} />}
    </>
  );
}
