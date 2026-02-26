'use client';

import { useState } from 'react';

/**
 * Botón flotante (+) con mini menú animado de acciones rápidas
 */

const OPCIONES = [
  { emoji: '📅', label: 'Agregar al Calendario' },
  { emoji: '✅', label: 'Nueva Tarea' },
  { emoji: '💪', label: 'Nuevo Hábito' },
];

export default function FloatingActionButton() {
  const [abierto, setAbierto] = useState(false);

  const manejarOpcion = () => {
    alert('Próximamente - conectando base de datos');
    setAbierto(false);
  };

  return (
    <>
      {/* Overlay para cerrar al tocar afuera */}
      {abierto && (
        <div
          className="fixed inset-0 z-30"
          onClick={() => setAbierto(false)}
        />
      )}

      <div className="fixed bottom-20 right-4 z-40 flex flex-col items-end gap-3">

        {/* Opciones del menú */}
        {OPCIONES.map((opcion, i) => (
          <div
            key={opcion.label}
            className="flex items-center gap-2 transition-all duration-200"
            style={{
              opacity: abierto ? 1 : 0,
              transform: abierto ? 'translateY(0) scale(1)' : 'translateY(12px) scale(0.95)',
              transitionDelay: abierto
                ? `${(OPCIONES.length - 1 - i) * 50}ms`
                : `${i * 30}ms`,
              pointerEvents: abierto ? 'auto' : 'none',
            }}
          >
            {/* Etiqueta */}
            <span className="bg-card text-foreground text-sm font-medium px-3 py-1.5 rounded-full shadow-md border border-card-border whitespace-nowrap">
              {opcion.label}
            </span>

            {/* Botón icono */}
            <button
              onClick={manejarOpcion}
              className="w-11 h-11 rounded-full bg-card shadow-md border border-card-border flex items-center justify-center text-xl transition-transform duration-150 active:scale-90"
              aria-label={opcion.label}
            >
              {opcion.emoji}
            </button>
          </div>
        ))}

        {/* Botón principal (+) */}
        <button
          onClick={() => setAbierto(!abierto)}
          className="w-14 h-14 rounded-full bg-accent text-white shadow-lg flex items-center justify-center transition-transform duration-300 active:scale-90"
          style={{ transform: abierto ? 'rotate(45deg)' : 'rotate(0deg)' }}
          aria-label={abierto ? 'Cerrar menú' : 'Abrir menú'}
        >
          <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
        </button>

      </div>
    </>
  );
}
