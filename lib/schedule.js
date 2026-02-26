/**
 * Horario fijo semanal
 * Cada día tiene un array de actividades con hora, nombre y XP asociado
 */

export const DIAS_SEMANA = [
  'Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'
];

export const DIAS_SEMANA_CORTO = [
  'Dom', 'Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'
];

// Horario fijo por día de la semana (0 = Domingo, 6 = Sábado)
export const HORARIO_FIJO = {
  0: [ // Domingo
    { id: 'dom-salsa', nombre: 'Salsa', hora: '10:00 - 1:00 PM', tipo: 'salsa', xp: 60 },
    { id: 'dom-curso', nombre: 'Curso Programación', hora: '2:00 - 4:00 PM', tipo: 'curso', xp: 80 },
  ],
  1: [ // Lunes
    { id: 'lun-cardio', nombre: 'Cardio', hora: '7:15 - 9:00 AM', tipo: 'cardio', xp: 50 },
    { id: 'lun-trabajo', nombre: 'Trabajo', hora: '9:00 AM - 2:00 PM', tipo: 'trabajo', xp: 40 },
    { id: 'lun-pesas', nombre: 'Pesas', hora: '2:30 - 4:00 PM', tipo: 'pesas', xp: 75 },
    { id: 'lun-curso', nombre: 'Curso Programación', hora: '4:30 - 6:30 PM', tipo: 'curso', xp: 80 },
  ],
  2: [ // Martes
    { id: 'mar-cardio', nombre: 'Cardio', hora: '7:15 - 9:00 AM', tipo: 'cardio', xp: 50 },
    { id: 'mar-trabajo', nombre: 'Trabajo', hora: '9:00 AM - 2:00 PM', tipo: 'trabajo', xp: 40 },
    { id: 'mar-pesas', nombre: 'Pesas', hora: '2:30 - 4:00 PM', tipo: 'pesas', xp: 75 },
    { id: 'mar-curso', nombre: 'Curso Programación', hora: '4:30 - 6:30 PM', tipo: 'curso', xp: 80 },
    { id: 'mar-mma', nombre: 'MMA', hora: '8:00 - 9:30 PM', tipo: 'mma', xp: 100 },
  ],
  3: [ // Miércoles
    { id: 'mie-cardio', nombre: 'Cardio', hora: '7:15 - 9:00 AM', tipo: 'cardio', xp: 50 },
    { id: 'mie-trabajo', nombre: 'Trabajo', hora: '9:00 AM - 2:00 PM', tipo: 'trabajo', xp: 40 },
    { id: 'mie-pesas', nombre: 'Pesas', hora: '2:30 - 4:00 PM', tipo: 'pesas', xp: 75 },
    { id: 'mie-curso', nombre: 'Curso Programación', hora: '4:30 - 6:30 PM', tipo: 'curso', xp: 80 },
  ],
  4: [ // Jueves
    { id: 'jue-cardio', nombre: 'Cardio', hora: '7:15 - 9:00 AM', tipo: 'cardio', xp: 50 },
    { id: 'jue-trabajo', nombre: 'Trabajo', hora: '9:00 AM - 2:00 PM', tipo: 'trabajo', xp: 40 },
    { id: 'jue-mma', nombre: 'MMA', hora: '8:00 - 9:30 PM', tipo: 'mma', xp: 100 },
  ],
  5: [ // Viernes
    { id: 'vie-cardio', nombre: 'Cardio', hora: '7:15 - 9:00 AM', tipo: 'cardio', xp: 50 },
    { id: 'vie-trabajo', nombre: 'Trabajo', hora: '9:00 AM - 2:00 PM', tipo: 'trabajo', xp: 40 },
    { id: 'vie-pesas', nombre: 'Pesas', hora: '2:30 - 4:00 PM', tipo: 'pesas', xp: 75 },
    { id: 'vie-curso', nombre: 'Curso Programación', hora: '4:30 - 6:30 PM', tipo: 'curso', xp: 80 },
  ],
  6: [ // Sábado
    { id: 'sab-pesas', nombre: 'Pesas', hora: '8:00 - 9:30 AM', tipo: 'pesas', xp: 75 },
    { id: 'sab-cardio', nombre: 'Cardio', hora: '2:00 - 3:00 PM', tipo: 'cardio', xp: 50 },
  ],
};

// Iconos por tipo de actividad (emoji como placeholder)
export const ICONOS_ACTIVIDAD = {
  cardio: '🏃',
  pesas: '🏋️',
  mma: '🥊',
  salsa: '💃',
  curso: '💻',
  trabajo: '💼',
};

// Colores por tipo de actividad
export const COLORES_ACTIVIDAD = {
  cardio: { bg: '#DBEAFE', text: '#1D4ED8', border: '#93C5FD' },
  pesas: { bg: '#F3E8FF', text: '#7C3AED', border: '#C4B5FD' },
  mma: { bg: '#FEE2E2', text: '#DC2626', border: '#FCA5A5' },
  salsa: { bg: '#FCE7F3', text: '#DB2777', border: '#F9A8D4' },
  curso: { bg: '#D1FAE5', text: '#059669', border: '#6EE7B7' },
  trabajo: { bg: '#FEF3C7', text: '#D97706', border: '#FCD34D' },
};

/**
 * Obtener el horario de hoy
 */
export function obtenerHorarioHoy() {
  const hoy = new Date().getDay();
  return HORARIO_FIJO[hoy] || [];
}

/**
 * Obtener el nombre del día actual
 */
export function obtenerNombreDia() {
  return DIAS_SEMANA[new Date().getDay()];
}
