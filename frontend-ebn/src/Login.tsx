import { useState, useEffect, useRef } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import { fetchApi } from './services/api'; 

const Login = () => {
  const [isVisible, setIsVisible] = useState(false);
  const [cedula, setCedula] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  
  const navigate = useNavigate();
  const cedulaRef = useRef<HTMLInputElement>(null);

  useEffect(() => { 
    setIsVisible(true);
    cedulaRef.current?.focus();
  }, []);

  const handleLogin = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  
  try {
    // ✅ Ahora usa la URL dinámica desde el archivo api.ts
    const response = await fetchApi('/api/login', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ cedula, password })
    });

    const data = await response.json();

      if (data.success) {
        sessionStorage.setItem('user', JSON.stringify({
          id: data.user.id,
          nombre: data.user.nombre,
          usuario: data.user.usuario || data.user.nombre,
          rol: data.user.rol
        }));
        
        sessionStorage.setItem('userRole', data.user.rol);
        sessionStorage.setItem('userName', data.user.nombre);
        sessionStorage.setItem('userId', data.user.id?.toString() || '');
        
        toast.success(`¡Bienvenido, ${data.user.nombre}!`);
        
        setTimeout(() => {
          if (data.user.rol === 'superadmin') {
            navigate('/dashboard-superadmin');
          } else {
            navigate('/home');
          }
        }, 500);
      } else {
        toast.error(data.message || 'Cédula o contraseña incorrectos');
      }
    } catch (error) {
      toast.error('Error de conexión con el servidor');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div 
      className="min-h-screen w-full flex overflow-hidden bg-center bg-cover bg-no-repeat"
      style={{ backgroundImage: "url('/fondo.jpeg')" }}
    >
      <div className="absolute inset-0 bg-black/50" />
      
      <div 
        className={`hidden md:flex md:w-1/2 relative items-center justify-center transition-all duration-1000 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : '-translate-x-full opacity-0'
        }`}
      >
        <div className="relative z-10 text-center text-white p-10">
          <h1 className="text-5xl lg:text-6xl font-bold">¡BIENVENIDO!</h1>
          <p className="mt-5 italic text-xl lg:text-2xl">
            "Oír o leer sin reflexionar, es una ocupación inútil..."
          </p>
        </div>
      </div>

      <div 
        className={`w-full md:w-1/2 bg-black/80 flex flex-col items-center justify-center p-6 sm:p-10 transition-all duration-1000 ease-out ${
          isVisible ? 'translate-x-0 opacity-100' : 'translate-x-full opacity-0'
        }`}
      >
        <div className="w-full max-w-md">
          <img 
            src="/logo.png" 
            alt="Logo" 
            className="w-24 h-24 sm:w-30 sm:h-30 mx-auto mb-4 object-contain" 
          />
          
          <h2 className="text-white text-3xl sm:text-4xl font-bold text-center mb-2">
            Iniciar Sesión
          </h2>
          <p className="text-gray-400 text-center mb-3">
            Ingresa tus datos para continuar.
          </p>
          
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="text-white block mb-1 text-sm sm:text-base">Cédula</label>
              <input 
                ref={cedulaRef}
                type="text" 
                required
                maxLength={10} 
                className="w-full p-3 sm:p-4 rounded-md bg-white outline-none text-black font-semibold" 
                value={cedula}
                onChange={(e) => {
                  const soloNumeros = e.target.value.replace(/\D/g, '');
                  setCedula(soloNumeros);
                }}
                placeholder="Ej: 12345678"
                disabled={loading}
              />
            </div>

            <div>
              <label className="text-white block mb-1 text-sm sm:text-base">Contraseña</label>
              <div className="relative">
                <input 
                  type={showPassword ? 'text' : 'password'} 
                  required 
                  className="w-full p-3 sm:p-4 rounded-md bg-white outline-none text-black font-semibold pr-12" 
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Contraseña"
                  disabled={loading}
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

            <button 
  type="submit" 
  disabled={loading}
  className="w-full bg-[#007bff] hover:bg-blue-700 text-white py-3 sm:py-4 
  rounded-md font-bold text-base sm:text-lg transition-colors shadow-lg disabled:opacity-50 
  disabled:cursor-not-allowed"
>
  {loading ? 'Verificando...' : 'Acceder'}
</button>

{/*  Enlace para recuperar contraseña */}
<div className="text-center mt-2">  {/* ← Cambiado de mt-6 a mt-2 */}
  <Link
    to="/forgot-password"
    className="text-sm text-gray-400 hover:text-gray-300 transition"
  >
    ¿Olvidaste tu contraseña?
  </Link>
</div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Login;