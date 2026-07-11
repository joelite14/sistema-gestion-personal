import { Navigate } from 'react-router-dom';

// Definimos qué necesita el portero para trabajar
interface Props {
  children: JSX.Element; // La página que queremos proteger (el Dashboard)
  allowedRoles?: string[]; // Qué roles tienen permiso (super_admin, admin)
}

const ProtectedRoute = ({ children, allowedRoles }: Props) => {
  const userRole = sessionStorage.getItem('userRole');

  // Si el usuario NO está logueado (no hay rol en el storage)
  if (!userRole) {
    return <Navigate to="/" replace />;
  }

  // Si el usuario está logueado pero NO tiene el rol permitido
  if (allowedRoles && !allowedRoles.includes(userRole)) {
    return <Navigate to="/" replace />;
  }

  // Si todo está bien, lo dejamos pasar al Dashboard
  return children;
};

export default ProtectedRoute;