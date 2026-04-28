export default function WelcomeBanner() {
  return (
    <div className="relative overflow-hidden rounded-2xl bg-gradient-to-r from-[#023047] via-[#0b4b69] to-[#219EBC] p-6 md:p-8 shadow-xl shadow-primary/20 transition-all duration-500 hover:shadow-2xl hover:shadow-primary/30 group">
      {/* Decorative circles */}
      <div className="absolute -right-6 -top-6 h-32 w-32 rounded-full bg-white/10 transition-transform duration-700 group-hover:scale-110" />
      <div className="absolute -right-2 top-8 h-20 w-20 rounded-full bg-white/10" />
      <div className="absolute right-16 -top-4 h-16 w-16 rounded-full bg-white/5" />
      <div className="absolute right-24 bottom-2 h-10 w-10 rounded-full bg-[#FFB703]/60 blur-[1px]" />
      <div className="absolute right-12 bottom-6 h-6 w-6 rounded-full bg-[#FB8500]/50 blur-[2px]" />

      {/* Content */}
      <div className="relative z-10 max-w-lg">
        <h1 className="mb-2 text-2xl font-black text-white md:text-3xl tracking-tight" style={{ fontFamily: "Outfit, sans-serif" }}>
          Bienvenido de nuevo, Profesor 👋
        </h1>
        <p className="text-sm leading-relaxed text-white/90 md:text-base font-medium">
          Has completado el <span className="font-extrabold text-[#FFB703] drop-shadow-sm">70%</span> de
          tus objetivos esta semana. ¡Sigue así y mejora tu progreso!
        </p>
      </div>

      {/* Abstract illustration - Rebranded Colors */}
      <div className="absolute bottom-0 right-4 top-0 hidden items-center md:flex transform transition-all duration-500 group-hover:translate-x-2 group-hover:scale-105">
        <svg
          width="140"
          height="120"
          viewBox="0 0 140 120"
          fill="none"
          xmlns="http://www.w3.org/2000/svg"
          className="opacity-90"
        >
          <ellipse cx="70" cy="80" rx="50" ry="20" fill="rgba(255,255,255,0.08)" />
          <rect x="55" y="30" width="30" height="50" rx="6" fill="rgba(255,255,255,0.15)" />
          <circle cx="70" cy="22" r="14" fill="rgba(255,255,255,0.2)" />
          <rect x="40" y="60" width="8" height="30" rx="3" fill="rgba(255,255,255,0.12)" />
          <rect x="92" y="55" width="8" height="35" rx="3" fill="rgba(255,255,255,0.12)" />
          <circle cx="44" cy="55" r="5" fill="rgba(255, 183, 3, 0.6)" />
          <circle cx="96" cy="50" r="4" fill="rgba(251, 133, 0, 0.6)" />
        </svg>
      </div>
    </div>
  );
}
