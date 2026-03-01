'use client';

import DashboardHeader from '@/components/DashboardHeader';
import XPBar from '@/components/XPBar';
import DailyProgress from '@/components/DailyProgress';
import FraseMotivacional from '@/components/FraseMotivacional';
import DailySchedule from '@/components/DailySchedule';
import { useXP } from '@/contexts/XPContext';

// ─── Card de racha global ─────────────────────────────────────────────────────

function RachaCard({ racha }) {
  if (racha === 0) return null;

  let color = '#3B82F6';
  if (racha >= 100) color = '#EF4444';
  else if (racha >= 30) color = '#F97316';
  else if (racha >= 7) color = '#F59E0B';

  let badge = null;
  if (racha >= 100) badge = '🔥 ÉPICO';
  else if (racha >= 30) badge = '🌟 INCREÍBLE';
  else if (racha >= 7) badge = '✨ En racha';

  return (
    <div
      className="bg-card rounded-2xl p-4 mb-4 flex items-center gap-4"
      style={{ boxShadow: 'var(--shadow-card)', borderLeft: `4px solid ${color}` }}
    >
      <span className="text-3xl">🔥</span>
      <div className="flex-1">
        <div className="flex items-baseline gap-2">
          <span className="text-3xl font-bold leading-none" style={{ color }}>{racha}</span>
          <span className="text-sm font-medium text-foreground">días de racha</span>
        </div>
        <p className="text-xs text-muted mt-0.5">No rompas la cadena</p>
      </div>
      {badge && (
        <span
          className="text-xs font-semibold px-2.5 py-1 rounded-full flex-shrink-0"
          style={{ backgroundColor: color + '20', color }}
        >
          {badge}
        </span>
      )}
    </div>
  );
}

/**
 * Dashboard principal - Pantalla de inicio
 * Muestra saludo, XP, progreso del día y horario con checklist
 */
export default function Home() {
  const { cargado, racha } = useXP();

  // Skeleton mientras carga datos de localStorage
  if (!cargado) {
    return (
      <div className="animate-pulse space-y-4">
        <div className="h-12 bg-card-border rounded-xl w-2/3" />
        <div className="h-24 bg-card-border rounded-2xl" />
        <div className="grid grid-cols-2 gap-3">
          <div className="h-28 bg-card-border rounded-2xl" />
          <div className="h-28 bg-card-border rounded-2xl" />
        </div>
        <div className="h-8 bg-card-border rounded-xl w-1/3" />
        <div className="space-y-2">
          <div className="h-20 bg-card-border rounded-2xl" />
          <div className="h-20 bg-card-border rounded-2xl" />
          <div className="h-20 bg-card-border rounded-2xl" />
        </div>
      </div>
    );
  }

  return (
    <>
      <DashboardHeader />
      <XPBar />
      <RachaCard racha={racha} />
      <DailyProgress />
      <FraseMotivacional />
      <DailySchedule />
    </>
  );
}
