import { useEffect, useState } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // 👈 NUEVA IMPORTACIÓN
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import ReactDOM from 'react-dom';

const GestionNiveles = () => {
  const [niveles, setNiveles] = useState<any[]>([]);
  const [filteredNiveles, setFilteredNiveles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [formData, setFormData] = useState({
    cargo_tipo: 'Docente',
    nivel: '',
    codigo: '',
    orden: 0
  });
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const cargos = ['todos', 'Docente', 'Administrativo', 'Obrero', 'Vigilante', 'CNAE'];

  useEffect(() => {
    fetchNiveles();
  }, []);

  useEffect(() => {
    if (filtroCargo === 'todos') {
      setFilteredNiveles(niveles);
    } else {
      setFilteredNiveles(niveles.filter(n => n.cargo_tipo === filtroCargo));
    }
  }, [filtroCargo, niveles]);

  const fetchNiveles = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/niveles');
      setNiveles(response.data.data);
      setFilteredNiveles(response.data.data);
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al cargar los niveles');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editingId) {
        // ✅ CAMBIADO
        await api.put(`/api/niveles/${editingId}`, formData);
        toast.success('Nivel actualizado exitosamente');
      } else {
        // ✅ CAMBIADO
        await api.post('/api/niveles', formData);
        toast.success('Nivel creado exitosamente');
      }
      setShowModal(false);
      resetForm();
      fetchNiveles();
    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al guardar el nivel');
    }
  };

  const handleEdit = (nivel: any) => {
    setEditingId(nivel.id);
    setFormData({
      cargo_tipo: nivel.cargo_tipo,
      nivel: nivel.nivel,
      codigo: nivel.codigo,
      orden: nivel.orden || 0
    });
    setShowModal(true);
  };

  const handleDelete = async (id: number, nivel: string) => {
    if (confirm(`¿Eliminar el nivel "${nivel}"?`)) {
      try {
        // ✅ CAMBIADO
        await api.delete(`/api/niveles/${id}`);
        toast.success('Nivel eliminado exitosamente');
        fetchNiveles();
      } catch (error: any) {
        toast.error(error.response?.data?.message || 'Error al eliminar');
      }
    }
  };

  const resetForm = () => {
    setFormData({
      cargo_tipo: 'Docente',
      nivel: '',
      codigo: '',
      orden: 0
    });
    setEditingId(null);
  };

  const openModal = () => {
    resetForm();
    setShowModal(true);
  };

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}> Niveles Académicos por Cargo</h2>
        <button
          onClick={openModal}
          className="bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"
        >
          <span className="text-xl">+</span> Agregar Nivel
        </button>
      </div>

      {/* Filtro por cargo */}
      <div className="mb-4 flex gap-2 flex-wrap">
        {cargos.map((cargo) => (
          <button
            key={cargo}
            onClick={() => setFiltroCargo(cargo)}
            className={`px-4 py-2 rounded-full text-sm transition-all ${
              filtroCargo === cargo
                ? 'bg-blue-600 text-white shadow-md'
                : isDark 
                  ? 'bg-gray-700 text-gray-300 hover:bg-gray-600'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
          >
            {cargo === 'todos' ? '📋 Todos' : cargo}
          </button>
        ))}
      </div>

      {/* Tabla de niveles */}
      <div className={`overflow-x-auto rounded-xl shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <table className="min-w-full">
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-800'} text-white`}>
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Cargo</th>
              <th className="p-3 text-left">Nivel / Categoría</th>
              <th className="p-3 text-left">Código</th>
              <th className="p-3 text-left">Orden</th>
              <th className="p-3 text-center">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredNiveles.length === 0 ? (
              <tr>
                <td colSpan={6} className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No hay niveles registrados
                </td>
              </tr>
            ) : (
              filteredNiveles.map((nivel: any, index: number) => (
                <tr key={nivel.id} className={`border-b transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'}`}>
                  <td className="p-3 text-center">{index + 1}</td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nivel.cargo_tipo}</td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nivel.nivel}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded font-mono text-sm ${isDark ? 'bg-gray-700 text-white' : 'bg-gray-100 text-gray-800'}`}>
                      {nivel.codigo}
                    </span>
                  </td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{nivel.orden}</td>
                  <td className="p-3 text-center">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => handleEdit(nivel)} className="bg-yellow-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-yellow-600 transition">✏️ Editar</button>
                      <button onClick={() => handleDelete(nivel.id, nivel.nivel)} className="bg-red-500 text-white px-3 py-1 rounded-lg text-xs hover:bg-red-600 transition">🗑️ Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal para crear/editar nivel */}
      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-xl">
              <h3 className="text-xl font-bold text-white">
                {editingId ? '✏️ Editar Nivel' : '➕ Agregar Nivel'}
              </h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110 hover:rotate-90"
              >
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 pt-4 space-y-4">
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cargo</label>
                <select
                  className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  value={formData.cargo_tipo}
                  onChange={(e) => setFormData({...formData, cargo_tipo: e.target.value})}
                  required
                >
                  <option value="Docente">Docente</option>
                  <option value="Administrativo">Administrativo</option>
                  <option value="Obrero">Obrero</option>
                  <option value="Vigilante">Vigilante</option>
                  <option value="CNAE">CNAE</option>
                </select>
              </div>
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Nivel / Categoría</label>
                <input
                  type="text"
                  className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  value={formData.nivel}
                  onChange={(e) => setFormData({...formData, nivel: e.target.value})}
                  placeholder="Ej: DOC. II / AULA"
                  required
                />
              </div>
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Código</label>
                <input
                  type="text"
                  className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  value={formData.codigo}
                  onChange={(e) => setFormData({...formData, codigo: e.target.value})}
                  placeholder="Ej: 1122DI"
                  required
                />
              </div>
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Orden</label>
                <input
                  type="number"
                  className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white border-gray-300'}`}
                  value={formData.orden}
                  onChange={(e) => setFormData({...formData, orden: parseInt(e.target.value) || 0})}
                  placeholder="Orden de aparición"
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Guardar</button>
                <button type="button" onClick={() => setShowModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancelar</button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

export default GestionNiveles;