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

// Penalizaciones
export const PENALIZACIONES = {
  falta_sin_razon: -30,
  romper_racha: -50,
};

/**
 * Calcular XP total posible para un día dado
 */
export function calcularXPMaximoDia(actividades) {
  return actividades.reduce((total, act) => total + act.xp, 0);
}

/**
 * Calcular XP ganado basado en actividades completadas
 */
export function calcularXPGanado(actividades, completadas) {
  return actividades
    .filter(act => completadas.includes(act.id))
    .reduce((total, act) => total + act.xp, 0);
}
