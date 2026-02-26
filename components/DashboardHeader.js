'use client';

import { obtenerNombreDia } from '@/lib/schedule';

/**
 * Header del Dashboard con saludo personalizado y fecha
 */
export default function DashboardHeader() {
  const ahora = new Date();
  const hora = ahora.getHours();
  const dia = obtenerNombreDia();

  // Formato de fecha: "Jueves, 27 de Febrero"
  const fecha = ahora.toLocaleDateString('es-MX', {
    day: 'numeric',
    month: 'long',
  });

  // Saludo según la hora del día
  let saludo = 'Buenas noches';
  if (hora >= 5 && hora < 12) saludo = 'Buenos días';
  else if (hora >= 12 && hora < 19) saludo = 'Buenas tardes';

  return (
    <div className="mb-6">
      <p className="text-muted text-sm font-medium">
        {dia}, {fecha}
      </p>
      <h1 className="text-2xl font-bold text-foreground mt-1">
        {saludo} 👋
      </h1>
    </div>
  );
}
