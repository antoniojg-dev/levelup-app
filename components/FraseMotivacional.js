'use client';

const FRASES = [
  "Hoy haces algo pequeño que cambia tu futuro.",
  "Tu disciplina de hoy es tu libertad de mañana.",
  "Respira. Empieza de nuevo.",
  "No necesitas motivación, necesitas constancia.",
  "Un paso es mejor que cero.",
  "Tu cuerpo escucha todo lo que piensas.",
  "La energía sigue a la intención.",
  "Hazlo incluso cuando no tengas ganas.",
  "Construye hábitos, no excusas.",
  "La calma también es progreso.",
  "Muévete por amor propio, no por castigo.",
  "Lo difícil te está fortaleciendo.",
  "Cuida tu mente como cuidas tu cuerpo.",
  "Tu versión futura te lo agradecerá.",
  "Pequeños avances, grandes resultados.",
  "El descanso también es disciplina.",
  "No compitas, evoluciona.",
  "Tu ritmo es perfecto.",
  "Hoy entrenas tu carácter.",
  "Confía en el proceso, incluso cuando es lento.",
  "La claridad viene después de actuar.",
  "La incomodidad es señal de crecimiento.",
  "Sé paciente, sé constante.",
  "Menos comparación, más acción.",
  "Tu compromiso vale más que tu emoción.",
  "Cada repetición cuenta.",
  "La transformación empieza en tu mente.",
  "No busques fácil, busca posible.",
  "La mejor inversión es en ti.",
  "Hoy eliges cuidarte.",
];

/** Devuelve el número de día del año (1-366) */
function obtenerDiaDelAño() {
  const ahora = new Date();
  const inicio = new Date(ahora.getFullYear(), 0, 0);
  return Math.floor((ahora - inicio) / 86400000);
}

/**
 * Card con frase motivacional que cambia cada día.
 * Se coloca entre el bloque XP/Progreso y el Horario de hoy.
 */
export default function FraseMotivacional() {
  const frase = FRASES[obtenerDiaDelAño() % FRASES.length];

  return (
    <div
      className="relative rounded-2xl p-5 mb-4 overflow-hidden"
      style={{
        background: 'linear-gradient(135deg, #EFF6FF 0%, #EEF2FF 100%)',
        borderLeft: '4px solid #3B82F6',
        boxShadow: 'var(--shadow-card)',
      }}
    >
      {/* Comillas decorativas */}
      <span
        className="absolute top-0 left-3 text-6xl font-serif select-none pointer-events-none"
        style={{ color: '#BFDBFE', lineHeight: '1.1' }}
      >
        &ldquo;
      </span>

      {/* Texto de la frase */}
      <p
        className="relative text-base font-medium leading-relaxed pl-6"
        style={{ color: '#374151' }}
      >
        {frase}
      </p>
    </div>
  );
}
