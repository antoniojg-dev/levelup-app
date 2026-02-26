'use client';

import { useXP } from '@/contexts/XPContext';

/**
 * Card de progreso diario con porcentaje y XP del día
 */
export default function DailyProgress() {
  const {
    progresoDia,
    actividadesCompletadasHoy,
    totalActividadesHoy,
    xpHoy,
    racha,
  } = useXP();

  return (
    <div className="grid grid-cols-2 gap-3 mb-4">
      {/* Progreso del día */}
      <div
        className="bg-card rounded-2xl p-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-xs text-muted font-medium mb-1">Progreso hoy</p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-foreground">
            {progresoDia}
          </span>
          <span className="text-sm text-muted mb-1">%</span>
        </div>
        <p className="text-xs text-muted-light mt-1">
          {actividadesCompletadasHoy}/{totalActividadesHoy} actividades
        </p>
        {/* Mini barra de progreso */}
        <div className="w-full h-1.5 bg-xp-bar-bg rounded-full overflow-hidden mt-2">
          <div
            className="h-full rounded-full progress-bar"
            style={{
              width: `${progresoDia}%`,
              backgroundColor: progresoDia === 100 ? 'var(--success)' : 'var(--accent)',
            }}
          />
        </div>
      </div>

      {/* XP del día y racha */}
      <div
        className="bg-card rounded-2xl p-4"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <p className="text-xs text-muted font-medium mb-1">XP hoy</p>
        <div className="flex items-end gap-1">
          <span className="text-3xl font-bold text-accent">
            {xpHoy}
          </span>
          <span className="text-sm text-muted mb-1">XP</span>
        </div>
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs">🔥</span>
          <span className="text-xs text-muted-light">
            Racha: {racha} {racha === 1 ? 'día' : 'días'}
          </span>
        </div>
      </div>
    </div>
  );
}
