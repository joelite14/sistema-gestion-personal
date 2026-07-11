import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // 👈 NUEVA IMPORTACIÓN
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import ReactDOM from 'react-dom';

const RepososPermisos = ({ onVolver }: { onVolver: () => void }) => {
  const [permisos, setPermisos] = useState([]);
  const [personal, setPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formData, setFormData] = useState({
    personal_id: '',
    tipo: 'Reposo Médico',
    fecha_inicio: '',
    fecha_fin: '',
    motivo: ''
  });
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchPermisos();
    fetchPersonal();
  }, []);

  const fetchPermisos = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/permisos-reposos');
      setPermisos(response.data.data || []);
    } catch (error) {
      console.error('Error:', error);
      setPermisos([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchPersonal = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/personal');
      setPersonal(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const dataToSend = {
        ...formData,
        usuario_id: user.id || 1,
        usuario_nombre: user.nombre || 'Administrador'
      };
      // ✅ CAMBIADO
      await api.post('/api/permisos-reposos', dataToSend);
      toast.success('Permiso/Reposo registrado exitosamente');
      setShowModal(false);
      setFormData({ personal_id: '', tipo: 'Reposo Médico', fecha_inicio: '', fecha_fin: '', motivo: '' });
      fetchPermisos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al registrar');
    }
  };

  const finalizarPermiso = async (id: number, personalId: number) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      // ✅ CAMBIADO
      await api.put(`/api/permisos-reposos/${id}/finalizar`, {
        usuario_id: user.id || 1,
        usuario_nombre: user.nombre || 'Administrador'
      });
      toast.success('Permiso/Reposo finalizado');
      fetchPermisos();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al finalizar');
    }
  };

  const permisosActivos = permisos.filter((p: any) => p.estatus === 'Activo');
  const permisosHistorial = permisos.filter((p: any) => p.estatus !== 'Activo');

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div className="p-6">
      <button
        onClick={onVolver}
        className={`flex items-center gap-2 px-4 py-2 rounded-lg mb-6 transition ${
          isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
        }`}
      >
        ← Volver al menú principal
      </button>

      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>🩺 Reposos y Permisos</h1>

      <div className={`rounded-xl shadow-lg p-6 mb-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <div className="flex justify-between items-center mb-4">
          <h2 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>📋 Personal en Reposo/Permiso</h2>
          <button onClick={() => setShowModal(true)} className="bg-blue-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-blue-700 transition">+ Registrar</button>
        </div>

        {permisosActivos.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay personal en reposo o permiso actualmente</div>
        ) : (
          <div className="space-y-3">
            {permisosActivos.map((permiso: any) => {
              const empleado = personal.find((p: any) => p.id_personal === permiso.personal_id);
              return (
                <div key={permiso.id} className={`border rounded-lg p-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {empleado ? `${empleado.nombres} ${empleado.apellidos}` : 'Empleado no encontrado'}
                      </p>
                      <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-600'}`}>
                        {permiso.tipo} • {new Date(permiso.fecha_inicio).toLocaleDateString('es-VE')}
                        {permiso.fecha_fin && ` → ${new Date(permiso.fecha_fin).toLocaleDateString('es-VE')}`}
                      </p>
                      {permiso.motivo && <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-500'}`}>Motivo: {permiso.motivo}</p>}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-1 rounded-full text-xs bg-yellow-500 text-white">Activo</span>
                      <button
                        onClick={() => finalizarPermiso(permiso.id, permiso.personal_id)}
                        className="px-2 py-1 rounded text-xs bg-green-500 text-white hover:bg-green-600"
                      >
                        Finalizar
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <div className={`rounded-xl shadow-lg p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <h2 className={`text-lg font-bold mb-4 ${isDark ? 'text-white' : 'text-gray-800'}`}>📜 Historial</h2>
        {permisosHistorial.length === 0 ? (
          <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No hay registros en el historial</div>
        ) : (
          <div className="space-y-2 max-h-64 overflow-y-auto">
            {permisosHistorial.map((permiso: any) => {
              const empleado = personal.find((p: any) => p.id_personal === permiso.personal_id);
              return (
                <div key={permiso.id} className={`border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                  <div className="flex justify-between items-center">
                    <div>
                      <p className={`text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                        {empleado ? `${empleado.nombres} ${empleado.apellidos}` : 'Empleado no encontrado'}
                      </p>
                      <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                        {permiso.tipo} • {new Date(permiso.fecha_inicio).toLocaleDateString('es-VE')}
                      </p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded ${permiso.estatus === 'Finalizado' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                      {permiso.estatus}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Modal para registrar */}
      {showModal && ReactDOM.createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowModal(false)}></div>
    <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
        <h3 className="text-xl font-bold text-white">Registrar Permiso/Reposo</h3>
        <button 
          onClick={() => setShowModal(false)} 
          className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110 hover:rotate-90"
        >
          ✖
        </button>
      </div>
      <form onSubmit={handleSubmit} className="p-6 space-y-4">
        <div>
          <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Empleado</label>
          <select className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`} value={formData.personal_id} onChange={(e) => setFormData({...formData, personal_id: e.target.value})} required>
            <option value="">Seleccione...</option>
            {personal.map((emp: any) => (
              <option key={emp.id_personal} value={emp.id_personal}>{emp.nombres} {emp.apellidos} - {emp.cedula}</option>
            ))}
          </select>
        </div>
        <div>
          <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tipo</label>
          <select className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`} value={formData.tipo} onChange={(e) => setFormData({...formData, tipo: e.target.value})} required>
            <option value="Reposo Médico"> Reposo Médico</option>
            <option value="Permiso Personal"> Permiso Personal</option>
            <option value="Licencia">Licencia</option>
          </select>
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fecha Inicio</label>
            <input type="date" className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`} value={formData.fecha_inicio} onChange={(e) => setFormData({...formData, fecha_inicio: e.target.value})} required />
          </div>
          <div>
            <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Fecha Fin</label>
            <input type="date" className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`} value={formData.fecha_fin} onChange={(e) => setFormData({...formData, fecha_fin: e.target.value})} />
          </div>
        </div>
        <div>
          <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Motivo</label>
          <textarea className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`} rows={2} value={formData.motivo} onChange={(e) => setFormData({...formData, motivo: e.target.value})} />
        </div>
        <div className="flex gap-3 pt-4">
          <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Registrar</button>
          <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-red text-red-700 py-2 rounded hover:bg-gray-400 dark:bg-red-600 dark:text-white dark:hover:bg-red-500">Cancelar</button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}
    </div>
  );
};

export default RepososPermisos;