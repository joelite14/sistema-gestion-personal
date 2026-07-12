import { useState, useEffect } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // 👈 NUEVA IMPORTACIÓN
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import ReactDOM from 'react-dom';
import { API_URL } from '../services/api';


const ConstanciasReportes = ({ onVolver }: { onVolver: () => void }) => {
  const [loading, setLoading] = useState(false);
  const [personal, setPersonal] = useState([]);
  const [selectedEmpleado, setSelectedEmpleado] = useState('');
  const [busqueda, setBusqueda] = useState('');
  const [mostrarLista, setMostrarLista] = useState(false);
  const [resultados, setResultados] = useState([]);
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  const [dependencias, setDependencias] = useState<any[]>([]);
  const [dependenciaSeleccionada, setDependenciaSeleccionada] = useState('todas');
  const [showRepososModal, setShowRepososModal] = useState(false);
  const [fechaDesde, setFechaDesde] = useState('');
  const [fechaHasta, setFechaHasta] = useState('');
  const [tipoReporte, setTipoReporte] = useState('todos');
  const [showBitacoraModal, setShowBitacoraModal] = useState(false);
  const [fechaDesdeBitacora, setFechaDesdeBitacora] = useState('');
  const [fechaHastaBitacora, setFechaHastaBitacora] = useState('');
  const [usuarioBitacora, setUsuarioBitacora] = useState('todos');
  const [usuarios, setUsuarios] = useState([]);

  // ✅ CAMBIADO: Usar api en lugar de axios
  const generarReporteReposos = () => {
  if (!fechaDesde || !fechaHasta) {
    toast.error('Selecciona un rango de fechas');
    return;
  }
  setLoading(true);
  window.open(
    `${API_URL}/api/reportes/reposos-permisos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&tipo=${tipoReporte}`,
    '_blank'
  );
  setTimeout(() => setLoading(false), 1000);
  setShowRepososModal(false);
};
  useEffect(() => {
    fetchDependencias();
  }, []);

  const fetchDependencias = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/dependencias');
      const nombres = response.data.data.map((dep: any) => `${dep.codigo} - ${dep.nombre}`);
      setDependencias(nombres);
    } catch (error) {
      console.error('Error al cargar dependencias:', error);
    }
  };

  useEffect(() => {
    fetchPersonal();
  }, []);

  const fetchPersonal = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/personal');
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const generarReporteGeneral = () => {
  setLoading(true);
  window.open(`${API_URL}/api/reportes/personal-pdf`, '_blank'); 
  setTimeout(() => setLoading(false), 1000);
};

  const generarReporteRAC = () => {
  setLoading(true);
  window.open(`${API_URL}/api/reportes/rac-excel`, '_blank'); // 
  setTimeout(() => setLoading(false), 1000);
};

  const generarConstancia = () => {
  if (!selectedEmpleado) {
    toast.error('Seleccione un empleado');
    return;
  }
  setLoading(true);
  window.open(`${API_URL}/api/reportes/constancia-pdf/${selectedEmpleado}`, '_blank'); // 👈 CAMBIADO
  setTimeout(() => setLoading(false), 1000);
};

  const buscarEmpleados = () => {
    if (busqueda.length < 2) {
      toast.error('Ingrese al menos 2 caracteres');
      return;
    }
    const filtrados = personal.filter((emp: any) =>
      emp.nombres?.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.apellidos?.toLowerCase().includes(busqueda.toLowerCase()) ||
      emp.cedula?.includes(busqueda)
    );
    setResultados(filtrados);
    setMostrarLista(true);
  };

  const seleccionarEmpleado = (id: number, nombre: string) => {
    setSelectedEmpleado(id.toString());
    setBusqueda(nombre);
    setMostrarLista(false);
  };

  return (
    <div className={`min-h-screen p-6 ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="max-w-6xl mx-auto">
        <button
          onClick={onVolver}
          className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 transition ${
            isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'
          }`}
        >
          ← Volver al menú principal
        </button>

        <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📄 Constancias y Reportes
        </h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Reporte General */}
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-blue-700 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-4xl mb-3">📊</div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Reporte General de Personal
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Listado completo de todos los empleados en formato PDF.
            </p>
            <button
              onClick={generarReporteGeneral}
              disabled={loading}
              className="w-full bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition disabled:opacity-50"
            >
              {loading ? '⏳ Generando...' : '📥 Generar PDF'}
            </button>
          </div>

          {/* RAC - Registro Auxiliar de Personal */}
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-t-purple-500 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="flex items-center gap-3 mb-3">
              <div className="text-4xl">📋</div>
              <div>
                <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  Registro Auxiliar de Personal (RAC)
                </h2>
              </div>
            </div>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Listado completo de todos los empleados con sus datos principales en formato PDF.
            </p>
            <button
              onClick={generarReporteRAC}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Generando...
                </>
              ) : (
                <>
                  📥 Generar RAC EXCEL
                </>
              )}
            </button>
          </div>

          {/* Constancia de Trabajo */}
<div className={`rounded-xl shadow-lg p-6 border-t-4 border-green-600 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
  <div className="text-4xl mb-3">📄</div>
  <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
    Constancia de Trabajo
  </h2>
  <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
    Generar constancia de trabajo individual para un empleado.
  </p>

  {/* 🔥 AQUÍ ESTÁ EL CAMBIO */}
  <div className="relative mb-4">
    <div className="flex flex-col sm:flex-row gap-2">
      <input
        type="text"
        placeholder="Buscar empleado por nombre o cédula..."
        className={`flex-1 min-w-[0px] p-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 ${
          isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
        }`}
        value={busqueda}
        onChange={(e) => {
          setBusqueda(e.target.value);
          setMostrarLista(false);
          setSelectedEmpleado('');
        }}
      />
      <button
        onClick={buscarEmpleados}
        className="bg-gray-500 text-white px-4 py-2 rounded-lg hover:bg-gray-600 whitespace-nowrap"
      >
        Buscar
      </button>
    </div>

    {mostrarLista && resultados.length > 0 && (
      <div className={`absolute z-10 w-full mt-1 border rounded-lg shadow-lg max-h-40 overflow-y-auto ${
        isDark ? 'bg-gray-700 border-gray-600' : 'bg-white border-gray-300'
      }`}>
        {resultados.map((emp: any) => (
          <div
            key={emp.id_personal}
            onClick={() => seleccionarEmpleado(emp.id_personal, `${emp.nombres} ${emp.apellidos}`)}
            className={`p-2 cursor-pointer hover:bg-blue-100 ${isDark ? 'hover:bg-gray-600 text-white' : 'hover:bg-blue-50'}`}
          >
            {emp.nombres} {emp.apellidos} - {emp.cedula}
          </div>
        ))}
      </div>
    )}
  </div>

  {selectedEmpleado && (
    <div className={`mb-4 p-2 rounded ${isDark ? 'bg-green-900 text-green-300' : 'bg-green-100 text-green-800'}`}>
      ✅ Empleado seleccionado
    </div>
  )}

  <button
    onClick={generarConstancia}
    disabled={loading || !selectedEmpleado}
    className="w-full bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition disabled:opacity-50"
  >
    {loading ? '⏳ Generando...' : '📥 Generar Constancia'}
  </button>
</div>

          {/* Reporte por Dependencia */}
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-orange-500 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-4xl mb-3">🏢</div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Reporte por Dependencia
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Listado de empleados agrupados por dependencia en formato Excel.
            </p>
            
            <div className="mb-4">
              <label className={`block text-sm font-medium mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                Seleccionar Dependencia
              </label>
              <select
                value={dependenciaSeleccionada}
                onChange={(e) => setDependenciaSeleccionada(e.target.value)}
                className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-orange-500 outline-none transition ${
                  isDark 
                    ? 'bg-gray-700 text-white border-gray-600' 
                    : 'bg-white text-gray-800 border-gray-300'
                }`}
              >
                <option value="todas">📋 Todas las dependencias</option>
                {dependencias.map((dep) => (
                  <option key={dep} value={dep}>{dep}</option>
                ))}
              </select>
            </div>

            <button
              onClick={() => {
                setLoading(true);
                window.open(
                `${API_URL}/api/reportes/personal-por-dependencia?dependencia=${encodeURIComponent(dependenciaSeleccionada)}`,
                  '_blank');
                setTimeout(() => setLoading(false), 1000);
              }}
              disabled={loading}
              className="w-full bg-orange-500 text-white px-4 py-2.5 rounded-lg hover:bg-orange-600 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <span className="animate-spin">⏳</span> Generando...
                </>
              ) : (
                <>
                  📥 Generar Reporte
                </>
              )}
            </button>
          </div>

          {/* Reporte de Reposos y Permisos */}
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-t-purple-500 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-4xl mb-3">🩺</div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Reporte de Reposos y Permisos
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Generar reporte de reposos y permisos por rango de fechas en formato Excel.
            </p>
            <button
              onClick={() => setShowRepososModal(true)}
              disabled={loading}
              className="w-full bg-purple-600 text-white px-4 py-2.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              📋 Generar Reporte
            </button>
          </div>

          {/* Reporte de Bitácora */}
          <div className={`rounded-xl shadow-lg p-6 border-t-4 border-t-teal-500 transition-all duration-300 hover:scale-[1.02] ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-4xl mb-3">📋</div>
            <h2 className={`text-lg font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>
              Reporte de Bitácora
            </h2>
            <p className={`text-sm mb-4 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              Generar reporte de actividad del sistema por rango de fechas en formato Excel.
            </p>
            <button
              onClick={() => setShowBitacoraModal(true)}
              disabled={loading}
              className="w-full bg-teal-600 text-white px-4 py-2.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-medium flex items-center justify-center gap-2"
            >
              📋 Generar Reporte
            </button>
          </div>
        </div>
      </div>

      {/* MODAL - Reporte de Reposos y Permisos */}
      {showRepososModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowRepososModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative bg-gradient-to-r from-purple-600 to-purple-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl mb-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                🩺 Reporte de Reposos y Permisos
              </h3>
              <button
                onClick={() => setShowRepososModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110 hover:rotate-90"
              >
                ✖
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesde}
                  onChange={(e) => setFechaDesde(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHasta}
                  onChange={(e) => setFechaHasta(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Tipo
                </label>
                <select
                  value={tipoReporte}
                  onChange={(e) => setTipoReporte(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-purple-500 outline-none transition ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                >
                  <option value="todos">Todos</option>
                  <option value="Reposo">Reposo</option>
                  <option value="Permiso">Permiso</option>
                </select>
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (!fechaDesde || !fechaHasta) {
                      toast.error('Selecciona un rango de fechas');
                      return;
                    }
                    setLoading(true);
                    window.open(
                    `${API_URL}/api/reportes/reposos-permisos?fecha_desde=${fechaDesde}&fecha_hasta=${fechaHasta}&tipo=${tipoReporte}` ,
                    '_blank'
                    );
                    setTimeout(() => setLoading(false), 1000);
                    setShowRepososModal(false);
                  }}
                  disabled={loading}
                  className="flex-1 bg-purple-600 text-white py-2.5 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 font-medium"
                >
                  {loading ? '⏳ Generando...' : '📥 Generar Reporte'}
                </button>
                <button
                  onClick={() => setShowRepososModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL - Reporte de Bitácora */}
      {showBitacoraModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowBitacoraModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative bg-gradient-to-r from-teal-600 to-teal-700 -mx-6 -mt-6 px-6 py-4 rounded-t-xl mb-6 flex justify-between items-center">
              <h3 className="text-xl font-bold text-white">
                📋 Reporte de Bitácora
              </h3>
              <button
                onClick={() => setShowBitacoraModal(false)}
                className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110 hover:rotate-90"
              >
                ✖
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha Desde
                </label>
                <input
                  type="date"
                  value={fechaDesdeBitacora}
                  onChange={(e) => setFechaDesdeBitacora(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div>
                <label className={`block text-sm font-medium mb-1 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                  Fecha Hasta
                </label>
                <input
                  type="date"
                  value={fechaHastaBitacora}
                  onChange={(e) => setFechaHastaBitacora(e.target.value)}
                  className={`w-full p-2.5 border rounded-lg focus:ring-2 focus:ring-teal-500 outline-none transition ${
                    isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
                  }`}
                />
              </div>

              <div className="flex gap-3 pt-4">
                <button
                  onClick={() => {
                    if (!fechaDesdeBitacora || !fechaHastaBitacora) {
                      toast.error('Selecciona un rango de fechas');
                      return;
                    }
                    setLoading(true);
                    window.open(
                      `${API_URL}/api/reportes/bitacora?fecha_desde=${fechaDesdeBitacora}&fecha_hasta=${fechaHastaBitacora}&usuario=todos`,
                      '_blank'
                    );
                    setTimeout(() => setLoading(false), 1000);
                    setShowBitacoraModal(false);
                  }}
                  disabled={loading}
                  className="flex-1 bg-teal-600 text-white py-2.5 rounded-lg hover:bg-teal-700 transition disabled:opacity-50 font-medium"
                >
                  {loading ? '⏳ Generando...' : '📥 Generar Reporte'}
                </button>
                <button
                  onClick={() => setShowBitacoraModal(false)}
                  className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
                >
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default ConstanciasReportes;