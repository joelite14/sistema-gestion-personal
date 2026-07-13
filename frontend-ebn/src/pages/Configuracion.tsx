import { useState, useEffect } from 'react';
import { api } from '../services/api'; 
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import GestionNiveles from '../components/GestionNiveles';
import GestionDependencias from '../components/GestionDependencias';
import ReactDOM from 'react-dom';

// ============================================
// COMPONENTE DE GESTIÓN DE PERSONAL
// ============================================
const GestionPersonal = () => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [filteredPersonal, setFilteredPersonal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [searchTerm, setSearchTerm] = useState('');

  const [filtroEstatus, setFiltroEstatus] = useState<'activo' | 'inactivo' | 'jubilado'>('activo');
  const [showEstatusModal, setShowEstatusModal] = useState(false);
  const [empleadoEstatus, setEmpleadoEstatus] = useState<{ id: number, nombre: string } | null>(null);
  const [nivelesDisponibles, setNivelesDisponibles] = useState<any[]>([]);
  const [dependencias, setDependencias] = useState<any[]>([]);
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';
  
  const [formData, setFormData] = useState({
    cedula: '', nombres: '', apellidos: '', telefono: '', correo: '',
    fecha_nacimiento: '', edad: '',
    genero: '', estado_civil: '', direccion: '',
    cargo: '', cod_cargo: '', nivel_academico: '', fecha_ingreso: '', estatus: 'Activo',
    turno: '',           
    dependencia_actual: '',   
    dependencia_voucher: '' ,
      
  });

  useEffect(() => { fetchPersonal(); }, []);
  
  useEffect(() => {
    const fetchDependencias = async () => {
      try {
        // ✅ CAMBIADO
        const response = await api.get('/api/dependencias');
        setDependencias(response.data.data || []);
      } catch (error) {
        console.error('Error al cargar dependencias:', error);
        setDependencias([]);
      }
    };
    fetchDependencias();
  }, []);
  
  useEffect(() => {
    let filtered = [...personal];
    
    if (filtroEstatus === 'activo') {
      filtered = filtered.filter(emp => emp.estatus === 'Activo');
    } else if (filtroEstatus === 'inactivo') {
      filtered = filtered.filter(emp => emp.estatus === 'Inactivo');
    } else {
      filtered = filtered.filter(emp => emp.estatus === 'Jubilado');
    }
    
    if (searchTerm !== '') {
      filtered = filtered.filter((emp: any) =>
        emp.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cargo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.cod_cargo?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }
    
    setFilteredPersonal(filtered);
  }, [searchTerm, personal, filtroEstatus]);

  const fetchPersonal = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/personal');
      setPersonal(response.data.data);
      setFilteredPersonal(response.data.data);
    } catch (error) { 
      console.error('Error:', error);
      toast.error('Error al cargar el personal');
    } finally { setLoading(false); }
  };

  const cargarNivelesPorCargo = async (cargo: string, nivelExistente?: string, codExistente?: string) => {
    if (!cargo) return;
    try {
      // ✅ CAMBIADO
      const response = await api.get(`/api/niveles/cargo/${cargo}`);
      setNivelesDisponibles(response.data.data);
      
      if (nivelExistente) {
        setFormData(prev => ({ 
          ...prev, 
          nivel_academico: nivelExistente, 
          cod_cargo: codExistente || '' 
        }));
      } else {
        setFormData(prev => ({ ...prev, nivel_academico: '', cod_cargo: '' }));
      }
    } catch (error) {
      console.error('Error al cargar niveles:', error);
      setNivelesDisponibles([]);
    }
  };

  const calcularEdad = (fechaNacimiento: string) => {
    if (!fechaNacimiento) return '';
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad.toString();
  };

  const calcularAniosServicio = (fechaIngreso: string) => {
    if (!fechaIngreso) return '';
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    let anios = hoy.getFullYear() - ingreso.getFullYear();
    const mes = hoy.getMonth() - ingreso.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
      anios--;
    }
    return anios.toString();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const dataToSend = { ...formData, usuario_id: user.id || 1, usuario_nombre: user.nombre || 'Administrador' };
      if (editingId) {
        // ✅ CAMBIADO
        await api.put(`/api/personal/${editingId}`, dataToSend);
        toast.success('Empleado actualizado exitosamente');
      } else {
        // ✅ CAMBIADO
        await api.post('/api/personal', dataToSend);
        toast.success('Empleado registrado exitosamente');
      }
      setShowModal(false); setEditingId(null); resetForm(); fetchPersonal();
    } catch (error) { 
      toast.error(editingId ? 'Error al actualizar' : 'Error al registrar');
    }
  };

  const handleEdit = async (emp: any) => {
    setEditingId(emp.id_personal);
    
    const nivelActual = emp.nivel_academico || '';
    const codActual = emp.cod_cargo || '';
    
    setFormData({
      cedula: emp.cedula || '', nombres: emp.nombres || '', apellidos: emp.apellidos || '',
      telefono: emp.telefono || '', correo: emp.correo || '',
      fecha_nacimiento: emp.fecha_nacimiento ? emp.fecha_nacimiento.split('T')[0] : '',
      edad: emp.edad || '',
      genero: emp.genero || '', estado_civil: emp.estado_civil || '', direccion: emp.direccion || '',
      cargo: emp.cargo || '',
      cod_cargo: codActual,
      nivel_academico: nivelActual,
      fecha_ingreso: emp.fecha_ingreso ? emp.fecha_ingreso.split('T')[0] : '',
      estatus: emp.estatus || 'Activo',
      turno: emp.turno || '',
      dependencia_actual: emp.dependencia_actual || '',
      dependencia_voucher: emp.dependencia_voucher || ''
    });
    
    if (emp.cargo) {
      await cargarNivelesPorCargo(emp.cargo, nivelActual, codActual);
    }
    
    setShowModal(true);
  };

  const cambiarEstatusDirecto = async (id: number, nuevoEstatus: string, nombreEmpleado: string) => {
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      // ✅ CAMBIADO
      await api.put(`/api/personal/${id}`, { 
        estatus: nuevoEstatus,
        usuario_nombre: user.nombre || 'Administrador',
        usuario_id: user.id || 1,
        accion_extra: `Cambió estatus de empleado ${nombreEmpleado} a ${nuevoEstatus === 'Activo' ? 'Activo' : (nuevoEstatus === 'Inactivo' ? 'Inactivo' : 'Jubilado')}`
      });
      toast.success(`Empleado ${nuevoEstatus === 'Activo' ? 'reactivado' : `cambiado a ${nuevoEstatus}`} exitosamente`);
      fetchPersonal();
    } catch (error) { 
      console.error('Error:', error);
      toast.error('Error al cambiar estatus');
    }
  };

  const abrirModalEstatus = (id: number, nombre: string) => {
    setEmpleadoEstatus({ id, nombre });
    setShowEstatusModal(true);
  };

  const confirmarCambioEstatus = async (nuevoEstatus: string) => {
    if (!empleadoEstatus) return;
    try {
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      // ✅ CAMBIADO
      await api.put(`/api/personal/${empleadoEstatus.id}`, { 
        estatus: nuevoEstatus,
        usuario_nombre: user.nombre || 'Administrador',
        usuario_id: user.id || 1,
        accion_extra: `Cambió estatus de empleado ${empleadoEstatus.nombre} a ${nuevoEstatus === 'Inactivo' ? 'Inactivo' : 'Jubilado'}`
      });
      toast.success(`Empleado cambiado a ${nuevoEstatus === 'Inactivo' ? 'Inactivo' : 'Jubilado'} exitosamente`);
      setShowEstatusModal(false);
      setEmpleadoEstatus(null);
      fetchPersonal();
    } catch (error) { 
      console.error('Error:', error);
      toast.error('Error al cambiar estatus');
    }
  };


  const resetForm = () => {
    setFormData({ 
      cedula: '', nombres: '', apellidos: '', telefono: '', correo: '',
      fecha_nacimiento: '', edad: '',
      genero: '', estado_civil: '', direccion: '',
      cargo: '', cod_cargo: '', nivel_academico: '', fecha_ingreso: '', estatus: 'Activo',
      turno: '', dependencia_actual: '', dependencia_voucher: ''
    });
    setNivelesDisponibles([]);
  };

  const openModal = () => { resetForm(); setEditingId(null); setShowModal(true); };
  const closeModal = () => { setShowModal(false); setEditingId(null); resetForm(); };

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
      </div>
      <button onClick={openModal} className="ml-auto bg-gradient-to-r from-blue-500 to-blue-600 text-white px-5 py-2 rounded-lg font-semibold hover:from-blue-600 hover:to-blue-700 transition-all duration-200 shadow-md hover:shadow-lg flex items-center gap-2"><span className="text-xl">+</span> Nuevo Empleado</button>

      <div className="flex gap-2 mb-4 border-b border-gray-200 dark:border-gray-700">
        <button onClick={() => setFiltroEstatus('activo')} className={`px-4 py-2 text-sm font-medium transition-all ${filtroEstatus === 'activo' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>🟢 Activo</button>
        <button onClick={() => setFiltroEstatus('inactivo')} className={`px-4 py-2 text-sm font-medium transition-all ${filtroEstatus === 'inactivo' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>🔴 Inactivo</button>
        <button onClick={() => setFiltroEstatus('jubilado')} className={`px-4 py-2 text-sm font-medium transition-all ${filtroEstatus === 'jubilado' ? 'border-b-2 border-blue-500 text-blue-600' : 'text-gray-500 hover:text-gray-700'}`}>⚪ Jubilado</button>
      </div>

      <div className="mb-6">
        <input type="text" placeholder="🔍 Buscar por cédula, nombres, apellidos, cargo o código de cargo..." className={`w-full px-4 py-3 border rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' : 'bg-white text-gray-800 border-gray-300'}`} value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} />
      </div>

      <div className={`overflow-x-auto rounded-xl shadow ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
        <table className="min-w-full">
          <thead className={`${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-800 to-gray-700'} text-white`}>
  <tr>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">#</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Cédula</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Nombres</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Apellidos</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Cargo</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Cod.</th>
    <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Estatus</th>
    <th className="p-3 text-center whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Acciones</th>
  </tr>
</thead>
          <tbody>
            {filteredPersonal.length === 0 ? (
              <tr><td colSpan={8} className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>No se encontraron empleados</td></tr>
            ) : (
              filteredPersonal.map((emp: any, index: number) => (
                <tr key={emp.id_personal} className={`border-b transition-colors duration-150 ${isDark ? 'border-gray-700 hover:bg-gray-700/50' : 'border-gray-200 hover:bg-blue-50/30'}`}>
                  <td className="p-3 text-center whitespace-nowrap">{index + 1}</td>
                  <td className={`p-3 whitespace-nowrap font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.cedula}</td>
                  <td className={`p-3 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.nombres}</td>
                  <td className={`p-3 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.apellidos}</td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>{emp.cargo}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono ${isDark ? 'bg-gray-600 text-gray-200' : 'bg-gray-100 text-gray-800'}`}>{emp.cod_cargo || 'No asignado'}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <span className={`px-2 py-1 rounded-full text-white text-xs ${emp.estatus === 'Activo' ? 'bg-green-500' : emp.estatus === 'Inactivo' ? 'bg-red-500' : 'bg-gray-500'}`}>{emp.estatus}</span>
                  </td>
                  <td className="p-3 whitespace-nowrap">
                    <div className="flex flex-wrap gap-1.5 justify-center">
  <button 
    onClick={() => handleEdit(emp)} 
    className="bg-yellow-500 hover:bg-yellow-600 text-white px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
  >
    ✏️ Editar
  </button>
  {filtroEstatus === 'activo' ? (
    <button 
      onClick={() => abrirModalEstatus(emp.id_personal, `${emp.nombres} ${emp.apellidos}`)} 
      className="bg-orange-500 hover:bg-orange-600 text-white px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
    >
      🔄 Estatus
    </button>
  ) : (
    <button 
      onClick={() => cambiarEstatusDirecto(emp.id_personal, 'Activo', `${emp.nombres} ${emp.apellidos}`)} 
      className="bg-green-500 hover:bg-green-600 text-white px-2.5 py-1 rounded text-xs font-medium transition-all duration-200 hover:shadow-md whitespace-nowrap"
    >
      🔄 Reactivar
    </button>
  )}
</div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {showEstatusModal && empleadoEstatus && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowEstatusModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className="flex justify-between items-center mb-2">
                <div className="w-8"></div>
                <div className="text-5xl">🔄</div>
                <button 
                  onClick={() => setShowEstatusModal(false)} 
                  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-white hover:scale-110"
                >
                  ✖
                </button>
              </div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cambiar estatus de {empleadoEstatus.nombre}</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Seleccione el nuevo estatus:</p>
              <div className="flex flex-col gap-3">
                <button onClick={() => confirmarCambioEstatus('Inactivo')} className="w-full bg-red-500 text-white py-2 rounded-lg hover:bg-red-600 transition flex items-center justify-center gap-2">🔴 Inactivo</button>
                <button onClick={() => confirmarCambioEstatus('Jubilado')} className="w-full bg-gray-500 text-white py-2 rounded-lg hover:bg-gray-600 transition flex items-center justify-center gap-2">⚪ Jubilado</button>
                <button onClick={() => setShowEstatusModal(false)} className="w-full bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 transition dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancelar</button>
              </div>
            </div>
          </div>
        </div>,
        document.body
      )}

      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={closeModal}></div>
          <div className={`relative rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-5 rounded-t-2xl shadow-lg">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center backdrop-blur-sm">
                    <span className="text-2xl">{editingId ? '✏️' : '➕'}</span>
                  </div>
                  <div>
                    <h3 className="text-2xl font-bold text-white tracking-tight">
                      {editingId ? 'Editar Empleado' : 'Registrar Nuevo Empleado'}
                    </h3>
                    <p className="text-blue-100 text-sm mt-0.5">
                      {editingId ? 'Modifica los datos del empleado' : 'Completa los datos del nuevo empleado'}
                    </p>
                  </div>
                </div>
                <button 
                  onClick={closeModal} 
                  className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110"
                >
                  ✖
                </button>
              </div>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-8">
              {/* DATOS PERSONALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 pb-2 mb-4 border-blue-500/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-sm">📋</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Datos Personales
                  </h3>
                  <div className="flex-1"></div>
                  <span className="text-xs text-gray-400">Todos los campos con * son obligatorios</span>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cédula */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Cédula <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.cedula} 
                      onChange={(e) => setFormData({...formData, cedula: e.target.value})} 
                      required 
                      placeholder="Ej: 12345678"
                    />
                  </div>
                  
                  {/* Nombres */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Nombres <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`}
                      value={formData.nombres} 
                      onChange={(e) => setFormData({...formData, nombres: e.target.value.toUpperCase()})} 
                      required 
                      placeholder="Ej: JUAN CARLOS"
                    />
                  </div>
                  
                  {/* Apellidos */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Apellidos <span className="text-red-500">*</span>
                    </label>
                    <input 
                       type="text" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`}
                      value={formData.apellidos} 
                      onChange={(e) => setFormData({...formData, apellidos: e.target.value.toUpperCase()})} 
                      required 
                      placeholder="Ej: PÉREZ RODRÍGUEZ"
                    />
                  </div>
                  
                  {/* Fecha de Nacimiento */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Fecha de Nacimiento
                    </label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.fecha_nacimiento} 
                      onChange={(e) => { const fecha = e.target.value; setFormData({ ...formData, fecha_nacimiento: fecha, edad: calcularEdad(fecha) }); }} 
                    />
                  </div>
                  
                  {/* Edad */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Edad
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border-2 rounded-xl ${isDark ? 'bg-gray-600 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'} cursor-not-allowed`} 
                        value={formData.edad ? `${formData.edad} años` : ''} 
                        readOnly 
                        placeholder="Se calcula automáticamente"
                      />
                      <div className="absolute right-3 top-3 text-gray-400"></div>
                    </div>
                  </div>
                  
                  {/* Género */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Género
                    </label>
                    <select 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.genero} 
                      onChange={(e) => setFormData({...formData, genero: e.target.value})}
                    >
                      <option value="">Seleccione</option>
                      <option value="Masculino"> Masculino</option>
                      <option value="Femenino"> Femenino</option>
                    </select>
                  </div>
                  
                  {/* Estado Civil */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Estado Civil
                    </label>
                    <select 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.estado_civil} 
                      onChange={(e) => setFormData({...formData, estado_civil: e.target.value})}
                    >
                      <option value="">Seleccione</option>
                      <option value="Soltero/a"> Soltero/a</option>
                      <option value="Casado/a"> Casado/a</option>
                      <option value="Divorciado/a"> Divorciado/a</option>
                      <option value="Viudo/a"> Viudo/a</option>
                    </select>
                  </div>
                  
                  {/* Dirección */}
                  <div className="col-span-1 md:col-span-2 group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Dirección
                    </label>
                    <textarea 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none resize-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      rows={2} 
                      value={formData.direccion} 
                      onChange={(e) => setFormData({...formData, direccion: e.target.value})} 
                      placeholder="Dirección completa del empleado (Calle, Número, Ciudad, Estado)"
                    ></textarea>
                  </div>
                  
                  {/* Teléfono */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Teléfono
                    </label>
                    <input 
                      type="text" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.telefono} 
                      onChange={(e) => setFormData({...formData, telefono: e.target.value})} 
                      placeholder="Ej: 0412-1234567"
                    />
                  </div>
                  
                  {/* Correo */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Correo Electrónico
                    </label>
                    <input 
                      type="email" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.correo} 
                      onChange={(e) => setFormData({...formData, correo: e.target.value})} 
                      placeholder="ejemplo@correo.com"
                    />
                  </div>
                </div>
              </div>

              {/* DATOS LABORALES */}
              <div className="space-y-4">
                <div className="flex items-center gap-3 border-b-2 pb-2 mb-4 border-green-500/30">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg flex items-center justify-center shadow-md">
                    <span className="text-white text-sm">💼</span>
                  </div>
                  <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    Datos Laborales
                  </h3>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  {/* Cargo */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      Cargo <span className="text-red-500">*</span>
                    </label>
                    <select 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.cargo} 
                      onChange={(e) => { const nuevoCargo = e.target.value; setFormData({ ...formData, cargo: nuevoCargo, nivel_academico: '', cod_cargo: '' }); if (nuevoCargo) cargarNivelesPorCargo(nuevoCargo); else setNivelesDisponibles([]); }} 
                      required
                    >
                      <option value="">Seleccione un cargo</option>
                      <option value="Docente"> Docente</option>
                      <option value="Administrativo"> Administrativo</option>
                      <option value="Obrero"> Obrero</option>
                      <option value="Vigilante"> Vigilante</option>
                      <option value="CNAE"> CNAE</option>
                    </select>
                  </div>
                  
                  {/* Nivel Académico */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Nivel Académico
                    </label>
                    <select 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${!formData.cargo ? 'opacity-60 cursor-not-allowed' : ''} ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.nivel_academico} 
                      onChange={(e) => { const nivelSeleccionado = e.target.value; const nivel = nivelesDisponibles.find(n => n.nivel === nivelSeleccionado); setFormData({ ...formData, nivel_academico: nivelSeleccionado, cod_cargo: nivel ? nivel.codigo : '' }); }} 
                      disabled={!formData.cargo}
                    >
                      <option value="">Seleccione un nivel</option>
                      {nivelesDisponibles.map((nivel) => (
                        <option key={nivel.id} value={nivel.nivel}>{nivel.nivel}</option>
                      ))}
                    </select>
                    {!formData.cargo && (
                      <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                        ⚠️ Primero seleccione un cargo
                      </p>
                    )}
                  </div>
                  
                  {/* Código de Cargo */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Código de Cargo
                    </label>
                    <div className="relative">
                      <input 
                        type="text" 
                        className={`w-full px-4 py-2.5 border-2 rounded-xl  ${isDark ? 'bg-gray-600 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'} cursor-not-allowed`} 
                        value={formData.cod_cargo} 
                        readOnly 
                        placeholder="Se autocompleta automáticamente"
                      />
                      <div className="absolute right-3 top-3 text-gray-400"></div>
                    </div>
                  </div>

                  {/* Turno */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Turno
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`}
                      value={formData.turno}
                      onChange={(e) => setFormData({...formData, turno: e.target.value})}
                    >
                      <option value="">Seleccione un turno</option>
                      <option value="Mañana"> Mañana</option>
                      <option value="Tarde"> Tarde</option>
                      <option value="Ambos"> Ambos</option>
                      <option value="Vig">Vigilante</option>
                    </select>
                  </div>

                  {/* Fecha Ingreso */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Fecha de Ingreso
                    </label>
                    <input 
                      type="date" 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.fecha_ingreso} 
                      onChange={(e) => setFormData({...formData, fecha_ingreso: e.target.value})} 
                    />
                  </div>

                  {/* Años de Servicio */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      📅 Años de Servicio
                    </label>
                    <div className="relative">
                      <input
                        type="text"
                        className={`w-full px-4 py-2.5 border-2 rounded-xl ${isDark ? 'bg-gray-600 text-gray-300 border-gray-600' : 'bg-gray-100 text-gray-600 border-gray-200'} cursor-not-allowed`}
                        value={formData.fecha_ingreso ? `${calcularAniosServicio(formData.fecha_ingreso)} años` : ''}
                        readOnly
                        placeholder="Se calcula automáticamente"
                      />
                    </div>
                  </div>

                  {/* Dependencia Actual */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      🏢 Dependencia Actual
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`}
                      value={formData.dependencia_actual}
                      onChange={(e) => setFormData({...formData, dependencia_actual: e.target.value})}
                    >
                      <option value="">Seleccione una dependencia</option>
                      {dependencias.map((dep) => (
                        <option key={dep.id} value={`${dep.codigo} - ${dep.nombre}`}>
                          {dep.codigo} - {dep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Dependencia Voucher */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                      📄 Dependencia Voucher
                    </label>
                    <select
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`}
                      value={formData.dependencia_voucher}
                      onChange={(e) => setFormData({...formData, dependencia_voucher: e.target.value})}
                    >
                      <option value="">Seleccione una dependencia</option>
                      {dependencias.map((dep) => (
                        <option key={dep.id} value={`${dep.codigo} - ${dep.nombre}`}>
                          {dep.codigo} - {dep.nombre}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Estatus */}
                  <div className="group">
                    <label className={`block text-sm font-semibold mb-2 transition-all group-focus-within:text-blue-500 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
                       Estatus
                    </label>
                    <select 
                      className={`w-full px-4 py-2.5 border-2 rounded-xl focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition-all outline-none ${isDark ? 'bg-gray-700 text-white border-gray-600 focus:bg-gray-600' : 'bg-white text-gray-800 border-gray-200 focus:bg-gray-50'}`} 
                      value={formData.estatus} 
                      onChange={(e) => setFormData({...formData, estatus: e.target.value})}
                    >
                      <option value="Activo">🟢 Activo</option>
                      <option value="Inactivo">🔴 Inactivo</option>
                      <option value="Jubilado">⚪ Jubilado</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* BOTONES DE ACCIÓN */}
              <div className="flex gap-4 pt-6 border-t-2 border-gray-200 dark:border-gray-700">
                <button 
                  type="submit" 
                  className="flex-1 bg-gradient-to-r from-green-500 to-emerald-600 text-white py-3 rounded-xl font-bold hover:from-green-600 hover:to-emerald-700 transition-all duration-200 shadow-lg hover:shadow-xl flex items-center justify-center gap-2 transform hover:scale-[1.02]"
                >
                  {editingId ? 'Actualizar Empleado' : 'Guardar Empleado'}
                </button>
                <button 
                  type="button" 
                  onClick={closeModal} 
                  className="flex-1 bg-gray-200 text-gray-700 py-3 rounded-xl font-bold hover:bg-gray-300 transition-all duration-200 dark:bg-gray-700 dark:text-white dark:hover:bg-gray-600 flex items-center justify-center gap-2"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};

// ============================================
// COMPONENTE GESTIÓN DE USUARIOS
// ============================================
const GestionUsuarios = () => {
  const [usuarios, setUsuarios] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [usuarioAEliminar, setUsuarioAEliminar] = useState<number | null>(null);
  const [formData, setFormData] = useState({
  cedula: '',
  cedulaError: '',
  email: '',
  emailError: '',
  nombre: '',
  nombreError: '',
  usuario: '',
  password: '',
  passwordError: '',
  rol: 'admin'
});
  
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  const fetchUsuarios = async () => {
    try {
      // ✅ CAMBIADO
      const response = await api.get('/api/usuarios');
      setUsuarios(response.data.data);
    } catch (error) { console.error(error);
    } finally { setLoading(false); }
  };

  useEffect(() => { fetchUsuarios(); }, []);

  const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  try {
    if (editingId) {
      await api.put(`/api/usuarios/${editingId}`, formData);
      toast.success('Usuario actualizado');
    } else {
      await api.post('/api/usuarios', formData);
      toast.success('Usuario creado');
    }
    setShowModal(false);
    setEditingId(null);
    setFormData({
      cedula: '',
      cedulaError: '',
      email: '',
      emailError: '',
      nombre: '',
      nombreError: '',
      usuario: '',
      password: '',
      passwordError: '',
      rol: 'admin'
    });
    fetchUsuarios();
  } catch (error) {
    toast.error('Error al guardar');
  }
};

  const handleEdit = (user: any) => {
  setEditingId(user.id);
  setFormData({
    cedula: user.cedula || '',
    cedulaError: '',      
    email: user.email || '',
    emailError: '',        
    nombre: user.nombre,
    nombreError: '',       
    usuario: user.usuario,
    password: '',
    passwordError: '',     
    rol: user.rol
  });
  setShowModal(true);
};

  const confirmDelete = async () => {
    if (usuarioAEliminar) {
      try { 
        // ✅ CAMBIADO
        await api.delete(`/api/usuarios/${usuarioAEliminar}`); 
        toast.success('Usuario eliminado');
        fetchUsuarios(); 
      } catch (error) { 
        toast.error('Error al eliminar'); 
      } finally {
        setShowConfirmModal(false);
        setUsuarioAEliminar(null);
      }
    }
  };

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setUsuarioAEliminar(null);
  };

  const handleDelete = (id: number) => {
    setUsuarioAEliminar(id);
    setShowConfirmModal(true);
  };

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Listado de Usuarios</h2>
<button 
  onClick={() => { 
    setShowModal(true); 
    setEditingId(null); 
    setFormData({ 
      cedula: '', 
      cedulaError: '',    
      email: '', 
      emailError: '',      
      nombre: '', 
      nombreError: '',     
      usuario: '', 
      password: '', 
      passwordError: '',   
      rol: 'admin' 
    }); 
  }} 
  className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
>
  + Nuevo Usuario
</button>      </div>

      <div className="overflow-x-auto rounded-xl">
        <table className={`min-w-full rounded-xl overflow-hidden ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
  <thead className={`${isDark ? 'bg-gradient-to-r from-gray-700 to-gray-600' : 'bg-gradient-to-r from-gray-800 to-gray-700'} text-white`}>
    <tr>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">#</th>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Cédula</th>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Email</th>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Nombre</th>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Usuario</th>
      <th className="p-3 text-left whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Rol</th>
      <th className="p-3 text-center whitespace-nowrap text-xs font-semibold uppercase tracking-wider">Acciones</th>
    </tr>
  </thead>
  <tbody>
    {usuarios.length === 0 ? (
      <tr>
        <td colSpan={7} className={`p-8 text-center ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No hay usuarios registrados
        </td>
      </tr>
    ) : (
      usuarios.map((user: any, index: number) => (
        <tr 
          key={user.id} 
          className={`border-b transition-colors duration-150 ${
            isDark 
              ? 'border-gray-700 hover:bg-gray-700/50' 
              : 'border-gray-200 hover:bg-blue-50/30'
          }`}
        >
          <td className={`p-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {index + 1}
          </td>
          <td className={`p-3 whitespace-nowrap text-sm font-mono ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {user.cedula || '-'}
          </td>
          <td className={`p-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            {user.email || '-'}
          </td>
          <td className={`p-3 whitespace-nowrap text-sm font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
            {user.nombre}
          </td>
          <td className={`p-3 whitespace-nowrap text-sm ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
            <span className={`px-2 py-0.5 rounded text-xs font-mono ${isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-100 text-gray-600'}`}>
              {user.usuario}
            </span>
          </td>
          <td className="p-3 whitespace-nowrap">
            <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${
              user.rol === 'superadmin' 
                ? 'bg-purple-300 text-purble-700 dark:bg-purple-900/30 dark:text-purple-500' 
                : 'bg-blue-300 text-blue-300 dark:bg-blue-900/30 dark:text-blue-500'
            }`}>
              {user.rol === 'superadmin' ? 'Super Admin' : 'Admin'}
            </span>
          </td>
          <td className="p-3 whitespace-nowrap">
            <div className="flex items-center justify-center gap-1.5">
              <button 
                onClick={() => handleEdit(user)} 
                className="bg-yellow-500 hover:bg-yellow-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:shadow-md"
              >
                Editar
              </button>
              <button 
                onClick={() => handleDelete(user.id)} 
                className="bg-red-500 hover:bg-red-600 text-white px-3 py-1 rounded text-xs font-medium transition-all duration-200 hover:shadow-md"
              >
                Eliminar
              </button>
            </div>
          </td>
        </tr>
      ))
    )}
  </tbody>
</table>
      </div>

      {showConfirmModal && (
        <div className="fixed inset-0 z-[60] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={cancelDelete}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="text-center">
              <div className="text-5xl mb-4">⚠️</div>
              <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>¿Eliminar usuario?</h3>
              <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Esta acción no se puede deshacer.</p>
              <div className="flex gap-3">
                <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Eliminar</button>
                <button onClick={cancelDelete} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancelar</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {showModal && ReactDOM.createPortal(
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={() => setShowModal(false)}></div>
          <div className={`relative rounded-2xl shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className="relative bg-gradient-to-r from-blue-600 to-blue-700 px-6 py-4 rounded-t-2xl">
              <h3 className="text-xl font-bold text-white">{editingId ? '✏️ Editar Usuario' : '➕ Nuevo Usuario'}</h3>
              <button 
                onClick={() => setShowModal(false)} 
                className="absolute top-3 right-3 w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110 hover:rotate-90"
              >
                ✖
              </button>
            </div>
            <form onSubmit={handleSubmit} className="p-6 space-y-4">
              <div>
  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
    Cédula <span className="text-red-500">*</span>
  </label>
  <input 
    type="text" 
    inputMode="numeric"
    className={`w-full p-2 border rounded ${
      isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
    }`} 
    value={formData.cedula} 
    onChange={(e) => {
      // Solo números, máximo 9 dígitos
      const soloNumeros = e.target.value.replace(/\D/g, '').slice(0, 9);
      setFormData({...formData, cedula: soloNumeros});
    }}
    placeholder="Ej: 28176143"
    maxLength={9}
    required
  />
  <p className="text-gray-400 text-xs mt-1">Solo números, entre 7 y 9 dígitos</p>
</div>
              <div>
  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
    Correo Electrónico <span className="text-red-500">*</span>
  </label>
  <input 
    type="email" 
    className={`w-full p-2 border rounded ${
      formData.emailError 
        ? 'border-red-500' 
        : isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
    }`} 
    value={formData.email} 
    onChange={(e) => {
      const email = e.target.value;
      // Validar formato de email con regex
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      const emailError = email && !emailRegex.test(email) 
        ? 'Ingresa un correo electrónico válido (ej: usuario@dominio.com)' 
        : '';
      setFormData({
        ...formData, 
        email: email,
        emailError: emailError
      });
    }}
    placeholder="ejemplo@correo.com"
    required 
  />
  {formData.emailError && (
    <p className="text-red-500 text-sm mt-1">{formData.emailError}</p>
  )}
  <p className="text-gray-400 text-xs mt-1">Formato: usuario@dominio.com</p>
</div>
              <div>
  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
    Nombre completo <span className="text-red-500">*</span>
  </label>
  <input 
    type="text" 
    className={`w-full p-2 border rounded ${
      isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
    }`} 
    value={formData.nombre} 
    onChange={(e) => {
      // Solo letras, espacios y acentos
      const soloLetras = e.target.value.replace(/[^a-zA-ZáéíóúÁÉÍÓÚñÑ\s]/g, '');
      setFormData({...formData, nombre: soloLetras});
    }}
    placeholder="Ej: Juan Pérez"
    required 
  />
</div>
              <div>
  <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>
    Contraseña {!editingId && <span className="text-red-500">*</span>}
  </label>
  <input 
    type="password" 
    className={`w-full p-2 border rounded focus:ring-2 focus:ring-blue-500 outline-none transition ${
      formData.passwordError 
        ? 'border-red-500' 
        : isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'
    }`} 
    value={formData.password} 
    onChange={(e) => {
      const password = e.target.value;
      const passwordError = password.length > 0 && password.length < 6 
        ? 'La contraseña debe tener al menos 6 caracteres' 
        : '';
      setFormData({
        ...formData, 
        password: password,
        passwordError: passwordError
      });
    }}
    required={!editingId}
    placeholder={editingId ? 'Dejar vacío para mantener' : 'Mínimo 6 caracteres'}
    minLength={6}
  />
  {formData.passwordError && (
    <p className="text-red-500 text-sm mt-1">{formData.passwordError}</p>
  )}
  {!editingId && (
    <p className="text-gray-400 text-xs mt-1">Mínimo 6 caracteres</p>
  )}
</div>
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Rol</label>
                <select className={`w-full p-2 border rounded ${isDark ? 'bg-gray-700 text-white border-gray-600' : 'bg-white text-gray-800 border-gray-300'}`} value={formData.rol} onChange={(e) => setFormData({...formData, rol: e.target.value})}>
                  <option value="admin">Administrador</option>
                  <option value="superadmin">Super Administrador</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">{editingId ? 'Actualizar' : 'Guardar'}</button>
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

// ============================================
// COMPONENTE PRINCIPAL DE CONFIGURACIÓN
// ============================================
const Configuracion = () => {
  const [modo, setModo] = useState<'menu' | 'personal' | 'usuarios' | 'niveles' | 'dependencias'>('menu');
  const userRole = sessionStorage.getItem('userRole');
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  if (userRole !== 'superadmin') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'} flex items-center justify-center`}>
        <div className="text-center p-8">
          <h1 className="text-2xl font-bold text-red-500">Acceso Denegado</h1>
          <p className={`mt-2 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Solo el Super Administrador puede acceder a esta sección.</p>
        </div>
      </div>
    );
  }

  if (modo === 'personal') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setModo('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>← Volver al menú</button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>👥 Gestión de Personal</h1>
          </div>
          <GestionPersonal />
        </div>
      </div>
    );
  }

  if (modo === 'usuarios') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setModo('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>← Volver al menú</button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>👤 Gestión de Usuarios</h1>
          </div>
          <GestionUsuarios />
        </div>
      </div>
    );
  }

  if (modo === 'niveles') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setModo('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>← Volver al menú</button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>📚 Gestión de Niveles Académicos</h1>
          </div>
          <GestionNiveles />
        </div>
      </div>
    );
  }

  if (modo === 'dependencias') {
    return (
      <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
        <div className="p-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => setModo('menu')} className={`flex items-center gap-2 px-4 py-2 rounded-lg transition ${isDark ? 'bg-gray-700 text-white hover:bg-gray-600' : 'bg-gray-100 hover:bg-gray-200'}`}>← Volver al menú</button>
            <h1 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>🏢 Gestión de Dependencias</h1>
          </div>
          <GestionDependencias />
        </div>
      </div>
    );
  }

  return (
    <div className={`min-h-screen ${isDark ? 'bg-gray-900' : 'bg-gray-100'}`}>
      <div className="p-6">
        <div className="title-enter">
          <h1 className={`text-2xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>⚙️ Configuración del Sistema</h1>
          <p className={`${isDark ? 'text-gray-400' : 'text-gray-500'} mb-8`}>Selecciona qué módulo deseas configurar</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
          <div 
            onClick={() => setModo('personal')} 
            className={`rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-blue-500 ${isDark ? 'bg-gray-800' : 'bg-white'} card-left-enter`}
          >
            <div className="text-5xl mb-4">👥</div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Gestión de Personal</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Registrar, editar y gestionar empleados. Control de activos, inactivos y jubilados.</p>
          </div>

          <div 
            onClick={() => setModo('usuarios')} 
            className={`rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-green-500 ${isDark ? 'bg-gray-800' : 'bg-white'} card-left-enter`}
            style={{ animationDelay: '100ms' }}
          >
            <div className="text-5xl mb-4">👤</div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Gestión de Usuarios</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Crear, editar y eliminar usuarios del sistema. Asignar roles.</p>
          </div>

          <div 
            onClick={() => setModo('niveles')} 
            className={`rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-purple-500 ${isDark ? 'bg-gray-800' : 'bg-white'} card-left-enter`}
            style={{ animationDelay: '200ms' }}
          >
            <div className="text-5xl mb-4">📚</div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Niveles Académicos</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestionar niveles y códigos por cargo (Docente, Administrativo, etc.).</p>
          </div>

          <div 
            onClick={() => setModo('dependencias')} 
            className={`rounded-xl shadow-lg p-6 cursor-pointer transition-all duration-300 hover:scale-105 hover:shadow-xl border-t-4 border-t-cyan-500 ${isDark ? 'bg-gray-800' : 'bg-white'} card-left-enter`}
            style={{ animationDelay: '300ms' }}
          >
            <div className="text-5xl mb-4">🏢</div>
            <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>Dependencias</h3>
            <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Gestionar códigos y nombres de dependencias (Vicente Peña, Dirección, etc.).</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Configuracion;