/**
 * Sistema de rangos
 * Cada rango tiene un mínimo de XP, nombre, color y descripción
 */

export const RANGOS = [
  { id: 'F', nombre: 'Rango F', minXP: 0, maxXP: 499, color: '#9CA3AF', descripcion: 'Principiante' },
  { id: 'E', nombre: 'Rango E', minXP: 500, maxXP: 1499, color: '#78716C', descripcion: 'Novato' },
  { id: 'D', nombre: 'Rango D', minXP: 1500, maxXP: 3499, color: '#22C55E', descripcion: 'Aprendiz' },
  { id: 'C', nombre: 'Rango C', minXP: 3500, maxXP: 6999, color: '#3B82F6', descripcion: 'Competente' },
  { id: 'B', nombre: 'Rango B', minXP: 7000, maxXP: 11999, color: '#8B5CF6', descripcion: 'Avanzado' },
  { id: 'A', nombre: 'Rango A', minXP: 12000, maxXP: 19999, color: '#F59E0B', descripcion: 'Experto' },
  { id: 'S', nombre: 'Rango S', minXP: 20000, maxXP: Infinity, color: '#EF4444', descripcion: 'Leyenda' },
];

/**
 * Obtener rango actual basado en XP total
 */
export function obtenerRango(xpTotal) {
  // Buscar de mayor a menor para encontrar el rango correcto
  for (let i = RANGOS.length - 1; i >= 0; i--) {
    if (xpTotal >= RANGOS[i].minXP) {
      return RANGOS[i];
    }
  }
  return RANGOS[0];
}

/**
 * Obtener siguiente rango
 */
export function obtenerSiguienteRango(xpTotal) {
  const rangoActual = obtenerRango(xpTotal);
  const indice = RANGOS.findIndex(r => r.id === rangoActual.id);

  if (indice < RANGOS.length - 1) {
    return RANGOS[indice + 1];
  }

  return null; // Ya está en rango S
}

/**
 * Calcular progreso hacia el siguiente rango (0-100)
 */
export function calcularProgresoRango(xpTotal) {
  const rangoActual = obtenerRango(xpTotal);
  const siguienteRango = obtenerSiguienteRango(xpTotal);

  if (!siguienteRango) return 100; // Rango máximo

  const xpEnRango = xpTotal - rangoActual.minXP;
  const xpNecesario = siguienteRango.minXP - rangoActual.minXP;

  return Math.round((xpEnRango / xpNecesario) * 100);
}
