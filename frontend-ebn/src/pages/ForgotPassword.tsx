import { useState } from 'react';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import { API_URL } from '../services/api';

const ForgotPassword = () => {
  const [email, setEmail] = useState('');
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [showModal, setShowModal] = useState(false); // 

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast.error('Ingresa tu correo electrónico');
      return;
    }

    setLoading(true);
    setShowModal(true); // 

    try {
      await axios.post(`${API_URL}/api/auth/forgot-password`, { email });
      setSent(true);
      setShowModal(false); // 
      toast.success('Revisa tu correo para restablecer tu contraseña');
    } catch (error: any) {
      setShowModal(false); // 👈 OCULTAR MODAL
      toast.error(error.response?.data?.message || 'Error al enviar el correo');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/fondo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      
      <div className="relative z-10 w-full flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-black/80 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔐</div>
            <h2 className="text-white text-3xl font-bold">
              Recuperar Contraseña
            </h2>
            <p className="text-gray-400 text-sm mt-2">
              Ingresa tu correo electrónico y te enviaremos un enlace para restablecer tu contraseña.
            </p>
          </div>

          {sent ? (
            <div className="bg-green-900/50 text-green-300 p-4 rounded-lg text-center">
              <div className="text-4xl mb-3">📧</div>
              <p className="font-medium">¡Correo enviado!</p>
              <p className="text-sm mt-1">Revisa tu bandeja de entrada y sigue las instrucciones.</p>
              <Link
                to="/login"
                className="mt-4 inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
              >
                Volver al inicio de sesión
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="text-white block mb-2 text-sm">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  required
                  className="w-full p-3 rounded-md bg-white outline-none text-black font-semibold"
                  placeholder="ejemplo@correo.com"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  disabled={loading} // 👈 DESHABILITAR MIENTRAS CARGA
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className={`w-full py-3 rounded-md font-bold transition ${
                  loading 
                    ? 'bg-gray-600 text-gray-300 cursor-not-allowed' 
                    : 'bg-[#007bff] hover:bg-blue-700 text-white'
                }`}
              >
                {loading ? '⏳ Enviando...' : '📧 Enviar enlace de recuperación'}
              </button>

              <div className="text-center">
                <Link
                  to="/login"
                  className="text-sm text-gray-400 hover:text-gray-300 transition"
                >
                  ← Volver al inicio de sesión
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>

      {/* 🎯 MODAL DE PROCESANDO */}
      {showModal && (
        <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm"></div>
          <div className="relative rounded-2xl shadow-2xl max-w-sm w-full p-8 bg-white dark:bg-gray-800">
            <div className="text-center">
              <div className="flex justify-center mb-4">
                <div className="w-16 h-16 border-4 border-[#007bff] border-t-transparent rounded-full animate-spin"></div>
              </div>
              <h3 className="text-xl font-bold text-gray-800 dark:text-white mb-2">
                ⏳ Procesando solicitud...
              </h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Estamos verificando tu información y enviando el correo de recuperación.
              </p>
              <div className="mt-4 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                <div className="bg-[#007bff] h-2 rounded-full animate-pulse w-full"></div>
              </div>
              <p className="text-xs mt-2 text-gray-400 dark:text-gray-500">
                Por favor, no cierres esta ventana
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForgotPassword;