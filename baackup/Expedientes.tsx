import { useEffect, useState } from 'react';
import axios from 'axios';
import { useTheme } from '../context/ThemeContext';

const Expedientes = () => {
  const [personal, setPersonal] = useState<any[]>([]);
  const [filteredPersonal, setFilteredPersonal] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedEmployee, setSelectedEmployee] = useState<any>(null);
  const [documentos, setDocumentos] = useState<any[]>([]);
  const [showDocumentModal, setShowDocumentModal] = useState(false);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const [uploadForm, setUploadForm] = useState({ tipo_documento: '', archivo: null as File | null });
  
  const userRole = localStorage.getItem('userRole');
  const isSuperAdmin = userRole === 'superadmin';
  const { theme } = useTheme();
  const isDark = theme === 'dark';

  useEffect(() => {
    fetchPersonal();
  }, []);

  useEffect(() => {
    if (searchTerm === '') {
      setFilteredPersonal(personal);
    } else {
      const filtered = personal.filter((emp: any) =>
        emp.cedula?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.nombres?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        emp.apellidos?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredPersonal(filtered);
    }
  }, [searchTerm, personal]);

  const fetchPersonal = async () => {
    try {
      const response = await axios.get('http://localhost:3000/api/personal');
      setPersonal(response.data.data);
      setFilteredPersonal(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchDocumentos = async (personalId: number) => {
    try {
      const response = await axios.get(`http://localhost:3000/api/personal/${personalId}/documentos`);
      setDocumentos(response.data.data);
    } catch (error) {
      console.error('Error:', error);
    }
  };

  const openDocumentos = async (emp: any) => {
    setSelectedEmployee(emp);
    await fetchDocumentos(emp.id_personal);
    setShowDocumentModal(true);
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadForm.archivo) {
      alert('Seleccione un archivo');
      return;
    }

    const formData = new FormData();
    formData.append('tipo_documento', uploadForm.tipo_documento);
    formData.append('archivo', uploadForm.archivo);
    
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    formData.append('usuario_id', user.id || '1');
    formData.append('usuario_nombre', user.nombre || 'Administrador');

    try {
      await axios.post(`http://localhost:3000/api/personal/${selectedEmployee?.id_personal}/documentos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      alert('Documento subido exitosamente');
      setShowUploadModal(false);
      setUploadForm({ tipo_documento: '', archivo: null });
      fetchDocumentos(selectedEmployee!.id_personal);
    } catch (error) {
      console.error('Error:', error);
      alert('Error al subir documento');
    }
  };

  const handleDeleteDocumento = async (id: number) => {
    if (confirm('¿Eliminar este documento?')) {
      try {
        await axios.delete(`http://localhost:3000/api/documentos/${id}`);
        fetchDocumentos(selectedEmployee!.id_personal);
      } catch (error) {
        alert('Error al eliminar');
      }
    }
  };

  if (loading) return <div className={`text-center p-8 ${isDark ? 'text-white' : 'text-gray-800'}`}>Cargando...</div>;

  return (
    <div className="p-6">
      <h1 className={`text-2xl font-bold mb-6 ${isDark ? 'text-white' : 'text-gray-800'}`}>📁 Gestión de Expedientes</h1>

      {/* Buscador */}
      <div className="mb-6">
        <input
          type="text"
          placeholder="🔍 Buscar empleado por cédula, nombre o apellido..."
          className={`w-full p-3 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
            isDark 
              ? 'bg-gray-700 text-white border-gray-600 placeholder-gray-400' 
              : 'bg-white text-gray-800 border-gray-300'
          }`}
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
      </div>

      {/* Tabla de empleados */}
      <div className="overflow-x-auto rounded-lg">
        <table className={`min-w-full rounded-lg ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
          <thead className={`${isDark ? 'bg-gray-700' : 'bg-gray-800'} text-white`}>
            <tr>
              <th className="p-3 text-left">#</th>
              <th className="p-3 text-left">Cédula</th>
              <th className="p-3 text-left">Nombres</th>
              <th className="p-3 text-left">Apellidos</th>
              <th className="p-3 text-left">Cargo</th>
              <th className="p-3 text-left">Cod. Cargo</th>
              <th className="p-3 text-left">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredPersonal.length === 0 ? (
              <tr>
                <td colSpan={7} className={`text-center p-8 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  No se encontraron empleados
                </td>
              </tr>
            ) : (
              filteredPersonal.map((emp: any, index: number) => (
                <tr 
                  key={emp.id_personal} 
                  className={`border-b transition-colors cursor-pointer ${
                    isDark 
                      ? 'border-gray-700 hover:bg-gray-700' 
                      : 'border-gray-200 hover:bg-gray-50'
                  }`}
                  onClick={() => openDocumentos(emp)}
                >
                  <td className="p-3 text-center">{index + 1}</td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.cedula}</td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.nombres}</td>
                  <td className={`p-3 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>{emp.apellidos}</td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs ${
                      isDark 
                        ? 'bg-blue-900 text-blue-200' 
                        : 'bg-blue-100 text-blue-800'
                    }`}>
                      {emp.cargo}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className={`px-2 py-1 rounded-full text-xs font-mono ${
                      isDark 
                        ? 'bg-gray-600 text-gray-200' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {emp.cod_cargo || 'No asignado'}
                    </span>
                  </td>
                  <td className="p-3">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        openDocumentos(emp);
                      }}
                      className="bg-blue-500 text-white px-4 py-1 rounded text-sm hover:bg-blue-600 transition"
                    >
                      Ver Expediente
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Modal de documentos */}
      {showDocumentModal && selectedEmployee && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowDocumentModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto ${
            isDark ? 'bg-gray-800' : 'bg-white'
          }`}>
            <div className={`sticky top-0 border-b px-6 py-4 flex justify-between items-center ${
              isDark ? 'bg-gray-800 border-gray-700' : 'bg-white border-gray-200'
            }`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>
                Expediente de: {selectedEmployee.nombres} {selectedEmployee.apellidos}
              </h3>
              <button onClick={() => setShowDocumentModal(false)} className={`text-2xl ${isDark ? 'text-gray-400 hover:text-gray-200' : 'text-gray-400 hover:text-gray-600'}`}>✖</button>
            </div>
            
            <div className="p-6">
              {/* Información Personal */}
              <div className="mb-6">
                <h4 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                  Información Personal
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cédula</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.cedula}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Teléfono</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.telefono || 'No registrado'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Correo Electrónico</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.correo || 'No registrado'}</p>
                  </div>
                </div>
              </div>

              {/* Información Laboral */}
              <div className="mb-6">
                <h4 className={`text-lg font-semibold border-b pb-2 mb-3 ${isDark ? 'text-gray-300 border-gray-700' : 'text-gray-700 border-gray-200'}`}>
                  Información Laboral
                </h4>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cargo</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.cargo}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Cod. Cargo</p>
                    <p className="font-medium text-blue-600 font-bold">{selectedEmployee.cod_cargo || 'No asignado'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Nivel Académico</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.nivel_academico || 'No registrado'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Dependencia</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>{selectedEmployee.dependencia || 'No registrada'}</p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Fecha de Ingreso</p>
                    <p className={`font-medium ${isDark ? 'text-white' : 'text-gray-800'}`}>
                      {selectedEmployee.fecha_ingreso 
                        ? new Date(selectedEmployee.fecha_ingreso).toLocaleDateString('es-VE') 
                        : 'No registrada'}
                    </p>
                  </div>
                  <div>
                    <p className={`text-sm ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>Estatus</p>
                    <span className={`px-2 py-1 rounded-full text-white text-sm ${
                      selectedEmployee.estatus === 'Activo' ? 'bg-green-500' : 
                      selectedEmployee.estatus === 'Inactivo' ? 'bg-red-500' :
                      selectedEmployee.estatus === 'Permiso' ? 'bg-yellow-500' : 'bg-gray-500'
                    }`}>
                      {selectedEmployee.estatus}
                    </span>
                  </div>
                </div>
              </div>

              {/* Documentos */}
              <div className="border-t pt-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}">
                <div className="flex justify-between items-center mb-4">
                  <h4 className={`text-lg font-semibold ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Documentos del Expediente</h4>
                  {isSuperAdmin && (
                    <button
                      onClick={() => setShowUploadModal(true)}
                      className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 text-sm"
                    >
                      + Subir Documento
                    </button>
                  )}
                </div>
                
                {documentos.length === 0 ? (
                  <div className={`text-center py-8 rounded-lg ${isDark ? 'text-gray-400 bg-gray-700' : 'text-gray-500 bg-gray-50'}`}>
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
                          <a
                            href={`http://localhost:3000${doc.archivo_url}`}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="bg-blue-500 text-white px-3 py-1 rounded text-sm hover:bg-blue-600"
                          >
                            📥 Ver
                          </a>
                          {isSuperAdmin && (
                            <button
                              onClick={() => handleDeleteDocumento(doc.id)}
                              className="bg-red-500 text-white px-3 py-1 rounded text-sm hover:bg-red-600"
                            >
                              🗑️ Eliminar
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Modal de subida de documentos */}
      {showUploadModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setShowUploadModal(false)}></div>
          <div className={`relative rounded-xl shadow-2xl max-w-md w-full ${isDark ? 'bg-gray-800' : 'bg-white'}`}>
            <div className={`border-b px-6 py-4 ${isDark ? 'border-gray-700' : 'border-gray-200'}`}>
              <h3 className={`text-xl font-bold ${isDark ? 'text-white' : 'text-gray-800'}`}>Subir Documento</h3>
            </div>
            <form onSubmit={handleUpload} className="p-6 space-y-4">
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Tipo de documento</label>
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
                  <option value="Cédula">Cédula</option>
                  <option value="RIF">RIF</option>
                  <option value="Título">Título / Certificado</option>
                  <option value="Recibo">Recibo de Pago</option>
                  <option value="Contrato">Contrato de Trabajo</option>
                  <option value="Constancia">Constancia de Trabajo</option>
                  <option value="Certificado Médico">Certificado Médico</option>
                </select>
              </div>
              <div>
                <label className={`block mb-2 ${isDark ? 'text-gray-300' : 'text-gray-700'}`}>Archivo (PDF o imagen)</label>
                <input
                  type="file"
                  className={`w-full p-2 border rounded ${
                    isDark 
                      ? 'bg-gray-700 text-white border-gray-600' 
                      : 'bg-white text-gray-800 border-gray-300'
                  }`}
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => setUploadForm({...uploadForm, archivo: e.target.files?.[0] || null})}
                  required
                />
              </div>
              <div className="flex gap-3 pt-4">
                <button type="submit" className="flex-1 bg-green-600 text-white py-2 rounded hover:bg-green-700">Subir</button>
                <button type="button" onClick={() => setShowUploadModal(false)} className="flex-1 bg-gray-300 text-gray-700 py-2 rounded hover:bg-gray-400">Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Expedientes;