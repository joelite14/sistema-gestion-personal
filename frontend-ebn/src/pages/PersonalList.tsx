import { useEffect, useState, useRef } from 'react';
import axios from 'axios';
import { api } from '../services/api'; // 👈 NUEVA IMPORTACIÓN
import { useTheme } from '../context/ThemeContext';
import toast from 'react-hot-toast';
import ReactDOM from 'react-dom';
import { API_URL } from '../services/api';


const PersonalList = () => {
  const [personal, setPersonal] = useState([]);
  const [filteredPersonal, setFilteredPersonal] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filtroCargo, setFiltroCargo] = useState('todos');
  const [filtroEstatus, setFiltroEstatus] = useState('todos');
  const [filtroDocumentos, setFiltroDocumentos] = useState('todos');
  const [showPhotoMenu, setShowPhotoMenu] = useState(false);
  const [uploadingFoto, setUploadingFoto] = useState(false);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [showModal, setShowModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [documentoAEliminar, setDocumentoAEliminar] = useState<number | null>(null);
  const [uploadForm, setUploadForm] = useState({ tipo_documento: '', archivo: null as File | null });
  const [previewFoto, setPreviewFoto] = useState<string | null>(null);
  const [showPreviewModal, setShowPreviewModal] = useState(false);
  const [fotoSeleccionada, setFotoSeleccionada] = useState<File | null>(null);
  const [showFotoAmpliada, setShowFotoAmpliada] = useState(false);
  const [mostrarHistorial, setMostrarHistorial] = useState(false);
const [historial, setHistorial] = useState<any[]>([]);
const [cargandoHistorial, setCargandoHistorial] = useState(false);

  const [paginaActual, setPaginaActual] = useState(1);
  const [itemsPorPagina, setItemsPorPagina] = useState(12);
  const [vista, setVista] = useState<'tarjetas' | 'tabla'>('tarjetas');
  const [ordenPor, setOrdenPor] = useState<'cedula' | 'nombre'>('nombre');
  const [ordenDireccion, setOrdenDireccion] = useState<'asc' | 'desc'>('asc');
  
  const [estadoReal, setEstadoReal] = useState<{ estado: string; fecha_fin: string | null } | null>(null);
  const { theme } = useTheme();
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
const isSuperAdmin = user.rol === 'superadmin' || user.rol === 'admin';
  const isDark = theme === 'dark';

    const inputCedulaRef = useRef<HTMLInputElement>(null);
  const inputRifRef = useRef<HTMLInputElement>(null);
  const inputUbicacionRef = useRef<HTMLInputElement>(null);
  const inputPagoRef = useRef<HTMLInputElement>(null);

  // ============================================
// 📋 FUNCIÓN PARA VERIFICAR DOCUMENTOS
// ============================================
const verificarDocumentos = (emp: any) => {
  const docsObligatorios = [
    { nombre: 'Cédula (imagen)', campo: 'cedula_imagen', esArchivo: true },
    { nombre: 'RIF', campo: 'rif', esArchivo: true },
    { nombre: 'Constancia de Ubicación', campo: 'constancia_ubicacion', esArchivo: true },
    { nombre: 'Constancia de Pago', campo: 'constancia_pago', esArchivo: true }
  ];
  
  // 2. Verificar cuáles tiene subidos
  const docsSubidos = docsObligatorios.filter(doc => {
    const valor = emp[doc.campo];
    return valor !== null && valor !== undefined && valor !== '';
  });
  
  // 3. Calcular estado
  const total = docsObligatorios.length;
  const subidos = docsSubidos.length;
  const completos = subidos === total;
  
  // 4. Retornar estado
  return {
    completos,
    subidos,
    total,
    docsSubidos: docsSubidos.map(d => d.nombre),
    docsFaltantes: docsObligatorios
      .filter(doc => !docsSubidos.includes(doc))
      .map(d => d.nombre)
  };
};

const contarIncompletos = () => {
  return personal.filter((emp: any) => {
    const estado = verificarDocumentos(emp);
    return !estado.completos;
  }).length;
};

  // Función para calcular edad automáticamente desde fecha de nacimiento
  const calcularEdad = (fechaNacimiento: string | Date) => {
    if (!fechaNacimiento) return null;
    const hoy = new Date();
    const nacimiento = new Date(fechaNacimiento);
    let edad = hoy.getFullYear() - nacimiento.getFullYear();
    const mes = hoy.getMonth() - nacimiento.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < nacimiento.getDate())) {
      edad--;
    }
    return edad;
  };

  // 👈 NUEVO: Función para calcular años de servicio
  const calcularAniosServicio = (fechaIngreso: string) => {
    if (!fechaIngreso) return 0;
    const hoy = new Date();
    const ingreso = new Date(fechaIngreso);
    let anios = hoy.getFullYear() - ingreso.getFullYear();
    const mes = hoy.getMonth() - ingreso.getMonth();
    if (mes < 0 || (mes === 0 && hoy.getDate() < ingreso.getDate())) {
      anios--;
    }
    return anios;
  };

  // Función para obtener el estado real del empleado (prioriza Permiso > Reposo > Estatus)
  const getEstadoReal = (emp: any) => {
    if (emp.en_permiso) return { texto: '📋 Permiso', color: 'bg-yellow-500', icono: '🟡' };
    if (emp.en_reposo) return { texto: '🔵 Reposo', color: 'bg-blue-500', icono: '🔵' };
    return { texto: emp.estatus, color: getEstatusColor(emp.estatus), icono: getEstatusIcono(emp.estatus) };
  };

  const fetchEstadoReal = async (personalId: number) => {
    try {
      // ✅ CAMBIADO
      const response = await api.get(`/api/personal/${personalId}/estado-real`);
      setEstadoReal(response.data.data);
    } catch (error) {
      console.error('Error al obtener estado real:', error);
      setEstadoReal({ estado: 'Activo', fecha_fin: null });
    }
  };

  // 📸 SUBIR FOTO DESDE EL EXPEDIENTE
const handleUploadFotoExpediente = async (file: File) => {
  if (!selectedEmployee) return;
  
  setUploadingFoto(true);
  const formData = new FormData();
  formData.append('foto', file);
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  formData.append('usuario_id', user.id || '1');
  formData.append('usuario_nombre', user.nombre || 'Administrador');

  try {
    // ✅ CAMBIADO: Usar api.post con FormData
    await api.post(
      `/api/personal/${selectedEmployee.id_personal}/foto`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    toast.success('Foto actualizada exitosamente');
    await fetchPersonal();
    // Actualizar el empleado seleccionado
    const updatedEmp = personal.find((e: any) => e.id_personal === selectedEmployee.id_personal);
    if (updatedEmp) setSelectedEmployee(updatedEmp);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al actualizar la foto');
  } finally {
    setUploadingFoto(false);
  }
};

  const cargos = ['todos', 'Docente', 'Administrativo', 'Obrero', 'Vigilante', 'CNAE'];
  const estatuses = ['todos', 'Activo', 'Inactivo', 'Permiso', 'Jubilado', 'Reposo'];

  useEffect(() => {
    fetchPersonal();
  }, []);

  const ordenarPersonal = (lista: any[]) => {
  return [...lista].sort((a, b) => {
    let valorA, valorB;
    
    if (ordenPor === 'cedula') {
      // 🔥 Convertir a número para ordenar correctamente
      valorA = parseInt(a.cedula) || 0;
      valorB = parseInt(b.cedula) || 0;
    } else {
      valorA = `${a.nombres} ${a.apellidos}`.toLowerCase();
      valorB = `${b.nombres} ${b.apellidos}`.toLowerCase();
    }
    
    if (ordenDireccion === 'asc') {
      return valorA > valorB ? 1 : -1;
    } else {
      return valorA < valorB ? 1 : -1;
    }
  });
};

  useEffect(() => {
  let filtered = [...personal];
  
  if (searchTerm !== '') {
    filtered = filtered.filter((emp: any) =>
      emp.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.apellidos?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      emp.cargo?.toLowerCase().includes(searchTerm.toLowerCase())
    );
  }

  
  
  if (filtroCargo !== 'todos') {
    filtered = filtered.filter((emp: any) => 
      emp.cargo?.toLowerCase() === filtroCargo.toLowerCase()
    );
  }
  
  if (filtroEstatus !== 'todos') {
    if (filtroEstatus === 'Reposo') {
      filtered = filtered.filter((emp: any) => emp.en_reposo === 1 || emp.en_reposo === true);
    } else if (filtroEstatus === 'Permiso') {
      filtered = filtered.filter((emp: any) => emp.en_permiso === 1 || emp.en_permiso === true);
    } else {
      filtered = filtered.filter((emp: any) => emp.estatus === filtroEstatus);
    }
  }

  if (filtroDocumentos === 'incompletos') {
  filtered = filtered.filter((emp: any) => {
    const estado = verificarDocumentos(emp);
    return !estado.completos;
  });
}
  
  filtered = ordenarPersonal(filtered);
  
  setFilteredPersonal(filtered);
  setPaginaActual(1);
}, [searchTerm, filtroCargo, filtroEstatus, personal, ordenPor, ordenDireccion, filtroDocumentos]);

  const limpiarFiltros = () => {
    setSearchTerm('');
    setFiltroCargo('todos');
    setFiltroEstatus('todos');
    setOrdenPor('nombre');
    setOrdenDireccion('asc');
  };

  const indexUltimoItem = paginaActual * itemsPorPagina;
  const indexPrimerItem = indexUltimoItem - itemsPorPagina;
  const itemsActuales = filteredPersonal.slice(indexPrimerItem, indexUltimoItem);
  const totalPaginas = Math.ceil(filteredPersonal.length / itemsPorPagina);

  const handleCambiarPagina = (pagina: number) => {
    setPaginaActual(pagina);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const fetchPersonal = async () => {
  try {
    // ✅ CAMBIADO
    const response = await api.get('/api/personal');
    console.log('📊 Primer empleado:', response.data.data[0]);
    setPersonal(response.data.data);
    setFilteredPersonal(response.data.data);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al cargar el personal');
  } finally {
    // 🔥 ESPERAR 1.5 SEGUNDOS ANTES DE OCULTAR EL LOADING
    setTimeout(() => {
      setLoading(false);
    }, 300);
  }
};

  const fetchDocumentos = async (personalId: number) => {
    try {
      // ✅ CAMBIADO
      const response = await api.get(`/api/personal/${personalId}/documentos`);
      setDocumentos(response.data.data);
    } catch (error) {
      console.error('Error al cargar documentos:', error);
      setDocumentos([]);
    }
  };

  // 📜 OBTENER HISTORIAL DEL EMPLEADO
const fetchHistorial = async (personalId: number) => {
  console.log('📜 Obteniendo historial para empleado ID:', personalId); // 👈 LOG
  
  setCargandoHistorial(true);
  try {
    // ✅ CAMBIADO
    const response = await api.get(`/api/personal/${personalId}/historial`);
    console.log('📜 Respuesta del servidor:', response.data); // 👈 LOG
    setHistorial(response.data.data);
  } catch (error) {
    console.error('❌ Error al cargar historial:', error);
    toast.error('Error al cargar el historial');
  } finally {
    setCargandoHistorial(false);
  }
};

  const openModal = async (emp: any) => {
  console.log('👤 Empleado seleccionado:', emp);
  console.log('🕒 Turno:', emp.turno);
  console.log('🏢 Dependencia Actual:', emp.dependencia_actual);
  console.log('📄 Dependencia Voucher:', emp.dependencia_voucher);
  
  setSelectedEmployee(emp);
  setMostrarHistorial(false); // 👈 AGREGAR
  setHistorial([]); // 👈 AGREGAR
  await fetchDocumentos(emp.id_personal);
  await fetchEstadoReal(emp.id_personal);
  setShowModal(true);
};

  const closeModal = () => {
    setShowModal(false);
    setSelectedEmployee(null);
    setDocumentos([]);
    setEstadoReal(null);
  };

  const handleUpload = async (e: React.FormEvent) => {
  e.preventDefault();
  if (!uploadForm.archivo) {
    toast.error('Seleccione un archivo');
    return;
  }

  const formData = new FormData();
  formData.append('tipo_documento', uploadForm.tipo_documento);
  formData.append('archivo', uploadForm.archivo);
  
  // 🔥 Obtener usuario desde sessionStorage
  const user = JSON.parse(sessionStorage.getItem('user') || '{}');
  const userName = user.nombre || 'Administrador';
  const userId = user.id || 1;
  
  formData.append('usuario_id', userId.toString());
  formData.append('usuario_nombre', userName);

  try {
    // ✅ CAMBIADO: Usar api.post con FormData
    await api.post(
      `/api/personal/${selectedEmployee?.id_personal}/documentos`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    );
    toast.success('Documento subido exitosamente');
    setShowUploadModal(false);
    setUploadForm({ tipo_documento: '', archivo: null });
    fetchDocumentos(selectedEmployee!.id_personal);
  } catch (error) {
    console.error('Error:', error);
    toast.error('Error al subir documento');
  }
};

  const handleDeleteDocumento = (id: number) => {
    setDocumentoAEliminar(id);
    setShowConfirmModal(true);
  };

  const confirmDelete = async () => {
  if (documentoAEliminar) {
    try {
      // Obtener información del documento
      const docInfo = documentos.find(doc => doc.id === documentoAEliminar);
      const tipoDocumento = docInfo?.tipo_documento || 'Documento';

      // 🔥 Obtener el usuario desde sessionStorage
      const user = JSON.parse(sessionStorage.getItem('user') || '{}');
      const userName = user.nombre || 'Administrador';
      const userId = user.id || 1;

      // ✅ CAMBIADO: Usar api.delete con data en el body
      await api.delete(`/api/documentos/${documentoAEliminar}`, {
        data: {
          usuario_id: userId,
          usuario_nombre: userName
        }
      });

      toast.success('📄 Documento eliminado exitosamente');
      fetchDocumentos(selectedEmployee!.id_personal);
      
      // 🔥 También registrar en bitácora localmente (opcional)
      // await axios.post(`http://localhost:3000/api/bitacora`, {
      //   usuario_id: userId,
      //   usuario_nombre: userName,
      //   accion: `Eliminó ${tipoDocumento} del empleado ${selectedEmployee?.nombres} ${selectedEmployee?.apellidos}`,
      //   modulo: 'Expedientes',
      //   registro_id: selectedEmployee?.id_personal
      // });

    } catch (error) {
      console.error('Error:', error);
      toast.error('Error al eliminar el documento');
    } finally {
      setShowConfirmModal(false);
      setDocumentoAEliminar(null);
    }
  }
};

  const cancelDelete = () => {
    setShowConfirmModal(false);
    setDocumentoAEliminar(null);
  };

  const getEstatusColor = (estatus: string) => {
    switch(estatus) {
      case 'Activo': return 'bg-green-500';
      case 'Inactivo': return 'bg-red-500';
      case 'Permiso': return 'bg-yellow-500';
      case 'Jubilado': return 'bg-gray-500';
      case 'Reposo': return 'bg-blue-500';
      default: return 'bg-gray-500';
    }
  };

  const getEstatusIcono = (estatus: string) => {
    switch(estatus) {
      case 'Activo': return '🟢';
      case 'Inactivo': return '🔴';
      case 'Permiso': return '🟡';
      case 'Jubilado': return '⚪';
      case 'Reposo': return '🔵';
      default: return '⚪';
    }
  };

  const getCargoColor = (cargo: string) => {
    switch(cargo) {
      case 'Docente': return 'bg-green-500';
      case 'Administrativo': return 'bg-blue-500';
      case 'Obrero': return 'bg-orange-500';
      case 'Vigilante': return 'bg-purple-500';
      case 'CNAE': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const renderTarjetas = () => (
  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
    {itemsActuales.map((emp: any, index: number) => {
      const estado = getEstadoReal(emp);
      // 🔥 Delay escalonado: 80ms entre cada tarjeta
      const delay = Math.min(index * 80, 720);
      const delayClass = `delay-${delay}`;
      
      return (
        <div
          key={emp.id_personal}
          onClick={() => openModal(emp)}
          className={`rounded-xl shadow-lg overflow-hidden cursor-pointer transition-all duration-500 hover:scale-105 hover:shadow-xl ${isDark ? 'bg-gray-800' : 'bg-white'} card-enter ${delayClass}`}
        >
          <div className={`h-2 ${getCargoColor(emp.cargo)}`} />
          <div className="p-5">
            <div className="flex items-center gap-4 mb-4">
              <div className="w-16 h-16 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center shadow-md overflow-hidden">
                {emp.foto_url ? (
                  <img 
                    src={`${API_URL}${emp.foto_url}?t=${new Date().getTime()}`}
                    alt="Foto"
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span className="text-white text-xl font-bold">
                    {emp.nombres?.charAt(0).toUpperCase()}{emp.apellidos?.charAt(0).toUpperCase()}
                  </span>
                )}
              </div>
              <div className="flex-1">
                <h3 className={`font-bold text-lg ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {emp.nombres} {emp.apellidos}
                </h3>
                <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  📌 {emp.cargo} • {estado.texto}
                </p>
              </div>
            </div>
            <div className="space-y-2 mb-4">
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">🆔</span>
                <span className={isDark ? 'text-gray-300' : 'text-gray-600'}>{emp.cedula}</span>
              </div>
              <div className="flex items-center gap-2 text-sm">
                <span className="text-gray-400">📄</span>
                {(() => {
                  const estado = verificarDocumentos(emp);
                  return (
                    <span className={`font-medium px-2 py-0.5 rounded-full text-xs ${
                      estado.completos 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {estado.completos ? '🟢 COMPLETOS' : `🔴 INCOMPLETOS (${estado.subidos}/${estado.total})`}
                    </span>
                  );
                })()}
              </div>
            </div>
            <div className="flex justify-between items-center pt-3 border-t border-gray-200 dark:border-gray-700">
              <span className={`px-2 py-1 rounded-full text-white text-xs ${estado.color}`}>
                {estado.texto}
              </span>
              <button className="text-blue-500 hover:text-blue-600 text-sm font-medium">Ver expediente →</button>
            </div>
          </div>
        </div>
      );
    })}
  </div>
);

  const renderTabla = () => (
  <div className="overflow-x-auto rounded-xl">
    <table className={`min-w-full rounded-xl ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-800'} text-white`}>
        <tr>
          <th className="p-3 text-left">#</th>
          <th className="p-3 text-left">Foto</th>
          <th className="p-3 text-left whitespace-nowrap">Cédula</th>
          <th className="p-3 text-left">Nombres</th>
          <th className="p-3 text-left">Apellidos</th>
          <th className="p-3 text-left whitespace-nowrap">Cargo</th>
          <th className="p-3 text-left whitespace-nowrap">Docs</th>
          <th className="p-3 text-left whitespace-nowrap">Estatus</th>
        </tr>
      </thead>
      <tbody>
        {itemsActuales.map((emp: any, index: number) => {
          const estado = getEstadoReal(emp);
          const delay = Math.min(index * 60, 600);
          const delayClass = `delay-${delay}`;
          
          return (
            <tr 
              key={emp.id_personal}
              onClick={() => openModal(emp)}
              className={`border-b cursor-pointer transition-colors ${isDark ? 'border-gray-700 hover:bg-gray-700' : 'border-gray-200 hover:bg-gray-50'} row-enter ${delayClass}`}
            >
              <td className="p-3 text-center">{indexPrimerItem + index + 1}</td>
              <td className="p-3">
                <div className="w-8 h-8 rounded-full bg-gradient-to-r from-blue-500 to-purple-500 flex items-center justify-center overflow-hidden">
                  {emp.foto_url ? (
                    <img src={`${API_URL}${emp.foto_url}?t=${new Date().getTime()}`} alt="Foto" className="w-full h-full object-cover" />
                  ) : (
                    <span className="text-white text-xs font-bold">{emp.nombres?.charAt(0).toUpperCase()}</span>
                  )}
                </div>
              </td>
              <td className={`p-3 whitespace-nowrap ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.cedula}</td>
              <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.nombres}</td>
              <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.apellidos}</td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-xs whitespace-nowrap ${isDark ? 'bg-blue-900 text-blue-200' : 'bg-blue-100 text-blue-800'}`}>
                  {emp.cargo}
                </span>
              </td>
              <td className="p-3">
                {(() => {
                  const estadoDocs = verificarDocumentos(emp);
                  return (
                    <span className={`px-2 py-1 rounded-full text-xs font-medium whitespace-nowrap ${
                      estadoDocs.completos 
                        ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' 
                        : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300'
                    }`}>
                      {estadoDocs.completos ? '✅' : '❌'} {estadoDocs.subidos}/{estadoDocs.total}
                    </span>
                  );
                })()}
              </td>
              <td className="p-3">
                <span className={`px-2 py-1 rounded-full text-white text-xs whitespace-nowrap ${estado.color}`}>
                  {estado.texto}
                </span>
              </td>
            </tr>
          );
        })}
      </tbody>
    </table>
  </div>
);

  if (loading) {
  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-6">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 w-full max-w-6xl">
        {[1, 2, 3, 4].map((i) => (
          <div 
            key={i} 
            className={`rounded-xl p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}
            style={{ 
              animation: 'fadePulse 1.5s ease-in-out infinite',
              animationDelay: `${i * 0.15}s`
            }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-full ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}></div>
              <div className="flex-1">
                <div className={`h-4 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-3/4 mb-2`}></div>
                <div className={`h-3 ${isDark ? 'bg-gray-700' : 'bg-gray-200'} rounded w-1/2`}></div>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6 flex-wrap gap-3">
        <h2 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>👥 Listado de Personal</h2>
        <div className="flex items-center gap-3">
          <div className={`flex rounded-lg overflow-hidden border ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
            <button onClick={() => setVista('tarjetas')} className={`px-3 py-1.5 text-sm transition-all ${vista === 'tarjetas' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>🃏 Tarjetas</button>
            <button onClick={() => setVista('tabla')} className={`px-3 py-1.5 text-sm transition-all ${vista === 'tabla' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-white text-gray-600 hover:bg-gray-50'}`}>📋 Tabla</button>
          </div>
        </div>
      </div>

      <div className="mb-6">
        <div className="relative">
          <input
            type="text"
            placeholder=" Buscar por cédula, nombre o apellido..."
            className={`w-full p-3 pl-10 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-300'}`}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
          <span className="absolute left-3 top-3 text-gray-400">🔍</span>
        </div>
        
        <div className="mt-3">
          <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Filtrar por cargo:</p>
          <div className="flex flex-wrap gap-2">
            {cargos.map((cargo) => (
              <button
                key={cargo}
                onClick={() => setFiltroCargo(cargo)}
                className={`px-3 py-1.5 rounded-full text-sm ${filtroCargo === cargo ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {cargo === 'todos' ? '📋 Todos' : cargo}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
          <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Filtrar por estatus:</p>
          <div className="flex flex-wrap gap-2">
            {estatuses.map((estatus) => (
              <button
                key={estatus}
                onClick={() => setFiltroEstatus(estatus)}
                className={`px-3 py-1.5 rounded-full text-sm ${filtroEstatus === estatus ? 'bg-blue-600 text-white shadow-md' : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
              >
                {estatus === 'todos' ? '📋 Todos' : estatus}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3">
  <p className={`text-xs mb-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Filtrar por documentos:</p>
  <div className="flex flex-wrap gap-2">
    <button
      onClick={() => setFiltroDocumentos('todos')}
      className={`px-3 py-1.5 rounded-full text-sm ${
        filtroDocumentos === 'todos' 
          ? 'bg-blue-600 text-white shadow-md' 
          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      📋 Todos
    </button>
    <button
      onClick={() => setFiltroDocumentos('incompletos')}
      className={`px-3 py-1.5 rounded-full text-sm ${
        filtroDocumentos === 'incompletos' 
          ? 'bg-red-500 text-white shadow-md' 
          : isDark ? 'bg-gray-700 text-gray-300 hover:bg-gray-600' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
      }`}
    >
      📄 INCOMPLETOS ({contarIncompletos()})
    </button>
  </div>
</div>

        {(searchTerm !== '' || filtroCargo !== 'todos' || filtroEstatus !== 'todos') && (
          <div className="mt-4">
            <button
              onClick={limpiarFiltros}
              className="flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium bg-red-500 text-white hover:bg-red-600"
            >
              🗑️ Limpiar filtros activos
            </button>
          </div>
        )}
      </div>

      <div className="flex justify-between items-center mb-4 flex-wrap gap-3">
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2">
            <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Ordenar por:</span>
            <div className="flex gap-2">
              <button
                onClick={() => {
                  setOrdenPor('nombre');
                  setOrdenDireccion(ordenPor === 'nombre' && ordenDireccion === 'asc' ? 'desc' : 'asc');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg ${ordenPor === 'nombre' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
              >
                Nombre {ordenPor === 'nombre' && (ordenDireccion === 'asc' ? '↑' : '↓')}
              </button>
              <button
                onClick={() => {
                  setOrdenPor('cedula');
                  setOrdenDireccion(ordenPor === 'cedula' && ordenDireccion === 'asc' ? 'desc' : 'asc');
                }}
                className={`px-3 py-1.5 text-sm rounded-lg ${ordenPor === 'cedula' ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-gray-300' : 'bg-gray-200 text-gray-700'}`}
              >
                Cédula {ordenPor === 'cedula' && (ordenDireccion === 'asc' ? '↑' : '↓')}
              </button>
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <span className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Mostrar:</span>
          <select value={itemsPorPagina} onChange={(e) => { setItemsPorPagina(Number(e.target.value)); setPaginaActual(1); }} className={`px-2 py-1 rounded border ${isDark ? 'bg-gray-800 text-white border-gray-700' : 'bg-white text-gray-800 border-gray-300'}`}>
            <option value={12}>12</option><option value={24}>24</option><option value={36}>36</option><option value={48}>48</option>
          </select>
        </div>
      </div>

      {itemsActuales.length === 0 ? (
        <div className={`text-center py-12 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          No se encontraron empleados con los filtros seleccionados
        </div>
      ) : (
        vista === 'tarjetas' ? renderTarjetas() : renderTabla()
      )}

      {totalPaginas > 1 && (
        <div className="flex justify-center items-center gap-2 mt-8">
          <button onClick={() => handleCambiarPagina(paginaActual - 1)} disabled={paginaActual === 1} className={`px-3 py-2 rounded-lg ${paginaActual === 1 ? 'opacity-50 cursor-not-allowed' : isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>← Anterior</button>
          <div className="flex gap-1">
            {Array.from({ length: Math.min(totalPaginas, 5) }, (_, i) => {
              let pagina; if (totalPaginas <= 5) pagina = i + 1; else if (paginaActual <= 3) pagina = i + 1; else if (paginaActual >= totalPaginas - 2) pagina = totalPaginas - 4 + i; else pagina = paginaActual - 2 + i;
              return <button key={pagina} onClick={() => handleCambiarPagina(pagina)} className={`w-10 h-10 rounded-lg ${paginaActual === pagina ? 'bg-blue-600 text-white' : isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>{pagina}</button>;
            })}
          </div>
          <button onClick={() => handleCambiarPagina(paginaActual + 1)} disabled={paginaActual === totalPaginas} className={`px-3 py-2 rounded-lg ${paginaActual === totalPaginas ? 'opacity-50 cursor-not-allowed' : isDark ? 'bg-gray-700 text-white' : 'bg-gray-200 text-gray-700'}`}>Siguiente →</button>
        </div>
      )}

    {/* MODAL DEL EXPEDIENTE */}
{showModal && selectedEmployee && ReactDOM.createPortal(
  (() => {
    const estado = estadoReal 
      ? { 
          texto: estadoReal.estado === 'Reposo' ? '🔵 Reposo' : estadoReal.estado === 'Permiso' ? '📋 Permiso' : estadoReal.estado, 
          color: estadoReal.estado === 'Reposo' ? 'bg-blue-500' : estadoReal.estado === 'Permiso' ? 'bg-yellow-500' : getEstatusColor(selectedEmployee.estatus),
          icono: ''
        }
      : getEstadoReal(selectedEmployee);
    
    return (
      <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-portal-enter">
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={closeModal}></div>
        <div className={`relative rounded-xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <div className="sticky top-0 z-10 bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-700 px-6 py-4 rounded-t-xl flex justify-between items-center">
  <div className="flex items-center gap-4">
    <h3 className="text-xl font-bold text-white">
      Perfil del Empleado
    </h3>
    {/* Botón de historial */}
    <button
      onClick={() => {
        if (!mostrarHistorial && selectedEmployee) {
          fetchHistorial(selectedEmployee.id_personal);
        }
        setMostrarHistorial(!mostrarHistorial);
      }}
      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition ${
        mostrarHistorial 
          ? 'bg-white/20 text-white' 
          : 'bg-white/10 text-white hover:bg-white/20'
      }`}
    >
      {mostrarHistorial ? '📋 Ver Datos' : '📜 Historial'}
    </button>
  </div>
  <button 
    onClick={closeModal} 
    className="w-8 h-8 rounded-full bg-white/20 hover:bg-white/30 transition-all duration-200 flex items-center justify-center text-white hover:scale-110"
  >
    ✖
  </button>
</div>
          <div className="p-6">
            {/* Foto y nombre */}
            <div className="flex items-center gap-6 mb-6">
              <div className="flex-shrink-0">
                <div 
                  className="w-28 h-28 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center shadow-lg overflow-hidden cursor-pointer hover:opacity-80 transition"
                  onClick={() => {
                    if (selectedEmployee.foto_url) {
                      setShowFotoAmpliada(true);
                    }
                  }}
                >
                  {selectedEmployee.foto_url ? (
                    <img 
                      src={`${API_URL}${selectedEmployee.foto_url}?t=${new Date().getTime()}`}
                      alt="Foto"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <span className="text-white text-4xl">
                      {selectedEmployee.nombres?.charAt(0)}{selectedEmployee.apellidos?.charAt(0)}
                    </span>
                  )}
                </div>
                <div className="mt-1 text-center">
                  <button
                    onClick={() => document.getElementById('input-foto-expediente')?.click()}
                    className="bg-blue-600 text-white text-xs px-3 py-1 rounded-full hover:bg-blue-700 transition whitespace-nowrap"
                    disabled={uploadingFoto}
                  >
                    {uploadingFoto ? '⏳' : '📷'} {uploadingFoto ? 'Subiendo...' : 'Cambiar Foto'}
                  </button>
                  <input
                    id="input-foto-expediente"
                    type="file"
                    className="hidden"
                    accept="image/jpeg,image/png,image/jpg"
                    onChange={(e) => {
                      const file = e.target.files?.[0];
                      if (file) {
                        const reader = new FileReader();
                        reader.onloadend = () => {
                          setPreviewFoto(reader.result as string);
                          setFotoSeleccionada(file);
                          setShowPreviewModal(true);
                        };
                        reader.readAsDataURL(file);
                      }
                      e.target.value = '';
                    }}
                  />
                </div>
              </div>
              <div>
                <h4 className={`text-2xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                  {selectedEmployee.nombres} {selectedEmployee.apellidos}
                </h4>
                <p className={isDark ? 'text-gray-400' : 'text-gray-500'}>
                  {selectedEmployee.cargo} • {estado.texto}
                </p>
              </div>
            </div>

            {/* Información Personal */}
            <div className="mb-6">
              <h5 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700'}`}>
                📋 Información Personal
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cédula</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.cedula}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Teléfono</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.telefono || 'No registrado'}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Nacimiento</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.fecha_nacimiento 
                      ? new Date(selectedEmployee.fecha_nacimiento).toLocaleDateString('es-ES', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric'
                        })
                      : 'No registrada'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Edad</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.edad 
                      ? `${selectedEmployee.edad} años`
                      : selectedEmployee.fecha_nacimiento 
                        ? `${calcularEdad(selectedEmployee.fecha_nacimiento)} años`
                        : 'No calculada'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estado Civil</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.estado_civil || 'No registrado'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Género</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.genero || 'No registrado'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dirección</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.direccion || 'No registrada'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Correo Electrónico</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.correo || 'No registrado'}</p>
                </div>
              </div>
            </div>

            {/* Información Laboral */}
            <div className="mb-6">
              <h5 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700'}`}>
                💼 Información Laboral
              </h5>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cargo</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.cargo}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nivel Académico</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.nivel_academico || 'No registrado'}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cod. Nivel Académico</p>
                  <p className={`font-medium text-blue-600`}>{selectedEmployee.cod_cargo || 'No asignado'}</p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Ingreso</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.fecha_ingreso ? new Date(selectedEmployee.fecha_ingreso).toLocaleDateString('es-VE') : 'No registrada'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estatus</p>
                  <span className={`px-3 py-1 rounded-full text-white text-sm font-medium inline-block ${estado.color}`}>
                    {estado.texto}
                  </span>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}> Años de Servicio</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.fecha_ingreso 
                      ? `${calcularAniosServicio(selectedEmployee.fecha_ingreso)} años`
                      : 'No registrada'}
                  </p>
                </div>
                <div>
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}> Turno</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.turno || 'No especificado'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}> Dependencia Actual</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.dependencia_actual || 'No especificada'}
                  </p>
                </div>
                <div className="col-span-2">
                  <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}> Dependencia Voucher</p>
                  <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                    {selectedEmployee.dependencia_voucher || 'No especificada'}
                  </p>
                </div>
              </div>
            </div>

            {/* Historial */}
            {mostrarHistorial && (
              <div className="mb-6">
                <h5 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700'}`}>
                  📜 Historial de Cambios
                </h5>
                {cargandoHistorial ? (
                  <div className="text-center py-8">
                    <span className="animate-spin inline-block text-2xl">⏳</span>
                    <p className={`mt-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cargando historial...</p>
                  </div>
                ) : historial.length === 0 ? (
                  <div className={`text-center py-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                    No hay registros en el historial de este empleado
                  </div>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {historial.map((item: any) => {
                      let icono = '📝';
                      let color = 'text-gray-500';
                      if (item.modulo === 'Personal') {
                        icono = '✏️';
                        color = 'text-blue-500';
                      } else if (item.modulo === 'Expedientes') {
                        icono = '📄';
                        color = 'text-green-500';
                      } else if (item.modulo === 'Reposos/Permisos') {
                        icono = '🩺';
                        color = 'text-purple-500';
                      }
                      return (
                        <div key={item.id} className={`border-b pb-3 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                          <div className="flex items-start gap-2">
                            <span className={`text-lg ${color}`}>{icono}</span>
                            <div className="flex-1">
                              <p className={`text-sm ${isDark ? 'text-gray-300' : 'text-gray-800'}`}>
                                <span className="font-semibold">{item.usuario_nombre || 'Sistema'}</span> {item.accion}
                              </p>
                              <p className={`text-xs mt-1 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
                                {item.fecha_formateada || new Date(item.fecha).toLocaleString('es-VE')}
                              </p>
                            </div>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* 📄 Documentos Obligatorios */}
<div className="mb-6">
  <h5 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700'}`}>
    📄 Documentos Obligatorios
  </h5>

  {/* Cédula (imagen) */}
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Cédula</span>
    <div className="flex items-center gap-2">
      {selectedEmployee.cedula_imagen ? (
        <>
          <a href={`${API_URL}${selectedEmployee.cedula_imagen}`} target="_blank">
            Ver
          </a>
          <button 
            onClick={() => inputCedulaRef.current?.click()}
            className="text-yellow-500 hover:text-yellow-600 text-sm"
          >
            Actualizar
          </button>
        </>
      ) : (
        <button 
          onClick={() => inputCedulaRef.current?.click()}
          className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          📤 Cargar
        </button>
      )}
      <input 
        ref={inputCedulaRef}
        type="file" 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && selectedEmployee) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo_documento', 'cedula_imagen');
            
            // 🔥 Obtener usuario desde sessionStorage
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            formData.append('usuario_id', user.id || '1');
            formData.append('usuario_nombre', user.nombre || 'Administrador');
            
            try {
              // ✅ CAMBIADO
              await api.post(
                `/api/personal/${selectedEmployee.id_personal}/documento-obligatorio`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              );
              toast.success('Cédula cargado exitosamente');
              fetchPersonal();
              if (selectedEmployee) {
                await fetchDocumentos(selectedEmployee.id_personal);
              }
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al cargar la cédula');
            }
            e.target.value = '';
          }
        }}
      />
      {selectedEmployee.cedula_imagen_fecha && (
        <span className="text-xs text-gray-400">{new Date(selectedEmployee.cedula_imagen_fecha).toLocaleDateString('es-VE')}</span>
      )}
    </div>
  </div>

  {/* RIF */}
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>RIF</span>
    <div className="flex items-center gap-2">
      {selectedEmployee.rif ? (
        <>
          <a href={`${API_URL}${selectedEmployee.rif}`} target="_blank" className="text-blue-500 hover:underline text-sm">
            Ver
          </a>
          <button 
            onClick={() => inputRifRef.current?.click()}
            className="text-yellow-500 hover:text-yellow-600 text-sm"
          >
            Actualizar
          </button>
        </>
      ) : (
        <button 
          onClick={() => inputRifRef.current?.click()}
          className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          📤 Cargar
        </button>
      )}
      <input 
        ref={inputRifRef}
        type="file" 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && selectedEmployee) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo_documento', 'rif');
            
            // 🔥 Obtener usuario desde sessionStorage
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            formData.append('usuario_id', user.id || '1');
            formData.append('usuario_nombre', user.nombre || 'Administrador');
            
            try {
              // ✅ CAMBIADO
              await api.post(
                `/api/personal/${selectedEmployee.id_personal}/documento-obligatorio`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              );
              toast.success('RIF cargado exitosamente');
              fetchPersonal();
              if (selectedEmployee) {
                await fetchDocumentos(selectedEmployee.id_personal);
              }
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al cargar el RIF');
            }
            e.target.value = '';
          }
        }}
      />
      {selectedEmployee.rif_fecha && (
        <span className="text-xs text-gray-400">{new Date(selectedEmployee.rif_fecha).toLocaleDateString('es-VE')}</span>
      )}
    </div>
  </div>

  {/* Recibo de Pago */}
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Recibo de Pago</span>
    <div className="flex items-center gap-2">
      {selectedEmployee.constancia_pago ? (
        <>
          <a href={`${API_URL}${selectedEmployee.constancia_pago}`} target="_blank" className="text-blue-500 hover:underline text-sm">
            Ver
          </a>
          <button 
            onClick={() => inputPagoRef.current?.click()}
            className="text-yellow-500 hover:text-yellow-600 text-sm"
          >
            Actualizar
          </button>
        </>
      ) : (
        <button 
          onClick={() => inputPagoRef.current?.click()}
          className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          📤 Cargar
        </button>
      )}
      <input 
        ref={inputPagoRef}
        type="file" 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && selectedEmployee) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo_documento', 'constancia_pago');
            
            // 🔥 Obtener usuario desde sessionStorage
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            formData.append('usuario_id', user.id || '1');
            formData.append('usuario_nombre', user.nombre || 'Administrador');
            
            try {
              // ✅ CAMBIADO
              await api.post(
                `/api/personal/${selectedEmployee.id_personal}/documento-obligatorio`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              );
              toast.success('Recibo de Pago cargado exitosamente');
              fetchPersonal();
              if (selectedEmployee) {
                await fetchDocumentos(selectedEmployee.id_personal);
              }
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al cargar el recibo de pago');
            }
            e.target.value = '';
          }
        }}
      />
      {selectedEmployee.constancia_pago_fecha && (
        <span className="text-xs text-gray-400">{new Date(selectedEmployee.constancia_pago_fecha).toLocaleDateString('es-VE')}</span>
      )}
    </div>
  </div>

  {/* Constancia de Ubicación */}
  <div className="flex justify-between items-center py-2 border-b border-gray-100 dark:border-gray-700">
    <span className={`font-medium ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Constancia de Ubicación</span>
    <div className="flex items-center gap-2">
      {selectedEmployee.constancia_ubicacion ? (
        <>
          <a href={`${API_URL}${selectedEmployee.constancia_ubicacion}`} target="_blank" className="text-blue-500 hover:underline text-sm">
            Ver
          </a>
          <button 
            onClick={() => inputUbicacionRef.current?.click()}
            className="text-yellow-500 hover:text-yellow-600 text-sm"
          >
            Actualizar
          </button>
        </>
      ) : (
        <button 
          onClick={() => inputUbicacionRef.current?.click()}
          className="bg-green-700 text-white px-3 py-1 rounded text-sm hover:bg-green-600"
        >
          📤 Cargar
        </button>
      )}
      <input 
        ref={inputUbicacionRef}
        type="file" 
        className="hidden" 
        accept=".pdf,.jpg,.jpeg,.png"
        onChange={async (e) => {
          const file = e.target.files?.[0];
          if (file && selectedEmployee) {
            const formData = new FormData();
            formData.append('archivo', file);
            formData.append('tipo_documento', 'constancia_ubicacion');
            
            // 🔥 Obtener usuario desde sessionStorage
            const user = JSON.parse(sessionStorage.getItem('user') || '{}');
            formData.append('usuario_id', user.id || '1');
            formData.append('usuario_nombre', user.nombre || 'Administrador');
            
            try {
              // ✅ CAMBIADO
              await api.post(
                `/api/personal/${selectedEmployee.id_personal}/documento-obligatorio`,
                formData,
                { headers: { 'Content-Type': 'multipart/form-data' } }
              );
              toast.success('Constancia de Ubicación cargado exitosamente');
              fetchPersonal();
              if (selectedEmployee) {
                await fetchDocumentos(selectedEmployee.id_personal);
              }
            } catch (error) {
              console.error('Error:', error);
              toast.error('Error al subir la constancia de ubicación');
            }
            e.target.value = '';
          }
        }}
      />
      {selectedEmployee.constancia_ubicacion_fecha && (
        <span className="text-xs text-gray-400">{new Date(selectedEmployee.constancia_ubicacion_fecha).toLocaleDateString('es-VE')}</span>
      )}
    </div>
  </div>
</div>

            {/* Documentos del Expediente */}
            <div className="mb-6">
              <div className="flex justify-between items-center mb-3">
                <h5 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>📄 Documentos del Expediente</h5>
                {isSuperAdmin && (
                  <button onClick={() => setShowUploadModal(true)} className="bg-green-600 text-white px-4 py-2 rounded-lg text-sm hover:bg-green-700 transition">
                    + Subir Documento
                  </button>
                )}
              </div>
              {documentos.length === 0 ? (
                <div className={`text-center py-4 rounded-lg ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
                  No hay documentos registrados
                </div>
              ) : (
                <div className="space-y-2">
                  {documentos.map((doc: any) => (
                    <div key={doc.id} className={`flex justify-between items-center border-b pb-2 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
                      <div>
                        <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{doc.tipo_documento}</p>
                        <p className={`text-xs ${isDark ? 'text-gray-400' : 'text-gray-400'}`}>{new Date(doc.fecha_subida).toLocaleDateString('es-VE')}</p>
                      </div>
                      <div className="flex gap-2">
                        <a href={`${API_URL}${doc.archivo_url}`} target="_blank" rel="noopener noreferrer" className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600">📥 Ver</a>
                        {isSuperAdmin && (
                          <button onClick={() => handleDeleteDocumento(doc.id)} className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600">🗑️ Eliminar</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="flex justify-end pt-4 border-t">
              <button onClick={closeModal} className="bg-gray-500 text-white px-6 py-2 rounded-lg hover:bg-gray-600">Cerrar</button>
            </div>
          </div>
        </div>
      </div>
    );
  })(),
  document.body
)}

      {showPreviewModal && previewFoto && ReactDOM.createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-portal-enter">
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => {
      setShowPreviewModal(false);
      setPreviewFoto(null);
      setFotoSeleccionada(null);
    }}></div>
    <div className={`relative rounded-2xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="text-center mb-4">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📷 Vista Previa de Foto
        </h3>
        <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
          ¿Deseas usar esta imagen como foto de perfil?
        </p>
      </div>
      
      {/* Vista previa de la imagen */}
      <div className="flex justify-center mb-4">
        <div className="w-40 h-40 rounded-full overflow-hidden border-4 border-blue-500 shadow-lg">
          <img 
            src={previewFoto} 
            alt="Vista previa" 
            className="w-full h-full object-cover"
          />
        </div>
      </div>
      
      <div className="flex gap-3">
        <button
          onClick={async () => {
            if (fotoSeleccionada && selectedEmployee) {
              await handleUploadFotoExpediente(fotoSeleccionada);
              setShowPreviewModal(false);
              setPreviewFoto(null);
              setFotoSeleccionada(null);
            }
          }}
          className="flex-1 bg-green-600 text-white py-2.5 rounded-lg hover:bg-green-700 transition font-medium"
          disabled={uploadingFoto}
        >
          {uploadingFoto ? '⏳ Subiendo...' : '✅ Subir Foto'}
        </button>
        <button
          onClick={() => {
            setShowPreviewModal(false);
            setPreviewFoto(null);
            setFotoSeleccionada(null);
          }}
          className="flex-1 bg-gray-300 text-gray-700 py-2.5 rounded-lg hover:bg-gray-400 transition dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500"
        >
          ❌ Cancelar
        </button>
      </div>
    </div>
  </div>,
  document.body
)}

{/* MODAL DE FOTO AMPLIADA */}
{showFotoAmpliada && selectedEmployee?.foto_url && ReactDOM.createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
    <div 
      className="fixed inset-0 bg-black/80 backdrop-blur-sm animate-backdrop" 
      onClick={() => setShowFotoAmpliada(false)}
    />
    <div className={`relative rounded-2xl shadow-2xl max-w-2xl w-full p-4 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <h3 className={`text-lg font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
          📸 Foto de {selectedEmployee.nombres} {selectedEmployee.apellidos}
        </h3>
        <button
  onClick={() => setShowFotoAmpliada(false)}
  className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-white hover:scale-110"
>
  ✖
</button>
      </div>
      <div className="flex justify-center">
        <img 
          src={`${API_URL}${selectedEmployee.foto_url}?t=${new Date().getTime()}`}
          alt="Foto de perfil"
          className="max-w-full max-h-[70vh] rounded-lg object-contain"
        />
      </div>
      <div className="text-center mt-4">
        <button
          onClick={() => setShowFotoAmpliada(false)}
          className="bg-blue-600 text-white px-6 py-2 rounded-lg hover:bg-blue-700 transition"
        >
          ❌ Cerrar
        </button>
      </div>
    </div>
  </div>,
  document.body
)}

      {showConfirmModal && ReactDOM.createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 animate-modal modal-content">
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm animate-backdrop" onClick={cancelDelete}></div>
    <div className={`relative rounded-xl shadow-2xl max-w-md w-full p-6 ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="flex justify-between items-center mb-4">
        <div className="text-5xl">⚠️</div>
        <button
          onClick={cancelDelete}
          className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center text-gray-700 dark:text-white hover:scale-110"
        >
          ✖
        </button>
      </div>
      <div className="text-center">
        <h3 className={`text-xl font-bold mb-2 ${isDark ? 'text-white' : 'text-gray-800'}`}>¿Eliminar documento?</h3>
        <p className={`mb-6 ${isDark ? 'text-gray-300' : 'text-gray-600'}`}>Esta acción no se puede deshacer.</p>
        <div className="flex gap-3">
          <button onClick={confirmDelete} className="flex-1 bg-red-500 text-white py-2 rounded-lg hover:bg-red-600">Eliminar</button>
          <button onClick={cancelDelete} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded-lg hover:bg-gray-400 dark:bg-gray-600 dark:text-white dark:hover:bg-gray-500">Cancelar</button>
        </div>
      </div>
    </div>
  </div>,
  document.body
)}

      {showUploadModal && ReactDOM.createPortal(
  <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 modal-portal-enter">
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
    <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
      <div className="border-b px-6 py-4">
        <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Subir Documento</h3>
        <button 
  onClick={() => setShowUploadModal(false)} 
  className="absolute top-3 right-3 w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 transition-all duration-200 flex items-center justify-center text-gray-600 dark:text-white hover:scale-110"
>
  ✖
</button>
      </div>
      <form onSubmit={handleUpload} className="p-6 space-y-4">
        <div>
          <label className="block mb-2">Tipo de documento</label>
          <select 
            className={`w-full p-2 border rounded focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              isDark 
                ? 'bg-gray-700 text-white border-gray-600' 
                : 'bg-white text-gray-800 border-gray-300'
            }`}
            value={uploadForm.tipo_documento} 
            onChange={(e) => setUploadForm({...uploadForm, tipo_documento: e.target.value})} 
            required
          >
            <option value="">Seleccione...</option>
            <option value="CV">Sintesis Curricular</option>
            <option value="Título">Título</option>
            <option value="asignacion">Asignacion de Funciones</option>
            <option value="Banco">Certificación Bancaria</option>
            <option value="Matrimonio">Partida de Matrimonio</option>
            <option value="Reposo">Reposo Médico</option>
            <option value="otro">Otro...</option>
          </select>
        </div>
        <div>
          <label className="block mb-2">Archivo</label>
          <input 
            type="file" 
            className="w-full p-2 border rounded" 
            accept=".pdf,.jpg,.jpeg,.png" 
            onChange={(e) => setUploadForm({...uploadForm, archivo: e.target.files?.[0] || null})} 
            required 
          />
        </div>
        <div className="flex gap-3">
          <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded">Subir</button>
          <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 bg-red-500 py-2 rounded">Cancelar</button>
        </div>
      </form>
    </div>
  </div>,
  document.body
)}
    </div>
  );
};

export default PersonalList;