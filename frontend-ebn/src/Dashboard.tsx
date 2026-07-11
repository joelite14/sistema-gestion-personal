import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTheme } from './context/ThemeContext'; // 👈 Importa

const Dashboard = () => {
  const navigate = useNavigate();
  const userName = localStorage.getItem('userName');
  const userRole = localStorage.getItem('userRole');
  const { theme, toggleTheme } = useTheme(); // 👈 Agrega esto

  useEffect(() => {
    if (!userName) {
      navigate('/');
    }
  }, [navigate, userName]);

  const handleLogout = () => {
    localStorage.removeItem('userRole');
    localStorage.removeItem('userName');
    localStorage.removeItem('userId');
    navigate('/');
  };

  return (
    <div className={`min-h-screen ${theme === 'dark' ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Navbar */}
      <nav className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} shadow-md p-4`}>
        <div className="container mx-auto flex justify-between items-center">
          <h1 className={`text-xl font-bold ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            E.B.N. Dr. Vicente Peña
          </h1>
          <div className="flex items-center gap-4">
            {/* 👇 Botón modo oscuro */}
            <button
              onClick={toggleTheme}
              className={`p-2 rounded-full ${theme === 'dark' ? 'bg-yellow-400 text-gray-900' : 'bg-gray-800 text-yellow-400'} transition`}
            >
              {theme === 'dark' ? '☀️' : '🌙'}
            </button>
            <span className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
              👤 {userName} ({userRole})
            </span>
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600 transition"
            >
              Cerrar Sesión
            </button>
          </div>
        </div>
      </nav>

      {/* Contenido principal */}
      <main className="p-6">
        <div className={`${theme === 'dark' ? 'bg-gray-800 text-white' : 'bg-white'} rounded-lg shadow p-6`}>
          <h2 className={`text-xl font-bold mb-4 ${theme === 'dark' ? 'text-white' : 'text-gray-800'}`}>
            Bienvenido al Dashboard
          </h2>
          <p className={theme === 'dark' ? 'text-gray-300' : 'text-gray-600'}>
            Sistema de Gestión de Expedientes del Personal
          </p>
        </div>
      </main>
    </div>
  );
};

export default Dashboard;