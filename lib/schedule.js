/**
 * Constantes y helpers de días de la semana.
 * El horario real se carga desde Supabase (calendar_events).
 */

export const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const DIAS_SEMANA_CORTO = [
  'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
];

// Claves cortas en minúsculas usadas en recurrence_days de Supabase
export const DIAS_RECURRENCIA = [
  'dom', 'lun', 'mar', 'mie', 'jue', 'vie', 'sab'
];

/**
 * Obtener el nombre completo del día actual (o de una fecha dada)
 */
export function obtenerNombreDia(fecha = new Date()) {
  return DIAS_SEMANA[fecha.getDay()];
}

/**
 * Obtener la clave corta de recurrencia para el día actual (o de una fecha dada)
 * Ejemplo: lunes → 'lun', martes → 'mar'
 */
export function obtenerClaveRecurrencia(fecha = new Date()) {
  return DIAS_RECURRENCIA[fecha.getDay()];
}
