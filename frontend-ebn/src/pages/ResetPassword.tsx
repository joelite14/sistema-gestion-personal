import { useState, useEffect, useRef } from 'react';
import { useNavigate, useSearchParams, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';

const ResetPassword = () => {
  const [searchParams] = useSearchParams();
  const token = searchParams.get('token');
  const navigate = useNavigate();
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [validToken, setValidToken] = useState<boolean | null>(null);
  const [showPassword, setShowPassword] = useState(false);
  
  const confirmInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (!token) {
      setValidToken(false);
    } else {
      setValidToken(true);
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (newPassword.length < 6) {
      toast.error('La contraseña debe tener al menos 6 caracteres');
      return;
    }

    if (newPassword !== confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }

    setLoading(true);
    try {
      await axios.post('http://localhost:3000/api/auth/reset-password', {
        token,
        newPassword
      });
      toast.success('Contraseña actualizada exitosamente');
      setTimeout(() => navigate('/login'), 2000);
    } catch (error: any) {
      toast.error(error.response?.data?.message || 'Error al restablecer la contraseña');
    } finally {
      setLoading(false);
    }
  };

  if (validToken === null) {
    return (
      <div 
        className="min-h-screen w-full flex overflow-hidden bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/fondo.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="w-full flex items-center justify-center">
          <div className="bg-black/80 rounded-xl p-8 text-center">
            <div className="animate-spin text-4xl">⏳</div>
            <p className="text-white mt-4">Verificando enlace...</p>
          </div>
        </div>
      </div>
    );
  }

  if (!validToken) {
    return (
      <div 
        className="min-h-screen w-full flex overflow-hidden bg-center bg-cover bg-no-repeat"
        style={{ backgroundImage: "url('/fondo.jpeg')" }}
      >
        <div className="absolute inset-0 bg-black/50" />
        <div className="w-full flex items-center justify-center">
          <div className="bg-black/80 rounded-xl p-8 text-center max-w-md">
            <div className="text-6xl mb-4">⛔</div>
            <h2 className="text-white text-xl font-bold">Enlace inválido</h2>
            <p className="text-gray-400 text-sm mt-2">
              El enlace de recuperación no es válido o ha expirado.
            </p>
            <Link
              to="/forgot-password"
              className="mt-6 inline-block px-4 py-2 rounded-lg text-sm font-medium bg-blue-600 text-white hover:bg-blue-700 transition"
            >
              Solicitar nuevo enlace
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="min-h-screen w-full flex overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/fondo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/50 pointer-events-none" />
      
      <div className="relative z-10 w-full flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md bg-black/80 rounded-xl p-8">
          <div className="text-center mb-8">
            <div className="text-5xl mb-4">🔑</div>
            <h2 className="text-white text-3xl font-bold">Nueva Contraseña</h2>
            <p className="text-gray-400 text-sm mt-2">
              Ingresa tu nueva contraseña.
            </p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="text-white block mb-2 text-sm">
                Nueva Contraseña
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  required
                  className="w-full p-3 rounded-md bg-white outline-none text-black font-semibold pr-12"
                  placeholder="Mínimo 6 caracteres"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-700 text-xl"
                >
                  {showPassword ? '🔒' : '🔓'}
                </button>
              </div>
            </div>

            <div className="relative z-20">
              <label className="text-white block mb-2 text-sm">
                Confirmar Contraseña
              </label>
              <input
                ref={confirmInputRef}
                type="password"
                required
                className="w-full p-3 rounded-md bg-white outline-none text-black font-semibold relative z-20"
                placeholder="Repite tu nueva contraseña"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-green-600 hover:bg-green-700 text-white py-3 rounded-md font-bold transition disabled:opacity-50 relative z-20"
            >
              {loading ? '⏳ Actualizando...' : '✅ Actualizar Contraseña'}
            </button>

            <div className="text-center">
              <Link
                to="/login"
                className="text-sm text-gray-400 hover:text-gray-300 transition relative z-20"
              >
                ← Volver al inicio de sesión
              </Link>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResetPassword;