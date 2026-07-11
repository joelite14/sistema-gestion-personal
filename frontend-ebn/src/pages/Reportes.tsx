import { useState } from 'react';
import { useTheme } from '../context/ThemeContext';
import RepososPermisos from './RepososPermisos';
import ConstanciasReportes from './ConstanciasReportes';

const Reportes = () => {
  const [vista, setVista] = useState<'menu' | 'reposos' | 'constancias'>('menu');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (vista === 'reposos') {
    return <RepososPermisos onVolver={() => setVista('menu')} />;
  }

  if (vista === 'constancias') {
    return <ConstanciasReportes onVolver={() => setVista('menu')} />;
  }

  return (
    <div className="p-6">
      {/* Título con animación */}
      <div className="title-enter">
        <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>📊 Reportes</h1>
        <p className={`mb-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Selecciona el tipo de reporte que deseas generar</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
        {/* Tarjeta 1: Reposos y Permisos */}
        <div
          onClick={() => setVista('reposos')}
          className={`cursor-pointer rounded-2xl shadow-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-blue-500 card-left-enter ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
        >
          <div className="text-6xl mb-4">🩺</div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Reposos y Permisos</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestionar y reportar empleados en reposo o permiso. Historial de ausencias.</p>
          <div className="mt-4 text-blue-500 text-sm font-medium">Haz clic para ingresar →</div>
        </div>

        {/* Tarjeta 2: Constancias y Reportes */}
        <div
          onClick={() => setVista('constancias')}
          className={`cursor-pointer rounded-2xl shadow-lg p-8 transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-green-500 card-left-enter ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}
          style={{ animationDelay: '200ms' }}
        >
          <div className="text-6xl mb-4">📄</div>
          <h2 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Constancias y Reportes</h2>
          <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Generar reportes PDF, listados de personal, constancias de trabajo y más.</p>
          <div className="mt-4 text-green-500 text-sm font-medium">Haz clic para ingresar →</div>
        </div>
      </div>
    </div>
  );
};

export default Reportes;