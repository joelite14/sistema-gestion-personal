import { useState, useEffect } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  Bars3Icon,
  XMarkIcon,
  ArrowRightOnRectangleIcon,
  AcademicCapIcon,
  UserGroupIcon,
  DocumentChartBarIcon,
  AdjustmentsHorizontalIcon
} from '@heroicons/react/24/outline';
import { useTheme } from '../context/ThemeContext';

const Layout = ({ children }: { children: React.ReactNode }) => {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showLogoutModal, setShowLogoutModal] = useState(false); // 👈 NUEVO
  const location = useLocation();
  const userName = sessionStorage.getItem('userName');
  const userRole = sessionStorage.getItem('userRole');
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  // Navegación con íconos y colores específicos por módulo
  const navigation = [
    { name: 'Inicio', href: '/home', icon: AcademicCapIcon, roles: ['admin', 'superadmin'], color: 'text-blue-500' },
    { name: 'Personal', href: '/personal', icon: UserGroupIcon, roles: ['admin', 'superadmin'], color: 'text-emerald-500' },
    { name: 'Reportes', href: '/reportes', icon: DocumentChartBarIcon, roles: ['admin', 'superadmin'], color: 'text-orange-500' },
    { name: 'Configuración', href: '/configuracion', icon: AdjustmentsHorizontalIcon, roles: ['superadmin'], color: 'text-purple-500' },
  ];

  const filteredNavigation = navigation.filter(item => 
    item.roles.includes(userRole || '')
  );

  useEffect(() => {
    setMobileMenuOpen(false);
  }, [location]);

  const handleLogout = () => {
    sessionStorage.removeItem('userRole');
    sessionStorage.removeItem('userName');
    sessionStorage.removeItem('userId');
    window.location.href = '/';
  };

  // 👈 NUEVA FUNCIÓN
  const confirmLogout = () => {
    setShowLogoutModal(true);
  };

  // 👈 NUEVA FUNCIÓN
  const cancelLogout = () => {
    setShowLogoutModal(false);
  };

  const toggleSidebar = () => {
    setSidebarCollapsed(!sidebarCollapsed);
  };

  const sidebarWidth = sidebarCollapsed ? '72px' : '260px';

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      {/* Sidebar Desktop */}
      <aside
        className={`fixed left-0 top-0 h-full ${isDark ? 'bg-gray-800' : 'bg-white'} shadow-xl z-30 hidden lg:block overflow-x-hidden`}
        style={{ 
          width: sidebarWidth,
          transition: 'width 0.8s ease-in-out, background-color 0.8s ease-in'
        }}
      >
        <div className="flex flex-col h-full">
          {/* Logo - CLICK AQUÍ PARA COLAPSAR */}
          <div 
            onClick={toggleSidebar}
            className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-start'} p-5 border-b ${isDark ? 'border-gray-700' : 'border-gray-200'} cursor-pointer transition-all duration-200 group ${
              isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'
            }`}
          >
            <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'} transition-transform duration-300 group-hover:scale-110 flex-shrink-0`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
            </svg>
            
            {!sidebarCollapsed && (
              <span className={`ml-3 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'} whitespace-nowrap transition-all duration-300`}>
                Menú
              </span>
            )}
          </div>

          {/* Perfil del usuario - expandido */}
          {!sidebarCollapsed && (
            <div className="p-4 mt-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md flex-shrink-0">
                  <span className="text-white font-bold text-sm">
                    {userName?.charAt(0).toUpperCase() || 'U'}
                  </span>
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium truncate ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {userName || 'Usuario'}
                  </p>
                  <p className={`text-xs capitalize truncate ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    {userRole || 'Sin rol'}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Perfil colapsado - solo ícono */}
          {sidebarCollapsed && (
            <div className="p-4 mt-4 flex justify-center">
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-sm">
                  {userName?.charAt(0).toUpperCase() || 'U'}
                </span>
              </div>
            </div>
          )}

          {/* Navegación */}
          <nav className="flex-1 p-3 space-y-1 overflow-y-auto mt-4">
            {!sidebarCollapsed && (
              <p className={`text-xs font-semibold uppercase tracking-wider px-3 py-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                Menú Principal
              </p>
            )}
            {filteredNavigation.map((item) => {
              const isActive = location.pathname === item.href;
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  className={`flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl transition-all duration-200 group ${
                    isActive 
                      ? 'bg-blue-600 text-white shadow-md'
                      : isDark 
                        ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                        : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                  }`}
                  title={sidebarCollapsed ? item.name : ''}
                >
                  <item.icon className={`h-5 w-5 flex-shrink-0 transition-all duration-200 ${
                    isActive 
                      ? 'text-white'
                      : item.color
                  } ${!isActive && 'group-hover:scale-110'}`} />
                  {!sidebarCollapsed && <span className="text-sm font-medium">{item.name}</span>}
                </Link>
              );
            })}
          </nav>

          {/* Modo oscuro y cerrar sesión */}
          <div className="p-3 space-y-2 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={toggleTheme}
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'justify-between'} px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isDark ? 'text-gray-300 hover:bg-gray-700' : 'text-gray-700 hover:bg-gray-100'
              }`}
              title={sidebarCollapsed ? (isDark ? 'Modo Claro' : 'Modo Oscuro') : ''}
            >
              {!sidebarCollapsed && (
                <span className="text-sm font-medium">{isDark ? 'Modo Oscuro' : 'Modo Claro'}</span>
              )}
              <div
                className="relative w-11 h-6 rounded-full flex-shrink-0"
                style={{
                  backgroundColor: isDark ? '#22c55e' : '#9ca3af',
                  transition: 'background-color 1s ease'
                }}
              >
                <div
                  className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-md"
                  style={{
                    left: isDark ? '22px' : '2px',
                    transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                  }}
                />
              </div>
            </button>

            <button
              onClick={confirmLogout} // 👈 CAMBIADO
              className={`w-full flex items-center ${sidebarCollapsed ? 'justify-center' : 'gap-3'} px-3 py-2.5 rounded-xl transition-all duration-200 ${
                isDark ? 'text-gray-300 hover:bg-red-600/20 hover:text-red-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
              }`}
              title={sidebarCollapsed ? 'Cerrar Sesión' : ''}
            >
              <ArrowRightOnRectangleIcon className={`h-5 w-5 flex-shrink-0 ${isDark ? 'text-gray-400' : 'text-gray-500'}`} />
              {!sidebarCollapsed && <span className="text-sm font-medium">Cerrar Sesión</span>}
            </button>
          </div>

          {/* Footer - solo expandido - CORREGIDO */}
          {!sidebarCollapsed && (
            <div className={`p-4 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'} text-center border-t ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <p className="whitespace-nowrap overflow-hidden text-ellipsis">E.B.N. Dr. Vicente Peña</p>
              <p className="whitespace-nowrap overflow-hidden text-ellipsis">San Juan de los Morros</p>
            </div>
          )}
        </div>
      </aside>

      {/* 🔥 BOTÓN HAMBURGUESA */}
      <div className="lg:hidden fixed top-4 left-4 z-50">
        <button
          onClick={() => setMobileMenuOpen(true)}
          className={`
            p-2.5 rounded-xl shadow-lg transition-all duration-300 ease-in-out
            hover:scale-105 active:scale-95
            ${isDark ? 'bg-gray-800 text-white hover:bg-gray-700' : 'bg-white text-gray-800 hover:bg-gray-50'}
          `}
        >
          <Bars3Icon className="h-6 w-6" />
        </button>
      </div>

      {/* Sidebar Móvil */}
      <div className="lg:hidden">
        {/* Overlay con animación */}
        <div
          className={`
            fixed inset-0 bg-black/50 backdrop-blur-sm z-40 
            transition-all duration-300 ease-in-out
            ${mobileMenuOpen 
              ? 'opacity-100 visible' 
              : 'opacity-0 invisible'
            }
          `}
          onClick={() => setMobileMenuOpen(false)}
        />
        
        {/* Menú lateral */}
        <aside
          className={`
            fixed top-0 left-0 h-full w-64 
            ${isDark ? 'bg-gray-800' : 'bg-white'} 
            shadow-2xl z-50 
            transition-transform duration-300 ease-in-out
            ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full'}
          `}
        >
          <div className="flex flex-col h-full">
            {/* Header */}
            <div className={`
              flex justify-between items-center p-4 
              border-b border-gray-200 dark:border-gray-700
              transition-opacity duration-300
              ${mobileMenuOpen ? 'opacity-100' : 'opacity-0'}
            `}>
              <div className="flex items-center gap-2">
                <svg className={`w-6 h-6 ${isDark ? 'text-white' : 'text-gray-800'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zm10 0a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
                </svg>
                <span className={`ml-2 font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Menú
                </span>
              </div>
              <button 
                onClick={() => setMobileMenuOpen(false)} 
                className={`
                  p-2 rounded-lg transition-all duration-200 
                  hover:rotate-90 hover:scale-110
                  ${isDark ? 'hover:bg-gray-700' : 'hover:bg-gray-100'}
                `}
              >
                <XMarkIcon className="w-5 h-5" />
              </button>
            </div>

            {/* Perfil */}
            <div className={`
              p-4 flex items-center gap-3
              transition-all duration-300 delay-100
              ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
            `}>
              <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center">
                <span className="text-white font-bold text-sm">{userName?.charAt(0).toUpperCase() || 'U'}</span>
              </div>
              <div>
                <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{userName || 'Usuario'}</p>
                <p className={`text-xs capitalize ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{userRole || 'Sin rol'}</p>
              </div>
            </div>

            {/* Navegación */}
            <nav className="flex-1 p-3 space-y-1 overflow-y-auto">
              {filteredNavigation.map((item, index) => {
                const isActive = location.pathname === item.href;
                return (
                  <Link
                    key={item.name}
                    to={item.href}
                    onClick={() => setMobileMenuOpen(false)}
                    className={`
                      flex items-center gap-3 px-3 py-2.5 rounded-xl 
                      transition-all duration-200
                      ${isActive 
                        ? 'bg-blue-600 text-white shadow-md' 
                        : isDark 
                          ? 'text-gray-300 hover:bg-gray-700 hover:text-white' 
                          : 'text-gray-700 hover:bg-blue-100 hover:text-blue-700'
                      }
                      ${mobileMenuOpen ? 'opacity-100 translate-x-0' : 'opacity-0 -translate-x-4'}
                    `}
                    style={{ transitionDelay: `${50 + index * 50}ms` }}
                  >
                    <item.icon className={`h-5 w-5 ${isActive ? 'text-white' : item.color}`} />
                    <span className="text-sm font-medium">{item.name}</span>
                  </Link>
                );
              })}
            </nav>

            {/* Footer con acciones - VERSIÓN MÓVIL */}
            <div className={`
              p-3 space-y-2 border-t border-gray-200 dark:border-gray-700
              transition-all duration-300 delay-200
              ${mobileMenuOpen ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-4'}
            `}>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-all duration-200"
                style={{
                  color: isDark ? '#d1d5db' : '#374151',
                  backgroundColor: isDark ? 'transparent' : 'transparent'
                }}
              >
                <span className="text-sm font-medium">{isDark ? ' Modo Oscuro' : ' Modo Claro'}</span>
                
                <div
                  className="relative w-11 h-6 rounded-full flex-shrink-0"
                  style={{
                    backgroundColor: isDark ? '#22c55e' : '#9ca3af',
                    transition: 'background-color 1s ease'
                  }}
                >
                  <div
                    className="absolute top-[2px] w-5 h-5 bg-white rounded-full shadow-md"
                    style={{
                      left: isDark ? '22px' : '2px',
                      transition: 'left 0.8s cubic-bezier(0.34, 1.56, 0.64, 1)'
                    }}
                  />
                </div>
              </button>
              
              <button
                onClick={confirmLogout} // 👈 CAMBIADO
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl transition-all duration-200 ${
                  isDark ? 'text-gray-300 hover:bg-red-600/20 hover:text-red-400' : 'text-gray-700 hover:bg-red-50 hover:text-red-600'
                }`}
              >
                <ArrowRightOnRectangleIcon className="h-5 w-5" />
                <span className="text-sm font-medium">Cerrar Sesión</span>
              </button>
            </div>

            <div className="p-4 text-xs text-center text-gray-400 border-t border-gray-200 dark:border-gray-700">
              <p>E.B.N. Dr. Vicente Peña</p>
              <p>San Juan de los Morros</p>
            </div>
          </div>
        </aside>
      </div>

      {/* Contenido principal */}
      <div 
        className="hidden lg:block system-enter"
        style={{ 
          paddingLeft: sidebarWidth,
          transition: 'padding-left 0.8s ease-in-out'
        }}
      >
        <div className={`p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-[800ms]`}>
          {children}
        </div>
      </div>

      <div className="lg:hidden">
        <div className={`p-4 pt-20 ${isDark ? 'bg-gray-900' : 'bg-gray-100'} transition-colors duration-[800ms]`}>
          {children}
        </div>
      </div>

      {/* 👈 MODAL DE CONFIRMACIÓN PARA CERRAR SESIÓN - NUEVO */}
      {showLogoutModal && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 animate-modal modal-content">
          <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" 
            onClick={cancelLogout}
          ></div>
          <div className={`relative rounded-2xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              {/* Icono */}
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
                  <span className="text-4xl">🚪</span>
                </div>
              </div>
              
              {/* Título */}
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
                ¿Cerrar sesión?
              </h3>
              
              {/* Mensaje */}
              <p className={`text-sm mb-6 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                ¿Estás seguro de que deseas salir del sistema?
              </p>
              
              {/* Botones */}
              <div className="flex gap-3">
                <button
                  onClick={handleLogout}
                  className="flex-1 bg-red-500 text-white py-2.5 rounded-xl font-semibold hover:bg-red-600 transition-all duration-200"
                >
                  Sí, salir
                </button>
                <button
                  onClick={cancelLogout}
                  className="flex-1 bg-gray-200 text-gray-700 py-2.5 rounded-xl font-semibold hover:bg-gray-300 transition-all duration-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Layout;