import { Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from 'react-hot-toast'; // 👈 Importar Toaster
import Login from './Login';
import Home from './pages/home';
import PersonalList from './pages/PersonalList';
import Configuracion from './pages/Configuracion';
import Reportes from './pages/Reportes';
import ProtectedRoute from './ProtectedRoute';
import Layout from './components/Layout';
import ForgotPassword from './pages/ForgotPassword';
import ResetPassword from './pages/ResetPassword';

function App() {
  return (
    <>
      {/* 👇 Configuración de Toast Notifications */}
      <Toaster
        position="top-right"
        reverseOrder={false}
        toastOptions={{
          duration: 3000,
          style: {
            background: '#363636',
            color: '#fff',
            borderRadius: '10px',
            padding: '12px 16px',
            fontSize: '14px',
          },
          success: {
            duration: 3000,
            iconTheme: {
              primary: '#10B981',
              secondary: '#fff',
            },
          },
          error: {
            duration: 4000,
            iconTheme: {
              primary: '#EF4444',
              secondary: '#fff',
            },
          },
        }}
      />
      
      <Routes>
        <Route path="/" element={<Login />} />
        <Route path="/login" element={<Login />} />
        
        <Route path="/home" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Layout>
              <Home />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/forgot-password" element={<ForgotPassword />} />
<Route path="/reset-password" element={<ResetPassword />} />
        
        <Route path="/personal" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Layout>
              <PersonalList />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/reportes" element={
          <ProtectedRoute allowedRoles={['admin', 'superadmin']}>
            <Layout>
              <Reportes />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="/configuracion" element={
          <ProtectedRoute allowedRoles={['superadmin']}>
            <Layout>
              <Configuracion />
            </Layout>
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/home" />} />
      </Routes>
    </>
  );
}

export default App;