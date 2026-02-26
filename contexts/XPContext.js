'use client';

import { createContext, useContext, useState, useCallback, useEffect } from 'react';
import { obtenerRango, obtenerSiguienteRango, calcularProgresoRango } from '@/lib/ranks';
import { calcularXPGanado, BONIFICACIONES } from '@/lib/xp-config';
import { obtenerHorarioHoy } from '@/lib/schedule';

const XPContext = createContext(null);

// Clave para localStorage
const STORAGE_KEY = 'mi-vida-app-data';

/**
 * Obtener fecha actual como string YYYY-MM-DD
 */
function fechaHoy() {
  return new Date().toISOString().split('T')[0];
}

/**
 * Cargar datos guardados de localStorage
 */
function cargarDatos() {
  if (typeof window === 'undefined') return null;

  try {
    const datos = localStorage.getItem(STORAGE_KEY);
    if (datos) return JSON.parse(datos);
  } catch {
    // Si hay error, empezar desde cero
  }
  return null;
}

/**
 * Guardar datos en localStorage
 */
function guardarDatos(datos) {
  if (typeof window === 'undefined') return;

  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(datos));
  } catch {
    // Silenciar errores de localStorage
  }
}

export function XPProvider({ children }) {
  const [xpTotal, setXPTotal] = useState(0);
  const [completadasHoy, setCompletadasHoy] = useState([]);
  const [racha, setRacha] = useState(0);
  const [fechaActual, setFechaActual] = useState('');
  const [xpGanadoAnimacion, setXPGanadoAnimacion] = useState(null);
  const [cargado, setCargado] = useState(false);

  // Cargar datos al montar
  useEffect(() => {
    const datos = cargarDatos();
    const hoy = fechaHoy();

    if (datos) {
      setXPTotal(datos.xpTotal || 0);
      setRacha(datos.racha || 0);

      // Si es el mismo día, cargar completadas
      if (datos.fechaUltimaActividad === hoy) {
        setCompletadasHoy(datos.completadasHoy || []);
      } else {
        // Nuevo día: reiniciar completadas
        setCompletadasHoy([]);
      }
    }

    setFechaActual(hoy);
    setCargado(true);
  }, []);

  // Guardar datos cuando cambian
  useEffect(() => {
    if (!cargado) return;

    guardarDatos({
      xpTotal,
      completadasHoy,
      racha,
      fechaUltimaActividad: fechaActual,
    });
  }, [xpTotal, completadasHoy, racha, fechaActual, cargado]);

  // Completar o descompletar una actividad
  const toggleActividad = useCallback((actividadId, xpActividad) => {
    setCompletadasHoy(prev => {
      const yaCompletada = prev.includes(actividadId);

      if (yaCompletada) {
        // Descompletar: restar XP
        setXPTotal(xp => Math.max(0, xp - xpActividad));
        return prev.filter(id => id !== actividadId);
      } else {
        // Completar: sumar XP
        setXPTotal(xp => xp + xpActividad);
        setXPGanadoAnimacion({ xp: xpActividad, key: Date.now() });

        // Verificar si con esta se completan todas las del día
        const nuevasCompletadas = [...prev, actividadId];
        const horarioHoy = obtenerHorarioHoy();
        const todasCompletadas = horarioHoy.every(act =>
          nuevasCompletadas.includes(act.id)
        );

        if (todasCompletadas && horarioHoy.length > 0) {
          // Bonus por día completo
          setXPTotal(xp => xp + BONIFICACIONES.dia_completo);
          setXPGanadoAnimacion({
            xp: xpActividad + BONIFICACIONES.dia_completo,
            key: Date.now(),
            bonus: true,
          });
          setRacha(r => r + 1);
        }

        return nuevasCompletadas;
      }
    });
  }, []);

  // Datos derivados
  const horarioHoy = typeof window !== 'undefined' ? obtenerHorarioHoy() : [];
  const rangoActual = obtenerRango(xpTotal);
  const siguienteRango = obtenerSiguienteRango(xpTotal);
  const progresoRango = calcularProgresoRango(xpTotal);
  const xpHoy = calcularXPGanado(horarioHoy, completadasHoy);
  const totalActividadesHoy = horarioHoy.length;
  const actividadesCompletadasHoy = completadasHoy.length;
  const progresoDia = totalActividadesHoy > 0
    ? Math.round((actividadesCompletadasHoy / totalActividadesHoy) * 100)
    : 0;

  const valor = {
    // Estado
    xpTotal,
    completadasHoy,
    racha,
    cargado,
    xpGanadoAnimacion,

    // Datos derivados
    rangoActual,
    siguienteRango,
    progresoRango,
    xpHoy,
    progresoDia,
    totalActividadesHoy,
    actividadesCompletadasHoy,
    horarioHoy,

    // Acciones
    toggleActividad,
  };

  return (
    <XPContext.Provider value={valor}>
      {children}
    </XPContext.Provider>
  );
}

export function useXP() {
  const context = useContext(XPContext);
  if (!context) {
    throw new Error('useXP debe usarse dentro de un XPProvider');
  }
  return context;
}
