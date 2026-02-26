'use client';

import { useXP } from '@/contexts/XPContext';
import { RANGOS } from '@/lib/ranks';

/**
 * Personaje - Muestra avatar, rango, estadísticas y logros
 */
export default function Personaje() {
  const { xpTotal, rangoActual, progresoRango, racha } = useXP();

  return (
    <div>
      <h1 className="text-2xl font-bold text-foreground mb-2">Personaje</h1>
      <p className="text-muted text-sm mb-6">Tu progreso y logros</p>

      {/* Card del personaje */}
      <div
        className="bg-card rounded-2xl p-6 mb-4 text-center"
        style={{ boxShadow: 'var(--shadow-card)' }}
      >
        <div
          className="w-20 h-20 rounded-full mx-auto mb-3 flex items-center justify-center text-3xl font-bold text-white"
          style={{ backgroundColor: rangoActual.color }}
        >
          {rangoActual.id}
        </div>
        <h2 className="text-lg font-bold text-foreground">{rangoActual.nombre}</h2>
        <p className="text-sm text-muted">{rangoActual.descripcion}</p>
        <p className="text-2xl font-bold text-accent mt-2">
          {xpTotal.toLocaleString()} XP
        </p>
      </div>

      {/* Estadísticas rápidas */}
      <div className="grid grid-cols-2 gap-3 mb-4">
        <div
          className="bg-card rounded-2xl p-4 text-center"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-2xl font-bold text-foreground">{racha}</p>
          <p className="text-xs text-muted">Racha actual</p>
        </div>
        <div
          className="bg-card rounded-2xl p-4 text-center"
          style={{ boxShadow: 'var(--shadow-card)' }}
        >
          <p className="text-2xl font-bold text-foreground">{progresoRango}%</p>
          <p className="text-xs text-muted">Siguiente rango</p>
        </div>
      </div>

      {/* Todos los rangos */}
      <h3 className="text-sm font-semibold text-foreground mb-3">Rangos</h3>
      <div className="space-y-2">
        {RANGOS.map((rango) => {
          const alcanzado = xpTotal >= rango.minXP;
          const esActual = rangoActual.id === rango.id;

          return (
            <div
              key={rango.id}
              className={`
                bg-card rounded-xl p-3 flex items-center gap-3
                ${esActual ? 'ring-2 ring-accent' : ''}
                ${!alcanzado ? 'opacity-40' : ''}
              `}
              style={{ boxShadow: 'var(--shadow-sm)' }}
            >
              <div
                className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0"
                style={{ backgroundColor: rango.color }}
              >
                {rango.id}
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium text-foreground">{rango.descripcion}</p>
                <p className="text-xs text-muted">{rango.minXP.toLocaleString()} XP</p>
              </div>
              {alcanzado && (
                <span className="text-success text-sm">✓</span>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
