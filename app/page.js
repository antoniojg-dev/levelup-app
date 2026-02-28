'use client';

import DashboardHeader from '@/components/DashboardHeader';
import XPBar from '@/components/XPBar';
import DailyProgress from '@/components/DailyProgress';
import FraseMotivacional from '@/components/FraseMotivacional';
import DailySchedule from '@/components/DailySchedule';
import { useXP } from '@/contexts/XPContext';

/**
 * Dashboard principal - Pantalla de inicio
 * Muestra saludo, XP, progreso del día y horario con checklist
 */
export default function Home() {
  const { cargado } = useXP();

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
      <DailyProgress />
      <FraseMotivacional />
      <DailySchedule />
    </>
  );
}
