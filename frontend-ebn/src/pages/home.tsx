import { useEffect, useState } from 'react';
import { api } from '../services/api';
import { useTheme } from '../context/ThemeContext';
import { PieChart, Pie, Cell, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const Home = () => {
  const [stats, setStats] = useState({
    total: 0,
    docentes: 0,
    administrativos: 0,
    obreros: 0,
    vigilantes: 0,
    cnae: 0,
    activos: 0,
    inactivos: 0,
    permiso: 0,
    jubilados: 0,
    reposo: 0,
    docentesMañana: 0,
    docentesTarde: 0,
    administrativosMañana: 0,
    administrativosTarde: 0,
    obrerosMañana: 0,
    obrerosTarde: 0,
    vigilantesMañana: 0,
    vigilantesTarde: 0,
    cnaeMañana: 0,
    cnaeTarde: 0,
    docentesAmbos: 0,
    administrativosAmbos: 0,
    cnaeAmbos: 0,
    totalAmbos: 0,
    vigilantesAmbos: 0,
  });
  
  const [actividades, setActividades] = useState([]);
  const [repososActivos, setRepososActivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [animateBars, setAnimateBars] = useState(false);
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  // Colores consistentes para cargos
  const COLORES_CARGOS = {
    docente: '#10B981',
    administrativo: '#3B82F6',
    obrero: '#F59E0B',
    vigilante: '#8B5CF6',
    cnae: '#EF4444'
  };

  useEffect(() => {
    fetchStats();
    fetchActividades();
    fetchRepososActivos();
  }, []);

  useEffect(() => {
    const timer = setTimeout(() => {
      setAnimateBars(true);
    }, 400);
    return () => clearTimeout(timer);
  }, []);

  const fetchStats = async () => {
    try {
      // ✅ CAMBIADO: usar api en lugar de axios.get
      const response = await api.get('/api/personal');
      const personal = response.data.data;

      console.log('📊 Total empleados:', personal.length);
      console.log('📊 Datos completos:', personal);

      const total = personal.length;
      
      const docentes = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'docente'
      ).length;
      
      const administrativos = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'administrativo'
      ).length;
      
      const obreros = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'obrero'
      ).length;
      
      const vigilantes = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'vigilante'
      ).length;
      
      const cnae = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'cnae'
      ).length;

      const activos = personal.filter((p: any) => 
        p.estatus === 'Activo' && p.en_permiso !== 1 && p.en_reposo !== 1
      ).length;
      
      const inactivos = personal.filter((p: any) => p.estatus === 'Inactivo').length;
      const permiso = personal.filter((p: any) => p.en_permiso === 1).length;
      const jubilados = personal.filter((p: any) => p.estatus === 'Jubilado').length;
      const reposo = personal.filter((p: any) => p.en_reposo === 1).length;

      console.log('📊 Activos:', activos);
      console.log('📊 Reposo:', reposo);
      console.log('📊 Permiso:', permiso);
      console.log('📊 Jubilados:', jubilados);
      console.log('📊 Inactivos:', inactivos);

      // Contar por cargo y turno
      const docentesMañana = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'docente' && p.turno === 'Mañana'
      ).length;

      const docentesTarde = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'docente' && p.turno === 'Tarde'
      ).length;

      const administrativosMañana = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'administrativo' && p.turno === 'Mañana'
      ).length;

      const administrativosTarde = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'administrativo' && p.turno === 'Tarde'
      ).length;

      const obrerosMañana = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'obrero' && p.turno === 'Mañana'
      ).length;

      const obrerosTarde = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'obrero' && p.turno === 'Tarde'
      ).length;

      const vigilantesMañana = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'vigilante' && p.turno === 'Mañana'
      ).length;

      const vigilantesTarde = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'vigilante' && p.turno === 'Tarde'
      ).length;

      const cnaeMañana = personal.filter((p: any) => 
        (p.cargo?.toLowerCase() === 'cnae' || p.cargo?.toLowerCase() === 'cocinero') && p.turno === 'Mañana'
      ).length;

      const cnaeTarde = personal.filter((p: any) => 
        (p.cargo?.toLowerCase() === 'cnae' || p.cargo?.toLowerCase() === 'cocinero') && p.turno === 'Tarde'
      ).length;

      const docentesAmbos = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'docente' && p.turno === 'Ambos'
      ).length;

      const administrativosAmbos = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'administrativo' && p.turno === 'Ambos'
      ).length;

      const cnaeAmbos = personal.filter((p: any) => 
        (p.cargo?.toLowerCase() === 'cnae' || p.cargo?.toLowerCase() === 'cocinero') && p.turno === 'Ambos'
      ).length;

      const vigilantesAmbos = personal.filter((p: any) => 
        p.cargo?.toLowerCase() === 'vigilante' && p.turno === 'Ambos'
      ).length;

      const totalAmbos = personal.filter((p: any) => 
        p.turno === 'Ambos'
      ).length;

      setStats({ 
        total, 
        docentes, 
        administrativos, 
        obreros, 
        vigilantes, 
        cnae, 
        activos, 
        inactivos, 
        permiso, 
        jubilados, 
        reposo,
        docentesMañana,
        docentesTarde,
        administrativosMañana,
        administrativosTarde,
        obrerosMañana,
        obrerosTarde,
        vigilantesMañana,
        vigilantesTarde,
        cnaeMañana,
        cnaeTarde,
        docentesAmbos,
        administrativosAmbos,
        cnaeAmbos,
        totalAmbos,
        vigilantesAmbos,
      });
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const fetchActividades = async () => {
    try {
      // ✅ CAMBIADO: usar api en lugar de axios.get
      const response = await api.get('/api/bitacora');
      setActividades(response.data.data);
    } catch (error) {
      console.error('Error al cargar actividades:', error);
      setActividades([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchRepososActivos = async () => {
    try {
      // ✅ CAMBIADO: usar api en lugar de axios.get
      const response = await api.get('/api/permisos-reposos/activos');
      console.log('📊 Reposos activos:', response.data.data);
      setRepososActivos(response.data.data);
    } catch (error) {
      console.error('Error al cargar reposos activos:', error);
      setRepososActivos([]);
    }
  };

  const dataCargo = [
    { name: 'Docentes', value: stats.docentes, color: COLORES_CARGOS.docente },
    { name: 'Administrativos', value: stats.administrativos, color: COLORES_CARGOS.administrativo },
    { name: 'Obreros', value: stats.obreros, color: COLORES_CARGOS.obrero },
    { name: 'Vigilantes', value: stats.vigilantes, color: COLORES_CARGOS.vigilante },
    { name: 'CNAE', value: stats.cnae, color: COLORES_CARGOS.cnae },
  ].filter(item => item.value > 0);

  const dataEstatus = [
    { name: 'Activos', value: stats.activos, color: '#10B981' },
    { name: 'Inactivos', value: stats.inactivos, color: '#EF4444' },
    { name: 'Permiso', value: stats.permiso, color: '#F59E0B' },
    { name: 'Jubilados', value: stats.jubilados, color: '#6B7280' },
    { name: 'Reposo', value: stats.reposo, color: '#3B82F6' },
  ].filter(item => item.value > 0);

  const formatRelativeDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffDays === 0) {
      if (diffMins < 1) return 'Justo ahora';
      if (diffMins < 60) return `Hace ${diffMins} min`;
      if (diffHours < 24) return `Hace ${diffHours} h`;
    }
    if (diffDays === 1) return 'Ayer';
    if (diffDays < 7) return `Hace ${diffDays} días`;
    return date.toLocaleDateString('es-VE', { day: '2-digit', month: '2-digit' });
  };

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div>
      {/* 🔥 ESTILOS DE ANIMACIÓN DIRECTOS */}
      <style>{`
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .card-enter {
          animation: fadeInUp 1.5s cubic-bezier(0.4, 0, 0.2, 1) forwards;
        }
        
        .delay-0 { animation-delay: 0ms; }
        .delay-1 { animation-delay: 100ms; }
        .delay-2 { animation-delay: 200ms; }
        .delay-3 { animation-delay: 300ms; }
        .delay-4 { animation-delay: 400ms; }
        .delay-5 { animation-delay: 500ms; }
      `}</style>

      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>Inicio</h1>

      {/* Tarjetas de estadísticas */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4 mb-8">
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-0`} style={{ borderLeftColor: '#6B7280' }}>
          <div><div className="text-3xl font-bold" style={{ color: '#6B7280' }}>{stats.total}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Total Personal</div></div>
        </div>
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-1`} style={{ borderLeftColor: COLORES_CARGOS.docente }}>
          <div><div className="text-3xl font-bold" style={{ color: COLORES_CARGOS.docente }}>{stats.docentes}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Docentes</div></div>
        </div>
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-2`} style={{ borderLeftColor: COLORES_CARGOS.administrativo }}>
          <div><div className="text-3xl font-bold" style={{ color: COLORES_CARGOS.administrativo }}>{stats.administrativos}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Administrativos</div></div>
        </div>
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-3`} style={{ borderLeftColor: COLORES_CARGOS.obrero }}>
          <div><div className="text-3xl font-bold" style={{ color: COLORES_CARGOS.obrero }}>{stats.obreros}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Obreros</div></div>
        </div>
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-4`} style={{ borderLeftColor: COLORES_CARGOS.vigilante }}>
          <div><div className="text-3xl font-bold" style={{ color: COLORES_CARGOS.vigilante }}>{stats.vigilantes}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Vigilantes</div></div>
        </div>
        <div className={`rounded-xl shadow-lg p-5 border-l-4 transition-all duration-300 hover:scale-105 ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter delay-5`} style={{ borderLeftColor: COLORES_CARGOS.cnae }}>
          <div><div className="text-3xl font-bold" style={{ color: COLORES_CARGOS.cnae }}>{stats.cnae}</div><div className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>CNAE</div></div>
        </div>
      </div>

      {/* Gráficos - SIN CAMBIOS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Gráfico de pastel - Distribución por Cargo */}
        <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>📊 Distribución por Cargo</h2>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={dataCargo}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={(entry) => `${(entry.percent * 100).toFixed(0)}%`}
                outerRadius={100}
                fill="#8884d8"
                dataKey="value"
                animationDuration={800}
                animationBegin={200}
                animationEasing="ease-out"
              >
                {dataCargo.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={entry.color} />
                ))}
              </Pie>
              <Tooltip contentStyle={{ backgroundColor: isDark ? '#1F2937' : '#FFF', color: isDark ? '#FFF' : '#000' }} />
              <Legend />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* Distribución por Estatus */}
        <div className={`rounded-xl shadow-lg p-5 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>📈 Distribución por Estatus</h2>
          <div className="space-y-3">
            {/* Activos */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🟢</span>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Activos</span>
                </div>
                <div className="flex gap-4">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.activos}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stats.total > 0 ? ((stats.activos / stats.total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: animateBars ? `${stats.total > 0 ? (stats.activos / stats.total) * 100 : 0}%` : '0%',
                    backgroundColor: '#10B981',
                    transition: 'width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transitionDelay: '0ms'
                  }}
                ></div>
              </div>
            </div>

            {/* Inactivos */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔴</span>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Inactivos</span>
                </div>
                <div className="flex gap-4">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.inactivos}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stats.total > 0 ? ((stats.inactivos / stats.total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: animateBars ? `${stats.total > 0 ? (stats.inactivos / stats.total) * 100 : 0}%` : '0%',
                    backgroundColor: '#EF4444',
                    transition: 'width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transitionDelay: '200ms'
                  }}
                ></div>
              </div>
            </div>

            {/* Reposo */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🔵</span>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Reposo</span>
                </div>
                <div className="flex gap-4">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.reposo}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stats.total > 0 ? ((stats.reposo / stats.total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: animateBars ? `${stats.total > 0 ? (stats.reposo / stats.total) * 100 : 0}%` : '0%',
                    backgroundColor: '#3B82F6',
                    transition: 'width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transitionDelay: '400ms'
                  }}
                ></div>
              </div>
            </div>

            {/* Permiso */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">🟡</span>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Permiso</span>
                </div>
                <div className="flex gap-4">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.permiso}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stats.total > 0 ? ((stats.permiso / stats.total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: animateBars ? `${stats.total > 0 ? (stats.permiso / stats.total) * 100 : 0}%` : '0%',
                    backgroundColor: '#F59E0B',
                    transition: 'width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transitionDelay: '600ms'
                  }}
                ></div>
              </div>
            </div>

            {/* Jubilados */}
            <div>
              <div className="flex justify-between items-center mb-1">
                <div className="flex items-center gap-2">
                  <span className="text-lg">⚪</span>
                  <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Jubilados</span>
                </div>
                <div className="flex gap-4">
                  <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>{stats.jubilados}</span>
                  <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>{stats.total > 0 ? ((stats.jubilados / stats.total) * 100).toFixed(0) : 0}%</span>
                </div>
              </div>
              <div className={`w-full rounded-full h-2.5 ${isDark ? 'bg-gray-600' : 'bg-gray-200'}`}>
                <div 
                  className="h-2.5 rounded-full"
                  style={{ 
                    width: animateBars ? `${stats.total > 0 ? (stats.jubilados / stats.total) * 100 : 0}%` : '0%',
                    backgroundColor: '#6B7280',
                    transition: 'width 1.2s cubic-bezier(0.25, 0.1, 0.25, 1)',
                    transitionDelay: '800ms'
                  }}
                ></div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Distribución de Personal por Turno */}
      <div className={`rounded-xl shadow-lg p-6 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📊 Distribución de Personal por Turno
        </h2>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Mañana */}
          <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-yellow-50'}`}>
            <h3 className={`text-lg font-bold text-center mb-3 ${isDark ? 'text-yellow-300' : 'text-yellow-600'}`}>
               MAÑANA
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Docentes</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.docentesMañana}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Administrativos</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.administrativosMañana}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Obreros</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.obrerosMañana}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 dark:border-gray-500">
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>TOTAL</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {stats.docentesMañana + stats.administrativosMañana + stats.obrerosMañana}
                </span>
              </div>
            </div>
          </div>

          {/* Tarde */}
          <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-indigo-50'}`}>
            <h3 className={`text-lg font-bold text-center mb-3 ${isDark ? 'text-indigo-300' : 'text-indigo-600'}`}>
               TARDE
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Docentes</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.docentesTarde}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Administrativos</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.administrativosTarde}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Obreros</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.obrerosTarde}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 dark:border-gray-500">
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>TOTAL</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {stats.docentesTarde + stats.administrativosTarde + stats.obrerosTarde}
                </span>
              </div>
            </div>
          </div>

          {/* Ambos Turnos */}
          <div className={`rounded-lg p-4 ${isDark ? 'bg-gray-700' : 'bg-purple-50'}`}>
            <h3 className={`text-lg font-bold text-center mb-3 ${isDark ? 'text-purple-300' : 'text-purple-600'}`}>
              AMBOS TURNOS
            </h3>
            <div className="space-y-2">
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> CNAE</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.cnaeAmbos}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Docentes</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.docentesAmbos}</span>
              </div>
              <div className="flex justify-between items-center py-1 border-b border-gray-200 dark:border-gray-600">
                <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}> Vigilantes</span>
                <span className="font-bold text-blue-600 dark:text-blue-400">{stats.vigilantesAmbos}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t-2 border-gray-300 dark:border-gray-500">
                <span className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>TOTAL</span>
                <span className="font-bold text-lg text-blue-600 dark:text-blue-400">
                  {stats.cnaeAmbos + stats.docentesAmbos + stats.vigilantesAmbos}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Reposos y Permisos Activos */}
      <div className={`rounded-xl shadow-lg p-5 mb-8 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>🩺 Reposos y Permisos Activos</h2>
          <button 
            onClick={() => window.location.href = '/reportes'}
            className="text-blue-500 hover:text-blue-600 text-sm font-medium flex items-center gap-1"
          >
            Ver todos →
          </button>
        </div>
        
        {repososActivos.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            ✅ No hay reposos ni permisos activos en este momento
          </div>
        ) : (
          <div className="space-y-3">
            {repososActivos.map((item: any) => {
              const hoy = new Date();
              hoy.setHours(0, 0, 0, 0);
              const fechaFin = new Date(item.fecha_fin);
              fechaFin.setHours(0, 0, 0, 0);
              
              const diffTime = fechaFin.getTime() - hoy.getTime();
              const diasRestantes = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              
              let colorDias = 'text-green-500';
              let textoDias = `Finaliza en ${diasRestantes} días`;
              
              if (diasRestantes < 0) {
                colorDias = 'text-red-500';
                textoDias = '⚠️ Vencido';
              } else if (diasRestantes === 0) {
                colorDias = 'text-orange-500';
                textoDias = '⚠️ Vence hoy';
              } else if (diasRestantes <= 3) {
                colorDias = 'text-yellow-500';
                textoDias = `⚠️ Finaliza en ${diasRestantes} días`;
              }
              
              return (
                <div key={item.id} className={`p-3 rounded-lg ${isDark ? 'bg-gray-700' : 'bg-gray-50'}`}>
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-2">
                      <span className="text-xl">{item.tipo === 'Reposo Médico' ? '🔵' : '🟡'}</span>
                      <div>
                        <span className={`font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                          {item.tipo}
                        </span>
                        <span className={`ml-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>
                          {item.nombres} {item.apellidos}
                        </span>
                      </div>
                    </div>
                    <div className={`text-sm font-medium ${colorDias}`}>
                      {textoDias}
                    </div>
                  </div>
                  <div className="text-sm text-gray-500 mt-1">
                    📅 {new Date(item.fecha_fin).toLocaleDateString('es-VE')}
                  </div>
                  {item.motivo && (
                    <div className="text-sm text-gray-400 mt-1">
                      📝 {item.motivo}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Actividad Reciente */}
      <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>📋 Actividad Reciente</h2>
        {actividades.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay actividades registradas aún</div>
        ) : (
          <div className="space-y-3 max-h-80 overflow-y-auto">
            {actividades.slice(0, 10).map((act: any) => (
              <div key={act.id} className={`border-b pb-3 last:border-0 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                <div className="flex justify-between items-start gap-4">
                  <div className="flex-1">
                    <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                      <span className="font-semibold">{act.usuario_nombre || 'Sistema'}</span> {act.accion || 'Realizó una acción'}
                    </p>
                    <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{act.modulo || 'Sistema'}</p>
                  </div>
                  <div className={`text-xs whitespace-nowrap ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                    {formatRelativeDate(act.fecha)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default Home;