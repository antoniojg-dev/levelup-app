'use client';

/**
 * Header fijo superior con logo LevelUp y avatar de perfil
 */
export default function AppHeader() {
  return (
    <header className="fixed top-0 left-0 right-0 z-50 bg-card/80 backdrop-blur-xl border-b border-card-border">
      <div className="flex items-center justify-between h-14 max-w-lg mx-auto px-4">

        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 bg-accent rounded-lg flex items-center justify-center">
            <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
              <path d="M13 2L3 14h9l-1 8 10-12h-9l1-8z" />
            </svg>
          </div>
          <span className="text-lg font-bold text-foreground tracking-tight">LevelUp</span>
        </div>

        {/* Avatar / Perfil */}
        <button
          className="w-9 h-9 rounded-full bg-card border border-card-border flex items-center justify-center transition-opacity duration-200 active:opacity-70"
          aria-label="Perfil"
        >
          <svg className="w-5 h-5 text-muted" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
          </svg>
        </button>

      </div>
    </header>
  );
}
