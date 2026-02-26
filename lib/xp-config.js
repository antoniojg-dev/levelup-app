/**
 * Configuración del sistema de XP y puntos
 */

// Puntos por tipo de actividad
export const XP_POR_ACTIVIDAD = {
  cardio: 50,
  pesas: 75,
  mma: 100,
  salsa: 60,
  curso: 80,
  trabajo: 40,
};

// Bonificaciones especiales
export const BONIFICACIONES = {
  dia_completo: 150,      // Completar todas las tareas del día
  semana_perfecta: 500,   // 7 días seguidos al 100%
};

// Penalizaciones
export const PENALIZACIONES = {
  falta_sin_razon: -30,
  romper_racha: -50,
};

/**
 * Calcular XP total posible para un día dado
 */
export function calcularXPMaximoDia(actividades) {
  const xpActividades = actividades.reduce((total, act) => total + act.xp, 0);
  return xpActividades + BONIFICACIONES.dia_completo;
}

/**
 * Calcular XP ganado basado en actividades completadas
 */
export function calcularXPGanado(actividades, completadas) {
  let xp = 0;

  actividades.forEach(act => {
    if (completadas.includes(act.id)) {
      xp += act.xp;
    }
  });

  // Bonus por día completo
  const todasCompletadas = actividades.every(act => completadas.includes(act.id));
  if (todasCompletadas && actividades.length > 0) {
    xp += BONIFICACIONES.dia_completo;
  }

  return xp;
}
