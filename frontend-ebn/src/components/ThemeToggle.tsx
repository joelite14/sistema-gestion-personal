import { useTheme } from '../context/ThemeContext';

const ThemeToggle = () => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className="w-full flex items-center justify-between px-4 py-3 rounded-xl transition-all duration-00 ease-out group relative overflow-hidden"
      style={{
        background: isDark 
          ? 'linear-gradient(135deg, #1e293b 0%, #0f172a 100%)' 
          : 'linear-gradient(135deg, #f8fafc 0%, #e2e8f0 100%)',
        transition: 'all 1s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {/* Efecto de brillo/glow al pasar el mouse */}
      <div 
        className="absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none"
        style={{
          background: isDark 
            ? 'radial-gradient(circle at 30% 50%, rgba(16,185,129,0.25), transparent 70%)'
            : 'radial-gradient(circle at 30% 50%, rgba(59,130,246,0.15), transparent 70%)',
          transition: 'opacity 0.7s ease'
        }}
      />
      
      {/* Icono y texto */}
      <div className="flex items-center gap-3 relative z-10">
        <span className={`text-xl transition-all duration-1000 group-hover:scale-110 group-hover:rotate-12 ${
          isDark ? 'text-emerald-400' : 'text-amber-500'
        }`}
        style={{ transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)' }}>
          {isDark ? '🌙' : '☀️'}
        </span>
        <span className={`text-sm font-medium transition-all duration-1000 ${
          isDark ? 'text-slate-200' : 'text-slate-700'
        }`}>
          {isDark ? 'Modo Oscuro' : 'Modo Claro'}
        </span>
      </div>
      
      {/* Toggle Switch con GLOW */}
      <div className="relative z-10">
        <div
          className={`w-12 h-6 rounded-full transition-all duration-500 ${
            isDark 
              ? 'bg-gradient-to-r from-emerald-500 to-teal-500' 
              : 'bg-gradient-to-r from-gray-400 to-gray-500'
          }`}
          style={{
            transition: 'all 1s cubic-bezier(0.68, -0.55, 0.265, 1.55)',
            boxShadow: isDark 
              ? '0 0 16px rgba(16, 185, 129, 0.6), 0 0 8px rgba(16, 185, 129, 0.4)' 
              : 'none'
          }}
        >
          <div
            className={`absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-lg transition-all duration-500 ${
              isDark ? 'left-[26px] rotate-180' : 'left-[2px] rotate-0'
            }`}
            style={{ transition: 'width 1s ease-out' }}
          />
        </div>
      </div>
    </button>
  );
};

export default ThemeToggle;