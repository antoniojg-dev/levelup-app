'use client';

import { useXP } from '@/contexts/XPContext';

/**
 * Barra de progreso de XP con rango actual y siguiente
 */
export default function XPBar() {
  const {
    xpTotal,
    rangoActual,
    siguienteRango,
    progresoRango,
    xpGanadoAnimacion,
  } = useXP();

  return (
    <div
      className="bg-card rounded-2xl p-4 mb-4"
      style={{ boxShadow: 'var(--shadow-card)' }}
    >
      {/* Rango y XP */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span
            className="text-xl font-bold"
            style={{ color: rangoActual.color }}
          >
            {rangoActual.id}
          </span>
          <span className="text-sm text-muted">
            {rangoActual.descripcion}
          </span>
        </div>
        <div className="flex items-baseline gap-1 relative">
          <span className="text-3xl font-bold text-foreground">
            {xpTotal.toLocaleString()}
          </span>
          <span className="text-xs text-muted">XP</span>
          {/* Animación de XP ganado */}
          {xpGanadoAnimacion && (
            <span
              key={xpGanadoAnimacion.key}
              className={`absolute -top-2 right-0 text-xs font-bold animate-xp-gain ${
                xpGanadoAnimacion.bonus ? 'text-warning' : 'text-success'
              }`}
            >
              +{xpGanadoAnimacion.xp} XP
              {xpGanadoAnimacion.bonus && ' BONUS!'}
            </span>
          )}
        </div>
      </div>

      {/* Barra de progreso hacia siguiente rango */}
      <div className="w-full h-2 bg-xp-bar-bg rounded-full overflow-hidden">
        <div
          className="h-full rounded-full progress-bar"
          style={{
            width: `${progresoRango}%`,
            backgroundColor: rangoActual.color,
          }}
        />
      </div>

      {/* Info del siguiente rango */}
      {siguienteRango && (
        <div className="flex justify-between mt-2">
          <span className="text-xs text-muted-light">
            {rangoActual.id}: {rangoActual.minXP.toLocaleString()}
          </span>
          <span className="text-xs text-muted-light">
            {siguienteRango.id}: {siguienteRango.minXP.toLocaleString()}
          </span>
        </div>
      )}
    </div>
  );
}
